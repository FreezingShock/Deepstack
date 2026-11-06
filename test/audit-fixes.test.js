import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const css=readFileSync('src/ui/auditFixes.css','utf8');
test('audit V1 fixes are wired in',()=>{
 assert.match(readFileSync('src/main.js','utf8'),/auditFixes\.css/);
 assert.match(css,/\.bs-cue\{right:76px;bottom:12px\}/);
 assert.match(css,/adl-word\{left:50%/);
 assert.match(readFileSync('src/app/card.js','utf8'),/ft deep<\/span>/);
});
import {meaningRows} from '../src/ui/alsoMeans.js';
test('a synonym that is a piece of another synonym is not shown (cabaret: club inside nightclub)',()=>{
 const sen={cabaret:{alt:[],syn:[['nightclub','A place open late.'],['club','A heavy stick.']]}};
 assert.deepEqual(meaningRows({w:'cabaret',def:'x'},sen).map(r=>r.k),['nightclub']);
});
