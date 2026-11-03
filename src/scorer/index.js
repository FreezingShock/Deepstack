// Scorer facade. The app only calls judgeAnswer(); swap the backend here
// (see docs/PLAN.md for the embedding-model scorer that replaces the lexical stand-in).
import {judge} from './lexical.js';

/** @returns {Promise<{score:number,caught:string[],missed:string[],opposite:boolean,usedWord:boolean,empty:boolean,words:number}>} */
export async function judgeAnswer(text, word) {
  return judge(text, word);
}
