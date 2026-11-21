import {spindle,splitConcourse} from './nyc-civic-cartridges.js';
import {coreStreetWings,infillExchange} from './nyc-civic-street-wings.js';
import {civicCellShell} from './nyc-civic-voxel-joints.js';
import * as T from 'three';
import {createPlatformLight} from './nyc-platform-light.js';
import {coreOutline,coreRoutes,freightWell} from './nyc-future-core-layout.js';
import {buildCoreNightOperations} from './nyc-core-night-operations.js';
import {fitCoreWheelshop} from './nyc-core-wheelshop.js';
import {buildStaffGalleries} from './nyc-district-frontages.js';
import {buildCoreLifts} from './nyc-sky-lift.js';
import {buildCoreGridworks,buildExchangeRelayPodium,headquartersDispatch,receiverFinish} from './nyc-civic-gridworks.js';

// A backlit vertical transit instrument. Its split rotor and two-digit station
// number have large silhouettes and survive the approach across the junction.
function transitDisplay(scene,x,y,z,yaw){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=640;
  const g=canvas.getContext('2d'),rect=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
  const grad=g.createLinearGradient(0,0,240,640);grad.addColorStop(0,'#652979');grad.addColorStop(.45,'#b12e98');grad.addColorStop(1,'#481951');
  rect(grad,0,0,256,640);
  rect('#f284da',10,14,7,604);rect('#e06abe',239,14,6,604);
  rect('#eea9df',28,38,100,8);rect('#d573b7',138,38,44,8);
  for(let j=-8;j<=8;j++)for(let i=-8;i<=8;i++){
    const r=Math.hypot(i,j);
    if(r<4.55||r>8.45||Math.abs(i)<1.1||Math.abs(j)<.9)continue;
    rect(i*j>0?'#ffe1f3':'#ed9edc',128+i*10-5,200+j*10-5,10,10);
  }
  for(let j=-4;j<=4;j++)rect('#8eeef1',124+Math.abs(j)*2,200+j*10,8,10);
  g.fillStyle='#ffeefa';g.font='bold 142px Arial';g.textAlign='center';g.fillText('07',128,452);
  rect('#fcb5df',38,484,180,4);
  g.font='bold 30px "Microsoft YaHei",sans-serif';g.fillText('东岸联运',128,541);
  for(let i=0;i<14;i++)rect(i<9?'#e594c8':'#8b4282',32+i*14,578,8,20);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const panel=new T.Mesh(new T.PlaneGeometry(8.32,22.4),new T.MeshBasicMaterial({map,fog:false,toneMapped:false}));
  panel.name='核心区 / 轨道设备识别屏 07';panel.position.set(x,y,z);panel.rotation.y=yaw;scene.add(panel);
}

function kit(scene,colliders,shellMaterials){
  const hull=new T.MeshStandardMaterial({color:0xffffff,roughness:.72,metalness:.18});
  hull.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec2 vTile;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 sized=position*vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
      vTile=(abs(normal.y)>.5?sized.xz:(abs(normal.x)>.5?sized.zy:sized.xy))/.64;`);
    shader.fragmentShader='varying vec2 vTile;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 cell=vec2(vTile.x+mod(floor(vTile.y),2.)*.5,vTile.y);
      vec2 src=fract(cell); vec2 dist=min(src,1.-src);
      float edge=min(dist.x,dist.y);
      float aa=max(.008,max(fwidth(vTile.x),fwidth(vTile.y)));
      float read=1.-smoothstep(.13,.65,aa);
      float joint=1.-smoothstep(.010-aa*.5,.033+aa*.5,edge);
      float lip=(1.-smoothstep(.035,.105+aa,src.y))*smoothstep(.014,.045+aa,src.y);
      vec2 blockId=floor(cell);
      float kiln=fract(dot(mod(blockId,vec2(7.,11.)),vec2(.31,.57)))-.5;
      diffuseColor.rgb*=1.+read*(-.24*joint+.11*lip+.105*kiln);`);
  };
  const pane=shellMaterials.officeCurtain;
  const light=new T.MeshBasicMaterial({color:0xffffff});
  // Indirect lighting at the far wall of a display alcove. The real shelf,
  // counter, partition and returns occlude this wall as the player walks past.
  const wash=new T.MeshBasicMaterial({color:0xffffff});
  wash.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec2 vAlcove;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vAlcove=uv;');
    shader.fragmentShader='varying vec2 vAlcove;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      vec2 p=vAlcove;
      float side=smoothstep(0.0,.18,min(p.x,1.-p.x));
      float falloff=exp(-3.4*abs(.90-p.y));
      float beam=exp(-3.2*pow((p.x-.53)*1.6,2.));
      diffuseColor.rgb*=.08+.26*side+.89*falloff*beam;
      diffuseColor.rgb*=mix(vec3(.80,.89,1.),vec3(1.,.98,.91),falloff);
    `);
  };
  function scaledShell(source){
    const mat=source.clone(),metres=source.userData.textureMeters||2.56;
    mat.vertexColors=false;
    mat.onBeforeCompile=shader=>{
      const channels=[['map','vMapUv'],['roughnessMap','vRoughnessMapUv'],['metalnessMap','vMetalnessMapUv'],['normalMap','vNormalMapUv'],['bumpMap','vBumpMapUv']];
      const assignments=channels.filter(([key])=>mat[key]).map(([,uv])=>uv+'=physicalUv;').join(' ');
      const physical='vec3 sizeMetres=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz)); vec3 m=position*sizeMetres; vec2 physicalUv=(abs(normal.y)>.5?m.xz:abs(normal.x)>.5?m.zy:m.xy)/'+metres.toFixed(4)+';';
      shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n'+physical+assignments);
    };
    mat.customProgramCacheKey=()=> 'core-engineered-shell-'+source.name;
    return mat;
  }
  const materials={hull,pane,homePane:shellMaterials.homeCurtain,recess:shellMaterials.occupiedRecess,light,wash,course:hull,receiver:receiverFinish(hull),
    ceramic:scaledShell(shellMaterials.ceramicShell),alloy:scaledShell(shellMaterials.titaniumSkin),
    composite:scaledShell(shellMaterials.basaltShell)},cells=new Map(),unit=new T.BoxGeometry(1,1,1);
  const nearCells=[],joined=civicCellShell(scene);
  const transform=new T.Object3D(),tint=new T.Color(),stats={buildings:0,boxes:0,colliders:0,draws:0,triangles:0};
  function block(material,color,x,y,z,w,h,d,angle,parent){
    if(material==='wash'&&h>=.64&&Math.max(w,d)>=.65&&Math.min(w,d)<=.64)material='recess';
    if(joined.add(material,color,x,y,z,w,h,d,angle,parent)){stats.boxes++;return;}
    const size=material==='course'?28:60;
    const cell=parent===scene?Math.floor(x/size)+'/'+Math.floor(z/size):parent.name;
    const key=material+'/'+cell;
    if(!cells.has(key))cells.set(key,{material,parent,boxes:[]});
    cells.get(key).boxes.push([x,y,z,w,h,d,color,angle]);stats.boxes++;
  }
  // Thin slices approximate the rotated OBB in the motor's existing AABB grid.
  function solid(x,y,z,w,h,d,angle=0,cameraPadding=0){
    const c=Math.cos(angle),s=Math.sin(angle);
    const add=(cx,cz,sw,sd)=>{
      const solidBox=new T.Box3(new T.Vector3(cx-sw/2,y-h/2,cz-sd/2),new T.Vector3(cx+sw/2,y+h/2,cz+sd/2));
      if(cameraPadding)solidBox.userData={cameraPadding};
      colliders.push(solidBox);
      stats.colliders++;
    };
    if(Math.abs(c*s)<.001){add(x,z,Math.abs(c)*w+Math.abs(s)*d,Math.abs(s)*w+Math.abs(c)*d);return;}
    // Intersect the footprint with narrow horizontal strips. This bounds the
    // street-facing overhang to one strip, even on wide rotated buildings.
    const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[x+i*w*.5*c+j*d*.5*s,z-i*w*.5*s+j*d*.5*c]);
    const zmin=Math.min(...corners.map(p=>p[1])),zmax=Math.max(...corners.map(p=>p[1]));
    const count=Math.ceil((zmax-zmin)/1.5),step=(zmax-zmin)/count;
    for(let i=0;i<count;i++){
      const lo=zmin+i*step,hi=lo+step,xs=[];
      for(let j=0;j<4;j++){
        const a=corners[j],b=corners[(j+1)%4];
        if(a[1]>=lo&&a[1]<=hi)xs.push(a[0]);
        for(const zz of [lo,hi])if((a[1]-zz)*(b[1]-zz)<0)xs.push(a[0]+(zz-a[1])/(b[1]-a[1])*(b[0]-a[0]));
      }
      if(xs.length){const left=Math.min(...xs),right=Math.max(...xs);add((left+right)*.5,(lo+hi)*.5,right-left,step);}
    }
  }
  function frame(x,z,angle,parent=scene){
    const c=Math.cos(angle),s=Math.sin(angle);
    function point(u,v){return [x+c*u+s*v,z-s*u+c*v];}
    function B(mat,color,u,y,v,w,h,d){
      const [xx,zz]=point(u,v);block(mat,color,xx,y,zz,w,h,d,angle,parent);
    }
    function C(u,y,v,w,h,d,cameraPadding){
      const [xx,zz]=point(u,v);solid(xx,y,zz,w,h,d,angle,cameraPadding);
    }
    return {B,C,point};
  }
  function finish(){
    for(const {material,parent,boxes} of cells.values()){
      const mesh=new T.InstancedMesh(unit,materials[material],boxes.length);
      mesh.name='Future core / '+material;mesh.receiveShadow=material!=='light'&&material!=='wash';
      mesh.castShadow=mesh.receiveShadow&&material!=='pane'&&material!=='homePane';
      boxes.forEach(([x,y,z,w,h,d,color,angle],i)=>{
        transform.position.set(x,y,z);transform.rotation.set(0,angle,0);transform.scale.set(w,h,d);transform.updateMatrix();
        mesh.setMatrixAt(i,transform.matrix);tint.setHex(color);
        if(material==='light'&&(color===0xe089ff||color===0xc2f7ff))tint.multiplyScalar(2.2);
        mesh.setColorAt(i,tint);
      });
      mesh.computeBoundingSphere();parent.add(mesh);stats.draws++;
      if(material==='course'){mesh.computeBoundingBox();nearCells.push(mesh);}
    }
    const shell=joined.finish();
    stats.draws+=shell.draws;stats.joinery=shell;
    stats.triangles=(stats.boxes-shell.boxes)*12+shell.coarseTriangles;return stats;
  }
  function movingFrame(name){
    const root=new T.Group();root.name=name;scene.add(root);
    return {root,...frame(0,0,0,root)};
  }
  function updateRelief(position){
    if(!position)return;
    joined.update(position);
    for(const mesh of nearCells)mesh.visible=mesh.boundingBox.distanceToPoint(position)<(mesh.visible?51:47);
  }
  return {frame,movingFrame,stats,finish,updateRelief};
}

const ink=0x29374a,steel=0x617786,stone=0xb5c5c4,deep=0x263441,blue=0x51ceda,amber=0xffc479,plum=0xcb79df;

const patina=0x668d87,bronze=0xb08b6b,mortar=0x43494d,ivory=0xb6b7a7;
const masonry=[0x999b90,0xb0afa0,0x949c99,0xb6b4a2];

// A glazing bay has an open front, a wall at the back and solid furnishings at
// different depths. Looking past a jamb exposes the side of the furniture.
function interiorBay(block,u,width,bottom,height,variant,warm){
  const mid=bottom+height/2,glow=warm?0xf5bf80:0xb9dfe7;
  const panel=warm?0xc39b78:0x899eaf;
  block('hull',warm?0x594a43:0x3a4c5d,u,mid,-1.36,width,height,.16);
  block('wash',panel,u,mid+.16,-1.24,width-.32,height-.64,.12);
  block('hull',deep,u,bottom-.08,-.42,width,.24,2.00);
  block('hull',steel,u,bottom+height+.08,-.45,width,.24,1.96);
  block('light',glow,u,bottom+height-.08,-.65,width*.64,.16,.32);
  const inner=width*.77;
  if(variant===0){
    // Repair bench with a backboard, square instruments and a stepped screen.
    block('course',warm?bronze:steel,u,bottom+.62,-.35,inner,.24,.80);
    block('course',mortar,u-inner*.36,bottom+.28,-.38,.32,.56,.56);
    block('course',deep,u+inner*.40,bottom+.28,-.38,.32,.56,.56);
    block('course',ink,u-inner*.15,bottom+1.08,-.52,.80,.64,.32);
    block('light',warm?0xffce92:0x84cdca,u-inner*.15,bottom+1.16,-.34,.56,.24,.06);
    block('course',ivory,u+inner*.31,bottom+.92,-.23,.40,.32,.32);
    block('course',steel,u,bottom+height*.70,-1.00,inner,.16,.40);
  }else if(variant===1){
    // The two shelves are populated independently; their ends remain exposed.
    for(let row=0;row<2;row++){
      const y=bottom+.42+row*.80;
      block('course',warm?bronze:steel,u,y,-.55,inner,.16,.80);
      const count=Math.max(2,Math.floor((inner-.25)/.68));
      for(let j=0;j<count;j++){
        const tall=(j+row)%3===1,tint=[patina,0xb49574,0xbac4b5][(j+row)%3];
        block('course',tint,u+(j-(count-1)/2)*.62,y+(tall?.40:.24),-.49+((j+row)%2)*.16,.40,tall?.64:.32,.48);
      }
    }
  }else{
    // Glazed service window with a ticket drawer and staggered internal partition.
    block('hull',warm?0x96755b:0x697d88,u,bottom+.48,-.49,inner,.96,.80);
    block('hull',ivory,u,bottom+1.04,-.36,inner+.16,.16,1.04);
    block('hull',ink,u+inner*.28,bottom+1.42,-.61,.64,.64,.40);
    block('light',glow,u+inner*.28,bottom+1.46,-.38,.40,.24,.08);
    block('hull',warm?bronze:steel,u-inner*.22,mid,-.86,.16,height-.12,.56);
  }
}

// Alternating deep headers and narrower face courses make a structural pier
// which reads around a corner. Mortar remains recessed under each shoulder.
function coursedPier(block,u,width,depth,top,seed,warm){
  const height=top-.32;
  block('hull',mortar,u,.32+height/2,0,width*.78,height,depth*.78);
  const rows=Math.max(2,Math.round(height/.48)),rise=height/rows;
  for(let j=0;j<rows;j++){
    const deepCourse=(j+seed)%2===0,y=.32+(j+.5)*rise,hand=deepCourse?1:-1;
    block('course',masonry[(j+seed)%4],u+hand*.12,y,deepCourse?.12:-.04,
      width*(deepCourse?.98:1.08),rise-.018,depth*(deepCourse?.94:.78));
    block('course',j%4===0?(warm?bronze:patina):masonry[(j+seed+1)%4],
      u-hand*width*.42,y,depth*.39,width*.46,rise-.029,depth*.48);
  }
  block('hull',0x878d88,u,.38,.03,width+.32,.48,depth+.32);
  block('hull',steel,u,top+.16,.08,width+.32,.32,depth+.48);
}

function cornice(block,u,pitch,top,seed,warm){
  block('hull',deep,u,top+.22,.32,pitch,.44,1.92);
  const teeth=Math.max(3,Math.round(pitch/.64)),step=pitch/teeth;
  for(let j=0;j<teeth;j++){
    const x=u-pitch/2+(j+.5)*step,long=(j+seed)%3===0;
    block('course',masonry[(j+seed)%4],x,top+.56,.28+(long?.16:0),step-.016,.32,1.92+(long?.32:0));
    block('course',long?(warm?bronze:patina):steel,x,top+(long?-.22:-.14),long?.40:.75,
      step-.024,long?.44:.28,long?1.92:1.12);
  }
  block('light',warm?0xf4bf85:0x95cbd3,u+.16,top-.02,.52,pitch*.44,.12,.16);
}

// Lower-city couriers use the same pneumatic canisters as the corporate
// counters. Their socket is visible round either corner of a tower; pipe,
// illuminated throat and latching jaws have separate depth and silhouettes.
function capsuleCounter(B,width,seed,warm){
  const cx=width*.18,r=Math.min(1.44,width*.14);
  const emitter=warm?0xffb572:seed%2?0x7ce6db:0xc492e9;
  B('hull',deep,cx,2.48,.08,r*2+.96,3.84,.80);
  for(let j=0;j<6;j++){
    const y=1.20+j*.48,extent=r-(Math.abs(j-2.5)-.5)*.18;
    for(const h of [-1,1]){
      const u=cx+h*extent;
      B('hull',j===1||j===4?ivory:steel,u,y,.42,.80,.48,1.12);
      B('light',emitter,u-h*.14,y,.99,.40,.30,.16);
    }
  }
  B('hull',ink,cx,1.36,.68,1.60,.40,1.28);
  B('wash',emitter,cx,2.48,.49,1.44,1.60,.18);
  B('hull',steel,cx-.24,2.32,.72,.80,.96,.40);
  B('light',0xb9ebe9,cx-.24,2.65,.95,.48,.24,.16);
  for(let j=0;j<4;j++){
    const u=cx-r-.32-j*.48,y=3.68+j*.32;
    B('hull',j%2?patina:stone,u,y,.46,.80,.64,1.12);
    B('light',emitter,u,y,.99,.48,.32,.18);
  }
}

function podium(frame,w,d,h,warm,seed){
  const {B,C}=frame,base=.18,depth=1.44;
  // The continuous centre stops behind the reveal on all public elevations.
  B('hull',ink,0,base+h/2,-depth/2,w-2*depth,h,d-depth);
  B('hull',steel,0,base+.22,0,w,.44,d);
  B('hull',ink,0,(h+4.96)/2,0,w-.16,h-4.96,d-.16);
  // The coping and cornice project up to 1.56 m beyond the original shop
  // footprint. Reserve the visible facade plus near-plane clearance for the
  // camera while the walker still uses the existing shop collision footprint.
  C(0,base+h/2,0,w,h,d,1.88);
  function streetFace(block,span,side){
    const bays=Math.max(2,Math.round(span/(side?3.84:3.52))),pitch=span/bays;
    for(let i=0;i<bays;i++){
      const u=(i+.5)*pitch-span/2,start=u-pitch/2,phase=i+seed+(side?2:0);
      const localWarm=warm?phase%5!==0:phase%6===1;
      const type=phase%3;
      const pierWidth=phase%3===0?.96:.64,open=pitch-.65;
      if(side&&phase%4===0){
        block('hull',deep,u,2.42,-.78,open,3.36,.32);
        for(let j=0;j<5;j++)block('hull',j%3===0?patina:steel,u,1.42+j*.46,-.48,open-.16,.24,.64);
      }else{
        interiorBay(block,u,open,1.04,2.80,type,localWarm);
      }
      block('hull',phase%3===1?patina:steel,u,.73,-.16,pitch,1.08,1.92);
      block('hull',ivory,u,1.12,.28,pitch-.16,.24,.96);
      // Deep alternating knee-wall stones break the old continuous dark plinth.
      for(let j=0;j<4;j++){
        const cell=pitch*.25,project=(phase+j)%3===0?.16:0;
        block('course',j%2?patina:0x738787,start+(j+.5)*cell,.72,.86+project,
          cell-.024,.48,.40+project);
      }
      if(!side&&phase%2===0)block('hull',deep,u+.64,2.65,.16,.16,2.88,.24);
      coursedPier(block,start+.20,pierWidth,1.12,4.0,phase,localWarm);
      if(i===bays-1)block('hull',steel,span/2-.13,2.3,0,.32,3.8,1.12);
      block('hull',phase%2?steel:patina,start+.20,4.44,.28,1.28,.48,1.60);
      cornice(block,u,pitch,4.8,phase,localWarm);
      if(h>=7.36){
        // Plant rooms above the shop are deeply inset behind stepped cassettes.
        const y=(h+5.68)/2;
        block('hull',steel,start+.32,y,.06,.80,h-5.20,1.12);
        block('hull',phase%2?patina:0x83939a,u,y,-.05,pitch-.84,h-5.88,.32);
        for(let j=0;j<3;j++)block('course',ink,u,5.96+j*.58,.22,pitch-1.12,.24,.48);
        block('hull',masonry[phase%4],u,h-.28,.40,pitch-.06,.48,1.12);
      }
    }
  }
  streetFace((m,col,u,y,v,sx,sy,sz)=>B(m,col,u,y,d/2+v,sx,sy,sz),w,false);
  for(const side of [-1,1]){
    streetFace((m,col,u,y,v,sx,sy,sz)=>B(m,col,side*(w/2+v),y,-side*u,sz,sy,sx),d,true);
  }
  B('hull',steel,0,h+.32,0,w+.64,.32,d+.64);
  if(h>7)B('pane',0xacbec5,0,(h+5.6)/2,d/2-.02,w-.65,h-5.6,.18);
  const rear=-d/2;
  capsuleCounter((mat,col,u,y,v,sx,sy,sz)=>B(mat,col,-u,y,rear-v,sx,sy,sz),w,seed,warm);
  C(-w*.18,2.48,rear-.48,Math.min(3.84,w*.28+.96),3.84,.96);
  const returnSide=seed%2?1:-1;
  capsuleCounter((mat,col,u,y,v,sx,sy,sz)=>B(mat,col,returnSide*(w/2+v+.32),y,-returnSide*u,sz,sy,sx),
    d,seed+1,!warm);
  C(returnSide*(w/2+.68),2.48,-returnSide*d*.18,1.36,3.84,Math.min(3.84,d*.28+.96));
}

// Cut a real double-height winter garden into the front and one side of an
// occupied volume. Its ceiling, the solid return and the corner trees read
// from the far pavement; smaller furnishings only draw near the building.
function residentialStack(frame,u,v,w,d,base,h,seed){
  const {B}=frame,side=seed%2===0?1:-1;
  const front=v+d/2,edge=u+side*w/2;
  const inset=Math.min(2.56,d*.23),endInset=Math.min(2.56,w*.20);
  const cutH=Math.min(4.80,h*.27),count=h>=24?2:1,segment=h/count;
  for(let i=0;i<count;i++){
    const y=base+i*segment,lip=y+cutH;
    // The back and the end wall are a single smaller occupied building volume.
    B('homePane',0xd4c1a5,u-side*endInset/2,y+cutH/2,v-inset/2,w-endInset,cutH,d-inset);
    const occupied=segment-cutH;
    B('composite',0xc0c9cd,u,lip+occupied/2,v,w,occupied,d);
    for(const face of [-1,1]){
      B('homePane',0xd3c7b5,u,lip+occupied*.51,v+face*(d/2+.04),w-.64,occupied*.43,.10);
      const fw=w*.46,fx=u+face*side*(w-fw)*.5;
      B('ceramic',0xd2c7b6,fx,lip+occupied*.70,v+face*(d/2+.22),fw,occupied*.40,.64);
      B('alloy',0x92a7a2,fx+side*.32,lip+occupied*.41,v+face*(d/2+.38),fw-.64,occupied*.16,.96);
    }
    const slabFront=front+1.44,deckWidth=w*.68;
    B('hull',0x93998f,u+side*w*.18,y+.24,v+d*.25,w*.68,.48,d*.5+2.88);
    B('hull',steel,edge+side*.56,y+.32,v+d*.12,1.44,.64,d*.76);
    B('hull',0x7a857f,u+side*w*.18,y+1.04,slabFront-.20,deckWidth,.80,.48);
    B('hull',0x7a857f,edge+side*.98,y+1.04,v+d*.12,.48,.80,d*.76);
    // Two uneven stepped cheeks catch the sky and bracket the recessed room.
    B('hull',ivory,u-side*w*.16,y+cutH/2,front-.12,.80,cutH,2.56);
    B('hull',patina,u-side*w*.16,y+cutH-.72,front+.86,1.44,1.44,1.28);
    B('hull',steel,u+side*w*.18,lip+.24,front+.36,deckWidth+.64,.48,1.60);
    B('light',0xffc28a,u+side*w*.12,lip-.09,front-.64,deckWidth*.55,.16,.32);
    const bay=deckWidth/3;
    for(let j=-1;j<=1;j++){
      const x=u+side*w*.10+j*bay;
      B('wash',j===0?0xe9b477:0xc79b74,x,y+cutH*.55,front-inset+.16,bay-.18,cutH*.68,.18);
      B('course',bronze,x,y+cutH-.48,front-inset+.41,bay,.32,.64);
    }
    const tx=edge-side*1.60,tz=front+.46;
    B('hull',0x586466,tx,y+.96,tz,2.08,.96,1.60);
    const growth=Math.min(1,(cutH-1.44)/2.24);
    B('hull',0x624e45,tx,y+1.44+.50*growth,tz,.32,1.44*growth,.32);
    B('hull',0x4e7568,tx-.20,y+1.44+1.25*growth,tz,1.92,.96*growth,1.44);
    B('hull',0x688574,tx+.32,y+1.44+1.88*growth,tz-.25,1.12,.48*growth,.96);
    B('hull',0x657e67,tx+.72,y+1.44+1.50*growth,tz+.16,.80,.64*growth,.80);
    B('hull',0x859579,tx-.72,y+1.44+1.76*growth,tz-.16,.64,.48*growth,.80);
  }
}

const architectureMaterials={ceramic:'ceramic',metal:'alloy',dark:'composite',glass:'pane',trim:'receiver',light:'light',wash:'wash'};
function structureFrame(frame){
  return {B:(kind,...args)=>frame.B(architectureMaterials[kind],...args),C:frame.C,jointReveal:.16};
}

function upper(frame,u,v,w,d,base,h,kind,seed){
  const {B,C}=frame;
  if(kind!=='residence'){
    spindle(structureFrame(frame),u,v,w,d,base,h,seed,kind==='works');
    return;
  }
  const trim=0xaeb9ab;
  const terrace=h>=10&&w>8;
  if(terrace)residentialStack(frame,u,v,w,d,base,h,seed);
  else B('homePane',0xe2d7ca,u,base+h/2,v,w,h,d);
  C(u,base+h/2,v,w,h,d);
  for(let y=base+3.2;y<base+h-.8;y+=4.8){
    if(terrace&&((y-base)%(h/(h>=24?2:1)))<Math.min(4.80,h*.27)+.48)continue;
    B('hull',0x85918d,u,y,v,w+.48,.32,d+.48);
    if(!terrace){
      // Two unequal stacks of inhabited loggias leave the wall between them recessed.
      for(const side of [-1,1]){
        const off=u+side*w*.27;
        B('hull',trim,off,y,v+d/2+.84,w*.32,.48,2.56);
        B('hull',steel,off,y+.56,v+d/2+2,w*.32,.64,.32);
        if((seed+Math.round(y/4.8))%3===1){
          B('hull',0x597866,off+.5,y+1.0,v+d/2+1.12,1.92,.96,1.28);
          B('light',amber,off,y-.28,v+d/2+1.28,w*.16,.10,.16);
        }
      }
    }
  }
  for(const side of [-1,1]){
    for(const along of [-1,1]){
      B('hull',trim,u+side*(w/2-.54),base+h/2,v+along*(d/2-.22),1.6,h+.32,1.28);
      B('hull',steel,u+side*(w/2-.16),base+h*.43,v+along*(d/2-1.0),1.28,h*.86,1.92);
    }
  }
  // Shallow zig-zag spines turn the edge of the glazed shaft into a stepped
  // silhouette. The projecting belt returns visibly around the side fascia.
  for(let y=base+2.56,band=0;y<base+h-1.12;y+=6.40,band++){
    const side=(band+seed)%2?1:-1,far=1.12;
    const x=u+side*(w/2-.64),z=v+d/2;
    B('hull',trim,x,y+.32,z-.48,2.24,.64,far+1.28);
    B('hull',patina,x+side*.48,y+1.12,z-.48,1.28,.96,far+.64);
    B('hull',trim,x+side*.64,y+2.32,z-.48,.64,1.44,far);
    B('hull',steel,x,y+.32,z-2.24,2.24,.64,2.88);
  }
  B('hull',steel,u,base+h+.24,v,w+.64,.48,d+.64);
  for(const side of [-1,1])B('hull',trim,u,base+h+.72,v+side*(d/2-.32),w,.64,.64);
  if(!terrace&&h>9){
    const row=base+Math.min(h-2.4,6.4+(seed%3)*3.2),count=w>=13?4:3;
    const pitch=Math.min(2.16,(w-2.4)/count),front=v+d/2+.12;
    for(let j=0;j<count;j++){
      const xx=u+(j-(count-1)/2)*pitch;
      B('light',j%3===1?0xffc57e:0xdcaa75,xx,row,front,pitch-.40,1.76,.12);
      B('hull',ink,xx+.18,row,front+.10,.16,1.80,.14);
    }
  }
}

const trackStart=[-52,-266],trackEnd=[136,-216];
const trackAngle=-Math.atan2(trackEnd[1]-trackStart[1],trackEnd[0]-trackStart[0]);
const trackLength=Math.hypot(trackEnd[0]-trackStart[0],trackEnd[1]-trackStart[1]);
const roadEdges=()=>coreRoutes.flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b,half:r.width/2})));

function lot(x,z,w,d,angle=0){
  const c=Math.cos(angle),s=Math.sin(angle);
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[x+i*w*c*.5+j*d*s*.5,z-i*w*s*.5+j*d*c*.5]);
  return {x,z,w,d,angle,c,s,corners};
}
function intersects(a,b){
  for(const [nx,nz] of [[a.c,-a.s],[a.s,a.c],[b.c,-b.s],[b.s,b.c]]){
    const gap=Math.abs((a.x-b.x)*nx+(a.z-b.z)*nz);
    const radius=r=>(Math.abs(r.c*nx-r.s*nz)*r.w+Math.abs(r.s*nx+r.c*nz)*r.d)*.5;
    if(gap>radius(a)+radius(b)+.4)return false;
  }
  return true;
}
function inside(x,z){
  let odd=false;
  for(let i=0,j=coreOutline.length-1;i<coreOutline.length;j=i++){
    const [ax,az]=coreOutline[i],[bx,bz]=coreOutline[j];
    if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)odd=!odd;
  }
  return odd;
}
function distanceToEdge(x,z,a,b){
  const dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);
  return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
}

function headquarters(kit,api,scene,lights){
  const angle=-.72,x=88,z=-351,{B,C,point}=kit.frame(x,z,angle),f=kit.frame(x,z,angle);
  // Walk through the 8m-high portal and see the stepped turbine hanging above reception.
  // A 5.12 m public cut through the rear bearing wall connects reception to
  // the back court. The high transfer beam above it carries the archive.
  for(const [from,to] of [[-13.50,-9.12],[-4.00,13.50]]){
    const u=(from+to)/2,w=to-from;
    B('composite',0x8495a4,u,4.16,-8,w,8,5);C(u,4.16,-8,w,8,5);
  }
  B('ceramic',ivory,-6.56,7.59,-8,5.12,1.14,5);
  C(-6.56,7.59,-8,5.12,1.14,5);
  for(const v of [-10.32,-8.32,-6.32]){
    for(const u of [-9.20,-3.92]){
      B('alloy',0x9bb1b4,u,3.08,v,.32,5.76,1.28);
      B('light',0x87c6c9,u,5.68,v,.40,.32,.96);
    }
  }
  for(const side of [-1,1]){
    if(side>0){
      B('hull',ink,12.9,4.16,0,1.9,8,21);C(12.9,4.16,0,1.9,8,21);
    }else{
      for(const [v,length] of [[-8.48,4.04],[8.26,4.48]]){
        B('hull',ink,-12.9,4.16,v,1.9,8,length);C(-12.9,4.16,v,1.9,8,length);
      }
      B('hull',ink,-12.9,7.65,-.22,1.9,1.02,12.48);C(-12.9,7.65,-.22,1.9,1.02,12.48);
    }
    for(let i=0;i<3;i++)B('hull',stone,side*(12.7-i*.48),6.6+i*.48,10.8,1.28+i*.64,.48,1.92+i*.64);
    // Six formerly blank lightboxes are deep night-service windows. Below
    // the records room is a clerk's dispatch slot, above it a routed tray.
    for(let i=0;i<3;i++){
      const u=side*(3.4+i*2.5),hue=(side+i)%3===0?0xe3b67e:0x9ed9db;
      if(u>-9.8&&u< -3.40)continue;
      B('hull',steel,u,4.0,-5.32,2.40,6.72,.64);
      for(const [y,h] of [[2.48,1.92],[5.60,1.60]]){
        B('wash',hue,u,y,-4.96,1.92,h,.24);
        B('hull',ink,u+side*.48,y,-4.77,.24,h,.48);
      }
      B('hull',stone,u,1.44,-4.80,2.24,.48,1.28);
      B('hull',steel,u,3.68,-4.64,2.40,.64,1.60);
      B('light',i%2?0x88dccf:0xe2ba8a,u,3.36,-4.18,1.92,.16,.48);
      B('hull',ivory,u,6.72,-4.78,2.24,.32,1.28);
      B('light',0xa4e7ea,u,6.36,-4.36,1.60,.24,.48);
    }
  }
  // Arrival piers wrap onto the street and back into the public hall. Each
  // has a ticket feed above eye level, an open kiosk, and a split roof jaw.
  for(const h of [-1,1]){
    const u=h*12.72,v=10.64,hue=h<0?0x8ce8e6:0xcb97f3;
    for(let row=0;row<8;row++){
      const y=1.12+row*.64,step=Math.max(0,Math.abs(row-3.5)-.5)*.32;
      B('hull',row%3===0?stone:row%2?deep:steel,u-h*step,y,v+.48,2.24,.64,2.24);
      B('light',row<3?0xffcc8c:hue,u-h*(step+.28),y,v+1.64,1.12,.36,.22);
      B('light',hue,u+h*(1.18-step),y,v+.48,.22,.44,1.28);
      B('hull',ink,u-h*(step+.80),y+.16,v+1.60,.32,.32,.48);
    }
    C(u,3.32,v+.45,2.40,5.40,2.16);
    B('hull',deep,u-h*1.76,3.12,v+.32,2.24,3.36,1.60);
    B('wash',h<0?0x89cfde:0xc19bd4,u-h*1.68,3.76,v+1.19,1.60,1.28,.18);
    B('hull',patina,u-h*1.76,2.72,v+1.16,1.76,.32,1.28);
    B('light',0xe7c18e,u-h*1.76,2.52,v+1.66,1.28,.16,.24);
    for(let i=0;i<4;i++){
      const x=u-h*i*.64,top=6.08+i*.48;
      B('hull',i%2?stone:steel,x,top,v+1.28+i*.32,2.56,.64,3.20+i*.64);
      B('light',hue,x,top-.36,v+2.40+i*.48,1.92,.24,1.28);
    }
    const [lx,lz]=point(u-h*.72,v+2.88),source=new T.PointLight(h<0?0x63ccdf:0xc888ef,86,17,2);
    source.position.set(lx,3.89,lz);source.userData.nightPower=86;scene.add(source);lights.push(source);
  }
  // The double-depth forecourt opens between two roof wings. The edge steps
  // twice before the occupied upper floors draw together over the back desks.
  for(const [x,z,w,d] of [[0,-5.60,29,12.8],[-10.52,4.48,7.96,7.36],[-11.48,10.08,6.04,3.84],
    [8.60,4.48,11.80,7.36],[9.56,10.08,9.88,3.84]]){
    B('ceramic',0xc8ced0,x,8.70,z,w,1.60,d);
    C(x,8.70,z,w,1.60,d);
    B('alloy',0x819aa6,x,7.79,z,w,.20,d);
    B('light',0xa7d9dd,x,7.65,z,.32,.08,d*.71);
  }
  const [dispatchX,dispatchZ]=headquartersDispatch(kit,f,angle,api.sign);
  const dispatchLight=new T.PointLight(0xafdae1,132,18,2);
  dispatchLight.position.set(dispatchX,5.44,dispatchZ);
  dispatchLight.userData.nightPower=132;scene.add(dispatchLight);lights.push(dispatchLight);

  B('hull',ink,0,.83,0,6.4,1.28,1.92);C(0,.83,0,6.4,1.28,1.92);
  for(let i=-3;i<=3;i++)B('light',blue,0,4.1+i*.32,0,(4-Math.abs(i))*.64,.32,.64);
  upper(f,0,-1,25,19,9.5,64,'office',0);
  upper(f,1.6,-1.2,22,17,73.7,49,'office',0);
  upper(f,-6.5,-1.2,7.0,14.4,122.85,41,'office',0);
  upper(f,8.2,-1.2,5.76,14.4,122.85,48,'office',0);
  // Staggered cooling galleries on one flank make a single rising profile.
  // Space between the two unequal forks remains open to the sky.
  for(let stage=0;stage<3;stage++){
    const y=12.8+stage*19.2,width=6.40-stage*.96,height=11.52+stage*1.28;
    const x=-11.84-width/2;
    B('hull',ink,x,y+height*.5,2.24,width,height,8.96);
    for(let course=0;course<3;course++){
      const out=(2-course)*.64;
      B('hull',course===0?ivory:steel,x-out*.5,y+course*.64,2.24,width+out,.64,10.24-course*.64);
    }
    for(let slot=0;slot<4;slot++){
      B('hull',steel,x,y+3.2+slot*1.92,7.04,width-.48,.64,1.28);
      if(slot===3)B('light',0xa2cedc,x,y+3.97+slot*1.92,6.82,width-.96,.32,.48);
    }
    B('hull',stone,x,y+height-.32,2.24,width+.64,.64,9.6);
  }
  for(const [x,width] of [[-6.5,7.68],[8.2,6.40]]){
    B('hull',stone,x,161,-1.2,width,4.48,14.4);
    B('light',0xe089ff,x,159,6.52,width-.96,1.28,.96);
  }
  for(let i=0;i<3;i++)B('hull',stone,8.2+i*.32,171+i*1.6,-1.2,6.72-i*1.28,1.6,14.4-i*2.56);
  B('hull',steel,8.2,176.56,-1.2,.64,6.88,.64);
  for(let j=0;j<8;j++)for(const [edge,direction] of [[-3.0,1],[5.31,-1]]){
    const y=126.4+j*4.16,offset=j%3===0?.48:0;
    B('light',0xe089ff,edge-direction*1.12,y,6.40,1.60+offset,3.52,.80);
    B('light',0xbc6cf3,edge+direction*.32,y,4.80,.96,3.52,3.84);
  }
  // A suspended flywheel marks the public dispatch hall from the plaza.
  // The double rim has a real opening with stepped spokes and a rear axle.
  for(let v of [9.28,10.88]){
    for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++){
      const r=i*i+j*j;
      if(r>=12&&r<=21)B('hull',j>1?ivory:steel,i*.64,6.96+j*.64,v,.64,.64,.64);
      else if(r>1&&r<12&&(i===j||i===-j))B('light',0x94d7da,i*.64,6.96+j*.64,v,.64,.64,.48);
    }
  }
  B('hull',steel,0,6.96,9.92,1.60,1.60,3.52);
  for(const side of [-1,1])B('hull',steel,side*1.60,9.20,10.08,.64,1.60,2.24);
  const [lx,lz]=point(0,11.2);api.sign(lx,8.8,lz,12.8,1.0,'衡光联合','HELIX / CIVIC EXCHANGE','#9cdded',angle);
  const [doorX,doorZ]=point(0,8);
  return {id:'future-crown',title:'衡光总部大厅',position:new T.Vector3(doorX,.30,doorZ)};
}

function railAndStations(kit,api,edges){
  const {B,C,point}=kit.frame(...trackStart,trackAngle),deck=14.08;
  const inWell=(x,z)=>x>freightWell.minX-1.6&&x<freightWell.maxX+1.6&&z>freightWell.minZ-1.6&&z<freightWell.maxZ+1.6;
  for(let u=0;u<trackLength;u+=12.8){
    const len=Math.min(12.8,trackLength-u),mid=u+len/2;
    B('hull',0x45566c,mid,deck-.8,0,len+.02,1.60,5.12);
    for(const side of [-1,1]){
      B('hull',stone,mid,deck+.05,side*2.56,len,.8,.64);
      B('hull',ink,mid,deck-1.7,side*1.72,len,.64,.96);
      B('hull',steel,mid,deck+.2,side*.90,len,.26,.23);
      if(len>4)B('light',blue,mid,deck-.48,side*2.908,len*.54,.16,.16);
    }
    for(let j=.6;j<len-.2;j+=1.28)B('hull',steel,u+j,deck+.05,0,.48,.16,2.88);
  }
  for(let u=2.5;u<trackLength;u+=13.4){
    const [x,z]=point(u,0);
    if(inWell(x,z)||edges.some(e=>distanceToEdge(x,z,e.a,e.b)<e.half+1.9))continue;
    B('hull',steel,u,6.08,0,1.60,11.84,2.24);C(u,6.08,0,1.92,11.84,2.56);
    for(let j=0;j<12;j++){
      const wide=j%2===0;
      B('hull',masonry[j%4],u,j*.88+1.10,wide?.08:-.08,wide?2.24:1.92,.80,wide?2.56:2.88);
      if(j%3===0)B('course',patina,u+.64,j*.88+1.10,1.39,.64,.46,.32);
    }
    B('hull',stone,u,.8,0,3.2,1.28,3.84);C(u,.8,0,3.2,1.28,3.84);
    for(let i=0;i<3;i++)B('hull',stone,u,11.36+i*.48,0,2.56+i*.96,.48,3.2+i*1.28);
  }
  // One transform moves the four cars, retaining the two material draws.
  const train=kit.movingFrame('核心区 / 折光线四节列车');
  for(let n=0;n<4;n++){
    const u=(n-1.5)*9.6,B=train.B;
    B('hull',ink,u,14.65,0,9.12,.72,2.56);
    B('hull',0xc2cfce,u,15.52,0,9.28,1.28,3.1);
    B('hull',ink,u,16.81,0,9.12,1.42,3.04);
    B('hull',stone,u,17.63,0,8.96,.32,3.2);
    // Roof equipment, lower skirts and recessed door pockets give each car a
    // different silhouette from the platform when seen between two viaduct piers.
    const plant=u+(n%2===0?-1.60:1.60);
    B('hull',steel,plant,17.94,0,3.84,.32,2.24);
    B('hull',ink,plant+.32,18.18,0,2.56,.16,1.60);
    if(n<3)B('hull',ink,u+4.80,16.00,0,.48,2.24,2.24);
    for(const side of [-1,1]){
      B('hull',0x396a76,u,15.22,side*1.58,8.96,.40,.16);
      B('hull',steel,u-2.88,15.88,side*1.65,1.28,1.12,.12);
      B('light',0xe8bb7b,u-2.88,16.34,side*1.74,.96,.16,.10);
    }
    for(let j=-3;j<=3;j++)for(const side of [-1,1]){
      B('light',j%3===1?0xc4decf:0xa5c6d2,u+j*1.17,16.8,side*1.54,.94,.94,.09);
      if(j%3===1)B('hull',ink,u+j*1.17,16.8,side*1.61,.09,.94,.10);
    }
    if(n===0||n===3){
      const dir=n===0?-1:1;
      B('hull',stone,u+dir*4.64,15.70,0,.64,1.28,2.72);
      B('light',0xb0edff,u+dir*5.0,15.7,0,.12,.25,1.92);
    }
  }
  const stations=[];
  for(const [id,u,side] of [['west',25,1],['east',165,1]]){
    const mid=point(u,side*7.8);
    B('hull',stone,u,13.72,side*5.6,33,.72,6.4);C(u,13.72,side*5.6,33,.72,6.4);
    for(let j=-12.8;j<=13;j+=6.4){
      B('hull',steel,u+j,15.92,side*8.2,.64,3.68,.64);
      B('hull',ink,u+j,17.62,side*6,1.28,.48,5.12);
      B('light',0xb9f0ff,u+j,17.4,side*6,.32,.13,3.84);
    }
    B('hull',steel,u,17.98,side*6.25,32,.48,6.4);
    for(const end of [-1,1]){
      B('hull',ink,u+end*16.3,14.67,side*5.6,.32,1.18,6.4);
      C(u+end*16.3,14.67,side*5.6,.32,1.18,6.4);
    }
    B('hull',steel,u,14.60,side*2.65,32.5,1.04,.24);
    C(u,14.60,side*2.65,32.5,1.04,.24);
    B('light',0xc3cb8e,u,15.16,side*2.65,32.5,.09,.32);
    // Commuters waiting above street level give the train windows and deck a human scale.
    for(const [offset,v,coat] of [[-10.3,4.3,0x81504c],[-6.2,5.2,0x698799],[5.76,4.8,0x66776d],[8.5,5.4,0x958466]]){
      const t=u+offset;
      for(const stride of [-1,1])B('hull',ink,t+stride*.125,deck+.40,v+stride*.06,.16,.80,.24);
      B('hull',coat,t,deck+1.05,v,.44,.66,.28);
      B('hull',coat,t,deck+1.35,v,.54,.19,.30);
      B('hull',0xae8974,t,deck+1.56,v-.04,.29,.32,.27);
      B('hull',ink,t,deck+1.73,v,.32,.13,.30);
    }
    api.sign(mid[0],16.92,mid[1],8.32,.96,id==='east'?'东岸换乘':'西线站台','INTERCHANGE / LINE 07','#89d7e7',trackAngle);
    stations.push({id,x:mid[0],z:mid[1]});
  }
  train.root.rotation.y=trackAngle;
  const c=Math.cos(trackAngle),s=Math.sin(trackAngle);
  function update(dt,time,camera){
    const pos=camera?.position;
    train.root.visible=!pos||Math.abs(pos.x-42)<275&&Math.abs(pos.z+241)<245;
    if(!train.root.visible)return;
    const phase=(time+10)%48,half=phase%24;
    train.root.userData.travelSign=phase<24?1:-1;
    const t=T.MathUtils.smoothstep(half,5,24),u=phase<24?25+140*t:165-140*t;
    train.root.position.set(trackStart[0]+c*u,0,trackStart[1]-s*u);
  }
  update(0,0,null);
  return {stations,start:trackStart,end:trackEnd,height:deck,trainRoot:train.root,update};
}

function eastStair(kit,api){
  const x=102,z=-192,{B,C}=kit.frame(x,z,0),count=55,run=.40,rise=(14.08-.30)/count;
  for(let n=0;n<count;n++){
    const y=.30+(n+1)*rise,v=-(n+.5)*run;
    B('hull',n%4===0?stone:steel,0,y-.20,v,3.84,.40,run+.02);
    C(0,y-.20,v,3.84,.40,run);api.surface(x-1.92,x+1.92,z+v-run/2,z+v+run/2,y);
    for(const e of [-1,1]){
      B('hull',steel,e*1.96,y+.28,v,.32,.56,run);
      B('hull',stone,e*1.96,y+.93,v,.24,.22,run);
      if(n%4===0)B('hull',ink,e*1.96,y+.62,v,.16,.64,.16);
    }
  }
  B('hull',steel,0,13.84,-24.0,4.16,.56,4.16);C(0,13.84,-24.0,4.16,.56,4.16);
  api.surface(x-2.08,x+2.08,z-26.08,z-21.92,14.12);
}

function concourse(k,api){
  // The concourse lies under the east platform. The open front faces the cut,
  // so columns, a ticket office and the entrance to the stairs share a sightline.
  const p=k.frame(102,-224,trackAngle),{B,C,point}=p;
  B('hull',steel,0,6.56,.4,25.6,.96,10.24);C(0,6.56,.4,25.6,.96,10.24);
  B('hull',ink,0,3.12,-4,25.6,5.76,1.28);C(0,3.12,-4,25.6,5.76,1.28);
  for(let i=-3;i<=3;i++){
    const u=i*3.52;
    const counter=(m,col,x,y,v,w,h,d)=>B(m,col,x,y,-1.98+v,w,h,d);
    interiorBay(counter,u,3.20,1.28,3.84,(i+4)%3,false);
    B('light',0xc2f7ff,u,5.63,-3.20,3.40,.48,.20);
    B('hull',steel,u,1.16,-2.02,3.36,.32,1.72);
    coursedPier(counter,u-1.57,.48,.80,5.28,i+3,false);
    B('light',0xc6ecf6,u,6.03,1.2,.48,.10,6.4);
  }
  for(const e of [-1,1])for(const v of [-3.36,4.8]){
    B('hull',stone,e*11.84,3.12,v,.96,5.76,.96);C(e*11.84,3.12,v,.96,5.76,.96);
    for(let i=0;i<3;i++)B('hull',steel,e*11.84,5.5+i*.32,v,1.28+i*.64,.32,1.28+i*.32);
  }
  const [x,z]=point(-4.8,5.56);api.sign(x,6.6,z,9.6,1.12,'轨道东厅','EAST LINE / TRANSFER','#a6e8e9',trackAngle);
}

function privateLink(kit){
  const a=[64,-292],b=[108,-297],l=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  const {B,C}=kit.frame(...a,yaw);
  B('hull',steel,l/2,31.76,0,l,.96,4.48);C(l/2,31.76,0,l,.96,4.48);
  B('hull',ink,l/2,35.74,0,l,.64,4.96);
  // The centre span is a through-view. Screens and people sit behind the
  // near parapet, while the heavy acoustic locks sit over the two tower ends.
  for(const along of [-1,1]){
    const end=l/2+along*(l/2-5.2);
    B('pane',0xd0bfad,end,33.84,0,10.4,3.2,3.84);
    B('hull',stone,end,35.89,0,10.88,.64,5.44);
    for(let j=0;j<3;j++){
      const x=end+along*(1.6+j*1.28);
      B('hull',j===0?steel:stone,x,31.10-j*.32,0,1.28,.48+j*.64,4.96);
    }
  }
  for(const side of [-1,1]){
    B('hull',steel,l/2,32.57,side*2.10,l,.75,.38);
    B('hull',ivory,l/2,33.03,side*2.12,l,.18,.48);
    B('hull',steel,l*.50,30.88,side*1.56,l*.65,.80,.64);
    B('light',0x92c4c9,l/2,30.46,side*1.56,l*.48,.12,.32);
    for(let x=8.96;x<l-7;x+=6.4){
      B('hull',stone,x,33.86,side*2, .64,3.44,.64);
      B('hull',steel,x+.40,35.07,side*1.80,1.44,.64,.96);
    }
  }
  // Seen from street level, transverse diaphragms make a run of deep
  // ceiling pockets. A few maintenance lights pick up the outer rib edges.
  for(let i=0;i<6;i++){
    const x=l/2+(i-2.5)*4.16;
    B('hull',stone,x,30.94,0,.64,.64,4.32);
    B('hull',steel,x,30.48,0,.96,.32,3.52);
    if(i%2===1)B('light',0xcab58c,x+.50,30.65,.64,.12,.24,1.28);
  }
  B('hull',0xa19382,l/2,33.66,-1.36,4.16,2.72,.32);
  B('light',0xf2ba82,l/2,34.81,-1.09,3.68,.32,.32);
  for(const x of [l*.38,l*.63]){
    B('hull',ink,x,32.63,.36,.54,.78,.42);
    B('hull',0xa38a75,x,33.32,.36,.58,.72,.38);
    B('hull',0xa98368,x,33.87,.36,.34,.38,.34);
  }
}

function southernGate(k,api){
  const f=k.frame(68,-189.8,0),{B,C}=f;
  B('hull',ink,0,5.6,0,4.8,10.88,5.76);C(0,5.6,0,4.8,10.88,5.76);
  for(let j=0;j<12;j++)B('hull',j%3?steel:stone,0,2.4+j*.64,3,4.48,.32,.64);
  for(let j=0;j<3;j++)B('hull',stone,.32*j,11.04+j*.64,0,5.12-.64*j,.64,6.4-.64*j);
  B('light',blue,2.31,7.2,3.08,.32,4.48,.32);
  const a=[46,-186],b=[68,-189.8],span=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  const bridge=k.frame(...a,yaw);
  bridge.B('hull',steel,span/2,9.76,0,span,.96,2.56);
  bridge.B('pane',0xbbc9cc,span/2,11,0,span,1.60,2.24);
  bridge.B('hull',ink,span/2,11.95,0,span,.48,2.56);
  for(let u=2.56;u<span;u+=3.20){
    bridge.B('hull',stone,u,10.88,1.18,.48,2.24,.64);
    bridge.B('hull',ink,u,9.15,0,1.28,.32,2.56);
  }
  const [sx,sz]=bridge.point(span*.5,1.55);
  api.sign(sx,10.85,sz,6.4,1.22,'折光北埠','NORTH / TRANSIT','#99ccd8',yaw);
  // Frame the south threshold from both directions. The luminous intrados
  // carries the same reveal as the public hall, down to pedestrian height.
  const threshold=k.frame(58,-181.6,0);
  for(const hand of [-1,1]){
    const u=hand*7.68;
    threshold.B('ceramic',ivory,u,4.64,0,1.60,9.12,2.56);
    threshold.C(u,4.64,0,1.60,9.12,2.56);
    for(let i=0;i<5;i++){
      const x=u-hand*i*.56,y=8.96+i*.64;
      threshold.B('ceramic',ivory,x,y,0,2.56,.80,2.88);
      for(const face of [-1,1])threshold.B('light',0xc3e8ef,x,y,face*1.47,1.92,.32,.12);
    }
    for(const face of [-1,1])threshold.B('light',0xbfdeee,u-hand*.38,4.88,face*1.32,.32,7.68,.12);
  }
  threshold.B('alloy',steel,0,12.12,0,11.52,.96,2.88);
  threshold.B('light',0xc3e8ef,0,11.59,0,10.88,.12,2.24);
}

// Recess the exchange frontage behind a covered public floor. The long
// luminous ceiling and repeated portal reveals read from either approach.
function exchangeArrival(k){
  const {B,C}=k.frame(60,-214,-.838);
  for(const u of [-8.64,0,8.64]){
    for(const side of [-1,1]){
      const v=side*2.72;
      B('ceramic',ivory,u,3.52,v,1.12,6.72,1.28);
      C(u,3.52,v,1.12,6.72,1.28);
      for(let i=0;i<4;i++){
        B('alloy',steel,u,6.98+i*.48,v-side*i*.48,1.28+i*.32,.48,1.60);
      }
    }
  }
  for(let i=0;i<7;i++){
    const u=(i-3)*2.88,depth=9.28+(3-Math.abs(i))*.64;
    B('composite',ink,u,9.04,.72,2.88,.96,depth);
    B('ceramic',ivory,u,9.65,.64,2.86,.32,depth+.48);
    B('light',0xc1e5ee,u,8.51,.64,2.46,.12,depth-.64);
    B('alloy',steel,u,8.24,depth/2+.32,1.92,.48,.72);
    B('light',0xc6e8ee,u,8.39,depth/2+.74,2.48,.31,.16);
  }
  C(0,9.04,.72,20.16,1.12,9.28);
  for(const side of [-1,1]){
    const u=side*8.64;
    for(let i=0;i<4;i++){
      const h=10.24+i*1.92;
      B('ceramic',i%2?stone:ivory,u+side*i*.48,9.68+h/2,-2.50-i*.48,1.28,h,1.92);
      B('light',0xb8daeb,u+side*i*.48,9.68+h/2,-1.50-i*.48,.24,h,.12);
    }
  }
}

function interchangeHall(k,api){
  const f=k.frame(48,-257,-.25),{B,C,point}=f;
  // The narrow canopy shelters the ticket counters. The east fork rises
  // above it to carry the control gallery and the tall public doorway.
  for(const u of [-4.48,3.84]){
    B('hull',stone,u,4.48,-4.48,1.6,8.64,2.24);C(u,4.48,-4.48,1.6,8.64,2.24);
    for(let i=0;i<4;i++)B('hull',steel,u,7.2+i*.48,-4.16+i*.32,2.24+i*.64,.48,2.56+i*.96);
  }
  for(let i=0;i<7;i++){
    const upper=i>=3;
    const length=upper?13.12+(i-3)*.96:15.36-i*1.28;
    const height=upper?12.16+(i-3)*.64:8.63+i*.32;
    const v=(upper?-7.68:-5.12)+length/2;
    const u=-7.68+i*2.56,nose=v+length/2;
    B('hull',ink,u,height,v,2.56,.80,length);
    B('hull',stone,u,height+.56,v,2.50,.32,length+.32);
    B('light',i%3===0?0x99cced:0xbad9de,u,height-.44,v,.32,.12,length*.7);
    // Projecting ceramic caps follow the fan in plan. Stagger the middle
    // course outward to show real depth along the diagonal street approach.
    B('hull',0x819b99,u,height+.88,nose-.64,2.52,.32,2.24);
    B('hull',0xbac5b5,u,height+.69,nose+.50,2.48,.64,.64);
    B('hull',0x47676d,u,height+.08,nose+.12,2.48,.48,.56);
    for(const side of [-1,1]){
      B('hull',steel,u+side*.79,height-.44,nose-.82,.56,.48,2.22);
      B('hull',ink,u+side*.79,height-.78,nose-1.20,.40,.20,1.60);
    }
  }

  // One folded load-bearing wall, four metres deep, grows towards the street
  // above head height. Its foot remains behind the full width of the main walk.
  // Two returns, a dark core and exposed toothed blocks keep the soffit and
  // the side reading differently as a walker comes around the junction.
  const footingU=12.16,footingV=-15.36;
  B('hull',ink,footingU,1.71,footingV,3.04,3.06,4.00);
  C(footingU,1.71,footingV,3.04,3.06,4.00);
  for(let j=0;j<10;j++){
    const t=Math.max(0,j-2),u=footingU+t*.16,v=footingV+t*1.28,y=1.04+j*1.36;
    const w=2.88+(j<3?.64:0),depth=4.16;
    B('hull',j%2===0?0x879d9c:0x6b8384,u,y,v,w,1.34,depth);
    C(u,y,v,w,1.34,depth);
    B('hull',steel,u-w/2+.24,y+.07,v-.08,.64,1.20,depth+.28);
    B('hull',j%2?ivory:0x9eada5,u+.16,y-.32,v+depth/2+.08,w-.24,.64,.48);
    B('light',j<3?0xe1ab69:0xa2cdca,u-.72,y+.25,v+depth/2+.04,.48,.42,.24);
    if(j>2)B('light',0xc39461,u-w/2-.10,y+.22,v+.42,.16,.24,1.92);
  }
  // The box girder returns back over the gallery, then projects towards the
  // corner in five large steps. The cantilever is clear of the viaduct deck.
  B('hull',steel,9.12,13.32,-.96,3.84,1.28,10.88);
  B('hull',steel,10.88,13.32,-6.40,7.36,1.28,3.20);
  B('hull',stone,10.88,14.12,-6.40,7.68,.32,3.52);
  for(let j=0;j<5;j++){
    const u=8.96+j*.80,y=13.44+j*.32,v=3.30+j*.64;
    B('hull',j%2?0x93a6a0:stone,u,y,v,3.08,.96,3.20);
    B('hull',0x8c745d,u,y-.58,v+.08,2.76,.20,2.56);
    B('light',0xddbf92,u,y-.71,v+.58,1.28,.10,.32);
  }

  // The control gallery overlooks the open front. Its two glazed faces turn
  // the corner and reveal the deck and ceiling through a deep arcade below.
  const galleryU=-2.48,galleryV=-7.48;
  B('hull',steel,galleryU,8.30,galleryV,10.24,.64,3.84);
  B('hull',ink,galleryU,10.16,galleryV-1.53,10.24,3.12,.56);
  B('hull',0xb8bbb0,galleryU,11.97,galleryV,10.56,.48,4.16);
  B('hull',0x9aa4a3,galleryU,8.75,galleryV+1.48,10.24,.40,.64);
  for(let j=0;j<4;j++){
    const u=galleryU-3.84+j*2.56;
    B('pane',j===1?0xf5d4ab:0xc7d3cd,u,10.31,galleryV+1.02,2.46,2.56,.18);
    B('hull',steel,u-1.20,10.30,galleryV+1.31,.24,2.88,.72);
    B('light',j%2?0xe0b88d:0xacd5d4,u,11.67,galleryV+1.08,1.60,.16,.18);
  }
  B('pane',0xc2d2d5,galleryU+5.03,10.31,galleryV-.26,.16,2.56,2.46);
  // A corner ticket lodge turns its lit side towards the approach. Its front
  // jamb carries the lower fork; behind it the much taller east portal stays
  // open through to the gallery. This makes the two depths legible on foot.
  B('hull',ink,-5.28,1.12,2.88,2.56,1.86,3.84);
  C(-5.28,2.74,2.88,2.56,5.12,3.84);
  B('hull',patina,-5.28,1.96,2.88,2.88,.28,4.16);
  B('hull',0x513e36,-5.92,3.56,2.88,.96,3.0,3.20);
  B('light',0xd2aa78,-5.39,3.73,2.88,.14,1.68,2.68);
  B('hull',bronze,-5.13,2.72,2.88,.80,.24,2.88);
  B('hull',ink,-5.08,3.16,2.37,.30,.64,.92);
  B('hull',steel,-4.87,3.28,3.48,.18,1.92,.16);
  B('hull',0x817664,-5.28,5.06,2.88,2.64,.42,3.96);
  for(const v of [1.28,4.48]){
    for(let j=0;j<5;j++){
      const shift=j%2?.12:0;
      B('hull',j%2?patina:stone,-4.24+shift,2.39+j*.56,v,.64+shift,.52,.64);
    }
  }
  for(let j=0;j<6;j++){
    const v=3.04+j*.48,u=-5.20+j*.22;
    B('hull',j%2?patina:steel,u,5.51+j*.56,v,2.88,.56,4.00);
    B('hull',0xb2b6a8,u,5.43+j*.56,v+2.00,2.96,.32,.48);
    B('light',0xd2a775,u+.64,5.29+j*.56,v+2.02,.64,.16,.32);
  }
  // Open gates lie on the service edge, on the back side of the fan. They
  // leave a through aisle wider than 1.75 m and never reduce the street route.
  for(const u of [-2.56,-.16,2.24]){
    B('hull',steel,u,.97,.16,.50,1.54,1.92);
    C(u,.97,.16,.50,1.54,1.92);
    B('hull',0x839f9b,u,1.77,.08,.66,.16,2.08);
    B('light',0x8dd9ba,u,1.88,.65,.32,.08,.48);
  }
  // A continuous ticket-room light across the dark back wall of the station.
  // Physical jambs interrupt the light at eye level, keeping the interior legible.
  B('hull',ink,-.64,3.04,-4.56,15.36,5.44,.96);C(-.64,3.04,-4.56,15.36,5.44,.96);
  // A recessed, continuous clerestory carries the eye across all five ticket
  // bays at street distance. The fins and the dark return separate it from the
  // individually furnished windows at shoulder height.
  B('hull',ink,-.64,6.25,-3.57,15.6,1.64,1.66);
  for(let i=0;i<5;i++){
    const u=-6.4+i*2.88;
    B('light',i===1||i===4?0xcaecf1:0xe7f8f8,u,6.22,-2.67,2.77,1.02,.22);
    B('hull',steel,u-1.39,6.20,-2.48,.16,1.39,.54);
    B('hull',0xabc1bf,u,5.58,-2.48,2.80,.18,.68);
    const booth=(m,col,x,y,v,w,h,d)=>B(m,col,x,y,-2.56+v,w,h,d);
    interiorBay(booth,u,2.75,1.28,3.84,i%3,false);
    B('light',0xc2f7ff,u,5.31,-3.89,2.85,.64,.40);
    coursedPier(booth,u-1.25,.48,.80,5.30,i,false);
  }
  // Hang the arrival sign from two separate roof arms. The interchange mark
  // at the right-hand end is open through its middle, visible from either side.
  B('hull',ink,-1.92,7.19,6.88,10.56,1.76,.88);
  B('hull',steel,-1.92,8.15,6.88,10.88,.16,1.12);
  B('hull',0x8daba7,-1.92,6.23,6.88,10.88,.16,1.12);
  for(const u of [-5.76,1.92,5.12]){
    B('hull',steel,u,8.55,4.64,.64,.64,5.12);
    B('hull',steel,u,7.99,6.88,.48,1.44,.64);
    if(u>0){
      const top=u<3?12.32:13.00;
      B('hull',steel,u,(8.72+top)/2,3.04,.40,top-8.72,.64);
    }
  }
  const [x,z]=point(-1.92,7.36);
  api.sign(x,7.18,z,9.92,1.28,'折光换乘','TIDE / INTERCHANGE','#90dfdf',-.25);
  // Two opposed track paths form a square-cut interchange symbol inside
  // the stepped lantern. Cast side faces catch the side light below the rail.
  const cx=5.12,cy=6.63;
  for(const side of [-1,1]){
    B('hull',0x475961,cx,cy+side*1.76,6.88,2.24,.48,1.28);
    B('hull',0x475961,cx+side*1.76,cy,6.88,.48,2.24,1.28);
    B('light',0xf6ba72,cx,cy+side*1.76,7.57,2.22,.32,.12);
    B('light',0xe89d59,cx+side*1.76,cy,7.57,.32,2.22,.12);
    for(const end of [-1,1]){
      B('hull',0x68807f,cx+end*1.28,cy+side*1.28,6.88,.66,.66,1.12);
      B('light',0xf1ae65,cx+end*1.28,cy+side*1.28,7.48,.48,.48,.12);
    }
    B('hull',ink,cx,cy+side*.64,6.88,3.36,.48,.48);
    B('light',0xd0f0e6,cx-side*.04,cy+side*.64,7.18,2.16,.26,.16);
    for(const wing of [-1,1]){
      B('light',0xd0f0e6,cx+side*.76,cy+side*.64+wing*.26,7.18,.32,.26,.16);
      B('light',0xd0f0e6,cx+side*.51,cy+side*.64+wing*.50,7.18,.28,.22,.16);
    }
  }
}

const parcelStreets=coreRoutes.flatMap(road=>road.points.slice(1).map((end,i)=>({id:road.id,start:road.points[i],end})));
function streetForParcel(p){
  let closest,dist=Infinity;
  for(const {id,start:[x,z],end:[xx,zz]} of parcelStreets){
    const dx=xx-x,dz=zz-z,t=Math.max(0,Math.min(1,((p.x-x)*dx+(p.z-z)*dz)/(dx*dx+dz*dz)));
    const d=(p.x-x-t*dx)**2+(p.z-z-t*dz)**2;
    if(d<dist){closest=id;dist=d;}
  }
  return closest;
}

function workingRoadEdges(kit){
  for(const route of coreRoutes.filter(r=>r.id!=='core-interchange-walk')){
    for(let i=1;i<route.points.length;i++){
      const [ax,az]=route.points[i-1],[bx,bz]=route.points[i],dx=bx-ax,dz=bz-az;
      const length=Math.hypot(dx,dz);
      for(let t=8,pos=0;t<length-4;t+=15.36,pos++){
        const f=kit.frame(ax+dx*t/length,az+dz*t/length,-Math.atan2(dz,dx)),{B,C}=f;
        const side=(i+pos)%2?-1:1,v=side*(route.width/2+1.28);
        if(route.id==='core-east-terrace'){
          // Hanging gardens at walking height, with a visible service cavity
          // between each planted tray. An open sky slot separates each pair.
          for(const u of [-2.88,2.88]){
            B('hull',stone,u,3.28,v,.64,6.56,.96);C(u,3.28,v,.64,6.56,.96);
          }
          for(let j=0;j<3;j++){
            const zz=v-side*j*.80,yy=4.48+j*.96;
            B('hull',ivory,0,yy,zz,7.04-j*.64,.64,1.28);
            for(let k=-2;k<=2;k++)B('hull',(j+k)%2?0x669875:0x476f62,k*1.12,yy+.64,zz,1.28,.64,1.28);
            B('light',0xf1bd87,0,yy-.42,zz,4.48,.16,.64);
          }
        }else if(route.id==='core-west-loop'){
          const span=Math.min(12.8,length-2*t+8.0);if(span<3.84)continue;
          for(const u of [-span*.35,span*.35]){
            B('hull',steel,u,3.36,v,.80,6.72,.96);C(u,3.36,v,.80,6.72,.96);
            B('hull',0xa97f65,u,6.16,v-side,1.28,.80,3.20);
          }
          for(let k=0;k<3;k++){
            const zz=v-side*(.48+k*.96),y=6.88+k*.32;
            B('hull',k===1?0x926e56:steel,0,y,zz,span,.64,.64);
            for(const u of [-span*.36,0,span*.36])B('hull',0xb49276,u,y,zz,.64,.96,.96);
          }
        }else{
          // Travelling hoists cantilever towards the repair lane; leave a
          // consistent high clearance and alternate sides around each bend.
          B('hull',ink,0,3.52,v,1.28,7.04,1.28);C(0,3.52,v,1.28,7.04,1.28);
          for(let j=0;j<4;j++)B('hull',0xac8751,0,5.60+.48*j,v-side*.8*j,1.28,.64,1.28);
          B('hull',0xd9a65e,0,7.52,v-side*2.24,.96,.64,5.76);
          B('hull',steel,0,6.72,v-side*3.84,1.28,.96,1.28);
          B('light',0xffbc68,0,6.10,v-side*3.84,.64,.24,.64);
        }
      }
    }
  }
}

function streetElevation(B,street,w,d,base,height,seed){
  // Wrap both long faces so a change of direction reveals the same occupation.
  for(const s of [-1,1]){
    const v=s*(d/2-.48),y=base+.80;
    if(street==='core-east-terrace'){
      for(let floor=0;floor<3&&y+floor*3.20<height;floor++){
        const u=((floor+seed)%2?1:-1)*w*.12,level=y+floor*3.20;
        B('hull',ivory,u,level,v,w*.68,.64,2.24);
        for(const hand of [-1,1]){
          B('hull',steel,u+hand*w*.23,level+.64,v+s*.64,w*.16,.64,.96);
          B('hull',0x638977,u+hand*w*.23,level+1.28,v+s*.64,w*.13,.64,.64);
        }
        B('light',0xe7b186,u,level-.40,v+s*.48,w*.38,.16,.48);
      }
    }else if(street==='core-repair-link'){
      const reach=w*.38;
      for(const sign of [-1,1]){
        B('hull',steel,sign*reach,base*.64,v,.64,base*.68,1.28);
        B('hull',0xb78651,sign*reach,base*.85,v+s*.72,1.28,.64,2.24);
      }
      B('hull',0xc3975e,0,base-.32,v+s*.96,w*.85,.96,.96);
      B('hull',ink,(seed%3-1)*w*.22,base-1.12,v+s*1.12,1.28,.80,1.28);
    }else if(street==='core-west-loop'){
      for(let i=0;i<3;i++){
        const u=(i-1)*w*.25,stack=2.56+((seed+i)%3)*1.28;
        B('hull',0x736d65,u,y+stack/2,v,1.28,stack,1.60);
        B('hull',steel,u,y+stack,v,1.92,.64,2.24);
        B('light',0xe8a366,u,y+.32,v+s*.83,.64,.32,.32);
      }
      B('hull',0x967a65,0,y,v,w*.84,.96,1.60);
    }else{
      for(const hand of [-1,1]){
        B('hull',ivory,hand*w*.39,y+1.92,v,1.28,5.76,1.60);
        B('light',blue,hand*w*.39,y+1.92,v+s*.86,.32,5.12,.24);
      }
    }
  }
}

function blockBuilding(kit,p,seed,style,height){
  const f=kit.frame(p.x,p.z,p.angle),{B}=f,home=style==='residence',works=style==='works';
  const base=works?6.4:home?6.72:9.6;
  if(p.x===28&&p.z===-194)buildExchangeRelayPodium(f,p.w,p.d);
  else if(!works||p.w>=10.5)
    splitConcourse(structureFrame(f),p.w,p.d,.18,base,seed,home||works);
  else podium(f,p.w,p.d,base,home||works,seed);
  const upperWidth=p.w*(works?.78:.83),upperDepth=p.d*(home?.72:.79);
  const street=streetForParcel(p);
  const first=(height-base)*(street==='core-east-terrace'?.47:street==='core-west-loop'?.76:.64);
  streetElevation(B,street,p.w,p.d,base,height,seed);
  if(height>base+2.0){
    upper(f,-p.w*.03,-p.d*.05,upperWidth,upperDepth,base+.5,first,style,seed);
    const setBack=street==='core-east-terrace'?.17:.055;
    upper(f,p.w*setBack,-p.d*.10,upperWidth*(setBack>.10?.60:.78),upperDepth*.82,base+.75+first,height-base-first,style,seed+1);
  }
  const top=height+1;
  if(works){
    for(let j=-1;j<=1;j++){
      B('hull',steel,j*2.24,top+.56,-1,1.92,1.12,2.56);
      for(let i=0;i<4;i++)B('hull',ink,j*2.24-.64+i*.40,top+1.23,-1,.18,.28,2.08);
    }
  }else if(!home){
    B('hull',steel,upperWidth*.16,top+2,-1,upperWidth*.45,3.84,upperDepth*.56);
    B('hull',ink,upperWidth*.27,top+5.76,-1,.64,4.48,.64);
    B('light',seed%3?blue:plum,upperWidth*.27,top+8.08,-1,.48,.32,.48);
  }
}

export function addFutureCore(scene,api){
  const k=kit(scene,api.colliders,api.materials),edges=roadEdges(),buildings=[],lights=[];
  const reserved=[lot(60,-214,23.68,16.64,-.838),lot(76,-218.5,15,49),lot(102,-205,7,32),lot(46,-195,6,5),lot(35,-210,6,5),
    lot(61,-261.5,35,18),lot(68,-189.8,4.8,5.76),
    lot((trackStart[0]+trackEnd[0])/2,(trackStart[1]+trackEnd[1])/2,trackLength,8.3,trackAngle)];
  const trackFrame=k.frame(...trackStart,trackAngle);
  for(const u of [25,165]){const p=trackFrame.point(u,6.5);reserved.push(lot(...p,35,9,trackAngle));}
  let serial=0;
  function eligible(p){
    return p.corners.every(([x,z])=>inside(x,z))&&!reserved.some(b=>intersects(p,b))&&
      !edges.some(({a,b,half})=>{
        const dx=b[0]-a[0],dz=b[1]-a[1];
        return intersects(p,lot((a[0]+b[0])/2,(a[1]+b[1])/2,Math.hypot(dx,dz)+1,2*half+3,-Math.atan2(dz,dx)));
      });
  }
  function place(p,height,style){
    reserved.push(p);buildings.push({...p,height,style});blockBuilding(k,p,++serial,style,height);
  }
  const hq=lot(88,-351,29,25,-.72);
  reserved.push(hq);buildings.push({...hq,height:180,style:'headquarters'});
  const landmarks=[headquarters(k,api,scene,lights)];
  place(lot(64,-292,16,17,.3),79,'office');place(lot(108,-297,19,18,-.45),104,'residence');
  privateLink(k);
  workingRoadEdges(k);
  const facade=k.frame(108,-297,-.45),[ax,az]=facade.point(2.56,11.12);
  facade.B('hull',steel,2.56,31.84,10.24,9.28,23.04,1.60);
  transitDisplay(scene,ax,31.84,az,-.45);
  const rail=railAndStations(k,api,edges);eastStair(k,api);concourse(k,api);interchangeHall(k,api);southernGate(k,api);exchangeArrival(k);
  // The long diagonal rail, hospital wards and older service yards set parcel
  // orientations. Along each bend a frontage faces its own segment.
  const anchors=[
    [-43,-311,25,21,-.20,89,'office'],[-51,-283,17,19,.7,51,'works'],
    [-22,-367,26,22,.60,116,'office'],[9,-378,20,22,.2,143,'office'],
    [39,-382,22,17,-.28,92,'office'],[82,-381,18,19,-.40,134,'office'],
    [119,-351,19,21,-.68,111,'residence'],[144,-319,21,22,-.38,67,'residence'],
    [150,-293,16,19,.18,53,'residence'],[107,-266,16,14,-.32,42,'residence'],
    [109,-239,19,11,.3,25,'residence'],[11,-278,22,16,.66,54,'office'],
    [15,-326,28,22,-.3,79,'office'],[-51,-235,11,12,.6,14,'works'],
    [46,-186,9,8,1.57,16,'works'],[71,-189,8,9,-1.4,19,'works'],
    [28,-194,12,12,-.6,29,'works'],[92,-207,11,11,0,32,'residence'],
    [94,-195,7,8,.10,13,'works'],[22,-211,8,8,0,23,'works'],
    [49,-315,14,12,.50,55,'office'],[88,-326,9,10,0,46,'residence'],
    [6,-193,17,12,-.1,41,'office'],[-14,-194,10,14,-.4,24,'works'],
    [19,-204,12,10,.40,22,'works'],[37,-193,13,11,.65,14,'works']
  ];
  for(const [x,z,w,d,yaw,height,style] of anchors){
    const p=lot(x,z,w,d,yaw);if(eligible(p))place(p,height,style);
  }
  for(const [index,{a,b,half}] of edges.entries()){
    const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx);
    const segments=Math.max(1,Math.round(len/15));
    for(let n=0;n<segments;n++)for(const side of [-1,1]){
      const seed=index*37+n*13+side+1,style=index<9?'office':index<13?'works':index<18?'residence':'works';
      const t=(n+.50)/segments,w=Math.min(len/segments-1.8,10.2+(seed%6)*.8);
      const pocket=(index+n+side+5)%5===0;
      const d=8.9+(seed%5)*1.28,offset=half+d/2+(pocket?8.64:3.36)+(seed%3)*.48;
      const x=a[0]+dx*t-side*dz/len*offset,z=a[1]+dz*t+side*dx/len*offset;
      const p=lot(x,z,w,d,yaw+(side>0?Math.PI:0));if(!eligible(p))continue;
      const height=z> -252?9.6+seed%4*3.2:15.36+(seed%6)*4.8;
      place(p,height,style);
    }
  }
  // Shorter parcels fit the street frontage that the tower lotter rejects at
  // bends. The river-like freight cut, rail land, steps, sidewalks and pre-
  // existing ground-level equipment stay outside the new building footprints.
  const inserts=[];
  for(const [index,side,stories] of [[2,-1,4],[3,1,5],[5,1,4],[6,-1,6],[7,1,4],
    [8,-1,5],[10,-1,3],[12,1,3],[15,1,4],[16,-1,4],[20,1,3],[21,-1,4]]){
    const {a,b,half}=edges[index],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    const angle=-Math.atan2(dz,dx)+(side>0?Math.PI:0);
    let selected;
    for(const width of [14.08,9.60]){
      for(const t of [.5,.30,.70]){
        const depth=width===14.08?7.68:6.40,offset=half+2.56+depth*.5;
        const x=a[0]+dx*t-side*dz/len*offset,z=a[1]+dz*t+side*dx/len*offset;
        const p=lot(x,z,width,depth,angle);
        if(!eligible(p))continue;
        const crowded=api.colliders.some(({min,max})=>min.y<4&&max.y>.65&&
          max.x>x-width-depth&&min.x<x+width+depth&&max.z>z-width-depth&&min.z<z+width+depth&&
          intersects(p,lot((min.x+max.x)*.5,(min.z+max.z)*.5,max.x-min.x,max.z-min.z)));
        if(!crowded){selected=p;break;}
      }
      if(selected)break;
    }
    if(!selected)continue;
    reserved.push(selected);
    infillExchange(structureFrame(k.frame(selected.x,selected.z,angle)),selected.w,selected.d,stories,index);
    inserts.push({...selected,height:6.4+3.2*stories,style:'works'});
  }
  coreStreetWings((x,z,yaw)=>structureFrame(k.frame(x,z,yaw)));
  // Walkable locations, not positions at the centre of solid volumes.
  landmarks.push({id:'future-platform',title:'东岸换乘站',position:new T.Vector3(102,.30,-190.6)});
  for(const [x,y,z,color,power,distance] of [[83,4.3,-342,0xacf1ff,34,14],[102,3,-192,0x84dded,18,9],[57,3.3,-199,0xebbc8b,14,8]]){
    const l=new T.PointLight(color,power,distance);l.position.set(x,y,z);l.userData.nightPower=power;scene.add(l);lights.push(l);
  }
  buildCoreNightOperations(k,api,scene,buildings,lights);
  fitCoreWheelshop(k,api,scene,buildings,lights);
  buildStaffGalleries(k,api.sign);
  buildCoreGridworks(k,buildings,scene,lights);
  const skyLifts=buildCoreLifts(scene,k,buildings,lights);
  buildings.push(...inserts);
  const stats=k.finish();stats.buildings=buildings.length;
  stats.draws+=skyLifts.draws;stats.triangles+=skyLifts.triangles;
  const platformLight=createPlatformLight(scene,rail);
  stats.draws++; // Shared projection across the two station decks.
  return {buildings,stations:rail.stations,rail,landmarks,lights,stats,setNight:platformLight.setNight,update(dt,time,camera){
    rail.update(dt,time,camera);
    skyLifts.update(time,camera);
    platformLight.update();
    k.updateRelief(camera?.position);
  }};
}
