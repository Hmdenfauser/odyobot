/* OAE geçti/kaldı testleri: node testler/oae-test.js
   Ölçüt: proje sahibinin ders slaytı (Enstrümantasyon OAE 2) + 2026-11-17 kararı. */
var H = require('../odyo-hesap.js');
function o(l) { var r = {}; l.forEach(function (x) { r[x[0]] = { s: x[1], g: x[2] }; }); return r; }
var vakalar = [
  ['3 frekansta tam 6 dB → geçti', o([[1000, 0, -6], [2000, 4, -2], [4000, 10, 4], [8000, -5, -8]]), null, 'gecti'],
  ['5,9 dB sayılmaz → kaldı', o([[1000, 0, -5.9], [2000, 4, -1.9], [4000, 10, 4.1], [8000, 10, 0]]), null, 'kaldi'],
  ['2 frekans girildi, ikisi de var → değerlendirilemedi', o([[1000, 10, 0], [2000, 10, 0]]), null, 'yetersiz'],
  ['hiç veri yok', {}, null, null],
  ['TE repro 79 → geçersiz', o([[1000, 10, 0], [2000, 10, 0], [3000, 10, 0]]), { repro: 79, stab: 95 }, 'gecersiz'],
  ['TE stab 89 → geçersiz', o([[1000, 10, 0], [2000, 10, 0], [3000, 10, 0]]), { repro: 90, stab: 89 }, 'gecersiz'],
  ['TE repro 80 stab 90 → geçti', o([[1000, 10, 0], [2000, 10, 0], [3000, 10, 0]]), { repro: 80, stab: 90 }, 'gecti'],
  ['repro girilmemiş → ölçüte katılmaz', o([[1000, 10, 0], [2000, 10, 0], [3000, 10, 0]]), {}, 'gecti'],
  ['negatif değerler', o([[1000, -2, -10], [1500, -3, -12], [2000, -1, -7], [3000, -20, -15]]), null, 'gecti']
];
var hata = 0;
vakalar.forEach(function (v) {
  var r = H.oaeSonuc(v[1], v[2]);
  var ok = r.kod === v[3]; if (!ok) hata++;
  console.log((ok ? 'TAMAM ' : 'HATA  ') + v[0] + ' → ' + r.kod + ' (' + r.metin + ')');
});
console.log((vakalar.length - hata) + ' başarılı, ' + hata + ' hatalı');
process.exit(hata ? 1 : 0);
