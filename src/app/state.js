import {backfill as backfillSets,SETS} from '../sets/sets.js';
import * as core from '../core/index.js';
import {deferAfterPaint} from '../core/boot.js';
import {installRooms,currentRoom} from '../core/roomStore.js';
import {captureFullPool,loadRoomLists,applyRoomPool,setRoomExtras} from '../core/roomPool.js';
/* every set can be finished inside its own room: its words join that room's pool */
setRoomExtras(SETS.reduce((m,s)=>((m[s.room]||=[]).push(...s.words),m),{}));

export const {TIERS,tierOf,WORDS,hashStr,mulberry,levelUpdate,levelTitle,pickWord,dailyWords,loadWords,computeStats,FLOORS,FT,floorAtRow,floorAtFt,floorStartFt,atmosphereAt,msUntilNextDaily,fmtCountdown}=core;
/* topic rooms: once every word is in, keep a copy of the full pool and narrow to the room the player was last in */
export const wordsReady=deferAfterPaint(()=>loadWords()).then(async r=>{captureFullPool();if(currentRoom(S)!=='hall'){await loadRoomLists();applyRoomPool(currentRoom(S));}return r;});
export let wordsLoaded=false;
wordsReady.then(()=>{wordsLoaded=true;},()=>{wordsLoaded=true;});
/* storage */
export const mem={};
export const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return k in mem?mem[k]:d}},set(k,v){mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
export let S=Object.assign({shelf:[],daily:{},streak:{last:'',n:0},bestDepth:0,bestFloor:0,sound:false},store.get('deepstack.v1',{}));
S.rating=core.loadRating(S.rating);
installRooms(S); // per-room Daily and rating (core/roomStore.js); S.room, S.rooms are additive
export const save=()=>store.set('deepstack.v1',S);
backfillSets(S);
export const utc=()=>core.dayKey(Date.now()); // local date key (name kept for callers)
export const dailyNo=()=>Math.max(1,core.dailyNumber(utc()));
export const HINT_LABEL={sentence:'used in a sentence',synonym:'a related word',opening:'how the definition begins'};
