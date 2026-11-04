/* The Daily book's calendar page: a hand-drawn month grid. Days you played are circled in the ink of your rarest book
   that day; tapping a day turns to its spread. Built only from existing saves (S.daily) and the UTC day keys, so it
   adds no new saved fields. */
import {esc} from './bookpages.js';
import {dailyNumber,DAILY_EPOCH} from '../core/daily.js';
import {TIERS} from '../core/tiers.js';

const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const pad=n=>String(n).padStart(2,'0');
export const DOW_LETTERS=['S','M','T','W','T','F','S'];

/* "2026-11" for a day key, and the month either side of one. All UTC, so a player's local midnight never moves a day. */
export const monthOf=key=>key.slice(0,7);
export function shiftMonth(ym,by){
 const [y,m]=ym.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+by,1));
 return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}`;
}
export const monthTitle=ym=>{const [y,m]=ym.split('-').map(Number);return `${MONTHS[m-1]} ${y}`;};

/* Weeks (Sunday first) of day keys for a month; days outside the month are null. */
export function monthGrid(ym){
 const [y,m]=ym.split('-').map(Number);
 const first=new Date(Date.UTC(y,m-1,1)),lead=first.getUTCDay();
 const days=new Date(Date.UTC(y,m,0)).getUTCDate();
 const cells=[...Array(lead).fill(null),...Array.from({length:days},(_,i)=>`${ym}-${pad(i+1)}`)];
 while(cells.length%7)cells.push(null);
 const weeks=[];for(let i=0;i<cells.length;i+=7)weeks.push(cells.slice(i,i+7));
 return weeks;
}

/* Where a day sits: 'played', 'today', 'missed' (a past Daily you did not play), or 'none' (before No. 1 or in the future). */
export function dayState(S,key,today){
 if(key>today||key<DAILY_EPOCH)return 'none';
 const rec=(S.daily||{})[key];
 if(rec&&rec.books&&rec.books.length)return 'played';
 return key===today?'today':'missed';
}

const tierInk=t=>(TIERS[t]||TIERS[0]).spine;
const dayNum=key=>+key.slice(8);

function cell(S,key,today,spreadOf){
 if(!key)return '<span class="cal-d blank"></span>';
 const st=dayState(S,key,today),n=dayNum(key);
 if(st==='none')return `<span class="cal-d none">${n}</span>`;
 const rec=(S.daily||{})[key];
 const ink=st==='played'?` style="--ink-tier:${tierInk(rec.best)}"`:'';
 const lbl=`No. ${dailyNumber(key)}, ${key}${st==='played'?`, played, average ${rec.avg}`:st==='today'?', today':', not played'}`;
 return `<button class="cal-d ${st}" data-spread="${spreadOf(key)}" aria-label="${esc(lbl)}"${ink}>${n}</button>`;
}

/* The seven days ending today, as a strip: letter, number, and the day's average if played. */
export function weekStrip(S,today){
 const out=[];
 for(let i=6;i>=0;i--){
  const k=new Date(Date.parse(today+'T00:00:00Z')-i*864e5).toISOString().slice(0,10);
  const st=dayState(S,k,today),rec=(S.daily||{})[k];
  out.push({key:k,st,dow:DOW_LETTERS[new Date(k+'T00:00:00Z').getUTCDay()],n:dayNum(k),avg:st==='played'?rec.avg:null});
 }
 return out;
}

/* Margin note: the streak in the player's own hand. */
export function streakNote(streak){
 if(!streak)return 'No streak yet. Play today and it begins.';
 return streak===1?'1 day in a row. Keep it going.':`${streak} days in a row. Don’t break the chain.`;
}

/* The calendar leaf for month ym. spreadOf(key) gives the book spread of a day; canPrev/canNext bound the paging. */
export function calendarLeaf(S,today,ym,{spreadOf,streak=0}={}){
 const first=monthOf(DAILY_EPOCH),last=monthOf(today);
 const prev=ym>first,next=ym<last;
 const weeks=monthGrid(ym);
 const week=weekStrip(S,today);
 return `<div class="dly cal"><div class="kicker">Calendar · tap a day to turn to it</div>
  <div class="cal-head"><button class="cal-nav" data-month="${shiftMonth(ym,-1)}" aria-label="Previous month"${prev?'':' disabled'}>‹</button><h1>${esc(monthTitle(ym))}</h1><button class="cal-nav" data-month="${shiftMonth(ym,1)}" aria-label="Next month"${next?'':' disabled'}>›</button></div>
  <div class="cal-grid" role="group" aria-label="${esc(monthTitle(ym))}">${DOW_LETTERS.map(d=>`<span class="cal-dow">${d}</span>`).join('')}${weeks.flat().map(k=>cell(S,k,today,spreadOf)).join('')}</div>
  <div class="cal-week"><h2>This week</h2><div class="cal-strip">${week.map(d=>`<span class="cal-w ${d.st}"><i>${d.dow}</i><b>${d.n}</b><small>${d.avg==null?'':d.avg}</small></span>`).join('')}</div></div>
  <p class="cal-margin">${esc(streakNote(streak))}</p></div>`;
}
