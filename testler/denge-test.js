/* Denge hesapları testi (Ses laboratuvarı → Denge): node testler/denge-test.js
   Modeli gorsel3d/ klasöründen yalnızca okur. Sağ posterior kanal BPPV'sinde Dix-Hallpike + Epley sırasının
   beklenen sonucu verdiğini ve makula kaymalarının yönünü sınar. */
var fs = require('fs'), path = require('path'), S = require('../seslab/denge.js');
var D = path.join(__dirname, '..', 'gorsel3d');
var meta = JSON.parse(fs.readFileSync(path.join(D, 'periferik.json'))), b = fs.readFileSync(path.join(D, 'periferik.bin'));
var ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), k = meta.scale / 32767, PART = {};
meta.parts.forEach(function (m) { var q = new Int16Array(ab, m.off, m.nv * 3), P = new Float32Array(m.nv * 3); for (var j = 0; j < P.length; j++) P[j] = q[j] * k; PART[m.id] = { P: P }; });
var hata = 0;
function bekle(ad, kosul, bilgi) { console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad + (bilgi ? ' (' + bilgi + ')' : '')); if (!kosul) hata++; }

var Y = S.kanalYolu(PART);
bekle('kanal yolu uzunluğu makul (10–30 mm)', Y.L > 10 && Y.L < 30, Y.L.toFixed(1) + ' mm');
bekle('ampulla yolun alt ucunda', Y.ampulla[1] < Y.yol[Math.floor(Y.yol.length / 2)][1]);

var veri = (function () { var w = {}; global.window = w; require('../seslab/seslab-veri.js'); delete global.window; return w.SESLAB_VERI; })();
var bppv = veri.denge.sahneler.filter(function (s) { return s.id === 'bppv'; })[0];
var K = S.kristaller(Y, 8), sonuc = {};
bppv.adimlar.forEach(function (a) {
  var g = S.kuvvetModelde(S.pozMatris(a.poz || {})), enCok = -9, enAz = 9;
  for (var t = 0; t < 10; t += 0.02) { var c = S.adim(Y, K, g, 0.02); enCok = Math.max(enCok, c); enAz = Math.min(enAz, c); }
  sonuc[a.id] = { u: K.map(function (x) { return x.u; }), cikan: K.filter(function (x) { return x.cikti; }).length, kupMax: enCok, kupMin: enAz };
});
bekle('başlangıçta kristaller ampullaya yakın', Math.max.apply(null, sonuc.basla.u) < Y.L * 0.3);
bekle('Dix-Hallpike: kupula ampullofugal (uyarıcı)', sonuc.dix.kupMax > 1 && sonuc.dix.kupMax > -sonuc.dix.kupMin * 2, 'en çok ' + sonuc.dix.kupMax.toFixed(2));
bekle('Dix-Hallpike: kristaller ampulladan uzaklaştı', Math.min.apply(null, sonuc.dix.u) > Math.max.apply(null, sonuc.basla.u));
bekle('Epley 2: kristaller ilerledi', Math.min.apply(null, sonuc.e2.u) > Math.min.apply(null, sonuc.dix.u));
bekle('Epley sonunda bütün kristaller utrikulusta', sonuc.son.cikan === 8, sonuc.son.cikan + '/8');

var mak = S.makulalar(PART);
function kayma(poz, ivme, m) { return S.makulaKayma(mak[m], S.kuvvetModelde(S.pozMatris(poz), ivme), 1); }
var dik = kayma({}, null, 'utr'), one = kayma({ egim: 30 }, null, 'utr'), sag = kayma({ yan: 30 }, null, 'utr'), ileri = kayma({}, [0, 0, 0.5], 'utr');
bekle('baş dik: utrikulusta kayma yok', Math.hypot(dik[0], dik[1], dik[2]) < 0.01);
bekle('baş öne eğik: utrikulus zarı öne kayar', one[0] > 0.3, 'ön bileşen ' + one[0].toFixed(2));
bekle('baş sağa eğik: utrikulus zarı dışa (sağa) kayar', sag[2] > 0.3, 'dış bileşen ' + sag[2].toFixed(2));
bekle('ileri hızlanma: utrikulus zarı geriye kayar', ileri[0] < -0.3, 'ön bileşen ' + ileri[0].toFixed(2));
var sakDik = kayma({}, null, 'sak');
bekle('baş dik: sakkulus zarı aşağı çekilir', sakDik[1] < -0.8, 'üst bileşen ' + sakDik[1].toFixed(2));
console.log(hata ? hata + ' test kaldı' : 'Bütün testler geçti');
process.exit(hata ? 1 : 0);
