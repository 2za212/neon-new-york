import * as T from 'three';

/** Mid-scale planted rooms: canopy groups, enclosing flower beds, an actual
 * greenhouse and a sheltered cafe. Original circulation stays entirely open. */
export function addParkDensity(scene,api){
  const {box,beam,materials,colliders,surface,sign,rand=Math.random}=api;
  const stats={boxes:0,beams:0,triangles:0,colliders:0,surfaces:0,trees:0,canopyCubes:0,
    shrubBeds:0,shrubClumps:0,greenhouses:1,cafeShelters:1,hills:1,pointLights:0,signs:0,independentDrawCalls:0};
  const fixtures=[],lights=[],trees=[],beds=[];
  const B=(...a)=>{stats.boxes++;stats.triangles+=12;box(...a);};
  const L=(...a)=>{stats.beams++;stats.triangles+=12;beam(...a);};
  const S=(...a)=>{stats.surfaces++;surface(...a);};
  const C=(x,y,z,w,h,d,id)=>{const b=new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2));b.userData={parkDensity:id};colliders.push(b);fixtures.push({id,bounds:{min:b.min.toArray(),max:b.max.toArray()}});stats.colliders++;return b;};
  const M=(key,source,opts={})=>{if(!materials[key]){const m=materials[source].clone();Object.assign(m,opts);m.userData={...materials[source].userData};m.name='NYC garden massing / '+key;materials[key]=m;}return key;};
  const iron=M('parkDensityIron','metal',{color:new T.Color('#bacac0'),roughness:.68,metalness:.4});
  const stone=M('parkDensityStone','stone',{color:new T.Color('#c6ccba'),roughness:.9});
  const wood=M('parkDensityCedar','wood',{color:new T.Color('#ddcdb0'),roughness:.86});
  const soil=M('parkDensitySoil','roof',{color:new T.Color('#847458'),roughness:1});
  const grass=M('parkDensityGrass','grass',{color:new T.Color('#d2dec6'),roughness:1});
  const leaf=M('parkDensityLeaf','leaf',{color:new T.Color('#68865f'),roughness:1});
  const litLeaf=M('parkDensityLeafLit','leaf',{color:new T.Color('#82956c'),roughness:1});
  const shadeLeaf=M('parkDensityLeafShade','leaf',{color:new T.Color('#526f58'),roughness:1});
  const flower=M('parkDensityFlower','leaf',{color:new T.Color('#bc8c9b'),roughness:1});
  const paleFlower=M('parkDensityPaleFlower','leaf',{color:new T.Color('#c6bca0'),roughness:1});
  const glass=M('parkDensityGlass','districtGlass',{color:new T.Color('#b3d4c8'),transparent:true,opacity:.24,depthWrite:false,roughness:.21,metalness:.05});
  const warm=M('parkDensityAmber','lamp',{color:new T.Color('#f4d8b0'),emissive:new T.Color('#ffd092'),emissiveIntensity:1.25,roughness:.55});
  const cyan=M('parkDensityCyan','cyan',{color:new T.Color('#9ce0d6'),emissive:new T.Color('#69c9cd'),emissiveIntensity:1.4,roughness:.5});
  const canvas=M('parkDensityCanvas','trim',{color:new T.Color('#849b87'),roughness:1});
  for(const key of [glass,warm,cyan])materials[key].userData.castShadow=false;
  const tint=(s=.1)=>new T.Color().setScalar(1-s/2+rand()*s);
  function label(x,y,z,w,h,title,sub,rot=0,color='#c8d4b9'){if(!sign)return;const mesh=sign(x,y,z,w,h,title,sub,color,rot);if(mesh)mesh.material.emissiveIntensity=.65;stats.signs++;}
  function slab(id,x,z,w,d,bottom,top,mat){B(mat,x,(bottom+top)/2,z,w,top-bottom,d);C(x,(bottom+top)/2,z,w,top-bottom,d,id);S(x-w/2,x+w/2,z-d/2,z+d/2,top);}
  function point(x,y,z,color,power,reach,name){const l=new T.PointLight(color,power,reach,2);l.position.set(x,y,z);l.castShadow=false;l.userData.nightPower=power;l.name='NYC garden / '+name;scene.add(l);lights.push(l);}

  // A three-riser grass knoll forms the middle-distance screen beyond the
  // pavilion. Its 0.18m steps are solid, walkable and outside the old 3 islands.
  const hill={id:'garden-knoll',parts:[
    {minX:91.5,maxX:105,minZ:54.5,maxZ:63,bottom:.36,top:.54},
    {minX:92.3,maxX:104,minZ:55.2,maxZ:62.2,bottom:.54,top:.72},
    {minX:93.1,maxX:102.7,minZ:56,maxZ:61.4,bottom:.72,top:.90}
  ],waypoints:[[92.4,.36,64.3],[92.4,.54,62.7],[92.7,.72,61.8],[93.9,.90,60.6]]};
  for(const p of hill.parts){
    const x=(p.minX+p.maxX)/2,z=(p.minZ+p.maxZ)/2,w=p.maxX-p.minX,d=p.maxZ-p.minZ;
    B(soil,x,(p.bottom+p.top-.025)/2,z,w,p.top-p.bottom-.025,d);
    B(grass,x,p.top-.0125,z,w,.025,d);C(x,(p.bottom+p.top)/2,z,w,p.top-p.bottom,d,hill.id);S(p.minX,p.maxX,p.minZ,p.maxZ,p.top);
    for(const zz of [p.minZ+.035,p.maxZ-.035])for(let xx=p.minX+.2;xx<p.maxX-.1;xx+=.48)B(stone,xx,p.top-.09,zz,.17,.05,.06,tint(.20));
  }
  const terrainLevel=(x,z)=>{let level=.36;for(const p of hill.parts)if(x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ)level=p.top;return level;};

  // The canopy positions are groups rather than a regular grid. Dense lower
  // shrubs provide the eye-level enclosure; leaves remain 23–25cm cubes.
  const treeDefs=[
    [77.8,25.8,2],[77.1,32,1],[77.8,39.7,2],[77.2,47.2,1],[77.3,53.8,2],
    [77.1,60.7,2],[78.4,65.7,1],[83.5,65.2,2],[92.2,65.4,1],[100.7,65.3,2],
    [81.3,33.6,0],[82.8,38.6,1],[84.8,40.8,2],[88.9,35.3,0],
    [90.8,54.8,1],[95.1,55.2,2],[99.6,56.8,0],[103.3,58.7,2],[96.5,63.4,1],
    [106.5,32.0,2],[108.1,37.5,0],[115.7,35.6,1],[117.3,40.8,2],
    [75.7,-39.2,1],[83.5,-40,2],[95,-39,0],[104.5,-38.6,2],[121.4,-31.4,1],[121,-39.6,2],[75.9,-27.8,0]
  ];
  function groveTree(x,z,kind,index){
    let base=terrainLevel(x,z);
    // Existing terrace volumes stay authoritative where the new trunks sit.
    if(x>=78.8&&x<=89.2&&z>=30&&z<=41)base=Math.max(base,.54);
    if(x>=80.9&&x<=87.8&&z>=32.5&&z<=39.8)base=Math.max(base,.72);
    if(x>=105.2&&x<=115.1&&z>=30&&z<=36.5)base=Math.max(base,.54);
    const crown=kind===0?4.3:kind===1?5.8:7.2,trunkTop=base+crown-.08;
    for(let y=base;y<trunkTop;y+=.42)B('bark',x+(Math.floor(y*3)%2)*.025,y+.21,z,.30,.43,.30,tint(.12));
    C(x,(base+trunkTop)/2,z,.36,trunkTop-base,.36,'grove-trunk-'+index);
    const cell=.29+kind*.025,clumps=[[-.92,.12,.08],[.84,.29,.28],[.05,-.84,.55],[.02,.02,.92]],nx=kind===2?5:4,ny=3,nz=4;
    for(const [dx,dz,dy]of clumps){
      const angle=index*2.40,spread=1.28+.12*(index%4);
      const branchX=(dx*Math.cos(angle)-dz*Math.sin(angle))*spread,branchZ=(dx*Math.sin(angle)+dz*Math.cos(angle))*spread;
      L('bark',[x,base+crown-1.0,z],[x+branchX,base+crown+dy-.17,z+branchZ],.14,.14);
      for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
        if(ix>0&&ix<nx-1&&iy>0&&iy<ny-1&&iz>0&&iz<nz-1)continue;
        if((ix===0||ix===nx-1)&&(iz===0||iz===nz-1)&&iy===ny-1)continue;
        const xx=x+branchX+(ix-(nx-1)/2)*cell,yy=base+crown+dy+(iy-1)*cell,zz=z+branchZ+(iz-1.5)*cell;
        B(iy===2?litLeaf:(ix+index)%3?leaf:shadeLeaf,xx,yy,zz,cell*.97,cell*.97,cell*.97,tint(.065));stats.canopyCubes++;
      }
    }
    if(index<10){
      // The avenue of trees has overlapping upper boughs and open trunks.
      // Two offset lobes retain a stepped outline above the pedestrian clearway.
      const span=kind===2?5.8:4.9;
      for(const side of [-1,1]){
        const bx=x+side*.72,bz=z+side*.94,by=base+crown-.25;
        L('bark',[x,by-1.6,z],[bx,by,bz],.21,.18);
        B(shadeLeaf,bx,by,bz,span*.66,.70,span*.77);
        B(leaf,bx,by+.59,bz,span,.54,span*.85);
        B(litLeaf,bx+.35*side,by+1.02,bz,span*.65,.38,span*.62);
      }
    }
    for(const a of [.3,2.4,4.5])L('bark',[x,base+.22,z],[x+Math.cos(a)*.56,base+.045,z+Math.sin(a)*.56],.08,.09,tint(.14));
    stats.trees++;trees.push({x,z,base,height:crown+1.0,kind,colliderId:'grove-trunk-'+index});
  }
  treeDefs.forEach((d,i)=>groveTree(...d,i));
  // Interrupted drifts of sedge and exposed aggregate trace the terrace toes.
  // Place tufts on the sampled step, so none hang above a neighbouring riser.
  for(const [cx,cz] of [[93,63.3],[96.6,63.5],[101,63.4],[104,61],[91.3,59],[91.4,56],[89.2,64.4],[86.6,65.2]]){
    for(let i=0;i<12;i++){
      const x=cx+Math.sin(i*2.4)*(.2+i*.071),z=cz+Math.cos(i*2.4)*(.18+i*.047),y=terrainLevel(x,z);
      if(i%4===0){B(stone,x,y+.042,z,.19,.084,.13,0xaab5ab);continue;}
      for(let blade=0;blade<3;blade++){
        const angle=blade*2.1+i,dx=Math.cos(angle)*.10,dz=Math.sin(angle)*.10;
        L(blade===1?litLeaf:leaf,[x,y,z],[x+dx,y+.12+(i%3)*.045,z+dz],.037,.055);
      }
      if(i%3===0)B(paleFlower,x+.06,y+.19,z,.07,.045,.06);
    }
  }

  // Large, stepped clusters leave exact breaks at entries, fixtures and all
  // loop routes. Dark internal masses are covered by small exposed leaf cells.
  const bedDefs=[
    ['west-boundary',70.6,40.7,1.30,8.0,.18,.98],
    ['west-hill',80.5,35.4,1.35,7.2,.54,1.05],
    ['west-hill-return',84.7,40.6,7.2,.80,.54,.86],
    ['east-hill-return',107.0,35.7,1.3,4.7,.54,.98],
    ['east-canopy',116,37.9,1.3,3.7,.36,1.05],
    ['knoll-west',91.85,58.5,1.25,4.7,.54,.92],
    ['knoll-north',100.7,54.9,6.3,.85,.54,.82],
    ['south-border-west',81,71.0,10.2,1.25,.18,.99],
    ['south-border-east',99.2,71.0,10.3,1.25,.18,.93],
    ['north-border-west',81.8,20.7,10.2,1.1,.18,.92],
    ['north-border-east',106.4,20.7,26.1,1.1,.18,.93],
    ['east-boundary',125.5,37.4,1.1,10.8,.18,.92],
    ['north-grove-west',70.7,-31.9,1.35,17.2,.18,1.12],
    ['north-grove-back',99.3,-42.3,41.3,1.25,.36,.91]
  ];
  function shrubBed(id,x,z,w,d,base,height){
    const bottom=base,soilTop=base+.18;
    B(soil,x,base+.09,z,w,.18,d);C(x,base+.09,z,w,.18,d,id+'-bed');
    // One physical aggregate per continuous hedge, rather than hundreds of
    // one-leaf colliders. Bounds stop at the actual visible planted volume.
    C(x,soilTop+height/2,z,w,height,d,id+'-shrubs');
    const alongX=w>=d,len=alongX?w:d,across=alongX?d:w,n=Math.max(1,Math.ceil(len/1.08)),rows=across>1.3?2:1;
    for(let i=0;i<n;i++)for(let row=0;row<rows;row++){
      const u=-len/2+(i+.5)*len/n,v=(row-(rows-1)/2)*.64;
      const xx=x+(alongX?u:v),zz=z+(alongX?v:u),h=height*(.76+rand()*.22);
      B(shadeLeaf,xx,soilTop+h*.36,zz,alongX?.82:.56,h*.67,alongX?.56:.82,tint(.1));
      for(let q=0;q<3;q++)for(const side of [-1,1]){
        const a=(q-1)*.25,b=side*.33,px=xx+(alongX?a:b),pz=zz+(alongX?b:a);
        B((i+q)%4?leaf:litLeaf,px,soilTop+h*.59,pz,.24,.24,.24,tint(.1));
      }
      for(let q=0;q<6;q++){
        const px=xx+(alongX?(q%3-1)*.25:(Math.floor(q/3)-.5)*.27),pz=zz+(alongX?(Math.floor(q/3)-.5)*.27:(q%3-1)*.25);
        B(q%3?litLeaf:leaf,px,soilTop+h-.12,pz,.24,.24,.24,tint(.10));
        if((i+row)%3===0&&q%2===0)B(id.includes('north')?paleFlower:flower,px+.03,soilTop+h+.015,pz,.10,.10,.10,tint(.1));
      }
      stats.shrubClumps++;
    }
    // Low coping segments read as actual stepped beds, rather than foliage
    // cards painted across the edge of asphalt. They share the soil footprint.
    for(const e of [-1,1])B(stone,x+(alongX?0:e*w/2),soilTop-.02,z+(alongX?e*d/2:0),alongX?w:.10,.12,alongX?.10:d,tint(.1));
    stats.shrubBeds++;beds.push({id,bounds:{minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2},base,height:height+.18});
  }
  bedDefs.forEach(d=>shrubBed(...d));

  // The north horticulture house is a volume in the city skyline: transparent
  // stepped glass roof, dark cast-iron ribs and an open 1.8m entrance aisle.
  const greenhouse={id:'commons-greenhouse',bounds:{minX:88.5,maxX:100.5,minZ:-29.9,maxZ:-24.5},floor:.39,
    door:{x:94.5,z:-24.5,width:1.8,height:2.65},waypoints:[[94.5,.36,-20],[94.5,.39,-23.6],[94.5,.39,-25.7],[94.5,.39,-28.1]]};
  slab('greenhouse-floor',94.5,-27.2,12.4,5.8,.21,.39,stone);
  // Join to the existing north path without changing that path's collision.
  slab('greenhouse-apron',94.5,-23.15,2.0,2.3,.21,.39,stone);
  for(const x of [88.5,100.5]){
    B(iron,x,.67,-27.2,.18,.56,5.4);C(x,.67,-27.2,.18,.56,5.4,'greenhouse-side-base');
    B(glass,x,2.12,-27.2,.035,2.9,5.3);C(x,2.12,-27.2,.08,2.9,5.3,'greenhouse-side-glass');
    for(let z=-29.9;z<=-24.4;z+=.9)B(iron,x,1.95,z,.11,3.12,.11);
  }
  for(const z of [-29.9,-24.5]){
    const south=z>-25;
    for(const [a,b]of south?[[88.5,93.6],[95.4,100.5]]:[[88.5,100.5]]){
      B(iron,(a+b)/2,.67,z,b-a,.56,.18);C((a+b)/2,.67,z,b-a,.56,.18,'greenhouse-end-base');
      B(glass,(a+b)/2,2.12,z,b-a-.12,2.9,.035);C((a+b)/2,2.12,z,b-a-.12,2.9,.08,'greenhouse-end-glass');
      for(let x=a;x<=b+.001;x+=1.03)B(iron,x,1.95,z,.09,3.12,.11);
    }
    B(iron,94.5,3.55,z,12.12,.16,.14);
    if(south){B(iron,94.5,3.16,z,1.90,.12,.16);C(94.5,3.16,z,1.90,.12,.16,'greenhouse-door-header');}
  }
  // Ten glass strips make a stepped gable. Their real roof metadata is emitted
  // by the same batch API and each pane has its own physical thin solid.
  for(let i=0;i<10;i++){
    const z=-30.1+(i+.5)*.58,y=3.57+(1-Math.abs(z+27.2)/2.9)*.88;
    B(glass,94.5,y,z,12.5,.06,.59);C(94.5,y,z,12.5,.06,.59,'greenhouse-roof-pane');
    for(const x of [88.3,90.35,92.42,94.5,96.58,98.65,100.7])B(iron,x,y+.045,z,.065,.065,.62);
    if(i<9){const nextZ=z+.58,nextY=3.57+(1-Math.abs(nextZ+27.2)/2.9)*.88;
      B(glass,94.5,(y+nextY)/2,z+.29,12.5,Math.abs(nextY-y)+.04,.025);
    }
  }
  for(const z of [-29.98,-24.42])for(let i=0;i<8;i++){
    const x=88.5+(i+.5)*1.5;B(iron,x,3.53,z,1.42,.065,.10);
  }
  B(iron,94.5,4.49,-27.2,12.65,.10,.14);B(cyan,94.5,4.425,-27.2,10.8,.022,.055);
  // Knee-high working benches and full nursery trays fill the greenhouse's
  // sides; the central x93.3..95.7 aisle is kept free all the way to the back.
  function nurseryBed(id,x,z,w,d,top=.94){
    B(wood,x,(.39+top)/2,z,w,top-.39,d);C(x,(.39+top)/2,z,w,top-.39,d,id);
    B(soil,x,top+.018,z,w-.13,.035,d-.13);
    for(let xx=x-w/2+.23;xx<x+w/2-.12;xx+=.38)for(let zz=z-d/2+.22;zz<z+d/2-.12;zz+=.4){
      B(iron,xx,top+.09,zz,.22,.12,.22,tint(.12));
      B(leaf,xx,top+.22,zz,.24,.19,.24,tint(.15));
      if(Math.round(xx*10+zz*10)%3===0)B(litLeaf,xx+.05,top+.34,zz,.17,.15,.17,tint(.12));
    }
  }
  nurseryBed('greenhouse-west-stock',90.55,-27.35,3.05,3.9);
  nurseryBed('greenhouse-east-stock',98.45,-27.35,3.05,3.9);
  nurseryBed('nursery-bed-a',106.4,-27.5,3.4,3.8,.76);
  nurseryBed('nursery-bed-b',111.7,-27.5,3.4,3.8,.76);
  for(const x of [90.55,98.45]){
    B(iron,x,3.35,-27.3,.04,.35,.04);B(warm,x,3.13,-27.3,1.1,.045,.26);
  }
  label(94.5,3.50,-24.35,3.3,.38,'COMMONS / GROW HOUSE','CITY GARDENERS  /  PUBLIC NURSERY',0);
  point(94.5,3.20,-26.3,'#ffd0a2',14,9,'greenhouse work lamps');

  // A real open-front neighbourhood coffee room fills the south garden edge,
  // with a tall canopy, planting backs and enough empty space for walking.
  const cafe={id:'garden-coffee-shelter',bounds:{minX:105,maxX:119,minZ:72.0,maxZ:76.9},floor:.36,
    waypoints:[[112,.36,68],[112,.36,71.0],[112,.36,73.6]]};
  slab('cafe-paving',112,74.45,14,4.9,.18,.36,stone);
  slab('cafe-entry-apron',112,71,3.6,2.0,.18,.36,stone);
  for(const x of [105.3,118.7])for(const z of [72.3,76.6]){
    B(iron,x,1.98,z,.18,3.24,.18);C(x,1.98,z,.24,3.24,.24,'cafe-column');
    B(stone,x,.51,z,.43,.30,.43);C(x,.51,z,.43,.30,.43,'cafe-column-foot');
  }
  for(let x=105.05;x<119;x+=.47)B(wood,x,3.58,74.45,.15,.18,5.1);
  B(iron,112,3.47,72.1,14.2,.18,.20);B(iron,112,3.47,76.8,14.2,.18,.20);
  B(canvas,112,3.72,74.45,14.35,.12,5.2);C(112,3.72,74.45,14.35,.12,5.2,'cafe-roof');
  for(const x of [107,116.7])B(warm,x,3.31,74.4,1.2,.035,.33);
  // The serving counter and back stock stand at the west edge, leaving the
  // central/public eastern two thirds open rather than a closed opaque kiosk.
  B(iron,107.15,.90,75.25,3.0,1.08,1.04);B(wood,107.15,1.47,75.25,3.18,.10,1.18);C(107.15,.96,75.25,3.18,1.20,1.18,'cafe-counter');
  B(iron,106.6,1.84,75.3,.70,.70,.56);B(cyan,106.6,1.89,75.61,.48,.25,.035);
  for(let j=0;j<5;j++)B(stone,107.2+j*.18,1.61,75.35,.13,.18,.13,tint(.12));
  for(const x of [115.2,117.15]){
    B(iron,x,.83,75.4,.14,.94,.14);B(wood,x,1.31,75.4,1.2,.08,.80);C(x,.86,75.4,1.2,.98,.80,'cafe-table');
    for(const z of [74.55,76.2]){B(wood,x,.81,z,.65,.09,.48);B(iron,x,.58,z,.12,.46,.12);C(x,.60,z,.65,.48,.48,'cafe-stool');}
  }
  label(106.95,2.28,75.90,2.80,.38,'COMMONS COFFEE','GARDEN  /  NEIGHBOURHOOD',0,'#d0c3a0');
  point(113.5,3.22,74.4,'#ffd0a0',13,9,'garden coffee canopy');

  // Iron garden boundaries lie in the beds, never across an entrance. Small
  // rail groups interrupt long open views without becoming a city-wide wall.
  function fence(x0,z0,x1,z1,id){
    const length=Math.hypot(x1-x0,z1-z0),count=Math.ceil(length/1.3);
    for(let i=0;i<=count;i++){const t=i/count,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;B(iron,x,.94,z,.075,1.16,.075);}
    L(iron,[x0,1.48,z0],[x1,1.48,z1],.08,.08);L(iron,[x0,.83,z0],[x1,.83,z1],.055,.055);
    C((x0+x1)/2,.94,(z0+z1)/2,Math.abs(x1-x0)+.08,1.16,Math.abs(z1-z0)+.08,id);
  }
  fence(76.7,20.2,86.9,20.2,'garden-north-west-rail');fence(93.0,20.2,120.0,20.2,'garden-north-east-rail');
  fence(76.0,71.6,86.4,71.6,'garden-south-west-rail');fence(93.9,71.6,104.4,71.6,'garden-south-east-rail');
  stats.pointLights=lights.length;
  function setNight(night){for(const l of lights)l.intensity=l.userData.nightPower*(night?1:.12);materials[warm].emissiveIntensity=night?1.25:.45;materials[cyan].emissiveIntensity=night?1.4:.55;}
  setNight(true);
  return {stats,lights,fixtures,trees,beds,hill,greenhouse,cafe,setNight,emissives:[warm,cyan].map(key=>({key,material:materials[key]})),
    observation:{greenhouse:[94.5,1.8,-21.5],grove:[76.2,1.8,40],southGarden:[98,2.0,50.5],coffee:[112,1.8,69.8]}};
}
