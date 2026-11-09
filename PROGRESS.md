# PROGRESS — Vakalarım sekmesi

Yeni oturumda: "PROGRESS.md'ye bak, devam et". Onaylı plan: `C:\Users\Hmd\.claude\plans\nerede-kalm-t-k-twinkly-dragon.md`.

## Aşamalar
| # | Aşama | Durum |
|---|---|---|
| 1 | A+B+F: liste, form, kaydetme, yedekleme | ✅ Bitti (2026-11-09), sw v6 |
| 2 | C: odyogram çizimi | ✅ Bitti (2026-11-09), sw v7 |
| 3 | D: otomatik hesaplama (`odyo-hesap.js`) | ✅ Bitti (2026-11-09), sw v8 |
| 4 | E: ek ölçümler | ✅ Bitti (2026-11-09), sw v9 |

**Durum:** İstenen işlerin hepsi bitti ve yayında. Proje sahibinin telefonda denemesi bekleniyor.

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
- Proje sahibinin telefonda denemesi ve geri bildirimi.
- Fotoğraf ekleme (proje sahibi sonra yapacak): o zaman `VakaDeposu`'nun içi IndexedDB'ye çevrilecek.

## Dikkat
- Her yayında `sw.js` `VERSION` +1; yeni dosya → `ASSETS`'e ekle.
- dB alanı `type="number"`, `inputmode` yok (iPhone'da eksi tuşu için).
- Boş frekans depoda hiç yazılmaz; çizgi ve hesap boş frekansı atlar.
- Test: geçici klasördeki `server.js` (localhost:8765) + `cdp.js` (Edge headless) + `t1.js`…`t4.js`, hesap için `t3-hesap.js` (42 durum). Geçici klasör oturuma özel; kaybolduysa yeniden yazılır.
