# Ses laboratuvarı — kaynaklar ve lisanslar

- **Model:** `gorsel3d/periferik.json` + `periferik.bin` (3D kulak modeli sayfasıyla aynı dosya; yalnızca okunur, değiştirilmez). Lisans ve değişiklik ayrıntıları: `gorsel3d/KAYNAKLAR.md`.
  - Sieber D. ve ark., OpenEar kütüphanesi, örnek ZETA — CC BY 4.0 — https://zenodo.org/records/1473724
  - Kulak kepçesi (Artec 3D, CC BY 3.0) bu sayfada çizilmez.
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
- Bütün hareketler büyütülmüş ve yavaşlatılmıştır.
