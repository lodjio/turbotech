// Single source of truth for the product verticals.
// To add a new vertical (e.g. transfers): add an entry here, then create
// a /<path>/ folder with index.html (search) and results.html.
window.LODJ_VERTICALS = [
  { id: 'flights',    path: 'flights',    label: 'Flights',    icon: '✈' },
  { id: 'hotels',     path: 'hotels',     label: 'Stays',      icon: '🛏' },
  { id: 'activities', path: 'activities', label: 'Activities', icon: '🎈' }
];

// Services shown on the search pages that don't have their own vertical yet.
window.LODJ_UPCOMING_SERVICES = [
  { icon: '🚐', label: 'Transfers' },
  { icon: '🚆', label: 'Trains & Railway' },
  { icon: '🚗', label: 'Car rental' },
  { icon: '🧳', label: 'Domestic packages' },
  { icon: '🛳', label: 'Cruise' },
  { icon: '🗺', label: 'Holiday Packages' },
  { icon: '•••', label: 'More services' }
];
