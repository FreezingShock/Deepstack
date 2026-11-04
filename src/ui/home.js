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
export const HOME_LINKS=[
 {id:'bUnl',color:'red',label:'Unlimited',note:'Adaptive words, rated',badge:(s,x)=>s.rating&&s.rating.placed?'Lexicon '+x.lexicon(s.rating.L):'placement'},
 {id:'bPrac',tex:'cloth',color:'green',label:'Practice',note:'Same words, no pressure'},
 {id:'bAll',tex:'worn',color:'blue',label:'Shelf',note:'Every book you have earned',badge:s=>s.shelf.length||''},
 {id:'bSets',tex:'vellum',color:'purple',label:'Sets',note:'Themed collections'},
 {id:'bStats',tex:'grain',color:'brown',label:'Stats',note:'Streaks, depth and tiers'},
];

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function homeHTML({S,st,d,no,floorName,lexicon=()=>''}){
 const ctx={lexicon};
 const steps=HOME_STEPS.map(s=>`<li class="step"><span class="hn" aria-hidden="true">${s.n}</span><b>${esc(s.h)}</b><span>${esc(s.p)}</span></li>`).join('');
 const book=l=>{const b=l.badge?l.badge(S,ctx):'';const c=HOME_BOOK_COLORS[l.color]||HOME_BOOK_COLORS.brown;
  return `<li><button class="hbook" data-tex="${l.tex||'leather'}" id="${l.id}" style="--bk:${c[0]};--bk2:${c[1]};--bk-gild:${c[2]}"><span class="hb-pages" aria-hidden="true"></span><span class="hb-spine"><i class="hb-band" aria-hidden="true"></i><span class="hb-t">${esc(l.label)}${b?` <small>${esc(b)}</small>`:''}</span>${l.note?`<span class="hb-n">${esc(l.note)}</span>`:''}<i class="hb-band" aria-hidden="true"></i></span></button></li>`;};
 const secs=`<ul class="hshelf">${HOME_LINKS.map(book).join('')}</ul>`;
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


/* Books that open onto an intro page with a Start button instead of a menu. */
export const BOOK_INTROS={
 bUnl:{h:'Unlimited',p:'Words keep coming, matched to your level. Your answers are rated, and your Lexicon rating rises and falls with how closely you explain each one.',pts:['No daily limit','Adaptive difficulty','Rated against the real definition'],btn:'Start Unlimited'},
 bPrac:{h:'Practice',p:'The same seven words as today’s Daily, with no pressure: your answers are not recorded to your streak or your records.',pts:['Seven words, forty-five seconds each','Hints available','Does not count toward the Daily'],btn:'Start Practice'},
};
/* Click-open: the book flies to the middle of the screen and opens into a
   two-page spread, then the original handler runs (its menu appears over it) and the
   spread fades away. Call after main.js has assigned the onclick handlers.
   Reduced motion skips straight to the handler. */
export const BOOK_OPEN_MS=900;
export function bookify(root,{wait=BOOK_OPEN_MS}={}){
 const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 root.querySelectorAll('.hbook').forEach(el=>{
  const go=el.onclick;if(!go)return;
  el.onclick=e=>{
   if(root.classList.contains('book-opening'))return;
   if(reduce){go.call(el,e);return;}
   const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
   const sp=document.createElement('div');sp.className='bk-spread';sp.setAttribute('aria-hidden','true');
   sp.style.cssText=`--bk:${cs.getPropertyValue('--bk')};--bk2:${cs.getPropertyValue('--bk2')};--bk-gild:${cs.getPropertyValue('--bk-gild')};--fx:${r.left+r.width/2-innerWidth/2}px;--fy:${r.top+r.height/2-innerHeight/2}px`;
   sp.innerHTML='<div class="bs-back"></div><div class="bs-page l"></div><div class="bs-page r"></div><div class="bs-cover"><span>'+(el.querySelector('.hb-t')?.firstChild?.textContent||'')+'</span></div>';
   document.body.appendChild(sp);root.classList.add('book-opening');el.classList.add('opening');
   requestAnimationFrame(()=>requestAnimationFrame(()=>sp.classList.add('go')));
   const done=()=>{sp.classList.add('out');setTimeout(()=>{sp.remove();el.classList.remove('opening');root.classList.remove('book-opening');document.removeEventListener('keydown',esc);},400);};
   const intro=BOOK_INTROS[el.id];
   const esc=ev=>{if(ev.key==='Escape')done();};
   setTimeout(()=>{
    if(!intro){go.call(el,e);done();return;}
    const li=intro.pts.map(t=>`<li>${t}</li>`).join('');
    sp.querySelector('.bs-page.l').innerHTML=`<h2>${intro.h}</h2><p>${intro.p}</p>`;
    sp.querySelector('.bs-page.r').innerHTML=`<ul>${li}</ul><button class="bs-start">${intro.btn}</button><button class="bs-back-btn">Close the book</button>`;
    sp.classList.add('intro');sp.setAttribute('role','dialog');sp.setAttribute('aria-label',intro.h);sp.removeAttribute('aria-hidden');
    const st=sp.querySelector('.bs-start');st.focus({preventScroll:true});
    st.onclick=()=>{go.call(el,e);done();};
    sp.querySelector('.bs-back-btn').onclick=done;
    document.addEventListener('keydown',esc);
   },wait);
  };
 });
}
