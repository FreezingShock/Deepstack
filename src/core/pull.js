// Where along a shelf the descent book is pulled from. A random-looking spot per row (seeded by
// the row, so it is stable while the row is rebuilt) between 12% and 88% of the width. Pinned by
// test/pull.test.js: a fixed or centred spot (as #40 briefly did) makes every pull look the same.
import {mulberry} from './daily.js';

export const PULL_MIN = .12, PULL_SPAN = .76;

export function pullX(r, W) { return W * (PULL_MIN + PULL_SPAN * mulberry(r * 40503 + 11)()); }
