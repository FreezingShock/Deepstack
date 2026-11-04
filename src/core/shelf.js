// Pure shelf logic: filtering, sorting and grouping. Books are entries of S.shelf;
// each item here is {b, i} where i is the index in S.shelf. Extra predicates
// (e.g. book sets) can be added to EXTRA_FILTERS without touching the UI code.
export const SORTS={
  new:['Newest',(a,b)=>b.i-a.i],
  score:['Closest',(a,b)=>b.b.score-a.b.score||b.i-a.i],
  tier:['Rarest',(a,b)=>b.b.tier-a.b.tier||b.b.score-a.b.score],
  az:['A–Z',(a,b)=>a.b.w.localeCompare(b.b.w)]
};
// key -> (item, opts) => boolean, applied when opts[key] is truthy.
export const EXTRA_FILTERS={fav:x=>!!x.b.fav};
export const bookDayKey=b=>b.t?new Date(b.t).toISOString().slice(0,10):'';
export function filterShelf(shelf,{tier=-1,q='',sort='new',...rest}={}){
  const needle=q.trim().toLowerCase();
  return shelf.map((b,i)=>({b,i}))
    .filter(x=>(tier<0||x.b.tier===tier)&&(!needle||x.b.w.toLowerCase().includes(needle))
      &&Object.keys(EXTRA_FILTERS).every(k=>!rest[k]||EXTRA_FILTERS[k](x,rest)))
    .sort((SORTS[sort]||SORTS.new)[1]);
}
// mode: 'none' | 'day' | 'tier'. Returns [{key,label,items}] keeping input order.
export function groupShelf(items,mode,tierNames=[]){
  if(mode!=='day'&&mode!=='tier')return [{key:'all',label:'',items}];
  const out=[],idx=new Map();
  for(const x of items){
    const key=mode==='day'?(bookDayKey(x.b)||'undated'):String(x.b.tier);
    let g=idx.get(key);
    if(!g){g={key,label:mode==='tier'?(tierNames[x.b.tier]||'Tier '+x.b.tier):key==='undated'?'Earlier':key,items:[]};idx.set(key,g);out.push(g);}
    g.items.push(x);
  }
  return out;
}
