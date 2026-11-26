/* Vestibüler manevralar hesap testi: node testler/manevra-test.js
   Her manevra sağ ve sol kulak için baştan sona oynatılır. Tedavi manevralarında kristallerin utrikulusa döküldüğü,
   tanı testlerinde kupulanın beklenen yöne büküldüğü sınanır. Beklenen yönler: Ewald yasaları (lateral kanalda ampullopetal,
   vertikal kanallarda ampullofugal akım uyarıcı; İşitme ve Denge Sistemleri-2, sl. 41), kitap (Odyolojide Özel Durumlar
   s. 458–460) ve Choung 2006 (eğil-yaslan). Model şematiktir; test yalnızca animasyonun mantığını korur. */
var H = require('../manevra/manevra-hesap.js');
var hata = 0;
function bekle(ad, kosul, bilgi) { console.log((kosul ? 'GEÇTİ ' : 'KALDI ') + ad + (bilgi ? ' (' + bilgi + ')' : '')); if (!kosul) hata++; }

// Bir çeşidi oynat; her adımın sonunda kristal durumu ve adım içindeki en büyük/en küçük kupula bükülmesi
function oynat(id, cesit, taraf) {
  var o = H.oynatici(id, cesit, taraf), A = o.adimlar, sonuc = A.map(function () { return { enCok: 0, enAz: 0 }; });
  for (var i = 0; i < 100000; i++) {
    var k = o.durum().adim, bitti = o.ilerle(1 / 60), b = o.durum().bukulme;
    sonuc[k].enCok = Math.max(sonuc[k].enCok, b); sonuc[k].enAz = Math.min(sonuc[k].enAz, b);
    var L = o.kristaller();
    sonuc[k].cikan = L.filter(function (x) { return x.cikti; }).length;
    sonuc[k].ort = L.filter(function (x) { return !x.cikti; }).reduce(function (s, x, j, d) { return s + x.u / d.length; }, 0);
    if (bitti) break;
  }
  return { s: sonuc, uyari: o.kanal.uyari, sayi: o.kristaller().length };
}

['sag', 'sol'].forEach(function (taraf) {
  var T = taraf === 'sag' ? 'sağ' : 'sol';
  // Tedavi manevraları: bütün kristaller utrikulusa
  [['epley', 'kanal'], ['semont', 'kanal'], ['semont', 'kupula'], ['barbeku', 'kanal'], ['vannucchi-asprella', 'kanal'],
    ['casani', 'kupula'], ['gufoni', 'geo'], ['gufoni', 'apo'], ['gufoni', 'appiani'], ['yacovino', 'kanal']].forEach(function (x) {
    var r = oynat(x[0], x[1], taraf), son = r.s[r.s.length - 1];
    bekle(T + ' ' + x[0] + ' (' + x[1] + '): kristaller utrikulusta', son.cikan === r.sayi, son.cikan + '/' + r.sayi);
  });
  // Tanı testleri: kristal çıkmaz
  ['dix-hallpike', 'yana-yatirma', 'supine-roll', 'egil-yaslan', 'duz-bas-sarkitma'].forEach(function (id) {
    H.cesitler(id).forEach(function (c) {
      var r = oynat(id, c, taraf), cik = r.s.reduce(function (m, a) { return Math.max(m, a.cikan); }, 0);
      bekle(T + ' ' + id + ' (' + c + '): test kristalleri kanaldan çıkarmaz', cik === 0);
    });
  });
  // Dix-Hallpike: yatınca ampullofugal (posterior kanalda uyarı), oturunca ters yön
  var dh = oynat('dix-hallpike', 'kanal', taraf);
  bekle(T + ' Dix-Hallpike: yatınca kupula ampulladan uzağa (uyarı)', dh.s[2].enCok > 0.8, dh.s[2].enCok.toFixed(2));
  bekle(T + ' Dix-Hallpike: oturunca ters yön', dh.s[3].enAz < -0.8, dh.s[3].enAz.toFixed(2));
  var yy = oynat('yana-yatirma', 'kanal', taraf);
  bekle(T + ' Yana yatırma: kupula ampulladan uzağa (uyarı)', yy.s[2].enCok > 0.8, yy.s[2].enCok.toFixed(2));
  // Supine roll, kanalolitiazis: hasta tarafa çevirince ampullaya doğru (lateral kanalda uyarı) ve sağlam taraftakinden güçlü
  var sr = oynat('supine-roll', 'kanal', taraf);
  bekle(T + ' Supine roll (kanalolitiazis): hasta tarafa çevirince uyarı', sr.s[1].enAz < -0.8, sr.s[1].enAz.toFixed(2));
  // Sağlam tarafa çevirince ampulladan uzağa (baskılanma); Ewald'ın 2. yasasına göre uyarı baskılanmadan güçlüdür
  bekle(T + ' Supine roll (kanalolitiazis): sağlam tarafa çevirince baskılanma', sr.s[3].enCok > 0.4 && sr.s[3].enAz > -0.3, sr.s[3].enCok.toFixed(2));
  // Kupulolitiazis: sağlam tarafa çevirince uyarı daha güçlü (ageotropik nistagmusta zayıf taraf hasta taraf)
  var sk = oynat('supine-roll', 'kupula', taraf);
  bekle(T + ' Supine roll (kupulolitiazis): sağlam tarafta uyarı daha güçlü', -sk.s[3].enAz > -sk.s[1].enAz, sk.s[3].enAz.toFixed(2) + ' / ' + sk.s[1].enAz.toFixed(2));
  // Eğil-yaslan, kanalolitiazis: eğilince uyarı (nistagmus hasta kulağa), yaslanınca baskılanma
  var ey = oynat('egil-yaslan', 'kanal', taraf);
  bekle(T + ' Eğil-yaslan (kanalolitiazis): eğilince uyarı', ey.s[1].enAz < -0.8, ey.s[1].enAz.toFixed(2));
  bekle(T + ' Eğil-yaslan (kanalolitiazis): yaslanınca baskılanma', ey.s[2].enCok > 0.4, ey.s[2].enCok.toFixed(2));
  // Düz baş sarkıtma: anterior kanalda ampullofugal (uyarı)
  var ds = oynat('duz-bas-sarkitma', 'kanal', taraf);
  bekle(T + ' Düz baş sarkıtma: anterior kanalda uyarı', ds.s[1].enCok > 0.8, ds.s[1].enCok.toFixed(2));
});
// Aynı girdi her zaman aynı sonucu verir
var a = oynat('epley', 'kanal', 'sag'), b = oynat('epley', 'kanal', 'sag');
bekle('tekrarlanabilir', JSON.stringify(a) === JSON.stringify(b));
// Adıma atlama baştan oynatmayla aynı yere varır
var o1 = H.oynatici('epley', 'kanal', 'sag'); o1.git(5);
var o2 = H.oynatici('epley', 'kanal', 'sag'); while (o2.durum().adim < 5) o2.ilerle(1 / 60);
bekle('adıma atlama tutarlı', Math.abs(o1.kristaller()[0].u - o2.kristaller()[0].u) < 1e-9);

console.log(hata ? hata + ' test KALDI' : 'Bütün testler geçti');
process.exitCode = hata ? 1 : 0;
