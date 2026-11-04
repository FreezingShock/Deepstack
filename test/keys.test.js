import {test} from 'node:test';
import assert from 'node:assert/strict';
import {actionFor,SHORTCUTS} from '../src/ui/keysCore.js';

const ev=(key,o={})=>({key,code:'Key'+key.toUpperCase(),...o});
test('Alt+H and Alt+S work on the word screen, even while typing',()=>{
 const c={typing:true,modal:false,wordScreen:true};
 assert.equal(actionFor(ev('h',{altKey:true}),c),'hint');
 assert.equal(actionFor(ev('s',{altKey:true}),c),'skip');
});
test('Alt shortcuts do nothing off the word screen or under a modal',()=>{
 assert.equal(actionFor(ev('h',{altKey:true}),{typing:false,modal:false,wordScreen:false}),null);
 assert.equal(actionFor(ev('s',{altKey:true}),{typing:false,modal:true,wordScreen:true}),null);
});
test('plain keys never fire while typing an answer',()=>{
 const c={typing:true,modal:false,wordScreen:true};
 assert.equal(actionFor(ev('m'),c),null);
 assert.equal(actionFor(ev('?'),c),null);
});
test('M mutes and ? opens help when not typing; ctrl combos are ignored',()=>{
 const c={typing:false,modal:false,wordScreen:false};
 assert.equal(actionFor(ev('m'),c),'mute');
 assert.equal(actionFor(ev('?'),c),'help');
 assert.equal(actionFor(ev('m',{ctrlKey:true}),c),null);
});
test('shortcut list is documented',()=>assert.ok(SHORTCUTS.length>=8));
