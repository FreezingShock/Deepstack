/* The attic above the Shelf. Scroll up past the top of the Shelf book (wheel, ArrowUp, swipe down, or the pencilled
   cue) and the attic lowers over the pages: rafters, a skylight, crates of earlier finds. Scroll down past the last
   crate, press Escape, or take the ladder button to come back. Hooks into the shelf book's onPaint. */
import {atticItems,atticCrates} from '../core/attic.js';

const reduce=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X'];

/* deps: {S, esc, book(x)->html for one spine, collapse(list)->[{b,i,n}], openCard, showTip, hideTip} */
export function atticHTML(items,deps){
 const crates=atticCrates(items);
 const html=crates.map((c,k)=>{
  const list=deps.collapse(c.items),stacks=[];
  for(let i=0;i<list.length;i+=4)stacks.push(list.slice(i,i+4));
  return `<section class="at-crate"><div class="at-tag"><span>${deps.esc(c.label)}${c.cont?' · cont.':''}</span><small>Crate ${ROMAN[k]||k+1}</small></div><div class="sshelf at-shelf">${stacks.map(s=>`<div class="sstack">${s.map(deps.book).join('')}</div>`).join('')}</div></section>`;
 }).join('');
 return `<div class="at-beams" aria-hidden="true"><i></i><i></i><i></i></div><div class="at-sky" aria-hidden="true"><b></b><u></u><u></u><u></u><u></u><u></u></div>
  <div class="at-scroll" tabindex="-1"><header class="at-head"><h1>The Attic</h1><p>Earlier finds, from before the library marked what floor you found them on. Dusty, but still yours.</p><div class="kicker">${items.length} ${items.length===1?'book':'books'}</div></header>${html}
  <footer class="at-foot"><button class="at-down" type="button">Down the ladder ↓</button></footer></div>`;
}

export function bindAttic(sp,ctl,deps){
 const {S}=deps;
 const items=atticItems(S.shelf);
 let st=sp._attic;
 if(!st){
  const layer=document.createElement('div');layer.className='attic';layer.hidden=true;layer.setAttribute('role','region');layer.setAttribute('aria-label','The attic');
  const cue=document.createElement('button');cue.type='button';cue.className='attic-cue';cue.hidden=true;
  sp.append(layer,cue);
  st=sp._attic={layer,cue,open:false,items:[],deps};
  const open=()=>{if(st.open||!st.items.length)return;st.open=true;layer.innerHTML=atticHTML(st.items,st.deps);layer.hidden=false;
   layer.style.setProperty('--n',st.items.length);sp.classList.add('attic-on');layer.getBoundingClientRect();layer.classList.add('up');
   const sc=layer.querySelector('.at-scroll');sc.scrollTop=0;sc.focus({preventScroll:true});
   st.deps.hideTip();wire();};
  const close=()=>{if(!st.open)return;st.open=false;layer.classList.remove('up');sp.classList.remove('attic-on');
   const end=()=>{if(!st.open)layer.hidden=true;};reduce()?end():setTimeout(end,480);
   const f=sp.querySelector('.pg-in button,.pg-in input');if(f)f.focus({preventScroll:true});};
  st.openAttic=open;st.closeAttic=close;
  const wire=()=>{
   layer.querySelector('.at-down').onclick=close;
   layer.querySelectorAll('.sbook').forEach(im=>{
    im.onclick=()=>{st.deps.hideTip();const flat=st.items.map(x=>x.b),b=st.deps.S.shelf[+im.dataset.i];st.deps.openCard(b,{fresh:false,nav:{items:flat,i:flat.indexOf(b)}});};
    im.onmouseenter=im.onmousemove=e=>st.deps.showTip(im.dataset.tip,e.clientX,e.clientY);im.onmouseleave=st.deps.hideTip;
   });
  };
  cue.onclick=open;
  const atTop=t=>{for(let e=t;e&&e!==sp;e=e.parentElement)if(e.scrollTop>0)return false;return true;};
  sp.addEventListener('wheel',e=>{
   if(!st.open){if(e.deltaY<-2&&ctl.index===0&&st.items.length&&atTop(e.target)){e.preventDefault();open();}return;}
   const sc=layer.querySelector('.at-scroll');
   if(e.deltaY>2&&sc.scrollTop+sc.clientHeight>=sc.scrollHeight-2){e.preventDefault();close();}
  },{passive:false});
  /* swipe down on the first page lifts you up; swipe up at the bottom of the attic puts you back */
  let sw=null;
  sp.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.target.closest('input,textarea,select,button,a,.bs-corner,.sbook'))return;sw={y:e.clientY,x:e.clientX};});
  sp.addEventListener('pointerup',e=>{if(!sw)return;const dy=e.clientY-sw.y,dx=e.clientX-sw.x;sw=null;if(Math.abs(dy)<60||Math.abs(dy)<Math.abs(dx)*1.5)return;
   const sc=layer.querySelector('.at-scroll');
   if(!st.open&&dy>0&&ctl.index===0&&st.items.length&&atTop(e.target))open();else if(st.open&&dy<0&&sc&&sc.scrollTop+sc.clientHeight>=sc.scrollHeight-2)close();});
  const key=e=>{
   if(!sp.isConnected){removeEventListener('keydown',key,true);return;}
   if(e.target.closest&&e.target.closest('input,textarea,select'))return;
   if(st.open&&e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault();close();}
   else if(!st.open&&e.key==='ArrowUp'&&ctl.index===0&&st.items.length&&!(sp.querySelector('.bs-page.l .pg-in')||{}).scrollTop){e.preventDefault();open();}
   else if(st.open&&(e.key==='ArrowLeft'||e.key==='ArrowRight'))e.stopImmediatePropagation();
  };
  addEventListener('keydown',key,true);
 }
 st.deps=deps;st.items=items;
 st.cue.hidden=!items.length||ctl.index!==0||st.open;
 st.cue.textContent=`↑ The attic · ${items.length}`;
 st.cue.setAttribute('aria-label',`Climb up to the attic: ${items.length} earlier ${items.length===1?'find':'finds'}`);
 if(st.open&&!items.length)st.closeAttic();
}
