import {test} from 'node:test';
import assert from 'node:assert/strict';
import {homeHTML,HOME_LINKS} from '../src/ui/home.js';

const base={S:{shelf:[1,2],rating:{placed:false}},st:{streak:3,deepest:120},no:7,floorName:''};
test('home explains the game and keeps ids main.js binds',()=>{
 const h=homeHTML({...base,d:null});
 for(const w of ['Explain','Be judged','Descend','bPlay','bStats','bAll'])assert.ok(h.includes(w),w);
});
test('played today: Descend leads to Unlimited, today’s result stays one tap away',()=>{
 const h=homeHTML({...base,d:{}});
 assert.ok(h.includes('bRes')&&h.includes('id="bNext"')&&!h.includes('bPlay'));
});
test('links are extensible',()=>{
 HOME_LINKS.push({id:'bX',label:'Extra'});
 assert.ok(homeHTML({...base,d:null}).includes('id="bX"'));
 HOME_LINKS.pop();
});

test('menu entries render as books with their ids',()=>{
 const h=homeHTML({...base,d:null});
 for(const id of ['bDaily','bUnl','bAll','bSets','bStats'])assert.ok(h.includes('id="'+id+'"'),id);
 assert.equal((h.match(/class="hbook"/g)||[]).length,5);
 assert.ok(h.includes('id="bPlay"')&&h.includes('class="descend"'));
});
