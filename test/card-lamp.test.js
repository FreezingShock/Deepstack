import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ledgerHTML,lampAt} from '../src/ui/welcome.js';
test('lamp band follows the local hour',()=>{
 assert.equal(lampAt(new Date(2026,10,5,6)),'dawn');
 assert.equal(lampAt(new Date(2026,10,5,12)),'day');
 assert.equal(lampAt(new Date(2026,10,5,18)),'dusk');
 assert.equal(lampAt(new Date(2026,10,5,23)),'night');
});
test('ledger carries the lamp band',()=>{
 assert.match(ledgerHTML({streak:1,deepest:10,books:2,lamp:'dusk'}),/data-lamp="dusk"/);
});
