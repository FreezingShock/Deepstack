import './ui/bookArt.js';
import './ui/perf.js';
import './ui/prewarm.js'; // idle prewarm of glow sprites, lighting and serif fonts (PF2)
import './core/swRegister.js';
import {initInstallHint} from './ui/installHint.js'; // "Keep the library" install tag (PWA)
import {dismissSplash} from './ui/splash.js';
import './theme/colors.js';
import './core/hints.js';
import './core/combo.js';
import './theme/tokens.css';
import './ui/motion.css';
import './styles/index.css';
import './ui/installHint.css';
import './ui/fitHeadword.js';
import './ui/canvasCover.js';
import './ui/dprCap.js';
import './sets/sets.js';
import {backfillFloors} from './core/attic.js';
import {dustCardOpts} from './ui/atticDust.js';
import {roomsBook} from './ui/roomLedger.js';
import './ui/roomHome.css';
import './ui/roomMastery.css';
import './ui/roomRun.css';
import {initRoomRun} from './ui/roomRun.js';
import {goRoom} from './app/roomGo.js';
import './ui/results.js';
import './ui/results.css';
import './ui/finalPage.css';
import './ui/dailyShare.css';
import './ui/card.css';
import './ui/bookCard.css';
import './ui/cardFit.js';
import './ui/pageFit.js';
import './ui/coverSigil.css';
import './ui/tierFrames.css';
import './ui/reveal.css';
import './ui/coverLock.css';
import './ui/reveal.js';
import * as core from './core/index.js';
import {Sfx} from './feel.js';
import {installUiSounds} from './sound/uiHooks.js';
import {onModelStatus,startModelLoad,judgeAnswer,prepareWords,lexReady} from './scorer/index.js';
import {BOOK_PAGES} from './ui/home.js';
import {lazyBooks} from './ui/lazyScreens.js';
import {registerLedgerBooks} from './ui/ledgerBooks.js';
import './ui/home.css';
import './ui/descendGlow.css';
import './ui/welcome.css';
import './ui/scope.css';
import './ui/plaqueGap.css';
import './ui/homeTight.css';
import './ui/deskProps.css';
import './ui/mantel.css';
import './ui/hearth.css';
import './ui/homeSpineSub.css';
import './ui/homeSpineSub.js';
import './ui/idleRoom.css';
import './ui/menuWear.css';
import './ui/homeBookEdges.css';
import {initCabinet} from './ui/cabinet.js';
initCabinet({sfx:Sfx});
import './ui/bookOpenFx.js';
import './ui/bookOpenFx.css';
import './ui/pageFlip.css';
import './ui/bookRibbon.css';
import {watchHomeLayout} from './ui/homeLayout.js';
import './ui/descend.js';
import './ui/camMotion.js';
import {initA11y} from './ui/a11y.js';
import {initKeys} from './ui/keys.js';
import {initTopbar} from './ui/topbar.js';
import {initTopbarRail} from './ui/topbarRail.js';
import {tintRail} from './ui/railTint.js';
import './ui/settings.js';
import {initTransitions} from './ui/transitions.js';
import './ui/screenFx.js';
import './ui/screenFx.css';
import './ui/floorArt.js';
import {initBrowse} from './ui/browse.js';
import './core/pull.js';
import './ui/spineLabel.js';
import './ui/loreCover.js';
import {initLore} from './ui/lore.js';
import './ui/lore.css';
import {initCurios} from './ui/curios.js';
import './ui/curios.css';
import {initCurioFx} from './ui/curioFx.js';
import './ui/curioFx.css';
import './core/replay.js';
import './core/dailyRun.js';
import './ui/bookpages.css';
import './ui/bookStyle.css';
import './ui/penInk.css';
import './ui/lexiconRank.css';
import './ui/lexiconTrend.css';
import './ui/ink.css';
import './ui/emptyPages.css';
import './ui/inkInput.css';
import './ui/inkInput.js';
import './ui/fonts.css';
import './ui/googleFonts.css';
import {initLedge} from './ui/ledge.js';
import './ui/physics.js';
import './ui/lanterns.js';
import './ui/ambient.js';
import './ui/floorAtmosphere.js';
import './ui/alcoveArt.js';
import './ui/ledge.css';
import './ui/buttons.css';
import './ui/tactile.css';
import './ui/particleMask.js';
import './ui/polish.css';
import {initCursorLight} from './ui/cursorLight.js';
import './ui/cursorLight.css';
import './ui/riddle.css';
import './ui/runScreen.css';
import './ui/runLedge.css';
import './ui/candle.css';
import './ui/runScreen.js';
import './ui/hintSlips.js';
import './ui/hintSlips.css';
import './ui/feedback.js';
import './core/feedback.js';
import './ui/feedback.css';
import './ui/alsoAccepted.css';
import './ui/alsoMeans.css';
import './ui/textScale.css';
import './ui/cabinet.css';
import './ui/auditFixes.css';
import './ui/shelfGroups.css';
import './ui/phonePolish.css';
import './ui/dailyBind.css';
import {deferAfterPaint} from './core/boot.js';
import {$,$$,RM,clamp} from './app/util.js';
import {FLOORS,FT,S,TIERS,WORDS,computeStats,dailyWords,floorAtFt,floorStartFt,hashStr,save,utc,wordsLoaded,wordsReady} from './app/state.js';
import {announceFloor,hideTip,showTip,ui} from './app/chrome.js';
import {World} from './world/world.js';
import {cardOpts,closeCard,openCard} from './app/card.js';
import {run,startDaily,startUnlimited} from './app/run.js';
import {leaveRun,paintJudge,showHome} from './app/home.js';

initCursorLight({reduced:RM});
backfillFloors(S);
function applySound(){const b=$('#bSound');b.setAttribute('aria-pressed',S.sound);Sfx.set(S.sound);}
$('#bSound').onclick=()=>{S.sound=!S.sound;save();applySound();};
initA11y();
initRoomRun();
initKeys();
initTopbar({Sfx});initTopbarRail({S,Sfx});installUiSounds(Sfx);
watchHomeLayout(ui.home);
World.onLedge(initLedge({tiers:TIERS,canActivate:()=>ui.stage.hidden&&$('#cardlayer').hidden,onOpen:b=>openCard(b,{fresh:false}),showTip,hideTip}));
const browse=initBrowse({world:World,floors:FLOORS,startOf:floorStartFt,ft:FT,rm:RM});
World.onDepth(v=>{browse.update(v);const e=$('#dnum');if(e.textContent!==String(v))e.textContent=v;
 const f=floorAtFt(v);$('#dfloor').textContent=f.id?f.name:'';tintRail(f);
 if(run&&f.id>run.floor){run.floor=f.id;S.bestFloor=Math.max(S.bestFloor,f.id);announceFloor(f);}});
ui.gauge.innerHTML=TIERS.map(t=>`<div data-t="${t.id}" style="color:${t.spine}"><span>${t.name}</span><i></i></div>`).join('');
World.onGauge((zi,st)=>{$$('div',ui.gauge).forEach(d=>{const id=+d.dataset.t;d.classList.toggle('on',id===zi);d.classList.toggle('passed',id<zi);d.style.display=id<=st.tier?'':'none';});});
$('#mark').onclick=()=>{if(World.busy&&World.stActive)return;if(run||ui.home.hidden)return leaveRun();showHome();};
/* shelf hover/click on canvas */
const cvEl=$('#world');
cvEl.addEventListener('pointermove',e=>{if(ui.home.hidden&&ui.final.hidden||World.stActive||World.restRow!==0){hideTip();cvEl.style.cursor='';return;}
 const h=World.hits().find(h=>e.clientX>=h.x&&e.clientX<=h.x+h.w&&e.clientY>=h.y&&e.clientY<=h.y+h.h);
 if(h){showTip(`${h.b.w} · ${TIERS[h.b.tier].name} · ${h.b.score}`,e.clientX,e.clientY);cvEl.style.cursor='pointer';}else{hideTip();cvEl.style.cursor='';}});
cvEl.addEventListener('click',e=>{if(World.stActive||World.restRow!==0||!(ui.stage.hidden))return;const h=World.hits().find(h=>e.clientX>=h.x&&e.clientX<=h.x+h.w&&e.clientY>=h.y&&e.clientY<=h.y+h.h);if(h){hideTip();openCard(h.b,{fresh:false,...(World.atticOpen&&dustCardOpts(h.b,{S,save,FLOORS,floorStartFt,closeCard})||{})});}});
/* lore books: thick background books reveal a word; never one from the current run or today's daily */
{let dk='',dw=[];initLore({world:World,canvas:cvEl,pool:WORDS,hash:hashStr,enabled:()=>!World.busy,
 exclude:()=>{if(dk!==utc()){dk=utc();dw=dailyWords(dk,7).map(w=>w.w);}return run?[...dw,...run.words.map(w=>w.w)]:dw;}});}
/* curios: rare thin books hide a loose page, a ribbon, a sealed clasp or a marginal note */
initCurios({world:World,canvas:cvEl,enabled:()=>!World.busy,...initCurioFx({S,save})});
onModelStatus(paintJudge);
addEventListener('keydown',e=>{
 if(!$('#cardlayer').hidden&&cardOpts&&cardOpts.nav&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){const b=$(e.key==='ArrowLeft'?'#cprev':'#cnext');if(b&&!b.disabled){e.preventDefault();b.click();}return;}
 if(!$('#cardlayer').hidden&&cardOpts&&(e.key==='Enter')&&e.target.id!=='go'){e.preventDefault();closeCard();return;}
 if(e.key==='Escape'){if(!$('#cardlayer').hidden&&cardOpts&&!cardOpts.onNext)closeCard();else if(!$('#cardlayer').hidden&&cardOpts&&!cardOpts.onNext)closeCard();}
 if(World.descending&&(e.key===' '||e.key==='Escape'||e.key==='Enter')){e.preventDefault();World.skipDown();}
});
/* ---------- shelf, sets and stats: pages of the menu books (src/ui/bookMenus.js, home.js BOOK_PAGES) ---------- */
const bookOpenCard=()=>!$('#cardlayer').hidden;
BOOK_PAGES.bRooms={...roomsBook(S,{go:id=>goRoom(id),today:utc,lexicon:core.lexicon}),keepOnEsc:bookOpenCard};
lazyBooks({S,core,TIERS,FLOORS,FT,RM,openCard,showTip,hideTip,keepOnEsc:bookOpenCard,utc,computeStats,floorAtFt,wordsReady,wordsLoaded:()=>wordsLoaded});
registerLedgerBooks({S,FLOORS,floorStartFt:core.floorStartFt,today:utc,computeStats});
const RHnow=()=>clamp(innerHeight*.22,108,172);
applySound();
initTransitions();
showHome();
initInstallHint({S,save});dismissSplash(); // launch screen off once home is drawn; install tag on home
wordsReady.catch(()=>{}).then(()=>deferAfterPaint(()=>{const m=startModelLoad();lexReady();return m;},1500)) // relations/senses download beside the model, not after it
 // once the model is up, warm the distractor embeddings in idle time so the first answer isn't slow
 .then(ok=>ok&&deferAfterPaint(()=>prepareWords([]),600)).catch(()=>{});
 // judge model downloads after first paint and the word list
window.__deepstack={openCard,S,World,startDaily,startUnlimited,showHome,judge:judgeAnswer,lexReady,get run(){return run;}};
