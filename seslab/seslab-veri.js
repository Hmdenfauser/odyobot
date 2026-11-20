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
      aciklama: 'Kulak kepçesi sesi toplar. Ses dalgası dış kulak yolunda ilerler ve timpanik membranı titreştirir. Titreşim malleus, inkus ve stapes ile oval pencereye taşınır. Stapes tabanı perilenfi iter; koklea içinde bazalden apekse doğru ilerleyen bir dalga oluşur.',
      yapilar: ['pinna', 'eac', 'tm', 'mal', 'inc', 'sta', 'sm', 'n8'], yari: ['sv', 'st', 'vest'], cerceve: ['pinna', 'eac', 'tm', 'mal', 'inc', 'sta', 'sv', 'st', 'vest'], gorunum: 'on', enerji: [1, 2, 3, 4] },
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
    utrikulus: { ad: 'Utrikulus (makula)', aciklama: 'Otolit organı. Makulası baş dikken yaklaşık yataydır; başın eğilmesini ve öne-arkaya, yana doğrusal hızlanmayı algılar. Otolit kristalleri genellikle buradan kopar. Modelde ayrı parça değildir; yeri ve büyüklüğü yaklaşık çizildi.' },
    sakkulus: { ad: 'Sakkulus (makula)', aciklama: 'Otolit organı. Makulası baş dikken yaklaşık dikeydir; yukarı-aşağı doğrusal hızlanmayı ve yerçekimini algılar. Modelde ayrı parça değildir; yeri ve büyüklüğü yaklaşık çizildi.' },
    pinna: { ad: 'Kulak kepçesi', aciklama: 'Aurikula. Sesi toplayıp dış kulak yoluna yönlendirir, bazı frekansları biraz güçlendirir ve sesin yönünü (özellikle önde/arkada, yukarıda/aşağıda) ayırt etmeye yardım eder.' }
  },
  /* Denge kipi. poz (derece): govde = gövdenin yatması (−90 sırtüstü, −110 sırtüstü + baş 20° sarkık),
     donus = başın sağa (+) / sola (−) dönüşü, egim = çene göğse (+), yan = başın sağ omza (+) eğilmesi.
     ikon/kisa: küçük tuştaki simge (emoji) ve kısa yazı (2026-11-20).
     ivme: doğrusal hızlanma, g biriminde, dünya eksenlerinde ([0, 0, 0.5] = ileri). sifirla: kristaller başa döner.
     Klinik metinler taslaktır; proje sahibi kendi kaynağıyla doğrulayacak. */
  denge: {
    sahneler: [
      { id: 'makula', tip: 'makula', ad: 'Otolit organları', ikon: '🪨', kisa: 'Otolit',
        aciklama: 'Utrikulus ve sakkulusun makulasında tüy hücrelerinin üstünde jel bir zar, onun üstünde de kalsiyum karbonat kristalleri (otokonya) bulunur. Kristaller zarı ağırlaştırır. Baş eğilince ya da doğrusal hızlanmada zar kayar ve tüy hücrelerinin tüycüklerini büker. Utrikulus daha çok yatay, sakkulus dikey yöndeki hareketi algılar.',
        yapilar: ['utrikulus', 'sakkulus', 'bas'], yari: ['vest', 'ant', 'post', 'lat', 'crus', 'amp'], cerceve: ['utrikulus', 'sakkulus'],
        adimlar: [
          { id: 'dik', ad: 'Baş dik', ikon: '🧍', kisa: 'Dik', poz: {}, aciklama: 'Utrikulus yatay olduğu için zarı kaymaz. Sakkulus dikey olduğu için zarı yerçekimiyle aşağı çekilir; dik dururken yerçekimini sakkulus algılar.' },
          { id: 'one', ad: 'Baş öne eğik', ikon: '🙇', kisa: 'Öne', poz: { egim: 30 }, aciklama: 'Baş öne eğilince utrikulustaki zar öne doğru kayar ve tüy demetleri bükülür. Beyin bu bükülmeden başın eğildiğini anlar.' },
          { id: 'sag', ad: 'Baş sağa eğik', ikon: '↘️', kisa: 'Sağa', poz: { yan: 30 }, aciklama: 'Baş sağ omza eğilince utrikulustaki zar sağa (dışa) doğru kayar.' },
          { id: 'ivme', ad: 'İleri hızlanma', ikon: '🏃', kisa: 'İvme', poz: {}, ivme: [0, 0, 0.5], aciklama: 'Baş dikken ileri doğru hızlanınca zar eylemsizlikle geride kalır, yani geriye kayar. Bu, başın geriye eğilmesindekiyle aynı bükülmedir; beyin ikisini ayırmak için görme ve diğer duyulardan da yararlanır.' }
        ] },
      { id: 'bppv', tip: 'bppv', ad: 'BPPV ve Epley', ikon: '🌀', kisa: 'BPPV–Epley',
        aciklama: 'Benign paroksismal pozisyonel vertigo (BPPV): utrikulustan kopan otolit kristalleri bir semisirküler kanala, en sık posterior kanala düşer (kanalolitiyazis). Baş pozisyonu değişince kristaller kanalda kayar, endolenfi sürükler ve kupulayı büker; kısa süreli baş dönmesi ve nistagmus olur. Burada sağ posterior kanal BPPV\'si, Dix-Hallpike testi ve Epley manevrası gösteriliyor.',
        yapilar: ['kristal', 'bas'], yari: ['post', 'amp', 'vest', 'ant', 'lat', 'crus'], cerceve: ['post', 'vest', 'ant', 'lat'],
        adimlar: [
          { id: 'basla', ad: 'Başlangıç: oturur', ikon: '🪑', kisa: 'Başla', poz: {}, sifirla: true, aciklama: 'Kopmuş kristaller sağ posterior kanalda, ampullaya yakın en alçak kısımda birikmiş. Baş dik ve hareketsizken kupula itilmez, baş dönmesi olmaz.' },
          { id: 'dix', ad: 'Dix-Hallpike (sağ)', ikon: '🛏️', kisa: 'Dix-H.', poz: { govde: -110, donus: 45 }, aciklama: 'Baş sağa 45° çevrilir, hasta sırtüstü yatırılır ve baş yatak düzeyinin yaklaşık 20° altına sarkıtılır. Kristaller ampulladan uzaklaşarak kanalın en alçak noktasına kayar; kupula ampulladan uzaklaşan yönde bükülür (ampullofugal, posterior kanalda uyarıcı). Kısa bir gecikmeden sonra yukarı vuran, torsiyonel bileşenli (üst kutbu alttaki kulağa dönen) nistagmus ve baş dönmesi olur; genellikle 1 dakikadan kısa sürer.' },
          { id: 'e2', ad: 'Epley 2: baş sola', ikon: '⬅️', kisa: 'Epley 2', poz: { govde: -110, donus: -45 }, aciklama: 'Baş sarkık kalırken yavaşça 90° sola çevrilir. Kristaller kanal boyunca ilerlemeye devam eder. Her pozisyonda baş dönmesi ve nistagmus geçene kadar (genellikle 30–60 saniye) beklenir.' },
          { id: 'e3', ad: 'Epley 3: sol yana', ikon: '🔃', kisa: 'Epley 3', poz: { govde: -90, donus: -135 }, aciklama: 'Hasta sol yanına döner ve baş 90° daha çevrilir; yüz yaklaşık 45° aşağı, yere bakar. Kristaller kanalın tepesini aşıp krus kommune yoluyla utrikulusa geçer.' },
          { id: 'e4', ad: 'Epley 4: oturma', ikon: '🪑', kisa: 'Epley 4', poz: { egim: 20, donus: -45 }, aciklama: 'Hasta baş solda kalarak oturtulur, sonra baş hafifçe öne eğilir. Kristaller utrikulusta kalır ve artık posterior kanalı uyarmaz.' },
          { id: 'son', ad: 'Sonuç: oturur', ikon: '✅', kisa: 'Sonuç', poz: {}, aciklama: 'Baş düz, kristaller utrikulusta. Manevranın etkisi Dix-Hallpike testi tekrarlanarak kontrol edilebilir.' }
        ] }
    ]
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
    modIsitme: 'İşitme', modDenge: 'Denge', adimBasligi: 'Adım', yerEtiketi: 'Yer', yakinlastir: 'Yakınlaştır', basiGoster: 'Başı göster', tumunuOynat: 'Tümünü oynat', tumunuDurdur: 'Durdur', donSol: 'Başı sola döndür', donSag: 'Başı sağa döndür', basaDon: 'Başa dön', basaDonUzun: 'Görünümü başlangıç hâline döndür',
    dengeUyari: 'Kristaller ve otolit zarının kayması görünsün diye çok büyütüldü; gerçek otokonya mikrometre boyutundadır. Pozlar arası geçiş kısaltıldı; gerçekte her pozisyonda 30–60 saniye beklenir. Hasta sağdan görülüyor, alt kenar yerdir; silik baş pozisyonu gösterir (pembe kulak: sağ kulak), oranı gerçek değildir. Her adımda önce baş döner, sonra görüntü yakınlaşır; otolit zarının kayması görülebilsin diye baş döndükten sonra gösterilir (gerçekte anında olur). Ampullada pembe: kupula ampulladan uzaklaşan yönde bükülüyor; mavi: ters yönde. Makulada pembe: tüy demetleri bükülüyor.',
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
