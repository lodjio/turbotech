window.LODJ_AIRPORTS = [
  { code: 'JED', city: 'Jeddah', airport: 'King Abdulaziz International Airport', country: 'Saudi Arabia' },
  { code: 'RUH', city: 'Riyadh', airport: 'King Khalid International Airport', country: 'Saudi Arabia' },
  { code: 'DMM', city: 'Dammam', airport: 'King Fahd International Airport', country: 'Saudi Arabia' },
  { code: 'DXB', city: 'Dubai', airport: 'Dubai International Airport', country: 'UAE' },
  { code: 'AUH', city: 'Abu Dhabi', airport: 'Zayed International Airport', country: 'UAE' },
  { code: 'DOH', city: 'Doha', airport: 'Hamad International Airport', country: 'Qatar' },
  { code: 'BAH', city: 'Bahrain', airport: 'Bahrain International Airport', country: 'Bahrain' },
  { code: 'KWI', city: 'Kuwait City', airport: 'Kuwait International Airport', country: 'Kuwait' },
  { code: 'MCT', city: 'Muscat', airport: 'Muscat International Airport', country: 'Oman' },
  { code: 'LHR', city: 'London', airport: 'Heathrow Airport', country: 'United Kingdom' },
  { code: 'CDG', city: 'Paris', airport: 'Charles de Gaulle Airport', country: 'France' },
  { code: 'HKG', city: 'Hong Kong', airport: 'Hong Kong International Airport', country: 'Hong Kong' },
  { code: 'BKK', city: 'Bangkok', airport: 'Suvarnabhumi Airport', country: 'Thailand' },
  { code: 'HKT', city: 'Phuket', airport: 'Phuket International Airport', country: 'Thailand' },
  { code: 'KBV', city: 'Krabi', airport: 'Krabi International Airport', country: 'Thailand' },
  { code: 'JMK', city: 'Mykonos', airport: 'Mykonos Airport', country: 'Greece' },
  { code: 'IST', city: 'Istanbul', airport: 'Istanbul Airport', country: 'Turkey' },
  { code: 'MLE', city: 'Malé', airport: 'Velana International Airport', country: 'Maldives' }
];

// Dropdown options for airport fields.
window.LODJ_AIRPORT_OPTIONS = () => window.LODJ_AIRPORTS.map(a => ({
  value: `${a.code} - ${a.city}`,
  main: `${a.code} - ${a.city}`,
  sub: `${a.airport}, ${a.country}`,
  tag: 'Airport',
  section: 'Airports',
  keys: [a.code, a.city, a.airport, a.country]
}));
