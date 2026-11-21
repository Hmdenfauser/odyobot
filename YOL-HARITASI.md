# YOL HARİTASI — OdyoBOT (proje sahibinin 2026-11-17 talimatı)

Her oturumda önce bu dosyaya, `CLAUDE.md` ve `PROGRESS.md`'ye bak. **Yalnızca sıradaki adım yapılır;** proje sahibi "sıradaki adıma geç" demeden yeni adıma başlanmaz. Yapı, sonraki adımlara uygun kurulur.

## Durum
| # | Adım | Dal | Durum |
|---|---|---|---|
| 1 | Tasarım yenilemesi | `adim1-tasarim` | ✅ Onaylandı, yayında (2026-11-17, sw v27). Önceki yayın yedeği: git etiketi `yedek-yayin-v25` + `ham-gorseller/yedek-yayin-2026-11-17/`. Yayından sonra telefonda eşik tablosu denenecek. |
| 2 | Vakalarım'a yeni testler | `adim2-testler` | ✅ Onaylandı, yayında (2026-11-17, sw v30; önceki yayın yedeği git etiketi `yedek-yayin-v28`): timpanometri (tip dahil), akustik refleks, OAE, ABR. ABR kayıt fotoğrafı eklendi. Refleks yorumu OdyoBOT'ta (v32, yayında). Telefonda denenecek. Klinik değerler proje sahibinin Drive'ındaki ders slaytlarından, onaylatılarak. |
| 3 | 3D modeller | (birleşti) | ✅ Yayında (v42–v45): 3D modeller listesi (Periferik, Denge sistemi, İç kulak yapıları), Ses laboratuvarı (İşitme, Denge, Dağılma, Corti organı). İleride: ampulla kesiti animasyonu. |
| 4 | Üye girişi, forum, bildirim | (birleşti) | ✅ Yayında (2026-11-21, sw v46), **üyelik kapalı**: üye girişi (e-posta + Google), Kütüphane, Topluluk/forum, uygulama içi bildirim (zil; telefona bildirim yok), yasal metin taslakları. Açılış için proje sahibinin adımları CLAUDE.md v46 notunda. |
| 5 | Vestibüler modül, işitme taraması, gelir | — | Bekliyor |

## Genel kurallar (bütün adımlar)
- Her adım ayrı dalda. **main'e birleştirme ve yayına alma yalnızca proje sahibi onaylayınca;** canlı site o zamana kadar değişmez.
- Her bölüm bitince commit + `PROGRESS.md` güncellemesi. Limite yaklaşılırsa nerede kalındığı `PROGRESS.md`'ye yazılır.
- Klinik içerik, hesap kuralı, norm değeri uydurulmaz; gerekirse sorulur (kaynak proje sahibinden; maskelemede Katz).
- Vaka kayıtları yalnızca cihazda; hasta adı, T.C. kimlik no gibi bilgi istenmez.
- Onaysız yeni içerik veya özellik eklenmez.
- Her adım sonunda: `sw.js` sürümü +1, testler, sade Türkçe özet + yayına almadan önce önizleme adımları, sonra onay beklenir.

## 1. Adım: Tasarım yenilemesi (referanslar `tasarim-referans/`; görsellerdeki başlıklar, "AY-014", favoriler yer tutucudur)
- **A) Renkler:** `PALETTES`'e "logo" paleti, varsayılan. Açık: ana #1560B0 (yazı beyaz), ikinci #17B6C8 (yazı #04303A), 3D kartı #0F4C97. Koyu: ana #6DB7F2 (yazı #06223F), ikinci #3DCADA, 3D kartı #123E7A. Sağ kırmızı / sol mavi ve odyogram çıktı renkleri aynı. Kontrast kontrolü.
- **B) Alt çubuk ve logo:** Fable'ın saydam logosu (ovallik, dış katman sorunlu) kaynaktan yeniden temizlenip `icons/`'a; alt çubuğun ortasında. Eski logo dosyaları silinmez, PWA simgelerine dokunulmaz. Beyaz daire, turuncu halka, gölge kalkar; logo ~66 px, çubuğun üstüne taşar. Kaydırınca içerik logonun arkasından görünmez. OdyoBOT seçiliyken sade bir işaret. Diğer sekmelerde seçili zemin kalkar; ikon ve yazı ana renk.
- **C) Ana sayfa:** üst satır (küçük logo, "Merhaba, odyolog", tarih; saat yok; sağda ayarlar) → arama (notlar, cihazlar, şemalar; internetsiz; sonuca dokununca oraya gider) → hızlı erişim (Yeni vaka, Maskeleme asistanı, Ders notları, Cihazlar) → büyük 3D kartı (Yeni etiketi, başlık, açıklama, İncele, sağda durağan model görüntüsü; parıltı/ışıltı korunur, hareket azaltmaya uyar) → Kaldığın yerden (son not, son vaka; yalnızca cihazda; yoksa gizli) → Favori notlar (cihazda yıldız; yoksa gizli) → Duyurular (tek liste, küçük görsel, tür etiketi, başlık, tarih; boş tür gösterilmez; hiç yoksa tek satır; "Tümünü gör" süzgeçli tam liste; son ziyaretten sonra eklenene "yeni" rozeti). Ayrıntı sayfası, yönetici formu ve düzenlenebilir metinler çalışmaya devam eder.
- **D) Cihazlar:** iki sütun, karşılaştırma kartı tam genişlik, tam ekran açılma aynı. İşitme cihazlarında "Ameliyatsız" rozeti kalkar (implantlarda kalır). Sayfa başı açıklamaları kalkar; "Görseller temsilidir…" uyarısı listenin sonunda küçük not.
- **E) Ders notları:** konu grupları (başlıkta not sayısı); nota dokununca kendi sayfası (geri oku, not adı, favori yıldızı). Arama ve "kendi kaynağınla doğrula" uyarısı kalır.
- **F) Genel düzen:** alt sayfalarda (vaka formu, not sayfası, 3D) yalnızca geri oku + sayfa adı. Büyük harfli daktilo etiketler normal yazı tipi ve normal harf.
- **G) Vaka formu eşik girişi:** kulak başına tek tablo (sütun frekans, satır Hava/Kemik), üstte Sağ/Sol geçişi. Altta tek takım düğme: Maskeli, Yanıt yok, Sonraki. Ara frekanslar açılınca tablo yana kayar. Sembol açıklaması kapalı gelir. Frekanslar, aralıklar, canlı odyogram aynı; eski kayıtlar sorunsuz. 360 px'te rahat dokunma.

## 2. Adım: Vakalarım'a yeni testler (onaydan sonra)
Sıra: timpanogram ve refleks → OAE → ABR. Hepsi isteğe bağlı.
- Timpanogram: kulak başına tepe basıncı (daPa), kompliyans (ml), kanal hacmi (ml); eğri anlık çizilir, tip (A, As, Ad, B, C). Ekranda "girilen değerlerden üretilmiş çizimdir, cihaz kaydı değildir". **Tip sınır değerleri proje sahibine sorulacak.**
- Akustik refleks: ipsi/kontra, 500/1000/2000/4000 Hz eşik veya "yok" tablosu; sonuç refleks arkı şemasında işaretlenebilir.
- OAE: DPOAE frekans başına DP düzeyi + gürültü tabanı, DP-gram; TEOAE bant başına değer, çubuk grafik. **Geçti/kaldı ölçütü sorulacak.**
- ABR: I, III, V latansları ve şiddet tabloya; dalgalar arası süreler hesaplanır, latans-şiddet grafiği. Dalga izi çizilmez; kayıt fotoğrafı eklenebilir (yalnızca cihazda).
- Yedekleme, geri yükleme, çıktı (JPEG/PDF) yeni testleri kapsar. Eski kayıtlar bozulmaz.

## 3. Adım: 3D modeller (onaydan sonra)
- 3D kartı "3D modeller" listesine açılır: Periferik işitme sistemi (mevcut), Otolit hareketi, Skala media ve tüylü hücreler.
- Otolit hareketi: semisirküler kanallarda otokonilerin baş pozisyonuna göre hareketi, "Vestibüler" başlığı altında.
- Tüylü hücreler: skala media kesiti, iç/dış tüylü hücreler, tektoryal membran. Açık lisanslı hazır model araştırılır; yoksa Blender ile modelleme planı. **Yaklaşım başlamadan onaylatılır.**
- Seçilen yapı belirgin, diğerleri silik; modeller ilk açılışta iner.

## 4. Adım: Üye girişi, forum, bildirim (onaydan sonra)
- Üye girişi (Firebase Auth): forum, bildirim, favorilerin cihazlar arası eşitlenmesi. Vaka kayıtları yine yalnızca cihazda.
- Forum ("Topluluk"): basit soru-cevap; kategoriler, giriş zorunlu, şikâyet et / engelle, yönetici silme/gizleme. Gönderi formunda hasta bilgisi yasağı metni. Alt çubukta yer için Görsel depo + Notlar "Kütüphane" olarak birleşir; **önce çizimle gösterilir.**
- Bildirim: yeni etkinlik/ilan/haber. Hangi cihazlarda çalıştığı ve ücretli Firebase planı gerekip gerekmediği güncel belgelerden kontrol edilip maliyetle yazılır; **onaysız ücretli plana geçilmez.**
- Gizlilik politikası, KVKK aydınlatma metni, kullanım koşulları, "tanı koymaz, eğitim amaçlıdır" sayfaları; metin taslakları onaylatılır.

## 5. Adım: Vestibüler modül, işitme taraması, gelir (onaydan sonra)
- Vestibüler: ders notları, manevra animasyonları, kalorik test hesaplayıcısı (Jongkees), vHIT ve VEMP sonuç girişi. **Formül ve normlar onaylatılır.**
- İşitme taraması: uygulama içinden otomatik, tahmini saf ses taraması. Sonuç dB HL eşik olarak sunulmaz; "kalibre değildir, tanı koymaz" uyarısı her ekranda. **Başlamadan tıbbi cihaz mevzuatı riskleri yazılır.**
- Gelir: Duyurularda "Sponsorlu" etiketli içerik, ücretli iş ilanı altyapısı; reklam ağı eklenirse çerez onayı. **Vakalarım ve OdyoBOT asistanında asla reklam yok.**

## Uygun adımda önerilecek küçük işler (onaysız yapılmaz)
- Her ders notunda kaynak ve son güncelleme tarihi.
- "Hata bildir" düğmesi.
- Öğrenciler için soru bankası ve bilgi kartları.
- Türkçe-İngilizce terim sözlüğü.
