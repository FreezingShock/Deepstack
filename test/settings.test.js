import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sanitize,loadSettings,saveSettings,reducedMotion,applySettings,DEFAULTS,SETTINGS_KEY} from '../src/ui/settings.js';

const fake=()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=v;},m};};

test('sanitize fills defaults and clamps bad values',()=>{
 assert.deepEqual(sanitize(null),DEFAULTS);
 assert.deepEqual(sanitize({volume:9,motion:'x',text:'huge',contrast:'yes'}),{volume:1,motion:'system',text:'normal',contrast:false});
 assert.equal(sanitize({volume:-2}).volume,0);
 assert.equal(sanitize({text:'large',contrast:true,motion:'reduce'}).text,'large');
});
test('settings round-trip through storage and survive corrupt data',()=>{
 const st=fake();
 saveSettings({volume:.3,motion:'reduce',text:'xlarge',contrast:true},st);
 assert.deepEqual(loadSettings(st),{volume:.3,motion:'reduce',text:'xlarge',contrast:true});
 st.m[SETTINGS_KEY]='{not json';
 assert.deepEqual(loadSettings(st),DEFAULTS);
 assert.deepEqual(loadSettings({getItem(){throw new Error('blocked');}}),DEFAULTS);
});
test('explicit motion choice beats the system preference',()=>{
 assert.equal(reducedMotion({motion:'reduce'},()=>false),true);
 assert.equal(reducedMotion({motion:'full'},()=>true),false);
 assert.equal(reducedMotion({motion:'system'},()=>true),true);
 assert.equal(reducedMotion({motion:'system'},()=>{throw new Error('x');}),false);
});
test('applySettings writes data attributes',()=>{
 const doc={documentElement:{dataset:{}}};
 applySettings({text:'large',contrast:true,motion:'reduce'},doc);
 assert.deepEqual({...doc.documentElement.dataset},{text:'large',contrast:'high',motion:'reduce'});
});
