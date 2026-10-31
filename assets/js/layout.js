// Shared page chrome (top bar, vertical tabs, results header, explore sections).
// Every vertical page sets <body data-root="../" data-vertical="hotels">.
(function () {
  const body = document.body;
  const ROOT = body.dataset.root || '';
  const ACTIVE = body.dataset.vertical;
  const V = window.LODJ_VERTICALS;

  const url = (path, page = '') => `${ROOT}${path}/${page}`;

  function searchTopbar() {
    return `
      <div class="topbar">
        <div class="brand-wrap">
          <h1 class="logo">lodj.io</h1>
          <p class="sub">Demo experience</p>
        </div>
        <div class="top-actions" data-locale-slot>
          <a class="home-link" href="${ROOT}index.html">← Back to home</a>
          <button class="mode-toggle" data-theme-toggle type="button">Toggle mode</button>
        </div>
      </div>
      <nav class="tabs">
        ${V.map(v => `<a class="tab ${v.id === ACTIVE ? 'active' : ''}" href="${url(v.path)}">${window.LODJ_ICON(v.svg, 'tab-icon') || v.icon}<span>${v.label}</span></a>`).join('')}
      </nav>`;
  }

  function resultsHeader() {
    const current = V.find(v => v.id === ACTIVE);
    return `
      <div class="header-inner">
        <a href="${ROOT}index.html" class="brand">lodj.io</a>
        <div class="nav-actions" data-locale-slot>
          <a class="nav-btn" href="${url(current.path)}">New search</a>
          ${V.map(v => `<a class="nav-btn ${v.id === ACTIVE ? 'active' : ''}" href="${url(v.path, 'results.html')}">${v.label}</a>`).join('')}
          <button class="nav-btn" data-theme-toggle type="button">Toggle mode</button>
        </div>
      </div>`;
  }

  function services() {
    return `
      <div class="services">
        <div class="services-row">
          ${window.LODJ_UPCOMING_SERVICES.map(s => `
            <div class="service"><div class="service-icon">${s.icon}</div><div class="service-label">${s.label}</div></div>
          `).join('')}
        </div>
      </div>`;
  }

  function destinationSection(title, items) {
    const hotels = url('hotels', 'results.html');
    return `
      <div class="section">
        <div class="section-head">
          <h2>${title}</h2>
          <a class="view-more" href="${hotels}">View more</a>
        </div>
        <div class="dest-grid">
          ${items.map(d => `
            <a class="dest-card" href="${hotels}?to=${encodeURIComponent(d.name)}">
              <img src="${d.image}" alt="${d.name}"><div class="dest-name">${d.name}</div>
            </a>`).join('')}
        </div>
      </div>`;
  }

  function fill(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  fill('search-topbar', searchTopbar());
  fill('results-header', ACTIVE ? resultsHeader() : '');
  fill('explore', window.LODJ_FEATURED_DESTINATIONS
    ? services() +
      destinationSection('Top international escapes', window.LODJ_FEATURED_DESTINATIONS.international) +
      destinationSection('Top domestic getaways', window.LODJ_FEATURED_DESTINATIONS.domestic)
    : services());

  window.LODJ_THEME.init();
})();
