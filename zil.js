/* Uygulama içi bildirim (zil), 4. adım, 2026-11-21. Telefona bildirim göndermez (proje sahibinin kararı: şimdilik ücretsiz,
   sunucusuz yol). Ana sayfanın sağ üstünde, Ayarlar'ın solunda 🔔 düğmesi; sayı = son bakıştan sonra gelenler:
   - yeni duyurular (etkinlik, iş ilanı, haber; Firestore duyurular, en yeni 10),
   - giriş yapmış üyede: forumdaki kendi gönderilerine başkasının yazdığı yeni cevaplar (forum, yazarId = üye; sonCevap, sonCevapYazar).
   Son bakış zamanı yalnızca bu cihazda (localStorage odybot:zilSon); ilk açılışta eski kayıtlar sayılmaz.
   Zile dokununca liste açılır ve hepsi görülmüş sayılır. Yazılar index.html #zil-metinler (yönetici düzenler). */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function M(ad) { var el = document.querySelector('#zil-metinler [data-m="' + ad + '"]'); return el ? el.textContent.trim() : ad; }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var ANAHTAR = 'odybot:zilSon';
  var son = (function () { var v = 0; try { v = +localStorage.getItem(ANAHTAR) || 0; if (!v) { v = Date.now(); localStorage.setItem(ANAHTAR, String(v)); } } catch (e) { v = Date.now(); } return v; })();
  var db = null, duyurular = [], gonderiler = [], uye = null, forumDin = null, acik = false;

  function yeniDuyurular() { return duyurular.filter(function (d) { return d.olusturma > son; }); }
  function yeniCevaplar() {
    if (!uye) return [];
    return gonderiler.filter(function (g) { return g.yazarId === uye.uid && (g.sonCevap || 0) > son && g.sonCevapYazar && g.sonCevapYazar !== uye.uid && !g.gizli; });
  }
  function ogeler() {
    var l = [];
    yeniDuyurular().forEach(function (d) {
      var bas = d.baslik || (d.metin || '').replace(/\s+/g, ' ').slice(0, 80);
      l.push({ zaman: d.olusturma, tur: M('turDuyuru'), metin: bas, git: '#duyuru/' + encodeURIComponent(d.id) });
    });
    yeniCevaplar().forEach(function (g) {
      l.push({ zaman: g.sonCevap, tur: M('turCevap'), metin: g.baslik || '', git: '#topluluk/g/' + encodeURIComponent(g.id) });
    });
    return l.sort(function (a, b) { return b.zaman - a.zaman; });
  }
  function tarih(ms) { try { return new Date(ms).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }

  function ciz() {
    var b = $('zil'), say = $('zil-sayi'), panel = $('zil-panel'); if (!b) return;
    var l = ogeler();
    say.textContent = l.length > 9 ? '9+' : String(l.length); say.hidden = !l.length;
    b.setAttribute('aria-label', l.length ? M('etiketVar').replace('{n}', l.length) : M('etiket'));
    b.setAttribute('aria-expanded', acik ? 'true' : 'false');
    panel.hidden = !acik;
    if (!acik) return;
    panel.replaceChildren(h('p', 'zil-baslik', M('baslik')));
    if (!panelOgeleri.length) panel.appendChild(h('p', 'note zil-bos', M('bos')));
    panelOgeleri.forEach(function (o) {
      var a = h('a', 'zil-oge'); a.href = o.git;
      a.appendChild(h('span', 'zil-tur', o.tur + ' · ' + tarih(o.zaman)));
      a.appendChild(h('span', 'zil-metin', o.metin));
      a.addEventListener('click', kapat);
      panel.appendChild(a);
    });
  }
  var panelOgeleri = [];
  function ac() {
    panelOgeleri = ogeler(); acik = true;
    son = Date.now(); try { localStorage.setItem(ANAHTAR, String(son)); } catch (e) {}   // açınca hepsi görülmüş sayılır
    ciz();
  }
  function kapat() { if (!acik) return; acik = false; ciz(); }

  function duyuruDinle() {
    db.collection('duyurular').orderBy('olusturma', 'desc').limit(10).onSnapshot(function (s) {
      duyurular = s.docs.map(function (d) { var v = d.data() || {}; return { id: d.id, baslik: typeof v.baslik === 'string' ? v.baslik : '', metin: typeof v.metin === 'string' ? v.metin : '', olusturma: typeof v.olusturma === 'number' ? v.olusturma : 0 }; });
      ciz();
    }, function () {});
  }
  function forumDinle() {
    if (forumDin) { try { forumDin(); } catch (e) {} forumDin = null; }
    gonderiler = [];
    if (!db || !uye) { ciz(); return; }
    var kim = uye.uid;
    forumDin = db.collection('forum').where('yazarId', '==', kim).limit(50).onSnapshot(function (s) {
      gonderiler = s.docs.map(function (d) { var v = d.data() || {}; v.id = d.id; return v; }).filter(function (g) { return g.yazarId === kim; });
      ciz();
    }, function () {});
  }

  $('zil').addEventListener('click', function (e) { e.stopPropagation(); if (acik) kapat(); else ac(); });
  document.addEventListener('click', function (e) { if (acik && !e.target.closest('#zil-panel')) kapat(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') kapat(); });
  window.addEventListener('hashchange', kapat);
  function dbBaglan(d) { if (db || !d) return; db = d; duyuruDinle(); forumDinle(); }
  window.addEventListener('odyo:db', function (e) { dbBaglan(e.detail); });
  window.addEventListener('odyo:uye', function (e) { var u = e.detail || null; if ((u && u.uid) === (uye && uye.uid)) return; uye = u; forumDinle(); });
  window.addEventListener('odyo:metinler', ciz);
  var O = window.OdyoUI || {};
  uye = O.uye || null;
  if (O.db) dbBaglan(O.db);
  ciz();
})();
