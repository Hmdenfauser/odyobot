/* Ampulla kesiti (3D modeller → #3d/ampulla, 2026-11-22): krista ampullaris ve kupula, hareketsiz yapı modeli.
   - Model korti/ampulla3d.js içinde kodla çizilir; ölçülmüş veri değildir, şematiktir.
   - KAYNAK KURALI (proje sahibi, 2026-11-22): konuya hâkim olmadığı için metinler yalnızca ders notlarına ve güvenilir kaynaklara dayanır;
     kaynağı bulunamayan cümle yazılmaz. Kaynaklar:
     [DN1] İşitme ve Denge Sistemleri-2, periferik vestibüler sistem (Drive), sl. 21–31: krista eyer biçimli, ampullanın uzun eksenine dik;
           sinir lifleri kristanın merkezinden; kupula yelpaze, mukopolisakkarit, karşı duvara uzanır, kanalı böler; Tip I şişe + kadeh
           afferent, efferent kadehe; Tip II silindirik/test tüpü, buton; Tip I tepede, Tip II çevrede; 1 kinosilyum + 60–100 stereosilya,
           uç bağlantıları; horizontal kanalda kinosilyum utrikulusa, vertikalde uzağa; ampullopetal/ampullofugal, K⁺, depolarizasyon.
     [DN2] Vestibüler Sistemin Değerlendirilmesi 1. ders (Drive): perilenf yüksek Na:K, endolenf yüksek K:Na; Tip I küçük uyarana duyarlı,
           düzensiz ateşleme, Tip II düzenli; eylemsizlik, sabit hızda kupula eski hâline döner, SSK uyarılmaz.
     [W1] NCBI Purves, Neuroscience "The Semicircular Canals" (NBK10863): kupula endolenfin geçemediği bir sıvı engeli.
     [W2] Kupula ve endolenfin özgül ağırlığı aynı, kanal yerçekimine yanıt vermez (PMC5784369 ve BPPV/kupulolitiazis yayınları).
     [W3] StatPearls NBK544288: üst vestibüler sinir utrikulus + anterior ve lateral kanal; alt vestibüler sinir sakkulus + posterior
           kanal; Scarpa gangliyonu iç kulak yolunda.
     [W4] PMC6520623: kupula diyafram gibi bükülür, en çok ortası; fizyolojik baş hareketlerinde mikrometre düzeyinde. Proje sahibi doğrular, yönetici uygulamadan düzenler: icerik/ampulla3d.yapi.<id>, ampulla3d.genel, ampulla3d.metin.
   - Kimlikler (id) değiştirilmez. Renkler korti.css → --amp-<id>. */
(function () {
  window.AMPULLA3D_VERI = {
    genel: { ad: 'Ampulla kesiti', aciklama: 'Bir semisirküler kanalın ampullasından, kanal ekseni boyunca alınmış kalın bir dilim. Solda ince semisirküler kanal, sağda utrikulusa açılan taraf var. Ampullanın tabanındaki sırt krista ampullaris, onun üstünden tavana kadar uzanan jelatinimsi kütle kupuladır. Baş döndüğünde endolenf kupulayı iter, kupula bükülür ve krista üzerindeki tüylü hücrelerin tüyleri eğilir. Bir yapıya dokunarak adını ve görevini görebilirsin.' },
    gruplar: [
      { ad: 'Duvarlar ve sıvılar', yapilar: ['kemik', 'perilenf', 'zar', 'endolenf'] },
      { ad: 'Krista ampullaris', yapilar: ['krista', 'destek', 'tip1', 'tip2', 'silya', 'kino'] },
      { ad: 'Kupula', yapilar: ['kupula'] },
      { ad: 'Sinir', yapilar: ['kaliks', 'sinir'] }
    ],
    yapilar: {
      kemik: { ad: 'Kemik ampulla', etiket: 'Kemik duvar', aciklama: 'Kemik labirentin, semisirküler kanalın vestibüle bağlandığı uçtaki genişlemiş bölümü. İçinde perilenfle çevrili zar ampulla bulunur.' },
      perilenf: { ad: 'Perilenf', etiket: 'Perilenf', aciklama: 'Kemik labirentle zar labirent arasındaki sıvı. Beyin omurilik sıvısına benzer; sodyum oranı yüksek, potasyum oranı düşüktür (yüksek Na:K).' },
      zar: { ad: 'Zar ampulla duvarı', aciklama: 'Zar labirentin ampulladaki duvarı. Kemik labirentin içinde asılı durur; içindeki endolenfi dıştaki perilenften ayırır.' },
      endolenf: { ad: 'Endolenf', etiket: 'Endolenf', aciklama: 'Zar labirentin içini dolduran sıvı; potasyum oranı yüksek, sodyum oranı düşüktür (yüksek K:Na). Baş hareket edince kütle eylemsizliği nedeniyle geride kalır ve kupulaya karşı bir kuvvet oluşturur.' },
      krista: { ad: 'Krista ampullaris', etiket: 'Krista ampullaris', aciklama: 'Semisirküler kanalın duyu epiteli: ampullanın uzun eksenine dik açıyla ampulla duvarına tutturulmuş, eyer biçimli bir doku tümseği. Tüylü hücreler yüzeyindedir. Ampullar sinir lifleri kristanın merkezinden geçerek tüylü hücrelerin tabanında sinaps yapar. Modelde eyer biçimi yerine düz bir sırt olarak sadeleştirildi.' },
      destek: { ad: 'Destek hücreleri', aciklama: 'Duyu epitelinde tüylü hücreleri çevreleyen hücreler. Modelde tüylü hücrelerin altındaki ince katman olarak çizildi.' },
      tip1: { ad: 'Tip I tüylü hücre', aciklama: 'Şişe (amfora) biçimli tüylü hücre; daha çok kristanın tepesinde bulunur. Tüy taşıyan ucu dışında bütün gövdesi, afferent sinir lifinin oluşturduğu kadeh biçimli bir sinir ucuyla (kaliks) sarılıdır. Çok küçük mekanik uyaranlara daha duyarlıdır; düzensiz ateşleme gösteren sinir uçlarıyla bağlantılıdır.' },
      tip2: { ad: 'Tip II tüylü hücre', aciklama: 'Silindir ya da deney tüpü biçimli, daha küçük tüylü hücre; daha çok kristanın eteklerinde bulunur. Yalnızca tabanında birkaç küçük düğme (buton) biçimli afferent ve efferent sinir ucu bulunur; düzenli ateşleme gösteren sinir uçlarıyla bağlantılıdır.' },
      silya: { ad: 'Stereosilyalar', aciklama: 'Her tüylü hücrenin üst yüzünde merdiven gibi boyu artan sıralar hâlinde dizilmiş tüycükler (hücre başına yaklaşık 60–100; modelde az sayıda çizildi); en uzunları kinosilyumun yanındadır. Uç bağlantıları sayesinde demet olarak birlikte hareket ederler. Uçları kupulanın içine uzanır. Tüyler kinosilyuma doğru eğilince hücre uyarılır (depolarize olur), ters yöne eğilince baskılanır.' },
      kino: { ad: 'Kinosilyum', aciklama: 'Her tüylü hücrede bir tane bulunan, diğer tüylerden çok daha büyük, hareketli tüy; demetin bir kenarında yer alır. Stereosilyalar kinosilyuma bağlıdır, böylece bütün tüyler bir demet olarak uyarılır. Bir kristadaki bütün hücrelerde kinosilyum aynı tarafa bakar. Lateral kanalda utrikulus tarafındadır (endolenfin utrikulusa doğru akımı uyarır); anterior ve posterior kanallarda kanal tarafındadır (utrikulustan uzağa akım uyarır). Model lateral kanal gibi çizildi.' },
      kupula: { ad: 'Kupula', etiket: 'Kupula', aciklama: 'Kristanın üstünü örtüp karşı ampulla duvarına kadar uzanan, mukopolisakkaritlerden oluşan jelatinimsi, yelpaze biçimli yapı. Ampullayı bir kapak gibi böler, endolenf içinden geçemez; tüylü hücrelerin tüyleri içine gömülüdür. Özgül ağırlığı endolenfle aynı olduğundan sağlıklı kulakta yerçekiminden etkilenmez; endolenfin hareketiyle bükülür. Modelde içindeki tüyler görünsün diye yarı saydam çizildi.' },
      kaliks: { ad: 'Kaliks sinir ucu', aciklama: 'Tip I tüylü hücrenin gövdesini kadeh gibi saran afferent sinir ucu. Efferent sinir uçları bu kadehin tabanına yakın bölümde sinaps yapar.' },
      sinir: { ad: 'Ampullar sinir lifleri', etiket: 'Ampullar sinir', aciklama: 'Tüylü hücrelerin tabanında sinaps yapan lifler kristanın merkezinden geçerek ampullar siniri oluşturur. Anterior ve lateral kanalın ampullar sinirleri üst vestibüler sinire, posterior kanalınki alt vestibüler sinire katılır. Vestibüler sinirin hücre gövdeleri iç kulak yolundaki Scarpa gangliyonundadır.' }
    },
    metinler: {
      ipucu: 'Döndürmek için sürükle, yakınlaştırmak için iki parmakla aç. Bir yapıya ya da aşağıdaki listeden bir ada dokun.',
      not: 'Şematik bir öğretim çizimidir, ölçülmüş veri değildir: hücreler ve tüyler çok büyütüldü, krista eyer yerine düz sırt olarak çizildi. Bu sayfada hareket yoktur. Kaynaklar: ders notları (İşitme ve Denge Sistemleri-2, Vestibüler Sistemin Değerlendirilmesi), NCBI Purves Neuroscience ve StatPearls. Kendi kaynağınla doğrula.',
      etiket: 'Ampullanın uzunlamasına kesiti',
      yonKanal: '← Kanal tarafı',
      yonUtrikulus: 'Utrikulus tarafı →',
      genelGorunum: 'Genel görünüme dön',
      yakinlastir: 'Yakınlaştır',
      uzaklastir: 'Uzaklaştır',
      yazilariGizle: 'Yazıları gizle',
      yazilariGoster: 'Yazıları göster',
      yukleniyor: 'Model hazırlanıyor…',
      baslatilamadi: 'Bu cihazda 3D çizim başlatılamadı.'
    },
    /* Ses laboratuvarı → Ampulla animasyonu (#seslab/ampulla). Yapı adları/açıklamaları yukarıdakilerle ortak.
       Yönetici düzenler: icerik/ampulla3d.anim.genel, ampulla3d.anim.metin. Metinler TASLAK (ders notlarına dayanır). */
    anim: {
      genel: { ad: 'Ampulla: baş dönünce', aciklama: 'Sağ kulağın lateral (horizontal) semisirküler kanal ampullası; kişi döner sandalyede oturuyor ve başı sağa dönüyor. Baş dönmeye başlayınca endolenf kütle eylemsizliği nedeniyle geride kalır ve kupulayı iter. Sağ lateral kanalda bu akım ampullaya (utrikulusa) doğrudur (ampullopetal): kupula ve tüyler kinosilyuma doğru bükülür, iyon kanalları açılır, potasyum (K⁺) hücreye girer ve hücre depolarize olur; sinirdeki deşarj artar. Dönüş hızı sabitlenince (ivme sıfır) kupulaya etki eden kuvvet ortadan kalkar ve kupula eski hâline döner. Baş durunca endolenf yine eylemsizlik nedeniyle hareketine devam etmek ister: akım bu kez ters yönde (ampullofugal) olur, tüyler kinosilyumdan uzağa bükülür ve bazal deşarj azalır. Bir yapıya dokunarak adını ve görevini görebilirsin.' },
      metinler: {
        asamaDinlenim: 'Baş hareketsiz → kupula dik durur → sinirde bazal (dinlenim) deşarjı vardır: baş hiç hareket etmezken de düzenli sinyal gider.',
        asamaHizlanma: 'Baş sağa dönmeye başlıyor (hızlanma) → endolenf eylemsizlikle geride kalır, ampullaya doğru (ampullopetal) akar → kupula utrikulusa doğru bükülür → tüyler kinosilyuma doğru eğilir → K⁺ girer, depolarizasyon → deşarj artar.',
        asamaSabit: 'Baş sabit hızla dönüyor → ivme sıfırdır, kupulaya etki eden kuvvet ortadan kalkar → kupula yavaşça eski konumuna döner → deşarj bazal düzeye iner. Sabit hızda kanal uyarılmaz.',
        asamaYavaslama: 'Baş duruyor (yavaşlama) → endolenf eylemsizlikle hareketine devam etmek ister, ampulladan uzağa (ampullofugal) akar → kupula ve tüyler kinosilyumdan uzağa bükülür → kanallar kapanır, hiperpolarizasyon → deşarj bazal düzeyin altına iner.',
        asamaDonus: 'Baş hareketsiz → kupula yavaşça eski konumuna döner → deşarj yeniden bazal düzeye çıkar.',
        ipucu: 'Döndürmek için sürükle, yakınlaştırmak için iki parmakla aç. Bir yapıya dokununca adı ve görevi çıkar.',
        not: 'Renkler: mavi noktalar endolenf, sarı noktalar potasyum (K⁺) iyonları, sinirde ilerleyen mor noktalar aksiyon potansiyeli; tüylü hücre pembeleşince depolarize olmuştur. Sol üstteki baş yukarıdan bakıştır, kırmızı kulak sağ kulaktır. Hareket çok büyütüldü ve yavaşlatıldı; kupula gerçekte mikrometre düzeyinde ve diyafram gibi (en çok ortası) bükülür. Sol ve sağ kulaktaki lateral kanallar birlikte çalışır: baş sağa dönünce sağ taraf uyarılır, sol taraf baskılanır. Şematik bir öğretim çizimidir. Kaynaklar: ders notları (İşitme ve Denge Sistemleri-2, Vestibüler Sistemin Değerlendirilmesi), NCBI Purves Neuroscience ve kupula mekaniği üzerine bir derleme (PMC6520623). Kendi kaynağınla doğrula.',
        etiket: 'Sağ lateral kanal ampullası · yavaşlatılmış',
        basEtiket: 'Baş (yukarıdan)',
        yonKanal: '← Kanal tarafı',
        yonUtrikulus: 'Utrikulus tarafı →',
        genelGorunum: 'Genel görünüme dön',
        yakinlastir: 'Yakınlaştır',
        uzaklastir: 'Uzaklaştır',
        yazilariGizle: 'Yazıları gizle',
        yazilariGoster: 'Yazıları göster',
        oynat: 'Oynat',
        duraklat: 'Duraklat',
        yukleniyor: 'Model hazırlanıyor…',
        baslatilamadi: 'Bu cihazda 3D çizim başlatılamadı.'
      }
    }
  };
})();
