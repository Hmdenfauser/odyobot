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
    { id: 'koklea', y: 495, label: 'Koklea', latin: 'Cochlea', abr: 'Yok (OAE ve koklear mikrofonik burada üretilir)',
      yer: 'İç kulak, temporal kemik içinde.',
      islev: 'Mekanik titreşimi iç ve dış tüy hücreleri aracılığıyla elektriksel sinyale çevirir. Tonotopik yapıdadır: taban yüksek, apeks düşük frekanslara yanıt verir.',
      klinik: 'Sensörinöral işitme kaybının en sık yeri. Dış tüy hücre işlevi otoakustik emisyonlarla (OAE) değerlendirilir.' },
    { id: 'n8', y: 430, label: 'Koklear sinir (VIII)', latin: 'N. cochlearis', abr: 'Dalga I (distal) ve II (proksimal)',
      yer: 'Spiral ganglion hücre gövdelerinden çıkar, internal akustik kanaldan geçerek beyin sapına girer.',
      islev: 'İç tüy hücrelerinden gelen bilgiyi koklear çekirdeğe taşır. Tonotopi sinir boyunca korunur.',
      klinik: 'Retrokoklear patolojide (örneğin vestibüler schwannom) ABR’de I–V aralığında uzama görülebilir. Nöropati spektrumunda OAE var, ABR yok ya da bozuktur.' },
    { id: 'cn', y: 365, label: 'Koklear çekirdek', latin: 'Nucleus cochlearis', abr: 'Dalga III (genellikle)',
      yer: 'Beyin sapı, pontomedüller bileşke. Dorsal ve ventral bölümleri vardır.',
      islev: 'İşitsel sinir liflerinin ilk sinaps yeri ve aynı taraflı bir işlem istasyonudur. Buradan çıkan lifler büyük oranda karşı tarafa geçer.',
      klinik: 'Bu düzeydeki lezyonlar ABR’de III. dalga ve sonrasını etkiler.' },
    { id: 'soc', y: 300, label: 'Süperior olivar kompleks', latin: 'Complexus olivaris superior', abr: 'Dalga III–IV (yaklaşık)',
      yer: 'Pons, trapezoid cisim düzeyi.',
      islev: 'İki kulaktan gelen bilgiyi ilk kez birleştirir. Zaman farkı (ITD) ve şiddet farkı (ILD) işlenmesiyle yön bulmanın temelini oluşturur. Akustik refleks arkının da parçasıdır.',
      klinik: 'Bilateral temsil nedeniyle tek taraflı lezyonlar belirgin bir saf ses eşik kaybı vermeyebilir, ancak lokalizasyon ve gürültüde dinleme zorlaşabilir.' },
    { id: 'll', y: 235, label: 'Lateral lemniskus', latin: 'Lemniscus lateralis', abr: 'Dalga IV–V (yaklaşık)',
      yer: 'Pons ve orta beyin arasında yükselen lif demeti ve çekirdekleri.',
      islev: 'Koklear çekirdek ve süperior olivar kompleksten gelen lifleri inferior kolikulusa taşır.',
      klinik: 'ABR’de IV ve V. dalga bileşkesi bu bölgeyle ilişkilendirilir.' },
    { id: 'ic', y: 170, label: 'İnferior kolikulus', latin: 'Colliculus inferior', abr: 'Dalga V (yaklaşık)',
      yer: 'Orta beyin, tektum.',
      islev: 'Çıkan yolakların neredeyse tamamının birleştiği merkezi bir istasyondur. Frekans, şiddet ve zaman bilgisini bütünleştirir.',
      klinik: 'ABR’nin en dayanıklı dalgası olan V. dalga eşik tayininde kullanılır; kaynağı IC ve lateral lemniskus bölgesi olarak kabul edilir.' },
    { id: 'mgb', y: 105, label: 'Medial genikulat cisim', latin: 'Corpus geniculatum mediale', abr: 'Klasik ABR dışı',
      yer: 'Talamus.',
      islev: 'Duyusal bilginin kortekse son aktarım istasyonudur. Dikkat ve geri bildirim döngüleriyle de bağlantılıdır.',
      klinik: 'Talamik lezyonlar nadirdir. Orta ve geç latanslı yanıtlar bu düzeyin üstüne ait olabilir.' },
    { id: 'cortex', y: 40, label: 'İşitsel korteks', latin: 'Cortex auditivus', abr: 'Kortikal yanıtlar (CAEP: P1–N1–P2)',
      yer: 'Temporal lob, Heschl girusu (primer alan, Brodmann 41 ve 42).',
      islev: 'Sesin algılanması, ayrımı ve anlamlandırılması. Primer alanda tonotopi sürer.',
      klinik: 'Yolak iki taraflı olduğundan tek taraflı kortikal lezyon çoğu zaman eşikleri normal bırakır. Dikotik testlerde karşı kulakta zorluk görülebilir (santral işitsel işlem değerlendirmesi).' }
  ];
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
  straight('koklea', 'n8'); straight('n8', 'cn');
  se('line', { x1: XL, y1: byId.cn.y, x2: XR, y2: byId.soc.y, 'class': 'lnk x' }, svg);
  se('line', { x1: XR, y1: byId.cn.y, x2: XL, y2: byId.soc.y, 'class': 'lnk x' }, svg);
  straight('cn', 'soc'); straight('soc', 'll'); straight('ll', 'ic'); straight('ic', 'mgb'); straight('mgb', 'cortex');
  se('text', { x: XL, y: 14, 'class': 'side-label', 'text-anchor': 'middle' }, svg).textContent = 'SAĞ';
  se('text', { x: XR, y: 14, 'class': 'side-label', 'text-anchor': 'middle' }, svg).textContent = 'SOL';
  var groups = {};
  NODES.forEach(function (n, i) {
    var g = se('g', { 'class': 'node', tabindex: '0', role: 'button', 'aria-label': n.label + ', basamak ' + (i + 1) + '/' + NODES.length }, svg);
    se('circle', { cx: XL, cy: n.y, r: 14, 'class': 'c r' }, g);
    se('circle', { cx: XR, cy: n.y, r: 14, 'class': 'c l' }, g);
    se('rect', { x: CX - 85, y: n.y - 17, width: 170, height: 34, rx: 8, 'class': 'pill' }, g);
    se('text', { x: CX, y: n.y }, g).textContent = n.label;
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
    detail.replaceChildren(
      h('div', { 'class': 'card-head' }, [h('h2', { text: n.label }), h('span', { 'class': 'latin', text: n.latin })]),
      h('span', { 'class': 'badge', text: 'ABR: ' + n.abr }),
      h('dl', null, [dlRow('Konum', n.yer), dlRow('İşlev', n.islev), dlRow('Klinik not', n.klinik)]),
      h('div', { 'class': 'stepper' }, [prev, h('span', { 'class': 'pos', text: 'Basamak ' + (idx + 1) + ' / ' + NODES.length }), next])
    );
  }
  select(sel);

  /* ---------- reflex arc diagram ---------- */
  var RX = { r: 92, l: 268 }, RY0 = 62, RDY = 70;
  var RNODES = [
    { id: 'koklea', row: 0, sides: ['r'], label: ['Koklea'], kol: 'Afferent kol', title: 'Koklea (uyaran kulağı)', latin: 'Cochlea',
      yer: 'İç kulak; ses verilen kulak.',
      islev: 'Yeterince şiddetli ses (saf seste genellikle yaklaşık 70–100 dB HL arası) tüy hücrelerinde işlenir ve refleksin duyusal kolunu başlatır.',
      klinik: 'Koklear kayıpta refleks eşiği çoğu zaman saf ses eşiğine göre daha dar bir duyum düzeyinde (SL) ortaya çıkar; bu bulgu rekrutmanla ilişkilendirilir. Ağır kayıplarda refleks alınamayabilir.' },
    { id: 'n8', row: 1, sides: ['r'], label: ['VIII. sinir'], kol: 'Afferent kol', title: 'VIII. sinir (koklear dal)', latin: 'N. cochlearis',
      yer: 'Spiral gangliondan çıkar, internal akustik kanaldan beyin sapına girer.',
      islev: 'Uyaran bilgisini beyin sapındaki ventral koklear çekirdeğe taşır.',
      klinik: 'VIII. sinir veya retrokoklear lezyonda uyaran bu kulaktan verildiğinde ipsilateral ve kontralateral refleksler alınamayabilir ya da yüksek eşikte çıkabilir; refleks decay anormal olabilir.' },
    { id: 'vcn', row: 2, sides: ['r'], label: ['Ventral koklear', 'çekirdek'], kol: 'Beyin sapı', title: 'Ventral koklear çekirdek', latin: 'Nucleus cochlearis ventralis',
      yer: 'Pontomedüller bileşke.',
      islev: 'Refleksin ilk sinaps yeri. Buradan çıkan lifler aynı taraftaki ve karşı taraftaki süperior olivar komplekse ilerler.',
      klinik: 'Beyin sapı lezyonlarında ipsilateral ve kontralateral refleks bulgularının karşılaştırılması lezyon düzeyi için ipucu verir.' },
    { id: 'soc', row: 3, sides: ['r', 'l'], label: ['Süperior olivar', 'kompleks'], kol: 'Beyin sapı', title: 'Süperior olivar kompleks', latin: 'Complexus olivaris superior',
      yer: 'Pons; medial süperior olivar bölge ve trapezoid cisim çevresi.',
      islev: 'İki taraflı bağlantının kurulduğu düğüm. Kontralateral yolun karşıya geçişi bu düzeyde gösterilir.',
      klinik: 'Pontin lezyonlar kontralateral refleksi ipsilateral refleksten daha belirgin bozabilir; yorum tüm refleks bulgularıyla birlikte yapılır.' },
    { id: 'fn', row: 4, sides: ['r', 'l'], label: ['Fasiyal motor', 'çekirdek'], kol: 'Efferent kol', title: 'Fasiyal motor çekirdek (VII)', latin: 'Nucleus nervi facialis',
      yer: 'Pons.',
      islev: 'Stapedius kasını innerve eden motor nöronlar burada bulunur. Süperior olivar kompleksten gelen sinyal bu çekirdeğe ulaşır.',
      klinik: 'Pontin lezyonlar refleks bulgularını ve yüz sinirinin işlevini birlikte etkileyebilir.' },
    { id: 'n7', row: 5, sides: ['r', 'l'], label: ['VII. sinir'], kol: 'Efferent kol', title: 'VII. sinir (stapedius dalı)', latin: 'N. facialis, n. stapedius',
      yer: 'Temporal kemik içinde fasiyal kanalda seyreder.',
      islev: 'Motor komutu stapedius kasına taşır.',
      klinik: 'Stapedius dalının proksimalinde fasiyal sinir lezyonu varsa (örneğin Bell paralizisi veya temporal kemik patolojisi), prob lezyonlu kulaktayken uyaran hangi kulaktan verilirse verilsin refleks alınamaz.' },
    { id: 'stap', row: 6, sides: ['r', 'l'], label: ['Stapedius kası'], kol: 'Efektör', title: 'Stapedius kası', latin: 'M. stapedius',
      yer: 'Orta kulak; stapes boynuna tutunur.',
      islev: 'Kasılınca kemikçik zinciri sertleşir ve kulağın akustik admitansı değişir. Test bu değişimi prob kulağında ölçer.',
      klinik: 'Prob kulağında orta kulak patolojisi (efüzyon, otoskleroz vb.) olduğunda kas kasılsa bile admitans değişimi algılanamaz ve o kulakta refleks alınamaz.' }
  ];
  var rsvg = $('reflex'), rsel = 'soc', rgroups = {};
  function ry(row) { return RY0 + row * RDY; }
  function rline(x1, y1, x2, y2, cls) { se('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'class': 'lnk ' + cls }, rsvg); }
  for (var ri = 0; ri < 6; ri++) rline(RX.r, ry(ri) + 20, RX.r, ry(ri + 1) - 20, 'r');
  for (ri = 3; ri < 6; ri++) rline(RX.l, ry(ri) + 20, RX.l, ry(ri + 1) - 20, 'l');
  rline(RX.r, ry(2) + 20, RX.l, ry(3) - 20, 'x');
  se('text', { x: RX.r, y: 16, 'class': 'side-label', 'text-anchor': 'middle' }, rsvg).textContent = 'SAĞ (UYARILAN)';
  se('text', { x: RX.l, y: 16, 'class': 'side-label', 'text-anchor': 'middle' }, rsvg).textContent = 'SOL (KARŞI)';
  RNODES.forEach(function (n, idx) {
    var g = se('g', { 'class': 'node', tabindex: '0', role: 'button', 'aria-label': n.title + ', basamak ' + (idx + 1) + '/' + RNODES.length }, rsvg);
    n.sides.forEach(function (s) {
      var x = RX[s], y = ry(n.row);
      se('rect', { x: x - 70, y: y - 20, width: 140, height: 40, rx: 8, 'class': 'pill ' + s }, g);
      var t = se('text', { x: x, y: y }, g);
      if (n.label.length === 1) { t.textContent = n.label[0]; }
      else {
        se('tspan', { x: x, y: y - 8 }, t).textContent = n.label[0];
        se('tspan', { x: x, y: y + 8 }, t).textContent = n.label[1];
      }
    });
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
    rdetail.replaceChildren(
      h('div', { 'class': 'card-head' }, [h('h2', { text: n.title }), h('span', { 'class': 'latin', text: n.latin })]),
      h('span', { 'class': 'badge', text: n.kol }),
      h('dl', null, [dlRow('Konum', n.yer), dlRow('İşlev', n.islev), dlRow('Klinik not', n.klinik)]),
      h('div', { 'class': 'stepper' }, [prev, h('span', { 'class': 'pos', text: 'Basamak ' + (idx + 1) + ' / ' + RNODES.length }), next])
    );
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
  function renderNotes(q) {
    var box = $('notes-list');
    var qq = (q || '').trim().toLocaleLowerCase('tr');
    var shown = NOTES.concat(customNotes).filter(function (n) {
      if (!qq) return true;
      return (n.t + ' ' + n.p.join(' ')).toLocaleLowerCase('tr').indexOf(qq) !== -1;
    });
    if (!shown.length) { box.replaceChildren(h('div', { 'class': 'empty', text: 'Bu aramayla eşleşen not yok.' })); return; }
    box.replaceChildren.apply(box, shown.map(function (n) {
      var d = h('details', { 'class': 'ns' }, [
        h('summary', { text: n.t }),
        h('ul', null, n.p.map(function (x) { return h('li', { text: x }); }))
      ]);
      if (qq) d.open = true;
      return d;
    }));
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
  var TABS = ['anasayfa', 'depo', 'odybot', 'notlar', 'gecmis', 'ayarlar'];
  function route() {
    var t = (location.hash || '').replace('#', '');
    if (TABS.indexOf(t) === -1) t = 'anasayfa';
    document.querySelectorAll('section[data-tab]').forEach(function (s) { s.hidden = s.id !== t; });
    document.querySelectorAll('nav.tabs a').forEach(function (a) {
      if (a.getAttribute('data-go') === t) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  window.addEventListener('hashchange', route);
  route();

  /* ---------- shared data: duyurular ---------- */
  var duyurular = [], canEdit = false, dbRef = null, loadedDuyuru = false;
  var armedId = null, armedTimer = null;

  function dateLabelFor(tur) { return tur === 'ilan' ? 'Son başvuru' : 'Etkinlik tarihi'; }
  function sortItems(arr) {
    var t = todayISO();
    var up = arr.filter(function (x) { return !x.tarih || x.tarih >= t; });
    var pa = arr.filter(function (x) { return x.tarih && x.tarih < t; });
    up.sort(function (a, b) { return (a.tarih || '9999') < (b.tarih || '9999') ? -1 : 1; });
    pa.sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; });
    return up.concat(pa);
  }
  function renderDuyuru() {
    ['ilan', 'haber'].forEach(function (tur) {
      var box = $('list-' + tur);
      var items = sortItems(duyurular.filter(function (d) { return d.tur === tur; }));
      $('n-' + tur).textContent = items.length ? items.length + ' kayıt' : '';
      if (!loadedDuyuru) return;
      if (!items.length) {
        box.replaceChildren(h('div', { 'class': 'empty', text: tur === 'ilan'
          ? 'Şu an güncel ilan yok. Yeni ilanlar eklendiğinde burada görünür.'
          : 'Şu an duyurulmuş sempozyum veya kongre yok. Yeni haberler eklendiğinde burada görünür.' }));
        return;
      }
      var today = todayISO();
      box.replaceChildren.apply(box, items.map(function (d) {
        var past = d.tarih && d.tarih < today;
        var top = h('div', { 'class': 'item-top' }, [h('div', { 'class': 'item-title', text: d.baslik || '' })]);
        if (past) top.appendChild(h('span', { 'class': 'tag', text: 'Geçti' }));
        var card = h('div', { 'class': 'item' + (past ? ' past' : '') }, [top]);
        if (d.kurum) card.appendChild(h('div', { 'class': 'meta', text: d.kurum }));
        if (d.tarih) card.appendChild(h('div', { 'class': 'meta', text: dateLabelFor(d.tur) + ': ' + fmtDate(d.tarih) }));
        if (d.not) card.appendChild(h('div', { text: d.not }));
        var l = safeLink(d.link);
        if (l) card.appendChild(h('a', { 'class': 'go', href: l, target: '_blank', rel: 'noopener noreferrer', text: 'Bağlantıyı aç ↗' }));
        if (canEdit) {
          var del = h('button', { 'class': 'linkbtn', type: 'button', text: armedId === d.id ? 'Emin misin? Sil' : 'Sil' });
          if (armedId === d.id) del.classList.add('danger');
          del.addEventListener('click', function () {
            if (armedId !== d.id) {
              armedId = d.id; clearTimeout(armedTimer);
              armedTimer = setTimeout(function () { armedId = null; renderDuyuru(); }, 4000);
              renderDuyuru(); return;
            }
            armedId = null; clearTimeout(armedTimer);
            dbRef.collection('duyurular').doc(d.id).delete().catch(function () {
              $('f-msg').textContent = 'Silinemedi. Bağlantını kontrol edip tekrar dene.'; $('f-msg').className = 'msg err';
            });
          });
          card.appendChild(h('div', { 'class': 'admin-bar' }, [del]));
        }
        return card;
      }));
    });
  }
  $('f-tur').addEventListener('change', function () {
    $('f-tarih-l').textContent = $('f-tur').value === 'ilan' ? 'Son başvuru tarihi' : 'Etkinlik tarihi';
  });
  $('duyuru-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('f-msg'); msg.className = 'msg';
    if (!dbRef) { msg.textContent = 'Veri deposuna ulaşılamıyor.'; msg.className = 'msg err'; return; }
    var link = $('f-link').value.trim();
    if (link && !safeLink(link)) { msg.textContent = 'Bağlantı https:// ile başlamalı.'; msg.className = 'msg err'; return; }
    var doc = {
      tur: $('f-tur').value, baslik: $('f-baslik').value.trim(), kurum: $('f-kurum').value.trim(),
      tarih: $('f-tarih').value, link: link, not: $('f-not').value.trim(), olusturma: Date.now()
    };
    if (!doc.baslik) { msg.textContent = 'Başlık gerekli.'; msg.className = 'msg err'; return; }
    $('f-send').disabled = true;
    dbRef.collection('duyurular').add(doc).then(function () {
      $('duyuru-form').reset(); $('f-tarih-l').textContent = 'Son başvuru tarihi';
      msg.textContent = 'Yayınlandı. Herkes görebilir.';
    }).catch(function () {
      msg.textContent = 'Yayınlanamadı. Düzenleme yetkin olmayabilir ya da bağlantı kesilmiş olabilir.'; msg.className = 'msg err';
    }).then(function () { $('f-send').disabled = false; });
  });

  /* ---------- kişisel veri: vaka geçmişi (yalnızca bu cihazda) ---------- */
  var vakaDb = makeLocalDb(), VAKA = 'vakalar';
  var vakalar = [], loadedGecmis = false;
  $('g-tarih').value = todayISO();
  function renderGecmis() {
    var box = $('g-list');
    if (!loadedGecmis) return;
    if (!vakalar.length) {
      box.replaceChildren(h('div', { 'class': 'empty', text: 'Henüz kayıtlı vaka yok. Yukarıdan ilk vakanı ekle.' }));
      return;
    }
    box.replaceChildren.apply(box, vakalar.map(function (v) {
      var top = h('div', { 'class': 'item-top' }, [h('div', { 'class': 'item-title', text: v.etiket || '' }), h('span', { 'class': 'tag', text: fmtDate(v.tarih) })]);
      var card = h('div', { 'class': 'item' }, [top]);
      if (v.not) card.appendChild(h('div', { text: v.not, style: 'white-space:pre-wrap;overflow-wrap:anywhere' }));
      var del = h('button', { 'class': 'linkbtn', type: 'button', text: armedId === 'g' + v.id ? 'Emin misin? Sil' : 'Sil' });
      if (armedId === 'g' + v.id) del.classList.add('danger');
      del.addEventListener('click', function () {
        if (armedId !== 'g' + v.id) {
          armedId = 'g' + v.id; clearTimeout(armedTimer);
          armedTimer = setTimeout(function () { armedId = null; renderGecmis(); }, 4000);
          renderGecmis(); return;
        }
        armedId = null; clearTimeout(armedTimer);
        vakaDb.collection(VAKA).doc(v.id).delete().catch(function () {
          $('g-msg').textContent = 'Silinemedi.'; $('g-msg').className = 'msg err';
        });
      });
      card.appendChild(h('div', { 'class': 'admin-bar' }, [del]));
      return card;
    }));
  }
  $('gecmis-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('g-msg'); msg.className = 'msg';
    var doc = { etiket: $('g-etiket').value.trim(), tarih: $('g-tarih').value || todayISO(), not: $('g-not').value.trim(), olusturma: Date.now() };
    if (!doc.etiket) { msg.textContent = 'Vaka etiketi gerekli.'; msg.className = 'msg err'; return; }
    $('g-send').disabled = true;
    vakaDb.collection(VAKA).add(doc).then(function () {
      $('gecmis-form').reset(); $('g-tarih').value = todayISO(); msg.textContent = 'Kaydedildi.';
    }).catch(function () {
      msg.textContent = 'Kaydedilemedi. Tarayıcının depolama alanı dolu ya da kapalı olabilir (örneğin gizli sekmede).'; msg.className = 'msg err';
    }).then(function () { $('g-send').disabled = false; });
  });

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
    $('gear').hidden = !canEdit; $('ayar-body').hidden = !canEdit; $('ayar-denied').hidden = canEdit;
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
  }

  /* ---------- yerel depo: veriyi yalnızca bu cihazın tarayıcısında (localStorage) tutar ----------
     Vaka geçmişi her zaman buradadır ve hiçbir sunucuya gönderilmez (CLAUDE.md §5, §8).
     Yazma başarısız olursa (depolama dolu/kapalı) hata fırlatır; çağıran taraf Promise reddi olarak görür. */
  function makeLocalDb() {
    var listeners = {};
    function read(p) { try { return JSON.parse(localStorage.getItem('odybot:' + p) || '{}'); } catch (e) { return {}; } }
    function write(p, o) { localStorage.setItem('odybot:' + p, JSON.stringify(o)); }
    function attempt(fn) { try { fn(); return Promise.resolve(); } catch (e) { return Promise.reject(e); } }
    function fire(p) { (listeners[p] || []).forEach(function (f) { f(); }); }
    function query(p, field, dir) {
      return {
        limit: function () { return this; },
        orderBy: function (f, d) { return query(p, f, d); },
        onSnapshot: function (next) {
          function emit() {
            var o = read(p);
            var docs = Object.keys(o).map(function (id) { return { id: id, data: function () { return o[id]; } }; });
            if (field) docs.sort(function (a, b) {
              var x = a.data()[field] || 0, y = b.data()[field] || 0;
              return dir === 'desc' ? y - x : x - y;
            });
            next({ docs: docs });
          }
          (listeners[p] = listeners[p] || []).push(emit);
          emit();
          return function () { listeners[p] = listeners[p].filter(function (f) { return f !== emit; }); };
        }
      };
    }
    function docRef(p, id) {
      return {
        delete: function () { return attempt(function () { var o = read(p); delete o[id]; write(p, o); fire(p); }); },
        set: function (d) { return attempt(function () { var o = read(p); o[id] = d; write(p, o); fire(p); }); },
        update: function (d) { return attempt(function () { var o = read(p); o[id] = Object.assign(o[id] || {}, d); write(p, o); fire(p); }); },
        onSnapshot: function (next) {
          function emit() { var o = read(p); next({ exists: !!o[id], data: function () { return o[id]; } }); }
          (listeners[p] = listeners[p] || []).push(emit);
          emit();
          return function () { listeners[p] = listeners[p].filter(function (f) { return f !== emit; }); };
        }
      };
    }
    return {
      collection: function (p) {
        var q = query(p);
        q.add = function (d) {
          return attempt(function () {
            var o = read(p);
            o['l' + Date.now() + Math.random().toString(36).slice(2, 6)] = d;
            write(p, o); fire(p);
          });
        };
        q.doc = function (id) { return docRef(p, id); };
        return q;
      },
      doc: function (path) { var a = path.split('/'); return docRef(a[0], a[1]); }
    };
  }

  /* ---------- bağlantı ----------
     Vaka geçmişi: her zaman yerel depo (vakaDb).
     Ortak içerik (ilan, haber, not, tema): connectShared() Firebase Firestore'a bağlanır.
     Çevrimdışı önbellek açıktır: internet yokken son indirilen ilan ve notlar gösterilir.
     Düzenleme yetkisi (canEdit) admin girişi eklenene kadar kapalı. */
  function connectShared() {
    if (!window.firebase || !window.ODYOBOT_FIREBASE) return Promise.reject(new Error('Firebase yüklenemedi'));
    firebase.initializeApp(window.ODYOBOT_FIREBASE);
    var db = firebase.firestore();
    return db.enablePersistence({ synchronizeTabs: true })
      .catch(function () { /* önbellek desteklenmiyorsa (ör. gizli sekme) çevrimiçi devam et */ })
      .then(function () { return { db: db, canEdit: false }; });
  }

  vakaDb.collection(VAKA).orderBy('olusturma', 'desc').limit(200).onSnapshot(function (snap) {
    loadedGecmis = true;
    vakalar = snap.docs.map(function (d) { var o = d.data() || {}; o.id = d.id; return o; });
    renderGecmis();
  });

  function unreachable() {
    if (loadedDuyuru) return;
    ['ilan', 'haber'].forEach(function (t) { $('list-' + t).replaceChildren(h('div', { 'class': 'empty', text: 'Duyurulara şu an ulaşılamıyor. Bağlantını kontrol edip sayfayı yeniden aç.' })); });
  }
  var giveUp = setTimeout(unreachable, 10000);
  connectShared().then(function (r) {
    var db = r.db;
    dbRef = db; canEdit = !!r.canEdit;
    if (canEdit) { $('compose').hidden = false; $('admin-note').hidden = false; }
    setupAyarlar(db);
    db.collection('duyurular').orderBy('olusturma', 'desc').limit(200).onSnapshot(function (snap) {
      clearTimeout(giveUp); loadedDuyuru = true;
      duyurular = snap.docs.map(function (d) { var o = d.data() || {}; o.id = d.id; return o; });
      renderDuyuru();
    }, function () { clearTimeout(giveUp); unreachable(); });
  }, function () { clearTimeout(giveUp); unreachable(); });
})();
