/* Getting into the attic from home. The attic is a room in the world canvas above the top shelves (world/atticRoom.js),
   not part of the Shelf book. Scroll up (wheel, swipe down, ArrowUp) or take the ladder cue to climb in; wheel down,
   swipe up, ArrowDown, Escape or "Down the ladder" to come back. One cue and one ladder button live on the page for
   the whole session; bindAtticHome only refreshes what they say. */
import {World} from '../world/world.js';
import {Sfx} from '../feel.js';
import {atticAll,atticTidy} from '../core/attic.js';
import {fitRail,initRailFit} from './railFit.js';
import './attic.css';
import {motionNow} from './settings.js';

let cue=null,down=null,home=null,count=0,wired=false,depthEl=null,pulling=0;
const WHEEL_STEP=70,ROW_REST=420;
const PULL_MS=520; // cord pull + lid swing + light on the panel, then the climb starts
const reduced=()=>motionNow();
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
 fitRail();
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
 paintCue();initRailFit();
 World.setAttic(false,{instant:true});World.onAttic(sync);sync(false);
 World.onAtticMove(rideHome);
 if(!wired){wired=true;
  /* One notch, one row. Wheel and trackpad deltas add up until they pass a small threshold, then move a single row and
     rest a moment so momentum cannot carry you on. While the climb is still under way nothing moves rows: up is
     ignored (it is usually the momentum of the scroll that opened the attic) and down turns round at once. */
  let acc=0,accAt=0,restUntil=0;
  addEventListener('wheel',e=>{
   if(World.atticOpen){
    const d=Math.max(-160,Math.min(160,e.deltaY)),now=performance.now();
    if(!World.atticReady){if(d>1)close();return;}
    if(now<restUntil||Math.abs(d)<1)return;
    if(now-accAt>180||Math.sign(acc)!==Math.sign(d))acc=0;
    accAt=now;acc+=d;
    if(acc<=-WHEEL_STEP){acc=0;if(World.atticGo(1))restUntil=now+ROW_REST;}
    else if(acc>=WHEEL_STEP/2){acc=0;if(World.atticGo(-1))restUntil=now+ROW_REST;else close();}
   }else if(pulling&&e.deltaY>2)cancelPull();
   else if(e.deltaY<-2&&count&&ui().live)open();},{passive:true});
  addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea,select'))return;
   if(World.atticOpen){
    if(e.key==='ArrowUp'){e.stopImmediatePropagation();if(World.atticReady)World.atticGo(1);}
    else if(e.key==='ArrowDown'){e.stopImmediatePropagation();if(!World.atticReady||!World.atticGo(-1))close();}
    else if(e.key==='Escape'){e.stopImmediatePropagation();close();}
   }
   else if(e.key==='ArrowUp'&&count&&ui().live)open();},true);
  let y0=null;
  addEventListener('pointerdown',e=>{y0=e.pointerType==='mouse'||e.target.closest('button,a,input,textarea,select')?null:e.clientY;});
  addEventListener('pointerup',e=>{if(y0==null)return;const dy=e.clientY-y0;y0=null;
   if(World.atticOpen){if(!World.atticReady){if(dy<-30)close();}else if(dy>60)World.atticGo(1);else if(dy<-40&&!World.atticGo(-1))close();}else if(dy>60&&count&&ui().live)open();});
}
}
/* Click the hatch: the cord is pulled, the lid swings down and warm light falls onto the panel (CSS, class "pulling"),
   then the climb starts. Reduced motion skips the show and climbs at once. */
/* sound palette: the hatch creaks, then a wooden rung under each hand (silent under reduced motion) */
let rungT=0;
const rungs=n=>{if(reduced())return;for(let i=0;i<n;i++)setTimeout(()=>Sfx.cue('rung'),i*210);};
function open(){
 if(!count||!ui().live||pulling)return;
 if(reduced()||!cue){World.setAttic(true);return;}
 Sfx.cue('hatch');rungT=setTimeout(()=>rungs(5),PULL_MS);
 cue.classList.add('pulling');document.documentElement.classList.add('attic-lit');
 pulling=setTimeout(()=>{pulling=0;World.setAttic(true);if(!World.atticOpen)cue.classList.remove('pulling');document.documentElement.classList.remove('attic-lit');},PULL_MS);
}
/* scrolling back down while the cord is still being pulled puts the lid back; nothing climbs */
function cancelPull(){clearTimeout(pulling);clearTimeout(rungT);pulling=0;if(cue)cue.classList.remove('pulling');document.documentElement.classList.remove('attic-lit');}
function close(){if(World.atticOpen)rungs(4);World.setAttic(false);}
