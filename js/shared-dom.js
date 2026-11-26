/* VolleyLive shared DOM helpers. Loaded first by index.html and spectator.html.
   Every value inserted with innerHTML / insertAdjacentHTML that does not come from a constant must go through esc(). */
(function () {
  'use strict';
  var HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  // Escapes a value for use in HTML text and in quoted attribute values.
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return HTML_ESCAPES[c];
    });
  }

  window.VolleyDom = { esc: esc };
})();
