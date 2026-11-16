// Functional checks for the new, authored SoHo / East Commons street furniture.
// Canvas is mocked only for world creation; appearance still requires GPU QA.
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{buildSync}=require('esbuild');
const {installCanvasMock}=require('./canvas-mock.cjs');
async function main(){
  installCanvasMock();const T=await import('three'),root=path.resolve(__dirname,'../..'),file=path.join(__dirname,'district-art-world.mjs');
  buildSync({stdin:{contents:`export {createNYCScene} from './nyc-scene.js';export {createMotor} from './nyc-motor.js';export {createLightBudget} from './nyc-light-budget.js';`,resolveDir:root},bundle:true,format:'esm',platform:'node',external:['three','three/*'],outfile:file});
  const {createNYCScene,createMotor,createLightBudget}=await import(pathToFileURL(file).href+'?t='+Date.now());
  const scene=new T.Scene(),world=await createNYCScene(scene,{capabilities:{getMaxAnisotropy:()=>1}}),tests=[];
  const record=(name,passed,data={})=>{tests.push({name,passed,...data});console.log(`${passed?'PASS':'FAIL'} ${name}`);};
  const same=(a,b)=>a.length===b.length&&a.every((n,i)=>Math.abs(n-b[i])<.00001);
  const soho=world.soho.detail,park=world.eastPark.detail;
  if(!soho||!park)throw Error('Both authored detail passes must be integrated first');
  for(const [id,detail,tag,required]of [
    ['soho',soho,'sohoDetail',['court-kiosk','grocer-refrigerator','market-light-post','press-vent']],
    ['park',park,'eastParkDetail',['eco-link-plinth','eco-link-projector','eco-link-leg','eco-link-frame','park-terminal','path-bollard','tram-live-board']]
  ]){
    const checks=detail.fixtures.map(f=>{const v=f.bounds||f,b=world.colliders.find(b=>b.userData?.[tag]===f.id&&same(b.min.toArray(),v.min)&&same(b.max.toArray(),v.max));return{id:f.id,found:!!b,finite:[...v.min,...v.max].every(Number.isFinite),solid:v.max.every((n,i)=>n>v.min[i])};});
    record(id+'_declared_large_fixtures_are_real_solid_colliders',checks.length===detail.stats.colliders&&required.every(id=>checks.some(f=>f.id===id))&&checks.every(f=>f.found&&f.finite&&f.solid),{count:checks.length,required,failed:checks.filter(f=>!f.found||!f.finite||!f.solid)});
  }
  const noInput={moveX:0,moveZ:0,jump:false,sprint:false};
  function overlaps(p){return world.colliders.filter(b=>p.y+1.75-.06>b.min.y&&p.y+.07<b.max.y&&(p.x-T.MathUtils.clamp(p.x,b.min.x,b.max.x))**2+(p.z-T.MathUtils.clamp(p.z,b.min.z,b.max.z))**2<.31**2-.00001);}
  // Approach actual useful new hardware from its customer-facing side. The
  // player must reach its front, stop on the visible body, and walk back out.
  for(const {name,start,moveX,minX,maxX,level}of [
    {name:'soho_memory_kiosk',start:[27.6,.36,104.1],moveX:-1,minX:26.81,maxX:26.86,level:.36},
    {name:'park_west_map_terminal',start:[69.6,.18,32.2],moveX:1,minX:70.20,maxX:70.25,level:.50},
    {name:'park_east_refill_terminal',start:[127.1,.36,60.5],moveX:-1,minX:126.35,maxX:126.40,level:.50},
    {name:'park_ecolink_projector',start:[81.2,.36,45.65],moveX:1,minX:83.15,maxX:83.20,level:.54}
  ]){
    const m=createMotor(world,new T.Vector3(...start));for(let i=0;i<150;i++)m.update(1/60,{...noInput,moveX},0);for(let i=0;i<40;i++)m.update(1/60,noInput,0);
    const stopped=m.position.toArray(),clear=overlaps(m.position).length===0,atFront=m.position.x>=minX&&m.position.x<=maxX&&Math.abs(m.position.y-level)<.025;
    for(let i=0;i<60;i++)m.update(1/60,{...noInput,moveX:-moveX},0);const after=m.position.toArray();
    record(name+'_reachable_solid_and_reversible',clear&&atFront&&overlaps(m.position).length===0&&(after[0]-stopped[0])*(-moveX)>.9,{start,stopped,after,expectedStopX:[minX,maxX],expectedLevel:level,clear});
  }
  for(const [id,detail]of [['soho',soho],['park',park]]){
    world.setNight(true);const n=detail.lights.map(l=>l.intensity),ne=detail.emissives.map(e=>e.material.emissiveIntensity);
    world.setNight(false);const d=detail.lights.map(l=>l.intensity),de=detail.emissives.map(e=>e.material.emissiveIntensity);
    world.setNight(true);const restored=detail.lights.map(l=>l.intensity),re=detail.emissives.map(e=>e.material.emissiveIntensity);
    record(id+'_fixtures_dim_with_dusk_and_restore_exactly',n.length===detail.stats.pointLights&&n.length>0&&n.every((p,i)=>p>d[i]&&d[i]>0&&Math.abs(p-detail.lights[i].userData.nightPower)<.00001)&&same(n,restored)&&ne.length>=3&&ne.every((p,i)=>p>de[i]&&de[i]>0)&&same(ne,re)&&detail.lights.every(l=>l.castShadow===false),{nightLights:n,duskLights:d,nightEmitters:ne,duskEmitters:de});
  }
  record('shared_paving_and_oak_retain_spawn_texture_scale',world.materials.districtSlab.map===world.materials.sampleStreetSlab.map&&world.materials.districtSlab.userData.textureMeters===world.materials.sampleStreetSlab.userData.textureMeters&&world.materials.districtOak.map===world.materials.sampleOak.map,{slabMeters:world.materials.districtSlab.userData.textureMeters,spawnMeters:world.materials.sampleStreetSlab.userData.textureMeters});
  const emissiveSet=new Set([...soho.emissives,...park.emissives].map(e=>e.material)),emitterMeshes=[];scene.traverse(o=>{if(o.isMesh&&emissiveSet.has(o.material))emitterMeshes.push(o);});
  record('new_neon_silhouettes_survive_small_fitting_distance_cull',emitterMeshes.length>0&&emitterMeshes.every(m=>m.userData.nycDistanceDetail!==true),{meshes:emitterMeshes.length});
  const points=[];scene.traverse(o=>{if(o.isPointLight)points.push(o);});const budget=createLightBudget(scene),counts=[];
  for(const [quality,expected]of [['low',6],['balanced',10],['high',14]]){
    budget.setQuality(quality);for(const p of [[0,2,22],[0,2,70],[98,2,36],[123,2,6.8]]){budget.update(0,new T.Vector3(...p),true);counts.push({quality,observer:p,active:points.filter(l=>l.visible).length,reported:budget.stats.active,expected});}
  }
  record('combined_point_light_budget_stays_6_10_14_across_districts',counts.every(c=>c.active===c.expected&&c.reported===c.expected)&&budget.stats.available===points.length,{available:points.length,checks:counts});
  budget.setQuality('balanced');budget.update(0,world.spawn,true);
  const report={timestamp:new Date().toISOString(),scope:'Actual final world hardware collision, shared texture identities, day/night light controls and light budget; no GPU appearance claim',passed:tests.every(t=>t.passed),tests,stats:{triangles:world.stats.triangles,colliders:world.colliders.length,surfaces:world.walkSurfaces.length,soho:soho.stats,park:park.stats,points:points.length}};
  fs.writeFileSync(path.join(__dirname,'district-art-result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,count:tests.length,failed:tests.filter(t=>!t.passed).map(t=>t.name),stats:report.stats}));if(!report.passed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
