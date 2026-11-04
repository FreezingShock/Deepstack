/* Shelf and Stats as pages of an open book. Pure leaf builders are exported for tests; the open* functions wire
   them to the paged book view. Main passes in what it owns (spine renderer, card opener, tooltips). */
import {chunk,esc,toSpreads} from './bookpages.js';

/* Shelf layout. Books lie flat in stacks (STACK_H high, STACKS_PER_SHELF side by side) on a wooden shelf; a labelled
   plaque heads each section. Pages fill by a height budget: a shelf costs 1, a plaque PLAQUE_COST. */
export const STACK_H=4,STACKS_PER_SHELF=2,PAGE_BUDGET=4.05,PLAQUE_COST=.35;
export function shelfPlan(groups,{perShelf=STACK_H*STACKS_PER_SHELF,budget=PAGE_BUDGET,plaque=PLAQUE_COST}={}){
 const pages=[];let cur=[],left=budget;
 const flush=()=>{pages.push(cur);cur=[];left=budget;};
 for(const g of groups){
  const shelves=chunk(g.items,perShelf).filter(x=>x.length);
  let sec=null;
  shelves.forEach((sh,k)=>{
   const need=sec?1:plaque+1;
   if(left<need-1e-9){flush();sec=null;}
   if(!sec){sec={label:g.label,cont:k>0,shelves:[]};cur.push(sec);left-=plaque;}
   sec.shelves.push(sh);left-=1;
  });
 }
 if(cur.length||!pages.length)pages.push(cur);
 return pages;
}
/* Deterministic little sideways offset so a stack looks piled, not machined. */
export const stagger=w=>{let h=0;for(const c of String(w))h=(h*31+c.charCodeAt(0))>>>0;return (h%9)-4;};
export const TEXTURES=['leather','cloth','worn','vellum','grain'];

const fmtDay=k=>new Date(k+'T00:00:00Z').toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'});

export function statsLeaves(st,S,{TIERS,FLOORS,floorStartFt}){
 if(!st.runs)return [`<h1>Stats</h1><p class="empty">Finish your first Daily and your numbers show up here: streak, deepest dive and every tier you have shelved.</p>`];
 const maxT=Math.max(1,...st.tiers),maxD=Math.max(1,...st.recent.map(r=>r.depth));
 const big=(n,l,sub)=>`<div class="big"><b>${n}</b><span>${l}</span>${sub?`<em>${sub}</em>`:''}</div>`;
 const reached=S.bestFloor||0;
 return [
  `<h1>Stats</h1><div class="kicker">Your records</div>
   <div class="bigs">${big(st.streak,'Day streak','best '+st.bestStreak)}${big(st.deepest+'<small> ft</small>','Deepest dive',st.deepestDay?fmtDay(st.deepestDay):'')}
   ${big(st.runs,st.runs===1?'Daily played':'Dailies played',st.totalFt.toLocaleString()+' ft in total')}${big(st.avg,'Avg closeness',st.answered+' answered')}</div>
   ${st.best?`<p class="bestbook">Closest answer: <b>${esc(st.best.w)}</b>, ${st.best.score}/100 · <span style="color:${TIERS[st.best.tier].spine}">${TIERS[st.best.tier].name}</span></p>`:''}`,
  `<h2 style="margin-top:0">Books by tier <small>${st.answered}</small></h2>
   <div class="tierbars">${TIERS.map(t=>`<div class="tb"><span>${t.name}</span><span class="track"><i style="width:${st.tiers[t.id]/maxT*100}%;background:${t.spine}"></i></span><b>${st.tiers[t.id]}</b></div>`).join('')}</div>
   <p class="note">${st.rarest>=0?`Rarest book so far: ${TIERS[st.rarest].name}.`:''} ${st.books-st.answered?`${st.books-st.answered} skipped.`:''}</p>`,
  `<h1>Recent descents</h1><div class="kicker">Last ${st.recent.length} ${st.recent.length===1?'daily':'dailies'}</div>
   <div class="recent" role="img" aria-label="Depth of your last ${st.recent.length} dailies">${st.recent.map(r=>`<div class="rc" title="${fmtDay(r.day)}: ${r.depth} ft"><i style="height:${Math.max(6,r.depth/maxD*100)}%;background:${TIERS[r.best].spine}"></i><span>${r.day.slice(8)}</span></div>`).join('')}</div>
   <p class="note">Bars are depth in feet, coloured by your rarest book that day.</p>`,
  `<h2 style="margin-top:0">Floors of the library</h2>
   <ul class="floors">${FLOORS.map(f=>`<li class="${f.id>reached?'locked':''}"><span class="ft">${floorStartFt(f)} ft</span><b>${f.id>reached?'Undiscovered':esc(f.name)}</b>${f.id>reached?'':`<small>${esc(f.sub)}</small>`}</li>`).join('')}</ul>`
 ];
}

/* Book page registries for home.js BOOK_PAGES. */
export function statsBook({S,st,TIERS,FLOORS,floorStartFt}){
 return {label:'Stats',spreads:()=>toSpreads(statsLeaves(st(),S,{TIERS,FLOORS,floorStartFt}))};
}

let pen='',fTier=-1,fSort='new',fQ='',fFav=false,fGroup='tier';
export function shelfBook({S,core,TIERS,openCard,showTip,hideTip,keepOnEsc}){
 const SORTS=core.SORTS;
 let list=[],countText='';
 const book=(x)=>{const b=x.b,t=TIERS[b.tier],o=stagger(b.w);
  return `<button class="sbook" data-i="${x.i}" data-tex="${TEXTURES[b.tier%TEXTURES.length]}" style="--t:${t.spine};--o:${o}px" data-tip="${esc(b.w)} \u00b7 ${t.name} \u00b7 ${b.score}" aria-label="${esc(b.w)}, ${t.name}, ${b.score} out of 100"><span class="sb-pages" aria-hidden="true"></span><span class="sb-spine"><i class="sb-band" aria-hidden="true"></i><span class="sb-t">${esc(b.w)}</span>${b.fav?'<i class="sb-fav" aria-hidden="true">\u2605</i>':''}<i class="sb-band" aria-hidden="true"></i></span></button>`;};
 const stack=items=>`<div class="sstack">${items.map(book).join('')}</div>`;
 const shelf=items=>`<div class="sshelf">${chunk(items,STACK_H).filter(c=>c.length).map(stack).join('')}</div>`;
 const build=()=>{
  list=core.filterShelf(S.shelf,{tier:fTier,q:fQ.trim().toLowerCase(),sort:fSort,fav:fFav});
  const groups=core.groupShelf(list,fGroup,TIERS.map(t=>t.name)),favN=S.shelf.filter(b=>b.fav).length;
  if(fGroup==='tier')groups.sort((a,b)=>b.key-a.key);
  if(fGroup==='none')groups.forEach(g=>{g.label='The collection';});
  const counts=TIERS.map(t=>S.shelf.filter(b=>b.tier===t.id).length);
  countText=`${S.shelf.length} ${S.shelf.length===1?'book':'books'}${list.length!==S.shelf.length?` \u00b7 showing ${list.length}`:''}`;
  const ctrl=`<h1>Your shelf</h1><div class="kicker" data-count>${countText}</div>
   <input id="fq" type="search" placeholder="Find a word\u2026" value="${esc(fQ)}" aria-label="Find a word" autocomplete="off" spellcheck="false">
   <div class="chipgroup"><div class="kicker">Sort</div><div class="chips" role="group" aria-label="Sort">${Object.entries(SORTS).map(([k,v])=>`<button class="fchip" data-s="${k}" data-k="s${k}" aria-pressed="${fSort===k}">${v[0]}</button>`).join('')}</div></div>
   <div class="chipgroup"><div class="kicker">Group</div><div class="chips" role="group" aria-label="Group by">${[['tier','By rarity'],['day','By day'],['none','Together']].map(([k,l])=>`<button class="fchip" data-g="${k}" data-k="g${k}" aria-pressed="${fGroup===k}">${l}</button>`).join('')}</div></div>
   <div class="chipgroup"><div class="kicker">Show</div><div class="chips"><button class="fchip" id="ffav" data-k="fav" aria-pressed="${fFav}"${favN||fFav?'':' disabled'}>\u2605 Favourites <small>${favN}</small></button></div></div>
   <div class="chipgroup"><div class="kicker">Rarity</div><div class="chips"><button class="fchip" data-t="-1" data-k="t-1" aria-pressed="${fTier<0}">All</button>${TIERS.map(t=>`<button class="fchip" data-t="${t.id}" data-k="t${t.id}" aria-pressed="${fTier===t.id}"${counts[t.id]?'':' disabled'}><i class="dot" style="background:${t.spine}"></i>${t.name} <small>${counts[t.id]}</small></button>`).join('')}</div></div>`;
  if(!list.length)return [ctrl,`<p class="empty">${S.shelf.length?'No book matches.':'Nothing here yet. Your first answer becomes your first book.'}</p>`];
  const pages=shelfPlan(groups).map(secs=>secs.map(s=>`<section class="ssec"><div class="splaque"><span>${esc(s.label)}${s.cont?' \u00b7 cont.':''}</span></div><div class="scase">${s.shelves.map(shelf).join('')}</div></section>`).join(''));
  return [ctrl,...pages];
 };
 const bind=(root,ctl)=>{
  const redo=k=>{pen=k||'';ctl.setSpreads(toSpreads(build()),0);};
  root.querySelectorAll('.fchip[data-t]').forEach(c=>c.onclick=()=>{fTier=+c.dataset.t;redo(c.dataset.k);});
  root.querySelectorAll('.fchip[data-s]').forEach(c=>c.onclick=()=>{fSort=c.dataset.s;redo(c.dataset.k);});
  root.querySelectorAll('.fchip[data-g]').forEach(c=>c.onclick=()=>{fGroup=c.dataset.g;redo(c.dataset.k);});
  const fav=root.querySelector('#ffav');if(fav)fav.onclick=()=>{fFav=!fFav;redo('fav');};
  const fq=root.querySelector('#fq');
  /* typing repaints only the results page; the search box and the rest of the left page stay untouched */
  if(fq)fq.oninput=()=>{fQ=fq.value;ctl.setSpreads(toSpreads(build()),0,'r');const c=root.querySelector('[data-count]');if(c)c.textContent=countText;};
  if(pen){const c=root.querySelector(`[data-k="${pen}"]`);if(c)c.classList.add('pen');pen='';}
  root.querySelectorAll('.sbook').forEach(im=>{
   const open=()=>{hideTip();const items=list.map(x=>x.b),b=S.shelf[+im.dataset.i];openCard(b,{fresh:false,nav:{items,i:items.indexOf(b)}});};
   im.onclick=open;
   im.onmouseenter=im.onmousemove=e=>showTip(im.dataset.tip,e.clientX,e.clientY);im.onmouseleave=hideTip;
  });
 };
 return {label:'Your shelf',keepOnEsc,spreads:()=>toSpreads(build()),onPaint:(sp,ctl)=>bind(sp,ctl)};
}
