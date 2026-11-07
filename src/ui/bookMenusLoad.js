/* The code and styles behind the Shelf, Daily and Stats books. Only reached through lazyScreens.js (dynamic import),
   so none of it is in the first-paint bundle. Wiring moved here unchanged from main.js. */
import './dailyBook.css';
import './weekly.css';
import './dailyCalendar.css';
import './statsPages.css';
import './almanacProgress.css';
import './shelfFilters.css';
import './shelfBays.css';
import './shelfSpineFit.css';
import './shelfSpineFit.js';
import {toSpreads} from './bookpages.js';
import {shelfBook,statsBook} from './bookMenus.js';
import {dailyBook} from './dailyBook.js';
import {curioLeaves} from './curioLog.js';
import {roomStatsLeaves} from './roomStats.js';
import {stampsLeaves} from './stampsPage.js';
import './stamps.css';

export function buildBookPages({S,core,TIERS,FLOORS,FT,RM,openCard,showTip,hideTip,keepOnEsc,utc,computeStats,floorAtFt,wordsReady,wordsLoaded}){
 const sb=statsBook({S,st:()=>computeStats(S,utc()),TIERS,FLOORS,floorStartFt:core.floorStartFt});
 return {
  bAll:shelfBook({S,core,TIERS,openCard,showTip,hideTip,keepOnEsc,FLOORS,reduceMotion:()=>RM}),
  bDaily:{...dailyBook({S,today:utc,streak:()=>computeStats(S,utc()).streak,wordsReady,wordsLoaded}),keepOnEsc},
  bStats:{...sb,spreads:()=>[...sb.spreads(),...toSpreads(roomStatsLeaves(S,{today:utc(),computeStats,lexicon:core.lexicon})),...toSpreads(stampsLeaves(S)),...toSpreads(curioLeaves(S,r=>floorAtFt(r*FT),r=>Math.round(r*FT)))],keepOnEsc,
   /* the Almanac's streak link: the way into the Ember Log on phones, where the Librarian's Card and its Streak row are hidden */
   onPaint:(sp,api)=>{sp.querySelectorAll('.alm-ember').forEach(b=>{b.onclick=()=>{const row=document.getElementById('bStreak'),from=document.getElementById('bStats');if(!row)return;row.__from=()=>{row.__from=null;return from.getBoundingClientRect();};api.close();row.click();};});}}
 };
}
