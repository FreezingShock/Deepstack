import {PALETTE} from '../theme/colors.js';
import {Feel} from '../feel.js';
import {$,RM} from './util.js';
import {TIERS} from './state.js';
import {createRevealFx} from '../ui/revealFx.js';

/* ---------- particles: pooled + prewarmed engine in src/ui/revealFx.js; per-tier recipes in src/ui/revealRecipes.js ---------- */
const E=createRevealFx({canvas:$('#fx'),tiers:TIERS,palette:PALETTE,feel:Feel,reduced:RM});
E.warmIdle(); // sprites for every tier, one tier per idle slice, so the first reveal has nothing left to set up
const R=(a,b)=>a+Math.random()*(b-a);
export const FX={
 warm:t=>E.warm(t), // call with the coming tier as soon as it is known (answer sent), before the reveal
 reveal:(x,y,t)=>E.reveal(x,y,t),
 settle:(x,y,t)=>E.settle(x,y,t),
 land:(x,y,t)=>E.land(x,y,t),
 burst:(x,y,t)=>E.land(x,y,t), // legacy name
 ember(x,y){E.spark(x,y,R(-26,26),R(-80,-30),-30,R(.7,1.4),R(.9,1.9),PALETTE.amber68);},
 puff(x,y,w,h,n){for(let i=0;i<n;i++)E.spark(x+Math.random()*w,y+Math.random()*h,R(-30,30),R(-140,-40),-20,R(.5,1),R(1,2.4),Math.random()<.5?PALETTE.amberFfd58a:PALETTE.amber89);},
 stats:E
};
