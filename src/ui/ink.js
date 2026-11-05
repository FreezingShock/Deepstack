/* Hand-drawn page furniture for the menu books: a pen divider under each page title, a wobbly underline under every
   section heading, one small margin doodle keyed to the book, a note in the margin and now and then an ink blot.
   Everything is drawn from the heading text as a seed, so a page looks the same every time it is turned to. The SVG
   strokes draw themselves in (see ink.css); decorate() only adds nodes, it never touches the page's own text. */
const NS='http://www.w3.org/2000/svg';
export const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
/* small deterministic generator (mulberry32) */
export const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
const f=n=>Math.round(n*10)/10;

/* A pen line across a 0..100 by 0..10 box that never leaves it: gentle wobble, optionally a flourish loop. */
export function penPath(seed,{}={}){
 const r=rng(seed),y=()=>f(4+r()*3.4);
 let d=`M1 ${y()}`;
 const n=3+Math.floor(r()*2);
 for(let i=1;i<=n;i++){const x=f(i/n*98+1);d+=` C ${f(x-14)} ${y()}, ${f(x-8)} ${y()}, ${x} ${y()}`;}
 return d;
}
const svg=(cls,vb,body,extra='')=>`<svg class="ink ${cls}" viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true" focusable="false"${extra}>${body}</svg>`;
const stroke=d=>`<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
export const rule=seed=>svg('ink-rule','0 0 100 10',stroke(penPath(seed)));
export const underline=seed=>svg('ink-under','0 0 100 10',stroke(penPath(seed)));

/* One doodle per book, drawn in a 40 box. */
const DOODLES={
 daily:'M20 6 v6 M20 28 v6 M6 20 h6 M28 20 h6 M10 10 l4 4 M26 26 l4 4 M30 10 l-4 4 M14 26 l-4 4 M20 14 a6 6 0 1 0 0.1 0',
 sets:'M10 12 h20 v18 h-20 z M10 12 q10 -8 20 0 M16 12 v18 M24 12 v18 M13 36 h14',
 shelf:'M6 33 h28 M9 33 v-17 h5 v17 M16 33 v-21 h5 v21 M23 33 l3 -19 l5 1 l-3 18',
 stats:'M20 5 a15 15 0 1 0 0.1 0 M20 9 l4 11 l-4 11 l-4 -11 z M20 20 v0.1',
 other:'M8 30 q4 -22 24 -22 q-2 16 -22 22 M12 26 l12 -12'
};
export const kindOf=label=>{const l=String(label||'').toLowerCase();
 return /daily/.test(l)?'daily':/set/.test(l)?'sets':/shelf|collection/.test(l)?'shelf':/stat/.test(l)?'stats':'other';};
export const doodle=kind=>svg('ink-doodle','0 0 40 40',stroke(DOODLES[kind]||DOODLES.other));

const NOTES={
 daily:['ink still drying','one day, one descent','mind the date','written by candlelight'],
 sets:['gather them all','the spare is for luck','check the spine twice','one at a time'],
 shelf:['dust before shelving','mind the top shelf','heavy ones low','keep the good ones close'],
 stats:['counted by lamplight','the deep is patient','numbers keep no secrets','as of last descent'],
 other:['to be continued','noted for later']
};
export const noteFor=(kind,seed)=>{const l=NOTES[kind]||NOTES.other;return l[seed%l.length];};
export const blot=seed=>{const r=rng(seed),pts=[];for(let i=0;i<9;i++){const a=i/9*Math.PI*2,rad=7+r()*4;pts.push([f(12+Math.cos(a)*rad),f(12+Math.sin(a)*rad)]);}
 return `<svg class="ink ink-blot" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M${pts.map(p=>p.join(' ')).join(' L')} Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="${f(18+r()*3)}" cy="${f(4+r()*3)}" r="1.4" fill="currentColor"/></svg>`;};

/* Dress one rendered book spread. Idempotent: pages already inked are left alone. */
export function decorate(sp,label=''){
 const kind=kindOf(label),usedNotes=new Set();
 sp.querySelectorAll('.pg-in').forEach(pg=>{
  if(pg.dataset.inked)return;pg.dataset.inked='1';
  const h1=pg.querySelector('h1'),seed=hash((h1?h1.textContent:pg.textContent.slice(0,40))+kind);
  pg.querySelectorAll('h2').forEach(h=>{h.classList.add('inked');h.insertAdjacentHTML('afterend',underline(hash(h.textContent)));});
  if(!h1)return;
  h1.classList.add('inked-title');
  const after=h1.nextElementSibling&&h1.nextElementSibling.classList.contains('kicker')?h1.nextElementSibling:h1;
  after.insertAdjacentHTML('afterend',rule(seed));
  pg.insertAdjacentHTML('afterbegin',doodle(kind));
  /* never write the same margin note on both pages of a spread */
  let nt=noteFor(kind,seed>>>3);for(let k=1;usedNotes.has(nt)&&k<8;k++)nt=noteFor(kind,(seed>>>3)+k);usedNotes.add(nt);
  pg.insertAdjacentHTML('beforeend',`<p class="ink-note">${seed%3===0?blot(seed):''}<span>${nt}</span></p>`);
 });
}
