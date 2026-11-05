/* The code and styles behind the Shelf, Daily and Stats books. Only reached through lazyScreens.js (dynamic import),
   so none of it is in the first-paint bundle. Wiring moved here unchanged from main.js. */
import './dailyBook.css';
import './dailyCalendar.css';
import './statsPages.css';
import './shelfFilters.css';
import './shelfBays.css';
import './shelfSpineFit.css';
import './shelfSpineFit.js';
import {toSpreads} from './bookpages.js';
import {shelfBook,statsBook} from './bookMenus.js';
import {dailyBook} from './dailyBook.js';
import {curioLeaves} from './curioLog.js';

export function buildBookPages({S,core,TIERS,FLOORS,FT,RM,openCard,showTip,hideTip,keepOnEsc,utc,computeStats,floorAtFt,wordsReady,wordsLoaded}){
 const sb=statsBook({S,st:()=>computeStats(S,utc()),TIERS,FLOORS,floorStartFt:core.floorStartFt});
 return {
  bAll:shelfBook({S,core,TIERS,openCard,showTip,hideTip,keepOnEsc,FLOORS,reduceMotion:()=>RM}),
  bDaily:{...dailyBook({S,today:utc,streak:()=>computeStats(S,utc()).streak,wordsReady,wordsLoaded}),keepOnEsc},
  bStats:{...sb,spreads:()=>[...sb.spreads(),...toSpreads(curioLeaves(S,r=>floorAtFt(r*FT),r=>Math.round(r*FT)))],keepOnEsc}
 };
}
