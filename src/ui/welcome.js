/* The ledger on the home room's right wall (the Librarian's Card). The card catalogue on the left wall lives in cabinet.js. */
import {bandAt} from '../world/sky.js';
import {roomTag,allTag} from './scope.js';

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/** The ledger: the Librarian's Card, a framed board bolted to the right wall, with a shelf for the stamp.
 *  Each row is inked in its own colour: ember for the streak, ink for depth, the best tier's colour for books, the floor's colour for the floor. */
/** Which lamp the card is read by: the same local-hour band the attic window uses (dawn, day, dusk, night). */
export const lampAt=(date=new Date())=>bandAt(date.getHours());
export function ledgerHTML({streak,deepest,books,floor,floorKey='',tierInk='',lamp=lampAt(),room=null}){
 /* with a room given, each row says whether it counts this room or every room */
 const tag=t=>room?(t==='room'?roomTag(room):allTag()):'';
 const row=(k,v,cls,style='',go='',tip='',t='all')=>`<div class="lg-row ${cls}" title="${esc(tip||v)}${room?(t==='room'?' \u00b7 '+esc(room.name)+' only':' \u00b7 all rooms'):''}"${go?` role="button" tabindex="0" ${go==='bFloors'?'id="bFloors" ':`data-go="${go}" `}aria-label="${k}: ${esc(v)}. Opens ${go==='bFloors'?'the Floors book':'Stats'}"`:''}${style?` style="${style}"`:''}><dt>${k}${tag(t)}</dt><dd>${esc(v)}</dd></div>`;
 const fk=/^[a-z]+$/.test(floorKey)?floorKey:'';
 return `<aside class="ledger" data-lamp="${lamp}" aria-label="Your records"><div class="cc-top" data-prop-slot="stamp"></div><div class="lg-frame"><div class="lg-plate">Librarian’s Card</div>
 <dl class="lg-page">${row('Streak',streak,'lg-streak','','','','room')}${row('Deepest',deepest+' ft','lg-deep','','bStats')}${row('Books',books,'lg-books',/^#[0-9a-f]{3,8}$/i.test(tierInk)?`--lg-ink:${tierInk}`:'','bStats')}${floor?row('Floor',floor,'lg-floor',fk?`--lg-ink:var(--floor-${fk}-ledge-hi)`:'','bFloors'):''}</dl></div></aside>`;
}
