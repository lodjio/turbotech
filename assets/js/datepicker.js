// Glass date-range picker used by every search form.
//
//   const dates = LODJ_DATE_RANGE(startInput, endInput, {
//     endRequired: () => true,          // false → single date (e.g. one-way flights)
//     startLabel: 'a check-in date',    // used in error messages
//     endLabel: 'a check-out date',
//     nightsLabel: true                 // show "3 nights" in the footer (stays)
//   });
//   dates.validate()  → true when the required dates are set
//   dates.clearEnd()
//
// startInput / endInput are hidden inputs holding ISO dates (YYYY-MM-DD). Each sits in a
// .date-field with a .date-display for the formatted date. One calendar picks the whole range:
// first click = start, second click = end. Past dates can't be selected.
(function () {
  const pad = (n) => String(n).padStart(2, '0');
  // Local dates only (toISOString() would shift to UTC and show the wrong day at night).
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayIso = () => iso(new Date());
  const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
  const nightsBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const MAX_DAYS_AHEAD = 365;

  const fmtField = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtMonth = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
  const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  window.LODJ_DATE_RANGE = function (startEl, endEl, opts = {}) {
    const endRequired = opts.endRequired || (() => true);
    const labels = { start: opts.startLabel || 'a start date', end: opts.endLabel || 'an end date' };
    const startField = startEl.closest('.field');
    const endField = endEl.closest('.field');

    // ---------- popover ----------
    const pop = document.createElement('div');
    pop.className = 'dp';
    pop.setAttribute('role', 'dialog');
    pop.innerHTML = `
      <div class="dp-head">
        <div class="dp-title"></div>
        <button type="button" class="dp-close" aria-label="Close calendar">✕</button>
      </div>
      <div class="dp-body">
        <button type="button" class="dp-nav dp-prev" aria-label="Previous month">‹</button>
        <div class="dp-months"></div>
        <button type="button" class="dp-nav dp-next" aria-label="Next month">›</button>
      </div>
      <div class="dp-foot">
        <div class="dp-summary"></div>
        <div class="dp-foot-actions">
          <button type="button" class="dp-clear">Clear</button>
          <button type="button" class="dp-done">Done</button>
        </div>
      </div>`;
    // Lives in <body> so the glass card's blur doesn't trap it (and the mobile sheet can sit on top).
    document.body.appendChild(pop);
    const $ = (s) => pop.querySelector(s);

    let view;          // first visible month
    let picking;       // 'start' | 'end'
    let hover = null;  // ISO date under the pointer while picking the end

    const isRange = () => endRequired();
    const monthsShown = () => (window.matchMedia('(max-width: 700px)').matches ? 1 : 2);
    const limitIso = () => { const d = new Date(); d.setDate(d.getDate() + MAX_DAYS_AHEAD); return iso(d); };

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

    function paintFields() {
      [[startEl, startField], [endEl, endField]].forEach(([el, field]) => {
        const display = field.querySelector('.date-display');
        display.textContent = el.value ? fmtField.format(parse(el.value)) : display.dataset.placeholder;
        field.classList.toggle('has-value', Boolean(el.value));
        field.classList.toggle('picking', pop.classList.contains('open') && ((el === startEl) === (picking === 'start')));
      });
    }

    function place() {
      if (window.matchMedia('(max-width: 700px)').matches) { pop.style.left = ''; pop.style.top = ''; return; }
      const fieldRect = startField.getBoundingClientRect();
      const width = pop.offsetWidth;
      const left = Math.max(16, Math.min(fieldRect.left, document.documentElement.clientWidth - width - 16));
      pop.style.left = `${left + window.scrollX}px`;
      pop.style.top = `${fieldRect.bottom + window.scrollY + 10}px`;
    }

    function render() {
      const focused = pop.contains(document.activeElement) ? document.activeElement.dataset.day : null;
      const today = todayIso();
      const limit = limitIso();
      const s = startEl.value;
      const e = endEl.value;
      const rangeEnd = e || (picking === 'end' && hover && s && hover > s ? hover : null);

      $('.dp-title').textContent = picking === 'start'
        ? `Select ${labels.start.replace(/^an? /, '')}`
        : `Select ${labels.end.replace(/^an? /, '')}`;

      let html = '';
      for (let m = 0; m < monthsShown(); m++) {
        const first = addMonths(view, m);
        const offset = (first.getDay() + 6) % 7; // Monday first
        const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
        html += `<div class="dp-month"><div class="dp-month-name">${fmtMonth.format(first)}</div><div class="dp-grid">`;
        html += WEEKDAYS.map(w => `<div class="dp-wd">${w}</div>`).join('');
        html += '<div class="dp-empty"></div>'.repeat(offset);
        for (let d = 1; d <= days; d++) {
          const day = iso(new Date(first.getFullYear(), first.getMonth(), d));
          const disabled = day < today || day > limit;
          const cls = ['dp-day'];
          if (day === today) cls.push('today');
          if (day === s) cls.push('start');
          if (day === rangeEnd) cls.push('end');
          if (s && rangeEnd && day > s && day < rangeEnd) cls.push('in-range');
          if (s && rangeEnd && isRange()) cls.push('has-range');
          html += `<button type="button" class="${cls.join(' ')}" data-day="${day}" ${disabled ? 'disabled' : ''}
                    aria-label="${fmtField.format(parse(day))}" aria-pressed="${day === s || day === rangeEnd}">${d}</button>`;
        }
        html += '</div></div>';
      }
      $('.dp-months').innerHTML = html;
      $('.dp-months').style.setProperty('--months', monthsShown());
      if (focused) {
        const again = pop.querySelector(`[data-day="${focused}"]`);
        if (again) again.focus({ preventScroll: true });
      }

      const atStart = view.getFullYear() === new Date().getFullYear() && view.getMonth() === new Date().getMonth();
      $('.dp-prev').disabled = atStart;
      $('.dp-next').disabled = addMonths(view, monthsShown()) > parse(limit);

      let summary = '';
      if (s && isRange() && (e || rangeEnd)) {
        const n = nightsBetween(s, e || rangeEnd);
        summary = `${fmtField.format(parse(s))} → ${fmtField.format(parse(e || rangeEnd))} · ${n} ${opts.nightsLabel ? `night${n === 1 ? '' : 's'}` : `day${n === 1 ? '' : 's'}`}`;
      } else if (s) {
        summary = isRange() ? `${fmtField.format(parse(s))} → choose ${labels.end.replace(/^an? /, '')}` : fmtField.format(parse(s));
      } else {
        summary = isRange() ? 'Pick your dates: first click is the start, second is the end' : 'Pick a date';
      }
      $('.dp-summary').textContent = summary;
      paintFields();
    }

    function open(which) {
      if (which === 'end' && endField.classList.contains('disabled')) return;
      picking = which === 'end' && startEl.value && isRange() ? 'end' : 'start';
      const anchor = (picking === 'end' && startEl.value) ? parse(startEl.value) : (startEl.value ? parse(startEl.value) : new Date());
      view = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      if (view < new Date(new Date().getFullYear(), new Date().getMonth(), 1)) view = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      pop.classList.add('open');
      document.body.classList.add('dp-open');
      render();
      place();
      const focusDay = pop.querySelector('.dp-day.end') || pop.querySelector('.dp-day.start') ||
        pop.querySelector('.dp-day.today') || pop.querySelector('.dp-day:not([disabled])');
      if (focusDay) focusDay.focus({ preventScroll: true });
    }

    function close() {
      pop.classList.remove('open');
      document.body.classList.remove('dp-open');
      hover = null;
      paintFields();
    }

    function pick(day) {
      if (picking === 'start' || !isRange()) {
        startEl.value = day;
        setError(startEl, '');
        if (endEl.value && endEl.value <= day) endEl.value = '';
        if (!isRange()) { render(); close(); return; }
        picking = 'end';
        render();
        return;
      }
      if (day <= startEl.value) {            // clicked before the start: restart the range there
        startEl.value = day;
        endEl.value = '';
        render();
        return;
      }
      endEl.value = day;
      setError(endEl, '');
      render();
      setTimeout(close, 180);
    }

    // ---------- events ----------
    const openFrom = (which) => (e) => { e.preventDefault(); open(which); };
    startField.addEventListener('click', openFrom('start'));
    endField.addEventListener('click', openFrom('end'));
    [startField, endField].forEach((field, i) => field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i ? 'end' : 'start'); }
    }));

    pop.addEventListener('click', (e) => {
      e.stopPropagation();
      const day = e.target.closest('.dp-day');
      if (day && !day.disabled) return pick(day.dataset.day);
      if (e.target.closest('.dp-prev')) { view = addMonths(view, -1); render(); }
      if (e.target.closest('.dp-next')) { view = addMonths(view, 1); render(); }
      if (e.target.closest('.dp-close') || e.target.closest('.dp-done')) close();
      if (e.target.closest('.dp-clear')) { startEl.value = ''; endEl.value = ''; picking = 'start'; render(); }
    });
    pop.addEventListener('mouseover', (e) => {
      const day = e.target.closest('.dp-day');
      if (picking !== 'end' || !day || day.disabled) return;
      if (hover !== day.dataset.day) { hover = day.dataset.day; render(); }
    });
    pop.addEventListener('keydown', (e) => {
      const day = e.target.closest('.dp-day');
      if (e.key === 'Escape') { close(); startField.focus(); return; }
      if (!day) return;
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step) return;
      e.preventDefault();
      const target = parse(day.dataset.day);
      target.setDate(target.getDate() + step);
      const t = iso(target);
      if (t < todayIso() || t > limitIso()) return;
      if (target < view || target >= addMonths(view, monthsShown())) {
        view = new Date(target.getFullYear(), target.getMonth() - (step > 0 ? monthsShown() - 1 : 0), 1);
        render();
      }
      const btn = pop.querySelector(`[data-day="${t}"]`);
      if (btn) btn.focus();
    });
    document.addEventListener('click', (e) => {
      if (!pop.classList.contains('open')) return;
      if (pop.contains(e.target) || startField.contains(e.target) || endField.contains(e.target)) return;
      close();
    });
    window.addEventListener('resize', () => { if (pop.classList.contains('open')) { render(); place(); } });

    paintFields();

    return {
      clearEnd() { endEl.value = ''; setError(endEl, ''); paintFields(); },
      validate() {
        const today = todayIso();
        let ok = true;
        if (!startEl.value) { setError(startEl, `Please choose ${labels.start}`); ok = false; }
        else if (startEl.value < today) { setError(startEl, 'Date is in the past'); ok = false; }
        if (endRequired()) {
          if (!endEl.value) { setError(endEl, `Please choose ${labels.end}`); ok = false; }
          else if (startEl.value && endEl.value <= startEl.value) { setError(endEl, 'Must be after the start date'); ok = false; }
        }
        // Open the calendar on the missing date (after the current click finishes).
        if (!ok) setTimeout(() => open(!startEl.value ? 'start' : 'end'), 0);
        return ok;
      }
    };
  };
})();
