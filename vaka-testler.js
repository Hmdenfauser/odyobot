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
  // Tip hesabı odyo-hesap.js'te (sınırlar orada, tek yerde).
  function tipi(e) { var H = window.OdyoHesap; return H && H.timpanTipi ? H.timpanTipi(e) : { kod: null, metin: '' }; }
  function tipMetni(x) {
    return KULAKLAR.filter(function (k) { return x && x[k]; }).map(function (k) {
      var m = tipi(x[k]).metin; return m ? KULAK_AD[k] + ': ' + m : '';
    }).filter(Boolean).join(' · ');
  }
  function timpanGrafik(x, basliksiz) {
    var svg = timpanSvg(x);
    if (!svg) return null;
    var tm = basliksiz ? '' : tipMetni(x);
    return h('div', { 'class': 'timpan-kap' }, [
      basliksiz ? null : h('div', { 'class': 'og-baslik', text: M('vt-metinler', 'baslik') }),
      svg,
      tm ? h('div', { 'class': 't-tip', text: tm }) : null,
      h('p', { 'class': 'note t-uretilmis', text: M('vt-metinler', 'uretilmis') }),
      basliksiz ? null : h('p', { 'class': 'note', text: M('vt-metinler', 'tipKural') })
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
    satir('Tip', function (e) { return tipi(e).metin; });
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
    parca.push(h('p', { 'class': 'note', text: M('vt-metinler', 'tipKural') }));
    return h('div', { 'class': 'tablo-kap' }, parca);
  }

  var timpanCsv = [];
  KULAKLAR.forEach(function (k) {
    timpanCsv.push(
      { ad: KULAK_AD[k] + ' timpan tip', al: function (x) { var e = x && x[k]; return e ? (tipi(e).kod || '') : ''; } },
      { ad: KULAK_AD[k] + ' timpan tepe basıncı (daPa)', al: function (x) { var e = x && x[k]; return !e ? '' : (e.duz ? 'tepe yok' : (e.basinc != null ? e.basinc : '')); } },
      { ad: KULAK_AD[k] + ' timpan kompliyans (ml)', al: function (x) { var e = x && x[k]; return e ? ondalikYaz(e.kompliyans) : ''; } },
      { ad: KULAK_AD[k] + ' timpan kanal hacmi (ml)', al: function (x) { var e = x && x[k]; return e ? ondalikYaz(e.hacim) : ''; } }
    );
  });

  window.VakaTestleri.push({
    alan: 'timpan',
    baslik: function () { return 'Timpanometri'; },
    not: function () { return M('vt-metinler', 'uretilmis') + ' ' + M('vt-metinler', 'tipKural'); },
    temizle: timpanTemizle,
    formOku: function (hatalar) { return timpanFormOku(hatalar, false); },
    formDoldur: timpanFormDoldur,
    ayrinti: timpanAyrinti,
    ozet: function (x) { return x ? 'Timpanometri: ' + KULAKLAR.filter(function (k) { return x[k]; }).map(function (k) { var kod = tipi(x[k]).kod; return KULAK_AD[k].toLowerCase() + ' ' + (kod ? 'tip ' + kod : timpanOzet(x[k])); }).join(', ') : ''; },
    satirlar: timpanSatirlari,
    svg: timpanSvg,
    csv: timpanCsv
  });

  /* =====================================================================
     AKUSTİK REFLEKS
     Kayıt: v.refleks = { sag: { ipsi: { '500': 90, '1000': 'yok', ... }, kontra: {...} }, sol: {...} }
     Kulak adı UYARANIN verildiği kulaktır (ders slaytı "3.dersaksutik refleksler.pptx", slayt 9 ve 13):
     sağ kontra = uyaran sağda, prob ve ölçüm solda. Eşik 50–125 dB, 5'in katı ya da "yok" (proje sahibi, 2026-11-17).
     Vakalarım yalnızca sonucu gösterir; yorum (lezyon yeri) ileride OdyoBOT asistanında.
     ===================================================================== */
  var R_FREK = [500, 1000, 2000, 4000], R_YOLLAR = ['ipsi', 'kontra'];
  var R_EN_AZ = 50, R_EN_COK = 125, R_ADIM = 5;
  function rYolAd(y) { return M('vt-metinler', y === 'ipsi' ? 'rIpsi' : 'rKontra') || y; }
  function rDegerMi(x) { return x === 'yok' || (tamSayiMi(x, R_EN_AZ, R_EN_COK) && x % R_ADIM === 0); }
  function rMetin(x) { return x == null ? '' : (x === 'yok' ? (M('vt-metinler', 'rYok') || 'Yok') : String(x)); }

  function refleksTemizle(x, sorun) {
    if (x == null) return undefined;
    if (typeof x !== 'object' || Array.isArray(x)) { sorun('akustik refleks verisi okunamadı'); return undefined; }
    var out = {};
    KULAKLAR.forEach(function (k) {
      if (x[k] == null) return;
      if (typeof x[k] !== 'object' || Array.isArray(x[k])) { sorun(KULAK_AD[k] + ' akustik refleks okunamadı'); return; }
      R_YOLLAR.forEach(function (y) {
        var kaynak = x[k][y];
        if (kaynak == null) return;
        if (typeof kaynak !== 'object' || Array.isArray(kaynak)) { sorun(KULAK_AD[k] + ' ' + y + ' refleks okunamadı'); return; }
        Object.keys(kaynak).forEach(function (f) {
          var ad = KULAK_AD[k] + ' ' + y + ' refleks ' + f + ' Hz';
          if (R_FREK.indexOf(+f) === -1) { sorun(ad + ': tanınmayan frekans'); return; }
          if (!rDegerMi(kaynak[f])) { sorun(ad + ': değer geçersiz'); return; }
          out[k] = out[k] || {}; out[k][y] = out[k][y] || {}; out[k][y][String(+f)] = kaynak[f];
        });
      });
    });
    return Object.keys(out).length ? out : undefined;
  }

  // Form: her hücre bir açılır liste (–, 50 … 125, Yok). Geçersiz değer girilemez.
  var rSecimler = {};   // 'sag-ipsi-500' → select
  function rTabloKur() {
    KULAKLAR.forEach(function (k) {
      var kap = document.querySelector('#v-refleks .r-blok[data-kulak="' + k + '"]');
      if (!kap) return;
      var bas = h('tr', null, [h('th', { text: 'Hz' })].concat(R_FREK.map(function (f) { return h('th', { text: f >= 1000 ? (f / 1000) + 'k' : String(f) }); })));
      var satirlar = R_YOLLAR.map(function (y) {
        return h('tr', null, [h('th', { text: rYolAd(y) })].concat(R_FREK.map(function (f) {
          var sec = h('select', { 'class': 'r-sec', id: 'v-r-' + k + '-' + y + '-' + f });
          sec.setAttribute('aria-label', KULAK_AD[k] + ' ' + rYolAd(y) + ' ' + f + ' Hz');
          sec.appendChild(h('option', { value: '', text: '–' }));
          for (var d = R_EN_AZ; d <= R_EN_COK; d += R_ADIM) sec.appendChild(h('option', { value: String(d), text: String(d) }));
          sec.appendChild(h('option', { value: 'yok', text: M('vt-metinler', 'rYok') || 'Yok' }));
          rSecimler[k + '-' + y + '-' + f] = sec;
          return h('td', null, [sec]);
        })));
      });
      kap.replaceChildren(h('table', { 'class': 'r-tablo' }, [h('thead', null, [bas]), h('tbody', null, satirlar)]));
    });
  }
  rTabloKur();
  function refleksFormOku() {
    var out = {};
    KULAKLAR.forEach(function (k) {
      R_YOLLAR.forEach(function (y) {
        R_FREK.forEach(function (f) {
          var sec = rSecimler[k + '-' + y + '-' + f]; if (!sec || !sec.value) return;
          var x = sec.value === 'yok' ? 'yok' : parseInt(sec.value, 10);
          out[k] = out[k] || {}; out[k][y] = out[k][y] || {}; out[k][y][String(f)] = x;
        });
      });
    });
    return Object.keys(out).length ? out : undefined;
  }
  function refleksFormDoldur(x) {
    KULAKLAR.forEach(function (k) {
      R_YOLLAR.forEach(function (y) {
        R_FREK.forEach(function (f) {
          var sec = rSecimler[k + '-' + y + '-' + f]; if (!sec) return;
          var d = x && x[k] && x[k][y] ? x[k][y][String(f)] : null;
          sec.value = d == null ? '' : String(d);
          sec.classList.toggle('dolu', d != null);
        });
      });
    });
    $('v-refleks').open = !!x;
  }
  $('v-refleks').addEventListener('change', function (e) { if (e.target.classList.contains('r-sec')) e.target.classList.toggle('dolu', !!e.target.value); });

  // [[satır adı, 500, 1000, 2000, 4000], ...]; boş satır yazılmaz.
  function refleksSatirlari(x) {
    if (!x) return [];
    var satirlar = [];
    KULAKLAR.forEach(function (k) {
      R_YOLLAR.forEach(function (y) {
        var yv = x[k] && x[k][y];
        if (!yv || !Object.keys(yv).length) return;
        var sr = [KULAK_AD[k] + ' ' + rYolAd(y).toLocaleLowerCase('tr-TR')].concat(R_FREK.map(function (f) { return rMetin(yv[String(f)]) || '–'; }));
        sr.kulak = k;
        satirlar.push(sr);
      });
    });
    return satirlar;
  }
  function refleksAyrinti(x) {
    var st = refleksSatirlari(x);
    if (!st.length) return null;
    return h('div', { 'class': 'tablo-kap' }, [
      h('h4', { text: M('vt-metinler', 'rBaslik') || 'Akustik refleks' }),
      h('table', { 'class': 'esik-tablo r-sonuc' }, [
        h('thead', null, [h('tr', null, [h('th', { text: 'Hz' })].concat(R_FREK.map(function (f) { return h('th', { text: String(f) }); })))]),
        h('tbody', null, st.map(function (sr) {
          return h('tr', null, [h('th', { 'class': sr.kulak, text: sr[0] })].concat(sr.slice(1).map(function (c) { return h('td', { text: c }); })));
        }))
      ]),
      h('p', { 'class': 'note', text: M('vt-metinler', 'rNot') })
    ]);
  }
  var refleksCsv = [];
  KULAKLAR.forEach(function (k) {
    R_YOLLAR.forEach(function (y) {
      R_FREK.forEach(function (f) {
        refleksCsv.push({ ad: KULAK_AD[k] + ' ' + y + ' refleks ' + f + ' (dB)', al: function (x) { return x && x[k] && x[k][y] ? rMetin(x[k][y][String(f)]) : ''; } });
      });
    });
  });

  window.VakaTestleri.push({
    alan: 'refleks',
    baslik: function () { return M('vt-metinler', 'rBaslik') || 'Akustik refleks'; },
    not: function () { return M('vt-metinler', 'rNot'); },
    temizle: refleksTemizle,
    formOku: function () { return refleksFormOku(); },
    formDoldur: refleksFormDoldur,
    ayrinti: refleksAyrinti,
    ozet: function (x) { return x ? (M('vt-metinler', 'rBaslik') || 'Akustik refleks') + ': girildi' : ''; },
    satirlar: refleksSatirlari,
    sutunlar: function () { return R_FREK.map(String); },
    csv: refleksCsv
  });

  /* =====================================================================
     OAE (DPOAE ve TEOAE)
     Kayıt: v.oae = { sag: { dp: { '2000': { s: sinyal, g: gürültü } }, te: { '1000': { s, g } }, repro: %, stab: % }, sol: {...} }
     Değerler dB SPL (−40 ile 50, en çok 1 ondalık). repro/stab yalnız TEOAE içindir (%, tam sayı).
     Geçti/kaldı odyo-hesap.js → oaeSonuc (ölçüt orada, tek yerde).
     Frekanslar (proje sahibi internetten araştırılmasını istedi, 2026-11-17): DPOAE f2 1–8 kHz (DP-gram),
     TEOAE yarım oktav bantları 1–4 kHz (Interacoustics vb. üreticilerin yaygın düzeni).
     ===================================================================== */
  var O_FREK = { dp: [1000, 1500, 2000, 3000, 4000, 6000, 8000], te: [1000, 1500, 2000, 3000, 4000] };
  var O_TESTLER = ['dp', 'te'], O_AD = { dp: 'DPOAE', te: 'TEOAE' };
  var O_EN_AZ = -40, O_EN_COK = 50;
  function oSonuc(e, t) { var H = window.OdyoHesap; return H && H.oaeSonuc ? H.oaeSonuc(e && e[t], t === 'te' && e ? { repro: e.repro, stab: e.stab } : null) : { kod: null, metin: '' }; }
  function onDB(n) { return typeof n === 'number' && isFinite(n) && n >= O_EN_AZ && n <= O_EN_COK && Math.abs(Math.round(n * 10) - n * 10) < 1e-6; }
  function bir(n) { return n == null ? '' : String(Math.round(n * 10) / 10).replace('.', ','); }
  function snr(x) { return Math.round((x.s - x.g) * 10) / 10; }
  function oKural() { var H = window.OdyoHesap; return (H && H.OAE_KURAL) || { snr: 6 }; }

  function oaeTemizle(x, sorun) {
    if (x == null) return undefined;
    if (typeof x !== 'object' || Array.isArray(x)) { sorun('OAE verisi okunamadı'); return undefined; }
    var out = {};
    KULAKLAR.forEach(function (k) {
      var e = x[k];
      if (e == null) return;
      if (typeof e !== 'object' || Array.isArray(e)) { sorun(KULAK_AD[k] + ' OAE okunamadı'); return; }
      var t = {};
      O_TESTLER.forEach(function (ts) {
        var kaynak = e[ts];
        if (kaynak == null) return;
        if (typeof kaynak !== 'object' || Array.isArray(kaynak)) { sorun(KULAK_AD[k] + ' ' + O_AD[ts] + ' okunamadı'); return; }
        Object.keys(kaynak).forEach(function (f) {
          var ad = KULAK_AD[k] + ' ' + O_AD[ts] + ' ' + f + ' Hz';
          if (O_FREK[ts].indexOf(+f) === -1) { sorun(ad + ': tanınmayan frekans'); return; }
          var d = kaynak[f];
          if (!d || typeof d !== 'object' || !onDB(d.s) || !onDB(d.g)) { sorun(ad + ': değer geçersiz'); return; }
          t[ts] = t[ts] || {}; t[ts][String(+f)] = { s: d.s, g: d.g };
        });
      });
      ['repro', 'stab'].forEach(function (a) {
        if (e[a] == null) return;
        if (tamSayiMi(e[a], 0, 100)) t[a] = e[a]; else sorun(KULAK_AD[k] + ' TEOAE ' + (a === 'repro' ? 'tekrarlanabilirlik' : 'stabilite') + ' geçersiz');
      });
      if (Object.keys(t).length) out[k] = t;
    });
    return Object.keys(out).length ? out : undefined;
  }

  // Form: kulak başına DPOAE ve TEOAE tabloları (sinyal, gürültü, fark). Hücreleri bu dosya çizer.
  function oGiris(k, t, f, a) { return $('v-o-' + k + '-' + t + '-' + f + '-' + a); }
  function oTabloKur() {
    KULAKLAR.forEach(function (k) {
      var kap = document.querySelector('#v-oae .o-blok[data-kulak="' + k + '"]');
      if (!kap) return;
      var parca = [];
      O_TESTLER.forEach(function (t) {
        parca.push(h('div', { 'class': 'o-alt', text: O_AD[t] + ' (dB SPL)' }));
        var bas = h('tr', null, [h('th', { text: 'Hz' }), h('th', { text: M('vt-metinler', 'oSinyal') || 'Sinyal' }), h('th', { text: M('vt-metinler', 'oGurultu') || 'Gürültü' }), h('th', { text: M('vt-metinler', 'oFark') || 'Fark' })]);
        var satirlar = O_FREK[t].map(function (f) {
          function giris(a) {
            var el = h('input', { 'class': 'o-deger', id: 'v-o-' + k + '-' + t + '-' + f + '-' + a, type: 'number', step: '0.1' });
            el.setAttribute('aria-label', KULAK_AD[k] + ' ' + O_AD[t] + ' ' + f + ' Hz ' + (a === 's' ? 'sinyal' : 'gürültü'));
            return h('td', null, [el]);
          }
          return h('tr', null, [h('th', { text: f >= 1000 ? String(f / 1000).replace('.', ',') + 'k' : String(f) }), giris('s'), giris('g'), h('td', { 'class': 'o-fark', id: 'v-o-' + k + '-' + t + '-' + f + '-f' })]);
        });
        parca.push(h('table', { 'class': 'o-tablo' }, [h('thead', null, [bas]), h('tbody', null, satirlar)]));
        if (t === 'te') {
          parca.push(h('div', { 'class': 'ek-grid' }, ['repro', 'stab'].map(function (a) {
            var id = 'v-o-' + k + '-' + a;
            return h('div', { 'class': 'fld' }, [
              h('label', { 'for': id, text: M('vt-metinler', a === 'repro' ? 'oRepro' : 'oStab') }),
              h('input', { 'class': 'o-yuzde', id: id, type: 'number', step: '1' }),
              h('div', { 'class': 'alan-uyari' })
            ]);
          })));
        }
      });
      parca.push(h('div', { 'class': 'o-sonuc', id: 'v-o-' + k + '-sonuc', 'aria-live': 'polite' }));
      kap.replaceChildren.apply(kap, parca);
    });
  }
  oTabloKur();

  // Bir hücre: boş → bos; geçerli → deger; değilse hata.
  function oOku(el, enAz, enCok, ondalik) {
    if (el.validity && el.validity.badInput) return { hata: 'Sayı gir.' };
    var s = String(el.value || '').trim().replace('−', '-').replace(',', '.');
    if (s === '') return { bos: true };
    if (!(ondalik ? /^-?\d+(\.\d)?$/ : /^\d+$/).test(s)) return { hata: ondalik ? 'En çok 1 ondalık.' : 'Tam sayı gir.' };
    var n = parseFloat(s);
    if (n < enAz || n > enCok) return { hata: enAz + ' ile ' + enCok + ' arası.' };
    return { deger: n };
  }
  function oIsaretle(el, r) {
    el.classList.toggle('hatali', !!r.hata);
    el.setAttribute('aria-invalid', r.hata ? 'true' : 'false');
    el.title = r.hata || '';
    var u = el.parentNode.querySelector('.alan-uyari'); if (u) u.textContent = r.hata || '';
  }
  function oaeFormOku(hatalar, sessiz) {
    var out = {};
    KULAKLAR.forEach(function (k) {
      var e = {};
      O_TESTLER.forEach(function (t) {
        O_FREK[t].forEach(function (f) {
          var gs = oGiris(k, t, f, 's'), gg = oGiris(k, t, f, 'g');
          var rs = oOku(gs, O_EN_AZ, O_EN_COK, true), rg = oOku(gg, O_EN_AZ, O_EN_COK, true);
          // Çift eksikse eksik olan kırmızı: sinyal ve gürültü birlikte girilir.
          if (!rs.hata && !rg.hata && rs.bos !== rg.bos) { if (rs.bos) rs = { hata: 'Sinyali de gir.' }; else rg = { hata: 'Gürültüyü de gir.' }; }
          if (!sessiz) { oIsaretle(gs, rs); oIsaretle(gg, rg); }
          [[gs, rs], [gg, rg]].forEach(function (p) { if (p[1].hata && hatalar) hatalar.push({ giris: p[0], k: k, f: null, panel: 'v-oae' }); });
          var fk = $('v-o-' + k + '-' + t + '-' + f + '-f');
          if (rs.deger != null && rg.deger != null) {
            e[t] = e[t] || {}; e[t][String(f)] = { s: rs.deger, g: rg.deger };
            var d = snr(e[t][String(f)]);
            if (fk) { fk.textContent = bir(d); fk.classList.toggle('var', d >= oKural().snr); }
          } else if (fk) { fk.textContent = ''; fk.classList.remove('var'); }
        });
      });
      ['repro', 'stab'].forEach(function (a) {
        var el = $('v-o-' + k + '-' + a), r = oOku(el, 0, 100, false);
        if (!sessiz) oIsaretle(el, r);
        if (r.hata) { if (hatalar) hatalar.push({ giris: el, k: k, f: null, panel: 'v-oae' }); return; }
        if (r.deger != null) e[a] = r.deger;
      });
      if (Object.keys(e).length) out[k] = e;
    });
    return Object.keys(out).length ? out : undefined;
  }
  function oSonucCiz(x) {
    KULAKLAR.forEach(function (k) {
      var kap = $('v-o-' + k + '-sonuc'); if (!kap) return;
      var satir = O_TESTLER.map(function (t) { var r = oSonuc(x && x[k], t); return r.kod ? O_AD[t] + ': ' + r.metin : ''; }).filter(Boolean);
      kap.replaceChildren.apply(kap, satir.map(function (m) { return h('div', { text: m }); }));
    });
  }
  function oaeCanli() {
    var x = oaeFormOku(null, true);
    oSonucCiz(x);
    var kap = $('v-oae-grafik'), g = oaeGrafik(x);
    kap.hidden = !g;
    kap.replaceChildren.apply(kap, g ? [g] : []);
  }
  function oaeFormDoldur(x) {
    KULAKLAR.forEach(function (k) {
      var e = (x && x[k]) || {};
      O_TESTLER.forEach(function (t) {
        O_FREK[t].forEach(function (f) {
          var d = e[t] && e[t][String(f)];
          ['s', 'g'].forEach(function (a) { var el = oGiris(k, t, f, a); el.value = d ? String(d[a]) : ''; oIsaretle(el, {}); });
        });
      });
      ['repro', 'stab'].forEach(function (a) { var el = $('v-o-' + k + '-' + a); el.value = e[a] != null ? String(e[a]) : ''; oIsaretle(el, {}); });
    });
    $('v-oae').open = !!x;
    oaeCanli();
  }
  $('v-oae').addEventListener('input', function (e) {
    var el = e.target;
    if (el.classList.contains('o-deger')) oIsaretle(el, oOku(el, O_EN_AZ, O_EN_COK, true));
    else if (el.classList.contains('o-yuzde')) oIsaretle(el, oOku(el, 0, 100, false));
    oaeCanli();
  });

  // Grafik: üstte DP-gram (sinyal düz çizgi + O/X, gürültü tabanı kesikli), altta TEOAE çubukları (sinyal renkli, gürültü gri).
  function oaeSvg(x) {
    if (!x) return null;
    var var_ = { dp: false, te: false }, enAz = -20, enCok = 30;
    KULAKLAR.forEach(function (k) {
      O_TESTLER.forEach(function (t) {
        var d = x[k] && x[k][t]; if (!d) return;
        Object.keys(d).forEach(function (f) { var_[t] = true; enAz = Math.min(enAz, Math.floor(Math.min(d[f].s, d[f].g) / 10) * 10); enCok = Math.max(enCok, Math.ceil(Math.max(d[f].s, d[f].g) / 10) * 10); });
      });
    });
    var paneller = O_TESTLER.filter(function (t) { return var_[t]; });
    if (!paneller.length) return null;
    var W = 360, PH = 210, L = 34, R = 18, T = 22, B = 30;
    var H_ = PH * paneller.length;
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H_, 'class': 'odyogram oae-grafik', role: 'img' });
    svg.setAttribute('aria-label', paneller.map(function (t) { return O_AD[t]; }).join(' ve ') + ' grafiği');
    paneller.forEach(function (t, pi) {
      var y0 = pi * PH, fl = O_FREK[t];
      function xF(f) {
        if (t === 'dp') return L + 12 + Math.log(f / fl[0]) / Math.log(fl[fl.length - 1] / fl[0]) * (W - L - R - 24);
        var i = fl.indexOf(f); return L + (i + 0.5) * (W - L - R) / fl.length;
      }
      function yD(d) { return y0 + T + (enCok - d) / (enCok - enAz) * (PH - T - B); }
      svg.appendChild(s('text', { 'class': 'og-yazi og-birim', x: 2, y: y0 + T - 8, text: O_AD[t] + ' · dB SPL' }));
      for (var d = enAz; d <= enCok; d += 10) {
        svg.appendChild(s('line', { 'class': 'og-cizgi' + (d === 0 ? ' og-sifir' : ''), x1: L, x2: W - R, y1: y1(yD(d)), y2: y1(yD(d)) }));
        svg.appendChild(s('text', { 'class': 'og-yazi', x: L - 4, y: y1(yD(d) + 3), 'text-anchor': 'end', text: String(d) }));
      }
      fl.forEach(function (f) {
        if (t === 'dp') svg.appendChild(s('line', { 'class': 'og-cizgi og-ara', x1: y1(xF(f)), x2: y1(xF(f)), y1: y0 + T, y2: y0 + PH - B }));
        svg.appendChild(s('text', { 'class': 'og-yazi', x: y1(xF(f)), y: y0 + PH - B + 12, 'text-anchor': 'middle', text: String(f / 1000).replace('.', ',') + 'k' }));
      });
      svg.appendChild(s('rect', { 'class': 'og-cerceve', x: L, y: y0 + T, width: W - L - R, height: PH - T - B }));
      var kulaklar = KULAKLAR.filter(function (k) { return x[k] && x[k][t]; });
      kulaklar.forEach(function (k, ki) {
        var dv = x[k][t], g = s('g', { 'class': 'og-kulak ' + k });
        var fs = fl.filter(function (f) { return dv[String(f)]; });
        if (t === 'dp') {
          var sp = [], gp = [];
          fs.forEach(function (f) { sp.push(y1(xF(f)) + ',' + y1(yD(dv[String(f)].s))); gp.push(y1(xF(f)) + ',' + y1(yD(dv[String(f)].g))); });
          if (gp.length > 1) g.appendChild(s('polyline', { 'class': 'og-hat kemik ' + k, points: gp.join(' ') }));
          if (sp.length > 1) g.appendChild(s('polyline', { 'class': 'og-hat ' + k, points: sp.join(' ') }));
          fs.forEach(function (f) {
            var px = xF(f), py = yD(dv[String(f)].s), r = 4.5;
            if (k === 'sag') g.appendChild(s('circle', { 'class': 'os sag', cx: y1(px), cy: y1(py), r: r }));
            else {
              g.appendChild(s('line', { 'class': 'os sol', x1: y1(px - r * .85), y1: y1(py - r * .85), x2: y1(px + r * .85), y2: y1(py + r * .85) }));
              g.appendChild(s('line', { 'class': 'os sol', x1: y1(px - r * .85), y1: y1(py + r * .85), x2: y1(px + r * .85), y2: y1(py - r * .85) }));
            }
          });
        } else {
          var bant = (W - L - R) / fl.length, cw = Math.min(16, bant / 2 - 4), off = kulaklar.length === 2 ? (ki === 0 ? -cw / 2 - 1 : cw / 2 + 1) : 0;
          fs.forEach(function (f) {
            var cx = xF(f) + off, ds = dv[String(f)], taban = yD(enAz);
            g.appendChild(s('rect', { 'class': 'oae-cubuk ' + k, x: y1(cx - cw / 2), y: y1(Math.min(yD(ds.s), taban)), width: y1(cw), height: y1(Math.abs(taban - yD(ds.s))) }));
            g.appendChild(s('rect', { 'class': 'oae-gurultu', x: y1(cx - cw / 2), y: y1(Math.min(yD(ds.g), taban)), width: y1(cw), height: y1(Math.abs(taban - yD(ds.g))) }));
          });
        }
        svg.appendChild(g);
      });
    });
    return svg;
  }
  function oaeGrafik(x, basliksiz) {
    var svg = oaeSvg(x);
    if (!svg) return null;
    return h('div', { 'class': 'timpan-kap' }, [
      basliksiz ? null : h('div', { 'class': 'og-baslik', text: M('vt-metinler', 'oBaslik') || 'OAE' }),
      svg,
      h('p', { 'class': 'note', text: M('vt-metinler', 'oLejant') })
    ]);
  }
  // [[başlık, sağ, sol], ...]
  function oaeSatirlari(x) {
    if (!x) return [];
    var satirlar = [], kural = oKural();
    function satir(baslik, fn) {
      var d = KULAKLAR.map(function (k) { return x[k] ? fn(x[k], k) : ''; });
      if (d.some(Boolean)) satirlar.push([baslik, d[0] || '–', d[1] || '–']);
    }
    O_TESTLER.forEach(function (t) {
      satir(O_AD[t] + ' sonucu', function (e, k) { return oSonuc(e, t).metin; });
      O_FREK[t].forEach(function (f) {
        satir(O_AD[t] + ' ' + f + ' Hz', function (e) { var d = e[t] && e[t][String(f)]; return d ? bir(d.s) + ' / ' + bir(d.g) + (snr(d) >= kural.snr ? ' ✓' : '') : ''; });
      });
      if (t === 'te') {
        satir(M('vt-metinler', 'oRepro'), function (e) { return e.repro != null ? '%' + e.repro : ''; });
        satir(M('vt-metinler', 'oStab'), function (e) { return e.stab != null ? '%' + e.stab : ''; });
      }
    });
    return satirlar;
  }
  function oaeAyrinti(x) {
    var st = oaeSatirlari(x);
    if (!st.length) return null;
    var parca = [h('h4', { text: M('vt-metinler', 'oBaslik') || 'OAE' })];
    var g = oaeGrafik(x, true); if (g) parca.push(g);
    parca.push(h('table', { 'class': 'esik-tablo ek-tablo' }, [
      h('thead', null, [h('tr', null, [h('th', { text: '' }), h('th', { 'class': 'sag', text: 'Sağ' }), h('th', { 'class': 'sol', text: 'Sol' })])]),
      h('tbody', null, st.map(function (r) { return h('tr', null, [h('th', { text: r[0] }), h('td', { text: r[1] }), h('td', { text: r[2] })]); }))
    ]));
    parca.push(h('p', { 'class': 'note', text: M('vt-metinler', 'oNot') }));
    return h('div', { 'class': 'tablo-kap' }, parca);
  }
  var oaeCsv = [];
  KULAKLAR.forEach(function (k) {
    O_TESTLER.forEach(function (t) {
      oaeCsv.push({ ad: KULAK_AD[k] + ' ' + O_AD[t] + ' sonuç', al: function (x) { return x && x[k] ? oSonuc(x[k], t).metin : ''; } });
      O_FREK[t].forEach(function (f) {
        oaeCsv.push(
          { ad: KULAK_AD[k] + ' ' + O_AD[t] + ' ' + f + ' sinyal (dB SPL)', al: function (x) { var d = x && x[k] && x[k][t] && x[k][t][String(f)]; return d ? bir(d.s) : ''; } },
          { ad: KULAK_AD[k] + ' ' + O_AD[t] + ' ' + f + ' gürültü (dB SPL)', al: function (x) { var d = x && x[k] && x[k][t] && x[k][t][String(f)]; return d ? bir(d.g) : ''; } }
        );
      });
    });
    oaeCsv.push(
      { ad: KULAK_AD[k] + ' TEOAE tekrarlanabilirlik (%)', al: function (x) { return x && x[k] && x[k].repro != null ? x[k].repro : ''; } },
      { ad: KULAK_AD[k] + ' TEOAE stabilite (%)', al: function (x) { return x && x[k] && x[k].stab != null ? x[k].stab : ''; } }
    );
  });

  window.VakaTestleri.push({
    alan: 'oae',
    baslik: function () { return M('vt-metinler', 'oBaslik') || 'OAE'; },
    not: function () { return M('vt-metinler', 'oLejant') + ' ' + M('vt-metinler', 'oNot'); },
    temizle: oaeTemizle,
    formOku: function (hatalar) { return oaeFormOku(hatalar, false); },
    formDoldur: oaeFormDoldur,
    ayrinti: oaeAyrinti,
    ozet: function (x) {
      if (!x) return '';
      var p = O_TESTLER.map(function (t) {
        var l = KULAKLAR.map(function (k) { var r = oSonuc(x[k], t); return r.kod ? KULAK_AD[k].toLowerCase() + ' ' + { gecti: 'geçti', kaldi: 'kaldı', gecersiz: 'geçersiz kayıt', yetersiz: 'değerlendirilemedi' }[r.kod] : ''; }).filter(Boolean);
        return l.length ? O_AD[t] + ': ' + l.join(', ') : '';
      }).filter(Boolean);
      return p.join(' · ');
    },
    satirlar: oaeSatirlari,
    svg: oaeSvg,
    csv: oaeCsv
  });
})();

