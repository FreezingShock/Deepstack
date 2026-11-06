/* Entering a topic room: swap the per-room save data, narrow the word pool, save. The home screen and the hearth read
   the room afterwards (src/ui/roomHome.js). */
import {S,save,wordsReady} from './state.js';
import {switchRoom,currentRoom} from '../core/roomStore.js';
import {loadRoomLists,applyRoomPool} from '../core/roomPool.js';
import {roomById,HALL} from '../core/rooms.js';

export const room=()=>roomById(currentRoom(S));
/** Moves to room `id`; resolves once its words are ready. Returns false when already there. */
export async function enterRoom(id){
 if(!switchRoom(S,id))return false;
 save();
 await wordsReady.catch(()=>{});
 if(id!==HALL)await loadRoomLists();
 applyRoomPool(currentRoom(S));
 return true;
}
