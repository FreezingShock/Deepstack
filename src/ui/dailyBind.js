/* Binding the Daily: when a fresh Daily ends and you climb back home, the seven spines from the results sheet fly
   into the Daily book on the stack and a dated tab slides out of it. Any key or press skips to the end state; reduced
   motion drops the flight and just places the tab. The tab stays on the book for the rest of that day (home.js calls
   placeDailyTab on every render). Uniform motion language (#125): one ease, staggered, nothing bouncy. */
import {TIERS} from '../core/tiers.js';

const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const EASE='cubic-bezier(.2,.8,.2,1)';
export const tabLabel=key=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(key||'');return m?`${+m[3]} ${MON[+m[2]-1]}`:'';};
export const bindTimings=(n=7,reduce=false)=>reduce?{stagger:0,fly:0,tab:0,total:0}
 :{stagger:90,fly:520,tab:260,total:90*Math.max(0,n-1)+520+260};
export const isDailyRun=d=>!!d&&d.mode!=='unlimited'&&d.mode!=='riddle'&&d.mode!=='weekly'&&!d.practice;

const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
export let binding=false;

/* Rects and images of the spines on the results sheet, read before that sheet is hidden. */
export function snapSpines(root=document){
 return [...root.querySelectorAll('#sp img')].map(im=>{const r=im.getBoundingClientRect();return {src:im.currentSrc||im.src,x:r.left,y:r.top,w:r.width,h:r.height};}).filter(s=>s.w>0&&s.h>0);
}
export function beginBind(){binding=true;}

export function placeDailyTab(home,d,day,{animate=false}={}){
 const book=home&&home.querySelector('#bDaily');if(!book||!d||binding&&!animate)return null;
 book.querySelector('.dly-tab')?.remove();
 const t=document.createElement('span');t.className='dly-tab';t.setAttribute('aria-hidden','true');
 t.textContent=tabLabel(day);t.style.setProperty('--tab',(TIERS[d.best]||TIERS[0]).spine);
 if(animate)t.classList.add('pre');
 book.appendChild(t);
 if(animate)requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.remove('pre')));
 return t;
}

export async function playBind(spines,home,d,day){
 binding=false;
 const book=home&&home.querySelector('#bDaily');
 if(!book)return;
 if(reduced()||!spines.length||!book.getBoundingClientRect||!book.animate){placeDailyTab(home,d,day);return;}
 const br=book.getBoundingClientRect(),T=bindTimings(spines.length);
 const layer=document.createElement('div');layer.className='dly-bind';layer.setAttribute('aria-hidden','true');document.body.appendChild(layer);
 const tx=br.left+br.width*0.78,ty=br.top+br.height/2;
 const anims=spines.map((s,i)=>{
  const im=document.createElement('img');im.src=s.src;im.alt='';im.className='dly-fly';
  Object.assign(im.style,{left:s.x+'px',top:s.y+'px',width:s.w+'px',height:s.h+'px'});layer.appendChild(im);
  const dx=tx-(s.x+s.w/2),dy=ty-(s.y+s.h/2),sc=Math.min(.5,(br.height*.9)/s.h);
  return im.animate([{transform:'none',opacity:1},{transform:`translate(${dx*.6}px,${dy*.6-18}px) scale(${(1+sc)/2})`,opacity:1,offset:.6},{transform:`translate(${dx}px,${dy}px) scale(${sc})`,opacity:0}],
   {duration:T.fly,delay:i*T.stagger,easing:EASE,fill:'both'});
 });
 let done=false,finish;
 const end=()=>{if(done)return;done=true;off();anims.forEach(a=>{try{a.cancel();}catch{}});layer.remove();
  placeDailyTab(home,d,day,{animate:true});};
 const skip=e=>{if(e.type==='keydown'&&e.repeat)return;end();};
 const off=()=>{removeEventListener('keydown',skip,true);removeEventListener('pointerdown',skip,true);};
 addEventListener('keydown',skip,true);addEventListener('pointerdown',skip,true);
 await Promise.all(anims.map(a=>a.finished.catch(()=>{}))).then(()=>{if(!done){book.animate([{filter:'brightness(1)'},{filter:'brightness(1.3)'},{filter:'brightness(1)'}],{duration:T.tab+120,easing:EASE});end();}});
}
