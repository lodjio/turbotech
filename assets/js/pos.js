// POS (point of sale) box in the page header: the customer's country, language and currency.
//
// Country, in order of preference:
//   1. the customer's saved choice
//   2. their IP location from Cloudflare (/cdn-cgi/trace on lodj.io, same origin)
//   3. the region in their browser language (en-AE → AE)
// On a first visit the box asks the customer to confirm, share their precise location
// (browser permission, reverse-geocoded to a country) or search for their country.
//
// Currency follows the country. Prices on the site are stored in SAR and converted with daily
// rates (open.er-api.com, cached for 12 h, pegged GCC rates as a fallback).
//
// API for other scripts:
//   LODJ_POS.country / .currency
//   LODJ_POS.format(amountInSAR) → "AED 1,594"
//   document.addEventListener('lodj:pos', ...)   fired when country, currency or rates change
(function () {
  const KEY = 'lodj-pos';
  const LEGACY_KEY = 'lodj-locale';
  const FX_KEY = 'lodj-fx';
  const BASE = 'SAR';

  // ISO country → ISO currency
  const CURRENCY = {
    AD: 'EUR', AE: 'AED', AF: 'AFN', AG: 'XCD', AI: 'XCD', AL: 'ALL', AM: 'AMD', AO: 'AOA', AR: 'ARS', AT: 'EUR',
    AU: 'AUD', AW: 'AWG', AZ: 'AZN', BA: 'BAM', BB: 'BBD', BD: 'BDT', BE: 'EUR', BF: 'XOF', BG: 'EUR', BH: 'BHD',
    BI: 'BIF', BJ: 'XOF', BM: 'BMD', BN: 'BND', BO: 'BOB', BR: 'BRL', BS: 'BSD', BT: 'BTN', BW: 'BWP', BY: 'BYN',
    BZ: 'BZD', CA: 'CAD', CD: 'CDF', CF: 'XAF', CG: 'XAF', CH: 'CHF', CI: 'XOF', CL: 'CLP', CM: 'XAF', CN: 'CNY',
    CO: 'COP', CR: 'CRC', CU: 'CUP', CV: 'CVE', CY: 'EUR', CZ: 'CZK', DE: 'EUR', DJ: 'DJF', DK: 'DKK', DM: 'XCD',
    DO: 'DOP', DZ: 'DZD', EC: 'USD', EE: 'EUR', EG: 'EGP', ER: 'ERN', ES: 'EUR', ET: 'ETB', FI: 'EUR', FJ: 'FJD',
    FM: 'USD', FR: 'EUR', GA: 'XAF', GB: 'GBP', GD: 'XCD', GE: 'GEL', GH: 'GHS', GI: 'GIP', GM: 'GMD', GN: 'GNF',
    GQ: 'XAF', GR: 'EUR', GT: 'GTQ', GW: 'XOF', GY: 'GYD', HK: 'HKD', HN: 'HNL', HR: 'EUR', HT: 'HTG', HU: 'HUF',
    ID: 'IDR', IE: 'EUR', IL: 'ILS', IN: 'INR', IQ: 'IQD', IR: 'IRR', IS: 'ISK', IT: 'EUR', JM: 'JMD', JO: 'JOD',
    JP: 'JPY', KE: 'KES', KG: 'KGS', KH: 'KHR', KI: 'AUD', KM: 'KMF', KN: 'XCD', KP: 'KPW', KR: 'KRW', KW: 'KWD',
    KY: 'KYD', KZ: 'KZT', LA: 'LAK', LB: 'LBP', LC: 'XCD', LI: 'CHF', LK: 'LKR', LR: 'LRD', LS: 'LSL', LT: 'EUR',
    LU: 'EUR', LV: 'EUR', LY: 'LYD', MA: 'MAD', MC: 'EUR', MD: 'MDL', ME: 'EUR', MG: 'MGA', MH: 'USD', MK: 'MKD',
    ML: 'XOF', MM: 'MMK', MN: 'MNT', MO: 'MOP', MR: 'MRU', MT: 'EUR', MU: 'MUR', MV: 'MVR', MW: 'MWK', MX: 'MXN',
    MY: 'MYR', MZ: 'MZN', NA: 'NAD', NE: 'XOF', NG: 'NGN', NI: 'NIO', NL: 'EUR', NO: 'NOK', NP: 'NPR', NR: 'AUD',
    NZ: 'NZD', OM: 'OMR', PA: 'USD', PE: 'PEN', PG: 'PGK', PH: 'PHP', PK: 'PKR', PL: 'PLN', PR: 'USD', PS: 'ILS',
    PT: 'EUR', PW: 'USD', PY: 'PYG', QA: 'QAR', RO: 'RON', RS: 'RSD', RU: 'RUB', RW: 'RWF', SA: 'SAR', SB: 'SBD',
    SC: 'SCR', SD: 'SDG', SE: 'SEK', SG: 'SGD', SI: 'EUR', SK: 'EUR', SL: 'SLE', SM: 'EUR', SN: 'XOF', SO: 'SOS',
    SR: 'SRD', SS: 'SSP', ST: 'STN', SV: 'USD', SY: 'SYP', SZ: 'SZL', TD: 'XAF', TG: 'XOF', TH: 'THB', TJ: 'TJS',
    TL: 'USD', TM: 'TMT', TN: 'TND', TO: 'TOP', TR: 'TRY', TT: 'TTD', TV: 'AUD', TW: 'TWD', TZ: 'TZS', UA: 'UAH',
    UG: 'UGX', US: 'USD', UY: 'UYU', UZ: 'UZS', VA: 'EUR', VC: 'XCD', VE: 'VES', VN: 'VND', VU: 'VUV', WS: 'WST',
    XK: 'EUR', YE: 'YER', ZA: 'ZAR', ZM: 'ZMW', ZW: 'USD'
  };
  const COUNTRIES = Object.keys(CURRENCY);

  // Fallback rates per 1 SAR for pegged currencies (used until live rates load).
  const PEGGED = { SAR: 1, USD: 1 / 3.75, AED: 3.6725 / 3.75, QAR: 3.64 / 3.75, BHD: 0.376 / 3.75, OMR: 0.3845 / 3.75, JOD: 0.709 / 3.75 };

  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });
  const countryName = (cc) => { try { return regionNames.of(cc); } catch (e) { return cc; } };
  const currencyName = (c) => { try { return currencyNames.of(c); } catch (e) { return c; } };
  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const escape = (v) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const browserLang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  const languageName = (() => {
    try {
      const base = browserLang.split('-')[0];
      const name = new Intl.DisplayNames([base], { type: 'language' }).of(base);
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch (e) { return 'English'; }
  })();
  const browserCountry = (() => {
    const m = /-([A-Za-z]{2})\b/.exec(browserLang);
    const cc = m && m[1].toUpperCase();
    return cc && CURRENCY[cc] ? cc : null;
  })();

  // Flag images (render everywhere, unlike flag emoji on Windows).
  const flag = (cc, w = 24) =>
    `<img class="pos-flag-img" src="https://flagcdn.com/w40/${cc.toLowerCase()}.png" srcset="https://flagcdn.com/w80/${cc.toLowerCase()}.png 2x" width="${w}" height="${Math.round(w * 0.72)}" alt="" loading="lazy">`;

  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
    set(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  // ---------------- state ----------------
  let state = store.get(KEY) || (() => {
    const legacy = store.get(LEGACY_KEY);
    return legacy && legacy.country ? { country: legacy.country, source: legacy.source, confirmed: !!legacy.confirmed } : null;
  })();
  if (state && !CURRENCY[state.country]) state = null;
  const firstVisit = !state || !state.confirmed;
  if (!state) state = { country: browserCountry || 'AE', source: browserCountry ? 'browser' : 'default', confirmed: false };

  let rates = (() => {
    const cached = store.get(FX_KEY);
    return cached && cached.rates ? cached.rates : PEGGED;
  })();

  const currencyOf = (cc) => {
    const c = CURRENCY[cc] || 'USD';
    return rates[c] ? c : 'USD';
  };

  const POS = {
    get country() { return state.country; },
    get currency() { return currencyOf(state.country); },
    get language() { return languageName; },
    countryName,
    format(amountSAR) {
      const cur = POS.currency;
      const value = amountSAR * (rates[cur] || 1);
      try {
        return new Intl.NumberFormat('en', { style: 'currency', currency: cur, currencyDisplay: 'code', maximumFractionDigits: 0 })
          .format(value).replace(/ /g, ' ');
      } catch (e) { return `${cur} ${Math.round(value).toLocaleString()}`; }
    }
  };
  window.LODJ_POS = POS;

  const emit = () => document.dispatchEvent(new CustomEvent('lodj:pos', { detail: { country: POS.country, currency: POS.currency } }));

  async function refreshRates() {
    const cached = store.get(FX_KEY);
    if (cached && cached.rates && Date.now() - cached.ts < 12 * 3600 * 1000) return;
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${BASE}`);
      const data = await res.json();
      if (data.result === 'success' && data.rates) {
        rates = data.rates;
        store.set(FX_KEY, { ts: Date.now(), rates });
        emit();
      }
    } catch (e) { /* keep cached or pegged rates */ }
  }

  async function ipCountry() {
    try {
      const res = await fetch('/cdn-cgi/trace', { cache: 'no-store' });
      if (!res.ok) return null;
      const m = /^loc=([A-Z]{2})$/m.exec(await res.text());
      return m && CURRENCY[m[1]] ? m[1] : null;
    } catch (e) { return null; }
  }

  function preciseCountry() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('unsupported'));
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Free client-side reverse geocoding (no key). Only the country code is used.
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          const cc = (data.countryCode || '').toUpperCase();
          CURRENCY[cc] ? resolve(cc) : reject(new Error('no country'));
        } catch (e) { reject(e); }
      }, reject, { timeout: 10000, maximumAge: 3600000 });
    });
  }

  // ---------------- UI ----------------
  const list = COUNTRIES.map(cc => ({ cc, name: countryName(cc), cur: CURRENCY[cc] }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const PINNED = ['AE', 'SA', 'BH', 'QA', 'KW', 'OM'];

  function mount(container) {
    const box = document.createElement('div');
    box.className = 'pos';
    box.innerHTML = `
      <button class="pos-btn" type="button" aria-haspopup="dialog" aria-expanded="false">
        <span class="pos-flag"></span>
        <span class="pos-text">
          <span class="pos-country"></span><span class="pos-dot">·</span><span class="pos-lang"></span><span class="pos-dot">·</span><span class="pos-cur"></span>
        </span>
        <span class="pos-caret" aria-hidden="true">▾</span>
      </button>
      <div class="pos-pop" role="dialog" aria-label="Country, language and currency">
        <div class="pos-ask">
          <div class="pos-q">Are you in <b class="pos-q-country"></b>?</div>
          <div class="pos-actions">
            <button type="button" class="pos-yes">Yes</button>
            <button type="button" class="pos-gps">📍 Use my location</button>
          </div>
        </div>
        <div class="pos-search-wrap">
          <input class="pos-search" type="search" placeholder="Search country or currency" autocomplete="off" aria-label="Search country or currency">
        </div>
        <div class="pos-list" role="listbox" aria-label="Countries"></div>
        <div class="pos-meta">
          <div><span class="pos-meta-label">Language</span> <span class="pos-meta-lang"></span></div>
          <div><span class="pos-meta-label">Currency</span> <span class="pos-meta-cur"></span></div>
        </div>
        <div class="pos-status" aria-live="polite"></div>
        <button type="button" class="pos-gps pos-gps-inline">📍 Detect my location</button>
      </div>`;
    container.prepend(box);

    const $ = (s) => box.querySelector(s);
    const btn = $('.pos-btn');
    const search = $('.pos-search');
    const listEl = $('.pos-list');
    const status = $('.pos-status');
    let active = -1;
    let shown = [];

    function renderButton() {
      const cc = POS.country;
      $('.pos-flag').innerHTML = flag(cc, 24);
      $('.pos-country').textContent = cc;
      $('.pos-lang').textContent = languageName;
      $('.pos-cur').textContent = POS.currency;
      $('.pos-q-country').textContent = countryName(cc);
      $('.pos-meta-lang').textContent = `${languageName} (from your browser)`;
      $('.pos-meta-cur').textContent = `${POS.currency} · ${currencyName(POS.currency)}`;
      btn.title = `${countryName(cc)} · ${languageName} · ${POS.currency}`;
      document.documentElement.dataset.country = cc;
    }

    function renderList() {
      const q = norm(search.value.trim());
      const matches = q
        ? list
            .filter(c => norm(c.name).includes(q) || c.cc.toLowerCase() === q || c.cur.toLowerCase().includes(q) || norm(currencyName(c.cur)).includes(q))
            // Best matches first: name starts with the search, then GCC markets, then A–Z.
            .sort((a, b) =>
              (norm(b.name).startsWith(q) - norm(a.name).startsWith(q)) ||
              (b.cc.toLowerCase() === q) - (a.cc.toLowerCase() === q) ||
              (PINNED.includes(b.cc) - PINNED.includes(a.cc)) ||
              a.name.localeCompare(b.name))
        : [...PINNED.map(cc => list.find(c => c.cc === cc)), ...list.filter(c => !PINNED.includes(c.cc))];
      shown = matches;
      active = -1;
      listEl.innerHTML = matches.length
        ? matches.map((c, i) => `
            ${!q && i === PINNED.length ? '<div class="pos-divider"></div>' : ''}
            <div class="pos-item ${c.cc === POS.country ? 'selected' : ''}" role="option" data-cc="${c.cc}" aria-selected="${c.cc === POS.country}">
              ${flag(c.cc, 22)}
              <span class="pos-item-name">${escape(c.name)}</span>
              <span class="pos-item-cur">${c.cur}</span>
            </div>`).join('')
        : `<div class="pos-empty">No country matches “${escape(search.value.trim())}”</div>`;
    }

    function open(show) {
      box.classList.toggle('open', show);
      btn.setAttribute('aria-expanded', String(show));
      if (show) { search.value = ''; renderList(); }
    }

    function choose(cc, source) {
      state = { country: cc, source, confirmed: true };
      store.set(KEY, state);
      box.classList.remove('asking');
      renderButton();
      renderList();
      emit();
    }

    function highlight(i) {
      const items = listEl.querySelectorAll('.pos-item');
      items.forEach(el => el.classList.remove('active'));
      if (items[i]) { items[i].classList.add('active'); items[i].scrollIntoView({ block: 'nearest' }); }
      active = i;
    }

    btn.addEventListener('click', () => open(!box.classList.contains('open')));
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) open(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('open')) { open(false); btn.focus(); } });

    search.addEventListener('input', renderList);
    search.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(active + 1, shown.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(active - 1, 0)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const pick = shown[active >= 0 ? active : 0];
        if (pick) { choose(pick.cc, 'manual'); open(false); }
      }
    });
    listEl.addEventListener('click', (e) => {
      const item = e.target.closest('.pos-item');
      if (!item) return;
      choose(item.dataset.cc, 'manual');
      status.textContent = '';
      open(false);
    });

    $('.pos-yes').addEventListener('click', () => { choose(POS.country, state.source); open(false); });
    box.querySelectorAll('.pos-gps').forEach(b => b.addEventListener('click', async () => {
      status.textContent = 'Finding your location…';
      try {
        const cc = await preciseCountry();
        choose(cc, 'gps');
        status.textContent = `Located: ${countryName(cc)}.`;
        setTimeout(() => open(false), 900);
      } catch (e) {
        status.textContent = 'Couldn’t get your location. Please search for your country.';
      }
    }));

    document.addEventListener('lodj:pos', renderButton);
    renderButton();

    if (firstVisit) {
      box.classList.add('asking');
      ipCountry().then(cc => {
        if (cc && !state.confirmed) { state = { country: cc, source: 'ip', confirmed: false }; renderButton(); emit(); }
        if (!state.confirmed) open(true);
      });
    }
  }

  document.querySelectorAll('[data-pos-slot]').forEach(mount);
  refreshRates();
})();
