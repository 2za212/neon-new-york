import {furnishFultonCommons,serviceWindows} from './nyc-fulton-commons.js';
// Metres, Y up. 3B is a double-height apartment in the existing west frontage.
// Local -Z (the three brick windows) faces world +X, across Market Avenue.
export const fulton={
  origin:[-14.92,7.36,70],rotation:-Math.PI/2,rearExtension:2.56,
  street:[-9.55,.36,76.12],landing:[-18.32,7.36,75.72],liftX:-21.12,liftZ:76.12
};

export function buildFultonHouse({B,bond=B,panel,C,label,surface,hallLight}){
  const [cx,floor,cz]=fulton.origin,front=cx+4.27,back=front-14,north=cz-5.07,party=cz+4.96,south=78.12;
  const ground=fulton.street[1],mid=4.16,upper=12.90,roof=19.36;
  function solid(mat,x1,x2,y1,y2,z1,z2,id,frontFace=0){
    const args=[(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,x2-x1,y2-y1,z2-z1];
    if(frontFace)bond(mat,...args,0xffffff,frontFace,Math.round(y1*3+z1*2));
    else B(mat,...args);
    C(...args,'fulton/'+id);
  }
  // Wall mass stops at the actual apartment and the public hall. Its three
  // windows are the authored openings in the GLB, not lit cards on a solid box.
  // The bedding below 3B's planks tops out at -0.09 m. Keep the masonry
  // inside that bedding, below the full surface of the recessed hatches.
  const recess=front-2.24;
  solid('basaltShell',back,recess,ground,floor-.14,north,party,'lower-spine',2);
  solid('basaltShell',back,cx-4.46-fulton.rearExtension,floor,upper,north,party,'rear-units');
  // The setback creates a covered ground-level cut-through along the front.
  solid('titaniumSkin',recess,front,ground-.16,ground,north,party,'lower-gallery-deck');
  surface(recess,front,north,party,ground);
  for(const [i,z] of [66.06,68.27,70.48,72.69].entries()){
    B(i===0?'routeHome':i===3?'routeBlinds':'routeStudio',recess+.09,1.92,z,.18,1.28,1.72);
    B('titaniumSkin',recess+.21,2.72,z,.48,.32,1.92,0xa8babb);
    B('basaltShell',recess+.28,1.91,z-.86,.64,2.08,.32);
    if(i===1||i===3)B('districtWarm',recess+.38,2.59,z,.24,.10,1.12,0xcbad82);
    B('ceramicShell',recess+.24,.93,z,.48,.32,2.08,0xc9d4c5);
  }
  // Upper units overhang the covered lane with different depths. The stair
  // landing breaks the band before it reaches the street entrance.
  for(const [lo,hi,edge] of [[north,68.40,front+1.28],[68.72,72.24,front-.64],[72.56,party,front+.64]]){
    const z=(lo+hi)/2,w=hi-lo;
    solid('titaniumSkin',recess,edge,mid,mid+3.04,lo,hi,'suspended-unit',2);
    const middle=lo===68.72;
    B(middle?'routeHome':'routeStudio',edge+.08,mid+1.56,z,.16,middle?.98:1.24,w-.80);
    B('basaltShell',edge+.15,mid+2.28,z,.96,.32,w-.34);
    B('titaniumSkin',edge+.29,mid+1.44,z+w*.38,.80,1.28,.48,0xb9c9c2);
    if(lo===north)for(let slot=0;slot<4;slot++)
      B('titaniumSkin',edge+.32,mid+1.09+slot*.26,z-.50,.64,.16,.96,0xb7b49b);
    bond('basaltShell',edge+.24,mid+.42,z,.64,.84,w,0xc7d2d5,2,Math.round(z));
    bond('ceramicShell',edge+.34,mid+2.70,z,.85,.52,w-.18,0xd3d8c2,2,Math.round(z)+3);
    B('titaniumSkin',edge+.48,mid+2.31,z,.64,.20,w*.72);
    B('districtWarm',edge+.51,mid+2.16,z,.32,.10,w*.56,0xe2bf95);
    for(const end of [-1,1])B('titaniumSkin',edge-.55,mid+1.67,z+end*(w/2-.02),1.60,1.76,.22);
  }
  // The northern housing bar and taller return wing are divided by a
  // full-depth two-metre slot. One gallery crosses the slot at the rear.
  for(const [lo,hi,edge,h] of [[north,71.00,front+.80,roof],[73.08,south,front+1.76,roof+3.20]]){
    const z=(lo+hi)/2,w=hi-lo;
    solid('basaltShell',back,edge-.96,upper,h,lo,hi,'upper-bar');
    for(let i=0;i<Math.round((h-upper)/3.2);i++){
      const y=upper+3.2*i,tip=edge-i*.32;
      solid('titaniumSkin',edge-.96,tip,y,y+.72,lo,hi,'upper-sill',2);
      solid('ceramicShell',edge-1.12,tip+.16,y+2.70,y+3.18,lo+.08,hi-.08,'upper-head',2);
      B(i%2?'routeHome':'routeStudio',edge-.83,y+1.67,z,.20,1.75,w-.80);
      for(const side of [-1,1]){
        const end=z+side*(w/2-.22);
        bond('titaniumSkin',tip-.36,y+1.63,end,1.12,2.56,.44,0xcdced1,2,i+side);
        B('ceramicShell',tip-.20,y+.99,end,.96,.32,.64,0xc9c8b8);
      }
    }
    solid('titaniumSkin',back-.08,edge-1.04,h,h+.32,lo,hi,'bar-roof');
  }
  solid('titaniumSkin',back,back+2.40,upper+2.56,upper+3.04,70.84,73.24,'rear-airbridge');
  C(cx-fulton.rearExtension/2,floor+2.62,cz,8.60+fulton.rearExtension,5.24,9.77,'3B'); // outside motor only
  // Only the sequenced lift can occupy the shaft. Keep the walking motor's
  // boundary while leaving the volume between the two stops open for the car.
  C((back-22.52)/2,(ground+upper)/2,(party+south)/2,-22.52-back,upper-ground,south-party,'fulton/lift-shaft');
  B('metal',back+.06,(ground+upper)/2,(party+south)/2,.12,upper-ground,south-party);
  for(let j=0;j<8;j++){
    const y=3.62+j*.42;
    B(j%3===0?'districtWarm':'districtZinc',-22.55,y,76.16,.043,.074,1.38);
  }
  for(const z of [party+.025,south-.025])B('metal',(back-22.52)/2,(ground+upper)/2,z,-22.52-back,upper-ground,.05);
  let wallY=ground;
  for(const h of [ground,floor]){
    solid('basaltShell',-22.52,front,wallY,h+1.27,south-.18,south,'south-window-sill');
    let left=-22.52;
    for(const [lo,hi] of serviceWindows(h===floor)){
      solid('basaltShell',left,lo,h+1.27,h+2.61,south-.18,south,'south-window-pier');
      left=hi;
    }
    solid('basaltShell',left,front,h+1.27,h+2.61,south-.18,south,'south-window-pier');
    wallY=h+2.61;
  }
  solid('basaltShell',-22.52,front,wallY,upper,south-.18,south,'south-window-head');
  // The feeder above Market Avenue branches down the outside of this house.
  // Two courser-stepped glass insulators cast light through an open grille.
  // Space between the shaft and the actual street remains visible behind it.
  for(const [i,x] of [-20.51,-15.23,-12.32].entries()){
    const z=south+.69,h=11.70;
    B('districtIron',x,ground+h/2,z,.31,h,.40,0x6b7c82);
    C(x,ground+h/2,z,.31,h,.40,'fulton/outer-feeder');
    for(const y of [ground+1.55,floor+1.55]){
      for(let cell=0;cell<4;cell++){
        B(cell%2?'districtWarm':'districtCool',x,y+cell*.21,z,.47,.13,.48,
          i===0?0xe5b785:0xb3ddcf);
        B('districtZinc',x,y+.11+cell*.21,z,.53,.09,.54,0x819992);
      }
      B('districtZinc',x,y-.37,south+.42,.30,.18,.81,0x87918a);
      B('districtIron',x,y+.86,z,.62,.20,.59,0x697a80);
      hallLight(x,y+.36,south+.4,i===0?0xffc188:0x97d7cf,15);
    }
  }
  for(const level of [ground,floor]){
    solid('districtSlab',-22.52,front,level-.18,level,party,south,'hall-deck');
    surface(-22.52,front,party,south,level);
    solid('districtPlaster',-22.52,front,level+2.94,level+3.14,party,south,'hall-ceiling');
    // Apartment-side partitions enclose the stairs/lift hall on both levels.
    solid('districtPlaster',-22.52,front,level,level+2.94,party-.03,party+.10,'hall-wall');
    furnishFultonCommons({B,C,label,panel},level,level===floor,party+.10,south-.18);
    hallLight(-19.74,level+2.62,76.45,0xa4d4dc,12);
    hallLight(-15.36,level+2.62,76.45,0xffcf96,15);
    hallLight(-12.02,level+2.62,76.45,0xffc189,9);
    for(const [z,d] of [[75.18,.47],[77.53,1.16]])B('districtIron',-22.40,level+1.19,z,.22,2.38,d);
    for(const s of [-1,1]){
      B('districtZinc',-22.26,level+1.14,76.16+s*.79,.15,2.28,.10);
      B('districtOak',-22.32,level+1.21,76.16+s*.88,.18,2.42,.12);
    }
    B('districtIron',-22.38,level+2.64,76.48,.22,.60,3.01);
    B('districtZinc',-22.28,level+.025,76.16,.40,.05,1.57);
    label(-22.18,level+2.43,76.16,.98,.29,level===ground?'01 / LOBBY':'03 / LOFTS','FULTON  /  LIFT','#e5c698',Math.PI/2);
    B('districtIron',-22.19,level+1.12,76.99,.15,.39,.16);
    B('districtWarm',-22.10,level+1.14,76.99,.04,.09,.08);
  }
  // Closed intermediate storey; the lobby and upper passage are accessible.
  solid('basaltShell',-22.52,front,ground+3.14,floor-.18,party,south,'second-floor');
  solid('basaltShell',-22.52,front,floor+3.14,upper,party,south,'landing-head');
  for(const x of [-18.32,-20.70]){
    B('districtIron',x,floor+1.15,party+.15,1.29,2.30,.14);
    B('districtOak',x,floor+1.08,party+.244,1.06,2.15,.07);
    B('districtZinc',x-.39,floor+1.02,party+.30,.07,.21,.07);
    label(x,floor+1.68,party+.30,.46,.23,x===-18.32?'3B':'3A','RESIDENT','#e3c99a');
  }
  // Clear street door, glazed landing end, and a bank of apartment mailboxes.
  for(const z of [party+.12,south-.23])
    solid('districtIron',front-.12,front+.12,ground,ground+2.64,z-.11,z+.11,'doorpost');
  // The address sits inside the recessed passage, below the west-facing
  // circulation wing. Its offset light fin continues round the return wall.
  solid('basaltShell',front-.48,front+.48,ground+2.90,ground+3.22,party,south,'door-head');
  B('titaniumSkin',front+.28,2.84,party+.45,.88,.32,.96,0xc2c9bc);
  B('districtWarm',front+.36,2.68,party+.48,.64,.11,.72,0xe5b387);
  label(front-.56,2.70,76.34,1.82,.36,'七号 / 入户','FULTON 07','#bde6d5',Math.PI/2);
  label(front+.62,5.88,77.18,1.30,.85,'07','信号公寓','#a0ddd6',Math.PI/2);
  // An opening in the actual third-floor hall leads to a maintenance gallery.
  // The door clear width is 1.68m and the narrowest standing width is 1.44m.
  for(const [a,b] of [[party,75.54],[77.22,south]]){
    solid('basaltShell',front-.24,front+.08,floor,floor+1.06,a,b,'gallery-sill');
    solid('districtGlass',front-.12,front+.02,floor+1.06,floor+2.80,a,b,'gallery-glass');
  }
  solid('titaniumSkin',front-.22,front+1.92,floor-.32,floor,71.68,77.90,'gallery-deck');
  surface(front-.22,front+1.92,71.68,77.90,floor);
  solid('titaniumSkin',front+1.61,front+1.89,floor+.79,floor+1.05,71.68,77.90,'gallery-rail');
  for(const end of [71.76,77.78])solid('titaniumSkin',front-.04,front+1.82,floor+.79,floor+1.05,end-.08,end+.08,'gallery-end');
  for(let z=71.84;z<77.90;z+=1.28)B('basaltShell',front+1.75,floor+.51,z,.24,.99,.24);
  surface(front,-9.2,party,south,ground);B('paver',(front-9.2)/2,ground-.08,(party+south)/2,-9.2-front,.16,south-party);
  // A shared horizontal aperture reveals all three existing room windows.
  // The hood overlaps the old arched heads from outside, while the pillow
  // sightline still passes through the same full-width glazing below it.
  const windowStart=cz-4.32,windowEnd=cz+.80,lip=front+1.12;
  for(const [a,b] of [[north,windowStart],[windowEnd,71.36]]){
    solid('basaltShell',front+.27,front+.66,floor+.99,floor+3.20,a,b,'ribbon-end');
  }
  solid('basaltShell',front+.27,lip,floor+.05,floor+1.02,north,71.36,'ribbon-sill',2);
  solid('titaniumSkin',front+.28,lip+.16,floor+3.15,upper,north,71.12,'ribbon-hood',2);
  solid('basaltShell',front+.28,front+.88,floor+3.15,upper,71.12,party,'wing-return');
  B('ceramicShell',lip-.08,floor+.95,(windowStart+windowEnd)/2,.64,.32,windowEnd-windowStart+.48,0xbbcecb);
  B('districtCool',lip+.10,floor+3.20,(windowStart+windowEnd)/2,.24,.12,windowEnd-windowStart+.12,0x8eaeb1);
  for(const z of [cz-2.64,cz-.86]){
    B('basaltShell',front+.62,floor+2.08,z,.64,2.40,.32);
  }
  // A vertical maintenance cassette replaces the exposed fire stair. It
  // stands clear of the gallery floor and turns past the southern corner.
  const serviceZ=73.40;
  solid('basaltShell',front+.28,front+1.72,floor+2.48,upper+1.12,72.22,74.55,'maintenance-wing',2);
  for(let i=0;i<5;i++){
    const y=floor+2.86+i*.64;
    B('titaniumSkin',front+1.48,y,serviceZ,.96,.45,2.27,0xb7c4c6);
    B('districtCool',front+1.94,y+.16,serviceZ+.30,.16,.16,.96,0xbcd7d4);
    B('ceramicShell',front+1.65,y+.32,72.44,.64,.32,.64,0xcfd2b9);
  }
  const returnX=front-1.84;
  solid('basaltShell',returnX-1.56,returnX+1.56,mid+.37,floor-.32,south-.12,south+1.02,'south-switch-back');
  for(let i=0;i<3;i++){
    const y=mid+.64+i*.80;
    B('ceramicShell',returnX,y,south+.55,3.52,.40,1.42,0xbdcbba);
    B('districtWarm',returnX+.32,y+.28,south+1.11,1.28,.14,.22,0xe5ba8e);
  }
  hallLight(front+1.28,floor+2.14,76.00,0x94ccdc,26);
}
