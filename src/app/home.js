import * as core from '../core/index.js';
import {Sfx} from '../feel.js';
import {modelStatus} from '../scorer/index.js';
import {homeHTML,bookify} from '../ui/home.js';
import {setBookSfx} from '../ui/bookOpenFx.js';
import {applyHomeTier} from '../ui/homeLayout.js';
import {descendInto} from '../ui/descend.js';
import {ui} from './chrome.js';
import {FLOORS,S,computeStats,dailyNo,fmtCountdown,msUntilNextDaily,utc} from './state.js';
import {World} from '../world/world.js';
import {$} from './util.js';
import {setRun,startDaily,startUnlimited} from './run.js';
import {showFinal} from './final.js';
import {startRiddle,startTodayRiddle} from './riddle.js';
import {bindAtticHome} from '../ui/atticHome.js';
import {bindDeskProps} from '../ui/deskProps.js';

/* ---------- home ---------- */
export let cdTimer=0;
export function showHome(){
 setRun(null);ui.stage.hidden=true;ui.final.hidden=true;ui.hud.hidden=true;ui.gauge.classList.remove('on');clearInterval(cdTimer);
 const d=S.daily[utc()],st=computeStats(S,utc());World.setShelf(S.shelf);
 ui.home.hidden=false;ui.home.className='center fadein';
 ui.home.innerHTML=homeHTML({S,st,d,no:dailyNo(),floorName:S.bestFloor?FLOORS[S.bestFloor].name:'',lexicon:core.lexicon});
 paintJudge(modelStatus());
 World.clearNiches();World.openNiche(0,{label:'No. '+dailyNo(),books:[]});
 $('#bPlay')&&($('#bPlay').onclick=e=>descendInto(e.currentTarget,()=>startDaily(false)));
 $('#bRes')&&($('#bRes').onclick=()=>showFinal(d,true));
 $('#bPrac').onclick=()=>startDaily(true);$('#bUnl').onclick=startUnlimited;$('#bRid')&&($('#bRid').onclick=startRiddle);$('#bRidD')&&($('#bRidD').onclick=startTodayRiddle);
 
 bookify(ui.home);applyHomeTier(ui.home);
 bindAtticHome(ui.home,{shelf:S.shelf});
 bindDeskProps(ui.home,{sfx:Sfx});
 setBookSfx(n=>n==="whoosh"?Sfx.whoosh(.22):Sfx[n]&&Sfx[n]());
 if(d){const tick=()=>{const el=$('#nextd');if(!el)return clearInterval(cdTimer);el.textContent='Next descent in '+fmtCountdown(msUntilNextDaily());};tick();cdTimer=setInterval(tick,1000);}
 ui.cap.hidden=true;
}
export async function leaveRun(){setRun(null);ui.stage.hidden=true;ui.final.hidden=true;ui.hud.hidden=true;await World.ascend();showHome();}
/* ---------- judge status (model download) ---------- */
export function paintJudge(st){const el=$('#jstat');if(!el)return;
 el.dataset.state=st.state;el.title=st.state==='error'?'Quick judge in use (the full judge could not load)':'';
 el.textContent=st.state==='loading'?`Preparing the judge${st.total?`, ${Math.round(st.progress*100)}%`:'\u2026'}`:st.state==='error'?'Quick judge in use (the full judge could not load)':'';}
