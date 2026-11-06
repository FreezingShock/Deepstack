// Audits the topic-room word lists (public/data/rooms.json) against hand-written anchor words
// (scripts/data/room-anchors.json: about 45 plainly on-topic words per room).
//   node scripts/room-audit.mjs            print a table: per room, how many anchors are in the room, and for each miss WHY
//   node scripts/room-audit.mjs --noise    also list the room's words the audit suspects are off-topic (no label, low share)
// Why a miss: not-in-words.json (never extracted from the dump), rejected:<reason> (fails the playability filter in
// src/core/wordPool.js), not-in-room (playable but the room build left it out).
// Exits 1 when any room keeps fewer than MIN_COVER of its anchors, so a rebuild that loses the obvious words fails CI.
import {readFileSync, existsSync} from 'node:fs';
import {buildPool, rejectReason} from '../src/core/wordPool.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
export const MIN_COVER = Number(process.env.MIN_COVER || 0.8);
const anchors = read('./data/room-anchors.json');
const lists = read('../public/data/rooms.json').rooms;
const own = existsSync(new URL('../public/data/room-words.json', import.meta.url)) ? read('../public/data/room-words.json').rooms : {};
// what the game really plays in a room: the filtered main list plus the room's own entries (src/core/roomPool.js)
const data = Object.fromEntries(Object.keys(anchors).map(id => [id, [...new Set([...(lists[id] || []), ...(own[id] || []).map(e => e[0])])]]));
const words = read('../public/data/words.json');
const raw = new Map(words.words.map(e => [e.w, e]));
const pool = new Set(buildPool(words).map(w => w.w));
const topics = existsSync(new URL('./data/word-topics.json', import.meta.url)) ? read('./data/word-topics.json').words : {};

export function why(id, w) {
  if (data[id].includes(w)) return null;
  if (!raw.has(w)) return 'not-in-words.json';
  if (!pool.has(w)) return 'rejected:' + (rejectReason(raw.get(w)) || 'curated?');
  return 'not-in-room';
}

let bad = 0;
for (const [id, list] of Object.entries(anchors)) {
  const misses = list.map(w => [w, why(id, w)]).filter(([, r]) => r);
  const cover = (list.length - misses.length) / list.length;
  if (cover < MIN_COVER) bad++;
  console.log(`${id.padEnd(8)} ${list.length - misses.length}/${list.length} anchors (${Math.round(cover * 100)}%)  list size ${data[id].length}`);
  const byReason = {};
  for (const [w, r] of misses) (byReason[r] ||= []).push(w);
  for (const [r, ws] of Object.entries(byReason)) console.log(`    ${r}: ${ws.join(', ')}`);
  if (process.argv.includes('--noise')) {
    const odd = data[id].filter(w => !topics[w]);
    console.log(`    no Wiktionary topic label (check by eye): ${odd.join(', ')}`);
  }
}
if (bad) { console.error(`room-audit: ${bad} room(s) below ${MIN_COVER * 100}% anchor coverage`); process.exit(1); }
