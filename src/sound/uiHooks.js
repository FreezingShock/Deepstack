/* Wires the sound palette to the page: a brass tick on any button press, a faint one on hover (fine pointers only),
   and a wooden knock on Escape-closing dialogs is left to the dialogs. One delegated listener each, no per-element work. */
export function installUiSounds(Sfx, doc = document) {
  const btn = e => e.target && e.target.closest && e.target.closest('button:not([disabled]),[role=button]');
  const down = e => { if (btn(e)) Sfx.cue('tick'); };
  const over = e => { const b = btn(e); if (b && e.pointerType === 'mouse' && !b.contains(e.relatedTarget)) Sfx.cue('hover'); };
  doc.addEventListener('pointerdown', down, true);
  doc.addEventListener('pointerover', over, true);
  return () => { doc.removeEventListener('pointerdown', down, true); doc.removeEventListener('pointerover', over, true); };
}
