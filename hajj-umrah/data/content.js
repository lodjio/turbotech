// Saudia Hajj & Umrah demo content: departure cities, Madinah packages, visa pathways.
// Flight schedules and fares are generated for the demo (see app.js) and are indicative only.

// Departure cities. `group` drives the story we tell: B = the large pilgrim markets that today
// need a licensed agent for the Umrah visa; A = eVisa-eligible markets; G = GCC.
window.HU_ORIGINS = [
  // India
  { code: 'DEL', city: 'Delhi', country: 'India', cc: 'IN', lat: 28.556, lon: 77.100 },
  { code: 'BOM', city: 'Mumbai', country: 'India', cc: 'IN', lat: 19.089, lon: 72.866 },
  { code: 'HYD', city: 'Hyderabad', country: 'India', cc: 'IN', lat: 17.240, lon: 78.429 },
  { code: 'BLR', city: 'Bengaluru', country: 'India', cc: 'IN', lat: 13.199, lon: 77.706 },
  { code: 'MAA', city: 'Chennai', country: 'India', cc: 'IN', lat: 12.990, lon: 80.169 },
  { code: 'COK', city: 'Kochi', country: 'India', cc: 'IN', lat: 10.152, lon: 76.402 },
  { code: 'CCJ', city: 'Kozhikode', country: 'India', cc: 'IN', lat: 11.137, lon: 75.955 },
  { code: 'LKO', city: 'Lucknow', country: 'India', cc: 'IN', lat: 26.761, lon: 80.889 },
  // Pakistan
  { code: 'KHI', city: 'Karachi', country: 'Pakistan', cc: 'PK', lat: 24.907, lon: 67.161 },
  { code: 'LHE', city: 'Lahore', country: 'Pakistan', cc: 'PK', lat: 31.522, lon: 74.404 },
  { code: 'ISB', city: 'Islamabad', country: 'Pakistan', cc: 'PK', lat: 33.549, lon: 72.825 },
  { code: 'PEW', city: 'Peshawar', country: 'Pakistan', cc: 'PK', lat: 33.994, lon: 71.515 },
  { code: 'MUX', city: 'Multan', country: 'Pakistan', cc: 'PK', lat: 30.203, lon: 71.419 },
  { code: 'SKT', city: 'Sialkot', country: 'Pakistan', cc: 'PK', lat: 32.535, lon: 74.364 },
  // Bangladesh
  { code: 'DAC', city: 'Dhaka', country: 'Bangladesh', cc: 'BD', lat: 23.843, lon: 90.398 },
  { code: 'CGP', city: 'Chattogram', country: 'Bangladesh', cc: 'BD', lat: 22.250, lon: 91.813 },
  // Indonesia, Malaysia
  { code: 'CGK', city: 'Jakarta', country: 'Indonesia', cc: 'ID', lat: -6.126, lon: 106.656 },
  { code: 'SUB', city: 'Surabaya', country: 'Indonesia', cc: 'ID', lat: -7.380, lon: 112.787 },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', cc: 'MY', lat: 2.746, lon: 101.710 },
  // Africa
  { code: 'CAI', city: 'Cairo', country: 'Egypt', cc: 'EG', lat: 30.122, lon: 31.406 },
  { code: 'KAN', city: 'Kano', country: 'Nigeria', cc: 'NG', lat: 12.048, lon: 8.525 },
  // Europe, Americas, Türkiye
  { code: 'LHR', city: 'London', country: 'United Kingdom', cc: 'GB', lat: 51.470, lon: -0.454 },
  { code: 'MAN', city: 'Manchester', country: 'United Kingdom', cc: 'GB', lat: 53.365, lon: -2.273 },
  { code: 'CDG', city: 'Paris', country: 'France', cc: 'FR', lat: 49.010, lon: 2.548 },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', cc: 'DE', lat: 50.038, lon: 8.562 },
  { code: 'IST', city: 'Istanbul', country: 'Türkiye', cc: 'TR', lat: 41.262, lon: 28.742 },
  { code: 'JFK', city: 'New York', country: 'United States', cc: 'US', lat: 40.641, lon: -73.778 },
  { code: 'IAD', city: 'Washington', country: 'United States', cc: 'US', lat: 38.953, lon: -77.456 },
  // GCC and domestic
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', cc: 'AE', lat: 25.253, lon: 55.364 },
  { code: 'KWI', city: 'Kuwait City', country: 'Kuwait', cc: 'KW', lat: 29.241, lon: 47.971 },
  { code: 'RUH', city: 'Riyadh', country: 'Saudi Arabia', cc: 'SA', lat: 24.958, lon: 46.699 },
  { code: 'DMM', city: 'Dammam', country: 'Saudi Arabia', cc: 'SA', lat: 26.471, lon: 49.798 }
];

// Gateways to the two holy cities.
window.HU_GATEWAYS = {
  JED: { code: 'JED', city: 'Jeddah', airport: 'King Abdulaziz International Airport', serves: 'Makkah', lat: 21.680, lon: 39.157 },
  MED: { code: 'MED', city: 'Madinah', airport: 'Prince Mohammad bin Abdulaziz International Airport', serves: 'Madinah', lat: 24.553, lon: 39.705 }
};

// Origins with a demo non-stop into Madinah (others connect via Jeddah or Riyadh).
window.HU_MED_NONSTOP = ['CAI', 'IST', 'KHI', 'LHE', 'ISB', 'KUL', 'CGK', 'DXB', 'RUH', 'DMM', 'DAC'];

// Visa pathways (demo summary of 2026 rules; always confirm against official sources).
//   none   – GCC citizens travel with their national ID / passport
//   evisa  – tourist eVisa allows Umrah; Umrah permit booked in Nusuk
//   agent  – Umrah visa only through a provider licensed by the Ministry of Hajj and Umrah
window.HU_NATIONALITIES = [
  { cc: 'IN', name: 'India', path: 'agent', bio: false },
  { cc: 'PK', name: 'Pakistan', path: 'agent', bio: true },
  { cc: 'BD', name: 'Bangladesh', path: 'agent', bio: true },
  { cc: 'ID', name: 'Indonesia', path: 'agent', bio: false },
  { cc: 'EG', name: 'Egypt', path: 'agent', bio: false },
  { cc: 'NG', name: 'Nigeria', path: 'agent', bio: false },
  { cc: 'MY', name: 'Malaysia', path: 'evisa' },
  { cc: 'TR', name: 'Türkiye', path: 'evisa' },
  { cc: 'GB', name: 'United Kingdom', path: 'evisa' },
  { cc: 'FR', name: 'France', path: 'evisa' },
  { cc: 'DE', name: 'Germany', path: 'evisa' },
  { cc: 'US', name: 'United States', path: 'evisa' },
  { cc: 'AE', name: 'United Arab Emirates', path: 'none' },
  { cc: 'KW', name: 'Kuwait', path: 'none' },
  { cc: 'SA', name: 'Saudi Arabia', path: 'none' }
];

// Samaa Al Haramain · Madinah packages (Saudia Hajj & Umrah), offered on the Madinah leg.
window.HU_PACKAGES = [
  {
    id: '1n', nights: 1, name: 'Taibah', kind: 'One-night package', duration: '2 days · 1 night', img: 'j-1n',
    price: { double: 4000, single: 3000 }, transport: false,
    text: 'A short and seamless Madinah stay, offering essential spiritual and heritage experiences with support from arrival to departure.',
    caption: 'Quba Mosque and the Quba Promenade',
    stops: [
      ['masjid-nabawi-b', 'The precincts of Al-Masjid an-Nabawi', 'A visit to Al Rawdah Al Sharifah'],
      ['seerah-museum', 'Seerah Museum'],
      ['safiyyah-museum-garden', 'Al-Safiyyah Museum & Garden'],
      ['ghamama-mosque', 'Al-Ghamamah Mosque'],
      ['jaddat-quba-walkway', 'Quba Promenade', 'Jaddat Quba'],
      ['quba-mosque-nafahat-quba', 'Nafahat Quba', 'Quba Mosque'],
      ['ala-khutah-gate', 'Ala Khutah', 'On His Footsteps'],
      ['mughaisilah-district', 'Al-Maghislah District', 'A cultural and historic experience']
    ]
  },
  {
    id: '2n', nights: 2, name: 'Al-Munawwarah', kind: 'Two-night package', duration: '3 days · 2 nights', img: 'j-2n',
    price: { double: 6000, single: 4500 }, transport: true, featured: true,
    text: 'Our signature Madinah experience, combining the city’s spiritual landmarks, heritage and local culture with time to experience each more meaningfully.',
    caption: 'Mount Uhud from the air',
    stops: [
      ['masjid-nabawi-b', 'The precincts of Al-Masjid an-Nabawi'],
      ['madinah-farms-a', 'Madinah farms', 'Traditional breakfast'],
      ['jabal-al-rumah-archers-hill', 'Jabal Al-Rumah (Archers’ Hill)', 'and the Uhud Martyrs area'],
      ['mount-uhud-a', 'Mount Uhud'],
      ['qiblatain-mosque', 'Masjid Al-Qiblatain', 'and the Downtown Al Madinah market'],
      ['bir-ghars-well', 'Bir Ghars', 'Madinah’s historic sites'],
      ['salman-al-farsi-well', 'Salman Al-Farisi Well', 'Madinah’s historic sites'],
      ['pmbs-arabic-calligraphy-center', 'Prince Mohammed bin Salman Global Center for Arabic Calligraphy']
    ]
  },
  {
    id: '3n', nights: 3, name: 'That Nakhl', kind: 'Three-night package', duration: '4 days · 3 nights', img: 'j-3n',
    price: { double: 8000, single: 6000 }, transport: true,
    text: 'This extended Madinah stay offers more time to immerse yourself in the city’s spiritual landmarks, heritage and local culture, with additional leisure and personal time.',
    caption: 'A palm grove in Madinah',
    stops: [
      ['masjid-nabawi-b', 'The precincts of Al-Masjid an-Nabawi'],
      ['madinah-farms-b', 'Madinah farms', 'Traditional breakfast'],
      ['al-fath-mosques', 'Al-Fath Mosques'],
      ['wadi-al-aqiq', 'Wadi Al-Aqiq'],
      ['king-fahd-quran-complex', 'King Fahd Glorious Qur’an Printing Complex'],
      ['jumuah-mosque', 'Al-Jumu’ah Mosque'],
      ['al-suqya-badr-route', 'Al-Suqya', 'and the road to the Battle of Badr'],
      ['urwa-bin-zubair-palace-well', 'Urwa ibn Al-Zubayr Palace & Well']
    ]
  }
];

window.HU_PACKAGE_INCLUDES = [
  'Airport Meet & Greet', 'Return airport transfers', 'Daily hotel breakfast', 'A visit to Al Rawdah Al Sharifah',
  'A specialised tour guide', 'Dedicated VIP transport throughout your journey', 'Guest Experience Consultant',
  'A traditional Madinah dinner'
];

// The Samaa Al Haramain partner hotel in Madinah (stay included in the packages above).
window.HU_WORTH = {
  code: 'WORTH', name: 'Peninsula Worth Hotel Madinah', brand: 'Worth Hotels', city: 'Madinah', stars: 5,
  desc: 'An exceptional stay offering the finest hospitality, carefully selected for you to enjoy comfort, proximity and distinction.',
  points: [
    'Elegant and comfortable accommodation in the heart of Madinah',
    'A variety of accommodation options to suit your needs',
    'Thoughtfully designed interiors that bring together comfort and elegance',
    'Ideal accommodation options for individuals, families and groups'
  ],
  images: ['hosp-arrival-900', 'hosp-stay-900', 'hosp-care-900'],
  source: 'samaa'
};

// Places to discover in Madinah (shown on the home page).
window.HU_DISCOVER = [
  { img: 'd-rawdah-m-800', cat: 'Inside the Prophet’s Mosque', name: 'Al Rawdah Al Sharifah', text: 'Between the Prophet’s ﷺ house and pulpit. Visits need a permit booked in advance through Nusuk.' },
  { img: 'd-quba-m-800', cat: 'The first mosque in Islam', name: 'Quba Mosque', text: 'Founded by the Prophet ﷺ on his arrival in Madinah, at the end of the 3 km Quba Promenade.' },
  { img: 'd-qiblatain-m-800', cat: 'Historic mosque', name: 'Masjid Al-Qiblatain', text: 'The mosque of the two qiblas, where the direction of prayer turned towards Makkah.' },
  { img: 'd-uhud-m-800', cat: 'History', name: 'Mount Uhud', text: 'The mountain the Prophet ﷺ loved, and the site of the Battle of Uhud and its martyrs.' },
  { img: 'd-farms-palms-m-800', cat: 'Heritage', name: 'Madinah farms', text: 'Palm groves and majlis seating for a traditional Madinah breakfast among the date palms.' },
  { img: 'd-maghislah-norow-m-800', cat: 'Culture', name: 'Al-Maghislah District', text: 'Restored old houses, crafts and coffee, about 900 m from the Prophet’s Mosque.' }
];
