import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLOORS} from '../src/core/floors.js';
import {places,placeById,placeOfFloor,isUnlocked,unlockedPlaces,placeWords,registerPlace,unregisterPlace,DEFAULT_PLACE} from '../src/core/places.js';
import {bayGroups} from '../src/ui/shelfBays.js';
import {crossSection} from '../src/ui/statsPages.js';
import {floorStartFt} from '../src/core/floors.js';

test('only the default place: six floors, no filter, no unlock rule',()=>{
 assert.equal(places().length,1);
 const p=placeById(DEFAULT_PLACE);
 assert.equal(p.floors.length,FLOORS.length);assert.equal(p.words,null);assert.equal(p.unlock,null);
 assert.deepEqual(placeWords(p,[1,2,3]),[1,2,3]);
 assert.ok(isUnlocked(p,{}));assert.equal(placeOfFloor(FLOORS[3]),p);
});
test('a fake place appears in the picker, bays and almanac, then leaves cleanly',()=>{
 const before=FLOORS.length;
 const fake=registerPlace({id:'fake',name:'The Orchard',unlock:{words:2},words:w=>w.w==='plum',floors:[{...FLOORS[1],row:undefined,key:'orchard',name:'Orchard Floor'}]});
 assert.equal(FLOORS.length,before+1);
 const f=fake.floors[0];assert.equal(f.id,before);assert.ok(f.row>FLOORS[before-1].row);
 assert.equal(placeOfFloor(f),fake);
 assert.ok(!unlockedPlaces({shelf:[]}).includes(fake));
 assert.ok(unlockedPlaces({shelf:[1,2]}).includes(fake));
 assert.deepEqual(placeWords(fake,[{w:'plum'},{w:'fig'}]),[{w:'plum'}]);
 const g=bayGroups([{b:{w:'plum',tier:1,fl:f.id},i:0,n:1}],'floor',{FLOORS,floorStartFt});
 assert.deepEqual(g.map(x=>x.label),['Orchard Floor']);
 assert.match(crossSection(FLOORS,floorStartFt,0,f.id),/Orchard Floor/);
 assert.throws(()=>registerPlace({id:'fake'}));
 assert.ok(unregisterPlace('fake'));assert.equal(FLOORS.length,before);assert.equal(places().length,1);
 assert.equal(unregisterPlace(DEFAULT_PLACE),false);
});
