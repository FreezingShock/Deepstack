/* Page-flip affordances for the open menu books: a soft paper curl in each outer bottom corner,
   page-edge thickness that shows how many pages lie either side, a handwritten "turn the page" cue on
   the first page, and a short tug of the curl the first few times a book is opened.
   Styling lives in pageFlip.css; the leaf animation itself is in home.js. */
const CURL='<i aria-hidden="true"><u></u><b></b></i>';
const CUE='<span class="bs-cue" aria-hidden="true">turn the page<svg viewBox="0 0 44 22" width="44" height="22"><path d="M2 14 C 12 2, 28 2, 40 12 M33 5 L40 12 L30 15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
export const cornersHTML=()=>`<button class="bs-corner prev" aria-label="Previous page" hidden>${CURL}</button><button class="bs-corner next" aria-label="Next page" hidden>${CURL}${CUE}</button>`;

const EDGE_MAX=9,edgePx=n=>n<=0?0:Math.min(EDGE_MAX,3+n*1.4);
/* at = index of the page (or spread) now showing, m = how many there are */
export function paintEdges(sp,at,m){
  sp.style.setProperty('--edge-p',edgePx(at)+'px');
  sp.style.setProperty('--edge-n',edgePx(m-1-at)+'px');
  sp.classList.toggle('can-cue',m>1&&at===0&&!sp.classList.contains('turned'));
}
export const noteTurned=sp=>{sp.classList.add('turned');sp.classList.remove('can-cue');};

/* the first few books opened tug at the curl twice, so it is obvious the page can be turned */
const KEY='deepstack.flipHint',MAX_HINTS=3;
let hintedNow=false;
export function hintCurl(sp,reduce){
  if(reduce||hintedNow)return;
  let n=0;try{n=+localStorage.getItem(KEY)||0;}catch{}
  if(n>=MAX_HINTS)return;
  const c=sp.querySelector('.bs-corner.next:not([disabled]):not([hidden])');if(!c)return;
  hintedNow=true;try{localStorage.setItem(KEY,String(n+1));}catch{}
  c.classList.add('tug');
  c.addEventListener('animationend',()=>c.classList.remove('tug'),{once:true});
}
