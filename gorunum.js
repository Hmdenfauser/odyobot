/* Tema (açık/koyu görünüm) seçimi: her kullanıcı kendi cihazında seçer.
   Ayarlar sayfasındaki üç düğme (data-gorunum="auto|light|dark"): Otomatik / Açık / Koyu (2026-11-15; önceden ana sayfada tek döngülü düğmeydi).
   "Otomatik" cihazın moduna uyar; "Açık"/"Koyu" <html data-theme="light|dark"> yazar (renkler styles.css'te).
   Seçim yalnızca bu cihazda (localStorage 'odybot:gorunum') saklanır. Sayfa açılırken renk sıçramasın diye <head>'de yüklenir. */
(function () {
  var ANAHTAR = 'odybot:gorunum';
  var RENK = { light: '#F2F5F6', dark: '#0C1A1F' }; // tarayıcı üst çubuğu (theme-color), styles.css --bg ile aynı

  function oku() { try { var d = localStorage.getItem(ANAHTAR); return d === 'light' || d === 'dark' ? d : 'auto'; } catch (e) { return 'auto'; } }
  function kaydet(d) { try { if (d === 'auto') localStorage.removeItem(ANAHTAR); else localStorage.setItem(ANAHTAR, d); } catch (e) { /* kaydedilemezse yalnızca bu açılışta geçerli */ } }

  function uygula(d) {
    var kok = document.documentElement;
    if (d === 'auto') kok.removeAttribute('data-theme'); else kok.setAttribute('data-theme', d);
    var metalar = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metalar.length; i++) {
      var m = metalar[i];
      if (!m.hasAttribute('data-ilk')) m.setAttribute('data-ilk', m.getAttribute('content') || '');
      m.setAttribute('content', d === 'auto' ? m.getAttribute('data-ilk') : RENK[d]);
    }
    var dugmeler = document.querySelectorAll('[data-gorunum]');
    for (var j = 0; j < dugmeler.length; j++) {
      dugmeler[j].setAttribute('aria-pressed', dugmeler[j].getAttribute('data-gorunum') === d ? 'true' : 'false');
    }
  }

  uygula(oku()); // <head>'de: sayfa çizilmeden önce
  document.addEventListener('DOMContentLoaded', function () {
    uygula(oku());
    var dugmeler = document.querySelectorAll('[data-gorunum]');
    for (var i = 0; i < dugmeler.length; i++) {
      dugmeler[i].addEventListener('click', function () {
        var d = this.getAttribute('data-gorunum');
        kaydet(d);
        uygula(d);
      });
    }
  });
})();
