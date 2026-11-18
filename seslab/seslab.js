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
    G.nIc = nIc; G.umbo = umbo; G.pivot = pivot; G.eksen = eksen; G.piston = piston; G.stapesOran = stapesOran;
    G.umboYer = umboYer; G.tmW = tmW; G.eacS = eacS; G.smS = smS; G.smUzunluk = enCok; G.lent = lent; G.taban = taban;
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

  // tur: 0 durağan, 1 katı hareket (mdl), 2 zar (s*disp), 3 yürüyen dalga (skala media), 4 kanal dalgası (dış kulak yolu)
  var VS = 'attribute vec3 p;attribute vec3 n;attribute float s;uniform mat4 mvp;uniform mat3 rot;uniform mat4 mdl;uniform mat3 mdlN;uniform vec3 disp;' +
    'uniform float tur;uniform float zaman;uniform float zarFaz;uniform float tepe;uniform float sik;varying vec3 vn;varying float parla;' +
    'void main(){vec3 q=p;vec3 m=n;parla=0.0;' +
    'if(tur>0.5&&tur<1.5){q=(mdl*vec4(p,1.0)).xyz;m=mdlN*n;}' +
    'else if(tur>1.5&&tur<2.5){q=p+s*disp;parla=s*zarFaz*0.8;}' +
    'else if(tur>2.5&&tur<3.5){float g=s<tepe?exp(-pow((s-tepe)/max(0.18,tepe*0.55),2.0)):exp(-pow((s-tepe)/0.05,2.0));' +
    'float faz=6.2832*(zaman-5.0*sqrt(s/max(tepe,0.02)));float y=g*sin(faz);parla=y;q=p+n*y*0.09;}' +
    'else if(tur>3.5){float f=fract(s*sik-zaman);parla=smoothstep(0.7,1.0,f)*0.85;}' +
    'vn=rot*m;gl_Position=mvp*vec4(q,1.0);}';
  var FS = 'precision mediump float;varying vec3 vn;varying float parla;uniform vec4 col;uniform float duz;uniform vec3 tepeRenk;uniform vec3 cukurRenk;' +
    'void main(){vec3 N=normalize(vn);if(!gl_FrontFacing)N=-N;vec3 L=normalize(vec3(0.45,0.6,0.66));float d=max(dot(N,L),0.0);float f=max(dot(N,normalize(vec3(-0.7,-0.25,0.4))),0.0);' +
    'float rim=pow(1.0-max(N.z,0.0),3.0);float s=pow(max(dot(reflect(-L,N),vec3(0.0,0.0,1.0)),0.0),28.0);' +
    'vec3 b=col.rgb;b=mix(b,tepeRenk,clamp(parla,0.0,1.0));b=mix(b,cukurRenk,clamp(-parla,0.0,1.0));' +
    'vec3 c=b*(0.34+0.62*d+0.22*f)-b*rim*0.18+vec3(s*0.2);c=mix(c,b*(0.75+0.25*d),duz);gl_FragColor=vec4(c,col.a);}';

  function kur(kok, ayar) {
    ayar = ayar || {};
    var veri = ayar.veri || window.SESLAB_VERI, M = veri.metinler, YAPI = ayar.yapilar || {}, yol = ayar.veriYolu || 'gorsel3d/';
    var SAH = veri.sahneler, durdu = false, hazir = false, dinleyiciler = [];
    function dinle(hedef, olay, fn, sec) { hedef.addEventListener(olay, fn, sec); dinleyiciler.push([hedef, olay, fn, sec]); }

    /* ---- sayfa yapısı ---- */
    kok.classList.add('g3d', 'sl');
    kok.textContent = '';
    var sahne = h('div', 'g3d-sahne'), cv = h('canvas');
    cv.setAttribute('aria-label', M.canvasEtiketi);
    var neresi = h('div', 'g3d-etiket g3d-sagust'), olcek = h('div', 'g3d-etiket g3d-solalt'), cubuk = h('span', 'g3d-cubuk'), olcekYazi = h('span', null, M.olcek);
    olcek.appendChild(cubuk); olcek.appendChild(olcekYazi); olcek.hidden = true;
    var durum = h('p', 'g3d-durum', M.indiriliyor); durum.setAttribute('role', 'status');
    var oynatBtn = h('button', 'g3d-geri sl-oynat'); oynatBtn.type = 'button';
    sahne.appendChild(cv); sahne.appendChild(neresi); sahne.appendChild(olcek); sahne.appendChild(oynatBtn); sahne.appendChild(durum);
    var uyari = h('p', 'g3d-not g3d-ipucu sl-uyari');
    var kart = h('div', 'g3d-kart'), nmEl = h('h4'), dsEl = h('p'), frEl = h('p', 'sl-frekans-not'), yuva = h('div', 'g3d-kart-ek');
    kart.setAttribute('aria-live', 'polite');
    kart.appendChild(nmEl); kart.appendChild(dsEl); kart.appendChild(frEl); kart.appendChild(yuva);
    var sahBox = h('div', 'g3d-satir g3d-bolumler'), frBox = h('div', 'g3d-satir sl-frekanslar');
    var sesSatir = h('div', 'sl-ses'), sesBtn = h('button', 'sl-ses-dugme'), sesNot = h('p', 'g3d-not');
    sesBtn.type = 'button'; sesBtn.setAttribute('aria-pressed', 'false');
    sesSatir.appendChild(sesBtn); sesSatir.appendChild(sesNot);
    var viewBox = h('div', 'g3d-satir g3d-gorunumler');
    var bSah = h('h3', 'g3d-baslik'), bFr = h('h3', 'g3d-baslik'), bGor = h('h3', 'g3d-baslik');
    var notEl = h('p', 'g3d-not'), kaynakEl = h('p', 'g3d-not'), metinYuva = h('div', 'g3d-kart-ek');
    [sahne, uyari, kart, bSah, sahBox, bFr, frBox, sesSatir, bGor, viewBox, notEl, metinYuva, kaynakEl].forEach(function (e) { kok.appendChild(e); });

    function metinler() {
      uyari.textContent = M.uyari; notEl.textContent = M.not;
      bSah.textContent = M.sahneBasligi; bFr.textContent = M.frekansBasligi; bGor.textContent = M.gorunumBasligi;
      sesNot.textContent = M.sesNot;
      kaynakEl.textContent = '';
      kaynakEl.appendChild(document.createTextNode(M.kaynakOnsoz + ' '));
      M.kaynaklar.forEach(function (k, i) {
        var a = h('a', null, k.metin);
        if (/^https:\/\//.test(k.adres)) { a.href = k.adres; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        kaynakEl.appendChild(a);
        kaynakEl.appendChild(document.createTextNode(i < M.kaynaklar.length - 1 ? '; ' : '.'));
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
    var PART = {}, ORDER = [], RENK = {}, SILIK = [0.62, 0.68, 0.70], TEPE = [0.9, 0.2, 0.45], CUKUR = [0.1, 0.2, 0.5];
    var GORUNEN = ['eac', 'tm', 'mal', 'inc', 'sta', 'sv', 'sm', 'st', 'vest', 'ant', 'post', 'lat', 'crus', 'amp', 'n8'];
    var sah = SAH[0], sel = null, dirty = true, G = null;
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), auto = false;
    var oynuyor = !reduce, zaman = 0, sonT = 0, frekans = veri.frekanslar.indexOf(1000) >= 0 ? 1000 : veri.frekanslar[0];
    var HIZ = 0.55, ACI = 0.14;   // görsel titreşim: saniyede 0,55 tur; kemikçik dönmesi en çok ~8 derece (çok büyütülmüş)
    var FOV = 34 * Math.PI / 180, TAN = Math.tan(FOV / 2);
    var VIEWS = { lat: mul(rx(0.2), ry(-0.45)), med: mul(rx(0.2), ry(Math.PI - 0.45)), ust: mul(rx(Math.PI / 2 - 0.2), ry(0)), on: mul(rx(0.15), ry(-Math.PI / 2)), arka: mul(rx(0.15), ry(Math.PI / 2)) };
    var R = VIEWS.on.slice(), cen = [0, 0, 0], rad = 20, tcen = [0, 0, 0], trad = 20, zoom = 1, lastD = 60;
    var aP, aN, aS, U = {}, sahBtns = [], frBtns = [];
    var BIRIM = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]), BIRIM3 = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

    function renkleriOku() {
      var cs = window.getComputedStyle(kok);
      ORDER.forEach(function (id) { RENK[id] = renkCoz(cs.getPropertyValue('--g3d-' + id)) || SILIK; });
      SILIK = renkCoz(cs.getPropertyValue('--g3d-silik')) || SILIK;
      TEPE = renkCoz(cs.getPropertyValue('--sl-tepe')) || TEPE;
      CUKUR = renkCoz(cs.getPropertyValue('--sl-cukur')) || CUKUR;
    }
    function frame(ids) {
      var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      ids.forEach(function (id) { var p = PART[id]; if (!p) return; for (var a = 0; a < 3; a++) { if (p.mn[a] < mn[a]) mn[a] = p.mn[a]; if (p.mx[a] > mx[a]) mx[a] = p.mx[a]; } });
      tcen = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
      trad = Math.max(2.5, Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2);
      zoom = 1; if (reduce) { cen = tcen.slice(); rad = trad; } dirty = true;
    }
    function style(id) {
      if (GORUNEN.indexOf(id) < 0) return null;
      var c = RENK[id], on = sah.yapilar.indexOf(id) >= 0, yari = sah.yari && sah.yari.indexOf(id) >= 0;
      if (sel && sel !== id) return { c: SILIK, a: on ? 0.22 : 0.08, duz: 1 };
      if (sel === id) return { c: c, a: 1, duz: 0 };
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
    function hareket() {
      var faz = 2 * Math.PI * zaman, a = ACI * Math.sin(faz);
      var Rm = donme(G.eksen, a), pv = G.pivot;
      // mdl = T(pivot) * R * T(-pivot), sütun düzeninde (WebGL)
      var t = sub(pv, [Rm[0] * pv[0] + Rm[1] * pv[1] + Rm[2] * pv[2], Rm[3] * pv[0] + Rm[4] * pv[1] + Rm[5] * pv[2], Rm[6] * pv[0] + Rm[7] * pv[1] + Rm[8] * pv[2]]);
      var mdlK = new Float32Array([Rm[0], Rm[3], Rm[6], 0, Rm[1], Rm[4], Rm[7], 0, Rm[2], Rm[5], Rm[8], 0, t[0], t[1], t[2], 1]);
      var nK = new Float32Array([Rm[0], Rm[3], Rm[6], Rm[1], Rm[4], Rm[7], Rm[2], Rm[5], Rm[8]]);
      var kay = sc(G.piston, Math.sin(a) * G.stapesOran);
      var mdlS = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, kay[0], kay[1], kay[2], 1]);
      return { mdlK: mdlK, nK: nK, mdlS: mdlS, zar: sc(G.umboYer, Math.sin(a)), faz: Math.sin(faz) };
    }
    function draw() {
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
      gl.uniform3f(U.tepeRenk, TEPE[0], TEPE[1], TEPE[2]); gl.uniform3f(U.cukurRenk, CUKUR[0], CUKUR[1], CUKUR[2]);
      var H = hareket();
      gl.uniform1f(U.zarFaz, H.faz);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      var pass, id, st, p, tur;
      for (pass = 0; pass < 2; pass++) {
        if (pass === 1) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); }
        for (k = 0; k < ORDER.length; k++) {
          id = ORDER[k]; st = style(id); if (!st) continue; if ((st.a < 1) !== (pass === 1)) continue; p = PART[id];
          tur = id === 'mal' || id === 'inc' ? 1 : id === 'sta' ? 1 : id === 'tm' ? 2 : id === 'sm' ? 3 : id === 'eac' ? 4 : 0;
          gl.uniform1f(U.tur, tur);
          gl.uniformMatrix4fv(U.mdl, false, id === 'sta' ? H.mdlS : (tur === 1 ? H.mdlK : BIRIM));
          gl.uniformMatrix3fv(U.mdlN, false, id === 'sta' ? BIRIM3 : (tur === 1 ? H.nK : BIRIM3));
          gl.uniform3f(U.disp, H.zar[0], H.zar[1], H.zar[2]);
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
      olcek.hidden = !(px > 14 && px < cv.clientWidth * 0.6);
      cubuk.style.width = Math.round(px) + 'px';
    }
    function loop(ts) {
      if (durdu) return;
      var dt = sonT ? Math.min(0.1, (ts - sonT) / 1000) : 0; sonT = ts;
      if (hazir && cv.clientWidth) {
        if (oynuyor) { zaman += dt * HIZ; dirty = true; }
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
    function oynatYaz() { oynatBtn.textContent = oynuyor ? '❚❚ ' + M.duraklat : '▶ ' + M.oynat; oynatBtn.setAttribute('aria-pressed', oynuyor ? 'true' : 'false'); }
    oynatBtn.addEventListener('click', function () { oynuyor = !oynuyor; oynatYaz(); dirty = true; });
    function frekansYaz() {
      var y = Math.round(greenwoodBazalden(frekans) * 100), bolge = y < 34 ? M.bolgeBazal : y < 67 ? M.bolgeOrta : M.bolgeApikal;
      frEl.textContent = M.frekansNot.replace('{f}', frekans).replace('{y}', y).replace('{bolge}', bolge);
    }
    function card() {
      var tur, kimlik;
      if (sel && YAPI[sel]) { nmEl.textContent = YAPI[sel].ad; dsEl.textContent = YAPI[sel].aciklama; tur = 'yapi'; kimlik = sel; }
      else { nmEl.textContent = sah.ad; dsEl.textContent = sah.aciklama; tur = 'sahne'; kimlik = sah.id; }
      frekansYaz(); frEl.hidden = !!sel;
      neresi.textContent = M.taraf + ' · ' + sah.ad;
      yuva.textContent = '';
      if (typeof ayar.kartEki === 'function') ayar.kartEki(tur, kimlik, yuva);
    }
    // Kemikçik dönme ekseni boyunca bakış: dönme ekranın düzleminde görünür; dış kulak yolu solda kalır.
    function eksenBakis() {
      var geri = G.eksen.slice(), yuk = nrm(sub([0, 1, 0], sc(geri, geri[1]))), sag = cross(yuk, geri);
      if (dot(sag, sub(merkez(PART.eac.P), merkez(PART.tm.P))) > 0) { geri = sc(geri, -1); sag = sc(sag, -1); }
      return [sag[0], sag[1], sag[2], yuk[0], yuk[1], yuk[2], geri[0], geri[1], geri[2]];
    }
    function setSah(s) {
      sah = s; sel = null;
      if (s.gorunum === 'eksen') R = eksenBakis(); else if (VIEWS[s.gorunum]) R = VIEWS[s.gorunum].slice();
      sahBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', SAH[k] === s ? 'true' : 'false'); });
      frame(s.cerceve || s.yapilar); card();
    }
    function setFr(f) {
      frekans = f;
      frBtns.forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-f') === f ? 'true' : 'false'); });
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
      return hit || hitT;
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
      ['mvp', 'rot', 'mdl', 'mdlN', 'disp', 'tur', 'zaman', 'zarFaz', 'tepe', 'sik', 'col', 'duz', 'tepeRenk', 'cukurRenk'].forEach(function (u) { U[u] = gl.getUniformLocation(prog, u); });
      var k = meta.scale / 32767;
      meta.parts.forEach(function (m) {
        if (GORUNEN.indexOf(m.id) < 0) return;   // kemik, kepçe vb. bu sayfada çizilmez
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
      [['tm', G.tmW], ['sm', G.smS], ['eac', G.eacS]].forEach(function (x) {
        var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, x[1], gl.STATIC_DRAW); PART[x[0]].sb = b;
      });
      gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
      renkleriOku();

      SAH.forEach(function (s) { var b = h('button', null, s.ad); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', function () { setSah(s); modeleKaydir(); }); sahBox.appendChild(b); sahBtns.push(b); });
      veri.frekanslar.forEach(function (f) { var b = h('button', null, f >= 1000 ? (f / 1000) + ' kHz' : f + ' Hz'); b.type = 'button'; b.setAttribute('data-f', f); b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', function () { setFr(f); }); frBox.appendChild(b); frBtns.push(b); });
      Object.keys(M.gorunumler).forEach(function (v) { var b = h('button', null, M.gorunumler[v]); b.type = 'button'; b.addEventListener('click', function () { if (VIEWS[v]) { R = VIEWS[v].slice(); zoom = 1; auto = false; dirty = true; } }); viewBox.appendChild(b); });

      var ptr = {}, moved = 0, pd = 0;
      function keys() { return Object.keys(ptr); }
      dinle(cv, 'pointerdown', function (e) { try { cv.setPointerCapture(e.pointerId); } catch (x) {} ptr[e.pointerId] = { x: e.clientX, y: e.clientY }; moved = 0; auto = false; var kk = keys(); if (kk.length === 2) pd = Math.hypot(ptr[kk[0]].x - ptr[kk[1]].x, ptr[kk[0]].y - ptr[kk[1]].y); });
      dinle(cv, 'pointermove', function (e) {
        var p = ptr[e.pointerId]; if (!p) return; var kk = keys(), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        if (kk.length === 1) { R = mul(mul(ry(dx * 0.01), rx(dy * 0.01)), R); dirty = true; }
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
    }

    function indir() {
      var meta;
      window.fetch(yol + 'periferik.json').then(function (r) { if (!r.ok) throw new Error('json'); return r.json(); })
        .then(function (m) { meta = m; return window.fetch(yol + 'periferik.bin'); })
        .then(function (r) { if (!r.ok) throw new Error('bin'); return r.arrayBuffer(); })
        .then(function (buf) { if (durdu) return; if (meta.bayt && buf.byteLength !== meta.bayt) throw new Error('boyut'); basla(meta, buf); })
        .catch(function () { if (!durdu) hata(M.indirilemedi, true); });
    }
    oynatYaz(); sesYaz();
    indir();
    window.requestAnimationFrame(loop);

    return {
      yenile: function () {
        metinler(); if (!hazir) return; renkleriOku();
        sahBtns.forEach(function (b, k) { b.textContent = SAH[k].ad; }); sesYaz(); oynatYaz(); card(); dirty = true;
      },
      durdur: function () { sesKapat(); },   // sayfadan çıkınca ses kesilir
      kaldir: function () { durdu = true; sesKapat(); dinleyiciler.forEach(function (d) { d[0].removeEventListener(d[1], d[2], d[3]); }); kok.textContent = ''; }
    };
  }

  window.SesLab = { kur: kur };
})();
