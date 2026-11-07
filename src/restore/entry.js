/* The bench's door on the home screen: one slim button in the bottom-right corner that opens the Restoration bench for the
   room you are in. It sits beside #home (not inside it), because the home section is transformed while it fades in and
   would pin a fixed button to itself. It hides with the home (see restore.css). Rebuilt on every home render (src/app/home.js)
   so the wall count is current. */
import {S} from '../app/state.js';
import {restoreOf} from './store.js';
import {openRestore} from './ui.js';

/** Adds the entry button beside `home` (replacing an earlier one). Returns the button. */
export function mountRestoreEntry(home) {
  if (!home || !home.parentElement) return null;
  const host = home.parentElement;
  host.querySelector(':scope > .rs-entry')?.remove();
  const n = restoreOf(S).wall.length;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'rs-entry';
  b.title = 'Print a damaged page from this room and restore it';
  b.innerHTML = `<span class="rs-entry-k">Restoration bench</span>${n ? `<span class="rs-entry-v">${n} on the wall</span>` : ''}`;
  b.addEventListener('click', () => openRestore(b));
  host.insertBefore(b, home.nextSibling);
  return b;
}
