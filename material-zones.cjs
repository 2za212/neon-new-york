'use strict';

// These zones are authored in the model's world coordinates. Material decisions
// follow structures, room modules and floor bands, so a single window or panel
// keeps one finish across all of its quarter-metre surface voxels.
const M = {
  warmConcrete:0, coolConcrete:1, ceramic:2, gunmetal:3, copper:4,
  verdigris:5, blueGlass:6, amberGlass:7, asphalt:8, paving:9,
  hazard:10, gravel:11, redSteel:12, blueSteel:13, darkPanel:14, neon:15
};
const white=[1,1,1];
const offwhite=[.95,.96,.94];
const cool=[.87,.94,1];
const warm=[.95,.94,.90];
const muted=[.86,.89,.91];

function surface(material,tint=white,emission=0) {
  return {material,tint,emission};
}
function moduleValue(a,b,c=0) {
  let n=Math.imul(a+113,1597334677)^Math.imul(b+337,3812015801)^Math.imul(c+73,1103515245);
  n=Math.imul(n^(n>>>16),2246822519);
  return ((n^(n>>>13))>>>0)/4294967296;
}
function normalFace(face) {
  if(Number.isInteger(face))return face;
  if(Array.isArray(face)) {
    if(face[1])return face[1]>0?3:2;
    if(face[0])return face[0]>0?1:0;
    return face[2]>0?5:4;
  }
  if(face&&typeof face==='object') {
    if(face.y)return face.y>0?3:2;
    if(face.x)return face.x>0?1:0;
    return face.z>0?5:4;
  }
  return ({'-X':0,'+X':1,'-Y':2,'+Y':3,'-Z':4,'+Z':5,
    left:0,right:1,bottom:2,top:3,back:4,front:5})[face]??5;
}
function windowFinish(x,y,z,face,building) {
  const axis=face<2?z:x;
  const period=building==='east'?5.4:building==='front'?4.2:3.6;
  const level=Math.floor((y-(building==='east'?6:building==='west'?8.4:0)+.22)/period);
  let bay;
  if(building==='west') {
    const cx=-28.2-Math.floor(level/3)*1.2;
    const cz=-27-Math.floor(level/4)*.6;
    const width=level<9?20.4:19.2-Math.floor((level-9)/2)*1.2;
    const count=Math.floor((width-2.4)/4.2);
    bay=face<2?Math.round((z-cz)/4.8+1.5):Math.round((x-cx)/4.2+(count-1)/2);
  } else if(building==='east') {
    const cx=33+(level%3-1)*1.2;
    const cz=-29.4-Math.floor(level/3)*1.2;
    bay=face<2?Math.round((z-cz)/4.8+1.5):Math.round((x-cx)/4.2+2);
  } else {
    bay=Math.floor((axis+1.8)/4.2);
  }
  const seed=building==='west'?11:building==='east'?23:building==='front'?37:53;
  // Occupied lights form small neighbouring room groups on a minority of floors.
  // The facade remains a dark continuous field around these few grouped accents.
  const pair=Math.floor(bay/2),floorPair=Math.floor(level/2);
  const floorOccupied=moduleValue(floorPair,seed,19)>.76;
  const occupied=floorOccupied&&moduleValue(pair,floorPair,seed)>.48;
  if(!occupied)return surface(M.blueGlass,[.43,.54,.65],0);
  const amber=building==='east'||building==='front'&&pair%3===0;
  const strength=moduleValue(pair,floorPair,seed+61);
  return surface(amber?M.amberGlass:M.blueGlass,amber?[.94,.89,.78]:[.74,.88,.96],Math.round(12+strength*16));

}
function housingFinish(x,y,z,kind,face,cx,cz,isMid) {
  const side=cx<0?1:-1;
  const top=face===3;
  // Each block has one permanent wall finish, across every stacked room and trim.
  const wall=isMid?M.coolConcrete:M.warmConcrete;
  const wallTint=isMid?[.86,.89,.91]:cx<0?[.94,.91,.85]:[.92,.90,.85];
  const isSign=Math.abs(x-(cx+side*12))<1.85&&Math.abs(z-(cz+(isMid?-.6:2.4)))<1.95&&y>5.5&&y<19;
  if(isSign) {
    if(kind==='trim'&&face<2)return surface(M.neon,cx<0?[.58,.94,.90]:[.93,.82,.64],58);
    if(kind==='metal')return surface(M.gunmetal,muted);
  }
  if(kind==='recess') {
    if(y<3.2||top)return surface(M.darkPanel,[.71,.77,.80]);
    return windowFinish(x,y,z,face,'front');
  }
  if(kind==='metal') {
    // Rust and old paint are confined to two grounded utility pockets; railings,
    // galleries, signs and upper-floor services stay charcoal throughout.
    const pipeFoot=y<4.2&&Math.abs(x-(cx+side*10.8))<1.8&&z<cz-2.4;
    const serviceBox=y>1.0&&y<3.2&&Math.abs(x-(cx-6))<2.4&&Math.abs(z-(cz+6))<2.4;
    if(pipeFoot)return surface(M.copper,[.73,.75,.72]);
    if(serviceBox)return surface(cx<0?M.redSteel:M.verdigris,[.70,.77,.75]);
    return surface(M.gunmetal,[.79,.85,.90]);
  }
  if(top&&y>12.5&&kind==='body')return surface(M.gravel,[.81,.84,.85]);
  if(kind==='base')return surface(wall,[.83,.85,.85]);
  return surface(wall,wallTint);
}

function classifySurface(x,y,z,kind,face=5) {
  face=normalFace(face);
  const top=face===3,side=face!==2&&face!==3;
  const absX=Math.abs(x);

  // Asphalt is confined to the road geometry, with a separate stone pavement.
  if(kind==='road')return surface(M.asphalt,[.91,.94,.96]);
  if(y<-.55)return surface(kind==='metal'?M.gunmetal:M.coolConcrete,[.74,.79,.83]);
  if(y<.45) {
    if(kind==='trim'&&((absX<8.7&&z>16&&z<30)||(absX<.5&&z<16)))return surface(M.ceramic,[.91,.88,.74]);
    if(kind==='recess')return surface(M.gunmetal,[.53,.60,.65]);
    if(kind==='metal'&&absX<9)return surface(M.asphalt,[.72,.79,.84]);
    return surface(top?M.paving:M.coolConcrete,top?[.91,.91,.86]:muted);
  }

  // Passenger cars use blue glass, a pale ceramic shell and a charcoal lower band.
  const train=x>-68&&x<-37&&z>-4.65&&z<-1.35&&y>9.35&&y<11.9;
  if(train) {
    if(kind==='recess')return surface(M.blueGlass,[.73,.90,1],30);
    if(kind==='body'&&side&&y<10.35)return surface(M.gunmetal,[.74,.82,.88]);
    if(kind==='body'||kind==='trim')return surface(M.ceramic,offwhite);
    return surface(M.gunmetal,[.73,.79,.86]);
  }
  // Hazard markings identify the actual stair landing and beam ends, not the full line.
  const rail=z>-7.1&&z<1.1&&y>7.45&&y<10.3;
  if(rail) {
    const edge=Math.abs(z+3)>2.75;
    const atLanding=Math.abs(x-14.2)<1.85&&z>-.75;
    const beamEnd=absX>81.4;
    if(edge&&(atLanding||beamEnd)&&y>8.85&&y<9.8&&(kind==='base'||kind==='trim'))return surface(M.hazard,offwhite);
    if(kind==='base')return surface(top?M.gravel:M.coolConcrete,[.82,.86,.85]);
    if(kind==='trim'&&y>8.5&&y<8.85)return surface(M.gunmetal,[.83,.89,.93]);
    return surface(kind==='recess'?M.darkPanel:M.gunmetal,muted);
  }
  if(Math.abs(z+3)<2.5&&y<7.8&&kind==='base')return surface(M.coolConcrete,[.91,.93,.93]);
  if(x>12.6&&x<15.8&&z>-.8&&z<15.8&&y<10.5) {
    if(top&&(kind==='trim'||kind==='base')&&(y<.92&&z>13.8||y>8.65&&z<.75))return surface(M.hazard,offwhite);
    return surface(kind==='base'?M.coolConcrete:M.gunmetal,muted);
  }
  const bridge=Math.abs(z+35)<2.25&&absX<25.8&&y>16.2&&y<22.6;
  if(bridge) {
    if(kind==='trim'&&y>19.0)return surface(M.gunmetal,[.80,.87,.91]);
    if(kind==='base'&&top)return surface(M.paving,[.80,.85,.88]);
    return surface(M.gunmetal,muted);
  }

  // Large information sign and the paired avenue sign blades are cyan light boxes.
  if(kind==='trim'&&y>15.05&&y<19.0&&Math.abs(x)<8.0&&z>12.5&&z<13.1&&side)
    return surface(M.neon,[.68,1,1],120);
  if(kind==='trim'&&absX>16.0&&absX<17.2&&Math.abs(z+9.4)<2.0&&y>9.4&&y<20.8&&face<2)
    return surface(M.neon,[.64,1,.94],100);

  // Main west highrise: pale fired ceramic cassettes and dark blue service ribs.
  const west=x>-55&&x<-9&&z>-49&&z<-6&&y>5;
  if(west) {
    const sign=x>-25.3&&x<-18.8&&z>-12.4&&z<-9.8&&y>28.0&&y<45.0;
    if(sign&&kind==='trim'&&face>=4)return surface(M.neon,[.58,1,.98],110);
    if(kind==='recess')return side?windowFinish(x,y,z,face,'west'):surface(M.darkPanel,cool);
    if(kind==='metal')return surface(y<13?M.gunmetal:M.blueSteel,[.78,.90,1]);
    if(kind==='base')return surface(M.coolConcrete,[.83,.89,.92]);
    if(top&&y>65&&kind==='body')return surface(M.ceramic,[.93,.97,1]);
    return surface(kind==='trim'?M.ceramic:M.coolConcrete,kind==='trim'?[.92,.96,.98]:[.89,.94,.97]);
  }
  // East megablock: one warm-grey concrete volume, with charcoal galleries and ledges.
  const east=x>14&&x<53&&z>-51&&z<-8&&y>4.5;
  if(east) {
    if(kind==='recess')return side?windowFinish(x,y,z,face,'east'):surface(M.darkPanel,muted);
    if(kind==='metal')return surface(M.gunmetal,[.80,.84,.86]);
    if(kind==='trim')return surface(M.gunmetal,[.79,.82,.82]);
    if(kind==='base')return surface(M.coolConcrete,[.85,.87,.83]);
    if(top&&y>54)return surface(M.gravel,warm);
    return surface(M.warmConcrete,[.94,.94,.91]);
  }

  if(x>-55.5&&x<-24&&z>31&&z<56.6)return housingFinish(x,y,z,kind,face,-39.6,42.6,false);
  if(x>24&&x<56&&z>31&&z<56.6)return housingFinish(x,y,z,kind,face,40.2,42.6,false);
  if(x>-67&&x<-36&&z>-.1&&z<17)return housingFinish(x,y,z,kind,face,-51,7.2,true);
  if(x>34&&x<65&&z>-.1&&z<17)return housingFinish(x,y,z,kind,face,49.2,7.2,true);

  // A blue-grey background unifies the rear skyline into a subordinate layer.
  const rear=z<-49||absX>63&&z<0;
  if(rear) {
    if(kind==='recess')return side?windowFinish(x,y,z,face,'rear'):surface(M.darkPanel,muted);
    if(kind==='metal')return surface(M.gunmetal,[.72,.80,.87]);
    if(top&&y>33&&kind!=='trim')return surface(M.gravel,[.79,.85,.88]);
    return surface(M.coolConcrete,kind==='trim'?[.79,.85,.90]:[.77,.84,.90]);
  }

  // Small cabinets, street furniture, kiosks and vehicles use the same city kit.
  if(kind==='recess') {
    const sign=absX>12.8&&absX<14.3&&Math.abs(z-43)<.6&&y>2.25&&y<3.8;
    return sign?surface(M.neon,[.68,1,.91],72):surface(M.darkPanel,[.70,.82,.91]);
  }
  if(kind==='metal') {
    return surface(M.gunmetal,[.86,.91,.95]);
  }
  if(kind==='trim') {
    if(y>6.5&&y<7.2&&absX<13&&absX>9)return surface(M.neon,[1,.96,.78],95);
    return surface(M.ceramic,offwhite);
  }
  if(kind==='base')return surface(top?M.paving:M.coolConcrete,[.87,.90,.90]);
  if(y<3.6&&absX>14&&absX<20&&z>54&&z<62)return surface(M.gunmetal,[.77,.85,.90]);
  return surface(M.coolConcrete,[.91,.94,.96]);
}

module.exports={classifySurface};
