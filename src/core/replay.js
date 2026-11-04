/* Rebuild the layout of a finished descent from its saved books, so the home
   "Today's result" entry can put the player back in the library: one alcove per
   answer at the row it was answered, the row its book came from, and the FINIS
   alcove at the bottom. Pure so it can be tested without a canvas.

   Only the number of rows each answer fell (book.rows) is saved with a run. Alcove
   rows are derived from it, because the gap between one landing and the next alcove
   depends on the viewport (gapRows = World.nextRows()). Older saves without rows fall
   back to the depth gained (ft / ftPerRow); with neither, one row. */
export const ROMAN=['I','II','III','IV','V','VI','VII','VIII'];

export function rowsOf(book,ftPerRow){
 const r=Number(book&&book.rows);
 if(Number.isFinite(r)&&r>0)return Math.round(r);
 const ft=Number(book&&book.ft);
 if(Number.isFinite(ft)&&ft>0&&ftPerRow>0)return Math.max(1,Math.round(ft/ftPerRow));
 return 1;
}

export function replayLayout(books,{gapRows=3,ftPerRow=1}={}){
 const list=Array.isArray(books)?books:[];
 const gap=Math.max(1,Math.round(gapRows)||1);
 const niches=[],taken=[];let row=0;
 list.forEach((b,i)=>{
  const land=row+rowsOf(b,ftPerRow);
  niches.push({row,label:ROMAN[i]||String(i+1),books:list.slice(0,i+1),
   res:{w:b.w,pos:b.pos,answer:b.answer,score:b.score,tier:b.tier,ft:b.ft,verdict:b.verdict,skipped:!!b.skipped}});
  taken.push(land);row=land+gap;
 });
 niches.push({row,label:'FINIS',books:[],res:null});
 return {niches,taken,finalRow:row};
}
