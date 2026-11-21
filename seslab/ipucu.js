/* Ses laboratuvarı: animasyon üstündeki yuvarlak simge düğmeleri için ortak yardımcı (2026-11-20).
   - Simgeler (SVG): oynat, duraklat, genel görünüm (çevresel işitme sisteminin sadeleştirilmiş çizimi: kepçe, dış kulak yolu,
     kulak zarı, kemikçik, koklea).
   - İpucu: fareyle üzerine gelince ya da parmakla uzun basınca (≈0,5 sn) düğmenin üstünde kısa yazı çıkar.
     Uzun basış düğmeye "tıklama" sayılmaz. Ekran okuyucu için aynı yazı aria-label olarak da yazılır.
   Kullanım: SesLabIpucu.bagla(dugme, function () { return 'yazı'; }); dugme.innerHTML yerine SesLabIpucu.simge(dugme, 'oynat').
   Renkler seslab.css → .sl-ipucu (--ink / --surface). */
(function () {
  'use strict';
  var SVG = {
    oynat: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
    duraklat: '<rect x="6.5" y="5.5" width="4" height="13" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5.5" width="4" height="13" rx="1" fill="currentColor" stroke="none"/>',
    // baş (yandan, burun sağda) ve üstü çizili hâli: Denge'de başı göster/gizle
    bas: '<path d="M8.5 20.5v-3.3C5.9 15.9 4.3 13.4 4.3 10.4 4.3 6.3 7.6 3.3 12 3.3s7.6 3 7.6 6.8c0 .8-.2 1.4 0 2l1.6 2.7c.2.4 0 .8-.4.9l-1.3.3v2.1c0 1-.8 1.8-1.8 1.8h-2.2v.6"/>',
    basYok: '<path d="M8.5 20.5v-3.3C5.9 15.9 4.3 13.4 4.3 10.4 4.3 6.3 7.6 3.3 12 3.3s7.6 3 7.6 6.8c0 .8-.2 1.4 0 2l1.6 2.7c.2.4 0 .8-.4.9l-1.3.3v2.1c0 1-.8 1.8-1.8 1.8h-2.2v.6" opacity=".45"/><path d="M3.5 3.5l17 17"/>',
    // büyüteç (yakınlaştır: +, uzaklaştır: −) — Denge'de uzak/yakın görünüm
    buyutecArti: '<circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2l5 5"/><path d="M7.8 10.5h5.4M10.5 7.8v5.4"/>',
    buyutecEksi: '<circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2l5 5"/><path d="M7.8 10.5h5.4"/>',
    // vestibüler sistem: vestibül (oval) ve üç semisirküler kanal — Denge'de "Başa dön"
    vestibuler: '<ellipse cx="10" cy="15.5" rx="3.4" ry="2.6"/><path d="M9 13.1C7.2 9.2 8.4 3.8 11.8 3.8c3.3 0 4.3 4 2.3 7.6l-2 2.6"/>' +
      '<path d="M13.3 15.6c2.9-1.3 6.9-1.5 7.4.9.5 2.6-3.4 3.9-7.6 2.4"/><path d="M6.8 14.6C3.9 13 2.6 9.6 4.2 8.3c1.5-1.2 3.6.6 4.4 3.2"/>',
    // yazı (T harfi) ve üstü çizili hâli: modeldeki ad yazılarını göster/gizle (İç kulak yapıları, Corti organı)
    yazi: '<path d="M5 6V4.5h14V6"/><path d="M12 4.5v15"/><path d="M9 19.5h6"/>',
    yaziYok: '<path d="M5 6V4.5h14V6" opacity=".45"/><path d="M12 4.5v15" opacity=".45"/><path d="M9 19.5h6" opacity=".45"/><path d="M3.5 3.5l17 17"/>',
    // kepçe (C biçimi) → dış kulak yolu → zar (dikey çizgi) → kemikçik (nokta) → koklea (sarmal)
    genel: '<path d="M8 3.5C5 3.5 3 6 3 9c0 2 .9 3.2 1.8 4.2.8.9 1.2 2 1.2 3.3 0 2 1.3 3.5 3.2 3.5"/>' +
      '<path d="M6 9.5c0-1.4.9-2.4 2.1-2.4"/><path d="M6.4 12H11"/><path d="M11.4 9.6v4.8"/><path d="M11.9 12.6l1.3-1.3 1.8.7"/>' +
      '<path d="M19 12A1 1 0 0 1 17 12 2 2 0 0 1 21 12 3 3 0 0 1 15 12"/>'
  };
  function simge(dugme, ad) {
    dugme.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (SVG[ad] || '') + '</svg>';
  }
  var acik = null, gizleZ = null;
  function goster(dugme, yazi) {
    gizle();
    var kap = dugme.closest('.g3d-sahne, .sl-g-sahne') || dugme.offsetParent || dugme.parentNode; if (!kap || !yazi) return;   // animasyon çerçevesine (düğme kutusu dar)
    var e = document.createElement('div'); e.className = 'sl-ipucu'; e.setAttribute('role', 'tooltip'); e.textContent = yazi;
    kap.appendChild(e);
    // Düğmenin üstünde; sağ kenardan taşmasın diye sağa hizalı
    var kr = kap.getBoundingClientRect(), dr = dugme.getBoundingClientRect();
    e.style.right = Math.max(4, kr.right - dr.right) + 'px';
    e.style.bottom = Math.max(4, kr.bottom - dr.top + 6) + 'px';
    acik = e;
  }
  function gizle() { if (gizleZ) { clearTimeout(gizleZ); gizleZ = null; } if (acik) { acik.remove(); acik = null; } }
  function bagla(dugme, yaziFn) {
    var basZ = null, uzunBasildi = false;
    function yaz() { var y = yaziFn(); dugme.setAttribute('aria-label', y); return y; }
    yaz();
    dugme.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') goster(dugme, yaz()); });
    dugme.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') gizle(); });
    dugme.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      uzunBasildi = false; clearTimeout(basZ);
      basZ = setTimeout(function () { uzunBasildi = true; goster(dugme, yaz()); gizleZ = setTimeout(gizle, 1800); }, 500);
    });
    ['pointerup', 'pointercancel'].forEach(function (t) { dugme.addEventListener(t, function () { clearTimeout(basZ); }); });
    dugme.addEventListener('click', function (e) {
      if (uzunBasildi) { uzunBasildi = false; e.preventDefault(); e.stopImmediatePropagation(); return; }   // uzun basış tıklama sayılmaz
      if (acik && e.detail) gizle();
    }, true);
    dugme.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    dugme.addEventListener('blur', gizle);
    return { yenile: function () { var y = yaz(); if (acik && acik.parentNode && acik.parentNode.contains(dugme)) acik.textContent = y; } };
  }
  window.SesLabIpucu = { bagla: bagla, simge: simge, gizle: gizle };
})();
