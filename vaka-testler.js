/* Vakalarım ek testleri (yol haritası 2. adım). Kayıtlar yine yalnızca bu cihazda (VakaDeposu, vakalarim.js).
   Her test bir modül olarak window.VakaTestleri dizisine eklenir; vakalarim.js modülleri şu noktalarda çağırır:
     alan                  vaka nesnesindeki alan adı (ör. 'timpan')
     temizle(x, sorun)     kayıttan/yedekten okunan değeri doğrular; temiz değeri ya da undefined döner
     formOku(hatalar)      formdaki değerler; hatalı alanlar hatalar dizisine { giris, k, f: null, panel }
     formDoldur(x)         formu kayıttaki değerle (ya da boş) doldurur
     ayrinti(x)            ayrıntı ekranındaki bölüm (öğe ya da null)
     csv                   [{ ad, al(x) }] tablo sütunları
   Bu dosya vakalarim.js'ten önce yüklenir. Klinik yorum (tip sınıflaması) proje sahibinin değerleri gelince eklenecek. */
(function () {
  'use strict';
  var U = window.OdyoUI;
  window.VakaTestleri = window.VakaTestleri || [];
  if (!U || !document.getElementById('v-timpan')) return;
  var h = U.h, $ = U.$;
  var KULAKLAR = ['sag', 'sol'], KULAK_AD = { sag: 'Sağ', sol: 'Sol' };

  function M(kap, ad) { var el = document.querySelector('#' + kap + ' [data-m="' + ad + '"]'); return el ? el.textContent.trim() : ''; }
  function tamSayiMi(n, a, b) { return typeof n === 'number' && Math.floor(n) === n && n >= a && n <= b; }
  // En çok 2 ondalık basamaklı sayı mı (0,6 / 1,25)?
  function ondalikMi(n, a, b) { return typeof n === 'number' && isFinite(n) && n >= a && n <= b && Math.abs(Math.round(n * 100) - n * 100) < 1e-6; }
  function ondalikYaz(n) { return n == null ? '' : String(n).replace('.', ','); }

  // Giriş okuma. Boş → { bos: true }; geçerli → { deger }; değilse → { hata }.
  function tamSayiOku(el, enAz, enCok) {
    if (el.validity && el.validity.badInput) return { hata: 'Geçerli bir sayı gir.' };
    var s = String(el.value || '').trim().replace('−', '-');
    if (s === '') return { bos: true };
    if (!/^-?\d+$/.test(s)) return { hata: 'Tam sayı gir.' };
    var n = parseInt(s, 10);
    if (n < enAz || n > enCok) return { hata: enAz + ' ile ' + enCok + ' arasında olmalı.' };
    return { deger: n };
  }
  function ondalikOku(el, enAz, enCok) {
    var s = String(el.value || '').trim();
    if (s === '') return { bos: true };
    if (!/^\d{0,2}([.,]\d{1,2})?$/.test(s) || s === '.' || s === ',') return { hata: 'Sayı gir (ör. 0,6).' };
    var n = parseFloat(s.replace(',', '.'));
    if (!(n >= enAz && n <= enCok)) return { hata: ondalikYaz(enAz) + ' ile ' + ondalikYaz(enCok) + ' arasında olmalı.' };
    return { deger: Math.round(n * 100) / 100 };
  }
  function isaretle(el, r) {
    el.classList.toggle('hatali', !!r.hata);
    el.setAttribute('aria-invalid', r.hata ? 'true' : 'false');
    var u = el.parentNode.querySelector('.alan-uyari'); if (u) u.textContent = r.hata || '';
    return r;
  }

  /* ---------- SVG yardımcıları ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, kids) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function y1(n) { return Math.round(n * 10) / 10; }

  /* =====================================================================
     TİMPANOMETRİ
     Kayıt: v.timpan = { sag: { basinc (daPa, tam sayı), kompliyans (ml), hacim (ml), duz (tepe yok) }, sol: {...} }
     Hepsi isteğe bağlı; boş kulak yazılmaz. duz işaretliyse tepe basıncı kaydedilmez.
     ===================================================================== */
  var T_SINIR = { basinc: [-600, 400], kompliyans: [0, 9.99], hacim: [0, 9.99] };   // giriş aralığı (cihaz ölçüm aralığını kapsar; norm değil)
  // Çizim: eğri, tepe noktası ve kompliyanstan çan biçiminde üretilir. Genişlik sabittir (ölçülmüş değil, yalnızca görünüm için).
  var T_EGRI_SIGMA = 42;   // daPa; yarı yükseklikte genişlik ≈ 100 daPa

  function timpanTemizle(x, sorun) {
    if (x == null) return undefined;
    if (typeof x !== 'object' || Array.isArray(x)) { sorun('timpanometri verisi okunamadı'); return undefined; }
    var out = {};
    KULAKLAR.forEach(function (k) {
      var e = x[k];
      if (e == null) return;
      var ad = KULAK_AD[k] + ' timpanometri';
      if (typeof e !== 'object' || Array.isArray(e)) { sorun(ad + ' okunamadı'); return; }
      var t = {};
      if (e.duz === true) t.duz = true;
      else if (e.basinc != null) { if (tamSayiMi(e.basinc, T_SINIR.basinc[0], T_SINIR.basinc[1])) t.basinc = e.basinc; else sorun(ad + ': tepe basıncı geçersiz'); }
      ['kompliyans', 'hacim'].forEach(function (a) {
        if (e[a] == null) return;
        if (ondalikMi(e[a], T_SINIR[a][0], T_SINIR[a][1])) t[a] = e[a]; else sorun(ad + ': ' + a + ' geçersiz');
      });
      if (Object.keys(t).length) out[k] = t;
    });
    return Object.keys(out).length ? out : undefined;
  }

  function tGiris(a, k) { return $('v-t-' + a + '-' + k); }
  function timpanFormOku(hatalar, sessiz) {
    var out = {};
    KULAKLAR.forEach(function (k) {
      var t = {}, duz = $('v-t-duz-' + k).checked;
      function al(a, r) {
        if (!sessiz) isaretle(tGiris(a, k), r);
        if (r.hata) { if (hatalar) hatalar.push({ giris: tGiris(a, k), k: k, f: null, panel: 'v-timpan' }); return; }
        if (r.deger != null) t[a] = r.deger;
      }
      if (duz) { t.duz = true; if (!sessiz) isaretle(tGiris('basinc', k), {}); }
      else al('basinc', tamSayiOku(tGiris('basinc', k), T_SINIR.basinc[0], T_SINIR.basinc[1]));
      al('kompliyans', ondalikOku(tGiris('kompliyans', k), T_SINIR.kompliyans[0], T_SINIR.kompliyans[1]));
      al('hacim', ondalikOku(tGiris('hacim', k), T_SINIR.hacim[0], T_SINIR.hacim[1]));
      if (Object.keys(t).length) out[k] = t;
    });
    return Object.keys(out).length ? out : undefined;
  }
  function duzDurumu(k) {
    var duz = $('v-t-duz-' + k).checked, el = tGiris('basinc', k);
    el.disabled = duz;
    if (duz) { el.value = ''; isaretle(el, {}); }
  }
  function timpanFormDoldur(x) {
    KULAKLAR.forEach(function (k) {
      var e = (x && x[k]) || {};
      $('v-t-duz-' + k).checked = !!e.duz;
      tGiris('basinc', k).value = e.basinc != null ? String(e.basinc) : '';
      tGiris('kompliyans', k).value = ondalikYaz(e.kompliyans);
      tGiris('hacim', k).value = ondalikYaz(e.hacim);
      ['basinc', 'kompliyans', 'hacim'].forEach(function (a) { isaretle(tGiris(a, k), {}); });
      duzDurumu(k);
    });
    $('v-timpan').open = !!x;
    timpanCanli();
  }
  function timpanCanli() {
    var kap = $('v-timpan-grafik'), x = timpanFormOku(null, true);
    var g = timpanGrafik(x);
    kap.hidden = !g;
    kap.replaceChildren.apply(kap, g ? [g] : []);
  }
  KULAKLAR.forEach(function (k) {
    $('v-t-duz-' + k).addEventListener('change', function () { duzDurumu(k); });
  });
  $('v-timpan').addEventListener('input', function (e) {
    if (e.target.classList.contains('t-deger')) {
      var p = e.target.id.split('-');   // v-t-<alan>-<kulak>
      var r = p[2] === 'basinc' ? tamSayiOku(e.target, T_SINIR.basinc[0], T_SINIR.basinc[1]) : ondalikOku(e.target, T_SINIR[p[2]][0], T_SINIR[p[2]][1]);
      isaretle(e.target, r);
    }
    timpanCanli();
  });

  // Çizilebilir kulak: tepe yoksa düz çizgi; tepe varsa basınç ve kompliyans ikisi de gerekli.
  function cizilebilir(e) { return e && (e.duz || (e.basinc != null && e.kompliyans != null)); }

  // Timpanogram SVG'si (iki kulak üst üste; sağ kırmızı O, sol mavi X). Çizilecek bir şey yoksa null.
  // secenek.cikti: çıktı dosyası için (renkler sınıflarla değil doğrudan verilir; cikti.js kullanacak).
  function timpanSvg(x) {
    var kulaklar = KULAKLAR.filter(function (k) { return x && cizilebilir(x[k]); });
    if (!kulaklar.length) return null;
    var pMin = -400, pMax = 200, yMax = 1.5;
    kulaklar.forEach(function (k) {
      var e = x[k];
      if (e.basinc != null) { if (e.basinc < pMin) pMin = -600; if (e.basinc > pMax) pMax = 400; }
      if (e.kompliyans != null) yMax = Math.max(yMax, Math.ceil(e.kompliyans * 1.15 / 0.5) * 0.5);
    });
    var W = 360, H = 230, L = 34, R = 18, T = 18, B = 30;
    function xP(p) { return L + (p - pMin) / (pMax - pMin) * (W - L - R); }
    function yC(c) { return T + (1 - c / yMax) * (H - T - B); }
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'odyogram timpanogram', role: 'img' });
    svg.setAttribute('aria-label', M('vt-metinler', 'baslik') + ': ' + kulaklar.map(function (k) { return KULAK_AD[k] + ' ' + timpanOzet(x[k]); }).join('; '));
    var adim = yMax > 3 ? 1 : 0.5;
    for (var c = 0; c <= yMax + 1e-9; c += adim) {
      svg.appendChild(s('line', { 'class': 'og-cizgi', x1: L, x2: W - R, y1: y1(yC(c)), y2: y1(yC(c)) }));
      svg.appendChild(s('text', { 'class': 'og-yazi', x: L - 4, y: y1(yC(c) + 3), 'text-anchor': 'end', text: ondalikYaz(Math.round(c * 10) / 10) }));
    }
    for (var p = pMin; p <= pMax; p += 100) {
      svg.appendChild(s('line', { 'class': 'og-cizgi' + (p === 0 ? ' og-sifir' : ''), x1: y1(xP(p)), x2: y1(xP(p)), y1: T, y2: H - B }));
      svg.appendChild(s('text', { 'class': 'og-yazi', x: y1(xP(p)), y: H - B + 12, 'text-anchor': 'middle', text: (p > 0 ? '+' : '') + p }));
    }
    svg.appendChild(s('text', { 'class': 'og-yazi og-birim', x: 2, y: T - 6, text: 'ml' }));
    svg.appendChild(s('text', { 'class': 'og-yazi og-birim', x: W - R, y: H - 4, 'text-anchor': 'end', text: 'daPa' }));
    svg.appendChild(s('rect', { 'class': 'og-cerceve', x: L, y: T, width: W - L - R, height: H - T - B }));
    kulaklar.forEach(function (k) {
      var e = x[k], g = s('g', { 'class': 'og-kulak ' + k }), nok = [];
      if (e.duz) {
        var yd = yC(e.kompliyans != null ? Math.min(e.kompliyans, yMax) : 0);
        g.appendChild(s('polyline', { 'class': 'og-hat ' + k, points: y1(xP(pMin)) + ',' + y1(yd) + ' ' + y1(xP(pMax)) + ',' + y1(yd) }));
        g.appendChild(s('text', { 'class': 'og-yazi t-duz ' + k, x: k === 'sag' ? L + 4 : W - R - 4, y: y1(yd - 5), 'text-anchor': k === 'sag' ? 'start' : 'end', text: KULAK_AD[k] + ': ' + M('vt-metinler', 'duz') }));
      } else {
        for (var q = pMin; q <= pMax; q += 5) {
          var d = (q - e.basinc) / T_EGRI_SIGMA;
          nok.push(y1(xP(q)) + ',' + y1(yC(e.kompliyans * Math.exp(-0.5 * d * d))));
        }
        g.appendChild(s('polyline', { 'class': 'og-hat ' + k, points: nok.join(' ') }));
        var px = xP(e.basinc), py = yC(e.kompliyans), r = 5.5;
        if (k === 'sag') g.appendChild(s('circle', { 'class': 'os sag t-tepe', cx: y1(px), cy: y1(py), r: r }));
        else {
          g.appendChild(s('line', { 'class': 'os sol', x1: y1(px - r * .85), y1: y1(py - r * .85), x2: y1(px + r * .85), y2: y1(py + r * .85) }));
          g.appendChild(s('line', { 'class': 'os sol', x1: y1(px - r * .85), y1: y1(py + r * .85), x2: y1(px + r * .85), y2: y1(py - r * .85) }));
        }
      }
      svg.appendChild(g);
    });
    return svg;
  }
  function timpanGrafik(x, basliksiz) {
    var svg = timpanSvg(x);
    if (!svg) return null;
    return h('div', { 'class': 'timpan-kap' }, [
      basliksiz ? null : h('div', { 'class': 'og-baslik', text: M('vt-metinler', 'baslik') }),
      svg,
      h('p', { 'class': 'note t-uretilmis', text: M('vt-metinler', 'uretilmis') })
    ]);
  }
  function timpanOzet(e) {
    if (!e) return '';
    var p = [];
    if (e.duz) p.push(M('vt-metinler', 'duz'));
    else if (e.basinc != null) p.push(e.basinc + ' daPa');
    if (e.kompliyans != null) p.push(ondalikYaz(e.kompliyans) + ' ml');
    if (e.hacim != null) p.push('hacim ' + ondalikYaz(e.hacim) + ' ml');
    return p.join(', ');
  }
  // Ayrıntı ve çıktı için satırlar: [[başlık, sağ, sol], ...]
  function timpanSatirlari(x) {
    if (!x) return [];
    var satirlar = [];
    function satir(baslik, fn) {
      var d = KULAKLAR.map(function (k) { return x[k] ? fn(x[k]) : ''; });
      if (d.some(Boolean)) satirlar.push([baslik, d[0] || '–', d[1] || '–']);
    }
    satir('Tepe basıncı', function (e) { return e.duz ? 'Tepe yok' : (e.basinc != null ? e.basinc + ' daPa' : ''); });
    satir('Kompliyans', function (e) { return e.kompliyans != null ? ondalikYaz(e.kompliyans) + ' ml' : ''; });
    satir('Kanal hacmi', function (e) { return e.hacim != null ? ondalikYaz(e.hacim) + ' ml' : ''; });
    return satirlar;
  }
  function timpanAyrinti(x) {
    if (!x) return null;
    var satirlar = timpanSatirlari(x).map(function (r) {
      return h('tr', null, [h('th', { text: r[0] }), h('td', { text: r[1] }), h('td', { text: r[2] })]);
    });
    var parca = [h('h4', { text: 'Timpanometri' })];
    var g = timpanGrafik(x, true);
    if (g) parca.push(g);
    if (satirlar.length) parca.push(h('table', { 'class': 'esik-tablo ek-tablo' }, [
      h('thead', null, [h('tr', null, [h('th', { text: '' }), h('th', { 'class': 'sag', text: 'Sağ' }), h('th', { 'class': 'sol', text: 'Sol' })])]),
      h('tbody', null, satirlar)]));
    return h('div', { 'class': 'tablo-kap' }, parca);
  }

  var timpanCsv = [];
  KULAKLAR.forEach(function (k) {
    timpanCsv.push(
      { ad: KULAK_AD[k] + ' timpan tepe basıncı (daPa)', al: function (x) { var e = x && x[k]; return !e ? '' : (e.duz ? 'tepe yok' : (e.basinc != null ? e.basinc : '')); } },
      { ad: KULAK_AD[k] + ' timpan kompliyans (ml)', al: function (x) { var e = x && x[k]; return e ? ondalikYaz(e.kompliyans) : ''; } },
      { ad: KULAK_AD[k] + ' timpan kanal hacmi (ml)', al: function (x) { var e = x && x[k]; return e ? ondalikYaz(e.hacim) : ''; } }
    );
  });

  window.VakaTestleri.push({
    alan: 'timpan',
    baslik: function () { return M('vt-metinler', 'baslik') || 'Timpanometri'; },
    not: function () { return M('vt-metinler', 'uretilmis'); },
    temizle: timpanTemizle,
    formOku: function (hatalar) { return timpanFormOku(hatalar, false); },
    formDoldur: timpanFormDoldur,
    ayrinti: timpanAyrinti,
    ozet: function (x) { return x ? 'Timpanometri: ' + KULAKLAR.filter(function (k) { return x[k]; }).map(function (k) { return KULAK_AD[k].toLowerCase() + ' ' + timpanOzet(x[k]); }).join(', ') : ''; },
    satirlar: timpanSatirlari,
    svg: timpanSvg,
    csv: timpanCsv
  });
})();
