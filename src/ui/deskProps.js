/* Two brass props, one on each piece of wall furniture: a bell on the cabinet's shelf and a date stamp on the
   ledger's shelf. Each is a real button with one sound. The bell swings and chimes; the stamp thumps a DUE date
   onto the ledger. They are drawn in CSS/SVG, mounted into the `[data-prop-slot]` shelves that welcome.js renders,
   and show only where the furniture does (see deskProps.css). Bound once per home render; the slots are rebuilt
   with the home HTML so nothing leaks between renders. */

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
  { id: 'stamp', label: 'Stamp a due date in the Borrower’s ledger', sfx: 'thud', side: 'r',
    svg: '<svg viewBox="0 0 34 36" aria-hidden="true"><ellipse class="dp-sh" cx="17" cy="34" rx="15" ry="2.2"/><rect class="dp-pad" x="3" y="26" width="28" height="7" rx="1.5"/><rect class="dp-redpad" x="6" y="27" width="22" height="3.5" rx="1"/><g class="dp-head"><rect class="dp-wood" x="10" y="3" width="14" height="6" rx="3"/><rect class="dp-wood" x="14" y="8" width="6" height="8"/><rect class="dp-brass" x="9" y="15" width="16" height="5" rx="1"/><rect class="dp-pad" x="8" y="20" width="18" height="3" rx="1"/></g></svg>' },
];

const SFX = { chime1: s => s.chime && s.chime(1), quill: s => s.quill && s.quill(), thud: s => s.thud && s.thud() };

/* root: the #home element. opts: {sfx: Sfx, now: () => Date}. Returns a teardown (used by tests). */
export function bindDeskProps(root, { sfx = {}, now = () => new Date() } = {}) {
  if (!root) return () => {};
  const timers = [];
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  const pulse = (el, cls, ms) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); later(() => el.classList.remove(cls), ms); };
  const made = [];
  for (const p of PROPS) {
    const slot = root.querySelector(`[data-prop-slot="${p.id}"]`);
    if (!slot) continue;
    slot.querySelector(':scope > .dp')?.remove();
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'dp-' + p.id; b.className = `dp dp-${p.id}`;
    b.setAttribute('aria-label', p.label); b.title = p.label;
    b.innerHTML = p.svg;
    b.onclick = () => {
      SFX[p.sfx](sfx);
      if (p.id === 'bell') pulse(b, 'ring', 1400);
      else {
        pulse(b, 'press', 420);
        const page = root.querySelector('.ledger');
        if (page) {
          let mark = page.querySelector('.dp-mark');
          if (!mark) { mark = document.createElement('i'); mark.className = 'dp-mark'; mark.setAttribute('aria-hidden', 'true'); page.appendChild(mark); }
          mark.textContent = dueStamp(now());
          pulse(mark, 'thump', 500); mark.classList.add('on');
          pulse(page, 'jolt', 300);
        }
      }
    };
    slot.appendChild(b); made.push(b);
  }
  return () => { timers.forEach(clearTimeout); made.forEach(b => b.remove()); };
}
