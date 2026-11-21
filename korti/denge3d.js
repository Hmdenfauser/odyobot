/* Denge sistemi 3D modeli (#3d/denge, 2026-11-21): hareketsiz yapılar.
   - Görüntüleyici korti/korti.js (Korti.goruntuleyici). Labirent parçaları gorsel3d/periferik.json + .bin'den okunur
     (3D kulak modeliyle aynı dosya; servis çalışanı önbelleğinden gelir). Makulalar seslab/denge.js → SesLabDenge.makulalar
     ile üretilir; kayma ya da hareket uygulanmaz.
   - Labirent (vestibül + kanallar) tek saydamlıkla (LABIRENT_A) çizilir, makulalar içinde görünür.
   Kullanım: Denge3D.kur(kok, { veri, kartEki }) → { yenile }. */
(function () {
  'use strict';
  var LABIRENT = ['vest', 'ant', 'post', 'lat', 'crus', 'amp'], LABIRENT_A = 0.68, YOL = 'gorsel3d/';

  function modelIndir() {
    var meta;
    return window.fetch(YOL + 'periferik.json').then(function (r) { if (!r.ok) throw new Error('json'); return r.json(); })
      .then(function (m) { meta = m; return window.fetch(YOL + 'periferik.bin'); })
      .then(function (r) { if (!r.ok) throw new Error('bin'); return r.arrayBuffer(); })
      .then(function (buf) {
        if (meta.bayt && buf.byteLength !== meta.bayt) throw new Error('boyut');
        var k = meta.scale / 32767, PART = {}, M = {};
        meta.parts.forEach(function (m) {
          if (LABIRENT.indexOf(m.id) < 0) return;
          var q = new Int16Array(buf, m.off, m.nv * 3), no = new Int8Array(buf, m.off + m.nv * 6, m.nv * 3);
          var I = new Uint16Array(buf.slice(m.off + m.nv * 9 + (m.nv % 2), m.off + m.nv * 9 + (m.nv % 2) + m.nf * 6));
          var P = new Float32Array(m.nv * 3), N = new Float32Array(m.nv * 3);
          for (var j = 0; j < m.nv * 3; j++) { P[j] = q[j] * k; N[j] = no[j] / 127; }
          PART[m.id] = { P: P };
          M[m.id] = { P: P, N: N, I: I, saydam: LABIRENT_A };
        });
        var DS = window.SesLabDenge;
        if (DS && PART.vest) {
          var MAK = DS.makulalar(PART);
          ['utr', 'sak'].forEach(function (a) {
            M[a + '_ep'] = { P: MAK[a].epitel.P, N: MAK[a].epitel.N, I: MAK[a].epitel.I, grup: a };
            M[a + '_tuy'] = { P: MAK[a].tuy.P, N: MAK[a].tuy.N, I: MAK[a].tuy.I, grup: a };
            M[a + '_zar'] = { P: MAK[a].zar.P, N: MAK[a].zar.N, I: MAK[a].zar.I, grup: 'otolit' };
          });
        }
        return M;
      });
  }

  function renk(id) {
    var m = /^(utr|sak)_(ep|tuy|zar)$/.exec(id);
    if (m) return '--kt-mak-' + m[2];
    return '--g3d-' + id;
  }
  function nokta(id) { return id === 'utr' || id === 'sak' ? '--kt-mak-ep' : id === 'otolit' ? '--kt-mak-zar' : '--g3d-' + id; }

  function kur(kok, ayar) {
    var K = window.Korti;
    // Hastanın sağından bakış (ekranın sağı = hastanın önü, yukarısı = yukarı); biraz yukarıdan ve önden
    var KAM = [0, 0, 1, 0, 1, 0, -1, 0, 0];
    return K.goruntuleyici(kok, { veri: ayar.veri, kartEki: ayar.kartEki, sinif: 'kt-denge', model: modelIndir, renk: renk, nokta: nokta,
      basR: K.mul(K.mul(K.rx(K.D(12)), K.ry(K.D(-18))), KAM), yaklasEnAz: 1.2 });
  }

  window.Denge3D = { kur: kur };
})();
