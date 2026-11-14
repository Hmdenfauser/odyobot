/* Gorsel3D: periferik işitme sisteminin döndürülebilir 3D modeli.
   Kütüphane kullanmaz; çizim tarayıcının kendi WebGL'i ile yapılır.

   Kullanım:
     var g = Gorsel3D.kur(kapsayiciOge, {
       veri: window.GORSEL3D_VERI,     // gorsel3d-veri.js (metinler, bölümler, yapılar)
       veriYolu: 'gorsel3d/',          // periferik.json ve periferik.bin'in klasörü
       kartEki: function (tur, kimlik, yuva) {}  // isteğe bağlı: bilgi kartı her değiştiğinde çağrılır.
                                                 // tur: 'bolum' | 'yapi' | 'kepce'; yuva: boş bir <div>
                                                 // (ör. yönetici "Düzenle" bağlantısını buraya eklemek için)
     });
     g.yenile();   // metinler ya da renk değişkenleri değiştiyse ekranı tazeler
     g.kaldir();   // çizimi durdurur, dinleyicileri kaldırır

   Renkler koda yazılmaz: her yapının rengi gorsel3d.css içindeki --g3d-<kimlik> değişkeninden okunur.
   Ekrana yazı yalnızca textContent ile basılır (innerHTML yok). */
(function () {
  'use strict';

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function renkCoz(s) {
    s = (s || '').trim();
    var m = /^#([0-9a-f]{6})$/i.exec(s);
    if (m) { var n = parseInt(m[1], 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
    m = /^#([0-9a-f]{3})$/i.exec(s);
    if (m) { return [parseInt(m[1][0], 16) / 15, parseInt(m[1][1], 16) / 15, parseInt(m[1][2], 16) / 15]; }
    m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(s);
    if (m) return [m[1] / 255, m[2] / 255, m[3] / 255];
    return null;
  }
  function rx(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function ry(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
  function mul(a, b) { var o = [], r, c; for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]); return o; }

  var VS = 'attribute vec3 p;attribute vec3 n;uniform mat4 mvp;uniform mat3 rot;varying vec3 vn;void main(){vn=rot*n;gl_Position=mvp*vec4(p,1.0);}';
  var FS = 'precision mediump float;varying vec3 vn;uniform vec4 col;uniform float duz;void main(){vec3 N=normalize(vn);if(!gl_FrontFacing)N=-N;vec3 L=normalize(vec3(0.45,0.6,0.66));float d=max(dot(N,L),0.0);float f=max(dot(N,normalize(vec3(-0.7,-0.25,0.4))),0.0);float rim=pow(1.0-max(N.z,0.0),3.0);float s=pow(max(dot(reflect(-L,N),vec3(0.0,0.0,1.0)),0.0),28.0);vec3 c=col.rgb*(0.34+0.62*d+0.22*f)-col.rgb*rim*0.18+vec3(s*0.2);c=mix(c,col.rgb*(0.75+0.25*d),duz);gl_FragColor=vec4(c,col.a);}';

  function kur(kok, ayar) {
    ayar = ayar || {};
    var veri = ayar.veri || window.GORSEL3D_VERI, M = veri.metinler, yol = ayar.veriYolu || 'gorsel3d/';
    var SECS = veri.bolumler, durdu = false, hazir = false, dinleyiciler = [];
    function dinle(hedef, olay, fn, sec) { hedef.addEventListener(olay, fn, sec); dinleyiciler.push([hedef, olay, fn, sec]); }

    /* ---- sayfa yapısı ---- */
    kok.classList.add('g3d');
    kok.textContent = '';
    var sahne = h('div', 'g3d-sahne'), cv = h('canvas');
    cv.setAttribute('aria-label', M.canvasEtiketi);
    var neresi = h('div', 'g3d-etiket g3d-sagust'), olcek = h('div', 'g3d-etiket g3d-solalt'), cubuk = h('span', 'g3d-cubuk'), olcekYazi = h('span', null, M.olcek);
    olcek.appendChild(cubuk); olcek.appendChild(olcekYazi); olcek.hidden = true;
    var durum = h('p', 'g3d-durum', M.indiriliyor);
    durum.setAttribute('role', 'status');
    // OdyoBOT uyarlaması: modelin üstünde "Geri" düğmesi (seçimi kaldırır → kepçeyi kapatır → Tüm sistem'e döner).
    var geriBtn = h('button', 'g3d-geri', '← ' + (M.geri || 'Geri')); geriBtn.type = 'button'; geriBtn.hidden = true;
    sahne.appendChild(cv); sahne.appendChild(neresi); sahne.appendChild(olcek); sahne.appendChild(geriBtn); sahne.appendChild(durum);
    var ipucu = h('p', 'g3d-not g3d-ipucu', M.ipucu);
    var secBox = h('div', 'g3d-satir g3d-bolumler'), partBox = h('div', 'g3d-yapilar');
    var kart = h('div', 'g3d-kart'), nmEl = h('h4'), dsEl = h('p'), yuva = h('div', 'g3d-kart-ek');
    kart.setAttribute('aria-live', 'polite');
    kart.appendChild(nmEl); kart.appendChild(dsEl); kart.appendChild(yuva);
    var viewBox = h('div', 'g3d-satir g3d-gorunumler');
    var notEl = h('p', 'g3d-not', M.not), kaynakEl = h('p', 'g3d-not'), metinYuva = h('div', 'g3d-kart-ek');
    // OdyoBOT uyarlaması: ipucu ve not yenile() ile tazelenir; kartEki('metin', 'metinler', yuva) notun altına ek koyar.
    function metinler() {
      ipucu.textContent = M.ipucu; notEl.textContent = M.not; metinYuva.textContent = '';
      if (typeof ayar.kartEki === 'function') ayar.kartEki('metin', 'metinler', metinYuva);
    }
    kaynakEl.appendChild(document.createTextNode(M.kaynakOnsoz + ' '));
    M.kaynaklar.forEach(function (k, i) {
      var a = h('a', null, k.metin);
      if (/^https:\/\//.test(k.adres)) { a.href = k.adres; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      kaynakEl.appendChild(a);
      kaynakEl.appendChild(document.createTextNode(i < M.kaynaklar.length - 1 ? '; ' : '. '));
    });
    kaynakEl.appendChild(document.createTextNode(M.degisiklikler));
    // Telefon düzeni: açıklama kartı modelin hemen altında; sonra bölüm, görünüm, en sonda uzun yapı listesi.
    [sahne, ipucu, kart, h('h3', 'g3d-baslik', M.bolumBasligi), secBox, h('h3', 'g3d-baslik', M.gorunumBasligi), viewBox,
      h('h3', 'g3d-baslik', M.yapilarBasligi), partBox, notEl, metinYuva, kaynakEl].forEach(function (e) { kok.appendChild(e); });
    metinler();

    function hata(metin, yeniden) {
      durum.textContent = metin; durum.hidden = false;
      if (yeniden) { var b = h('button', null, M.yenidenDene); b.type = 'button'; b.addEventListener('click', function () { durum.textContent = M.indiriliyor; indir(); }); durum.appendChild(b); }
    }

    var gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
    if (!gl) { hata(M.webglYok); return { yenile: function () {}, kaldir: function () { kok.textContent = ''; } }; }

    /* ---- durum ---- */
    var PART = {}, ORDER = [], RENK = {}, SILIK = [0.62, 0.68, 0.70], TEN = [0.87, 0.69, 0.58];
    var PIN = SECS[1].yapilar.filter(function (x) { return x.charAt(1) === '_'; }), pinOpen = false;
    var sec = SECS[0], sel = null, dirty = true;
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), auto = !reduce;
    var FOV = 34 * Math.PI / 180, TAN = Math.tan(FOV / 2);
    var VIEWS = { lat: mul(rx(0.2), ry(-0.45)), med: mul(rx(0.2), ry(Math.PI - 0.45)), ust: mul(rx(Math.PI / 2 - 0.2), ry(0)), on: mul(rx(0.15), ry(-Math.PI / 2)), arka: mul(rx(0.15), ry(Math.PI / 2)) };
    var R = VIEWS.lat.slice(), cen = [0, 0, 0], rad = 20, tcen = [0, 0, 0], trad = 20, zoom = 1, lastD = 60;
    var aP, aN, uM, uR, uC, uF, secBtns = [], partBtns = {};

    function renkleriOku() {
      var cs = window.getComputedStyle(kok);
      ORDER.forEach(function (id) { RENK[id] = renkCoz(cs.getPropertyValue('--g3d-' + id)) || SILIK; });
      SILIK = renkCoz(cs.getPropertyValue('--g3d-silik')) || SILIK;
      TEN = renkCoz(cs.getPropertyValue('--g3d-kepce')) || TEN;
    }
    function frame(ids) {
      var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      ids.forEach(function (id) { var p = PART[id]; if (!p) return; for (var a = 0; a < 3; a++) { if (p.mn[a] < mn[a]) mn[a] = p.mn[a]; if (p.mx[a] > mx[a]) mx[a] = p.mx[a]; } });
      tcen = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
      trad = Math.max(2.5, Math.sqrt(Math.pow(mx[0] - mn[0], 2) + Math.pow(mx[1] - mn[1], 2) + Math.pow(mx[2] - mn[2], 2)) / 2);
      zoom = 1; if (reduce) { cen = tcen.slice(); rad = trad; } dirty = true;
    }
    function inSec(id) { return sec.yapilar.indexOf(id) >= 0 || (!!sec.ek && sec.ek.indexOf(id) >= 0); }
    function style(id) {
      var c = RENK[id], on = inSec(id), pin = id.charAt(1) === '_';
      if (pin && !pinOpen) c = TEN;
      if (id === 'bone' || id === 'sin') {
        if (sec.id !== 'cevre') return null;
        var al = (id === 'bone') ? (sel === 'bone' ? 0.55 : (sel ? 0.08 : 0.2)) : (sel === 'sin' ? 1 : (sel ? 0.12 : 0.45));
        return { c: c, a: al, duz: id === 'bone' && sel !== 'bone' ? 0.6 : 0 };
      }
      if (id === 'car' && sec.id !== 'cevre') return null;
      if (pin && sec.id !== 'tum' && sec.id !== 'dis') return null;
      if (sec.id === 'cevre' && sel && sel !== id) return { c: SILIK, a: 0.16, duz: 1 };
      if (sec.id === 'cevre' && !on) return { c: c, a: 1, duz: 0 };
      if (!on) return { c: SILIK, a: 0.13, duz: 1 };
      if (sel && sel !== id) return { c: SILIK, a: (pin && sel.charAt(1) !== '_') ? 0.06 : 0.16, duz: 1 };
      if (sel === id) return { c: [Math.min(1, c[0] * 1.08), Math.min(1, c[1] * 1.08), Math.min(1, c[2] * 1.08)], a: 1, duz: 0 };
      return { c: c, a: 1, duz: 0 };
    }
    function size() {
      if (!cv.clientWidth) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(1, Math.round(cv.clientWidth * dpr)), hh = Math.max(1, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
      gl.viewport(0, 0, w, hh); dirty = true;
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
      gl.uniformMatrix4fv(uM, false, o);
      gl.uniformMatrix3fv(uR, false, new Float32Array([R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]));
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      var pass, id, st, p;
      for (pass = 0; pass < 2; pass++) {
        if (pass === 1) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); }
        for (k = 0; k < ORDER.length; k++) {
          id = ORDER[k]; st = style(id); if (!st) continue; if ((st.a < 1) !== (pass === 1)) continue; p = PART[id];
          gl.uniform4f(uC, st.c[0], st.c[1], st.c[2], st.a); gl.uniform1f(uF, st.duz);
          gl.bindBuffer(gl.ARRAY_BUFFER, p.pb); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, p.nb); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.ib); gl.drawElements(gl.TRIANGLES, p.n, gl.UNSIGNED_SHORT, 0);
        }
      }
      gl.disable(gl.BLEND); gl.depthMask(true);
      var px = 10 * f / d * cv.clientHeight / 2;
      olcek.hidden = !(px > 14 && px < cv.clientWidth * 0.6);
      cubuk.style.width = Math.round(px) + 'px';
    }
    function loop() {
      if (durdu) return;
      if (hazir && cv.clientWidth) {
        if (auto) { R = mul(ry(0.004), R); dirty = true; }
        var dc = Math.abs(tcen[0] - cen[0]) + Math.abs(tcen[1] - cen[1]) + Math.abs(tcen[2] - cen[2]) + Math.abs(trad - rad);
        if (dc > 0.01) { for (var a = 0; a < 3; a++) cen[a] += (tcen[a] - cen[a]) * 0.16; rad += (trad - rad) * 0.16; dirty = true; }
        if (dirty) { dirty = false; draw(); }
      }
      window.requestAnimationFrame(loop);
    }

    /* ---- arayüz ---- */
    function card() {
      var tur, kimlik;
      if (sel) { nmEl.textContent = veri.yapilar[sel].ad; dsEl.textContent = veri.yapilar[sel].aciklama; tur = 'yapi'; kimlik = sel; }
      else if (pinOpen) { nmEl.textContent = veri.kepce.ad; dsEl.textContent = veri.kepce.aciklama; tur = 'kepce'; kimlik = 'kepce'; }
      else { nmEl.textContent = sec.ad; dsEl.textContent = sec.aciklama; tur = 'bolum'; kimlik = sec.id; }
      neresi.textContent = M.taraf + ' · ' + sec.ad;
      geriBtn.hidden = !(sel || pinOpen || sec !== SECS[0]);
      yuva.textContent = '';
      if (typeof ayar.kartEki === 'function') ayar.kartEki(tur, kimlik, yuva);
    }
    function pick(id) {
      sel = (sel === id) ? null : id; auto = false;
      Object.keys(partBtns).forEach(function (k) { partBtns[k].setAttribute('aria-pressed', k === sel ? 'true' : 'false'); });
      if (sec.id !== 'tum' && sec.id !== 'cevre') { frame(sec.yapilar); if (sel) { var sr = trad; frame([sel]); trad = Math.max(trad, sr * 0.5); } }
      card(); dirty = true;
    }
    function chip(label, col, fn) {
      var b = h('button'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      var d = h('span', 'g3d-nokta'); d.style.background = 'rgb(' + col.map(function (x) { return Math.round(x * 255); }).join(',') + ')';
      b.appendChild(d); b.appendChild(h('span', null, label)); b.addEventListener('click', function () { fn(); modeleKaydir(); }); partBox.appendChild(b); return b;
    }
    function chips() {
      partBox.textContent = ''; partBtns = {};
      var list = sec.id === 'dis' ? (pinOpen ? PIN.concat(['eac']) : ['pinna', 'eac']) : (sec.id === 'tum' ? ['pinna'].concat(sec.yapilar) : sec.yapilar);
      list.forEach(function (id) {
        if (id === 'pinna') { chip(veri.kepce.ad, TEN, openPinna); return; }
        partBtns[id] = chip(veri.yapilar[id].ad, RENK[id], function () { pick(id); });
        if (id === sel) partBtns[id].setAttribute('aria-pressed', 'true');
      });
    }
    function setSec(s) {
      sec = s; sel = null; pinOpen = false; auto = false;
      secBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', SECS[k] === s ? 'true' : 'false'); });
      chips(); frame(s.id === 'cevre' ? ['eac', 'n8', 'car', 'vest'] : s.yapilar.concat(s.ek || [])); card();
    }
    // Listeden seçim yapılınca model ekranda değilse yukarı kaydır (telefonda sonucu görmek için).
    function modeleKaydir() {
      var r = sahne.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.5) sahne.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
    // Geri: önce seçimi kaldırır, sonra kepçe bölümlerini kapatır, en sonda Tüm sistem'e döner.
    function geri() {
      if (sel) pick(sel);
      else if (pinOpen) setSec(sec);
      else if (sec !== SECS[0]) setSec(SECS[0]);
      dirty = true;
    }
    function openPinna() { if (sec.id !== 'dis') setSec(SECS[1]); pinOpen = true; sel = null; chips(); frame(PIN); card(); dirty = true; }
    function cast(cx, cy) {
      var rc = cv.getBoundingClientRect(), asp = rc.width / rc.height, x = ((cx - rc.left) / rc.width * 2 - 1) * asp * TAN, y = -((cy - rc.top) / rc.height * 2 - 1) * TAN;
      var dv = [x, y, -1], ov = [0, 0, lastD];
      var o = [R[0] * ov[0] + R[3] * ov[1] + R[6] * ov[2] + cen[0], R[1] * ov[0] + R[4] * ov[1] + R[7] * ov[2] + cen[1], R[2] * ov[0] + R[5] * ov[1] + R[8] * ov[2] + cen[2]];
      var d = [R[0] * dv[0] + R[3] * dv[1] + R[6] * dv[2], R[1] * dv[0] + R[4] * dv[1] + R[7] * dv[2], R[2] * dv[0] + R[5] * dv[1] + R[8] * dv[2]];
      var best = 1e9, hit = null, bestT = 1e9, hitT = null;
      ORDER.forEach(function (id) {
        var eskiSel = sel; sel = null; var st = style(id); sel = eskiSel; if (!st || st.a < 0.3 || id === 'bone') return; var tr = st.a < 1, P = PART[id].P, I = PART[id].I;
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
    function tap(id) {
      if (id.charAt(1) === '_' && !pinOpen) { openPinna(); return; }
      if (sec.yapilar.indexOf(id) < 0) { for (var k = 1; k < SECS.length; k++) if (SECS[k].yapilar.indexOf(id) >= 0) { setSec(SECS[k]); break; } }
      pick(id);   // aynı yapıya yeniden dokunmak seçimi kaldırır
    }

    function basla(meta, buf) {
      var prog = gl.createProgram();
      function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
      try {
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      } catch (e) { hata(M.baslatilamadi); return; }
      gl.useProgram(prog);
      aP = gl.getAttribLocation(prog, 'p'); aN = gl.getAttribLocation(prog, 'n');
      gl.enableVertexAttribArray(aP); gl.enableVertexAttribArray(aN);
      uM = gl.getUniformLocation(prog, 'mvp'); uR = gl.getUniformLocation(prog, 'rot'); uC = gl.getUniformLocation(prog, 'col'); uF = gl.getUniformLocation(prog, 'duz');
      var k = meta.scale / 32767;
      meta.parts.forEach(function (m) {
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
      gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
      renkleriOku();

      SECS.forEach(function (s) { var b = h('button', null, s.ad); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', function () { setSec(s); modeleKaydir(); }); secBox.appendChild(b); secBtns.push(b); });
      Object.keys(M.gorunumler).forEach(function (v) { var b = h('button', null, M.gorunumler[v]); b.type = 'button'; b.addEventListener('click', function () { if (VIEWS[v]) { R = VIEWS[v].slice(); zoom = 1; auto = false; dirty = true; } }); viewBox.appendChild(b); });

      var ptr = {}, moved = 0, pd = 0;
      function keys() { return Object.keys(ptr); }
      dinle(cv, 'pointerdown', function (e) { try { cv.setPointerCapture(e.pointerId); } catch (x) {} ptr[e.pointerId] = { x: e.clientX, y: e.clientY }; moved = 0; auto = false; var kk = keys(); if (kk.length === 2) pd = Math.hypot(ptr[kk[0]].x - ptr[kk[1]].x, ptr[kk[0]].y - ptr[kk[1]].y); });
      dinle(cv, 'pointermove', function (e) {
        var p = ptr[e.pointerId]; if (!p) return; var kk = keys(), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        if (kk.length === 1) { R = mul(mul(ry(dx * 0.01), rx(dy * 0.01)), R); dirty = true; }
        else if (kk.length === 2) { var nd = Math.hypot(ptr[kk[0]].x - ptr[kk[1]].x, ptr[kk[0]].y - ptr[kk[1]].y); if (pd > 0 && nd > 0) { zoom = Math.max(0.25, Math.min(3, zoom * pd / nd)); dirty = true; } pd = nd; }
      });
      function up(e) { var had = ptr[e.pointerId]; delete ptr[e.pointerId]; if (had && moved < 8 && e.type === 'pointerup') { var hit = cast(e.clientX, e.clientY); if (hit) tap(hit); else if (sel) pick(sel); } }
      dinle(cv, 'pointerup', up); dinle(cv, 'pointercancel', up);
      dinle(cv, 'wheel', function (e) { e.preventDefault(); zoom = Math.max(0.25, Math.min(3, zoom * (1 + e.deltaY * 0.001))); dirty = true; }, { passive: false });
      dinle(cv, 'webglcontextlost', function (e) { e.preventDefault(); hazir = false; hata(M.baglamKayboldu); });
      dinle(window, 'resize', size);
      if (window.ResizeObserver) { var ro = new window.ResizeObserver(size); ro.observe(cv); dinleyiciler.push([{ removeEventListener: function () { ro.disconnect(); } }, '', null]); }

      geriBtn.addEventListener('click', geri);
      durum.hidden = true; hazir = true;
      size(); setSec(SECS[0]); cen = tcen.slice(); rad = trad; auto = !reduce;
    }

    function indir() {
      var meta;
      window.fetch(yol + 'periferik.json').then(function (r) { if (!r.ok) throw new Error('json'); return r.json(); })
        .then(function (m) { meta = m; return window.fetch(yol + 'periferik.bin'); })
        .then(function (r) { if (!r.ok) throw new Error('bin'); return r.arrayBuffer(); })
        .then(function (buf) { if (durdu) return; if (meta.bayt && buf.byteLength !== meta.bayt) throw new Error('boyut'); basla(meta, buf); })
        .catch(function () { if (!durdu) hata(M.indirilemedi, true); });
    }
    indir();
    window.requestAnimationFrame(loop);

    return {
      yenile: function () { metinler(); if (!hazir) return; renkleriOku(); secBtns.forEach(function (b, k) { b.textContent = SECS[k].ad; }); chips(); card(); dirty = true; },
      kaldir: function () { durdu = true; dinleyiciler.forEach(function (d) { d[0].removeEventListener(d[1], d[2], d[3]); }); kok.textContent = ''; }
    };
  }

  window.Gorsel3D = { kur: kur };
})();
