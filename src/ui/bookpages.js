/* Paged book view. Shelf, Sets and Stats render their content as "leaves" (one HTML string per page) and this
   module lays them out on a two-page parchment spread (one page on narrow screens) with page-turn controls,
   a page indicator and arrow-key turning. Content builders live next to their features; this file knows
   nothing about shelves, sets or stats. */

export const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* Split a list into pages of at most `per` items (always at least one page). */
export function chunk(list,per){
 const out=[];for(let i=0;i<list.length;i+=per)out.push(list.slice(i,i+per));
 return out.length?out:[[]];
}
/* Page indicator text for the leaf at `i` of `n`, on a spread (two leaves) or single page. */
export function pageLabel(i,n,single){
 if(single||i+1>=n)return `Page ${i+1} of ${n}`;
 return `Pages ${i+1}–${i+2} of ${n}`;
}
/* Leaf index to show after a turn, snapped to the spread grid. */
export function turnTo(i,n,single,dir){
 const step=single?1:2,j=(single?i:i-i%2)+dir*step;
 return Math.max(0,Math.min(single?n-1:Math.max(0,n-1-(n-1)%2),j));
}

/* layer: the fixed backdrop element (#all, #stats, #sets). Returns a controller.
   opts: {label, colors:[leather,dark,gilt], leaves:[html], leaf, onClose, onRender(root), cls} */
export function openBook(layer,opts){
 const mq=typeof matchMedia==='function'?matchMedia('(max-width:700px)'):{matches:false};
 let leaves=opts.leaves,leaf=opts.leaf||0,dir=0;
 const [bk,bk2,gild]=opts.colors||['#5b3a1d','#2d1c0d','#d8b676'];
 layer.hidden=false;
 layer.innerHTML=`<div class="bkv ${opts.cls||''}" role="dialog" aria-modal="true" aria-label="${esc(opts.label)}" style="--bk:${bk};--bk2:${bk2};--bk-gild:${gild}">
  <button class="bkv-x" aria-label="Close">×</button>
  <div class="bkv-spread"><section class="bkv-leaf l"></section><section class="bkv-leaf r"></section><i class="bkv-gutter" aria-hidden="true"></i></div>
  <nav class="bkv-nav" aria-label="Pages"><button class="bkv-prev" aria-label="Previous page">‹</button><span class="bkv-ind" aria-live="polite"></span><button class="bkv-next" aria-label="Next page">›</button></nav></div>`;
 const root=layer.firstElementChild,L=root.querySelector('.l'),R=root.querySelector('.r'),ind=root.querySelector('.bkv-ind');
 const prev=root.querySelector('.bkv-prev'),next=root.querySelector('.bkv-next');
 const single=()=>mq.matches;
 const folio=(n,html)=>html==null?'':`${html}<footer class="bkv-folio">${n+1}</footer>`;
 function paint(){
  const s=single(),n=leaves.length;
  leaf=Math.max(0,Math.min(leaf,n-1));if(!s)leaf-=leaf%2;
  L.innerHTML=folio(leaf,leaves[leaf]);
  R.innerHTML=s?'':(leaf+1<n?folio(leaf+1,leaves[leaf+1]):'<div class="bkv-blank" aria-hidden="true"></div>');
  R.hidden=s;
  root.classList.toggle('single',s);
  [L,R].forEach(p=>{p.scrollTop=0;});
  ind.textContent=pageLabel(leaf,n,s);
  prev.disabled=leaf<=0;next.disabled=s?leaf>=n-1:leaf+2>=n;
  if(dir){const p=dir>0?R:L;p.classList.remove('turn-f','turn-b');void p.offsetWidth;p.classList.add(dir>0?'turn-f':'turn-b');if(s){L.classList.remove('turn-f','turn-b');void L.offsetWidth;L.classList.add(dir>0?'turn-f':'turn-b');}dir=0;}
  if(opts.onRender)opts.onRender(root,ctl);
 }
 const ctl={
  root,get leaf(){return leaf;},
  go(i){dir=i>leaf?1:i<leaf?-1:0;leaf=i;paint();},
  turn(d){const j=turnTo(leaf,leaves.length,single(),d);if(j!==leaf)ctl.go(j);},
  /* swap content in place (filters, search); keepLeaf stays on the same page */
  setLeaves(l,keepLeaf){leaves=l;if(!keepLeaf)leaf=0;paint();},
  close(){layer.hidden=true;layer.innerHTML='';layer.onclick=null;layer.onkeydown=null;mq.removeEventListener&&mq.removeEventListener('change',paint);if(opts.onClose)opts.onClose();}
 };
 prev.onclick=()=>ctl.turn(-1);next.onclick=()=>ctl.turn(1);
 root.querySelector('.bkv-x').onclick=ctl.close;
 layer.onclick=e=>{if(e.target===layer)ctl.close();};
 layer.onkeydown=e=>{
  if(e.target.closest&&e.target.closest('input,textarea,select'))return;
  if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();ctl.turn(1);}
  else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();ctl.turn(-1);}
 };
 mq.addEventListener&&mq.addEventListener('change',paint);
 root.classList.add('opening');
 paint();
 root.querySelector('.bkv-x').focus({preventScroll:true});
 return ctl;
}
