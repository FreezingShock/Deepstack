import {fmtNum} from '../core/numFmt.js';
/* Top bar rail: the live readouts (streak flame, deepest ft), a Keys button, and sound volume pips.
   Hooked from main.js with one line. Reads the save, never writes it; the Sound/Settings/Credits buttons stay in topbar.js. */
import './topbarRail.css';
import './railHatch.css';
import {railValues,dayKey} from './topbarRailCore.js';
import {loadSettings} from './settings.js';
import {scopeRoom,ALL} from './scope.js';

const SVG=(p)=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
const FLAME='<path d="M12 3c1 3.500 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3.200 2-4 .2 1.500 1 2.200 1.800 2.500C10.500 9 10.800 5.500 12 3z"/>';
const DEEP='<path d="M12 4v13M7 12.500l5 5 5-5"/><path d="M5 20.500h14"/>';
const KEYS='<rect x="3" y="7" width="18" height="11" rx="2"/><path d="M7 11h.01M11 11h.01M15 11h.01M7 14.500h10"/>';

export function initTopbarRail({S,Sfx,doc=document}={}){
 const bar=doc.querySelector('#bar'),nav=doc.querySelector('#barNav'),snd=doc.querySelector('#bSound');
 if(!bar||!nav)return;
 /* readouts sit beside the plaque; the centre of the bar stays free for the attic hatch and the depth plate */
 const g=doc.createElement('div');g.id='barGauges';g.setAttribute('aria-label','Your record');
 g.innerHTML=`<span class="bg bg-streak" role="button" tabindex="0" title="Daily streak">${SVG(FLAME)}<b id="bgStreak">0</b><i>day streak</i><i class="scope" id="bgStreakRoom"></i></span><span class="bg bg-deep" title="Deepest descent, all rooms">${SVG(DEEP)}<b id="bgDeep">0</b><i>ft deepest</i><i class="scope">${ALL}</i></span>`;
 doc.querySelector('#mark').after(g);
 const eR=g.querySelector('#bgStreakRoom'),eS=g.querySelector('#bgStreak'),eD=g.querySelector('#bgDeep'),gs=g.querySelector('.bg-streak');
 let rid='';const paint=()=>{const sr=scopeRoom(S);if(sr.id!==rid){rid=sr.id;eR.innerHTML=`<span class="rl-dot" style="--c:${sr.rgb}"></span>${sr.short}`;gs.title=`Daily streak in ${sr.name} (each room keeps its own)`;}const v=railValues(S,dayKey());const a=String(v.streak),b=fmtNum(v.deepest);
  if(eS.textContent!==a){eS.textContent=a;gs.classList.toggle('lit',v.streak>0);}
  if(eD.textContent!==b)eD.textContent=b;
  g.hidden=!doc.querySelector('#depthHud').hidden;};
 paint();setInterval(paint,1500);addEventListener('focus',paint);

 /* Keys button opens the existing ? page by sending the same key */
 const k=doc.createElement('button');k.type='button';k.id='bKeys';k.className='bbtn';k.setAttribute('aria-label','Keyboard shortcuts');k.dataset.tip='Shortcuts';k.dataset.key='?';
 k.innerHTML=SVG(KEYS);k.onclick=()=>{k.blur();doc.dispatchEvent(new KeyboardEvent('keydown',{key:'?',bubbles:true})); /* on the document: the key sheet listens there, not on the window */};
 nav.insertBefore(k,doc.querySelector('#bCredits')||null);

 /* tooltips as small engraved tags */
 const tips={bSound:['Sound','M'],bKeys:['Shortcuts','?'],bCredits:['Credits',''],bSettings:['Settings',',']};
 for(const id in tips){const b=doc.getElementById(id);if(!b)continue;b.dataset.tip=tips[id][0];if(tips[id][1])b.dataset.key=tips[id][1];b.removeAttribute('title');}

 /* sound: five brass pips show volume; the wheel nudges it */
 if(snd){
  const pips=doc.createElement('span');pips.className='pips';pips.setAttribute('aria-hidden','true');pips.innerHTML='<i></i>'.repeat(5);snd.append(pips);
  const vol=()=>{try{return loadSettings().volume;}catch(e){return 0.8;}};
  const showVol=v=>{[...pips.children].forEach((p,i)=>p.classList.toggle('on',v>=(i+.5)/5));};
  showVol(vol());
  addEventListener('deepstack:volume',e=>showVol(e.detail));
  snd.addEventListener('wheel',e=>{
   e.preventDefault();
   const n=Math.max(0,Math.min(1,Math.round((vol()+(e.deltaY<0?.2:-.2))*5)/5));
   dispatchEvent(new CustomEvent('deepstack:set-volume',{detail:n}));showVol(n);},{passive:false});
 }
}
