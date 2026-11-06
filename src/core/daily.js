import {pickWord} from './level.js';
import {WORDS,GHOSTS} from './words.js';
import {rampTargets, pickRampWord} from './difficulty.js';
import {roomSeed} from './roomPool.js';
/* ----- seeded daily ----- */
export function hashStr(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return (h>>>0);}
export function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// The generated word list tops out near difficulty 7 (rarer words are filtered out as unfamiliar),
// so the daily ramp ends there instead of at 7.6.
export const DAILY_SPAN=5;
/* Topic rooms (core/roomPool.js) narrow WORDS and add the room id to the seed; the Reading Room's seed is unchanged. */
export function dailyWords(dateStr,n,{pool=WORDS,ghosts=GHOSTS,seed=roomSeed()}={}){
 return seed?roomDaily(dateStr,n,pool,seed):rawDaily(dateStr,n,pool,ghosts,seed,new Set(),undefined);
}
function rawDaily(dateStr,n,pool,ghosts,seed,used,jitter){
 const rng=mulberry(hashStr('deepstack-'+seed+dateStr));const out=[];
 for(const target of rampTargets(n)){
  const w=pickRampWord(pool,target,used,out.map(x=>x.w),rng,jitter,ghosts)||pickWord(target,used,rng);
  used.add(w.id);out.push(w);
 }
 // Jitter can swap neighbours; keep the run strictly easiest-to-hardest.
 return out.sort((a,b)=>a.d-b.d);
}
/* Topic rooms are small, so their Dailies are scheduled forward from No. 1: a day never reuses a word from the last
   ROOM_GAP_MAX days (fewer when the pool is tiny), and the pick band is wider (ROOM_JITTER). Same day, same words for
   everyone, since every device replays the same schedule. The Reading Room is untouched. */
export const ROOM_JITTER=1.2,ROOM_GAP_MAX=14;
export const roomGap=(poolSize,n)=>Math.max(0,Math.min(ROOM_GAP_MAX,Math.floor(poolSize/n)-2));
const roomMemo=new Map();
function roomDaily(dateStr,n,pool,seed){
 const t0=Date.parse(DAILY_EPOCH),t=Date.parse(dateStr);
 if(!(t>t0))return rawDaily(dateStr,n,pool,[],seed,new Set(),ROOM_JITTER).sort((a,b)=>a.d-b.d);
 const key=seed+'|'+n+'|'+pool.length+'|'+(pool[0]&&pool[0].w)+'|'+(pool.at(-1)&&pool.at(-1).w);
 let m=roomMemo.get(key);if(!m){m=new Map();roomMemo.set(key,m);}
 const gap=roomGap(pool.length,n);let recent=[];
 for(let tt=t0;tt<=t;tt+=DAY_MS){
  const k=new Date(tt).toISOString().slice(0,10);
  let day=m.get(k);
  if(!day){const used=new Set();for(const d of recent)for(const w of d)used.add(w.id);day=rawDaily(k,n,pool,[],seed,used,ROOM_JITTER);m.set(k,day);}
  recent.push(day);if(recent.length>gap)recent.shift();
 }
 return m.get(dateStr)||rawDaily(dateStr,n,pool,[],seed,new Set(),ROOM_JITTER);
}
/* ----- daily numbering: No. 1 is 2026-11-03 (UTC), one number per UTC day ----- */
export const DAILY_EPOCH='2026-11-03';
const DAY_MS=864e5;
export const dailyNumber=key=>Math.floor((Date.parse(key)-Date.parse(DAILY_EPOCH))/DAY_MS)+1;
export const dailyKeyOf=no=>new Date(Date.parse(DAILY_EPOCH)+(no-1)*DAY_MS).toISOString().slice(0,10);
/* Every daily from No. 1 up to and including todayKey, oldest first (just today if the clock is before No. 1). */
export function dailyKeys(todayKey){
 const n=dailyNumber(todayKey);if(!(n>=1))return [todayKey];
 return Array.from({length:n},(_,i)=>dailyKeyOf(i+1));
}
