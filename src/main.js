import './styles.css';
import * as core from './core/index.js';
import {Sfx,Feel} from './feel.js';
import {judgeAnswer,prepareWords,startModelLoad,onModelStatus,modelStatus,whenReady} from './scorer/index.js';
const {TIERS,tierOf,WORDS,hashStr,mulberry,levelUpdate,levelTitle,pickWord,dailyWords,loadWords}=core;
const wordsReady=loadWords();
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep=ms=>new Promise(r=>setTimeout(r,RM?Math.min(ms,30):ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* storage */
const mem={};
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return k in mem?mem[k]:d}},set(k,v){mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let S=Object.assign({shelf:[],daily:{},streak:{last:'',n:0},bestDepth:0,sound:false},store.get('deepstack.v1',{}));
const save=()=>store.set('deepstack.v1',S);
const utc=()=>new Date().toISOString().slice(0,10);
const dailyNo=()=>Math.floor((Date.parse(utc())-Date.parse('2026-01-01'))/864e5)+1;
const FT=4.2; // feet per shelf row
function applySound(){const b=$('#bSound');b.setAttribute('aria-pressed',S.sound);b.textContent=S.sound?'Sound on':'Sound';Sfx.set(S.sound);}
$('#bSound').onclick=()=>{S.sound=!S.sound;save();applySound();};

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
 c.globalAlpha=.12;for(let i=0;i<Math.max(8,w*h/110);i++){c.fillStyle=rng()<.5?'#000':'#fff';c.fillRect(x0+rng()*w,y0+rng()*h,1,1+rng()*(T>=4?2:5));}
 if(T<=2){c.globalAlpha=.16;for(let i=0;i<3;i++){c.fillStyle='#e9d8b0';c.beginPath();c.ellipse(x0+rng()*w,y0+rng()*h,w*(.2+rng()*.4),3+rng()*8,rng()*3,0,6.3);c.fill();}}
 c.globalAlpha=1;
 // raised bands
 const bands=T>=3?[.1,.2,.5,.84]:[.12,.2,.84];
 for(const p of bands){const yy=y0+h*p;c.fillStyle='rgba(0,0,0,.5)';c.fillRect(x0,yy,w,2);c.fillStyle=T>=4?'#e8c66a':'rgba(255,230,180,.26)';c.fillRect(x0,yy+2,w,1.4);if(T>=4){c.fillStyle='#fff6';c.fillRect(x0+w*.2,yy+2,w*.3,.8);}}
 // label / lettering
 const lw=w*.7,lh=Math.min(h*.5,Math.max(28,(o.word||'').length*5.6)),ly=y0+h*.3;
 if(T<=2&&(o.word||T>=1)){c.save();c.translate(0,ly+lh/2);c.rotate(((o.seed%7)-3)*.012);c.fillStyle='#e6d8b2';c.globalAlpha=.94;c.fillRect(-lw/2,-lh/2,lw,lh);c.globalAlpha=.4;c.fillStyle='#000';c.fillRect(-lw/2,-lh/2,lw,1);c.fillRect(-lw/2,lh/2-1,lw,1);c.restore();}
 if(T===0||T===-1&&rng()<.3){c.save();c.globalAlpha=.7;c.fillStyle='#d8cca8';c.translate(0,y0+h*.58);c.rotate(-.5);c.fillRect(-w*.7,-3,w*1.4,6);c.restore();}
 if(T>=4){c.fillStyle='#f0c764';c.globalAlpha=.85;c.fillRect(x0+w*.14,ly-6,w*.72,1.4);c.fillRect(x0+w*.14,ly+lh+4,w*.72,1.4);c.globalAlpha=1;}
 // damage + shading
 if(worn||T<0){c.globalAlpha=.3;const sg=c.createRadialGradient(x0+w*.7,y0+h*.8,0,x0+w*.7,y0+h*.8,w);sg.addColorStop(0,'#2a1608');sg.addColorStop(1,'#0000');c.fillStyle=sg;c.fillRect(x0,y0,w,h);c.globalAlpha=1;}
 if(o.dust){c.globalAlpha=Math.min(.55,o.dust);const dg=c.createLinearGradient(0,y0,0,y0+h*.5);dg.addColorStop(0,'#cfc5ae');dg.addColorStop(1,'#cfc5ae00');c.fillStyle=dg;c.fillRect(x0,y0,w,h*.5);c.globalAlpha=1;}
 c.fillStyle='rgba(255,255,255,.2)';c.fillRect(x0,y0,1.4,h);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x0+w-1.6,y0,1.6,h);
 c.restore();
 // word on spine
 if(o.word){c.save();c.translate(0,ly+lh/2);c.rotate(-Math.PI/2);const fs=clamp(w*.46,8,13);c.font=`${fs}px "IM Fell English",Georgia,serif`;c.textAlign='center';c.textBaseline='middle';
  if(T>=3){c.fillStyle='#f0c764';c.shadowColor='#000';c.shadowBlur=2;}else c.fillStyle='#2a2013';c.fillText(o.word,0,0,lh*.94);c.restore();}
 // gems / seals
 if(T===5){c.fillStyle='#b01c24';c.beginPath();c.arc(0,y0+h*.14,Math.min(5,w*.2),0,6.3);c.fill();c.fillStyle='#ff9090';c.fillRect(-1,y0+h*.14-2,1.5,1.5);}
 if(T===6){c.save();c.translate(0,y0+h*.14);c.rotate(.785);const r=Math.min(5.5,w*.2);const gg=c.createLinearGradient(-r,-r,r,r);gg.addColorStop(0,'#eaffff');gg.addColorStop(.55,'#55ffff');gg.addColorStop(1,'#1aa3b0');c.fillStyle=gg;c.shadowColor='#55ffff';c.shadowBlur=10;c.fillRect(-r,-r,r*2,r*2);c.restore();}
 c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=1;c.beginPath();c.moveTo(x0,0);c.lineTo(x0,y0);c.lineTo(x0+w,y0);c.lineTo(x0+w,0);c.stroke();
 // bookmark ribbon (hangs out of the bottom)
 if(o.ribbon){const rx=x0+w*(.25+rng()*.4),rl=10+rng()*14,sw=Math.sin(t*1.3+o.seed)*1.2;c.fillStyle=o.ribbon;c.beginPath();c.moveTo(rx,-3);c.lineTo(rx+3.6,-3);c.lineTo(rx+3.6+sw,rl);c.lineTo(rx+1.8+sw,rl-3.5);c.lineTo(rx+sw,rl);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.25)';c.fillRect(rx,-3,1,rl*.8);}
 c.restore();
}
const RIBBONS=['#a3202a','#c9a227','#2d6a4f','#274c8f','#7a2a7a'];
function bookDims(b,rh){const hs=((b.w||'a').charCodeAt(0)*13+(b.w||'a').length*7)%20;return{w:Math.round(22+Math.min(16,(b.w||'').length*1.5)+b.tier*1.8),h:Math.round(rh*(.5+.04*b.tier)+hs),};}
const seedOf=b=>hashStr(b.w+(b.t||''))&0xffff;
const urlCache=new Map();
function spineURL(b,rh=110){const k=b.w+'|'+b.tier+'|'+rh;if(urlCache.has(k))return urlCache.get(k);
 const d=bookDims(b,rh),pw=d.w+16,ph=d.h+30,cv=document.createElement('canvas');cv.width=pw*2;cv.height=ph*2;const c=cv.getContext('2d');c.scale(2,2);c.translate(pw/2,d.h+8);
 bookArt(c,{w:d.w,h:d.h,tier:b.tier,seed:seedOf(b),word:b.w,ribbon:b.tier>=1||seedOf(b)%3===0?RIBBONS[seedOf(b)%RIBBONS.length]:null},0);
 const r={url:cv.toDataURL(),w:pw,h:ph};urlCache.set(k,r);return r;}
const spineImg=(b,i,src,rh=110,scale=1)=>{const s=spineURL(b,rh);return `<img src="${s.url}" width="${s.w*scale}" height="${s.h*scale}" alt="${esc(b.w)}, ${TIERS[b.tier].name}" data-i="${i}" data-src="${src}" data-tip="${esc(b.w)} · ${TIERS[b.tier].name} · ${b.score}">`;};
if(document.fonts&&document.fonts.load)Promise.all(['16px "IM Fell English"','16px Newsreader','24px Caveat'].map(f=>document.fonts.load(f))).then(()=>{urlCache.clear();}).catch(()=>{});

/* ---------- the stacks (continuous canvas world) ---------- */
const World=(()=>{
 const cv=$('#world'),ctx=cv.getContext('2d');
 let W=0,H=0,DPR=1,RH=150,BM=20,rows=new Map(),taken=new Set(),cam=0,restRow=0,st=null,dust=[],vt=0,last=performance.now();
 let shelf=[],hits=[],onDepth=null,gaugeCb=null,niches=new Map();
 const ZS=[0,.14,.3,.46,.62,.78,.92];
 const restCam=r=>r*RH-(H-RH-BM);
 const abn=r=>clamp(r/190,0,1);
 const barPx=()=>52+(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat'))||0);
 function nicheBox(){const nw=Math.min(W-24,760),NT=barPx()+16,NB=H-RH-BM-10;return{x:(W-nw)/2,w:nw,t:NT,h:NB-NT,b:NB};}
 function setNicheVars(){const n=nicheBox(),r=document.documentElement.style;r.setProperty('--nx',n.x+'px');r.setProperty('--nw',n.w+'px');r.setProperty('--nt',n.t+'px');r.setProperty('--nb',(H-n.b)+'px');}
 function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);RH=clamp(H*.22,108,172);BM=Math.max(14,parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab'))||14);rows.clear();
  document.documentElement.style.setProperty('--shelfH',(RH+BM+10)+'px');setNicheVars();document.documentElement.style.setProperty('--rh',Math.round(RH*.8)+'px');if(!st)cam=restCam(restRow);}
 function genRow(r,layer){
  const key=r*2+layer;if(rows.has(key))return rows.get(key);
  const rng=mulberry(r*7919+layer*104729+13),a=abn(r),sc=layer?.72:1,bs=[],webs=[];let x=-6;
  while(x<W+40){const w=(10+rng()*22)*sc;
   if(rng()<.03+.24*a){x+=w*(.5+rng());continue;} // missing books
   const cx=x+w/2;if(layer===0&&(taken.has(r)||(st&&st.row===r))&&Math.abs(cx-W/2)<34){x+=w;continue;}
   const h=RH*sc*(.46+rng()*.34);
   const lean=layer===0?-(((x+w/2)/W)*2-1)*.12*a:0;const tilt=(rng()<.05+.32*a?(rng()-.5)*(.1+.45*a):0)+lean;
   const tier=rng()<.05?Math.floor(rng()*rng()*7):-1;
   const col=tier>=0?tierBase(tier):mixc(LEATHER[(rng()*LEATHER.length)|0],[110,100,86],a*.5);
   bs.push({x:x,w,h,tier,col,tilt,seed:(rng()*65536)|0,rib:rng()<.14?RIBBONS[(rng()*5)|0]:null,lying:rng()<.09*a});
   x+=w+(rng()<.1?3+rng()*12:1);}
  if(layer===0){for(let i=0;i<=3;i++){const ux=i*(W/3);if(rng()<.3+.7*a){const dir=i===3?-1:1;webs.push({k:'corner',x:ux+dir*7,y:0,dir,s:34+rng()*(60+120*a),seed:(rng()*999)|0});}
    if(i<3&&rng()<.1+.8*a){webs.push({k:'curtain',x:ux+7,x2:ux+W/3-7,sag:30+rng()*60,seed:(rng()*999)|0});}}
   const nh=a>.03?Math.floor(rng()*(1+8*a)):0;for(let i=0;i<nh;i++)webs.push({k:'strand',x:rng()*W,len:20+rng()*60,seed:(rng()*999)|0});}
  const data={bs,webs,crack:rng()<.5*a?{x:rng()*W,w:30+rng()*90}:null};rows.set(key,data);return data;}
 function drawWeb(wb,y,a){
  ctx.strokeStyle=`rgba(224,218,200,${.14+.3*a})`;ctx.lineWidth=1;const rng=mulberry(wb.seed);
  if(wb.k==='corner'){const n=5,s=wb.s,pts=[];for(let i=0;i<n;i++){const ang=(i/(n-1))*Math.PI/2*(.9+rng()*.2);pts.push([wb.x+wb.dir*Math.cos(ang)*s,y+Math.sin(ang)*s]);ctx.beginPath();ctx.moveTo(wb.x,y);ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();}
   for(let k=1;k<=3;k++){const f=k/3.2;ctx.beginPath();for(let i=0;i<n;i++){const px=wb.x+(pts[i][0]-wb.x)*f,py=y+(pts[i][1]-y)*f;if(i===0)ctx.moveTo(px,py);else{const pm=[wb.x+(pts[i-1][0]-wb.x)*f,y+(pts[i-1][1]-y)*f];ctx.quadraticCurveTo((pm[0]+px)/2-wb.dir*3,(pm[1]+py)/2-3,px,py);}}ctx.stroke();}}
  else if(wb.k==='curtain'){const mx=(wb.x+wb.x2)/2;ctx.beginPath();ctx.moveTo(wb.x,y+2);ctx.quadraticCurveTo(mx,y+2+wb.sag,wb.x2,y+2);ctx.stroke();
   for(let i=1;i<7;i++){const t=i/7,px=wb.x+(wb.x2-wb.x)*t,py=y+2+wb.sag*2*t*(1-t)*.5;ctx.beginPath();ctx.moveTo(px,y+2);ctx.lineTo(px+(rng()-.5)*8,py+wb.sag*.35*(1-Math.abs(t-.5)*1.4));ctx.stroke();}}
  else{ctx.beginPath();ctx.moveTo(wb.x,y);ctx.quadraticCurveTo(wb.x+6*Math.sin(vt*.7+wb.seed),y+wb.len*.5,wb.x+2,y+wb.len);ctx.stroke();}}
 function drawRow(r,layer,cam_,sc,dim){
  const rh=RH*sc,y=r*rh-cam_,base=y+rh-12*sc,a=abn(r),d=genRow(r,layer);
  const body=(bx0,bx1)=>{
   const bw=bx1-bx0;
   const bg=ctx.createLinearGradient(0,y,0,base);bg.addColorStop(0,'#0a0705');bg.addColorStop(1,'#17110b');ctx.globalAlpha=dim;ctx.fillStyle=bg;ctx.fillRect(bx0-70,y-40,bw+140,rh+80);
   ctx.fillStyle='#2b1d12';ctx.fillRect(bx0-70,base,bw+140,12*sc+40);ctx.fillStyle='#4d3623';ctx.fillRect(bx0-70,base,bw+140,2*sc);ctx.fillStyle='#00000066';ctx.fillRect(bx0-70,base+12*sc-2,bw+140,2);
   if(d.crack){ctx.fillStyle='#050302';ctx.beginPath();ctx.moveTo(d.crack.x,base);ctx.lineTo(d.crack.x+d.crack.w*.5,base+5*sc);ctx.lineTo(d.crack.x+d.crack.w,base);ctx.lineTo(d.crack.x+d.crack.w,base+12*sc);ctx.lineTo(d.crack.x,base+12*sc);ctx.fill();}
   ctx.globalAlpha=1;
   if(layer===0&&r===0){hits=[];let x=Math.max(34,(W-Math.min(W-60,1040))/2),maxX=W-Math.max(34,(W-Math.min(W-60,1040))/2);
    const vis=[];let tot=0;for(let i=shelf.length-1;i>=0;i--){const b=shelf[i],dm=bookDims(b,RH);if(tot+dm.w+3>maxX-x)break;tot+=dm.w+3;vis.unshift({b,dm});}
    for(const v of vis){const {b,dm}=v;const bx=x+dm.w/2;ctx.save();ctx.translate(bx,base);
     bookArt(ctx,{w:dm.w,h:dm.h,tier:b.tier,seed:seedOf(b),word:b.w,ribbon:b.tier>=1||seedOf(b)%3===0?RIBBONS[seedOf(b)%RIBBONS.length]:null},vt);ctx.restore();
     hits.push({x:x,y:base-dm.h,w:dm.w,h:dm.h+16,b});x+=dm.w+3;}
    shelfVisible=vis.length;}
   else{
    for(const b of d.bs){if(b.x+b.w<bx0-50||b.x>bx1+50)continue;ctx.save();const bx=b.x+b.w/2;
     if(b.lying){ctx.translate(bx,base);ctx.rotate(-.04);bookArt(ctx,{w:b.h*.7,h:b.w*1.2,tier:b.tier,col:b.col,seed:b.seed,dust:a*.9,ribbon:b.rib},vt);}
     else{ctx.translate(bx,base);if(b.tilt){ctx.translate(b.w/2,0);ctx.rotate(b.tilt);ctx.translate(-b.w/2,0);}
      if(layer===0)bookArt(ctx,{w:b.w,h:b.h,tier:b.tier,col:b.col,seed:b.seed,dust:a*.8,ribbon:b.rib},vt);
      else{ctx.fillStyle=rgbs(b.col);ctx.fillRect(-b.w/2,-b.h,b.w,b.h);}}
     ctx.restore();}}
   if(layer===0)for(const wb of d.webs){const wx=wb.k==='strand'?wb.x:wb.x;if(wx>=bx0-120&&wx<=bx1+120)drawWeb(wb,y,a);}
  };
  if(layer===0&&r!==0&&a>.03){
   for(let i=0;i<3;i++){const bx0=i*W/3,bx1=bx0+W/3;ctx.save();ctx.beginPath();ctx.rect(bx0,y-1,W/3,rh+2);ctx.clip();ctx.fillStyle='#070504';ctx.fillRect(bx0,y-1,W/3,rh+2);
    const th=(i===0?1:i===2?-1:0)*.085*a;if(th){const cx=(bx0+bx1)/2,cy=y+rh/2;ctx.translate(cx,cy);ctx.rotate(th);ctx.translate(-cx,-cy);}
    body(bx0,bx1);ctx.restore();}
  }else body(0,W);
  ctx.globalAlpha=dim;ctx.fillStyle='#1f150d';for(let i=0;i<=3;i++){const ux=i*(W/3);ctx.fillRect(ux-(i?7*sc:0),y,14*sc,rh);ctx.fillStyle='#ffffff10';ctx.fillRect(ux-(i?7*sc:0)+2,y,1.5,rh);ctx.fillStyle='#1f150d';}ctx.globalAlpha=1;
  return {base,d};}
 function drawNiche(row,nv,camNow,now){const t0=nv.t0;
  const n=nicheBox(),y=n.t+(row*RH-(H-RH-BM))-camNow,h=n.h,x=n.x,w=n.w;if(y>H+20||y+h<-20)return;
  const al=clamp((now-t0)/450,0,1),a=abn(row),r=Math.min(52,w*.09);
  ctx.save();ctx.globalAlpha=al;
  const path=()=>{ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x,y+r);ctx.arc(x+r,y+r,r,Math.PI,1.5*Math.PI);ctx.lineTo(x+w-r,y);ctx.arc(x+w-r,y+r,r,1.5*Math.PI,2*Math.PI);ctx.lineTo(x+w,y+h);ctx.closePath();};
  path();const ig=ctx.createLinearGradient(0,y,0,y+h);ig.addColorStop(0,'#150e08');ig.addColorStop(1,'#0e0905');ctx.fillStyle=ig;ctx.fill();
  ctx.save();path();ctx.clip();
  ctx.fillStyle='#ffffff05';for(let gx=x+30;gx<x+w;gx+=46)ctx.fillRect(gx,y,1,h);
  const wg=ctx.createRadialGradient(x+w/2,y+h*.5,0,x+w/2,y+h*.5,w*.72);wg.addColorStop(0,`rgba(255,190,110,${.2-.08*a})`);wg.addColorStop(1,'rgba(255,190,110,0)');ctx.globalCompositeOperation='lighter';ctx.fillStyle=wg;ctx.fillRect(x,y,w,h);ctx.globalCompositeOperation='source-over';
  let eg=ctx.createLinearGradient(x,0,x+40,0);eg.addColorStop(0,'rgba(0,0,0,.65)');eg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=eg;ctx.fillRect(x,y,40,h);
  eg=ctx.createLinearGradient(x+w,0,x+w-40,0);eg.addColorStop(0,'rgba(0,0,0,.65)');eg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=eg;ctx.fillRect(x+w-40,y,40,h);
  eg=ctx.createLinearGradient(0,y,0,y+46);eg.addColorStop(0,'rgba(0,0,0,.7)');eg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=eg;ctx.fillRect(x,y,w,46);
  ctx.restore();
  // carved frame
  ctx.lineJoin='round';path();ctx.lineWidth=20;const fg=ctx.createLinearGradient(x,0,x+w,0);fg.addColorStop(0,'#2b1c10');fg.addColorStop(.5,'#4a3220');fg.addColorStop(1,'#2b1c10');ctx.strokeStyle=fg;ctx.stroke();
  path();ctx.lineWidth=2;ctx.strokeStyle='#7a5a3a';ctx.stroke();
  ctx.save();ctx.translate(0,0);const p2=()=>{ctx.beginPath();ctx.moveTo(x-6,y+h);ctx.lineTo(x-6,y+r);ctx.arc(x+r,y+r,r+6,Math.PI,1.5*Math.PI);ctx.lineTo(x+w-r,y-6);ctx.arc(x+w-r,y+r,r+6,1.5*Math.PI,2*Math.PI);ctx.lineTo(x+w+6,y+h);};p2();ctx.lineWidth=1;ctx.strokeStyle='#00000099';ctx.stroke();ctx.restore();
  // ledge
  ctx.fillStyle='#35241a';ctx.fillRect(x-14,y+h,w+28,12);ctx.fillStyle='#6a4a30';ctx.fillRect(x-14,y+h,w+28,2);ctx.fillStyle='#0008';ctx.fillRect(x-14,y+h+10,w+28,2);
  // cobwebs in the alcove corners, thicker when deeper
  if(a>.05){const m=mulberry(row*31+7);drawWeb({k:'corner',x:x+10,y:0,dir:1,s:40+a*90,seed:(m()*999)|0},y+10,a);drawWeb({k:'corner',x:x+w-10,y:0,dir:-1,s:40+a*90,seed:(m()*999)|0},y+10,a);}
  // wall lanterns
  for(const [lx2,ph] of [[x+36,1.3],[x+w-36,4.1]]){const ly2=y+Math.min(120,h*.28),fk=.75+.25*Math.sin(now/95+ph)+.08*Math.sin(now/37+ph);
   ctx.strokeStyle='#3a2a1a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(lx2,ly2-30);ctx.lineTo(lx2,ly2-12);ctx.stroke();
   ctx.fillStyle='#4a3524';ctx.fillRect(lx2-9,ly2-12,18,4);ctx.fillRect(lx2-9,ly2+14,18,4);
   ctx.fillStyle=`rgba(255,${190+30*fk|0},110,${.55+.35*fk})`;ctx.fillRect(lx2-7,ly2-8,14,22);ctx.fillStyle='#2a1c10';ctx.fillRect(lx2-1,ly2-8,2,22);
   ctx.globalCompositeOperation='lighter';const lg2=ctx.createRadialGradient(lx2,ly2,0,lx2,ly2,150);lg2.addColorStop(0,`rgba(255,180,90,${(.34-.18*a)*fk})`);lg2.addColorStop(1,'rgba(255,180,90,0)');ctx.fillStyle=lg2;ctx.fillRect(lx2-150,ly2-150,300,300);ctx.globalCompositeOperation='source-over';}
  // numeral plaque on the arch
  if(nv.label){ctx.font='600 13px Newsreader,Georgia,serif';const tw=ctx.measureText(nv.label).width+26,px=x+w/2-tw/2,py=y-12;const pg=ctx.createLinearGradient(0,py,0,py+24);pg.addColorStop(0,'#7a5a36');pg.addColorStop(1,'#3d2916');ctx.fillStyle=pg;ctx.fillRect(px,py,tw,24);ctx.strokeStyle='#b08a56';ctx.lineWidth=1;ctx.strokeRect(px+.5,py+.5,tw-1,23);ctx.fillStyle='#f3e3bd';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(nv.label,x+w/2,py+12.5);}
  // books collected so far stand on the ledge
  if(nv.books&&nv.books.length){let bx=x+w-26;for(let i=nv.books.length-1;i>=0;i--){const b=nv.books[i],dm=bookDims({w:b.w,tier:b.tier},RH),sw=dm.w*.62;ctx.save();ctx.translate(bx-sw/2,y+h);ctx.scale(.62,.62);bookArt(ctx,{w:dm.w,h:dm.h,tier:b.tier,seed:hashStr(b.w)&0xffff,word:b.w,ribbon:b.tier>=1?RIBBONS[b.tier%5]:null},now/1000);ctx.restore();bx-=sw+3;}}
  ctx.restore();}
 const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
 const shade=(hx,f)=>{const n=parseInt(hx.slice(1),16);return `rgb(${(n>>16)*f|0},${(n>>8&255)*f|0},${(n&255)*f|0})`;};
 let shelfVisible=0;
 function frame(now){
  const rdt=Math.min(.05,(now-last)/1000);last=now;Feel.tick(rdt);const dt=rdt*Feel.ts;vt+=dt*(st&&st.skip?6:1);cv.style.transform=Feel.ox||Feel.oy?`translate(${Feel.ox}px,${Feel.oy}px)`:'';{const cl=document.getElementById('cardlayer');if(cl)cl.style.transform=cv.style.transform;}
  let camNow=cam,settle=0,pull=0;
  if(st){
   if(st.phase==='down'){const u=Math.min(1,st.t/st.dur);st.t+=dt*(st.skip?6:1);camNow=st.cam0+(st.cam1-st.cam0)*ease(u);st.prog=u;if(u>=1){st.phase='settle';st.pt=0;Sfx.thud();}}
   if(st.phase==='settle'){st.pt+=dt*(st.skip?6:1);camNow=st.cam1;st.prog=1;settle=Math.min(1,st.pt/.3);if(settle>=1){st.phase='pull';st.pt=0;Sfx.flip();}}
   if(st.phase==='pull'||st.phase==='hold'){camNow=st.cam1;settle=1;if(st.phase==='pull')st.pt+=dt*(st.skip?6:1);pull=Math.min(1,st.pt/.45);if(st.phase==='pull'&&pull>=1){st.phase='hold';const r=st.res;st.res=null;r&&r();}}
   cam=camNow;
  }else if(rest){const u=Math.min(1,(now-rest.t0)/rest.ms),e=ease(u);cam=rest.c0+(rest.c1-rest.c0)*e;if(u>=1){const f=rest.done;rest=null;f&&f();}camNow=cam;}
  else{camNow=cam+(RM?0:Math.sin(vt*.5)*1.5);}
  const rowB=(camNow+H-RH-BM)/RH,a=abn(rowB);
  if(onDepth)onDepth(Math.max(0,Math.round(rowB*FT)));Sfx.setDepth(Math.max(0,rowB*FT));
  ctx.globalAlpha=1;ctx.fillStyle='#0a0706';ctx.fillRect(0,0,W,H);
  // wall above shelf 0
  const top=Math.floor(camNow/RH)-1,bot=Math.ceil((camNow+H)/RH)+1;
  // far silhouette layer
  for(let r=top;r<=bot;r++){const fr=Math.floor(r*.9);}
  let tgt=null;
  for(let r=top;r<=bot;r++){const o=drawRow(r,0,camNow,1,1);if(st&&r===st.row)tgt=o;}
  for(const [nr,nv] of niches)drawNiche(nr,nv,camNow,now);
  // pulled-out target
  if(st&&tgt){const T=TIERS[st.tier],e=pull*pull*(3-2*pull),bw=36,bh=RH*.82;const bx=W/2,by0=tgt.base;const cy=H*.5;const px=bx,py=by0+(cy+bh*.5*2.2-by0)*e;const s=1+1.3*e;
   if(settle>0){ctx.save();ctx.globalCompositeOperation='lighter';const gg=ctx.createRadialGradient(bx,by0-bh/2,0,bx,by0-bh/2,bh*1.4);gg.addColorStop(0,T.spine+'bb');gg.addColorStop(1,T.spine+'00');ctx.globalAlpha=(.28+.35*T.id/6)*settle*(.85+.15*Math.sin(vt*5))*(1-e*.4);ctx.fillStyle=gg;ctx.fillRect(bx-bh*1.5,by0-bh*1.5,bh*3,bh*3);ctx.restore();}
   ctx.save();ctx.translate(px,py);ctx.scale(s,s);bookArt(ctx,{w:bw,h:bh,tier:st.tier,seed:st.seed,word:st.word,ribbon:st.tier>=1?RIBBONS[st.tier%5]:null},vt);ctx.restore();}
  // darkness / lamp (shrinks with abandonment)
  const lx=W/2,ly=H*.5,lr=Math.hypot(W,H)*(.6-.2*a);
  const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,lr);lg.addColorStop(0,'rgba(0,0,0,0)');lg.addColorStop(.3,`rgba(6,4,2,${.2+.25*a})`);lg.addColorStop(1,`rgba(3,2,2,${.93+.06*a})`);ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);
  if(a>0){ctx.fillStyle=`rgba(14,34,30,${.1*a})`;ctx.fillRect(0,0,W,H);}
  ctx.globalCompositeOperation='lighter';
  if(!RM){flickT-=dt;if(flickT<=0){flickT=.06+Math.random()*.3;flickV=(Math.random()-.5)*(Math.random()<.12?2.2:1);}flick+=(flickV-flick)*Math.min(1,dt*9);}
  const fl=(.1-.03*a)+.02*Math.sin(vt*13)+.012*Math.sin(vt*31)+.03*flick;
  let g=ctx.createRadialGradient(lx,ly,0,lx,ly,Math.max(W,H)*.45);g.addColorStop(0,`rgba(255,196,120,${fl})`);g.addColorStop(1,'rgba(255,196,120,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
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
   ctx.globalAlpha=.55*near*(1-.5*a);ctx.fillStyle='#f3e6c4';
   ctx.beginPath();ctx.ellipse(x-s*(.6+flap*.9),y,s*(.4+flap),s*.7,-.4,0,6.3);ctx.ellipse(x+s*(.6+flap*.9),y,s*(.4+flap),s*.7,.4,0,6.3);ctx.fill();
   ctx.globalAlpha=.8*near;ctx.fillStyle='#a79570';ctx.fillRect(x-.6,y-s*.7,1.2,s*1.4);}
  ctx.globalAlpha=1;}
 let rest=null,flick=0,flickV=0,flickT=0;
 for(let i=0;i<100;i++)dust.push({x:Math.random()*5000,y:Math.random()*3000,z:Math.random(),r:.8+Math.random()*1.6,ph:Math.random()*6});
 addEventListener('resize',resize);resize();requestAnimationFrame(frame);
 cv.addEventListener('pointerdown',e=>{if(st)st.skip=true;});
 return{
  setShelf(b){shelf=b;},hits:()=>hits,get shelfVisible(){return shelfVisible;},get restRow(){return restRow;},get busy(){return !!st||!!rest;},
  reset(){rows.clear();taken.clear();niches.clear();restRow=0;st=null;rest=null;cam=restCam(0);},
  openNiche(r,o={}){const e=niches.get(r);if(e){e.label=o.label||e.label;e.books=o.books||e.books;}else niches.set(r,{t0:performance.now(),label:o.label||'',books:o.books||[]});},
  onDepth(f){onDepth=f;},onGauge(f){gaugeCb=f;},
  descend({rows:n,tier,score,word}){return new Promise(res=>{
   const a=restRow,b=a+n;st={a,row:b,tier,score,word,seed:hashStr(word)&0xffff,cam0:restCam(a),cam1:restCam(b),dur:RM?.5:1.5+n*.075,t:0,phase:'down',pt:0,skip:false,prog:0,res};cam=st.cam0;Sfx.whoosh(st.dur*.9);});},
  skipDown(){if(st)st.skip=true;},
  nextRows(){const n=nicheBox();return Math.ceil((H-BM-n.t)/RH);},
  glide(row,ms){return new Promise(res=>{const c0=cam,c1=restCam(row);rest={t0:performance.now(),ms:RM?200:ms,c0,c1,done:()=>{restRow=row;res();}};});},
  release(){if(!st)return;taken.add(st.row);rows.delete(st.row*2);restRow=st.row;cam=restCam(restRow);st=null;},
  ascend(){return new Promise(res=>{const c0=cam,c1=restCam(0),dist=Math.abs(c0-c1)/RH;rest={t0:performance.now(),ms:RM?200:clamp(dist*60,700,2400),c0,c1,done:()=>{restRow=0;res();}};});},
  get stActive(){return !!st;},get descending(){return !!st&&st.phase!=='hold';}
 };})();

/* ---------- helpers ---------- */
const tip=$('#tip');
function showTip(t,x,y){tip.textContent=t;tip.style.opacity=1;tip.style.left=clamp(x+14,6,innerWidth-200)+'px';tip.style.top=(y-34)+'px';}
const hideTip=()=>tip.style.opacity=0;
const ui={home:$('#home'),stage:$('#stage'),final:$('#final'),cap:$('#shelfcap'),hud:$('#depthHud'),gauge:$('#gauge'),skip:$('#skiph')};
function type(el,text,speed=14){return new Promise(res=>{if(RM||!speed){el.textContent=text;return res();}let i=0;const id=setInterval(()=>{i++;el.textContent=text.slice(0,i);if(i%3===0)Sfx.key();if(i>=text.length){clearInterval(id);res();}},speed);});}
function countUp(el,to,ms,from=0){if(RM){el.textContent=to;return;}const t0=performance.now();(function f(n){const u=Math.min(1,(n-t0)/ms),e=1-Math.pow(1-u,3);el.textContent=Math.round(from+(to-from)*e);if(u<1)requestAnimationFrame(f);})(t0);}
World.onDepth(v=>{const e=$('#dnum');if(e.textContent!==String(v))e.textContent=v;});
ui.gauge.innerHTML=TIERS.map(t=>`<div data-t="${t.id}" style="color:${t.spine}"><span>${t.name}</span><i></i></div>`).join('');
World.onGauge((zi,st)=>{$$('div',ui.gauge).forEach(d=>{const id=+d.dataset.t;d.classList.toggle('on',id===zi);d.classList.toggle('passed',id<zi);d.style.display=id<=st.tier?'':'none';});});


/* ---------- particles ---------- */
const FX=(()=>{const cv=$('#fx'),c=cv.getContext('2d');let W=0,H=0,DPR=1,ps=[],on=false,last=0;
 const rs=()=>{DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;c.setTransform(DPR,0,0,DPR,0,0);};rs();addEventListener('resize',rs);
 const R=(a,b)=>a+Math.random()*(b-a);
 const add=p=>{if(RM)return;ps.push(p);if(ps.length>1000)ps.shift();if(!on){on=true;last=performance.now();requestAnimationFrame(loop);}};
 function loop(now){const dt=Math.min(.05,(now-last)/1000)*Feel.ts;last=now;c.clearRect(0,0,W,H);
  for(let i=ps.length-1;i>=0;i--){const p=ps[i];p.t+=dt;if(p.t>=p.max){ps.splice(i,1);continue;}const u=p.t/p.max;
   if(p.k==='ring'){c.globalCompositeOperation='lighter';c.strokeStyle=p.c;c.globalAlpha=(1-u)*.38;c.lineWidth=2.4*(1-u)+.8;c.beginPath();c.arc(p.x,p.y,30+u*p.r,0,6.3);c.stroke();continue;}
   p.vy+=p.g*dt;p.vx*=1-.8*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const al=Math.min(1,(1-u)*1.6);
   if(p.k==='fleck'){c.globalCompositeOperation='source-over';c.globalAlpha=al*.9;c.save();c.translate(p.x,p.y);c.rotate(p.t*p.rot);c.fillStyle=p.c;c.fillRect(-p.s,-p.s*.6,p.s*2,p.s*1.2);c.restore();}
   else if(p.k==='star'){c.globalCompositeOperation='lighter';c.globalAlpha=al;c.fillStyle=p.c;const s=p.s*(1-u*.5);c.beginPath();c.moveTo(p.x,p.y-s*3);c.quadraticCurveTo(p.x,p.y,p.x+s*3,p.y);c.quadraticCurveTo(p.x,p.y,p.x,p.y+s*3);c.quadraticCurveTo(p.x,p.y,p.x-s*3,p.y);c.quadraticCurveTo(p.x,p.y,p.x,p.y-s*3);c.fill();}
   else{c.globalCompositeOperation='lighter';c.globalAlpha=al;c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,Math.max(.3,p.s*(1-u*.4)),0,6.3);c.fill();}}
  c.globalAlpha=1;c.globalCompositeOperation='source-over';
  if(ps.length)requestAnimationFrame(loop);else{on=false;c.clearRect(0,0,W,H);}}
 return{
  burst(x,y,tier,n){const col=TIERS[tier].spine;const mk=o=>add(Object.assign({x,y,t:0,g:0,rot:0,k:'dot'},o));
   mk({k:'ring',max:.7,c:col,r:130+tier*30,vx:0,vy:0});if(tier>=3)mk({k:'ring',max:1.05,c:col,r:230+tier*30,vx:0,vy:0});
   for(let i=0;i<n;i++){const a=R(0,6.283),sp=R(60,330)*(.55+tier*.1);mk({vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-90,g:280,max:R(.6,1.5),s:R(1.2,3),c:Math.random()<.35?'#fff4d6':col});}
   for(let i=0;i<n*.7;i++)mk({vx:R(-40,40),vy:R(-90,-20),g:-6,max:R(1.6,3.2),s:R(.8,2.2),c:col});
   for(let i=0;i<n*.35;i++){const a=R(0,6.283),sp=R(60,240);mk({k:'fleck',vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-120,g:140,max:R(1.2,2.4),s:R(2,4.5),rot:R(-9,9),c:Math.random()<.5?'#efe2c0':'#cdb98c'});}
   if(tier>=3)for(let i=0;i<4+tier*2;i++){const a=R(0,6.283),d=R(30,170);mk({k:'star',vx:Math.cos(a)*20,vy:Math.sin(a)*20-10,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,max:R(.8,1.8),s:R(1.4,3),c:tier>=6?'#bffcff':'#fff0b8'});}},
  ember(x,y){add({x,y,t:0,vx:R(-26,26),vy:R(-80,-30),g:-30,max:R(.7,1.4),s:R(.9,1.9),c:'#ffb35a',k:'dot',rot:0});},
  puff(x,y,w,h,n){for(let i=0;i<n;i++)add({x:x+Math.random()*w,y:y+Math.random()*h,t:0,vx:R(-30,30),vy:R(-140,-40),g:-20,max:R(.5,1),s:R(1,2.4),c:Math.random()<.5?'#ffd58a':'#fff1c9',k:'dot',rot:0});}
 };})();

/* ---------- home ---------- */
function showHome(){
 run=null;ui.stage.hidden=true;ui.final.hidden=true;ui.hud.hidden=true;ui.gauge.classList.remove('on');
 const d=S.daily[utc()];World.setShelf(S.shelf);
 ui.home.hidden=false;ui.home.className='center fadein';
 ui.home.innerHTML=`<div class="sheet">
  <h1 class="title">Deepstack</h1>
  <p class="tagline">Say what the word means. The closer you get, the deeper you go.</p>
  <div class="stats"><span>Daily No. <b>${dailyNo()}</b></span><span>7 words</span><span>Streak <b>${S.streak.n}</b></span><span>Best depth <b>${S.bestDepth} ft</b></span></div>
  ${d?`<div class="row"><button class="btn pri big" id="bRes">Today\u2019s result</button></div><div class="row" style="margin-top:6px"><button class="lnk" id="bPrac" style="font:italic 16px var(--serif)">Play a practice run</button></div>`
     :`<div class="row"><button class="btn pri big" id="bPlay">Descend</button></div>`}
  <div class="judgestat" id="jstat" aria-live="polite"></div></div>`;
 paintJudge(modelStatus());
 World.openNiche(0,{label:'No. '+dailyNo(),books:[]});
 $('#bPlay')&&($('#bPlay').onclick=()=>startDaily(false));
 $('#bRes')&&($('#bRes').onclick=()=>showFinal(d,true));
 $('#bPrac')&&($('#bPrac').onclick=()=>startDaily(true));
 ui.cap.hidden=false;
 ui.cap.innerHTML=`<span>Your shelf</span><b>${S.shelf.length} ${S.shelf.length===1?'book':'books'}</b>${S.shelf.length?'<button class="lnk" id="bAll">View all</button>':'<span style="text-transform:none;letter-spacing:0;font:italic 15px var(--serif);color:#c8ccd1">empty — your first book is one answer away</span>'}`;
 $('#bAll')&&($('#bAll').onclick=openAll);
}
$('#mark').onclick=()=>{if(World.busy&&World.stActive)return;if(run)return leaveRun();showHome();};
async function leaveRun(){run=null;ui.stage.hidden=true;ui.final.hidden=true;ui.hud.hidden=true;await World.ascend();showHome();}
/* shelf hover/click on canvas */
const cvEl=$('#world');
cvEl.addEventListener('pointermove',e=>{if(ui.home.hidden&&ui.final.hidden||World.stActive||World.restRow!==0){hideTip();cvEl.style.cursor='';return;}
 const h=World.hits().find(h=>e.clientX>=h.x&&e.clientX<=h.x+h.w&&e.clientY>=h.y&&e.clientY<=h.y+h.h);
 if(h){showTip(`${h.b.w} · ${TIERS[h.b.tier].name} · ${h.b.score}`,e.clientX,e.clientY);cvEl.style.cursor='pointer';}else{hideTip();cvEl.style.cursor='';}});
cvEl.addEventListener('click',e=>{if(World.stActive||World.restRow!==0||!(ui.stage.hidden))return;const h=World.hits().find(h=>e.clientX>=h.x&&e.clientX<=h.x+h.w&&e.clientY>=h.y&&e.clientY<=h.y+h.h);if(h){hideTip();openCard(h.b,{fresh:false});}});

/* ---------- judge status (model download) ---------- */
function paintJudge(st){const el=$('#jstat');if(!el)return;
 el.textContent=st.state==='loading'?`Preparing the judge${st.total?`, ${Math.round(st.progress*100)}%`:'\u2026'}`:st.state==='error'?'Quick judge in use (the full judge could not load)':'';}
onModelStatus(paintJudge);

/* ---------- daily run ---------- */
let run=null,timerId=0;
async function startDaily(practice){
 await wordsReady;
 if(modelStatus().state==='loading')await whenReady(8000);
 const words=dailyWords(utc(),7);
 prepareWords(words).catch(()=>{});
 World.reset();World.setShelf(S.shelf);
 run={practice,i:0,words,results:[],hints:2,busy:false,depthRows:0};
 ui.home.hidden=true;ui.cap.hidden=true;ui.final.hidden=true;ui.hud.hidden=false;$('#dnum').textContent='0';
 showWord();
}
function pipsHTML(){return `<div class="pips" aria-label="word ${run.i+1} of 7">${run.words.map((_,i)=>{const r=run.results[i];const T=r?TIERS[r.tier]:null;return `<i class="pip ${i===run.i?'now':''} ${r?'done':''}" style="${T?`background:${T.spine};box-shadow:0 0 8px ${T.spine}99`:''}"></i>`;}).join('')}</div>`;}
function showWord(){
 if(!run)return;const w=run.words[run.i];run.busy=false;run.t0=performance.now();run.limit=45000;
 const el=ui.stage;el.hidden=false;el.className='center fadein';
 el.innerHTML=`<div class="candle" id="candle" aria-hidden="true"><div class="wax" id="wax"><i class="flame"></i><i class="wick"></i></div><div class="plate"></div></div><div class="sheet">${pipsHTML()}
  <div class="wlabel">Word ${run.i+1} of ${run.words.length}</div>
  <div class="word" aria-label="${esc(w.w)}">${[...w.w].map((c,i)=>`<span style="animation-delay:${60+i*45}ms">${esc(c)}</span>`).join('')}</div>
  <div class="pos">${esc(w.pos)}</div>
  <div class="timer" id="tbar"><i id="tfill"></i></div>
  <div class="slipwrap" id="fld"><i class="pin"></i><div class="slip"><textarea id="ans" placeholder="In your own words\u2026" maxlength="300" aria-label="Your explanation" enterkeyhint="send"></textarea></div></div>
  <div class="hintline" id="hl" aria-live="polite"></div>
  <div class="row" style="margin-top:6px"><button class="btn" id="hint">Hint (${run.hints})</button><button class="btn" id="skip">Skip</button><span class="keys"><kbd>Enter</kbd> to submit</span></div></div>`;
 World.openNiche(World.restRow,{label:['I','II','III','IV','V','VI','VII'][run.i],books:run.results});
 const ta=$('#ans');setTimeout(()=>ta.focus({preventScroll:true}),120);
 ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(false);}};
 ta.oninput=()=>{Sfx.key();const f=$('#candle .flame');if(f){const r=f.getBoundingClientRect();if(r.width){FX.ember(r.left+r.width/2,r.top+4);FX.ember(r.left+r.width/2,r.top+2);}}};
 $('#hint').onclick=useHint;$('#skip').onclick=()=>submit(true);
 clearInterval(timerId);
 timerId=setInterval(()=>{if(!run||run.busy)return;const left=Math.max(0,run.limit-(performance.now()-run.t0));const f=$('#tfill');if(!f)return;const fr=left/run.limit;f.style.transform=`scaleX(${fr})`;$('#tbar').classList.toggle('low',left<10000);$('#wax').style.height=(12+58*fr)+'px';$('#candle').classList.toggle('low',left<10000);if(left<=0)submit(!$('#ans').value.trim());},100);
}
function useHint(){if(!run||run.busy||run.hints<=0)return;run.hints--;const w=run.words[run.i];const h=esc(w.hint).replace('___',`<mark>${esc(w.w)}</mark>`);
 const hl=$('#hl');hl.innerHTML=h;requestAnimationFrame(()=>hl.classList.add('on'));$('#hint').textContent=`Hint (${run.hints})`;if(!run.hints)$('#hint').disabled=true;$('#ans').focus({preventScroll:true});}
async function submit(skipped){
 if(!run||run.busy)return;const w=run.words[run.i];let text=$('#ans').value.trim();
 if(!skipped&&!text){const f=$('#fld');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake');return;}
 run.busy=true;clearInterval(timerId);
 const j=skipped?{score:0,caught:[],missed:w.concepts.map(c=>c[0]),opposite:false,empty:true}:await judgeAnswer(text,w);
 const t=tierOf(j.score);
 const rows=skipped?2:Math.max(3,Math.round(3+.32*j.score));
 const book={wid:w.id,w:w.w,pos:w.pos,def:w.def,answer:skipped?'':text,score:j.score,tier:t,mode:'daily',t:Date.now(),no:dailyNo(),verdict:skipped?'Skipped. The word stays closed.':verdictFor(j,t,w),rows,ft:Math.round(rows*FT)};
 {const sw=$('#fld');if(sw){sw.classList.add('sending');const r=sw.getBoundingClientRect();FX.puff(r.left,r.top,r.width,r.height,40);}}
 await sleep(260);ui.stage.classList.add('out');await sleep(300);ui.stage.hidden=true;
 ui.gauge.classList.add('on');ui.skip.classList.add('on');
 const depth0=Math.round(World.restRow*FT);
 await World.descend({rows,tier:t,score:j.score,word:w.w});
 ui.gauge.classList.remove('on');ui.skip.classList.remove('on');
 FX.burst(innerWidth/2,innerHeight*.5,t,16+t*8);
 run.results.push({...book,skipped});run.depthRows+=rows;
 if(!run.practice){S.shelf.push({...book});if(S.shelf.length>300)S.shelf.shift();save();}
 const depth1=Math.round((World.restRow+rows)*FT);
 openCard(book,{fresh:true,depth0,depth1,last:run.i>=run.words.length-1,onNext:async()=>{World.release();run.i++;run.busy=true;const last=run.i>=run.words.length,nr=World.restRow+World.nextRows();World.openNiche(nr,{label:last?'FINIS':['I','II','III','IV','V','VI','VII'][run.i],books:run.results});await World.glide(nr,1200);if(last)finishRun();else showWord();}});
}
function verdictFor(j,t,w){if(j.empty)return 'Nothing written.';if(j.opposite)return 'That points the other way. The word means close to the opposite.';const T=TIERS[t];return T.lines[(w.id+j.score)%T.lines.length];}
function finishRun(){
 const r=run;const books=r.results;const avg=Math.round(books.reduce((a,b)=>a+b.score,0)/books.length);const best=Math.max(...books.map(b=>b.tier));
 const depth=Math.round(World.restRow*FT);
 const d={books,avg,best,depth,practice:r.practice};
 if(!r.practice){S.daily[utc()]=d;const y=new Date(Date.now()-864e5).toISOString().slice(0,10);S.streak.n=S.streak.last===y?S.streak.n+1:(S.streak.last===utc()?S.streak.n:1);S.streak.last=utc();S.bestDepth=Math.max(S.bestDepth,depth);save();}
 showFinal(d,false);
}
const BLK='▁▂▃▄▅▆▇';
function shareText(d){return `Deepstack No. ${dailyNo()}\nDepth ${d.depth} ft · average closeness ${d.avg}\n${d.books.map(b=>BLK[b.tier]).join('')}\n${d.books.map(b=>TIERS[b.tier].name).join(' · ')}`;}
async function showFinal(d,fromHome){
 if(fromHome){ui.home.hidden=true;ui.cap.hidden=true;World.reset();World.setShelf(S.shelf);}
 ui.hud.hidden=false;$('#dnum').textContent=d.depth;
 World.openNiche(World.restRow,{label:'FINIS',books:d.books});
 const txt=shareText(d);const el=ui.final;el.hidden=false;el.className='center fadein';
 el.innerHTML=`<div class="sheet"><div class="stats" style="margin:6px 0 0"><span>${d.practice?'Practice run':'Daily No. '+dailyNo()}</span><span>Average <b>${d.avg}</b></span><span>Rarest <b>${TIERS[d.best].name}</b></span></div><h1 class="title" style="font-size:34px;margin:0">Descent complete</h1>
  <div class="bigd"><span id="cnt">0</span><small>ft deep</small></div>
  <div class="spineimgs" id="sp">${d.books.map((b,i)=>spineImg(b,i,'final',72)).join('')}</div>
  
  <div class="slipwrap" style="margin-top:10px"><i class="pin"></i><div class="slip" style="padding-top:8px"><pre class="share pe" id="shr" style="line-height:28px;font-size:12px;padding-top:2px;padding-bottom:2px">${esc(txt)}</pre></div></div>
  <div class="row"><button class="btn pri" id="cp">Copy result</button><button class="btn" id="up">Back to the surface</button></div></div>`;
 countUp($('#cnt'),d.depth,1200);
 $$('#sp img').forEach(im=>{im.onclick=()=>openCard(d.books[+im.dataset.i],{fresh:false});});
 $('#cp').onclick=async()=>{try{await navigator.clipboard.writeText(txt);$('#cp').textContent='Copied';}catch(e){const r=document.createRange();r.selectNodeContents($('#shr'));const s=getSelection();s.removeAllRanges();s.addRange(r);$('#cp').textContent='Selected — copy it';}};
 $('#up').onclick=async()=>{ui.final.hidden=true;ui.hud.hidden=true;run=null;await World.ascend();showHome();};
}

/* ---------- result card ---------- */
let cardOpts=null;
function openCard(b,opts={}){
 cardOpts=opts;const T=TIERS[b.tier],L=$('#cardlayer');
 L.innerHTML=`<div class="book t${b.tier}" id="bk" style="--tc:${T.spine};--ti:${T.ink};--tf:${['#202122','#202122','#fff','#fff','#202122','#fff','#202122'][b.tier]}">
  <div class="halo" id="halo"></div>
  <div class="page">
   <div class="tierbar"><b>${T.name}</b><span>${T.rar}</span></div>
   <div class="inner">
   <h2>${esc(b.w)}<small>${esc(b.pos)}</small></h2>
   <div class="score"><b id="cn">${opts.fresh?0:b.score}</b><span>/ 100 closeness</span></div>
   <div class="meter"><i id="mt" style="width:${opts.fresh?0:b.score}%"></i>${TIERS.slice(1).map(t=>`<u style="left:${t.min}%"></u>`).join('')}</div>
   ${opts.fresh?`<div class="depthgain">Deeper by <b>+${b.ft} ft</b> \u00b7 now at <b>${opts.depth1} ft</b></div>`:''}
   <p class="verdict ${opts.fresh?'':'on'}" id="vd">${esc(b.verdict)}</p>
   <h3>Meaning</h3><p class="def">${esc(b.def)}</p>
   ${b.answer?`<p class="wrote">You wrote: \u201c${esc(b.answer)}\u201d</p>`:''}
   <button class="btn pri go" id="go">${opts.onNext?(opts.last?'See your descent':'Next word'):'Close'} <kbd>Enter</kbd></button>
   </div>
  </div>
  <div class="cover"><span class="ct">${T.rar}</span><div class="orn"></div><div class="cw">${esc(b.w)}</div><div class="orn"></div><span class="ct">${T.name}</span></div>
 </div>`;
 L.hidden=false;requestAnimationFrame(()=>L.classList.add('on'));
 const bk=$('#bk');
 if(opts.fresh){setTimeout(async()=>{Sfx.flip();if(b.tier>=5)Sfx.sting(b.tier);if(b.tier>=4){Feel.shake(2+b.tier*1.1,b.tier>=6?900:600);Feel.slowmo(b.tier>=6?.25:b.tier>=5?.4:.6,b.tier>=6?1700:1200);}if(b.tier>=6)flashTop();bk.classList.add('open');{const rc=bk.getBoundingClientRect();FX.burst(rc.left+rc.width/2,rc.top+rc.height*.45,b.tier,30+b.tier*24);const hh=$('#halo');if(hh)hh.classList.add('go');}await sleep(380);Sfx.chime(b.tier);$('#mt').style.width=b.score+'%';countUp($('#cn'),b.score,550);await sleep(250);$('#vd').classList.add('on');if(b.tier>=3){const rc=bk.getBoundingClientRect();FX.burst(rc.left+rc.width/2,rc.top+80,b.tier,30+b.tier*14);}$('#go').focus();},220);}
 else{bk.classList.add('open','gone');setTimeout(()=>$('#go').focus(),50);}
 $('#go').onclick=closeCard;
 L.onclick=e=>{if(e.target===L&&!opts.onNext)closeCard();};
}
function flashTop(){const f=document.createElement('div');f.style.cssText='position:fixed;inset:0;z-index:70;pointer-events:none;background:radial-gradient(circle at 50% 45%,rgba(190,252,255,.55),rgba(190,252,255,0) 60%);opacity:0;transition:opacity .25s ease-out';document.body.appendChild(f);requestAnimationFrame(()=>{f.style.opacity=1;setTimeout(()=>{f.style.transition='opacity 1.6s ease-in';f.style.opacity=0;setTimeout(()=>f.remove(),1700);},260);});}
function closeCard(){const L=$('#cardlayer');const o=cardOpts;cardOpts=null;L.classList.remove('on');setTimeout(()=>{L.hidden=true;L.innerHTML='';},250);if(o&&o.onNext)o.onNext();}
addEventListener('keydown',e=>{
 if(!$('#cardlayer').hidden&&cardOpts&&(e.key==='Enter')&&e.target.id!=='go'){e.preventDefault();closeCard();return;}
 if(e.key==='Escape'){if(!$('#all').hidden)$('#all').hidden=true;else if(!$('#cardlayer').hidden&&cardOpts&&!cardOpts.onNext)closeCard();}
 if(World.descending&&(e.key===' '||e.key==='Escape'||e.key==='Enter')){e.preventDefault();World.skipDown();}
});

/* ---------- all books overlay ---------- */
let fTier=-1;
function openAll(){
 const A=$('#all');A.hidden=false;const list=S.shelf.map((b,i)=>({b,i})).filter(x=>fTier<0||x.b.tier===fTier);
 A.innerHTML=`<div class="sheet"><h1 class="title" style="font-size:34px">Your shelf</h1><div class="meta">${S.shelf.length} books</div>
  <div class="filters"><button class="fchip" data-t="-1" aria-pressed="${fTier<0}">All</button>${TIERS.map(t=>`<button class="fchip" data-t="${t.id}" aria-pressed="${fTier===t.id}">${t.name}</button>`).join('')}</div>
  <div class="shelfgrid">${list.map(x=>`<div class="slot">${spineImg(x.b,x.i,'shelf',Math.round(RHnow()*.8))}</div>`).join('')}</div>
  <div class="row"><button class="btn" id="aclose">Close</button></div></div>`;
 $$('.fchip',A).forEach(c=>c.onclick=()=>{fTier=+c.dataset.t;openAll();});
 $$('img',A).forEach(im=>{im.onclick=()=>{openCard(S.shelf[+im.dataset.i],{fresh:false});};im.onmouseenter=e=>showTip(im.dataset.tip,e.clientX,e.clientY);im.onmousemove=e=>showTip(im.dataset.tip,e.clientX,e.clientY);im.onmouseleave=hideTip;});
 $('#aclose').onclick=()=>{A.hidden=true;};A.onclick=e=>{if(e.target===A)A.hidden=true;};
}
const RHnow=()=>clamp(innerHeight*.22,108,172);

applySound();
showHome();
startModelLoad();
window.__deepstack={S,World,startDaily,showHome,judge:judgeAnswer,get run(){return run;}};
