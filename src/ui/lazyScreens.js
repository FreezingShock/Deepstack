/* Lazy menu books. Shelf, Daily and Stats (and their CSS) load on first use, or in idle time after first paint,
   so the first screen ships without them. bookify() in home.js waits on `load()` if a book is clicked before it arrived. */
import {BOOK_PAGES} from './home.js';
import {deferAfterPaint} from '../core/boot.js';

export function lazyBooks(ctx,ids=['bAll','bDaily','bStats']){
 let p=null;
 const load=()=>p||(p=import('./bookMenusLoad.js').then(m=>{
  const real=m.buildBookPages(ctx);
  for(const id of ids){const stub=BOOK_PAGES[id];delete stub.load;Object.assign(stub,real[id]);}
  return true;
 }).catch(e=>{p=null;throw e;}));
 for(const id of ids)BOOK_PAGES[id]={load};
 deferAfterPaint(()=>load().catch(()=>{}),3000); // prewarm: by the time anyone clicks, the book is already in
 return load;
}
