// Top-bar judge status text. Only shown while something visible is happening:
// downloading (progress < 100%), or on failure. Ready, idle and the post-download
// warm-up (progress 100%, not yet ready) show nothing so the bar never lingers.
export const FALLBACK_NOTE = 'Quick judge in use. The full judge did not load.';
export function judgeLabel(st){
 if(st.state==='error')return FALLBACK_NOTE;
 if(st.state!=='loading')return '';
 if(!st.total)return 'Preparing the judge…';
 return st.progress>=1?'':`Preparing the judge, ${Math.round(st.progress*100)}%`;
}
