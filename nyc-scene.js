import * as T from 'three';
import {routeWindow,createRouteWindows} from './nyc-route-windows.js';
import {applyCitySurfaces,shopInterior,addServiceBalcony} from './nyc-city-surfaces.js';
import {createNYCMaterials,createSignTexture} from './nyc-materials.js';
import {createArchitectureBatch,randomSource} from './nyc-geometry.js';
import {createDetailedStreetProps} from './nyc-street-props-v2.js';
import {addCyberLayer} from './nyc-cyber-layer.js';
import {createAtmosphere} from './nyc-atmosphere.js';
import {addWaterfront} from './nyc-waterfront.js';
import {openGreenway} from './nyc-greenway.js';
import {mapPlan} from './nyc-map-plan.js';
import {addDistrictFrontiers} from './nyc-frontiers.js';
import {addMidtown} from './nyc-midtown.js';
import {addMidtownCyber} from './nyc-midtown-cyber.js';
import {createPlayableArea} from './nyc-regions.js';
import {addStreetLife} from './nyc-street-life.js';
import {addCityDetail} from './nyc-city-detail.js';
import {createCityCrowd} from './nyc-city-crowd.js';
import {SAMPLE_FRONTAGES,addSampleFrontages} from './nyc-sample-frontages.js';
import {addSampleStreet} from './nyc-sample-street.js';
import {addCityOccupation} from './nyc-city-occupation.js';
import {addSoHo} from './nyc-soho.js';
import {addEastPark} from './nyc-east-park.js';
import {flushDistrictRoads} from './nyc-district-kit.js';

/**
 * Rain-afterglow Manhattan sample district. All construction is in metres.
 * Road top / spawn feet = .18; sidewalk and park top = .36.
 * Four districts share one street network, world boundary, ground and map.
 * The Hudson greenway, SoHo courts and East Commons remain continuous.
 */
export async function createNYCScene(scene,renderer) {
  const materials=createNYCMaterials(renderer);
  await applyCitySurfaces(materials,renderer);
  createRouteWindows(materials);
  const batch=createArchitectureBatch(scene,materials,64);
  const {box,beam}=batch, rand=randomSource(20261112);
  const colliders=[],walkSurfaces=[],signMeshes=[],moving=[],localLights=[];
  let buildings=0,trees=0,fireEscapes=0,waterTanks=0;
  const ROAD=.18,SIDE=.36;
  const bounds={...mapPlan.currentBounds};
  const isPlayable=createPlayableArea(mapPlan.currentOutline);
  function collider(x,y,z,w,h,d){colliders.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));}
  function surface(minX,maxX,minZ,maxZ,y=SIDE){walkSurfaces.push({minX,maxX,minZ,maxZ,y});}
  function tint(spread=.08){const v=1-spread/2+rand()*spread;return new T.Color(v,v,v);}
  function windowMaterial(){const r=rand();return r<.32?'warmWindow':r<.42?'coolWindow':'glass';}
  const detailedProps=createDetailedStreetProps({box,beam,materials,colliders,sign,surface,rand});

  // The subway well is a real opening. Split the solid ground around it while
  // its existing closed-entry collider keeps players on the street network.
  const well={minX:-10.32,maxX:-6.88,minZ:11.64,maxZ:13.96};
  function groundRect(mat,minX,maxX,minZ,maxZ,y,h){if(maxX-minX>.001&&maxZ-minZ>.001)box(mat,(minX+maxX)/2,y,(minZ+maxZ)/2,maxX-minX,h,maxZ-minZ);}
  function groundAround(mat,minX,maxX,minZ,maxZ,y,h){
    groundRect(mat,minX,maxX,minZ,well.minZ,y,h);groundRect(mat,minX,maxX,well.maxZ,maxZ,y,h);
    groundRect(mat,minX,well.minX,well.minZ,well.maxZ,y,h);groundRect(mat,well.maxX,maxX,well.minZ,well.maxZ,y,h);
  }
  // Non-playable city ground ties the skyline to the same shore. It remains
  // below the authored roads and never grants access past the construction.
  box('asphalt',81,-.55,0,438,1,1400,0x819291);
  // The closed construction frontiers retain a short visual apron for the
  // orbit camera; gameplay bounds and walk surfaces still end at z=±52.
  groundAround('asphalt',-44,64,-52,70,.01,.34);
  surface(-44,44,-52,52,ROAD);
  // Four continuous sidewalks keep a simple, fully connected movement network.
  for(const x of [-8.55,8.55]){
    if(x<0)groundAround('concrete',x-2.05,x+2.05,-52,52,.27,.18);
    else box('concrete',x,.27,0,4.1,.18,104);
    surface(x-2.05,x+2.05,-52,52);
  }
  for(const z of [-8.55,8.55]){
    box('concrete',0,.27,z,88,.18,4.1);
    surface(-44,44,z-2.05,z+2.05);
  }
  // Individual curb stones articulate the real quarter-metre stepped edge.
  for(let z=-51.75;z<52;z+=.5)for(const x of [-6.64,6.64]){
    if(Math.abs(z)<6.9)continue;
    box('curbStone',x,.285,z,.28,.21,.48,tint(.12));
  }
  for(let x=-43.75;x<44;x+=.5)for(const z of [-6.64,6.64]){
    if(Math.abs(x)<6.9)continue;
    box('curbStone',x,.285,z,.48,.21,.28,tint(.12));
  }
  // Set paving blocks on key corners, rather than drawing a grid on a flat box.
  for(const xx of [-1,1])for(const zz of [-1,1])for(let u=0;u<7;u++)for(let v=0;v<7;v++){
    box('paver',xx*(6.85+u*.5),.364,zz*(6.85+v*.5),.485,.028,.485,tint(.1));
  }
  // Four pedestrian crossings, with worn strips and tactile curb landings.
  for(const z of [-8.15,8.15])for(let x=-5.85;x<=5.85;x+=1.28){
    box('white',x,.187,z,.64,.014,2.5,tint(.16));
  }
  for(const x of [-8.15,8.15])for(let z=-5.85;z<=5.85;z+=1.28){
    box('white',x,.188,z,2.5,.014,.64,tint(.16));
  }
  for(let z=-47;z<49;z+=8){if(Math.abs(z)<14)continue;for(const x of [-.13,.13])box('yellow',x,.188,z,.08,.014,3.1);}
  for(let x=-41;x<43;x+=8){if(Math.abs(x)<14)continue;for(const z of [-.13,.13])box('yellow',x,.188,z,3.1,.014,.08);}
  for(let z=-48;z<52;z+=12)for(const x of [-5.8,5.8])box('white',x,.188,z,.1,.014,2.6,tint(.12));
  for(const x of [-8.5,8.5])for(const z of [-8.5,8.5]){
    box('yellow',x,.385,z,1.28,.025,.7);
    for(let a=0;a<8;a++)for(let b=0;b<4;b++)box('yellow',x-.55+a*.155,.408,z-.25+b*.16,.045,.025,.045);
  }
  // Broken wet patches accumulate at curbs, leaving the centre dry enough to read.
  for(let i=0;i<85;i++){
    const vertical=rand()>.32, x=vertical?(rand()>.5?5.35:-5.35):rand()*82-41;
    const z=vertical?rand()*98-49:(rand()>.5?5.35:-5.35);
    if(Math.abs(x)<10&&Math.abs(z)<10)continue;
    const w=.5+rand()*1.8,d=.5+rand()*3.3;
    box('puddle',x,.188,z,w,.008,d,tint(.08));
    box('puddle',x+w*.34,.189,z+d*.25,w*.45,.008,d*.48,tint(.08));
  }
  function grate(x,z,rotate=0){
    box('metal',x,.2,z,.7,.035,1.15,0xa8b1b0,rotate);
    for(let i=-3;i<=3;i++)box('rubber',x+i*.085,.222,z,.035,.012,.95,0xffffff,rotate);
  }
  for(const z of [-42,-19,19,42])for(const x of [-5.65,5.65])grate(x,z);
  for(const [x,z]of [[-2,27],[3,-19],[-24,2],[28,-2]]){
    box('metal',x,.198,z,1.02,.035,1.02,0xa9b6b8);
    for(let j=0;j<7;j++)box('rubber',x-.36+j*.12,.219,z,.035,.012,.8);
    box('metal',x,.229,z,.75,.012,.06,0x899390);
  }

  function sign(x,y,z,w,h,title,subtitle,color='#62e2e8',rot=0,vertical=false) {
    box('metal',x,y,z,w+.2,h+.2,.2,0x68757b,rot);
    const material=new T.MeshStandardMaterial({map:createSignTexture(title,subtitle,color,vertical),emissiveMap:null,emissive:0xffffff,emissiveIntensity:1.05,roughness:.52});
    material.emissiveMap=material.map;
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);
    mesh.position.set(x+Math.sin(rot)*.112,y,z+Math.cos(rot)*.112);mesh.rotation.y=rot;
    mesh.name='NYC authored sign / '+title;scene.add(mesh);signMeshes.push(mesh);return mesh;
  }

  function building(x,z,width,depth,floors,rot=0,variant=0,store='') {
    buildings++;
    const floor=3.2,height=3.75+floors*floor, brick=variant%3===0?'brickBrown':'brick';
    const refit=SAMPLE_FRONTAGES.find(f=>Math.abs(f.x-x)<.01&&Math.abs(f.z-z)<.01&&Math.abs(f.rot-rot)<.01);
    const c=Math.cos(rot),s=Math.sin(rot);
    const world=(u,v,out)=>[x+u*c+out*s,v,z-u*s+out*c];
    const B=(mat,u,v,out,w,h,d,col=0xffffff)=>{const p=world(u,v,out);box(mat,...p,w,h,d,col,rot);};
    const line=(mat,a,b,size=.07,col=0xffffff)=>beam(mat,world(...a),world(...b),size,size,col);
    function solid(u,y,out,w,h,d){const p=world(u,y,out);collider(...p,Math.abs(c)*w+Math.abs(s)*d,h,Math.abs(s)*w+Math.abs(c)*d);}
    if(refit){
      // Preserve the New York upper masonry while making a real void below.
      // An opaque full-height building box would hide the authored shop rooms.
      const cut=4.10,top=height+.36,lower=cut-.36,back=depth-refit.recessDepth;
      B(brick,0,(top+cut)/2,-depth/2,width,top-cut,depth,tint(.13));
      solid(0,(top+cut)/2,-depth/2,width,top-cut,depth);
      B(brick,0,.36+lower/2,-refit.recessDepth-back/2,width,lower,back,tint(.13));
      solid(0,.36+lower/2,-refit.recessDepth-back/2,width,lower,back);
      for(const edge of [-1,1]){
        B(brick,edge*(width/2-.13),.36+lower/2,-refit.recessDepth/2,.26,lower,refit.recessDepth,tint(.12));
        solid(edge*(width/2-.13),.36+lower/2,-refit.recessDepth/2,.26,lower,refit.recessDepth);
      }
    }else{
      B(brick,0,height/2+.36,-depth/2,width,height,depth,tint(.13));
      solid(0,height/2+.36,-depth/2,width,height,depth);
      B('stone',0,1.95,-.02,width+.08,3.2,.22);
      B('trim',0,.68,.08,width+.2,.45,.25);
    }
    B('metal',0,height+.52,-depth/2,width-.4,.18,depth-.4,0x7c8485);
    B('roof',0,height+.4,-depth/2,width-.25,.14,depth-.25);
    // A stepped parapet and dentil cornice are true quarter-voxel geometry.
    for(let i=0;i<3;i++)B('trim',0,height+.23+i*.16,-depth/2,width+.2+i*.18,.16,depth+.2+i*.18,tint(.08));
    B(brick,0,height+1.02,-depth/2,width,.85,depth);
    B('roof',0,height+1.03,-depth/2,width-.48,.88,depth-.48);
    for(let u=-width/2+.24;u<width/2;u+=.38)B('trim',u,height-.02,.25,.22,.26,.34);
    for(const edge of [-1,1]){
      // Chunked corner quoins make the visible silhouette genuinely block-stepped.
      for(let y=refit?4.38:1;y<height-.6;y+=.42)B('stone',edge*(width/2-.18),y,.08,.48,.38,.24,tint(.12));
      for(let zz=-depth+.4;zz<0;zz+=.5)B('trim',edge*(width/2+.035),height+.7,zz,.16,.2,.44);
    }
    const routeProfile=z>=28 && z<=45 && Math.abs(x)===10.65 ? (x>0?'workroom':'home') : null;
    const cols=Math.max(2,Math.floor(width/2.1)),gap=width/cols;
    for(let f=0;f<floors;f++){
      const yy=5.3+f*floor;
      if((f===0&&!refit)||f===floors-1)B('trim',0,yy-1.38,.08,width+.14,.19,.28);
      for(let i=0;i<cols;i++){
        const u=-width/2+gap*(i+.5),ww=1.18+(variant%2)*.1;
        B('metal',u,yy,.092,ww+.18,1.95,.16,0x5a6464);
        const original=windowMaterial();
        const wm=routeProfile?routeWindow(routeProfile,f,i,cols):original==='warmWindow'?'routeHome':original==='coolWindow'?'routeStudio':original;
        B(wm,u,yy,.185,ww,1.78,.04,tint(.14));
        B('metal',u,yy,.235,.07,1.82,.055,0xb1aca0);B('metal',u,yy+.16,.235,ww,.065,.055,0xb1aca0);
        // Slightly projecting lintels and double-step stone sills.
        B('trim',u,yy+1.02,.15,ww+.38,.19,.36,tint(.09));
        B('trim',u,yy-.99,.21,ww+.32,.15,.45,tint(.1));
        B('trim',u,yy-1.08,.13,ww+.16,.08,.27);
        if((f+i+variant)%6===0){B('metal',u,yy-.67,.55,.76,.44,.65,0xa2aaa5);for(let j=0;j<4;j++)B('rubber',u-.28+j*.18,yy-.65,.895,.045,.28,.018);}
      }
    }
    // Side walls have real window relief, including views down alleys.
    for(const edge of [-1,1])for(let f=0;f<floors;f++)for(let j=0;j<Math.floor(depth/2.8);j++){
      const yy=5.3+f*floor,zz=-1.6-j*2.8;
      B('metal',edge*(width/2+.015),yy,zz,.12,1.93,1.24,0x49575b);
      B(windowMaterial(),edge*(width/2+.09),yy,zz,.04,1.72,1.08);
      B('trim',edge*(width/2+.15),yy-.98,zz,.36,.14,1.48);
    }
    if(!refit)for(const e of [-1,1]){
      const p=world(e*(width/2-.31),.36,.44);
      batch.castColumn(...p,2.95,.18,variant);
    }
    // Ground floor storefronts and recessed doorways sized to an adult character.
    if(!refit)for(let i=0;i<cols;i++){
      const u=-width/2+gap*(i+.5),w=gap-.34;
      B('metal',u,1.8,.15,w,2.45,.2,0x3e514f);
      const glazing=i===Math.floor(cols/2)?shopInterior(store,variant):windowMaterial();
      B(glazing,u,1.8,.265,w-.16,2.24,.035,0xffffff);
      B('metal',u,1.8,.30,.075,2.25,.035,0x7e928f);
      B('metal',u,2.22,.30,w-.18,.08,.04,0x7e928f);
      B('trim',u,.55,.38,w+.1,.18,.65);
      // Layered shop jambs and transom caps provide a real shadow reveal.
      for(const e of [-1,1]){
        B('stone',u+e*(w/2+.05),1.86,.31,.20,2.75,.43,0xaaa697);
        B('trim',u+e*(w/2+.05),.64,.4,.28,.28,.53,0xb3af9b);
        B('trim',u+e*(w/2+.05),3.05,.38,.30,.19,.48,0xb4ae9b);
      }
      B('metal',u,2.89,.39,w-.12,.13,.13,0x8e9d92);
      // Selected closed shutters break up the ribbon of identical shop windows.
      if((i+variant)%5===1){
        B('metal',u,1.68,.33,w-.22,1.98,.08,0x7d8b7c);
        for(let sl=0;sl<15;sl++)B('rubber',u,.77+sl*.13,.382,w-.22,.023,.025,0x6a7469);
      }
      B('metal',u,3.34,.47,w+.12,.20,1.0,variant%2?0x426d64:0x8c5d47);
      for(let k=0;k<Math.ceil(w/.3);k++)B('metal',u-w/2+k*.3,3.23,.91,.15,.16,.16,variant%2?0x375c55:0x73533f);
    }
    // Exposed brick clusters catch side light instead of relying on a flat grid.
    if(!refit)for(const edge of [-1,1])for(let row=0;row<15;row++)for(let col=0;col<3;col++){
      const u=edge*(width/2-.75-col*.36+(row%2)*.15);
      B(brick,u,.95+row*.19,.154,.33,.16,.10,tint(.2));
    }
    // Masonry clusters around first-floor lintels and damaged wall edges.
    if(!refit)for(let patch=0;patch<3;patch++){
      const anchor=-width/2+1+patch*(width-2)/2;
      for(let row=0;row<6;row++)for(let col=0;col<4;col++){
        if((row+col+variant)%5===0)continue;
        B(brick,anchor+(col-1.5)*.34+(row%2)*.16,3.7+row*.18,.17,.31,.15,.14,tint(.2));
      }
    }
    // A dark rain band and segmented plinth keep the base in contact with paving.
    if(!refit){
      B('metal',0,.435,.18,width+.08,.12,.25,0x536357);
      for(let u=-width/2+.28;u<width/2;u+=.56)B('stone',u,.58,.22,.53,.22,.33,tint(.16));
    }
    if(variant%2===0 || floors>6){
      fireEscapes++;
      const fu=width*.12;
      for(let f=0;f<Math.min(floors,5);f++){
        const yy=4.18+f*floor;
        B('metal',fu,yy,.78,3.55,.12,1.35);
        for(let j=0;j<12;j++)B('metal',fu-1.58+j*.28,yy+.075,.8,.07,.06,1.27,0x88908b);
        B('metal',fu,yy+1.0,1.38,3.6,.07,.07,0x8d9992);
        for(let j=0;j<10;j++)B('metal',fu-1.62+j*.36,yy+.53,1.38,.045,.98,.045,0x8b948b);
        for(const e of [-1,1]){B('metal',fu+e*1.75,yy+.5,.8,.055,1,1.18,0x8b948b);}
        if(f>0){
          const direction=f%2?1:-1,start=fu-direction*1.48;
          for(let step=0;step<15;step++)B('metal',start+direction*step*.20,yy-floor+step*(floor/15)+.18,1.04,.3,.08,.78,0x8a958e);
          line('metal',[start,yy-floor+.4,1.48],[start+direction*2.8,yy+.2,1.48],.075,0x74877d);
          line('metal',[start,yy-floor+1.2,1.48],[start+direction*2.8,yy+1.0,1.48],.055,0x8b9990);
        }
      }
    }
    // Roof equipment is clustered in one place, allowing a quiet roof silhouette.
    addServiceBalcony(B,width,depth,variant%2?1:-1,variant%3===0);
    const roofY=height+1.3;
    for(let j=0;j<2;j++){
      const u=-width*.25+j*1.35,zz=-depth*.6;
      B('metal',u,roofY+.55,zz,1.15,1.05,1.55,0xafb3a8);
      for(let sl=0;sl<5;sl++)B('rubber',u-.4+sl*.2,roofY+.52,zz+.79,.05,.7,.02);
      B('metal',u,roofY+1.15,zz,.72,.13,1.2,0x89958c);
    }
    B('metal',width*.32,roofY+.9,-depth*.62,.4,1.8,.4,0x6c7d7d);
    B('metal',width*.32,roofY+1.83,-depth*.62,.65,.12,.65,0x99a19b);
    if(variant%3!==1)waterTower(...world(-width*.22,roofY,-depth*.34),1.35+(variant%2)*.18);
    if(store&&!refit){const p=world(0,3.04,.54);sign(...p,Math.min(width-1.2,7.1),.63,store,'NEIGHBORHOOD / EST. 2086',variant%2?'#f2bc81':'#62d9df',rot);}
    // A few vertical displays give future technology a legible local accent.
    if(variant%3===0){const p=world(-width/2+1.2,9.9,.5);sign(...p,1.20,5.5,'NEXUS','LINK / 24H','#ef69b4',rot,true);}
    if(variant%4===1){const p=world(width/2-.9,7.8,.43);sign(...p,.9,4.1,'SYNC','NY / 6G','#5bdce4',rot,true);}
  }

  function waterTower(x,y,z,r=1.5){
    waterTanks++;
    for(const dx of [-1,1])for(const dz of [-1,1]){
      box('metal',x+dx*r*.7,y+1.0,z+dz*r*.7,.18,2,.18,0xa2aaa1);
      beam('metal',[x+dx*r*.7,y+.2,z+dz*r*.7],[x-dx*r*.7,y+1.7,z+dz*r*.7],.07,.07,0xa5afa4);
    }
    box('metal',x,y+1.95,z,r*2.1,.16,r*2.1);
    const cell=.24;
    for(let u=-r;u<=r;u+=cell)for(let v=-r;v<=r;v+=cell){
      const rr=Math.hypot(u+cell/2,v+cell/2);
      if(rr<r&&rr>r-.44)box('wood',x+u,y+3.25,z+v,cell*.97,2.5,cell*.97,tint(.2));
      if(rr<r)for(const yy of [2.34,3.15,4.08])if(rr>r-.28)box('metal',x+u,y+yy,z+v,cell+.025,.10,cell+.025,0x84918a);
    }
    for(let step=0;step<6;step++){
      const radius=r*(1-step*.15);
      for(let u=-radius;u<radius;u+=.3)for(let v=-radius;v<radius;v+=.3)if(Math.hypot(u+.15,v+.15)<radius)box('metal',x+u,y+4.54+step*.14,z+v,.31,.16,.31,0x5a686a);
    }
    box('metal',x,y+5.35,z,.18,.65,.18,0x71817d);
  }

  // Continuous fronts make a New York street wall, rather than a tower park.
  const names=['HUDSON DELI','MONROE RECORDS','ORBIT REPAIR','NORTHLINE','LUMEN CLINIC','EASTSIDE COFFEE'];
  let index=0;
  for(const x of [-37,-27,-17,17,27,37]){
    building(x,-10.65,9.5,14,5+(index%3),0,index,names[index]);index++;
  }
  for(const x of [-36,-26,-16,16,26]){
    building(x,10.65,9.35,12,5+(index%3),Math.PI,index,names[index%names.length]);index++;
  }
  for(const z of [32,44,-39,-50]){
    building(-10.65,z,10.3,15,5+(index%3),Math.PI/2,index,names[index%names.length]);index++;
    if(z<0||z>36){building(10.65,z,10.3,15,5+(index%3),-Math.PI/2,index,names[index%names.length]);index++;}
  }
  // A lower corner building lets afternoon light and the park breathe in the SE.
  building(10.65,29.8,7.4,12.4,3,-Math.PI/2,21,'PARKSIDE / 24');

  function lamp(x,z,side=1,green=false){
    box(green?'green':'metal',x,.55,z,.43,.38,.43,0xc4c7b6);
    box(green?'green':'metal',x,2.55,z,.13,3.7,.13,0x859088);
    for(let i=0;i<3;i++)box(green?'green':'metal',x,4.35+i*.1,z,.22-i*.035,.12,.22-i*.035,0x9fac9d);
    box('metal',x+side*.38,4.67,z,.86,.1,.13,0x899a93);
    box('metal',x+side*.72,4.52,z,.48,.15,.6,0x879890);
    box('lamp',x+side*.72,4.40,z,.34,.12,.45);
    box('metal',x+side*.72,4.29,z,.42,.06,.52,0x637b71);
  }
  for(const z of [-45,-14,16,43])for(const x of [-9.25,9.25])lamp(x,z,x<0?1:-1);
  for(const x of [-39,-22,21,40])for(const z of [-9.3,9.3])lamp(x,z,z<0?1:-1);

  function tree(x,z,size=1,park=false){
    trees++;return detailedProps.tree(x,z,size,park);
  }
  // Street trees are sparse at intersections and denser near the greenway.
  for(const z of [-43,-18,18,39])for(const x of [-8.2,8.2])tree(x,z,.82);
  for(const x of [-39,-23,22,39])tree(x,-8.2,.78);

  function bench(x,z,rot=0){
    box('metal',x,.66,z,1.8,.1,.55,0x95a395,rot);
    const c=Math.cos(rot),s=Math.sin(rot);
    for(const u of [-.62,.62])box('metal',x+u*c,.55,z-u*s,.12,.55,.48,0x839281,rot);
    for(let i=0;i<4;i++)box('wood',x,.79,z-.23+i*.145,1.94,.11,.12,0xc2b096,rot);
    for(let i=0;i<3;i++)box('wood',x,1.0+i*.16,z-.35,1.94,.12,.11,0xbba790,rot);
  }
  function planter(x,z,w=2.4,d=.8){
    box('stone',x,.61,z,w,.52,d,0xb7b6a1);box('grass',x,.89,z,w-.2,.08,d-.2);
    for(let i=0;i<Math.floor(w*8);i++){
      const xx=x+(rand()-.5)*(w-.2),zz=z+(rand()-.5)*(d-.2);
      box('leaf',xx,1.03+rand()*.12,zz,.22,.27,.22,tint(.23));
      if(i%3===0)box('magenta',xx,1.2,zz,.055,.06,.055,0x8d7067);
    }
  }
  // Ground-level park forms a reachable break in the street wall.
  box('grass',38.2,.29,30.5,12.3,.14,39);
  surface(32.05,44.3,11,50);
  box('paver',35.1,.365,30.5,3.0,.035,39);
  box('paver',38,.365,17,12,.035,3.0);
  for(const z of [15,23,32,43])tree(40.7,z,.92+rand()*.17,true);
  for(const z of [21,32,43]){bench(37,z,-Math.PI/2);planter(32.9,z,1.2,2.2);lamp(33,z+3,1,true);}
  for(let z=11.3;z<50;z+=.5)box('trim',44.1,.49,z,.32,.28,.48,0xa0afa0);
  for(let i=0;i<110;i++){
    const x=38.1+rand()*5.3,z=12+rand()*36;
    box('leaf',x,.47+rand()*.12,z,.16,.22,.16,tint(.3));
    if(i%5===0)box('lamp',x,.61,z,.07,.09,.07,0x807b59);
  }

  // Original greenway art; openGreenway adds matching floors and real access.
  const deckZ=-28.6,deckY=6.4;
  for(const x of [-39,-22,-8.8,8.8,24,40]){
    box('stone',x,3.2,deckZ,1.05,6.0,2.4,0xb3b29b);
    box('trim',x,6.05,deckZ,2.0,.35,3.8,0xa7b0a0);
    collider(x,3.2,deckZ,1.05,6.0,2.4);
    for(let y=.7;y<5.7;y+=.45)box('stone',x-.55,y,deckZ,.16,.38,2.46,tint(.08));
  }
  box('metal',0,5.98,deckZ,89,.5,4.2,0x809389);
  box('stone',0,6.24,deckZ,89,.3,4.4,0xb3b8a2);
  box('paver',0,6.45,deckZ,89,.12,3.7);
  for(const zz of [deckZ-2.1,deckZ+2.1]){
    const sections=zz<deckZ?[[-44.5,-42.35],[-39.65,44.5]]:[[-44.5,44.5]];
    for(const[a,b]of sections){
      box('metal',(a+b)/2,7.5,zz,b-a,.075,.075,0x8a9e8e);
      box('metal',(a+b)/2,6.87,zz,b-a,.055,.055,0x8a9e8e);
    }
    for(let x=-44;x<=44;x+=.6){
      if(zz<deckZ&&x>-42.35&&x<-39.65)continue;
      box('metal',x,7.0,zz,.05,1.08,.05,0x8a9e8e);
    }
    for(let x=-41;x<44;x+=8){
      if(zz<deckZ&&x===-41)continue;
      box('stone',x,6.79,zz-.17,3.4,.56,.74,0xa3ae96);
      box('grass',x,7.08,zz-.17,3.22,.06,.55);
      for(let j=0;j<14;j++)box('leaf',x+(rand()-.5)*3.1,7.3+rand()*.15,zz-.17+(rand()-.5)*.48,.29,.34,.29,tint(.24));
      if(zz>deckZ)for(let j=0;j<8;j++)box('leaf',x-1+j*.25,6.7-rand()*.55,zz+.13,.28,.6,.24,tint(.25));
    }
  }

  function subway(x,z,rot=0){
    return detailedProps.subway(x,z,rot);
  }
  subway(-8.6,12.8,Math.PI/2);

  function taxi(x,z,rot=0){
    const c=Math.cos(rot),s=Math.sin(rot),P=(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c];
    const B=(mat,u,y,v,w,h,d,col=0xffffff)=>box(mat,...P(u,y,v),w,h,d,col,rot);
    // Narrow underbody leaves daylight beneath the sill and behind each wheel.
    B('rubber',0,.58,0,1.45,.29,4.14);
    B('taxi',0,.97,0,1.70,.43,4.32);
    for(const end of [-1,1]){
      B('taxi',0,1.13,end*1.63,1.78,.13,.98);
      B('metal',0,.76,end*2.19,1.80,.12,.12,0xc7c7ac);
      for(const side of [-1,1]){
        B(end>0?'lamp':'tailLight',side*.69,1.01,end*2.171,.31,.16,.045);
        const axle=end*1.36;
        // Contour strips trace the tyre and hub in the vertical wheel plane.
        for(let row=-4;row<=4;row++){
          const radius=.41,dy=row*.09;
          const chord=2*Math.sqrt(radius*radius-dy*dy);
          B('rubber',side*.93,.59+dy,axle,.19,.092,chord);
          if(Math.abs(row)<=2)B('metal',side*1.03,.59+dy,axle,.027,.09,2*Math.sqrt(.22*.22-dy*dy),0xb6bec2);
        }
        for(let band=-3;band<=3;band++){
          const v=band*.134;
          const arch=.59+Math.sqrt(.48*.48-v*v);
          B('taxi',side*.91,(1.22+arch)/2,axle+v,.19,1.22-arch,.137);
        }
      }
    }
    B('rubber',0,.99,2.178,.87,.22,.045);
    for(const y of [.93,1,1.07])B('metal',0,y,2.21,.82,.022,.025);
    // Raked glass built as stepped horizontal courses; each course tapers to the roof.
    for(let row=0;row<6;row++){
      const w=1.77-row*.055,length=2.54-row*.16,y=1.24+row*.092;
      B('glass',0,y,-.16,w,.095,length,0xa7c1d3);
      for(const side of [-1,1]){
        for(const v of [-.16-length/2,-.24,-.16+length/2])
          B('taxi',side*(w/2-.025),y,v,.078,.095,.085);
      }
    }
    B('taxi',0,1.80,-.16,1.51,.12,1.76);
    B('rubber',0,1.90,-.12,.75,.09,.39);
    B('lamp',0,2.01,-.12,.67,.14,.33,0xeac58f);
    for(const side of [-1,1]){
      B('taxi',side*.91,.93,0,.17,.59,1.79);
      B('metal',side*.997,.75,0,.025,.04,1.74);
      B('rubber',side*.997,.98,-.24,.025,.41,.021);
      for(const v of [-.72,.24])B('metal',side*1.01,1.105,v,.032,.048,.20);
      B('taxi',side*1.005,1.37,.79,.18,.12,.22);
      for(let i=0;i<8;i++)B(i%2?'white':'rubber',side*1.004,1.18,-.82+i*.13,.018,.066,.13);
    }
    const wide=Math.abs(c)*2.2+Math.abs(s)*4.7,deep=Math.abs(s)*2.2+Math.abs(c)*4.7;collider(x,1.1,z,wide,1.6,deep);
  }
  taxi(4.6,17,Math.PI);taxi(-4.6,-19);taxi(27,-4.7,Math.PI/2);
  function equipment(x,z,rot=0){
    box('metal',x,1.28,z,.9,1.84,.65,0x758d85,rot);box('glass',x,1.5,z+.34,.65,1.13,.035,0xa3c0b5,rot);
    box('cyan',x,1.7,z+.38,.4,.07,.025);box('cyan',x,1.4,z+.38,.4,.07,.025);
    box('rubber',x,.68,z+.36,.45,.23,.04);box('metal',x,.52,z+.42,.65,.12,.2,0xb0b9a7,rot);
  }
  equipment(11.1,-6.7);equipment(-12.4,7.2,Math.PI);
  for(const [x,z]of [[-10,23],[10,-19],[-29,-9],[31,9]]){
    box('metal',x,1.1,z,.72,1.4,.72,0x607e70);box('metal',x,1.82,z,.78,.12,.78,0x87a08b);
    for(let i=0;i<7;i++)box('rubber',x-.25+i*.085,1.12,z+.37,.035,.9,.025);
  }
  // Large but selective cyan / magenta advertisements anchor the main crossing.
  sign(12.1,6.6,-10.15,2.1,5.3,'SYNC','CITY / CONNECTED','#5ce5e8',0,true);
  sign(-12.1,7.9,10.17,1.9,5.2,'AFTER','MEMORY / 24H','#ed70b8',Math.PI,true);
  // Warm local lamps do not cast dynamic shadows; the main sun handles shadows.
  for(const [x,y,z,color,power]of [[10,4,-7,0x46dae0,15],[-10,4,7,0xec5ca6,13],[35,3,23,0xffc28c,8],[-8,3,-21,0xffc08e,8]]){
    const l=new T.PointLight(color,power,9,2);l.position.set(x,y,z);l.userData.nightPower=power;localLights.push(l);scene.add(l);
  }

  function distantTower(x,z,w,d,height,variant=0){
    const base=0;box('stone',x,base+5,z,w+5,10,d+5,0xa1acaa);
    if(variant===0){
      // The low Art Deco podium has actual dark bays, pilasters and setbacks;
      // it must never read as a featureless slab across the avenue.
      for(let u=-w/2-1;u<w/2+1;u+=1.55){
        box('trim',x+u,5.4,z+d/2+2.64,.35,9.3,.52,0x9ba9a3);
        for(let y=2.4;y<10;y+=2.65){
          box('metal',x+u+.62,y,z+d/2+2.54,.91,2.32,.12,0x586d72);
          box(windowMaterial(),x+u+.62,y,z+d/2+2.62,.72,2.12,.035,0x8eaaae);
        }
      }
      for(const edge of [-1,1])for(let u=-d/2;u<d/2;u+=2){
        box('trim',x+edge*(w/2+2.62),5.4,z+u,.48,9.3,.35,0x9ba9a3);
        for(let y=2.4;y<10;y+=2.65)box('glass',x+edge*(w/2+2.54),y,z+u+.8,.08,2.1,1.0,0x91a7a6);
      }
      let yy=10;
      for(const [scale,h]of [[1,.38],[.83,.22],[.66,.17],[.5,.11],[.34,.07],[.17,.05]]){
        const hh=height*h;box('stone',x,yy+hh/2,z,w*scale,hh,d*scale,0xa6b5b7);
        for(let u=-w*scale/2+.65;u<w*scale/2;u+=1.38){
          box('trim',x+u,yy+hh/2,z+d*scale/2+.19,.26,hh,.42,0x92a6a9);
          for(let floor=0;floor<hh/3;floor++){
            box('metal',x+u+.59,yy+1.4+floor*3,z+d*scale/2+.07,.94,2.34,.08,0x536c75);
            box(windowMaterial(),x+u+.59,yy+1.4+floor*3,z+d*scale/2+.126,.72,2.1,.025,0x91adb0);
          }
        }
        // Side fenestration prevents the skyline from flattening when orbited.
        for(const edge of [-1,1])for(let u=-d*scale/2+.8;u<d*scale/2;u+=1.65){
          box('trim',x+edge*(w*scale/2+.18),yy+hh/2,z+u,.4,hh,.24,0x91a5a8);
          for(let floor=0;floor<hh/3;floor++)box(windowMaterial(),x+edge*(w*scale/2+.07),yy+1.4+floor*3,z+u+.64,.035,2.1,.78,0x90a5a7);
        }
        box('trim',x,yy+hh,z,w*scale+.65,.32,d*scale+.65,0xb1bdaa);yy+=hh;
      }
      box('stone',x,yy+4,z,2,8,2,0x9fadb1);box('lamp',x,yy+9.3,z,.32,4.6,.32,0xc9b373);
    }else{
      box('glass',x,height/2+10,z,w,height,d,0x8aadb4);
      for(let u=-w/2;u<=w/2;u+=1.7)box('metal',x+u,height/2+10,z+d/2+.08,.13,height,.15,0xb8c4ba);
      for(let y=13;y<height+10;y+=3.6)box('metal',x,y,z+d/2+.12,w,.11,.18,0x9bb5b5);
      for(let row=0;row<height/4;row++)for(let col=0;col<w/2;col++)if(rand()>.73)box(windowMaterial(),x-w/2+1+col*2,13+row*4,z+d/2+.2,.78,1.5,.03,0x98aeb0);
      for(let i=0;i<3;i++)box('metal',x,height+10+i*.4,z,w-i*.7,.4,d-i*.7,0xa0b5b8);
      box('cyan',x+w*.38,height*.69,z+d/2+.3,.18,height*.24,.1,0x679b9a);
    }
  }
  // Midtown now owns the former skyline: every nearby tower has a real podium
  // and collider. River/east background buildings remain outside the district.
  box('stone',-340,-.95,0,180,1.8,1400,0x485968);
  for(const side of [-1])for(let i=0;i<5;i++){
    const x=side<0?-260-i*17:166+i*17,z=18-i*24,h=30+rand()*27+(side<0?[0,13,-5,19,4][i]:0);
    box('brickBrown',x,h/2,z,14,h,20,0x879393);
    for(let y=3;y<h;y+=3.8)for(let u=-5;u<6;u+=2.3)box(windowMaterial(),x+u,y,z+10.05,.95,1.55,.05,0xa4b0aa);
    box('metal',x,h+.2,z,14.3,.35,20.3,0x7f9293);
    if(side<0){
      // River-facing east side: iron sash bays and ribs, rather than a blank box.
      for(let col=0;col<8;col++){
        const zz=z-8.3+col*2.35;
        box('metal',x+7.10,h/2,zz,.20,h-.6,.13,0x80989b);
        for(let row=0;row<Math.floor((h-2)/3.8);row++){
          const yy=2.8+row*3.8,code=(row*13+col*7+i*3)%19;
          box('metal',x+7.075,yy,zz+.65,.09,2.18,1.36,0x59737b);
          box(code<2?'warmWindow':code===4?'coolWindow':'glass',x+7.135,yy,zz+.65,.035,1.95,1.15,0x98abb0);
          box('metal',x+7.17,yy,zz+.65,.04,.06,1.17,0x8c9f9d);
        }
      }
      for(const zz of [z-10,z+10])box('stone',x+7.12,h/2,zz,.32,h,.28,0x91a5a5);
      for(let yy=1.5;yy<h;yy+=3.8)box('metal',x+7.16,yy,z,.14,.13,20.1,0x819b9d);
      // Keep the opposite face populated when the skyline is seen obliquely.
      for(let row=0;row<Math.floor((h-2)/3.8);row++)for(let col=0;col<5;col++){
        const yy=2.8+row*3.8,code=(row*11+col*7+i)%17;
        box(code===0?'warmWindow':'glass',x-4.8+col*2.35,yy,z-10.055,1.05,1.8,.04,0x91a5aa);
      }
      // A few setbacks and rooftop machines create five distinct silhouettes.
      for(let step=0;step<3;step++){
        const scale=[.84,.62,.38][step],yy=h+.5+step*2.05;
        box('brickBrown',x,yy+.92,z,14*scale,1.85,20*scale,0x859a9b);
        box('metal',x,yy+1.9,z,14*scale+.35,.18,20*scale+.35,0x95aaa7);
      }
      box('metal',x-1.8,h+7.7,z-1.6,1.35,2.1,1.4,0x8b9f9a);
      box('metal',x-1.8,h+8.85,z-1.6,1.7,.16,1.7,0xa2b2a7);
      box('metal',x+1.6,h+9.2,z+1.5,.10,4.6,.10,0x93aaa7);
      if(i%2===0)box('cyan',x+5.99,h+1.24,z+1.2,.06,.13,3.6,0x789d99);
    }
  }

  // Small warm stair lights and park rail endpoints reward exploring the edges.
  for(const z of [13,22,31,43])for(const x of [33.4,43.3]){
    box('metal',x,.75,z,.16,.78,.16,0x849c87);box('lamp',x,1.14,z,.21,.20,.21);
  }
  const cyber=addCyberLayer(scene,{box,beam,materials,colliders,sign,rand});
  const waterfront=addWaterfront(scene,{box,beam,panel:batch.panel,materials,colliders,surface,sign,tree,lamp,bench,planter,rand});
  const greenway=openGreenway(scene,{box,beam,materials,colliders,surface,sign,tree,bench,planter,rand});
  const midtown=addMidtown(scene,{box,beam,materials,colliders,surface,sign,tree,lamp,bench,planter,rand});
  const midtownCyber=addMidtownCyber(scene,{box,beam,materials,colliders,sign,rand});
  const streetLife=addStreetLife(scene,{box,beam,materials,colliders,surface,sign,rand});
  const cityDetail=addCityDetail(scene,{box,beam,materials,colliders,sign,rand});
  const sampleFrontages=addSampleFrontages(scene,{box,beam,weatherOccluders:batch.roofOccluders,castColumn:batch.castColumn,materials,colliders,surface,sign,rand:randomSource(882041)});
  const sampleStreet=addSampleStreet(scene,{box,beam,materials,colliders,surface,sign,rand:randomSource(882042)});
  // The service court terminates against an actual masonry return, behind its
  // closed door, rather than exposing an unbuilt gap between the two buildings.
  box('brickBrown',20.0,2.22,24.375,.40,3.72,3.45,0xa2a99b);
  box('trim',20.0,4.18,24.375,.52,.22,3.58,0xa5b0a0);
  collider(20.0,2.22,24.375,.40,3.72,3.45);
  const sample={bounds:{minX:-20,maxX:20,minZ:2,maxZ:42},area:1600,frontages:sampleFrontages,street:sampleStreet,entries:sampleFrontages.entries};
  const roadRegistry=[];
  const districtApi={box,beam,castColumn:batch.castColumn,materials,colliders,surface,sign,tree,lamp,bench,planter,roadRegistry};
  const soho=addSoHo(scene,{...districtApi,rand:randomSource(611203)});
  const eastPark=addEastPark(scene,{...districtApi,rand:randomSource(611204)});
  // Distant built frontage closes long street axes and views across the park.
  // Rooftop shapes stay well outside navigation and preserve the Hudson channel.
  const skylineRand=randomSource(80711);
  function outerBlock(x,z){
    const w=11+skylineRand()*12,d=12+skylineRand()*10,h=16+skylineRand()*34;
    const skin=materials.midtownCurtain;
    const tint=new T.Color().setHSL(.54+skylineRand()*.05,.10,.53+skylineRand()*.21);
    box(skin,x,h/2-.2,z,w,h,d,tint);
    box('metal',x,h,z,w+.4,.45,d+.4,0x889b9e);
    const upper=5+skylineRand()*9;
    box(skin,x+1,h+upper/2,z,w*.67,upper,d*.72,tint);
    box('roof',x+1,h+upper,z,w*.68,.46,d*.73);
    if(skylineRand()>.62){
      box('metal',x+1,h+upper+2.8,z,.33,5.6,.33);
      box('lamp',x+1,h+upper+5.7,z,.45,.42,.45);
    }
  }
  for(const z of [-215,209])for(let x=-134;x<190;x+=29)outerBlock(x,z+skylineRand()*12);
  for(let z=-177;z<=177;z+=32)outerBlock(202+skylineRand()*18,z);
  // The south-facing park edge overlooks a raised railway cutting and the
  // backs of occupied workshops. All of this lies outside the walkable outline.
  for(const x of [90,105,120,135,150]){
    box('brickBrown',x,2.4,108,4.5,5.1,6);
    box('stone',x,5.15,108,5.3,.6,6.6);
    box('metal',x,5.83,108,15.05,.78,6.2);
    for(const z of [105.2,110.8]){
      box('metal',x,6.96,z,15,.12,.13);
      for(let i=-6;i<=6;i+=3)box('metal',x+i,6.6,z,.09,.83,.11);
    }
    for(const z of [107.1,108.9])box('metal',x,6.30,z,15,.15,.14);
  }
  for(const [x,z,w,h,d] of [[94,119,14,11,9],[111,123,17,15,12],[130,119,19,9,8],[147,126,14,18,15]]){
    box('brickBrown',x,h/2,z,w,h,d);
    box('stone',x,h+.18,z,w+.5,.36,d+.5);
    for(let y=2.4;y<h-1;y+=3.1)for(let dx=-w/2+1.5;dx<w/2-1;dx+=2.55){
      box('metal',x+dx,y,z-d/2-.04,1.72,2.18,.16);
      box((Math.round(dx+y)%3===0)?'warmWindow':'glass',x+dx,y,z-d/2-.15,1.48,1.92,.06);
    }
    box('metal',x+w*.22,h+.74,z,2.8,1.2,1.3);
  }
  sign(111,8.6,116.68,8.5,1.62,'EAST LINE','POWER / SWITCHING YARD','#83dad2',Math.PI);
  const districtRoadStats=flushDistrictRoads(roadRegistry);
  const occupation=addCityOccupation(scene,{box,beam,panel:batch.panel,materials,colliders,walkSurfaces,sign,sample,soho,eastPark});
  const frontiers=addDistrictFrontiers(scene,{box,beam,materials,colliders,sign});
  const extraVents=[...streetLife.steamSources.map(s=>[s.position.x,s.position.z,s.kind==='food-cart'?'#d7c0a0':'#99b7b3',s.position.y]),...(soho.detail?.steamSources||[])];
  const atmosphere=createAtmosphere(scene,{renderer,bounds,extraVents});
  const stats=batch.finish();
  const crowd=createCityCrowd(scene,{materials,bounds,isPlayable,colliders,ground,extraCrowdPaths:[...(soho.crowdPaths||[]),...(eastPark.crowdPaths||[]),...occupation.crowdPaths]});
  stats.buildings=buildings+waterfront.stats.warehouses+midtown.stats.towers+midtown.stats.podiums+(soho.stats.buildings||0)+(eastPark.stats.buildings||0);stats.trees=trees+(eastPark.stats.authoredTrees||0);stats.fireEscapes=fireEscapes;stats.waterTanks=waterTanks;
  stats.signs=signMeshes.length;stats.drawCalls+=signMeshes.length;stats.colliders=colliders.length;
  stats.textureSource='Original local generated albedo and display textures with procedural trim';
  stats.props=detailedProps.stats;stats.cyber=cyber.stats;stats.atmosphere=atmosphere.stats;
  stats.waterfront=waterfront.stats;stats.greenway=greenway.stats;
  stats.frontiers=frontiers.stats;
  stats.midtown=midtown.stats;stats.midtownCyber=midtownCyber.stats;
  stats.streetLife=streetLife.stats;stats.cityDetail=cityDetail.stats;stats.crowd=crowd.stats;
  stats.sample={bounds:sample.bounds,area:sample.area,frontages:sampleFrontages.stats,street:sampleStreet.stats};
  stats.soho=soho.stats;stats.eastPark=eastPark.stats;stats.districtRoads=districtRoadStats;stats.playableArea=mapPlan.currentArea;
  stats.occupation=occupation.stats;
  stats.drawCalls+=cyber.stats.independentDrawCalls+atmosphere.stats.drawCalls+waterfront.stats.independentDrawCalls+midtownCyber.stats.independentDrawCalls+crowd.stats.drawCalls+(soho.stats.independentDrawCalls||0)+(eastPark.stats.independentDrawCalls||0);
  const landmarks=[
    {id:'subway',title:'地铁街角',position:new T.Vector3(-5.8,ROAD,12.8)},
    {id:'neon',title:'霓虹街区',position:new T.Vector3(6.0,ROAD,-5.7)},
    {id:'greenway',title:'街心花园',position:new T.Vector3(35.1,SIDE,23.0)},
    ...waterfront.landmarks,...greenway.landmarks,...midtown.landmarks,
    {id:'midtown_data_commons',title:'数据中庭',position:new T.Vector3(8,SIDE,-129.7)},
    ...soho.landmarks,...eastPark.landmarks,
  ];
  // Highest applicable ground patch; geometry and .18m curb steps agree.
  function ground(x,z,limit=Infinity){
    let y=ROAD;
    for(const p of walkSurfaces)if(p.y<=limit+.001&&x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ)y=Math.max(y,p.y);
    return y;
  }
  scene.userData.nyc={stats,landmarks,bounds};
  return {colliders,walkSurfaces,spawn:new T.Vector3(0,ROAD,22),bounds,landmarks,ground,isPlayable,stats,
    materials,signMeshes,greenway,midtown,crowd,sample,soho,eastPark,occupation,weatherOccluders:batch.roofOccluders,mapOutline:mapPlan.currentOutline,
    mapFeatures:[...mapPlan.features,...(eastPark.mapFeatures||[]),
      {id:'soho-market-court',name:'街坊市集',fill:'#7e8772',shape:{type:'polygon',points:[[-40.8,56],[-26,56],[-26,76.2],[-40.8,76.2]]}},
      {id:'soho-canal-court',name:'运河街庭院',fill:'#788278',shape:{type:'polygon',points:[[24,135.9],[48.5,135.9],[48.5,142.8],[24,142.8]]}}],
    setQuality(level){batch.setQuality(level);crowd.setQuality(level);sampleFrontages.setQuality?.(level);sampleStreet.setQuality?.(level);soho.setQuality?.(level);eastPark.setQuality?.(level);},
    setNight(night){
      cyber.setNight(night);atmosphere.setNight(night);waterfront.setNight?.(night);midtown.setNight(night);midtownCyber.setNight(night);
      streetLife.setNight(night);crowd.setNight(night);
      sampleFrontages.setNight(night);sampleStreet.setNight?.(night);
      soho.setNight(night);eastPark.setNight(night);
      occupation.setNight(night);
      for(const l of localLights)l.intensity=l.userData.nightPower*(night?1:.2);
      materials.warmWindow.emissiveIntensity=night?1.05:.72;materials.coolWindow.emissiveIntensity=night?.64:.35;
      materials.cyan.emissiveIntensity=night?2.65:1.5;materials.magenta.emissiveIntensity=night?2.2:1.3;materials.lamp.emissiveIntensity=night?1.25:.8;
    },
    update(dt,time,camera){batch.updateVisibility(camera?.position);for(const f of moving)f(dt,time);cyber.update(dt,time);waterfront.update?.(dt,time);midtown.update?.(dt,time,camera);midtownCyber.update(dt,time);crowd.update(dt,time);streetLife.update?.(dt,time);soho.update?.(dt,time,camera);eastPark.update?.(dt,time,camera);atmosphere.update(dt,time,camera);}};
}
