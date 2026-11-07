import {loadEnabled,saveEnabled} from '../core/floorRules.js';
/* Library-themed top bar: brass plaque, wooden lintel, and the buttons on it
   (Sound, Credits, Settings) plus the panels they open. */
import './topbar.css';
import './panelBook.css';
import './settingsBook.css';
import {Quality,PREFS} from './quality.js';
import {openPanelBook} from './panelBook.js';
import {loadSettings,saveSettings,applySettings,reducedMotion,systemReduces,refreshMotion} from './settings.js';
import {settingsSpreads} from './settingsBook.js';
import {eraseProgress} from './progressReset.js';

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
 Sfx&&Sfx.levels(st.music,st.effects);
 const set=patch=>{st={...st,...patch};saveSettings(st);applySettings(st,doc);if('volume' in patch&&Sfx)Sfx.volume(st.volume);if(('music' in patch||'effects' in patch)&&Sfx)Sfx.levels(st.music,st.effects);if('motion' in patch)refreshMotion(st);};

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
 /* the Settings book's pages for the current settings: one spread at normal text, three at larger text */
 const sndOn=()=>!!snd&&snd.getAttribute('aria-pressed')==='true';
 const settingsSpreadsNow=()=>settingsSpreads({st,sound:sndOn(),prefs:PREFS,pref:Quality.pref(),floorRules:loadEnabled(),osCalm:systemReduces()});
 const body={
  credits:()=>`<h2 id="tpT">Credits</h2><dl class="tpcred">${CREDITS.map(([h,p])=>`<dt>${h}</dt><dd>${p}</dd>`).join('')}</dl>`,
  settings:()=>`<h2 id="tpT">Settings</h2>${settingsSpreadsNow().map(s=>s.l+s.r).join('')}`,
 };
 const useBook=doc===globalThis.document&&typeof matchMedia==='function';
 let book=null;
 /* Settings and Credits grow out of the pressed button as a book (panelBook.js); the plain panel below is the fallback. */
 function openAsBook(k,from){
  if(book)return;
  current=k;opener=from||opener;
  const common={from,wire:sp=>{if(k==='settings')wireSettings(sp);},
   onClose:()=>{book=null;current=null;const o=opener;opener=null;if(o&&o.isConnected)o.focus({preventScroll:true});}};
  book=k==='settings'
   ? openPanelBook({...common,title:'Settings',kicker:'Your library, your way',spreads:settingsSpreadsNow()})
   : openPanelBook({...common,title:'Credits',kicker:'Who made this possible',left:body.credits().replace(/<h2 id="tpT">\w+<\/h2>/,'')});
 }
 /* a text size change re-flows the Settings pages; the book stays on the page it was on (or the last one left) */
 function repaginate(){
  if(!book)return;
  const s=settingsSpreadsNow();book.setSpreads(s,Math.min(book.index,s.length-1));
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
  const $=sel=>root.querySelector(sel);
  /* each control lives on one page of the book, and a page turn repaints only the current one, so a lookup may find nothing */
  const on=(sel,fn)=>{const el=$(sel);if(el)fn(el);};
  /* pages repaint on a turn: show the live values, not the ones the book was opened with */
  on('#sSound',el=>el.setAttribute('aria-checked',sndOn()));on('#sContrast',el=>el.setAttribute('aria-checked',st.contrast));
  on('#sFloorRules',el=>el.setAttribute('aria-checked',loadEnabled()));on('#sHaptics',el=>el.setAttribute('aria-checked',st.haptics!==false));
  const pct=v=>Math.round(v*100);
  const showSlider=(id,v)=>{const el=$(id);if(!el)return;el.value=pct(v);el.setAttribute('aria-valuetext',pct(v)+' percent');$('#o'+id.slice(2)).textContent=pct(v)+'%';};
  showSlider('#sVol',st.volume);showSlider('#sMus',st.music);showSlider('#sFx',st.effects);
  const mark=(sel,attr,val)=>root.querySelectorAll(sel).forEach(x=>x.setAttribute('aria-pressed',x.dataset[attr]===val));
  mark('[data-text]','text',st.text);mark('[data-q]','q',Quality.pref());mark('[data-motion-choice]','motionChoice',st.motion);
  const sw=(el,fn)=>el.onclick=()=>{const v=el.getAttribute('aria-checked')!=='true';el.setAttribute('aria-checked',v);fn(v);};
  on('#sSound',el=>sw(el,()=>{snd&&snd.click();el.setAttribute('aria-checked',sndOn());}));
  on('#sContrast',el=>sw(el,v=>set({contrast:v})));
  on('#sFloorRules',el=>sw(el,v=>saveEnabled(v)));
  on('#sHaptics',el=>sw(el,v=>set({haptics:v})));
  root.querySelectorAll('[data-motion-choice]').forEach(b=>b.onclick=()=>{set({motion:b.dataset.motionChoice});mark('[data-motion-choice]','motionChoice',st.motion);});
  root.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{Quality.setPref(b.dataset.q);mark('[data-q]','q',Quality.pref());});
  root.querySelectorAll('[data-text]').forEach(b=>b.onclick=()=>{set({text:b.dataset.text});mark('[data-text]','text',st.text);repaginate();});
  /* kind: the bus to sample when the slider is let go (ST4), so the level can be heard before the next sound */
  const slide=(id,apply,kind)=>{const el=$(id);if(!el)return;el.oninput=()=>{const n=+el.value;$('#o'+id.slice(2)).textContent=n+'%';el.setAttribute('aria-valuetext',n+' percent');apply(n/100);};if(kind)el.onchange=()=>{Sfx&&Sfx.preview&&Sfx.preview(kind);};};
  slide('#sVol',v=>{dispatchEvent(new CustomEvent('deepstack:volume',{detail:v}));set({volume:v});});
  slide('#sMus',v=>set({music:v}),'music');
  slide('#sFx',v=>set({effects:v}),'effects');
  /* Progress: the reset asks first. Keep is the default focus; Erase clears the save and reloads into an empty library. */
  const confirm=$('#sConfirm'),reset=$('#sReset'),row=$('#sDangerRow');
  if(reset&&confirm&&row){
   reset.onclick=()=>{row.hidden=true;confirm.hidden=false;$('#scKeep').focus({preventScroll:true});};
   $('#scKeep').onclick=()=>{confirm.hidden=true;row.hidden=false;reset.focus({preventScroll:true});};
   on('#scGo',el=>el.onclick=()=>{eraseProgress();location.reload();});
  }
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
