import * as core from '../core/index.js';
import {Sfx} from '../feel.js';
import {modelStatus} from '../scorer/index.js';
import {judgeLabel} from '../ui/judgeLabel.js';
import {homeHTML,bookify,BOOK_ACTS,BOOK_INTROS} from '../ui/home.js';
import {setBookSfx} from '../ui/bookOpenFx.js';
import {applyHomeTier} from '../ui/homeLayout.js';
import {descendInto} from '../ui/descend.js';
import {ui} from './chrome.js';
import {FLOORS,S,computeStats,dailyNo,fmtCountdown,msUntilNextDaily,utc} from './state.js';
import {World} from '../world/world.js';
import {$} from './util.js';
import {setRun,startDaily,startUnlimited} from './run.js';
import {showFinal} from './final.js';
import {placeDailyTab} from '../ui/dailyBind.js';
import {startRiddle,startTodayRiddle} from './riddle.js';
import {bindAtticHome} from '../ui/atticHome.js';
import {bindDeskProps} from '../ui/deskProps.js';
import {rankHTML} from '../ui/lexiconRank.js';
import {trendHTML} from '../ui/lexiconTrend.js';
import {mountHearth} from '../ui/hearth.js';
import {hearthMood} from '../ui/hearthMood.js';
import {mountIdleRoom} from '../ui/idleRoom.js';
import {mountRoomHome} from '../ui/roomHome.js';
import {roomMetLabel} from '../core/roomDepth.js';
import {currentRoom} from '../core/roomStore.js';
import {goRoom} from './roomGo.js';
import {fillTodayMet} from '../ui/todayMet.js';

/* ---------- home ---------- */
export let cdTimer=0;
export function showHome(opts){
 const keep=!!(opts&&opts.keep===true); // keep: walking between rooms, the fireplace and wall stay as they are
 const held=keep&&ui.home.querySelector(':scope > .hearth');
 setRun(null);ui.stage.hidden=true;ui.final.hidden=true;ui.hud.hidden=true;ui.gauge.classList.remove('on');clearInterval(cdTimer);
 const d=S.daily[utc()],st=computeStats(S,utc());World.setShelf(S.shelf);
 ui.home.hidden=false;ui.home.className=keep?'center':'center fadein';
 ui.home.innerHTML=homeHTML({S,st,d,no:dailyNo(),today:utc(),floorName:S.bestFloor?FLOORS[S.bestFloor].name:'',floorKey:S.bestFloor?FLOORS[S.bestFloor].key:'',tierInk:(()=>{const t=S.shelf.reduce((m,b)=>Math.max(m,b.tier|0),-1);return t>=0?core.TIERS?.[t]?.ink||'':''})(),lexicon:core.lexicon});
 paintJudge(modelStatus());fillTodayMet(S);
 if(!keep){World.clearNiches();World.openNiche(0,{label:'',books:[]});}
 $('#bPlay')&&($('#bPlay').onclick=e=>descendInto(e.currentTarget,()=>startDaily(false)));
 $('#bRes')&&($('#bRes').onclick=()=>showFinal(d,true));
 $('#bNext')&&($('#bNext').onclick=e=>descendInto(e.currentTarget,()=>startUnlimited()));
 $('#bUnl').onclick=()=>startUnlimited();
 BOOK_INTROS.bUnl.extra=()=>rankHTML(S.rating,core.lexicon)+trendHTML(S.rating&&S.rating.hist);
 /* the main action is always a run: Descend once placed, "Find my rank" (the placement words) the first time; re-placing is the quiet second choice */
 BOOK_INTROS.bUnl.btn=()=>S.rating.placed?'Descend':'Find my rank';
 BOOK_INTROS.bUnl.second=()=>S.rating.placed?`<button class="bs-again pen-ink" data-act="replace">Place me again</button>`:'';
 BOOK_ACTS.replace=()=>startUnlimited(true);
 BOOK_ACTS.practice=()=>startDaily(true);BOOK_ACTS.riddle=startRiddle;BOOK_ACTS.dailyRiddle=startTodayRiddle;BOOK_ACTS.daily=()=>d?showFinal(d,true):startDaily(false);
 
 bookify(ui.home);applyHomeTier(ui.home);
 placeDailyTab(ui.home,d,utc());
 bindAtticHome(ui.home,{shelf:S.shelf});
 bindDeskProps(ui.home,{sfx:Sfx});
 const hearth=mountHearth(ui.home,{sfx:Sfx,mood:hearthMood(S,st.streak),reuse:!!held});
 mountIdleRoom(ui.home,{sfx:Sfx,hearth});
 Sfx.room(currentRoom(S)); // this room's accents (no-op when the room is already the one playing)
 mountRoomHome(ui.home,{room:currentRoom(S),go:goRoom,openLedger:()=>$('#bRooms')&&$('#bRooms').click(),met:id=>roomMetLabel(S,id)});
 setBookSfx(n=>n==="whoosh"?Sfx.cue("lift"):n==="thud"?Sfx.cue("shut"):n==="flip"?Sfx.cue("turn"):Sfx[n]&&Sfx[n]());
 if(d){const tick=()=>{const el=$('#nextd');if(!el)return clearInterval(cdTimer);el.textContent='Next descent in '+fmtCountdown(msUntilNextDaily());};tick();cdTimer=setInterval(tick,1000);}
 ui.cap.hidden=true;
}
export async function leaveRun(){setRun(null);ui.stage.hidden=true;ui.final.hidden=true;ui.hud.hidden=true;await World.ascend();showHome();}
/* ---------- judge status (model download) ---------- */
export function paintJudge(st){const el=$('#jstat');if(!el)return;
 const t=judgeLabel(st);el.dataset.state=st.state;el.title=st.state==='error'?t:'';el.textContent=t;}
