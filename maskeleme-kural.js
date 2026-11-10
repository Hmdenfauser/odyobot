/* OdyoBOT maskeleme kuralları. Ekrandan bağımsızdır; tarayıcıda window.MaskelemeKural, Node'da require('./maskeleme-kural.js').
   Kaynak: Katz J. (baş ed.), Temel Klinik Odyoloji, 7. baskı (Türkçe, Pelikan 2022), Bölüm 6 "Klinik Maskeleme" (Yacullo), s. 77–111.
   Değerler proje sahibiyle kitaptan doğrulandı (2026-11-10, PROGRESS.md "Kural tablosu"). Değiştirmeden önce proje sahibine sor.
   Kural tabanlıdır: aynı girdi her zaman aynı sonucu verir. Tanı koymaz; yalnızca maskeleme gereksinimi, düzeyleri ve plato adımlarını hesaplar.

   Kısaltmalar: TK = test kulağı, KK = karşı (test edilmeyen) kulak, KAA = kulaklar arası azalma (interaural attenüasyon),
   TE = tıkanma (oklüzyon) etkisi, EM = etkili maskeleme, ABG = hava-kemik aralığı. */
(function (kok) {
  'use strict';

  /* ---------- sabitler (hepsi tek yerde) ---------- */
  var KULAKLIKLAR = {
    supra: {
      ad: 'Kulak üstü (supra-aural)',
      kaaHava: function () { return 40; },                       // s. 79
      kaaKonusma: 40,                                           // s. 82
      te: { 250: 30, 500: 20, 1000: 10 }                        // s. 94; diğer frekanslar 0
    },
    insert: {
      ad: 'Insert (3A, derin yerleştirilmiş)',
      kaaHava: function (f) { return f <= 1000 ? 75 : 50; },    // s. 80
      kaaKonusma: 60,                                           // s. 82
      te: { 250: 10, 500: 10 }                                  // s. 94; ≥1000 Hz 0
    }
  };
  var KAA_KEMIK = 0;                 // s. 82 (bilgi için; kemik yolu kararında KAA = 0 dB)
  var GUVENLIK_PAYI = 10;            // başlangıç maskeleme: KK hava eşiği + 10 dB (s. 93)
  var KEMIK_ABG_ESIGI = 15;          // TK'de ABG ≥ 15 dB ise kemik yolunda maskeleme (s. 84–85)
  var TE_ABG_SINIRI = 20;            // KK'de ABG ≥ 20 dB ise TE eklenmez (s. 94)
  var ASIRI_PAYI = 5;                // en çok = TK kemik + KAA − 5 dB (s. 94)
  var KONUSMA_FREK = [250, 500, 1000, 2000, 4000];   // konuşmada en iyi kemik / en büyük ABG aralığı (s. 86, 103)
  var SADE_FARK = 20;                // sadeleştirilmiş konuşma maskelemesi: sunum − 20 dB (s. 104)
  var SADE_SL = [30, 40];            // ön koşul: KAE'ye göre 30–40 dB SL (s. 105)
  var PLATO_ADIM = 5;                // maske ve ton adımı (s. 97–98)
  var PLATO_ARTIS = 3;               // art arda 3 maske artışında eşik değişmezse plato (15 dB) — proje sahibinin seçimi
  var CIHAZ_SINIRI = 120;            // plato rehberinde ton bu düzeyi aşarsa "cevap yok"
  var KAYNAK = 'Katz, Temel Klinik Odyoloji, 7. baskı, Bölüm 6 (Klinik Maskeleme)';

  var KULAKLAR = ['sag', 'sol'];
  function karsi(k) { return k === 'sag' ? 'sol' : 'sag'; }
  function frekanslar(v, k, y) {
    var o = v && v.esik && v.esik[k] && v.esik[k][y];
    return o ? Object.keys(o).map(Number).sort(function (a, b) { return a - b; }) : [];
  }
  function esik(v, k, y, f) {
    var o = v && v.esik && v.esik[k] && v.esik[k][y];
    var e = o ? o[String(f)] : null;
    return e && typeof e.db === 'number' ? e : null;
  }

  /* Görünürdeki kemik eşiği (k kulağı için, f frekansında):
     - k kulağında MASKELİ kemik eşiği varsa o (kulağa özgüdür).
     - Yoksa iki kulağın MASKESİZ kemik eşiklerinin en iyisi: maskesiz kemik yanıtı hangi kulaktan geldiği bilinmediği için
       her iki kulak için de "görünürdeki" eşik sayılır (s. 83). */
  function kemikGorunur(v, k, f) {
    var m = esik(v, k, 'kemik', f);
    if (m && m.maskeli) return { db: m.db, maskeli: true, nr: !!m.nr };
    var en = null;
    KULAKLAR.forEach(function (x) {
      var e = esik(v, x, 'kemik', f);
      if (e && !e.maskeli && (!en || e.db < en.db)) en = e;
    });
    return en ? { db: en.db, maskeli: false, nr: !!en.nr } : null;
  }
  // KK'nin olası hava-kemik aralığı (f'de). Hesaplanamazsa null.
  function abg(v, k, f) {
    var h = esik(v, k, 'hava', f), b = kemikGorunur(v, k, f);
    return h && b ? h.db - b.db : null;
  }

  // En çok (aşırı maskelemeden önceki) düzey: TK kemik eşiği + KAA(hava, maskeleyici kulaklık) − 5 dB (s. 94–95).
  // TK'nin gerçek kemik eşiği bilinmiyorsa görünürdeki (maskesiz) eşik kullanılır; bu tedbirli (düşük) bir değer verir.
  function enCokDuzey(v, k, f, kul) {
    var b = kemikGorunur(v, k, f);
    if (!b) return null;
    return { db: b.db + kul.kaaHava(f) - ASIRI_PAYI, kemik: b.db, tahmini: !b.maskeli };
  }

  function uyarilarEkle(s) {
    // En çok düzey maskesiz (görünürdeki) kemik eşiğiyle tahmin edildiyse gerçek sınır daha yüksek olabilir (s. 95);
    // bu durumda uyarı "olası" olarak verilir (…Tahmini mesajları).
    if (s.baslangic != null && s.enCok != null) {
      var ek = s.enCok.tahmini ? 'Tahmini' : '';
      if (s.baslangic > s.enCok.db) s.uyarilar.push('ikilem' + ek);           // başlangıç zaten aşırı maskeleme sınırının üstünde
      else if (s.enCok.db - s.baslangic < PLATO_ADIM * PLATO_ARTIS) s.uyarilar.push('darPlato' + ek);
    }
    if (s.maskeli && s.maskDb != null && s.enCok != null && s.maskDb > s.enCok.db) s.uyarilar.push('kayitAsiri');
  }

  /* ---------- saf ses: hava yolu ---------- */
  function havaKarari(v, k, f, kul) {
    var t = esik(v, k, 'hava', f);
    if (!t) return null;
    var kk = karsi(k), kaa = kul.kaaHava(f);
    var s = { kulak: k, yol: 'hava', f: f, esik: t.db, nr: !!t.nr, maskeli: !!t.maskeli, maskDb: t.maskDb, kaa: kaa, uyarilar: [] };
    var kb = kemikGorunur(v, kk, f), kh = esik(v, kk, 'hava', f);
    if (kb) {                                   // TK hava − KK kemik ≥ KAA (s. 82)
      s.karsi = { tur: 'kemik', db: kb.db, maskeli: kb.maskeli };
      s.fark = t.db - kb.db; s.gerekli = s.fark >= kaa; s.onKarar = false;
    } else if (kh) {                            // kemik yok: ön karar TK hava − KK hava ≥ KAA (s. 84)
      s.karsi = { tur: 'hava', db: kh.db };
      s.fark = t.db - kh.db; s.gerekli = s.fark >= kaa; s.onKarar = true;
    } else { s.gerekli = null; s.eksik = 'karsiYok'; }
    if (s.gerekli) {
      s.baslangic = kh ? kh.db + GUVENLIK_PAYI : null;       // s. 93
      if (!kh) s.eksik = 'karsiHavaYok';
      s.enCok = enCokDuzey(v, k, f, kul);
      uyarilarEkle(s);
    }
    return s;
  }

  /* ---------- saf ses: kemik yolu ---------- */
  function kemikKarari(v, k, f, kul) {
    var t = esik(v, k, 'kemik', f);
    if (!t) return null;
    var s = { kulak: k, yol: 'kemik', f: f, esik: t.db, nr: !!t.nr, maskeli: !!t.maskeli, maskDb: t.maskDb, kaa: KAA_KEMIK, uyarilar: [] };
    var h = esik(v, k, 'hava', f);
    var b = kemikGorunur(v, k, f);              // maskesiz (görünürdeki) ya da kendi maskeli eşiği
    if (!h) { s.gerekli = null; s.eksik = 'havaYok'; return s; }
    // Karar maskesiz kemik eşiğine göre verilir. Bu kulakta yalnızca maskeli kemik varsa: maskeli ölçülmüş demektir.
    var maskesiz = null;
    KULAKLAR.forEach(function (x) { var e = esik(v, x, 'kemik', f); if (e && !e.maskeli && (!maskesiz || e.db < maskesiz.db)) maskesiz = e; });
    var referans = maskesiz ? maskesiz.db : b.db;
    s.abg = h.db - referans;
    s.gerekli = s.abg >= KEMIK_ABG_ESIGI;      // s. 85
    s.havaEsik = h.db; s.kemikRef = referans;
    if (s.gerekli) {
      var kk = karsi(k), kh = esik(v, kk, 'hava', f);
      var teDeger = kul.te[f] || 0, kkAbg = abg(v, kk, f);
      s.te = (kkAbg != null && kkAbg >= TE_ABG_SINIRI) ? 0 : teDeger;   // s. 94
      s.teAtlandi = teDeger > 0 && s.te === 0;
      s.baslangic = kh ? kh.db + s.te + GUVENLIK_PAYI : null;          // s. 93
      if (!kh) s.eksik = 'karsiHavaYok';
      s.enCok = enCokDuzey(v, k, f, kul);
      uyarilarEkle(s);
    }
    return s;
  }

  /* ---------- konuşma ---------- */
  function enIyiKemik(v, k) {
    var en = null;
    KONUSMA_FREK.forEach(function (f) { var b = kemikGorunur(v, k, f); if (b && (en == null || b.db < en)) en = b.db; });
    return en;
  }
  function enBuyukAbg(v, k) {
    var en = null;
    KONUSMA_FREK.forEach(function (f) { var a = abg(v, k, f); if (a != null && (en == null || a > en)) en = a; });
    return en == null ? null : Math.max(0, en);
  }
  function konusmaKarari(v, k, kul) {
    var kz = (v.konusma && v.konusma[k]) || {}, kkz = (v.konusma && v.konusma[karsi(k)]) || {};
    if (kz.srt == null && kz.sunum == null) return null;
    var kk = karsi(k), kaa = kul.kaaKonusma;
    var kkKemik = enIyiKemik(v, kk);
    var s = { kulak: k, yol: 'konusma', kaa: kaa, maskeli: !!kz.maskeli, kkKemik: kkKemik, uyarilar: [] };
    // KAE (SRT): KAE(TK) − KK en iyi kemik ≥ KAA; kemik yoksa ön karar KAE(TK) − KAE(KK) ≥ KAA (s. 86, 89)
    if (kz.srt != null) {
      var r = { duzey: kz.srt };
      if (kkKemik != null) { r.karsi = { tur: 'kemik', db: kkKemik }; r.fark = kz.srt - kkKemik; r.onKarar = false; }
      else if (kkz.srt != null) { r.karsi = { tur: 'kae', db: kkz.srt }; r.fark = kz.srt - kkz.srt; r.onKarar = true; }
      r.gerekli = r.fark == null ? null : r.fark >= kaa;
      if (r.gerekli && kkz.srt != null) r.baslangic = kkz.srt + GUVENLIK_PAYI;    // plato yöntemi başlangıcı (s. 101)
      s.srt = r;
    }
    // Eşik üstü (SDS/WRS): sunum düzeyi − KK en iyi kemik ≥ KAA (s. 86)
    if (kz.sunum != null) {
      var u = { duzey: kz.sunum };
      if (kkKemik != null) { u.karsi = { tur: 'kemik', db: kkKemik }; u.fark = kz.sunum - kkKemik; u.gerekli = u.fark >= kaa; }
      else u.gerekli = null;
      if (u.gerekli) {
        var abgKK = enBuyukAbg(v, kk), tkKemik = enIyiKemik(v, k);
        // Akustik (plato merkezi) yöntemi (s. 103–104):
        //   en az = sunum − KAA + KK'nin en büyük ABG'si; en çok = TK'nin en iyi kemik eşiği + KAA − 5; orta = (en az + en çok) / 2
        u.enAz = abgKK == null ? null : kz.sunum - kaa + abgKK;
        u.enAzAbg = abgKK;
        u.enCok = tkKemik == null ? null : tkKemik + kaa - ASIRI_PAYI;
        u.tkKemik = tkKemik;
        u.orta = u.enAz != null && u.enCok != null ? (u.enAz + u.enCok) / 2 : null;
        // Sadeleştirilmiş: sunum − 20 dB; ön koşullar: iki kulakta da ABG < 15 dB ve 30–40 dB SL (s. 104–105)
        u.sade = kz.sunum - SADE_FARK;
        var abgTK = enBuyukAbg(v, k);
        var sl = kz.srt != null ? kz.sunum - kz.srt : null;
        u.sadeKosul = {
          abgYok: abgKK != null && abgTK != null && abgKK < KEMIK_ABG_ESIGI && abgTK < KEMIK_ABG_ESIGI,
          sl: sl, slUygun: sl != null && sl >= SADE_SL[0] && sl <= SADE_SL[1]
        };
        u.sadeUygun = u.sadeKosul.abgYok && u.sadeKosul.slUygun;
        if (u.enAz != null && u.enCok != null && u.enAz > u.enCok) s.uyarilar.push('ikilem');
      }
      s.sds = u;
    }
    return s;
  }

  /* ---------- bir vakanın tamamı ---------- */
  function degerlendir(v, kulaklikId) {
    var kul = KULAKLIKLAR[kulaklikId];
    if (!kul) throw new Error('Bilinmeyen kulaklık: ' + kulaklikId);
    var sonuc = { kulaklik: kulaklikId, hava: [], kemik: [], konusma: [] };
    KULAKLAR.forEach(function (k) {
      frekanslar(v, k, 'hava').forEach(function (f) { var s = havaKarari(v, k, f, kul); if (s) sonuc.hava.push(s); });
      frekanslar(v, k, 'kemik').forEach(function (f) { var s = kemikKarari(v, k, f, kul); if (s) sonuc.kemik.push(s); });
      var kz = konusmaKarari(v, k, kul); if (kz) sonuc.konusma.push(kz);
    });
    return sonuc;
  }

  /* ---------- plato (Hood) rehberi: durum makinesi ----------
     Başla: ton = maskesiz eşik, maske = başlangıç düzeyi; ton maske varken yeniden sunulur.
     Cevap varsa: art arda PLATO_ARTIS maske artışından sonra hâlâ cevap varsa plato → maskeli eşik = ton.
                  değilse maske +5 dB.
     Cevap yoksa: ton +5 dB, artış sayacı sıfırlanır (s. 97–98).
     Ton CIHAZ_SINIRI'nı aşarsa: cihaz sınırında cevap yok. Maske en çok düzeyi aşarsa uyarı. */
  function platoBasla(ton, maske, enCok) {
    return { ton: ton, maske: maske, enCok: enCok == null ? null : enCok, artis: 0, adim: 0, bitti: false, sonuc: null, asiriUyari: false, gecmis: [] };
  }
  function platoCevap(d, duydu) {
    if (d.bitti) return d;
    var n = { ton: d.ton, maske: d.maske, enCok: d.enCok, artis: d.artis, adim: d.adim + 1, bitti: false, sonuc: null, asiriUyari: d.asiriUyari,
      gecmis: d.gecmis.concat([{ ton: d.ton, maske: d.maske, duydu: !!duydu }]) };
    if (duydu) {
      if (n.artis >= PLATO_ARTIS) { n.bitti = true; n.sonuc = { tur: 'plato', esik: n.ton, maske: n.maske }; return n; }
      n.maske += PLATO_ADIM; n.artis += 1;
    } else {
      n.ton += PLATO_ADIM; n.artis = 0;
      if (n.ton > CIHAZ_SINIRI) { n.bitti = true; n.sonuc = { tur: 'cevapYok', ton: CIHAZ_SINIRI, maske: n.maske }; return n; }
    }
    if (n.enCok != null && n.maske > n.enCok) n.asiriUyari = true;
    return n;
  }

  var api = {
    KULAKLIKLAR: KULAKLIKLAR, KAA_KEMIK: KAA_KEMIK, GUVENLIK_PAYI: GUVENLIK_PAYI, KEMIK_ABG_ESIGI: KEMIK_ABG_ESIGI,
    TE_ABG_SINIRI: TE_ABG_SINIRI, ASIRI_PAYI: ASIRI_PAYI, KONUSMA_FREK: KONUSMA_FREK, SADE_FARK: SADE_FARK, SADE_SL: SADE_SL,
    PLATO_ADIM: PLATO_ADIM, PLATO_ARTIS: PLATO_ARTIS, CIHAZ_SINIRI: CIHAZ_SINIRI, KAYNAK: KAYNAK,
    degerlendir: degerlendir, kemikGorunur: kemikGorunur, platoBasla: platoBasla, platoCevap: platoCevap
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else kok.MaskelemeKural = api;
})(typeof window !== 'undefined' ? window : this);
