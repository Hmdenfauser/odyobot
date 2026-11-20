// Dağılma hesapları (seslab/dagilma.js). Çalıştırma: node testler/dagilma-test.js
// Beklenenler ders notlarından: dalga boyu engelden büyükse dolaşır, eşitse saçılır, küçükse gölge;
// baş gölgesinde 1500 Hz ve üstü daha çok etkilenir (3–6 dB / ≥20 dB).
var G = require('../seslab/dagilma.js');
var gecen = 0, kalan = 0;
function bak(ad, kosul) { if (kosul) gecen++; else { kalan++; console.log('KALDI: ' + ad); } }

bak('1000 Hz dalga boyu ≈ 34 cm', Math.abs(G.dalgaBoyu(1000) - 0.343) < 1e-9);
bak('250 Hz dalga boyu ≈ 1,37 m', Math.abs(G.dalgaBoyu(250) - 1.372) < 1e-9);
bak('uzunluk yazımı: 1,37 m', G.uzunlukYaz(G.dalgaBoyu(250)) === '1,37 m');
bak('uzunluk yazımı: 34 cm', G.uzunlukYaz(G.dalgaBoyu(1000)) === '34 cm');
bak('uzunluk yazımı: 4 cm', G.uzunlukYaz(G.dalgaBoyu(8000)) === '4 cm');

// Duvar (≈70 cm)
var DV = G.DUVAR_BOYU;
[125, 250].forEach(function (f) { bak('duvar ' + f + ' Hz: dalga boyu büyük (dolaşır)', G.sinif(f, DV) === 'buyuk'); });
bak('duvar 500 Hz: dalga boyu duvara yakın (saçılma)', G.sinif(500, DV) === 'esit');
[1000, 2000, 4000].forEach(function (f) { bak('duvar ' + f + ' Hz: dalga boyu küçük (gölge)', G.sinif(f, DV) === 'kucuk'); });
bak('duvar gölgesi frekansla koyulaşır', G.duvarZayiflama(125) < G.duvarZayiflama(500) && G.duvarZayiflama(500) < G.duvarZayiflama(4000));
bak('duvar 125 Hz: gölge neredeyse yok', G.duvarZayiflama(125) < 0.1);
bak('duvar 4000 Hz: gölge belirgin', G.duvarZayiflama(4000) > 0.85);

// Baş (≈18 cm)
var BS = G.BAS_GENISLIGI;
[250, 500, 1000].forEach(function (f) { bak('baş ' + f + ' Hz: dalga boyu büyük', G.sinif(f, BS) === 'buyuk'); });
bak('baş 2000 Hz: dalga boyu başa yakın', G.sinif(2000, BS) === 'esit');
[4000, 8000].forEach(function (f) { bak('baş ' + f + ' Hz: dalga boyu küçük', G.sinif(f, BS) === 'kucuk'); });
bak('1499 Hz: ders notunda alçak frekans aralığı', G.notAraligi(1499) === 'alcak');
bak('1500 Hz: ders notunda yüksek frekans aralığı', G.notAraligi(1500) === 'yuksek');
bak('baş çizim zayıflaması frekansla artar', G.gorselDb(250) <= G.gorselDb(1000) && G.gorselDb(1000) < G.gorselDb(2000) && G.gorselDb(2000) < G.gorselDb(4000));
bak('baş çizim zayıflaması 3–6 dB ve ≥20 dB ile uyumlu', G.gorselDb(500) >= 3 && G.gorselDb(500) <= 6 && G.gorselDb(4000) >= 20);

console.log(gecen + '/' + (gecen + kalan) + ' geçti');
process.exit(kalan ? 1 : 0);
