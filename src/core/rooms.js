/* Topic rooms: the same fireplace home, each with its own fire and its own words.
   The Reading Room is the default (every word, the original Daily, streak and rating). Each topic room has its own
   Daily (seeded per room), its own Unlimited rating and its own sets. Word lists come from Wiktionary sense labels
   (scripts/build-rooms.mjs -> public/data/rooms.json). The room ring order is the order below; the desktop side doors
   and the Room Ledger both read it.
   Colours: `rgb` is the room's fire/light colour, `hue` the CSS hue-rotate applied to the hearth's live fire (the
   default fire is orange, about 30 degrees), `ink` a readable tint for labels on the dark room. */
export const HALL = 'hall';

export const ROOMS = [
  {id: HALL, name: 'The Reading Room', short: 'Reading Room', topic: 'Every word', salt: 'Oak', hue: 0, sat: 1, rgb: [255, 140, 60], ink: [230, 190, 140],
   motto: 'Every word is a step into the dark.', blurb: 'The room you know. Every word on every shelf, and the Daily everyone shares.', labels: []},
  {id: 'history', name: 'The Chronicle', short: 'Chronicle', topic: 'History', salt: 'Strontium', hue: -24, sat: 1.35, rgb: [235, 60, 60], ink: [232, 150, 135],
   motto: 'Every date is a door.', blurb: 'Empires, wars, crowns, councils and the old offices of state.',
   labels: ['history', 'government', 'politics', 'military', 'war', 'monarchy', 'nobility', 'heraldry', 'feudalism', 'historiography', 'archaeology', 'diplomacy']},
  {id: 'math', name: 'The Counting House', short: 'Counting House', topic: 'Math', salt: 'Copper', hue: 190, sat: 1.3, rgb: [70, 140, 255], ink: [150, 185, 240],
   motto: 'Count every step down.', blurb: 'Numbers, shapes, chance and proof.',
   labels: ['mathematics', 'geometry', 'logic', 'algebra', 'arithmetic', 'statistics', 'calculus', 'trigonometry', 'number-theory', 'topology', 'set-theory', 'probability-theory']},
  {id: 'science', name: 'The Observatory', short: 'Observatory', topic: 'Science', salt: 'Boron', hue: 82, sat: 1.25, rgb: [90, 215, 110], ink: [160, 210, 150],
   motto: 'Look up, then look closer.', blurb: 'Stars and storms, atoms and acids, plants, beasts and the living world.',
   labels: ['physics', 'chemistry', 'astronomy', 'geology', 'meteorology', 'climatology', 'electromagnetism', 'organic-chemistry', 'biochemistry', 'optics', 'thermodynamics', 'mineralogy', 'acoustics',
     'biology', 'botany', 'zoology', 'ecology', 'microbiology', 'genetics', 'ornithology', 'entomology', 'ichthyology', 'mycology', 'paleontology', 'oceanography']},
  {id: 'english', name: 'The Scriptorium', short: 'Scriptorium', topic: 'English', salt: 'Cupric', hue: 150, sat: 1.3, rgb: [60, 210, 200], ink: [140, 215, 205],
   motto: 'Mind every letter.', blurb: 'Grammar, poems, stories and the words about words.',
   labels: ['grammar', 'linguistics', 'literature', 'poetry', 'prosody', 'rhetoric', 'phonetics', 'phonology', 'lexicography', 'semantics', 'typography', 'publishing', 'journalism', 'writing', 'orthography']},
  {id: 'art', name: 'The Gallery', short: 'Gallery', topic: 'Art', salt: 'Potassium', hue: -95, sat: 1.25, rgb: [175, 110, 255], ink: [195, 170, 240],
   motto: 'Say what the picture means.', blurb: 'Painting, music, the stage, the screen and the buildings around them.',
   labels: ['arts', 'art', 'music', 'film', 'theater', 'dance', 'painting', 'architecture', 'sculpture', 'photography', 'opera', 'ceramics']},
  {id: 'body', name: 'The Anatomy Theatre', short: 'Anatomy Theatre', topic: 'Body & Sport', salt: 'Lithium', hue: -55, sat: 1.3, rgb: [240, 80, 150], ink: [235, 160, 190],
   motto: 'Know every bone of it.', blurb: 'The human body, how it moves, and the games and sports it plays.',
   labels: ['anatomy', 'physiology', 'sports', 'ball-games', 'games', 'board-games', 'card-games', 'chess', 'athletics', 'cricket', 'football', 'baseball', 'basketball', 'golf', 'tennis', 'boxing', 'martial-arts', 'swimming', 'gymnastics', 'cycling', 'hockey', 'rugby', 'wrestling']}
];

const BY_ID = new Map(ROOMS.map(r => [r.id, r]));
export const roomById = id => BY_ID.get(id) || BY_ID.get(HALL);
export const isRoom = id => BY_ID.has(id);
export const roomIndex = id => Math.max(0, ROOMS.findIndex(r => r.id === id));
/** Neighbours in the ring (the side doors): the room before and after `id`. */
export function neighbours(id) {
  const i = roomIndex(id), n = ROOMS.length;
  return {prev: ROOMS[(i - 1 + n) % n], next: ROOMS[(i + 1) % n]};
}
/** `rgb` as a CSS triple, for rgba(var(--rm-rgb), a). */
export const rgbOf = r => r.rgb.join(',');
