/* Ampulla kesiti (3D modeller → #3d/ampulla, 2026-11-22): krista ampullaris ve kupula, hareketsiz yapı modeli.
   - Model korti/ampulla3d.js içinde kodla çizilir; ölçülmüş veri değildir, şematiktir.
   - Açıklamalar Claude tarafından TASLAK yazıldı (genel anatomi ve fizyoloji bilgisi; proje sahibinin ders notlarıyla henüz
     karşılaştırılmadı). Proje sahibi doğrular, yönetici uygulamadan düzenler: icerik/ampulla3d.yapi.<id>, ampulla3d.genel, ampulla3d.metin.
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
      destek: { ad: 'Destek hücreleri', aciklama: 'Duyu epitelinde tüylü hücrelerin arasında ve altında yer alan hücreler. Tüylü hücreleri taşır ve kupulanın yapımına katkıda bulunduğu düşünülür. Modelde tüylü hücrelerin altındaki ince katman olarak çizildi.' },
      tip1: { ad: 'Tip I tüylü hücre', aciklama: 'Şişe (amfora) biçimli tüylü hücre; daha çok kristanın tepesinde bulunur. Gövdesi, afferent sinir lifinin oluşturduğu kadeh biçimli bir sinir ucuyla (kaliks) neredeyse tamamen sarılıdır.' },
      tip2: { ad: 'Tip II tüylü hücre', aciklama: 'Silindir biçimli tüylü hücre; daha çok kristanın eteklerinde bulunur. Tabanında birden çok küçük düğme biçimli afferent ve efferent sinir ucu bulunur.' },
      silya: { ad: 'Stereosilyalar', aciklama: 'Her tüylü hücrenin üst yüzünde merdiven gibi boyu artan sıralar hâlinde dizilmiş tüycükler; en uzunları kinosilyumun yanındadır. Uçları kupulanın içine uzanır. Tüyler kinosilyuma doğru eğilince hücre uyarılır (depolarize olur), ters yöne eğilince baskılanır.' },
      kino: { ad: 'Kinosilyum', aciklama: 'Her tüy demetinde bir tane bulunan, en uzun gerçek silya; demetin bir kenarında yer alır. Bir kristadaki bütün hücrelerde kinosilyum aynı tarafa bakar. Lateral kanalda utrikulus tarafındadır (endolenfin utrikulusa doğru akımı uyarır); anterior ve posterior kanallarda kanal tarafındadır (utrikulustan uzağa akım uyarır). Model lateral kanal gibi çizildi.' },
      kupula: { ad: 'Kupula', etiket: 'Kupula', aciklama: 'Kristanın üstünden ampullanın tavanına ve yan duvarlarına kadar uzanan, jelatinimsi, yelpaze biçimli kütle. Ampullanın içini bir kapak gibi kapatır; tüylü hücrelerin tüyleri içine gömülüdür. Özgül ağırlığı endolenfle hemen hemen aynı olduğundan yerçekiminden etkilenmez, yalnızca endolenf akımıyla bükülür. Modelde içindeki tüyler görünsün diye yarı saydam çizildi.' },
      kaliks: { ad: 'Kaliks sinir ucu', aciklama: 'Tip I tüylü hücrenin gövdesini kadeh gibi saran afferent sinir ucu. Vestibüler sistemin hızlı ve hassas yanıtına katkıda bulunduğu düşünülür.' },
      sinir: { ad: 'Ampullar sinir lifleri', etiket: 'Ampullar sinir', aciklama: 'Tüylü hücrelerin tabanından başlayan lifler kristanın çekirdeğinden geçer ve kemikteki küçük deliklerden çıkarak ampullar siniri oluşturur. Ampullar sinirler vestibüler sinirin üst (anterior ve lateral kanal) ve alt (posterior kanal) dallarına katılır; hücre gövdeleri iç kulak yolundaki Scarpa gangliyonundadır.' }
    },
    metinler: {
      ipucu: 'Döndürmek için sürükle, yakınlaştırmak için iki parmakla aç. Bir yapıya ya da aşağıdaki listeden bir ada dokun.',
      not: 'Şematik bir öğretim çizimidir, ölçülmüş veri değildir: hücreler ve tüyler çok büyütüldü, krista eyer yerine düz sırt olarak çizildi. Bu sayfada hareket yoktur. Bilgiler Claude tarafından taslak olarak yazıldı; kendi kaynağınla doğrula.',
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
    }
  };
})();
