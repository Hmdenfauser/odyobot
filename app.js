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
  var SEGS = ['yolak', 'refleks', 'cihaz'];
  function seg(which) {
    SEGS.forEach(function (s) {
      $('seg-' + s).setAttribute('aria-pressed', s === which ? 'true' : 'false');
      $('p-' + s).hidden = s !== which;
    });
  }
  SEGS.forEach(function (s) { $('seg-' + s).addEventListener('click', function () { seg(s); }); });

  /* ---------- tabs ---------- */
  var TABS = ['anasayfa', 'depo', 'odybot', 'notlar', 'vakalarim', 'ayarlar', 'giris'];
  var oncekiHash = '';
  function route() {
    var t = (location.hash || '').replace('#', '');
    var ham = t, duyuru = t.indexOf('duyuru/') === 0;
    if (duyuru) t = 'anasayfa';
    // Eski adres: Geçmiş sekmesinin adı Vakalarım oldu; eski bağlantılar da çalışsın.
    if (t === 'gecmis') { t = 'vakalarim'; try { history.replaceState(null, '', '#vakalarim'); } catch (e) {} }
    if (TABS.indexOf(t) === -1) t = 'anasayfa';
    document.querySelectorAll('section[data-tab]').forEach(function (s) { s.hidden = s.id !== t; });
    document.querySelectorAll('nav.tabs a').forEach(function (a) {
      if (a.getAttribute('data-go') === t) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var oncekiDuyuru = oncekiHash.indexOf('duyuru/') === 0;
    oncekiHash = ham;
    if (duyuru || oncekiDuyuru) return; // ayrıntı sayfası açılıp kapanırken akıştaki yer korunur
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  window.addEventListener('hashchange', route);
  route();

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
  var DEVICES = [
    { id: 'bte', grup: 'isitme', ad: 'Kulak arkası (BTE)', img: 'bte.jpg' },
    { id: 'ric', grup: 'isitme', ad: 'Hoparlörü kanalda (RIC)', img: 'ric.jpg' },
    { id: 'ite-tam', grup: 'isitme', ad: 'Kulak içi, tam konka (ITE)', img: 'ite-tam.jpg' },
    { id: 'ite-yarim', grup: 'isitme', ad: 'Kulak içi, yarım konka (ITE)', img: 'ite-yarim.jpg' },
    { id: 'itc', grup: 'isitme', ad: 'Kanal içi (ITC)', img: 'itc.jpg' },
    { id: 'cic', grup: 'isitme', ad: 'Tamamen kanal içi (CIC)', img: 'cic.jpg' },
    { id: 'iic', grup: 'isitme', ad: 'Görünmez kanal içi (IIC)', img: 'iic.jpg' },
    { id: 'kemik-bant', grup: 'isitme', ad: 'Kemik iletimli, bantlı', img: 'kemik-bant.jpg' },
    { id: 'ki', grup: 'implant', ad: 'Koklear implant', img: 'ki.jpg' },
    { id: 'ki-elektrot', grup: 'implant', ad: 'Elektrot dizisi karşılaştırması', img: 'ki-elektrot.jpg',
      alt: 'Solda lateral duvar elektrodu, sağda perimodiolar elektrot.' },
    { id: 'eas', grup: 'implant', ad: 'Elektroakustik stimülasyon (EAS)', img: 'eas.jpg' },
    { id: 'baha-perkutan', grup: 'implant', ad: 'Perkütan kemik iletim implantı', img: 'baha-perkutan.jpg' },
    { id: 'transkutan-pasif', grup: 'implant', ad: 'Pasif transkütanöz kemik iletim implantı', img: 'transkutan-pasif.jpg' },
    { id: 'transkutan-aktif', grup: 'implant', ad: 'Aktif transkütanöz kemik iletim implantı', img: null },
    { id: 'orta-kulak-yarim', grup: 'implant', ad: 'Orta kulak implantı, yarı implante', img: 'orta-kulak-yarim.jpg' },
    { id: 'orta-kulak-tam', grup: 'implant', ad: 'Orta kulak implantı, tam implante', img: 'orta-kulak-tam.jpg' },
    { id: 'abi-yuzey', grup: 'implant', ad: 'İşitsel beyin sapı implantı (ABI), yüzey elektrotlu', img: null },
    { id: 'abi-penetran', grup: 'implant', ad: 'Penetran ABI', img: 'abi-penetran.jpg' }
  ];
  var devText = {};
  var CIHAZ_ALAN = [{ f: 'ad', ad: 'Cihaz adı' }, { f: 'alt', ad: 'Görsel altı not (isteğe bağlı)' }];
  DEVICES.forEach(function (d) { if (!d.alt) d.alt = ''; d.key = 'cihaz.' + d.id; editable(d, ['ad', 'alt']); });
  function renderDevices() {
    ['isitme', 'implant'].forEach(function (g) {
      var box = $('dev-' + g);
      box.replaceChildren.apply(box, DEVICES.filter(function (d) { return d.grup === g; }).map(deviceCard));
    });
  }
  function deviceCard(d) {
    var maddeler = devText[d.id] || [];
    var card = h('article', { 'class': 'item dev' }, [
      d.img
        ? h('img', { 'class': 'dev-img', src: 'images/devices/' + d.img, alt: d.ad, loading: 'lazy' })
        : h('div', { 'class': 'dev-img dev-ph', text: 'Görsel yenilenecek' }),
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
    renderDevices();
  }
  renderDevices();

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
      var a = adminPart(o.key, o, [{ f: 'metin', ad: 'Metin', cok: true }], 'Bu yazıyı düzenle');
      if (a) o.el.after(h('div', { 'class': 'k-admin' }, [a]));
    });
  }
  // Tüm düzenlenebilir içeriği yeniden çizer (yönetici değişikliği geldiğinde, giriş/çıkışta).
  function refreshContent() { refreshPathway(); refreshReflex(); refreshNotes(); refreshDevices(); refreshStatic(); bildir('odyo:metinler'); }

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
    $('gear').hidden = !canEdit;
    $('ayar-body').hidden = !canEdit;
    $('ayar-denied').hidden = canEdit;
    $('compose').hidden = !canEdit;
    $('login-link').hidden = canEdit;
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
