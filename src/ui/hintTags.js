/* Phones show only the newest hint in the strip. A tap on the strip opens every hint in a small panel over the
   stage, so an earlier hint can be read again; a tap on the panel closes it. The panel is fixed, so it never
   changes the layout under the answer slip. Desktop shows every hint and this does nothing there. */
const phone = () => !!(globalThis.innerWidth && globalThis.innerWidth <= 640);

function toggleHints(hl) {
 if (!hl || hl.children.length < 2 || !phone()) return false;
 hl.classList.toggle('open');
 return true;
}

if (typeof document !== 'undefined') {
 document.addEventListener('click', e => {
  const hl = e.target && e.target.closest ? e.target.closest('#hl') : null;
  if (hl) toggleHints(hl);
 });
 document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const hl = e.target && e.target.closest ? e.target.closest('#hl') : null;
  if (hl && toggleHints(hl)) e.preventDefault();
 });
}
