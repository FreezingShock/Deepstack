/* Pure shortcut logic (no DOM or CSS imports so it is unit tested). */
export const SHORTCUT_GROUPS=[
 ['At the library',[
  ['1 / D','Open the Daily book'],
  ['2 / U','Open the Unlimited book'],
  ['3 / S','Open the Shelf'],
  ['4','Open Sets'],
  ['5','Open Stats'],
  ['N','Descend: start your next run'],
  ['A','Climb to the attic'],
  [',','Open settings'],
 ]],
 ['On a word',[
  ['Enter','Submit your answer (Shift+Enter for a new line)'],
  ['Alt + H','Use a hint'],
  ['Alt + S','Skip the word'],
 ]],
 ['In books and the dark',[
  ['← →','Turn the pages of an open book, or move between books on a result'],
  ['/','Jump to the search line in the Shelf book'],
  ['Home / End','First or last page of an open book'],
  ['O / G / R / F','In the Shelf: change sort, bay, rarity, or show favourites (hold Alt while the search line has focus)'],
  ['[ / ]','In the Daily calendar: previous or next month'],
  ['T','In the Daily calendar: open today'],
  ['Space / Enter / Esc','Skip the descent animation'],
  ['Page Up / Page Down','Browse up and down the shelves'],
  ['Home / End','Out on the shelves: jump to the top / back to where you were'],
  ['↑ ↓','Climb into the attic and back down the ladder'],
 ]],
 ['Anywhere',[
  ['M','Mute or unmute sound'],
  ['?','Show this page'],
  ['Esc','Close a book, panel or card'],
 ]],
];
export const SHORTCUTS=SHORTCUT_GROUPS.flatMap(g=>g[1]);

/* home-screen keys: key -> selector of the control it presses */
export const HOME_KEYS={'1':'#bDaily',d:'#bDaily','2':'#bUnl',u:'#bUnl','3':'#bAll',s:'#bAll','4':'#bRooms',r:'#bRooms','5':'#bStats',',':'#bSettings',a:'.attic-cue-home'};

export const isTyping=t=>!!(t&&t.closest&&t.closest('input,textarea,select,[contenteditable="true"]'));

/* Pure: which action does this key press ask for? ctx: {typing, modal, wordScreen, home} */
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
 if(ctx.home&&!ctx.modal){
  if(HOME_KEYS[k])return 'click:'+HOME_KEYS[k];
  if(k==='n')return 'descend';
 }
 return null;
}

