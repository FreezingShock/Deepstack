/* Home screen markup. Kept separate from main.js so other features can add
   entries (modes, links) by pushing onto HOME_LINKS / HOME_STEPS without
   touching the layout. */

export const HOME_STEPS=[
 {n:1,h:'Explain',p:'A hard word appears. Say what it means in your own words.'},
 {n:2,h:'Be judged',p:'Scored on accuracy: how close your meaning is to the real one.'},
 {n:3,h:'Descend',p:'Every answer becomes a book. Better answers go deeper.'},
];

/* Secondary entries under the main button. id becomes the button id. */
export const HOME_LINKS=[
 {id:'bStats',label:'Stats'},
 {id:'bAll',label:'Shelf',badge:s=>s.shelf.length||''},
 {id:'bUnl',label:'Unlimited',badge:(s,x)=>s.rating&&s.rating.placed?'Lexicon '+x.lexicon(s.rating.L):'placement'},
 {id:'bSets',label:'Sets'},
 {id:'bPrac',label:'Practice run'},
];

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function homeHTML({S,st,d,no,floorName,lexicon=()=>''}){
 const ctx={lexicon};
 const steps=HOME_STEPS.map(s=>`<li><span class="hn">${s.n}</span><b>${esc(s.h)}</b><span>${esc(s.p)}</span></li>`).join('');
 const links=HOME_LINKS.map(l=>{const b=l.badge?l.badge(S,ctx):'';return `<button class="lnk" id="${l.id}">${esc(l.label)}${b?` <small>${b}</small>`:''}</button>`;}).join('');
 return `<div class="sheet home">
  <p class="eyebrow">Daily No. ${no}</p>
  <h1 class="title">Deepstack</h1>
  <p class="tagline">Explain a hard word. The closer you get to its true meaning, the deeper into the library you descend.</p>
  <ol class="how" aria-label="How it works">${steps}</ol>
  ${d?`<div class="row"><button class="btn pri big" id="bRes">Today’s result</button></div><p class="next" id="nextd"></p>`
     :`<div class="row"><button class="btn pri big" id="bPlay">Descend</button></div><p class="next">Today’s daily · seven words · forty-five seconds each · one attempt</p>`}
  <div class="stats"><span>Streak <b>${st.streak}</b></span><span>Deepest <b>${st.deepest} ft</b></span><span>Books <b>${S.shelf.length}</b></span>${floorName?`<span>Floor <b>${esc(floorName)}</b></span>`:''}</div>
  <nav class="links" aria-label="More">${links}</nav>
  <div class="judgestat" id="jstat" aria-live="polite"></div></div>`;
}
