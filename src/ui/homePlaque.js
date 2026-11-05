/* What the Descend plaque on home should say and do right now. Pure, so every state is tested.
   unplayed Daily -> Descend into today's Daily; mid-run -> Continue it; played -> Descend into
   Unlimited at your own level, with today's result kept as the quiet second choice. */
import {resumable} from '../core/dailyRun.js';

export const DAILY_WORDS=7;
export function plaqueState({S,played,no,today,lexicon=()=>''}){
 const rating=(S&&S.rating)||{};
 if(played)return {kind:'unlimited',label:'Descend',tag:rating.placed?`Unlimited · Lexicon ${lexicon(rating.L)}`:'Unlimited · find your rank',second:true};
 const r=resumable(S,today,DAILY_WORDS);
 if(r)return {kind:'resume',label:'Continue',tag:`Daily No. ${no} · ${Math.min(r.results.length,DAILY_WORDS)} of ${DAILY_WORDS} written`,second:false};
 return {kind:'daily',label:'Descend',tag:`Daily No. ${no}`,second:false};
}
/* Spine badges for the two play books, so a spine says what is waiting inside it. */
export function dailyBadge({S,played,no,today}){
 if(played)return `No. ${no} · done`;
 return resumable(S,today,DAILY_WORDS)?`No. ${no} · resume`:`No. ${no} · open`;
}
export const unlimitedBadge=(S,lexicon)=>S.rating&&S.rating.placed?'Lexicon '+lexicon(S.rating.L):'find your rank';
