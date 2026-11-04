/* Home screen markup. Kept separate from main.js so other features can add
   entries (modes, links) by pushing onto HOME_LINKS / HOME_STEPS without
   touching the layout. */

export const HOME_STEPS=[
 {n:1,h:'Explain',p:'A hard word appears. Say what it means in your own words.'},
 {n:2,h:'Be judged',p:'Scored on accuracy: how close your meaning is to the real one.'},
 {n:3,h:'Descend',p:'Every answer becomes a book. Better answers go deeper.'},
];

/* Secondary entries, drawn as books lying sideways in a stack. id becomes the
   button id; color picks the leather (HOME_BOOK_COLORS). Other features can push
   onto HOME_LINKS. Layout, hover and open animation live in home.css (--bk-* vars). */
export const HOME_BOOK_COLORS={
 red:['#6b1f1c','#3a0f0e','#c9803a'],
 green:['#27502f','#122a18','#d0b36a'],
 blue:['#23406b','#10203a','#d0b36a'],
 purple:['#4a2a63','#26143a','#d8b676'],
 brown:['#5b3a1d','#2d1c0d','#d8b676'],
};
/* stack: which pile the book lies in (0 = play modes, 1 = collection). */
export const HOME_LINKS=[
 {id:'bUnl',stack:0,color:'red',label:'Unlimited',note:'Adaptive words, rated',badge:(s,x)=>s.rating&&s.rating.placed?'Lexicon '+x.lexicon(s.rating.L):'placement'},
 {id:'bPrac',stack:0,tex:'cloth',color:'green',label:'Practice',note:'Same words, no pressure'},
 {id:'bAll',stack:1,tex:'worn',color:'blue',label:'Shelf',note:'Every book you have earned',badge:s=>s.shelf.length||''},
 {id:'bSets',stack:1,tex:'vellum',color:'purple',label:'Sets',note:'Themed collections'},
 {id:'bStats',stack:1,tex:'grain',color:'brown',label:'Stats',note:'Streaks, depth and tiers'},
];

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function homeHTML({S,st,d,no,floorName,lexicon=()=>''}){
 const ctx={lexicon};
 const steps=HOME_STEPS.map(s=>`<li class="step"><span class="hn" aria-hidden="true">${s.n}</span><b>${esc(s.h)}</b><span>${esc(s.p)}</span></li>`).join('');
 const book=l=>{const b=l.badge?l.badge(S,ctx):'';const c=HOME_BOOK_COLORS[l.color]||HOME_BOOK_COLORS.brown;
  return `<li><button class="hbook" data-tex="${l.tex||'leather'}" id="${l.id}"${l.note?` title="${esc(l.note)}"`:''} style="--bk:${c[0]};--bk2:${c[1]};--bk-gild:${c[2]}"><span class="hb-pages" aria-hidden="true"></span><span class="hb-spine"><i class="hb-band" aria-hidden="true"></i><span class="hb-t">${esc(l.label)}${b?` <small>${esc(b)}</small>`:''}</span><i class="hb-band" aria-hidden="true"></i></span></button></li>`;};
 const stacks=[...new Set(HOME_LINKS.map(l=>l.stack||0))].sort((a,b)=>a-b);
 const secs=stacks.map(n=>`<ul class="hshelf" data-stack="${n}">${HOME_LINKS.filter(l=>(l.stack||0)===n).map(book).join('')}</ul>`).join('');
 return `<div class="sheet home">
  <h1 class="title">Deepstack</h1>
  <p class="tagline">Explain a hard word. The closer you get to its true meaning, the deeper into the library you descend.</p>
  <ol class="how" aria-label="How it works">${steps}</ol>
  ${d?`<div class="row"><button class="btn pri big" id="bRes">Today’s result</button></div><p class="next" id="nextd"></p>`
     :`<div class="row"><button class="descend" id="bPlay"><i class="d-flame" aria-hidden="true"></i><span class="d-t">Descend</span><i class="d-chev" aria-hidden="true"></i></button></div><p class="next daily-tag">Daily No. ${no}</p>`}
  <div class="stats" aria-label="Your records"><span>Streak <b>${st.streak}</b></span><span>Deepest <b>${st.deepest} ft</b></span><span>Books <b>${S.shelf.length}</b></span>${floorName?`<span>Floor <b>${esc(floorName)}</b></span>`:''}</div>
  <nav class="hsecs" aria-label="Menu books">${secs}</nav>
  <div class="judgestat" id="jstat" aria-live="polite"></div></div>`;
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
 return [{
  l:pg.head(intro.kicker,intro.h)+pg.body(intro.p),
  r:pg.label('In this book')+pg.list(intro.pts)+`<div class="pg-actions"><button class="bs-start">${esc(intro.btn)}</button><button class="bs-back-btn">Close the book</button></div>`,
 }];
}

/* Open a book: it lands in the middle of the screen closed, showing its cover; after a
   beat the cover swings open onto the spread. Resolves nothing; callbacks drive it.
   opts: {from:rect, colors:{bk,bk2,gild,tex}, title, spreads, label, onReady(spreadEl, api)}.
   Returns {el, close}. */
export const BOOK_FLY_MS=380, BOOK_HOLD_MS=100, BOOK_SWING_MS=620;
export const BOOK_OPEN_MS=BOOK_FLY_MS+BOOK_HOLD_MS+BOOK_SWING_MS;
export function openBook({from,colors={},title='',spreads=null,label='',cls='',keepOnEsc=null,onClose=()=>{}}){
 const sp=document.createElement('div');sp.className='bk-spread'+(cls?' '+cls:'');sp.setAttribute('aria-hidden','true');
 const r=from||{left:innerWidth/2,top:innerHeight/2,width:0,height:0};
 sp.style.cssText=`--bk:${colors.bk};--bk2:${colors.bk2};--bk-gild:${colors.gild};--tex:${colors.tex||'none'};--fx:${r.left+r.width/2-innerWidth/2}px;--fy:${r.top+r.height/2-innerHeight/2}px`;
 sp.innerHTML='<div class="bs-board l"></div><div class="bs-board r"></div><div class="bs-page l"></div><div class="bs-page r"></div><div class="bs-leaf"><i></i><i></i></div>'+
  '<div class="bs-cover"><div class="cv-front"><i class="cv-hinge"></i><div class="cv-frame"><span class="cv-orn" aria-hidden="true"></span><span class="cv-t"></span><span class="cv-orn" aria-hidden="true"></span></div></div><div class="cv-in"></div></div>';
 sp.querySelector('.cv-t').textContent=title;
 document.body.appendChild(sp);
 requestAnimationFrame(()=>requestAnimationFrame(()=>sp.classList.add('go')));
 const timers=[];let idx=0,closed=false;
 const t=(fn,ms)=>timers.push(setTimeout(fn,ms));
 const close=()=>{if(closed)return;closed=true;timers.forEach(clearTimeout);document.removeEventListener('keydown',key,true);sp.classList.add('out');setTimeout(()=>{sp.remove();onClose();},400);};
 const paint=(only)=>{
  const sd=spreads[idx],L=sp.querySelector('.bs-page.l'),R=sp.querySelector('.bs-page.r'),n=spreads.length;
  const foot=(side)=>{const num=idx*2+(side==='l'?1:2);const nav=n>1?(side==='l'?`<button class="bs-turn prev" ${idx?'':'disabled'} aria-label="Previous pages">‹</button>`:`<button class="bs-turn next" ${idx<n-1?'':'disabled'} aria-label="Next pages">›</button>`):'';
   return `<div class="pg-foot ${side}">${side==='l'?nav+`<span>${num}</span>`:`<span>${num}</span>`+nav}</div>`;};
  if(only!=='r')L.innerHTML=`<div class="pg-in">${sd.l}</div>`+foot('l');
  if(only!=='l')R.innerHTML=`<div class="pg-in">${sd.r}</div>`+foot('r');
  const pv=sp.querySelector('.bs-turn.prev'),nx=sp.querySelector('.bs-turn.next');
  if(pv)pv.onclick=()=>turn(-1);if(nx)nx.onclick=()=>turn(1);
  if(api.onPaint)api.onPaint(sp,idx);
 };
 const turn=d=>{const j=idx+d;if(j<0||j>=spreads.length)return;sp.classList.add('turning');setTimeout(()=>{idx=j;paint();sp.classList.remove('turning');},160);};
 const key=ev=>{if(ev.key==='Escape'){if(!(keepOnEsc&&keepOnEsc()))close();return;}if(ev.target.closest&&ev.target.closest('input,textarea,select'))return;if(ev.key==='ArrowRight')turn(1);else if(ev.key==='ArrowLeft')turn(-1);};
 /* swap the pages in place (filters, search); stays on spread i. only 'r' or 'l' repaints just that page, so an input on the other page keeps focus */
 const api={el:sp,close,onPaint:null,get index(){return idx;},setSpreads(s,i=0,only){spreads=s;idx=Math.max(0,Math.min(i,s.length-1));paint(only);}};
 t(()=>sp.classList.add('open'),BOOK_FLY_MS+BOOK_HOLD_MS);
 if(spreads&&spreads.length){
  t(()=>{
   paint();sp.classList.add('intro');sp.setAttribute('role','dialog');sp.setAttribute('aria-label',label||title);sp.removeAttribute('aria-hidden');
   document.addEventListener('keydown',key,true);
   const f=sp.querySelector('.bs-start')||sp.querySelector('.pg-in button,.pg-in input');if(f)f.focus({preventScroll:true});
  },BOOK_OPEN_MS-120);
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
   if(pages){bk.onPaint=(sp,idx)=>pages.onPaint&&pages.onPaint(sp,bk,idx);}
   else if(intro){
    bk.onPaint=sp=>{const st=sp.querySelector('.bs-start'),bb=sp.querySelector('.bs-back-btn');
     if(st)st.onclick=()=>{go.call(el,e);bk.close();};if(bb)bb.onclick=bk.close;};
   }else setTimeout(()=>{go.call(el,e);bk.close();},wait);
  };
 });
}
