/* SesLab denge hesapları (ekrandan bağımsız; Node ile test edilir: testler/denge-test.js).
   - Model eksenleri: x = ön (anterior), y = üst (superior), z = dış (lateral; model sağ kulak).
   - Baş pozisyonu: Q = Rx(govde) · Ry(−donus) · Rx(egim). Dünya: y yukarı; oturan hastanın yüzü +z'ye bakar, sağı −x.
     govde: gövdenin yatması (−90 sırtüstü; −110 = sırtüstü + baş 20° sarkık), donus: başın sağa (+) / sola (−) dönüşü,
     egim: çene göğse (+) / baş geriye (−). Yan yatış (Epley 3. adım) baş ekseni çevresinde 135° dönüşle aynı yönelimdir.
   - Posterior kanal yolu modelden çıkarılır: ampulla tarafı (kupula, u = 0) → kanal yayı → krus kommune → utrikulus (u = L).
   Hepsi yaklaşıktır; ölçülmüş simülasyon değildir. */
(function () {
  'use strict';
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sc(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function len(a) { return Math.hypot(a[0], a[1], a[2]); }
  function nrm(a) { var l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function vtx(P, i) { return [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]; }
  function merkez(P) { var c = [0, 0, 0], n = P.length / 3; for (var i = 0; i < n; i++) { c[0] += P[i * 3]; c[1] += P[i * 3 + 1]; c[2] += P[i * 3 + 2]; } return sc(c, 1 / (n || 1)); }
  function enYakin(P, p) { var bi = 0, bd = 1e18, n = P.length / 3; for (var i = 0; i < n; i++) { var d = (P[i * 3] - p[0]) * (P[i * 3] - p[0]) + (P[i * 3 + 1] - p[1]) * (P[i * 3 + 1] - p[1]) + (P[i * 3 + 2] - p[2]) * (P[i * 3 + 2] - p[2]); if (d < bd) { bd = d; bi = i; } } return vtx(P, bi); }
  // 3x3 matrisler satır düzeninde
  function mul(a, b) { var o = [], r, c; for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]); return o; }
  function uygula(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
  function devrik(m) { return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]; }
  function rx(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function ry(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
  function rz(a) { var c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; }
  var DER = Math.PI / 180;
  // Modelden baş eksenlerine: model (ön, üst, dış=sağ) → baş (0,0,1)=ön, (0,1,0)=üst, (−1,0,0)=sağ
  var M2H = [0, 0, -1, 0, 1, 0, 1, 0, 0];

  // Baş pozisyonu → modelden dünyaya dönme (W). poz: {govde, donus, egim, yan} derece.
  // yan: başın omza eğilmesi (+ sağ omza), oturur hâlde.
  function pozMatris(poz) {
    var Q = mul(rx((poz.govde || 0) * DER), mul(ry(-(poz.donus || 0) * DER), mul(rz((poz.yan || 0) * DER), rx((poz.egim || 0) * DER))));
    return mul(Q, M2H);
  }
  // Dünyada yerçekimi + (varsa) doğrusal ivmenin otolitlere etkisi, model eksenlerinde. ivme: [x,y,z] dünya, g biriminde.
  function kuvvetModelde(W, ivme) {
    var f = [0, -1, 0];
    if (ivme) f = sub(f, ivme);   // eylemsizlik: ivmenin tersi yönde
    return uygula(devrik(W), f);
  }
  // Dönme matrisinden dördey (quaternion) ve geri; iki poz arasında yumuşak geçiş için.
  function mat2q(m) {
    var t = m[0] + m[4] + m[8], q;
    if (t > 0) { var s = Math.sqrt(t + 1) * 2; q = [0.25 * s, (m[7] - m[5]) / s, (m[2] - m[6]) / s, (m[3] - m[1]) / s]; }
    else if (m[0] > m[4] && m[0] > m[8]) { s = Math.sqrt(1 + m[0] - m[4] - m[8]) * 2; q = [(m[7] - m[5]) / s, 0.25 * s, (m[1] + m[3]) / s, (m[2] + m[6]) / s]; }
    else if (m[4] > m[8]) { s = Math.sqrt(1 + m[4] - m[0] - m[8]) * 2; q = [(m[2] - m[6]) / s, (m[1] + m[3]) / s, 0.25 * s, (m[5] + m[7]) / s]; }
    else { s = Math.sqrt(1 + m[8] - m[0] - m[4]) * 2; q = [(m[3] - m[1]) / s, (m[2] + m[6]) / s, (m[5] + m[7]) / s, 0.25 * s]; }
    return q;
  }
  function q2mat(q) {
    var w = q[0], x = q[1], y = q[2], z = q[3];
    return [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)];
  }
  function slerp(a, b, t) {
    var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = [-b[0], -b[1], -b[2], -b[3]]; d = -d; }
    if (d > 0.9995) { var r = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t], l = Math.hypot(r[0], r[1], r[2], r[3]); return r.map(function (v) { return v / l; }); }
    var th = Math.acos(d), s = Math.sin(th), wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
    return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb, a[3] * wa + b[3] * wb];
  }

  // En büyük, ortanca, en küçük ana eksen (PCA, kuvvet yinelemesi)
  function eksenler(P) {
    var c = merkez(P), n = P.length / 3, C = [0, 0, 0, 0, 0, 0, 0, 0, 0], i, a, b;
    for (i = 0; i < n; i++) { var d = sub(vtx(P, i), c); for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) C[a * 3 + b] += d[a] * d[b]; }
    var out = [], M = C.slice();
    for (var k = 0; k < 3; k++) {
      var v = nrm([1 + k, 0.5 - k, 0.3 * k + 0.2]);
      for (var it = 0; it < 80; it++) v = nrm(uygula(M, v));
      var lam = dot(v, uygula(M, v)); out.push(v);
      for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) M[a * 3 + b] -= lam * v[a] * v[b];
    }
    return out;
  }

  /* Posterior kanal yolu: [noktalar], toplam uzunluk. u = 0 kupula (ampulla), u = L utrikulus.
     Ampulla, amp parçasındaki üç kümeden kanal yayının alt ucuna en yakın olanıdır. */
  function kanalYolu(PART) {
    var post = PART.post.P, amp = PART.amp.P, vest = PART.vest.P;
    var E = eksenler(post), c = merkez(post), u1 = E[0], u2 = E[1], DIL = 72, top = [], i, n = post.length / 3;
    for (i = 0; i < DIL; i++) top.push([0, 0, 0, 0]);
    for (i = 0; i < n; i++) {
      var d = sub(vtx(post, i), c), a = Math.atan2(dot(d, u2), dot(d, u1)), b = Math.min(DIL - 1, Math.floor((a + Math.PI) / (2 * Math.PI) * DIL));
      top[b][0] += post[i * 3]; top[b][1] += post[i * 3 + 1]; top[b][2] += post[i * 3 + 2]; top[b][3]++;
    }
    // En uzun boş dilim dizisi = kanalın açık olduğu (vestibüle bağlandığı) yer; yay onun bir ucundan öbürüne gider.
    var enUzun = 0, bas = 0;
    for (i = 0; i < DIL; i++) { var k = 0; while (k < DIL && top[(i + k) % DIL][3] < 3) k++; if (k > enUzun) { enUzun = k; bas = i; } }
    var yay = [];
    for (i = 0; i < DIL - enUzun; i++) { var t = top[(bas + enUzun + i) % DIL]; if (t[3] >= 3) yay.push([t[0] / t[3], t[1] / t[3], t[2] / t[3]]); }
    if (yay[0][1] > yay[yay.length - 1][1]) yay.reverse();   // alt uç (ampulla tarafı) başta
    // Ampulla: amp köşelerinden yayın alt ucuna en yakın olanların ortası
    var ucA = yay[0], yak = [], m = amp.length / 3;
    for (i = 0; i < m; i++) if (len(sub(vtx(amp, i), ucA)) < 3.2) yak.push(vtx(amp, i));
    var ampM = yak.length ? sc(yak.reduce(add, [0, 0, 0]), 1 / yak.length) : ucA;
    // Yayın son kısmı krus kommune üzerinden vestibüle iner (modelde posterior kanal parçasına dahil).
    // Yumuşatma: komşu 5 noktanın ortalaması (kanal kesitinin pürüzü kristalleri takılmasın).
    var yum = yay.map(function (p, j) { var s = [0, 0, 0], say = 0; for (var q = Math.max(0, j - 2); q <= Math.min(yay.length - 1, j + 2); q++) { s = add(s, yay[q]); say++; } return sc(s, 1 / say); });
    var son = yum[yum.length - 1], vC = merkez(vest), utr = add(enYakin(vest, son), sc(nrm(sub(vC, son)), 1.6));
    var yol = yum.concat([utr]);
    // Uzunluklar
    var s = [0];
    for (i = 1; i < yol.length; i++) s.push(s[i - 1] + len(sub(yol[i], yol[i - 1])));
    // n: kanal düzleminin normali (kristallerin kanal içindeki yan konumu için)
    return { yol: yol, s: s, L: s[s.length - 1], ampulla: ampM, utrikulus: utr, kanalBitis: s[yum.length - 1], n: E[2] };
  }
  function yolNokta(Y, u) {
    u = Math.max(0, Math.min(Y.L, u));
    var i = 1; while (i < Y.s.length - 1 && Y.s[i] < u) i++;
    var a = Y.yol[i - 1], b = Y.yol[i], t = (u - Y.s[i - 1]) / ((Y.s[i] - Y.s[i - 1]) || 1);
    return { p: add(a, sc(sub(b, a), t)), t: nrm(sub(b, a)) };
  }

  /* Kristaller: her biri yol üzerinde bir u değeri. Yerçekiminin yol boyunca bileşeni kadar hızlanır, sürtünmeyle yavaşlar.
     Utrikulusa ulaşan (u ≥ L − 0,4) kristal orada kalır. Kupula (u = 0) duvar gibidir. adim(): saniye cinsinden dt. */
  /* Her kristal ayrı bir tane: boyu (b), sürtünmesi (sur; büyükler biraz daha hızlı kayar), kanal kesitindeki yeri
     (a açı, d uzaklık; mm) ve duruşu (don) farklıdır. Sabit "rastgele" sayılar: her açılışta aynı görünür, test tekrarlanabilir. */
  function kristaller(Y, sayi) {
    var K = [];
    for (var i = 0; i < sayi; i++) {
      var b = 0.55 + sabitRastgele(i * 7 + 1) * 0.75;
      K.push({ u: 0.4 + sabitRastgele(i * 7 + 2) * 1.6, v: 0, cikti: false, b: b,
        sur: SURTUNME * (1.25 - (b - 0.55) * 0.45) * (0.85 + sabitRastgele(i * 7 + 3) * 0.3),
        a: sabitRastgele(i * 7 + 4) * 2 * Math.PI, d: sabitRastgele(i * 7 + 5) * 0.3,
        don: [sabitRastgele(i * 7 + 6) * 6.28, sabitRastgele(i * 7 + 7) * 6.28] });
    }
    return K;
  }
  var IVME = 5, SURTUNME = 2.2, ARALIK = 0.05;   // (2026-11-21: daha çok ve küçük tane, aralık küçüldü) yavaş tutuldu: kayış ekranda izlenebilsin; taneler birbirine yaklaşabilir (yanlara dağılırlar)
  function adim(Y, K, gModel, dt) {
    var kupula = 0;
    K.forEach(function (k) {
      if (k.cikti) return;
      var y = yolNokta(Y, k.u), a = IVME * dot(y.t, gModel);
      k.v += (a - (k.sur || SURTUNME) * k.v) * dt; k.v = Math.max(-6, Math.min(6, k.v));
      k.u += k.v * dt;
      if (k.u < 0.15) { k.u = 0.15; if (k.v < 0) k.v = 0; }
      if (k.u >= Y.L - 0.4) { k.u = Y.L - 0.4; k.cikti = true; k.v = 0; }
      if (k.u < Y.kanalBitis) kupula += k.v;   // kanalda hareket eden kristaller endolenfi sürükler
    });
    // Üst üste binmesinler
    var sirali = K.filter(function (k) { return !k.cikti; }).sort(function (a, b) { return a.u - b.u; });
    for (var i = 1; i < sirali.length; i++) if (sirali[i].u - sirali[i - 1].u < ARALIK) sirali[i].u = sirali[i - 1].u + ARALIK;
    // kupula > 0: kristaller ampulladan uzaklaşıyor (ampullofugal); < 0: ampullaya doğru (ampullopetal)
    return kupula / (K.length || 1);
  }

  // Utrikulusa dönen tanenin oradaki yeri (merkeze göre, mm): gelişigüzel küçük küme
  function cikisYeri(i) { var a = sabitRastgele(i * 3 + 11) * 6.28, d = 0.15 + sabitRastgele(i * 3 + 12) * 0.55; return [Math.cos(a) * d, (sabitRastgele(i * 3 + 13) - 0.5) * 0.3, Math.sin(a) * d]; }
  // Kristal ağı: köşeleri biraz oynatılmış küçük çokyüzlü (yassı, köşeli; düz yüz normalleri)
  function kristalAg(r) {
    var A = ag(), v = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], Y = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
    var yeni = [];
    Y.forEach(function (y) { var a = v[y[0]], b = v[y[1]], c = v[y[2]], ab = v.push(nrm(add(a, b))) - 1, bc = v.push(nrm(add(b, c))) - 1, ca = v.push(nrm(add(c, a))) - 1; yeni.push([y[0], ab, ca], [ab, y[1], bc], [ca, bc, y[2]], [ab, bc, ca]); });
    v = v.map(function (p, i) { var s = 0.78 + sabitRastgele(i + 40) * 0.44; return [p[0] * s * r * 1.25, p[1] * s * r * 0.8, p[2] * s * r]; });
    yeni.forEach(function (y) {
      var a = v[y[0]], b = v[y[1]], c = v[y[2]], n = nrm(cross(sub(b, a), sub(c, a)));
      A.I.push(ekle(A, a, n, 0), ekle(A, b, n, 0), ekle(A, c, n, 0));
    });
    return A;
  }

  /* ---------- Otolit organları (makulalar): modelde yok, vestibül içine yaklaşık olarak çizilir ---------- */
  // Ağ biriktirici: P (konum), N (normal), S (hareket ağırlığı: 0 sabit, 1 otolit zarıyla birlikte kayar), I (üçgenler)
  function ag() { return { P: [], N: [], S: [], I: [] }; }
  function ekle(A, p, n, s) { A.P.push(p[0], p[1], p[2]); A.N.push(n[0], n[1], n[2]); A.S.push(s); return A.P.length / 3 - 1; }
  // Elips plaka (iki yüzlü çizilir): merkez c, normal n, düzlem eksenleri e1 e2, yarıçaplar r1 r2
  function plaka(A, c, n, e1, e2, r1, r2, s) {
    var mi = ekle(A, c, n, s), K = 28, ilk = A.P.length / 3;
    for (var i = 0; i < K; i++) { var a = i / K * 2 * Math.PI; ekle(A, add(c, add(sc(e1, Math.cos(a) * r1), sc(e2, Math.sin(a) * r2))), n, s); }
    for (i = 0; i < K; i++) A.I.push(mi, ilk + i, ilk + (i + 1) % K);
  }
  // Küçük sekizyüzlü (kristal ya da küre yerine)
  function sekizyuz(A, c, r, s, don) {
    var d = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(function (v) { return uygula(don, v); });
    var Y = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
    Y.forEach(function (y) {
      var a = d[y[0]], b = d[y[1]], e = d[y[2]], n = nrm(add(add(a, b), e));
      A.I.push(ekle(A, add(c, sc(a, r)), n, s), ekle(A, add(c, sc(b, r)), n, s), ekle(A, add(c, sc(e, r)), n, s));
    });
  }
  // Tüy demeti: tabanı epitelde (s = 0), ucu otolit zarında (s = 1) olan ince üçgen prizma; zar kayınca bükülür.
  function tuy(A, alt, n, e1, boy, en) {
    var ust = add(alt, sc(n, boy)), e2 = cross(n, e1), k = [];
    for (var i = 0; i < 3; i++) { var a = i / 3 * 2 * Math.PI; k.push(add(sc(e1, Math.cos(a) * en), sc(e2, Math.sin(a) * en))); }
    for (i = 0; i < 3; i++) {
      var j = (i + 1) % 3, yn = nrm(add(k[i], k[j]));
      var a0 = ekle(A, add(alt, k[i]), yn, 0), a1 = ekle(A, add(alt, k[j]), yn, 0), u0 = ekle(A, add(ust, k[i]), yn, 1), u1 = ekle(A, add(ust, k[j]), yn, 1);
      A.I.push(a0, a1, u1, a0, u1, u0);
    }
  }
  function sabitRastgele(t) { var x = Math.sin(t * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  /* Bir makula: epitel (sabit), tüy demetleri (bükülür), otolit zarı + kristaller (kayar). Ölçüler mm, büyütülmüş. */
  function makula(c, n, e1, r1, r2) {
    n = nrm(n); e1 = nrm(sub(e1, sc(n, dot(e1, n)))); var e2 = cross(n, e1);
    var epitel = ag(), tuyler = ag(), zar = ag(), BOY = 0.32;
    plaka(epitel, c, n, e1, e2, r1, r2, 0);
    var i, j, say = 0;
    for (i = -3; i <= 3; i++) for (j = -2; j <= 2; j++) {
      var x = i / 3.6, y = j / 2.4; if (x * x + y * y > 0.85) continue;
      tuy(tuyler, add(c, add(sc(e1, x * r1), sc(e2, y * r2))), n, e1, BOY, 0.035); say++;
    }
    var zc = add(c, sc(n, BOY));
    plaka(zar, zc, n, e1, e2, r1 * 0.96, r2 * 0.96, 1);
    for (i = 0; i < 70; i++) {
      var a = sabitRastgele(i) * 2 * Math.PI, rr = Math.sqrt(sabitRastgele(i + 50)) * 0.85;
      var p = add(zc, add(add(sc(e1, Math.cos(a) * rr * r1), sc(e2, Math.sin(a) * rr * r2)), sc(n, 0.05 + sabitRastgele(i + 90) * 0.06)));
      sekizyuz(zar, p, 0.05 + sabitRastgele(i + 20) * 0.04, 1, rx(sabitRastgele(i + 7) * 3));
    }
    return { epitel: epitel, tuy: tuyler, zar: zar, merkez: c, normal: n };
  }
  /* Utrikulus: dik başta yatay (normal yukarı), vestibülün üst-arka kısmında, krus kommune ağzının önünde.
     Sakkulus: dikey (normal dışa), vestibülün alt-ön-iç kısmında. Konumlar modelden yaklaşık seçildi. */
  function makulalar(PART) {
    var vest = PART.vest.P, vC = merkez(vest);
    var uM = add(vC, [0.5, 1.1, 0.7]), sM = add(vC, [0.9, -1.5, -0.5]);
    return {
      utr: makula(uM, [0, 1, 0], [1, 0, 0], 1.0, 0.7),
      sak: makula(sM, [0, 0, 1], [0.5, 0.86, 0], 1.0, 0.65)
    };
  }
  // Otolit zarının kayması: kuvvetin makula düzlemindeki bileşeni (mm). k: g başına kayma (büyütülmüş).
  function makulaKayma(M, f, k) {
    var d = sub(f, sc(M.normal, dot(f, M.normal)));
    return sc(d, k);
  }
  // Küre (kristal parçacığı için): iki kez bölünmüş sekizyüzlü
  function kure(r) {
    var A = ag(), v = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], Y = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
    for (var d = 0; d < 2; d++) {
      var yeni = [];
      Y.forEach(function (y) {
        var a = v[y[0]], b = v[y[1]], c = v[y[2]], ab = v.push(nrm(add(a, b))) - 1, bc = v.push(nrm(add(b, c))) - 1, ca = v.push(nrm(add(c, a))) - 1;
        yeni.push([y[0], ab, ca], [ab, y[1], bc], [ca, bc, y[2]], [ab, bc, ca]);
      });
      Y = yeni;
    }
    v.forEach(function (p) { ekle(A, sc(p, r), p, 0); });
    Y.forEach(function (y) { A.I.push(y[0], y[1], y[2]); });
    return A;
  }

  /* ---------- Silik baş (pozisyonu göstermek için; şematik, ölçekli değil) ----------
     Labirent başın sağ yarısında, kulak hizasında durur. Baş gerçek oranında değil, labirente göre küçültülmüştür. */
  function elipsoid(A, c, r, s, kesY) {
    var Y = 14, X = 24, ilk = A.P.length / 3, i, j;
    for (i = 0; i <= Y; i++) {
      var th = i / Y * Math.PI, sy = Math.cos(th), sr = Math.sin(th);
      for (j = 0; j <= X; j++) {
        var ph = j / X * 2 * Math.PI, n = [sr * Math.cos(ph), sy, sr * Math.sin(ph)];
        var k = kesY && n[1] < 0 ? 1 + n[1] * kesY : 1;   // alt kısım (çene) daralır
        ekle(A, [c[0] + n[0] * r[0] * k, c[1] + n[1] * r[1], c[2] + n[2] * r[2] * k], nrm([n[0] / r[0], n[1] / r[1], n[2] / r[2]]), s);
      }
    }
    for (i = 0; i < Y; i++) for (j = 0; j < X; j++) { var a = ilk + i * (X + 1) + j, b = a + X + 1; A.I.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  function silindir(A, alt, ust, r) {
    var K = 20, ilk = A.P.length / 3, i;
    for (i = 0; i <= K; i++) { var a = i / K * 2 * Math.PI, n = [Math.cos(a), 0, Math.sin(a)]; ekle(A, add(alt, sc(n, r)), n, 0); ekle(A, add(ust, sc(n, r)), n, 0); }
    for (i = 0; i < K; i++) { var p = ilk + i * 2; A.I.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); }
  }
  function basAg(PART) {
    var c = merkez(PART.vest.P), H = add(c, [3, 0, -5]), R = [13, 15, 11];
    var deri = ag(), yuz = ag(), kulak = ag(), boyun = ag(), burun = ag();
    elipsoid(deri, H, R, 0, 0.25);
    // Burun: alnın altında, öne çıkan sekizyüzlü; gözler: iki küçük elipsoid
    elipsoid(burun, add(H, [R[0] - 0.5, -3, 0]), [3.2, 3.6, 1.8], 0);
    elipsoid(yuz, add(H, [R[0] - 2.4, 2.5, 4.2]), [0.8, 1.2, 1.4], 0);
    elipsoid(yuz, add(H, [R[0] - 2.4, 2.5, -4.2]), [0.8, 1.2, 1.4], 0);
    // Kulaklar: sağ (dış, +z) renkli, sol silik
    elipsoid(kulak, add(H, [-2, -1, R[2] + 0.4]), [2.4, 4, 0.8], 0);
    elipsoid(deri, add(H, [-2, -1, -R[2] - 0.4]), [2.4, 4, 0.8], 0);
    silindir(boyun, add(H, [-3, -R[1] - 9, 0]), add(H, [-2, -R[1] + 4, 0]), 6.5);
    return { deri: deri, yuz: yuz, kulak: kulak, boyun: boyun, burun: burun };
  }

  var api = { pozMatris: pozMatris, kuvvetModelde: kuvvetModelde, mat2q: mat2q, q2mat: q2mat, slerp: slerp, kanalYolu: kanalYolu, yolNokta: yolNokta,
    kristaller: kristaller, adim: adim, makulalar: makulalar, basAg: basAg, kristalAg: kristalAg, cikisYeri: cikisYeri, rx: rx, ry: ry, makulaKayma: makulaKayma, kure: kure, uygula: uygula, devrik: devrik, mul: mul, eksenler: eksenler, merkez: merkez, enYakin: enYakin };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.SesLabDenge = api;
})();
