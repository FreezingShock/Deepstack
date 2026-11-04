import {pickWord} from './level.js';
/* ----- seeded daily ----- */
export function hashStr(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return (h>>>0);}
export function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// The generated word list tops out near difficulty 7 (rarer words are filtered out as unfamiliar),
// so the daily ramp ends there instead of at 7.6.
export const DAILY_SPAN=5;
export function dailyWords(dateStr,n){
 const rng=mulberry(hashStr('deepstack-'+dateStr));const used=new Set(),out=[];
 for(let i=0;i<n;i++){const target=2+i*(DAILY_SPAN/(n-1));const w=pickWord(target,used,rng);used.add(w.id);out.push(w);}
 return out;
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
