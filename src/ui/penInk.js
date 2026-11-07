import {DUR,ease} from './motion.js';
import {motionNow} from './settings.js';
/* Pen underline for book-page tabs and filters. The underline under the chosen word slides (and stretches) from the
   previously chosen word to the new one, like a pen moved across the line. Pure DOM, no layout cost until a click.
   penMark(root,key) just before the page is repainted; penPlay(root) just after. */
let mark=null;
const reduced=()=>motionNow();

/** Remember where the stroke is now (the pressed word in the same group as the one being chosen). */
export function penMark(root,key){
 mark=null;if(!root||!key)return;
 const next=root.querySelector(`[data-k="${key}"]`),group=next&&next.closest('.chips,[role="tablist"],[role="group"]');
 const prev=group&&[...group.querySelectorAll('[aria-pressed="true"],[aria-selected="true"]')].find(x=>x!==next);
 mark={key,from:prev?prev.getBoundingClientRect():null};
}

/** After the repaint: slide the stroke from the old word if it sits on the same line, otherwise let it draw in. */
export function penPlay(root){
 const m=mark;mark=null;if(!root||!m)return;
 const c=root.querySelector(`[data-k="${m.key}"]`);if(!c)return;
 const to=c.getBoundingClientRect(),f=m.from;
 if(reduced()||!f||!to.width||Math.abs(f.top-to.top)>6||typeof c.animate!=='function'){c.classList.add('pen');return;}
 const dx=f.left-to.left,sx=Math.max(.2,f.width/to.width);
 c.animate([{transformOrigin:'0 50%',transform:`translateX(${dx}px) scaleX(${sx})`},{transformOrigin:'0 50%',transform:'none'}],
  {duration:Math.min(DUR.page,DUR.base+Math.abs(dx)*.5),easing:ease('ink'),pseudoElement:'::after'});
}
