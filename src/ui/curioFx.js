// Opening a curio: a click plays a small animation where the spine is, keeps the find, and
// celebrates with a slip. Reduced motion gets the slip only. Animation is transform/opacity (CSS).
import {keepCurio, isKept, foundCount} from './curioLog.js';
import {reducedMotion} from './settings.js';

export function initCurioFx({S, save, doc = document, rm = () => reducedMotion()}) {
  const toast = doc.createElement('div');
  toast.id = 'curio-toast'; toast.setAttribute('role', 'status'); toast.hidden = true;
  doc.body.appendChild(toast);
  let tm = 0;
  const say = (head, line) => {
    toast.innerHTML = `<b></b>${line ? '<p></p>' : ''}`;
    toast.firstChild.textContent = head; if (line) toast.lastChild.textContent = line;
    toast.hidden = false; toast.classList.remove('on'); void toast.offsetWidth; toast.classList.add('on');
    clearTimeout(tm); tm = setTimeout(() => { toast.classList.remove('on'); toast.hidden = true; }, 3800);
  };
  const play = (kind, x, y, ok) => {
    if (rm()) return;
    const el = doc.createElement('div');
    el.className = `cfx cfx-${kind}${ok ? '' : ' cfx-locked'}`;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    if (ok) for (let i = 0; i < 6; i++) { const m = doc.createElement('i'); m.style.setProperty('--a', (i * 60 - 150) + 'deg'); m.style.setProperty('--d', (14 + (i % 3) * 8) + 'px'); el.appendChild(m); }
    doc.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  };
  return {
    hint: hit => isKept(S, hit.row, hit.book) ? 'Kept in your collection' : 'Click to open',
    onOpen(hit, x, y) {
      const r = keepCurio(S, hit.row, hit.book);
      play(r.kind, x, y, !r.locked);
      if (r.locked) return;
      if (r.fresh) {
        save();
        say(r.newKind ? 'A new kind of find' : `Curio kept · ${foundCount(S)}`, r.line ? `A line of the letter: “${r.line}”` : 'Listed under Curios in your Stats book.');
      }
    }
  };
}
