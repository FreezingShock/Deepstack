import {test} from 'node:test';
import assert from 'node:assert/strict';
import {homeHTML,HOME_LINKS} from '../src/ui/home.js';

const base={S:{shelf:[1,2],rating:{placed:false}},st:{streak:3,deepest:120},no:7,floorName:''};
test('home explains the game and keeps ids main.js binds',()=>{
 const h=homeHTML({...base,d:null});
 for(const w of ['Explain','Be judged','Descend','bPlay','bStats','bAll','bPrac'])assert.ok(h.includes(w),w);
});
test('played today shows result button',()=>{
 const h=homeHTML({...base,d:{}});
 assert.ok(h.includes('bRes')&&!h.includes('bPlay'));
});
test('links are extensible',()=>{
 HOME_LINKS.push({id:'bX',label:'Extra'});
 assert.ok(homeHTML({...base,d:null}).includes('id="bX"'));
 HOME_LINKS.pop();
});
