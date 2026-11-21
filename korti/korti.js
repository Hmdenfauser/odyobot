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
  function Ag() { return { P: [], N: [], I: [] }; }
  function nokta(A, p, n) { A.P.push(p[0], p[1], p[2]); A.N.push(n[0], n[1], n[2]); return A.P.length / 3 - 1; }
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
  function dondur(A, x, z, profil, seg) {
    var bas = A.P.length / 3, k, s;
    for (k = 0; k < profil.length; k++) {
      var o = profil[Math.max(0, k - 1)], sn = profil[Math.min(profil.length - 1, k + 1)];
      var tr = sn[0] - o[0], ty = sn[1] - o[1], tl = Math.hypot(tr, ty) || 1, nr = ty / tl, ny = -tr / tl;
      for (s = 0; s < seg; s++) {
        var a = s / seg * 2 * Math.PI, c = Math.cos(a), si = Math.sin(a);
        nokta(A, [x + profil[k][0] * c, profil[k][1], z + profil[k][0] * si], [nr * c, ny, nr * si]);
      }
    }
    for (k = 0; k < profil.length - 1; k++) for (s = 0; s < seg; s++) {
      var a0 = bas + k * seg + s, a1 = bas + k * seg + (s + 1) % seg, b0 = a0 + seg, b1 = a1 + seg;
      A.I.push(a0, a1, b1, a0, b1, b0);
    }
  }
  // Tüp (sinir lifi): 3B nokta dizisi boyunca
  function tup(A, yol, r, seg) {
    var bas = A.P.length / 3, k, s;
    for (k = 0; k < yol.length; k++) {
      var t = nrm(sub(yol[Math.min(yol.length - 1, k + 1)], yol[Math.max(0, k - 1)]));
      var ref = Math.abs(t[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], b1 = nrm(cross(t, ref)), b2 = cross(t, b1);
      for (s = 0; s < seg; s++) {
        var a = s / seg * 2 * Math.PI, n = [b1[0] * Math.cos(a) + b2[0] * Math.sin(a), b1[1] * Math.cos(a) + b2[1] * Math.sin(a), b1[2] * Math.cos(a) + b2[2] * Math.sin(a)];
        nokta(A, [yol[k][0] + n[0] * r, yol[k][1] + n[1] * r, yol[k][2] + n[2] * r], n);
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
    uzat(ag('ligament'), yay(0.995, -45, 50, 30).concat(yay(0.8, 50, 43, 3), yay(0.735, 43, 7, 12), yay(0.8, 7, -45, 18)), Z0, Z1);
    uzat(ag('stria'), yay(0.8, 7, 43, 12).concat(yay(0.735, 43, 7, 12)), Z0, Z1);

    // Zarlar
    uzat(ag('baziler'), [[-0.3, -0.006], [0.8, -0.006], [0.8, -0.038], [-0.3, -0.038]], Z0, Z1);
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
          dondur(ag('silya'), x0, zz, [[0.0042, ITH_UST - 0.004], [0.0042, ITH_UST + sr[1]], [0, ITH_UST + sr[1] + 0.004]], 6);
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
            dondur(ag('silya'), xs, zc + i * 0.0062, [[0.0038, DTH_UST - 0.004], [0.0038, DTH_UST + uzun * oran], [0, DTH_UST + uzun * oran + 0.004]], 6);
          }
        });
      });
    }

    // Spiral gangliyon (modiolusta, spiral boyunca) ve sinir lifleri
    var gx = -1.2, gy = -0.03;
    uzat(ag('ganglion'), elips(gx, gy, 0.13, 0.11, 24), Z0, Z1);
    for (k = 0; k < SAYI; k += 2) {
      var z2 = hucreZ(k), ortak = [[-0.3, -0.002, z2], [-0.62, -0.012, z2], [-1.0, -0.025, z2], [gx + 0.12, gy, z2]];
      tup(ag('sinir'), [[ITH_X, 0.04, z2], [-0.25, 0.012, z2]].concat(ortak), 0.0075, 6);
      var zo = hucreZ(k, 0);
      tup(ag('sinir'), [[DTH_X[1], 0.07, zo], [0.14, 0.03, zo], [0.06, 0.016, zo], [-0.03, 0.016, zo], [-0.13, 0.008, zo], [-0.24, 0.004, zo]].concat(ortak.map(function (q) { return [q[0], q[1] - 0.012, q[2]]; })), 0.006, 6);
      if (k % 4 === 0) tup(ag('sinir'), [[gx - 0.12, gy, z2], [-1.42, -0.06, z2], [-1.62, -0.12, z2]], 0.016, 8);
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
  function renkCoz(s) {
    s = (s || '').trim(); var m = /^#([0-9a-f]{6})$/i.exec(s);
    if (m) { var n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    return null;
  }
  var VS = 'attribute vec3 p;attribute vec3 n;uniform mat4 mvp;uniform mat3 rot;varying vec3 vn;void main(){vn=rot*n;gl_Position=mvp*vec4(p,1.0);}';
  var FS = 'precision mediump float;varying vec3 vn;uniform vec4 col;uniform float duz;' +
    'void main(){vec3 nn=normalize(vn);float d=abs(nn.z);float s=pow(d,24.0)*0.16;vec3 c=col.rgb*(0.62+0.38*d)+vec3(s);c=mix(c,col.rgb*(0.86+0.14*d),duz);gl_FragColor=vec4(c,col.a);}';
  var FS_SEC = 'precision mediump float;uniform vec4 col;void main(){gl_FragColor=col;}';

  function kur(kok, ayar) {
    var V = ayar.veri, M = V.metinler, IP = window.SesLabIpucu;
    kok.textContent = ''; kok.classList.add('g3d', 'kt');
    var sahne = h('div', 'g3d-sahne'), cv = h('canvas'), etiket = h('div', 'g3d-etiket g3d-sagust'), durum = h('p', 'g3d-durum', M.yukleniyor);
    var genelBtn = h('button', 'sl-yuv'); genelBtn.type = 'button';
    var sagAlt = h('div', 'sl-sag-alt'); sagAlt.appendChild(genelBtn);
    cv.setAttribute('role', 'img');
    sahne.appendChild(cv); sahne.appendChild(etiket); sahne.appendChild(durum); sahne.appendChild(sagAlt);
    var ipucu = h('p', 'g3d-not g3d-ipucu'), kart = h('div', 'g3d-kart'), nmEl = h('h4'), dsEl = h('p'), yuva = h('div', 'g3d-kart-ek');
    kart.appendChild(nmEl); kart.appendChild(dsEl); kart.appendChild(yuva);
    var listeKutu = h('div', 'kt-liste'), notEl = h('p', 'g3d-not'), metinYuva = h('div', 'g3d-kart-ek');
    [sahne, ipucu, kart, listeKutu, notEl, metinYuva].forEach(function (e) { kok.appendChild(e); });
    if (IP) { IP.simge(genelBtn, 'genel'); var genelIp = IP.bagla(genelBtn, function () { return M.genelGorunum; }); }
    else genelBtn.textContent = '⟲';

    var sel = null, dugmeler = {};
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
        var kutu = h('div', 'g3d-yapilar');
        g.yapilar.forEach(function (id) {
          var y = V.yapilar[id]; if (!y) return;
          var b = h('button'); b.type = 'button'; b.setAttribute('aria-pressed', sel === id ? 'true' : 'false');
          var nk = h('span', 'g3d-nokta'); nk.style.background = 'var(--kt-' + id + ')';
          b.appendChild(nk); b.appendChild(h('span', null, y.ad));
          b.addEventListener('click', function () { sec(sel === id ? null : id, true); });
          kutu.appendChild(b); dugmeler[id] = b;
        });
        listeKutu.appendChild(kutu);
      });
    }
    function kartYaz() {
      var y = sel && V.yapilar[sel], o = y || V.genel;
      nmEl.textContent = o.ad; dsEl.textContent = o.aciklama; yuva.textContent = '';
      if (typeof ayar.kartEki === 'function') ayar.kartEki(y ? 'yapi' : 'genel', y ? sel : null, yuva);
      Object.keys(dugmeler).forEach(function (id) { dugmeler[id].setAttribute('aria-pressed', sel === id ? 'true' : 'false'); });
    }
    metinler(); listeCiz(); kartYaz();

    var gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
    if (!gl) { durum.textContent = M.baslatilamadi; return { yenile: function () { metinler(); listeCiz(); kartYaz(); } }; }
    function derle(vs, fs) {
      function sh(t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; }
      var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
      return pr;
    }
    var PR = derle(VS, FS), PS = derle(VS, FS_SEC);
    function konum(pr) { return { p: gl.getAttribLocation(pr, 'p'), n: gl.getAttribLocation(pr, 'n'), mvp: gl.getUniformLocation(pr, 'mvp'), rot: gl.getUniformLocation(pr, 'rot'), col: gl.getUniformLocation(pr, 'col'), duz: gl.getUniformLocation(pr, 'duz') }; }
    var U = konum(PR), US = konum(PS);

    // Parçalar: tampon, sınır kutusu, seçim rengi
    var MODEL = modelKur(), PARCA = {}, SIRA = [];
    var SIVI = ['sv', 'sm', 'st'];
    Object.keys(MODEL).forEach(function (id, no) {
      var A = MODEL[id], P = new Float32Array(A.P), N = new Float32Array(A.N), I = new Uint16Array(A.I);
      var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      for (var j = 0; j < P.length; j++) { var a = j % 3; if (P[j] < mn[a]) mn[a] = P[j]; if (P[j] > mx[a]) mx[a] = P[j]; }
      function tampon(t, v) { var b = gl.createBuffer(); gl.bindBuffer(t, b); gl.bufferData(t, v, gl.STATIC_DRAW); return b; }
      PARCA[id] = { pb: tampon(gl.ARRAY_BUFFER, P), nb: tampon(gl.ARRAY_BUFFER, N), ib: tampon(gl.ELEMENT_ARRAY_BUFFER, I), n: I.length, mn: mn, mx: mx, kod: no + 1 };
      SIRA.push(id);
    });
    var RENK = {}, SILIK = [0.62, 0.68, 0.7];
    function renkleriOku() {
      var cs = window.getComputedStyle(kok);
      SIRA.forEach(function (id) { RENK[id] = renkCoz(cs.getPropertyValue('--kt-' + id)) || SILIK; });
      SILIK = renkCoz(cs.getPropertyValue('--g3d-silik')) || SILIK;
    }
    renkleriOku();

    // Kamera: kullanıcı döndürmesi R, merkez cen, yarıçap rad (seçilen yapıya yumuşakça yaklaşır)
    var BAS_R = mul(rx(D(16)), ry(D(-32))), R = BAS_R.slice(), zoom = 1, FOV = D(26), TAN = Math.tan(FOV / 2);
    var GENEL = { cen: [-0.08, 0.06, 0], rad: 0.95 }, cen = GENEL.cen.slice(), rad = GENEL.rad, hedef = { cen: cen.slice(), rad: rad };
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var dirty = true, durdu = false, mvpSon = null;

    function matris() {
      var asp = cv.width / cv.height, f = 1 / TAN, sig = asp < 1 ? 1 / asp : 1;
      var d = rad / Math.sin(FOV / 2) * 0.92 * Math.min(sig, 1.8) * zoom, near = Math.max(0.02, d - rad * 3), far = d + rad * 4;
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
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.ib);
    }
    function ciz() {
      var mvp = matris(); mvpSon = mvp;
      gl.useProgram(PR); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.mvp, false, mvp);
      gl.uniformMatrix3fv(U.rot, false, new Float32Array([R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]));
      // 1. geçiş: opak (seçim yoksa hepsi; seçim varsa yalnızca seçilen). 2. geçiş: seçim varken diğerleri silik ve yarı saydam.
      [0, 1].forEach(function (gecis) {
        if (gecis === 1) { if (!sel) return; gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); }
        SIRA.forEach(function (id) {
          var secili = !sel || sel === id; if ((gecis === 0) !== secili) return;
          var c = RENK[id], siv = SIVI.indexOf(id) >= 0;
          if (gecis === 1) gl.uniform4f(U.col, c[0], c[1], c[2], siv ? 0.35 : 0.16); else gl.uniform4f(U.col, c[0], c[1], c[2], 1);
          gl.uniform1f(U.duz, siv ? 1 : 0);
          bagla(U, PARCA[id]); gl.drawElements(gl.TRIANGLES, PARCA[id].n, gl.UNSIGNED_SHORT, 0);
        });
      });
      gl.disable(gl.BLEND); gl.depthMask(true);
    }
    // Dokunulan yapıyı bulmak: her parça kendi kod rengiyle ayrı bir tampona çizilir, dokunulan pikselin rengi okunur.
    var fbo = null, fboTex = null, fboDer = null, fboW = 0, fboH = 0;
    function sec_bul(cx, cy) {
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
      gl.viewport(0, 0, w, hh); gl.useProgram(PS); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(US.mvp, false, mvpSon || matris());
      if (US.n >= 0) gl.disableVertexAttribArray(US.n);
      SIRA.forEach(function (id) {
        var k = PARCA[id].kod; gl.uniform4f(US.col, k / 255, 0, 0, 1);
        bagla(US, PARCA[id]); gl.drawElements(gl.TRIANGLES, PARCA[id].n, gl.UNSIGNED_SHORT, 0);
      });
      var px = new Uint8Array(4), r = cv.getBoundingClientRect(), dpr = cv.width / (r.width || 1);
      gl.readPixels(Math.round((cx - r.left) * dpr), Math.round(hh - (cy - r.top) * dpr), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      var bulunan = null; if (px[3]) SIRA.forEach(function (id) { if (PARCA[id].kod === px[0]) bulunan = id; });
      dirty = true; return bulunan;
    }
    // Seçim: kart, liste ve (listeden seçildiyse) kamera o yapıya yaklaşır
    function sec(id, yaklas) {
      sel = id; kartYaz();
      if (id && yaklas) {
        var p = PARCA[id], c = [(p.mn[0] + p.mx[0]) / 2, (p.mn[1] + p.mx[1]) / 2, 0];
        var r = Math.max(0.35, Math.hypot(p.mx[0] - p.mn[0], p.mx[1] - p.mn[1]) / 2 * 1.1);
        hedef = { cen: c, rad: Math.min(GENEL.rad, r) };
      } else if (!id) hedef = { cen: GENEL.cen.slice(), rad: GENEL.rad };
      if (reduce) { cen = hedef.cen.slice(); rad = hedef.rad; }
      dirty = true;
    }
    genelBtn.addEventListener('click', function () { R = BAS_R.slice(); zoom = 1; sec(null); });

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
      if (vardi && oynadi < 8 && e.type === 'pointerup' && !anahtarlar().length) { var id = sec_bul(e.clientX, e.clientY); sec(id === sel ? null : id, false); }
    }
    cv.addEventListener('pointerup', birak); cv.addEventListener('pointercancel', birak);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); zoom = Math.max(0.2, Math.min(2.5, zoom * (1 + e.deltaY * 0.001))); dirty = true; }, { passive: false });
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); durdu = true; durum.hidden = false; durum.textContent = M.baslatilamadi; });
    window.addEventListener('resize', boyut);
    if (window.ResizeObserver) new window.ResizeObserver(boyut).observe(cv);

    function dongu() {
      if (durdu) return;
      if (cv.clientWidth) {
        var fark = Math.abs(hedef.cen[0] - cen[0]) + Math.abs(hedef.cen[1] - cen[1]) + Math.abs(hedef.cen[2] - cen[2]) + Math.abs(hedef.rad - rad);
        if (fark > 0.002) { for (var a = 0; a < 3; a++) cen[a] += (hedef.cen[a] - cen[a]) * 0.15; rad += (hedef.rad - rad) * 0.15; dirty = true; }
        if (dirty) { dirty = false; ciz(); }
      }
      window.requestAnimationFrame(dongu);
    }
    durum.hidden = true; boyut(); window.requestAnimationFrame(dongu);

    return {
      yenile: function () { metinler(); listeCiz(); kartYaz(); renkleriOku(); dirty = true; }
    };
  }

  window.Korti = { kur: kur, _model: modelKur };
})();
