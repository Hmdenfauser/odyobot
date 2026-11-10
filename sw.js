/* OdyoBOT servis çalışanı (service worker): uygulama dosyalarını cihaza kaydeder, internetsiz açılmayı sağlar.

   Yeni sürüm yayınlarken:
   - Bu listeye yeni dosya eklendiyse ya da bir dosya silindiyse ASSETS'i güncelle.
   - VERSION'ı bir artır (ör. v2). Böylece eski önbellek silinir.
   Sayfa, css, js ve manifest internet varken her zaman yeniden alınır (sürüm karışmasın diye).
   Görseller, simgeler ve yazı tipleri önbellekten gelir, arka planda tazelenir.

   Firebase (Firestore/giriş) istekleri başka adrese gittiği için buraya karışmaz; onların internetsiz kopyasını
   Firestore'un kendi önbelleği tutar. Vaka kayıtları (Vakalarım) zaten yalnızca cihazın yerel deposundadır. */
var VERSION = 'odyobot-v16';
var ASSETS = [
  './',
  './index.html',
  './styles.css',
  './gorunum.js',
  './app.js',
  './odyo-hesap.js',
  './vakalarim.js',
  './cikti.js',
  './maskeleme-kural.js',
  './odybot.js',
  './firebase-config.js',
  './manifest.webmanifest',
  './vendor/firebase/firebase-app-compat.js',
  './vendor/firebase/firebase-auth-compat.js',
  './vendor/firebase/firebase-firestore-compat.js',
  './fonts/bricolage-latin.woff2',
  './fonts/bricolage-latin-ext.woff2',
  './fonts/plexsans-latin.woff2',
  './fonts/plexsans-latin-ext.woff2',
  './fonts/plexmono-latin-400.woff2',
  './fonts/plexmono-latin-500.woff2',
  './fonts/plexmono-latin-ext-400.woff2',
  './fonts/plexmono-latin-ext-500.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon-maskable-512.png',
  './icons/logo.png',
  './images/devices/bte.jpg',
  './images/devices/ric.jpg',
  './images/devices/ite-tam.jpg',
  './images/devices/ite-yarim.jpg',
  './images/devices/itc.jpg',
  './images/devices/cic.jpg',
  './images/devices/iic.jpg',
  './images/devices/kemik-bant.jpg',
  './images/devices/ki.jpg',
  './images/devices/ki-elektrot.jpg',
  './images/devices/eas.jpg',
  './images/devices/baha-perkutan.jpg',
  './images/devices/transkutan-pasif.jpg',
  './images/devices/orta-kulak-yarim.jpg',
  './images/devices/orta-kulak-tam.jpg',
  './images/devices/abi-penetran.jpg'
];

self.addEventListener('install', function (e) {
  // cache: 'reload' → tarayıcının kendi kısa süreli önbelleğini atla, dosyaları sunucudan taze al.
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(ASSETS.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Sayfanın kendisi: önce internet (güncel sürüm), yoksa kayıtlı kopya.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put('./index.html', copy); }); }
      return res;
    }).catch(function () {
      return caches.match('./index.html');
    }));
    return;
  }

  // Kod ve görünüm dosyaları (css, js, manifest): sayfayla aynı sürümde olmalı, bu yüzden önce internet.
  // Yoksa kayıtlı kopya. Böylece yeni sayfa eski kodla karışmaz. (vendor/ büyük ve sabit; önbellekten gelir.)
  var path = new URL(req.url).pathname;
  if (/\.(css|js|webmanifest)$/.test(path) && path.indexOf('/vendor/') === -1) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req);
    }));
    return;
  }

  // Diğer dosyalar (görseller, simgeler, yazı tipleri, vendor): önce kayıtlı kopya (hızlı açılış), arka planda tazele.
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(req).then(function (cached) {
      var net = fetch(req).then(function (res) {
        if (res.ok) c.put(req, res.clone());
        return res;
      }).catch(function () { return cached; });
      return cached || net;
    });
  }));
});
