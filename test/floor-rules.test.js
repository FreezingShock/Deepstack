import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLOORS} from '../src/core/floors.js';
import {FLOOR_RULES,ruleFor,limitFor,rulesApply,loadEnabled,saveEnabled,BASE_LIMIT_MS,FLOOR_RULES_KEY} from '../src/core/floorRules.js';

const unl={mode:'unlimited',placing:false,practice:false};
const store=()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=v;}};};

test('every floor has an entry and the first has no rule',()=>{
 for(const f of FLOORS)assert.ok(f.key in FLOOR_RULES,f.key);
 assert.equal(ruleFor('stacks',unl),null);
});
test('catacombs and abyss shorten the candle, archive lengthens it',()=>{
 assert.ok(limitFor(ruleFor('catacombs',unl))<BASE_LIMIT_MS);
 assert.ok(limitFor(ruleFor('abyss',unl))<limitFor(ruleFor('catacombs',unl)));
 assert.ok(limitFor(ruleFor('archive',unl))>BASE_LIMIT_MS);
 assert.equal(limitFor(null),BASE_LIMIT_MS);
});
test('vault smears and hollow whispers',()=>{
 assert.equal(ruleFor('vault',unl).smear,true);
 assert.equal(ruleFor('hollow',unl).whisper,true);
});
test('Daily, practice and placement never get a rule',()=>{
 for(const f of FLOORS){
  assert.equal(ruleFor(f.key,{mode:undefined}),null);
  assert.equal(ruleFor(f.key,{mode:'unlimited',placing:true}),null);
  assert.equal(ruleFor(f.key,{mode:'unlimited',practice:true}),null);
  assert.equal(ruleFor(f.key,null),null);
 }
 assert.equal(rulesApply(unl),true);
});
test('the Settings switch turns every rule off and persists',()=>{
 for(const f of FLOORS)assert.equal(ruleFor(f.key,unl,false),null);
 const s=store();assert.equal(loadEnabled(s),true);
 saveEnabled(false,s);assert.equal(loadEnabled(s),false);assert.equal(s.getItem(FLOOR_RULES_KEY),'off');
 saveEnabled(true,s);assert.equal(loadEnabled(s),true);
 assert.equal(loadEnabled({getItem(){throw new Error('x');}}),true);
});
