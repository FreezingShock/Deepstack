// Embeddings place antonyms close together ("lasting forever" ~ "lasting briefly"), so the embedding score alone over-rewards
// answers that point the wrong way. This is a small lexicon of opposed term groups; an answer that lands on one side
// while the definition sits on the other (and never on the answer's side) is flagged as contrary.
import {analyze, stem, match} from './lexical.js';

// Each entry: [side A terms, side B terms]. Matched on stems, so list base forms.
const PAIRS = [
  ['brief, short, fleeting, temporary, transient, momentary, passing, short-lived, ephemeral', 'long, forever, eternal, permanent, endless, perpetual, everlasting, immortal'],
  ['brave, courage, courageous, bold, fearless, valiant, heroic, daring', 'cowardly, coward, timid, fearful, afraid, fear, frightened, craven, meek'],
  ['honest, truthful, frank, candid, sincere, truth, open, straightforward', 'lie, lying, liar, dishonest, deceit, deceive, deceptive, false, hide, hiding, conceal, secretive, untruthful'],
  ['frugal, thrifty, sparing, economical, stingy, miserly', 'lavish, extravagant, wasteful, waste, spend, spending, squander, generous, splurge, luxurious, luxury'],
  ['rich, wealthy, affluent, prosperous', 'poor, poverty, destitute, impoverished, penniless, needy'],
  ['rude, defiant, insolent, disobedient, rebellious, impolite, arrogant, haughty', 'obedient, polite, servile, respectful, submissive, humble, flatter, deferential, obsequious, subservient'],
  ['careful, meticulous, thorough, precise, diligent, painstaking, cautious', 'careless, sloppy, negligent, hasty, lazy, reckless, slapdash'],
  ['calm, peaceful, serene, tranquil, quiet, composed', 'angry, furious, agitated, violent, anxious, turbulent, noisy, aggressive, wild'],
  ['happy, joy, joyful, glad, cheerful, delighted, pleased, content', 'sad, sorrow, unhappy, miserable, gloomy, grief, depressed, mournful, melancholy'],
  ['many, abundant, plentiful, numerous, common, frequent, everywhere, ubiquitous, widespread, omnipresent, always', 'few, scarce, rare, sparse, uncommon, seldom, infrequent, never, lack'],
  ['beneficial, helpful, kind, benevolent, virtuous, moral, righteous', 'bad, harmful, evil, cruel, wicked, malicious, immoral, malevolent, unkind'],
  ['love, affection, fond, adore, admire, friend, friendly', 'hate, hatred, loathe, despise, enemy, hostile, dislike, antipathy, detest'],
  ['increase, grow, expand, raise, rise, enlarge, boost, strengthen, intensify, swell', 'decrease, shrink, reduce, lower, fall, diminish, weaken, lessen, decline, contract, ease, relieve, soothe, mitigate'],
  ['create, build, construct, establish', 'destroy, demolish, ruin, wreck, raze'],
  ['join, unite, combine, connect, merge, together, attach, gather', 'separate, divide, split, apart, detach, scatter, disperse, sever'],
  ['accept, agree, approve, allow, permit, support, praise, applaud, endorse', 'reject, refuse, deny, disagree, forbid, ban, prohibit, criticise, criticize, condemn, denounce, blame, reprimand, scold, punish'],
  ['strong, powerful, mighty, robust, sturdy, vigorous, energetic, energy, lively, healthy', 'weak, feeble, frail, fragile, sickly, lethargic, tired, sluggish, exhausted, decay, dying, dead, death'],
  ['fast, quick, swift, rapid, speedy, sudden, abrupt', 'slow, gradual, leisurely, sluggish, delay, unhurried'],
  ['practical, pragmatic, realistic, sensible, concrete', 'idealistic, dreamy, theoretical, visionary, fanciful, impractical, unrealistic, romantic'],
  ['wise, clever, intelligent, smart, sensible, sage, shrewd, astute, knowing', 'foolish, stupid, ignorant, dumb, silly, naive, unwise, senseless'],
  ['real, genuine, authentic, accurate, correct', 'fake, fictitious, counterfeit, bogus, incorrect, mistaken, imaginary, untrue'],
  ['clear, obvious, plain, evident, apparent, transparent, lucid, explicit', 'vague, obscure, hidden, ambiguous, unclear, murky, cryptic, opaque'],
  ['simple, easy', 'complex, complicated, difficult, intricate, elaborate, convoluted'],
  ['ancient, outdated, obsolete, archaic, antiquated', 'modern, recent, latest, novel, contemporary'],
  ['hot, warm, burning, fiery, boiling', 'cold, freezing, icy, chilly, frozen, frigid'],
  ['bright, shining, radiant, brilliant, luminous', 'dark, dim, gloomy, shadowy'],
  ['generous, giving, charitable, lavish, magnanimous', 'selfish, greedy, stingy, miserly, mean, avaricious'],
  ['humble, modest, meek, unassuming', 'proud, arrogant, boastful, conceited, vain, pompous, haughty'],
  ['visible, overt', 'secret, covert, concealed, confidential'],
  ['anger, angry, rage, wrath, irritate, annoy, furious', 'pacify, placate, soothe, appease, calm'],
  ['praise, flatter, compliment, commend, laud', 'insult, mock, ridicule, scorn, deride, belittle, disparage'],
];

const compiled = PAIRS.map(p => p.map(side => side.split(',').map(t => stem(t.trim().replace(/-/g, ''))).filter(Boolean)));
const hit = (stems, terms) => stems.some(s => terms.some(t => match(s, t) >= .85));

/** Which side of each group a text lands on. Negated terms ("not wasting", "lacking courage") count for the opposite side. */
const NEG = /\b(without|lacking|lacks|lack of|devoid of|free of|never|no longer|unable to)\b/gi;
export function sidesOf(text, word) {
  const A = analyze(text.replace(NEG, ' not '), word), out = new Set();
  const place = (toks, flip) => compiled.forEach((g, i) => {
    const stems = toks.map(t => t.s);
    if (hit(stems, g[0])) out.add(`${i}:${flip ? 1 : 0}`);
    if (hit(stems, g[1])) out.add(`${i}:${flip ? 0 : 1}`);
  });
  place(A.pos, false); place(A.neg, true);
  return out;
}

/** True when the answer sits on the opposite side of a group from the definition and never on the definition's side. */
export function contrary(answer, def, word, opp = '') {
  const a = sidesOf(answer, word), d = sidesOf(def + ' ' + opp.split(/\s+/).map(o => 'not ' + o).join(' '), word);
  for (const k of a) { const [g, s] = k.split(':'); const other = `${g}:${1 - s}`; if (d.has(other) && !d.has(k)) return true; }
  return false;
}
