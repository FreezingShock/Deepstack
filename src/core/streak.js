/* Streaks derived from the saved Daily results (S.daily keys, UTC days), so they cannot drift out of sync with them.
   S.streak ({last,n}) is still written for older readers but is no longer the source of truth. */
const DAY=864e5;
const dayMs=k=>Date.parse(k+'T00:00:00Z');
const prevKey=k=>new Date(dayMs(k)-DAY).toISOString().slice(0,10);
const valid=k=>typeof k==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(k)&&!isNaN(dayMs(k));

/* Days in a row ending today, or ending yesterday if today is not played yet. Future-dated keys (clock moved back) are ignored. */
export function currentStreak(keys,today){
  const set=new Set((keys||[]).filter(k=>valid(k)&&k<=today));
  let k=set.has(today)?today:prevKey(today);
  let n=0;
  while(set.has(k)){n++;k=prevKey(k);}
  return n;
}
/* The key a finished run is filed under: the day it started, so a run that crosses UTC midnight still counts for its own Daily. */
export const runDay=(run,now)=>run&&run.day||now;
/* Fold a finished Daily into S without overwriting an existing result (one attempt per day). Returns false if one was already recorded. */
export function recordDaily(S,day,d){
  S.daily=S.daily||{};
  if(S.daily[day])return false;
  S.daily[day]=d;
  const n=currentStreak(Object.keys(S.daily),day);
  S.streak={last:day,n};
  return true;
}
