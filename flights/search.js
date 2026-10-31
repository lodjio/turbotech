// Flights search form → flights/results.html
const originInput = document.getElementById('flight-origin');
const destination = document.getElementById('flight-destination');

function airportSections(q) {
  const all = window.LODJ_AIRPORTS;
  const matches = q
    ? all.filter(a => [a.code, a.city, a.airport, a.country].some(v => v.toLowerCase().includes(q)))
    : all;
  return [{
    title: 'Airports',
    items: matches.slice(0, 8).map(a => ({
      value: `${a.code} - ${a.city}`, main: `${a.code} - ${a.city}`, sub: `${a.airport}, ${a.country}`, tag: 'Airport'
    }))
  }];
}

window.LODJ_AUTOCOMPLETE(originInput, document.getElementById('flight-origin-box'), airportSections);
window.LODJ_AUTOCOMPLETE(destination, document.getElementById('flight-destination-box'), airportSections);

document.getElementById('searchBtn').addEventListener('click', () => {
  const params = new URLSearchParams({
    from: originInput.value || 'JED',
    to: destination.value || 'DXB',
    start: document.getElementById('flight-start').value,
    end: document.getElementById('flight-end').value,
    pax: document.getElementById('flight-pax').value
  });
  window.location.href = `results.html?${params}`;
});
