// The landing between two words of an Unlimited descent: three doors (Hard room, Rest alcove, Curio shop),
// and for the curio a choice of two relics. The rules live in core/descent.js; this only draws and waits.
import {PATHS, RELICS, pathOptions, takePath, relicChoices, takeRelic} from '../core/descent.js';
import './descent.css';

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

/** Chips under the word that show what the run carries. Empty string when it carries nothing. */
export function carryChipsHTML(d) {
  if (!d) return '';
  const chips = [];
  for (const id of d.relics) {
    const r = RELICS.find(x => x.id === id);
    if (r) chips.push(`<span class="dc-chip relic" title="${esc(r.fx)}">${esc(r.name)}</span>`);
  }
  if (d.spare > 0) chips.push('<span class="dc-chip spare" title="Your next failed word will not end the run">Spare breath</span>');
  if (d.pathMult > 1) chips.push(`<span class="dc-chip path" title="Feet multiplied for this word">Hard room ×${d.pathMult}</span>`);
  return chips.length ? `<div class="dc-carry" aria-label="Carrying">${chips.join('')}</div>` : '';
}


const carryLine = d => {
  const names = d.relics.map(id => (RELICS.find(r => r.id === id) || {}).name).filter(Boolean);
  if (d.spare > 0) names.push('Spare breath');
  return names.length ? `Carrying: ${names.join(' · ')}` : 'Carrying nothing yet';
};

function doorsHTML(d) {
  return pathOptions(d).map(p => `<button class="dl-door${p.enabled ? '' : ' off'}" data-path="${p.id}" ${p.enabled ? '' : 'disabled aria-disabled="true"'}>
    <span class="dl-key" aria-hidden="true">${p.letter}</span>
    <span class="dl-name">${esc(p.name)}</span>
    <span class="dl-fx">${esc(p.enabled ? p.fx : p.reason)}</span>
    <span class="dl-line">${esc(p.line)}</span>
  </button>`).join('');
}

function relicsHTML(list) {
  return list.map((r, i) => `<button class="dl-door dl-relic" data-relic="${r.id}">
    <span class="dl-key" aria-hidden="true">${'ABCDEFG'[i]}</span>
    <span class="dl-name">${esc(r.name)}</span>
    <span class="dl-fx">${esc(r.fx)}</span>
    <span class="dl-line">${esc(r.line)}</span>
  </button>`).join('');
}

/**
 * Shows the landing in `el` and resolves with the run's new descent state once the player takes a door.
 * `after` is the word number that comes next (1-based) so the kicker can say where the landing sits.
 */
export function landingPick(el, d, {rng = Math.random, nextWord = 1, of = 7} = {}) {
  return new Promise(resolve => {
    el.hidden = false;
    el.className = 'center dl-stage';
    el.innerHTML = `<section class="dl" aria-labelledby="dl-title">
      <p class="dl-kicker">Landing before word ${nextWord} of ${of}</p>
      <h2 class="dl-title" id="dl-title">Three ways on</h2>
      <p class="dl-lede">Each way costs something. A failed word ends the run unless you carry Spare breath.</p>
      <p class="dl-carry">${esc(carryLine(d))}</p>
      <div class="dl-doors" data-step="paths">${doorsHTML(d)}</div>
    </section>`;
    requestAnimationFrame(() => el.querySelector('.dl')?.classList.add('on'));
    let done = false;
    const finish = next => {
      if (done) return;
      done = true;
      removeEventListener('keydown', onKey);
      resolve(next);
    };
    const shop = () => {
      const list = relicChoices(d, rng);
      el.querySelector('.dl-title').textContent = 'The curio shop';
      el.querySelector('.dl-lede').textContent = 'The shopkeeper lays out two relics. Keep one; the rest of the run carries it.';
      el.querySelector('.dl-carry').textContent = carryLine(d);
      el.querySelector('[data-step]').outerHTML = `<div class="dl-doors" data-step="relics">${relicsHTML(list)}</div>`;
      el.querySelector('[data-step="relics"]').onclick = e => {
        const b = e.target.closest('[data-relic]');
        if (b) finish(takeRelic(d, b.dataset.relic));
      };
      keys = {A: list[0] && (() => finish(takeRelic(d, list[0].id))), B: list[1] && (() => finish(takeRelic(d, list[1].id)))};
    };
    let keys = {};
    el.querySelector('[data-step="paths"]').onclick = e => {
      const b = e.target.closest('[data-path]');
      if (!b || b.disabled) return;
      if (b.dataset.path === 'curio') return shop();
      finish(takePath(d, b.dataset.path));
    };
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (keys[k]) { e.preventDefault(); keys[k](); return; }
      if (k === 'A' || k === 'B' || k === 'C') {
        const p = PATHS.find(x => x.letter === k);
        const btn = el.querySelector(`[data-path="${p.id}"]`);
        if (!btn || btn.disabled) return;
        e.preventDefault();
        if (p.id === 'curio') return shop();
        finish(takePath(d, p.id));
      }
    };
    addEventListener('keydown', onKey);
  });
}

/** A line for the final page: how the descent went, and whether the run ended on a failure. */
export function descentNoteHTML(s) {
  const spare = s.spent ? ` Spare breath kept it going ${s.spent === 1 ? 'once' : s.spent + ' times'}.` : '';
  if (s.ended) return `<p class="dl-final">The run ended at word ${s.endedAt} of ${s.of}.${esc(spare)} Relics do not carry over a failed run.</p>`;
  const kept = s.relics.length ? `Carried: ${s.relics.join(' \u00b7 ')}.` : 'Nothing carried.';
  return `<p class="dl-final">The descent held to the last word.${esc(spare)} ${esc(kept)}</p>`;
}
