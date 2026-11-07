/* Reset progress (Settings > Progress). Erases what the player has earned: the save (shelf, streak, depths, room records,
   rating), the card catalogue's "seen" marks and the page-flip hint counter. Settings, Graphics and Floor rules are choices,
   not progress, so they are never touched. Pure apart from the storage it is handed. */
// 'deepstack.v1.unreadable' is the copy of a save that would not parse (src/app/state.js): it is progress too, so a reset takes it.
export const PROGRESS_KEYS=Object.freeze(['deepstack.v1','deepstack.cabinet.v1','deepstack.flipHint','deepstack.v1.unreadable']);

/** Removes every progress key. Returns how many were removed (storage that throws counts as none). */
export function eraseProgress(storage=globalThis.localStorage){
 let n=0;
 for(const k of PROGRESS_KEYS){try{storage.removeItem(k);n++;}catch(e){}}
 return n;
}
