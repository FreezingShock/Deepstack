// In-page detector for clipped or overflowing text. Runs inside the browser via page.evaluate(findClipped).
// Flags an element that directly holds text when:
//   - it clips (overflow hidden/clip/auto/scroll) and its content is wider or taller than its box, or
//   - its text runs past the edge of the viewport.
// Intentional ellipsis (text-overflow: ellipsis) still counts: nate wants text that fits, not text that is cut.
// Visually hidden helpers (sr-only, display none, zero size) are ignored.
export function findClipped() {
  const out = [];
  const vw = document.documentElement.clientWidth;
  const label = el => {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
  };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  for (const el of document.body.querySelectorAll('*')) {
    const text = ownText(el);
    if (!text || /^(SCRIPT|STYLE|CANVAS|TEXTAREA|INPUT)$/.test(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (cs.position === 'absolute' && /rect\(0/.test(cs.clip)) continue;
    // an ancestor that hides it (closed panel, off-screen scene) means the user cannot see it either
    let hidden = false;
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) { hidden = true; break; }
    }
    if (hidden) continue;
    const clips = /(hidden|clip|auto|scroll)/.test(cs.overflowX + cs.overflowY);
    const what = [];
    if (clips && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) what.push(`content ${el.scrollWidth}px wide in a ${el.clientWidth}px box`);
    if (clips && el.scrollHeight > el.clientHeight + 1 && el.clientHeight > 0 && cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') what.push(`content ${el.scrollHeight}px tall in a ${el.clientHeight}px box`);
    // measure only this element's own text nodes (visually hidden child spans sit elsewhere on purpose)
    const range = document.createRange();
    const tn = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    range.setStartBefore(tn[0]); range.setEndAfter(tn[tn.length - 1]);
    const tr = range.getBoundingClientRect();
    if (tr.width && (tr.right > vw + 1 || tr.left < -1)) what.push(`text spans ${Math.round(tr.left)}..${Math.round(tr.right)}px of a ${vw}px viewport`);
    if (what.length) out.push({el: label(el), text: text.slice(0, 40), why: what.join('; ')});
  }
  return out;
}

// Tiny text, small-caps tracking and unformatted depths, the copy side of the same sweep. Runs via page.evaluate(findTiny, minPx).
// Flags visible HTML text whose computed size is under minPx (it reads as dust on a phone), uppercase text under 20px
// tracked under 0.06em (small caps need air), and any depth written without its thousands comma: "1008 ft" or
// "706–1008 ft" (it must be "1,008 ft"), or a bare 4+ digit counter.
export function findTiny(minPx) {
  const out = [];
  const XHTML = 'http://www.w3.org/1999/xhtml';
  const label = el => {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
  };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const COUNTERS = ['dnum', 'cnt', 'bgDeep'];
  for (const el of document.body.querySelectorAll('*')) {
    if (el.namespaceURI !== XHTML) continue; // SVG text scales with its transform, so its CSS size is not what is drawn
    const text = ownText(el);
    if (!text || /^(SCRIPT|STYLE|CANVAS|TEXTAREA|INPUT)$/.test(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    let hidden = false;
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) { hidden = true; break; }
    }
    if (hidden) continue;
    const what = [];
    const px = parseFloat(cs.fontSize);
    if (px < minPx - 0.01) what.push(`renders at ${px.toFixed(1)}px, under the ${minPx}px floor`);
    // a running entrance animation (rvink, tierin, fbanner) tweens letter-spacing through 0, so read it only once settled
    const moving = (() => { for (let a = el; a && a !== document.body; a = a.parentElement) if (a.getAnimations().some(x => x.playState === 'running')) return true; return false; })();
    const ls = parseFloat(cs.letterSpacing) || 0; // 'normal' reads as 0
    if (!moving && cs.textTransform === 'uppercase' && px < 20 && ls / px < 0.06 - 0.001) what.push(`uppercase at ${px.toFixed(0)}px tracked ${(ls / px).toFixed(2)}em, under the 0.06em small-caps floor`);
    if (/\d{4,}\s?ft\b/.test(text) || /–\d{4,}/.test(text) || (COUNTERS.includes(el.id) && /^\d{4,}$/.test(text))) what.push('depth written without a thousands comma');
    if (what.length) out.push({el: label(el), text: text.slice(0, 40), why: what.join('; ')});
  }
  return out;
}
