/* The Ember Log: the book behind the Librarian's Card's Streak row. Left page: current and best streak, Dailies
   played and the next milestone stamp. Right page: five weeks of days, played ones inked in ember. Built from
   existing saves (S.daily) and UTC day keys only, so it adds no saved fields. Pure, exported for tests. */
import {esc} from './bookpages.js';
import {dayState} from './dailyCalendar.js';

export const MILESTONES=[3,7,14,30,100];
const DAY=864e5,pad=n=>String(n).padStart(2,'0');
const keyOf=ms=>{const d=new Date(ms);return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;};
const msOf=k=>Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10));
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const short=k=>`${MON[+k.slice(5,7)-1]} ${+k.slice(8,10)}`;

/** Next stamp above the streak (or the best streak when nothing is lit), or null once all are earned. */
export const nextMilestone=n=>MILESTONES.find(m=>m>n)??null;

/** 35 day keys: the five Sunday-first weeks ending with the week that holds `today`. */
export function fiveWeeks(today){
 const t=msOf(today),end=t+(6-new Date(t).getUTCDay())*DAY;
 return Array.from({length:35},(_,i)=>keyOf(end-(34-i)*DAY));
}

export function streakLeaves(S,today,st){
 const n=st.streak||0,best=Math.max(st.bestStreak||0,n),next=nextMilestone(n);
 const days=fiveWeeks(today);
 const left=`<div class="alm emb"><h1>Ember Log</h1><div class="kicker">${n?`${n} ${n===1?'day':'days'} burning`:'The ember is out'}</div>
  <ul class="ledger"><li><span>Current streak</span><b>${n}</b></li><li><span>Best streak</span><b>${best}</b></li><li><span>${st.runs===1?'Daily played':'Dailies played'}</span><b>${st.runs||0}</b></li></ul>
  <p class="hand">${next?`Next stamp at ${next} days. ${next-n===1?'One':next-n} to go.`:'Every stamp is struck. The ember is yours.'}</p>
  ${next?`<div class="emb-bar" role="img" aria-label="${n} of ${next} days"><i style="--w:${Math.round(n/next*100)}%"></i></div>`:''}
  <p class="hand dim">${n?'Play today’s Daily to keep it lit.':'Play a Daily to light it.'}</p></div>`;
 const cells=days.map(k=>{const s=dayState(S,k,today);
  return `<div class="emb-d ${s}" title="${short(k)}"><span>${+k.slice(8,10)}</span></div>`;}).join('');
 const right=`<div class="alm emb"><h1>Last five weeks</h1><div class="kicker">${short(days[0])} to ${short(days[34])}</div>
  <div class="emb-cal" role="img" aria-label="Days played in the last five weeks">${['S','M','T','W','T','F','S'].map(l=>`<i>${l}</i>`).join('')}${cells}</div></div>`;
 return [left,right];
}
