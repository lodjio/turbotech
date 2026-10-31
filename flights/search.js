// Flights search form → flights/results.html
const originInput = document.getElementById('flight-origin');
const destinationInput = document.getElementById('flight-destination');

const airportField = (input, box, label) => window.LODJ_AUTOCOMPLETE(input, document.getElementById(box), {
  label,
  options: window.LODJ_AIRPORT_OPTIONS
});

const originField = airportField(originInput, 'flight-origin-box', 'origin airport');
const destinationField = airportField(destinationInput, 'flight-destination-box', 'destination airport');
// One Way needs only a departure date; Round Trip / Multi City need both.
const endInput = document.getElementById('flight-end');
const tripType = () => (document.querySelector('.pill.active[data-trip]') || {}).dataset?.trip || 'oneway';

const dates = window.LODJ_DATE_RANGE(document.getElementById('flight-start'), endInput, {
  endRequired: () => tripType() !== 'oneway',
  startLabel: 'a departure date',
  endLabel: 'a return date'
});

function syncTripType() {
  const oneWay = tripType() === 'oneway';
  endInput.disabled = oneWay;
  document.getElementById('flight-end-field').classList.toggle('disabled', oneWay);
  if (oneWay) { endInput.value = ''; dates.clearEnd(); }
}
document.querySelectorAll('.pill[data-trip]').forEach(p => p.addEventListener('click', () => setTimeout(syncTripType)));
syncTripType();

document.getElementById('searchBtn').addEventListener('click', () => {
  const ok = [originField.validate(), destinationField.validate(), dates.validate()].every(Boolean);
  if (!ok) return;

  if (originInput.value === destinationInput.value) {
    const field = destinationInput.closest('.field');
    field.classList.add('invalid');
    field.querySelector('.field-error').textContent = 'Destination must differ from origin';
    return;
  }

  const params = new URLSearchParams({
    from: originInput.value,
    to: destinationInput.value,
    start: document.getElementById('flight-start').value,
    end: endInput.value,
    trip: tripType(),
    pax: document.getElementById('flight-pax').value
  });
  window.location.href = `results.html?${params}`;
});
