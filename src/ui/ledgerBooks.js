/* The Librarian's Card, made interactive. Books and Deepest open Stats; Floor opens the Floors book, one page per
   floor (locked floors read "Undiscovered"). The Floors book is small and built live, so it registers eagerly. */
import {BOOK_PAGES} from './home.js';
import {toSpreads} from './bookpages.js';
import {floorLeaves} from './floorLeaves.js';
import './ledgerLinks.css';

export function registerLedgerBooks({S,FLOORS,floorStartFt,doc=document}){
 BOOK_PAGES.bFloors={label:'Floors',spreads:()=>toSpreads(floorLeaves(S,FLOORS,floorStartFt))};
 doc.addEventListener('click',e=>{
  const row=e.target.closest&&e.target.closest('.lg-row[data-go]');if(!row)return;
  doc.getElementById(row.dataset.go)?.click();
 });
 doc.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const row=e.target.closest&&e.target.closest('.lg-row[role="button"]');if(!row)return;
  e.preventDefault();row.click();
 });
}
