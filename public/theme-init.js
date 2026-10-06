// Pone el tema antes de que cargue la página para que no parpadee. Es un archivo aparte porque la CSP no permite scripts en línea.
(function () {
  try {
    var m = localStorage.getItem('relevo.theme');
    var dark = m === 'dark' || (m !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) { /* sin almacenamiento: queda el tema claro */ }
})();
