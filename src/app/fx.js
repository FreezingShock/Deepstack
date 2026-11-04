import {PALETTE} from '../theme/colors.js';
import {Feel} from '../feel.js';
import {particleVisibility} from '../ui/particleMask.js';
import {$,RM} from './util.js';
import {TIERS} from './state.js';

/* ---------- particles ---------- */
export const FX=(()=>{const cv=$('#fx'),c=cv.getContext('2d');let W=0,H=0,DPR=1,ps=[],on=false,last=0;
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
