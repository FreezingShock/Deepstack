/* Reaching the attic from the home screen. Recent guesses no longer stand on the top shelf under the alcove; they
   live in the attic. A pencilled cue at the top of home (and wheel-up, swipe-down, ArrowUp) opens the Shelf book
   with the attic already raised. Hooked in from app/home.js. */
import {openShelfInAttic} from './attic.js';

export function bindAtticHome(home,{count=0,openShelf}){
 home.querySelector('.attic-home')?.remove();
 if(!count||!openShelf)return;
 const go=()=>{if(home.classList.contains('book-opening'))return;openShelfInAttic();openShelf();};
 const cue=document.createElement('button');cue.type='button';cue.className='attic-home';
 cue.textContent=`↑ The attic · ${count}`;cue.setAttribute('aria-label',`Climb up to the attic: your ${count===1?'latest guess':'latest guesses'}`);
 cue.onclick=go;home.append(cue);
 const live=()=>!home.hidden&&home.isConnected&&!document.querySelector('.bk-spread');
 const wheel=e=>{if(!home.isConnected){removeEventListener('wheel',wheel);return;}if(live()&&e.deltaY<-2)go();};
 const key=e=>{if(!home.isConnected){removeEventListener('keydown',key);return;}
  if(live()&&e.key==='ArrowUp'&&!(e.target.closest&&e.target.closest('input,textarea,select')))go();};
 let y0=null;
 const down=e=>{y0=e.target.closest('button,a,input')?null:e.clientY;};
 const up=e=>{if(y0!=null&&live()&&e.clientY-y0>70)go();y0=null;};
 addEventListener('wheel',wheel,{passive:true});addEventListener('keydown',key);
 home.addEventListener('pointerdown',down);home.addEventListener('pointerup',up);
}
