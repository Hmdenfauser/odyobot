(function () {
  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-'); if (p.length !== 3) return iso;
    try { return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return iso; }
  }
  function safeLink(u) { return typeof u === 'string' && /^https:\/\/[^\s]+$/i.test(u) ? u : ''; }
  // vakalarim.js ve akis.js de kullanır. db/yonetici bağlantı kurulunca doldurulur.
  window.OdyoUI = { h: h, $: $, todayISO: todayISO, fmtDate: fmtDate, safeLink: safeLink, db: null, dbYok: false, yonetici: false };

  /* ---------- düzenlenebilir içerik (yönetici) ----------
     Koddaki her metin varsayılandır. Yönetici bir metni değiştirince yalnızca farklı alanlar
     Firestore'da icerik/{anahtar} -> { alanlar: { alan: metin }, guncelleme } olarak saklanır.
     "Varsayılana dön" bu kaydı siler. Yeni içerik eklerken: nesneye editable(...) uygula, ekranda
     düzenleme kutusu için editBox(...) kullan (CLAUDE.md §9). */
  var overrides = {}, editingKey = null;
  function editable(obj, fields) {        // varsayılanları sakla
    obj._def = {}; fields.forEach(function (f) { obj._def[f] = obj[f]; });
  }
  function applyOv(key, obj) {           // varsayılan + yöneticinin değişikliği
    var o = overrides[key] || {};
    Object.keys(obj._def).forEach(function (f) {
      var d = obj._def[f], v = o[f];
      if (typeof v !== 'string' || !v.trim()) { obj[f] = d; return; }
      obj[f] = Array.isArray(d) ? v.split('\n').map(function (x) { return x.trim(); }).filter(Boolean) : v.trim();
    });
  }
  function asText(v) { return Array.isArray(v) ? v.join('\n') : (v || ''); }
  // Düzenleme kutusu. fields: [{ f: alan, ad: etiket, cok: çok satırlı mı }]
  function editBox(key, obj, fields, extra) {
    var box = h('div', { 'class': 'editbox' }), inputs = {};
    fields.forEach(function (x) {
      var id = 'ed-' + key.replace(/[^a-z0-9]/gi, '-') + '-' + x.f;
      var el = h(x.cok ? 'textarea' : 'input', { id: id, maxlength: '4000' });
      if (!x.cok) el.setAttribute('type', 'text');
      el.value = asText(obj[x.f]);
      inputs[x.f] = el;
      box.appendChild(h('div', { 'class': 'fld' }, [h('label', { 'for': id, text: x.ad }), el]));
    });
    if (extra) box.appendChild(extra.node);
    var save = h('button', { 'class': 'btn primary', type: 'button', text: 'Kaydet' });
    var reset = h('button', { 'class': 'btn', type: 'button', text: 'Varsayılana dön' });
    var cancel = h('button', { 'class': 'btn', type: 'button', text: 'Vazgeç' });
    var msg = h('div', { 'class': 'msg', role: 'status' });
    function done() { editingKey = null; refreshContent(); }
    function fail() { msg.textContent = 'Kaydedilemedi. Düzenleme yetkin olmayabilir ya da bağlantı yok.'; msg.className = 'msg err'; save.disabled = reset.disabled = false; }
    cancel.addEventListener('click', done);
    reset.addEventListener('click', function () {
      if (!dbRef) return fail();
      save.disabled = reset.disabled = true;
      Promise.all([dbRef.collection('icerik').doc(key).delete()].concat(extra && extra.reset ? [extra.reset()] : [])).then(done, fail);
    });
    save.addEventListener('click', function () {
      if (!dbRef) return fail();
      var alanlar = {};
      fields.forEach(function (x) {
        var v = inputs[x.f].value.trim();
        if (v && v !== asText(obj._def[x.f]).trim()) alanlar[x.f] = v;
      });
      var ref = dbRef.collection('icerik').doc(key);
      save.disabled = reset.disabled = true;
      Promise.all([Object.keys(alanlar).length ? ref.set({ alanlar: alanlar, guncelleme: Date.now() }) : ref.delete()]
        .concat(extra && extra.save ? [extra.save()] : [])).then(done, fail);
    });
    box.appendChild(h('div', { 'class': 'admin-bar' }, [save, reset, cancel]));
    box.appendChild(msg);
    setTimeout(function () { var first = box.querySelector('input,textarea'); if (first) first.focus(); }, 0);
    return box;
  }
  function fill(el, kids) { el.replaceChildren.apply(el, kids.filter(Boolean)); }
  // Yönetici için: düzenleniyorsa kutu, değilse "Düzenle" düğmesi; normal kullanıcıya hiçbir şey.
  function adminPart(key, obj, fields, label, extra) {
    if (!canEdit) return null;
    return editingKey === key ? editBox(key, obj, fields, extra) : h('div', { 'class': 'admin-bar' }, [editBtn(key, label)]);
  }
  function editBtn(key, label) {
    var b = h('button', { 'class': 'linkbtn', type: 'button', text: label || 'Düzenle' });
    b.addEventListener('click', function () { editingKey = key; refreshContent(); });
    return b;
  }

  /* ---------- clock ---------- */
  function tick() {
    var d = new Date(), t;
    try { t = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { t = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
    if ($('clock').textContent !== t) $('clock').textContent = t;
    var ds;
    try { ds = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { ds = ''; }
    if ($('date').textContent !== ds) $('date').textContent = ds;
  }
  tick(); setInterval(tick, 1000);

  /* ---------- pathway diagram ---------- */
  var NODES = [
    { id: 'koklea', label: 'Koklea', latin: 'Cochlea', abr: 'Yok (OAE ve koklear mikrofonik burada üretilir)',
      yer: 'İç kulak, temporal kemik içinde.',
      islev: 'Mekanik titreşimi iç ve dış tüy hücreleri aracılığıyla elektriksel sinyale çevirir. Tonotopik yapıdadır: taban yüksek, apeks düşük frekanslara yanıt verir.',
      klinik: 'Sensörinöral işitme kaybının en sık yeri. Dış tüy hücre işlevi otoakustik emisyonlarla (OAE) değerlendirilir.' },
    { id: 'n8', label: 'Koklear sinir (VIII)', latin: 'N. cochlearis', abr: 'Dalga I (distal) ve II (proksimal)',
      yer: 'Spiral ganglion hücre gövdelerinden çıkar, internal akustik kanaldan geçerek beyin sapına girer.',
      islev: 'İç tüy hücrelerinden gelen bilgiyi koklear çekirdeğe taşır. Tonotopi sinir boyunca korunur.',
      klinik: 'Retrokoklear patolojide (örneğin vestibüler schwannom) ABR’de I–V aralığında uzama görülebilir. Nöropati spektrumunda OAE var, ABR yok ya da bozuktur.' },
    { id: 'cn', label: 'Koklear çekirdek', latin: 'Nucleus cochlearis', abr: 'Dalga III (genellikle)',
      yer: 'Beyin sapı, pontomedüller bileşke. Dorsal ve ventral bölümleri vardır.',
      islev: 'İşitsel sinir liflerinin ilk sinaps yeri ve aynı taraflı bir işlem istasyonudur. Buradan çıkan lifler büyük oranda karşı tarafa geçer.',
      klinik: 'Bu düzeydeki lezyonlar ABR’de III. dalga ve sonrasını etkiler.' },
    { id: 'striya', label: 'Akustik striyalar', bolge: 'Medulla – pons', latin: 'Striae acusticae', abr: 'Ayrı bir dalga karşılığı yok',
      yer: 'Koklear çekirdekten çıkıp beyin sapında karşı tarafa geçen lif demetleri.',
      islev: 'Dorsal striya dorsal koklear çekirdekten çıkar ve karşı taraftaki lateral lemniskus yoluyla inferior kolikulusa ulaşır. Ara striya posteroventral koklear çekirdekten çıkar. Ventral striya (trapezoid cisim) anteroventral koklear çekirdekten çıkar ve iki taraftaki süperior olivar komplekse gider.',
      klinik: 'Liflerin çoğu karşı tarafa geçtiği için koklear çekirdeğin üstündeki tek taraflı lezyonlar genellikle saf ses eşiğini bozmaz. Striyaların ayrıntılı hedefleri kaynaklara göre farklı anlatılır.' },
    { id: 'soc', label: 'Süperior olivar kompleks', latin: 'Complexus olivaris superior', abr: 'Dalga III–IV (yaklaşık)',
      yer: 'Pons, trapezoid cisim düzeyi.',
      islev: 'İki kulaktan gelen bilgiyi ilk kez birleştirir. Zaman farkı (ITD) ve şiddet farkı (ILD) işlenmesiyle yön bulmanın temelini oluşturur. Akustik refleks arkının da parçasıdır.',
      klinik: 'Bilateral temsil nedeniyle tek taraflı lezyonlar belirgin bir saf ses eşik kaybı vermeyebilir, ancak lokalizasyon ve gürültüde dinleme zorlaşabilir.' },
    { id: 'll', label: 'Lateral lemniskus', latin: 'Lemniscus lateralis', abr: 'Dalga IV–V (yaklaşık)',
      yer: 'Pons ve orta beyin arasında yükselen lif demeti ve çekirdekleri.',
      islev: 'Koklear çekirdek ve süperior olivar kompleksten gelen lifleri inferior kolikulusa taşır.',
      klinik: 'ABR’de IV ve V. dalga bileşkesi bu bölgeyle ilişkilendirilir.' },
    { id: 'ic', label: 'İnferior kolikulus', latin: 'Colliculus inferior', abr: 'Dalga V (yaklaşık)',
      yer: 'Orta beyin, tektum.',
      islev: 'Çıkan yolakların neredeyse tamamının birleştiği merkezi bir istasyondur. Frekans, şiddet ve zaman bilgisini bütünleştirir.',
      klinik: 'ABR’nin en dayanıklı dalgası olan V. dalga eşik tayininde kullanılır; kaynağı IC ve lateral lemniskus bölgesi olarak kabul edilir.' },
    { id: 'mgb', label: 'Medial genikulat cisim', latin: 'Corpus geniculatum mediale', abr: 'Klasik ABR dışı',
      yer: 'Talamus.',
      islev: 'Duyusal bilginin kortekse son aktarım istasyonudur. Dikkat ve geri bildirim döngüleriyle de bağlantılıdır.',
      klinik: 'Talamik lezyonlar nadirdir. Orta ve geç latanslı yanıtlar bu düzeyin üstüne ait olabilir.' },
    { id: 'cortex', label: 'İşitsel korteks', latin: 'Cortex auditivus', abr: 'Kortikal yanıtlar (CAEP: P1–N1–P2)',
      yer: 'Temporal lob, Heschl girusu (primer alan, Brodmann 41 ve 42).',
      islev: 'Sesin algılanması, ayrımı ve anlamlandırılması. Primer alanda tonotopi sürer.',
      klinik: 'Yolak iki taraflı olduğundan tek taraflı kortikal lezyon çoğu zaman eşikleri normal bırakır. Dikotik testlerde karşı kulakta zorluk görülebilir (santral işitsel işlem değerlendirmesi).' }
  ];
  // Beyin bölgesi etiketleri (kutuda adın altında). MGB talamusa aittir.
  var BOLGE = { koklea: 'İç kulak', n8: 'İç kulak yolu', cn: 'Medulla (pontomedüller)', soc: 'Pons', ll: 'Pons',
    ic: 'Orta beyin', mgb: 'Talamus', cortex: 'Temporal lob' };
  var YOLAK_ALAN = [{ f: 'label', ad: 'Ad' }, { f: 'bolge', ad: 'Beyin bölgesi' }, { f: 'latin', ad: 'Latince' },
    { f: 'abr', ad: 'ABR karşılığı' }, { f: 'yer', ad: 'Konum', cok: true }, { f: 'islev', ad: 'İşlev', cok: true }, { f: 'klinik', ad: 'Klinik not', cok: true }];
  NODES.forEach(function (n, i) {
    n.y = 570 - i * 65; if (!n.bolge) n.bolge = BOLGE[n.id];
    editable(n, YOLAK_ALAN.map(function (x) { return x.f; }));
  });
  var XL = 45, XR = 315, CX = 180, sel = 'soc';
  var svg = $('pathway'), NS = 'http://www.w3.org/2000/svg';
  function se(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  var byId = {}; NODES.forEach(function (n) { byId[n.id] = n; });
  function straight(a, b) {
    se('line', { x1: XL, y1: byId[a].y, x2: XL, y2: byId[b].y, 'class': 'lnk r' }, svg);
    se('line', { x1: XR, y1: byId[a].y, x2: XR, y2: byId[b].y, 'class': 'lnk l' }, svg);
  }
  // Karşıya geçişler (kesik gri): her biri iki yönde çizilir.
  function cross(a, b) {
    se('line', { x1: XL, y1: byId[a].y, x2: XR, y2: byId[b].y, 'class': 'lnk x' }, svg);
    se('line', { x1: XR, y1: byId[a].y, x2: XL, y2: byId[b].y, 'class': 'lnk x' }, svg);
  }
  cross('cn', 'soc');  // ventral striya (trapezoid cisim) → karşı SOC
  cross('cn', 'll');   // dorsal ve ara striya → karşı lateral lemniskus
  cross('soc', 'll');  // SOC → karşı lateral lemniskus
  straight('koklea', 'n8'); straight('n8', 'cn'); straight('cn', 'striya'); straight('striya', 'soc');
  straight('soc', 'll'); straight('ll', 'ic'); straight('ic', 'mgb'); straight('mgb', 'cortex');
  se('text', { x: XL, y: 14, 'class': 'side-label', 'text-anchor': 'middle' }, svg).textContent = 'SAĞ';
  se('text', { x: XR, y: 14, 'class': 'side-label', 'text-anchor': 'middle' }, svg).textContent = 'SOL';
  var groups = {};
  NODES.forEach(function (n, i) {
    var g = se('g', { 'class': 'node', tabindex: '0', role: 'button', 'aria-label': n.label + ', basamak ' + (i + 1) + '/' + NODES.length }, svg);
    se('circle', { cx: XL, cy: n.y, r: 14, 'class': 'c r' }, g);
    se('circle', { cx: XR, cy: n.y, r: 14, 'class': 'c l' }, g);
    se('rect', { x: CX - 88, y: n.y - 22, width: 176, height: 44, rx: 8, 'class': 'pill' }, g);
    n._t = se('text', { x: CX, y: n.y - 7 }, g); n._t.textContent = n.label;
    n._r = se('text', { x: CX, y: n.y + 10, 'class': 'reg' }, g); n._r.textContent = n.bolge;
    n._g = g;
    g.addEventListener('click', function () { select(n.id); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(n.id); } });
    groups[n.id] = g;
  });
  var detail = $('detail');
  function dlRow(label, text) { return h('div', null, [h('dt', { text: label }), h('dd', { text: text })]); }
  function select(id) {
    sel = id;
    var idx = NODES.findIndex(function (n) { return n.id === id; });
    var n = NODES[idx];
    NODES.forEach(function (m) { groups[m.id].classList.toggle('sel', m.id === id); });
    var prev = h('button', { 'class': 'btn', type: 'button', text: '← Aşağı' });
    var next = h('button', { 'class': 'btn', type: 'button', text: 'Yukarı →' });
    if (idx === 0) prev.disabled = true;
    if (idx === NODES.length - 1) next.disabled = true;
    prev.addEventListener('click', function () { select(NODES[idx - 1].id); });
    next.addEventListener('click', function () { select(NODES[idx + 1].id); });
    var key = 'yolak.' + n.id;
    fill(detail, [
      h('div', { 'class': 'card-head' }, [h('h2', { text: n.label }), h('span', { 'class': 'latin', text: n.latin })]),
      h('span', { 'class': 'badge', text: 'ABR: ' + n.abr }),
      h('dl', null, [dlRow('Konum', n.yer), dlRow('İşlev', n.islev), dlRow('Klinik not', n.klinik)]),
      h('div', { 'class': 'stepper' }, [prev, h('span', { 'class': 'pos', text: 'Basamak ' + (idx + 1) + ' / ' + NODES.length }), next]),
      adminPart(key, n, YOLAK_ALAN, 'Bu basamağı düzenle')
    ]);
  }
  function refreshPathway() {
    NODES.forEach(function (n, i) {
      applyOv('yolak.' + n.id, n);
      n._t.textContent = n.label; n._r.textContent = n.bolge;
      n._g.setAttribute('aria-label', n.label + ', basamak ' + (i + 1) + '/' + NODES.length);
    });
    select(sel);
  }
  select(sel);

  /* ---------- reflex arc diagram ----------
     Simetrik şema: sol yarı SAĞ kulak, sağ yarı SOL kulak (ayna).
     Renk uyarılan kulağı gösterir (sağ kırmızı, sol mavi). Düz çizgi kontralateral, noktalı çizgi ipsilateral yol.
     Bu çizgi dili yalnızca refleks şemasına özgüdür (proje sahibinin kararı, 2026-11-09). */
  var RNODES = [
    { id: 'dis', col: 'aff', y: 470, label: ['Dış kulak'], kol: 'Afferent kol', title: 'Dış kulak', latin: 'Auris externa',
      yer: 'Kulak kepçesi ve dış kulak yolu. Uyaran ve ölçüm probu dış kulak yoluna yerleştirilir.',
      islev: 'Uyaranı kulak zarına iletir. Ölçüm için prob dış kulak yolunu hava geçirmez biçimde kapatmalıdır.',
      klinik: 'Buşon, kanal kollapsı ya da probun kanal duvarına dayanması ölçümü bozabilir; test öncesi otoskopi yapılır.' },
    { id: 'orta', col: 'aff', y: 390, label: ['Orta kulak'], kol: 'İletim ve efektör', title: 'Orta kulak ve stapedius kası', latin: 'Auris media, m. stapedius',
      yer: 'Kulak zarı, kemikçik zinciri ve stapes boynuna tutunan stapedius kası.',
      islev: 'Afferent kolda sesi kokleaya iletir. Refleksin sonunda stapedius kası kasılır, kemikçik zinciri sertleşir ve kulağın akustik admitansı değişir. Test bu değişimi prob kulağında ölçer.',
      klinik: 'Uyaran kulağındaki iletim kaybı kokleaya ulaşan sesi azaltır; refleks yüksek eşikte çıkabilir ya da alınamayabilir. Prob kulağında orta kulak patolojisi (efüzyon, otoskleroz vb.) varsa kas kasılsa bile admitans değişimi algılanamaz ve o kulakta refleks alınamaz.' },
    { id: 'koklea', col: 'aff', y: 310, label: ['Koklea'], kol: 'Afferent kol', title: 'Koklea', latin: 'Cochlea',
      yer: 'İç kulak; uyarılan kulak.',
      islev: 'Yeterince şiddetli ses (saf seste genellikle yaklaşık 70–100 dB HL arası) tüy hücrelerinde işlenir ve refleksin duyusal kolunu başlatır.',
      klinik: 'Koklear kayıpta refleks eşiği çoğu zaman saf ses eşiğine göre daha dar bir duyum düzeyinde (SL) ortaya çıkar; bu bulgu rekrutmanla ilişkilendirilir. Ağır kayıplarda refleks alınamayabilir.' },
    { id: 'n8', col: 'aff', y: 230, label: ['8. sinir'], kol: 'Afferent kol', title: '8. sinir (koklear dal)', latin: 'N. cochlearis',
      yer: 'Spiral gangliondan çıkar, internal akustik kanaldan beyin sapına girer.',
      islev: 'Uyaran bilgisini beyin sapındaki ventral koklear çekirdeğe taşır.',
      klinik: '8. sinir veya retrokoklear lezyonda uyaran bu kulaktan verildiğinde ipsilateral ve kontralateral refleksler alınamayabilir ya da yüksek eşikte çıkabilir; refleks decay anormal olabilir.' },
    { id: 'kn', col: 'aff', y: 150, label: ['Koklear', 'nükleus'], kol: 'Beyin sapı', title: 'Koklear nükleus (ventral)', latin: 'Nucleus cochlearis ventralis',
      yer: 'Pontomedüller bileşke.',
      islev: 'Refleksin ilk sinaps yeri. Buradan çıkan lifler aynı taraftaki ve karşı taraftaki süperior olivar komplekse ilerler.',
      klinik: 'Beyin sapı lezyonlarında ipsilateral ve kontralateral refleks bulgularının karşılaştırılması lezyon düzeyi için ipucu verir.' },
    { id: 'soc', col: 'soc', y: 60, label: ['Süperior olivar', 'kompleks'], kol: 'Beyin sapı', title: 'Süperior olivar kompleks', latin: 'Complexus olivaris superior',
      yer: 'Pons; medial süperior olivar bölge ve trapezoid cisim çevresi.',
      islev: 'İki taraflı bağlantının kurulduğu düğüm. Kontralateral yolun karşıya geçişi bu düzeyde gösterilir. Sinyal buradan fasiyal motor çekirdeğe iletilir.',
      klinik: 'Pontin lezyonlar kontralateral refleksi ipsilateral refleksten daha belirgin bozabilir; yorum tüm refleks bulgularıyla birlikte yapılır.' },
    { id: 'n7', col: 'eff', y: 230, label: ['7. sinir'], kol: 'Efferent kol', title: '7. sinir (stapedius dalı)', latin: 'N. facialis, n. stapedius',
      yer: 'Motor çekirdeği ponstadır. Sinir temporal kemik içinde fasiyal kanalda seyreder ve stapedius dalını verir.',
      islev: 'Süperior olivar kompleksten gelen sinyal fasiyal motor çekirdeğe ulaşır. Motor komut 7. sinirin stapedius dalıyla orta kulaktaki stapedius kasına taşınır.',
      klinik: 'Stapedius dalının proksimalinde fasiyal sinir lezyonu varsa (örneğin Bell paralizisi veya temporal kemik patolojisi), prob lezyonlu kulaktayken uyaran hangi kulaktan verilirse verilsin refleks alınamaz. Pontin lezyonlar refleksi ve yüz sinirinin işlevini birlikte etkileyebilir.' }
  ];
  var RCOL = { aff: { x: 58, w: 100 }, soc: { x: 100, w: 120 }, eff: { x: 146, w: 56 } };
  var rsvg = $('reflex'), rsel = 'soc', rgroups = {};
  function mx(x, s) { return s === 'r' ? x : 360 - x; }  // sol kulak tarafı aynalanır
  var defs = se('defs', {}, rsvg);
  ['r', 'l'].forEach(function (s) {
    var m = se('marker', { id: 'ah-' + s, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '3.4', markerHeight: '3.4', orient: 'auto' }, defs);
    se('path', { d: 'M0,0 L10,5 L0,10 z', 'class': 'ah ' + s }, m);
  });
  // Çizgi: s = renk ('r' sağ uyaran, 'l' sol uyaran), ip = noktalı (ipsilateral). pts koordinatları sol yarıya göre, side ile aynalanır.
  function rpath(side, pts, s, ip) {
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + mx(p[0], side) + ',' + p[1]; }).join(' ');
    se('path', { d: d, 'class': 'lnk ' + s + (ip ? ' ip' : ''), 'marker-end': 'url(#ah-' + s + ')' }, rsvg);
  }
  var aff = RNODES.filter(function (n) { return n.col === 'aff'; });  // alttan üste
  ['r', 'l'].forEach(function (side) {
    var own = side, other = side === 'r' ? 'l' : 'r';
    // Afferent kol: her basamak arası iki çizgi (düz = kontralateral, noktalı = ipsilateral), uyarılan kulağın renginde.
    for (var i = 0; i < aff.length; i++) {
      var y1 = aff[i].y - 22, y2 = i + 1 < aff.length ? aff[i + 1].y + 22 : 60 + 22;
      rpath(side, [[52, y1], [52, y2 + 2]], own, false);
      rpath(side, [[64, y1], [64, y2 + 2]], own, true);
    }
    // Efferent kol: SOC → 7. sinir → orta kulak. İç çizgi bu kulağın ipsilateral yolu, dış çizgi karşı kulağın kontralateral yolu.
    rpath(side, [[145, 82], [145, 208 + 2]], own, true);
    rpath(side, [[155, 82], [155, 208 + 2]], other, false);
    rpath(side, [[145, 252], [145, 385], [108 + 2, 385]], own, true);
    rpath(side, [[155, 252], [155, 395], [108 + 2, 395]], other, false);
  });
  // Karşıya geçiş: sağ SOC → sol SOC (kırmızı), sol SOC → sağ SOC (mavi).
  rpath('r', [[160, 52], [200 + 2, 52]], 'r', false);
  rpath('r', [[200, 68], [160 - 2, 68]], 'l', false);
  se('text', { x: 58, y: 16, 'class': 'side-label', 'text-anchor': 'middle' }, rsvg).textContent = 'SAĞ';
  se('text', { x: 302, y: 16, 'class': 'side-label', 'text-anchor': 'middle' }, rsvg).textContent = 'SOL';
  var REFLEKS_ALAN = [{ f: 'title', ad: 'Başlık' }, { f: 'label', ad: 'Şemadaki ad (en çok 2 satır)', cok: true }, { f: 'latin', ad: 'Latince' },
    { f: 'kol', ad: 'Rozet' }, { f: 'yer', ad: 'Konum', cok: true }, { f: 'islev', ad: 'İşlev', cok: true }, { f: 'klinik', ad: 'Klinik not', cok: true }];
  function rlabel(t, lines, x, y) {
    t.replaceChildren();
    lines = lines.slice(0, 2);
    if (lines.length === 1) { t.textContent = lines[0]; return; }
    se('tspan', { x: x, y: y - 8 }, t).textContent = lines[0];
    se('tspan', { x: x, y: y + 8 }, t).textContent = lines[1];
  }
  RNODES.forEach(function (n, idx) {
    editable(n, REFLEKS_ALAN.map(function (x) { return x.f; }));
    var g = se('g', { 'class': 'node', tabindex: '0', role: 'button', 'aria-label': n.title + ', basamak ' + (idx + 1) + '/' + RNODES.length }, rsvg);
    n._ts = [];
    ['r', 'l'].forEach(function (side) {
      var c = RCOL[n.col], x = mx(c.x, side), y = n.y;
      se('rect', { x: x - c.w / 2, y: y - 22, width: c.w, height: 44, rx: 8, 'class': 'pill' }, g);
      var t = se('text', { x: x, y: y }, g);
      rlabel(t, n.label, x, y);
      n._ts.push({ t: t, x: x, y: y });
    });
    n._g = g;
    g.addEventListener('click', function () { rselect(n.id); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rselect(n.id); } });
    rgroups[n.id] = g;
  });
  var rdetail = $('detail-r');
  function rselect(id) {
    rsel = id;
    var idx = RNODES.findIndex(function (n) { return n.id === id; });
    var n = RNODES[idx];
    RNODES.forEach(function (m) { rgroups[m.id].classList.toggle('sel', m.id === id); });
    var prev = h('button', { 'class': 'btn', type: 'button', text: '← Önceki' });
    var next = h('button', { 'class': 'btn', type: 'button', text: 'Sonraki →' });
    if (idx === 0) prev.disabled = true;
    if (idx === RNODES.length - 1) next.disabled = true;
    prev.addEventListener('click', function () { rselect(RNODES[idx - 1].id); });
    next.addEventListener('click', function () { rselect(RNODES[idx + 1].id); });
    var key = 'refleks.' + n.id;
    fill(rdetail, [
      h('div', { 'class': 'card-head' }, [h('h2', { text: n.title }), h('span', { 'class': 'latin', text: n.latin })]),
      h('span', { 'class': 'badge', text: n.kol }),
      h('dl', null, [dlRow('Konum', n.yer), dlRow('İşlev', n.islev), dlRow('Klinik not', n.klinik)]),
      h('div', { 'class': 'stepper' }, [prev, h('span', { 'class': 'pos', text: 'Basamak ' + (idx + 1) + ' / ' + RNODES.length }), next]),
      adminPart(key, n, REFLEKS_ALAN, 'Bu basamağı düzenle')
    ]);
  }
  function refreshReflex() {
    RNODES.forEach(function (n, i) {
      applyOv('refleks.' + n.id, n);
      n._ts.forEach(function (o) { rlabel(o.t, n.label, o.x, o.y); });
      n._g.setAttribute('aria-label', n.title + ', basamak ' + (i + 1) + '/' + RNODES.length);
    });
    rselect(rsel);
  }
  rselect(rsel);

  /* ---------- yenidoğan işitme taraması: iki akış şeması ----------
     T.C. Sağlık Bakanlığı tarama ABR protokolü akış şemalarına bakılarak sadeleştirilip yeniden çizildi (logo ve slayt kullanılmadı).
     Klinik metinler taslaktır; proje sahibi doğrular ve uygulamadan düzeltir (icerik/tarama.<id>).
     ad: şemadaki kısa ad (satırlar), baslik: kartın başlığı. Ortak kutular (Geçti, Kaldı, sonuçlar) iki şemada aynı kaydı kullanır.
     Renk dili: yeşil = geçti/sağlam, turuncu = kaldı/referans merkeze sevk, gri = risk nedeniyle sevk. Renk yanında her kutuda yazı da var. */
  var TNODES = {
    deg: { ad: ['Yenidoğanın değerlendirilmesi'], baslik: 'Yenidoğanın değerlendirilmesi', zaman: '',
      aciklama: 'Bebek, işitme kaybı için risk faktörü taşıyıp taşımamasına göre "Risk yok" ya da "Risk var" yoluna ayrılır.',
      not: 'Risk faktörlerinin listesi bu şemada yer almaz; programın güncel belgesine bakılmalıdır.' },
    riskyok: { ad: ['Risk yok'], baslik: 'Risk yok', zaman: '',
      aciklama: 'İşitme kaybı için risk faktörü olmayan bebek. Tarama ABR en çok üç kez yapılır; herhangi birinde geçerse sonuç "Sağlam"dır. Üçünde de kalırsa referans merkeze sevk edilir.', not: '' },
    riskvar: { ad: ['Risk var'], baslik: 'Risk var', zaman: '',
      aciklama: 'İşitme kaybı için risk faktörü olan bebek. Tarama ABR en çok üç kez yapılır; geçerse sonuç "Sağlam / risk nedeniyle sevk"tir. Üçünde de kalırsa referans merkeze sevk edilir.', not: '' },
    a1: { ad: ['1. tarama ABR'], baslik: '1. tarama ABR', zaman: 'Doğumdan sonraki ilk 72 saat içinde, taburcu olmadan.',
      aciklama: 'Geçerse: risk yoksa sağlam, risk varsa sağlam / risk nedeniyle sevk. Kalırsa 2. tarama ABR yapılır.', not: '' },
    a2: { ad: ['2. tarama ABR'], baslik: '2. tarama ABR', zaman: 'Doğumdan sonraki 7–15 gün içinde.',
      aciklama: 'Geçerse: risk yoksa sağlam, risk varsa sağlam / risk nedeniyle sevk. Kalırsa 3. tarama ABR yapılır.', not: '' },
    a3: { ad: ['3. tarama ABR'], baslik: '3. tarama ABR', zaman: 'Doğumdan sonraki 15–30 gün içinde (30. günü geçmemeli).',
      aciklama: 'Geçerse: risk yoksa sağlam, risk varsa sağlam / risk nedeniyle sevk. Kalırsa referans merkeze sevk edilir.', not: '' },
    gecti: { ad: ['Geçti'], baslik: 'Geçti', zaman: '',
      aciklama: 'Tarama ABR geçildi. Bebek bir sonraki taramaya gitmez; sonuç kutusuna yönlenir (risk yoksa sağlam, risk varsa ya da yoğun bakım bebeğiyse sağlam / risk nedeniyle sevk).', not: '' },
    kaldi: { ad: ['Kaldı'], baslik: 'Kaldı', zaman: '',
      aciklama: 'Tarama ABR geçilemedi. Bebek bir sonraki tarama ABR’ye yönlenir; son taramada da kalırsa referans merkeze sevk edilir.', not: '' },
    saglam: { ad: ['Sağlam'], baslik: 'Sağlam', zaman: '',
      aciklama: 'Risk faktörü olmayan ve tarama ABR’lerden birini geçen bebek.', not: '' },
    risksevk: { ad: ['Sağlam / risk', 'nedeniyle sevk'], baslik: 'Sağlam / risk nedeniyle sevk', zaman: '',
      aciklama: 'Taramayı geçen ama risk faktörü taşıyan (ya da 5 günden fazla yoğun bakımda kalan) bebek. Tarama sonucu sağlamdır; risk nedeniyle sevk edilir.', not: '' },
    referans: { ad: ['Referans', 'merkeze sevk'], baslik: 'Referans merkeze sevk', zaman: '',
      aciklama: 'Son tarama ABR’de de kalan bebek ileri değerlendirme için referans merkeze sevk edilir.', not: '' },
    degb: { ad: ['Yenidoğanın değerlendirilmesi'], baslik: 'Yenidoğanın değerlendirilmesi (yoğun bakım)', zaman: '',
      aciklama: '5 günden fazla yoğun bakımda kalan bebekler, yoğun bakımda kalma süresine göre üç gruba ayrılır.', not: '' },
    yb1: { ad: ['5–30 gün yoğun bakım'], baslik: '5 günden fazla, 30 günden az yoğun bakımda kalma', zaman: '',
      aciklama: 'Tarama ABR en çok iki kez yapılır. Geçerse sağlam / risk nedeniyle sevk; ikisinde de kalırsa referans merkeze sevk.', not: '' },
    yb2: { ad: ['30–90 gün yoğun bakım'], baslik: '30 günden fazla, 90 günden az yoğun bakımda kalma', zaman: '',
      aciklama: 'Tarama ABR bir kez yapılır. Geçerse sağlam / risk nedeniyle sevk; kalırsa referans merkeze sevk.', not: '' },
    yb3: { ad: ['90 günden fazla yoğun bakım'], baslik: '90 günden fazla yoğun bakımda kalma', zaman: '',
      aciklama: 'Tarama ABR bir kez yapılır. Geçerse sağlam / risk nedeniyle sevk; kalırsa referans merkeze sevk.', not: '' },
    b1: { ad: ['1. tarama ABR'], baslik: '1. tarama ABR (yoğun bakım, 5–30 gün)', zaman: 'Ayrıntılar tarama ABR protokolü belgesinde.',
      aciklama: 'Geçerse sağlam / risk nedeniyle sevk. Kalırsa 2. tarama ABR yapılır.', not: '' },
    b2: { ad: ['2. tarama ABR'], baslik: '2. tarama ABR (yoğun bakım, 5–30 gün)', zaman: 'Ayrıntılar tarama ABR protokolü belgesinde.',
      aciklama: 'Geçerse sağlam / risk nedeniyle sevk. Kalırsa referans merkeze sevk.', not: '' },
    bt: { ad: ['Tarama ABR'], baslik: 'Tarama ABR (30 günden uzun yoğun bakım)', zaman: 'Ayrıntılar tarama ABR protokolü belgesinde.',
      aciklama: 'Tek tarama ABR. Geçerse sağlam / risk nedeniyle sevk; kalırsa referans merkeze sevk.', not: '' }
  };
  var TARAMA_ALAN = [{ f: 'ad', ad: 'Şemadaki ad (en çok 2 satır)', cok: true }, { f: 'baslik', ad: 'Kart başlığı' }, { f: 'zaman', ad: 'Ne zaman' },
    { f: 'aciklama', ad: 'Açıklama', cok: true }, { f: 'not', ad: 'Not', cok: true }];
  Object.keys(TNODES).forEach(function (id) { var n = TNODES[id]; n.id = id; n.key = 'tarama.' + id; n._kutular = []; editable(n, TARAMA_ALAN.map(function (x) { return x.f; })); });

  // Şema tanımı: kutular [id, cx, cy, genişlik, yükseklik, tür] ve oklar (nokta listeleri; son noktada ok başı olup olmadığı).
  function T(id, cx, cy, w, hh, tur) { return { id: id, cx: cx, cy: cy, w: w, h: hh, tur: tur }; }
  function sema(svgId, ad, kutular, cizgiler, sira, ilk, detayId) {
    var s = $(svgId), o = { svg: s, kutular: kutular, sira: sira, sec: ilk, detay: $(detayId) };
    var defs = se('defs', {}, s);
    var m = se('marker', { id: 'ah-' + ad, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto' }, defs);
    se('path', { d: 'M0,0 L10,5 L0,10 z', 'class': 'ah akis' }, m);
    cizgiler.forEach(function (c) {
      var d = c.p.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ');
      var a = { d: d, 'class': 'lnk akis' }; if (c.ok) a['marker-end'] = 'url(#ah-' + ad + ')';
      se('path', a, s);
    });
    kutular.forEach(function (k) {
      var n = TNODES[k.id];
      var g = se('g', { 'class': 'node', tabindex: '0', role: 'button' }, s);
      se('rect', { x: k.cx - k.w / 2, y: k.cy - k.h / 2, width: k.w, height: k.h, rx: k.tur === 'gecti' || k.tur === 'kaldi' ? k.h / 2 : 8, 'class': 'pill t-' + k.tur }, g);
      k.t = se('text', { x: k.cx, y: k.cy }, g);
      k.g = g; n._kutular.push(k);
      g.addEventListener('click', function () { tsec(o, k.id); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tsec(o, k.id); } });
    });
    return o;
  }
  function tyaz(k) {
    var n = TNODES[k.id];
    rlabel(k.t, Array.isArray(n.ad) ? n.ad : [String(n.ad)], k.cx, k.cy);
    k.g.setAttribute('aria-label', (Array.isArray(n.ad) ? n.ad.join(' ') : n.ad) + ': ayrıntı');
  }
  function tsec(o, id) {
    o.sec = id;
    var idx = o.sira.indexOf(id), n = TNODES[id];
    o.kutular.forEach(function (k) { k.g.classList.toggle('sel', k.id === id); });
    var prev = h('button', { 'class': 'btn', type: 'button', text: '← Önceki' });
    var next = h('button', { 'class': 'btn', type: 'button', text: 'Sonraki →' });
    if (idx <= 0) prev.disabled = true;
    if (idx === o.sira.length - 1) next.disabled = true;
    prev.addEventListener('click', function () { tsec(o, o.sira[idx - 1]); });
    next.addEventListener('click', function () { tsec(o, o.sira[idx + 1]); });
    fill(o.detay, [
      h('div', { 'class': 'card-head' }, [h('h2', { text: n.baslik })]),
      n.zaman ? h('span', { 'class': 'badge', text: 'Ne zaman: ' + n.zaman }) : null,
      h('dl', null, [n.aciklama ? dlRow('Açıklama', n.aciklama) : null, n.not ? dlRow('Not', n.not) : null].filter(Boolean)),
      h('div', { 'class': 'stepper' }, [prev, h('span', { 'class': 'pos', text: (idx + 1) + ' / ' + o.sira.length }), next]),
      adminPart(n.key, n, TARAMA_ALAN, 'Bu kutuyu düzenle')
    ]);
  }

  // Şema A: tarama ABR protokolü (risk yok / risk var). Sol sütun risk yok, sağ sütun risk var.
  var TA_K = [T('deg', 180, 26, 230, 34, 'baslik'), T('riskyok', 95, 84, 120, 32, 'grup'), T('riskvar', 265, 84, 120, 32, 'grup')];
  var TA_C = [{ p: [[180, 43], [180, 56]] }, { p: [[95, 56], [265, 56]] }, { p: [[95, 56], [95, 67]], ok: 1 }, { p: [[265, 56], [265, 67]], ok: 1 }];
  [['L', 95, 50, 140, 10], ['R', 265, 310, 220, 350]].forEach(function (c) {
    var cx = c[1], gx = c[2], kx = c[3], ray = c[4], kenar = gx < cx ? gx - 31 : gx + 31;
    TA_C.push({ p: [[cx, 100], [cx, 123]], ok: 1 });
    ['a1', 'a2', 'a3'].forEach(function (id, i) {
      var y = 140 + i * 98;
      TA_K.push(T(id, cx, y, 150, 32, 'test'), T('gecti', gx, y + 48, 62, 28, 'gecti'), T('kaldi', kx, y + 48, 62, 28, 'kaldi'));
      TA_C.push({ p: [[cx, y + 16], [cx, y + 24], [gx, y + 24], [gx, y + 33]], ok: 1 }, { p: [[cx, y + 24], [kx, y + 24], [kx, y + 33]], ok: 1 });
      TA_C.push({ p: [[kenar, y + 48], [ray, y + 48]] });                                   // Geçti → kenardaki ray
      if (i < 2) TA_C.push({ p: [[kx, y + 62], [kx, y + 81]], ok: 1 });                    // Kaldı → sonraki tarama
      else TA_C.push({ p: [[kx, y + 62], [kx, 421]], ok: 1 });                             // son Kaldı → referans merkeze sevk
    });
    TA_C.push({ p: [[ray, 188], [ray, 421]], ok: 1 });                                     // ray → sonuç
  });
  TA_K.push(T('saglam', 62, 450, 112, 56, 'saglam'), T('referans', 180, 450, 112, 56, 'ref'), T('risksevk', 298, 450, 112, 56, 'sevk'));
  var TA = sema('tarama-a', 'ta', TA_K, TA_C, ['deg', 'riskyok', 'riskvar', 'a1', 'a2', 'a3', 'gecti', 'kaldi', 'saglam', 'risksevk', 'referans'], 'a1', 'detail-ta');

  // Şema B: 5 günden fazla yoğun bakım. Üç grup alt alta; soldaki omurga değerlendirmeden gruplara iner.
  var TB_K = [T('degb', 180, 26, 230, 34, 'baslik')];
  var TB_C = [{ p: [[180, 43], [180, 54], [14, 54], [14, 654]] }];
  function seritTek(H, grup) {   // grup başlığı → tek tarama ABR → geçti / kaldı → sonuç
    TB_K.push(T(grup, 184, H, 312, 34, 'grup'), T('bt', 184, H + 52, 150, 32, 'test'), T('gecti', 124, H + 98, 62, 28, 'gecti'), T('kaldi', 244, H + 98, 62, 28, 'kaldi'),
      T('risksevk', 100, H + 164, 150, 52, 'sevk'), T('referans', 265, H + 164, 150, 52, 'ref'));
    TB_C.push({ p: [[14, H], [27, H]], ok: 1 }, { p: [[184, H + 17], [184, H + 35]], ok: 1 },
      { p: [[184, H + 68], [184, H + 76], [124, H + 76], [124, H + 83]], ok: 1 }, { p: [[184, H + 76], [244, H + 76], [244, H + 83]], ok: 1 },
      { p: [[124, H + 112], [124, H + 137]], ok: 1 }, { p: [[244, H + 112], [244, H + 137]], ok: 1 });
  }
  (function () {   // 1. grup: iki tarama
    var H = 90;
    TB_K.push(T('yb1', 184, H, 312, 34, 'grup'), T('b1', 184, H + 52, 150, 32, 'test'), T('gecti', 124, H + 98, 62, 28, 'gecti'), T('kaldi', 244, H + 98, 62, 28, 'kaldi'),
      T('b2', 244, H + 148, 140, 32, 'test'), T('gecti', 200, H + 194, 62, 28, 'gecti'), T('kaldi', 290, H + 194, 62, 28, 'kaldi'),
      T('risksevk', 100, H + 260, 150, 52, 'sevk'), T('referans', 265, H + 260, 150, 52, 'ref'));
    TB_C.push({ p: [[14, H], [27, H]], ok: 1 }, { p: [[184, H + 17], [184, H + 35]], ok: 1 },
      { p: [[184, H + 68], [184, H + 76], [124, H + 76], [124, H + 83]], ok: 1 }, { p: [[184, H + 76], [244, H + 76], [244, H + 83]], ok: 1 },
      { p: [[244, H + 112], [244, H + 131]], ok: 1 },
      { p: [[244, H + 164], [244, H + 172], [200, H + 172], [200, H + 179]], ok: 1 }, { p: [[244, H + 172], [290, H + 172], [290, H + 179]], ok: 1 },
      { p: [[124, H + 112], [124, H + 233]], ok: 1 },                                           // 1. Geçti → sonuç
      { p: [[200, H + 208], [200, H + 220], [160, H + 220], [160, H + 233]], ok: 1 },           // 2. Geçti → sonuç
      { p: [[290, H + 208], [290, H + 233]], ok: 1 });                                         // 2. Kaldı → referans
  })();
  seritTek(420, 'yb2');
  seritTek(654, 'yb3');
  var TB = sema('tarama-b', 'tb', TB_K, TB_C, ['degb', 'yb1', 'yb2', 'yb3', 'b1', 'b2', 'bt', 'gecti', 'kaldi', 'risksevk', 'referans'], 'yb1', 'detail-tb');

  function refreshTarama() {
    Object.keys(TNODES).forEach(function (id) { var n = TNODES[id]; applyOv(n.key, n); n._kutular.forEach(tyaz); });
    tsec(TA, TA.sec); tsec(TB, TB.sec);
  }
  refreshTarama();

  /* ---------- ders notları ---------- */
  var customNotes = [];
  var NOTES = [
    { t: 'Saf ses odyometrisi', p: [
      'Hava yolu genellikle 250–8000 Hz, kemik yolu 250–4000 Hz aralığında test edilir.',
      'Yetişkinde eşikler genellikle 25 dB HL ve altındaysa normal kabul edilir; sınıflamalar kaynağa göre değişir.',
      'Hava-kemik aralığı yaklaşık 10 dB’den büyükse iletim komponenti düşünülür.',
      'Odyogramda maskesiz hava yolu için sağ kulak kırmızı O, sol kulak mavi X kullanılır.' ] },
    { t: 'İşitme kaybı tipleri', p: [
      'İletim tipi: hava yolunda kayıp var, kemik yolu normal, hava-kemik aralığı var.',
      'Sensörinöral: hava ve kemik yolu benzer düzeyde etkilenir, hava-kemik aralığı yok.',
      'Mikst: kemik yolunda kayıp var ve buna ek olarak hava-kemik aralığı var.' ] },
    { t: 'Timpanometri', p: [
      'Tip A: tepe basıncı ve compliance normal sınırlarda.',
      'Tip As: compliance düşük (sığ eğri); otoskleroz gibi sertleşme durumlarında görülür.',
      'Tip Ad: compliance çok yüksek; ossiküler diskontinüite veya atrofik timpanik membranda görülür.',
      'Tip B: düz eğri; orta kulak efüzyonu düşündürür. Kanal hacmi belirgin büyükse perforasyon veya açık ventilasyon tüpü düşünülür.',
      'Tip C: belirgin negatif orta kulak basıncı; Östaki tüpü işlev bozukluğunu düşündürür.',
      'Sınır değerler yaşa ve cihaza göre değişir.' ] },
    { t: 'Konuşma odyometrisi', p: [
      'Konuşmayı alma eşiği (SRT) ile 500, 1000 ve 2000 Hz saf ses ortalaması genellikle yaklaşık 10 dB içinde uyumludur.',
      'Belirgin uyumsuzluk fonksiyonel işitme kaybı şüphesi uyandırır.',
      'Kelime ayırt etme skoru sensörinöral kayıpta beklenenden düşük olabilir. Retrokoklear patolojide şiddet artınca skorun düşmesi (rollover) görülebilir.' ] },
    { t: 'Maskeleme: neden ve ne zaman', p: [
      'Kulaklar arası azalma (IA), sinyalin kafatasından karşı kulağa geçerken kaybettiği şiddettir. Sık kullanılan konservatif değerler: supra-aural kulaklıkta yaklaşık 40 dB, insert kulaklıkta yaklaşık 55 dB; kemik yolunda 0 dB’e yakın.',
      'Hava yolunda, test kulağına verilen şiddet ile karşı kulağın kemik yolu eşiği arasındaki fark IA’ya ulaşıyorsa maskeleme gerekir.',
      'Aşırı maskeleme riski vardır: maskeleyici gürültü test kulağına geçip eşiği olduğundan yüksek gösterebilir.',
      'Plato tekniğinin adımları ve hesaplar OdyoBOT bölümünde verilecek.' ] },
    { t: 'Otoakustik emisyon (OAE)', p: [
      'Dış tüy hücrelerinin işlevini yansıtır; dış ve orta kulağın sağlıklı olması gerekir.',
      'Genellikle yaklaşık 30–40 dB HL üzerindeki işitme kayıplarında alınamaz.',
      'OAE var, ABR yok veya bozuksa işitsel nöropati spektrumu düşünülür.' ] },
    { t: 'İşitsel beyin sapı yanıtı (ABR)', p: [
      'Klinikte en çok I, III ve V. dalgalar kullanılır; V. dalga en dayanıklı olandır ve eşik tayininde kullanılır.',
      'I–V aralığı (interpeak latans) genellikle yaklaşık 4 ms’dir; sınırlar laboratuvar normlarına göre değişir.',
      'Klik uyaranı geniş bantlıdır; tone-burst frekansa özgü bilgi verir.',
      'Kulaklar arası V. dalga latans farkının belirgin olması retrokoklear patolojiden şüphelendirir.' ] },
    { t: 'Akustik refleks', p: [
      'Normal işitmede saf sesle refleks eşiği genellikle yaklaşık 70–100 dB HL arasındadır.',
      'İpsilateral ve kontralateral ölçümler birlikte yorumlanır.',
      'Prob kulağında orta kulak patolojisi, o kulakta ölçülen refleksleri engeller.',
      'Refleks decay: uzun süreli uyaranda yanıtın hızla azalması retrokoklear patolojiyi düşündürebilir.' ] }
  ];
  // Koddaki temel notlar da yönetici tarafından düzenlenebilir (anahtar: not.<sıra>). Sırayı değiştirme.
  var NOT_ALAN = [{ f: 't', ad: 'Başlık' }, { f: 'p', ad: 'Maddeler (her satıra bir madde)', cok: true }];
  NOTES.forEach(function (n, i) { n.key = 'not.' + i; editable(n, ['t', 'p']); });
  function renderNotes(q) {
    var box = $('notes-list');
    var qq = (q || '').trim().toLocaleLowerCase('tr');
    var shown = NOTES.concat(customNotes).filter(function (n) {
      if (!qq) return true;
      return (n.t + ' ' + n.p.join(' ')).toLocaleLowerCase('tr').indexOf(qq) !== -1;
    });
    if (!shown.length) { box.replaceChildren(h('div', { 'class': 'empty', text: 'Bu aramayla eşleşen not yok.' })); return; }
    box.replaceChildren.apply(box, shown.map(function (n) {
      var admin = null;
      if (canEdit && n.key) admin = h('div', { 'class': 'ns-admin' }, [adminPart(n.key, n, NOT_ALAN, 'Bu notu düzenle')]);
      else if (canEdit) {
        var go = h('a', { 'class': 'linkbtn', href: '#ayarlar', text: 'Ayarlar’da düzenle' });
        admin = h('div', { 'class': 'ns-admin admin-bar' }, [go]);
      }
      var d = h('details', { 'class': 'ns' }, [
        h('summary', { text: n.t }),
        h('ul', null, n.p.map(function (x) { return h('li', { text: x }); })),
        admin
      ]);
      if (qq || (n.key && editingKey === n.key)) d.open = true;
      return d;
    }));
  }
  function refreshNotes() {
    NOTES.forEach(function (n) { applyOv(n.key, n); });
    renderNotes($('n-ara').value);
  }
  renderNotes('');
  $('n-ara').addEventListener('input', function () { renderNotes($('n-ara').value); });

  /* ---------- depo segmented control ---------- */
  // 3D artık Görsel depo'da değil, kendi sayfasında (#3d). Üstte 3 düğme: Şemalar, İşitme cihazları, İşitsel implantlar.
  // Şemalar'ın içinde alt düğmeler: işitme yolağı, refleks arkı, yenidoğan taraması (o da iki akış şeması).
  // secici: düğme kimliği onEk+ad, panel kimliği panelEk+ad; yalnızca seçilenin paneli görünür.
  function secici(adlar, onEk, panelEk, sonra) {
    function sec(which) {
      adlar.forEach(function (s) {
        $(onEk + s).setAttribute('aria-pressed', s === which ? 'true' : 'false');
        $(panelEk + s).hidden = s !== which;
      });
      if (sonra) sonra(which);
    }
    adlar.forEach(function (s) { $(onEk + s).addEventListener('click', function () { sec(s); }); });
    return sec;
  }
  var seg = secici(['sema', 'isitme', 'implant'], 'seg-', 'p-', function (which) {
    $('cihaz-alt').hidden = which === 'sema';   // ortak not iki cihaz panelinin altında
  });
  secici(['yolak', 'refleks', 'tarama'], 'alt-', 'p-');
  secici(['a', 'b'], 'tr-', 'tp-');

  /* ---------- tabs ---------- */
  // 'uc-boyut' = 3D sayfası; adresi #3d. Alt çubukta sekmesi yok, o sırada Ana sayfa seçili görünür.
  var TABS = ['anasayfa', 'depo', 'odybot', 'notlar', 'vakalarim', 'ayarlar', 'giris', 'uc-boyut'];
  var UC_ESKI = ['uc-boyut', '3d-model', 'gorsel3d', 'depo/3d', 'model'];   // olası eski/başka adresler -> #3d
  var oncekiHash = '', ucGeldigi = null, ilkRota = true;
  function route() {
    var t = (location.hash || '').replace('#', '');
    var ham = t, duyuru = t.indexOf('duyuru/') === 0;
    if (duyuru) t = 'anasayfa';
    // Eski adres: Geçmiş sekmesinin adı Vakalarım oldu; eski bağlantılar da çalışsın.
    if (t === 'gecmis') { t = 'vakalarim'; try { history.replaceState(null, '', '#vakalarim'); } catch (e) {} }
    if (UC_ESKI.indexOf(t) !== -1) { t = '3d'; ham = '3d'; try { history.replaceState(null, '', '#3d'); } catch (e) {} }
    if (t === '3d') {
      t = 'uc-boyut';
      if (oncekiHash !== '3d') ucGeldigi = ilkRota ? null : oncekiHash;   // geri düğmesi için: nereden gelindi (doğrudan açıldıysa null)
      setTimeout(kur3d, 0);   // model yalnızca 3D sayfası ilk kez açılınca indirilir
    }
    if (TABS.indexOf(t) === -1) t = 'anasayfa';
    document.querySelectorAll('section[data-tab]').forEach(function (s) { s.hidden = s.id !== t; });
    var navT = t === 'uc-boyut' ? 'anasayfa' : t;
    document.querySelectorAll('nav.tabs a').forEach(function (a) {
      if (a.getAttribute('data-go') === navT) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var oncekiDuyuru = oncekiHash.indexOf('duyuru/') === 0;
    oncekiHash = ham; ilkRota = false;
    if (duyuru || oncekiDuyuru) return; // ayrıntı sayfası açılıp kapanırken akıştaki yer korunur
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  window.addEventListener('hashchange', route);
  route();
  // 3D sayfasındaki "← Ana sayfa": ana sayfadan gelindiyse tarayıcı geçmişinde bir adım geri (telefonun geri tuşuyla aynı).
  $('uc-geri').addEventListener('click', function () {
    if ((ucGeldigi === 'anasayfa' || ucGeldigi === '') && history.length > 1) history.back();
    else location.hash = '#anasayfa';
  });

  /* ---------- ortak veri ----------
     Ana sayfa akışı (etkinlik, iş ilanı, haber) akis.js içinde. app.js bağlantıyı kurar ve olaylarla bildirir:
     'odyo:db' (detail: Firestore), 'odyo:db-yok', 'odyo:yetki' (detail: true/false), 'odyo:metinler' (yönetici metinleri yenilendi). */
  var canEdit = false, dbRef = null;
  var armedId = null, armedTimer = null;
  function bildir(ad, deger) { try { window.dispatchEvent(new CustomEvent(ad, { detail: deger })); } catch (e) {} }

  /* ---------- ayarlar: renk teması ve ders notları ---------- */
  var PALETTES = {
    petrol:   { ad: 'Petrol',   a: ['#0B6E78', '#4FC1CC'], b: ['#E2711D', '#F28B3A'], bi: ['#FFFFFF', '#2B1300'] },
    lacivert: { ad: 'Lacivert', a: ['#254E9E', '#8FB0F5'], b: ['#D9822B', '#F2A649'], bi: ['#FFFFFF', '#2B1300'] },
    orman:    { ad: 'Orman',    a: ['#2E6B3A', '#7CCB8B'], b: ['#C2417B', '#F08CB5'], bi: ['#FFFFFF', '#2B0A18'] },
    bordo:    { ad: 'Bordo',    a: ['#8E2A45', '#F09AB0'], b: ['#1F7A8C', '#5FC3D6'], bi: ['#FFFFFF', '#06242A'] },
    mor:      { ad: 'Mor',      a: ['#5B3FA8', '#B8A2F0'], b: ['#E2A100', '#F5C542'], bi: ['#2B2000', '#2B2000'] }
  };
  var palId = 'petrol';
  var themeStyle = document.createElement('style');
  document.body.appendChild(themeStyle);
  function applyPalette(id) {
    var p = PALETTES[id] || PALETTES.petrol;
    palId = PALETTES[id] ? id : 'petrol';
    function vars(i) { return '--accent:' + p.a[i] + ';--accent-ink:' + (i ? '#0C1A1F' : '#FFFFFF') + ';--bot:' + p.b[i] + ';--bot-ink:' + p.bi[i] + ';'; }
    var dark = vars(1) + 'color-scheme:dark;';
    themeStyle.textContent = ':root{' + vars(0) + '}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' + dark + '}}:root[data-theme="dark"]{' + dark + '}';
    renderPalettes();
  }
  function renderPalettes() {
    var box = $('palettes');
    box.replaceChildren.apply(box, Object.keys(PALETTES).map(function (id) {
      var p = PALETTES[id];
      var b = h('button', { 'class': 'pal', type: 'button', 'aria-pressed': id === palId ? 'true' : 'false' }, [
        h('span', { 'class': 'sw', style: 'background:' + p.a[0] }),
        h('span', { 'class': 'sw', style: 'background:' + p.b[0] }),
        h('span', { text: p.ad })
      ]);
      b.addEventListener('click', function () {
        applyPalette(id);
        if (dbRef) dbRef.doc('ayar/tema').set({ id: id, guncelleme: Date.now() }).catch(function () {
          $('an-msg').textContent = 'Tema kaydedilemedi; yalnızca bu ekranda değişti.'; $('an-msg').className = 'msg err';
        });
      });
      return b;
    }));
  }
  var editingNote = null, noteDocs = [];
  function resetNoteForm() {
    editingNote = null; $('an-form').reset();
    $('an-send').textContent = 'Notu yayınla'; $('an-cancel').hidden = true;
  }
  $('an-cancel').addEventListener('click', function () { resetNoteForm(); $('an-msg').textContent = ''; });
  function renderNoteAdmin() {
    var box = $('n-admin-list');
    if (!noteDocs.length) { box.replaceChildren(h('div', { 'class': 'empty', text: 'Henüz eklenmiş not yok.' })); return; }
    box.replaceChildren.apply(box, noteDocs.map(function (d) {
      var edit = h('button', { 'class': 'linkbtn', type: 'button', text: 'Düzenle' });
      edit.addEventListener('click', function () {
        editingNote = d.id;
        $('an-baslik').value = d.baslik || ''; $('an-maddeler').value = (d.maddeler || []).join('\n');
        $('an-send').textContent = 'Güncelle'; $('an-cancel').hidden = false; $('an-baslik').focus();
      });
      var key = 'n' + d.id;
      var del = h('button', { 'class': 'linkbtn' + (armedId === key ? ' danger' : ''), type: 'button', text: armedId === key ? 'Emin misin? Sil' : 'Sil' });
      del.addEventListener('click', function () {
        if (armedId !== key) {
          armedId = key; clearTimeout(armedTimer);
          armedTimer = setTimeout(function () { armedId = null; renderNoteAdmin(); }, 4000);
          renderNoteAdmin(); return;
        }
        armedId = null; clearTimeout(armedTimer);
        dbRef.collection('notlar').doc(d.id).delete().catch(function () {
          $('an-msg').textContent = 'Silinemedi.'; $('an-msg').className = 'msg err';
        });
      });
      return h('div', { 'class': 'item' }, [
        h('div', { 'class': 'item-title', text: d.baslik || '' }),
        h('div', { 'class': 'meta', text: (d.maddeler || []).length + ' madde' }),
        h('div', { 'class': 'admin-bar' }, [edit, del])
      ]);
    }));
  }
  $('an-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('an-msg'); msg.className = 'msg';
    var baslik = $('an-baslik').value.trim();
    var maddeler = $('an-maddeler').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 40);
    if (!dbRef) { msg.textContent = 'Veri deposuna ulaşılamıyor.'; msg.className = 'msg err'; return; }
    if (!baslik || !maddeler.length) { msg.textContent = 'Başlık ve en az bir madde gerekli.'; msg.className = 'msg err'; return; }
    $('an-send').disabled = true;
    var p = editingNote
      ? dbRef.collection('notlar').doc(editingNote).update({ baslik: baslik, maddeler: maddeler })
      : dbRef.collection('notlar').add({ baslik: baslik, maddeler: maddeler, olusturma: Date.now() });
    p.then(function () { resetNoteForm(); msg.textContent = 'Kaydedildi. Notlar sekmesinde görünür.'; })
     .catch(function () { msg.textContent = 'Kaydedilemedi. Düzenleme yetkin olmayabilir.'; msg.className = 'msg err'; })
     .then(function () { $('an-send').disabled = false; });
  });
  function setupAyarlar(db) {
    renderPalettes(); renderNoteAdmin();
    db.doc('ayar/tema').onSnapshot(function (s) {
      var d = s.exists ? s.data() : null;
      if (d && PALETTES[d.id]) applyPalette(d.id);
    }, function () {});
    db.collection('notlar').orderBy('olusturma', 'asc').limit(200).onSnapshot(function (snap) {
      noteDocs = snap.docs.map(function (d) { var o = d.data() || {}; o.id = d.id; return o; });
      customNotes = noteDocs.map(function (d) { return { t: String(d.baslik || ''), p: (d.maddeler || []).map(String) }; });
      renderNotes($('n-ara').value); renderNoteAdmin();
    }, function () {});
    db.collection('cihazlar').onSnapshot(function (snap) {
      devText = {};
      snap.docs.forEach(function (d) {
        var o = d.data() || {};
        if (Array.isArray(o.maddeler)) devText[d.id] = o.maddeler.map(String);
      });
      if (!editingKey) renderDevices(); // düzenleme sırasında yazılan metin silinmesin
    }, function () {});
    db.collection('icerik').onSnapshot(function (snap) {
      overrides = {};
      snap.docs.forEach(function (d) {
        var o = d.data() || {};
        if (o.alanlar && typeof o.alanlar === 'object') overrides[d.id] = o.alanlar;
      });
      if (!editingKey) refreshContent();
    }, function () {});
  }

  /* ---------- cihaz tipleri ----------
     Liste ve görseller kodda sabit (görseller images/devices/ altında, git ile güncellenir).
     Açıklamalar Firestore'da: cihazlar/{id} -> { maddeler: [...], guncelleme }. Herkes okur, yalnızca yönetici yazar.
     img: null olan cihazın görseli yenilenecek; kartta yer tutucu görünür. */
  /* Rozet yazıları: burada değiştirilir (yönetici de uygulamadan değiştirebilir: icerik/cihaz.rozet).
     Hangi kartın hangi rozeti aldığı: işitme cihazları "ameliyatsiz", implantlar "ameliyatli";
     ek rozetler kartın "rozetEk" alanında. */
  var ROZET = { key: 'cihaz.rozet', ameliyatsiz: 'Ameliyatsız', ameliyatli: 'Ameliyatlı', arastirma: 'Araştırma aşamasında' };
  var ROZET_ALAN = [{ f: 'ameliyatsiz', ad: 'İşitme cihazı rozeti' }, { f: 'ameliyatli', ad: 'İmplant rozeti' }, { f: 'arastirma', ad: 'Araştırma rozeti' }];
  editable(ROZET, ['ameliyatsiz', 'ameliyatli', 'arastirma']);

  /* grup: isitme / implant. kume: implant alt başlığı (koklear, kemik, ortakulak, beyinsapi).
     gorselAlt: ekran okuyucu için görselin anlatımı. genis: listenin başında, ayrışan tam genişlikte kart.
     gizli: true olan kart gösterilmez (görseli hazır olunca kaldırılır). Kimlikler (id) değiştirilmez: açıklamalar bunlara bağlı. */
  var DEVICES = [
    { id: 'kulak-ici-karsilastirma', grup: 'isitme', genis: true, ad: 'Kulak içi tipler: yerleşim karşılaştırması', img: 'kulak-ici-karsilastirma.jpg',
      gorselAlt: 'Beş kulak içi cihaz tipinin kulak kepçesi ve dış kulak yolu kesitindeki yerleşimi; turkuaz alan cihazın kapladığı yer. ITE tam konka: konkanın tamamını doldurur. ITE yarım konka: konkanın alt yarısında. Kanal içi (ITC): kanal girişinde, ucu konkada. Tamamen kanal içi (CIC): tamamı kanalda, yüzü kanal ağzında. Görünmez kanal içi (IIC): kanalın derininde, kulak zarına daha yakın. Kulak kepçesinde heliks, antiheliks, simba konka, kavum konka ve lobül işaretli.' },
    { id: 'bte', grup: 'isitme', ad: 'Kulak arkası (BTE)', img: 'bte-2.jpg',
      gorselAlt: 'Kulak arkası işitme cihazı şeması: kulak kepçesinin arkasındaki cihaz gövdesi, mikrofonlar, pil bölmesi, kulak kancası, ses hortumu ve kulak kalıbı.' },
    { id: 'ric', grup: 'isitme', ad: 'Hoparlörü kanalda (RIC)', img: 'ric.jpg',
      gorselAlt: 'Hoparlörü kanalda (RIC) işitme cihazının kulaktaki yerleşimini gösteren görsel.' },
    { id: 'ite-tam', grup: 'isitme', ad: 'Kulak içi, tam konka (ITE)', img: 'ite-tam.jpg',
      gorselAlt: 'Konkanın tamamını dolduran kulak içi (ITE) işitme cihazını gösteren görsel.' },
    { id: 'ite-yarim', grup: 'isitme', ad: 'Kulak içi, yarım konka (ITE)', img: 'ite-yarim.jpg',
      gorselAlt: 'Konkanın alt yarısını dolduran kulak içi (ITE) işitme cihazını gösteren görsel.' },
    { id: 'itc', grup: 'isitme', ad: 'Kanal içi (ITC)', img: 'itc.jpg',
      gorselAlt: 'Kanal girişine yerleşen kanal içi (ITC) işitme cihazını gösteren görsel.' },
    { id: 'cic', grup: 'isitme', ad: 'Tamamen kanal içi (CIC)', img: 'cic.jpg',
      gorselAlt: 'Tamamı kulak kanalında duran (CIC) işitme cihazını gösteren görsel.' },
    { id: 'iic', grup: 'isitme', ad: 'Görünmez kanal içi (IIC)', img: 'iic.jpg',
      gorselAlt: 'Kulak kanalının derinine yerleşen görünmez kanal içi (IIC) işitme cihazını gösteren görsel.' },
    { id: 'cros-bicros', grup: 'isitme', ad: 'CROS / BiCROS', img: 'cros-bicros.jpg',
      gorselAlt: 'CROS ve BiCROS şeması, iki baş yan yana. Solda CROS: işitmeyen kulaktaki verici mikrofon, sesi kablosuz olarak normal işiten kulaktaki alıcıya aktarır, yükseltme yoktur. Sağda BiCROS: alıcı, işitme kayıplı iyi kulakta aynı zamanda işitme cihazıdır.' },
    { id: 'kemik-bant', grup: 'isitme', ad: 'Kemik iletimli, bantlı', img: 'kemik-bant-2.jpg',
      gorselAlt: 'Bantlı kemik iletimli cihaz şeması: esnek kafa bandı, ses işlemcisini kulak arkasında mastoid kemiğin üzerine bastırır; titreşim deriden kemiğe geçer. Ameliyat gerekmez.' },
    { id: 'kemik-yapiskan', grup: 'isitme', ad: 'Kemik iletimli, yapışkan adaptörlü', img: 'kemik-yapiskan.jpg',
      gorselAlt: 'Yapışkan adaptörlü kemik iletim cihazı şeması: ses işlemcisi kulak arkasında deriye yapışan bir adaptöre takılır; küçük kesitte titreşimin deriden mastoid kemiğe, oradan kokleaya ulaştığı gösterilir. Ameliyat ve baskı bandı gerekmez.' },
    { id: 'ki', grup: 'implant', kume: 'koklear', ad: 'Koklear implant', img: 'ki-2.jpg',
      gorselAlt: 'Koklear implantın dış ve iç parçaları. Dış parça: kulak arkasındaki ses işlemcisi, mikrofonlar, kablo, verici bobin ve mıknatıs. İç parça (ameliyatla yerleştirilir): alıcı bobin ve mıknatıs, uyarıcı, referans elektrot ve kokleaya giren elektrot dizisi. Sinyal deri üzerinden aktarılır.' },
    { id: 'ki-elektrot', grup: 'implant', kume: 'koklear', ad: 'Elektrot dizisi karşılaştırması', img: 'ki-elektrot-2.jpg',
      alt: 'Solda lateral duvar elektrodu, sağda perimodiolar elektrot.',
      gorselAlt: 'Koklea modiolus ekseninden bakılarak iki elektrot dizisi karşılaştırılıyor. Solda lateral duvar elektrodu dış duvara yaslanır ve genellikle daha uzundur. Sağda perimodiolar elektrot modiolusa sarılır ve sinir hücrelerine daha yakındır. İkisi de yuvarlak pencere bölgesinden skala timpaniye girer.' },
    { id: 'eas', grup: 'implant', kume: 'koklear', ad: 'Elektroakustik stimülasyon (EAS)', img: 'eas-2.jpg',
      gorselAlt: 'Elektroakustik stimülasyon şeması: aynı kulakta pes sesler akustik, tiz sesler elektrik uyarımla verilir. Kulak arkasındaki ses işlemcisine bağlı akustik birim kanaldadır; verici bobin ve deri altındaki implant kısa elektrot dizisini kokleaya gönderir. Küçük çizimde koklea: bazal bölüm elektrik (tiz sesler), apikal bölüm akustik (pes sesler).' },
    { id: 'baha-perkutan', grup: 'implant', kume: 'kemik', ad: 'Perkütan kemik iletim implantı', img: 'baha-perkutan-2.jpg',
      gorselAlt: 'Perkütan kemik iletim implantı kesiti: ses işlemcisi, deriden geçen abutment ile temporal kemiğe (mastoid) kaynaşmış titanyum implanta doğrudan bağlanır; titreşim doğrudan kemiğe iletilir.' },
    { id: 'transkutan-pasif', grup: 'implant', kume: 'kemik', ad: 'Pasif transkütanöz kemik iletim implantı', img: 'transkutan-pasif-2.jpg',
      gorselAlt: 'Pasif transkütanöz kemik iletim implantı kesiti: titreşimi dıştaki ses işlemcisi üretir; dış mıknatıs, sağlam derinin altındaki ve kemiğe vidayla sabitlenmiş mıknatısa tutunur. Titreşim deri üzerinden temporal kemiğe (mastoid) geçer.' },
    { id: 'transkutan-aktif', grup: 'implant', kume: 'kemik', ad: 'Aktif transkütanöz kemik iletim implantı', img: 'transkutan-aktif.jpg',
      gorselAlt: 'Aktif transkütanöz kemik iletim implantı kesiti: dıştaki ses işlemcisi mıknatısla tutunur; sinyal ve enerji sağlam deri üzerinden deri altındaki alıcı bobine aktarılır. Titreşimi kemik yuvasına vidayla sabitlenmiş transdüser üretir; titreşim kemik yoluyla kokleaya ulaşır.' },
    { id: 'orta-kulak-yarim', grup: 'implant', kume: 'ortakulak', ad: 'Orta kulak implantı, yarı implante', img: 'orta-kulak-yarim-2.jpg',
      gorselAlt: 'Yarı implante orta kulak implantı şeması: dıştaki ses işlemcisi deri altındaki alıcıya sinyal gönderir; iletken kablo, kemikçik zincirine bağlı titreşim transdüserine gider ve zinciri doğrudan titreştirir. Kulak zarı, kemikçikler ve koklea işaretli.' },
    { id: 'orta-kulak-tam', grup: 'implant', kume: 'ortakulak', ad: 'Orta kulak implantı, tam implante', img: 'orta-kulak-tam-2.jpg',
      gorselAlt: 'Tam implante orta kulak implantı şeması: dışarıda parça yoktur. Deri altında pil ve elektronik ünite ile deri altı mikrofon bulunur; iletken kablo, kemikçiğe bağlı titreşim transdüserine gider. Pil deri üzerinden şarj edilir.' },
    { id: 'abi-yuzey', grup: 'implant', kume: 'beyinsapi', ad: 'İşitsel beyin sapı implantı (ABI), yüzey elektrotlu', img: 'abi-yuzey.jpg',
      gorselAlt: 'Yüzey elektrotlu işitsel beyin sapı implantı, beyin sapı düzeyinden yatay kesit (önde ön, altta arka). Elektrot taşıyıcı koklear çekirdeğin yüzeyine yerleştirilir; alıcı-uyarıcı saçlı deri altındadır ve kablo kafatasındaki cerrahi açıklıktan girer. Beyin sapı, IV. ventrikül ve serebellum işaretli. Küçük çizimde taşıyıcının önden görünüşü.' },
    { id: 'abi-penetran', grup: 'implant', kume: 'beyinsapi', ad: 'Penetran ABI', img: 'abi-penetran-2.jpg', rozetEk: ['arastirma'],
      gorselAlt: 'Penetran işitsel beyin sapı implantı (PABI), beyin sapı düzeyinden yatay kesit. İğne elektrotlar koklear çekirdeğin içine girer; alıcı-uyarıcı saçlı deri altındadır ve kablo cerrahi açıklıktan girer. Beyin sapı, IV. ventrikül ve serebellum işaretli. Küçük çizimde taşıyıcının yandan görünüşü.' }
  ];
  var devText = {};
  var CIHAZ_ALAN = [{ f: 'ad', ad: 'Cihaz adı' }, { f: 'alt', ad: 'Görsel altı not (isteğe bağlı)' },
    { f: 'gorselAlt', ad: 'Görselin sözlü anlatımı (ekran okuyucu için)', cok: true }];
  DEVICES.forEach(function (d) {
    if (!d.alt) d.alt = ''; if (!d.gorselAlt) d.gorselAlt = '';
    d.key = 'cihaz.' + d.id; editable(d, ['ad', 'alt', 'gorselAlt']);
  });
  function devKutu(d) { return $('dev-' + (d.grup === 'implant' ? d.kume : 'isitme')); }
  function renderDevices() {
    document.querySelectorAll('#p-isitme .board, #p-implant .board').forEach(function (b) { b.replaceChildren(); });
    DEVICES.forEach(function (d) { if (!d.gizli) devKutu(d).appendChild(deviceCard(d)); });
    var ra = $('rozet-admin');
    ra.replaceChildren();
    var a = adminPart(ROZET.key, ROZET, ROZET_ALAN, 'Rozet yazılarını düzenle');
    if (a) ra.appendChild(a);
  }
  function rozetler(d) {
    var r = [d.grup === 'implant' ? 'ameliyatli' : 'ameliyatsiz'].concat(d.rozetEk || []);
    var kutu = h('div', { 'class': 'rozetler' }, r.map(function (k) { return h('span', { 'class': 'rozet rozet-' + k, text: ROZET[k] }); }));
    // Görselin büyütülebildiğini gösteren küçük simge: görselin üstüne değil (etiketleri kapatmasın), rozet satırının sağına.
    if (d.img) kutu.appendChild(h('span', { 'class': 'dev-buyut', 'aria-hidden': 'true' }, [svgBuyut()]));
    return kutu;
  }
  function devGorsel(d) {
    if (!d.img) return h('div', { 'class': 'dev-img dev-ph', text: 'Görsel yenilenecek' });
    var src = 'images/devices/' + d.img, alt = d.gorselAlt || d.ad;
    var b = h('button', { 'class': 'dev-img-btn', type: 'button', 'aria-label': d.ad + ': görseli tam ekran aç' }, [
      h('img', { 'class': 'dev-img', src: src, alt: alt, loading: 'lazy' })
    ]);
    b.addEventListener('click', function () {
      if (window.Goruntuleyici) window.Goruntuleyici.ac({ src: src, alt: alt, baslik: d.ad, geri: b });
    });
    return b;
  }
  function svgBuyut() {
    var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '18'); s.setAttribute('height', '18');
    var p = document.createElementNS(ns, 'path');
    p.setAttribute('d', 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5');
    s.appendChild(p);
    return s;
  }
  function deviceCard(d) {
    var maddeler = devText[d.id] || [];
    var card = h('article', { 'class': 'item dev' + (d.genis ? ' genis' : '') }, [
      devGorsel(d),
      rozetler(d),
      h('h4', { 'class': 'item-title', text: d.ad }),
      d.alt ? h('div', { 'class': 'meta', text: d.alt }) : null,
      maddeler.length ? h('ul', { 'class': 'dev-list' }, maddeler.map(function (x) { return h('li', { text: x }); })) : null
    ]);
    // Açıklama maddeleri ayrı kayıtta (cihazlar/{id}); ad ve alt not icerik/cihaz.{id} kaydında.
    var taId = 'ed-dev-' + d.id;
    var ta = h('textarea', { id: taId, maxlength: '3000' });
    ta.value = maddeler.join('\n');
    var extra = {
      node: h('div', { 'class': 'fld' }, [h('label', { 'for': taId, text: 'Açıklama (her satıra bir madde, en çok 20)' }), ta]),
      save: function () {
        var list = ta.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 20);
        var ref = dbRef.collection('cihazlar').doc(d.id);
        return list.length ? ref.set({ maddeler: list, guncelleme: Date.now() }) : ref.delete();
      }
    };
    var admin = adminPart(d.key, d, CIHAZ_ALAN, maddeler.length ? 'Düzenle' : 'Açıklama ekle / düzenle', extra);
    if (admin) card.appendChild(admin);
    return card;
  }
  function refreshDevices() {
    DEVICES.forEach(function (d) { applyOv(d.key, d); });
    applyOv(ROZET.key, ROZET);
    renderDevices();
  }
  renderDevices();

  /* ---------- 3D model (gorsel3d/) ----------
     Görüntüleyici gorsel3d/gorsel3d.js, metinler gorsel3d/gorsel3d-veri.js (window.GORSEL3D_VERI).
     Tembel yükleme: Gorsel3D.kur yalnızca 3D sayfası (#3d, route) ilk kez açılınca çağrılır (periferik.bin ~4 MB),
     sonraki açılışlarda aynı örnek kullanılır. Yönetici düzenlemesi: icerik/g3d.bolum.<id>, g3d.yapi.<id>,
     g3d.kepce (ad, aciklama) ve g3d.metin (ipucu, not). "Düzenle" bilgi kartına kartEki kancasıyla eklenir. */
  var G3D = window.GORSEL3D_VERI, g3d = null, G3D_ALAN = [{ f: 'ad', ad: 'Ad' }, { f: 'aciklama', ad: 'Açıklama', cok: true }];
  var G3D_METIN_ALAN = [{ f: 'ipucu', ad: 'İpucu (modelin altında)', cok: true }, { f: 'not', ad: 'Not (sayfanın altında)', cok: true }];
  if (G3D) {
    G3D.bolumler.forEach(function (b) { b.key = 'g3d.bolum.' + b.id; editable(b, ['ad', 'aciklama']); });
    Object.keys(G3D.yapilar).forEach(function (id) { var y = G3D.yapilar[id]; y.key = 'g3d.yapi.' + id; editable(y, ['ad', 'aciklama']); });
    G3D.kepce.key = 'g3d.kepce'; editable(G3D.kepce, ['ad', 'aciklama']);
    G3D.metinler.key = 'g3d.metin'; editable(G3D.metinler, ['ipucu', 'not']);
  }
  function g3dNesne(tur, kimlik) {
    if (tur === 'yapi') return G3D.yapilar[kimlik];
    if (tur === 'kepce') return G3D.kepce;
    if (tur === 'metin') return G3D.metinler;
    return G3D.bolumler.filter(function (b) { return b.id === kimlik; })[0];
  }
  function g3dKartEki(tur, kimlik, yuva) {
    var o = g3dNesne(tur, kimlik); if (!o) return;
    var a = tur === 'metin' ? adminPart(o.key, o, G3D_METIN_ALAN, 'İpucu ve notu düzenle') : adminPart(o.key, o, G3D_ALAN, 'Düzenle');
    if (a) yuva.appendChild(a);
  }
  function kur3d() {
    if (g3d || !G3D || !window.Gorsel3D) return;
    g3d = window.Gorsel3D.kur($('g3d-kok'), { veri: G3D, veriYolu: 'gorsel3d/', kartEki: g3dKartEki });
  }
  function refresh3d() {
    if (!G3D) return;
    G3D.bolumler.forEach(function (b) { applyOv(b.key, b); });
    Object.keys(G3D.yapilar).forEach(function (id) { applyOv(G3D.yapilar[id].key, G3D.yapilar[id]); });
    applyOv(G3D.kepce.key, G3D.kepce);
    applyOv(G3D.metinler.key, G3D.metinler);
    if (g3d) g3d.yenile();
  }
  // Açık/koyu görünüm değişince yapı renkleri (CSS değişkenleri) yeniden okunur.
  function g3dRenk() { if (g3d) g3d.yenile(); }
  new MutationObserver(g3dRenk).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) { var g3dMq = window.matchMedia('(prefers-color-scheme: dark)'); if (g3dMq.addEventListener) g3dMq.addEventListener('change', g3dRenk); }

  /* ---------- sayfadaki sabit metinler: index.html'de data-k="..." taşıyan her öğe ---------- */
  var STATIC = [];
  document.querySelectorAll('[data-k]').forEach(function (el) {
    var o = { key: 'metin.' + el.getAttribute('data-k'), metin: el.textContent.trim(), el: el };
    editable(o, ['metin']);
    STATIC.push(o);
  });
  function refreshStatic() {
    document.querySelectorAll('.k-admin').forEach(function (x) { x.remove(); });
    STATIC.forEach(function (o) {
      applyOv(o.key, o);
      o.el.textContent = o.metin;
      var a = adminPart(o.key, o, [{ f: 'metin', ad: 'Metin', cok: true }], o.el.getAttribute('data-etiket') || 'Bu yazıyı düzenle');   // data-etiket: yazı ekranda görünmüyorsa ya da yeri belirsizse
      // Bağlantı/düğme içindeki yazının (ör. 3D düğmesi) düzenleme çubuğu dışarıya konur; yoksa dokununca sayfa değişir. Üst satırdakiler satırın altına.
      if (a) ((o.el.closest('.ust-dugmeler') && o.el.closest('.hero')) || o.el.closest('a, button') || o.el).after(h('div', { 'class': 'k-admin' }, [a]));
    });
  }
  // Tüm düzenlenebilir içeriği yeniden çizer (yönetici değişikliği geldiğinde, giriş/çıkışta).
  function refreshContent() { refreshPathway(); refreshReflex(); refreshTarama(); refreshNotes(); refreshDevices(); refresh3d(); refreshStatic(); bildir('odyo:metinler'); }

  /* ---------- servis çalışanı: internetsiz açılma (yalnızca https veya localhost'ta çalışır) ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* desteklenmiyorsa uygulama yine çalışır */ });
  }

  /* ---------- bağlantı ----------
     Vaka kayıtları (Vakalarım): vakalarim.js, yalnızca bu cihazda.
     Ortak içerik (ana sayfa paylaşımları, not, tema): connectShared() Firebase Firestore'a bağlanır.
     Çevrimdışı önbellek açıktır: internet yokken son indirilen paylaşımlar ve notlar gösterilir.
     Düzenleme yetkisi (canEdit): yalnızca ODYOBOT_ADMIN_UID hesabıyla giriş yapılınca açılır.
     Bu yalnızca görünümü belirler; asıl koruma firestore.rules içindedir. */
  function connectShared() {
    if (!window.firebase || !window.ODYOBOT_FIREBASE) return Promise.reject(new Error('Firebase yüklenemedi'));
    firebase.initializeApp(window.ODYOBOT_FIREBASE);
    var db = firebase.firestore();
    var auth = null;
    try { auth = firebase.auth(); } catch (e) { /* giriş modülü yüklenemediyse yalnızca okuma */ }
    return db.enablePersistence({ synchronizeTabs: true })
      .catch(function () { /* önbellek desteklenmiyorsa (ör. gizli sekme) çevrimiçi devam et */ })
      .then(function () { return { db: db, auth: auth }; });
  }

  /* ---------- yönetici girişi ---------- */
  var authRef = null;
  function setEditMode(on, email) {
    canEdit = !!on;
    $('ayar-body').hidden = !canEdit;
    $('ayar-giris').hidden = canEdit;   // girişliyken "Yönetici girişi" düğmesi gizlenir
    $('compose').hidden = !canEdit;
    $('who').textContent = canEdit ? 'Giriş yapan: ' + (email || '') : '';
    // Yalnızca yöneticiye görünen bölümler (ör. OdyoBOT mesaj metinleri) CSS'te .yonetici ile açılır.
    document.documentElement.classList.toggle('yonetici', canEdit);
    if (!canEdit) editingKey = null;
    window.OdyoUI.yonetici = canEdit; bildir('odyo:yetki', canEdit);
    renderNoteAdmin(); refreshContent();
  }
  function authErrorText(err) {
    var c = (err && err.code) || '';
    if (/invalid-credential|wrong-password|user-not-found|invalid-login-credentials/.test(c)) return 'E-posta veya şifre yanlış.';
    if (/invalid-email/.test(c)) return 'E-posta adresi geçerli görünmüyor.';
    if (/too-many-requests/.test(c)) return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.';
    if (/network-request-failed/.test(c)) return 'İnternet bağlantısı yok. Giriş için bağlantı gerekli.';
    if (/user-disabled/.test(c)) return 'Bu hesap devre dışı bırakılmış.';
    if (/operation-not-supported|unsupported/.test(c)) return 'Giriş, dosya olarak açılan sayfada çalışmaz. Uygulamayı web adresinden aç.';
    return 'Giriş yapılamadı.' + (c ? ' (' + c + ')' : '');
  }
  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('l-msg'); msg.className = 'msg'; msg.textContent = '';
    if (!authRef) { msg.textContent = 'Giriş sistemine ulaşılamıyor. Bağlantını kontrol edip sayfayı yeniden aç.'; msg.className = 'msg err'; return; }
    $('l-send').disabled = true;
    authRef.signInWithEmailAndPassword($('l-email').value.trim(), $('l-pass').value).then(function () {
      $('l-pass').value = '';
    }).catch(function (err) {
      msg.textContent = authErrorText(err); msg.className = 'msg err';
    }).then(function () { $('l-send').disabled = false; });
  });
  $('logout').addEventListener('click', function () {
    if (!authRef) return;
    authRef.signOut().then(function () { location.hash = '#anasayfa'; });
  });

  connectShared().then(function (r) {
    var db = r.db;
    dbRef = db; authRef = r.auth;
    window.OdyoUI.db = db; bildir('odyo:db', db);
    setupAyarlar(db);
    if (authRef) authRef.onAuthStateChanged(function (u) {
      var isAdmin = !!u && u.uid === window.ODYOBOT_ADMIN_UID;
      if (u && !isAdmin) {
        authRef.signOut();
        $('l-msg').textContent = 'Bu hesabın düzenleme yetkisi yok.'; $('l-msg').className = 'msg err';
      }
      setEditMode(isAdmin, u && u.email);
      if (isAdmin && location.hash === '#giris') location.hash = '#ayarlar';
    });
  }, function () { window.OdyoUI.dbYok = true; bildir('odyo:db-yok'); });
})();
