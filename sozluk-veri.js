/* Terimler sözlüğü: temel terimler (2026-11-21).
   - Terimler proje sahibinin ders notlarından seçildi (Google Drive, Gazi Odyoloji 1–4. sınıf): Odyolojide Enstrümantasyon,
     Elektrofizyolojik Testler, İşitme ve Denge Sistemleri-1, Odyolojide Ayırıcı Tanı Testleri, Davranışsal Testler,
     Vestibüler Sistemin Değerlendirilmesi, İşitme Teorileri ve Psikoakustik, İşitme Cihazları-1, İşitsel İmplantlar-1,
     Tinnitus-Hiperakuzi. Açıklamaları Claude kısa ve sade yazdı: TASLAKTIR, proje sahibi kendi kaynağıyla doğrular.
   - Yönetici her terimi uygulamadan düzenleyebilir ya da silebilir (sozluk.js): düzenleme Firestore 'sozluk/<kimlik>'
     belgesine yazılır ve bu listedeki metnin yerine geçer; silme 'icerik/sozluk-gizli.<kimlik>' ile gizler.
   - Kimlikler (t001…) değiştirilmez: öğrenme durumu ve yönetici düzenlemeleri bu kimliklere bağlıdır. */
(function () {
  function T(id, tr, en, kisaltma, aciklama) { return { id: id, tr: tr, en: en || '', kisaltma: kisaltma || '', aciklama: aciklama }; }
  window.SOZLUK_TEMEL = [
    /* ---- Ses ve psikoakustik ---- */
    T('t001', 'Frekans', 'Frequency', 'Hz', 'Bir saniyedeki titreşim (döngü) sayısıdır, birimi hertz (Hz). Algıda büyük ölçüde perdeye karşılık gelir. Odyometride genellikle 125–8000 Hz arası test edilir.'),
    T('t002', 'Dalga boyu', 'Wavelength', 'λ', 'Ses dalgasının bir tam döngüde aldığı yoldur. Ses hızının frekansa bölünmesiyle bulunur: frekans arttıkça dalga boyu kısalır.'),
    T('t006', 'Kırınım (dağılma)', 'Diffraction', '', 'Sesin bir engelin kenarından dolaşarak arkasına geçmesidir. Dalga boyu engele göre büyükse (düşük frekans) ses engelin çevresinden kolayca dolaşır; küçükse (yüksek frekans) engelin arkasında akustik gölge oluşur.'),
    T('t010', 'Seyrelme', 'Rarefaction', '', 'Ses dalgasında hava parçacıklarının birbirinden uzaklaştığı, basıncın düştüğü evredir. Parçacıkların sıkıştığı evreye yoğunlaşma (kondansasyon) denir. ABR ve VEMP’te uyaranın polaritesi bu iki evreye göre seçilir.'),
    T('t012', 'Ses basıncı düzeyi', 'Sound pressure level', 'dB SPL', 'Ses basıncının, işitilebilen en küçük basınca (20 µPa) göre desibel cinsinden ifadesidir. Fiziksel bir ölçüdür; frekansa göre insan kulağının duyarlılığını hesaba katmaz.'),
    T('t013', 'İşitme düzeyi', 'Hearing level', 'dB HL', 'Her frekansta normal işiten genç yetişkinlerin ortalama eşiğinin 0 dB kabul edildiği ölçektir. Odyogram bu ölçekle çizilir.'),
    T('t014', 'Duyum düzeyi', 'Sensation level', 'dB SL', 'Bir sesin, o kişinin o sese ait eşiğinin kaç dB üstünde olduğunu gösterir. Örneğin eşiği 30 dB HL olan kişiye 70 dB HL verilen ses 40 dB SL’dir.'),
    T('t015', 'Gürlük', 'Loudness', '', 'Sesin şiddetinin öznel (algısal) karşılığıdır. Fiziksel şiddetle birlikte artar ama doğrusal değildir ve frekansa göre değişir.'),
    T('t018', 'Perde', 'Pitch', '', 'Sesin ince ya da kalın algılanmasıdır. Daha çok frekansa bağlıdır, ama şiddetten de bir miktar etkilenir.'),
    T('t019', 'Tını', 'Timbre', '', 'Aynı perde ve gürlükteki iki sesi birbirinden ayırmamızı sağlayan niteliktir (ör. keman ile flüt). Harmoniklere ve sesin zaman içindeki değişimine bağlıdır.'),
    T('t023', 'Baş gölgesi etkisi', 'Head shadow effect', '', 'Başın, karşı taraftan gelen yüksek frekanslı sesleri engelleyerek uzak kulakta şiddeti azaltmasıdır. Dalga boyu başa göre kısa olan seslerde belirgindir.'),

    /* ---- Odyometri ---- */
    T('t024', 'Saf ses odyometrisi', 'Pure tone audiometry', '', 'Farklı frekanslardaki saf seslerle hava ve kemik yolu işitme eşiklerinin belirlendiği temel işitme testidir. Sonuç odyograma işlenir.'),
    T('t025', 'Hava yolu', 'Air conduction', '', 'Sesin dış kulak, orta kulak ve iç kulak yoluyla iletilmesidir. Kulaklıkla ölçülür; bütün işitme yolunu değerlendirir.'),
    T('t026', 'Kemik yolu', 'Bone conduction', '', 'Sesin kafatası kemiklerini titreştirerek doğrudan iç kulağa iletilmesidir. Kemik vibratörüyle ölçülür; dış ve orta kulağı büyük ölçüde atlar.'),
    T('t027', 'Hava-kemik aralığı', 'Air-bone gap', 'ABG', 'Aynı frekanstaki hava yolu ve kemik yolu eşikleri arasındaki farktır. Belirgin bir aralık iletim bileşenini düşündürür. Anlamlı sayılan fark kaynağa göre değişir (uygulamada 10 dB kullanılıyor).'),
    T('t028', 'Saf ses ortalaması', 'Pure tone average', 'PTA', 'Seçilen frekanslardaki hava yolu eşiklerinin ortalamasıdır (genellikle 500, 1000, 2000 Hz; bazı kaynaklarda 4000 Hz de eklenir). İşitme kaybının derecesini belirlemede kullanılır.'),
    T('t029', 'Konuşmayı alma eşiği', 'Speech reception threshold', 'SRT', 'İki heceli kelimelerin yaklaşık yarısının doğru tekrarlanabildiği en düşük şiddettir. Saf ses ortalamasıyla uyumlu olması beklenir; uyumsuzluk sonuçların güvenilirliğini sorgulatır.'),
    T('t030', 'Konuşmayı ayırt etme skoru', 'Speech discrimination score', 'SDS', 'Eşik üstü bir şiddette verilen tek heceli kelimelerin doğru tekrarlanma yüzdesidir. Kelime tanıma skoru (WRS) olarak da anılır.'),
    T('t032', 'Rahatsız edici ses düzeyi', 'Uncomfortable loudness level', 'UCL', 'Sesin rahatsız edici derecede gür algılanmaya başladığı şiddettir. LDL ya da ULL olarak da anılır. İşitme cihazı çıkışını sınırlamada ve hiperakuzi değerlendirmesinde kullanılır.'),
    T('t033', 'Dinamik aralık', 'Dynamic range', 'DR', 'İşitme eşiği ile rahatsız edici ses düzeyi arasındaki aralıktır. Koklear işitme kayıplarında daralır; işitme cihazı ayarında önemlidir.'),
    T('t034', 'Maskeleme', 'Masking', '', 'Test edilmeyen kulağa gürültü verilerek o kulağın teste katılmasının (karşıya geçişin) engellenmesidir. Ne zaman ve ne kadar gerektiği interaural attenüasyona ve eşiklere göre belirlenir.'),
    T('t035', 'İnteraural attenüasyon', 'Interaural attenuation', 'IA', 'Test kulağına verilen sesin karşı kulağa geçerken kafatasında uğradığı enerji kaybıdır. Kulaklık tipine ve frekansa göre değişir; kemik yolunda çok küçüktür. Maskeleme kararında kullanılır.'),
    T('t036', 'Karşıya geçiş', 'Cross hearing', '', 'Test kulağına verilen sesin kafatası yoluyla karşı kulağa ulaşıp orada duyulmasıdır. Sonuç kulakların gerçek eşiğini yansıtmayan "gölge eğri" olabilir; maskeleme bunu önler.'),
    T('t037', 'Oklüzyon etkisi', 'Occlusion effect', 'OE', 'Dış kulak yolu kapatıldığında düşük frekanslarda kemik yolu seslerin daha gür duyulmasıdır. Kemik yolu maskelemesinde ve işitme cihazı kullanıcılarının kendi seslerini boğuk duymasında önemlidir.'),
    T('t038', 'Plato yöntemi', 'Plateau method', '', 'Maskeleme gürültüsü kademeli artırılırken test kulağının eşiğinin artık değişmediği aralığın (plato) bulunmasıdır. Platodaki eşik maskeli gerçek eşik kabul edilir.'),
    T('t039', 'Dar bant gürültü', 'Narrow band noise', 'NBN', 'Belirli bir frekansın çevresindeki dar bir bantta enerji taşıyan gürültüdür. Saf ses odyometrisinde maskeleme gürültüsü olarak kullanılır.'),
    T('t040', 'Geniş bant gürültü', 'Broadband noise', 'BBN', 'Geniş bir frekans aralığında enerji taşıyan gürültüdür (beyaz gürültü buna örnektir). Akustik refleks uyaranı ve bazı testlerde kullanılır.'),
    T('t043', 'İnsert kulaklık', 'Insert earphone', '', 'Dış kulak yoluna köpük uçla yerleştirilen kulaklıktır. İnteraural attenüasyonu supra-aural kulaklığa göre daha yüksektir; kanal kollapsını önler.'),
    T('t044', 'Weber testi', 'Weber test', '', 'Diyapazon ya da kemik vibratörü alının veya başın orta hattına konur ve sesin nerede duyulduğu sorulur. İletim tipi kayıpta ses kötü kulakta, sensörinöral kayıpta iyi kulakta duyulma eğilimindedir.'),
    T('t045', 'Rinne testi', 'Rinne test', '', 'Aynı kulakta hava yolu ile kemik yolu işitmeyi karşılaştıran diyapazon testidir. Hava yolu daha iyi duyuluyorsa pozitif (normal ya da sensörinöral), kemik yolu daha iyiyse negatif (iletim tipi) kabul edilir.'),
    T('t046', 'İletim tipi işitme kaybı', 'Conductive hearing loss', '', 'Sesin dış ya da orta kulakta iletilememesinden kaynaklanan kayıptır. Kemik yolu normal, hava yolu düşüktür; hava-kemik aralığı vardır.'),
    T('t047', 'Sensörinöral işitme kaybı', 'Sensorineural hearing loss', 'SNİK', 'İç kulak (koklear) ya da işitme siniri (retrokoklear) kaynaklı kayıptır. Hava ve kemik yolu eşikleri birlikte düşer, anlamlı hava-kemik aralığı yoktur.'),
    T('t048', 'Mikst tip işitme kaybı', 'Mixed hearing loss', '', 'İletim ve sensörinöral bileşenlerin bir arada olduğu kayıptır. Kemik yolu eşikleri düşüktür ve hava yolu ile arasında ayrıca aralık vardır.'),
    T('t049', 'Fonksiyonel işitme kaybı', 'Functional hearing loss', '', 'Organik bir nedenle açıklanamayan, ölçülen eşiklerin gerçek işitmeyi yansıtmadığı durumdur (non-organik kayıp). SRT–PTA uyumsuzluğu ve objektif testlerle (OAE, ABR, refleks) çapraz kontrol yapılır.'),
    T('t050', 'Rekrutman', 'Loudness recruitment', '', 'Koklear işitme kaybında, eşiğin üstünde gürlüğün normalden çok daha hızlı artmasıdır. Dış tüylü hücre kaybıyla ilişkilidir; dinamik aralık daralır. Hiperakuziyle karıştırılmamalıdır.'),
    T('t051', 'Dekrutman', 'Decruitment', '', 'Şiddet arttıkça gürlüğün beklenenden yavaş artması ya da azalmasıdır. Retrokoklear patolojiyi düşündürür.'),
    T('t052', 'Kısa artış duyarlılık indeksi', 'Short Increment Sensitivity Index', 'SISI', 'Eşik üstünde sürekli verilen bir tona eklenen 1 dB’lik kısa artışların kaç tanesinin fark edildiğini ölçen testtir. Yüksek skor koklear patolojiyi düşündürür; koklear bileşeni olmayan retrokoklear patolojide skor çok düşüktür.'),
    T('t053', 'Değişimli binaural gürlük dengeleme', 'Alternate Binaural Loudness Balance', 'ABLB', 'Tek taraflı kayıpta iki kulağa sırayla ton verilip eşit gürlükte duyulan şiddetlerin karşılaştırıldığı testtir. Rekrutman ya da dekrutmanı göstermek için kullanılır.'),

    /* ---- Pediatrik davranışsal testler ---- */
    T('t054', 'Davranış gözlem odyometrisi', 'Behavioral observation audiometry', 'BOA', 'Bebeğin sese verdiği kendiliğinden tepkilerin (irkilme, göz kırpma, emmede değişme gibi) gözlendiği testtir. Kesin eşik vermez; sonuç yanıt düzeyi olarak yorumlanır.'),
    T('t055', 'Görsel pekiştireçli odyometri', 'Visual Reinforcement Audiometry', 'VRA', 'Çocuğun sese başını çevirmesinin ışıklı ya da hareketli bir oyuncakla ödüllendirildiği (koşullandırıldığı) testtir. Genellikle yaklaşık 6 ay–2,5 yaş arasında uygulanır.'),
    T('t056', 'Oyun odyometrisi', 'Conditioned play audiometry', 'CPA', 'Çocuğa sesi duyunca bir oyun hareketi yapması (ör. halkayı çubuğa takma) öğretilerek eşiklerin belirlendiği testtir. Genellikle okul öncesi yaşta kullanılır.'),

    /* ---- İmmitansmetri ---- */
    T('t057', 'Timpanometri', 'Tympanometry', '', 'Dış kulak yolundaki basınç değiştirilirken kulak zarı ve orta kulak sisteminin ses enerjisini iletme kolaylığının (admitans) ölçülmesidir. Sonuç timpanogram olarak çizilir.'),
    T('t058', 'Timpanogram tipleri', 'Tympanogram types', '', 'Jerger sınıflaması: Tip A normal; Tip As tepe basık (ör. otoskleroz); Tip Ad tepe çok yüksek (ör. kemikçik zincirinde kopukluk, gevşek zar); Tip B düz, tepe yok (ör. orta kulakta sıvı; kanal hacmi büyükse perforasyon ya da tüp); Tip C tepe negatif basınçta (Östaki borusu disfonksiyonu). Sınır değerler kaynağa göre değişir.'),
    T('t059', 'Statik kompliyans', 'Static compliance', '', 'Timpanogramın tepe yüksekliğidir; orta kulak sisteminin en kolay titreştiği andaki hareketliliğini gösterir (ml ya da mmho). Düşük değer sertliği, yüksek değer aşırı gevşekliği düşündürür.'),
    T('t060', 'Kanal hacmi', 'Ear canal volume', 'ECV', 'Prob ile kulak zarı arasındaki eşdeğer hacimdir. Düz bir timpanogramda büyük hacim perforasyonu ya da açık tüpü, küçük hacim buşon ya da probun duvara dayanmasını düşündürür.'),
    T('t061', 'Akustik refleks', 'Acoustic reflex', 'AR', 'Yüksek şiddetli sese karşı stapes kasının kasılarak orta kulak sistemini sertleştirmesidir. İpsilateral ve kontralateral olarak ölçülür; refleks arkı boyunca (orta kulak, koklea, VIII. sinir, beyin sapı, VII. sinir) bilgi verir.'),
    T('t064', 'Östaki borusu disfonksiyonu', 'Eustachian tube dysfunction', 'ETD', 'Östaki borusunun orta kulağı havalandıramamasıdır. Orta kulakta negatif basınç (Tip C timpanogram) ve zamanla sıvı birikimine yol açabilir.'),

    /* ---- Elektrofizyoloji ve OAE ---- */
    T('t065', 'İşitsel uyarılmış potansiyeller', 'Auditory evoked potentials', 'AEP', 'Sesle uyarılan işitme yolunun ürettiği elektriksel yanıtlardır; kafaya yerleştirilen elektrotlarla kaydedilir. Latanslarına göre erken (ECochG, ABR), orta (AMLR) ve geç (ALR, P300) olarak gruplanır.'),
    T('t066', 'İşitsel beyin sapı yanıtı', 'Auditory Brainstem Response', 'ABR', 'Uyarandan sonraki ilk yaklaşık 10 ms içinde işitme siniri ve beyin sapından kaydedilen dalgalardır (I–V). Eşik tahmini ve retrokoklear değerlendirmede kullanılır. BERA, BAEP olarak da anılır.'),
    T('t067', 'Latans', 'Latency', '', 'Uyarandan bir dalganın tepesine kadar geçen süredir (ms). Uyaran şiddeti azaldıkça latans uzar, genlik azalır.'),
    T('t068', 'Dalgalar arası latans', 'Interpeak latency', 'IPL', 'ABR’de iki dalganın tepeleri arasındaki süredir (I–III, III–V, I–V). Uzaması işitme siniri ya da beyin sapı iletiminde gecikmeyi düşündürür.'),
    T('t069', 'Elektrokokleografi', 'Electrocochleography', 'ECochG', 'Koklea ve işitme sinirinin ilk yanıtlarının (koklear mikrofonik, sumasyon potansiyeli, aksiyon potansiyeli) kaydedildiği testtir. Özellikle endolenfatik hidrops değerlendirmesinde kullanılır.'),
    T('t070', 'SP/AP oranı', 'Summating potential / action potential ratio', 'SP/AP', 'ECochG’de sumasyon potansiyelinin aksiyon potansiyeline oranıdır. Oranın artması endolenfatik hidrops bulgusu olarak kabul edilir.'),
    T('t071', 'Koklear mikrofonik', 'Cochlear microphonic', 'CM', 'Kokleadaki tüylü hücrelerin (ağırlıklı olarak dış tüylü hücrelerin) uyaranın dalga biçimini izleyen elektriksel yanıtıdır. Uyaran polaritesi değişince yanıt da tersine döner; işitsel nöropati değerlendirmesinde önemlidir.'),
    T('t072', 'İşitsel durağan durum yanıtı', 'Auditory Steady State Response', 'ASSR', 'Genlik ve/veya frekans modülasyonlu tonlara beynin modülasyon hızını izleyen sürekli yanıtıdır. Frekansa özgü eşik tahmini sağlar; yanıt istatistiksel olarak otomatik belirlenir.'),
    T('t074', 'Geç latans yanıtı', 'Auditory Late Response', 'ALR', 'Uyarandan yaklaşık 100–300 ms sonra ortaya çıkan kortikal yanıtlardır (P1, N1, P2). Kortikal işitsel uyarılmış potansiyel (CAEP) olarak da anılır.'),
    T('t075', 'P300', 'P300 response', 'P300', 'Sık verilen uyaranlar arasına seyrek (farklı) bir uyaran eklendiğinde, yaklaşık 300 ms civarında ortaya çıkan pozitif dalgadır. Dikkat ve bilişsel işlemlemeyle ilişkilidir; olaya bağlı bir potansiyeldir.'),
    T('t076', 'Eşleşmeyen negatiflik', 'Mismatch negativity', 'MMN', 'Bir dizi standart uyaran içinde farklı (deviant) bir uyaran verildiğinde ortaya çıkan negatif dalgadır. Dikkat gerektirmeden işitsel ayırt etmeyi yansıtır.'),
    T('t078', 'Otoakustik emisyon', 'Otoacoustic emission', 'OAE', 'Kokleada dış tüylü hücrelerin aktif hareketiyle üretilen ve dış kulak yolundaki hassas mikrofonla ölçülen zayıf seslerdir. Sinir iletiminden bağımsızdır (prenöral); tarama ve koklear işlev değerlendirmesinde kullanılır.'),
    T('t079', 'Geçici uyarılmış otoakustik emisyon', 'Transient evoked otoacoustic emission', 'TEOAE', 'Klik gibi kısa bir uyarana kokleanın verdiği emisyondur. Geniş bir frekans aralığında genel bilgi verir.'),
    T('t080', 'Distorsiyon ürünü otoakustik emisyon', 'Distortion product otoacoustic emission', 'DPOAE', 'İki farklı frekanstaki tonun (f1, f2) aynı anda verilmesiyle kokleanın ürettiği, en çok 2f1–f2 frekansında ölçülen emisyondur. Frekansa özgü bilgi verir (DP-gram).'),
    T('t082', 'İşitsel nöropati spektrum bozukluğu', 'Auditory neuropathy spectrum disorder', 'ANSD', 'OAE ve/veya koklear mikrofoniğin elde edildiği (dış tüylü hücreler çalışıyor), ancak ABR’nin yok ya da çok bozuk olduğu durumdur. Sorun iç tüylü hücre, sinaps ya da işitme sinirindedir.'),

    /* ---- Anatomi ve fizyoloji ---- */
    T('t083', 'Koklea', 'Cochlea', '', 'İç kulağın salyangoz biçimli işitme bölümüdür. İçinde skala vestibuli, skala media ve skala timpani bulunur; sesi sinir sinyaline dönüştüren Corti organını taşır.'),
    T('t084', 'Corti organı', 'Organ of Corti', '', 'Baziler membranın üzerinde yer alan, iç ve dış tüylü hücrelerle destek hücrelerinden oluşan duyu organıdır. Mekanik titreşimi elektriksel sinyale dönüştürür.'),
    T('t085', 'Baziler membran', 'Basilar membrane', '', 'Skala media ile skala timpaniyi ayıran zardır. Tabanda dar ve sert, tepede geniş ve gevşektir; bu yüzden yüksek frekanslar tabanda, düşük frekanslar tepede en büyük titreşimi yapar.'),
    T('t086', 'Tektoryal membran', 'Tectorial membrane', '', 'Corti organının üstünü örten jelatinimsi zardır. Dış tüylü hücrelerin stereosilyaları bu zara gömülüdür; baziler membran titreşince tüyler bükülür.'),
    T('t087', 'Dış tüylü hücre', 'Outer hair cell', 'DTH', 'Corti organında üç sıra hâlinde dizilen hücrelerdir. Boy değiştirerek (elektromotilite) zayıf sesleri güçlendirir ve frekans seçiciliğini keskinleştirir; OAE’lerin kaynağıdır.'),
    T('t088', 'İç tüylü hücre', 'Inner hair cell', 'İTH', 'Corti organında tek sıra hâlinde dizilen asıl duyusal hücrelerdir. İşitme siniri liflerinin büyük çoğunluğu bu hücrelerle bağlantı kurar.'),
    T('t090', 'Endolenf', 'Endolymph', '', 'Zar labirentin (skala media, kanallar, utrikulus, sakkulus) içindeki sıvıdır. Potasyumdan zengindir; stria vaskülaris tarafından üretilir.'),
    T('t091', 'Perilenf', 'Perilymph', '', 'Kemik labirent ile zar labirent arasındaki (skala vestibuli ve skala timpanideki) sıvıdır. Sodyumdan zengindir, beyin omurilik sıvısına benzer.'),
    T('t092', 'Stria vaskülaris', 'Stria vascularis', '', 'Skala medianın dış duvarındaki damardan zengin dokudur. Endolenfi üretir ve kokleanın elektriksel potansiyelini (endokoklear potansiyel) sağlar.'),
    T('t093', 'Oval pencere', 'Oval window', '', 'Orta kulak ile iç kulak arasındaki, stapes tabanının oturduğu açıklıktır. Stapesin titreşimi buradan perilenfe aktarılır.'),
    T('t094', 'Yuvarlak pencere', 'Round window', '', 'Skala timpaninin orta kulağa bakan, zarla kapalı açıklığıdır. Oval pencere içe itilince dışa doğru esneyerek sıvının hareket etmesine izin verir.'),
    T('t095', 'Kemikçik zinciri', 'Ossicular chain', '', 'Orta kulaktaki malleus (çekiç), inkus (örs) ve stapes (üzengi) kemikçikleridir. Kulak zarının titreşimini oval pencereye iletir ve havadan sıvıya geçişteki enerji kaybını azaltır.'),
    T('t096', 'Kulak zarı', 'Tympanic membrane', 'KZ', 'Dış kulak yolunu orta kulaktan ayıran ince zardır. Sesle titreşir ve bu titreşimi malleusa aktarır.'),
    T('t097', 'Koklear nükleus', 'Cochlear nucleus', 'CN', 'İşitme siniri liflerinin beyin sapında ilk sinaps yaptığı çekirdektir. Anteroventral, posteroventral ve dorsal bölümleri vardır.'),
    T('t098', 'Süperior oliver kompleks', 'Superior olivary complex', 'SOC', 'Beyin sapında iki kulaktan gelen bilginin ilk kez birleştiği çekirdekler grubudur. Ses yönünün belirlenmesinde ve akustik refleks arkında rol alır.'),
    T('t100', 'İnferior kollikulus', 'Inferior colliculus', 'IC', 'Orta beyindeki büyük işitsel çekirdektir. Yükselen yolların neredeyse tamamı burada sinaps yapar; ABR V. dalgasının bu bölgeye yakın yapılardan kaynaklandığı kabul edilir.'),
    T('t103', 'Tonotopi', 'Tonotopy', '', 'İşitme sisteminde her frekansın belirli bir yerde temsil edilmesidir. Baziler membrandan işitsel kortekse kadar bütün basamaklarda korunur.'),

    /* ---- Vestibüler sistem ---- */
    T('t104', 'Semisirküler kanallar', 'Semicircular canals', 'SSK', 'Birbirine yaklaşık dik üç kanaldır (anterior, posterior, lateral). Başın dönme (açısal) hareketlerini algılar.'),
    T('t105', 'Ampulla', 'Ampulla', '', 'Her semisirküler kanalın bir ucundaki şişkinliktir. İçinde dönme hareketini algılayan krista ampullaris ve kupula bulunur.'),
    T('t106', 'Kupula', 'Cupula', '', 'Ampulladaki tüylü hücrelerin üstünü örten jelatinimsi yapıdır. Baş dönünce endolenfin akışıyla bükülür ve tüylü hücreleri uyarır.'),
    T('t107', 'Utrikulus', 'Utricle', '', 'Otolit organlarından biridir. Makulası yataya yakın durur; daha çok yatay düzlemdeki doğrusal hızlanmayı ve baş eğimini algılar.'),
    T('t108', 'Sakkulus', 'Saccule', '', 'Otolit organlarından biridir. Makulası dikeye yakın durur; daha çok dikey doğrusal hızlanmayı ve yerçekimini algılar. cVEMP ile değerlendirilir.'),
    T('t109', 'Otokoni', 'Otoconia', '', 'Utrikulus ve sakkulus makulasındaki zarın üstünde bulunan kalsiyum karbonat kristalleridir (otolitler). Zarı ağırlaştırarak doğrusal hareket ve yerçekimine duyarlılık sağlar.'),
    T('t110', 'Vestibülo-oküler refleks', 'Vestibulo-ocular reflex', 'VOR', 'Baş hareket ederken gözlerin ters yöne aynı hızda dönerek görüntüyü retinada sabit tutmasını sağlayan reflekstir.'),
    T('t111', 'Nistagmus', 'Nystagmus', '', 'Gözlerin istemsiz, ritmik hareketidir. Vestibüler nistagmusta yavaş bir kayma ve onu izleyen hızlı bir düzeltme fazı vardır; yön hızlı faza göre adlandırılır.'),
    T('t112', 'Benign paroksismal pozisyonel vertigo', 'Benign paroxysmal positional vertigo', 'BPPV', 'Utrikulustan kopan otokonilerin bir semisirküler kanala (en sık posterior) girmesiyle baş pozisyonu değişince ortaya çıkan kısa süreli baş dönmesidir. Manevralarla tedavi edilir.'),
    T('t113', 'Kanalolitiazis', 'Canalolithiasis', '', 'BPPV’de otokonilerin kanal içinde serbestçe dolaşmasıdır. Nistagmus kısa bir gecikmeyle başlar ve genellikle bir dakikadan kısa sürer.'),
    T('t114', 'Kupulolitiazis', 'Cupulolithiasis', '', 'BPPV’de otokonilerin kupulaya yapışarak onu ağırlaştırmasıdır. Nistagmus genellikle gecikmesiz başlar ve pozisyon sürdükçe devam eder.'),
    T('t115', 'Dix-Hallpike testi', 'Dix-Hallpike maneuver', '', 'Posterior (ve anterior) kanal BPPV’sini tanımak için yapılan pozisyon testidir. Baş 45° test tarafına çevrilir, hasta hızla sırtüstü yatırılıp baş hafif sarkıtılır ve nistagmus gözlenir.'),
    T('t116', 'Epley manevrası', 'Epley maneuver', '', 'Posterior kanal BPPV’sinde otokonileri kanaldan utrikulusa geri taşımak için uygulanan pozisyon dizisidir (kanalith repozisyon manevrası).'),
    T('t117', 'Videonistagmografi', 'Videonystagmography', 'VNG', 'Göz hareketlerinin kızılötesi kamerayla kaydedildiği vestibüler test bataryasıdır. Spontan ve pozisyonel nistagmus, okülomotor testler ve kalorik test içerir.'),
    T('t118', 'Kalorik test', 'Caloric test', '', 'Dış kulak yoluna sıcak ve soğuk su ya da hava verilerek lateral semisirküler kanalın her iki tarafta ayrı ayrı uyarıldığı testtir. Sonuç Jongkees formülleriyle (kanal parezisi, yön üstünlüğü) yorumlanır.'),
    T('t119', 'Kanal parezisi', 'Canal paresis', 'CP', 'Kalorik testte bir tarafın yanıtının diğerine göre belirgin zayıf olmasıdır (tek taraflı zayıflık). Ders notlarında sınır yaklaşık %20–25 olarak geçer; kaynağa göre değişir.'),
    T('t120', 'Yön üstünlüğü', 'Directional preponderance', 'DP', 'Kalorik testte nistagmusun bir yöne diğerinden belirgin daha güçlü olmasıdır. Ders notlarında sınır yaklaşık %25–30 olarak geçer; kaynağa göre değişir.'),
    T('t121', 'Video baş itme testi', 'Video Head Impulse Test', 'vHIT', 'Başa küçük, hızlı ve beklenmedik itmeler verilirken göz hareketlerinin kaydedildiği testtir. Altı semisirküler kanalın her birinin VOR kazancını ayrı ayrı ölçer.'),
    T('t123', 'Servikal VEMP', 'Cervical vestibular evoked myogenic potential', 'cVEMP', 'Yüksek şiddetli sesle sakkulusun uyarılmasıyla aynı taraf sternokleidomastoid kasından kaydedilen inhibitör yanıttır (p13–n23). Sakkulus ve alt vestibüler sinir işlevini değerlendirir.'),
    T('t124', 'Oküler VEMP', 'Ocular vestibular evoked myogenic potential', 'oVEMP', 'Uyarana karşı taraf göz altı kaslarından kaydedilen eksitatör yanıttır. Ağırlıklı olarak utrikulus ve üst vestibüler sinir işlevini değerlendirir.'),

    /* ---- İşitme cihazları ---- */
    T('t129', 'Kazanç', 'Gain', '', 'İşitme cihazının çıkışı ile girişi arasındaki farktır (dB). Örneğin 60 dB SPL giriş, 90 dB SPL çıkış veriyorsa kazanç 30 dB’dir.'),
    T('t131', 'Amplitüd kompresyonu', 'Amplitude compression', '', 'Giriş şiddeti arttıkça kazancın azaltıldığı yükseltmedir. Geniş bir ses aralığını kişinin daralmış dinamik aralığına sığdırmayı amaçlar.'),
    T('t132', 'Geniş dinamik aralık sıkıştırma', 'Wide Dynamic Range Compression', 'WDRC', 'Sıkıştırmanın düşük bir eşikten itibaren başladığı kompresyon türüdür. Zayıf sesler daha çok, gür sesler daha az yükseltilir.'),
    T('t133', 'Diz noktası', 'Kneepoint', 'TK', 'Kompresyonun başladığı giriş düzeyidir (sıkıştırma eşiği). Giriş-çıkış eğrisinin eğiminin değiştiği noktadır.'),
    T('t134', 'Kompresyon oranı', 'Compression ratio', 'CR', 'Diz noktasının üstünde giriş düzeyindeki değişimin çıkıştaki değişime oranıdır. Örneğin 2:1 oranında girişteki 10 dB artış çıkışta 5 dB artış olarak yansır.'),
    T('t138', 'Gerçek kulak ölçümü', 'Real ear measurement', 'REM', 'Kulak zarına yakın yerleştirilen prob mikrofonla işitme cihazının kişinin kendi kulak yolundaki çıkışının ölçülmesidir. Cihaz ayarının hedefe uygunluğunu doğrular.'),

    /* ---- İşitsel implantlar ---- */
    T('t143', 'Koklear implant', 'Cochlear implant', 'Kİ', 'Sesi elektrik sinyaline çevirip kokleaya yerleştirilen elektrot dizisiyle işitme sinirini doğrudan uyaran cihazdır. İşitme cihazından yeterli yarar görmeyen ileri–çok ileri sensörinöral kayıplarda kullanılır.'),
    T('t144', 'Kemiğe implante işitme cihazı', 'Bone-anchored hearing aid', 'BAHA', 'Sesi kafatası kemiği üzerinden titreşimle doğrudan iç kulağa ileten cihazdır. İletim tipi ve mikst kayıplarda ve tek taraflı sağırlıkta kullanılır.'),
    T('t146', 'İşitsel beyin sapı implantı', 'Auditory brainstem implant', 'ABI', 'İşitme siniri işlev görmediğinde (ör. nörofibromatozis tip 2, koklea ya da sinir yokluğu) elektrotları doğrudan beyin sapındaki koklear nükleus bölgesine yerleştirilen implanttır.'),

    /* ---- Tinnitus ve ses toleransı ---- */
    T('t147', 'Tinnitus (çınlama)', 'Tinnitus', '', 'Dışarıda bir ses kaynağı olmadan kulakta ya da başta ses duyulmasıdır. Tek tonlu, çok tonlu ya da gürültü biçiminde tarif edilebilir; işitme kaybı başta olmak üzere birçok durumla ilişkili olabilir.'),
    T('t148', 'Hiperakuzi', 'Hyperacusis', '', 'Çoğu kişinin rahatsız olmadığı günlük seslere karşı aşırı duyarlılıktır. İşitme kaybı olsun ya da olmasın görülebilir; rekrutmanla karıştırılmamalıdır.'),
    T('t149', 'Mizofoni', 'Misophonia', '', 'Belirli seslere (ör. çiğneme, nefes alma) karşı öfke, iğrenme gibi güçlü olumsuz duygusal tepkilerdir. Sesin şiddetinden çok anlamıyla ilişkilidir.'),
    T('t151', 'Tinnitus yeniden eğitim terapisi', 'Tinnitus Retraining Therapy', 'TRT', 'Danışmanlık ve ses terapisini birleştirerek kişinin tinnitusa alışmasını (habituasyon) amaçlayan tedavi yaklaşımıdır.')
  ];
})();
