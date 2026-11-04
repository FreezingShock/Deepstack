/* Pure shortcut logic (no DOM or CSS imports so it is unit tested). */
export const SHORTCUTS=[
 ['Enter','Submit your answer (Shift+Enter for a new line)'],
 ['Alt + H','Use a hint'],
 ['Alt + S','Skip the word'],
 ['← →','Turn pages of an open book, or move between books on a result'],
 ['Space / Enter / Esc','Skip the descent animation'],
 ['Page Up / Page Down','Browse up and down the shelves'],
 ['Home / End / Esc','Jump to the top / back to where you were'],
 ['M','Mute or unmute sound'],
 ['?','Show this list'],
 ['Esc','Close a book, panel or card'],
];

export const isTyping=t=>!!(t&&t.closest&&t.closest('input,textarea,select,[contenteditable="true"]'));

/* Pure: which action does this key press ask for? ctx: {typing, modal, wordScreen} */
export function actionFor(e,ctx){
 if(e.ctrlKey||e.metaKey)return null;
 const k=(e.key||'').toLowerCase();
 if(e.altKey&&ctx.wordScreen&&!ctx.modal){
  if(k==='h'||e.code==='KeyH')return 'hint';
  if(k==='s'||e.code==='KeyS')return 'skip';
  return null;
 }
 if(e.altKey||ctx.typing)return null;
 if(k==='?'&&!ctx.modal)return 'help';
 if(k==='m'&&!ctx.modal)return 'mute';
 return null;
}

