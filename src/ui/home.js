/* Home screen markup. Kept separate from main.js so other features can add
   entries (modes, links) by pushing onto HOME_LINKS / HOME_STEPS without
   touching the layout. */

export const HOME_STEPS=[
 {n:1,h:'Explain',p:'A hard word appears. Say what it means in your own words.'},
 {n:2,h:'Be judged',p:'Scored on accuracy: how close your meaning is to the real one.'},
 {n:3,h:'Descend',p:'Every answer becomes a book. Better answers go deeper.'},
];

/* Secondary entries, grouped into sections. id becomes the button id; group picks
   the section (see HOME_GROUPS). Other features can push onto HOME_LINKS. */
export const HOME_GROUPS=[
 {id:'play',h:'Play'},
 {id:'collection',h:'Collection'},
 {id:'records',h:'Records'},
];
export const HOME_LINKS=[
 {id:'bUnl',group:'play',label:'Unlimited',note:'Adaptive words, rated',badge:(s,x)=>s.rating&&s.rating.placed?'Lexicon '+x.lexicon(s.rating.L):'placement'},
 {id:'bPrac',group:'play',label:'Practice run',note:'Same words, no pressure'},
 {id:'bAll',group:'collection',label:'Shelf',note:'Every book you have earned',badge:s=>s.shelf.length||''},
 {id:'bSets',group:'collection',label:'Sets',note:'Themed collections'},
 {id:'bStats',group:'records',label:'Stats',note:'Streaks, depth and tiers'},
];

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function homeHTML({S,st,d,no,floorName,lexicon=()=>''}){
 const ctx={lexicon};
 const steps=HOME_STEPS.map(s=>`<li><span class="hn">${s.n}</span><b>${esc(s.h)}</b><span>${esc(s.p)}</span></li>`).join('');
 const item=l=>{const b=l.badge?l.badge(S,ctx):'';return `<li><button class="hl" id="${l.id}"><span class="hl-t">${esc(l.label)}${b?` <small>${esc(b)}</small>`:''}</span>${l.note?`<span class="hl-n">${esc(l.note)}</span>`:''}</button></li>`;};
 const known=new Set(HOME_GROUPS.map(g=>g.id));
 const secs=[...HOME_GROUPS,{id:'more',h:'More'}].map(g=>{
  const ls=HOME_LINKS.filter(l=>g.id==='more'?!known.has(l.group):l.group===g.id);
  return ls.length?`<section class="hsec" aria-labelledby="hs-${g.id}"><h2 id="hs-${g.id}">${esc(g.h)}</h2><ul>${ls.map(item).join('')}</ul></section>`:'';
 }).join('');
 return `<div class="sheet home">
  <p class="eyebrow">Daily No. ${no}</p>
  <h1 class="title">Deepstack</h1>
  <p class="tagline">Explain a hard word. The closer you get to its true meaning, the deeper into the library you descend.</p>
  <ol class="how" aria-label="How it works">${steps}</ol>
  ${d?`<div class="row"><button class="btn pri big" id="bRes">Today’s result</button></div><p class="next" id="nextd"></p>`
     :`<div class="row"><button class="descend" id="bPlay"><i class="d-flame" aria-hidden="true"></i><span class="d-t">Descend</span><i class="d-chev" aria-hidden="true"></i></button></div><p class="next">Today’s daily · seven words · forty-five seconds each · one attempt</p>`}
  <div class="stats" aria-label="Your records"><span>Streak <b>${st.streak}</b></span><span>Deepest <b>${st.deepest} ft</b></span><span>Books <b>${S.shelf.length}</b></span>${floorName?`<span>Floor <b>${esc(floorName)}</b></span>`:''}</div>
  <nav class="hsecs" aria-label="Game sections">${secs}</nav>
  <div class="judgestat" id="jstat" aria-live="polite"></div></div>`;
}
