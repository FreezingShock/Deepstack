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
 /* menu spines: muted antique book-cloth and leather (navy buckram, oxblood, bottle green, tan calf...) */
 navy:[PALETTE.spineNavy,PALETTE.spineNavyDk,PALETTE.brass62],
 oxblood:[PALETTE.spineOxblood,PALETTE.spineOxbloodDk,PALETTE.brass62],
 aubergine:[PALETTE.spineAubergine,PALETTE.spineAubergineDk,PALETTE.brass65],
 verdigris:[PALETTE.spineVerdigris,PALETTE.spineVerdigrisDk,PALETTE.brass65],
 bottle:[PALETTE.spineBottle,PALETTE.spineBottleDk,PALETTE.brass62],
 calf:[PALETTE.spineCalf,PALETTE.spineCalfDk,PALETTE.spineGiltCream],
 ochre:[PALETTE.spineOchre,PALETTE.spineOchreDk,PALETTE.spineGiltCream],
 slate:[PALETTE.spineSlate,PALETTE.spineSlateDk,PALETTE.brass65],
};
/* stack: which pile the book lies in (0 = play modes, 1 = collection). */
export const HOME_LINKS=[
 {id:'bDaily',stack:0,tex:'grain',color:'navy',label:'Daily',note:'Every Daily, plus Practice',badge:(s,x)=>x.dailyNo?dailyBadge({S:s,played:x.played,no:x.dailyNo,today:x.today}):''},
 {id:'bUnl',stack:0,color:'oxblood',label:'Unlimited',note:'Adaptive words, rated',badge:(s,x)=>unlimitedBadge(s,x.lexicon)},
 {id:'bAll',stack:1,tex:'worn',color:'calf',label:'Shelf',note:'Every book you have earned',badge:s=>s.shelf.length||''},
 /* the Rooms book (src/ui/roomLedger.js) took over from Sets: every set now lives in its topic room */
 {id:'bRooms',stack:1,tex:'vellum',color:'ochre',label:'Rooms',note:'Every room, its fire and its sets',badge:s=>{const r=roomById(currentRoom(s));return r.id==='hall'?ROOMS.length+' rooms':r.short;}},
 {id:'bStats',stack:1,tex:'grain',color:'slate',label:'Stats',note:'Streaks, depth and tiers'},
];

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

import {ledgerHTML} from './welcome.js';
import {cabinetHTML,loadSeen} from './cabinet.js';
import {mantelHTML} from './mantel.js';
import {plaqueState,dailyBadge,unlimitedBadge} from './homePlaque.js';
import {ROOMS,roomById} from '../core/rooms.js';
import {currentRoom} from '../core/roomStore.js';
import {scopeRoom} from './scope.js';
export function homeHTML({S,st,d,no,floorName,floorKey,tierInk,lexicon=()=>'',today=''}){
 const ctx={lexicon,dailyNo:no,played:!!d,today},pq=plaqueState({S,played:!!d,no,today,lexicon});
 /* library furniture built into the niche walls: a card-catalogue cabinet (rules) and the borrower's ledger (welcome.css) */
 const rules=cabinetHTML({steps:HOME_STEPS,bestTier:S.shelf.reduce((m,b)=>Math.max(m,b.tier|0),-1),today:{no,kind:pq.kind,tag:pq.tag,streak:st.streak|0,played:!!d,room:(r=>({name:r.name,short:r.short,rgb:r.rgb}))(roomById(currentRoom(S)))},tierCounts:S.shelf.reduce((a,b)=>{const t=b.tier|0;a[t]=(a[t]|0)+1;return a;},[]),seen:loadSeen()});
 const slip=ledgerHTML({streak:st.streak,deepest:st.deepest,books:S.shelf.length,floor:floorName||'',floorKey:floorKey||'',tierInk:tierInk||'',room:scopeRoom(S)});
 const book=l=>{const b=l.badge?l.badge(S,ctx):'';const c=HOME_BOOK_COLORS[l.color]||HOME_BOOK_COLORS.brown;
  return `<li><button class="hbook" data-tex="${l.tex||'leather'}" id="${l.id}"${l.note?` title="${esc(l.note)}"`:''} style="--bk:${c[0]};--bk2:${c[1]};--bk-gild:${c[2]}"><span class="hb-pages" aria-hidden="true"></span><span class="hb-spine"><i class="hb-band" aria-hidden="true"></i><span class="hb-t">${esc(l.label)}${b?` <small>${esc(b)}</small>`:''}</span><i class="hb-band" aria-hidden="true"></i></span></button></li>`;};
 const stacks=[...new Set(HOME_LINKS.map(l=>l.stack||0))].sort((a,b)=>a-b);
 const secs=stacks.map(n=>`<ul class="hshelf" data-stack="${n}">${HOME_LINKS.filter(l=>(l.stack||0)===n).map(book).join('')}</ul>`).join('');
 return `<div class="sheet home">
  <header class="hz hz-title"><h1 class="title wordmark">Deepstack</h1>
  <p class="tagline">Every word is a step into the dark.</p></header>
  <section class="hz hz-plaque" aria-label="Descend">${rules}${slip}${mantelHTML({streak:st.streak,played:Math.max(Object.keys(S.daily||{}).length,(S.streak&&S.streak.n)||0)})}<div class="row"><button class="descend" id="${pq.kind==='unlimited'?'bNext':'bPlay'}" data-next="${pq.kind}"><i class="d-flame" aria-hidden="true"></i>${pq.kind==='daily'?`<span class="d-t">${esc(pq.label)}</span>`:`<span class="d-col"><span class="d-t">${esc(pq.label)}</span><small class="d-sub">${esc(pq.tag)}</small></span>`}<i class="d-chev" aria-hidden="true"></i></button></div>
     ${pq.second?`<div class="row plaque-second"><button class="btn big" id="bRes">Today’s result</button></div><p class="next" id="nextd"></p>`:pq.kind==='daily'?`<p class="next daily-tag">${esc(pq.tag)}</p>`:''}</section>
  <nav class="hz hsecs" aria-label="Menu books">${secs}</nav></div>`;
}


/* Books that open onto intro pages with a Start button instead of a menu. */
export const BOOK_INTROS={
 bUnl:{h:'Unlimited',kicker:'Explain the word',p:'Words keep coming, matched to your level. Each answer is rated, and your Lexicon moves with how well you explain it.',pts:['No daily limit','Adaptive difficulty','Rated against the real definition'],btn:'Descend',
  /* two sections on the same two pages: the left page explains the word, the right page is the riddle (you get the definition) */
  riddle:{h:'Riddle',kicker:'The word is the answer',p:'The other way round: a slip shows what a word means and you write the word. The exact word sinks deepest.',pts:['Seven riddles, forty seconds each','Hints never reveal the spelling','Counts toward your shelf, not the Daily'],btn:'Begin the riddles',act:'riddle'}},
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
/* Click handlers for extra Start buttons inside a book (a section's data-act). app/home.js fills it. */
export const BOOK_ACTS={};
/* a sectioned page: the main action sits right under the intro (and rank), never at the foot where a tall page would clip it; the feature list follows */
const introPage=(i,btn,close)=>pg.head(i.kicker,i.h)+pg.body(i.p)+(i.extra?i.extra():'')+`<div class="pg-actions"><button class="bs-start bs-primary pen-ink rest"${i.act?` data-act="${i.act}"`:''}>${esc(typeof i.btn==='function'?i.btn():i.btn)}</button>${i.second?i.second():''}</div>`+pg.label('In this book')+pg.list(i.pts);
export function introSpreads(intro){
 if(intro.riddle){/* sectioned book: left page the book's own mode, right page its riddle; phones step left then right */
  const a=introPage(intro,0,false),b=introPage(intro.riddle,0,true);
  return [{l:`<section class="pg-sec" aria-label="${esc(intro.h)}">${a}</section>`,r:`<section class="pg-sec" aria-label="${esc(intro.riddle.h)}">${b}</section><div class="pg-foot"><button class="bs-back-btn pen-ink">Close the book</button></div>`}];
 }
 const narrow=typeof matchMedia==='function'&&matchMedia('(max-width:560px)').matches;
 /* phones show one page at a time: keep the Start button on the first page */
 if(narrow)return [{l:pg.head(intro.kicker,intro.h)+pg.body(intro.p)+pg.label('In this book')+pg.list(intro.pts)+`<div class="pg-actions"><button class="bs-start pen-ink rest">${esc(intro.btn)}</button></div><div class="pg-foot"><button class="bs-back-btn pen-ink">Close the book</button></div>`,r:''}];
 return [{
  l:pg.head(intro.kicker,intro.h)+pg.body(intro.p)+(intro.art?`<div class="intro-sketch">${intro.art}</div>`:''),
  r:pg.label('In this book')+pg.list(intro.pts)+`<div class="pg-actions"><button class="bs-start pen-ink rest">${esc(intro.btn)}</button></div><div class="pg-foot"><button class="bs-back-btn pen-ink">Close the book</button></div>`,
 }];
}

/* Open a book: it lands in the middle of the screen closed, showing its cover; after a
   beat the cover swings open onto the spread. Resolves nothing; callbacks drive it.
   opts: {from:rect, colors:{bk,bk2,gild,tex}, title, spreads, label, onReady(spreadEl, api)}.
   Returns {el, close}. */
export const BOOK_FLY_MS=BOOK_TIMING.fly, BOOK_HOLD_MS=BOOK_TIMING.hold, BOOK_SWING_MS=BOOK_TIMING.swing;
export const BOOK_OPEN_MS=BOOK_FLY_MS+BOOK_HOLD_MS+BOOK_SWING_MS;
export function openBook({from,colors={},title='',spreads=null,label='',cls='',keepOnEsc=null,onFly=()=>{},onClose=()=>{},onShut=()=>{}}){
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
 /* The closed book's size is the spine's, so it leaves the spine standing up and lands back on it lying down (AT8/AT9). */
 const footprint=()=>{if(r.width>0&&sp.offsetWidth){sp.style.setProperty('--sx',(r.width/(sp.offsetWidth/2)).toFixed(4));sp.style.setProperty('--sy',(r.height/sp.offsetHeight).toFixed(4));}};
 sp.style.transition='none';footprint();void sp.offsetWidth;sp.style.transition='';
 requestAnimationFrame(()=>requestAnimationFrame(()=>sp.classList.add('go')));
 const timers=[];let idx=0,closed=false;
 const t=(fn,ms)=>timers.push(setTimeout(fn,ms));
 /* Close: with pages the cover swings shut over them, the book slides back to its closed
    position, then flies back to where it came from. Without pages it just fades. */
 const close=()=>{if(closed)return;closed=true;onShut();timers.forEach(clearTimeout);document.removeEventListener('keydown',key,true);document.removeEventListener('pointerdown',away,true);
  if(!(spreads&&spreads.length)){sp.classList.add('out');setTimeout(()=>{sp.remove();onClose();},400);return;}
  bookSound('flip');
  const swing=sp.classList.contains('open')?T.swing:0,fly=T.flyBack;
  sp.removeAttribute('role');sp.setAttribute('aria-hidden','true');
  /* land exactly on the spine: scale the closed book (half the spread wide) down to the spine's size */
  footprint();
  sp.classList.remove('intro','open');sp.classList.add('closing');
  if(swing)setTimeout(()=>thud(sp),swing);
  setTimeout(()=>{sp.classList.remove('go');sp.classList.add('flyback','out');onFly();setTimeout(()=>{sp.remove();onClose();},(reduce?T.fade:Math.max(fly,300))+30);},swing+T.shutHold);
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
  const next=d>0,leaf=document.createElement('div');leaf.className='bs-flip hold '+(next?'next':'prev')+(one?' one':'');
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
  /* the heavy work (page swap, layout, leaf raster) lands in this frame; the sweep starts a frame later */
  const go=()=>{if(leaf.isConnected)leaf.classList.remove('hold');};
  requestAnimationFrame(()=>requestAnimationFrame(go));
  flying={leaf,done,t:setTimeout(settle,FLIP_MS+120)};
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
 const key=ev=>{if(ev.key==='Escape'){if(!(keepOnEsc&&keepOnEsc()))close();return;}if(ev.target.closest&&ev.target.closest('input,textarea,select'))return;if(ev.key==='ArrowRight'||ev.key==='PageDown')turn(1);else if(ev.key==='ArrowLeft'||ev.key==='PageUp')turn(-1);else if((ev.key==='Home'||ev.key==='End')&&!ev.altKey&&!ev.ctrlKey&&!ev.metaKey){const j=ev.key==='Home'?0:spreads.length-1;if(j!==idx){ev.preventDefault();settle();queued=0;noteTurned(sp);bookSound('flip');idx=j;side='l';paint();}}};
 /* swap the pages in place (filters, search); stays on spread i. only 'r' or 'l' repaints just that page, so an input on the other page keeps focus */
 const api={el:sp,close,onPaint:null,get index(){return idx;},setSpreads(s,i=0,only,toSide){settle();queued=0;spreads=s;idx=Math.max(0,Math.min(i,s.length-1));if(!only)side=toSide==='r'?'r':'l';paint(only);}};
 t(()=>{sp.classList.add('open');bookSound('flip');},T.fly+T.hold);
 if(spreads&&spreads.length){
  /* Both pages are built before the first frame (a microtask, after the caller has hooked onPaint), so they are
     already there, under the cover, when it swings: nothing is rendered or decorated mid-animation or afterwards. */
  queueMicrotask(()=>{if(!closed)paint();});
  t(()=>{
   sp.classList.add('intro');hintCurl(sp,reduce);sp.setAttribute('role','dialog');sp.setAttribute('aria-label',label||title);sp.removeAttribute('aria-hidden');
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
 let busy=false,flying=false,pending=null;
 root.querySelectorAll('.hbook,.lg-row#bFloors').forEach(el=>{
  const go=el.onclick;if(!go&&!BOOK_PAGES[el.id])return;
  el.onclick=e=>{
   if(busy){if(!el.classList.contains('opening'))pending=()=>el.onclick(e);return;}
   const pages=BOOK_PAGES[el.id];
   if(pages&&pages.load){pages.load().then(()=>el.onclick(e),()=>{});return;} // lazy book (lazyScreens.js): fetch its code, then open as usual
   if(reduce&&!pages&&!BOOK_INTROS[el.id]?.riddle){go.call(el,e);return;}
   const cs=getComputedStyle(el),intro=BOOK_INTROS[el.id];
   const title=el.querySelector('.hb-t')?.firstChild?.textContent?.trim()||'';
   busy=true;flying=false;root.classList.add('book-opening');el.classList.add('opening');
   /* The room comes back while the book is still flying home (not after it lands), so closing is one motion,
      and the spine it left fades in as the book settles onto it. */
   const lift=()=>{flying=true;root.classList.remove('book-opening');root.classList.remove('book-closing');setTimeout(()=>el.classList.remove('opening'),reduce?0:Math.max(0,BOOK_TIMING.flyBack-170));};
   const fin=()=>{el.classList.remove('opening');if(!reduce){root.classList.add('book-landed');el.classList.add('landed');setTimeout(()=>{root.classList.remove('book-landed');el.classList.remove('landed');},300);}root.classList.remove('book-opening');root.classList.remove('book-closing');busy=false;flying=false;
    if(pending){const n=pending;pending=null;n();}};
   const bk=openBook({from:el.getBoundingClientRect(),title,label:intro?.h||pages?.label,cls:pages?'menu':'',keepOnEsc:pages?.keepOnEsc,spreads:pages?pages.spreads():intro?introSpreads(intro):null,onFly:lift,onClose:fin,onShut:()=>root.classList.add('book-closing'),
    colors:{bk:cs.getPropertyValue('--bk'),bk2:cs.getPropertyValue('--bk2'),gild:cs.getPropertyValue('--bk-gild'),tex:cs.getPropertyValue('--tex')}});
   if(pages){bk.onPaint=(sp,idx)=>{inkPage(sp,pages.label);pages.onPaint&&pages.onPaint(sp,bk,idx);};}
   else if(intro){
    bk.onPaint=sp=>{const bb=sp.querySelector('.bs-back-btn');
     sp.querySelectorAll('.bs-start,.bs-again').forEach(b=>{b.onclick=()=>{const a=b.dataset.act&&BOOK_ACTS[b.dataset.act];(a||(()=>go.call(el,e)))();bk.close();};});if(bb)bb.onclick=bk.close;};
   }else setTimeout(()=>{go.call(el,e);bk.close();},wait);
  };
 });
}
