/* Pure stats derived from saved state, so nothing extra has to be stored and old saves keep working.
   Daily results (S.daily) are never trimmed, unlike the shelf which is capped. */
const DAY=864e5;
const dayMs=k=>Date.parse(k+'T00:00:00Z');
export const dayKey=ms=>new Date(ms).toISOString().slice(0,10);

export function longestStreak(keys){
  const ds=[...new Set(keys)].map(dayMs).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
  let best=0,run=0,prev=null;
  for(const d of ds){run=prev!==null&&d-prev===DAY?run+1:1;prev=d;if(run>best)best=run;}
  return best;
}
/* A streak is only alive if the last daily was today or yesterday. */
export function liveStreak(streak,today){
  if(!streak||!streak.n)return 0;
  const gap=Math.round((dayMs(today)-dayMs(streak.last))/DAY);
  return gap<=1?streak.n:0;
}
export function computeStats(S,today){
  const keys=Object.keys(S.daily||{}).sort();
  const tiers=[0,0,0,0,0,0,0];
  let books=0,answered=0,sum=0,best=null,totalFt=0,deepest=S.bestDepth||0,deepestDay=null;
  for(const k of keys){
    const d=S.daily[k];
    if(d.depth>=deepest&&d.depth>0){deepest=d.depth;deepestDay=k;}
    for(const b of d.books||[]){
      books++;totalFt+=b.ft||0;
      if(b.answer===''&&b.score===0)continue; // skipped words are not counted as answers
      answered++;sum+=b.score;tiers[b.tier]++;
      if(!best||b.score>best.score)best={w:b.w,score:b.score,tier:b.tier,no:b.no};
    }
  }
  let rarest=-1;tiers.forEach((n,i)=>{if(n)rarest=i;});
  const streak=liveStreak(S.streak,today);
  return{
    runs:keys.length,books,answered,tiers,rarest,best,deepest,deepestDay,totalFt,
    avg:answered?Math.round(sum/answered):0,
    streak,bestStreak:Math.max(longestStreak(keys),S.streak&&S.streak.n||0),
    recent:keys.slice(-14).map(k=>({day:k,depth:S.daily[k].depth,avg:S.daily[k].avg,best:S.daily[k].best}))
  };
}
export function msUntilNextDaily(now=Date.now()){const t=new Date(now);return Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()+1)-now;}
export const fmtCountdown=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h}h ${String(m).padStart(2,'0')}m`:`${m}m ${String(s%60).padStart(2,'0')}s`;};
