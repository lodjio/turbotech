// Country + language box in the page header.
//
// Where the country comes from, in order:
//   1. the customer's saved choice (localStorage)
//   2. their IP location, read from Cloudflare (/cdn-cgi/trace on lodj.io, same origin, no third party)
//   3. the region in their browser language (e.g. en-AE → AE)
// On a first visit the box asks the customer to confirm, share their precise location
// (browser permission prompt, then reverse-geocoded to a country), or pick a country.
(function () {
  const KEY = 'lodj-locale';
  const COUNTRIES = ('AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ ' +
    'CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GI GM GN ' +
    'GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT ' +
    'LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS ' +
    'PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA ' +
    'UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW').split(' ');

  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const countryName = (code) => { try { return regionNames.of(code); } catch (e) { return code; } };

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
    return m ? m[1].toUpperCase() : null;
  })();

  const flagUrl = (code) => `https://flagcdn.com/${code.toLowerCase()}.svg`;
  const flagEmoji = (code) => String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ } }

  async function ipCountry() {
    try {
      const res = await fetch('/cdn-cgi/trace', { cache: 'no-store' });
      if (!res.ok) return null;
      const m = /^loc=([A-Z]{2})$/m.exec(await res.text());
      return m && m[1] !== 'XX' ? m[1] : null;
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
          data.countryCode ? resolve(data.countryCode.toUpperCase()) : reject(new Error('no country'));
        } catch (e) { reject(e); }
      }, reject, { timeout: 10000, maximumAge: 3600000 });
    });
  }

  function mount(container) {
    const box = document.createElement('div');
    box.className = 'locale';
    box.innerHTML = `
      <button class="locale-btn" type="button" aria-haspopup="true" aria-expanded="false">
        <span class="locale-flag"></span>
        <span class="locale-text"><span class="locale-country"></span><span class="locale-lang"></span></span>
        <span class="locale-caret">▾</span>
      </button>
      <div class="locale-pop" role="dialog" aria-label="Your location and language">
        <div class="locale-ask">
          <div class="locale-q">Are you in <b class="locale-q-country"></b>?</div>
          <div class="locale-actions">
            <button type="button" class="locale-yes">Yes</button>
            <button type="button" class="locale-gps">📍 Use my location</button>
          </div>
        </div>
        <label class="locale-label">Country
          <select class="locale-select">
            ${COUNTRIES.map(c => ({ c, n: countryName(c) })).sort((a, b) => a.n.localeCompare(b.n))
              .map(({ c, n }) => `<option value="${c}">${flagEmoji(c)} ${n}</option>`).join('')}
          </select>
        </label>
        <div class="locale-label">Language
          <div class="locale-lang-row">${languageName} <span class="locale-note">(from your browser)</span></div>
        </div>
        <div class="locale-status" aria-live="polite"></div>
      </div>`;
    container.prepend(box);

    const $ = (s) => box.querySelector(s);
    const btn = $('.locale-btn');
    const status = $('.locale-status');
    let state = load();

    function render(code) {
      const name = countryName(code);
      $('.locale-flag').innerHTML = `<img src="${flagUrl(code)}" alt="" width="22" height="16"
        onerror="this.replaceWith(document.createTextNode('${flagEmoji(code)}'))">`;
      $('.locale-country').textContent = code;
      $('.locale-lang').textContent = languageName;
      $('.locale-q-country').textContent = name;
      $('.locale-select').value = code;
      btn.title = `${name} · ${languageName}`;
      document.documentElement.dataset.country = code;
    }

    function open(show) {
      box.classList.toggle('open', show);
      btn.setAttribute('aria-expanded', String(show));
    }

    function confirm(code, source) {
      state = { country: code, source, confirmed: true };
      save(state);
      render(code);
      box.classList.remove('asking');
    }

    btn.addEventListener('click', () => open(!box.classList.contains('open')));
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) open(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });

    $('.locale-yes').addEventListener('click', () => { confirm($('.locale-select').value, state.source); open(false); });
    $('.locale-select').addEventListener('change', (e) => { confirm(e.target.value, 'manual'); status.textContent = 'Saved.'; });
    $('.locale-gps').addEventListener('click', async () => {
      status.textContent = 'Finding your location…';
      try {
        const code = await preciseCountry();
        confirm(code, 'gps');
        status.textContent = `Located: ${countryName(code)}.`;
        setTimeout(() => open(false), 900);
      } catch (e) {
        status.textContent = 'Couldn’t get your location. Please pick your country from the list.';
      }
    });

    // Initial guess
    const initial = (state && state.country) || browserCountry || 'AE';
    if (!state) state = { country: initial, source: browserCountry ? 'browser' : 'default', confirmed: false };
    render(initial);

    if (!state.confirmed) {
      box.classList.add('asking');
      ipCountry().then(code => {
        if (code && !load()) { state = { country: code, source: 'ip', confirmed: false }; render(code); }
        open(true); // ask the customer to confirm
      });
    }
  }

  document.querySelectorAll('[data-locale-slot]').forEach(mount);
})();
