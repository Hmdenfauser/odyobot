/* Ses laboratuvarı: Dağılma (difraksiyon) (#seslab/dagilma, 2026-11-20). İki sahne, 2D canvas, kütüphanesiz:
   1. Duvar: yandan görünüş; soldaki kaynaktan gelen dalga bir duvarın tepesinden dolaşır ya da arkasında ses gölgesi bırakır.
   2. Baş gölgesi: üstten görülen baş; uzun dalga başın çevresinden dolaşır, kısa dalga karşı kulakta gölge bırakır.
   Sonucu dalga boyunun engelin boyuna oranı belirler: büyükse dolaşır, yakınsa saçılır, küçükse gölge.
   Kaynak: proje sahibinin ders notları — İşitme Teorileri ve Psikoakustik 1. ders s. 37 (dağılma), 2. ders slayt 72 ve
   3. ders slayt 5 (gölge etkisi); İşitme ve Denge Sistemleri-2 s. 22–24 (başın etkisi: 1500 Hz, 3–6 dB / ≥20 dB).
   "Eşit" durumunun ayrıntısı genel akustik kaynaklarından (HyperPhysics, Britannica). Gölgenin koyuluğu şematiktir.
   Hesaplar (dalgaBoyu, sinif, notAraligi, gorselDb, duvarZayiflama) ekrandan bağımsız; test: node testler/dagilma-test.js
   Yazılar seslab-veri.js → dagilma (yönetici: icerik/sl.dagilma, sl.dagilma.duvar, sl.dagilma.bas). Renkler seslab.css → --sl-g-*. */
(function (kok) {
  'use strict';
  var SES_HIZI = 343;          // m/sn, oda sıcaklığında havada
  var DUVAR_BOYU = 0.7;        // m, şematik kabul (500 Hz'in dalga boyuna yakın; "eşit" durumu görülebilsin diye)
  var BAS_GENISLIGI = 0.18;    // m, yaklaşık (şematik kabul)
  var SINIR_HZ = 1500;         // ders notu: 1500 Hz ve üstü baş gölgesinden daha çok etkilenir
  var YAKIN_ALT = 2 / 3, YAKIN_UST = 1.5;   // dalga boyu / engel bu aralıktaysa "yakın" (şematik sınır)

  function dalgaBoyu(f) { return SES_HIZI / f; }
  // 'buyuk': engelin çevresinden dolaşır; 'esit': saçılma; 'kucuk': gölge
  function sinif(f, engel) { var o = dalgaBoyu(f) / engel; return o >= YAKIN_UST ? 'buyuk' : o > YAKIN_ALT ? 'esit' : 'kucuk'; }
  function notAraligi(f) { return f >= SINIR_HZ ? 'yuksek' : 'alcak'; }
  // Baş sahnesinde yalnızca çizim için (sayı gösterilmez): 500 Hz'de ~4 dB'den 4000 Hz'de ~22 dB'ye yumuşak geçiş.
  function gorselDb(f) {
    var x = (Math.log(f / 500) / Math.LN2) / 3; x = Math.max(0, Math.min(1, x));
    return 4 + 18 * x * x * (3 - 2 * x);
  }
  // Duvar sahnesinde gölgenin en koyu hâli (0–1, şematik): dalga boyu duvara göre büyüdükçe gölge kaybolur.
  function duvarZayiflama(f, engel) { var o = dalgaBoyu(f) / (engel || DUVAR_BOYU); return 0.92 / (1 + 0.9 * o * o); }
  function smooth(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function sayi(x, b) { return x.toFixed(b).replace('.', ','); }
  function uzunlukYaz(m) { return m >= 1 ? sayi(m, 2) + ' m' : Math.round(m * 100) + ' cm'; }

  var hesap = { dalgaBoyu: dalgaBoyu, sinif: sinif, notAraligi: notAraligi, gorselDb: gorselDb, duvarZayiflama: duvarZayiflama,
    uzunlukYaz: uzunlukYaz, SINIR_HZ: SINIR_HZ, BAS_GENISLIGI: BAS_GENISLIGI, DUVAR_BOYU: DUVAR_BOYU };
  if (typeof module !== 'undefined' && module.exports) { module.exports = hesap; return; }

  function el(ad, ozellik, cocuklar) {
    var e = document.createElement(ad);
    if (ozellik) Object.keys(ozellik).forEach(function (k) {
      if (k === 'text') e.textContent = ozellik[k]; else if (k === 'class') e.className = ozellik[k]; else e.setAttribute(k, ozellik[k]);
    });
    (cocuklar || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  var W = 360, H = 240, HIZ = 42;   // mantıksal çizim alanı; dalganın ekrandaki hızı (birim/sn, yavaşlatılmış)

  /* ---------- Sahne 1: duvar (yandan) ---------- */
  var DV = (function () {
    var yer = 224, hp = 62, wx = 150, kal = 6, PXM = hp / DUVAR_BOYU;
    var S = { x: 36, y: yer - 14 }, E = { x: wx, y: yer - hp };
    var B = { x0: 288, x1: 352, y0: 70 };
    var SEx = E.x - S.x, SEy = E.y - S.y, SE = Math.sqrt(SEx * SEx + SEy * SEy);
    return {
      id: 'duvar', engel: DUVAR_BOYU, PXM: PXM, IZ: 1.5,
      // ızgara noktası: [uzaklık (faz için), zayıflama 0–1]; null = dalga yok (yer, duvar, bina)
      nokta: function (px, py, lam, D) {
        if (py > yer || (px >= wx - kal / 2 && px <= wx + kal / 2 && py >= E.y) || (px >= B.x0 && py >= B.y0)) return null;
        var dx = px - S.x, dy = py - S.y, r = Math.sqrt(dx * dx + dy * dy);
        if (px <= wx) return [r, 0, r];
        var d = (SEx * dy - SEy * dx) / SE;                 // gölge sınırına uzaklık (+: gölgede)
        var w = 0.35 * lam + 2, sm = smooth(-w, w, d);
        var ex = px - E.x, ey = py - E.y, rE = Math.sqrt(ex * ex + ey * ey);
        return [r * (1 - sm) + (SE + rE) * sm, D * sm, r];   // gölgede dalga duvarın tepesinden yayılır (kırınım)
      },
      ciz: function (x, c, M, sinifAd, yazi) {
        x.fillStyle = c.soluk; x.globalAlpha = 0.25; x.fillRect(0, yer, W, H - yer); x.globalAlpha = 1;
        x.strokeStyle = c.yazi; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, yer); x.lineTo(W, yer); x.stroke();
        // bina
        x.fillStyle = c.bas; x.fillRect(B.x0, B.y0, B.x1 - B.x0, yer - B.y0); x.strokeRect(B.x0, B.y0, B.x1 - B.x0, yer - B.y0);
        x.strokeStyle = c.basKenar; x.lineWidth = 1;
        for (var yy = B.y0 + 10; yy < yer - 14; yy += 22) for (var xx = B.x0 + 9; xx < B.x1 - 12; xx += 19) x.strokeRect(xx, yy, 10, 13);
        // duvar
        x.fillStyle = c.yazi; x.fillRect(wx - kal / 2, E.y, kal, hp);
        // kaynak (araba)
        x.fillStyle = c.yazi; x.beginPath(); x.moveTo(S.x - 22, S.y + 8); x.lineTo(S.x - 22, S.y - 2); x.lineTo(S.x - 12, S.y - 2); x.lineTo(S.x - 7, S.y - 10);
        x.lineTo(S.x + 9, S.y - 10); x.lineTo(S.x + 14, S.y - 2); x.lineTo(S.x + 22, S.y - 2); x.lineTo(S.x + 22, S.y + 8); x.closePath(); x.fill();
        x.fillStyle = c.zeminCss; [-12, 12].forEach(function (k) { x.beginPath(); x.arc(S.x + k, S.y + 9, 4, 0, 2 * Math.PI); x.fill(); x.stroke(); });
        x.fillStyle = c.yazi; x.textAlign = 'center';
        yazi(x, M.kaynak, S.x, S.y - 20); x.textAlign = 'right'; yazi(x, M.duvar, wx - 8, E.y + 10); x.textAlign = 'center'; yazi(x, M.bina, (B.x0 + B.x1) / 2, B.y0 - 10);
        if (sinifAd === 'kucuk') { x.textAlign = 'left'; x.fillStyle = c.soluk; yazi(x, M.golgeEtiket, wx + 10, yer - 12); }
        if (sinifAd === 'esit') {
          x.strokeStyle = c.vurgu; x.lineWidth = 2; x.beginPath(); x.arc(E.x, E.y, 7, 0, 2 * Math.PI); x.stroke();
          x.fillStyle = c.yazi; x.textAlign = 'left'; yazi(x, M.sacilmaEtiket, E.x + 12, E.y - 2);
        }
      },
      olcum: function (f) { return 1 - duvarZayiflama(f); },
      cetvelY: 16
    };
  })();

  /* ---------- Sahne 2: baş gölgesi (üstten) ---------- */
  var BS = (function () {
    var R = 22, PXM = (2 * R) / BAS_GENISLIGI, S = { x: 22, y: H / 2 }, C = { x: 232, y: H / 2 };
    return {
      id: 'bas', engel: BAS_GENISLIGI, PXM: PXM, IZ: 2,
      nokta: function (px, py, lam, D, ka) {
        var dx = px - S.x, dy = py - S.y, r = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / r, uy = dy / r;
        var cx = C.x - S.x, cy = C.y - S.y, t = cx * ux + cy * uy;
        if (t <= 0 || r <= t) return [r, 0, r];
        var ex = cx - t * ux, ey = cy - t * uy, d = Math.sqrt(ex * ex + ey * ey);
        var w = 0.22 * lam + 3, derin = R - d;                              // gölge kenarı uzun dalgada daha yumuşak
        var arka = Math.max(0, r - t - R * 0.6), L = R * (1 + 1.6 * ka);    // uzun dalga gölgeyi çabuk doldurur
        return [r, D * smooth(-w, w, derin) * Math.exp(-arka / L), r];
      },
      ciz: function (x, c, M, sinifAd, yazi) {
        x.fillStyle = c.yazi;
        x.beginPath(); x.moveTo(S.x - 12, S.y - 5); x.lineTo(S.x - 6, S.y - 5); x.lineTo(S.x, S.y - 11); x.lineTo(S.x, S.y + 11); x.lineTo(S.x - 6, S.y + 5); x.lineTo(S.x - 12, S.y + 5); x.closePath(); x.fill();
        x.textAlign = 'left'; yazi(x, M.kaynak, 6, S.y - 24);
        // baş (üstten): burun yukarıda; sol kulak (mavi) sese yakın, sağ kulak (kırmızı) karşıda
        x.fillStyle = c.bas; x.strokeStyle = c.basKenar; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(C.x - 6, C.y - R + 2); x.lineTo(C.x, C.y - R - 7); x.lineTo(C.x + 6, C.y - R + 2); x.closePath(); x.fill(); x.stroke();
        x.beginPath(); x.ellipse(C.x, C.y, R, R * 1.08, 0, 0, 2 * Math.PI); x.fill(); x.stroke();
        [[-1, c.sol], [1, c.sag]].forEach(function (k) { x.fillStyle = k[1]; x.beginPath(); x.ellipse(C.x + k[0] * (R + 2), C.y, 4, 8, 0, 0, 2 * Math.PI); x.fill(); });
        x.fillStyle = c.yazi; x.textAlign = 'center'; x.fillText(M.basEtiket, C.x, C.y);
        if (sinifAd === 'kucuk') { x.fillStyle = c.soluk; x.textAlign = 'left'; yazi(x, M.golgeEtiket, C.x + R + 14, C.y + 22); }
        if (sinifAd === 'esit') { x.fillStyle = c.yazi; x.textAlign = 'left'; yazi(x, M.sacilmaEtiket, C.x + R + 14, C.y + 22); }
      },
      olcum: function (f) { return Math.pow(10, -gorselDb(f) / 20); },
      cetvelY: H - 14
    };
  })();

  function kur(kokEl, ayar) {
    var veri = ayar.veri, O = veri.dagilma, SAHNE = { duvar: DV, bas: BS };
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var sahne = DV, fSec = { duvar: 500, bas: 500 }, oynuyor = !reduce, calisiyor = false, zaman = 0, son = 0, kare = null, renk = null;
    function M() { return O[sahne.id]; }
    function frekanslar() { return M().frekanslar || [250, 500, 1000, 2000, 4000, 8000]; }

    var kap = el('div', { 'class': 'sl sl-golge' });
    var sahneTus = el('div', { 'class': 'sl-g-sahneler', role: 'group' });
    var cv = el('canvas', { 'class': 'sl-g-tuval', role: 'img' });
    var oynat = el('button', { type: 'button', 'class': 'sl-g-oynat' });
    var cerceve = el('div', { 'class': 'sl-g-sahne' }, [cv, oynat]);
    var frBaslik = el('h3', { 'class': 'g3d-baslik' });
    var frTus = el('div', { 'class': 'sl-g-frekans', role: 'group' });
    var bilgi = el('p', { 'class': 'sl-g-bilgi' });
    var durum = el('p', { 'class': 'sl-g-durum', 'aria-live': 'polite' });
    var azalma = el('p', { 'class': 'sl-g-azalma' });
    function olcer() {
      var ad = el('span', { 'class': 'sl-g-olcer-ad' }), dol = el('span', { 'class': 'sl-g-olcer-dolu' });
      return { kok: el('div', { 'class': 'sl-g-olcer' }, [ad, el('span', { 'class': 'sl-g-olcer-cubuk', 'aria-hidden': 'true' }, [dol])]), ad: ad, dol: dol };
    }
    var o1 = olcer(), o2 = olcer();
    var kart = el('article', { 'class': 'card sl-g-kart' });
    var aciklamaB = el('h3', { 'class': 'g3d-baslik' }), aciklama = el('p', { 'class': 'sl-g-aciklama' });
    var durumlar = el('dl', { 'class': 'sl-g-durumlar' }), esitNot = el('p', { 'class': 'sl-g-esit' });
    [aciklamaB, aciklama, durumlar, esitNot].forEach(function (x) { kart.appendChild(x); });
    var uyari = el('p', { 'class': 'note' }), kaynak = el('p', { 'class': 'note' });
    var duzen = el('div', { 'class': 'sl-g-duzen' });
    [sahneTus, cerceve, frBaslik, frTus, bilgi, durum, el('div', { 'class': 'sl-g-olcerler' }, [o1.kok, o2.kok]), azalma, kart, uyari, kaynak, duzen]
      .forEach(function (x) { kap.appendChild(x); });
    kokEl.appendChild(kap);

    var sTuslar = ['duvar', 'bas'].map(function (id) {
      var b = el('button', { type: 'button', 'class': 'sl-g-stus', 'aria-pressed': 'false' });
      b.addEventListener('click', function () { if (sahne.id !== id) { sahne = SAHNE[id]; kucukKur(); yaz(); ciz(); } });
      sahneTus.appendChild(b); return { id: id, b: b };
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
      renk = { zemin: rgb(v('--surface')), dalga: rgb(v('--sl-g-dalga')), golge: rgb(v('--sl-g-golge')), zeminCss: v('--surface'),
        bas: v('--sl-g-bas'), basKenar: v('--sl-g-bas-kenar'), sol: v('--left'), sag: v('--right'), yazi: v('--ink'), soluk: v('--muted'), vurgu: v('--sl-g-vurgu') };
    }

    // ---- dalga alanı: küçük ızgarada hesaplanır, büyütülerek çizilir
    var kucuk = document.createElement('canvas'), kctx = kucuk.getContext('2d'), img = null;
    function kucukKur() { kucuk.width = Math.round(W / sahne.IZ); kucuk.height = Math.round(H / sahne.IZ); img = kctx.createImageData(kucuk.width, kucuk.height); }
    kucukKur();
    function alan(f) {
      var lam = dalgaBoyu(f) * sahne.PXM, ka = Math.PI * BAS_GENISLIGI / dalgaBoyu(f);
      var D = sahne.id === 'duvar' ? duvarZayiflama(f) : 1 - Math.pow(10, -gorselDb(f) / 20);
      var z = renk.zemin, dg = renk.dalga, gg = renk.golge, data = img.data, i = 0, iz = sahne.IZ;
      for (var y = 0; y < kucuk.height; y++) {
        for (var x = 0; x < kucuk.width; x++, i += 4) {
          var n = sahne.nokta(x * iz + iz / 2, y * iz + iz / 2, lam, D, ka);
          if (!n) { data[i] = z[0]; data[i + 1] = z[1]; data[i + 2] = z[2]; data[i + 3] = 255; continue; }
          var g = Math.min(1, Math.sqrt(70 / Math.max(n[2], 1))) * (1 - n[1]);
          var c = 0.5 + 0.5 * Math.cos(2 * Math.PI * (n[0] - HIZ * zaman) / lam), k = c * g * 0.9, s = n[1] * 0.35;
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
      var f = fSec[sahne.id], gen = cv.clientWidth || W, dpr = Math.min(window.devicePixelRatio || 1, 2), olc = gen / W;
      if (cv.width !== Math.round(gen * dpr)) { cv.width = Math.round(gen * dpr); cv.height = Math.round(gen * H / W * dpr); }
      var x = cv.getContext('2d');
      x.setTransform(olc * dpr, 0, 0, olc * dpr, 0, 0);
      alan(f);
      x.imageSmoothingEnabled = true; x.drawImage(kucuk, 0, 0, W, H);
      x.font = '500 12px "IBM Plex Sans", sans-serif'; x.textBaseline = 'middle';
      sahne.ciz(x, renk, M(), sinif(f, sahne.engel), yazi);
      // cetvel: bir dalga boyu, engelle aynı ölçekte
      var lam = dalgaBoyu(f) * sahne.PXM, y0 = sahne.cetvelY, x0 = 14, x1 = Math.min(x0 + lam, W - 60), tasar = x0 + lam > W - 60;
      x.strokeStyle = renk.yazi; x.fillStyle = renk.yazi; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(x0, y0 - 5); x.lineTo(x0, y0 + 5); x.moveTo(x0, y0); x.lineTo(x1, y0);
      if (tasar) { x.moveTo(x1 - 6, y0 - 4); x.lineTo(x1, y0); x.lineTo(x1 - 6, y0 + 4); } else { x.moveTo(x1, y0 - 5); x.lineTo(x1, y0 + 5); }
      x.stroke();
      x.textAlign = 'left'; x.textBaseline = sahne.cetvelY < H / 2 ? 'top' : 'bottom';
      yazi(x, O.dalgaBoyu + ' ' + uzunlukYaz(dalgaBoyu(f)) + (tasar ? ' ' + O.tasiyor : ''), x0, sahne.cetvelY < H / 2 ? y0 + 6 : y0 - 6);
      x.textBaseline = 'middle';
    }

    function satir(ad, metin, secili) { var dt = el('dt', { text: ad }), dd = el('dd', { text: metin }); if (secili) { dt.className = dd.className = 'sl-g-secili'; } return [dt, dd]; }
    function yaz() {
      if (frekanslar().indexOf(fSec[sahne.id]) < 0) fSec[sahne.id] = frekanslar()[1];   // yönetici listeyi değiştirdiyse
      var m = M(), f = fSec[sahne.id], lam = dalgaBoyu(f), s = sinif(f, sahne.engel);
      sTuslar.forEach(function (t) { t.b.textContent = O[t.id === 'duvar' ? 'sahneDuvar' : 'sahneBas']; t.b.setAttribute('aria-pressed', t.id === sahne.id ? 'true' : 'false'); });
      frTus.replaceChildren();
      frekanslar().forEach(function (fr) {
        var b = el('button', { type: 'button', 'class': 'sl-g-ftus', 'aria-pressed': fr === f ? 'true' : 'false', 'aria-label': fr + ' Hz', text: fr >= 1000 ? (fr / 1000) + 'k' : String(fr) });
        b.addEventListener('click', function () { fSec[sahne.id] = fr; yaz(); ciz(); var y = frTus.querySelector('[aria-pressed="true"]'); if (y) y.focus(); });
        frTus.appendChild(b);
      });
      oynat.textContent = oynuyor ? '❚❚' : '▶';
      oynat.setAttribute('aria-label', oynuyor ? veri.metinler.duraklat : veri.metinler.oynat);
      frBaslik.textContent = O.frekansBasligi + ': ' + f + ' Hz';
      bilgi.textContent = O.dalgaBoyu + ': ' + uzunlukYaz(lam) + ' · ' + m.engelAdi + ': ≈' + Math.round(sahne.engel * 100) + ' cm';
      durum.textContent = m[s];
      azalma.hidden = sahne.id !== 'bas';
      azalma.textContent = sahne.id === 'bas' ? (notAraligi(f) === 'yuksek' ? m.azalmaYuksek : m.azalmaAlcak) : '';
      o1.ad.textContent = m.olcer1; o2.ad.textContent = m.olcer2;
      o1.dol.className = 'sl-g-olcer-dolu ' + (sahne.id === 'bas' ? 'sol' : 'on');
      o2.dol.className = 'sl-g-olcer-dolu ' + (sahne.id === 'bas' ? 'sag' : 'arka');
      o1.dol.style.width = '100%'; o2.dol.style.width = Math.round(100 * sahne.olcum(f)) + '%';
      cv.setAttribute('aria-label', m.canvasEtiketi + ' (' + f + ' Hz). ' + durum.textContent);
      aciklamaB.textContent = m.baslik; aciklama.textContent = m.aciklama;
      durumlar.replaceChildren.apply(durumlar, [].concat(satir(O.durumBuyuk, m.buyuk, s === 'buyuk'), satir(O.durumEsit, m.esit, s === 'esit'), satir(O.durumKucuk, m.kucuk, s === 'kucuk')));
      esitNot.textContent = O.esitAyrinti;
      uyari.textContent = O.uyari; kaynak.textContent = O.kaynakNot;
      duzen.replaceChildren(); if (ayar.kartEki) { ayar.kartEki('dagilma', sahne.id, duzen); }
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
  kok.SesLabDagilma = hesap;
})(typeof window !== 'undefined' ? window : this);
