import {test} from 'node:test';
import assert from 'node:assert/strict';
import {homeHTML,introSpreads,BOOK_INTROS} from '../src/ui/home.js';

const S={shelf:[],rating:{}};
const html=homeHTML({S,st:{streak:0,deepest:0},d:null,no:1,floorName:''});
test('menu books are split into multiple stacks and carry no description text',()=>{
 assert.ok((html.match(/class="hshelf"/g)||[]).length>=2);
 assert.ok(!html.includes('hb-n'));
 assert.ok(!html.includes('Adaptive words, rated'.replace('Adaptive words, rated','class="hb-n"')));
});
test('intro books build a spread with left and right pages',()=>{
 for(const i of Object.values(BOOK_INTROS)){const [sp]=introSpreads(i);assert.ok(sp.l.includes(i.h)&&sp.r.includes('bs-start'));}
});
