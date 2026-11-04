/* The sky seen through the attic window. Pure: skyAt(date) reads the visitor's local clock and calendar and returns
   the band of the day (dawn, day, dusk, night), the season, a weather kind and the colours to tint the window and
   its shaft of light. Weather is not fetched (no network, no location): it is picked from the local date so it
   holds all day and varies by season: rain in spring and autumn, snow in winter, mostly clear in summer.
   drawSky paints the overlay; it does nothing when reduced motion or low quality asks for a still, plain window. */

const hash=n=>{let s=(n^0x9e3779b9)>>>0;s=Math.imul(s^s>>>16,2246822507)>>>0;s=Math.imul(s^s>>>13,3266489909)>>>0;return((s^s>>>16)>>>0)/4294967296;};

export const BANDS={dawn:{from:5,to:8},day:{from:8,to:17},dusk:{from:17,to:20}}; // local hours; the rest is night
export function bandAt(hour){
 const h=((hour%24)+24)%24;
 for(const k of Object.keys(BANDS))if(h>=BANDS[k].from&&h<BANDS[k].to)return k;
 return'night';
}
/* Northern-hemisphere meteorological seasons by month index (0 = Jan). */
export const seasonAt=m=>m===11||m<2?'winter':m<5?'spring':m<8?'summer':'autumn';

const TINT={dawn:[255,176,128],day:[255,243,201],dusk:[255,118,70],night:[120,150,230]};
const GLOW={dawn:.8,day:1,dusk:.7,night:.34};
const WET={spring:.34,summer:.12,autumn:.4,winter:.38};

export function weatherAt(date){
 const season=seasonAt(date.getMonth()),day=date.getFullYear()*372+date.getMonth()*31+date.getDate();
 const r=hash(day),p=WET[season];
 if(r>=p)return'clear';
 return season==='winter'?'snow':'rain';
}

export function skyAt(date=new Date()){
 const band=bandAt(date.getHours()),season=seasonAt(date.getMonth()),weather=weatherAt(date);
 const t=TINT[band].slice(),wet=weather!=='clear';
 if(wet)for(let k=0;k<3;k++)t[k]=Math.round(t[k]*.55+120*.45); // overcast greys the colour
 return{band,season,weather,tint:t,glow:GLOW[band]*(wet?.7:1)};
}

/* Streaks are a pure function of time so tests can pin them. Returns {x,y,len} in 0..1 window space. */
export function precipAt(kind,n,vt){
 const out=[];
 for(let k=0;k<n;k++){
  const sp=kind==='snow'?.07:.55,u=(vt*sp+hash(k*7+1))%1,x=((hash(k*13+5)+(kind==='snow'?Math.sin(vt*.7+k)*.04:u*.08))%1+1)%1;
  out.push({x,y:u,len:kind==='snow'?0:.12});
 }
 return out;
}

/* Paint over the window and its shaft. win: {x,y,r} in screen space (y already offset), shaft bottom at y+A. */
export function drawSky(ctx,{win,ry,A,W,vt,lit,sky,RM,low}){
 if(RM||low||!sky)return;
 const [r,g,b]=sky.tint,wy=ry+win.y,col=a=>`rgba(${r},${g},${b},${a})`;
 ctx.save();
 /* tinted glass: replaces the pale disc, then the frame bars are redrawn on top */
 ctx.beginPath();ctx.arc(win.x,wy,win.r,0,6.3);ctx.clip();
 ctx.fillStyle=sky.band==='night'?'rgb(14,20,44)':col(.92);ctx.fillRect(win.x-win.r,wy-win.r,win.r*2,win.r*2);
 if(sky.band==='night'){ctx.fillStyle='rgba(235,240,255,.9)';ctx.beginPath();ctx.arc(win.x+win.r*.3,wy-win.r*.25,win.r*.16,0,6.3);ctx.fill();}
 if(sky.weather!=='clear'){
  const n=sky.weather==='snow'?26:34;ctx.strokeStyle=sky.weather==='snow'?'rgba(240,244,255,.85)':'rgba(205,220,240,.6)';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1;
  for(const p of precipAt(sky.weather,n,vt)){const x=win.x-win.r+p.x*win.r*2,y=wy-win.r+p.y*win.r*2;
   if(sky.weather==='snow'){ctx.beginPath();ctx.arc(x,y,1.2,0,6.3);ctx.fill();}
   else{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-win.r*.03,y+win.r*p.len*2);ctx.stroke();}}
 }
 ctx.restore();
 ctx.save();ctx.strokeStyle='rgb(58,40,22)';ctx.lineCap='round';
 ctx.lineWidth=Math.max(3,win.r*.18);ctx.beginPath();ctx.arc(win.x,wy,win.r,0,6.3);ctx.stroke();
 ctx.lineWidth=Math.max(2,win.r*.12);ctx.beginPath();ctx.moveTo(win.x-win.r,wy);ctx.lineTo(win.x+win.r,wy);ctx.moveTo(win.x,wy-win.r);ctx.lineTo(win.x,wy+win.r);ctx.stroke();
 ctx.restore();
 /* the shaft: recoloured over the warm one, and dimmed at night */
 const sg=ctx.createLinearGradient(0,wy,0,ry+A);sg.addColorStop(0,col(.2*sky.glow*lit));sg.addColorStop(1,col(0));
 ctx.save();ctx.globalCompositeOperation=sky.band==='night'?'source-over':'lighter';ctx.fillStyle=sg;
 ctx.beginPath();ctx.moveTo(win.x-win.r*.8,wy);ctx.lineTo(win.x+win.r*.8,wy);ctx.lineTo(win.x+win.r*2.6+W*.05,ry+A);ctx.lineTo(win.x-win.r*2.6-W*.05,ry+A);ctx.closePath();ctx.fill();
 if(sky.band==='night'){ctx.fillStyle=`rgba(4,6,16,${.3*lit})`;ctx.fill();}
 ctx.restore();
 /* a few streaks falling through the shaft */
 if(sky.weather!=='clear'){
  ctx.save();ctx.globalAlpha=.35*lit;ctx.strokeStyle=sky.weather==='snow'?'#f0f4ff':'#cddcf0';ctx.fillStyle=ctx.strokeStyle;
  for(const p of precipAt(sky.weather,sky.weather==='snow'?14:18,vt+3)){
   const y=wy+p.y*(A-win.y),sp=(y-wy)/(A-win.y),x=win.x+(p.x-.5)*win.r*(1.6+sp*5.2);
   if(sky.weather==='snow'){ctx.beginPath();ctx.arc(x,y,1.5,0,6.3);ctx.fill();}else{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y+12);ctx.stroke();}}
  ctx.restore();
 }
}
