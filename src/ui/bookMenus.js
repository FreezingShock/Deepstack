/* Shelf and Stats as pages of an open book. Pure leaf builders are exported for tests; the open* functions wire
   them to the paged book view. Main passes in what it owns (spine renderer, card opener, tooltips). */
import {chunk,esc,toSpreads} from './bookpages.js';import {emptyBlock} from './emptyPages.js';

import {statsLeaves} from './statsPages.js';
export {statsLeaves};
import {penMark,penPlay} from './penInk.js';
import {foldGroups} from './shelfGroups.js';
import {BAY_MODES,bayGroups,pileEdges,ladderSide} from './shelfBays.js';
import {roomCounts} from '../core/shelfRooms.js';
import {ROOMS,rgbOf} from '../core/rooms.js';

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
   if(!sec){sec={label:g.label,sub:g.sub||'',count:g.items.length,key:g.key,cont:k>0,shelves:[]};cur.push(sec);left-=plaque;}
   sec.shelves.push(sh);left-=1;
  });
 }
 if(cur.length||!pages.length)pages.push(cur);
 return pages;
}
/* Collapse repeats: the same word in the same tier shows once, carrying a count. The first entry in the current
   sort order stands for the pile, so "Newest" shows the newest copy and "Closest" the best one. */
export function collapseDupes(list){
 const seen=new Map(),out=[];
 for(const x of list){
  const k=x.b.tier+'|'+String(x.b.w).toLowerCase(),r=seen.get(k);
  if(r)r.n++;else{const e={b:x.b,i:x.i,n:1};seen.set(k,e);out.push(e);}
 }
 return out;
}
/* Deterministic little sideways offset so a stack looks piled, not machined. */
export const stagger=w=>{let h=0;for(const c of String(w))h=(h*31+c.charCodeAt(0))>>>0;return (h%9)-4;};
export const TEXTURES=['leather','cloth','worn','vellum','grain'];


/* Book page registries for home.js BOOK_PAGES. */
export function statsBook({S,st,TIERS,FLOORS,floorStartFt}){
 return {label:'Stats',spreads:()=>toSpreads(statsLeaves(st(),S,{TIERS,FLOORS,floorStartFt}))};
}

let fTier=-1,fSort='new',fQ='',fFav=false,fGroup='tier',fRoom='';
export function shelfBook({S,core,TIERS,openCard,showTip,hideTip,keepOnEsc,FLOORS=[],reduceMotion=()=>false}){
 const SORTS=core.SORTS;
 let list=[],countText='';
 const book=(x)=>{const b=x.b,t=TIERS[b.tier],o=stagger(b.w);
  return `<button class="sbook" data-i="${x.i}" data-tex="${TEXTURES[b.tier%TEXTURES.length]}" style="--t:${t.spine};--o:${o}px;--e:${pileEdges(x.n)}" data-tip="${esc(b.w)}${x.n>1?` \u00d7${x.n}`:''} \u00b7 ${t.name} \u00b7 ${b.score}" aria-label="${esc(b.w)}, ${t.name}, ${b.score} out of 100${x.n>1?`, ${x.n} copies`:''}"><span class="sb-pages" aria-hidden="true"></span><span class="sb-spine"><i class="sb-band" aria-hidden="true"></i><span class="sb-t">${esc(b.w)}</span>${x.n>1?`<i class="sb-n" aria-hidden="true">\u00d7${x.n}</i>`:''}${b.fav?'<i class="sb-fav" aria-hidden="true">\u2605</i>':''}<i class="sb-band" aria-hidden="true"></i></span></button>`;};
 const stack=items=>`<div class="sstack">${items.map(book).join('')}</div>`;
 const shelf=items=>`<div class="sshelf">${chunk(items,STACK_H).filter(c=>c.length).map(stack).join('')}</div>`;
 /* room tabs (TR7): one per room you have books from, each dot in that room's fire colour; hidden until a second room has books */
 const roomChips=()=>{const rc=roomCounts(S.shelf),has=ROOMS.filter(r=>rc[r.id]);if(has.length<2&&!fRoom)return '';
  return `<div class="chipgroup"><div class="kicker">Room</div><div class="chips" role="group" aria-label="Room"><button class="fchip" data-r="" data-k="r" aria-pressed="${!fRoom}">All</button>${ROOMS.map(r=>`<button class="fchip" data-r="${r.id}" data-k="r${r.id}" aria-pressed="${fRoom===r.id}"${rc[r.id]?'':' disabled'}><i class="dot" style="background:rgb(${rgbOf(r)})"></i>${esc(r.short)} <small>${rc[r.id]}</small></button>`).join('')}</div></div>`;};
 const build=()=>{
  const all=core.filterShelf(S.shelf,{tier:fTier,q:fQ.trim().toLowerCase(),sort:fSort,fav:fFav,room:fRoom});
  list=collapseDupes(all);
  const groups=bayGroups(list,fGroup,{TIERS,FLOORS,floorStartFt:core.floorStartFt,dailyNumber:core.dailyNumber}),favN=S.shelf.filter(b=>b.fav).length;
  const counts=TIERS.map(t=>S.shelf.filter(b=>b.tier===t.id).length);
  const dupes=all.length-list.length;
  countText=`${S.shelf.length} ${S.shelf.length===1?'book':'books'}${all.length!==S.shelf.length?` \u00b7 showing ${all.length}`:''}${dupes?` \u00b7 ${list.length} different`:''}`;
  const ctrl=`<h1>Your shelf</h1><div class="kicker" data-count>${countText}</div>
   <input id="fq" type="search" placeholder="Find a word\u2026" value="${esc(fQ)}" aria-label="Find a word" autocomplete="off" spellcheck="false">
   <div class="chipgroup"><div class="kicker">Sort</div><div class="chips" role="group" aria-label="Sort">${Object.entries(SORTS).map(([k,v])=>`<button class="fchip" data-s="${k}" data-k="s${k}" aria-pressed="${fSort===k}">${v[0]}</button>`).join('')}</div></div>
   <div class="chipgroup"><div class="kicker">Bay</div><div class="chips" role="group" aria-label="Shelve by">${BAY_MODES.map(([k,l])=>`<button class="fchip" data-g="${k}" data-k="g${k}" aria-pressed="${fGroup===k}">${l}</button>`).join('')}</div></div>
   <div class="chipgroup"><div class="kicker">Show</div><div class="chips"><button class="fchip" id="ffav" data-k="fav" aria-pressed="${fFav}"${favN||fFav?'':' disabled'}>\u2605 Favourites <small>${favN}</small></button></div></div>
   ${roomChips()}
   <div class="chipgroup"><div class="kicker">Rarity</div><div class="chips"><button class="fchip" data-t="-1" data-k="t-1" aria-pressed="${fTier<0}">All</button>${TIERS.map(t=>`<button class="fchip" data-t="${t.id}" data-k="t${t.id}" aria-pressed="${fTier===t.id}"${counts[t.id]?'':' disabled'}><i class="dot" style="background:${t.spine}"></i>${t.name} <small>${counts[t.id]}</small></button>`).join('')}</div></div>`;
  if(!list.length)return [ctrl,S.shelf.length?`${emptyBlock('slip','No book matches this find and these chips.','compact')}<p class="fclear-row"><button type="button" class="fchip" id="fclear">Clear the find and the chips</button></p>`:`<div class="empty-shelf"><svg viewBox="0 0 260 120" aria-hidden="true"><path d="M14 98 L246 97"/><path d="M14 106 L246 105"/><path d="M40 97 C39 70 41 52 40 40 L62 41 C63 60 62 80 62 96" stroke-dasharray="5 6"/><path d="M92 96 L148 94 M92 96 L92 82 L148 80 L148 94" stroke-dasharray="5 6"/><path d="M178 58 q16 -22 34 0" opacity=".6"/><path d="M195 74 v-10 m-5 5 l5 5 l5 -5" opacity=".6"/></svg><p class="empty">Nothing here yet. Your first answer becomes your first book.</p></div>`];
  if(!groups.length)return [ctrl,`<p class="empty">No book here has a floor yet. Earlier finds wait in the attic: close this book and scroll up on the home screen.</p>`];
  const pages=shelfPlan(groups).map(secs=>secs.map(s=>`<section class="ssec"><div class="splaque"><span>${esc(s.label)}${s.cont?' \u00b7 cont.':''}<b>${s.count}</b></span>${s.sub&&!s.cont?`<em>${esc(s.sub)}</em>`:''}</div><div class="scase"${ladderSide(s.key,s.shelves.length)?` data-lad="${ladderSide(s.key,s.shelves.length)}"`:''}>${s.shelves.map(shelf).join('')}</div></section>`).join(''));
  return [ctrl,...pages];
 };
 const bind=(root,ctl)=>{
  const redo=k=>{penMark(root,k);ctl.setSpreads(toSpreads(build()),0);};
  root.querySelectorAll('.fchip[data-t]').forEach(c=>c.onclick=()=>{fTier=+c.dataset.t;redo(c.dataset.k);});
  root.querySelectorAll('.fchip[data-s]').forEach(c=>c.onclick=()=>{fSort=c.dataset.s;redo(c.dataset.k);});
  root.querySelectorAll('.fchip[data-g]').forEach(c=>c.onclick=()=>{fGroup=c.dataset.g;redo(c.dataset.k);});
  root.querySelectorAll('.fchip[data-r]').forEach(c=>c.onclick=()=>{fRoom=c.dataset.r;redo(c.dataset.k);});
  const fav=root.querySelector('#ffav');if(fav)fav.onclick=()=>{fFav=!fFav;redo('fav');};
  const fc=root.querySelector('#fclear');if(fc)fc.onclick=()=>{fQ='';fTier=-1;fFav=false;fRoom='';ctl.setSpreads(toSpreads(build()),0);};
  const fq=root.querySelector('#fq');
  /* typing repaints only the results page; the search box and the rest of the left page stay untouched */
  if(fq)fq.oninput=()=>{fQ=fq.value;ctl.setSpreads(toSpreads(build()),0,'r');const c=root.querySelector('[data-count]');if(c)c.textContent=countText;};
  foldGroups(root);
  penPlay(root);
  root.querySelectorAll('.sbook').forEach(im=>{
   const open=()=>{hideTip();const pull=()=>{im.classList.remove('pulled');const items=list.map(x=>x.b),b=S.shelf[+im.dataset.i];openCard(b,{fresh:false,nav:{items,i:items.indexOf(b)}});};
    /* pull the book out of its stack first, then the card opens above the book */
    if(reduceMotion()){pull();return;}im.classList.add('pulled');setTimeout(pull,170);};
   im.onclick=open;
   im.onmouseenter=im.onmousemove=e=>showTip(im.dataset.tip,e.clientX,e.clientY);im.onmouseleave=hideTip;
  });
 };
 return {label:'Your shelf',keepOnEsc,spreads:()=>toSpreads(build()),onPaint:(sp,ctl)=>bind(sp,ctl)};
}
