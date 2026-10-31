// Search field dropdowns with wildcard matching and validation.
//
//   const field = LODJ_AUTOCOMPLETE(inputEl, boxEl, {
//     label: 'destination',             // used in error messages
//     options: () => [...],             // [{ value, main, sub, tag, section, keys: [...] }]
//     featured: (opt) => true,          // optional: which options to show before typing
//     emptyTitle: 'Trending searches'   // optional: dropdown heading before typing
//   });
//   field.validate()  → true if the value is one of the options (shows an error if not)
//
// Matching: plain text matches anywhere ("dub" → Dubai). Wildcards are supported:
//   *  any number of characters   ("Du*" → Dubai, "*port" → Heathrow Airport)
//   ?  exactly one character      ("D?B" → DXB)
(function () {
  const MAX_RESULTS = 8;

  function matcher(query) {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    if (/[*?]/.test(q)) {
      const pattern = q.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
      const re = new RegExp(`^${pattern}$`);
      return (text) => re.test(text);
    }
    return (text) => text.includes(q);
  }

  function searchKeys(opt) {
    return [opt.value, opt.main, opt.sub, ...(opt.keys || [])]
      .filter(Boolean)
      .map(k => String(k).toLowerCase());
  }

  function filterOptions(all, query) {
    const test = matcher(query);
    if (!test) return all;
    return all.filter(opt => searchKeys(opt).some(test));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  window.LODJ_AUTOCOMPLETE = function attach(inputEl, boxEl, config) {
    const field = inputEl.closest('.field');
    let errorEl = field.querySelector('.field-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      field.appendChild(errorEl);
    }

    let shown = [];
    let activeIndex = -1;

    function clearError() {
      field.classList.remove('invalid');
      errorEl.textContent = '';
    }

    function showError(msg) {
      field.classList.add('invalid');
      errorEl.textContent = msg;
    }

    function render() {
      const all = config.options();
      const query = inputEl.value;
      shown = query.trim()
        ? filterOptions(all, query).slice(0, MAX_RESULTS)
        : all.filter(config.featured || (() => true)).slice(0, MAX_RESULTS);
      activeIndex = -1;

      if (!shown.length) {
        boxEl.innerHTML = `
          <div class="auto-empty">No matches for “${escapeHtml(query.trim())}”.</div>
          <div class="auto-hint">Tip: use * as a wildcard, e.g. <b>Du*</b> or <b>*bai</b></div>`;
      } else {
        let html = '';
        let lastSection = null;
        shown.forEach((opt, i) => {
          const section = (!query.trim() && config.emptyTitle) || opt.section || 'Results';
          if (section !== lastSection) {
            html += `<div class="auto-section-title">${escapeHtml(section)}</div>`;
            lastSection = section;
          }
          html += `
            <div class="auto-item" data-index="${i}">
              <div>
                <div class="auto-main">${escapeHtml(opt.main)}</div>
                <div class="auto-sub">${escapeHtml(opt.sub || '')}</div>
              </div>
              ${opt.tag ? `<div class="auto-tag">${escapeHtml(opt.tag)}</div>` : ''}
            </div>`;
        });
        html += '<div class="auto-hint">Tip: use * as a wildcard, e.g. <b>Du*</b> or <b>*bai</b></div>';
        boxEl.innerHTML = html;
      }
      boxEl.classList.add('show');
    }

    function choose(opt) {
      inputEl.value = opt.value;
      boxEl.classList.remove('show');
      clearError();
    }

    function highlight(i) {
      const items = boxEl.querySelectorAll('.auto-item');
      items.forEach(el => el.classList.remove('active'));
      if (items[i]) {
        items[i].classList.add('active');
        items[i].scrollIntoView({ block: 'nearest' });
      }
      activeIndex = i;
    }

    boxEl.addEventListener('mousedown', (e) => {
      const item = e.target.closest('.auto-item');
      if (!item) return;
      e.preventDefault();
      choose(shown[Number(item.dataset.index)]);
    });

    inputEl.addEventListener('focus', render);
    inputEl.addEventListener('input', () => { clearError(); render(); });
    inputEl.addEventListener('keydown', (e) => {
      if (!boxEl.classList.contains('show')) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(activeIndex + 1, shown.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(activeIndex - 1, 0)); }
      else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); choose(shown[activeIndex]); }
      else if (e.key === 'Escape') { boxEl.classList.remove('show'); }
    });
    document.addEventListener('click', (e) => {
      if (!field.contains(e.target)) boxEl.classList.remove('show');
    });

    return {
      // Accepts the value if it is (or uniquely matches) one of the options.
      validate() {
        const value = inputEl.value.trim();
        const all = config.options();
        if (!value) {
          showError(`Please choose ${/^[aeiou]/i.test(config.label) ? 'an' : 'a'} ${config.label}`);
          return false;
        }
        const exact = all.find(o => o.value.toLowerCase() === value.toLowerCase());
        if (exact) { choose(exact); return true; }
        const matches = filterOptions(all, value);
        if (matches.length === 1) { choose(matches[0]); return true; }
        showError(matches.length
          ? `“${value}” matches ${matches.length} options. Pick one from the list`
          : `No ${config.label} matches “${value}”`);
        render();
        inputEl.focus();
        return false;
      }
    };
  };

  // Date pair (departure/return, check-in/check-out).
  // Both dates are required unless `endRequired()` says otherwise (e.g. one-way flights).
  // No past dates; the end date can't be before the start date.
  window.LODJ_DATE_RANGE = function (startEl, endEl, opts = {}) {
    const endRequired = opts.endRequired || (() => true);
    const labels = { start: opts.startLabel || 'a start date', end: opts.endLabel || 'an end date' };
    const today = new Date().toISOString().slice(0, 10);
    startEl.min = today;
    endEl.min = today;
    startEl.addEventListener('change', () => { endEl.min = startEl.value || today; });

    function setError(el, msg) {
      const field = el.closest('.field');
      let errorEl = field.querySelector('.field-error');
      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        field.appendChild(errorEl);
      }
      field.classList.toggle('invalid', Boolean(msg));
      errorEl.textContent = msg || '';
    }

    [startEl, endEl].forEach(el => el.addEventListener('change', () => setError(el, '')));

    return {
      clearEnd() { setError(endEl, ''); },
      validate() {
        let ok = true;
        const needEnd = endRequired();
        if (!startEl.value) { setError(startEl, `Please choose ${labels.start}`); ok = false; }
        else if (startEl.value < today) { setError(startEl, 'Date is in the past'); ok = false; }
        if (needEnd) {
          if (!endEl.value) { setError(endEl, `Please choose ${labels.end}`); ok = false; }
          else if (endEl.value < today) { setError(endEl, 'Date is in the past'); ok = false; }
          else if (startEl.value && endEl.value < startEl.value) { setError(endEl, 'Must be after the start date'); ok = false; }
        }
        return ok;
      }
    };
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
})();
