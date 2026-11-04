/* A Daily in progress, saved after every word so quitting (or a reload) resumes where the player left off instead of
   handing out a fresh look at the same seven words. Lives in S.dailyRun (additive field): {day, results, combo, setBonus}.
   Pure helpers, so they can be tested without the canvas. */
export function snapshotRun(run){
  return {day:run.day,results:run.results.map(r=>({...r})),combo:run.combo||0,setBonus:run.setBonus||0};
}
/* The saved run to resume for `day`, or null. Ignores another day's run, a finished Daily, and anything malformed. */
export function resumable(S,day,wordCount){
  const r=S&&S.dailyRun;
  if(!r||r.day!==day||(S.daily&&S.daily[day]))return null;
  if(!Array.isArray(r.results)||!r.results.length||r.results.length>wordCount)return null;
  return {results:r.results,combo:Number(r.combo)||0,setBonus:Number(r.setBonus)||0};
}
