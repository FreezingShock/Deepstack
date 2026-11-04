import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLOORS,FT,floorAtRow,floorAtFt,floorStartFt,floorRangeFt,atmosphereAt} from '../src/core/floors.js';
import {comboMultiplier} from '../src/core/combo.js';

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
test('deep floors are earned: typical runs stop short, only a sustained chain reaches the Abyss',()=>{
 const rowsFor=score=>Math.max(3,Math.round(3+.32*score));
 const run=(score,chain)=>{let rows=0;for(let i=1;i<=7;i++)rows+=Math.round(rowsFor(score)*(chain?comboMultiplier(i):1));return Math.round(rows*FT);};
 const abyss=floorStartFt(FLOORS[FLOORS.length-1]);
 assert.ok(run(50,false)<floorStartFt(FLOORS[4]),'an average run stays above the Hollow');
 assert.ok(run(75,false)<abyss,'a strong run without a chain does not reach the Abyss');
 assert.ok(run(75,true)>=abyss,'a sustained Folio+ chain does');
});
test('floors are well spaced: gaps widen and none is squeezed',()=>{
 const starts=FLOORS.map(floorStartFt);
 for(let i=1;i<starts.length;i++)assert.ok(starts[i]-starts[i-1]>=100,`gap before floor ${i}`);
 assert.ok(starts[1]>=90);
});
test('floorRangeFt gives contiguous ranges and an open last floor',()=>{
 for(const f of FLOORS){const [a,b]=floorRangeFt(f);assert.equal(a,floorStartFt(f));if(f.id<FLOORS.length-1)assert.equal(b,floorStartFt(FLOORS[f.id+1]));else assert.equal(b,null);}
});
test('atmosphere blends across a boundary and is exact deep inside a floor',()=>{
 const f=FLOORS[2];
 assert.deepEqual(atmosphereAt(f.row+10).tint,f.tint);
 const mid=atmosphereAt(f.row);
 assert.ok(mid.decay>FLOORS[1].decay&&mid.decay<f.decay);
});

test('each floor is darker and has a tighter lamp than the one above',()=>{
 for(let i=1;i<FLOORS.length;i++){assert.ok(FLOORS[i].dark>=FLOORS[i-1].dark);assert.ok(FLOORS[i].lampR<=FLOORS[i-1].lampR);}
 const deep=atmosphereAt(FLOORS[FLOORS.length-1].row+10);
 assert.ok(deep.dark>=.4&&deep.lampR<=.64);
 assert.equal(atmosphereAt(0).dark,0);
});
test('every floor has a distinct motif and name',()=>{
 assert.equal(new Set(FLOORS.map(f=>f.motif)).size,FLOORS.length);
 assert.equal(new Set(FLOORS.map(f=>f.name)).size,FLOORS.length);
});
