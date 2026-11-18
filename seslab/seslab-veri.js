/* SesLab (Ses laboratuvarı) içerik verisi: sahneler, frekanslar, arayüz yazıları.
   Her metin varsayılandır; yönetici uygulama içinden değiştirir (app.js: sl.sahne.<id>, sl.metin).
   Yapı adları ve açıklamaları 3D sayfasıyla ortaktır (gorsel3d/gorsel3d-veri.js, g3d.yapi.<id>).
   Klinik metinler taslaktır; proje sahibi kendi kaynağıyla doğrulayacak. */
window.SESLAB_VERI = {
  // gorunum: sahne seçilince kamera ('on' = önden; 'eksen' = kemikçik dönme ekseni boyunca)
  // enerji: enerji dönüşümü şeridinde vurgulanan aşamalar (1 akustik, 2 mekanik, 3 hidrolik, 4 elektriksel)
  // 'pinna' = kulak kepçesi (modelde 11 parça, burada tek yapı)
  sahneler: [
    { id: 'yol', ad: 'Ses yolculuğu',
      aciklama: 'Ses dalgası dış kulak yolunda ilerler ve timpanik membranı titreştirir. Titreşim malleus, inkus ve stapes ile oval pencereye taşınır. Stapes tabanı perilenfi iter; koklea içinde bazalden apekse doğru ilerleyen bir dalga oluşur.',
      yapilar: ['eac', 'tm', 'mal', 'inc', 'sta', 'sm', 'n8'], yari: ['sv', 'st', 'vest'], cerceve: ['tm', 'mal', 'inc', 'sta', 'sv', 'st', 'vest'], gorunum: 'on', enerji: [1, 2, 3, 4] },
    { id: 'dis', ad: 'Dış kulak',
      aciklama: 'Kulak kepçesi sesi toplar ve dış kulak yoluna yönlendirir. Kepçe ve kanal bazı frekansları (yaklaşık 2–5 kHz) biraz güçlendirir. Ses dalgası kanal boyunca ilerleyip timpanik membrana çarpar ve onu titreştirir.',
      yapilar: ['pinna', 'eac', 'tm'], cerceve: ['pinna', 'eac', 'tm'], gorunum: 'on', enerji: [1, 2] },
    { id: 'orta', ad: 'Orta kulak',
      aciklama: 'Timpanik membran içe itilince malleus sapı (manubrium) onunla birlikte içe gider. Malleus ve inkus, malleus–inkus ekleminden geçen eksen etrafında döner; inkus malleusu çok az geriden izler. İnkusun uzun kolu stapesi oval pencereye (fenestra vestibuli) doğru iter. Dönme ekseni modelden yaklaşık olarak hesaplandı.',
      yapilar: ['tm', 'mal', 'inc', 'sta'], yari: ['vest'], cerceve: ['tm', 'mal', 'inc', 'sta'], gorunum: 'eksen', enerji: [2, 3] },
    { id: 'koklea', ad: 'Koklea',
      aciklama: 'Oval pencerede (fenestra vestibuli) stapes tabanının mekanik titreşimi perilenfe geçer ve sıvı dalgasına dönüşür. Bu dalga koklear kanalda bazalden apekse doğru ilerler (yürüyen dalga) ve frekansa özgü bir yerde en büyük olur: yüksek frekanslar bazalde, alçak frekanslar apekste (tonotopi). Dalganın en büyük olduğu yerde Corti organındaki tüy hücrelerinin tüycükleri eğilir ve hareket elektriksel sinyale dönüşür (mekanoelektriksel dönüşüm). Sinyal VIII. kranial sinirle beyne gider. Modelde baziler membran ve tüy hücreleri olmadığı için dalga skala media üzerinde renkle gösteriliyor.',
      yapilar: ['sm', 'sta', 'n8'], yari: ['sv', 'st', 'vest'], cerceve: ['sv', 'st', 'sm', 'vest'], gorunum: 'on', enerji: [3, 4] }
  ],
  // Bu sayfaya özgü yapılar (yönetici düzenler: sl.yapi.<id>); diğer yapıların adları 3D sayfasıyla ortak.
  yapilar: {
    pinna: { ad: 'Kulak kepçesi', aciklama: 'Aurikula. Sesi toplayıp dış kulak yoluna yönlendirir, bazı frekansları biraz güçlendirir ve sesin yönünü (özellikle önde/arkada, yukarıda/aşağıda) ayırt etmeye yardım eder.' }
  },
  frekanslar: [125, 250, 500, 1000, 2000, 4000, 8000],
  sesDuzeyi: 0.06,   // Web Audio kazancı (0–1); bilerek düşük
  metinler: {
    canvasEtiketi: 'Ses laboratuvarı: hareketli orta ve iç kulak modeli',
    taraf: 'Sağ kulak',
    olcek: '10 mm',
    indiriliyor: 'Model indiriliyor (yaklaşık 4 MB)…',
    indirilemedi: 'Model indirilemedi. İnternet bağlantını kontrol edip yeniden dene.',
    yenidenDene: 'Yeniden dene',
    webglYok: 'Bu cihazda 3D çizim (WebGL) açılamadı. Başka bir tarayıcıda dene.',
    baslatilamadi: '3D sahne başlatılamadı.',
    baglamKayboldu: '3D sahne durdu. Sayfayı yenile.',
    oynat: 'Oynat',
    duraklat: 'Duraklat',
    sahneBasligi: 'Sahne',
    frekansBasligi: 'Frekans',
    gorunumBasligi: 'Görünüm',
    gorunumler: { lat: 'Lateralden', med: 'Medialden', ust: 'Üstten', on: 'Önden', arka: 'Arkadan' },
    sesCal: 'Sesi çal',
    sesDurdur: 'Sesi durdur',
    sesYok: 'Bu tarayıcı ses çalamıyor.',
    sesNot: 'Ses düzeyini düşük tut. Telefon sessizdeyse ses duyulmayabilir. Bu ses kalibre değildir; işitme testi için kullanılamaz.',
    uyari: 'Hareketler büyütüldü ve yavaşlatıldı. Gerçekte titreşim nanometre düzeyindedir ve saniyede yüzlerce, binlerce kez olur. Öğretim çizimidir, ölçülmüş simülasyon değildir. Pembe: içe itilme, mavi: dışa çekilme, mor: sinirdeki elektriksel sinyal.',
    ovalEtiket: 'Oval pencere',
    enerjiBaslik: 'Enerji dönüşümü',
    enerji1Ad: 'Akustik', enerji1Alt: 'Kepçe, dış kulak yolu (hava)',
    enerji2Ad: 'Mekanik', enerji2Alt: 'Zar, kemikçikler',
    enerji3Ad: 'Hidrolik', enerji3Alt: 'Oval pencere, perilenf',
    enerji4Ad: 'Elektriksel', enerji4Alt: 'Tüy hücreleri, VIII. sinir',
    enerjiNot: 'Oval pencere (fenestra vestibuli), kemikçiklerin mekanik titreşimini iç kulak sıvısının dalgasına çevirir. Elektriksel sinyale dönüşüm bir adım sonra, koklea içinde tüy hücrelerinde olur. Seçili sahnenin aşamaları koyu gösterilir.',
    frekansNot: '{f} Hz: dalga en büyük, bazalden yaklaşık yüzde {y} uzaklıkta ({bolge}). Konum Greenwood (1990) insan formülüyle hesaplandı; yaklaşıktır.',
    bolgeBazal: 'bazal bölüm',
    bolgeOrta: 'orta bölüm',
    bolgeApikal: 'apikal bölüm',
    not: 'Model 3D kulak modeli sayfasındakiyle aynıdır. Kemikçiklerin dönme ekseni, inkusun gecikmesi, hareket miktarları, skala media üzerindeki dalga ve sinirdeki sinyal modelden yaklaşık olarak çizildi; ölçülmüş veri değildir. En apeks yaklaşık 20 Hz’e karşılık gelir; 125 Hz bile apeksin biraz önünde en büyük olur. Bir yapıya dokununca adı ve açıklaması çıkar.',
    kaynakOnsoz: 'Kaynaklar:',
    kaynaklar: [
      { metin: 'Sieber D. ve ark., OpenEar kütüphanesi, örnek ZETA (CC BY 4.0)', adres: 'https://zenodo.org/records/1473724' },
      { metin: 'Artec 3D kulak taraması (CC BY 3.0)', adres: 'https://www.artec3d.com/3d-models/ear' },
      { metin: 'Greenwood D. D. (1990), J Acoust Soc Am 87(6):2592–2605', adres: 'https://doi.org/10.1121/1.399052' }
    ]
  }
};
