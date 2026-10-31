// Demo flight inventory. Replace with a real supplier / API feed later.
// `code` is the airline's IATA code; it drives the real airline logo.
window.LODJ_FLIGHTS = [
  {
    airline: 'Emirates',
    code: 'EK',
    route: 'JED → DXB',
    travelerClass: 'Economy',
    tags: ['Direct', 'Refundable', 'Baggage optional'],
    rating: '9.0 Featured',
    featured: true,
    businessBundle: false
  },
  {
    airline: 'Saudia',
    code: 'SV',
    route: 'RUH → DXB',
    travelerClass: 'Business Class',
    tags: ['Last 2 seats', 'Business', 'Hotel bundle'],
    rating: '9.4 Premium',
    featured: true,
    businessBundle: true
  },
  {
    airline: 'flydubai',
    code: 'FZ',
    route: 'JED → RUH',
    travelerClass: 'Economy',
    tags: ['Morning flight', 'Flexible', 'Low fare'],
    rating: '8.5 Good',
    featured: false,
    businessBundle: false
  },
  {
    airline: 'Qatar Airways',
    code: 'QR',
    route: 'DXB → HKT',
    travelerClass: 'Economy',
    tags: ['1 stop via DOH', 'Popular', 'Baggage included'],
    rating: '8.8 Very Good',
    featured: false,
    businessBundle: false
  },
  {
    airline: 'Cathay Pacific',
    code: 'CX',
    route: 'RUH → HKG',
    travelerClass: 'Economy',
    tags: ['1 stop', 'Evening departure', 'Flexible'],
    rating: '8.7 Very Good',
    featured: false,
    businessBundle: false
  }
];

// Real airline logos by IATA code. Tries Duffel's public airline logo set first,
// then the Aviasales logo CDN; if both fail the card shows the IATA code.
//
// To use a specific logo (e.g. after a rebrand), drop the file in assets/airlines/
// and list it here. It is tried first.
window.LODJ_AIRLINE_LOGO_OVERRIDES = {
  SV: 'SV.png'   // Saudia 2023 logo (palm + wings), supplied by lodj.io
};

window.LODJ_AIRLINE_LOGOS = (code) => [
  ...(window.LODJ_AIRLINE_LOGO_OVERRIDES[code] ? [`../assets/airlines/${window.LODJ_AIRLINE_LOGO_OVERRIDES[code]}`] : []),
  `https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/${code}.svg`,
  `https://pics.avs.io/200/200/${code}.png`
];

window.LODJ_LOGO_FALLBACK = function (img) {
  const next = (img.dataset.fallbacks || '').split('|').filter(Boolean);
  if (next.length) {
    img.src = next.shift();
    img.dataset.fallbacks = next.join('|');
  } else {
    const span = document.createElement('span');
    span.className = 'airline-code';
    span.textContent = img.dataset.code;
    img.replaceWith(span);
  }
};
