// Demo flight inventory. Replace with a real supplier / API feed later.
(function () {
  function svgDataUri(svg) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  const AIRLINE_LOGOS = {
    emirates: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="18" fill="#D71920"/>
        <text x="60" y="70" text-anchor="middle" font-size="30" font-family="Arial" font-weight="700" fill="white">EK</text>
      </svg>
    `),
    saudia: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="18" fill="#0B3A82"/>
        <text x="60" y="70" text-anchor="middle" font-size="26" font-family="Arial" font-weight="700" fill="#D4AF37">SV</text>
      </svg>
    `),
    flydubai: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="18" fill="#0B78C8"/>
        <text x="60" y="70" text-anchor="middle" font-size="24" font-family="Arial" font-weight="700" fill="#FF8C00">FZ</text>
      </svg>
    `),
    qatar: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="18" fill="#5C0931"/>
        <text x="60" y="70" text-anchor="middle" font-size="24" font-family="Arial" font-weight="700" fill="white">QR</text>
      </svg>
    `),
    cathay: svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="18" fill="#006564"/>
        <text x="60" y="70" text-anchor="middle" font-size="24" font-family="Arial" font-weight="700" fill="white">CX</text>
      </svg>
    `)
  };

  window.LODJ_FLIGHTS = [
    {
      airline: 'Emirates',
      airlineLogo: AIRLINE_LOGOS.emirates,
      route: 'JED → DXB',
      travelerClass: 'Economy',
      tags: ['Direct', '1 traveler', 'Baggage optional'],
      rating: '9.0 Featured',
      featured: true,
      businessBundle: false
    },
    {
      airline: 'Saudia',
      airlineLogo: AIRLINE_LOGOS.saudia,
      route: 'RUH → DXB',
      travelerClass: 'Business Class',
      tags: ['Last 2 seats', 'Business', 'Hotel bundle'],
      rating: '9.4 Premium',
      featured: true,
      businessBundle: true
    },
    {
      airline: 'flydubai',
      airlineLogo: AIRLINE_LOGOS.flydubai,
      route: 'JED → RUH',
      travelerClass: 'Economy',
      tags: ['Domestic', 'Morning flight', 'Flexible'],
      rating: '8.5 Good',
      featured: false,
      businessBundle: false
    },
    {
      airline: 'Qatar Airways',
      airlineLogo: AIRLINE_LOGOS.qatar,
      route: 'DXB → HKT',
      travelerClass: 'Economy',
      tags: ['1 stop', 'Leisure route', 'Popular'],
      rating: '8.8 Very Good',
      featured: false,
      businessBundle: false
    },
    {
      airline: 'Cathay Pacific',
      airlineLogo: AIRLINE_LOGOS.cathay,
      route: 'RUH → HKG',
      travelerClass: 'Economy',
      tags: ['APAC', 'Evening departure', 'City break'],
      rating: '8.7 Very Good',
      featured: false,
      businessBundle: false
    }
  ];
})();
