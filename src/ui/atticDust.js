import {fmtNum} from '../core/numFmt.js';
/* Shelving a book from the attic. A book with no known floor opens as an ordinary card; the card gains one quiet row,
   "Shelve it on...", with a chip per floor. Choosing one writes `fl` (and `fld: 1`, chosen by hand) additively, saves,
   and the book leaves the attic for that floor's bay on the Shelf. No pop-up: it is part of the book's own page.
   Books that already have a floor just open as usual. */
import {dustOff,hasFloor} from '../core/attic.js';
import {refreshAttic} from './atticHome.js';
import './atticDust.css';

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* Card options for a tapped attic book: null when it already has a floor (open it as usual). */
export function dustCardOpts(b,{S,save,FLOORS,floorStartFt,closeCard}){
 if(!b||hasFloor(b))return null;
 return{shelve:{
  html:`<div class="shelve"><span class="shelve-k">Shelve it on</span><div class="shelve-f">${FLOORS.map(f=>`<button type="button" data-f="${f.id}" title="${esc(f.name)} \u00b7 ${fmtNum(floorStartFt(f))} ft"><b>${esc(f.name)}</b><small>${fmtNum(floorStartFt(f))} ft</small></button>`).join('')}</div></div>`,
  wire(root){
   root.querySelector('.shelve-f').onclick=e=>{
    const btn=e.target.closest('button[data-f]');if(!btn)return;
    if(dustOff(b,+btn.dataset.f,FLOORS.length)){save();refreshAttic(S.shelf);}
    closeCard();
   };
  }}};
}
