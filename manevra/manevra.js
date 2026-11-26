/* Vestibüler manevralar: ekran (2026-11-26). Kütüphane → Ders notları → "Vestibüler Manevralar" notlarının sayfasında açılır.
   - Sahne: 2D canvas üzerinde kütüphanesiz, basit 3B çizim (ressam yöntemi: uzaktan yakına). Sedye, hasta (gövde, kollar,
     bacaklar, baş; sağ kulak kırmızı, sol kulak mavi). Parmakla yana sürükleyince sahne döner.
   - Sağ üst köşe: hasta kulağın kanalı (şematik halka), kristaller, kupula, utrikulus ve yerçekimi oku.
   - Sağ alt: simgeli yuvarlak düğmeler (büyüteç, genel görünüm, başa dön, oynat/duraklat), yazı ipucunda (seslab/ipucu.js).
   Hesaplar manevra-hesap.js'te (window.ManevraHesap); yazılar manevra-veri.js'ten, yönetici düzenlemesiyle app.js verir.
   Renkler manevra.css → --mv-*. Kullanım: Manevra.kur(kap, id, { metin(), adimlar(cesit) → [{k, a, s}], cesitAd(cesit) }). */
(function () {
  'use strict';
  var H = window.ManevraHesap, IP = window.SesLabIpucu;
  function el(ad, oz, cocuk) {
    var e = document.createElement(ad);
    if (oz) Object.keys(oz).forEach(function (k) { if (k === 'text') e.textContent = oz[k]; else if (k === 'class') e.className = oz[k]; else e.setAttribute(k, oz[k]); });
    (cocuk || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function sc(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  var dot = H.dot, nrm = H.nrm, U = H.uygula;

  // Gövde parçaları (gövde eksenlerinde, metre): kutu ve kapsüller
  var GOVDE = { min: [-0.17, -0.07, -0.1], max: [0.17, 0.52, 0.1] };
  var BAS_R = 0.105;
  function bacak(kalca, diz, yon) {   // yon: +1 sağ, −1 sol
    var h = kalca * H.DER, k = (kalca - diz) * H.DER, kok = [0.09 * yon, -0.04, 0];
    var d = add(kok, [0, -Math.cos(h) * 0.44, Math.sin(h) * 0.44]), a = add(d, [0, -Math.cos(k) * 0.42, Math.sin(k) * 0.42]);
    return [kok, d, a];
  }
  function kol(yon) { return [[0.2 * yon, 0.46, 0], [0.23 * yon, 0.2, 0.03], [0.17 * yon, 0.02, 0.1]]; }

  function kur(kap, id, ayar) {
    var M = H.MANEVRA[id];
    var taraf = 'sag', cesit = H.cesitler(id)[0], O = null, oynuyor = false, calisiyor = false, son = 0, kare = null, bitti = false;
    var KAMERA = { az: -28, el: 16, uz: 2.25 }, kamera = Object.assign({}, KAMERA), yakin = false, renk = null;
    var azalt = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- yapı
    var cv = el('canvas', { 'class': 'mv-tuval', role: 'img' });
    var sagAlt = el('div', { 'class': 'sl-sag-alt' });
    var buyB = el('button', { 'class': 'sl-yuv', type: 'button' }), genelB = el('button', { 'class': 'sl-yuv', type: 'button' }),
      basaB = el('button', { 'class': 'sl-yuv', type: 'button' }), oynatB = el('button', { 'class': 'sl-yuv', type: 'button' });
    [buyB, genelB, basaB, oynatB].forEach(function (b) { sagAlt.appendChild(b); });
    var sahne = el('div', { 'class': 'mv-sahne' }, [cv, sagAlt]);
    var tarafKutu = el('div', { 'class': 'mv-sec', role: 'group' }), cesitKutu = el('div', { 'class': 'mv-sec', role: 'group' });
    var tarafAd = el('span', { 'class': 'mv-sec-ad' }), cesitAd = el('span', { 'class': 'mv-sec-ad' });
    var tarafB = { sag: el('button', { type: 'button', 'class': 'mv-sec-tus' }), sol: el('button', { type: 'button', 'class': 'mv-sec-tus' }) };
    tarafKutu.appendChild(tarafAd); tarafKutu.appendChild(tarafB.sag); tarafKutu.appendChild(tarafB.sol);
    var cesitB = {};
    cesitKutu.appendChild(cesitAd);
    H.cesitler(id).forEach(function (c) { cesitB[c] = el('button', { type: 'button', 'class': 'mv-sec-tus' }); cesitKutu.appendChild(cesitB[c]); });
    cesitKutu.hidden = H.cesitler(id).length < 2;
    var secimler = el('div', { 'class': 'mv-secimler' }, [tarafKutu, cesitKutu]);
    var kv = el('canvas', { 'class': 'mv-kanal-tuval', role: 'img' }), simdiYazi = el('p', { 'class': 'mv-simdi-yazi', 'aria-live': 'polite' });
    var simdi = el('div', { 'class': 'mv-simdi' }, [kv, simdiYazi]);
    var listeBas = el('h3', { 'class': 'mv-liste-bas' }), liste = el('ol', { 'class': 'mv-liste' });
    var sema = el('p', { 'class': 'note mv-not' }), kanalNot = el('p', { 'class': 'note mv-not' });
    var kok = el('div', { 'class': 'mv' }, [sahne, simdi, secimler, listeBas, liste, kanalNot, sema]);
    kap.appendChild(kok);

    function yazilar() {
      var l = ayar.adimlar(cesit) || [], n = O.adimlar.length, o = [];
      for (var i = 0; i < n; i++) o.push(l[i] || { k: String(i + 1), a: '', s: '' });
      return o;
    }
    function yeniOynatici() { O = H.oynatici(id, cesit, taraf); bitti = false; }

    // ---- düğmeler
    var ipOyn = IP.bagla(oynatB, function () { return oynuyor ? ayar.metin().duraklat : ayar.metin().oynat; });
    IP.bagla(genelB, function () { return ayar.metin().genel; }); IP.simge(genelB, 'genel');
    IP.bagla(basaB, function () { return ayar.metin().basaDon; }); IP.simge(basaB, 'vestibuler');
    var buy = IP.buyutec(buyB, { yakinMi: function () { return yakin; }, degistir: function () { yakin = !yakin; ciz(); },
      yakinlastir: function () { return ayar.metin().yakinlastir; }, uzaklastir: function () { return ayar.metin().uzaklastir; } });
    function oynatYaz() { IP.simge(oynatB, oynuyor ? 'duraklat' : 'oynat'); ipOyn.yenile(); }
    oynatB.addEventListener('click', function () {
      if (oynuyor) { oynuyor = false; durdur(); }
      else { if (bitti) { O.git(0); bitti = false; } oynuyor = true; basla(); }
      oynatYaz(); yaz();
    });
    genelB.addEventListener('click', function () { kamera = Object.assign({}, KAMERA); yakin = false; buy.yenile(); ciz(); });
    basaB.addEventListener('click', function () { O.git(0); bitti = false; ciz(); yaz(); });
    Object.keys(tarafB).forEach(function (t) { tarafB[t].addEventListener('click', function () { if (taraf === t) return; taraf = t; yeniOynatici(); ciz(); yaz(); }); });
    Object.keys(cesitB).forEach(function (c) { cesitB[c].addEventListener('click', function () { if (cesit === c) return; cesit = c; yeniOynatici(); ciz(); yaz(); }); });

    // Parmakla/fareyle yana sürükleme: sahne döner (dikey kaydırma sayfayı kaydırır)
    var surukle = null;
    cv.addEventListener('pointerdown', function (e) { surukle = { x: e.clientX, y: e.clientY, az: kamera.az, el: kamera.el, fare: e.pointerType === 'mouse' }; });
    window.addEventListener('pointermove', function (e) {
      if (!surukle) return;
      kamera.az = surukle.az - (e.clientX - surukle.x) * 0.4;
      if (surukle.fare) kamera.el = Math.max(-5, Math.min(70, surukle.el + (e.clientY - surukle.y) * 0.3));
      if (!calisiyor) ciz();
    });
    ['pointerup', 'pointercancel'].forEach(function (t) { window.addEventListener(t, function () { surukle = null; }); });

    // ---- renkler
    function renkOku() {
      var st = getComputedStyle(kok), v = function (n) { return st.getPropertyValue(n).trim(); };
      renk = { zemin: v('--surface'), cizgi: v('--line'), yazi: v('--ink'), soluk: v('--muted'), vurgu: v('--accent'), sag: v('--right'), sol: v('--left'),
        masa: v('--mv-masa'), minder: v('--mv-minder'), ten: v('--mv-ten'), giysi: v('--mv-giysi'), pantolon: v('--mv-pantolon'), sac: v('--mv-sac'),
        kanal: v('--mv-kanal'), kanalKenar: v('--mv-kanal-kenar'), utr: v('--mv-utrikulus'), kristal: v('--mv-kristal'), kupula: v('--mv-kupula'), uyari: v('--mv-uyari'), baski: v('--mv-baski') };
    }
    function rgb(s) {
      var m; if (!s) return [128, 128, 128];
      if (s[0] === '#') { if (s.length === 4) return [parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16), parseInt(s[3] + s[3], 16)]; return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)]; }
      m = s.match(/\d+(\.\d+)?/g); return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
    }
    function golge(c, k) { var r = rgb(c); return 'rgb(' + Math.round(r[0] * k) + ',' + Math.round(r[1] * k) + ',' + Math.round(r[2] * k) + ')'; }
    var ISIK = nrm([0.35, 0.9, 0.55]);
    function aydin(n) { return 0.62 + 0.38 * Math.max(0, dot(n, ISIK)); }

    // ---- kamera ve izdüşüm
    var W = 0, Hh = 0, KB = 150, cam, ileri, sag, yuk, odak;
    function kameraKur(basP) {
      var hedef = yakin && basP ? basP : [0.55, 0.05, 0], uz = yakin ? 1.0 : kamera.uz, az = kamera.az * H.DER, e = kamera.el * H.DER;
      cam = add(hedef, [Math.sin(az) * Math.cos(e) * uz, Math.sin(e) * uz, Math.cos(az) * Math.cos(e) * uz]);
      ileri = nrm(sub(hedef, cam)); sag = nrm(cross(ileri, [0, 1, 0])); yuk = cross(sag, ileri);
      odak = Hh * 1.35;
    }
    function izd(p) { var d = sub(p, cam), z = dot(d, ileri); z = Math.max(z, 0.05); return [W / 2 + odak * dot(d, sag) / z, Hh * 0.4 - odak * dot(d, yuk) / z, z]; }

    // ---- çizim öğeleri (ressam yöntemi)
    function kutuYuz(liste, koseler, normaller, renkAd, kenar) {
      // koseler: 8 köşe (dünya), normaller: 6 yüz normali
      var Y = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
      Y.forEach(function (y, i) {
        var n = normaller[i], merkez = sc(add(add(koseler[y[0]], koseler[y[1]]), add(koseler[y[2]], koseler[y[3]])), 0.25);
        if (dot(n, sub(cam, merkez)) <= 0) return;   // arkaya bakan yüz
        var P = y.map(function (k) { return izd(koseler[k]); });
        liste.push({ z: izd(merkez)[2], ciz: function (x) {
          x.beginPath(); x.moveTo(P[0][0], P[0][1]); for (var j = 1; j < 4; j++) x.lineTo(P[j][0], P[j][1]); x.closePath();
          x.fillStyle = golge(renkAd, aydin(n)); x.fill(); if (kenar) { x.strokeStyle = kenar; x.lineWidth = 1; x.stroke(); }
        } });
      });
    }
    function kutu(liste, mat, merkezP, min, max, renkAd, kenar) {
      var K = [];
      for (var i = 0; i < 8; i++) { var l = [(i & 4) ? max[0] : min[0], (i & 2) ? max[1] : min[1], (i & 1) ? max[2] : min[2]]; K.push(add(merkezP, mat ? U(mat, l) : l)); }
      var ex = mat ? U(mat, [1, 0, 0]) : [1, 0, 0], ey = mat ? U(mat, [0, 1, 0]) : [0, 1, 0], ez = mat ? U(mat, [0, 0, 1]) : [0, 0, 1];
      kutuYuz(liste, K, [sc(ex, -1), ex, sc(ey, -1), ey, sc(ez, -1), ez], renkAd, kenar);
    }
    function kapsul(liste, a, b, r, renkAd, ek) {
      var pa = izd(a), pb = izd(b), z = (pa[2] + pb[2]) / 2;
      liste.push({ z: z + (ek || 0), ciz: function (x) {
        x.lineCap = 'round'; x.strokeStyle = golge(renkAd, 0.72); x.lineWidth = odak * r * 2 / z + 2;
        x.beginPath(); x.moveTo(pa[0], pa[1]); x.lineTo(pb[0], pb[1]); x.stroke();
        x.strokeStyle = golge(renkAd, 0.95); x.lineWidth = odak * r * 2 / z;
        x.beginPath(); x.moveTo(pa[0], pa[1]); x.lineTo(pb[0], pb[1]); x.stroke();
      } });
    }
    function kure(liste, c, r, renkAd, kenar, ek) {
      var p = izd(c);
      liste.push({ z: p[2] + (ek || 0), ciz: function (x) {
        var rr = odak * r / p[2];
        var g = x.createRadialGradient(p[0] - rr * 0.35, p[1] - rr * 0.4, rr * 0.1, p[0], p[1], rr);
        g.addColorStop(0, golge(renkAd, 1.08)); g.addColorStop(1, golge(renkAd, 0.78));
        x.fillStyle = g; x.beginPath(); x.arc(p[0], p[1], rr, 0, 2 * Math.PI); x.fill();
        if (kenar) { x.strokeStyle = kenar; x.lineWidth = 1; x.stroke(); }
      } });
    }

    function sahneCiz(x) {
      var d = O.durum(), p = d.poz, T = H.TABAN[O.taban], B = H.govdeMatris(O.taban, p), Hb = H.basMatris(O.taban, p);
      var P = T.p, basP = H.basYeri(O.taban, p);
      kameraKur(basP);
      // sedye (önce; hasta hep üstünde ya da yanında)
      var masa = [];
      kutu(masa, null, [0, 0, 0], [0, -0.09, -0.33], [1.9, 0, 0.33], renk.minder, renk.cizgi);
      [[0.08, -0.25], [0.08, 0.25], [1.82, -0.25], [1.82, 0.25]].forEach(function (a) { kutu(masa, null, [a[0], 0, a[1]], [-0.025, -0.72, -0.025], [0.025, -0.09, 0.025], renk.masa); });
      masa.sort(function (a, b) { return b.z - a.z; }).forEach(function (o) { o.ciz(x); });
      // hasta
      var L = [], G = function (v) { return add(P, U(B, v)); };
      kutu(L, B, P, GOVDE.min, GOVDE.max, renk.giysi, golge(renk.giysi, 0.7));
      [1, -1].forEach(function (y) {
        var b = bacak(p.kalca, p.diz, y).map(G); kapsul(L, b[0], b[1], 0.07, renk.pantolon); kapsul(L, b[1], b[2], 0.055, renk.pantolon);
        var k = kol(y).map(G); kapsul(L, k[0], k[1], 0.045, renk.giysi); kapsul(L, k[1], k[2], 0.04, renk.ten);
      });
      var boyun = G([0, 0.5, 0]), boyunUst = add(P, U(B, [0, 0.56, 0]));
      kapsul(L, boyun, boyunUst, 0.05, renk.ten);
      var B2 = function (v) { return add(basP, U(Hb, v)); };
      kure(L, basP, BAS_R, renk.ten, golge(renk.ten, 0.6));
      kure(L, B2([0, 0.03, -0.035]), BAS_R * 0.96, renk.sac, null);
      kure(L, B2([0, -0.01, BAS_R]), 0.022, renk.ten, golge(renk.ten, 0.6));
      [1, -1].forEach(function (y) { kure(L, B2([0.038 * y, 0.025, BAS_R * 0.86]), 0.012, renk.yazi, null); });
      kure(L, B2([BAS_R, 0, -0.005]), 0.032, renk.sag, golge(renk.sag, 0.6));
      kure(L, B2([-BAS_R, 0, -0.005]), 0.032, renk.sol, golge(renk.sol, 0.6));
      L.sort(function (a, b) { return b.z - a.z; }).forEach(function (o) { o.ciz(x); });
    }

    // ---- köşedeki kanal çizimi
    function kanalCiz(x) {
      var K = O.kanal, d = O.durum(), Lk = O.kristaller(), m = ayar.metin();
      var boy = KB, x0 = 0, y0 = 0, R = boy * 0.25, cx = x0 + boy * 0.5, cy = y0 + boy * 0.5;
      x.save();
      function pt(f, r) { return [cx + Math.cos(f) * (r || R), cy - Math.sin(f) * (r || R)]; }
      var fa = K.fa, fb = H.aci(K, K.A), gb = K.bosluk;
      // utrikulus: boşluk yönünde elips
      var uc = pt(gb, R * 1.18);
      x.fillStyle = renk.utr; x.strokeStyle = renk.kanalKenar; x.lineWidth = 1.2;
      x.beginPath(); x.ellipse(uc[0], uc[1], R * 0.5, R * 0.34, -gb, 0, 2 * Math.PI); x.fill(); x.stroke();
      // kanal: koyu kenar + açık iç
      function yol() {
        x.beginPath(); var a = pt(fa), b = pt(fb);
        x.moveTo(uc[0] + (a[0] - uc[0]) * 0.55, uc[1] + (a[1] - uc[1]) * 0.55); x.lineTo(a[0], a[1]);
        x.arc(cx, cy, R, -fa, -fb, K.yon > 0);
        x.lineTo(uc[0] + (b[0] - uc[0]) * 0.55, uc[1] + (b[1] - uc[1]) * 0.55);
      }
      x.lineCap = 'round'; x.lineJoin = 'round';
      yol(); x.strokeStyle = renk.kanalKenar; x.lineWidth = R * 0.26 + 2; x.stroke();
      yol(); x.strokeStyle = renk.kanal; x.lineWidth = R * 0.26; x.stroke();
      // ampulla şişkinliği ve kupula
      var ap = pt(fa + K.yon * 0.12);
      x.fillStyle = renk.kanal; x.strokeStyle = renk.kanalKenar; x.beginPath(); x.arc(ap[0], ap[1], R * 0.22, 0, 2 * Math.PI); x.fill(); x.stroke();
      var fk = fa + K.yon * 0.12, ic = pt(fk, R * 0.8), dis = pt(fk, R * 1.2), tg = [-Math.sin(fk) * K.yon, -Math.cos(fk) * K.yon], bk = d.bukulme * R * 0.2;
      var orta = [(ic[0] + dis[0]) / 2 + tg[0] * bk, (ic[1] + dis[1]) / 2 + tg[1] * bk];
      x.strokeStyle = renk.kupula; x.lineWidth = 3; x.beginPath(); x.moveTo(ic[0], ic[1]); x.quadraticCurveTo(orta[0], orta[1], dis[0], dis[1]); x.stroke();
      // kristaller
      x.fillStyle = renk.kristal; x.strokeStyle = golge(renk.kristal, 0.55); x.lineWidth = 1;
      var rK = Math.max(2.4, R * 0.055);
      Lk.forEach(function (k, i) {
        var q;
        if (k.cikti) q = [uc[0] + (k.w - 0.5) * R * 0.55, uc[1] + k.d * R * 0.35];
        else if (k.yapisik) { var t = 0.2 + 0.6 * (i / Math.max(1, Lk.length - 1)); q = [ic[0] + (dis[0] - ic[0]) * t + tg[0] * (bk * 0.9 + R * 0.06), ic[1] + (dis[1] - ic[1]) * t + tg[1] * (bk * 0.9 + R * 0.06)]; }
        else q = pt(H.aci(K, k.u), R * (1 + k.d * 0.14));
        x.beginPath(); x.arc(q[0], q[1], rK, 0, 2 * Math.PI); x.fill(); x.stroke();
      });
      // yerçekimi oku (kanal düzlemindeki bileşeni)
      var g = d.g || [0, -1, 0], ge1 = dot(g, K.e1), ge2 = dot(g, K.e2), gl = Math.min(1.4, Math.hypot(ge1, ge2));
      if (gl > 0.08) {
        var ox = x0 + boy * 0.13, oy = y0 + boy * 0.86, ux = ge1 / Math.hypot(ge1, ge2), uy = -ge2 / Math.hypot(ge1, ge2), Lo = boy * 0.11 * gl;
        x.strokeStyle = renk.soluk; x.fillStyle = renk.soluk; x.lineWidth = 2;
        x.beginPath(); x.moveTo(ox - ux * Lo, oy - uy * Lo); x.lineTo(ox + ux * Lo, oy + uy * Lo); x.stroke();
        x.beginPath(); x.moveTo(ox + ux * (Lo + 6), oy + uy * (Lo + 6)); x.lineTo(ox + ux * Lo - uy * 4, oy + uy * Lo + ux * 4); x.lineTo(ox + ux * Lo + uy * 4, oy + uy * Lo - ux * 4); x.closePath(); x.fill();
      }
      // yazılar
      x.font = '600 11px "IBM Plex Sans", sans-serif'; x.textBaseline = 'top'; x.textAlign = 'left'; x.fillStyle = renk.yazi;
      var bas = (taraf === 'sag' ? m.sag : m.sol) + ' ' + m[K.ad];
      x.fillText(bas, x0 + 4, y0 + 2, boy - 8);
      x.font = '500 10px "IBM Plex Sans", sans-serif'; x.fillStyle = renk.soluk;
      var at = pt(fa, R * 1.42), aw = x.measureText(m.ampulla).width;
      x.textAlign = 'left'; x.textBaseline = 'middle';
      function etiket(t, px, py) { x.save(); x.lineJoin = 'round'; x.lineWidth = 3; x.strokeStyle = renk.zemin; x.strokeText(t, px, py); x.restore(); x.fillText(t, px, py); }
      etiket(m.ampulla, Math.max(x0 + 2, Math.min(x0 + boy - aw - 2, Math.cos(fa) >= 0 ? at[0] : at[0] - aw)), Math.max(y0 + 22, Math.min(y0 + boy - 22, at[1])));
      x.textAlign = 'center'; var ut = pt(gb, R * 1.18 + R * 0.78), uw = x.measureText(m.utrikulus).width / 2 + 2;
      etiket(m.utrikulus, Math.max(x0 + uw, Math.min(x0 + boy - uw, ut[0])), Math.max(y0 + 22, Math.min(y0 + boy - 20, ut[1])));
      x.textAlign = 'left'; x.fillText(m.yer, x0 + boy * 0.13 + boy * 0.11, y0 + boy * 0.86);
      // kupula durumu
      var b = d.bukulme * K.uyari, durum = Math.abs(d.bukulme) < 0.18 ? m.dik : b > 0 ? m.uyari : m.baskilanma;
      x.font = '600 11px "IBM Plex Sans", sans-serif'; x.textAlign = 'right'; x.textBaseline = 'bottom';
      x.fillStyle = Math.abs(d.bukulme) < 0.18 ? renk.soluk : b > 0 ? renk.uyari : renk.baski;
      x.fillText(durum, x0 + boy - 2, y0 + boy - 2, boy * 0.62);
      x.restore();
    }

    function ciz() {
      if (!renk) renkOku();
      var gen = cv.clientWidth || 360, dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = gen; Hh = Math.round(gen * 0.68);
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
      var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, W, Hh); x.fillStyle = renk.zemin; x.fillRect(0, 0, W, Hh);
      sahneCiz(x);
      KB = kv.clientWidth || 150;
      if (kv.width !== Math.round(KB * dpr)) { kv.width = kv.height = Math.round(KB * dpr); }
      var y = kv.getContext('2d'); y.setTransform(dpr, 0, 0, dpr, 0, 0); y.clearRect(0, 0, KB, KB); kanalCiz(y);
    }

    // ---- yazılar
    var sonAdim = -1;
    function yaz() {
      var m = ayar.metin(), Y = yazilar(), k = O.durum().adim;
      cv.setAttribute('aria-label', m.canvas); kv.setAttribute('aria-label', (taraf === 'sag' ? m.sag : m.sol) + ' ' + m[O.kanal.ad]);
      tarafAd.textContent = m.taraf;
      Object.keys(tarafB).forEach(function (t) { tarafB[t].textContent = m[t]; tarafB[t].setAttribute('aria-pressed', t === taraf ? 'true' : 'false'); });
      cesitAd.textContent = m.tip;
      Object.keys(cesitB).forEach(function (c) { cesitB[c].textContent = ayar.cesitAd(c); cesitB[c].setAttribute('aria-pressed', c === cesit ? 'true' : 'false'); });
      var a = Y[k];
      simdiYazi.replaceChildren.apply(simdiYazi, [el('b', { text: (k + 1) + '. ' + a.k }), document.createTextNode(a.a ? ' ' + a.a : ''),
        a.s ? el('span', { 'class': 'mv-sure', text: m.gercek + ': ' + a.s }) : null].filter(Boolean));
      listeBas.textContent = m.adimlar;
      if (liste.childNodes.length !== Y.length || sonAdim === -2) liste.replaceChildren();
      if (!liste.childNodes.length) Y.forEach(function (y, i) {
        var b = el('button', { type: 'button', 'class': 'mv-adim' });
        b.addEventListener('click', function () { O.git(i); bitti = false; ciz(); yaz(); if (!oynuyor && !azalt) { oynuyor = true; oynatYaz(); basla(); } });
        liste.appendChild(el('li', null, [b]));
      });
      Y.forEach(function (y, i) {
        var b = liste.childNodes[i].firstChild;
        b.replaceChildren.apply(b, [el('b', { text: y.k }), y.a ? el('span', { text: y.a }) : null, y.s ? el('span', { 'class': 'mv-sure', text: m.gercek + ': ' + y.s }) : null].filter(Boolean));
        b.setAttribute('aria-current', i === k ? 'step' : 'false');
      });
      sonAdim = k;
      kanalNot.textContent = m.kanalNot; sema.textContent = m.sema;
    }

    // ---- döngü
    function adimla(t) {
      if (!calisiyor) return;
      if (kap.offsetParent === null || !kok.isConnected) { calisiyor = false; return; }
      var dt = Math.min(0.05, (t - son) / 1000); son = t;
      var once = O.durum().adim;
      if (O.ilerle(dt)) { bitti = true; oynuyor = false; oynatYaz(); }
      if (O.durum().adim !== once || bitti) yaz();
      ciz();
      if (oynuyor) kare = requestAnimationFrame(adimla); else calisiyor = false;
    }
    function basla() { if (calisiyor || !oynuyor) return; calisiyor = true; son = performance.now(); kare = requestAnimationFrame(adimla); }
    function durdur() { calisiyor = false; if (kare) cancelAnimationFrame(kare); kare = null; }
    window.addEventListener('resize', function () { if (kok.isConnected && kap.offsetParent !== null) ciz(); });

    yeniOynatici();
    oynuyor = !azalt; oynatYaz(); yaz();
    requestAnimationFrame(function () { ciz(); basla(); });
    return {
      kok: kok,
      goster: function () { renk = null; yaz(); ciz(); if (oynuyor) basla(); },
      yenile: function () { renk = null; sonAdim = -2; yaz(); if (kok.isConnected) ciz(); },
      durdur: function () { oynuyor = false; durdur(); oynatYaz(); }
    };
  }
  window.Manevra = { kur: kur };
})();
