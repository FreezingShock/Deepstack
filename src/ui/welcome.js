/* The ledger on the home room's right wall (the Librarian's Card). The card catalogue on the left wall lives in cabinet.js. */
import {bandAt} from '../world/sky.js';

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/** The ledger: the Librarian's Card, a framed board bolted to the right wall, with a shelf for the stamp.
 *  Each row is inked in its own colour: ember for the streak, ink for depth, the best tier's colour for books, the floor's colour for the floor. */
/** Which lamp the card is read by: the same local-hour band the attic window uses (dawn, day, dusk, night). */
export const lampAt=(date=new Date())=>bandAt(date.getHours());
export function ledgerHTML({streak,deepest,books,floor,floorKey='',tierInk='',lamp=lampAt()}){
 const row=(k,v,cls,style='')=>`<div class="lg-row ${cls}" title="${esc(v)}"${style?` style="${style}"`:''}><dt>${k}</dt><dd>${esc(v)}</dd></div>`;
 const fk=/^[a-z]+$/.test(floorKey)?floorKey:'';
 return `<aside class="ledger" data-lamp="${lamp}" aria-label="Your records"><div class="cc-top" data-prop-slot="stamp"></div><div class="lg-frame"><div class="lg-plate">Librarian’s Card</div>
 <dl class="lg-page">${row('Streak',streak,'lg-streak')}${row('Deepest',deepest+' ft','lg-deep')}${row('Books',books,'lg-books',/^#[0-9a-f]{3,8}$/i.test(tierInk)?`--lg-ink:${tierInk}`:'')}${floor?row('Floor',floor,'lg-floor',fk?`--lg-ink:var(--floor-${fk}-ledge-hi)`:''):''}</dl></div></aside>`;
}
