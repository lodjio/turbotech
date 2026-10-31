// Activities search form → activities/results.html
document.getElementById('searchBtn').addEventListener('click', () => {
  const params = new URLSearchParams({
    to: document.getElementById('activity-search').value || 'Dubai'
  });
  window.location.href = `results.html?${params}`;
});
