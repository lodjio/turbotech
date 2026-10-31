// Shared logic for every results page: reads the search from the URL,
// fills the summary bar, and provides the demo pricing helpers.
(function () {
  const params = new URLSearchParams(window.location.search);
  const search = {
    from: params.get('from') || 'Anywhere',
    to: params.get('to') || 'Trending destinations',
    start: params.get('start') || 'Any selected date',
    end: params.get('end') || 'Any selected date',
    pax: params.get('pax') || ''
  };

  const vertical = window.LODJ_VERTICALS.find(v => v.id === document.body.dataset.vertical);

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('summaryType', vertical.label);
  setText('summaryRoute', vertical.id === 'flights' ? `${search.from} → ${search.to}` : search.to);
  setText('summaryStart', search.start);
  setText('summaryEnd', search.end);

  const modify = document.getElementById('modifySearch');
  if (modify) modify.href = './';

  // Filters sidebar show / hide
  const toggleBtn = document.getElementById('toggleFiltersBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const hidden = document.getElementById('sidebar').classList.toggle('hidden');
      document.getElementById('layout').classList.toggle('filters-hidden', hidden);
      toggleBtn.textContent = hidden ? 'Show' : 'Hide';
    });
  }

  // Share note
  const note = document.getElementById('floatingNote');
  if (note) {
    const p = search.pax.toLowerCase();
    note.textContent = (p.includes('2') && (p.includes('adult') || p.includes('traveler')))
      ? 'Take a screenshot and send it to your significant other to book your holiday now and create some memories'
      : 'Take a screenshot to share it with your friends and take it outside the group chat.';
  }

  // ---- Demo pricing (deterministic per search, so refreshes look stable) ----
  function seededHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
    return Math.abs(h);
  }

  // 'stays' kept as the hotels key so demo prices match the original site.
  const seedKey = vertical.id === 'hotels' ? 'stays' : vertical.id;
  const seedBase = seededHash([seedKey, search.start, search.end, search.from, search.to, search.pax].join('|'));
  const pick = (list, seed, offset = 0) => list[(seed + offset) % list.length];

  window.LODJ_RESULTS = {
    search,
    seedBase,
    pick,
    urgencyTexts: [
      'Only 2 left at this price',
      'Booked 11 times in the last hour',
      'Price may jump soon',
      'High demand for selected dates',
      'Deal refreshed today',
      'Popular booking right now'
    ],
    discountedPrice(min, max, index, discounts) {
      const seed = seedBase + index * 19;
      const base = min + (seed % (max - min + 1));
      const discount = pick(discounts, seed, index);
      return { oldPrice: base, newPrice: Math.round(base * (1 - discount / 100)), discount };
    },
    regularPrice(min, max, index) {
      return Math.round(min + ((seedBase + index * 29) % (max - min + 1)));
    },
    formatSAR: (n) => `SAR ${n.toLocaleString()}`,
    setHeading(title, sub) {
      setText('resultsTitle', title);
      setText('resultsSub', sub);
    },
    // Placeholder for verticals that don't have inventory yet.
    comingSoon(what) {
      setText('resultsTitle', `${vertical.label} are coming soon`);
      setText('resultsSub', `We're building ${what} supply for ${search.to}. Check back shortly.`);
      document.getElementById('resultsContainer').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${vertical.icon}</div>
          <div>No ${what} to show yet.</div>
          <a class="primary-btn" href="../hotels/results.html?to=${encodeURIComponent(search.to)}">See stays instead</a>
        </div>`;
    }
  };
})();
