import {fmtNum} from '../core/numFmt.js';
import {hintLadder,rowsAfterHints} from '../core/hints.js';
import {verdictFor} from '../core/verdict.js';
import {comboNeeds,comboLabel,comboMultiplier,applyCombo} from '../core/combo.js';
import {recordBook as recordSetBook} from '../sets/sets.js';
import {recordMet,recordMastery} from '../core/roomDepth.js';
import {recordStamps} from '../core/stamps.js';
import {dayWord,recordWeekly,weekStartOf,weekdayIndex,weeklyWords,dayName,dayRecord} from '../core/weekly.js';
import {fullPool} from '../core/roomPool.js';
import {pinNemesis,recordNemesis,BEAT_SCORE} from '../core/nemesis.js';
import {toastStamps} from '../ui/stampToast.js';
import '../ui/stamps.css';
import {toastSetsDone} from '../sets/ui.js';
import * as core from '../core/index.js';
import {Sfx} from '../feel.js';
import {modelStatus,whenReady,prepareWords,judgeAnswer} from '../scorer/index.js';
import {replayLayout,ROMAN} from '../core/replay.js';
import {resumable,snapshotRun} from '../core/dailyRun.js';
import {attachInk} from '../ui/inkInput.js';
import {paintRun} from '../ui/runScreen.js';
import {ruleFor,limitFor,loadEnabled,WHISPER_AT_MS} from '../core/floorRules.js';
import {seatCandle} from '../ui/candle.js';
import {writeInRun} from '../ui/runWriteIn.js';
import {paintHintControls,hintSlipHtml} from '../ui/hintSlips.js';
import {showFirstNote,clearFirstNote} from '../ui/firstNotes.js';
import {feedbackData} from '../core/feedback.js';
import {runLedgeHTML} from '../ui/runLedge.js';
import {currentRoom} from '../core/roomStore.js';
import {FT,S,TIERS,dailyNo,dailyWords,floorAtFt,floorAtRow,save,tierOf,utc,wordsReady} from './state.js';
import {World} from '../world/world.js';
import {ui} from './chrome.js';
import {$,esc,sleep} from './util.js';
import {FX} from './fx.js';
import {openCard} from './card.js';
import {showFinal} from './final.js';

/* ---------- daily run ---------- */
export let run=null,timerId=0;
export async function startDaily(practice){
 await wordsReady;
 if(modelStatus().state==='loading')await whenReady(8000);
 const day=utc(),words=dailyWords(day,7);
 prepareWords(words).catch(()=>{});
 World.reset();World.setShelf([]);
 run={practice,day,i:0,words,results:[],busy:false,depthRows:0,floor:0,combo:0,freeHint:true};
 const saved=practice?null:resumable(S,day,words.length);
 if(saved){run.results=saved.results.map(r=>({...r}));run.combo=saved.combo;run.freeHint=!run.results.some(r=>r.hints>0);run.setBonus=saved.setBonus;run.i=run.results.length;run.depthRows=run.results.reduce((n,r)=>n+(r.rows||0),0);
  const L=replayLayout(run.results,{gapRows:World.nextRows(),ftPerRow:FT});L.niches[L.niches.length-1].label=ROMAN[run.i]||'FINIS';World.restore(L);
  ui.home.hidden=true;ui.cap.hidden=true;ui.final.hidden=true;ui.hud.hidden=false;$('#dnum').textContent=fmtNum(L.finalRow*FT);
  if(L.finalRow>0)await World.glide(L.finalRow,400);
  if(run.i>=words.length)finishRun();else showWord();
  return;}
 ui.home.hidden=true;ui.cap.hidden=true;ui.final.hidden=true;ui.hud.hidden=false;$('#dnum').textContent='0';
 showWord();
}
export async function startUnlimited(replace=false){
 await wordsReady;
 if(modelStatus().state==='loading')await whenReady(8000);
 if(replace&&S.rating.placed){S.rating={...S.rating,placed:false};save();}
 const placing=!S.rating.placed,n=placing?core.PLACEMENT_WORDS:core.RUN_WORDS;
 const first=core.nextWord(S.rating,0,n,[]);
 prepareWords([first]).catch(()=>{});
 World.reset();World.setShelf([]);
 run={mode:'unlimited',placing,practice:false,i:0,words:Array(n).fill(first),results:[],busy:false,depthRows:0,floor:0,combo:0,freeHint:true,lex0:core.lexicon(S.rating.L)};
 ui.home.hidden=true;ui.cap.hidden=true;ui.final.hidden=true;ui.hud.hidden=false;$('#dnum').textContent='0';
 showWord();
}
/* ---------- weekly run: today's themed word (one word a day, core/weekly.js). Strict judge, like the Daily; kept in S.weekly. ---------- */
export async function startWeekly(){
 await wordsReady;
 if(modelStatus().state==='loading')await whenReady(8000);
 const day=utc(),w=dayWord(day,fullPool()),{theme}=weeklyWords(weekStartOf(day),fullPool());
 if(!w)return;
 prepareWords([w]).catch(()=>{});
 World.reset();World.setShelf([]);
 run={mode:'weekly',practice:false,day,wk:weekStartOf(day),theme,wlabel:`${theme.name} \u00b7 ${dayName(day)}`,i:0,words:[w],results:[],busy:false,depthRows:0,floor:0,combo:0,freeHint:true};
 ui.home.hidden=true;ui.cap.hidden=true;ui.final.hidden=true;ui.hud.hidden=false;$('#dnum').textContent='0';
 showWord();
}
/* ---------- nemesis: this week's rematch word, one swing a week (core/nemesis.js). Strict judge, like the weekly word; kept in S.nemesis. ---------- */
export async function startNemesis(){
 await wordsReady;
 if(modelStatus().state==='loading')await whenReady(8000);
 const day=utc(),wk=weekStartOf(day),pool=fullPool();
 const rec=pinNemesis(S,wk,pool);
 if(!rec||rec.duel)return;
 const w=pool.find(x=>x.w===rec.w);
 if(!w)return;
 save(); // keeps the week's pinned word even if the player closes the book now
 prepareWords([w]).catch(()=>{});
 World.reset();World.setShelf([]);
 run={mode:'nemesis',practice:false,day,wk,wlabel:`Nemesis \u00b7 ${dayName(day)}`,i:0,words:[w],results:[],busy:false,depthRows:0,floor:0,combo:0,freeHint:true};
 ui.home.hidden=true;ui.cap.hidden=true;ui.final.hidden=true;ui.hud.hidden=false;$('#dnum').textContent='0';
 showWord();
}
/* Today's weekly result, read back from S.weekly for the Daily book's button (null until today's word is answered). */
export function weeklyFinal(){
 const day=utc(),rec=dayRecord(S,day);if(!rec)return null;
 const {theme}=weeklyWords(weekStartOf(day),fullPool());
 return {books:[rec],avg:rec.score,best:rec.tier,depth:rec.ft||0,floor:rec.fl,practice:false,mode:'weekly',weekKey:weekStartOf(day),themeKey:theme.key,themeName:theme.name,dayIdx:weekdayIndex(day)};
}
export function pipsHTML(){return runLedgeHTML(run.words,run.results,run.i,TIERS);}
export function showWord(){
 if(!run)return;const w=run.words[run.i];run.busy=false;run.t0=performance.now();const fr_=ruleFor(floorAtRow(World.restRow).key,run,loadEnabled());run.rule=fr_;run.whispered=false;run.limit=limitFor(fr_);
 const el=ui.stage;el.hidden=false;el.className='center';
 el.innerHTML=`<div class="candle" id="candle" aria-hidden="true"><div class="wax" id="wax"><i class="flame"></i><i class="wick"></i></div><div class="plate"></div></div><div class="sheet">${pipsHTML()}
  <div class="wlabel">${run.wlabel?esc(run.wlabel):`Word ${run.i+1} of ${run.words.length}`}</div>${fr_?`<div class="floorrule">${esc(fr_.line)}</div>`:''}${run.combo?`<div class="combo live" title="Keep answering ${comboNeeds()} or better">Combo ${comboLabel(comboMultiplier(run.combo+1))} next</div>`:''}
  <div class="word${fr_&&fr_.smear?' smeared':''}" aria-label="${esc(w.w)}">${[...w.w].map((c,i)=>`<span style="animation-delay:${60+i*45}ms">${esc(c)}</span>`).join('')}</div>
  <div class="pos">${esc(w.pos)}</div><div class="clock" id="clock" aria-hidden="true">${Math.floor(run.limit/60000)}:${String(run.limit/1000%60).padStart(2,'0')}</div>
  <div class="timer" id="tbar"><i id="tfill"></i></div>
  <div class="slipwrap" id="fld"><i class="pin"></i><div class="slip"><textarea id="ans" placeholder="${innerWidth<=640?'In your words\u2026':'In your own words\u2026'}" maxlength="300" aria-label="Your explanation" enterkeyhint="send"></textarea></div></div>
  <div class="hintline" id="hl" aria-live="polite"></div>
  <div class="row" style="margin-top:6px"><button class="btn" id="hint"></button><button class="btn" id="skip">Skip</button><span class="keys"><kbd>Enter</kbd> to submit</span></div></div>`;
 World.openNiche(World.restRow,{label:['I','II','III','IV','V','VI','VII','VIII'][run.i],books:run.results});
 writeInRun(el);seatCandle(el,run.limit);
 {const rn=run;setTimeout(()=>{if(run===rn&&!rn.busy)showFirstNote(S,'slip',save);},900);} // first word only: a seen flag keeps it to once per player
 const ta=$('#ans');setTimeout(()=>ta.focus({preventScroll:true}),120);
 ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(false);}};
 attachInk(ta);
 ta.oninput=()=>{Sfx.quill();clearFirstNote('slip');const wd=$('.word.smeared');if(wd)wd.classList.remove('smeared');const f=$('#candle .flame');if(f){const r=f.getBoundingClientRect();if(r.width){FX.ember(r.left+r.width/2,r.top+4);FX.ember(r.left+r.width/2,r.top+2);}}};
 run.ladder=hintLadder(w);run.hintN=0;paintHintBtn();
 $('#hint').onclick=useHint;$('#skip').onclick=()=>submit(true);
 clearInterval(timerId);
 timerId=setInterval(()=>{if(!run||run.busy)return;const left=Math.max(0,run.limit-(performance.now()-run.t0));const f=$('#tfill');if(!f)return;const fr=left/run.limit;Sfx.candle(fr);f.style.transform=`scaleX(${fr})`;$('#tbar').classList.toggle('low',left<10000);$('#wax').style.height=(12+58*fr)+'px';$('#candle').classList.toggle('low',left<10000);if(left<10000)showFirstNote(S,'candle',save);paintRun(left,run.limit);if(run.rule&&run.rule.whisper&&!run.whispered&&left<=WHISPER_AT_MS)whisper();if(left<=0)submit(!$('#ans').value.trim());},100);
}
function whisper(){run.whispered=true;const n=run.ladder[run.hintN];if(!n)return;run.hintN++;const hl=$('#hl');
 if(hl){hl.insertAdjacentHTML('beforeend',hintSlipHtml(n,run.words[run.i].w,0,run.hintN));requestAnimationFrame(()=>hl.classList.add('on'));}paintHintBtn(true);}
export function paintHintBtn(spent){paintHintControls(document,run,FT,spent);}
export function useHint(){if(!run||run.busy)return;const n=run.ladder[run.hintN];if(!n)return;run.hintN++;const free=!!run.freeHint;run.freeHint=false;if(!free)run.hintSpent=(run.hintSpent||0)+n.cost;
 const hl=$('#hl');
 hl.insertAdjacentHTML('beforeend',hintSlipHtml(n,run.words[run.i].w,free?0:n.cost*FT|0,run.hintN));Sfx.flip&&Sfx.flip();requestAnimationFrame(()=>hl.classList.add('on'));if(free)showFirstNote(S,'hint',save);paintHintBtn(true);$('#ans').focus({preventScroll:true});}
export async function submit(skipped){
 if(!run||run.busy)return;const w=run.words[run.i];let text=$('#ans').value.trim();
 if(!skipped&&!text){const f=$('#fld');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake');return;}
 run.busy=true;clearInterval(timerId);Sfx.candle(1);
 /* the press answers at once: the slip holds still, locks, and says it is being read (the judge can take a moment, or the librarian can still be arriving) */
 const fld0=$('#fld'),ta0=$('#ans');
 if(!skipped&&fld0&&ta0){ta0.readOnly=true;fld0.classList.add('judging');fld0.insertAdjacentHTML('beforeend','<div class="hslip reading" id="reading" role="status">Reading your answer…</div>');} // inside the slip, not the hint strip: a line added below would squeeze the slip
 const j=skipped?{score:0,caught:[],missed:w.concepts.map(c=>c[0]),opposite:false,empty:true}:await judgeAnswer(text,w,run.practice||run.mode==='unlimited'?undefined:{strict:true,onWait:()=>{const rd=$('#reading');if(rd){rd.textContent='The librarian is still arriving. Your answer is safe and will be read in a moment.';return;}const h=$('#hl');if(h)h.insertAdjacentHTML('beforeend','<div class="hslip" style="--tilt:-.6deg">The librarian is still arriving. Your answer is safe and will be read in a moment.</div>');}});
 $('#reading')?.remove();$('#fld')?.classList.remove('judging');
 const t=tierOf(j.score);
 const spent=skipped?0:(run.hintSpent||0);run.hintSpent=0;
 const base=skipped?2:rowsAfterHints(Math.max(3,Math.round(3+.32*j.score)),spent);
 const cb=applyCombo(run.combo,t,base,skipped);run.combo=cb.chain;const rows=cb.rows;
 const book={fl:floorAtRow(World.restRow+rows).id,wid:w.id,w:w.w,pos:w.pos,def:w.def,answer:skipped?'':text,score:j.score,rough:j.engine==='lexical'||undefined,tier:t,mode:run.mode||'daily',room:currentRoom(S)==='hall'?undefined:currentRoom(S),t:Date.now(),no:dailyNo(),hints:run.hintN||0,fb:feedbackData(j,w),verdict:skipped?'Skipped. The word stays closed.':verdictFor(j,t,w),rows,ft:Math.round(rows*FT),combo:cb.chain>=2?{n:cb.chain,mult:cb.mult,ft:Math.round(cb.bonus*FT)}:undefined};
 {const sw=$('#fld');if(sw){sw.classList.add('sending');Sfx.seal();const r=sw.getBoundingClientRect();FX.puff(r.left,r.top,r.width,r.height,40);}FX.warm(t);}
 await sleep(260);ui.stage.classList.add('out');await sleep(300);ui.stage.hidden=true;
 ui.gauge.classList.add('on');ui.skip.classList.add('on');
 const depth0=Math.round(World.restRow*FT),nicheRow=World.restRow;
 await World.descend({rows,tier:t,score:j.score,word:w.w});
 ui.gauge.classList.remove('on');ui.skip.classList.remove('on');
 FX.land(innerWidth/2,innerHeight*.5,t);
 run.results.push({...book,skipped});run.depthRows+=rows;
 World.fillNiche(nicheRow,{w:w.w,pos:w.pos,answer:text,score:j.score,tier:t,ft:book.ft,verdict:book.verdict,skipped},run.results.slice());
 if(cb.chain)setTimeout(()=>Sfx.link(cb.chain),120);else if(cb.broke)setTimeout(()=>Sfx.clunk(),200); // the ledge chain gains a link or lets go
 if(run.mode==='unlimited'){S.rating=core.applyResult(S.rating,w,j.score,run.i);save();}
 if(!run.practice){if(run.mode==='weekly')recordWeekly(S,run.day,book);if(run.mode==='nemesis')recordNemesis(S,run.wk,book);recordMet(S,book);recordMastery(S,utc());S.shelf.push({...book});if(S.shelf.length>300)S.shelf.shift();{const fin=recordSetBook(S,book);toastSetsDone(fin);run.setBonus=(run.setBonus||0)+fin.reduce((n,x)=>n+x.bonus,0);}toastStamps(recordStamps(S,utc()));save();}
 if(!run.practice&&run.mode!=='unlimited'&&run.mode!=='weekly'&&run.mode!=='nemesis'){S.dailyRun=snapshotRun(run);save();}
 const depth1=Math.round((World.restRow+rows)*FT);
 openCard(book,{fresh:true,depth0,depth1,broke:cb.broke,chain:cb.chain,last:run.i>=run.words.length-1,onNext:async()=>{World.release();run.i++;run.busy=true;const last=run.i>=run.words.length;if(!last&&run.mode==='unlimited'){run.words[run.i]=core.nextWord(S.rating,run.i,run.words.length,run.words.slice(0,run.i).map(x=>x.id));prepareWords([run.words[run.i]]).catch(()=>{});}const nr=World.restRow+World.nextRows();World.openNiche(nr,{label:last?'FINIS':['I','II','III','IV','V','VI','VII','VIII'][run.i],books:run.results});await World.glide(nr,1200);if(last)finishRun();else showWord();}});
}
export {verdictFor} from '../core/verdict.js';
export function finishRun(){
 const r=run;const books=r.results;const avg=Math.round(books.reduce((a,b)=>a+b.score,0)/books.length);const best=Math.max(...books.map(b=>b.tier));
 const worldDepth=Math.round(World.restRow*FT),setBonus=r.setBonus||0,isDaily=r.mode!=='unlimited',depth=isDaily?worldDepth:worldDepth+setBonus; // Daily depth is words only: set bonuses depend on each player's collection, so they stay out of the shared score
 const d={books,avg,best,depth,floor:floorAtFt(worldDepth).id,practice:r.practice,setBonus:setBonus||undefined};
 if(r.mode==='unlimited'){S.rating=core.finishRating(S.rating,avg);S.bestDepth=Math.max(S.bestDepth,depth);save();Object.assign(d,{mode:'unlimited',placing:r.placing,lex0:r.lex0,lex:core.lexicon(S.rating.L)});}
 else if(r.mode==='weekly'){Object.assign(d,{mode:'weekly',weekKey:r.wk,themeKey:r.theme.key,themeName:r.theme.name,dayIdx:weekdayIndex(r.day)});toastStamps(recordStamps(S,utc()));save();}
 else if(r.mode==='nemesis'){Object.assign(d,{mode:'nemesis',word:books[0].w,beat:books[0].score>=BEAT_SCORE,wk:r.wk});toastStamps(recordStamps(S,utc()));save();}
 else if(!r.practice){delete S.dailyRun;if(core.recordDaily(S,r.day||utc(),d))S.bestDepth=Math.max(S.bestDepth,depth);toastStamps(recordStamps(S,utc()));save();}
 showFinal(d,false);
}
export function setRun(v){run=v;}

