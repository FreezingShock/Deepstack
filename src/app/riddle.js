/* Riddle Shelf: the reverse of the Daily. A slip shows a definition and you write the word.
   Same alcove, candle, hints, combo and descent as the other runs; its own judge (core/riddleJudge.js) and save key (S.riddle). */
import {rowsAfterHints} from '../core/hints.js';
import {applyCombo,comboNeeds,comboLabel,comboMultiplier} from '../core/combo.js';
import {recordBook as recordSetBook} from '../sets/sets.js';
import {toastSetsDone} from '../sets/ui.js';
import * as core from '../core/index.js';
import {riddleJudge,riddleLadder,riddleVerdict} from '../core/riddleJudge.js';
import {dailyRiddleWords,recordRiddleDay,riddleDay} from '../core/riddleDaily.js';
import {RIDDLE_WORDS,loadRiddle,recordRiddleRun,riddleTarget} from '../core/riddleStats.js';
import {Sfx} from '../feel.js';
import {loadRelations} from '../scorer/index.js';
import {relOf} from '../scorer/relations.js';
import {attachInk} from '../ui/inkInput.js';
import {paintRun} from '../ui/runScreen.js';
import {seatCandle} from '../ui/candle.js';
import {paintHintControls,hintSlipHtml} from '../ui/hintSlips.js';
import {FT,S,TIERS,dailyNo,utc,floorAtFt,floorAtRow,save,tierOf,wordsReady} from './state.js';
import {World} from '../world/world.js';
import {ui} from './chrome.js';
import {$,esc,sleep} from './util.js';
import {FX} from './fx.js';
import {openCard} from './card.js';
import {showFinal} from './final.js';
import {pipsHTML,run,setRun} from './run.js';

const LIMIT=40000,NUMERALS=['I','II','III','IV','V','VI','VII','VIII'];
let timerId=0;

export async function startRiddle(){return beginRiddle(false);}
/* Today's riddle: the same seven definitions for everyone (seeded by UTC date), one attempt. A second visit replays the first result. */
export async function startTodayRiddle(){return beginRiddle(true);}
async function beginRiddle(daily){
 await wordsReady;await loadRelations();
 S.riddle=loadRiddle(S.riddle);
 const day=utc();
 if(daily){const done=riddleDay(S,day);if(done){showFinal(done,true);return;}}
 const L=S.rating&&S.rating.placed?S.rating.L:core.START_LEVEL,seen=new Set(S.riddle.seen),used=[];
 let words=[];
 if(daily)words=dailyRiddleWords(day,RIDDLE_WORDS);
 else for(let i=0;i<RIDDLE_WORDS;i++){const w=core.pickWord(riddleTarget(L,i,RIDDLE_WORDS),new Set([...seen,...used]),Math.random);words.push(w);used.push(w.id);}
 World.reset();World.setShelf([]);
 setRun({mode:'riddle',daily,day,practice:false,i:0,words,results:[],busy:false,depthRows:0,floor:0,combo:0,freeHint:true});
 ui.home.hidden=true;ui.cap.hidden=true;ui.final.hidden=true;ui.hud.hidden=false;$('#dnum').textContent='0';
 showRiddle();
}
export function showRiddle(){
 if(!run)return;const w=run.words[run.i];run.busy=false;run.t0=performance.now();run.limit=LIMIT;
 const el=ui.stage;el.hidden=false;el.className='center fadein riddle';
 el.innerHTML=`<div class="candle" id="candle" aria-hidden="true"><div class="wax" id="wax"><i class="flame"></i><i class="wick"></i></div><div class="plate"></div></div><div class="sheet">${pipsHTML()}
  <div class="wlabel">Riddle ${run.i+1} of ${run.words.length}</div>${run.combo?`<div class="combo live" title="Keep answering ${comboNeeds()} or better">Combo ${comboLabel(comboMultiplier(run.combo+1))} next</div>`:''}
  <p class="rdef" id="rdef">${esc(w.def)}</p>
  <div class="pos">${esc(w.pos)} · what is the word?</div><div class="clock" id="clock" aria-hidden="true">0:40</div>
  <div class="timer" id="tbar"><i id="tfill"></i></div>
  <div class="slipwrap" id="fld"><i class="pin"></i><div class="slip"><textarea id="ans" class="rans" rows="1" placeholder="The word…" maxlength="28" aria-label="The word that fits" enterkeyhint="send" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off"></textarea></div></div>
  <div class="hintline" id="hl" aria-live="polite"></div>
  <div class="row" style="margin-top:6px"><button class="btn" id="hint"></button><button class="btn" id="skip">Skip</button><span class="keys"><kbd>Enter</kbd> to submit</span></div></div>`;
 World.openNiche(World.restRow,{label:NUMERALS[run.i],books:run.results});
 seatCandle(el,run.limit);
 const ta=$('#ans');setTimeout(()=>ta.focus({preventScroll:true}),120);
 ta.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();submit(false);}};
 attachInk(ta);
 ta.oninput=()=>{Sfx.quill();const f=$('#candle .flame');if(f){const r=f.getBoundingClientRect();if(r.width)FX.ember(r.left+r.width/2,r.top+4);}};
 run.ladder=riddleLadder(w,relOf(w.w));run.hintN=0;paintHintBtn();
 $('#hint').onclick=useHint;$('#skip').onclick=()=>submit(true);
 clearInterval(timerId);
 timerId=setInterval(()=>{if(!run||run.mode!=='riddle'){clearInterval(timerId);return;}if(run.busy)return;const left=Math.max(0,run.limit-(performance.now()-run.t0));const f=$('#tfill');if(!f)return;const fr=left/run.limit;f.style.transform=`scaleX(${fr})`;$('#tbar').classList.toggle('low',left<10000);$('#wax').style.height=(12+58*fr)+'px';$('#candle').classList.toggle('low',left<10000);paintRun(left,run.limit);if(left<=0)submit(!$('#ans').value.trim());},100);
}
function paintHintBtn(spent){paintHintControls(document,run,FT,spent);}
function useHint(){if(!run||run.busy)return;const n=run.ladder[run.hintN];if(!n)return;run.hintN++;const free=!!run.freeHint;run.freeHint=false;if(!free)run.hintSpent=(run.hintSpent||0)+n.cost;
 const hl=$('#hl');hl.insertAdjacentHTML('beforeend',hintSlipHtml(n,null,free?0:n.cost*FT|0,run.hintN));Sfx.flip&&Sfx.flip();requestAnimationFrame(()=>hl.classList.add('on'));paintHintBtn(true);$('#ans').focus({preventScroll:true});}
async function submit(skipped){
 if(!run||run.busy||run.mode!=='riddle')return;const w=run.words[run.i];const text=$('#ans').value.trim();
 if(!skipped&&!text){const f=$('#fld');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake');return;}
 run.busy=true;clearInterval(timerId);
 const j=skipped?{score:0,kind:'empty',empty:true,opposite:false}:riddleJudge(text,w,relOf(w.w));
 const t=tierOf(j.score);
 const spent=skipped?0:(run.hintSpent||0);run.hintSpent=0;
 const base=skipped?2:rowsAfterHints(Math.max(3,Math.round(3+.32*j.score)),spent);
 const cb=applyCombo(run.combo,t,base,skipped);run.combo=cb.chain;const rows=cb.rows;
 const verdict=skipped?'Skipped. The word is shown.':riddleVerdict(j,w);
 const book={fl:floorAtRow(World.restRow+rows).id,wid:w.id,w:w.w,pos:w.pos,def:w.def,answer:skipped?'':text,score:j.score,tier:t,mode:'riddle',t:Date.now(),no:run.daily?core.dailyNumber(run.day):dailyNo(),hints:run.hintN||0,verdict,rows,ft:Math.round(rows*FT),combo:cb.chain>=2?{n:cb.chain,mult:cb.mult,ft:Math.round(cb.bonus*FT)}:undefined};
 {const sw=$('#fld');if(sw){sw.classList.add('sending');Sfx.seal();const r=sw.getBoundingClientRect();FX.puff(r.left,r.top,r.width,r.height,40);}FX.warm(t);}
 await sleep(260);ui.stage.classList.add('out');await sleep(300);ui.stage.hidden=true;
 ui.gauge.classList.add('on');ui.skip.classList.add('on');
 const depth0=Math.round(World.restRow*FT),nicheRow=World.restRow;
 await World.descend({rows,tier:t,score:j.score,word:w.w});
 ui.gauge.classList.remove('on');ui.skip.classList.remove('on');
 FX.land(innerWidth/2,innerHeight*.5,t);
 run.results.push({...book,skipped});run.depthRows+=rows;
 World.fillNiche(nicheRow,{w:w.w,pos:w.pos,answer:text,score:j.score,tier:t,ft:book.ft,verdict,skipped},run.results.slice());
 if(cb.chain)setTimeout(()=>Sfx.link(cb.chain),120);else if(cb.broke)setTimeout(()=>Sfx.clunk(),200);
 S.shelf.push({...book});if(S.shelf.length>300)S.shelf.shift();
 {const fin=recordSetBook(S,book);toastSetsDone(fin);run.setBonus=(run.setBonus||0)+fin.reduce((n,x)=>n+x.bonus,0);}save();
 const depth1=Math.round((World.restRow+rows)*FT);
 openCard(book,{fresh:true,depth0,depth1,broke:cb.broke,chain:cb.chain,last:run.i>=run.words.length-1,onNext:async()=>{World.release();run.i++;run.busy=true;const last=run.i>=run.words.length;const nr=World.restRow+World.nextRows();World.openNiche(nr,{label:last?'FINIS':NUMERALS[run.i],books:run.results});await World.glide(nr,1200);if(last)finishRiddle();else showRiddle();}});
}
export function finishRiddle(){
 const r=run,books=r.results,avg=Math.round(books.reduce((a,b)=>a+b.score,0)/books.length),best=Math.max(...books.map(b=>b.tier));
 const worldDepth=Math.round(World.restRow*FT),setBonus=r.setBonus||0,depth=r.daily?worldDepth:worldDepth+setBonus; // like the Daily, today's riddle scores words only
 const solved=books.filter(b=>b.score>=92).length;
 const d={books,avg,best,depth,floor:floorAtFt(worldDepth).id,practice:false,setBonus:setBonus||undefined,mode:'riddle',solved,of:books.length};
 if(r.daily){d.day=r.day;S.riddle=loadRiddle(S.riddle);if(recordRiddleDay(S.riddle,r.day,d))S.bestDepth=Math.max(S.bestDepth,depth);save();}
 else{S.riddle=recordRiddleRun(S.riddle,books,r.words.map(w=>w.id));S.bestDepth=Math.max(S.bestDepth,depth);save();}
 showFinal(d,false);
}
