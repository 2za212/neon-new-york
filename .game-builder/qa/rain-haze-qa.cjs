const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const{buildSync}=require('esbuild');const{installCanvasMock}=require('./canvas-mock.cjs');
async function main(){
  installCanvasMock();const T=await import('three'),file=path.resolve(__dirname,'rain-haze-world.mjs');
  buildSync({stdin:{contents:`export{createNYCScene}from './nyc-scene.js';export{createAvatar}from './nyc-avatar.js';export{createHeightHaze}from './nyc-height-haze.js';export{createCityWeather}from './nyc-weather.js';`,resolveDir:path.resolve(__dirname,'../..')},bundle:true,format:'esm',platform:'node',external:['three','three/*'],outfile:file});
  const{createNYCScene,createAvatar,createHeightHaze,createCityWeather}=await import(pathToFileURL(file).href+'?t='+Date.now()),scene=new T.Scene();
  const world=await createNYCScene(scene,{capabilities:{getMaxAnisotropy:()=>1}});const avatar=createAvatar(scene);avatar.group.position.copy(world.spawn);
  const initialPhysical=world.colliders.length,haze=createHeightHaze(scene),seen=new Set(),bad=[];
  scene.traverse(o=>{for(const m of(Array.isArray(o.material)?o.material:[o.material])){if(!m?.isMeshStandardMaterial||seen.has(m))continue;seen.add(m);const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};m.onBeforeCompile(shader,{});if(!shader.uniforms.uCityHazeDensity||!shader.vertexShader.includes('instanceMatrix*cityHazePosition')||!shader.fragmentShader.includes('vCityHazeWorld')||!m.customProgramCacheKey().endsWith('/city-height-haze-v1'))bad.push(m.name);}});
  const weather=createCityWeather(scene,world),rain=scene.getObjectByName('NYC / sheltered fine drizzle'),texture=rain.material.uniforms.uRoof.value,image=texture.image;
  const width=world.bounds.maxX-world.bounds.minX,depth=world.bounds.maxZ-world.bounds.minZ;
  function sample(x,z){const w=image.width,h=image.height,ix=Math.min(w-1,Math.max(0,Math.floor((x-world.bounds.minX)/width*w))),iz=Math.min(h-1,Math.max(0,Math.floor((z-world.bounds.minZ)/depth*h)));return{height:image.data[iz*w+ix],cell:[ix,iz],center:[world.bounds.minX+(ix+.5)/w*width,world.bounds.minZ+(iz+.5)/h*depth]};}
  function actualTop(x,z){return Math.max(0,...[...world.colliders,...world.weatherOccluders].filter(b=>b.max.y>=2.5&&Math.min(b.max.x-b.min.x,b.max.z-b.min.z)>=.24&&x>=b.min.x&&x<=b.max.x&&z>=b.min.z&&z<=b.max.z).map(b=>b.max.y));}
  const samples=[[world.midtown.towerFootprints.find(t=>t.id==='west_slim').x,-93.55,'detail_slim_canopy_front'],[3.2,-142.8,'detail_hero_canopy_front'],[24.3,-135,'plaza_rain_shelter'],[10.5,20.2,'new_spawn_food_cart'],[25.5,-76,'new_midtown_food_cart'],[0,-28.6,'original_bridge'],[-95,-28.6,'western_bridge'],[0,0,'open_crossing']].map(([x,z,label])=>{const read=sample(x,z),expected=actualTop(x,z);return{x,z,label,...read,actualTop:expected,error:read.height-expected,covered:read.height>0};});
  const tests=[{name:'roof_is_float_metre_texture',passed:image.data instanceof Float32Array&&texture.type===T.FloatType&&texture.format===T.RedFormat,dataType:image.data.constructor.name,type:texture.type},
    {name:'shader_reads_metres_without_200_scale',passed:rain.material.vertexShader.includes(').r;')&&!rain.material.vertexShader.includes('.r*200.0')},
    {name:'actual_new_canopy_edge_points_are_sheltered',passed:samples.slice(0,2).every(s=>s.height>0),samples:samples.slice(0,2)},
    {name:'shelter_cart_and_bridge_height_precision',passed:samples.slice(2,7).every(s=>s.height>0&&Math.abs(s.error)<.02),samples:samples.slice(2,7)},
    {name:'open_crossing_does_not_gain_roof',passed:samples.at(-1).height===0},
    {name:'all_physical_haze_hooks_preserved',passed:bad.length===0,materials:seen.size,bad},
    {name:'rain_metadata_does_not_mutate_physics',passed:world.colliders.length===initialPhysical,colliders:initialPhysical,weatherOccluders:world.weatherOccluders.length}];
  const result={timestamp:new Date().toISOString(),scope:'Rain texture pixels and actual roof metadata + material shader-hook inspection only; no navigation rerun, browser or GPU',passed:tests.every(t=>t.passed),tests,samples,stats:{haze:haze.stats,weather:weather.stats}};
  fs.writeFileSync(path.join(__dirname,'rain-haze-result.json'),JSON.stringify(result,null,2));for(const t of tests)console.log(`${t.passed?'PASS':'FAIL'} ${t.name}`);console.log(JSON.stringify({passed:result.passed,samples,occluders:world.weatherOccluders.length}));if(!result.passed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
