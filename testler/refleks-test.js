/* Akustik refleks örüntüsü testleri: node testler/refleks-test.js
   Beklenenler Jerger ve Jerger (1977) tablosundan (Clark, Open Access Guide to Audiology, Tablo 1). */
var R = require('../refleks-kural.js');
// a: { 'sag-ipsi': 'var'|'yok'|null, ... } → refleks verisi (500 Hz'e yazılır)
function vaka(a, ek) {
  var r = {};
  Object.keys(a).forEach(function (y) {
    if (a[y] == null) return;
    var p = y.split('-'); r[p[0]] = r[p[0]] || {}; r[p[0]][p[1]] = { '500': a[y] === 'yok' ? 'yok' : 90, '1000': a[y] === 'yok' ? 'yok' : 95 };
  });
  var v = { refleks: r, esik: { sag: { hava: {}, kemik: {} }, sol: { hava: {}, kemik: {} } } };
  if (ek) Object.keys(ek).forEach(function (k) { v[k] = ek[k]; });
  return v;
}
function D(si, sk, li, lk) { return { 'sag-ipsi': si, 'sag-kontra': sk, 'sol-ipsi': li, 'sol-kontra': lk }; }
function adaylar(s) { return s.adaylar.map(function (a) { return a.id + (a.taraf ? ':' + a.taraf : ''); }).join(','); }
var hata = 0, n = 0;
function bak(ad, kosul, ek) { n++; if (!kosul) hata++; console.log((kosul ? 'TAMAM ' : 'HATA  ') + ad + (ek ? '  → ' + ek : '')); }

var s;
s = R.degerlendir(vaka(D('var', 'var', 'var', 'var')));
bak('hepsi var', s.kod === 'hepsiVar');
s = R.degerlendir(vaka(D('yok', 'yok', 'yok', 'yok')));
bak('hepsi yok: iki taraflı birleşimler (orta kulak, 7. sinir, koklea/8. sinir)', s.kod === 'hepsiYok' && s.birlesimler.map(function (c) { return c[0].id + '+' + c[1].id; }).join() === 'ortaHafif+ortaHafif,n7+n7,afferent+afferent');
s = R.degerlendir(vaka(D('yok', 'var', 'var', null)));
bak('girilmeyen yol "yok" sayılır (dikey sağ)', s.kod === 'eslesti' && s.oruntu === 'dikey' && s.girilmedi.join() === 'sol-kontra', s.kod + ' ' + s.girilmedi);
s = R.degerlendir({ esik: {} });
bak('refleks yok', s.kod === 'veriYok');

// Dikey: prob sağdayken yok → sağ ipsi + sol kontra (sol uyaran, sağ prob)
s = R.degerlendir(vaka(D('yok', 'var', 'var', 'yok')));
bak('dikey sağ: sağ orta kulak (hafif) ya da sağ 7. sinir', s.kod === 'eslesti' && s.oruntu === 'dikey' && adaylar(s) === 'ortaHafif:sag,n7:sag', adaylar(s));
s = R.degerlendir(vaka(D('var', 'yok', 'yok', 'var')));
bak('dikey sol', s.oruntu === 'dikey' && adaylar(s) === 'ortaHafif:sol,n7:sol', adaylar(s));
// Çapraz: uyaran sağa verilince yok → sağ ipsi + sağ kontra
s = R.degerlendir(vaka(D('yok', 'yok', 'var', 'var')));
bak('çapraz sağ: sağ koklea / 8. sinir / koklear çekirdek', s.oruntu === 'capraz' && adaylar(s) === 'afferent:sag' && s.adaylar[0].dugumler.join() === 'sag.koklea,sag.n8,sag.kn', adaylar(s));
s = R.degerlendir(vaka(D('var', 'var', 'yok', 'yok')));
bak('çapraz sol', s.oruntu === 'capraz' && adaylar(s) === 'afferent:sol', adaylar(s));
// Ters L: iki kontra + sağ ipsi
s = R.degerlendir(vaka(D('yok', 'yok', 'var', 'yok')));
bak('ters L sağ: sağ orta kulak ya da sağa yakın beyin sapı', s.oruntu === 'tersL' && adaylar(s) === 'ortaBelirgin:sag,beyinSapiYan:sag', adaylar(s));
s = R.degerlendir(vaka(D('var', 'yok', 'yok', 'yok')));
bak('ters L sol', s.oruntu === 'tersL' && adaylar(s) === 'ortaBelirgin:sol,beyinSapiYan:sol', adaylar(s));
// Yatay: iki kontra yok
s = R.degerlendir(vaka(D('var', 'yok', 'var', 'yok')));
bak('yatay: beyin sapı orta hat', s.oruntu === 'yatay' && adaylar(s) === 'ortaHat', adaylar(s));
// Tek kutu: yalnız sağ kontra yok
s = R.degerlendir(vaka(D('var', 'yok', 'var', 'var')));
bak('tek kutu sağ: sağdan karşıya geçen yol', s.oruntu === 'tekKutu' && adaylar(s) === 'gecis:sag', adaylar(s));
s = R.degerlendir(vaka(D('var', 'var', 'var', 'yok')));
bak('tek kutu sol', s.oruntu === 'tekKutu' && adaylar(s) === 'gecis:sol', adaylar(s));
// Tanımsız: yalnız sağ ipsi yok; iki ipsi yok
s = R.degerlendir(vaka(D('yok', 'var', 'var', 'var')));
bak('yalnız sağ ipsi yok → yer göstermez (ipsiTek)', s.kod === 'ipsiTek' && adaylar(s) === 'ipsiTek:sag', adaylar(s));
s = R.degerlendir(vaka(D('yok', 'var', 'yok', 'var')));
bak('iki ipsi yok → yer göstermez', s.kod === 'ipsiTek' && adaylar(s) === 'ipsiTek:sag,ipsiTek:sol', adaylar(s));
function bir(s) { return s.birlesimler.map(function (c) { return c.map(function (a) { return a.id + ':' + a.taraf; }).join('+'); }).join(' , '); }
s = R.degerlendir(vaka(D('yok', 'var', 'yok', 'yok')));
bak('sağ ipsi + sol ipsi + sol kontra → sağ dikey + sol çapraz', s.kod === 'birlesim' && bir(s) === 'ortaHafif:sag+afferent:sol , n7:sag+afferent:sol', bir(s));
s = R.degerlendir(vaka(D('yok', 'yok', 'yok', 'var')));
bak('sağ ipsi + sağ kontra + sol ipsi → sol dikey + sağ çapraz', s.kod === 'birlesim' && bir(s) === 'ortaHafif:sol+afferent:sag , n7:sol+afferent:sag', bir(s));
// 16 birleşimin hepsi bir açıklama alıyor
var adlar = ['var', 'yok'], kodlar = {};
adlar.forEach(function (a) { adlar.forEach(function (b) { adlar.forEach(function (c) { adlar.forEach(function (d4) {
  var x = R.degerlendir(vaka(D(a, b, c, d4)));
  kodlar[[a, b, c, d4].join('/')] = x.kod + (x.kod === 'birlesim' && !x.birlesimler.length ? '!' : '');
}); }); }); });
var bos = Object.keys(kodlar).filter(function (k) { return /!|tanimsiz|undefined/.test(kodlar[k]); });
bak('16 birleşimin hepsi açıklandı', Object.keys(kodlar).length === 16 && !bos.length, JSON.stringify(kodlar));
s = R.degerlendir({ refleks: {} });
bak('hiç değer girilmemiş → veri yok', s.kod === 'veriYok');

// Kısmi: bir frekansta yok, diğerinde var → "var" sayılır, kismi listede
var vk = vaka(D('var', 'var', 'var', 'var')); vk.refleks.sag.ipsi['4000'] = 'yok';
s = R.degerlendir(vk);
bak('kısmi yok "var" sayılır', s.kod === 'hepsiVar' && s.kismi.length === 1 && s.kismi[0].frekanslar.join() === '4000');

// Çapraz kontrol notları
function notlar(s) { return s.adaylar.map(function (a) { return a.notlar.map(function (x) { return x.kod + (x.tip ? '(' + x.tip + ')' : '') + (x.db != null ? '(' + x.db + ')' : ''); }).join('+'); }).join(' | '); }
s = R.degerlendir(vaka(D('yok', 'var', 'var', 'yok'), { timpan: { sag: { duz: true } } }));
bak('dikey sağ + sağ Tip B → orta kulak destekleniyor', notlar(s).indexOf('timpDestek(B)') === 0, notlar(s));
s = R.degerlendir(vaka(D('yok', 'var', 'var', 'yok'), { timpan: { sag: { basinc: 0, kompliyans: 0.7 } } }));
bak('dikey sağ + sağ Tip A → orta kulak normal görünüyor', notlar(s).indexOf('timpNormal') === 0, notlar(s));
var e = vaka(D('yok', 'yok', 'var', 'var')); e.esik.sag.hava = { '500': { db: 85 }, '1000': { db: 90 } };
s = R.degerlendir(e);
bak('çapraz sağ + eşik 90 → ileri kayıp açıklayabilir', notlar(s) === 'esikIleri(90)', notlar(s));
e.esik.sag.hava = { '500': { db: 20 }, '1000': { db: 15 } };
s = R.degerlendir(e);
bak('çapraz sağ + eşik 20 → kayıp açıklamaz (ABR)', notlar(s) === 'esikIyi(20)', notlar(s));
e.esik.sag.hava = { '500': { db: 60 } };
s = R.degerlendir(e);
bak('çapraz sağ + eşik 60 → refleks eşiği yükselmiş olabilir', notlar(s) === 'esikOrta(60)', notlar(s));
e.esik.sag.hava = {};
s = R.degerlendir(e);
bak('çapraz sağ + eşik yok', notlar(s) === 'esikYok', notlar(s));
var c = vaka(D('yok', 'yok', 'var', 'yok'));
c.esik.sag = { hava: { '500': { db: 40 }, '1000': { db: 40 }, '2000': { db: 40 } }, kemik: { '500': { db: 10 }, '1000': { db: 10 }, '2000': { db: 10 } } };
s = R.degerlendir(c);
bak('ters L sağ + iletim kaybı → ABG notu', /abg/.test(notlar(s).split(' | ')[0]), notlar(s));

console.log((n - hata) + ' başarılı, ' + hata + ' hatalı');
process.exit(hata ? 1 : 0);
