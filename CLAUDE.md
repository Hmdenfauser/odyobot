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
| 1 | Ana sayfa | (1. adım, 2026-11-17) Üstten alta: üst satır (küçük logo, "Merhaba, odyolog" `ana.baslik`, tarih; saat yok; sağda dişli → Ayarlar), arama (`#ana-ara`: notlar, cihazlar, şema basamakları, bölüm adları; internetsiz; Türkçe harf farkı gözetmez; sonuca dokununca oraya gider), hızlı erişim (2026-11-18: Yeni vaka `#vakalarim/yeni`, Ses laboratuvarı `#seslab`, Terimler sözlüğü `#sozluk`, Cihazlar `#depo/isitme`), büyük 3D kartı (`#kart3d` → `#3d`; Yeni etiketi, başlık, açıklama, İncele, `images/3d-onizleme.jpg`; parıltı yalnızca hareket azaltma kapalıysa), Kaldığın yerden (son not `odybot:sonNot`, son vaka `odybot:sonVaka`; yoksa gizli), Favori notlar (`odybot:favoriNotlar`; yoksa gizli), Duyurular (süresi geçmemiş en yeni 5 kayıt, tür etiketi, küçük görsel, "Yeni" rozeti `odybot:sonZiyaret`; "Tümünü gör" → `#duyurular` süzgeçli tam liste ve yönetici formu `#duyurular/yeni`; ayrıntı `#duyuru/<kimlik>`). Akış ve form `akis.js`; ana sayfa yazıları `#ana-metinler` (yönetici). | Yayında (sw v27+). |
| 2 | Görsel depo | (a) İşitme yolakları: koklea'dan işitsel kortekse 9 basamaklı, dokunulabilir şema (akustik striyalar dahil). Her kutuda beyin bölgesi yazıyor; karşıya geçişler iki taraflı. Her basamakta konum, işlev, klinik not ve ABR dalga karşılığı var. (b) Akustik refleks arkı: simetrik, iki kulak da uyarılıyor. Dış kulaktan 7. sinire 7 basamak. (a) ve (b) proje sahibinin `ham-gorseller/` içindeki referans görsellerine bakılarak yeniden çizildi (2026-11-09); görseller uygulamaya konmadı. Düğmeler (2026-11-15 akşamı): **Şemalar · İşitme cihazları · İşitsel implantlar**; Şemalar'ın içinde sekme biçiminde alt düğmeler: İşitme yolağı · Refleks arkı · Yenidoğan taraması · İşitsel hafıza (2026-11-20, dal `isitsel-hafiza`: Atkinson ve Shiffrin 1968 modeli, `app.js` → `HNODES`, anahtarlar `hafiza.<id>`; `ham-gorseller/isitsel-hafiza/` slaytına bakılarak slayttaki gibi soldan sağa özgün çizildi; metinler taslak). (e) Yenidoğan taraması: iki dokunulabilir akış şeması (`app.js` → `TNODES`, anahtarlar `tarama.<id>`): "Tarama ABR protokolü" (risk yok / risk var, 3 tarama ABR; zamanlar 72 saat, 7–15 gün, 15–30 gün) ve "Yoğun bakım (5 günden fazla)" (5–30 gün: 2 tarama; 30–90 ve 90+ gün: 1 tarama). Proje sahibinin `ham-gorseller/yenidogan-tarama/` içindeki Sağlık Bakanlığı slaytlarına bakılarak özgün çizildi; slayt/logo konmadı; kaynak satırı ekranda. Renk: yeşil geçti/sağlam, turuncu kaldı/referans, gri risk nedeniyle sevk (`--akis-*`). Klinik metinler taslak, proje sahibi doğrulayacak. (c) İşitme cihazları: BTE, RIC, ITE tam/yarım konka, ITC, CIC, IIC, CROS/BiCROS, bantlı ve yapışkan adaptörlü kemik iletimli (11 kart; en başta tam genişlikte `kulak-ici-karsilastirma`). (c2) İşitsel implantlar: alt başlıklarla Koklear (ki, ki-elektrot, eas), Kemik iletim (baha-perkutan, transkutan-pasif, transkutan-aktif), Orta kulak (orta-kulak-yarim, orta-kulak-tam), Beyin sapı (abi-yuzey, abi-penetran). Liste `app.js` → `DEVICES` (kimlikler değiştirilmez). Her kartta rozet: işitme cihazları "Ameliyatsız", implantlar "Ameliyatlı", abi-penetran ek olarak "Araştırma aşamasında" (proje sahibi doğrulayacak); yazılar `app.js` → `ROZET`, yönetici de değiştirebilir. Görsele dokununca tam ekran (`goruntuleyici.js`: iki parmak, sürükleme, çift dokunuş, ✕/Esc/geri tuşu). Açıklamaları yönetici uygulama içinden yazar (kartta "Açıklama ekle/düzenle"); görselin sözlü anlatımı (alt metin) da düzenlenebilir. (d) **3D** artık Görsel depo'da değil, kendi sayfasında (`#3d`, bölüm kimliği `uc-boyut`; eski/benzer adresler `#3d`'ye yönlenir; alt çubukta Ana sayfa seçili görünür; üstte "← Ana sayfa"). İçerik (`gorsel3d/`): periferik işitme sisteminin döndürülebilir modeli (sağ kulak), 6 bölüm (Tüm sistem, Dış kulak, Orta kulak, İç kulak, Sinirler, Çevre yapılar), yapıya dokununca diğerleri silikleşir ve bilgi kartı açılır; kepçeye dokununca 11 bölümü renklenir; 5 görünüm düğmesi. Model (~4 MB) 3D sayfası ilk açılınca iner. Kaynaklar: OpenEar (Sieber ve ark., CC BY 4.0) ve Artec 3D kulak taraması (CC BY 3.0); "Kaynaklar" satırı lisans gereği ekranda kalmalı. Kepçenin arka yüzü, kepçe–kanal ara tüpü (2026-11-15'te dikişsiz yeniden çizildi) ve skala media ölçülmüş veri değildir; bölge sınırları yaklaşıktır. | (a)–(c) yapıldı (2026-11-09), açıklamalar boş, proje sahibi yazacak. (d) yapıldı (2026-11-14), sw v18, yayında; klinik metinleri proje sahibi uygulamadan doğrulayacak. Yeniden düzenleme, yeni görseller, 3D sayfası (2026-11-15, sw v21): **yayında**, telefonda denenecek. |
| 3 | OdyoBot | Alt çubuğun ortasında saydam logo (`icons/odyobot-logo-seffaf.png`, 56 px, çubuğun üstüne 22 px taşar; daire/halka/gölge yok; seçiliyken altında kısa çizgi). Vaka yorumlama asistanı (2026-11-17'den beri yalnızca maskeleme diye tanıtılmıyor; hızlı erişimde 2026-11-18'den beri yok; alt çubuktaki logodan açılır): düğmeli sohbet, vakalar Vakalarım'dan gelir (tek ya da çoklu), sonra görev seçilir: **Maskeleme kararları** (kulaklık sorulur; Katz, bkz. §7) ya da **Akustik refleks yorumu**; aynı vakada görevler arasında geçilebilir. Akustik refleks örüntüsü yorumu (2026-11-17, dal `refleks-yorum`): `refleks-kural.js` (Jerger ve Jerger 1977 örüntüleri, Clark Tablo 1 + ders slaytı 22–28), sade refleks arkı şemasında olası bölge turuncu; tanı koymaz. Test `testler/refleks-test.js`. | Yapıldı (2026-11-10): kurallar `maskeleme-kural.js` (Katz 7. baskı, Bölüm 6), plato rehberi, testler `testler/maskeleme-test.js`. Logo 2026-11-17 (v28). |
| 4 | Vakalarım (`#vakalarim`; eski adı Geçmiş, `#gecmis` yönlendirilir) | Vaka kaydı (yalnızca o cihazda). Liste (küçük odyogram + tip/derece ve ek test özeti), form (alt sayfa: geri oku + "Yeni vaka"/"Vakayı düzenle"; kimlik, tarih; kulak başına eşik tablosu: sütun frekans, satır Hava/Kemik, Sağ/Sol geçişi, Maskeli / Yanıt yok / Sonraki, maskeleme düzeyi, ara frekans anahtarı), canlı odyogram (tek/ayrı grafik; sembol açıklaması kapalı gelir), otomatik PTA/derece/tip (`odyo-hesap.js`). Açılır paneller: **Konuşma odyometrisi** (SRT, SDS/WRS, sunum düzeyi, MCL, UCL, Weber, Rinne), **Timpanometri** (tepe basıncı, kompliyans, kanal hacmi, tepe yok; üretilmiş eğri + Tip A alanı; tip A/As/Ad/B/C), **Akustik refleks** (ipsi/kontra × 500–4000 Hz; kulak = uyaranın verildiği kulak), **OAE** (DPOAE 1–8 kHz, TEOAE 1–4 kHz; sinyal/gürültü, fark, geçti/kaldı), **ABR** (şiddet, I/III/V latansı, dalgalar arası süreler, latans-şiddet grafiği, en çok 4 kayıt fotoğrafı — IndexedDB, galeriye kaydedilmez). Kaydedince ekranın üstünde bildirim (`OdyoUI.bildirim`). Yedekleme (JSON indir/paylaş — fotoğraflar dahil, CSV, geri yükle: birleştir/üzerine yaz), 10 kayıtta bir yedek hatırlatması. Çıktı JPEG/PDF (detaylı / yalnızca odyogram). "OdyoBOT'a gönder"; listede "Seç" ile çoklu gönderme. Ek testler `vaka-testler.js`. | Yapıldı (2026-11-09); eşik tablosu 1. adım (v27); ek testler 2. adım (v30, 2026-11-17). Ayrıntı: `PROGRESS.md` |
| 5 | Notlar | (1. adım) Ders notları konu gruplarında (başlıkta not sayısı; gruplar `ayar/notGruplari`, varsayılan Temel odyometri / İmmitansmetri / Elektrofizyoloji, başlıksızlar "Diğer notlar"), arama ve "kendi kaynağınla doğrula" uyarısı. Nota dokununca kendi sayfası `#not/<anahtar>` (geri oku, not adı, favori yıldızı; yöneticiye başlık seçimi). Yöneticiye açılır panel `#not-yonetim`: not ekle/düzenle/sil, başlık ekle/yeniden adlandır/sil. 8 temel not kodda (`NOTES`), eklenenler Firestore `notlar`. | Yayında (sw v27+). |

**Yönetici düzenlemesi:** Giriş yapınca her şema basamağında, ders notunda, cihaz kartında ve sayfa yazısında "Düzenle" bağlantısı çıkar. Değişiklik herkese yansır, "Varsayılana dön" ile geri alınır.

**Ayarlar (`#ayarlar`):** Ana sayfanın sağ üstündeki dişli düğmesiyle açılır, **herkese açık**. İçinde: Tema (Otomatik / Açık / Koyu, `gorunum.js`, yalnızca o cihazda), Dil (şimdilik yalnızca Türkçe), Yönetici girişi düğmesi. Yönetici giriş yapınca renk teması (Logo varsayılan + 5 tema, herkese yansır, `ayar/renk`) ve "Çıkış yap" görünür. Ders notu ekleme 2026-11-17'de Ayarlar'dan Ders notları sayfasındaki yönetici paneline taşındı.

**Yönetici girişi:** Ayarlar sayfasındaki "Yönetici girişi" düğmesi (`#giris`, geri bağlantısı Ayarlar'a döner). Ana sayfanın altındaki bağlantı kaldırıldı. E-posta ve şifre ile giriş (Firebase Authentication).

**Temalar:** Logo (varsayılan, 2026-11-17), Petrol, Lacivert, Orman, Bordo, Mor. Her temanın açık ve koyu hâli var.

**Tema / görünüm (açık/koyu):** Ayarlar'da üç düğme (Otomatik / Açık / Koyu); önceki ana sayfadaki döngülü simge düğmesi ve "Görünüm: …" yazısı kaldırıldı (2026-11-15). Otomatik cihazın moduna uyar. Seçim yalnızca o cihazda saklanır (`gorunum.js`, `odybot:gorunum`).

### Tamamlanan: PWA'ya taşıma (2026-11-06)
Uygulama **https://hmdenfauser.github.io/odyobot/** adresinde yayında. Proje sahibi telefonda şunları denedi ve hepsi çalıştı: giriş, ilan ekleme ve başka cihazda görme, ana ekrana ekleme, uçak modunda açılma.

### Tamamlanan: Cihazlar bölümü ve logo (2026-11-09)
- Ham görseller `ham-gorseller/` klasöründe (git dışında, `.gitignore`). Küçültülmüş kopyalar `images/devices/` altında (800 px, JPEG).
- Logo `ham-gorseller/logo/OdyoBOT.jpg` dosyasından üretildi: `icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `logo.png` (düğmedeki küçük logo).
- **Yenilenecek görseller** (güncel liste 2026-11-15; ayrıntı `PROGRESS.md` "Görsel depo yeniden düzenleme"):
  - Bütün kartların görseli var (2026-11-15 akşamı). Yüzey ABI'deki "İşlev görmeyen VIII. kranial sinir" etiketi ve oku proje sahibinin isteğiyle silindi.
  - Şüpheli eski fotoğraflar (proje sahibi kontrol edecek): ITE tam ve yarım konka, ITC.
- Görsel değiştirme yolu: yeni dosya `ham-gorseller/` altına konur. Claude uygunluk tablosu çıkarır (oran 4:3, Türkçe yazı, başlık, logo/filigran); onaydan sonra 1200 px JPEG (kalite 80, PowerShell System.Drawing) olarak `images/devices/` altına **yeni adla** (ör. `bte-2.jpg`) yazar, eskisini `ham-gorseller/yedek-cihaz-<tarih>/` altına taşır, `DEVICES` (img, gorselAlt) ve `sw.js` güncellenir. Betik: PowerShell'de `ac` adı Add-Content'in kısaltmasıdır, fonksiyon adı olarak kullanma.

### Tamamlanan: Vakalarım sekmesi (2026-11-09)
- 4 aşamada yapıldı, her biri ayrı commit (sw v6–v9). Kararlar ve testler `PROGRESS.md` içinde.
- Proje sahibinin verdiği klinik değerler: Clark derece tablosu ve 10 dB ABG eşiği (`odyo-hesap.js` başında, tek yerde). "Normal" sınırı tablonun ilk satırı (15 dB). Metinlerde "karma" değil "mikst".
- Proje sahibi telefonda denedi, her şey düzgün çalışıyor (2026-11-09).

### Tamamlanan: CSP, sekme sırası, çıktı, OdyoBOT iskeleti (2026-11-10)
- `index.html` başında CSP satırı (meta). Firebase'e yeni servis eklenirse adresi `connect-src`'ye eklenmeli.
- Alt çubuk sırası: Ana sayfa, Görsel depo, OdyoBOT, Vakalarım, Notlar.
- Odyogram çıktısı (`cikti.js`), Vakalarım → OdyoBOT gönderme, düğmeli sohbet (`odybot.js`). sw v12. Ayrıntı: `PROGRESS.md`.

### KALDIĞIMIZ YER (2026-11-21 gece, son durum v48) — oturum başında bunu özetle
**Durum:** Yayında **sw v48** (main). Yedek etiketleri GitHub'da (son: `yedek-yayin-v47`). Bekleyen kod değişikliği ve açık dal yok (yalnızca main).
**Proje sahibinin kararı (2026-11-21 gece):** forum/üyelik **şimdilik açılmayacak** (ayar/uyelik kapalı kalır). Ertesi gün devam edilecek.
**Firebase tarafında yapılanlar:** kurallar yapıştırıldı; Google girişi açık (destek e-postası odyobot hesabı, görünen ad "OdyoBOT"); yetkili alan adı tamam; e-posta şablonu Türkçe; odyobot Google hesabı projeye sahip olarak eklendi; yönetici hesabıyla forum denemesi çalıştı (e-posta doğrulandıktan sonra çıkış/giriş gerekiyordu, v47 ile düzeldi).
**Üyeliği açmadan önce kalan (proje sahibi):** (1) yasal metinlerdeki köşeli parantezli boşluklar (veri sorumlusu adı, iletişim e-postası; uygulamadan Düzenle ile, koda yazılmaz); (2) KVKK m. 9 yurt dışı aktarım cümlesi + metinler için hukukçu; (3) Ayarlar → Üyelik → "Yeni üye kaydı açık". Açıldıktan sonra: telefonda ikinci hesapla kayıt, iPhone ana ekran uygulamasında Google girişi, zil, doğrulanmamış hesabın yazamaması.
**Diğer bekleyenler:** taslak içerik doğrulamaları (iç kulak, denge, Corti, 112 sözlük terimi, yasal metinler); sözlükte yönetici ile gerçek yazma denemesi; ampulla kesiti animasyonu (başka gün); 5. adım yalnızca "sıradaki adıma geç" ile.
**Oturum başında hatırlat:** yukarıdaki üç madde + v46–v48 telefon denemesi (yeni alt çubuk, Kütüphane, zil, selam, yasal sayfalar).

### Önceki: KALDIĞIMIZ YER (2026-11-21 gece, v46)
**v48 (2026-11-21):** ana sayfa selamı "Merhaba, <görünen ad>" (giriş yoksa "odyolog"; kalıplar `uye.m.selamUye`/`selamMisafir`, eski `ana.baslik` kullanılmıyor), kayıt açıkken selamın altında "Giriş yap / Kaydol" (`#ana-giris`). Yedek `yedek-yayin-v47`.
**v47 (2026-11-21):** forum yazmadan önce giriş kimliği tazelenir (e-posta girişten sonra doğrulanınca kurallar eski kimliği "doğrulanmamış" görüyordu; proje sahibi çıkış/giriş ile aştı), izin reddi ayrı mesaj (`forum.m.hataYetki`). Yedek `yedek-yayin-v46`. **Proje sahibi yaptı (2026-11-21):** firestore.rules yapıştırıldı; Google girişi açıldı (destek e-postası odyobot hesabı, herkese görünen ad "OdyoBOT"); yetkili alan adı ve Türkçe e-posta şablonu; yönetici hesabıyla forumda gönderi denemesi çalıştı. **Kalan:** yasal metin boşlukları + hukukçu, sonra üyeliği açmak.
**Durum:** Yayında, son sürüm **sw v46** (main; dal `adim4-forum` birleşti: içinde `adim4-uye` ve `adim4-kutuphane`). Önceki yayının yedeği git etiketi `yedek-yayin-v45`. **4. adımın bütün parçaları yayında, üyelik KAPALI** (ayar/uyelik.kayitAcik yok/false): kullanıcılar Kütüphane, yeni alt çubuk, zil ve yasal sayfaları görür; Topluluk "Yakında".
**4. adım (v46):**
- **Alt çubuk:** Ana sayfa · Topluluk · OdyoBOT · Vakalarım · Kütüphane (proje sahibinin sırası). **Kütüphane** (`#kutuphane`) kartlı: Ders notları (`#notlar`), Şemalar/İşitme cihazları/İşitsel implantlar (`#depo/sema|isitme|implant`, her biri tek başına; üçlü geçiş gizli, başlık `#depo-bas` = kart adı), Terimler sözlüğü. Görsel depo ve Notlar sekmeleri kalktı (adresler çalışır).
- **Üye girişi** (`uye.js`): e-posta+şifre ve Google (açılır pencere; GitHub Pages'te yönlendirme üçüncü taraf depolamaya takılır). Ayarlar → Hesap / Hesabım (`#hesap`): görünen ad, meslek ('', ogrenci, odyolog, diger), doğrulama e-postası, şifre sıfırlama, çıkış, hesabı silme, engellenenler. Firestore `uyeler/{uid}` (yalnızca sahibi: ad, meslek, favoriler, sozluk, engelli, onay, olusturma, guncelleme) + herkese açık `profiller/{uid}` (ad, meslek; forumda güncel ad). Favoriler ve sözlük cihazlar arası birleşir. Yönetici aynı formdan girer; Ayarlar'da "Yeni üye kaydı açık" anahtarı (`ayar/uyelik`).
- **Topluluk / forum** (`forum.js`): `forum/{id}` + `cevaplar`, `sikayetler`; 4 kategori (Vaka tartışması, Cihaz ve implant, Ders ve sınavlar, Kariyer ve iş; adlar yönetici düzenler), fotoğraf yok, yazar adı + meslek rozeti, düzenle/sil, şikâyet, engelle, yönetici gizle/göster/sil + şikâyet listesi; yazmak için doğrulanmış e-posta; üyelik kapalıyken yalnızca yönetici görür. Hesabı silinen üye "Silinmiş üye". "Gizle" yalnızca görünümü saklar (kalıcı kaldırma: Sil).
- **Uygulama içi bildirim** (`zil.js`): ana sayfa sağ üstte zil; yeni duyurular + forumda gönderine gelen cevaplar (`sonCevapYazar`); son bakış `odybot:zilSon`. **Telefona bildirim yok** (proje sahibinin kararı; ileride GitHub Actions + FCM ücretsiz seçeneği konuşuldu, Blaze istemiyor).
- **Yasal metinler** (`#yasal/uyari|kosullar|kvkk|gizlilik`, `yasal.js`; Ayarlar → Yasal bilgiler): Claude'un TASLAĞI. Kayıtta koşul onay kutusu (onay zamanı `uyeler.onay`).
**Proje sahibinin yapacakları (üyeliği açmadan önce):** (1) **`firestore.rules` dosyasını Firebase konsoluna yapıştırıp yayınla** (uyeler, profiller, forum, sikayetler eklendi; yapıştırılmadan üye kaydı/forum çalışmaz). (2) Yasal metinlerde `[Veri sorumlusunun adı soyadı]` ve `[iletişim e-posta adresi]` boşluklarını uygulamadan (yönetici Düzenle) doldur; koda yazılmaz (depo herkese açık). (3) KVKK m. 9 yurt dışı aktarım dayanağını bir hukukçuyla netleştir; metinleri doğrula (18 yaş, sorumluluk sınırı). (4) Firebase konsolu: Authentication → Google girişini aç; yetkili alan adlarında `hmdenfauser.github.io` olduğunu kontrol et; e-posta şablonlarının dilini Türkçe yap. (5) Sonra Ayarlar → "Yeni üye kaydı açık".
**Telefonda denenecek:** yeni alt çubuk ve Kütüphane, zil, yasal sayfalar; üyelik açılınca: kayıt, Google girişi (iPhone ana ekran uygulamasında sorun çıkabilir), forum.
**Kullanım istatistiği / tez:** proje sahibi ileride yüksek lisans için istatistik isteyebilir: kişisel olmayan toplam sayılar ya da etik kurul onayı + ayrı açık rıza + anonim dışa aktarma (konuşuldu, yapılmadı).
**Sıradaki:** 5. adım yalnızca "sıradaki adıma geç" ile; ampulla kesiti animasyonu başka gün. Temizlik: `adim4-uye`, `adim4-kutuphane`, `adim4-forum` dalları silinebilir.

### Önceki: KALDIĞIMIZ YER (2026-11-21 gece, v45)
**Durum:** Yayında, son sürüm **sw v45** (main; dal `corti-sinyal` birleşti). Önceki yayının yedeği git etiketi `yedek-yayin-v44`. Bekleyen kod değişikliği yok. **Eski dalların hepsi silindi** (2026-11-21, proje sahibinin onayıyla; yalnızca main var).
**v45:** Ses laboratuvarı → Corti organı: işitme siniri lifindeki sinyal daha geniş (gauss 0,085), tam renk/opak (`--kt-elek`), daha yavaş (lif boyunca ≈1,7 sn, `sp += dt * 0.9`); en öndeki İTH lifi boyunca ilerleyen mor küre (`kortiAnim` → `LIF`, `AKSON`).
**Bekleyen (proje sahibi başka gün):** Ses laboratuvarında ampulla kesiti (krista + kupula) 3D animasyonu.
**Telefon denemesi (2026-11-21):** proje sahibi v42–v45 yeniliklerini telefonda denedi: çalışıyor.
**Oturum başında hatırlat:** sözlükte yönetici olarak gerçek veritabanı yazma denemesi (düzenle/sil/geri getir) hâlâ yapılmadı; taslak metinlerin doğrulanması (iç kulak, denge, Corti, sözlük); sıradaki büyük iş 4. adım (yalnızca "sıradaki adıma geç" ile).

### Önceki: KALDIĞIMIZ YER (2026-11-21 gece, v44)
**Durum:** Yayında, son sürüm **sw v44** (main; dallar `denge-yazilar` ve `periferik-simgeler` birleşti). Önceki yayının yedeği git etiketi `yedek-yayin-v43`. Bekleyen kod değişikliği yok.
**v44 (2026-11-21):**
- **Denge sistemi (3D):** modelde "Utrikulus" / "Sakkulus" yazıları (makula ortasında; `denge3d.js` → `ETIKET`, yer model yüklenince hesaplanır; yazı `etiket` alanı, yönetici düzenler) + sağ altta yazıları gizle/göster. `korti.js` etiketleri artık yeri sonradan verilebilir (`k.p`).
- **Periferik (3D):** bölüme göre yapı adları (`gorsel3d-veri.js` → `etiketler`; Tüm sistem görünümünde **hiç yazı yok**, proje sahibinin isteği), çakışan yazı aşağı kayar, seçilince yalnızca seçilenin yazısı; sağ altta yazıları gizle/göster. Yalnızca üst katman; çizim/kamera/dokunma hesapları değişmedi. Temporal kemik yazısı kaldırıldı (yanlış yere düşüyordu); Sigmoid sinüs yazısının yeri proje sahibince doğrulandı (2026-11-21).
- **Periferik bölüm düğmeleri simgeli** (tek satır 6 düğme, ad ipucunda; `ipucu.js` bolumDis/bolumOrta/bolumIc/bolumSinir/bolumCevre, Tüm sistem = genel). Orta kulak: malleus-inkus-stapes; iç kulak: koklea.
**Oturum başında hatırlat:** telefonda v44 (yazılar, gizle/göster, simgeli bölüm düğmeleri, uzun basınca ad) + aşağıdaki v43 maddeleri. Temizlik: `denge-yazilar`, `periferik-simgeler` dalları da silinebilir.

### Önceki: KALDIĞIMIZ YER (2026-11-21 gece, v43)
**Durum:** Yayında, son sürüm **sw v43** (main; dal `opak-tuval` birleşti). Önceki yayının yedeği git etiketi `yedek-yayin-v42`. Bekleyen kod değişikliği yok.
**v43 (2026-11-21):**
- **Opak tuval** (seslab.js, korti.js): arka plan WebGL içinde boyanır (`ARKA`, `gl.clearColor`) + `blendFuncSeparate`; telefonda modellerin bilgisayardakinden saydam görünmesi düzeltildi. Saydamlık yine yalnızca `LABIRENT_A`.
- **Denge düğmeleri:** sol altta büyüteç (uzak/yakın) + oynat/duraklat (eski "Tümünü oynat"; alttaki ▶ kaldırıldı); sağ altta baş, ↺ ↻, Başa dön (vestibüler simge). Hepsi yazısız, ipuculu.
- **Büyüteç her model ve animasyonda** (`SesLabIpucu.buyutec`): 3D Periferik/Denge/İç kulak, Ses laboratuvarı İşitme/Denge/Dağılma (engel çevresine 1,7×, `sahne.odak`)/Corti. Yazılar `metinler.yakinlastir/uzaklastir` (yönetici). İpucu artık düğmenin üstünde ortalı, çerçeve içinde.
- **Corti animasyonu uzaktan açılır:** `genelZoom` 1,8 (açılış ve genel görünüm düğmesi); büyüteç bunun yarısına yaklaşır.
**Krista/kupula kararı (2026-11-21):** Denge sistemi 3D modeline krista ve kupula eklenip denendi, proje sahibi istemedi, silindi (dal yayına girmedi). **İleride:** iç kulaktaki Corti kesiti gibi bir **ampulla kesitinin (krista + kupula) 3D animasyonlu hâli**, Ses laboratuvarında yapılacak (proje sahibi isteyince).
**Oturum başında hatırlat:** telefonda v43: Denge saydamlığı telefonda da bilgisayardaki gibi mi, sol alttaki düğmeler, büyüteçler, Corti açılış uzaklığı. Aşağıdaki v42 hatırlatmaları hâlâ geçerli. Temizlik: `opak-tuval` dalı da silinebilir.

### Önceki: KALDIĞIMIZ YER (2026-11-21 gece, v42)
**Durum:** Yayında, son sürüm **sw v42** (main; dal `adim3-modeller` birleşti). Önceki yayının yedeği git etiketi `yedek-yayin-v41`. Bekleyen kod değişikliği yok.
**Oturum başında hatırlat:** (1) Telefonda dene: 3D modeller listesi, Denge sistemi ve İç kulak yapıları (dokunma, yazıları gizle/göster), Ses laboratuvarı → Corti organı (oynat/duraklat, İTH/DTH, K⁺ noktaları, membranın bükülmesi); önceki sürümlerin telefon denemeleri de bekliyor. (2) Doğrulanacak taslak metinler: iç kulak (17 yapı), denge sistemi (9 yapı), Corti animasyonu aşama yazıları ve açıklaması, sözlük terimleri. (3) 3. adımda kalan: proje sahibi isterse ampulla içinde krista/kupula; sonra "sıradaki adıma geç" (4. adım: üye girişi, forum, bildirim). (4) Temizlik: `adim3-modeller`, `sozluk-yon`, `sozluk-temel`, `denge-saydamlik` ve eski dallar silinebilir.
**v42 ayrıntısı:**
- **Kural (proje sahibi, 2026-11-21):** 3D sekmesinde **yalnızca hareketsiz modeller** var: Periferik işitme sistemi, Denge sistemi, İç kulak yapıları. **Bütün animasyonlar (yapılan ve yapılacak) Ses laboratuvarında.** 3D listesine Ses laboratuvarına giden bağlantı konmaz; BPPV, kristal kayması, manevra 3D'de olmaz.
- **3D modeller listesi** (`#3d`): `#3d/periferik` (gorsel3d/, eski 3D sayfası; eski adresler buraya), `#3d/denge` (korti/denge3d.js), `#3d/korti` (korti/korti.js, listede adı "İç kulak yapıları"). Başlıklar `#uc-metinler` (yönetici). Ana sayfa 3D kartı: "3D modeller".
- **Ortak görüntüleyici** `korti/korti.js` → `Korti.goruntuleyici(kok, ayar)`: kodla ya da dosyadan gelen parçalar, grup (alt parçalar tek yapı), saydam parça (derinlik ön geçişi), dokunarak/listeden seçme, seçilene yaklaşma, genel görünüm düğmesi.
- **İç kulak yapıları** (koklea kesiti): kodla çizilen şematik dilim, 17 yapı. Metinler taslak (ders notu: İşitme ve Denge Sistemleri-1 iç kulak, slayt 8–20). İnternette uygun lisanslı hazır model bulunamadı.
- **Denge sistemi:** labirent (vest, ant, post, lat, crus, amp) periferik.bin'den, tek saydamlık `LABIRENT_A` 0,68; utrikulus/sakkulus makulaları + otolitik membran `SesLabDenge.makulalar` ile hareketsiz. 9 yapı, metinler taslak (periferik vestibüler sistem dersi). Krista/kupula çizilmedi.
- **İç kulak yapıları düzeltmesi:** spiral ligament–stria çakışması (kırmızı benekler) giderildi; geniş yapıların içinde küçük ad yazıları (`etiket` alanı, yönetici düzenler; `korti.js` → `ETIKET_3D`, çerçeveden taşmaz, yüz kameraya dönük değilse gizli).
- **Ses laboratuvarı → Corti organı** (`#seslab/corti`, `Korti.kurAnim`, yazılar `KORTI_VERI.anim`, yönetici: `korti.anim.genel`, `korti.anim.metin`): sesten elektriğe dönüşüm. Baziler membran yukarı/aşağı (yavaşlatılmış, `PERIYOT` 2,6 sn, `GENLIK` 0,095); organ OSL ucu, tektoryal membran limbus çevresinde döner → kayma → DTH tüyleri bükülür; İTH tüyleri hıza bağlı (fazı önde); depolarize hücre pembe (`--kt-vurgu`), DTH kısalır (elektromotilite); K⁺ sarı noktalar kısa tüy uçlarından girer, glutamat yeşil (İTH tabanı), sinirde mor aksiyon potansiyeli. Aşama yazısı modelin altında. Kaynak: ders notları (İşitme ve Denge Sistemleri-1, ECochG dersi) + NCBI. Metinler taslak. Hareket azaltma açıksa duraklatılmış başlar.

### KALDIĞIMIZ YER (2026-11-21, v41) — oturum başında bunu özetle
**Durum:** Yayında, son sürüm **sw v41** (main; dal `sozluk-yon` birleşti). Önceki yayının yedeği git etiketi `yedek-yayin-v40`. Bekleyen kod değişikliği yok.
**v41 (2026-11-21), sözlük kaydırma yönü (proje sahibinin kararı, kırmızı olumsuzu çağrıştırdığı için):** sola at = **Biliyorum**, mavi X damgası; sağa at = **Tekrar et**, kırmızı yuvarlak damgası (odyogram sembolleri, renkler `--left`/`--right`). Düğmeler: solda "← Biliyorum", sağda "Tekrar et →"; klavyede sol ok biliyorum, sağ ok tekrar. Öğrenme durumu korunur.
**v40 (aşağıda) de yayında.**

### Önceki: KALDIĞIMIZ YER (2026-11-21, v40)
**Durum:** Yayında, sürüm **sw v40** (main; dallar `denge-saydamlik` ve `sozluk-temel` birleşti). Önceki yayının yedeği git etiketi `yedek-yayin-v39`.
**v40 (2026-11-21):**
- **Denge saydamlığı tek kural:** vestibül + bütün kanallar `seslab.js` → `LABIRENT_A` (0,55) ile çizilir; sahne, adım, yakın/uzak görünüm ve dokunarak seçme saydamlığı değiştirmez (önceden her parçanın ayrı sayısı vardı, seçim ve makula yakın görünümü de değiştiriyordu: proje sahibinin "her güncellemede saydamlık değişiyor" şikâyetinin nedeni). Derinlik ön geçişi (geçiş 0,5, `colorMask` kapalı) + 1. geçişte `LEQUAL`: yalnızca en öndeki yüzey boyanır, önde/arkada sırası doğru, üst üste binen yerler koyulaşmaz. Saydamlık değişecekse yalnızca `LABIRENT_A` değişir.
- **Kristaller:** beyaz (`--sl-kristal` #FFFFFF, iki temada), 30 küçük tane (`KRISTAL_SAYI`, `kristalAg(0.2)`, `denge.js` `ARALIK` 0,05), arkalarında sönen iz (`IZ_ARALIK` 0,2 mm, `IZ_SAYI` 11, `IZ_OMUR` 1,8 sn). Tuşlara dokunulmadı.
- **Terimler sözlüğü: 112 temel terim** (`sozluk-veri.js`, `window.SOZLUK_TEMEL`, kimlikler t001…t151 arası, boşluklu; değiştirilmez). Proje sahibinin Drive'daki ders notlarından seçildi (Enstrümantasyon, Elektrofizyoloji, İşitme ve Denge Sistemleri-1, Ayırıcı Tanı, Davranışsal Testler, Vestibüler Değerlendirme, Psikoakustik, İşitme Cihazları-1, İmplantlar-1, Tinnitus). **Açıklamalar Claude'un taslağı, proje sahibi doğrulayacak.** Yönetici düzenlerse `sozluk/<kimlik>` (set+merge) koddakinin yerine geçer, "Varsayılana dön" siler; silme `icerik/sozluk-gizli.<kimlik>` ile gizler, panelde "Hepsini geri getir". firestore.rules değişmedi.
**Oturum başında hatırlat:** (1) Telefonda: Denge'de saydamlık, beyaz kristaller ve iz; Otolit yakın görünümünde vestibül ekranı fazla kaplıyor mu (önceden %8'di, artık tek kurala bağlı). (2) Sözlük: yönetici olarak bir temel terimi düzenle/sil/geri getir — **gerçek veritabanına yazma ilk kez denenecek**. (3) Terim açıklamalarının doğrulanması. (4) Yol haritası 5 adımlı `YOL-HARITASI.md` (proje sahibi 2026-11-21 doğruladı; "8 adım" karışıklıktı). (5) Önceki notlardaki telefon denemeleri ve doğrulamalar hâlâ geçerli. Temizlik: `denge-saydamlik`, `sozluk-temel`, `denge-bas` ve eski dallar silinebilir.

### Önceki: KALDIĞIMIZ YER (2026-11-20 gece, v39)
**Durum:** Yayında, son sürüm **sw v39** (main; dal `denge-bas` birleşti). Önceki yayının yedeği git etiketi `yedek-yayin-v38` (GitHub'da). Bekleyen kod değişikliği yok.
**v39 (2026-11-20), Denge:**
- Kanallar (`KANAL`) denge kipinde **opak** (a=1): yarı saydamken derinlik yazılmadığı için arkadaki kanal öndekinin önünde görünüyordu (proje sahibi: "modellerde sorun var"). Kristaller/makulalar 3. geçişte en üstte.
- **Baş** ayrı geçişte (−1) her şeyden önce, derinlik yazmadan çizilir; opaklık artırıldı (deri/boyun 0,28, kulak 0,55, burun 0,5, yüz 0,6). Sağ altta ↺ ↻'nin solunda **baş aç/kapa** simge düğmesi (`.sl-bas-tus`, simge `bas`/`basYok`, ipucu "Başı gizle"/"Başı göster"; yalnızca uzak görünümde; durum cihazda saklanmaz).
- Yakın görünümdeki eski "Başı göster" düğmesinin adı **"Uzaklaştır"** (`sl.metin` basiGoster).
- Proje sahibi "modellerde sorun" derken başka bir şey kastettiyse (sahne/adım, telefon ekran görüntüsü) bekleniyor.
**Oturum başında hatırlat:** v38 notundaki telefon denemeleri + baş aç/kapa ve kanalların telefonda görünümü. Diğer maddeler aşağıdaki notlarda. Temizlik: `denge-bas` dalı da silinebilir.

### Önceki: KALDIĞIMIZ YER (2026-11-20 gece, v38)
**Durum:** Yayında, son sürüm **sw v38** (main; dal `seslab-duzeltme` birleşti). Önceki yayının yedeği git etiketi `yedek-yayin-v37` (GitHub'da). Bekleyen kod değişikliği yok.
**v38 (2026-11-20):**
- **Denge: semisirküler kanallar silikleşmiyor.** Neden: uzak görünümde silik baş yarı saydam geçişte en son çiziliyor, kanalların üstüne biniyordu. Düzeltme `seslab.js` → `cizimSirasi()` (önce baş, sonra diğerleri, en son kanallar) + kanal opaklığı %45 → %85 (BPPV arka kanal %82). Kristaller/makulalar 3. geçişte en üstte, görünür kalıyor.
- **Animasyonların sağ alt köşesi** (`.sl-sag-alt`, `.sl-yuv`): yalnızca simgeli yuvarlak düğmeler; yazı ipucunda (fareyle üzerine gelince ya da ≈0,5 sn uzun basınca; uzun basış tıklama sayılmaz). Ortak dosya `seslab/ipucu.js` (`window.SesLabIpucu`: simgeler oynat/duraklat/genel, `bagla`). **Genel görünüm** düğmesi (simge: kepçe → dış kulak yolu → zar → kemikçik → koklea sarmalı, ipucu "Genel görünüme geç"): Ses laboratuvarı İşitme'de her sahnede (basınca Ses yolculuğu + başlangıç açısı) ve **3D sayfasında eski "← Geri" yerine** her görünümde (basınca Tüm sistem + başlangıç açısı; artık adım adım değil). Oynat/Duraklat da sağ altta simgeli (İşitme ve Dağılma). Frekans çubuğuna dokununca Koklea'ya geçiş sürüyor.
- Proje sahibinin isteği: düğmeler hep sağ altta, yazısız, simgeli; "eksik yapma" — düğme her görünümde bulunmalı.
**Oturum başında hatırlat (sırayla):**
1. **Telefonda denenecekler (v33–v38, hiç denenmedi):** v38 gelmeli; uzun basınca ipucu çıkıyor mu, telefonun kendi menüsü açılıyor mu; Denge'de kanallar artık net mi (BPPV'de kristaller arka kanalın içinde görünüyor mu); 3D ve İşitme'de genel görünüm düğmesi; Dağılma sayı doğrusu; İşitsel hafıza.
2. Aşağıdaki "2026-11-20 akşam" listesinin 2–3. maddeleri ve "2026-11-20 öğle" listesinin 2–7. maddeleri hâlâ geçerli. Temizlik: `isitsel-hafiza`, `seslab-golge`, `seslab-duzeltme` dalları da artık silinebilir (proje sahibi onaylarsa).

### Önceki: KALDIĞIMIZ YER (2026-11-20 akşam)
**Durum:** Yayında, son sürüm **sw v37** (main; dallar `isitsel-hafiza` ve `seslab-golge` birleşti). Önceki yayının yedeği git etiketi `yedek-yayin-v36` (GitHub'da). Bekleyen kod değişikliği yok.
**v37 (2026-11-20):**
- **Görsel depo → Şemalar → İşitsel hafıza** (4. alt sekme): Atkinson ve Shiffrin (1968) bellek modeli, proje sahibinin slaytı (`ham-gorseller/isitsel-hafiza/`) gibi soldan sağa; bellek kutuları turuncu kenarlı (`--hf-bellek`), seçilince kutu kendi rengiyle dolar (bellek turuncu, süreç turkuaz, bozulma gri). `app.js` → `HNODES`, `icerik/hafiza.<id>`. Ekoik bellek 250 ms slayttaki değer (kaynaklara göre değişir, notta yazıyor).
- **Ses laboratuvarı → Dağılma (difraksiyon)** (`#seslab/dagilma`, `seslab/dagilma.js`, 2D canvas): iki sahne **Duvar** (yandan; kaynak, ≈70 cm duvar, bina; 125–4k) ve **Baş gölgesi** (üstten; 250–8k). Frekans İşitme'deki gibi sürüklenen sayı doğrusu. 500 Hz (duvar) = dalga boyu eşit → proje sahibinin cümlesi ("kırınım gerçekleşir … kısmi bir akustik gölge oluşur"), çizimde yalnızca gri "kısmi akustik gölge" yazısı (halka/tarama/"kırınım" etiketi proje sahibinin isteğiyle kaldırıldı). Terim "saçılma" değil **"kırınım"**. Kaynak: Psikoakustik 1. ders s. 37 (s. 38 telifli kitap fotoğrafı, kullanılmadı), 2. ders sl. 72, 3. ders sl. 5; İşitme ve Denge Sistemleri-2 s. 22–24.
**Oturum başında hatırlat (sırayla):**
1. **Telefonda denenecekler (v33–v37, hiç denenmedi):** v37 gelmeli; İşitsel hafıza kutuları (dokununca renk, okunurluk); Dağılma: sayı doğrusunu parmakla sürükleme (sayfa kaymadan), iki sahne, animasyon akıcılığı; önceki listedeki Ses laboratuvarı/Denge/sözlük maddeleri.
2. **Doğrulama:** İşitsel hafıza kart metinleri (taslak); Dağılma: duvar ≈70 cm ve baş ≈18 cm şematik kabul, "eşit" aralığı (dalga boyu engelin 2/3'ü–1,5 katı, şematik), açıklama metinleri.
3. Aşağıdaki 2026-11-20 listesinin 2–7. maddeleri hâlâ geçerli (sözlüğe ilk terimler, klinik doğrulamalar, bekleyen içerik işleri, sıradaki büyük iş, eski dalların temizliği — artık `isitsel-hafiza` ve `seslab-golge` de silinebilir).

### Önceki: KALDIĞIMIZ YER (2026-11-20 öğle)
**Durum:** Yayında, son sürüm **sw v36** (main; dal `seslab-secim` birleşti). Önceki yayının yedeği git etiketi `yedek-yayin-v35` (GitHub'da). Bekleyen kod değişikliği yok.
**v36 (2026-11-20) — Ses laboratuvarı düzeni (proje sahibinin isteği):**
- Girişte **İşitme / Denge seçim ekranı** (`#seslab`, `#sl-secim`, yazılar `sl.secim.*` düzenlenebilir). Seçilince ekran gizlenir, laboratuvar açılır: `#seslab/isitme`, `#seslab/denge`; başlığın sağında kip adı (`#sl-kip-ad`). Geri oku/telefon geri tuşu: önce seçim ekranı, sonra ana sayfa. Üstteki eski İşitme | Denge geçişi kaldırıldı. Model ilk seçimde iner.
- **Denge:** sahne tuşları (Otolit · BPPV–Epley) ve adım tuşları animasyonun hemen altında, küçük, yalnızca kısa yazı (`kisa` alanı, yönetici düzenler). **Emoji denendi, proje sahibi beğenmedi, kaldırıldı.** Yükseklik 44 px (dokunma kuralı).
- **Tümünü oynat** artık ▶ / ❚❚ Duraklat / ▶ Devam et (kaldığı yerden; duraklatınca baş ve kristaller durur). Elle seçilen adımdan başlar; son adımdaysa baştan. Yazılar `sl.metin` tumunuOynat, tumunuDurdur, devamEt.
- **İşitme:** frekans tuşları yerine **sürüklenebilen sayı doğrusu** (125–8k çentikleri, standart frekanslara oturur; çentiğe dokununca da gider), "Frekans: … Hz" başlıkta. Sayı doğrusu + Sesi çal animasyonun hemen altında. Çubuğa dokununca otomatik **Koklea** sahnesine geçer.
**Oturum başında hatırlat (sırayla):**
1. **Telefonda denenecekler (v33–v36, hiç telefonda denenmedi):** uygulamayı kapatıp açınca v36 gelmeli; Ses laboratuvarı seçim ekranı ve geri tuşu; frekans çubuğunu parmakla sürükleme (sayfa kaymadan çalışıyor mu) ve Koklea'ya geçiş; Sesi çal; Denge: küçük tuşlar, Duraklat/Devam et, ↺ ↻ Başa dön, Başı göster/Yakınlaştır, otolit tanelerinin görünürlüğü; sözlük kartlarını parmakla atma; hızlı erişim simgeleri.
2. **İlk terimleri ekle** (Terimler sözlüğü, yönetici). Gerçek veritabanına yazma hiç denenmedi; ilk eklemede birlikte kontrol et.
3. **Klinik doğrulama (taslak metinler):** Ses laboratuvarı sahne metinleri ve frekans notu; Denge: Dix-Hallpike/Epley açıları ve adımları, nistagmus tarifi, makula açıklamaları. Bilinen sadeleştirmeler: kristaller utrikulusa 3. adımda geçiyor, baş şematik, bekleme süreleri kısaltıldı.
4. **2026-11-17'den kalan, telefonda denenmemiş:** eşik tablosu (iPhone klavyesi Maskeli/Yanıt yok/Sonraki düğmelerini kapatıyor mu), Timpanometri/Refleks/OAE/ABR panelleri, ABR fotoğrafı (kamera, galeriye düşüyor mu), Yedeği paylaş, OdyoBOT görev seçimi ve refleks yorumu. Doğrulama: refleks yorumu metinleri, OAE frekansları/6 dB ölçütü, timpanogram tip sınırları.
5. **Bekleyen içerik işleri:** cihaz kartlarının açıklamaları; yenidoğan taraması taslak metinleri; "Araştırma aşamasında" rozeti; şüpheli eski cihaz fotoğrafları (ITE tam/yarım konka, ITC); 3D model klinik metinleri.
6. **Sıradaki büyük iş proje sahibinin kararı** (YOL-HARITASI.md): ör. koklea kesiti şeması (Corti organı; parça listesi onayı + referans görsel bekleniyor), test soruları, mağaza paketi. Açık sorular §10: 7, 11, 12, 13.
7. **Temizlik:** yayına giren eski dallar (`adim3-seslab`, `sozluk`, `kisayol-cihaz`, `denge-gorunurluk`, `denge-duzenleme`, `seslab-secim`) ve gereksiz `sozluk-yedek` proje sahibi onaylarsa silinir.
**Önizleme yöntemi (2026-11-20):** yerel sunucu (`node sunucu.js`, port 8765, geçici klasörde) + varsayılan tarayıcı (`Start-Process http://127.0.0.1:8765/#seslab`). Ayrı profilli Edge `--app` penceresinde animasyon görünmedi; onu kullanma.

### Önceki: KALDIĞIMIZ YER (2026-11-18 akşam)
**Durum:** Yayında, son sürüm **sw v35** (main; v33 + Denge görünürlük düzeltmesi v34 + Denge düzenleme v35). Önceki yayınların yedeği git etiketleri `yedek-yayin-v32`, `-v33`, `-v34` (GitHub'da).
**v34 düzeltmesi (2026-11-18, proje sahibi: "kristaller ve kanallar silik", telefon + bilgisayar):** kristaller ve otolitler belirgin turuncu (`--sl-kristal`, `--sl-otolit`, koyu temada açık turuncu); kristaller ve makulalar en son, derinlik temizlenip her şeyin üstünde çizilir (`ODAK`, 3. geçiş); denge kipinde kanallar %45, BPPV'de posterior kanal %62 opak; vestibül %18; silik baş %10; makulaya yakınken çevre yapılar %8. Bu yayında üç bağımsız iş birleşti (her biri kendi dalında yapıldı: `adim3-seslab`, `sozluk`, `kisayol-cihaz`; birleşik deneme dalı `onizleme-birlesik`). Eski `sozluk-yedek` dalı artık gereksiz, silinebilir.
**Ana sayfa hızlı erişimi:** Yeni vaka · **Ses laboratuvarı** (OdyoBOT asistanı yerine; simge ABR dalga formu, V. dalganın üstünde "V") · **Terimler sözlüğü** (Ders notları yerine; simge bilgi kartı, soru işaretli) · **Cihazlar** (simge kulak arkası işitme cihazı). OdyoBOT'a alt çubuktaki logodan, ders notlarına Notlar sekmesinden girilir.
**Yayınlananlar (2026-11-18):**
- **Ses laboratuvarı** (`#seslab`, `seslab/`): üstte **İşitme | Denge** geçişi. İşitme: Ses yolculuğu (kepçe dahil), Dış kulak, Orta kulak (inkus malleusu geriden izler), Koklea (Greenwood ile yürüyen dalga, 125–8000 Hz, VIII. sinirde mor elektriksel sinyal), Enerji dönüşümü şeridi, "Sesi çal". Denge (`seslab/denge.js`, test `testler/denge-test.js` 12/12): Otolit organları (utrikulus/sakkulus makulası; baş eğilince/hızlanınca otolit zarı kayar, tüy demetleri bükülür) ve BPPV ve Epley (sağ posterior kanal; Başlangıç → Dix-Hallpike → Epley 2–4 → Sonuç; kristaller yerçekimiyle kanalda kayar; silik 3B baş; uzaklaş-dön-yakınlaş akışı; Başı göster/Yakınlaştır; **Tümünü oynat**). Animasyon WebGL ile elle yazıldı (kütüphane yok). `gorsel3d/` hiç değişmedi.
- **Terimler sözlüğü** (`#sozluk`, `sozluk.js`): öğrenme kartları (ön: Türkçe kalın + İngilizce küçük; dokununca döner, arkada açıklama; sağa at = biliyorum, aralıklı tekrar 1/3/7/16/35 gün; sola at = tekrar listesi), Türkçeye göre alfabetik liste ve arama, Tekrar listesi, yönetici Terim ekle/Düzenle/Sil. Firestore `sozluk`; **firestore.rules proje sahibi tarafından konsola yapıştırıldı** (2026-11-18; okuma dışarıdan doğrulandı). Henüz terim yok.
**v35 (2026-11-18, dal `denge-duzenleme`, yayında):** doğal otolit taneleri, denge kipinde tek oynatma tuşu (Tümünü oynat), küçük manevra tuşları modelin altında, ↺ ↻ ve Başa dön. Yedek etiketi `yedek-yayin-v34`.
**Oturum başında hatırlat:**
1. **Telefonda denenecekler:** uygulamayı kapatıp açınca v35 gelmeli; Ses laboratuvarı (3B akıcılığı, Sesi çal, Denge kipi: otolit taneleri belirgin ve doğal mı, Tümünü oynat, küçük manevra tuşları, ↺ ↻ ve Başa dön, Başı göster/Yakınlaştır); sözlük kartları (parmakla sola/sağa atma, çevirme); yeni simgeler.
2. **İlk terimleri ekle** (yönetici, Terimler sözlüğü sayfasının altı). Gerçek veritabanına yazma henüz hiç denenmedi; ilk eklemede birlikte kontrol et.
3. **Klinik doğrulama (taslak metinler):** Ses laboratuvarı sahne metinleri ve frekans notu; Denge: Dix-Hallpike/Epley açıları ve adımları, nistagmus tarifi, makula açıklamaları (Epley 1992, AAO-HNS 2017'den bilgiyle yazıldı, makaleler okunmadı). Bilinen sadeleştirmeler: kristaller utrikulusa 3. adımda geçiyor; baş şematik; bekleme süreleri kısaltıldı.
4. Aşağıdaki 2026-11-17 listesi (telefonda denenmemiş 2. adım işleri, refleks/OAE doğrulamaları) hâlâ geçerli. Sıradaki işi proje sahibi belirleyecek (YOL-HARITASI.md).
**Temizlik:** yayına giren dallar (`adim3-seslab`, `sozluk`, `kisayol-cihaz`, `denge-gorunurluk`, `denge-duzenleme`) main'de; `sozluk-yedek` artık gereksiz, proje sahibi onaylarsa silinir. Bu not (2026-11-18 gece) yalnızca yerel commit; bir sonraki yayınla GitHub'a gider.
**Çalışma notu:** Birbirinden bağımsız işler main'den açılan ayrı dallarda yapılır; ortak satırlar (hızlı erişim, sw VERSION, app.js TABS) yayında birleştirilir.

### Önceki: KALDIĞIMIZ YER (2026-11-17 gece)
**Durum:** Her şey yayında, son sürüm **sw v32** (main b933f65). Bekleyen kod değişikliği yok. Önceki yayın yedekleri: git etiketleri `yedek-yayin-v25`, `-v27`, `-v28`, `-v30`, `-v31` (GitHub'da). Çalışma dalı `refleks-yorum` (main ile aynı).
**Bugün yapılanlar (2026-11-17):**
- 1. adım (tasarım) yayında; ardından küçük logo, kaydetme bildirimi (4 sn / hata 7 sn, açık yeşil).
- 2. adım (Vakalarım'a yeni testler) yayında: Timpanometri (tip + Tip A alanı), Akustik refleks, OAE, ABR (+ kayıt fotoğrafı, IndexedDB, galeriye kaydedilmez uyarısı). "Ek ölçümler" → "Konuşma odyometrisi".
- OdyoBOT: artık "vaka yorumlama asistanı"; vaka gelince görev seçilir (Maskeleme kararları / Akustik refleks yorumu). Refleks yorumu: Jerger örüntüleri, 16 birleşimin hepsi açıklanıyor, şemada olası bölge turuncu, girilmeyen yol "yok" sayılıyor. Ayrıntı PROGRESS.md en üst.
- Klinik değerler proje sahibinin Google Drive'ındaki ders slaytlarından (google-drive MCP; OAuth "test" modunda, ~7 günde bir yeniden onay isteyebilir) ve proje sahibinin izniyle internetten.
**Oturum başında proje sahibine hatırlat:**
1. **Telefonda denenecekler (hiç denenmedi):** eşik tablosu (iPhone klavyesi Maskeli/Yanıt yok/Sonraki düğmelerini kapatıyor mu), 4 yeni panel, ABR fotoğrafı (kamera; galeriye düşüyor mu — Android), "Yedeği paylaş" (fotoğraflı), OdyoBOT görev seçimi ve refleks yorumu, yeni logo/bildirim. Uygulamayı kapatıp açınca v32 gelmeli.
2. **Proje sahibinin doğrulaması:** refleks yorumu metinleri ve "yalnız ipsilateral yok → yer göstermez" kararı (kaynak bulunamadı); OAE frekansları/6 dB ölçütü kendi cihazına uyuyor mu; timpanogram tip sınırları gerçek vakalarda.
3. **Sıradaki adım: 3. adım (3D modeller)** — yalnızca proje sahibi "sıradaki adıma geç" deyince. İlk iş: Görsel depo/3D kartı "3D modeller" listesi; otolit ve tüylü hücre modeli için **yaklaşım başlamadan onaylatılır** (açık lisanslı model araştırması ya da Blender planı). Bkz. YOL-HARITASI.md.
4. Eski hatırlatma listesindeki (2026-11-15) bekleyen içerik işleri hâlâ geçerli (cihaz açıklamaları, yenidoğan taraması metinleri vb.).

### YOL HARİTASI (2026-11-17): önce `YOL-HARITASI.md`'ye bak
- Proje sahibi 5 adımlı yol haritası verdi (`YOL-HARITASI.md`). **Yalnızca sıradaki adım yapılır**, "sıradaki adıma geç" denmeden yenisine başlanmaz. Her adım ayrı dalda; **main'e birleştirme ve yayın yalnızca onayla.**
- **2. adım (Vakalarım'a yeni testler) onaylandı ve yayında (2026-11-17, sw v30; önceki yayın yedeği git etiketi `yedek-yayin-v28`). Telefonda denenecek: 4 yeni panel, ABR fotoğrafı (kamera), yedek paylaşma.** Ayrıntı `PROGRESS.md` en üst bölüm. Klinik değerler proje sahibinin Google Drive'ındaki ders slaytlarından (google-drive MCP) okunup onaylatıldı.
- **1. adım (tasarım yenilemesi) onaylandı ve yayında (2026-11-17, sw v27; ardından v28: küçük logo, kaydetme bildirimi; yedek etiketi yedek-yayin-v27).** Ayrıntı ve testler: `PROGRESS.md` en üst bölüm. Önceki yayının yedeği: git etiketi `yedek-yayin-v25` (GitHub'da da var) ve `ham-gorseller/yedek-yayin-2026-11-17/odyobot-yayin-v25.zip`. Geri dönmek gerekirse bu etiket kullanılır.
- **Yayından sonra telefonda denenecek:** eşik tablosu (iPhone sayı klavyesinde Enter yok; klavye Maskeli/Yanıt yok/Sonraki düğmelerini kapatıyor mu), ana sayfa, logo, notlar yönetici paneli. Sıradaki adım (2. adım) proje sahibi "sıradaki adıma geç" deyince.
- 1. adımdaki yeni yapı (özet): logo teması varsayılan (yönetici seçimi `ayar/renk`); alt çubukta saydam logo `icons/odyobot-logo-seffaf.png`; ana sayfa: üst satır, arama, hızlı erişim, 3D kartı, Kaldığın yerden, Favori notlar, Duyurular (tam liste `#duyurular`); notlar konu gruplarında, her notun sayfası `#not/<anahtar>`; cihazlar iki sütun; alt sayfalarda yalnızca geri oku + sayfa adı; vaka formunda eşik tablosu.

### Sonraki oturumda proje sahibine hatırlat (2026-11-15 gece kaydedildi)
**Durum:** her şey yayında (son sürüm **sw v25**), bekleyen kod değişikliği yok, çalışma klasörü temiz. Proje sahibi 3D kepçe–kanal onarımını görüp "her şey iyi görünüyor" dedi (2026-11-15).
Bugün yapılanlar (2026-11-15): v21 Görsel depo yeniden düzeni + yeni cihaz görselleri, rozetler, tam ekran görüntüleyici, 3D ayrı sayfa; v22 Şemalar / İşitme cihazları / İşitsel implantlar, yenidoğan taraması akış şemaları, 6 düzeltilmiş görsel, küçük 3D düğmesi; v23 açılışta en alta kayma düzeltildi (`odybot.js` `asagi()`), herkese açık Ayarlar (tema, dil, yönetici girişi), dişlinin altında 3D; v24–v25 3D modelde kepçe–kanal birleşimi dikişsiz yeniden çizildi (ayrıntı PROGRESS.md, yedek `ham-gorseller/yedek-3d-v23/`).
Oturum başında bu listeyi sırayla hatırlat:
1. **Telefonda denenecekler (v21–v25):** 3D'de kepçe–kanal birleşimi (proje sahibi bilgisayarda/telefonda baktı, iyi); açılışta sayfanın üstte kalması; dişli → Ayarlar (tema, dil, yönetici girişi); dişlinin altındaki 3D düğmesi ve 3D sayfası (döndürme, iki parmakla yakınlaştırma, dokunarak seçme, "← Ana sayfa" ve geri tuşu); cihaz görsellerini tam ekranda büyütme/kapatma; rozetlerin açık/koyu okunurluğu; Görsel depo → Şemalar → Yenidoğan taraması kutuları; uçak modunda açılış.
2. **Proje sahibinin doğrulaması gereken içerik:**
   - Yenidoğan taraması kartlarındaki taslak metinler (özellikle "Risk var" ve yoğun bakım açıklamaları). Yoğun bakım şemasında test zamanları yok ("Ayrıntılar protokol belgesinde"); biliyorsa uygulamadan eklesin.
   - "Araştırma aşamasında" rozeti (penetran ABI) doğru mu?
   - Eklenen cihaz görsellerinin anatomik kontrolü (bantlı kemik iletimde "Bağlantı diski" çizgisi, yapışkan adaptörlüde mastoid kemik) ve şüpheli eski fotoğraflar (ITE tam/yarım konka, ITC).
   - 3D modeldeki klinik metinler (skala media dahil).
3. **Proje sahibinin yazacakları:** cihaz kartlarının açıklamaları (yeni kartlar dahil: CROS/BiCROS, yapışkan adaptörlü, kulak içi karşılaştırma), uygulamadan "Açıklama ekle/düzenle".
4. **Önceden kalan, telefonda hiç denenmemiş:** yönetici girişiyle fotoğraflı Haber/Etkinlik/İş ilanı paylaşma, düzenleme, silme; Vakalarım'dan OdyoBOT'a gönderme ve maskeleme asistanı; odyogram JPEG/PDF çıktısı; görünüm düğmesi.
5. **Sıradaki iş: koklea kesiti şeması (Corti organı)** — aşağıda "Sıradaki işler" 2. madde. Beklenen: parça listesi onayı ve `ham-gorseller/` içine referans görsel.
6. Açık sorular (§10): 7, 11, 12, 13.

### Kaldığımız yer (2026-11-15)
- Görsel depo yeniden düzenlendi ve yeni cihaz görselleri eklendi (sw v21). **Yayında** (2026-11-15). Reddedilen 6 görselin düzeltilmiş hâli de eklendi (v22).
  - 9 görsel eklendi (bte, kemik-bant, ki-elektrot, baha-perkutan, transkutan-aktif, cros-bicros, kemik-yapiskan, ki [alt başlık satırı silindi], orta-kulak-tam [4:3'e beyaz şeritle getirildi]); CROS/BiCROS'ta tekrar eden alt etiketler silindi. 6 görsel reddedildi (liste yukarıda).
  - İşitme cihazları ve İşitsel implantlar ayrı düğme/panel; rozetler; tam ekran görüntüleyici; 3D ayrı sayfa (`#3d`) ve ana sayfada 3D kartı.
  - Test: 360/400 px, açık/koyu, 5 tema, yönetici Düzenle/Kaydet/Varsayılana dön, eski Firestore açıklamaları, internetsiz açılış, hareket azaltma. firestore.rules ve CSP değişmedi.
- Telefonda denenecekler: `PROGRESS.md` "Görsel depo yeniden düzenleme" bölümünün sonunda.
- Sonra (sw v22, **yayında** 2026-11-15): 3D kartı küçük düğmeye çevrildi, OdyoBOT/saat/tarih büyütüldü. 6 düzeltilmiş görsel eklendi (kulak içi karşılaştırma, EAS, orta kulak yarı, pasif transkütanöz, penetran ABI, yüzey ABI); küçük kusurları Claude düzeltti (ayrıntı `PROGRESS.md`). Artık yer tutuculu kart yok. Görsel depo: Şemalar / İşitme cihazları / İşitsel implantlar; yenidoğan taraması akış şemaları eklendi.

### Önceki: kaldığımız yer (2026-11-14)
- Görsel depoya **"3D model"** bölümü eklendi (sw v18). Hazır paket `gorsel3d/` proje sahibinden geldi; uyum değişiklikleri yapıldı (ayrıntı `PROGRESS.md`). Yerelde sahte Firebase ile test edildi: model, 6 bölüm, dokunma, kepçe, 5 görünüm, yönetici Düzenle/Varsayılana dön, internetsiz açılış, 400 px, açık/koyu. **Yayında** (2026-11-14, proje sahibi onayladı).
- firestore.rules değişmedi (icerik kuralı yeni anahtarlara zaten izin veriyor). CSP değişmedi.
- Düzeltme (sw v19): seçiliyken başka yapıya dokunma, "← Geri" düğmesi, boşluğa dokununca seçimin kalkması, telefon düzeni (kart modelin altında). Ayrıntı `PROGRESS.md`.
- Skala media eklendi (sw v20, **yayında**): tarama verisi değil, iki skala arasındaki bölmeye göre yaklaşık çizildi. Yedek: `ham-gorseller/yedek-3d-v19/` + yerel git etiketi `yedek-v19-skala-media-oncesi`. Ayrıntı `PROGRESS.md`.
- Telefonda denenecek: modelin döndürülmesi/iki parmakla yakınlaştırma, dokunarak seçme, koyu görünümde silik yapıların okunurluğu, ilk açılışta 4 MB indirme süresi.

### Önceki: kaldığımız yer (2026-11-11 akşamı)
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
1. ~~OdyoBot maskeleme asistanı~~ (bitti, sw v13)
2. **Koklea kesiti şeması (Corti organı)** — *proje sahibine oturum başında hatırlat (2026-11-14 isteği).* Fikir onaylandı, ayrıntılar bekleniyor:
   - Biçim: 3D'ye değil, ayrı 2D özgün SVG şema (yolak/refleks şemaları gibi), dokunulabilir parçalar, kartta konum/işlev/klinik not, hepsi yönetici düzenlemesine bağlı. Sebep: Corti organı mikroskobik, modelde ölçülmüş veri yok.
   - Yer (önerilen): 3D modelde "Skala media" seçilince kartta "Kesiti göster" → şema kartın altında açılır. Alternatif: Görsel depoya 5. düğme (400 px'te sıkışır).
   - Önerilen parça listesi (proje sahibi onaylayacak/düzeltecek): skala vestibuli, skala media, skala timpani, Reissner membranı, bazal membran, tektoryal membran, iç tüy hücresi (1 sıra), dış tüy hücreleri (3 sıra), Corti tüneli ve pilar hücreler, stria vaskülaris, spiral ligament, osseöz spiral lamina, spiral gangliyon ve sinir lifleri.
   - Proje sahibinden beklenen: parça listesi onayı ve `ham-gorseller/` içine referans görsel (uygulamaya konmaz, yalnızca bakılarak özgün çizim yapılır). Klinik metinleri Claude taslak yazar, proje sahibi doğrular.
3. 3D model: "Vestibüler" başlığı altında kulak kristallerinin (otokoni) hareketi. *Şimdi yapılmayacak; not düşüldü (2026-11-14).*
4. Test soruları ve mağaza paketi

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
| `vaka-testler.js` | 2. adım ek testleri (timpanometri, akustik refleks, OAE, ABR): her biri `window.VakaTestleri` modülü (temizle, form, ayrıntı, CSV, çıktı). vakalarim.js'ten önce yüklenir. Klinik kurallar (`timpanTipi`, `oaeSonuc`) `odyo-hesap.js`'te; Node testleri `testler/timpan-test.js`, `testler/oae-test.js`. Yazılar `index.html` `#vt-metinler` |
| `vakalarim.js` | Vakalarım sekmesi: veri katmanı (`VakaDeposu`, şimdilik localStorage; fotoğraf eklenince IndexedDB'ye yalnızca bu katman değişir), form, odyogram çizimi, liste/ayrıntı, yedekleme ve CSV |
| `cikti.js` | Odyogram çıktısı: SVG sayfa → JPEG; PDF için küçük el yazımı PDF yazıcı. Renkler `--cikti-*` |
| `goruntuleyici.js` | Cihaz görsellerini tam ekran açar (kütüphanesiz): iki parmakla büyütme, sürükleme, çift dokunuş, ✕ / Esc / geri tuşu ile kapanma. `window.Goruntuleyici.ac({src, alt, baslik, geri})`. Renkler `--gor-*` |
| `odybot.js` | OdyoBOT sohbet ekranı (düğmeli, kural tabanlı). Mesaj metinleri `index.html` `#b-metinler` |
| `gorsel3d/` | 3D model bölümü (hazır paket). `gorsel3d.js` görüntüleyici (kütüphanesiz WebGL; çizim/kamera/dokunma hesaplarına dokunulmaz), `gorsel3d-veri.js` adlar, açıklamalar, arayüz yazıları (`window.GORSEL3D_VERI`), `gorsel3d.css` görünüm (yapı renkleri `--g3d-<kimlik>`), `periferik.json` + `periferik.bin` model (değiştirilmez), `KAYNAKLAR.md` lisanslar. `app.js` → `kur3d()` ilk açılışta `Gorsel3D.kur` çağırır. |
| `seslab/` | Ses laboratuvarı (`#seslab`, 2026-11-18): `seslab.js` gorsel3d.js kopyasından türetilmiş, animasyonlu görüntüleyici (`window.SesLab.kur`); `seslab-veri.js` sahneler/frekanslar/yazılar (`window.SESLAB_VERI`); `seslab.css` (`--sl-*`); `denge.js` denge kipi hesapları (`window.SesLabDenge`: baş pozisyonu, posterior kanal yolu, kristaller, makulalar). Modeli `gorsel3d/`den yalnızca okur. `app.js` → `kurSeslab()`. `dagilma.js` (2026-11-20, dal `seslab-golge`): üçüncü seçenek **Dağılma (difraksiyon)** (`#seslab/dagilma`, `#sl-dagilma`; 2D canvas, model kullanmaz), iki sahne: **Duvar** (yandan; kaynak, ≈70 cm duvar, bina; 125–4k Hz) ve **Baş gölgesi** (üstten; 250–8k Hz). Dalga boyu/engel ≥1,5 dolaşır, 2/3–1,5 saçılma (eşit), <2/3 gölge (sınır şematik). Değerler ders notlarından: Psikoakustik 1. ders s. 37 (dağılma; s. 38 telifli kitap fotoğrafı, kullanılmadı), 2. ders sl. 72, 3. ders sl. 5; İşitme ve Denge Sistemleri-2 s. 22–24 (1500 Hz, 3–6 dB / ≥20 dB). Eşit durumunun ayrıntısı HyperPhysics/Britannica. Yazılar `seslab-veri.js` → `dagilma` (yönetici `icerik/sl.dagilma`, `sl.dagilma.duvar`, `sl.dagilma.bas`). Test `testler/dagilma-test.js`. |
| `sozluk.js` | Terimler sözlüğü (`#sozluk`): öğrenme kartları, alfabetik liste, tekrar listesi, yönetici paneli. Terimler Firestore `sozluk`; öğrenme durumu yalnızca cihazda (`odybot:sozlukTekrar`). Yazılar `index.html` `#sz-metinler`. Ana sayfa araması `window.Sozluk.terimler()`; derin bağlantı `#sozluk/terim/<kimlik>`. |
| `maskeleme-kural.js` | Maskeleme kuralları (Katz). Ekrandan bağımsız, Node ile test: `node testler/maskeleme-test.js` |
| `odyo-hesap.js` | Hesap kuralları (PTA, derece, tip). Ekrandan bağımsız; Node ile `require` edilip test edilebilir. |
| `firebase-config.js` | Firebase web yapılandırması ve admin UID'si (gizli bilgi değil, bkz. §8) |
| `firestore.rules` | Firestore güvenlik kuralları. Değişirse Firebase konsoluna elle yapıştırılır. |
| `sw.js` | Servis çalışanı: uygulama dosyalarını önbelleğe alır, internetsiz açılmayı sağlar |
| `manifest.webmanifest` | Ana ekrana ekleme bilgisi (ad, renk, simge) |
| `icons/` | Uygulama logosundan üretilen PNG'ler (192, 512, maskable 512, 180) ve düğmedeki `logo.png` |
| `images/devices/` | Cihaz görselleri (küçültülmüş; 2026-11-15'ten itibaren yeniler 1200 px, değişenler `-2` ekli adla). Ham halleri `ham-gorseller/` içinde, git'e girmez. |
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
| Firestore | `sozluk` | Herkes okur, yalnızca admin yazar | `tr` (Türkçe karşılık, zorunlu, ≤100), `en` (≤120), `kisaltma` (≤30), `aciklama` (≤1000), `olusturma`, `guncelleme`. Başka alan kabul edilmez. Kişisel veri değil. |
| Firestore | `cihazlar/{cihaz kimliği}` | Herkes okur, yalnızca admin yazar | `maddeler` (metin listesi, 1–20), `guncelleme`. Kişisel veri değil. |
| Firestore | `icerik/{anahtar}` | Herkes okur, yalnızca admin yazar | `alanlar` (yalnızca değiştirilen alanlar: alan → metin, ≤20), `guncelleme`. Anahtarlar: `yolak.<id>`, `refleks.<id>`, `not.<sıra>`, `cihaz.<id>`, `metin.<data-k>`, `g3d.bolum.<id>`, `g3d.yapi.<id>`, `g3d.kepce` (ad, aciklama), `g3d.metin` (ipucu, not), `cihaz.rozet` (ameliyatsiz, ameliyatli, arastirma). `cihaz.<id>` alanları: ad, alt, gorselAlt. Silinirse koddaki varsayılan metin döner. |
| Firestore | `ayar/notGruplari` (adim1-tasarim) | Herkes okur, yalnızca admin yazar | `gruplar` [{ `id`, `ad` (≤60), `notlar` (not anahtarları: `not.<sıra>`, `nd.<belge>`) }] (≤30), `digerAd` (başlıksız notların adı), `guncelleme`. Belge yoksa koddaki varsayılan başlıklar. |
| Firestore | `ayar/renk` (adim1-tasarim dalından itibaren; eski sürüm `ayar/tema` okur) | Herkes okur, yalnızca admin yazar | `id` (tema adı), `guncelleme`. Belge yoksa varsayılan "logo" teması. |
| Cihaz (localStorage, anahtar `odybot:vakalar`) | vakalar (Vakalarım) | Yalnızca o cihaz | `id`, `surum`, `kimlik` (≤40, ad-soyad değil), `tarih`, `notlar` (≤2000), `olusturma`, `guncelleme`, `esik.{sag,sol}.{hava,kemik}.{Hz}` = `{db (-10..120 tam sayı), maskeli, maskDb, nr}` (boş frekans yazılmaz), `konusma.{sag,sol}` = `{srt, sds (0..100), sunum, maskeli}`, `mcl.{sag,sol}`, `ucl.{sag,sol}`, `weber` (orta/sag/sol/yapilmadi), `rinne.{sag,sol}` (pozitif/negatif/yapilmadi). 2. adımla (`vaka-testler.js`): `timpan.{sag,sol}` = `{basinc, kompliyans, hacim, duz}`, `refleks.{sag,sol}.{ipsi,kontra}.{500..4000}` = dB ya da "yok" (kulak = uyaranın verildiği kulak), `oae.{sag,sol}` = `{dp:{f2:{s,g}}, te:{bant:{s,g}}, repro, stab}`, `abr.{sag,sol}` = [{db, I, III, V}], `abr.fotolar` = fotoğraf kimlikleri (fotoğrafların kendisi IndexedDB `odybot-foto`, yalnızca cihazda; yedekte `fotolar`). Eski kayıtlardaki `etiket`/`not` okunurken taşınır. |
| Cihaz (sessionStorage) | `odybot:gonderilen` | Yalnızca o sekme | Vakalarım'dan OdyoBOT'a gönderilen vaka kimlikleri (değer değil); bot okuyunca siler |
| Cihaz (localStorage) | ayarlar | Yalnızca o cihaz | `odybot:gorunum` (light/dark; yoksa otomatik), `odybot:ptaTur` (3/4), `odybot:grafik` (tek/ayri), `odybot:araFrekans`, `odybot:yedekSayac`, `odybot:hatirlatmaKapali`; 1. adımla: `odybot:favoriNotlar` (not anahtarları), `odybot:sonNot`, `odybot:sonVaka` (yalnızca vaka kimliği), `odybot:sonZiyaret` (zaman, "yeni" rozeti için); sözlükle: `odybot:sozlukTekrar` ({terim kimliği: {k kutu 0–5, s sonraki gösterim, g görülme}}, yalnızca öğrenme durumu, sunucuya gitmez) |

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
- Yazı tipleri: başlıklarda **Bricolage Grotesque**, metinde **IBM Plex Sans**, sayı ve verilerde **IBM Plex Mono**. Etiketler (form alanı adları, "Tarih", "Bölüm" gibi) büyük harfli daktilo değil, normal yazı tipi ve normal harf (2026-11-17 kararı).
- Varsayılan tema "Logo" (2026-11-17): açıkta ana #1560B0, ikinci #17B6C8, 3D kartı #0F4C97; koyuda ana #6DB7F2, ikinci #3DCADA, 3D kartı #123E7A. Diğer 5 tema seçilebilir. Açık ve koyu tema desteklenir.
- Uygulama logosu (mavi-turkuaz, kulak + robot) ana ekran simgesi olarak kullanılır. Alt çubukta saydam logo (`icons/odyobot-logo-seffaf.png`, ~66 px) çubuğun üstüne taşar; daire/halka/gölge yok (2026-11-17 kararı; eski turuncu yuvarlak kaldırıldı).
- Renkler her zaman isimli değişkenlerle (CSS değişkenleri) tanımlanacak, koda doğrudan renk kodu yazılmayacak.
- **Odyogram kuralı (bütün şemalarda geçerli):** sağ kulak kırmızı, sol kulak mavi, karşıya geçiş kesik gri çizgi.
  - Odyogram (Vakalarım, 2026-11-09 kararı): hava yolu noktaları düz, kemik yolu noktaları kesikli çizgiyle birleşir; iki kulakta da aynı, renk kulağı gösterir (sağ kırmızı, sol mavi). Boş ana frekansta çizgi kopar, NR noktası çizgiye bağlanmaz.
  - İstisna, akustik refleks arkı (2026-11-09 kararı): renk **uyarılan** kulağı gösterir (sağ kırmızı, sol mavi). Düz çizgi kontralateral, noktalı çizgi ipsilateral yoldur.
- Mobil öncelik:
  - 400 piksel genişlikte yatay kaydırma olmayacak.
  - Dokunma hedefleri en az 44 piksel olacak.
  - Alt çubukta basılan hücrenin tamamı vurgulanacak.
- Görseller yalnızca özgün şematik çizimler, proje sahibinin kendi fotoğrafları ya da **proje sahibinin yapay zekâ ile ürettiği şemalar** olacak (2026-11-15 kararı; ör. Gemini ile üretilen cihaz şemaları). Yapay zekâ görselleri eklenmeden önce yazı hatası, anlamsız metin, logo/filigran için tek tek kontrol edilir; anatomik doğruluğa proje sahibi karar verir. **Telifli ders kitabı görselleri kullanılmayacak.**

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
  - 3D model verisi (`gorsel3d/*.bin`, ~4 MB) `ASSETS`'te **yok**: ilk istekte indirilip önbelleğe yazılır, sonra hep önbellekten gelir (arka planda yeniden indirilmez). `VERSION` artınca silinir ve bir kez yeniden iner; bu yüzden model değişirse ayrıca dosya adını değiştirmek gerekmez.
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
