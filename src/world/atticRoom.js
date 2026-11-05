/* The attic room: a real place above the top shelves of the world canvas. Scroll up from home and the camera
   climbs into a gabled roof space: sloped roof, rafters and a collar beam, side posts, a round window with a shaft
   of light and drifting dust, cobwebs in the joints, and books lying in piles on the floor boards (recent guesses
   first, then earlier finds). The static room is painted once into an offscreen canvas and re-used; only the
   books, the lamp glow and the dust move. Pure layout (layoutPiles) is exported for tests. */

import {PALETTE} from '../theme/colors.js';
import {paintProps,drawLantern,lanternPos,swayAngle} from './atticProps.js';
import {Quality} from '../ui/quality.js';
import {skyAt,drawSky} from './sky.js';
import {bookArt,RIBBONS,tierBase} from '../ui/bookArt.js';
import {hashStr} from '../core/daily.js';
import {atticSections} from '../core/attic.js';
import {drawSigil} from '../ui/sigil.js';

const rgb=(r,g,b,a=1)=>`rgba(${r|0},${g|0},${b|0},${a})`;
const hexRgb=h=>{const n=parseInt(String(h).slice(1,7),16);return[n>>16&255,n>>8&255,n&255];};
const shade=(h,f,a=1)=>{const [r,g,b]=hexRgb(h);return rgb(r*f,g*f,b*f,a);};
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
export const VP_Y=.5,FAR=.6,EAVE=.38;

/* ---- layout (pure) ---- */
/* items: [{b,i,recent?}], newest first. Returns piles with a row (0 front .. 2 back), centre x, and books top-of-pile
   first. Piles never mix recent guesses with earlier finds so each group can wear its own tag. */
/* Piles differ: heights cycle through SIZES (bumped up only when the books would not otherwise fit) and each pile
   takes a different look (KINDS) so the floor reads as a lived-in heap rather than a row of identical stacks. */
export const SIZES=[4,2,5,3,5,3,4];
export const KINDS=['stack','heap','trunk','slump','crate','plank','heap','stack','slump','trunk'];
export const ROWS=3;
/* One section's piles. Piles are laid in rows (three at most); whatever does not fit comes back in `rest`, in order, so
   the caller can carry it into the next section. Every pile gets {row,x,w}. */
export function layoutPiles(items,W,{rowsMax=ROWS}={}){
 const phone=W<600,pileW=phone?150:214,fit=Math.max(1,Math.floor((W-28)/pileW));
 const piles=[];
 for(let k=0,o=0;k<items.length;o++){const n=SIZES[(o+(items[0]&&items[0].recent?0:3))%SIZES.length];piles.push({items:items.slice(k,k+n),ord:o});k+=n;}
 const rows=[];for(let k=0;k<piles.length;k+=fit)rows.push(piles.slice(k,k+fit));
 const shownRows=rows.slice(0,rowsMax),shown=[];
 shownRows.forEach((r,ri)=>{
  const span=r.length*pileW,x0=(W-span)/2+pileW/2;
  r.forEach((p,k)=>{p.row=ri;p.x=x0+k*pileW;p.w=pileW;p.kind=KINDS[(shown.length*3+ri*2)%KINDS.length];shown.push(p);});
 });
 const rest=rows.slice(rowsMax).flatMap(r=>r.flatMap(p=>p.items));
 return{piles:shown,rest,pileW};
}
/* The sections you climb through, each laid out for width W: crowded ones continue into the next. At most `max`
   sections; books beyond that are counted in `hidden` (they are all on the Shelf). */
export function planSections(items,W,{max=8}={}){
 const out=[];let hidden=0;
 for(const s of atticSections(items)){
  let list=s.items,cont=false;
  while(list.length){
   if(out.length>=max){hidden+=list.length;break;}
   const L=layoutPiles(list,W);
   out.push({key:s.key,title:s.title,cont,count:s.items.length,L});
   list=L.rest;cont=true;
  }
 }
 return{sections:out,hidden};
}

/* ---- static room ---- */
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
function geometry(W,A){
 const vp={x:W/2,y:A*VP_Y};
 const P=(x,y,s)=>({x:vp.x+(x-vp.x)*s,y:vp.y+(y-vp.y)*s});
 return{vp,P,eaveY:A*EAVE,floorBackY:vp.y+(A-vp.y)*FAR};
}
export function buildRoom(W,A,DPR=1,seed=7,{sign=true}={}){
 const cv=document.createElement('canvas');cv.width=Math.ceil(W*DPR);cv.height=Math.ceil(A*DPR);
 const c=cv.getContext('2d');c.scale(DPR,DPR);
 const R=rng(seed),{vp,P,eaveY}=geometry(W,A);
 const poly=(pts,fill)=>{c.fillStyle=fill;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();};
 const pent=s=>[P(0,eaveY,s),P(W/2,0,s),P(W,eaveY,s),P(W,A,s),P(0,A,s)];
 c.fillStyle=rgb(8,5,3);c.fillRect(0,0,W,A);
 const near=pent(1),far=pent(FAR);
 /* back (gable end) wall: vertical planks, dark, a little lighter than the roof */
 poly(far,rgb(40,28,17));
 c.save();c.beginPath();far.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
 const pw=Math.max(9,W*.018);
 for(let x=far[0].x;x<far[2].x;x+=pw){c.fillStyle=rgb(20+R()*14,13+R()*9,7+R()*5,.55);c.fillRect(x,0,pw-1.2,A);c.fillStyle=rgb(0,0,0,.35);c.fillRect(x+pw-1.2,0,1.2,A);}
 const wg=c.createLinearGradient(0,far[1].y,0,far[3].y);wg.addColorStop(0,rgb(0,0,0,.65));wg.addColorStop(1,rgb(0,0,0,.15));c.fillStyle=wg;c.fillRect(0,0,W,A);
 c.restore();
 /* tunnel surfaces from near edge to far edge: roof slopes, side walls and floor, rafters/boards converge on the vanishing point */
 const edges=[[0,1,rgb(16,11,6),'roof'],[1,2,rgb(14,10,6),'roof'],[2,3,rgb(30,21,12),'wall'],[3,4,rgb(58,40,22),'floor'],[4,0,rgb(30,21,12),'wall']];
 for(const [i,j,fill,kind] of edges){
  poly([near[i],near[j],far[j],far[i]],fill);
  const n=kind==='floor'?Math.round(W/46):kind==='roof'?12:7;
  c.lineWidth=kind==='floor'?1.4:kind==='roof'?3.2:1.3;
  for(let k=0;k<=n;k++){const t=k/n,a=near[i],b=near[j],fa=far[i],fb=far[j];
   const ax=a.x+(b.x-a.x)*t,ay=a.y+(b.y-a.y)*t,bx=fa.x+(fb.x-fa.x)*t,by=fa.y+(fb.y-fa.y)*t;
   c.strokeStyle=kind==='roof'?rgb(70,48,26,.55):kind==='floor'?rgb(12,8,4,.8):rgb(10,7,4,.6);
   c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.stroke();}
  if(kind==='floor'){ /* board seams across the floor, spaced by perspective */
   for(let k=1;k<7;k++){const t=k*k/49,y=near[3].y+(far[3].y-near[3].y)*t,x0=near[4].x+(far[4].x-near[4].x)*t,x1=near[3].x+(far[3].x-near[3].x)*t;
    c.strokeStyle=rgb(10,6,3,.55);c.lineWidth=1;c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();}
   const fg=c.createLinearGradient(0,far[3].y,0,near[3].y);fg.addColorStop(0,rgb(0,0,0,.45));fg.addColorStop(1,rgb(0,0,0,0));c.fillStyle=fg;c.fillRect(0,far[3].y,W,near[3].y-far[3].y);}
 }
 /* depth: the far end dims */
 const dg=c.createRadialGradient(vp.x,vp.y,A*.05,vp.x,vp.y,Math.max(W,A)*.8);dg.addColorStop(0,rgb(0,0,0,0));dg.addColorStop(1,rgb(0,0,0,.55));c.fillStyle=dg;c.fillRect(0,0,W,A);
 /* round window on the back wall and the shaft of light it throws */
 const wc=P(W/2,A*.1,FAR),wr=Math.max(16,Math.min(W*.06,A*.075));
 const shaft=c.createLinearGradient(0,wc.y,0,A);shaft.addColorStop(0,rgb(255,243,201,.22));shaft.addColorStop(1,rgb(255,243,201,0));
 c.fillStyle=shaft;c.beginPath();c.moveTo(wc.x-wr*.8,wc.y);c.lineTo(wc.x+wr*.8,wc.y);c.lineTo(wc.x+wr*2.6+W*.05,A);c.lineTo(wc.x-wr*2.6-W*.05,A);c.closePath();c.fill();
 const wgl=c.createRadialGradient(wc.x,wc.y,0,wc.x,wc.y,wr*3);wgl.addColorStop(0,rgb(255,243,201,.55));wgl.addColorStop(1,rgb(255,243,201,0));c.fillStyle=wgl;c.fillRect(wc.x-wr*3,wc.y-wr*3,wr*6,wr*6);
 c.fillStyle=rgb(255,244,214);c.beginPath();c.arc(wc.x,wc.y,wr,0,6.3);c.fill();
 c.strokeStyle=rgb(58,40,22);c.lineWidth=Math.max(3,wr*.18);c.beginPath();c.arc(wc.x,wc.y,wr,0,6.3);c.stroke();
 c.lineWidth=Math.max(2,wr*.12);c.beginPath();c.moveTo(wc.x-wr,wc.y);c.lineTo(wc.x+wr,wc.y);c.moveTo(wc.x,wc.y-wr);c.lineTo(wc.x,wc.y+wr);c.stroke();
 /* trusses, far to near: each a pentagon of beams; the near one is thickest */
 const trusses=[{sc:.74,tone:.62},{sc:.86,tone:.8},{sc:1,tone:1}];
 for(const {sc,tone} of trusses){
  const th=Math.max(6,W*.014)*sc,pt=(x,y)=>P(x,y,sc);
  const L=pt(0,eaveY),Ap=pt(W/2,0),Rr=pt(W,eaveY),collarY=eaveY*.55,cx0=W/2*(1-.55),cl=pt(cx0,collarY),cr=pt(W-cx0,collarY),tieY=eaveY*1.02;
  beam(c,L.x,L.y,Ap.x,Ap.y,th*1.15,tone);beam(c,Rr.x,Rr.y,Ap.x,Ap.y,th*1.15,tone);
  beam(c,cl.x,cl.y,cr.x,cr.y,th*.85,tone);
  const kb=pt(W/2,collarY);beam(c,Ap.x,Ap.y+th,kb.x,kb.y,th*.8,tone);
  const tl=pt(0,tieY),tr=pt(W,tieY);beam(c,tl.x,tl.y,tr.x,tr.y,th*.9,tone);
  const pl=pt(W*.045,A),plt=pt(W*.045,tieY),pr=pt(W*.955,A),prt=pt(W*.955,tieY);
  beam(c,pl.x,pl.y,plt.x,plt.y,th*1.1,tone);beam(c,pr.x,pr.y,prt.x,prt.y,th*1.1,tone);
  const b1=pt(W*.22,tieY),b2=pt(W*.78,tieY),k1=pt(W*.36,collarY),k2=pt(W*.64,collarY);
  beam(c,b1.x,b1.y,k1.x,k1.y,th*.55,tone);beam(c,b2.x,b2.y,k2.x,k2.y,th*.55,tone);
  /* cobwebs gather where beams meet */
  const wr2=Math.max(26,W*.05)*sc;
  web(c,L.x,L.y+th,1,1,wr2*1.6);web(c,Rr.x,Rr.y+th,-1,1,wr2*1.6);
  web(c,cl.x+th,cl.y+th*.5,1,1,wr2);web(c,cr.x-th,cr.y+th*.5,-1,1,wr2);
  web(c,Ap.x-th,Ap.y+th*2,1,1,wr2*.9,.2);web(c,Ap.x+th,Ap.y+th*2,-1,1,wr2*.9,.2);
  web(c,tl.x+th*2,tl.y+th*.5,1,1,wr2*1.2,.2);web(c,tr.x-th*2,tr.y+th*.5,-1,1,wr2*1.2,.2);
  /* hanging strands off the collar beam and tie beam */
  c.strokeStyle=rgb(228,222,206,.2);c.lineWidth=.8;
  for(let k=0;k<7;k++){const x=cl.x+R()*(cr.x-cl.x),y=cl.y+th*.4,len=14+R()*46*sc,sw=(R()-.5)*8;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+sw,y+len*.5,x+sw*.4,y+len);c.stroke();}
 }
 /* the sign on the back wall (only the first room has one) */
 const sg=P(W/2,A*.575,FAR),sw=Math.max(130,W*.17)*.9,sh=Math.max(26,sw*.19);
 if(sign){
 c.fillStyle=rgb(70,48,26);c.fillRect(sg.x-sw/2,sg.y-sh/2,sw,sh);c.strokeStyle=rgb(120,88,50,.8);c.lineWidth=1.4;c.strokeRect(sg.x-sw/2+1,sg.y-sh/2+1,sw-2,sh-2);
 c.fillStyle=rgb(216,192,140);c.font=`600 ${Math.round(sh*.5)}px Cinzel,Georgia,serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('THE ATTIC',sg.x,sg.y+1);
 c.strokeStyle=rgb(40,28,16);c.lineWidth=1.4;c.beginPath();c.moveTo(sg.x-sw*.4,sg.y-sh/2);c.lineTo(sg.x-sw*.4,sg.y-sh/2-A*.05);c.moveTo(sg.x+sw*.4,sg.y-sh/2);c.lineTo(sg.x+sw*.4,sg.y-sh/2-A*.05);c.stroke();
 }
 /* corner webs low on the posts and in the far floor corners */
 web(c,W*.045+10,A*.6,1,-1,W*.05,.16);web(c,W*.955-10,A*.6,-1,-1,W*.05,.16);
 if(sign)paintProps(c,geometry(W,A),W,A); // the hatch, ladder and trunks belong to the first room only
 return{cv,win:{x:wc.x,y:wc.y,r:wr},geo:geometry(W,A),dpr:DPR};
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
/* A lying book is the very same spine the Shelf draws (bookArt: tier material, headbands, gilt, runed leather, seal,
   the word's sigil and lettering), turned on its side. The spine is painted once into a small bitmap and re-used every
   frame; dust and webs go on top each frame, so ageing stays live. */
const sprites=new Map();
if(typeof document!=='undefined'&&document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>sprites.clear()).catch(()=>{});
export const seedOfBook=b=>hashStr(String(b.w)+(b.t||''))&0xffff;
function spineSprite(b,len,th,dpr){
 const key=[b.w,b.tier,Math.round(len),Math.round(th),dpr,b.t||''].join('|');
 let cv=sprites.get(key);if(cv)return cv;
 if(sprites.size>160)sprites.clear();
 const seed=seedOfBook(b);
 cv=document.createElement('canvas');cv.width=Math.ceil(th*dpr);cv.height=Math.ceil(len*dpr);
 const c=cv.getContext('2d');c.scale(dpr,dpr);c.translate(th/2,len);
 bookArt(c,{w:th,h:len,tier:b.tier,seed,word:b.w,ribbon:b.tier>=1||seed%3===0?RIBBONS[seed%RIBBONS.length]:null},0);
 sprites.set(key,cv);return cv;
}
/* Seen from a little above: the spine faces you, the top cover shows as a foreshortened face with a gilt frame and the
   word's sigil (only the top book of a pile shows it; the rest are covered), the page block shows at the right end, and a
   soft shadow lies on the book below. `lean` (-1/1) tilts the top face toward the room's centre. */
function lyingBook(c,x,y,w,h,b,rot,age=0,seed=1,dpr=1,n=1,isTop=true,lean=1){
 c.save();c.translate(x,y);c.rotate(rot);
 const d=Math.min(h*.5,15),sk=d*.7*lean,col=tierBase(b.tier);
 /* top cover */
 if(isTop){
  const g=c.createLinearGradient(0,-h-d,0,-h);g.addColorStop(0,rgb(...col.map(v=>v*.75),1));g.addColorStop(1,rgb(...col.map(v=>v*1.05),1));
  c.fillStyle=g;c.beginPath();c.moveTo(-w/2,-h);c.lineTo(w/2,-h);c.lineTo(w/2+sk,-h-d);c.lineTo(-w/2+sk,-h-d);c.closePath();c.fill();
  c.strokeStyle=rgb(0,0,0,.5);c.lineWidth=.8;c.stroke();
  const fx=d*.3,gilt=b.tier>=3?rgb(214,176,98,.8):rgb(255,236,200,.22);
  c.strokeStyle=gilt;c.lineWidth=.8;c.beginPath();c.moveTo(-w/2+fx+sk*.25,-h-d*.28);c.lineTo(w/2-fx+sk*.25,-h-d*.28);c.lineTo(w/2-fx+sk*.75,-h-d*.72);c.lineTo(-w/2+fx+sk*.75,-h-d*.72);c.closePath();c.stroke();
  if(Quality.tier()!=='low'){c.save();c.translate(sk*.5,-h-d*.5);c.transform(1,0,0,.42,0,0);drawSigil(c,b.w,b.tier,0,0,Math.min(w*.1,d*1.3),.8);c.restore();}
 }
 /* page block at the right end, shaded where the cover overhangs */
 const pw=Math.max(5,h*.28);
 c.fillStyle=rgb(232,220,186);c.fillRect(w/2,-h+2,pw,h-4);
 c.strokeStyle=rgb(150,134,100,.8);c.lineWidth=.7;for(let k=1;k<5;k++){const yy=-h+2+(h-4)*k/5;c.beginPath();c.moveTo(w/2,yy);c.lineTo(w/2+pw,yy);c.stroke();}
 c.fillStyle=rgb(0,0,0,.3);c.fillRect(w/2,-h+2,2,h-4);
 if(isTop){c.fillStyle=rgb(232,220,186);c.beginPath();c.moveTo(w/2,-h+2);c.lineTo(w/2+pw,-h+2);c.lineTo(w/2+pw+sk*.6,-h-d*.6);c.lineTo(w/2+sk*.6,-h-d*.6);c.closePath();c.fill();}
 /* the spine, turned so the lettering reads left to right */
 c.save();c.translate(0,-h/2);c.rotate(Math.PI/2);c.drawImage(spineSprite(b,w,h,dpr),-h/2,-w/2,h,w);c.restore();
 c.fillStyle=rgb(255,240,200,.12);c.fillRect(-w/2,-h,w,1.2);
 if(!isTop){const sg=c.createLinearGradient(0,-h,0,-h+7);sg.addColorStop(0,rgb(0,0,0,.4));sg.addColorStop(1,rgb(0,0,0,0));c.fillStyle=sg;c.fillRect(-w/2,-h,w,7);}
 ageBook(c,w,h,age,seed);
 if(b.fav){c.font='600 13px Cinzel,Georgia,serif';c.fillStyle=rgb(246,217,138);c.textAlign='center';c.textBaseline='middle';c.fillText('★',w/2-h*.6,-h/2+.5);}
 if(n>1){ /* the same word found again: one book stands for all, with a brass tally */
  const r=Math.max(7,h*.28),bx=w/2-r-2,by=-h/2;
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

/* A hanging sign: a plank on two cords from the beams, hand-lettered in the same small caps as THE ATTIC. */
function hangSign(c,cx,cy,label,sub,cordTop,u){
 const fs=Math.round(12*u+2);c.font=`600 ${fs}px Cinzel,Georgia,serif`;
 const text=label.toUpperCase(),tw=c.measureText(text).width,sw=Math.max(88*u,tw+26),sh=fs*2.5+(sub?fs*.2:0);cx=Math.max(cx,sw/2+8);
 c.strokeStyle=rgb(40,28,16);c.lineWidth=1.3;c.beginPath();
 for(const k of[-.36,.36]){c.moveTo(cx+sw*k,cordTop);c.lineTo(cx+sw*k,cy-sh/2);}c.stroke();
 c.save();c.translate(cx,cy);c.rotate(-.012);
 c.fillStyle=rgb(0,0,0,.35);c.fillRect(-sw/2+2,-sh/2+3,sw,sh);
 const g=c.createLinearGradient(0,-sh/2,0,sh/2);g.addColorStop(0,rgb(92,64,34));g.addColorStop(1,rgb(58,40,22));
 c.fillStyle=g;c.fillRect(-sw/2,-sh/2,sw,sh);
 c.strokeStyle=rgb(150,112,60,.75);c.lineWidth=1.2;c.strokeRect(-sw/2+2.5,-sh/2+2.5,sw-5,sh-5);
 c.fillStyle=rgb(196,158,84);for(const k of[-.43,.43]){c.beginPath();c.arc(cx*0+sw*k,-sh/2+6,1.8,0,6.3);c.fill();}
 c.textAlign='center';c.textBaseline='middle';c.fillStyle=rgb(226,204,152);c.font=`600 ${fs}px Cinzel,Georgia,serif`;c.fillText(text,0,sub?-fs*.35:1);
 if(sub){c.fillStyle=rgb(190,168,120,.85);c.font=`${Math.round(fs*.8)}px "Special Elite",Georgia,serif`;c.fillText(sub,0,fs*.8);}
 c.restore();
}


/* One section of the attic, painted into ctx at screen offset ry: its room, light, and its piles (back rows first)
   under a hanging sign. Returns hit rects, topmost first. */
function drawSection(ctx,room,o){
 const {W,A,ry,TIERS,vt,RM,sec,idx,lit,now,rank,total}=o,q=Quality.params(),{win}=room,phone=W<600,hits=[],dpr=room.dpr||1;
 ctx.drawImage(room.cv,0,ry,W,A);
 ctx.save();ctx.globalCompositeOperation='lighter';
 if(idx===0&&!RM)for(let k=0;k<18;k++){const ph=k*1.7,u=((vt*.02+k*.137)%1),x=win.x+Math.sin(vt*.3+ph)*win.r*(1+u*3)+(k%2?1:-1)*u*W*.03,y=ry+win.y+u*(A-win.y),al=Math.sin(u*Math.PI)*.5*lit;
  ctx.fillStyle=rgb(255,236,190,al);ctx.beginPath();ctx.arc(x,y,1+(k%3)*.5,0,6.3);ctx.fill();}
 const sw=lanternPos(W,ry,A,EAVE,swayAngle(vt,{RM,glow:q.glow})),lx=sw.x,ly=sw.y+5,fl=RM?1:1+.06*Math.sin(vt*11)+.04*Math.sin(vt*23);
 {const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,A*.5*fl);lg.addColorStop(0,rgb(255,190,100,.2*lit));lg.addColorStop(1,rgb(255,150,60,0));ctx.fillStyle=lg;ctx.fillRect(lx-A*.55,ly-A*.55,A*1.1,A*1.1);}
 ctx.restore();
 if(idx===0)drawSky(ctx,{win,ry,A,W,vt,lit,sky:o.sky||((!room.sky||Math.abs(Date.now()-room.skyAt)>6e4)&&(room.sky=skyAt(),room.skyAt=Date.now()),room.sky),RM,low:q.name==='low'});
 drawLantern(ctx,W,ry,A,EAVE,vt,{RM,glow:q.glow});
 const base=r=>ry+A*(1-.03-.075*r),sc=r=>1-.12*r;
 for(const p of sec.L.piles.slice().sort((a,b)=>b.row-a.row)){
  const s=sc(p.row),bw=p.w*(phone?.84:.8)*s,bh=(phone?19:29)*s,pr=rng(((p.items[0].i+1)*40503+p.ord*977)>>>0);
  const cx=p.x+(pr()-.5)*p.w*.12,y0=base(p.row)+(pr()-.5)*A*.012;let y=y0;
  const sg=ctx.createRadialGradient(cx,y0+2,0,cx,y0+2,bw*.62);sg.addColorStop(0,rgb(0,0,0,.34));sg.addColorStop(1,rgb(0,0,0,0));
  ctx.save();ctx.translate(0,y0+2);ctx.scale(1,.16);ctx.translate(0,-(y0+2));ctx.fillStyle=sg;ctx.fillRect(cx-bw*.7,y0+2-bw*.7,bw*1.4,bw*1.4);ctx.restore();
  const kind=p.kind,n=p.items.length,inner=kind==='crate'?.9:1;
  let rise=0;
  if(kind==='trunk')rise=plinth(ctx,'trunk',cx,y,bw,bh);
  else if(kind==='plank')rise=plinth(ctx,'plank',cx,y,bw,bh);
  else if(kind==='crate')rise=plinth(ctx,'crate',cx,y,bw,bh,n);
  y-=rise;
  const order=p.items.slice().reverse(),lean=cx<W/2?1:-1; // oldest at the bottom, newest on top
  order.forEach((x,k)=>{
   const seed=((x.i+1)*2654435761)>>>0,R=rng(seed),top=k>=order.length-(order.length>3?2:1),isTop=k===order.length-1;
   let w=bw*inner*(.82+R()*.18),rot=(R()-.5)*.05,jx=(R()-.5)*bw*.1;
   if(kind==='heap'){rot=(R()-.5)*.2;jx=(R()-.5)*bw*.2;w=bw*(.7+R()*.28);}
   else if(kind==='slump'&&top){rot=(isTop?-1:1)*(.1+R()*.08);jx=(isTop?1:-1)*bw*(.04+R()*.06);}
   else if(kind==='crate'){jx=(R()-.5)*bw*.04;}
   const lift=Math.abs(Math.sin(rot))*w*.42,yy=y-lift;
   lyingBook(ctx,cx+jx,yy,w,bh,x.b,rot,bookAge(x.b,rank.get(x),total,now),seed,dpr,x.n||1,isTop,lean);
   const ext=Math.abs(Math.sin(rot))*w/2;
   hits.unshift({x:cx+jx-w/2,y:yy-bh-ext-(isTop?bh*.5:0),w:w+bh*.3,h:bh+ext*2+(isTop?bh*.5:0),b:x.b});
   y=yy-bh+1;
  });
  if(kind==='crate')plinth(ctx,'crate-ends',cx,y0,bw,bh,n);
 }
 /* the section's sign, up on the left where the ladder and window leave room */
 {const u=(phone?.8:1)*1.3,cy=ry+A*.5;
  hangSign(ctx,Math.max(W*.19,84*u),cy,sec.title+(sec.cont?' (more)':''),`${sec.count} ${sec.count===1?'book':'books'}`,ry+A*.36,u);}
 if(lit<1){ctx.fillStyle=rgb(4,3,2,(1-lit)*.78);ctx.fillRect(0,ry,W,A);}
 /* deeper sections are dimmer, and the window light fades with them */
 if(idx>0){ctx.fillStyle=rgb(4,3,2,Math.min(.5,idx*.07));ctx.fillRect(0,ry,W,A);}
 if(idx===0&&lit>0){ctx.save();ctx.globalCompositeOperation='lighter';const wb=ctx.createRadialGradient(win.x,ry+win.y,0,win.x,ry+win.y,Math.max(W,A)*.55);wb.addColorStop(0,rgb(255,240,200,.16*lit*(1-lit*.5)));wb.addColorStop(1,rgb(255,240,200,0));ctx.fillStyle=wb;ctx.fillRect(0,ry,W,A);ctx.restore();}
 if(o.hidden>0&&idx===o.last){ctx.fillStyle=rgb(216,192,140,.85);ctx.font='italic 14px "Anthropic Serif Text",Georgia,serif';ctx.textAlign='center';ctx.fillText(`and ${o.hidden} more on the Shelf`,W/2,ry+A-6);}
 return hits;
}

/* The attic as a run of sections stacked upward, one room-height each. `scroll` (px, 0 .. (sections-1)*A, eased by the
   caller) is how far up you have climbed: section i sits at ry + scroll - i*A, so scrolling up carries you from the
   recent guesses into each earlier month in turn. Only the sections on screen are drawn; the first room is built by the
   caller and the others share two timber layouts, built when first reached. */
export function sectionY(i,scroll,ry,A){return ry+scroll-i*A;}
export function drawAttic(ctx,room,o){
 const {W,A,H,ry,items,scroll=0}=o,lit=o.lit==null?1:o.lit;
 if(!room.plan||room.plan.items!==items||room.plan.W!==W)room.plan={items,W,...planSections(items,W)};
 const {sections,hidden}=room.plan,now=Date.now(),rank=new Map(items.map((x,k)=>[x,k]));
 let hits=[];
 for(let i=sections.length-1;i>=0;i--){
  const y=sectionY(i,scroll,ry,A);if(y>H||y+A<0)continue;
  const rm=i===0?room:(room.deep=room.deep||[])[i%2]||(room.deep[i%2]=buildRoom(W,A,room.dpr||1,19+i%2*8,{sign:false}));
  const h=drawSection(ctx,rm,{...o,ry:y,lit,sec:sections[i],idx:i,now,rank,total:items.length,hidden,last:sections.length-1});
  hits=hits.concat(h);
 }
 return hits;
}
export const sectionCount=(items,W)=>planSections(items,W).sections.length;
export const sectionTitle=(items,W,i)=>{const s=planSections(items,W).sections[i];return s?s.title+(s.cont?' (more)':''):'';};
