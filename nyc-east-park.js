import * as T from 'three';
import {createDistrictKit} from './nyc-district-kit.js';
import {addEastParkDetail} from './nyc-east-park-detail.js';
import {addParkDensity} from './nyc-park-density.js';

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
  for(const r of subtractAll(park,[...pavers,pond,pavilion,boardwalk]))layGround(r,'grass');
  const rendered=[];
  for(const r of pavers){for(const part of subtractAll(r,rendered)){layGround(part,paving);rendered.push(part);}registry.pavingExclusions.push(r);}

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
  B(water,113.9,.242,51.8,12.45,.008,15.45);
  const banks=[];
  function bank(r){
    solidFloor(r,.54,stone,'pond-bank',.18);banks.push({...r,top:.54});
    const alongX=r.maxX-r.minX>r.maxZ-r.minZ;
    const length=alongX?r.maxX-r.minX:r.maxZ-r.minZ;
    for(let t=.35;t<length;t+=.65){
      const x=alongX?r.minX+t:(r.minX+r.maxX)/2,z=alongX?(r.minZ+r.maxZ)/2:r.minZ+t;
      B(stone,x,.55,z,alongX?.60:.28,.02,alongX?.28:.60,0x9dab97);
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
  const treeLocations=[[78,28],[86,28],[116,28],[79,43],[79,64],[102,64],[118,64],
    [87,60],[109,65],[77,-36],[88,-35],[111,-35],[119,-15],[78,-14],
    [95,27.5],[93,63],[114,40.5],[81,-24.5],[99,-31],[116,-26]];
  for(let i=0;i<treeLocations.length;i++)smallTree(...treeLocations[i],.83+(i%4)*.065);
  function smallTree(x,z,scale){
    stats.authoredTrees++;
    B(soil,x,.41,z,1.5,.10,1.5,0x9caa8c);
    for(let y=.36;y<3.45*scale;y+=.38)B('bark',x+(Math.floor(y*4)%2)*.06,y+.19,z,.34*scale,.40,.34*scale,tint(.10));
    C(x,1.85*scale,z,.39*scale,3.0*scale,.39*scale,'tree-trunk');
    for(const e of [-1,1])L('bark',[x,2.1*scale,z],[x+e*.9*scale,3.35*scale,z+e*.33],.18*scale,.18*scale,0x9caa83);
    // Exposed cells of interlocking stepped clumps, rather than a smooth sphere
    // or large green cards. Both shades share the same muted leaf hue.
    const cell=.24+Math.max(0,Math.min(1,(scale-.83)/.195))*.03;
    const nx=Math.floor(2*1.34*scale/cell),ny=Math.max(4,Math.floor((4.655*scale-2.72)/cell));
    const occupied=new Set(),key=(ix,iy,iz)=>`${ix},${iy},${iz}`;
    for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nx;iz++){
      const t=iy/(ny-1),gx=ix-(nx-1)/2,gz=iz-(nx-1)/2;
      const rx=t<.22?2.8:t<.70?3.8:2.9,rz=t<.22?2.8:t<.70?3.5:2.8;
      const sx=t>.5?.8:-.4,sz=t>.55?-.5:.4;
      if(Math.abs(gx-sx)>rx||Math.abs(gz-sz)>rz)continue;
      if(Math.abs(gx-sx)>rx-.85&&Math.abs(gz-sz)>rz-.85)continue;
      occupied.add(key(ix,iy,iz));
    }
    // Two attached edge tufts keep even the shortest crown at 120 exposed cells.
    if(ny===4){occupied.add(key(0,0,4));occupied.add(key(nx-1,ny-1,4));}
    const neighbours=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    let count=0,minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for(const value of occupied){
      const [ix,iy,iz]=value.split(',').map(Number);
      if(neighbours.every(([dx,dy,dz])=>occupied.has(key(ix+dx,iy+dy,iz+dz))))continue;
      const xx=x+(ix-(nx-1)/2)*cell,yy=2.72+(iy+.5)*cell,zz=z+(iz-(nx-1)/2)*cell,size=cell*.97;
      const lit=iy>=ny*.60||(ix<nx*.28&&iz>nx*.30);
      B(lit?canopyLight:canopyShade,xx,yy,zz,size,size,size);
      count++;minY=Math.min(minY,yy-size/2);maxY=Math.max(maxY,yy+size/2);
      minX=Math.min(minX,xx-size/2);maxX=Math.max(maxX,xx+size/2);minZ=Math.min(minZ,zz-size/2);maxZ=Math.max(maxZ,zz+size/2);
    }
    stats.canopyCubes+=count;
    stats.treeGeometry.push({x,z,scale,cell,cubes:count,bounds:{minX,maxX,minY,maxY,minZ,maxZ}});
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
  for(const [x,z,w,d]of [[82,31,5,1.6],[111,31,5,1.4],[80,62,3,1.3],[112,63.5,3.4,1.3],[77,-31,3,1.3],[115,-31,4,1.4]]){
    B(soil,x,.43,z,w,.14,d,0x879378);
    for(let i=0;i<Math.floor(w*3);i++)B(i%4?'leaf':'darkLeaf',x+(rand()-.5)*(w-.2),.64+rand()*.10,z+(rand()-.5)*(d-.2),.38,.44,.36,tint(.16));
  }
  for(const [x,z,rotation]of [[83,64.5,0],[111,64.5,0],[77,36,Math.PI/2],[119,37,-Math.PI/2],[86,-16,0],[111,-16,0]])benchAt(x,z,rotation);
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

  // A few warm human-scale pools, never extra dynamic shadows or light rows.
  for(const [x,y,z,color,power,reach]of [[98,3.68,36,'#ffd09b',14,10],[123.5,3.45,6.6,'#91d4c8',18,10],[89,2.7,64,'#edc695',9,7]]){
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
  const density=addParkDensity(scene,{box:B,beam:L,materials,colliders,surface:S,sign,rand});
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
  ];
  const paths={
    bounds,parkLoop:[[74,.36,24],[122,.36,24],[122,.36,68],[74,.36,68],[74,.36,24]],
    pavilion:{waypoints:routeToStairs,stairs,landing:[98,1.08,36],floor:{...pavilion,y:1.08},
      roof:{minX:92.675,maxX:103.325,minZ:31.5,maxZ:40.5,minY:4.155,maxY:4.585},headProbe:[98,1.08,36]},
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
    {id:'east-commons-pond',name:'浅水湿地',fill:'#4c7778',shape:{type:'polygon',points:[[107.6,44],[120.2,44],[120.2,59.6],[107.6,59.6]]}},
  ];
  function setNight(night){for(const light of lights)light.intensity=light.userData.nightPower*(night?1:.15);detail.setNight(night);density.setNight(night);materials[cool].emissiveIntensity=night?1.4:.55;materials[warm].emissiveIntensity=night?.9:.45;}
  setNight(true);
  return {stats,landmarks,entries:[],paths,crowdPaths,mapFeatures,lights:[...lights,...detail.lights,...density.lights],setNight,kit:k,detail,density};
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
