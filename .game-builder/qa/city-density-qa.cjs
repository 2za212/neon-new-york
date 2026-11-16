// Macro-density acceptance: actual added buildings, traversable greenhouse /
// coffee shelter / knoll, stopped traffic and rain shelter. No GPU art claim.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {buildSync}=require('esbuild'),{installCanvasMock}=require('./canvas-mock.cjs');
async function main(){
  installCanvasMock();const T=await import('three'),{OBB}=await import('three/addons/math/OBB.js'),root=path.resolve(__dirname,'../..'),file=path.join(__dirname,'city-density-world.mjs');
  buildSync({stdin:{contents:`export{createNYCScene}from './nyc-scene.js';export{createMotor}from './nyc-motor.js';export{createCityWeather}from './nyc-weather.js';`,resolveDir:root},bundle:true,format:'esm',platform:'node',external:['three','three/*'],outfile:file});
  const {createNYCScene,createMotor,createCityWeather}=await import(pathToFileURL(file).href+'?t='+Date.now()),scene=new T.Scene(),world=await createNYCScene(scene,{capabilities:{getMaxAnisotropy:()=>1}});
  const tests=[],occupation=world.occupation,soho=world.soho.infill,park=world.eastPark.density,still={moveX:0,moveZ:0,jump:false,sprint:false};
  if(!occupation||!soho||!park)throw Error('All density modules must be integrated before QA');
  const record=(name,passed,data={})=>{tests.push({name,passed,...data});console.log(`${passed?'PASS':'FAIL'} ${name}`);};
  const same=(a,b)=>a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<.00001);
  const blocked=(p)=>world.colliders.map((b,index)=>({b,index})).filter(({b})=>p.y+1.75-.06>b.min.y&&p.y+.07<b.max.y&&(p.x-T.MathUtils.clamp(p.x,b.min.x,b.max.x))**2+(p.z-T.MathUtils.clamp(p.z,b.min.z,b.max.z))**2<.31**2-.00001).map(({b,index})=>({index,tag:b.userData,min:b.min.toArray(),max:b.max.toArray()}));
  for(const [id,detail,tag]of [['traffic',occupation,'cityOccupation'],['soho',soho,'sohoInfill'],['park',park,'parkDensity']]){
    const checks=detail.fixtures.map(f=>{const v=f.bounds||f;return{id:f.id,present:world.colliders.some(b=>b.userData?.[tag]===f.id&&same(b.min.toArray(),v.min)&&same(b.max.toArray(),v.max))};});
    record(id+'_declared_occupation_is_real_collision',checks.length>0&&checks.every(c=>c.present),{count:checks.length,failed:checks.filter(c=>!c.present)});
  }
  const infillBuildings=soho.buildings.map(d=>({id:d.id,bounds:d.bounds,physicalUpper:world.colliders.some(b=>b.userData?.districtKit===d.id+'/upper'&&Math.abs(b.min.y-4.1)<.00001&&b.max.y>12),physicalRoof:world.colliders.some(b=>b.userData?.districtKit===d.id+'/roof'),insideMap:[[d.bounds.minX,d.bounds.minZ],[d.bounds.maxX,d.bounds.maxZ]].every(([x,z])=>world.isPlayable(x,z,.0))}));
  record('eight_added_street_buildings_have_real_cores_and_roofs',infillBuildings.length===8&&world.soho.stats.buildings===20&&infillBuildings.every(b=>b.physicalUpper&&b.physicalRoof&&b.insideMap),{buildings:infillBuildings});
  function leg(m,target){const start=m.position.toArray(),distance=Math.hypot(target[0]-start[0],target[2]-start[2]),limit=distance/3.1+7;let t=0,reached=false,best=Infinity,stall=0,embedded=[];
    while(t<limit){const dx=target[0]-m.position.x,dz=target[2]-m.position.z,d=Math.hypot(dx,dz);if(d<.075){reached=true;break;}if(d<best-.02){best=d;stall=0;}else stall++;if(stall>240)break;const power=Math.min(1,Math.max(.14,d/.60));m.update(1/60,{...still,moveX:dx/d*power,moveZ:-dz/d*power},0);t+=1/60;if(embedded.length<3){const hits=blocked(m.position);if(hits.length)embedded.push({position:m.position.toArray(),hits});}}
    for(let i=0;i<40;i++)m.update(1/60,still,0);return {passed:reached&&embedded.length===0&&Math.abs(m.position.y-target[1])<.07,start,target,final:m.position.toArray(),reached,seconds:t,embedded};
  }
  const back=p=>[...p,...p.slice(0,-1).reverse()];
  for(const [name,points]of [['park_knoll_roundtrip',back(park.hill.waypoints)],['greenhouse_real_entrance_and_deep_aisle_roundtrip',back(park.greenhouse.waypoints)],['coffee_shelter_roundtrip',back(park.cafe.waypoints)],['press_link_ground_underpass_roundtrip',[[-27,.36,108],[-27,.36,115],[-27,.36,108]]]]){
    const m=createMotor(world,new T.Vector3(...points[0])),legs=[];for(const p of points.slice(1)){const result=leg(m,p);legs.push(result);if(!result.passed)break;}record(name,legs.length===points.length-1&&legs.every(l=>l.passed),{legs});
  }
  // A standing capsule can touch the neighbouring, lower roof strip before its
  // centre enters that strip. Match the motor's .31m circular footprint.
  const deep=park.greenhouse.waypoints.at(-1),roof=world.colliders.filter(b=>b.userData?.parkDensity==='greenhouse-roof-pane'&&(deep[0]-T.MathUtils.clamp(deep[0],b.min.x,b.max.x))**2+(deep[2]-T.MathUtils.clamp(deep[2],b.min.z,b.max.z))**2<.31**2-.00001).sort((a,b)=>a.min.y-b.min.y)[0];
  let maxHead=-Infinity;if(roof){const m=createMotor(world,new T.Vector3(...deep));m.position.y=roof.min.y-1.75-.16;for(let i=0;i<55;i++){m.update(1/120,{...still,jump:i===0},0);maxHead=Math.max(maxHead,m.position.y+1.75);}}
  record('greenhouse_glass_roof_stops_actual_head_motion',!!roof&&maxHead<=roof.min.y+.006&&maxHead>roof.min.y-.10,{ceilingMin:roof?.min.y,maxHead});
  const trees=park.trees.map(t=>({x:t.x,z:t.z,id:t.colliderId,physical:world.colliders.some(b=>b.userData?.parkDensity===t.colliderId&&b.min.x<=t.x&&b.max.x>=t.x&&b.min.z<=t.z&&b.max.z>=t.z)}));
  record('twenty_grouped_canopies_keep_real_trunks_and_fourteen_hedge_beds',trees.length===20&&trees.every(t=>t.physical)&&park.stats.shrubBeds===14&&park.beds.length===14&&park.stats.canopyCubes>=2000,{trees,shrubBeds:park.beds.length,canopyCubes:park.stats.canopyCubes});
  const vehicleChecks=occupation.vehicles.map(v=>{const van=v.kind==='delivery-van',width=van?2.03:1.88,length=van?4.90:4.08,c=Math.abs(Math.cos(v.rotation)),s=Math.abs(Math.sin(v.rotation)),expectedX=c*(width+.34)+s*(length+.178),expectedZ=s*(width+.34)+c*(length+.178),b=world.colliders.find(b=>b.userData?.cityOccupation===v.id&&same(b.min.toArray(),v.min)&&same(b.max.toArray(),v.max));return{id:v.id,kind:v.kind,collider:!!b,coversMirrors:v.max[0]-v.min[0]>=expectedX-.0001&&v.max[2]-v.min[2]>=expectedZ-.0001,grounded:Math.abs(world.ground(v.x,v.z,.30)-.18)<.001};});
  const vehicles=occupation.vehicles.map(v=>world.colliders.find(b=>b.userData?.cityOccupation===v.id)),overlaps=[];
  for(let i=0;i<vehicles.length;i++)for(let j=i+1;j<vehicles.length;j++)if(vehicles[i].intersectsBox(vehicles[j]))overlaps.push([occupation.vehicles[i].id,occupation.vehicles[j].id]);
  // The last candidate fills the default spawn view. Check that it survived
  // parking validation, then test actual animated body/umbrella OBBs against
  // this new solid specifically; unchanged scenery keeps its prior 135s audit.
  const spawnCar=occupation.vehicles.find(v=>Math.abs(v.x-4.9)<.001&&Math.abs(v.z-24.8)<.001),spawnContacts=[];
  let spawnBodyChecks=0;
  if(spawnCar){
    const solid=new T.Box3(new T.Vector3(...spawnCar.min),new T.Vector3(...spawnCar.max)).expandByScalar(-.010),matrix=new T.Matrix4(),unit=new T.Box3(new T.Vector3(-.5,-.5,-.5),new T.Vector3(.5,.5,.5)),obb=new OBB();
    for(let sample=0;sample<=180;sample++){
      const time=sample*.75;world.crowd.update(1/15,time);
      for(const actor of world.crowd.actors)for(const item of actor.pieces){
        matrix.multiplyMatrices(item.bone.matrixWorld,item.local);obb.fromBox3(unit).applyMatrix4(matrix);obb.halfSize.subScalar(.006).max(new T.Vector3(.001,.001,.001));spawnBodyChecks++;
        if(obb.intersectsBox3(solid)&&spawnContacts.length<8)spawnContacts.push({time,actor:actor.def.id,part:item.bone.name,center:obb.center.toArray()});
      }
    }
  }
  record('parked_traffic_has_full_width_solid_bodies_and_no_overlap',vehicleChecks.length===occupation.stats.vehicles&&vehicleChecks.length>=20&&vehicleChecks.every(v=>v.collider&&v.coversMirrors&&v.grounded)&&overlaps.length===0&&spawnCar?.kind==='compact-car'&&spawnBodyChecks>0&&spawnContacts.length===0,{vehicles:vehicleChecks,overlaps,rejected:occupation.parkingRejected.length,spawnCar,spawnBodyChecks,spawnContacts});
  const requestedIDs=occupation.crowdPaths.map(d=>d.id),actors=new Set(world.crowd.actors.map(a=>a.def.id));
  record('district_population_and_five_stop_and_dock_roles_are_present',requestedIDs.length===19&&requestedIDs.every(id=>actors.has(id))&&world.crowd.stats.people===41&&world.crowd.stats.drawCalls===6,{people:world.crowd.stats.people,requested:world.crowd.stats.requestedPeople,draws:world.crowd.stats.drawCalls,newIDs:requestedIDs,missing:requestedIDs.filter(id=>!actors.has(id))});
  for(const [id,detail]of [['soho_infill',soho],['park_density',park]]){world.setNight(true);const night=detail.lights.map(l=>l.intensity);world.setNight(false);const dusk=detail.lights.map(l=>l.intensity);world.setNight(true);const restored=detail.lights.map(l=>l.intensity);record(id+'_canopy_lights_follow_day_night_without_extra_shadows',night.length===2&&night.every((p,i)=>p>dusk[i]&&dusk[i]>0)&&same(night,restored)&&detail.lights.every(l=>l.castShadow===false),{night,dusk});}
  createCityWeather(scene,world);const image=scene.getObjectByName('NYC / sheltered fine drizzle').material.uniforms.uRoof.value.image,w=world.bounds.maxX-world.bounds.minX,d=world.bounds.maxZ-world.bounds.minZ;
  const roofAt=(x,z)=>image.data[Math.min(image.height-1,Math.max(0,Math.floor((z-world.bounds.minZ)/d*image.height)))*image.width+Math.min(image.width-1,Math.max(0,Math.floor((x-world.bounds.minX)/w*image.width)))];
  const roofSamples=[{id:'press_upper_link',x:-27,z:111.6,expected:7.38},{id:'new_market_hall',x:-34.85,z:58,expected:soho.marketHall.roofTop},{id:'new_loading_atrium',x:44.28,z:108,expected:soho.atrium.roofTop},{id:'garden_coffee_shelter',x:112,z:74.45,expected:3.78},{id:'open_park_loop',x:74,z:50.5,expected:0}].map(p=>({...p,actual:roofAt(p.x,p.z)}));
  record('new_large_shelters_enter_float_rain_mask_and_open_loop_stays_open',image.data instanceof Float32Array&&roofSamples.every(p=>Math.abs(p.actual-p.expected)<.025),{roofSamples});
  const report={timestamp:new Date().toISOString(),scope:'Actual integrated macro-density world, added occupiable routes/solid fixtures/vehicles/people and float rain shelter; no browser or GPU claim',passed:tests.every(t=>t.passed),tests,stats:{triangles:world.stats.triangles,colliders:world.colliders.length,surfaces:world.walkSurfaces.length,soho:soho.stats,park:park.stats,occupation:occupation.stats,crowd:world.crowd.stats}};
  fs.writeFileSync(path.join(__dirname,'city-density-result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,count:tests.length,failed:tests.filter(t=>!t.passed).map(t=>t.name),triangles:world.stats.triangles,vehicles:occupation.stats.vehicles,people:world.crowd.stats.people}));if(!report.passed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
