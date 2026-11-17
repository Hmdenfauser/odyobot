/* Timpanogram tipi testleri: node testler/timpan-test.js
   Sınırlar: proje sahibinin ders slaytı (2.timpanometri.pptx, slayt 30–34) ve 2026-11-17 kararları. */
var H = require('../odyo-hesap.js');
var vakalar = [
  [{ basinc: 0, kompliyans: 0.7 }, 'A'],
  [{ basinc: -100, kompliyans: 0.35 }, 'A'],      // iki alt sınır da A
  [{ basinc: 50, kompliyans: 1.30 }, 'A'],        // iki üst sınır da A
  [{ basinc: -20, kompliyans: 0.34 }, 'As'],
  [{ basinc: -20, kompliyans: 0.1 }, 'As'],
  [{ basinc: 10, kompliyans: 1.31 }, 'Ad'],
  [{ basinc: 10, kompliyans: 3.2 }, 'Ad'],
  [{ basinc: -101, kompliyans: 0.7 }, 'C'],
  [{ basinc: -250, kompliyans: 0.2 }, 'C'],       // C'de kompliyansa bakılmaz
  [{ basinc: -250 }, 'C'],
  [{ duz: true, kompliyans: 0.05 }, 'B'],
  [{ duz: true }, 'B'],
  [{ basinc: 51, kompliyans: 0.7 }, null],        // +50 üstü sınıflanamadı
  [{ basinc: 0 }, null],                          // kompliyans eksik
  [{ kompliyans: 0.7 }, null]                     // basınç eksik
];
var hata = 0;
vakalar.forEach(function (v) {
  var r = H.timpanTipi(v[0]);
  var ok = r.kod === v[1];
  if (!ok) hata++;
  console.log((ok ? 'TAMAM ' : 'HATA  ') + JSON.stringify(v[0]) + ' → ' + r.kod + ' (' + r.metin + ')');
});
console.log((vakalar.length - hata) + ' başarılı, ' + hata + ' hatalı');
process.exit(hata ? 1 : 0);
