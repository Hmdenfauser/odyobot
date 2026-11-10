/* Odyogram çıktısı: JPEG ya da PDF (ek kütüphane yok).
   Yol: sayfa bir SVG olarak kurulur (yazı tipleri içine gömülü) → <canvas>'a çizilir → JPEG.
   PDF istenirse bu JPEG, aşağıdaki küçük PDF yazıcıyla A4 sayfaya yerleştirilir.
   Dosya yalnızca kullanıcı "İndir" ya da "Paylaş"a basınca oluşur; hiçbir sunucuya gönderilmez. */
(function () {
  'use strict';
  var U = window.OdyoUI, V = window.OdyoVaka;
  if (!U || !V || !document.getElementById('v-cikti')) return;
  var h = U.h, $ = U.$;
  var NS = 'http://www.w3.org/2000/svg';

  var GEN = 800, KENAR = 40, OLCEK = 2;        // sayfa genişliği (birim), kenar boşluğu, piksel çarpanı (keskinlik)
  var JPEG_KALITE = 0.92;

  function s(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  /* ---------- renkler: styles.css içindeki --cikti-* değişkenleri ---------- */
  function renkler() {
    var cs = getComputedStyle(document.documentElement);
    function r(ad) { return cs.getPropertyValue('--cikti-' + ad).trim(); }
    return { zemin: r('zemin'), yazi: r('yazi'), soluk: r('soluk'), cizgi: r('cizgi'), bant: r('bant'), sag: r('sag'), sol: r('sol') };
  }

  /* ---------- yazı tipleri: fonts/ klasöründen okunup SVG'ye gömülür ---------- */
  var ARALIK_LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
  var ARALIK_EXT = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF';
  var FONTLAR = [
    { aile: 'IBM Plex Sans', agirlik: '100 900', dosya: 'plexsans-latin', aralik: ARALIK_LATIN },
    { aile: 'IBM Plex Sans', agirlik: '100 900', dosya: 'plexsans-latin-ext', aralik: ARALIK_EXT },
    { aile: 'IBM Plex Mono', agirlik: '400', dosya: 'plexmono-latin-400', aralik: ARALIK_LATIN },
    { aile: 'IBM Plex Mono', agirlik: '400', dosya: 'plexmono-latin-ext-400', aralik: ARALIK_EXT },
    { aile: 'Bricolage Grotesque', agirlik: '100 900', dosya: 'bricolage-latin', aralik: ARALIK_LATIN },
    { aile: 'Bricolage Grotesque', agirlik: '100 900', dosya: 'bricolage-latin-ext', aralik: ARALIK_EXT }
  ];
  function base64(buf) {
    var b = new Uint8Array(buf), parca = [], ADIM = 0x8000;
    for (var i = 0; i < b.length; i += ADIM) parca.push(String.fromCharCode.apply(null, b.subarray(i, i + ADIM)));
    return btoa(parca.join(''));
  }
  var fontCssSoz = null;
  function fontCss() {
    // Bir kez hazırlanır. Okunamazsa (çok eski önbellek vb.) cihazın kendi yazı tipiyle devam edilir.
    if (!fontCssSoz) fontCssSoz = Promise.all(FONTLAR.map(function (f) {
      return fetch('fonts/' + f.dosya + '.woff2').then(function (r) {
        if (!r.ok) throw new Error('font');
        return r.arrayBuffer();
      }).then(function (buf) {
        return "@font-face{font-family:'" + f.aile + "';font-weight:" + f.agirlik + ";src:url(data:font/woff2;base64," + base64(buf) + ") format('woff2');unicode-range:" + f.aralik + ';}';
      }).catch(function () { return ''; });
    })).then(function (l) { return l.join(''); });
    return fontCssSoz;
  }

  // Ekrandaki odyogram sınıflarının çıktı karşılığı (sabit renklerle; ekran temasından etkilenmez).
  function stilMetni(R, fontlar) {
    return fontlar +
      "text{font-family:'IBM Plex Sans',system-ui,sans-serif;fill:" + R.yazi + '}' +
      ".baslik{font-family:'Bricolage Grotesque','IBM Plex Sans',sans-serif;font-weight:700;font-size:26px}" +
      '.alt{font-size:15px;fill:' + R.soluk + '}' +
      '.bolum{font-weight:600;font-size:16px}' +
      '.etiket{font-size:13.5px;fill:' + R.soluk + '}' +
      '.deger{font-size:13.5px;font-weight:500}' +
      '.kucuk{font-size:11.5px;fill:' + R.soluk + '}' +
      ".mono{font-family:'IBM Plex Mono',ui-monospace,monospace}" +
      '.kulak-sag{fill:' + R.sag + '}.kulak-sol{fill:' + R.sol + '}' +
      '.ayrac{stroke:' + R.cizgi + ';stroke-width:1}' +
      '.og-bant{fill:' + R.bant + ';fill-opacity:.10}' +
      '.og-bant-lj{stroke:' + R.bant + ';stroke-opacity:.35;stroke-width:1}' +
      '.og-cizgi{stroke:' + R.cizgi + ';stroke-width:1}' +
      '.og-cizgi.og-ara{stroke-dasharray:2 3}' +
      '.og-cizgi.og-sifir{stroke:' + R.soluk + ';stroke-opacity:.6}' +
      '.og-cerceve{fill:none;stroke:' + R.soluk + ';stroke-opacity:.7;stroke-width:1}' +
      ".og-yazi{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:9px;fill:" + R.soluk + '}' +
      '.os{fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
      '.os.sag{stroke:' + R.sag + '}.os.sol{stroke:' + R.sol + '}.notr .os{stroke:' + R.soluk + '}' +
      '.og-hat{fill:none;stroke-width:1.6;stroke-linejoin:round}' +
      '.og-hat.sag{stroke:' + R.sag + '}.og-hat.sol{stroke:' + R.sol + '}' +
      '.og-hat.kemik{stroke-dasharray:5 4}.og-hat.notr{stroke:' + R.soluk + '}';
  }

  /* ---------- metin ölçme ve satır kırma (sayfadaki yazı tipiyle) ---------- */
  var olcCtx = null;
  function genislik(metin, font) {
    if (!olcCtx) olcCtx = document.createElement('canvas').getContext('2d');
    olcCtx.font = font;
    return olcCtx.measureText(metin).width;
  }
  function satirKir(metin, font, enCok) {
    var sonuc = [];
    String(metin).split(/\r?\n/).forEach(function (paragraf) {
      var kelimeler = paragraf.split(/\s+/).filter(Boolean), satir = '';
      if (!kelimeler.length) { sonuc.push(''); return; }
      kelimeler.forEach(function (k) {
        var dene = satir ? satir + ' ' + k : k;
        if (!satir || genislik(dene, font) <= enCok) satir = dene;
        else { sonuc.push(satir); satir = k; }
      });
      sonuc.push(satir);
    });
    return sonuc;
  }
  var FONT_GOVDE = "13.5px 'IBM Plex Sans', sans-serif";

  /* ---------- sayfayı kur (SVG) ---------- */
  function odyogramYerlestir(kok, v, x, y, w, kulaklar) {
    var og = V.cizOdyogram(v, kulaklar ? { kulaklar: kulaklar } : {});
    var vb = og.getAttribute('viewBox').split(' ');
    var oran = (+vb[3]) / (+vb[2]);
    og.removeAttribute('role'); og.removeAttribute('aria-label');
    og.setAttribute('x', x); og.setAttribute('y', y);
    og.setAttribute('width', w); og.setAttribute('height', Math.round(w * oran));
    kok.appendChild(og);
    return Math.round(w * oran);
  }

  function sayfaKur(v, detayli, R, fontlar) {
    var kok = s('svg', { xmlns: NS, viewBox: '0 0 ' + GEN + ' 100', width: GEN, height: 100 });
    kok.appendChild(s('style', { text: stilMetni(R, fontlar) }));
    var zemin = s('rect', { x: 0, y: 0, width: GEN, height: 100, fill: R.zemin });
    kok.appendChild(zemin);
    var ic = GEN - 2 * KENAR, y = KENAR;
    function yazi(x, yy, metin, sinif, ek) {
      var a = { x: x, y: yy, 'class': sinif || '', text: metin };
      if (ek) for (var k in ek) a[k] = ek[k];
      kok.appendChild(s('text', a));
    }
    function ayrac() { kok.appendChild(s('line', { 'class': 'ayrac', x1: KENAR, x2: GEN - KENAR, y1: y, y2: y })); }

    if (detayli) {
      yazi(KENAR, y + 24, 'Odyogram', 'baslik');
      yazi(GEN - KENAR, y + 22, 'OdyoBOT', 'kucuk mono', { 'text-anchor': 'end' });
      y += 50;
      yazi(KENAR, y, 'Vaka: ' + v.kimlik + '   ·   Tarih: ' + (U.fmtDate(v.tarih) || 'yok'), 'alt');
      y += 22; ayrac(); y += 24;
    }

    // Odyogram: ekrandaki "tek / ayrı" seçimine uyar.
    if (!V.grafikAyri()) {
      var w = detayli ? 600 : ic;
      y += odyogramYerlestir(kok, v, (GEN - w) / 2, y, w) + 16;
    } else {
      var aralik = 20, w2 = (ic - aralik) / 2, yuk = 0;
      V.KULAKLAR.forEach(function (k, i) {
        var x = KENAR + i * (w2 + aralik);
        yazi(x + 4, y + 14, V.KULAK_AD[k].toLocaleUpperCase('tr-TR') + ' KULAK', 'mono kulak-' + k, { 'font-size': '13px', 'letter-spacing': '1' });
        yuk = odyogramYerlestir(kok, v, x, y + 22, w2, [k]);
      });
      y += 22 + yuk + 16;
    }

    // Lejant (yazılar ekrandaki gibi; yönetici değiştirdiyse o hâli).
    var lj = V.lejant(), sutun = 2, sg = ic / sutun, satirY = 26;
    lj.forEach(function (x, i) {
      var lx = KENAR + (i % sutun) * sg, ly = y + Math.floor(i / sutun) * satirY;
      var ikon = V.lejantSembol(x.tanim);
      ikon.setAttribute('x', lx); ikon.setAttribute('y', ly); ikon.setAttribute('width', 34); ikon.setAttribute('height', 26.7);
      kok.appendChild(ikon);
      var metin = x.metin, f = "12.5px 'IBM Plex Sans', sans-serif";
      while (metin.length > 4 && genislik(metin, f) > sg - 46) metin = metin.slice(0, -2) + '…';
      yazi(lx + 40, ly + 18, metin, '', { 'font-size': '12.5px' });
    });
    y += Math.ceil(lj.length / sutun) * satirY + 12;

    if (detayli) {
      // Sonuç: iki sütun, sağ ve sol kulak.
      ayrac(); y += 30;
      yazi(KENAR, y, 'Sonuç', 'bolum'); y += 24;
      var kw = (ic - 24) / 2, enAlt = y;
      V.KULAKLAR.forEach(function (k, i) {
        var x = KENAR + i * (kw + 24), yy = y;
        yazi(x, yy, V.KULAK_AD[k].toLocaleUpperCase('tr-TR') + ' KULAK', 'mono kulak-' + k, { 'font-size': '13px', 'letter-spacing': '1' });
        yy += 22;
        var satirlar = V.sonucSatirlari(v, k);
        if (!satirlar) { yazi(x, yy, 'Bu kulak için değer girilmedi.', 'etiket'); yy += 20; }
        else satirlar.forEach(function (st) {
          yazi(x, yy, st[0], 'etiket'); yy += 18;
          satirKir(st[1], "500 13.5px 'IBM Plex Sans', sans-serif", kw).forEach(function (l) { yazi(x, yy, l, 'deger'); yy += 18; });
          yy += 6;
        });
        enAlt = Math.max(enAlt, yy);
      });
      y = enAlt;
      yazi(KENAR, y, 'Ortalama frekansları: ' + V.ptaFrekanslari().join(', ') + ' Hz', 'kucuk'); y += 16;

      // Ek ölçümler: tablo (başlık | sağ | sol).
      var ek = V.ekSatirlari(v), weber = V.weberMetni(v);
      if (ek.length || weber) {
        y += 14; ayrac(); y += 30;
        yazi(KENAR, y, 'Ek ölçümler', 'bolum'); y += 24;
        var c1 = KENAR, c2 = KENAR + 260, c3 = KENAR + 470;
        if (ek.length) {
          yazi(c2, y, 'SAĞ', 'mono kulak-sag', { 'font-size': '12px' });
          yazi(c3, y, 'SOL', 'mono kulak-sol', { 'font-size': '12px' });
          y += 20;
          ek.forEach(function (st) {
            yazi(c1, y, st[0], 'etiket'); yazi(c2, y, st[1], 'deger'); yazi(c3, y, st[2], 'deger');
            y += 20;
          });
        }
        if (weber) { yazi(c1, y, 'Weber', 'etiket'); yazi(c2, y, weber, 'deger'); y += 20; }
      }

      // Notlar.
      if (v.notlar) {
        y += 14; ayrac(); y += 30;
        yazi(KENAR, y, 'Notlar', 'bolum'); y += 22;
        satirKir(v.notlar, FONT_GOVDE, ic).forEach(function (l) { yazi(KENAR, y, l, 'deger', { 'font-weight': '400' }); y += 19; });
      }

      y += 18; ayrac(); y += 20;
      yazi(KENAR, y, 'OdyoBOT ile oluşturuldu · ' + U.fmtDate(U.todayISO()) + ' · Değerler dB HL.', 'kucuk');
      y += 6;
    }

    var H = Math.ceil(y + KENAR * (detayli ? 0.8 : 0.5));
    kok.setAttribute('viewBox', '0 0 ' + GEN + ' ' + H); kok.setAttribute('height', H);
    zemin.setAttribute('height', H);
    return { svg: kok, H: H };
  }

  /* ---------- SVG → JPEG ---------- */
  function jpegYap(v, detayli) {
    var R = renkler();
    var hazir = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load(FONT_GOVDE, 'ğüşiöçİ'), document.fonts.load("500 13.5px 'IBM Plex Sans'", 'ğ')]).catch(function () {})
      : Promise.resolve();
    return Promise.all([fontCss(), hazir]).then(function (l) {
      var sayfa = sayfaKur(v, detayli, R, l[0]);
      var metin = new XMLSerializer().serializeToString(sayfa.svg);
      var url = URL.createObjectURL(new Blob([metin], { type: 'image/svg+xml;charset=utf-8' }));
      return new Promise(function (ok, red) {
        var img = new Image();
        img.onload = function () {
          // Gömülü yazı tiplerinin çözülmesi için kısa bir bekleme (bazı tarayıcılar ilk karede çizmez).
          setTimeout(function () {
            try {
              var c = document.createElement('canvas');
              c.width = GEN * OLCEK; c.height = sayfa.H * OLCEK;
              var ctx = c.getContext('2d');
              ctx.fillStyle = R.zemin; ctx.fillRect(0, 0, c.width, c.height);
              ctx.drawImage(img, 0, 0, c.width, c.height);
              URL.revokeObjectURL(url);
              c.toBlob(function (b) {
                if (!b) return red(new Error('jpeg'));
                ok({ blob: b, w: c.width, h: c.height });
              }, 'image/jpeg', JPEG_KALITE);
            } catch (e) { URL.revokeObjectURL(url); red(e); }
          }, 150);
        };
        img.onerror = function () { URL.revokeObjectURL(url); red(new Error('svg')); };
        img.src = url;
      });
    });
  }

  /* ---------- küçük PDF yazıcı: tek A4 sayfa, içinde bir JPEG ---------- */
  function pdfYap(jpegBuf, pw, ph) {
    var A4W = 595.28, A4H = 841.89, M = 28;
    var sc = Math.min((A4W - 2 * M) / pw, (A4H - 2 * M) / ph);
    var w = pw * sc, hh = ph * sc, x = (A4W - w) / 2, y = A4H - M - hh;
    function f(n) { return (Math.round(n * 100) / 100).toString(); }
    var enc = new TextEncoder(), parcalar = [], uzunluk = 0, konum = [];
    function ekle(p) { if (typeof p === 'string') p = enc.encode(p); parcalar.push(p); uzunluk += p.length; }
    function nesne(no, govde) { konum[no] = uzunluk; ekle(no + ' 0 obj\n'); govde(); ekle('\nendobj\n'); }
    var icerik = 'q ' + f(w) + ' 0 0 ' + f(hh) + ' ' + f(x) + ' ' + f(y) + ' cm /Im0 Do Q';
    var jpeg = new Uint8Array(jpegBuf);
    ekle('%PDF-1.4\n%âãÏÓ\n');
    nesne(1, function () { ekle('<< /Type /Catalog /Pages 2 0 R >>'); });
    nesne(2, function () { ekle('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'); });
    nesne(3, function () { ekle('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + f(A4W) + ' ' + f(A4H) + '] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>'); });
    nesne(4, function () { ekle('<< /Length ' + icerik.length + ' >>\nstream\n' + icerik + '\nendstream'); });
    nesne(5, function () {
      ekle('<< /Type /XObject /Subtype /Image /Width ' + pw + ' /Height ' + ph + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n');
      ekle(jpeg); ekle('\nendstream');
    });
    nesne(6, function () { ekle('<< /Title (Odyogram) /Producer (OdyoBOT) >>'); });
    var xref = uzunluk, satirlar = ['xref', '0 7', '0000000000 65535 f '];
    for (var i = 1; i <= 6; i++) satirlar.push(String(konum[i]).padStart(10, '0') + ' 00000 n ');
    ekle(satirlar.join('\n') + '\ntrailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parcalar, { type: 'application/pdf' });
  }

  /* ---------- dosya üretme, indirme, paylaşma ---------- */
  function dosyaAdi(v, uzanti) {
    var tr = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
    var etiket = String(v.kimlik || 'vaka').replace(/[çğıİöşüÇĞÖŞÜ]/g, function (c) { return tr[c]; })
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'vaka';
    return 'odyogram-' + etiket + '-' + (v.tarih || U.todayISO()) + '.' + uzanti;
  }
  function uret(v, detayli, pdf) {
    return jpegYap(v, detayli).then(function (j) {
      if (!pdf) return { blob: j.blob, ad: dosyaAdi(v, 'jpg'), tur: 'image/jpeg' };
      return j.blob.arrayBuffer().then(function (buf) {
        return { blob: pdfYap(buf, j.w, j.h), ad: dosyaAdi(v, 'pdf'), tur: 'application/pdf' };
      });
    });
  }

  var secim = { detayli: true, pdf: false };
  function bas(b, on) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function secimCiz() { bas($('c-detayli'), secim.detayli); bas($('c-sade'), !secim.detayli); bas($('c-jpeg'), !secim.pdf); bas($('c-pdf'), secim.pdf); }
  $('c-detayli').addEventListener('click', function () { secim.detayli = true; secimCiz(); });
  $('c-sade').addEventListener('click', function () { secim.detayli = false; secimCiz(); });
  $('c-jpeg').addEventListener('click', function () { secim.pdf = false; secimCiz(); });
  $('c-pdf').addEventListener('click', function () { secim.pdf = true; secimCiz(); });

  function mesaj(t, hata) { $('c-msg').textContent = t; $('c-msg').className = 'msg' + (hata ? ' err' : ''); }
  var calisiyor = false;
  function isle(paylas) {
    var v = V.acik();
    if (!v || calisiyor) return;
    calisiyor = true; mesaj('Hazırlanıyor…');
    uret(v, secim.detayli, secim.pdf).then(function (d) {
      if (paylas) {
        var dosya = new File([d.blob], d.ad, { type: d.tur });
        return navigator.share({ files: [dosya], title: 'Odyogram' }).then(function () { mesaj('Paylaşıldı: ' + d.ad); }, function (e) {
          if (e && e.name === 'AbortError') { mesaj(''); return; }
          mesaj('Paylaşılamadı. "İndir" düğmesini dene.', true);
        });
      }
      var url = URL.createObjectURL(d.blob);
      var a = h('a', { href: url, download: d.ad, hidden: '' });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
      mesaj('Hazır: ' + d.ad);
    }).catch(function () {
      mesaj('Çıktı hazırlanamadı. Sayfayı yenileyip tekrar dene.', true);
    }).then(function () { calisiyor = false; });
  }
  $('c-indir').addEventListener('click', function () { isle(false); });
  $('c-paylas').addEventListener('click', function () { isle(true); });

  var paylasilabilir = false;
  try {
    paylasilabilir = !!(navigator.canShare && window.File &&
      navigator.canShare({ files: [new File(['x'], 'deneme.jpg', { type: 'image/jpeg' })] }));
  } catch (e) { paylasilabilir = false; }
  $('c-paylas').hidden = !paylasilabilir;

  // Test için (tarayıcı konsolundan): OdyoCikti.uret(vaka, detayli, pdf) → { blob, ad, tur }
  window.OdyoCikti = { uret: uret, pdfYap: pdfYap };
})();
