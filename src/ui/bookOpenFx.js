/* Book opening and closing choreography (v3). Pure timing plus small DOM helpers used by openBook in home.js.
   Open: the closed book flies to the middle, the cover swings over on its spine, a ribbon drops from the gutter,
   all in under 600 ms. Close (outside click or Esc): text clears, the cover swings shut with a thud, the book
   flies home. Reduced motion skips the flight and the swing and simply fades. */
export const OPEN_BUDGET_MS=600;
export const BOOK_TIMING=Object.freeze({fly:230,hold:30,swing:320,shutHold:80,flyBack:230,fade:160});

export function bookTimings(reduce=false){
 const T=BOOK_TIMING;
 if(reduce)return{reduce:true,fly:0,hold:0,swing:0,shutHold:0,flyBack:0,fade:T.fade,open:T.fade,close:T.fade};
 return{reduce:false,fly:T.fly,hold:T.hold,swing:T.swing,shutHold:T.shutHold,flyBack:T.flyBack,fade:T.fade,
  open:T.fly+T.hold+T.swing,close:T.swing+T.shutHold+T.flyBack};
}

/* Sound hook: main.js points this at the game's Sfx so this file stays free of audio code. */
let sfx=()=>{};
export const setBookSfx=fn=>{sfx=typeof fn==='function'?fn:()=>{};};
export const bookSound=name=>{try{sfx(name);}catch(e){}};

/* Extra layers: page-block edges (thickness), a bookmark ribbon, and marbled endpapers on the cover's inside. */
export function dressBook(sp,t){
 sp.style.setProperty('--o-fly',t.fly+'ms');sp.style.setProperty('--o-swing',t.swing+'ms');
 sp.style.setProperty('--o-fade',t.fade+'ms');sp.style.setProperty('--o-flyback',t.flyBack+'ms');
 if(t.reduce)sp.classList.add('rm');
 const add=(cls)=>{const i=document.createElement('i');i.className=cls;i.setAttribute('aria-hidden','true');sp.insertBefore(i,sp.querySelector('.bs-page'));return i;};
 add('bs-blk l');add('bs-blk r');
 const rb=document.createElement('i');rb.className='bs-ribbon';rb.setAttribute('aria-hidden','true');sp.appendChild(rb);
}
/* The closing thud: a tiny drop of the whole book as the cover lands. */
export function thud(sp){
 sp.classList.add('shut');bookSound('thud');
 setTimeout(()=>sp.classList.remove('shut'),260);
}
