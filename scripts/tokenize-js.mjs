// One-off helper: node scripts/tokenize-js.mjs file.js... Replaces string literals that are exactly a
// hex color with PALETTE.<name> from src/theme/colors.js (same runtime value), and adds the import.
import {readFileSync,writeFileSync} from 'node:fs';
import {relative,dirname} from 'node:path';
import {PALETTE} from '../src/theme/colors.js';
const norm=h=>{h=h.slice(1).toLowerCase();if(h.length<=4)h=[...h].map(c=>c+c).join('');return '#'+h;};
const byVal={};for(const[k,v]of Object.entries(PALETTE))byVal[v]=k;
for(const f of process.argv.slice(2)){
 let s=readFileSync(f,'utf8'),did=0,left=0;
 s=s.replace(/(['"`])(#[0-9a-fA-F]{8}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3,4})\1/g,(m,q,h)=>{const k=byVal[norm(h)];if(k){did++;return 'PALETTE.'+k;}left++;return m;});
 if(did&&!/from '[^']*theme\/colors\.js'/.test(s)){let rel=relative(dirname(f),'src/theme/colors.js');if(!rel.startsWith('.'))rel='./'+rel;s=`import {PALETTE} from '${rel}';\n`+s;}
 writeFileSync(f,s);
 const rest=(s.match(/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b/g)||[]).length;
 console.log(f,'replaced',did,'whole-literal left',left,'raw hex remaining',rest);
}
