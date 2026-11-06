/* Keyboard shortcuts and the shortcut help panel. New module; main.js only
   calls initKeys(). Shortcuts click existing buttons, so game logic is not
   touched. */
import './keys.css';
import {SHORTCUT_GROUPS,isTyping,actionFor} from './keysCore.js';

export function initKeys({doc=document}={}){
 const $=s=>doc.querySelector(s);
 const stage=$('#stage');
 let opener=null,panel=null;

 /* skip link: first tab stop, jumps past the top bar into the game */
 const sk=doc.createElement('a');sk.href='#ui';sk.className='skiplink';sk.textContent='Skip to game';
 sk.addEventListener('click',e=>{e.preventDefault();const t=$('#ui');if(t){t.tabIndex=-1;t.focus({preventScroll:true});}});
 doc.body.insertBefore(sk,doc.body.firstChild);

 /* announce the shortcuts on the word screen buttons */
 const tag=()=>{
  if(!stage||stage.hidden)return;
  const h=$('#hint'),s=$('#skip');
  if(h&&!h.dataset.k){h.dataset.k='1';h.setAttribute('aria-keyshortcuts','Alt+H');h.title='Alt+H';}
  if(s&&!s.dataset.k){s.dataset.k='1';s.setAttribute('aria-keyshortcuts','Alt+S');s.title='Alt+S';}
  const keys=stage.querySelector('.keys');
  if(keys&&!keys.dataset.k){keys.dataset.k='1';keys.insertAdjacentHTML('beforeend',' · <kbd>Alt+H</kbd> hint · <kbd>Alt+S</kbd> skip');}
 };
 if(stage)new MutationObserver(tag).observe(stage,{childList:true,attributes:true,attributeFilter:['hidden']});

 const panelsOpen=()=>!!panel||['#cardlayer','#all','#stats','#topPanel'].some(s=>{const m=$(s);return m&&!m.hidden;});
 const modalOpen=()=>panelsOpen()||!!$('.bk-spread');

 function closeHelp(){
  if(!panel)return;panel.remove();panel=null;
  const o=opener;opener=null;if(o&&o.isConnected)o.focus({preventScroll:true});
 }
 function openHelp(){
  if(panel)return;
  opener=doc.activeElement&&doc.activeElement!==doc.body?doc.activeElement:null;
  panel=doc.createElement('div');panel.className='keyhelp';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','kh-t');
  const groups=SHORTCUT_GROUPS.map(([h,rows])=>`<h3>${h}</h3><dl>${rows.map(([k,d])=>`<div><dt>${k.split(' / ').map(x=>`<kbd>${x}</kbd>`).join(' or ')}</dt><dd>${d}</dd></div>`).join('')}</dl>`).join('');
  panel.innerHTML=`<div class="khbox"><h2 id="kh-t">Keys of the library</h2><p class="khsub">Press <kbd>?</kbd> any time you are not typing.</p>${groups}<button type="button" class="btn" id="khClose">Close</button></div>`;
  doc.body.appendChild(panel);
  panel.addEventListener('click',e=>{if(e.target===panel)closeHelp();});
  panel.querySelector('#khClose').onclick=closeHelp;
  panel.querySelector('#khClose').focus({preventScroll:true});
 }

 doc.addEventListener('keydown',e=>{
  if(panel){
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeHelp();}
   else if(e.key==='Tab'){e.preventDefault();panel.querySelector('#khClose').focus();}
   return;
  }
  const wordScreen=!!stage&&!stage.hidden&&!!$('#hint');
  /* inside an open menu book: / jumps to the search line, ? opens the key page, and chips and months answer to letters
     (Alt + letter while the search line has focus, which it does when the Shelf opens) */
  const inBook=!panelsOpen()&&!!$('.bk-spread');
  const typingNow=isTyping(e.target);
  if(inBook&&!e.ctrlKey&&!e.metaKey&&(typingNow?e.altKey&&e.target.id==='fq':!e.altKey)){
   const q=$('.bk-spread #fq');
   if(!typingNow&&e.key==='/'&&q){e.preventDefault();q.focus();q.select();return;}
   if(!typingNow&&e.key==='?'){e.preventDefault();openHelp();return;}
   const step=sel=>{const cs=[...doc.querySelectorAll('.bk-spread '+sel)].filter(c=>!c.disabled);if(!cs.length)return false;
    const i=cs.findIndex(c=>c.getAttribute('aria-pressed')==='true');cs[(i+1)%cs.length].click();return true;};
   const k=e.code&&/^Key[A-Z]$/.test(e.code)?e.code.slice(3).toLowerCase():(e.key||'').toLowerCase();let hit=false;
   if(k==='o')hit=step('.fchip[data-s]');
   else if(k==='g')hit=step('.fchip[data-g]');
   else if(k==='r')hit=step('.fchip[data-t]');
   else if(k==='f'){const b=$('.bk-spread #ffav');if(b&&!b.disabled){b.click();hit=true;}}
   else if(!typingNow&&(k==='['||k===']')){const n=doc.querySelectorAll('.bk-spread .cal-nav');const b=n[k==='['?0:1];if(b&&!b.disabled){b.click();hit=true;}}
   else if(!typingNow&&k==='t'){const b=$('.bk-spread .cal-d.today');if(b){b.click();hit=true;}}
   if(hit){e.preventDefault();return;}
  }
  const home=!!$('#home')&&!$('#home').hidden&&!$('#home').closest('[hidden]');
  const a=actionFor(e,{typing:isTyping(e.target),modal:modalOpen(),wordScreen,home});
  if(!a)return;
  e.preventDefault();
  if(a==='hint'){const b=$('#hint');if(b&&!b.disabled)b.click();}
  else if(a==='skip'){const b=$('#skip');if(b)b.click();}
  else if(a==='mute'){const b=$('#bSound');if(b)b.click();}
  else if(a==='help')openHelp();
  else if(a==='descend'){const b=$('#bPlay')||$('#bNext');if(b)b.click();}
  else if(a.startsWith('click:')){const b=$(a.slice(6));if(b&&!b.disabled&&!b.hidden&&b.offsetParent!==null)b.click();}
 },true);
 return{openHelp,closeHelp};
}
