/* A librarian's desk on the niche ledge: a brass bell, an inkwell and a date stamp. Each is a real button
   with one sound. The bell swings and chimes, the inkwell ripples under a dipped quill, and the stamp
   thumps a DUE date onto the Borrower's slip. The props stand on the ledge line, are drawn in CSS/SVG,
   and are hidden below 560 px and wherever the slip is hidden (see deskProps.css). Bound once per
   home render; the layer is rebuilt with the home HTML so nothing leaks between renders. */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const LOAN_DAYS = 14;

/* Pure: the stamp text for a loan starting at `now` (a Date): "DUE 18 NOV". */
export function dueStamp(now = new Date(), days = LOAN_DAYS) {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() + days);
  return `DUE ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export const PROPS = [
  { id: 'bell', label: 'Ring the brass bell', sfx: 'chime1', side: 'l',
    svg: '<svg viewBox="0 0 40 36" aria-hidden="true"><ellipse class="dp-sh" cx="20" cy="34" rx="17" ry="2.2"/><ellipse class="dp-brass2" cx="20" cy="31" rx="15" ry="3.2"/><path class="dp-brass" d="M6 31c1-11 5-19 14-19s13 8 14 19z"/><path class="dp-hi" d="M11 29c1-7 3-12 7-14"/><circle class="dp-brass2" cx="20" cy="10" r="3"/><rect class="dp-pad" x="17" y="3.5" width="6" height="3" rx="1.5"/></svg>' },
  { id: 'ink', label: 'Dip a quill in the inkwell', sfx: 'quill', side: 'r',
    svg: '<svg viewBox="0 0 30 34" aria-hidden="true"><ellipse class="dp-sh" cx="15" cy="32" rx="13" ry="2"/><path class="dp-glass" d="M4 31l-1.5-14c0-4 4-6 12.5-6s12.5 2 12.5 6L26 31z"/><ellipse class="dp-liquid" cx="15" cy="19" rx="9" ry="2.6"/><ellipse class="dp-ripple" cx="15" cy="19" rx="4" ry="1.2"/><rect class="dp-brass2" x="9" y="8" width="12" height="4" rx="1"/><path class="dp-quill" d="M22 12c3-6 4-9 6-11-1 4-2 8-4 14"/></svg>' },
  { id: 'stamp', label: 'Stamp a due date on the Borrower’s slip', sfx: 'thud', side: 'r',
    svg: '<svg viewBox="0 0 34 36" aria-hidden="true"><ellipse class="dp-sh" cx="17" cy="34" rx="15" ry="2.2"/><rect class="dp-pad" x="3" y="26" width="28" height="7" rx="1.5"/><rect class="dp-redpad" x="6" y="27" width="22" height="3.5" rx="1"/><g class="dp-head"><rect class="dp-wood" x="10" y="3" width="14" height="6" rx="3"/><rect class="dp-wood" x="14" y="8" width="6" height="8"/><rect class="dp-brass" x="9" y="15" width="16" height="5" rx="1"/><rect class="dp-pad" x="8" y="20" width="18" height="3" rx="1"/></g></svg>' },
];

const SFX = { chime1: s => s.chime && s.chime(1), quill: s => s.quill && s.quill(), thud: s => s.thud && s.thud() };

/* root: the #home element. opts: {sfx: Sfx, now: () => Date}. Returns a teardown (used by tests). */
export function bindDeskProps(root, { sfx = {}, now = () => new Date() } = {}) {
  const nook = root && root.querySelector('.hsecs');
  const host = root;
  if (!nook || !host) return () => {};
  host.querySelector(':scope > .desk-props')?.remove();
  const layer = document.createElement('div');
  layer.className = 'desk-props';
  layer.setAttribute('role', 'group');
  layer.setAttribute('aria-label', 'Librarian’s desk');
  const timers = [];
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  const pulse = (el, cls, ms) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); later(() => el.classList.remove(cls), ms); };
  for (const p of PROPS) {
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'dp-' + p.id; b.className = `dp dp-${p.id} dp-${p.side}`;
    b.setAttribute('aria-label', p.label); b.title = p.label;
    b.innerHTML = p.svg;
    b.onclick = () => {
      SFX[p.sfx](sfx);
      if (p.id === 'bell') pulse(b, 'ring', 1400);
      else if (p.id === 'ink') pulse(b, 'dip', 900);
      else {
        pulse(b, 'press', 420);
        const slip = host.querySelector('.stats.slip');
        if (slip) {
          let mark = slip.querySelector('.dp-mark');
          if (!mark) { mark = document.createElement('i'); mark.className = 'dp-mark'; mark.setAttribute('aria-hidden', 'true'); slip.appendChild(mark); }
          mark.textContent = dueStamp(now());
          pulse(mark, 'thump', 500); mark.classList.add('on');
          pulse(slip, 'jolt', 300);
        }
      }
    };
    layer.appendChild(b);
  }
  host.appendChild(layer);
  return () => { timers.forEach(clearTimeout); layer.remove(); };
}
