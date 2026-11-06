/* Walking to another room from home (side doors, [ and ], the ring of lights, the Rooms book): the room slides away
   from the door you took while the fire takes the new salt's colour, then the new room is drawn and slides in. */
import {S} from './state.js';
import {ui} from './chrome.js';
import {RM} from './util.js';
import {Sfx} from '../feel.js';
import {enterRoom} from './rooms.js';
import {showHome} from './home.js';
import {currentRoom} from '../core/roomStore.js';
import {roomIndex,ROOMS} from '../core/rooms.js';
import {paintRoomVars} from '../ui/roomHome.js';

const LEAVE_MS=240,EMBERS_MS=560; // the new fire comes up from embers over --m-page
let busy=false;
/** Direction of the shorter way round the ring from the current room to `id`: 1 next (rightwards), -1 previous. */
export function ringDir(from,to){const n=ROOMS.length,d=((roomIndex(to)-roomIndex(from))%n+n)%n;return d<=n/2?1:-1;}
export async function goRoom(id,dir){
 const from=currentRoom(S);
 if(busy||id===from)return false;
 busy=true;dir=dir||ringDir(from,id);
 const home=ui.home,still=RM||home.hidden;
 try{
  Sfx.cue&&Sfx.cue('door');
  if(!still){home.dataset.rmDir=dir>0?'next':'prev';home.classList.add('rm-leave');}
  paintRoomVars(id); // the fire shifts colour while the old room is still leaving
  await Promise.all([enterRoom(id),still?0:new Promise(r=>setTimeout(r,LEAVE_MS))]);
  showHome();
  if(!still){home.dataset.rmDir=dir>0?'next':'prev';home.classList.add('rm-enter');setTimeout(()=>home.classList.remove('rm-enter'),EMBERS_MS+40);}
 }finally{busy=false;}
 return true;
}
