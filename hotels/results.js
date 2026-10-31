// Stays results: real Accor hotels for the searched hotel / city / country.
// Prices are "upon request" for now; every Accor hotel shows the ALL loyalty badge.
(async function () {
  const { search, setHeading, escape } = window.LODJ_RESULTS;
  const A = window.LODJ_ACCOR;
  const params = new URLSearchParams(window.location.search);
  const container = document.getElementById('resultsContainer');
  const PAGE = 20;

  // ---------- page chrome for hotels ----------
  document.querySelector('.promo-strip').innerHTML = `
    <div>
      <div class="promo-title"><span class="all-mark">ALL</span> Accor Live Limitless</div>
      <div class="promo-sub">Points collection available on every Accor stay. Prices are shared on request.</div>
    </div>
    <div class="promo-chip-wrap">
      <div class="promo-chip">ALL points</div>
      <div class="promo-chip">Price on request</div>
    </div>`;

  const sortSelect = document.querySelector('.sort-select');
  sortSelect.innerHTML = `
    <option value="recommended">Sort by: Recommended</option>
    <option value="stars-desc">Sort by: Stars (high to low)</option>
    <option value="stars-asc">Sort by: Stars (low to high)</option>
    <option value="name">Sort by: Name (A–Z)</option>`;

  // ---------- what did the customer search? ----------
  let query = A.resolve(params);
  if (!query) query = { kind: 'city', cc: 'AE', city: 'Dubai', label: 'Dubai, United Arab Emirates', isDefault: true };
  document.getElementById('summaryRoute').textContent = query.label;

  const nights = (search.start !== 'Any selected date' && search.end !== 'Any selected date')
    ? Math.round((new Date(search.end) - new Date(search.start)) / 86400000) : null;
  const tripLine = [
    search.start !== 'Any selected date' ? `${search.start} → ${search.end}` : null,
    nights ? `${nights} night${nights === 1 ? '' : 's'}` : null,
    search.pax || null
  ].filter(Boolean).join(' · ');

  if (query.kind === 'none') {
    setHeading(`No Accor hotels found for “${query.label}”`, 'Try a nearby city or search by country.');
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${window.LODJ_ICON('bed', 'empty-svg')}</div>
        <div>We couldn't find hotels for ${escape(query.label)} yet.</div>
        <a class="primary-btn" href="./">Search another destination</a>
      </div>`;
    return;
  }

  container.innerHTML = '<div class="loading-state">Loading hotels…</div>';

  let all;
  try {
    all = await A.loadCountry(query.cc);
  } catch (e) {
    container.innerHTML = '<div class="empty-state">Hotel data couldn’t be loaded. Please try again.</div>';
    return;
  }

  let hotels = all;
  if (query.kind === 'city' || query.kind === 'hotel') {
    hotels = all.filter(h => A.norm(h.city) === A.norm(query.city));
  }
  if (query.kind === 'hotel') {
    const picked = all.find(h => h.code === query.code);
    hotels = [picked, ...hotels.filter(h => h.code !== query.code)].filter(Boolean);
  }

  const place = query.kind === 'country' ? A.countryName(query.cc) : query.city;

  // ---------- filters (stars + brand) ----------
  const sidebar = document.getElementById('sidebar');
  const brands = [...new Set(hotels.map(h => h.brand))].sort();
  const starLevels = [...new Set(hotels.map(h => h.stars || 0))].sort((a, b) => b - a);
  sidebar.innerHTML = `
    <div class="sidebar-top">
      <h3>Filters</h3>
      <button class="toggle-filters-btn" data-toggle-filters type="button">Hide</button>
    </div>
    <div class="filter-group">
      <div class="filter-title">Star rating</div>
      ${starLevels.map(s => `<label class="filter-option"><input type="checkbox" data-filter="stars" value="${s}" checked> ${s ? '★'.repeat(s) : 'Unrated'}</label>`).join('')}
    </div>
    <div class="filter-group">
      <div class="filter-title">Brand</div>
      ${brands.map(b => `<label class="filter-option"><input type="checkbox" data-filter="brand" value="${escape(b)}" checked> ${escape(b)}</label>`).join('')}
    </div>`;

  // ---------- cards ----------
  const stars = (n) => n ? `<span class="stars" aria-label="${n} star hotel">${'★'.repeat(n)}</span>` : '';
  const mapLink = (h) => h.lat ? `https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lon}` : null;

  function card(h, featured) {
    const photos = h.photos.length ? h.photos : [];
    const img = (id, i) => `<img src="${A.photoUrl(h.code, id)}" alt="${escape(h.name)} photo ${i + 1}" loading="lazy" ${i ? 'hidden' : ''}>`;
    return `
      <article class="result-card accor-card ${featured ? 'picked' : ''}" data-code="${h.code}">
        <div class="result-image gallery" data-index="0" data-count="${photos.length}">
          ${photos.length ? photos.map(img).join('') : '<div class="no-photo">Photo coming soon</div>'}
          ${photos.length > 1 ? `
            <button class="gal-btn prev" type="button" aria-label="Previous photo">‹</button>
            <button class="gal-btn next" type="button" aria-label="Next photo">›</button>
            <div class="gal-count">1 / ${photos.length}</div>` : ''}
        </div>

        <div class="result-body">
          <div class="badge-row">
            <div class="badge brand">${escape(h.brand)}</div>
            <div class="badge all-badge" title="Accor Live Limitless: points collection available"><span class="all-mark">ALL</span> Points collection available</div>
            ${featured ? '<div class="badge featured">Your search</div>' : ''}
          </div>
          <h2 class="result-name">${escape(h.name)} ${stars(h.stars)}</h2>
          <div class="result-location"><strong>${escape(h.city)}, ${escape(A.countryName(h.cc))}</strong>${h.address ? ` · ${escape(h.address)}` : ''}</div>
          ${h.desc ? `<div class="result-desc">${escape(h.desc)}</div>` : ''}
          ${h.amenities && h.amenities.length ? `<div class="chips">${h.amenities.slice(0, 6).map(a => `<div class="chip">${escape(a)}</div>`).join('')}</div>` : ''}
        </div>

        <div class="result-price">
          <div>
            <div class="price-note">Accor Live Limitless<br>Earn ALL points on this stay</div>
            <div class="price on-request">Price upon request</div>
            <div class="per-unit">${nights ? `${nights} night${nights === 1 ? '' : 's'}` : 'Select dates for a quote'}</div>
            <div class="tax-note">Rates confirmed by our team</div>
          </div>
          <div class="cta-group">
            <a href="#" class="primary-btn">Request price</a>
            ${mapLink(h) ? `<a href="${mapLink(h)}" class="secondary-btn" target="_blank" rel="noopener">View on map</a>` : ''}
          </div>
        </div>
      </article>`;
  }

  // ---------- render with sort, filters and "show more" ----------
  let shown = PAGE;

  function current() {
    const on = (type) => [...sidebar.querySelectorAll(`[data-filter="${type}"]:checked`)].map(i => i.value);
    const okStars = on('stars').map(Number);
    const okBrands = on('brand');
    let list = hotels.filter(h => okStars.includes(h.stars || 0) && okBrands.includes(h.brand));
    const pinned = query.kind === 'hotel' ? list.filter(h => h.code === query.code) : [];
    list = list.filter(h => !pinned.includes(h));
    const sorts = {
      recommended: (a, b) => (b.stars || 0) - (a.stars || 0) || b.photos.length - a.photos.length || a.name.localeCompare(b.name),
      'stars-desc': (a, b) => (b.stars || 0) - (a.stars || 0) || a.name.localeCompare(b.name),
      'stars-asc': (a, b) => (a.stars || 0) - (b.stars || 0) || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name)
    };
    return [...pinned, ...list.sort(sorts[sortSelect.value])];
  }

  function render() {
    const list = current();
    setHeading(
      `${list.length} Accor hotel${list.length === 1 ? '' : 's'} in ${place}`,
      [query.isDefault ? 'Showing Dubai — search to choose a destination' : null, tripLine || null].filter(Boolean).join(' · ') || query.label
    );
    container.innerHTML = list.length
      ? list.slice(0, shown).map(h => card(h, query.kind === 'hotel' && h.code === query.code)).join('') +
        (list.length > shown ? `<button class="show-more" type="button">Show more hotels (${list.length - shown} more)</button>` : '')
      : '<div class="empty-state">No hotels match these filters.</div>';
  }

  container.addEventListener('click', (e) => {
    if (e.target.closest('.show-more')) { shown += PAGE; render(); return; }
    const btn = e.target.closest('.gal-btn');
    if (!btn) return;
    const gal = btn.closest('.gallery');
    const imgs = gal.querySelectorAll('img');
    const count = imgs.length;
    let i = (Number(gal.dataset.index) + (btn.classList.contains('next') ? 1 : -1) + count) % count;
    imgs.forEach((im, n) => { im.hidden = n !== i; });
    gal.dataset.index = i;
    gal.querySelector('.gal-count').textContent = `${i + 1} / ${count}`;
  });

  // A photo that fails to load is skipped; a card with none left shows a placeholder.
  container.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.closest('.gallery')) return;
    const gal = img.closest('.gallery');
    const wasVisible = !img.hidden;
    img.remove();
    const imgs = gal.querySelectorAll('img');
    if (!imgs.length) {
      gal.innerHTML = '<div class="no-photo">Photo coming soon</div>';
      return;
    }
    if (wasVisible) { imgs[0].hidden = false; gal.dataset.index = 0; }
    const counter = gal.querySelector('.gal-count');
    if (counter) counter.textContent = `${Number(gal.dataset.index) + 1} / ${imgs.length}`;
    if (imgs.length === 1) gal.querySelectorAll('.gal-btn, .gal-count').forEach(el => el.remove());
  }, true);

  sortSelect.addEventListener('change', () => { shown = PAGE; render(); });
  sidebar.addEventListener('change', () => { shown = PAGE; render(); });
  render();
})();
