/* Yasal metinler sayfası (4. adım, 2026-11-21): #yasal/uyari, #yasal/kosullar, #yasal/kvkk, #yasal/gizlilik.
   Metinler index.html #yasal içinde (her paragraf yönetici düzenler). Bu dosya yalnızca hangi metnin görüneceğini seçer
   ve geri okunu yönetir (geldiğin sayfaya döner; doğrudan açıldıysa Ayarlar'a). */
(function () {
  'use strict';
  var SAYFALAR = ['uyari', 'kosullar', 'kvkk', 'gizlilik'], geldi = false;
  function goster() {
    var p = (location.hash || '').replace('#', '').split('/');
    if (p[0] !== 'yasal') { geldi = true; return; }
    var k = SAYFALAR.indexOf(p[1]) >= 0 ? p[1] : 'uyari';
    [].forEach.call(document.querySelectorAll('#yasal .yasal-sayfa'), function (a) { a.hidden = a.getAttribute('data-yasal') !== k; });
  }
  document.getElementById('yasal-geri').addEventListener('click', function (e) {
    if (geldi && history.length > 1) { e.preventDefault(); history.back(); }
  });
  window.addEventListener('hashchange', goster);
  goster();
})();
