/* Y6: the rail's inlay and corner glows take on the current floor's colour as you descend (CSS in railHatch.css).
   One call from the main.js depth hook; it only touches the DOM when the floor changes. */
import {railTintFor} from './railTintCore.js';
let last=null;
export function tintRail(f,doc=document){
 if(!f||f.key===last)return;
 const bar=doc.querySelector('#bar');if(!bar)return;
 last=f.key;bar.dataset.floor=f.key;bar.style.setProperty('--rail-tint',railTintFor(f));
}
