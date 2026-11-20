/* SesLab: "Ses laboratuvarı". gorsel3d/gorsel3d.js'in kopyasından türetildi (2026-11-18); asıl 3D sayfasına dokunulmaz.
   Aynı modeli (gorsel3d/periferik.json + .bin) yalnızca OKUR; model dosyası değiştirilmez, yeniden indirilmez
   (servis çalışanının önbelleğindeki kopya kullanılır).

   Animasyonlar modeli değiştirmez; yalnızca ekranda çizerken uygulanır:
   - Dış kulak yolu: içeri doğru ilerleyen ses dalgası (renk halkaları).
   - Timpanik membran: içe-dışa esneme (kenarı sabit, umboya doğru artar).
   - Malleus + inkus: tek parça gibi, malleus–inkus ekleminden geçen eksen etrafında dönme (kaldıraç).
   - Stapes: oval pencereye doğru piston hareketi (inkusun ucundaki hareketin piston yönündeki payı).
   - Skala media: bazalden apekse yürüyen dalga; en büyük olduğu yer frekansa göre (Greenwood 1990, insan).
   Hareketler büyütülmüş ve yavaşlatılmıştır (öğretim çizimi, ölçülmüş simülasyon değil).

   Kullanım:
     var s = SesLab.kur(kapsayici, { veri: window.SESLAB_VERI, yapilar: window.GORSEL3D_VERI.yapilar,
                                     veriYolu: 'gorsel3d/', kartEki: function (tur, kimlik, yuva) {} });
     s.yenile(); s.durdur(); s.kaldir();
   Renkler koda yazılmaz: yapı renkleri --g3d-<kimlik>, animasyon renkleri --sl-* (seslab.css).
   Ekrana yazı yalnızca textContent ile basılır. */
(function () {
  'use strict';

  /* ---------- küçük matematik ---------- */
  function rx(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function ry(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
  function mul(a, b) { var o = [], r, c; for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]); return o; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sc(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function nrm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function vtx(P, i) { return [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]; }
  function merkez(P) { var c = [0, 0, 0], n = P.length / 3; for (var i = 0; i < P.length; i += 3) { c[0] += P[i]; c[1] += P[i + 1]; c[2] += P[i + 2]; } return sc(c, 1 / n); }
  // Ana eksenler (PCA): en büyükten en küçüğe 3 yön.
  function eksenler(P) {
    var c = merkez(P), C = [0, 0, 0, 0, 0, 0, 0, 0, 0], i, r, s, d, out = [];
    for (i = 0; i < P.length; i += 3) { d = [P[i] - c[0], P[i + 1] - c[1], P[i + 2] - c[2]]; for (r = 0; r < 3; r++) for (s = 0; s < 3; s++) C[r * 3 + s] += d[r] * d[s]; }
    for (var e = 0; e < 3; e++) {
      var v = e === 0 ? [1, 0.3, 0.2] : e === 1 ? [0.2, 1, 0.3] : [0.3, 0.2, 1];
      for (var it = 0; it < 120; it++) { v = nrm([C[0] * v[0] + C[1] * v[1] + C[2] * v[2], C[3] * v[0] + C[4] * v[1] + C[5] * v[2], C[6] * v[0] + C[7] * v[1] + C[8] * v[2]]); }
      var w = [C[0] * v[0] + C[1] * v[1] + C[2] * v[2], C[3] * v[0] + C[4] * v[1] + C[5] * v[2], C[6] * v[0] + C[7] * v[1] + C[8] * v[2]], lam = dot(w, v);
      out.push(v);
      for (r = 0; r < 3; r++) for (s = 0; s < 3; s++) C[r * 3 + s] -= lam * v[r] * v[s];
    }
    return out;
  }
  function enYakin(P, q) { var best = 1e18, bi = 0; for (var i = 0; i < P.length; i += 3) { var d = (P[i] - q[0]) * (P[i] - q[0]) + (P[i + 1] - q[1]) * (P[i + 1] - q[1]) + (P[i + 2] - q[2]) * (P[i + 2] - q[2]); if (d < best) { best = d; bi = i / 3; } } return bi; }
  function enYakinCift(A, B) {   // iki parçanın birbirine en yakın noktaları (B seyrek taranır)
    var best = 1e18, pa = null, pb = null, i, j, d;
    for (j = 0; j < B.length; j += 9) for (i = 0; i < A.length; i += 3) {
      d = (A[i] - B[j]) * (A[i] - B[j]) + (A[i + 1] - B[j + 1]) * (A[i + 1] - B[j + 1]) + (A[i + 2] - B[j + 2]) * (A[i + 2] - B[j + 2]);
      if (d < best) { best = d; pa = i / 3; pb = j / 3; }
    }
    return [vtx(A, pa), vtx(B, pb)];
  }
  // Ağ üzerinde kenarlardan yürüyerek uzaklık (Dijkstra; küçük parçalar için basit dizi kuyruğu yeterli).
  function agUzaklik(P, I, kaynak) {
    var n = P.length / 3, komsu = [], i, k;
    for (i = 0; i < n; i++) komsu.push([]);
    for (k = 0; k < I.length; k += 3) {
      var a = I[k], b = I[k + 1], c = I[k + 2];
      komsu[a].push(b, c); komsu[b].push(a, c); komsu[c].push(a, b);
    }
    var D = new Float32Array(n).fill(Infinity), bitti = new Uint8Array(n), yigin = [kaynak];
    D[kaynak] = 0;
    // İkili yığın (heap)
    function yukari(j) { while (j > 0) { var p = (j - 1) >> 1; if (D[yigin[p]] <= D[yigin[j]]) break; var t = yigin[p]; yigin[p] = yigin[j]; yigin[j] = t; j = p; } }
    function asagi(j) { for (;;) { var l = 2 * j + 1, r = l + 1, m = j; if (l < yigin.length && D[yigin[l]] < D[yigin[m]]) m = l; if (r < yigin.length && D[yigin[r]] < D[yigin[m]]) m = r; if (m === j) break; var t = yigin[m]; yigin[m] = yigin[j]; yigin[j] = t; j = m; } }
    while (yigin.length) {
      var u = yigin[0], son = yigin.pop(); if (yigin.length) { yigin[0] = son; asagi(0); }
      if (bitti[u]) continue; bitti[u] = 1;
      var ku = komsu[u];
      for (k = 0; k < ku.length; k++) {
        var v = ku[k]; if (bitti[v]) continue;
        var dd = D[u] + Math.hypot(P[u * 3] - P[v * 3], P[u * 3 + 1] - P[v * 3 + 1], P[u * 3 + 2] - P[v * 3 + 2]);
        if (dd < D[v]) { D[v] = dd; yigin.push(v); yukari(yigin.length - 1); }
      }
    }
    return D;
  }

  /* ---------- hareket geometrisi (modelden bir kez hesaplanır; Node testinde de kullanılır) ---------- */
  function hareketHazirla(PART) {
    var G = {};
    var eac = PART.eac, tm = PART.tm, mal = PART.mal, inc = PART.inc, sta = PART.sta, vest = PART.vest, sm = PART.sm;
    // Timpanik membran: en ince eksen = zarın normali; "içe" = vestibüle doğru.
    var tmE = eksenler(tm.P), tmC = merkez(tm.P), vC = merkez(vest.P);
    var nIc = tmE[2]; if (dot(nIc, sub(vC, tmC)) < 0) nIc = sc(nIc, -1);
    // Umbo: malleusun timpanik membrana en yakın alt ucu = malleusun manubrium yönündeki en uç noktası.
    var malE = eksenler(mal.P), man = malE[0];
    var umbo = vtx(mal.P, enYakin(mal.P, tmC));
    if (dot(man, sub(merkez(mal.P), umbo)) < 0) man = sc(man, -1);   // man: umbodan malleus başına doğru
    // Dönme ekseni malleus–inkus ekleminden geçer, manubriuma ve zarın normaline diktir (ön-arka yönde).
    var mi = enYakinCift(mal.P, inc.P), pivot = sc(add(mi[0], mi[1]), 0.5);
    var eksen = nrm(cross(man, nIc));
    // İşaret: açı artınca umbo içeri gitsin.
    if (dot(cross(eksen, sub(umbo, pivot)), nIc) < 0) eksen = sc(eksen, -1);
    // Stapes: inkusla eklem noktası ve tabanın vestibüle değdiği nokta; piston yönü ikisinin arası (içe doğru).
    var is = enYakinCift(inc.P, sta.P), lent = sc(add(is[0], is[1]), 0.5);
    var sv = enYakinCift(sta.P, vest.P), taban = sc(add(sv[0], sv[1]), 0.5);
    var piston = nrm(sub(taban, lent));
    // Açı 1 radyan iken inkus ucunun piston yönündeki yer değiştirmesi (stapes bunu izler).
    var stapesOran = dot(cross(eksen, sub(lent, pivot)), piston);
    // Zar: her köşenin ağırlığı (kenarda 0, umboda 1). Zar düzleminde umbo çevresinde açı dilimlerine göre kenar uzaklığı.
    var u1 = tmE[0], u2 = tmE[1], DIL = 48, rmax = new Float32Array(DIL), n = tm.P.length / 3, i, polar = new Float32Array(n * 2);
    for (i = 0; i < n; i++) {
      var d = sub(vtx(tm.P, i), umbo), x = dot(d, u1), y = dot(d, u2), r = Math.hypot(x, y), a = Math.atan2(y, x);
      var b = Math.min(DIL - 1, Math.floor((a + Math.PI) / (2 * Math.PI) * DIL));
      polar[i * 2] = r; polar[i * 2 + 1] = b; if (r > rmax[b]) rmax[b] = r;
    }
    var tmW = new Float32Array(n);
    for (i = 0; i < n; i++) { var q = Math.min(1, polar[i * 2] / (rmax[polar[i * 2 + 1]] || 1)); tmW[i] = Math.max(0, 1 - q * q); }
    // Umbonun 1 radyandaki yer değiştirmesi: zar bunu ağırlığıyla izler.
    var umboYer = cross(eksen, sub(umbo, pivot));
    // Dış kulak yolu: dış uçtan (0) zara (1) doğru konum.
    var eE = eksenler(eac.P)[0]; if (dot(eE, sub(tmC, merkez(eac.P))) < 0) eE = sc(eE, -1);
    var mn = 1e9, mx = -1e9, ne = eac.P.length / 3, eacS = new Float32Array(ne);
    for (i = 0; i < ne; i++) { var t = dot(vtx(eac.P, i), eE); eacS[i] = t; if (t < mn) mn = t; if (t > mx) mx = t; }
    for (i = 0; i < ne; i++) eacS[i] = (eacS[i] - mn) / ((mx - mn) || 1);
    // Skala media: oval pencereye en yakın köşeden (bazal uç) ağ üzerinde uzaklık → 0 (baz) … 1 (apeks).
    var smD = agUzaklik(sm.P, sm.I, enYakin(sm.P, taban)), smS = new Float32Array(smD.length), enCok = 0;
    for (i = 0; i < smD.length; i++) if (isFinite(smD[i]) && smD[i] > enCok) enCok = smD[i];
    for (i = 0; i < smD.length; i++) smS[i] = isFinite(smD[i]) ? smD[i] / (enCok || 1) : 0;
    // Kulak kepçesi: kanal girişine uzaklık, kanaldakiyle aynı ölçekte ve eksi işaretli (dalga kepçeden kanala kesintisiz akar).
    var eacBoy = (mx - mn) || 1, gs = [0, 0, 0], gn = 0, kepS = {};
    for (i = 0; i < ne; i++) if (eacS[i] < 0.04) { gs[0] += eac.P[i * 3]; gs[1] += eac.P[i * 3 + 1]; gs[2] += eac.P[i * 3 + 2]; gn++; }
    var giris = sc(gs, 1 / (gn || 1));
    Object.keys(PART).forEach(function (id) {
      if (!/^p_/.test(id)) return;
      var P = PART[id].P, m = P.length / 3, a = new Float32Array(m);
      for (var j = 0; j < m; j++) a[j] = -Math.hypot(P[j * 3] - giris[0], P[j * 3 + 1] - giris[1], P[j * 3 + 2] - giris[2]) / eacBoy;
      kepS[id] = a;
    });
    // Oval pencere: vestibülün stapes tabanına yakın köşeleri (tabanda 1, ~2 mm ötede 0) parlar.
    var nv = vest.P.length / 3, vestW = new Float32Array(nv);
    for (i = 0; i < nv; i++) { var dv = Math.hypot(vest.P[i * 3] - taban[0], vest.P[i * 3 + 1] - taban[1], vest.P[i * 3 + 2] - taban[2]); vestW[i] = Math.pow(Math.max(0, 1 - dv / 2.8), 1.2); }
    // VIII. sinir: kokleaya yakın uçtan (0) beyin sapına doğru (1) konum; elektriksel sinyal bu yönde akar.
    var n8S = null;
    if (PART.n8) {
      var n8 = PART.n8, nE = eksenler(n8.P)[0]; if (dot(nE, sub(merkez(n8.P), merkez(sm.P))) < 0) nE = sc(nE, -1);
      var n8n = n8.P.length / 3, a0 = 1e9, a1 = -1e9; n8S = new Float32Array(n8n);
      for (i = 0; i < n8n; i++) { var tt = dot(vtx(n8.P, i), nE); n8S[i] = tt; if (tt < a0) a0 = tt; if (tt > a1) a1 = tt; }
      for (i = 0; i < n8n; i++) n8S[i] = (n8S[i] - a0) / ((a1 - a0) || 1);
    }
    G.nIc = nIc; G.umbo = umbo; G.pivot = pivot; G.eksen = eksen; G.piston = piston; G.stapesOran = stapesOran;
    G.umboYer = umboYer; G.tmW = tmW; G.eacS = eacS; G.smS = smS; G.smUzunluk = enCok; G.lent = lent; G.taban = taban;
    G.kepS = kepS; G.giris = giris; G.vestW = vestW; G.n8S = n8S;
    return G;
  }
  // Rodrigues: eksen etrafında dönme matrisi (satır düzeninde 3x3).
  function donme(e, a) {
    var c = Math.cos(a), s = Math.sin(a), t = 1 - c, x = e[0], y = e[1], z = e[2];
    return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c];
  }
  // Greenwood (1990), insan: F = 165,4 (10^(2,1 x) − 0,88); x apeksten uzaklık oranı. Burada bazalden oran döner.
  function greenwoodBazalden(f) { var x = Math.log(f / 165.4 + 0.88) / Math.LN10 / 2.1; return Math.max(0, Math.min(1, 1 - x)); }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { hareketHazirla: hareketHazirla, greenwoodBazalden: greenwoodBazalden, donme: donme }; return; }

  /* ---------- çizim ---------- */
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function renkCoz(s) {
    s = (s || '').trim();
    var m = /^#([0-9a-f]{6})$/i.exec(s);
    if (m) { var n = parseInt(m[1], 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
    m = /^#([0-9a-f]{3})$/i.exec(s);
    if (m) return [parseInt(m[1][0], 16) / 15, parseInt(m[1][1], 16) / 15, parseInt(m[1][2], 16) / 15];
    m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(s);
    if (m) return [m[1] / 255, m[2] / 255, m[3] / 255];
    return null;
  }

  // tur: 0 durağan, 1 katı hareket (mdl; zarFaz kadar renk), 2 zar (s*disp), 3 yürüyen dalga (skala media),
  //      4 hava dalgası (kepçe + dış kulak yolu), 5 oval pencere parıltısı (vestibül), 6 elektriksel sinyal (VIII. sinir),
  //      7 kupula (ampulla; zarFaz > 0 kristaller ampulladan uzaklaşıyor, < 0 yaklaşıyor)
  var VS = 'attribute vec3 p;attribute vec3 n;attribute float s;uniform mat4 mvp;uniform mat3 rot;uniform mat4 mdl;uniform mat3 mdlN;uniform vec3 disp;' +
    'uniform float tur;uniform float zaman;uniform float zarFaz;uniform float tepe;uniform float sik;varying vec3 vn;varying float parla;varying float elek;varying float opak;' +
    'void main(){vec3 q=p;vec3 m=n;parla=0.0;elek=0.0;opak=0.0;' +
    'if(tur>0.5&&tur<1.5){q=(mdl*vec4(p,1.0)).xyz;m=mdlN*n;parla=zarFaz;}' +
    'else if(tur>1.5&&tur<2.5){q=p+s*disp;parla=s*zarFaz*0.8;}' +
    'else if(tur>2.5&&tur<3.5){float g=s<tepe?exp(-pow((s-tepe)/max(0.18,tepe*0.55),2.0)):exp(-pow((s-tepe)/0.05,2.0));' +
    'float faz=6.2832*(zaman-5.0*sqrt(s/max(tepe,0.02)));float y=g*sin(faz);parla=y;q=p+n*y*0.09;}' +
    'else if(tur>3.5&&tur<4.5){float f=fract(s*sik-zaman);parla=smoothstep(0.7,1.0,f)*0.85;}' +
    'else if(tur>4.5&&tur<5.5){parla=s*(0.45+0.55*zarFaz);opak=s*2.0;}' +
    'else if(tur>6.5){parla=s*zarFaz;opak=s*abs(zarFaz)*2.0;}' +
    'else if(tur>5.5){float f=fract(s*3.0-zaman*1.6);elek=smoothstep(0.78,0.97,f)*(1.0-smoothstep(0.97,1.0,f));}' +
    'vn=rot*m;gl_Position=mvp*vec4(q,1.0);}';
  var FS = 'precision mediump float;varying vec3 vn;varying float parla;varying float elek;varying float opak;uniform vec4 col;uniform float duz;uniform vec3 tepeRenk;uniform vec3 cukurRenk;uniform vec3 elekRenk;' +
    'void main(){vec3 N=normalize(vn);if(!gl_FrontFacing)N=-N;vec3 L=normalize(vec3(0.45,0.6,0.66));float d=max(dot(N,L),0.0);float f=max(dot(N,normalize(vec3(-0.7,-0.25,0.4))),0.0);' +
    'float rim=pow(1.0-max(N.z,0.0),3.0);float s=pow(max(dot(reflect(-L,N),vec3(0.0,0.0,1.0)),0.0),28.0);' +
    'vec3 b=col.rgb;b=mix(b,tepeRenk,clamp(parla,0.0,1.0));b=mix(b,cukurRenk,clamp(-parla,0.0,1.0));b=mix(b,elekRenk,clamp(elek,0.0,1.0));' +
    'vec3 c=b*(0.34+0.62*d+0.22*f)-b*rim*0.18+vec3(s*0.2);c=mix(c,b*(0.75+0.25*d),duz);gl_FragColor=vec4(c,max(col.a,clamp(opak,0.0,1.0)));}';

  function kur(kok, ayar) {
    ayar = ayar || {};
    var veri = ayar.veri || window.SESLAB_VERI, M = veri.metinler, YAPI = ayar.yapilar || {}, yol = ayar.veriYolu || 'gorsel3d/';
    var SAH = veri.sahneler, durdu = false, hazir = false, dinleyiciler = [];
    var DEN = veri.denge || null, DS = window.SesLabDenge || null, DSAH = DEN && DS ? DEN.sahneler : [];
    function dinle(hedef, olay, fn, sec) { hedef.addEventListener(olay, fn, sec); dinleyiciler.push([hedef, olay, fn, sec]); }

    /* ---- sayfa yapısı ---- */
    kok.classList.add('g3d', 'sl');
    kok.textContent = '';
    var sahne = h('div', 'g3d-sahne'), cv = h('canvas');
    cv.setAttribute('aria-label', M.canvasEtiketi);
    var neresi = h('div', 'g3d-etiket g3d-sagust'), olcek = h('div', 'g3d-etiket g3d-solalt'), cubuk = h('span', 'g3d-cubuk'), olcekYazi = h('span', null, M.olcek);
    olcek.appendChild(cubuk); olcek.appendChild(olcekYazi); olcek.hidden = true;
    var durum = h('p', 'g3d-durum', M.indiriliyor); durum.setAttribute('role', 'status');
    // Sağ alt köşe (2026-11-20, proje sahibinin isteği): yalnızca simgeli yuvarlak düğmeler; yazı ipucunda (fareyle üzerine gelince / uzun basınca).
    var IP = window.SesLabIpucu, sagAlt = h('div', 'sl-sag-alt');
    var oynatBtn = h('button', 'sl-yuv sl-oynat'); oynatBtn.type = 'button';
    // Denge kipi: "Yer" çizgisi ve uzak/yakın görünüm düğmesi
    var yerEt = h('div', 'sl-yer'), yakinBtn = h('button', 'g3d-geri sl-yakin'); yerEt.hidden = true; yakinBtn.hidden = true; yakinBtn.type = 'button';
    var donBox = h('div', 'sl-don'), donSol = h('button', 'sl-don-tus', '↺'), donSag = h('button', 'sl-don-tus', '↻'), basaBtn = h('button', 'sl-don-tus sl-basa');
    [donSol, donSag, basaBtn].forEach(function (b) { b.type = 'button'; donBox.appendChild(b); }); donBox.hidden = true;
    // İşitme: genel görünüm (Ses yolculuğu) düğmesi; simgesi çevresel işitme sisteminin sadeleştirilmiş çizimi.
    // Ses yolculuğu dışındaki her sahnede görünür (frekans çubuğuyla Koklea'ya otomatik geçince de).
    var donusBtn = h('button', 'sl-yuv sl-sahne-don'); donusBtn.type = 'button'; donusBtn.hidden = true;
    if (IP) IP.simge(donusBtn, 'genel');
    sagAlt.appendChild(donusBtn); sagAlt.appendChild(oynatBtn);
    sahne.appendChild(cv); sahne.appendChild(yerEt); sahne.appendChild(yakinBtn); sahne.appendChild(donBox); sahne.appendChild(neresi); sahne.appendChild(olcek); sahne.appendChild(sagAlt); sahne.appendChild(durum);
    var oynatIp = IP ? IP.bagla(oynatBtn, function () { return oynuyor ? M.duraklat : M.oynat; }) : null;
    var donusIp = IP ? IP.bagla(donusBtn, function () { return M.genelGorunum || 'Genel görünüme geç'; }) : null;
    var uyari = h('p', 'g3d-not g3d-ipucu sl-uyari');
    var kart = h('div', 'g3d-kart'), nmEl = h('h4'), dsEl = h('p'), frEl = h('p', 'sl-frekans-not'), yuva = h('div', 'g3d-kart-ek');
    kart.setAttribute('aria-live', 'polite');
    kart.appendChild(nmEl); kart.appendChild(dsEl); kart.appendChild(frEl); kart.appendChild(yuva);
    // Enerji dönüşümü şeridi: akustik → mekanik → hidrolik → elektriksel; seçili sahnenin aşamaları vurgulanır.
    var enerjiKutu = h('div', 'sl-enerji'), bEn = h('h3', 'g3d-baslik'), enerjiListe = h('ol', 'sl-enerji-liste'), enerjiNot = h('p', 'g3d-not'), enerjiEl = [];
    for (var ei = 0; ei < 4; ei++) { var li = h('li', 'sl-asama sl-asama-' + (ei + 1)), ad = h('strong'), alt = h('span'); li.appendChild(ad); li.appendChild(alt); enerjiListe.appendChild(li); enerjiEl.push(li); }
    enerjiKutu.appendChild(bEn); enerjiKutu.appendChild(enerjiListe); enerjiKutu.appendChild(enerjiNot);
    var sahBox = h('div', 'g3d-satir g3d-bolumler'), frBox = h('div', 'sl-frcizgi');
    // Frekans (2026-11-20): tuşlar yerine sağa sola çekilen sayı doğrusu; standart frekanslara oturur
    var frKaydir = h('input', 'sl-frkaydir'), frOlcek = h('div', 'sl-frolcek'), frDeger = h('span', 'sl-frdeger');
    frKaydir.type = 'range'; frKaydir.min = '0'; frKaydir.step = '1'; frBox.appendChild(frKaydir); frBox.appendChild(frOlcek);
    var sesSatir = h('div', 'sl-ses'), sesBtn = h('button', 'sl-ses-dugme'), sesNot = h('p', 'g3d-not');
    sesBtn.type = 'button'; sesBtn.setAttribute('aria-pressed', 'false');
    sesSatir.appendChild(sesBtn); sesSatir.appendChild(sesNot);
    var viewBox = h('div', 'g3d-satir g3d-gorunumler');
    // İşitme | Denge geçişi ve denge adımları
    var modBox = h('div', 'g3d-satir sl-mod'), modIs = h('button', null), modDe = h('button', null);
    modIs.type = 'button'; modDe.type = 'button'; modBox.appendChild(modIs); modBox.appendChild(modDe); modBox.hidden = true;   // kip artık sayfanın seçim ekranından seçilir
    var bAdim = h('h3', 'g3d-baslik'), adimBox = h('div', 'g3d-satir sl-adimlar'), adimBtns = [];
    // Tek tıkla izleme: adımları sırayla, her birinin sonunda kısa bekleyerek oynatır
    var tumBtn = h('button', 'sl-tum'); tumBtn.type = 'button'; tumBtn.setAttribute('aria-pressed', 'false');
    // Denge kipi (2026-11-20): sahne tuşları ve adım tuşları animasyonun hemen altında, küçük (simge + kısa yazı)
    var dengeBar = h('div', 'sl-denge-bar'), adimSatir = h('div', 'sl-adim-satir'); dengeBar.hidden = true;
    adimSatir.appendChild(tumBtn); adimSatir.appendChild(adimBox); dengeBar.appendChild(adimSatir);
    var bSah = h('h3', 'g3d-baslik'), bFr = h('h3', 'g3d-baslik'), bGor = h('h3', 'g3d-baslik');
    // İşitme kipinde frekans sayı doğrusu ve "Sesi çal" animasyonun hemen altında (2026-11-20)
    var frUst = h('div', 'sl-frust'); frUst.appendChild(bFr); frUst.appendChild(frBox); frUst.appendChild(sesSatir);
    var notEl = h('p', 'g3d-not'), kaynakEl = h('p', 'g3d-not sl-kaynak'), metinYuva = h('div', 'g3d-kart-ek');
    [modBox, sahne, dengeBar, frUst, uyari, kart, enerjiKutu, bSah, sahBox, bGor, viewBox, notEl, metinYuva, kaynakEl].forEach(function (e) { kok.appendChild(e); });

    function metinler() {
      uyari.textContent = mod === 'denge' ? (M.dengeUyari || M.uyari) : M.uyari; notEl.textContent = M.not;
      modIs.textContent = M.modIsitme || 'İşitme'; modDe.textContent = M.modDenge || 'Denge'; bAdim.textContent = M.adimBasligi || '';
      yerEt.textContent = M.yerEtiketi || '';
      donSol.setAttribute('aria-label', M.donSol || 'Başı sola döndür'); donSag.setAttribute('aria-label', M.donSag || 'Başı sağa döndür');
      donSol.title = donSol.getAttribute('aria-label'); donSag.title = donSag.getAttribute('aria-label');
      basaBtn.textContent = M.basaDon || 'Başa dön'; basaBtn.title = M.basaDonUzun || 'Görünümü başlangıç hâline döndür';
      bSah.textContent = M.sahneBasligi; bFr.textContent = M.frekansBasligi + ': '; bFr.appendChild(frDeger); frKaydir.setAttribute('aria-label', M.frekansBasligi); bGor.textContent = M.gorunumBasligi;
      sesNot.textContent = M.sesNot;
      bEn.textContent = M.enerjiBaslik || ''; enerjiNot.textContent = M.enerjiNot || '';
      enerjiEl.forEach(function (li, k) { li.firstChild.textContent = M['enerji' + (k + 1) + 'Ad'] || ''; li.lastChild.textContent = M['enerji' + (k + 1) + 'Alt'] || ''; });
      kaynakEl.textContent = '';
      kaynakEl.appendChild(document.createTextNode(M.kaynakOnsoz + ' '));
      M.kaynaklar.forEach(function (k) {   // her kaynak kendi satırında (dokunma hedefi 44 px)
        var a = h('a', null, k.metin);
        if (/^https:\/\//.test(k.adres)) { a.href = k.adres; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        kaynakEl.appendChild(a);
      });
      metinYuva.textContent = '';
      if (typeof ayar.kartEki === 'function') ayar.kartEki('metin', 'metinler', metinYuva);
    }
    metinler();

    function hata(metin, yeniden) {
      durum.textContent = metin; durum.hidden = false;
      if (yeniden) { var b = h('button', null, M.yenidenDene); b.type = 'button'; b.addEventListener('click', function () { durum.textContent = M.indiriliyor; indir(); }); durum.appendChild(b); }
    }

    var gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
    if (!gl) { hata(M.webglYok); return { yenile: function () {}, durdur: function () {}, kaldir: function () { kok.textContent = ''; } }; }

    /* ---- durum ---- */
    var PART = {}, ORDER = [], RENK = {}, SILIK = [0.62, 0.68, 0.70], TEPE = [0.9, 0.2, 0.45], CUKUR = [0.1, 0.2, 0.5], ELEK = [0.5, 0.2, 0.9], TEN = [0.87, 0.69, 0.58];
    var GORUNEN = ['pinna', 'eac', 'tm', 'mal', 'inc', 'sta', 'sv', 'sm', 'st', 'vest', 'ant', 'post', 'lat', 'crus', 'amp', 'n8', 'utrikulus', 'sakkulus', 'kristal', 'bas'];
    // Yalnızca kendi sahnelerinde çizilenler (diğer sahnelerde silik bile görünmez)
    var KENDI = ['pinna', 'utrikulus', 'sakkulus', 'kristal', 'bas'];
    // Kulak kepçesi modelde 11 parça (p_helix …); makulalar 3'er parça (epitel, tüy, otolit zarı). Her biri tek yapı gibi davranır.
    function grup(id) { return /^p_/.test(id) ? 'pinna' : /^utr_/.test(id) ? 'utrikulus' : /^sak_/.test(id) ? 'sakkulus' : /^bas_/.test(id) ? 'bas' : id; }
    var MAKRENK = { ep: [0.85, 0.55, 0.62], tuy: [0.55, 0.45, 0.75], zar: [0.93, 0.93, 0.9] }, KRISTAL = [0.95, 0.95, 0.92];
    // Denge kipi durumu
    var mod = 'isitme', dsah = DSAH[0] || null, adimI = 0, Y = null, KR = [], MAK = null, kupula = 0, kupGor = 0;
    var KAM = [0, 0, 1, 0, 1, 0, -1, 0, 0];   // hastanın sağından bakış: ekranın sağı = hastanın önü, yukarısı = yukarı
    var kul = [1, 0, 0, 0, 1, 0, 0, 0, 1], pozQ = [1, 0, 0, 0], basQ = [1, 0, 0, 0], hedefQ = [1, 0, 0, 0], gecisT = 1, ivme = [0, 0, 0], basIvme = [0, 0, 0], hedefIvme = [0, 0, 0];
    var KAYMA = 0.35, GECIS_SN = 2.4;
    // Adım akışı (saniye): 0–UZAK_SN kamera başı gösterecek kadar uzaklaşır, sonra baş döner, sonra yakınlaşır.
    var BEKLE_SN = { bppv: 4.5, makula: 3 }, oto = null;   // tek tıkla izlemede her adımın sonunda bekleme
    var DON_ADIM = Math.PI / 6, donKalan = 0;   // başı döndürme tuşları: her basışta 30°
    var UZAK_SN = 0.9, akis = null, uzak = false, zarBas = null, zarHedef = null, zarT = 99;   // otolit zarı kayması (mm / g, büyütülmüş); pozlar arası geçiş süresi
    var sah = SAH[0], sel = null, dirty = true, G = null;
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), auto = false;
    var oynuyor = !reduce, zaman = 0, sonT = 0, frekans = veri.frekanslar.indexOf(1000) >= 0 ? 1000 : veri.frekanslar[0];
    var HIZ = 0.55, ACI = 0.14;   // görsel titreşim: saniyede 0,55 tur; kemikçik dönmesi en çok ~8 derece (çok büyütülmüş)
    // İnkus malleusu biraz geriden ve biraz az izler (eklemde küçük göreli hareket; görünsün diye büyütüldü).
    var INKUS_GECIKME = 0.6, INKUS_ORAN = 0.88;
    var FOV = 34 * Math.PI / 180, TAN = Math.tan(FOV / 2);
    var VIEWS = { lat: mul(rx(0.2), ry(-0.45)), med: mul(rx(0.2), ry(Math.PI - 0.45)), ust: mul(rx(Math.PI / 2 - 0.2), ry(0)), on: mul(rx(0.15), ry(-Math.PI / 2)), arka: mul(rx(0.15), ry(Math.PI / 2)) };
    var R = VIEWS.on.slice(), cen = [0, 0, 0], rad = 20, tcen = [0, 0, 0], trad = 20, zoom = 1, lastD = 60;
    var aP, aN, aS, U = {}, sahBtns = [], frBtns = [];
    var BIRIM = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]), BIRIM3 = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

    function renkleriOku() {
      var cs = window.getComputedStyle(kok);
      MAKRENK.ep = renkCoz(cs.getPropertyValue('--sl-makula')) || MAKRENK.ep;
      MAKRENK.tuy = renkCoz(cs.getPropertyValue('--sl-tuy')) || MAKRENK.tuy;
      MAKRENK.zar = renkCoz(cs.getPropertyValue('--sl-otolit')) || MAKRENK.zar;
      KRISTAL = renkCoz(cs.getPropertyValue('--sl-kristal')) || KRISTAL;
      TEN = renkCoz(cs.getPropertyValue('--g3d-kepce')) || TEN;
      ORDER.forEach(function (id) {
        var m = /^(utr|sak)_(ep|tuy|zar)$/.exec(id);
        RENK[id] = grup(id) === 'pinna' || id === 'bas_deri' || id === 'bas_boyun' || id === 'bas_burun' ? TEN : id === 'bas_kulak' ? TEPE : id === 'bas_yuz' ? [0.25, 0.3, 0.35] : m ? MAKRENK[m[2]] : id === 'kristal' ? KRISTAL : (renkCoz(cs.getPropertyValue('--g3d-' + id)) || SILIK);
      });
      ELEK = renkCoz(cs.getPropertyValue('--sl-elektrik')) || ELEK;
      SILIK = renkCoz(cs.getPropertyValue('--g3d-silik')) || SILIK;
      TEPE = renkCoz(cs.getPropertyValue('--sl-tepe')) || TEPE;
      CUKUR = renkCoz(cs.getPropertyValue('--sl-cukur')) || CUKUR;
      if (RENK.bas_kulak) RENK.bas_kulak = TEPE;
    }
    function frame(ids) {
      var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      var acik = []; ids.forEach(function (id) { if (PART[id]) acik.push(id); else ORDER.forEach(function (o) { if (grup(o) === id) acik.push(o); }); });
      acik.forEach(function (id) { var p = PART[id]; if (!p) return; for (var a = 0; a < 3; a++) { if (p.mn[a] < mn[a]) mn[a] = p.mn[a]; if (p.mx[a] > mx[a]) mx[a] = p.mx[a]; } });
      tcen = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
      trad = Math.max(2.5, Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2);
      zoom = 1; if (reduce) { cen = tcen.slice(); rad = trad; } dirty = true;
    }
    function style(pid) {
      var id = grup(pid);
      if (GORUNEN.indexOf(id) < 0) return null;
      var c = RENK[pid], on = sah.yapilar.indexOf(id) >= 0, yari = sah.yari && sah.yari.indexOf(id) >= 0;
      if ((KENDI.indexOf(id) >= 0 || mod === 'denge') && !on && !yari) return null;   // kepçe/makulalar yalnızca kendi sahnesinde; denge kipinde yalnızca sahnedekiler
      if (id === 'bas') return on && uzak ? { c: c, a: pid === 'bas_deri' || pid === 'bas_boyun' ? 0.1 : pid === 'bas_kulak' ? 0.16 : pid === 'bas_burun' ? 0.3 : 0.5, duz: 0.6 } : null;   // silik baş
      if (sel && sel !== id) return { c: SILIK, a: on ? 0.22 : 0.08, duz: 1 };
      if (sel === id) return { c: c, a: 1, duz: 0 };
      if (yari && mod === 'denge') {
        if (dsah && dsah.tip === 'makula' && !uzak) return { c: c, a: 0.08, duz: 0.6 };   // makulaya yakınken çevre yapılar ekranı kaplamasın
        // 2026-11-20: kanallar silikleşiyordu (proje sahibi). Opaklık artırıldı; ayrıca silik baş artık kanallardan önce çizilir (bkz. cizimSirasi).
        // Kristaller ve makulalar 3. geçişte en üstte çizildiği için kanal opak olsa da görünür kalır.
        if (id === 'post' && dsah && dsah.tip === 'bppv') return { c: c, a: 0.82, duz: 0.15 };
        if (KANAL.indexOf(id) >= 0) return { c: c, a: 0.85, duz: 0.2 };
        return { c: c, a: 0.18, duz: 0.4 };
      }
      if (yari) return { c: c, a: 0.28, duz: 0.4 };
      if (!on) return { c: SILIK, a: 0.12, duz: 1 };
      return { c: c, a: 1, duz: 0 };
    }
    function size() {
      if (!cv.clientWidth) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(1, Math.round(cv.clientWidth * dpr)), hh = Math.max(1, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
      gl.viewport(0, 0, w, hh); dirty = true;
    }
    // Animasyonun o anki durumu: açı (kemikçik), stapes kayması, zar yer değiştirmesi.
    // Eksen etrafında, ortak eklem noktası (pivot) çevresinde dönme: mdl = T(pivot) * R * T(-pivot), sütun düzeninde (WebGL).
    function pivotDonme(a) {
      var Rm = donme(G.eksen, a), pv = G.pivot;
      var t = sub(pv, [Rm[0] * pv[0] + Rm[1] * pv[1] + Rm[2] * pv[2], Rm[3] * pv[0] + Rm[4] * pv[1] + Rm[5] * pv[2], Rm[6] * pv[0] + Rm[7] * pv[1] + Rm[8] * pv[2]]);
      return { m: new Float32Array([Rm[0], Rm[3], Rm[6], 0, Rm[1], Rm[4], Rm[7], 0, Rm[2], Rm[5], Rm[8], 0, t[0], t[1], t[2], 1]),
        n: new Float32Array([Rm[0], Rm[3], Rm[6], Rm[1], Rm[4], Rm[7], Rm[2], Rm[5], Rm[8]]) };
    }
    // Animasyonun o anki durumu: malleus ve inkus açıları, stapes kayması, zar yer değiştirmesi.
    // İkisi de malleus–inkus eklemi çevresinde döndüğü için eklemde ayrılma olmaz; inkus biraz geriden gelir.
    function hareket() {
      var faz = 2 * Math.PI * zaman, fM = Math.sin(faz), fI = Math.sin(faz - INKUS_GECIKME);
      var aM = ACI * fM, aI = ACI * INKUS_ORAN * fI, M1 = pivotDonme(aM), I1 = pivotDonme(aI);
      var kay = sc(G.piston, Math.sin(aI) * G.stapesOran);
      var mdlS = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, kay[0], kay[1], kay[2], 1]);
      return { mdlM: M1.m, nM: M1.n, mdlI: I1.m, nI: I1.n, mdlS: mdlS, zar: sc(G.umboYer, Math.sin(aM)), fM: fM, fI: fI };
    }
    var KRISTAL_SAYI = 12, BIRIM_3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    var ODAK = /^(kristal|utr_|sak_)/;   // denge kipinde en üstte çizilenler
    // Yarı saydam geçişte çizim sırası: önce silik baş, sonra diğer yapılar, en son kanallar. Derinlik yazılmadığı için sonra çizilen
    // üstte kalır; baş en sona kalınca ten rengi yüzeyi kanalların üstüne binip onları soluklaştırıyordu (2026-11-20 düzeltmesi).
    function cizimSirasi() {
      var bas = [], orta = [], kanal = [];
      ORDER.forEach(function (id) { (grup(id) === 'bas' ? bas : KANAL.indexOf(id) >= 0 ? kanal : orta).push(id); });
      return bas.concat(orta, kanal);
    }
    var KANAL = ['ant', 'post', 'lat', 'crus', 'amp'];
    // Utrikulusa dönen kristaller orada küçük bir küme olarak durur
    function makulaKaymasi(q, iv) {
      var fM = DS.kuvvetModelde(DS.q2mat(q), iv);
      return { utr: DS.makulaKayma(MAK.utr, fM, KAYMA), sak: DS.makulaKayma(MAK.sak, fM, KAYMA) };
    }
    // Otolit zarı: önceki kaymadan yenisine sönümlü yay gibi (kristallerin ağırlığı ve eylemsizliği; zaman büyütülmüş)
    function makulaDurumu() {
      if (!zarHedef) zarHedef = makulaKaymasi(pozQ, ivme);
      if (!zarBas) zarBas = zarHedef;
      var e = zarT > 6 ? 1 : 1 - Math.exp(-3.2 * zarT) * Math.cos(6.5 * zarT), o = {};
      ['utr', 'sak'].forEach(function (k) { var a = zarBas[k], b = zarHedef[k]; o[k] = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e]; });
      return o;
    }
    function uzakYakin(u) {
      uzak = u; yakinBtn.textContent = u ? (M.yakinlastir || 'Yakınlaştır') : (M.basiGoster || 'Başı göster');
      if (dsah) frame(u ? ['bas_deri'] : (dsah.cerceve || dsah.yapilar));
    }
    yakinBtn.addEventListener('click', function () { akis = null; if (oto) otoDurdur(); uzakYakin(!uzak); });
    function kristalCiz(st) {
      var p = PART.kristal; if (!p || !Y) return;
      gl.uniform1f(U.tur, 1); gl.uniform1f(U.zarFaz, 0);
      gl.uniform4f(U.col, st.c[0], st.c[1], st.c[2], st.a); gl.uniform1f(U.duz, st.duz);
      gl.bindBuffer(gl.ARRAY_BUFFER, p.pb); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, p.nb); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
      gl.disableVertexAttribArray(aS); gl.vertexAttrib1f(aS, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.ib);
      KR.forEach(function (k, i) {
        var q, Rk = mul(rx(k.don[0]), ry(k.don[1]));
        if (k.cikti) q = add(Y.utrikulus, DS.cikisYeri(i));
        else {
          // Kanal kesitinde yan konum (düzlem normali ve onunla yola dik yön) + kayarken yuvarlanma
          var y = DS.yolNokta(Y, k.u), yan = nrm(cross(y.t, Y.n));
          q = add(y.p, add(sc(Y.n, Math.cos(k.a) * k.d), sc(yan, Math.sin(k.a) * k.d)));
          Rk = mul(donme(yan, -k.u / (0.3 * k.b)), Rk);
        }
        var b = k.b;
        gl.uniformMatrix4fv(U.mdl, false, new Float32Array([Rk[0] * b, Rk[3] * b, Rk[6] * b, 0, Rk[1] * b, Rk[4] * b, Rk[7] * b, 0, Rk[2] * b, Rk[5] * b, Rk[8] * b, 0, q[0], q[1], q[2], 1]));
        gl.uniformMatrix3fv(U.mdlN, false, new Float32Array([Rk[0], Rk[3], Rk[6], Rk[1], Rk[4], Rk[7], Rk[2], Rk[5], Rk[8]]));
        gl.drawElements(gl.TRIANGLES, p.n, gl.UNSIGNED_SHORT, 0);
      });
    }
    function fizik(dt) {
      if (!Y || !KR.length) return;
      var g = DS.kuvvetModelde(dengeW(), null), n = Math.max(1, Math.ceil(dt / 0.02)), k = 0;
      for (var i = 0; i < n; i++) k = DS.adim(Y, KR, g, dt / n);
      kupula = k;
    }
    function dinlen() { for (var i = 0; i < 500; i++) fizik(0.02); kupula = 0; kupGor = 0; }
    // Denge kipinde görünüm: kullanıcı döndürmesi · kamera (sağdan) · baş pozisyonu (modelden dünyaya)
    function dengeW() { return DS.q2mat(pozQ); }
    function draw() {
      if (mod === 'denge' && DS) R = mul(kul, mul(KAM, dengeW()));
      var asp = cv.width / cv.height, f = 1 / TAN, fit = asp < 1 ? 1 / asp : 1;
      var d = rad / Math.sin(FOV / 2) * 0.95 * Math.min(fit, 1.7) * zoom; lastD = d;
      var near = Math.max(0.5, d - rad * 3), far = d + rad * 6;
      var Pm = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0];
      var t = [-(R[0] * cen[0] + R[1] * cen[1] + R[2] * cen[2]), -(R[3] * cen[0] + R[4] * cen[1] + R[5] * cen[2]), -(R[6] * cen[0] + R[7] * cen[1] + R[8] * cen[2]) - d];
      var Mm = [R[0], R[3], R[6], 0, R[1], R[4], R[7], 0, R[2], R[5], R[8], 0, t[0], t[1], t[2], 1];
      var o = new Float32Array(16), r, c, k, s;
      for (c = 0; c < 4; c++) for (r = 0; r < 4; r++) { s = 0; for (k = 0; k < 4; k++) s += Pm[k * 4 + r] * Mm[c * 4 + k]; o[c * 4 + r] = s; }
      gl.uniformMatrix4fv(U.mvp, false, o);
      gl.uniformMatrix3fv(U.rot, false, new Float32Array([R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]));
      gl.uniform1f(U.zaman, zaman); gl.uniform1f(U.tepe, greenwoodBazalden(frekans));
      gl.uniform1f(U.sik, 1.2 + 1.3 * Math.log(frekans / 125) / Math.LN2 * 0.5);
      gl.uniform3f(U.tepeRenk, TEPE[0], TEPE[1], TEPE[2]); gl.uniform3f(U.cukurRenk, CUKUR[0], CUKUR[1], CUKUR[2]); gl.uniform3f(U.elekRenk, ELEK[0], ELEK[1], ELEK[2]);
      var H = hareket(), DM = mod === 'denge' && MAK ? makulaDurumu() : null;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      var pass, id, st, p, tur;
      // Geçiş 0: opak, 1: yarı saydam, 2 (yalnızca denge): odak parçaları (kristaller, makulalar) en üstte, soluklaşmasın diye.
      var SIRA = cizimSirasi();
      for (pass = 0; pass < 3; pass++) {
        if (pass === 1) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); }
        if (pass === 2) { if (mod !== 'denge') break; gl.disable(gl.BLEND); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT); }
        for (k = 0; k < SIRA.length; k++) {
          id = SIRA[k]; st = style(id); if (!st) continue;
          var odak = mod === 'denge' && ODAK.test(id);
          if (pass === 2 ? !odak : (odak || (st.a < 1) !== (pass === 1))) continue;
          p = PART[id];
          var mdl = BIRIM, mdlN = BIRIM3, fz = 0;
          tur = id === 'mal' || id === 'inc' || id === 'sta' ? 1 : id === 'tm' ? 2 : id === 'sm' ? 3 : (id === 'eac' || grup(id) === 'pinna') ? 4 : id === 'vest' ? 5 : id === 'n8' ? 6 : 0;
          var disp = H.zar;
          if (mod === 'denge') {
            tur = 0;
            var mk = /^(utr|sak)_(tuy|zar)$/.exec(id);
            if (mk && MAK) { tur = 2; disp = DM[mk[1]]; fz = Math.min(1, Math.hypot(disp[0], disp[1], disp[2]) / KAYMA); }
            else if (id === 'amp' && dsah && dsah.tip === 'bppv') { tur = 7; fz = Math.max(-1, Math.min(1, kupGor / 1.6)); }
            else if (id === 'kristal') { kristalCiz(st); continue; }
          }
          if (id === 'mal') { mdl = H.mdlM; mdlN = H.nM; fz = H.fM * 0.45; }
          else if (id === 'inc') { mdl = H.mdlI; mdlN = H.nI; fz = H.fI * 0.45; }
          else if (id === 'sta') { mdl = H.mdlS; fz = H.fI * 0.45; }
          else if (id === 'tm') fz = H.fM;
          else if (id === 'vest') fz = H.fI;
          gl.uniform1f(U.tur, tur); gl.uniform1f(U.zarFaz, mod === 'denge' && tur === 0 ? 0 : fz);
          gl.uniformMatrix4fv(U.mdl, false, mod === 'denge' ? BIRIM : mdl);
          gl.uniformMatrix3fv(U.mdlN, false, mod === 'denge' ? BIRIM3 : mdlN);
          gl.uniform3f(U.disp, disp[0], disp[1], disp[2]);
          gl.uniform4f(U.col, st.c[0], st.c[1], st.c[2], st.a); gl.uniform1f(U.duz, st.duz);
          gl.bindBuffer(gl.ARRAY_BUFFER, p.pb); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, p.nb); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
          if (p.sb) { gl.enableVertexAttribArray(aS); gl.bindBuffer(gl.ARRAY_BUFFER, p.sb); gl.vertexAttribPointer(aS, 1, gl.FLOAT, false, 0, 0); }
          else { gl.disableVertexAttribArray(aS); gl.vertexAttrib1f(aS, 0); }
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.ib); gl.drawElements(gl.TRIANGLES, p.n, gl.UNSIGNED_SHORT, 0);
        }
      }
      gl.disable(gl.BLEND); gl.depthMask(true);
      var px = 10 * f / d * cv.clientHeight / 2;
      olcek.hidden = mod === 'denge' || !(px > 14 && px < cv.clientWidth * 0.6);
      cubuk.style.width = Math.round(px) + 'px';
    }
    function loop(ts) {
      if (durdu) return;
      var dt = sonT ? Math.min(0.1, (ts - sonT) / 1000) : 0; sonT = ts;
      if (hazir && cv.clientWidth) {
        if (oynuyor && mod !== 'denge') { zaman += dt * HIZ; dirty = true; }
        if (mod === 'denge' && DS) {
          if (akis && oynuyor) {
            akis.t += dt;
            if (akis.t >= UZAK_SN && gecisT === 0 && !akis.basladi) akis.basladi = true;
            if (akis.basladi && gecisT >= 1 && !akis.yakin) { akis.yakin = true; uzakYakin(false); zarBas = makulaDurumu(); zarHedef = makulaKaymasi(hedefQ, hedefIvme); zarT = 0; }
            if (akis.yakin) akis = null;
          }
          if (zarT < 6 && oynuyor) { zarT += dt; dirty = true; }
          if (donKalan) { var dk = Math.sign(donKalan) * Math.min(Math.abs(donKalan), dt * 3.5); kul = mul(ry(dk), kul); donKalan -= dk; if (Math.abs(donKalan) < 1e-4) donKalan = 0; dirty = true; }
          if (oto && oynuyor && !akis && gecisT >= 1) {
            oto.bekle += dt;
            if (oto.bekle >= (BEKLE_SN[dsah.tip] || 3)) { if (adimI < dsah.adimlar.length - 1) { oto.bekle = 0; setAdim(adimI + 1, false, true); } else otoDurdur(); }
          }
          if (gecisT < 1 && oynuyor && (!akis || akis.basladi)) {   // duraklatılınca baş da yerinde durur
            gecisT = Math.min(1, gecisT + dt / GECIS_SN);
            var e = (1 - Math.cos(Math.PI * gecisT)) / 2;
            pozQ = DS.slerp(basQ, hedefQ, e);
            ivme = [basIvme[0] + (hedefIvme[0] - basIvme[0]) * e, basIvme[1] + (hedefIvme[1] - basIvme[1]) * e, basIvme[2] + (hedefIvme[2] - basIvme[2]) * e];
            dirty = true;
          }
          if (oynuyor && dsah && dsah.tip === 'bppv' && (!akis || akis.basladi)) { fizik(dt); dirty = true; }
          var kg = kupGor + (kupula - kupGor) * Math.min(1, dt * 4); if (Math.abs(kg - kupGor) > 1e-4) { kupGor = kg; dirty = true; }
        }
        if (auto) { R = mul(ry(0.004), R); dirty = true; }
        var dc = Math.abs(tcen[0] - cen[0]) + Math.abs(tcen[1] - cen[1]) + Math.abs(tcen[2] - cen[2]) + Math.abs(trad - rad);
        if (dc > 0.01) { for (var a = 0; a < 3; a++) cen[a] += (tcen[a] - cen[a]) * 0.16; rad += (trad - rad) * 0.16; dirty = true; }
        if (dirty) { dirty = false; draw(); }
      }
      window.requestAnimationFrame(loop);
    }

    /* ---- ses (Web Audio; kütüphane yok) ---- */
    var ses = null;
    function sesKapat() {
      if (!ses) return;
      var s = ses; ses = null;
      try { var t = s.ctx.currentTime; s.g.gain.cancelScheduledValues(t); s.g.gain.setValueAtTime(s.g.gain.value, t); s.g.gain.linearRampToValueAtTime(0, t + 0.08); s.o.stop(t + 0.1); } catch (e) {}
      setTimeout(function () { try { s.ctx.close(); } catch (e) {} }, 200);
      sesYaz();
    }
    function sesAc() {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) { sesNot.textContent = M.sesYok; return; }
      try {
        var ctx = new AC(), o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = frekans; g.gain.value = 0;
        o.connect(g); g.connect(ctx.destination); o.start();
        g.gain.linearRampToValueAtTime(veri.sesDuzeyi, ctx.currentTime + 0.08);
        ses = { ctx: ctx, o: o, g: g };
        if (ctx.resume) ctx.resume();
      } catch (e) { ses = null; sesNot.textContent = M.sesYok; }
      sesYaz();
    }
    function sesYaz() { sesBtn.textContent = (ses ? M.sesDurdur : M.sesCal) + ' (' + frekans + ' Hz)'; sesBtn.setAttribute('aria-pressed', ses ? 'true' : 'false'); }
    sesBtn.addEventListener('click', function () { if (ses) sesKapat(); else sesAc(); });

    /* ---- arayüz ---- */
    function oynatYaz() { if (IP) IP.simge(oynatBtn, oynuyor ? 'duraklat' : 'oynat'); else oynatBtn.textContent = oynuyor ? '❚❚' : '▶'; oynatBtn.setAttribute('aria-pressed', oynuyor ? 'true' : 'false'); if (oynatIp) oynatIp.yenile(); }
    oynatBtn.addEventListener('click', function () { oynuyor = !oynuyor; oynatYaz(); dirty = true; });
    function frekansYaz() {
      var y = Math.round(greenwoodBazalden(frekans) * 100), bolge = y < 34 ? M.bolgeBazal : y < 67 ? M.bolgeOrta : M.bolgeApikal;
      frEl.textContent = M.frekansNot.replace('{f}', frekans).replace('{y}', y).replace('{bolge}', bolge);
    }
    function card() {
      var tur, kimlik;
      if (sel && YAPI[sel]) { nmEl.textContent = YAPI[sel].ad; dsEl.textContent = YAPI[sel].aciklama; tur = 'yapi'; kimlik = sel; }
      else { nmEl.textContent = sah.ad; dsEl.textContent = sah.aciklama; tur = 'sahne'; kimlik = sah.id; }
      var ad = mod === 'denge' && dsah ? dsah.adimlar[adimI] : null;
      if (ad) frEl.textContent = ad.ad + ': ' + ad.aciklama; else frekansYaz();
      frEl.hidden = !!sel;
      neresi.textContent = M.taraf + ' · ' + sah.ad;
      yuva.textContent = '';
      if (typeof ayar.kartEki === 'function') {
        ayar.kartEki(tur, kimlik, yuva);
        if (ad && !sel) ayar.kartEki('adim', dsah.id + '.' + ad.id, yuva);
      }
    }
    // Kemikçik dönme ekseni boyunca bakış: dönme ekranın düzleminde görünür; dış kulak yolu solda kalır.
    function eksenBakis() {
      var geri = G.eksen.slice(), yuk = nrm(sub([0, 1, 0], sc(geri, geri[1]))), sag = cross(yuk, geri);
      if (dot(sag, sub(merkez(PART.eac.P), merkez(PART.tm.P))) > 0) { geri = sc(geri, -1); sag = sc(sag, -1); }
      return [sag[0], sag[1], sag[2], yuk[0], yuk[1], yuk[2], geri[0], geri[1], geri[2]];
    }
    function sahneListesi() { return mod === 'denge' ? DSAH : SAH; }
    // Küçük tuş: kısa yazı; tam ad ekran okuyucu ve ipucu için
    function frYazi(f) { return f + ' Hz'; }
    function kokleayaGec() {
      if (!hazir || mod !== 'isitme') return;
      var k = SAH.filter(function (x) { return x.id === 'koklea'; })[0];
      if (k && sah !== k) setSah(k);
    }
    function donusYaz() {
      donusBtn.hidden = !(mod === 'isitme' && sah !== SAH[0]);
      if (donusIp) donusIp.yenile();
      if (donusBtn.hidden && IP) IP.gizle();
    }
    donusBtn.addEventListener('click', function () { setSah(SAH[0]); });
    function kucukTus(o) {
      var b = h('button', 'sl-k'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      var y = h('span', 'sl-k-yazi', o.kisa || o.ad); y.setAttribute('aria-hidden', 'true'); b.appendChild(y);
      b.setAttribute('aria-label', o.ad); b.title = o.ad; return b;
    }
    function sahneDugmeleri() {
      sahBox.textContent = ''; sahBtns = [];
      sahneListesi().forEach(function (s) { var b; if (mod === 'denge') b = kucukTus(s); else { b = h('button', null, s.ad); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); } b.addEventListener('click', function () { setSah(s); modeleKaydir(); }); sahBox.appendChild(b); sahBtns.push(b); });
    }
    function adimDugmeleri() {
      adimBox.textContent = ''; adimBtns = [];
      if (!dsah) return;
      dsah.adimlar.forEach(function (a, i) { var b = kucukTus(a); b.addEventListener('click', function () { setAdim(i); }); adimBox.appendChild(b); adimBtns.push(b); });
    }
    // Adım seçimi: baş yeni pozisyona yumuşakça döner (duraklatılmışsa ya da hareket azaltma açıksa hemen).
    function tumYaz() {
      // Üç durum: oynatılmıyor (▶ Tümünü oynat) · oynuyor (❚❚ Duraklat) · duraklatıldı (▶ Devam et)
      var calisiyor = !!oto && oynuyor;
      var ad = calisiyor ? (M.tumunuDurdur || 'Duraklat') : oto ? (M.devamEt || 'Devam et') : (M.tumunuOynat || 'Tümünü oynat');
      tumBtn.textContent = calisiyor ? '❚❚' : '▶'; tumBtn.setAttribute('aria-label', ad); tumBtn.title = ad; tumBtn.setAttribute('aria-pressed', calisiyor ? 'true' : 'false');
    }
    function otoDurdur() { oto = null; tumYaz(); }
    tumBtn.addEventListener('click', function () {
      if (oto) { oynuyor = !oynuyor; tumYaz(); dirty = true; return; }   // duraklat / kaldığı yerden devam et
      if (!oynuyor) { oynuyor = true; oynatYaz(); }
      // Elle bir adım seçildiyse oradan başlar; son adımdaysa ya da hiç seçilmediyse en baştan
      var bas = adimI > 0 && adimI < dsah.adimlar.length - 1 ? adimI : 0;
      oto = { bekle: 0 }; tumYaz(); setAdim(bas, false, true);
    });
    function setAdim(i, hemen, otodan) {
      if (!otodan && oto) otoDurdur();
      if (!otodan && !oynuyor) { oynuyor = true; oynatYaz(); }   // duraklatılmışken elle adım seçilirse hareket yeniden açılır
      var a = dsah.adimlar[i]; adimI = i;
      if (dsah.tip === 'bppv' && (a.sifirla || hemen)) KR = DS.kristaller(Y, KRISTAL_SAYI);
      basQ = pozQ.slice(); hedefQ = DS.mat2q(DS.pozMatris(a.poz || {})); basIvme = ivme.slice(); hedefIvme = (a.ivme || [0, 0, 0]).slice(); gecisT = 0;
      kul = BIRIM_3.slice();
      if (hemen || !oynuyor) {
        pozQ = hedefQ.slice(); ivme = hedefIvme.slice(); gecisT = 1; akis = null;
        if (dsah.tip === 'bppv') dinlen();
        zarHedef = makulaKaymasi(pozQ, ivme); zarBas = zarHedef; zarT = 99;
        uzakYakin(!!hemen);
      } else {
        akis = { t: 0 }; uzakYakin(true);
      }
      adimBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      sel = null; card(); dirty = true;
    }
    function setMod(m) {
      if (m === mod || (m === 'denge' && !DSAH.length)) return;
      mod = m; sesKapat(); sel = null;
      modIs.setAttribute('aria-pressed', m === 'isitme' ? 'true' : 'false'); modDe.setAttribute('aria-pressed', m === 'denge' ? 'true' : 'false');
      [enerjiKutu, bSah, frUst, bGor, viewBox].forEach(function (e) { e.hidden = m === 'denge'; });
      [adimBox, yerEt, yakinBtn, dengeBar, donBox].forEach(function (e) { e.hidden = m !== 'denge'; });
      // Sahne tuşları: denge kipinde animasyonun hemen altına (küçük), işitmede eski yerine
      sahBox.classList.toggle('sl-sahne-k', m === 'denge'); sahBox.classList.toggle('g3d-bolumler', m !== 'denge');
      if (m === 'denge') dengeBar.insertBefore(sahBox, adimSatir); else bSah.parentNode.insertBefore(sahBox, bSah.nextSibling);
      // Denge kipinde tek oynatma denetimi "Tümünü oynat"; sol üstteki Oynat/Duraklat gizlenir, hareket hep açık
      oynatBtn.hidden = m === 'denge'; if (m === 'denge' && !oynuyor) { oynuyor = true; oynatYaz(); }
      donKalan = 0;
      if (oto) otoDurdur();
      metinler(); sahneDugmeleri(); uzakYakin(false); tumYaz();
      if (m === 'denge') setSah(dsah || DSAH[0]); else { R = VIEWS.on.slice(); setSah(SAH[0]); }
    }
    donSol.addEventListener('click', function () { if (reduce) { kul = mul(ry(-DON_ADIM), kul); dirty = true; } else donKalan -= DON_ADIM; });
    donSag.addEventListener('click', function () { if (reduce) { kul = mul(ry(DON_ADIM), kul); dirty = true; } else donKalan += DON_ADIM; });
    basaBtn.addEventListener('click', function () { donKalan = 0; kul = BIRIM_3.slice(); zoom = 1; dirty = true; });
    modIs.addEventListener('click', function () { setMod('isitme'); });
    modDe.addEventListener('click', function () { setMod('denge'); });
    modIs.setAttribute('aria-pressed', 'true'); modDe.setAttribute('aria-pressed', 'false');
    bAdim.hidden = true; adimBox.hidden = true;
    function setSah(s) {
      sah = s; sel = null;
      donusYaz();   // genel görünüm düğmesi: Ses yolculuğu dışındaki sahnelerde görünür
      if (mod === 'denge') { dsah = s; adimDugmeleri(); if (oto) otoDurdur(); }
      else if (s.gorunum === 'eksen') R = eksenBakis(); else if (VIEWS[s.gorunum]) R = VIEWS[s.gorunum].slice();
      sahBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', sahneListesi()[k] === s ? 'true' : 'false'); });
      frame(s.cerceve || s.yapilar);
      if (mod === 'denge') setAdim(0, true); else card();
      enerjiEl.forEach(function (li, k) { var on = !s.enerji || s.enerji.indexOf(k + 1) >= 0; li.classList.toggle('sl-asama-acik', on); if (on) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    }
    function setFr(f) {
      frekans = f;
      var fi = veri.frekanslar.indexOf(f), fy = frYazi(f); if (fi >= 0) frKaydir.value = String(fi);
      frDeger.textContent = fy; frKaydir.setAttribute('aria-valuetext', fy);
      frOlcek.querySelectorAll('span').forEach(function (e, k) { e.classList.toggle('sl-fr-secili', k === fi); });
      if (ses) { try { ses.o.frequency.setTargetAtTime(f, ses.ctx.currentTime, 0.02); } catch (e) {} }
      sesYaz(); frekansYaz(); dirty = true;
    }
    function modeleKaydir() {
      var r = sahne.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.5) sahne.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
    function cast(cx, cy) {
      var rc = cv.getBoundingClientRect(), asp = rc.width / rc.height, x = ((cx - rc.left) / rc.width * 2 - 1) * asp * TAN, y = -((cy - rc.top) / rc.height * 2 - 1) * TAN;
      var dv = [x, y, -1], ov = [0, 0, lastD];
      var o = [R[0] * ov[0] + R[3] * ov[1] + R[6] * ov[2] + cen[0], R[1] * ov[0] + R[4] * ov[1] + R[7] * ov[2] + cen[1], R[2] * ov[0] + R[5] * ov[1] + R[8] * ov[2] + cen[2]];
      var d = [R[0] * dv[0] + R[3] * dv[1] + R[6] * dv[2], R[1] * dv[0] + R[4] * dv[1] + R[7] * dv[2], R[2] * dv[0] + R[5] * dv[1] + R[8] * dv[2]];
      var best = 1e9, hit = null, bestT = 1e9, hitT = null;
      ORDER.forEach(function (id) {
        if (id === 'kristal') return;
        var eskiSel = sel; sel = null; var st = style(id); sel = eskiSel; if (!st || st.a < 0.25) return; var tr = st.a < 1, P = PART[id].P, I = PART[id].I;
        for (var t = 0; t < I.length; t += 3) {
          var a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
          var e1x = P[b] - P[a], e1y = P[b + 1] - P[a + 1], e1z = P[b + 2] - P[a + 2], e2x = P[c] - P[a], e2y = P[c + 1] - P[a + 1], e2z = P[c + 2] - P[a + 2];
          var px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x, det = e1x * px + e1y * py + e1z * pz;
          if (det > -1e-9 && det < 1e-9) continue;
          var inv = 1 / det, tx = o[0] - P[a], ty = o[1] - P[a + 1], tz = o[2] - P[a + 2], u = (tx * px + ty * py + tz * pz) * inv;
          if (u < 0 || u > 1) continue;
          var qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, v = (d[0] * qx + d[1] * qy + d[2] * qz) * inv;
          if (v < 0 || u + v > 1) continue;
          var tt = (e2x * qx + e2y * qy + e2z * qz) * inv;
          if (tt > 0) { if (tr) { if (tt < bestT) { bestT = tt; hitT = id; } } else if (tt < best) { best = tt; hit = id; } }
        }
      });
      var bulunan = hit || hitT; return bulunan ? grup(bulunan) : null;
    }
    function tap(id) { sel = (sel === id || !YAPI[id]) ? null : id; card(); dirty = true; }

    function basla(meta, buf) {
      var prog = gl.createProgram();
      function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
      try {
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      } catch (e) { hata(M.baslatilamadi); return; }
      gl.useProgram(prog);
      aP = gl.getAttribLocation(prog, 'p'); aN = gl.getAttribLocation(prog, 'n'); aS = gl.getAttribLocation(prog, 's');
      gl.enableVertexAttribArray(aP); gl.enableVertexAttribArray(aN);
      ['mvp', 'rot', 'mdl', 'mdlN', 'disp', 'tur', 'zaman', 'zarFaz', 'tepe', 'sik', 'col', 'duz', 'tepeRenk', 'cukurRenk', 'elekRenk'].forEach(function (u) { U[u] = gl.getUniformLocation(prog, u); });
      var k = meta.scale / 32767;
      meta.parts.forEach(function (m) {
        if (GORUNEN.indexOf(grup(m.id)) < 0) return;   // kemik, damarlar vb. bu sayfada çizilmez
        var q = new Int16Array(buf, m.off, m.nv * 3), no = new Int8Array(buf, m.off + m.nv * 6, m.nv * 3);
        var ix = new Uint16Array(buf, m.off + m.nv * 9 + (m.nv % 2), m.nf * 3);
        var P = new Float32Array(m.nv * 3), N = new Float32Array(m.nv * 3), j, a, v;
        for (j = 0; j < m.nv * 3; j++) { P[j] = q[j] * k; N[j] = no[j] / 127; }
        var pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, P, gl.STATIC_DRAW);
        var nb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, nb); gl.bufferData(gl.ARRAY_BUFFER, N, gl.STATIC_DRAW);
        var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ix, gl.STATIC_DRAW);
        var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
        for (j = 0; j < m.nv; j++) for (a = 0; a < 3; a++) { v = P[j * 3 + a]; if (v < mn[a]) mn[a] = v; if (v > mx[a]) mx[a] = v; }
        PART[m.id] = { P: P, I: ix, pb: pb, nb: nb, ib: ib, n: m.nf * 3, mn: mn, mx: mx }; ORDER.push(m.id);
      });
      try { G = hareketHazirla(PART); } catch (e) { hata(M.baslatilamadi); return; }
      var ekler = [['tm', G.tmW], ['sm', G.smS], ['eac', G.eacS], ['vest', G.vestW]];
      if (G.n8S) ekler.push(['n8', G.n8S]);
      Object.keys(G.kepS).forEach(function (id) { ekler.push([id, G.kepS[id]]); });
      ekler.forEach(function (x) {
        var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, x[1], gl.STATIC_DRAW); PART[x[0]].sb = b;
      });
      // Denge: posterior kanal yolu, makulalar (vestibül içine çizilir), kristal küresi, ampulla parıltı ağırlığı
      function parcaEkle(id, A) {
        var P = new Float32Array(A.P), N = new Float32Array(A.N), S = new Float32Array(A.S), I = new Uint16Array(A.I);
        function tampon(tur, v) { var b = gl.createBuffer(); gl.bindBuffer(tur, b); gl.bufferData(tur, v, gl.STATIC_DRAW); return b; }
        var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
        for (var j = 0; j < P.length; j++) { var a = j % 3; if (P[j] < mn[a]) mn[a] = P[j]; if (P[j] > mx[a]) mx[a] = P[j]; }
        PART[id] = { P: P, I: I, pb: tampon(gl.ARRAY_BUFFER, P), nb: tampon(gl.ARRAY_BUFFER, N), sb: tampon(gl.ARRAY_BUFFER, S), ib: tampon(gl.ELEMENT_ARRAY_BUFFER, I), n: I.length, mn: mn, mx: mx };
        ORDER.push(id);
      }
      if (DS && DSAH.length) {
        try {
          Y = DS.kanalYolu(PART); MAK = DS.makulalar(PART);
          ['utr', 'sak'].forEach(function (m) { parcaEkle(m + '_ep', MAK[m].epitel); parcaEkle(m + '_tuy', MAK[m].tuy); parcaEkle(m + '_zar', MAK[m].zar); });
          parcaEkle('kristal', DS.kristalAg(0.3));
          var BA = DS.basAg(PART); parcaEkle('bas_deri', BA.deri); parcaEkle('bas_yuz', BA.yuz); parcaEkle('bas_kulak', BA.kulak); parcaEkle('bas_boyun', BA.boyun); parcaEkle('bas_burun', BA.burun);
          var AP = PART.amp.P, aw = new Float32Array(AP.length / 3);
          for (var ai = 0; ai < aw.length; ai++) aw[ai] = Math.pow(Math.max(0, 1 - Math.hypot(AP[ai * 3] - Y.ampulla[0], AP[ai * 3 + 1] - Y.ampulla[1], AP[ai * 3 + 2] - Y.ampulla[2]) / 1.8), 1.2);
          var ab = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ab); gl.bufferData(gl.ARRAY_BUFFER, aw, gl.STATIC_DRAW); PART.amp.sb = ab;
        } catch (e) { DSAH = []; modBox.hidden = true; }
      }
      gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
      renkleriOku();

      sahneDugmeleri();
      // Sayı doğrusu: her frekansın çentiği ve kısa yazısı (1k = 1000 Hz); çentiğe dokununca da o frekansa gider
      var nF = veri.frekanslar.length; frKaydir.max = String(nF - 1);
      veri.frekanslar.forEach(function (f, k) {
        var e = h('span', null, f >= 1000 ? (f / 1000) + 'k' : String(f)); e.style.setProperty('--k', nF > 1 ? k / (nF - 1) : 0);
        e.addEventListener('click', function () { setFr(f); }); frOlcek.appendChild(e);
      });
      frKaydir.addEventListener('input', function () { kokleayaGec(); var f = veri.frekanslar[+frKaydir.value]; if (f && f !== frekans) setFr(f); });
      // Frekans çubuğuna dokununca Koklea sahnesine geçilir (yürüyen dalga orada görünür)
      frBox.addEventListener('pointerdown', kokleayaGec);
      Object.keys(M.gorunumler).forEach(function (v) { var b = h('button', null, M.gorunumler[v]); b.type = 'button'; b.addEventListener('click', function () { if (VIEWS[v]) { R = VIEWS[v].slice(); zoom = 1; auto = false; dirty = true; } }); viewBox.appendChild(b); });

      var ptr = {}, moved = 0, pd = 0;
      function keys() { return Object.keys(ptr); }
      dinle(cv, 'pointerdown', function (e) { try { cv.setPointerCapture(e.pointerId); } catch (x) {} ptr[e.pointerId] = { x: e.clientX, y: e.clientY }; moved = 0; auto = false; var kk = keys(); if (kk.length === 2) pd = Math.hypot(ptr[kk[0]].x - ptr[kk[1]].x, ptr[kk[0]].y - ptr[kk[1]].y); });
      dinle(cv, 'pointermove', function (e) {
        var p = ptr[e.pointerId]; if (!p) return; var kk = keys(), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        if (kk.length === 1) { if (mod === 'denge') kul = mul(mul(ry(dx * 0.01), rx(dy * 0.01)), kul); else R = mul(mul(ry(dx * 0.01), rx(dy * 0.01)), R); dirty = true; }
        else if (kk.length === 2) { var nd = Math.hypot(ptr[kk[0]].x - ptr[kk[1]].x, ptr[kk[0]].y - ptr[kk[1]].y); if (pd > 0 && nd > 0) { zoom = Math.max(0.25, Math.min(3, zoom * pd / nd)); dirty = true; } pd = nd; }
      });
      function up(e) { var had = ptr[e.pointerId]; delete ptr[e.pointerId]; if (had && moved < 8 && e.type === 'pointerup') { var hit = cast(e.clientX, e.clientY); if (hit) tap(hit); else if (sel) tap(sel); } }
      dinle(cv, 'pointerup', up); dinle(cv, 'pointercancel', up);
      dinle(cv, 'wheel', function (e) { e.preventDefault(); zoom = Math.max(0.25, Math.min(3, zoom * (1 + e.deltaY * 0.001))); dirty = true; }, { passive: false });
      dinle(cv, 'webglcontextlost', function (e) { e.preventDefault(); hazir = false; hata(M.baglamKayboldu); });
      dinle(window, 'resize', size);
      dinle(document, 'visibilitychange', function () { if (document.hidden) sesKapat(); });
      if (window.ResizeObserver) { var ro = new window.ResizeObserver(size); ro.observe(cv); dinleyiciler.push([{ removeEventListener: function () { ro.disconnect(); } }, '', null]); }

      durum.hidden = true; hazir = true;
      size(); setSah(SAH[0]); setFr(frekans); oynatYaz(); cen = tcen.slice(); rad = trad;
      if (istenenKip === 'denge') setMod('denge');
    }

    function indir() {
      var meta;
      window.fetch(yol + 'periferik.json').then(function (r) { if (!r.ok) throw new Error('json'); return r.json(); })
        .then(function (m) { meta = m; return window.fetch(yol + 'periferik.bin'); })
        .then(function (r) { if (!r.ok) throw new Error('bin'); return r.arrayBuffer(); })
        .then(function (buf) { if (durdu) return; if (meta.bayt && buf.byteLength !== meta.bayt) throw new Error('boyut'); basla(meta, buf); })
        .catch(function () { if (!durdu) hata(M.indirilemedi, true); });
    }
    var istenenKip = 'isitme';
    oynatYaz(); sesYaz();
    indir();
    window.requestAnimationFrame(loop);

    return {
      yenile: function () {
        metinler(); if (!hazir) return; renkleriOku();
        sahneDugmeleri(); sahBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', sahneListesi()[k] === sah ? 'true' : 'false'); });
        if (dsah) { adimDugmeleri(); adimBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === adimI ? 'true' : 'false'); }); }
        sesYaz(); oynatYaz(); tumYaz(); donusYaz(); card(); dirty = true;
      },
      kip: function (m) { istenenKip = m; if (hazir) setMod(m); },   // sayfanın seçim ekranından: 'isitme' / 'denge'
      durdur: function () { sesKapat(); if (oto) otoDurdur(); },   // sayfadan çıkınca ses kesilir
      kaldir: function () { durdu = true; sesKapat(); dinleyiciler.forEach(function (d) { d[0].removeEventListener(d[1], d[2], d[3]); }); kok.textContent = ''; }
    };
  }

  window.SesLab = { kur: kur };
})();
