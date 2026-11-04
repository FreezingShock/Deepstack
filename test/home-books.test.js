import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOOK_INTROS,HOME_LINKS} from '../src/ui/home.js';

test('intro books map to real home links and have a start label',()=>{
 for(const [id,i] of Object.entries(BOOK_INTROS)){
  assert.ok(HOME_LINKS.some(l=>l.id===id),id);
  assert.ok(i.h&&i.p&&i.btn&&i.pts.length,id);
 }
});
