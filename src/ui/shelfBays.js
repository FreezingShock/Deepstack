import {fmtNum} from '../core/numFmt.js';
import {dayKey as coreDayKey} from '../core/stats.js';
/* Shelf bays: the Shelf book is a small library section. Books are shelved in labelled bays (by rarity, floor found,
   set, Daily date, or all together); each bay gets a brass label with a count and a second line of detail.
   Pure functions (no DOM) so tests can pin them. Grouping works on the collapsed list [{b,i,n}]. */
import {SETS} from '../sets/sets.js';

export const BAY_MODES=[['tier','By rarity'],['floor','By floor found'],['set','By set'],['day','By Daily date'],['none','Together']];
const dayKey=b=>b&&b.t?coreDayKey(b.t):'';
const fmtDay=k=>new Date(k+'T00:00:00Z').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
const setOfWord=(()=>{const m=new Map();for(const s of SETS)for(const w of s.words)m.set(w,s);return w=>m.get(String(w).toLowerCase());})();

/* Floor a book was found on. `fl` is saved on new books; older books have none and live in the attic instead of a floor bay. */
export const floorIdOf=b=>Number.isInteger(b&&b.fl)?b.fl:-1;

/* Returns [{key,label,sub,items}] in shelving order. ctx: {TIERS, FLOORS, floorStartFt, dailyNumber, sets}. */
export function bayGroups(list,mode,ctx={}){
 const {TIERS=[],FLOORS=[],floorStartFt=()=>0,dailyNumber=()=>0,sets=SETS}=ctx;
 if(!BAY_MODES.some(m=>m[0]===mode)||mode==='none')return [{key:'all',label:'The collection',sub:'',items:list}];
 const idx=new Map(),out=[];
 const put=(key,mk,x)=>{let g=idx.get(key);if(!g){g={key,...mk(),items:[]};idx.set(key,g);out.push(g);}g.items.push(x);};
 for(const x of list){
  const b=x.b;
  if(mode==='tier')put('t'+b.tier,()=>({label:(TIERS[b.tier]||{}).name||'Tier '+b.tier,sub:(TIERS[b.tier]||{}).rar||'',ord:-b.tier}),x);
  else if(mode==='floor'){const id=floorIdOf(b),f=FLOORS[id];
   if(f)put('f'+id,()=>({label:f.name,sub:fmtNum(floorStartFt(f))+' ft and below',ord:id}),x);} // no floor: it waits in the attic
  else if(mode==='set'){const s=setOfWord(b.w);
   put(s?s.id:'loose',()=>s?{label:s.name,sub:s.blurb,ord:sets.indexOf(s)}:{label:'Loose volumes',sub:'Not part of a set',ord:99},x);}
  else{const k=dayKey(b)||'undated';
   put(k,()=>{if(k==='undated')return {label:'Earlier',sub:'',ord:0};const n=b.mode==='daily'?dailyNumber(k):0;
    return {label:n>0?'No. '+n:fmtDay(k),sub:n>0?fmtDay(k):'',ord:-Date.parse(k)};},x);}
 }
 return out.sort((a,b)=>a.ord-b.ord).map(({ord,...g})=>g);
}
/* Extra stack height for a pile of copies: one thin page edge per extra copy, at most three. */
export const pileEdges=n=>Math.max(0,Math.min(3,(n||1)-1));
/* Where a ladder leans in a bay: only bays tall enough (2+ shelves) get one; side is steady per bay. */
export function ladderSide(key,shelfCount){
 if(shelfCount<2)return '';let h=0;for(const c of String(key))h=(h*31+c.charCodeAt(0))>>>0;return h%2?'l':'r';
}
