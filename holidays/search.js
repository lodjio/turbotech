// Holidays (packages) search form → holidays/results.html
const fromInput = document.getElementById('holiday-from');
const toInput = document.getElementById('holiday-to');

const fromField = window.LODJ_AUTOCOMPLETE(fromInput, document.getElementById('holiday-from-box'), {
  label: 'departure airport',
  options: window.LODJ_AIRPORT_OPTIONS
});
const toField = window.LODJ_AUTOCOMPLETE(toInput, document.getElementById('holiday-to-box'), {
  label: 'destination',
  options: window.LODJ_DESTINATION_OPTIONS,
  featured: window.LODJ_TRENDING,
  emptyTitle: 'Trending holidays'
});
const dates = window.LODJ_DATE_RANGE(document.getElementById('holiday-start'), document.getElementById('holiday-end'), {
  startLabel: 'a departure date',
  endLabel: 'a return date',
  nightsLabel: true
});

document.getElementById('searchBtn').addEventListener('click', () => {
  if (![fromField.validate(), toField.validate(), dates.validate()].every(Boolean)) return;
  const params = new URLSearchParams({
    from: fromInput.value,
    to: toInput.value,
    start: document.getElementById('holiday-start').value,
    end: document.getElementById('holiday-end').value,
    pax: document.getElementById('holiday-pax').value
  });
  window.location.href = `results.html?${params}`;
});
