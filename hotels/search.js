// Stays search form → hotels/results.html
// The dropdown offers every city, country and hotel in the Accor content (hotels/accor.js).
const where = document.getElementById('stay-search');
const options = window.LODJ_ACCOR.searchOptions();

const whereField = window.LODJ_AUTOCOMPLETE(where, document.getElementById('stay-search-box'), {
  label: 'city, country or hotel',
  options: () => options,
  featured: (opt) => opt.featured,
  emptyTitle: 'Popular cities'
});
const dates = window.LODJ_DATE_RANGE(document.getElementById('stay-start'), document.getElementById('stay-end'), {
  startLabel: 'a check-in date',
  endLabel: 'a check-out date'
});

document.getElementById('searchBtn').addEventListener('click', () => {
  if (![whereField.validate(), dates.validate()].every(Boolean)) return;
  const chosen = options.find(o => o.value === where.value);
  const params = new URLSearchParams({
    to: where.value,
    ...(chosen ? chosen.params : {}),
    start: document.getElementById('stay-start').value,
    end: document.getElementById('stay-end').value,
    pax: document.getElementById('stay-pax').value
  });
  window.location.href = `results.html?${params}`;
});
