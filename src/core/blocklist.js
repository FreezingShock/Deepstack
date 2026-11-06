// Words and definitions that never belong in a game anyone can play: slurs, hateful terms and
// ethnic or sexual stereotypes. The raw Wiktionary dump holds many (some with innocent-looking glosses),
// so the pool builder drops these and test/word-blocklist.test.js keeps them out for good.
// To block another word, add it to BLOCKED_WORDS (lowercase). Nothing else needs to change.

export const BLOCKED_WORDS = new Set((
  // racial, ethnic and religious slurs
  'coolie chink chinaman gook gooks jap zipperhead spic spick wetback beaner greaser dago wop ' +
  'kike heeb hebe yid kraut limey mick polack ruski taig coon darkie darky sambo negress negro ' +
  'mulatto quadroon octoroon redskin squaw injun halfbreed hottentot pickaninny golliwog gyp gypsy gipsy ' +
  'raghead towelhead sandnigger camel-jockey kafir hajji haji honky honkey whitey gringo wog abo ' +
  'oriental eskimo ' +
  // homophobic, transphobic, ableist and misogynistic slurs and stereotypes
  'faggot fag fagot dyke homo queer sissy tranny shemale transvestite gaydar lesbo lezzie ' +
  'retard retarded spaz spastic cripple gimp mongoloid midget moron imbecile idiot lunatic ' +
  'slut whore bint harlot skank womanizer ' +
  // sexual, abusive and obscene
  'nigger niggardly nigga cunt twat pussy dick cock cocksucker bitch bastard fuck shit piss ' +
  'rapist molest pedophile pedophilia incest sodomy bestiality gigolo deflower ' +
  // hate movements
  'nazi neonazi skinhead hitler'
).split(/\s+/));

// Whole-word families: any word that is, or is built on, one of these roots.
const ROOTS = /^(nigg|fagg|retard|whore|slut|cunt|fuck|shit|bitch|wetback|tranny|shemale)/;

// Definitions that describe a person by ethnicity or origin ("An Asian person.", "A person of Indian descent.").
const ETHNIC = '(?:asian|african|indian|chinese|japanese|korean|arab|jewish|black|white|latin\\w*|hispanic|mexican|italian|irish|polish|german|french|native american|gypsy|romani)';
const PEOPLE_DEF = new RegExp(
  `^(?:an?|the)\\s+${ETHNIC}\\s+(?:person|man|woman|people|native|immigrant|worker)\\b|` +
  `\\bperson of ${ETHNIC} (?:descent|origin|ancestry)\\b|\\b(?:offensive|derogatory|pejorative|disparaging|insulting) (?:term|name|word)\\b|\\bethnic slur\\b|` +
  `\\bdrag queen\\b|\\bcisgender\\b|\\bbroadway musical chorus\\b`, 'i');

/** True when a word or its gloss is on the blocklist. Case-insensitive. */
export function isBlockedWord(word) {
  const w = String(word || '').toLowerCase();
  return BLOCKED_WORDS.has(w) || BLOCKED_WORDS.has(w.replace(/e?s$/, '')) || ROOTS.test(w);
}
export function isBlockedDef(def) { return PEOPLE_DEF.test(String(def || '')); }
export const isBlocked = (word, def) => isBlockedWord(word) || isBlockedDef(def);
