/* Ampulla kesiti 3D modeli (#3d/ampulla, 2026-11-22): krista ampullaris ve kupula, hareketsiz.
   - Görüntüleyici korti/korti.js (Korti.goruntuleyici), ağ yardımcıları Korti.ag. Model dosyası yok: biçimler burada kodla üretilir.
   - Ampullanın kanal ekseni boyunca alınmış kalın bir dilimi: x kanal boyunca (sol = semisirküler kanal tarafı, sağ = utrikulus
     tarafı), y yukarı, z dilim kalınlığı. Krista ampullanın tabanında, kupula kristanın üstünden tavana kadar uzanır.
   - Ölçülmüş veri değildir, şematiktir: hücreler ve tüyler çok büyütüldü. Krista gerçekte eyer biçimlidir; burada düz bir sırt
     olarak sadeleştirildi. Tüy demetleri lateral kanal ampullasındaki gibi dizildi (kinosilyum utrikulus tarafında).
   - Hareket yok (proje sahibinin kuralı: 3D sayfasında yalnızca yapılar). Animasyon ileride Ses laboratuvarında, onaydan sonra.
   - Yazılar ampulla3d-veri.js (window.AMPULLA3D_VERI), renkler korti.css → --amp-<kimlik>.
   Kullanım: Ampulla3D.kur(kok, { veri, kartEki }) → { yenile }. */
(function () {
  'use strict';
  var L = 0.8, Z0 = -L / 2, Z1 = L / 2, XA = -2, XB = 2, ADIM = 0.05;
  var TM = 0.035, TB = 0.2, WC = 0.42, HC = 0.42, ON = [0, 0, 1];

  // Zar ampullanın iç yarıçapı: kanal tarafında dar (≈0,32), ampullada geniş (1), utrikulusa açılan tarafta orta genişlikte
  function rM(x) { return x < 0 ? 0.32 + 0.68 * Math.exp(-Math.pow(x / 0.85, 2)) : 0.55 + 0.45 * Math.exp(-Math.pow(x / 0.8, 2)); }
  function rB(x) { return rM(x) + 0.25; }   // kemik ampullanın iç yüzü (aradaki boşluk perilenf)
  function kristaUst(x) { var u = Math.abs(x) < WC ? Math.pow(Math.cos(Math.PI * x / (2 * WC)), 1.5) : 0; return -rM(x) + HC * u; }
  function egim(x) { return (kristaUst(x + 0.002) - kristaUst(x - 0.002)) / 0.004; }
  function araliK(a, b, adim) { var o = []; for (var x = a; x <= b + 1e-9; x += adim) o.push(Math.round(x * 1000) / 1000); return o; }

  // Döndürme yüzeyini yerel eksende üretip (dikey = hücre ekseni) kristanın yüzeyine dik olacak biçimde yerleştirir
  function yerlestir(A, T, a, b) {
    var c = Math.cos(a), s = Math.sin(a), bas = A.P.length / 3, i;
    for (i = 0; i < T.P.length; i += 3) {
      var x = T.P[i], y = T.P[i + 1], nx = T.N[i], ny = T.N[i + 1];
      A.P.push(b[0] + x * c - y * s, b[1] + x * s + y * c, T.P[i + 2]);
      A.N.push(nx * c - ny * s, nx * s + ny * c, T.N[i + 2]); A.S.push(0);
    }
    for (i = 0; i < T.I.length; i++) A.I.push(bas + T.I[i]);
  }

  function modelKur() {
    var G = window.Korti.ag, M = {}, k, i;
    function ag(id) { return M[id] || (M[id] = G.Ag()); }
    var xs = araliK(XA, XB, ADIM);
    function bant(ic, dis, isaret, x0, x1) {   // iki eğri arasındaki şerit (üstte isaret 1, altta -1)
      var sec = xs.filter(function (x) { return x >= x0 - 1e-9 && x <= x1 + 1e-9; });
      return sec.map(function (x) { return [x, isaret * ic(x)]; }).concat(sec.slice().reverse().map(function (x) { return [x, isaret * dis(x)]; }));
    }
    function rMd(x) { return rM(x) + TM; }
    function rBd(x) { return rB(x) + TB; }

    // Kemik ampulla: üstte tek parça, altta ampullar sinirin geçtiği delik (x ≈ 0) iki yanında
    G.uzat(ag('kemik'), bant(rB, rBd, 1, XA, XB), Z0, Z1);
    G.uzat(ag('kemik'), bant(rB, rBd, -1, XA, -0.15), Z0, Z1);
    G.uzat(ag('kemik'), bant(rB, rBd, -1, 0.15, XB), Z0, Z1);
    // Zar ampulla duvarı (zar labirent)
    G.uzat(ag('zar'), bant(rM, rMd, 1, XA, XB), Z0, Z1);
    G.uzat(ag('zar'), bant(rM, rMd, -1, XA, XB), Z0, Z1);
    // Sıvılar: dilimin arka yüzünde düz yüzeyler (Koklea kesitindeki gibi)
    var ZA = Z0 - 0.006;
    G.yuzey(ag('perilenf'), bant(rMd, rB, 1, XA, XB), ZA);
    G.yuzey(ag('perilenf'), bant(rMd, rB, -1, XA, XB), ZA);
    G.yuzey(ag('endolenf'), xs.map(function (x) { return [x, rM(x)]; }).concat(xs.slice().reverse().map(function (x) { return [x, -rM(x)]; })), ZA);

    // Krista ampullaris: tabandaki sırt (bağ dokusu çekirdeği; içinden sinir lifleri geçer)
    var kx = araliK(-WC, WC, 0.03);
    G.uzat(ag('krista'), kx.map(function (x) { return [x, kristaUst(x)]; }).concat(kx.slice().reverse().map(function (x) { return [x, -rM(x) - 0.02]; })), Z0, Z1);
    // Duyu epitelinin destek hücreleri: kristanın üstünü örten ince katman
    G.uzat(ag('destek'), G.serit(araliK(-0.37, 0.37, 0.025).map(function (x) { return [x, kristaUst(x) + 0.022]; }), 0.05), Z0, Z1);
    // Kupula: epitelin üstünden ampullanın tavanına kadar uzanan jelatinimsi kütle
    var kb = araliK(-0.34, 0.34, 0.02), kt = araliK(-0.24, 0.24, 0.02);
    G.uzat(ag('kupula'), kb.map(function (x) { return [x, kristaUst(x) + 0.16]; }).concat(kt.slice().reverse().map(function (x) { return [x, rM(x) - 0.004]; })), Z0 + 0.004, Z1 - 0.004);

    // Tüylü hücreler (Tip I şişe biçimli + kaliks sinir ucu; Tip II silindirik), tüy demetleri ve sinir lifleri
    var TIP1 = [[0, 0], [0.022, 0.005], [0.036, 0.03], [0.038, 0.055], [0.028, 0.08], [0.014, 0.1], [0.016, 0.12], [0, 0.12]];
    var TIP2 = [[0, 0.012], [0.02, 0.014], [0.024, 0.032], [0.024, 0.105], [0.02, 0.12], [0, 0.12]];
    var KALIKS = [[0.006, -0.008], [0.03, -0.005], [0.046, 0.03], [0.048, 0.056], [0.038, 0.08], [0.026, 0.094]];
    var SUTUN = [[0.008, 0.1], [0, 0.08], [-0.008, 0.06], [-0.016, 0.04]];   // stereosilya sütunları: yerel x, boy (kinosilyuma doğru uzar)
    var HX = araliK(-0.3, 0.3, 0.075), ZS = 0.09, SATIR = Math.floor(L / ZS);
    for (k = 0; k < SATIR; k++) {
      var z = Z0 + ZS / 2 + k * ZS + (L - SATIR * ZS) / 2;
      HX.forEach(function (x0, j) {
        var x = x0 + (k % 2 ? 0.035 : 0);
        if (Math.abs(x) > 0.33) return;
        var nx = -egim(x), ny = 1, nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
        var a = Math.atan2(-nx, ny), b = [x + nx * 0.03, kristaUst(x) + ny * 0.03];
        var tip1 = Math.abs(x) < 0.18 ? (j + k) % 3 !== 2 : (j + k) % 4 === 0;   // Tip I hücreler kristanın tepesinde yoğun
        var T = G.Ag(); G.dondur(T, 0, z, tip1 ? TIP1 : TIP2, 12); yerlestir(ag(tip1 ? 'tip1' : 'tip2'), T, a, b);
        if (tip1) { T = G.Ag(); G.dondur(T, 0, z, KALIKS, 12); yerlestir(ag('kaliks'), T, a, b); }
        T = G.Ag();
        SUTUN.forEach(function (sut) { [-0.008, 0, 0.008].forEach(function (dz) { G.dondur(T, sut[0], z + dz, [[0.003, 0.115], [0.003, 0.12 + sut[1]], [0, 0.122 + sut[1]]], 5); }); });
        yerlestir(ag('silya'), T, a, b);
        T = G.Ag(); G.dondur(T, 0.017, z, [[0.004, 0.115], [0.004, 0.26], [0, 0.263]], 6); yerlestir(ag('kino'), T, a, b);
        // Sinir lifi: hücre tabanından kristanın içinden aşağı, kemikteki delikten ampullar sinire
        var yol = [[b[0], b[1] + 0.01, z], [x * 0.85 - nx * 0.06, kristaUst(x) - 0.07, z], [x * 0.4, -0.93, z], [x * 0.14, -1.12, z], [x * 0.08, -1.42, z], [x * 0.06, -1.72, z]];
        G.tup(ag('sinir'), yol, 0.007, 6, 0, 1);
      });
    }
    return M;
  }

  // Model üzerindeki ad yazıları (yönetici 'etiket' alanını düzenler); yön yazıları metinlerden (yonKanal, yonUtrikulus)
  var ETIKET = [
    { id: 'kemik', p: [-1.0, rB(-1.0) + TB / 2, Z1], yuz: ON },
    { id: 'perilenf', p: [-1.25, rM(-1.25) + TM + (rB(-1.25) - rM(-1.25) - TM) / 2, Z0], yuz: ON },
    { id: 'endolenf', p: [-0.85, 0.22, Z0], yuz: ON },
    { id: 'kupula', p: [0, 0.35, Z1], yuz: ON },
    { id: 'krista', p: [0, -0.86, Z1], yuz: ON },
    { id: 'sinir', p: [0.32, -1.62, Z1], yuz: ON },
    { id: 'endolenf', p: [-1.62, -0.02, Z0], yuz: ON, metin: 'yonKanal' },
    { id: 'endolenf', p: [1.55, -0.02, Z0], yuz: ON, metin: 'yonUtrikulus' }
  ];

  function kur(kok, ayar) {
    var K = window.Korti;
    var model = function () { var M = modelKur(); M.krista.saydam = 0.62; M.kupula.saydam = 0.38; return M; };
    return K.goruntuleyici(kok, { veri: ayar.veri, kartEki: ayar.kartEki, sinif: 'kt-ampulla', model: model, sivi: ['endolenf', 'perilenf'],
      renk: function (id) { return '--amp-' + id; }, etiketler: ETIKET,
      basR: K.mul(K.rx(K.D(8)), K.ry(K.D(-16))), genel: { cen: [0, -0.2, 0], rad: 2.25 }, yaklasEnAz: 0.3 });
  }

  window.Ampulla3D = { kur: kur, _model: modelKur };
})();
