/* Dates for on-screen copy, in the Daily ledger's forms: "Monday, 6 November 2026", "Fri 6 Nov", "November 2026".
   Pure, so the Card and the ledger share one format. Each takes a UTC day key (YYYY-MM-DD). */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parts = k => { const d = new Date(k + 'T00:00:00Z'); return {y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), w: d.getUTCDay()}; };
export const longDate = k => { const p = parts(k); return `${DOW[p.w]}, ${p.d} ${MONTHS[p.m]} ${p.y}`; };
export const shortDate = k => { const p = parts(k); return `${DOW[p.w].slice(0, 3)} ${p.d} ${MONTHS[p.m].slice(0, 3)}`; };
export const monthLabel = k => { const p = parts(k); return `${MONTHS[p.m]} ${p.y}`; };
