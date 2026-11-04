/* Pure helpers for the menu books (Shelf, Sets, Stats). The book itself is openBook in home.js; these turn
   a flat list of pages ("leaves") into the {l,r} spreads it shows. */
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* Split a list into pages of at most `per` items (always at least one page). */
export function chunk(list,per){
 const out=[];for(let i=0;i<list.length;i+=per)out.push(list.slice(i,i+per));
 return out.length?out:[[]];
}
/* Pair leaves into spreads; an odd last leaf gets a blank facing page. */
export function toSpreads(leaves){
 const out=[];for(let i=0;i<leaves.length;i+=2)out.push({l:leaves[i],r:leaves[i+1]??''});
 return out.length?out:[{l:'',r:''}];
}
