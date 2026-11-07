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
 doc.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const row=e.target.closest&&e.target.closest('.bg-streak[role="button"]');if(!row)return; /* ledger values are real buttons: Enter already clicks them */
  e.preventDefault();row.click();
 });
}
