/* Koklea kesiti ve tüylü hücreler: 3D görüntüleyici (#3d/korti, 2026-11-21).
   - Kütüphanesiz WebGL. Model dosyası yok: bütün biçimler burada kodla üretilir (kesit çokgenlerinin dilim boyunca
     uzatılması, hücreler için döndürme yüzeyi, sinir lifleri için tüp). Ölçülmüş veri değildir, şematiktir.
   - Hareket yok (proje sahibinin kararı: 3D sayfasında yalnızca yapılar; hareketli kısım Ses laboratuvarında).
   - Dokunulan yapı belirgin kalır, diğerleri silikleşir; bilgi kartı açılır. Yapı listesinden de seçilebilir.
   - Yazılar korti-veri.js (window.KORTI_VERI), renkler korti.css (--kt-<kimlik>). Yönetici düzenlemesi app.js'teki kartEki kancasıyla.
   Kullanım: Korti.kur(kok, { veri, kartEki }) → { yenile }.
   Eksenler: x sağa (sol = modiolus, sağ = dış duvar), y yukarı, z dilim boyunca (kamera başlangıçta +z tarafından bakar). */
(function () {
  'use strict';

  /* ---------- küçük matematik ---------- */
  function rx(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function ry(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
  function mul(a, b) { var o = [], r, c; for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]); return o; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function sc(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function nrm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function D(g) { return g * Math.PI / 180; }

  /* ---------- ağ (mesh) üretimi ---------- */
  // S: köşe başına bir değer (hareket için): stereosilyada dipten uca 0→1 (iç tüylü hücrede 2→3), sinir lifinde hücreden gangliyona 0→1.
  function Ag() { return { P: [], N: [], S: [], I: [] }; }
  function nokta(A, p, n, s) { A.P.push(p[0], p[1], p[2]); A.N.push(n[0], n[1], n[2]); A.S.push(s || 0); return A.P.length / 3 - 1; }
  function alan(p) { var s = 0; for (var i = 0; i < p.length; i++) { var j = (i + 1) % p.length; s += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } return s / 2; }
  function ccw(p) { return alan(p) < 0 ? p.slice().reverse() : p; }
  // Kulak kesme (ear clipping): basit (kendini kesmeyen) çokgeni üçgenlere böler. Çokgen saat yönünün tersine olmalı.
  function ucgenle(p) {
    var idx = p.map(function (_, i) { return i; }), out = [], koruma = 0;
    function cr(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
    function icinde(q, a, b, c) { return cr(a, b, q) >= 0 && cr(b, c, q) >= 0 && cr(c, a, q) >= 0; }
    while (idx.length > 3 && koruma++ < 10000) {
      var n = idx.length, bulundu = false;
      for (var k = 0; k < n; k++) {
        var a = idx[(k + n - 1) % n], b = idx[k], c = idx[(k + 1) % n];
        if (cr(p[a], p[b], p[c]) <= 1e-10) continue;
        var ic = false;
        for (var m = 0; m < n; m++) { var q = idx[m]; if (q === a || q === b || q === c) continue; if (icinde(p[q], p[a], p[b], p[c])) { ic = true; break; } }
        if (ic) continue;
        out.push([a, b, c]); idx.splice(k, 1); bulundu = true; break;
      }
      if (!bulundu) break;
    }
    if (idx.length === 3) out.push(idx.slice());
    return out;
  }
  // 2B kesit çokgenini z0..z1 arasında uzatır (yan yüzler yumuşak gölgeli, keskin köşelerde ayrık; iki uçta kapak).
  function uzat(A, poly, z0, z1, kapakYok) {
    var p = ccw(poly), n = p.length, i, en = [];
    for (i = 0; i < n; i++) { var a = p[i], b = p[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; en.push([dy / l, -dx / l, 0]); }
    for (i = 0; i < n; i++) {
      var j = (i + 1) % n, nA = en[i], nB = en[i];
      var onc = en[(i + n - 1) % n], son = en[j];
      if (onc[0] * en[i][0] + onc[1] * en[i][1] > 0.82) nA = nrm([onc[0] + en[i][0], onc[1] + en[i][1], 0]);
      if (son[0] * en[i][0] + son[1] * en[i][1] > 0.82) nB = nrm([son[0] + en[i][0], son[1] + en[i][1], 0]);
      var v0 = nokta(A, [p[i][0], p[i][1], z0], nA), v1 = nokta(A, [p[j][0], p[j][1], z0], nB), v2 = nokta(A, [p[j][0], p[j][1], z1], nB), v3 = nokta(A, [p[i][0], p[i][1], z1], nA);
      A.I.push(v0, v1, v2, v0, v2, v3);
    }
    if (kapakYok) return;
    var T = ucgenle(p);
    [[z0, -1], [z1, 1]].forEach(function (zz) {
      var bas = A.P.length / 3;
      p.forEach(function (q) { nokta(A, [q[0], q[1], zz[0]], [0, 0, zz[1]]); });
      T.forEach(function (t) { A.I.push(bas + t[0], bas + t[1], bas + t[2]); });
    });
  }
  // Düz yüzey (yalnızca kapak): skalaların sıvı boşluğu, dilimin arka yüzünde
  function yuzey(A, poly, z) {
    var p = ccw(poly), bas = A.P.length / 3;
    p.forEach(function (q) { nokta(A, [q[0], q[1], z], [0, 0, 1]); });
    ucgenle(p).forEach(function (t) { A.I.push(bas + t[0], bas + t[1], bas + t[2]); });
  }
  // Dikey eksen çevresinde döndürme yüzeyi (hücreler): profil [[yarıçap, y], ...] alttan üste; merkez (x, z)
  function dondur(A, x, z, profil, seg, sFn) {
    var bas = A.P.length / 3, k, s;
    for (k = 0; k < profil.length; k++) {
      var o = profil[Math.max(0, k - 1)], sn = profil[Math.min(profil.length - 1, k + 1)];
      var tr = sn[0] - o[0], ty = sn[1] - o[1], tl = Math.hypot(tr, ty) || 1, nr = ty / tl, ny = -tr / tl;
      for (s = 0; s < seg; s++) {
        var a = s / seg * 2 * Math.PI, c = Math.cos(a), si = Math.sin(a);
        nokta(A, [x + profil[k][0] * c, profil[k][1], z + profil[k][0] * si], [nr * c, ny, nr * si], sFn ? sFn(profil[k][1]) : 0);
      }
    }
    for (k = 0; k < profil.length - 1; k++) for (s = 0; s < seg; s++) {
      var a0 = bas + k * seg + s, a1 = bas + k * seg + (s + 1) % seg, b0 = a0 + seg, b1 = a1 + seg;
      A.I.push(a0, a1, b1, a0, b1, b0);
    }
  }
  // Tüp (sinir lifi): 3B nokta dizisi boyunca
  function tup(A, yol, r, seg, s0, s1) {
    var bas = A.P.length / 3, k, s;
    for (k = 0; k < yol.length; k++) {
      var t = nrm(sub(yol[Math.min(yol.length - 1, k + 1)], yol[Math.max(0, k - 1)]));
      var ref = Math.abs(t[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], b1 = nrm(cross(t, ref)), b2 = cross(t, b1);
      for (s = 0; s < seg; s++) {
        var a = s / seg * 2 * Math.PI, n = [b1[0] * Math.cos(a) + b2[0] * Math.sin(a), b1[1] * Math.cos(a) + b2[1] * Math.sin(a), b1[2] * Math.cos(a) + b2[2] * Math.sin(a)];
        nokta(A, [yol[k][0] + n[0] * r, yol[k][1] + n[1] * r, yol[k][2] + n[2] * r], n, (s0 || 0) + ((s1 || 0) - (s0 || 0)) * k / (yol.length - 1));
      }
    }
    for (k = 0; k < yol.length - 1; k++) for (s = 0; s < seg; s++) {
      var a0 = bas + k * seg + s, a1 = bas + k * seg + (s + 1) % seg;
      A.I.push(a0, a1, a1 + seg, a0, a1 + seg, a0 + seg);
    }
  }
  function yay(r, a0, a1, n, cx, cy) { var o = []; for (var i = 0; i <= n; i++) { var a = D(a0 + (a1 - a0) * i / n); o.push([(cx || 0) + r * Math.cos(a), (cy || 0) + r * Math.sin(a)]); } return o; }
  // Kalın çizgi (zar): orta çizgi noktalarından, kalınlık k
  function serit(orta, k) {
    var ust = [], alt = [];
    orta.forEach(function (p, i) {
      var a = orta[Math.max(0, i - 1)], b = orta[Math.min(orta.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      var nx = -dy / l * k / 2, ny = dx / l * k / 2;
      ust.push([p[0] + nx, p[1] + ny]); alt.unshift([p[0] - nx, p[1] - ny]);
    });
    return ust.concat(alt);
  }
  function elips(cx, cy, rxx, ryy, n) { var o = []; for (var i = 0; i < n; i++) { var a = i / n * 2 * Math.PI; o.push([cx + rxx * Math.cos(a), cy + ryy * Math.sin(a)]); } return o; }

  /* ---------- model ----------
     Birim: yaklaşık 0,1 mm, ama hücreler çok büyütüldü (oranlar gerçek değil). Kemik kanalın iç yarıçapı 1. */
  var L = 0.84, Z0 = -L / 2, Z1 = L / 2, ARA = 0.06, SAYI = Math.round(L / ARA);
  function hucreZ(k, kay) { return Z0 + ARA / 2 + (k + (kay || 0)) * ARA; }
  var ITH_X = -0.215, DTH_X = [0.105, 0.155, 0.205], ITH_UST = 0.125, DTH_UST = 0.172;
  function tmAlt(x) { return 0.205 + (x + 0.15) * 0.035; }   // tektoryal membranın alt yüzü (dış tüylü hücrelerin üstünde)

  function modelKur() {
    var M = {}, i, k;
    function ag(id) { return M[id] || (M[id] = Ag()); }

    // Kemik duvar: modiolus tarafı açık C biçimi (orada osseöz spiral lamina, gangliyon ve sinir var)
    uzat(ag('kemik'), yay(1.22, -150, 150, 48).concat(yay(1.0, 150, -150, 48)), Z0, Z1);

    // Osseöz spiral lamina: üst plaka (+ spiral limbus) ve alt plaka; aralarından sinir lifleri geçer
    uzat(ag('osl'), [[-1.02, 0.16], [-0.64, 0.11], [-0.6, 0.17], [-0.52, 0.19], [-0.42, 0.188], [-0.35, 0.13], [-0.3, 0.05], [-0.3, 0.016], [-0.62, 0.03], [-1.02, 0.09]], Z0, Z1);
    uzat(ag('osl'), [[-1.02, -0.12], [-0.62, -0.06], [-0.3, -0.016], [-0.3, -0.046], [-0.62, -0.1], [-1.02, -0.19]], Z0, Z1);

    // Spiral ligament (dış duvar) ve stria vaskülaris (iç yüzünde, skala media tarafında)
    // 2026-11-21: ligamentin iç sınırı stria boyunca da 0,8; önceden stria ile aynı alanı paylaşıyordu (üst üste binen yüzeyler kırmızı benek yapıyordu).
    uzat(ag('ligament'), yay(0.995, -45, 50, 30).concat(yay(0.8, 50, -45, 30)), Z0, Z1);
    uzat(ag('stria'), yay(0.8, 7, 43, 12).concat(yay(0.735, 43, 7, 12)), Z0, Z1);

    // Zarlar
    // Baziler membran enine sık noktalı (animasyonda her nokta kendi yerinde bükülür; yalnızca iki ucu olsaydı membran hareket etmezdi)
    var bmUst = [], bmAlt = [];
    for (var bx = -0.3; bx <= 0.8001; bx += 0.025) { var xx = Math.round(bx * 1000) / 1000; bmUst.push([xx, -0.006]); bmAlt.unshift([xx, -0.038]); }
    uzat(ag('baziler'), bmUst.concat(bmAlt), Z0, Z1);
    var rA = [-0.5, 0.186], rB = [0.555, 0.5];
    uzat(ag('reissner'), serit([rA, [0.02, 0.36], rB], 0.016), Z0, Z1);
    uzat(ag('tektoryal'), [[-0.46, 0.186], [-0.2, 0.218], [0.05, 0.25], [0.25, 0.262], [0.345, 0.25], [0.35, 0.232], [0.25, tmAlt(0.25)], [0.05, tmAlt(0.05)], [-0.15, 0.19], [-0.4, 0.165]], Z0, Z1);

    // Destek hücreleri: iç falangeal (iç tüylü hücrenin yanında, alçak), Hensen ve Claudius (dışta) — dilim boyunca
    uzat(ag('destek'), [[-0.3, -0.006], [-0.14, -0.006], [-0.14, 0.055], [-0.2, 0.062], [-0.26, 0.06], [-0.3, 0.03]], Z0, Z1);
    uzat(ag('destek'), [[0.235, -0.006], [0.5, -0.006], [0.46, 0.06], [0.4, 0.12], [0.33, 0.165], [0.27, 0.175], [0.235, 0.15]], Z0, Z1);
    uzat(ag('destek'), [[0.5, -0.006], [0.79, -0.006], [0.79, 0.02], [0.72, 0.04], [0.62, 0.05], [0.5, 0.045]], Z0, Z1);

    for (k = 0; k < SAYI; k++) {
      var z = hucreZ(k);
      // Pilar hücreler: her hücre sırasında bir çift; aralarındaki üçgen boşluk Corti tüneli
      uzat(ag('pilar'), serit([[-0.13, -0.006], [-0.035, 0.14]], 0.022), z - 0.017, z + 0.017);
      uzat(ag('pilar'), serit([[0.07, -0.006], [-0.018, 0.14]], 0.022), z - 0.017, z + 0.017);
      uzat(ag('pilar'), [[-0.052, 0.128], [-0.004, 0.128], [-0.01, 0.156], [-0.046, 0.156]], z - 0.017, z + 0.017);
      // İç tüylü hücre (kadeh biçimli)
      dondur(ag('ith'), ITH_X, z, [[0, 0.034], [0.018, 0.038], [0.033, 0.058], [0.036, 0.08], [0.029, 0.103], [0.021, 0.117], [0.02, ITH_UST], [0, ITH_UST]], 14);
      // İç tüylü hücrenin stereosilyaları: iki sıra, dışa (sağa) doğru uzayan; hafif U dizilim
      for (i = -3; i <= 3; i++) {
        var u = i / 3, zz = z + i * 0.0068;
        [[-0.006, 0.016], [0.006, 0.028]].forEach(function (sr) {
          var x0 = ITH_X + sr[0] - 0.006 * u * u;
          dondur(ag('silya'), x0, zz, [[0.0042, ITH_UST - 0.004], [0.0042, ITH_UST + sr[1]], [0, ITH_UST + sr[1] + 0.004]], 6, function (y) { return 2 + Math.max(0, Math.min(1, (y - ITH_UST + 0.004) / (sr[1] + 0.008))); });
        });
      }
      // Dış tüylü hücreler (üç sıra, sıralar arasında kayık), altlarında Deiters hücreleri, üstlerinde W dizilimli stereosilyalar
      DTH_X.forEach(function (x, sira) {
        var zc = hucreZ(k, (sira - 1) * 0.33);
        dondur(ag('dth'), x, zc, [[0, 0.076], [0.016, 0.078], [0.0185, 0.09], [0.0185, 0.164], [0.016, DTH_UST], [0, DTH_UST]], 12);
        dondur(ag('destek'), x, zc, [[0, -0.006], [0.012, -0.006], [0.008, 0.03], [0.011, 0.055], [0.02, 0.074], [0.016, 0.078], [0, 0.078]], 10);
        var uzun = tmAlt(x) - DTH_UST;
        [1, 0.7, 0.45].forEach(function (oran, s) {   // en uzun sıra en dışta
          for (i = -3; i <= 3; i++) {
            var w = Math.abs(i) / 3, xs = x + 0.007 - s * 0.0055 - 0.009 * w;   // V/W biçimi: tepe dışa (sağa) bakar
            var boy = uzun * oran + 0.008;
            dondur(ag('silya'), xs, zc + i * 0.0062, [[0.0038, DTH_UST - 0.004], [0.0038, DTH_UST + uzun * oran], [0, DTH_UST + uzun * oran + 0.004]], 6, function (y) { return Math.max(0, Math.min(1, (y - DTH_UST + 0.004) / boy)) * oran; });
          }
        });
      });
    }

    // Spiral gangliyon (modiolusta, spiral boyunca) ve sinir lifleri
    var gx = -1.2, gy = -0.03;
    uzat(ag('ganglion'), elips(gx, gy, 0.13, 0.11, 24), Z0, Z1);
    for (k = 0; k < SAYI; k += 2) {
      var z2 = hucreZ(k), ortak = [[-0.3, -0.002, z2], [-0.62, -0.012, z2], [-1.0, -0.025, z2], [gx + 0.12, gy, z2]];
      tup(ag('sinir'), [[ITH_X, 0.04, z2], [-0.25, 0.012, z2]].concat(ortak), 0.0075, 6, 0, 1);
      var zo = hucreZ(k, 0);
      tup(ag('sinir'), [[DTH_X[1], 0.07, zo], [0.14, 0.03, zo], [0.06, 0.016, zo], [-0.03, 0.016, zo], [-0.13, 0.01, zo], [-0.24, 0.008, zo]].concat(ortak.map(function (q, i) { return [q[0], q[1] - (i === 0 ? 0.004 : 0.012), q[2]]; })), 0.006, 6, 2, 3);
      if (k % 4 === 0) tup(ag('sinir'), [[gx - 0.12, gy, z2], [-1.42, -0.06, z2], [-1.62, -0.12, z2]], 0.016, 8, 1, 1.4);
    }

    // Sıvı boşlukları: dilimin arka yüzünde (z0'ın biraz arkasında) düz renkli yüzeyler
    var ZA = Z0 - 0.006;
    yuzey(ag('sm'), [[-0.44, 0.186], [0.02, 0.352], [0.55, 0.49]].concat(yay(0.735, 43, 7, 10), [[0.8, 0.098], [0.8, -0.006], [-0.3, -0.006], [-0.3, 0.05], [-0.35, 0.13]]), ZA);
    yuzey(ag('sv'), [[-0.5, 0.195], [0.02, 0.37], [0.56, 0.51]].concat(yay(0.8, 43, 50, 3), yay(0.995, 50, 150, 30), [[-1.02, 0.16], [-0.64, 0.11], [-0.6, 0.17], [-0.52, 0.19]]), ZA);
    yuzey(ag('st'), [[-1.02, -0.19], [-0.3, -0.046], [0.8, -0.038]].concat(yay(0.8, -1, -45, 12), yay(0.995, -45, -150, 30)), ZA);
    return M;
  }

  /* ---------- görüntüleyici ---------- */
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  // Sahnenin arka plan rengi (CSS'ten, ör. "rgb(255, 255, 255)"): tuval opak boyanır (2026-11-21)
  function arkaRenk(el) { var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(window.getComputedStyle(el).backgroundColor || ''); return m ? [m[1] / 255, m[2] / 255, m[3] / 255] : [1, 1, 1]; }
  function renkCoz(s) {
    s = (s || '').trim(); var m = /^#([0-9a-f]{6})$/i.exec(s);
    if (m) { var n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    return null;
  }
  /* Gölgelendirici. Hareket (yalnızca Ses laboratuvarındaki Corti animasyonunda; 3D sayfasında hepsi 0):
     th: baziler membranın yer değiştirmesi (+ = yukarı, skala vestibuliye doğru). Organ, osseöz spiral laminanın ucu çevresinde
     küçük açıyla döner (dB: baziler membranın biçimi, iki ucu sabit); tektoryal membran limbustaki tutunma yeri çevresinde döner.
     İki dönme noktası farklı olduğu için retiküler lamina ile tektoryal membran arasında kayma olur, dış tüylü hücre tüyleri bükülür.
     ihc: iç tüylü hücre tüylerinin sıvı akımıyla bükülmesi (hıza bağlı, fazı önde). kis: dış tüylü hücrenin kısalması (elektromotilite).
     tur: 1 baziler membran, 2 Corti organı (hücreler), 3 dış tüylü hücre, 4 tektoryal membran, 5 stereosilya, 6 sinir lifi.
     s (köşe değeri): stereosilyada dipten uca, sinirde lif boyunca. Sinir sinyali (sp konumu) parlayan bir halka olarak ilerler. */
  var VS = 'attribute vec3 p;attribute vec3 n;attribute float s;uniform mat4 mvp;uniform mat3 rot;' +
    'uniform float tur;uniform float th;uniform float ihc;uniform float kis;uniform vec3 kay;uniform float olc;varying vec3 vn;varying float vs;' +
    'float dB(float x){return th*clamp(min(x+0.3,0.8-x),0.0,1.0);}' +
    'vec2 org(vec2 q){return vec2(-th*q.y,dB(q.x));}' +
    'vec2 tmD(vec2 q){return th*0.76*vec2(-(q.y-0.185),q.x+0.44);}' +
    'void main(){vec3 q=p*olc+kay;vs=s;' +
    'if(tur>0.5&&tur<1.5){q.y+=dB(q.x);}' +
    'else if(tur>1.5&&tur<2.5){q.xy+=org(q.xy);}' +
    'else if(tur>2.5&&tur<3.5){q.y=0.076+(q.y-0.076)*(1.0-kis);q.xy+=org(q.xy);}' +
    'else if(tur>3.5&&tur<4.5){q.xy+=tmD(q.xy);}' +
    'else if(tur>4.5&&tur<5.5){if(s<1.5){vec2 b=org(q.xy)+vec2(0.0,-kis*0.096);q.xy+=mix(b,tmD(q.xy),s);}else{q.xy+=org(q.xy)+vec2(ihc*0.04*(s-2.0),0.0);}}' +
    'else if(tur>5.5&&tur<6.5){q.xy+=org(q.xy)*clamp((q.x+0.3)/0.012,0.0,1.0);}' +
    'vn=rot*n;gl_Position=mvp*vec4(q,1.0);}';
  var FS = 'precision mediump float;varying vec3 vn;varying float vs;uniform vec4 col;uniform float duz;uniform float parla;uniform vec3 vurgu;uniform vec3 elek;uniform float sp;uniform float spOn;uniform float sinirF;' +
    'void main(){vec3 nn=normalize(vn);float d=abs(nn.z);float s=pow(d,24.0)*0.16;vec3 c=col.rgb*(0.62+0.38*d)+vec3(s);c=mix(c,col.rgb*(0.86+0.14*d),duz);' +
    'c=mix(c,vurgu,clamp(parla,0.0,1.0)*0.6);' +
    'if(sinirF>0.5&&vs<1.5){float g=exp(-pow((vs-sp)/0.085,2.0))*spOn*1.8;c=mix(c,elek,clamp(g,0.0,1.0));}' +   // 2026-11-21: sinyal daha geniş ve tam renk (opak)
    'gl_FragColor=vec4(c,col.a);}';
  var FS_SEC = 'precision mediump float;uniform vec4 col;void main(){gl_FragColor=col;}';

  /* Görüntüleyici (iki model ortak kullanır: koklea kesiti burada, denge sistemi korti/denge3d.js).
     ayar: { veri, kartEki, sinif (kök öğeye ek sınıf),
             model: function () → parçalar ya da Promise (parçalar: { kimlik: { P, N, I, grup?, saydam? } }),
             sivi: [kimlik] (düz gölgeli sıvı yüzeyleri), renk: function (kimlik) → CSS değişken adı,
             nokta: function (yapı kimliği) → listedeki noktanın CSS değişkeni, basR, genel: { cen, rad } (yoksa modelden),
             yaklasEnAz: seçilen yapıya yaklaşırken en küçük yarıçap }
     grup: parçanın ait olduğu yapı (seçim ve listede yapı kimliği); yoksa parça kimliği.
     saydam: seçim yokken bu parça yarı saydam çizilir (yalnızca en öndeki yüzeyi, derinlik ön geçişiyle). */
  function kur(kok, ayar) {
    var V = ayar.veri, M = V.metinler, IP = window.SesLabIpucu;
    kok.textContent = ''; kok.classList.add('g3d', 'kt'); if (ayar.sinif) kok.classList.add(ayar.sinif);
    var sahne = h('div', 'g3d-sahne'), cv = h('canvas'), etiket = h('div', 'g3d-etiket g3d-sagust'), durum = h('p', 'g3d-durum', M.yukleniyor);
    var genelBtn = h('button', 'sl-yuv'); genelBtn.type = 'button';
    var sagAlt = h('div', 'sl-sag-alt'); sagAlt.appendChild(genelBtn);
    cv.setAttribute('role', 'img');
    sahne.appendChild(cv); sahne.appendChild(etiket); sahne.appendChild(durum); sahne.appendChild(sagAlt);
    var ipucu = h('p', 'g3d-not g3d-ipucu'), kart = h('div', 'g3d-kart'), nmEl = h('h4'), dsEl = h('p'), yuva = h('div', 'g3d-kart-ek');
    kart.appendChild(nmEl); kart.appendChild(dsEl); kart.appendChild(yuva);
    var listeKutu = h('div', 'kt-liste'), notEl = h('p', 'g3d-not'), metinYuva = h('div', 'g3d-kart-ek');
    [sahne, ipucu, kart, listeKutu, notEl, metinYuva].forEach(function (e) { kok.appendChild(e); });
    var genelIp = null;
    if (IP) { IP.simge(genelBtn, 'genel'); genelIp = IP.bagla(genelBtn, function () { return M.genelGorunum; }); }
    else genelBtn.textContent = '⟲';
    // Büyüteç: sağ alttaki düğmelerin en solunda; yakın = model 2 kat yakın (iki parmakla yakınlaştırmayla aynı değişken)
    var YAKIN = 0.5 * (ayar.genelZoom || 1), buyBtn = h('button', 'sl-yuv'), buyIp = null; sagAlt.insertBefore(buyBtn, sagAlt.firstChild);
    if (IP) buyIp = IP.buyutec(buyBtn, { yakinMi: function () { return zoom < 0.8 * (ayar.genelZoom || 1); }, degistir: function () { zoom = zoom < 0.8 * (ayar.genelZoom || 1) ? (ayar.genelZoom || 1) : YAKIN; dirty = true; },
      yakinlastir: function () { return M.yakinlastir || 'Yakınlaştır'; }, uzaklastir: function () { return M.uzaklastir || 'Uzaklaştır'; } });
    else { buyBtn.type = 'button'; buyBtn.textContent = '⌕'; buyBtn.addEventListener('click', function () { zoom = zoom < 0.8 * (ayar.genelZoom || 1) ? (ayar.genelZoom || 1) : YAKIN; dirty = true; }); }
    var renkAd = ayar.renk || function (id) { return '--kt-' + id; }, noktaAd = ayar.nokta || renkAd;
    // Hareket (yalnızca Ses laboratuvarı): oynat/duraklat düğmesi sağ altta (genel görünümün solunda), aşama yazısı modelin altında
    var ANIM = ayar.anim || null, oynuyor = false, oynatBtn = null, oynatIp = null, asamaEl = null;
    if (ANIM) {
      oynatBtn = h('button', 'sl-yuv'); oynatBtn.type = 'button'; sagAlt.insertBefore(oynatBtn, genelBtn);
      asamaEl = h('p', 'kt-asama'); asamaEl.setAttribute('aria-live', 'polite'); kok.insertBefore(asamaEl, ipucu);
      oynuyor = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (IP) oynatIp = IP.bagla(oynatBtn, function () { return oynuyor ? M.duraklat : M.oynat; });
      oynatBtn.addEventListener('click', function () { oynuyor = !oynuyor; oynatYaz(); });
    }
    function oynatYaz() {
      if (!oynatBtn) return;
      if (IP) IP.simge(oynatBtn, oynuyor ? 'duraklat' : 'oynat'); else oynatBtn.textContent = oynuyor ? '❚❚' : '▶';
      oynatBtn.setAttribute('aria-pressed', oynuyor ? 'true' : 'false'); if (oynatIp) oynatIp.yenile();
    }
    oynatYaz();

    var sel = null, dugmeler = {}, hazir = false;
    function metinler() {
      etiket.textContent = M.etiket; ipucu.textContent = M.ipucu; notEl.textContent = M.not;
      cv.setAttribute('aria-label', V.genel.ad + '. ' + M.etiket);
      if (genelIp) genelIp.yenile();
      metinYuva.textContent = ''; if (typeof ayar.kartEki === 'function') ayar.kartEki('metin', null, metinYuva);
    }
    function listeCiz() {
      listeKutu.textContent = ''; dugmeler = {};
      V.gruplar.forEach(function (g) {
        listeKutu.appendChild(h('p', 'g3d-baslik', g.ad));
        var kutuEl = h('div', 'g3d-yapilar');
        g.yapilar.forEach(function (id) {
          var y = V.yapilar[id]; if (!y) return;
          var b = h('button'); b.type = 'button'; b.setAttribute('aria-pressed', sel === id ? 'true' : 'false');
          var nk = h('span', 'g3d-nokta'); nk.style.background = 'var(' + noktaAd(id) + ')';
          b.appendChild(nk); b.appendChild(h('span', null, y.ad));
          b.addEventListener('click', function () { if (hazir) sec(sel === id ? null : id, true); });
          kutuEl.appendChild(b); dugmeler[id] = b;
        });
        listeKutu.appendChild(kutuEl);
      });
    }
    function kartYaz() {
      var y = sel && V.yapilar[sel], o = y || V.genel;
      nmEl.textContent = o.ad; dsEl.textContent = o.aciklama; yuva.textContent = '';
      if (typeof ayar.kartEki === 'function') ayar.kartEki(y ? 'yapi' : 'genel', y ? sel : null, yuva);
      Object.keys(dugmeler).forEach(function (id) { dugmeler[id].setAttribute('aria-pressed', sel === id ? 'true' : 'false'); });
    }
    metinler(); listeCiz(); kartYaz();
    var api = { yenile: function () { metinler(); listeCiz(); kartYaz(); } };

    var gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
    if (!gl) { durum.textContent = M.baslatilamadi; return api; }
    function derle(vs, fs) {
      function sh(t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; }
      var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
      return pr;
    }
    var PR = derle(VS, FS), PS = derle(VS, FS_SEC);
    function konum(pr) {
      var o = { p: gl.getAttribLocation(pr, 'p'), n: gl.getAttribLocation(pr, 'n'), s: gl.getAttribLocation(pr, 's') };
      ['mvp', 'rot', 'col', 'duz', 'tur', 'th', 'ihc', 'kis', 'kay', 'olc', 'parla', 'vurgu', 'elek', 'sp', 'spOn', 'sinirF'].forEach(function (u) { o[u] = gl.getUniformLocation(pr, u); });
      return o;
    }
    var U = konum(PR), US = konum(PS);

    var PARCA = {}, SIRA = [], SIVI = ayar.sivi || [], RENK = {}, SILIK = [0.62, 0.68, 0.7], ARKA = [1, 1, 1], VURGU = [1, 0.42, 0.62], ELEK = [0.6, 0.35, 1];
    function renkleriOku() {
      var cs = window.getComputedStyle(kok);
      SIRA.forEach(function (id) { RENK[id] = renkCoz(cs.getPropertyValue(renkAd(id))) || SILIK; });
      ARKA = arkaRenk(sahne);
      VURGU = renkCoz(cs.getPropertyValue('--kt-vurgu')) || VURGU; ELEK = renkCoz(cs.getPropertyValue('--kt-elek')) || ELEK; PRENK = {};
    }
    // Kamera: kullanıcı döndürmesi R, merkez cen, yarıçap rad (seçilen yapıya yumuşakça yaklaşır)
    var BAS_R = ayar.basR || mul(rx(D(16)), ry(D(-32))), R = BAS_R.slice(), zoom = ayar.genelZoom || 1, FOV = D(26), TAN = Math.tan(FOV / 2);
    var GENEL = null, cen = [0, 0, 0], rad = 1, hedef = { cen: [0, 0, 0], rad: 1 };
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var dirty = true, durdu = false, mvpSon = null;
    function kutu(ids) {
      var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      ids.forEach(function (id) { var p = PARCA[id]; for (var a = 0; a < 3; a++) { if (p.mn[a] < mn[a]) mn[a] = p.mn[a]; if (p.mx[a] > mx[a]) mx[a] = p.mx[a]; } });
      return { cen: [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], rad: Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2 };
    }
    function parcalariKur(MODEL) {
      Object.keys(MODEL).forEach(function (id, no) {
        var A = MODEL[id];
        var P = A.P instanceof Float32Array ? A.P : new Float32Array(A.P), N = A.N instanceof Float32Array ? A.N : new Float32Array(A.N), I = A.I instanceof Uint16Array ? A.I : new Uint16Array(A.I);
        var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
        for (var j = 0; j < P.length; j++) { var a = j % 3; if (P[j] < mn[a]) mn[a] = P[j]; if (P[j] > mx[a]) mx[a] = P[j]; }
        function tampon(t, v) { var b = gl.createBuffer(); gl.bindBuffer(t, b); gl.bufferData(t, v, gl.STATIC_DRAW); return b; }
        var Sd = A.S && A.S.length ? (A.S instanceof Float32Array ? A.S : new Float32Array(A.S)) : new Float32Array(P.length / 3);
        PARCA[id] = { pb: tampon(gl.ARRAY_BUFFER, P), nb: tampon(gl.ARRAY_BUFFER, N), sb: tampon(gl.ARRAY_BUFFER, Sd), ib: tampon(gl.ELEMENT_ARRAY_BUFFER, I), n: I.length, mn: mn, mx: mx, kod: no + 1, grup: A.grup || id, saydam: A.saydam || 0, tur: ANIM ? (ANIM.tur(id) || 0) : 0 };
        SIRA.push(id);
      });
      renkleriOku();
      GENEL = ayar.genel || kutu(SIRA);
      cen = GENEL.cen.slice(); rad = GENEL.rad; hedef = { cen: cen.slice(), rad: rad };
      hazir = true; durum.hidden = true; boyut(); dirty = true;
    }

    function matris() {
      var asp = cv.width / cv.height, f = 1 / TAN, sig = asp < 1 ? 1 / asp : 1;
      var d = rad / Math.sin(FOV / 2) * 0.92 * Math.min(sig, 1.8) * zoom, near = Math.max(rad * 0.02, d - rad * 3), far = d + rad * 4;
      var Pm = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0];
      var t = [-(R[0] * cen[0] + R[1] * cen[1] + R[2] * cen[2]), -(R[3] * cen[0] + R[4] * cen[1] + R[5] * cen[2]), -(R[6] * cen[0] + R[7] * cen[1] + R[8] * cen[2]) - d];
      var Mm = [R[0], R[3], R[6], 0, R[1], R[4], R[7], 0, R[2], R[5], R[8], 0, t[0], t[1], t[2], 1];
      var o = new Float32Array(16), r, c, k, s;
      for (c = 0; c < 4; c++) for (r = 0; r < 4; r++) { s = 0; for (k = 0; k < 4; k++) s += Pm[k * 4 + r] * Mm[c * 4 + k]; o[c * 4 + r] = s; }
      return o;
    }
    function bagla(u, p) {
      gl.bindBuffer(gl.ARRAY_BUFFER, p.pb); gl.enableVertexAttribArray(u.p); gl.vertexAttribPointer(u.p, 3, gl.FLOAT, false, 0, 0);
      if (u.n >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, p.nb); gl.enableVertexAttribArray(u.n); gl.vertexAttribPointer(u.n, 3, gl.FLOAT, false, 0, 0); }
      if (u.s >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, p.sb); gl.enableVertexAttribArray(u.s); gl.vertexAttribPointer(u.s, 1, gl.FLOAT, false, 0, 0); }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.ib);
    }
    // Hareket durumu gölgelendiriciye (hareketsiz modelde hepsi 0)
    var DURUM = { th: 0, ihc: 0, kis: 0, sp: 0, spOn: 0, parla: {} };
    function hareketYaz(u, dongulu) {
      gl.uniform1f(u.th, dongulu ? DURUM.th : 0); gl.uniform1f(u.ihc, dongulu ? DURUM.ihc : 0); gl.uniform1f(u.kis, dongulu ? DURUM.kis : 0);
      gl.uniform3f(u.kay, 0, 0, 0); gl.uniform1f(u.olc, 1);
    }
    function parcaCiz(id, alfa) {
      var c = RENK[id]; gl.uniform4f(U.col, c[0], c[1], c[2], alfa); gl.uniform1f(U.duz, SIVI.indexOf(id) >= 0 ? 1 : 0);
      gl.uniform1f(U.tur, PARCA[id].tur); gl.uniform1f(U.parla, DURUM.parla[id] || 0); gl.uniform1f(U.sinirF, PARCA[id].tur === 6 ? 1 : 0);
      bagla(U, PARCA[id]); gl.drawElements(gl.TRIANGLES, PARCA[id].n, gl.UNSIGNED_SHORT, 0);
    }
    function ciz() {
      var mvp = matris(); mvpSon = mvp;
      gl.useProgram(PR); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.depthFunc(gl.LESS);
      // Tuval opak: arka plan burada boyanır, saydam yapılar onun üstüne karışır. Böylece tarayıcının tuvali sayfayla
      // ikinci kez karıştırması (cihaza göre farklı) sonucu değiştirmez; saydamlık telefonda da bilgisayardaki gibi görünür.
      gl.clearColor(ARKA[0], ARKA[1], ARKA[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.mvp, false, mvp);
      gl.uniformMatrix3fv(U.rot, false, new Float32Array([R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]));
      hareketYaz(U, true); gl.uniform1f(U.sp, DURUM.sp); gl.uniform1f(U.spOn, DURUM.spOn);
      gl.uniform3f(U.vurgu, VURGU[0], VURGU[1], VURGU[2]); gl.uniform3f(U.elek, ELEK[0], ELEK[1], ELEK[2]);
      if (!sel) {
        // Seçim yok: önce opak parçalar; sonra saydam parçalar önce yalnızca derinliğe yazılır, sonra yalnızca en öndeki yüzeyleri boyanır.
        SIRA.forEach(function (id) { if (!PARCA[id].saydam) parcaCiz(id, 1); });
        var sd = SIRA.filter(function (id) { return PARCA[id].saydam; });
        if (sd.length) {
          gl.colorMask(false, false, false, false); sd.forEach(function (id) { parcaCiz(id, 1); });
          gl.colorMask(true, true, true, true); gl.depthFunc(gl.LEQUAL); gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
          sd.forEach(function (id) { parcaCiz(id, PARCA[id].saydam); });
        }
      } else {
        // Seçim var: seçilen yapı opak, diğerleri silik ve yarı saydam
        SIRA.forEach(function (id) { if (PARCA[id].grup === sel) parcaCiz(id, 1); });
        gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
        SIRA.forEach(function (id) { if (PARCA[id].grup !== sel) parcaCiz(id, SIVI.indexOf(id) >= 0 ? 0.35 : 0.16); });
      }
      gl.disable(gl.BLEND); gl.depthMask(true); gl.depthFunc(gl.LESS);
      parcacikCiz(); etiketYaz(mvp);
    }
    // Parçacıklar (K⁺ iyonları, nörotransmitter): küçük küreler, her biri ayrı çizilir
    var KURE = null;
    function parcacikCiz() {
      if (!ANIM || !DURUM.parcacik || !DURUM.parcacik.length) return;
      if (!KURE) { var A = Ag(), seg = 8, hal = 6, i, j; for (i = 0; i <= hal; i++) { var t = i / hal * Math.PI; for (j = 0; j < seg; j++) { var f = j / seg * 2 * Math.PI, n = [Math.sin(t) * Math.cos(f), Math.cos(t), Math.sin(t) * Math.sin(f)]; nokta(A, n, n, 0); } }
        for (i = 0; i < hal; i++) for (j = 0; j < seg; j++) { var a0 = i * seg + j, a1 = i * seg + (j + 1) % seg; A.I.push(a0, a1, a1 + seg, a0, a1 + seg, a0 + seg); }
        function tp(t, v) { var b = gl.createBuffer(); gl.bindBuffer(t, b); gl.bufferData(t, v, gl.STATIC_DRAW); return b; }
        KURE = { pb: tp(gl.ARRAY_BUFFER, new Float32Array(A.P)), nb: tp(gl.ARRAY_BUFFER, new Float32Array(A.N)), sb: tp(gl.ARRAY_BUFFER, new Float32Array(A.S)), ib: tp(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(A.I)), n: A.I.length }; }
      var cs = window.getComputedStyle(kok);
      gl.uniform1f(U.tur, 0); gl.uniform1f(U.parla, 0); gl.uniform1f(U.sinirF, 0); gl.uniform1f(U.duz, 0.3); bagla(U, KURE);
      DURUM.parcacik.forEach(function (q) {
        var c = PRENK[q.renk] || (PRENK[q.renk] = renkCoz(cs.getPropertyValue(q.renk)) || [1, 1, 1]);
        gl.uniform4f(U.col, c[0], c[1], c[2], 1); gl.uniform3f(U.kay, q.p[0], q.p[1], q.p[2]); gl.uniform1f(U.olc, q.r);
        gl.drawElements(gl.TRIANGLES, KURE.n, gl.UNSIGNED_SHORT, 0);
      });
      gl.uniform3f(U.kay, 0, 0, 0); gl.uniform1f(U.olc, 1);
    }
    var PRENK = {};
    // Geniş yapıların içindeki küçük ad yazıları: 3B noktası ekrana izdüşürülür; yüzü kameraya dönük değilse ya da başka yapı seçiliyse gizlenir
    // yon: ikinci bir 3B nokta verilirse yazı o yöne döndürülür (ince ve eğik yapılar, ör. Reissner membranı, boyunca yazılır)
    // Yazıları gizle/göster düğmesi (yalnızca yazısı olan modellerde; durum cihazda saklanmaz)
    var yaziAcik = true, yaziBtn = null, yaziIp = null;
    if ((ayar.etiketler || []).length) {
      yaziBtn = h('button', 'sl-yuv'); yaziBtn.type = 'button'; sagAlt.insertBefore(yaziBtn, buyBtn.nextSibling);
      if (IP) yaziIp = IP.bagla(yaziBtn, function () { return yaziAcik ? M.yazilariGizle : M.yazilariGoster; });
      yaziBtn.addEventListener('click', function () { yaziAcik = !yaziAcik; yaziYaz(); dirty = true; });
    }
    function yaziYaz() {
      if (!yaziBtn) return;
      if (IP) IP.simge(yaziBtn, yaziAcik ? 'yazi' : 'yaziYok'); else yaziBtn.textContent = 'T';
      yaziBtn.setAttribute('aria-pressed', yaziAcik ? 'false' : 'true'); if (yaziIp) yaziIp.yenile();
    }
    yaziYaz();
    var ETIKETLER = (ayar.etiketler || []).map(function (e) { var el = h('span', 'kt-yazi'); el.setAttribute('aria-hidden', 'true'); sahne.appendChild(el); return { id: e.id, k: e, yuz: e.yuz, yon: e.yon, hareket: e.hareket, metin: e.metin, el: el }; });   // k.p model yüklenince de verilebilir (Denge sistemi)
    // Animasyonda yazı bağlı olduğu yapıyla birlikte kayar (gölgelendiricideki hareketin aynısı)
    function kaydir(tur, p) {
      var th = DURUM.th || 0; if (!tur || !th) return p;
      if (tur === 'tm') return [p[0] - th * 0.76 * (p[1] - 0.185), p[1] + th * 0.76 * (p[0] + 0.44), p[2]];
      if (tur === 'bm') return [p[0], p[1] + dBjs(th, p[0]), p[2]];
      return orgJs(th, p);
    }
    function etiketYaz(mvp) {
      if (!ETIKETLER.length) return;
      var w = cv.clientWidth, hh = cv.clientHeight;
      ETIKETLER.forEach(function (e) {
        if (!e.k.p) { e.el.hidden = true; return; }
        var y = V.yapilar[e.id], p = kaydir(e.hareket, e.k.p), X = mvp[0] * p[0] + mvp[4] * p[1] + mvp[8] * p[2] + mvp[12], Y = mvp[1] * p[0] + mvp[5] * p[1] + mvp[9] * p[2] + mvp[13], W = mvp[3] * p[0] + mvp[7] * p[1] + mvp[11] * p[2] + mvp[15];
        var yz = e.yuz ? R[6] * e.yuz[0] + R[7] * e.yuz[1] + R[8] * e.yuz[2] : 1;
        var gizle = !yaziAcik || !y || W <= 0 || yz < 0.3 || (sel && sel !== e.id);
        var sx = (X / W * 0.5 + 0.5) * w, sy = (0.5 - Y / W * 0.5) * hh;
        if (sx < 8 || sx > w - 8 || sy < 8 || sy > hh - 8) gizle = true;
        e.el.hidden = gizle; if (gizle) return;
        e.el.textContent = (e.metin && M[e.metin]) || y.etiket || y.ad;
        var yw = e.el.offsetWidth / 2 + 6;   // yazı çerçeveden taşmasın
        sx = Math.max(yw, Math.min(w - yw, sx));
        e.el.style.left = Math.round(sx) + 'px'; e.el.style.top = Math.round(sy) + 'px';
        var aci = 0;
        if (e.yon) {
          var q = kaydir(e.hareket, e.yon), X2 = mvp[0] * q[0] + mvp[4] * q[1] + mvp[8] * q[2] + mvp[12], Y2 = mvp[1] * q[0] + mvp[5] * q[1] + mvp[9] * q[2] + mvp[13], W2 = mvp[3] * q[0] + mvp[7] * q[1] + mvp[11] * q[2] + mvp[15];
          if (W2 > 0) { aci = Math.atan2(-(Y2 / W2 - Y / W) * hh, (X2 / W2 - X / W) * w) * 180 / Math.PI; if (aci > 90) aci -= 180; if (aci < -90) aci += 180; }
        }
        e.el.style.transform = 'translate(-50%, -50%)' + (aci ? ' rotate(' + aci.toFixed(1) + 'deg)' : '');
      });
    }
    // Dokunulan yapıyı bulmak: her parça kendi kod rengiyle ayrı bir tampona çizilir, dokunulan pikselin rengi okunur.
    var fbo = null, fboTex = null, fboDer = null, fboW = 0, fboH = 0;
    function secBul(cx, cy) {
      var w = cv.width, hh = cv.height;
      if (!fbo || fboW !== w || fboH !== hh) {
        fbo = fbo || gl.createFramebuffer(); fboTex = fboTex || gl.createTexture(); fboDer = fboDer || gl.createRenderbuffer();
        gl.bindTexture(gl.TEXTURE_2D, fboTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, hh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindRenderbuffer(gl.RENDERBUFFER, fboDer); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, hh);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fboDer);
        fboW = w; fboH = hh;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, hh); gl.useProgram(PS); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthFunc(gl.LESS);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(US.mvp, false, mvpSon || matris());
      hareketYaz(US, true);
      SIRA.forEach(function (id) {
        gl.uniform1f(US.tur, PARCA[id].tur);
        var k = PARCA[id].kod; gl.uniform4f(US.col, k / 255, 0, 0, 1);
        bagla(US, PARCA[id]); gl.drawElements(gl.TRIANGLES, PARCA[id].n, gl.UNSIGNED_SHORT, 0);
      });
      var px = new Uint8Array(4), r = cv.getBoundingClientRect(), dpr = cv.width / (r.width || 1);
      gl.readPixels(Math.round((cx - r.left) * dpr), Math.round(hh - (cy - r.top) * dpr), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      var bulunan = null; if (px[3]) SIRA.forEach(function (id) { if (PARCA[id].kod === px[0]) bulunan = PARCA[id].grup; });
      dirty = true; return bulunan;
    }
    // Seçim: kart, liste ve (listeden seçildiyse) kamera o yapıya yaklaşır
    function sec(id, yaklas) {
      sel = id; kartYaz();
      if (id && yaklas) {
        var k = kutu(SIRA.filter(function (x) { return PARCA[x].grup === id; }));
        hedef = { cen: k.cen, rad: Math.min(GENEL.rad, Math.max(ayar.yaklasEnAz || 0.35, k.rad * 1.1)) };
      } else if (!id) hedef = { cen: GENEL.cen.slice(), rad: GENEL.rad };
      if (reduce) { cen = hedef.cen.slice(); rad = hedef.rad; }
      dirty = true;
    }
    genelBtn.addEventListener('click', function () { if (!hazir) return; R = BAS_R.slice(); zoom = ayar.genelZoom || 1; sec(null); dirty = true; if (buyIp) buyIp.guncelle(); });   // genelZoom: genel görünüm düğmesi ne kadar geriden baksın (Corti animasyonu 1,4)

    function boyut() {
      if (!cv.clientWidth) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(1, Math.round(cv.clientWidth * dpr)), hh = Math.max(1, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
      gl.viewport(0, 0, w, hh); dirty = true;
    }
    // Dokunma: tek parmak döndürür, iki parmak yakınlaştırır, kısa dokunuş seçer
    var ptr = {}, oynadi = 0, pd = 0;
    function anahtarlar() { return Object.keys(ptr); }
    cv.addEventListener('pointerdown', function (e) { try { cv.setPointerCapture(e.pointerId); } catch (x) {} ptr[e.pointerId] = { x: e.clientX, y: e.clientY }; oynadi = 0; var kk = anahtarlar(); if (kk.length === 2) pd = Math.hypot(ptr[kk[0]].x - ptr[kk[1]].x, ptr[kk[0]].y - ptr[kk[1]].y); });
    cv.addEventListener('pointermove', function (e) {
      var p = ptr[e.pointerId]; if (!p) return; var kk = anahtarlar(), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; oynadi += Math.abs(dx) + Math.abs(dy);
      if (kk.length === 1) { R = mul(mul(ry(dx * 0.01), rx(dy * 0.01)), R); dirty = true; }
      else if (kk.length === 2) { var nd = Math.hypot(ptr[kk[0]].x - ptr[kk[1]].x, ptr[kk[0]].y - ptr[kk[1]].y); if (pd > 0 && nd > 0) { zoom = Math.max(0.2, Math.min(2.5, zoom * pd / nd)); dirty = true; } pd = nd; }
    });
    function birak(e) {
      var vardi = ptr[e.pointerId]; delete ptr[e.pointerId];
      if (hazir && vardi && oynadi < 8 && e.type === 'pointerup' && !anahtarlar().length) { var id = secBul(e.clientX, e.clientY); sec(id === sel ? null : id, false); }
    }
    cv.addEventListener('pointerup', birak); cv.addEventListener('pointercancel', birak);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); zoom = Math.max(0.2, Math.min(2.5, zoom * (1 + e.deltaY * 0.001))); dirty = true; }, { passive: false });
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); durdu = true; durum.hidden = false; durum.textContent = M.baslatilamadi; });
    window.addEventListener('resize', boyut);
    if (window.ResizeObserver) new window.ResizeObserver(boyut).observe(cv);

    var sonT = 0, asamaSon = '';
    function dongu(ts) {
      if (durdu) return;
      var dt = sonT && ts ? Math.min(0.1, (ts - sonT) / 1000) : 0; sonT = ts || 0;
      if (ANIM && hazir && oynuyor && cv.clientWidth) {
        DURUM = ANIM.adim(dt); dirty = true;
        if (asamaEl && DURUM.yazi !== asamaSon) { asamaSon = DURUM.yazi; asamaEl.textContent = DURUM.yazi; }
      }
      if (hazir && cv.clientWidth) {
        var fark = Math.abs(hedef.cen[0] - cen[0]) + Math.abs(hedef.cen[1] - cen[1]) + Math.abs(hedef.cen[2] - cen[2]) + Math.abs(hedef.rad - rad);
        if (fark > GENEL.rad * 0.002) { for (var a = 0; a < 3; a++) cen[a] += (hedef.cen[a] - cen[a]) * 0.15; rad += (hedef.rad - rad) * 0.15; dirty = true; }
        if (dirty) { dirty = false; ciz(); if (buyIp) buyIp.guncelle(); }
      }
      window.requestAnimationFrame(dongu);
    }
    // Model: hemen (koklea) ya da indirildikten sonra (denge); hata olursa durum yazısı
    try {
      var m = (ayar.model || modelKur)();
      if (m && typeof m.then === 'function') m.then(function (x) { if (!durdu) parcalariKur(x); }, function () { durum.textContent = M.indirilemedi || M.baslatilamadi; });
      else parcalariKur(m);
    } catch (e) { durum.textContent = M.baslatilamadi; }
    window.requestAnimationFrame(dongu);

    if (ANIM) { DURUM = ANIM.adim(0); if (asamaEl) { asamaSon = DURUM.yazi; asamaEl.textContent = DURUM.yazi; } }
    api.yenile = function () { metinler(); listeCiz(); kartYaz(); oynatYaz(); yaziYaz(); if (buyIp) buyIp.yenile(); if (ANIM) { asamaSon = ''; DURUM = ANIM.adim(0); } if (hazir) { renkleriOku(); dirty = true; } };
    api.durdur = function () { if (ANIM && oynuyor) { oynuyor = false; oynatYaz(); } };
    return api;
  }

  /* Koklea kesiti (3D sayfası, hareketsiz): kamera başlangıcı, sıvı yüzeyleri ve geniş yapıların içindeki ad yazıları */
  var ON = [0, 0, 1];
  var ETIKET_3D = [
    { id: 'sv', p: [0.05, 0.7, Z0], yuz: ON }, { id: 'sm', p: [0.3, 0.36, Z0], yuz: ON }, { id: 'st', p: [0.05, -0.56, Z0], yuz: ON },
    { id: 'ligament', p: [0.86, -0.32, Z1], yuz: ON }, { id: 'kemik', p: [0.05, 1.11, Z1], yuz: ON }, { id: 'osl', p: [-0.62, 0.115, Z1], yuz: ON },
    { id: 'tektoryal', p: [0.02, 0.231, Z1], yuz: ON, yon: [0.25, 0.243, Z1] }, { id: 'baziler', p: [0.55, -0.022, Z1], yuz: ON },
    { id: 'reissner', p: [0.08, 0.376, Z1], yuz: ON, yon: [0.35, 0.447, Z1] },
    { id: 'ith', p: [ITH_X, 0.078, Z1 + 0.012], yuz: ON, metin: 'etiketIth' }, { id: 'dth', p: [0.155, 0.125, Z1 + 0.012], yuz: ON, metin: 'etiketDth' }
  ];
  function kurKorti(kok, ayar) {
    return kur(kok, { veri: ayar.veri, kartEki: ayar.kartEki, model: modelKur, sivi: ['sv', 'sm', 'st'], etiketler: ETIKET_3D,
      basR: mul(rx(D(16)), ry(D(-32))), genel: { cen: [-0.08, 0.06, 0], rad: 0.95 } });
  }

  /* ---------- Corti organı animasyonu (Ses laboratuvarı, #seslab/corti) ----------
     Ses → mekanik → elektriksel enerji dönüşümü. Bilgi kaynağı: proje sahibinin ders notları (İşitme ve Denge Sistemleri-1 iç kulak;
     Elektrofizyolojik Testler, ECochG: "sterosilyaların modiolustan uzaklaşmaları ile rezistans düşer", "DTH ... uzama kısalma hareketi
     ile zar hareketini arttırır", "EP transdüksiyon için gereklidir") ve NCBI kaynakları (uç bağları, K⁺ girişi, Ca²⁺, şeritli sinaps).
     Döngü (yavaşlatılmış, bir periyot PERIYOT sn; gerçekte saniyede yüzlerce–binlerce kez ve nanometre düzeyinde):
     - Baziler membran yukarı (skala vestibuliye doğru) → retiküler lamina ile tektoryal membran arasında kayma → dış tüylü hücre tüyleri
       en uzun tüye doğru (modiolustan uzağa) bükülür → uç bağları gerilir, kanallar açılır, endolenften K⁺ girer → depolarizasyon →
       dış tüylü hücre kısalır (elektromotilite, hareketi güçlendirir).
     - İç tüylü hücre tüyleri tektoryal membrana gömülü değil; sıvı akımıyla bükülür (hıza bağlı, fazı önde) → depolarizasyon →
       tabanda Ca²⁺ kanalları açılır, nörotransmitter (glutamat) salınır → işitme sinirinde aksiyon potansiyeli.
     - Baziler membran aşağı → tüyler kısa tüye doğru bükülür → kanallar kapanır → hiperpolarizasyon; sinyal durur. */
  var PERIYOT = 2.6, GENLIK = 0.095;
  function dBjs(th, x) { return th * Math.max(0, Math.min(1, Math.min(x + 0.3, 0.8 - x))); }
  function orgJs(th, p) { return [p[0] - th * p[1], p[1] + dBjs(th, p[0]), p[2]]; }
  function kortiAnim(veri) {
    var M = veri.metinler, t = 0, sp = -1, iyon = [], glu = [], tohum = 1;
    function rnd() { tohum = (tohum * 16807) % 2147483647; return (tohum - 1) / 2147483646; }
    var onZ = [hucreZ(SAYI - 1), hucreZ(SAYI - 2), hucreZ(SAYI - 3)];
    // Sinyal noktası (2026-11-21): en öndeki iç tüylü hücre lifi boyunca (modelKur'daki yolun aynısı) ilerleyen parlak küre
    var lz = hucreZ((SAYI - 1) - ((SAYI - 1) % 2));
    var LIF = [[ITH_X, 0.04, lz], [-0.25, 0.012, lz], [-0.3, -0.002, lz], [-0.62, -0.012, lz], [-1.0, -0.025, lz], [-1.08, -0.03, lz]];
    var AKSON = [[-1.32, -0.03, lz], [-1.42, -0.06, lz], [-1.62, -0.12, lz]];
    function yolda(Y, u) { var f = Math.max(0, Math.min(1, u)) * (Y.length - 1), i = Math.min(Y.length - 2, Math.floor(f)), r = f - i; return [Y[i][0] + (Y[i + 1][0] - Y[i][0]) * r, Y[i][1] + (Y[i + 1][1] - Y[i][1]) * r, Y[i][2] + (Y[i + 1][2] - Y[i][2]) * r]; }
    function tur(id) { return { baziler: 1, ith: 2, pilar: 2, destek: 2, dth: 3, tektoryal: 4, silya: 5, sinir: 6 }[id] || 0; }
    function adim(dt) {
      t += dt;
      var ph = 2 * Math.PI * t / PERIYOT, yer = Math.sin(ph), hiz = Math.cos(ph);
      var th = GENLIK * yer;
      var vD = yer, vI = hiz;   // reseptör potansiyeli: dış tüylü hücre yer değiştirmeyle, iç tüylü hücre hızla (fazı önde) uyumlu
      var kis = vD > 0 ? 0.08 * vD : 0.025 * vD;   // depolarizasyonda kısalır, hiperpolarizasyonda biraz uzar
      // İç tüylü hücre depolarizeyken sinirde aksiyon potansiyeli (fazla kilitli)
      if (sp < 0 && vI > 0.6) sp = 0;
      if (sp >= 0) { sp += dt * 0.9; if (sp > 1.55) sp = -1; }   // 2026-11-21: daha yavaş (lif boyunca ≈1,7 sn; eskiden ≈0,85 sn)
      // K⁺ iyonları: kanallar açıkken tüylerin ucundan hücreye girer
      if (dt > 0) {
        if (vD > 0.25 && rnd() < dt * 18 * vD) iyon.push({ x: DTH_X[Math.floor(rnd() * 3)] - 0.004, z: onZ[Math.floor(rnd() * 3)] + (rnd() - 0.5) * 0.02, ust: DTH_UST, t: 0 });
        if (vI > 0.25 && rnd() < dt * 14 * vI) iyon.push({ x: ITH_X, z: onZ[Math.floor(rnd() * 3)] + (rnd() - 0.5) * 0.02, ust: ITH_UST, t: 0 });
        if (vI > 0.4 && rnd() < dt * 10 * vI) glu.push({ z: onZ[Math.floor(rnd() * 3)] + (rnd() - 0.5) * 0.01, t: 0 });
      }
      iyon = iyon.filter(function (q) { q.t += dt / 0.7; return q.t < 1; });
      glu = glu.filter(function (q) { q.t += dt / 0.55; return q.t < 1; });
      var parcacik = [];
      if (sp >= 0) {
        var sn = sp <= 1 ? yolda(LIF, sp) : sp <= 1.4 ? yolda(AKSON, (sp - 1) / 0.4) : null;
        if (sn) parcacik.push({ p: sn[0] > -0.3 ? orgJs(th, sn) : sn, r: 0.02, renk: '--kt-elek' });
      }
      iyon.forEach(function (q) {
        // Kanallar kısa tüylerin ucunda (uç bağının alt ucu): iyon oradan girip hücre gövdesine iner
        var y = q.ust + 0.032 - q.t * 0.05;
        parcacik.push({ p: orgJs(th, [q.x, y, q.z]), r: 0.011, renk: '--kt-iyon' });
      });
      glu.forEach(function (q) {
        var x = ITH_X - 0.01 - q.t * 0.03, y = 0.04 - q.t * 0.026;
        parcacik.push({ p: orgJs(th, [x, y, q.z]), r: 0.009, renk: '--kt-glu' });
      });
      return { th: th, ihc: vI, kis: kis, sp: Math.max(0, sp), spOn: sp >= 0 ? 1 : 0,
        parla: { dth: Math.max(0, vD), ith: Math.max(0, vI) }, parcacik: parcacik,
        yazi: yer >= 0 ? M.asamaYukari : M.asamaAsagi };
    }
    return { tur: tur, adim: adim };
  }
  var ETIKET_ANIM = [
    { id: 'tektoryal', p: [-0.05, 0.226, Z1], yuz: ON, yon: [0.25, 0.243, Z1], hareket: 'tm' }, { id: 'baziler', p: [0.5, -0.024, Z1], yuz: ON, hareket: 'bm' },
    { id: 'ith', p: [ITH_X, 0.078, Z1 + 0.012], yuz: ON, hareket: 'org', metin: 'etiketIth' }, { id: 'dth', p: [0.155, 0.125, Z1 + 0.012], yuz: ON, hareket: 'org', metin: 'etiketDth' },
    { id: 'sinir', p: [-0.55, -0.045, Z1], yuz: ON }, { id: 'reissner', p: [0.24, 0.418, Z1], yuz: ON, yon: [0.5, 0.486, Z1] }
  ];
  function kurKortiAnim(kok, ayar) {
    var V = ayar.veri;   // { genel, gruplar, yapilar, metinler } — yapılar 3D modelle ortak
    return kur(kok, { veri: V, kartEki: ayar.kartEki, model: modelKur, sivi: ['sv', 'sm', 'st'], etiketler: ETIKET_ANIM, anim: kortiAnim(V), sinif: 'kt-anim',
      basR: mul(rx(D(10)), ry(D(-24))), genel: { cen: [-0.02, 0.1, 0.1], rad: 0.6 }, genelZoom: 1.8 });   // 2026-11-21: biraz daha geniş açıyla başlar
  }

  window.Korti = { kur: kurKorti, kurAnim: kurKortiAnim, goruntuleyici: kur, _model: modelKur, rx: rx, ry: ry, mul: mul, D: D,
    // Ağ üretim yardımcıları (ampulla kesiti, korti/ampulla3d.js, 2026-11-22)
    ag: { Ag: Ag, nokta: nokta, uzat: uzat, yuzey: yuzey, dondur: dondur, tup: tup, yay: yay, serit: serit, elips: elips } };
})();
