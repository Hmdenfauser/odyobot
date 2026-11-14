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
