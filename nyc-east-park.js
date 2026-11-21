import {voxelCrown} from './nyc-field-voxels.js';
import {voxelBay} from './nyc-fulton-modules.js';
import {buildWetlandBank, buildWetlandPump} from './nyc-wetland-bank.js';
import {fitWetlandMonitoring} from './nyc-wetland-monitor.js';
import {buildFloodGarden, catchmentPools} from './nyc-flood-garden.js';
import * as T from 'three';
import {createDistrictKit} from './nyc-district-kit.js';
import {addEastParkDetail} from './nyc-east-park-detail.js';
import {addParkDensity} from './nyc-park-density.js';
import {buildCatchmentHorizon} from './nyc-catchment-horizon.js';
import {buildParkNightline} from './nyc-park-nightline.js';

/** Final east district, including the SoHo overlap north of z=96.
 * All building/terrain geometry remains in the shared architecture batch.
 */
export function addEastPark(scene,api) {
  const {box,beam,materials,colliders,surface,sign,rand=Math.random}=api;
  const bounds={minX:44,maxX:144,minZ:-52,maxZ:96};
  const stats={boxes:0,beams:0,triangles:0,colliders:0,surfaces:0,signs:0,
    pointLights:0,authoredTrees:0,detailedTrees:0,independentDrawCalls:0,
    canopyCubes:0,treeGeometry:[],terrainIslands:0};
  const before=colliders.length,lights=[];
  const B=(...a)=>{stats.boxes++;stats.triangles+=12;box(...a);};
  const L=(...a)=>{stats.beams++;stats.triangles+=12;beam(...a);};
  const S=(...a)=>{stats.surfaces++;surface(...a);};
  function C(x,y,z,w,h,d,id){
    const b=new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2));
    b.userData={eastPark:id};colliders.push(b);return b;
  }
  function material(key,source,options){
    if(!materials[key]){const m=materials[source].clone();Object.assign(m,options);m.name='NYC East Commons / '+key;m.userData={...materials[source].userData};materials[key]=m;}
    return key;
  }
  const stone=material('eastParkStone','stone',{color:new T.Color('#d4d5bd'),roughness:.94});
  const paving=material('eastParkPaving','paver',{color:new T.Color('#c1c9c0'),roughness:.94});
  const timber=material('eastParkTimber','wood',{color:new T.Color('#e1d0ad'),roughness:.86});
  const iron=material('eastParkIron','metal',{color:new T.Color('#abc4bf'),roughness:.72,metalness:.35});
  const copper=material('eastParkCopper','metal',{color:new T.Color('#b5cabc'),roughness:.77,metalness:.42});
  const soil=material('eastParkSoil','roof',{color:new T.Color('#5d6353'),roughness:1});
  const water=material('eastParkShallowWater','puddle',{color:new T.Color('#4c7878'),roughness:.40,metalness:.12,transparent:true,opacity:.78,depthWrite:false});
  materials[water].userData.castShadow=false;
  const cool=material('eastParkSignal','cyan',{color:new T.Color('#83c9bd'),emissiveIntensity:1.4,roughness:.6});
  const warm=material('eastParkWarm','lamp',{color:new T.Color('#e7d1a9'),emissiveIntensity:.9,roughness:.6});
  const canopyLight=material('eastParkCanopyLight','leaf',{color:new T.Color('#688155'),roughness:1});
  const canopyShade=material('eastParkCanopyShade','leaf',{color:new T.Color('#566d49'),roughness:1});
  const grassCap=material('eastParkGrassCap','grass',{color:new T.Color('#e6eedc'),roughness:1});
  const bankSoil=material('eastParkBankSoil','roof',{color:new T.Color('#716b58'),roughness:1});
  const roofCopper=material('eastParkRoofCopper','metal',{map:createRoofCopperTexture(),
    color:new T.Color(0xffffff),roughnessMap:null,roughness:.86,metalness:.38});
  materials[roofCopper].userData.textureMeters=4.2;
  const tracked={...api,box:B,beam:L,surface:S};
  const registry=api.roadRegistry||(api.roadRegistry=[]);tracked.roadRegistry=registry;
  registry.pavingExclusions=registry.pavingExclusions||[];
  const k=createDistrictKit(scene,tracked);stats.kit=k.stats;
  const tint=(s=.10)=>new T.Color().setScalar(1-s/2+rand()*s);
  k.ground(44,144,-52,96);
  k.roadX(0,44,144,12,2.8);
  k.roadZ(58,-58.8,96,9.6,2.8);
  k.roadZ(132,0,84,8.8,2.8);
  k.roadX(12,58,132,8.8,2.8);
  k.roadX(84,44,132,10,2.8);

  const rect=(minX,maxX,minZ,maxZ)=>({minX,maxX,minZ,maxZ});
  const park=rect(72,124,22,70),pond=rect(107.6,120.2,44,59.6);
  const pavilion=rect(93.2,102.8,32,40),boardwalk=rect(105.8,121.8,49.2,51.8);
  const pavers=[
    rect(72,124,22.2,25.8),rect(72,124,66.2,69.8),
    rect(72.2,75.8,24,68),rect(120.2,123.8,24,68),
    rect(65.6,76,22.2,25.8),rect(124,127.6,22.2,25.8),
    rect(88.2,91.8,19.2,25.8),rect(88.2,91.8,69.8,76.2),
    rect(75.8,105.8,48.7,52.3),rect(96.2,99.8,42.64,50.5),
  ];
  function layGround(r,mat,top=.36){k.ground(r.minX,r.maxX,r.minZ,r.maxZ,mat,top);}
  function difference(a,b){
    const x0=Math.max(a.minX,b.minX),x1=Math.min(a.maxX,b.maxX),z0=Math.max(a.minZ,b.minZ),z1=Math.min(a.maxZ,b.maxZ);
    if(x0>=x1||z0>=z1)return[a];
    return [rect(a.minX,x0,a.minZ,a.maxZ),rect(x1,a.maxX,a.minZ,a.maxZ),
      rect(x0,x1,a.minZ,z0),rect(x0,x1,z1,a.maxZ)].filter(r=>r.maxX-r.minX>.002&&r.maxZ-r.minZ>.002);
  }
  function subtractAll(r,cuts){let list=[r];for(const cut of cuts)list=list.flatMap(a=>difference(a,cut));return list;}
  // Cut same-height paving out of grass, and union paving at junctions. This is
  // real geometry, not coplanar green/paving sheets fighting each other.
  for(const r of subtractAll(park,[...pavers,pond,...catchmentPools,pavilion,boardwalk]))layGround(r,'grass');
  const rendered=[];
  for(const r of pavers){for(const part of subtractAll(r,rendered)){layGround(part,paving);rendered.push(part);}registry.pavingExclusions.push(r);}
  // Split the walk into dressed flags with perimeter gutters. The raised beds
  // start outside the 3.6 m footway; soil, coping and rhizomes have real sides.
  for(let row=0;row<18;row++)for(let col=0;col<6;col++){
    const z=42.88+row*.4,x=96.5+col*.6,edge=col===0||col===5;
    B(edge?copper:paving,x,.36,z,.58,.049,.38,
      edge?0x93b0a1:[0xd4d2b9,0xb7bcae,0xc9cbbd][(row*3+col+Math.floor(row/3))%3]);
  }
  for(const side of [-1,1])for(let bay=0;bay<3;bay++){
    const x=98+side*(2.88+(bay===1?.32:0)),z=43.7+bay*1.76;
    const soilTop=.84+bay%2*.16;
    for(let step=0;step<3;step++){
      const width=1.92-step*.32,top=.52+step*.16;
      B(step===1?timber:stone,x,top-.08,z,width,.16,1.60,step===1?0xb49162:0xd2c8ab);
      C(x,top-.08,z,width,.16,1.60,'rain-bed');
    }
    B(soil,x,soilTop-.08,z,1.12,.16,1.44);
    for(let stem=0;stem<6;stem++){
      const xx=x+(stem%3-1)*.31,zz=z+(Math.floor(stem/3)-.5)*.61;
      const level=(stem+bay*2+(side+1))%3;
      B(canopyShade,xx,soilTop+.16,zz,.32,.32,.32,0xacbd9b);
      B(canopyLight,xx+side*.08,soilTop+.32+level*.08,zz,.16,.16+level*.16,.24,0xc2c493);
      if(level===2)B(timber,xx+side*.08,soilTop+.66,zz,.16,.16,.16,0xbc7855);
    }
  }

  // A quieter northern planted room also has an explicit path from x=58.
  const northGarden=rect(72,124,-44,-10),northPaths=[rect(65.6,124,-21.8,-18.2),rect(88.2,91.8,-18.2,-8.8)];
  for(const r of subtractAll(northGarden,northPaths))layGround(r,'grass');
  for(const r of northPaths){layGround(r,paving);registry.pavingExclusions.push(r);}

  function solidFloor(r,top,mat,id,bottom=.18){
    B(mat,(r.minX+r.maxX)/2,(bottom+top)/2,(r.minZ+r.maxZ)/2,r.maxX-r.minX,top-bottom,r.maxZ-r.minZ,tint(.06));
    S(r.minX,r.maxX,r.minZ,r.maxZ,top);
    C((r.minX+r.maxX)/2,(bottom+top)/2,(r.minZ+r.maxZ)/2,r.maxX-r.minX,top-bottom,r.maxZ-r.minZ,id);
  }
  solidFloor(pavilion,1.08,stone,'pavilion-floor');
  const stairs=[];
  for(let i=0;i<4;i++){
    const z1=42.64-i*.66,z0=z1-.66,top=.54+i*.18,r=rect(96.4,99.6,z0,z1);
    solidFloor(r,top,stone,'pavilion-step-'+i);stairs.push([98,top,(z0+z1)/2]);
    B(timber,98,top+.012,z0+.04,3.12,.024,.08,0xa4a68e);
  }
  // Flat park shelter: iron columns, wood coffers and a substantial roof with
  // explicit collision. South rail has a 3.5m stair opening, never an air wall.
  for(const x of [93.7,102.3])for(const z of [32.6,39.3]){
    B(stone,x,1.28,z,.52,.40,.52,0xb2b8a1);
    B(iron,x,2.71,z,.18,3.26,.18);C(x,2.71,z,.22,3.26,.22,'pavilion-column');
    B(copper,x,4.29,z,.42,.17,.42);
  }
  B(roofCopper,98,4.25,36,10.2,.17,8.6,0xe4e8df);
  B(roofCopper,98,4.39,36,10.5,.18,8.85,0xf0f2e9);
  B(roofCopper,98,4.52,36,10.65,.12,9.0);
  // Laminated timber knees grow out of the perimeter posts above the handrail.
  for(const side of [-1,1])for(let i=0;i<3;i++)
    voxelBay(scene,'park',[98+(i-1)*2.88,3.49,side>0?39.3:32.6],side>0?0:Math.PI,2.88,1.44,.65);
  // The copper lantern steps inward in three courses above the original roof.
  for(const side of [-1,1])
    voxelBay(scene,'lantern',[98,3.77,36+side*.2],side>0?0:Math.PI,1.12,.80,.32);
  for(let i=0;i<3;i++){
    B(i===1?timber:roofCopper,98,4.72+i*.32,36,7.68-i*1.28,.32,4.48-i*.96);
    C(98,4.72+i*.32,36,7.68-i*1.28,.32,4.48-i*.96,'pavilion-lantern-'+i);
    if(i===1)for(let x=95.6;x<=100.5;x+=.64)B(warm,x,5.04,37.78,.32,.16,.16);
  }
  for(let x=93.05;x<103.2;x+=.72)B(roofCopper,x,4.578,36,.025,.010,8.90,0xe5eae2);
  C(98,4.37,36,10.65,.43,9.0,'pavilion-roof');
  for(let x=93.5;x<=102.6;x+=.70)B(timber,x,4.11,36,.16,.14,8.30,0xa5a18a);
  function rail(x0,z0,x1,z1,y=1.08){
    const len=Math.hypot(x1-x0,z1-z0),count=Math.max(1,Math.ceil(len/1.0));
    for(let i=0;i<=count;i++){const t=i/count,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;
      B(iron,x,y+.60,z,.06,1.20,.06);}
    L(iron,[x0,y+1.20,z0],[x1,y+1.20,z1],.075,.075,0x9bad9b);
    L(iron,[x0,y+.58,z0],[x1,y+.58,z1],.045,.045,0x8ba392);
    C((x0+x1)/2,y+.60,(z0+z1)/2,Math.abs(x1-x0)+.10,1.20,Math.abs(z1-z0)+.10,'pavilion-rail');
  }
  rail(93.3,32.15,102.7,32.15);rail(93.3,32.15,93.3,39.9);rail(102.7,32.15,102.7,39.9);
  rail(93.3,39.9,96.2,39.9);rail(99.8,39.9,102.7,39.9);
  // Small table / benches are at the edges; the landmark centre remains empty.
  benchAt(95.0,35.5,Math.PI/2,1.08);benchAt(101.0,35.5,-Math.PI/2,1.08);
  B(iron,98,4.03,36,.06,.42,.06);B(iron,98,3.80,36,.62,.12,.62);B(warm,98,3.72,36,.44,.05,.44);

  // A shallow, visibly grounded wetland. It is safe to step into: bottom .185,
  // water .246, with a .54 curb that stays within a .355m exit step.
  B(soil,113.9,.1825,51.8,12.6,.005,15.6);S(107.6,120.2,44,59.6,.185);
  buildWetlandBank({box:B,panel:api.panel,solidFloor,stone,soil,water});
  const banks=[];
  function bank(r){
    banks.push({...r,top:.54});
    const w=r.maxX-r.minX,d=r.maxZ-r.minZ;
    const cx=(r.minX+r.maxX)/2,cz=(r.minZ+r.maxZ)/2;
    S(r.minX,r.maxX,r.minZ,r.maxZ,.54);C(cx,.36,cz,w,.36,d,'pond-bank');
    const alongX=r.maxX-r.minX>r.maxZ-r.minZ;
    const length=alongX?r.maxX-r.minX:r.maxZ-r.minZ;
    const sign=alongX?Math.sign(51.8-cz):Math.sign(113.9-cx);
    for(let i=0;i<Math.ceil(length/.32);i++){
      const len=Math.min(.32,length-i*.32),shift=i*.32+len/2;
      const x=alongX?r.minX+shift:cx,z=alongX?cz:r.minZ+shift;
      const head=i%3===0?.16:0;
      B(i%3===0?timber:stone,x+(alongX?0:sign*head/2),.36,z+(alongX?sign*head/2:0),
        alongX?len:w+head,.36,alongX?d+head:len,i%3===0?0xad9b7b:0xb4bea6);
    }
  }
  bank(rect(107.34,107.60,44,49.18));bank(rect(107.34,107.60,51.82,59.6));
  bank(rect(120.20,120.46,44,49.18));bank(rect(120.20,120.46,51.82,59.6));
  bank(rect(107.34,120.46,43.74,44.0));bank(rect(107.34,120.46,59.60,59.86));
  // A timber boardwalk really spans the water, with grounded piers and an open
  // walking centre; there is no invisible full-pond floor at park height.
  B(iron,113.8,.465,50.5,16,.11,2.6);B(timber,113.8,.525,50.5,16,.03,2.6);
  for(let x=106;x<121.8;x+=.42)B(timber,x,.548,50.5,.38,.016,2.52,tint(.09));
  S(105.8,121.8,49.2,51.8,.556);
  C(113.8,.47,50.5,16,.17,2.6,'wetland-boardwalk');
  for(const x of [108.3,112.0,116.0,119.5])for(const z of [49.45,51.55]){
    B(iron,x,.3225,z,.17,.275,.17,0x8b9d90);
  }
  for(let i=0;i<72;i++){
    const x=108.15+rand()*10.85,z=rand()>.5?44.5+rand()*1.55:57.8+rand()*1.25;
    B('darkLeaf',x,.43+rand()*.12,z,.09,.44+rand()*.22,.09,0x839f69);
    if(i%3===0)B('leaf',x+.10,.37,z,.23,.08,.13,0x8caa78);
  }

  // Small authored stepped trees: trunks / branch forks and coherent clusters,
  // not the expensive detailed-tree helper or isolated one-cube crowns.
  const treeLocations=[[78,28],[86,28],[116,28],[79,43],[79,64],[102,64],[119.55,63.8],
    [87,60],[109,65],[77,-36],[88,-35],[111,-35],[119,-15],[78,-14],
    [95,27.5],[93,63],[114,40.5],[81,-24.5],[99,-31],[116,-26]];
  materials.eastParkPressureGlass=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  materials.eastParkPressureGlass.name='东园 / 水仓液位窗';materials.eastParkPressureGlass.userData.keepDistant=true;
  materials.eastParkPressureGlass.userData.signalLens=true;
  buildCatchmentHorizon({B,L,C,label:sign,light(x,y,z,color,power,reach){
    const l=new T.PointLight(color,power,reach,2);
    l.position.set(x,y,z);l.userData.nightPower=power;scene.add(l);lights.push(l);
  }},treeLocations);
  for(let i=0;i<treeLocations.length;i++)smallTree(...treeLocations[i],.83+(i%4)*.065);
  // A continuous pollarded crown along the road, with wide interruptions
  // opposite the wetland and at the garden entrances. The pond stays open.
  for(const [x,z] of [[67,18],[75,18],[83,18],[93,19],[105,18],[115,18],[124,19],
    [126,27],[125,36],[126,57],[125,66],[122,77],[111,77],[99,77],[84,77],[70,76],
    [67,-7],[78,-8],[91,-8],[107,-7],[120,-8],[68,-26],[82,-27],[102,-25],[119,-25]]){
    const spread=3.20+(Math.abs(x+z)%3)*.32,top=5.76+(Math.abs(x)%3)*.48;
    B('bark',x,top*.49,z,.64,top,.80,0xb4b399);C(x,top*.49,z,.64,top,.80,'park-alley-trunk');
    for(const side of [-1,1]){
      L('bark',[x,top*.62,z],[x+side*spread*.72,top-.32,z+side*.64],.40,.48,0xb4b399);
      const lobes=[[-1.12,0,.16,1.76,.80,1.45],[.64,.32,-.64,1.92,.96,1.60],[.96,.80,.80,1.36,.88,1.28]];
      voxelCrown({box:B,panel:api.panel},canopyLight,[x+side*spread*.62,top,z+side*.8],lobes,x+z+side,[0x89a291,0xa3b997,0xb9c99f,0xd6d3a5,0xbccfb5]);
    }
  }
  function smallTree(x,z,scale){
    stats.authoredTrees++;
    B(soil,x,.41,z,1.5,.10,1.5,0x9caa8c);
    for(let y=.36;y<3.45*scale;y+=.38)B('bark',x+(Math.floor(y*4)%2)*.06,y+.19,z,.34*scale,.40,.34*scale,tint(.10));
    C(x,1.85*scale,z,.39*scale,3.0*scale,.39*scale,'tree-trunk');
    for(const e of [-1,1])L('bark',[x,2.1*scale,z],[x+e*.9*scale,3.35*scale,z+e*.33],.18*scale,.18*scale,0x9caa83);
    const lobes=[
      [-.62,0,.20,1.02,.74,.86],[.53,.18,.31,.98,.84,1.05],
      [.03,.47,-.48,1.13,.85,.95],[-.19,.78,.11,.86,.64,.88]
    ].map(l=>l.map(v=>v*scale));
    const tree=voxelCrown({box:B,panel:api.panel},canopyLight,[x,3.32*scale+.12,z],lobes,Math.round(x+z),
      [0x9da999,0xb9c2a1,0xccd5b0,0xdee3bb,0xf1eac4]);
    const [minX,minY,minZ]=tree.min,[maxX,maxY,maxZ]=tree.max;
    stats.canopyCubes+=tree.exposed;stats.triangles+=tree.quads*2;
    stats.treeGeometry.push({x,z,scale,cell:.32,cubes:tree.exposed,bounds:{minX,maxX,minY,maxY,minZ,maxZ}});
    // Ferns and last season’s litter grow around the trunk, clear of the path.
    for(let j=0;j<17;j++){
      const a=j*2.4+x*.53,r=.26+.039*(j%10);
      const dx=Math.cos(a),dz=Math.sin(a),bx=x+dx*r,bz=z+dz*r;
      B(j%4?'darkLeaf':'wood',bx,.474,bz,.18,.035,.072,0xb6a17d,a);
      if(j%3===0)for(const side of [-1,1]){
        L('leaf',[bx,.48,bz],[bx+side*dx*.13,.65+.04*(j%4),bz+side*dz*.13],.055,.041,0xa8b57b);
      }
    }
    for(const [dx,dz]of [[-.72,.62],[.72,-.6]])B('leaf',x+dx,.62,z+dz,.46,.38,.42,0x859969);
  }
  // Quiet planted edges: clusters sit at grove/pond edges, keeping paved routes.
  for(const [x,z,w,d]of [[82,31,5,1.6],[111,31,5,1.4],[80,62,3,1.3],[114.7,65.13,2.5,.7],[77,-31,3,1.3],[115,-31,4,1.4]]){
    B(soil,x,.43,z,w,.14,d,0x879378);
    for(let i=0;i<Math.floor(w*3);i++)B(i%4?'leaf':'darkLeaf',x+(rand()-.5)*(w-.2),.64+rand()*.10,z+(rand()-.5)*(d-.2),.38,.44,.36,tint(.16));
  }
  for(const [x,z,rotation]of [[83,64.5,0],[111,65.38,0],[77,36,Math.PI/2],[119,37,-Math.PI/2],[86,-16,0],[111,-16,0]])benchAt(x,z,rotation);
  function benchAt(x,z,rotation=0,level=.36){
    const c=Math.cos(rotation),s=Math.sin(rotation),P=(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c];
    const F=(mat,u,y,v,w,h,d,col)=>B(mat,...P(u,y,v),w,h,d,col,rotation);
    for(const u of [-.73,.73]){F(iron,u,level+.24,0,.12,.48,.54,0x81998d);F(iron,u,level+.54,-.28,.08,.89,.08,0x81998d);}
    for(let i=0;i<4;i++)F(timber,0,level+.49,-.23+i*.15,1.9,.095,.13,0xb6aa8f);
    for(let i=0;i<3;i++)F(timber,0,level+.78+i*.13,-.29,1.9,.11,.10,0xa7a48a);
    C(x,level+.49,z,Math.abs(c)*2+Math.abs(s)*.68,.98,Math.abs(s)*2+Math.abs(c)*.68,'park-bench');
  }

  // A compact civic signal sculpture and 18cm stepped seating, off the loop.
  solidFloor(rect(81.6,84.4,54.8,57.6),.54,stone,'signal-plinth');
  for(const [x,h]of [[82.5,3.6],[83.5,4.5]]){
    B(copper,x,.54+h/2,56.2,.24,h,.34);B(iron,x,3.3,56.2,.55,.15,.60,0x8ca494);
    B(cool,x,3.65,56.03,.12,.25,.035);B(copper,x+Math.sign(x-83)*.47,3.93,56.2,.80,.22,.32);
  }
  for(let i=0;i<3;i++){
    const r=rect(78,85.5,59.0+i*.68,59.68+i*.68);solidFloor(r,.54+i*.18,stone,'terrace-seat-'+i);
    B(timber,81.75,.565+i*.18,59.35+i*.68,7.2,.05,.42,0xa5a58c);
  }

  // The tram stop is a real narrow median platform between z=0 and z=12.
  // Its east edge remains west of x127.6, the live x132 ring carriageway.
  const tramPlatform=rect(117.5,127.4,6.05,7.55);
  layGround(tramPlatform,paving);registry.pavingExclusions.push(tramPlatform);
  for(const x of [118.1,127.0]){
    B(stone,x,.56,7.20,.48,.40,.48,0xa4b19c);
    B(iron,x,2.00,7.20,.18,3.28,.18);C(x,2.0,7.2,.22,3.28,.22,'tram-canopy-post');
    L(iron,[x,3.60,7.2],[x,3.72,6.2],.12,.12,0x96aa9b);
  }
  B(iron,122.55,3.76,6.85,10.6,.16,1.75,0x8b9f93);
  B(timber,122.55,3.89,6.85,10.7,.12,1.83,0xa6a794);
  C(122.55,3.82,6.85,10.7,.29,1.83,'tram-canopy-roof');
  B(iron,118.2,1.78,6.9,.20,2.45,.72);C(118.2,1.78,6.9,.25,2.45,.76,'tram-information');
  B(cool,118.05,2.04,6.9,.025,1.20,.48,0xa6c5ad);
  for(let y=1.0;y<2.6;y+=.26)B(timber,118.03,y,6.9,.025,.07,.44,0xa1b29d);

  function label(x,y,z,w,h,title,subtitle,rotation=0,color='#bfcdb5'){
    if(!sign)return;sign(x,y,z,w,h,title,subtitle,color,rotation);stats.signs++;
  }
  // Signs have grounded supports and do not cross entrance or plaza routes.
  for(const z of [26.9,29.1]){B(iron,69.3,1.46,z,.11,2.20,.11);C(69.3,1.46,z,.13,2.20,.13,'park-entry-sign');}
  label(69.3,2.18,28,2.8,.75,'EAST COMMONS','WETLAND / PUBLIC PARK',-Math.PI/2);
  label(122.55,3.68,6.02,3.1,.48,'EAST LOOP TRAM','RING / CITY LINK',Math.PI,'#a8cbc2');
  label(94.45,2.84,32.2,2.7,.45,'COMMONS PAVILION','SHELTER / EVERYONE',0,'#d1c39e');

  const floodLights=buildFloodGarden({box:B,beam:L,panel:api.panel,collider:C,surface:S,materials,rand});
  buildWetlandPump({box:B,beam:L,panel:api.panel,collider:C,sign:label,materials});
  const sampleWater=fitWetlandMonitoring(scene,{box:B,collider:C,materials,lights});
  const updateNightline=buildParkNightline(scene,{B,C,panel:api.panel,label,materials,light(x,y,z,color,power,reach){
    const lamp=new T.PointLight(color,power,reach,2);
    lamp.position.set(x,y,z);lamp.userData.nightPower=power;scene.add(lamp);lights.push(lamp);
  }});
  stats.independentDrawCalls++;

  // A few warm human-scale pools, never extra dynamic shadows or light rows.
  for(const [x,y,z,color,power,reach]of [[98,3.68,36,'#ffd09b',14,10],[123.5,3.45,6.6,'#91d4c8',18,10],[89,2.7,64,'#edc695',9,7],[114.65,2.44,45.82,'#f0d2a5',21,8],...floodLights]){
    const light=new T.PointLight(color,power,reach,2);light.position.set(x,y,z);light.castShadow=false;light.userData.nightPower=power;scene.add(light);lights.push(light);
  }
  // Small walkable grass terraces stop short of every public/crowd route.
  // Their soil bank and 3cm grass cap share exact collision/surface top heights.
  // Append these solids after the original colliders, preserving all old C data.
  const terrainIslands=[
    {id:'grass-island-a',outerParts:[rect(78.8,89.2,30,41),rect(80,88,28.6,30),rect(80,88,41,42.3)],
      innerParts:[rect(80.9,87.8,32.5,39.8)],waypoints:[[87,.36,27.8],[87,.54,29.3],[86.7,.72,33.4]]},
    {id:'grass-island-b',outerParts:[rect(86.5,90,55.6,62.9),rect(86.9,89.6,55.2,55.6),rect(86.9,89.6,62.9,63.3)],
      innerParts:[rect(87.3,89.3,57,61.6)],waypoints:[[88,.36,54.4],[88,.54,56.1],[88.2,.72,58.1]]},
    {id:'grass-island-c',outerParts:[rect(105.2,115.1,30,36.5),rect(106,114.5,28.5,30),rect(106,114.5,36.5,38)],
      innerParts:[rect(107.1,113.6,32.4,36.6)],waypoints:[[116,.36,30],[114.4,.54,30.8],[112.8,.72,33.5]]},
  ];
  for(const island of terrainIslands){
    island.solids=[];stats.terrainIslands++;
    for(const [parts,bottom,top]of [[island.outerParts,.36,.54],[island.innerParts,.54,.72]]){
      for(const r of parts){
        const x=(r.minX+r.maxX)/2,z=(r.minZ+r.maxZ)/2,w=r.maxX-r.minX,d=r.maxZ-r.minZ;
        B(bankSoil,x,(bottom+top-.03)/2,z,w,top-bottom-.03,d,0xa5a48c);
        B(grassCap,x,top-.015,z,w,.03,d);
        S(r.minX,r.maxX,r.minZ,r.maxZ,top);
        C(x,(bottom+top)/2,z,w,top-bottom,d,island.id);
        island.solids.push({...r,minY:bottom,maxY:top,top});
      }
    }
  }
  const detail=addEastParkDetail(scene,{box:B,beam:L,materials,colliders,surface:S,sign,rand},{treeLocations,terrainIslands});
  const density=addParkDensity(scene,{box:B,beam:L,panel:api.panel,materials,colliders,surface:S,sign,rand});
  stats.density=density.stats;stats.authoredTrees+=density.stats.trees;stats.signs+=density.stats.signs;
  stats.detail=detail.stats;stats.signs+=detail.stats.signs;
  stats.pointLights=lights.length+detail.lights.length+density.lights.length;
  stats.colliders=colliders.length-before;
  const landmarks=[
    {id:'east_commons_pavilion',title:'东园栈亭',position:new T.Vector3(98,1.08,36)},
    {id:'east_wetland_boardwalk',title:'湿地栈道',position:new T.Vector3(114,.556,50.5)},
    {id:'east_loop_tram',title:'东园电车站',position:new T.Vector3(125,.36,6.8)},
  ];
  const routeToStairs=[[58,.18,24],[64.2,.36,24],[74,.36,24],[74,.36,50.5],[98,.36,50.5],[98,.36,43],...stairs,[98,1.08,36]];
  const crowdPaths=[
    {id:'east_park_west_walker',a:[74,30],b:[74,42.5],level:.36,look:1,speed:.62},
    {id:'east_park_south_walker',a:[96,68],b:[116,68],level:.36,look:0,speed:.70},
    {id:'east_park_east_walker',a:[122,29],b:[122,41],level:.36,look:2,speed:.64},
    {id:'east_park_last_train',a:[72.98,63.60],b:[74.46,64.52],level:.36,look:1,speed:.46},
    {id:'east_park_seed_worker',a:[74.6,-33.91],b:[75.84,-30.72],level:.36,look:2,speed:.50},
    {id:'east_park_produce_pickup',a:[119.68,90.40],b:[128.32,90.40],level:.36,look:0,speed:.63},
  ];
  const paths={
    bounds,parkLoop:[[74,.36,24],[122,.36,24],[122,.36,68],[74,.36,68],[74,.36,24]],
    pavilion:{waypoints:routeToStairs,stairs,landing:[98,1.08,36],floor:{...pavilion,y:1.08},
      roof:{minX:92.675,maxX:103.325,minZ:31.5,maxZ:40.5,minY:4.155,maxY:5.52},headProbe:[98,1.08,36]},
    wetland:{waypoints:[[74,.36,50.5],[105.4,.36,50.5],[106.2,.556,50.5],[114,.556,50.5]],
      pond:{...pond,bottom:.185,waterTop:.246,allowed:true,exitStep:.355},banks,boardwalk:{...boardwalk,y:.556},
      shallowProbe:[114,.185,46.5],bankApproach:[106.5,.36,47],bankDirection:[1,0]},
    tram:{waypoints:[[58,.18,0],[125,.18,0],[125,.18,5.6],[125,.36,6.8]],platform:{...tramPlatform,y:.36}},
    connections:{coreEast:[44,.18,0],midtown:[58,.18,-58.8],sohoCross:[44,.18,84],sohoSouth:[58,.18,96]},
    crowdPaths,terrainIslands,
  };
  const mapFeatures=[
    {id:'east-commons-green',name:'东园绿地',fill:'#3e6957',shape:{type:'polygon',points:[[72,22],[124,22],[124,70],[72,70]]}},
    {id:'east-commons-north',name:'北侧林地',fill:'#41614f',shape:{type:'polygon',points:[[72,-44],[124,-44],[124,-10],[72,-10]]}},
    {id:'east-commons-pond',name:'滞洪花园',fill:'#4c7778',shape:{type:'polygon',points:[[107.6,44],[120.2,44],[120.2,59.6],[107.6,59.6]]}},
    ...catchmentPools.map(({minX,maxX,minZ,maxZ},i)=>({id:'east-commons-catchment-'+i,name:'沉砂池',fill:'#618881',shape:{type:'polygon',points:[[minX,minZ],[maxX,minZ],[maxX,maxZ],[minX,maxZ]]}})),
  ];
  function setNight(night){for(const light of lights)light.intensity=light.userData.nightPower*(night?1:.15);detail.setNight(night);density.setNight(night);materials[cool].emissiveIntensity=night?1.4:.55;materials[warm].emissiveIntensity=night?.9:.45;}
  setNight(true);
  return {stats,landmarks,entries:[],paths,crowdPaths,mapFeatures,lights:[...lights,...detail.lights,...density.lights],setNight,kit:k,detail,density,update(dt,time){sampleWater(time);updateNightline(time);}};
}

function createRoofCopperTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const g=canvas.getContext('2d');
  g.fillStyle='#435958';g.fillRect(0,0,512,512);
  for(let x=0;x<512;x+=88){
    g.fillStyle='rgba(22,39,42,.22)';g.fillRect(x,0,1.5,512);
    g.fillStyle='rgba(139,156,142,.10)';g.fillRect(x+2,0,1,512);
  }
  for(let i=0;i<85;i++){
    const x=(i*83+17)%512,y=(i*127+31)%512;
    g.fillStyle=i%2?'rgba(133,153,139,.035)':'rgba(26,44,47,.045)';
    g.fillRect(x,y,1+i%3,28+i*17%151);
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.anisotropy=4;
  return texture;
}
