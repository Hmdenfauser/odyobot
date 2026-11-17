/* Akustik refleks örüntüsü yorumu (OdyoBOT asistanı). Ekranla ilgisi yoktur; aynı girdi her zaman aynı sonucu verir (CLAUDE.md §7).
   Tarayıcıda window.RefleksKural, Node'da require('./refleks-kural.js'). Test: node testler/refleks-test.js

   Kaynak: Jerger ve Jerger (1977) örüntüleri — Clark JL, "Acoustic (stapedius) reflexes", Open Access Guide to Audiology and
   Hearing Aids for Otolaryngologists, Tablo 1 (dikey, çapraz, ters L, yatay, tek kutu); proje sahibinin ders slaytı
   "3.dersaksutik refleksler.pptx" (slayt 21: ipsilateral ölçüm artefakta daha yatkın; 22: eşik 80 dB üstünde refleks
   alınmayabilir; 24: işitsel nöropatide refleks beklenmez; 26–28: prob kulağında iletim patolojisinde refleks gözlenmez,
   iki taraflı iletim patolojisinde hepsi yok). Proje sahibi internetten doğrulanıp eklenmesini istedi (2026-11-17).

   Kulak adı UYARANIN verildiği kulaktır (Vakalarım'daki gibi): "sag-kontra" = uyaran sağda, prob solda.
   Proje sahibinin kararı (2026-11-17): değer girilmemiş yol "yok" sayılır.
   Yöntem: her tanımlı bölge bozukluğunun beklenen örüntüsü ölçülen örüntüyle karşılaştırılır.
     1) Tek bölge birebir uyuyorsa: o bölge(ler).
     2) Uymuyorsa: iki tanımlı örüntünün birleşimi (her ikisi de gerekli) olarak açıklanır.
     3) Yalnız ipsilateral yokluğu tanımlı bir örüntü değildir; yer göstermez (artefakt olasılığı) — yalnızca bu kalırsa öyle söylenir.
   Tanı koymaz. Yükselmiş eşik "var" kabul edilir (norm yok). */
(function (kok) {
  'use strict';
  var Hesap = (typeof module !== 'undefined' && module.exports) ? require('./odyo-hesap.js') : kok.OdyoHesap;

  var YOLLAR = ['sag-ipsi', 'sag-kontra', 'sol-ipsi', 'sol-kontra'];
  var FREKANSLAR = [500, 1000, 2000, 4000];
  // Afferent açıklama için uyaran kulağının hava yolu eşiği (ders slaytı 22): 80 dB üstünde refleks alınmayabilir,
  // 50 dB'den sonra eşik arttıkça refleks eşiği de artar.
  var ESIK_ILERI = 80, ESIK_ORTA = 50;

  // Tek bir bölgedeki bozukluğun silmesi beklenen refleksler. X: etkilenen taraf, Y: karşı taraf.
  // dugumler: şemada vurgulanacak yerler. Sıra ekrandaki sıradır. ipsiTek: tanımlı örüntü değil (yalnız birleşimde ya da tek başına "yer göstermez").
  var ADAYLAR = [
    { id: 'ortaHafif', oruntu: 'dikey', yok: ['X-ipsi', 'Y-kontra'], dugumler: ['X.orta'], ortaKulak: true },
    { id: 'n7', oruntu: 'dikey', yok: ['X-ipsi', 'Y-kontra'], dugumler: ['X.n7'] },
    { id: 'afferent', oruntu: 'capraz', yok: ['X-ipsi', 'X-kontra'], dugumler: ['X.koklea', 'X.n8', 'X.kn'], afferent: true },
    { id: 'ortaBelirgin', oruntu: 'tersL', yok: ['X-ipsi', 'X-kontra', 'Y-kontra'], dugumler: ['X.orta'], ortaKulak: true },
    { id: 'beyinSapiYan', oruntu: 'tersL', yok: ['X-ipsi', 'X-kontra', 'Y-kontra'], dugumler: ['X.soc'], beyinSapi: true },
    { id: 'ortaHat', oruntu: 'yatay', yok: ['sag-kontra', 'sol-kontra'], dugumler: ['ortaHat'], beyinSapi: true, tekTaraf: false },
    { id: 'gecis', oruntu: 'tekKutu', yok: ['X-kontra'], dugumler: ['X.gecis'], beyinSapi: true },
    { id: 'ipsiTek', oruntu: 'ipsiTek', yok: ['X-ipsi'], dugumler: [], ipsiTek: true }
  ];
  var KARSI = { sag: 'sol', sol: 'sag' };
  function coz(ad, X) { return ad.replace(/^X/, X).replace(/^Y/, KARSI[X]); }

  // Bir yolun durumu: 'var' (en az bir frekansta eşik) ya da 'yok'. Değer girilmemiş yol da 'yok' (girilmedi: true).
  // yokFrekans: "yok" girilen frekanslar.
  function yolDurumu(refleks, yol) {
    var p = yol.split('-'), d = refleks && refleks[p[0]] && refleks[p[0]][p[1]];
    var fl = FREKANSLAR.filter(function (f) { return d && d[String(f)] != null; });
    if (!fl.length) return { durum: 'yok', girilmedi: true, yokFrekans: [] };
    var yokF = fl.filter(function (f) { return d[String(f)] === 'yok'; });
    return { durum: yokF.length === fl.length ? 'yok' : 'var', girilmedi: false, yokFrekans: yokF };
  }

  function ayni(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) !== -1; }); }
  function altKume(a, b) { return a.every(function (x) { return b.indexOf(x) !== -1; }); }

  // Bütün somut adaylar (taraf çözülmüş): [{ id, taraf, oruntu, yok: [yollar], dugumler, ... }]
  function somutAdaylar() {
    var l = [];
    ADAYLAR.forEach(function (a) {
      (a.tekTaraf === false ? [null] : ['sag', 'sol']).forEach(function (X) {
        l.push({ id: a.id, taraf: X, oruntu: a.oruntu, yok: a.yok.map(function (y) { return X ? coz(y, X) : y; }),
          dugumler: a.dugumler.map(function (d) { return X ? coz(d, X) : d; }),
          ortaKulak: !!a.ortaKulak, afferent: !!a.afferent, beyinSapi: !!a.beyinSapi, ipsiTek: !!a.ipsiTek });
      });
    });
    return l;
  }

  // Uyaran kulağı X'te reflekslerin yok olduğu frekanslardaki en kötü hava yolu eşiği (girilmemiş yolda bütün frekanslar).
  function afferentEsik(v, X, durumlar) {
    var fl = [];
    ['ipsi', 'kontra'].forEach(function (t) {
      var d = durumlar[X + '-' + t], l = d.girilmedi ? FREKANSLAR : d.yokFrekans;
      l.forEach(function (f) { if (fl.indexOf(f) === -1) fl.push(f); });
    });
    var hava = v.esik && v.esik[X] && v.esik[X].hava, enKotu = null;
    fl.forEach(function (f) { var e = hava && hava[String(f)]; if (e && (enKotu == null || e.db > enKotu)) enKotu = e.db; });
    return enKotu;
  }
  function timpanNotu(v, X) {
    var tp = Hesap && Hesap.timpanTipi && v.timpan ? Hesap.timpanTipi(v.timpan[X]) : { kod: null };
    if (tp.kod === 'A') return { kod: 'timpNormal', taraf: X };
    if (tp.kod) return { kod: 'timpDestek', taraf: X, tip: tp.kod };
    return { kod: 'timpYok', taraf: X };
  }

  // Vaka verisiyle çapraz kontrol: [{ kod, taraf, ... }] (metinleri OdyoBOT index.html'den alır).
  function destekNotlari(v, a, durumlar) {
    var X = a.taraf, n = [];
    if (a.ortaKulak) {
      n.push(timpanNotu(v, X));
      var t = Hesap && v.esik ? Hesap.degerlendir(v.esik[X], 3).tip : null;
      if (t && (t.kod === 'iletim' || t.kod === 'mikst') && t.abg != null) n.push({ kod: 'abg', taraf: X, abg: Math.round(t.abg * 10) / 10 });
    }
    if (a.afferent) {
      var db = afferentEsik(v, X, durumlar);
      if (db == null) n.push({ kod: 'esikYok', taraf: X });
      else if (db >= ESIK_ILERI) n.push({ kod: 'esikIleri', taraf: X, db: db });
      else if (db >= ESIK_ORTA) n.push({ kod: 'esikOrta', taraf: X, db: db });
      else n.push({ kod: 'esikIyi', taraf: X, db: db });
    }
    if (a.id === 'n7') n.push({ kod: 'n7', taraf: X });
    if (a.beyinSapi) n.push({ kod: 'beyinSapi', taraf: X });
    if (a.ipsiTek) n.push({ kod: 'ipsiTek', taraf: X });
    return n;
  }
  function hazirla(v, a, durumlar) {
    var o = {}; for (var k in a) o[k] = a[k];
    o.notlar = destekNotlari(v, a, durumlar);
    return o;
  }

  // Vakanın refleks örüntüsü.
  // Dönüş: { kod: 'veriYok' | 'hepsiVar' | 'eslesti' | 'birlesim' | 'ipsiTek' | 'hepsiYok',
  //          durumlar, yok: [yollar], girilmedi: [yollar], kismi: [{ yol, frekanslar }],
  //          adaylar: [aday] (eslesti / ipsiTek), birlesimler: [[aday, aday]] (birlesim / hepsiYok), oruntu, taraf }
  function degerlendir(v) {
    var r = v && v.refleks;
    var durumlar = {};
    YOLLAR.forEach(function (y) { durumlar[y] = yolDurumu(r, y); });
    var sonuc = { durumlar: durumlar, yok: [], girilmedi: [], kismi: [], adaylar: [], birlesimler: [], oruntu: null, taraf: null };
    if (!r || !YOLLAR.some(function (y) { return !durumlar[y].girilmedi; })) { sonuc.kod = 'veriYok'; return sonuc; }
    YOLLAR.forEach(function (y) {
      var d = durumlar[y];
      if (d.durum === 'yok') sonuc.yok.push(y);
      if (d.girilmedi) sonuc.girilmedi.push(y);
      if (d.durum === 'var' && d.yokFrekans.length) sonuc.kismi.push({ yol: y, frekanslar: d.yokFrekans });
    });
    if (!sonuc.yok.length) { sonuc.kod = 'hepsiVar'; return sonuc; }
    var hepsi = somutAdaylar();
    var tanimli = hepsi.filter(function (a) { return !a.ipsiTek; });

    if (sonuc.yok.length === YOLLAR.length) {
      // Hepsi yok: tek bölgeyle açıklanmaz; iki taraflı aynı bölge birleşimleri gösterilir.
      sonuc.kod = 'hepsiYok';
      ['ortaHafif', 'n7', 'afferent'].forEach(function (id) {
        var s = hepsi.filter(function (a) { return a.id === id; });
        sonuc.birlesimler.push(s.map(function (a) { return hazirla(v, a, durumlar); }));
      });
      sonuc.notlar = [timpanNotu(v, 'sag'), timpanNotu(v, 'sol')];
      return sonuc;
    }
    // 1) Tek bölge
    tanimli.forEach(function (a) { if (ayni(a.yok, sonuc.yok)) sonuc.adaylar.push(hazirla(v, a, durumlar)); });
    if (sonuc.adaylar.length) { sonuc.kod = 'eslesti'; sonuc.oruntu = sonuc.adaylar[0].oruntu; sonuc.taraf = sonuc.adaylar[0].taraf; return sonuc; }
    // 2) İki örüntünün birleşimi (her biri gerekli: biri diğerinin alt kümesi değil, birleşim tam olarak ölçülen örüntü)
    function ciftler(havuz) {
      var l = [];
      for (var i = 0; i < havuz.length; i++) for (var j = i + 1; j < havuz.length; j++) {
        var a = havuz[i], b = havuz[j];
        if (altKume(a.yok, b.yok) || altKume(b.yok, a.yok)) continue;
        var bir = a.yok.concat(b.yok.filter(function (y) { return a.yok.indexOf(y) === -1; }));
        if (ayni(bir, sonuc.yok)) l.push([hazirla(v, a, durumlar), hazirla(v, b, durumlar)]);
      }
      return l;
    }
    sonuc.birlesimler = ciftler(tanimli);
    if (sonuc.birlesimler.length) { sonuc.kod = 'birlesim'; return sonuc; }
    // 3) Yalnız ipsilateral yokluğu (tek ya da iki taraflı): tanımlı örüntü değil
    var ipsiler = hepsi.filter(function (a) { return a.ipsiTek && sonuc.yok.indexOf(a.yok[0]) !== -1; });
    if (ipsiler.length && ipsiler.length === sonuc.yok.length) {
      sonuc.kod = 'ipsiTek';
      sonuc.adaylar = ipsiler.map(function (a) { return hazirla(v, a, durumlar); });
      return sonuc;
    }
    // (Dört yolun 16 birleşiminin hepsi yukarıdakilerden birine girer; bu satıra ulaşılmaz.)
    sonuc.birlesimler = ciftler(hepsi);
    sonuc.kod = 'birlesim';
    return sonuc;
  }

  var api = { YOLLAR: YOLLAR, FREKANSLAR: FREKANSLAR, ADAYLAR: ADAYLAR, ESIK_ILERI: ESIK_ILERI, ESIK_ORTA: ESIK_ORTA, yolDurumu: yolDurumu, degerlendir: degerlendir };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else kok.RefleksKural = api;
})(this);
