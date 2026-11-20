// Full-depth workshop fittings stay behind the street wall and its glazing.
export function buildSoHoWorkroom(B,C,width,brick,books) {
  const inner=width-.42;
  B('districtOak',0,4.18,-1.19,width,.16,2.38);
  B('districtPlaster',0,7.12,-1.19,width,.26,2.38);
  B(brick,0,4.62,-.05,width,.72,.31);
  const glazing=width/4;
  for(let i=0;i<4;i++){
    const u=(i-1.5)*glazing;
    B('districtGlass',u,5.76,-.08,glazing-.13,1.68,.040);
    B('districtIron',u-glazing/2+.033,5.76,-.01,.09,1.82,.18);
    B('districtZinc',u,5.14,.032,glazing-.02,.10,.25,0xc4c3b1);
  }
  C(0,5.675,-.08,width,3.15,.28,'workroom-front');
  B(brick,0,6.95,-.065,width,.60,.30);
  B('districtZinc',0,6.72,-.01,width+.15,.17,.40,0xb7bfb6);
  if(books){
    B('districtOak',0,5.08,.21,width+.54,.23,.65,0xa89977);
    B('districtWarm',0,6.53,-1.15,width-.64,.073,.16,0xac9e87);
  }
  B('districtPlaster',0,5.73,-2.30,inner,2.95,.12,0xad9c88);
  B('districtIron',0,4.97,-1.42,inner-.40,.83,.70,0x849893);
  B('districtOak',0,5.41,-1.42,inner-.26,.10,.82,0xd6bd95);
  for(const u of [-width*.29,0,width*.29]){
    if(books){
      B('districtOak',u,5.83,-1.98,1.60,1.41,.25,0xc4af91);
      for(let i=0;i<5;i++){
        B('districtPaper',u-.61+i*.27,6.01,-1.78,.214,.55,.12,i%2?0xd3b490:0x94a6a5);
      }
    }
    B('metal',u,5.60,-1.41,.48,.27,.48,0x9eaaa1);
    B('metal',u,5.96,-1.56,.12,.61,.14,0xa4aaa0);
    B('districtZinc',u,6.17,-1.36,.51,.12,.48,0xa9b8ad);
    B('districtWarm',u,6.93,-1.34,1.32,.055,.21);
    B('districtPaper',u+.42,5.51,-1.24,.30,.10,.38,0xbb946f);
  }
}

export function buildSoHoLoadingBay(B,C,lo,hi) {
  const u=(lo+hi)/2,w=hi-lo;
  B('districtIron',u,3.16,-.48,w,.23,1.09);
  B('paver',u,.34,-1.61,w,.045,3.20,0xb3ad99);
  C(u,1.79,-3.22,w,2.86,.16,'loading-shutter');
  B('districtIron',u,1.79,-3.22,w,2.86,.16,0x87918a);
  for(let y=.51;y<3.15;y+=.19)B('districtZinc',u,y,-3.114,w-.20,.089,.07,0x83968e);
  for(const side of [-1,1]){
    const edge=u+side*(w/2-.13);
    B('districtIron',edge,1.75,-1.62,.23,2.82,3.16,0x849790);
    B('districtZinc',edge,1.90,-.15,.19,2.96,.31,0xb4bcb0);
    B('yellow',edge,.83,-.02,.105,.72,.11,0xa19769);
    C(edge,1.74,-1.62,.23,2.76,3.16,'loading-jamb');
  }
  B('districtWarm',u,3.07,-1.15,w*.67,.075,.21);
  B('yellow',u,.38,-.12,w-.18,.026,.13,0xa99e71);
  const stock=u-w*.25;
  B('districtOak',stock,.55,-2.17,.92,.28,.80,0x9f8d77);
  B('districtPaper',stock,.88,-2.17,.78,.44,.70,0xb7ab8d);
  C(stock,.71,-2.17,.92,.70,.80,'loading-stock');
}

export function buildSoHoDisplay(B,C,width,depth,furniture,glassInset) {
  // The foreground and back shelving are independent planes behind clear panes.
  for(const u of [-width*.37,-width*.12]){
    const base=-glassInset-.57;
    B('districtIron',u,.66,base,1.34,.56,.75,0x9da89b);
    B('districtOak',u,.98,base,1.42,.13,.84,0xd7bc96);
    C(u,.68,base,1.42,.64,.84,'display-plinth');
    B('districtWarm',u,3.05,-.90,1.05,.07,.22);
    for(let i=0;i<5;i++){
      const x=u+(i-2)*.23;
      if(furniture==='books'){
        B('districtPaper',x,1.19,base+.17,.19,.32,.06,[0xa65e48,0x627f7b,0xe3c58c,0x726786,0x8c9a61][i]);
        B('districtPaper',x,1.25,base+.206,.128,.036,.015,0xe4cfab);
      }else{
        B(i%2?'leaf':'yellow',x,1.16,base+.18,.18,.20,.23,i%2?0xb5bb8c:0xd5b37f);
        B('districtPaper',x,1.11,base+.37,.105,.12,.035,0xceba98);
      }
    }
    B('districtIron',u,2.11,-depth+.67,1.33,.08,.42,0xa6a99b);
  }
}
