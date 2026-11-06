/* Getting into the attic from home. The attic is a room in the world canvas above the top shelves (world/atticRoom.js),
   not part of the Shelf book. Scroll up (wheel, swipe down, ArrowUp) or take the ladder cue to climb in; wheel down,
   swipe up, ArrowDown, Escape or "Down the ladder" to come back. One cue and one ladder button live on the page for
   the whole session; bindAtticHome only refreshes what they say. */
import {World} from '../world/world.js';
import {atticAll,atticTidy} from '../core/attic.js';
import {deferAfterPaint} from '../core/boot.js';
import './attic.css';

let warmed=false,cue=null,down=null,home=null,count=0,wired=false,depthEl=null,pulling=0;
const PULL_MS=520; // cord pull + lid swing + light on the panel, then the climb starts
const reduced=()=>{const r=document.documentElement,m=r.getAttribute('data-motion');return m==='reduce'||(m!=='full'&&matchMedia('(prefers-reduced-motion:reduce)').matches);};
const ui=()=>({live:!!home&&!home.hidden&&home.isConnected&&World.canAttic&&!document.querySelector('.bk-spread,[role=dialog]:not([hidden]),#cardlayer.on')});
function sync(open){
 if(home)home.classList.toggle('attic-away',open);
 if(home)home.toggleAttribute('inert',open);
 if(cue){cue.hidden=open||!count||!(home&&!home.hidden);if(open||cue.hidden){clearTimeout(pulling);pulling=0;if(!open)cue.classList.remove('pulling');}}
 document.documentElement.classList.toggle('attic-lit',!!pulling);
 if(down)down.hidden=!open;
 if(open&&down)down.focus({preventScroll:true});
 if(depthEl)depthEl.hidden=!open||World.atticRows<2;
 if(open){const i=World.atticRow;showSection(i,World.atticRows,World.atticRowTitle(i));}
}
/* A quiet line low on the screen: which section you are in. Hidden when there is only one. */
function showSection(i,n,title){
 if(!depthEl)return;
 depthEl.hidden=!World.atticOpen||n<2;
 depthEl.textContent=i+1<n?`${title} · row ${i+1} of ${n} · scroll up to go further in ↑`:`${title} · row ${i+1} of ${n} · the back of the attic`;
}
/* The home panel sits in the alcove, which is part of the world. While the camera climbs, move the panel by exactly the
   same pixels as the world (same frame, same easing) so it stays inside the alcove instead of sliding on its own clock. */
function rideHome(px,t){
 if(!home)return;
 if(px<=0){home.style.transform='';home.style.opacity='';return;}
 home.style.transform=`translate3d(0,${px.toFixed(1)}px,0)`;
 home.style.opacity=String(Math.max(0,1-t*1.7));
}
/* The entrance: a trapdoor set into the ceiling beam, centred, with a pull cord and a brass tag that carries the count.
   It is a real <button> (focusable, Enter/Space) but nothing about it looks like one. */
function paintCue(){
 if(!cue)return;
 if(!cue.firstChild)cue.innerHTML='<span class="ach-hatch" aria-hidden="true"><span class="ach-glow"></span><span class="ach-lid"><span class="ach-word">Attic</span></span></span>'
  +'<span class="ach-cord" aria-hidden="true"><span class="ach-rope"></span><span class="ach-tag"><b></b></span></span>';
 cue.querySelector('.ach-tag b').textContent=count;
 cue.setAttribute('aria-label',`Pull the cord and climb up to the attic: ${count} ${count===1?'book':'books'}`);
}
/* After a book is dusted off: re-list what the attic holds and refresh the entrance. */
export function refreshAttic(shelf){
 const items=atticTidy(atticAll(shelf));count=items.length;World.setAtticItems(items);paintCue();
}
export function bindAtticHome(homeEl,{shelf=[]}={}){
 home=homeEl;
 const items=atticTidy(atticAll(shelf));count=items.length;
 World.setAtticItems(items);
 if(items.length&&!warmed){warmed=true;deferAfterPaint(()=>{World.prewarmAttic(0);return deferAfterPaint(()=>World.prewarmAttic(1),1500);},1500).catch(()=>{});}
 if(!depthEl){depthEl=document.createElement('div');depthEl.className='attic-depth';depthEl.hidden=true;depthEl.setAttribute('aria-live','polite');homeEl.after(depthEl);}
 World.onAtticRow(showSection);
 if(!cue){
  cue=document.createElement('button');cue.type='button';cue.className='attic-cue-home';
  down=document.createElement('button');down.type='button';down.className='attic-down';down.hidden=true;
  down.innerHTML='<span class="adl-frame" aria-hidden="true"></span><span class="adl-ladder" aria-hidden="true"><i class="adl-rail"></i><i class="adl-rail"></i></span><span class="adl-word">Down the ladder</span>';
  down.setAttribute('aria-label','Down the ladder');
  const beam=document.createElement('div');beam.className='attic-beam';beam.setAttribute('aria-hidden','true');
  homeEl.after(cue,down,beam); // siblings of #home, so CSS hides them whenever home is hidden
  cue.onclick=()=>open();down.onclick=()=>close();
}
 paintCue();
 World.setAttic(false,{instant:true});World.onAttic(sync);sync(false);
 World.onAtticMove(rideHome);
 if(!wired){wired=true;
  addEventListener('wheel',e=>{
   if(World.atticOpen){
    /* scrolling up keeps climbing through the sections (one whole section per notch of a pause); down comes back, and out from the first */
    const d=Math.max(-160,Math.min(160,e.deltaY));
    if(d<-1)World.atticGo(-d/110);
    else if(d>1&&!World.atticGo(-d/110)&&e.deltaY>2)close();
   }else if(e.deltaY<-2&&count&&ui().live)open();},{passive:true});
  addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea,select'))return;
   if(World.atticOpen){
    if(e.key==='ArrowUp'){if(World.atticStep(1))e.stopImmediatePropagation();}
    else if(e.key==='ArrowDown'){e.stopImmediatePropagation();if(!World.atticStep(-1))close();}
    else if(e.key==='Escape'){e.stopImmediatePropagation();close();}
   }
   else if(e.key==='ArrowUp'&&count&&ui().live)open();},true);
  let y0=null;
  addEventListener('pointerdown',e=>{y0=e.pointerType==='mouse'||e.target.closest('button,a,input,textarea,select')?null:e.clientY;});
  addEventListener('pointerup',e=>{if(y0==null)return;const dy=e.clientY-y0;y0=null;
   if(World.atticOpen){if(dy>60)World.atticStep(1);else if(dy<-60&&!World.atticStep(-1))close();}else if(dy>60&&count&&ui().live)open();});
}
}
/* Click the hatch: the cord is pulled, the lid swings down and warm light falls onto the panel (CSS, class "pulling"),
   then the climb starts. Reduced motion skips the show and climbs at once. */
function open(){
 if(!count||!ui().live||pulling)return;
 if(reduced()||!cue){World.setAttic(true);return;}
 cue.classList.add('pulling');document.documentElement.classList.add('attic-lit');
 pulling=setTimeout(()=>{pulling=0;World.setAttic(true);if(!World.atticOpen)cue.classList.remove('pulling');document.documentElement.classList.remove('attic-lit');},PULL_MS);
}
function close(){World.setAttic(false);}
