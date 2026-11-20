// Baş gölgesi hesapları (seslab/golge.js). Çalıştırma: node testler/golge-test.js
// Beklenenler ders notlarından: 1500 Hz ve üstü daha çok etkilenir; tiz sesin dalga boyu baştan küçük, pes sesinki büyük.
var G = require('../seslab/golge.js');
var gecen = 0, kalan = 0;
function bak(ad, kosul) { if (kosul) gecen++; else { kalan++; console.log('KALDI: ' + ad); } }

bak('1000 Hz dalga boyu ≈ 34 cm', Math.abs(G.dalgaBoyu(1000) - 0.343) < 1e-9);
bak('250 Hz dalga boyu ≈ 1,37 m', Math.abs(G.dalgaBoyu(250) - 1.372) < 1e-9);
bak('uzunluk yazımı: 1,37 m', G.uzunlukYaz(G.dalgaBoyu(250)) === '1,37 m');
bak('uzunluk yazımı: 34 cm', G.uzunlukYaz(G.dalgaBoyu(1000)) === '34 cm');
bak('uzunluk yazımı: 4 cm', G.uzunlukYaz(G.dalgaBoyu(8000)) === '4 cm');
[250, 500, 1000].forEach(function (f) { bak(f + ' Hz: dalga boyu baştan büyük', G.sinif(f) === 'buyuk'); });
[2000, 4000, 8000].forEach(function (f) { bak(f + ' Hz: dalga boyu baştan küçük', G.sinif(f) === 'kucuk'); });
bak('1499 Hz: ders notunda alçak frekans aralığı', G.notAraligi(1499) === 'alcak');
bak('1500 Hz: ders notunda yüksek frekans aralığı', G.notAraligi(1500) === 'yuksek');
bak('çizim zayıflaması frekansla artar', G.gorselDb(250) <= G.gorselDb(1000) && G.gorselDb(1000) < G.gorselDb(2000) && G.gorselDb(2000) < G.gorselDb(4000));
bak('çizim zayıflaması 3–6 dB ve ≥20 dB ile uyumlu', G.gorselDb(500) >= 3 && G.gorselDb(500) <= 6 && G.gorselDb(4000) >= 20);

console.log(gecen + '/' + (gecen + kalan) + ' geçti');
process.exit(kalan ? 1 : 0);
