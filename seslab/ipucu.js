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
    // Periferik 3D bölüm düğmeleri (2026-11-21): yazı yerine simge, ad ipucunda. Tüm sistem 'genel' simgesini kullanır.
    // dış kulak: kepçe ve içindeki kıvrım
    bolumDis: '<path d="M7 9.5a5 5 0 0 1 10 0c0 2.8-1.6 3.9-2.7 5.3-1 1.3-1 2.4-1.6 3.4-.7 1.2-1.8 1.8-3 1.8-1.6 0-2.7-1.2-2.7-2.6"/>' +
      '<path d="M10 9.8a2 2 0 0 1 4 0c0 1.3-1.2 1.9-1.6 3"/><path d="M10.4 14.2c.9-.1 1.6.4 1.8 1.2"/>',
    // orta kulak: kulak zarı (yay) ve üç kemikçik (malleus, inkus, stapes)
    bolumOrta: '<path d="M5 4c-1.6 5.3-1.6 10.7 0 16"/><path d="M5.4 12.5L8.6 8.4l2.2 1.1"/><path d="M10.8 9.5l2.8-.8.6 4.6"/>' +
      '<path d="M14.2 13.3h2.2"/><path d="M16.4 10.6a2.2 2.6 0 0 0 0 5.4"/><path d="M16.4 10.6h3.2v5.4h-3.2"/>',
    // iç kulak: koklea sarmalı ve bir semisirküler kanal halkası
    bolumIc: '<path d="M15 15a1.2 1.2 0 1 1 1.2 1.2 2.6 2.6 0 0 1-2.6-2.6 4 4 0 0 1 4-4 5.2 5.2 0 0 1 5.2 5.2"/>' +
      '<path d="M13.6 13.6H11"/><path d="M11 13.6C6.5 14.5 3 12 3.2 8.2 3.4 4.8 6.6 3.4 9.2 4.4c2.4.9 2.9 3.6 1.8 5.6"/>',
    // sinirler: dallanan sinir lifi
    bolumSinir: '<path d="M3 12h6.5"/><path d="M9.5 12c2.5 0 3.5-4.5 7-5.5H21"/><path d="M9.5 12h11.5"/><path d="M9.5 12c2.5 0 3.5 4.5 7 5.5H21"/><circle cx="3.6" cy="12" r="1.1"/>',
    // çevre yapılar: kafatası (temporal kemik ve komşulukları)
    bolumCevre: '<path d="M5 11.5a7 7 0 0 1 14 0v2.6l-1.8 1v3.4h-2.7v-2h-5v2H6.8v-3.4l-1.8-1z"/><circle cx="9.4" cy="12" r="1.4"/><circle cx="14.6" cy="12" r="1.4"/>',
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
    // Düğmenin tam üstünde ortalı; çerçevenin sağından ya da solundan taşmaz (2026-11-21: sol alttaki düğmelerde kayıyordu)
    var kr = kap.getBoundingClientRect(), dr = dugme.getBoundingClientRect(), gen = e.offsetWidth;
    var sol = dr.left - kr.left + dr.width / 2 - gen / 2;
    e.style.right = 'auto';
    e.style.left = Math.round(Math.max(4, Math.min(kr.width - gen - 4, sol))) + 'px';
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
  // Büyüteç düğmesi (2026-11-21, bütün model ve animasyonlarda): basınca yakınlaşır, tekrar basınca uzaklaşır.
  // ayar: { yakinMi: function () → yakın mı, degistir: function () → yakın/uzak geçişi, yakinlastir/uzaklastir: function () → ipucu yazısı }
  function buyutec(dugme, ayar) {
    dugme.type = 'button';
    var ip = bagla(dugme, function () { return ayar.yakinMi() ? ayar.uzaklastir() : ayar.yakinlastir(); });
    var son = null;
    function yaz(zorla) { var y = !!ayar.yakinMi(); if (y === son && !zorla) return; son = y; simge(dugme, y ? 'buyutecEksi' : 'buyutecArti'); dugme.setAttribute('aria-pressed', y ? 'true' : 'false'); ip.yenile(); }
    dugme.addEventListener('click', function () { ayar.degistir(); yaz(); });
    yaz(true);
    return { yenile: function () { yaz(true); }, guncelle: function () { yaz(false); } };
  }
  window.SesLabIpucu = { bagla: bagla, simge: simge, gizle: gizle, buyutec: buyutec };
})();
