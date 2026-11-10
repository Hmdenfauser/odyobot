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
| 5 | Taslak kural tablosu (aşağıda) | ⏳ Proje sahibi Katz'tan kontrol edecek |
| 6 | `maskeleme-kural.js` + bot kararları + örnek vaka testleri | ⛔ 5 onaylanmadan başlanmaz |

## Taslak kural tablosu — DOĞRULANMADI
Aşağıdaki değerler odyoloji kaynaklarında yaygın geçen değerlerdir; Claude bunların Katz'ın kitabındaki
karşılığını doğrulayamaz. Proje sahibi her satırı Katz'tan kontrol edip "Katz" sütununu doldurur,
yanlışsa doğrusunu yazar. Onaylanmayan hiçbir satır koda girmez.

Kısaltmalar: TE = test edilen kulak, NTE = test edilmeyen (karşı) kulak, IA = interaural attenüasyon,
HY = hava yolu, KY = kemik yolu, EM = etkin maskeleme düzeyi, OE = oklüzyon etkisi.

| # | Konu | Taslak değer / kural | Soru | Katz (sayfa / doğru değer) |
|---|---|---|---|---|
| 1 | IA, HY, kulak üstü (supra-aural) | Tüm frekanslarda en az **40 dB** | Katz frekansa göre ayrı değer veriyor mu? | |
| 2 | IA, HY, insert | ≤1000 Hz **70 dB**, >1000 Hz **55 dB** (tedbirli en düşük değerler) | Katz'taki insert değerleri neler? Tek değer mi (ör. 60 dB)? | |
| 3 | IA, KY | **0 dB** (her frekansta) | | |
| 4 | HY'de maskeleme gerekir mi? | TE HY eşiği − IA ≥ NTE **KY** eşiği | NTE'nin KY'si yoksa HY'si mi kullanılsın? | |
| 5 | KY'de maskeleme gerekir mi? | TE'de hava-kemik farkı (ABG) **> 10 dB** ise | 10 mu, ≥15 mi? (Vakalarım'daki tip hesabında 10 dB kullanılıyor) | |
| 6 | Başlangıç maskeleme, HY | EM = NTE HY eşiği + **10 dB** (güvenlik payı) | | |
| 7 | Başlangıç maskeleme, KY | EM = NTE HY eşiği + 10 dB + **OE** | | |
| 8 | OE, kulak üstü | 250 Hz **20**, 500 Hz **15**, 1000 Hz **5**, ≥2000 Hz **0** dB | Değerler doğru mu? OE yalnızca NTE'nin KY'si normal/iletim kaybı yoksa mı eklenir? | |
| 9 | OE, insert (derin yerleşim) | 250 Hz **10**, 500 Hz **10**, ≥1000 Hz **0** dB | | |
| 10 | Plato yöntemi | Maskeleyici **5 dB** adımla artar; eşik kayarsa ton 5 dB artırılır | Maskeleyici adımı 5 mi 10 mu? | |
| 11 | Plato genişliği | Üst üste **3 artışta (15 dB)** kayma yoksa plato bulundu | 15 mi, 20 dB mi? | |
| 12 | Aşırı maskeleme sınırı | En yüksek EM = TE **KY** eşiği + IA − 5 dB | | |
| 13 | Konuşma (SRT/SDS) maskeleme | Sunum düzeyi − IA ≥ NTE'nin en iyi KY eşiği (500–4000 Hz) | Konuşmada IA: kulak üstü 40, insert 60 dB mi? Başlangıç EM nasıl? | |
| 14 | Merkezi maskeleme | Maskeli eşikte ~5 dB yükselme olabileceği uyarısı | Bot bunu not olarak yazsın mı? | |

**Ayrıca gerekenler:**
- Katz'ın baskısı (kaçıncı baskı) ve ilgili bölüm adı (kaynak olarak ekranda yazılacak).
- Kitaptan ya da kendi kliniğinden 3–5 örnek vaka ve her biri için beklenen doğru cevap. Bunlar otomatik test olarak eklenecek.

## Teknik notlar (bu iş)
- `vakalarim.js` sonunda `window.OdyoVaka`: diğer dosyaların kullandığı ortak arayüz (vakalar, çizim, sonuç satırları, lejant).
- Bota gönderme: yalnızca vaka kimlikleri `sessionStorage` `odybot:gonderilen` ile + `odyobot:vakalar` olayıyla taşınır.
- Bot mesaj metinleri `index.html` → `#b-metinler` (`data-k="odybot.m.*"`, `data-m`). Yalnızca yöneticiye görünür (`html.yonetici`, `app.js` `setEditMode`).
- Çıktı renkleri `styles.css` `--cikti-*` (temadan bağımsız, her zaman beyaz kâğıt).
- PDF'in görünüşü bu bilgisayarda görüntülenemedi (araç yok); yapı (xref) doğrulandı. Telefonda bakılacak.
- iPhone'da "Paylaş": dosya hazırlanırken kısa süre geçer; Safari paylaşma penceresini açmazsa "İndir" denenecek.
