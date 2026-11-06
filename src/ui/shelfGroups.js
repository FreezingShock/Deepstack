/* Shelf filters fold away: each group (Sort, Bay, Show, Room, Rarity) shows one line, "Sort  Newest", and opens its chips on a
   tap, so the left page is the search box, five quiet lines and the plaque, not a wall of chips. Open groups are remembered
   across repaints (the page rebuilds on every filter click). */
const OPEN = new Set();

export function foldGroups(root) {
  root.querySelectorAll('.chipgroup').forEach(g => {
    const k = g.querySelector(':scope > .kicker'), chips = g.querySelector('.chips');
    if (!k || !chips || g.dataset.fold) return;
    const name = k.textContent.trim();
    g.dataset.fold = '1';
    const now = [...chips.querySelectorAll('.fchip[aria-pressed="true"]')]
      .map(c => c.cloneNode(true)).map(c => { c.querySelectorAll('small,i').forEach(x => x.remove()); return c.textContent.trim(); })
      .filter(t => t && t !== 'All').join(', ');
    const open = OPEN.has(name);
    g.classList.toggle('open', open);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'fold'; b.setAttribute('aria-expanded', String(open));
    b.innerHTML = `<span class="fk"></span><span class="fv"></span><i aria-hidden="true"></i>`;
    b.querySelector('.fk').textContent = name;
    b.querySelector('.fv').textContent = now || (name === 'Show' ? 'Everything' : 'All');
    b.onclick = () => {
      const o = !g.classList.contains('open');
      g.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o));
      o ? OPEN.add(name) : OPEN.delete(name);
    };
    g.insertBefore(b, k);
  });
}
