/* Mounts the written next-step choices on the final page, and the "to read again" page for missed words. */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function nextStepHTML(steps){
  return `<nav class="fnext" aria-label="The way on">${steps.map(s=>`<button type="button" class="fnx" data-step="${s.id}">${esc(s.text)}</button>`).join('')}</nav>`;
}
export function rereadHTML(words){
  return `<div class="freread" role="region" aria-label="Words to read again"><p class="frhead">To read again</p>
  <ul>${words.map(b=>`<li><button type="button" class="frw" data-i="${b.i}"><b>${esc(b.w)}</b>${b.pos?` <i>${esc(b.pos)}</i>`:''}<span>${esc(b.def||'')}</span></button></li>`).join('')}</ul>
  <button type="button" class="fnx frback" id="frback">Back to the ledger</button></div>`;
}
/* Wraps the existing button row with the choices above it. handlers: {daily,unlimited,reread}. */
export function mountNextStep(el,steps,handlers){
  const row=el.querySelector('.row');if(!row||!steps.length)return;
  const wrap=document.createElement('div');wrap.className='fway';
  row.before(wrap);wrap.insertAdjacentHTML('beforeend',nextStepHTML(steps));wrap.append(row);
  wrap.querySelectorAll('.fnx').forEach(b=>{b.onclick=()=>handlers[b.dataset.step]&&handlers[b.dataset.step]();});
}
export function showReread(el,words,openBook){
  const right=el.querySelector('.fright');if(!right)return;
  const saved=right.innerHTML;
  right.innerHTML=rereadHTML(words);right.classList.add('reading');
  right.querySelectorAll('.frw').forEach(b=>{b.onclick=()=>openBook(+b.dataset.i);});
  right.querySelector('#frback').onclick=()=>{right.innerHTML=saved;right.classList.remove('reading');if(el._rebind)el._rebind();};
}
