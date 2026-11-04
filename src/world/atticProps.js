/* Attic clutter: static props painted once into the room canvas (trunks, a rug, a sheeted dress form, a roof hatch
   with a ladder) and the swaying hanging lantern drawn each frame. Everything stands at the edges and on the far
   floor so the book piles (drawn afterwards, on top) keep the middle of the room. Pure geometry is exported for tests. */

const rgb=(r,g,b,a=1)=>`rgba(${r|0},${g|0},${b|0},${a})`;

/* unit scale for props: small on phones, capped on wide screens */
export const propUnit=W=>Math.min(1.25,Math.max(.55,W/1100+.2));
/* lantern swing angle (radians): a slow pendulum, still when motion is reduced or the device is on low quality */
export function swayAngle(vt,{RM=false,glow=true}={}){return RM||!glow?0:.07*Math.sin(vt*1.1)+.02*Math.sin(vt*2.3+1);}
/* where the lantern hangs: pivot on the collar beam, lantern body at the end of a 41px cord */
export function lanternPos(W,ry,A,EAVE,ang){const px=W*.7,py=ry+A*EAVE*.55+5,L=41;return{px,py,x:px+Math.sin(ang)*L,y:py+Math.cos(ang)*L};}

function trunk(c,x,y,w,h,rot,tone){
 c.save();c.translate(x,y);c.rotate(rot);
 c.fillStyle=rgb(0,0,0,.45);c.beginPath();c.ellipse(0,1,w*.58,h*.16,0,0,6.3);c.fill();
 const body=c.createLinearGradient(0,-h,0,0);body.addColorStop(0,rgb(96*tone,64*tone,34*tone));body.addColorStop(1,rgb(48*tone,31*tone,17*tone));
 c.fillStyle=body;c.fillRect(-w/2,-h*.7,w,h*.7);
 c.fillStyle=rgb(78*tone,52*tone,28*tone);c.beginPath();c.moveTo(-w/2,-h*.7);c.quadraticCurveTo(0,-h*1.28,w/2,-h*.7);c.closePath();c.fill();
 c.strokeStyle=rgb(14,9,5,.7);c.lineWidth=1;c.stroke();
 c.strokeStyle=rgb(20,14,8,.75);c.lineWidth=Math.max(2,w*.07);for(const sx of[-.3,.3]){c.beginPath();c.moveTo(sx*w,-h*.7);c.lineTo(sx*w,0);c.stroke();}
 c.strokeStyle=rgb(150,112,56,.8);c.lineWidth=Math.max(1,w*.02);c.beginPath();c.moveTo(-w/2,-h*.7);c.lineTo(w/2,-h*.7);c.stroke();
 c.fillStyle=rgb(190,148,70);for(const [cx,cy] of[[-w/2,0],[w/2,0],[-w/2,-h*.7],[w/2,-h*.7]])c.fillRect(cx-2.5,cy-6,5,6);
 c.fillRect(-3,-h*.7-3,6,8);
 c.restore();
}
function rug(c,x,y,w,h,lean){
 c.save();c.translate(x,y);c.rotate(lean);
 c.fillStyle=rgb(0,0,0,.4);c.beginPath();c.ellipse(0,1,w*.7,w*.18,0,0,6.3);c.fill();
 const g=c.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,rgb(70,24,22));g.addColorStop(.45,rgb(132,52,40));g.addColorStop(1,rgb(52,18,18));
 c.fillStyle=g;c.fillRect(-w/2,-h,w,h);
 const stripes=[[.18,rgb(214,174,96,.75)],[.5,rgb(30,44,64,.8)],[.82,rgb(214,174,96,.75)]];
 for(const [t,col] of stripes){c.fillStyle=col;c.fillRect(-w/2,-h*(1-t),w,Math.max(2,h*.035));}
 c.strokeStyle=rgb(228,214,170,.5);c.lineWidth=1;for(let k=0;k<6;k++){c.beginPath();c.moveTo(-w/2+w*k/6+2,-h);c.lineTo(-w/2+w*k/6+2,-h*.96);c.stroke();}
 c.fillStyle=rgb(92,34,28);c.beginPath();c.ellipse(0,-h,w/2,w*.17,0,0,6.3);c.fill();
 c.strokeStyle=rgb(214,174,96,.65);c.lineWidth=1.2;c.beginPath();c.ellipse(0,-h,w*.34,w*.11,0,0,6.3);c.stroke();c.beginPath();c.ellipse(0,-h,w*.16,w*.05,0,0,6.3);c.stroke();
 c.strokeStyle=rgb(210,196,150,.8);c.lineWidth=2;c.beginPath();c.moveTo(-w*.5,-h*.7);c.lineTo(w*.5,-h*.7);c.stroke();
 c.restore();
}
function dressForm(c,x,y,u){
 const h=128*u;
 c.fillStyle=rgb(0,0,0,.45);c.beginPath();c.ellipse(x,y+1,34*u,7*u,0,0,6.3);c.fill();
 c.strokeStyle=rgb(40,28,16);c.lineWidth=Math.max(2,3*u);c.beginPath();c.moveTo(x,y);c.lineTo(x,y-h*.7);
 c.moveTo(x-22*u,y);c.lineTo(x,y-14*u);c.lineTo(x+22*u,y);c.stroke();
 /* the sheet: a bell-shaped drape with a shoulder hump, folds and a shadow side */
 const top=y-h,sh=y-h*.88;
 const g=c.createLinearGradient(x-34*u,0,x+34*u,0);g.addColorStop(0,rgb(150,144,128));g.addColorStop(.5,rgb(206,200,180));g.addColorStop(1,rgb(96,92,80));
 c.fillStyle=g;c.beginPath();c.moveTo(x-5*u,top+8*u);c.quadraticCurveTo(x,top,x+5*u,top+8*u);
 c.quadraticCurveTo(x+26*u,sh-2*u,x+24*u,y-h*.56);c.quadraticCurveTo(x+34*u,y-h*.2,x+38*u,y-5*u);
 for(let k=0;k<5;k++){const bx=x+38*u-k*15.2*u;c.quadraticCurveTo(bx-4*u,y+(k%2?1:-4)*u,bx-7.6*u,y-3*u);}
 c.quadraticCurveTo(x-34*u,y-h*.2,x-24*u,y-h*.56);c.quadraticCurveTo(x-26*u,sh-2*u,x-5*u,top+8*u);c.closePath();c.fill();
 c.strokeStyle=rgb(70,66,56,.55);c.lineWidth=1;
 for(const f of[-.6,-.25,.15,.55]){c.beginPath();c.moveTo(x+f*8*u,y-h*.78);c.quadraticCurveTo(x+f*26*u,y-h*.4,x+f*36*u,y-3*u);c.stroke();}
 c.fillStyle=rgb(0,0,0,.18);c.fillRect(x+8*u,y-h*.75,30*u,h*.74);
}
function hatch(c,geo,W,A,u){
 /* a trap door in the left roof slope with a ladder hung down to the floor */
 const {P,eaveY}=geo,near=[P(0,eaveY,1),P(W/2,0,1)],far=[P(0,eaveY,.6),P(W/2,0,.6)];
 const at=(t,s)=>{const nx=near[0].x+(near[1].x-near[0].x)*t,ny=near[0].y+(near[1].y-near[0].y)*t,fx=far[0].x+(far[1].x-far[0].x)*t,fy=far[0].y+(far[1].y-far[0].y)*t;return{x:nx+(fx-nx)*s,y:ny+(fy-ny)*s};};
 const q=[at(.5,.25),at(.7,.25),at(.7,.55),at(.5,.55)];
 c.fillStyle=rgb(3,2,1);c.beginPath();q.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();
 c.strokeStyle=rgb(120,88,48,.9);c.lineWidth=Math.max(2,4*u);c.stroke();
 c.fillStyle=rgb(255,214,140,.07);c.fill();
 /* the door itself, propped open, a lighter plank edge */
 c.strokeStyle=rgb(92,64,34);c.lineWidth=Math.max(2,5*u);c.beginPath();c.moveTo(q[0].x,q[0].y);c.lineTo(q[1].x,q[1].y);c.stroke();
 /* ladder from the hatch's lower edge to the floor, leaning to the wall */
 const a=q[3],b=q[2],floorY=A*.9,off=Math.max(14,22*u),run=floorY-a.y,lean=(W*.2-a.x)*.2;
 for(const [p,dx] of[[a,0],[b,0]]){c.strokeStyle=rgb(64,44,24);c.lineWidth=Math.max(2,3.4*u);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+lean,floorY);c.stroke();}
 const n=Math.max(5,Math.round(run/(26*u)));c.strokeStyle=rgb(88,62,34);c.lineWidth=Math.max(1.5,2.4*u);
 for(let k=1;k<n;k++){const t=k/n,x1=a.x+lean*t,x2=b.x+lean*t,y=a.y+run*t;c.beginPath();c.moveTo(x1,y);c.lineTo(x2,y);c.stroke();}
 return off;
}
/* Paint every static prop into the room canvas c. */
export function paintProps(c,geo,W,A){
 const u=propUnit(W),yF=geo.floorBackY+(A-geo.floorBackY)*.14;
 hatch(c,geo,W,A,u);
 const phone=W<600,xl=Math.max(40*u,W*(phone?.11:.075));
 trunk(c,xl,yF+4*u,92*u,50*u,-.02,1);
 trunk(c,xl+3*u,yF+4*u-35*u,60*u,34*u,.04,.85);
 rug(c,xl+(phone?58:84)*u+W*.01,yF+2*u,28*u,92*u,.12);
 dressForm(c,W-Math.max(46*u,W*(phone?.115:.08)),yF+4*u,u);
}
/* The hanging lantern at the collar beam, swinging on its cord. Returns its centre so the glow can follow it. */
export function drawLantern(ctx,W,ry,A,EAVE,vt,quality){
 const ang=swayAngle(vt,quality),{px,py,x,y}=lanternPos(W,ry,A,EAVE,ang);
 ctx.strokeStyle=rgb(40,28,16);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(x,y-10);ctx.stroke();
 ctx.save();ctx.translate(x,y-10);ctx.rotate(ang*.6);
 ctx.fillStyle=rgb(255,214,130);ctx.fillRect(-5,0,10,16);ctx.strokeStyle=rgb(120,84,40);ctx.lineWidth=1.4;ctx.strokeRect(-5,0,10,16);
 ctx.restore();
 return{x,y};
}
