const path=require('node:path'),fs=require('node:fs'),{spawnSync}=require('node:child_process');
const{pathToFileURL}=require('node:url');
const{buildSync}=require('esbuild');
const{installCanvasMock}=require('./canvas-mock.cjs');

async function main(){
  const root=path.resolve(__dirname,'../..'),canvas=installCanvasMock(),T=await import('three');
  const file=path.join(__dirname,'midtown-world.mjs');
  buildSync({stdin:{contents:`export{createNYCScene}from './nyc-scene.js';export{createMotor}from './nyc-motor.js';export{createFreeFlight}from './nyc-flight.js';`,resolveDir:root},bundle:true,format:'esm',platform:'node',external:['three','three/*'],outfile:file});
  const{createNYCScene,createMotor,createFreeFlight}=await import(pathToFileURL(file).href+'?t='+Date.now());
  const scene=new T.Scene(),world=await createNYCScene(scene,{capabilities:{getMaxAnisotropy:()=>1}}),tests=[];
  if(!world.isPlayable||world.bounds.minZ>-175||!world.stats.midtown)throw Error('Integrated Midtown is not ready');
  const still={moveX:0,moveZ:0,jump:false,sprint:false};
  function nearby(p,r=2){return world.colliders.map((b,index)=>({b,index,distance:Math.hypot(Math.max(b.min.x-p.x,0,p.x-b.max.x),Math.max(b.min.z-p.z,0,p.z-b.max.z))})).filter(o=>o.distance<r&&p.y+1.75>o.b.min.y&&p.y<o.b.max.y).sort((a,b)=>a.distance-b.distance).slice(0,5).map(o=>({index:o.index,distance:o.distance,min:o.b.min.toArray(),max:o.b.max.toArray()}));}
  function record(result){tests.push(result);console.log(`${result.passed?'PASS':'FAIL'} ${result.name}: ${result.final?.map(v=>v.toFixed(3)).join(', ')||result.detail||''}`);return result.passed;}
  function go(m,x,z,name,expectedY){
    const start=m.position.toArray(),timeout=Math.max(12,Math.hypot(x-start[0],z-start[2])/3.2+12);let t=0,minY=start[1],maxY=start[1],reached=false,best=Infinity,stalled=0,escaped=false;
    while(t<timeout){const dx=x-m.position.x,dz=z-m.position.z,d=Math.hypot(dx,dz);if(d<.075){reached=true;break;}if(d<best-.02){best=d;stalled=0;}else stalled++;if(stalled>240)break;const a=Math.min(1,Math.max(.16,d/.6));m.update(1/60,{...still,moveX:dx/d*a,moveZ:-dz/d*a},0);t+=1/60;minY=Math.min(minY,m.position.y);maxY=Math.max(maxY,m.position.y);if(!world.isPlayable(m.position.x,m.position.z,m.radius-.002))escaped=true;}
    for(let i=0;i<50;i++)m.update(1/60,still,0);const ground=world.ground(m.position.x,m.position.z,m.position.y+.36),heightOK=expectedY===undefined||Math.abs(expectedY-m.position.y)<.07;
    const result={name,passed:reached&&heightOK&&!escaped,reached,heightOK,escaped,start,target:[x,expectedY,z],final:m.position.toArray(),ground,grounded:m.grounded,minY,maxY,seconds:t};if(!result.passed)result.obstruction=nearby(m.position);return record(result);
  }
  function walkRoute(m,route){for(const [name,x,z,y]of route)if(!go(m,x,z,name,y))return false;return true;}
  const traveler=createMotor(world,world.spawn);
  walkRoute(traveler,[['spawn_to_north_seam',0,-51,.18],['north_seam_cross',0,-54,.18],['south_link_64',0,-64,.18],['crossing_86',0,-86,.18],['crossing_118',0,-118,.18],['corporate_plaza',0,-127.5,.36],['hero_front',-8,-139.5,.36],['data_commons_east_side',8,-129.7,.36],['return_plaza_axis',0,-127.5,.36],['return_north_cross',0,-118,.18]]);
  const loop=createMotor(world,new T.Vector3(0,.18,-118));
  walkRoute(loop,[['west_cross_118',-36,-118,.18],['west_side_to_north_ring',-36,-175,.18],['north_ring_to_east_side',58,-175,.18],['east_side_to_south_loop',58,-64,.18],['south_loop_to_core_axis',0,-64,.18],['south_loop_to_west_side',-36,-64,.18],['west_side_to_cross_86',-36,-86,.18],['cross_86_to_east_side',58,-86,.18],['east_side_to_cross_118',58,-118,.18],['cross_118_to_axis',0,-118,.18],['north_seam_return_to_spawn',0,22,.18]]);
  function guard(name,spawn,input,valid){const m=createMotor(world,new T.Vector3(...spawn));let minY=m.position.y,maxY=minY,escaped=false;for(let i=0;i<240;i++){m.update(1/60,{...still,...input},0);minY=Math.min(minY,m.position.y);maxY=Math.max(maxY,m.position.y);if(!world.isPlayable(m.position.x,m.position.z,m.radius-.002))escaped=true;}record({name,passed:valid(m.position)&&!escaped,start:spawn,final:m.position.toArray(),ground:world.ground(m.position.x,m.position.z,m.position.y+.36),minY,maxY,escaped,obstruction:nearby(m.position)});}
  guard('west_slim_solid_wall',[-20,.36,-92.5],{moveZ:1,sprint:true},p=>p.z>=-94.70&&p.y<1);
  guard('east_exchange_solid_podium',[29,.36,-91.5],{moveZ:1,sprint:true},p=>p.z>=-93.70&&p.y<1);
  guard('hero_podium_solid_wall',[-8,.36,-139.5],{moveZ:1,sprint:true},p=>p.z>=-143.70&&p.y<1);
  const probes=[[-80,-60,false],[60,0,true],[0,70,true],[100,120,false],[-100,100,false],[0,-52,true],[-63,-100,true],[58,-175,true],[-130,0,true]];
  record({name:'actual_playable_union_probes',passed:probes.every(([x,z,v])=>world.isPlayable(x,z,.31)===v),detail:JSON.stringify(probes.map(([x,z,expected])=>({x,z,expected,actual:world.isPlayable(x,z,.31)})))});
  guard('northwest_unbuilt_corner_guard',[-63,.18,-60],{moveX:-1,sprint:true},p=>p.x>=-63.692);
  guard('southeast_unbuilt_corner_guard',[100,.18,84],{moveZ:-1,sprint:true},p=>p.z<=95.692);
  const characterBefore=traveler.position.clone(),flight=createFreeFlight(world);flight.activate(new T.Vector3(0,3,-127.5),new T.Vector3(0,0,-1),traveler.position);
  function flyTo(x,y,z,name){const start=flight.position.toArray();let t=0,reached=false,best=Infinity,stalled=0;const timeout=Math.hypot(x-start[0],y-start[1],z-start[2])/8+10;while(t<timeout){const dx=x-flight.position.x,dy=y-flight.position.y,dz=z-flight.position.z,d=Math.hypot(dx,dy,dz);if(d<.12){reached=true;break;}if(d<best-.02){best=d;stalled=0;}else stalled++;if(stalled>240)break;const q=Math.min(1,d/3.0);flight.update(1/60,{moveX:dx/d*q,moveZ:-dz/d*q,moveY:dy/d*q});t+=1/60;}flight.stop();return record({name,passed:reached&&traveler.position.equals(characterBefore),start,target:[x,y,z],final:flight.position.toArray(),characterUnchanged:traveler.position.equals(characterBefore),seconds:t,obstruction:reached?undefined:nearby(flight.position)});}
  const flightRoute=[['flight_plaza_ascent_80m',0,80,-127.5],['flight_east_of_hero',24,80,-136],['flight_hero_south_to_west',-32,80,-136],['flight_hero_west_to_north',-32,80,-174],['flight_north_to_east',24,80,-174],['flight_east_return_plaza',24,80,-136]];
  for(const[n,x,y,z]of flightRoute)if(!flyTo(x,y,z,n))break;
  flight.activate(new T.Vector3(-20,80,-155),new T.Vector3(0,0,-1),traveler.position);let minFlight=80;for(let i=0;i<720;i++){flight.update(1/60,{moveY:-1});minFlight=Math.min(minFlight,flight.position.y);}record({name:'flight_descend_blocks_on_real_hero_podium',passed:minFlight>=16.60&&minFlight<17.0,final:flight.position.toArray(),minFlight,obstruction:nearby(flight.position)});
  const legacy=spawnSync(process.execPath,[path.join(__dirname,'integrated-navigation.cjs')],{cwd:root,encoding:'utf8',maxBuffer:2*1024*1024});
  const legacyReport=JSON.parse(fs.readFileSync(path.join(__dirname,'integrated-navigation-result.json'),'utf8'));record({name:'batch_one_23_regression',passed:legacy.status===0&&legacyReport.passed&&legacyReport.tests.length===23,detail:JSON.stringify({exit:legacy.status,count:legacyReport.tests.length,failed:legacyReport.tests.filter(t=>!t.passed).map(t=>t.name)})});
  const report={timestamp:new Date().toISOString(),scope:'Actual integrated world/motor/free-flight + Canvas mock; no browser/GPU',passed:tests.every(t=>t.passed),canvas:canvas.summary(),bounds:world.bounds,stats:{boxes:world.stats.boxes,triangles:world.stats.triangles,colliders:world.colliders.length,surfaces:world.walkSurfaces.length,midtown:world.stats.midtown,midtownCyber:world.stats.midtownCyber},tests,legacyReport:'integrated-navigation-result.json'};
  fs.writeFileSync(path.join(__dirname,'midtown-navigation-result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,count:tests.length,failed:tests.filter(t=>!t.passed).map(t=>t.name),legacy:legacyReport.passed,stats:{triangles:world.stats.triangles,colliders:world.colliders.length,surfaces:world.walkSurfaces.length}}));if(!report.passed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
