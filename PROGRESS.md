# PROGRESS — OdyoBOT: Ses laboratuvarı (2026-11-18, dal `adim3-seslab`, sw v33, **yayında değil**, onay bekliyor)

**Denge kipi (2026-11-18):** Ses laboratuvarının üstünde **İşitme | Denge** geçişi. Denge: (1) "Otolit organları": utrikulus ve sakkulus makulası (epitel, tüy demetleri, otolit zarı + kristaller; modelde yok, vestibül içine yaklaşık çizildi), adımlar Baş dik / Öne eğik / Sağa eğik / İleri hızlanma; zar kuvvetin düzlem bileşeni kadar kayar, tüy demetleri bükülür. (2) "BPPV ve Epley": sağ posterior kanal, kristaller (8) kanal yolunda yerçekimiyle kayar; adımlar Başlangıç, Dix-Hallpike (sağ), Epley 2–4, Sonuç; ampulla kupula yönüne göre pembe/mavi. Model hastanın sağından görülür, alt kenar = yer; sağ altta baş simgesi. Hesaplar `seslab/denge.js` (Node testi `testler/denge-test.js`, 12 test geçti). Metinler taslak (proje sahibi doğrulayacak), yönetici düzenler: `sl.denge.<id>`, `sl.adim.<sahne>.<adım>`, `sl.yapi.utrikulus/sakkulus`, `sl.metin` (modIsitme, modDenge, adimBasligi, yerEtiketi, dengeUyari). Kaynak: Epley 1992, Bhattacharyya 2017. sw ASSETS + `seslab/denge.js`. Test: açık/koyu, 400 px taşma yok, JS hatası yok, işitme kipi aynı.

**Düzeltme 1 (2026-11-18, proje sahibinin geri bildirimi):** "Dış kulak" sahnesi (kepçe + kanal + zar; kepçede kanala akan dalga halkaları, Artec 3D atfı ekranda); 125 Hz eklendi (Greenwood ~%90 bazalden; en apeks ~20 Hz, notta yazıyor); inkus malleusu 0,6 rad geriden ve %88 genlikle izler, kemikçikler itilince pembe/çekilince mavi renk alır; oval pencere vurgusu (vestibülde stapes tabanı çevresi parlar; "Oval pencere" etiketi proje sahibinin isteğiyle kaldırıldı); "Ses yolculuğu" sahnesinde kepçe de görünür; VIII. sinirde mor elektriksel sinyal atımları; "Enerji dönüşümü" şeridi (Akustik → Mekanik → Hidrolik → Elektriksel, sahneye göre vurgulu; metinler yönetici düzenler `sl.metin`). Not: elektriksel dönüşüm oval pencerede değil tüy hücrelerinde; metinler buna göre yazıldı. Kepçe açıklaması `sl.yapi.pinna`. Test: 4 sahne × açık/koyu, 400 px taşma yok, JS hatası yok, gorsel3d/ değişmedi.

Proje sahibinin isteği: 3D modele animasyon eklenip kulak içi yapıların hareketi görülsün; mevcut 3D modele dokunulmadan kopyası üzerinden; ana sayfa hızlı erişimindeki "Ders notları" yerine buradan açılsın (notlar alt çubukta zaten var).

- **Yeni sayfa `#seslab`** (alt çubukta Ana sayfa seçili; geri oku). Hızlı erişimde "Ders notları" kısayolu → "Ses laboratuvarı" (`ana.hizli.seslab`). Ana sayfa aramasında "Bölüm · Ses laboratuvarı".
- **Kod:** `seslab/seslab.js` = `gorsel3d/gorsel3d.js` kopyasından türetildi; `gorsel3d/` klasörüne (kod, css, model) hiç dokunulmadı. Model `gorsel3d/periferik.json/.bin` yalnızca okunur (aynı önbellek, ikinci 4 MB indirme yok). `seslab/seslab.css` yalnızca sayfaya özgü kurallar (temel düzen gorsel3d.css'ten). Metinler `seslab/seslab-veri.js`. Lisans/yaklaşımlar `seslab/KAYNAKLAR.md`.
- **Animasyonlar** (yalnızca çizimde; büyütülmüş ve yavaşlatılmış, ekranda uyarı): dış kulak yolunda içeri ilerleyen renk halkaları (sıklık frekansla artar); timpanik membran içe-dışa (kenar sabit, umboya doğru artar); malleus + inkus, malleus–inkus ekleminden geçen, manubriuma ve zar normaline dik eksen etrafında dönme (~8°); stapes piston (inkus ucunun piston yönündeki payı); skala media üzerinde bazalden apekse yürüyen dalga, tepe yeri Greenwood (1990) insan formülü (250 Hz bazalden %82, 1 kHz %60, 8 kHz %19). Taban ucu = oval pencereye en yakın köşe, kanal boyunca uzaklık ağ üzerinde (Dijkstra). Modeldeki skala media ~19 mm.
- **Arayüz:** sahne (Ses yolculuğu / Orta kulak [kamera dönme ekseni boyunca] / Koklea), frekans 250–8000 Hz, Oynat/Duraklat (hareket azaltma açıksa duraklatılmış başlar), "Sesi çal" (Web Audio sinüs, kazanç 0,06, kalibre değil uyarısı; sayfadan çıkınca/arka plana geçince susar), görünüm düğmeleri, yapıya dokununca ad/açıklama (3D sayfasıyla ortak metin).
- **Yönetici:** `icerik/sl.sahne.<id>` (ad, aciklama), `sl.metin` (uyari, frekansNot, sesNot, not); sayfa başlığı `sl.sayfa.baslik`; yapı metinleri `g3d.yapi.<id>`. firestore.rules ve CSP değişmedi.
- **Test:** hareket geometrisi Node ile (zar normali vestibüle bakıyor, umbo içe giderken stapes içe gidiyor, skala media baz→apeks sırası spiral boyunca). Edge headless 400/360 px, açık/koyu: JS hatası yok, yatay kaydırma yok, orta kulakta iki karşıt evrede kemikçik konumu farklı, 250 Hz apekse yakın / 8 kHz bazalde. 3D sayfası değişmeden açılıyor. Ses, telefonda denenecek (headless'te duyulmaz).
- **Proje sahibi doğrulayacak:** sahne metinleri; kemikçik hareket yönü/ekseninin öğretim için uygun görünmesi; Greenwood formülünün kullanılması.
- Onaylanırsa main'e birleştirilip yayınlanır (yedek etiketi `yedek-yayin-v32` alınacak).

---

# PROGRESS — OdyoBOT: akustik refleks örüntüsü yorumu (2026-11-17, dal `refleks-yorum`, sw v32, **YAYINDA**; önceki yayın yedeği git etiketi `yedek-yayin-v31`)

Proje sahibinin isteği: refleks sonucuna göre olası bölge OdyoBOT asistanında, şemada gösterilsin; tablo internetten doğrulansın.

- **Kurallar:** `refleks-kural.js` (ekrandan bağımsız). Tek bir bölgedeki bozukluğun beklenen örüntüsü ölçülen örüntüyle birebir karşılaştırılır (Jerger ve Jerger 1977, Clark "Acoustic (stapedius) reflexes" Tablo 1): dikey (prob kulağı: hafif orta kulak ya da 7. sinir), çapraz (uyaran kulağı: koklea/8. sinir/koklear çekirdek — ayırt edilmez), ters L (belirgin orta kulak ya da bir yana yakın beyin sapı), yatay (beyin sapı orta hat), tek kutu (bir taraftan karşıya geçen yol). Hepsi yok / tanımsız örüntü / eksik yol ayrı mesaj.
- **Çapraz kontrol (vaka verisi):** orta kulak adayında timpanogram tipi ve ABG; afferent adayda uyaran kulağının hava yolu eşiği (ders slaytı 22: ≥80 açıklayabilir, 50–79 refleks eşiği yükselmiş olabilir, <50 açıklamaz → ABR).
- Yalnızca "Yok" girilen yol yok sayılır (bir yolda girilen frekansların hepsi yok); yükselmiş eşik "var" (norm yok). Kısmi "yok" frekanslar ayrıca yazılır.
- **Ekran:** OdyoBOT'ta refleksi girilmiş vakada "Akustik refleks örüntüsünü yorumla" seçeneği; sade refleks arkı şeması (`rkSema`: renk uyaran kulağı, noktalı ipsi, düz kontra, yok yollar gri kesikli, olası bölge turuncu `--rk-aday`). Bütün metinler `#b-metinler` (`rk*`), yönetici düzenler. "Tanı koymaz" notu ve kaynak satırı her yorumda.
- Test: `testler/refleks-test.js` 24/24; ekran t-rk.js 20/20 (açık/koyu, 360 px). Diğer testler temiz.
- **Güncelleme (proje sahibinin isteği):** değer girilmeyen yol "yok" sayılır (ekranda uyarıyla). 16 birleşimin hepsi açıklanır: tek bölge (11), iki tanımlı örüntünün birleşimi (örn. sağ ipsi + sol ipsi + sol kontra = sağ dikey + sol çapraz), hepsi yok (iki taraflı aynı bölge birleşimleri + işitsel nöropati notu), yalnız ipsilateral yokluğu (tek ya da iki taraflı) tanımlı örüntü değil → "yer göstermez, ölçümü tekrarla" (ders slaytı 21: ipsilateral artefakta yatkın; internette bu örüntüye yer atayan güvenilir kaynak bulunamadı). Test refleks-test.js 27/27 (16 birleşim taraması dahil), t-rk.js 26/26.
- **Görev seçimi (proje sahibinin isteği):** OdyoBOT artık yalnız maskeleme asistanı diye tanıtılmıyor (karşılama, sayfa açıklaması, ana sayfa hızlı erişimi "OdyoBOT asistanı"). Vaka gelince "Ne yapalım?": Maskeleme kararları (kulaklık sorulur) / Akustik refleks yorumu. Vaka sonunda "Bu vakada refleks yorumu" / "Bu vakada maskeleme" ile geçiş; plato rehberi yalnız maskelemede. t-rk.js 34/34.
- Proje sahibi onaylarsa main'e birleştirilip yayınlanır.

---

# PROGRESS — Yol haritası 2. adım: Vakalarım'a yeni testler (2026-11-17, onaylandı, YAYINDA)

Dal: `adim2-testler` (`adim1-tasarim` + v29 bildirim değişikliği üstüne). sw **v30**. **Yayında (2026-11-17, main 22e0812). Önceki yayın yedeği: git etiketi `yedek-yayin-v28`.** Canlı kontrol: ana sayfa, notlar, vaka formundaki 5 panel, konsol temiz.

| Bölüm | Durum | Not |
|---|---|---|
| Timpanometri: giriş, eğri, kayıt | ✅ (tip sınıflaması bekliyor) | `vaka-testler.js` (yeni dosya, vakalarim.js'ten önce yüklenir). Modül yapısı: `window.VakaTestleri` (temizle, formOku, formDoldur, ayrinti, csv, satirlar, svg). Kayıt `v.timpan.{sag,sol}` = `{basinc (daPa tam sayı −600..400), kompliyans, hacim (ml, 0..9,99, 2 ondalık), duz}`. Eğri tepe noktası + kompliyanstan çan biçiminde, sabit genişlik (σ 42 daPa ≈ yarı yükseklikte 100 daPa); "girilen değerlerden üretilmiş çizimdir" yazısı ekranda ve çıktıda. Yedek/geri yükleme (bozuk değer reddedilir), CSV, JPEG/PDF çıktısı kapsıyor. Eski kayıtlar değişmiyor. Yazılar `#vt-metinler` + form `data-k` (yönetici). Test t-timpan.js 36/36 (açık/koyu, 360 px). |
| Timpanogram tipi (A, As, Ad, B, C) | ✅ | `odyo-hesap.js` → `TIMPAN_SINIR`, `timpanTipi`. Kaynak: proje sahibinin Drive'ındaki ders slaytı `2.timpanometri.pptx` (slayt 30–34). Proje sahibinin kararları (2026-11-17): As < 0,35 ml (0,35 dahil A), Ad > 1,30, A tepe −100…+50 daPa, C tepe < −100 (kompliyansa bakılmaz), +50 üstü sınıflanmaz, B = tepe yok. Kanal hacmi yorumlanmaz (slayt 26 normları yaş/cinsiyete bağlı; vakada yaş yok). Node testi `testler/timpan-test.js` 15/15. |
| Akustik refleks | ✅ | `v.refleks.{sag,sol}.{ipsi,kontra}.{500,1000,2000,4000}` = 50–125 (5'in katı) ya da "yok". Kulak adı uyaranın verildiği kulak (`3.dersaksutik refleksler.pptx` slayt 9, 13). Formda her hücre açılır liste (44 px). Ayrıntı, liste özeti, CSV, yedek, JPEG/PDF. **Vakalarım yalnızca sonucu gösterir; lezyon yeri tahmini proje sahibinin isteğiyle ileride OdyoBOT asistanına (kuralları slayt 25–28'den birlikte netleştirilecek).** Test t-refleks.js 28/28. |
| OAE (DPOAE, TEOAE) | ✅ | `v.oae.{sag,sol}` = `{dp:{f2:{s,g}}, te:{bant:{s,g}}, repro, stab}` (dB SPL, −40…50, 1 ondalık; % tam sayı). Ölçüt `odyo-hesap.js` → `OAE_KURAL`, `oaeSonuc`: fark ≥ 6 dB = emisyon var; en az 3 frekansta → Geçti; 3'ten az frekans girildiyse Değerlendirilemedi; TEOAE tekrarlanabilirlik < %80 ya da stabilite < %90 → Geçersiz kayıt. Kaynak: `Odyoloji_de Enstrümantasyon OAE 2.pptx` (proje sahibinin Drive'ı); diğer ders `OAE.pptx` 3 dB / 3–6 dB diyordu, proje sahibi internetten kontrol istedi: 6 dB ve 3/4 yaygın tarama ölçütü (Interacoustics, Iowa yenidoğan protokolü). Frekanslar (internetten, proje sahibinin isteğiyle): DPOAE f2 1, 1,5, 2, 3, 4, 6, 8 kHz; TEOAE yarım oktav bantları 1–4 kHz. Grafik: DP-gram (sinyal düz + O/X, gürültü kesikli) ve TEOAE çubukları. Node testi `testler/oae-test.js` 9/9, ekran t-oae.js 26/26. |
| ABR | ✅ | `v.abr.{sag,sol}` = [{ db (dB nHL, −10…120 tam sayı), I, III, V (ms, 0…20, 2 ondalık) }] şiddete göre sıralı, en çok 6 satır (formda). Dalgalar arası I–III, III–V, I–V hesaplanır; **norm ve yorum yok**, dalga izi çizilmez. Latans-şiddet grafiği (V. dalga). Kaynak: `ABRSONT (1).pptx` (birimler, dalgalar). Test t-abr.js 26/26. Kayıt fotoğrafı sonradan eklendi (aşağıda). |
| Ortak | ✅ | `vaka-testler.js` modül yapısı (`window.VakaTestleri`): vakalarim.js temizle/form/ayrıntı/liste özeti/CSV, cikti.js çıktı (grafik + tablo; sütunlu tablolar `sutunlar`). Bütün yazılar yönetici düzenler (`#vt-metinler`, form `data-k`). Eski kayıtlar değişmeden açılıp kaydediliyor. Form alanlarında hata kırmızısı (`.fld input.hatali`) eksikti, eklendi. Çıktı alt notu "Odyogram değerleri dB HL." oldu. |

## Önizleme sonrası istekler (2026-11-17, proje sahibi)
- **ABR kayıt fotoğrafı:** en çok 4 fotoğraf; uzun kenar 1600 px JPEG (≤1,5 M karakter). Fotoğraflar IndexedDB `odybot-foto` / `fotolar` deposunda `{id, veri, w, h, olusturma}`; vakada yalnızca `abr.fotolar` (kimlikler). Vaka verisi localStorage'da kaldı (VakaDeposu değişmedi). Yedek dosyasına `fotolar: {id: {veri, w, h}}` eklenir (surum 1, eski sürüm bu alanı yok sayar), geri yüklemede önce fotoğraflar yazılır; bozuk fotoğraf dosyayı reddeder. Çıktıda "ABR kayıt fotoğrafı" bölümü. Hiçbir vakaya bağlı olmayan fotoğraflar `fotoSupur()` ile silinir (açık formdakiler korunur). Formda gizlilik uyarısı (hasta adı/protokol no görünmesin). Yedek paylaşma iPhone'da dokunuştan hemen sonra çalışsın diye fotoğraflar yedek paneli açılınca önceden toplanır. Test t-foto.js 26/26.
- Timpanogramda **Tip A alanı** (kesikli kutu: −100…+50 daPa, 0,35…1,30 ml; `TIMPAN_SINIR`'dan).
- "Ek ölçümler" paneli **"Konuşma odyometrisi"** oldu (ayrıntı ve çıktı başlığı da); panel başlıklarındaki "(isteğe bağlı)" ve maskeleme düzeyindeki "isteğe bağlı" kaldırıldı.
- Proje sahibi yedek alınıp yayınlanmasını istedi.
- (sw v31, 2026-11-17) ABR fotoğrafında kalın uyarı: uygulama içinden çekilenler galeriye kaydedilmez (Android kamera notu ile); çıktı açıklaması yeni testleri sayıyor; CLAUDE.md §3 sekme tablosu güncellendi; eskimiş yönetici testi (t-yon) güncellendi, 0 hata. Önceki yayın yedeği: git etiketi yedek-yayin-v30.

## Proje sahibine bildirilecek / bekleyen
- Refleks sonucuna göre lezyon yeri tahmini: proje sahibinin isteğiyle **OdyoBOT asistanına** yapılacak (ayrı iş, kurallar slayt 25–28'den birlikte netleştirilecek). Vakalarım yalnızca sonucu gösterir.
- OAE frekansları ve 6 dB ölçütü internet kaynaklarına göre seçildi (proje sahibinin isteği); cihazı farklıysa değiştirilebilir (`O_FREK`, `OAE_KURAL`).
- Klinik değerlerin kaynağı: proje sahibinin Google Drive'ındaki 2. sınıf Elektrofizyolojik Testler ve Enstrümantasyon ders slaytları (bağlantı: google-drive MCP).

---

# PROGRESS — Yol haritası 1. adım: tasarım yenilemesi (2026-11-17)

Yol haritası: `YOL-HARITASI.md`. Dal: `adim1-tasarim` (**onaylandı, main'e birleştirildi, yayında 2026-11-17**). sw **v27**.

| Bölüm | Durum | Not |
|---|---|---|
| A) Renkler | ✅ | `PALETTES.logo` varsayılan (`ai`: ana renk üstü yazı, `k`: 3D kartı zemini). Yönetici seçimi artık `ayar/renk` belgesinde; eski `ayar/tema`'da "petrol" kayıtlıydı ve yeni varsayılanı ezecekti. Eski belge yalnızca canlıdaki eski sürüm için kalıyor. firestore.rules değişmedi (`ayar/{id}` zaten herkes okur, yönetici yazar). |
| B) Alt çubuk, logo | ✅ (v27: proje sahibinin isteğiyle dış beyaz çerçeve kaldırıldı; kenara değen beyaz ayırıcılar da 40 px içinde saydam, iç beyazlar korundu. Eski dosya ve betik v2: `ham-gorseller/yedek-logo-2026-11-17/`) | Kaynak `ham-gorseller/logo/OdyoBOT.jpg`'den yeniden temizlendi: renkli alan maskesi → 30 px kapatma (iç beyazlar korunur) → pürüz yumuşatma → 8 px düzgün beyaz kenar → 264 px PNG `icons/odyobot-logo-seffaf.png`. Fable'ın dosyası, 512 px kopya ve betik: `ham-gorseller/yedek-logo-2026-11-17/`. PWA simgeleri ve `icons/logo.png` değişmedi. Logonun arkasında, çubuğun üstünde sayfa zemini renginde yarım daire (içerik arkadan görünmez). Seçili OdyoBOT: yazı ana renk + altında kısa çizgi. |
| C) Ana sayfa | ✅ | Üst satır, arama (`araListe`/`araCiz`, Türkçe harf farkı gözetmez), hızlı erişim, büyük 3D kartı (`images/3d-onizleme.jpg`, modelin ekran görüntüsü), Kaldığın yerden, Favori notlar, Duyurular (akis.js `anaListeCiz`: süresi geçmemiş en yeni 5 kayıt; "Yeni" rozeti `odybot:sonZiyaret`). Tam liste ve yönetici formu yeni alt sayfada `#duyurular`. Ana sayfa yazıları `#ana-metinler` (yönetici). |
| D) Cihazlar | ✅ | İki sütun; geniş kart ve düzenlenen kart tam genişlik. İşitme cihazlarında rozet yok (implantlarda var). Sayfa başı açıklamalar kaldırıldı; `cihaz.temsili` notu sonda. |
| E) Ders notları | ✅ (ek, proje sahibinin isteği: not ekleme Ayarlar'dan Ders notları sayfasına, yalnızca yöneticiye görünen açılır panele taşındı `#not-yonetim`. Yönetici konu başlığı ekler, adını değiştirir, siler; silinen başlığın notları "Diğer notlar"a geçer. Notun başlığı not sayfasından ya da not eklerken seçilir. Düzen `ayar/notGruplari` belgesinde (kural değişmedi). Eski "Grup adlarını düzenle" kaldırıldı. Test 15/15.) | `NOT_GRUPLARI` + `GRUP_AD` (yönetici düzenler: `icerik/not.gruplar`). Not sayfası `#not/<anahtar>` (koddaki `not.<sıra>`, eklenen `nd.<belge>`). |
| F) Genel düzen | ✅ | `.alt-bas` (geri oku + sayfa adı): vaka formu/ayrıntısı, not sayfası, 3D, Duyurular, Ayarlar, Yönetici girişi. Büyük harfli daktilo etiketler normal yazıya çevrildi (`.fld label`, `dt`, `.kicker`, `.etiket`, `.fld-ad`, `.og-baslik`, `.tag`, `.rozet`, 3D `.g3d-baslik`). Sayı/veri yazıları (dB, frekans başlıkları, etkinlik tarihi) daktiloda kaldı. |
| G) Eşik tablosu | ✅ | Kulak başına tablo (`hucreOlustur`), Maskeli / Yanıt yok / Sonraki, maskeleme düzeyi tek kutuda (seçili maskeli hücre). Kayıt biçimi aynı. Sembol açıklaması `<details>` içinde, kapalı. |

## Yeni adresler
`#duyurular`, `#duyurular/yeni` (yönetici formu açar), `#not/<anahtar>`, `#depo/isitme|implant|sema`, `#depo/yolak|refleks|tarama/<id>`, `#depo/cihaz/<id>`, `#vakalarim/yeni`, `#vakalarim/v/<vaka kimliği>`. Derin bağlantılar işini yapıp adresi sade hâline çevirir. Sayfa ilk açılırken eylem `DOMContentLoaded` sonrasına bırakılır (yoksa vakalarim.js henüz yüklenmemiş oluyordu).

## Yeni cihaz içi anahtarlar (localStorage; kişisel veri değil)
`odybot:favoriNotlar` (not anahtarları), `odybot:sonNot` (not anahtarı), `odybot:sonVaka` (yalnızca vaka kimliği, değerler değil), `odybot:sonZiyaret` (zaman).

## Test (yerel, sahte Firebase + Edge görünmez; betikler geçici klasörde: server.js, sahte-firebase.js, cdp.js, t-ana/t-etk/t-yon/t-tablo/t-hrk/t-cevrimdisi.js)
- 360 ve 400 px, açık/koyu: ana sayfa, notlar, not sayfası, cihazlar, implantlar, şemalar, vaka formu, duyurular, 3D, OdyoBOT, Ayarlar. Yatay kaydırma yok; 44 px altı hedef yalnızca 44 px'lik etiketin içindeki onay kutuları ve metin içi bağlantı.
- Etkileşim 37/37: arama (not, cihaz, şema, Türkçe harfsiz), hızlı erişim, favori, kaldığın yer, eski kaydın tabloda açılması (M, NR, ara frekans, maskeleme düzeyi) ve değiştirmeden kaydedince eşiklerin aynı kalması, yeni vaka (Sonraki, Maskeli + düzey, NR, aralık dışı uyarı, kayıt), geri okları, duyuru ayrıntısı.
- Yönetici 16/16: ana sayfa yazılarını düzenleme, `#duyurular/yeni`, haber paylaşma, ayrıntıdan Düzenle, grup adları, not düzenleme, tema (Logo varsayılan, `ayar/renk`), cihaz kartını düzenlerken tam genişlik.
- Eşik tablosu 360 px'te ana frekanslar kaydırmasız sığıyor (hücre 44×48); ara frekanslarla yana kayıyor, satır adları sabit.
- Hareket azaltma açıkken 3D kartında animasyon yok. İnternetsiz açılış (v26, 57 dosya). Konsolda hata yok. Maskeleme testleri 27/27.
- Test sırasında görülen ve düzeltilen: hücre seçimi yalnız odaklanmaya bağlıydı (dokunma/yazma da seçiyor); 3D kartının dört düzenleme düğmesi aynı yazıyı taşıyordu (`data-etiket`); "Kaldığın yerden" kartında 360 px'te kelime bölünüyordu.

## Yayından sonraki düzeltmeler (2026-11-17, sw v28, yayında; önceki yayın yedeği git etiketi yedek-yayin-v27)
- Alt çubuk: logonun arkasındaki zemin renginde yarım daire kaldırıldı (proje sahibi "çıkıntı" diye beğenmedi), logo 66 → 56 px, üstten 22 px taşar.
- Vakalarım: kaydetme bildirimi. `OdyoUI.bildirim(metin, 'tamam'|'hata')` (app.js, ortak): ekranın üstünde, başarı 3 sn, hata 6 sn, dokununca kapanır; ekran okuyucu okur (status/alert). Yazılar `#v-metinler` (yönetici düzenler): kaydedildi, guncellendi, hataAlan ({n}), hataKimlik, hataDepo. Formun altındaki eski ileti de duruyor. Renkler iki temada aynı (beyaz yazıyla kontrast 6 üstü). Test 16/16 (açık/koyu).
- (sw v29, `adim1-tasarim` dalında, **henüz yayında değil**) Proje sahibinin isteği: bildirim süresi başarıda 4 sn, hatada 7 sn; başarı yeşili açık ton #2FBF68, yazı koyu yeşil #052E16 (kontrast 6,2). Test 17/17.

## Renk kontrastı ölçümü (WCAG, 2026-11-17)
- Betik: geçici klasörde t-kontrast.js. 14 sayfa × açık/koyu, 360 px; görünen her yazı ve yer tutucu, gerçek zemin ve saydamlık hesaba katılarak. Eşik: normal yazı 4,5, büyük yazı 3. SVG şemalardaki yazılar bu ölçüme girmedi.
- Düzeltilen: süresi geçen etkinlik/ilan kartları bütünüyle soluktu (2,0–3,6) → yalnızca görsel soluk, yazı ikincil renkte; yer tutucu yazılar (3,4–4,2) → ikincil yazı rengi.
- Kalan tek bulgu: seçili hücre yokken kapalı duran "Maskeli" düğmesi (3,1). Kapalı (kullanılamaz) düğmeler WCAG'de muaf; bilerek bırakıldı.
- Proje sahibinin kararları: hızlı erişimdeki "Ders notları" kısayolu 4. adımdaki Kütüphane birleşmesine kadar kalıyor; eşik tablosu yayından sonra telefonda denenecek; OAE başlığı şimdilik kalıyor.

## Proje sahibine bildirilecek
- Not grubu adları (Temel odyometri, İmmitansmetri, Elektrofizyoloji) referans görseldeki örneklerden alındı. OAE'nin "Elektrofizyoloji" altında olması tartışılabilir; uygulamadan değiştirilebilir.
- Önizleme sonrası onay → main'e birleştirme ve yayın.

---

# PROGRESS — Vakalarım sekmesi

Yeni oturumda: "PROGRESS.md'ye bak, devam et". Onaylı plan: `C:\Users\Hmd\.claude\plans\nerede-kalm-t-k-twinkly-dragon.md`.

## Aşamalar
| # | Aşama | Durum |
|---|---|---|
| 1 | A+B+F: liste, form, kaydetme, yedekleme | ✅ Bitti (2026-11-09), sw v6 |
| 2 | C: odyogram çizimi | ✅ Bitti (2026-11-09), sw v7 |
| 3 | D: otomatik hesaplama (`odyo-hesap.js`) | ✅ Bitti (2026-11-09), sw v8 |
| 4 | E: ek ölçümler | ✅ Bitti (2026-11-09), sw v9 |

**Durum:** İstenen işlerin hepsi bitti ve yayında. Proje sahibi telefonda denedi, her şey düzgün (2026-11-09).

## Yapılanlar (Aşama 1)
- "Geçmiş" sekmesi "Vakalarım" oldu: alt çubuk, başlık, `#vakalarim`. Eski `#gecmis` adresi `app.js` `route()` içinde yönlendiriliyor.
- `vakalarim.js` (yeni): veri temizleme (`temizle`), veri katmanı (`VakaDeposu`: hepsi, kaydet, sil, hepsiniYaz, degisince; içi localStorage `odybot:vakalar`), form, liste, ayrıntı, yedek (JSON indir/paylaş), CSV (BOM + `;`), geri yükleme (birleştir/üzerine yaz), 10 kayıtta bir hatırlatma.
- Eski kayıtlar (`etiket`, `not`) okunurken `kimlik`, `notlar` olur; ilk yazmada yeni biçimde kaydedilir.
- `app.js`: eski Geçmiş kodu ve `makeLocalDb` silindi; `window.OdyoUI = { h, $, todayISO, fmtDate }` eklendi.
- Sabit yazılar `data-k="vakalarim.*"` ile yöneticiye düzenlenebilir.

## Yapılanlar (Aşama 2)
- `cizOdyogram(vaka, {kulaklar, kucuk})` SVG (vakalarim.js). Ortak panel `#v-grafik` (tek/ayrı düğmesi + lejant, `data-k` ile düzenlenebilir) formda kulak seçiminin üstüne, ayrıntıda başlığın altına taşınır. Kartta küçük odyogram.
- Çizgi stili (proje sahibinin düzeltmesi, sw v10): hava yolu DÜZ, kemik yolu KESİKLİ, iki kulakta da; renk kulağı gösterir. Lejantta iki çizgi açıklaması var. (İlk istekte "sol kesikli, kemik çizgisiz" yazıyordu; proje sahibi bunu düzeltti.)
- Çizgi kuralı (hava ve kemik için aynı): boş ANA frekans çizgiyi koparır; boş ARA frekans koparmaz; NR noktası çizgiye bağlanmaz (`NR_CIZGIYE_BAGLA`). Proje sahibine söylendi, isterse değiştirilir.
- Tercih `odybot:grafik` (tek/ayri).

## Yapılanlar (Aşama 3)
- `odyo-hesap.js`: `ESIK_TABLOSU` (Clark), `ABG_ESIGI = 10`, `PTA_FREKANSLARI`, `pta`, `derece`, `normalMi`, `tip`, `degerlendir`, `ptaMetni`, `kisaOzet`. Node ile test edilebilir (`require`).
- "Normal" sınırı tablonun ilk satırı (15 dB). Küsuratlı PTA yuvarlanmadan sınıflanır (15,3 → çok hafif).
- Sonuç kartı `#v-sonuc` (3/4 frekans düğmesi `odybot:ptaTur`, uyarı yazısı `data-k`): formda eşiklerin altında canlı, ayrıntıda grafiğin altında. Kart özeti tip + derece. CSV'ye PTA/ABG/derece/tip sütunları.

## Yapılanlar (Aşama 4)
- Formda katlanır "Ek ölçümler" (`#v-ek`): her kulak için SRT, SDS/WRS (%), sunum düzeyi, konuşmada maskeli, MCL, UCL, Rinne; Weber. Hepsi isteğe bağlı, aynı kırmızı alan doğrulaması.
- Weber/Rinne tek seçimli düğme grupları; seçili düğmeye yeniden dokununca seçim kalkar. "Yapılmadı" kartta yazılmaz, ayrıntıda yazılır.
- Ayrıntıda "Ek ölçümler" tablosu, kartta kısa özet, CSV'de sütunlar. Grafiğe girmez.
- Form vakanın tüm alanlarını içerir: formda boşaltılan alan kayıttan da çıkar.

## Kalanlar / olası sonraki işler
- Telefonda deneme: tamamlandı, sorun yok (2026-11-09).
- Fotoğraf ekleme (proje sahibi sonra yapacak): o zaman `VakaDeposu`'nun içi IndexedDB'ye çevrilecek.

## Dikkat
- Her yayında `sw.js` `VERSION` +1; yeni dosya → `ASSETS`'e ekle.
- dB alanı `type="number"`, `inputmode` yok (iPhone'da eksi tuşu için).
- Boş frekans depoda hiç yazılmaz; çizgi ve hesap boş frekansı atlar.
- Test: geçici klasördeki `server.js` (localhost:8765) + `cdp.js` (Edge headless) + `t1.js`…`t4.js`, hesap için `t3-hesap.js` (42 durum). Geçici klasör oturuma özel; kaybolduysa yeniden yazılır.

---

# PROGRESS — OdyoBOT maskeleme asistanı (2026-11-10)

Onaylı plan: `C:\Users\Hmd\.claude\plans\csp-yok-index-html-e-bir-polished-starfish.md`

| # | Adım | Durum |
|---|---|---|
| 1 | CSP satırı (`index.html`) | ✅ Bitti, yerelde Firebase/giriş/servis çalışanı sorunsuz |
| 2 | Alt çubukta Vakalarım ↔ Notlar | ✅ Bitti |
| 3 | Odyogram çıktısı: JPEG/PDF, detaylı / yalnızca odyogram (`cikti.js`) | ✅ Bitti, sw v12 |
| 4 | Vakalarım → OdyoBOT (seçim modu, "OdyoBOT'a gönder"), sohbet iskeleti (`odybot.js`) | ✅ Bitti, sw v12 |
| 5 | Kural tablosu Katz fotoğraflarından okundu (aşağıda) | ✅ Proje sahibi onayladı (2026-11-10): plato 5 dB × 3 artış; baskı hatası düzeltmeleri, ön karar, yalnız kulak üstü/insert kabul |
| 6 | `maskeleme-kural.js` + bot kararları + plato rehberi + testler (`testler/maskeleme-test.js`, 25/25) | ✅ Bitti, sw v13 |

## Kural tablosu — Katz'tan okundu (2026-11-10), proje sahibinin son onayını bekliyor
Kaynak: Katz J. (baş ed.), *Temel Klinik Odyoloji*, 7. baskı (Türkçe çeviri, Pelikan 2022; çeviri ed. B. Gündüz).
Bölüm 6 "Klinik Maskeleme" (W. S. Yacullo; çeviren U. Derinsu), s. 77–111. Fotoğraflar: `ham-gorseller/katz maskeleme/` (38 fotoğraf, hepsi okundu).
Uygulamada kitaptan metin/görsel kopyalanmaz; yalnızca değerler ve kurallar kendi cümlelerimizle yazılır, kaynak gösterilir.

Kitaptaki kısaltmalar: KAA = kulaklar arası azalma (IA), TE = **tıkanma etkisi** (oklüzyon), EM = etkili maskeleme,
IIY = hava yolu, KY = kemik yolu, KAE = konuşmayı anlama eşiği (SRT), KFE = konuşmayı fark etme eşiği.
Aşağıda "TK" = test kulağı, "KK" = karşı (test edilmeyen) kulak.

| # | Konu | Katz'taki değer / kural | Sayfa | Taslakla fark |
|---|---|---|---|---|
| 1 | KAA, hava yolu, kulak üstü | **40 dB**, bütün frekanslarda (ihtiyatlı) | 79 | aynı |
| 2 | KAA, hava yolu, insert (3A, derin) | **≤1000 Hz: 75 dB**, **>1000 Hz: 50 dB** | 80 | taslak 70/55 idi → düzeltildi |
| 3 | KAA, kemik yolu | **0 dB**, bütün frekanslarda | 82 | aynı |
| 4 | KAA, konuşma | kulak üstü **40 dB**, insert **60 dB** (eşik ve eşik üstü) | 82 | taslakta soru idi → cevaplandı |
| 5 | Hava yolunda maskeleme gerekir mi? | TK hava eşiği − KK **maskesiz kemik** eşiği ≥ KAA. Kemik henüz yoksa ön karar: TK hava − KK hava ≥ KAA (kemik ölçülünce tekrar bakılır) | 82, 84 | aynı + ön karar kuralı eklendi |
| 6 | Kemik yolunda maskeleme gerekir mi? | TK'de hava-kemik aralığı (TK hava − maskesiz kemik) **≥ 15 dB**. ≤10 dB ise gerekmez. (ASHA'nın 10 dB'i "çok katı" bulunuyor) | 84–85 | taslakta soru idi → **15 dB** |
| 7 | Başlangıç maskeleme, hava yolu | KK hava eşiği **+ 10 dB** (dB EM) — kulaklık tipinden bağımsız | 93 | aynı |
| 8 | Başlangıç maskeleme, kemik yolu | KK hava eşiği **+ TE + 10 dB** | 93–94 | aynı |
| 9 | TE (tıkanma etkisi), kulak üstü | **250 Hz 30, 500 Hz 20, 1000 Hz 10 dB** (≥2000 Hz: 0) | 94 | taslak 20/15/5 idi → **yanlıştı, düzeltildi** |
| 10 | TE, insert (3A, derin) | **250 ve 500 Hz 10 dB, ≥1000 Hz 0 dB** | 94 | aynı |
| 11 | TE eklenmez | KK'de o frekansta **≥ 20 dB** olası hava-kemik aralığı varsa | 94 | yeni |
| 12 | En çok maskeleme (aşırı maskeleme sınırı) | **TK kemik eşiği + KAA − 5 dB** (gerçek kemik bilinmiyorsa maskesiz kemik kullanılır) | 94–95 | aynı |
| 13 | Plato (Hood) adımları | Başlangıç düzeyiyle eşik yeniden bulunur. Cevap varsa **maske +5 dB**; cevap yoksa **ses +5 dB**. Maske **15–20 dB** (3–4 ardışık artış) boyunca eşik değişmezse plato; maskeli eşik = o ses düzeyi. 10 dB adım da kabul, ama dar plato/aşırı maskeleme riskinde 5 dB şiddetle önerilir | 97–98 | genişlik 15–20 dB |
| 14 | Plato sonuçları | (1) eşik hiç kaymaz → maskesiz eşik doğruydu; (2) kayar sonra sabitlenir → plato eşiği; (3) cihaz sınırına kadar kaymaya devam eder → ölçülebilir işitme yok (aşırı maskeleme yoksa) | 98–99 | yeni |
| 15 | Maskeleme ikilemi | İki taraflı iletim kaybında plato dar/yok olabilir; çözüm insert kulaklık | 99 | yeni (uyarı) |
| 16 | Santral maskeleme | ~5 dB; eşiklerden **çıkarılmaz**; maskeli/maskesiz arasındaki 5 dB fark genelde anlamlı sayılmaz | 99–100 | taslakta soru idi → yalnızca not |
| 17 | Konuşmada maskeleme gerekir mi? | Sunum düzeyi (TK) − KK'nin **250–4000 Hz en iyi kemik eşiği** ≥ KAA. Ön karar: KAE(TK) − KAE(KK) ≥ KAA | 86, 89 | aynı |
| 18 | Konuşma, başlangıç (plato yöntemi, KFE/KAE) | KK KAE + 10 dB (dB EM) | 101 | yeni |
| 19 | Konuşma, en az maskeleme (akustik) | Sunum(TK) − KAA **+** KK'nin 250–4000 Hz **en büyük** hava-kemik aralığı | 103, 105, 109 | yeni. **Not:** s. 105'te formül "−" basılmış ama hesap "+" ile yapılmış; s. 103 ve 109 "+" |
| 20 | Konuşma, en çok maskeleme | TK'nin 250–4000 Hz **en iyi** kemik eşiği + KAA − 5 dB | 103 | yeni. **Not:** s. 109 örneğinde "−60" basılmış, sonuç (110) "+60" ile doğru |
| 21 | Konuşma, orta düzey (plato merkezi) | (en az + en çok) / 2 | 104 | yeni |
| 22 | Konuşma, sadeleştirilmiş | EM = Sunum(TK) − 20 dB. Ön koşul: iki kulakta da ≥15 dB hava-kemik aralığı yok **ve** konuşma KAE'ye göre 30–40 dB SL'de | 104–105 | yeni |

### Kitaptan otomatik test vakaları
- **Şekil 6.4 (s. 83–84), saf ses hava yolu:** Sağ hava 250–8000: 55, 60, 80, 90, 95, 100; sol hava: 20, 25, 30, 35, 40, 45;
  maskesiz kemik: 0, 5, 25, 30, 40, 45 (8000 Hz tahmini). Kulak üstü → sağ her frekansta **Evet**, sol her frekansta **Hayır**.
  Insert → sağ 250/500/1000 **Hayır**, 2000/4000/8000 **Evet**.
- **Şekil 6.5 (s. 85–86), kemik yolu:** A: maskeleme gerekmez; B: yalnız sağ; C: iki kulak.
- **Şekil 6.8 (s. 93–95), başlangıç ve en çok düzey:** KK hava 5 → hava yolu başlangıç 15 dB EM; kemik yolu 500 Hz (kulak üstü, TE 20) → 35 dB EM;
  en çok: 5 + 60 − 5 = 60 dB EM.
- **Şekil 6.11 (s. 98), plato:** üç sonuç (75 dB'de sabit; 95 dB'de plato; 120'de cevap yok).
- **Şekil 6.6 / 6.7 (s. 87–90), konuşma ihtiyacı:** 6.6: sağ (tahmini KAE 80) − sol en iyi kemik 15 ≥ 40 → Evet; sol 20 − 55 → Hayır.
  6.7: sunum 50, KK en iyi kemik 0 → kulak üstü Evet (≥40), insert Hayır (<60).
- **Şekil 6.14 (s. 105–107), konuşma düzeyi:** sunum 95, KK en iyi kemik 30, en büyük ABG 5, TK en iyi kemik 45 →
  kulak üstü: en az 60, en çok 80, orta 70; insert: en az 40, en çok 100, orta 70; sadeleştirilmiş 75 dB EM.
- **Şekil 6.15 (s. 108–109):** sunum 100, insert → en az 40, en çok 110, orta 75; sadeleştirilmiş 80 dB EM.

### Proje sahibinin cevapları (2026-11-10)
1–4: Claude'un önerileri kabul; plato = 5 dB adımla art arda 3 artış (15 dB). İnternetten karşılaştırma yapıldı (aşağıda).

### (Eski) sorular
1. Baskı hatası notları (19, 20) doğru mu: en az formülde "+", en çok formülde "+KAA"?
2. Plato genişliği: 15 dB (5 dB adımla 3 artış) mı, 20 dB mi?
3. KK'de o frekansta kemik eşiği yoksa: bot ön kararı hava-hava karşılaştırmasıyla (kural 5) verip "kemik ölçülünce tekrar bak" desin mi?
4. Kulaklık tipine "kulak çevresi" eklensin mi? (Kitap yalnızca kulak üstü ve insert için değer veriyor.)

## Teknik notlar (bu iş)
- `vakalarim.js` sonunda `window.OdyoVaka`: diğer dosyaların kullandığı ortak arayüz (vakalar, çizim, sonuç satırları, lejant).
- Bota gönderme: yalnızca vaka kimlikleri `sessionStorage` `odybot:gonderilen` ile + `odyobot:vakalar` olayıyla taşınır.
- Bot mesaj metinleri `index.html` → `#b-metinler` (`data-k="odybot.m.*"`, `data-m`). Yalnızca yöneticiye görünür (`html.yonetici`, `app.js` `setEditMode`).
- Çıktı renkleri `styles.css` `--cikti-*` (temadan bağımsız, her zaman beyaz kâğıt).
- PDF'in görünüşü bu bilgisayarda görüntülenemedi (araç yok); yapı (xref) doğrulandı. Telefonda bakılacak.
- iPhone'da "Paylaş": dosya hazırlanırken kısa süre geçer; Safari paylaşma penceresini açmazsa "İndir" denenecek.

## İnternet karşılaştırması (2026-11-10)
- Kulak üstü KAA 40 dB, kemik 0 dB, kemik için ABG ≥ 15 dB, başlangıç = KK hava + 10, plato 5 dB × 3 artış (15 dB), kemik yoksa hava-hava ön karar: kaynaklarla uyumlu.
- Insert KAA kaynaklara göre 50–70 dB arasında değişiyor; Katz (≤1000 Hz 75, >1000 Hz 50) kullanıldı.
- Karşı kulağın ABG'si en az düzeye **eklenir** (Interacoustics) → s. 105'teki "−" baskı hatası kararı doğrulandı.
- "TK kemik + KAA − 5" en çok formülü internette bulunamadı (kitaba özgü Lidén formülü); Katz s. 94 esas alındı.
- Kulak çevresi (HDA 200) için yaygın kabul görmüş ayrı bir KAA değeri yok; tek çalışma 40 dB kuralını öneriyor → seçenek eklenmedi.

---

# PROGRESS — Görsel depo: 3D model (2026-11-14, sw v18)

**Durum:** Kod bitti, yerelde test edildi. **Yayında** (2026-11-14). Telefonda denenecek.

## Paket
Proje sahibinin getirdiği hazır `gorsel3d/` klasörü (görüntüleyici, veri, css, model, KAYNAKLAR.md). `ornek.html` ve `ornek.js` (deneme sayfası) istendiği gibi depoya alınmadı.
`periferik.bin` / `periferik.json` değiştirilmedi.

## Kaynaklar ve lisanslar
- Sieber D. ve ark., OpenEar kütüphanesi, örnek ZETA (sağ kulak), https://zenodo.org/records/1473724 — CC BY 4.0. Orta kulak, iç kulak, sinirler, dış kulak yolu, damar ve kemik.
- Artec 3D kulak taraması, https://www.artec3d.com/3d-models/ear — CC BY 3.0. Kulak kepçesi (başka bir kişiye ait).
- İki lisans da atıf istiyor: ekrandaki "Kaynaklar" satırı kaldırılmamalı. Ayrıntı ve yapılan değişiklikler: `gorsel3d/KAYNAKLAR.md`.
- **Kepçenin arka yüzü ve kepçe ile kanal arasındaki ~8 mm'lik ara parça ölçülmüş veri değildir; bölge sınırları yaklaşıktır.** (Ekrandaki not yazısında da yazıyor.)

## Yapılanlar
- `index.html`: depo düğmelerine "3D model" (`#seg-3d`, düğme grubu `seg4`), panel `#p-3d` > `#g3d-kok`; `gorsel3d/gorsel3d.css` ayrı dosya olarak bağlandı (paket kendi içinde bütün kalsın diye); `gorsel3d-veri.js` ve `gorsel3d.js` `app.js`'ten önce.
- `app.js`: `SEGS` içine `3d`; `seg('3d')` → `kur3d()`. Tembel yükleme: `Gorsel3D.kur` yalnızca bölüm ilk açılınca çağrılır, sonra aynı örnek kalır. Açılışta `.bin` istenmez (testte doğrulandı).
- Yönetici düzenlemesi: `editable/applyOv/adminPart`. Anahtarlar `g3d.bolum.<id>`, `g3d.yapi.<id>`, `g3d.kepce` (ad, aciklama), `g3d.metin` (ipucu, not). "Düzenle" bilgi kartında (`kartEki`), "İpucu ve notu düzenle" notun altında. `refresh3d()` `refreshContent()` içinde; `yenile()` çağırır. Görünüm (açık/koyu) değişince de `yenile()` (renkler yeniden okunur).
- `gorsel3d.js` uyum değişiklikleri (çizim/kamera/dokunma hesapları değişmedi): `yenile()` ipucu ve not yazısını da tazeler; notun altına `kartEki('metin', 'metinler', yuva)` için ek yuva.
- `gorsel3d.css`: düğme kuralları `.g3d button` yerine `.g3d-satir/.g3d-yapilar/.g3d-durum button` (yöneticinin Kaydet/Düzenle düğmelerini bozmasın diye); kaynak bağlantıları ≥44 px; koyu görünümde `--g3d-silik: #B5C4C9`; model yüklenmeden boş kart gizli.
- `sw.js`: v18; ASSETS'e `gorsel3d.js`, `gorsel3d-veri.js`, `gorsel3d.css`, `periferik.json`. `.bin` için ayrı kural: önce önbellek, yoksa internet ve kaydet; arka planda yeniden indirmez. VERSION artınca eski önbellek (bin dahil) silinir → dosya adına sürüm eklemeye gerek yok.
- `firestore.rules`: değişiklik gerekmedi (`icerik/{id}` her anahtara izin veriyor, alan sınırı 20; burada en çok 2 alan). CSP: değişiklik gerekmedi (model `connect-src 'self'`).
- Temalar: 5 tema yalnızca `--accent`/`--bot` değiştiriyor; 3D bölüm `--accent` kullandığı için hepsine uyar.

## Testler (yerel, http://localhost, görünmez Edge 400 px, sahte Firebase ile admin)
- Açılışta `.bin` isteği 0; 3D açılınca 1; sekme değiştirip dönünce yine 1, tek canvas.
- 6 bölüm, bilgi kartı ve sağ üst yazı doğru; iç kulakta yapı seçimi (diğerleri silik); kanvasa dokunma → "Kulak kepçesi" açıldı, 11 bölüm + dış kulak yolu düğmeleri; sonraki dokunuş "Antiheliks".
- 5 görünüm düğmesi; yatay taşma yok (400/400); 44 px altı hedef yok.
- Admin: İnkus adı değiştirildi → `icerik/g3d.yapi.inc` yazıldı, kart ve düğme yeni adla; "Varsayılana dön" → kayıt silindi, eski ad döndü. İpucu değişikliği ekrana yansıdı.
- İnternetsiz: model indirilmemişse "Model indirilemedi…" + "Yeniden dene"; internet gelince "Yeniden dene" ile yüklendi. İndirilmişse internetsiz açıldı. İnternet varken yeniden açılışta `.bin` tekrar indirilmedi.
- Açık ve koyu görünüm ekran görüntüleriyle kontrol edildi. Mevcut maskeleme testleri: 27/27.

## Sonraki iş (şimdi yapılmayacak)
- "Vestibüler" başlığı altında kulak kristallerinin (otokoni) hareketi.

## Düzeltme: dokunma ve telefon düzeni (2026-11-14, sw v19)
Proje sahibinin bildirdiği sorun: bir yapı seçilince başka yapıya dokunulamıyor, genel görünüme dönülemiyordu; telefonda Bölüm/Yapılar/açıklama/Görünüm düzeni zayıftı.
- Neden: seçim varken öteki yapılar soluk (saydam) çiziliyor ve isabet testi soluk yapıları atlıyordu; seçimi kaldırmanın tek yolu listedeki düğmeydi.
- `gorsel3d.js` (proje sahibinin isteğiyle dokunma davranışı değişti; çizim ve kamera hesapları aynı):
  - İsabet testi seçim yokmuş gibi yapılır → seçiliyken başka yapıya dokunulabilir.
  - Seçili yapıya yeniden dokunmak ya da boşluğa dokunmak seçimi kaldırır.
  - Modelin sol üstünde "← Geri" düğmesi: seçimi kaldırır → kepçe bölümlerini kapatır → Tüm sistem'e döner; Tüm sistem'deyken gizli. Metni `metinler.geri`.
  - Sıra: model, ipucu, açıklama kartı, Bölüm (3 sütun), Görünüm (tek satır, 5 sütun), Yapılar (en sonda), not, kaynaklar.
  - Listeden ya da bölüm düğmesinden seçim yapılınca model ekranda değilse yukarı kaydırılır.
- `gorsel3d.css`: Geri düğmesi, bölüm ızgarası, görünüm çubuğu, daha sık yapı düğmeleri; telefonda model yüksekliği `min(52vh, 420px)`.
- Test (açık/koyu): Malleus seçiliyken modelde İnkus'a dokunma → İnkus; boşluğa dokunma → seçim kalktı; Geri zinciri Tragus → Kulak kepçesi → Dış kulak → Tüm sistem, sonda Geri gizli; 400 px taşma yok, 44 px altı hedef yok; önceki testler (düzenleme, internetsiz) yine geçti.

## Skala media eklendi (2026-11-14, sw v20)
Proje sahibi "iç kulakta skala media nerede" diye sordu; kaynak modelde ayrı parça yok. Proje sahibi elle çizilmesini seçti (2. yol), yedek istedi.
- **Yedek:** `ham-gorseller/yedek-3d-v19/` (önceki bin/json/js/css/KAYNAKLAR + üretim betikleri + OKU.md; git dışında) ve git etiketi `yedek-v19-skala-media-oncesi` (yalnızca yerelde, GitHub'a gönderilmedi). Geri dönüş: dosyaları geri kopyala, VERSION artır, yayınla.
- **Nasıl çizildi:** Modelde sv ile st birbirine değiyor (aralarında boşluk yok). Bölme = st yüzeyine 0,12 mm'den yakın sv köşeleri (1014 nokta). st'nin merkez çizgisi boyunca her dilimde bölmenin modiolustan en uzak (dış) kenarı bulundu; tüp merkezi bu kenardan skala vestibuli yönüne 1,05·R, içe 0,9·R kaydırıldı. R = 0,28 mm, 12 kenarlı tüp, uçlar yarım küre; uzunluk ~21 mm, 1358 köşe / 2712 üçgen, +28 KB.
- **Kontrol:** 54 merkez noktasından 50'si sv tarafında, 0'ı st içinde, 4'ü uçlarda dışarıda. Eski 31 parçanın baytları birebir aynı (ilk 3 944 972 bayt md5 aynı); yeni parça dosya sonuna eklendi (`periferik.json` `surum: 2`, `bayt: 3973466`).
- **Veri:** `sm` → Tüm sistem ve İç kulak listelerinde sv ile st arasında; renk `--g3d-sm: #C8D63A`; açıklama "tarama verisi değildir, yaklaşıktır" diyor (proje sahibi doğrulayacak). Ekrandaki not ve değişiklikler satırı, `KAYNAKLAR.md` güncellendi.
- **Sınır:** Seçilmediğinde sv'nin içinde kaldığı için neredeyse görünmez; modelde dokunarak seçilemez (önce sv'ye isabet eder), listeden seçilir. Kesit gerçekte üçgen; burada yuvarlak tüp.
- Testler (açık/koyu): önceki bütün senaryolar geçti; İç kulak'ta 9 yapı.

---

# PROGRESS — Görsel depo yeniden düzenleme ve yeni cihaz görselleri (2026-11-15, sw v21)

**Durum:** Bitti, **yayında** (2026-11-15, commit 9ab105e). Telefonda denenecek.

## Görsel uygunluk tablosu (kaynak: `ham-gorseller/yeni cihaz gorselleri/`, Gemini ile üretilmiş)
| Dosya (parça) | Kart | Karar | Not |
|---|---|---|---|
| d6v3vh | bte | ✅ eklendi → `bte-2.jpg` (87 KB) | |
| tmvgky | cros-bicros (yeni) | ✅ → `cros-bicros.jpg` (111 KB) | Tekrar eden alt "İşitmeyen kulak: verici (mikrofon)" etiketleri ve çizgileri silindi (zemin rengiyle boyandı) |
| d98ive | kemik-bant | ✅ → `kemik-bant-2.jpg` (90 KB) | Şüphe: "Bağlantı diski" çizgisi boş noktayı gösteriyor |
| ts8lxj | kemik-yapiskan (yeni) | ✅ → `kemik-yapiskan.jpg` (98 KB) | Şüphe: mastoid kemik deri üstünde gibi |
| 1dhnq9 | ki-elektrot | ✅ → `ki-elektrot-2.jpg` (144 KB) | |
| 4o066o | baha-perkutan | ✅ → `baha-perkutan-2.jpg` (99 KB) | |
| z5can3 | transkutan-aktif | ✅ → `transkutan-aktif.jpg` (112 KB) | Yer tutucu kalktı |
| nrr88d | ki | ✅ → `ki-2.jpg` (114 KB) | Anlamsız alt başlık ("…audiologu handbook app") silindi |
| 6nkrkk | orta-kulak-tam | ✅ → `orta-kulak-tam-2.jpg` (107 KB) | 1408×768 → üst/alta beyaz şerit, 4:3 (1200×900) |
| gh1mxu | kulak-ici-karsilastirma (yeni) | ❌ | "Simba", Lobule/Lobül, Cavum/Kavum karışık, CIC'de yanlış "Kavum" etiketleri. Kart kodda hazır, `gizli: true` |
| 9blim8 | eas | ❌ | Oran 1,83; "Eardrum"; "stimüllasyon"; "tiz tiz" |
| 75ubnp | transkutan-pasif | ❌ | "Titreşim kemik (magnats)" |
| o24z3q | orta-kulak-yarim | ❌ | Oran 1,83; "Eardrum"; "Kemikçikler" iki kez, biri iç kulakta |
| ypbavo | abi-yuzey | ❌ | Tekrar eden "Kablo…" etiketi; "Serebellum" beyin sapını gösteriyor (şüphe) |
| r7c0sm | abi-penetran | ❌ | ypbavo ile aynı sorunlar |

- Toplam yeni görsel: ~970 KB. 1200 px, JPEG kalite 80. Tam çözünürlüklü düzeltilmiş kopyalar: `ham-gorseller/yeni cihaz gorselleri/duzeltilmis/`.
- Eski görseller: `ham-gorseller/yedek-cihaz-2026-11-15/` (bte, kemik-bant, ki, ki-elektrot, baha-perkutan, orta-kulak-tam).
- Görünür logo/filigran yok (köşeler ayrıca kontrol edildi). Google'ın görünmez SynthID işareti dosyada olabilir.

## Yapılanlar
- **Görsel depo:** düğmeler Yolaklar · Refleks arkı · İşitme cihazları · İşitsel implantlar (`.seg4`, 360 px'te 78×44, yazı iki satıra iner). Paneller `p-isitme`, `p-implant`; implantlarda 4 alt başlık (`data-k="implant.grup.*"`). Giriş yazıları `cihaz.lead` (işitme) ve yeni `implant.lead`. `cihaz.not` ortak `#cihaz-alt` içinde, yalnızca iki cihaz panelinden biri açıkken görünür. Mevcut `metin.cihaz.lead/not` düzenlemeleri aynı anahtarla çalışır.
- **DEVICES** (`app.js`): yeni alanlar `kume` (implant alt başlığı), `gorselAlt` (ekran okuyucu metni, yönetici düzenler), `genis`, `gizli`, `rozetEk`. Yeni kartlar: `cros-bicros`, `kemik-yapiskan`, `kulak-ici-karsilastirma` (gizli). Kimlikler değişmedi.
- **Rozetler:** `ROZET` nesnesi (`app.js`, cihaz listesinin hemen üstü), yönetici `icerik/cihaz.rozet` ile değiştirir ("Rozet yazılarını düzenle" düğmesi panellerin altında). Renk değişkenleri `--rozet-*` (açık/koyu ayrı), yazı + nokta + çerçeve; araştırma rozeti kesik çerçeveli.
- **Tam ekran:** `goruntuleyici.js` (yeni). Görsel bir düğmenin içinde; büyütme simgesi görselin üstünde değil rozet satırının sağında (etiketleri kapatıyordu). Geri tuşu için `history.pushState`; kapanınca odak karta döner (50 ms gecikmeyle, yoksa kayboluyordu). Dokunmatikte tarayıcının ürettiği `dblclick` yok sayılır (yoksa çift dokunuş iki kez işleniyordu). Esc `document` üzerinden dinlenir.
- **3D:** bölüm `#uc-boyut`, adres `#3d`. `route()` içinde `UC_ESKI` listesi (`uc-boyut`, `3d-model`, `gorsel3d`, `depo/3d`, `model`) `#3d`'ye yönlenir. `kur3d()` `setTimeout` ile çağrılır (sayfa `#3d` ile açılınca `G3D` henüz tanımlı olmuyordu). "← Ana sayfa": ana sayfadan gelindiyse `history.back()`, doğrudan açıldıysa `#anasayfa`. Alt çubukta Ana sayfa seçili.
- **3D kartı:** `index.html` karşılamanın altı, `a.kart3d`; yazıları `data-k="ana.3d.baslik/alt"`. `refreshStatic` düzenleme çubuğunu bağlantının dışına koyar (`closest('a, button')`). Parıltı ve küp sallanması yalnızca `prefers-reduced-motion: no-preference`.
- **sw.js:** v21, `goruntuleyici.js` ve yeni görseller eklendi, taşınan 6 eski görsel çıkarıldı.
- firestore.rules ve CSP değişmedi.

## Test (yerel, sahte Firebase, Edge görünmez + DevTools protokolü)
- 360 ve 400 px, açık/koyu: Ana sayfa, Görsel depo (4 panel), 3D sayfası. Yatay kaydırma yok, 44 px altı dokunma hedefi yok, düğme yazısı taşmıyor.
- 5 tema (açık/koyu) 3D kartı. Hareket azaltma açıkken animasyon yok.
- Görüntüleyici: iki parmakla büyütme, sürükleme, çift dokunuş (büyüt/geri al), Esc, ✕, geri tuşu, odak dönüşü.
- Yönetici: 10/10 kartta Düzenle; yeni kart açıklaması ve alt metni kaydedildi; rozet yazısı değiştirildi ve Varsayılana dön; eski Firestore açıklaması (bte) ve ad/not düzenlemeleri göründü; 3D sayfasında yönetici düzenleme var.
- Model ana sayfada inmiyor, 3D sayfası açılınca iniyor. İnternetsiz: v21 önbelleği (53 dosya), implant görselleri 9/9.
- Konsolda hata yok.

## Telefonda denenecekler
1. Ana sayfada 3D kartı: görünüyor mu, dokununca 3D açılıyor mu, "← Ana sayfa" ve telefonun geri tuşu ana sayfaya dönüyor mu.
2. Görsel depo: 4 düğme tek satırda okunuyor mu (iki satıra inen yazılar).
3. Bir cihaz görseline dokun: tam ekran, iki parmakla büyütme, sürükleme, çift dokunuş, ✕ ve geri tuşu.
4. Rozetler açık ve koyu görünümde okunuyor mu.
5. Yönetici girişiyle: yeni kartlara (CROS/BiCROS, yapışkan adaptörlü) açıklama yazma; eski açıklamaların yerinde olması; "Rozet yazılarını düzenle".
6. Uçak modunda açılış: yeni görseller geliyor mu.
7. Anatomik kontrol: eklenen 9 görsel (özellikle bantlı ve yapışkan kemik iletimdeki şüpheler) ve "Araştırma aşamasında" rozeti.

## Ek (2026-11-15 akşamı, sw v22, yayında)
- **3D:** büyük kart yerine sağ üstte 44 px düğme (görünüm düğmesiyle aynı boy), `--bot` rengi, 5 sn'de bir parıltı + ışıma halkası (hareket azaltmada yok). Ekran okuyucu açıklaması gizli yazı (`ana.3d.alt`). Üst satırdaki yazıların düzenleme bağlantısı satırın altına konur ve `data-etiket` ile ne düzenlediği yazılır.
- OdyoBOT 21 px, saat 28 px, tarih 13,5 px.
- **6 düzeltilmiş görsel eklendi** (betik: geçici klasörde `gorsel2.ps1`; tam boylar `ham-gorseller/yeni cihaz gorselleri/duzeltilmis/`):
  | Dosya | Kart | Claude'un düzeltmesi |
  |---|---|---|
  | bfwaqj | kulak-ici-karsilastirma (gizlilik kalktı) | — |
  | rk4a0k | eas → `eas-2.jpg` | — |
  | 5jqm9j | orta-kulak-yarim → `orta-kulak-yarim-2.jpg` | — |
  | wuxb2l | transkutan-pasif → `transkutan-pasif-2.jpg` | "( vidayla" boşluğu kapatıldı; "Temporal kemik (mastoid)" çizgisi dalgadan kemiğe taşındı |
  | 9zkdi8 | abi-penetran → `abi-penetran-2.jpg` | şeklin içindeki ikinci "IV. ventrikül" yazısı silindi |
  | 6ffw5h | abi-yuzey → `abi-yuzey.jpg` (yer tutucu kalktı) | yarım "Alıcı-uyarı" satırı ve alttaki tekrar eden "Alıcı-uyarıcı (saçlı deri altında)" etiketi ve çizgisi silindi |
  Eski görseller `ham-gorseller/yedek-cihaz-2026-11-15/` içine taşındı. Yüzey ABI'deki "İşlev görmeyen VIII. kranial sinir" etiketi ve oku proje sahibinin isteğiyle silindi (yanlış yeri gösteriyordu).
- **Görsel depo:** üstte 3 düğme (Şemalar, İşitme cihazları, İşitsel implantlar; `secici()` yardımcı), Şemalar içinde sekme biçiminde alt düğmeler (`.alt-seg`).
- **Yenidoğan taraması:** `TNODES` + `sema()` çizici (kutu/ok tanımları koordinatla), kart `tsec()`. İki şemada ortak kutular (Geçti, Kaldı, sonuçlar) aynı kaydı kullanır. Referans: `ham-gorseller/yenidogan-tarama/image-1.png`, `image-2.png` (Sağlık Bakanlığı slaytları, uygulamaya konmadı).
- Test: 360/400 px açık/koyu taşma yok, 44 px altı hedef yok; kutuya dokunma, kart, Önceki/Sonraki; yönetici Düzenle/Kaydet/Varsayılana dön; işitme 11 kart, implantlarda yer tutucu yok; internetsiz v22 (55 dosya), konsolda hata yok.
- **Proje sahibi doğrulayacak:** akış şemalarındaki taslak metinler (özellikle "Risk var" ve yoğun bakım açıklamaları).

## Kepçe–kanal birleşimi onarımı (2026-11-15, sw v24)
Proje sahibi: "kulak kepçesi ile kulak kanalı tam geçmemiş, arada boşluklar var".
- **Neden:** kanal iki ayrı parçaydı (asıl kanal z≈15,7 mm'de biter; elle eklenmiş 936 köşelik ara parça z 15,1–23,9) ve üst üste bindirilmişti; ara parça kepçedeki deliğin kenarına dikili değildi, kavumun içine taşıyordu. Kepçede delik iki açık kenar bırakıyor: ön yüz (kavum, z 22,6) ve arka yüz (z 20,4).
- **Yapılan:** ara parça silindi; asıl kanal düzensiz ucundan önce eksene dik düzlemle kesildi (z≈13,2, kenar düzleme yaslandı); kesim kenarından kavum kenarına 22 halkalı tüp çizildi (Hermite eğrisi, taşınan çerçeve, kenarlar açıya göre eşleştirildi; uçlar mevcut köşelere birebir dikili); arka yüz kenarı tüpe 4 ara halkalı bir bağlantıyla kapatıldı (p_cavum'a eklendi; tüpün içine taşmıyor, en dar 0,54 mm).
- **Kontrol:** kanalda yalnızca 2 açık uç kaldı (kulak zarı tarafı ve kavum); 31 parçadan 29'u bayt bayt aynı (değişen: eac, p_cavum); dosya 3 973 466 → 4 011 334 bayt (`surum: 3`). Uygulamada beş görünüm ve kanala dokunma ("Dış kulak yolu") denendi, hata yok.
- **Yedek:** `ham-gorseller/yedek-3d-v23/` (önceki model + betikler + OKU.md), yerel git etiketi `yedek-v23-kanal-oncesi`.
- Ekrandaki not ve KAYNAKLAR.md güncellendi: kanalın kepçeye bağlanan son ~9 mm'si çizilmiş tüptür.

### Ek: kepçe arkası pürüzleri (2026-11-15, sw v25)
Proje sahibi: "kepçenin arkasında kanala yakın bölgede üçgen bir boşluk kalmış; ufak tefek pürüzleri de kapat".
- **Neden:** v24'te tüp kavum (ön) kenarına dikiliydi, arka yüz kenarı tüpe bir "yaka" ile bağlanıyordu; yaka tragus yakınında katlanıp küçük üçgen açıklıklar bırakıyordu. İki delik kenarı da testere dişliydi (bölge sınırlarından), tüp ucu sivri dişler yapıyordu.
- **Yapılan (onar5.js):** iki delik kenarı Taubin ile yumuşatıldı (12 tur, en çok 0,49 mm; aynı konumdaki köşeler komşu kepçe parçalarında da taşındı: p_tragus, p_antitragus, p_notch, p_cavum); kanal z≈12,4'te kesildi; tüp arka yüz kenarına dikildi; arka ve ön kenar arasına 3 halkalı iç duvar (p_cavum); kesim kenarı normalleri iki tarafın ortalaması (dikiş çizgisi kalmadı).
- **Kontrol:** kepçe+kanal birleşik yüzeyde kanal ağzı çevresinde açık kenar yok (kalanlar kulak zarı ucundaki bilerek açık ağız ve kaynaktaki konum çakışmaları; ham parçada delik değil). 26/31 parça bayt bayt aynı. Açık/koyu, beş görünüm, yakın çekim, kanala dokunma ("Dış kulak yolu"), konsol hatası yok. Dosya 4 001 488 bayt.
