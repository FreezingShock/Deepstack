/* The attic room: a real place above the top shelves of the world canvas. Scroll up from home and the camera
   climbs into a gabled roof space: sloped roof, rafters and a collar beam, side posts, a round window with a shaft
   of light and drifting dust, cobwebs in the joints, and books lying in piles on the floor boards (recent guesses
   first, then earlier finds). The static room is painted once into an offscreen canvas and re-used; only the
   books, the lamp glow and the dust move. Pure layout (layoutPiles) is exported for tests. */

import {PALETTE} from '../theme/colors.js';

const rgb=(r,g,b,a=1)=>`rgba(${r|0},${g|0},${b|0},${a})`;
const hexRgb=h=>{const n=parseInt(String(h).slice(1,7),16);return[n>>16&255,n>>8&255,n&255];};
const shade=(h,f,a=1)=>{const [r,g,b]=hexRgb(h);return rgb(r*f,g*f,b*f,a);};
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
export const VP_Y=.5,FAR=.6,EAVE=.38;

/* ---- layout (pure) ---- */
/* items: [{b,i,recent?}], newest first. Returns piles with a row (0 front .. 2 back), centre x, and books top-of-pile
   first. Piles never mix recent guesses with earlier finds so each group can wear its own tag. */
export function layoutPiles(items,W,{rowsMax=3}={}){
 const phone=W<600,pileW=phone?150:214,fit=Math.max(1,Math.floor((W-28)/pileW)),cap=fit*rowsMax;
 const groups=[items.filter(x=>x.recent),items.filter(x=>!x.recent)].filter(g=>g.length);
 const total=items.length,perPile=Math.min(6,Math.max(4,Math.ceil(total/cap)));
 const piles=[];
 groups.forEach((g,gi)=>{for(let k=0;k<g.length;k+=perPile)piles.push({items:g.slice(k,k+perPile),group:g[0].recent?'recent':'earlier',first:k===0});});
 const shown=piles.slice(0,cap),hidden=piles.slice(cap).reduce((n,p)=>n+p.items.length,0);
 let at=0;
 for(let row=0;row<rowsMax&&at<shown.length;row++){
  const n=Math.min(fit,shown.length-at),span=n*pileW,x0=(W-span)/2+pileW/2;
  for(let k=0;k<n;k++){const p=shown[at+k];p.row=row;p.x=x0+k*pileW;p.w=pileW;}
  at+=n;
 }
 return{piles:shown,hidden,pileW};
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
export function buildRoom(W,A,DPR=1,seed=7){
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
 /* the sign on the back wall */
 const sg=P(W/2,A*.575,FAR),sw=Math.max(130,W*.17)*.9,sh=Math.max(26,sw*.19);
 c.fillStyle=rgb(70,48,26);c.fillRect(sg.x-sw/2,sg.y-sh/2,sw,sh);c.strokeStyle=rgb(120,88,50,.8);c.lineWidth=1.4;c.strokeRect(sg.x-sw/2+1,sg.y-sh/2+1,sw-2,sh-2);
 c.fillStyle=rgb(216,192,140);c.font=`600 ${Math.round(sh*.5)}px Cinzel,Georgia,serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('THE ATTIC',sg.x,sg.y+1);
 c.strokeStyle=rgb(40,28,16);c.lineWidth=1.4;c.beginPath();c.moveTo(sg.x-sw*.4,sg.y-sh/2);c.lineTo(sg.x-sw*.4,sg.y-sh/2-A*.05);c.moveTo(sg.x+sw*.4,sg.y-sh/2);c.lineTo(sg.x+sw*.4,sg.y-sh/2-A*.05);c.stroke();
 /* corner webs low on the posts and in the far floor corners */
 web(c,W*.045+10,A*.6,1,-1,W*.05,.16);web(c,W*.955-10,A*.6,-1,-1,W*.05,.16);
 return{cv,win:{x:wc.x,y:wc.y,r:wr},geo:geometry(W,A)};
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
 c.fillStyle=rgb(...DUST,.05+.2*age);c.fillRect(-w/2,-h,w,h); // dull the cloth
 const tg=c.createLinearGradient(0,-h,0,-h*.35);tg.addColorStop(0,rgb(...DUST,.5*age));tg.addColorStop(1,rgb(...DUST,0));
 c.fillStyle=tg;c.fillRect(-w/2,-h,w,h*.65); // dust settles on top
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
function lyingBook(c,x,y,w,h,spine,word,rot,fav,age=0,seed=1){
 c.save();c.translate(x,y);c.rotate(rot);
 c.fillStyle=rgb(0,0,0,.4);c.beginPath();c.ellipse(0,1,w*.54,h*.28,0,0,6.3);c.fill();
 const g=c.createLinearGradient(0,-h,0,0);g.addColorStop(0,shade(spine,1.18));g.addColorStop(.35,shade(spine,.95));g.addColorStop(1,shade(spine,.5));
 c.fillStyle=g;c.fillRect(-w/2,-h,w,h);
 c.fillStyle=rgb(236,224,190);c.fillRect(w/2,-h+2,Math.max(5,h*.28),h-4); // page block
 c.strokeStyle=rgb(150,134,100,.8);c.lineWidth=.7;for(let k=1;k<4;k++){const yy=-h+2+(h-4)*k/4;c.beginPath();c.moveTo(w/2,yy);c.lineTo(w/2+Math.max(5,h*.28),yy);c.stroke();}
 c.fillStyle=rgb(216,184,110,.9*(1-.75*age));for(const bx of[-w/2+h*.55,w/2-h*.55])c.fillRect(bx-1.5,-h,3,h);
 c.fillStyle=rgb(0,0,0,.25);c.fillRect(-w/2,-h,w,1.5);
 ageBook(c,w,h,age,seed);
 c.fillStyle=rgb(246,236,210,.95);c.textAlign='center';c.textBaseline='middle';
 let fs=Math.max(9,Math.min(15,h*.52));c.font=`600 ${fs}px Cinzel,Georgia,serif`;const maxW=w-h*1.5;
 while(c.measureText(word).width>maxW&&fs>7){fs-=.5;c.font=`600 ${fs}px Cinzel,Georgia,serif`;}
 c.lineJoin='round';c.lineWidth=2.4;c.strokeStyle=rgb(0,0,0,.55);c.strokeText(String(word).toUpperCase(),0,-h/2+.5,maxW);c.fillText(String(word).toUpperCase(),0,-h/2+.5,maxW);
 if(fav){c.fillStyle=rgb(246,217,138);c.fillText('★',w/2-h*.95,-h/2+.5);}
 c.restore();
}

/* Paint the room (and what moves in it) at screen offset ry (top of the room). Returns hit rects in screen space,
   topmost first. */
export function drawAttic(ctx,room,o){
 const {W,A,ry,items,TIERS,vt,RM}=o,lit=o.lit==null?1:o.lit; // lit: 0 dark .. 1 skylight at full (grows as you climb)
 ctx.drawImage(room.cv,0,ry,W,A);
 /* dust in the shaft + lamp glow (additive) */
 const {win}=room;
 ctx.save();ctx.globalCompositeOperation='lighter';
 if(!RM)for(let k=0;k<18;k++){const ph=k*1.7,u=((vt*.02+k*.137)%1),x=win.x+Math.sin(vt*.3+ph)*win.r*(1+u*3)+(k%2?1:-1)*u*W*.03,y=ry+win.y+u*(A-win.y),al=Math.sin(u*Math.PI)*.5*lit;
  ctx.fillStyle=rgb(255,236,190,al);ctx.beginPath();ctx.arc(x,y,1+(k%3)*.5,0,6.3);ctx.fill();}
 const lx=W*.7,ly=ry+A*EAVE*.55+46,fl=RM?1:1+.06*Math.sin(vt*11)+.04*Math.sin(vt*23);
 const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,A*.5*fl);lg.addColorStop(0,rgb(255,190,100,.2*lit));lg.addColorStop(1,rgb(255,150,60,0));ctx.fillStyle=lg;ctx.fillRect(lx-A*.55,ly-A*.55,A*1.1,A*1.1);
 ctx.restore();
 ctx.strokeStyle=rgb(40,28,16);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(lx,ry+A*EAVE*.55+5);ctx.lineTo(lx,ly-10);ctx.stroke();
 ctx.fillStyle=rgb(255,214,130);ctx.fillRect(lx-5,ly-10,10,16);ctx.strokeStyle=rgb(120,84,40);ctx.lineWidth=1.4;ctx.strokeRect(lx-5,ly-10,10,16);
 /* piles, back rows first */
 const {piles,hidden}=layoutPiles(items,W),hits=[],phone=W<600;
 const now=Date.now(),rank=new Map(items.map((x,k)=>[x,k]));
 const base=r=>ry+A*(1-.03-.075*r),sc=r=>1-.12*r;
 for(const p of piles.slice().sort((a,b)=>b.row-a.row)){
  const s=sc(p.row),bw=p.w*(phone?.84:.8)*s,bh=(phone?19:29)*s;let y=base(p.row);
  const order=p.items.slice().reverse(); // oldest at the bottom, newest on top
  order.forEach((x,k)=>{
   const seed=((x.i+1)*2654435761)>>>0,R=rng(seed),w=bw*(.82+R()*.18),rot=(R()-.5)*.05,jx=(R()-.5)*bw*.1,spine=TIERS[x.b.tier].spine;
   lyingBook(ctx,p.x+jx,y,w,bh,spine,x.b.w,rot,x.b.fav,bookAge(x.b,rank.get(x),items.length,now),seed);
   hits.unshift({x:p.x+jx-w/2,y:y-bh,w:w+bh*.3,h:bh,b:x.b});
   y-=bh-1;
  });
  if(p.first){const label=p.group==='recent'?'Recent guesses':'Earlier finds',fs=phone?13:16;
   ctx.font=`500 ${fs}px "Fuzzy Bubbles",Georgia,serif`;const tw=ctx.measureText(label).width+14;
   ctx.save();ctx.translate(p.x,y-8*s);ctx.rotate(-.03);ctx.fillStyle=rgb(236,224,190);ctx.fillRect(-tw/2,-fs-2,tw,fs+8);ctx.fillStyle=rgb(40,28,16);ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(label,0,0);ctx.restore();}
 }
 /* the skylight grows as you rise: the whole room starts in shadow and brightens, with a window bloom on top */
 if(lit<1){ctx.fillStyle=rgb(4,3,2,(1-lit)*.78);ctx.fillRect(0,ry,W,A);}
 if(lit>0){ctx.save();ctx.globalCompositeOperation='lighter';const wb=ctx.createRadialGradient(win.x,ry+win.y,0,win.x,ry+win.y,Math.max(W,A)*.55);wb.addColorStop(0,rgb(255,240,200,.16*lit*(1-lit*.5)));wb.addColorStop(1,rgb(255,240,200,0));ctx.fillStyle=wb;ctx.fillRect(0,ry,W,A);ctx.restore();}
 if(hidden>0){ctx.fillStyle=rgb(216,192,140,.8);ctx.font='italic 14px "Anthropic Serif Text",Georgia,serif';ctx.textAlign='center';ctx.fillText(`and ${hidden} more on the Shelf`,W/2,ry+A-6);}
 return hits;
}
