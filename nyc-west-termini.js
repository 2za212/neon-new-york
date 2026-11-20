// These service buildings sit beyond the public gates at the two west roads.
export function createTerminusMaterials(materials) {
  for(const [key,colour,emissive] of [
    ['terminusEnamel',0xb3baad,0x5e7b83],
    ['terminusTerracotta',0xbdad96,0x825e42]
  ]){
    const coat=materials.trim.clone();
    coat.name='NYC / '+key;
    coat.color.set(colour);
    coat.emissive.set(emissive);
    coat.emissiveIntensity=.23;
    coat.roughness=.73;
    materials[key]=coat;
  }
}

export function sohoLoadingHall({box:B,beam:L,collider:C},x,z) {
  const front=z-9, back=z+9, zinc='terminusEnamel', tile='terminusTerracotta';
  const mass=(m,u,y,v,w,h,d,tint)=>{
    B(m,x+u,y,front+v,w,h,d,tint);
    C(x+u,y,front+v,w,h,d);
  };

  // The adjacent bays have different depths for unloading and freight transfer.
  mass('brickBrown',0,3.45,11.6,20,6.42,12.8,0xa89f8b);
  for(const u of [-9.31,-3.48,3.02,9.31]){
    mass('brickBrown',u,3.45,2.5,1.38,6.42,5.0,0xb8a591);
    B(tile,x+u,1.27,front-.24,1.45,2.07,.55,0xbdaf93);
    B(zinc,x+u,6.33,front-.20,1.60,.44,.67,0xb6bab0);
  }
  for(const [u,w,recess] of [[-6.41,4.40,4.95],[-.21,5.10,4.68],[6.17,4.88,4.42]]){
    B('paver',x+u,.30,front+2.16,w,.21,6.45,0xa7a998);
    B(zinc,x+u,6.48,front+2.26,w+.29,.46,6.1,0xadbcba);
    B('lamp',x+u,6.17,front+2.7,w*.60,.06,.16,0xe0c799);
    const loadZ=front+recess;
    B('metal',x+u,2.92,loadZ,w-.14,5.15,.21,0x8b948c);
    for(let i=0;i<15;i++)B(zinc,x+u,.60+i*.32,loadZ-.15,w-.38,.09,.09,0x8e9d95);
    B('warmWindow',x+u,4.97,loadZ-.28,w-.55,.75,.11,0xc2ac84);
    for(const v of [-1,1]){
      B(zinc,x+u+v*w*.49,3.97,front+1.6,.23,4.75,.24,0xb6bdb6);
      L('metal',[x+u+v*w*.47,4.65,front+.4],[x+u+v*w*.29,6.22,front+.4],.18,.23,0xb3bcb3);
    }
  }
  B('stone',x-.2,.06,front-1.29,19.5,.30,2.54,0x9ba59c);
  B(tile,x-.2,.27,front-.52,19.5,.19,.92,0xaeaaa0);
  B('paver',x-6.5,.45,front+.07,4.36,.18,1.42,0xb5b7ab);
  for(const [u,v,h] of [[-7.7,3.88,1.48],[-5.95,4.22,.92],[5.8,3.56,1.25]]){
    B('wood',x+u,.43+h/2,front+v,1.42,h,1.15,0xc2a47f);
    for(const e of [-1,1])B(zinc,x+u+e*.43,.44+h/2,front+v-.59,.09,h,.08,0xaba68a);
  }
  mass(tile,0,6.96,7.15,20.15,.60,14.50,0xb7b7a6);
  // The two north-light sheds rise in half-metre steps toward their glazing.
  for(const [u,w,rise] of [[-5.01,9.75,1.04],[5.01,9.75,.70]]){
    B(zinc,x+u,7.38,front+.43,w+.32,.67,1.36,0xc1c4b4);
    B('warmWindow',x+u,8.65,front+1.02,w-.47,1.94,.25,0xb8b194);
    for(let i=0;i<=6;i++)B(zinc,x+u+(i-3)*(w-.37)/6,8.56,front+.82,.16,2.35,.42,0xc5c7b6);
    for(let i=0;i<7;i++){
      const v=1.76+i*1.54,top=9.82+(6-i)*rise*.58;
      mass('metal',u,(7.26+top)/2,v,w,top-7.26,1.54,0x91aaa5);
      B(zinc,x+u,top+.07,front+v,w+.22,.19,1.55,0xb0b7ae);
    }
  }
  // A transverse stepped roof lifts the near mechanical bay above the shed line.
  // The exposed risers keep its profile readable down the street axis.
  for(const [level,u,w] of [[0,4.93,8.83],[1,5.33,6.39],[2,5.73,4.10],[3,6.13,1.92]]){
    const y=12.10+level*.79;
    mass(tile,u,y,3.74,w,.81,4.72-level*.59,0xc2b3a0);
    B(zinc,x+u,y+.39,front+3.74,w+.30,.16,4.99-level*.59,0xc1c4b2);
    if(level===1)B('coolWindow',x+u,y,front+1.646,w-.47,.39,.13,0xa2b4ac);
  }
  for(const [u,h] of [[-7.13,14.0],[-4.72,12.9]]){
    mass('brickBrown',u,(8+h)*.5,16.0,1.38,h-8,1.54,0xaf9f8f);
    B(zinc,x+u,h,back-2.0,1.64,.23,1.80,0xb1b8ad);
  }
}

export function sohoPressAnnex({box:B,collider:C},x,z) {
  const front=z-11, clay='terminusTerracotta', steel='terminusEnamel';
  const mass=(m,xx,y,zz,w,h,d,tint)=>{
    B(m,xx,y,zz,w,h,d,tint);C(xx,y,zz,w,h,d);
  };
  // Unequal shop masses leave a roof slot between the exhaust head and print floor.
  mass('brick',x-4.7,5.55,z,12.6,10.6,22,0xa69f94);
  mass('brickBrown',x+7.0,8.80,z+1.54,7.9,17.1,18.92,0xb0a496);
  mass('brick',x-5.75,13.35,z+3.3,10.5,5.02,13.6,0x9e978b);
  mass(clay,x+7.0,17.52,z+1.54,8.51,.34,19.40,0xc2b8a3);
  B(steel,x-4.7,10.81,z,13.33,.35,22.45,0xbbc0ac);
  B(steel,x-5.75,16.04,z+3.3,11.02,.33,14.14,0xbbc0ac);
  for(const u of [-9.64,-6.37,-3.11,.16]){
    B(clay,x+u,4.84,front-.33,.46,8.9,.74,0xbeb49c);
    for(const y of [2.37,6.85]){
      B('metal',x+u+1.56,y,front-.12,2.65,2.86,.25,0x8b9e9a);
      B(y>5?'warmWindow':'glass',x+u+1.56,y,front-.276,2.31,2.51,.08,0xb1a393);
      B(steel,x+u+1.56,y-1.41,front-.312,2.78,.15,.53,0xa8b0a7);
    }
  }
  for(const y of [5.0,9.5,14.0]){
    B(steel,x+7.0,y+.28,front+2.96,7.55,.18,.58,0xaebbb4);
    B('metal',x+7.0,y-1.52,front+2.97,6.30,2.48,.23,0x859891);
    for(let i=0;i<4;i++)B(i%2?'warmWindow':'coolWindow',x+4.65+i*1.56,y-1.43,front+2.81,1.31,1.90,.075,0xb5a990);
  }
  for(let i=0;i<3;i++)mass('brickBrown',x+7.0+i*.50,18.36+i*.77,z+3.55,5.90-i*1.37,1.34,7.90-i*1.47,0xb7aa98);
}

export function midtownWorksTower({box:B,beam:L,collider:C},x,z) {
  const front=z+10, backs='midtownLimestone', enamel='terminusEnamel';
  const mass=(m,u,y,v,w,h,d,tint)=>{
    B(m,x+u,y,front+v,w,h,d,tint);
    C(x+u,y,front+v,w,h,d);
  };
  // Two vertical cores leave an eight-metre notch open to the northern sky.
  for(const [u,w,base,depth,height] of [[-7.75,7.7,-9.95,19.9,28.0],[7.65,7.9,-10.8,17.9,36.0]]){
    mass(backs,u,height/2+.24,base,w,height,depth,0x99a9af);
    const v=base+depth*.5;
    for(const side of [-1,1]){
      B(enamel,x+u+side*(w/2-.43),height*.49,front+v+.39,.58,height*.96,.99,0xbec4bd);
    }
    for(let y=4.85;y<height-1.05;y+=4.34){
      B('midtownSteel',x+u,y,front+v+.26,w-1.11,2.32,.51,0x9badad);
      for(const dx of [-1.70,0,1.70]){
        B((y>20&&dx===0)?'coolWindow':'glass',x+u+dx,y,front+v+.59,1.48,1.86,.13,0x9cafad);
      }
      B(enamel,x+u,y-1.46,front+v+.39,w-.87,.32,.78,0xbfc4b8);
    }
    for(let i=0;i<3;i++)mass((i%2)?backs:enamel,u+i*.31,height+.62+i*1.27,base-.8,w-i*1.39,1.28,depth-5.4-i*2.72,0xb0bbb4);
  }
  // The narrow connecting plant deck has open sky above it and an open tunnel below.
  mass('midtownSteel',0,13.15,-8.15,8.65,2.7,6.2,0x9aaab0);
  B(enamel,x,14.70,front-8.15,8.87,.45,6.72,0xb2bdb7);
  for(const u of [-2.70,0,2.70]){
    B('coolWindow',x+u,13.59,front-4.98,2.30,1.18,.13,0xa2bbc3);
    B(enamel,x+u,12.78,front-4.92,2.36,.14,.29,0x9eb2b3);
  }
  for(const side of [-1,1])L(enamel,[x+side*5.6,7.7,front-4.1],[x+side*2.05,12.06,front-4.1],.44,.47,0xb9c3c2);
  B('concrete',x,.07,front-4.6,9.2,.27,15.6,0xa8aba7);
}

export function midtownServicePodium({box:B,beam:L,collider:C},x,z) {
  const front=z+13.5, stone='midtownLimestone', enamel='terminusEnamel';
  const mass=(m,u,y,v,w,h,d,tint)=>{
    B(m,x+u,y,front+v,w,h,d,tint);C(x+u,y,front+v,w,h,d);
  };
  // The original full-width plinth becomes a recessed two-bay service loggia.
  mass(stone,0,7,-19.6,20,14,14.8,0xa4ada9);
  for(const u of [-8.84,8.84]){
    mass(stone,u,6.65,-6.12,2.32,13.30,12.24,0xb9bcb1);
    B(enamel,x+u,.95,front+.22,2.49,1.55,.65,0xc2c4b7);
    B(enamel,x+u,7.86,front+.31,2.62,.60,.87,0xaebdb8);
  }
  mass(stone,0,12.24,-6.12,20,3.52,12.24,0xb0b9b5);
  mass('midtownSteel',0,9.69,-1.84,19.7,1.56,4.14,0xb1bec0);
  B(enamel,x,10.65,front-1.84,20.35,.37,4.61,0xc0c6bd);
  mass(enamel,.24,4.63,-.14,.64,9.26,1.02,0xbbc4be);
  for(const [u,w] of [[-3.83,6.74],[4.06,6.67]]){
    B('paver',x+u,.38,front-5.41,w,.24,12.33,0xaabcb8);
    B(enamel,x+u,.21,front+.79,w,.18,1.07,0xb4bdb1);
    B('midtownSteel',x+u,4.2,front-9.44,w-.26,6.08,.37,0x8b9fa6);
    B('coolWindow',x+u,5.83,front-9.21,w-.70,1.74,.12,0xb0c3c4);
    B('lamp',x+u,8.83,front-1.56,w-.96,.12,.40,0xbabfa9);
    B('coolWindow',x+u,9.64,front+.28,w-.40,.65,.13,0xb0c4c6);
    for(const e of [-1,1]){
      L(enamel,[x+u+e*w*.46,6.67,front-.66],[x+u+e*w*.26,9.06,front-.66],.23,.24,0xb3bebc);
    }
  }
  for(const u of [-8,-3,2,7]){
    B(enamel,x+u,11.86,front+.23,.32,2.14,.62,0xbac7c2);
    B('glass',x+u+1.25,12.2,front+.09,2.1,1.52,.15,0xaabec0);
  }
}
