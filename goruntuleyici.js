/* Tam ekran görsel görüntüleyici (kütüphanesiz).
   Kullanım: Goruntuleyici.ac({ src, alt, baslik, geri })  — geri: kapanınca odağın döneceği öğe.
   - İki parmakla büyütme/küçültme, tek parmakla (büyükken) sürükleme, çift dokunuşla yakınlaştırma/geri alma.
   - Bilgisayarda: fare tekerleği ile büyütme, sürükleme, çift tıklama; + / - / 0 tuşları.
   - Kapatma: ✕ düğmesi, Esc tuşu, telefonun geri tuşu (tarayıcı geçmişine bir adım eklenir).
   - Ekran okuyucu: role="dialog", aria-modal; odak açılınca ✕ düğmesine gider, kapanınca karta döner.
   Renkler styles.css içindeki --gor-* değişkenlerinden gelir. */
(function () {
  'use strict';
  var EN_FAZLA = 5, CIFT_DOKUNUS_MS = 300, CIFT_OLCEK = 2.5;
  var kok, alan, resim, kapatBtn, baslikEl, ipucu;
  var acik = false, gecmisVar = false, geriOdak = null;
  var s = 1, x = 0, y = 0;                 // ölçek ve kayma (piksel, alanın ortasına göre)
  var parmak = {};                         // etkin dokunuşlar: id -> {x, y}
  var jest = null;                         // sürükleme ya da iki parmak başlangıcı
  var sonDokunus = { t: 0, x: 0, y: 0 }, tasindi = false, sonDokunmatik = 0;

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function kur() {
    if (kok) return;
    kok = el('div', 'gor', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'gor-baslik', hidden: '' });
    var ust = el('div', 'gor-ust');
    baslikEl = el('h2', 'gor-baslik', { id: 'gor-baslik' });
    kapatBtn = el('button', 'iconbtn gor-kapat', { type: 'button', 'aria-label': 'Kapat' });
    kapatBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    ust.appendChild(baslikEl); ust.appendChild(kapatBtn);
    alan = el('div', 'gor-alan');
    resim = el('img', 'gor-resim', { draggable: 'false' });
    alan.appendChild(resim);
    ipucu = el('p', 'gor-ipucu');
    ipucu.textContent = 'İki parmakla büyüt, çift dokunla yakınlaştır.';
    kok.appendChild(ust); kok.appendChild(alan); kok.appendChild(ipucu);
    document.body.appendChild(kok);

    kapatBtn.addEventListener('click', function () { kapat(); });
    document.addEventListener('keydown', function (e) { if (acik) tus(e); });   // dokunduktan sonra odak gövdeye geçse de Esc çalışsın
    alan.addEventListener('pointerdown', basla);
    alan.addEventListener('pointermove', hareket);
    alan.addEventListener('pointerup', bitir);
    alan.addEventListener('pointercancel', bitir);
    alan.addEventListener('wheel', teker, { passive: false });
    // Fareyle çift tıklama. Dokunmatik ekranda tarayıcı da dblclick üretir; onu yok say (çift dokunuş aşağıda ayrıca işleniyor).
    alan.addEventListener('dblclick', function (e) { if (Date.now() - sonDokunmatik > 1000) ciftDokunus(e.clientX, e.clientY); });
    window.addEventListener('popstate', function () { if (acik) { gecmisVar = false; kapatIc(); } });
    window.addEventListener('resize', function () { if (acik) { sinirla(); uygula(); } });
  }

  /* ---------- açma / kapama ---------- */
  function ac(o) {
    kur();
    geriOdak = o.geri || document.activeElement;
    resim.src = o.src; resim.alt = o.alt || '';
    baslikEl.textContent = o.baslik || '';
    s = 1; x = 0; y = 0; uygula();
    kok.hidden = false; acik = true;
    document.documentElement.classList.add('gor-acik');   // arka sayfa kaymasın
    try { history.pushState({ gor: 1 }, ''); gecmisVar = true; } catch (e) { gecmisVar = false; }
    kapatBtn.focus();
  }
  function kapat() {
    if (!acik) return;
    if (gecmisVar) { history.back(); return; }   // popstate -> kapatIc
    kapatIc();
  }
  function kapatIc() {
    acik = false; kok.hidden = true; parmak = {}; jest = null;
    document.documentElement.classList.remove('gor-acik');
    resim.removeAttribute('src');
    // Odak, görseli açan karta döner (tarayıcı geri gezinmesi bitince; yoksa odak kaybolabiliyor).
    var hedef = geriOdak;
    setTimeout(function () { if (hedef && hedef.focus && document.body.contains(hedef)) try { hedef.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }

  function tus(e) {
    if (e.key === 'Escape') { e.preventDefault(); kapat(); }
    else if (e.key === 'Tab') { e.preventDefault(); kapatBtn.focus(); }   // odak pencerede kalır (tek düğme)
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); olcekle(s * 1.4, 0, 0); }
    else if (e.key === '-') { e.preventDefault(); olcekle(s / 1.4, 0, 0); }
    else if (e.key === '0') { e.preventDefault(); s = 1; x = 0; y = 0; uygula(); }
  }

  /* ---------- dönüşüm ---------- */
  function uygula() {
    resim.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
    kok.classList.toggle('buyuk', s > 1.01);
  }
  // Görsel kenarı ekranın içine fazla kaçmasın.
  function sinirla() {
    if (s <= 1) { s = 1; x = 0; y = 0; return; }
    var a = alan.getBoundingClientRect();
    var w = resim.offsetWidth * s, h = resim.offsetHeight * s;
    var mx = Math.max(0, (w - a.width) / 2), my = Math.max(0, (h - a.height) / 2);
    x = Math.min(mx, Math.max(-mx, x)); y = Math.min(my, Math.max(-my, y));
  }
  // (px, py): alanın ortasına göre sabit kalacak nokta.
  function olcekle(yeni, px, py) {
    yeni = Math.min(EN_FAZLA, Math.max(1, yeni));
    x = px - (px - x) * (yeni / s); y = py - (py - y) * (yeni / s);
    s = yeni; sinirla(); uygula();
  }
  function merkezden(cx, cy) {
    var a = alan.getBoundingClientRect();
    return { x: cx - (a.left + a.width / 2), y: cy - (a.top + a.height / 2) };
  }
  function ciftDokunus(cx, cy) {
    var p = merkezden(cx, cy);
    if (s > 1.01) { s = 1; x = 0; y = 0; uygula(); } else olcekle(CIFT_OLCEK, p.x, p.y);
  }

  /* ---------- dokunma / fare ---------- */
  function idler() { return Object.keys(parmak); }
  function jestBaslat() {
    var k = idler();
    if (k.length >= 2) {
      var a = parmak[k[0]], b = parmak[k[1]];
      jest = { iki: true, d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: s, x: x, y: y, m: merkezden((a.x + b.x) / 2, (a.y + b.y) / 2) };
    } else if (k.length === 1) {
      var p = parmak[k[0]];
      jest = { iki: false, px: p.x, py: p.y, x: x, y: y };
    } else jest = null;
  }
  function basla(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { alan.setPointerCapture(e.pointerId); } catch (er) {}
    if (e.pointerType === 'touch') sonDokunmatik = Date.now();
    parmak[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (idler().length === 1) tasindi = false;
    jestBaslat();
  }
  function hareket(e) {
    if (!parmak[e.pointerId] || !jest) return;
    parmak[e.pointerId] = { x: e.clientX, y: e.clientY };
    var k = idler();
    if (jest.iki && k.length >= 2) {
      var a = parmak[k[0]], b = parmak[k[1]];
      var yeni = Math.min(EN_FAZLA, Math.max(1, jest.s * Math.hypot(a.x - b.x, a.y - b.y) / jest.d));
      var m = merkezden((a.x + b.x) / 2, (a.y + b.y) / 2);
      // başlangıç orta noktasının altındaki görsel noktası parmakların ortasında kalır
      x = m.x - (jest.m.x - jest.x) * (yeni / jest.s);
      y = m.y - (jest.m.y - jest.y) * (yeni / jest.s);
      s = yeni; tasindi = true;
      sinirla(); uygula();
    } else if (!jest.iki) {
      var dx = e.clientX - jest.px, dy = e.clientY - jest.py;
      if (Math.abs(dx) + Math.abs(dy) > 8) tasindi = true;
      if (s > 1) { x = jest.x + dx; y = jest.y + dy; sinirla(); uygula(); }
    }
  }
  function bitir(e) {
    if (!parmak[e.pointerId]) return;
    delete parmak[e.pointerId];
    var kalan = idler().length;
    if (kalan === 0 && e.type === 'pointerup' && e.pointerType === 'touch' && !tasindi) {
      var t = Date.now();
      if (t - sonDokunus.t < CIFT_DOKUNUS_MS && Math.hypot(e.clientX - sonDokunus.x, e.clientY - sonDokunus.y) < 40) {
        ciftDokunus(e.clientX, e.clientY); sonDokunus.t = 0;
      } else sonDokunus = { t: t, x: e.clientX, y: e.clientY };
    }
    jestBaslat();   // iki parmaktan biri kalkınca kalan parmakla sürükleme sürer
  }
  function teker(e) {
    e.preventDefault();
    var p = merkezden(e.clientX, e.clientY);
    olcekle(s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), p.x, p.y);
  }

  window.Goruntuleyici = { ac: ac, kapat: kapat };
})();
