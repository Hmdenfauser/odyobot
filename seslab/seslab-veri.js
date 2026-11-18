/* SesLab (Ses laboratuvarı) içerik verisi: sahneler, frekanslar, arayüz yazıları.
   Her metin varsayılandır; yönetici uygulama içinden değiştirir (app.js: sl.sahne.<id>, sl.metin).
   Yapı adları ve açıklamaları 3D sayfasıyla ortaktır (gorsel3d/gorsel3d-veri.js, g3d.yapi.<id>).
   Klinik metinler taslaktır; proje sahibi kendi kaynağıyla doğrulayacak. */
window.SESLAB_VERI = {
  // gorunum: sahne seçilince kamera ('on' = önden; 'eksen' = kemikçik dönme ekseni boyunca)
  sahneler: [
    { id: 'yol', ad: 'Ses yolculuğu',
      aciklama: 'Ses dalgası dış kulak yolunda ilerler ve timpanik membranı titreştirir. Titreşim malleus, inkus ve stapes ile oval pencereye taşınır. Stapes tabanı perilenfi iter; koklea içinde bazalden apekse doğru ilerleyen bir dalga oluşur.',
      yapilar: ['eac', 'tm', 'mal', 'inc', 'sta', 'sm'], yari: ['sv', 'st', 'vest'], cerceve: ['tm', 'mal', 'inc', 'sta', 'sv', 'st', 'vest'], gorunum: 'on' },
    { id: 'orta', ad: 'Orta kulak',
      aciklama: 'Timpanik membran içe itilince malleus sapı (manubrium) onunla birlikte içe gider. Malleus ve inkus birlikte, malleus–inkus ekleminden geçen eksen etrafında döner; inkusun uzun kolu stapesi oval pencereye doğru iter. Dönme ekseni modelden yaklaşık olarak hesaplandı.',
      yapilar: ['tm', 'mal', 'inc', 'sta'], yari: ['vest'], cerceve: ['tm', 'mal', 'inc', 'sta'], gorunum: 'eksen' },
    { id: 'koklea', ad: 'Koklea',
      aciklama: 'Stapes oval pencereyi ittikçe koklear kanalda bazalden apekse doğru ilerleyen bir dalga oluşur (yürüyen dalga). Dalga frekansa özgü bir yerde en büyük olur, sonra hızla söner: yüksek frekanslar bazalde, alçak frekanslar apekste (tonotopi). Modelde baziler membran olmadığı için dalga skala media üzerinde renkle gösteriliyor.',
      yapilar: ['sm', 'sta'], yari: ['sv', 'st', 'vest'], cerceve: ['sv', 'st', 'sm'], gorunum: 'on' }
  ],
  frekanslar: [250, 500, 1000, 2000, 4000, 8000],
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
    uyari: 'Hareketler büyütüldü ve yavaşlatıldı. Gerçekte titreşim nanometre düzeyindedir ve saniyede yüzlerce, binlerce kez olur. Öğretim çizimidir, ölçülmüş simülasyon değildir.',
    frekansNot: '{f} Hz: dalga en büyük, bazalden yaklaşık yüzde {y} uzaklıkta ({bolge}). Konum Greenwood (1990) insan formülüyle hesaplandı; yaklaşıktır.',
    bolgeBazal: 'bazal bölüm',
    bolgeOrta: 'orta bölüm',
    bolgeApikal: 'apikal bölüm',
    not: 'Model 3D kulak modeli sayfasındakiyle aynıdır. Kemikçiklerin dönme ekseni, hareket miktarları ve skala media üzerindeki dalga modelden yaklaşık olarak hesaplandı; ölçülmüş veri değildir. Bir yapıya dokununca adı ve açıklaması çıkar.',
    kaynakOnsoz: 'Kaynaklar:',
    kaynaklar: [
      { metin: 'Sieber D. ve ark., OpenEar kütüphanesi, örnek ZETA (CC BY 4.0)', adres: 'https://zenodo.org/records/1473724' },
      { metin: 'Greenwood D. D. (1990), J Acoust Soc Am 87(6):2592–2605', adres: 'https://doi.org/10.1121/1.399052' }
    ]
  }
};
