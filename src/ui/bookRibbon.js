/* Ribbon bookmark for open books. Tug it on any page to jump to the contents (page 1); tug it on the contents
   to return to the page you stopped at. The last page is remembered per book for the session. */
const seen=new Map();
export const ribbonKey=(label,title)=>String(label||title||'book');
export const remember=(key,idx)=>{if(idx>0)seen.set(key,idx);};
export const forget=()=>seen.clear();
export const recall=key=>seen.get(key)||0;
/* where a tug sends you: the contents from anywhere else, your stopped page from the contents */
export function ribbonTarget(idx,saved,count){
  if(idx>0)return 0;
  return saved>0&&saved<count?saved:0;
}
export const ribbonLabel=(idx,saved)=>idx>0?'Back to contents':saved>0?'Return to where you stopped':'Bookmark';
export const RIBBON_HTML='<button class="bs-ribbon" type="button" aria-label="Bookmark" hidden><i aria-hidden="true"></i></button>';
export function paintRibbon(sp,idx,saved,count){
  const b=sp.querySelector('.bs-ribbon');if(!b)return;
  b.hidden=count<2||(idx===0&&!(saved>0&&saved<count));
  b.setAttribute('aria-label',ribbonLabel(idx,saved));
  b.classList.toggle('mark',idx>0);
}
