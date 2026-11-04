import {PALETTE} from './theme/colors.js';
import {hintLadder,rowsAfterHints} from './core/hints.js';
import {applyCombo,comboLabel,comboNeeds,comboMultiplier} from './core/combo.js';
import './theme/tokens.css';
import './styles.css';
import {frameInterval,worldCovered} from './ui/canvasCover.js';
import {recordBook as recordSetBook,backfill as backfillSets} from './sets/sets.js';
import {setsBook,toastSetsDone} from './sets/ui.js';
import {recapHTML,bindRecap,finalHTML} from './ui/results.js';
import './ui/results.css';
import './ui/card.css';
import './ui/reveal.css';
import {playReveal} from './ui/reveal.js';
import * as core from './core/index.js';
import {Sfx,Feel} from './feel.js';
import {judgeAnswer,prepareWords,startModelLoad,onModelStatus,modelStatus,whenReady} from './scorer/index.js';
import {homeHTML,bookify,BOOK_PAGES} from './ui/home.js';
import './ui/home.css';
import {descendInto} from './ui/descend.js';
import {travelEase,travelMs} from './ui/camMotion.js';
import {initA11y} from './ui/a11y.js';
import {initKeys} from './ui/keys.js';
import {initTopbar} from './ui/topbar.js';
import {reducedMotion} from './ui/settings.js';
import {initTransitions} from './ui/transitions.js';
import {coverWorld,liftWorld} from './ui/screenFx.js';
import './ui/screenFx.css';
import {deepWall,deepProp,deepProps} from './ui/floorArt.js';
import {initBrowse} from './ui/browse.js';
import {pullX as pullXAt} from './core/pull.js';
import {fitSpine,spineFont,resetSpineMeasure} from './ui/spineLabel.js';
import {loreCovered as loreCoveredAt} from './ui/loreCover.js';
import {isLore,drawLoreMark,drawLoreGlow,hitLoreBook,initLore} from './ui/lore.js';
import './ui/lore.css';
import {isCurio,drawCurioMark,hitCurio,initCurios} from './ui/curios.js';
import './ui/curios.css';
import {shelfBook,statsBook} from './ui/bookMenus.js';
import {replayLayout,ROMAN} from './core/replay.js';
import {snapshotRun,resumable} from './core/dailyRun.js';
import {dailyBook} from './ui/dailyBook.js';
import './ui/dailyBook.css';
import './ui/bookpages.css';
import './ui/bookStyle.css';
import './ui/statsPages.css';
import './ui/fonts.css';
import {drawLedge,initLedge} from './ui/ledge.js';
import {drawAlcoveLanterns} from './ui/lanterns.js';
import {drawFloorAtmosphere} from './ui/floorAtmosphere.js';
import './ui/ledge.css';
import './ui/buttons.css';
import './ui/tactile.css';
import { particleVisibility } from './ui/particleMask.js';
import './ui/polish.css';
import './ui/runScreen.css';
import {paintRun} from './ui/runScreen.js';
import {hintSlipHtml,hintButtonLabel,skipButtonLabel} from './ui/hintSlips.js';
import './ui/hintSlips.css';
const {TIERS,tierOf,WORDS,hashStr,mulberry,levelUpdate,levelTitle,pickWord,dailyWords,loadWords,computeStats,FLOORS,FT,floorAtRow,floorAtFt,floorStartFt,atmosphereAt,msUntilNextDaily,fmtCountdown}=core;
const wordsReady=loadWords();let wordsLoaded=false;wordsReady.then(()=>{wordsLoaded=true;},()=>{wordsLoaded=true;});
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=reducedMotion();
const sleep=ms=>new Promise(r=>setTimeout(r,RM?Math.min(ms,30):ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* storage */
const mem={};
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return k in mem?mem[k]:d}},set(k,v){mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let S=Object.assign({shelf:[],daily:{},streak:{last:'',n:0},bestDepth:0,bestFloor:0,sound:false},store.get('deepstack.v1',{}));
S.rating=core.loadRating(S.rating);
const save=()=>store.set('deepstack.v1',S);
backfillSets(S);
const utc=()=>new Date().toISOString().slice(0,10);
const dailyNo=()=>Math.max(1,core.dailyNumber(utc()));
const HINT_LABEL={sentence:'used in a sentence',synonym:'a related word',opening:'how the definition begins'};
function applySound(){const b=$('#bSound');b.setAttribute('aria-pressed',S.sound);Sfx.set(S.sound);}
$('#bSound').onclick=()=>{S.sound=!S.sound;save();applySound();};
initA11y();initKeys();
initTopbar({Sfx});

/* ---------- book art (shared by the canvas world and DOM spine images) ---------- */
const hex=h=>{const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255];};
const mixc=(c,t,f)=>c.map((v,i)=>Math.round(v+(t[i]-v)*f));
const rgbs=c=>`rgb(${c[0]},${c[1]},${c[2]})`;
const TIERRGB=TIERS.map(t=>hex(t.spine));
function tierBase(t){return mixc(TIERRGB[t],[0,0,0],t>=4?.34:.45);}
const LEATHER=[[70,38,26],[92,30,32],[38,58,44],[34,44,74],[96,70,34],[56,50,46],[82,52,34],[64,36,56]];
/* o: {w,h,tier(-1 filler),col,seed,word,ribbon,dust} drawn with origin at bottom-centre */
function bookArt(c,o,t=0){
 const rng=mulberry(o.seed|0),w=o.w,h=o.h,x0=-w/2,y0=-h,T=o.tier;
 const base=o.col||tierBase(T),dark=mixc(base,[0,0,0],.5),light=mixc(base,[255,232,190],.22);
 const worn=T<=1;
 c.save();
 c.beginPath();c.moveTo(x0,0);c.lineTo(x0,y0+(worn?rng()*5:1));
 if(worn){const n=Math.max(3,(w/4)|0);for(let i=1;i<=n;i++)c.lineTo(x0+w*i/n,y0+rng()*(T===0||T===-1&&rng()<.4?8:3.5));}else c.lineTo(x0+w,y0+(T>=4?0:1.5));
 c.lineTo(x0+w,0);c.closePath();
 const g=c.createLinearGradient(x0,0,x0+w,0);g.addColorStop(0,rgbs(dark));g.addColorStop(.2,rgbs(base));g.addColorStop(.55,rgbs(light));g.addColorStop(.86,rgbs(base));g.addColorStop(1,rgbs(dark));
 c.fillStyle=g;c.fill();
 c.save();c.clip();
 // grain + scuffs
 c.globalAlpha=.12;for(let i=0;i<Math.max(8,w*h/110);i++){c.fillStyle=rng()<.5?PALETTE.black:PALETTE.white;c.fillRect(x0+rng()*w,y0+rng()*h,1,1+rng()*(T>=4?2:5));}
 if(T<=2){c.globalAlpha=.16;for(let i=0;i<3;i++){c.fillStyle=PALETTE.parchmentE9d8b0;c.beginPath();c.ellipse(x0+rng()*w,y0+rng()*h,w*(.2+rng()*.4),3+rng()*8,rng()*3,0,6.3);c.fill();}}
 c.globalAlpha=1;
 // raised bands
 const bands=T>=3?[.1,.2,.5,.84]:[.12,.2,.84];
 for(const p of bands){const yy=y0+h*p;c.fillStyle='rgba(0,0,0,.5)';c.fillRect(x0,yy,w,2);c.fillStyle=T>=4?PALETTE.brass66:'rgba(255,230,180,.26)';c.fillRect(x0,yy+2,w,1.4);if(T>=4){c.fillStyle=PALETTE.whiteAlpha66;c.fillRect(x0+w*.2,yy+2,w*.3,.8);}}
 // label / lettering
 const F=o.fit,lw=w*(F?.82:.7),lh=F?F.lh:Math.min(h*.5,Math.max(28,(o.word||'').length*5.6)),ly=F?y0+F.top+(h-F.top-lh)/2:y0+h*.3;
 if(T<=2&&(o.word||T>=1)){c.save();c.translate(0,ly+lh/2);c.rotate(((o.seed%7)-3)*.012);c.fillStyle=PALETTE.parchmentE6d8b2;c.globalAlpha=.94;c.fillRect(-lw/2,-lh/2,lw,lh);c.globalAlpha=.4;c.fillStyle=PALETTE.black;c.fillRect(-lw/2,-lh/2,lw,1);c.fillRect(-lw/2,lh/2-1,lw,1);c.restore();}
 if(T===0||T===-1&&rng()<.3){c.save();c.globalAlpha=.7;c.fillStyle=PALETTE.brassD8cca8;c.translate(0,y0+h*.58);c.rotate(-.5);c.fillRect(-w*.7,-3,w*1.4,6);c.restore();}
 if(T>=4){c.fillStyle=PALETTE.brass67;c.globalAlpha=.85;c.fillRect(x0+w*.14,ly-6,w*.72,1.4);c.fillRect(x0+w*.14,ly+lh+4,w*.72,1.4);c.globalAlpha=1;}
 // damage + shading
 if(worn||T<0){c.globalAlpha=.3;const sg=c.createRadialGradient(x0+w*.7,y0+h*.8,0,x0+w*.7,y0+h*.8,w);sg.addColorStop(0,PALETTE.oak10);sg.addColorStop(1,PALETTE.blackAlpha00);c.fillStyle=sg;c.fillRect(x0,y0,w,h);c.globalAlpha=1;}
 if(o.dust){c.globalAlpha=Math.min(.55,o.dust);const dg=c.createLinearGradient(0,y0,0,y0+h*.5);dg.addColorStop(0,PALETTE.brassCfc5ae);dg.addColorStop(1,PALETTE.brassCfc5aeAlpha00);c.fillStyle=dg;c.fillRect(x0,y0,w,h*.5);c.globalAlpha=1;}
 c.fillStyle='rgba(255,255,255,.2)';c.fillRect(x0,y0,1.4,h);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x0+w-1.6,y0,1.6,h);
 c.restore();
 // word on spine
 if(o.word){c.save();c.translate(0,ly+lh/2);c.rotate(-Math.PI/2);const fs=F?F.fs:clamp(w*.46,8,13);c.font=F?spineFont(fs):`${fs}px "IM Fell English",Georgia,serif`;c.textAlign='center';c.textBaseline='middle';
  if(T>=3){if(F){c.lineJoin='round';c.lineWidth=3;c.strokeStyle=PALETTE.blackAlpha99;c.strokeText(o.word,0,0);c.fillStyle=PALETTE.brassF6d98a;}else{c.fillStyle=PALETTE.brass67;c.shadowColor=PALETTE.black;c.shadowBlur=2;}}else c.fillStyle=PALETTE.ink;F?c.fillText(o.word,0,0):c.fillText(o.word,0,0,lh*.94);c.restore();}
 // gems / seals
 if(T===5){c.fillStyle=PALETTE.blood40;c.beginPath();c.arc(0,y0+h*.14,Math.min(5,w*.2),0,6.3);c.fill();c.fillStyle=PALETTE.blood78;c.fillRect(-1,y0+h*.14-2,1.5,1.5);}
 if(T===6){c.save();c.translate(0,y0+h*.14);c.rotate(.785);const r=Math.min(5.5,w*.2);const gg=c.createLinearGradient(-r,-r,r,r);gg.addColorStop(0,PALETTE.teal96);gg.addColorStop(.55,PALETTE.aqua);gg.addColorStop(1,PALETTE.teal40);c.fillStyle=gg;c.shadowColor=PALETTE.aqua;c.shadowBlur=10;c.fillRect(-r,-r,r*2,r*2);c.restore();}
 c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=1;c.beginPath();c.moveTo(x0,0);c.lineTo(x0,y0);c.lineTo(x0+w,y0);c.lineTo(x0+w,0);c.stroke();
 // bookmark ribbon (hangs out of the bottom)
 if(o.ribbon){const rx=x0+w*(.25+rng()*.4),rl=10+rng()*14,sw=Math.sin(t*1.3+o.seed)*1.2;c.fillStyle=o.ribbon;c.beginPath();c.moveTo(rx,-3);c.lineTo(rx+3.6,-3);c.lineTo(rx+3.6+sw,rl);c.lineTo(rx+1.8+sw,rl-3.5);c.lineTo(rx+sw,rl);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.25)';c.fillRect(rx,-3,1,rl*.8);}
 c.restore();
}
const RIBBONS=[PALETTE.bloodA3202a,PALETTE.bronze47,PALETTE.bronze2d6a4f,PALETTE.steel36,PALETTE.bronze7a2a7a];
function bookDims(b,rh){const hs=((b.w||'a').charCodeAt(0)*13+(b.w||'a').length*7)%20;return{w:Math.round(22+Math.min(16,(b.w||'').length*1.5)+b.tier*1.8),h:Math.round(rh*(.5+.04*b.tier)+hs),};}
// the recent-books shelf: spines sized from the word so the whole word always fits and reads
function shelfDims(b,rh){const d=bookDims(b,rh),f=fitSpine(b.w||'',{baseH:d.h,baseW:d.w,maxH:Math.round(rh-22),top:b.tier>=5?16:0});return{w:f.w,h:f.h,fit:{fs:f.fs,lh:f.lh,top:f.top}};}
const seedOf=b=>hashStr(b.w+(b.t||''))&0xffff;
const urlCache=new Map();
function spineURL(b,rh=110){const k=b.w+'|'+b.tier+'|'+rh;if(urlCache.has(k))return urlCache.get(k);
 const d=shelfDims(b,rh),pw=d.w+16,ph=d.h+30,cv=document.createElement('canvas');cv.width=pw*2;cv.height=ph*2;const c=cv.getContext('2d');c.scale(2,2);c.translate(pw/2,d.h+8);
 bookArt(c,{w:d.w,h:d.h,fit:d.fit,tier:b.tier,seed:seedOf(b),word:b.w,ribbon:b.tier>=1||seedOf(b)%3===0?RIBBONS[seedOf(b)%RIBBONS.length]:null},0);
 const r={url:cv.toDataURL(),w:pw,h:ph};urlCache.set(k,r);return r;}
const spineImg=(b,i,src,rh=110,scale=1)=>{const s=spineURL(b,rh);return `<img src="${s.url}" width="${s.w*scale}" height="${s.h*scale}" alt="${esc(b.w)}, ${TIERS[b.tier].name}" data-i="${i}" data-src="${src}" data-tip="${esc(b.w)} · ${TIERS[b.tier].name} · ${b.score}">`;};
if(document.fonts&&document.fonts.load)Promise.all(['16px "IM Fell English"','16px Newsreader','24px "Fuzzy Bubbles"','600 14px Cinzel','16px "Special Elite"'].map(f=>document.fonts.load(f))).then(()=>{urlCache.clear();resetSpineMeasure();}).catch(()=>{});

/* ---------- the stacks (continuous canvas world) ---------- */
const World=(()=>{
 const cv=$('#world');let ctx=cv.getContext('2d');const ctx0=ctx;let building=false;const bmpPool=[];
 let W=0,H=0,DPR=1,RH=150,BM=20,rows=new Map(),taken=new Set(),cam=0,restRow=0,st=null,dust=[],vt=0,last=performance.now();
 let shelf=[],hits=[],ledgeCb=null,onDepth=null,gaugeCb=null,niches=new Map(),boff=0,btgt=0,wasB=false,browseCb=null;
 const ZS=[0,.14,.3,.46,.62,.78,.92];
 const restCam=r=>r*RH-(H-RH-BM);
 const abn=r=>Math.max(clamp(r/190,0,1),floorAtRow(r).decay);
 const barPx=()=>52+(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat'))||0);
 function nicheBox(){const nw=Math.min(W-24,760),NT=barPx()+16,NB=H-RH-BM-10;return{x:(W-nw)/2,w:nw,t:NT,h:NB-NT,b:NB};}
 function setNicheVars(){const n=nicheBox(),r=document.documentElement.style;r.setProperty('--nx',n.x+'px');r.setProperty('--nw',n.w+'px');r.setProperty('--nt',n.t+'px');r.setProperty('--nb',(H-n.b)+'px');}
 function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);RH=clamp(H*.22,108,172);BM=Math.max(14,parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab'))||14);rows.clear();
  document.documentElement.style.setProperty('--shelfH',(RH+BM+10)+'px');setNicheVars();document.documentElement.style.setProperty('--rh',Math.round(RH*.8)+'px');if(!st)cam=restCam(restRow);}
 // where the book for row r is pulled from: a random spot along that shelf, stable for the row
 function pullX(r){return pullXAt(r,W);}
 function genRow(r,layer){
  const key=r*2+layer;if(rows.has(key))return rows.get(key);
  const rng=mulberry(r*7919+layer*104729+13),a=abn(r),fl=floorAtRow(r),sc=layer?.72:1,bs=[],webs=[],props=[];let x=-6;
  while(x<W+40){const w=(10+rng()*22)*sc;
   if(rng()<.03+.24*a+(fl.gap||0)){x+=w*(.5+rng());continue;} // missing books
   const cx=x+w/2;if(layer===0&&(taken.has(r)||(st&&st.row===r))&&Math.abs(cx-pullX(r))<34){x+=w;continue;}
   const h=RH*sc*(.58+rng()*.32);
   const lean=layer===0?-(((x+w/2)/W)*2-1)*.12*a:0;const tilt=(rng()<.05+.32*a?(rng()-.5)*(.1+.45*a):0)+lean;
   const tier=rng()<.05?Math.floor(rng()*rng()*7):-1;
   const col=tier>=0?tierBase(tier):mixc(mixc(LEATHER[(rng()*LEATHER.length)|0],fl.books[0],fl.books[1]),[110,100,86],a*.5);
   bs.push({x:x,w,h,tier,col,tilt,seed:(rng()*65536)|0,rib:rng()<.14?RIBBONS[(rng()*5)|0]:null,lying:rng()<.09*a});
   x+=w+(rng()<.1?3+rng()*12:1);}
  if(layer===0){for(let i=0;i<=3;i++){const ux=i*(W/3);if(rng()<.3+.7*a){const dir=i===3?-1:1;webs.push({k:'corner',x:ux+dir*7,y:0,dir,s:34+rng()*(60+120*a),seed:(rng()*999)|0});}
    if(i<3&&rng()<.1+.8*a){webs.push({k:'curtain',x:ux+7,x2:ux+W/3-7,sag:30+rng()*60,seed:(rng()*999)|0});}}
   const nh=a>.03?Math.floor(rng()*(1+8*a)):0;for(let i=0;i<nh;i++)webs.push({k:'strand',x:rng()*W,len:(20+rng()*60)*(fl.motif==='flood'?2.2:1),seed:(rng()*999)|0});
   if(r===fl.row&&r>0)props.push({k:'lintel'});
   if(fl.motif==='stacks'){for(let x2=60+rng()*80;x2<W-30;x2+=130+rng()*220){props.push(rng()<.5?{k:'plate',x:x2,n:1+((rng()*98)|0)}:{k:'papers',x:x2,n:2+((rng()*3)|0),w:24+rng()*26,tw:rng()-.5});}}
   else if(fl.motif==='archive'){for(let x2=40+rng()*60;x2<W-30;x2+=90+rng()*150){props.push(rng()<.55?{k:'plate',x:x2,n:100+((rng()*899)|0)}:{k:'papers',x:x2,n:2+((rng()*4)|0),w:26+rng()*30,tw:rng()-.5});}}
   else if(fl.motif==='crypt'){for(let x2=30+rng()*60;x2<W-30;x2+=70+rng()*140){props.push(rng()<.5?{k:'skull',x:x2,s:.8+rng()*.5,tilt:(rng()-.5)*.5}:{k:'bones',x:x2,s:.8+rng()*.6,seed:(rng()*999)|0});}}
   else props.push(...deepProps(fl,W,rng));}
  const data={bs,webs,props,fl,crack:rng()<.5*a?{x:rng()*W,w:30+rng()*90}:null};rows.set(key,data);return data;}
 function drawWeb(wb,y,a,wc=[224,218,200]){
  ctx.strokeStyle=`rgba(${wc[0]},${wc[1]},${wc[2]},${.14+.3*a})`;ctx.lineWidth=1;const rng=mulberry(wb.seed);
  if(wb.k==='corner'){const n=5,s=wb.s,pts=[];for(let i=0;i<n;i++){const ang=(i/(n-1))*Math.PI/2*(.9+rng()*.2);pts.push([wb.x+wb.dir*Math.cos(ang)*s,y+Math.sin(ang)*s]);ctx.beginPath();ctx.moveTo(wb.x,y);ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();}
   for(let k=1;k<=3;k++){const f=k/3.2;ctx.beginPath();for(let i=0;i<n;i++){const px=wb.x+(pts[i][0]-wb.x)*f,py=y+(pts[i][1]-y)*f;if(i===0)ctx.moveTo(px,py);else{const pm=[wb.x+(pts[i-1][0]-wb.x)*f,y+(pts[i-1][1]-y)*f];ctx.quadraticCurveTo((pm[0]+px)/2-wb.dir*3,(pm[1]+py)/2-3,px,py);}}ctx.stroke();}}
  else if(wb.k==='curtain'){const mx=(wb.x+wb.x2)/2;ctx.beginPath();ctx.moveTo(wb.x,y+2);ctx.quadraticCurveTo(mx,y+2+wb.sag,wb.x2,y+2);ctx.stroke();
   for(let i=1;i<7;i++){const t=i/7,px=wb.x+(wb.x2-wb.x)*t,py=y+2+wb.sag*2*t*(1-t)*.5;ctx.beginPath();ctx.moveTo(px,y+2);ctx.lineTo(px+(rng()-.5)*8,py+wb.sag*.35*(1-Math.abs(t-.5)*1.4));ctx.stroke();}}
  else{ctx.beginPath();ctx.moveTo(wb.x,y);ctx.quadraticCurveTo(wb.x+6*Math.sin(vt*.7+wb.seed),y+wb.len*.5,wb.x+2,y+wb.len);ctx.stroke();}}
 // ---- themed floor dressing ----
 function floorWall(fl,x0,x1,y,base,rh,r){
  if(fl.motif==='crypt'){ // stone blocks behind the books
   ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle=PALETTE.blackAlpha99;ctx.lineWidth=2;const bh=rh/3.4,rg=mulberry(r*53+1);
   for(let k=0;k*bh<base-y;k++){const yy=y+k*bh;ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x1,yy);ctx.stroke();const off=(k%2)*34;for(let xx=x0-off;xx<x1;xx+=68+((rg()*14)|0)){ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx,yy+bh);ctx.stroke();}}
   ctx.fillStyle=PALETTE.whiteAlpha08;for(let i=0;i<14;i++)ctx.fillRect(x0+rg()*(x1-x0),y+rg()*(base-y),10+rg()*30,2+rg()*5);
   ctx.restore();}
  else if(fl.motif==='stacks'){ // wood paneling and a rail behind the books, so the first floor isn't a bare wall
   ctx.save();ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=2;const pw=54;
   for(let xx=x0+((r*29)%pw);xx<x1;xx+=pw){ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,base);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.03)';ctx.fillRect(xx+2,y,1,base-y);}
   ctx.fillStyle='rgba(0,0,0,.33)';ctx.fillRect(x0,y+rh*.16,x1-x0,3);ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(x0,y+rh*.16+3,x1-x0,1);
   ctx.restore();}
  else if(fl.motif==='archive'){ // faint rows of pigeonhole drawers on the back wall
   ctx.save();ctx.globalAlpha=.5;const cw=46,ch=30;ctx.strokeStyle=PALETTE.bronze28Alpha88;ctx.lineWidth=1;
   for(let yy=y+8;yy<base-ch;yy+=ch+6)for(let xx=x0+((r*13)%cw);xx<x1;xx+=cw+6){ctx.strokeRect(xx+.5,yy+.5,cw,ch);ctx.fillStyle=PALETTE.bronze54Alpha33;ctx.fillRect(xx+cw/2-5,yy+ch-10,10,3);}
   ctx.restore();}
  else if(fl.motif==='hollow'||fl.motif==='abyss')deepWall(ctx,fl,x0,x1,y,base,rh,r);
 }
 function floorProp(pr,fl,bx0,bx1,y,base){
  if(pr.k==='lintel'){ // the threshold beam that announces a new floor
   ctx.save();ctx.fillStyle=fl.pillar;ctx.fillRect(0,y,W,16);ctx.fillStyle=fl.ledgeHi;ctx.fillRect(0,y+16,W,2);ctx.fillStyle=PALETTE.blackAlpha99;ctx.fillRect(0,y+18,W,6);
   ctx.font='600 12px "IM Fell English",Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=`rgb(${fl.lamp.join(',')})`;ctx.globalAlpha=.85;
   const label=fl.name.toUpperCase().split('').join(' ');for(let i=0;i<3;i++)ctx.fillText(label,W*(i+.5)/3,y+8.5);
   ctx.restore();return;}
  if(pr.x<bx0-60||pr.x>bx1+60)return;
  ctx.save();ctx.translate(pr.x,base);
  if(pr.k==='plate'){ctx.fillStyle=PALETTE.bronze54;ctx.fillRect(-14,-4,28,9);ctx.fillStyle=PALETTE.oak2a2410;ctx.font='400 8px "Special Elite",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(pr.n,0,.5);}
  else if(pr.k==='papers'){ctx.rotate(pr.tw*.06);for(let i=0;i<pr.n;i++){ctx.fillStyle=i%2?PALETTE.brass71:PALETTE.brass77;ctx.fillRect(-pr.w/2+(i%2)*2,-(i+1)*5,pr.w,4);ctx.fillStyle=PALETTE.blackAlpha30;ctx.fillRect(-pr.w/2,-(i+1)*5+3,pr.w,1);}ctx.fillStyle=PALETTE.blood34;ctx.fillRect(-2,-pr.n*5-1,4,pr.n*5+1);}
  else if(pr.k==='skull'){ctx.rotate(pr.tilt);ctx.scale(pr.s,pr.s);ctx.fillStyle=PALETTE.brassCfc6ad;ctx.beginPath();ctx.arc(0,-14,11,Math.PI,0);ctx.lineTo(8,-5);ctx.lineTo(5,-2);ctx.lineTo(-5,-2);ctx.lineTo(-8,-5);ctx.closePath();ctx.fill();ctx.fillStyle=PALETTE.oak120d0a;ctx.beginPath();ctx.arc(-4,-13,3,0,6.3);ctx.arc(4,-13,3,0,6.3);ctx.fill();ctx.fillRect(-1,-9,2,3);}
  else if(pr.k==='candle'||pr.k==='urn'||pr.k==='tendril'){ctx.restore();deepProp(ctx,pr,base);return;}
  else if(pr.k==='bones'){ctx.scale(pr.s,pr.s);const g=mulberry(pr.seed);ctx.strokeStyle=PALETTE.brassCfc6ad;ctx.lineWidth=3;ctx.lineCap='round';for(let i=0;i<3;i++){const x=-14+i*14+g()*6,l=10+g()*10,a=(g()-.5)*1.6;ctx.beginPath();ctx.moveTo(x,-2);ctx.lineTo(x+Math.sin(a)*l,-2-Math.cos(a)*Math.min(l,8)*.4);ctx.stroke();}}
  ctx.restore();}
 function floodOverlay(fl,bx0,bx1,y,rh,r){
  // murky water: deeper rows are fuller; each row slowly sloshes
  const depthF=clamp((r-fl.row)/14,0,1),top=y+rh*(.5-.42*depthF);
  ctx.save();ctx.beginPath();ctx.rect(bx0,y,bx1-bx0,rh);ctx.clip();
  const g=ctx.createLinearGradient(0,top,0,y+rh);g.addColorStop(0,'rgba(40,120,140,.16)');g.addColorStop(1,'rgba(8,50,64,.5)');ctx.fillStyle=g;ctx.fillRect(bx0,top,bx1-bx0,y+rh-top);
  ctx.strokeStyle='rgba(150,235,235,.35)';ctx.lineWidth=1.5;ctx.beginPath();for(let x=bx0;x<=bx1;x+=8){const yy=top+Math.sin(x*.035+vt*.9+r)*2.2;if(x===bx0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.stroke();
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(120,220,220,.07)';for(let k=0;k<4;k++){ctx.beginPath();for(let x=bx0;x<=bx1;x+=10){const yy=top+14+k*18+Math.sin(x*.05+vt*.7+k*2+r*3)*5;if(x===bx0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.stroke();}
  ctx.restore();}
 function drawRowLive(r,layer,cam_,sc,dim){
  const rh=RH*sc,y=r*rh-cam_,base=y+rh-12*sc,a=abn(r),d=genRow(r,layer),fl=d.fl;
  const body=(bx0,bx1)=>{
   const bw=bx1-bx0;
   const bg=ctx.createLinearGradient(0,y,0,base);bg.addColorStop(0,fl.wallTop);bg.addColorStop(1,fl.wallBot);ctx.globalAlpha=dim;ctx.fillStyle=bg;ctx.fillRect(bx0-70,y-40,bw+140,rh+80);
   ctx.fillStyle=fl.ledge;ctx.fillRect(bx0-70,base,bw+140,12*sc+40);ctx.fillStyle=fl.ledgeHi;ctx.fillRect(bx0-70,base,bw+140,2*sc);ctx.fillStyle=PALETTE.blackAlpha66;ctx.fillRect(bx0-70,base+12*sc-2,bw+140,2);
   if(d.crack){ctx.fillStyle=PALETTE.oak1;ctx.beginPath();ctx.moveTo(d.crack.x,base);ctx.lineTo(d.crack.x+d.crack.w*.5,base+5*sc);ctx.lineTo(d.crack.x+d.crack.w,base);ctx.lineTo(d.crack.x+d.crack.w,base+12*sc);ctx.lineTo(d.crack.x,base+12*sc);ctx.fill();}
   ctx.globalAlpha=1;
   if(layer===0&&(r!==0||fl.motif==='stacks'))floorWall(fl,bx0,bx1,y,base,rh,r);
   if(layer===0&&r===0){hits=[];let x=Math.max(34,(W-Math.min(W-60,1040))/2),maxX=W-Math.max(34,(W-Math.min(W-60,1040))/2);
    const vis=[];let tot=0;for(let i=shelf.length-1;i>=0;i--){const b=shelf[i],dm=shelfDims(b,RH);if(tot+dm.w+3>maxX-x-40)break;tot+=dm.w+3;vis.unshift({b,dm});}
    for(const v of vis){const {b,dm}=v;for(let i=1;i<3;i++){const px=i*(W/3);if(x<px+9&&x+dm.w>px-9)x=px+9;} // never stand a spine behind a pillar
     const bx=x+dm.w/2;ctx.save();ctx.translate(bx,base);
     bookArt(ctx,{w:dm.w,h:dm.h,fit:dm.fit,tier:b.tier,seed:seedOf(b),word:b.w,ribbon:b.tier>=1||seedOf(b)%3===0?RIBBONS[seedOf(b)%RIBBONS.length]:null},vt);ctx.restore();
     hits.push({x:x,y:base-dm.h,w:dm.w,h:dm.h+16,b});x+=dm.w+3;}
    shelfVisible=vis.length;
    // fill the rest of this shelf with the same procedural books as every other row, so the top never reads as a bare band
    {const x0=Math.max(34,(W-Math.min(W-60,1040))/2),gx0=x0-4,gx1=x+4;
     for(const b of d.bs){if(b.x+b.w<bx0-50||b.x>bx1+50||(vis.length&&b.x+b.w>gx0&&b.x<gx1))continue;ctx.save();ctx.translate(b.x+b.w/2,base);
      if(b.lying){ctx.rotate(-.04);bookArt(ctx,{w:b.h*.7,h:b.w*1.2,tier:b.tier,col:b.col,seed:b.seed,ribbon:b.rib},vt);}
      else{if(b.tilt){ctx.translate(b.w/2,0);ctx.rotate(b.tilt);ctx.translate(-b.w/2,0);}bookArt(ctx,{w:b.w,h:b.h,tier:b.tier,col:b.col,seed:b.seed,ribbon:b.rib},vt);}
      ctx.restore();}}}
   else{
    for(const b of d.bs){if(b.x+b.w<bx0-50||b.x>bx1+50)continue;ctx.save();const bx=b.x+b.w/2;
     if(b.lying){ctx.translate(bx,base);ctx.rotate(-.04);bookArt(ctx,{w:b.h*.7,h:b.w*1.2,tier:b.tier,col:b.col,seed:b.seed,dust:a*.9,ribbon:b.rib},vt);}
     else{ctx.translate(bx,base);if(b.tilt){ctx.translate(b.w/2,0);ctx.rotate(b.tilt);ctx.translate(-b.w/2,0);}
      if(layer===0){bookArt(ctx,{w:b.w,h:b.h,tier:b.tier,col:b.col,seed:b.seed,dust:a*.8,ribbon:b.rib},vt);if(isLore(b,W))drawLoreMark(ctx,b);else if(isCurio(b,W))drawCurioMark(ctx,b);}
      else{ctx.fillStyle=rgbs(b.col);ctx.fillRect(-b.w/2,-b.h,b.w,b.h);}}
     ctx.restore();}}
   if(layer===0){for(const pr of d.props)floorProp(pr,fl,bx0,bx1,y,base);for(const wb of d.webs){if(building&&wb.k==='strand')continue;if(wb.x>=bx0-120&&wb.x<=bx1+120)drawWeb(wb,y,a,fl.web);}
    if(fl.motif==='flood'&&!building)floodOverlay(fl,bx0,bx1,y,rh,r);}
  };
  if(layer===0&&r!==0&&a>.03){
   for(let i=0;i<3;i++){const bx0=i*W/3,bx1=bx0+W/3;ctx.save();ctx.beginPath();ctx.rect(bx0,y-1,W/3,rh+2);ctx.clip();ctx.fillStyle=PALETTE.oak2;ctx.fillRect(bx0,y-1,W/3,rh+2);
    const th=(i===0?1:i===2?-1:0)*.085*a;if(th){const cx=(bx0+bx1)/2,cy=y+rh/2;ctx.translate(cx,cy);ctx.rotate(th);ctx.translate(-cx,-cy);}
    body(bx0,bx1);ctx.restore();}
  }else if(layer===0){ctx.save();ctx.beginPath();ctx.rect(0,y-1,W,rh+2);ctx.clip();body(0,W);ctx.restore();} // clip so the next row's wall can't swallow this row's plank and book bottoms
  else body(0,W);
  ctx.globalAlpha=dim;ctx.fillStyle=fl.pillar;for(let i=0;i<=3;i++){const ux=i*(W/3);ctx.fillRect(ux-(i?7*sc:0),y,14*sc,rh);ctx.fillStyle=PALETTE.whiteAlpha10;ctx.fillRect(ux-(i?7*sc:0)+2,y,1.5,rh);if(fl.motif==='flood'&&layer===0){ctx.fillStyle=PALETTE.teal60Alpha22;for(let k=0;k<rh;k+=22)ctx.fillRect(ux-(i?7*sc:0)+4,y+k+8,6,2);}ctx.fillStyle=fl.pillar;}ctx.globalAlpha=1;
  return {base,d};}
 // Static row art is drawn once into an offscreen bitmap; only water and loose strands animate per frame.
 function drawRow(r,layer,cam_,sc,dim){
  if(layer!==0||r===0)return drawRowLive(r,layer,cam_,sc,dim);
  const d=genRow(r,0),rh=RH,y=r*rh-cam_,base=y+rh-12;
  if(!d.bmp){const pad=40,cw=Math.ceil(W*DPR),ch=Math.ceil((rh+pad*2)*DPR),oc=bmpPool.pop()||document.createElement('canvas');
   if(oc.width!==cw||oc.height!==ch){oc.width=cw;oc.height=ch;}const o=oc.getContext('2d');o.setTransform(DPR,0,0,DPR,0,0);o.clearRect(0,0,W,rh+pad*2);
   ctx=o;building=true;try{drawRowLive(r,0,r*rh-pad,1,1);}finally{ctx=ctx0;building=false;}d.bmp=oc;d.pad=pad;}
  const cp=r===1?d.pad:0; // row 1's bitmap pad would paint over the bottom of the recent-books shelf above it, hiding the spines' lower end
  ctx.drawImage(d.bmp,0,cp*DPR,d.bmp.width,d.bmp.height-cp*DPR,0,y-d.pad+cp,W,rh+d.pad*2-cp);
  const a=abn(r),fl=d.fl;
  for(const wb of d.webs)if(wb.k==='strand')drawWeb(wb,y,a,fl.web);
  if(fl.motif==='flood')floodOverlay(fl,0,W,y,rh,r);
  return {base,d};}
 function pruneRows(top,bot){for(const [k,v] of rows){const r=k>>1;if(r<top-6||r>bot+6){if(v.bmp){bmpPool.push(v.bmp);v.bmp=null;}rows.delete(k);}}}
 // A finished alcove keeps its word, your answer on the slip, and the result, so scrolling back reads like a log.
 function wrapLines(t,maxW,max){const out=[];let line='';for(const wd of t.split(/\s+/)){const tr=line?line+' '+wd:wd;if(line&&ctx.measureText(tr).width>maxW){out.push(line);line=wd;if(out.length>=max)break;}else line=tr;}if(out.length<max&&line)out.push(line);else if(line&&out.length>=max)out[max-1]=out[max-1].replace(/\s*\S*$/,'')+'\u2026';return out;}
 function drawNicheResult(r,x,y,w,h,now){
  const T=TIERS[r.tier],cx=x+w/2,fs=clamp(w*.1,34,76);ctx.save();ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.font=`400 ${fs}px Newsreader,Georgia,serif`;ctx.fillStyle=PALETTE.parchment85;ctx.shadowColor=PALETTE.black;ctx.shadowBlur=14;ctx.fillText(r.w,cx,y+h*.2,w*.82);ctx.shadowBlur=0;
  ctx.font='italic 400 17px Newsreader,Georgia,serif';ctx.fillStyle=PALETTE.parchmentDim;ctx.fillText(r.pos||'',cx,y+h*.2+26);
  const sw=Math.min(w*.74,520),sh=Math.min(Math.max(96,h*.3),170),sx=cx-sw/2,sy=y+h*.2+48;
  ctx.save();ctx.translate(cx,sy+sh/2);ctx.rotate(-.01);ctx.translate(-cx,-(sy+sh/2));
  ctx.shadowColor=PALETTE.blackAlphaAa;ctx.shadowBlur=14;ctx.shadowOffsetY=8;ctx.fillStyle=PALETTE.parchmentEee2c4;ctx.fillRect(sx,sy,sw,sh);ctx.shadowColor='transparent';
  ctx.strokeStyle=PALETTE.steel66Alpha66;ctx.lineWidth=1;for(let ly=sy+34;ly<sy+sh;ly+=34){ctx.beginPath();ctx.moveTo(sx,ly);ctx.lineTo(sx+sw,ly);ctx.stroke();}
  ctx.strokeStyle=PALETTE.blood51Alpha88;ctx.beginPath();ctx.moveTo(sx+52,sy);ctx.lineTo(sx+52,sy+sh);ctx.stroke();
  ctx.fillStyle=PALETTE.blood43;ctx.beginPath();ctx.arc(cx,sy+4,6,0,6.3);ctx.fill();
  ctx.textAlign='left';ctx.fillStyle=PALETTE.steel23;ctx.font='700 24px "Fuzzy Bubbles",cursive';
  const txt=r.skipped||!r.answer?'(skipped)':r.answer;ctx.globalAlpha=r.skipped||!r.answer?.55:1;
  wrapLines(txt,sw-72,Math.max(1,Math.floor((sh-6)/34))).forEach((l,i)=>ctx.fillText(l,sx+62,sy+28+i*34));
  ctx.restore();ctx.globalAlpha=1;
  const ry=sy+sh+34;ctx.textAlign='center';ctx.font='600 14px Cinzel,Georgia,serif';ctx.fillStyle=T.spine;ctx.shadowColor=T.spine;ctx.shadowBlur=10;
  ctx.fillText(`${T.name.toUpperCase()}  \u00b7  ${r.score}`+(r.ft?`  \u00b7  +${r.ft} FT`:''),cx,ry);ctx.shadowBlur=0;
  if(r.verdict){ctx.font='italic 400 16px Newsreader,Georgia,serif';ctx.fillStyle=PALETTE.brass76;ctx.fillText(r.verdict,cx,ry+24,sw);}
  ctx.restore();}
// Lore books are lit after the alcoves are drawn, and a book an alcove covers is neither lit nor clickable.
 function loreCovered(b,base,cam_){return loreCoveredAt(b,base,cam_,nicheBox(),niches.keys(),RH,H,BM);}
 function drawLoreGlows(top,bot,camNow){
  for(let r=top;r<=bot;r++){const d=r?rows.get(r*2):null;if(!d)continue;
   const y=r*RH-camNow,base=y+RH-12,a=abn(r);
   for(const b of d.bs){if(!(isLore(b,W)||isCurio(b,W))||b.x+b.w<0||b.x>W||loreCovered(b,base,camNow))continue;
    ctx.save();
    if(a>.03){const i=Math.min(2,Math.max(0,Math.floor((b.x+b.w/2)/(W/3)))),th=(i===0?1:i===2?-1:0)*.085*a;if(th){const cx=(i+.5)*W/3,cy=y+RH/2;ctx.translate(cx,cy);ctx.rotate(th);ctx.translate(-cx,-cy);}}
     
    ctx.translate(b.x+b.w/2,base);if(b.tilt){ctx.translate(b.w/2,0);ctx.rotate(b.tilt);ctx.translate(-b.w/2,0);}
    drawLoreGlow(ctx,b,vt);ctx.restore();}}}
 function drawNiche(row,nv,camNow,now){const t0=nv.t0;
  const n=nicheBox(),y=n.t+(row*RH-(H-RH-BM))-camNow,h=n.h,x=n.x,w=n.w;if(y>H+20||y+h<-20)return;
  const al=clamp((now-t0)/450,0,1),a=abn(row),r=Math.min(52,w*.09),lc=floorAtRow(row).lamp;
  ctx.save();ctx.globalAlpha=al;
  const path=()=>{ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x,y+r);ctx.arc(x+r,y+r,r,Math.PI,1.5*Math.PI);ctx.lineTo(x+w-r,y);ctx.arc(x+w-r,y+r,r,1.5*Math.PI,2*Math.PI);ctx.lineTo(x+w,y+h);ctx.closePath();};
  path();const ig=ctx.createLinearGradient(0,y,0,y+h);ig.addColorStop(0,PALETTE.oak150e08);ig.addColorStop(1,PALETTE.oak0e0905);ctx.fillStyle=ig;ctx.fill();
  ctx.save();path();ctx.clip();
  ctx.fillStyle=PALETTE.whiteAlpha05;for(let gx=x+30;gx<x+w;gx+=46)ctx.fillRect(gx,y,1,h);
  const wg=ctx.createRadialGradient(x+w/2,y+h*.5,0,x+w/2,y+h*.5,w*.72);wg.addColorStop(0,`rgba(${lc[0]},${lc[1]},${lc[2]},${.2-.08*a})`);wg.addColorStop(1,`rgba(${lc[0]},${lc[1]},${lc[2]},0)`);ctx.globalCompositeOperation='lighter';ctx.fillStyle=wg;ctx.fillRect(x,y,w,h);ctx.globalCompositeOperation='source-over';
  let eg=ctx.createLinearGradient(x,0,x+40,0);eg.addColorStop(0,'rgba(0,0,0,.65)');eg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=eg;ctx.fillRect(x,y,40,h);
  eg=ctx.createLinearGradient(x+w,0,x+w-40,0);eg.addColorStop(0,'rgba(0,0,0,.65)');eg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=eg;ctx.fillRect(x+w-40,y,40,h);
  eg=ctx.createLinearGradient(0,y,0,y+46);eg.addColorStop(0,'rgba(0,0,0,.7)');eg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=eg;ctx.fillRect(x,y,w,46);
  ctx.restore();
  // carved frame
  ctx.lineJoin='round';path();ctx.lineWidth=20;const fg=ctx.createLinearGradient(x,0,x+w,0);fg.addColorStop(0,PALETTE.oak12);fg.addColorStop(.5,PALETTE.oak21);fg.addColorStop(1,PALETTE.oak12);ctx.strokeStyle=fg;ctx.stroke();
  path();ctx.lineWidth=2;ctx.strokeStyle=PALETTE.bronze7a5a3a;ctx.stroke();
  ctx.save();ctx.translate(0,0);const p2=()=>{ctx.beginPath();ctx.moveTo(x-6,y+h);ctx.lineTo(x-6,y+r);ctx.arc(x+r,y+r,r+6,Math.PI,1.5*Math.PI);ctx.lineTo(x+w-r,y-6);ctx.arc(x+w-r,y+r,r+6,1.5*Math.PI,2*Math.PI);ctx.lineTo(x+w+6,y+h);};p2();ctx.lineWidth=1;ctx.strokeStyle=PALETTE.blackAlpha99;ctx.stroke();ctx.restore();
  // ledge
  ctx.fillStyle=PALETTE.oak35241a;ctx.fillRect(x-14,y+h,w+28,12);ctx.fillStyle=PALETTE.bronze6a4a30;ctx.fillRect(x-14,y+h,w+28,2);ctx.fillStyle=PALETTE.blackAlpha88;ctx.fillRect(x-14,y+h+10,w+28,2);
  // cobwebs in the alcove corners, thicker when deeper
  if(a>.05){const m=mulberry(row*31+7);drawWeb({k:'corner',x:x+10,y:0,dir:1,s:40+a*90,seed:(m()*999)|0},y+10,a);drawWeb({k:'corner',x:x+w-10,y:0,dir:-1,s:40+a*90,seed:(m()*999)|0},y+10,a);}
  // wall lanterns, hung from chains on the arch
  drawAlcoveLanterns(ctx,{x,y,w,h,r,lc,a,now,row});
  // numeral plaque on the arch
  if(nv.label){ctx.font='600 13px Newsreader,Georgia,serif';const tw=ctx.measureText(nv.label).width+26,px=x+w/2-tw/2,py=y-12;const pg=ctx.createLinearGradient(0,py,0,py+24);pg.addColorStop(0,PALETTE.bronze35);pg.addColorStop(1,PALETTE.oak3d2916);ctx.fillStyle=pg;ctx.fillRect(px,py,tw,24);ctx.strokeStyle=PALETTE.brass;ctx.lineWidth=1;ctx.strokeRect(px+.5,py+.5,tw-1,23);ctx.fillStyle=PALETTE.parchmentF3e3bd;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(nv.label,x+w/2,py+12.5);}
  if(nv.res)drawNicheResult(nv.res,x,y,w,h,now);
  // this run's books stand on the ledge in word order; a skipped word leaves an empty slot
  nv.hit=nv.books&&nv.books.length?drawLedge(ctx,{books:nv.books,x,y,w,h,now,RH,dims:b=>bookDims({w:b.w,tier:b.tier},RH),bookArt,ribbons:RIBBONS,hash:hashStr}):null;
  ctx.restore();}
 const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
 const shade=(hx,f)=>{const n=parseInt(hx.slice(1),16);return `rgb(${(n>>16)*f|0},${(n>>8&255)*f|0},${(n&255)*f|0})`;};
 let shelfVisible=0,lastCam=0;
 let lastDraw=0,coverChk=0,covNow=false;
 function frame(now){
  if(now-coverChk>100){coverChk=now;covNow=worldCovered();} // DOM probe at 10 Hz, not per frame
  const gap=frameInterval({covered:covNow,busy:!!st||!!rest,feelActive:Feel.ts!==1||!!Feel.ox||!!Feel.oy});
  if(gap&&now-lastDraw<gap-4){requestAnimationFrame(frame);return;}
  lastDraw=now;
  const rdt=Math.min(gap?.12:.05,(now-last)/1000);last=now;Feel.tick(rdt);const dt=rdt*Feel.ts;vt+=dt*(st&&st.skip?6:1);cv.style.transform=Feel.ox||Feel.oy?`translate(${Feel.ox}px,${Feel.oy}px)`:'';{const cl=document.getElementById('cardlayer');if(cl)cl.style.transform=cv.style.transform;}
  let camNow=cam,settle=0,pull=0;
  if(st){
   if(st.phase==='down'){const u=Math.min(1,st.t/st.dur);st.t+=dt*(st.skip?6:1);camNow=st.cam0+(st.cam1-st.cam0)*travelEase(u);st.prog=u;if(u>=1){st.phase='settle';st.pt=0;Sfx.thud();}}
   if(st.phase==='settle'){st.pt+=dt*(st.skip?6:1);camNow=st.cam1;st.prog=1;settle=Math.min(1,st.pt/.3);if(settle>=1){st.phase='pull';st.pt=0;Sfx.flip();}}
   if(st.phase==='pull'||st.phase==='hold'){camNow=st.cam1;settle=1;if(st.phase==='pull')st.pt+=dt*(st.skip?6:1);pull=Math.min(1,st.pt/.45);if(st.phase==='pull'&&pull>=1){st.phase='hold';const r=st.res;st.res=null;r&&r();}}
   cam=camNow;boff=btgt=0;
  }else if(rest){const u=Math.min(1,(now-rest.t0)/rest.ms),e=travelEase(u);cam=rest.c0+(rest.c1-rest.c0)*e;if(u>=1){const f=rest.done;rest=null;f&&f();}camNow=cam;boff=btgt=0;}
  else{boff=RM||Math.abs(btgt-boff)<.5?btgt:boff+(btgt-boff)*Math.min(1,rdt*14);camNow=cam+boff+(RM||boff?0:Math.sin(vt*.5)*1.5);}
  {const b=btgt<-4;if(b!==wasB){wasB=b;browseCb&&browseCb(b);}}
  lastCam=camNow;
  const rowB=(camNow+H-RH-BM)/RH,atm=atmosphereAt(Math.max(0,rowB)),a=Math.max(clamp(rowB/190,0,1),atm.decay);
  if(onDepth)onDepth(Math.max(0,Math.round(rowB*FT)));Sfx.setDepth(Math.max(0,rowB*FT));
  ctx.globalAlpha=1;ctx.fillStyle=PALETTE.oak0a0706;ctx.fillRect(0,0,W,H);
  // wall above shelf 0
  const top=Math.floor(camNow/RH)-1,bot=Math.ceil((camNow+H)/RH)+1;
  // far silhouette layer
  pruneRows(top,bot);
  let tgt=null;
  for(let r=top;r<=bot;r++){const o=drawRow(r,0,camNow,1,1);if(st&&r===st.row)tgt=o;}
  for(const [nr,nv] of niches)drawNiche(nr,nv,camNow,now);
  drawLoreGlows(top,bot,camNow);
  if(ledgeCb){const cn=niches.get(restRow);ledgeCb(!st&&!rest&&cn&&cn.hit&&cn.books?cn.hit:null,cn&&cn.books);}
  // pulled-out target
  if(st&&tgt){const T=TIERS[st.tier],e=pull*pull*(3-2*pull),bw=36,bh=RH*.82;const bx=pullX(st.row),by0=tgt.base; // seated in the gap genRow leaves in the target shelf, never floating above it
  const cy=H*.5;const px=bx+(W/2-bx)*e,py=by0+(cy+bh*.5*2.2-by0)*e;const s=1+1.3*e;
   if(settle>0){ctx.fillStyle=PALETTE.oak2;ctx.fillRect(bx-bw/2,by0-bh,bw,bh);}
   if(settle>0){ctx.save();ctx.globalCompositeOperation='lighter';const gg=ctx.createRadialGradient(bx,by0-bh/2,0,bx,by0-bh/2,bh*1.4);gg.addColorStop(0,T.spine+'bb');gg.addColorStop(1,T.spine+'00');ctx.globalAlpha=(.28+.35*T.id/6)*settle*(.85+.15*Math.sin(vt*5))*(1-e*.4);ctx.fillStyle=gg;ctx.fillRect(bx-bh*1.5,by0-bh*1.5,bh*3,bh*3);ctx.restore();}
   ctx.save();ctx.translate(px,py);ctx.scale(s,s);bookArt(ctx,{w:bw,h:bh,tier:st.tier,seed:st.seed,word:st.word,ribbon:st.tier>=1?RIBBONS[st.tier%5]:null},vt);ctx.restore();}
  // darkness / lamp (shrinks with abandonment)
  const lx=W/2,ly=H*.5,lr=Math.hypot(W,H)*(.6-.2*a)*atm.lampR;
  const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,lr);lg.addColorStop(0,'rgba(0,0,0,0)');lg.addColorStop(.3,`rgba(6,4,2,${.2+.25*a})`);lg.addColorStop(1,`rgba(3,2,2,${.93+.06*a})`);ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);
  if(a>0){ctx.fillStyle=`rgba(14,34,30,${.1*a})`;ctx.fillRect(0,0,W,H);}
  if(atm.dark>.005){ctx.fillStyle=`rgba(1,0,3,${atm.dark})`;ctx.fillRect(0,0,W,H);}
  if(atm.tint[3]>.005){const t=atm.tint;ctx.fillStyle=`rgba(${t[0]|0},${t[1]|0},${t[2]|0},${t[3]})`;ctx.fillRect(0,0,W,H);}
  drawFloorAtmosphere(ctx,W,H,atm,vt,lx,ly,RM);
  ctx.globalCompositeOperation='lighter';
  if(!RM){flickT-=dt;if(flickT<=0){flickT=.06+Math.random()*.3;flickV=(Math.random()-.5)*(Math.random()<.12?2.2:1);}flick+=(flickV-flick)*Math.min(1,dt*9);}
  const fl=(.1-.03*a)+.02*Math.sin(vt*13)+.012*Math.sin(vt*31)+.03*flick*atm.flick;
  let g=ctx.createRadialGradient(lx,ly,0,lx,ly,Math.max(W,H)*.45);{const l=atm.lamp.map(v=>v|0);g.addColorStop(0,`rgba(${l[0]},${l[1]+6},${l[2]+10},${fl})`);g.addColorStop(1,`rgba(${l[0]},${l[1]+6},${l[2]+10},0)`);}ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(st){const zi=st.prog>=1?st.tier:Math.min(st.tier,tierOf(st.prog*st.score));const zc=TIERS[zi].spine;g=ctx.createRadialGradient(lx,ly,0,lx,ly,Math.max(W,H)*.6);g.addColorStop(0,zc+'26');g.addColorStop(1,zc+'00');ctx.fillStyle=g;ctx.globalAlpha=.5+.5*settle;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;gaugeCb&&gaugeCb(zi,st);}
  if(!RM)for(const p of dust){p.y-=dt*(5+p.z*14);p.x+=Math.sin(vt*.6+p.ph)*dt*8;const yy=((p.y+camNow*(.25+p.z*.5))%H+H)%H,xx=(p.x%W+W)%W;const dist=Math.hypot(xx-lx,yy-ly)/(Math.max(W,H)*.45);const al=Math.max(0,1-dist)*(.15+.5*Math.abs(Math.sin(vt*1.3+p.ph)))*(.7+a);ctx.fillStyle=`rgba(255,226,170,${al})`;ctx.beginPath();ctx.arc(xx,yy,p.r*(.6+p.z),0,6.3);ctx.fill();}
  if(!RM)drawMoths(lx,ly,a,dt);
  ctx.globalCompositeOperation='source-over';
  requestAnimationFrame(frame);}
 // moths: a few circle the lamp, erratic and drawn to the light; they thin out as the library decays
 const moths=Array.from({length:4},(_,i)=>({ang:Math.random()*6.3,rad:50+Math.random()*90,sp:(Math.random()<.5?-1:1)*(.9+Math.random()*1.2),ph:Math.random()*9,w:Math.random()*9,z:i}));
 function drawMoths(lx,ly,a,dt){const n=Math.max(1,Math.round(moths.length*(1-.6*a)));
  for(let i=0;i<n;i++){const m=moths[i];m.ang+=m.sp*dt*(1+.8*Math.sin(vt*1.7+m.ph));m.rad+=(Math.sin(vt*.9+m.ph)*30+(60+i*25)-m.rad)*dt*.8;m.w+=dt*38;
   const x=lx+Math.cos(m.ang)*m.rad*1.35+Math.sin(vt*3+m.ph)*5,y=ly-30+Math.sin(m.ang)*m.rad*.7+Math.cos(vt*4.1+m.ph)*4;
   const flap=Math.abs(Math.sin(m.w)),s=2.2+i*.2,near=Math.max(.15,1-m.rad/190);
   ctx.globalAlpha=.55*near*(1-.5*a);ctx.fillStyle=PALETTE.parchment86;
   ctx.beginPath();ctx.ellipse(x-s*(.6+flap*.9),y,s*(.4+flap),s*.7,-.4,0,6.3);ctx.ellipse(x+s*(.6+flap*.9),y,s*(.4+flap),s*.7,.4,0,6.3);ctx.fill();
   ctx.globalAlpha=.8*near;ctx.fillStyle=PALETTE.bronze55;ctx.fillRect(x-.6,y-s*.7,1.2,s*1.4);}
  ctx.globalAlpha=1;}
 let rest=null,flick=0,flickV=0,flickT=0;
 for(let i=0;i<100;i++)dust.push({x:Math.random()*5000,y:Math.random()*3000,z:Math.random(),r:.8+Math.random()*1.6,ph:Math.random()*6});
 addEventListener('resize',resize);resize();requestAnimationFrame(frame);
 cv.addEventListener('pointerdown',e=>{if(st)st.skip=true;});
 return{
  setShelf(b){shelf=b;},hits:()=>hits,
  // the lore book under a screen point, if any: {row, book}
  loreAt(x,y){const r=Math.floor((y+lastCam)/RH),b=hitLoreBook(rows.get(r*2),r,RH,W,lastCam,abn(r),x,y,(b,base)=>loreCovered(b,base,lastCam));return b?{row:r,book:b}:null;},curioAt(x,y){const r=Math.floor((y+lastCam)/RH),b=hitCurio(rows.get(r*2),r,RH,W,lastCam,abn(r),x,y,(b,base)=>loreCovered(b,base,lastCam));return b?{row:r,book:b}:null;},get shelfVisible(){return shelfVisible;},get restRow(){return restRow;},get busy(){return !!st||!!rest;},
  reset(){rows.clear();taken.clear();niches.clear();restRow=0;st=null;rest=null;cam=restCam(0);},
  clearNiches(){niches.clear();},
  // put a finished descent back (see core/replay.js): alcoves, emptied shelf slots, camera at the top
  restore(L){this.reset();const t0=performance.now()-1e3;for(const n of L.niches)niches.set(n.row,{t0,label:n.label,books:n.books,res:n.res||undefined});for(const r of L.taken)taken.add(r);},
  fillNiche(r,res,books){const e=niches.get(r);if(e){e.res=res;if(books)e.books=books;}},
  openNiche(r,o={}){const e=niches.get(r);if(e){e.label=o.label||e.label;e.books=o.books||e.books;}else niches.set(r,{t0:performance.now(),label:o.label||'',books:o.books||[]});},
  onLedge(f){ledgeCb=f;},onDepth(f){onDepth=f;},onGauge(f){gaugeCb=f;},
  // look back up the descent: the camera offsets while idle and snaps home; never while a descent or glide runs
  get canBrowse(){return !st&&!rest&&restRow>0;},get browsing(){return btgt<-4;},onBrowse(f){browseCb=f;},
  browse(d){if(!this.canBrowse)return;btgt=clamp(btgt+d,restCam(0)-cam,0);},
  browseToFt(ft){if(!this.canBrowse)return;btgt=clamp(restCam(Math.min(restRow,ft/FT))-H*.35-cam,restCam(0)-cam,0);},
  snap(){btgt=0;},
  descend({rows:n,tier,score,word}){return new Promise(res=>{
   const a=restRow,b=a+n;st={a,row:b,tier,score,word,seed:hashStr(word)&0xffff,cam0:restCam(a),cam1:restCam(b),dur:travelMs(n,RM)/1000,t:0,phase:'down',pt:0,skip:false,prog:0,res};cam=st.cam0;Sfx.whoosh(st.dur*.9);});},
  skipDown(){if(st)st.skip=true;},
  nextRows(){const n=nicheBox();return Math.ceil((H-BM-n.t)/RH);},
  glide(row,ms){return new Promise(res=>{const c0=cam,c1=restCam(row);rest={t0:performance.now(),ms:RM?200:(ms||travelMs(Math.abs(c0-c1)/RH)),c0,c1,done:()=>{restRow=row;res();}};});},
  release(){if(!st)return;taken.add(st.row);rows.delete(st.row*2);restRow=st.row;cam=restCam(restRow);st=null;},
  ascend(){return new Promise(res=>{const c0=cam,c1=restCam(0),dist=Math.abs(c0-c1)/RH;rest={t0:performance.now(),ms:travelMs(dist,RM),c0,c1,done:()=>{restRow=0;res();}};});},
  get stActive(){return !!st;},get descending(){return !!st&&st.phase!=='hold';}
 };})();

/* ---------- helpers ---------- */
const tip=$('#tip');
const NOHOVER=matchMedia('(hover:none)').matches;
function showTip(t,x,y){if(NOHOVER)return;tip.textContent=t;tip.style.opacity=1;tip.style.left=clamp(x+14,6,innerWidth-200)+'px';tip.style.top=(y-34)+'px';}
const hideTip=()=>tip.style.opacity=0;
const ui={home:$('#home'),stage:$('#stage'),final:$('#final'),cap:$('#shelfcap'),hud:$('#depthHud'),gauge:$('#gauge'),skip:$('#skiph')};
function type(el,text,speed=14){return new Promise(res=>{if(RM||!speed){el.textContent=text;return res();}let i=0;const id=setInterval(()=>{i++;el.textContent=text.slice(0,i);if(i%3===0)Sfx.key();if(i>=text.length){clearInterval(id);res();}},speed);});}
function countUp(el,to,ms,from=0){if(RM){el.textContent=to;return;}const t0=performance.now();(function f(n){const u=Math.min(1,(n-t0)/ms),e=1-Math.pow(1-u,3);el.textContent=Math.round(from+(to-from)*e);if(u<1)requestAnimationFrame(f);})(t0);}
const floorBanner=$('#floorBanner');let bannerT=0;
function announceFloor(f){
 floorBanner.innerHTML=`<small>Floor ${['I','II','III','IV','V','VI','VII','VIII'][f.id]} \u00b7 ${floorStartFt(f)} ft</small><b>${esc(f.name)}</b><i>${esc(f.sub)}</i>`;
 floorBanner.style.setProperty('--fc',`rgb(${f.lamp.join(',')})`);floorBanner.style.setProperty('--fcd',`rgba(${f.lamp.join(',')},.32)`);floorBanner.dataset.motif=f.motif;floorBanner.classList.remove('on');void floorBanner.offsetWidth;floorBanner.classList.add('on');
 clearTimeout(bannerT);bannerT=setTimeout(()=>floorBanner.classList.remove('on'),RM?2500:4200);}
World.onLedge(initLedge({tiers:TIERS,canActivate:()=>ui.stage.hidden&&$('#cardlayer').hidden,onOpen:b=>openCard(b,{fresh:false}),showTip,hideTip}));
const browse=initBrowse({world:World,floors:FLOORS,startOf:floorStartFt,ft:FT,rm:RM});
World.onDepth(v=>{browse.update(v);const e=$('#dnum');if(e.textContent!==String(v))e.textContent=v;
 const f=floorAtFt(v);$('#dfloor').textContent=f.id?f.name:'';
 if(run&&f.id>run.floor){run.floor=f.id;S.bestFloor=Math.max(S.bestFloor,f.id);announceFloor(f);}});
ui.gauge.innerHTML=TIERS.map(t=>`<div data-t="${t.id}" style="color:${t.spine}"><span>${t.name}</span><i></i></div>`).join('');
World.onGauge((zi,st)=>{$$('div',ui.gauge).forEach(d=>{const id=+d.dataset.t;d.classList.toggle('on',id===zi);d.classList.toggle('passed',id<zi);d.style.display=id<=st.tier?'':'none';});});


/* ---------- particles ---------- */
const FX=(()=>{const cv=$('#fx'),c=cv.getContext('2d');let W=0,H=0,DPR=1,ps=[],on=false,last=0;
 const rs=()=>{DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;c.setTransform(DPR,0,0,DPR,0,0);};rs();addEventListener('resize',rs);
 const R=(a,b)=>a+Math.random()*(b-a);
 const add=p=>{if(RM)return;ps.push(p);if(ps.length>1000)ps.shift();if(!on){on=true;last=performance.now();requestAnimationFrame(loop);}};
 function loop(now){const dt=Math.min(.05,(now-last)/1000)*Feel.ts;last=now;c.clearRect(0,0,W,H);
  for(let i=ps.length-1;i>=0;i--){const p=ps[i];p.t+=dt;if(p.t>=p.max){ps.splice(i,1);continue;}const u=p.t/p.max;
   if(p.k==='ring'){c.globalCompositeOperation='lighter';c.strokeStyle=p.c;c.globalAlpha=(1-u)*.2;c.lineWidth=2.4*(1-u)+.8;c.beginPath();c.arc(p.x,p.y,30+u*p.r,0,6.3);c.stroke();continue;}
   p.vy+=p.g*dt;p.vx*=1-.8*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const al=Math.min(1,(1-u)*1.6)*particleVisibility(p.x,p.y,now);
   if(p.k==='fleck'){c.globalCompositeOperation='source-over';c.globalAlpha=al*.9;c.save();c.translate(p.x,p.y);c.rotate(p.t*p.rot);c.fillStyle=p.c;c.fillRect(-p.s,-p.s*.6,p.s*2,p.s*1.2);c.restore();}
   else if(p.k==='star'){c.globalCompositeOperation='lighter';c.globalAlpha=al;c.fillStyle=p.c;const s=p.s*(1-u*.5);c.beginPath();c.moveTo(p.x,p.y-s*3);c.quadraticCurveTo(p.x,p.y,p.x+s*3,p.y);c.quadraticCurveTo(p.x,p.y,p.x,p.y+s*3);c.quadraticCurveTo(p.x,p.y,p.x-s*3,p.y);c.quadraticCurveTo(p.x,p.y,p.x,p.y-s*3);c.fill();}
   else{c.globalCompositeOperation='lighter';c.globalAlpha=al;c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,Math.max(.3,p.s*(1-u*.4)),0,6.3);c.fill();}}
  c.globalAlpha=1;c.globalCompositeOperation='source-over';
  if(ps.length)requestAnimationFrame(loop);else{on=false;c.clearRect(0,0,W,H);}}
 return{
  burst(x,y,tier,n){const col=TIERS[tier].spine;const mk=o=>add(Object.assign({x,y,t:0,g:0,rot:0,k:'dot'},o));
   mk({k:'ring',max:.7,c:col,r:130+tier*30,vx:0,vy:0});if(tier>=3)mk({k:'ring',max:1.05,c:col,r:230+tier*30,vx:0,vy:0});
   for(let i=0;i<n;i++){const a=R(0,6.283),sp=R(60,330)*(.55+tier*.1);mk({vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-90,g:280,max:R(.6,1.5),s:R(1.2,3),c:Math.random()<.35?PALETTE.amberFff4d6:col});}
   for(let i=0;i<n*.7;i++)mk({vx:R(-40,40),vy:R(-90,-20),g:-6,max:R(1.6,3.2),s:R(.8,2.2),c:col});
   for(let i=0;i<n*.35;i++){const a=R(0,6.283),sp=R(60,240);mk({k:'fleck',vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-120,g:140,max:R(1.2,2.4),s:R(2,4.5),rot:R(-9,9),c:Math.random()<.5?PALETTE.parchmentEfe2c0:PALETTE.brass68});}
   if(tier>=3)for(let i=0;i<4+tier*2;i++){const a=R(0,6.283),d=R(30,170);mk({k:'star',vx:Math.cos(a)*20,vy:Math.sin(a)*20-10,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,max:R(.8,1.8),s:R(1.4,3),c:tier>=6?PALETTE.teal87:PALETTE.amber86});}},
  ember(x,y){add({x,y,t:0,vx:R(-26,26),vy:R(-80,-30),g:-30,max:R(.7,1.4),s:R(.9,1.9),c:PALETTE.amber68,k:'dot',rot:0});},
  puff(x,y,w,h,n){for(let i=0;i<n;i++)add({x:x+Math.random()*w,y:y+Math.random()*h,t:0,vx:R(-30,30),vy:R(-140,-40),g:-20,max:R(.5,1),s:R(1,2.4),c:Math.random()<.5?PALETTE.amberFfd58a:PALETTE.amber89,k:'dot',rot:0});}
 };})();

/* ---------- home ---------- */
let cdTimer=0;
function showHome(){
 run=null;ui.stage.hidden=true;ui.final.hidden=true;ui.hud.hidden=true;ui.gauge.classList.remove('on');clearInterval(cdTimer);
 const d=S.daily[utc()],st=computeStats(S,utc());World.setShelf(S.shelf);
 ui.home.hidden=false;ui.home.className='center fadein';
 ui.home.innerHTML=homeHTML({S,st,d,no:dailyNo(),floorName:S.bestFloor?FLOORS[S.bestFloor].name:'',lexicon:core.lexicon});
 paintJudge(modelStatus());
 World.clearNiches();World.openNiche(0,{label:'No. '+dailyNo(),books:[]});
 $('#bPlay')&&($('#bPlay').onclick=e=>descendInto(e.currentTarget,()=>startDaily(false)));
 $('#bRes')&&($('#bRes').onclick=()=>showFinal(d,true));
 $('#bPrac').onclick=()=>startDaily(true);$('#bUnl').onclick=startUnlimited;
 
 bookify(ui.home);
 if(d){const tick=()=>{const el=$('#nextd');if(!el)return clearInterval(cdTimer);el.textContent='Next descent in '+fmtCountdown(msUntilNextDaily());};tick();cdTimer=setInterval(tick,1000);}
 ui.cap.hidden=true;
}
$('#mark').onclick=()=>{if(World.busy&&World.stActive)return;if(run||ui.home.hidden)return leaveRun();showHome();};
async function leaveRun(){run=null;ui.stage.hidden=true;ui.final.hidden=true;ui.hud.hidden=true;await World.ascend();showHome();}
/* shelf hover/click on canvas */
const cvEl=$('#world');
cvEl.addEventListener('pointermove',e=>{if(ui.home.hidden&&ui.final.hidden||World.stActive||World.restRow!==0){hideTip();cvEl.style.cursor='';return;}
 const h=World.hits().find(h=>e.clientX>=h.x&&e.clientX<=h.x+h.w&&e.clientY>=h.y&&e.clientY<=h.y+h.h);
 if(h){showTip(`${h.b.w} · ${TIERS[h.b.tier].name} · ${h.b.score}`,e.clientX,e.clientY);cvEl.style.cursor='pointer';}else{hideTip();cvEl.style.cursor='';}});
cvEl.addEventListener('click',e=>{if(World.stActive||World.restRow!==0||!(ui.stage.hidden))return;const h=World.hits().find(h=>e.clientX>=h.x&&e.clientX<=h.x+h.w&&e.clientY>=h.y&&e.clientY<=h.y+h.h);if(h){hideTip();openCard(h.b,{fresh:false});}});
/* lore books: thick background books reveal a word; never one from the current run or today's daily */
{let dk='',dw=[];initLore({world:World,canvas:cvEl,pool:WORDS,hash:hashStr,enabled:()=>!World.busy,
 exclude:()=>{if(dk!==utc()){dk=utc();dw=dailyWords(dk,7).map(w=>w.w);}return run?[...dw,...run.words.map(w=>w.w)]:dw;}});}

/* curios: rare thin books hide a loose page, a ribbon, a sealed clasp or a marginal note */
initCurios({world:World,canvas:cvEl,enabled:()=>!World.busy});

/* ---------- judge status (model download) ---------- */
function paintJudge(st){const el=$('#jstat');if(!el)return;
 el.dataset.state=st.state;el.title=st.state==='error'?'Quick judge in use (the full judge could not load)':'';
 el.textContent=st.state==='loading'?`Preparing the judge${st.total?`, ${Math.round(st.progress*100)}%`:'\u2026'}`:st.state==='error'?'Quick judge in use (the full judge could not load)':'';}
onModelStatus(paintJudge);

/* ---------- daily run ---------- */
let run=null,timerId=0;
async function startDaily(practice){
 await wordsReady;
 if(modelStatus().state==='loading')await whenReady(8000);
 const day=utc(),words=dailyWords(day,7);
 prepareWords(words).catch(()=>{});
 World.reset();World.setShelf([]);
 run={practice,day,i:0,words,results:[],busy:false,depthRows:0,floor:0,combo:0,freeHint:true};
 const saved=practice?null:resumable(S,day,words.length);
 if(saved){run.results=saved.results.map(r=>({...r}));run.combo=saved.combo;run.freeHint=!run.results.some(r=>r.hints>0);run.setBonus=saved.setBonus;run.i=run.results.length;run.depthRows=run.results.reduce((n,r)=>n+(r.rows||0),0);
  const L=replayLayout(run.results,{gapRows:World.nextRows(),ftPerRow:FT});L.niches[L.niches.length-1].label=ROMAN[run.i]||'FINIS';World.restore(L);
  ui.home.hidden=true;ui.cap.hidden=true;ui.final.hidden=true;ui.hud.hidden=false;$('#dnum').textContent=String(Math.round(L.finalRow*FT));
  if(L.finalRow>0)await World.glide(L.finalRow,400);
  if(run.i>=words.length)finishRun();else showWord();
  return;}
 ui.home.hidden=true;ui.cap.hidden=true;ui.final.hidden=true;ui.hud.hidden=false;$('#dnum').textContent='0';
 showWord();
}
async function startUnlimited(){
 await wordsReady;
 if(modelStatus().state==='loading')await whenReady(8000);
 const placing=!S.rating.placed,n=placing?core.PLACEMENT_WORDS:core.RUN_WORDS;
 const first=core.nextWord(S.rating,0,n,[]);
 prepareWords([first]).catch(()=>{});
 World.reset();World.setShelf([]);
 run={mode:'unlimited',placing,practice:false,i:0,words:Array(n).fill(first),results:[],busy:false,depthRows:0,floor:0,lex0:core.lexicon(S.rating.L)};
 ui.home.hidden=true;ui.cap.hidden=true;ui.final.hidden=true;ui.hud.hidden=false;$('#dnum').textContent='0';
 showWord();
}
function pipsHTML(){return `<div class="pips" aria-label="word ${run.i+1} of 7">${run.words.map((_,i)=>{const r=run.results[i];const T=r?TIERS[r.tier]:null;return `<i class="pip ${i===run.i?'now':''} ${r?'done':''}" style="${T?`background:${T.spine};box-shadow:0 0 8px ${T.spine}99`:''}"></i>`;}).join('')}</div>`;}
function showWord(){
 if(!run)return;const w=run.words[run.i];run.busy=false;run.t0=performance.now();run.limit=45000;
 const el=ui.stage;el.hidden=false;el.className='center fadein';
 el.innerHTML=`<div class="candle" id="candle" aria-hidden="true"><div class="wax" id="wax"><i class="flame"></i><i class="wick"></i></div><div class="plate"></div></div><div class="sheet">${pipsHTML()}
  <div class="wlabel">Word ${run.i+1} of ${run.words.length}</div>${run.combo?`<div class="combo live" title="Keep answering ${comboNeeds()} or better">Combo ${comboLabel(comboMultiplier(run.combo+1))} next</div>`:''}
  <div class="word" aria-label="${esc(w.w)}">${[...w.w].map((c,i)=>`<span style="animation-delay:${60+i*45}ms">${esc(c)}</span>`).join('')}</div>
  <div class="pos">${esc(w.pos)}</div><div class="clock" id="clock" aria-hidden="true">0:45</div>
  <div class="timer" id="tbar"><i id="tfill"></i></div>
  <div class="slipwrap" id="fld"><i class="pin"></i><div class="slip"><textarea id="ans" placeholder="In your own words\u2026" maxlength="300" aria-label="Your explanation" enterkeyhint="send"></textarea></div></div>
  <div class="hintline" id="hl" aria-live="polite"></div>
  <div class="row" style="margin-top:6px"><button class="btn" id="hint"></button><button class="btn" id="skip">Skip</button><span class="keys"><kbd>Enter</kbd> to submit</span></div></div>`;
 World.openNiche(World.restRow,{label:['I','II','III','IV','V','VI','VII','VIII'][run.i],books:run.results});
 const ta=$('#ans');setTimeout(()=>ta.focus({preventScroll:true}),120);
 ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(false);}};
 ta.oninput=()=>{Sfx.key();const f=$('#candle .flame');if(f){const r=f.getBoundingClientRect();if(r.width){FX.ember(r.left+r.width/2,r.top+4);FX.ember(r.left+r.width/2,r.top+2);}}};
 run.ladder=hintLadder(w);run.hintN=0;paintHintBtn();
 $('#hint').onclick=useHint;$('#skip').onclick=()=>submit(true);
 clearInterval(timerId);
 timerId=setInterval(()=>{if(!run||run.busy)return;const left=Math.max(0,run.limit-(performance.now()-run.t0));const f=$('#tfill');if(!f)return;const fr=left/run.limit;f.style.transform=`scaleX(${fr})`;$('#tbar').classList.toggle('low',left<10000);$('#wax').style.height=(12+58*fr)+'px';$('#candle').classList.toggle('low',left<10000);paintRun(left,run.limit);if(left<=0)submit(!$('#ans').value.trim());},100);
}
function paintHintBtn(){const b=$('#hint');if(!b)return;const n=run.ladder[run.hintN];b.disabled=!n;b.textContent=hintButtonLabel(n,n?(run.freeHint?0:n.cost*FT|0):0,run.ladder.length-run.hintN);const k=$('#skip');if(k)k.textContent=skipButtonLabel(run.combo,run.hintN);}
function useHint(){if(!run||run.busy)return;const n=run.ladder[run.hintN];if(!n)return;run.hintN++;const free=!!run.freeHint;run.freeHint=false;if(!free)run.hintSpent=(run.hintSpent||0)+n.cost;
 const hl=$('#hl');
 hl.insertAdjacentHTML('beforeend',hintSlipHtml(n,run.words[run.i].w,free?0:n.cost*FT|0,run.hintN));Sfx.flip&&Sfx.flip();requestAnimationFrame(()=>hl.classList.add('on'));paintHintBtn();$('#ans').focus({preventScroll:true});}
async function submit(skipped){
 if(!run||run.busy)return;const w=run.words[run.i];let text=$('#ans').value.trim();
 if(!skipped&&!text){const f=$('#fld');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake');return;}
 run.busy=true;clearInterval(timerId);
 const j=skipped?{score:0,caught:[],missed:w.concepts.map(c=>c[0]),opposite:false,empty:true}:await judgeAnswer(text,w);
 const t=tierOf(j.score);
 const spent=skipped?0:(run.hintSpent||0);run.hintSpent=0;
 const base=skipped?2:rowsAfterHints(Math.max(3,Math.round(3+.32*j.score)),spent);
 const cb=applyCombo(run.combo,t,base,skipped);run.combo=cb.chain;const rows=cb.rows;
 const book={wid:w.id,w:w.w,pos:w.pos,def:w.def,answer:skipped?'':text,score:j.score,tier:t,mode:run.mode||'daily',t:Date.now(),no:dailyNo(),hints:run.hintN||0,verdict:skipped?'Skipped. The word stays closed.':verdictFor(j,t,w),rows,ft:Math.round(rows*FT),combo:cb.chain>=2?{n:cb.chain,mult:cb.mult,ft:Math.round(cb.bonus*FT)}:undefined};
 {const sw=$('#fld');if(sw){sw.classList.add('sending');const r=sw.getBoundingClientRect();FX.puff(r.left,r.top,r.width,r.height,40);}}
 await sleep(260);ui.stage.classList.add('out');await sleep(300);ui.stage.hidden=true;
 ui.gauge.classList.add('on');ui.skip.classList.add('on');
 const depth0=Math.round(World.restRow*FT),nicheRow=World.restRow;
 await World.descend({rows,tier:t,score:j.score,word:w.w});
 ui.gauge.classList.remove('on');ui.skip.classList.remove('on');
 FX.burst(innerWidth/2,innerHeight*.5,t,16+t*8);
 run.results.push({...book,skipped});run.depthRows+=rows;
 World.fillNiche(nicheRow,{w:w.w,pos:w.pos,answer:text,score:j.score,tier:t,ft:book.ft,verdict:book.verdict,skipped},run.results.slice());
 if(run.mode==='unlimited'){S.rating=core.applyResult(S.rating,w,j.score,run.i);save();}
 if(!run.practice){S.shelf.push({...book});if(S.shelf.length>300)S.shelf.shift();{const fin=recordSetBook(S,book);toastSetsDone(fin);run.setBonus=(run.setBonus||0)+fin.reduce((n,x)=>n+x.bonus,0);}save();}
 if(!run.practice&&run.mode!=='unlimited'){S.dailyRun=snapshotRun(run);save();}
 const depth1=Math.round((World.restRow+rows)*FT);
 openCard(book,{fresh:true,depth0,depth1,broke:cb.broke,chain:cb.chain,last:run.i>=run.words.length-1,onNext:async()=>{World.release();run.i++;run.busy=true;const last=run.i>=run.words.length;if(!last&&run.mode==='unlimited'){run.words[run.i]=core.nextWord(S.rating,run.i,run.words.length,run.words.slice(0,run.i).map(x=>x.id));prepareWords([run.words[run.i]]).catch(()=>{});}const nr=World.restRow+World.nextRows();World.openNiche(nr,{label:last?'FINIS':['I','II','III','IV','V','VI','VII','VIII'][run.i],books:run.results});await World.glide(nr,1200);if(last)finishRun();else showWord();}});
}
function verdictFor(j,t,w){if(j.empty)return 'Nothing written.';if(j.opposite)return 'That points the other way. The word means close to the opposite.';const T=TIERS[t];return T.lines[(w.id+j.score)%T.lines.length];}
function finishRun(){
 const r=run;const books=r.results;const avg=Math.round(books.reduce((a,b)=>a+b.score,0)/books.length);const best=Math.max(...books.map(b=>b.tier));
 const worldDepth=Math.round(World.restRow*FT),setBonus=r.setBonus||0,isDaily=r.mode!=='unlimited',depth=isDaily?worldDepth:worldDepth+setBonus; // Daily depth is words only: set bonuses depend on each player's collection, so they stay out of the shared score
 const d={books,avg,best,depth,floor:floorAtFt(worldDepth).id,practice:r.practice,setBonus:setBonus||undefined};
 if(r.mode==='unlimited'){S.rating=core.finishRating(S.rating,avg);S.bestDepth=Math.max(S.bestDepth,depth);save();Object.assign(d,{mode:'unlimited',placing:r.placing,lex0:r.lex0,lex:core.lexicon(S.rating.L)});}
 else if(!r.practice){delete S.dailyRun;if(core.recordDaily(S,r.day||utc(),d))S.bestDepth=Math.max(S.bestDepth,depth);save();}
 showFinal(d,false);
}
const BLK='▁▂▃▄▅▆▇';
function shareText(d){return `Deepstack ${d.mode==='unlimited'?'Unlimited \u00b7 Lexicon '+d.lex:'No. '+dailyNo()}\nDepth ${d.depth} ft${d.floor?' · '+FLOORS[d.floor].name:''} · average closeness ${d.avg}\n${d.books.map(b=>BLK[b.tier]).join('')}\n${d.books.map(b=>TIERS[b.tier].name).join(' · ')}`;}
async function showFinal(d,fromHome){
 if(fromHome){ui.home.hidden=true;ui.cap.hidden=true;await coverWorld();World.setShelf([]);
  /* replay the whole descent: every alcove and floor again, ending at the results */
  const L=replayLayout(d.books,{gapRows:World.nextRows(),ftPerRow:FT});World.restore(L);ui.hud.hidden=false;liftWorld();
  if(L.finalRow>0){await World.glide(L.finalRow);if(!ui.home.hidden)return;}}
 ui.hud.hidden=false;$('#dnum').textContent=d.depth;
 World.openNiche(World.restRow,{label:'FINIS',books:[]});
 const txt=shareText(d);const el=ui.final;el.hidden=false;el.className='center fadein';
 el.innerHTML=finalHTML(d,S,{txt,rarest:TIERS[d.best].name,no:dailyNo(),floorName:d.floor?FLOORS[d.floor].name:'',levelTitle,spines:d.books.map((b,i)=>spineImg(b,i,'final',132)).join('')});
 countUp($('#cnt'),d.depth,1200);
 bindRecap(el,d.books,openCard);
 $$('#sp img').forEach(im=>{im.onclick=()=>openCard(d.books[+im.dataset.i],{fresh:false});});
 $('#cp').onclick=async()=>{try{await navigator.clipboard.writeText(txt);$('#cp').textContent='Copied';}catch(e){const r=document.createRange();r.selectNodeContents($('#shr'));const s=getSelection();s.removeAllRanges();s.addRange(r);$('#cp').textContent='Selected — copy it';}};
 $('#up').onclick=async()=>{ui.final.hidden=true;ui.hud.hidden=true;run=null;await World.ascend();showHome();};
}

/* ---------- result card ---------- */
let cardOpts=null;
function openCard(b,opts={}){
 cardOpts=opts;const T=TIERS[b.tier],L=$('#cardlayer');
 L.innerHTML=`<div class="book t${b.tier}" id="bk" style="--tc:${T.spine};--ti:${T.ink};--tf:${[PALETTE.ash13,PALETTE.ash13,PALETTE.white,PALETTE.white,PALETTE.ash13,PALETTE.white,PALETTE.ash13][b.tier]}">
  <div class="halo" id="halo"></div>
  <div class="page">
   <div class="tierbar"><b>${T.name}</b><span>${T.rar}</span></div>
   <div class="inner">
   <h2>${esc(b.w)}<small>${esc(b.pos)}</small></h2>
   <p class="verdict ${opts.fresh?'':'on'}" id="vd">${esc(b.verdict)}</p>
   <p class="def">${esc(b.def)}</p>
   ${b.answer?`<p class="wrote">You wrote: \u201c${esc(b.answer)}\u201d</p>`:''}
   <div class="chips">
    ${opts.fresh?`<span><b>+${b.ft} ft</b> \u00b7 ${opts.depth1} ft</span>`:b.t?`<span>${b.mode==='daily'?'No. '+Math.max(1,core.dailyNumber(new Date(b.t).toISOString().slice(0,10)))+' \u00b7 ':''}${new Date(b.t).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}${b.ft?' \u00b7 <b>+'+b.ft+' ft</b>':''}</span>`:''}
    ${opts.fresh&&b.combo?`<span class="cb">Combo <b>${comboLabel(b.combo.mult)}</b> \u00b7 ${b.combo.n} in a row</span>`:opts.fresh&&opts.broke?`<span>Combo broken</span>`:''}
    <span class="cs"><b id="cn">${opts.fresh?0:b.score}</b>/100<div class="meter"><i id="mt" style="width:${opts.fresh?0:b.score}%"></i></div></span>
   </div>
   ${!opts.fresh&&opts.nav?`<button class="btn favbtn" id="cfav" aria-pressed="${!!b.fav}">${b.fav?'★ Favourite':'☆ Mark as favourite'}</button>`:''}
   ${opts.nav?`<div class="cardnav"><button class="btn" id="cprev" aria-label="Previous book"${opts.nav.i<=0?' disabled':''}>\u2039</button><span>${opts.nav.i+1} of ${opts.nav.items.length}</span><button class="btn" id="cnext" aria-label="Next book"${opts.nav.i>=opts.nav.items.length-1?' disabled':''}>\u203a</button></div>`:''}
   <button class="btn pri go" id="go">${opts.onNext?(opts.last?'See your descent':'Next word'):'Close'} <kbd>Enter</kbd></button>
   </div>
  </div>
  <div class="cover"><span class="ct">${T.rar}</span><div class="orn"></div><div class="cw">${esc(b.w)}</div><div class="orn"></div><span class="ct">${T.name}</span></div>
 </div>`;
 L.hidden=false;requestAnimationFrame(()=>L.classList.add('on'));
 const bk=$('#bk');
 if(opts.fresh){setTimeout(async()=>{Sfx.flip();if(b.tier>=5)Sfx.sting(b.tier);if(b.tier>=4){Feel.shake(2+b.tier*1.1,b.tier>=6?900:600);Feel.slowmo(b.tier>=6?.25:b.tier>=5?.4:.6,b.tier>=6?1700:1200);}if(b.tier>=6)flashTop();bk.classList.add('open');{const pl=playReveal(L,b.tier,T.spine,RM);if(pl.ink)bk.classList.add('rv-ink');if(pl.tier>=5)bk.classList.add('rv-pulse');}{const rc=bk.getBoundingClientRect();FX.burst(rc.left+rc.width/2,rc.top+rc.height*.45,b.tier,30+b.tier*24);const hh=$('#halo');if(hh)hh.classList.add('go');}await sleep(380);if(cardOpts!==opts)return;Sfx.chime(b.tier);$('#mt').style.width=b.score+'%';countUp($('#cn'),b.score,550);await sleep(250);if(cardOpts!==opts)return;$('#vd').classList.add('on');if(b.tier>=3){const rc=bk.getBoundingClientRect();FX.burst(rc.left+rc.width/2,rc.top+80,b.tier,30+b.tier*14);}$('#go').focus();},220);}
 else{bk.classList.add('open','gone');setTimeout(()=>$('#go').focus(),50);}
 $('#go').onclick=closeCard;
 const fv=$('#cfav');if(fv)fv.onclick=()=>{b.fav=!b.fav;if(!b.fav)delete b.fav;save();fv.setAttribute('aria-pressed',!!b.fav);fv.textContent=b.fav?'★ Favourite':'☆ Mark as favourite';};
 if(opts.nav){const step=n=>openCard(opts.nav.items[opts.nav.i+n],{...opts,nav:{...opts.nav,i:opts.nav.i+n}});$('#cprev').onclick=()=>step(-1);$('#cnext').onclick=()=>step(1);}
 L.onclick=e=>{if(e.target===L&&!opts.onNext)closeCard();};
}
function flashTop(){const f=document.createElement('div');f.style.cssText='position:fixed;inset:0;z-index:70;pointer-events:none;background:radial-gradient(circle at 50% 45%,rgba(190,252,255,.55),rgba(190,252,255,0) 60%);opacity:0;transition:opacity .25s ease-out';document.body.appendChild(f);requestAnimationFrame(()=>{f.style.opacity=1;setTimeout(()=>{f.style.transition='opacity 1.6s ease-in';f.style.opacity=0;setTimeout(()=>f.remove(),1700);},260);});}
function closeCard(){const L=$('#cardlayer');const o=cardOpts;cardOpts=null;L.classList.remove('on');setTimeout(()=>{L.hidden=true;L.innerHTML='';},250);if(o&&o.onNext)o.onNext();}
addEventListener('keydown',e=>{
 if(!$('#cardlayer').hidden&&cardOpts&&cardOpts.nav&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){const b=$(e.key==='ArrowLeft'?'#cprev':'#cnext');if(b&&!b.disabled){e.preventDefault();b.click();}return;}
 if(!$('#cardlayer').hidden&&cardOpts&&(e.key==='Enter')&&e.target.id!=='go'){e.preventDefault();closeCard();return;}
 if(e.key==='Escape'){if(!$('#cardlayer').hidden&&cardOpts&&!cardOpts.onNext)closeCard();else if(!$('#cardlayer').hidden&&cardOpts&&!cardOpts.onNext)closeCard();}
 if(World.descending&&(e.key===' '||e.key==='Escape'||e.key==='Enter')){e.preventDefault();World.skipDown();}
});

/* ---------- shelf, sets and stats: pages of the menu books (src/ui/bookMenus.js, home.js BOOK_PAGES) ---------- */
const bookOpenCard=()=>!$('#cardlayer').hidden;
BOOK_PAGES.bAll=shelfBook({S,core,TIERS,openCard,showTip,hideTip,keepOnEsc:bookOpenCard});
BOOK_PAGES.bSets={...setsBook(S),keepOnEsc:bookOpenCard};
BOOK_PAGES.bDaily={...dailyBook({S,today:utc,streak:()=>computeStats(S,utc()).streak,wordsReady,wordsLoaded:()=>wordsLoaded}),keepOnEsc:bookOpenCard};
BOOK_PAGES.bStats={...statsBook({S,st:()=>computeStats(S,utc()),TIERS,FLOORS,floorStartFt:core.floorStartFt}),keepOnEsc:bookOpenCard};
const RHnow=()=>clamp(innerHeight*.22,108,172);

applySound();
initTransitions();
showHome();
startModelLoad();
window.__deepstack={S,World,startDaily,startUnlimited,showHome,judge:judgeAnswer,get run(){return run;}};
