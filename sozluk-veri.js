/* Terimler sözlüğü: temel terimler (2026-11-21).
   - Terimler proje sahibinin ders notlarından seçildi (Google Drive, Gazi Odyoloji 1–4. sınıf): Odyolojide Enstrümantasyon,
     Elektrofizyolojik Testler, İşitme ve Denge Sistemleri-1, Odyolojide Ayırıcı Tanı Testleri, Davranışsal Testler,
     Vestibüler Sistemin Değerlendirilmesi, İşitme Teorileri ve Psikoakustik, İşitme Cihazları-1, İşitsel İmplantlar-1,
     Tinnitus-Hiperakuzi. Açıklamaları Claude kısa ve sade yazdı: TASLAKTIR, proje sahibi kendi kaynağıyla doğrular.
     2026-11-22 denetimi: her açıklama ders notlarıyla (yukarıdaki dersler + Davranışsal Testler 5.–6. hafta, Vestibüler Sistem ve
     Hastalıkları BPPV, VNG, VEMP, vHIT, İşitme Cihazları-1 sinyal işleme ve REM, Tinnitus 1., 4. ve 7. ders) karşılaştırıldı; 57 açıklama
     düzeltildi ya da kaynaktaki bilgiye indirildi.
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
    T('t010', 'Seyrelme', 'Rarefaction', '', 'Ses dalgasında hava parçacıklarının birbirinden uzaklaştığı, basıncın düştüğü evredir. Parçacıkların sıkıştığı evreye yoğunlaşma (kondansasyon) denir. ABR ve ECochG’de uyaranın polaritesi bu iki evreye göre seçilir.'),
    T('t012', 'Ses basıncı düzeyi', 'Sound pressure level', 'dB SPL', 'Ses basıncının, işitilebilen en küçük basınca (20 µPa) göre desibel cinsinden ifadesidir. Fiziksel bir ölçüdür; frekansa göre insan kulağının duyarlılığını hesaba katmaz.'),
    T('t013', 'İşitme düzeyi', 'Hearing level', 'dB HL', 'Belirli bir frekansta normal işiten kişilerin duyabildiği en küçük şiddetin 0 dB kabul edildiği ölçektir (dB HL). Odyogram bu ölçekle çizilir.'),
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
    T('t029', 'Konuşmayı alma eşiği', 'Speech reception threshold', 'SRT', 'Sunulan konuşma materyalinin %50’sinin anlaşılabildiği en düşük şiddettir. Saf ses ortalamasının sağlamasıdır: fark 6 dB ve altı ideal, 7–12 dB kabul edilebilir, 13 dB ve üzeri sorun düşündürür.'),
    T('t030', 'Konuşmayı ayırt etme skoru', 'Speech discrimination score', 'SDS', 'Eşik üstü bir şiddette verilen tek heceli kelimelerin doğru tekrarlanma yüzdesidir. Kelime tanıma skoru (WRS) olarak da anılır.'),
    T('t032', 'Rahatsız edici ses düzeyi', 'Uncomfortable loudness level', 'UCL', 'Sesin rahatsız edici derecede gür algılanmaya başladığı şiddettir (UCL). Koklear ve retrokoklear patolojilerin ayırıcı tanısında kullanılan testlerden biridir.'),
    T('t033', 'Dinamik aralık', 'Dynamic range', 'DR', 'Konuşmayı alma eşiği (SRT) ile rahatsız edici ses düzeyi (UCL) arasındaki aralıktır; uygun dinleme aralığını gösterir. Koklear kayıpta eşik yükselirken UCL değişmeyebilir, böylece dinamik aralık daralır.'),
    T('t034', 'Maskeleme', 'Masking', '', 'Test edilmeyen kulağa gürültü verilerek o kulağın teste katılmasının (karşıya geçişin) engellenmesidir. Ne zaman ve ne kadar gerektiği interaural attenüasyona ve eşiklere göre belirlenir.'),
    T('t035', 'İnteraural attenüasyon', 'Interaural attenuation', 'IA', 'Test kulağına verilen sesin karşı kulağa geçerken kafatasında uğradığı enerji kaybıdır. Kulaklık tipine ve frekansa göre değişir; kemik yolunda çok küçüktür. Maskeleme kararında kullanılır.'),
    T('t036', 'Karşıya geçiş', 'Cross hearing', '', 'Test kulağına verilen sesin kafatası yoluyla karşı kulağa ulaşıp orada duyulmasıdır. Sonuç kulakların gerçek eşiğini yansıtmayan "gölge eğri" olabilir; maskeleme bunu önler.'),
    T('t037', 'Oklüzyon etkisi', 'Occlusion effect', 'OE', 'Dış kulak yolu kapatıldığında kemik yolu seslerinin daha gür duyulmasıdır; alçak frekanslarda belirgindir. Kemik yolu maskelemesinde hesaba katılır; kulak kalıbının kanalı kapatması işitme cihazı kullanıcılarında da oklüzyona yol açar.'),
    T('t038', 'Plato yöntemi', 'Plateau method', '', 'Maskeleme gürültüsü kademeli artırılırken test kulağının eşiğinin artık değişmediği aralığın (plato) bulunmasıdır. Platodaki eşik maskeli gerçek eşik kabul edilir.'),
    T('t039', 'Dar bant gürültü', 'Narrow band noise', 'NBN', 'Belirli bir frekansın çevresindeki dar bir bantta enerji taşıyan gürültüdür. Saf ses odyometrisinde maskeleme gürültüsü olarak kullanılır.'),
    T('t040', 'Geniş bant gürültü', 'Broadband noise', 'BBN', 'Geniş bir frekans aralığında enerji taşıyan gürültüdür (beyaz gürültü buna örnektir).'),
    T('t043', 'İnsert kulaklık', 'Insert earphone', '', 'Dış kulak yoluna köpük uçla yerleştirilen kulaklıktır. İnteraural attenüasyonu kulak üstü kulaklığa göre daha yüksektir ve dış kulak yolunun kapanmasını (kollaps) engeller. ABR’de bütün dalga latanslarını yaklaşık 0,8 ms uzatır.'),
    T('t044', 'Weber testi', 'Weber test', '', 'Diyapazon ya da kemik vibratörü alının veya başın orta hattına konur ve sesin nerede duyulduğu sorulur. İletim tipi kayıpta ses kötü kulakta, sensörinöral kayıpta iyi kulakta duyulma eğilimindedir.'),
    T('t045', 'Rinne testi', 'Rinne test', '', 'Aynı kulakta hava yolu ile kemik yolu işitmeyi karşılaştıran diyapazon testidir. Hava yolu daha iyi duyuluyorsa pozitif (normal ya da sensörinöral), kemik yolu daha iyiyse negatif (iletim tipi) kabul edilir.'),
    T('t046', 'İletim tipi işitme kaybı', 'Conductive hearing loss', '', 'Sesin dış ya da orta kulakta iletilememesinden kaynaklanan kayıptır. Kemik yolu normal, hava yolu düşüktür; hava-kemik aralığı vardır.'),
    T('t047', 'Sensörinöral işitme kaybı', 'Sensorineural hearing loss', 'SNİK', 'İç kulak (koklear) ya da işitme siniri (retrokoklear) kaynaklı kayıptır. Hava ve kemik yolu eşikleri birlikte düşer, anlamlı hava-kemik aralığı yoktur.'),
    T('t048', 'Mikst tip işitme kaybı', 'Mixed hearing loss', '', 'İletim ve sensörinöral bileşenlerin bir arada olduğu kayıptır. Kemik yolu eşikleri düşüktür ve hava yolu ile arasında ayrıca aralık vardır.'),
    T('t049', 'Fonksiyonel işitme kaybı', 'Functional hearing loss', '', 'Organik bir nedenle açıklanamayan, ölçülen eşiklerin gerçek işitmeyi yansıtmadığı durumdur (organik olmayan kayıp). Tipik bulgu, konuşmayı alma eşiğinin saf ses eşiklerinden daha iyi çıkmasıdır.'),
    T('t050', 'Rekrutman', 'Loudness recruitment', '', 'Şiddetteki hafif bir artışla gürlük algısının anormal hızla artmasıdır. Kokleadaki tüylü hücre ve sinir sonlarındaki kayıpta görülür, iletim tipi kayıpta görülmez; koklear patolojiyi düşündürür.'),
    T('t051', 'Dekrutman', 'Decruitment', '', 'Şiddet arttıkça gürlüğün beklenenden yavaş artması ya da hiç artmamasıdır. Retrokoklear patolojiyi düşündürür.'),
    T('t052', 'Kısa artış duyarlılık indeksi', 'Short Increment Sensitivity Index', 'SISI', 'Eşiğin 20 dB üstünde sürekli verilen bir tona eklenen 1 dB’lik kısa artışlardan (20 artış) kaçının fark edildiğini ölçen testtir (Jerger ve ark. 1959). Normal kulak bu artışları fark edemez. %70’in üstü koklear patoloji için pozitiftir; koklear bileşeni olmayan retrokoklear patolojide skor %0’dır.'),
    T('t053', 'Değişimli binaural gürlük dengeleme', 'Alternate Binaural Loudness Balance', 'ABLB', 'Tek taraflı kayıpta iki kulağa sırayla ton verilip eşit gürlükte duyulan şiddetlerin karşılaştırıldığı testtir. Rekrutman ya da dekrutmanı göstermek için kullanılır.'),

    /* ---- Pediatrik davranışsal testler ---- */
    T('t054', 'Davranış gözlem odyometrisi', 'Behavioral observation audiometry', 'BOA', 'Bebeğin sese verdiği kendiliğinden tepkilerin (irkilme, göz kırpma, emmede değişme gibi) gözlendiği testtir. Yaklaşık 0–4 aylık bebeklerde kullanılır; kesin eşik vermez.'),
    T('t055', 'Görsel pekiştireçli odyometri', 'Visual Reinforcement Audiometry', 'VRA', 'Çocuğun sese başını çevirmesinin ışıklı ya da hareketli bir oyuncakla ödüllendirildiği (koşullandırıldığı) testtir. Ders notlarında 5–36 ay arası çocuklar için verilir.'),
    T('t056', 'Oyun odyometrisi', 'Conditioned play audiometry', 'CPA', 'Çocuğa sesi duyunca bir oyun hareketi yapması (ör. tahtaya çubuk geçirme, blok dizme) öğretilerek eşiklerin belirlendiği testtir. 24 ay ve üzeri çocuklarda kullanılır.'),

    /* ---- İmmitansmetri ---- */
    T('t057', 'Timpanometri', 'Tympanometry', '', 'Dış kulak yolundaki basınç değiştirilirken kulak zarı ve orta kulak sisteminin ses enerjisini iletme kolaylığının (admitans) ölçülmesidir. Sonuç timpanogram olarak çizilir.'),
    T('t058', 'Timpanogram tipleri', 'Tympanogram types', '', 'Jerger sınıflaması: Tip A normal; Tip As tepe basık (ör. otoskleroz); Tip Ad tepe çok yüksek (ör. kemikçik zincirinde kopukluk, gevşek zar); Tip B düz, tepe yok (ör. orta kulakta sıvı; kanal hacmi büyükse perforasyon ya da tüp); Tip C tepe negatif basınçta (Östaki borusu disfonksiyonu). Sınır değerler kaynağa göre değişir.'),
    T('t059', 'Statik kompliyans', 'Static compliance', '', 'Timpanogramın tepe yüksekliğidir; orta kulak sisteminin hareketliliğini gösterir. Ders notlarında normal aralık 0,39–1,30 cc’dir; 0,35 cc’nin altı Tip As, 1,30 cc’nin üstü Tip Ad olarak sınıflanır.'),
    T('t060', 'Kanal hacmi', 'Ear canal volume', 'ECV', 'Prob ile kulak zarı arasındaki hacimdir. Düz bir timpanogramın nedenini ayırt etmeye yarar: prob tıkandığında hacim düşük, perforasyonda çok yüksektir.'),
    T('t061', 'Akustik refleks', 'Acoustic reflex', 'AR', 'Yüksek şiddetli sese karşı stapedius kasının kasılarak orta kulak sistemini sertleştirmesidir; iki kulakta birden oluşur. İpsilateral ve kontralateral olarak ölçülür; refleks arkı boyunca (orta kulak, koklea, VIII. sinir, beyin sapı, VII. sinir) bilgi verir.'),
    T('t064', 'Östaki borusu disfonksiyonu', 'Eustachian tube dysfunction', 'ETD', 'Östaki borusunun orta kulak ile kulak kanalı arasındaki basıncı eşitleyememesidir. Timpanometride negatif basınçta tepe (Tip C) görülür; efüzyonlu otitis medianın erken döneminde de görülür.'),

    /* ---- Elektrofizyoloji ve OAE ---- */
    T('t065', 'İşitsel uyarılmış potansiyeller', 'Auditory evoked potentials', 'AEP', 'Sesle uyarılan işitme yolunun ürettiği elektriksel yanıtlardır; kafaya yerleştirilen elektrotlarla kaydedilir. Latanslarına göre erken (ECochG, ABR), orta (MLR, 10–100 ms) ve geç (50 ms sonrası kortikal yanıtlar, CAEP, P300) olarak gruplanır.'),
    T('t066', 'İşitsel beyin sapı yanıtı', 'Auditory Brainstem Response', 'ABR', 'İşitme siniri ve beyin sapından kaydedilen dalgalardır (I–V). I. dalga işitme sinirinin distalinden, II. proksimalinden, III. koklear çekirdekten, IV. süperior olivar kompleksten, V. lateral lemniskus ve inferior kolikulustan kaynaklanır. Eşik tahmini ve retrokoklear değerlendirmede kullanılır.'),
    T('t067', 'Latans', 'Latency', '', 'Uyarandan bir dalganın tepesine kadar geçen süredir (ms). Uyaran şiddeti azaldıkça latans uzar, genlik azalır.'),
    T('t068', 'Dalgalar arası latans', 'Interpeak latency', 'IPL', 'ABR’de iki dalganın tepeleri arasındaki süredir (I–III, III–V yaklaşık 2 ms; I–V yaklaşık 4 ms). I–III uzaması posterior fossa patolojisini, III–V uzaması beyin sapı lezyonunu düşündürür.'),
    T('t069', 'Elektrokokleografi', 'Electrocochleography', 'ECochG', 'Koklea ve işitme sinirinin ilk yanıtlarının (koklear mikrofonik, sumasyon potansiyeli, aksiyon potansiyeli) kaydedildiği testtir. Özellikle endolenfatik hidrops değerlendirmesinde kullanılır.'),
    T('t070', 'SP/AP oranı', 'Summating potential / action potential ratio', 'SP/AP', 'ECochG’de sumasyon potansiyelinin aksiyon potansiyeline oranıdır. Oranın artması endolenfatik hidrops bulgusu olarak kabul edilir.'),
    T('t071', 'Koklear mikrofonik', 'Cochlear microphonic', 'CM', 'Kokleadaki tüylü hücrelerin uyaranın dalga biçimini izleyen elektriksel yanıtıdır; en çok kokleanın bazalindeki dış tüylü hücrelerden kaynaklanır. Uyaran polaritesi değişince yanıt da tersine döner (ayna görüntüsü); işitsel nöropati değerlendirmesinde önemlidir.'),
    T('t072', 'İşitsel durağan durum yanıtı', 'Auditory Steady State Response', 'ASSR', 'Genliği ve/veya frekansı belirli sıklıkta değiştirilmiş (modüle edilmiş) tonlara işitme sisteminin verdiği ritmik yanıttır. Frekansa özgü uyaranlarla eşik tahmini sağlar.'),
    T('t074', 'Geç latans yanıtı', 'Auditory Late Response', 'ALR', 'Uyarandan 50 ms’den sonra ortaya çıkan kortikal yanıtlardır (P1 yaklaşık 50 ms, N1 80–100 ms, ardından P2). Kortikal işitsel uyarılmış potansiyel (CAEP) olarak da anılır.'),
    T('t075', 'P300', 'P300 response', 'P300', 'Sık verilen uyaranlar arasına seyrek (farklı) bir uyaran eklenerek (oddball) kaydedilen yanıttır; seyrek uyarandan sonra 250–500 ms aralığında ortaya çıkar. MMN’den farklı olarak kişinin uyarana dikkat edip seyrek uyaranları belirlemesi istenir.'),
    T('t076', 'Eşleşmeyen negatiflik', 'Mismatch negativity', 'MMN', 'Standart uyaranlar arasında seyrek ve farklı (deviant) bir uyaran verildiğinde, uyarandan yaklaşık 150–250 ms sonra ortaya çıkan negatif dalgadır. Dikkat gerektirmez; bu yüzden yenidoğan ve küçük çocuklarda kullanılabilir.'),
    T('t078', 'Otoakustik emisyon', 'Otoacoustic emission', 'OAE', 'Kokleada dış tüylü hücrelerin aktif hareketiyle üretilen ve dış kulak yolundaki hassas mikrofonla ölçülen zayıf seslerdir. Sinir iletiminden bağımsızdır (prenöral); tarama ve koklear işlev değerlendirmesinde kullanılır.'),
    T('t079', 'Geçici uyarılmış otoakustik emisyon', 'Transient evoked otoacoustic emission', 'TEOAE', 'Klik gibi kısa bir uyarana kokleanın verdiği emisyondur. Geniş bir frekans aralığında genel bilgi verir.'),
    T('t080', 'Distorsiyon ürünü otoakustik emisyon', 'Distortion product otoacoustic emission', 'DPOAE', 'İki farklı frekanstaki tonun (f1, f2) aynı anda verilmesiyle kokleanın ürettiği, en çok 2f1–f2 frekansında ölçülen emisyondur. Frekansa özgü bilgi verir (DP-gram).'),
    T('t082', 'İşitsel nöropati spektrum bozukluğu', 'Auditory neuropathy spectrum disorder', 'ANSD', 'OAE ve koklear mikrofoniğin elde edildiği (dış tüylü hücreler çalışıyor), ancak ABR’de V. dalganın elde edilmediği ya da dalga morfolojisinin bozuk olduğu durumdur. Sorun iç tüylü hücre, sinaps ya da işitme sinirindedir.'),

    /* ---- Anatomi ve fizyoloji ---- */
    T('t083', 'Koklea', 'Cochlea', '', 'İç kulağın salyangoz biçimli işitme bölümüdür. İçinde skala vestibuli, skala media ve skala timpani bulunur; sesi sinir sinyaline dönüştüren Corti organını taşır.'),
    T('t084', 'Corti organı', 'Organ of Corti', '', 'Baziler membranın üzerinde yer alan, iç ve dış tüylü hücrelerle destek hücrelerinden oluşan duyu organıdır. Mekanik titreşimi elektriksel sinyale dönüştürür.'),
    T('t085', 'Baziler membran', 'Basilar membrane', '', 'Skala media ile skala timpaniyi ayıran zardır. Tabanda dar ve sert, tepede geniş ve gevşektir; bu yüzden yüksek frekanslar tabanda, düşük frekanslar tepede en büyük titreşimi yapar.'),
    T('t086', 'Tektoryal membran', 'Tectorial membrane', '', 'Spiral laminanın vestibüler dudağına tutunup Corti organının üstünü örten jelatinimsi zardır. Dış tüylü hücrelerin en uzun stereosilyaları bu zarla temastadır; iç tüylü hücrelerinkiler değmez.'),
    T('t087', 'Dış tüylü hücre', 'Outer hair cell', 'DTH', 'Corti organında üç sıra hâlinde dizilen hücrelerdir. Boy değiştirerek (elektromotilite) zayıf sesleri güçlendirir ve frekans seçiciliğini keskinleştirir; OAE’lerin kaynağıdır.'),
    T('t088', 'İç tüylü hücre', 'Inner hair cell', 'İTH', 'Corti organında tek sıra hâlinde dizilen asıl duyusal hücrelerdir. İşitme siniri liflerinin büyük çoğunluğu bu hücrelerle bağlantı kurar.'),
    T('t090', 'Endolenf', 'Endolymph', '', 'Zar labirentin (skala media, kanallar, utrikulus, sakkulus) içindeki sıvıdır. Potasyum oranı yüksek, sodyum oranı düşüktür; stria vaskülaristeki kapillerlerde üretilir.'),
    T('t091', 'Perilenf', 'Perilymph', '', 'Kemik labirent ile zar labirent arasındaki (skala vestibuli ve skala timpanideki) sıvıdır. Sodyumdan zengindir, beyin omurilik sıvısına benzer.'),
    T('t092', 'Stria vaskülaris', 'Stria vascularis', '', 'Skala medianın dış duvarında, spiral ligamentin iç tarafındaki dokudur. Marjinal hücreleri endolenfteki yüksek potasyum, düşük sodyum düzeyini sağlar; endolenf buradaki kapillerlerde üretilir.'),
    T('t093', 'Oval pencere', 'Oval window', '', 'Orta kulak ile iç kulak arasındaki, stapes tabanının oturduğu açıklıktır. Stapesin titreşimi buradan perilenfe aktarılır.'),
    T('t094', 'Yuvarlak pencere', 'Round window', '', 'Skala timpaninin orta kulağa bakan, zarla kapalı açıklığıdır. Oval pencere içe itilince dışa doğru esneyerek sıvının hareket etmesine izin verir.'),
    T('t095', 'Kemikçik zinciri', 'Ossicular chain', '', 'Orta kulaktaki malleus (çekiç), inkus (örs) ve stapes (üzengi) kemikçikleridir. Kulak zarının titreşimini oval pencereye iletir ve havadan sıvıya geçişteki enerji kaybını azaltır.'),
    T('t096', 'Kulak zarı', 'Tympanic membrane', 'KZ', 'Dış kulak yolunu orta kulaktan ayıran ince zardır. Sesle titreşir ve bu titreşimi malleusa aktarır.'),
    T('t097', 'Koklear nükleus', 'Cochlear nucleus', 'CN', 'İşitme siniri liflerinin beyin sapında ilk sinaps yaptığı çekirdektir. Anteroventral, posteroventral ve dorsal bölümleri vardır.'),
    T('t098', 'Süperior oliver kompleks', 'Superior olivary complex', 'SOC', 'Beyin sapında iki kulaktan gelen bilginin ilk kez birleştiği çekirdekler grubudur. Ses yönünün belirlenmesinde ve akustik refleks arkında rol alır.'),
    T('t100', 'İnferior kollikulus', 'Inferior colliculus', 'IC', 'Orta beyindeki iki taraflı işitsel çekirdektir. Çıkan yolda zorunlu sinaps istasyonudur: lateral lemniskustan gelen liflerin neredeyse tamamı burada sonlanır. ABR V. dalgasının negatif kısmı buradan kaynaklanır.'),
    T('t103', 'Tonotopi', 'Tonotopy', '', 'İşitme sisteminde her frekansın belirli bir yerde temsil edilmesidir. Baziler membranda yüksek frekanslar tabanda, alçak frekanslar tepededir; koklear çekirdek ve süperior olivar kompleks de tonotopik düzenlidir.'),

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
    T('t113', 'Kanalolitiazis', 'Canalolithiasis', '', 'BPPV’de otokonilerin kanal içinde serbest hâlde bulunup endolenfle birlikte hareket ederek kupulayı bükmesidir (Epley). En sık görülen biçimdir; en sık posterior kanalda olur.'),
    T('t114', 'Kupulolitiazis', 'Cupulolithiasis', '', 'BPPV’de otokonilerin kupulaya yapışarak onu ağırlaştırması ve yerçekimine duyarlı hâle getirmesidir. Baş pozisyonu sürdükçe uyarım devam eder; latent periyot ve yorulma (fatigue) görülmez.'),
    T('t115', 'Dix-Hallpike testi', 'Dix-Hallpike maneuver', '', 'Vertikal (posterior ve anterior) kanal BPPV’sini değerlendirmek için yapılan pozisyon testidir. Baş test tarafına 45° çevrilir, hasta sırtüstü yatırılıp baş yaklaşık 30° ekstansiyona getirilir ve nistagmus gözlenir. Sağ posterior kanal kanalitiazisinde sağ Dix-Hallpike’ta yukarı vuran (torsiyonel bileşenli) nistagmus görülür.'),
    T('t116', 'Epley manevrası', 'Epley maneuver', '', 'Posterior kanal kanalitiazisinde otokonileri kanaldan utrikulusa geri taşımak için uygulanan pozisyon dizisidir (kanalit repozisyon manevrası; Epley 1992). Pozisyonlar arasında en az 60 saniye ya da belirtiler geçene kadar beklenir.'),
    T('t117', 'Videonistagmografi', 'Videonystagmography', 'VNG', 'Göz hareketlerinin kızılötesi ışıkla aydınlatılan gözlükle kaydedildiği vestibüler test bataryasıdır; kalorik test de bu batarya içinde yapılır.'),
    T('t118', 'Kalorik test', 'Caloric test', '', 'Dış kulak yoluna sıcak ve soğuk su ya da hava verilerek iki taraftaki horizontal semisirküler kanalın ayrı ayrı uyarıldığı testtir (su 44° ve 30°, hava 50° ve 24°). Yanıt nistagmusun yavaş faz hızıyla ölçülür ve Jongkees formülleriyle (kanal parezisi, yön üstünlüğü) yorumlanır.'),
    T('t119', 'Kanal parezisi', 'Canal paresis', 'CP', 'Kalorik testte iki tarafın yanıtları arasındaki farkın belirgin olmasıdır (tek taraflı zayıflık). Ders notlarında patolojik sınır %20–25’in üstüdür.'),
    T('t120', 'Yön üstünlüğü', 'Directional preponderance', 'DP', 'Kalorik testte aynı yöne vuran nistagmusların diğer yöne göre belirgin güçlü olmasıdır. Ders notlarında patolojik sınır %26–30’un üstüdür.'),
    T('t121', 'Video baş itme testi', 'Video Head Impulse Test', 'vHIT', 'Başa küçük, hızlı ve beklenmedik itmeler verilirken göz hareketlerinin kaydedildiği testtir. Altı semisirküler kanalı değerlendirebilir; kalorik testten farklı olarak yalnızca horizontal kanallarla sınırlı değildir.'),
    T('t123', 'Servikal VEMP', 'Cervical vestibular evoked myogenic potential', 'cVEMP', 'Yüksek şiddetli sesle sakkulusun uyarılmasıyla aynı taraf sternokleidomastoid kasından kaydedilen yanıttır (p13–n23); kasın kasılmasında inhibisyon olur. Yol: sakkulus, alt vestibüler sinir, lateral vestibüler çekirdek, XI. sinir ve sternokleidomastoid kası.'),
    T('t124', 'Oküler VEMP', 'Ocular vestibular evoked myogenic potential', 'oVEMP', 'Göz altından kaydedilen miyojenik yanıttır. Utrikulus, üst vestibüler sinir ve refleks yolu hakkında bilgi verir.'),

    /* ---- İşitme cihazları ---- */
    T('t129', 'Kazanç', 'Gain', '', 'İşitme cihazının çıkış düzeyi ile giriş düzeyi arasındaki desibel farkıdır. Kazancın frekansa göre değişimine frekans-kazanç cevabı denir.'),
    T('t131', 'Amplitüd kompresyonu', 'Amplitude compression', '', 'Giriş şiddetine bağlı olarak farklı miktarda kazanç uygulanmasıdır. Ses yüksekliği konforunu aşan çıkışı sınırlamak (sıkıştırma sınırlaması) ya da sesleri kişinin dinamik aralığına yerleştirmek (WDRC) için kullanılır.'),
    T('t132', 'Geniş dinamik aralık sıkıştırma', 'Wide Dynamic Range Compression', 'WDRC', 'Düşük seslere daha fazla, yüksek seslere daha az kazanç uygulayan sıkıştırmadır (WDRC). Güçlendirilmiş sesleri, dinamik aralığı daralmış (sensörinöral kayıplı) kişinin dinamik aralığına yerleştirmeyi amaçlar.'),
    T('t133', 'Diz noktası', 'Kneepoint', 'TK', 'Kompresörün sıkıştırma eşiğidir (kırılma noktası, knee point); sıkıştırmanın başladığı giriş düzeyidir.'),
    T('t134', 'Kompresyon oranı', 'Compression ratio', 'CR', 'Kırılma noktasının üstünde giriş düzeyindeki değişimin çıkıştaki değişime oranıdır. Örneğin 10 dB’lik giriş artışı çıkışta 5 dB artış oluyorsa oran 2:1, 3,3 dB oluyorsa 3:1’dir.'),
    T('t138', 'Gerçek kulak ölçümü', 'Real ear measurement', 'REM', 'İşitme cihazının kişinin kendi kulak kanalındaki çıkışının prob mikrofonla ölçülmesidir (REM). Yazılımın oluşturduğu kazanç hedefine ulaşılıp ulaşılmadığını kulak kanalında doğrular.'),

    /* ---- İşitsel implantlar ---- */
    T('t143', 'Koklear implant', 'Cochlear implant', 'Kİ', 'Sesi elektrik sinyaline çevirip kokleaya yerleştirilen elektrot dizisiyle işitme sinirini doğrudan uyaran cihazdır. Adaylık için genellikle uzun süreli ileri derecede işitme kaybı ve yüksek kazançlı işitme cihazından yeterli yarar görmeme öyküsü vardır.'),
    T('t144', 'Kemiğe implante işitme cihazı', 'Bone-anchored hearing aid', 'BAHA', 'Sesi kafatası kemiği üzerinden titreşimle iç kulağa ileten, osseointegrasyon ilkesine dayanan cihazdır. Adaylıkta hava-kemik aralığı (yaklaşık 30–35 dB üzeri) ve kemik yolu eşikleri dikkate alınır.'),
    T('t146', 'İşitsel beyin sapı implantı', 'Auditory brainstem implant', 'ABI', 'İşitme siniri kullanılamadığında elektrotları beyin sapına yerleştirilen implanttır. Nörofibromatozis tip 2 (iki taraflı vestibüler schwannom) için geliştirilmiştir; koklear ya da koklear sinir aplazisi gibi iç kulak malformasyonlarında da kullanılır.'),

    /* ---- Tinnitus ve ses toleransı ---- */
    T('t147', 'Tinnitus (çınlama)', 'Tinnitus', '', 'Dışarıdan bir uyaran olmaksızın ses algılanmasıdır; fantom bir algıdır. Tek tonlu, çok tonlu ya da gürültü biçiminde tarif edilebilir.'),
    T('t148', 'Hiperakuzi', 'Hyperacusis', '', 'Normal günlük seslere karşı yaşanan aşırı duyarlılıktır. Mizofoniden farklı olarak işitsel ve limbik yapılar arasındaki bağlantılar normaldir.'),
    T('t149', 'Mizofoni', 'Misophonia', '', 'İşitsel sistemde anormal bir aktivasyon olmadan, limbik ve otonom sinir sisteminin belirli seslere anormal tepki göstermesidir. İşitme eşikleriyle ilişkisi yoktur.'),
    T('t151', 'Tinnitus yeniden eğitim terapisi', 'Tinnitus Retraining Therapy', 'TRT', 'Tinnitusun nörofizyolojik modeline dayanan terapidir. Hastanın bilgilendirilmesiyle tinnitusa yönelik olumsuz düşünce ve tepkileri azaltıp tinnitusa alışmasını (habituasyon) amaçlar.')
  ];
})();
