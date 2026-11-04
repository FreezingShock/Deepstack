/* Rarity-escalating backdrop for the book reveal. Pamphlet is deliberately plain; each tier adds one more layer. */
export function revealPlan(tier){
 const t=Math.max(0,Math.min(6,tier|0));
 return{
  tier:t,
  vignette:t>=3?Math.min(.62,.18+(t-3)*.14):0,
  rays:t>=3?(t>=6?14:t>=5?10:t>=4?8:6):0,
  rune:t>=5,
  embers:t>=5?(t>=6?18:10):0,
  banner:t>=4,
  ink:t>=4,
  hold:t>=6?1900:t>=5?1300:t>=4?900:0
 };
}
export function playReveal(layerHost,tier,color,RM){
 const p=revealPlan(tier);if(RM||p.tier<3)return p;
 const el=document.createElement('div');el.className='rvl rvl-t'+p.tier;el.style.setProperty('--rc',color);el.style.setProperty('--rv',p.vignette);
 let h='<i class="rvl-vig"></i>';
 if(p.rays)h+=`<i class="rvl-rays" style="--n:${p.rays}"></i>`;
 if(p.rune)h+='<i class="rvl-rune"></i>';
 el.innerHTML=h;layerHost.insertBefore(el,layerHost.firstChild);
 requestAnimationFrame(()=>el.classList.add('on'));
 setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),1400);},2600+p.hold);
 return p;
}
