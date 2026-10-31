// Single source of truth for the product verticals.
// To add a new vertical (e.g. transfers): add an entry here, then create
// a /<path>/ folder with index.html (search) and results.html.
// `svg` is the tab icon (line icon, inherits the tab's text colour); `icon` is an emoji fallback.
window.LODJ_VERTICALS = [
  { id: 'flights',    path: 'flights',    label: 'Flights',    icon: '✈️', svg: 'plane' },
  { id: 'hotels',     path: 'hotels',     label: 'Stays',      icon: '🏨', svg: 'bed' },
  { id: 'holidays',   path: 'holidays',   label: 'Holidays',   icon: '🌴', svg: 'palm' },
  { id: 'activities', path: 'activities', label: 'Activities', icon: '🎟️', svg: 'ticket' }
];

// Line icons (24×24, stroke = currentColor), based on the Lucide icon set (ISC licence).
window.LODJ_ICONS = {
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  bed: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
  palm: '<path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4"/><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3"/><path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35"/><path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>'
};

window.LODJ_ICON = (name, cls = 'icon') => window.LODJ_ICONS[name]
  ? `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${window.LODJ_ICONS[name]}</svg>`
  : '';

// Services shown on the search pages that don't have their own vertical yet.
window.LODJ_UPCOMING_SERVICES = [
  { icon: '🚐', label: 'Transfers' },
  { icon: '🚆', label: 'Trains & Railway' },
  { icon: '🚗', label: 'Car rental' },
  { icon: '🧳', label: 'Domestic packages' },
  { icon: '🛳', label: 'Cruise' },
  { icon: '•••', label: 'More services' }
];
