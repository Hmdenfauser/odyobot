/* Denge sistemi (3D modeller → #3d/denge, 2026-11-21): hareketsiz yapı modeli.
   - Labirent (vestibül, kanallar, krus kommune, ampullalar) kulak modelinden (gorsel3d/periferik.*) alınır; utrikulus ve
     sakkulus makulaları seslab/denge.js'in hesabıyla hareketsiz üretilir. Hareket, BPPV ve manevralar burada YOK
     (proje sahibinin kararı: 3D'de yalnızca yapılar; animasyonlar Ses laboratuvarında).
   - Açıklamalar proje sahibinin ders notuna dayanılarak Claude tarafından TASLAK yazıldı (İşitme ve Denge Sistemleri-1,
     "periferik vestibüler sistem" dersi). Yönetici düzenler: icerik/denge3d.yapi.<id>, denge3d.genel, denge3d.metin.
   - 2026-11-22 denetimi: İşitme ve Denge Sistemleri-1 periferik vestibüler sistem (sl. 3–14), İşitme ve Denge Sistemleri-2 (sl. 20–31),
     Vestibüler Sistemin Değerlendirilmesi (1. ders; VEMP; vHIT sl. 6, 17) ile karşılaştırıldı.
   - Kimlikler değiştirilmez. Renkler: labirent --g3d-<id> (gorsel3d.css), makula katmanları --kt-mak-* (korti.css). */
(function () {
  window.DENGE3D_VERI = {
    genel: { ad: 'Denge sistemi', aciklama: 'Sağ iç kulağın periferik vestibüler bölümü: vestibül, üç semisirküler kanal ve otolit organları (utrikulus ve sakkulus). Kanallar başın dönme hareketlerini, otolit organları doğrusal hızlanmayı ve yerçekimini algılar. Labirent yarı saydam çizildi; içindeki makulalar görünsün diye. Bir yapıya dokunarak adını ve görevini görebilirsin.' },
    gruplar: [
      { ad: 'Kemik labirent', yapilar: ['vest', 'ant', 'post', 'lat', 'crus', 'amp'] },
      { ad: 'Otolit organları', yapilar: ['utr', 'sak', 'otolit'] }
    ],
    yapilar: {
      vest: { ad: 'Vestibül', aciklama: 'Kemik labirentin en geniş bölümü (erişkinde genişliği yaklaşık 4 mm); koklea ile semisirküler kanalların ortasında yer alır. İç duvarının ön yarısındaki çukurda (resesus sferikus) sakkulus, arka yarısındaki çukurda (resesus eliptikus) utrikulus oturur. Dış duvarında oval pencere bulunur.' },
      ant: { ad: 'Anterior (süperior) semisirküler kanal', aciklama: 'Dikey kanallardan biri; sagittal düzleme yaklaşık 45° açıyla yerleşir. Bir taraftaki anterior kanal, karşı taraftaki posterior kanalla aynı düzlemdedir. Ampullası önde, vestibüle açılan ucundadır; ampulla dışındaki bacağı posterior kanalınkiyle birleşerek krus kommuneyi oluşturur.' },
      post: { ad: 'Posterior (inferior) semisirküler kanal', aciklama: 'Dikey kanallardan biri; sagittal düzleme yaklaşık 45° açıyla yerleşir. Ampullası alt uçtadır. Ampulla dışındaki bacağı anterior kanalınkiyle krus kommunede birleşir. BPPV’de kristallerin en sık girdiği kanaldır.' },
      lat: { ad: 'Lateral (horizontal) semisirküler kanal', aciklama: 'Yatay kanal; horizontal düzleme göre önde yaklaşık 30° yukarı eğimlidir. Ampulla dışındaki bacağı tek başına vestibüle açılır. Kalorik test yalnızca horizontal kanalları değerlendirir; video baş itme testinde (vHIT) horizontal kanallar da test edilir.' },
      crus: { ad: 'Krus kommune', aciklama: 'Anterior ve posterior semisirküler kanalların ampulla taşımayan bacaklarının birleşerek vestibüle açıldığı ortak bacak (krus kommunis).' },
      amp: { ad: 'Ampullalar', aciklama: 'Her semisirküler kanalın vestibüle bağlanan bir ucundaki şişkinlik (zar labirentte yaklaşık 2 mm çapında). İçinde eyer biçimli duyu epiteli krista ampullaris ve onun üstünde yelpaze biçimli, jelatinimsi kupula bulunur. Baş dönünce endolenf kupulayı büker ve tüylü hücreler uyarılır. (Krista ve kupula bu modelde çizilmedi.)' },
      utr: { ad: 'Utrikulus makulası', etiket: 'Utrikulus', aciklama: 'Utrikulus vestibülün resesus eliptikusunda oturur; makulası yatay düzlemdedir. Bu yüzden daha çok yatay doğrusal hızlanmayı ve başın eğilmesini algılar. Makulada tüylü hücreler, destek hücreleri ve üstünde otolitik membran bulunur. Semisirküler kanallar utrikulustan başlayıp yine utrikulusa döner.' },
      sak: { ad: 'Sakkulus makulası', etiket: 'Sakkulus', aciklama: 'Sakkulus utrikulustan daha küçük, oval bir kesedir; vestibülün ön alt tarafındaki resesus sferikusta oturur. Makulası düşey düzlemdedir (utrikulusunkine dik); daha çok dikey doğrusal hızlanmayı ve yerçekimini algılar. Servikal VEMP ile değerlendirilir.' },
      otolit: { ad: 'Otolitik membran ve otokoni', aciklama: 'Makulaların tüylü hücrelerinin tüycükleri jelatinimsi otolitik membranın içine gömülüdür. Membranın üstünde kalsiyum karbonat kristalleri (otokoni) bulunur; özgül ağırlığı yüksek olduğundan yerçekimi ve doğrusal hızlanmayla kayar ve tüyleri büker. Kristaller büyütülerek çizildi.' }
    },
    metinler: {
      ipucu: 'Döndürmek için sürükle, yakınlaştırmak için iki parmakla aç. Bir yapıya ya da aşağıdaki listeden bir ada dokun.',
      not: 'Labirent, kulak taramasından elde edilen modelden alındı (OpenEar, Sieber ve ark., CC BY 4.0). Makulalar ölçülmüş veri değildir: yerleri yaklaşık seçildi, tüy demetleri ve kristaller görünsün diye çok büyütüldü. Bu sayfada hareket yoktur; otolit hareketi, BPPV ve manevralar Ses laboratuvarındadır. Bilgiler proje sahibinin ders notlarından (İşitme ve Denge Sistemleri-1) alındı; kendi kaynağınla doğrula.',
      genelGorunum: 'Genel görünüme dön',
      yakinlastir: 'Yakınlaştır',
      uzaklastir: 'Uzaklaştır',
      yazilariGizle: 'Yazıları gizle',
      yazilariGoster: 'Yazıları göster',
      etiket: 'Sağ kulak · sağdan bakış',
      yukleniyor: 'Model indiriliyor…',
      indirilemedi: 'Model indirilemedi. İnternet bağlantını kontrol edip sayfayı yeniden aç.',
      baslatilamadi: 'Bu cihazda 3D çizim başlatılamadı.'
    }
  };
})();
