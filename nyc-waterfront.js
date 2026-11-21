import {keyedCasting} from './nyc-field-voxels.js';
import {buildDepot} from './nyc-harbor-depots.js';
import {buildFreightFloors} from './nyc-working-frontages.js';
import {freightApron} from './nyc-freight-apron.js';
import {buildHudsonBerth} from './nyc-hudson-berth.js';
import {buildHarborExchange} from './nyc-harbor-exchange.js';
import {buildProduceHall,buildCrateReturnYard} from './nyc-produce-hall.js';
import {buildHarborInduction,fitFreightCorners} from './nyc-harbor-induction.js';
import {vesselPoint} from './nyc-harbor-tender.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const tidalSlips=[[-8.96,-2.08],[2.08,7.36]];
const slipChannels=[[-138,-133.28],[-130.40,-125.60]];
// Apply the same two water cuts used by the quay mesh to the playable outline.
// The axial jetty and the through promenade remain dry in both directions.
export function onDryQuay(x,z,radius=0){
  if(x+radius<=-138||x-radius>=-125.60||z+radius<=-8.96||z-radius>=7.36)return true;
  for(const [near,far] of tidalSlips){
    if(z+radius<=near||z-radius>=far)continue;
    for(const [left,right] of slipChannels)
      if(x+radius>left&&x-radius<right)return false;
  }
  return true;
}

/** First westward district: old Hudson warehouses, yards, promenade and pier.
 * Add before the parent architecture batch is finished. No runtime network IO.
 */
export function addWaterfront(scene,{registerProperty,box,beam,panel,materials,colliders,surface,sign,tree,lamp,bench,planter,rand=Math.random}) {
  const ROAD=.18,SIDE=.36,bounds={minX:-146,maxX:-44,minZ:-52,maxZ:52};
  const stats={warehouses:0,trees:0,treeBoxes:0,boxes:0,beams:0,colliders:0,surfaces:0,signs:0,independentDrawCalls:1,pointLights:0,triangles:0};
  const initialColliders=colliders.length,lights=[];
  const B=(...a)=>{stats.boxes++;box(...a);};
  const L=(...a)=>{stats.beams++;beam(...a);};
  const S=(x1,x2,z1,z2,y=SIDE)=>{surface(x1,x2,z1,z2,y);stats.surfaces++;};
  const C=(x,y,z,w,h,d)=>colliders.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));
  const tint=(r=.1)=>{const v=1-r*.5+rand()*r;return new T.Color(v,v,v);};
  const label=(...args)=>{if(sign){sign(...args);stats.signs++;}};
  const treeAt=(x,z,size=.9)=>{if(tree){const result=tree(x,z,size,true);stats.treeBoxes+=result?.boxes||0;stats.trees++;}};
  function register(name,source,options={}){
    if(materials[name])return materials[name];
    const m=source.clone();Object.assign(m,options);m.name='NYC waterfront / '+name;m.userData={...source.userData};materials[name]=m;return m;
  }
  register('harborTimber',materials.wood,{color:new T.Color(0x9b9c8c),roughness:.94});
  register('harborPaint',materials.metal,{color:new T.Color(0x647b74),roughness:.78,metalness:.35});
  register('harborRust',materials.metal,{color:new T.Color(0x8a5d47),roughness:.9,metalness:.2});
  register('harborBoot',materials.metal,{color:new T.Color(0xb8bd99),emissive:new T.Color(0x8c7f58),emissiveIntensity:.28,roughness:.68,metalness:.16});
  materials.harborBeacon=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  materials.harborBeacon.name='西岸 / 隔栅信号玻璃';materials.harborBeacon.userData.keepDistant=true;
  materials.harborBeacon.userData.signalLens=true;

  for(const [name,tone,glow,emissiveIntensity,roughness] of [
    ['harborHullBlue',0x517d83,0x355d64,.28,.76],
    ['harborHullRust',0x944f43,0x593b31,.22,.85],
    ['harborPlate',0xb0bbaf,0x6d807d,.23,.77],
    ['harborEnamel',0xd4d2bb,0x858573,.25,.69],
    ['harborOchre',0xc68c55,0x875733,.25,.70],
  ])register(name,materials.metal,{color:new T.Color(tone),emissive:new T.Color(glow),emissiveIntensity,roughness,metalness:.18});

  // Inland ground meets x=-44 exactly; the river and open-water strip never get
  // a walk surface. The global expanded bounds include only the guarded pier.
  function apron(mat,lo,hi,near,far,y,thick){
    B(mat,(lo+hi)/2,y,(near+far)/2,hi-lo,thick,far-near);
    S(lo,hi,near,far,y+thick/2);
  }
  apron('asphalt',-125.6,-44,-52,52,.01,.34);
  for(const [a,b] of [[-52,-8.96],[-2.08,2.08],[7.36,52]])
    apron('asphalt',-138,-125.6,a,b,.01,.34);
  for(const z of [-8.55,8.55]){
    apron('concrete',-125.6,-44,z-2.05,z+2.05,.27,.18);
  }
  // Two narrow service streets connect every rear yard and park to the avenue.
  for(const [x,halfRoad,sideWidth]of [[-73,3.0,1.9],[-100.5,2.8,1.5]]){
    for(const e of [-1,1]){
      const xx=x+e*(halfRoad+sideWidth/2);
      for(const side of [-1,1]){
        B('concrete',xx,.27,side*31.3,sideWidth,.18,41.4);
        S(xx-sideWidth/2,xx+sideWidth/2,side<0?-52:6.6,side<0?-6.6:52);
      }
      for(let z=-51.75;z<52;z+=.5){if(Math.abs(z)<6.8)continue;B('trim',x+e*(halfRoad+.07),.285,z,.20,.21,.48,tint(.12));}
    }
    for(const z of [-8.15,8.15])for(let i=-2;i<=2;i++)B('white',x+i*1.05,.19,z,.52,.012,2.4,tint(.14));
    for(let z=-45;z<49;z+=9){if(Math.abs(z)<14)continue;B('white',x,.19,z,.09,.012,2.8,tint(.12));}
  }
  // The nose projects six centimetres past the concrete apron at |z|=6.50.
  // The permanent kerb face remains intact when the individual stones fade.
  for(let x=-125.25;x<-44;x+=.5)for(const z of [-6.58,6.58]){
    if(Math.abs(x+73)<3.6||Math.abs(x+100.5)<3.3||Math.abs(x+87)<9||(z>0&&Math.abs(x+114)<9))continue;
    B('trim',x,.285,z,.48,.21,.28,tint(.14));
  }
  for(let x=-120;x<-44;x+=8)for(const z of [-.13,.13])B('yellow',x,.189,z,3.1,.014,.075,tint(.13));
  // Paved forecourts give warehouse doors space and avoid leftover empty plots.
  for(const z of [-18.0,19.5])for(const x of [-59,-87,-114]){
    B('paver',x,.27,z,20,.18,17);S(x-10,x+10,z-8.5,z+8.5);
  }
  // Quay cap, continuous riverwalk and a plaza at the avenue's western end.
  for(const [near,far] of [[-52,-8.96],[-2.08,2.08],[7.36,52]]){
    B('stone',-137.6,-.65,(near+far)/2,1.1,1.8,far-near,0x8a9693);
    apron('paver',-138,-128,near,far,.26,.20);
    apron('paver',-128,-123,Math.max(-10.65,near),Math.min(10.65,far),.265,.19);
  }
  for(let z=-51.6;z<52;z+=.8){
    if(z>-9.3&&z<-1.80||z>1.8&&z<7.7)continue;
    B('trim',-137.5,.40,z,.75,.12,.77,tint(.16));B('stone',-137.8,-.06,z,.42,.55,.76,tint(.12));
  }
  // Two tidal slips cut the quay all the way through its pavement. The narrow
  // timber bridges keep the through promenade connected in both directions.
  for(const [near,far] of tidalSlips){
    const cx=-131.84,depth=far-near,cz=(near+far)/2;
    B('harborHullBlue',cx,.20,cz,2.88,.19,depth+.12);
    S(cx-1.44,cx+1.44,near,far,.36);
    for(let z=near+.16;z<far;z+=.32)B('harborTimber',cx,.32,z,2.86,.08,.305,0xc6bd9a);
    for(const edge of [-1,1]){
      const xx=cx+edge*1.40;
      railAlongZ(xx,near,far,.36,.82,true);
    }
    for(const z of [near,far]){
      railAlongX(-138,cx-1.42,z,.36,.82);railAlongX(cx+1.42,-125.55,z,.36,.82);
    }
    railAlongZ(-125.54,near,far,.18,.82,true);
    // Canal head has a lit depth gauge and stepped stone faces at high tide.
    B('harborHullBlue',-125.65,-.11,cz,.48,.65,depth);
    for(const z of [near+.64,far-.64]){
      B('harborOchre',-125.97,.31,z,.32,.80,.40);
      B('harborBeacon',-126.16,.46,z,.09,.32,.24,0xabcfbf);
    }
  }
  // Bands of actual paving blocks catch low grazing light at the river edge.
  for(let z=-50.7;z<51;z+=1.2)for(const x of [-135.9,-130.1]){
    if(z>-9.5&&z<8.0)continue;
    B('concrete',x,.375,z,.62,.035,1.14,tint(.14));
  }

  function railAlongX(x1,x2,z,y=.36,height=1.12){
    const width=x2-x1;
    B('metal',(x1+x2)/2,y+height,z,width,.085,.085,0xa1aaa0);
    B('metal',(x1+x2)/2,y+.46,z,width,.05,.055,0x8c9c91);
    for(let x=x1;x<=x2+.01;x+=1.3){B('metal',x,y+height/2,z,.105,height,.105,0xa0aa9d);B('metal',x,y+.04,z,.24,.08,.24,0x7c8e85);}
    const head=height===1.12?1.28:height+.045;
    C((x1+x2)/2,y+head/2,z,width,head,.20);
  }
  function railAlongZ(x,z1,z2,y=.36,height=1.12,tidalEdge=false){
    const depth=z2-z1,centre=(z1+z2)/2;
    B('metal',x,y+height,centre,.085,.075,depth,0xa1aaa0);
    B('metal',x,y+.40,centre,.055,.05,depth,0x8c9c91);
    for(let z=z1;z<=z2+.01;z+=1.3){
      B('metal',x,y+height*.5,z,.090,height,.090,0xa0aa9d);
      B('metal',x,y+.04,z,.22,.08,.22,0x7c8e85);
    }
    // Retain the river boundary for the motor, including jumping from the pier.
    const head=tidalEdge?height+.04:1.28;
    C(x,y+head/2,centre,.20,head,depth);
  }
  railAlongZ(-138.05,-52,-8.96);railAlongZ(-138.05,7.36,52);
  railAlongZ(-138.04,-4.82,-2.08,.36,.82,true);railAlongZ(-138.04,2.08,4.82,.36,.82,true);
  // Level timber pier: .18m curb step from the road, no stairs or jump required.
  B('metal',-141.5,.09,0,9.1,.30,9.6,0x5d7777);
  for(let x=-145.72;x<=-137;x+=.24)B('harborTimber',x,.32,0,.225,.08,9.5,tint(.18));
  S(-145.85,-137,-4.75,4.75);
  railAlongX(-145.8,-138,-4.87);railAlongX(-145.8,-138,4.87);railAlongZ(-145.92,-4.9,4.9,.36,.91);
  for(const z of [-3.8,3.8])for(const x of [-145,-141.1,-137.6]){
    B('wood',x,-.3,z,.35,1.45,.35,0x9ba28b);
    B('metal',x,.12,z,.47,.18,.47,0x84918b);
  }
  // Pier fenders and mooring bollards are clustered at edges, off the clear path.
  for(const z of [-3.7,3.7]){
    B('metal',-144.9,.72,z,.20,.72,.20,0x9eafa1);B('metal',-144.9,1.02,z,.55,.16,.20,0xa7b0a0);
    for(let j=0;j<4;j++)B('rubber',-144.88,.40+j*.10,z,.37,.055,.39,0x91a398);
  }
  label(-143.4,1.35,-4.65,2.8,.65,'HUDSON PIER','WEST / RIVERWALK','#8fc6c8',0);
  if(bench){bench(-143,2.95,0);bench(-143,-2.95,Math.PI);}

  let berthQuads=0;
  const berthPanel=panel?(mat,corners,tint)=>{berthQuads++;panel(mat,corners,tint);}:null;
  const berthLights=buildHudsonBerth({box:B,beam:L,panel:berthPanel,collider:C,label});
  berthLights.push(...buildHarborExchange({B,L,C,label}));
  let apronTriangles=0;
  freightApron(B,L,C,label,(mat,corners)=>{panel(mat,corners);apronTriangles+=2;});

  function warehouse(x,z,w,d,height,rotation,index,title){
    stats.warehouses++;
    const facing=Math.round(Math.cos(rotation));
    const uses=['港务配电所','河港机械厂','港务供给仓','','夜班转运仓','河岸仓库市集'];
    registerProperty?.('harbor-depot-'+index,uses[index],'西岸港务 / 夜班作业',x,z,w,d,rotation);
    const point=(u,y,v)=>[x+u*facing,y,z+v*facing];
    const F=(mat,u,y,v,width,rise,depth,tint=0xffffff)=>
      B(mat,...point(u,y,v),width,rise,depth,tint,rotation,null,true);
    const block=(mat,u,y,v,width,rise,depth,tint)=>{
      if(rise<=.011||depth<=0)return;
      F(mat,u,y,v,width,rise,depth,tint);
      C(...point(u,y,v),width,rise,depth);
    };
    const light=(u,y,v,color,power,reach)=>berthLights.push([...point(u,y,v),color,power,reach]);
    const banner=(u,y,v,width,rise,text,sub,ink)=>label(...point(u,y,v),width,rise,text,sub,ink,rotation);
    // Power terminal stays on the occupied corner. The other front corner
    // belongs to the new open delivery arcade and connects to the side lane.
    const hand=index===1||index===4?1:-1;
    // A loading shed reads by its raised sawlights and suspended transfer rail.
    // The roof steps down towards the open river mouth.
    const bays=Math.max(2,Math.round(w/4.48)),pitch=w/bays;
    for(let j=0;j<bays;j++){
      const u=(j+.5)*pitch-w/2;
      for(let k=0;k<3;k++){
        const y=height+.32+k*.48;
        F('harborPlate',u+(k-1)*pitch/3,y,-d*.12,pitch/3,.48,d*.67,0xa4b2ae);
      }
      F('equipmentGlass',u+pitch*.42,height+.72,-d*.12,.22,.88,d*.61,0x8faeb6);
    }
    for(const end of [-1,1]){
      F('harborOchre',end*w*.38,4.64,d*.37,.64,.80,2.88,0xe3b680);
      F('harborPlate',end*w*.38,5.28,d*.28,.80,.64,1.92,0xb5bab4);
    }
    F('harborOchre',0,4.88,d*.37+1.44,w*.84,.48,.48,0xe3b680);
    fitFreightCorners(F,w,index,[hand]);
    C(...point(hand*(w/2+.56),3.48,-2.40),1.60,5.12,3.84);
    buildDepot({F,block,light,panel:berthPanel?(mat,corners,tint)=>berthPanel(mat,corners.map(p=>point(...p)),tint):null,label:banner},w,d,height,index,title);
  }
  warehouse(-59,-10.65,18,12.8,10.4,0,0,'');
  warehouse(-87,-7.95,18,12.6,13.6,0,1,'RIVERWORKS');
  warehouse(-114,-12.90,16,12.2,8.68,0,2,'HUDSON SUPPLY');
  buildProduceHall({B,C,S,label,lights:berthLights});
  stats.warehouses++;
  warehouse(-87,7.55,18,15.6,10.6,Math.PI,4,'NIGHT FREIGHT');
  warehouse(-114,11.40,16,14.2,9.08,Math.PI,5,'RIVERSIDE MARKET');

  // Reclaimed kerbs meet the existing pavement at |z|=6.5. The loading
  // sidewalk follows the narrowing, then stops before the open riverwalk.
  for(const [x,side,edge] of [[-87,-1,4.5],[-87,1,4.2],[-114,1,4.9]]){
    const width=6.5-edge,z=side*(edge+width/2);
    B('paver',x,.27,z,18,.18,width);
    S(x-9,x+9,z-width/2,z+width/2);
    B('trim',x,.28,side*edge,18,.20,.17);
  }
  buildFreightFloors({B,C});

  // Service yards behind the north warehouses remain below the reserved bridge
  // corridor z[-32,-25]. No building, tall vegetation or collision occupies it.
  for(const [x,w]of [[-59,19],[-87,18],[-114,18]]){
    B('concrete',x,.27,-42,w,.18,14.5);S(x-w/2,x+w/2,-49.25,-34.75);
    B('metal',x,.385,-43.7,w*.85,.025,.10,0x7f9189);
    B('metal',x,.385,-40.7,w*.85,.025,.10,0x7f9189);
  }
  function container(x,z,w=11.7,rotation=0,rust=false){
    const d=2.56,h=2.56,base=SIDE,co=Math.cos(rotation),si=Math.sin(rotation);
    const point=(u,y,v)=>[x+u*co+v*si,y,z+v*co-u*si];
    const part=(mat,u,y,v,w,h,d,t)=>B(mat,...point(u,y,v),w,h,d,t,rotation,null,true);
    const faces=berthPanel?(mat,corners,t)=>berthPanel(mat,corners.map(p=>point(...p)),t):null;
    const cellApi={box:part,panel:faces};
    part('harborPlate',0,base+1.35,0,w-.32,2.16,d-.96,0x8ca19b);
    const bays=Math.round(w/1.92),span=w/bays;
    for(let bay=0;bay<bays;bay++){
      const u=-w/2+(bay+.5)*span;
      for(const dir of [-1,1]){
        keyedCasting(cellApi,rust?'harborHullRust':'harborHullBlue',u,base+1.32,dir*(d/2-.32),
          span-.08,1.76,.64,bay%2?0xadc3ba:0xc9c9a9,bay);
        part('harborPlate',u,base+.32,dir*(d/2-.32),span-.32,.32,.64,0xb1b8a4);
        part('harborPlate',u,base+h-.16,dir*(d/2-.32),span,.32,.64,0xa9b9aa);
        part('harborOchre',u-span/2+.16,base+1.32,dir*(d/2-.16),.32,2.40,.32,0xcac1a4);
      }
    }
    for(const end of [-1,1])keyedCasting(cellApi,'harborPlate',end*(w/2-.16),base+h/2,0,.32,h,d,0xb6c6bc);
    const bw=Math.abs(Math.cos(rotation))*w+Math.abs(Math.sin(rotation))*d,bd=Math.abs(Math.sin(rotation))*w+Math.abs(Math.cos(rotation))*d;C(x,1.66,z,bw,2.6,bd);
  }
  container(-59,-44.5,12,0,false);container(-88,-45,11.7,0,true);container(-114,-44.5,10.5,0,false);
  function crate(x,z,size=.9){
    B('wood',x,SIDE+size/2,z,size,size,size,0xb9b294);
    for(const e of [-1,1]){B('metal',x+e*size*.33,SIDE+size/2,z,.07,size+.03,size+.03,0x73897b);B('wood',x,SIDE+size*.82,z+e*size*.51,size,.13,.06,0xa4a387);}
    C(x,SIDE+size/2,z,size,size,size);
  }
  for(const [x,z,s]of [[-52,-38,.9],[-65,-39,1.1],[-93,-38,1],[-116,-37,.9],[-108,-39,1.2],[-120,29,.9]])crate(x,z,s);
  // A compact loading gantry beside the container yard, safely north of greenway.
  for(const x of [-119,-109]){B('harborPaint',x,2.9,-37.2,.25,5.1,.35,0xb5bba3);B('metal',x,.5,-37.2,.64,.25,.88,0x8da18d);}
  B('harborPaint',-114,5.42,-37.2,10.4,.42,.54,0xa0ad96);
  B('yellow',-114,5.42,-36.91,10.3,.19,.035,0xa4a48b);
  B('metal',-113,4.2,-37.2,.045,2.3,.045,0xa6b2a2);B('metal',-113,3.13,-37.2,.33,.16,.25,0xa2ae9a);
  C(-119,2.9,-37.2,.4,5.1,.5);C(-109,2.9,-37.2,.4,5.1,.5);

  // Two retained tree courts separate the occupied port-service frontages.
  const parkWest=-127.5,returnYardEdge=-67.36,parkWidth=returnYardEdge-parkWest,parkCenter=(returnYardEdge+parkWest)/2;
  B('grass',parkCenter,.28,41.1,parkWidth,.16,18.2);S(parkWest,returnYardEdge,32,50.2);
  B('paver',parkCenter,.365,35.3,parkWidth,.03,3.0);S(parkWest,returnYardEdge,33.8,36.8);
  B('paver',parkCenter,.365,46.2,parkWidth,.03,2.5);S(parkWest,returnYardEdge,44.95,47.45);
  for(const x of [-125,-73,-100.5]){B('paver',x,.365,41,2.4,.03,20);S(x-1.2,x+1.2,31,51);}
  buildCrateReturnYard({B,C,S,label,lights:berthLights,west:returnYardEdge});
  buildHarborInduction({B,C,panel:berthPanel,label,lights:berthLights});
  for(const [x,z,size]of [[-133.0,-19,.86],[-132.7,22,.9],[-133,41,.84],[-86,41,.91],[-114,41,.93]])treeAt(x,z,size);
  // Small .18m leaf clusters create planted edges without repeating giant cubes.
  function shrub(x,z,w=2.3,d=1.0){
    B('stone',x,.56,z,w,.4,d,0x9aa68b);B('grass',x,.79,z,w-.14,.07,d-.14);
    const step=.18;
    for(let u=-w/2+.18;u<w/2-.1;u+=step)for(let v=-d/2+.16;v<d/2-.1;v+=step){
      if(rand()<.16)continue;
      const hh=.18+Math.floor(rand()*2)*.16;
      B('leaf',x+u,.84+hh/2,z+v,.17,hh,.17,tint(.2));
      if(rand()>.75)B('darkLeaf',x+u+.07,.98+hh,z+v+.05,.16,.16,.16,tint(.18));
    }
  }
  for(const x of [-86,-114])shrub(x,43.5,2.2,.82);
  for(const z of [-43,-32,-11,13,31,46])shrub(-129,z,1.4,2.2);
  // River-facing benches and street-scale lamps are spaced into readable groups.
  if(bench)for(const z of [-40,-15,16,39.5])bench(-135.1,z,-Math.PI/2);
  if(bench)for(const x of [-86,-114])bench(x,36.5,0);
  if(lamp){
    for(const z of [-44,-18,14,42])lamp(-130.5,z,-1,true);
    for(const [x,north,south] of [[-52,-9.2,9.2],[-80,-5.8,5.6],[-108,-9.2,6.45]]){lamp(x,north,1);lamp(x,south,-1);}
  }
  // Low dock beacons are local navigation punctuation, not rows of neon strips.
  for(const z of [-48,-22,22,48]){B('metal',-137.1,.73,z,.17,.73,.17,0x9dada0);B('lamp',-137.1,1.12,z,.23,.15,.23,0xa6b29a);}
  for(const x of [-143.2,-139.2])for(const z of [-4.3,4.3]){B('metal',x,.70,z,.14,.65,.14,0x94a79a);B('cyan',x,1.05,z,.19,.12,.19,0xaabeb2);}
  // Warehouse forecourt furniture stays close to walls and out of the main street.
  for(const [x,z]of [[-96,12.2],[-104,-12.1],[-49,26.5]]){
    B('metal',x,1.05,z,.76,1.35,.76,0x7b9481);B('metal',x,1.77,z,.83,.14,.83,0x91a58d);
    for(let i=0;i<5;i++)B('rubber',x-.24+i*.12,1.10,z+.4,.04,.9,.025,0x8b9a86);
  }

  // The river uses sky reflections plus gentle analytic wave normals. One draw
  // call, no screen-space reflection pass, external image or extra dependency.
  const waterMaterial=new T.MeshStandardMaterial({color:0x294653,roughness:.30,metalness:.46,envMapIntensity:.8,emissive:0x06121a,emissiveIntensity:.14});
  waterMaterial.name='NYC Hudson / rain-blue wave surface';
  const waveTime={value:0};
  const boatside=[-13,1,9].map(v=>{
    const [x,,z]=vesselPoint(5.65,0,v);
    return new T.Vector2(x,z);
  });
  waterMaterial.onBeforeCompile=shader=>{
    shader.uniforms.hudsonTime=waveTime;
    shader.uniforms.hudsonSidelights={value:boatside};
    shader.vertexShader='uniform float hudsonTime; varying vec2 riverGrid;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`
      #include <beginnormal_vertex>
      float wx=position.x*.29+position.z*.08+hudsonTime*.43;
      float wz=position.z*.48-position.x*.04-hudsonTime*.31;
      float dx=.027*.29*cos(wx)-.012*.04*cos(wz);
      float dz=.027*.08*cos(wx)+.012*.48*cos(wz);
      objectNormal=normalize(vec3(-dx*4.5,1.0,-dz*4.5));
    `);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      riverGrid=position.xz;
      transformed.y+=.027*sin(position.x*.29+position.z*.08+hudsonTime*.43)+.012*sin(position.z*.48-position.x*.04-hudsonTime*.31);
    `);
    shader.fragmentShader='uniform float hudsonTime; uniform vec2 hudsonSidelights[3]; varying vec2 riverGrid;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec2 address=floor(riverGrid/.64);
      float wave=sin(address.x*.47+address.y*.13+hudsonTime*.45)+sin(address.y*.69-hudsonTime*.31);
      float footprint=max(fwidth(riverGrid.x),fwidth(riverGrid.y));
      float facets=(1.-smoothstep(.10,.52,footprint))*smoothstep(.38,1.65,wave);
      outgoingLight=outgoingLight*(.93+.24*facets)+vec3(.004,.012,.015)*facets;
      vec2 worldXZ=riverGrid+vec2(-194.,0.);
      float ribbons=0.;
      for(int i=0;i<3;i++){
        vec2 delta=worldXZ-hudsonSidelights[i];
        float along=dot(delta,vec2(.909,.417)),crosswise=dot(delta,vec2(-.417,.909));
        float width=.53+max(0.,along)*.085;
        float lobe=(1.-smoothstep(0.,width*2.,abs(crosswise)))*smoothstep(-.5,.6,along)*(1.-smoothstep(1.4,12.,along));
        ribbons+=lobe*smoothstep(-.28,1.38,wave);
      }
      outgoingLight+=vec3(.22,.145,.076)*ribbons;
      float tideGauge=exp(-abs(worldXZ.x+126.8)*.53)*smoothstep(.26,1.42,wave);
      outgoingLight+=vec3(.045,.120,.099)*tideGauge;
      #include <opaque_fragment>`);
  };
  const waterParts=[new T.PlaneGeometry(112,1400,56,84).rotateX(-Math.PI/2)];
  for(const [near,far] of tidalSlips){
    const slip=new T.PlaneGeometry(12.6,far-near,12,8).rotateX(-Math.PI/2);
    waterParts.push(slip.translate(62.3,0,(near+far)/2));
  }
  const waterGeometry=mergeGeometries(waterParts);
  for(const p of waterParts)p.dispose();
  const water=new T.Mesh(waterGeometry,waterMaterial);water.name='Hudson River / guarded non-walkable water';water.position.set(-194,.043,0);water.receiveShadow=false;scene.add(water);
  // Thin stepped shore scum/foam clusters add scale without a transparent pass.
  for(let z=-50;z<51;z+=1.4)if(Math.abs(z)>6){B('stone',-138.14,-.58,z,.14,.055,.45+rand()*.55,0x7d9892);}
  for(const [x,y,z,color,power,reach]of [...berthLights,[-134.3,3.3,1.0,0x89c4cc,47,14],[-113.0,4.0,8.0,0xe4b488,50,12]]){
    const l=new T.PointLight(color,power,reach,2);l.position.set(x,y,z);l.castShadow=false;l.userData.nightPower=power;scene.add(l);lights.push(l);
  }
  const bayX=-109.86,bayZ=-12.57;
  B('metal',bayX,5.02,bayZ,1.26,.115,.23);
  B('lamp',bayX,4.945,bayZ,1.12,.045,.16);
  for(const dx of [-.41,0,.41])B('metal',bayX+dx,4.94,bayZ,.024,.070,.21);
  const bayLamp=new T.PointLight(0xffca88,48,9,2);
  bayLamp.position.set(bayX,4.80,bayZ+.10);
  bayLamp.userData.nightPower=48;bayLamp.userData.duskFraction=.69;
  scene.add(bayLamp);lights.push(bayLamp);
  function setNight(night){
    waterMaterial.color.set(night?0x32535f:0x49707a);waterMaterial.roughness=night?.34:.39;waterMaterial.envMapIntensity=night?.8:.65;
    for(const l of lights)l.intensity=l.userData.nightPower*(night?1:(l.userData.duskFraction??.16));
  }
  function update(dt,time,camera){waveTime.value=Number.isFinite(time)?time:0;}
  const landmarks=[
    {id:'produce_hall',title:'天亮前菜站',position:new T.Vector3(-55.60,SIDE,12.1)},
    {id:'hudson_pier',title:'哈德逊码头',position:new T.Vector3(-142.1,SIDE,0)},
    {id:'riverside_market',title:'河岸仓库市集',position:new T.Vector3(-113.0,SIDE,6.0)}
  ];
  const districts=[
    {id:'hudson_waterfront',title:'哈德逊滨水街区',position:new T.Vector3(-132,SIDE,0),bounds:{minX:-146,maxX:-124,minZ:-52,maxZ:52}},
    {id:'riverside_works',title:'河岸仓库',position:new T.Vector3(-87,SIDE,0),bounds:{minX:-124,maxX:-44,minZ:-52,maxZ:52}}
  ];
  stats.colliders=colliders.length-initialColliders;stats.pointLights=lights.length;
  stats.ownTriangles=berthQuads*2+apronTriangles+(stats.boxes+stats.beams)*12+waterGeometry.index.count/3;
  stats.triangles=stats.ownTriangles+stats.treeBoxes*12;
  stats.triangleScope='Own geometry plus returned tree geometry; existing bench/lamp/sign helper primitives are counted by parent batch.';
  stats.materials=['harborTimber','harborPaint','harborRust'];
  stats.reservedGreenway={minX:-137,maxX:-44,minZ:-32,maxZ:-25,y:6.51};
  setNight(true);
  return {bounds,landmarks,districts,stats,update,setNight,lights,water};
}
