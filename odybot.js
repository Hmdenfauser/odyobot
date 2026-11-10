/* OdyoBOT: düğmeli sohbet ekranı (maskeleme asistanı).
   Kural tabanlıdır: yapay zekâ yok, serbest metin yorumlanmaz; aynı seçimler her zaman aynı sonucu verir (CLAUDE.md §7).
   Eşikler Vakalarım'dan gelir (window.OdyoVaka); vaka verisi cihazdan çıkmaz.
   Mesaj metinleri index.html'deki #b-metinler içinde durur; yönetici uygulamadan düzenler.
   Maskeleme kuralları maskeleme-kural.js içinde (Katz, 7. baskı, Bölüm 6; proje sahibiyle doğrulandı). */
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
        sonucGoster(v);
      }
      sonrakiSecenekler(v);
    });
  }

  /* ---------- maskeleme sonuçları (kurallar maskeleme-kural.js'te) ---------- */
  var MK = window.MaskelemeKural;
  var YOL_BASLIK = { hava: 'Saf ses, hava yolu', kemik: 'Saf ses, kemik yolu' };
  function kulakAd(k) { return V.KULAK_AD[k]; }
  function esikYazi(s) { return s.esik + (s.nr ? ' (NR)' : ''); }
  function duzeyYazi(s) {
    var p = [];
    if (s.baslangic != null) p.push('Başlangıç ' + s.baslangic + ' dB EM');
    if (s.enCok != null) p.push('en çok ' + s.enCok.db + ' dB EM' + (s.enCok.tahmini ? '†' : ''));
    return p.join(' · ');
  }
  function uyariYazi(s) {
    return s.uyarilar.map(function (u) { return m(u); }).filter(Boolean);
  }
  // Bir yol (hava/kemik) için kulak kulak özet: gerekenler satır satır, gerekmeyenler ve karar verilemeyenler tek satırda.
  function yolBalonu(sonuclar, yol) {
    var parca = [h('p', { 'class': 'b-vaka-baslik', text: YOL_BASLIK[yol] })], isaretler = {};
    V.KULAKLAR.forEach(function (k) {
      var l = sonuclar.filter(function (s) { return s.kulak === k; });
      if (!l.length) return;
      var gerek = l.filter(function (s) { return s.gerekli === true; });
      var gerekmez = l.filter(function (s) { return s.gerekli === false; });
      var belirsiz = l.filter(function (s) { return s.gerekli == null; });
      parca.push(h('div', { 'class': 'og-baslik ' + k, text: kulakAd(k) + ' kulak' }));
      var ul = h('ul', { 'class': 'b-liste' });
      gerek.forEach(function (s) {
        var neden;
        if (yol === 'hava') {
          neden = esikYazi(s) + ' − ' + s.karsi.db + ' (karşı kulak ' + (s.karsi.tur === 'kemik' ? 'kemik' : 'hava') + ') = ' + s.fark + ' ≥ ' + s.kaa;
          if (s.onKarar) { neden += ' *'; isaretler.onKarar = true; }
        } else {
          neden = 'ABG ' + s.havaEsik + ' − ' + s.kemikRef + ' = ' + s.abg + ' ≥ ' + MK.KEMIK_ABG_ESIGI;
          if (s.te) neden += ' · TE ' + s.te + ' dB eklendi';
          if (s.teAtlandi) neden += ' · TE eklenmedi (karşı kulakta ABG ≥ ' + MK.TE_ABG_SINIRI + ')';
        }
        if (s.enCok && s.enCok.tahmini) isaretler.tahmini = true;
        var li = h('li', null, [
          h('strong', { text: s.f + ' Hz: maskeleme gerekli' + (s.maskeli ? ' (kayıt maskeli' + (s.maskDb != null ? ', ' + s.maskDb + ' dB EM' : '') + ')' : '') }),
          h('div', { 'class': 'meta', text: neden }),
          duzeyYazi(s) ? h('div', { text: duzeyYazi(s) }) : null
        ]);
        uyariYazi(s).forEach(function (u) { li.appendChild(h('div', { 'class': 'b-uyari', text: u })); });
        ul.appendChild(li);
      });
      if (gerekmez.length) ul.appendChild(h('li', { 'class': 'meta', text: 'Gerekmiyor: ' + gerekmez.map(function (s) { return s.f; }).join(', ') + ' Hz' }));
      if (belirsiz.length) ul.appendChild(h('li', { 'class': 'meta', text: 'Karar verilemedi (' + (yol === 'hava' ? 'karşı kulakta eşik yok' : 'bu kulakta hava eşiği yok') + '): ' + belirsiz.map(function (s) { return s.f; }).join(', ') + ' Hz' }));
      parca.push(ul);
    });
    if (isaretler.onKarar) parca.push(h('p', { 'class': 'note', text: m('onKarar') }));
    if (isaretler.tahmini) parca.push(h('p', { 'class': 'note', text: '† ' + m('tahmini') }));
    return parca;
  }
  function konusmaBalonu(l) {
    var parca = [h('p', { 'class': 'b-vaka-baslik', text: 'Konuşma odyometrisi' })];
    l.forEach(function (s) {
      parca.push(h('div', { 'class': 'og-baslik ' + s.kulak, text: kulakAd(s.kulak) + ' kulak' }));
      var ul = h('ul', { 'class': 'b-liste' });
      if (s.srt) {
        var r = s.srt, t;
        if (r.gerekli == null) t = 'KAE: karar verilemedi (karşı kulakta kemik eşiği ya da KAE yok).';
        else t = 'KAE: ' + r.duzey + ' − ' + r.karsi.db + ' (karşı kulak ' + (r.karsi.tur === 'kemik' ? 'en iyi kemik' : 'KAE') + ') = ' + r.fark +
          (r.gerekli ? ' ≥ ' : ' < ') + s.kaa + ' → maskeleme ' + (r.gerekli ? 'gerekli' : 'gerekmiyor') + (r.onKarar ? ' *' : '') + '.' +
          (r.gerekli && r.baslangic != null ? ' Plato yöntemiyle başlangıç ' + r.baslangic + ' dB EM.' : '');
        ul.appendChild(h('li', { text: t }));
      }
      if (s.sds) {
        var u = s.sds, li;
        if (u.gerekli == null) li = h('li', { text: 'Eşik üstü (sunum ' + u.duzey + ' dB HL): karar verilemedi (karşı kulakta kemik eşiği yok).' });
        else {
          li = h('li', null, [h('div', { text: 'Eşik üstü: sunum ' + u.duzey + ' − ' + u.karsi.db + ' (karşı kulak en iyi kemik) = ' + u.fark +
            (u.gerekli ? ' ≥ ' : ' < ') + s.kaa + ' → maskeleme ' + (u.gerekli ? 'gerekli' : 'gerekmiyor') + '.' })]);
          if (u.gerekli) {
            li.appendChild(h('div', { text: 'En az ' + (u.enAz != null ? u.enAz : '?') + ' · en çok ' + (u.enCok != null ? u.enCok : '?') +
              ' · orta (önerilen) ' + (u.orta != null ? u.orta : '?') + ' dB EM' }));
            var kosul = [];
            if (!u.sadeKosul.abgYok) kosul.push('kulaklardan birinde ABG ≥ 15 dB olabilir');
            if (!u.sadeKosul.slUygun) kosul.push(u.sadeKosul.sl == null ? 'KAE girilmemiş, SL bilinmiyor' : 'SL ' + u.sadeKosul.sl + ' dB (30–40 dışında)');
            li.appendChild(h('div', { 'class': 'meta', text: 'Sadeleştirilmiş yol (sunum − 20): ' + u.sade + ' dB EM' +
              (u.sadeUygun ? ' (ön koşullar sağlanıyor)' : ' (uygun değil: ' + kosul.join('; ') + ')') }));
          }
        }
        uyariYazi(s).forEach(function (x) { li.appendChild(h('div', { 'class': 'b-uyari', text: x })); });
        ul.appendChild(li);
      }
      parca.push(ul);
    });
    if (l.some(function (s) { return s.srt && s.srt.onKarar; })) parca.push(h('p', { 'class': 'note', text: m('onKarar') }));
    return parca;
  }
  var sonDegerlendirme = null;
  function sonucGoster(v) {
    sonDegerlendirme = MK.degerlendir(v, durum.kulaklik);
    var d = sonDegerlendirme;
    bot([h('p', { text: m('sonucGiris', { kulaklik: MK.KULAKLIKLAR[durum.kulaklik].ad }) }), h('p', { 'class': 'note', text: 'Kaynak: ' + MK.KAYNAK })]);
    if (d.hava.length) bot(yolBalonu(d.hava, 'hava'));
    if (d.kemik.length) bot(yolBalonu(d.kemik, 'kemik'));
    if (d.konusma.length) bot(konusmaBalonu(d.konusma));
    if (!d.hava.length && !d.kemik.length && !d.konusma.length) bot('Bu vakada eşik girilmemiş.');
    else bot([h('p', { text: m('santral') }), h('p', { 'class': 'note', text: m('taniYok') })]);
  }

  /* ---------- plato (Hood) rehberi ---------- */
  function platoAdaylari() {
    if (!sonDegerlendirme) return [];
    return sonDegerlendirme.hava.concat(sonDegerlendirme.kemik).filter(function (s) { return s.gerekli && s.baslangic != null; });
  }
  function platoSec(v) {
    bot('Hangi ölçüm için plato rehberini başlatalım?');
    secenek(platoAdaylari().map(function (s) {
      return { metin: kulakAd(s.kulak) + ' ' + (s.yol === 'hava' ? 'hava' : 'kemik') + ' ' + s.f + ' Hz', fn: function () { platoBaslat(v, s); } };
    }).concat([{ metin: 'Vazgeç', yazma: true, fn: function () { sonrakiSecenekler(v); } }]));
  }
  function platoBaslat(v, s) {
    bot(m('platoGiris'));
    platoAdim(v, s, MK.platoBasla(s.esik, s.baslangic, s.enCok ? s.enCok.db : null));
  }
  function platoAdim(v, s, d) {
    if (d.bitti) {
      if (d.sonuc.tur === 'plato') bot(m('platoBulundu', { esik: d.sonuc.esik, maske: d.sonuc.maske }));
      else bot(m('platoCevapYok', { ton: d.sonuc.ton }));
      sonrakiSecenekler(v);
      return;
    }
    if (d.asiriUyari && !d.asiriYazildi) { bot(m('platoAsiri', { enCok: d.enCok })); d.asiriYazildi = true; }
    bot(m('platoSoru', { ton: d.ton, maske: d.maske }));
    function ilerle(duydu) { var n = MK.platoCevap(d, duydu); n.asiriYazildi = d.asiriYazildi; platoAdim(v, s, n); }
    secenek([
      { metin: 'Duydu', ana: true, fn: function () { ilerle(true); } },
      { metin: 'Duymadı', fn: function () { ilerle(false); } },
      { metin: 'Rehberi bırak', yazma: true, fn: function () { sonrakiSecenekler(v); } }
    ]);
  }

  function sonrakiSecenekler(v) {
    var n = durum.kuyruk.length;
    var l = [];
    if (v && platoAdaylari().length) l.push({ metin: 'Plato rehberini başlat', fn: function () { platoSec(v); } });
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
