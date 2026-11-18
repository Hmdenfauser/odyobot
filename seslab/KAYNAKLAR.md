# Ses laboratuvarı — kaynaklar ve lisanslar

- **Model:** `gorsel3d/periferik.json` + `periferik.bin` (3D kulak modeli sayfasıyla aynı dosya; yalnızca okunur, değiştirilmez). Lisans ve değişiklik ayrıntıları: `gorsel3d/KAYNAKLAR.md`.
  - Sieber D. ve ark., OpenEar kütüphanesi, örnek ZETA — CC BY 4.0 — https://zenodo.org/records/1473724
  - Kulak kepçesi: Artec 3D kulak taraması — CC BY 3.0 — https://www.artec3d.com/3d-models/ear ("Dış kulak" sahnesinde çizilir, 2026-11-18).
- **Frekans–yer ilişkisi:** Greenwood D. D. (1990). A cochlear frequency-position function for several species — 29 years later. J Acoust Soc Am 87(6):2592–2605. https://doi.org/10.1121/1.399052
  İnsan için F = 165,4 × (10^(2,1·x) − 0,88), x = apeksten uzaklığın kanal uzunluğuna oranı.
- **Kod:** `seslab.js`, `gorsel3d/gorsel3d.js`'in kopyasından türetildi (2026-11-18). Animasyon yalnızca ekranda çizim sırasında uygulanır.

## Ekranda "Kaynaklar" satırı
Lisans gereği OpenEar atfı sayfanın altında kalmalı.

## Yaklaşık olanlar
- Kemikçik dönme ekseni: malleus–inkus ekleminden geçen, manubriuma ve zarın normaline dik eksen (modelden hesaplandı).
- Stapes: inkus ucundaki hareketin piston yönündeki payı kadar kayar (piston yönü: inkus–stapes ekleminden tabanın vestibüle değdiği noktaya).
- Zar: kenarı sabit, umboya doğru artan esneme.
- Yürüyen dalga: skala media üzerinde, oval pencereye en yakın uçtan ağ üzerinde ölçülen uzaklıkla (0 baz, 1 apeks). Modeldeki skala media yaklaşık 19 mm (gerçek kanal ~32–35 mm); oranlar bu uzunluğa yayılır.
- İnkus: malleusla aynı eklem noktası çevresinde döner, 0,6 radyan geriden ve %88 genlikle (eklemdeki küçük göreli hareket görünsün diye büyütüldü; gerçekte ikisi çoğunlukla birlikte hareket eder).
- Kepçedeki halkalar: kanal girişine uzaklığa göre içe akan dalga; kepçenin akustik etkisi (yön, rezonans) hesaplanmadı.
- Oval pencere: vestibülün stapes tabanına ~2,8 mm yakın kısmı parlar; modelde ayrı oval pencere parçası yok.
- VIII. sinirdeki mor atımlar: elektriksel sinyalin yönünü gösterir (kokleadan beyin sapına); sinir lifi ya da aksiyon potansiyeli modeli değildir. Modelde koklear ve vestibüler dallar ayrılmadığı için bütün sinir boyunca çizilir.
- 125 Hz: Greenwood ile bazalden ~%90. En apeks ~20 Hz.
- Bütün hareketler büyütülmüş ve yavaşlatılmıştır.
