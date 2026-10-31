// Dark / light mode, remembered across pages.
(function () {
  const KEY = 'lodj-theme';

  function read() {
    try { return localStorage.getItem(KEY) || 'dark'; } catch (e) { return 'dark'; }
  }

  function apply(theme) {
    document.body.classList.toggle('light-mode', theme === 'light');
    try { localStorage.setItem(KEY, theme); } catch (e) { /* storage unavailable */ }
  }

  window.LODJ_THEME = {
    init() {
      apply(read());
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-theme-toggle]')) {
          apply(document.body.classList.contains('light-mode') ? 'dark' : 'light');
        }
      });
    }
  };
})();
