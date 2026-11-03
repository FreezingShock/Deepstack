// Themed floors of the descent. Floors start at a shelf row; depth in feet = row * FT.
// Pure data + lookups so the renderer, HUD and tests share one source of truth.
export const FT=4.2; // feet per shelf row

export const FLOORS=[
 {id:0,key:'stacks',name:'The Stacks',sub:'Where every reader starts',row:0,decay:0,motif:'stacks',
  wallTop:'#0a0705',wallBot:'#17110b',ledge:'#2b1d12',ledgeHi:'#4d3623',pillar:'#1f150d',
  tint:[14,34,30,0],lamp:[255,190,110],web:[224,218,200],books:[[110,100,86],0],dark:0,lampR:1,gap:0},
 {id:1,key:'archive',name:'The Archive',sub:'Ledgers, files and forgotten indexes',row:15,decay:.12,motif:'archive',
  wallTop:'#080a09',wallBot:'#10170f',ledge:'#1f2a22',ledgeHi:'#3d5445',pillar:'#16201a',
  tint:[28,70,52,.1],lamp:[190,235,150],web:[210,224,206],books:[[84,112,92],.4],dark:.06,lampR:.95,gap:0},
 {id:2,key:'catacombs',name:'The Catacombs',sub:'Stone, bone and the quiet dead',row:30,decay:.4,motif:'crypt',
  wallTop:'#0b0807',wallBot:'#1b1511',ledge:'#3a3029',ledgeHi:'#6d5f50',pillar:'#2a221c',
  tint:[70,28,16,.1],lamp:[255,140,70],web:[200,190,170],books:[[120,104,86],.5],dark:.14,lampR:.88,gap:.14},
 {id:3,key:'vault',name:'The Sunken Vault',sub:'The sea got here first',row:46,decay:.62,motif:'flood',
  wallTop:'#030a0d',wallBot:'#0a1a20',ledge:'#1a2a30',ledgeHi:'#3a6068',pillar:'#122026',
  tint:[10,70,84,.22],lamp:[120,230,230],web:[110,200,170],books:[[40,86,96],.55],dark:.22,lampR:.8,gap:0},
 {id:4,key:'hollow',name:'The Hollow',sub:'Shelves without books, books without names',row:58,decay:.78,motif:'hollow',
  wallTop:'#050407',wallBot:'#0d0a12',ledge:'#17131d',ledgeHi:'#2c2638',pillar:'#0e0b13',
  tint:[34,18,52,.2],lamp:[190,150,255],web:[160,150,190],books:[[56,48,70],.7],dark:.34,lampR:.7,gap:.34},
 {id:5,key:'abyss',name:'The Abyss',sub:'Nothing here was ever meant to be read',row:69,decay:.92,motif:'abyss',
  wallTop:'#020103',wallBot:'#07040a',ledge:'#0d0810',ledgeHi:'#2a0f1c',pillar:'#070409',
  tint:[50,6,16,.24],lamp:[255,70,80],web:[120,70,90],books:[[34,20,32],.8],dark:.4,lampR:.64,gap:.5}
];

export const floorAtRow=r=>{let f=FLOORS[0];for(const x of FLOORS)if(r>=x.row)f=x;return f;};
export const floorStartFt=f=>Math.round(f.row*FT);
export const floorAtFt=ft=>{let f=FLOORS[0];for(const x of FLOORS)if(ft>=floorStartFt(x))f=x;return f;};

// Smoothly blended atmosphere around a floor boundary (rowF may be fractional).
const BLEND=3;
const lerp=(a,b,u)=>a+(b-a)*u;
export function atmosphereAt(rowF){
 const cur=floorAtRow(rowF),next=FLOORS[cur.id+1];
 let u=0,a=cur,b=cur;
 if(next&&rowF>=next.row-BLEND){a=cur;b=next;u=Math.min(1,(rowF-(next.row-BLEND))/(BLEND*2));}
 else if(cur.id>0&&rowF<cur.row+BLEND){a=FLOORS[cur.id-1];b=cur;u=.5+Math.min(.5,(rowF-cur.row)/(BLEND*2));}
 const m=(x,y)=>x.map((v,i)=>lerp(v,y[i],u));
 return{floor:u>=.5?b:a,tint:m(a.tint,b.tint),lamp:m(a.lamp,b.lamp),decay:lerp(a.decay,b.decay,u),dark:lerp(a.dark,b.dark,u),lampR:lerp(a.lampR,b.lampR,u)};
}
