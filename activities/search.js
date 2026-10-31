// Activities search form → activities/results.html
const where = document.getElementById('activity-search');

const whereField = window.LODJ_AUTOCOMPLETE(where, document.getElementById('activity-search-box'), {
  label: 'destination',
  options: window.LODJ_DESTINATION_OPTIONS,
  featured: window.LODJ_TRENDING,
  emptyTitle: 'Trending searches'
});

document.getElementById('searchBtn').addEventListener('click', () => {
  if (!whereField.validate()) return;
  window.location.href = `results.html?${new URLSearchParams({ to: where.value })}`;
});
