/* Topluluk (forum) — 4. adım, 2026-11-21. Sekme #topluluk.
   Adresler: #topluluk (liste), #topluluk/yeni, #topluluk/duzenle/<id>, #topluluk/g/<id> (gönderi ve cevaplar).
   - Okuma herkese açık; yazmak için giriş yapmış ve e-postası doğrulanmış üye (uye.js → window.OdyoUye).
   - Forum, üyelik anahtarı (ayar/uyelik kayitAcik) açılana kadar yalnızca yöneticiye görünür; herkese "Yakında".
   - Firestore: forum/{id} { kategori, baslik ≤120, metin ≤3000, yazarId, yazarAd ≤40, yazarMeslek, olusturma, guncelleme,
     cevapSayisi, sonCevap, gizli }, forum/{id}/cevaplar/{cid} { metin ≤2000, yazarId, yazarAd, yazarMeslek, olusturma,
     guncelleme, gizli }, sikayetler/{sid} { hedef, neden ≤300, sikayetEden, olusturma }. Kurallar firestore.rules.
   - Fotoğraf yok (proje sahibinin kararı: hasta bilgisi sızma riski). Yazar adı + meslek rozeti.
   - Yazar kendi gönderisini/cevabını düzenler ve siler; gönderi sahibi altındaki cevapları da silebilir.
     Şikâyet et → yöneticinin şikâyet listesine düşer. Engelle → o üyenin yazıları bu üyeye görünmez (uyeler/{uid}.engelli).
     Yönetici: gizle/göster, sil, şikâyet listesi.
   - Yazılar index.html #forum-metinler (yönetici düzenler; kategori adları dahil). */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function M(ad) { var el = document.querySelector('#forum-metinler [data-m="' + ad + '"]'); return el ? el.textContent.trim() : ad; }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function btn(cls, text, fn) { var b = h('button', cls, text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
  var KAT = ['vaka', 'cihaz', 'ders', 'kariyer'];
  function katAd(id) { return KAT.indexOf(id) >= 0 ? M('kat_' + id) : M('katDiger'); }
  function rozet(m) { return m === 'ogrenci' ? M('rozetOgrenci') : m === 'odyolog' ? M('rozetOdyolog') : ''; }
  function tarih(ms) {
    if (!ms) return '';
    try { return new Date(ms).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
  }

  var db = null, yonetici = false, acik = false;
  var liste = [], listeYuklendi = false, listeDin = null, suzgec = '';
  var gonderi = null, cevaplar = [], detayId = null, detayDin = [], sikayetler = [], sikayetDin = null;
  var kok = null;

  function U() { return window.OdyoUye || null; }
  function uye() { var u = U(); return u ? u.kim() : null; }
  function engelli() { var u = U(), p = u && u.profil(); return (p && p.engelli) || {}; }
  function gorunur(x) { return x && (!x.gizli || yonetici) && !engelli()[x.yazarId]; }
  function benim(x) { var u = uye(); return !!(u && x && x.yazarId === u.uid); }
  function yazabilir() { var u = U(); return !!(u && u.kim() && u.dogrulandi() && u.hazir() && (acik || yonetici)); }
  function bildirim(m, hata) { var O = window.OdyoUI; if (O && O.bildirim) O.bildirim(m, hata ? 'hata' : undefined); }

  /* ---------- veri ---------- */
  function listeDinle() {
    if (!db || listeDin) return;
    listeDin = db.collection('forum').orderBy('olusturma', 'desc').limit(50).onSnapshot(function (s) {
      liste = s.docs.map(function (d) { var v = d.data() || {}; v.id = d.id; return v; });
      listeYuklendi = true; if (gorunum().tur === 'liste') ciz();
    }, function () { listeYuklendi = true; if (gorunum().tur === 'liste') ciz(); });
  }
  function detayKapat() { detayDin.forEach(function (f) { try { f(); } catch (e) {} }); detayDin = []; detayId = null; gonderi = null; cevaplar = []; }
  function detayDinle(id) {
    if (!db || detayId === id) return;
    detayKapat(); detayId = id; gonderi = undefined;
    var ref = db.collection('forum').doc(id);
    detayDin.push(ref.onSnapshot(function (s) { gonderi = s.exists ? Object.assign({ id: id }, s.data()) : null; ciz(); }, function () { gonderi = null; ciz(); }));
    detayDin.push(ref.collection('cevaplar').orderBy('olusturma', 'asc').limit(300).onSnapshot(function (s) {
      cevaplar = s.docs.map(function (d) { var v = d.data() || {}; v.id = d.id; return v; }); ciz();
    }, function () {}));
  }
  function sikayetDinle() {
    if (!db || !yonetici || sikayetDin) return;
    sikayetDin = db.collection('sikayetler').orderBy('olusturma', 'desc').limit(100).onSnapshot(function (s) {
      sikayetler = s.docs.map(function (d) { var v = d.data() || {}; v.id = d.id; return v; }); if (gorunum().tur === 'liste') ciz();
    }, function () {});
  }
  function yazar() {
    var u = U(), p = u && u.profil();
    return { yazarId: uye().uid, yazarAd: ((p && p.ad) || M('adsiz')).slice(0, 40), yazarMeslek: (p && p.meslek) || '' };
  }

  /* ---------- görünüm seçimi ---------- */
  function gorunum() {
    var p = (location.hash || '').replace('#', '').split('/');
    if (p[0] !== 'topluluk') return { tur: 'yok' };
    if (p[1] === 'yeni') return { tur: 'form' };
    if (p[1] === 'duzenle' && p[2]) return { tur: 'form', id: decodeURIComponent(p[2]) };
    if (p[1] === 'g' && p[2]) return { tur: 'detay', id: decodeURIComponent(p[2]) };
    return { tur: 'liste' };
  }

  /* ---------- çizim ---------- */
  // Yazarın güncel adı ve mesleği profiller/{uid}'den (herkese açık); yoksa yazıya kaydedilmiş eski ad. Her yazar oturumda bir kez okunur.
  var PROFIL = {}, profilIstendi = {}, profilCizZ = null;
  function profilAl(uid) {
    if (!uid || !db || profilIstendi[uid]) return PROFIL[uid];
    profilIstendi[uid] = true;
    db.collection('profiller').doc(uid).get().then(function (s) {
      if (s.exists) { PROFIL[uid] = s.data() || {}; clearTimeout(profilCizZ); profilCizZ = setTimeout(ciz, 50); }
    }, function () {});
    return PROFIL[uid];
  }
  function yazarAdi(x) { var p = profilAl(x.yazarId); return (p && p.ad) || x.yazarAd || M('adsiz'); }
  window.addEventListener('odyo:profil-adi', function (e) { var v = e.detail; if (v && v.uid) { PROFIL[v.uid] = { ad: v.ad, meslek: v.meslek }; ciz(); } });
  function yazarSatir(x) {
    var s = h('div', 'fr-yazar');
    s.appendChild(h('span', 'fr-ad', yazarAdi(x)));
    var pr = PROFIL[x.yazarId], r = rozet(pr ? pr.meslek : x.yazarMeslek); if (r) s.appendChild(h('span', 'fr-rozet', r));
    s.appendChild(h('span', 'fr-tarih', tarih(x.olusturma) + (x.guncelleme && x.guncelleme > x.olusturma + 60000 ? ' · ' + M('duzenlendi') : '')));
    if (x.gizli) s.appendChild(h('span', 'fr-gizli-et', M('gizliEtiket')));
    return s;
  }
  function yazmaUyari() {
    var u = U(), k = h('div', 'fr-uyari');
    if (!u || !u.kim()) { k.appendChild(h('span', null, M('girisGerekli') + ' ')); var a = h('a', 'linkbtn', M('girisYap')); a.href = '#giris'; k.appendChild(a); }
    else if (!u.dogrulandi()) k.textContent = M('dogrulaGerekli');
    else if (!u.hazir()) k.textContent = M('yukleniyor');
    return k;
  }
  function cizListe() {
    var kap = h('div', 'stack');
    var ust = h('div', 'fr-ust');
    ust.appendChild(h('p', 'note fr-tanitim', M('tanitim')));
    if (yazabilir()) { var y = h('a', 'btn primary fr-yeni', M('yeniGonderi')); y.href = '#topluluk/yeni'; ust.appendChild(y); }
    else ust.appendChild(yazmaUyari());
    kap.appendChild(ust);
    // Kategori süzgeci
    var cip = h('div', 'fr-cipler'); cip.setAttribute('role', 'group'); cip.setAttribute('aria-label', M('kategori'));
    [''].concat(KAT).forEach(function (k) {
      var b = btn('fr-cip', k ? katAd(k) : M('tumu'), function () { suzgec = k; ciz(); });
      b.setAttribute('aria-pressed', suzgec === k ? 'true' : 'false'); cip.appendChild(b);
    });
    kap.appendChild(cip);
    // Yönetici: şikâyetler
    if (yonetici && sikayetler.length) kap.appendChild(cizSikayetler());
    var gor = liste.filter(function (x) { return gorunur(x) && (!suzgec || x.kategori === suzgec); });
    var engelSay = liste.filter(function (x) { return engelli()[x.yazarId] && (!suzgec || x.kategori === suzgec); }).length;
    if (!listeYuklendi) kap.appendChild(h('p', 'note', M('yukleniyor')));
    else if (!gor.length && !engelSay) kap.appendChild(h('p', 'note fr-bos', M('bos')));
    gor.forEach(function (x) {
      var a = h('a', 'fr-kart'); a.href = '#topluluk/g/' + encodeURIComponent(x.id);
      a.appendChild(h('span', 'fr-kat', katAd(x.kategori)));
      a.appendChild(h('b', 'fr-kart-baslik', x.baslik || ''));
      var on = (x.metin || '').replace(/\s+/g, ' ').slice(0, 140); a.appendChild(h('span', 'fr-ozet', on + ((x.metin || '').length > 140 ? '…' : '')));
      var alt = yazarSatir(x); alt.appendChild(h('span', 'fr-cevap-say', (x.cevapSayisi || 0) + ' ' + M('cevap'))); a.appendChild(alt);
      kap.appendChild(a);
    });
    if (engelSay) kap.appendChild(h('p', 'note', engelSay + ' ' + M('engelliGizlendi')));
    kap.appendChild(h('p', 'note fr-kural', M('kurallar')));
    return kap;
  }
  function cizSikayetler() {
    var d = h('details', 'compose fr-sikayetler'); d.open = true;
    d.appendChild(h('summary', null, M('sikayetlerBaslik') + ' (' + sikayetler.length + ')'));
    var ic = h('div', 'stack'); ic.style.gap = '6px';
    sikayetler.forEach(function (s) {
      var satir = h('div', 'fr-sikayet');
      var p = String(s.hedef || '').split('/'), gid = p[1];
      var a = h('a', 'linkbtn', M('sikayetGit')); a.href = '#topluluk/g/' + encodeURIComponent(gid || '');
      satir.appendChild(h('span', null, (p[2] === 'cevaplar' ? M('cevapOge') : M('gonderiOge')) + ': ' + (s.neden || '—') + ' · ' + tarih(s.olusturma)));
      satir.appendChild(a);
      satir.appendChild(btn('linkbtn', M('sikayetKapat'), function () { db.collection('sikayetler').doc(s.id).delete().catch(function () { bildirim(M('hata'), true); }); }));
      ic.appendChild(satir);
    });
    d.appendChild(ic); return d;
  }
  function islemler(x, tur) {
    // tur: 'gonderi' | 'cevap'
    var bar = h('div', 'fr-islem');
    if (!uye()) return bar;
    if (benim(x)) {
      if (tur === 'gonderi') { var e = h('a', 'linkbtn', M('duzenle')); e.href = '#topluluk/duzenle/' + encodeURIComponent(x.id); bar.appendChild(e); }
      else bar.appendChild(btn('linkbtn', M('duzenle'), function () { cevapDuzenle(x); }));
    }
    if (benim(x) || yonetici || (tur === 'cevap' && gonderi && benim(gonderi))) bar.appendChild(btn('linkbtn danger', M('sil'), function () { tur === 'gonderi' ? gonderiSil(x) : cevapSil(x); }));
    if (!benim(x)) {
      bar.appendChild(btn('linkbtn', M('sikayetEt'), function () { sikayetEt(x, tur); }));
      bar.appendChild(btn('linkbtn', M('engelle'), function () {
        if (!window.confirm(M('engelOnay').replace('{ad}', yazarAdi(x)))) return;
        U().engelle(x.yazarId, yazarAdi(x)).then(function () { bildirim(M('engellendi')); if (tur === 'gonderi') location.hash = '#topluluk'; else ciz(); });
      }));
    }
    if (yonetici) bar.appendChild(btn('linkbtn', x.gizli ? M('goster') : M('gizle'), function () { gizliYap(x, tur, !x.gizli); }));
    return bar;
  }
  function cizDetay(id) {
    var kap = h('div', 'stack');
    if (gonderi === undefined) { kap.appendChild(h('p', 'note', M('yukleniyor'))); return kap; }
    if (!gonderi || !gorunur(gonderi)) { kap.appendChild(h('p', 'note', M('bulunamadi'))); return kap; }
    var g = gonderi, kart = h('article', 'fr-gonderi');
    kart.appendChild(h('span', 'fr-kat', katAd(g.kategori)));
    kart.appendChild(h('h3', 'fr-gonderi-baslik', g.baslik || ''));
    kart.appendChild(yazarSatir(g));
    kart.appendChild(h('div', 'fr-metin', g.metin || ''));
    kart.appendChild(islemler(g, 'gonderi'));
    kap.appendChild(kart);
    var gc = cevaplar.filter(gorunur), eng = cevaplar.filter(function (c) { return engelli()[c.yazarId]; }).length;
    kap.appendChild(h('h3', 'fr-cevaplar-baslik', gc.length + ' ' + M('cevap')));
    gc.forEach(function (c) {
      var k = h('div', 'fr-cevap'); k.id = 'fr-c-' + c.id;
      k.appendChild(yazarSatir(c));
      k.appendChild(h('div', 'fr-metin', c.metin || ''));
      k.appendChild(islemler(c, 'cevap'));
      kap.appendChild(k);
    });
    if (eng) kap.appendChild(h('p', 'note', eng + ' ' + M('engelliGizlendi')));
    // Cevap formu
    if (yazabilir()) {
      var f = h('form', 'f fr-form'); f.style.padding = '0';
      var fld = h('div', 'fld'), lb = h('label', null, M('cevapYaz')); lb.htmlFor = 'fr-cevap-metin';
      var ta = h('textarea'); ta.id = 'fr-cevap-metin'; ta.maxLength = 2000; ta.rows = 4; ta.required = true;
      fld.appendChild(lb); fld.appendChild(ta); f.appendChild(fld);
      f.appendChild(h('p', 'note fr-hasta-uyari', M('hastaUyari')));
      var bar = h('div', 'admin-bar'), gb = h('button', 'btn primary', M('gonder')); gb.type = 'submit'; bar.appendChild(gb); f.appendChild(bar);
      f.addEventListener('submit', function (e) { e.preventDefault(); cevapGonder(g, ta.value, gb); });
      kap.appendChild(f);
    } else kap.appendChild(yazmaUyari());
    return kap;
  }
  function cizForm(id) {
    var kap = h('div', 'stack');
    if (!yazabilir()) { kap.appendChild(yazmaUyari()); return kap; }
    var eski = null;
    if (id) {
      eski = liste.filter(function (x) { return x.id === id; })[0] || (gonderi && gonderi.id === id ? gonderi : null);
      if (!eski || !benim(eski)) { kap.appendChild(h('p', 'note', M('bulunamadi'))); return kap; }
    }
    var f = h('form', 'f fr-form'); f.style.padding = '0';
    function alan(etiket, el) { var d = h('div', 'fld'), l = h('label', null, etiket); l.htmlFor = el.id; d.appendChild(l); d.appendChild(el); f.appendChild(d); }
    var sec = h('select'); sec.id = 'fr-kat'; sec.required = true;
    var bos = h('option', null, M('kategoriSec')); bos.value = ''; sec.appendChild(bos);
    KAT.forEach(function (k) { var o = h('option', null, katAd(k)); o.value = k; sec.appendChild(o); });
    sec.value = eski ? eski.kategori : (suzgec || '');
    alan(M('kategori'), sec);
    var bas = h('input'); bas.id = 'fr-bas'; bas.type = 'text'; bas.maxLength = 120; bas.required = true; bas.value = eski ? eski.baslik : '';
    alan(M('baslik'), bas);
    var ta = h('textarea'); ta.id = 'fr-metin'; ta.maxLength = 3000; ta.rows = 8; ta.required = true; ta.value = eski ? eski.metin : '';
    alan(M('metin'), ta);
    f.appendChild(h('p', 'note fr-hasta-uyari', M('hastaUyari')));
    var bar = h('div', 'admin-bar'), gb = h('button', 'btn primary', eski ? M('kaydet') : M('gonder')); gb.type = 'submit'; bar.appendChild(gb);
    var vz = h('a', 'btn', M('vazgec')); vz.href = eski ? '#topluluk/g/' + encodeURIComponent(eski.id) : '#topluluk'; bar.appendChild(vz);
    f.appendChild(bar);
    var msg = h('div', 'msg'); msg.setAttribute('role', 'status'); f.appendChild(msg);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var b = bas.value.trim(), m = ta.value.trim(), k = sec.value;
      if (!k || b.length < 3 || !m) { msg.textContent = M('eksik'); msg.className = 'msg err'; return; }
      gb.disabled = true;
      var simdi = Date.now(), is;
      if (eski) is = db.collection('forum').doc(eski.id).update({ kategori: k, baslik: b, metin: m, guncelleme: simdi }).then(function () { return eski.id; });
      else {
        var ref = db.collection('forum').doc();
        is = ref.set(Object.assign({ kategori: k, baslik: b, metin: m, olusturma: simdi, guncelleme: simdi, cevapSayisi: 0, sonCevap: 0, gizli: false }, yazar())).then(function () { return ref.id; });
      }
      is.then(function (yid) { bildirim(eski ? M('kaydedildi') : M('gonderildi')); location.hash = '#topluluk/g/' + encodeURIComponent(yid); },
        function () { gb.disabled = false; msg.textContent = M('hata'); msg.className = 'msg err'; });
    });
    kap.appendChild(f);
    return kap;
  }

  function ciz() {
    kok = kok || $('forum');
    if (!kok) return;
    var g = gorunum();
    if (g.tur === 'yok') return;
    var goster = acik || yonetici;
    $('topluluk-yakinda').hidden = goster; kok.hidden = !goster;
    $('fr-ust-bas').hidden = goster && g.tur !== 'liste';
    $('fr-alt-bas').hidden = !(goster && g.tur !== 'liste');
    if (!goster) return;
    if (g.tur !== 'detay' && detayId) detayKapat();
    var icerik;
    if (g.tur === 'liste') icerik = cizListe();
    else if (g.tur === 'detay') { detayDinle(g.id); icerik = cizDetay(g.id); }
    else icerik = cizForm(g.id);
    $('fr-alt-baslik').textContent = g.tur === 'detay' ? M('gonderiBaslik') : g.tur === 'form' ? (g.id ? M('duzenleBaslik') : M('yeniBaslik')) : '';
    $('fr-geri').setAttribute('href', g.tur === 'form' && g.id ? '#topluluk/g/' + encodeURIComponent(g.id) : '#topluluk');
    // Yazılmakta olan bir metin varken (cevap formu) yeniden çizimde kaybolmasın
    var ta = kok.querySelector('#fr-cevap-metin'), yazi = ta ? ta.value : '', odak = ta && document.activeElement === ta;
    if (g.tur === 'form' && kok.querySelector('#fr-metin')) return;   // form açıkken arka plandaki değişiklikler formu silmesin
    kok.replaceChildren(icerik);
    var ta2 = kok.querySelector('#fr-cevap-metin'); if (ta2 && yazi) { ta2.value = yazi; if (odak) ta2.focus(); }
  }

  /* ---------- işlemler ---------- */
  function cevapGonder(g, metin, gb) {
    metin = (metin || '').trim(); if (!metin) return;
    gb.disabled = true;
    var ref = db.collection('forum').doc(g.id), cref = ref.collection('cevaplar').doc(), simdi = Date.now(), b = db.batch();
    b.set(cref, Object.assign({ metin: metin, olusturma: simdi, guncelleme: simdi, gizli: false }, yazar()));
    b.update(ref, { cevapSayisi: (g.cevapSayisi || 0) + 1, sonCevap: simdi });
    b.commit().then(function () { var ta = $('fr-cevap-metin'); if (ta) ta.value = ''; bildirim(M('gonderildi')); }, function () { bildirim(M('hata'), true); })
      .then(function () { gb.disabled = false; });
  }
  function cevapDuzenle(c) {
    var yeni = window.prompt(M('cevapDuzenle'), c.metin || '');
    if (yeni == null) return; yeni = yeni.trim(); if (!yeni || yeni === c.metin) return;
    db.collection('forum').doc(gonderi.id).collection('cevaplar').doc(c.id).update({ metin: yeni.slice(0, 2000), guncelleme: Date.now() })
      .then(function () { bildirim(M('kaydedildi')); }, function () { bildirim(M('hata'), true); });
  }
  function cevapSil(c) {
    if (!window.confirm(M('silOnayCevap'))) return;
    var ref = db.collection('forum').doc(gonderi.id), b = db.batch();
    b.delete(ref.collection('cevaplar').doc(c.id));
    b.update(ref, { cevapSayisi: Math.max(0, (gonderi.cevapSayisi || 0) - 1), sonCevap: gonderi.sonCevap || 0 });
    b.commit().then(function () { bildirim(M('silindi')); }, function () { bildirim(M('hata'), true); });
  }
  function gonderiSil(g) {
    if (!window.confirm(M('silOnayGonderi'))) return;
    var ref = db.collection('forum').doc(g.id);
    // Önce cevaplar (gönderi sahibi ve yönetici altındaki cevapları silebilir), sonra gönderi
    ref.collection('cevaplar').get().then(function (s) {
      var b = db.batch(); s.docs.slice(0, 450).forEach(function (d) { b.delete(ref.collection('cevaplar').doc(d.id)); }); b.delete(ref); return b.commit();
    }).then(function () { bildirim(M('silindi')); location.hash = '#topluluk'; }, function () { bildirim(M('hata'), true); });
  }
  function gizliYap(x, tur, gizli) {
    var ref = tur === 'gonderi' ? db.collection('forum').doc(x.id) : db.collection('forum').doc(gonderi.id).collection('cevaplar').doc(x.id);
    ref.update({ gizli: gizli }).then(function () { bildirim(gizli ? M('gizlendi') : M('gosterildi')); }, function () { bildirim(M('hata'), true); });
  }
  function sikayetEt(x, tur) {
    var neden = window.prompt(M('sikayetNeden'), '');
    if (neden == null) return;
    var hedef = tur === 'gonderi' ? 'forum/' + x.id : 'forum/' + gonderi.id + '/cevaplar/' + x.id;
    db.collection('sikayetler').doc().set({ hedef: hedef, neden: neden.trim().slice(0, 300), sikayetEden: uye().uid, olusturma: Date.now() })
      .then(function () { bildirim(M('sikayetAlindi')); }, function () { bildirim(M('hata'), true); });
  }

  /* ---------- olaylar ---------- */
  function dbBaglan(d) { if (db || !d) return; db = d; listeDinle(); sikayetDinle(); ciz(); }
  window.addEventListener('odyo:db', function (e) { dbBaglan(e.detail); });
  window.addEventListener('odyo:yetki', function (e) {
    yonetici = !!e.detail;
    if (!yonetici && sikayetDin) { try { sikayetDin(); } catch (x) {} sikayetDin = null; sikayetler = []; }
    sikayetDinle(); ciz();
  });
  window.addEventListener('odyo:uyelik', function (e) { acik = !!e.detail; ciz(); });
  window.addEventListener('odyo:profil', function () { ciz(); });
  window.addEventListener('odyo:uye', function () { setTimeout(ciz, 0); });
  window.addEventListener('odyo:metinler', ciz);
  window.addEventListener('hashchange', function () { if (gorunum().tur !== 'yok') { kok && kok.querySelector('#fr-metin') && kok.replaceChildren(); ciz(); } else if (detayId) detayKapat(); });
  var O = window.OdyoUI || {};
  yonetici = !!O.yonetici;
  if (window.OdyoUye) acik = window.OdyoUye.kayitAcik();
  if (O.db) dbBaglan(O.db);
  ciz();
})();
