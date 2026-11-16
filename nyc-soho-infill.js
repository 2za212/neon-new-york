import * as T from 'three';
import {createDistrictKit} from './nyc-district-kit.js';

/** Street-wall and courtyard infill. This module occupies the empty blocks
 * with metre-scale volumes; all existing roads, routes and room entries stay.
 * It registers no roads and emits no independent prop meshes. */
export function addSoHoInfill(scene,api){
  const {box,beam,materials,colliders,surface,sign,rand=Math.random}=api;
  const k=createDistrictKit(scene,api),before=colliders.length;
  const own={boxes:0,beams:0,signs:0,surfaces:0},fixtures=[],lights=[],signs=[];
  const B=(...a)=>{own.boxes++;box(...a);},L=(...a)=>{own.beams++;beam(...a);};
  function C(x,y,z,w,h,d,id){const b=new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2));b.userData={sohoInfill:id};colliders.push(b);fixtures.push({id,min:b.min.toArray(),max:b.max.toArray()});return b;}
  function S(x0,x1,z0,z1,y){surface(x0,x1,z0,z1,y);own.surfaces++;}
  function label(x,y,z,w,h,title,subtitle,color='#a8ddd7',rotation=0){if(!sign)return;const m=sign(x,y,z,w,h,title,subtitle,color,rotation);if(m){m.material.emissiveIntensity=.80;signs.push(m);}own.signs++;}
  const iron='districtIron',zinc='districtZinc',oak='districtOak',cool='sohoDetailCyan',warm='sohoDetailAmber',pink='sohoDetailMagenta';
  const tint=(s=.08)=>new T.Color().setScalar(1-s/2+rand()*s);
  const definitions=[
    {id:'soho_infill_west_battery',x:-55.7,z:58.5,width:10,depth:7.3,floors:3,rot:Math.PI/2,title:'BATTERY / FIX',subtitle:'LOCAL DEVICES / WEST STREET',brick:'brickBrown',accent:'cool'},
    {id:'soho_infill_west_cloth',x:-55.7,z:69.3,width:10,depth:7.8,floors:4,rot:Math.PI/2,title:'THREAD / COMMONS',subtitle:'TAILOR / LOFTS',brick:'stone',accent:'warm'},
    {id:'soho_infill_west_electrics',x:-55.7,z:98.3,width:12,depth:7.8,floors:4,rot:Math.PI/2,title:'BOWERY / ELECTRIC',subtitle:'REPAIR / NEURAL PARTS',brick:'brick',accent:'cool'},
    {id:'soho_infill_west_habitat',x:-55.7,z:112.0,width:13.2,depth:7.3,floors:5,rot:Math.PI/2,title:'WEST / HABITAT',subtitle:'RESIDENTIAL / 18—26',brick:'brickBrown',accent:'warm'},
    {id:'soho_infill_west_paper',x:-55.7,z:141.5,width:10.8,depth:7.8,floors:3,rot:Math.PI/2,title:'PAPER / WORKSHOP',subtitle:'PRINT / SMALL EDITIONS',brick:'stone',accent:'warm'},
    {id:'soho_infill_west_laundry',x:-55.7,z:153.1,width:10,depth:7.3,floors:4,rot:Math.PI/2,title:'AFTER / LAUNDRY',subtitle:'WASH / RESTORE / ALL NIGHT',brick:'brick',accent:'cool'},
    {id:'soho_infill_east_noodle',x:66.8,z:140.6,width:8.4,depth:15,floors:4,rot:-Math.PI/2,title:'CANAL / NOODLE',subtitle:'KITCHEN / EAST LOOP',brick:'brickBrown',accent:'warm'},
    {id:'soho_infill_east_fabric',x:66.8,z:153.6,width:9.6,depth:15,floors:3,rot:-Math.PI/2,title:'FIBER / EXCHANGE',subtitle:'MATERIALS / CITY CO-OP',brick:'stone',accent:'cool'},
  ];
  const buildings=[];
  const exclusions=api.roadRegistry.pavingExclusions||(api.roadRegistry.pavingExclusions=[]);
  for(const d of definitions){
    const b=k.building(d),c=Math.cos(d.rot),s=Math.sin(d.rot);
    // Account for the kit's real shop apron when the shared road flush lays
    // sidewalks: one paving owner per square, including the side-street fronts.
    const p=b.front.P(0,.36,.65),w=Math.abs(c)*(d.width-.1)+Math.abs(s)*1.30,dep=Math.abs(s)*(d.width-.1)+Math.abs(c)*1.30;
    exclusions.push({minX:p[0]-w/2,maxX:p[0]+w/2,minZ:p[2]-dep/2,maxZ:p[2]+dep/2});
    const centre=b.front.P(0,0,-d.depth/2),ww=Math.abs(c)*d.width+Math.abs(s)*d.depth,dd=Math.abs(s)*d.width+Math.abs(c)*d.depth;
    buildings.push({id:d.id,bounds:{minX:centre[0]-ww/2,maxX:centre[0]+ww/2,minZ:centre[2]-dd/2,maxZ:centre[2]+dd/2},top:b.top,result:b});
    // Rooftop plant/air machinery and a raised parapet change the roofline at
    // middle distance, instead of spending this pass on more surface screws.
    const f=b.front,roof=b.top+.98,offset=d.width*.22;
    f.B('metal',offset,roof+.52,-d.depth*.54,1.62,.94,1.72,0xc1c8bc);
    f.C(offset,roof+.52,-d.depth*.54,1.62,.94,1.72,'roof-air-plant');
    for(let j=0;j<6;j++)f.B('rubber',offset-.61+j*.244,roof+.53,-d.depth*.54+.88,.055,.70,.035);
    if(d.floors>=4){
      // A substantial three-metre rooftop service cabin, staggered between
      // roofs, retains the local brick and cast-iron construction vocabulary.
      f.B(d.brick,-d.width*.23,roof+1.18,-d.depth*.68,2.8,2.36,2.25,tint());
      f.C(-d.width*.23,roof+1.18,-d.depth*.68,2.8,2.36,2.25,'roof-service-cabin');
      f.B(zinc,-d.width*.23,roof+2.42,-d.depth*.68,3.04,.15,2.49,0xb9c4b9);
    }
  }

  // The existing service alley x=-27 remains open below a real enclosed
  // second-storey link between the printing works and the old street wall.
  const bridge={id:'press-upper-link',minX:-30.75,maxX:-23.3,minZ:109.65,maxZ:113.55,underside:4.38,roofTop:7.38};
  B(iron,-27.025,4.50,111.6,7.45,.24,3.90);C(-27.025,4.50,111.6,7.45,.24,3.90,'press-link-floor');
  for(const z of [109.72,113.48]){
    B(zinc,-27.025,4.87,z,7.45,.48,.16);C(-27.025,5.76,z,7.45,2.76,.18,'press-link-wall');
    B('districtGlass',-27.025,6.06,z,7.18,1.75,.035);
    B(iron,-27.025,7.04,z,7.5,.14,.18);
    for(let x=-30.6;x<=-23.4;x+=.72)B(iron,x,6.02,z,.065,2.04,.13);
    B(cool,-27.025,4.95,z+(z<111?-1:1)*.10,6.8,.045,.035);
  }
  B(zinc,-27.025,7.25,111.6,7.68,.26,4.12);C(-27.025,7.25,111.6,7.68,.26,4.12,'press-link-roof');
  for(const x of [-30.4,-23.65])for(const z of [109.9,113.3])L(iron,[x,3.93,z],[x+(x<-27?-.38:.38),4.47,z],.14,.14);
  label(-27.025,5.59,113.61,4.8,.42,'PRESS / TRANSIT','UPPER SERVICE LINK','#a9ddd5');

  // A loading atrium is an occupied, twelve-metre courtyard volume, with a
  // sawtooth glazed roof, full posts, stock bays and overhead conveyor rails.
  // It sits behind x40; the public x31 promenade and its umbrellas remain clear.
  const atrium={id:'east-loading-atrium',bounds:{minX:40.0,maxX:49.8,minZ:101.2,maxZ:114.7},underside:4.6835,roofTop:5.4275,upperEnvelopeTop:5.53,roofColliderTop:5.435};
  for(const x of [40.25,49.55])for(const z of [101.5,107.95,114.4]){
    B('stone',x,.56,z,.54,.40,.54,0xb6bcaa);B(iron,x,2.52,z,.18,4.32,.18);C(x,2.52,z,.22,4.32,.22,'atrium-post');
    B(zinc,x,4.47,z,.37,.16,.37,0xb9c7bd);
  }
  for(const x of [40.25,49.55])B(iron,x,4.48,107.95,.18,.22,13.25);
  for(let z=101.35;z<114.6;z+=1.30){
    B(zinc,44.9,4.50,z,9.8,.16,.13);
    L(zinc,[40.0,4.58,z],[44.9,5.48,z],.10,.10);L(zinc,[44.9,5.48,z],[49.8,4.58,z],.10,.10);
  }
  for(const e of [-1,1])for(let i=0;i<4;i++){
    const x=44.9+e*(.62+i*1.225),y=5.39-i*.223;
    B('districtGlass',x,y,107.95,1.215,.075,13.25,0xd1e0d7);
    B(zinc,x,y+.038,107.95,.055,.085,13.25,0xb6c7bd);
    C(x,y,107.95,1.225,.09,13.25,'atrium-roof-panel');
  }
  for(const x of [41.0,48.8]){
    B(iron,x,3.94,107.95,.13,.14,12.3);B(warm,x,3.85,107.95,.10,.035,11.7);
  }
  for(const [x,z]of [[46.9,102.9],[47.2,108.0],[46.9,113.0]]){
    B(iron,x,.55,z,2.6,.30,1.6);B(oak,x,1.03,z,2.45,.66,1.5);C(x,.87,z,2.6,.96,1.6,'atrium-stock-bay');
    for(let i=0;i<5;i++)B('districtPaper',x-.9+i*.45,1.55,z,.39,.38,1.34,i%2?0xc3c8ad:0xacae91);
    B(zinc,x,1.79,z,2.53,.08,1.54);
  }
  label(40.02,4.32,108,5.4,.48,'CROSBY / GOODS','RECEIVING  ·  CITY CO-OP','#e0c6b2',-Math.PI/2);

  // A second market row and one tall fabric hall occupy the north side of the
  // existing market courtyard. The south approach [-42,74] -> [-34.6,70.2]
  // stays open; this also makes stalls read as a district rather than two props.
  const marketHall={id:'market-north-hall',bounds:{minX:-41.0,maxX:-28.7,minZ:54.6,maxZ:61.4},underside:4.185,roofTop:4.595,upperEnvelopeTop:4.6375};
  for(const x of [-40.6,-29.1])for(const z of [54.9,61.1]){
    B('stone',x,.54,z,.48,.36,.48,0xb5bea8);B(iron,x,2.23,z,.12,3.74,.12);C(x,2.23,z,.15,3.74,.15,'market-hall-post');
  }
  for(let i=0;i<6;i++){
    const z=55.05+i*1.20,y=4.25+(.5-Math.abs(i-2.5)/5)*.7;
    B(i%2?'districtCanvas':'sohoCanvas',-34.85,y,z,12.3,.13,1.26,0xbbc6b0);
    C(-34.85,y,z,12.3,.13,1.26,'market-hall-roof');
    B(zinc,-34.85,y+.08,z,12.5,.055,.055,0xbdcbc2);
  }
  for(const z of [54.65,61.36]){B(iron,-34.85,4.10,z,12.3,.15,.14);B(pink,-34.85,4.04,z,10.8,.04,.035);}
  for(const [x,z,w]of [[-37.8,57.5,3.8],[-32.0,57.5,3.9]]){
    B(iron,x,.59,z,w,.46,1.75);B(oak,x,1.18,z,w+.16,.10,1.85);C(x,.82,z,w+.16,.92,1.85,'market-new-counter');
    for(const e of [-1,1])B(zinc,x+e*(w/2-.15),1.89,z-.72,.065,2.0,.065);
    B(zinc,x,2.94,z-.72,w,.10,.10);
    for(let i=0;i<6;i++){
      B(oak,x-w*.40+i*w*.16,1.37,z,.47,.28,.97);B('leaf',x-w*.40+i*w*.16,1.59,z,.36,.22,.73,0xb0bf8e);
    }
    for(let i=0;i<8;i++)B('districtPaper',x-w*.4+i*w*.11,.70,z+.90,.25,.31,.06,0xd6c4a3);
  }
  label(-34.85,4.10,61.50,6.5,.48,'SPRING / NIGHT ARCADE','FOOD  ·  FIX  ·  EXCHANGE','#b2e7de');

  // At the final south cross street, two narrow two-storey returns fill the
  // former asphalt void. Their north walls start beyond z154.8, clear of the
  // z150 loop carriageway and its .31m-radius navigation checks.
  const southReturns=[];
  for(const e of [-1,1]){
    const x=e*17.325,z=157,w=13.35,d=4.4,top=e<0?7.8:8.7,id=e<0?'south-print-return':'south-fabric-return';
    B(e<0?'brickBrown':'brick',x,(.36+top)/2,z,w,top-.36,d,tint());C(x,(.36+top)/2,z,w,top-.36,d,id+'-core');
    B(zinc,x,top+.12,z,w+.20,.24,d+.20,0xc2c9bd);C(x,top+.12,z,w+.20,.24,d+.20,id+'-roof');
    for(let xx=x-w/2+.9;xx<x+w/2-.5;xx+=2.2){
      for(const yy of [2.05,5.6]){B(iron,xx,yy,154.74,1.5,2.12,.14);B(yy<3?'warmWindow':'glass',xx,yy,154.65,1.26,1.88,.035);B('trim',xx,yy-1.1,154.61,1.66,.15,.28,0xd0ccba);}
    }
    // The side facing the avenue has several tall bays and deep concrete piers.
    const fx=e*10.60;
    for(const zz of [155.7,158.25]){B(iron,fx,2.02,zz,.14,2.9,1.9);B('warmWindow',fx-e*.085,2.02,zz,.03,2.65,1.65);}
    for(const zz of [154.88,157,159.12])B('trim',fx,1.95,zz,.32,3.18,.25,0xbcc6b3);
    label(x,3.63,154.49,7.8,.48,e<0?'CANAL / PRINT WORKS':'MERCER / FABRIC CO-OP','SOUTH LOOP / LOCAL INDUSTRY',e<0?'#ddb8cb':'#9edbd4',Math.PI);
    southReturns.push({id,bounds:{minX:x-w/2,maxX:x+w/2,minZ:154.8,maxZ:159.2},height:top});
  }

  // Canal Exchange straddles the two industrial roof returns. The open street
  // under the transfer deck keeps the avenue continuous up to its boundary.
  const relayZ=157;
  function structural(mat,x,y,w,h,d,id){
    B(mat,x,y,relayZ,w,h,d);
    C(x,y,relayZ,w,h,d,'canal-relay-'+id);
  }
  for(const side of [-1,1]){
    const x=side*15.5,base=southReturns[side<0?0:1].height+.24;
    structural('brickBrown',x,(base+22)/2,7.3,22-base,4.1,'pylon');
    for(const dx of [-2.95,0,2.95]){
      B(zinc,x+dx,(base+22)/2,154.88,.31,22-base,.32);
      B('coolWindow',x+dx+.65,15.4,154.90,.40,9,.20);
    }
    for(const y of [12.4,18.3,21.8])B(iron,x,y,relayZ,7.8,.45,4.5);
  }
  structural(iron,0,20.9,31,1.15,3.6,'transfer-deck');
  for(const face of [-1,1]){
    const z=relayZ+face*1.62;
    for(let x=-14;x<14;x+=3.5){
      L(zinc,[x,21.52,z],[x+1.75,24.36,z],.20,.20);
      L(zinc,[x+1.75,24.36,z],[x+3.5,21.52,z],.20,.20);
    }
    B(iron,0,24.43,z,31,.33,.40);
    B(cool,0,20.76,z+face*.24,27,.14,.14);
  }
  // The broken octagonal signal dial leaves the sky visible through its centre.
  const dialY=31.5;
  for(let i=0;i<8;i++){
    const a=(i+.5)*Math.PI/4,b=a+Math.PI/4;
    const p=[Math.cos(a)*7.4,dialY+Math.sin(a)*7.4,relayZ];
    const q=[Math.cos(b)*7.4,dialY+Math.sin(b)*7.4,relayZ];
    L(iron,p,q,1.02,1.02);
    for(const face of [-1,1]){
      const span=t=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,relayZ+face*.57];
      L(i===6?warm:cool,span(.07),span(.93),.48,.30);
    }
  }
  for(const side of [-1,1]){
    L(zinc,[side*9.0,21.52,relayZ],[side*5.6,26.8,relayZ],.48,.48);
    B(zinc,side*2.6,29.2,relayZ,.34,9.5,.48);
  }
  structural(iron,0,32.15,1.3,21.3,1.35,'spindle');
  B(warm,0,33.1,156.27,.44,15.3,.20);
  B(cool,0,43.5,relayZ,.38,1.48,.38);
  label(0,21.86,155.05,9.4,1.30,'CANAL EXCHANGE','MANHATTAN  /  RELAY 07','#88dad8',Math.PI);

  // Only two new local emitters, both beneath an actual visible canopy fixture.
  for(const [x,y,z,color,power]of [[44.9,4.14,108,'#b1d7d2',23],[-34.85,3.85,58,'#efb991',25]]){
    B(iron,x,y+.13,z,.42,.16,.42);B(warm,x,y+.03,z,.28,.04,.28);
    const light=new T.PointLight(color,power,13,2);light.position.set(x,y-.09,z);light.castShadow=false;light.userData.nightPower=power;light.name='SoHo infill / canopy bounce';scene.add(light);lights.push(light);
  }
  const stats={buildings:definitions.length,attachedVolumes:2,canopies:2,upperLinks:1,roads:0,kit:k.stats,pointLights:lights.length,
    signs:k.stats.signs+own.signs,colliders:colliders.length-before,ownBoxes:own.boxes,ownBeams:own.beams,independentDrawCalls:0};
  Object.defineProperty(stats,'boxes',{enumerable:true,get:()=>k.stats.boxes+own.boxes});
  Object.defineProperty(stats,'triangles',{enumerable:true,get:()=>k.stats.triangles+(own.boxes+own.beams)*12});
  function setNight(night){k.setNight(night);for(const l of lights)l.intensity=l.userData.nightPower*(night?1:.14);for(const m of signs)m.material.emissiveIntensity=night?.80:.30;}
  setNight(true);
  return {stats,buildings,definitions,fixtures,lights,bridge,atrium,marketHall,southReturns,setNight,setQuality:k.setQuality};
}
