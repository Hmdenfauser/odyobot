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
| 1 | Ana sayfa | Küçük karşılama ("Merhaba, odyolog", saat, tarih) ve fotoğraflı akış (`akis.js`). Filtre çipleri: Tümü / Etkinlikler / İlanlar / Haberler. Etkinlik: 3:4 afiş kartı, tarih aralığı, yer; yaklaşan önce, geçmiş soluk + "Geçti"; Tümü'nde yatay şerit. İş ilanı: kurum, başlık, son başvuru, küçük görsel; süresi geçen soluk. Haber: Twitter benzeri akış (OdyoBOT simgesi, "3 saat önce", ≤280 karakter, 16:9 fotoğraf, tıklanabilir https bağlantıları). Karta dokununca alttan tam ekran ayrıntı sayfası (`#duyuru/<kimlik>`, paylaşılabilir; geri tuşu kapatır). İlk 30 kayıt, "Daha fazla göster". Paylaşımı yalnızca yönetici yapar (formda türe göre alanlar, fotoğraf ekle/kaldır), ayrıntı sayfasında Düzenle/Sil. | Yapıldı (2026-11-11), sw v17. Firestore kuralları konsola yapıştırılacak. |
| 2 | Görsel depo | (a) İşitme yolakları: koklea'dan işitsel kortekse 9 basamaklı, dokunulabilir şema (akustik striyalar dahil). Her kutuda beyin bölgesi yazıyor; karşıya geçişler iki taraflı. Her basamakta konum, işlev, klinik not ve ABR dalga karşılığı var. (b) Akustik refleks arkı: simetrik, iki kulak da uyarılıyor. Dış kulaktan 7. sinire 7 basamak. (a) ve (b) proje sahibinin `ham-gorseller/` içindeki referans görsellerine bakılarak yeniden çizildi (2026-11-09); görseller uygulamaya konmadı. (c) Cihazlar: 8 işitme cihazı (BTE, RIC, ITE tam/yarım konka, ITC, CIC, IIC, bantlı kemik iletimli) ve 10 implant kartı. Liste `app.js` → `DEVICES`. Açıklamaları yönetici uygulama içinden yazar (kartta "Açıklama ekle/düzenle"). | Hepsi yapıldı (2026-11-09). Açıklamalar boş, proje sahibi yazacak. |
| 3 | OdyoBot | Ortada, turuncu, yükseltilmiş yuvarlak düğme; içinde uygulama logosu. Maskeleme asistanı (bkz. §7): düğmeli sohbet, vakalar Vakalarım'dan gelir (tek ya da çoklu). Kaynak: Katz. | Yapıldı (2026-11-10): kurallar `maskeleme-kural.js` (Katz 7. baskı, Bölüm 6), plato rehberi, testler `testler/maskeleme-test.js` |
| 4 | Vakalarım (`#vakalarim`; eski adı Geçmiş, `#gecmis` yönlendirilir) | Odyometri vaka kaydı (yalnızca o cihazda). Liste (küçük odyogram + tip/derece özeti), form (kimlik, tarih, 125–8000 Hz hava/kemik eşikleri, ara frekans anahtarı, M/maskeleme düzeyi, NR), canlı odyogram (tek/ayrı grafik, lejant), otomatik PTA/derece/tip (`odyo-hesap.js`), ek ölçümler (SRT, SDS/WRS, sunum düzeyi, MCL, UCL, Weber, Rinne), yedekleme (JSON indir/paylaş, CSV, geri yükle: birleştir/üzerine yaz), 10 kayıtta bir yedek hatırlatması. Odyogram çıktısı JPEG/PDF (detaylı / yalnızca odyogram). Her kartta "OdyoBOT'a gönder" düğmesi; listede "Seç" ile birden çok vaka gönderilir. Sekme simgesi: küçük odyogram (çerçeve; O ve X, aralarında onlara değmeyen kesikli çizgi) (2026-11-10). | Yapıldı (2026-11-09). Ayrıntı: `PROGRESS.md` |
| 5 | Notlar | Kısa ders notları ve arama kutusu. Konular: saf ses odyometrisi, işitme kaybı tipleri, timpanometri, konuşma odyometrisi, maskeleme kavramları, OAE, ABR, akustik refleks. | Yapıldı |

**Yönetici düzenlemesi:** Giriş yapınca her şema basamağında, ders notunda, cihaz kartında ve sayfa yazısında "Düzenle" bağlantısı çıkar. Değişiklik herkese yansır, "Varsayılana dön" ile geri alınır.

**Ayarlar:** Ana sayfadaki dişli düğmesiyle açılır ve yalnızca yönetici girişi yapılınca görünür. İçinde 5 renk teması arasından seçim, ders notu ekleme/düzenleme/silme ve "Çıkış yap" var.

**Yönetici girişi:** Ana sayfanın en altındaki "Yönetici girişi" bağlantısı (`#giris`). E-posta ve şifre ile giriş (Firebase Authentication).

**Temalar:** Petrol, Lacivert, Orman, Bordo, Mor. Her temanın açık ve koyu hâli var.

**Görünüm (açık/koyu):** Ana sayfanın üstünde, dişlinin yanında herkese açık tek simge düğmesi (2026-11-10). Her dokunuşta Otomatik → Açık → Koyu → Otomatik; simge yarım dolu daire / güneş / ay. Dokununca altta 1,5 sn "Görünüm: …" yazısı çıkar. Otomatik cihazın moduna uyar. Seçim yalnızca o cihazda saklanır (`gorunum.js`). Dişli simgesi güneşle karışmasın diye çark biçiminde çizildi.

### Tamamlanan: PWA'ya taşıma (2026-11-06)
Uygulama **https://hmdenfauser.github.io/odyobot/** adresinde yayında. Proje sahibi telefonda şunları denedi ve hepsi çalıştı: giriş, ilan ekleme ve başka cihazda görme, ana ekrana ekleme, uçak modunda açılma.

### Tamamlanan: Cihazlar bölümü ve logo (2026-11-09)
- Ham görseller `ham-gorseller/` klasöründe (git dışında, `.gitignore`). Küçültülmüş kopyalar `images/devices/` altında (800 px, JPEG).
- Logo `ham-gorseller/logo/OdyoBOT.jpg` dosyasından üretildi: `icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `logo.png` (düğmedeki küçük logo).
- **Yenilenecek görseller** (proje sahibi yeni görsel getirecek):
  - Hatalı, kartta yer tutucu var: aktif transkütanöz (implant ve transdüser kafatası içinde çizilmiş), ABI yüzey elektrotlu (kablo kulak kanalından geçiyor).
  - Şüpheli, proje sahibi kontrol edecek: ITE tam ve yarım konka (boyutları neredeyse aynı), ITC (ITE'ye benziyor), bantlı kemik iletim (karşı taraftaki parça belirsiz), penetran ABI (anatomi okunmuyor), orta kulak yarı implante (deri altı alıcı belirsiz).
- Görsel değiştirme yolu: yeni dosya `ham-gorseller/` altına konur. Claude küçültüp `images/devices/` altına yazar. Yer tutucuysa `DEVICES` içindeki `img` doldurulur ve `sw.js` güncellenir.

### Tamamlanan: Vakalarım sekmesi (2026-11-09)
- 4 aşamada yapıldı, her biri ayrı commit (sw v6–v9). Kararlar ve testler `PROGRESS.md` içinde.
- Proje sahibinin verdiği klinik değerler: Clark derece tablosu ve 10 dB ABG eşiği (`odyo-hesap.js` başında, tek yerde). "Normal" sınırı tablonun ilk satırı (15 dB). Metinlerde "karma" değil "mikst".
- Proje sahibi telefonda denedi, her şey düzgün çalışıyor (2026-11-09).

### Tamamlanan: CSP, sekme sırası, çıktı, OdyoBOT iskeleti (2026-11-10)
- `index.html` başında CSP satırı (meta). Firebase'e yeni servis eklenirse adresi `connect-src`'ye eklenmeli.
- Alt çubuk sırası: Ana sayfa, Görsel depo, OdyoBOT, Vakalarım, Notlar.
- Odyogram çıktısı (`cikti.js`), Vakalarım → OdyoBOT gönderme, düğmeli sohbet (`odybot.js`). sw v12. Ayrıntı: `PROGRESS.md`.

### Kaldığımız yer (2026-11-11 akşamı)
- Ana sayfa fotoğraflı akışa çevrildi (sw v17, **yayında**). Sahte veriyle yerelde test edildi. Yeni `firestore.rules` proje sahibi tarafından konsola yapıştırıldı ve hatasız yayınlandı (2026-11-11). İlk yapıştırmada dosya bozuktu (düzenleme betiğinde JS `replace` içindeki `$'` deseni metni çoğaltmıştı; düzeltildi). Not: dosyaya kural/metin yazarken `replace(a, () => b)` kullan.
- **Yarın ilk iş (telefonda, proje sahibiyle):** yönetici girişiyle fotoğraflı birer Haber, Etkinlik, İş ilanı paylaşmak (gerçek yazma ve kurallar ilk kez denenecek; fotoğrafın kaydı bilgisayarda hiç denenmedi), karttan ayrıntı sayfası (geri tuşu, ✕, Paylaş), Düzenle ve Sil, uçak modunda açılış. Hata çıkarsa ekran görüntüsü istenecek.
- Ayrıca telefonda denenmemiş olanlar: görünüm düğmesi (v16), Vakalarım'dan OdyoBOT'a gönderme ve maskeleme asistanı, JPEG/PDF çıktısı.
- Önceki: görünüm seçici tek simge düğmesi (sw v16, yayında); telefonda henüz denenmedi.
- Vaka kartına "OdyoBOT'a gönder" ve yeni Vakalarım simgesi eklendi; 5 vakayla uçtan uca test edildi (sw v14).
- Maskeleme asistanı bitti (sw v13): kurallar Katz fotoğraflarından okundu, proje sahibi onayladı, kitap örnekleriyle 25 test geçti. Telefonda denenecek.

### Önceki: kaldığımız yer (2026-11-09 akşamı)
- Vakalarım bitti ve telefonda doğrulandı; her şey yayında, bekleyen değişiklik yok (son sürüm sw v11).
- Proje sahibi ertesi gün devam edecek. Sıradaki iş: **OdyoBot maskeleme asistanı.** Kod yazılmadan önce proje sahibinden cevap beklenenler:
  1. Esas alınacak kaynak (kitap/kılavuz).
  2. Interaural attenüasyon değerleri: kulaklık tipine göre (supra-aural, insert), hava ve kemik yolu için.
  3. Asistan eşikleri Vakalarım'daki vakadan mı alsın (önerilen: evet, değerler bir kez girilir), yoksa ayrı giriş mi olsun?
- Cevaplar gelince önce plan çıkarılıp gösterilecek; formüller kaynaktan birlikte doğrulanmadan koda yazılmayacak (§7).
- Ayrıca bekleyen küçük işler: cihaz kartlarının açıklamaları (proje sahibi uygulamadan yazacak) ve yenilenecek cihaz görselleri (yukarıdaki liste).

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
| `gorunum.js` | Açık/koyu görünüm düğmesi (sırayla değiştirir, kısa yazı gösterir); `<head>`de yüklenir (renk sıçramasın diye), `<html data-theme>` yazar |
| `app.js` | Genel davranış: saat, sekmeler, şemalar, notlar, giriş, servis çalışanı kaydı. `window.OdyoUI` yardımcılarını açar; Firebase bağlantısını kurup `odyo:db`, `odyo:db-yok`, `odyo:yetki`, `odyo:metinler` olaylarıyla bildirir. |
| `akis.js` | Ana sayfa akışı: etkinlik/ilan/haber kartları, ayrıntı sayfası, yönetici paylaşım formu, fotoğraf küçültme (canvas, uzun kenar 1200 px, JPEG 0,75'ten kademeli; data URL ≤700 000 karakter). Metinler `index.html` `#a-metinler` |
| `vakalarim.js` | Vakalarım sekmesi: veri katmanı (`VakaDeposu`, şimdilik localStorage; fotoğraf eklenince IndexedDB'ye yalnızca bu katman değişir), form, odyogram çizimi, liste/ayrıntı, yedekleme ve CSV |
| `cikti.js` | Odyogram çıktısı: SVG sayfa → JPEG; PDF için küçük el yazımı PDF yazıcı. Renkler `--cikti-*` |
| `odybot.js` | OdyoBOT sohbet ekranı (düğmeli, kural tabanlı). Mesaj metinleri `index.html` `#b-metinler` |
| `maskeleme-kural.js` | Maskeleme kuralları (Katz). Ekrandan bağımsız, Node ile test: `node testler/maskeleme-test.js` |
| `odyo-hesap.js` | Hesap kuralları (PTA, derece, tip). Ekrandan bağımsız; Node ile `require` edilip test edilebilir. |
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
| Firestore | `duyurular` | Herkes okur, yalnızca admin yazar | `tur` ("etkinlik" / "ilan" / "haber"), `baslik` (≤140; haberde yok, diğerlerinde zorunlu), `kurum` (≤120, ilan), `tarih` (son başvuru, YYYY-AA-GG, ilan), `baslangic`, `bitis` (YYYY-AA-GG, etkinlik), `yer` (≤120, etkinlik), `metin` (haber ≤280 zorunlu, diğerleri ≤1000), `link` (yalnızca https, ≤300), `gorselId` (isteğe bağlı, ≤40), `olusturma`, `guncelleme` (zaman damgası). Bunların dışında alan kabul edilmez. **Eski kayıtlar** (2026-11-11 öncesi): `tur` "haber" + `metin` yok = sempozyum duyurusu; uygulama okurken etkinlik sayar (`tarih`→başlangıç, `kurum`→yer, `not`→metin). Veritabanında değiştirilmez; düzenlenip kaydedilince yeni biçime geçer. |
| Firestore | `gorseller` | Herkes okur, yalnızca admin yazar | `veri` ("data:image/jpeg;base64," ile başlar, <900 000 karakter), `olusturma`. Paylaşım silinince ya da fotoğrafı değişince eski görsel de silinir (tek seferde, batch). Firebase Storage ücretsiz planda kapalı olduğu için bu yol seçildi. |
| Firestore | `notlar` | Herkes okur, yalnızca admin yazar | `baslik` (≤100), `maddeler` (metin listesi, ≤40), `olusturma` |
| Firestore | `cihazlar/{cihaz kimliği}` | Herkes okur, yalnızca admin yazar | `maddeler` (metin listesi, 1–20), `guncelleme`. Kişisel veri değil. |
| Firestore | `icerik/{anahtar}` | Herkes okur, yalnızca admin yazar | `alanlar` (yalnızca değiştirilen alanlar: alan → metin, ≤20), `guncelleme`. Anahtarlar: `yolak.<id>`, `refleks.<id>`, `not.<sıra>`, `cihaz.<id>`, `metin.<data-k>`. Silinirse koddaki varsayılan metin döner. |
| Firestore | `ayar/tema` | Herkes okur, yalnızca admin yazar | `id` (tema adı), `guncelleme` |
| Cihaz (localStorage, anahtar `odybot:vakalar`) | vakalar (Vakalarım) | Yalnızca o cihaz | `id`, `surum`, `kimlik` (≤40, ad-soyad değil), `tarih`, `notlar` (≤2000), `olusturma`, `guncelleme`, `esik.{sag,sol}.{hava,kemik}.{Hz}` = `{db (-10..120 tam sayı), maskeli, maskDb, nr}` (boş frekans yazılmaz), `konusma.{sag,sol}` = `{srt, sds (0..100), sunum, maskeli}`, `mcl.{sag,sol}`, `ucl.{sag,sol}`, `weber` (orta/sag/sol/yapilmadi), `rinne.{sag,sol}` (pozitif/negatif/yapilmadi). Eski kayıtlardaki `etiket`/`not` okunurken taşınır. |
| Cihaz (sessionStorage) | `odybot:gonderilen` | Yalnızca o sekme | Vakalarım'dan OdyoBOT'a gönderilen vaka kimlikleri (değer değil); bot okuyunca siler |
| Cihaz (localStorage) | ayarlar | Yalnızca o cihaz | `odybot:gorunum` (light/dark; yoksa otomatik), `odybot:ptaTur` (3/4), `odybot:grafik` (tek/ayri), `odybot:araFrekans`, `odybot:yedekSayac`, `odybot:hatirlatmaKapali` |

- 8 temel ders notu veri deposunda değil, kodun içinde (`app.js`, `NOTES` dizisi).
- Firestore'un çevrimdışı önbelleği açık (`enablePersistence`). İnternet yokken son indirilen ilan ve notlar gösteriliyor.
- Vaka verisi cihazdan kendiliğinden çıkmaz: `VakaDeposu` yalnızca localStorage kullanır. Yazma başarısız olursa hata gösterilir ve eski veri korunur. Yedek dosyası (JSON/CSV) yalnızca kullanıcı isteyince indirilir/paylaşılır; ekranda bunun sorumluluğunun kullanıcıda olduğu yazar.

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
  - Odyogram (Vakalarım, 2026-11-09 kararı): hava yolu noktaları düz, kemik yolu noktaları kesikli çizgiyle birleşir; iki kulakta da aynı, renk kulağı gösterir (sağ kırmızı, sol mavi). Boş ana frekansta çizgi kopar, NR noktası çizgiye bağlanmaz.
  - İstisna, akustik refleks arkı (2026-11-09 kararı): renk **uyarılan** kulağı gösterir (sağ kırmızı, sol mavi). Düz çizgi kontralateral, noktalı çizgi ipsilateral yoldur.
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
- **Yönetici her metni düzenleyebilmeli (proje sahibinin kuralı, 2026-11-09).** Uygulamaya eklenen her yeni içerik, sorulmadan, otomatik olarak düzenlenebilir yapılır:
  - Koddaki veri nesneleri: `editable(nesne, alanlar)` + yenilemede `applyOv(anahtar, nesne)`; ekranda `adminPart(anahtar, nesne, alanlar, etiket)`. Yeni bölümün yenileme fonksiyonu `refreshContent()` içine eklenir.
  - `index.html`'deki sabit yazılar: öğeye `data-k="bolum.ad"` eklenir (yalnızca düz metin içeren öğeler).
  - Klinik metni ben yazarsam yine proje sahibine doğrulatırım; o da uygulamadan düzeltir.
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
6. ~~Vaka yedekleme~~ *Cevaplandı: JSON yedek (indir/paylaş), CSV tablo ve geri yükleme yapıldı (2026-11-09).*
7. Vaka formunda zaten bir uyarı var: "Hasta adı, soyadı, kimlik numarası gibi tanımlayıcı bilgi yazma. Anonim bir etiket kullan." Bu uyarı yeterli mi, yoksa daha güçlü bir önlem mi isteniyor?
8. ~~Cihaz görselleri ve açıklamaları~~ *Cevaplandı: proje sahibinin JPG'leri küçültülerek eklendi; açıklamaları yönetici uygulama içinden yazar.*
9. ~~Kaynak~~ *Katz (2026-11-10). Eşikler Vakalarım'dan gelir.* IA değerleri ve formüller: `PROGRESS.md` taslak tablosu onay bekliyor. Eski soru: OdyoBot için hangi kaynak esas alınacak? Hangi girdiler kullanılacak (frekanslar, hava ve kemik yolu eşikleri, kulaklık tipi)? Hangi interaural attenüasyon değerleri kullanılacak?
10. ~~İnternetsiz ilanlar~~ *Son indirilen kopya gösteriliyor; telefonda uçak moduyla doğrulandı.*
11. Uygulama şu an herkese açık: adresi bilen herkes açabiliyor. Bu durum kalıcı mı, yoksa ileride erişim sınırlanacak mı?
12. Test soruları hangi biçimde olacak (çoktan seçmeli vb.) ve içeriği kim hazırlayacak?
13. Mağaza paketi için geliştirici hesapları var mı? Paket hangi yöntemle hazırlanacak?
