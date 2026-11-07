import {fmtNum} from '../core/numFmt.js';
// The curio cabinet: finds are kept additively in S.curios = {found:{"row:seed":{r,s,k,t}}}.
// Nothing about a curio's text is stored (it is a pure function of row and seed); the unlocked
// lines of the margin letter are derived from how many have been found. Pure, so it tests without a DOM.
import {esc} from './bookpages.js';import {emptyBlock} from './emptyPages.js';

import {curioText, KIND_LABEL} from './curios.js';

export const KEPT_KINDS = ['page', 'ribbon', 'sealed', 'note'];
export const LETTER = [
  [1, 'To whoever is reading this far down:'],
  [3, 'I began leaving these on the shelves so the descent would feel less like falling.'],
  [5, 'Each one is true. Some are only true lower.'],
  [8, 'The books are not heavy because of the words. They are heavy because someone meant them.'],
  [12, 'I kept the Archive lit. I cannot say the same for the Hollow.'],
  [17, 'If the Abyss is quiet, do not be alarmed. It is only listening.'],
  [23, 'There is a last curio. It is not on any shelf you find by looking for it.'],
  [30, 'Keep reading. — the one who stayed']
];

export const curioId = (row, b) => `${row}:${b.seed | 0}`;
const store = S => (S.curios && S.curios.found ? S.curios : (S.curios = {found: {}}));
export const foundCount = S => Object.keys((S && S.curios && S.curios.found) || {}).length;
export const isKept = (S, row, b) => !!(S && S.curios && S.curios.found && S.curios.found[curioId(row, b)]);
export const unlockedLines = n => LETTER.filter(([need]) => n >= need).length;

/** Keep a curio. Locked (sealed, too shallow) ones are not kept. Returns what happened for the UI to celebrate. */
export function keepCurio(S, row, b, now = Date.now()) {
  const c = curioText(row, b);
  if (c.locked) return {locked: true, kind: c.kind, fresh: false, n: foundCount(S)};
  const st = store(S), id = curioId(row, b), fresh = !st.found[id];
  const before = foundCount(S), kindsBefore = new Set(Object.values(st.found).map(f => f.k));
  if (fresh) st.found[id] = {r: row, s: b.seed | 0, k: c.kind, t: now};
  const n = foundCount(S);
  return {locked: false, fresh, kind: c.kind, n, newKind: fresh && !kindsBefore.has(c.kind),
    line: fresh && unlockedLines(n) > unlockedLines(before) ? LETTER[unlockedLines(n) - 1][1] : null};
}

const PER_LEAF = 5;
/** Handwritten leaves for the Collection: a summary with the letter, then the finds by depth. */
export function curioLeaves(S, floorAtRow = () => ({name: ''}), ft = r => Math.round(r * 4.2)) {
  const found = Object.values((S && S.curios && S.curios.found) || {}).sort((a, b) => a.r - b.r || a.s - b.s);
  const n = found.length, got = unlockedLines(n);
  const kinds = KEPT_KINDS.map(k => `<li class="${found.some(f => f.k === k) ? 'on' : ''}"><span>${esc(KIND_LABEL[k])}</span><b>${found.filter(f => f.k === k).length}</b></li>`).join('');
  const letter = LETTER.map(([need, t], i) => i < got ? `<p class="cl-line">${esc(t)}</p>` : `<p class="cl-line cl-dim">… (${need - n} more ${need - n === 1 ? 'find' : 'finds'})</p>`).join('');
  const head = `<div class="alm cur"><h1>Curios</h1><div class="kicker">Things between the books</div>${n ? `<p class="hand">${n} kept.</p>` : emptyBlock('shelf','Nothing kept yet. Click the thin spines with a loose page, a ribbon or a clasp as you descend.','compact')}<ul class="cl-kinds">${kinds}</ul><h2>A letter, in pieces</h2>${letter}</div>`;
  const leaves = [head];
  for (let i = 0; i < n; i += PER_LEAF) {
    leaves.push(`<div class="alm cur"><h1>${i ? 'More finds' : 'Finds'}</h1><ul class="cl-list">${found.slice(i, i + PER_LEAF).map(f => {
      const c = curioText(f.r, {seed: f.s});
      return `<li><b>${esc(KIND_LABEL[c.kind] || c.label)}</b><em>${esc(floorAtRow(f.r).name)} · ${fmtNum(ft(f.r))} ft</em><p>${esc(c.text)}</p></li>`;
    }).join('')}</ul></div>`);
  }
  return leaves;
}

export const curiosBook = ({S, floorAtRow, ft}) => ({leaves: () => curioLeaves(S, floorAtRow, ft)});
