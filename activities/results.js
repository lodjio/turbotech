// Activities has no inventory yet. Add activities/data.js and card rendering here
// (see hotels/results.js for the pattern) when it's ready.
window.LODJ_RESULTS.setHeading('Activities are coming soon',
  `We're building activity supply for ${window.LODJ_RESULTS.search.to}. Check back shortly.`);

document.getElementById('resultsContainer').innerHTML = `
  <div class="empty-state">
    <div class="empty-icon">🎈</div>
    <div>No activities to show yet.</div>
    <a class="primary-btn" href="../hotels/results.html?to=${encodeURIComponent(window.LODJ_RESULTS.search.to)}">See stays instead</a>
  </div>`;
