// Acceptance of the actual four-district world, not an envelope-only sandbox.
// Secondary path/door targets are read from the district authors' final metadata.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const{pathToFileURL}=require('node:url');const{buildSync}=require('esbuild');
const{installCanvasMock}=require('./canvas-mock.cjs');
async function main(){
  const canvas=installCanvasMock(),T=await import('three'),root=path.resolve(__dirname,'../..'),file=path.join(__dirname,'full-city-world.mjs');
  buildSync({stdin:{contents:`export{createNYCScene}from './nyc-scene.js';export{createMotor}from './nyc-motor.js';export{createFreeFlight}from './nyc-flight.js';export{createCityWeather}from './nyc-weather.js';`,resolveDir:root},bundle:true,format:'esm',platform:'node',external:['three','three/*'],outfile:file});
  const{createNYCScene,createMotor,createFreeFlight,createCityWeather}=await import(pathToFileURL(file).href+'?t='+Date.now()),scene=new T.Scene();
  const world=await createNYCScene(scene,{capabilities:{getMaxAnisotropy:()=>1}}),tests=[],still={moveX:0,moveZ:0,jump:false,sprint:false};
  if(!world.soho||!world.eastPark||world.bounds.maxZ<160||world.bounds.maxX<144)throw Error('All four districts must be fully integrated before running this QA');
  const P=p=>Array.isArray(p)?p:p.toArray(),feet=(x,z)=>[x,world.ground(x,z,.85),z];
  function blocking(p,r=.30){return world.colliders.map((b,index)=>({b,index})).filter(({b})=>p.y+1.75-.06>b.min.y&&p.y+.07<b.max.y&&(p.x-T.MathUtils.clamp(p.x,b.min.x,b.max.x))**2+(p.z-T.MathUtils.clamp(p.z,b.min.z,b.max.z))**2<r*r-.00001).map(({b,index})=>({index,tag:b.userData||null,min:b.min.toArray(),max:b.max.toArray()}));}
  function nearby(p){return world.colliders.map((b,index)=>({b,index,distance:Math.hypot(Math.max(b.min.x-p.x,0,p.x-b.max.x),Math.max(b.min.z-p.z,0,p.z-b.max.z))})).filter(o=>o.distance<1.5&&o.b.min.y<p.y+1.8&&o.b.max.y>p.y+.07).sort((a,b)=>a.distance-b.distance).slice(0,5).map(o=>({index:o.index,distance:o.distance,tag:o.b.userData||null,min:o.b.min.toArray(),max:o.b.max.toArray()}));}
  function record(name,passed,data={}){tests.push({name,passed,...data});console.log(`${passed?'PASS':'FAIL'} ${name}`);return passed;}
  function leg(m,target){target=P(target);const start=m.position.toArray(),distance=Math.hypot(target[0]-start[0],target[2]-start[2]),timeout=distance/3.1+10,embeddedContacts=[];let time=0,reached=false,best=Infinity,stalled=0,minY=start[1],maxY=start[1],escaped=false,teleported=false;
    const inspect=()=>{const hits=blocking(m.position);if(hits.length&&embeddedContacts.length<6)embeddedContacts.push({time,position:m.position.toArray(),hits});};inspect();
    while(time<timeout){const dx=target[0]-m.position.x,dz=target[2]-m.position.z,d=Math.hypot(dx,dz);if(d<.075){reached=true;break;}if(d<best-.02){best=d;stalled=0;}else stalled++;if(stalled>240)break;const speed=Math.min(1,Math.max(.14,d/.60)),prev=m.position.clone();m.update(1/60,{...still,moveX:dx/d*speed,moveZ:-dz/d*speed},0);time+=1/60;minY=Math.min(minY,m.position.y);maxY=Math.max(maxY,m.position.y);if(Math.hypot(m.position.x-prev.x,m.position.z-prev.z)>.30)teleported=true;if(!world.isPlayable(m.position.x,m.position.z,m.radius-.002))escaped=true;inspect();}
    for(let i=0;i<40;i++)m.update(1/60,still,0);const passed=reached&&!escaped&&!teleported&&!embeddedContacts.length&&Math.abs(m.position.y-target[1])<.07;
    return{passed,start,target,final:m.position.toArray(),ground:world.ground(m.position.x,m.position.z,m.position.y+.36),grounded:m.grounded,minY,maxY,seconds:time,reached,escaped,teleported,embeddedContacts,...(!passed?{obstruction:nearby(m.position)}:{})};
  }
  function follow(points){points=points.map(P);const motor=createMotor(world,new T.Vector3(...points[0])),legs=[];for(const target of points.slice(1)){const result=leg(motor,target);legs.push(result);if(!result.passed)break;}return{motor,passed:legs.length===points.length-1&&legs.every(r=>r.passed),legs};}
  function route(name,points){const result=follow(points);record(name,result.passed,{legs:result.legs});return result.motor;}
  function travel(m,name,x,z,y){const r=leg(m,[x,y??feet(x,z)[1],z]);record(name,r.passed,r);return r.passed;}
  const expectedOutline=[[-64,-180],[84,-180],[84,-52],[144,-52],[144,96],[84,96],[84,160],[-64,160],[-64,52],[-146,52],[-146,-52],[-64,-52]],outline=world.mapOutline.points||world.mapOutline;
  const area=points=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
  record('final_union_outline_bounds_and_67728sqm',JSON.stringify(outline)===JSON.stringify(expectedOutline)&&area(outline)===67728&&world.bounds.minX===-146&&world.bounds.maxX===144&&world.bounds.minZ===-180&&world.bounds.maxZ===160,{bounds:world.bounds,area:area(outline),outline});
  const main=createMotor(world,world.spawn);
  const arterial=[['core_to_south_seam',0,50],['old_south_gate_is_open',0,56],['soho_cross84',0,84],['soho_cross128',0,128],['soho_south_loop',0,150],['soho_loop_to_east58',58,150],['soho_east_link96',58,100],['soho_to_park84',58,84],['park_south_cross_to_ring',132,84],['park_east_ring_to_loop12',132,12],['park_loop12_to_west58',58,12],['park_east_avenue',58,0],['old_east_gate_is_open',44,0],['park_to_core_crossing',0,0],['core_to_midtown_south_link',0,-64],['midtown_south_link_to_east58',58,-64],['old_midtown_park_gate_is_open',58,-54],['midtown_to_park_roundtrip',58,0],['park_return_core',0,0],['four_district_route_return_spawn',0,22]];
  for(const[name,x,z]of arterial)if(!travel(main,name,x,z))break;
  const west=createMotor(world,new T.Vector3(0,.18,84));
  for(const[name,x,z]of [['soho_west_cross84',-48,84],['soho_west_avenue_to_loop150',-48,150],['soho_west_loop_to_axis',0,150],['soho_axis_to_cross128',0,128],['soho_west_cross128',-48,128],['soho_west_avenue_return84',-48,84],['soho_west_loop_return_axis',0,84]])if(!travel(west,name,x,z))break;

  route('civic_link_underpass',[[0,.18,-23],[0,.18,-28.6],[0,.18,-35]]);
  route('civic_link_greenway_below_service_gallery',[[-7,6.51,-28.6],[0,6.51,-28.6],[7,6.51,-28.6]]);
  route('exchange_recess_walk_in_and_out',[[-11.15,.36,-137],[-11.15,.36,-145],[-11.15,.36,-149.45],[-11.15,.36,-137]]);
  route('wetland_stepped_bank_walk_in_and_out',[[111.8,.36,42.9],[111.8,.185,47.1],[111.8,.36,42.9]]);

  // District author metadata is intentionally required rather than inferred
  // from footprints: this catches a declared entry that the final world blocks.
  if(world.soho.entries?.length!==2)throw Error('Expected two author-declared public SoHo rooms');
  const roomCeilings=[];
  for(const e of world.soho.entries){const a=P(e.street),b=P(e.inside),c=P(e.deep);route(`soho_${e.id}_authored_entry_and_return`,[feet(0,a[2]),a,b,c,b,a,feet(0,a[2])]);
    const m=createMotor(world,new T.Vector3(...c)),direction=Math.sign(b[0]-a[0]);for(let i=0;i<200;i++)m.update(1/60,{...still,moveX:direction,sprint:true},0);const face=e.backWallX;const wallOK=Number.isFinite(face)?direction>0?m.position.x<=face-.27:m.position.x>=face+.27:Math.abs(m.position.x-c[0])<3;record(`soho_${e.id}_back_wall_keeps_room_solid`,wallOK&&blocking(m.position).length===0&&nearby(m.position).some(o=>/\/(?:core|back-stock)$/.test(o.tag?.districtKit||'')),{final:m.position.toArray(),backWallX:face,obstruction:nearby(m.position)});
    const ceiling=world.colliders.filter(q=>b[0]>q.min.x&&b[0]<q.max.x&&b[2]>q.min.z&&b[2]<q.max.z&&q.min.y>b[1]+1.80).sort((q,r)=>q.min.y-r.min.y)[0];
    if(!ceiling){roomCeilings.push({id:e.id,passed:false,reason:'Missing physical room ceiling'});continue;}
    const head=createMotor(world,new T.Vector3(...b));head.position.y=ceiling.min.y-1.75-.16;let maxFoot=head.position.y;for(let i=0;i<55;i++){head.update(1/120,{...still,jump:i===0},0);maxFoot=Math.max(maxFoot,head.position.y);}roomCeilings.push({id:e.id,passed:Math.abs(ceiling.min.y-e.ceilingY)<.01&&maxFoot+1.75<=ceiling.min.y+.006&&maxFoot>ceiling.min.y-1.75-.10,ceiling:ceiling.min.y,maxHead:maxFoot+1.75});
  }
  record('soho_room_ceilings_are_physical_and_block_jump',roomCeilings.length===2&&roomCeilings.every(r=>r.passed),{checks:roomCeilings});
  // Consume author-declared routes; these coordinates are not inferred from
  // a facade footprint or an illustrative plan.
  const sohoPaths=world.soho.paths,parkPaths=world.eastPark.paths;
  if(!sohoPaths||!parkPaths)throw Error('District paths metadata is required for alley, pond and pavilion checks');
  const back=points=>[...points,...points.slice(0,-1).reverse()];
  const selectedSoho=['serviceAlley','market','eastCourt','stage'].map(id=>({id,waypoints:back(sohoPaths[id]||[])}));
  const selectedPark=[{id:'parkLoop',waypoints:parkPaths.parkLoop},...['pavilion','wetland','tram'].map(id=>({id,waypoints:back(parkPaths[id]?.waypoints||[])}))];
  if(selectedSoho.some(r=>!r.waypoints?.length)||!selectedPark.length)throw Error('Author-confirmed path handoff is not ready');
  for(const r of selectedSoho)route(`soho_${r.id}`,r.waypoints);
  const marker=world.soho.streetMarker;if(!marker)throw Error('Final SoHo street marker metadata is missing');
  const markerRuns=[-7.3,0,7.3].map(x=>{const points=[feet(x,marker.z-1.8),feet(x,marker.z+1.8),feet(x,marker.z-1.8)],result=follow(points);return{x,passed:result.passed,legs:result.legs};});
  const markerBoxes=world.colliders.filter(q=>q.userData?.id?.startsWith('soho-marker')),overhead=markerBoxes.filter(q=>q.min.x<0&&q.max.x>0),markerUnderside=Math.min(...overhead.map(q=>q.min.y));
  record('soho_street_marker_three_lanes_and_real_headroom',markerBoxes.length===6&&Math.abs(markerUnderside-marker.clearUnderside)<.002&&markerUnderside>=4.8&&markerRuns.every(r=>r.passed),{colliders:markerBoxes.length,markerUnderside,runs:markerRuns});
  for(const r of selectedPark)route(`park_${r.id}`,r.waypoints);
  const wetland=parkPaths.wetland;
  if(!wetland?.pond?.allowed||!wetland.shallowProbe||!wetland.bankApproach)throw Error('Final shallow pond entry/exit metadata is missing');
  route('park_shallow_pond_safe_bottom_and_bank_exit',[wetland.bankApproach,wetland.shallowProbe,wetland.bankApproach]);
  route('old_town_depot_steps_return_to_road',[[-4.8,.18,-3.2],[-4.8,.82,-12.8],[-4.8,.18,-3.2]]);
  route('soho_market_kerbside_aisle',[[-3.72,.35,98.5],[-3.72,.35,110.4]]);
  route('soho_market_shopfront_aisle',[[-7.48,.36,98.5],[-7.48,.36,110.4]]);
  route('record_shop_reclaimed_parking_walk',[[-5.12,.36,20],[-5.12,.36,40]]);
  route('soho_studio_frontage_walk',[[5.18,.36,94],[5.18,.36,116]]);
  for(const side of [-1,1]){
    route('exchange_approach_footway_'+side,[[side*5.45,.36,-93],[side*5.45,.36,-111]]);
    route('freight_warehouse_footway_'+side,[[-79.3,.36,side*5.25],[-95,.36,side*5.25]]);
  }
  route('exchange_forecourt_crossing_and_return',[[0,.18,-108],[0,.385,-127.5],[0,.18,-108]]);
  const pavilion=parkPaths.pavilion,headPoint=P(pavilion.headProbe),roofBox=world.colliders.find(q=>q.userData?.eastPark==='pavilion-roof');
  if(!roofBox)throw Error('Physical pavilion roof collider is missing');
  const pavilionHead=createMotor(world,new T.Vector3(...headPoint));pavilionHead.position.y=roofBox.min.y-1.75-.16;let pavilionMaxHead=pavilionHead.position.y+1.75;for(let i=0;i<55;i++){pavilionHead.update(1/120,{...still,jump:i===0},0);pavilionMaxHead=Math.max(pavilionMaxHead,pavilionHead.position.y+1.75);}
  const pavilionRail=createMotor(world,new T.Vector3(...headPoint));for(let i=0;i<180;i++)pavilionRail.update(1/60,{...still,moveZ:1,sprint:true},0);
  record('park_pavilion_roof_and_actual_rail_are_solid',Math.abs(roofBox.min.y-pavilion.roof.minY)<.002&&pavilionMaxHead<=roofBox.min.y+.006&&pavilionMaxHead>roofBox.min.y-.10&&pavilionRail.position.z>=32.50&&Math.abs(pavilionRail.position.y-headPoint[1])<.01&&blocking(pavilionRail.position).length===0,{roof:{min:roofBox.min.toArray(),max:roofBox.max.toArray()},pavilionMaxHead,railFinal:pavilionRail.position.toArray(),obstruction:nearby(pavilionRail.position)});
  const islands=parkPaths.terrainIslands;if(islands?.length!==3)throw Error('Final three grass terraces are not integrated');
  const terrainChecks=islands.map(island=>{const result=follow(back(island.waypoints)),solids=island.solids.map(s=>{const match=world.colliders.find(q=>q.userData?.eastPark===island.id&&Math.abs(q.min.x-s.minX)<.002&&Math.abs(q.max.x-s.maxX)<.002&&Math.abs(q.min.z-s.minZ)<.002&&Math.abs(q.max.z-s.maxZ)<.002&&Math.abs(q.min.y-s.minY)<.002&&Math.abs(q.max.y-s.maxY)<.002),surface=world.walkSurfaces.find(q=>Math.abs(q.minX-s.minX)<.002&&Math.abs(q.maxX-s.maxX)<.002&&Math.abs(q.minZ-s.minZ)<.002&&Math.abs(q.maxZ-s.maxZ)<.002&&Math.abs(q.y-s.top)<.002);return{rect:s,physical:!!match,walkSurface:!!surface};});return{id:island.id,passed:result.passed&&solids.length===4&&solids.every(s=>s.physical&&s.walkSurface),solids,legs:result.legs};});
  record('park_grass_terraces_have_solid_tops_and_climb_both_ways',terrainChecks.every(r=>r.passed),{checks:terrainChecks});
  for(const g of parkPaths.guards||[]){const start=P(g.start),m=createMotor(world,new T.Vector3(...start));let minY=start[1],maxY=start[1];for(let i=0;i<180;i++){m.update(1/60,{...still,moveX:g.moveX||0,moveZ:g.moveZ||0,sprint:true},0);minY=Math.min(minY,m.position.y);maxY=Math.max(maxY,m.position.y);}const a=g.allowed,inside=!a||m.position.x>=a.minX&&m.position.x<=a.maxX&&m.position.z>=a.minZ&&m.position.z<=a.maxZ;record(`park_${g.id}`,inside&&(g.minY===undefined||minY>=g.minY-.02),{start,final:m.position.toArray(),minY,maxY,allowed:a,obstruction:nearby(m.position)});}
  const probes=[[-100,-100,false],[100,-100,false],[-100,100,false],[100,120,false],[60,0,true],[0,70,true],[58,96,true],[132,84,true],[0,159,true],[-130,0,true],[84.2,95.8,false],[83.6,95.6,true]];
  record('built_districts_open_but_concave_voids_stay_closed',probes.every(([x,z,expected])=>world.isPlayable(x,z,.31)===expected),{probes:probes.map(([x,z,expected])=>({x,z,expected,actual:world.isPlayable(x,z,.31)}))});
  function guard(name,start,input,valid){const m=createMotor(world,new T.Vector3(...start));let minY=m.position.y,escaped=false;for(let i=0;i<240;i++){m.update(1/60,{...still,...input,sprint:true},0);minY=Math.min(minY,m.position.y);if(!world.isPlayable(m.position.x,m.position.z,.308))escaped=true;}record(name,valid(m.position)&&!escaped&&minY>=.15,{start,final:m.position.toArray(),minY,escaped,obstruction:nearby(m.position)});}
  guard('soho_west_boundary_blocks_southwest_void',feet(-62,128),{moveX:-1},p=>p.x>=-63.692);
  guard('soho_east_boundary_blocks_southeast_void',feet(82,128),{moveX:1},p=>p.x<=83.692);
  guard('park_outer_east_boundary_stays_closed',feet(140,0),{moveX:1},p=>p.x<=143.692);
  guard('soho_outer_south_boundary_stays_closed',feet(0,157),{moveZ:-1},p=>p.z<=159.692);
  const preserved=main.position.clone(),flight=createFreeFlight(world);flight.activate(new T.Vector3(58,5,12),new T.Vector3(0,0,-1),main.position);
  function flyTo(name,x,y,z){const start=flight.position.toArray();let t=0,reached=false,best=Infinity,stalled=0;while(t<Math.hypot(x-start[0],y-start[1],z-start[2])/8+10){const dx=x-flight.position.x,dy=y-flight.position.y,dz=z-flight.position.z,d=Math.hypot(dx,dy,dz);if(d<.13){reached=true;break;}if(d<best-.02){best=d;stalled=0;}else stalled++;if(stalled>180)break;const q=Math.min(1,d/3);flight.update(1/60,{moveX:dx/d*q,moveZ:-dz/d*q,moveY:dy/d*q});t+=1/60;}flight.stop();record(name,reached&&main.position.equals(preserved),{start,target:[x,y,z],final:flight.position.toArray(),characterUnchanged:main.position.equals(preserved),seconds:t,...(!reached?{obstruction:nearby(flight.position)}:{})});return reached;}
  for(const[name,x,y,z]of [['freefly_park_ascent',58,80,12],['freefly_park_overview',80,80,84],['freefly_soho_east_overview',58,80,128],['freefly_soho_axis_overview',0,80,128],['freefly_return_core_overview',0,80,22],['freefly_descend_to_safe_core_view',0,3,22]])if(!flyTo(name,x,y,z))break;
  const originalIDs=['core_west_rainwalker','core_east_commuter','core_west_underpass','core_east_underpass','subway_waiter','food_cart_customer','plaza_rainwalker','plaza_evening_commuter','plaza_bench_reader','delivery_rider_rest','midtown_stall_customer','plaza_east_seat','greenway_east_walker','greenway_east_umbrella','greenway_west_walker','greenway_west_viewer'];
  const actorIDs=new Set(world.crowd.actors.map(a=>a.def.id));record('original_people_survive_and_all_authorized_new_routes_validate',originalIDs.every(id=>actorIDs.has(id))&&world.crowd.stats.people===world.crowd.stats.requestedPeople&&world.crowd.stats.routeValidation.every(r=>r.valid),{requested:world.crowd.stats.requestedPeople,actual:world.crowd.stats.people,routes:world.crowd.stats.routeValidation});
  createCityWeather(scene,world);const rain=scene.getObjectByName('NYC / sheltered fine drizzle'),image=rain.material.uniforms.uRoof.value.image,w=world.bounds.maxX-world.bounds.minX,d=world.bounds.maxZ-world.bounds.minZ;
  const roof=(x,z)=>image.data[Math.min(image.height-1,Math.max(0,Math.floor((z-world.bounds.minZ)/d*image.height)))*image.width+Math.min(image.width-1,Math.max(0,Math.floor((x-world.bounds.minX)/w*image.width)))];
  // Walk from the workroom sill across both awning courses to the open kerb.
  const roofChecks=[{id:'books_workroom_sill',x:-10.1,z:95.82,expected:5.195},{id:'books_awning_at_wall',x:-9.85,z:95.82,expected:4.32},{id:'books_awning_at_kerb',x:-7.3,z:95.82,expected:4.0},{id:'books_open_sidewalk',x:-6.58,z:95.82,expected:0},{id:'pavilion_actual_roof',x:headPoint[0],z:headPoint[2],expected:pavilion.roof.maxY},{id:'tram_actual_canopy',x:125,z:6.8,expected:3.965},{id:'park_open_avenue',x:58,z:24,expected:0}].map(p=>({...p,actual:roof(p.x,p.z)}));record('new_district_roofs_use_real_float_metadata',image.data instanceof Float32Array&&roofChecks.every(p=>p.expected===0?p.actual===0:Math.abs(p.actual-p.expected)<.025),{roofChecks,textureSize:[image.width,image.height]});
  for(const[fileName,reportName,expectedCount,label]of [['spawn-sample-qa.cjs','spawn-sample-result.json',23,'original_40m_sample_physics'],['integrated-navigation.cjs','integrated-navigation-result.json',23,'first_district_bridge_pier_physics']]){const run=spawnSync(process.execPath,[path.join(__dirname,fileName)],{cwd:root,encoding:'utf8',maxBuffer:3*1024*1024});let report;try{report=JSON.parse(fs.readFileSync(path.join(__dirname,reportName),'utf8'));}catch{}record(label,run.status===0&&report?.passed&&report.tests.length===expectedCount,{exit:run.status,count:report?.tests.length,failed:report?.tests.filter(t=>!t.passed).map(t=>t.name),...(!report?.passed?{output:run.stdout.slice(-4000),error:run.stderr.slice(-2000)}:{})});}
  const report={timestamp:new Date().toISOString(),scope:'Actual full-city world/motor/freeflight and author-confirmed destinations, plus unchanged old geometry regressions; no browser',passed:tests.every(t=>t.passed),tests,stats:{triangles:world.stats.triangles,colliders:world.colliders.length,surfaces:world.walkSurfaces.length,soho:world.soho.stats,eastPark:world.eastPark.stats,crowd:world.crowd.stats},canvas:canvas.summary()};
  fs.writeFileSync(path.join(__dirname,'full-city-result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,count:tests.length,failed:tests.filter(t=>!t.passed).map(t=>t.name),triangles:world.stats.triangles}));if(!report.passed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
