/* The save store: reads and writes the JSON saves kept in localStorage (deepstack.v1 and its siblings). Pure apart from the
   storage it is handed, so the failure paths test without a browser. A save that will not parse is copied under a second
   key before the next save writes over it, and the player is told through src/core/stateEvents.js:
   - storage that throws on read            -> 'storage-read' (reported once; its writes are then quiet)
   - a write that throws (full, blocked)    -> 'storage-write' with a retry that writes the latest value again
   - a deepstack.v1 that does not parse     -> 'save-unreadable' (the copy is kept under UNREADABLE_KEY, never read back) */
import {reportState, clearState} from './stateEvents.js';

export const SAVE_KEY = 'deepstack.v1';
export const UNREADABLE_KEY = 'deepstack.v1.unreadable';

/** `mem` holds the latest value of each key, used whenever storage cannot answer. */
export function makeStore(mem = {}, storage = () => globalThis.localStorage) {
  let storageBlocked = false, writeFailing = false;
  const st = {
    get(k, d) {
      let v;
      try { v = storage().getItem(k); }
      catch (e) { if (!storageBlocked) { storageBlocked = true; reportState('storage-read'); } return k in mem ? mem[k] : d; }
      if (!v) return d;
      try { return JSON.parse(v); }
      catch (e) {
        if (k === SAVE_KEY) {
          try { if (storage().getItem(UNREADABLE_KEY) === null) storage().setItem(UNREADABLE_KEY, v); } catch (e2) { /* no room for the copy: the report still stands */ }
          reportState('save-unreadable');
        }
        return k in mem ? mem[k] : d;
      }
    },
    set(k, v) {
      mem[k] = v;
      try {
        storage().setItem(k, JSON.stringify(v));
        if (writeFailing) { writeFailing = false; clearState('storage-write'); }
      } catch (e) {
        if (!storageBlocked) { writeFailing = true; reportState('storage-write', {retry: () => st.set(k, mem[k])}); }
      }
    },
  };
  return st;
}
