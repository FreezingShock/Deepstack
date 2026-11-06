/* Pure leaves of the Floors book (no DOM, no CSS) so tests can import them. */
import {esc} from './bookpages.js';
import {floorIdOf} from './shelfBays.js';
const LORE={
 stacks:'Warm lamps and tidy aisles. Every reader starts here, and most books here still smell of glue.',
 archive:'Ledgers, files and forgotten indexes. The lamps burn green and the paper has started to curl.',
 catacombs:'Stone, bone and the quiet dead. Shelves lean in, cobwebs hang thick, and the lamps burn low and orange.',
 vault:'The sea got here first. Water laps at the lowest shelves and the books are swollen and cold.',
 hollow:'Shelves without books, books without names. Gaps open where volumes used to be.',
 abyss:'Nothing here was ever meant to be read. The lamps pulse red and almost nothing is left standing.'
};
const best=list=>list.reduce((a,b)=>(!a||b.score>a.score?b:a),null);

/** Leaves of the Floors book: a contents page, then one leaf per floor. Pure, exported for tests. */
export function floorLeaves(S,FLOORS,floorStartFt){
 const reached=(S&&S.bestFloor)||0,shelf=(S&&S.shelf)||[];
 const toc=`<div class="alm flb"><h1>The Floors</h1><div class="kicker">${Math.min(reached,FLOORS.length-1)+1} of ${FLOORS.length} found</div><ol class="flb-toc">${FLOORS.map(f=>{const lock=f.id>reached;
  return `<li class="${lock?'locked':''}" style="--k:${f.id}"><span class="ft">${floorStartFt(f)} ft</span><b>${lock?'Undiscovered':esc(f.name)}</b></li>`;}).join('')}</ol></div>`;
 const pages=FLOORS.map((f,i)=>{
  const a=floorStartFt(f),n=FLOORS[i+1],range=n?`${a} to ${floorStartFt(n)} ft`:`${a} ft and below`;
  if(f.id>reached)return `<div class="alm flb locked" style="--k:${f.id}"><h1>Undiscovered</h1><div class="kicker">${range}</div><p class="hand dim">You have not been this deep yet. Something is down here.</p></div>`;
  const mine=shelf.filter(b=>floorIdOf(b)===f.id),top=best(mine);
  return `<div class="alm flb" style="--k:${f.id}"><h1>${esc(f.name)}</h1><div class="kicker">${range}</div><p class="hand">${esc(LORE[f.key]||f.sub)}</p>
   <ul class="ledger flb-stats"><li><span>Books found here</span><b>${mine.length}</b></li>${top?`<li><span>Best find</span><b>${esc(top.w)} · ${top.score}</b></li>`:''}</ul></div>`;});
 return [toc,...pages];
}

