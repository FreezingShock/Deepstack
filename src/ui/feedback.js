// Collapsed "What it caught" page on the result book. Closed by default so the card stays quiet.
import {feedbackLines} from '../core/feedback.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export function feedbackHTML(b) {
  const f = feedbackLines(b);
  if (!f) return '';
  const list = (cls, head, items) => items.length ? `<div class="fbg ${cls}"><small>${head}</small><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>` : '';
  return `<details class="fbk"><summary>What it caught</summary>
   ${list('got', 'Caught', f.caught)}${list('lost', 'Missing', f.missed)}
   ${f.notes.map(n => `<p class="fbn">${esc(n)}</p>`).join('')}
  </details>`;
}
