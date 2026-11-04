/* The streak mantel: an oak shelf above the Descend plaque, one candle per Daily in a row (up to 14), lit one after
   another when the home screen opens. A break leaves a single cold stub on the left, a ring of wax pooled round it.
   Pure model + markup (no DOM work), rebuilt with the home HTML so nothing leaks between renders. Look: mantel.css. */
export const MANTEL_MAX=14;

/* streak: live days in a row. played: how many Dailies were ever recorded (or the old save's best run when there is no history).
   Returns {lit, over, cold}: candles to light, days beyond the cap, and whether a cold stub stands there. */
export function mantelModel({streak=0,played=0}={}){
 const n=Math.max(0,Math.floor(+streak||0)),p=Math.max(0,Math.floor(+played||0));
 return{lit:Math.min(n,MANTEL_MAX),over:Math.max(0,n-MANTEL_MAX),cold:p>n};
}

/* Candle heights wander a little so the row never looks stamped: fixed by position, not random, so a render never jumps. */
const H=[30,24,33,27,22,31,26,34,23,29,32,25,28,35];
export const candleHeight=i=>H[i%H.length];

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function mantelLabel(m,streak){
 if(m.lit)return `Your streak: ${streak} ${streak===1?'day':'days'} in a row, ${Math.min(streak,MANTEL_MAX)} ${m.lit===1?'candle':'candles'} lit${m.cold?', one cold stub from an earlier break':''}`;
 return m.cold?'Your streak is broken: one cold candle stub':'No streak yet: play today’s Daily to light the first candle';
}

export function mantelHTML({streak=0,played=0}={}){
 const m=mantelModel({streak,played});
 const stub=m.cold?'<i class="mc mc-cold"><b class="mc-ring"></b><b class="mc-wax"></b><b class="mc-wick"></b></i>':'';
 /* a fresh, unlit candle waits at the left of an empty mantel */
 const fresh=!m.lit&&!m.cold?'<i class="mc mc-new" style="--h:30px"><b class="mc-wax"></b><b class="mc-wick"></b></i>':'';
 let lit='';
 for(let i=0;i<m.lit;i++)lit+=`<i class="mc mc-lit" style="--h:${candleHeight(i)}px;--i:${i};--r:${(i*37)%11}"><b class="mc-glow"></b><b class="mc-wax"></b><b class="mc-wick"></b><b class="mc-flame"></b></i>`;
 const plate=m.over?`<span class="mantel-plate">${esc(streak)} in a row</span>`:'';
 return `<div class="mantel" data-lit="${m.lit}" data-cold="${m.cold?1:0}" role="img" aria-label="${esc(mantelLabel(m,streak))}"><div class="mantel-row" aria-hidden="true">${stub}${fresh}${lit}</div><div class="mantel-beam" aria-hidden="true">${plate}</div></div>`;
}
