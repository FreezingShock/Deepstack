/* Getting into the attic from home. The attic is a room in the world canvas above the top shelves (world/atticRoom.js),
   not part of the Shelf book. Scroll up (wheel, swipe down, ArrowUp) or take the ladder cue to climb in; wheel down,
   swipe up, ArrowDown, Escape or "Down the ladder" to come back. One cue and one ladder button live on the page for
   the whole session; bindAtticHome only refreshes what they say. */
import {World} from '../world/world.js';
import {atticAll} from '../core/attic.js';
import './attic.css';

let cue=null,down=null,home=null,count=0,wired=false;
const ui=()=>({live:!!home&&!home.hidden&&home.isConnected&&World.canAttic&&!document.querySelector('.bk-spread,[role=dialog]:not([hidden]),#cardlayer.on')});
function sync(open){
 if(home)home.classList.toggle('attic-away',open);
 if(home)home.toggleAttribute('inert',open);
 if(cue)cue.hidden=open||!count||!(home&&!home.hidden);
 if(down)down.hidden=!open;
 if(open&&down)down.focus({preventScroll:true});
}
export function bindAtticHome(homeEl,{shelf=[]}={}){
 home=homeEl;
 const items=atticAll(shelf);count=items.length;
 World.setAtticItems(items);
 if(!cue){
  cue=document.createElement('button');cue.type='button';cue.className='attic-cue-home';
  down=document.createElement('button');down.type='button';down.className='attic-down';down.textContent='Down the ladder ↓';down.hidden=true;
  homeEl.after(cue,down); // siblings of #home, so CSS hides them whenever home is hidden
  cue.onclick=()=>open();down.onclick=()=>close();
 }
 cue.textContent=`↑ The attic · ${count}`;
 cue.setAttribute('aria-label',`Climb up to the attic: ${count} ${count===1?'book':'books'}`);
 World.setAttic(false,{instant:true});World.onAttic(sync);sync(false);
 if(!wired){wired=true;
  addEventListener('wheel',e=>{if(World.atticOpen){if(e.deltaY>2)close();}else if(e.deltaY<-2&&count&&ui().live)open();},{passive:true});
  addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea,select'))return;
   if(World.atticOpen){if(e.key==='Escape'||e.key==='ArrowDown'){e.stopImmediatePropagation();close();}}
   else if(e.key==='ArrowUp'&&count&&ui().live)open();},true);
  let y0=null;
  addEventListener('pointerdown',e=>{y0=e.pointerType==='mouse'||e.target.closest('button,a,input,textarea,select')?null:e.clientY;});
  addEventListener('pointerup',e=>{if(y0==null)return;const dy=e.clientY-y0;y0=null;
   if(World.atticOpen){if(dy<-60)close();}else if(dy>60&&count&&ui().live)open();});
 }
}
function open(){if(count&&ui().live)World.setAttic(true);}
function close(){World.setAttic(false);}
