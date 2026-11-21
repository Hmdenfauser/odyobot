/* Koklea kesiti ve tüylü hücreler (3D modeller → #3d/korti, 2026-11-21).
   - Model korti.js içinde kodla (kütüphanesiz) çizilir; ölçülmüş veri değildir, şematiktir. Hareket yok (hareketli kısım Ses laboratuvarına).
   - Yapı adları ve açıklamaları proje sahibinin ders notuna dayanılarak Claude tarafından TASLAK yazıldı
     (İşitme ve Denge Sistemleri-1, "iç kulak" dersi, slayt 8–20). Proje sahibi doğrular, yönetici uygulamadan düzenler:
     icerik/korti.yapi.<id> (ad, aciklama), korti.genel (ad, aciklama), korti.metin (ipucu, not).
   - Kimlikler (id) değiştirilmez. Renkler korti.css → --kt-<id>. */
(function () {
  window.KORTI_VERI = {
    genel: { ad: 'Koklea kesiti', aciklama: 'Kokleanın bir turundan alınmış ince bir dilim. Kemik kanal (kanalis spiralis koklea), osseöz spiral lamina ve baziler membranla üstte skala vestibuli, altta skala timpani olarak ikiye ayrılır; aralarında Reissner membranıyla sınırlanan skala media (koklear kanal) bulunur. Corti organı baziler membranın üstünde yer alır. Bir yapıya dokunarak adını ve görevini görebilirsin.' },
    gruplar: [
      { ad: 'Kemik ve sıvı boşlukları', yapilar: ['kemik', 'osl', 'sv', 'sm', 'st'] },
      { ad: 'Zarlar', yapilar: ['reissner', 'baziler', 'tektoryal'] },
      { ad: 'Corti organı', yapilar: ['ith', 'dth', 'silya', 'pilar', 'destek'] },
      { ad: 'Lateral duvar', yapilar: ['stria', 'ligament'] },
      { ad: 'Sinir', yapilar: ['ganglion', 'sinir'] }
    ],
    yapilar: {
      kemik: { ad: 'Kemik duvar', etiket: 'Kemik duvar', aciklama: 'Kokleanın kemik labirentini oluşturan sert kemik (otik kapsül). Kanalis spiralis koklea, modiolus denen kemik eksenin çevresinde yaklaşık 2,5–2,75 tur döner. Burada kanalın bir dilimi görülüyor; sol taraf modiolusa, sağ taraf dış yan duvara bakar.' },
      osl: { ad: 'Osseöz spiral lamina', etiket: 'Osseöz spiral lamina', aciklama: 'Modiolustan kanalın içine uzanan ince kemik raf (lamina spiralis ossea). İki ince kemik plakadan oluşur; sinir lifleri bu plakaların arasından geçer. Üst yüzündeki kalınlaşma spiral limbustur: Reissner membranı ve tektoryal membran buraya tutunur. Serbest kenarından baziler membran başlar.' },
      sv: { ad: 'Skala vestibuli', etiket: 'Skala vestibuli (perilenf)', aciklama: 'Kanalın üst bölümü; perilenf içerir. Vestibüle ve oval pencereye açılır; stapesin titreşimi sıvıya buradan geçer. Kokleanın tepesinde helikotrema aracılığıyla skala timpaniyle birleşir.' },
      sm: { ad: 'Skala media (koklear kanal)', etiket: 'Skala media (endolenf)', aciklama: 'Zar labirentin koklea içindeki bölümü; endolenf içerir. Üstte Reissner membranı, dışta stria vaskülaris ve spiral ligament, altta baziler membran ve osseöz spiral lamina ile sınırlanır. Corti organı bu boşluğun tabanında yer alır.' },
      st: { ad: 'Skala timpani', etiket: 'Skala timpani (perilenf)', aciklama: 'Kanalın alt bölümü; perilenf içerir. Yuvarlak pencere aracılığıyla orta kulakla komşudur. Oval pencere içe itildiğinde yuvarlak pencere dışa esneyerek sıvının hareket etmesine izin verir.' },
      reissner: { ad: 'Reissner membranı', aciklama: 'Skala vestibuliyi skala mediadan ayıran çok ince zar. İçte spiral limbusa, dışta spiral ligamana tutunur. Suya geçirgendir ama büyük molekülleri geçirmez; perilenf ile endolenfin birbirine karışmasını engeller.' },
      baziler: { ad: 'Baziler membran', etiket: 'Baziler membran', aciklama: 'Osseöz spiral laminanın serbest kenarından spiral ligamana uzanan bağ dokusu zar; Corti organı üstünde durur. Tabanda dar, ince ve gergin; tepeye doğru genişler ve gevşer (ders notlarında genişlik yaklaşık 0,15 mm’den 0,45 mm’ye). Bu yüzden yüksek frekanslar tabanda, düşük frekanslar tepede en büyük titreşimi oluşturur.' },
      tektoryal: { ad: 'Tektoryal membran', etiket: 'Tektoryal membran', aciklama: 'Spiral limbusa (osseöz spiral laminanın vestibüler dudağına) tutunup dışa doğru uzanan ve Corti organını örten jelatinimsi zar. Dış tüylü hücrelerin en uzun stereosilyaları alt yüzüne değer; iç tüylü hücrelerinkiler değmez. Baziler membran hareket edince tektoryal membranla arasında kayma olur ve tüyler bükülür.' },
      ith: { ad: 'İç tüylü hücre', etiket: 'İç tüylü hücre', aciklama: 'Tek sıra hâlinde dizilen, kadeh (armut) biçimli asıl duyu hücreleri; yaklaşık 3500 tane. İşitme siniri liflerinin büyük çoğunluğu (Tip I lifler) bunlarla sinaps yapar. Stereosilyaları tektoryal membrana değmez; sıvı hareketiyle uyarılırlar.' },
      dth: { ad: 'Dış tüylü hücreler', etiket: 'Dış tüylü hücreler', aciklama: 'Üç sıra hâlinde dizilen uzun, silindirik hücreler; yaklaşık 12.500 tane. Boy değiştirerek (elektromotilite) baziler membranın titreşimini güçlendirir, kokleanın duyarlılığını ve frekans seçiciliğini artırır; otoakustik emisyonların kaynağıdır. Sinir bağlantıları ağırlıklı olarak efferenttir.' },
      silya: { ad: 'Stereosilyalar', aciklama: 'Tüylü hücrelerin üst yüzündeki (kütiküler plak) sert tüycükler; gerçek silya değil, aktin içeren mikrovilluslardır. Boyları içten dışa doğru artar. Dış tüylü hücrelerde W, iç tüylü hücrelerde daha düz (U benzeri) sıra hâlinde dizilir. Bükülünce iyon kanalları açılır ve hücre uyarılır.' },
      pilar: { ad: 'Pilar hücreler ve Corti tüneli', aciklama: 'İç ve dış pilar hücreler baziler membran üzerinde birbirine yaslanarak üçgen biçimli Corti tünelini oluşturur. Tünel iç tüylü hücreleri dış tüylü hücrelerden ayırır; dış tüylü hücrelere giden sinir lifleri tünelin içinden geçer.' },
      destek: { ad: 'Destek hücreleri', aciklama: 'Tüylü hücreleri taşıyan ve çevreleyen hücreler. Deiters hücreleri dış tüylü hücrelerin altında onları kadeh gibi taşır; Hensen hücreleri Corti organının dış sınırını oluşturur; Claudius hücreleri baziler membranın dış kısmını örter. İç falangeal hücreler iç tüylü hücrenin yanında bulunur.' },
      stria: { ad: 'Stria vaskülaris', aciklama: 'Skala medianın dış duvarında, spiral ligamanın iç yüzündeki damardan zengin doku. Marjinal, intermediyer ve bazal hücrelerden oluşur. Endolenfi üretir; endolenfin yüksek potasyum, düşük sodyum içeriğini ve endokoklear potansiyeli sağlar.' },
      ligament: { ad: 'Spiral ligament', etiket: 'Spiral ligament', aciklama: 'Kanalın dış yan duvarını döşeyen, çoğunluğu fibroblast benzeri hücrelerden oluşan bağ dokusu. Baziler membran ve Reissner membranı dış uçlarında buna tutunur; iyon dengesinde de rol alır.' },
      ganglion: { ad: 'Spiral gangliyon', aciklama: 'Modiolustaki Rosenthal kanalında spiral boyunca uzanan, işitme siniri nöronlarının hücre gövdelerinin bulunduğu gangliyon (Korti gangliyonu). Tip I nöronlar iç tüylü hücrelerle, Tip II nöronlar dış tüylü hücrelerle bağlantılıdır.' },
      sinir: { ad: 'Sinir lifleri', etiket: 'İşitme siniri lifleri', aciklama: 'Tüylü hücrelerin alt yüzünden başlayan lifler osseöz spiral laminanın plakaları arasından (habenula perforata) geçerek spiral gangliyona ulaşır; gangliyondan çıkan lifler modiolusta birleşerek koklear siniri (VIII. sinirin işitme bölümü) oluşturur. Lifler spiral laminaya kadar miyelinsizdir, sonra miyelin kazanır.' }
    },
    /* Ses laboratuvarı → Corti organı animasyonu (#seslab/corti). Yapı adları/açıklamaları yukarıdakilerle ortak.
       Yönetici düzenler: icerik/korti.anim.genel (ad, aciklama), korti.anim.metin. Klinik metinler TASLAK. */
    anim: {
      genel: { ad: 'Corti organı: sesten elektriğe', aciklama: 'Ses dalgası koklea sıvısında baziler membranı yukarı-aşağı titreştirir. Corti organı baziler membranla birlikte osseöz spiral laminanın ucu çevresinde, tektoryal membran ise spiral limbustaki tutunma yeri çevresinde hareket eder; iki dönme noktası farklı olduğu için aralarında kayma olur ve tüyler bükülür. Tüyler en uzun tüye doğru (modiolustan uzağa) büküldüğünde uç bağları gerilir, iyon kanalları açılır ve endolenfteki potasyum (K⁺) hücreye girer: hücre depolarize olur. Böylece mekanik enerji elektriksel enerjiye dönüşür (mekanoelektriksel transdüksiyon). İç tüylü hücre tabanında nörotransmitter (glutamat) salar ve işitme sinirinde sinyal başlar; dış tüylü hücre ise kısalıp uzayarak baziler membranın hareketini güçlendirir. Bir yapıya dokunarak adını ve görevini görebilirsin.' },
      metinler: {
        asamaYukari: 'Baziler membran yukarı → tüyler en uzun tüye doğru bükülür → kanallar açılır, K⁺ girer → hücre depolarize olur → iç tüylü hücre nörotransmitter salar, sinirde sinyal; dış tüylü hücre kısalır.',
        asamaAsagi: 'Baziler membran aşağı → tüyler kısa tüye doğru bükülür → kanallar kapanır → hücre hiperpolarize olur, sinyal durur; dış tüylü hücre biraz uzar.',
        ipucu: 'Döndürmek için sürükle, yakınlaştırmak için iki parmakla aç. Bir yapıya dokununca adı ve görevi çıkar.',
        not: 'Renkler: sarı noktalar potasyum (K⁺) iyonları, yeşil noktalar nörotransmitter (glutamat), sinirde ilerleyen mor ışık aksiyon potansiyeli; hücre pembeleşince depolarize olmuştur. Hareket çok büyütüldü ve yavaşlatıldı: gerçekte titreşim nanometre düzeyindedir ve saniyede yüzlerce, binlerce kez olur. Şematik bir öğretim çizimidir. Bilgiler proje sahibinin ders notlarından (İşitme ve Denge Sistemleri-1, Elektrofizyolojik Testler) ve NCBI kaynaklarından alındı; kendi kaynağınla doğrula.',
        etiket: 'Kokleanın bir dilimi · yavaşlatılmış',
        genelGorunum: 'Genel görünüme dön',
        oynat: 'Oynat',
        duraklat: 'Duraklat',
        yukleniyor: 'Model hazırlanıyor…',
        baslatilamadi: 'Bu cihazda 3D çizim başlatılamadı.'
      }
    },
    metinler: {
      ipucu: 'Döndürmek için sürükle, yakınlaştırmak için iki parmakla aç. Bir yapıya ya da aşağıdaki listeden bir ada dokun.',
      not: 'Şematik bir öğretim çizimidir, ölçülmüş bir model değildir: hücreler ve tüycükler görünsün diye çok büyütüldü, oranlar gerçek değildir. Sıvı boşlukları (skalalar) dilimin arka yüzünde renkli olarak gösterildi. Bilgiler proje sahibinin ders notlarından (İşitme ve Denge Sistemleri-1, iç kulak) alındı; kendi kaynağınla doğrula.',
      genelGorunum: 'Genel görünüme dön',
      etiket: 'Kokleanın bir dilimi · şematik',
      yukleniyor: 'Model hazırlanıyor…',
      baslatilamadi: 'Bu cihazda 3D çizim başlatılamadı.',
      solYan: 'Modiolus',
      sagYan: 'Dış duvar'
    }
  };
})();
