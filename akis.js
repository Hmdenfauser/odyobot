/* Ana sayfa akışı: Etkinlik (sempozyum/kongre), İş ilanı ve Haber paylaşımları.
   - Paylaşımlar Firestore 'duyurular' koleksiyonunda. Herkes okur, yalnızca yönetici yazar (firestore.rules).
   - Fotoğraflar ayrı 'gorseller' koleksiyonunda (Firebase Storage ücretsiz planda kapalı). Burada tarayıcıda
     küçültülüp JPEG data URL olarak saklanır; paylaşım belgesinde yalnızca gorselId durur. Görseller kart ekrana
     yaklaşınca tek tek yüklenir, böylece liste hızlı açılır.
   - Eski kayıtlar silinmeden okunurken eşleştirilir: tur "haber" + metin yok = eski sempozyum duyurusu → etkinlik.
   - app.js bağlantıyı kurar ve 'odyo:db', 'odyo:db-yok', 'odyo:yetki', 'odyo:metinler' olaylarıyla haber verir.
   - Ayrıntı sayfası adresi #duyuru/<kimlik>; paylaşılabilir, telefonun geri tuşu sayfayı kapatır. */
(function () {
  var U = window.OdyoUI;
  if (!U) return;
  var h = U.h, $ = U.$;

  /* ---------- ayarlar (tek yer) ---------- */
  var SAYFA_BOYU = 30;              // ilk açılışta ve her "Daha fazla göster"de yüklenen kayıt
  var HABER_SINIRI = 280;           // haber metni
  var METIN_SINIRI = 1000;          // etkinlik / ilan açıklaması
  var FOTO_UZUN_KENAR = 1200;       // piksel
  var FOTO_KALITELER = [0.75, 0.68, 0.6, 0.52, 0.45, 0.4];
  var FOTO_SINIRI = 700000;         // data URL en çok bu kadar karakter (~510 KB JPEG); kural sınırı 900 000
  var ULASILAMADI_SURE = 10000;
  var JPEG_ON = 'data:image/jpeg;base64,';
  var TURLER = ['etkinlik', 'ilan', 'haber'];
  var TUR_AD = { etkinlik: 'Etkinlik', ilan: 'İş ilanı', haber: 'Haber' };
  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  /* ---------- durum ---------- */
  var db = null, yonetici = !!U.yonetici;
  var kayitlar = [], sinir = SAYFA_BOYU, dahaVar = false, yuklendi = false, ulasilamadi = false, abonelik = null;
  var filtre = 'tumu';
  var gorselSoz = {}, gorselHazir = {};   // gorselId → Promise / data URL
  var acikId = null, uygulamaIci = false, oncekiOdak = null, tekKayit = {};

  /* ---------- yönetici tarafından düzenlenebilir metinler (#a-metinler) ---------- */
  function M(ad) {
    var el = document.querySelector('#a-metinler [data-m="' + ad + '"]');
    return el ? el.textContent.trim() : ad;
  }

  /* ---------- küçük yardımcılar ---------- */
  function yazi(x) { return typeof x === 'string' ? x : ''; }
  function bugun() { return U.todayISO(); }
  function parca(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? { y: +m[1], a: +m[2], g: +m[3] } : null;
  }
  function tekTarih(p) { return p.g + ' ' + AYLAR[p.a - 1] + ' ' + p.y; }
  // "12–14 Mart 2027", "28 Şubat – 2 Mart 2027", "30 Aralık 2026 – 2 Ocak 2027", "12 Mart 2027"
  function tarihAraligi(b, s) {
    var x = parca(b), y = parca(s);
    if (!x) return y ? tekTarih(y) : '';
    if (!y || s <= b) return tekTarih(x);
    if (x.y === y.y && x.a === y.a) return x.g + '–' + y.g + ' ' + AYLAR[x.a - 1] + ' ' + x.y;
    if (x.y === y.y) return x.g + ' ' + AYLAR[x.a - 1] + ' – ' + y.g + ' ' + AYLAR[y.a - 1] + ' ' + x.y;
    return tekTarih(x) + ' – ' + tekTarih(y);
  }
  function tarihYaz(iso) { var p = parca(iso); return p ? tekTarih(p) : ''; }
  function kacOnce(ms) {
    if (!ms) return '';
    var sn = Math.max(0, Date.now() - ms) / 1000;
    if (sn < 60) return 'az önce';
    if (sn < 3600) return Math.floor(sn / 60) + ' dakika önce';
    if (sn < 86400) return Math.floor(sn / 3600) + ' saat önce';
    if (sn < 7 * 86400) return Math.floor(sn / 86400) + ' gün önce';
    var d = new Date(ms);
    return d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear();
  }
  function gecti(d) {
    var t = bugun();
    if (d.tur === 'etkinlik') { var s = d.bitis || d.baslangic; return !!s && s < t; }
    if (d.tur === 'ilan') return !!d.tarih && d.tarih < t;
    return false;
  }
  // Metindeki https bağlantılarını tıklanabilir yapar (yalnızca metin düğümü ve <a>, HTML yorumlanmaz).
  function linkli(metin) {
    var frag = document.createDocumentFragment(), re = /https:\/\/[^\s<>"']+/g, son = 0, m;
    while ((m = re.exec(metin))) {
      var url = m[0].replace(/[.,;:!?)\]]+$/, '');
      frag.appendChild(document.createTextNode(metin.slice(son, m.index)));
      var a = h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: url });
      a.addEventListener('click', function (e) { e.stopPropagation(); });
      frag.appendChild(a);
      son = m.index + url.length; re.lastIndex = son;
    }
    frag.appendChild(document.createTextNode(metin.slice(son)));
    return frag;
  }
  function bosKutu(metin) { return h('div', { 'class': 'empty', text: metin }); }

  /* ---------- veri: okurken eşleştirme ---------- */
  function normal(id, o) {
    o = o || {};
    var d = {
      id: id, tur: yazi(o.tur), baslik: yazi(o.baslik), kurum: yazi(o.kurum), tarih: yazi(o.tarih),
      baslangic: yazi(o.baslangic), bitis: yazi(o.bitis), yer: yazi(o.yer), metin: yazi(o.metin) || yazi(o.not),
      link: U.safeLink(o.link), gorselId: /^[A-Za-z0-9_-]{1,40}$/.test(o.gorselId || '') ? o.gorselId : '',
      olusturma: typeof o.olusturma === 'number' ? o.olusturma : 0
    };
    // Eski sempozyum/kongre duyurusu: tur "haber", metin alanı yok. Eski formda tarih = etkinlik tarihi, kurum = "kurum veya yer".
    if (d.tur === 'haber' && !yazi(o.metin)) {
      d.tur = 'etkinlik';
      if (!d.baslangic) d.baslangic = d.tarih;
      if (!d.yer) d.yer = d.kurum;
      d.tarih = ''; d.kurum = '';
    }
    if (TURLER.indexOf(d.tur) === -1) return null;
    if (d.tur !== 'haber' && !d.baslik) return null;
    if (d.tur === 'haber' && !d.metin) return null;
    return d;
  }
  function etkinlikSira(arr) {
    var yak = arr.filter(function (d) { return !gecti(d); }), gec = arr.filter(gecti);
    yak.sort(function (a, b) { return (a.baslangic || '9999') < (b.baslangic || '9999') ? -1 : (a.baslangic === b.baslangic ? 0 : 1); });
    gec.sort(function (a, b) { return (a.bitis || a.baslangic) < (b.bitis || b.baslangic) ? 1 : -1; });
    return yak.concat(gec);
  }
  function ilanSira(arr) {
    var ak = arr.filter(function (d) { return !gecti(d); }), gec = arr.filter(gecti);
    ak.sort(function (a, b) { return (a.tarih || '9999') < (b.tarih || '9999') ? -1 : (a.tarih === b.tarih ? 0 : 1); });
    gec.sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; });
    return ak.concat(gec);
  }
  function haberSira(arr) { return arr.slice().sort(function (a, b) { return b.olusturma - a.olusturma; }); }
  function turle(t) { return kayitlar.filter(function (d) { return d.tur === t; }); }
  function bul(id) {
    for (var i = 0; i < kayitlar.length; i++) if (kayitlar[i].id === id) return kayitlar[i];
    return tekKayit[id] || null;
  }

  /* ---------- bağlantı ---------- */
  var vazgecZamani = setTimeout(function () { if (!yuklendi) { ulasilamadi = true; ciz(); } }, ULASILAMADI_SURE);
  function abone() {
    if (!db) return;
    if (abonelik) abonelik();
    abonelik = db.collection('duyurular').orderBy('olusturma', 'desc').limit(sinir).onSnapshot(function (snap) {
      clearTimeout(vazgecZamani);
      yuklendi = true; ulasilamadi = false;
      kayitlar = snap.docs.map(function (s) { return normal(s.id, s.data()); }).filter(Boolean);
      dahaVar = snap.size >= sinir;
      ciz();
      if (acikId) sayfaIcerik(acikId);
    }, function () {
      clearTimeout(vazgecZamani);
      if (!yuklendi) { ulasilamadi = true; ciz(); }
    });
  }
  function dbGeldi(yeni) {
    if (!yeni || yeni === db) return;
    db = yeni; gorselSoz = {};
    abone();
    hashKontrol();
  }

  /* ---------- görseller: ekrana yaklaşınca yükle ---------- */
  function gorselAl(id) {
    if (gorselHazir[id]) return Promise.resolve(gorselHazir[id]);
    if (!db) return Promise.resolve('');
    if (!gorselSoz[id]) {
      gorselSoz[id] = db.collection('gorseller').doc(id).get().then(function (s) {
        var v = s.exists ? (s.data() || {}).veri : '';
        if (typeof v === 'string' && v.indexOf(JPEG_ON) === 0) { gorselHazir[id] = v; return v; }
        return '';
      }).catch(function () { delete gorselSoz[id]; return ''; });
    }
    return gorselSoz[id];
  }
  var gozcu = 'IntersectionObserver' in window ? new IntersectionObserver(function (girdiler) {
    girdiler.forEach(function (g) { if (g.isIntersecting) { gozcu.unobserve(g.target); gorselYukle(g.target); } });
  }, { rootMargin: '400px 400px' }) : null;
  function gorselYukle(kutu) {
    var id = kutu.getAttribute('data-gorsel');
    gorselAl(id).then(function (v) { if (v) gorselKoy(kutu, v); else kutu.classList.add('yok'); });
  }
  function gorselKoy(kutu, v) {
    kutu.querySelectorAll('img').forEach(function (x) { x.remove(); });
    kutu.appendChild(h('img', { src: v, alt: kutu.getAttribute('data-alt') || '', decoding: 'async' }));
    kutu.classList.add('yuklu');
  }
  // sinif: a-gorsel-afis (3:4), a-gorsel-haber (16:9), a-gorsel-kucuk (kare), a-gorsel-tam (doğal oran)
  function gorselKutu(id, sinif, alt, yerTutucu) {
    var kutu = h('div', { 'class': 'a-gorsel ' + sinif }, yerTutucu ? [yerTutucu] : []);
    if (!id) { kutu.classList.add('yok'); return kutu; }
    kutu.setAttribute('data-gorsel', id);
    if (alt) kutu.setAttribute('data-alt', alt);
    if (gorselHazir[id]) gorselKoy(kutu, gorselHazir[id]);
    else if (gozcu) gozcu.observe(kutu);
    else gorselYukle(kutu);
    return kutu;
  }
  // Fotoğrafı olmayan etkinlik afişinin yerine: büyük gün ve ay
  function afisYerTutucu(d) {
    var p = parca(d.baslangic);
    return h('div', { 'class': 'a-afis-yer', 'aria-hidden': 'true' }, p ? [
      h('span', { 'class': 'a-afis-gun', text: String(p.g) }),
      h('span', { 'class': 'a-afis-ay', text: AYLAR[p.a - 1] + ' ' + p.y })
    ] : [h('span', { 'class': 'a-afis-ay', text: TUR_AD.etkinlik })]);
  }

  /* ---------- kartlar ---------- */
  function karta(el, id) {
    el.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey) return;
      e.preventDefault(); ac(id);
    });
  }
  function afisKart(d) {
    var g = gecti(d);
    var kutu = gorselKutu(d.gorselId, 'a-gorsel-afis', '', afisYerTutucu(d));
    if (g) kutu.appendChild(h('span', { 'class': 'tag a-gecti', text: M('gecti') }));
    var a = h('a', { 'class': 'a-afis' + (g ? ' gecmis' : ''), href: '#duyuru/' + d.id }, [
      kutu,
      h('span', { 'class': 'a-afis-baslik', text: d.baslik }),
      d.baslangic ? h('span', { 'class': 'a-afis-tarih', text: tarihAraligi(d.baslangic, d.bitis) }) : null,
      d.yer ? h('span', { 'class': 'meta', text: d.yer }) : null
    ]);
    karta(a, d.id);
    return a;
  }
  function ilanKart(d) {
    var g = gecti(d);
    var metin = h('div', { 'class': 'a-ilan-metin' }, [
      d.kurum ? h('span', { 'class': 'kicker', text: d.kurum }) : null,
      h('span', { 'class': 'item-title', text: d.baslik }),
      d.tarih ? h('span', { 'class': 'meta', text: M('sonBasvuru') + ': ' + tarihYaz(d.tarih) }) : null,
      g ? h('span', { 'class': 'tag', text: M('gecti') }) : null
    ]);
    var a = h('a', { 'class': 'item a-ilan' + (g ? ' past' : ''), href: '#duyuru/' + d.id }, [metin, d.gorselId ? gorselKutu(d.gorselId, 'a-gorsel-kucuk', '') : null]);
    karta(a, d.id);
    return a;
  }
  function haberUst(d) {
    return h('div', { 'class': 'a-haber-ust' }, [
      h('img', { 'class': 'a-avatar', src: 'icons/logo.png', alt: '', width: '40', height: '40' }),
      h('span', { 'class': 'a-haber-ad', text: 'OdyoBOT' }),
      h('span', { 'class': 'a-haber-zaman', 'data-zaman': String(d.olusturma), text: kacOnce(d.olusturma) })
    ]);
  }
  function haberKart(d) {
    var art = h('article', { 'class': 'a-haber', role: 'link', tabindex: '0', 'aria-label': 'Haber, ' + kacOnce(d.olusturma) + ': ' + d.metin.slice(0, 80) }, [
      haberUst(d),
      h('p', { 'class': 'a-haber-metin' }, [linkli(d.metin)]),
      d.gorselId ? gorselKutu(d.gorselId, 'a-gorsel-haber', '') : null
    ]);
    art.addEventListener('click', function (e) { if (!e.defaultPrevented) ac(d.id); });
    art.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ac(d.id); } });
    return art;
  }

  /* ---------- akış ---------- */
  function bolum(baslik, filtreAdi, icerik) {
    var ust = h('div', { 'class': 'row' }, [h('h2', { text: baslik })]);
    if (filtreAdi) {
      var b = h('button', { 'class': 'linkbtn', type: 'button', text: M('tumunuGor') });
      b.addEventListener('click', function () { filtreSec(filtreAdi); });
      ust.appendChild(b);
    }
    return h('div', { 'class': 'stack a-bolum' }, [ust, icerik]);
  }
  function ciz() {
    var kok = $('akis');
    if (!kok) return;
    var eski = kok.querySelector('.a-serit'), kaydirma = eski ? eski.scrollLeft : 0;
    if (!yuklendi) { kok.replaceChildren(bosKutu(ulasilamadi ? M('ulasilamiyor') : M('yukleniyor'))); return; }
    var et = etkinlikSira(turle('etkinlik')), il = ilanSira(turle('ilan')), ha = haberSira(turle('haber'));
    var parcalar = [];
    if (filtre === 'tumu' || filtre === 'etkinlik') {
      var etIc = !et.length ? bosKutu(M('bosEtkinlik'))
        : h('div', { 'class': filtre === 'tumu' ? 'a-serit' : 'a-izgara' }, et.map(afisKart));
      parcalar.push(filtre === 'tumu' ? bolum(M('etkinlikler'), et.length > 1 ? 'etkinlik' : '', etIc) : etIc);
    }
    if (filtre === 'tumu' || filtre === 'ilan') {
      var ilIc = il.length ? h('div', { 'class': 'board' }, il.map(ilanKart)) : bosKutu(M('bosIlan'));
      parcalar.push(filtre === 'tumu' ? bolum(M('ilanlar'), '', ilIc) : ilIc);
    }
    if (filtre === 'tumu' || filtre === 'haber') {
      var haIc = ha.length ? h('div', { 'class': 'a-haberler' }, ha.map(haberKart)) : bosKutu(M('bosHaber'));
      parcalar.push(filtre === 'tumu' ? bolum(M('haberler'), '', haIc) : haIc);
    }
    if (dahaVar) {
      var daha = h('button', { 'class': 'btn a-daha', type: 'button', text: M('daha') });
      daha.addEventListener('click', function () { daha.disabled = true; sinir += SAYFA_BOYU; abone(); });
      parcalar.push(daha);
    }
    kok.replaceChildren.apply(kok, parcalar);
    var yeni = kok.querySelector('.a-serit');
    if (yeni && kaydirma) yeni.scrollLeft = kaydirma;
  }
  function filtreSec(f) {
    filtre = f;
    document.querySelectorAll('.a-cip').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filtre') === f ? 'true' : 'false'); });
    ciz();
  }
  document.querySelectorAll('.a-cip').forEach(function (b) {
    b.addEventListener('click', function () { filtreSec(b.getAttribute('data-filtre')); });
  });
  // "3 saat önce" yazıları dakikada bir tazelenir (kartlar yeniden çizilmez, şerit kaymaz).
  setInterval(function () {
    document.querySelectorAll('[data-zaman]').forEach(function (el) { el.textContent = kacOnce(+el.getAttribute('data-zaman')); });
  }, 60000);

  /* ---------- ayrıntı sayfası (#duyuru/ID) ---------- */
  var sayfa = $('a-sayfa'), sayfaIc = $('a-sayfa-ic');
  function ac(id) { uygulamaIci = true; location.hash = '#duyuru/' + id; }
  function kapat() {
    if (!acikId) return;
    if (uygulamaIci) { history.back(); return; }
    try { history.replaceState(null, '', '#anasayfa'); } catch (e) {}
    sayfaKapat();
  }
  function hashKontrol() {
    var m = /^#duyuru\/([A-Za-z0-9_-]{1,64})$/.exec(location.hash || '');
    if (m) sayfaAc(m[1]); else sayfaKapat();
  }
  function sayfaAc(id) {
    var ilk = !acikId;
    acikId = id;
    if (ilk) {
      oncekiOdak = document.activeElement;
      sayfa.hidden = false;
      document.documentElement.classList.add('kilit');
      sayfa.scrollTop = 0;
      requestAnimationFrame(function () { requestAnimationFrame(function () { sayfa.classList.add('acik'); }); });
      setTimeout(function () { try { $('a-kapat').focus({ preventScroll: true }); } catch (e) {} }, 50);
    }
    sayfaIcerik(id);
  }
  function sayfaKapat() {
    if (!acikId) return;
    acikId = null; uygulamaIci = false; silHazir = false;
    sayfa.classList.remove('acik');
    document.documentElement.classList.remove('kilit');
    setTimeout(function () { if (!acikId) { sayfa.hidden = true; sayfaIc.replaceChildren(); } }, 260);
    if (oncekiOdak && document.contains(oncekiOdak)) { try { oncekiOdak.focus({ preventScroll: true }); } catch (e) {} }
  }
  function sayfaIcerik(id) {
    var d = bul(id);
    if (!d) {
      $('a-sayfa-tur').textContent = '';
      sayfaIc.replaceChildren(h('h2', { id: 'a-sayfa-baslik', 'class': 'a-sayfa-yok', text: (db || !U.dbYok) && !tekKayit.hasOwnProperty(id) ? M('yukleniyor') : M('bulunamadi') }));
      if (db && !tekKayit.hasOwnProperty(id)) {
        db.collection('duyurular').doc(id).get().then(function (s) {
          tekKayit[id] = s.exists ? normal(s.id, s.data()) : null;
          if (acikId === id) sayfaIcerik(id);
        }).catch(function () { tekKayit[id] = null; if (acikId === id) sayfaIcerik(id); });
      }
      return;
    }
    $('a-sayfa-tur').textContent = TUR_AD[d.tur];
    var parcalar = [];
    if (d.tur === 'haber') {
      parcalar.push(haberUst(d));
      parcalar.push(h('p', { id: 'a-sayfa-baslik', 'class': 'a-haber-metin buyuk' }, [linkli(d.metin)]));
      if (d.gorselId) parcalar.push(gorselKutu(d.gorselId, 'a-gorsel-tam', ''));
    } else {
      if (d.gorselId) parcalar.push(gorselKutu(d.gorselId, 'a-gorsel-tam', d.tur === 'etkinlik' ? 'Etkinlik afişi' : ''));
      if (d.tur === 'ilan' && d.kurum) parcalar.push(h('span', { 'class': 'kicker', text: d.kurum }));
      parcalar.push(h('h2', { id: 'a-sayfa-baslik', text: d.baslik }));
      var bilgi = [];
      if (d.tur === 'etkinlik') {
        if (d.baslangic) bilgi.push(['Tarih', tarihAraligi(d.baslangic, d.bitis)]);
        if (d.yer) bilgi.push(['Yer', d.yer]);
      } else if (d.tarih) bilgi.push([M('sonBasvuru'), tarihYaz(d.tarih)]);
      if (d.olusturma) bilgi.push(['Paylaşıldı', kacOnce(d.olusturma)]);
      parcalar.push(h('dl', { 'class': 'a-bilgi' }, [].concat.apply([], bilgi.map(function (b) {
        return [h('dt', { text: b[0] }), h('dd', { text: b[1] })];
      }))));
      if (gecti(d)) parcalar.push(h('span', { 'class': 'tag a-gecti-satir', text: M('gecti') }));
      if (d.metin) parcalar.push(h('p', { 'class': 'a-aciklama' }, [linkli(d.metin)]));
      if (d.link) parcalar.push(h('a', { 'class': 'btn primary a-git', href: d.link, target: '_blank', rel: 'noopener noreferrer', text: M('baglanti') + ' ↗' }));
    }
    parcalar.push(h('div', { 'class': 'msg', id: 'a-sayfa-msg', role: 'status' }));
    if (yonetici) parcalar.push(yoneticiCubugu(d));
    sayfaIc.replaceChildren.apply(sayfaIc, parcalar);
  }
  $('a-kapat').addEventListener('click', kapat);
  $('a-paylas').addEventListener('click', function () {
    var d = acikId && bul(acikId), url = location.href;
    var baslik = d ? (d.baslik || d.metin.slice(0, 60)) : 'OdyoBOT';
    if (navigator.share) { navigator.share({ title: baslik, url: url }).catch(function () {}); return; }
    var msg = $('a-sayfa-msg');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { if (msg) msg.textContent = M('kopyalandi'); }, function () { if (msg) msg.textContent = url; });
    } else if (msg) msg.textContent = url;
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && acikId) kapat(); });
  window.addEventListener('hashchange', hashKontrol);

  /* ---------- yönetici: düzenle / sil ---------- */
  var silHazir = false, silZamani = null;
  function yoneticiCubugu(d) {
    var duz = h('button', { 'class': 'btn', type: 'button', text: 'Düzenle' });
    duz.addEventListener('click', function () { var x = d; kapat(); setTimeout(function () { formDoldur(x); }, 80); });
    var sil = h('button', { 'class': 'btn tehlike', type: 'button', text: silHazir ? 'Emin misin? Sil' : 'Sil' });
    sil.addEventListener('click', function () {
      if (!silHazir) {
        silHazir = true; clearTimeout(silZamani);
        silZamani = setTimeout(function () { silHazir = false; if (acikId === d.id) sayfaIcerik(d.id); }, 4000);
        sayfaIcerik(d.id); return;
      }
      silHazir = false; clearTimeout(silZamani);
      if (!db) return;
      var b = db.batch();
      b.delete(db.collection('duyurular').doc(d.id));
      if (d.gorselId) b.delete(db.collection('gorseller').doc(d.gorselId));
      sil.disabled = true; sil.textContent = 'Siliniyor…';
      b.commit().then(function () { kapat(); }).catch(function () {
        var m = $('a-sayfa-msg'); if (m) { m.textContent = 'Silinemedi. Bağlantını kontrol edip tekrar dene.'; m.className = 'msg err'; }
        sil.disabled = false; sil.textContent = 'Sil';
      });
    });
    return h('div', { 'class': 'admin-bar a-yonetici' }, [duz, sil]);
  }

  /* ---------- yönetici: paylaşım formu ---------- */
  var form = $('a-form'), formTur = 'etkinlik', duzenlenen = null;
  var foto = { durum: 'yok', veri: '' };   // durum: yok | yeni | mevcut
  function turSec(t) {
    formTur = t;
    form.querySelectorAll('[data-tur]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-tur') === t ? 'true' : 'false'); });
    form.querySelectorAll('[data-icin]').forEach(function (el) { el.hidden = el.getAttribute('data-icin').split(' ').indexOf(t) === -1; });
    var haber = t === 'haber';
    $('a-metin-l').textContent = haber ? 'Haber metni' : 'Açıklama';
    $('a-metin').maxLength = haber ? HABER_SINIRI : METIN_SINIRI;
    if ($('a-metin').value.length > $('a-metin').maxLength) $('a-metin').value = $('a-metin').value.slice(0, $('a-metin').maxLength);
    sayac();
  }
  function sayac() {
    var el = $('a-sayac');
    if (formTur !== 'haber') { el.textContent = ''; el.className = 'a-sayac'; return; }
    var kalan = HABER_SINIRI - $('a-metin').value.length;
    el.textContent = 'Kalan: ' + kalan + ' karakter';
    el.className = 'a-sayac' + (kalan <= 20 ? ' az' : '');
  }
  form.querySelectorAll('[data-tur]').forEach(function (b) { b.addEventListener('click', function () { turSec(b.getAttribute('data-tur')); }); });
  $('a-metin').addEventListener('input', sayac);

  function fotoGoster() {
    var var_ = foto.durum !== 'yok';
    $('a-foto-on').hidden = !var_;
    $('a-foto-sec').textContent = var_ ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle';
    if (!var_) $('a-foto-img').removeAttribute('src');
  }
  $('a-foto-sec').addEventListener('click', function () { $('a-foto').click(); });
  $('a-foto-kaldir').addEventListener('click', function () { foto = { durum: 'yok', veri: '' }; fotoGoster(); });
  $('a-foto').addEventListener('change', function () {
    var dosya = this.files && this.files[0];
    this.value = '';
    if (!dosya) return;
    var msg = $('a-msg'); msg.className = 'msg'; msg.textContent = 'Fotoğraf hazırlanıyor…';
    $('a-gonder').disabled = true;
    fotoHazirla(dosya).then(function (v) {
      foto = { durum: 'yeni', veri: v };
      $('a-foto-img').src = v;
      msg.textContent = 'Fotoğraf hazır (' + Math.round(v.length * 3 / 4 / 1024) + ' KB).';
      fotoGoster();
    }).catch(function (e) {
      msg.className = 'msg err';
      msg.textContent = e && e.message === 'buyuk' ? 'Fotoğraf yeterince küçültülemedi. Daha küçük bir fotoğraf seç.' : 'Bu dosya fotoğraf olarak açılamadı. JPEG veya PNG dene.';
    }).then(function () { $('a-gonder').disabled = false; });
  });
  // Tarayıcıda küçültme: uzun kenar en çok 1200 px, JPEG ~0,75; büyükse kalite kademeli düşer, yetmezse boyut küçülür.
  function fotoHazirla(dosya) {
    return new Promise(function (ok, hata) {
      var url = URL.createObjectURL(dosya), img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var en = img.naturalWidth, boy = img.naturalHeight;
        if (!en || !boy) { hata(new Error('okunamadi')); return; }
        var olcek = Math.min(1, FOTO_UZUN_KENAR / Math.max(en, boy));
        var zemin = getComputedStyle(document.documentElement).getPropertyValue('--cikti-zemin').trim() || 'white';
        for (var tur = 0; tur < 4; tur++) {
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(en * olcek)); c.height = Math.max(1, Math.round(boy * olcek));
          var x = c.getContext('2d');
          x.fillStyle = zemin; x.fillRect(0, 0, c.width, c.height); // saydam PNG siyah çıkmasın
          x.drawImage(img, 0, 0, c.width, c.height);
          for (var i = 0; i < FOTO_KALITELER.length; i++) {
            var v = c.toDataURL('image/jpeg', FOTO_KALITELER[i]);
            if (v.indexOf(JPEG_ON) !== 0) { hata(new Error('okunamadi')); return; }
            if (v.length <= FOTO_SINIRI) { ok(v); return; }
          }
          olcek *= 0.8;
        }
        hata(new Error('buyuk'));
      };
      img.onerror = function () { URL.revokeObjectURL(url); hata(new Error('okunamadi')); };
      img.src = url;
    });
  }

  function formSifirla() {
    duzenlenen = null; form.reset(); foto = { durum: 'yok', veri: '' }; fotoGoster();
    $('a-gonder').textContent = 'Yayınla'; $('a-vazgec').hidden = true; $('a-form-ozet').textContent = 'Yeni paylaşım';
    turSec(formTur);
  }
  function formDoldur(d) {
    duzenlenen = d; form.reset();
    turSec(d.tur);
    $('a-baslik').value = d.baslik; $('a-kurum').value = d.kurum; $('a-tarih').value = d.tarih;
    $('a-baslangic').value = d.baslangic; $('a-bitis').value = d.bitis; $('a-yer').value = d.yer;
    $('a-metin').value = d.metin.slice(0, $('a-metin').maxLength); $('a-link').value = d.link;
    sayac();
    foto = d.gorselId ? { durum: 'mevcut', veri: '' } : { durum: 'yok', veri: '' };
    fotoGoster();
    if (d.gorselId) gorselAl(d.gorselId).then(function (v) { if (v && duzenlenen === d) $('a-foto-img').src = v; });
    $('a-gonder').textContent = 'Güncelle'; $('a-vazgec').hidden = false; $('a-form-ozet').textContent = 'Paylaşımı düzenle';
    $('a-msg').textContent = ''; $('a-msg').className = 'msg';
    $('compose').open = true;
    try { $('compose').scrollIntoView({ block: 'start' }); } catch (e) {}
  }
  $('a-vazgec').addEventListener('click', function () { formSifirla(); $('a-msg').textContent = ''; });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('a-msg'); msg.className = 'msg';
    function hata(t) { msg.textContent = t; msg.className = 'msg err'; }
    if (!db) { hata('Veri deposuna ulaşılamıyor.'); return; }
    var t = formTur, v = { tur: t };
    function al(id) { return $(id).value.trim(); }
    var metin = al('a-metin'), link = al('a-link');
    if (t === 'haber') {
      if (!metin) { hata('Haber metni gerekli.'); return; }
      if (metin.length > HABER_SINIRI) { hata('Haber metni en çok ' + HABER_SINIRI + ' karakter olabilir.'); return; }
      v.metin = metin;
    } else {
      v.baslik = al('a-baslik');
      if (!v.baslik) { hata('Başlık gerekli.'); return; }
      if (metin) v.metin = metin.slice(0, METIN_SINIRI);
      if (link) { if (!U.safeLink(link)) { hata('Bağlantı https:// ile başlamalı.'); return; } v.link = link; }
      if (t === 'etkinlik') {
        var b = al('a-baslangic'), s = al('a-bitis');
        if (!b) { hata('Başlangıç tarihi gerekli.'); return; }
        if (s && s < b) { hata('Bitiş tarihi başlangıçtan önce olamaz.'); return; }
        v.baslangic = b; if (s) v.bitis = s;
        if (al('a-yer')) v.yer = al('a-yer');
      } else {
        if (al('a-kurum')) v.kurum = al('a-kurum');
        if (al('a-tarih')) v.tarih = al('a-tarih');
      }
    }
    var simdi = Date.now();
    v.olusturma = duzenlenen && duzenlenen.olusturma ? duzenlenen.olusturma : simdi;
    if (duzenlenen) v.guncelleme = simdi;
    // Fotoğraf ve paylaşım tek seferde (batch) yazılır: biri olmazsa hiçbiri olmaz.
    var batch = db.batch(), eskiGorsel = duzenlenen ? duzenlenen.gorselId : '';
    if (foto.durum === 'yeni') {
      var gref = db.collection('gorseller').doc();
      batch.set(gref, { veri: foto.veri, olusturma: simdi });
      v.gorselId = gref.id;
      if (eskiGorsel) batch.delete(db.collection('gorseller').doc(eskiGorsel));
    } else if (foto.durum === 'mevcut' && eskiGorsel) {
      v.gorselId = eskiGorsel;
    } else if (eskiGorsel) {
      batch.delete(db.collection('gorseller').doc(eskiGorsel));
    }
    var dref = duzenlenen ? db.collection('duyurular').doc(duzenlenen.id) : db.collection('duyurular').doc();
    batch.set(dref, v);   // set: eski biçimdeki alanlar (ör. "not") temizlenir
    var dugme = $('a-gonder'), eskiYazi = dugme.textContent, guncelleme = !!duzenlenen;
    dugme.disabled = true; dugme.textContent = 'Yükleniyor…';
    var yavas = setTimeout(function () { msg.className = 'msg'; msg.textContent = 'Bağlantı yavaş; gönderim sürüyor…'; }, 15000);
    batch.commit().then(function () {
      if (v.gorselId && foto.durum === 'yeni') gorselHazir[v.gorselId] = foto.veri;
      formSifirla();
      msg.className = 'msg';
      msg.textContent = guncelleme ? 'Güncellendi.' : 'Yayınlandı. Herkes görebilir.';
    }).catch(function () {
      hata('Yayınlanamadı. Düzenleme yetkin olmayabilir, fotoğraf çok büyük olabilir ya da bağlantı kesilmiş olabilir.');
      dugme.textContent = eskiYazi;
    }).then(function () { clearTimeout(yavas); dugme.disabled = false; if (dugme.textContent === 'Yükleniyor…') dugme.textContent = 'Yayınla'; });
  });

  /* ---------- olaylar ---------- */
  window.addEventListener('odyo:db', function (e) { dbGeldi(e.detail); });
  window.addEventListener('odyo:db-yok', function () { clearTimeout(vazgecZamani); if (!yuklendi) { ulasilamadi = true; ciz(); } if (acikId) sayfaIcerik(acikId); });
  window.addEventListener('odyo:yetki', function (e) {
    yonetici = !!e.detail;
    if (!yonetici) formSifirla();
    if (acikId) sayfaIcerik(acikId);
  });
  window.addEventListener('odyo:metinler', function () { ciz(); if (acikId) sayfaIcerik(acikId); });

  turSec('etkinlik');
  ciz();
  if (U.db) dbGeldi(U.db);
  else {
    // Bağlantı bu dosya yüklenmeden önce başarısız olduysa olayı kaçırmış olabiliriz.
    if (U.dbYok) { clearTimeout(vazgecZamani); ulasilamadi = true; ciz(); }
    hashKontrol();
  }

  // Test ve hata ayıklama için (veri değil, yalnızca yardımcılar).
  window.OdyoAkis = { normal: normal, tarihAraligi: tarihAraligi, kacOnce: kacOnce, gecti: gecti };
})();
