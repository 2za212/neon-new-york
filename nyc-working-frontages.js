// Occupied upper floors above existing service plots. Local v points out to
// the street. The vehicle and pedestrian clearances are set by the bearings,
// independently of the upper floors' reach.
const freight={
  ribs:'titaniumSkin',dark:'harborHullBlue',shell:'ceramicShell',lamp:'harborBeacon',
  edge:0xafbac0,steel:0x91acbb,shadow:0x8899a9,glass:0x355564,
  light:[0xa6d2c7,0xc9a578,0xb0c0ae]
};
const utility={
  ribs:'eastParkIron',dark:'basaltShell',shell:'eastParkStone',lamp:'eastParkPressureGlass',
  edge:0xbbc9bb,steel:0x84a49f,shadow:0x899da2,glass:0x486667,
  light:[0xa0cdbb,0xc4b28b,0x86a8a1]
};
const pitch=4.48,storey=3.84;

function frontage({B,C},p,x,z,axis,direction) {
  const alongX=axis==='x';
  function world(u,v,w,d){
    return alongX ? [x+u,z+direction*v,w,d] : [x+direction*v,z+u,d,w];
  }
  function part(mat,u,y,v,w,h,d,tint){
    const [xx,zz,ww,dd]=world(u,v,w,d);
    B(mat,xx,y,zz,ww,h,dd,tint,0,null,true);
  }
  function solid(u,y,v,w,h,d){
    const [xx,zz,ww,dd]=world(u,v,w,d);
    C(xx,y,zz,ww,h,dd,'occupied-frontage');
  }
  function floor(u,v,base,bays,levels,depth,seed,through=false){
    const w=bays*pitch,h=levels*storey,front=depth/2;
    solid(u,base+h/2,v,w,h,depth);
    // The back service core ends inside the side cheeks. A setback between
    // each pair of fins exposes a return face and shades the glazing.
    part(p.dark,u,base+h/2,v,w-.64,h-.32,depth-1.28,p.shadow);
    for(const e of [-1,1]){
      const end=u+e*(w/2-.32);
      part(p.ribs,end,base+h/2,v-.16,.64,h,depth-.32,p.steel);
      for(let row=0;row<levels;row++)
        part(p.shell,end+e*.16,base+row*storey+1.28,v-.32,.96,1.28,depth-1.28,p.edge);
    }
    for(let row=0;row<levels;row++){
      const y=base+row*storey;
      part(p.ribs,u,y+.32,v,w+.32,.64,depth+.32,p.steel);
      part(p.shell,u,y+.80,v,w-.32,.32,depth+.64,p.edge);
      for(const side of through?[-1,1]:[1]){
        const lip=v+side*front;
        for(let i=0;i<bays;i++){
          const xx=u+(i-(bays-1)/2)*pitch;
          const lock=(i+seed+row)%4,window=lock!==0;
          part(window?(p===utility?'roomLab':'roomLoading'):p.dark,xx,y+2.20,lip-side*.43,pitch-.64,2.40,.32,p.glass);
          if(window){
            const lampX=xx+(lock===1?-.48:.48);
            part(p.lamp,lampX,y+2.62,lip-side*.22,2.24,.96,.24,p.light[(row+i+seed)%3]);
            part(p.ribs,lampX+.16,y+2.62,lip-side*.06,.32,1.28,.32,p.shadow);
          }else{
            for(let j=0;j<3;j++)
              part(p.ribs,xx,y+1.52+j*.64,lip-side*.10,3.20,.32,.64,p.steel);
          }
          const seam=xx-pitch/2+.32;
          part(p.ribs,seam,y+2.08,lip,.64,2.88,.96,p.steel);
          part(p.shell,seam+.16,y+3.20,lip+side*.16,.96,.64,1.28,p.edge);
          if(base<1){
            for(let k=0;k<3;k++){
              const face=lip+side*(k===1?.32:.16);
              part(p.shell,xx+(k-1)*1.28,y+.96,face,1.28,.64,k===1?.96:.64,p.edge);
            }
            part(p.shell,seam,y+1.76,lip+side*.32,.96,.96,.96,p.edge);
            part(p.ribs,seam+.16,y+3.52,lip+side*.32,1.60,.32,.96,p.steel);
          }
        }
      }
    }
    const top=base+h;
    part(p.ribs,u,top-.16,v,w+.64,.32,depth+.96,p.steel);
    part(p.shell,u,top+.16,v,w,.32,depth+.32,p.edge);
    // Socket teeth and a recessed underside light give the projecting floor
    // a readable bottom surface when a pedestrian passes under it.
    for(let i=0;i<bays;i++){
      const xx=u+(i-(bays-1)/2)*pitch;
      part(p.dark,xx,base-.24,v+.16,.96,.48,depth-.32,p.shadow);
      part(p.ribs,xx,base-.56,v+front-.96,1.60,.32,1.92,p.steel);
      if((i+seed)%2===0)
        part(p.lamp,xx+1.44,base-.08,v+front-1.28,1.60,.16,.48,p.light[seed%3]);
    }
  }
  function pier(u,v,base,w=1.92,d=2.56,foot=0){
    solid(u,(base+foot)/2,v,w,base-foot,d);
    part(p.dark,u,(base+foot)/2,v,w,base-foot,d,p.shadow);
    part(p.shell,u,foot+.96,v,w+.32,1.92,d+.32,p.edge);
    for(let j=0;j<3;j++)
      part(p.ribs,u,base-1.60+j*.64,v+.16*j,w+j*.64,.64,d+j*.64,p.steel);
  }
  return {floor,pier};
}

export function buildFreightFloors(api){
  // Cold-store dispatch above the old truss: its two real bays stack at
  // different ends of the crossing, leaving the western pier mouth free.
  const sorter=frontage(api,freight,-90.88,-.32,'z',-1);
  sorter.floor(0,0,7.68,5,1,7.04,1,true);
  sorter.floor(-4.48,-.96,11.84,3,2,6.40,2,true);
  // The buildings on each bank remain attached to their original loading
  // plots. These links occupy the upper air of the two side streets.
  const north=frontage(api,freight,-72.96,-10.24,'x',1);
  north.floor(0,0,10.24,4,2,6.40,1,true);
  north.floor(13.44,-1.28,15.04,2,2,6.40,0);
  // Paired refrigeration wings at the city approach. The north annex is
  // a narrow tower and the produce works spread sideways on the opposite
  // side. Both transfer their loads back into the roofs behind the road.
  const cold=frontage(api,freight,-70.72,-6.40,'x',1);
  cold.floor(0,0,18.24,3,3,7.68,2,true);
  cold.floor(-2.24,-1.28,30.08,2,2,7.04,1);
  const packing=frontage(api,freight,-64,7.68,'x',-1);
  packing.floor(0,0,14.72,6,2,9.60,1,true);
  packing.floor(-4.48,-1.60,22.72,4,2,7.68,2,true);
  packing.floor(-6.72,-2.56,30.72,1,1,5.76,0);
  const south=frontage(api,freight,-100.48,9.60,'x',-1);
  south.floor(0,0,12.80,4,1,6.40,2,true);
  south.floor(-11.20,-1.28,15.04,3,2,6.40,1);
  // The eastern produce exchange and the first storehouse share a high
  // conveyor. The lower opening still points along the street to the crane.
  const intake=frontage(api,freight,-59.84,0,'z',1);
  intake.floor(0,0,16.64,6,1,7.04,0,true);
  intake.pier(-12.16,0,16.64,1.92,2.56,10.24);
  intake.pier(12.48,0,16.64,1.92,2.56,14.40);
}

export function buildParkFrontages(api){
  // The laboratory and the ring's existing pump station carry a night shift
  // above the street. They end before the west transit guideway.
  const lab=frontage(api,utility,96,-10.24,'x',1);
  lab.pier(-10.24,-1.92,8.32);
  lab.pier(10.24,-1.92,8.32);
  lab.floor(-4.48,1.28,8.32,6,2,8.32,1,true);
  lab.floor(13.44,.32,8.32,2,3,7.68,0);
  lab.floor(-6.72,0,16.32,3,2,6.40,2);
  // The turn through the park gate opens south into the tree court. A
  // narrow plant gallery crosses only the northern carriageway.
  const station=frontage(api,utility,122.24,6.72,'x',-1);
  station.floor(0,0,7.68,4,2,5.76,0,true);
  station.floor(4.48,-.64,15.68,2,1,5.12,2,true);
  const link=frontage(api,utility,115.20,-2.24,'z',-1);
  link.floor(0,0,13.44,4,1,3.84,1,true);
  // Keep the park and frontage walk open. The vertical cores land on
  // municipal lots east of the outer walk. Only upper floors reach back
  // above the walk. Gaps at driveways align to the cistern entrances.
  for(const [z,bays,upperBays,rise,shift] of [
    [-33.28,5,3,3,-2.24], [21.76,6,4,4,4.48], [51.84,5,3,2,-2.24], [70.40,3,2,3,2.24]
  ]){
    const row=frontage(api,utility,140.80,z,'z',-1);
    const shoe=(bays-1)*pitch*.46;
    row.pier(-shoe,-1.92,6.40);
    row.pier(shoe,-1.92,6.40);
    // The occupied shift rooms sit behind the arcade line. The remainder
    // of each frontage is an open delivery slot between the existing tanks.
    row.floor(-Math.sign(shift)*pitch/2,-1.60,.32,bays-2,1,3.84,rise);
    row.floor(0,.32,6.40,bays,2,7.68,upperBays);
    row.floor(shift,-1.60,14.40,upperBays,rise,7.04,rise);
  }
}
