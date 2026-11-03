/* Accessibility layer: screen reader announcements, landmarks, dialog focus
   handling. Observes the DOM instead of hooking game code, so it only needs
   one import in main.js. */
import './a11y.css';
import {timerCue,scoreSentence} from './a11yCues.js';

export function initA11y(doc=document){
 const $=s=>doc.querySelector(s);
 const live=doc.createElement('div');
 live.id='sr';live.className='sr-only';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');
 doc.body.appendChild(live);
 let flip=false;
 const say=t=>{flip=!flip;live.textContent=t+(flip?'':' ');};

 /* landmarks and decorative layers */
 const label=(id,role,name)=>{const e=$(id);if(e){e.setAttribute('role',role);e.setAttribute('aria-label',name);}};
 label('#home','region','Deepstack home');
 label('#stage','region','Current word');
 label('#final','region','Descent results');
 label('#gauge','presentation','');
 for(const s of ['#world','#fx','#gauge','#skiph','#shelfcap'])$(s)&&$(s).setAttribute('aria-hidden','true');
 const ui=$('#ui');if(ui)ui.setAttribute('role','main');
 const bar=$('#bar');if(bar)bar.setAttribute('role','banner');
 const g=$('#gauge');if(g)g.removeAttribute('aria-label');

 /* modal dialogs: role, trap Tab, restore focus */
 const MODALS=['#cardlayer','#all','#stats'];
 const cl=$('#cardlayer');if(cl){cl.setAttribute('role','dialog');cl.setAttribute('aria-modal','true');cl.setAttribute('aria-label','Book result');}
 const returnTo=new Map();
 for(const id of MODALS){const m=$(id);if(!m)continue;
  new MutationObserver(()=>{
   if(!m.hidden){if(!returnTo.has(id)){const a=doc.activeElement;returnTo.set(id,a&&a!==doc.body?a:null);}}
   else if(returnTo.has(id)){const r=returnTo.get(id);returnTo.delete(id);if(r&&r.isConnected&&!r.disabled&&!r.closest('[hidden]'))r.focus({preventScroll:true});}
  }).observe(m,{attributes:true,attributeFilter:['hidden']});
 }
 doc.addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const m=[...MODALS].reverse().map($).find(x=>x&&!x.hidden);if(!m)return;
  const f=[...m.querySelectorAll('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled&&x.offsetParent!==null);
  if(!f.length)return;
  const first=f[0],last=f[f.length-1],a=doc.activeElement;
  if(!m.contains(a)){e.preventDefault();first.focus();}
  else if(e.shiftKey&&a===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&a===last){e.preventDefault();first.focus();}
 });

 /* the word screen */
 const stage=$('#stage');let prevLeft=null;
 const tidyStage=()=>{
  const w=stage.querySelector('.word');
  if(w&&!w.dataset.a){w.dataset.a='1';w.setAttribute('role','img');for(const s of w.children)s.setAttribute('aria-hidden','true');}
  const p=stage.querySelector('.pips');if(p)p.setAttribute('role','img');
  const t=stage.querySelector('#tbar');if(t)t.setAttribute('aria-hidden','true');
  const ta=stage.querySelector('#ans'),k=stage.querySelector('.keys');
  if(ta&&k){k.id='a11y-keys';ta.setAttribute('aria-describedby','a11y-keys');if(w)ta.setAttribute('aria-label',`Your explanation of ${w.getAttribute('aria-label')}`);}
  const c=stage.querySelector('.combo');if(c)c.setAttribute('role','status');
 };
 if(stage){
  let lastKey='';
  new MutationObserver(()=>{
   if(stage.hidden){lastKey='';return;}
   tidyStage();
   const lab=stage.querySelector('.wlabel'),w=stage.querySelector('.word'),pos=stage.querySelector('.pos');
   if(!lab||!w)return;
   const key=lab.textContent+w.getAttribute('aria-label');
   if(key===lastKey)return;lastKey=key;prevLeft=null;
   say(`${lab.textContent}. ${w.getAttribute('aria-label')}, ${pos?pos.textContent:''}. Forty-five seconds. Press Enter to submit.`);
  }).observe(stage,{childList:true,attributes:true,attributeFilter:['hidden']});
  setInterval(()=>{
   if(stage.hidden)return;const f=stage.querySelector('#tfill');if(!f)return;
   const m=/scaleX\(([\d.]+)\)/.exec(f.style.transform||'');if(!m)return;
   const left=Math.ceil(parseFloat(m[1])*45);
   const cue=timerCue(prevLeft,left);prevLeft=left;if(cue)say(cue);
  },500);
 }

 /* book result card */
 if(cl){
  let said=null;
  new MutationObserver(()=>{
   if(cl.hidden){said=null;return;}
   const bk=cl.querySelector('#bk'),vd=cl.querySelector('#vd');
   if(!bk||!vd||!vd.classList.contains('on')||said===bk)return;
   said=bk;
   const q=s=>{const e=cl.querySelector(s);return e?e.textContent.trim():'';};
   const h2=cl.querySelector('h2');
   say(scoreSentence({word:h2?h2.firstChild.textContent:'',tier:q('.tierbar b'),score:parseInt((cl.querySelector('#mt')||{style:{}}).style.width)||0,verdict:q('#vd'),def:q('.def')}));
  }).observe(cl,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
 }

 /* end of run */
 const fin=$('#final');
 if(fin)new MutationObserver(()=>{
  if(fin.hidden)return;const t=fin.querySelector('h1');if(!t||fin.dataset.said===t.textContent+fin.querySelector('#shr')?.textContent)return;
  fin.dataset.said=t.textContent+(fin.querySelector('#shr')?.textContent||'');
  const st=[...fin.querySelectorAll('.stats span')].map(s=>s.textContent).join(', ');
  say(`${t.textContent}. ${st}. Result text is ready to copy.`);
 }).observe(fin,{childList:true,attributes:true,attributeFilter:['hidden']});

 /* Escape from the skip hint etc. is handled in main.js; expose say for others */
 return {say};
}
