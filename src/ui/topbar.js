/* Library-themed top bar: brass plaque, wooden lintel, and the buttons on it
   (How to play, Shelf, Stats, Sound, Credits, Settings) plus the panels they open. */
import './topbar.css';
import {HOME_STEPS} from './home.js';
import {loadSettings,saveSettings,applySettings,TEXT_SIZES} from './settings.js';

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const ICONS={
 how:'<path d="M4 5.5C6.5 4.4 9.5 4.4 12 6c2.5-1.6 5.5-1.6 8-.5V19c-2.5-1.1-5.5-1.1-8 .5-2.5-1.6-5.5-1.6-8-.5z"/><path d="M12 6v13.5"/>',
 shelf:'<path d="M3 20h18"/><rect x="5" y="6" width="3.2" height="14" rx=".6"/><rect x="9.6" y="4" width="3.2" height="16" rx=".6"/><path d="M15.6 20 14.6 6.2l3.1-.5 2.2 14.1"/>',
 stats:'<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
 sound:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="sw" d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/><path class="mu" d="m16 9.5 5 5M21 9.5l-5 5"/>',
 credits:'<path d="M5 20c6-1 11-6 14-15-5 .5-9 3-11.5 7C6.5 14 5.5 17 5 20z"/><path d="M9 15c2-3 5-5.500 8-7"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M18.400 5.600l-2.100 2.100M7.700 16.300l-2.100 2.100"/>',
};
const svg=k=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[k]}</svg>`;

const CREDITS=[
 ['Word meanings','Definitions and word data come from <a href="https://en.wiktionary.org" target="_blank" rel="noopener">Wiktionary</a>, parsed by <a href="https://kaikki.org" target="_blank" rel="noopener">kaikki.org</a> (Wiktextract). Licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.'],
 ['The judge','Your answers are scored on your own device by the <a href="https://huggingface.co/Xenova/all-MiniLM-L6-v2" target="_blank" rel="noopener">all-MiniLM-L6-v2</a> sentence model (Sentence-Transformers, Apache 2.0, ONNX build by Xenova), run in the browser with Transformers.js. Nothing you write is sent anywhere.'],
 ['Made by','Deepstack was created by nate.'],
];

export function initTopbar({Sfx,openShelf,openStats,doc=document}={}){
 const $=s=>doc.querySelector(s);
 let st=loadSettings();
 applySettings(st,doc);
 Sfx&&Sfx.volume(st.volume);
 const set=patch=>{st={...st,...patch};saveSettings(st);applySettings(st,doc);if('volume' in patch&&Sfx)Sfx.volume(st.volume);};

 /* ---- the plaque and buttons ---- */
 const mark=$('#mark');
 if(mark)mark.innerHTML='<span class="plq">Deepstack</span>';
 const nav=$('#barNav'),snd=$('#bSound');
 const mk=(id,key,label,fn,cls='')=>{const b=doc.createElement('button');b.type='button';b.id=id;b.className='bbtn '+cls;b.setAttribute('aria-label',label);b.title=label;b.innerHTML=svg(key)+`<span class="bl">${esc(label.split(' ')[0]==='How'?'How to play':label)}</span>`;b.onclick=fn;return b;};
 if(snd){snd.innerHTML=svg('sound')+'<span class="bl">Sound</span>';snd.title='Sound';
  const sync=()=>snd.setAttribute('aria-label',snd.getAttribute('aria-pressed')==='true'?'Sound on, press to mute':'Sound off, press to turn on');
  sync();new MutationObserver(sync).observe(snd,{attributes:true,attributeFilter:['aria-pressed']});}
 const bHow=mk('bHow','how','How to play',()=>openPanel('how',bHow));
 const bShelf=mk('bShelfTop','shelf','Shelf',()=>{closePanel();openShelf&&openShelf();},'opt');
 const bStats=mk('bStatsTop','stats','Stats',()=>{closePanel();openStats&&openStats();},'opt');
 const bCred=mk('bCredits','credits','Credits',()=>openPanel('credits',bCred));
 const bSet=mk('bSettings','settings','Settings',()=>openPanel('settings',bSet));
 if(nav){nav.prepend(bHow,bShelf,bStats);nav.append(bCred,bSet);}

 /* ---- panels ---- */
 const layer=doc.createElement('div');layer.id='topPanel';layer.hidden=true;doc.body.appendChild(layer);
 let current=null,opener=null;
 const body={
  how:()=>`<h2 id="tpT">How to play</h2><ol class="tpsteps">${HOME_STEPS.map(s=>`<li><b>${esc(s.h)}.</b> ${esc(s.p)}</li>`).join('')}</ol>
   <p>Each descent is seven words, the same for everyone that day, and you get 45 seconds per word. Press <kbd>Enter</kbd> to submit. A hint shows the word in a sentence, but costs depth.</p>
   <p>Rarer books mean a closer meaning: Pamphlet, Paperback, Hardbound, Folio, Codex, Grimoire, Apocrypha. Every book you earn goes on your shelf.</p>`,
  credits:()=>`<h2 id="tpT">Credits</h2><dl class="tpcred">${CREDITS.map(([h,p])=>`<dt>${h}</dt><dd>${p}</dd>`).join('')}</dl>`,
  settings:()=>{
   const on=snd&&snd.getAttribute('aria-pressed')==='true';
   return `<h2 id="tpT">Settings</h2>
   <div class="tprow"><span id="lSnd">Sound</span><button type="button" class="tpsw" id="sSound" role="switch" aria-checked="${on}" aria-labelledby="lSnd"><i></i></button></div>
   <div class="tprow"><label for="sVol">Volume</label><input id="sVol" type="range" min="0" max="100" step="5" value="${Math.round(st.volume*100)}" aria-valuetext="${Math.round(st.volume*100)} percent"><output id="oVol">${Math.round(st.volume*100)}%</output></div>
   <div class="tprow"><span id="lMot">Reduced motion</span><button type="button" class="tpsw" id="sMotion" role="switch" aria-checked="${st.motion==='reduce'}" aria-labelledby="lMot"><i></i></button></div>
   <p class="tphint">Calmer animations. The candle, dust and book-opening effects settle fully the next time the page loads.</p>
   <fieldset class="tprow tpseg"><legend>Text size</legend>${TEXT_SIZES.map((t,i)=>`<button type="button" data-text="${t}" aria-pressed="${st.text===t}" style="font-size:${14+i*3}px">A${i?'+'.repeat(i):''}<span class="sr-only"> ${['Normal','Large','Extra large'][i]}</span></button>`).join('')}</fieldset>
   <div class="tprow"><span id="lCon">High contrast</span><button type="button" class="tpsw" id="sContrast" role="switch" aria-checked="${st.contrast}" aria-labelledby="lCon"><i></i></button></div>`;
  },
 };
 function openPanel(k,from){
  opener=from||opener;current=k;
  layer.innerHTML=`<div class="tpbox" role="dialog" aria-modal="true" aria-labelledby="tpT"><button type="button" class="tpx" id="tpClose" aria-label="Close">×</button>${body[k]()}</div>`;
  layer.hidden=false;
  $('#tpClose').onclick=closePanel;
  if(k==='settings')wireSettings();
  $('#tpClose').focus({preventScroll:true});
 }
 function closePanel(){
  if(layer.hidden)return;
  layer.hidden=true;layer.innerHTML='';current=null;
  const o=opener;opener=null;if(o&&o.isConnected)o.focus({preventScroll:true});
 }
 function wireSettings(){
  const sw=(el,fn)=>el.onclick=()=>{const v=el.getAttribute('aria-checked')!=='true';el.setAttribute('aria-checked',v);fn(v);};
  sw($('#sSound'),()=>{snd&&snd.click();$('#sSound').setAttribute('aria-checked',snd.getAttribute('aria-pressed')==='true');});
  sw($('#sMotion'),v=>set({motion:v?'reduce':'full'}));
  sw($('#sContrast'),v=>set({contrast:v}));
  const vol=$('#sVol');vol.oninput=()=>{const n=+vol.value;$('#oVol').textContent=n+'%';vol.setAttribute('aria-valuetext',n+' percent');set({volume:n/100});};
  layer.querySelectorAll('[data-text]').forEach(b=>b.onclick=()=>{set({text:b.dataset.text});layer.querySelectorAll('[data-text]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
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
 return{openPanel,closePanel};
}
