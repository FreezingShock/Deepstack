/* The climb into the attic made physical. The attic's hatch sits in the floor of the room and a ladder is fixed to it,
   so the ladder is anchored in the world: as the camera rises its rungs slide down past you, rung by rung. It slides in
   from the left edge at the start of the climb (and out again on the way back), and the light grows as you rise:
   the room starts dark and the skylight pours in as you reach it. Pure geometry (ladderGeom, climbLight) is exported
   for tests; drawLadder only paints. */
const rgb=(r,g,b,a=1)=>`rgba(${r|0},${g|0},${b|0},${a})`;
const sm=x=>{x=x<0?0:x>1?1:x;return x*x*(3-2*x);};

/* t: climb progress 0..1 (eased). fy: screen y of the attic floor line. */
export function ladderGeom(W,H,fy,t){
 const phone=W<600,rail=phone?4:5,gap=phone?22:28,sp=phone?28:34,stub=Math.min(H*.2,phone?96:150);
 const slide=sm(t/.22); // slides in over the first fifth of the climb, and out again over the last fifth of the way down
 const a=slide,x0=phone?8:Math.max(18,W*.035);
 const x=x0-(1-slide)*(gap+rail*2+40);
 const topY=fy-stub,rungs=[];
 for(let y=topY+sp*.5;y<H+sp;y+=sp)if(y>-sp)rungs.push(y);
 return{x,gap,rail,topY,bottom:H,rungs,alpha:a,slide,hatchY:fy,stub};
}
/* How lit the room is: dark as you leave the shelves, full once the skylight is overhead. */
export const climbLight=t=>sm(t);

export function drawLadder(ctx,{W,H,fy,t}){
 if(t<=0)return;
 const g=ladderGeom(W,H,fy,t);if(g.alpha<=0)return;
 const {x,gap,rail,topY,rungs}=g;
 ctx.save();ctx.globalAlpha=g.alpha;
 /* the hatch the ladder comes through: a dark opening in the floor boards */
 if(fy>-40&&fy<H+40){ctx.fillStyle=rgb(6,4,2,.9);ctx.fillRect(x-rail,fy-3,gap+rail*3,Math.min(12,Math.max(0,H-fy+3)));}
 const y0=Math.max(topY,-4);
 const rails=[x,x+gap];
 for(const rx of rails){
  const gr=ctx.createLinearGradient(rx,0,rx+rail,0);gr.addColorStop(0,rgb(96,68,38));gr.addColorStop(.5,rgb(70,48,26));gr.addColorStop(1,rgb(34,22,12));
  ctx.fillStyle=gr;ctx.fillRect(rx,y0,rail,H-y0);
  ctx.fillStyle=rgb(150,112,66,.35);ctx.fillRect(rx,y0,1.2,H-y0);
 }
 for(const y of rungs){if(y<topY+4)continue;
  ctx.fillStyle=rgb(0,0,0,.35);ctx.fillRect(x+rail,y+1.5,gap-rail,1.8);
  ctx.fillStyle=rgb(88,62,34);ctx.fillRect(x+rail,y-1.2,gap-rail,2.6);
  ctx.fillStyle=rgb(150,112,66,.45);ctx.fillRect(x+rail,y-1.2,gap-rail,1);
 }
 /* rail tops stand proud of the hatch */
 ctx.fillStyle=rgb(120,86,48);for(const rx of rails)ctx.fillRect(rx-1,y0-2,rail+2,4);
 ctx.restore();
}
