// Destinations used by search autocomplete (hotels, activities).
window.LODJ_DESTINATIONS = [
  { name: 'Jeddah', country: 'Saudi Arabia', tag: 'Trending' },
  { name: 'Mykonos', country: 'Greece', tag: 'Sponsored' },
  { name: 'Phuket', country: 'Thailand', tag: 'Trending' },
  { name: 'Krabi', country: 'Thailand', tag: 'Trending' },
  { name: 'Hong Kong', country: 'Hong Kong', tag: 'Sponsored' },
  { name: 'Red Sea', country: 'Saudi Arabia', tag: 'Sponsored' },
  { name: 'AlUla', country: 'Saudi Arabia', tag: 'Trending' },
  { name: 'Riyadh', country: 'Saudi Arabia', tag: 'Popular' },
  { name: 'Dubai', country: 'UAE', tag: 'Popular' },
  { name: 'Istanbul', country: 'Turkey', tag: 'Popular' },
  { name: 'London', country: 'United Kingdom', tag: 'Popular' },
  { name: 'Paris', country: 'France', tag: 'Popular' }
];

// Destination cards shown under the search forms.
window.LODJ_FEATURED_DESTINATIONS = {
  international: [
    { name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80' },
    { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80' },
    { name: 'Mykonos', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80' },
    { name: 'Hong Kong', image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1200&q=80' }
  ],
  domestic: [
    { name: 'Jeddah', image: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=900&q=80' },
    { name: 'Riyadh', image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=900&q=80' },
    { name: 'Red Sea', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80' },
    { name: 'AlUla', image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=900&q=80' }
  ]
};

// Dropdown options for destination fields.
window.LODJ_DESTINATION_OPTIONS = () => window.LODJ_DESTINATIONS.map(d => ({
  value: `${d.name}, ${d.country}`,
  main: d.name,
  sub: d.country,
  tag: d.tag,
  section: 'Destinations',
  keys: [d.name, d.country]
}));

window.LODJ_TRENDING = (opt) => ['Trending', 'Sponsored'].includes(opt.tag);
