import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLOORS,atmosphereAt} from '../src/core/floors.js';
test('every floor defines fog and light traits, and they get heavier with depth',()=>{
 for(const f of FLOORS){assert.equal(f.fog.length,4);for(const k of['flick','shimmer','vig','pulse'])assert.equal(typeof f[k],'number',`${f.key}.${k}`);}
 for(let i=1;i<FLOORS.length;i++)assert.ok(FLOORS[i].fog[3]>=FLOORS[i-1].fog[3]);
 assert.ok(FLOORS[5].vig>FLOORS[1].vig);
});
test('atmosphere blends the new traits at a boundary',()=>{
 const f=FLOORS[3],mid=atmosphereAt(f.row);
 assert.ok(mid.fog[3]>FLOORS[2].fog[3]&&mid.fog[3]<f.fog[3]);
 assert.deepEqual(atmosphereAt(f.row+10).fog,f.fog);
});
