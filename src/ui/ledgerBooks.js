/* The Librarian's Card, made interactive. Books and Deepest open Stats; Floor opens the Floors book, one page per
   floor (locked floors read "Undiscovered"). The Floors book is small and built live, so it registers eagerly. */
import {BOOK_PAGES} from './home.js';
import {toSpreads} from './bookpages.js';
import {floorLeaves} from './floorLeaves.js';
import {streakLeaves} from './streakLeaves.js';
import './ledgerLinks.css';

export function registerLedgerBooks({S,FLOORS,floorStartFt,today=()=>new Date().toISOString().slice(0,10),computeStats,doc=document}){
 BOOK_PAGES.bStreak={label:'Ember Log',spreads:()=>toSpreads(streakLeaves(S,today(),computeStats(S,today())))};
 BOOK_PAGES.bFloors={label:'Floors',spreads:()=>toSpreads(floorLeaves(S,FLOORS,floorStartFt))};
 doc.addEventListener('click',e=>{
  const row=e.target.closest&&e.target.closest('.lg-row[data-go]');if(!row)return;
  doc.getElementById(row.dataset.go)?.click();
 });
 /* the top-bar streak chip opens the same book, and is the way in on phones where the card is hidden */
 doc.addEventListener('click',e=>{
  const chip=e.target.closest&&e.target.closest('.bg-streak');const row=doc.getElementById('bStreak');
  if(!chip||!row||!doc.querySelector('#home')||doc.querySelector('#home').hidden)return;
  const r=row.getBoundingClientRect();row.__from=r.width&&r.height?null:()=>{row.__from=null;return chip.getBoundingClientRect();};row.click();
 });
 /* the labelled flame tag on the attic hatch (phones, RA9) opens the Ember Log. It sits inside the hatch, so this runs in the
    capture phase and stops the click there: the hatch must not open the attic. */
 const flameOpen=e=>{
  const tag=e.target.closest&&e.target.closest('.ach-flame');if(!tag||tag.hidden)return;
  e.stopPropagation();e.preventDefault();
  const row=doc.getElementById('bStreak');if(!row)return;
  row.__from=()=>{row.__from=null;return tag.getBoundingClientRect();};row.click();
 };
 doc.addEventListener('click',flameOpen,true);
 doc.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const tagKey=e.target.closest&&e.target.closest('.ach-flame');
  if(tagKey&&!tagKey.hidden){e.preventDefault();e.stopPropagation();tagKey.click();return;}
  const row=e.target.closest&&e.target.closest('.lg-row[role="button"],.bg-streak[role="button"]');if(!row)return;
  e.preventDefault();row.click();
 });
}
