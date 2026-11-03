export const TIERS=[
 {id:0,name:'Pamphlet',rar:'Common',spine:'#AAAAAA',ink:'#6a6a6a',min:0,
  lines:['Nothing here points at the meaning yet.','Wide of the mark. The word stays closed.','Not quite. Try circling the core idea.']},
 {id:1,name:'Paperback',rar:'Uncommon',spine:'#55FF55',ink:'#12852b',min:14,
  lines:['A glimmer of the idea, but mostly fog.','You are in the right neighbourhood.','Brushing against it. A little more precision.']},
 {id:2,name:'Hardbound',rar:'Rare',spine:'#5555FF',ink:'#3a3ad4',min:30,
  lines:['Solid. You have the gist.','A sound reading, if a bit loose.','Good. The core is in there.']},
 {id:3,name:'Folio',rar:'Epic',spine:'#AA00AA',ink:'#9a169a',min:46,
  lines:['Well put. You have the heart of it.','A confident, accurate reading.','Close to the dictionary, in your own words.']},
 {id:4,name:'Codex',rar:'Legendary',spine:'#FFAA00',ink:'#a86500',min:62,
  lines:['Precise. Hardly a word out of place.','This could sit beside the definition.','A scholar’s answer.']},
 {id:5,name:'Grimoire',rar:'Special',spine:'#FF5555',ink:'#c42b33',min:78,
  lines:['Remarkable. Every facet accounted for.','You captured the nuance, not just the meaning.','Definition-grade. The shelves tremble.']},
 {id:6,name:'Apocrypha',rar:'Divine',spine:'#55FFFF',ink:'#0a8799',min:92,
  lines:['Flawless. Lexicographers would nod.','Complete and exact. This book was not meant to be found.','You wrote the entry itself.']}
];
export const tierOf=s=>{let t=0;for(const x of TIERS)if(s>=x.min)t=x.id;return t;};
