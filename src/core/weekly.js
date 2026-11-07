/* Weekly themed challenge: "Week of the Sea" and friends. Each UTC week (Monday to Sunday) has one theme. Its seven words
   are drawn from the whole library (every room, not just the active one), seeded by the week's Monday, so every device
   gets the same week. Day n of the week is the n-th easiest of the seven, so the week climbs from Monday to Sunday.
   The player answers today's word, one word per day, and each answer is kept in S.weekly (additive):
   {[mondayKey]: {days: {[dayKey]: book}}}. A theme counts as done once all seven days are played; that feeds a stamp.
   Pure: no DOM, no storage. The pool is passed in (tests) or read from the full library (fullPool). */
import {hashStr, mulberry} from './daily.js';
import {fullPool} from './roomPool.js';
import {ROOMS, HALL} from './rooms.js';
import {roomList} from './roomPool.js';

const DAY = 864e5;
export const WEEK_DAYS = 7;
export const THEME_MIN = 14; // a theme needs at least this many matching words, or the week falls through to the next theme

/* Each theme matches the definitions of words (w.def) with a word-boundary pattern. The lists are loose on purpose:
   a theme is a mood, not a glossary, and the matching words are shown with their own definitions. */
export const THEMES = [
  {key: 'sea', name: 'The Sea', title: 'Week of the Sea', motto: 'Every tide has a word.',
   re: /\b(seas?|oceans?|tides?|coasts?|coastal|harbou?rs?|vessels?|naval|nautical|maritime|marine|shores?|reefs?|sail\w*|anchors?|boats?|ships?|islands?|mariners?|sailors?)\b/i},
  {key: 'weather', name: 'The Weather', title: 'Week of Weather', motto: 'Look up. It is coming.',
   re: /\b(rain\w*|snow\w*|storms?|winds?|clouds?|fogs?|frosts?|thunder\w*|lightning|hail\w*|mists?|drizzl\w*|weather|climates?|tempests?|gales?|blizzards?|humid\w*)\b/i},
  {key: 'music', name: 'Music', title: 'Week of Music', motto: 'Hum it once and it stays.',
   re: /\b(music\w*|songs?|melod\w*|harmon\w*|rhythms?|instruments?|sing\w*|tunes?|chords?|orchestras?|composers?|sonatas?|operas?|choirs?|choral|symphon\w*|drums?)\b/i},
  {key: 'night', name: 'The Night', title: 'Week of the Night', motto: 'The lamps are low down here.',
   re: /\b(nights?|dark\w*|stars?|moons?|dusk|twilight\w*|nocturnal|midnight\w*|dawn\w*|celestial|nightfall)\b/i},
  {key: 'animals', name: 'Animals', title: 'Week of Animals', motto: 'Something is watching from the stacks.',
   re: /\b(animals?|birds?|insects?|mammals?|beasts?|reptiles?|creatures?|dogs?|cats?|horses?|fish\w*|snakes?|wolf|wolves|bears?|whales?)\b/i},
  {key: 'food', name: 'Food', title: 'Week of Food', motto: 'Mind the kitchen, the words are hot.',
   re: /\b(food\w*|cook\w*|bak(?:e|ed|es|ing|ery)|meals?|dish(?:es)?|sauces?|bread\w*|cheeses?|wines?|spices?|desserts?|cuisines?|fruits?|vegetables?|soups?|pastr\w*)\b/i},
];

const iso = t => new Date(t).toISOString().slice(0, 10);
const at = dayKey => Date.parse(dayKey + 'T00:00:00Z');

/** Monday (UTC day key) of the week that holds `dayKey`. */
export const weekStartOf = dayKey => iso(at(dayKey) - ((new Date(at(dayKey)).getUTCDay() + 6) % 7) * DAY);
/** Monday = 0 ... Sunday = 6. */
export const weekdayIndex = dayKey => (new Date(at(dayKey)).getUTCDay() + 6) % 7;
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** The weekday name of a UTC day key, e.g. 'Tuesday'. */
export const dayName = dayKey => DOW[new Date(at(dayKey)).getUTCDay()];
/** The seven day keys of the week that starts on `weekKey` (a Monday). */
export const weekDayKeys = weekKey => Array.from({length: WEEK_DAYS}, (_, i) => iso(at(weekKey) + i * DAY));

const candCache = new Map();
/** The theme of a week and every pool word that matches it. Falls through the theme list (deterministically) when a theme is too thin. */
export function themeOfWeek(weekKey, pool = fullPool()) {
  const memo = weekKey + '|' + pool.length;
  if (candCache.has(memo)) return candCache.get(memo);
  const start = hashStr('weekly-' + weekKey) % THEMES.length;
  let out = {theme: null, words: []};
  for (let i = 0; i < THEMES.length; i++) {
    const theme = THEMES[(start + i) % THEMES.length];
    const words = pool.filter(w => w && typeof w.def === 'string' && theme.re.test(w.def));
    if (words.length >= THEME_MIN) { out = {theme, words}; break; }
  }
  candCache.set(memo, out);
  return out;
}

const weekMemo = new Map();
/** The seven words of a week, Monday's first (easiest) to Sunday's last (hardest). [] if no theme has enough words. */
export function weeklyWords(weekKey, pool = fullPool()) {
  const memo = weekKey + '|' + pool.length;
  if (weekMemo.has(memo)) return weekMemo.get(memo);
  const {theme, words} = themeOfWeek(weekKey, pool);
  const rng = mulberry(hashStr('weekly-words-' + weekKey)), left = words.slice(), picked = [];
  while (theme && picked.length < WEEK_DAYS && left.length) picked.push(left.splice(Math.floor(rng() * left.length), 1)[0]);
  picked.sort((a, b) => (a.d || 0) - (b.d || 0));
  const out = {theme, words: picked};
  weekMemo.set(memo, out);
  return out;
}

/** The word for one day (a UTC day key), or null when the week has none. */
export function dayWord(dayKey, pool = fullPool()) {
  return weeklyWords(weekStartOf(dayKey), pool).words[weekdayIndex(dayKey)] || null;
}

/** The week's record: {days: {dayKey: book}} or null. Tolerates a missing or damaged field. */
export function weekRecord(S, weekKey) {
  const r = S && S.weekly && typeof S.weekly === 'object' && !Array.isArray(S.weekly) ? S.weekly[weekKey] : null;
  return r && typeof r === 'object' && r.days && typeof r.days === 'object' && !Array.isArray(r.days) ? r : null;
}
/** The book a day's word was answered with, or null if that day is not played. */
export const dayRecord = (S, dayKey) => { const r = weekRecord(S, weekStartOf(dayKey)); return (r && r.days[dayKey] && typeof r.days[dayKey].score === 'number') ? r.days[dayKey] : null; };
/** How many of the week's days are played (0 to 7). */
export const weekPlayed = (S, weekKey) => weekDayKeys(weekKey).filter(k => dayRecord(S, k)).length;
/** How many weeks have every day played: the stamp counts these. */
export const themedWeeksDone = S => (S && S.weekly && typeof S.weekly === 'object' ? Object.keys(S.weekly).filter(wk => weekPlayed(S, wk) === WEEK_DAYS).length : 0);

/** Writes a finished weekly answer into S.weekly under its week. The book keeps everything a result screen needs. */
export function recordWeekly(S, dayKey, book) {
  if (!S) return;
  if (!S.weekly || typeof S.weekly !== 'object' || Array.isArray(S.weekly)) S.weekly = {};
  const wk = weekStartOf(dayKey);
  const r = weekRecord(S, wk) || {days: {}};
  r.days[dayKey] = {...book};
  S.weekly[wk] = r;
}

/** The label of the room a word is filed under: a topic room if its list has it, otherwise the Reading Room. */
export function roomNameOf(w) {
  const hit = ROOMS.find(r => r.id !== HALL && (roomList(r.id) || []).includes(w.w));
  return hit ? hit.name : (ROOMS.find(r => r.id === HALL) || {name: 'The Reading Room'}).name;
}

/** One row per day of a week, for the Daily book's weekly leaf. state: played | missed (past, unplayed) | today | sealed (future or sealed today). */
export function weekRows(S, dayKey, pool = fullPool()) {
  const wk = weekStartOf(dayKey), {theme, words} = weeklyWords(wk, pool);
  const rows = weekDayKeys(wk).map((k, i) => {
    const rec = dayRecord(S, k), w = words[i] || null;
    const state = rec ? 'played' : k < dayKey ? 'missed' : k === dayKey ? 'today' : 'sealed';
    return {key: k, idx: i, state, w: w ? w.w : null, pos: w ? w.pos : '', def: w ? w.def : '', room: w ? roomNameOf(w) : '', rec, today: k === dayKey};
  });
  return {weekKey: wk, theme, rows, played: rows.filter(r => r.state === 'played').length};
}
