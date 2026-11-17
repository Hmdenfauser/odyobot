/* OdyoBOT hesaplama kuralları: saf ses ortalaması (PTA), işitme kaybı derecesi ve tipi.
   Ekranla hiçbir ilgisi yoktur; aynı girdi her zaman aynı sonucu verir (CLAUDE.md §7).
   Tarayıcıda window.OdyoHesap, Node'da require('./odyo-hesap.js') olarak kullanılır; böylece ayrı ayrı test edilebilir.

   Değerler proje sahibinin verdiği değerlerdir (2026-11-09). Kaynağa ve kliniğe göre değişebilir;
   değiştirmek için yalnızca aşağıdaki iki tabloya dokunmak yeterli. */
(function (kok) {
  'use strict';

  /* ---------- AYARLANABİLİR DEĞERLER ---------- */

  // İşitme kaybı derecesi (Clark sınıflaması), hava yolu PTA'ya göre.
  // Her satır: "ust" dB HL değerine kadar (dahil) bu derece. Tam sayı olmayan ortalamada
  // üst sınırı aşan değer bir sonraki dereceye geçer (ör. 15,3 dB → çok hafif).
  var ESIK_TABLOSU = [
    { ust: 15, ad: 'normal' },
    { ust: 25, ad: 'çok hafif' },
    { ust: 40, ad: 'hafif' },
    { ust: 55, ad: 'orta' },
    { ust: 70, ad: 'orta-ileri' },
    { ust: 90, ad: 'ileri' },
    { ust: Infinity, ad: 'çok ileri' }
  ];

  // Hava-kemik farkı (ABG) eşiği, dB. Fark bu değere eşit ya da büyükse "anlamlı fark" sayılır.
  var ABG_ESIGI = 10;

  // PTA frekans seçenekleri.
  var PTA_FREKANSLARI = {
    3: [500, 1000, 2000],
    4: [500, 1000, 2000, 4000]
  };

  // Timpanogram tipi (226 Hz, yetişkin). Kaynak: proje sahibinin ders slaytı "2.timpanometri.pptx" (slayt 30–34);
  // As/A sınırı ve C/+50 kararları proje sahibinin (2026-11-17). Basınç daPa, kompliyans ml.
  var TIMPAN_SINIR = {
    tepeEnAz: -100,     // tepe bundan daha negatifse Tip C (kompliyansa bakılmaz)
    tepeEnCok: 50,      // tepe bundan daha pozitifse sınıflanmaz
    kompEnAz: 0.35,     // bunun altı As (0,35 dahil A)
    kompEnCok: 1.30     // bunun üstü Ad (1,30 dahil A)
  };

  // OAE geçti/kaldı. Kaynak: proje sahibinin ders slaytı "Odyoloji_de Enstrümantasyon OAE 2.pptx"
  // (DP-NF ve TE-NF ≥ 6 dB, en az 3 frekans; TEOAE tekrarlanabilirlik ≥ %80, prob stabilitesi ≥ %90).
  // 6 dB / en az 3 frekans yaygın tarama ölçütüyle de uyumlu (Interacoustics, Iowa yenidoğan protokolü).
  // Proje sahibinin kararı (2026-11-17): en az 3 frekans; tekrarlanabilirlik/stabilite ölçüte katılır.
  var OAE_KURAL = { snr: 6, enAzFrekans: 3, teRepro: 80, teStab: 90 };

  /* ---------- HESAPLAR ---------- */

  // OAE sonucu (tek kulak, tek test). olcum: { '2000': { s: sinyal dB SPL, g: gürültü dB SPL }, ... }
  // ek (yalnız TEOAE): { repro: %, stab: % } — girilmemişse ölçüte katılmaz.
  // Dönüş: { kod: 'gecti' | 'kaldi' | 'gecersiz' | 'yetersiz' | null, var: emisyon olan frekans sayısı, girilen, metin }
  function oaeSonuc(olcum, ek) {
    var fl = Object.keys(olcum || {}).filter(function (f) { var x = olcum[f]; return x && x.s != null && x.g != null; });
    if (!fl.length) return { kod: null, var: 0, girilen: 0, metin: '' };
    var varSay = fl.filter(function (f) { return Math.round((olcum[f].s - olcum[f].g) * 10) / 10 >= OAE_KURAL.snr; }).length;   // fark 0,1 dB'e yuvarlanır (ondalık hesap hatası olmasın)
    var r = { var: varSay, girilen: fl.length };
    ek = ek || {};
    if (ek.repro != null && ek.repro < OAE_KURAL.teRepro) { r.kod = 'gecersiz'; r.metin = 'Geçersiz kayıt (tekrarlanabilirlik %' + ek.repro + ', en az %' + OAE_KURAL.teRepro + ')'; return r; }
    if (ek.stab != null && ek.stab < OAE_KURAL.teStab) { r.kod = 'gecersiz'; r.metin = 'Geçersiz kayıt (prob stabilitesi %' + ek.stab + ', en az %' + OAE_KURAL.teStab + ')'; return r; }
    if (varSay >= OAE_KURAL.enAzFrekans) { r.kod = 'gecti'; r.metin = 'Geçti (' + varSay + '/' + fl.length + ' frekansta emisyon var)'; return r; }
    if (fl.length < OAE_KURAL.enAzFrekans) { r.kod = 'yetersiz'; r.metin = 'Değerlendirilemedi (en az ' + OAE_KURAL.enAzFrekans + ' frekans gerekli)'; return r; }
    r.kod = 'kaldi'; r.metin = 'Kaldı (' + varSay + '/' + fl.length + ' frekansta emisyon var)'; return r;
  }

  // Timpanogram tipi. e: { basinc, kompliyans, duz } (vaka kaydındaki bir kulak).
  // Dönüş: { kod: 'A' | 'As' | 'Ad' | 'B' | 'C' | null, metin }. Değer eksikse kod null ve metin nedenini söyler.
  function timpanTipi(e) {
    if (!e) return { kod: null, metin: '' };
    if (e.duz) return { kod: 'B', metin: 'Tip B' };
    if (e.basinc == null) return { kod: null, metin: 'Tip için tepe basıncı gerekli' };
    if (e.basinc > TIMPAN_SINIR.tepeEnCok) return { kod: null, metin: 'Sınıflanamadı (tepe pozitif basınçta)' };
    if (e.basinc < TIMPAN_SINIR.tepeEnAz) return { kod: 'C', metin: 'Tip C' };
    if (e.kompliyans == null) return { kod: null, metin: 'Tip için kompliyans gerekli' };
    if (e.kompliyans < TIMPAN_SINIR.kompEnAz) return { kod: 'As', metin: 'Tip As' };
    if (e.kompliyans > TIMPAN_SINIR.kompEnCok) return { kod: 'Ad', metin: 'Tip Ad' };
    return { kod: 'A', metin: 'Tip A' };
  }

  // Bir yolun (hava ya da kemik) ortalaması.
  // yolEsik: { "500": { db: 40, nr: true/false, maskeli: ... }, ... }  (boş frekans hiç yoktur)
  // Dönüş: { hesaplandi: true, deger, enAz, nrFrekanslar }  ya da
  //        { hesaplandi: false, eksik: [frekanslar], hicYok: bu yolda hiç değer yok mu }
  // Eksik frekans varsa tahmin yürütülmez. NR (yanıt yok) frekansında girilen değer (cihazın en yüksek düzeyi)
  // kullanılır ve sonuç "en az" olarak işaretlenir.
  function pta(yolEsik, frekanslar) {
    yolEsik = yolEsik || {};
    frekanslar = frekanslar || PTA_FREKANSLARI[3];
    var eksik = [], toplam = 0, nrFrekanslar = [];
    frekanslar.forEach(function (f) {
      var e = yolEsik[String(f)];
      if (!e || typeof e.db !== 'number') { eksik.push(f); return; }
      toplam += e.db;
      if (e.nr) nrFrekanslar.push(f);
    });
    if (eksik.length) return { hesaplandi: false, eksik: eksik, hicYok: Object.keys(yolEsik).length === 0 };
    return { hesaplandi: true, deger: toplam / frekanslar.length, enAz: nrFrekanslar.length > 0, nrFrekanslar: nrFrekanslar };
  }

  // PTA değerine göre derece satırı: { ad, sira } (sira: 0 = normal).
  function derece(ptaDeger) {
    for (var i = 0; i < ESIK_TABLOSU.length; i++) {
      if (ptaDeger <= ESIK_TABLOSU[i].ust) return { ad: ESIK_TABLOSU[i].ad, sira: i };
    }
    return { ad: ESIK_TABLOSU[ESIK_TABLOSU.length - 1].ad, sira: ESIK_TABLOSU.length - 1 };
  }

  // "Normal" sınırı derece tablosunun ilk satırından okunur.
  function normalMi(ptaDeger) { return ptaDeger <= ESIK_TABLOSU[0].ust; }

  // İşitme kaybı tipi. hava ve kemik: pta() sonuçları.
  // Dönüş: { kod, metin, abg (varsa), kesinDegil (NR içeriyorsa) }
  // kod: 'normal' | 'iletim' | 'mikst' | 'sensorinoral' | 'belirsiz'
  function tip(hava, kemik) {
    if (!hava || !hava.hesaplandi) {
      return { kod: 'belirsiz', metin: 'Hava yolu ortalaması hesaplanamadığı için tip belirlenemedi.' };
    }
    if (normalMi(hava.deger)) {
      return { kod: 'normal', metin: 'Normal işitme', kesinDegil: hava.enAz };
    }
    if (!kemik || !kemik.hesaplandi) {
      if (!kemik || kemik.hicYok) return { kod: 'belirsiz', metin: 'Kemik yolu girilmediği için tip belirlenemedi.' };
      return { kod: 'belirsiz', metin: 'Kemik yolu ortalaması hesaplanamadı (eksik frekans: ' + hzListesi(kemik.eksik) + '); tip belirlenemedi.' };
    }
    var abg = hava.deger - kemik.deger;
    var kesinDegil = !!(hava.enAz || kemik.enAz);
    if (abg >= ABG_ESIGI && normalMi(kemik.deger)) return { kod: 'iletim', metin: 'İletim tipi işitme kaybı', abg: abg, kesinDegil: kesinDegil };
    if (abg >= ABG_ESIGI) return { kod: 'mikst', metin: 'Mikst tip işitme kaybı', abg: abg, kesinDegil: kesinDegil };
    return { kod: 'sensorinoral', metin: 'Sensörinöral işitme kaybı', abg: abg, kesinDegil: kesinDegil };
  }

  // Bir kulağın tüm değerlendirmesi. kulakEsik: { hava: {...}, kemik: {...} }, ptaTur: 3 ya da 4.
  function degerlendir(kulakEsik, ptaTur) {
    kulakEsik = kulakEsik || {};
    var frek = PTA_FREKANSLARI[ptaTur] || PTA_FREKANSLARI[3];
    var hava = pta(kulakEsik.hava, frek), kemik = pta(kulakEsik.kemik, frek);
    var d = hava.hesaplandi ? derece(hava.deger) : null;
    return {
      frekanslar: frek,
      hava: hava,
      kemik: kemik,
      derece: d,
      dereceMetni: d ? (hava.enAz ? 'en az ' + d.ad : d.ad) : '',
      tip: tip(hava, kemik)
    };
  }

  /* ---------- YAZIYA ÇEVİRME ---------- */

  function sayiYaz(n) { return (Math.round(n * 10) / 10).toFixed(1).replace('.', ','); }
  function hzListesi(l) { return l.map(function (f) { return f + ' Hz'; }).join(', '); }
  // "41,7 dB HL", "en az 61,7 dB HL" ya da "Hesaplanamadı (eksik frekans: 2000 Hz)"
  function ptaMetni(p) {
    if (!p.hesaplandi) return p.hicYok ? 'Girilmedi' : 'Hesaplanamadı (eksik frekans: ' + hzListesi(p.eksik) + ')';
    return (p.enAz ? 'en az ' : '') + sayiYaz(p.deger) + ' dB HL';
  }
  // Liste kartı için kısa özet: "sensörinöral, orta" / "normal işitme" / "tip belirlenemedi"
  function kisaOzet(sonuc) {
    if (!sonuc.hava.hesaplandi) return 'hesaplanamadı';
    if (sonuc.tip.kod === 'normal') return 'normal işitme';
    var t = { iletim: 'iletim tipi', mikst: 'mikst tip', sensorinoral: 'sensörinöral' }[sonuc.tip.kod] || 'tip belirsiz';
    return t + ', ' + sonuc.dereceMetni;
  }

  var api = {
    ESIK_TABLOSU: ESIK_TABLOSU, ABG_ESIGI: ABG_ESIGI, PTA_FREKANSLARI: PTA_FREKANSLARI,
    pta: pta, derece: derece, normalMi: normalMi, tip: tip, degerlendir: degerlendir,
    sayiYaz: sayiYaz, ptaMetni: ptaMetni, kisaOzet: kisaOzet,
    TIMPAN_SINIR: TIMPAN_SINIR, timpanTipi: timpanTipi,
    OAE_KURAL: OAE_KURAL, oaeSonuc: oaeSonuc
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else kok.OdyoHesap = api;
})(this);
