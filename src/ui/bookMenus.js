/* Shelf and Stats as pages of an open book. Pure leaf builders are exported for tests; the open* functions wire
   them to the paged book view. Main passes in what it owns (spine renderer, card opener, tooltips). */
import {chunk,esc,toSpreads} from './bookpages.js';

export const SHELF_PER_PAGE=18;

/* Group entries -> pages. Each page is [{label,cont,items}] so a group that spills onto the next page repeats its heading. */
export function shelfPages(groups,per=SHELF_PER_PAGE){
 const flat=[];
 for(const g of groups)g.items.forEach(x=>flat.push({label:g.label,x}));
 return chunk(flat,per).map(pg=>{
  const secs=[];
  pg.forEach((e,k)=>{
   const last=secs[secs.length-1];
   if(last&&last.label===e.label)last.items.push(e.x);
   else secs.push({label:e.label,cont:k===0&&flat.indexOf(e)>0&&flat[flat.indexOf(e)-1].label===e.label,items:[e.x]});
  });
  return secs;
 });
}

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

let fTier=-1,fSort='new',fQ='',fFav=false,fGroup='none';
/* Shelf: page 1 holds the search and filters, the following pages hold the books. */
export function shelfBook({S,core,TIERS,spineImg,openCard,showTip,hideTip,rh=76,keepOnEsc}){
 const SORTS=core.SORTS;
 let list=[];
 const build=()=>{
  list=core.filterShelf(S.shelf,{tier:fTier,q:fQ.trim().toLowerCase(),sort:fSort,fav:fFav});
  const groups=core.groupShelf(list,fGroup,TIERS.map(t=>t.name)),favN=S.shelf.filter(b=>b.fav).length;
  const counts=TIERS.map(t=>S.shelf.filter(b=>b.tier===t.id).length);
  const ctrl=`<h1>Your shelf</h1><div class="kicker">${S.shelf.length} ${S.shelf.length===1?'book':'books'}${list.length!==S.shelf.length?` · showing ${list.length}`:''}</div>
   <input id="fq" type="search" placeholder="Find a word" value="${esc(fQ)}" aria-label="Find a word" autocomplete="off" spellcheck="false">
   <div class="chipgroup"><div class="kicker">Sort</div><div class="chips" role="group" aria-label="Sort">${Object.entries(SORTS).map(([k,v])=>`<button class="fchip" data-s="${k}" aria-pressed="${fSort===k}">${v[0]}</button>`).join('')}</div></div>
   <div class="chipgroup"><div class="kicker">Group</div><div class="chips" role="group" aria-label="Group by">${[['none','Flat'],['day','By day'],['tier','By tier']].map(([k,l])=>`<button class="fchip" data-g="${k}" aria-pressed="${fGroup===k}">${l}</button>`).join('')}</div></div>
   <div class="chipgroup"><div class="kicker">Show</div><div class="chips"><button class="fchip" id="ffav" aria-pressed="${fFav}"${favN||fFav?'':' disabled'}>★ Favourites <small>${favN}</small></button></div></div>
   <div class="chipgroup"><div class="kicker">Rarity</div><div class="chips"><button class="fchip" data-t="-1" aria-pressed="${fTier<0}">All</button>${TIERS.map(t=>`<button class="fchip" data-t="${t.id}" aria-pressed="${fTier===t.id}"${counts[t.id]?'':' disabled'}><i class="dot" style="background:${t.spine}"></i>${t.name} <small>${counts[t.id]}</small></button>`).join('')}</div></div>`;
  if(!list.length)return [ctrl,`<p class="empty">${S.shelf.length?'No book matches.':'Nothing here yet. Your first answer becomes your first book.'}</p>`];
  const pages=shelfPages(groups).map(secs=>secs.map(s=>`${s.label?`<h2>${esc(s.label)}${s.cont?' · cont.':''} <small>${s.items.length}</small></h2>`:''}<div class="shelfgrid" style="--rh:${rh+24}px">${s.items.map(x=>`<div class="slot">${spineImg(x.b,x.i,'shelf',rh)}</div>`).join('')}</div>`).join(''));
  return [ctrl,...pages];
 };
 const bind=(root,ctl)=>{
  const redo=()=>ctl.setSpreads(toSpreads(build()),0);
  root.querySelectorAll('.fchip[data-t]').forEach(c=>c.onclick=()=>{fTier=+c.dataset.t;redo();});
  root.querySelectorAll('.fchip[data-s]').forEach(c=>c.onclick=()=>{fSort=c.dataset.s;redo();});
  root.querySelectorAll('.fchip[data-g]').forEach(c=>c.onclick=()=>{fGroup=c.dataset.g;redo();});
  const fav=root.querySelector('#ffav');if(fav)fav.onclick=()=>{fFav=!fFav;redo();};
  const fq=root.querySelector('#fq');
  if(fq)fq.oninput=()=>{fQ=fq.value;const pos=fq.selectionStart;redo();const n=root.querySelector('#fq');if(n){n.focus();n.setSelectionRange(pos,pos);}};
  root.querySelectorAll('.shelfgrid img').forEach(im=>{
   const open=()=>{hideTip();const items=list.map(x=>x.b),b=S.shelf[+im.dataset.i];openCard(b,{fresh:false,nav:{items,i:items.indexOf(b)}});};
   im.tabIndex=0;im.setAttribute('role','button');im.onclick=open;
   im.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();open();}};
   im.onmouseenter=im.onmousemove=e=>showTip(im.dataset.tip,e.clientX,e.clientY);im.onmouseleave=hideTip;
  });
 };
 return {label:'Your shelf',keepOnEsc,spreads:()=>toSpreads(build()),onPaint:(sp,ctl)=>bind(sp,ctl)};
}
