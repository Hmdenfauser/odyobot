/* Ampulla kesiti (3D modeller → #3d/ampulla, 2026-11-22): krista ampullaris ve kupula, hareketsiz yapı modeli.
   - Model korti/ampulla3d.js içinde kodla çizilir; ölçülmüş veri değildir, şematiktir.
   - Açıklamalar Claude tarafından TASLAK yazıldı; 2026-11-22'de proje sahibinin ders notlarıyla karşılaştırıldı (İşitme ve Denge
     Sistemleri-2 periferik vestibüler sistem sl. 21–31; Vestibüler Sistemin Değerlendirilmesi 1. ders) ve uyumlu bulundu. Proje sahibi doğrular, yönetici uygulamadan düzenler: icerik/ampulla3d.yapi.<id>, ampulla3d.genel, ampulla3d.metin.
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
      kemik: { ad: 'Kemik ampulla', etiket: 'Kemik duvar', aciklama: 'Kemik labirentin, semisirküler kanalın vestibüle açılan ucundaki genişlemiş bölümü. Zar ampullayı çevreler. Tabanındaki küçük deliklerden ampullar sinir dalları geçer.' },
      perilenf: { ad: 'Perilenf', etiket: 'Perilenf', aciklama: 'Kemik ampulla ile zar ampulla arasındaki sıvı. Bileşimi hücre dışı sıvıya benzer (sodyumdan zengin, potasyumdan fakir).' },
      zar: { ad: 'Zar ampulla duvarı', aciklama: 'Zar labirentin ampulladaki ince duvarı. İçindeki endolenfi dıştaki perilenften ayırır. Kristanın iki yanındaki duvarda endolenfin bileşimini düzenleyen hücreler (karanlık hücreler, planum semilunatum) bulunur; bunlar modelde ayrıca çizilmedi.' },
      endolenf: { ad: 'Endolenf', etiket: 'Endolenf', aciklama: 'Zar labirentin içini dolduran sıvı; potasyumdan zengin, sodyumdan fakirdir. Baş döndüğünde eylemsizliği nedeniyle kanalın duvarına göre geride kalır; bu göreli akım kupulayı iter.' },
      krista: { ad: 'Krista ampullaris', etiket: 'Krista ampullaris', aciklama: 'Ampullanın tabanında, kanal eksenine dik uzanan sırt biçimli duyu organı. Bağ dokusu ve damarlardan oluşan bir çekirdek ile üstünü örten duyu epitelinden (tüylü hücreler ve destek hücreleri) oluşur. Gerçekte eyer biçimlidir; modelde düz bir sırt olarak sadeleştirildi. Ampullar sinirin lifleri çekirdeğinden geçer.' },
      destek: { ad: 'Destek hücreleri', aciklama: 'Duyu epitelinde tüylü hücrelerin arasında ve altında yer alan hücreler. Tüylü hücreleri taşır ve çevreler. Modelde tüylü hücrelerin altındaki ince katman olarak çizildi.' },
      tip1: { ad: 'Tip I tüylü hücre', aciklama: 'Şişe (amfora) biçimli tüylü hücre; daha çok kristanın tepesinde bulunur. Tüy taşıyan ucu dışında bütün gövdesi, afferent sinir lifinin oluşturduğu kadeh biçimli bir sinir ucuyla (kaliks) sarılıdır. Çok küçük mekanik uyaranlara daha duyarlıdır; düzensiz ateşleme gösteren sinir uçlarıyla bağlantılıdır.' },
      tip2: { ad: 'Tip II tüylü hücre', aciklama: 'Silindir ya da deney tüpü biçimli, daha küçük tüylü hücre; daha çok kristanın eteklerinde bulunur. Yalnızca tabanında birkaç küçük düğme (buton) biçimli afferent ve efferent sinir ucu bulunur; düzenli ateşleme gösteren sinir uçlarıyla bağlantılıdır.' },
      silya: { ad: 'Stereosilyalar', aciklama: 'Her tüylü hücrenin üst yüzünde merdiven gibi boyu artan sıralar hâlinde dizilmiş tüycükler (hücre başına yaklaşık 60–100; modelde az sayıda çizildi); en uzunları kinosilyumun yanındadır. Uç bağlantıları sayesinde demet olarak birlikte hareket ederler. Uçları kupulanın içine uzanır. Tüyler kinosilyuma doğru eğilince hücre uyarılır (depolarize olur), ters yöne eğilince baskılanır.' },
      kino: { ad: 'Kinosilyum', aciklama: 'Her tüy demetinde bir tane bulunan, en uzun gerçek silya; demetin bir kenarında yer alır. Bir kristadaki bütün hücrelerde kinosilyum aynı tarafa bakar. Lateral kanalda utrikulus tarafındadır (endolenfin utrikulusa doğru akımı uyarır); anterior ve posterior kanallarda kanal tarafındadır (utrikulustan uzağa akım uyarır). Model lateral kanal gibi çizildi.' },
      kupula: { ad: 'Kupula', etiket: 'Kupula', aciklama: 'Kristanın üstünü örtüp karşı ampulla duvarına kadar uzanan, mukopolisakkaritlerden oluşan jelatinimsi, yelpaze biçimli yapı. Ampullayı bir kapak gibi böler, endolenf içinden geçemez; tüylü hücrelerin tüyleri içine gömülüdür. Özgül ağırlığı endolenfle hemen hemen aynı olduğundan yerçekiminden etkilenmez, yalnızca endolenf akımıyla bükülür. Modelde içindeki tüyler görünsün diye yarı saydam çizildi.' },
      kaliks: { ad: 'Kaliks sinir ucu', aciklama: 'Tip I tüylü hücrenin gövdesini kadeh gibi saran afferent sinir ucu. Efferent sinir uçları bu kadehin tabanına yakın bölümde sinaps yapar.' },
      sinir: { ad: 'Ampullar sinir lifleri', etiket: 'Ampullar sinir', aciklama: 'Tüylü hücrelerin tabanından başlayan lifler kristanın çekirdeğinden geçer ve kemikteki küçük deliklerden çıkarak ampullar siniri oluşturur. Ampullar sinirler vestibüler sinirin üst (anterior ve lateral kanal) ve alt (posterior kanal) dallarına katılır; hücre gövdeleri iç kulak yolundaki Scarpa gangliyonundadır.' }
    },
    metinler: {
      ipucu: 'Döndürmek için sürükle, yakınlaştırmak için iki parmakla aç. Bir yapıya ya da aşağıdaki listeden bir ada dokun.',
      not: 'Şematik bir öğretim çizimidir, ölçülmüş veri değildir: hücreler ve tüyler çok büyütüldü, krista eyer yerine düz sırt olarak çizildi. Bu sayfada hareket yoktur. Bilgiler proje sahibinin ders notlarına (İşitme ve Denge Sistemleri-2, Vestibüler Sistemin Değerlendirilmesi) dayanılarak taslak yazıldı; kendi kaynağınla doğrula.',
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
      genel: { ad: 'Ampulla: baş dönünce', aciklama: 'Sağ kulağın lateral (horizontal) semisirküler kanal ampullası; kişi döner sandalyede oturuyor ve başı sağa dönüyor. Baş dönmeye başlayınca endolenf kütle eylemsizliği nedeniyle geride kalır ve kupulayı iter. Sağ lateral kanalda bu akım ampullaya (utrikulusa) doğrudur (ampullopetal): kupula ve tüyler kinosilyuma doğru bükülür, iyon kanalları açılır, potasyum (K⁺) hücreye girer ve hücre depolarize olur; sinirdeki deşarj artar. Dönüş hızı sabitlenince kupulayı iten kuvvet kalkar ve kupula yavaşça eski hâline döner. Baş durunca endolenf bir süre hareketine devam eder: akım ters yönde (ampullofugal) olur, tüyler kinosilyumdan uzağa bükülür ve bazal deşarj azalır. Bir yapıya dokunarak adını ve görevini görebilirsin.' },
      metinler: {
        asamaDinlenim: 'Baş hareketsiz → kupula dik durur → sinirde bazal (dinlenim) deşarjı vardır: baş hiç hareket etmezken de düzenli sinyal gider.',
        asamaHizlanma: 'Baş sağa dönmeye başlıyor (hızlanma) → endolenf eylemsizlikle geride kalır, ampullaya doğru (ampullopetal) akar → kupula utrikulusa doğru bükülür → tüyler kinosilyuma doğru eğilir → K⁺ girer, depolarizasyon → deşarj artar.',
        asamaSabit: 'Baş sabit hızla dönüyor → endolenf başla birlikte döner, kupulayı iten kuvvet kalkar → kupula yavaşça eski konumuna döner → deşarj bazal düzeye iner. Sabit hızda kanal uyarılmaz.',
        asamaYavaslama: 'Baş duruyor (yavaşlama) → endolenf hareketine bir süre devam eder, ampulladan uzağa (ampullofugal) akar → kupula ve tüyler kinosilyumdan uzağa bükülür → kanallar kapanır, hiperpolarizasyon → deşarj bazal düzeyin altına iner.',
        asamaDonus: 'Baş hareketsiz → kupula esnekliğiyle yavaşça dik konuma döner → deşarj yeniden bazal düzeye çıkar.',
        ipucu: 'Döndürmek için sürükle, yakınlaştırmak için iki parmakla aç. Bir yapıya dokununca adı ve görevi çıkar.',
        not: 'Renkler: mavi noktalar endolenf, sarı noktalar potasyum (K⁺) iyonları, sinirde ilerleyen mor noktalar aksiyon potansiyeli; tüylü hücre pembeleşince depolarize olmuştur. Sol üstteki baş yukarıdan bakıştır, kırmızı kulak sağ kulaktır. Hareket çok büyütüldü ve yavaşlatıldı; kupula gerçekte mikrometre düzeyinde bükülür. Sol ve sağ kulaktaki lateral kanallar birlikte çalışır: baş sağa dönünce sağ taraf uyarılır, sol taraf baskılanır. Şematik bir öğretim çizimidir. Bilgiler proje sahibinin ders notlarından (İşitme ve Denge Sistemleri-2, Vestibüler Sistemin Değerlendirilmesi) alındı; kendi kaynağınla doğrula.',
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
