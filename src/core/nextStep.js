/* The way on after a run: which written next-step choices the final page offers, picked by state.
   Pure, so each state is tested without the canvas. `S` is the save, `d` the finished run record. */
import {currentStreak} from './streak.js';

const isSkip=b=>b.answer===''&&b.score===0;
export const MISSED_BELOW=30; // under Hardbound counts as a word to read again
export const MISSED_MAX=4;

/* Words worth another look: skipped first, then the lowest closeness. Each keeps its run index. */
export function missedWords(d){
  const out=[];
  ((d&&d.books)||[]).forEach((b,i)=>{if(isSkip(b)||b.score<MISSED_BELOW)out.push({...b,i});});
  out.sort((a,b)=>(isSkip(b)-isSkip(a))||a.score-b.score||a.i-b.i);
  return out.slice(0,MISSED_MAX);
}

/* -> [{id:'daily'|'unlimited'|'reread', text}] (two or three, most useful first).
   State: today's Daily unplayed (streak maybe at risk), or played. */
export function nextSteps(S,d,today){
  const played=!!(S.daily&&S.daily[today]);
  const streak=currentStreak(Object.keys(S.daily||{}),today);
  const out=[];
  if(!played){
    out.push({id:'daily',text:streak>0?`Keep your ${streak}-day streak: today's Daily`:"Today's Daily"});
    out.push({id:'unlimited',text:d&&d.mode==='unlimited'?'One more descent':'Descend on your own'});
  }else{
    out.push({id:'unlimited',text:d&&d.mode==='unlimited'&&!d.placing?'One more descent':'Descend on your own'});
  }
  if(missedWords(d).length)out.push({id:'reread',text:'Words to read again'});
  return out;
}
