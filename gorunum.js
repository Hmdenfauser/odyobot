/* Görünüm (açık/koyu) seçimi: her kullanıcı kendi cihazında seçer.
   Ana sayfadaki tek simge düğmesi her dokunuşta sırayla değiştirir: Otomatik → Açık → Koyu → Otomatik.
   "Otomatik" cihazın moduna uyar; "Açık"/"Koyu" <html data-theme="light|dark"> yazar (renkler styles.css'te).
   Seçim yalnızca bu cihazda (localStorage 'odybot:gorunum') saklanır. Sayfa açılırken renk sıçramasın diye <head>'de yüklenir. */
(function () {
  var ANAHTAR = 'odybot:gorunum';
  var SIRA = ['auto', 'light', 'dark'];
  var AD = { auto: 'Otomatik', light: 'Açık', dark: 'Koyu' };
  var RENK = { light: '#F2F5F6', dark: '#0C1A1F' }; // tarayıcı üst çubuğu (theme-color), styles.css --bg ile aynı
  var YAZI_SURE = 1500;
  var yaziZamani = null;
  var simdiki = 'auto';

  function oku() { try { var d = localStorage.getItem(ANAHTAR); return d === 'light' || d === 'dark' ? d : 'auto'; } catch (e) { return 'auto'; } }
  function kaydet(d) { try { if (d === 'auto') localStorage.removeItem(ANAHTAR); else localStorage.setItem(ANAHTAR, d); } catch (e) { /* kaydedilemezse yalnızca bu açılışta geçerli */ } }

  function uygula(d) {
    simdiki = d;
    var kok = document.documentElement;
    if (d === 'auto') kok.removeAttribute('data-theme'); else kok.setAttribute('data-theme', d);
    var metalar = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metalar.length; i++) {
      var m = metalar[i];
      if (!m.hasAttribute('data-ilk')) m.setAttribute('data-ilk', m.getAttribute('content') || '');
      m.setAttribute('content', d === 'auto' ? m.getAttribute('data-ilk') : RENK[d]);
    }
    var dugme = document.getElementById('gorunum-dugme');
    if (dugme) {
      dugme.setAttribute('aria-label', 'Görünüm: ' + AD[d] + '. Değiştirmek için dokun.');
      dugme.setAttribute('title', 'Görünüm: ' + AD[d]);
      var ikonlar = dugme.querySelectorAll('[data-ikon]');
      for (var j = 0; j < ikonlar.length; j++) {
        if (ikonlar[j].getAttribute('data-ikon') === d) ikonlar[j].removeAttribute('hidden'); else ikonlar[j].setAttribute('hidden', '');
      }
    }
  }

  function yaziGoster(metin) {
    var el = document.getElementById('gorunum-yazi');
    if (!el) return;
    el.textContent = metin;
    el.classList.add('acik');
    clearTimeout(yaziZamani);
    yaziZamani = setTimeout(function () { el.classList.remove('acik'); }, YAZI_SURE);
  }

  uygula(oku()); // <head>'de: sayfa çizilmeden önce
  document.addEventListener('DOMContentLoaded', function () {
    uygula(oku());
    var dugme = document.getElementById('gorunum-dugme');
    if (!dugme) return;
    dugme.addEventListener('click', function () {
      var d = SIRA[(SIRA.indexOf(simdiki) + 1) % SIRA.length];
      kaydet(d);
      uygula(d);
      yaziGoster('Görünüm: ' + AD[d]);
    });
  });
})();
