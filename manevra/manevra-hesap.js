/* Vestibüler manevralar: hesap kısmı (ekrandan bağımsız; Node ile test edilir: node testler/manevra-test.js). 2026-11-26.
   - Dünya: y yukarı. Sedye x ekseni boyunca, üst yüzü y = 0; baş ucu x = 0'da. Kamera önden (+z) bakar.
   - Gövde ve baş eksenleri aynı düzende: x = sağ, y = yukarı (baş yönü), z = ön (yüz).
   - Gövde: B = Taban · Rz(−yan) · Rx(egil) · Ry(yuvarlan)
       yan: kenarda oturan hastanın yana yatması (+90 sağ yanına), egil: öne eğilme (+) / arkaya yatma (−90 sırtüstü),
       yuvarlan: sırtüstü yatan hastanın uzun ekseni çevresinde dönmesi (+90 sağ yanı altta, 180 yüzüstü).
   - Baş (gövdeye göre): Ry(don) · Rx(egim) · Rz(−yanEg); don + sağa çevirme, egim + fleksiyon (çene göğse), − ekstansiyon.
   - Kanallar şematik halkalar (gerçek ölçü değil): her biri baş eksenlerinde bir düzlemde, ampulla ucu (u = 0, kupula: duvar)
     ve utrikulusa açılan ucu (u = A) var. Kristal yerçekiminin yol boyunca bileşeniyle kayar, sürtünmeyle yavaşlar.
     Düzlemler: posterior ve anterior kanal dikey, orta hatla 45°; lateral kanal önde 30° yukarı eğik (supine roll testinde
     baş 30° fleksiyona getirilince dikleşir: ders notu, VNG sl. 29). Sol kulak sağın aynadaki görüntüsüdür.
   - Kupula yönü (Ewald yasaları, İşitme ve Denge Sistemleri-2, periferik vestibüler sistem sl. 41): lateral kanalda ampullaya doğru
     (ampullopetal) akım, posterior ve anterior kanalda ampulladan uzaklaşan (ampullofugal) akım uyarıcıdır.
   Hepsi yaklaşıktır; ölçülmüş bir simülasyon değildir, manevranın mantığını göstermek içindir. */
(function (kok) {
  'use strict';
  var DER = Math.PI / 180;
  function mul(a, b) { var o = [], r, c; for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]); return o; }
  function uygula(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
  function devrik(m) { return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]; }
  function rx(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function ry(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
  function rz(a) { var c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function nrm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  // Sütunları (sağ, yukarı, ön) olan matris
  function sutun(r, u, f) { return [r[0], u[0], f[0], r[1], u[1], f[1], r[2], u[2], f[2]]; }

  /* Taban duruşlar: 'boy' sedyede boyuna oturur (yüzü ayak ucuna, sırtı baş ucuna; yatınca başı sedyenin ucundan sarkar),
     'yatak' boyuna ama başı sedyenin üstünde kalır (sırtüstü başlayan manevralar), 'kenar' sedyenin kenarında, ayakları
     aşağı sarkık oturur (yüzü kameraya). p: leğen kemiğinin yeri. */
  var TABAN = {
    boy: { m: sutun([0, 0, 1], [0, 1, 0], [1, 0, 0]), p: [0.62, 0.13, 0] },
    yatak: { m: sutun([0, 0, 1], [0, 1, 0], [1, 0, 0]), p: [0.92, 0.13, 0] },
    kenar: { m: sutun([-1, 0, 0], [0, 1, 0], [0, 0, 1]), p: [0.98, 0.13, 0.1] }
  };
  var VARSAY = { yan: 0, egil: 0, yuvarlan: 0, don: 0, egim: 0, yanEg: 0, kalca: 90, diz: 0 };
  // Sol kulak için aynalama: sağ/sol yönlü bütün açıların işareti değişir
  var AYNA = ['yan', 'yuvarlan', 'don', 'yanEg'];
  function tamPoz(p, taraf) {
    var o = {}; Object.keys(VARSAY).forEach(function (k) { o[k] = p[k] != null ? p[k] : VARSAY[k]; });
    if (taraf === 'sol') AYNA.forEach(function (k) { o[k] = -o[k]; });
    return o;
  }
  function govdeMatris(taban, p) { return mul(TABAN[taban].m, mul(rz(-p.yan * DER), mul(rx(p.egil * DER), ry(p.yuvarlan * DER)))); }
  function basGoreli(p) { return mul(ry(p.don * DER), mul(rx(p.egim * DER), rz(-p.yanEg * DER))); }
  function basMatris(taban, p) { return mul(govdeMatris(taban, p), basGoreli(p)); }
  // Yerçekimi (aşağı, birim) baş eksenlerinde
  function yerBasta(taban, p) { return uygula(devrik(basMatris(taban, p)), [0, -1, 0]); }
  /* Başın (labirentin) dünyadaki yeri, metre. Boyun gövdede (0, 0,56, 0), başın merkezi boyna göre (0, 0,13, 0,02). */
  var BOYUN = [0, 0.56, 0], BAS_MERKEZ = [0, 0.13, 0.02];
  function basYeri(taban, p) {
    var B = govdeMatris(taban, p), P = p.kalcaYer || TABAN[taban].p, n = uygula(B, BOYUN), h = uygula(mul(B, basGoreli(p)), BAS_MERKEZ);
    return [P[0] + n[0] + h[0], P[1] + n[1] + h[1], P[2] + n[2] + h[2]];
  }

  /* Kanallar (sağ kulak, baş eksenlerinde). Nokta(φ) = r (cos φ e1 + sin φ e2). Yay ampulladan (fa) başlar, yon yönünde A kadar
     gider ve utrikulusa açılan uçta biter. Boşluk (iki ucun arası) vestibüle bakar. */
  var S45 = Math.SQRT1_2, S30 = 0.5, C30 = Math.sqrt(3) / 2;
  var KANAL = {
    post: { e1: [S45, 0, -S45], e2: [0, 1, 0], fa: 220, yon: 1, A: 280, bosluk: 180, uyari: 1 },     // e1 arka-dış
    ant: { e1: [S45, 0, S45], e2: [0, 1, 0], fa: -40, yon: 1, A: 260, bosluk: 270, uyari: 1 },       // e1 ön-dış
    lat: { e1: [1, 0, 0], e2: [0, S30, C30], fa: 150, yon: -1, A: 240, bosluk: 210, uyari: -1 }      // e1 dış, e2 ön (30° yukarı)
  };
  function kanal(ad, taraf) {
    var k = KANAL[ad], ay = taraf === 'sol' ? -1 : 1;
    return { ad: ad, e1: [k.e1[0] * ay, k.e1[1], k.e1[2]], e2: [k.e2[0] * ay, k.e2[1], k.e2[2]], fa: k.fa * DER, yon: k.yon, A: k.A * DER,
      bosluk: k.bosluk * DER, uyari: k.uyari };
  }
  function aci(K, u) { return K.fa + K.yon * u; }
  function teget(K, u) { var f = aci(K, u), s = Math.sin(f), c = Math.cos(f); return [K.yon * (-s * K.e1[0] + c * K.e2[0]), K.yon * (-s * K.e1[1] + c * K.e2[1]), K.yon * (-s * K.e1[2] + c * K.e2[2])]; }

  /* Kristaller. tip: 'kanal' (kanalolitiazis, serbest) ya da 'kupula' (kupulolitiazis, kupulaya yapışık). bas: başlangıç yeri (radyan). */
  function sabitRastgele(t) { var x = Math.sin(t * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  var SAYI = 9, IVME = 14, SURTUNME = 6, ARALIK = 0.045, CIKIS = 0.05;
  function kristaller(tip, bas) {
    var l = [];
    for (var i = 0; i < SAYI; i++) l.push({ u: (bas || 0.3) + i * ARALIK, v: 0, yapisik: tip === 'kupula', cikti: false,
      sur: SURTUNME * (0.85 + sabitRastgele(i * 5 + 1) * 0.3), d: (sabitRastgele(i * 5 + 2) - 0.5) * 0.5, w: sabitRastgele(i * 5 + 3) });
    return l;
  }
  /* Endolenfin eylemsizliği: baş kanal düzleminde hızla dönünce endolenf geride kalır (kanala göre ters yönde akar), sonra
     sürtünmeyle başa yetişir (zaman sabiti TAU, şematik). Kristaller hem yerçekimiyle hem bu akımla sürüklenir.
     L.akis: endolenfin uzaydaki açısal hızı (radyan/sn, kanal düzleminde). w: bu adımda başın kanal düzlemindeki dönüşü (radyan). */
  var TAU = 3, AKIS_SURUKLE = 0.3;
  // Bir adım: g baş eksenlerinde yerçekimi. Döner: kupulanın bükülmesi (+ ampulladan uzağa / − ampullaya doğru), −1..1
  function adim(K, L, g, dt, w, cikisYok) {
    var akim = 0, say = 0, om = (w || 0) / dt;
    L.akis = (L.akis || 0) + (om - (L.akis || 0)) * Math.min(1, dt / TAU);
    var vAkis = K.yon * (L.akis - om);   // endolenfin kanala göre hızı (u biriminde)
    L.forEach(function (k) {
      if (k.cikti || k.yapisik) return;
      var a = IVME * dot(teget(K, k.u), g);
      k.v += (a - k.sur * (k.v - vAkis * AKIS_SURUKLE)) * dt; k.v = Math.max(-4, Math.min(4, k.v));
      k.u += k.v * dt;
      if (k.u < 0.06) { k.u = 0.06; if (k.v < 0) k.v = 0; }        // kupula: duvar
      if (k.u >= K.A - CIKIS) {
        if (cikisYok) { k.u = K.A - CIKIS; if (k.v > 0) k.v = 0; }  // tanı testleri: kristal kanalın ucunda bekler
        else { k.cikti = true; k.v = 0; }                           // utrikulusa döküldü
      }
      akim += k.v; say++;
    });
    // Üst üste binmesinler: iki yana eşit itilir (yığın en alçak noktanın çevresinde toplanır), kanal uçlarını aşmaz
    var sira = L.filter(function (k) { return !k.cikti && !k.yapisik; }).sort(function (a, b) { return a.u - b.u; }), ust = K.A - CIKIS;
    for (var tur = 0; tur < 3; tur++) for (var i = 1; i < sira.length; i++) {
      var fark = sira[i].u - sira[i - 1].u;
      if (fark < ARALIK) { var y = (ARALIK - fark) / 2; sira[i - 1].u -= y; sira[i].u += y; }
    }
    sira.forEach(function (k) { if (k.u < 0.06) k.u = 0.06; if (cikisYok && k.u > ust) k.u = ust; });
    var yapisik = L.filter(function (k) { return k.yapisik; }).length;
    if (yapisik) return Math.max(-1, Math.min(1, dot(teget(K, 0), g) * 1.1));   // ağırlaşmış kupula yerçekimiyle bükülür
    return Math.max(-1, Math.min(1, akim / SAYI * 1.6));
  }
  // Serbestleştirici (hızlı) hareket: yapışık kristaller kupuladan ayrılır
  function kopar(L) { L.forEach(function (k, i) { if (k.yapisik) { k.yapisik = false; k.u = 0.08 + i * ARALIK; k.v = 0; } }); }

  /* Manevralar (sağ kulak için; sol kulakta açılar aynalanır). Her adım: kisaId (yazılar manevra-veri.js'te, aynı sırada),
     poz (yalnızca değişen değerler bir önceki adımdan devralınır), gecis (sn, ekranda), bekle (sn, ekranda; gerçek süre yazıda),
     kopar (kupulaya yapışık kristaller ayrılır). Başlangıç kristalleri: kanal, tip, bas. */
  var OTUR_BOY = { egil: 0, kalca: 90, diz: 0 }, YAT_BOY = { egil: -90, kalca: 0, diz: 0 };
  var OTUR_KENAR = { yan: 0, kalca: 90, diz: 90 };
  function yanYat(y) { return { yan: y, kalca: 25, diz: 55 }; }
  function birles() { var o = {}; for (var i = 0; i < arguments.length; i++) for (var k in arguments[i]) o[k] = arguments[i][k]; return o; }
  var HIZLI = 0.9, YAVAS = 2.2, BEKLE = 4.5;
  var MANEVRA = {
    'dix-hallpike': { test: true, kanal: 'post', taban: 'boy', cesit: { kanal: { tip: 'kanal' } }, adimlar: [
      { poz: OTUR_BOY, gecis: 0, bekle: 1.5 },
      { poz: { don: 45 }, gecis: YAVAS, bekle: 1 },
      { poz: birles(YAT_BOY, { egim: -30 }), gecis: HIZLI, bekle: BEKLE },
      { poz: birles(OTUR_BOY, { egim: 0 }), gecis: YAVAS, bekle: BEKLE }
    ] },
    'yana-yatirma': { test: true, kanal: 'post', taban: 'kenar', cesit: { kanal: { tip: 'kanal' } }, adimlar: [
      { poz: OTUR_KENAR, gecis: 0, bekle: 1.5 },
      { poz: { don: -45 }, gecis: YAVAS, bekle: 1 },
      { poz: yanYat(90), gecis: HIZLI, bekle: BEKLE },
      { poz: OTUR_KENAR, gecis: YAVAS, bekle: 2 }
    ] },
    'supine-roll': { test: true, kanal: 'lat', taban: 'yatak', cesit: { kanal: { tip: 'kanal', bas: 2.6 }, kupula: { tip: 'kupula' } }, adimlar: [
      { poz: birles(YAT_BOY, { egim: 30 }), gecis: 0, bekle: 1.5 },
      { poz: { don: 90 }, gecis: HIZLI, bekle: BEKLE },
      { poz: { don: 0 }, gecis: YAVAS, bekle: 1.5 },
      { poz: { don: -90 }, gecis: HIZLI, bekle: BEKLE },
      { poz: { don: 0 }, gecis: YAVAS, bekle: 1.5 }
    ] },
    'egil-yaslan': { test: true, kanal: 'lat', taban: 'kenar', cesit: { kanal: { tip: 'kanal', bas: 2.6 }, kupula: { tip: 'kupula' } }, adimlar: [
      { poz: OTUR_KENAR, gecis: 0, bekle: 1.5 },
      { poz: { egil: 30, egim: 60 }, gecis: YAVAS, bekle: BEKLE },
      { poz: { egil: 0, egim: -60 }, gecis: YAVAS, bekle: BEKLE },
      { poz: { egim: 0 }, gecis: YAVAS, bekle: 1.5 }
    ] },
    'duz-bas-sarkitma': { test: true, kanal: 'ant', taban: 'boy', cesit: { kanal: { tip: 'kanal' } }, adimlar: [
      { poz: OTUR_BOY, gecis: 0, bekle: 1.5 },
      { poz: birles(YAT_BOY, { egim: -30 }), gecis: HIZLI, bekle: BEKLE },
      { poz: birles(OTUR_BOY, { egim: 0 }), gecis: YAVAS, bekle: 2 }
    ] },
    'epley': { kanal: 'post', taban: 'boy', cesit: { kanal: { tip: 'kanal' } }, adimlar: [
      { poz: OTUR_BOY, gecis: 0, bekle: 1.5 },
      { poz: { don: 45 }, gecis: YAVAS, bekle: 1 },
      { poz: birles(YAT_BOY, { egim: -30 }), gecis: HIZLI, bekle: BEKLE },
      { poz: { don: 0 }, gecis: YAVAS, bekle: 1 },
      { poz: { don: -45 }, gecis: YAVAS, bekle: BEKLE },
      { poz: { yuvarlan: -90, don: -45, egim: 0 }, gecis: YAVAS, bekle: BEKLE },
      { poz: birles(OTUR_BOY, { yuvarlan: 0, don: -45 }), gecis: YAVAS, bekle: 1.5 },
      { poz: { don: 0 }, gecis: YAVAS, bekle: 2 }
    ] },
    'semont': { kanal: 'post', taban: 'kenar', cesit: { kanal: { tip: 'kanal' }, kupula: { tip: 'kupula' } }, adimlar: [
      { poz: OTUR_KENAR, gecis: 0, bekle: 1.5 },
      { poz: { don: -45 }, gecis: YAVAS, bekle: 1 },
      { poz: yanYat(90), gecis: HIZLI, bekle: BEKLE, kopar: true },
      { poz: yanYat(-90), gecis: HIZLI, bekle: BEKLE },
      { poz: birles(OTUR_KENAR, { don: -45 }), gecis: YAVAS, bekle: 1.5 },
      { poz: { don: 0 }, gecis: YAVAS, bekle: 2 }
    ] },
    'brandt-daroff': { kanal: 'post', taban: 'kenar', cesit: { kanal: { tip: 'kanal' } }, adimlar: [
      { poz: OTUR_KENAR, gecis: 0, bekle: 1.5 },
      { poz: birles(yanYat(90), { don: -45 }), gecis: HIZLI, bekle: BEKLE },
      { poz: birles(OTUR_KENAR, { don: 0 }), gecis: HIZLI, bekle: 2 },
      { poz: birles(yanYat(-90), { don: 45 }), gecis: HIZLI, bekle: BEKLE },
      { poz: birles(OTUR_KENAR, { don: 0 }), gecis: HIZLI, bekle: 2 }
    ] },
    'barbeku': { kanal: 'lat', taban: 'yatak', cesit: { kanal: { tip: 'kanal', bas: 2.6 } }, adimlar: [
      { poz: birles(YAT_BOY, { egim: 30, yuvarlan: 90 }), gecis: 0, bekle: 2.5 },
      { poz: { yuvarlan: 0 }, gecis: YAVAS, bekle: 3 },
      { poz: { yuvarlan: -90 }, gecis: YAVAS, bekle: 3 },
      { poz: { yuvarlan: -180 }, gecis: YAVAS, bekle: 3 },
      { poz: { yuvarlan: -270 }, gecis: YAVAS, bekle: 3 },
      { poz: { yuvarlan: -360 }, gecis: YAVAS, bekle: 2 }
    ] },
    'vannucchi-asprella': { kanal: 'lat', taban: 'yatak', cesit: { kanal: { tip: 'kanal', bas: 2.6 } }, adimlar: [
      { poz: birles(YAT_BOY, { egim: 0 }), gecis: 0, bekle: 1.5 },
      { poz: { don: -45 }, gecis: HIZLI, bekle: 2 },
      { poz: birles(OTUR_BOY, { don: -45 }), gecis: YAVAS, bekle: 2 },
      { poz: { don: 0 }, gecis: YAVAS, bekle: 2 },
      { poz: birles(YAT_BOY, { don: 0 }), gecis: YAVAS, bekle: 1 },
      { poz: { don: -45 }, gecis: HIZLI, bekle: 2 },
      { poz: birles(OTUR_BOY, { don: -45 }), gecis: YAVAS, bekle: 2 },
      { poz: { don: 0 }, gecis: YAVAS, bekle: 2 }
    ] },
    'casani': { kanal: 'lat', taban: 'kenar', cesit: { kupula: { tip: 'kupula' } }, adimlar: [
      { poz: birles(OTUR_KENAR, { egim: 30 }), gecis: 0, bekle: 1.5 },
      { poz: birles(yanYat(90), { egim: 0 }), gecis: HIZLI, bekle: 1.5, kopar: true },
      { poz: { don: 45 }, gecis: HIZLI, bekle: BEKLE },
      { poz: birles(OTUR_KENAR, { don: 45 }), gecis: HIZLI, bekle: 2.5 },
      { poz: { don: 0 }, gecis: YAVAS, bekle: 1.5 }
    ] },
    'gufoni': { kanal: 'lat', taban: 'kenar', cesit: {
      geo: { tip: 'kanal', bas: 2.6, adimlar: [
        { poz: OTUR_KENAR, gecis: 0, bekle: 1.5 },
        { poz: yanYat(-90), gecis: HIZLI, bekle: 3 },
        { poz: { don: -45 }, gecis: HIZLI, bekle: BEKLE },
        { poz: birles(OTUR_KENAR, { don: -45 }), gecis: YAVAS, bekle: 2 },
        { poz: { don: 0 }, gecis: YAVAS, bekle: 1.5 } ] },
      apo: { tip: 'kupula', adimlar: [
        { poz: OTUR_KENAR, gecis: 0, bekle: 1.5 },
        { poz: yanYat(90), gecis: HIZLI, bekle: 3, kopar: true },
        { poz: { don: -45 }, gecis: HIZLI, bekle: BEKLE },
        { poz: birles(OTUR_KENAR, { don: -45 }), gecis: YAVAS, bekle: 2 },
        { poz: { don: 0 }, gecis: YAVAS, bekle: 1.5 } ] } } },
    'yacovino': { kanal: 'ant', taban: 'boy', cesit: { kanal: { tip: 'kanal' } }, adimlar: [
      { poz: OTUR_BOY, gecis: 0, bekle: 1.5 },
      { poz: birles(YAT_BOY, { egim: -35 }), gecis: HIZLI, bekle: BEKLE },
      { poz: { egim: 45 }, gecis: YAVAS, bekle: BEKLE },
      { poz: birles(OTUR_BOY, { egim: 20 }), gecis: YAVAS, bekle: BEKLE },
      { poz: { egim: 0 }, gecis: YAVAS, bekle: 1.5 }
    ] }
  };
  function cesitler(id) { return Object.keys(MANEVRA[id].cesit); }
  // Bir çeşidin adımları: pozlar birikimli doldurulur (her adım öncekinden devralır)
  function adimlar(id, cesit, taraf) {
    var M = MANEVRA[id], C = M.cesit[cesit] || M.cesit[cesitler(id)[0]], ham = C.adimlar || M.adimlar, onceki = {};
    return ham.map(function (a) { onceki = birles(onceki, a.poz); return { poz: tamPoz(onceki, taraf), ham: onceki, gecis: a.gecis, bekle: a.bekle, kopar: !!a.kopar }; });
  }
  function karistir(a, b, t) { var o = {}; Object.keys(a).forEach(function (k) { o[k] = a[k] + (b[k] - a[k]) * t; }); return o; }
  function yumusak(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

  /* Oynatıcı: zamana göre poz ve kristaller. Ekran ve test aynı nesneyi kullanır. */
  function oynatici(id, cesit, taraf) {
    var M = MANEVRA[id], C = M.cesit[cesit] || M.cesit[cesitler(id)[0]];
    var A = adimlar(id, cesit, taraf), K = kanal(M.kanal, taraf), L, durum, cikisYok = !!M.test;
    var n = [K.e1[1] * K.e2[2] - K.e1[2] * K.e2[1], K.e1[2] * K.e2[0] - K.e1[0] * K.e2[2], K.e1[0] * K.e2[1] - K.e1[1] * K.e2[0]];   // kanal düzleminin normali (baş eksenlerinde)
    function sifirla() {
      L = kristaller(C.tip, C.bas); durum = { adim: 0, t: 0, poz: A[0].poz, bukulme: 0, H: basMatris(M.taban, A[0].poz) };
      // Kristaller başlangıç pozunda yerleşsin
      var g = yerBasta(M.taban, A[0].poz); for (var i = 0; i < 300; i++) adim(K, L, g, 1 / 60, 0, true);
      durum.bukulme = 0; L.akis = 0;
    }
    // İki baş yönelimi arasındaki küçük dönüşün kanal düzlemindeki bileşeni (radyan)
    function donus(H0, H1) {
      var R = mul(devrik(H0), H1), w = [(R[7] - R[5]) / 2, (R[2] - R[6]) / 2, (R[3] - R[1]) / 2];
      return dot(w, n);
    }
    function sure(i) { return A[i].gecis + A[i].bekle; }
    function pozAn(k, t) {   // k. adımda, adımın başından t sn sonra poz
      var a = A[k], onceki = A[Math.max(0, k - 1)].poz;
      return a.gecis > 0 ? karistir(onceki, a.poz, yumusak(t / a.gecis)) : a.poz;
    }
    /* Etkin yerçekimi (baş eksenlerinde, g biriminde): yerçekimi − başın doğrusal ivmesi. Hızlı savrulmada (Semont) merkezkaç
       etkisi kristalleri kanalın kubbesine bastırır. İvme pozun zamana göre ikinci türevinden hesaplanır. */
    var HH = 1 / 120;
    function etkinYer(k, t, poz) {
      var a = [0, 0, 0];
      if (A[k].gecis > 0 && t > HH && t < A[k].gecis - HH) {
        var p0 = basYeri(M.taban, pozAn(k, t - HH)), p1 = basYeri(M.taban, poz), p2 = basYeri(M.taban, pozAn(k, t + HH));
        a = [(p0[0] - 2 * p1[0] + p2[0]) / (HH * HH * 9.81), (p0[1] - 2 * p1[1] + p2[1]) / (HH * HH * 9.81), (p0[2] - 2 * p1[2] + p2[2]) / (HH * HH * 9.81)];
      }
      return uygula(devrik(basMatris(M.taban, poz)), [-a[0], -1 - a[1], -a[2]]);
    }
    // dt kadar ilerle; döner: manevra bitti mi
    function ilerle(dt) {
      var a = A[durum.adim];
      durum.t += dt;
      if (durum.adim > 0 && a.kopar && !a._kopti && durum.t >= a.gecis * 0.7) { kopar(L); a._kopti = true; }
      durum.poz = pozAn(durum.adim, Math.min(durum.t, a.gecis));
      var g = etkinYer(durum.adim, durum.t, durum.poz), parca = Math.max(1, Math.ceil(dt / (1 / 120)));
      var H = basMatris(M.taban, durum.poz), w = donus(durum.H, H) / parca; durum.H = H;
      var b = 0; for (var i = 0; i < parca; i++) b = adim(K, L, g, dt / parca, w, cikisYok || durum.adim === 0);   // başlangıç pozunda kristaller kanalda kalır
      durum.bukulme += (b - durum.bukulme) * Math.min(1, dt * 6);
      durum.g = g;
      if (durum.t >= sure(durum.adim)) {
        if (durum.adim >= A.length - 1) { durum.t = sure(durum.adim); return true; }
        durum.adim++; durum.t = 0;
      }
      return false;
    }
    // k. adımın başına git: baştan sessizce hesaplanır (aynı girdi hep aynı sonucu verir)
    function git(k) {
      A.forEach(function (a) { a._kopti = false; });
      sifirla();
      while (durum.adim < k) ilerle(1 / 60);
      durum.t = 0;
    }
    sifirla();
    return { adimlar: A, kanal: K, kristaller: function () { return L; }, durum: function () { return durum; }, ilerle: ilerle, git: git, sure: sure,
      taban: M.taban, cesit: cesit, taraf: taraf, sifirla: function () { git(0); } };
  }

  var api = { TABAN: TABAN, MANEVRA: MANEVRA, KANAL: KANAL, kanal: kanal, aci: aci, teget: teget, tamPoz: tamPoz, govdeMatris: govdeMatris,
    basGoreli: basGoreli, basMatris: basMatris, yerBasta: yerBasta, basYeri: basYeri, adimlar: adimlar, cesitler: cesitler, oynatici: oynatici,
    karistir: karistir, uygula: uygula, mul: mul, devrik: devrik, nrm: nrm, dot: dot, rx: rx, ry: ry, rz: rz, DER: DER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else kok.ManevraHesap = api;
})(typeof window !== 'undefined' ? window : this);
