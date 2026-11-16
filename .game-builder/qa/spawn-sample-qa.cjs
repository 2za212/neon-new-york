// Independent actual-world acceptance for the authored 40x40m spawn sample.
// Entry/side-alley coordinates below are agent-confirmed authored destinations;
// no offset-derived doorway or invented interior is treated as a fact.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const{buildSync}=require('esbuild');const{installCanvasMock}=require('./canvas-mock.cjs');
async function main(){
  const canvas=installCanvasMock(),T=await import('three'),root=path.resolve(__dirname,'../..'),bundle=path.join(__dirname,'spawn-sample-world.mjs');
  buildSync({stdin:{contents:`export{createNYCScene}from './nyc-scene.js';export{createMotor}from './nyc-motor.js';export{createCityWeather}from './nyc-weather.js';`,resolveDir:root},bundle:true,format:'esm',platform:'node',external:['three','three/*'],outfile:bundle});
  const{createNYCScene,createMotor,createCityWeather}=await import(pathToFileURL(bundle).href+'?t='+Date.now()),scene=new T.Scene();
  const world=await createNYCScene(scene,{capabilities:{getMaxAnisotropy:()=>1}}),sample=world.sample,tests=[];
  if(!sample?.frontages||!sample?.street)throw Error('Final frontage/street sample is not integrated; wait for root before executing');
  const still={moveX:0,moveZ:0,jump:false,sprint:false},v=p=>Array.isArray(p)?p:p.toArray(),ground=(x,z)=>world.ground(x,z,.85);
  function blocking(p,r=.31,height=1.75){return world.colliders.map((b,index)=>({b,index})).filter(({b})=>p[1]+height-.055>b.min.y&&p[1]+.07<b.max.y&&(p[0]-T.MathUtils.clamp(p[0],b.min.x,b.max.x))**2+(p[2]-T.MathUtils.clamp(p[2],b.min.z,b.max.z))**2<r*r-.00001).map(({b,index})=>({index,tag:b.userData||null,min:b.min.toArray(),max:b.max.toArray()}));}
  function near(p){return world.colliders.map((b,index)=>({b,index,distance:Math.hypot(Math.max(b.min.x-p.x,0,p.x-b.max.x),Math.max(b.min.z-p.z,0,p.z-b.max.z))})).filter(o=>o.distance<1&&o.b.min.y<p.y+1.8&&o.b.max.y>p.y).sort((a,b)=>a.distance-b.distance).slice(0,5).map(o=>({index:o.index,distance:o.distance,tag:o.b.userData||null,min:o.b.min.toArray(),max:o.b.max.toArray()}));}
  function record(name,passed,data={}){const t={name,passed,...data};tests.push(t);console.log(`${passed?'PASS':'FAIL'} ${name}`);return passed;}
  function walk(m,target){
    target=v(target);const start=m.position.toArray(),timeout=Math.hypot(target[0]-start[0],target[2]-start[2])/3.1+8;let time=0,reached=false,best=Infinity,stalled=0,minY=start[1],maxY=start[1],embedded=false;const embeddedContacts=[];
    while(time<timeout){const dx=target[0]-m.position.x,dz=target[2]-m.position.z,d=Math.hypot(dx,dz);if(d<.065){reached=true;break;}if(d<best-.02){best=d;stalled=0;}else stalled++;if(stalled>180)break;const s=Math.min(1,Math.max(.13,d/.55));m.update(1/60,{...still,moveX:dx/d*s,moveZ:-dz/d*s},0);time+=1/60;minY=Math.min(minY,m.position.y);maxY=Math.max(maxY,m.position.y);const hits=blocking(m.position.toArray(),.30);if(hits.length){embedded=true;if(embeddedContacts.length<10)embeddedContacts.push({seconds:time,position:m.position.toArray(),grounded:m.grounded,solids:hits});}}
    for(let i=0;i<40;i++)m.update(1/60,still,0);const expected=target[1],heightOK=Math.abs(m.position.y-expected)<.07;
    return{passed:reached&&heightOK&&!embedded,start,target,final:m.position.toArray(),reached,heightOK,embedded,minY,maxY,seconds:time,...(!reached||!heightOK||embedded?{obstruction:near(m.position),embeddedContacts}:{})};
  }
  function sequence(name,start,targets){const m=createMotor(world,new T.Vector3(...v(start))),legs=[];let passed=blocking(m.position.toArray()).length===0;for(const p of targets){const leg=walk(m,p);legs.push(leg);if(!leg.passed){passed=false;break;}}record(name,passed,{legs});return m;}
  const b=sample.bounds;record('authored_sample_bounds_are_40m_square',b.minX===-20&&b.maxX===20&&b.minZ===2&&b.maxZ===42&&sample.area===1600,{bounds:b,area:sample.area});
  record('actual_spawn_is_on_ground_and_outside_solids',Math.abs(world.spawn.y-world.ground(world.spawn.x,world.spawn.z,world.spawn.y+.36))<.001&&blocking(world.spawn.toArray()).length===0,{spawn:world.spawn.toArray(),blockers:blocking(world.spawn.toArray())});
  const entries=sample.entries.map(e=>({...e,street:v(e.street),inside:v(e.inside),deep:v(e.deep),direction:Math.sign(e.inside[0]-e.street[0])}));
  if(entries.length!==3)throw Error('Expected three authored public entry records');
  for(const e of entries){sequence(`${e.id}_actual_door_entry`,e.street,[e.inside,e.deep]);sequence(`${e.id}_actual_door_exit`,e.deep,[e.inside,e.street]);}
  const backs=[],ceilings=[];
  for(const e of entries){
    const m=createMotor(world,new T.Vector3(...e.deep)),start=m.position.clone();for(let i=0;i<200;i++)m.update(1/60,{...still,moveX:e.direction,sprint:true},0);
    const blockers=near(m.position),stopped=Math.abs(m.position.x-start.x)<2.0&&Math.abs(m.position.x-start.x)>.15&&blocking(m.position.toArray()).length===0;
    backs.push({id:e.id,passed:stopped,start:start.toArray(),final:m.position.toArray(),blockers});
    const p=e.inside,overhead=world.colliders.filter(c=>p[0]>c.min.x&&p[0]<c.max.x&&p[2]>c.min.z&&p[2]<c.max.z&&c.min.y>p[1]+1.80).sort((a,c)=>a.min.y-c.min.y)[0];
    if(!overhead){ceilings.push({id:e.id,passed:false,reason:'No physical overhead slab above authored interior'});continue;}
    const jump=createMotor(world,new T.Vector3(...p));jump.position.y=overhead.min.y-1.75-.16;const startFoot=jump.position.y;let maxFoot=startFoot;for(let i=0;i<55;i++){jump.update(1/120,{...still,jump:i===0},0);maxFoot=Math.max(maxFoot,jump.position.y);}
    ceilings.push({id:e.id,passed:Math.abs(overhead.min.y-e.ceilingY)<.025&&maxFoot>startFoot+.05&&maxFoot+1.75<=overhead.min.y+.002,startFoot,maxFoot,authoredCeilingY:e.ceilingY,ceilingMin:overhead.min.y,ceiling:{min:overhead.min.toArray(),max:overhead.max.toArray()}});
  }
  record('all_three_interior_back_cores_are_solid',backs.every(t=>t.passed),{checks:backs});
  record('all_three_upper_ceiling_slabs_block_head_motion',ceilings.every(t=>t.passed),{checks:ceilings});
  const closed=sample.frontages.closedEntry,residential=sequence('closed_residential_stoop_reached',closed.street,[closed.landing]);const stoopStart=residential.position.clone();for(let i=0;i<160;i++)residential.update(1/60,{...still,moveX:-1},0);record('residential_door_remains_closed',residential.position.x>stoopStart.x-1.0&&blocking(residential.position.toArray()).length===0,{start:stoopStart.toArray(),final:residential.position.toArray(),obstruction:near(residential.position)});
  const alleyPoints=sample.street.paths.alley.waypoints.map(v);
  sequence('authored_alley_entry_to_end',alleyPoints[0],alleyPoints.slice(1));sequence('authored_alley_end_to_sidewalk',alleyPoints.at(-1),alleyPoints.slice(0,-1).reverse());
  const end=createMotor(world,new T.Vector3(...alleyPoints.at(-1)));for(let i=0;i<150;i++)end.update(1/60,{...still,moveX:1,sprint:true},0);record('alley_end_gate_is_solid',end.position.x<19.25&&blocking(end.position.toArray()).length===0,{final:end.position.toArray(),obstruction:near(end.position)});
  sequence('east_sidewalk_south_of_cart',[8.85,ground(8.85,3),3],[[8.85,ground(8.85,16),16]]);
  sequence('east_sidewalk_north_of_cart',[8.85,ground(8.85,23),23],[[8.85,ground(8.85,40),40]]);
  sequence('west_sidewalk_north_of_subway',[-8.85,ground(-8.85,15.5),15.5],[[-8.85,ground(-8.85,40),40]]);
  sequence('crosswalk_connects_both_sidewalks',[-8.85,ground(-8.85,8.15),8.15],[[8.85,ground(8.85,8.15),8.15]]);
  const station=sequence('spawn_to_subway_street_approach',world.spawn,[[-5.8,.18,12.8]]);for(let i=0;i<150;i++)station.update(1/60,{...still,moveX:-1},0);record('maintenance_subway_remains_physically_closed',station.position.x>=-6.46&&station.position.y>=.17,{final:station.position.toArray(),obstruction:near(station.position)});
  const crowd=world.crowd,routeBlockers=[];for(const x of[-8.85,8.85])for(let z=21;z<=33.6001;z+=.18){const y=ground(x,z);const solids=blocking([x,y,z],.30);if(solids.length)routeBlockers.push({x,y,z,solids});}
  let finite=true;for(const t of[0,9,25]){crowd.update(.1,t);crowd.group.traverse(o=>{if(o.isInstancedMesh&&o.instanceMatrix.array.some(n=>!Number.isFinite(n)))finite=false;});}
  const originalIDs=['core_west_rainwalker','core_east_commuter','core_west_underpass','core_east_underpass','subway_waiter','food_cart_customer','plaza_rainwalker','plaza_evening_commuter','plaza_bench_reader','delivery_rider_rest','midtown_stall_customer','plaza_east_seat','greenway_east_walker','greenway_east_umbrella','greenway_west_walker','greenway_west_viewer'],actorIDs=new Set(crowd.actors.map(a=>a.def.id));
  record('original_people_and_sample_sidewalk_routes_survive_new_districts',originalIDs.every(id=>actorIDs.has(id))&&crowd.stats.people===crowd.stats.requestedPeople&&actorIDs.size===crowd.stats.people&&crowd.stats.routeValidation.every(r=>r.valid)&&routeBlockers.length===0&&finite,{people:crowd.stats.people,requested:crowd.stats.requestedPeople,routeBlockers,finite,routes:crowd.stats.routeValidation});
  createCityWeather(scene,world);const rain=scene.getObjectByName('NYC / sheltered fine drizzle'),texture=rain.material.uniforms.uRoof.value,image=texture.image,w=world.bounds.maxX-world.bounds.minX,d=world.bounds.maxZ-world.bounds.minZ;
  const roofAt=(x,z)=>image.data[Math.min(image.height-1,Math.max(0,Math.floor((z-world.bounds.minZ)/d*image.height)))*image.width+Math.min(image.width-1,Math.max(0,Math.floor((x-world.bounds.minX)/w*image.width)))];
  const rainChecks=entries.map(e=>({id:e.id,insideRoof:roofAt(e.inside[0],e.inside[2]),streetRoof:roofAt(e.street[0],e.street[2])}));record('new_interiors_have_float_roof_cover_and_road_stays_open',image.data instanceof Float32Array&&rainChecks.every(e=>e.insideRoof>=3.85-.02)&&roofAt(0,22)===0,{textureSize:[image.width,image.height],rainChecks,openRoadRoof:roofAt(0,22)});
  const result={timestamp:new Date().toISOString(),scope:'Final actual sample world/motor/crowd/roof texture; no browser, no old-region full regression',passed:tests.every(t=>t.passed),sample:{bounds:sample.bounds,area:sample.area,entries:sample.entries,street:sample.street.stats},tests,stats:{triangles:world.stats.triangles,colliders:world.colliders.length,surfaces:world.walkSurfaces.length},canvas:canvas.summary()};
  fs.writeFileSync(path.join(__dirname,'spawn-sample-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,count:tests.length,failed:tests.filter(t=>!t.passed).map(t=>t.name),stats:result.stats}));if(!result.passed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
