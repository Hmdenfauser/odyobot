/* Gorsel3D içerik verisi: bölüm ve yapı adları, açıklamalar, arayüz yazıları.
   Buradaki her metin varsayılandır; yönetici düzenlemesi için uygulamanın editable/applyOv düzenine bağlanmalıdır.
   Klinik metinler proje sahibi tarafından kendi kaynağıyla doğrulanmalıdır.
   2026-11-22 denetimi (kaynağı bulunamayan bilgi yazılmaz): İşitme ve Denge Sistemleri-1 (orta kulak sl. 2–17, iç kulak sl. 5–8),
   İşitme ve Denge Sistemleri-2 (sl. 14–17, 30–41), Vestibüler Sistemin Değerlendirilmesi 1. ders (kanal açıları); StatPearls:
   External Ear (kepçe bölümleri), Geniculate Ganglion ve Facial Nerve (fasiyal sinir, korda timpani). */
window.GORSEL3D_VERI = {
  bolumler: [
    { id: 'tum', ad: 'Tüm sistem', aciklama: 'Kulak kepçesinden iç kulağa bütün periferik yapılar. Ayrıntı için bir bölüm seç ya da bir yapıya dokun.',
      yapilar: ['eac', 'tm', 'mal', 'inc', 'sta', 'ct', 'n7', 'n8', 'sv', 'sm', 'st', 'vest', 'ant', 'post', 'lat', 'crus', 'amp'],
      ek: ['p_helix', 'p_antihelix', 'p_scapha', 'p_fossa', 'p_crush', 'p_cymba', 'p_cavum', 'p_tragus', 'p_antitragus', 'p_notch', 'p_lobule'] },
    { id: 'dis', ad: 'Dış kulak', aciklama: 'Kulak kepçesi ve dış kulak yolu. Kepçenin bölümlerini görmek için kepçeye dokun.',
      yapilar: ['p_helix', 'p_antihelix', 'p_scapha', 'p_fossa', 'p_crush', 'p_cymba', 'p_cavum', 'p_tragus', 'p_antitragus', 'p_notch', 'p_lobule', 'eac'] },
    { id: 'orta', ad: 'Orta kulak', aciklama: 'Timpanik membran (kulak zarı) ve kemikçik zinciri. Titreşim kulak zarından malleus, inkus ve stapes yoluyla oval pencereye iletilir.',
      yapilar: ['tm', 'mal', 'inc', 'sta', 'ct'] },
    { id: 'ic', ad: 'İç kulak', aciklama: 'Koklea (iki skala), vestibül ve üç semisirküler kanal. Model iç kulağın perilenf boşluğunu gösterir.',
      yapilar: ['sv', 'sm', 'st', 'vest', 'ant', 'post', 'lat', 'crus', 'amp'] },
    { id: 'sinir', ad: 'Sinirler', aciklama: 'Fasiyal sinir, vestibulokoklear sinir ve korda timpani.',
      yapilar: ['n7', 'n8', 'ct'] },
    { id: 'cevre', ad: 'Çevre yapılar', aciklama: 'Temporal kemik, internal karotis, sigmoid sinüs ve dura. Kulağın çevresindeki komşuluklar.',
      yapilar: ['car', 'sin', 'bone'] }
  ],
  kepce: { ad: 'Kulak kepçesi', aciklama: 'Aurikula. Sesi toplayıp dış kulak yoluna yönlendirir ve sesin yönünü ayırt etmeye yardım eder. Bölümleri şimdi renkli; birine dokununca açıklaması açılır.' },
  yapilar: {
    eac: { ad: 'Dış kulak yolu', aciklama: 'Konkadan timpanik membrana uzanan kanal; yetişkinde yaklaşık 2,5–3 cm uzunluğunda. Dış üçte biri kıkırdak, iç üçte ikisi kemiktir; aralarındaki açı nedeniyle S biçimindedir ve içe doğru daralır. Modelde kanal içi boş bir tüp olarak gösteriliyor; dış ucundan içine bakınca timpanik membran görünür.' },
    p_helix: { ad: 'Heliks', aciklama: 'Kulak kepçesinin dış kenarını çevreleyen kıvrım. Önde heliks krusu olarak konkanın içine uzanır.' },
    p_antihelix: { ad: 'Antiheliks', aciklama: 'Heliksin iç tarafında ona paralel uzanan kıvrım. Y biçimlidir; yukarıda süperior ve inferior krus olarak ikiye ayrılır.' },
    p_scapha: { ad: 'Skafa', aciklama: 'Heliks ile antiheliks arasındaki uzun oluk.' },
    p_fossa: { ad: 'Triangüler fossa', aciklama: 'Antiheliksin süperior ve inferior krusları ile heliks arasında kalan üçgen çukur.' },
    p_crush: { ad: 'Heliks krusu', aciklama: 'Heliksin konkanın içine uzanan başlangıç parçası. Konkayı üstte simba, altta kavum olarak ikiye böler.' },
    p_cymba: { ad: 'Simba konka', aciklama: 'Konkanın heliks krusunun üstünde kalan üst bölümü.' },
    p_cavum: { ad: 'Kavum konka', aciklama: 'Konkanın alt ve daha derin bölümü. Dış kulak yolu buradan başlar; kulak kalıbı ve kulak içi cihazlar buraya oturur.' },
    p_tragus: { ad: 'Tragus', aciklama: 'Dış kulak yolu girişinin önündeki kıkırdak çıkıntı. Antitragusla birlikte kanal girişini kapatarak kanalı yabancı cisimlerden korur.' },
    p_antitragus: { ad: 'Antitragus', aciklama: 'Tragusun karşısındaki küçük çıkıntı.' },
    p_notch: { ad: 'İntertragik çentik', aciklama: 'Tragus ile antitragus arasındaki çentik (insisura intertragika).' },
    p_lobule: { ad: 'Lobül', aciklama: 'Kulak memesi. Kepçenin kıkırdak içermeyen, yumuşak alt bölümü.' },
    tm: { ad: 'Timpanik membran', aciklama: 'Kulak zarı. Dış kulak yolunun üst duvarıyla yaklaşık 140 derecelik açı yapacak biçimde eğik durur. Malleus sapı zara yapışıktır; malleusun çekmesiyle zarda oluşan çöküntüye umbo denir.' },
    mal: { ad: 'Malleus', aciklama: 'Çekiç; kemikçiklerin en büyüğü. Sapı (manubrium) kulak zarına yapışıktır; başı ve boynu epitimpanumdadır, başı inkusun gövdesiyle eklem yapar.' },
    inc: { ad: 'İnkus', aciklama: 'Örs. Bir gövde ile kısa ve uzun koldan oluşur; gövdesi malleusun başıyla, uzun kolunun ucundaki lentiküler çıkıntı stapesin başıyla eklem yapar.' },
    sta: { ad: 'Stapes', aciklama: 'Üzengi. Başı inkusla eklem yapar; tabanı oval pencereye oturur ve titreşimi iç kulağa aktarır.' },
    sv: { ad: 'Skala vestibuli', aciklama: 'Kokleanın oval pencere tarafındaki perilenf kanalı. Vestibülden başlar, apekste helikotrema ile skala timpaniye bağlanır.' },
    sm: { ad: 'Skala media', aciklama: 'Koklear kanal (duktus koklearis). Skala vestibuli ile skala timpani arasında, endolenf dolu kanal. Bu parça tarama verisi değildir: modelde iki skalanın birleştiği bölmenin dış kenarına, skala vestibuli tarafına çizildi; konumu ve kalınlığı yaklaşıktır. Skala vestibulinin içinde kaldığı için en iyi seçilince görünür.' },
    st: { ad: 'Skala timpani', aciklama: 'Kokleanın yuvarlak pencere tarafındaki perilenf kanalı. Yuvarlak pencere ince bir zarla (sekonder timpanik membran) kapalıdır.' },
    vest: { ad: 'Vestibül', aciklama: 'Koklea ile semisirküler kanallar arasındaki orta boşluk. Utrikulus ve sakkulus burada yer alır; stapes tabanı dış duvarındaki oval pencereye oturur.' },
    ant: { ad: 'Anterior kanal', aciklama: 'Süperior kanal. Dikey kanallardan biri; sagittal düzleme yaklaşık 45 derece açıyla durur. Ampullasız ucu posterior kanalınkiyle ortak krusu oluşturur.' },
    post: { ad: 'Posterior kanal', aciklama: 'İkinci dikey kanal; sagittal düzleme yaklaşık 45 derece açıyla durur. Üç kanal birbirine yaklaşık 90 derece açıyla yerleşir.' },
    lat: { ad: 'Lateral kanal', aciklama: 'Horizontal kanal. Horizontal düzleme yaklaşık 30 derece eğimlidir. Ampullası, süperior kanalınkiyle birlikte orta kulağın üst bölümünün (epitimpanum) iç duvarında çıkıntı yapar.' },
    crus: { ad: 'Ortak krus', aciklama: 'Crus commune. Anterior ve posterior kanalların ampullasız uçlarının birleşerek vestibüle açıldığı ortak bacak.' },
    amp: { ad: 'Ampullalar', aciklama: 'Her semisirküler kanalın vestibüle bağlandığı uçtaki genişlemiş bölüm. İçinde kanalın duyu epiteli (krista ampullaris) bulunur.' },
    n7: { ad: 'Fasiyal sinir', aciklama: 'VII. kranial sinir. İç kulak yolundan girer ve temporal kemikteki fasiyal kanalda ilerler; koklea ile timpanik kavite arasındaki genikulat gangliyon düzeyinde kıvrılır. Fasiyal kanal orta kulağın iç duvarındadır. Sinir stilomastoid delikten kafa tabanını terk eder. Stapedius dalı stapedius kasını uyarır.' },
    n8: { ad: 'VIII. Kranial (Vestibulokoklear) Sinir', etiket: 'VIII. sinir', aciklama: 'Vestibulokoklear sinir. İç kulak yolunda koklear ve vestibüler dallara ayrılarak kokleaya ve vestibüler uç organlara ulaşır.' },
    ct: { ad: 'Korda timpani', aciklama: 'Fasiyal sinirin fasiyal kanal içindeki son dalı; ara sinirin (n. intermedius) uç devamıdır. Orta kulaktan geçer.' },
    car: { ad: 'İnternal karotis', aciklama: 'Arterin temporal kemik içindeki parçası. Orta kulağın ön duvarının alt kısmındaki ince kemik duvar karotis arterini orta kulaktan ayırır.' },
    sin: { ad: 'Sigmoid sinüs ve dura', etiket: 'Sigmoid sinüs', aciklama: 'Venöz sinüs ve onu çevreleyen dura. Temporal kemiğin mastoid parçasının iç yüzündeki sigmoid oluğa yerleşir; burada yalnızca kulağa yakın bölümü gösteriliyor.' },
    bone: { ad: 'Temporal kemik', aciklama: 'Bütün bu yapıları barındıran kemik. Burada kulağa yakın bölümü yarı saydam gösteriliyor.' }
  },
  // Model üzerindeki yazılar (2026-11-21). id: yapı; yazı yapının 'etiket' alanı (yönetici düzenler), yoksa adı.
  // Tüm sistem görünümünde hiç yazı yok (proje sahibinin isteği, 2026-11-21); tum: true verilirse orada da görünür. metin: metinler'den yazı.
  // ilgili: bu yapılardan biri seçiliyken de yazı kalır. kepce: kepçe bölümleri açıkken gizlenir.
  etiketler: [
    { id: 'p_cavum', metin: 'etiketKepce', kepce: true, ilgili: ['p_helix', 'p_antihelix', 'p_scapha', 'p_fossa', 'p_crush', 'p_cymba', 'p_cavum', 'p_tragus', 'p_antitragus', 'p_notch', 'p_lobule'] },
    { id: 'eac' }, { id: 'tm' }, { id: 'mal' }, { id: 'inc' }, { id: 'sta' }, { id: 'ct' },
    { id: 'sv', metin: 'etiketKoklea', ilgili: ['sv', 'sm', 'st'] },
    { id: 'vest' }, { id: 'ant' }, { id: 'post' }, { id: 'lat' },
    { id: 'n7' }, { id: 'n8' },
    { id: 'car' }, { id: 'sin' }
  ],
  metinler: {
    canvasEtiketi: 'Döndürülebilir periferik işitme sistemi modeli',
    taraf: 'Sağ kulak',
    olcek: '10 mm',
    indiriliyor: 'Model indiriliyor (yaklaşık 4 MB)…',
    indirilemedi: 'Model indirilemedi. İnternet bağlantını kontrol edip yeniden dene.',
    yenidenDene: 'Yeniden dene',
    genelGorunum: 'Genel görünüme geç',
    etiketKepce: 'Kepçe',
    etiketKoklea: 'Koklea',
    yazilariGizle: 'Yazıları gizle',
    yazilariGoster: 'Yazıları göster',
    yakinlastir: 'Yakınlaştır',
    uzaklastir: 'Uzaklaştır',
    webglYok: 'Bu cihazda 3D çizim (WebGL) açılamadı. Başka bir tarayıcıda dene.',
    baslatilamadi: '3D sahne başlatılamadı.',
    baglamKayboldu: '3D sahne durdu. Sayfayı yenile.',
    bolumBasligi: 'Bölüm',
    yapilarBasligi: 'Yapılar',
    gorunumBasligi: 'Görünüm',
    gorunumler: { lat: 'Lateralden', med: 'Medialden', ust: 'Üstten', on: 'Önden', arka: 'Arkadan' },
    ipucu: 'Döndür, iki parmakla yakınlaştır, bir yapıya dokun.',
    not: 'Kulak kepçesi başka bir kişinin taramasıdır; dış kulak yolunun dış ucuna hizalandı; kanalın kepçeye bağlanan son yaklaşık 10 mm\'si ve kepçedeki kanal ağzının iç duvarı çizilmiştir, tarama verisi değildir. Skala media da tarama verisi değildir; iki skala arasındaki bölmeye göre yaklaşık olarak çizildi. Kepçenin arka yüzü ölçülmüş veri değildir, ön yüzden yaklaşık 3 mm kalınlık verilerek tamamlandı. Kepçe bölümlerinin sınırları tarama üzerinde elle, iç kulaktaki vestibül, kanal, ampulla ve ortak krus sınırları otomatik ayrıştırmayla çizildi. Hepsi yaklaşıktır.',
    kaynakOnsoz: 'Kaynaklar:',
    kaynaklar: [
      { metin: 'Sieber D. ve ark., OpenEar kütüphanesi, örnek ZETA (CC BY 4.0)', adres: 'https://zenodo.org/records/1473724' },
      { metin: 'Artec 3D kulak taraması (CC BY 3.0)', adres: 'https://www.artec3d.com/3d-models/ear' }
    ],
    degisiklikler: 'Değişiklikler: yapılar anatomik yöne çevrildi; kepçe kırpıldı, yüzde 15 küçültüldü, arka yüzü tamamlandı, bölgelere ayrıldı ve kanala çizilmiş bir ara tüple dikişsiz birleştirildi; dış kulak yolunun iki ucu açıldı; iç kulak sıvı boşluğu bölgelere ayrıldı; skala media yaklaşık olarak çizilip eklendi; kemik ile sinüs ve dura kırpılıp sadeleştirildi; renklendirildi.'
  }
};
