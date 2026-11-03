import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLOORS,FT,floorAtRow,floorAtFt,floorStartFt,atmosphereAt} from '../src/core/floors.js';

test('floors are ordered and start at the surface',()=>{
 assert.equal(FLOORS[0].row,0);
 for(let i=1;i<FLOORS.length;i++){assert.ok(FLOORS[i].row>FLOORS[i-1].row);assert.ok(FLOORS[i].decay>FLOORS[i-1].decay);}
});
test('row and feet lookups agree at every boundary',()=>{
 for(const f of FLOORS){
  assert.equal(floorAtRow(f.row).id,f.id);
  assert.equal(floorAtFt(floorStartFt(f)).id,f.id);
  if(f.id){assert.equal(floorAtRow(f.row-1).id,f.id-1);assert.equal(floorAtFt(floorStartFt(f)-1).id,f.id-1);}
 }
 assert.equal(floorAtRow(1e6).id,FLOORS.length-1);
});
test('a good daily run (about 300 ft) can reach the last floor',()=>{
 assert.ok(floorStartFt(FLOORS[FLOORS.length-1])<=300,String(FT));
});
test('atmosphere blends across a boundary and is exact deep inside a floor',()=>{
 const f=FLOORS[2];
 assert.deepEqual(atmosphereAt(f.row+10).tint,f.tint);
 const mid=atmosphereAt(f.row);
 assert.ok(mid.decay>FLOORS[1].decay&&mid.decay<f.decay);
});
