/* Settings and Credits open as books (backlog 104): the same openBook choreography the shelf books use, flying
   out of the top-bar button that was pressed, so no panel fades in bare. Close (Esc, outside press, the book's own
   button) swings the cover shut and flies back; reduced motion fades (handled by openBook). */
import {openBook} from './home.js';
import {esc} from './bookpages.js';
import {decorate as inkPage} from './ink.js';

export const PANEL_COLORS=Object.freeze({bk:'var(--c-oak-24)',bk2:'var(--c-oak-11)',gild:'var(--c-brass-65)',tex:'none'});

/* Two pages from a title and the HTML of each page; the left page carries the heading. A panel that runs longer than
   two pages passes spreads ([{l, r}, ...]) instead, and the heading goes on the first left page. */
export function panelSpreads({kicker,title,left,right,spreads}){
 const head=`<h1>${esc(title)}</h1>${kicker?`<div class="kicker">${esc(kicker)}</div>`:''}`;
 if(spreads&&spreads.length)return spreads.map((s,i)=>({l:(i===0?head:'')+(s.l||''),r:s.r||''}));
 return [{l:head+left,r:right||''}];
}

/* Open a panel as a book. `from` is the button that was pressed. `wire(sp)` runs after every page paint so
   controls on the pages are live; `onClose` runs once the book is back home. Returns the book api. */
export function openPanelBook({from,title,label,kicker,left,right,spreads,wire=()=>{},onClose=()=>{}}){
 const bk=openBook({from:from&&from.getBoundingClientRect?from.getBoundingClientRect():null,colors:PANEL_COLORS,title,label:label||title,cls:'menu panel',
  spreads:panelSpreads({kicker,title,left,right,spreads}),onClose});
 bk.onPaint=sp=>{inkPage(sp,label||title);wire(sp);};
 return bk;
}
