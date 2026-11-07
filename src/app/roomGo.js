/* Walking to another room from home (side doors, [ and ], the ring of lights, the Rooms book): the same fireplace stays
   where it is while every room colour glides to the new room's (src/ui/roomHome.css), then the room's name, motto and
   Daily line type themselves in. Nothing slides or fades in as a new room. */
import {S} from './state.js';
import {ui} from './chrome.js';
import {Sfx} from '../feel.js';
import {enterRoom} from './rooms.js';
import {showHome} from './home.js';
import {currentRoom} from '../core/roomStore.js';
import {roomIndex,ROOMS} from '../core/rooms.js';
import {paintRoomVars,typeOnNextMount} from '../ui/roomHome.js';
import {snapPlaque,morphPlaque} from '../ui/plaqueMorph.js';
import {RM} from './util.js';

let busy=false;
/** Direction of the shorter way round the ring from the current room to `id`: 1 next (rightwards), -1 previous. */
export function ringDir(from,to){const n=ROOMS.length,d=((roomIndex(to)-roomIndex(from))%n+n)%n;return d<=n/2?1:-1;}
export async function goRoom(id,dir){
 const from=currentRoom(S);
 if(busy||id===from)return false;
 busy=true;
 try{
  Sfx.cue&&Sfx.cue('door');
  Sfx.room&&Sfx.room(id); // the new room's accents crossfade in as the old one's fade out (src/sound/roomTone.js)
  paintRoomVars(id,undefined,{settle:true}); // the fire, the light, the title and the labels glide to the new colours; the fireplace itself stays
  typeOnNextMount();
  /* Let the first frame of the glide reach the screen before the room's save swap, word lists and home rebuild run.
     A promise resolved by one rAF continues in the same frame's microtasks, so the heavy work used to delay the paint
     that shows the colours moving. Two frames (the second one is after the first has painted) then a macrotask. */
  await new Promise(r=>{requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(r,0)));setTimeout(r,60);});
  await enterRoom(id);
  const snap=snapPlaque(ui.home);
  showHome({keep:true});
  morphPlaque(ui.home,snap,{still:RM||ui.home.hidden}); // the home is redrawn around the same burning fire and the same wall; only the words type
 }finally{busy=false;}
 return true;
}
