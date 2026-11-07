/* Copy and markup for the problem plaques (src/ui/stateNotices.js). One entry per kind reported through src/core/stateEvents.js.
   Pure string builders, so the copy and the markup can be tested without a DOM. Styles in stateNotices.css. */

/** What each problem says. `action` is the button label; `retry` kinds get "Try again" and the rest just close. */
export const STATE_COPY = {
  'words-unavailable': {
    title: 'The word cabinet is locked',
    body: 'The full word list did not arrive, so you are playing from the 38 words in our bank. Nothing you have earned is lost.',
    action: 'Try again', retry: true,
  },
  'rooms-unavailable': {
    title: 'The topic shelves are out of reach',
    body: 'The room lists did not arrive. The Reading Room still plays, and the other rooms wait for a better connection.',
    action: 'Try again', retry: true,
  },
  'books-unavailable': {
    title: 'That book is still on the cart',
    body: 'Its pages did not come up from the cellar. Try again when the connection is steadier.',
    action: 'Try again', retry: true,
  },
  'storage-write': {
    title: 'This browser will not keep your shelf',
    body: 'Saving failed, which usually means storage is full. Free some space and try again. Until then your progress lives only in this tab.',
    action: 'Try again', retry: true,
  },
  'storage-read': {
    title: 'This browser keeps its drawers shut',
    body: 'Deepstack cannot read saved progress here, so it starts clean and nothing will be kept. Allowing site data for this page usually fixes it.',
    action: 'Understood', retry: false,
  },
  'save-unreadable': {
    title: 'A page of the ledger is smudged',
    body: 'Your saved shelf could not be read. A copy of it is kept in this browser, and you start on a clean shelf.',
    action: 'Understood', retry: false,
  },
};

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

/** The plaque for one open problem. Unknown kinds get a plain fallback rather than an empty box. */
export function noticeHTML(kind) {
  const c = STATE_COPY[kind] || {title: 'Something went wrong', body: 'Deepstack hit a problem. Reload the page to try again.', action: 'Understood', retry: false};
  const btn = c.retry
    ? `<button type="button" class="sn-go" data-sn="retry">${esc(c.action)}</button>`
    : `<button type="button" class="sn-go" data-sn="close">${esc(c.action)}</button>`;
  return `<div class="sn-head"><span>${esc(c.title)}</span><button type="button" class="sn-x" data-sn="close" aria-label="Close">×</button></div>`
    + `<div class="sn-body"><p>${esc(c.body)}</p></div>`
    + `<div class="sn-foot">${btn}</div>`;
}
