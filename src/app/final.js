import {roomById} from '../core/rooms.js';
import {currentRoom} from '../core/roomStore.js';
/* a topic room's result names the room (its Daily and Lexicon are that room's own) */
const roomShareTag=()=>{const r=roomById(currentRoom(S));return r.id==='hall'?'':r.name+' \u00b7 ';};
import {finalHTML,bindRecap} from '../ui/results.js';
import {coverWorld,liftWorld} from '../ui/screenFx.js';
import {replayLayout} from '../core/replay.js';
import {FLOORS,FT,S,TIERS,dailyNo,levelTitle,utc} from './state.js';
import {countUp,ui} from './chrome.js';
import {World} from '../world/world.js';
import {$,$$} from './util.js';
import {spineImg} from '../world/bookArt.js';
import {openCard} from './card.js';
import {showHome} from './home.js';
import {setRun} from './run.js';
import {snapSpines,beginBind,playBind,isDailyRun} from '../ui/dailyBind.js';
import {dailyShareText,shareDaily} from '../ui/dailyShare.js';
import {runDay} from '../core/streak.js';

import {dailyNumber} from '../core/daily.js';
import {riddleDayShare} from '../core/riddleDaily.js';
export const BLK='▁▂▃▄▅▆▇';
export function shareText(d){if(d.mode==='riddle'&&d.day)return riddleDayShare(d.day,d,BLK);
 if(isDailyRun(d))return dailyShareText(d,{room:roomById(currentRoom(S)).name,no:dailyNumber(runDay(d,utc())),floorName:d.floor?FLOORS[d.floor].name:'',tierNames:TIERS.map(t=>t.name),keys:Object.keys(S.daily||{}),today:utc()});
 return `Deepstack ${d.mode==='riddle'?'':roomShareTag()}${d.mode==='riddle'?'Riddle \u00b7 '+d.solved+' of '+d.of+' solved':d.mode==='unlimited'?'Unlimited \u00b7 Lexicon '+d.lex:'No. '+dailyNo()}\nDepth ${d.depth} ft${d.floor?' · '+FLOORS[d.floor].name:''} · average closeness ${d.avg}\n${d.books.map(b=>BLK[b.tier]).join('')}\n${d.books.map(b=>TIERS[b.tier].name).join(' · ')}`;}
export async function showFinal(d,fromHome){
 if(fromHome){ui.home.hidden=true;ui.cap.hidden=true;await coverWorld();World.setShelf([]);
  /* replay the whole descent: every alcove and floor again, ending at the results */
  const L=replayLayout(d.books,{gapRows:World.nextRows(),ftPerRow:FT});World.restore(L);ui.hud.hidden=false;liftWorld();
  if(L.finalRow>0){await World.glide(L.finalRow);if(!ui.home.hidden)return;}}
 ui.hud.hidden=false;$('#dnum').textContent=d.depth;
 World.openNiche(World.restRow,{label:'FINIS',books:[]});
 const txt=shareText(d);const el=ui.final;el.hidden=false;el.className='center fadein';
 el.innerHTML=finalHTML(d,S,{txt,share:isDailyRun(d),rarest:TIERS[d.best].name,no:dailyNo(),dayNo:d.day?dailyNumber(d.day):0,floorName:d.floor?FLOORS[d.floor].name:'',levelTitle,spines:d.books.map((b,i)=>spineImg(b,i,'final',132)).join('')});
 countUp($('#cnt'),d.depth,1200);
 bindRecap(el,d.books,openCard);
 $$('#sp img').forEach(im=>{im.onclick=()=>openCard(d.books[+im.dataset.i],{fresh:false});});
 $('#cp').onclick=async()=>{try{await navigator.clipboard.writeText(txt);$('#cp').textContent='Copied';}catch(e){const r=document.createRange();r.selectNodeContents($('#shr'));const s=getSelection();s.removeAllRanges();s.addRange(r);$('#cp').textContent='Selected — copy it';}};
 const shb=$('#sh');if(shb)shb.onclick=async()=>{const r=await shareDaily(txt,'Deepstack');const label={shared:'Shared',copied:'Copied',cancelled:'Share',failed:'Share'}[r];shb.textContent=label;if(r==='failed'){const rg=document.createRange();rg.selectNodeContents($('#shr'));const s=getSelection();s.removeAllRanges();s.addRange(rg);shb.textContent='Selected \u2014 copy it';}};
 $('#up').onclick=async()=>{const bind=!fromHome&&isDailyRun(d)?snapSpines(ui.final):null;if(bind)beginBind();ui.final.hidden=true;ui.hud.hidden=true;setRun(null);await World.ascend();showHome();if(bind)playBind(bind,ui.home,d,d.day||utc());};
}
