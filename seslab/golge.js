/* Ses laboratuvarı: Baş gölgesi (#seslab/golge, 2026-11-20).
   Üstten görülen bir baş ve soldaki ses kaynağından çıkan dalgalar (2D canvas, kütüphanesiz).
   Dalga boyu baştan büyükse dalga başın çevresinden dolaşır (kırınım), küçükse başın arkasında gölge kalır.
   Kaynak: proje sahibinin ders notları (İşitme Teorileri ve Psikoakustik 2. ders slayt 72, 3. ders slayt 5;
   İşitme ve Denge Sistemleri-2 s. 22–24). Ekrandaki sayısal değerler yalnızca bu notlardan; gölgenin koyuluğu şematiktir.
   Hesaplar (dalgaBoyu, sinif, gorselDb) ekrandan bağımsızdır; Node ile test: node testler/golge-test.js
   Yazılar seslab-veri.js → golge (yönetici düzenler: icerik/sl.golge). Renkler seslab.css → --sl-g-*. */
(function (kok) {
  'use strict';
  var SES_HIZI = 343;          // m/s, oda sıcaklığında havada
  var BAS_GENISLIGI = 0.18;    // m, yaklaşık (şematik kabul)
  var SINIR_HZ = 1500;         // ders notu: 1500 Hz ve üstü gölgeden daha çok etkilenir

  function dalgaBoyu(f) { return SES_HIZI / f; }
  // 'buyuk': dalga boyu baştan büyük (ses dolaşır); 'kucuk': baştan küçük (gölge)
  function sinif(f, bas) { return dalgaBoyu(f) > (bas || BAS_GENISLIGI) ? 'buyuk' : 'kucuk'; }
  // Ders notundaki azalma aralığı: alçak frekans yaklaşık 3–6 dB, 1500 Hz ve üstü yaklaşık 20 dB veya daha fazla
  function notAraligi(f) { return f >= SINIR_HZ ? 'yuksek' : 'alcak'; }
  // Yalnızca çizim için (ekranda sayı olarak gösterilmez): 500 Hz'de ~4 dB'den 4000 Hz'de ~22 dB'ye yumuşak geçiş.
  function gorselDb(f) {
    var x = (Math.log(f / 500) / Math.LN2) / 3; x = Math.max(0, Math.min(1, x));
    return 4 + 18 * x * x * (3 - 2 * x);
  }
  function smooth(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function sayi(x, b) { return x.toFixed(b).replace('.', ','); }
  function uzunlukYaz(m) { return m >= 1 ? sayi(m, 2) + ' m' : Math.round(m * 100) + ' cm'; }

  var hesap = { dalgaBoyu: dalgaBoyu, sinif: sinif, notAraligi: notAraligi, gorselDb: gorselDb, uzunlukYaz: uzunlukYaz, SINIR_HZ: SINIR_HZ, BAS_GENISLIGI: BAS_GENISLIGI };
  if (typeof module !== 'undefined' && module.exports) { module.exports = hesap; return; }

  function el(ad, ozellik, cocuklar) {
    var e = document.createElement(ad);
    if (ozellik) Object.keys(ozellik).forEach(function (k) {
      if (k === 'text') e.textContent = ozellik[k]; else if (k === 'class') e.className = ozellik[k]; else e.setAttribute(k, ozellik[k]);
    });
    (cocuklar || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  // Mantıksal çizim alanı (CSS pikseli değil; ekrana ölçeklenir)
  var W = 360, H = 240, R = 22;                 // baş yarıçapı: 44 birim = 18 cm
  var PXM = (2 * R) / BAS_GENISLIGI;           // metre başına birim
  var S = { x: 22, y: H / 2 }, C = { x: 232, y: H / 2 };
  var HIZ = 42;                                 // dalganın ekrandaki hızı (birim/sn, yavaşlatılmış)
  var IZ = 2;                                   // alan hesabının ızgara adımı

  function kur(kokEl, ayar) {
    var veri = ayar.veri, M = veri.golge, frekanslar = M.frekanslar || [250, 500, 1000, 2000, 4000, 8000];
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var f = 500, oynuyor = !reduce, calisiyor = false, zaman = 0, son = 0, kare = null, renk = null;

    var kap = el('div', { 'class': 'sl sl-golge' });
    var cv = el('canvas', { 'class': 'sl-g-tuval', role: 'img' });
    var oynat = el('button', { type: 'button', 'class': 'sl-g-oynat' });
    var sahne = el('div', { 'class': 'sl-g-sahne' }, [cv, oynat]);
    var frBaslik = el('h3', { 'class': 'g3d-baslik' });
    var frTus = el('div', { 'class': 'sl-g-frekans', role: 'group' });
    var bilgi = el('p', { 'class': 'sl-g-bilgi' });
    var durum = el('p', { 'class': 'sl-g-durum', 'aria-live': 'polite' });
    var azalma = el('p', { 'class': 'sl-g-azalma' });
    function olcer(sinifAd) {
      var ad = el('span', { 'class': 'sl-g-olcer-ad' }), dol = el('span', { 'class': 'sl-g-olcer-dolu ' + sinifAd });
      return { kok: el('div', { 'class': 'sl-g-olcer' }, [ad, el('span', { 'class': 'sl-g-olcer-cubuk', 'aria-hidden': 'true' }, [dol])]), ad: ad, dol: dol };
    }
    var yakin = olcer('sol'), uzak = olcer('sag');
    var kart = el('article', { 'class': 'card sl-g-kart' });
    var aciklamaB = el('h3', { 'class': 'g3d-baslik' }), aciklama = el('p', { 'class': 'sl-g-aciklama' });
    var uyari = el('p', { 'class': 'note' }), kaynak = el('p', { 'class': 'note' });
    var duzen = el('div', { 'class': 'sl-g-duzen' });
    kart.appendChild(aciklamaB); kart.appendChild(aciklama);
    [sahne, frBaslik, frTus, bilgi, durum, el('div', { 'class': 'sl-g-olcerler' }, [yakin.kok, uzak.kok]), azalma, kart, uyari, kaynak, duzen]
      .forEach(function (x) { kap.appendChild(x); });
    kokEl.appendChild(kap);

    var tuslar = frekanslar.map(function (fr) {
      var b = el('button', { type: 'button', 'class': 'sl-g-ftus', 'aria-pressed': 'false', text: fr >= 1000 ? (fr / 1000) + 'k' : String(fr) });
      b.setAttribute('aria-label', fr + ' Hz');
      b.addEventListener('click', function () { f = fr; yaz(); ciz(); });
      frTus.appendChild(b); return b;
    });
    oynat.addEventListener('click', function () { oynuyor = !oynuyor; yaz(); if (oynuyor) basla(); });

    // ---- renkler (CSS değişkenlerinden; açık/koyu değişince yenile() çağrılır)
    var olcu = document.createElement('canvas').getContext('2d');
    function rgb(css) {
      olcu.fillStyle = '#000'; olcu.fillStyle = css || '#000';
      var s = olcu.fillStyle, m;
      if (s[0] === '#') return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)];
      m = s.match(/\d+(\.\d+)?/g); return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
    }
    function renkOku() {
      var st = getComputedStyle(kap), v = function (n) { return st.getPropertyValue(n).trim(); };
      renk = { zemin: rgb(v('--surface')), dalga: rgb(v('--sl-g-dalga')), golge: rgb(v('--sl-g-golge')),
        zeminCss: v('--surface'), bas: v('--sl-g-bas'), basKenar: v('--sl-g-bas-kenar'), sol: v('--left'), sag: v('--right'), yazi: v('--ink'), soluk: v('--muted') };
    }

    // ---- alan: her ızgara noktasında dalga genliği (kaynaktan uzaklık + başın gölgesi)
    var kucuk = document.createElement('canvas'), kctx = kucuk.getContext('2d');
    kucuk.width = W / IZ; kucuk.height = H / IZ;
    var img = kctx.createImageData(kucuk.width, kucuk.height);
    function zayiflama(px, py, lam, D, ka) {
      var dx = px - S.x, dy = py - S.y, r = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / r, uy = dy / r;
      var cx = C.x - S.x, cy = C.y - S.y, t = cx * ux + cy * uy;
      if (t <= 0 || r <= t) return 0;
      var ex = cx - t * ux, ey = cy - t * uy, d = Math.sqrt(ex * ex + ey * ey);
      var w = 0.22 * lam + 3, derin = R - d;                       // gölge kenarı uzun dalgada daha yumuşak (kırınım)
      var arka = Math.max(0, r - t - R * 0.6), L = R * (1 + 1.6 * ka);   // uzun dalga gölgeyi çabuk doldurur
      return D * smooth(-w, w, derin) * Math.exp(-arka / L);
    }
    function alan() {
      var lam = dalgaBoyu(f) * PXM, D = 1 - Math.pow(10, -gorselDb(f) / 20), ka = Math.PI * BAS_GENISLIGI / dalgaBoyu(f);
      var z = renk.zemin, dg = renk.dalga, gg = renk.golge, data = img.data, i = 0;
      for (var y = 0; y < kucuk.height; y++) {
        for (var x = 0; x < kucuk.width; x++, i += 4) {
          var px = x * IZ + IZ / 2, py = y * IZ + IZ / 2, dx = px - S.x, dy = py - S.y, r = Math.sqrt(dx * dx + dy * dy);
          var a = Math.min(1, Math.sqrt(70 / Math.max(r, 1)));
          var at = zayiflama(px, py, lam, D, ka), g = a * (1 - at);
          var c = 0.5 + 0.5 * Math.cos(2 * Math.PI * (r - HIZ * zaman) / lam), k = c * g * 0.9, s = at * 0.35;
          data[i] = z[0] + (dg[0] - z[0]) * k + (gg[0] - z[0]) * s;
          data[i + 1] = z[1] + (dg[1] - z[1]) * k + (gg[1] - z[1]) * s;
          data[i + 2] = z[2] + (dg[2] - z[2]) * k + (gg[2] - z[2]) * s;
          data[i + 3] = 255;
        }
      }
      kctx.putImageData(img, 0, 0);
    }

    // Dalgaların üstünde okunsun diye yazının çevresine zemin renginde kenar
    function yazi(x, t, px, py) { x.save(); x.lineJoin = 'round'; x.lineWidth = 4; x.strokeStyle = renk.zeminCss; x.strokeText(t, px, py); x.restore(); x.fillText(t, px, py); }
    function ciz() {
      if (!renk) renkOku();
      var gen = cv.clientWidth || W, dpr = Math.min(window.devicePixelRatio || 1, 2), olc = gen / W;
      if (cv.width !== Math.round(gen * dpr)) { cv.width = Math.round(gen * dpr); cv.height = Math.round(gen * H / W * dpr); }
      var x = cv.getContext('2d');
      x.setTransform(olc * dpr, 0, 0, olc * dpr, 0, 0);
      alan();
      x.imageSmoothingEnabled = true; x.drawImage(kucuk, 0, 0, W, H);
      x.font = '500 12px "IBM Plex Sans", sans-serif'; x.textBaseline = 'middle';
      // ses kaynağı (hoparlör)
      x.fillStyle = renk.yazi;
      x.beginPath(); x.moveTo(S.x - 12, S.y - 5); x.lineTo(S.x - 6, S.y - 5); x.lineTo(S.x, S.y - 11); x.lineTo(S.x, S.y + 11); x.lineTo(S.x - 6, S.y + 5); x.lineTo(S.x - 12, S.y + 5); x.closePath(); x.fill();
      x.textAlign = 'left'; yazi(x, M.kaynak, 6, S.y - 24);
      // baş (üstten): burun yukarıda, kulaklar yanlarda; sol kulak (mavi) sese yakın, sağ kulak (kırmızı) karşıda
      x.fillStyle = renk.bas; x.strokeStyle = renk.basKenar; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(C.x - 6, C.y - R + 2); x.lineTo(C.x, C.y - R - 7); x.lineTo(C.x + 6, C.y - R + 2); x.closePath(); x.fill(); x.stroke();
      x.beginPath(); x.ellipse(C.x, C.y, R, R * 1.08, 0, 0, 2 * Math.PI); x.fill(); x.stroke();
      [[-1, renk.sol], [1, renk.sag]].forEach(function (k) {
        x.fillStyle = k[1]; x.beginPath(); x.ellipse(C.x + k[0] * (R + 2), C.y, 4, 8, 0, 0, 2 * Math.PI); x.fill();
      });
      x.fillStyle = renk.yazi; x.textAlign = 'center'; x.fillText(M.basEtiket, C.x, C.y);
      if (sinif(f) === 'kucuk') { x.fillStyle = renk.soluk; x.textAlign = 'left'; yazi(x, M.golgeEtiket, C.x + R + 14, C.y + 22); }
      // ölçek: bir dalga boyu ve baş genişliği aynı ölçekte
      var lam = dalgaBoyu(f) * PXM, y0 = H - 14, x0 = 14, x1 = Math.min(x0 + lam, W - 10), tasar = x0 + lam > W - 10;
      x.strokeStyle = renk.yazi; x.fillStyle = renk.yazi; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(x0, y0 - 5); x.lineTo(x0, y0 + 5); x.moveTo(x0, y0); x.lineTo(x1, y0);
      if (tasar) { x.moveTo(x1 - 6, y0 - 4); x.lineTo(x1, y0); x.lineTo(x1 - 6, y0 + 4); } else { x.moveTo(x1, y0 - 5); x.lineTo(x1, y0 + 5); }
      x.stroke();
      x.textAlign = 'left'; x.textBaseline = 'bottom';
      yazi(x, M.dalgaBoyu + ' ' + uzunlukYaz(dalgaBoyu(f)) + (tasar ? ' ' + M.tasiyor : ''), x0, y0 - 6);
      x.textBaseline = 'middle';
    }

    function yaz() {
      var lam = dalgaBoyu(f);
      tuslar.forEach(function (b, i) { b.setAttribute('aria-pressed', frekanslar[i] === f ? 'true' : 'false'); });
      oynat.textContent = oynuyor ? '❚❚' : '▶';
      oynat.setAttribute('aria-label', oynuyor ? veri.metinler.duraklat : veri.metinler.oynat);
      frBaslik.textContent = M.frekansBasligi + ': ' + f + ' Hz';
      bilgi.textContent = M.dalgaBoyu + ': ' + uzunlukYaz(lam) + ' · ' + M.basGenisligi + ': ≈' + Math.round(BAS_GENISLIGI * 100) + ' cm';
      durum.textContent = sinif(f) === 'buyuk' ? M.buyuk : M.kucuk;
      azalma.textContent = notAraligi(f) === 'yuksek' ? M.azalmaYuksek : M.azalmaAlcak;
      yakin.ad.textContent = M.yakinKulak; uzak.ad.textContent = M.uzakKulak;
      yakin.dol.style.width = '100%';
      uzak.dol.style.width = Math.round(100 * Math.pow(10, -gorselDb(f) / 20)) + '%';
      cv.setAttribute('aria-label', M.canvasEtiketi + ' (' + f + ' Hz). ' + durum.textContent);
      aciklamaB.textContent = M.baslik; aciklama.textContent = M.aciklama;
      uyari.textContent = M.uyari; kaynak.textContent = M.kaynakNot;
      duzen.replaceChildren(); if (ayar.kartEki) ayar.kartEki('golge', '', duzen);
    }

    function adim(t) {
      if (!calisiyor) return;
      if (oynuyor) { zaman += Math.min(0.05, (t - son) / 1000); ciz(); }
      son = t;
      if (oynuyor) kare = requestAnimationFrame(adim); else calisiyor = false;
    }
    function basla() {
      if (calisiyor || !oynuyor || kap.offsetParent === null) return;
      calisiyor = true; son = performance.now(); kare = requestAnimationFrame(adim);
    }
    function durdur() { calisiyor = false; if (kare) cancelAnimationFrame(kare); kare = null; }
    window.addEventListener('resize', function () { if (kap.offsetParent !== null) ciz(); });

    yaz();
    return {
      goster: function () { renk = null; yaz(); ciz(); basla(); },
      durdur: durdur,
      yenile: function () { renk = null; yaz(); if (kap.offsetParent !== null) ciz(); }
    };
  }

  hesap.kur = kur;
  kok.SesLabGolge = hesap;
})(typeof window !== 'undefined' ? window : this);
