/* Vestibüler manevralar: yazılar (Kütüphane → Ders notları → "Vestibüler Manevralar"). 2026-11-26.
   Her not yönetici tarafından düzenlenebilir (anahtar icerik/man.<id>; alanlar t, p ve her çeşit için a_<çeşit>).
   Adım satırları "kısa ad | açıklama | gerçek bekleme süresi" biçimindedir; satır sayısı manevra-hesap.js'teki adım sayısıyla aynıdır.
   Kural (proje sahibi, 2026-11-26): kaynaklar çeliştiğinde kitaba uyulur; manevra sonrası önerilere ders notu da eklenir;
   Epley'de bekleme 30 sn–1 dk, kupulolitiaziste 2–3 dk aralık olarak yazılır.
   Kaynaklar (cümle başına):
   [K]  Odyolojide Özel Durumlar, "Vestibüler Sistem Bozuklukları: Değerlendirme, Tanı ve Rehabilitasyon Yaklaşımları", s. 458–460, 465–469
   [DN] Vestibüler Sistem ve Hastalıkları, BPPV (Dr. Ody. B. Kabiş, 2023; sl. 19–33); Aksoy ve Kabiş, Temel Vestibüler Rehabilitasyon (2020)
   [YB] Vestibüler Sistemin Değerlendirilmesi, yatak başı testler (sl. 25–35) ve VNG (sl. 23, 29)
   [EW] İşitme ve Denge Sistemleri-2, periferik vestibüler sistem (sl. 41: Ewald yasaları)
   [AAO] Bhattacharyya ve ark., AAO-HNS BPPV klinik uygulama kılavuzu (2017)
   [BA] von Brevern ve ark., Bárány Derneği BPPV tanı ölçütleri (J Vestib Res 2015)
   [CH] Choung ve ark., bow and lean test (Laryngoscope 2006)
   [GU] Gufoni manevrası: AAO-HNS 2017 tablosu; Otolaryngol Clin North Am 2012 (şekil); sistematik derlemeler 2023 ve 2024
   [YA] Yacovino ve ark. (J Neurol 2009); Utah Üniversitesi özeti; Bhandari ve ark. 3D benzetim (Front Neurol 2021) */
(function () {
  'use strict';
  window.MANEVRA_VERI = {
    grup: 'Vestibüler Manevralar',
    sira: ['dix-hallpike', 'yana-yatirma', 'supine-roll', 'egil-yaslan', 'duz-bas-sarkitma', 'epley', 'semont', 'brandt-daroff',
      'barbeku', 'vannucchi-asprella', 'casani', 'gufoni', 'yacovino', 'sonra'],
    metin: {
      oynat: 'Oynat', duraklat: 'Duraklat', basaDon: 'Başa dön', genel: 'Genel görünüme geç', yakinlastir: 'Başa yakınlaştır', uzaklastir: 'Uzaklaştır',
      taraf: 'Hasta kulak', sag: 'Sağ', sol: 'Sol', tip: 'Tip',
      post: 'posterior kanal', ant: 'anterior kanal', lat: 'lateral kanal',
      ampulla: 'Ampulla', utrikulus: 'Utrikulus', yer: 'Yer',
      uyari: 'Kupula: uyarı', baskilanma: 'Kupula: baskılanma', dik: 'Kupula: dik',
      gercek: 'Gerçekte', adimlar: 'Adımlar',
      canvas: 'Manevra animasyonu: sedyedeki hasta ve köşede hasta kulağın kanalı',
      sema: 'Şematik çizimdir; açılar ve kanallar ölçekli değildir. Kulaklar: sağ kırmızı, sol mavi. Bekleme süreleri animasyonda kısaltıldı. Modeli parmakla yana sürükleyerek çevirebilirsin.',
      kanalNot: 'Köşedeki çizim hasta kulağın kanalını gösterir: kristaller (turuncu) yerçekimiyle kayar, kupula akımın yönüne bükülür. Lateral kanalda ampullaya doğru, posterior ve anterior kanalda ampulladan uzaklaşan akım uyarıcıdır (Ewald yasaları).'
    },
    notlar: {
      'dix-hallpike': { t: 'Dix-Hallpike testi', cesit: { kanal: 'Kanalolitiazis' }, p: [
        'Vertikal (posterior ve anterior) kanalların BPPV’sini değerlendirir; en sık uygulanan pozisyonel testtir.',
        'Manevradan önce ne yapılacağı hastaya anlatılır. Hasta sedyeye ayakları uzatılarak oturtulur; yattığında başı sedyenin ucundan arkaya sarkacak biçimde yerleştirilir. Testin bütün aşamalarında baş, testi yapan kişi tarafından desteklenir; nistagmusun değerlendirilebilmesi için hastanın gözlerini açık tutması önemlidir.',
        'Posterior kanal BPPV’sinde nistagmus birkaç saniyelik latenstan sonra çıkar; hızlı fazı alttaki kulağa ve yukarı doğrudur (geotropik), torsiyoneldir. 1 dakikadan kısa sürede kaybolur; test tekrarlandıkça şiddeti ve süresi azalır (yorulma). Hasta oturtulunca ters yönde (revers) nistagmus görülür.',
        'Anterior kanal BPPV’sinde nistagmus aşağı vuran (ageotropik) ve torsiyoneldir.',
        'Nistagmus kupulolitiaziste kanalolitiazise göre genellikle daha uzun sürer. Ders notuna göre 60 sn’den uzun sürerse kupulolitiazis ya da santral patoloji düşünülür.',
        'Kaynak: Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 458–460); Vestibüler Sistem ve Hastalıkları, BPPV (sl. 22–24); Vestibüler Sistemin Değerlendirilmesi, yatak başı testler (sl. 25–27).' ],
        a: { kanal: [
          'Başlangıç | Hasta sedyede, ayakları uzatılmış oturur; başı karşıya bakar. | ',
          'Baş 45° | Baş test edilen (hasta) tarafa 45° çevrilir. Hastadan boynunu kasmaması istenir. | ',
          'Yatır | Hasta hızla sırtüstü yatırılır, baş yatay düzlemden 30° aşağı sarkıtılır. Kristaller ampulladan uzaklaşır: latenslı, geotropik, torsiyonel nistagmus. | En az 30 sn',
          'Oturt | Hasta oturtulur; ters yönde nistagmus görülebilir. Sonra baş öbür tarafa çevrilir ve öbür kulak için aynı işlem tekrarlanır. | 30 sn kadar' ] } },
      'yana-yatirma': { t: 'Yana yatırma testi (side-lying)', cesit: { kanal: 'Kanalolitiazis' }, p: [
        'Dix-Hallpike testinde başını yeterince ekstansiyona getiremeyecek hastalarda uygulanabilir. Ders notuna göre boyun ve sırt sorunu olanlar için Helen Cohen tarafından tanımlanmıştır.',
        'Hasta ayakları aşağı sarkacak biçimde sedyeye oturtulur. Başı bir tarafa 45° çevrilir, sonra ters tarafa doğru hızla omzunun üstüne yatırılır. Üstüne yattığı tarafta (altta) kalan posterior kanal test edilir.',
        'Bulgular Dix-Hallpike testindeki gibi değerlendirilir.',
        'Kaynak: Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 459, Resim 3); Vestibüler Sistem ve Hastalıkları, BPPV (sl. 22).' ],
        a: { kanal: [
          'Başlangıç | Hasta sedyenin kenarında, ayakları aşağı sarkık oturur. | ',
          'Baş 45° | Baş sağlam tarafa 45° çevrilir. | ',
          'Yatır | Hasta hızla hasta tarafın omzunun üstüne yatırılır; altta kalan posterior kanal test edilir. Kristaller ampulladan uzaklaşır. | ',
          'Oturt | Hasta oturtulur. | ' ] } },
      'supine-roll': { t: 'Sırtüstü baş çevirme testi (supine roll)', cesit: { kanal: 'Kanalolitiazis (geotropik)', kupula: 'Kupulolitiazis (ageotropik)' }, p: [
        'Lateral (horizontal) kanal BPPV’sini değerlendirir. Kılavuza göre öykü BPPV’ye uyduğu hâlde Dix-Hallpike testinde yatay nistagmus görülür ya da hiç nistagmus görülmezse yapılmalıdır.',
        'Hasta sırtüstü yatar, baş 30° fleksiyona getirilir (lateral kanal dikleşir). Baş hızla bir yana çevrilir ve 1 dakika kadar beklenerek vertigo ve nistagmus gözlenir. Sonra baş yavaşça orta hatta alınır ve hızla öbür yana çevrilir.',
        'Kanalolitiaziste geotropik nistagmus görülür ve yorulma gösterir; kupulolitiaziste nistagmus ageotropiktir ve daha uzun sürer.',
        'Hasta taraf: geotropik nistagmusta nistagmusun güçlü olduğu, ageotropik nistagmusta zayıf olduğu taraftır. Kitaba göre nistagmus ve yakınmalar baş hasta kulağa çevrilince daha kötüdür.',
        'Kaynak: Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 460, Resim 4); Vestibüler Sistem ve Hastalıkları, BPPV (sl. 25–26); Vestibüler Sistemin Değerlendirilmesi, VNG (sl. 29); AAO-HNS kılavuzu (2017); Bárány Derneği tanı ölçütleri (2015).' ],
        a: { kanal: [
          'Başlangıç | Hasta sırtüstü yatar, baş 30° fleksiyonda. | ',
          'Hasta yana | Baş hızla hasta tarafa çevrilir. Kristaller ampullaya doğru kayar (uyarı): geotropik, daha güçlü nistagmus. | 1 dk kadar',
          'Ortaya | Baş yavaşça orta hatta alınır. | ',
          'Sağlam yana | Baş hızla sağlam tarafa çevrilir. Kristaller ampulladan uzaklaşır (baskılanma): geotropik, daha zayıf nistagmus. | 1 dk kadar',
          'Ortaya | Baş orta hatta alınır. | ' ],
          kupula: [
          'Başlangıç | Hasta sırtüstü yatar, baş 30° fleksiyonda. Kristaller kupulaya yapışıktır. | ',
          'Hasta yana | Baş hızla hasta tarafa çevrilir. Ağırlaşan kupula ampulladan uzağa bükülür (baskılanma): ageotropik, daha zayıf nistagmus. | 1 dk kadar',
          'Ortaya | Baş yavaşça orta hatta alınır. | ',
          'Sağlam yana | Baş hızla sağlam tarafa çevrilir. Kupula ampullaya doğru bükülür (uyarı): ageotropik, daha güçlü ve uzun nistagmus. | 1 dk kadar',
          'Ortaya | Baş orta hatta alınır. | ' ] } },
      'egil-yaslan': { t: 'Eğil-yaslan testi (bow and lean)', cesit: { kanal: 'Kanalolitiazis', kupula: 'Kupulolitiazis' }, p: [
        'Lateral kanal BPPV’sinde hasta tarafı bulmaya yardım eder. Ders notunda bilateral etkilenimde ve şiddetli tarafın tayininde kullanıldığı belirtilir.',
        'Hasta oturur; baş önce öne eğilir (eğilme), sonra arkaya yaslanır (yaslanma; bir kaynakta yaklaşık 60° ekstansiyon). Her konumda en az 30 sn nistagmus izlenir.',
        'Kanalolitiaziste eğilirken, kupulolitiaziste yaslanırken görülen nistagmusun yönü hasta kulağı gösterir.',
        'Açılar kaynaklara göre değişir; animasyondaki açılar şematiktir.',
        'Kaynak: Vestibüler Sistem ve Hastalıkları, BPPV (sl. 22); Choung ve ark., Laryngoscope (2006); Vestibular First, Bow and Lean Test.' ],
        a: { kanal: [
          'Başlangıç | Hasta oturur, baş dik. | ',
          'Eğil | Baş öne eğilir. Kristaller ampullaya doğru kayar (uyarı): nistagmus hasta kulağa doğru. | En az 30 sn',
          'Yaslan | Baş arkaya yaslanır. Kristaller ampulladan uzaklaşır (baskılanma): nistagmus sağlam kulağa doğru. | En az 30 sn',
          'Dik | Baş dik konuma döner. | ' ],
          kupula: [
          'Başlangıç | Hasta oturur, baş dik. Kristaller kupulaya yapışıktır. | ',
          'Eğil | Baş öne eğilir. Ağırlaşan kupula ampulladan uzağa bükülür (baskılanma): nistagmus sağlam kulağa doğru. | En az 30 sn',
          'Yaslan | Baş arkaya yaslanır. Kupula ampullaya doğru bükülür (uyarı): nistagmus hasta kulağa doğru. | En az 30 sn',
          'Dik | Baş dik konuma döner. | ' ] } },
      'duz-bas-sarkitma': { t: 'Düz baş sarkıtma testi', cesit: { kanal: 'Kanalolitiazis' }, p: [
        'Anterior kanal BPPV’sinin değerlendirilmesinde kullanılır; Bárány Derneği tanı ölçütlerindeki pozisyonel testler Dix-Hallpike, supine roll ve düz baş sarkıtma testidir.',
        'Hasta sırtüstü yatırılır; baş çevrilmeden, orta hatta arkaya sarkıtılır. Animasyonda baş, Dix-Hallpike testindeki gibi 30° sarkıtıldı.',
        'Anterior kanal BPPV’sinde nistagmus aşağı vuran (ageotropik) ve torsiyoneldir; latensi, süresi ve tekrarlarda yorulması posterior kanal BPPV’sine benzer.',
        'Anterior kanal BPPV’si nadirdir (%1–3); tanı konurken dikkatli olunmalı, santral nedenler akla getirilmelidir.',
        'Kaynak: Bárány Derneği tanı ölçütleri (2015); Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 460); Vestibüler Sistem ve Hastalıkları, BPPV (sl. 19); Vestibüler Sistemin Değerlendirilmesi, VNG (sl. 23).' ],
        a: { kanal: [
          'Başlangıç | Hasta sedyede, ayakları uzatılmış oturur. | ',
          'Sarkıt | Hasta hızla sırtüstü yatırılır, baş orta hatta arkaya sarkıtılır. Kristaller ampulladan uzaklaşır (uyarı): aşağı vuran, torsiyonel nistagmus. | ',
          'Oturt | Hasta oturtulur. | ' ] } },
      'epley': { t: 'Epley manevrası', cesit: { kanal: 'Kanalolitiazis' }, p: [
        'Posterior kanal BPPV’sinin tedavisinde en sık kullanılan kanalit repozisyon manevrasıdır (Epley, 1992). Bütün kanalit repozisyon manevralarında amaç, kanala girmiş otolitleri kanaldan çıkarıp utriküler kaviteye yönlendirmektir; manevra etkilenen kanala göre seçilir.',
        'İlk aşaması Dix-Hallpike testiyle aynıdır; bütün aşamalarda baş elle desteklenir. Sol posterior kanalda hareketler tam ters yöne yapılır.',
        'Her pozisyonda 30 sn–1 dk beklenir; bu sürede kanaldaki debris ve endolenfin hareketi genellikle sona erer ve vertigo azalarak geçer.',
        'Hasta ayağa kaldırılmadan önce bir süre sedyede karşıya bakarak oturtulur; kanalolitlerin vestibüle dökülmesine zaman tanınmazsa kalkarken baş dönmesi ve düşme görülebilir.',
        'Anterior kanal kanalolitiazisi de posterior kanal BPPV’si gibi tedavi edilebilir.',
        'Kaynak: Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 465–466, Resim 13; s. 469); Vestibüler Sistem ve Hastalıkları, BPPV (sl. 27).' ],
        a: { kanal: [
          'Başlangıç | Hasta sedyede, ayakları uzatılmış oturur. | ',
          'Baş 45° | Baş hasta tarafa 45° çevrilir. | ',
          'Yatır | Hasta hızla sırtüstü yatırılır, baş 30° aşağı sarkıtılır (Dix-Hallpike pozisyonu). Kristaller ampulladan uzaklaşır. | 30 sn–1 dk',
          'Ortaya | Baş yavaşça orta hatta alınır. | ',
          'Sağlam yana | Baş sağlam tarafa çevrilir; hasta kulak yukarı bakar. Kristaller kanal boyunca ilerler. | 30 sn–1 dk',
          'Yan yat | Hasta, yüzü aşağı bakacak biçimde sağlam tarafına, omzunun üstüne döner. Kristaller utrikulusa dökülür. | 30 sn–1 dk',
          'Oturt | Hasta sedyede oturacak biçimde doğrultulur. | ',
          'Karşıya bak | Ayağa kaldırılmadan önce bir süre karşıya bakarak oturur. | ' ] } },
      'semont': { t: 'Semont manevrası (modifiye)', cesit: { kanal: 'Kanalolitiazis (kitap)', kupula: 'Kupulolitiazis (ders notu)' }, p: [
        'Posterior kanal BPPV’sinin tedavisinde kullanılır (Semont ve ark., 1988). Kitapta modifiye Semont manevrası posterior kanal kanalolitiazisi için anlatılır; ders notunda posterior kanal kupulolitiazisi için verilir.',
        'Hasta sedyenin kenarında, ayakları aşağı sarkık oturur. Baş sağlam tarafa 45° çevrilir; bu konum manevra boyunca bozulmaz. Sağ ve sol kulakta hareketler birbirinin tersidir.',
        'Bekleme: kanalolitiaziste her yatış pozisyonunda vertigo geçene kadar en az 30 sn; kupulolitiaziste pozisyonlar arası 2–3 dk. Hareketlerin hızlı yapılması önemlidir.',
        'Anterior kanal kupulolitiazisinde Semont manevrası ikinci pozisyondan başlanarak uygulanabilir.',
        'Kaynak: Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 466–467, Resim 14; s. 469); Vestibüler Sistem ve Hastalıkları, BPPV (sl. 28).' ],
        a: { kanal: [
          'Başlangıç | Hasta sedyenin kenarında, ayakları aşağı sarkık oturur. | ',
          'Baş 45° | Baş sağlam tarafa 45° çevrilir. | ',
          'Hasta yana | Baş konumu bozulmadan hasta, hasta tarafın omzunun üstüne hızla yatırılır. Kristaller ampulladan uzaklaşır. | Vertigo geçene kadar, en az 30 sn',
          'Öbür yana | Baş konumu korunarak, oturur konumda beklemeden sağlam tarafın omzunun üstüne hızla yatırılır. Kristaller utrikulusa dökülür. | Vertigo geçene kadar, en az 30 sn',
          'Oturt | Hasta tekrar oturtulur. | ',
          'Baş ortaya | Baş karşıya çevrilir. | ' ],
          kupula: [
          'Başlangıç | Hasta sedyenin kenarında, ayakları aşağı sarkık oturur. Kristaller kupulaya yapışıktır. | ',
          'Baş 45° | Baş sağlam tarafa 45° çevrilir. | ',
          'Hasta yana | Baş konumu bozulmadan hasta, hasta tarafın omzunun üstüne hızla yatırılır. Hızlı hareket kupulaya yapışık kristalleri serbestleştirir. | 2–3 dk',
          'Öbür yana | Baş konumu korunarak, oturur konumda beklemeden sağlam tarafın omzunun üstüne hızla yatırılır. Kristaller utrikulusa dökülür. | 2–3 dk',
          'Oturt | Hasta tekrar oturtulur. | ',
          'Baş ortaya | Baş karşıya çevrilir. | ' ] } },
      'brandt-daroff': { t: 'Brandt-Daroff egzersizleri', cesit: { kanal: 'Kanalolitiazis' }, p: [
        'Posterior kanal BPPV’si olan bazı hastalara verilebilir. Amaç, baş dönmesini tetikleyen pozisyonları günde birkaç kez tekrarlayarak hastanın semisirküler kanallardan gelen vestibüler uyarılara alışmasıdır; bu yüzden animasyonda kristaller kanalda kalır.',
        'Hasta yatağın kenarında ayakları aşağıda oturur ve hızla bir yanına yatar. Vertigo ortaya çıkmışsa geçmesini bekler ve tekrar oturur; oturunca yine bekler, sonra öbür yanına hızla yatar.',
        'Hareket dizisi her seferinde 10–20 kez tekrarlanır ve her gün birkaç kez yinelenir.',
        'Animasyonda baş, kitaptaki resimde olduğu gibi yatışta yukarı doğru 45° çevrilidir.',
        'Kaynak: Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 467–468, Resim 15).' ],
        a: { kanal: [
          'Başlangıç | Yatağın kenarında, ayaklar aşağıda oturur. | ',
          'Bir yana | Hızla bir yanına yatar. | Vertigo geçene kadar',
          'Otur | Tekrar oturur. | Vertigo geçene kadar',
          'Öbür yana | Hızla öbür yanına yatar. | Vertigo geçene kadar',
          'Otur | Tekrar oturur. Dizi 10–20 kez tekrarlanır. | ' ] } },
      'barbeku': { t: 'Barbekü (roll) manevrası', cesit: { kanal: 'Kanalolitiazis' }, p: [
        'Lateral kanal BPPV’sinin tedavisinde en sık uygulanan manevralardan biridir. Ders notunda horizontal kanal kanalolitiazisi için verilir.',
        'Manevraya hasta yatar konumdayken ve hasta kulak aşağıdayken başlanır. Hasta yavaşça sağlam tarafa doğru döndürülür: önce yüzü yukarı, sonra hasta kulak yukarı, sonra yüzü aşağı bakar; döndürmeye devam edilerek baş öne doğru 30° açı yapacak biçimde sırtüstü konuma getirilir.',
        'Her pozisyonda 15 sn kadar ya da vertigo geçene kadar beklenir.',
        'Kaynak: Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 468–469, Resim 16); Vestibüler Sistem ve Hastalıkları, BPPV (sl. 29).' ],
        a: { kanal: [
          'Başlangıç | Hasta yatar, hasta kulak altta; baş 30° öne eğik. | ',
          'Yüz yukarı | Yavaşça sağlam tarafa doğru, yüzü yukarı gelene kadar döndürülür. | 15 sn ya da vertigo geçene kadar',
          'Hasta kulak üstte | Hasta kulak yukarıda kalana kadar döndürülmeye devam edilir. | 15 sn ya da vertigo geçene kadar',
          'Yüzüstü | Tamamen yüzü aşağı bakacak biçimde döndürülür. | 15 sn kadar',
          'Devam | Döndürmeye devam edilir. | ',
          'Sırtüstü | Baş öne doğru 30° açı yapacak biçimde sırtüstü konuma getirilir. | ' ] } },
      'vannucchi-asprella': { t: 'Vannucchi-Asprella manevrası', cesit: { kanal: 'Kanalolitiazis' }, p: [
        'Horizontal (lateral) kanal BPPV’sinin tedavisinde uygulanabilir.',
        'Hasta başı orta hatta, yukarı bakacak biçimde sırtüstü yatar. Baş hızla sağlam kulağa doğru 45° çevrilir; baş bu konumda sabit tutularak hasta oturtulur. Oturur konumda baş yavaşça orta hatta, karşıya bakacak biçimde çevrilerek manevra sonlandırılır.',
        'Bu döngü 3–5 kez tekrarlanır; animasyonda iki döngü gösterilir.',
        'Kaynak: Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 469).' ],
        a: { kanal: [
          'Başlangıç | Sırtüstü yatar, baş orta hatta yukarı bakar. | ',
          'Baş 45° | Baş hızla sağlam kulağa doğru 45° çevrilir. | ',
          'Oturt | Baş bu konumda sabit tutularak hasta oturtulur. | ',
          'Baş ortaya | Oturur konumda baş yavaşça orta hatta, karşıya çevrilir. | ',
          'Yeniden yat | Döngü yeniden başlar: hasta sırtüstü yatar. | ',
          'Baş 45° | Baş hızla sağlam kulağa doğru 45° çevrilir. | ',
          'Oturt | Baş sabit tutularak hasta oturtulur. | ',
          'Baş ortaya | Baş yavaşça karşıya çevrilir. Döngü 3–5 kez tekrarlanır. | ' ] } },
      'casani': { t: 'Casani manevrası (modifiye Semont)', cesit: { kupula: 'Kupulolitiazis' }, p: [
        'Ders notunda horizontal (lateral) kanal kupulolitiazisinin tedavisi için verilir (Casani, 2002). Kitapta yoktur.',
        'Hasta oturur; baş 30° fleksiyonda sabitlenir ve hastanın sıkı tutunması sağlanır. Hasta hasta tarafa doğru hızla yatırılır, baş 45° aşağı çevrilir, sonra hızla oturur konuma getirilir.',
        'Pozisyonlar arası 2–3 dk beklenir; manevra hızlı uygulanmalıdır.',
        'Kitaba göre kupulada ya da kanal içinde sıkışan debrisi harekete geçirmek ve serbestleştirmek için mastoid bölgeye titreşim verilebilir ya da serbestleştirici (liberatory) manevra uygulanabilir.',
        'Kaynak: Vestibüler Sistem ve Hastalıkları, BPPV (sl. 30); Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 460).' ],
        a: { kupula: [
          'Başlangıç | Hasta oturur; baş 30° fleksiyonda sabitlenir, hasta sıkı tutunur. Kristaller kupulaya yapışıktır. | ',
          'Hasta yana | Hasta tarafa doğru hızla yatırılır. Hızlı hareket kupuladaki kristalleri serbestleştirir. | ',
          'Baş aşağı | Baş 45° aşağı (yere doğru) çevrilir. | 2–3 dk',
          'Oturt | Hızla oturur konuma getirilir. Kristaller utrikulusa dökülür. | 2–3 dk',
          'Baş ortaya | Baş karşıya çevrilir. | ' ] } },
      'gufoni': { t: 'Gufoni manevrası', cesit: { geo: 'Geotropik', apo: 'Ageotropik' }, p: [
        'Lateral kanal BPPV’sinin geotropik ve ageotropik tipinde kullanılabilir. 10 randomize çalışmayı içeren bir sistematik derlemede sahte manevraya göre etkili bulunmuştur. Yuvarlanma gerektirmediği için yaşlı ya da hareketi kısıtlı hastalarda daha kolay uygulanır.',
        'Geotropik tip: hasta oturur konumdan sağlam tarafına düz yan yatar; sonra baş hızla yere doğru 45–60° çevrilir ve 2 dk tutulur; hasta oturtulur.',
        'Ageotropik tip: hasta hasta tarafına yatar; baş yukarı (burun tavana) 45–60° çevrilir ve 1–2 dk tutulur; hasta oturtulur. Ageotropik tip geotropik tipe dönüşebilir.',
        'Bekleme süreleri kaynaklara göre değişir. Kitapta ve ders notunda bu manevra yoktur.',
        'Kaynak: AAO-HNS BPPV kılavuzu (2017); Otolaryngologic Clinics of North America (2012, şekil); Gufoni sistematik derlemesi (2024); ageotropik lateral kanal BPPV’si sistematik derlemesi (2023).' ],
        a: { geo: [
          'Başlangıç | Hasta sedyenin kenarında oturur. | ',
          'Sağlam yana | Hızla sağlam tarafına düz yan yatar. | 30 sn–1 dk',
          'Baş aşağı | Baş hızla yere doğru 45–60° çevrilir. | 2 dk',
          'Oturt | Baş çevrili kalarak hasta oturtulur. | ',
          'Baş ortaya | Baş karşıya çevrilir. | ' ],
          apo: [
          'Başlangıç | Hasta sedyenin kenarında oturur. Kristaller kupulaya yapışıktır. | ',
          'Hasta yana | Hızla hasta tarafına yatar. | ',
          'Baş yukarı | Baş yukarı (burun tavana) 45–60° çevrilir. | 1–2 dk',
          'Oturt | Baş çevrili kalarak hasta oturtulur. | ',
          'Baş ortaya | Baş karşıya çevrilir. | ' ] } },
      'yacovino': { t: 'Yacovino (derin baş sarkıtma) manevrası', cesit: { kanal: 'Kanalolitiazis' }, p: [
        'Anterior kanal BPPV’sinin tedavisinde kullanılır (Yacovino ve ark., 2009). Hasta tarafın bilinmesi gerekmez; bu yüzden sağ ve sol kulakta aynıdır.',
        'Hasta sırtüstü yatırılır, baş 30°’den fazla ekstansiyonla aşağı sarkıtılır; sonra baş yukarı doğru 45° fleksiyona (çene göğse) getirilir; ardından hasta oturtulur.',
        'Pozisyonlar arası 30 sn ya da nistagmus geçene kadar beklenir.',
        'Kanıtlar küçük vaka serilerine dayanır. Bir 3D benzetim çalışması, klasik manevrada kristallerin posterior kanala geçebileceğini bildirmiştir.',
        'Kitaba göre anterior kanal kanalolitiazisi posterior kanal BPPV’si gibi de tedavi edilebilir.',
        'Kaynak: Vestibüler Sistem ve Hastalıkları, BPPV (sl. 31); Yacovino ve ark., J Neurol (2009); Bhandari ve ark., Front Neurol (2021); Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 469).' ],
        a: { kanal: [
          'Başlangıç | Hasta sedyede, ayakları uzatılmış oturur. | ',
          'Sarkıt | Hızla sırtüstü yatırılır, baş 30°’den fazla aşağı sarkıtılır. Kristaller ampulladan uzaklaşır. | 30 sn ya da nistagmus geçene kadar',
          'Çene göğse | Baş yukarı doğru 45° fleksiyona, çene göğse getirilir. Kristaller utrikulusa dökülür. | 30 sn ya da nistagmus geçene kadar',
          'Oturt | Baş öne eğik kalarak hasta oturtulur. | 30 sn',
          'Baş dik | Baş dik konuma gelir. | ' ] } },
      'sonra': { t: 'Manevralardan sonra', p: [
        'Kanalit repozisyon manevralarından sonra hastanın ani baş hareketlerinden kaçınması, yatarken ani pozisyon değişikliklerinden korunmak için sırtüstü ve yüksek yastıkla yatması istenir. Hareket kısıtlamasının gereksiz olduğunu savunan görüşler de vardır.',
        'Kitaptaki klinik uygulamada hasta ortalama 3 gün sonra kontrole çağrılır; Dix-Hallpike ve pozisyonel testler tekrarlanarak sorunun düzelip düzelmediğine bakılır.',
        'Ders notunda: provoke eden pozisyonlardan ve hiperekstansiyondan kaçınılması, uykuda başın 45° yükseltilmesi, 5–7 gün sonra kontrol ve gerekirse manevranın tekrarı önerilir; çoklu kanal tutulumu ve eşlik eden başka patolojiler sorgulanmalıdır.',
        'Hastaların çoğu tek bir kanalit repozisyon manevrasından yarar görür; bazılarında manevranın birkaç kez tekrarlanması gerekebilir. Tekrarlanan manevralardan yarar görmeyen hastalarda tanı mutlaka gözden geçirilmeli, ek kanal tutulumu ya da eşlik edebilecek başka hastalıklar dışlanmalıdır.',
        'Çoklu kanal BPPV’si olguların %5’inden azında görülür. En etkili yöntem tek kanal tedavisidir; genellikle belirtilerin ve nistagmusun en yoğun olduğu taraf ya da kanaldan başlanır, daha uzun takip ve daha çok seans gerekir.',
        'Kaynak: Odyolojide Özel Durumlar, Vestibüler Sistem Bozuklukları (s. 469); Vestibüler Sistem ve Hastalıkları, BPPV (sl. 32–33).' ] }
    }
  };
})();
