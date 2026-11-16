import * as T from 'three';

/** The spawn sample's ground and secondary service space, in metres.
 * Add to the shared architectural batch before finish(); no independent mesh.
 */
export function addSampleStreet(scene,{box,beam,materials,colliders,surface,sign,rand=Math.random}) {
  const stats={boxes:0,beams:0,triangles:0,colliders:0,surfaces:0,signs:0,
    sidewalkSlabs:0,alleyPavers:0,microdetailClusters:2,lights:1,pointLights:1,independentDrawCalls:0};
  const lights=[];
  const B=(...args)=>{stats.boxes++;box(...args);};
  const L=(...args)=>{stats.beams++;beam(...args);};
  const S=(...args)=>{surface(...args);stats.surfaces++;};
  function C(x,y,z,w,h,d){colliders.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));stats.colliders++;}
  function material(name,source,options={},meters){
    if(materials[name])return name;
    const m=(materials[source]||materials.concrete).clone();Object.assign(m,options);
    m.name='NYC spawn street / '+name;m.userData={...m.userData};
    if(meters)m.userData.textureMeters=meters;
    materials[name]=m;return name;
  }
  const slab=material('sampleStreetSlab','concrete',{color:new T.Color(0xa2aaa2),roughness:.96,metalness:0},3.8);
  const slabAlt=material('sampleStreetSlabAlt','concrete',{color:new T.Color(0x929e99),roughness:.94,metalness:0},3.8);
  const basalt=material('sampleStreetBasalt','stone',{color:new T.Color(0x4a6068),roughness:.84,metalness:.025},1.8);
  const mortar=material('sampleStreetMortar','concrete',{color:new T.Color(0x536469),roughness:.98,metalness:0},2);
  const paver=material('sampleStreetCourtPaver','paver',{color:new T.Color(0x9d9f8e),roughness:.96,metalness:0},3.4);
  const zinc=material('sampleStreetZinc','metal',{color:new T.Color(0x7f9691),roughness:.79,metalness:.35});
  const rust=material('sampleStreetRust','metal',{color:new T.Color(0x85725b),roughness:.96,metalness:.08});
  const paper=material('sampleStreetPaper','white',{color:new T.Color(0xd0c7aa),roughness:.98,metalness:0});
  const servicePaint=material('sampleStreetServicePaint','metal',{color:new T.Color(0x72857c),roughness:.94,roughnessMap:null,metalness:.06});
  const serviceGlow=material('sampleStreetServiceGlow','lamp',{color:new T.Color(0xb7a683),emissive:new T.Color(0xffba7b),emissiveIntensity:.32,roughness:.62});
  const roadTexture=materials.asphalt.map || createRoadTexture(rand);
  const road=material('sampleStreetDryAsphalt','asphalt',{map:roadTexture,color:new T.Color(0xffffff),roughness:.95,metalness:.015},3.4);
  const wet=material('sampleStreetWetCurb','asphalt',{map:roadTexture,color:new T.Color(0x7e969e),roughness:.66,metalness:.035},3.4);
  const tar=material('sampleStreetTarRepair','asphalt',{map:roadTexture,color:new T.Color(0x788992),roughness:.83,metalness:0},2.6);
  const oil=material('sampleStreetOldOil','asphalt',{map:createOilTexture(rand),color:new T.Color(0xffffff),transparent:true,opacity:.25,depthWrite:false,roughness:.62,metalness:.025});
  materials[oil].userData.unitUV=true;materials[oil].userData.castShadow=false;
  const shade=(spread=.10)=>new T.Color().setScalar(1-spread/2+rand()*spread);

  // The coherent NY sidewalk is two adult-scale slab rows, with a dark shop
  // edge rather than random furniture scattered through the movement lane.
  const cart={minX:9,maxX:11.33,minZ:17.9,maxZ:22.5};
  function intersects(a,b){return a.minX<b.maxX&&a.maxX>b.minX&&a.minZ<b.maxZ&&a.maxZ>b.minZ;}
  function treePit(a,x,z){const px=Math.max(a.minX,Math.min(a.maxX,x)),pz=Math.max(a.minZ,Math.min(a.maxZ,z));return (px-x)**2+(pz-z)**2<1.04**2;}
  for(const side of [-1,1]){
    const minX=side<0?-10.6:6.7,maxX=side<0?-6.7:10.6;
    B(mortar,(minX+maxX)/2,.3675,26.5,3.9,.015,25);
    for(let row=0;row<2;row++)for(let z0=14;z0<39;z0+=2.38){
      const x0=minX+.035+row*1.94,x1=Math.min(x0+1.90,maxX-.035),z1=Math.min(z0+2.345,39);
      const tile={minX:x0,maxX:x1,minZ:z0+.025,maxZ:z1};
      if((side>0&&intersects(tile,cart))||treePit(tile,side*8.2,18)||treePit(tile,side*8.2,39))continue;
      B((row+Math.floor(z0))%4===0?slabAlt:slab,(x0+x1)/2,.375,(tile.minZ+tile.maxZ)/2,x1-x0,.010,tile.maxZ-tile.minZ,shade(.055));stats.sidewalkSlabs++;
    }
    // Narrow apron at the shop wall stays well outside x=+/-8.85 +/- .48.
    const edgeX=side*10.43;
    for(const [a,b]of side>0?[[14,17.7],[22.65,39]]:[[14,39]]){
      for(let z=a;z<b;z+=1.2){const end=Math.min(z+1.17,b);B(basalt,edgeX,.376,(z+end)/2,.27,.016,end-z,shade(.08));}
    }
    S(minX,maxX,14,39,.38);
  }

  // A real three-row paved side alley, with a shallow threshold and a reserved
  // continuous centre. Its .39m surface is only 3cm above the existing sidewalk.
  B(mortar,15.225,.368,24.375,9.15,.016,3.45);
  for(let x0=10.69;x0<19.77;x0+=1.30)for(let row=0;row<3;row++){
    const x1=Math.min(x0+1.27,19.77),z0=22.69+row*1.125,z1=Math.min(z0+1.09,26.06);
    B((row+Math.round(x0))%4===0?slabAlt:paver,(x0+x1)/2,.383,(z0+z1)/2,x1-x0,.014,z1-z0,shade(.07));stats.alleyPavers++;
  }
  B(basalt,10.62,.378,24.375,.24,.024,3.45,0xb0b8a9);
  for(const z of [22.78,25.97])B(basalt,15.25,.381,z,9.0,.018,.15,0x8c9d94);
  S(10.50,19.8,22.65,26.1,.39);

  // The bent drainage channel collects at the south wall, outside the clear
  // centre and below the paving cap. Grate slots are actual recessed geometry.
  B('rubber',12.05,.380,22.91,1.80,.012,.28,0x7d8f91);
  for(let i=0;i<12;i++)B(zinc,11.24+i*.147,.386,22.91,.040,.006,.25,0x8a9a91);
  flatStrip('rubber',12.92,22.91,13.43,23.06,.15,.383);
  flatStrip(zinc,12.92,22.86,13.43,23.01,.025,.386);
  function flatStrip(mat,x0,z0,x1,z1,width,top){
    const dx=x1-x0,dz=z1-z0;B(mat,(x0+x1)/2,top-.003,(z0+z1)/2,Math.hypot(dx,dz),.006,width,0x91a096,-Math.atan2(dz,dx));
  }

  // Pipes and shallow service cabinets hug the two alley boundary walls.
  for(const x of [12.5,17.8]){
    B(zinc,x,1.72,22.76,.095,2.40,.095);
    for(const y of [.76,1.9,2.78])B('metal',x,y,22.72,.24,.075,.19,0x84988d);
    B(rust,x+.17,.60,22.77,.42,.11,.13);
  }
  B(zinc,15.15,2.54,22.79,1.20,.68,.22);
  B('rubber',15.15,2.54,22.912,1.03,.49,.018,0x9aaba3);
  for(let i=0;i<5;i++)B('metal',15.15,2.35+i*.092,22.936,1.00,.032,.045,0x9baaa0);
  C(15.15,2.54,22.79,1.2,.68,.22);
  B(zinc,16.9,1.63,26.0,.96,1.62,.16);
  B('rubber',16.9,1.64,25.906,.73,1.35,.025,0x8eaaa2);
  for(const y of [1.12,1.84])B('metal',16.9,y,25.887,.65,.045,.025,0x9aada1);
  C(16.9,1.63,26.0,.96,1.62,.16);
  // Non-emissive laundry notices have paper sheets, faded headings and staples.
  B(zinc,13.8,1.92,26.02,1.42,1.16,.12);
  B('rubber',13.8,1.92,25.945,1.28,1.03,.025,0x718a86);
  for(let i=0;i<4;i++){
    const x=13.44+(i%2)*.69,y=i<2?2.18:1.68;
    B(paper,x,y,25.923,.53,.42,.012,i%2?0xb9c2b0:0xc8bf9f);
    for(let line=0;line<3;line++)B('rubber',x,y+.09-line*.085,25.913,.36-line*.045,.019,.009,0xa2b8b2);
  }
  if(sign){sign(13.8,2.74,26.01,1.42,.36,'LAUNDRY / 2F','SERVICE COURT','#b8c3ad',Math.PI);stats.signs++;}

  // End-of-court service door and returns are all beyond x=19.2; the walking
  // target at 18.75 remains free. The back-wall belongs to the shell module.
  B(basalt,19.79,.43,24.4,.52,.08,1.98);
  B('metal',19.65,1.84,24.4,.14,2.90,1.72,0x76908d);
  B(servicePaint,19.56,1.83,24.4,.035,2.62,1.47);
  for(const z of [23.48,25.32])B(basalt,19.80,1.87,z,.58,3.02,.20,0xa8b19e);
  B(basalt,19.8,3.37,24.4,.58,.18,2.04);
  B('rubber',19.534,1.28,24.91,.030,.095,.28,0xb3c0ad);
  B('metal',19.515,1.29,24.92,.022,.07,.18,0xc1c8ae);
  for(let i=0;i<6;i++)B('rubber',19.535,2.45+i*.055,24.4,.024,.022,.95,0x90aaa3);
  C(19.65,1.84,24.4,.26,2.90,1.92);
  // One small downlit service hood reveals the closed end from the street.
  // It mounts ahead of the x=19.52 door face, above all character headroom.
  B('metal',19.66,3.02,24.4,.08,.30,.28,0x8e9e92);
  B(zinc,19.43,3.11,24.4,.33,.12,.54);
  for(const z of [24.14,24.66])B(zinc,19.43,3.04,z,.35,.16,.045);
  B(serviceGlow,19.40,3.025,24.4,.23,.025,.35,0xb9ae8f);
  const serviceLight=new T.PointLight('#ffd0a0',4.5,5.5,2);
  serviceLight.position.set(19.10,2.90,24.4);serviceLight.castShadow=false;
  serviceLight.name='NYC sample / warm service door light';serviceLight.userData.nightPower=4.5;
  scene.add(serviceLight);lights.push(serviceLight);
  B('wood',19.45,.77,25.68,.50,.76,.52,0xb1a082);
  B(zinc,19.45,1.18,25.68,.56,.08,.56,0x8fa294);
  C(19.45,.81,25.68,.56,.84,.56);

  // Exactly two small purposeful clusters outside the clear sidewalk lanes.
  // Record-shop deliveries leave its actual z32.25 entrance untouched.
  for(const [x,z,w,h,d]of [[-10.37,35.45,.46,.35,.58],[-10.30,36.00,.57,.38,.38],[-10.37,35.46,.36,.18,.43]]){
    const y=z===35.46?.39+.35+h/2:.39+h/2;
    B('wood',x,y,z,w,h,d,0xb0a081);B(paper,x+.001,y+h/2+.006,z,w*.12,.009,d,0xa8aa98);
  }
  C(-10.31,.665,35.67,.65,.55,1.04);
  bicycle(10.15,35.70);
  function bicycle(x,z){
    B(zinc,x,.48,z,.12,.18,1.90);
    for(const zz of [z-.70,z+.70]){
      for(let i=0;i<10;i++){
        const a=i*Math.PI/5,b=(i+1)*Math.PI/5;
        L('rubber',[x,.79+Math.sin(a)*.34,zz+Math.cos(a)*.34],[x,.79+Math.sin(b)*.34,zz+Math.cos(b)*.34],.065,.065,0x8c9e98);
      }
      L('metal',[x,.79,zz],[x,1.12,zz-.03],.035,.035,0xa4b4a6);
      L('metal',[x,.79,zz],[x,.79,zz+.30],.025,.025,0xa4b4a6);
    }
    for(const [a,b]of [
      [[x,.80,z-.70],[x,1.20,z-.26]],[[x,1.20,z-.26],[x,.82,z+.16]],
      [[x,.82,z+.16],[x,.80,z-.70]],[[x,1.20,z-.26],[x,1.22,z+.40]],
      [[x,1.22,z+.40],[x,.82,z+.16]],[[x,1.22,z+.40],[x,.80,z+.70]],
    ])L(zinc,a,b,.050,.050,0x8fa89d);
    B('rubber',x,1.30,z-.27,.22,.08,.32,0x9da99a);
    L('metal',[x,1.22,z+.40],[x,1.47,z+.47],.045,.045,0x9bb1a4);
    B('metal',x,1.48,z+.47,.48,.045,.07,0x9bb1a4);
    C(x,1.02,z,.66,1.30,2.15);
  }

  // Low, low-contrast asphalt layer stays under the original paint height.
  // Repairs and stains never cross either the double-yellow or x=+/-5.8 marks.
  B(road,0,.182,26.5,12.8,.006,25);
  for(const side of [-1,1])for(const [a,b]of [[14.2,20.9],[26.3,32.9],[38.0,38.8]]){
    B(wet,side*5.43,.190,(a+b)/2,.42,.008,b-a,0xb5c0bc);
  }
  for(const [x,z,len,angle]of [[-3.3,27.1,2.2,.18],[2.6,32.7,1.7,-.23],[-2.7,17.0,1.5,-.12]]){
    for(let i=0;i<4;i++)B(tar,x+(i-1.5)*.11,.191,z+(rand()-.5)*.12,.12,.006,len*(.65+rand()*.35),shade(.06),angle);
  }
  for(const [x,z,w,d]of [[3.45,28.8,1.40,2.20],[-3.85,20.4,1.1,1.7]])B(oil,x,.196,z,w,.004,d,0xffffff);

  const paths={
    alley:{bounds:{minX:10.65,maxX:19.8,minZ:22.65,maxZ:26.1},groundY:.39,
      clear:{minX:10.65,maxX:18.6,minZ:23.4,maxZ:25.3,minHeight:3.4},
      waypoints:[[8.85,.38,24.4],[11.2,.39,24.4],[15.8,.39,24.4],[18.75,.39,24.4]],
      returnPoint:[8.85,.38,24.4],firstEndObstacleX:19.17},
    sidewalks:[{x:8.85,minZ:14,maxZ:39,groundY:.38,halfClearance:.48},
      {x:-8.85,minZ:14,maxZ:39,groundY:.38,halfClearance:.48}],
  };
  stats.triangles=(stats.boxes+stats.beams)*12;
  function setNight(night){for(const light of lights)light.intensity=light.userData.nightPower*(night?1:.16);materials[serviceGlow].emissiveIntensity=night?.32:.16;}
  setNight(true);
  return {stats,paths,lights,setNight};
}

function createRoadTexture(rand){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const g=canvas.getContext('2d');
  g.fillStyle='#414d53';g.fillRect(0,0,512,512);
  const colors=['#465157','#3c484e','#4b555a','#404c51'];
  for(let i=0;i<2200;i++){
    const x=rand()*512,y=rand()*512,w=1.8+rand()*4.8,h=1.5+rand()*3.8;
    g.fillStyle=colors[i%4];g.beginPath();g.moveTo(x-w/2,y);g.lineTo(x-w*.2,y-h*.5);g.lineTo(x+w*.48,y-h*.2);g.lineTo(x+w*.34,y+h*.5);g.lineTo(x-w*.4,y+h*.36);g.closePath();g.fill();
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.anisotropy=4;return texture;
}
function createOilTexture(rand){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const g=canvas.getContext('2d');
  for(let i=0;i<15;i++){
    const x=70+rand()*116,y=45+rand()*166,r=15+rand()*32,gradient=g.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,'rgba(26,46,54,.48)');gradient.addColorStop(.65,'rgba(35,56,62,.20)');gradient.addColorStop(1,'rgba(35,56,62,0)');g.fillStyle=gradient;g.fillRect(x-r,y-r,r*2,r*2);
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;return texture;
}
