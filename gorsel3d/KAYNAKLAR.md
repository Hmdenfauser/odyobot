# Gorsel3D: kaynaklar ve lisanslar

Bu klasördeki 3D model (`periferik.bin`, `periferik.json`) iki açık lisanslı kaynaktan türetildi. Her iki lisans da kaynak gösterilmesini şart koşar; uygulamadaki "Kaynaklar" satırı bu yüzden kaldırılmamalıdır.

## 1. OpenEar kütüphanesi (orta kulak, iç kulak, sinirler, dış kulak yolu, damar ve kemik)
- Sieber D. ve ark., "The OpenEar library of 3D models of the human temporal bone based on computed tomography and micro-slicing", Scientific Data, 2019.
- Veri: https://zenodo.org/records/1473724 — örnek ZETA (sağ kulak).
- Lisans: Creative Commons Attribution 4.0 International (CC BY 4.0).

## 2. Artec 3D kulak taraması (kulak kepçesi)
- https://www.artec3d.com/3d-models/ear
- Lisans: indirilen paketin içindeki lisans dosyasına göre Creative Commons Attribution 3.0 Unported (CC BY 3.0). Atıf: Artec 3D.

## Yapılan değişiklikler
- Bütün yapılar anatomik yöne çevrildi (x: öne, y: yukarı, z: dışa; birim mm). Yön; dış kulak yolu, iç kulak yolu ve fasiyal sinirin inen parçasına göre hizalandı ve yaklaşıktır.
- İç kulağın perilenf boşluğu (OpenEar'da "Scala Vestibuli") otomatik ayrıştırmayla skala vestibuli, vestibül, üç semisirküler kanal, ortak krus ve ampullalara bölündü. Sınırlar yaklaşıktır.
- Dış kulak yolu modelinin iki ucu açıldı; iç ucu timpanik membranın kenarına oturtuldu.
- Kulak kepçesi taraması kırpıldı, yüzde 15 küçültüldü (yaklaşık 62 mm yükseklik), Blender ile arka yüzü tamamlanıp kapalı hâle getirildi (arka yüz ölçülmüş veri değildir), 11 bölgeye elle ayrıldı ve dış kulak yolunun dış ucuna hizalandı.
- Kepçe ile kanal arasındaki yaklaşık 8 mm'lik boşluk çizilmiş bir tüp parçasıyla kapatıldı (tarama verisi değildir). Kepçe başka bir kişiye aittir.
- Temporal kemik ile sigmoid sinüs ve dura, kulağın çevresine kırpılıp sadeleştirildi.
- Renkler öğretim amaçlıdır.

## Dosya biçimi
`periferik.json` içindeki `parts` listesi her parça için kimlik (`id`), köşe sayısı (`nv`), üçgen sayısı (`nf`) ve dosyadaki başlangıç baytını (`off`) verir. `periferik.bin` içinde her parça sırayla: int16 konumlar (nv×3; değer × scale / 32767 = mm), int8 normaller (nv×3; değer / 127), nv tekse 1 bayt dolgu, uint16 üçgen dizinleri (nf×3).
