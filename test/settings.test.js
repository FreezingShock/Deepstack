import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sanitize,loadSettings,saveSettings,reducedMotion,applySettings,systemReduces,DEFAULTS,SETTINGS_KEY} from '../src/ui/settings.js';

const fake=()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=v;},m};};

test('sanitize fills defaults and clamps bad values',()=>{
 assert.deepEqual(sanitize(null),DEFAULTS);
 assert.deepEqual(sanitize({volume:9,music:-1,effects:'loud',motion:'x',text:'huge',contrast:'yes'}),{volume:1,music:0,effects:1,motion:'system',text:'normal',contrast:false});
 assert.equal(sanitize({volume:-2}).volume,0);
 assert.equal(sanitize({text:'large',contrast:true,motion:'reduce'}).text,'large');
});
test('defaults keep the sound and look the game had before music and effects existed',()=>{
 assert.equal(DEFAULTS.music,1);
 assert.equal(DEFAULTS.effects,1);
 assert.equal(DEFAULTS.motion,'system');
});
test('settings round-trip through storage and survive corrupt data',()=>{
 const st=fake();
 saveSettings({volume:.3,music:.4,effects:.9,motion:'reduce',text:'xlarge',contrast:true},st);
 assert.deepEqual(loadSettings(st),{volume:.3,music:.4,effects:.9,motion:'reduce',text:'xlarge',contrast:true});
 st.m[SETTINGS_KEY]='{not json';
 assert.deepEqual(loadSettings(st),DEFAULTS);
 assert.deepEqual(loadSettings({getItem(){throw new Error('blocked');}}),DEFAULTS);
});
test('an older save without music or effects loads with both at full',()=>{
 const st=fake();
 st.m[SETTINGS_KEY]=JSON.stringify({volume:.5,motion:'full',text:'large',contrast:false});
 assert.deepEqual(loadSettings(st),{...DEFAULTS,volume:.5,motion:'full',text:'large'});
});
test('explicit motion choice beats the system preference',()=>{
 assert.equal(reducedMotion({motion:'reduce'},()=>false),true);
 assert.equal(reducedMotion({motion:'full'},()=>true),false);
 assert.equal(reducedMotion({motion:'system'},()=>true),true);
 assert.equal(reducedMotion({motion:'system'},()=>{throw new Error('x');}),false);
});
test('systemReduces reads the OS and is calm-by-false when unreadable',()=>{
 assert.equal(systemReduces(()=>true),true);
 assert.equal(systemReduces(()=>false),false);
 assert.equal(systemReduces(()=>{throw new Error('no matchMedia');}),false);
});
test('applySettings writes data attributes',()=>{
 const doc={documentElement:{dataset:{}}};
 applySettings({text:'large',contrast:true,motion:'reduce'},doc);
 assert.deepEqual({...doc.documentElement.dataset},{text:'large',contrast:'high',motion:'reduce'});
 applySettings({text:'normal',contrast:false,motion:'system'},doc);
 assert.equal(doc.documentElement.dataset.motion,'system');
});
