import * as T from 'three';

// The visible sky, diffuse environment, fog and practicals form one rig. The
// environment is captured once per preset, never regenerated every frame.
export function createCityLighting(scene,renderer,sky) {
  // Low diffuse bounce from the powered streets. Direct light comes from
  // actual shop windows, concourses, bollards, work lamps and vehicles.
  const hemi=new T.HemisphereLight('#afc2db','#635664',.36);
  scene.add(hemi);
  const pools=[];
  for(const [x,z,targetX,power,targetZ=z+.8,height=4.35]of [[-8.53,16,-7.4,68],[8.53,16,7.4,60],[-8.53,-14,-7.6,46],[-21.72,-79,-20.8,82],[18.72,-125,19.5,72],[9.95,27.3,9.0,70,29.0,3.35],[-8.1,97,-7.2,62],[8.1,72,7.2,58],[-8.1,114,-7.2,38],
    // These warm pools originate at the park's actual low bollard lenses.
    // Narrow emitters stay legible while light spills onto the walking plane.
    [-10.23,34.85,-7.65,132,33.8,3.12],[88,64.7,88,22,67,1.17],[119.2,27.1,121,22,29,1.17]]){
    const lamp=new T.SpotLight('#ffc28b',power,12,.81,.76,2);
    lamp.position.set(x,height,z);lamp.target.position.set(targetX,.2,targetZ);
    lamp.userData.shadowCandidate=pools.length===0||pools.length===5;
    lamp.castShadow=lamp.userData.shadowCandidate;
    lamp.shadow.mapSize.set(512,512);lamp.shadow.bias=-.00015;lamp.shadow.normalBias=.012;lamp.shadow.radius=1.8;
    lamp.shadow.camera.near=.2;lamp.shadow.camera.far=13;
    lamp.userData.nightIntensity=power;scene.add(lamp,lamp.target);pools.push(lamp);
  }
  const cityLampLimit=pools.length;
  // Use the same light slots on the north approach. Light crosses the new
  // stepped piers obliquely; the space between two working fixtures stays dark.
  for(const [x,y,z,tx,ty,tz,color,power,reach] of [
    [47.1,3.18,-194.6,50.2,.30,-191.8,0xffaa60,130,14],
    [36,3.18,-209.6,39.8,.30,-208,0xffbb79,104,12],
    [46,8.1,-254,51,.30,-248,0xc7edff,340,22],
    [100,5.94,-223,103,.30,-215,0x98d8ed,218,17],
    [72,-1.3,-216,74,-5.82,-221,0xffb064,150,14],
    [83,7.6,-344,78,.30,-339,0xc9edff,270,19],
    [103,25,-287,108,12,-282,0xdb6db4,360,25]
  ]){
    const lamp=new T.SpotLight(color,power,reach,.64,.70);
    lamp.position.set(x,y,z);lamp.target.position.set(tx,ty,tz);
    lamp.userData.nightIntensity=power;lamp.userData.shadowCandidate=false;
    scene.add(lamp,lamp.target);pools.push(lamp);
  }
  const generator=new T.PMREMGenerator(renderer), environments=new Map();
  const lampCenter=new T.Vector3(Infinity,Infinity,Infinity),rankedLamps=pools.slice();
  let lampLimit=cityLampLimit,clearNight=true,glass=[],capturedRevision=-1;
  const baseSky=hemi.color.clone(),baseGround=hemi.groundColor.clone();
  const redSky=new T.Color('#ff414d'),redGround=new T.Color('#a3233b');
  const baseFog=new T.Color(),redFog=new T.Color('#852741');
  let riftIntensity=0;
  function setRift(intensity){
    riftIntensity=intensity;
    const mix=Math.min(1,intensity);
    hemi.color.copy(baseSky).lerp(redSky,mix);
    hemi.groundColor.copy(baseGround).lerp(redGround,mix);
    hemi.intensity=(clearNight?.36:.32)+intensity*1.58;
    scene.fog.color.copy(baseFog).lerp(redFog,mix);
    scene.fog.density=(clearNight?.0034:.0051)*(1+.73*mix);
  }
  function setNight(clear){
    clearNight=Boolean(clear);sky.setNight(clearNight);
    if(capturedRevision!==sky.powerRevision){
      for(const target of environments.values())target.dispose();
      environments.clear();capturedRevision=sky.powerRevision;
    }
    const id=clearNight?'clear':'rain';
    if(!environments.has(id))environments.set(id,generator.fromScene(sky.getEnvironmentScene(),.02,.1,100,{size:128}));
    scene.environment=environments.get(id).texture;
    scene.environmentIntensity=clearNight?.54:.46;
    scene.fog.color.set(clearNight?'#182533':'#20313d');scene.fog.density=clearNight?.0034:.0051;
    baseFog.copy(scene.fog.color);setRift(riftIntensity);
    for(const lamp of pools)lamp.intensity=lamp.userData.nightIntensity;
    for(const mat of glass)mat.envMap=scene.environment;
    renderer.toneMappingExposure=1.09;
    renderer.shadowMap.needsUpdate=true;
  }
  function bindMaterials(materials){
    glass=[materials.glass,materials.warmWindow,materials.coolWindow].filter(Boolean);
    for(const mat of glass){mat.envMap=scene.environment;mat.envMapIntensity=.52;mat.needsUpdate=true;}
  }
  function selectLamps(player){
    if(lampLimit<pools.length&&lampCenter.distanceToSquared(player)>4){
      lampCenter.copy(player);
      rankedLamps.sort((a,b)=>a.position.distanceToSquared(player)-b.position.distanceToSquared(player));
      for(let i=0;i<rankedLamps.length;i++)rankedLamps[i].visible=i<lampLimit;
    }
  }
  function update(dt,time,player){
    sky.update(dt,time);
    if(player)selectLamps(player);
  }
  function setQuality(level){
    sky.setQuality(level);
    // Each spot contributes a per-pixel lighting loop, even outside its short
    // reach. Keep the low shader count constant as the player crosses districts.
    lampLimit=level==='low'?4:cityLampLimit;
    lampCenter.set(Infinity,Infinity,Infinity);
    for(const lamp of pools)lamp.visible=true;
    selectLamps(new T.Vector3(0,3,16));
    for(const lamp of pools)lamp.castShadow=lamp.userData.shadowCandidate&&level!=='low';renderer.shadowMap.needsUpdate=true;
  }
  setNight(true);update(0,0);
  return {setNight,bindMaterials,update,setQuality,setRift,hemi,
    dispose(){for(const target of environments.values())target.dispose();generator.dispose();}};
}
