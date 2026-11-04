import {backfill as backfillSets} from '../sets/sets.js';
import * as core from '../core/index.js';
import {deferAfterPaint} from '../core/boot.js';

export const {TIERS,tierOf,WORDS,hashStr,mulberry,levelUpdate,levelTitle,pickWord,dailyWords,loadWords,computeStats,FLOORS,FT,floorAtRow,floorAtFt,floorStartFt,atmosphereAt,msUntilNextDaily,fmtCountdown}=core;
export const wordsReady=deferAfterPaint(()=>loadWords());
export let wordsLoaded=false;
wordsReady.then(()=>{wordsLoaded=true;},()=>{wordsLoaded=true;});
/* storage */
export const mem={};
export const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return k in mem?mem[k]:d}},set(k,v){mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
export let S=Object.assign({shelf:[],daily:{},streak:{last:'',n:0},bestDepth:0,bestFloor:0,sound:false},store.get('deepstack.v1',{}));
S.rating=core.loadRating(S.rating);
export const save=()=>store.set('deepstack.v1',S);
backfillSets(S);
export const utc=()=>new Date().toISOString().slice(0,10);
export const dailyNo=()=>Math.max(1,core.dailyNumber(utc()));
export const HINT_LABEL={sentence:'used in a sentence',synonym:'a related word',opening:'how the definition begins'};
