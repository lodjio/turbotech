/* Saudia Hajj & Umrah demo on Logio — single-page app (hash routes).
   #/                 home
   #/plan/<j>         search form; j = flight | fh | fhv
   #/flights          Saudia flights (outbound + return)
   #/stay/makkah      Makkah hotels (Accor)
   #/stay/madinah     Samaa Al Haramain packages + Madinah hotels (Accor)
   #/visa             visa step (fhv only)
   #/review           review & send request
   #/done             confirmation (demo)
   Nothing is sent anywhere except the access-gate calls; state lives in sessionStorage. */
(() => {
  'use strict';

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sar = (n) => 'SAR ' + Math.round(n).toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  const DAY = 864e5;
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => iso(new Date(parse(s).getTime() + n * DAY));
  const nice = (s, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => parse(s).toLocaleDateString('en-GB', opts);
  const hash = (str) => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const km = (a, b) => { const R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  const plural = (n, w, p = w + 's') => `${n} ${n === 1 ? w : p}`;

  const I = {
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    bed: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
    passport: '<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    back: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="m9 20 3-6 3 3v4"/><path d="m6 12 3-4 4 1 3 3h3"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    swap: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    train: '<rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>'
  };
  const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

  // ---------- data ----------
  const ORIGINS = window.HU_ORIGINS, GW = window.HU_GATEWAYS, PKGS = window.HU_PACKAGES, NATS = window.HU_NATIONALITIES;
  const HOTELS = window.HU_HOTELS, WORTH = window.HU_WORTH;
  const TZ = { IN: 5.5, PK: 5, BD: 6, ID: 7, MY: 8, EG: 2, NG: 1, GB: 0, FR: 1, DE: 1, TR: 3, US: -5, AE: 4, KW: 3, SA: 3 };
  const origin = (code) => ORIGINS.find(o => o.code === code);
  const photo = (code, id, size = '1024x768') => `https://ota.ahstatic.com/media/${code.toLowerCase()}/${code.toLowerCase()}_${id}_p_${size}.jpg`;

  const JOURNEYS = {
    flight: { name: 'Flight', short: 'Flight', icons: ['plane'], text: 'Saudia and flyadeal flights to Jeddah or Madinah.', steps: ['plan', 'flights', 'review'] },
    fh: { name: 'Flight + Hotel', short: 'Flight + Hotel', icons: ['plane', 'bed'], text: 'Saudia or flyadeal flights with stays in Makkah, Madinah or both.', steps: ['plan', 'flights', 'makkah', 'madinah', 'review'] },
    fhv: { name: 'Flight + Hotel + Visa', short: 'Flight + Hotel + Visa', icons: ['plane', 'bed', 'passport'], text: 'Everything for your Umrah, with your visa submitted alongside.', steps: ['plan', 'flights', 'makkah', 'madinah', 'visa', 'review'] }
  };
  const STEP = {
    plan: ['Search', '#/plan/'], flights: ['Flights', '#/flights'], makkah: ['Makkah', '#/stay/makkah'],
    madinah: ['Madinah', '#/stay/madinah'], visa: ['Visa', '#/visa'], review: ['Review', '#/review']
  };

  // ---------- state ----------
  const today = iso(new Date());
  const fresh = (j = 'fhv') => ({
    j, from: 'KHI', to: 'JED', trip: 'return', cabin: 'Economy',
    depart: addDays(today, 21), ret: addDays(today, 28),
    makkahN: 3, madinahN: 2, order: 'makkah', cities: 'both', adults: 2, children: 0, nat: 'PK',
    out: null, back: null, makkah: null, madinah: null, visa: {}, ref: null
  });
  let S;
  try { S = JSON.parse(sessionStorage.getItem('hu_state')) || fresh(); } catch (e) { S = fresh(); }
  if (S.depart < today) S = fresh(S.j);
  const save = () => { try { sessionStorage.setItem('hu_state', JSON.stringify(S)); } catch (e) { /* private mode */ } };

  const hotelTrip = () => S.j !== 'flight';
  // Which holy cities this trip includes: both (open-jaw), Makkah only or Madinah only.
  const both = () => !S.cities || S.cities === 'both';
  const hasCity = (c) => both() || S.cities === c.toLowerCase();
  const cityList = () => ['Makkah', 'Madinah'].filter(hasCity);
  const otherCity = (c) => c === 'Makkah' ? 'Madinah' : 'Makkah';
  const firstCity = () => both() ? (S.order === 'makkah' ? 'Makkah' : 'Madinah') : cityList()[0];
  const gwOf = (c) => c === 'Makkah' ? 'JED' : 'MED';
  const inbound = () => hotelTrip() ? gwOf(firstCity()) : S.to;
  const outboundHome = () => hotelTrip() ? gwOf(both() ? otherCity(firstCity()) : firstCity()) : S.to;
  const totalNights = () => cityList().reduce((a, c) => a + cityNights(c), 0);
  const returnDate = () => hotelTrip() ? addDays(S.depart, totalNights()) : S.ret;
  const stepsOf = () => JOURNEYS[S.j].steps.filter(s => !(s === 'makkah' || s === 'madinah') || hasCity(s === 'makkah' ? 'Makkah' : 'Madinah'));
  const rooms = () => Math.ceil(S.adults / 2);
  const travellers = () => S.adults + S.children;
  const cityNights = (c) => c === 'Makkah' ? S.makkahN : S.madinahN;
  const cityDates = (c) => {
    const first = firstCity() === c || !both();
    const inD = first ? S.depart : addDays(S.depart, cityNights(firstCity()));
    return [inD, addDays(inD, cityNights(c))];
  };

  // ---------- Saudia flight generator (indicative demo schedules) ----------
  function flightsFor(fromCode, toCode, date) {
    const isOut = !!GW[toCode];
    const home = isOut ? origin(fromCode) : origin(toCode);
    const gw = GW[isOut ? toCode : fromCode];
    const dist = km(home, gw);
    const viaJed = gw.code === 'MED' && !window.HU_MED_NONSTOP.includes(home.code);
    const r = rng(hash(fromCode + toCode + date));
    const baseH = dist / 790 + 0.55;
    const slots = [2.25, 9.5, 15.75, 21.1].filter(() => r() > .22).slice(0, 3);
    if (slots.length < 2) slots.push(11.4, 19.2);
    const tzFrom = isOut ? TZ[home.cc] : 3, tzTo = isOut ? 3 : TZ[home.cc];
    const sv = slots.slice(0, 3).map((dep, i) => {
      dep = Math.round((dep + r() * 1.2) * 4) / 4;
      const legH = Math.round(baseH * 12) / 12;
      const lay = viaJed ? 1.5 + Math.round(r() * 4) / 4 : 0;
      const total = legH + (viaJed ? lay + 1.1 : 0);
      const arr = dep - tzFrom + total + tzTo;
      const fare = Math.round(((dist < 1200 ? 420 : 380) + dist * 0.3) * (0.88 + r() * 0.3) * (viaJed ? 1.08 : 1) / 10) * 10;
      const no = 'SV' + (300 + (hash(fromCode + toCode + i) % 600));
      return {
        id: `${fromCode}-${toCode}-${date}-${i}`, no, from: fromCode, to: toCode, date,
        dep: hhmm(dep), arr: hhmm(arr), plus: Math.floor(arr / 24), dur: dur(total),
        stops: viaJed ? `1 stop · ${isOut ? 'JED' : 'JED'} ${dur(lay)}` : 'Non-stop',
        fare, biz: Math.round(fare * 3.1 / 10) * 10,
        aircraft: dist > 3500 ? 'Boeing 787-10' : dist > 1800 ? 'Boeing 777-300ER' : 'Airbus A320neo',
        al: 'SV', tag: ''
      };
    });
    // flyadeal (Saudia Group low-cost airline): Guest cabin only, on routes within A320neo range.
    const fa = [];
    if (S.cabin !== 'Business' && dist < 4300) {
      [6.5, 18.4].forEach((dep, i) => {
        dep = Math.round((dep + r() * 1.5) * 4) / 4;
        const legH = Math.round((dist / 760 + 0.5) * 12) / 12;
        const lay = viaJed ? 1.75 + Math.round(r() * 4) / 4 : 0;
        const total = legH + (viaJed ? lay + 1.1 : 0);
        const arr = dep - tzFrom + total + tzTo;
        const fare = Math.round(((dist < 1200 ? 260 : 230) + dist * 0.2) * (0.9 + r() * 0.25) / 10) * 10;
        fa.push({
          id: `${fromCode}-${toCode}-${date}-F${i}`, no: 'F3 ' + (100 + (hash(toCode + fromCode + i) % 800)), from: fromCode, to: toCode, date,
          dep: hhmm(dep), arr: hhmm(arr), plus: Math.floor(arr / 24), dur: dur(total),
          stops: viaJed ? `1 stop · JED ${dur(lay)}` : 'Non-stop',
          fare, biz: fare, aircraft: 'Airbus A320neo', al: 'F3', tag: ''
        });
      });
    }
    return [...sv, ...fa]
      .sort((a, b) => a.dep.localeCompare(b.dep))
      .map((f, _, all) => (f.fare === Math.min(...all.map(x => x.fare)) ? { ...f, tag: 'Lowest fare' } : f));
  }
  const AIRLINES = {
    SV: { name: 'Saudia', mark: 'media/brand/saudia.png', bags: () => S.cabin === 'Business' ? '2 × 32 kg' : '2 × 23 kg', extra: true },
    F3: { name: 'flyadeal', mark: 'media/brand/flyadeal-mark.svg', bags: () => '7 kg cabin bag', extra: false }
  };
  const alOf = (f) => AIRLINES[f.al || 'SV'];
  const hhmm = (h) => { h = ((h % 24) + 24) % 24; const m = Math.round((h % 1) * 60); return `${pad(Math.floor(h) + (m === 60 ? 1 : 0))}:${pad(m === 60 ? 0 : m)}`; };
  const dur = (h) => `${Math.floor(h)}h ${pad(Math.round((h % 1) * 60))}m`;
  const fareOf = (f) => (S.cabin === 'Business' ? f.biz : f.fare);

  // Try the next Accor photo if one fails to load.
  window.HU_PH = (img) => {
    const list = (img.dataset.ph || '').split(',').filter(Boolean);
    const i = Number(img.dataset.i || 0) + 1;
    if (i < list.length) { img.dataset.i = i; img.src = photo(img.dataset.code, list[i]); } else img.style.visibility = 'hidden';
  };

  // ---------- pricing ----------
  function lines() {
    const L = [];
    const pax = travellers();
    const fl = [S.out, S.back].filter(Boolean);
    if (S.out) L.push({ k: 'flights', icon: 'plane', t: `${[...new Set(fl.map(f => alOf(f).name))].join(' & ')} flights · ${S.cabin === 'Business' ? 'Business' : 'Guest (Economy)'}`, s: fl.map(f => `${f.no} ${f.from}→${f.to} ${nice(f.date, { day: 'numeric', month: 'short' })}`).join(' · ') + ` · ${plural(pax, 'traveller')}`, a: fl.reduce((a, f) => a + fareOf(f), 0) * (S.adults + S.children * 0.75) });
    else L.push({ k: 'flights', icon: 'plane', t: 'Flights', s: 'Not chosen yet', pending: true });
    if (hotelTrip()) {
      cityList().forEach(c => {
        const key = c.toLowerCase(), sel = S[key];
        const [a, b] = cityDates(c);
        if (sel && sel.type === 'package') {
          const p = PKGS.find(x => x.id === sel.id);
          const amt = Math.floor(S.adults / 2) * p.price.double + (S.adults % 2) * p.price.single;
          L.push({ k: key, icon: 'bed', t: `Samaa Al Haramain · ${p.name}`, s: `${WORTH.name} · ${p.duration} · ${nice(a, { day: 'numeric', month: 'short' })}–${nice(b, { day: 'numeric', month: 'short' })}`, a: amt });
        } else if (sel) {
          const h = HOTELS.find(x => x.code === sel.code);
          L.push({ k: key, icon: 'bed', t: h.name, s: `${plural(cityNights(c), 'night')} · ${plural(rooms(), 'room')} · ${nice(a, { day: 'numeric', month: 'short' })}–${nice(b, { day: 'numeric', month: 'short' })}`, a: h.rate * cityNights(c) * rooms() });
        } else L.push({ k: key, icon: 'bed', t: `${c} stay`, s: `${plural(cityNights(c), 'night')} · not chosen yet`, pending: true });
      });
      if (both()) L.push({ k: 'rail', icon: 'train', t: `${firstCity()} → ${firstCity() === 'Makkah' ? 'Madinah' : 'Makkah'} transfer`, s: 'Haramain High Speed Railway, with hotel transfers', a: 0, incl: true });
    }
    if (S.j === 'fhv') {
      const n = NATS.find(x => x.cc === S.nat);
      const fee = n.path === 'agent' ? 300 * pax : 0;
      L.push({ k: 'visa', icon: 'passport', t: n.path === 'agent' ? 'Umrah visa, submitted for you' : n.path === 'evisa' ? 'Tourist eVisa guidance' : 'No visa needed', s: S.visa.done ? `${n.name} passports · ${plural(pax, 'traveller')}` : 'Details not added yet', a: fee, pending: !S.visa.done, incl: fee === 0 });
    }
    return L;
  }
  const total = () => lines().reduce((a, l) => a + (l.a || 0), 0);

  // ---------- greeting ----------
  let ME = { name: '', tier: 'VVIP Member' };
  fetch('api/me', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : null).then(j => {
    if (j && j.name) { ME = j; $$('[data-me]').forEach(el => el.textContent = j.name); }
  }).catch(() => {});

  // ---------- router ----------
  const main = $('#main');
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  window.addEventListener('hashchange', render);

  function render() {
    const h = location.hash || '#/';
    const [, a, b] = h.split('/');
    document.body.classList.remove('in-flow', 'on-dark');
    $('#bar').hidden = true;
    $$('.hdr__nav a').forEach(x => x.toggleAttribute('aria-current', x.getAttribute('href') === h));
    let html;
    if (!a) html = home();
    else if (a === 'plan') { if (JOURNEYS[b] && b !== S.j) { const keep = { from: S.from, adults: S.adults, children: S.children, nat: S.nat }; S = { ...fresh(b), ...keep }; save(); } html = plan(); }
    else if (a === 'flights') html = guard('flights') || flightsView();
    else if (a === 'stay') html = guard(b) || stayView(b === 'makkah' ? 'Makkah' : 'Madinah');
    else if (a === 'visa') html = guard('visa') || visaView();
    else if (a === 'review') html = guard('review') || reviewView();
    else if (a === 'done') html = S.ref ? doneView() : home();
    else html = home();
    main.innerHTML = `<div class="view-enter">${html}</div>`;
    if (a && a !== 'done') document.body.classList.add('in-flow');
    window.scrollTo(0, 0);
    bind(a, b);
    reveal();
    onScroll();
  }

  // Steps must be done in order; jump back to the first missing one.
  function guard(step) {
    const steps = stepsOf();
    if (!steps.includes(step)) return null;
    for (const s of steps.slice(1, steps.indexOf(step))) {
      if (s === 'flights' && !(S.out && (S.trip === 'oneway' && !hotelTrip() || S.back))) { setTimeout(() => go('#/flights')); return ' '; }
      if ((s === 'makkah' || s === 'madinah') && !S[s]) { setTimeout(() => go('#/stay/' + s)); return ' '; }
      if (s === 'visa' && !S.visa.done) { setTimeout(() => go('#/visa')); return ' '; }
    }
    return null;
  }

  // ---------- home ----------
  function home() {
    return `
<section class="hero" aria-labelledby="hi">
  <img class="hero__img" src="media/img/departure-poster-1920.jpg" alt="A Saudia aircraft above the clouds at sunset" fetchpriority="high">
  <div class="hero__in">
    <div class="hero__brand"><img src="media/brand/samaa-al-haramain-white.png" alt="Samaa Al Haramain" width="96" height="59"><p>Saudia Hajj &amp; Umrah<br>Flight, hotel and visa</p></div>
    <span class="tier">${esc(ME.tier)}</span>
    <h1 id="hi" class="hi">Hayyakum, <span data-me>${esc(ME.name || 'Guest')}</span></h1>
    <p class="hero__lead">Your Umrah in one booking: Saudia and flyadeal flights, a stay steps from the Haram, and your visa, planned together.</p>
    <div class="hero__cta"><a class="btn btn--palm" href="#/plan/fhv">Let's book ${ic('arrow', 'i20')}</a><a class="btn btn--ghost" href="#journeys">Explore the journeys</a></div>
  </div>
</section>

<section class="sec" id="journeys">
  <div class="wrap">
    <div class="sec__head rv-in"><span class="label"><b>01</b><i></i>Choose your journey</span><h2 class="h2">Three ways to answer the call</h2><p class="lead">Start with a Saudia flight, add your stays in Makkah and Madinah, or let us handle the visa as well.</p></div>
    <div class="journeys">${Object.entries(JOURNEYS).map(([k, j], i) => `
      <a class="jcard rv-in ${k === 'fhv' ? 'jcard--hero' : ''}" href="#/plan/${k}">
        ${k === 'fhv' ? '<span class="jcard__new">New</span>' : ''}
        <span class="jcard__num">${i + 1}</span>
        <span><span class="jcard__icons">${j.icons.map(n => ic(n)).join('')}</span><h3>${j.name}</h3><p>${j.text}</p></span>
        <span class="jcard__go">${ic('arrow', 'i20')}</span>
      </a>`).join('')}
    </div>
  </div>
</section>

<section class="sec dark pattern why">
  <div class="wrap">
    <div class="sec__head rv-in">
      <span class="label"><b>02</b><i></i>Why it matters</span>
      <p class="talbiyah" lang="ar" dir="rtl">لبّيك اللهمّ لبّيك</p>
      <h2 class="h2">Answer the call.<br>We’ll carry the rest.</h2>
      <p class="lead">The journey to the House of Allah begins with a sincere intention, not a stack of paperwork. Saudia Hajj &amp; Umrah stands between you and no one: one trusted host, with no middlemen, from the moment you intend to travel until you return home with a heart at peace.</p>
    </div>
    <blockquote class="ayah rv-in"><p>“They will come to you on foot and on every lean camel, from every distant path.”</p><cite>Surah Al-Hajj · 22:27</cite></blockquote>
    <div class="compare">
      <div class="compare__col compare__col--today rv-in"><h3>The long road</h3><ol class="steps-list">
        <li>Searching for someone you can trust</li><li>Flights in one place, hotels in another</li><li>Chasing transport bookings and vouchers</li><li>Waiting on a visa, through someone else’s hands</li><li>Finding your own way to your permits</li></ol></div>
      <div class="compare__col compare__col--logio rv-in"><h3>The straight path</h3><ol class="steps-list">
        <li>Choose your Saudia or flyadeal flights</li><li>Pick your stay beside the Haram</li><li>Your visa goes in with your booking, with no middlemen</li><li>Arrive as our guest: Meet &amp; Greet, transfers and permits ready</li></ol></div>
    </div>
    <div class="stat-row rv-in"><div class="stat"><strong>1</strong><span>trusted host, from intention to return</span></div><div class="stat"><strong>0</strong><span>middlemen between you and your journey</span></div><div class="stat"><strong>2</strong><span>holy cities, one seamless itinerary</span></div></div>
    <p class="why__close rv-in">Your intention is yours. The arrangements are ours.</p>
  </div>
</section>

<section class="sec sec--sand">
  <div class="wrap">
    <div class="sec__head rv-in"><span class="label"><b>03</b><i></i>Hospitality</span><h2 class="h2">From your seat on board to your hotel suite</h2><p class="lead">Every Samaa Al Haramain package in Madinah includes the services below, from take-off to farewell.</p></div>
    <div class="hosp">
      <article class="hosp__item rv-in"><figure class="media"><img src="media/img/hosp-flight-coffee-900.webp" alt="A guest in his window seat, sipping Saudi coffee on board Saudia" loading="lazy"><figcaption>On board Saudia</figcaption></figure><span class="label"><b>01</b><i></i>The flight</span><h3>Under the umbrella of Saudia hospitality</h3><p class="muted">Available on selected Saudia flights. Terms and conditions apply.</p></article>
      <article class="hosp__item rv-in"><div class="onestop" aria-label="Saudia Hajj and Umrah: Saudia or flyadeal flights plus Saudia Holidays hotels">
        <img class="onestop__main" src="media/brand/hu-en-green.png" alt="Saudia Hajj &amp; Umrah" width="173" height="50">
        <div class="onestop__row">
          <span class="onestop__air"><img src="media/brand/saudia.png" alt="Saudia" width="56" height="70"><small>or</small><img class="onestop__fa" src="media/brand/flyadeal.svg" alt="flyadeal" width="96" height="33"></span>
          <span class="onestop__plus">+</span>
          <img class="onestop__sh" src="media/brand/saudia-holidays.png" alt="Saudia Holidays" width="120" height="44">
        </div>
        <span class="onestop__eq">One booking</span>
      </div><span class="label"><b>02</b><i></i>One stop</span><h3>Every flight and every stay, in one place</h3><p class="muted">We bring together Saudia and flyadeal flights with Saudia Holidays hotels, so your whole journey is as easy as it should be.</p><ul class="check"><li>Saudia and flyadeal flights</li><li>Saudia Holidays hotels in Makkah and Madinah</li><li>One booking, one payment, one point of contact</li></ul></article>
      <article class="hosp__item rv-in"><figure class="media"><img src="media/img/hosp-care-900.webp" alt="The reception desk at Peninsula Worth Hotel" loading="lazy"><figcaption>Reception, around the clock</figcaption></figure><span class="label"><b>03</b><i></i>Care</span><h3>Guest Experience Consultant</h3><p class="muted">Our team tailors your itinerary around:</p><div class="chips"><span class="chip chip--palm">Flight times</span><span class="chip chip--palm">Prayer times and mosque visits</span><span class="chip chip--palm">Madinah experiences</span><span class="chip chip--palm">Weather conditions</span></div></article>
    </div>
  </div>
</section>

<section class="sec dark dark--deep">
  <div class="wrap">
    <div class="sec__head rv-in"><span class="label"><b>04</b><i></i>Discover Madinah</span><h2 class="h2">The joy of discovering Madinah</h2><p class="lead">Every route is led by a qualified guide, licensed by the Ministry of Tourism, in your language.</p></div>
    <div class="rail">${window.HU_DISCOVER.map(d => `
      <article class="dcard"><figure class="media"><img src="media/img/${d.img}.webp" alt="${esc(d.name)}" loading="lazy"></figure><div class="dcard__b"><small>${esc(d.cat)}</small><h3>${esc(d.name)}</h3><p>${esc(d.text)}</p></div></article>`).join('')}
    </div>
  </div>
</section>

<section class="sec dark pattern close">
  <div class="wrap">
    <div class="arch rv-in"><img src="media/img/close-sunrise-m-651.webp" alt="Sunrise over the minarets and Green Dome of the Prophet's Mosque" loading="lazy"></div>
    <span class="label rv-in"><b>05</b><i></i>Until we welcome you</span>
    <h2 class="h2 rv-in">Your spiritual journey begins here</h2>
    <p class="lead rv-in">Choose the journey designed for your comfort, and let Saudia Hajj &amp; Umrah take care of every arrangement, from take-off to farewell.</p>
    <a class="btn btn--sand rv-in" href="#/plan/fhv">Tailor your journey</a>
  </div>
</section>`;
  }

  // ---------- shared flow chrome ----------
  function stepper(now) {
    const steps = stepsOf(), idx = steps.indexOf(now);
    return `<ol class="stepper" aria-label="Booking steps">${steps.map((s, i) => {
      const [label, href] = STEP[s];
      const cls = i < idx ? 'is-done' : i === idx ? 'is-now' : '';
      const inner = `<span>${i < idx ? '✓' : i + 1}</span>${label}`;
      return `<li class="${cls}" ${i === idx ? 'aria-current="step"' : ''}>${i < idx ? `<a href="${s === 'plan' ? href + S.j : href}">${inner}</a>` : inner}</li>`;
    }).join('')}</ol>`;
  }
  function title(kicker, h, sub) {
    return `<div class="flow__title"><span class="label">${kicker}</span><h1>${h}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div>`;
  }
  function summary(btnLabel, btnId) {
    const L = lines();
    return `<aside class="flow__aside"><div class="sum"><div class="sum__card">
      <div class="sum__head"><small>Your journey</small><h3>${JOURNEYS[S.j].name}</h3></div>
      <ul class="sum__list">${L.map(l => `<li class="${l.pending ? 'pending' : ''}">${ic(l.icon)}<span><b>${esc(l.t)}</b><small>${esc(l.s)}</small></span><em>${l.pending ? '' : l.incl ? 'Included' : sar(l.a)}</em></li>`).join('')}</ul>
      <div class="sum__total"><span>Total<small>${plural(travellers(), 'traveller')} · indicative</small></span><strong>${sar(total())}</strong></div>
      ${btnLabel ? `<div class="sum__btn"><button class="btn btn--royal btn--block" type="button" data-next="${btnId}">${btnLabel}</button></div>` : ''}
    </div></div></aside>`;
  }
  function bar(label, btn, enabled, onClick) {
    const b = $('#bar'); b.hidden = false;
    $('#barLabel').textContent = label;
    $('#barTotal').textContent = sar(total());
    const button = $('#barBtn');
    button.textContent = btn; button.disabled = !enabled; button.onclick = onClick;
    $$('[data-next]').forEach(x => { x.disabled = !enabled; x.onclick = onClick; });
  }
  const nextStep = (now) => { const st = stepsOf(); const n = st[st.indexOf(now) + 1]; return n === 'plan' ? '#/plan/' + S.j : STEP[n][1]; };

  // ---------- plan (search) ----------
  function plan() {
    const j = JOURNEYS[S.j], o = origin(S.from);
    const tabs = `<div class="seg" role="group" aria-label="Journey">${Object.entries(JOURNEYS).map(([k, x]) => `<button type="button" data-j="${k}" aria-pressed="${k === S.j}">${x.short}</button>`).join('')}</div>`;
    const stepperRow = (id, label, sub, val, min, max) => `<div class="stepperIn"><span><strong>${label}</strong><small>${sub}</small></span><span class="stepperIn__c"><button type="button" data-dec="${id}" ${val <= min ? 'disabled' : ''} aria-label="Fewer ${label}">−</button><output id="o-${id}">${val}</output><button type="button" data-inc="${id}" ${val >= max ? 'disabled' : ''} aria-label="More ${label}">+</button></span></div>`;
    return `
<section class="flow"><div class="wrap">
  ${stepper('plan')}
  ${title(`<b>${j.icons.length}</b><i></i>${j.name}`, S.j === 'flight' ? 'Where would you like to fly?' : 'Plan your Umrah', S.j === 'flight' ? 'Saudia and flyadeal flights to the gateways of the two holy cities.' : (both() ? 'Fly into one holy city, travel on by train, and fly home from the other.' : `A Saudia flight to ${GW[inbound()].city} and your stay in ${firstCity()}.`))}
  <div class="flow__grid"><div>
    <div class="panel" style="padding:8px">${tabs}</div>
    <form class="panel form" id="planForm" novalidate>
      <label class="field" id="fromField"><span>Flying from</span>
        <input class="input" id="from" value="${o ? esc(`${o.city} (${o.code})`) : ''}" autocomplete="off" placeholder="City or airport" aria-autocomplete="list" aria-controls="acList">
        <div class="ac" id="acList" role="listbox"></div>
      </label>
      ${S.j === 'flight' ? `
      <div class="field"><span>Flying to</span><div class="seg" role="group">${Object.values(GW).map(g => `<button type="button" data-to="${g.code}" aria-pressed="${S.to === g.code}">${g.city} (${g.code})</button>`).join('')}</div></div>
      <div class="field"><span>Trip</span><div class="seg" role="group"><button type="button" data-trip="return" aria-pressed="${S.trip === 'return'}">Return</button><button type="button" data-trip="oneway" aria-pressed="${S.trip === 'oneway'}">One way</button></div></div>
      <div class="row2"><label class="field"><span>Depart</span><input class="input" type="date" id="depart" min="${today}" value="${S.depart}"></label>
      ${S.trip === 'return' ? `<label class="field"><span>Return</span><input class="input" type="date" id="ret" min="${S.depart}" value="${S.ret}"></label>` : '<span></span>'}</div>` : `
      <div class="field"><span>Destination</span><div class="seg" role="group" aria-label="Destination">${[['both', 'Makkah + Madinah'], ['makkah', 'Makkah only'], ['madinah', 'Madinah only']].map(([k, l]) => `<button type="button" data-cities="${k}" aria-pressed="${(S.cities || 'both') === k}">${l}</button>`).join('')}</div></div>
      ${both() ? `<div class="field"><span>Your route</span>
        <div class="route"><span><b>${firstCity()}</b><small>Fly into ${inbound()}</small></span><button type="button" class="btn btn--line btn--sm" id="swap" aria-label="Start in the other city">${ic('swap', 'i18')}</button><span style="text-align:end"><b>${firstCity() === 'Makkah' ? 'Madinah' : 'Makkah'}</b><small>Fly home from ${outboundHome()}</small></span></div>
      </div>` : `<div class="field"><span>Your route</span><div class="route"><span><b>${firstCity()}</b><small>Fly into ${inbound()}</small></span><span class="route__mid">${ic('plane', 'i18')}</span><span style="text-align:end"><b>Return</b><small>Fly home from ${outboundHome()}</small></span></div></div>`}
      <label class="field"><span>Arrival date</span><input class="input" type="date" id="depart" min="${today}" value="${S.depart}"></label>
      <div class="field"><span>Nights</span><div>${hasCity('Makkah') ? stepperRow('makkahN', 'Makkah', 'Near Masjid al-Haram', S.makkahN, 1, 14) : ''}${hasCity('Madinah') ? stepperRow('madinahN', 'Madinah', 'Near Al-Masjid an-Nabawi', S.madinahN, 1, 14) : ''}</div>
        <p class="fine">Home on ${nice(returnDate(), { weekday: 'long', day: 'numeric', month: 'long' })} · ${plural(totalNights(), 'night')}${both() ? ' in total' : ''}</p></div>`}
      <div class="field"><span>Travellers</span><div>${stepperRow('adults', 'Adults', '12 years and over', S.adults, 1, 9)}${stepperRow('children', 'Children', '2 to 11 years', S.children, 0, 6)}</div></div>
      ${S.j === 'fhv' ? `<label class="field"><span>Passport nationality</span><select id="nat">${NATS.map(n => `<option value="${n.cc}" ${n.cc === S.nat ? 'selected' : ''}>${n.name}</option>`).join('')}</select></label>` : ''}
      <div class="field"><span>Cabin</span><div class="seg" role="group"><button type="button" data-cabin="Economy" aria-pressed="${S.cabin === 'Economy'}">Guest (Economy)</button><button type="button" data-cabin="Business" aria-pressed="${S.cabin === 'Business'}">Business</button></div></div>
      <p class="msg-err" id="planErr" role="alert"></p>
      <button class="btn btn--royal btn--block" type="submit">Let's book ${ic('arrow', 'i20')}</button>
    </form>
  </div>
  <aside class="flow__aside"><div class="sum"><div class="sum__card"><div class="sum__head"><small>Saudia Hajj &amp; Umrah</small><h3>Hayyakum, <span data-me>${esc(ME.name || 'Guest')}</span></h3></div>
    <ul class="sum__list">${j.icons.map(n => `<li>${ic(n)}<span><b>${n === 'plane' ? 'Saudia and flyadeal flights' : n === 'bed' ? 'Makkah and Madinah stays' : 'Visa submitted with your booking'}</b><small>${n === 'plane' ? 'Saudia Group airlines only' : n === 'bed' ? 'Saudia Holidays hotels and Samaa Al Haramain packages' : 'Nusuk-ready hotel and transport included'}</small></span><em></em></li>`).join('')}</ul></div></div></aside>
  </div>
</div></section>`;
  }

  // ---------- flights ----------
  let legTab = 'out', alF = 'all';
  function flightsView() {
    const oneway = !hotelTrip() && S.trip === 'oneway';
    if (oneway) legTab = 'out';
    const out = flightsFor(S.from, inbound(), S.depart);
    const back = oneway ? [] : flightsFor(outboundHome(), S.from, returnDate());
    const all = legTab === 'out' ? out : back;
    const list = all.filter(f => alF === 'all' || f.al === alF);
    const hasFa = all.some(f => f.al === 'F3');
    const chosen = legTab === 'out' ? S.out : S.back;
    const o = origin(S.from);
    const card = (f) => `
      <button type="button" class="fcard" data-f="${f.id}" aria-pressed="${chosen && chosen.id === f.id}">
        <span class="fcard__top"><img src="${alOf(f).mark}" alt="" width="26" height="26">${alOf(f).name} · ${f.no} · ${f.aircraft}${f.tag ? `<span class="chip chip--palm">${f.tag}</span>` : ''}</span>
        <span class="fcard__times"><span><strong>${f.dep}</strong><small>${f.from}</small></span><span class="fcard__line"><i></i>${f.dur}<br>${f.stops}</span><span style="text-align:end"><strong>${f.arr}${f.plus ? `<sup>+${f.plus}</sup>` : ''}</strong><small>${f.to}</small></span></span>
        <span class="fcard__bot"><span class="chips"><span class="chip">${S.cabin === 'Business' ? 'Business' : 'Guest'}</span><span class="chip">${alOf(f).bags()}</span>${hotelTrip() && alOf(f).extra ? '<span class="chip">Zamzam 5 L</span>' : ''}${!alOf(f).extra ? '<span class="chip">Bags from SAR 95</span>' : ''}</span><span class="fcard__fare"><small>per adult</small><strong>${sar(fareOf(f))}</strong></span></span>
      </button>`;
    return `
<section class="flow"><div class="wrap">
  ${stepper('flights')}
  ${title('<b>Saudia Group</b><i></i>Flights', `${o.city} ⇄ ${hotelTrip() ? (both() ? 'Jeddah · Madinah' : GW[inbound()].city) : GW[S.to].city}`, `${plural(travellers(), 'traveller')} · ${S.cabin === 'Business' ? 'Business' : 'Guest (Economy)'} · Indicative demo schedules`)}
  <div class="flow__grid"><div>
    ${oneway ? '' : `<div class="seg fltabs" role="tablist"><button type="button" role="tab" data-leg="out" aria-pressed="${legTab === 'out'}">${S.out ? '✓ ' : ''}${S.from} → ${inbound()} · ${nice(S.depart, { day: 'numeric', month: 'short' })}</button><button type="button" role="tab" data-leg="back" aria-pressed="${legTab === 'back'}">${S.back ? '✓ ' : ''}${outboundHome()} → ${S.from} · ${nice(returnDate(), { day: 'numeric', month: 'short' })}</button></div>`}
    ${hotelTrip() && both() && legTab === 'out' ? `<div class="notice" style="margin-bottom:14px">${ic('info')}<span>Open-jaw itinerary: fly into ${GW[inbound()].city} for ${firstCity()}, take the Haramain train, and fly home from ${GW[outboundHome()].city}. No backtracking.</span></div>` : ''}
    <div class="filters" role="group" aria-label="Airline">${[['all', 'All flights'], ['SV', 'Saudia'], ['F3', 'flyadeal']].map(([k, l]) => `<button type="button" data-al="${k}" aria-pressed="${alF === k}" ${k === 'F3' && !hasFa ? 'disabled' : ''}>${k !== 'all' ? `<img src="${AIRLINES[k].mark}" alt="" width="18" height="18" style="display:inline;vertical-align:-4px;margin-inline-end:6px">` : ''}${l}</button>`).join('')}</div>
    ${!hasFa ? `<p class="fine" style="margin:-6px 0 12px">${S.cabin === 'Business' ? 'flyadeal flies a single Guest cabin, so it shows with Guest (Economy) searches.' : 'flyadeal doesn\u2019t fly this route.'}</p>` : ''}
    <div class="fl">${list.map(card).join('')}</div>
  </div>${summary('Continue', 'flights')}</div>
</div></section>`;
  }

  // ---------- stays ----------
  let starF = 0;
  function stayView(city) {
    const key = city.toLowerCase();
    const [a, b] = cityDates(city);
    const list = HOTELS.filter(h => h.city === city && (!starF || h.stars === starF));
    const sel = S[key];
    const hcard = (h) => {
      const on = sel && sel.type === 'hotel' && sel.code === h.code;
      const walk = h.distance < 1500 ? `${Math.round(h.distance / 10) * 10} m to the Haram` : `${(h.distance / 1000).toFixed(1)} km to the Haram`;
      return `<article class="hcard ${on ? 'is-on' : ''}">
        <div class="hcard__ph"><img src="${photo(h.code, h.photos[0] || 'ho_00')}" alt="${esc(h.name)}" loading="lazy" data-ph="${h.photos.join(',')}" data-code="${h.code}" onerror="window.HU_PH(this)">${h.distance < 600 ? '<span class="chip">Steps from the Haram</span>' : ''}</div>
        <div class="hcard__b">
          <div>${h.stars ? `<span class="stars" aria-label="${h.stars} stars">${'★'.repeat(h.stars)}</span>` : ''}<h3>${esc(h.name)}</h3></div>
          <div class="hcard__meta"><span>${ic(h.distance < 1500 ? 'walk' : 'pin')}${walk}</span><span>${esc(h.brand)}</span></div>
          ${h.amenities.length ? `<div class="chips">${h.amenities.slice(0, 3).map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
          <div class="hcard__bot"><span class="hcard__price"><small>${plural(cityNights(city), 'night')} · ${plural(rooms(), 'room')}</small><strong>${sar(h.rate * cityNights(city) * rooms())}</strong></span>
          <button type="button" class="btn ${on ? 'btn--royal' : 'btn--line'} btn--sm" data-h="${h.code}" aria-pressed="${on}">${on ? '✓ Selected' : 'Select'}</button></div>
        </div></article>`;
    };
    const filters = `<div class="filters" role="group" aria-label="Filter by stars">${[0, 5, 4, 3].map(n => `<button type="button" data-star="${n}" aria-pressed="${starF === n}">${n ? n + ' stars' : 'All hotels'}</button>`).join('')}</div>`;
    return `
<section class="flow"><div class="wrap">
  ${stepper(key)}
  ${title(`<b>${!both() ? 'Your stay' : city === firstCity() ? 'First stop' : 'Second stop'}</b><i></i>${city}`, city === 'Makkah' ? 'Your stay near Masjid al-Haram' : 'Your stay in Madinah', `${nice(a)} – ${nice(b)} · ${plural(cityNights(city), 'night')} · ${plural(rooms(), 'room')} for ${plural(S.adults, 'adult')}${S.children ? ` and ${plural(S.children, 'child', 'children')}` : ''}`)}
  <div class="flow__grid"><div>
    ${city === 'Madinah' ? samaa() : ''}
    ${city === 'Madinah' ? '<h2 class="label" style="margin:8px 0 14px"><b>Or</b><i></i>Choose a hotel</h2>' : ''}
    ${filters}
    <div class="hgrid">${list.map(hcard).join('') || '<p class="muted">No hotels match this filter.</p>'}</div>
    <p class="fine" style="margin-top:14px">Saudia Holidays hotels (demo content from Accor). Distances are straight-line to the Haram; rates are indicative demo prices.</p>
  </div>${summary('Continue', key)}</div>
</div></section>`;
  }

  let pkgOpen = null;
  function samaa() {
    const sel = S.madinah && S.madinah.type === 'package' ? S.madinah.id : null;
    const cur = PKGS.find(p => p.id === (pkgOpen || sel)) || PKGS.find(p => p.nights === S.madinahN) || PKGS[1];
    pkgOpen = cur.id;
    const fits = cur.nights === S.madinahN;
    return `
<div class="samaa pattern">
  <div class="samaa__head"><img src="media/brand/samaa-al-haramain-white.png" alt="Samaa Al Haramain" width="86" height="53"><p>Saudia Hajj &amp; Umrah<br>Madinah packages</p></div>
  <h2>Design your experience</h2>
  <p>A stay at ${WORTH.name}, guided visits and VIP care, in one package.</p>
  <div class="pkgs" role="group" aria-label="Madinah packages">${PKGS.map((p, i) => `
    <button type="button" class="pkg" data-pkg="${p.id}" aria-pressed="${p.id === cur.id}"><span class="pkg__n">${i + 1}</span><span><strong>${p.name}</strong><small>${p.duration}</small></span><span class="pkg__p">from<b>${sar(p.price.double)}</b>for two</span></button>`).join('')}</div>
  <div class="pkgx">
    <div><div class="arch"><img src="media/img/${cur.img}-600.webp" alt="${esc(cur.caption)}" loading="lazy"></div><p class="fine" style="text-align:center;margin-top:8px">${esc(cur.caption)}</p></div>
    <div style="display:grid;gap:14px">
      <p style="color:rgba(255,255,255,.85)">${esc(cur.text)}</p>
      <ol class="stops" aria-label="Tour route: 8 guided stops">${cur.stops.map((s, i) => `<li><span>${i + 1}</span><img src="media/icons/${s[0]}.webp" alt="" loading="lazy"><span><b>${esc(s[1])}</b>${s[2] ? `<small>${esc(s[2])}</small>` : ''}</span></li>`).join('')}</ol>
      <div class="worth"><div class="worth__ph">${WORTH.images.map(x => `<img src="media/img/${x}.webp" alt="" loading="lazy">`).join('')}</div>
        <span class="stars">★★★★★</span><h3>${WORTH.name}</h3><ul class="check">${window.HU_PACKAGE_INCLUDES.slice(0, 6).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      ${fits
        ? `<button type="button" class="btn ${sel === cur.id ? 'btn--sand' : 'btn--palm'} btn--block" data-pick="${cur.id}">${sel === cur.id ? '✓ Package selected' : `Choose ${cur.name}`}</button>`
        : `<button type="button" class="btn btn--palm btn--block" data-pick="${cur.id}">Switch Madinah to ${plural(cur.nights, 'night')} and choose ${cur.name}</button><p class="fine">Your Madinah stay is ${plural(S.madinahN, 'night')}; this package is ${plural(cur.nights, 'night')}, so your flight home will be re-timed.</p>`}
      <p class="fine">Prices as published on saudia.com for two guests sharing; ${sar(cur.price.single)} for one. Subject to availability, terms and conditions. Visits to Al Rawdah Al Sharifah are booked through Nusuk.</p>
    </div>
  </div>
</div>`;
  }

  // ---------- visa ----------
  function visaView() {
    const n = NATS.find(x => x.cc === S.nat);
    const v = S.visa;
    const pax = travellers();
    let path;
    if (n.path === 'agent') path = `
      <div class="vpath vpath--agent"><span class="chip chip--palm vpath__tag">Umrah visa · submitted for you</span>
        <h3>${esc(n.name)} passports: we apply on your behalf</h3>
        <p class="muted">${esc(n.name)} nationals apply for the Umrah visa through a provider licensed by the Ministry of Hajj and Umrah. Your flights, Nusuk-approved hotels and registered transfers are already in this booking, so the application can go in straight away.</p>
        <ol class="timeline">
          <li class="done"><i>✓</i><span><b>Flights, hotels and transfers</b><small>Chosen in this booking and ready for Nusuk</small></span></li>
          <li class="now"><i>2</i><span><b>Passport details</b><small>For each traveller, below</small></span></li>
          ${n.bio ? '<li><i>3</i><span><b>Biometrics</b><small>Enrol through the Saudi Visa Bio app or a visa centre</small></span></li>' : ''}
          <li><i>${n.bio ? 4 : 3}</i><span><b>Visa issued</b><small>Sent to you by email with your e-ticket</small></span></li>
          <li><i>${n.bio ? 5 : 4}</i><span><b>Umrah and Rawdah permits</b><small>Booked in Nusuk for your dates</small></span></li>
        </ol></div>`;
    else if (n.path === 'evisa') path = `
      <div class="vpath"><span class="chip vpath__tag">Tourist eVisa</span><h3>${esc(n.name)} passports can use the tourist eVisa</h3>
        <p class="muted">The tourist eVisa allows Umrah outside the Hajj season. We'll send you the link with your booking, and book your Umrah and Rawdah permits in Nusuk for your dates.</p></div>`;
    else path = `
      <div class="vpath"><span class="chip vpath__tag">No visa needed</span><h3>${esc(n.name)} citizens travel without a visa</h3>
        <p class="muted">You only need your Umrah and Rawdah permits in Nusuk, which we book for your dates.</p></div>`;
    const need = n.path === 'agent';
    return `
<section class="flow"><div class="wrap">
  ${stepper('visa')}
  ${title('<b>New</b><i></i>Visa', 'Your visa, with your booking', `${plural(pax, 'traveller')} · ${esc(n.name)} passport${pax > 1 ? 's' : ''}`)}
  <div class="flow__grid"><div style="display:grid;gap:14px">
    <div class="panel" style="padding:12px"><label class="field"><span>Passport nationality</span><select id="vnat">${NATS.map(x => `<option value="${x.cc}" ${x.cc === S.nat ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label></div>
    ${path}
    <form class="panel form" id="visaForm" novalidate>
      <h2>Lead traveller</h2>
      <div class="notice">${ic('info')}<span>Demo: try it with sample details. Nothing you enter here is sent or stored.</span></div>
      <label class="field"><span>Full name, as in passport</span><input class="input" id="vName" value="${esc(v.name || ME.name || '')}" autocomplete="off"></label>
      <div class="row2"><label class="field"><span>Passport number</span><input class="input" id="vNo" value="${esc(v.no || '')}" autocomplete="off" placeholder="e.g. AB1234567"></label>
      <label class="field"><span>Passport expiry</span><input class="input" type="date" id="vExp" value="${esc(v.exp || '')}"></label></div>
      <label class="field"><span>Date of birth</span><input class="input" type="date" id="vDob" value="${esc(v.dob || '')}" max="${addDays(today, -365 * 12)}"></label>
      ${need ? `
      <label class="upload ${v.scan ? 'is-ok' : ''}" id="upScan">${ic(v.scan ? 'check' : 'upload')}<span><b>${v.scan ? 'Passport page added' : 'Add passport photo page'}</b><small>${v.scan ? 'Ready to submit' : 'Photo or PDF · stays on this device'}</small></span><input type="file" accept="image/*,application/pdf" class="sr" data-up="scan"></label>
      <label class="upload ${v.photo ? 'is-ok' : ''}" id="upPhoto">${ic(v.photo ? 'check' : 'upload')}<span><b>${v.photo ? 'Personal photo added' : 'Add a personal photo'}</b><small>${v.photo ? 'Ready to submit' : 'White background, face visible'}</small></span><input type="file" accept="image/*" capture="user" class="sr" data-up="photo"></label>
      <label class="tick"><input type="checkbox" id="vVacc" ${v.vacc ? 'checked' : ''}><span>I have, or will get, the meningitis vaccination certificate required for Umrah</span></label>` : ''}
      <label class="tick"><input type="checkbox" id="vNusuk" ${v.nusuk ? 'checked' : ''}><span>Book my Umrah and Rawdah permits in Nusuk for these dates</span></label>
      ${pax > 1 ? `<p class="fine">You'll add the other ${plural(pax - 1, 'traveller')} after this step in the live product.</p>` : ''}
      <p class="msg-err" id="visaErr" role="alert"></p>
      <p class="fine">Visa rules summarised for this demo from 2026 guidance; always confirm with the Ministry of Hajj and Umrah and Nusuk. ${need ? 'Indicative visa fee SAR 300 per traveller.' : ''}</p>
    </form>
  </div>${summary('Continue', 'visa')}</div>
</div></section>`;
  }

  // ---------- review & done ----------
  function reviewView() {
    const L = lines();
    return `
<section class="flow"><div class="wrap">
  ${stepper('review')}
  ${title('<b>Almost there</b><i></i>Review', 'Your journey at a glance', `${JOURNEYS[S.j].name} · ${plural(travellers(), 'traveller')} · ${nice(S.depart)}${S.trip === 'oneway' && !hotelTrip() ? '' : ' – ' + nice(returnDate())}`)}
  <div class="flow__grid"><div>
    <div class="panel"><div class="rv">${L.map(l => `<div class="rv__row"><span class="rv__ic">${ic(l.icon)}</span><span><b>${esc(l.t)}</b><small>${esc(l.s)}</small></span><em>${l.incl ? 'Included' : sar(l.a)}</em></div>`).join('')}</div>
      <div class="totals"><div class="grand"><span>Total</span><span>${sar(total())}</span></div><p class="fine">Indicative total in Saudi riyals for ${plural(travellers(), 'traveller')}, children's fares at 75%. Final prices are confirmed before payment.</p></div>
    </div>
    ${hotelTrip() ? `<div class="panel"><h2>Included with your journey</h2><ul class="check"><li>Meet &amp; Greet on arrival at ${GW[inbound()].city}</li>${both() ? '<li>Transfers between the airports, hotels and the Haramain train</li><li>Haramain High Speed Railway between Makkah and Madinah</li>' : '<li>Return transfers between the airport and your hotel</li>'}${S.madinah && S.madinah.type === 'package' ? '<li>Guided Madinah tour route with a specialised guide</li><li>Guest Experience Consultant</li>' : ''}${S.j === 'fhv' ? '<li>Umrah and Rawdah permits booked in Nusuk</li>' : ''}</ul></div>` : ''}
    <div class="panel"><h2>Contact</h2><div class="form"><label class="field"><span>Name</span><input class="input" value="${esc(ME.name || '')}" autocomplete="off"></label><div class="row2"><label class="field"><span>Mobile</span><input class="input" inputmode="tel" placeholder="+92 300 1234567" autocomplete="off"></label><label class="field"><span>Email</span><input class="input" type="email" placeholder="name@example.com" autocomplete="off"></label></div></div></div>
    <div class="notice" style="margin-top:14px">${ic('info')}<span>Presentation prototype: no booking, visa application or payment is made.</span></div>
  </div>${summary('Send booking request', 'review')}</div>
</div></section>`;
  }

  function doneView() {
    return `
<section class="flow"><div class="wrap"><div class="fin">
  <span class="fin__seal">${ic('check')}</span>
  <span class="label"><b>Demo</b><i></i>Request received</span>
  <h1 class="h2">Labbaik, <span data-me>${esc(ME.name || 'Guest')}</span>. Your journey is on its way.</h1>
  <p class="lead" style="max-width:46ch">In the live product, your Guest Experience Consultant would confirm your flights and hotels${S.j === 'fhv' ? ', submit your visa' : ''} and book your permits in Nusuk.</p>
  <p class="fin__ref">${S.ref}</p>
  <p class="fine">Reference for this demo only</p>
  <div class="hero__cta" style="justify-content:center"><a class="btn btn--royal" href="#/">Back to home</a><a class="btn btn--line" href="#/plan/${S.j}">Plan another journey</a></div>
</div></div></section>`;
  }

  // ---------- events ----------
  function bind(a, b) {
    if (a === 'plan') bindPlan();
    if (a === 'flights') {
      const oneway = !hotelTrip() && S.trip === 'oneway';
      const ready = () => !!S.out && (oneway || !!S.back);
      $$('[data-leg]').forEach(x => x.onclick = () => { legTab = x.dataset.leg; render(); });
      $$('[data-al]').forEach(x => x.onclick = () => { alF = x.dataset.al; render(); });
      $$('[data-f]').forEach(x => x.onclick = () => {
        const list = legTab === 'out' ? flightsFor(S.from, inbound(), S.depart) : flightsFor(outboundHome(), S.from, returnDate());
        const f = list.find(y => y.id === x.dataset.f);
        if (legTab === 'out') { S.out = f; if (!oneway && !S.back) legTab = 'back'; } else S.back = f;
        save(); render();
      });
      bar(ready() ? 'Flights chosen' : legTab === 'out' ? 'Choose your outbound flight' : 'Choose your flight home', 'Continue', ready(), () => { legTab = 'out'; go(nextStep('flights')); });
    }
    if (a === 'stay') {
      const key = b, city = b === 'makkah' ? 'Makkah' : 'Madinah';
      $$('[data-star]').forEach(x => x.onclick = () => { starF = Number(x.dataset.star); render(); });
      $$('[data-h]').forEach(x => x.onclick = () => { S[key] = { type: 'hotel', code: x.dataset.h }; save(); render(); });
      $$('[data-pkg]').forEach(x => x.onclick = () => { pkgOpen = x.dataset.pkg; render(); setTimeout(() => $('.pkgx') && $('.pkgx').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); });
      $$('[data-pick]').forEach(x => x.onclick = () => {
        const p = PKGS.find(y => y.id === x.dataset.pick);
        if (p.nights !== S.madinahN) { S.madinahN = p.nights; S.back = null; }
        S.madinah = { type: 'package', id: p.id }; save();
        if (!S.back) { legTab = 'back'; go('#/flights'); } else render();
      });
      bar(S[key] ? `${city} stay chosen` : `Choose your ${city} stay`, 'Continue', !!S[key], () => { starF = 0; pkgOpen = null; go(nextStep(key)); });
    }
    if (a === 'visa') bindVisa();
    if (a === 'review') {
      bar('Total, indicative', 'Send request', true, () => { S.ref = 'HU-' + (hash(JSON.stringify(S) + Date.now()) % 900000 + 100000); save(); go('#/done'); });
    }
    if (a && a !== 'plan') $$('[data-me]').forEach(el => { if (ME.name) el.textContent = ME.name; });
  }

  function bindPlan() {
    $$('[data-j]').forEach(x => x.onclick = () => go('#/plan/' + x.dataset.j));
    $$('[data-to]').forEach(x => x.onclick = () => { S.to = x.dataset.to; S.out = S.back = null; save(); render(); });
    $$('[data-trip]').forEach(x => x.onclick = () => { S.trip = x.dataset.trip; S.back = null; save(); render(); });
    $$('[data-cabin]').forEach(x => x.onclick = () => { S.cabin = x.dataset.cabin; S.out = S.back = null; save(); render(); });
    $$('[data-cities]').forEach(x => x.onclick = () => { S.cities = x.dataset.cities; S.out = S.back = null; S.makkah = hasCity('Makkah') ? S.makkah : null; S.madinah = hasCity('Madinah') ? S.madinah : null; save(); render(); });
    const sw = $('#swap'); if (sw) sw.onclick = () => { S.order = S.order === 'makkah' ? 'madinah' : 'makkah'; S.out = S.back = null; save(); render(); };
    const lim = { makkahN: [1, 14], madinahN: [1, 14], adults: [1, 9], children: [0, 6] };
    $$('[data-inc],[data-dec]').forEach(x => x.onclick = () => {
      const k = x.dataset.inc || x.dataset.dec; const d = x.dataset.inc ? 1 : -1;
      S[k] = Math.min(lim[k][1], Math.max(lim[k][0], S[k] + d));
      if (k.endsWith('N')) { S.back = null; if (k === 'madinahN' && S.madinah && S.madinah.type === 'package') S.madinah = null; }
      save(); render();
    });
    const dep = $('#depart'); dep.onchange = () => { S.depart = dep.value; if (S.ret < S.depart) S.ret = addDays(S.depart, 7); S.out = S.back = null; save(); render(); };
    const ret = $('#ret'); if (ret) ret.onchange = () => { S.ret = ret.value; S.back = null; save(); };
    const nat = $('#nat'); if (nat) nat.onchange = () => { S.nat = nat.value; S.visa = {}; save(); };

    // origin autocomplete (wildcards like the main Logio search: Kar*, *bad, L?E)
    const inp = $('#from'), ac = $('#acList');
    let act = -1, opts = [];
    const match = (q) => {
      q = q.trim().toLowerCase(); if (!q) return ORIGINS;
      const re = /[*?]/.test(q) ? new RegExp('^' + q.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$') : null;
      return ORIGINS.filter(o => [o.city, o.code, o.country].some(v => re ? re.test(v.toLowerCase()) : v.toLowerCase().includes(q)));
    };
    const draw = () => {
      opts = match(inp.value.replace(/\s*\([A-Z]{3}\)$/, '')).slice(0, 8);
      ac.innerHTML = opts.map((o, i) => `<button type="button" role="option" data-o="${o.code}" class="${i === act ? 'is-active' : ''}"><b>${o.code}</b><span>${esc(o.city)}<small>${esc(o.country)}</small></span></button>`).join('') || '<p class="fine" style="padding:10px">No Saudia departures match.</p>';
      ac.classList.add('open');
      $$('[data-o]', ac).forEach(x => x.onmousedown = (e) => { e.preventDefault(); pick(x.dataset.o); });
    };
    const pick = (code) => { const o = origin(code); S.from = code; S.out = S.back = null; save(); inp.value = `${o.city} (${o.code})`; ac.classList.remove('open'); $('#fromField').classList.remove('has-err'); };
    inp.onfocus = () => { inp.select(); act = -1; draw(); };
    inp.oninput = () => { act = -1; S.from = null; draw(); };
    inp.onblur = () => setTimeout(() => { ac.classList.remove('open'); if (!S.from && opts.length === 1) pick(opts[0].code); }, 120);
    inp.onkeydown = (e) => {
      if (e.key === 'ArrowDown') { act = Math.min(opts.length - 1, act + 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { act = Math.max(0, act - 1); draw(); e.preventDefault(); }
      else if (e.key === 'Enter' && ac.classList.contains('open') && opts.length) { pick(opts[Math.max(0, act)].code); e.preventDefault(); }
      else if (e.key === 'Escape') ac.classList.remove('open');
    };

    $('#planForm').onsubmit = (e) => {
      e.preventDefault();
      const err = $('#planErr');
      if (!S.from) { const m = match(inp.value); if (m.length === 1) pick(m[0].code); }
      if (!S.from) { err.textContent = 'Choose a departure city from the list.'; $('#fromField').classList.add('has-err'); inp.focus(); return; }
      if (!S.depart || S.depart < today) { err.textContent = 'Choose a travel date from today onwards.'; return; }
      if (!hotelTrip() && S.trip === 'return' && S.ret < S.depart) { err.textContent = 'Your return date is before your departure.'; return; }
      if (S.from === 'RUH' || S.from === 'DMM') { if (S.j === 'fhv') S.nat = 'SA'; }
      save(); legTab = 'out'; go('#/flights');
    };
  }

  function bindVisa() {
    const v = S.visa;
    $('#vnat').onchange = (e) => { S.nat = e.target.value; S.visa = {}; save(); render(); };
    $$('[data-up]').forEach(x => x.onchange = () => { if (x.files[0]) { v[x.dataset.up] = true; save(); render(); } });
    const n = NATS.find(x => x.cc === S.nat);
    const submit = () => {
      v.name = $('#vName').value.trim(); v.no = $('#vNo').value.trim().toUpperCase(); v.exp = $('#vExp').value; v.dob = $('#vDob').value;
      v.vacc = $('#vVacc') ? $('#vVacc').checked : true; v.nusuk = $('#vNusuk').checked;
      const err = $('#visaErr');
      const minExp = addDays(returnDate(), 180);
      if (!v.name || v.name.length < 3) return err.textContent = 'Add the full name as it appears in the passport.';
      if (!/^[A-Z0-9]{6,12}$/.test(v.no)) return err.textContent = 'Check the passport number (6 to 12 letters and numbers).';
      if (!v.exp || v.exp < minExp) return err.textContent = `Your passport must be valid until at least ${nice(minExp, { day: 'numeric', month: 'long', year: 'numeric' })} (6 months after travel).`;
      if (!v.dob) return err.textContent = 'Add the date of birth.';
      if (n.path === 'agent' && (!v.scan || !v.photo)) return err.textContent = 'Add the passport page and a personal photo.';
      if (n.path === 'agent' && !v.vacc) return err.textContent = 'The meningitis vaccination certificate is required for Umrah.';
      v.done = true; save(); go('#/review');
    };
    $('#visaForm').onsubmit = (e) => { e.preventDefault(); submit(); };
    ['vName', 'vNo', 'vExp', 'vDob'].forEach(id => $('#' + id).addEventListener('change', () => {
      v.name = $('#vName').value; v.no = $('#vNo').value; v.exp = $('#vExp').value; v.dob = $('#vDob').value; save();
    }));
    bar(v.done ? 'Visa details added' : 'Add passport details', 'Continue', true, submit);
  }

  // ---------- header + reveal ----------
  function onScroll() {
    const hero = $('.hero');
    document.body.classList.toggle('on-dark', !!hero && window.scrollY < hero.offsetHeight - 80);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  let io;
  function reveal() {
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window)) { $$('.rv-in').forEach(x => x.classList.add('is-in')); return; }
    io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv-in').forEach(x => io.observe(x));
  }

  render();
})();
