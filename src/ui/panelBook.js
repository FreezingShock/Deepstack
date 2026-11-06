/* Settings and Credits open as books (backlog 104): the same openBook choreography the shelf books use, flying
   out of the top-bar button that was pressed, so no panel fades in bare. Close (Esc, outside press, the book's own
   button) swings the cover shut and flies back; reduced motion fades (handled by openBook). */
import {openBook} from './home.js';
import {esc} from './bookpages.js';
import {decorate as inkPage} from './ink.js';

export const PANEL_COLORS=Object.freeze({bk:'var(--c-oak-24)',bk2:'var(--c-oak-11)',gild:'var(--c-brass-65)',tex:'none'});

/* Two pages from a title and the HTML of each page; the left page carries the heading. */
export function panelSpreads({kicker,title,left,right}){
 return [{l:`<h1>${esc(title)}</h1>${kicker?`<div class="kicker">${esc(kicker)}</div>`:''}`+left,r:right||''}];
}

/* Open a panel as a book. `from` is the button that was pressed. `wire(sp)` runs after every page paint so
   controls on the pages are live; `onClose` runs once the book is back home. Returns the book api. */
export function openPanelBook({from,title,label,kicker,left,right,wire=()=>{},onClose=()=>{}}){
 /* Same rule as the shelf books (#210): while the book is up, nothing of the room may show through, so the home
    gets .book-opening (props, sibling books, title and plaque fade) and .book-closing as the cover shuts. */
 const home=typeof document!=='undefined'?document.getElementById('home'):null,room=home&&!home.hidden?home:null;
 if(room)room.classList.add('book-opening');
 const clear=()=>{if(room){room.classList.remove('book-opening','book-closing');}};
 const bk=openBook({from:from&&from.getBoundingClientRect?from.getBoundingClientRect():null,colors:PANEL_COLORS,title,label:label||title,cls:'menu pbook',
  spreads:panelSpreads({kicker,title,left,right}),onShut:()=>{if(room)room.classList.add('book-closing');},onFly:clear,onClose:()=>{clear();onClose();}});
 bk.onPaint=sp=>{inkPage(sp,label||title);wire(sp);};
 return bk;
}
