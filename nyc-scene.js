import {keyedCasting,voxelCrown} from './nyc-field-voxels.js';
import {buildSkylineProperty} from './nyc-skyline-buildings.js';
import {buildGreenwayBlocks} from './nyc-greenway-blocks.js';
import * as T from 'three';
import {finishVoxelBays} from './nyc-fulton-modules.js';
import {buildRadioStation} from './nyc-radio-station.js';
import {routeWindow,createRouteWindows} from './nyc-route-windows.js';
import {buildHabitatStack,buildExchangeApron} from './nyc-habitat-stacks.js';
import {housingBond} from './nyc-housing-bond.js';
import {applyCitySurfaces,shopInterior} from './nyc-city-surfaces.js';
import {createNYCMaterials,createSignTexture} from './nyc-materials.js';
import {createArchitectureBatch,randomSource} from './nyc-geometry.js';
import {createDetailedStreetProps} from './nyc-street-props-v2.js';
import {addCyberLayer} from './nyc-cyber-layer.js';
import {buildCivicLink} from './nyc-civic-link.js';
import {buildStreetConnections,buildSignalRoof} from './nyc-street-connections.js';
import {createNightShifts} from './nyc-night-shifts.js';
import {connectStreetPower} from './nyc-street-power.js';
import {buildRegionalGrid} from './nyc-regional-grid.js';
import {buildOldNightPost} from './nyc-suspended-delivery.js';
import {createNightTraffic} from './nyc-night-traffic.js';
import {addFutureCore} from './nyc-future-core.js';
import {addStreetAdvertising} from './nyc-street-advertising.js';
import {buildFutureCoreStreets} from './nyc-future-core-streets.js';
import {freightWell} from './nyc-future-core-layout.js';
import {buildTramPower} from './nyc-tram-power.js';
import {buildStreetSections} from './nyc-street-sections.js';
import {createAtmosphere} from './nyc-atmosphere.js';
import {addWaterfront,onDryQuay} from './nyc-waterfront.js';
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
import {buildRepairQuarter,repairPortalWidth} from './nyc-repair-quarter.js';
import {addCityOccupation} from './nyc-city-occupation.js';
import {addSoHo} from './nyc-soho.js';
import {addEastPark} from './nyc-east-park.js';
import {buildSchool} from './nyc-school.js';
import {flushDistrictRoads} from './nyc-district-kit.js';

/**
 * Rain-afterglow Manhattan sample district. All construction is in metres.
 * Road top / spawn feet = .18; sidewalk and park top = .36.
 * Four districts share one street network, world boundary, ground and map.
 * The Hudson greenway, SoHo courts and East Commons remain continuous.
 */
export async function createNYCScene(scene,renderer,rift={value:new T.Vector3()}) {
  const materials=createNYCMaterials(renderer);
  await applyCitySurfaces(materials,renderer);
  createRouteWindows(materials);
  const batch=createArchitectureBatch(scene,materials,64);
  const {box,beam}=batch, rand=randomSource(20261112);
  const colliders=[],walkSurfaces=[],signMeshes=[],moving=[],localLights=[];
  const lampPosts=[];
  let floorCells=null;
  let buildings=0,trees=0,fireEscapes=0,waterTanks=0;
  const ROAD=.18,SIDE=.36;
  const bounds={...mapPlan.currentBounds};
  const inOutline=createPlayableArea(mapPlan.currentOutline);
  const isPlayable=(x,z,r=0)=>inOutline(x,z,r)&&onDryQuay(x,z,r);
  function collider(x,y,z,w,h,d){colliders.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));}
  function surface(minX,maxX,minZ,maxZ,y=SIDE){walkSurfaces.push({minX,maxX,minZ,maxZ,y});}
  function tint(spread=.08){const v=1-spread/2+rand()*spread;return new T.Color(v,v,v);}
  function windowMaterial(){const r=rand();return r<.32?'warmWindow':r<.42?'coolWindow':'glass';}
  const detailedProps=createDetailedStreetProps({box,beam,panel:batch.panel,materials,colliders,sign,surface,rand});

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
  const channel=freightWell;
  for(const [left,right,near,far] of [
    [-138,300,-700,channel.minZ],[-138,300,channel.maxZ,700],
    [-138,channel.minX,channel.minZ,channel.maxZ],[channel.maxX,300,channel.minZ,channel.maxZ]
  ])box('asphalt',(left+right)/2,-.55,(near+far)/2,right-left,1,far-near,0x819291);
  // SoHo and East Park now own the ground beyond the original construction
  // frontier. Their asphalt meets this slab edge to edge at z=52 and x=44.
  groundAround('asphalt',-44,44,-52,52,.01,.34);
  surface(-44,44,-52,52,ROAD);
  // Stop footways at the crossings. Their kerb returns meet on each corner,
  // while feet, tyres and headlights cross at the same level as the road.
  for(const x of [-8.55,8.55]){
    for(const [a,b] of [[-52,-6.5],[6.5,52]]){
      if(x<0&&a<well.minZ&&b>well.maxZ)groundAround('paver',x-2.05,x+2.05,a,b,.27,.18);
      else groundRect('paver',x-2.05,x+2.05,a,b,.27,.18);
      surface(x-2.05,x+2.05,a,b);
    }
  }
  for(const z of [-8.55,8.55]){
    for(const [a,b] of [[-44,-10.6],[10.6,44]]){
      groundRect('paver',a,b,z-2.05,z+2.05,.27,.18);
      surface(a,b,z-2.05,z+2.05);
    }
  }
  // Individual curb stones articulate the real quarter-metre stepped edge.
  for(let z=-51.75;z<52;z+=.5)for(const x of [-6.58,6.58]){
    if(Math.abs(z)<6.9)continue;
    box('curbStone',x,.285,z,.28,.21,.48,tint(.12));
  }
  for(let x=-43.75;x<44;x+=.5)for(const z of [-6.58,6.58]){
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
    const material=new T.MeshStandardMaterial({map:createSignTexture(title,subtitle,color,vertical,w/h),emissiveMap:null,emissive:0xffffff,emissiveIntensity:1.05,roughness:.52});
    material.emissiveMap=material.map;
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);
    mesh.position.set(x+Math.sin(rot)*.112,y,z+Math.cos(rot)*.112);mesh.rotation.y=rot;
    mesh.name='NYC authored sign / '+title;scene.add(mesh);signMeshes.push(mesh);return mesh;
  }

  function building(x,z,width,depth,floors,rot=0,variant=0,store='') {
    buildings++;
    const floor=3.2,height=3.75+floors*floor,cut=4.10,base=.36;
    const brick=variant%4===0?'titaniumSkin':'basaltShell';
    const refit=SAMPLE_FRONTAGES.find(f=>Math.abs(f.x-x)<.01&&Math.abs(f.z-z)<.01&&Math.abs(f.rot-rot)<.01);
    const passage=repairPortalWidth(x,z);
    const c=Math.cos(rot),s=Math.sin(rot);
    const world=(u,v,out)=>[x+u*c+out*s,v,z-u*s+out*c];
    const B=(mat,u,v,out,w,h,d,col=0xffffff)=>{
      if(passage&&out>-.5&&v<3.96){
        // Cut the same opening through every old layer, including the
        // shutter, glazing, sill and stone band on the inherited frontage.
        // One former shop bay opens into the gallery; the outside party pier
        // remains. The opposite wing still carries its original shop front.
        for(const [a,b] of [[u-w/2,Math.min(u+w/2,-width/2+.48)],[Math.max(u-w/2,passage/2),u+w/2]]){
          if(b>a+.006)box(mat,...world((a+b)/2,v,out),b-a,h,d,col,rot);
        }
      }else box(mat,...world(u,v,out),w,h,d,col,rot);
    };
    const bond=housingBond(materials,B,batch.panel,world);
    const line=(mat,a,b,size=.07,col=0xffffff)=>beam(mat,world(...a),world(...b),size,size,col);
    function solid(u,y,out,w,h,d){const p=world(u,y,out);collider(...p,Math.abs(c)*w+Math.abs(s)*d,h,Math.abs(s)*w+Math.abs(c)*d);}
    const walkIn=!refit&&!passage&&variant%3!==1;
    const setback=walkIn?(variant%3===0?2.56:1.60):0;
    const solidBlock=(u,y,v,w,h,d)=>{
      B(brick,u,y,v,w,h,d);solid(u,y,v,w,h,d);
    };
    const shopDepth=refit?refit.recessDepth:setback;
    const lower=cut-base;
    if(passage){
      const wing=(width-passage)/2;
      for(const side of [-1,1]){
        const u=side*(passage+wing)/2;
        const booth=side===-1?4.48:0;
        solidBlock(u,(base+cut)/2,-(depth+booth)/2,wing,lower,depth-booth);
        if(booth)solidBlock(-width/2+.24,(base+cut)/2,-booth/2,.48,lower,booth);
      }
    }else{
      solidBlock(0,(base+cut)/2,-(depth+shopDepth)/2,width,lower,depth-shopDepth);
      if(shopDepth)for(const side of [-1,1])
        solidBlock(side*(width/2-.13),(base+cut)/2,-shopDepth/2,.26,lower,shopDepth);
    }
    if(walkIn){
      buildExchangeApron(B,solid,width,setback,bond);
      B('titaniumSkin',0,.29,-setback/2,width,.14,setback);
      const p=world(0,base,-setback/2),w=Math.abs(c)*width+Math.abs(s)*setback,d=Math.abs(c)*setback+Math.abs(s)*width;
      surface(p[0]-w/2,p[0]+w/2,p[2]-d/2,p[2]+d/2,base);
    }
    if(!refit){
      B('basaltShell',0,1.95,-setback-.02,width+.08,3.2,.22);
      B('titaniumSkin',0,.68,-setback+.08,width+.2,.45,.25);
    }
    const profile=z>=28&&z<=45?(x>0?'workroom':'home'):['home','tailor','workroom','pantry'][variant%4];
    buildHabitatStack({box:B,bond,solid,streetSite:[x,z],width,depth,bottom:cut,top:height+.36,pitch:floor,seed:variant,
      glass:(level,bay)=>routeWindow(profile,level,bay,4)});
    if(z===-39||z===44)buildSignalRoof(B,line,width,depth,height,variant);
    const cols=Math.max(2,Math.floor(width/2.1)),gap=width/cols;
    const shop=(m,u,y,v,w,h,d,col)=>B(m,u,y,v-setback,w,h,d,col);
    // Ground floor storefronts and recessed doorways sized to an adult character.
    if(!refit)for(let i=0;i<cols;i++){
      const u=-width/2+gap*(i+.5),w=gap-.34;
      shop('metal',u,1.8,.15,w,2.45,.2,0x3e514f);
      const glazing=i===Math.floor(cols/2)?shopInterior(store,variant):windowMaterial();
      shop(glazing,u,1.8,.265,w-.16,2.24,.035,0xffffff);
      shop('metal',u,1.8,.30,.075,2.25,.035,0x7e928f);
      shop('metal',u,2.22,.30,w-.18,.08,.04,0x7e928f);
      shop('titaniumSkin',u,.55,.38,w+.1,.18,.65);
      // Layered shop jambs and transom caps provide a real shadow reveal.
      for(const e of [-1,1]){
        shop('ceramicShell',u+e*(w/2+.05),1.86,.31,.20,2.75,.43,0xaaa697);
        shop('titaniumSkin',u+e*(w/2+.05),.64,.4,.28,.28,.53,0xb3af9b);
        shop('titaniumSkin',u+e*(w/2+.05),3.05,.38,.30,.19,.48,0xb4ae9b);
      }
      shop('metal',u,2.89,.39,w-.12,.13,.13,0x8e9d92);
      // Selected closed shutters break up the ribbon of identical shop windows.
      if((i+variant)%5===1){
        shop('metal',u,1.68,.33,w-.22,1.98,.08,0x7d8b7c);
        for(let sl=0;sl<15;sl++)shop('rubber',u,.77+sl*.13,.382,w-.22,.023,.025,0x6a7469);
      }
      shop('metal',u,3.34,.47,w+.12,.20,1.0,variant%2?0x426d64:0x8c5d47);
      for(let k=0;k<Math.ceil(w/.3);k++)shop('metal',u-w/2+k*.3,3.23,.91,.15,.16,.16,variant%2?0x375c55:0x73533f);
    }
    if(!refit)shop('basaltShell',0,.44,.18,width+.08,.16,.25);
    if(variant%5===1){
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
    if(variant===3||variant===13)waterTower(...world(-width*.22,height+.64,-depth*.60),1.35);
    if(store&&!refit&&!passage){const p=world(0,3.04,.54-setback);sign(...p,Math.min(width-1.2,7.1),.63,store,'NEIGHBORHOOD / EST. 2086',variant%2?'#f2bc81':'#62d9df',rot);}
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
    if(z<0){building(10.65,z,10.3,15,5+(index%3),-Math.PI/2,index,names[index%names.length]);index++;}
    if(z===44){buildings++;index++;}
  }
  // A lower corner building lets afternoon light and the park breathe in the SE.
  building(10.65,29.8,7.4,12.4,3,-Math.PI/2,21,'PARKSIDE / 24');
  const radio=buildRadioStation(scene,collider);
  await radio.ready();
  for(const [x,y,z,power,color] of [[10.96,2.72,42.1,30,0xffbe80],[11.15,4.35,46.9,17,0x70c6cc]]){
    const light=new T.PointLight(color,power,7,2);
    light.position.set(x,y,z);light.userData.nightPower=power;scene.add(light);localLights.push(light);
  }

  function lamp(x,z,side=1,green=false){
    lampPosts.push({x:x+side*.72,y:4.4,z,glow:green?0xd1ceaa:0xffc08d,reach:14,gain:.95});
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
    const c=Math.cos(rot),s=Math.sin(rot);
    const seat=(mat,u,v,y,w,h,d,t)=>box(mat,x+u*c+v*s,y,z-u*s+v*c,w,h,d,t,rot);
    for(const side of [-1,1]){
      seat('metal',side*.64,0,.47,.32,.24,.64,0x718784);
      seat('metal',side*.64,-.08,.65,.16,.16,.48,0x83989b);
      seat('metal',side*.64,-.24,.84,.16,.54,.16,0x96a69c);
    }
    for(let row=0;row<3;row++)for(let plank=0;plank<3;plank++){
      const tone=[0xc2ad8c,0xd2b794,0xbca88b][(row+plank)%3];
      seat('wood',(plank-1)*.64,(row-1)*.16,.77,.637,.16,.157,tone);
      if(row<2)seat('wood',(plank-1)*.64,-.32,.98+row*.16,.637,.157,.16,tone);
    }
  }
  function planter(x,z,w=2.4,d=.8){
    keyedCasting({box,panel:batch.panel},'stone',x,.60,z,w,.48,d,0xbfc2ac,2);
    box('grass',x,.855,z,w-.32,.07,d-.32);
    const count=Math.max(2,Math.round(Math.max(w,d)/.52)),alongX=w>d;
    const lobes=Array.from({length:count},(_,i)=>{
      const along=((i+.5)/count-.5)*(Math.max(w,d)-.32),across=(i%2-.5)*.16;
      return [alongX?along:across,(i%3)*.065,alongX?across:along,alongX?.53:.31,.32,alongX?.31:.53];
    });
    voxelCrown({box,panel:batch.panel},'leaf',[x,1.05,z],lobes,Math.round(x-z),
      [0x73998c,0x93af8c,0xa7bc8d,0xc2cd97,0xd6d69d]);
  }
  // Ground-level park forms a reachable break in the street wall.
  box('grass',38.2,.29,30.5,12.3,.14,39);
  surface(32.05,44.3,11,50);
  box('paver',35.1,.365,30.5,3.0,.035,39);
  groundRect('paver',32,33.6,15.5,18.5,.365,.035);
  groundRect('paver',36.6,44,15.5,18.5,.365,.035);
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

  buildCivicLink({box,beam,collider});

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
  // The Hudson's far shore remains a lower, staggered silhouette behind the crane.
  box('stone',-340,-.95,0,180,1.8,1400,0x485968);
  box('stone',-253,-.57,-1,6,1.14,148,0x85949a);
  box('paver',-254.4,.11,-1,5.1,.22,148,0x939d97);
  for(let z=-67;z<=65;z+=11){
    box('trim',-250.10,-.10,z,.32,1.05,.39,0x8f9a95);
    box('metal',-252.75,.31,z,.13,.62,.13,0xa5aba0);
    box('lamp',-252.75,.66,z,.19,.11,.19,0xb7aaa0);
  }
  const oppositeShore=[
    [-261,29,13,19,20,0],[-276,2,15,22,29,1],[-267,-29,12,20,23,2],
    [-292,-58,17,23,41,1],[-304,38,18,23,42,2],[-319,-11,18,21,54,0],
    [-328,64,22,24,34,1]
  ];
  for(const [x,z,w,d,h,style] of oppositeShore){
    buildSkylineProperty(box,x,z,w,d,h,style,true);
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
  const repairQuarter=buildRepairQuarter(scene,{box,beam,materials,surface,collider,sign,localLights});
  const sample={bounds:{minX:-20,maxX:20,minZ:2,maxZ:42},area:1600,frontages:sampleFrontages,street:sampleStreet,entries:sampleFrontages.entries};
  const roadRegistry=[];
  const districtApi={box,beam,panel:batch.panel,castColumn:batch.castColumn,registerPaving:batch.registerPaving,materials,colliders,collider,surface,sign,tree,lamp,bench,planter,roadRegistry};
  const soho=addSoHo(scene,{...districtApi,rand:randomSource(611203)});
  const eastPark=addEastPark(scene,{...districtApi,rand:randomSource(611204)});
  const schoolLandmark=buildSchool(districtApi,scene,localLights);
  const coreStreets=buildFutureCoreStreets(scene,districtApi);
  const futureCore=addFutureCore(scene,districtApi);
  buildGreenwayBlocks(districtApi);
  for(const light of [...coreStreets.lights,...futureCore.lights]){
    light.userData.nightPower??=light.intensity;localLights.push(light);
  }
  // Bring the neighbouring blocks up to the edge streets. Service courts
  // sit between the two rows; the long axes keep an offset break in the wall.
  const perimeterLots=[
    // Southern fabric market boundary; step down at the two road ends.
    [-83,180,21,22,38,2],[-59,176,24,19,51,1],[-35,183,21,22,33,2],
    [-15,174,18,18,48,1],[13,171,20,18,39,2],[37,180,24,23,58,0],
    [64,174,24,20,47,1],[87,188,19,22,41,2],[-43,207,20,23,71,0],
    [78,210,24,25,80,1],
    // Northern end of the city; the relay occupies the gap at x=31.
    [-91,-431,28,25,60,0],[-62,-422,23,23,71,1],[-31,-426,30,23,83,1],
    [0,-438,22,24,54,2],[64,-426,24,23,93,0],[90,-429,25,26,73,1],
    [117,-423,23,21,82,1],[149,-432,31,26,64,2],[89,-462,27,26,109,0],
    // Beyond the park wall and market, set back from the reservoir and yard.
    [168,9,22,22,57,1],[178,77,25,24,49,2],[179,109,21,24,64,1],
    [171,146,24,27,49,0],[202,166,30,23,69,1],
    [185,-164,24,23,64,0],[188,-102,25,24,52,1],[207,-83,22,18,66,2],
    [-82,-88,24,24,46,2],[-85,-148,27,26,68,1]
  ];
  // The skyline kit already supplies the end headers and stepped shoulders.
  // Keep its bonded surface shell, skip a second run of sub-metre cornice
  // fittings on every distant floor.
  const perimeterBox=(mat,x,y,z,w,h,d,tint)=>box(mat,x,y,z,w,h,d,tint,0,null,true);
  for(const [x,z,w,d,h,kind] of perimeterLots){
    buildSkylineProperty(perimeterBox,x,z,w,d,h,kind,Math.abs(z)<200,collider);
  }
  // East river exchange: ceramic service piers carry an inhabited
  // transfer deck. The full-height void below the deck survives at phone size.
  const exchangeX=198;
  for(const [z,h] of [[-19,29],[22,36]]){
    box('basaltShell',exchangeX,6,z,24,12,17,0xbecacf);
    box('ceramicShell',exchangeX,15,z,19,8,14,0xa6baba);
    box('titaniumSkin',exchangeX,(18+h)/2,z,14,h-18,11,0x9da9ab);
    box('trim',exchangeX,h+.6,z,18,1.2,15,0xa2aaa7);
    for(const offset of [-4,4])box('metal',exchangeX-7.8,h*.55,z+offset,2,h*.86,1.6,0x77888d);
  }
  box('metal',exchangeX,30,2.5,17,4,56,0x657881);
  box(materials.midtownCurtain,exchangeX,33.8,2.5,15,3.6,54,0xa1babd);
  box('metal',exchangeX,36.16,2.5,18,1.12,57,0x8f9ba3);
  for(let z=-20;z<28;z+=6){
    beam('metal',[exchangeX-8.7,28,z],[exchangeX-8.7,36,z+5.5],.95,.95,0xb6b4a8);
    box('warmWindow',exchangeX-7.6,33.7,z, .18,1.65,3.3,0xc4a882);
  }
  for(let tier=0;tier<4;tier++){
    box('metal',exchangeX+tier*1.2,38.5+tier*4.2,22,14-tier*2.5,4.3,18-tier*2.3,0x8c9ea4);
  }
  // The south-facing park edge overlooks a raised railway cutting and the
  // backs of occupied workshops. All of this lies outside the walkable outline.
  for(const x of [90,105,120,135,150]){
    box('basaltShell',x,2.4,108,4.5,5.1,6);
    box('ceramicShell',x,5.15,108,5.3,.6,6.6);
    box('metal',x,5.83,108,15.05,.78,6.2);
    for(const z of [105.2,110.8]){
      box('metal',x,6.96,z,15,.12,.13);
      for(let i=-6;i<=6;i+=3)box('metal',x+i,6.6,z,.09,.83,.11);
    }
    for(const z of [107.1,108.9])box('metal',x,6.30,z,15,.15,.14);
  }
  for(const [x,z,w,h,d,k] of [[94,119,14,11,9,2],[111,123,17,15,12,1],[130,119,19,9,8,2],[147,126,14,18,15,0]]){
    buildSkylineProperty(box,x,z,w,d,h,k);
  }
  sign(111,8.6,116.68,8.5,1.62,'EAST LINE','POWER / SWITCHING YARD','#83dad2',Math.PI);
  const districtRoadStats=flushDistrictRoads(roadRegistry);
  buildStreetConnections({box,beam,collider,surface,sign});
  buildTramPower({box,beam,collider});
  buildStreetSections({box,beam,panel:batch.panel,collider,surface,materials,sign,scene,localLights});
  const occupation=addCityOccupation(scene,{box,beam,panel:batch.panel,materials,colliders,walkSurfaces,sign,sample,soho,eastPark});
  const frontiers=addDistrictFrontiers(scene,{box,beam,materials,colliders,sign});
  const extraVents=[...streetLife.steamSources.map(s=>[s.position.x,s.position.z,s.kind==='food-cart'?'#d7c0a0':'#99b7b3',s.position.y]),...(soho.detail?.steamSources||[]),
    [46.55,-194.82,'#d6ad87',1.73],[35.4,-209.83,'#cba47c',1.73],[71.12,-215.72,'#a79a85',-5.76]];
  const atmosphere=createAtmosphere(scene,{renderer,bounds,extraVents});
  const nightShifts=createNightShifts(scene,{box,collider,ground,buildings:futureCore.buildings,localLights,materials,sign});
  const streetAds=addStreetAdvertising(scene,renderer,futureCore.buildings,localLights,{ground,collider,colliders,isPlayable,signMeshes,rift});
  moving.push((dt,time)=>streetAds.update(time));
  const streetPower=connectStreetPower({routes:mapPlan.roads,box,collider,colliders,ground,isPlayable,
    posts:lampPosts,sites:streetAds.sites,scene,materials});
  buildRegionalGrid(scene);
  moving.push(buildOldNightPost({scene,box,collider,sign,lights:localLights}));
  const stats=batch.finish();
  floorCells=new Map();
  for(const s of walkSurfaces){
    for(let ix=Math.floor(s.minX/6);ix<=Math.floor(s.maxX/6);ix++)
      for(let iz=Math.floor(s.minZ/6);iz<=Math.floor(s.maxZ/6);iz++){
        const key=ix*2048+iz;
        if(!floorCells.has(key))floorCells.set(key,[]);
        floorCells.get(key).push(s);
      }
  }
  const voxelBays=finishVoxelBays(scene);
  let lowDetail=false;
  stats.fultonBays=voxelBays.instances;
  const traffic=createNightTraffic(scene,{ground,colliders});
  stats.traffic=traffic.stats;stats.nightShifts=nightShifts.stats;
  const crowd=createCityCrowd(scene,{materials,bounds,isPlayable,colliders,ground,extraCrowdPaths:[...(soho.crowdPaths||[]),...(eastPark.crowdPaths||[]),...(midtown.crowdPaths||[]),...occupation.crowdPaths,...coreStreets.crowdPaths,...nightShifts.crowdPaths,...repairQuarter.crowdPaths]});
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
  stats.futureCore=futureCore.stats;stats.buildings+=futureCore.stats.buildings;
  stats.streetAds=streetAds.stats;
  stats.drawCalls+=cyber.stats.independentDrawCalls+atmosphere.stats.drawCalls+waterfront.stats.independentDrawCalls+midtownCyber.stats.independentDrawCalls+crowd.stats.drawCalls+(soho.stats.independentDrawCalls||0)+(eastPark.stats.independentDrawCalls||0);
  const landmarks=[
    schoolLandmark,
    {id:'subway',title:'地铁街角',position:new T.Vector3(-5.8,ROAD,12.8)},
    {id:'neon',title:'霓虹街区',position:new T.Vector3(6.0,ROAD,-5.7)},
    {id:'bridge_repair_market',title:'桥下夜修里',position:new T.Vector3(-17.0,SIDE,-25.46)},
    {id:'greenway',title:'街心花园',position:new T.Vector3(35.1,SIDE,23.0)},
    ...waterfront.landmarks,...greenway.landmarks,...midtown.landmarks,
    {id:'midtown_data_commons',title:'数据中庭',position:new T.Vector3(8,SIDE,-129.7)},
    ...soho.landmarks,...eastPark.landmarks,...futureCore.landmarks,
  ];
  // Highest applicable ground patch; geometry and .18m curb steps agree.
  function ground(x,z,limit=Infinity){
    let y=(x>channel.minX&&x<channel.maxX&&z>channel.minZ&&z<channel.maxZ)?-5.82:ROAD;
    const patches=floorCells?(floorCells.get(Math.floor(x/6)*2048+Math.floor(z/6))||[]):walkSurfaces;
    for(const p of patches)if(p.y<=limit+.001&&x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ)y=Math.max(y,p.y);
    return y;
  }
  scene.userData.nyc={stats,landmarks,bounds};
  // Candidate lists preserve collider insertion order. A cell includes the
  // player's full footprint even when their centre is just over its boundary.
  const colliderColumns=new Map(),empty=[];
  for(const solid of colliders){
    for(let ix=Math.floor((solid.min.x-.32)/6);ix<=Math.floor((solid.max.x+.32)/6);ix++){
      if(!colliderColumns.has(ix))colliderColumns.set(ix,new Map());
      const column=colliderColumns.get(ix);
      for(let iz=Math.floor((solid.min.z-.32)/6);iz<=Math.floor((solid.max.z+.32)/6);iz++){
        if(!column.has(iz))column.set(iz,[]);
        column.get(iz).push(solid);
      }
    }
  }
  const solidsNear=(x,z)=>traffic.withBodies(colliderColumns.get(Math.floor(x/6))?.get(Math.floor(z/6))||empty,x,z);
  const cameraMargin=colliders.reduce((max,b)=>Math.max(max,b.userData?.cameraPadding||0),.24);
  const cameraSet=new Set();
  let oldLeft,oldRight,oldFront,oldBack;
  function cameraSolidsBetween(a,b){
    const left=Math.floor((Math.min(a.x,b.x)-cameraMargin)/6),right=Math.floor((Math.max(a.x,b.x)+cameraMargin)/6);
    const front=Math.floor((Math.min(a.z,b.z)-cameraMargin)/6),back=Math.floor((Math.max(a.z,b.z)+cameraMargin)/6);
    if(left!==oldLeft||right!==oldRight||front!==oldFront||back!==oldBack){
      cameraSet.clear();
      for(let ix=left;ix<=right;ix++)for(let iz=front;iz<=back;iz++){
        for(const box of colliderColumns.get(ix)?.get(iz)||empty)cameraSet.add(box);
      }
      oldLeft=left;oldRight=right;oldFront=front;oldBack=back;
    }
    return traffic.withCameraBodies(cameraSet,a,b);
  }
  return {colliders,solidsNear,cameraSolidsBetween,walkSurfaces,spawn:new T.Vector3(0,ROAD,22),bounds,landmarks,ground,isPlayable,stats,
    prepareStreetView:batch.prepareStreetView,finishStreetView:batch.finishStreetView,
    materials,signMeshes,greenway,midtown,crowd,sample,soho,eastPark,futureCore,streetAds,streetPower,occupation,nightShifts,traffic,weatherOccluders:batch.roofOccluders,mapOutline:mapPlan.currentOutline,
    mapFeatures:[...mapPlan.features,...(eastPark.mapFeatures||[]),
      {id:'soho-market-court',name:'街坊市集',fill:'#7e8772',shape:{type:'polygon',points:[[-40.8,56],[-26,56],[-26,76.2],[-40.8,76.2]]}},
      {id:'soho-canal-court',name:'运河街庭院',fill:'#788278',shape:{type:'polygon',points:[[24,135.9],[48.5,135.9],[48.5,142.8],[24,142.8]]}}],
    setQuality(level){lowDetail=level==="low";batch.setQuality(level);crowd.setQuality(level);sampleFrontages.setQuality?.(level);sampleStreet.setQuality?.(level);soho.setQuality?.(level);eastPark.setQuality?.(level);},
    setNight(night){
      futureCore.setNight(night);
      streetAds.setNight(night);
      cyber.setNight(night);atmosphere.setNight(night);waterfront.setNight?.(night);midtown.setNight(night);midtownCyber.setNight(night);
      streetLife.setNight(night);crowd.setNight(night);
      sampleFrontages.setNight(night);sampleStreet.setNight?.(night);
      soho.setNight(night);eastPark.setNight(night);
      occupation.setNight(night);
      for(const l of localLights)l.intensity=l.userData.nightPower*(night?1:.2);
      materials.warmWindow.emissiveIntensity=night?1.05:.72;materials.coolWindow.emissiveIntensity=night?.64:.35;
      materials.cyan.emissiveIntensity=night?2.65:1.5;materials.magenta.emissiveIntensity=night?2.2:1.3;materials.lamp.emissiveIntensity=night?1.25:.8;
    },
    update(dt,time,camera,player=null){futureCore.update?.(dt,time,camera);radio.update(camera?.position,lowDetail);voxelBays.update(camera?.position,lowDetail);batch.updateVisibility(camera?.position);for(const f of moving)f(dt,time);cyber.update(dt,time);waterfront.update?.(dt,time);midtown.update?.(dt,time,camera);midtownCyber.update(dt,time);crowd.update(dt,time,camera);traffic.update(dt,player,crowd.actors,camera?.position);streetLife.update?.(dt,time);soho.update?.(dt,time,camera);eastPark.update?.(dt,time,camera);atmosphere.update(dt,time,camera);}};
}
