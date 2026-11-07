import {tierBase,mixc,LEATHER,RIBBONS,bookArt,rgbs} from '../ui/bookArt.js';
import {plaqueShadow,plaqueMount} from '../ui/mounts.js';
import {lecternGeom,drawLecternBack,drawLecternLip} from '../ui/lectern.js';
import {glowSprite,stampGlow,fillOutside} from '../ui/glowSprite.js';
import {lampGlow,flameGlow,tierGlow} from '../ui/glowDefs.js';
import {PALETTE} from '../theme/colors.js';
import {worldCovered,frameInterval} from '../ui/canvasCover.js';
import {Quality} from '../ui/quality.js';
import {worldDpr} from '../ui/dprCap.js';
import {Feel,Sfx} from '../feel.js';
import {travelEase,travelMs,ascendMs} from '../ui/camMotion.js';
import {deepProps,deepWall,deepProp} from '../ui/floorArt.js';
import {pullX as pullXAt} from '../core/pull.js';
import {liftGeom,liftEnvelope,drawLift} from './lift.js';
import {loreCovered as loreCoveredAt} from '../ui/loreCover.js';
import {isLore,drawLoreMark,drawLoreGlow,hitLoreBook} from '../ui/lore.js';
import {isCurio,drawCurioMark,hitCurio} from '../ui/curios.js';
import {drawLedge} from '../ui/ledge.js';
import {placeFallen,drawFallen} from '../ui/fallenBooks.js';
import {lyingFootprint,settleBooks,placeProp,propHalf,tiltAboutFoot} from '../ui/physics.js';
import {drawAlcoveLanterns} from '../ui/lanterns.js';
import {tintLamp} from '../ui/roomRun.js';
import {lowQuality,updateAmbient,drawAmbient,resetAmbient} from '../ui/ambient.js';
import {createPass,passCam} from '../ui/thresholdPass.js';
import {doorSpan,drawWallMaterial,drawThreshold,drawThresholdLive,drawThresholdSign} from '../ui/thresholds.js';
import {drawFloorAtmosphere} from '../ui/floorAtmosphere.js';
import {drawLighting,addLight,reach} from '../ui/lighting.js';
import {registerCandleLight,drawCandleGlow} from '../ui/candleLight.js';
import {drawEyes} from '../ui/eyes.js';
import {litProp,brazierProps,isLit} from '../ui/litProps.js';
import {alcoveFit} from './alcoveFit.js';
import {nookMetrics,drawNook,paintAroundAlcoves,alcoveRects} from '../ui/alcoveArt.js';
import {$,RM,clamp} from '../app/util.js';
import {FT,TIERS,atmosphereAt,floorAtRow,hashStr,mulberry,tierOf} from '../app/state.js';
import {bookDims,seedOf,shelfDims} from './bookArt.js';
import {buildHall,drawAttic,rowCount,rowTitle} from './atticRoom.js';
import {drawLadder,climbLight} from './atticClimb.js';
import {drawBackStacks,resetBackStacks} from './backStacks.js';
import {nicheWidth} from './nicheWidth.js';

/* ---------- the stacks (continuous canvas world) ---------- */
export const World=(()=>{
 const cv=$('#world');let ctx=cv.getContext('2d');const ctx0=ctx;let building=false;const bmpPool=[];
 let W=0,H=0,DPR=1,RH=150,BM=20,rows=new Map(),taken=new Set(),cam=0,restRow=0,st=null,dust=[],vt=0,last=performance.now();
 let eyeCam=0,atticMove=null,atticYLast=0,atticT=0,atticGoal=0,atticCb=null,atticItems=[],room=null,roomKey='',atticS=0,atticSGoal=0,atticSAt=0,atticSCb=null,atticSecI=-1,atticA=0;
 let shelf=[],hits=[],ledgeCb=null,onDepth=null,gaugeCb=null,niches=new Map(),boff=0,btgt=0,wasB=false,browseCb=null;
 const ZS=[0,.14,.3,.46,.62,.78,.92];
 let rowsKey=null,rowsVal=0;const rowsN=()=>{if(rowsKey!==atticItems||rowsW!==W){rowsKey=atticItems;rowsW=W;rowsVal=rowCount(atticItems,W);}return rowsVal;};let rowsW=0;
 const restCam=r=>r*RH-(H-RH-BM);
 const abn=r=>Math.max(clamp(r/190,0,1),floorAtRow(r).decay);
 const barPx=()=>52+(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat'))||0);
 function nicheBox(){const nw=nicheWidth(W),f=alcoveFit(H,barPx(),BM,W<640);return{x:(W-nw)/2,w:nw,t:f.top,h:f.h,b:f.bottom};} // centred: half a shelf row above and below (alcoveFit.js)
 function setNicheVars(){const n=nicheBox(),r=document.documentElement.style;r.setProperty('--nx',n.x+'px');r.setProperty('--nw',n.w+'px');r.setProperty('--nt',n.t+'px');r.setProperty('--nb',(H-n.b)+'px');r.setProperty('--nook',nookMetrics(W).reserve+'px');}
 function resize(){W=innerWidth;H=innerHeight;DPR=worldDpr(W,H,Math.min(devicePixelRatio||1,Quality.params().dprMax)); // capped at ~6 MP so huge screens stay light
  cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);BM=Math.max(14,parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab'))||14);RH=alcoveFit(H,barPx(),BM,W<640).RH; // the row height is fitted so the alcove centres with half a row above and below
  rows.clear();resetBackStacks();
  document.documentElement.style.setProperty('--shelfH',(H-nicheBox().b)+'px');setNicheVars();document.documentElement.style.setProperty('--rh',Math.round(RH*.8)+'px');if(!st)cam=restCam(restRow);}
 // where the book for row r is pulled from: a random spot along that shelf, stable for the row
 function pullX(r){return pullXAt(r,W);}
 function genRow(r,layer){
  const key=r*2+layer;if(rows.has(key))return rows.get(key);
  const rng=mulberry(r*7919+layer*104729+13),a=abn(r),fl=floorAtRow(r),sc=layer?.72:1,bs=[],webs=[],props=[];let x=-6;
  while(x<W+40){const w=(10+rng()*22)*sc;
   if(rng()<.03+.24*a+(fl.gap||0)){x+=w*(.5+rng());continue;} // missing books
   // every book draws all of its random numbers before any window-dependent skip, so a different width never shifts the rest of the row
   const h=RH*sc*(.58+rng()*.32);
   const cx=x+w/2,lean=layer===0?-clamp((cx-600)/600,-1,1)*.12*a:0;const rnd=rng()<.05+.32*a?(rng()-.5)*(.1+.45*a):0,tilt=rnd+lean;
   const tier=rng()<.05?Math.floor(rng()*rng()*7):-1;
   const col=tier>=0?tierBase(tier):mixc(mixc(LEATHER[(rng()*LEATHER.length)|0],fl.books[0],fl.books[1]),[110,100,86],a*.5);
   const seed=(rng()*65536)|0,rib=rng()<.14?RIBBONS[(rng()*5)|0]:null,lying=rng()<.09*a,gapAfter=rng()<.1?3+rng()*12:1;
   if(layer===0&&r===fl.row&&r>0&&cx>doorSpan(W)[0]-w&&cx<doorSpan(W)[1]+w){x+=w;continue;} // the doorway bay holds no books
   if(layer===0&&(taken.has(r)||(st&&st.row===r))&&Math.abs(cx-pullX(r))<34){x+=w;continue;}
   bs.push({x:x,w,h,tier,col,tilt,lean,rnd,seed,rib,lying});
   x+=Math.max(w,lying?lyingFootprint(bs[bs.length-1]):0)+gapAfter;}
  const rg2=mulberry(r*6329+layer*77003+5); // webs, props and cracks draw from their own stream so a book count that changes with the window never reshuffles them
  settleBooks(bs); // lean only on a neighbour, about the right foot; lying books keep their own room
  if(layer===0){for(let i=0;i<=3;i++){const ux=i*(W/3);if(rg2()<.3+.7*a){const dir=i===3?-1:1;webs.push({k:'corner',x:ux+dir*7,y:0,dir,s:34+rg2()*(60+120*a),seed:(rg2()*999)|0});}
    if(i<3&&rg2()<.1+.8*a){webs.push({k:'curtain',x:ux+7,x2:ux+W/3-7,sag:30+rg2()*60,seed:(rg2()*999)|0});}}
   const nh=a>.03?Math.floor(rg2()*(1+8*a)):0;for(let i=0;i<nh;i++)webs.push({k:'strand',x:rg2()*W,len:(20+rg2()*60)*(fl.motif==='flood'?2.2:1),seed:(rg2()*999)|0});
   if(r===fl.row&&r>0)props.push({k:'lintel'});
   if(fl.motif==='stacks'){for(let x2=60+rg2()*80;x2<W-30;x2+=130+rg2()*220){props.push(rg2()<.5?{k:'plate',x:x2,n:1+((rg2()*98)|0)}:{k:'papers',x:x2,n:2+((rg2()*3)|0),w:24+rg2()*26,tw:rg2()-.5});}}
   else if(fl.motif==='archive'){for(let x2=40+rg2()*60;x2<W-30;x2+=90+rg2()*150){props.push(rg2()<.55?{k:'plate',x:x2,n:100+((rg2()*899)|0)}:{k:'papers',x:x2,n:2+((rg2()*4)|0),w:26+rg2()*30,tw:rg2()-.5});}}
   else if(fl.motif==='crypt'){for(let x2=30+rg2()*60;x2<W-30;x2+=70+rg2()*140){props.push(rg2()<.5?{k:'skull',x:x2,s:.8+rg2()*.5,tilt:(rg2()-.5)*.5}:{k:'bones',x:x2,s:.8+rg2()*.6,seed:(rg2()*999)|0});}}
   else{props.push(...deepProps(fl,W,mulberry(r*6329+11)));props.push(...brazierProps(fl,W,mulberry(r*6329+23)));}}
  const data={bs,webs,props,fl,crack:rg2()<.5*a?{x:rg2()*W,w:30+rg2()*90}:null};
  for(const pr of props)if(pr.x!=null)pr.x=placeProp(pr.x,propHalf(pr),W,data.crack); // nothing stands on a pillar or over a cracked plank
  if(layer===0&&r>0)data.fallen=placeFallen(bs,{W,RH,a,r,crack:data.crack,avoid:[[pullX(r)-40,pullX(r)+40]],paint:g=>{const t=g()<.05?Math.floor(g()*g()*7):-1;return{tier:t,col:t>=0?tierBase(t):mixc(mixc(LEATHER[(g()*LEATHER.length)|0],fl.books[0],fl.books[1]),[110,100,86],a*.5)};}}); // books that came down in front of the gaps
  rows.set(key,data);return data;}
 function drawWeb(wb,y,a,wc=[224,218,200]){
  ctx.strokeStyle=`rgba(${wc[0]},${wc[1]},${wc[2]},${.14+.3*a})`;ctx.lineWidth=1;const rng=mulberry(wb.seed);
  if(wb.k==='corner'){const n=5,s=wb.s,pts=[];for(let i=0;i<n;i++){const ang=(i/(n-1))*Math.PI/2*(.9+rng()*.2);pts.push([wb.x+wb.dir*Math.cos(ang)*s,y+Math.sin(ang)*s]);ctx.beginPath();ctx.moveTo(wb.x,y);ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();}
   for(let k=1;k<=3;k++){const f=k/3.2;ctx.beginPath();for(let i=0;i<n;i++){const px=wb.x+(pts[i][0]-wb.x)*f,py=y+(pts[i][1]-y)*f;if(i===0)ctx.moveTo(px,py);else{const pm=[wb.x+(pts[i-1][0]-wb.x)*f,y+(pts[i-1][1]-y)*f];ctx.quadraticCurveTo((pm[0]+px)/2-wb.dir*3,(pm[1]+py)/2-3,px,py);}}ctx.stroke();}}
  else if(wb.k==='curtain'){const mx=(wb.x+wb.x2)/2;ctx.beginPath();ctx.moveTo(wb.x,y+2);ctx.quadraticCurveTo(mx,y+2+wb.sag,wb.x2,y+2);ctx.stroke();
   for(let i=1;i<7;i++){const t=i/7,px=wb.x+(wb.x2-wb.x)*t,py=y+2+wb.sag*2*t*(1-t)*.5;ctx.beginPath();ctx.moveTo(px,y+2);ctx.lineTo(px+(rng()-.5)*8,py+wb.sag*.35*(1-Math.abs(t-.5)*1.4));ctx.stroke();}}
  else{ctx.beginPath();ctx.moveTo(wb.x,y);ctx.quadraticCurveTo(wb.x+6*Math.sin(vt*.7+wb.seed),y+wb.len*.5,wb.x+2,y+wb.len);ctx.stroke();}}
 // ---- themed floor dressing ----
 function floorWall(fl,x0,x1,y,base,rh,r){drawWallMaterial(ctx,fl,x0,x1,y,base,rh,r);} // paper, drawers, bone, wet stone, hollow wood, black glass (ui/thresholds.js)
 function floorProp(pr,fl,bx0,bx1,y,base){
  if(pr.k==='lintel'){drawThreshold(ctx,fl,W,y,RH,base,bx0,bx1);return;} // the door into a new floor
  if(pr.x<bx0-60||pr.x>bx1+60)return;
  ctx.save();ctx.translate(pr.x,base);
  if(pr.k==='plate'){ctx.fillStyle=PALETTE.bronze54;ctx.fillRect(-14,-4,28,9);ctx.fillStyle=PALETTE.oak2a2410;ctx.font='400 8px "Special Elite",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(pr.n,0,.5);}
  else if(pr.k==='papers'){ctx.rotate(pr.tw*.06);for(let i=0;i<pr.n;i++){ctx.fillStyle=i%2?PALETTE.brass71:PALETTE.brass77;ctx.fillRect(-pr.w/2+(i%2)*2,-(i+1)*5,pr.w,4);ctx.fillStyle=PALETTE.blackAlpha30;ctx.fillRect(-pr.w/2,-(i+1)*5+3,pr.w,1);}ctx.fillStyle=PALETTE.blood34;ctx.fillRect(-2,-pr.n*5-1,4,pr.n*5+1);}
  else if(pr.k==='skull'){ctx.rotate(pr.tilt);ctx.scale(pr.s,pr.s);ctx.fillStyle=PALETTE.brassCfc6ad;ctx.beginPath();ctx.arc(0,-14,11,Math.PI,0);ctx.lineTo(8,-5);ctx.lineTo(5,-2);ctx.lineTo(-5,-2);ctx.lineTo(-8,-5);ctx.closePath();ctx.fill();ctx.fillStyle=PALETTE.oak120d0a;ctx.beginPath();ctx.arc(-4,-13,3,0,6.3);ctx.arc(4,-13,3,0,6.3);ctx.fill();ctx.fillRect(-1,-9,2,3);}
  else if(pr.k==='candle'||pr.k==='urn'||pr.k==='tendril'||pr.k==='brazier'){ctx.restore();if(!isLit(pr))deepProp(ctx,pr,base);return;} // lit ones burn live (drawRow), not in the cached bitmap
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
  const rh=RH*sc,y=r*rh-cam_,base=y+rh-12*sc,a=abn(r),d=genRow(r,layer),fl=d.fl,backWall=building&&r!==0&&Quality.params().backStacks;
  const body=(bx0,bx1)=>{
   const bw=bx1-bx0;
   if(!backWall){const bg=ctx.createLinearGradient(0,y,0,base);bg.addColorStop(0,fl.wallTop);bg.addColorStop(1,fl.wallBot);ctx.globalAlpha=dim;ctx.fillStyle=bg;ctx.fillRect(bx0-70,y-40,bw+140,rh+80);} // with back stacks on, the wall is the parallax layer drawn behind (backStacks.js)
   ctx.globalAlpha=dim;
   ctx.fillStyle=fl.ledge;ctx.fillRect(bx0-70,base,bw+140,12*sc+40);ctx.fillStyle=fl.ledgeHi;ctx.fillRect(bx0-70,base,bw+140,2*sc);ctx.fillStyle=PALETTE.blackAlpha66;ctx.fillRect(bx0-70,base+12*sc-2,bw+140,2);
   if(d.crack){ctx.fillStyle=PALETTE.oak1;ctx.beginPath();ctx.moveTo(d.crack.x,base);ctx.lineTo(d.crack.x+d.crack.w*.5,base+5*sc);ctx.lineTo(d.crack.x+d.crack.w,base);ctx.lineTo(d.crack.x+d.crack.w,base+12*sc);ctx.lineTo(d.crack.x,base+12*sc);ctx.fill();}
   ctx.globalAlpha=1;
   if(layer===0&&(r!==0||fl.motif==='stacks'))floorWall(fl,bx0,bx1,y,base,rh,r);
   if(layer===0&&r===0){hits=[];let x=Math.max(34,(W-Math.min(W-60,1040))/2),maxX=W-Math.max(34,(W-Math.min(W-60,1040))/2);
    const vis=[]; // recent guesses no longer stand here: they live in the attic (ui/attic.js)
    for(const v of vis){const {b,dm}=v;for(let i=1;i<3;i++){const px=i*(W/3);if(x<px+9&&x+dm.w>px-9)x=px+9;} // never stand a spine behind a pillar
     const bx=x+dm.w/2;ctx.save();ctx.translate(bx,base);
     bookArt(ctx,{w:dm.w,h:dm.h,fit:dm.fit,tier:b.tier,seed:seedOf(b),word:b.w,ribbon:b.tier>=1||seedOf(b)%3===0?RIBBONS[seedOf(b)%RIBBONS.length]:null},vt);ctx.restore();
     hits.push({x:x,y:base-dm.h,w:dm.w,h:dm.h+16,b});x+=dm.w+3;}
    shelfVisible=vis.length;
    // fill the rest of this shelf with the same procedural books as every other row, so the top never reads as a bare band
    {const x0=Math.max(34,(W-Math.min(W-60,1040))/2),gx0=x0-4,gx1=x+4;
     for(const b of d.bs){if(b.x+b.w<bx0-50||b.x>bx1+50||(vis.length&&b.x+b.w>gx0&&b.x<gx1))continue;ctx.save();ctx.translate(b.x+b.w/2,base);
      if(b.lying){bookArt(ctx,{w:b.h*.7,h:b.w*1.2,tier:b.tier,col:b.col,seed:b.seed,ribbon:b.rib},vt);}
      else{if(b.tilt)tiltAboutFoot(ctx,b.tilt,b.w);bookArt(ctx,{w:b.w,h:b.h,tier:b.tier,col:b.col,seed:b.seed,ribbon:b.rib},vt);}
      ctx.restore();}}}
   else{
    for(const b of d.bs){if(b.x+b.w<bx0-50||b.x>bx1+50)continue;ctx.save();const bx=b.x+b.w/2;
     if(b.lying){ctx.translate(bx,base);bookArt(ctx,{w:b.h*.7,h:b.w*1.2,tier:b.tier,col:b.col,seed:b.seed,dust:a*.9,ribbon:b.rib},vt);}
     else{ctx.translate(bx,base);if(b.tilt)tiltAboutFoot(ctx,b.tilt,b.w);
      if(layer===0){bookArt(ctx,{w:b.w,h:b.h,tier:b.tier,col:b.col,seed:b.seed,dust:a*.8,ribbon:b.rib},vt);if(isLore(b,W))drawLoreMark(ctx,b);else if(isCurio(b,W))drawCurioMark(ctx,b);}
      else{ctx.fillStyle=rgbs(b.col);ctx.fillRect(-b.w/2,-b.h,b.w,b.h);}}
     ctx.restore();}}
   if(layer===0&&d.fallen)for(const f of d.fallen){if(f.hi<bx0-20||f.lo>bx1+20)continue;ctx.save();ctx.translate(0,base);drawFallen(ctx,f,a*.9,vt);ctx.restore();}
   if(layer===0){for(const pr of d.props)floorProp(pr,fl,bx0,bx1,y,base);for(const wb of d.webs){if(building&&wb.k==='strand')continue;if(wb.x>=bx0-120&&wb.x<=bx1+120)drawWeb(wb,y,a,fl.web);}
    if(fl.motif==='flood'&&!building)floodOverlay(fl,bx0,bx1,y,rh,r);}
  };
  if(layer===0&&r!==0&&a>.03){
   for(let i=0;i<3;i++){const bx0=i*W/3,bx1=bx0+W/3;ctx.save();ctx.beginPath();ctx.rect(bx0,y-1,W/3,rh+2);ctx.clip();if(!backWall){ctx.fillStyle=PALETTE.oak2;ctx.fillRect(bx0,y-1,W/3,rh+2);}
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
  if(!d.bmp&&(y+rh+40<0||y-40>H))return {base,d}; // fully off screen: don't build or blit its bitmap yet
  if(!d.bmp){const pad=40,cw=Math.ceil(W*DPR),ch=Math.ceil((rh+pad*2)*DPR),oc=bmpPool.pop()||document.createElement('canvas');
   if(oc.width!==cw||oc.height!==ch){oc.width=cw;oc.height=ch;}const o=oc.getContext('2d');o.setTransform(DPR,0,0,DPR,0,0);o.clearRect(0,0,W,rh+pad*2);
   ctx=o;building=true;try{drawRowLive(r,0,r*rh-pad,1,1);}finally{ctx=ctx0;building=false;}d.bmp=oc;d.pad=pad;}
  const cp=r===1?d.pad:0; // row 1's bitmap pad would paint over the bottom of the recent-books shelf above it, hiding the spines' lower end
  ctx.drawImage(d.bmp,0,cp*DPR,d.bmp.width,d.bmp.height-cp*DPR,0,y-d.pad+cp,W,rh+d.pad*2-cp);
  const a=abn(r),fl=d.fl;
  for(const wb of d.webs)if(wb.k==='strand')drawWeb(wb,y,a,fl.web);
  if(fl.motif==='flood')floodOverlay(fl,0,W,y,rh,r);
  for(const pr of d.props)if(isLit(pr)){ctx.save();ctx.translate(pr.x,base);litProp(ctx,pr,DPR,vt,RM,H);ctx.restore();} // candles and braziers: live flame, glow and a registered light
  if(r===fl.row)drawThresholdLive(ctx,fl,W,y,rh,vt,RM);
  if(r===fl.row&&r>0)drawThresholdSign(ctx,fl,W,y,rh,RM?0:pass.angle(r,performance.now())); // live so it can swing when you pass
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
    addLight(b.x+b.w/2,base-28,90,.8); // lore books and curios stay findable in the dark
    ctx.save();
    if(a>.03){const i=Math.min(2,Math.max(0,Math.floor((b.x+b.w/2)/(W/3)))),th=(i===0?1:i===2?-1:0)*.085*a;if(th){const cx=(i+.5)*W/3,cy=y+RH/2;ctx.translate(cx,cy);ctx.rotate(th);ctx.translate(-cx,-cy);}}
     
    ctx.translate(b.x+b.w/2,base);if(b.tilt)tiltAboutFoot(ctx,b.tilt,b.w);
    drawLoreGlow(ctx,b,vt);ctx.restore();}}}
 function drawNiche(row,nv,camNow,now){const t0=nv.t0;
  const n=nicheBox(),y=n.t+(row*RH-(H-RH-BM))-camNow,h=n.h,x=n.x,w=n.w;if(y>H+20||y+h<-20)return;
  const al=clamp((now-t0)/450,0,1),a=abn(row),r=Math.min(52,w*.09),lc=tintLamp(floorAtRow(row).lamp);
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
  drawNook(ctx,{x,y,w,h,lc}); // desk surface, open book and inkwell
  // cobwebs in the alcove corners, thicker when deeper
  if(a>.05){const m=mulberry(row*31+7);drawWeb({k:'corner',x:x+10,y:0,dir:1,s:40+a*90,seed:(m()*999)|0},y+10,a);drawWeb({k:'corner',x:x+w-10,y:0,dir:-1,s:40+a*90,seed:(m()*999)|0},y+10,a);}
  // wall lanterns, hung from chains on the arch
  drawAlcoveLanterns(ctx,{x,y,w,h,r,lc,a,now,row});
  // numeral plaque on the arch
  if(nv.label){ctx.font='600 13px Newsreader,Georgia,serif';const tw=ctx.measureText(nv.label).width+26,px=x+w/2-tw/2,py=y-12;plaqueShadow(ctx,px,py,tw,24);const pg=ctx.createLinearGradient(0,py,0,py+24);pg.addColorStop(0,PALETTE.bronze35);pg.addColorStop(1,PALETTE.oak3d2916);ctx.fillStyle=pg;ctx.fillRect(px,py,tw,24);ctx.strokeStyle=PALETTE.brass;ctx.lineWidth=1;ctx.strokeRect(px+.5,py+.5,tw-1,23);ctx.fillStyle=PALETTE.parchmentF3e3bd;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(nv.label,x+w/2,py+12.5);plaqueMount(ctx,px,py,tw,24);}
  if(nv.res)drawNicheResult(nv.res,x,y,w,h,now);
  // this run's books stand on the ledge in word order; a skipped word leaves an empty slot
  const nk=nookMetrics(w);nv.hit=nv.books&&nv.books.length?drawLedge(ctx,{books:nv.books,x,y,w,h,now,RH,inset:nk.inset,maxH:nk.maxBookH,dims:b=>shelfDims({w:b.w,tier:b.tier},RH),bookArt,ribbons:RIBBONS,hash:hashStr}):null;
  ctx.restore();}
 const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
 const shade=(hx,f)=>{const n=parseInt(hx.slice(1),16);return `rgb(${(n>>16)*f|0},${(n>>8&255)*f|0},${(n&255)*f|0})`;};
 let shelfVisible=0,lastCam=0,ambItems=[];
 // creatures keep off the alcove (and everything it could be), the top bar and any covering page
 function ambEnv(camNow,top,bot){const n=nicheBox(),ex=[{x:0,y:0,w:W,h:barPx()+10}];for(const [row] of niches){ex.push({x:n.x-44,y:n.t+(row*RH-(H-RH-BM))-camNow-60,w:n.w+88,h:n.h+130});}if(btgt>=-4)ex.push({x:n.x-44,y:n.t-60,w:n.w+88,h:n.h+130});return{W,H,RH,camNow,top,bot,excl:ex,rm:RM,low:lowQuality(),quiet:covNow,busy:!!st||!!rest};}
 let lastDraw=0,coverChk=0,covNow=false,movedAt=0,prevCam=0;const RM_IDLE_MS=80;
 let napT=0;const wake=()=>{napT=0;requestAnimationFrame(frame);};const nap=ms=>{napT=setTimeout(wake,Math.max(0,ms-8));};
 if(typeof addEventListener==='function')for(const ev of ['wheel','pointerdown','pointermove','keydown','touchmove'])addEventListener(ev,()=>{movedAt=performance.now();if(napT){clearTimeout(napT);wake();}},{passive:true}); // any input: full frame rate again at once
 const pass=createPass();function doorsPassed(c,now){for(const k of pass.track(c,now,RH,H,RM))if(!(st&&st.skip))Sfx.threshold(k);} // the camera crossed a floor door: sign swings, floor answers
 function frame(now){
  if(now-coverChk>100){coverChk=now;covNow=worldCovered();} // DOM probe at 10 Hz, not per frame
  Quality.sample(now);
  const fa=Feel.ts!==1||!!Feel.ox||!!Feel.oy,gap=Math.max(Quality.params().frameMs,frameInterval({covered:covNow,busy:!!st||!!rest,feelActive:fa}),RM&&!st&&!rest&&!fa&&now-movedAt>500?RM_IDLE_MS:0); // reduced motion: nothing glides, only the dust drifts, so an idle library needs ~12 frames a second, not 60
  if(gap&&now-lastDraw<gap-4){nap(gap-(now-lastDraw)-4);return;} // sleep until the next drawn frame instead of waking every vsync (battery: covered library, low tier, reduced motion)
  lastDraw=now;
  const rdt=Math.min(gap?.12:.05,(now-last)/1000);last=now;Feel.tick(rdt);const dt=rdt*Feel.ts;vt+=dt*(st&&st.skip?6:1);cv.style.transform=Feel.ox||Feel.oy?`translate(${Feel.ox}px,${Feel.oy}px)`:'';{const cl=document.getElementById('cardlayer');if(cl)cl.style.transform=cv.style.transform;}
  let camNow=cam,settle=0,pull=0;
  if(st){
   if(st.phase==='down'){const u=Math.min(1,st.t/st.dur);st.t+=dt*(st.skip?6:1);camNow=passCam(st.cam0+(st.cam1-st.cam0)*travelEase(u),u,RH,H,RM);st.prog=u;doorsPassed(camNow,now);if(u>=1){st.phase='settle';st.pt=0;Sfx.land();}}
   if(st.phase==='settle'){st.pt+=dt*(st.skip?6:1);camNow=st.cam1;st.prog=1;settle=Math.min(1,st.pt/.3);if(settle>=1){st.phase='pull';st.pt=0;Sfx.paper();}}
   if(st.phase==='pull'||st.phase==='hold'){camNow=st.cam1;settle=1;if(st.phase==='pull')st.pt+=dt*(st.skip?6:1);pull=Math.min(1,st.pt/.45);if(st.phase==='pull'&&pull>=1){st.phase='hold';const r=st.res;st.res=null;r&&r();}}
   cam=camNow;boff=btgt=0;
  }else if(rest){const u=Math.min(1,(now-rest.t0)/rest.ms),e=travelEase(u);cam=passCam(rest.c0+(rest.c1-rest.c0)*e,u,RH,H,RM);doorsPassed(cam,now);if(u>=1){const f=rest.done;rest=null;f&&f();}camNow=cam;boff=btgt=0;}
  else{pass.idle();boff=RM||Math.abs(btgt-boff)<.5?btgt:boff+(btgt-boff)*Math.min(1,rdt*14);camNow=cam+boff+(RM||boff?0:Math.sin(vt*.5)*1.5);}
  if(Math.abs(camNow-prevCam)>.1){movedAt=now;prevCam=camNow;}
  {const b=btgt<-4;if(b!==wasB){wasB=b;browseCb&&browseCb(b);}}
  if(st||rest){atticGoal=0;if(atticT){atticT=0;atticCb&&atticCb(false);}}
  const aFloor=-5*RH,aMax=restCam(0)-(aFloor-(H-40)); // camera climb that puts the attic floor just above the bottom edge
  if(atticT!==atticGoal){atticT=RM?atticGoal:clamp(atticT+(atticGoal>atticT?1:-1)*rdt/.95,0,1);if(Math.abs(atticT-atticGoal)<1e-4)atticT=atticGoal;}
  if(atticGoal===0)atticSGoal=0;
  atticA=Math.round(H-40);
  { /* moving along the room: eased toward the goal row; a pause settles it on the nearest whole row */
   const mx=Math.max(0,rowsN()-1);
   if(!RM&&atticSGoal!==atticS&&atticSAt&&now-atticSAt>240&&atticGoal===1){const g=clamp(Math.round(atticSGoal),0,mx);if(g!==atticSGoal)atticSGoal=g;}
   if(atticS!==atticSGoal){atticS=RM?atticSGoal:atticS+(atticSGoal-atticS)*(1-Math.exp(-rdt*6));if(Math.abs(atticSGoal-atticS)<.004)atticS=atticSGoal;}
   const si=Math.round(atticS);if(si!==atticSecI){atticSecI=si;atticSCb&&atticSCb(si,mx+1,rowTitle(atticItems,W,si));}
  }
  const atticY=atticT>0?ease(atticT)*aMax:0;camNow-=atticY;
  if(atticMove&&(atticY!==atticYLast)){atticYLast=atticY;atticMove(atticY,ease(atticT));}
  lastCam=camNow;
  const rowB=(camNow+H-RH-BM)/RH,atm=atmosphereAt(Math.max(0,rowB)),a=Math.max(clamp(rowB/190,0,1),atm.decay);
  if(onDepth)onDepth(Math.max(0,Math.round(rowB*FT)));Sfx.setDepth(Math.max(0,rowB*FT));
  ctx.globalAlpha=1;ctx.fillStyle=PALETTE.oak0a0706;ctx.fillRect(0,0,W,H);
  // wall above shelf 0
  const top=Math.max(-5,Math.floor(camNow/RH)-1),bot=Math.ceil((camNow+H)/RH)+1;
  hits=[];
  // far silhouette layer
  pruneRows(top,bot);
  let tgt=null;
  if(Quality.params().backStacks){for(let r=top;r<=bot;r++){if(r===0)continue;const f=floorAtRow(r);let r2=r;while(r2+1<=bot&&r2+1!==0&&floorAtRow(r2+1)===f)r2++;drawBackStacks(ctx,f,{W,RH,DPR,cam:camNow,y0:r*RH-camNow-1,y1:(r2+1)*RH-camNow+1});r=r2;}} // dim far row of shelves behind the walls, slower than the camera
  for(let r=top;r<=bot;r++){const o=drawRow(r,0,camNow,1,1);if(st&&r===st.row)tgt=o;}
  if(atticT>0){const A=Math.round(H-40),k=W+'x'+A+'x'+DPR;if(!room||roomKey!==k){room=buildHall(W,A,DPR);roomKey=k;}
   hits=drawAttic(ctx,room,{W,A,ry:aFloor-camNow-A,items:atticItems,TIERS,vt,RM,lit:climbLight(atticT),H,scroll:atticS});if(atticS<1.2){ctx.save();ctx.globalAlpha=1-atticS/1.2;drawLadder(ctx,{W,H,fy:aFloor-camNow,t:ease(atticT)});ctx.restore();}}
  for(const [nr,nv] of niches)drawNiche(nr,nv,camNow,now);
  drawLoreGlows(top,bot,camNow);
  if(ledgeCb){const cn=niches.get(restRow);ledgeCb(!st&&!rest&&cn&&cn.hit&&cn.books?cn.hit:null,cn&&cn.books);}
  if(st){const n=nicheBox();drawLift(ctx,{W,H,cam:camNow,cam0:st.cam0,vt,geom:liftGeom(W,H,n.w),baseX:pullX(st.row),baseY:tgt?tgt.base:H*.7,env:liftEnvelope({phase:st.phase,u:st.prog,settle,pull,rm:RM,quality:Quality.params().name})});} // the brass lift: rope, pulley and cage ride the camera glide
  // pulled-out target
  if(st&&tgt){const T=TIERS[st.tier],e=pull*pull*(3-2*pull),bw=36,bh=RH*.82;const bx=pullX(st.row),by0=tgt.base; // seated in the gap genRow leaves in the target shelf, never floating above it
  const cy=H*.5;const px=bx+(W/2-bx)*e,py=by0+(cy+bh*.5*2.2-by0)*e;const s=1+1.3*e;
   if(settle>0){ctx.fillStyle=PALETTE.oak2;ctx.fillRect(bx-bw/2,by0-bh,bw,bh);}
   if(settle>0){ctx.save();ctx.globalCompositeOperation='lighter';const gg=ctx.createRadialGradient(bx,by0-bh/2,0,bx,by0-bh/2,bh*1.4);gg.addColorStop(0,T.spine+'bb');gg.addColorStop(1,T.spine+'00');ctx.globalAlpha=(.28+.35*T.id/6)*settle*(.85+.15*Math.sin(vt*5))*(1-e*.4);ctx.fillStyle=gg;ctx.fillRect(bx-bh*1.5,by0-bh*1.5,bh*3,bh*3);ctx.restore();}
   if(e>0){ // lifted off the shelf: it casts a soft shadow on the books behind, so it reads as held in front of them, not floating
    ctx.save();ctx.shadowColor=`rgba(0,0,0,${.6*e})`;ctx.shadowBlur=30*s*DPR;ctx.shadowOffsetX=-6000*DPR+8*e;ctx.shadowOffsetY=14*e*DPR;ctx.fillStyle='rgba(0,0,0,1)';ctx.fillRect(px-bw*s/2+6000,py-bh*s,bw*s,bh*s);ctx.restore();}
   const lg0=e>0?lecternGeom(px,py,bw,bh,s,RM?1:e):null;if(lg0)drawLecternBack(ctx,lg0,RM?1:Math.min(1,e*1.6)); // the stand rises with the pull; reduced motion shows it already raised
   ctx.save();ctx.translate(px,py);ctx.scale(s,s);bookArt(ctx,{w:bw,h:bh,tier:st.tier,seed:st.seed,word:st.word,held:true,ribbon:st.tier>=1?RIBBONS[st.tier%5]:null},vt);ctx.restore();
   if(lg0)drawLecternLip(ctx,lg0,RM?1:Math.min(1,e*1.6));}
  // darkness / lamp (shrinks with abandonment)
  const lx=W/2,ly=H*.5,lr=Math.hypot(W,H)*(.6-.2*a)*atm.lampR;
  {const aq=Math.round(a*48)/48;stampGlow(ctx,glowSprite(...lampGlow(aq)),lx,ly,lr);fillOutside(ctx,W,H,lx,ly,lr,`rgba(3,2,2,${.93+.06*aq})`);} // cached sprite, a quantised to 1/48
  // the floor's own air and tint (decay, dark, tint, fog, vignette, water light) never paints over an alcove
  const arects=alcoveRects(niches.keys(),nicheBox(),RH,H,BM,camNow);
  paintAroundAlcoves(ctx,W,H,arects,()=>{
  {const t=atm.tint,L=[]; // up to three flat veils (green decay, depth dark, floor tint) folded into one source-over fill
   if(a>0)L.push([14,34,30,.1*a]);if(atm.dark>.005)L.push([1,0,3,atm.dark]);if(t[3]>.005)L.push([t[0]|0,t[1]|0,t[2]|0,t[3]]);
   if(L.length){let ca=0,cr=0,cg=0,cb=0;for(const [r,g,b,al] of L){const na=al+ca*(1-al);cr=(r*al+cr*ca*(1-al))/na;cg=(g*al+cg*ca*(1-al))/na;cb=(b*al+cb*ca*(1-al))/na;ca=na;}
    ctx.fillStyle=`rgba(${cr|0},${cg|0},${cb|0},${ca})`;ctx.fillRect(0,0,W,H);}}
  drawFloorAtmosphere(ctx,W,H,atm,vt,lx,ly,RM);
  });
  ambItems=updateAmbient(dt,ambEnv(camNow,top,bot));drawAmbient(ctx,ambItems,vt,'body',atm.lamp);
  registerCandleLight(vt,RM); // the run candle is a real light (ui/candleLight.js)
  drawLighting(ctx,{W,H,atm,t:vt,lx,ly,rects:arects,still:RM,tier:Quality.params().name}); // deeper floors: only lit pools stay readable
  drawEyes(ctx,{W,H,atm,sc:reach(atm),rects:arects,top:barPx()+40,bottom:RH+BM+60,still:RM,ambient:Quality.params().ambient,t:vt,dt,camDy:camNow-eyeCam});eyeCam=camNow; // something in the dark (ui/eyes.js)
  ctx.globalCompositeOperation='lighter';
  if(!RM){flickT-=dt;if(flickT<=0){flickT=.06+Math.random()*.3;flickV=(Math.random()-.5)*(Math.random()<.12?2.2:1);}flick+=(flickV-flick)*Math.min(1,dt*9);}
  const fl=(.1-.03*a)+.02*Math.sin(vt*13)+.012*Math.sin(vt*31)+.03*flick*atm.flick;
  {const l=atm.lamp.map(v=>v|0),c=`${l[0]},${l[1]+6},${l[2]+10}`;stampGlow(ctx,glowSprite(...flameGlow(c)),lx,ly,Math.max(W,H)*.45,Math.max(0,fl));}
  drawCandleGlow(ctx,vt,RM,Quality.params().name);
  if(st){const zi=st.prog>=1?st.tier:Math.min(st.tier,tierOf(st.prog*st.score));const zc=TIERS[zi].spine;ctx.globalAlpha=.5+.5*settle;stampGlow(ctx,glowSprite(...tierGlow(zc)),lx,ly,Math.max(W,H)*.6);ctx.globalAlpha=1;gaugeCb&&gaugeCb(zi,st);}
  if(!RM){ // dust batched: 8 alpha buckets, one path and fill each, instead of a style string and fill per mote
   const dm=Math.max(W,H)*.45,bk=dustB;for(const b of bk)b.length=0;
   for(let di=0,dn=Math.min(dust.length,Quality.params().dust);di<dn;di++){const p=dust[di];p.y-=dt*(5+p.z*14);p.x+=Math.sin(vt*.6+p.ph)*dt*8;const yy=((p.y+camNow*(.25+p.z*.5))%H+H)%H,xx=(p.x%W+W)%W;const dist=Math.hypot(xx-lx,yy-ly)/dm;const al=Math.max(0,1-dist)*(.15+.5*Math.abs(Math.sin(vt*1.3+p.ph)))*(.7+a);const k=Math.min(7,al*9|0);if(al>.01)bk[k].push(xx,yy,p.r*(.6+p.z));}
   for(let k=0;k<8;k++){const b=bk[k];if(!b.length)continue;ctx.fillStyle=DUST_STYLE[k];ctx.beginPath();for(let i=0;i<b.length;i+=3){ctx.moveTo(b[i]+b[i+2],b[i+1]);ctx.arc(b[i],b[i+1],b[i+2],0,6.3);}ctx.fill();}}
  if(!RM)drawMoths(lx,ly,a,dt);
  drawAmbient(ctx,ambItems,vt,'glow',atm.lamp);
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
 const dustB=Array.from({length:8},()=>[]),DUST_STYLE=Array.from({length:8},(_,k)=>`rgba(255,226,170,${((k+.5)/9).toFixed(3)})`);
 for(let i=0;i<100;i++)dust.push({x:Math.random()*5000,y:Math.random()*3000,z:Math.random(),r:.8+Math.random()*1.6,ph:Math.random()*6});
 addEventListener('resize',resize);Quality.subscribe(resize);resize();requestAnimationFrame(frame);
 cv.addEventListener('pointerdown',e=>{if(st)st.skip=true;});
 return{
  setShelf(b){shelf=b;},hits:()=>hits,
  /* the attic: a room above the top shelves. setAttic(true) climbs into it from home. */
  setAtticItems(l){atticItems=l||[];atticSGoal=clamp(atticSGoal,0,Math.max(0,rowsN()-1));},
  /* how many rows the attic has, and which one you are at */
  get atticRows(){return rowsN();},
  get atticRow(){return Math.round(atticSGoal);},
  atticRowTitle(i){return rowTitle(atticItems,W,i);},
  onAtticRow(f){atticSCb=f;},
  /* move along the room by `n` rows (fractions from a wheel). Returns false when already at the first row and settled,
     so the caller can leave the attic. */
  atticGo(n){if(atticGoal!==1)return false;
   if(atticT<1)return true; // still climbing in: no row changes until the attic is fully in (swallowed, so the caller does nothing)
   const mx=Math.max(0,rowsN()-1),cur=Math.round(atticSGoal),g=clamp(cur+(n<0?-1:1),0,mx);
   if(g===cur)return false; // already at the end of the room in that direction
   if(Math.abs(atticS-atticSGoal)>.3)return true; // still gliding to the last row: one row per move
   atticSGoal=g;atticSAt=performance.now();return true;},
  get atticReady(){return atticGoal===1&&atticT>=1;},
  atticStep(n){return World.atticGo(n);},
  get canAttic(){return !st&&!rest&&restRow===0;},
  get atticOpen(){return atticGoal===1;},
  onAttic(f){atticCb=f;},
  onAtticMove(f){atticMove=f;}, // f(px,t): the camera climb in px and eased progress, each frame it changes, so DOM can ride with the world
  setAttic(open,{instant}={}){if(open&&!(!st&&!rest&&restRow===0))return;const g=open?1:0;if(g===atticGoal&&!instant)return;atticGoal=g;if(instant||RM)atticT=g;atticCb&&atticCb(!!g);},
  // the lore book under a screen point, if any: {row, book}
  loreAt(x,y){const r=Math.floor((y+lastCam)/RH),b=hitLoreBook(rows.get(r*2),r,RH,W,lastCam,abn(r),x,y,(b,base)=>loreCovered(b,base,lastCam));return b?{row:r,book:b}:null;},curioAt(x,y){const r=Math.floor((y+lastCam)/RH),b=hitCurio(rows.get(r*2),r,RH,W,lastCam,abn(r),x,y,(b,base)=>loreCovered(b,base,lastCam));return b?{row:r,book:b}:null;},get shelfVisible(){return shelfVisible;},get restRow(){return restRow;},get busy(){return !!st||!!rest;},
  reset(){resetAmbient();rows.clear();taken.clear();niches.clear();restRow=0;st=null;rest=null;cam=restCam(0);},
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
  ascend(){return new Promise(res=>{const c0=cam,c1=restCam(0),dist=Math.abs(c0-c1)/RH;let off=()=>{};const fin=()=>{off();restRow=0;res();};rest={t0:performance.now(),ms:ascendMs(dist,RM),c0,c1,done:fin};const skip=e=>{if(rest&&rest.done===fin&&(e.type!=='keydown'||!e.repeat))rest.t0=-1e9;};addEventListener('keydown',skip);addEventListener('pointerdown',skip);off=()=>{removeEventListener('keydown',skip);removeEventListener('pointerdown',skip);};});},
  get stActive(){return !!st;},get descending(){return !!st&&st.phase!=='hold';}
 };})();
