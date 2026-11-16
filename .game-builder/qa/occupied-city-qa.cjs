const fs=require('node:fs'),path=require('node:path');
const{pathToFileURL}=require('node:url');
const{buildSync}=require('esbuild');
const{installCanvasMock}=require('./canvas-mock.cjs');

async function main(){
  const canvas=installCanvasMock(),T=await import('three'),{OBB}=await import('three/addons/math/OBB.js');
  const file=path.resolve(__dirname,'occupied-city-world.mjs');
  buildSync({stdin:{contents:`export{createNYCScene}from './nyc-scene.js';export{createAvatar}from './nyc-avatar.js';export{createHeightHaze}from './nyc-height-haze.js';export{createCityWeather}from './nyc-weather.js';`,resolveDir:path.resolve(__dirname,'../..')},bundle:true,format:'esm',platform:'node',external:['three','three/*'],outfile:file});
  const{createNYCScene,createAvatar,createHeightHaze,createCityWeather}=await import(pathToFileURL(file).href+'?t='+Date.now());
  const scene=new T.Scene(),world=await createNYCScene(scene,{capabilities:{getMaxAnisotropy:()=>1}}),crowd=world.crowd;
  if(!crowd)throw Error('Expected already-integrated world.crowd; do not create crowd twice');
  const physicalCount=world.colliders.length,avatar=createAvatar(scene);avatar.group.position.copy(world.spawn);
  const tests=[],collisions=[],matrix=new T.Matrix4(),obb=new OBB(),targetBox=new T.Box3(),unit=new T.Box3(new T.Vector3(-.5,-.5,-.5),new T.Vector3(.5,.5,.5));
  const exactSeatBack=[];
  for(const actor of crowd.actors){if(!actor.def.occupiedSeat)continue;const cx=actor.def.a[0],cz=actor.def.a[1];
    for(let i=0;i<3;i++)exactSeatBack.push({actor,id:'real-chair-back-slat',b:new T.Box3(new T.Vector3(cx-.28,.36+.65+i*.13-.0425,cz+.26-.035),new T.Vector3(cx+.28,.36+.65+i*.13+.0425,cz+.26+.035))});
    for(const e of[-1,1])exactSeatBack.push({actor,id:'real-chair-back-post',b:new T.Box3(new T.Vector3(cx+e*.23-.02,.36+.77-.33,cz+.25-.02),new T.Vector3(cx+e*.23+.02,.36+.77+.33,cz+.25+.02))});
  }
  let matricesFinite=true,feetValid=true,sitContact=true,bodyChecks=0;
  for(let sample=0;sample<=180;sample++){
    const time=sample*.75;crowd.update(1/15,time);
    for(const actor of crowd.actors){
      const p=actor.root.position,h=actor.scale*2.35;
      if(p.toArray().some(v=>!Number.isFinite(v))||!world.isPlayable(p.x,p.z,.30))feetValid=false;
      if(Math.abs(p.y-actor.def.level)>.08)feetValid=false;
      if(actor.def.seated){const pelvisBottom=p.y+actor.scale*(actor.hips.position.y-.07);if(Math.abs(pelvisBottom-actor.seatTop)>.006)sitContact=false;}
      const nearby=world.colliders.map((b,index)=>({b,index})).filter(o=>o.b!==actor.def.occupiedSeat&&o.b.max.y>p.y+.015&&o.b.min.y<p.y+h&&o.b.min.x<p.x+1.2&&o.b.max.x>p.x-1.2&&o.b.min.z<p.z+1.2&&o.b.max.z>p.z-1.2);
      for(const item of actor.pieces){
        matrix.multiplyMatrices(item.bone.matrixWorld,item.local);
        if(matrix.elements.some(v=>!Number.isFinite(v))){matricesFinite=false;continue;}
        obb.fromBox3(unit).applyMatrix4(matrix);obb.halfSize.subScalar(.006).max(new T.Vector3(.001,.001,.001));
        for(const{b,index}of nearby){
          targetBox.copy(b).expandByScalar(-.010);if(targetBox.isEmpty())continue;bodyChecks++;
          if(obb.intersectsBox3(targetBox)&&collisions.length<30)collisions.push({time,actor:actor.def.id,part:item.bone.name,kind:item.bone===actor.root?'umbrella':'body',index,tag:b.userData||null,collider:{min:b.min.toArray(),max:b.max.toArray()},partCenter:obb.center.toArray()});
        }
        for(const back of exactSeatBack){if(back.actor!==actor)continue;targetBox.copy(back.b).expandByScalar(-.006);if(obb.intersectsBox3(targetBox)&&collisions.length<30)collisions.push({time,actor:actor.def.id,kind:back.id,part:item.bone.name,partCenter:obb.center.toArray()});}
      }
    }
  }
  const originalIDs=['core_west_rainwalker','core_east_commuter','core_west_underpass','core_east_underpass','subway_waiter','food_cart_customer','plaza_rainwalker','plaza_evening_commuter','plaza_bench_reader','delivery_rider_rest','midtown_stall_customer','plaza_east_seat','greenway_east_walker','greenway_east_umbrella','greenway_west_walker','greenway_west_viewer'];
  const actorIDs=new Set(crowd.actors.map(a=>a.def.id));
  tests.push({name:'original_sixteen_people_and_authorized_district_population',passed:originalIDs.every(id=>actorIDs.has(id))&&crowd.stats.people===crowd.stats.requestedPeople&&crowd.actors.length===crowd.stats.people&&actorIDs.size===crowd.stats.people,originalIDs,stats:crowd.stats});
  tests.push({name:'all_final_furniture_routes_valid',passed:crowd.stats.routeValidation.every(r=>r.valid),routes:crowd.stats.routeValidation});
  tests.push({name:'135sec_animation_finite_and_level',passed:matricesFinite&&feetValid,matricesFinite,feetValid});
  tests.push({name:'actual_part_OBB_against_props_rails_and_chair_backs',passed:collisions.length===0,bodyChecks,collisions});
  tests.push({name:'seated_pelvis_on_slat_surface',passed:sitContact,actors:crowd.actors.filter(a=>a.def.seated).map(a=>({id:a.def.id,position:a.root.position.toArray(),seatTop:a.seatTop,occupiedSeat:!!a.def.occupiedSeat,shift:crowd.stats.routeValidation.find(r=>r.id===a.def.id).shift}))});
  tests.push({name:'crowd_never_adds_player_colliders',passed:world.colliders.length===physicalCount});
  crowd.setQuality('low');crowd.update(.1,150);const lowHz=crowd.stats.updateHz;crowd.setQuality('high');crowd.setNight(false);crowd.setNight(true);tests.push({name:'quality_and_night_controls',passed:lowHz===12&&crowd.stats.updateHz===30&&crowd.stats.drawCalls===6});
  const haze=createHeightHaze(scene),seen=new Set(),hazeShaders=[];
  scene.traverse(o=>{for(const m of(Array.isArray(o.material)?o.material:[o.material])){if(!m?.isMeshStandardMaterial||seen.has(m))continue;seen.add(m);const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};m.onBeforeCompile(shader,{});hazeShaders.push({name:m.name,vertexWorld:shader.vertexShader.includes('vCityHazeWorld=(modelMatrix*cityHazePosition).xyz'),instancing:shader.vertexShader.includes('instanceMatrix*cityHazePosition'),beforeToneMap:shader.fragmentShader.indexOf('gl_FragColor.rgb=mix(gl_FragColor.rgb,uCityHazeColor,hazeAmount)')<shader.fragmentShader.indexOf('#include <tonemapping_fragment>'),uniforms:!!shader.uniforms.uCityHazeDensity,cacheKey:m.customProgramCacheKey().endsWith('/city-height-haze-v1')});}});
  tests.push({name:'physical_haze_hook_preserves_instancing_and_linear_insertion',passed:hazeShaders.every(s=>s.vertexWorld&&s.instancing&&s.beforeToneMap&&s.uniforms&&s.cacheKey),materialCount:hazeShaders.length,crowdMaterials:hazeShaders.filter(s=>s.name.startsWith('NYC city crowd'))});
  const weather=createCityWeather(scene,world),rain=scene.getObjectByName('NYC / sheltered fine drizzle'),roof=rain.material.uniforms.uRoof.value.image;
  function roofAt(x,z){const u=T.MathUtils.clamp((x-world.bounds.minX)/(world.bounds.maxX-world.bounds.minX),0,.999999),v=T.MathUtils.clamp((z-world.bounds.minZ)/(world.bounds.maxZ-world.bounds.minZ),0,.999999);return roof.data[Math.floor(v*roof.height)*roof.width+Math.floor(u*roof.width)];}
  const shelters=world.colliders.filter(b=>b.userData?.streetLife==='rain-shelter-roof').map(b=>{const c=b.getCenter(new T.Vector3());return{center:c.toArray(),actualTop:b.max.y,encodedTop:roofAt(c.x,c.z),extraClearance:roofAt(c.x,c.z)+.18-b.max.y};});
  const roofSamples=[[-20,-93.55,'new_slim_canopy_front_edge'],[3.2,-142.80,'new_hero_canopy_front_edge'],[0,-28.6,'bridge_center'],[0,0,'open_crossing']].map(([x,z,label])=>({x,z,label,encodedRoof:roofAt(x,z)}));
  const roofAudit={heightFormat:'Float32 metres',dataType:roof.data.constructor.name,textureSize:[roof.width,roof.height],cellMeters:[(world.bounds.maxX-world.bounds.minX)/roof.width,(world.bounds.maxZ-world.bounds.minZ)/roof.height],shelters,samples:roofSamples,roofMaterial:rain.material.name,negativeAlpha:false};
  tests.push({name:'registered_shelter_and_bridge_roof_mask_present',passed:roof.data instanceof Float32Array&&shelters.every(s=>s.encodedTop>=s.actualTop-.01)&&roofAt(0,-28.6)>=6.51-.001&&roofSamples.slice(0,2).every(s=>s.encodedRoof>0)&&roofAt(0,0)===0,roofAudit});
  const report={timestamp:new Date().toISOString(),scope:'Actual final world.crowd + oriented NPC boxes; shader-hook/roof-data structural QA only, no browser or GPU shader compilation',passed:tests.every(t=>t.passed),tests,roofAudit,stats:{crowd:crowd.stats,colliders:world.colliders.length,sceneTriangles:world.stats.triangles,heightHaze:haze.stats,weather:weather.stats},canvas:canvas.summary()};
  fs.writeFileSync(path.join(__dirname,'occupied-city-result.json'),JSON.stringify(report,null,2));for(const t of tests)console.log(`${t.passed?'PASS':'FAIL'} ${t.name}`);console.log(JSON.stringify({passed:report.passed,failures:tests.filter(t=>!t.passed).map(t=>t.name),collisions,roofAudit,crowd:{people:crowd.stats.people,walkers:crowd.stats.walking,draws:crowd.stats.drawCalls,instances:crowd.stats.instances}}));if(!report.passed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
