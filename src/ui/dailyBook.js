/* The Daily book: a handwritten ledger of every daily from No. 1 to today. Pure leaf builders (tested) plus the
   registry entry for home.js BOOK_PAGES. Each day is a spread: the seven words and their definitions on the left,
   your results on the right (once played). Today's words stay sealed until you have played, so the book never
   spoils the puzzle. */
import {esc,chunk,toSpreads} from './bookpages.js';
import {BOOK_ACTS} from './home.js';
import {dailyKeys,dailyNumber,dailyWords} from '../core/daily.js';
import {TIERS} from '../core/tiers.js';
import {calendarLeaf,monthOf} from './dailyCalendar.js';
import {riddleDay,riddleDayStreak} from '../core/riddleDaily.js';

const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const parts=k=>{const d=new Date(k+'T00:00:00Z');return {y:d.getUTCFullYear(),m:d.getUTCMonth(),d:d.getUTCDate(),w:d.getUTCDay()};};
export const longDate=k=>{const p=parts(k);return `${DOW[p.w]}, ${p.d} ${MONTHS[p.m]} ${p.y}`;};
export const shortDate=k=>{const p=parts(k);return `${DOW[p.w].slice(0,3)} ${p.d} ${MONTHS[p.m].slice(0,3)}`;};
export const monthLabel=k=>{const p=parts(k);return `${MONTHS[p.m]} ${p.y}`;};

export const CONTENTS_PER_PAGE=12;

/* Month groups -> pages of at most `per` days; a month that spills onto the next page repeats its heading ("cont."). */
export function contentsPages(groups,per=CONTENTS_PER_PAGE){
 const flat=[];for(const g of groups)g.items.forEach((x,i)=>flat.push({label:g.label,x,first:i===0}));
 return chunk(flat,per).map(pg=>{const secs=[];
  pg.forEach((e,k)=>{const last=secs[secs.length-1];
   if(last&&last.label===e.label)last.items.push(e.x);else secs.push({label:e.label,cont:k===0&&!e.first,items:[e.x]});});
  return secs;});
}

/* What one day shows. words is null for today until it has been played (sealed). */
export function dayEntry(S,key,today,wordsFor=d=>dailyWords(d,7)){
 const rec=(S.daily||{})[key]||null,isToday=key===today;
 const played=!!(rec&&rec.books&&rec.books.length);
 let words=null;
 if(played)words=rec.books.map(b=>({w:b.w,pos:b.pos,def:b.def,score:b.score,tier:b.tier,answer:b.answer||'',skipped:!b.answer}));
 else if(!isToday)words=wordsFor(key).map(w=>({w:w.w,pos:w.pos,def:w.def}));
 return {key,no:dailyNumber(key),isToday,played,rec,words,riddle:riddleDay(S,key)};
}
export function dailyEntries(S,today,wordsFor){return dailyKeys(today).map(k=>dayEntry(S,k,today,wordsFor)).reverse();}

const status=e=>e.played?'Played':e.isToday?'Open today':'Missed';

const coverLeaf=(S,today,entries,streak)=>{
 const e=entries[0],played=entries.filter(x=>x.played).length;
 const rid=riddleDay(S,today),rs=riddleDayStreak(S&&S.riddle,today);
 return `<div class="dly"><div class="kicker">Ledger of descents · ${esc(longDate(today))}</div><h1>The Daily</h1>
  <section class="dly-sec" aria-label="Daily"><h2>Daily No. ${e.no}</h2>
   <p class="dly-line">${e.played?`Played today: ${e.rec.depth} ft down, average ${e.rec.avg}.`:'Explain seven words, sealed until you descend.'}</p>
   <p class="dly-tally"><span><b>${played}</b> of ${entries.length} played</span><span><b>${streak}</b> day streak</span></p>
   <button class="dly-act pen-ink" data-act="daily">${e.played?'See today’s result':'Descend'}</button></section>
  <section class="dly-sec" aria-label="Daily Riddle"><h2>Daily Riddle</h2>
   <p class="dly-line">${rid?`Solved ${rid.solved} of ${rid.of} today.`:'Seven definitions: write the word. One try a day.'}</p>
   <p class="dly-tally"><span><b>${rs}</b> day streak</span></p>
   <button class="dly-act pen-ink" data-act="dailyRiddle">${rid?'See today’s riddle result':'Open today’s riddle'}</button></section>
  <section class="dly-sec" aria-label="Practice"><h2>Practice</h2>
   <p class="dly-line">No pressure: nothing here touches your streak, shelf or rating.</p>
   <button class="dly-act pen-ink" data-act="practice">Start Practice</button></section></div>`;
};

/* Contents leaves: days newest first, under a heading for each month. startSpread is the spread of the first day. */
export function contentsLeaves(entries,startSpread){
 const groups=[];
 for(const e of entries){const l=monthLabel(e.key),g=groups[groups.length-1];if(g&&g.label===l)g.items.push(e);else groups.push({label:l,items:[e]});}
 const idx=new Map(entries.map((e,i)=>[e.key,startSpread+i]));
 return contentsPages(groups).map((secs,i)=>`<div class="dly">${i===0?'<h1>Contents</h1><div class="kicker">Newest first · tap a day to turn to it</div>':'<h1>Contents</h1><div class="kicker">continued</div>'}
  ${secs.map(s=>`<h2>${esc(s.label)}${s.cont?' · cont.':''}</h2><ul class="dly-toc">${s.items.map(e=>`<li><button class="dly-go pen-ink" data-spread="${idx.get(e.key)}"><span class="no">No. ${e.no}</span><span class="dt">${esc(shortDate(e.key))}${e.isToday?' · today':''}</span><i></i><b class="st ${e.played?'ok':e.isToday?'open':''}">${e.played?e.rec.avg+'/100':e.isToday?'sealed':'missed'}</b></button></li>`).join('')}</ul>`).join('')}</div>`);
}

const tierName=t=>(TIERS[t]||TIERS[0]).name;
const tierColor=t=>(TIERS[t]||TIERS[0]).spine;

/* The two leaves of a day: words and definitions, then results. */
export function dayLeaves(e){
 const [l,r]=baseDayLeaves(e);
 if(!e.riddle)return [l,r];
 return [l,r.replace(/<\/div>$/,`<section class="dly-sec" aria-label="Daily Riddle"><h2>Daily Riddle</h2><div class="dly-sum"><span><b>${e.riddle.solved}</b> of ${e.riddle.of} solved</span><span><b>${e.riddle.depth}</b> ft</span></div></section></div>`)];
}
function baseDayLeaves(e){
 const head=`<div class="kicker">${esc(monthLabel(e.key))} · ${esc(status(e))}</div><h1>No. ${e.no}</h1><div class="dly-date">${esc(longDate(e.key))}</div>`;
 if(!e.words){
  const left=`<div class="dly">${head}<ol class="dly-words sealed">${Array.from({length:7},(_,i)=>`<li><span class="w">· · · · ·</span><span class="d">sealed</span></li>`).join('')}</ol></div>`;
  const right=`<div class="dly"><h2>Results</h2><p class="dly-empty">Today’s seven words stay closed until you have descended. Come back after your run and they will be written in here, with how you did.</p></div>`;
  return [left,right];
 }
 const left=`<div class="dly">${head}<ol class="dly-words">${e.words.map(w=>`<li><span class="w">${esc(w.w)}${w.pos?` <small>${esc(w.pos)}</small>`:''}</span><span class="d">${esc(w.def)}</span></li>`).join('')}</ol></div>`;
 let right;
 if(e.played){
  const r=e.rec;
  right=`<div class="dly"><h2>Your results</h2>
   <div class="dly-sum"><span><b>${r.depth}</b> ft</span><span><b>${r.avg}</b> avg</span><span><b>${esc(tierName(r.best))}</b> rarest</span></div>
   <ol class="dly-res">${e.words.map(w=>`<li><div class="row"><span class="w">${esc(w.w)}</span><i class="dot" style="background:${tierColor(w.tier)}"></i><span class="t">${w.skipped?'skipped':esc(tierName(w.tier))}</span><b>${w.skipped?'—':w.score+'/100'}</b></div>${w.answer?`<div class="said">“${esc(w.answer)}”</div>`:''}</li>`).join('')}</ol></div>`;
 }else right=`<div class="dly"><h2>Results</h2><p class="dly-empty">You did not descend on this day. Its words are open here to read.</p></div>`;
 return [left,right];
}

export function dailyLeaves(S,today,{wordsFor,streak=0,month=monthOf(today)}={}){
 const entries=dailyEntries(S,today,wordsFor);
 /* cover + calendar + contents come first; pad to a whole spread so every day starts on a left page */
 const nContents=contentsLeaves(entries,0).length;
 let prefix=2+nContents;const pad=prefix%2;
 const start=(prefix+pad)/2;
 const spreadOf=new Map(entries.map((e,i)=>[e.key,start+i]));
 const lead=[coverLeaf(S,today,entries,streak),calendarLeaf(S,today,month,{spreadOf:k=>spreadOf.get(k),streak}),...contentsLeaves(entries,start)];
 if(pad)lead.push(`<div class="dly"><h2>Memoranda</h2><p class="dly-empty">Every day since No. 1 is written in this book, one spread to a day. Words you have not played are still readable once the day is over.</p></div>`);
 return {entries,start,leaves:[...lead,...entries.flatMap(dayLeaves)]};
}

/** Registry entry for home.js BOOK_PAGES. today() and streak() are read at open time. wordsReady re-lays the pages once the word list has loaded. */
export function dailyBook({S,today,streak=()=>0,wordsReady=null,wordsLoaded=()=>true}){
 let month=null;
 const build=()=>toSpreads(dailyLeaves(S,today(),{streak:streak(),month:month||monthOf(today())}).leaves);
 let waiting=false;
 return {label:'The Daily',spreads:()=>{month=null;return build();},onPaint:(sp,ctl)=>{
  sp.querySelectorAll('.dly-act[data-act]').forEach(b=>b.onclick=()=>{const a=BOOK_ACTS[b.dataset.act];a&&a();ctl.close();});
  sp.querySelectorAll('.dly-go,.cal-d[data-spread]').forEach(b=>b.onclick=()=>ctl.setSpreads(build(),+b.dataset.spread));
  sp.querySelectorAll('.cal-nav[data-month]').forEach(b=>b.onclick=()=>{month=b.dataset.month;ctl.setSpreads(build(),ctl.index);});
  if(wordsReady&&!wordsLoaded()&&!waiting){waiting=true;wordsReady.catch(()=>{}).then(()=>{waiting=false;ctl.setSpreads(build(),ctl.index);});}
 }};
}
