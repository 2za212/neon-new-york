// These occupied blocks share the hydraulic plant on the east horizon. A
// narrow stair/lift spine carries two unequal residential plates. Cut a full
// garden storey between them, so sky survives through the upper silhouette.
function residence({box:B},x,z,w,d,height,variant){
  const hand=variant%2?-1:1;
  const block=(m,u,y,v,wide,rise,deep,tint=0xffffff)=>
    B(m,x+u,y,z+v,wide,rise,deep,tint,0,null,true);
  const alloy='titaniumSkin',ceramic='ceramicShell',carbon='basaltShell';
  const opal='roomHome',amber='roomKitchen',shellTint=[0xc9d9d0,0xb2becb,0xb6c5b9][variant%3];
  const serviceX=hand*w*.22,serviceZ=-d*.14;
  // The supply risers ascend from the occupied arcade into the sky gardens.
  for(const side of [-1,1]){
    const xx=-w*.48,v=side*d*.34,top=height*(side===hand?.68:.48);
    block(alloy,xx,top/2,v,.96,top,.96,0x88aaa3);
    for(let y=3.84;y<top;y+=4.48){
      block(carbon,xx,y,v,1.60,.64,1.60);
      block('harborBeacon',xx-.83,y,v,.16,.32,.80,0x8ec0b0);
    }
    block(alloy,xx+1.60,top,v,4.16,.96,.96,0x88aaa3);
  }
  const low=height*(variant===2?.4:.49),cut=5.12+variant%2*1.28,high=height-low-cut;
  block(carbon,serviceX,height/2,serviceZ,w*.32,height,d*.45,0x9db6bf);
  block(alloy,serviceX-hand*w*.14,height*.51,serviceZ-d*.18,w*.16,height*.98,d*.12,0x90aeb4);
  for(const end of [-1,1]){
    const v=end*d*.31;
    block(alloy,hand*w*.05,2.24,v,w*.64,4.48,d*.22,0xb0c3c1);
  }
  block(ceramic,0,4.80,0,w,.64,d,shellTint);
  // The underside of the waterworkers' flats is the late-shift entrance.
  // A deep vestibule sits between the load shoes, with a second front on
  // the transverse lane. Both lead into the solid stair/lift spine.
  const porch=-w/2,doors=d*.50,steps=4,pitch=doors/steps;
  for(let bay=0;bay<steps;bay++){
    const v=(bay-(steps-1)/2)*pitch;
    block(alloy,porch+2.72,2.25,v,.64,4.48,pitch+.02,0xaabdc0);
    block('roomOffice',porch+2.36,2.50,v,.14,2.56,pitch-.32,
      bay===1?0xd08b5d:bay===2?0xe1b589:0x76b4ac);
    block(carbon,porch+2.20,1.85,v+pitch*.32,.32,2.88,.28,0x9aa9ab);
    block(ceramic,porch+1.12,4.49,v,3.84,.56,pitch-.08,shellTint);
    block('harborBeacon',porch+.10,4.19,v,.64,.14,pitch*.71,
      bay===1||bay===2?0xffd8a0:0xbbe3d7);
    if(bay===0||bay===steps-1){
      block(alloy,porch+1.60,1.11,v,1.44,1.92,pitch-.32,0x74908d);
      block(ceramic,porch+.74,1.71,v,.32,.64,pitch-.40,shellTint);
    }
  }
  function deck(cx,cz,y,ww,dd,rise,num){
    const opening=2.24,segment=(rise-opening)/2;
    block(alloy,cx,y+segment/2,cz,ww,segment,dd,0x7f9aa4);
    block(carbon,cx+hand*.48,y+segment+opening/2,cz,ww-1.28,opening,dd-1.60,0x536677);
    block(ceramic,cx,y+rise-segment/2,cz,ww,segment,dd,shellTint);
    for(const e of [-1,1]){
      const side=cx+e*(ww/2-.26),face=cz+e*(dd/2-.30);
      // Long shallow loggias with actual open slab ends interrupt the long
      // elevations. Staggered unit boundaries cast shadows into the loggias.
      const bays=Math.max(3,Math.round(dd/3.20));
      for(let i=0;i<bays;i++){
        const zz=cz+(i-(bays-1)/2)*dd/bays;
        block((num+i+variant)%4===1?amber:opal,side-e*.80,y+segment+1.12,zz,
          .19,1.68,dd/bays-.80,(num+i)%3===0?0xbcaf98:0x8ba9ae);
        if((i+num)%2===0)block(ceramic,side-e*.12,y+segment+1.12,zz+dd/bays*.41,.72,2.24,.64,shellTint);
      }
      block(alloy,cx,y+segment+.32,face,ww+.64,.64,1.12,0x9eb0b4);
      block(ceramic,side-e*.16,y+segment+.16,cz,.96,.32,dd+.64,shellTint);
      const stub=cx+e*ww*.16;
      block(opal,stub,y+segment+1.18,face-e*.62,ww*.53,1.76,.20,0x8bb3b6);
    }
  }
  // The lower floors widen toward the park; the upper group turns in plan
  // and lands on the independent stair spine at the far end of the lot.
  const lowerRise=(low-5.12)/2;
  for(let i=0;i<2;i++)
    deck(-hand*(.48+i*.48),i*.64,5.12+i*lowerRise,w-1.28+i*.64,d-i*.96,lowerRise,i);
  const terraceY=low+.32;
  block(ceramic,-hand*.96,terraceY,0,w+1.28,.64,d+.96,shellTint);
  for(let j=0;j<4;j++){
    const u=-hand*(w*.28)+(j%2)*1.12,v=d*(.24-(j>>>1)*.50);
    block(carbon,u,terraceY+.64,v,2.56,.64,2.56);
    block('darkLeaf',u,terraceY+1.60,v,2.24,1.28,1.92,0xabc4a3);
    block('leaf',u+.32,terraceY+2.56,v,.96,.64,1.28,0xacc7ae);
  }
  const highRise=high/3;
  for(let i=0;i<3;i++){
    const slide=hand*(i-1)*.96;
    deck(slide,-1.28-i*.64,low+cut+i*highRise,w-1.92-i*1.28,d-1.92-i*1.28,highRise,i+2);
  }
  for(let i=0;i<3;i++)
    block(i===1?alloy:ceramic,serviceX, height+.64+i*1.28,serviceZ-i*.64,w*.46-i*.96,1.28,d*.51-i*1.28,shellTint);
}

const lots=[
  [163.2,21.76,17.92,20.48,34.56,0],
  [187.84,-2.56,15.36,24.32,48.00,1],
  [178.56,-30.72,16.64,17.92,29.44,2],
  [213.12,-47.36,20.48,23.04,56.32,3],
  [229.76,-83.20,17.92,25.60,38.40,4],
];
export const waterworksResidences=lots.map(([x,z,w,d,h,type])=>
  [x,z,w,d,h,type,(api,px,pz)=>residence(api,px,pz,w,d,h,type)]);
export const waterworksEntranceLights=lots.slice(0,3).map(([x,z,w])=>[x-w/2-.64,3.85,z]);
