/* Terimler sözlüğü (#sozluk): odyolojik terimler, öğrenme kartları ve liste.
   - Temel terimler kodda (sozluk-veri.js, window.SOZLUK_TEMEL); yöneticinin ekledikleri ve düzenlemeleri Firestore 'sozluk' koleksiyonunda: tr (Türkçe karşılık), en (İngilizce terim), kisaltma, aciklama.
     Herkes okur, yalnızca yönetici yazar (firestore.rules). Liste Türkçe karşılığa göre alfabetik.
   - Kartlar: ön yüzde Türkçe (kalın) ve İngilizce (küçük), dokununca döner, arkada açıklama.
     Sola at = "Tekrar et": tekrar listesine girer, aynı oturumda birkaç kart sonra yeniden gelir.
     Sağa at = "Biliyorum": bir üst kutuya çıkar, giderek seyrek gösterilir (aralıklı tekrar, Leitner kutuları).
   - Öğrenme durumu yalnızca bu cihazda saklanır (localStorage 'odybot:sozlukTekrar'); sunucuya gitmez.
   - Yazılar index.html #sz-metinler (yönetici düzenler). app.js 'odyo:db', 'odyo:db-yok', 'odyo:yetki', 'odyo:metinler'
     olaylarıyla haber verir; ana sayfa araması window.Sozluk.terimler() ile terimleri okur. */
(function () {
  var U = window.OdyoUI;
  if (!U) return;
  var h = U.h, $ = U.$;

  /* ---------- ayarlar (tek yer) ---------- */
  var ARALIK_GUN = [0, 1, 3, 7, 16, 35];   // kutu 1–5: "Biliyorum" sonrası kaç gün sonra yeniden gösterilir
  var TEKRAR_ARA = 3;                       // "Tekrar et" denen kart oturumda kaç kart sonra yeniden gelir
  var ATMA_ESIGI = 90;                      // piksel: bundan uzun kaydırma kartı atar
  var SINIR = { tr: 100, en: 120, kisaltma: 30, aciklama: 1000 };
  var DEPO = 'odybot:sozlukTekrar';
  var GUN = 86400000;

  /* ---------- temel terimler (sozluk-veri.js, 2026-11-21) ----------
     Kodda gelen terimler hemen (internetsiz de) görünür. Yönetici düzenlerse aynı kimlikle Firestore 'sozluk/<kimlik>'
     belgesi yazılır ve koddaki metnin yerine geçer ("Varsayılana dön" o belgeyi siler). Silerse
     'icerik/sozluk-gizli.<kimlik>' belgesiyle gizlenir (firestore.rules değişmeden; icerik kuralı yeterli). */
  var TEMEL = (window.SOZLUK_TEMEL || []).filter(function (t) { return t && t.id && t.tr; });
  var TEMEL_ID = {}; TEMEL.forEach(function (t) { TEMEL_ID[t.id] = t; });
  var GIZLI_ON = 'sozluk-gizli.';
  var dbTerim = {}, gizli = {};

  /* ---------- durum ---------- */
  var db = null, yonetici = !!U.yonetici, terimler = [], yuklendi = false, ulasilamadi = false;
  var panel = 'kartlar', kuyruk = [], cevrik = false, duzenlenen = null, acikTerim = null, arama = '';
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function M(ad) { var el = document.querySelector('#sz-metinler [data-m="' + ad + '"]'); return el ? el.textContent.trim() : ad; }
  function yazi(x) { return typeof x === 'string' ? x : ''; }
  function sirala(a, b) { return a.tr.localeCompare(b.tr, 'tr', { sensitivity: 'base' }); }
  function kucuk(s) { return (s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i'); }

  /* ---------- öğrenme durumu (yalnızca cihazda) ---------- */
  // { <terim kimliği>: { k: kutu 0–5, s: sonraki gösterim (ms), g: kaç kez görüldü } }
  function durumOku() { try { var o = JSON.parse(localStorage.getItem(DEPO) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  var DURUM = durumOku();
  function durumYaz() { try { localStorage.setItem(DEPO, JSON.stringify(DURUM)); } catch (e) {} }
  function durum(id) { return DURUM[id] || { k: 0, s: 0, g: 0 }; }
  function tekrarda(id) { var d = DURUM[id]; return !!d && d.g > 0 && d.k === 0; }
  function ogrenildi(id) { var d = DURUM[id]; return !!d && d.k > 0; }
  function zamaniGeldi(id) { var d = DURUM[id]; return !d || d.s <= Date.now(); }
  function terim(id) { for (var i = 0; i < terimler.length; i++) if (terimler[i].id === id) return terimler[i]; return null; }

  /* ---------- oturum kuyruğu ---------- */
  // Önce tekrar listesindekiler, sonra zamanı gelen öğrenilmişler, en son hiç görülmemişler (alfabetik).
  function kuyrukKur(yalnizTekrar) {
    var tek = [], eski = [], yeni = [];
    terimler.forEach(function (t) {
      if (yalnizTekrar) { if (tekrarda(t.id)) tek.push(t.id); return; }
      if (!zamaniGeldi(t.id)) return;
      if (tekrarda(t.id)) tek.push(t.id); else if (DURUM[t.id]) eski.push(t.id); else yeni.push(t.id);
    });
    kuyruk = tek.concat(eski, yeni); cevrik = false;
  }
  function hepsiniKur() {
    kuyruk = terimler.map(function (t) { return t.id; });
    for (var i = kuyruk.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = kuyruk[i]; kuyruk[i] = kuyruk[j]; kuyruk[j] = x; }
    cevrik = false;
  }
  function cevapla(biliyor) {
    var id = kuyruk.shift(); if (!id) return;
    var d = durum(id); d.g = (d.g || 0) + 1;
    if (biliyor) { d.k = Math.min(5, (d.k || 0) + 1); d.s = Date.now() + ARALIK_GUN[d.k] * GUN; }
    else { d.k = 0; d.s = Date.now(); kuyruk.splice(Math.min(TEKRAR_ARA, kuyruk.length), 0, id); }
    DURUM[id] = d; durumYaz(); cevrik = false;
    ciz();
  }
  function sonrakiTarih() {
    var en = Infinity;
    terimler.forEach(function (t) { var d = DURUM[t.id]; if (d && d.s > Date.now() && d.s < en) en = d.s; });
    return isFinite(en) ? en : 0;
  }
  function tarihYaz(ms) {
    var d = new Date(ms), AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return d.getDate() + ' ' + AY[d.getMonth()];
  }

  /* ---------- çizim ---------- */
  function fill(el, kids) { el.textContent = ''; kids.forEach(function (k) { if (k) el.appendChild(k); }); }
  function sayaclar() {
    var tek = 0, ogr = 0, sira = 0;
    terimler.forEach(function (t) { if (tekrarda(t.id)) tek++; else if (ogrenildi(t.id)) ogr++; });
    sira = kuyruk.length;
    $('sz-sayac').textContent = M('sayacSira').replace('{n}', sira) + ' · ' + M('sayacTekrar').replace('{n}', tek) + ' · ' + M('sayacOgrenilen').replace('{n}', ogr);
    $('sz-seg-tekrar').textContent = M('panelTekrar') + (tek ? ' (' + tek + ')' : '');
  }
  // Düğme yazıları (#sz-metinler; düğmenin içine düzenleme bağlantısı konamadığı için oradan okunur)
  function metinYaz() {
    $('sz-seg-kartlar').textContent = M('panelKartlar'); $('sz-seg-liste').textContent = M('panelListe');
    $('sz-btn-tekrar').textContent = '← ' + M('btnTekrar'); $('sz-btn-cevir').textContent = M('btnCevir'); $('sz-btn-biliyorum').textContent = M('btnBiliyorum') + ' →';
    $('sz-tekrar-calis').textContent = M('tekrarCalis'); $('sz-hepsi').textContent = M('hepsi'); $('sz-tekrar-baslat').textContent = M('tekrarBaslat');
  }
  function ciz() {
    metinYaz();
    ['kartlar', 'liste', 'tekrar'].forEach(function (p) {
      $('sz-seg-' + p).setAttribute('aria-pressed', panel === p ? 'true' : 'false');
      $('sz-p-' + p).hidden = panel !== p;
    });
    var bos = yuklendi && !terimler.length;
    $('sz-bos').hidden = !bos && !(ulasilamadi && !terimler.length);
    $('sz-bos').textContent = ulasilamadi && !terimler.length ? M('ulasilamadi') : M('bos');
    $('sz-yukleniyor').hidden = yuklendi || ulasilamadi;
    sayaclar(); gizliYaz();
    if (panel === 'kartlar') kartCiz();
    else listeCiz(panel === 'tekrar');
  }

  /* ---- kartlar ---- */
  function yuz(t, arka) {
    if (arka) return h('div', { 'class': 'sz-yuz sz-arka' }, [h('p', { 'class': 'sz-aciklama', text: t.aciklama || M('aciklamaYok') })]);
    return h('div', { 'class': 'sz-yuz sz-on' }, [
      h('p', { 'class': 'sz-tr', text: t.tr }),
      t.en ? h('p', { 'class': 'sz-en', text: t.en }) : null,
      t.kisaltma ? h('span', { 'class': 'sz-kisa', text: t.kisaltma }) : null,
      h('span', { 'class': 'sz-cevir-ipucu', 'aria-hidden': 'true', text: M('cevirIpucu') })
    ]);
  }
  function kartCiz() {
    var yigin = $('sz-yigin'), alan = $('sz-kart-alan'), son = $('sz-bitti');
    var t = terim(kuyruk[0]);
    while (kuyruk.length && !t) { kuyruk.shift(); t = terim(kuyruk[0]); }   // silinmiş terimler atlanır
    alan.hidden = !terimler.length;
    if (!terimler.length) return;
    if (!t) {
      fill(yigin, []); yigin.hidden = true; son.hidden = false; $('sz-dugmeler').hidden = true; $('sz-ipucu').hidden = true;
      var st = sonrakiTarih();
      $('sz-bitti-yazi').textContent = M('bitti') + (st ? ' ' + M('sonraki').replace('{tarih}', tarihYaz(st)) : '');
      $('sz-tekrar-calis').hidden = !terimler.some(function (x) { return tekrarda(x.id); });
      return;
    }
    yigin.hidden = false; son.hidden = true; $('sz-dugmeler').hidden = false; $('sz-ipucu').hidden = false;
    var alt = terim(kuyruk[1]);
    var ic = h('div', { 'class': 'sz-kart-ic' + (cevrik ? ' cevrik' : '') }, [yuz(t, false), yuz(t, true)]);
    var kart = h('div', { 'class': 'sz-kart', tabindex: '0', role: 'button', 'aria-label': t.tr + (t.en ? ', ' + t.en : '') + '. ' + M('kartEtiket') }, [
      ic, h('span', { 'class': 'sz-damga sz-damga-sol', 'aria-hidden': 'true', text: M('damgaTekrar') }), h('span', { 'class': 'sz-damga sz-damga-sag', 'aria-hidden': 'true', text: M('damgaBiliyorum') })
    ]);
    fill(yigin, [alt ? h('div', { 'class': 'sz-kart sz-kart-alt', 'aria-hidden': 'true' }, [h('div', { 'class': 'sz-kart-ic' }, [yuz(alt, false)])]) : null, kart]);
    $('sz-canli').textContent = cevrik ? (t.aciklama || '') : t.tr + (t.en ? ' — ' + t.en : '');
    kaydirma(kart, ic);
  }
  function cevir() { cevrik = !cevrik; var ic = document.querySelector('#sz-yigin .sz-kart:not(.sz-kart-alt) .sz-kart-ic'); if (ic) ic.classList.toggle('cevrik', cevrik); var t = terim(kuyruk[0]); if (t) $('sz-canli').textContent = cevrik ? (t.aciklama || '') : t.tr; }
  // Kartı yana atma (animasyonlu); bitince cevap kaydedilir.
  function at(kart, yon) {
    if (!kart || kart.dataset.gidiyor) return;
    kart.dataset.gidiyor = '1';
    if (reduce) { cevapla(yon > 0); return; }
    kart.style.transition = 'transform .32s ease-in, opacity .32s ease-in';
    kart.style.transform = 'translateX(' + (yon * 130) + '%) rotate(' + (yon * 22) + 'deg)';
    kart.style.opacity = '0';
    kart.querySelector(yon > 0 ? '.sz-damga-sag' : '.sz-damga-sol').style.opacity = 1;
    setTimeout(function () { cevapla(yon > 0); }, 330);
  }
  function kaydirma(kart, ic) {
    var bas = null, dx = 0, dy = 0, yatay = false;
    var sol = kart.querySelector('.sz-damga-sol'), sag = kart.querySelector('.sz-damga-sag');
    kart.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      bas = { x: e.clientX, y: e.clientY, t: Date.now() }; dx = 0; dy = 0; yatay = false;
      kart.style.transition = 'none';
    });
    kart.addEventListener('pointermove', function (e) {
      if (!bas) return;
      dx = e.clientX - bas.x; dy = e.clientY - bas.y;
      if (!yatay && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { yatay = true; try { kart.setPointerCapture(e.pointerId); } catch (x) {} }
      if (!yatay) return;
      kart.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 18) + 'deg)';
      sol.style.opacity = Math.max(0, Math.min(1, -dx / ATMA_ESIGI)); sag.style.opacity = Math.max(0, Math.min(1, dx / ATMA_ESIGI));
    });
    function birak(e) {
      if (!bas) return;
      var hiz = Math.abs(dx) / Math.max(1, Date.now() - bas.t), b = bas; bas = null;
      if (yatay && (Math.abs(dx) > ATMA_ESIGI || (hiz > 0.6 && Math.abs(dx) > 30))) { at(kart, dx > 0 ? 1 : -1); return; }
      kart.style.transition = reduce ? 'none' : 'transform .25s ease-out'; kart.style.transform = ''; sol.style.opacity = 0; sag.style.opacity = 0;
      if (!yatay && Math.abs(dx) < 8 && Math.abs(dy) < 8 && e.type === 'pointerup') cevir();
    }
    kart.addEventListener('pointerup', birak); kart.addEventListener('pointercancel', birak);
    kart.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cevir(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); at(kart, -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); at(kart, 1); }
    });
  }
  function ustKart() { return document.querySelector('#sz-yigin .sz-kart:not(.sz-kart-alt)'); }

  /* ---- liste ---- */
  function listeCiz(yalnizTekrar) {
    var q = kucuk(arama), kutu = yalnizTekrar ? $('sz-tekrar-liste') : $('sz-liste');
    var l = terimler.filter(function (t) {
      if (yalnizTekrar && !tekrarda(t.id)) return false;
      if (!q) return true;
      return kucuk(t.tr + ' ' + t.en + ' ' + t.kisaltma + ' ' + t.aciklama).indexOf(q) !== -1;
    });
    if (yalnizTekrar) { $('sz-tekrar-bos').hidden = !!l.length; $('sz-tekrar-baslat').hidden = !l.length; }
    else $('sz-liste-bos').hidden = !!l.length || !terimler.length;
    var harf = '';
    fill(kutu, l.map(function (t) {
      var ilk = t.tr.charAt(0).toLocaleUpperCase('tr'), baslik = null;
      if (!yalnizTekrar && ilk !== harf) { harf = ilk; baslik = h('h3', { 'class': 'sz-harf', text: ilk }); }
      var acik = acikTerim === t.id;
      var dugme = h('button', { type: 'button', 'class': 'sz-satir', 'aria-expanded': acik ? 'true' : 'false', id: 'sz-t-' + t.id }, [
        h('span', { 'class': 'sz-satir-tr', text: t.tr }),
        t.kisaltma ? h('span', { 'class': 'sz-kisa', text: t.kisaltma }) : null,
        t.en ? h('span', { 'class': 'sz-satir-en', text: t.en }) : null
      ]);
      dugme.addEventListener('click', function () { acikTerim = acik ? null : t.id; listeCiz(yalnizTekrar); var y = $('sz-t-' + t.id); if (y) y.focus(); });
      var ek = [];
      if (acik) {
        ek.push(h('p', { 'class': 'sz-satir-aciklama', text: t.aciklama || M('aciklamaYok') }));
        var d = DURUM[t.id];
        ek.push(h('p', { 'class': 'meta', text: !d ? M('durumYeni') : d.k === 0 ? M('durumTekrar') : M('durumKutu').replace('{k}', d.k).replace('{tarih}', tarihYaz(d.s)) }));
        if (yonetici) {
          var duz = h('button', { type: 'button', 'class': 'linkbtn', text: M('duzenle') }), sil = h('button', { type: 'button', 'class': 'linkbtn danger', text: M('sil') });
          duz.addEventListener('click', function () { formDoldur(t); });
          sil.addEventListener('click', function () { terimSil(t); });
          var don = null;
          if (t.temel && t.degisti) {   // düzenlenmiş temel terim: koddaki metne dönülebilir
            don = h('button', { type: 'button', 'class': 'linkbtn', text: M('varsayilan') });
            don.addEventListener('click', function () { varsayilanaDon(t); });
          }
          ek.push(h('div', { 'class': 'admin-bar' }, [duz, don, sil]));
        }
      }
      var li = h('li', { 'class': 'sz-oge' + (acik ? ' acik' : '') }, [dugme].concat(ek));
      if (!baslik) return li;
      var frag = document.createDocumentFragment(); frag.appendChild(baslik); frag.appendChild(li); return frag;
    }));
  }

  /* ---------- yönetici: ekle / düzenle / sil ---------- */
  function formSifirla() {
    duzenlenen = null;
    ['tr', 'en', 'kisaltma', 'aciklama'].forEach(function (k) { $('sz-f-' + k).value = ''; });
    $('sz-gonder').textContent = M('ekle'); $('sz-vazgec').hidden = true; $('sz-msg').textContent = ''; $('sz-msg').className = 'msg';
  }
  function formDoldur(t) {
    duzenlenen = t.id;
    ['tr', 'en', 'kisaltma', 'aciklama'].forEach(function (k) { $('sz-f-' + k).value = t[k] || ''; });
    $('sz-gonder').textContent = M('kaydet'); $('sz-vazgec').hidden = false;
    $('sz-yonetim').open = true;
    try { $('sz-yonetim').scrollIntoView({ block: 'start' }); } catch (e) {}
    $('sz-f-tr').focus();
  }
  function mesaj(metin, hata) { $('sz-msg').textContent = metin; $('sz-msg').className = 'msg' + (hata ? ' err' : ''); }
  $('sz-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!db || !yonetici) { mesaj(M('baglantiYok'), true); return; }
    var v = {};
    ['tr', 'en', 'kisaltma', 'aciklama'].forEach(function (k) { v[k] = $('sz-f-' + k).value.trim().slice(0, SINIR[k]); });
    if (!v.tr) { mesaj(M('trGerekli'), true); $('sz-f-tr').focus(); return; }
    var ayni = terimler.filter(function (t) { return t.id !== duzenlenen && kucuk(t.tr) === kucuk(v.tr); })[0];
    if (ayni) { mesaj(M('zatenVar'), true); return; }
    var dugme = $('sz-gonder'); dugme.disabled = true; mesaj(M('kaydediliyor'));
    v.guncelleme = Date.now();
    // Temel terim ilk kez düzenleniyorsa veritabanında belgesi yoktur: aynı kimlikle oluşturulur (set + merge).
    var is = duzenlenen ? db.collection('sozluk').doc(duzenlenen).set(v, { merge: true }) : db.collection('sozluk').add(Object.assign({ olusturma: Date.now() }, v));
    is.then(function () { var yeniMi = !duzenlenen; formSifirla(); mesaj(yeniMi ? M('eklendi') : M('kaydedildi')); if (U.bildirim) U.bildirim(yeniMi ? M('eklendi') : M('kaydedildi')); })
      .catch(function () { mesaj(M('kaydedilemedi'), true); })
      .then(function () { dugme.disabled = false; });
  });
  $('sz-vazgec').addEventListener('click', formSifirla);
  function terimSil(t) {
    if (!db || !yonetici) return;
    if (!window.confirm(M('silOnay').replace('{terim}', t.tr))) return;
    var isler = [];
    if (dbTerim[t.id]) isler.push(db.collection('sozluk').doc(t.id).delete());
    if (TEMEL_ID[t.id]) isler.push(db.collection('icerik').doc(GIZLI_ON + t.id).set({ alanlar: { gizli: '1' }, guncelleme: Date.now() }));
    Promise.all(isler).then(function () {
      delete DURUM[t.id]; durumYaz(); if (duzenlenen === t.id) formSifirla(); if (U.bildirim) U.bildirim(M('silindi'));
    }).catch(function () { if (U.bildirim) U.bildirim(M('silinemedi'), 'hata'); });
  }
  function varsayilanaDon(t) {
    if (!db || !yonetici) return;
    db.collection('sozluk').doc(t.id).delete().then(function () {
      if (duzenlenen === t.id) formSifirla(); if (U.bildirim) U.bildirim(M('varsayilanaDonuldu'));
    }).catch(function () { if (U.bildirim) U.bildirim(M('kaydedilemedi'), 'hata'); });
  }
  // Silinen (gizlenen) temel terimleri geri getir
  function gizlileriGeriGetir() {
    if (!db || !yonetici) return;
    var ids = Object.keys(gizli); if (!ids.length) return;
    Promise.all(ids.map(function (id) { return db.collection('icerik').doc(GIZLI_ON + id).delete(); }))
      .then(function () { if (U.bildirim) U.bildirim(M('geriGeldi')); })
      .catch(function () { if (U.bildirim) U.bildirim(M('kaydedilemedi'), 'hata'); });
  }
  $('sz-gizli-geri').addEventListener('click', gizlileriGeriGetir);
  function gizliYaz() {
    var n = Object.keys(gizli).length, kutu = $('sz-gizli');
    kutu.hidden = !yonetici || !n;
    $('sz-gizli-yazi').textContent = M('gizliSayi').replace('{n}', n);
    $('sz-gizli-geri').textContent = M('gizliGeri');
  }

  /* ---------- temel + veritabanı terimlerini birleştir ---------- */
  function birlestir() {
    var l = [], gor = {};
    TEMEL.forEach(function (t) {
      if (gizli[t.id]) return;
      var d = dbTerim[t.id];
      l.push(d ? Object.assign({}, d, { temel: true, degisti: true }) : Object.assign({}, t, { temel: true, degisti: false }));
      gor[t.id] = true;
    });
    Object.keys(dbTerim).forEach(function (id) { if (!gor[id]) l.push(dbTerim[id]); });
    l.sort(sirala);
    var ilk = !terimler.length && !kuyruk.length;
    terimler = l;
    if (ilk) kuyrukKur(false);
    else terimler.forEach(function (t) { if (!DURUM[t.id] && kuyruk.indexOf(t.id) === -1) kuyruk.push(t.id); });   // yeni terim kuyruğun sonuna; silinenler kartCiz'de atlanır
    ciz(); window.dispatchEvent(new CustomEvent('odyo:sozluk'));
  }

  /* ---------- olaylar ---------- */
  ['kartlar', 'liste', 'tekrar'].forEach(function (p) {
    $('sz-seg-' + p).addEventListener('click', function () { panel = p; if (p === 'kartlar' && !kuyruk.length) kuyrukKur(false); ciz(); });
  });
  $('sz-btn-tekrar').addEventListener('click', function () { at(ustKart(), -1); });
  $('sz-btn-biliyorum').addEventListener('click', function () { at(ustKart(), 1); });
  $('sz-btn-cevir').addEventListener('click', cevir);
  $('sz-hepsi').addEventListener('click', function () { hepsiniKur(); ciz(); });
  $('sz-tekrar-calis').addEventListener('click', function () { kuyrukKur(true); ciz(); });
  $('sz-tekrar-baslat').addEventListener('click', function () { kuyrukKur(true); panel = 'kartlar'; ciz(); });
  $('sz-ara').addEventListener('input', function () { arama = this.value; listeCiz(false); });

  function dbGeldi(d) {
    if (db) return; db = d;
    db.collection('sozluk').limit(2000).onSnapshot(function (snap) {
      dbTerim = {};
      snap.forEach(function (doc) {
        var x = doc.data() || {};
        if (!yazi(x.tr)) return;
        dbTerim[doc.id] = { id: doc.id, tr: yazi(x.tr), en: yazi(x.en), kisaltma: yazi(x.kisaltma), aciklama: yazi(x.aciklama) };
      });
      yuklendi = true; ulasilamadi = false;
      birlestir();
    }, function () { ulasilamadi = true; ciz(); });
    // Yöneticinin sildiği (gizlediği) temel terimler
    db.collection('icerik').onSnapshot(function (snap) {
      gizli = {};
      snap.forEach(function (doc) { if (doc.id.indexOf(GIZLI_ON) === 0) gizli[doc.id.slice(GIZLI_ON.length)] = true; });
      birlestir();
    }, function () {});
  }
  window.addEventListener('odyo:db', function (e) { dbGeldi(e.detail); });
  window.addEventListener('odyo:db-yok', function () { if (!yuklendi) { ulasilamadi = true; ciz(); } });
  window.addEventListener('odyo:yetki', function (e) { yonetici = !!e.detail; if (!yonetici) formSifirla(); ciz(); });
  window.addEventListener('odyo:metinler', function () { if (!duzenlenen) $('sz-gonder').textContent = M('ekle'); ciz(); });
  // Ana sayfa aramasından gelen terim: Liste'de açılır
  window.addEventListener('odyo:sozluk-terim', function (e) {
    panel = 'liste'; acikTerim = e.detail || null; arama = ''; $('sz-ara').value = ''; ciz();
    var y = acikTerim && $('sz-t-' + acikTerim); if (y) { try { y.scrollIntoView({ block: 'center' }); } catch (x) {} y.focus(); }
  });
  formSifirla();
  if (TEMEL.length) { yuklendi = true; birlestir(); }   // temel terimler veritabanını beklemeden görünür
  if (U.db) dbGeldi(U.db); else if (U.dbYok) { ulasilamadi = true; }
  ciz();

  window.Sozluk = { terimler: function () { return terimler.slice(); } };
})();
