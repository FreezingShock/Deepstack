import {WORDS} from './words.js';
/* ----- adaptive level (0-10 float, shown as Lexicon 0-100) ----- */
export function levelUpdate(L,d,score,K){
 const s=Math.max(0,Math.min(1,(score/100-.22)/.55));
 const e=1/(1+Math.exp(-(L-d)*1.1));
 return Math.max(.3,Math.min(9.8,L+K*(s-e)));
}
export const LEVEL_TITLES=[[0,'Casual Reader'],[20,'Bookworm'],[35,'Wordsmith'],[50,'Philologist'],[65,'Lexicographer'],[82,'Grand Logophile']];
export function levelTitle(L){const n=Math.round(L*10);let t=LEVEL_TITLES[0][1];for(const [m,x] of LEVEL_TITLES)if(n>=m)t=x;return t;}
export function pickWord(target,exclude,rng){
 const c=WORDS.filter(w=>!exclude.has(w.id)).map(w=>({w,k:Math.abs(w.d-target)+rng()*.55})).sort((a,b)=>a.k-b.k);
 return (c[0]||{w:WORDS[0]}).w;
}
