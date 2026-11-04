import {TIER_COLORS} from '../theme/colors.js';
export const TIERS=[
 {id:0,name:'Pamphlet',rar:'Common',spine:TIER_COLORS.pamphlet.spine,ink:TIER_COLORS.pamphlet.ink,min:0,
  lines:['Nothing here points at the meaning yet.','Wide of the mark. The word stays closed.','Not quite. Try circling the core idea.']},
 {id:1,name:'Paperback',rar:'Uncommon',spine:TIER_COLORS.paperback.spine,ink:TIER_COLORS.paperback.ink,min:14,
  lines:['A glimmer of the idea, but mostly fog.','You are in the right neighbourhood.','Brushing against it. A little more precision.']},
 {id:2,name:'Hardbound',rar:'Rare',spine:TIER_COLORS.hardbound.spine,ink:TIER_COLORS.hardbound.ink,min:30,
  lines:['Solid. You have the gist.','A sound reading, if a bit loose.','Good. The core is in there.']},
 {id:3,name:'Folio',rar:'Epic',spine:TIER_COLORS.folio.spine,ink:TIER_COLORS.folio.ink,min:46,
  lines:['Well put. You have the heart of it.','A confident, accurate reading.','Close to the dictionary, in your own words.']},
 {id:4,name:'Codex',rar:'Legendary',spine:TIER_COLORS.codex.spine,ink:TIER_COLORS.codex.ink,min:62,
  lines:['Precise. Hardly a word out of place.','This could sit beside the definition.','A scholar’s answer.']},
 {id:5,name:'Grimoire',rar:'Special',spine:TIER_COLORS.grimoire.spine,ink:TIER_COLORS.grimoire.ink,min:78,
  lines:['Remarkable. Every facet accounted for.','You captured the nuance, not just the meaning.','Definition-grade. The shelves tremble.']},
 {id:6,name:'Apocrypha',rar:'Divine',spine:TIER_COLORS.apocrypha.spine,ink:TIER_COLORS.apocrypha.ink,min:92,
  lines:['Flawless. Lexicographers would nod.','Complete and exact. This book was not meant to be found.','You wrote the entry itself.']}
];
export const tierOf=s=>{let t=0;for(const x of TIERS)if(s>=x.min)t=x.id;return t;};
