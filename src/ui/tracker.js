// Depth tracker: a side rail with one segment per themed floor, its depth range, and where you are.
// railFraction is pure so it can be tested; buildTracker only touches the DOM it is given.
export const TAIL_FT = 300; // how much of the open-ended last floor the rail represents

/** Position along the rail (0 top, 1 bottom) for a depth. Every floor gets an equal segment. */
export function railFraction(ft, starts, tail = TAIL_FT) {
  const n = starts.length;
  let i = 0;
  for (let k = 0; k < n; k++) if (ft >= starts[k]) i = k;
  const end = i + 1 < n ? starts[i + 1] : starts[i] + tail;
  const within = Math.min(1, Math.max(0, (ft - starts[i]) / (end - starts[i])));
  return (i + within) / n;
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export function buildTracker(doc, floors, startOf, onJump) {
  const starts = floors.map(startOf);
  const nav = doc.createElement('nav');
  nav.id = 'tracker';
  nav.setAttribute('aria-label', 'Depth tracker');
  nav.hidden = true;
  const range = (f, i) => i + 1 < floors.length ? `${starts[i]}–${starts[i + 1]} ft` : `${starts[i]} ft and below`;
  nav.innerHTML = `<ol>${floors.map((f, i) =>
    `<li data-i="${i}" style="--fc:rgb(${f.lamp.join(',')})"><button type="button" tabindex="-1"><b>${esc(f.name)}</b><small>${range(f, i)}</small></button></li>`).join('')}</ol>` +
    `<div class="rail" aria-hidden="true">${floors.map(f => `<i class="seg" style="--fc:rgb(${f.lamp.join(',')})"></i>`).join('')}<i class="view"></i><i class="you"><b></b></i></div>`;
  const items = [...nav.querySelectorAll('li')], btns = items.map(li => li.firstChild);
  const segs = [...nav.querySelectorAll('.seg')], view = nav.querySelector('.view'), you = nav.querySelector('.you');
  btns.forEach((b, i) => { b.onclick = () => { if (!b.disabled) onJump(i); }; });
  let key = '';
  /** viewFt: depth on screen; youFt: your real depth; browsing: view differs from you. */
  function update(viewFt, youFt, browsing) {
    const k = `${viewFt | 0}|${youFt | 0}|${browsing ? 1 : 0}`;
    if (k === key) return;
    key = k;
    const yf = railFraction(youFt, starts), vf = railFraction(viewFt, starts);
    you.style.top = `${yf * 100}%`;
    view.style.top = `${vf * 100}%`;
    view.hidden = !browsing;
    let cur = 0;
    starts.forEach((s, i) => { if (viewFt >= s) cur = i; });
    items.forEach((li, i) => {
      const reached = youFt >= starts[i];
      li.classList.toggle('reached', reached);
      segs[i].classList.toggle('reached', reached);
      segs[i].classList.toggle('cur', i === cur);
      li.classList.toggle('cur', i === cur);
      btns[i].disabled = !reached;
      btns[i].tabIndex = reached ? 0 : -1;
      if (i === cur) btns[i].setAttribute('aria-current', 'location'); else btns[i].removeAttribute('aria-current');
      btns[i].title = reached ? `Look at ${floors[i].name}` : `Reach ${starts[i]} ft to unlock`;
    });
  }
  return {el: nav, update};
}
