// Hotels (Stays) search form → hotels/results.html
// The dropdown offers destinations and individual hotels from hotels/data.js.
const where = document.getElementById('stay-search');

const hotelOptions = () => (window.LODJ_HOTELS || []).map(h => ({
  value: h.name,
  main: h.name,
  sub: h.location,
  tag: 'Hotel',
  section: 'Hotels',
  keys: [h.name, h.location]
}));

const whereField = window.LODJ_AUTOCOMPLETE(where, document.getElementById('stay-search-box'), {
  label: 'destination or hotel',
  options: () => [...window.LODJ_DESTINATION_OPTIONS(), ...hotelOptions()],
  featured: window.LODJ_TRENDING,
  emptyTitle: 'Trending searches'
});
const dates = window.LODJ_DATE_RANGE(document.getElementById('stay-start'), document.getElementById('stay-end'));

document.getElementById('searchBtn').addEventListener('click', () => {
  if (![whereField.validate(), dates.validate()].every(Boolean)) return;
  const params = new URLSearchParams({
    to: where.value,
    start: document.getElementById('stay-start').value,
    end: document.getElementById('stay-end').value,
    pax: document.getElementById('stay-pax').value
  });
  window.location.href = `results.html?${params}`;
});
