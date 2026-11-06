/* The attic: one long room above the top shelves of the world canvas, seen from a little above, packed with books.
   Scroll up from home and the camera climbs in; keep scrolling and you move along the room, row by row: each row of
   book piles slides toward you and off the bottom while the next one rises out of the back, the floor boards move
   with it, and the rows shrink and dim with distance (near-isometric: one gentle vanishing point, no zooming tricks).
   The room itself (roof, rafters, side bookcases full of spines, window, light shaft) is painted once into an
   offscreen canvas; only the floor seams, the rows, the lamp glow and the dust move. Every row belongs to a section
   (recent guesses, then one per month found) that begins with a standing sign. Pure layout (planRows) is exported
   for tests. Books are drawn as real boxes: spine, top cover, and a lined page-block end on the side facing the room. */

import {PALETTE} from '../theme/colors.js';
import {drawLantern,lanternPos,swayAngle} from './atticProps.js';
import {Quality} from '../ui/quality.js';
import {skyAt,drawSky} from './sky.js';
import {bookArt,RIBBONS,tierBase,LEATHER} from '../ui/bookArt.js';
import {hashStr} from '../core/daily.js';
import {atticSections} from '../core/attic.js';
import {drawSigil} from '../ui/sigil.js';
import {TIERS as TIER_DEFS} from '../core/tiers.js';

const rgb=(r,g,b,a=1)=>`rgba(${r|0},${g|0},${b|0},${a})`;
const hexRgb=h=>{const n=parseInt(String(h).slice(1,7),16);return[n>>16&255,n>>8&255,n&255];};
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
export const EAVE=.38,LEAD=.7;

/* ---- layout (pure) ---- */
export const SIZES=[4,2,5,3,5,3,4];
export const KINDS=['stack','heap','trunk','slump','crate','plank','heap','stack','slump','trunk'];
/* Rows of piles, front to back, section after section. A section's first row starts with its standing sign (on a
   phone the sign gets a row of its own). Every pile gets {x,w,kind}; every row {sec,title,count,sign,piles}.
   Rows beyond maxRows are counted in `hidden` (all of those books are on the Shelf). */
export function planRows(items,W,{maxRows=60}={}){
 const phone=W<600,pileW=phone?150:214,fit=Math.max(1,Math.floor((W-28)/pileW));
 const rows=[];let n=0,hidden=0;
 atticSections(items).forEach((s,si)=>{
  const piles=[];
  for(let k=0,o=0;k<s.items.length;o++){const c=SIZES[(o+(s.items[0].recent?0:3))%SIZES.length];piles.push({items:s.items.slice(k,k+c),ord:o});k+=c;}
  let k=0,first=true;
  for(;;){
   const cap=first?(fit>=4?fit-2:fit>=2?fit-1:0):fit,take=piles.slice(k,k+cap);k+=cap;
   if(rows.length>=maxRows){hidden+=take.reduce((m,p)=>m+p.items.length,0);}
   else{
    /* the sign and its piles stand as one group, centred under the light: a short row (a month with one pile) sits in
       the beam instead of hugging the left wall, and the sign stays right beside its first pile */
    const off=first&&cap>0?1:0,slots=take.length+(first?1:0),g0=W/2-slots*pileW/2+pileW/2;
    /* a short row on an odd section is mirrored (pile left, sign right) so neighbouring month signs never stack in one
       column and hide each other */
    const mirror=first&&off&&si%2===1&&take.length===1;
    take.forEach((p,j)=>{p.x=g0+(mirror?j:j+off)*pileW;p.w=pileW;p.kind=KINDS[(n++*3+si)%KINDS.length];});
    rows.push({sec:si,title:s.title,count:s.items.length,sign:first?{x:mirror?g0+take.length*pileW-pileW*.06:g0+(off&&take.length?pileW*.06:0),w:pileW}:null,piles:take});
   }
   first=false;if(k>=piles.length)break;
  }
 });
 return{rows,hidden,pileW,fit};
}

/* ---- the hall: geometry ---- */
export const FARS=.45,YV=.08,DMAX=6,KP=(1/FARS-1)/DMAX;
/* size of a row at depth d (0 = the front row; negative = it has slid past you), and where it stands */
export const rowScale=d=>1/(1+KP*d);
export function floorGeom(W,A){const yF=A*.985,yv=A*YV;return{yF,yv,rowY:d=>yv+(yF-yv)*rowScale(d)};}


/* ---- the hall: the static room ---- */
function beam(c,x1,y1,x2,y2,th,tone=1){
 const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L*th/2,ny=dx/L*th/2;
 c.fillStyle=rgb(58*tone,40*tone,22*tone);c.beginPath();c.moveTo(x1+nx,y1+ny);c.lineTo(x2+nx,y2+ny);c.lineTo(x2-nx,y2-ny);c.lineTo(x1-nx,y1-ny);c.closePath();c.fill();
 c.strokeStyle=rgb(110*tone,80*tone,46*tone,.55);c.lineWidth=Math.max(1,th*.08);c.beginPath();c.moveTo(x1+nx*.8,y1+ny*.8);c.lineTo(x2+nx*.8,y2+ny*.8);c.stroke();
 c.strokeStyle=rgb(8,5,3,.7);c.lineWidth=Math.max(1,th*.1);c.beginPath();c.moveTo(x1-nx*.9,y1-ny*.9);c.lineTo(x2-nx*.9,y2-ny*.9);c.stroke();
}
function web(c,x,y,sx,sy,r,a=.26){
 c.save();c.strokeStyle=rgb(228,222,206,a);c.lineWidth=.8;
 const spokes=[0,.22,.5,.78,1].map(t=>{const ang=t*Math.PI/2;return[Math.cos(ang)*sx,Math.sin(ang)*sy];});
 for(const [dx,dy] of spokes){c.beginPath();c.moveTo(x,y);c.lineTo(x+dx*r,y+dy*r);c.stroke();}
 for(let k=1;k<=4;k++){const rr=r*k/4;c.beginPath();spokes.forEach(([dx,dy],i)=>{const px=x+dx*rr,py=y+dy*rr+(k<4&&i&&i<4?rr*.1:0);if(i)c.quadraticCurveTo(x+(spokes[i-1][0]+dx)*rr*.5,y+(spokes[i-1][1]+dy)*rr*.5+rr*.12,px,py);else c.moveTo(px,py);});c.stroke();}
 c.restore();
}

/* One fixed floorboard pattern (baked once, never moves): planks run toward the vanishing point, each a different
   width and tone, with butt joints at staggered depths, a little grain and a nail at every joint. */
function floorBoards(c,W,vp,yF,R){
 const X=(x,s)=>vp.x+(x-vp.x)*s,Y=s=>vp.y+(yF-vp.y)*s;
 let x=-W*.02;
 while(x<W*1.02){
  const w=W*(.028+R()*.034),x2=x+w,tone=.8+R()*.4;
  let s=1;
  while(s>FARS){
   const len=(.16+R()*.3)*(1-FARS),s2=Math.max(FARS,s-len),t=tone*(.86+R()*.28);
   c.fillStyle=rgb(58*t,40*t,22*t);
   c.beginPath();c.moveTo(X(x,s),Y(s));c.lineTo(X(x2,s),Y(s));c.lineTo(X(x2,s2),Y(s2));c.lineTo(X(x,s2),Y(s2));c.closePath();c.fill();
   c.strokeStyle=rgb(30*t,20*t,10*t,.5);c.lineWidth=.7;
   for(let g=0;g<3;g++){const u=.15+R()*.7,gx=x+w*u;c.beginPath();c.moveTo(X(gx,s),Y(s));c.lineTo(X(gx+(R()-.5)*w*.1,s2),Y(s2));c.stroke();}
   c.strokeStyle=rgb(8,5,2,.85);c.lineWidth=1.2;c.beginPath();c.moveTo(X(x,s2),Y(s2));c.lineTo(X(x2,s2),Y(s2));c.stroke();
   if(s2>FARS){c.fillStyle=rgb(14,9,4,.8);for(const nx of[x+w*.2,x+w*.8]){c.beginPath();c.arc(X(nx,s2),Y(s2)+2*s2,Math.max(.6,1.1*s2),0,6.3);c.fill();}}
   s=s2;
  }
  c.strokeStyle=rgb(8,5,2,.85);c.lineWidth=1.4;c.beginPath();c.moveTo(X(x2,1),Y(1));c.lineTo(X(x2,FARS),Y(FARS));c.stroke();
  x=x2;
 }
}

export function buildHall(W,A,DPR=1,seed=7){
 const cv=document.createElement('canvas');cv.width=Math.ceil(W*DPR);cv.height=Math.ceil(A*DPR);
 const c=cv.getContext('2d');c.scale(DPR,DPR);
 const R=rng(seed),{yF,yv}=floorGeom(W,A),vp={x:W/2,y:yv},eaveY=A*EAVE;
 const P=(x,y,s)=>({x:vp.x+(x-vp.x)*s,y:vp.y+(y-vp.y)*s});
 const poly=(pts,fill)=>{c.fillStyle=fill;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();};
 const pent=s=>[P(0,eaveY,s),P(W/2,0,s),P(W,eaveY,s),P(W,yF,s),P(0,yF,s)];
 const near=pent(1),far=pent(FARS);
 c.fillStyle=rgb(8,5,3);c.fillRect(0,0,W,A);
 /* back (gable end) wall: vertical planks */
 poly(far,rgb(40,28,17));
 c.save();c.beginPath();far.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
 const pw=Math.max(5,W*.01);
 for(let x=far[0].x;x<far[2].x;x+=pw){c.fillStyle=rgb(20+R()*14,13+R()*9,7+R()*5,.55);c.fillRect(x,0,pw-1,A);c.fillStyle=rgb(0,0,0,.35);c.fillRect(x+pw-1,0,1,A);}
 c.restore();
 /* tunnel surfaces from the near edge to the far edge */
 const edges=[[0,1,rgb(16,11,6),'roof'],[1,2,rgb(14,10,6),'roof'],[2,3,rgb(30,21,12),'wall'],[3,4,rgb(54,37,20),'floor'],[4,0,rgb(30,21,12),'wall']];
 for(const [i,j,fill,kind] of edges){
  poly([near[i],near[j],far[j],far[i]],fill);
  if(kind==='floor'){floorBoards(c,W,vp,yF,R);continue;}
  const n=kind==='roof'?12:7;
  c.lineWidth=kind==='roof'?3:1.3;
  for(let k=0;k<=n;k++){const t=k/n,a=near[i],b=near[j],fa=far[i],fb=far[j];
   c.strokeStyle=kind==='roof'?rgb(70,48,26,.5):rgb(10,7,4,.6);
   c.beginPath();c.moveTo(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);c.lineTo(fa.x+(fb.x-fa.x)*t,fa.y+(fb.y-fa.y)*t);c.stroke();}
 }
 /* the two long walls are bookcases: shelves running back toward the vanishing point, packed with upright spines */
 const LEATH=LEATHER.map(l=>l),TC=TIER_DEFS.map(t=>hexRgb(t.spine));
 for(const side of[-1,1]){
  const xe=s=>vp.x+side*(W/2)*s,shelves=6,top=eaveY+(yF-eaveY)*.04,gap=(yF-top)/shelves;
  /* backing */
  poly([{x:xe(1),y:yF},{x:xe(1),y:top},{x:xe(FARS),y:vp.y+(top-vp.y)*FARS},{x:xe(FARS),y:vp.y+(yF-vp.y)*FARS}],rgb(22,15,9));
  for(let sh=0;sh<shelves;sh++){
   const yb=yF-sh*gap-gap*.06,bh=gap*.82;
   for(let s=1;s>FARS+.006;){
    const w=.006+R()*.011,s2=Math.max(FARS,s-w);
    if(R()<.06){s=s2;continue;}
    const hh=bh*(.7+R()*.3),tone=Math.max(.35,s*s),col=R()<.62?LEATH[(R()*LEATH.length)|0]:TC[(R()*6)|0].map(v=>v*.55);
    const y1=vp.y+(yb-vp.y)*s,y2=vp.y+(yb-vp.y)*s2,h1=hh*s,h2=hh*s2;
    c.fillStyle=rgb(col[0]*tone,col[1]*tone,col[2]*tone);
    c.beginPath();c.moveTo(xe(s),y1);c.lineTo(xe(s),y1-h1);c.lineTo(xe(s2),y2-h2);c.lineTo(xe(s2),y2);c.closePath();c.fill();
    if(R()<.4){c.fillStyle=rgb(214,176,98,.45*tone);c.fillRect(Math.min(xe(s),xe(s2)),y1-h1*.8,Math.abs(xe(s2)-xe(s))+.5,1);}
    c.strokeStyle=rgb(0,0,0,.45);c.lineWidth=.6;c.beginPath();c.moveTo(xe(s),y1);c.lineTo(xe(s),y1-h1);c.stroke();
    s=s2;
   }
   c.strokeStyle=rgb(70,48,26);c.lineWidth=Math.max(1.5,gap*.06);
   c.beginPath();c.moveTo(xe(1),yb+gap*.04);c.lineTo(xe(FARS),vp.y+(yb+gap*.04-vp.y)*FARS);c.stroke();
  }
 }
 /* depth: the far end dims */
 const dg=c.createRadialGradient(vp.x,vp.y+A*.25,A*.05,vp.x,vp.y+A*.25,Math.max(W,A)*.8);dg.addColorStop(0,rgb(0,0,0,0));dg.addColorStop(1,rgb(0,0,0,.5));c.fillStyle=dg;c.fillRect(0,0,W,A);
 /* round window on the back wall and the shaft of light it throws down the room */
 const wc=P(W/2,A*.08,FARS),wr=Math.max(13,Math.min(W*.034,A*.05));
 const shaft=c.createLinearGradient(0,wc.y,0,yF);shaft.addColorStop(0,rgb(255,243,201,.2));shaft.addColorStop(.7,rgb(255,243,201,.15));shaft.addColorStop(1,rgb(255,243,201,.1));
 c.fillStyle=shaft;c.beginPath();c.moveTo(wc.x-wr*.8,wc.y);c.lineTo(wc.x+wr*.8,wc.y);c.lineTo(wc.x+wr*3.4+W*.07,yF);c.lineTo(wc.x-wr*3.4-W*.07,yF);c.closePath();c.fill();
 /* where the beam lands: a warm pool on the near boards, where the first rows of piles stand */
 {const py=yF*.9,prx=Math.max(W*.24,170),pry=A*.13;c.save();c.translate(wc.x,py);c.scale(1,pry/prx);
  const pg=c.createRadialGradient(0,0,0,0,0,prx);pg.addColorStop(0,rgb(255,236,180,.26));pg.addColorStop(.55,rgb(255,226,160,.12));pg.addColorStop(1,rgb(255,220,150,0));
  c.fillStyle=pg;c.beginPath();c.arc(0,0,prx,0,6.3);c.fill();c.restore();}
 const wgl=c.createRadialGradient(wc.x,wc.y,0,wc.x,wc.y,wr*3);wgl.addColorStop(0,rgb(255,243,201,.5));wgl.addColorStop(1,rgb(255,243,201,0));c.fillStyle=wgl;c.fillRect(wc.x-wr*3,wc.y-wr*3,wr*6,wr*6);
 c.fillStyle=rgb(255,244,214);c.beginPath();c.arc(wc.x,wc.y,wr,0,6.3);c.fill();
 c.strokeStyle=rgb(58,40,22);c.lineWidth=Math.max(2.5,wr*.18);c.beginPath();c.arc(wc.x,wc.y,wr,0,6.3);c.stroke();
 c.lineWidth=Math.max(1.5,wr*.12);c.beginPath();c.moveTo(wc.x-wr,wc.y);c.lineTo(wc.x+wr,wc.y);c.moveTo(wc.x,wc.y-wr);c.lineTo(wc.x,wc.y+wr);c.stroke();
 /* trusses, far to near */
 for(const {sc,tone} of[{sc:.62,tone:.62},{sc:.8,tone:.8},{sc:1,tone:1}]){
  const th=Math.max(5,W*.012)*sc,pt=(x,y)=>P(x,y,sc);
  const L=pt(0,eaveY),Ap=pt(W/2,0),Rr=pt(W,eaveY),collarY=eaveY*.55,cx0=W/2*(1-.55),cl=pt(cx0,collarY),cr=pt(W-cx0,collarY),tieY=eaveY*1.02;
  beam(c,L.x,L.y,Ap.x,Ap.y,th*1.15,tone);beam(c,Rr.x,Rr.y,Ap.x,Ap.y,th*1.15,tone);
  beam(c,cl.x,cl.y,cr.x,cr.y,th*.85,tone);
  const kb=pt(W/2,collarY);beam(c,Ap.x,Ap.y+th,kb.x,kb.y,th*.8,tone);
  const tl=pt(0,tieY),tr=pt(W,tieY);beam(c,tl.x,tl.y,tr.x,tr.y,th*.9,tone);
  const wr2=Math.max(24,W*.045)*sc;
  web(c,L.x,L.y+th,1,1,wr2*1.6);web(c,Rr.x,Rr.y+th,-1,1,wr2*1.6);
  web(c,cl.x+th,cl.y+th*.5,1,1,wr2);web(c,cr.x-th,cr.y+th*.5,-1,1,wr2);
  web(c,Ap.x-th,Ap.y+th*2,1,1,wr2*.9,.2);web(c,Ap.x+th,Ap.y+th*2,-1,1,wr2*.9,.2);
  c.strokeStyle=rgb(228,222,206,.2);c.lineWidth=.8;
  for(let k=0;k<7;k++){const x=cl.x+R()*(cr.x-cl.x),y=cl.y+th*.4,len=12+R()*40*sc,sw=(R()-.5)*8;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+sw,y+len*.5,x+sw*.4,y+len);c.stroke();}
 }
 /* the sign on the back wall */
 const sg=P(W/2,A*.62,FARS),sw=Math.max(110,W*.12),sh=Math.max(24,sw*.19);
 c.fillStyle=rgb(70,48,26);c.fillRect(sg.x-sw/2,sg.y-sh/2,sw,sh);c.strokeStyle=rgb(120,88,50,.8);c.lineWidth=1.4;c.strokeRect(sg.x-sw/2+1,sg.y-sh/2+1,sw-2,sh-2);
 c.fillStyle=rgb(216,192,140);c.font=`600 ${Math.round(sh*.5)}px Cinzel,Georgia,serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('THE ATTIC',sg.x,sg.y+1);
 return{cv,win:{x:wc.x,y:wc.y,r:wr},dpr:DPR};
}

/* ---- ageing ---- */
/* 0 (fresh) .. 1 (ancient). Real age counts (a fortnight to full age) but so does rank in the heap, so even a
   brand-new save shows a spread: the oldest finds are the dustiest. */
export function bookAge(b,rank,n,now=Date.now()){
 const byTime=b&&b.t?Math.min(1,Math.max(0,(now-b.t)/(14*864e5))):0,byRank=n>1?.85*rank/(n-1):0;
 return Math.max(byTime,byRank);
}
const DUST=hexRgb(PALETTE.parchmentDim),WEB=hexRgb(PALETTE.parchment);
/* Dust, webs and faded gilding over a lying book (called inside its translate/rotate). The title is painted after,
   so a long word stays readable whatever the age. */
function ageBook(c,w,h,age,seed){
 if(age<.02)return;const R=rng(seed^0x9e3779b9);
 c.save();c.beginPath();c.rect(-w/2,-h,w,h);c.clip();
 c.fillStyle=rgb(...DUST,.02+.07*age);c.fillRect(-w/2,-h,w,h); // dull the cloth, lightly so the lettering stays readable
 const tg=c.createLinearGradient(0,-h,0,-h*.35);tg.addColorStop(0,rgb(...DUST,.42*age));tg.addColorStop(1,rgb(...DUST,0));
 c.fillStyle=tg;c.fillRect(-w/2,-h,w,h*.3); // dust settles on top
 for(let k=0,n=Math.round(w*age*.5);k<n;k++){c.fillStyle=rgb(...DUST,.18+.3*R());c.fillRect(-w/2+R()*w,-h+R()*h*.8,1+R()*1.5,1);}
 if(age>.45){ // cobweb draped from the left end, strands hanging from the top
  const a=Math.min(1,(age-.45)/.4)*.4,len=Math.min(w*.3,h*2.2);c.strokeStyle=rgb(...WEB,a);c.lineWidth=.7;
  for(let k=0;k<4;k++){const ang=k*.4+.1;c.beginPath();c.moveTo(-w/2,-h);c.lineTo(-w/2+Math.cos(ang)*len,-h+Math.sin(ang)*len*.9);c.stroke();}
  for(let k=1;k<=3;k++){const r=len*k/3;c.beginPath();c.moveTo(-w/2+r,-h);c.quadraticCurveTo(-w/2+r*.62,-h+r*.5,-w/2,-h+r*.9);c.stroke();}
  if(age>.7){c.beginPath();c.moveTo(w*.12,-h);c.quadraticCurveTo(w*.14+3,-h*.4,w*.1,-h*.12);c.moveTo(w*.3,-h);c.quadraticCurveTo(w*.28-3,-h*.5,w*.31,-h*.2);c.stroke();}
 }
 c.restore();
}


/* ---- books ---- */
const sprites=new Map();
if(typeof document!=='undefined'&&document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>sprites.clear()).catch(()=>{});
export const seedOfBook=b=>hashStr(String(b.w)+(b.t||''))&0xffff;
/* The Shelf's own spine (bookArt: tier material, headbands, gilt, runed leather, seal, sigil, lettering), painted once
   at its natural size and turned on its side. Rows only scale it when drawing, so scrolling never rebuilds a bitmap. */
function spineSprite(b,len,th,dpr){
 const key=[b.w,b.tier,Math.round(len),Math.round(th),dpr,b.t||''].join('|');
 let cv=sprites.get(key);if(cv)return cv;
 if(sprites.size>500)sprites.clear();
 const seed=seedOfBook(b);
 cv=document.createElement('canvas');cv.width=Math.ceil(th*dpr);cv.height=Math.ceil(len*dpr);
 const c=cv.getContext('2d');c.scale(dpr,dpr);c.translate(th/2,len);
 bookArt(c,{w:th,h:len,tier:b.tier,seed,word:b.w,ribbon:b.tier>=1||seed%3===0?RIBBONS[seed%RIBBONS.length]:null},0);
 sprites.set(key,cv);return cv;
}
const PAGE=[236,226,196];
/* A book as a box seen from a little above and toward the room's centre: the spine faces you; the top cover shows as
   a gilt-framed face with the word's sigil (only the top book of a pile shows it); and the end facing the centre is a
   real page block: a cover board above and below, and between them the pages as fine lines running back. `lean` (+1
   for a pile left of centre, -1 for right) picks that end, so the box is never one-sided. dim (0..1) is distance fog. */
function lyingBook(c,x,y,w,h,b,rot,age=0,seed=1,dpr=1,n=1,isTop=true,lean=1,dim=0){
 c.save();c.translate(x,y);c.rotate(rot);
 const d=Math.min(h*.5,15),sk=d*.7*lean,col=tierBase(b.tier),e=lean*w/2,bt=Math.max(1.6,h*.1);
 const quad=(x0,y0,x1,y1)=>{c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y0);c.lineTo(x1+sk,y0-d);c.lineTo(x0+sk,y0-d);c.closePath();}; // horizontal slab edge
 const endQuad=(ya,yb)=>{c.beginPath();c.moveTo(e,ya);c.lineTo(e,yb);c.lineTo(e+sk,yb-d);c.lineTo(e+sk,ya-d);c.closePath();};
 const fog=()=>{if(dim>.01){c.fillStyle=rgb(4,3,2,dim);c.fill();}};
 /* top cover */
 if(isTop){
  const g=c.createLinearGradient(0,-h-d,0,-h);g.addColorStop(0,rgb(col[0]*.72,col[1]*.72,col[2]*.72));g.addColorStop(1,rgb(col[0]*1.05,col[1]*1.05,col[2]*1.05));
  quad(-w/2,-h,w/2,-h);c.fillStyle=g;c.fill();c.strokeStyle=rgb(0,0,0,.5);c.lineWidth=.8;c.stroke();fog();
  const fx=d*.3,gilt=b.tier>=3?rgb(214,176,98,.8):rgb(255,236,200,.22);
  c.strokeStyle=gilt;c.lineWidth=.8;c.beginPath();c.moveTo(-w/2+fx+sk*.25,-h-d*.28);c.lineTo(w/2-fx+sk*.25,-h-d*.28);c.lineTo(w/2-fx+sk*.75,-h-d*.72);c.lineTo(-w/2+fx+sk*.75,-h-d*.72);c.closePath();c.stroke();
  if(Quality.tier()!=='low'){c.save();c.translate(sk*.5,-h-d*.5);c.transform(1,0,0,.42,0,0);drawSigil(c,b.w,b.tier,0,0,Math.min(w*.1,d*1.3),.8);c.restore();}
 }
 /* end face: cover boards and the page block between them */
 endQuad(0,-bt);c.fillStyle=rgb(col[0]*.55,col[1]*.55,col[2]*.55);c.fill();fog();
 endQuad(-bt,-h+bt);c.fillStyle=rgb(...PAGE);c.fill();
 const lines=Math.max(3,Math.round(h/3.4));
 c.strokeStyle=rgb(150,132,96,.75);c.lineWidth=.6;c.beginPath();
 for(let k=1;k<=lines;k++){const yy=-bt-(h-2*bt)*k/(lines+1);c.moveTo(e,yy);c.lineTo(e+sk,yy-d);}
 c.stroke();
 const sh=c.createLinearGradient(e,0,e+sk,0);sh.addColorStop(0,rgb(0,0,0,.28));sh.addColorStop(1,rgb(0,0,0,0)); // the cover's shadow on the first pages
 endQuad(-bt,-h+bt);c.fillStyle=sh;c.fill();fog();
 endQuad(-h+bt,-h);c.fillStyle=rgb(col[0]*.85,col[1]*.85,col[2]*.85);c.fill();fog();
 c.strokeStyle=rgb(0,0,0,.45);c.lineWidth=.7;endQuad(0,-h);c.stroke();
 /* the spine, turned so the lettering reads left to right */
 c.save();c.translate(0,-h/2);c.rotate(Math.PI/2);c.drawImage(spineSprite(b,w,h,dpr),-h/2,-w/2,h,w);c.restore();
 c.fillStyle=rgb(255,240,200,.12);c.fillRect(-w/2,-h,w,1.2);
 if(!isTop){const sg=c.createLinearGradient(0,-h,0,-h+7);sg.addColorStop(0,rgb(0,0,0,.4));sg.addColorStop(1,rgb(0,0,0,0));c.fillStyle=sg;c.fillRect(-w/2,-h,w,7);}
 ageBook(c,w,h,age,seed);
 if(dim>.01){c.fillStyle=rgb(4,3,2,dim);c.fillRect(-w/2,-h,w,h);}
 if(b.fav){c.font='600 13px Cinzel,Georgia,serif';c.fillStyle=rgb(246,217,138);c.textAlign='center';c.textBaseline='middle';c.fillText('★',-lean*(w/2-h*.6),-h/2+.5);}
 if(n>1){ /* the same word found again: one book stands for all, with a brass tally */
  const r=Math.max(7,h*.28),bx=-lean*(w/2-r-2),by=-h/2;
  c.fillStyle=rgb(46,32,18,.92);c.beginPath();c.arc(bx,by,r+1.5,0,6.3);c.fill();
  c.fillStyle=rgb(196,158,84);c.beginPath();c.arc(bx,by,r,0,6.3);c.fill();
  c.fillStyle=rgb(34,22,12);c.font=`600 ${Math.round(r*1.05)}px "Special Elite",Georgia,serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('×'+n,bx,by+.5);
 }
 c.restore();
}

/* What a pile sits on. Returns how far it lifts the books. 'crate-ends' paints the front end boards afterwards. */
function plinth(c,kind,x,y,bw,bh,n=3){
 const wood=(t=1)=>rgb(88*t,60*t,32*t),dark=rgb(18,12,7,.8);
 if(kind==='trunk'){
  const w=bw*1.04,h=bh*1.6;
  const g=c.createLinearGradient(0,y-h,0,y);g.addColorStop(0,wood(1.25));g.addColorStop(1,wood(.7));
  c.fillStyle=g;c.fillRect(x-w/2,y-h,w,h);
  c.fillStyle=wood(1.4);c.fillRect(x-w/2,y-h,w,Math.max(3,h*.12));
  c.fillStyle=dark;for(const sx of[-.32,.32])c.fillRect(x+sx*w-3,y-h,6,h);
  c.fillStyle=rgb(190,148,70);c.fillRect(x-4,y-h*.62,8,h*.2);for(const sx of[-.5,.5]){c.fillRect(x+sx*w-(sx<0?0:4),y-5,4,5);c.fillRect(x+sx*w-(sx<0?0:4),y-h,4,5);}
  c.strokeStyle=dark;c.lineWidth=1;c.strokeRect(x-w/2,y-h,w,h);
  return h-1;
 }
 if(kind==='plank'){
  const w=bw*1.05,bl=bh*.55,pt=bh*.3;
  c.fillStyle=wood(.8);for(const sx of[-.38,.38])c.fillRect(x+sx*w-w*.07,y-bl,w*.14,bl);
  const g=c.createLinearGradient(0,y-bl-pt,0,y-bl);g.addColorStop(0,wood(1.35));g.addColorStop(1,wood(.9));
  c.fillStyle=g;c.fillRect(x-w/2,y-bl-pt,w,pt);c.strokeStyle=dark;c.lineWidth=1;c.strokeRect(x-w/2,y-bl-pt,w,pt);
  return bl+pt-1;
 }
 if(kind==='crate'){
  const w=bw*1.02,t=bh*.28;c.fillStyle=wood(1);c.fillRect(x-w/2,y-t,w,t);c.strokeStyle=dark;c.lineWidth=1;c.strokeRect(x-w/2,y-t,w,t);
  return t-1;
 }
 if(kind==='crate-ends'){
  const w=bw*1.02,t=bh*.28,hh=Math.min(n,3)*(bh-1)+t+4;
  for(const sx of[-1,1]){const ex=x+sx*(w/2-3);
   const g=c.createLinearGradient(ex-4,0,ex+4,0);g.addColorStop(0,wood(1.2));g.addColorStop(1,wood(.7));
   c.fillStyle=g;c.fillRect(ex-4,y-hh,8,hh);c.strokeStyle=dark;c.lineWidth=1;c.strokeRect(ex-4,y-hh,8,hh);
   c.fillStyle=rgb(190,148,70);c.fillRect(ex-1.5,y-hh+4,3,3);}
  return 0;
 }
 return 0;
}


/* A standing sign at the head of a section: two posts and a plank, the title wrapped to the plank's width (never clipped,
   never shortened) and the book count under it. Drawn at the row's floor line; returns its height. */
function standSign(c,cx,w,title,count){
 const pw=w*.86,u=Math.min(1,w/200);let fs=Math.round(15*Math.max(.8,u)*10)/10;
 c.font=`600 ${fs}px Cinzel,Georgia,serif`;
 const words=String(title).toUpperCase().split(' '),lines=[];let cur='';
 for(const wd of words){const t=cur?cur+' '+wd:wd;if(cur&&c.measureText(t).width>pw-18){lines.push(cur);cur=wd;}else cur=t;}
 lines.push(cur);
 while(fs>8&&lines.some(l=>c.measureText(l).width>pw-18)){fs-=.5;c.font=`600 ${fs}px Cinzel,Georgia,serif`;}
 const lh=fs*1.3,ph=lines.length*lh+fs*1.3+14,post=Math.max(22,w*.14);
 c.fillStyle=rgb(0,0,0,.34);c.beginPath();c.ellipse(cx,2,pw*.55,5,0,0,6.3);c.fill();
 c.fillStyle=rgb(46,32,18);for(const k of[-.34,.34])c.fillRect(cx+pw*k-3,-post-ph*.2,6,post+ph*.2);
 const top=-post-ph,g=c.createLinearGradient(0,top,0,top+ph);g.addColorStop(0,rgb(96,66,36));g.addColorStop(1,rgb(60,41,22));
 c.fillStyle=g;c.fillRect(cx-pw/2,top,pw,ph);
 c.strokeStyle=rgb(150,112,60,.75);c.lineWidth=1.2;c.strokeRect(cx-pw/2+2.5,top+2.5,pw-5,ph-5);
 c.fillStyle=rgb(196,158,84);for(const k of[-.46,.46]){c.beginPath();c.arc(cx+pw*k,top+7,1.8,0,6.3);c.fill();}
 c.textAlign='center';c.textBaseline='middle';c.fillStyle=rgb(228,206,154);c.font=`600 ${fs}px Cinzel,Georgia,serif`;
 lines.forEach((l,i)=>c.fillText(l,cx,top+9+lh*(i+.5)));
 c.fillStyle=rgb(190,168,120,.9);c.font=`${Math.round(fs*.8)}px "Special Elite",Georgia,serif`;
 c.fillText(`${count} ${count===1?'book':'books'}`,cx,top+9+lines.length*lh+fs*.55);
 return post+ph;
}

/* One pile, in local coordinates (origin: the middle of its base on the floor). Returns hit rects, topmost first. */
function drawPile(ctx,p,o){
 const {phone,TIERS,rank,total,now,dpr,lean,dim}=o,hits=[];
 const bw=p.w*(phone?.84:.8),bh=phone?19:29,pr=rng(((p.items[0].i+1)*40503+p.ord*977)>>>0);
 const y0=(pr()-.5)*7;let y=y0;
 const sg=ctx.createRadialGradient(0,y0+2,0,0,y0+2,bw*.62);sg.addColorStop(0,rgb(0,0,0,.36));sg.addColorStop(1,rgb(0,0,0,0));
 ctx.save();ctx.translate(0,y0+2);ctx.scale(1,.16);ctx.translate(0,-(y0+2));ctx.fillStyle=sg;ctx.fillRect(-bw*.7,y0+2-bw*.7,bw*1.4,bw*1.4);ctx.restore();
 const kind=p.kind,n=p.items.length,inner=kind==='crate'?.9:1;
 let rise=0;
 if(kind==='trunk')rise=plinth(ctx,'trunk',0,y,bw,bh);
 else if(kind==='plank')rise=plinth(ctx,'plank',0,y,bw,bh);
 else if(kind==='crate')rise=plinth(ctx,'crate',0,y,bw,bh,n);
 y-=rise;
 const order=p.items.slice().reverse(); // oldest at the bottom, newest on top
 order.forEach((x,k)=>{
  const seed=((x.i+1)*2654435761)>>>0,R=rng(seed),top=k>=order.length-(order.length>3?2:1),isTop=k===order.length-1;
  let w=bw*inner*(.82+R()*.18),rot=(R()-.5)*.05,jx=(R()-.5)*bw*.1;
  if(kind==='heap'){rot=(R()-.5)*.2;jx=(R()-.5)*bw*.2;w=bw*(.7+R()*.28);}
  else if(kind==='slump'&&top){rot=(isTop?-1:1)*(.1+R()*.08);jx=(isTop?1:-1)*bw*(.04+R()*.06);}
  else if(kind==='crate'){jx=(R()-.5)*bw*.04;}
  const lift=Math.abs(Math.sin(rot))*w*.42,yy=y-lift,d=Math.min(bh*.5,15);
  lyingBook(ctx,jx,yy,w,bh,x.b,rot,bookAge(x.b,rank.get(x),total,now),seed,dpr,x.n||1,isTop,lean,dim);
  const ext=Math.abs(Math.sin(rot))*w/2,ww=w+d*.7+bh*.3;
  hits.unshift({x:jx-w/2-(lean<0?d*.7:0),y:yy-bh-ext-d,w:ww,h:bh+d+ext*2,b:x.b});
  y=yy-bh+1;
 });
 if(kind==='crate')plinth(ctx,'crate-ends',0,y0,bw,bh,n);
 return hits;
}

/* The attic at screen offset ry: the cached hall, then (moving) the floor seams, light, and the rows of piles back to
   front. `scroll` is in rows (0 .. rows-1, eased by the caller): row i stands at depth i-scroll. Returns hit rects. */
export function drawAttic(ctx,room,o){
 const {W,A,ry,items,TIERS,vt,RM}=o,lit=o.lit==null?1:o.lit,scroll=o.scroll||0,q=Quality.params(),phone=W<600,dpr=room.dpr||1;
 if(!room.plan||room.plan.items!==items||room.plan.W!==W)room.plan={items,W,...planRows(items,W)};
 const {rows,hidden}=room.plan,fg=floorGeom(W,A),now=Date.now(),rank=new Map(items.map((x,k)=>[x,k])),{win}=room;
 ctx.drawImage(room.cv,0,ry,W,A);
 ctx.save();ctx.globalCompositeOperation='lighter';
 if(!RM)for(let k=0;k<18;k++){const ph=k*1.7,u=((vt*.02+k*.137)%1),x=win.x+Math.sin(vt*.3+ph)*win.r*(1+u*4)+(k%2?1:-1)*u*W*.05,y=ry+win.y+u*(ry+A-(ry+win.y)),al=Math.sin(u*Math.PI)*.5*lit;
  ctx.fillStyle=rgb(255,236,190,al);ctx.beginPath();ctx.arc(x,y,1+(k%3)*.5,0,6.3);ctx.fill();}
 const sw=lanternPos(W,ry,A,EAVE,swayAngle(vt,{RM,glow:q.glow})),lx=sw.x,ly=sw.y+5,fl=RM?1:1+.06*Math.sin(vt*11)+.04*Math.sin(vt*23);
 {const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,A*.5*fl);lg.addColorStop(0,rgb(255,190,100,.2*lit));lg.addColorStop(1,rgb(255,150,60,0));ctx.fillStyle=lg;ctx.fillRect(lx-A*.55,ly-A*.55,A*1.1,A*1.1);}
 ctx.restore();
 drawSky(ctx,{win,ry,A,W,vt,lit,sky:o.sky||((!room.sky||Math.abs(Date.now()-room.skyAt)>6e4)&&(room.sky=skyAt(),room.skyAt=Date.now()),room.sky),RM,low:q.name==='low'});
 drawLantern(ctx,W,ry,A,EAVE,vt,{RM,glow:q.glow});
 let hits=[];
 const iMax=Math.min(rows.length-1,Math.ceil(scroll+DMAX+.6)),iMin=Math.max(0,Math.floor(scroll-1));
 for(let i=iMax;i>=iMin;i--){
  const d=i-scroll;if(d<-.95||d>DMAX+.6)continue;
  const z=d+LEAD,s=rowScale(z),y0=ry+fg.rowY(z),alpha=d<0?1+d/.95:d>DMAX-.4?Math.max(0,DMAX+.6-d):1,dim=Math.min(.6,Math.max(0,d)/DMAX*.6);
  const row=rows[i];
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(W/2,y0);ctx.scale(s,s);
  if(row.sign)standSign(ctx,row.sign.x-W/2,row.sign.w,row.title,row.count);
  for(const p of row.piles){
   const lean=p.x<W/2-1?1:-1;
   ctx.save();ctx.translate(p.x-W/2,0);
   const h=drawPile(ctx,p,{phone,TIERS,rank,total:items.length,now,dpr,lean,dim});
   ctx.restore();
   if(alpha>.5&&d>-.5)for(const r of h)hits.unshift({x:W/2+(p.x-W/2+r.x)*s,y:y0+r.y*s,w:r.w*s,h:r.h*s,b:r.b});
  }
  ctx.restore();
 }
 if(lit<1){ctx.fillStyle=rgb(4,3,2,(1-lit)*.78);ctx.fillRect(0,ry,W,A);}
 if(lit>0){ctx.save();ctx.globalCompositeOperation='lighter';const wb=ctx.createRadialGradient(win.x,ry+win.y,0,win.x,ry+win.y,Math.max(W,A)*.5);wb.addColorStop(0,rgb(255,240,200,.14*lit*(1-lit*.5)));wb.addColorStop(1,rgb(255,240,200,0));ctx.fillStyle=wb;ctx.fillRect(0,ry,W,A);ctx.restore();}
 if(hidden>0&&Math.round(scroll)>=rows.length-1){ctx.fillStyle=rgb(216,192,140,.85);ctx.font='italic 14px "Anthropic Serif Text",Georgia,serif';ctx.textAlign='center';ctx.fillText(`and ${hidden} more on the Shelf`,W/2,ry+A-6);}
 return hits;
}
export const rowCount=(items,W)=>planRows(items,W).rows.length;
export const rowTitle=(items,W,i)=>{const r=planRows(items,W).rows[i];return r?r.title:'';};
