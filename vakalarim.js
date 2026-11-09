/* Vakalarım: odyometri vaka kayıtları.
   Kayıtlar yalnızca bu cihazda (tarayıcının yerel deposunda) tutulur, hiçbir sunucuya gönderilmez (CLAUDE.md §5, §8).
   Bölümler: sabitler → veri temizleme → veri katmanı (VakaDeposu) → form → liste ve ayrıntı → yedekleme. */
(function () {
  'use strict';
  var U = window.OdyoUI;
  if (!U || !document.getElementById('vakalarim')) return;
  var h = U.h, $ = U.$;
  var Hesap = window.OdyoHesap;   // hesaplama kuralları: odyo-hesap.js

  /* ---------- sabitler ---------- */
  var ANA_FREKANSLAR = [125, 250, 500, 1000, 2000, 4000, 8000];
  var ARA_FREKANSLAR = [750, 1500, 3000, 6000];
  var TUM_FREKANSLAR = ANA_FREKANSLAR.concat(ARA_FREKANSLAR).sort(function (a, b) { return a - b; });
  var DB_EN_AZ = -10, DB_EN_COK = 120;          // dB HL giriş aralığı (tam sayı, 1'er dB)
  var KULAKLAR = ['sag', 'sol'], YOLLAR = ['hava', 'kemik'];
  var KULAK_AD = { sag: 'Sağ', sol: 'Sol' }, YOL_AD = { hava: 'Hava', kemik: 'Kemik' };
  var HATIRLATMA_ARALIGI = 10;                  // her 10 yeni kayıtta bir "yedek al" hatırlatması
  var SAYAC_ANAHTAR = 'odybot:yedekSayac', KAPALI_ANAHTAR = 'odybot:hatirlatmaKapali';

  function araMi(f) { return ARA_FREKANSLAR.indexOf(+f) !== -1; }
  function yeniId() { return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function ayarOku(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ayarYaz(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, String(v)); } catch (e) { /* önemsiz ayar */ } }

  /* ---------- dB değeri okuma ----------
     Boş → { bos: true } (hata değil). Geçerli tam sayı → { deger }. Değilse → { hata: 'kısa uyarı' }. */
  function sayiOku(metin, enAz, enCok) {
    var s = String(metin == null ? '' : metin).trim().replace('−', '-');
    if (s === '') return { bos: true };
    if (!/^-?\d+$/.test(s)) return { hata: 'Tam sayı gir.' };
    var n = parseInt(s, 10);
    if (n < enAz || n > enCok) return { hata: enAz + ' ile ' + enCok + ' arasında olmalı.' };
    return { deger: n };
  }
  function alanOku(el, enAz, enCok) {
    if (el.validity && el.validity.badInput) return { hata: 'Geçerli bir sayı gir.' };
    return sayiOku(el.value, enAz, enCok);
  }

  /* ---------- veri temizleme ----------
     Her kayıt yazılmadan ve okunmadan önce buradan geçer. Eski "Geçmiş" kayıtlarını (etiket, not) yeni biçime taşır.
     kati = true (yedekten geri yükleme): en küçük sorunda hata fırlatır, hiçbir şey yazılmaz.
     kati = false (cihazdaki kayıtlar): bozuk parçayı atlar, kaydın geri kalanını korur. */
  function metinAl(x, max) { return typeof x === 'string' ? x.trim().slice(0, max) : ''; }
  function tarihAl(x) { return typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : ''; }
  function zamanAl(x) { return typeof x === 'number' && isFinite(x) && x > 0 ? x : 0; }
  function tamSayiMi(n, a, b) { return typeof n === 'number' && Math.floor(n) === n && n >= a && n <= b; }

  function temizle(v, idVarsayilan, kati) {
    function sorun(m) { if (kati) throw new Error(m); }
    if (!v || typeof v !== 'object' || Array.isArray(v)) { sorun('kayıt biçimi yanlış'); return null; }
    var kimlik = metinAl(v.kimlik != null ? v.kimlik : v.etiket, 40);
    if (!kimlik) { sorun('vaka kimliği yok'); kimlik = 'Adsız vaka'; }
    var id = typeof v.id === 'string' && /^[\w-]{1,64}$/.test(v.id) ? v.id : (idVarsayilan || yeniId());
    var simdi = Date.now();
    var out = {
      id: id, surum: 1, kimlik: kimlik,
      tarih: tarihAl(v.tarih),
      notlar: metinAl(v.notlar != null ? v.notlar : v.not, 2000),
      olusturma: zamanAl(v.olusturma) || simdi,
      guncelleme: zamanAl(v.guncelleme) || zamanAl(v.olusturma) || simdi,
      esik: { sag: { hava: {}, kemik: {} }, sol: { hava: {}, kemik: {} } }
    };
    if (v.tarih != null && v.tarih !== '' && !out.tarih) sorun('tarih okunamadı');
    var esik = v.esik;
    if (esik != null && (typeof esik !== 'object' || Array.isArray(esik))) { sorun('eşik verisi okunamadı'); esik = null; }
    esik = esik || {};
    KULAKLAR.forEach(function (k) {
      YOLLAR.forEach(function (y) {
        var kaynak = esik[k] && esik[k][y];
        if (kaynak == null) return;
        if (typeof kaynak !== 'object' || Array.isArray(kaynak)) { sorun(KULAK_AD[k] + ' ' + YOL_AD[y].toLowerCase() + ' yolu okunamadı'); return; }
        Object.keys(kaynak).forEach(function (f) {
          var ad = KULAK_AD[k] + ' ' + YOL_AD[y].toLowerCase() + ' yolu ' + f + ' Hz';
          if (TUM_FREKANSLAR.indexOf(+f) === -1) { sorun(ad + ': tanınmayan frekans'); return; }
          var e = kaynak[f];
          if (!e || typeof e !== 'object' || !tamSayiMi(e.db, DB_EN_AZ, DB_EN_COK)) { sorun(ad + ': değer geçersiz'); return; }
          var t = { db: e.db };
          if (e.maskeli === true) {
            t.maskeli = true;
            if (e.maskDb != null) {
              if (tamSayiMi(e.maskDb, DB_EN_AZ, DB_EN_COK)) t.maskDb = e.maskDb;
              else sorun(ad + ': maskeleme düzeyi geçersiz');
            }
          }
          if (e.nr === true) t.nr = true;
          out.esik[k][y][String(+f)] = t;
        });
      });
    });
    return out;
  }

  /* ---------- veri katmanı ----------
     Ekran kodu yalnızca bu arayüzü kullanır: hepsi(), kaydet(v), sil(id), hepsiniYaz(liste), degisince(fn).
     Hepsi Promise döner. Şimdilik içi localStorage ("odybot:vakalar"). Fotoğraf eklenince yalnızca bu bölümün içi
     IndexedDB'ye çevrilir; ekran kodu değişmez. */
  var VakaDeposu = (function () {
    var ANAHTAR = 'odybot:vakalar';
    var dinleyiciler = [];
    function hamOku() {
      var ham = localStorage.getItem(ANAHTAR);
      if (!ham) return {};
      var o;
      try { o = JSON.parse(ham); } catch (e) {
        // Bozuk veri: üzerine yazmadan önce bir kopyasını sakla, yazmayı engelle.
        try { if (!localStorage.getItem(ANAHTAR + '-bozuk')) localStorage.setItem(ANAHTAR + '-bozuk', ham); } catch (e2) {}
        throw new Error('Kayıtlı veri okunamadı.');
      }
      return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
    }
    function listeOku() {
      var o = hamOku();
      return Object.keys(o).map(function (id) { return temizle(o[id], id, false); }).filter(Boolean);
    }
    function yaz(liste) {
      var o = {};
      liste.forEach(function (v) { o[v.id] = v; });
      // Tek bir yazma işlemi: başarısız olursa (depolama dolu) eski veri olduğu gibi kalır.
      localStorage.setItem(ANAHTAR, JSON.stringify(o));
    }
    function bildir() { dinleyiciler.forEach(function (f) { try { f(); } catch (e) {} }); }
    function dene(fn) { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } }
    window.addEventListener('storage', function (e) { if (e.key === ANAHTAR) bildir(); });
    return {
      hepsi: function () { return dene(listeOku); },
      kaydet: function (v) {
        return dene(function () {
          var l = listeOku().filter(function (x) { return x.id !== v.id; });
          l.push(temizle(v, v.id, false)); yaz(l); bildir(); return v;
        });
      },
      sil: function (id) {
        return dene(function () { yaz(listeOku().filter(function (x) { return x.id !== id; })); bildir(); });
      },
      hepsiniYaz: function (liste) {
        return dene(function () { yaz(liste.map(function (v) { return temizle(v, v.id, false); })); bildir(); });
      },
      degisince: function (fn) { dinleyiciler.push(fn); }
    };
  })();
  window.VakaDeposu = VakaDeposu;

  function siralaVakalar(l) {
    return l.slice().sort(function (a, b) {
      if (a.tarih !== b.tarih) return (b.tarih || '') < (a.tarih || '') ? -1 : 1;
      return (b.olusturma || 0) - (a.olusturma || 0);
    });
  }
  function esikSayisi(v, k) {
    var n = 0;
    YOLLAR.forEach(function (y) { n += Object.keys((v.esik && v.esik[k] && v.esik[k][y]) || {}).length; });
    return n;
  }
  function esikMetni(e) {
    if (!e) return '';
    return e.db + (e.nr ? ' NR' : '') + (e.maskeli ? ' M' + (e.maskDb != null ? '(' + e.maskDb + ')' : '') : '');
  }

  /* ---------- odyogram çizimi (SVG) ----------
     Yatay eksen frekans (logaritmik, oktav aralıklı), dikey eksen dB HL (ters: küçük değerler üstte).
     Renkler CSS değişkenlerinden gelir (sağ kırmızı --right, sol mavi --left).
     Hava yolu çizgisi yalnızca komşu dolu noktaları birleştirir:
     - Arada boş bırakılmış bir ANA frekans varsa çizgi kopar (boş frekans atlanmaz).
     - Ara frekanslar (750, 1500, 3000, 6000) isteğe bağlı ölçüldüğü için boş olmaları çizgiyi koparmaz.
     - NR (yanıt yok) noktaları çizgiye bağlanmaz (yaygın odyogram kuralı); NR_CIZGIYE_BAGLA ile değiştirilebilir. */
  var NR_CIZGIYE_BAGLA = false;
  var NORMAL_BANT = [-10, 25];
  var SVGNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, kids) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function yuvarla(n) { return Math.round(n * 10) / 10; }
  function nokta(dizi) { return dizi.map(function (p) { return yuvarla(p[0]) + ',' + yuvarla(p[1]); }).join(' '); }

  // Tek bir odyogram sembolü. x, y: frekans çizgisi ve dB konumu; r: boyut.
  function sembolCiz(g, x, y, kulak, yol, maskeli, nr, r) {
    var c = 'os ' + kulak, d = kulak === 'sag' ? -1 : 1;
    var sx = x;
    if (yol === 'hava') {
      if (kulak === 'sag' && !maskeli) g.appendChild(s('circle', { 'class': c, cx: yuvarla(x), cy: yuvarla(y), r: yuvarla(r) }));
      else if (kulak === 'sag') g.appendChild(s('polygon', { 'class': c, points: nokta([[x, y - r * 1.15], [x - r * 1.1, y + r * 0.8], [x + r * 1.1, y + r * 0.8]]) }));
      else if (!maskeli) {
        g.appendChild(s('line', { 'class': c, x1: yuvarla(x - r * 0.85), y1: yuvarla(y - r * 0.85), x2: yuvarla(x + r * 0.85), y2: yuvarla(y + r * 0.85) }));
        g.appendChild(s('line', { 'class': c, x1: yuvarla(x - r * 0.85), y1: yuvarla(y + r * 0.85), x2: yuvarla(x + r * 0.85), y2: yuvarla(y - r * 0.85) }));
      } else g.appendChild(s('rect', { 'class': c, x: yuvarla(x - r * 0.9), y: yuvarla(y - r * 0.9), width: yuvarla(r * 1.8), height: yuvarla(r * 1.8) }));
    } else {
      // Kemik yolu: sağ "<" / "[" çizginin solunda, sol ">" / "]" sağında.
      sx = x + d * r * 1.3;
      var acik = sx - d * r * 0.5, uc = sx + d * r * 0.5;     // açık uç ve sivri uç
      if (!maskeli) g.appendChild(s('polyline', { 'class': c, points: nokta([[acik, y - r], [uc, y], [acik, y + r]]) }));
      else g.appendChild(s('polyline', { 'class': c, points: nokta([[acik, y - r * 1.1], [uc, y - r * 1.1], [uc, y + r * 1.1], [acik, y + r * 1.1]]) }));
    }
    if (nr) {
      // Yanıt yok: sembolden aşağı eğik ok (sağ kulakta sola, sol kulakta sağa).
      var x1 = sx + d * r * 0.7, y1 = y + r * 0.7, tx = sx + d * r * 2, ty = y + r * 2.3;
      g.appendChild(s('polyline', { 'class': c, points: nokta([[x1, y1], [tx, ty]]) }));
      g.appendChild(s('polyline', { 'class': c, points: nokta([[tx - d * r * 0.9, ty], [tx, ty], [tx, ty - r * 0.9]]) }));
    }
  }

  // vaka: { esik }, secenek: { kulaklar: ['sag','sol'], kucuk: true/false }
  function cizOdyogram(v, secenek) {
    secenek = secenek || {};
    var kucuk = !!secenek.kucuk, kulaklar = secenek.kulaklar || KULAKLAR;
    var W = kucuk ? 180 : 360, H = kucuk ? 158 : 324;
    var L = kucuk ? 4 : 32, R = kucuk ? 4 : 8, T = kucuk ? 4 : 22, B = kucuk ? 12 : 22, pad = kucuk ? 8 : 14;   // altta NR okları için boşluk
    var r = kucuk ? 4.2 : 5.5;
    function xK(f) { return L + pad + (Math.log(f / 125) / Math.LN2) / 6 * (W - L - R - 2 * pad); }
    function yK(db) { return T + (db - DB_EN_AZ) / (DB_EN_COK - DB_EN_AZ) * (H - T - B); }
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'odyogram' + (kucuk ? ' kucuk' : ''), role: 'img' });
    svg.setAttribute('aria-label', kucuk ? 'Küçük odyogram' : 'Odyogram' + (kulaklar.length === 1 ? ' (' + KULAK_AD[kulaklar[0]] + ' kulak)' : ''));
    // normal işitme bandı ve çerçeve
    svg.appendChild(s('rect', { 'class': 'og-bant', x: L, y: yuvarla(yK(NORMAL_BANT[0])), width: W - L - R, height: yuvarla(yK(NORMAL_BANT[1]) - yK(NORMAL_BANT[0])) }));
    // yatay çizgiler (her 10 dB) ve dB yazıları
    for (var db = DB_EN_AZ; db <= DB_EN_COK; db += 10) {
      if (kucuk && db % 20 !== 0) continue;
      svg.appendChild(s('line', { 'class': 'og-cizgi' + (db === 0 ? ' og-sifir' : ''), x1: L, x2: W - R, y1: yuvarla(yK(db)), y2: yuvarla(yK(db)) }));
      if (!kucuk) svg.appendChild(s('text', { 'class': 'og-yazi', x: L - 4, y: yuvarla(yK(db) + 3), 'text-anchor': 'end', text: String(db) }));
    }
    // dikey çizgiler: ana frekanslar düz, ara frekanslar kesikli
    TUM_FREKANSLAR.forEach(function (f) {
      if (kucuk && araMi(f)) return;
      svg.appendChild(s('line', { 'class': 'og-cizgi' + (araMi(f) ? ' og-ara' : ''), x1: yuvarla(xK(f)), x2: yuvarla(xK(f)), y1: T, y2: H - B }));
      if (!kucuk && !araMi(f)) svg.appendChild(s('text', { 'class': 'og-yazi', x: yuvarla(xK(f)), y: T - 8, 'text-anchor': 'middle', text: String(f) }));
    });
    if (!kucuk) svg.appendChild(s('text', { 'class': 'og-yazi og-birim', x: 2, y: T - 8, text: 'dB HL' }));
    svg.appendChild(s('rect', { 'class': 'og-cerceve', x: L, y: T, width: W - L - R, height: H - T - B }));

    var esik = (v && v.esik) || {};
    kulaklar.forEach(function (k) {
      var g = s('g', { 'class': 'og-kulak ' + k });
      // hava yolu çizgisi
      var hava = (esik[k] && esik[k].hava) || {};
      var parca = [], parcalar = [parca];
      TUM_FREKANSLAR.forEach(function (f) {
        var e = hava[String(f)];
        if (!e) { if (!araMi(f)) { parca = []; parcalar.push(parca); } return; }   // boş ana frekans: çizgi kopar
        if (e.nr && !NR_CIZGIYE_BAGLA) { parca = []; parcalar.push(parca); return; }
        parca.push([xK(f), yK(e.db)]);
      });
      parcalar.forEach(function (p) {
        if (p.length > 1) g.appendChild(s('polyline', { 'class': 'og-hat ' + k, points: nokta(p) }));
      });
      // semboller
      YOLLAR.forEach(function (y) {
        var yolV = (esik[k] && esik[k][y]) || {};
        TUM_FREKANSLAR.forEach(function (f) {
          var e = yolV[String(f)];
          if (e) sembolCiz(g, xK(f), yK(e.db), k, y, !!e.maskeli, !!e.nr, r);
        });
      });
      svg.appendChild(g);
    });
    return svg;
  }

  // Lejanttaki küçük semboller (index.html'deki data-sembol yer tutucularına çizilir).
  document.querySelectorAll('#v-grafik [data-sembol]').forEach(function (yer) {
    var p = yer.getAttribute('data-sembol').split(' ');
    var svg = s('svg', { viewBox: '0 0 28 22', 'class': 'lj-svg', 'aria-hidden': 'true' });
    if (p[0] === 'bant') svg.appendChild(s('rect', { 'class': 'og-bant og-bant-lj', x: 2, y: 4, width: 24, height: 14 }));
    else if (p[0] === 'nr') { var g1 = s('g'); sembolCiz(g1, 14, 6, 'sag', 'hava', false, true, 4.5); g1.setAttribute('class', 'og-kulak notr'); svg.appendChild(g1); }
    else { var g2 = s('g'); sembolCiz(g2, p[1] === 'kemik' ? 14 - (p[0] === 'sag' ? -1 : 1) * 6 : 14, 11, p[0], p[1], p[2] === '1', false, 5.5); svg.appendChild(g2); }
    yer.replaceWith(svg);
  });

  /* ---------- form: eşik satırları ---------- */
  var alanlar = { sag: { hava: {}, kemik: {} }, sol: { hava: {}, kemik: {} } };
  var seciliKulak = 'sag', duzenlenen = null, formDegisti = false;

  function tgDugme(metin, etiket) {
    var b = h('button', { type: 'button', 'class': 'tg', 'aria-pressed': 'false', 'aria-label': etiket, title: etiket, text: metin });
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      b.dispatchEvent(new Event('degisti', { bubbles: true }));
    });
    return b;
  }
  function basili(b) { return b.getAttribute('aria-pressed') === 'true'; }
  function bas(b, on) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); }

  function satirOlustur(k, y, f) {
    var id = 'v-' + k + '-' + y + '-' + f;
    var ad = KULAK_AD[k] + ' kulak ' + YOL_AD[y].toLowerCase() + ' yolu ' + f + ' Hz';
    var giris = h('input', { id: id, 'class': 'db', type: 'number', step: '1', min: String(DB_EN_AZ), max: String(DB_EN_COK), 'aria-label': ad + ' (dB HL)', 'aria-describedby': id + '-u' });
    var m = tgDugme('M', ad + ': maskeli');
    var nr = tgDugme('NR', ad + ': yanıt yok');
    var mask = h('input', { id: id + '-m', 'class': 'db', type: 'number', step: '1', min: String(DB_EN_AZ), max: String(DB_EN_COK), placeholder: 'dB' });
    var maskSatir = h('div', { 'class': 'mask-satir', hidden: '' }, [h('label', { 'for': id + '-m', text: 'Maskeleme düzeyi (dB, isteğe bağlı)' }), mask]);
    var uyari = h('div', { id: id + '-u', 'class': 'alan-uyari' });
    var satir = h('div', { 'class': 'esik-satir' + (araMi(f) ? ' ara' : ''), 'data-f': String(f) }, [
      h('div', { 'class': 'esik-ust' }, [h('label', { 'for': id, 'class': 'hz', text: f + ' Hz' }), giris, m, nr]),
      maskSatir, uyari
    ]);
    var a = { giris: giris, m: m, nr: nr, mask: mask, maskSatir: maskSatir, uyari: uyari, satir: satir, k: k, y: y, f: f };
    function guncelle() { maskSatir.hidden = !basili(m); alanDogrula(a); formDegisti = true; formdanCiz(); }
    giris.addEventListener('input', guncelle);
    mask.addEventListener('input', guncelle);
    satir.addEventListener('degisti', guncelle);
    alanlar[k][y][f] = a;
    return satir;
  }
  document.querySelectorAll('#v-form .esik-blok').forEach(function (blok) {
    var k = blok.getAttribute('data-kulak'), y = blok.getAttribute('data-yol');
    var kap = blok.querySelector('.esik-satirlar');
    TUM_FREKANSLAR.forEach(function (f) { kap.appendChild(satirOlustur(k, y, f)); });
  });
  function herAlan(fn) { KULAKLAR.forEach(function (k) { YOLLAR.forEach(function (y) { TUM_FREKANSLAR.forEach(function (f) { fn(alanlar[k][y][f]); }); }); }); }

  // Tek alanı doğrular; sonucu döndürür ve alanı kırmızı yapar ya da düzeltir.
  function alanDogrula(a) {
    var r = alanOku(a.giris, DB_EN_AZ, DB_EN_COK), hata = r.hata || '';
    var mr = basili(a.m) ? alanOku(a.mask, DB_EN_AZ, DB_EN_COK) : { bos: true };
    if (!hata && r.bos && basili(a.nr)) hata = 'NR için cihazın en yüksek düzeyini gir.';
    var maskHata = mr.hata ? 'Maskeleme düzeyi: ' + mr.hata : '';
    a.giris.classList.toggle('hatali', !!hata);
    a.giris.setAttribute('aria-invalid', hata ? 'true' : 'false');
    a.mask.classList.toggle('hatali', !!maskHata);
    a.uyari.textContent = [hata, maskHata].filter(Boolean).join(' ');
    return { hata: !!(hata || maskHata), deger: r.deger, maskDb: mr.deger };
  }

  function araGoster(on) {
    $('v-ara').checked = on;
    document.querySelectorAll('#v-form .esik-satir.ara').forEach(function (s) { s.hidden = !on; });
    ayarYaz('odybot:araFrekans', on ? '1' : '0');
  }
  $('v-ara').addEventListener('change', function () { araGoster($('v-ara').checked); });

  function kulakSec(k) {
    seciliKulak = k;
    bas($('v-kulak-sag'), k === 'sag'); bas($('v-kulak-sol'), k === 'sol');
    document.querySelectorAll('#v-form .esik-blok').forEach(function (b) { b.hidden = b.getAttribute('data-kulak') !== k; });
  }
  $('v-kulak-sag').addEventListener('click', function () { kulakSec('sag'); });
  $('v-kulak-sol').addEventListener('click', function () { kulakSec('sol'); });

  // Formdaki değerlerden vaka nesnesi üretir. Hatalı alan varsa listesini de döndürür.
  function formuOku() {
    var v = {
      kimlik: $('v-kimlik').value.trim().slice(0, 40),
      tarih: $('v-tarih').value || U.todayISO(),
      notlar: $('v-notlar').value.trim().slice(0, 2000),
      esik: { sag: { hava: {}, kemik: {} }, sol: { hava: {}, kemik: {} } }
    };
    var hatalar = [];
    herAlan(function (a) {
      var r = alanDogrula(a);
      if (r.hata) { hatalar.push(a); return; }
      if (r.deger == null) return;            // boş frekans: kaydedilmez, hiçbir yere girmez
      var e = { db: r.deger };
      if (basili(a.m)) { e.maskeli = true; if (r.maskDb != null) e.maskDb = r.maskDb; }
      if (basili(a.nr)) e.nr = true;
      v.esik[a.k][a.y][String(a.f)] = e;
    });
    return { vaka: v, hatalar: hatalar };
  }

  function formuDoldur(v) {
    duzenlenen = v || null;
    $('v-form-baslik').textContent = v ? 'Vakayı düzenle' : 'Yeni vaka';
    $('v-kimlik').value = v ? v.kimlik : '';
    $('v-tarih').value = (v && v.tarih) || U.todayISO();
    $('v-notlar').value = v ? v.notlar : '';
    var araVar = false;
    herAlan(function (a) {
      var e = v && v.esik[a.k][a.y][String(a.f)];
      a.giris.value = e ? String(e.db) : '';
      bas(a.m, !!(e && e.maskeli)); bas(a.nr, !!(e && e.nr));
      a.mask.value = e && e.maskDb != null ? String(e.maskDb) : '';
      a.maskSatir.hidden = !(e && e.maskeli);
      a.giris.classList.remove('hatali'); a.mask.classList.remove('hatali'); a.uyari.textContent = '';
      if (e && araMi(a.f)) araVar = true;
    });
    araGoster(araVar || ayarOku('odybot:araFrekans') === '1');
    kulakSec('sag');
    $('v-form-msg').textContent = ''; $('v-form-msg').className = 'msg';
    formDegisti = false;
    formdanCiz();
  }

  // Formdaki canlı önizlemeler (odyogram ve sonuç): her girişte formdaki geçerli değerlerle yeniden çizilir.
  function formdanCiz() {
    if (ekran !== 'form') return;
    var v = formuOku().vaka;
    grafikCiz(v); sonucCiz(v);
  }

  /* ---------- sonuç kartı (hesaplar odyo-hesap.js'te) ---------- */
  var ptaTur = ayarOku('odybot:ptaTur') === '4' ? 4 : 3;
  function kulakBos(v, k) { return esikSayisi(v, k) === 0; }
  function sonucCiz(v) {
    bas($('v-pta3'), ptaTur === 3); bas($('v-pta4'), ptaTur === 4);
    $('v-pta-frek').textContent = 'Ortalama frekansları: ' + Hesap.PTA_FREKANSLARI[ptaTur].join(', ') + ' Hz';
    var kap = $('v-sonuc-icerik');
    kap.replaceChildren.apply(kap, KULAKLAR.map(function (k) {
      var bas_ = h('div', { 'class': 'og-baslik ' + k, text: KULAK_AD[k] + ' kulak' });
      if (!v || kulakBos(v, k)) return h('div', { 'class': 'sonuc-kulak ' + k }, [bas_, h('div', { 'class': 'meta', text: 'Bu kulak için değer girilmedi.' })]);
      var r = Hesap.degerlendir(v.esik[k], ptaTur);
      var satirlar = [
        ['Hava yolu ortalaması', Hesap.ptaMetni(r.hava)],
        ['Kemik yolu ortalaması', Hesap.ptaMetni(r.kemik)]
      ];
      if (r.tip.abg != null) satirlar.push(['Hava-kemik farkı (ABG)', Hesap.sayiYaz(r.tip.abg) + ' dB']);
      satirlar.push(['Derece', r.dereceMetni || '–']);
      satirlar.push(['Tip', r.tip.metin + (r.tip.kesinDegil ? ' (NR değeri içerir, kesin değil)' : '')]);
      var dl = h('dl', { 'class': 'sonuc-dl' });
      satirlar.forEach(function (x) { dl.appendChild(h('dt', { text: x[0] })); dl.appendChild(h('dd', { text: x[1] })); });
      return h('div', { 'class': 'sonuc-kulak ' + k }, [bas_, dl]);
    }));
  }
  function ptaSec(n) {
    ptaTur = n; ayarYaz('odybot:ptaTur', n);
    if (ekran === 'form') formdanCiz(); else if (ekran === 'detay' && bul(acikId)) sonucCiz(bul(acikId));
  }
  $('v-pta3').addEventListener('click', function () { ptaSec(3); });
  $('v-pta4').addEventListener('click', function () { ptaSec(4); });

  /* ---------- odyogram paneli: tek / ayrı grafik ---------- */
  var grafikAyri = ayarOku('odybot:grafik') === 'ayri';
  function grafikCiz(v) {
    bas($('v-tek'), !grafikAyri); bas($('v-ayri'), grafikAyri);
    var kap = $('v-grafik-cizim');
    if (!grafikAyri) { kap.replaceChildren(cizOdyogram(v)); return; }
    kap.replaceChildren.apply(kap, KULAKLAR.map(function (k) {
      return h('div', { 'class': 'og-tek' }, [h('div', { 'class': 'og-baslik ' + k, text: KULAK_AD[k] + ' kulak' }), cizOdyogram(v, { kulaklar: [k] })]);
    }));
  }
  function grafikDuzeni(ayri) {
    grafikAyri = ayri; ayarYaz('odybot:grafik', ayri ? 'ayri' : 'tek');
    if (ekran === 'form') formdanCiz(); else if (ekran === 'detay' && bul(acikId)) grafikCiz(bul(acikId));
  }
  $('v-tek').addEventListener('click', function () { grafikDuzeni(false); });
  $('v-ayri').addEventListener('click', function () { grafikDuzeni(true); });

  $('v-form').addEventListener('input', function (e) { if (!e.target.classList.contains('db')) formDegisti = true; });
  $('v-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('v-form-msg'); msg.className = 'msg'; msg.textContent = '';
    var r = formuOku();
    if (r.hatalar.length) {
      var ilk = r.hatalar[0];
      if (ilk.k !== seciliKulak) kulakSec(ilk.k);
      if (araMi(ilk.f) && !$('v-ara').checked) araGoster(true);
      msg.textContent = 'Kırmızı alanları düzelt (' + r.hatalar.length + ' alan).'; msg.className = 'msg err';
      ilk.giris.focus();
      return;
    }
    if (!r.vaka.kimlik) {
      msg.textContent = 'Vaka kimliği gerekli.'; msg.className = 'msg err'; $('v-kimlik').focus(); return;
    }
    var yeni = !duzenlenen, simdi = Date.now(), v = r.vaka;
    v.id = yeni ? yeniId() : duzenlenen.id;
    v.olusturma = yeni ? simdi : duzenlenen.olusturma;
    v.guncelleme = simdi;
    if (!yeni) {   // sonraki aşamalarda eklenen ek alanlar formda yoksa korunur
      Object.keys(duzenlenen).forEach(function (x) { if (!(x in v)) v[x] = duzenlenen[x]; });
    }
    $('v-kaydet').disabled = true;
    VakaDeposu.kaydet(v).then(function () {
      if (yeni) ayarYaz(SAYAC_ANAHTAR, sayacOku() + 1);
      formDegisti = false;
      return yenile().then(function () { ayrintiAc(v.id); });
    }).catch(function () {
      msg.textContent = 'Kaydedilemedi. Tarayıcının depolama alanı dolu ya da kapalı olabilir (örneğin gizli sekmede).'; msg.className = 'msg err';
    }).then(function () { $('v-kaydet').disabled = false; });
  });

  /* ---------- ekranlar: liste, ayrıntı, form ---------- */
  var vakalar = [], acikId = null, ekran = 'liste';
  function goster(e) {
    ekran = e;
    $('v-liste-ekran').hidden = e !== 'liste';
    $('v-vaka-ekran').hidden = e === 'liste';
    $('v-form').hidden = e !== 'form';
    $('v-detay').hidden = e !== 'detay';
    if (e === 'form') {   // grafik paneli formda kulak seçiminin hemen üstünde durur
      var seg = document.querySelector('#v-form .seg2');
      seg.parentNode.insertBefore($('v-grafik'), seg);
      var notFld = $('v-notlar').closest('.fld');      // sonuç kartı eşiklerin hemen altında
      notFld.parentNode.insertBefore($('v-sonuc'), notFld);
      formdanCiz();
    }
    try { window.scrollTo(0, 0); } catch (x) {}
  }
  function ayrilabilir() {
    return ekran !== 'form' || !formDegisti || window.confirm('Kaydedilmemiş değişiklikler silinsin mi?');
  }
  function listeyeDon() { if (!ayrilabilir()) return; acikId = null; formDegisti = false; goster('liste'); listeCiz(); }
  $('v-geri').addEventListener('click', listeyeDon);
  $('v-vazgec').addEventListener('click', function () {
    if (!ayrilabilir()) return;
    formDegisti = false;
    if (duzenlenen) ayrintiAc(duzenlenen.id); else listeyeDon();
  });
  $('v-yeni').addEventListener('click', function () { formuDoldur(null); goster('form'); $('v-kimlik').focus(); });

  function bul(id) { for (var i = 0; i < vakalar.length; i++) if (vakalar[i].id === id) return vakalar[i]; return null; }

  // Liste kartındaki kısa sonuç özeti: her kulak için tip + derece.
  function ozetMetni(v) {
    return KULAKLAR.map(function (k) {
      return KULAK_AD[k] + ': ' + (kulakBos(v, k) ? 'değer yok' : Hesap.kisaOzet(Hesap.degerlendir(v.esik[k], ptaTur)));
    }).join(' · ');
  }
  // Liste kartındaki küçük odyogram (iki kulak bir arada, yazısız).
  function kucukGrafik(v) {
    var svg = cizOdyogram(v, { kucuk: true });
    svg.setAttribute('aria-hidden', 'true');
    return h('div', { 'class': 'vmini' }, [svg]);
  }

  function listeCiz() {
    var box = $('v-liste');
    $('v-sayi').textContent = vakalar.length ? vakalar.length + ' vaka' : '';
    hatirlatmaGoster();
    if (!vakalar.length) {
      box.replaceChildren(h('div', { 'class': 'empty', text: 'Henüz kayıtlı vaka yok. "Yeni vaka ekle" ile başla.' }));
      return;
    }
    box.replaceChildren.apply(box, vakalar.map(function (v) {
      var kart = h('div', { 'class': 'item vkart', role: 'button', tabindex: '0', 'aria-label': v.kimlik + ' vakasını aç' }, [
        h('div', { 'class': 'item-top' }, [h('div', { 'class': 'item-title', text: v.kimlik }), h('span', { 'class': 'tag', text: U.fmtDate(v.tarih) || 'tarihsiz' })]),
        h('div', { 'class': 'vkart-govde' }, [kucukGrafik(v), h('div', { 'class': 'meta vozet', text: ozetMetni(v) })])
      ]);
      function ac() { ayrintiAc(v.id); }
      kart.addEventListener('click', ac);
      kart.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ac(); } });
      return kart;
    }));
  }

  function esikTablosu(v) {
    var frek = TUM_FREKANSLAR.filter(function (f) {
      return KULAKLAR.some(function (k) { return YOLLAR.some(function (y) { return v.esik[k][y][String(f)]; }); });
    });
    if (!frek.length) return h('div', { 'class': 'empty', text: 'Eşik değeri girilmemiş.' });
    var bas = h('tr', null, [h('th', { text: 'Hz' })].concat(
      KULAKLAR.reduce(function (acc, k) {
        return acc.concat(YOLLAR.map(function (y) { return h('th', { 'class': k, text: KULAK_AD[k] + ' ' + YOL_AD[y].toLowerCase() }); }));
      }, [])));
    var satirlar = frek.map(function (f) {
      return h('tr', null, [h('th', { text: String(f) })].concat(
        KULAKLAR.reduce(function (acc, k) {
          return acc.concat(YOLLAR.map(function (y) { return h('td', { text: esikMetni(v.esik[k][y][String(f)]) || '–' }); }));
        }, [])));
    });
    return h('div', { 'class': 'tablo-kap' }, [
      h('table', { 'class': 'esik-tablo' }, [h('thead', null, [bas]), h('tbody', null, satirlar)]),
      h('p', { 'class': 'note', text: 'Değerler dB HL. M: maskeli (parantezde maskeleme düzeyi). NR: yanıt yok.' })
    ]);
  }

  var silOnay = null, silZaman = null;
  function ayrintiCiz() {
    var v = bul(acikId);
    if (!v) { goster('liste'); listeCiz(); return; }
    var duzenle = h('button', { 'class': 'btn', type: 'button', text: 'Düzenle' });
    duzenle.addEventListener('click', function () { formuDoldur(v); goster('form'); });
    var sil = h('button', { 'class': 'btn' + (silOnay === v.id ? ' tehlike' : ''), type: 'button', text: silOnay === v.id ? 'Emin misin? Sil' : 'Sil' });
    var msg = h('div', { 'class': 'msg', role: 'status' });
    sil.addEventListener('click', function () {
      if (silOnay !== v.id) {
        silOnay = v.id; clearTimeout(silZaman);
        silZaman = setTimeout(function () { silOnay = null; if (ekran === 'detay') ayrintiCiz(); }, 4000);
        ayrintiCiz(); return;
      }
      silOnay = null; clearTimeout(silZaman);
      VakaDeposu.sil(v.id).then(function () { acikId = null; goster('liste'); }, function () {
        msg.textContent = 'Silinemedi.'; msg.className = 'msg err';
      });
    });
    var parca = [
      h('div', { 'class': 'card-head' }, [h('h3', { text: v.kimlik }), h('div', { 'class': 'meta', text: U.fmtDate(v.tarih) || 'Tarih yok' })]),
      buyukGrafik(v),
      sonucKarti(v),
      h('h4', { text: 'Eşikler' }),
      esikTablosu(v)
    ];
    if (v.notlar) parca.push(h('h4', { text: 'Notlar' }), h('p', { 'class': 'vnot', text: v.notlar }));
    parca.push(h('div', { 'class': 'admin-bar' }, [duzenle, sil]), msg);
    $('v-detay').replaceChildren.apply($('v-detay'), parca.filter(Boolean));
  }
  // Ayrıntıdaki odyogram: ortak panel (tek/ayrı düğmesi ve lejant ile) buraya taşınır.
  function buyukGrafik(v) { grafikCiz(v); return $('v-grafik'); }
  function sonucKarti(v) { sonucCiz(v); return $('v-sonuc'); }

  function ayrintiAc(id) { acikId = id; silOnay = null; goster('detay'); ayrintiCiz(); }

  function yenile() {
    return VakaDeposu.hepsi().then(function (l) {
      vakalar = siralaVakalar(l);
      if (ekran === 'liste') listeCiz();
      else if (ekran === 'detay') ayrintiCiz();
    }, function () {
      $('v-liste').replaceChildren(h('div', { 'class': 'empty', text: 'Kayıtlı vakalar okunamadı. Tarayıcının depolama alanı kapalı olabilir (örneğin gizli sekmede).' }));
    });
  }
  VakaDeposu.degisince(yenile);

  /* ---------- yedekleme hatırlatması ---------- */
  function sayacOku() { return parseInt(ayarOku(SAYAC_ANAHTAR) || '0', 10) || 0; }
  function sayacSifirla() { ayarYaz(SAYAC_ANAHTAR, 0); ayarYaz(KAPALI_ANAHTAR, null); hatirlatmaGoster(); }
  function hatirlatmaGoster() {
    var n = sayacOku();
    var goster = n > 0 && n % HATIRLATMA_ARALIGI === 0 && ayarOku(KAPALI_ANAHTAR) !== String(n);
    $('v-hatirlatma').hidden = !goster;
    if (goster) $('v-hatirlatma-metin').textContent = 'Son yedekten bu yana ' + n + ' yeni vaka kaydettin. Yedek almayı unutma; aşağıdaki "Yedekle / Geri yükle" bölümünden alabilirsin.';
  }
  $('v-hatirlatma-kapat').addEventListener('click', function () { ayarYaz(KAPALI_ANAHTAR, sayacOku()); hatirlatmaGoster(); });

  /* ---------- yedekleme: JSON, CSV, geri yükleme ---------- */
  function yedekMsg(t, hata) { $('v-yedek-msg').textContent = t; $('v-yedek-msg').className = 'msg' + (hata ? ' err' : ''); }
  function dosyaIndir(ad, icerik, tur) {
    var url = URL.createObjectURL(new Blob([icerik], { type: tur }));
    var a = h('a', { href: url, download: ad, hidden: '' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }
  function yedekAdi() { return 'odyobot-yedek-' + U.todayISO() + '.json'; }
  function yedekIcerik(l) {
    return JSON.stringify({ uygulama: 'OdyoBOT', tur: 'vaka-yedegi', surum: 1, alinma: new Date().toISOString(), vakalar: l }, null, 1);
  }
  function yedekHazirla() {
    return VakaDeposu.hepsi().then(function (l) {
      if (!l.length) throw new Error('bos');
      return l;
    });
  }
  function yedekHata(e) { yedekMsg(e && e.message === 'bos' ? 'Yedeklenecek vaka yok.' : 'Yedek hazırlanamadı.', true); }

  $('v-yedek-al').addEventListener('click', function () {
    yedekHazirla().then(function (l) {
      dosyaIndir(yedekAdi(), yedekIcerik(l), 'application/json');
      sayacSifirla();
      yedekMsg(l.length + ' vaka yedeklendi: ' + yedekAdi());
    }).catch(yedekHata);
  });

  // Telefonun paylaşma menüsü dosya paylaşmayı destekliyorsa "Yedeği paylaş" düğmesi görünür.
  var paylasilabilir = false;
  try {
    paylasilabilir = !!(navigator.canShare && window.File &&
      navigator.canShare({ files: [new File(['{}'], 'deneme.json', { type: 'application/json' })] }));
  } catch (e) { paylasilabilir = false; }
  $('v-yedek-paylas').hidden = !paylasilabilir;
  $('v-yedek-paylas').addEventListener('click', function () {
    yedekHazirla().then(function (l) {
      var dosya = new File([yedekIcerik(l)], yedekAdi(), { type: 'application/json' });
      return navigator.share({ files: [dosya], title: 'OdyoBOT vaka yedeği' }).then(function () {
        sayacSifirla(); yedekMsg(l.length + ' vaka paylaşıldı.');
      }, function (e) {
        if (e && e.name === 'AbortError') return;
        yedekMsg('Paylaşılamadı. "Yedek al (JSON)" düğmesini dene.', true);
      });
    }).catch(yedekHata);
  });

  // CSV: Excel'de Türkçe karakterler doğru görünsün diye başta UTF-8 BOM; Türkçe Excel için ayraç noktalı virgül.
  function csvHucre(x) {
    var s = x == null ? '' : String(x);
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(,\d+)?$/.test(s)) s = "'" + s;   // formül olarak çalışmasın
    if (/[;"\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  // Sütun listesi; sonraki aşamalar bu diziye ekleme yapar.
  var CSV_SUTUNLARI = [
    { ad: 'Kimlik', al: function (v) { return v.kimlik; } },
    { ad: 'Tarih', al: function (v) { return v.tarih; } }
  ];
  KULAKLAR.forEach(function (k) {
    YOLLAR.forEach(function (y) {
      TUM_FREKANSLAR.forEach(function (f) {
        CSV_SUTUNLARI.push({ ad: KULAK_AD[k] + ' ' + YOL_AD[y].toLowerCase() + ' ' + f, al: function (v) { return esikMetni(v.esik[k][y][String(f)]); } });
      });
    });
  });
  // Hesap sütunları (seçili ortalama türüyle). Ondalık ayırıcı virgül (Türkçe Excel).
  CSV_SUTUNLARI.push({ ad: 'Ortalama frekansları', al: function () { return Hesap.PTA_FREKANSLARI[ptaTur].join('-'); } });
  KULAKLAR.forEach(function (k) {
    function r(v) { return Hesap.degerlendir(v.esik[k], ptaTur); }
    function p(x) { return x.hesaplandi ? (x.enAz ? 'en az ' : '') + Hesap.sayiYaz(x.deger) : ''; }
    CSV_SUTUNLARI.push(
      { ad: KULAK_AD[k] + ' hava PTA', al: function (v) { return p(r(v).hava); } },
      { ad: KULAK_AD[k] + ' kemik PTA', al: function (v) { return p(r(v).kemik); } },
      { ad: KULAK_AD[k] + ' ABG', al: function (v) { var t = r(v).tip; return t.abg != null ? Hesap.sayiYaz(t.abg) : ''; } },
      { ad: KULAK_AD[k] + ' derece', al: function (v) { return r(v).dereceMetni; } },
      { ad: KULAK_AD[k] + ' tip', al: function (v) { return kulakBos(v, k) ? '' : r(v).tip.metin; } }
    );
  });
  var CSV_SON = [{ ad: 'Notlar', al: function (v) { return v.notlar; } }];
  function csvIcerik(l) {
    var sut = CSV_SUTUNLARI.concat(CSV_SON);
    var satirlar = [sut.map(function (s) { return csvHucre(s.ad); }).join(';')];
    siralaVakalar(l).forEach(function (v) { satirlar.push(sut.map(function (s) { return csvHucre(s.al(v)); }).join(';')); });
    return '﻿' + satirlar.join('\r\n') + '\r\n';
  }
  $('v-csv').addEventListener('click', function () {
    yedekHazirla().then(function (l) {
      dosyaIndir('odyobot-tablo-' + U.todayISO() + '.csv', csvIcerik(l), 'text/csv;charset=utf-8');
      yedekMsg(l.length + ' vaka tabloya yazıldı. Bu bir yedek değildir; geri yükleme için JSON yedeği kullan.');
    }).catch(yedekHata);
  });

  // Geri yükleme: önce dosyanın tamamı doğrulanır, sonra kullanıcıya birleştir / üzerine yaz sorulur.
  var bekleyen = null;
  function geriSorKapat() { bekleyen = null; $('v-geri-sor').hidden = true; }
  $('v-geri-yukle').addEventListener('click', function () { geriSorKapat(); yedekMsg(''); $('v-dosya').value = ''; $('v-dosya').click(); });
  function dosyaMetni(dosya) {
    if (dosya.text) return dosya.text();
    return new Promise(function (ok, red) {
      var r = new FileReader();
      r.onload = function () { ok(r.result); }; r.onerror = function () { red(r.error); };
      r.readAsText(dosya);
    });
  }
  // Yedek dosyasını çözer. Sorun varsa anlaşılır Türkçe bir hata fırlatır.
  function yedekCoz(metin) {
    var veri;
    try { veri = JSON.parse(String(metin).replace(/^﻿/, '')); }
    catch (e) { throw new Error('Dosya okunamadı: geçerli bir yedek dosyası (JSON) değil.'); }
    if (!veri || typeof veri !== 'object' || veri.tur !== 'vaka-yedegi' || !Array.isArray(veri.vakalar))
      throw new Error('Bu dosya bir OdyoBOT vaka yedeği değil.');
    if (typeof veri.surum === 'number' && veri.surum > 1)
      throw new Error('Bu yedek uygulamanın daha yeni bir sürümüyle alınmış. Önce uygulamayı güncelle (sayfayı yenile).');
    return veri.vakalar.map(function (v, i) {
      try { return temizle(v, null, true); }
      catch (e) { throw new Error('Dosyadaki ' + (i + 1) + '. vaka okunamadı (' + e.message + ').'); }
    });
  }
  $('v-dosya').addEventListener('change', function () {
    var dosya = $('v-dosya').files && $('v-dosya').files[0];
    if (!dosya) return;
    if (dosya.size > 10 * 1024 * 1024) { yedekMsg('Dosya çok büyük. Bir OdyoBOT yedeği seçtiğinden emin ol.', true); return; }
    dosyaMetni(dosya).then(function (metin) {
      var gelen = yedekCoz(metin);
      if (!gelen.length) throw new Error('Yedek dosyasında hiç vaka yok.');
      return VakaDeposu.hepsi().then(function (mevcut) {
        bekleyen = gelen;
        $('v-geri-metin').textContent = 'Dosyada ' + gelen.length + ' vaka var, bu cihazda ' + mevcut.length + ' vaka var. ' +
          'Birleştir: ikisini bir araya getirir; aynı vaka iki yerde de varsa en son düzenlenen kalır. ' +
          'Üzerine yaz: bu cihazdaki vakalar silinir, yalnızca dosyadakiler kalır.';
        $('v-geri-sor').hidden = false;
        yedekMsg('');
      });
    }).catch(function (e) {
      geriSorKapat();
      yedekMsg((e && e.message ? e.message : 'Dosya okunamadı.') + ' Mevcut vakalarına dokunulmadı.', true);
    });
  });
  function geriYukle(birlestir) {
    if (!bekleyen) return;
    var gelen = bekleyen;
    VakaDeposu.hepsi().then(function (mevcut) {
      var harita = {};
      if (birlestir) mevcut.forEach(function (v) { harita[v.id] = v; });
      gelen.forEach(function (v) {
        var eski = harita[v.id];
        if (!eski || (v.guncelleme || 0) >= (eski.guncelleme || 0)) harita[v.id] = v;
      });
      var son = Object.keys(harita).map(function (id) { return harita[id]; });
      return VakaDeposu.hepsiniYaz(son).then(function () {
        geriSorKapat();
        yedekMsg((birlestir ? 'Birleştirildi. ' : 'Yedek yüklendi. ') + 'Şu an ' + son.length + ' vaka var.');
      });
    }).catch(function () {
      yedekMsg('Geri yüklenemedi. Depolama alanı dolu olabilir. Mevcut vakalarına dokunulmadı.', true);
    });
  }
  $('v-birlestir').addEventListener('click', function () { geriYukle(true); });
  $('v-uzerine').addEventListener('click', function () { geriYukle(false); });
  $('v-geri-vazgec').addEventListener('click', function () { geriSorKapat(); yedekMsg('Geri yükleme iptal edildi.'); });

  /* ---------- başlat ---------- */
  goster('liste');
  yenile();
  // Test ve sonraki aşamalar için (tarayıcı konsolundan denenebilir).
  window.Vakalarim = { cizOdyogram: cizOdyogram, temizle: temizle, yedekCoz: yedekCoz, csvIcerik: csvIcerik, sayiOku: sayiOku };
})();
