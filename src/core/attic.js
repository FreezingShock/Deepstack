/* The attic: where books with no known floor live. New books save the floor they were found on (`fl`); older
   ones did not. A one-time backfill recovers the floor from Daily history (the saved run keeps every book's depth
   gain, and a Daily run always starts at 0 ft), and whatever cannot be recovered stays in the attic. Pure functions.
   Additive fields only: `fl` (floor id) and `fli` (1 = worked out by the backfill, not recorded at the time). */
import {floorAtFt} from './floors.js';

export const hasFloor=b=>!!b&&Number.isInteger(b.fl)&&b.fl>=0;
const key=b=>String(b.w).toLowerCase()+'|'+b.t;

/* Fill `fl` on shelf books that match a saved Daily run. A book's floor is the one it sat on when the word came up,
   i.e. at the depth the run had reached before that answer. Returns how many books were placed. */
export function backfillFloors(S,floorAt=floorAtFt){
 if(!S||!Array.isArray(S.shelf)||!S.daily)return 0;
 const loose=new Map();
 for(const b of S.shelf)if(!hasFloor(b)&&b.t)loose.set(key(b),b);
 if(!loose.size)return 0;
 let n=0;
 for(const d of Object.values(S.daily)){
  if(!d||d.practice||!Array.isArray(d.books))continue;
  let ft=0;
  for(const db of d.books){
   const gain=Number(db&&db.ft);
   if(!Number.isFinite(gain))break;            // unknown depth from here on: leave the rest for the attic
   const b=db.t&&loose.get(key(db));
   if(b){b.fl=floorAt(ft).id;b.fli=1;loose.delete(key(db));n++;}
   ft+=gain;
  }
 }
 return n;
}

/* Books that belong in the attic, as {b,i} (i = index in S.shelf), newest first. */
export const atticItems=shelf=>(shelf||[]).map((b,i)=>({b,i})).filter(x=>!hasFloor(x.b)).sort((a,c)=>(c.b.t||0)-(a.b.t||0)||c.i-a.i);

/* Recent guesses live in the attic too: the last few books you earned, newest first, as {b,i,recent:true}. */
export const RECENT_N=12;
export const recentItems=(shelf,n=RECENT_N)=>{const out=[];for(let i=(shelf||[]).length-1;i>=0&&out.length<n;i--)out.push({b:shelf[i],i,recent:true});return out;};
/* Everything the attic holds: recent guesses first, then floorless earlier finds (a book is never listed twice). */
export function atticAll(shelf,n=RECENT_N){
 const recent=recentItems(shelf,n),seen=new Set(recent.map(x=>x.i));
 return [...recent,...atticItems(shelf).filter(x=>!seen.has(x.i))];
}

/* Crates: the attic's books grouped by the month they were found, newest crate first; undated ones go in an unmarked crate. */
export function atticCrates(items,{perCrate=8}={}){
 const by=new Map(),order=[];
 for(const x of items){
  const k=x.b.t?new Date(x.b.t).toISOString().slice(0,7):'';
  if(!by.has(k)){by.set(k,[]);order.push(k);}
  by.get(k).push(x);
 }
 order.sort((a,b)=>a===''?1:b===''?-1:b.localeCompare(a));
 const out=[];
 for(const k of order){
  const list=by.get(k),label=k?new Date(k+'-01T00:00:00Z').toLocaleDateString(undefined,{month:'long',year:'numeric',timeZone:'UTC'}):'Unmarked';
  for(let i=0;i<list.length;i+=perCrate)out.push({key:k||'none',label,cont:i>0,items:list.slice(i,i+perCrate)});
 }
 return out;
}

/* Dust a floorless book off: the reader chooses its floor. Writes `fl` (and `fld`: 1 = chosen by hand) additively and
   returns true; a book that already has a floor, or a floor id that does not exist, is left alone. */
export function dustOff(book,floorId,floorCount=6){
 if(!book||hasFloor(book)||!Number.isInteger(floorId)||floorId<0||floorId>=floorCount)return false;
 book.fl=floorId;book.fld=1;return true;
}

/* One book per word: the same word found again and again would only repeat on the floor, so the newest copy stands
   in for them all and carries how many there are (`n`). Order is kept (recent guesses first, then earlier finds), and
   a word already shown among the recent guesses is not repeated among the earlier finds. Pure; items are not mutated. */
export function atticTidy(items){
 const at=new Map(),out=[];
 for(const x of items||[]){
  const k=String(x.b&&x.b.w||'').toLowerCase();
  const seen=at.get(k);
  if(seen){seen.n=(seen.n||1)+1;continue;}
  const y={...x,n:1};at.set(k,y);out.push(y);
 }
 return out;
}
