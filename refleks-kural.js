/* Akustik refleks örüntüsü yorumu (OdyoBOT asistanı). Ekranla ilgisi yoktur; aynı girdi her zaman aynı sonucu verir (CLAUDE.md §7).
   Tarayıcıda window.RefleksKural, Node'da require('./refleks-kural.js'). Test: node testler/refleks-test.js

   Kaynak: Jerger ve Jerger (1977) örüntüleri — Clark JL, "Acoustic (stapedius) reflexes", Open Access Guide to Audiology and
   Hearing Aids for Otolaryngologists, Tablo 1 (dikey, çapraz, ters L, yatay, tek kutu); proje sahibinin ders slaytı
   "3.dersaksutik refleksler.pptx" (slayt 22–28: eşik 80 dB üstünde refleks alınmayabilir; prob kulağında iletim patolojisinde
   refleks gözlenmez; iki taraflı iletim patolojisinde hepsi yok; işitsel nöropatide refleks beklenmez). Proje sahibi
   internetten doğrulanıp eklenmesini istedi (2026-11-17).

   Kulak adı UYARANIN verildiği kulaktır (Vakalarım'daki gibi): "sag-kontra" = uyaran sağda, prob solda.
   Tanı koymaz: tek bir bölgedeki bozukluğun beklenen refleks örüntüsü, ölçülen örüntüyle karşılaştırılır; eşleşen bölgeler
   "olası bölge" olarak verilir. Yalnızca "yok" girilen refleks yok sayılır; yükselmiş eşik "var" kabul edilir (norm yok). */
(function (kok) {
  'use strict';
  var Hesap = (typeof module !== 'undefined' && module.exports) ? require('./odyo-hesap.js') : kok.OdyoHesap;

  var YOLLAR = ['sag-ipsi', 'sag-kontra', 'sol-ipsi', 'sol-kontra'];
  var FREKANSLAR = [500, 1000, 2000, 4000];
  // Afferent açıklama için uyaran kulağının hava yolu eşiği (ders slaytı 22): 80 dB üstünde refleks alınmayabilir,
  // 50 dB'den sonra eşik arttıkça refleks eşiği de artar.
  var ESIK_ILERI = 80, ESIK_ORTA = 50;

  // Tek bir bölgedeki bozukluğun silmesi beklenen refleksler. X: etkilenen taraf, Y: karşı taraf.
  // dugumler: şemada vurgulanacak yerler. Sıra ekrandaki sıradır.
  var ADAYLAR = [
    { id: 'ortaHafif', oruntu: 'dikey', yok: ['X-ipsi', 'Y-kontra'], dugumler: ['X.orta'], ortaKulak: true },
    { id: 'n7', oruntu: 'dikey', yok: ['X-ipsi', 'Y-kontra'], dugumler: ['X.n7'] },
    { id: 'afferent', oruntu: 'capraz', yok: ['X-ipsi', 'X-kontra'], dugumler: ['X.koklea', 'X.n8', 'X.kn'], afferent: true },
    { id: 'ortaBelirgin', oruntu: 'tersL', yok: ['X-ipsi', 'X-kontra', 'Y-kontra'], dugumler: ['X.orta'], ortaKulak: true },
    { id: 'beyinSapiYan', oruntu: 'tersL', yok: ['X-ipsi', 'X-kontra', 'Y-kontra'], dugumler: ['X.soc'], beyinSapi: true },
    { id: 'ortaHat', oruntu: 'yatay', yok: ['sag-kontra', 'sol-kontra'], dugumler: ['ortaHat'], beyinSapi: true, tekTaraf: false },
    { id: 'gecis', oruntu: 'tekKutu', yok: ['X-kontra'], dugumler: ['X.gecis'], beyinSapi: true }
  ];
  var KARSI = { sag: 'sol', sol: 'sag' };
  function coz(ad, X) { return ad.replace(/^X/, X).replace(/^Y/, KARSI[X]); }

  // Bir yolun durumu: 'var' (en az bir frekansta eşik), 'yok' (girilen frekansların hepsi "yok"), null (girilmemiş).
  // kismi: "var" sayılan yolda "yok" girilen frekanslar.
  function yolDurumu(refleks, yol) {
    var p = yol.split('-'), d = refleks && refleks[p[0]] && refleks[p[0]][p[1]];
    var fl = FREKANSLAR.filter(function (f) { return d && d[String(f)] != null; });
    if (!fl.length) return { durum: null, yokFrekans: [] };
    var yokF = fl.filter(function (f) { return d[String(f)] === 'yok'; });
    return { durum: yokF.length === fl.length ? 'yok' : 'var', yokFrekans: yokF };
  }

  function ayni(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) !== -1; }); }

  // Uyaran kulağı X'in, X'ten verilen reflekslerin yok olduğu frekanslardaki en kötü hava yolu eşiği.
  function afferentEsik(v, X, durumlar) {
    var fl = [];
    ['ipsi', 'kontra'].forEach(function (t) { durumlar[X + '-' + t].yokFrekans.forEach(function (f) { if (fl.indexOf(f) === -1) fl.push(f); }); });
    var hava = v.esik && v.esik[X] && v.esik[X].hava, enKotu = null;
    fl.forEach(function (f) { var e = hava && hava[String(f)]; if (e && (enKotu == null || e.db > enKotu)) enKotu = e.db; });
    return enKotu;
  }

  // Vaka verisiyle çapraz kontrol: [{ kod, taraf, degerler }] (metinleri OdyoBOT index.html'den alır).
  function destekNotlari(v, a) {
    var X = a.taraf, n = [];
    if (a.ortaKulak) {
      var tp = Hesap && Hesap.timpanTipi && v.timpan ? Hesap.timpanTipi(v.timpan[X]) : { kod: null };
      if (tp.kod === 'A') n.push({ kod: 'timpNormal', taraf: X });
      else if (tp.kod) n.push({ kod: 'timpDestek', taraf: X, tip: tp.kod });
      else n.push({ kod: 'timpYok', taraf: X });
      var t = Hesap && v.esik ? Hesap.degerlendir(v.esik[X], 3).tip : null;
      if (t && (t.kod === 'iletim' || t.kod === 'mikst') && t.abg != null) n.push({ kod: 'abg', taraf: X, abg: Math.round(t.abg * 10) / 10 });
    }
    if (a.afferent) {
      var db = afferentEsik(v, X, a._durumlar);
      if (db == null) n.push({ kod: 'esikYok', taraf: X });
      else if (db >= ESIK_ILERI) n.push({ kod: 'esikIleri', taraf: X, db: db });
      else if (db >= ESIK_ORTA) n.push({ kod: 'esikOrta', taraf: X, db: db });
      else n.push({ kod: 'esikIyi', taraf: X, db: db });
    }
    if (a.id === 'n7') n.push({ kod: 'n7', taraf: X });
    if (a.beyinSapi) n.push({ kod: 'beyinSapi', taraf: X });
    return n;
  }

  // Vakanın refleks örüntüsü.
  // Dönüş: { kod: 'veriYok' | 'eksik' | 'hepsiVar' | 'hepsiYok' | 'tanimsiz' | 'eslesti',
  //          durumlar: { 'sag-ipsi': {durum, yokFrekans}, ... }, yok: [yollar], eksik: [yollar],
  //          kismi: [{ yol, frekanslar }], oruntu, adaylar: [{ id, taraf, dugumler, notlar }], timpan: { sag, sol } }
  function degerlendir(v) {
    var r = v && v.refleks;
    var durumlar = {};
    YOLLAR.forEach(function (y) { durumlar[y] = yolDurumu(r, y); });
    var sonuc = { durumlar: durumlar, yok: [], eksik: [], kismi: [], adaylar: [], oruntu: null };
    if (!r) { sonuc.kod = 'veriYok'; return sonuc; }
    YOLLAR.forEach(function (y) {
      var d = durumlar[y];
      if (d.durum === null) sonuc.eksik.push(y);
      else if (d.durum === 'yok') sonuc.yok.push(y);
      else if (d.yokFrekans.length) sonuc.kismi.push({ yol: y, frekanslar: d.yokFrekans });
    });
    if (sonuc.eksik.length) { sonuc.kod = 'eksik'; return sonuc; }
    if (!sonuc.yok.length) { sonuc.kod = 'hepsiVar'; return sonuc; }
    if (sonuc.yok.length === YOLLAR.length) {
      sonuc.kod = 'hepsiYok';
      sonuc.notlar = ['sag', 'sol'].map(function (X) {
        var tp = Hesap && Hesap.timpanTipi && v.timpan ? Hesap.timpanTipi(v.timpan[X]) : { kod: null };
        return tp.kod ? { kod: tp.kod === 'A' ? 'timpNormal' : 'timpDestek', taraf: X, tip: tp.kod } : { kod: 'timpYok', taraf: X };
      });
      return sonuc;
    }
    ADAYLAR.forEach(function (a) {
      var taraflar = a.tekTaraf === false ? [null] : ['sag', 'sol'];
      taraflar.forEach(function (X) {
        var beklenen = a.yok.map(function (y) { return X ? coz(y, X) : y; });
        if (!ayni(beklenen, sonuc.yok)) return;
        var aday = { id: a.id, taraf: X, oruntu: a.oruntu, dugumler: a.dugumler.map(function (d) { return X ? coz(d, X) : d; }),
          ortaKulak: !!a.ortaKulak, afferent: !!a.afferent, beyinSapi: !!a.beyinSapi, _durumlar: durumlar };
        aday.notlar = destekNotlari(v, aday);
        delete aday._durumlar;
        sonuc.adaylar.push(aday);
      });
    });
    if (!sonuc.adaylar.length) { sonuc.kod = 'tanimsiz'; return sonuc; }
    sonuc.kod = 'eslesti';
    sonuc.oruntu = sonuc.adaylar[0].oruntu;
    sonuc.taraf = sonuc.adaylar[0].taraf;
    return sonuc;
  }

  var api = { YOLLAR: YOLLAR, FREKANSLAR: FREKANSLAR, ADAYLAR: ADAYLAR, ESIK_ILERI: ESIK_ILERI, ESIK_ORTA: ESIK_ORTA, yolDurumu: yolDurumu, degerlendir: degerlendir };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else kok.RefleksKural = api;
})(this);
