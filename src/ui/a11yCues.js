/* Pure helpers for screen reader announcements (no DOM, unit tested). */
/* Seconds left at which the timer is announced. */
export const TIMER_CUES=[30,15,10,5];

/* Returns the cue to speak now (or null) given the previous and current whole
   seconds remaining. Never repeats and never speaks twice in one tick. */
export function timerCue(prev,now,cues=TIMER_CUES){
 if(prev==null||now>=prev)return null;
 for(const c of cues)if(prev>c&&now<=c)return `${c} seconds left`;
 return null;
}

export function scoreSentence({word,tier,score,verdict,def}){
 return `${word}. ${tier}, ${score} out of 100 closeness. ${verdict||''} Meaning: ${def||''}`.replace(/\s+/g,' ').trim();
}
