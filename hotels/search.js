// Hotels (Stays) search form → hotels/results.html
const where = document.getElementById('stay-search');

window.LODJ_AUTOCOMPLETE(where, document.getElementById('stay-search-box'), window.LODJ_DESTINATION_SECTIONS);

document.getElementById('searchBtn').addEventListener('click', () => {
  const params = new URLSearchParams({
    to: where.value || 'Dubai',
    start: document.getElementById('stay-start').value,
    end: document.getElementById('stay-end').value,
    pax: document.getElementById('stay-pax').value
  });
  window.location.href = `results.html?${params}`;
});
