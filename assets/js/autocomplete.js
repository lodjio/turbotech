// Generic dropdown autocomplete used by the search forms.
// getSections(query) returns [{ title, items: [{ value, main, sub, tag }] }].
window.LODJ_AUTOCOMPLETE = function attach(inputEl, boxEl, getSections) {
  function render() {
    const sections = getSections(inputEl.value.trim().toLowerCase());
    boxEl.innerHTML = sections.map(s => `
      <div class="auto-section-title">${s.title}</div>
      ${s.items.map(i => `
        <div class="auto-item" data-value="${i.value}">
          <div>
            <div class="auto-main">${i.main}</div>
            <div class="auto-sub">${i.sub}</div>
          </div>
          <div class="auto-tag">${i.tag}</div>
        </div>`).join('')}
    `).join('');
    boxEl.classList.add('show');
  }

  boxEl.addEventListener('click', (e) => {
    const item = e.target.closest('.auto-item');
    if (!item) return;
    inputEl.value = item.dataset.value;
    boxEl.classList.remove('show');
  });

  inputEl.addEventListener('focus', render);
  inputEl.addEventListener('input', render);
  document.addEventListener('click', (e) => {
    if (!inputEl.parentElement.contains(e.target)) boxEl.classList.remove('show');
  });
};

// Toggle pill groups (e.g. One Way / Round Trip).
document.querySelectorAll('.pills').forEach(group => {
  group.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});
