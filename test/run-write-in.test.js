import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeInRun,runParts} from '../src/ui/runWriteIn.js';
const mk=(cls,kids=[])=>({classList:{contains:c=>cls.includes(c)},children:kids,animate(k,o){this.calls=(this.calls||[]);this.calls.push(o);return {o};}});
const stage=()=>{const sheet=mk('sheet',[mk('pips'),mk('word'),mk('pos')]);const candle=mk('candle');return {animate(){return {};},querySelectorAll:()=>[candle],querySelector:s=>s==='.sheet'?sheet:null,candle,sheet};};
test('parts are the candle then the sheet children',()=>{assert.equal(runParts(stage()).length,4);});
test('reduced motion animates nothing',()=>{assert.deepEqual(writeInRun(stage(),{reduced:true,low:false}),[]);});
test('low graphics fades the stage once',()=>{assert.equal(writeInRun(stage(),{reduced:false,low:true}).length,1);});
test('full graphics staggers every part',()=>{const s=stage();const a=writeInRun(s,{reduced:false,low:false,wait:100});assert.equal(a.length,4);});
