// The long axis runs between load-bearing cores. Three nested sections give
// the occupied floor, its bearing shoes and its recessed windows real depth.
export function occupiedWing({B,C,jointReveal=0},width,depth,bottom,floors,seed){
  const pitch=3.2,h=floors*pitch,skin=seed%3===0?0xa49480:0x92acb2;
  const dark=0x455969,metal=0xa2b4ae,edge=0xb5c6b8;
  const ends=width*.5,sides=depth*.5;
  B('dark',dark,0,bottom+.64,0,width-1.28,1.28,depth-1.28);
  B('metal',metal,0,bottom+1.12,0,width,.64,depth);
  B('glass',0xcedadc,0,bottom+1.44+h*.5,0,width-1.28,h,depth-1.28);
  C(0,bottom+(1.44+h)*.5,0,width-.64,1.44+h,depth-.64);
  for(let floor=1;floor<=floors;floor++){
    const y=bottom+1.44+floor*pitch,top=floor===floors;
    B(top?'ceramic':'metal',top?skin:metal,0,y,0,width,top?.96:.48,depth);
  }
  // Alternating through-frames wrap the top, sides and soffit of the floor.
  // Glass and illuminated recesses lie behind them by one to three cells.
  const bays=Math.max(2,Math.round((width-1.92)/5.76)),spacing=(width-1.92)/bays;
  for(let i=0;i<=bays;i++){
    const x=-ends+.96+i*spacing,thick=(i+seed)%3===0;
    const pier=thick?1.28:.64;
    for(const sign of [-1,1]){
      B('ceramic',skin,x,bottom+1.44+h*.5,sign*(sides-.32),pier,h,.96);
      B('metal',metal,x+(i===bays?-.32:.32),bottom+1.6,sign*(sides-.48),pier+.64,.96,1.60);
      if(i<bays&&(i+seed+(sign>0?1:0))%3===0){
        B('wash',seed%2?0xb1dadd:0xddbb96,x+spacing*.48,bottom+1.44+((i+seed)%floors+.57)*pitch,
          sign*(sides-.60),spacing*.5,.80,.16);
      }
    }
    if(thick||i===0||i===bays){
      // The north-core transfer frame wraps around the belly plate. Its
      // exposed side and soffit sit one half-cell proud of the plate.
      B('ceramic',skin,x,bottom+.32-jointReveal*.5,0,pier+.64,.64+jointReveal,depth-1.28+2*jointReveal);
      B('metal',edge,x,bottom+1.44+h+.64,0,pier,.32,depth-.64);
    }
  }
  for(const sign of [-1,1]){
    // An end shear wall has a stepped corner reveal and a real recessed seam.
    B('ceramic',skin,sign*(ends-.48),bottom+1.44+h*.5,0,.96,h,depth*.41);
    B('metal',metal,sign*(ends-.16),bottom+1.76+h*.42,-sides*.26,.32,h*.64,.64);
  }
}

// x-axis aligned rows graft directly into the Exchange's existing towers.
// The last east annex has a ground-floor arcade under its edge. The device
// court and the sightline to the public hall remain open at their centre.
export function exchangeStreetWings(frame){
  // The eastern side of the square used to end in a strip of paving under a
  // distant tower. Its new building fronts the path around the central court.
  const east=frame(20.16,-135.36);
  // Retain the public through-walk and its existing chair in the middle of
  // this floor. Two service cores at the ends carry the inhabited floors.
  for(const [u,v,w,d] of [[1.92,-4.96,3.84,3.20],[2.56,5.44,2.56,2.24]]){
    east.B('ceramic',0x99aba6,u,2.40,v,w,4.48,d);
    east.C(u,2.40,v,w,4.48,d);
    east.B('dark',0x3d5462,u-w*.5,2.40,v,.32,3.20,d-.64);
    east.B('wash',0xb7d5d6,u-w*.5-.16,3.36,v,.32,.64,d-.96);
  }
  for(const v of [-5.76,0,5.76]){
    east.B('ceramic',0x9caea7,-3.36,2.40,v,.96,4.48,.96);
    east.C(-3.36,2.40,v,.96,4.48,.96);
    east.B('metal',0xaab9b0,-3.04,4.16,v,1.60,.96,1.60);
  }
  occupiedWing(east,7.68,13.44,4.48,2,12);
  for(const [x,z,w,d,base,stories,key] of [
    [-28.8,-99.84,37.12,10.88,17.92,3,1],
    [-6.72,-105.6,10.88,13.44,10.88,2,2],
    [13.12,-102.4,22.40,16.64,14.40,3,3],
    [5.76,-98.56,30.72,8.32,30.72,2,5],
    [51.84,-104.96,46.08,12.80,24.32,3,4],
    [26.88,-141.12,23.68,18.56,10.56,3,6],
    [-16.96,-144.0,13.44,18.56,11.84,2,8],
    [-12.16,-134.08,16.64,9.60,6.72,2,11],
  ]) occupiedWing(frame(x,z),w,d,base,stories,key);
}

// Full transfer floors join the cores; unilateral wings stop short of the
// opposite side. Their different clearances leave open sections in the route.
export function coreStreetWings(localFrame){
  // The eastern bearing rises out of the existing south gate's capped pier.
  const gate=localFrame(68,-189.8,0);
  gate.B('dark',0x586a75,0,14.24,0,3.84,5.12,4.48);
  gate.C(0,14.24,0,3.84,5.12,4.48);
  for(let i=0;i<3;i++)gate.B('ceramic',0xa9b8b5,0,14.08+i*.64,0,4.48+i*1.28,.64,5.12+i*.64);
  for(const [a,b,depth,base,floors,key] of [
    [[28,-194],[68,-189.8],9.60,15.36,3,1],
    [[22,-211],[45.44,-219.84],12.80,13.12,2,2],
    [[3.2,-212.1],[-30.4,-225.5],8.96,8.32,2,3],
    [[48,-255],[65.60,-248.32],14.08,17.92,2,10],
    [[64,-292],[86.4,-286.72],14.08,11.52,4,4],
    [[108,-297],[87.68,-299.52],12.16,15.04,3,5],
    [[108,-297],[150,-293],11.52,25.60,3,6],
    [[-43,-311],[-3.5,-317.9],10.24,18.24,2,7],
    [[88,-326],[49,-315],11.52,22.40,3,8],
    [[88,-351],[62.72,-354.56],13.44,17.28,3,9],
  ]){
    const dx=b[0]-a[0],dz=b[1]-a[1];
    const frame=localFrame((a[0]+b[0])*.5,(a[1]+b[1])*.5,-Math.atan2(dz,dx));
    occupiedWing(frame,Math.round(Math.hypot(dx,dz)/.32)*.32,depth,base,floors,key);
  }
}

// One street-facing depot or office, with a recessed pedestrian-level front.
// The stairs in the facade fillets are on the same 32 cm grid as the roof.
export function infillExchange(frame,w,d,stories,key){
  const {B,C}=frame;
  const side=d*.5,front=side-1.60;
  B('metal',0x6d7b83,0,2.36,-.80,w,4.40,d-1.60);
  C(0,2.36,-.80,w,4.40,d-1.60);
  B('glass',0xa9cac8,0,2.30,front+.14,w-1.28,3.52,.32);
  const bays=Math.max(2,Math.round(w/3.84));
  for(let i=0;i<=bays;i++){
    const u=-w*.5+.48+(w-.96)*i/bays;
    B('ceramic',0xa1aca4,u,2.40,side-.48,.96,4.48,.96);
    C(u,2.40,side-.48,.96,4.48,.96);
    B('metal',0x99a9a2,u,4.16,side-.80,1.60,.96,1.60);
    if(i<bays)B('wash',key%3===0?0xe1c297:0xaacbcd,u+(w-.96)/bays*.5,3.68,front+.34,(w-.96)/bays-1.28,.48,.16);
  }
  occupiedWing(frame,w,d,4.48,stories,key);
}
