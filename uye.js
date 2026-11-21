/* Üye girişi (4. adım, 2026-11-21) — Firebase Authentication + Firestore uyeler/{uid}.
   - Giriş yolları: e-posta + şifre ve Google (açılır pencere). Yönetici de aynı formdan girer; düzenleme yetkisi
     yine yalnızca ODYOBOT_ADMIN_UID hesabında (app.js setEditMode; asıl koruma firestore.rules).
   - Üyelik anahtarı: Firestore ayar/uyelik { kayitAcik }. Kapalıyken ekran eskisi gibidir (yalnızca "Yönetici girişi");
     yönetici Ayarlar'dan açar. Gizlilik politikası ve KVKK metni hazır olmadan açılmaz (proje sahibinin kararı).
   - Sunucuda saklanan (proje sahibinin onayı, 2026-11-21): ad (görünen ad, ≤40), meslek ('', ogrenci, odyolog, diger),
     favoriler (not anahtarları), sozluk (terim kimliği → { k, s, g }), olusturma, guncelleme. E-posta yalnızca
     Firebase Authentication'da. Vaka kayıtları hiçbir zaman gönderilmez.
   - Eşitleme: girişte yerel ve hesaptaki favoriler birleşir (birleşim), sözlükte her terim için daha çok görülmüş kayıt
     kalır (sozluk.js durumBirlestir). Sonra her değişiklik 1,5 sn sonra hesaba yazılır.
   - Yazılar index.html #uye-metinler (yönetici düzenler). app.js olayları: odyo:db, odyo:uye, odyo:yetki, odyo:metinler,
     odyo:favori; sozluk.js: odyo:sozluk-durum. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function M(ad) { var el = document.querySelector('#uye-metinler [data-m="' + ad + '"]'); return el ? el.textContent.trim() : ad; }
  var MESLEK = [['', 'meslekSecilmedi'], ['ogrenci', 'meslekOgrenci'], ['odyolog', 'meslekOdyolog'], ['diger', 'meslekDiger']];
  var FAV = 'odybot:favoriNotlar';

  var db = null, auth = null, uye = null, yonetici = false, kayitAcik = false, kip = 'giris';
  var profil = null, profilHazir = false, yazZ = null;

  function mesaj(el, yazi, hata) { el.textContent = yazi || ''; el.className = 'msg' + (yazi ? (hata ? ' err' : ' ok') : ''); }
  function hataYazi(err) {
    var c = (err && err.code) || '';
    if (/popup-closed-by-user|cancelled-popup-request/.test(c)) return '';
    if (/email-already-in-use/.test(c)) return 'Bu e-posta adresiyle zaten bir hesap var. "Giriş yap"ı seç; şifreni hatırlamıyorsan "Şifremi unuttum"a dokun.';
    if (/weak-password/.test(c)) return M('kisaSifre');
    if (/popup-blocked/.test(c)) return 'Tarayıcı açılır pencereyi engelledi. Açılır pencerelere izin verip tekrar dene.';
    if (/account-exists-with-different-credential/.test(c)) return 'Bu e-posta adresi başka bir yolla (e-posta ve şifre) kayıtlı. O yolla giriş yap.';
    if (/requires-recent-login/.test(c)) return M('yenidenGiris');
    if (/unauthorized-domain/.test(c)) return 'Bu adresten Google ile giriş henüz açılmadı (Firebase konsolunda yetkili alan adı eklenmeli).';
    if (/operation-not-allowed/.test(c)) return 'Bu giriş yolu henüz açılmadı (Firebase konsolunda etkinleştirilmeli).';
    if (/missing-email/.test(c)) return M('epostaYaz');
    var U = window.OdyoUI;
    return U && U.authHata ? U.authHata(err) : 'İşlem yapılamadı.' + (c ? ' (' + c + ')' : '');
  }
  function belge() { return db && uye ? db.collection('uyeler').doc(uye.uid) : null; }
  function zaman() { return Date.now(); }

  /* ---------- eşitleme ---------- */
  function yerelFav() { try { var a = JSON.parse(localStorage.getItem(FAV) || '[]'); return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string'; }) : []; } catch (e) { return []; } }
  function sozlukDurum() { var S = window.Sozluk; return S && S.durum ? S.durum() : {}; }
  function profilYukle() {
    var b = belge(); if (!b) return;
    var kim = uye.uid;
    b.get().then(function (s) {
      if (!uye || uye.uid !== kim) return;
      var v = s.exists ? (s.data() || {}) : null;
      // Favoriler: yerel ve hesaptaki birleşir
      var fav = yerelFav();
      ((v && v.favoriler) || []).forEach(function (k) { if (typeof k === 'string' && fav.indexOf(k) < 0) fav.push(k); });
      try { localStorage.setItem(FAV, JSON.stringify(fav)); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('odyo:favori-yuklendi', { detail: fav })); } catch (e) {}
      // Sözlük: terim terim birleşir
      if (v && v.sozluk && window.Sozluk && window.Sozluk.durumBirlestir) window.Sozluk.durumBirlestir(v.sozluk);
      profil = {
        ad: (v && typeof v.ad === 'string') ? v.ad : (uye.displayName || '').slice(0, 40),
        meslek: (v && typeof v.meslek === 'string') ? v.meslek : '',
        olusturma: (v && v.olusturma) || zaman(),
        engelli: (v && v.engelli && typeof v.engelli === 'object') ? v.engelli : {},   // forum: engellenen üyeler { uid: ad }
        onay: (v && typeof v.onay === 'number') ? v.onay : (bekleyenOnay || 0)   // kullanım koşullarını kabul zamanı (kayıtta ya da ilk Google girişinde)
      };
      if (bekleyenKayit) { profil.ad = bekleyenKayit.ad; profil.meslek = bekleyenKayit.meslek; bekleyenKayit = null; }
      bekleyenOnay = 0;
      profilHazir = true;
      profilHaber();
      kaydet(true);
      ciz();
    }, function () { mesaj($('hs-msg'), M('eslemeHata'), true); });
  }
  function veri() {
    var fav = yerelFav().slice(0, 200), sz = sozlukDurum(), szK = Object.keys(sz).slice(0, 2000), szT = {};
    szK.forEach(function (k) { var d = sz[k] || {}; szT[k] = { k: +d.k || 0, s: +d.s || 0, g: +d.g || 0 }; });
    var en = {}; Object.keys(profil.engelli || {}).slice(0, 200).forEach(function (k) { en[k] = String(profil.engelli[k] || '').slice(0, 40); });
    return { ad: (profil.ad || '').slice(0, 40), meslek: profil.meslek || '', favoriler: fav, sozluk: szT, engelli: en, onay: profil.onay || 0, olusturma: profil.olusturma, guncelleme: zaman() };
  }
  function kaydet(hemen) {
    if (!profilHazir || !belge()) return Promise.resolve();
    clearTimeout(yazZ);
    if (!hemen) { yazZ = setTimeout(function () { kaydet(true); }, 1500); return Promise.resolve(); }
    return belge().set(veri()).then(profilYaz).catch(function (e) { mesaj($('hs-msg'), M('eslemeHata'), true); throw e; });
  }
  // Herkese açık küçük profil (profiller/{uid}: ad, meslek): forum yazılarında ad buradan okunur; ad değişince eski yazılarda da yeni ad görünür.
  var sonProfil = null;
  function profilYaz() {
    if (!db || !uye || !profil) return;
    var v = { ad: (profil.ad || '').slice(0, 40), meslek: profil.meslek || '' }, s = JSON.stringify(v);
    if (s === sonProfil) return;
    return db.collection('profiller').doc(uye.uid).set(v).then(function () { sonProfil = s; try { window.dispatchEvent(new CustomEvent('odyo:profil-adi', { detail: { uid: uye.uid, ad: v.ad, meslek: v.meslek } })); } catch (e) {} });
  }
  window.addEventListener('odyo:favori', function () { kaydet(false); });
  window.addEventListener('odyo:sozluk-durum', function () { kaydet(false); });

  // Forum (forum.js) için: üye, profil, e-posta doğrulandı mı, engelleme
  function profilHaber() { try { window.dispatchEvent(new CustomEvent('odyo:profil', { detail: profil })); } catch (e) {} }
  // Giriş kimliği (ID token) yaklaşık 1 saat önbellekte kalır: e-posta girişten SONRA doğrulandıysa sunucu kuralları onu hâlâ
  // "doğrulanmamış" görür ve forum yazması reddedilir. Kullanıcı bilgisini yenile; doğrulanmışsa kimliği zorla yenile.
  function kimlikTazele() {
    var u = uye; if (!u || typeof u.reload !== 'function') return Promise.resolve();
    return u.reload().then(function () { return u.getIdTokenResult(); }).then(function (r) {
      if (u.emailVerified && !(r && r.claims && r.claims.email_verified)) return u.getIdToken(true);
    }).then(function () { ciz(); }, function () {});
  }
  function dogrulandi() { return !!uye && (!!uye.emailVerified || (uye.providerData || []).some(function (p) { return p && p.providerId === 'google.com'; })); }
  function engelliCiz() {
    var kutu = $('hs-engelli'), liste = $('hs-engelli-liste'); if (!kutu) return;
    var en = (profil && profil.engelli) || {}, k = Object.keys(en);
    kutu.hidden = !k.length; liste.replaceChildren();
    k.forEach(function (uid) {
      var satir = document.createElement('div'); satir.className = 'hs-engel-satir';
      var ad = document.createElement('span'); ad.textContent = en[uid] || M('adsiz');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'linkbtn'; b.textContent = M('engelKaldir');
      b.addEventListener('click', function () { engelKaldir(uid); });
      satir.appendChild(ad); satir.appendChild(b); liste.appendChild(satir);
    });
  }
  function engelle(uid, ad) { if (!profilHazir || !uid || (uye && uid === uye.uid)) return Promise.resolve(); profil.engelli[uid] = (ad || '').slice(0, 40); profilHaber(); ciz(); return kaydet(true); }
  function engelKaldir(uid) { if (!profilHazir) return Promise.resolve(); delete profil.engelli[uid]; profilHaber(); ciz(); return kaydet(true); }
  window.OdyoUye = {
    kim: function () { return uye; }, hazir: function () { return profilHazir; }, dogrulandi: dogrulandi, kayitAcik: function () { return kayitAcik; },
    profil: function () { return profil ? { ad: profil.ad, meslek: profil.meslek, engelli: Object.assign({}, profil.engelli) } : null; },
    engelle: engelle, engelKaldir: engelKaldir, kimlikTazele: kimlikTazele
  };

  /* ---------- ekran ---------- */
  function meslekDoldur(sec, deger) {
    sec.replaceChildren();
    MESLEK.forEach(function (m) { var o = document.createElement('option'); o.value = m[0]; o.textContent = M(m[1]); sec.appendChild(o); });
    sec.value = deger || '';
  }
  function ciz() {
    var acik = kayitAcik || yonetici;   // yönetici kapalıyken de deneyebilsin
    // Ayarlar
    $('ayar-giris').hidden = !!uye;
    $('ayar-yonetici-giris').hidden = kayitAcik;
    $('ayar-uye-giris').hidden = !kayitAcik;
    $('login-link').textContent = kayitAcik ? M('ayarGiris') : M('ayarYonetici');
    $('ayar-hesap').hidden = !uye;
    if (uye) {
      var ad = profil && profil.ad ? profil.ad : (uye.displayName || M('adsiz'));
      $('hs-kim').textContent = ad + ' · ' + (uye.email || '');
    }
    $('hs-git').textContent = M('hesapAyarlari'); $('hs-cikis').textContent = M('cikis'); $('hs-cikis2').textContent = M('cikis');
    // Giriş sayfası
    if (!kayitAcik && kip === 'kayit') kip = 'giris';
    $('g-kip').hidden = !kayitAcik;
    [].forEach.call($('g-kip').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-kip') === kip ? 'true' : 'false'); b.textContent = M(b.getAttribute('data-kip') === 'kayit' ? 'kayitBaslik' : 'girisBaslik'); });
    $('g-google-kutu').hidden = !acik;
    $('g-google').textContent = M('google'); $('g-ya-da').textContent = M('yaDa');
    $('g-baslik').textContent = !kayitAcik ? M('yoneticiBaslik') : kip === 'kayit' ? M('kayitBaslik') : M('girisBaslik');
    $('g-lead').textContent = !kayitAcik ? M('yoneticiLead') : kip === 'kayit' ? M('kayitLead') : M('girisLead');
    $('g-kayit-alan').hidden = kip !== 'kayit';
    $('g-onay-kutu').hidden = kip !== 'kayit' || !kayitAcik;
    $('g-google-not').hidden = kip === 'kayit' || !kayitAcik; $('g-google-not').textContent = M('googleGirisNot');
    $('l-pass').setAttribute('autocomplete', kip === 'kayit' ? 'new-password' : 'current-password');
    $('l-send').textContent = kip === 'kayit' ? M('kayitDugme') : M('girisDugme');
    $('g-unuttum').hidden = kip !== 'giris'; $('g-unuttum').textContent = M('unuttum');
    if (!$('g-meslek').options.length) meslekDoldur($('g-meslek'), '');
    // Hesabım
    if (uye) {
      $('hs-eposta').textContent = uye.email || '';
      var sifreli = (uye.providerData || []).some(function (p) { return p && p.providerId === 'password'; });
      $('hs-dogrula-kutu').hidden = !sifreli || !!uye.emailVerified;
      $('hs-dogrula-yazi').textContent = M('dogrulanmadi'); $('hs-dogrula').textContent = M('dogrulaGonder');
      $('hs-sifre').hidden = !sifreli; $('hs-sifre').textContent = M('sifreDugme');
      $('hs-kaydet').textContent = M('kaydet'); $('hs-sil').textContent = M('silDugme');
      if (document.activeElement !== $('hs-ad')) $('hs-ad').value = profil ? profil.ad : '';
      if (document.activeElement !== $('hs-meslek')) meslekDoldur($('hs-meslek'), profil ? profil.meslek : '');
      $('hs-form').hidden = !profilHazir;
      engelliCiz();
    }
    $('uye-kayit-acik').checked = kayitAcik;
  }
  // Giriş yapmamış biri #hesap'a gelirse giriş sayfasına
  window.addEventListener('hashchange', function () { if (location.hash === '#hesap' && auth && !uye) location.hash = '#giris'; });

  /* ---------- olaylar ---------- */
  var bekleyenKayit = null, bekleyenOnay = 0;
  [].forEach.call($('g-kip').querySelectorAll('button'), function (b) {
    b.addEventListener('click', function () { kip = b.getAttribute('data-kip'); mesaj($('l-msg'), ''); ciz(); });
  });
  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('l-msg'); mesaj(msg, '');
    if (!auth) { mesaj(msg, 'Giriş sistemine ulaşılamıyor. Bağlantını kontrol edip sayfayı yeniden aç.', true); return; }
    var ep = $('l-email').value.trim(), sf = $('l-pass').value;
    $('l-send').disabled = true;
    var is;
    if (kip === 'kayit') {
      if (!kayitAcik) { mesaj(msg, M('kayitKapali'), true); $('l-send').disabled = false; return; }
      if (sf.length < 8) { mesaj(msg, M('kisaSifre'), true); $('l-send').disabled = false; return; }
      if (!$('g-onay').checked) { mesaj(msg, M('onayGerekli'), true); $('l-send').disabled = false; return; }
      bekleyenOnay = zaman();
      bekleyenKayit = { ad: $('g-ad').value.trim().slice(0, 40), meslek: $('g-meslek').value };
      is = auth.createUserWithEmailAndPassword(ep, sf).then(function (r) {
        try { auth.languageCode = 'tr'; } catch (x) {}
        if (r && r.user) r.user.sendEmailVerification().catch(function () {});
        if (window.OdyoUI && window.OdyoUI.bildirim) window.OdyoUI.bildirim(M('hosgeldin'));
      });
    } else {
      is = auth.signInWithEmailAndPassword(ep, sf);
    }
    is.then(function () { $('l-pass').value = ''; }, function (err) { bekleyenKayit = null; mesaj(msg, hataYazi(err), true); })
      .then(function () { $('l-send').disabled = false; });
  });
  $('g-unuttum').addEventListener('click', function () {
    var ep = $('l-email').value.trim(), msg = $('l-msg');
    if (!ep) { mesaj(msg, M('epostaYaz'), true); $('l-email').focus(); return; }
    if (!auth) return;
    try { auth.languageCode = 'tr'; } catch (x) {}
    auth.sendPasswordResetEmail(ep).then(function () { mesaj(msg, M('sifreGitti')); }, function (err) {
      // Kayıtlı olmayan adresi ele vermemek için aynı yanıt
      if (/user-not-found/.test((err && err.code) || '')) mesaj(msg, M('sifreGitti')); else mesaj(msg, hataYazi(err), true);
    });
  });
  $('g-google').addEventListener('click', function () {
    var msg = $('l-msg');
    if (!auth || !window.firebase || !firebase.auth.GoogleAuthProvider) { mesaj(msg, 'Giriş sistemine ulaşılamıyor.', true); return; }
    if (!kayitAcik && !yonetici) { mesaj(msg, M('kayitKapali'), true); return; }
    if (kayitAcik && kip === 'kayit' && !$('g-onay').checked) { mesaj(msg, M('onayGerekli'), true); return; }
    bekleyenOnay = zaman();   // yeni hesapsa onay zamanı olarak kaydedilir (var olan hesapta değişmez)
    var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    try { auth.languageCode = 'tr'; } catch (x) {}
    mesaj(msg, M('googleIpucu'));
    // Açılır pencere: GitHub Pages'te yönlendirmeli giriş tarayıcıların üçüncü taraf depolama kısıtına takılıyor
    auth.signInWithPopup(p).then(function () { mesaj(msg, ''); }, function (err) { mesaj(msg, hataYazi(err), true); });
  });
  function cikis() { if (!auth) return; clearTimeout(yazZ); kaydet(true).catch(function () {}).then(function () { return auth.signOut(); }).then(function () { location.hash = '#ayarlar'; }); }
  $('hs-cikis').addEventListener('click', cikis);
  $('hs-cikis2').addEventListener('click', cikis);
  $('hs-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!profilHazir) return;
    profil.ad = $('hs-ad').value.trim().slice(0, 40); profil.meslek = $('hs-meslek').value;
    $('hs-kaydet').disabled = true;
    kaydet(true).then(function () { mesaj($('hs-msg'), M('kaydedildi')); ciz(); }, function () {}).then(function () { $('hs-kaydet').disabled = false; });
  });
  $('hs-dogrula').addEventListener('click', function () {
    if (!uye) return;
    try { auth.languageCode = 'tr'; } catch (x) {}
    uye.sendEmailVerification().then(function () { mesaj($('hs-msg'), M('dogrulaGitti')); }, function (err) { mesaj($('hs-msg'), hataYazi(err), true); });
  });
  $('hs-sifre').addEventListener('click', function () {
    if (!uye || !uye.email) return;
    try { auth.languageCode = 'tr'; } catch (x) {}
    auth.sendPasswordResetEmail(uye.email).then(function () { mesaj($('hs-msg'), M('sifreGitti')); }, function (err) { mesaj($('hs-msg'), hataYazi(err), true); });
  });
  $('hs-sil').addEventListener('click', function () {
    if (!uye || !window.confirm(M('silOnay'))) return;
    var msg = $('hs-sil-msg'), u = uye, b = belge();
    clearTimeout(yazZ); profilHazir = false;
    // Önce sunucudaki bilgiler (hesap silinince artık silinemez), sonra hesap
    (b ? b.delete() : Promise.resolve()).then(function () { return db.collection('profiller').doc(u.uid).delete().catch(function () {}); }).then(function () { return u.delete(); }).then(function () {
      mesaj(msg, M('silindi')); location.hash = '#ayarlar';
      if (window.OdyoUI && window.OdyoUI.bildirim) window.OdyoUI.bildirim(M('silindi'));
    }, function (err) { profilHazir = !!profil; mesaj(msg, hataYazi(err), true); });
  });
  $('uye-kayit-acik').addEventListener('change', function () {
    if (!db || !yonetici) return;
    var ac = $('uye-kayit-acik').checked;
    db.collection('ayar').doc('uyelik').set({ kayitAcik: ac, guncelleme: zaman() })
      .then(function () { mesaj($('uye-kayit-msg'), ac ? 'Yeni üye kaydı açıldı.' : 'Yeni üye kaydı kapatıldı.'); },
        function () { $('uye-kayit-acik').checked = kayitAcik; mesaj($('uye-kayit-msg'), 'Kaydedilemedi.', true); });
  });

  function dbBaglan(d) {
    if (db || !d) return;
    db = d;
    try { auth = window.firebase.auth(); } catch (x) { auth = null; }
    db.collection('ayar').doc('uyelik').onSnapshot(function (s) { kayitAcik = !!(s.exists && s.data() && s.data().kayitAcik === true); ciz(); try { window.dispatchEvent(new CustomEvent('odyo:uyelik', { detail: kayitAcik })); } catch (e) {} }, function () {});
    ciz();
  }
  window.addEventListener('odyo:db', function (e) { dbBaglan(e.detail); });
  function uyeDegisti(u) {
    if (uye && u && uye.uid === u.uid) { uye = u; ciz(); return; }
    uye = u; profil = null; profilHazir = false; clearTimeout(yazZ); sonProfil = null; profilHaber();
    if (uye) { profilYukle(); kimlikTazele(); } else bekleyenKayit = null;
    ciz();
  }
  window.addEventListener('odyo:uye', function (e) { uyeDegisti(e.detail || null); });
  window.addEventListener('odyo:yetki', function (e) { yonetici = !!e.detail; ciz(); });
  window.addEventListener('odyo:metinler', ciz);
  // app.js olayları bu dosya yüklenmeden önce gelmiş olabilir (bağlantı hızlıysa): mevcut durumu al
  var U0 = window.OdyoUI || {};
  yonetici = !!U0.yonetici;
  if (U0.db) dbBaglan(U0.db);
  if (U0.uye) uyeDegisti(U0.uye);
  ciz();
})();
