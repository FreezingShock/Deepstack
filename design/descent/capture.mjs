// Captures the descent landing options (design/descent/options.html) at phone and desktop widths.
// Usage: node design/descent/capture.mjs [outDir]   (default: screenshots/descent)
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(here, '../../screenshots/descent');

const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({executablePath: exe, args: ['--no-sandbox']});
try {
  for (const o of ['A', 'B', 'C']) {
    for (const [w, h, phone] of [[1280, 800, false], [375, 667, true]]) {
      const ctx = await browser.newContext({viewport: {width: w, height: h}, deviceScaleFactor: 2, reducedMotion: 'reduce'});
      const pg = await ctx.newPage();
      await pg.goto(`file://${path.join(here, 'options.html')}?o=${o}${phone ? '&w=phone' : ''}`);
      await pg.evaluate(() => document.fonts.ready);
      await pg.screenshot({path: path.join(out, `option-${o}-${w}.png`), fullPage: false});
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
console.log('wrote option screenshots to', out);
