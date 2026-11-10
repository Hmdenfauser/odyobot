/* OdyoBOT: düğmeli sohbet ekranı (maskeleme asistanı).
   Kural tabanlıdır: yapay zekâ yok, serbest metin yorumlanmaz; aynı seçimler her zaman aynı sonucu verir (CLAUDE.md §7).
   Eşikler Vakalarım'dan gelir (window.OdyoVaka); vaka verisi cihazdan çıkmaz.
   Mesaj metinleri index.html'deki #b-metinler içinde durur; yönetici uygulamadan düzenler.
   Maskeleme kuralları (maskeleme-kural.js) proje sahibi taslak tabloyu Katz'tan doğruladıktan sonra eklenecek. */
(function () {
  'use strict';
  var U = window.OdyoUI, V = window.OdyoVaka;
  if (!U || !V || !document.getElementById('b-sohbet')) return;
  var h = U.h, $ = U.$;

  var KULAKLIKLAR = [
    { id: 'supra', ad: 'Kulak üstü (supra-aural)' },
    { id: 'insert', ad: 'Insert (kulak içi)' }
  ];

  /* ---------- mesaj metinleri ---------- */
  function m(ad, degerler) {
    var el = document.querySelector('#b-metinler [data-m="' + ad + '"]');
    var t = el ? el.textContent.trim() : '';
    return t.replace(/\{(\w+)\}/g, function (x, k) { return degerler && degerler[k] != null ? String(degerler[k]) : x; });
  }

  /* ---------- sohbet balonları ve seçenek düğmeleri ---------- */
  function asagi() { setTimeout(function () { try { window.scrollTo(0, document.body.scrollHeight); } catch (e) {} }, 30); }
  function bot(icerik) {
    var kids = typeof icerik === 'string' ? [h('p', { text: icerik })] : icerik;
    $('b-sohbet').appendChild(h('div', { 'class': 'balon bot' }, kids));
    asagi();
  }
  function ben(metin) { $('b-sohbet').appendChild(h('div', { 'class': 'balon ben' }, [h('p', { text: metin })])); }
  function temizle() { $('b-sohbet').replaceChildren(); $('b-secenek').replaceChildren(); }
  // secenekler: [{ metin, fn, ana (vurgulu), yazma (kullanıcı balonu yazılmasın) }]
  function secenek(liste) {
    var kap = $('b-secenek');
    kap.replaceChildren.apply(kap, liste.map(function (x) {
      var b = h('button', { 'class': 'btn' + (x.ana ? ' primary' : ''), type: 'button', text: x.metin });
      if (x.kapali) b.disabled = true;
      b.addEventListener('click', function () {
        if (!x.yazma) ben(x.metin);
        kap.replaceChildren();
        x.fn();
      });
      return b;
    }));
    asagi();
  }

  /* ---------- akış ---------- */
  var durum = { kuyruk: [], i: 0, kulaklik: null };

  function basla() {
    temizle();
    bot(m('merhaba'));
    V.hepsi().then(function (l) {
      if (!l.length) {
        bot(m('vakaYok'));
        secenek([{ metin: 'Vakalarım\'a git', ana: true, yazma: true, fn: function () { location.hash = '#vakalarim'; basla(); } }]);
        return;
      }
      secenek([{ metin: 'Vakalarım\'dan vaka seç', ana: true, fn: secimEkrani }]);
    }, function () { bot(m('vakaYok')); });
  }

  // Sohbet içinde vaka seçimi: her vaka bir aç/kapa düğmesi.
  function secimEkrani() {
    V.hepsi().then(function (l) {
      bot(m('secim'));
      var secilen = [];
      var kap = $('b-secenek');
      var baslat = h('button', { 'class': 'btn primary', type: 'button', text: 'Seçilenlerle başla', disabled: '' });
      function guncelle() {
        baslat.disabled = !secilen.length;
        baslat.textContent = 'Seçilenlerle başla' + (secilen.length ? ' (' + secilen.length + ')' : '');
      }
      var dugmeler = l.map(function (v) {
        var b = h('button', { 'class': 'btn b-vaka', type: 'button', 'aria-pressed': 'false' }, [
          h('span', { 'class': 'b-vaka-kutu', 'aria-hidden': 'true' }),
          h('span', { 'class': 'b-vaka-ad', text: v.kimlik }),
          h('span', { 'class': 'tag', text: U.fmtDate(v.tarih) || 'tarihsiz' })
        ]);
        b.addEventListener('click', function () {
          var i = secilen.indexOf(v.id);
          if (i === -1) secilen.push(v.id); else secilen.splice(i, 1);
          b.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
          guncelle();
        });
        return b;
      });
      baslat.addEventListener('click', function () {
        var adlar = l.filter(function (v) { return secilen.indexOf(v.id) !== -1; }).map(function (v) { return v.kimlik; });
        ben(adlar.join(', '));
        kap.replaceChildren();
        // Liste sırası korunur (en yeni vaka önce).
        vakalarGeldi(l.filter(function (v) { return secilen.indexOf(v.id) !== -1; }).map(function (v) { return v.id; }), true);
      });
      kap.replaceChildren.apply(kap, dugmeler.concat([baslat]));
      asagi();
    });
  }

  function vakalarGeldi(idler, sohbetiKoru) {
    if (!sohbetiKoru) temizle();
    durum = { kuyruk: idler.slice(), i: 0, kulaklik: null };
    bot(m('geldi', { n: idler.length }));
    bot(m('kulaklik'));
    secenek(KULAKLIKLAR.map(function (k) {
      return { metin: k.ad, fn: function () { durum.kulaklik = k.id; vakaGoster(); } };
    }));
  }

  function vakaGoster() {
    var n = durum.kuyruk.length, id = durum.kuyruk[durum.i];
    V.hepsi().then(function (l) {
      var v = null;
      l.forEach(function (x) { if (x.id === id) v = x; });
      if (!v) bot(m('bulunamadi'));
      else {
        bot([
          h('p', { 'class': 'b-vaka-baslik', text: m('vaka', { i: durum.i + 1, n: n, vaka: v.kimlik }) }),
          h('div', { 'class': 'meta', text: U.fmtDate(v.tarih) || 'Tarih yok' }),
          V.kucukGrafik(v),
          h('div', { 'class': 'meta', text: V.ozetMetni(v) })
        ]);
        bot(m('kuralBekliyor'));
      }
      sonrakiSecenekler();
    });
  }

  function sonrakiSecenekler() {
    var n = durum.kuyruk.length;
    var l = [];
    if (durum.i + 1 < n) l.push({ metin: 'Sonraki vaka (' + (durum.i + 2) + '/' + n + ')', ana: true, fn: function () { durum.i++; vakaGoster(); } });
    else l.push({ metin: 'Bitir', ana: true, fn: function () {
      bot(m('bitti'));
      secenek([
        { metin: 'Başka vaka seç', ana: true, fn: secimEkrani },
        { metin: 'Baştan başla', yazma: true, fn: basla }
      ]);
    } });
    l.push({ metin: 'Baştan başla', yazma: true, fn: basla });
    secenek(l);
  }

  /* ---------- Vakalarım'dan gönderilen vakalar ---------- */
  function gonderileniAl() {
    var ham = null;
    try { ham = sessionStorage.getItem(V.GONDERILEN_ANAHTAR); sessionStorage.removeItem(V.GONDERILEN_ANAHTAR); } catch (e) {}
    try { var l = JSON.parse(ham); return Array.isArray(l) ? l.filter(function (x) { return typeof x === 'string'; }) : []; } catch (e) { return []; }
  }
  window.addEventListener('odyobot:vakalar', function (e) {
    gonderileniAl();   // aynı gönderim ikinci kez işlenmesin
    var l = (e.detail || []).filter(function (x) { return typeof x === 'string'; });
    if (l.length) vakalarGeldi(l, false);
  });

  var ilk = gonderileniAl();   // sayfa yenilendiyse bekleyen gönderim
  if (ilk.length) vakalarGeldi(ilk, false); else basla();
})();
