import * as T from 'three';

// The visible sky, diffuse environment, fog and key light form one rig. The
// environment is captured once per preset, never regenerated every frame.
export function createCityLighting(scene,renderer,sky) {
  const hemi=new T.HemisphereLight('#b2c2cc','#3d4651',.42);
  const key=new T.DirectionalLight('#b7c8d5',.8);
  const fill=new T.DirectionalLight('#9eabb9',.13);
  const keyDirection=sky.palette.lightDirection.clone().normalize();
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-48,right:48,top:52,bottom:-52,near:5,far:300});
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias=-.00012;key.shadow.normalBias=.016;key.shadow.radius=1.7;
  fill.position.set(48,42,85);
  scene.add(hemi,key,key.target,fill);

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
  const generator=new T.PMREMGenerator(renderer), environments=new Map();
  const center=new T.Vector3(0,3,16),lastCenter=new T.Vector3(Infinity,Infinity,Infinity);
  let followBounds={minX:-22,maxX:22,minZ:-28,maxZ:28};
  let currentNight=true,glass=[],subjectMaterials=[];
  function setBounds(bounds){
    if(!bounds||!['minX','maxX','minZ','maxZ'].every(k=>Number.isFinite(bounds[k]))||bounds.maxX<=bounds.minX||bounds.maxZ<=bounds.minZ){
      throw new TypeError('Lighting bounds must be a finite, non-empty XZ rectangle.');
    }
    // Keep the detailed local shadow window instead of stretching one map over
    // the whole district. Edge insets match the original core framing.
    const insetX=Math.min(22,(bounds.maxX-bounds.minX)/2);
    const insetZ=Math.min(24,(bounds.maxZ-bounds.minZ)/2);
    followBounds={minX:bounds.minX+insetX,maxX:bounds.maxX-insetX,
      minZ:bounds.minZ+insetZ,maxZ:bounds.maxZ-insetZ};
    lastCenter.set(Infinity,Infinity,Infinity);
    renderer.shadowMap.needsUpdate=true;
  }
  function setNight(night){
    currentNight=Boolean(night);sky.setNight(currentNight);
    const palette=currentNight?sky.palette.night:sky.palette.dusk;
    const id=currentNight?'night':'dusk';
    if(!environments.has(id))environments.set(id,generator.fromScene(sky.getEnvironmentScene(),.02,.1,100,{size:128}));
    const environment=environments.get(id).texture;
    scene.environment=environment;scene.environmentIntensity=currentNight?.95:.9;
    scene.fog.color.set(palette.fog);scene.fog.density=currentNight?.0033:.0025;
    hemi.color.set(palette.hemi);hemi.groundColor.set(palette.ground);hemi.intensity=currentNight?.69:.87;
    key.color.set(palette.sun);key.intensity=currentNight?1.31:1.82;
    fill.color.set(palette.fill);fill.intensity=currentNight?.15:.37;
    for(const lamp of pools)lamp.intensity=lamp.userData.nightIntensity*(currentNight?1:.84);
    for(const material of glass){material.envMap=environment;material.envMapIntensity=currentNight?.65:.5;material.needsUpdate=true;}
    for(const material of subjectMaterials){material.envMap=environment;material.envMapIntensity=currentNight?2.2:1.0;material.needsUpdate=true;}
    renderer.toneMappingExposure=currentNight?1.13:1.0;
    renderer.shadowMap.needsUpdate=true;
  }
  function bindMaterials(materials){
    glass=[materials.glass,materials.warmWindow,materials.coolWindow].filter(Boolean);
    for(const material of glass){material.envMap=scene.environment;material.envMapIntensity=currentNight?.65:.5;material.needsUpdate=true;}
  }
  function bindSubject(group){
    const unique=new Set();group.traverse(o=>{if(!o.isMesh)return;for(const material of Array.isArray(o.material)?o.material:[o.material])if(material.isMeshStandardMaterial&&material.vertexColors)unique.add(material);});
    subjectMaterials=[...unique];
    // The dark cloth needs a little more diffuse sky bounce than masonry so
    // arms and legs remain readable in the street's long building shadows.
    for(const material of subjectMaterials){material.envMap=scene.environment;material.envMapIntensity=currentNight?2.2:1.0;material.needsUpdate=true;}
  }
  function update(dt,time,player){
    sky.update(dt,time);
    if(player){center.set(
      T.MathUtils.clamp(Math.round(player.x/2)*2,followBounds.minX,followBounds.maxX),
      3+Math.max(0,(Number.isFinite(player.y)?player.y:.18)-.18),
      T.MathUtils.clamp(Math.round(player.z/2)*2,followBounds.minZ,followBounds.maxZ));}
    if(center.distanceToSquared(lastCenter)>3){
      key.target.position.copy(center);key.position.copy(center).addScaledVector(keyDirection,160);lastCenter.copy(center);
      key.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true;
    }
  }
  function setQuality(level){
    sky.setQuality(level);
    const size=level==='high'?4096:level==='low'?1024:2048;
    const radius=level==='low'?34:48;
    Object.assign(key.shadow.camera,{left:-radius,right:radius,top:radius+4,bottom:-radius-4});
    key.shadow.camera.updateProjectionMatrix();
    if(key.shadow.mapSize.x!==size){key.shadow.mapSize.set(size,size);key.shadow.map?.dispose();key.shadow.map=null;}
    for(const lamp of pools)lamp.castShadow=lamp.userData.shadowCandidate&&level!=='low';renderer.shadowMap.needsUpdate=true;
  }
  setNight(true);update(0,0);
  return {setNight,setBounds,bindMaterials,bindSubject,update,setQuality,key,hemi,fill,
    dispose(){for(const target of environments.values())target.dispose();generator.dispose();}};
}
