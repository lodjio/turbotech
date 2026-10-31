// Accor hotel content helpers (data from scripts/accor_ingest.py).
//   window.LODJ_ACCOR_INDEX   [code, name, city, countryCode, brand, stars] for every open hotel
//   data/accor/hotels/CC.json full card data for one country, loaded on demand
(function () {
  const ROOT = document.body.dataset.root || '';
  const INDEX = window.LODJ_ACCOR_INDEX || [];
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

  const countryName = (cc) => { try { return regionNames.of(cc); } catch (e) { return cc; } };
  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  // Compare city names ignoring spaces/punctuation ("Al Ula" = "Alula").
  const sameCity = (a, b) => norm(a).replace(/[^a-z0-9]/g, '') === norm(b).replace(/[^a-z0-9]/g, '');

  // Popular cities shown before the customer types (only those that have Accor hotels).
  const FEATURED_CITIES = ['Dubai|AE', 'Abu Dhabi|AE', 'Riyadh|SA', 'Jeddah|SA', 'Doha|QA', 'London|GB', 'Paris|FR', 'Istanbul|TR', 'Bangkok|TH', 'Singapore|SG'];

  const cities = (() => {
    const map = new Map();
    INDEX.forEach(([, , city, cc]) => {
      if (!city) return;
      const key = `${norm(city).replace(/[^a-z0-9]/g, '')}|${cc}`;
      const entry = map.get(key) || { city, cc, count: 0 };
      entry.count++;
      map.set(key, entry);
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  })();

  const countries = (() => {
    const counts = {};
    INDEX.forEach(([, , , cc]) => { counts[cc] = (counts[cc] || 0) + 1; });
    return Object.entries(counts).map(([cc, count]) => ({ cc, count, name: countryName(cc) }))
      .sort((a, b) => b.count - a.count);
  })();

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  window.LODJ_ACCOR = {
    countryName,
    norm,
    sameCity,

    photoUrl(code, id, size = '1024x768') {
      const c = code.toLowerCase();
      return `https://ota.ahstatic.com/media/${c}/${c}_${id}_p_${size}.jpg`;
    },

    // Dropdown options for the Stays search field: cities, countries and individual hotels.
    searchOptions() {
      return [
        ...cities.map(c => ({
          value: `${c.city}, ${countryName(c.cc)}`, main: c.city, sub: `${countryName(c.cc)} · ${plural(c.count, 'hotel')}`,
          tag: 'City', section: 'Cities', keys: [c.city, countryName(c.cc)],
          params: { city: c.city, cc: c.cc }, featured: FEATURED_CITIES.includes(`${c.city}|${c.cc}`)
        })),
        ...countries.map(c => ({
          value: c.name, main: c.name, sub: plural(c.count, 'hotel'), tag: 'Country', section: 'Countries',
          keys: [c.name, c.cc], params: { cc: c.cc }
        })),
        ...INDEX.map(([code, name, city, cc, brand]) => ({
          value: name, main: name, sub: `${brand} · ${city}, ${countryName(cc)}`, tag: 'Hotel', section: 'Hotels',
          keys: [name, brand], params: { hotel: code }
        }))
      ];
    },

    // Work out what the customer searched from the URL.
    // Structured params (hotel / city+cc / cc) come from the search form; a plain `to`
    // (e.g. "London" from a destination card) is matched against city and country names.
    resolve(params) {
      const hotel = params.get('hotel');
      if (hotel) {
        const h = INDEX.find(x => x[0] === hotel);
        if (h) return { kind: 'hotel', code: h[0], cc: h[3], city: h[2], label: h[1] };
      }
      const cc = params.get('cc');
      const city = params.get('city');
      if (cc && city) return { kind: 'city', cc, city, label: `${city}, ${countryName(cc)}` };
      if (cc) return { kind: 'country', cc, label: countryName(cc) };

      const to = params.get('to');
      if (!to) return null;
      const first = norm(to.split(',')[0]);
      const byHotel = INDEX.find(x => norm(x[1]) === norm(to));
      if (byHotel) return { kind: 'hotel', code: byHotel[0], cc: byHotel[3], city: byHotel[2], label: byHotel[1] };
      const byCity = cities.find(c => sameCity(c.city, first));
      if (byCity) return { kind: 'city', cc: byCity.cc, city: byCity.city, label: `${byCity.city}, ${countryName(byCity.cc)}` };
      const byCountry = countries.find(c => norm(c.name) === first || norm(c.name) === norm(to));
      if (byCountry) return { kind: 'country', cc: byCountry.cc, label: byCountry.name };
      // Last resort: hotels whose name contains the search (e.g. "Red Sea").
      const named = INDEX.filter(x => norm(x[1]).includes(norm(to)));
      if (named.length) return { kind: 'name', cc: named[0][3], codes: named.filter(x => x[3] === named[0][3]).map(x => x[0]), label: to };
      return { kind: 'none', label: to };
    },

    async loadCountry(cc) {
      const res = await fetch(`${ROOT}data/accor/hotels/${cc}.json`);
      if (!res.ok) throw new Error(`No hotel data for ${cc}`);
      return res.json();
    }
  };
})();
