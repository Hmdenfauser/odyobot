/* Maskeleme kurallarının testleri: Katz, 7. baskı, Bölüm 6 örnekleri (Şekil 6.4–6.15). Çalıştırma: node testler/maskeleme-test.js */
const M=require('../maskeleme-kural.js');
let ok=0,hata=0;function es(ad,a,b){const g=JSON.stringify(a)===JSON.stringify(b);if(g)ok++;else{hata++;console.log('HATA',ad,'beklenen',JSON.stringify(b),'gelen',JSON.stringify(a));}}
function E(o){const r={};for(const f in o){const x=o[f];r[f]=typeof x==='number'?{db:x}:x;}return r;}
function vaka(sagH,sagK,solH,solK,konusma){return{esik:{sag:{hava:E(sagH||{}),kemik:E(sagK||{})},sol:{hava:E(solH||{}),kemik:E(solK||{})}},konusma:konusma||{}};}
function karar(s,yol,k){const o={};s[yol].filter(x=>x.kulak===k).forEach(x=>o[x.f]=x.gerekli?'Evet':'Hayır');return o;}

// Şekil 6.4 (s.83-84): maskesiz kemik (sol kulakta ">") 0,5,25,30,40; 8000 yok
const v64=vaka({250:55,500:60,1000:80,2000:90,4000:95,8000:100},{}, {250:20,500:25,1000:30,2000:35,4000:40,8000:45},{250:0,500:5,1000:25,2000:30,4000:40});
let s=M.degerlendir(v64,'supra');
es('6.4 supra sağ',karar(s,'hava','sag'),{250:'Evet',500:'Evet',1000:'Evet',2000:'Evet',4000:'Evet',8000:'Evet'});
es('6.4 supra sol',karar(s,'hava','sol'),{250:'Hayır',500:'Hayır',1000:'Hayır',2000:'Hayır',4000:'Hayır',8000:'Hayır'});
es('6.4 8000 ön karar',s.hava.find(x=>x.kulak==='sag'&&x.f===8000).onKarar,true);
s=M.degerlendir(v64,'insert');
es('6.4 insert sağ',karar(s,'hava','sag'),{250:'Hayır',500:'Hayır',1000:'Hayır',2000:'Evet',4000:'Evet',8000:'Evet'});
// başlangıç (s.93): KK hava + 10 → sağ 1000 Hz: sol hava 30 + 10 = 40
s=M.degerlendir(v64,'supra');
es('6.4 başlangıç 1000',s.hava.find(x=>x.kulak==='sag'&&x.f===1000).baslangic,40);

// Şekil 6.5 (s.85-86) kemik yolu: A: iki kulakta ABG ≤10 → gerekmez
const v65A=vaka({250:45,500:40,1000:45,2000:40,4000:45,8000:45},{250:35,500:35,1000:40,2000:35,4000:40},{250:40,500:45,1000:40,2000:40,4000:45,8000:50},{});
s=M.degerlendir(v65A,'supra'); es('6.5A sağ kemik',Object.values(karar(s,'kemik','sag')).every(x=>x==='Hayır'),true);
// B: sol ABG yok, sağ ABG 24-35 → yalnız sağ (maskesiz kemik sol kulakta ölçülmüş)
const v65B=vaka({250:70,500:70,1000:80,2000:80,4000:80,8000:85},{}, {250:40,500:40,1000:45,2000:50,4000:55,8000:60},{250:35,500:40,1000:45,2000:50,4000:55});
s=M.degerlendir(v65B,'supra');
es('6.5B sol kemik',Object.values(karar(s,'kemik','sol')).every(x=>x==='Hayır'),true);
// sağın kemik kararı: sağda kemik eşiği yok; ABG sağ = 70-35... (sol maskesiz kemik görünürdeki eşik) -> kemikKarari yalnız ölçülen frekanslarda; sağ için yok
es('6.5B sağ kemik karar sayısı',s.kemik.filter(x=>x.kulak==='sag').length,0);
// C: iki kulakta 30-35 ABG
const v65C=vaka({250:35,500:30,1000:30,2000:35,4000:35,8000:35},{250:0,500:0,1000:0,2000:0,4000:0},{250:35,500:35,1000:30,2000:35,4000:30,8000:35},{});
s=M.degerlendir(v65C,'supra'); es('6.5C sağ kemik',Object.values(karar(s,'kemik','sag')).every(x=>x==='Evet'),true);

// Şekil 6.8 (s.93-95), 500 Hz: KK (sağ) hava 5, kemik 5; TK sol hava 65
const v68=vaka({500:5},{500:5},{500:65},{500:{db:5,maskeli:false}});
s=M.degerlendir(v68,'supra');
const h68=s.hava.find(x=>x.kulak==='sol');
es('6.8 hava gerekli',h68.gerekli,true); es('6.8 hava başlangıç',h68.baslangic,15);
es('6.8 en çok (KAA 40 ile)',h68.enCok.db,5+40-5);
// kemik yolu başlangıç 500 Hz kulak üstü: 5 + 20 + 10 = 35 (TK sol'da ABG 60 ≥ 15)
const v68b=vaka({500:5},{500:5},{500:85},{500:5});
const k68=M.degerlendir(v68b,'supra').kemik.find(x=>x.kulak==='sol');
es('6.8 kemik başlangıç',k68.baslangic,35); es('6.8 kemik TE',k68.te,20);
// insert TE 500 = 10 → 25
es('6.8 kemik insert',M.degerlendir(v68b,'insert').kemik.find(x=>x.kulak==='sol').baslangic,25);
// KK'de ABG ≥20 → TE eklenmez
const vTE=vaka({500:40},{500:15},{500:85},{});
const kTE=M.degerlendir(vTE,'supra').kemik.find(x=>x.kulak==='sag'); // sağ kemik: TK sağ hava 40 - kemik 15 = 25 ≥15
es('TE atlanır: KK sol ABG',[kTE.gerekli,kTE.te,kTE.teAtlandi,kTE.baslangic],[true,0,true,95]);

// Şekil 6.6/6.7 konuşma (s.87-90)
// 6.7: iki kulak normal, SRT 0, sunum 50, KK en iyi kemik 0
const v67=vaka({250:0,500:0,1000:0},{250:0,500:0,1000:0},{250:0,500:0,1000:0},{250:0,500:0,1000:0},{sag:{srt:0,sunum:50},sol:{srt:0,sunum:50}});
es('6.7 supra SDS',M.degerlendir(v67,'supra').konusma[0].sds.gerekli,true);
es('6.7 insert SDS',M.degerlendir(v67,'insert').konusma[0].sds.gerekli,false);

// Şekil 6.14 (s.105-107): TK sol, sunum 95, SRT 55; KK sağ hava 35, maskesiz kemik 30 (ABG 5); TK sol maskeli kemik 45..
const v614=vaka({250:35,500:35,1000:35,2000:35,4000:35},{250:30,500:30,1000:30,2000:30,4000:30},
  {250:50,500:50,1000:55,2000:55,4000:60},{250:{db:45,maskeli:true},500:{db:45,maskeli:true},1000:{db:50,maskeli:true},2000:{db:50,maskeli:true},4000:{db:55,maskeli:true}},
  {sag:{srt:35},sol:{srt:55,sunum:95}});
let k=M.degerlendir(v614,'supra').konusma.find(x=>x.kulak==='sol').sds;
es('6.14 supra',[k.gerekli,k.enAz,k.enCok,k.orta,k.sade,k.sadeUygun],[true,60,80,70,75,true]);
k=M.degerlendir(v614,'insert').konusma.find(x=>x.kulak==='sol').sds;
es('6.14 insert',[k.gerekli,k.enAz,k.enCok,k.orta],[true,40,100,70]);

// Şekil 6.15 (s.108-109): insert, TK sol sunum 100 SRT 70, KK sağ kemik 0, ABG 0, TK en iyi kemik 55
const v615=vaka({250:0,500:0,1000:0,2000:0,4000:0},{250:0,500:0,1000:0,2000:0,4000:0},
  {250:65,500:70,1000:65,2000:65,4000:65},{250:{db:55,maskeli:true},500:{db:60,maskeli:true},1000:{db:60,maskeli:true},2000:{db:65,maskeli:true},4000:{db:65,maskeli:true}},
  {sag:{srt:0},sol:{srt:70,sunum:100}});
k=M.degerlendir(v615,'insert').konusma.find(x=>x.kulak==='sol').sds;
es('6.15 insert',[k.enAz,k.enCok,k.orta,k.sade],[40,110,75,80]);

// Şekil 6.11 plato (s.98): model: duyar = ton>=T || ton>=max(15,maske)+IA
function sim(T,IA,bas){let d=M.platoBasla(75,bas,null);let g=0;while(!d.bitti&&g++<200){const duydu=d.ton>=T||d.ton>=Math.max(15,d.maske)+IA;d=M.platoCevap(d,duydu);}return d.sonuc;}
es('6.11 sonuç 1',sim(75,70,25),{tur:'plato',esik:75,maske:40});
es('6.11 sonuç 2',sim(95,60,25).esik,95);
es('6.11 sonuç 3',sim(999,60,25).tur,'cevapYok');
// aynı girdi aynı sonuç
es('belirlenimci',JSON.stringify(M.degerlendir(v614,'supra')),JSON.stringify(M.degerlendir(v614,'supra')));
// Tahmini en çok düzey: tek taraflı ileri SN kayıpta kesin 'ikilem' değil 'ikilemTahmini' (s. 95)
const vSN=vaka({250:10},{250:5},{250:70},{250:5});
const kSN=M.degerlendir(vSN,'supra').kemik.find(x=>x.kulak==='sol');
es('tahmini ikilem',[kSN.baslangic,kSN.enCok.db,kSN.enCok.tahmini,kSN.uyarilar],[50,40,true,['ikilemTahmini']]);
// Maskeli kemik bilinince kesin uyarı
const vSN2=vaka({250:10},{250:5},{250:70},{250:{db:20,maskeli:true}});
const hSN2=M.degerlendir(vSN2,'supra').hava.find(x=>x.kulak==='sol');
es('kesin en çok',[hSN2.enCok.db,hSN2.enCok.tahmini,hSN2.uyarilar],[55,false,[]]);
if(hata)process.exitCode=1;
console.log(ok+' başarılı, '+hata+' hatalı');
