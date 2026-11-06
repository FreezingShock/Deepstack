// Stand-in scorer: keyword/synonym concepts with light stemming. To be replaced by the embedding scorer.

/* ----- text analysis ----- */
export const STOP=new Set('a an the of to and or in on at for with by from as is are was were be been being it its this that these those which who whom what when where how than then so such i you he she they we me my your their our them him her his do does did has have had can could may might will would should'.split(' '));
export const FILL=new Set('very something someone thing things word means mean meaning describes describe person people when someone one like thats'.split(' '));
export const NEGW=new Set(['not','never','no','non','isnt','arent','cant','dont','doesnt','opposite','unlike','contrary','neither','nor','lack']);
// stem() is pure and hot (every word of words.json at boot, every answer token): remember results. Bounded so it cannot grow forever.
const STEMS=new Map();
export function stem(w){
 let r=STEMS.get(w);if(r!==undefined)return r;
 r=stem0(w);if(STEMS.size>60000)STEMS.clear();STEMS.set(w,r);return r;
}
const STEM_R=[[/ies$/,'y'],[/ied$/,'y'],[/ings?$/,''],[/ness$/,''],[/ments?$/,''],[/ally$/,''],[/ly$/,''],[/ed$/,''],[/ers?$/,''],[/es$/,''],[/(?<!s)s$/,'']];
function stem0(w){
 w=w.toLowerCase().replace(/[^a-z]/g,'');
 if(w.length<4)return w;
 for(const [re,rep] of STEM_R){ if(re.test(w)){const x=w.replace(re,rep); if(x.length>=3){w=x;break;}} }
 if(/(.)\1$/.test(w)&&!/(ss|ll|ee)$/.test(w))w=w.slice(0,-1);
 if(w.length>3&&w.endsWith('e'))w=w.slice(0,-1);
 return w;
}
export function bigr(s){const r=[];for(let i=0;i<s.length-1;i++)r.push(s.slice(i,i+2));return r;}
export function dice(a,b){const A=bigr(a),B=bigr(b);if(!A.length||!B.length)return 0;const m=new Map();A.forEach(x=>m.set(x,(m.get(x)||0)+1));let h=0;B.forEach(x=>{const c=m.get(x);if(c>0){h++;m.set(x,c-1);}});return 2*h/(A.length+B.length);}
export function match(a,b){ if(a===b)return 1; const m=Math.min(a.length,b.length);
 if(m>=5&&(a.startsWith(b)||b.startsWith(a)))return .9;
 if(m>=4&&a.slice(0,4)===b.slice(0,4)&&Math.abs(a.length-b.length)<=2&&dice(a,b)>=.72)return .85;
 if(m>=5&&dice(a,b)>=.8)return .8; return 0;}
export function analyze(text,word){
 const ws=stem(word.w);
 const toks=text.toLowerCase().replace(/n['’]t\b/g,'nt').replace(/[^a-z\s]/g,' ').split(/\s+/).filter(Boolean);
 const pos=[],neg=[];let negLeft=0,content=0;
 for(const t of toks){
  if(NEGW.has(t)){negLeft=2;continue;}
  if(STOP.has(t))continue;
  const s=stem(t);
  if(match(s,ws)>=.9||(t.length>=5&&word.w.startsWith(t.slice(0,5))&&t.length<=word.w.length+3)){continue;} // using the word itself
  const o={s,raw:t,used:false};
  if(!FILL.has(t))content++;
  if(negLeft>0){neg.push(o);negLeft--;} else pos.push(o);
 }
 return {pos,neg,content,toks,usedWord:toks.some(t=>match(stem(t),ws)>=.9&&t.length>=4)};
}
export const _cache=new WeakMap();
export function prep(word){
 if(_cache.has(word))return _cache.get(word);
 const concepts=word.concepts.map(([label,w,terms])=>({label,w,t:terms.split(',').map(x=>x.trim()).filter(Boolean).map(x=>{const n=x[0]==='~';const parts=(n?x.slice(1):x).split(/\s+/).map(stem).filter(p=>p&&!STOP.has(p));return {n,s:parts};})}));
 const defBag=[...new Set(word.def.toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).filter(x=>x&&!STOP.has(x)&&!FILL.has(x)).map(stem))];
 const opp=word.opp?word.opp.split(' ').map(stem):[];
 const o={concepts,defBag,opp};_cache.set(word,o);return o;
}
export function hitTerm(term,pool){ // all parts must match some unused/any token
 const used=[];
 for(const p of term.s){let ok=null;for(const u of pool){const m=match(u.s,p);if(m>0){ok=u;break;}}if(!ok)return null;used.push(ok);}
 return used;
}
export function judge(text,word){
 const P=prep(word),A=analyze(text,word);
 const res={score:0,caught:[],missed:[],opposite:false,usedWord:A.usedWord,empty:false,words:A.toks.length};
 if(A.content===0){res.empty=true;P.concepts.forEach(c=>res.missed.push(c.label));return res;}
 let cov=0;
 for(const c of P.concepts){
  let hits=0;
  for(const t of c.t){const u=t.n?hitTerm(t,A.neg):hitTerm(t,A.pos);if(u){hits++;u.forEach(x=>x.used=true);}}
  const credit=hits===0?0:Math.min(1,.7+.15*(hits-1));
  cov+=c.w*credit; (credit>0?res.caught:res.missed).push(c.label);
 }
 let defOnly=0;
 for(const u of A.pos){if(u.used)continue;for(const d of P.defBag){if(match(u.s,d)>=.9){u.used=true;defOnly++;break;}}}
 cov=cov+(1-cov)*Math.min(.25,.06*defOnly);
 let oppHit=0;
 for(const u of A.pos){for(const o of P.opp){if(match(u.s,o)>=.9)oppHit++;}}
 if(oppHit&&cov<.6){cov*=.35;res.opposite=true;}
 const usedN=A.pos.filter(u=>u.used&&!FILL.has(u.raw)).length;
 const p=A.content<=3?1:Math.min(1,usedN/A.content*1.25);
 let s=100*cov*(.86+.14*p);
 if(s>=40){const longN=A.pos.filter(u=>u.used&&u.raw.length>=9).length;s+=Math.min(6,2*longN);}
 res.score=Math.max(0,Math.min(100,Math.round(s)));
 return res;
}
