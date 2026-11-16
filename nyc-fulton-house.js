import {furnishFultonCommons} from './nyc-fulton-commons.js';
// Metres, Y up. 3B is a double-height apartment in the existing west frontage.
// Local -Z (the three brick windows) faces world +X, across Market Avenue.
export const fulton={
  origin:[-14.92,7.36,70],rotation:-Math.PI/2,
  street:[-9.55,.36,76.12],landing:[-18.32,7.36,75.72],liftX:-21.12,liftZ:76.12
};

export function buildFultonHouse({B,C,label,surface,hallLight}){
  const [cx,floor,cz]=fulton.origin,front=cx+4.27,back=front-14,north=cz-5.07,party=cz+4.96,south=78.12;
  const ground=fulton.street[1],mid=4.16,upper=12.90,roof=19.36;
  function solid(mat,x1,x2,y1,y2,z1,z2,id){
    const args=[(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,x2-x1,y2-y1,z2-z1];
    B(mat,...args);C(...args,'fulton/'+id);
  }
  // Wall mass stops at the actual apartment and the public hall. Its three
  // windows are the authored openings in the GLB, not lit cards on a solid box.
  solid('brick',back,front,ground,floor-.01,north,party,'lower-units');
  solid('brick',back,cx-4.46,floor,upper,north,party,'rear-units');
  solid('brick',back,front,upper,roof,north,south,'upper-units');
  C(cx,floor+2.62,cz,8.60,5.24,9.77,'3B'); // outside motor only
  // Only the sequenced lift can occupy the shaft. Keep the walking motor's
  // boundary while leaving the volume between the two stops open for the car.
  C((back-22.52)/2,(ground+upper)/2,(party+south)/2,-22.52-back,upper-ground,south-party,'fulton/lift-shaft');
  B('metal',back+.06,(ground+upper)/2,(party+south)/2,.12,upper-ground,south-party);
  for(let j=0;j<8;j++){
    const y=3.62+j*.42;
    B(j%3===0?'districtWarm':'districtZinc',-22.55,y,76.16,.043,.074,1.38);
  }
  for(const z of [party+.025,south-.025])B('metal',(back-22.52)/2,(ground+upper)/2,z,-22.52-back,upper-ground,.05);
  solid('brick',-22.52,front,ground,upper,south-.18,south,'south-party-wall');
  for(const level of [ground,floor]){
    solid('districtSlab',-22.52,front,level-.18,level,party,south,'hall-deck');
    surface(-22.52,front,party,south,level);
    solid('districtPlaster',-22.52,front,level+2.94,level+3.14,party,south,'hall-ceiling');
    // Apartment-side partitions enclose the stairs/lift hall on both levels.
    solid('districtPlaster',-22.52,front,level,level+2.94,party-.03,party+.10,'hall-wall');
    furnishFultonCommons({B,C,label},level,level===floor,party+.10,south-.18);
    hallLight(-20.32,level+2.54,76.17);
    hallLight(-13.68,level+2.54,76.17);
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
  solid('brick',-22.52,front,ground+3.14,floor-.18,party,south,'second-floor');
  solid('brick',-22.52,front,floor+3.14,upper,party,south,'landing-head');
  for(const x of [-18.32,-20.70]){
    B('districtIron',x,floor+1.15,party+.15,1.29,2.30,.14);
    B('districtOak',x,floor+1.08,party+.244,1.06,2.15,.07);
    B('districtZinc',x-.39,floor+1.02,party+.30,.07,.21,.07);
    label(x,floor+1.68,party+.30,.46,.23,x===-18.32?'3B':'3A','RESIDENT','#e3c99a');
  }
  // Clear street door, glazed landing end, and a bank of apartment mailboxes.
  for(const z of [party+.12,south-.23])
    solid('districtIron',front-.12,front+.12,ground,ground+2.64,z-.11,z+.11,'doorpost');
  solid('districtIron',front-.14,front+.30,ground+2.49,ground+2.85,party,south,'transom');
  label(front+.30,ground+2.66,76.18,2.05,.32,'FULTON / 07','APARTMENTS','#e7c893',Math.PI/2);
  label(front+.12,5.53,75.88,2.42,.83,'FULTON 07','SIGNAL HOUSE  /  LOFTS','#d8b685',Math.PI/2);
  solid('brick',front-.20,front,floor,floor+.98,party,south,'landing-sill');
  solid('districtGlass',front-.08,front,floor+.98,floor+2.94,party,south,'landing-glass');
  B('districtIron',front+.035,floor+1.95,76.19,.11,1.94,.09);
  surface(front,-9.2,party,south,ground);B('paver',(front-9.2)/2,ground-.08,(party+south)/2,-9.2-front,.16,south-party);
  for(const y of [ground+1.74,mid+1.48,upper+1.42,upper+4.63]){
    for(const z of [66.16,68.55,71.06,73.6]){
      B('districtIron',front+.07,y,z,.15,1.99,1.40);
      B((z===71.06||y===mid+1.48)?'warmWindow':'glass',front+.158,y,z,.035,1.72,1.20);
      B('districtIron',front+.19,y,z,.07,1.80,.058);
      B('districtIron',front+.19,y+.19,z,.07,.065,1.20);
      B('trim',front+.13,y-.99,z,.36,.14,1.55);
    }
  }
  for(const y of [mid-.12,floor-.12,upper+.02,roof+.08]){
    B('trim',front+.04,y,(north+south)/2,.40,.22,south-north+.08);
  }
  // Reface only the exterior leaves in the city's lit brick. Cut back each
  // course to the three existing jambs so the room is visible through them.
  const windows=[cz-3.56,cz-1.76,cz+.04];
  for(const [low,high,half] of [[0,.98,0],[.98,3.55,.76],[3.55,3.78,.60],[3.78,3.99,.45],[3.99,4.12,.31],[4.12,upper-floor,0]]){
    let end=north;
    function pier(a,b){B('brick',front+.31,floor+(low+high)/2,(a+b)/2,.13,high-low,b-a);}
    if(half)for(const z of windows){pier(end,z-half);end=z+half;}
    pier(end,party);
  }
  for(const z of windows){
    B('stone',front+.36,floor+.91,z,.30,.14,1.68);
    B('trim',front+.34,floor+4.13,z,.20,.14,.84);
  }
  // Fire-escape landings occupy the service bay beside the residential windows.
  for(const y of [mid+.18,floor+.22,upper+.18,upper+3.36]){
    B('districtIron',front+.80,y,73.0,1.22,.13,2.85);
    B('districtIron',front+1.38,y+.93,73.0,.07,.08,2.90);
    for(let j=0;j<8;j++)B('districtZinc',front+1.38,y+.48,71.68+j*.37,.045,.90,.045);
  }
  for(const z of [73.80,74.22])B('districtIron',front+1.42,10.11,z,.065,13.9,.065);
  for(let y=3.3;y<17;y+=.32)B('districtZinc',front+1.43,y,74.01,.065,.042,.47);
  solid('roof',back-.14,front+.16,roof,roof+.32,north-.14,south+.14,'roof');
  for(const z of [north+.12,party-.08])B('districtIron',front+.14,9.83,z,.18,18.9,.16);
}
