import {PointLight} from 'three';
import {premises,lotPoint,lowerLanes} from './nyc-lower-block-plan.js';
import {clothBridge,dockShed,freightCrane,coldLine} from './nyc-district-workyards.js';
import {streetSection,marketRoof,ticketGallery,coveredEdges} from './nyc-district-street-edges.js';
import {mapPlan} from './nyc-map-plan.js';
import {housingBond} from './nyc-housing-bond.js';

// Street-facing edge of each occupied wing. The carriageway and the original
// pedestrian arcade run on opposite sides of the ground-floor premises.
const fronts=[
  // x, z, street-facing yaw, frontage, lower depth, distance back to host, use
  [-4.50,34,90,13.4,2.0,7.6,'records'],[4.60,24,-90,12.8,2.0,7.0,'food'],
  [-4.72,18,90,5.8,1.8,7.3,'exchange'],[4.8,43,-90,8.4,1.8,7.4,'home'],
  [-4.65,-38.5,90,10,1.9,7.3,'repair'],[4.8,-16,-90,9.6,2,7.6,'home'],
  [-22,-4.85,0,16.4,2.0,6.8,'repair'],[24,4.6,180,17.4,1.9,7.1,'food'],
  [-68,-5.0,0,14.2,2.3,7.4,'freight'],[-91,4.9,180,16,2.2,7.2,'freight'],
  [-107,-5.35,0,11,2.1,7.5,'repair'],[-118,5.55,180,10,2.3,6,'freight'],
  [-79.0,18,-90,12,2.1,7.2,'freight'],[-96.1,-17,90,12,2,6.8,'repair'],
  [-4.55,62,90,12.5,1.9,7.2,'cloth'],[4.75,72,-90,11,1.9,7.1,'food'],
  [-4.65,99,90,13.8,2.1,7.5,'records'],[4.75,113,-90,14.2,1.9,6.1,'cloth'],
  [4.65,140,-90,11.6,2.1,7.2,'food'],[-25,88,180,15,2.0,6.8,'cloth'],
  [-33.4,124,0,13.4,2.0,6.8,'repair'],[40.8,79.5,0,11.6,1.8,5.0,'cloth'],
  [-5.35,-79,90,7.7,1.8,6.3,'exchange'],[5.1,-98,-90,11.2,2,6,'exchange'],
  [-19,-90.2,0,14.7,1.9,6,'food'],[33,-81.7,180,15.4,1.9,6.2,'exchange'],
  [62.2,-138,-90,17.5,2,7.8,'exchange'],[-41.0,-153,90,19.8,2.5,8,'home'],
  [73,-90.1,0,10.8,1.9,6.5,'repair'],[48,-123.2,0,8.5,1.8,5.8,'exchange'],
  // Park life stays at the perimeter. Openings at z24, 50.5 and 68 keep
  // the cross-paths and wetland boardwalk connected to their street.
  [135.5,25,-90,16,3.8,11.2,'depot'],[135.7,49,-90,22,4.4,11.8,'home'],
  [135.4,72,-90,16,3.8,11.2,'depot'],[128.0,32,90,10.2,2.5,5.6,'depot'],
  [128.1,57.6,90,9.8,2.4,5.1,'food'],[118.2,-4.9,0,18,2.6,8,'depot'],
  [121,8.7,180,11.0,1.8,4.8,'exchange'],[91,4.6,180,14.2,1.9,6.2,'repair'],[62.0,37,-90,13.5,2.2,7.5,'depot'],
  [62.4,66,-90,11.0,2,7.1,'depot'],[94.5,88.7,180,14.1,2.2,6.5,'home']
];
// Hue and structural pitch distinguish cold stores, rented rooms and workshops.
const uses={
  records:['basaltShell',0x596778,0xdca96e,'warmWindow',3.2,'试听寄售'],
  food:['ceramicShell',0xb67a5c,0xfaca87,'warmWindow',2.56,'夜班灶间'],
  repair:['titaniumSkin',0x667b80,0x92ded1,'coolWindow',2.88,'快修工位'],
  freight:['titaniumSkin',0x637a85,0x9dc7c9,'coolWindow',3.84,'货运交接'],
  cloth:['brickBrown',0xa06c71,0xeea8b0,'warmWindow',3.2,'布行夜市'],
  home:['basaltShell',0x8b817d,0xd4ba90,'warmWindow',2.56,'楼上住户'],
  exchange:['ceramicShell',0x7b8791,0xabccd9,'coolWindow',3.2,'街坊票号'],
  depot:['titaniumSkin',0x638783,0x94d5bf,'coolWindow',3.52,'环线夜班'],
};
const windowUse={records:'roomRecords',food:'roomFood',repair:'roomRepair',freight:'roomStock',cloth:'roomCloth',
  home:'roomHome',exchange:'roomOffice',depot:'roomStock'};
const serviceRoom={records:'roomStock',food:'roomKitchen',repair:'roomSupplies',freight:'roomLoading',cloth:'roomFabricStore',
  home:'roomKitchen',exchange:'roomSupplies',depot:'roomLoading'};
function frame(api,x,z,yaw){
  const c=Math.cos(yaw),s=Math.sin(yaw),P=(u,y,v)=>[x+c*u+s*v,y,z-s*u+c*v];
  function B(mat,u,y,v,w,h,d,col){api.box(mat,...P(u,y,v),w,h,d,col,yaw,null,true);}
  function C(u,y,v,w,h,d){
    // Axis-aligned runs need one solid. On oblique streets use short strips:
    // an enclosing box over the whole frontage would cut across the lane.
    const steps=Math.abs(c*s)<.001?1:Math.ceil(w/.96),step=w/steps;
    for(let i=0;i<steps;i++)api.collider(...P(u-w/2+(i+.5)*step,y,v),
      Math.abs(c)*step+Math.abs(s)*d,h,Math.abs(s)*step+Math.abs(c)*d);
  }
  const bond=housingBond(api.materials,B,api.panel,P);
  return {B,C,P,bond};
}
function roomFront(f,u,base,v,w,h,d,use,seed,rooms=[windowUse[use],serviceRoom[use]]){
  const [wall,hue,light,glass,pitch]=uses[use],{B,C,bond}=f;
  // Face at v; the opaque rear is recessed so the jambs cast real shadows.
  B(wall,u,base+h/2,v-d/2-.15,w,h,d-.30,hue);
  C(u,base+h/2,v-d/2,w,h,d);
  B('metal',u,base+.21,v-.12,w,.42,.34,0x465159);
  const bays=Math.max(2,Math.round(w/pitch)),span=w/bays;
  for(let i=0;i<bays;i++){
    const xx=u-w/2+(i+.5)*span,dim=(i+seed)%5===1;
    B('metal',xx,base+h*.54,v-.18,span-.18,h*.68,.26,0x344653);
    B(dim?'glass':rooms[(i+seed)%rooms.length],xx,base+h*.55,v-.035,span-.46,h*.49,.14,dim?0x8499a0:light);
    B('metal',xx,base+h*.69,v+.054,span-.40,.12,.14,0x454d52);
    B('trim',xx-span*.40,base+h*.54,v+.09,.20,h*.80,.38,0xb5b2a4);
    if(use==='freight'||use==='repair')for(let j=0;j<3;j++)
      B('metal',xx,base+h*(.32+j*.10),v+.135,span-.39,.13,.12,0x728186);
  }
  bond('titaniumSkin',u,base+h-.20,v-.26,w+.24,.40,.82,0xb6b2aa,1,seed,.32);
  B('metal',u,base+h-.47,v+.21,w-.20,.12,.40,0x536468);
  B(glass,u,base+h-.55,v+.33,w*.70,.09,.12,light);
}
// A shelter return is occupied at eye height. A continuous upper room joins
// it to the main building across a public sidewalk with 4.3m clear below.
function arcade(api,clear,site,index){
  const [x,z,deg,w,d,reach,use]=site,f=frame(api,x,z,deg*Math.PI/180);
  const pitch=uses[use][4],bays=Math.max(2,Math.round(w/pitch)),step=w/bays;
  const openBay=index%2?0:bays-1;
  let occupied=0;
  for(let i=0;i<bays;i++){
    if(i===openBay)continue;
    const u=-w/2+(i+.5)*step;
    if(!clear(f,u,-d/2,step-.10,d))continue;
    roomFront(f,u,.20,0,step-.12,3.28,d,use,index+i);
    occupied++;
  }
  const underside=4.36+(index%3)*.48;
  const section=use==='freight'||use==='depot'?3.20:2.88;
  const recessed=x<-44||z< -52||z>52;
  roomFront(f,0,underside,recessed?-.80:.48,w,section,reach+(recessed?-.80:.48),use,index);
  if(x<44)streetSection(f,x,z,w,underside);
  // Structural soffit ribs tie the overhang to the original street wall.
  for(let i=0;i<bays;i++)f.B('metal',-w/2+(i+.5)*step,underside-.15,-reach*.46,.48,.32,reach+.48,0x63747b);
  const [wall,hue,light,glass]=uses[use];
  // A load-bearing pier or stair return grounds the projecting end. At a
  // protected entrance the original sidewalk stays open under the span.
  const postU=-w/2+(openBay+.16)*step;
  if(clear(f,postU,-.76,.58,.72)){
    f.B('metal',postU,underside/2+.10,-.76,.55,underside-.20,.72,0x667577);
    f.C(postU,underside/2+.10,-.76,.55,underside-.20,.72);
    f.bond('ceramicShell',postU,.75,-.75,.80,1.10,.96,0x879999,1,index,.32);
    f.B(glass,postU,2.20,-.35,.13,1.46,.12,light);
  }
  if(index%3!==1)roomFront(f,w*.07,underside+section+.20,-.80,w*.76,section,reach-.72,use,index+2);
  // Projecting ends have occupied side windows, readable along the street.
  for(const side of [-1,1]){
    f.B(wall,side*(w/2-.28),underside+section*.52,-reach*.46,.58,section,reach*.92,hue);
    for(let j=0;j<3;j++){
      const v=-.60-j*(reach-1.2)/3;
      f.B(glass,side*(w/2+.015),underside+1.58,v,.12,1.38,.96,light);
      f.B('metal',side*(w/2+.09),underside+.88,v,.32,.17,1.30,0x808984);
    }
  }
  if(use==='home'||use==='cloth'){
    // Two projecting balconies alternate with deep laundry bays.
    for(const side of [-1,1]){
      const u=side*w*.26,wide=w*.28;
      f.bond('ceramicShell',u,underside+.46,.82,wide,.48,1.44,0x998880,1,index,.32);
      for(let j=0;j<3;j++)f.B('metal',u+(j-1)*wide*.42,underside+1.03,1.39,.14,.85,.16);
      f.B('metal',u,underside+1.44,1.39,wide,.12,.16);
    }
  }else if(use==='freight'||use==='depot'){
    for(const u of [-w*.35,w*.35]){
      f.B('metal',u,underside+2.1,.63,1.60,1.50,.80,0x6a7978);
      for(let j=-1;j<=1;j++)f.B('trim',u,underside+2.08+j*.38,1.12,1.50,.15,.22,0x9ead9d);
    }
  }
  if(index%3===0){
    const u=w*.36,y=underside-.70,v=.92;
    f.B('metal',u,y,v,.20,1.15,1.60,0x617576);
    for(const side of [-1,1]){
      const p=f.P(u+side*.116,y,v);
      api.sign(...p,1.50,.74,uses[use][5],'',use==='food'||use==='cloth'?'#ffc29e':'#8fdad5',deg*Math.PI/180+side*Math.PI/2);
    }
  }
  return occupied;
}
function laneExtensions(api){
  // Enlarge the low street buildings themselves. The door stays in its recess,
  // while the side room and upper inhabited bays take up the view down the lane.
  for(const [i,p] of premises.entries()){
    const front=p.depth/2,base=3.6+(p.floors-1)*2.88;
    const f=frame(api,p.x,p.z,p.yaw),use={home:'home',clinic:'exchange',mill:'cloth',
      food:'food',office:'exchange',freight:'freight'}[p.use];
    const side=i%2?1:-1,span=p.width*.47;
    // Raised front room above the entrance. Cell courses step out at each sill.
    const extension=p.depth<4.5?.72:1.25;
    const upper=p.use==='freight'?['roomStock','roomLoading']:['roomHome','roomKitchen'];
    if(p.z>=52&&p.z<94&&p.x< -64&&p.use==='mill')marketRoof(f,p.width,6.96);
    if(p.z<=-52&&p.z> -62&&p.x>=84){
      f.B('titaniumSkin',0,3.72,front+1.04,p.width+.32,.24,1.92,0x83b9ac);
      for(const u of [-p.width*.35,p.width*.35])f.B('ceramicShell',u,4.30,front+1.6,.28,1.44,.42,0xded2b1);
    }
    if(p.id==='roster'||p.id==='repair-home')ticketGallery(f,p.width,6.80);
    const loadingBay=['west-ice','scale','warrant','repair'].includes(p.id);
    if(loadingBay)dockShed(f,p);
    else roomFront(f,-side*p.width*.10,3.88,front+extension,p.width*.83,2.72,extension+1.15,use,i,upper);
    const tiers=p.floors>=4?2:1;
    for(let t=0;t<tiers;t++)
      roomFront(f,side*p.width*.12,base+.16+t*2.96,front-.72-t*.32,p.width*(.70-t*.10),2.80,p.depth*.70,use,i+2+t,upper);
    const u=side*(p.width/2-span/2);
    const annex=[serviceRoom[use],p.use==='clinic'?'roomClinic':use==='home'?'roomHome':'roomStock'];
    if(!loadingBay)roomFront(f,u,.22,front+.40,span,2.50,1.40,use,i,annex);
    if(p.id==='west-ice'||p.id==='scale')freightCrane(f,p.id==='scale'?13:15,base+4.16);
  }
}
function gallery(api,a,b,width,base,use){
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  const f=frame(api,(a[0]+b[0])/2,(a[1]+b[1])/2,-Math.atan2(dz,dx));
  if(use==='dyeGallery'){clothBridge(f,len,width,base,Math.round(width));return;}
  roomFront(f,0,base,width/2,len,2.50,width,use,3);
  const bays=Math.ceil(len/2.9),step=len/bays,mat=uses[use][3];
  for(let i=0;i<bays;i++){
    const u=-len/2+(i+.5)*step;
    f.B(mat,u,base+1.45,-width/2-.035,step-.48,1.12,.12,uses[use][2]);
    f.B('metal',u,base-.18,0,.44,.36,width+.25,0x637176);
  }
}
// Adjacent leases share party walls and a back stair. The shop occupies one end
// of the gap; the other end remains a covered passage to the rear court.
const joints=[
  ['west-ice','scale','freight'],['mess','gloves','food'],
  ['dye','cut','cloth'],['cut','loom','repair'],
  ['workers','stitch','home'],['canteen','bobbins','cloth'],
  ['loom','cloth','cloth']
];
function joinNeighbours(api){
  for(const [aId,bId,use] of joints){
    const a=premises.find(p=>p.id===aId),b=premises.find(p=>p.id===bId);
    let ends,len=Infinity;
    for(const l of [-1,1])for(const r of [-1,1]){
      const left=lotPoint(a,l*a.width/2,a.depth*.16),right=lotPoint(b,r*b.width/2,b.depth*.16);
      const span=Math.hypot(right[0]-left[0],right[1]-left[1]);
      if(span<len){len=span;ends=[left,right];}
    }
    const [l,r]=ends,mid=[(l[0]+r[0])/2,(l[1]+r[1])/2];
    let yaw=-Math.atan2(r[1]-l[1],r[0]-l[0]);
    if(Math.cos(a.yaw-yaw)<0)yaw+=Math.PI;
    const f=frame(api,...mid,yaw),height=use==='freight'?4.68:3.88;
    roomFront(f,0,height,1.18,len+.38,2.72,3.68,use,1);
    if(len>4.2){
      const w=Math.min(len-2.4,len*.55);
      roomFront(f,(len-w)/2,.21,.94,w,3.42,3.30,use,2);
    }
  }
}
// The retreat of the old boundary exposed the backs of the low shops. These
// occupied court buildings close the middle distance at the bends in the lane.
const courts=[
  [-105.2,-91.4,0,12.8,9.6,7,'repair','夜班冷机厂'],
  [-89.2,-101,0,12.8,9.6,10,'home','西仓联运宿舍'],
  [-73.2,-101,0,12.8,9.6,7,'exchange','旧仓运单总处'],
  [-90.8,-89.8,0,9.6,7.68,5,'freight','散冰转运库'],
  [-113,75.2,90,9.6,12.8,6,'cloth','梭机厂北楼'],
  [-97,88,180,12.8,9.6,8,'home','染工南里'],
  [-84.2,99.2,180,8,5.76,6,'cloth','样衣工场'],
  [150.2,12.4,-90,7.68,9.6,6,'depot','环线调度'],
  [151.8,22,-90,7.68,9.6,9,'home','站务轮班楼'],
  [151.8,31.6,-90,7.68,9.6,7,'repair','车辆检修楼'],
  [140.6,-18,180,8,5.76,7,'depot','调车信号所'],
  [95,-47.4,180,9.6,7.68,5,'home','东衡教工楼']
];
function courtBuilding(api,[x,z,deg,w,d,floors,use,title],index){
  const yaw=deg*Math.PI/180,f=frame(api,x,z,yaw),[wall,hue,lit,glass]=uses[use];
  let base=.20;
  for(let i=0;i<floors;i++){
    const recess=i>=floors-2?.96:0,h=i===0?3.68:2.88;
    roomFront(f,0,base,d/2-recess,w-2*recess,h,d-2*recess,use,i+index);
    for(let side of [-1,1]){
      for(let j=0;j<3;j++){
        const v=(j-1)*(d-2*recess)/3;
        f.B((i+j)%4===1?'glass':glass,side*(w/2-recess+.04),base+h*.54,v,.12,h*.44,d*.18,lit);
      }
      if(i%3===1)f.B('metal',side*(w/2-recess+.19),base+.46,-.28,.42,.32,d*.75,0x7b888b);
    }
    base+=h;
  }
  f.B(wall,w*.12,base+1.12,-d*.12,w*.56,2.24,d*.48,hue);
  const p=f.P(0,3.17,d/2+.34);
  api.sign(...p,w*.78,.64,title,'',use==='home'?'#ffbd91':'#a8d6d2',yaw);
  const [fx,,fz]=f.P(0,0,d/2);
  api.registerProperty?.('court-'+index,title,'街坊后院 / 临街入口',fx,fz,w,d,yaw);
}


export function buildStreetWalls(api,protectedPoints,scene,lights,moving){
  const {colliders}=api;
  // Snapshot existing obstacles; checking a whole building per bay per frame
  // would be needless. This index lives only during level construction.
  const cells=new Map(),cell=(x,z)=>Math.floor(x/8)+','+Math.floor(z/8);
  for(const b of colliders){
    if(b.min.y>3.55||b.max.y<.62)continue;
    for(let x=Math.floor(b.min.x/8);x<=Math.floor(b.max.x/8);x++)
      for(let z=Math.floor(b.min.z/8);z<=Math.floor(b.max.z/8);z++){
        const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(b);
      }
  }
  function clear(f,u,v,w,d){
    const corners=[f.P(u-w/2,0,v-d/2),f.P(u+w/2,0,v+d/2)];
    const x0=Math.min(corners[0][0],corners[1][0])-.18,x1=Math.max(corners[0][0],corners[1][0])+.18;
    const z0=Math.min(corners[0][2],corners[1][2])-.18,z1=Math.max(corners[0][2],corners[1][2])+.18;
    if(protectedPoints.some(([x,z])=>x>x0-.68&&x<x1+.68&&z>z0-.68&&z<z1+.68))return false;
    for(let x=Math.floor(x0/8);x<=Math.floor(x1/8);x++)
      for(let z=Math.floor(z0/8);z<=Math.floor(z1/8);z++)
        if((cells.get(x+','+z)||[]).some(b=>b.max.x>x0&&b.min.x<x1&&b.max.z>z0&&b.min.z<z1))return false;
    return true;
  }
  const groundBays=fronts.reduce((sum,site,i)=>sum+arcade(api,clear,site,i),0);
  coveredEdges(api,frame,mapPlan.roads,protectedPoints);
  laneExtensions(api);
  coldLine(api,frame,lowerLanes.find(r=>r.id==='weigh-road').shape.points,scene,moving);
  joinNeighbours(api);
  courts.forEach((site,i)=>courtBuilding(api,site,i));
  for(const [a,b,w,y,use] of [
    [[-107,63],[-93,59],2.24,5.82,'dyeGallery'],
    [[-98,77],[-85,62],3.84,6.32,'dyeGallery'],
    [[-86,82],[-71,68],3.20,7.04,'dyeGallery'],
    [[-70,90],[-70,68],2.24,6.04,'dyeGallery'],
    [[-80.6,41],[-86,23.2],2.56,8.32,'freight'],
    [[109,-59.68],[122,-59.55],2.56,6.72,'exchange'],
  ])gallery(api,a,b,w,y,use);
  // Spill comes from the occupied return or the gallery door. These lamps
  // join the existing distance-ranked budget on all quality settings.
  for(const [x,y,z,tint] of [
    [-104.5,3.0,-61.4,0x85d8d1],[-90.7,3.2,-72.6,0xffba85],
    [-93.1,3.1,74.6,0xffbd83],[-83,3.4,69.4,0xafbadd],
    [134.5,3.1,21.6,0x8ddbd3],[127.5,3.1,35.1,0xffc18c],
    [-4.4,3.2,30.5,0xffb588],[4.7,3.0,70.8,0xffae8b],
    [72.5,3.2,-89.7,0x83cbd6],[-87.5,3.4,5.4,0xf0af74]
  ]){
    const light=new PointLight(tint,72,9,2);
    light.position.set(x,y,z);light.userData.nightPower=72;scene.add(light);lights.push(light);
  }
  return {frontages:fronts.length,groundBays,partyWalls:joints.length,courtBuildings:courts.length};
}
