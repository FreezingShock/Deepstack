/* The Riddle Shelf's book on the home shelf: it sits in the play stack after Unlimited and opens onto an intro page. */
import {HOME_LINKS,BOOK_INTROS} from './home.js';
import {sketch} from './emptyPages.js';
import {riddleDay} from '../core/riddleDaily.js';
const utc=()=>new Date().toISOString().slice(0,10);

const at=HOME_LINKS.findIndex(l=>l.id==='bUnl')+1;
if(!HOME_LINKS.some(l=>l.id==='bRid'))HOME_LINKS.splice(at||HOME_LINKS.length,0,
 {id:'bRid',stack:0,tex:'vellum',color:'purple',label:'Riddle Shelf',note:'You get the definition, write the word',badge:s=>s.riddle&&s.riddle.solved?s.riddle.solved+' solved':''});
BOOK_INTROS.bRid={h:'Riddle Shelf',kicker:'The word is the answer',p:'The other way round: a slip shows only what a word means, and you write the word. The exact word reaches the deepest shelves. A word that means the same still earns a good book.',pts:['Seven riddles, forty seconds each','Hints give a sentence or a neighbour, never the spelling','Counts toward your shelf, not the Daily'],btn:'Start the Riddle Shelf',art:sketch('slip')};

/* Today's riddle: a second, slimmer book right after the Riddle Shelf. Same seven definitions for everyone, one attempt a day. */
const atD=HOME_LINKS.findIndex(l=>l.id==='bRid')+1;
if(!HOME_LINKS.some(l=>l.id==='bRidD'))HOME_LINKS.splice(atD||HOME_LINKS.length,0,
 {id:'bRidD',stack:0,tex:'vellum',color:'purple',label:'Today\u2019s Riddle',note:'Seven definitions, the same for everyone',badge:s=>{const d=riddleDay(s,utc());return d?d.solved+' of '+d.of+' solved':'';}});
BOOK_INTROS.bRidD={h:'Today\u2019s Riddle',kicker:'One attempt a day',p:'Seven definitions, seeded by the date, so every reader meets the same ones. Write the word for each. You get one attempt; come back to read your result and share it.',pts:['The same seven for everyone','One attempt a day, with its own streak','Easiest to hardest, forty seconds each'],btn:'Open today\u2019s riddle',art:sketch('slip')};
