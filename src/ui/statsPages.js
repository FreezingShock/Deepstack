/* Stats as an almanac: four hand-kept pages built from saves that already exist (dailies, S.rating.hist, the shelf).
   Pure string builders so they test without a DOM; styles live in statsPages.css under .alm inside the menu book. */
import {esc} from './bookpages.js';
import {emptyBlock} from './emptyPages.js';

const fmtDay=k=>new Date(k+'T00:00:00Z').toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'});
/* tiny deterministic wobble so every line looks drawn, never ruled */
const wob=(i,amp=1.2)=>Math.sin(i*12.9898)*amp;
const r1=n=>Math.round(n*10)/10;

export const TALLY_CAP=60;
/** Ink tally marks for a streak: bundles of four strokes struck through by a fifth. One mark per day, capped. */
export function tallyMarks(n){
 const shown=Math.min(Math.max(0,n|0),TALLY_CAP);
 const out=[];
 for(let left=shown,g=0;left>0;g++){
  const k=Math.min(5,left);left-=k;
  const strokes=Math.min(k,4);
  let s='';
  for(let i=0;i<strokes;i++){const x=6+i*7+wob(g*5+i,.7);s+=`<line class="tl" x1="${r1(x)}" y1="${r1(4+wob(i+g,1))}" x2="${r1(x+wob(i+2,1.1))}" y2="${r1(34+wob(i+g*3,1))}"/>`;}
  if(k===5)s+=`<line class="tl" x1="1" y1="30" x2="38" y2="8"/>`;
  out.push(`<svg class="tally-g" viewBox="0 0 40 38" width="40" height="38" aria-hidden="true" focusable="false" data-n="${k}">${s}</svg>`);
 }
 return {html:out.join(''),shown,over:Math.max(0,(n|0)-TALLY_CAP)};
}

/** Lexicon history as a pen-drawn line. Returns '' when there is nothing to plot. */
export function lexiconChart(hist){
 const h=(Array.isArray(hist)?hist:[]).filter(p=>p&&isFinite(p.lex)).slice(-60);
 if(!h.length)return '';
 const W=300,H=170,L=30,R=8,T=10,B=22;
 const lo=Math.max(0,Math.floor(Math.min(...h.map(p=>p.lex))/10)*10-10),hi=Math.min(100,Math.max(lo+20,Math.ceil(Math.max(...h.map(p=>p.lex))/10)*10+10));
 const x=i=>h.length===1?L+(W-L-R)/2:L+i*(W-L-R)/(h.length-1);
 const y=v=>T+(1-(v-lo)/(hi-lo))*(H-T-B);
 const pts=h.map((p,i)=>[r1(x(i)+wob(i,.6)),r1(y(p.lex)+wob(i+7,.8))]);
 const d=pts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');
 const grid=[lo,(lo+hi)/2,hi].map(v=>`<line class="gr" x1="${L}" x2="${W-R}" y1="${r1(y(v))}" y2="${r1(y(v))}"/><text class="ax" x="${L-5}" y="${r1(y(v)+3)}" text-anchor="end">${Math.round(v)}</text>`).join('');
 const dots=h.length<=24?pts.map(p=>`<circle class="dt" cx="${p[0]}" cy="${p[1]}" r="2.2"/>`).join(''):`<circle class="dt" cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="3"/>`;
 return `<svg class="lexchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Lexicon over your last ${h.length} ${h.length===1?'run':'runs'}: from ${h[0].lex} to ${h[h.length-1].lex}" data-points="${h.length}">${grid}${h.length>1?`<path class="ln" pathLength="1" d="${d}"/>`:''}${dots}<text class="ax" x="${L}" y="${H-5}">oldest</text><text class="ax" x="${W-R}" y="${H-5}" text-anchor="end">latest</text></svg>`;
}

/** Columns of lying books, one per tier. Taller piles draw proportionally once the biggest passes MAXROWS. */
export const MAXROWS=14;
export function spineColumns(counts,TIERS){
 const mx=Math.max(1,...counts),scale=mx>MAXROWS?MAXROWS/mx:1;
 return `<div class="spines" role="img" aria-label="Books shelved by tier">${TIERS.map(t=>{
  const n=counts[t.id]||0,rows=n?Math.max(1,Math.round(n*scale)):0;
  let s='';for(let i=0;i<rows;i++)s+=`<i style="background:${t.spine};--o:${((i*7+t.id*3)%5)-2}px"></i>`;
  return `<div class="sp-col" title="${esc(t.name)}: ${n}"><b>${n}</b><div class="sp-pile">${s}</div></div>`;
 }).join('')}</div>`;
}

/** Cross-section of the library: equal strata per floor with a pen marker where your deepest dive reached. */
export function crossSection(FLOORS,floorStartFt,deepest,reached){
 const n=FLOORS.length;
 let pos=0;
 FLOORS.forEach((f,i)=>{
  const a=floorStartFt(f),next=FLOORS[i+1],b=next?floorStartFt(next):a+300;
  if(deepest>=a)pos=i+Math.min(1,(deepest-a)/(b-a||1));
 });
 const strata=FLOORS.map(f=>{const lock=f.id>reached;
  return `<li class="${lock?'locked':''}" style="--k:${f.id}"><span class="ft">${floorStartFt(f)} ft</span><b>${lock?'Undiscovered':esc(f.name)}</b>${lock?'':`<small>${esc(f.sub)}</small>`}</li>`;}).join('');
 const mark=deepest>0?`<div class="xs-mark" style="top:${r1(pos/n*100)}%"><span>${deepest} ft</span></div>`:'';
 return `<div class="xs"><ol class="floors" aria-label="Floors of the library">${strata}</ol>${mark}</div>`;
}

export function statsLeaves(st,S,{TIERS,FLOORS,floorStartFt}){
 const hist=(S&&S.rating&&S.rating.hist)||[],shelf=(S&&S.shelf)||[];
 if(!st.runs&&!hist.length&&!shelf.length)return [`<div class="alm"><h1>The Almanac</h1><div class="kicker">Not yet opened</div>${emptyBlock('ledger','Finish your first Daily and the almanac fills in.')}</div>`,
  `<div class="alm"><h1>The Depths</h1><div class="kicker">A cross-section, down to 0 ft</div>${crossSection(FLOORS,floorStartFt,0,(S&&S.bestFloor)||0)}</div>`];
 const tally=tallyMarks(st.streak||0);
 const line=(l,v,sub)=>`<li><span>${l}</span><b>${v}</b>${sub?`<em>${sub}</em>`:''}</li>`;
 const counts=shelf.length?TIERS.map(t=>shelf.filter(b=>b.tier===t.id).length):(st.tiers||[]);
 const total=counts.reduce((a,b)=>a+b,0);
 const rarest=counts.reduce((r,n,i)=>n?i:r,-1);
 const maxD=Math.max(1,...(st.recent||[]).map(r=>r.depth));
 const reached=(S&&S.bestFloor)||0;
 const lex=hist.length?hist[hist.length-1].lex:null;
 return [
  `<div class="alm"><h1>The Almanac</h1><div class="kicker">Kept by hand</div>
   <h2>The streak</h2>
   <div class="tally" role="img" aria-label="${st.streak} day streak">${tally.html||'<span class="hand dim">No days inked yet.</span>'}${tally.over?`<span class="hand dim">+${tally.over} more</span>`:''}</div>
   <p class="hand">${st.streak} ${st.streak===1?'day':'days'} running, best ${st.bestStreak}.</p>
   <ul class="ledger">${line('Deepest dive',st.deepest+' ft',st.deepestDay?fmtDay(st.deepestDay):'')}${line(st.runs===1?'Daily played':'Dailies played',st.runs,(st.totalFt||0).toLocaleString()+' ft in total')}${line('Average closeness',st.avg,st.answered+' answered')}</ul>
   ${st.best?`<p class="bestbook">Closest answer: <b>${esc(st.best.w)}</b>, ${st.best.score}/100 · <span style="color:${TIERS[st.best.tier].spine}">${TIERS[st.best.tier].name}</span></p>`:''}</div>`,
  `<div class="alm"><h1>The Lexicon</h1><div class="kicker">${lex===null?'Unrated':'Now '+lex+' · '+hist.length+(hist.length===1?' run':' runs')}</div>
   ${hist.length?lexiconChart(hist):'<p class="empty hand">Not rated yet.</p><p class="note">Finish an Unlimited placement and your Lexicon is charted here, run by run.</p>'}
   <h2>Recent descents</h2>
   ${(st.recent||[]).length?`<div class="recent" role="img" aria-label="Depth of your last ${st.recent.length} dailies">${st.recent.map(r=>`<div class="rc" title="${fmtDay(r.day)}: ${r.depth} ft"><i style="height:${Math.max(6,r.depth/maxD*100)}%;background:${TIERS[r.best].spine}"></i><span>${r.day.slice(8)}</span></div>`).join('')}</div><p class="note">Depth in feet, coloured by your rarest book that day.</p>`:'<p class="empty hand">No descents yet.</p>'}</div>`,
  `<div class="alm"><h1>The Collection</h1><div class="kicker">${total} ${total===1?'book':'books'} shelved</div>
   ${total?spineColumns(counts,TIERS)+`<ul class="legend">${TIERS.map(t=>`<li><i class="dot" style="background:${t.spine}"></i><span>${esc(t.name)}</span><b>${counts[t.id]||0}</b></li>`).join('')}</ul>
   <p class="note">${rarest>=0?`Rarest book so far: ${esc(TIERS[rarest].name)}.`:''} ${st.books-st.answered>0?`${st.books-st.answered} skipped.`:''}</p>`:'<p class="empty hand">Nothing shelved yet.</p><p class="note">Your first answer becomes your first book.</p>'}</div>`,
  `<div class="alm"><h1>The Depths</h1><div class="kicker">A cross-section, down to ${st.deepest||0} ft</div>${crossSection(FLOORS,floorStartFt,st.deepest||0,reached)}</div>`
 ];
}
