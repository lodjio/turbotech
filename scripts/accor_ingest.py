#!/usr/bin/env python3
"""
Import Accor hotel content (HOD Repository) into lodj.io's Stays vertical.

Source:  https://repos.accor.com/ota/          (content.xml index + one OTA XML file per hotel)
Photos:  https://ota.ahstatic.com/media/<code lowercase>/ (public photo library, linked, not copied)

Writes:
  data/accor/index.js            every open hotel (code, name, city, country, brand, stars) for search
  data/accor/hotels/<CC>.json    full card data per country (description, address, amenities, photos)

Usage:  python3 scripts/accor_ingest.py [--limit N] [--country AE] [--workers 24]
Only the Python standard library is needed. Re-run any time to refresh (Accor updates content daily,
photos monthly). Per-hotel results are cached in .accor_cache/ so an interrupted run can resume.
"""
import argparse
import concurrent.futures as cf
import json
import os
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from html import unescape

REPO = 'https://repos.accor.com/ota/'
MEDIA = 'https://ota.ahstatic.com/media/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'accor')
CACHE = os.path.join(ROOT, '.accor_cache')

# OTA Hotel Amenity Codes (from Accor's Specification_OTAcodification.xls) grouped into
# the labels shown on hotel cards, in display order.
AMENITIES = [
    ('Pool', {'49', '54', '66', '71'}),
    ('Spa', {'84'}),
    ('Fitness', {'35', '48'}),
    ('Free Wi-Fi', {'179', '222'}),
    ('Restaurant', {'76'}),
    ('Bar', {'19', '165'}),
    ('Room service', {'2', '77'}),
    ('Parking', {'42', '53', '64', '68', '97', '184'}),
    ('Airport shuttle', {'41'}),
    ('Family friendly', {'193', '218'}),
    ('Pets allowed', {'224'}),
]

# Photo categories (Accor photo guide), in the order they should appear on a card.
# Accor recommends <code>_HO_00 as the main hotel photo.
PHOTO_ORDER = ['ho', 'ro', 'su', 'sw', 'rs', 'sp', 'ba', 'de', 'fi', 'sl', 'br']
MAX_PHOTOS = 8
TEST_BRANDS = {'HOTEL DE TEST'}


def fetch(url, tries=4, timeout=90):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'lodj.io content import'})
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return res.read()
        except Exception:
            if attempt == tries - 1:
                raise
            time.sleep(2 * (attempt + 1))


def strip_ns(root):
    for el in root.iter():
        if '}' in el.tag:
            el.tag = el.tag.split('}', 1)[1]
    return root


def read_index():
    root = strip_ns(ET.fromstring(fetch(REPO + 'content.xml')))
    hotels = []
    for h in root.find('hotels').findall('hotel'):
        if h.findtext('hotelStatus') != 'Open' or h.findtext('brandName') in TEST_BRANDS:
            continue
        hotels.append({
            'code': h.findtext('hotelCode'),
            'file': h.findtext('file'),
            'name': h.findtext('hotelName'),
            'brand': h.findtext('brandName'),
            'city': h.findtext('cityName'),
            'cc': h.findtext('countryCode'),
            'lat': h.findtext('latitude'),
            'lon': h.findtext('longitude'),
        })
    return hotels


def nice_case(s):
    """'DUBAI MARINA' -> 'Dubai Marina' (keeps short words like 'de' lowercase mid-name)."""
    if not s:
        return s
    if s != s.upper():
        return s.strip()
    small = {'de', 'du', 'la', 'le', 'les', 'des', 'of', 'the', 'and', 'en', 'sur', 'am', 'im', 'an', 'di', 'da', 'do'}
    words = s.strip().lower().split()
    return ' '.join(w if (i and w in small) else w[:1].upper() + w[1:] for i, w in enumerate(words))


def parse_hotel(xml_bytes):
    root = strip_ns(ET.fromstring(xml_bytes))
    c = root.find('.//HotelDescriptiveContent')
    info = c.find('HotelInfo')
    out = {'name': c.get('HotelName'), 'currency': c.get('CurrencyCode')}

    desc = None
    for t in info.findall('Descriptions/Description/Text'):
        if t.get('Language') == 'en' and (t.text or '').strip():
            desc = unescape(t.text.strip())
            break
    if desc:
        desc = re.sub(r'\s+', ' ', desc)
        if len(desc) > 420:
            desc = desc[:420].rsplit(' ', 1)[0].rstrip(',;:') + '…'
    out['desc'] = desc

    for a in c.iter('Address'):
        lines = [x.text.strip() for x in a.findall('AddressLine') if x.text and x.text.strip()]
        out['address'] = ', '.join(lines)
        out['cityName'] = nice_case(a.findtext('CityName'))
        break

    for award in c.iter('Award'):
        if award.get('Provider') == 'Local star rating':
            m = re.match(r'(\d)', award.get('Rating') or '')
            if m:
                out['stars'] = int(m.group(1))
            break

    pos = info.find('Position')
    if pos is not None and pos.get('Latitude'):
        out['lat'], out['lon'] = float(pos.get('Latitude')), float(pos.get('Longitude'))

    codes = {s.get('Code') for s in info.findall('Services/Service') if s.get('Code')}
    out['amenities'] = [label for label, group in AMENITIES if codes & group]
    return out


def list_photos(code):
    """Photo ids like 'ho_00' that exist in both card sizes (1024x768 + 346x260).
    Photo folders and file names use the lowercase hotel code (e.g. B9H1 -> b9h1/)."""
    code = code.lower()
    try:
        html = fetch(f'{MEDIA}{code}/', tries=3, timeout=60).decode('latin-1')
    except Exception:
        return []
    sizes = defaultdict(set)
    for m in re.finditer(rf'href="{re.escape(code)}_([a-z]+)_(\d\d)_p_(\d+x\d+)\.jpg"', html, re.I):
        sizes[(m.group(1).lower(), m.group(2))].add(m.group(3))
    usable = [k for k, s in sizes.items() if '1024x768' in s and '346x260' in s]
    rank = {cat: i for i, cat in enumerate(PHOTO_ORDER)}
    # Generic category first ('ho'), then sub-categories (e.g. 'rokga' ranks with 'ro').
    usable.sort(key=lambda k: (rank.get(k[0][:2], 99), len(k[0]), k[0], k[1]))
    picked, per_cat = [], defaultdict(int)
    for cat, num in usable:
        group = cat[:2]
        if per_cat[group] >= (3 if group == 'ho' else 1):
            continue
        per_cat[group] += 1
        picked.append(f'{cat}_{num}')
        if len(picked) >= MAX_PHOTOS:
            break
    return picked


def process(h):
    cache_file = os.path.join(CACHE, f"{h['code']}.json")
    if os.path.exists(cache_file):
        with open(cache_file) as f:
            return json.load(f)
    rec = {'code': h['code'], 'brand': nice_case(h['brand']), 'cc': h['cc'],
           'city': nice_case(h['city']), 'name': nice_case(h['name'])}
    try:
        detail = parse_hotel(fetch(REPO + h['file']))
        rec.update({k: v for k, v in detail.items() if v not in (None, '', [])})
    except Exception as e:
        rec['error'] = str(e)[:120]
    if h.get('lat') and 'lat' not in rec:
        rec['lat'], rec['lon'] = float(h['lat']), float(h['lon'])
    rec['city'] = rec.pop('cityName', None) or rec['city']
    rec['photos'] = list_photos(h['code'])
    with open(cache_file, 'w') as f:
        json.dump(rec, f)
    return rec


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--limit', type=int)
    ap.add_argument('--country', help='only this ISO country code, e.g. AE')
    ap.add_argument('--workers', type=int, default=24)
    args = ap.parse_args()

    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(os.path.join(OUT, 'hotels'), exist_ok=True)

    hotels = read_index()
    if args.country:
        hotels = [h for h in hotels if h['cc'] == args.country.upper()]
    if args.limit:
        hotels = hotels[:args.limit]
    print(f'{len(hotels)} open hotels to import', file=sys.stderr)

    results, done = [], 0
    with cf.ThreadPoolExecutor(args.workers) as pool:
        for rec in pool.map(process, hotels):
            results.append(rec)
            done += 1
            if done % 250 == 0:
                print(f'  {done}/{len(hotels)}', file=sys.stderr)

    results.sort(key=lambda r: (r['cc'], r['city'] or '', -(r.get('stars') or 0), r['name']))
    by_country = defaultdict(list)
    for r in results:
        r.pop('error', None)
        by_country[r['cc']].append(r)

    for cc, items in by_country.items():
        with open(os.path.join(OUT, 'hotels', f'{cc}.json'), 'w') as f:
            json.dump(items, f, ensure_ascii=False, separators=(',', ':'))

    # Compact index for search: [code, name, city, cc, brand, stars]
    index = [[r['code'], r['name'], r['city'], r['cc'], r['brand'], r.get('stars') or 0] for r in results]
    with open(os.path.join(OUT, 'index.js'), 'w') as f:
        f.write('// Generated by scripts/accor_ingest.py — do not edit by hand.\n')
        f.write(f'// {len(index)} open Accor hotels. Fields: [code, name, city, countryCode, brand, stars]\n')
        f.write('window.LODJ_ACCOR_INDEX = ')
        json.dump(index, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    missing_photos = sum(1 for r in results if not r['photos'])
    missing_desc = sum(1 for r in results if not r.get('desc'))
    print(f'Wrote {len(results)} hotels in {len(by_country)} countries '
          f'({missing_photos} without photos, {missing_desc} without description)', file=sys.stderr)


if __name__ == '__main__':
    main()
