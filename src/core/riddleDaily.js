/* Today's riddle: the Riddle Shelf seeded by UTC date. Same seven words for everyone, one attempt a day.
   Results live in S.riddle.days[dayKey] (additive), with a streak derived from those keys. Pure helpers, tested without the canvas. */
import {WORDS} from './words.js';
import {pickWord} from './level.js';
import {rampTargets,pickRampWord} from './difficulty.js';
import {hashStr,mulberry,dailyWords,dailyNumber} from './daily.js';
import {currentStreak} from './streak.js';

export const RIDDLE_DAY_WORDS=7;

/** The seven definitions for a day, easiest to hardest. Seeded apart from the Daily and never repeating its words that day. */
export function dailyRiddleWords(dateStr,n=RIDDLE_DAY_WORDS){
  const rng=mulberry(hashStr('deepstack-riddle-'+dateStr));
  const used=new Set(dailyWords(dateStr,n).map(w=>w.id)),out=[];
  for(const target of rampTargets(n)){
    const w=pickRampWord(WORDS,target,used,out.map(x=>x.w),rng)||pickWord(target,used,rng);
    used.add(w.id);out.push(w);
  }
  return out.sort((a,b)=>a.d-b.d);
}

/** The saved result for a day, or null. Tolerates a missing or damaged S.riddle. */
export function riddleDay(S,day){
  const d=S&&S.riddle&&S.riddle.days&&S.riddle.days[day];
  return d&&Array.isArray(d.books)&&d.books.length?d:null;
}
/** Files a finished day. One attempt: returns false and changes nothing if the day already has a result. */
export function recordRiddleDay(r,day,d){
  if(!r||typeof r!=='object')return false;
  r.days=r.days&&typeof r.days==='object'?r.days:{};
  if(r.days[day]&&r.days[day].books)return false;
  r.days[day]=d;return true;
}
export const riddleDayStreak=(r,today)=>currentStreak(Object.keys((r&&r.days)||{}),today);

/** Share text, no emojis: number, how many were solved, then the books as blocks. */
export function riddleDayShare(day,d,blocks='▁▂▃▄▅▆▇'){
  return `Deepstack Riddle No. ${dailyNumber(day)}\nSolved ${d.solved} of ${d.of} · depth ${d.depth} ft · average closeness ${d.avg}\n${d.books.map(b=>blocks[b.tier]).join('')}`;
}
