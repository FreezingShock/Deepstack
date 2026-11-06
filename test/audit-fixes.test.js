import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const css=readFileSync('src/ui/auditFixes.css','utf8');
test('audit V1 fixes are wired in',()=>{
 assert.match(readFileSync('src/main.js','utf8'),/auditFixes\.css/);
 assert.match(css,/\.bs-cue\{right:76px;bottom:12px\}/);
 assert.match(css,/adl-word\{left:50%/);
 assert.match(readFileSync('src/app/card.js','utf8'),/ft deep<\/span>/);
});
