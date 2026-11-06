import {loadEnabled,saveEnabled} from '../core/floorRules.js';
/* Library-themed top bar: brass plaque, wooden lintel, and the buttons on it
   (Sound, Credits, Settings) plus the panels they open. */
import './topbar.css';
import './panelBook.css';
import {Quality,PREFS} from './quality.js';
import {openPanelBook} from './panelBook.js';
import {loadSettings,saveSettings,applySettings,TEXT_SIZES,reducedMotion} from './settings.js';

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const ICONS={
 sound:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="sw" d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/><path class="mu" d="m16 9.5 5 5M21 9.5l-5 5"/>',
 credits:'<path d="M5 20c6-1 11-6 14-15-5 .5-9 3-11.5 7C6.5 14 5.5 17 5 20z"/><path d="M9 15c2-3 5-5.500 8-7"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M18.400 5.600l-2.100 2.100M7.700 16.300l-2.100 2.100"/>',
};
const svg=k=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[k]}</svg>`;

const CREDITS=[
 ['Word meanings','Definitions and word data come from <a href="https://en.wiktionary.org" target="_blank" rel="noopener">Wiktionary</a>, parsed by <a href="https://kaikki.org" target="_blank" rel="noopener">kaikki.org</a> (Wiktextract). Licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.'],
 ['Synonyms','Everyday synonyms come from <a href="https://wordnet.princeton.edu" target="_blank" rel="noopener">Princeton WordNet</a> (WordNet licence) and the public-domain Moby Thesaurus; word frequency from the OpenSubtitles list by hermitdave.'],
 ['The judge','Your answers are scored on your own device by the <a href="https://huggingface.co/Xenova/all-MiniLM-L6-v2" target="_blank" rel="noopener">all-MiniLM-L6-v2</a> sentence model (Sentence-Transformers, Apache 2.0, ONNX build by Xenova), run in the browser with Transformers.js. Nothing you write is sent anywhere.'],
 ['Made by','Deepstack was created by nate.'],
];

export function initTopbar({Sfx,doc=document}={}){
 const $=s=>doc.querySelector(s);
 let st=loadSettings();
 applySettings(st,doc);
 Sfx&&Sfx.volume(st.volume);
 const set=patch=>{st={...st,...patch};saveSettings(st);applySettings(st,doc);if('volume' in patch&&Sfx)Sfx.volume(st.volume);};

 addEventListener('deepstack:set-volume',e=>{set({volume:e.detail});dispatchEvent(new CustomEvent('deepstack:volume',{detail:e.detail}));});
 /* ---- the plaque and buttons ---- */
 const mark=$('#mark');
 if(mark)mark.innerHTML='<span class="plq">Deepstack</span>';
 const nav=$('#barNav'),snd=$('#bSound');
 const mk=(id,key,label,fn,cls='')=>{const b=doc.createElement('button');b.type='button';b.id=id;b.className='bbtn '+cls;b.setAttribute('aria-label',label);b.title=label;b.innerHTML=svg(key)+`<span class="bl">${esc(label)}</span>`;b.onclick=fn;return b;};
 if(snd){snd.innerHTML=svg('sound')+'<span class="bl">Sound</span>';snd.title='Sound';
  const sync=()=>snd.setAttribute('aria-label',snd.getAttribute('aria-pressed')==='true'?'Sound on, press to mute':'Sound off, press to turn on');
  sync();new MutationObserver(sync).observe(snd,{attributes:true,attributeFilter:['aria-pressed']});}
 const bCred=mk('bCredits','credits','Credits',()=>openPanel('credits',bCred));
 const bSet=mk('bSettings','settings','Settings',()=>openPanel('settings',bSet));
 if(nav){nav.append(bCred,bSet);}

 /* ---- panels ---- */
 const layer=doc.createElement('div');layer.id='topPanel';layer.hidden=true;doc.body.appendChild(layer);
 let current=null,opener=null;
 const body={
  credits:()=>`<h2 id="tpT">Credits</h2><dl class="tpcred">${CREDITS.map(([h,p])=>`<dt>${h}</dt><dd>${p}</dd>`).join('')}</dl>`,
  settings:()=>{
   const on=snd&&snd.getAttribute('aria-pressed')==='true';
   return `<h2 id="tpT">Settings</h2>
   <div class="tprow"><span id="lSnd">Sound</span><button type="button" class="tpsw" id="sSound" role="switch" aria-checked="${on}" aria-labelledby="lSnd"><i></i></button></div>
   <div class="tprow"><label for="sVol">Volume</label><input id="sVol" type="range" min="0" max="100" step="5" value="${Math.round(st.volume*100)}" aria-valuetext="${Math.round(st.volume*100)} percent"><output id="oVol">${Math.round(st.volume*100)}%</output></div>
   <div class="tprow"><span id="lMot">Reduced motion</span><button type="button" class="tpsw" id="sMotion" role="switch" aria-checked="${st.motion==='reduce'}" aria-labelledby="lMot"><i></i></button></div>
   <p class="tphint">Calmer animations. The candle, dust and book-opening effects settle fully the next time the page loads.</p>
   <!--pg-->
   <fieldset class="tprow tpseg"><legend>Text size</legend>${TEXT_SIZES.map((t,i)=>`<button type="button" data-text="${t}" aria-pressed="${st.text===t}" style="font-size:${14+i*3}px">A${i?'+'.repeat(i):''}<span class="sr-only"> ${['Normal','Large','Extra large'][i]}</span></button>`).join('')}</fieldset>
   <fieldset class="tprow tpseg" id="sQual"><legend>Graphics</legend>${PREFS.map(p=>`<button type="button" data-q="${p}" aria-pressed="${Quality.pref()===p}">${p[0].toUpperCase()+p.slice(1)}</button>`).join('')}</fieldset>
   <p class="tphint">Auto lightens dust, particles and resolution on slow devices. Pick Low if the library stutters.</p>
   <div class="tprow"><span id="lCon">High contrast</span><button type="button" class="tpsw" id="sContrast" role="switch" aria-checked="${st.contrast}" aria-labelledby="lCon"><i></i></button></div>
   <div class="tprow"><span id="lFR">Floor rules</span><button type="button" class="tpsw" id="sFloorRules" role="switch" aria-checked="${loadEnabled()}" aria-labelledby="lFR"><i></i></button></div>
   <p class="tphint">Each deeper floor bends one small rule in Unlimited, like a faster candle. The Daily never uses them.</p>`;
  },
 };
 const useBook=doc===globalThis.document&&typeof matchMedia==='function';
 let book=null;
 /* Settings and Credits grow out of the pressed button as a book (panelBook.js); the plain panel below is the fallback. */
 function openAsBook(k,from){
  if(book)return;
  const raw=body[k]().replace(/<h2 id="tpT">\w+<\/h2>/,''),[l,r]=k==='settings'?raw.split('<!--pg-->'):[raw,''];
  current=k;opener=from||opener;
  book=openPanelBook({from,title:k==='settings'?'Settings':'Credits',kicker:k==='settings'?'Your library, your way':'Who made this possible',left:l,right:r,
   wire:sp=>{if(k==='settings')wireSettings(sp);},
   onClose:()=>{book=null;current=null;const o=opener;opener=null;if(o&&o.isConnected)o.focus({preventScroll:true});}});
 }
 function openPanel(k,from){
  if(useBook){openAsBook(k,from);return;}
  opener=from||opener;current=k;
  layer.innerHTML=`<div class="tpbox bookbox" role="dialog" aria-modal="true" aria-labelledby="tpT"><button type="button" class="tpx" id="tpClose" aria-label="Close">×</button>${body[k]()}</div>`;
  layer.classList.remove('leaving');layer.hidden=false;
  $('#tpClose').onclick=closePanel;
  if(k==='settings')wireSettings();
  $('#tpClose').focus({preventScroll:true});
 }
 function closePanel(){
  if(layer.hidden||layer.classList.contains('leaving'))return;
  const o=opener;opener=null;current=null;if(o&&o.isConnected)o.focus({preventScroll:true});
  layer.classList.add('leaving');
  setTimeout(()=>{if(current)return;layer.classList.remove('leaving');layer.hidden=true;layer.innerHTML='';},reducedMotion()?0:160);
 }
 function wireSettings(root=layer){
  const $=s=>root.querySelector(s);
  /* pages repaint on a turn: show the live values, not the ones the book was opened with */
  $('#sSound').setAttribute('aria-checked',!!snd&&snd.getAttribute('aria-pressed')==='true');$('#sMotion').setAttribute('aria-checked',st.motion==='reduce');$('#sContrast').setAttribute('aria-checked',st.contrast);
  $('#sVol').value=Math.round(st.volume*100);$('#oVol').textContent=Math.round(st.volume*100)+'%';
  root.querySelectorAll('[data-text]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.text===st.text));root.querySelectorAll('[data-q]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.q===Quality.pref()));
  const sw=(el,fn)=>el.onclick=()=>{const v=el.getAttribute('aria-checked')!=='true';el.setAttribute('aria-checked',v);fn(v);};
  sw($('#sSound'),()=>{snd&&snd.click();$('#sSound').setAttribute('aria-checked',snd.getAttribute('aria-pressed')==='true');});
  sw($('#sMotion'),v=>set({motion:v?'reduce':'full'}));
  sw($('#sContrast'),v=>set({contrast:v}));
  $('#sFloorRules').setAttribute('aria-checked',loadEnabled());sw($('#sFloorRules'),v=>saveEnabled(v));
  root.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{Quality.setPref(b.dataset.q);root.querySelectorAll('[data-q]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
  const vol=$('#sVol');vol.oninput=()=>{const n=+vol.value;dispatchEvent(new CustomEvent('deepstack:volume',{detail:n/100}));$('#oVol').textContent=n+'%';vol.setAttribute('aria-valuetext',n+' percent');set({volume:n/100});};
  root.querySelectorAll('[data-text]').forEach(b=>b.onclick=()=>{set({text:b.dataset.text});root.querySelectorAll('[data-text]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
 }
 layer.addEventListener('click',e=>{if(e.target===layer)closePanel();});
 /* capture phase so Esc closes this panel before main.js sees it; Tab stays inside */
 addEventListener('keydown',e=>{
  if(layer.hidden)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closePanel();return;}
  if(e.key==='Tab'){
   const f=[...layer.querySelectorAll('button,input,a[href]')].filter(x=>!x.disabled);if(!f.length)return;
   const a=doc.activeElement;
   if(!layer.contains(a)){e.preventDefault();f[0].focus();}
   else if(e.shiftKey&&a===f[0]){e.preventDefault();f[f.length-1].focus();}
   else if(!e.shiftKey&&a===f[f.length-1]){e.preventDefault();f[0].focus();}
  }else if(e.key==='Enter'&&e.target.tagName==='BUTTON'){e.stopImmediatePropagation();}
 },true);
 return{openPanel,closePanel:()=>book?book.close():closePanel()};
}
