/* SesLab (Ses laboratuvarı) içerik verisi: sahneler, frekanslar, arayüz yazıları.
   Her metin varsayılandır; yönetici uygulama içinden değiştirir (app.js: sl.sahne.<id>, sl.metin).
   Yapı adları ve açıklamaları 3D sayfasıyla ortaktır (gorsel3d/gorsel3d-veri.js, g3d.yapi.<id>).
   Klinik metinler taslaktır; proje sahibi kendi kaynağıyla doğrulayacak. 
   2026-11-22 denetimi: işitme sahneleri İşitme ve Denge Sistemleri-2 (sl. 38–58; kepçe, konka ve kanal kazancı), denge sahneleri
   Vestibüler Sistem ve Hastalıkları 3. ders BPPV (sl. 14–30) ve Vestibüler Sistemin Değerlendirilmesi 3. ders (Dix-Hallpike, Epley)
   ile karşılaştırıldı; ders notunda olmayan ayrıntılar aşağıdaki kaynak listesindeki makalelere dayanır.
   */
window.SESLAB_VERI = {
  // gorunum: sahne seçilince kamera ('on' = önden; 'eksen' = kemikçik dönme ekseni boyunca)
  // enerji: enerji dönüşümü şeridinde vurgulanan aşamalar (1 akustik, 2 mekanik, 3 hidrolik, 4 elektriksel)
  // 'pinna' = kulak kepçesi (modelde 11 parça, burada tek yapı)
  sahneler: [
    { id: 'yol', ad: 'Ses yolculuğu',
      aciklama: 'Kulak kepçesi sesi toplar. Ses dalgası dış kulak yolunda ilerler ve timpanik membranı titreştirir. Titreşim malleus, inkus ve stapes ile oval pencereye taşınır. Stapes tabanı perilenfi iter; koklea içinde bazalden apekse doğru ilerleyen bir dalga oluşur.',
      yapilar: ['pinna', 'eac', 'tm', 'mal', 'inc', 'sta', 'sm', 'n8'], yari: ['sv', 'st', 'vest'], cerceve: ['pinna', 'eac', 'tm', 'mal', 'inc', 'sta', 'sv', 'st', 'vest'], gorunum: 'on', enerji: [1, 2, 3, 4] },
    { id: 'dis', ad: 'Dış kulak',
      aciklama: 'Kulak kepçesi sesi toplar ve dış kulak yoluna yönlendirir. Konka yaklaşık 4–5 kHz’de (ortalama 4700 Hz’de rezonansa girer) yaklaşık 10 dB, dış kulak yolu ise yetişkinde en çok 3500–4000 Hz’de sesi güçlendirir. Ses dalgası kanal boyunca ilerleyip timpanik membrana çarpar ve onu titreştirir.',
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
    utrikulus: { ad: 'Utrikulus (makula)', aciklama: 'Otolit organı. Makulası baş dikken yaklaşık yataydır; başın eğilmesini ve öne-arkaya, yana doğrusal hızlanmayı algılar. Otolit kristalleri genellikle buradan kopar. Modelde ayrı parça değildir; yeri ve büyüklüğü yaklaşık çizildi.' },
    sakkulus: { ad: 'Sakkulus (makula)', aciklama: 'Otolit organı. Makulası baş dikken yaklaşık dikeydir; yukarı-aşağı doğrusal hızlanmayı ve yerçekimini algılar. Modelde ayrı parça değildir; yeri ve büyüklüğü yaklaşık çizildi.' },
    pinna: { ad: 'Kulak kepçesi', aciklama: 'Aurikula. Sesi toplayıp dış kulak yoluna yönlendirir ve bazı frekansları biraz güçlendirir (kepçenin kendi kazancı 4 kHz’de yaklaşık 3 dB). İşitmeye en büyük katkısı sesin yerini belirlemektir: ön-arka, iki yan ve yukarı-aşağı yönlerde üç boyutlu yön tayinine yardım eder.' }
  },
  /* Denge kipi. poz (derece): govde = gövdenin yatması (−90 sırtüstü, −110 sırtüstü + baş 20° sarkık),
     donus = başın sağa (+) / sola (−) dönüşü, egim = çene göğse (+), yan = başın sağ omza (+) eğilmesi.
     kisa: küçük tuştaki kısa yazı (2026-11-20).
     ivme: doğrusal hızlanma, g biriminde, dünya eksenlerinde ([0, 0, 0.5] = ileri). sifirla: kristaller başa döner.
     Klinik metinler taslaktır; proje sahibi kendi kaynağıyla doğrulayacak. */
  denge: {
    sahneler: [
      { id: 'makula', tip: 'makula', ad: 'Otolit organları', kisa: 'Otolit',
        aciklama: 'Utrikulus ve sakkulusun makulasında tüy hücrelerinin üstünde jel bir zar, onun üstünde de kalsiyum karbonat kristalleri (otokonya) bulunur. Kristaller zarı ağırlaştırır. Baş eğilince ya da doğrusal hızlanmada zar kayar ve tüy hücrelerinin tüycüklerini büker. Utrikulus daha çok yatay, sakkulus dikey yöndeki hareketi algılar.',
        yapilar: ['utrikulus', 'sakkulus', 'bas'], yari: ['vest', 'ant', 'post', 'lat', 'crus', 'amp'], cerceve: ['utrikulus', 'sakkulus'],
        adimlar: [
          { id: 'dik', ad: 'Baş dik', kisa: 'Dik', poz: {}, aciklama: 'Utrikulus yatay olduğu için zarı kaymaz. Sakkulus dikey olduğu için zarı yerçekimiyle aşağı çekilir; dik dururken yerçekimini sakkulus algılar.' },
          { id: 'one', ad: 'Baş öne eğik', kisa: 'Öne', poz: { egim: 30 }, aciklama: 'Baş öne eğilince utrikulustaki zar öne doğru kayar ve tüy demetleri bükülür. Beyin bu bükülmeden başın eğildiğini anlar.' },
          { id: 'sag', ad: 'Baş sağa eğik', kisa: 'Sağa', poz: { yan: 30 }, aciklama: 'Baş sağ omza eğilince utrikulustaki zar sağa (dışa) doğru kayar.' },
          { id: 'ivme', ad: 'İleri hızlanma', kisa: 'İvme', poz: {}, ivme: [0, 0, 0.5], aciklama: 'Baş dikken ileri doğru hızlanınca zar eylemsizlikle geride kalır, yani geriye kayar. Bu, başın geriye eğilmesindekiyle aynı yönde bir bükülmedir.' }
        ] },
      { id: 'bppv', tip: 'bppv', ad: 'BPPV ve Epley', kisa: 'BPPV–Epley',
        aciklama: 'Benign paroksismal pozisyonel vertigo (BPPV): utrikulustan kopan otolit kristalleri bir semisirküler kanala düşer; en sık posterior kanal etkilenir (%80–85). Kristallerin kanalda serbest durduğu biçime kanalitiazis denir (Epley). Baş pozisyonu değişince kristaller kanalda kayar, endolenfi sürükler ve kupulayı büker; kısa süreli baş dönmesi ve nistagmus olur. Burada sağ posterior kanal BPPV\'si, Dix-Hallpike testi ve Epley manevrası gösteriliyor.',
        yapilar: ['kristal', 'bas'], yari: ['post', 'amp', 'vest', 'ant', 'lat', 'crus'], cerceve: ['post', 'vest', 'ant', 'lat'],
        adimlar: [
          { id: 'basla', ad: 'Başlangıç: oturur', kisa: 'Başla', poz: {}, sifirla: true, aciklama: 'Kopmuş kristaller sağ posterior kanalda birikmiş. Posterior kanal en alttaki kanal olduğundan kişi ayaktayken kristaller kanalın en dip kısmında toplanabilir. Baş dik ve hareketsizken kupula itilmez, baş dönmesi olmaz.' },
          { id: 'dix', ad: 'Dix-Hallpike (sağ)', kisa: 'Dix-H.', poz: { govde: -110, donus: 45 }, aciklama: 'Baş sağa 45° çevrilir, hasta sırtüstü yatırılır ve baş yaklaşık 30° ekstansiyona getirilir (ders notu; kılavuzda yaklaşık 20°). Kristaller ampulladan uzaklaşarak kanalın en alçak noktasına kayar; kupula ampulladan uzaklaşan yönde bükülür (ampullofugal, posterior kanalda uyarıcı). Kısa bir gecikmeden sonra yukarı vuran, torsiyonel bileşenli (üst kutbu alttaki kulağa dönen) nistagmus ve baş dönmesi olur; genellikle 1 dakikadan kısa sürer.' },
          { id: 'e2', ad: 'Epley 2: baş sola', kisa: 'Epley 2', poz: { govde: -110, donus: -45 }, aciklama: 'Baş sarkık kalırken yavaşça 90° sola çevrilir. Kristaller kanal boyunca ilerlemeye devam eder. Her pozisyonda 30 sn–1 dk beklenir (animasyonda süreler kısaltıldı).' },
          { id: 'e3', ad: 'Epley 3: sol yana', kisa: 'Epley 3', poz: { govde: -90, donus: -135 }, aciklama: 'Hasta sol yanına döner ve baş 90° daha çevrilir; yüz yaklaşık 45° aşağı, yere bakar. Kristaller kanalın tepesini aşıp krus kommune yoluyla utrikulusa geçer.' },
          { id: 'e4', ad: 'Epley 4: oturma', kisa: 'Epley 4', poz: { egim: 20, donus: -45 }, aciklama: 'Hasta baş solda kalarak oturtulur, sonra baş hafifçe öne eğilir. Kristaller utrikulusta kalır ve artık posterior kanalı uyarmaz.' },
          { id: 'son', ad: 'Sonuç: oturur', kisa: 'Sonuç', poz: {}, aciklama: 'Baş düz, kristaller utrikulusta. Manevranın etkisi Dix-Hallpike testi tekrarlanarak kontrol edilebilir.' }
        ] }
    ]
  },
  /* Dağılma (difraksiyon) kipi (#seslab/dagilma, 2026-11-20; seslab/dagilma.js). İki sahne: duvar, baş gölgesi.
     Kaynak: proje sahibinin ders notları — İşitme Teorileri ve Psikoakustik 1. ders s. 37 (dağılma), 2. ders slayt 72 ve
     3. ders slayt 5 (gölge etkisi); İşitme ve Denge Sistemleri-2 s. 22–24 (1500 Hz, 3–6 dB / ≥20 dB).
     "Eşit" durumunun ayrıntısı genel akustik kaynaklarından (HyperPhysics, Britannica). Duvar (≈70 cm) ve baş (≈18 cm) şematik kabul.
     Metinler taslaktır; yönetici düzenler: ortak yazılar icerik/sl.dagilma, sahneler sl.dagilma.duvar ve sl.dagilma.bas. */
  dagilma: {
    sahneDuvar: 'Duvar',
    sahneBas: 'Baş gölgesi',
    frekansBasligi: 'Frekans',
    dalgaBoyu: 'Dalga boyu',
    tasiyor: '(çerçeveden uzun)',
    durumBuyuk: 'Dalga boyu engelden büyükse',
    durumEsit: 'Dalga boyu engele eşitse',
    durumKucuk: 'Dalga boyu engelden küçükse',
    esitAyrinti: 'Dalga boyu engelin boyuna eşit olunca: kırınım gerçekleşir. Akustik kaynaklarına göre kırınım en belirgin hâlini dalga boyu engelle aynı büyüklükteyken alır: engelin kenarı ikinci bir kaynak gibi davranır ve sesi yalnızca arkaya değil yanlara ve geriye de dağıtır. Arkada tam olmayan, kısmi bir gölge kalır; dağılan dalgalar üst üste binerek bazı yerlerde güçlenip bazı yerlerde zayıflayabilir (girişim). Dalga boyu engelden çok uzunsa engel neredeyse fark edilmez; çok kısaysa ses ışık gibi düz gider ve keskin bir gölge bırakır.',
    uyari: 'Şematik çizimdir: dalgalar yavaşlatıldı. Dalga boyu ile engel aynı ölçekte çizildi (duvar yüksekliği yaklaşık 70 cm, baş genişliği yaklaşık 18 cm, ses hızı 343 m/sn kabul edildi). Dalga boyu engelin 2/3’ü ile 1,5 katı arasındaysa "eşit" sayıldı; bu sınır şematiktir. Gölgenin koyuluğu ve çubuklar ölçülmüş değer değildir, yalnızca farkı göstermek içindir. Yerden ve binadan yansıma çizilmedi.',
    kaynakNot: 'Kaynak: İşitme Teorileri ve Psikoakustik ders notları (1. ders: dağılma; 2. ve 3. ders: gölge etkisi) ve İşitme ve Denge Sistemleri-2 ders notları (başın etkisi). "Eşit" durumunun ayrıntısı genel akustik kaynaklarından (HyperPhysics, Britannica) eklendi. Çizimler bu notlara bakılarak özgün hazırlandı.',
    duvar: {
      frekanslar: [125, 250, 500, 1000, 2000, 4000],
      baslik: 'Dağılma (difraksiyon)',
      aciklama: 'Dağılma, sesin bir engelle karşılaştığında nasıl ilerlediğini anlatır: ses engelin yanından geçerken yön değiştirir, kırılır, döner ya da doğrudan gider. Sonucu dalga boyunun engelin boyuna oranı belirler. Bas seslerin aynı ortamda bulunmasak bile duyulabilmesinin nedeni budur.',
      engelAdi: 'Duvar yüksekliği',
      buyuk: 'Dalga boyu duvardan büyük: ses duvarın tepesinden dolaşıp azalmadan arkaya geçer; iki tarafta da yaklaşık eşit duyulur.',
      esit: 'Dalga boyu duvarın boyutuna yakın olduğunda kırınım gerçekleşir; duvarın tepesi yeni bir dalga kaynağı gibi davranarak sesi büküp dağıtır ve duvarın arkasında kısmi bir akustik gölge oluşur.',
      kucuk: 'Dalga boyu duvardan küçük: ses duvarı aşamaz; arkada ses gölgesi oluşur, ses diğer tarafa zayıflamış olarak geçer.',
      olcer1: 'Duvarın önünde',
      olcer2: 'Duvarın arkasında',
      kaynak: 'Kaynak',
      duvar: 'Duvar',
      bina: 'Bina',
      golgeEtiket: 'ses gölgesi',
      kismiGolgeEtiket: 'kısmi akustik gölge',
      canvasEtiketi: 'Dağılma animasyonu: soldaki kaynaktan çıkan ses dalgaları bir duvara geliyor, duvarın arkasında bir bina var'
    },
    bas: {
      frekanslar: [250, 500, 1000, 2000, 4000, 8000],
      baslik: 'Başın gölge etkisi',
      aciklama: 'Ses alanında baş akustik bir engel (bariyer) gibi davranır. Dalga boyu başın genişliğinden büyük olan alçak frekanslı sesler başın çevresinden dolaşarak (dağılma, difraksiyon) karşı kulağa rahatça ulaşır. Dalga boyu baştan küçük olan yüksek frekanslı seslerin bir kısmını baş engeller; karşı kulağın çevresinde ses şiddetinin azaldığı bir "gölge" oluşur. Bu nedenle tiz seslerin yönü pes seslere göre daha kolay saptanır.',
      engelAdi: 'Baş genişliği',
      buyuk: 'Dalga boyu başın genişliğinden büyük: ses başın çevresinden dolaşıp karşı kulağa rahatça ulaşır.',
      esit: 'Dalga boyu başın genişliğine yakın olduğunda kırınım gerçekleşir; ses başın çevresinde bükülüp dağılır ve karşı kulakta kısmi bir akustik gölge oluşur.',
      kucuk: 'Dalga boyu başın genişliğinden küçük: baş sesin bir kısmını engeller, karşı kulak gölgede kalır.',
      azalmaAlcak: 'Ders notuna göre alçak frekanslarda karşı kulakta azalma yaklaşık 3–6 dB.',
      azalmaYuksek: 'Ders notuna göre yüksek frekanslarda (1500 Hz ve üstü) karşı kulakta azalma yaklaşık 20 dB veya daha fazla.',
      olcer1: 'Sese yakın kulak (sol)',
      olcer2: 'Karşı kulak (sağ)',
      kaynak: 'Ses kaynağı',
      basEtiket: 'Baş',
      golgeEtiket: 'gölge',
      sacilmaEtiket: 'kırınım',
      canvasEtiketi: 'Baş gölgesi animasyonu: soldaki ses kaynağından çıkan dalgalar üstten görülen başa çarpıyor'
    }
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
    genelGorunum: 'Genel görünüme geç',
    sesCal: 'Sesi çal',
    sesDurdur: 'Sesi durdur',
    sesYok: 'Bu tarayıcı ses çalamıyor.',
    sesNot: 'Ses düzeyini düşük tut. Telefon sessizdeyse ses duyulmayabilir. Bu ses kalibre değildir; işitme testi için kullanılamaz.',
    uyari: 'Hareketler büyütüldü ve yavaşlatıldı. Gerçekte titreşim nanometre düzeyindedir ve saniyede yüzlerce, binlerce kez olur. Öğretim çizimidir, ölçülmüş simülasyon değildir. Pembe: içe itilme, mavi: dışa çekilme, mor: sinirdeki elektriksel sinyal.',
    modIsitme: 'İşitme', modDenge: 'Denge', adimBasligi: 'Adım', yerEtiketi: 'Yer', yakinlastir: 'Yakınlaştır', basiGoster: 'Uzaklaştır', basiGizle: 'Başı gizle', basiGosterAc: 'Başı göster', tumunuOynat: 'Tümünü oynat', tumunuDurdur: 'Duraklat', devamEt: 'Devam et', donSol: 'Başı sola döndür', donSag: 'Başı sağa döndür', basaDon: 'Başa dön', basaDonUzun: 'Görünümü başlangıç hâline döndür',
    dengeUyari: 'Kristaller ve otolit zarının kayması görünsün diye çok büyütüldü; gerçek otokonya mikrometre boyutundadır. Pozlar arası geçiş kısaltıldı; gerçekte her pozisyonda 30–60 saniye beklenir. Hasta sağdan görülüyor, alt kenar yerdir; silik baş pozisyonu gösterir (pembe kulak: sağ kulak), oranı gerçek değildir. Her adımda önce baş döner, sonra görüntü yakınlaşır; otolit zarının kayması görülebilsin diye baş döndükten sonra gösterilir (gerçekte anında olur). Ampullada pembe: kupula ampulladan uzaklaşan yönde bükülüyor; mavi: ters yönde. Makulada pembe: tüy demetleri bükülüyor. Kristallerin arkasındaki sönen iz, son birkaç saniyede kanalda gittikleri yolu gösterir.',
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
      { metin: 'Greenwood D. D. (1990), J Acoust Soc Am 87(6):2592–2605', adres: 'https://doi.org/10.1121/1.399052' },
      { metin: 'Epley J. M. (1992), Otolaryngol Head Neck Surg 107(3):399–404', adres: 'https://doi.org/10.1177/019459989210700310' },
      { metin: 'Bhattacharyya N. ve ark. (2017), BPPV klinik kılavuzu, Otolaryngol Head Neck Surg 156(3 Suppl):S1–S47', adres: 'https://doi.org/10.1177/0194599816689667' }
    ]
  }
};
