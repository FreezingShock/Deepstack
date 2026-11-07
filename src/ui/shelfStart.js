/* A one-off request for the view the Shelf book opens on (RV2: the result card's "Words to win back" link asks for
   To review). The book takes the request when it is opened, and it is taken only once, so the next opening is
   the usual Shelf again. Kept in its own file so the result card (main bundle) can ask without loading the book. */
let want = null;

/** Asks the next opening of the Shelf book to start on this view ('review' or 'shelf'). */
export function wantShelfView(view) { want = view; }

/** Returns the requested view, or null, and clears the request. */
export function takeShelfView() {
  const v = want;
  want = null;
  return v;
}
