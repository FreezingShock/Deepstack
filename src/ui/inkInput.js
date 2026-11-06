/* Quill and ink for the answer slip. The real <textarea> stays (IME, mobile keyboards, selection, scrolling all keep working);
   its letters are made transparent and an aria-hidden mirror draws the same text on top. Letters typed in the last moment are
   "wet" (dark, glossy) and settle to dry ink; a small quill rests at the caret; Enter drops a blotter over the slip.
   Pure helpers (editRange, inkRuns) are exported for tests. */
export const DRY_MS=1000;
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/** What changed between two strings: common prefix/suffix, so `births` can be spliced in step with the text. */
export function editRange(a,b){
 let s=0;const m=Math.min(a.length,b.length);
 while(s<m&&a.charCodeAt(s)===b.charCodeAt(s))s++;
 let e=0;
 while(e<m-s&&a.charCodeAt(a.length-1-e)===b.charCodeAt(b.length-1-e))e++;
 return {at:s,removed:a.length-s-e,added:b.length-s-e};
}
/** Splice birth times: removed letters go, added letters are born `now`, the rest keep their age. */
export function nextBirths(births,prev,next,now){
 const {at,removed,added}=editRange(prev,next);
 const out=births.slice(0,at);for(let i=0;i<added;i++)out.push(now);
 return out.concat(births.slice(at+removed));
}
/** Split text into runs: dry text is one string, wet letters carry how old they are. */
export function inkRuns(text,births,now,dry=DRY_MS){
 const runs=[];
 for(let i=0;i<text.length;i++){
  const age=now-(births[i]??-1e9),wet=age<dry;
  const last=runs[runs.length-1];
  if(!wet){if(last&&last.age==null)last.t+=text[i];else runs.push({t:text[i],age:null});}
  else runs.push({t:text[i],age:Math.max(0,age)});
 }
 return runs;
}
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function runsHtml(runs){
 return runs.map(r=>r.age==null?esc(r.t):`<b class="wet" style="animation-delay:${-Math.round(r.age)}ms">${esc(r.t)}</b>`).join('');
}

const NIB='<i class="ink-nib" aria-hidden="true"><svg viewBox="0 0 24 40" width="22" height="36"><path d="M2 38 L7 30 C4 20 8 8 22 1 C21 14 17 24 11 31 Z" class="vane"/><path d="M2 38 L10 29 M21 2 C14 12 9 22 8 30" class="rib"/></svg></i>';

/** Dress the slip around `ta`. Returns a teardown (used by tests; the run screen is rebuilt each word). */
// Slips whose page listeners are still on. The run screen is rebuilt each word without calling the teardown, so a slip that
// has left the page is torn down here (on the next attach or the next page event): its document/window listeners used to keep
// every old slip, mirror and textarea alive for the whole session (~100 DOM nodes and 2 listeners per word).
const live=new Set();
const sweep=()=>{for(const t of live)if(!t.ta.isConnected)t.off();};
export function attachInk(ta){
 sweep();
 const slip=ta&&ta.closest&&ta.closest('.slip');if(!slip||slip.querySelector('.ink-mirror'))return ()=>{};
 const mir=document.createElement('div');mir.className='ink-mirror';mir.setAttribute('aria-hidden','true');
 slip.insertBefore(mir,ta.nextSibling);slip.classList.add('ink-on');
 let births=[],prev=ta.value,timer=0;
 const fit=()=>{const cs=getComputedStyle(ta);
  Object.assign(mir.style,{top:ta.offsetTop+'px',left:ta.offsetLeft+'px',width:ta.offsetWidth+'px',height:ta.offsetHeight+'px',
   font:cs.font,lineHeight:cs.lineHeight,padding:cs.padding,letterSpacing:cs.letterSpacing});};
 const paint=()=>{
  clearTimeout(timer);const now=performance.now(),v=ta.value;
  const caret=Math.min(v.length,ta.selectionEnd??v.length),focus=document.activeElement===ta;
  const html=(i,j)=>runsHtml(inkRuns(v.slice(i,j),births.slice(i,j),now));
  mir.innerHTML=html(0,caret)+(focus?NIB:'')+html(caret,v.length)+'​';
  mir.classList.toggle('is-empty',!v);
  mir.scrollTop=ta.scrollTop;
  if(births.some(b=>now-b<DRY_MS)&&!reduced())timer=setTimeout(paint,DRY_MS);
 };
 const onInput=()=>{births=nextBirths(births,prev,ta.value,performance.now());prev=ta.value;paint();
  // keep the quill in view when the answer is long
  const nib=mir.querySelector('.ink-nib');if(nib&&nib.offsetTop+nib.offsetHeight>ta.scrollTop+ta.clientHeight)ta.scrollTop=nib.offsetTop;mir.scrollTop=ta.scrollTop;};
 const onKey=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&ta.value.trim()&&!reduced()){const w=slip.closest('.slipwrap');if(w)w.classList.add('blot');}};
 const sync=()=>{fit();paint();};
 ta.addEventListener('input',onInput);ta.addEventListener('keydown',onKey);
 ta.addEventListener('scroll',()=>{mir.scrollTop=ta.scrollTop;});
 ta.addEventListener('focus',paint);ta.addEventListener('blur',paint);
 const ac=new AbortController(),on={signal:ac.signal};
 const off=()=>{ac.abort();clearTimeout(timer);live.delete(rec);ta.removeEventListener('input',onInput);ta.removeEventListener('keydown',onKey);};
 const rec={ta,off};live.add(rec);
 document.addEventListener('selectionchange',()=>{if(!ta.isConnected)return off();if(document.activeElement===ta)paint();},on);
 addEventListener('resize',()=>{if(!ta.isConnected)return off();sync();},on);
 requestAnimationFrame(sync);
 return ()=>{off();mir.remove();slip.classList.remove('ink-on');};
}
