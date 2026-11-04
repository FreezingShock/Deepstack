/* The Riddle Shelf's book on the home shelf: it sits in the play stack after Unlimited and opens onto an intro page. */
import {HOME_LINKS,BOOK_INTROS} from './home.js';

const at=HOME_LINKS.findIndex(l=>l.id==='bUnl')+1;
if(!HOME_LINKS.some(l=>l.id==='bRid'))HOME_LINKS.splice(at||HOME_LINKS.length,0,
 {id:'bRid',stack:0,tex:'vellum',color:'purple',label:'Riddle Shelf',note:'You get the definition, write the word',badge:s=>s.riddle&&s.riddle.solved?s.riddle.solved+' solved':''});
BOOK_INTROS.bRid={h:'Riddle Shelf',kicker:'The word is the answer',p:'The other way round: a slip shows only what a word means, and you write the word. The exact word reaches the deepest shelves. A word that means the same still earns a good book.',pts:['Seven riddles, forty seconds each','Hints give a sentence or a neighbour, never the spelling','Counts toward your shelf, not the Daily'],btn:'Start the Riddle Shelf'};
