// The warehouses share a refrigeration plant. Its ducts cross the service
// lanes at roof level and return to the river through the last loading loft.
export function buildHarborExchange({B,L,C,label}){
  const steel='harborHullBlue',plate='harborPlate',frame='harborRust',lamp='harborBeacon';
  const lights=[];
  // Cold storage is loaded again from the track side. The deep west-facing
  // shutters and open compressor wells are visible under the viaduct.
  for(const [cx,back,width] of [[-59,-23.45,14.72],[-87,-20.55,14.08],[-114,-22.85,12.80]]){
    const bays=3;
    for(let i=0;i<bays;i++){
      const x=cx+(i-1)*width/3,z=back-.59,w=width/3;
      B(steel,x,2.64,z,w-.16,4.48,.96,0x9bb2ab);
      B(i===1?plate:frame,x,1.39,z-.53,w-.48,1.60,.24,0xa49a88);
      B(lamp,x,3.52,z-.50,w-.58,1.92,.19,i===1?0xb5d0c7:0xc6a17a);
      for(let k=0;k<3;k++){
        const xx=x+(k-1)*(w-.80)/3;
        B(steel,xx,3.31,z-.67,.16,2.32,.32);
        // Staggered crates behind the mullions of the illuminated work bay.
        if(k!==1)B(frame,xx+.26,2.98,z-.71,.48+(i%2)*.32,.64,.19,0xaa8d71);
      }
      B(plate,x,2.60,z-.80,w-.16,.32,.64);
      for(let j=0;j<3;j++)B(j===1?plate:steel,x-w/2+.32,4.52+j*.32,z-j*.32,.80+j*.32,.32,1.28+j*.32);
    }
    B(steel,cx,5.61,back-1.56,width+.64,.48,2.88);
    B(plate,cx,5.94,back-1.77,width+1.28,.32,3.20);
    const door=cx-width*.32;
    B(lamp,door,5.33,back-2.62,3.20,.16,.64,0xefbd88);
    lights.push([door,5.04,back-2.72,0xf2b47e,115,13]);
    for(const side of [-1,1]){
      const x=cx+side*(width/2-.16);
      B(steel,x,2.58,back-.66,.80,4.48,1.28);
      B(plate,x,1.09,back-.91,.96,1.28,1.44);
      B(lamp,x,3.06,back-1.32,.40,1.12,.12,0x88aaa7);
    }
    label(cx+1.10,4.84,back-1.0,4.80,.76,'低温集配','后场  /  夜间装车','#d7b68e',Math.PI);
    C(cx,2.59,back-.62,width+.24,4.46,1.30);
  }
  function coolingBank(x,z,floor,levels,span,accent){
    const shell=span*.64;
    B(steel,x,floor+.40,z,span+1.28,.80,6.40,0xacb0ae);
    for(let row=0;row<levels;row++){
      const left=row<levels-2?0:.64*(row-levels+3),y=floor+1.44+row*1.28;
      B(steel,x+left,y,z,shell,1.28,4.48,0xafbab4);
      for(const hand of [-1,1]){
        B(plate,x+left,y-.38,z+hand*2.44,span-left*.6,.32,.64,0xb0bfba);
        for(let ix=0;ix<4;ix++){
          const tx=x+left+(ix-1.5)*1.28;
          B(frame,tx,y+.12,z+hand*2.27,.96,.64,.56,0x887a68);
          if((ix+row)%3!==0)B(lamp,tx,y+.055,z+hand*2.57,.64,.19,.12,accent);
        }
        B(plate,x-2.24+left,y+.32,z+hand*2.75,.32,1.28,.64,0xa1b4b4);
      }
    }
    const y=floor+1.28*levels+.80;
    B(plate,x+1.28,y+.24,z,shell,.48,4.80);
    for(let i=0;i<4;i++)B(steel,x+.32+i*.64,y+.64+(i===1?.32:0),z,.48,.80,3.20);
  }
  coolingBank(-61.2,-18.0,11.30,5,7.68,0x85d8cf);
  coolingBank(-87.7,15.55,11.50,4,6.40,0xe4bd84);
  coolingBank(-113.5,-17.3,11.45,9,8.96,0xa3d6cf);
  coolingBank(-58.6,19.1,14.60,3,6.40,0xb3c69c);
  // Raised cold mains, backed by corbelled shoes on existing roof trusses.
  for(const [start,end,z,y] of [[-115,-61,-17.7,16.16],[-114,-58,17.14,15.52]]){
    const span=end-start;
    B(steel,(start+end)/2,y,z,span,1.2,2.08);
    B(plate,(start+end)/2,y+.64,z,span,.32,2.4);
    for(let x=start+1.28;x<end;x+=3.2){
      B(frame,x,y,z,.38,1.60,2.72,0xc3ac8d);
      if(Math.round((x-start)/3.2)%3===0)B(lamp,x+.40,y+.04,z+(z>0?-1:1)*1.07,.64,.16,.16,0x9ab5a7);
    }
    for(const [x,base] of z<0?[[-114,11.5],[-87,14.0],[-59,11.04]]:[[-114,11.6],[-87,11.2],[-59,14.2]]){
      for(const dx of [-3,3]){
        const y0=base,y1=y-.5;
        if(y1<=y0)continue;
        B(plate,x+dx,(y0+y1)/2,z,.80,y1-y0,1.28);
        B(steel,x+dx,y0+.18,z,1.60,.36,2.24,0xacc2b8);
      }
    }
  }
  // Cantilevered transfer press and apron on the last shed: the forward
  // abutment ends at one side of the road, revealing the river at its corner.
  const x=-117.2;
  for(let layer=0;layer<6;layer++){
    const z=8.96-layer*.80;
    B(layer%3===0?plate:steel,x,7.04+layer*.48,z,7.68,.64,3.84,0xb8b9a9);
    B(frame,x-3.68,7.04+layer*.48,z,.48,.80,4.16,0xa58a78);
  }
  B(steel,x,10.25,5.70,8.32,1.76,8.32);
  C(x,10.23,5.70,8.32,1.76,8.32);
  for(let i=0;i<6;i++)for(const hand of [-1,1]){
    const xx=x+(i-2.5)*1.28;
    B(lamp,xx,10.11,5.70+hand*4.22,.96,.64,.16,0xb0d1bf);
    B(plate,xx,10.36,5.70+hand*4.32,1.28,.16,.32,0x9baca7);
  }
  for(const xx of [-119.76,-114.64]){
    B(frame,xx,9.50,5.67,.48,.48,7.68);
    B(lamp,xx,9.19,5.67,.24,.16,6.40,0x94bcac);
    lights.push([xx,9.0,5.67,0xa3cdb9,105,14]);
  }
  label(x,10.25,1.34,5.76,.96,'西港保税线','冷链转运  /  07','#b2cec2',Math.PI);
  // A rail control room opens toward the greenway, high over the public deck.
  for(const [x,z,y,len] of [[-85,-23.20,9.80,13.44],[-57.6,-24.20,10.25,9.60]]){
    B(frame,x,y-.48,z+.96,len+1.28,.96,4.48);
    B(steel,x,y+1.44,z+.16,len,2.88,3.84);
    for(let i=0;i<Math.floor(len/1.6);i++){
      const xx=x-len/2+.8+i*1.60;
      B(plate,xx,y+1.12,z-1.94,1.52,1.60,.48);
      B(lamp,xx,y+1.20,z-2.21,1.23,1.04,.15,i%3===0?0x889e99:0xd6b98b);
      B(steel,xx,y+1.17,z-2.33,.16,1.18,.24);
    }
    B(plate,x,y+2.97,z-1.76,len+.64,.40,1.92);
    lights.push([x,y+.80,z-2.65,0xd8bb8e,110,12]);
  }
  // AC shore bus on the opposite bank marks the far edge across dark water.
  for(const [x,z,base,width] of [[-261,29,20,11.52],[-267,-29,23,9.60],[-276,2,29,13.44]]){
    B(steel,x,base+.64,z,width,1.28,11.52);
    for(let i=0;i<5;i++){
      const zz=z+(i-2)*1.92,h=2.56+(i===1||i===2?1.92:0);
      B(plate,x,base+1.28+h/2,zz,3.20,h,1.28);
      B(lamp,x+1.65,base+1.60+h*.53,zz,.24,.55,1.04,0x97b5be);
    }
  }
  return lights;
}
