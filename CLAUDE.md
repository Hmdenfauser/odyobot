# CLAUDE.md — OdyoBOT

## 1. Proje özeti
OdyoBOT, odyoloji öğrencileri ve klinisyenler için bir başvuru uygulaması. Kitap (handbook) gibi kullanılıyor ve önce telefon için tasarlanıyor. Arayüz ve içerik tamamen Türkçe. Bölümler arasında alttaki 5 sekmeli çubukla tek dokunuşta geçiliyor. Amaç, öğrencinin ve klinisyenin bir bilgiye hızlıca ulaşabilmesi.

## 2. Proje sahibiyle çalışma biçimi
- Proje sahibi bir odyolog ve yazılım bilmiyor. Proje "vibe coding" ile ilerliyor: yönü o belirler, kodu sen yazarsın.
- Sade Türkçe kullan. Adım adım ve küçük parçalarla ilerle. Teknik bir terim ilk geçtiği yerde açıkla.
- Bir şey çalışmayacaksa ya da kısıtlıysa bunu baştan söyle. Garanti verme.
- Küçük değişiklikler yap ve her adımdan sonra neyin değiştiğini, nasıl deneneceğini anlat.

## 3. Mevcut durum

### Sekmeler (alt çubuk)
| # | Sekme | İçerik | Durum |
|---|---|---|---|
| 1 | Ana sayfa | "Merhaba, odyolog" karşılaması, canlı saat ve tarih, iş ilanları, sempozyum ve kongre haberleri. İlanları ve haberleri yalnızca düzenleyici ekler/siler, herkes görür. | Yapıldı |
| 2 | Görsel depo | (a) İşitme yolakları: koklea'dan işitsel kortekse 8 basamaklı, dokunulabilir şema. Her basamakta konum, işlev, klinik not ve ABR dalga karşılığı var. (b) Akustik refleks arkı: ipsilateral ve kontralateral yolu gösteren 7 basamaklı şema. (c) Cihazlar: 8 işitme cihazı (BTE, RIC, ITE tam/yarım konka, ITC, CIC, IIC, bantlı kemik iletimli) ve 10 implant kartı. Liste `app.js` → `DEVICES`. Açıklamaları yönetici uygulama içinden yazar (kartta "Açıklama ekle/düzenle"). | Hepsi yapıldı (2026-11-09). Açıklamalar boş, proje sahibi yazacak. |
| 3 | OdyoBot | Ortada, turuncu, yükseltilmiş yuvarlak düğme; içinde uygulama logosu. Maskeleme asistanı (bkz. §7). | Logo yerleşti; asistan yapılmadı |
| 4 | Notlar | Kısa ders notları ve arama kutusu. Konular: saf ses odyometrisi, işitme kaybı tipleri, timpanometri, konuşma odyometrisi, maskeleme kavramları, OAE, ABR, akustik refleks. | Yapıldı |
| 5 | Geçmiş | Kişisel vaka kaydı: anonim vaka etiketi, tarih, özet. Kayıtlar yalnızca o cihazda saklanır, hiçbir yere gönderilmez. | Yapıldı |

**Ayarlar:** Ana sayfadaki dişli düğmesiyle açılır ve yalnızca yönetici girişi yapılınca görünür. İçinde 5 renk teması arasından seçim, ders notu ekleme/düzenleme/silme ve "Çıkış yap" var.

**Yönetici girişi:** Ana sayfanın en altındaki "Yönetici girişi" bağlantısı (`#giris`). E-posta ve şifre ile giriş (Firebase Authentication).

**Temalar:** Petrol, Lacivert, Orman, Bordo, Mor. Açık/koyu ayrı bir ayar değil: her temanın açık ve koyu hâli var, cihazın moduna göre otomatik seçiliyor.

### Tamamlanan: PWA'ya taşıma (2026-11-06)
Uygulama **https://hmdenfauser.github.io/odyobot/** adresinde yayında. Proje sahibi telefonda şunları denedi ve hepsi çalıştı: giriş, ilan ekleme ve başka cihazda görme, ana ekrana ekleme, uçak modunda açılma.

### Tamamlanan: Cihazlar bölümü ve logo (2026-11-09)
- Ham görseller `ham-gorseller/` klasöründe (git dışında, `.gitignore`). Küçültülmüş kopyalar `images/devices/` altında (800 px, JPEG).
- Logo `ham-gorseller/logo/OdyoBOT.jpg` dosyasından üretildi: `icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `logo.png` (düğmedeki küçük logo).
- **Yenilenecek görseller** (proje sahibi yeni görsel getirecek):
  - Hatalı, kartta yer tutucu var: aktif transkütanöz (implant ve transdüser kafatası içinde çizilmiş), ABI yüzey elektrotlu (kablo kulak kanalından geçiyor).
  - Şüpheli, proje sahibi kontrol edecek: ITE tam ve yarım konka (boyutları neredeyse aynı), ITC (ITE'ye benziyor), bantlı kemik iletim (karşı taraftaki parça belirsiz), penetran ABI (anatomi okunmuyor), orta kulak yarı implante (deri altı alıcı belirsiz).
- Görsel değiştirme yolu: yeni dosya `ham-gorseller/` altına konur. Claude küçültüp `images/devices/` altına yazar. Yer tutucuysa `DEVICES` içindeki `img` doldurulur ve `sw.js` güncellenir.

### Sıradaki işler (bu sırayla)
1. OdyoBot maskeleme asistanı
2. Test soruları ve mağaza paketi

## 4. Teknik yapı ve veri modeli
Uygulama bir **PWA**: tarayıcıdan ana ekrana eklenebilen ve internetsiz de açılabilen web uygulaması. Derleme aracı yok; sade HTML, CSS ve JavaScript.

### Dosyalar
| Dosya | Görevi |
|---|---|
| `index.html` | Sayfa yapısı (sekmeler, formlar) |
| `styles.css` | Görünüm; renkler CSS değişkenleri, en üstte yerel yazı tipleri (`@font-face`) |
| `app.js` | Tüm davranış: saat, şemalar, notlar, ilanlar, vaka geçmişi, giriş, servis çalışanı kaydı |
| `firebase-config.js` | Firebase web yapılandırması ve admin UID'si (gizli bilgi değil, bkz. §8) |
| `firestore.rules` | Firestore güvenlik kuralları. Değişirse Firebase konsoluna elle yapıştırılır. |
| `sw.js` | Servis çalışanı: uygulama dosyalarını önbelleğe alır, internetsiz açılmayı sağlar |
| `manifest.webmanifest` | Ana ekrana ekleme bilgisi (ad, renk, simge) |
| `icons/` | Uygulama logosundan üretilen PNG'ler (192, 512, maskable 512, 180) ve düğmedeki `logo.png` |
| `images/devices/` | Cihaz görselleri (küçültülmüş). Ham halleri `ham-gorseller/` içinde, git'e girmez. |
| `fonts/` | Yazı tipi dosyaları (yalnızca latin + latin-ext) ve OFL lisansları |
| `vendor/firebase/` | Firebase JS SDK 13.2.0 (compat): app, auth, firestore |
| `.nojekyll` | GitHub Pages'in dosyaları işlemesini engeller |

### Barındırma ve servisler
- **Yayın:** GitHub Pages. Depo: `github.com/Hmdenfauser/odyobot` (herkese açık), `main` dalının kök klasörü. `git push` ile gönderilen her değişiklik 1-2 dakikada yayına girer.
- **Ortak veri ve giriş:** Firebase projesi `odyobot-c7a30` (ücretsiz Spark planı). Firestore konumu europe-west.
- Proje sahibi bu ek kütüphanenin (Firebase) eklenmesini onayladı: "en uygunu neyse öyle yap".

### Veri yapısı
| Nerede | Kayıt grubu | Kim okur / yazar | Alanlar |
|---|---|---|---|
| Firestore | `duyurular` | Herkes okur, yalnızca admin yazar | `tur` ("ilan" / "haber"), `baslik` (≤140), `kurum` (≤120), `tarih` (YYYY-AA-GG), `link` (yalnızca https, ≤300), `not` (≤400), `olusturma` (zaman damgası) |
| Firestore | `notlar` | Herkes okur, yalnızca admin yazar | `baslik` (≤100), `maddeler` (metin listesi, ≤40), `olusturma` |
| Firestore | `cihazlar/{cihaz kimliği}` | Herkes okur, yalnızca admin yazar | `maddeler` (metin listesi, 1–20), `guncelleme`. Kişisel veri değil. |
| Firestore | `ayar/tema` | Herkes okur, yalnızca admin yazar | `id` (tema adı), `guncelleme` |
| Cihaz (localStorage, anahtar `odybot:vakalar`) | vaka geçmişi | Yalnızca o cihaz | `etiket`, `tarih`, `not` (özet), `olusturma` |

- 8 temel ders notu veri deposunda değil, kodun içinde (`app.js`, `NOTES` dizisi).
- Firestore'un çevrimdışı önbelleği açık (`enablePersistence`). İnternet yokken son indirilen ilan ve notlar gösteriliyor.
- Kaydedilmesi gereken veri cihazdan çıkmıyor: `makeLocalDb()` yalnızca localStorage kullanır. Yazma başarısız olursa hata gösterilir.

### Yönetici (admin)
- Firebase Authentication, e-posta/şifre. Hesap Firebase konsolunda açıldı; uygulamada kayıt ekranı yok.
- Admin UID'si iki yerde yazılı: `firebase-config.js` içinde `ODYOBOT_ADMIN_UID` (yalnızca görünümü belirler) ve `firestore.rules` (asıl koruma). Biri değişirse ikisi birlikte değiştirilmeli.
- Admin olmayan bir hesapla giriş yapılırsa uygulama o hesabı hemen çıkarır.

### Sürüm takibi
- Proje klasörü bir git deposu. Uzak adresi `origin`, GitHub'daki depo.
- Yazar bilgisi: `Hmdenfauser <353091884+Hmdenfauser@users.noreply.github.com>`. Bu GitHub'ın gizli adresi; proje sahibinin gerçek e-postası kayıtlarda kullanılmaz.
- Git yolu: `C:\Program Files\Git\cmd\git.exe`. Claude'un komut ortamında `git` PATH'te olmayabilir. Gönderim için şu ortam değişkenleri gerekiyor: `GCM_INTERACTIVE=always`, `GIT_TERMINAL_PROMPT=1`.
- Eski prototip (`OdyoBOT.html`, Claude artifact sürümü) silindi; git geçmişinde duruyor.

## 5. Mimari kararlar
- ✅ Bağımsız PWA, kendi adresinde: GitHub Pages
- ✅ Ortak içerik: Firebase Firestore. Yönetici uygulama içinden ekler.
- ✅ Yönetici girişi: Firebase Authentication, e-posta/şifre
- **Vaka geçmişi yalnızca kullanıcının cihazında kalır, hiçbir zaman sunucuya gönderilmez.**
- En son aşamada App Store ve Google Play paketi hazırlanacak. *Hangi yöntemle yapılacağı: karar verilmedi.*

## 6. Tasarım kuralları
- Görünüm sade, klinik ve okunaklı olacak.
- Yazı tipleri: başlıklarda **Bricolage Grotesque**, metinde **IBM Plex Sans**, etiket, saat ve verilerde **IBM Plex Mono**.
- Ana renk petrol mavisi-yeşili, OdyoBot yuvarlağı turuncu. Açık ve koyu tema desteklenecek.
- Uygulama logosu (mavi-turkuaz, kulak + robot) ana ekran simgesi olarak kullanılır. OdyoBot düğmesinde turuncu yuvarlağın içinde, beyaz daire üzerinde durur (2026-11-09 kararı).
- Renkler her zaman isimli değişkenlerle (CSS değişkenleri) tanımlanacak, koda doğrudan renk kodu yazılmayacak.
- **Odyogram kuralı (bütün şemalarda geçerli):** sağ kulak kırmızı, sol kulak mavi, karşıya geçiş kesik gri çizgi.
- Mobil öncelik:
  - 400 piksel genişlikte yatay kaydırma olmayacak.
  - Dokunma hedefleri en az 44 piksel olacak.
  - Alt çubukta basılan hücrenin tamamı vurgulanacak.
- Görseller yalnızca özgün şematik çizimler ya da proje sahibinin kendi fotoğrafları olacak. **Telifli ders kitabı görselleri kullanılmayacak.**

## 7. Klinik içerik kuralları
- Klinik bilgiyi sen doğrulayamazsın; doğrulamayı proje sahibi kendi kaynaklarıyla yapar.
- Emin olmadığın değerleri kesin bilgi gibi yazma. Sınır değerlerin kaynağa, yaşa ve kliniğe göre değiştiğini belirt.
- **OdyoBot kural tabanlı olacak:**
  - Sonucu yapay zekâ yorumlamayacak; aynı girdi her zaman aynı sonucu verecek.
  - Formüller ve eşik değerler, koda yazılmadan önce proje sahibiyle birlikte kaynaktan doğrulanacak.
  - Asistan örnek vakalarla test edilecek.
  - Tanı koymayacak. Yalnızca hangi kulağa, ne zaman ve ne kadar maskeleme gerektiğini ve plato tekniğinin adımlarını önerecek.

## 8. Gizlilik (KVKK)
- Hasta adı, kimlik numarası, doğum tarihi gibi tanımlayıcı bilgiler uygulamaya girilmeyecek.
- Yeni bir veri alanı eklemeden önce, bunun kişisel veri olup olmadığını **proje sahibine sor.**
- Vaka geçmişi sağlık verisi sayılır ve cihazdan dışarı çıkmaz.
- Anahtar, şifre ve hesap bilgileri kod dosyalarına yazılmaz.
  - İstisna: `firebase-config.js` içindeki Firebase web yapılandırması ve admin UID'si. Bunlar Firebase'in tasarımı gereği herkese açık tanımlayıcılardır, şifre değildir. Koruma `firestore.rules` ile sağlanır.
  - Admin şifresi hiçbir zaman sorulmaz, yazılmaz, istenmez.
- Depo herkese açık. Gerçek e-posta, telefon gibi kişisel bilgiler dosyalara veya git kayıtlarına girmemeli.

## 9. Çalışırken dikkat edilecekler
- Her değişiklikten sonra 400 piksel genişlikte yatay kaydırma olup olmadığını ve dokunma hedeflerinin boyutunu kontrol et.
- Açık ve koyu temanın ikisini de kontrol et.
- Tüm arayüz metinleri Türkçe olmalı.
- Düzenleyiciye özel işlevler (ilan/haber ekleme ve silme, Ayarlar) normal kullanıcıya görünmemeli.
- Metinde olmayan bir şeyi uydurma; belirsiz konularda sor.
- Proje sahibinin onayı olmadan kütüphane ekleme veya yapıyı köklü biçimde değiştirme.
- **Yayına gönderirken (`git push`):**
  - Yeni bir dosya eklendiyse veya silindiyse `sw.js` içindeki `ASSETS` listesini güncelle.
  - Her yayında `sw.js` içindeki `VERSION` değerini bir artır (ör. `odyobot-v4`). Böylece telefonlardaki eski kopya yenilenir.
  - `sw.js` sayfa, css, js ve manifest dosyalarını önce internetten alır. Görsel, simge ve yazı tiplerini önce önbellekten alır. Bunun nedeni: v2 yayınında telefon yeni `index.html`'i eski `app.js`/`styles.css` ile açtı ve kartlar görünmedi (2026-11-09). Bu ayrımı bozma.
- **Test yöntemi:**
  - Edge görünmez modda (`--headless`), uygulama 400 px genişliğinde bir çerçevenin (iframe) içinde açılır ve ekran görüntüsü alınır.
  - Açık/koyu tema `--blink-settings=preferredColorScheme=1/0` ile seçilir.
  - Firebase, giriş ve servis çalışanı `file://` ile açılan sayfada çalışmaz. Bunlar için `http://localhost` üzerinden küçük bir Node sunucusuyla test edilir.
  - `--virtual-time-budget` sayaçları ileri sarar ve "ulaşılamıyor" zaman aşımını yanlışlıkla tetikler. Ağ testlerinde bunu kullanma.
  - Test betikleri proje klasörüne değil, sistemin geçici klasörüne yazılır.

## 10. Proje sahibine sorulacak sorular
1. ~~Düzenleyici girişi~~ *Cevaplandı: Firebase e-posta/şifre, bkz. §4.*
2. ~~Barındırma~~ *Cevaplandı: GitHub Pages.*
3. ~~Ortak içerik nerede~~ *Cevaplandı: Firebase Firestore, uygulama içinden ekleme.*
4. ~~5 temanın isimleri ve renkleri~~ *Cevaplandı, bkz. §3.*
5. ~~Prototip verileri taşınacak mı~~ *Taşınacak veri yoktu; sıfırdan başlandı.*
6. Vaka geçmişi yalnızca cihazda kalacağı için, telefon değişirse ya da veriler silinirse kayıtlar kaybolur. Dosyaya yedekleme veya dışa aktarma isteniyor mu?
7. Vaka formunda zaten bir uyarı var: "Hasta adı, soyadı, kimlik numarası gibi tanımlayıcı bilgi yazma. Anonim bir etiket kullan." Bu uyarı yeterli mi, yoksa daha güçlü bir önlem mi isteniyor?
8. ~~Cihaz görselleri ve açıklamaları~~ *Cevaplandı: proje sahibinin JPG'leri küçültülerek eklendi; açıklamaları yönetici uygulama içinden yazar.*
9. OdyoBot için hangi kaynak esas alınacak? Hangi girdiler kullanılacak (frekanslar, hava ve kemik yolu eşikleri, kulaklık tipi)? Hangi interaural attenüasyon değerleri kullanılacak?
10. ~~İnternetsiz ilanlar~~ *Son indirilen kopya gösteriliyor; telefonda uçak moduyla doğrulandı.*
11. Uygulama şu an herkese açık: adresi bilen herkes açabiliyor. Bu durum kalıcı mı, yoksa ileride erişim sınırlanacak mı?
12. Test soruları hangi biçimde olacak (çoktan seçmeli vb.) ve içeriği kim hazırlayacak?
13. Mağaza paketi için geliştirici hesapları var mı? Paket hangi yöntemle hazırlanacak?
