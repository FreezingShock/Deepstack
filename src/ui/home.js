import {PALETTE} from '../theme/colors.js';
import {BOOK_TIMING,bookTimings,dressBook,thud,bookSound} from './bookOpenFx.js';
import {decorate as inkPage} from './ink.js';
import {RIBBON_HTML,ribbonKey,remember,recall,ribbonTarget,paintRibbon} from './bookRibbon.js';
import {cornersHTML,paintEdges,noteTurned,hintCurl} from './pageFlip.js';
/* Home screen markup. Kept separate from main.js so other features can add
   entries (modes, links) by pushing onto HOME_LINKS / HOME_STEPS without
   touching the layout. */

export const HOME_STEPS=[
 {n:1,h:'Explain',p:'Say what the word means, in your own words.'},
 {n:2,h:'Be judged',p:'Scored on how close you get.'},
 {n:3,h:'Descend',p:'Every answer becomes a book, and better ones sink deeper.'},
];

/* Secondary entries, drawn as books lying sideways in a stack. id becomes the
   button id; color picks the leather (HOME_BOOK_COLORS). Other features can push
   onto HOME_LINKS. Layout, hover and open animation live in home.css (--bk-* vars). */
export const HOME_BOOK_COLORS={
 red:[PALETTE.bookRed,PALETTE.bookRedDk,PALETTE.bronze51],
 green:[PALETTE.bookGreen,PALETTE.bookGreenDk,PALETTE.brass62],
 blue:[PALETTE.bookBlue,PALETTE.bookBlueDk,PALETTE.brass62],
 aqua:[PALETTE.bookAqua,PALETTE.bookAquaDk,PALETTE.brass62],
 purple:[PALETTE.bookPurple,PALETTE.bookPurpleDk,PALETTE.brass65],
 brown:[PALETTE.bookBrown,PALETTE.bookBrownDk,PALETTE.brass65],
};
/* stack: which pile the book lies in (0 = play modes, 1 = collection). */
export const HOME_LINKS=[
 {id:'bDaily',stack:0,tex:'grain',color:'blue',label:'Daily',note:'Every Daily, word by word',badge:(s,x)=>x.dailyNo?'No. '+x.dailyNo:''},
 {id:'bUnl',stack:0,color:'red',label:'Unlimited',note:'Adaptive words, rated',badge:(s,x)=>s.rating&&s.rating.placed?'Lexicon '+x.lexicon(s.rating.L):'placement'},
 {id:'bPrac',stack:0,tex:'cloth',color:'green',label:'Practice',note:'Same words, no pressure'},
 {id:'bAll',stack:1,tex:'worn',color:'aqua',label:'Shelf',note:'Every book you have earned',badge:s=>s.shelf.length||''},
 {id:'bSets',stack:1,tex:'vellum',color:'purple',label:'Sets',note:'Themed collections'},
 {id:'bStats',stack:1,tex:'grain',color:'brown',label:'Stats',note:'Streaks, depth and tiers'},
];

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

import {rulesCardHTML,ledgerHTML} from './welcome.js';
import {mantelHTML} from './mantel.js';
export function homeHTML({S,st,d,no,floorName,lexicon=()=>''}){
 const ctx={lexicon,dailyNo:no};
 const steps=HOME_STEPS.map(s=>`<li class="step"><span class="hn" aria-hidden="true">${s.n}</span><b>${esc(s.h)}</b><span>${esc(s.p)}</span></li>`).join('');
 /* library furniture built into the niche walls: a card-catalogue cabinet (rules) and the borrower's ledger (welcome.css) */
 const rules=rulesCardHTML(steps);
 const slip=ledgerHTML({streak:st.streak,deepest:st.deepest,books:S.shelf.length,floor:floorName||''});
 const book=l=>{const b=l.badge?l.badge(S,ctx):'';const c=HOME_BOOK_COLORS[l.color]||HOME_BOOK_COLORS.brown;
  return `<li><button class="hbook" data-tex="${l.tex||'leather'}" id="${l.id}"${l.note?` title="${esc(l.note)}"`:''} style="--bk:${c[0]};--bk2:${c[1]};--bk-gild:${c[2]}"><span class="hb-pages" aria-hidden="true"></span><span class="hb-spine"><i class="hb-band" aria-hidden="true"></i><span class="hb-t">${esc(l.label)}${b?` <small>${esc(b)}</small>`:''}</span><i class="hb-band" aria-hidden="true"></i></span></button></li>`;};
 const stacks=[...new Set(HOME_LINKS.map(l=>l.stack||0))].sort((a,b)=>a-b);
 const secs=stacks.map(n=>`<ul class="hshelf" data-stack="${n}">${HOME_LINKS.filter(l=>(l.stack||0)===n).map(book).join('')}</ul>`).join('');
 return `<div class="sheet home">
  <header class="hz hz-title"><h1 class="title wordmark">Deepstack</h1>
  <p class="tagline">Every word is a step into the dark.</p></header>
  <section class="hz hz-plaque" aria-label="Descend">${rules}${slip}${mantelHTML({streak:st.streak,played:Math.max(Object.keys(S.daily||{}).length,(S.streak&&S.streak.n)||0)})}${d?`<div class="row"><button class="btn pri big" id="bRes">Today’s result</button></div><p class="next" id="nextd"></p>`
     :`<div class="row"><button class="descend" id="bPlay"><i class="d-flame" aria-hidden="true"></i><span class="d-t">Descend</span><i class="d-chev" aria-hidden="true"></i></button></div><p class="next daily-tag">Daily No. ${no}</p>`}</section>
  <nav class="hz hsecs" aria-label="Menu books">${secs}</nav></div>`;
}


/* Books that open onto intro pages with a Start button instead of a menu. */
export const BOOK_INTROS={
 bUnl:{h:'Unlimited',kicker:'Rated descent',p:'Words keep coming, matched to your level. Your answers are rated, and your Lexicon rating rises and falls with how closely you explain each one.',pts:['No daily limit','Adaptive difficulty','Rated against the real definition'],btn:'Start Unlimited'},
 bPrac:{h:'Practice',kicker:'No pressure',p:'The same seven words as today’s Daily, with no pressure: your answers are not recorded to your streak or your records.',pts:['Seven words, forty-five seconds each','Hints available','Does not count toward the Daily'],btn:'Start Practice'},
};

/* Generic spread content. A book is a list of spreads, each {l, r} of HTML for the
   left and right page. Helpers below give pages a shared look (kicker, title, rule,
   body, numbered list) so any menu book (Shelf, Sets, Stats...) can fill them. */
export const pg={
 head:(kicker,title)=>`${kicker?`<div class="pg-kicker">${esc(kicker)}</div>`:''}<h2 class="pg-title">${esc(title)}</h2><div class="pg-rule" aria-hidden="true"></div>`,
 body:t=>`<p class="pg-body">${t}</p>`,
 list:items=>`<ol class="pg-list">${items.map(t=>`<li>${t}</li>`).join('')}</ol>`,
 label:t=>`<div class="pg-label">${esc(t)}</div>`,
};
export function introSpreads(intro){
 const narrow=typeof matchMedia==='function'&&matchMedia('(max-width:560px)').matches;
 /* phones show one page at a time: keep the Start button on the first page */
 if(narrow)return [{l:pg.head(intro.kicker,intro.h)+pg.body(intro.p)+pg.label('In this book')+pg.list(intro.pts)+`<div class="pg-actions"><button class="bs-start pen-ink rest">${esc(intro.btn)}</button><button class="bs-back-btn pen-ink">Close the book</button></div>`,r:''}];
 return [{
  l:pg.head(intro.kicker,intro.h)+pg.body(intro.p),
  r:pg.label('In this book')+pg.list(intro.pts)+`<div class="pg-actions"><button class="bs-start pen-ink rest">${esc(intro.btn)}</button><button class="bs-back-btn pen-ink">Close the book</button></div>`,
 }];
}

/* Open a book: it lands in the middle of the screen closed, showing its cover; after a
   beat the cover swings open onto the spread. Resolves nothing; callbacks drive it.
   opts: {from:rect, colors:{bk,bk2,gild,tex}, title, spreads, label, onReady(spreadEl, api)}.
   Returns {el, close}. */
export const BOOK_FLY_MS=BOOK_TIMING.fly, BOOK_HOLD_MS=BOOK_TIMING.hold, BOOK_SWING_MS=BOOK_TIMING.swing;
export const BOOK_OPEN_MS=BOOK_FLY_MS+BOOK_HOLD_MS+BOOK_SWING_MS;
export function openBook({from,colors={},title='',spreads=null,label='',cls='',keepOnEsc=null,onClose=()=>{}}){
 const sp=document.createElement('div');sp.className='bk-spread'+(cls?' '+cls:'');sp.setAttribute('aria-hidden','true');
 const r=from||{left:innerWidth/2,top:innerHeight/2,width:0,height:0};
 sp.style.cssText=`--bk:${colors.bk};--bk2:${colors.bk2};--bk-gild:${colors.gild};--tex:${colors.tex||'none'};--fx:${r.left+r.width/2-innerWidth/2}px;--fy:${r.top+r.height/2-innerHeight/2}px`;
 sp.innerHTML='<div class="bs-board l"></div><div class="bs-board r"></div><div class="bs-page l"></div><div class="bs-page r"></div><div class="bs-leaf"><i></i><i></i></div>'+
  cornersHTML()+RIBBON_HTML+
  '<div class="bs-cover"><div class="cv-front"><i class="cv-hinge"></i><div class="cv-frame"><span class="cv-orn" aria-hidden="true"></span><span class="cv-t"></span><span class="cv-orn" aria-hidden="true"></span></div></div><div class="cv-in"></div></div>';
 sp.querySelector('.cv-t').textContent=title;
 const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches,T=bookTimings(reduce);
 dressBook(sp,T);
 document.body.appendChild(sp);bookSound('whoosh');
 requestAnimationFrame(()=>requestAnimationFrame(()=>sp.classList.add('go')));
 const timers=[];let idx=0,closed=false;
 const t=(fn,ms)=>timers.push(setTimeout(fn,ms));
 /* Close: with pages the cover swings shut over them, the book slides back to its closed
    position, then flies back to where it came from. Without pages it just fades. */
 const close=()=>{if(closed)return;closed=true;timers.forEach(clearTimeout);document.removeEventListener('keydown',key,true);document.removeEventListener('pointerdown',away,true);
  if(!(spreads&&spreads.length)){sp.classList.add('out');setTimeout(()=>{sp.remove();onClose();},400);return;}
  bookSound('flip');
  const swing=sp.classList.contains('open')?T.swing:0,fly=T.flyBack;
  sp.removeAttribute('role');sp.setAttribute('aria-hidden','true');sp.classList.remove('intro','open');sp.classList.add('closing');
  if(swing)setTimeout(()=>thud(sp),swing);
  setTimeout(()=>{sp.classList.remove('go');sp.classList.add('flyback','out');setTimeout(()=>{sp.remove();onClose();},(reduce?T.fade:fly)+30);},swing+T.shutHold);
 };
 /* a press anywhere outside the book closes it (ignoring other popups stacked on top) */
 const away=ev=>{if(sp.contains(ev.target)||(ev.target.closest&&ev.target.closest('#cardlayer,#topPanel,.tip')))return;close();};
 /* One-page mode (phones): the spread shows a single page at a time and turning steps
    through left then right pages; a blank facing page is skipped. */
 const one=typeof matchMedia==='function'&&matchMedia('(max-width:560px)').matches;let side='l';
 const flat=()=>spreads.flatMap((s,i)=>[{i,s:'l'},...(s.r?[{i,s:'r'}]:[])]);
 /* Page HTML for spread i side s2 ('l'|'r'); foot carries only the page number, turning is done by the corner zones. */
 const pageNum=(i,s2)=>i*2+(s2==='l'?1:2);
 const pageHTML=(i,s2,num)=>`<div class="pg-in">${spreads[i][s2]||''}</div><div class="pg-foot ${s2}"><span>${num}</span></div>`;
 const corners=[...sp.querySelectorAll('.bs-corner')],rkey=ribbonKey(label,title);
 const paint=(only)=>{
  const sd=spreads[idx],L=sp.querySelector('.bs-page.l'),R=sp.querySelector('.bs-page.r'),n=spreads.length;
  if(one&&side==='r'&&!sd.r)side='l';
  const fl=one?flat():null,pos=one?fl.findIndex(f=>f.i===idx&&f.s===side):0;
  sp.classList.toggle('one',one);if(one)sp.dataset.side=side;
  const nl=one?pos+1:pageNum(idx,'l'),nr=one?pos+1:pageNum(idx,'r');
  if(only!=='r')L.innerHTML=pageHTML(idx,'l',nl);
  if(only!=='l')R.innerHTML=pageHTML(idx,'r',nr);
  const m=one?fl.length:n,at=one?pos:idx;
  corners.forEach(c=>{const prev=c.classList.contains('prev');c.hidden=m<2;c.disabled=prev?at<=0:at>=m-1;});
  paintEdges(sp,at,m);
  remember(rkey,idx);paintRibbon(sp,idx,recall(rkey),n);
  if(api.onPaint)api.onPaint(sp,idx);
 };
 /* Page turn: a leaf lifts from the corner and swings about the spine (two pages) or peels away (phones).
    Only transform and opacity animate. A second turn pressed mid-flight is queued, not dropped. */
 const FLIP_MS=560;let flying=null,queued=0;
 const settle=()=>{if(!flying)return;const f=flying;flying=null;clearTimeout(f.t);f.leaf.remove();f.done();sp.classList.remove('flipping','flip-next','flip-prev');
  if(queued){const d=queued;queued=0;turn(d);}};
 const turn=d=>{let j=idx+d,s2=side;
  if(flying){queued=d;return;}
  if(one){const fl=flat(),p=fl.findIndex(f=>f.i===idx&&f.s===side)+d;if(p<0||p>=fl.length)return;j=fl[p].i;s2=fl[p].s;}
  else if(j<0||j>=spreads.length)return;
  noteTurned(sp);
  if(reduce||!sp.classList.contains('intro')){idx=j;side=s2;paint();return;}
  bookSound('flip');
  const next=d>0,leaf=document.createElement('div');leaf.className='bs-flip '+(next?'next':'prev')+(one?' one':'');
  const face=(cls,html)=>`<div class="bs-face ${cls} bs-page" inert>${html}</div>`;
  const L=sp.querySelector('.bs-page.l'),R=sp.querySelector('.bs-page.r');
  const cur=one?(side==='r'?R:L):(next?R:L);                      /* the page being lifted */
  const curHTML=cur.innerHTML;
  const oldIdx=idx,oldSide=side;
  let front=curHTML,back='',done;
  if(one){/* phone: the lifted page peels away (next) or the target page settles in (prev) */
   const np=flat().findIndex(f=>f.i===j&&f.s===s2)+1;
   if(next){idx=j;side=s2;paint();done=()=>{};}
   else{front=`<div class="pg-in">${spreads[j][s2]||''}</div><div class="pg-foot ${s2}"><span>${np}</span></div>`;done=()=>{idx=j;side=s2;paint();};}
  }else if(next){/* new right page appears underneath at once; new left lands when the leaf has covered the old one */
   back=`<div class="pg-in">${spreads[j].l||''}</div><div class="pg-foot l"><span>${pageNum(j,'l')}</span></div>`;
   idx=j;paint('r');done=()=>paint('l');
  }else{
   back=`<div class="pg-in">${spreads[j].r||''}</div><div class="pg-foot r"><span>${pageNum(j,'r')}</span></div>`;
   idx=j;paint('l');done=()=>paint('r');
  }
  leaf.innerHTML=face('front',front)+(one?'':face('back',back));
  sp.appendChild(leaf);sp.classList.add('flipping',next?'flip-next':'flip-prev');
  flying={leaf,done,t:setTimeout(settle,FLIP_MS+40)};
  leaf.addEventListener('animationend',e=>{if(e.target===leaf)settle();});
 };
 /* swipe on the open book: a mostly horizontal drag turns the page */
 let sw=null;
 sp.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.target.closest('input,textarea,select,button,a,.bs-corner'))return;sw={x:e.clientX,y:e.clientY};});
 sp.addEventListener('pointerup',e=>{if(!sw)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;sw=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)turn(dx<0?1:-1);});
 sp.addEventListener('pointercancel',()=>{sw=null;});
 const rb=sp.querySelector('.bs-ribbon');
 if(rb)rb.addEventListener('click',()=>{const j=ribbonTarget(idx,recall(rkey),spreads.length);if(j===idx)return;settle();queued=0;noteTurned(sp);bookSound('flip');idx=j;side='l';paint();});
 corners.forEach(c=>c.addEventListener('click',()=>turn(c.classList.contains('next')?1:-1)));
 const key=ev=>{if(ev.key==='Escape'){if(!(keepOnEsc&&keepOnEsc()))close();return;}if(ev.target.closest&&ev.target.closest('input,textarea,select'))return;if(ev.key==='ArrowRight')turn(1);else if(ev.key==='ArrowLeft')turn(-1);};
 /* swap the pages in place (filters, search); stays on spread i. only 'r' or 'l' repaints just that page, so an input on the other page keeps focus */
 const api={el:sp,close,onPaint:null,get index(){return idx;},setSpreads(s,i=0,only){settle();queued=0;spreads=s;idx=Math.max(0,Math.min(i,s.length-1));if(!only)side='l';paint(only);}};
 t(()=>{sp.classList.add('open');bookSound('flip');},T.fly+T.hold);
 if(spreads&&spreads.length){
  t(()=>{
   paint();sp.classList.add('intro');hintCurl(sp,reduce);sp.setAttribute('role','dialog');sp.setAttribute('aria-label',label||title);sp.removeAttribute('aria-hidden');
   document.addEventListener('keydown',key,true);document.addEventListener('pointerdown',away,true);
   const f=sp.querySelector('.bs-start')||sp.querySelector('.pg-in button,.pg-in input');if(f)f.focus({preventScroll:true});
  },Math.max(0,T.open-120));
 }
 return api;
}

/* Click-open for the menu books. Call after main.js has assigned the onclick handlers.
   Books with an intro stay open on their pages; others run their handler once open and
   the spread fades. Reduced motion skips straight to the handler. */
/* Menu books whose pages are built live (Shelf, Sets, Stats). main.js registers
   BOOK_PAGES[id]={spreads:()=>[{l,r}],onPaint(sp,api),keepOnEsc} and the book stays open on those pages. */
export const BOOK_PAGES={};
export function bookify(root,{wait=BOOK_OPEN_MS}={}){
 const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 root.querySelectorAll('.hbook').forEach(el=>{
  const go=el.onclick;if(!go&&!BOOK_PAGES[el.id])return;
  el.onclick=e=>{
   if(root.classList.contains('book-opening'))return;
   const pages=BOOK_PAGES[el.id];
   if(reduce&&!pages){go.call(el,e);return;}
   const cs=getComputedStyle(el),intro=BOOK_INTROS[el.id];
   const title=el.querySelector('.hb-t')?.firstChild?.textContent?.trim()||'';
   root.classList.add('book-opening');el.classList.add('opening');
   const fin=()=>{el.classList.remove('opening');root.classList.remove('book-opening');};
   const bk=openBook({from:el.getBoundingClientRect(),title,label:intro?.h||pages?.label,cls:pages?'menu':'',keepOnEsc:pages?.keepOnEsc,spreads:pages?pages.spreads():intro?introSpreads(intro):null,onClose:fin,
    colors:{bk:cs.getPropertyValue('--bk'),bk2:cs.getPropertyValue('--bk2'),gild:cs.getPropertyValue('--bk-gild'),tex:cs.getPropertyValue('--tex')}});
   if(pages){bk.onPaint=(sp,idx)=>{inkPage(sp,pages.label);pages.onPaint&&pages.onPaint(sp,bk,idx);};}
   else if(intro){
    bk.onPaint=sp=>{const st=sp.querySelector('.bs-start'),bb=sp.querySelector('.bs-back-btn');
     if(st)st.onclick=()=>{go.call(el,e);bk.close();};if(bb)bb.onclick=bk.close;};
   }else setTimeout(()=>{go.call(el,e);bk.close();},wait);
  };
 });
}
