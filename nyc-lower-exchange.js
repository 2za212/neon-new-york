// Occupied infill along the former exchange. u runs along the shop window,
// v points into the street. All four orientations retain axis-aligned solids.
export function buildLowerExchange({box, solid, surface, sign}) {
  const cladding = [0xa5b7ba, 0xc0b8ac, 0x8caaa5, 0xa5adbe];
  const steel = 'midtownSteel', iron = 'metal', brass = 'midtownBronze';
  function tenancy({x,z,turn,width,depth,floors,trade,seed}) {
    const angle = turn * Math.PI / 2, c = Math.round(Math.cos(angle)), s = Math.round(Math.sin(angle));
    const point = (u,y,v) => [x+c*u+s*v, y, z-s*u+c*v];
    const B = (mat,u,y,v,w,h,d,col) => box(mat,...point(u,y,v),w,h,d,col,angle);
    function mass(mat,u,y,v,w,h,d,col) {
      B(mat,u,y,v,w,h,d,col);
      solid(...point(u,y,v),Math.abs(c)*w+Math.abs(s)*d,h,Math.abs(s)*w+Math.abs(c)*d);
    }
    const skin = seed%3===1 ? 'titaniumSkin' : 'ceramicShell';
    const front = width / 2, base = .36, ceiling = 3.56;
    const occupied = trade !== 'shutter', clinic = trade === 'clinic';
    const wall = cladding[seed%4], top = ceiling+floors*2.88;
    const floorPoint=point(0,base,-depth/2);
    const halfX=(Math.abs(c)*width+Math.abs(s)*depth)/2, halfZ=(Math.abs(s)*width+Math.abs(c)*depth)/2;
    B('paver',0,.26,-depth/2,width,.20,depth);
    surface(floorPoint[0]-halfX,floorPoint[0]+halfX,floorPoint[2]-halfZ,floorPoint[2]+halfZ,base);
    mass(skin,0,1.96,-depth+.16,width,3.2,.32,wall);
    for(const side of [-1,1]){
      const end=side*(front-.16);
      if(!occupied){
        mass(skin,end,1.96,-depth/2,.32,3.2,depth,wall);
        continue;
      }
      // Pass-through counters give the shop a second frontage at a junction.
      mass(skin,end,.84,-depth/2,.32,.96,depth,wall);
      mass(skin,end,3.20,-depth/2,.32,.72,depth,wall);
      for(const v of [-.32,-depth+.32])
        mass(skin,end,2.08,v,.32,1.52,.64,wall);
      B(brass,end+side*.16,1.32,-depth/2,.64,.16,depth-.64);
      B(clinic?'cyan':'lamp',end,2.78,-depth/2,.32,.12,depth*.64);
      B(iron,end,2.08,-depth*.62,.24,1.44,.16);
    }
    // An actual recess for the workbench, with a separate customer entrance.
    if(occupied) {
      mass(trade==='food'?'wood':steel,-.64,.92,-.80,width-2.24,1.12,.96,0xc5ad99);
      B(brass,-.64,1.53,-.80,width-2.08,.16,1.12);
      B(iron,0,2.00,-depth+.40,width-.80,2.72,.32);
      B(clinic?'roomClinic':trade==='food'?'roomKitchen':'roomRepair',0,2.04,-depth+.59,width-1.28,1.92,.16);
      for(const u of [-1.28,0,1.28]){
        B(steel,u,2.75,-depth+.80,.16,.32,.80);
        B(clinic?'cyan':'lamp',u,2.52,-depth+.56,.80,.16,.32);
        B(trade==='food'?'wood':iron,u,1.69,-.88,.48,.24,.48);
      }
    } else {
      mass(iron,0,1.82,-.24,width-.64,2.88,.32,0x8b9894);
      for(let row=0;row<8;row++) B(row===2?steel:iron,0,.70+row*.32,-.01,width-.80,.16,.16,0xb6a59b);
    }
    // Repair capsules slot into a common vertical stair core. One half pulls
    // well behind the other on alternate storeys. The outer corner is genuinely
    // open below the extended floor; the return reveals more units down the lane.
    const bays=Math.max(2,Math.floor(width/2.1)),pitch=width/bays;
    for(let f=0;f<floors;f++){
      const y=ceiling+f*2.88, side=(f+seed)%2?1:-1;
      for(const k of [-1,1]){
        const span=width/2,x=k*span/2;
        const face=k===side?.48:-Math.min(1.60,depth*.36);
        const length=depth+face, mid=(-depth+face)/2;
        mass('basaltShell',x,y+1.44,mid,span,2.88,length,0x81949c);
        B(skin,x,y+.40,face+.24,span,.80,.64,wall);
        B('midtownCurtain',x,y+1.54,face+.10,span-.32,1.30,.20,0xaac8cc);
        B(clinic?'titaniumSkin':skin,x+k*.16,y+2.44,face+.38,span-.32,.88,.96,wall);
        B('titaniumSkin',x,y+2.80,mid,span,.16,length+.64,0xb7c0bc);
        const end=k*front;
        B('midtownCurtain',end+k*.08,y+1.60,mid,.16,1.12,length-.64,0xb3bfc2);
        for(let j=0;j<3;j++){
          const reach=.48+j*.32;
          B(skin,end-k*reach/2,y+.94+j*.48,face+.32-k*.08,reach,.48,.80,cladding[(seed+f+j)%4]);
        }
        if(k!==side){
          B(steel,x,y+.18,.08,span,.32,1.12);
          B(brass,end-k*.16,y+.70,.48,.32,.84,.32);
        }
      }
    }
    // A staggered three-piece service canopy bridges the recessed fronts.
    for(let j=0;j<bays;j++){
      const u=(j+.5)*pitch-front,reach=(j+seed)%3===0?1.44:.96;
      B('basaltShell',u,3.50,.08,pitch,.32,1.44,0x8194a0);
      B(skin,u,3.26,reach-.12,pitch-.04,.32,reach,wall);
      if(occupied)B(clinic?'cyan':'lamp',u,3.05,reach+.20,.80,.08,.16);
    }
    // Shared timber dealing galleries give each corner a deep overhung edge.
    // Shutters, food and clinic counters remain independent tenants below it.
    if(occupied&&!clinic){
      B(steel,0,5.72,1.16,width+.32,.48,2.08,0x83938a);
      for(let bay=0;bay<bays;bay++){
        const xx=(bay+.5)*pitch-front;
        B('wood',xx,6.30,2.06,pitch-.12,.72,.32,0xa57a59);
        B(brass,xx-pitch*.45,6.96,2.06,.24,2.24,.32);
      }
      B(steel,0,8.04,1.12,width+.64,.48,2.40,0x83938a);
      B('lamp',0,5.43,1.82,width*.68,.12,.24,0xffcb87);
    }
    const u=-front+1.20;
    mass(skin,u,top+.92,-depth*.46,1.28,1.28,1.28,wall);
    B(iron,u,top+1.65,-depth*.46,1.60,.32,1.60);
    B(brass,front-.48,(top+1)/2,.92,.24,top-1,.32);
    B(brass,front-.80,.92,.96,.80,.32,.32);
    if(clinic||trade==='food'){
      const edge=front-.64, colour=clinic?'#81d5cb':'#eabe87';
      B(iron,edge,5.08,1.36,.32,.32,2.24);
      // A two-sided blade sign faces both directions along the lane.
      B(iron,edge,4.00,1.68,.32,1.92,1.60);
      for(const side of [-1,1]){
        const face=point(edge+side*.25,4.02,1.68);
        sign(...face,1.44,1.60,clinic?'义修':'夜面',clinic?'IMPLANT LAB':'NIGHT KITCHEN',colour,angle+side*Math.PI/2);
      }
      B(clinic?'cyan':'lamp',edge,3.03,1.68,.32,.16,1.44);
    }
  }
  // Opposing tenancies use different setbacks and leave the cross street open.
  const units=[
    [-5.92,-95.2,1,6.4,3.84,2,'shutter'],[5.60,-98.8,-1,8,3.84,2,'food'],
    [-4.96,-104.0,1,8,3.20,3,'clinic'],[6.08,-108.0,-1,7.68,4.48,3,'shutter'],
    [-9.44,-111.0,1,5.76,4.48,2,'food'],[5.12,-114.3,-1,4.48,3.84,1,'parts'],
    [-17.76,-133.12,0,7.04,4.48,2,'parts'],[-16,-139.0,0,6.40,3.52,1,'food'],
    [16.0,-125.44,0,6.40,3.20,2,'clinic']
  ];
  units.forEach(([x,z,turn,width,depth,floors,trade],seed)=>tenancy({x,z,turn,width,depth,floors,trade,seed}));

  // An inhabited service crossing. Its upper band has missing cladding,
  // exposing the alternating frames, lit windows and shared thermal trunk.
  const bridgeZ=-110.72, deckY=6.44;
  box(steel,0,deckY,bridgeZ,13.12,.48,2.88,0xadb0a1);
  solid(0,deckY,bridgeZ,13.12,.48,2.88);
  for(const face of [-1,1]){
    const z=bridgeZ+face*1.28;
    for(let j=0;j<10;j++){
      const x=(j-4.5)*1.28;
      box(iron,x,7.72,z,.16,2.24,.32,0xada998);
      if(j===3||j===7)continue;
      const skin=j%3?'titaniumSkin':'ceramicShell';
      box(skin,x+.61,7.20,z,1.08,.96,.32,j%2?0x95a8af:0xc7c5b7);
      box(j%3===1?'warmWindow':'glass',x+.61,8.04,z,1.08,.64,.16);
    }
    for(let j=0;j<8;j++){
      const x=(j-3.5)*1.60, y=5.81+(j===1||j===2?-.16:0);
      box(brass,x,y,z,1.60,.48,.48,0xbd8765);
      box(iron,x+.63,y,z,.24,.64,.64);
      if(j===2||j===6)box('cyan',x,y-.26,z+face*.20,.80,.12,.16);
    }
  }
  for(let j=0;j<5;j++)box(steel,(j-2)*2.56,8.76+(j<2?.16:0),bridgeZ,2.56,.32,3.20,0x929d94);
  solid(0,7.91,bridgeZ,13.12,2.46,2.64);
  box(steel,-7.84,deckY,bridgeZ,2.88,.48,2.88);
  solid(-7.84,deckY,bridgeZ,2.88,.48,2.88);
  for(const face of [-1,1]){
    box(brass,-7.84,5.81,bridgeZ+face*1.28,2.88,.48,.48);
    box(iron,-7.84,7.24,bridgeZ+face*1.28,2.88,.96,.32);
  }

  // A public battery exchange at the edge of the old colonnade. A stepped
  // red canopy and suspended cube mark working equipment from both approaches.
  const boothX=3.52, boothZ=-136.64;
  for(const side of [-1,1]){
    const x=boothX+side*2.40;
    box(iron,x,1.96,boothZ,.32,3.20,2.56);
    solid(x,1.96,boothZ,.32,3.20,2.56);
    for(let step=0;step<3;step++)
      box(steel,boothX+side*(1.08+step*.80),4.00-step*.16,boothZ,.80,.32,3.84,0xaf6552);
  }
  box(brass,boothX,4.16,boothZ,1.44,.32,3.84);
  box(steel,boothX,1.72,boothZ,4.48,2.72,.96);
  solid(boothX,1.72,boothZ,4.48,2.72,.96);
  for(const face of [-1,1]){
    for(let i=0;i<6;i++){
      const x=boothX+(i-2.5)*.64;
      box(iron,x,1.72,boothZ+face*.56,.48,1.76,.32);
      box(i%3===0?'coolWindow':'lamp',x,1.86,boothZ+face*.76,.32,1.12,.16);
      box(brass,x,1.42,boothZ+face*.90,.48,.16,.16);
    }
    sign(boothX,3.36,boothZ+face*1.24,3.84,.64,'电芯回收','CELL EXCHANGE / 24H','#ffb878',face>0?0:Math.PI);
  }
  box(iron,boothX,4.80,boothZ,.32,1.28,.32);
  box(steel,boothX,5.76,boothZ,1.28,1.28,1.28,0xab725d);
  for(const face of [-1,1]){
    box('lamp',boothX,5.76,boothZ+face*.65,.64,.64,.12);
    box('lamp',boothX+face*.65,5.76,boothZ,.12,.64,.64);
  }

  // Public stairs against the market gable: a continuous 16 cm rise from
  // the paving to the landing, capped by the access door of the upper flat.
  const stairX=-13.46, endZ=-136.12;
  for(let i=0;i<20;i++){
    const h=(i+1)*.16,z=endZ+(19-i)*.32;
    box('stone',stairX,.36+h/2,z,1.60,h,.32,i%5?0xb2ad9e:0xaa8c7b);
    solid(stairX,.36+h/2,z,1.60,h,.32);
    if(i%4===0)box(iron,stairX+.72,.84+h,z,.16,.96,.16);
    box(iron,stairX+.72,1.39+h,z,.16,.16,.32);
  }
  box(steel,stairX,3.40,endZ-.80,1.60,.32,1.28);
  solid(stairX,3.40,endZ-.80,1.60,.32,1.28);
  box(iron,stairX-1.00,4.62,endZ-.80,.32,2.12,1.28);
  box('lamp',stairX-.80,5.80,endZ-.80,.32,.16,.64);
}
