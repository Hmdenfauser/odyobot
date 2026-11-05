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
| 2 | Görsel depo | (a) İşitme yolakları: koklea'dan işitsel kortekse 8 basamaklı, dokunulabilir şema. Her basamakta konum, işlev, klinik not ve ABR dalga karşılığı var. (b) Akustik refleks arkı: ipsilateral ve kontralateral yolu gösteren 7 basamaklı şema. (c) Cihaz tipleri: BTE, RIC, ITE, ITC, CIC, kemik iletimli, koklear implant, orta kulak implantı. | (a), (b) yapıldı; (c) yapılmadı, görselleri proje sahibi yükleyecek |
| 3 | OdyoBot | Ortada, turuncu, yükseltilmiş yuvarlak düğme. Maskeleme asistanı (bkz. §7). | Yapılmadı |
| 4 | Notlar | Kısa ders notları ve arama kutusu. Konular: saf ses odyometrisi, işitme kaybı tipleri, timpanometri, konuşma odyometrisi, maskeleme kavramları, OAE, ABR, akustik refleks. | Yapıldı |
| 5 | Geçmiş | Kişisel vaka kaydı: anonim vaka etiketi, tarih, özet. Kayıtları yalnızca kaydı yapan görür. | Yapıldı |

**Ayarlar:** Ana sayfadaki dişli düğmesiyle açılır ve yalnızca düzenleyiciye görünür. İçinde 5 renk teması arasından seçim ile ders notu ekleme, düzenleme ve silme var.

**Temalar:** Petrol, Lacivert, Orman, Bordo, Mor. Açık/koyu ayrı bir ayar değil: her temanın açık ve koyu hâli var, cihazın moduna göre otomatik seçiliyor.

### Sıradaki işler (bu sırayla)
Sıra 2026-11-05'te proje sahibiyle değiştirildi. Gerekçe: cihaz görselleri artifact veri deposuna sığmayabilir, yeni özellikler de iki kez yazılmasın.
1. Taşınabilir sürüm (PWA): kendi adresi, ana ekrana ekleme, internetsiz çalışma
   - Bu aşamada düzeltilecek: "Sil/Düzenle" bağlantıları 32 px, depo bölüm düğmeleri 40 px (kural ≥ 44 px). Google Fonts yerine yazı tipi dosyaları uygulamanın içine konacak (internetsiz çalışma için).
2. Cihaz tipleri bölümü ve görsel yükleme
3. OdyoBot maskeleme asistanı
4. Test soruları ve mağaza paketi

## 4. Teknik yapı ve veri modeli (şu anki prototip)
- Claude'un artifact altyapısında yayınlanmış **tek bir HTML dosyası** var: HTML, CSS ve sade JavaScript. Kütüphane kullanılmıyor.
- Uygulamayı yalnızca Claude hesabı olan ve erişim verilen kişiler açabiliyor.
- Veriler iki yerde duruyor:
  - **Ortak alan** (altyapının veri deposu): ilanlar, haberler, ortak notlar, tema.
  - **Kullanıcıya özel alan:** vaka geçmişi (vaka etiketi, tarih, özet).
- Bu yapıda ana ekrana ekleme, internetsiz kullanım ve mağaza paketi mümkün değil.
- Prototip kodu: `OdyoBOT.html` (artifact'tan kopyalandı).
- **Veri yapısı** (artifact veri deposu, `window.claude.use('db')`):

  | Kayıt grubu | Kim görür | Alanlar |
  |---|---|---|
  | `duyurular` | Herkes | `tur` ("ilan" / "haber"), `baslik`, `kurum`, `tarih` (YYYY-AA-GG), `link` (yalnızca https), `not`, `olusturma` (zaman damgası) |
  | `notlar` | Herkes | `baslik`, `maddeler` (metin listesi, en fazla 40), `olusturma` |
  | `ayar/tema` | Herkes | `id` (tema adı), `guncelleme` |
  | `data/users/{kullanıcı}` | Yalnızca kaydı yapan | `etiket`, `tarih`, `not` (özet), `olusturma` |

- 8 temel ders notu veri deposunda değil, kodun içinde (`NOTES` dizisi). Depoda yalnızca Ayarlar'dan eklenen notlar var.
- **Düzenleyici tanıma:** Uygulama Claude altyapısına soruyor (`user.canEdit()`). Yetkiyi altyapı veriyor. PWA'da bu mekanizma olmayacak, yerine bir çözüm gerekecek.
- **Yerel mod:** Claude dışında açılınca veriler tarayıcının yerel deposunda (localStorage, `odybot:` önekiyle) tutuluyor. Vaka geçmişini cihazda tutmak için temel olarak kullanılabilir.
- Sürüm takibi: proje klasörü git deposudur (2026-11-06'da kuruldu).

## 5. Hedef mimari
- Uygulama kendi adresinde yayınlanan, bağımsız bir **PWA** olacak. PWA, tarayıcıdan ana ekrana eklenebilen ve internetsiz de açılabilen web uygulaması demek.
- Barındırma ücretsiz olacak: Netlify, Cloudflare Pages veya GitHub Pages. *Hangisi seçilecek: karar verilmedi.*
- Ortak içerik basit bir içerik dosyasında ya da küçük bir veri servisinde tutulacak. *Karar verilmedi.*
- **Vaka geçmişi yalnızca kullanıcının cihazında kalacak, hiçbir zaman sunucuya gönderilmeyecek.**
- Hedef sürümde düzenleyicinin nasıl giriş yapacağı: *karar verilmedi.*
- En son aşamada App Store ve Google Play paketi hazırlanacak. *Hangi yöntemle yapılacağı: karar verilmedi.*

## 6. Tasarım kuralları
- Görünüm sade, klinik ve okunaklı olacak.
- Yazı tipleri: başlıklarda **Bricolage Grotesque**, metinde **IBM Plex Sans**, etiket, saat ve verilerde **IBM Plex Mono**.
- Ana renk petrol mavisi-yeşili, OdyoBot yuvarlağı turuncu. Açık ve koyu tema desteklenecek.
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

## 9. Çalışırken dikkat edilecekler
- Her değişiklikten sonra 400 piksel genişlikte yatay kaydırma olup olmadığını ve dokunma hedeflerinin boyutunu kontrol et.
- Açık ve koyu temanın ikisini de kontrol et.
- Tüm arayüz metinleri Türkçe olmalı.
- Düzenleyiciye özel işlevler (ilan/haber ekleme ve silme, Ayarlar) normal kullanıcıya görünmemeli.
- Metinde olmayan bir şeyi uydurma; belirsiz konularda sor.
- Proje sahibinin onayı olmadan kütüphane ekleme veya yapıyı köklü biçimde değiştirme.

## 10. Proje sahibine sorulacak sorular
1. Hedef sürümde düzenleyici nasıl giriş yapacak (şifre, hesap vb.)? *(Prototipte Claude altyapısı tanıyor, bkz. §4.)*
2. Barındırma için hangisi seçilecek: Netlify, Cloudflare Pages mı, GitHub Pages mi?
3. Ortak içerik bir içerik dosyasında mı, yoksa küçük bir veri servisinde mi tutulacak?
4. ~~5 temanın isimleri ve renkleri~~ *Cevaplandı, bkz. §3.*
5. Prototipteki mevcut veriler taşınacak mı? *İlan ve haber yok, sıfırdan başlanacak. Ayarlar'dan eklenmiş ders notu ve vaka kaydı olup olmadığı: sorulacak.*
6. Vaka geçmişi yalnızca cihazda kalacağı için, telefon değişirse ya da veriler silinirse kayıtlar kaybolur. Dosyaya yedekleme veya dışa aktarma isteniyor mu?
7. Vaka "özet" alanı serbest metin. Buraya tanımlayıcı bilgi yazılmasını önlemek için bir uyarı gösterilsin mi?
8. Cihaz görselleri hangi biçimde ve boyutta olacak? Her cihaz için açıklama metni de eklenecek mi?
9. OdyoBot için hangi kaynak esas alınacak? Hangi girdiler kullanılacak (frekanslar, hava ve kemik yolu eşikleri, kulaklık tipi)? Hangi interaural attenüasyon değerleri kullanılacak?
10. İnternet yokken ilan ve haberler için son kaydedilen kopya mı gösterilecek?
11. Hedef sürüm herkese açık mı olacak, yoksa erişim sınırlı mı kalacak?
12. Test soruları hangi biçimde olacak (çoktan seçmeli vb.) ve içeriği kim hazırlayacak?
13. Mağaza paketi için geliştirici hesapları var mı? Paket hangi yöntemle hazırlanacak?
