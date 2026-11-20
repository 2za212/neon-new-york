import {createRealmSystem} from './nyc-realm-system.js';
import {createSchoolAwakening} from './nyc-school-awakening.js';
import {createHomeOpening} from './nyc-home-opening.js';
import {fulton} from './nyc-fulton-house.js';
import {createFultonLift} from './nyc-fulton-lift.js';
import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {initialize} from 'zaohua-platform-sdk';
import {createNYCScene} from './nyc-scene.js';
import {loadPlayerAvatar} from './nyc-player-avatar.js';
import {createInputs} from './nyc-controls.js';
import {createMotor,cameraClearance} from './nyc-motor.js';
import {createTrafficShoulder} from './nyc-traffic-shoulder.js';
import {createWetReflection} from './nyc-wet-reflection.js';
import {createCitySky} from './nyc-sky.js';
import {createBloodRift} from './nyc-blood-rift.js';
import {createSubjectBounce} from './nyc-practical-subject.js';
import {bakeCityRadiance} from './nyc-city-radiance.js';
import {createCityLighting} from './nyc-lighting.js';
import {lightCoreStreets} from './nyc-core-lighting.js';
import {getDistrict} from './nyc-map-plan.js';
import {sampleStreetEntry} from './nyc-street-sampler.js';
import {createMapUI} from './nyc-map-ui.js';
import {createFreeFlight} from './nyc-flight.js';
import {streetLightPatches} from './nyc-street-light-patches.js';
import {rainFilm} from './nyc-ground-film.js';
import {createHeightHaze} from './nyc-height-haze.js';
import {createCityWeather} from './nyc-weather.js';
import {createLightBudget} from './nyc-light-budget.js';
import {createCombat,hasCombatClips} from './nyc-combat.js';
import {createCombatEffects} from './nyc-combat-effects.js';

async function start(){
  const mobilePreview=new URLSearchParams(location.search).get('mobilePreview')==='1'||matchMedia('(pointer: coarse)').matches;
  document.body.classList.toggle('mobile-preview',mobilePreview);
  await initialize({capabilities:[]});
  const scene=new T.Scene();scene.fog=new T.FogExp2('#64717d',.0038);
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.domElement.id='game';renderer.domElement.tabIndex=0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.info.autoReset=false;
  document.querySelector('#viewport').append(renderer.domElement);
  const camera=new T.PerspectiveCamera(55,1,.14,600);
  const sky=createCitySky();scene.add(sky.object);
  const lightRig=createCityLighting(scene,renderer,sky);
  const updateBloodRift=createBloodRift(sky.rift,lightRig,scene);
  document.querySelector('#load-detail').textContent='正在铺设街道与建筑…';
  await new Promise(resolve=>requestAnimationFrame(resolve));
  const world=await createNYCScene(scene,renderer,sky.rift);
  document.querySelector('#load-detail').textContent='正在加载漫游角色…';
  const avatar=await loadPlayerAvatar(scene),motor=createMotor(world,world.spawn,avatar.walkingSpeed);
  const lift=createFultonLift(scene,world.materials);
  let ride=null,opening=null;
  const flight=createFreeFlight(world),flightDirection=new T.Vector3(),shadowFocus=new T.Vector3();
  const weather=createCityWeather(scene,world);
  for(const name of ['asphalt','paver','coreAsphalt','corePaver','concrete','districtSlab','districtSlabAlt','sampleStreetSlab','sampleStreetSlabAlt','sampleStreetBluestone','sampleStreetDryAsphalt','sampleStreetWetCurb','sampleStreetBasalt']){
    const roadway=name==='asphalt'||name==='coreAsphalt';
    if(world.materials[name])rainFilm(world.materials[name],roadway?.93:.62,weather.groundCover);
  }
  const coreLight=lightCoreStreets(scene,world.futureCore.buildings);
  const gl=renderer.getContext();
  world.stats.cityRadiance=bakeCityRadiance(scene,world,avatar.group,sky,gl.getParameter(gl.MAX_3D_TEXTURE_SIZE));
  const mobilePuddles=streetLightPatches(scene,world);
  const heightHaze=createHeightHaze(scene,sky),lightBudget=createLightBudget(scene);
  lightRig.bindMaterials(world.materials);
  const subjectBounce=createSubjectBounce(scene,avatar.group);
  const wetReflection=createWetReflection(scene,world.bounds);
  avatar.group.position.copy(motor.position);
  const punchEnabled=hasCombatClips(avatar);
  const effects=punchEnabled?createCombatEffects(scene):null;
  const combat=effects?createCombat({scene,world,motor,avatar,effects}):null;
  const attackLabel=avatar.group.userData.avatar?.source==='original'?'发掌':null;
  const inputs=createInputs(renderer.domElement,{attackLabel,punchEnabled,combatEnabled:!!combat}),composer=new EffectComposer(renderer);
  const combatPanel=document.querySelector('#combat-hud');
  document.querySelector('#attack-label').textContent=attackLabel || '';
  for(const element of document.querySelectorAll('[data-attack-control]'))element.hidden=!attackLabel;
  for(const element of document.querySelectorAll('[data-punch-control]'))element.hidden=!punchEnabled;
  for(const element of document.querySelectorAll('[data-combat-control]'))element.hidden=!combat;
  combatPanel.hidden=!combat;
  if(punchEnabled)document.querySelector('#orbit-label').textContent='右键拖动';
  composer.addPass(new RenderPass(scene,camera));
  const ao=new GTAOPass(scene,camera,1,1,undefined,{radius:.7,thickness:.5,distanceFallOff:1,samples:6},{radius:3,samples:8});ao.blendIntensity=.45;composer.addPass(ao);
  const bloom=new UnrealBloomPass(new T.Vector2(1,1),.19,.35,1.4);composer.addPass(bloom);composer.addPass(new OutputPass());
  const edgeAA=new SMAAPass();composer.addPass(edgeAA);
  const initialView={yaw:2.79,pitch:.09,zoom:5.4};
  const frameProfile={warm:0,count:0,total:0,worst:0,calls:0,triangles:0,last:0,reported:false};
  let yaw=initialView.yaw,pitch=initialView.pitch,zoom=initialView.zoom,cameraDistance=zoom,frameNumber=0;
  let paused=false,photo=false,night=true,lastTime=0,elapsed=0,hudTime=0,toastTimer=0,selectedLandmarkId=null,mapWasPaused=false;
  const target=motor.position.clone().add(new T.Vector3(0,1.25,0)),desired=new T.Vector3(),orbitDirection=new T.Vector3(),currentTarget=target.clone(),lookTarget=target.clone();
  const lobbyShoulder=new T.Vector3();
  const adjustTrafficShoulder=createTrafficShoulder(world.traffic.cars,(a,b)=>world.cameraColliders||world.cameraSolidsBetween(a,b));
  const seen=new Set(),markerGroup=new T.Group();scene.add(markerGroup);
  const markerGeometry=new T.BoxGeometry(.24,.24,.24);
  const markers=(world.landmarks||[]).map(l=>{const marker=new T.Mesh(markerGeometry,new T.MeshLambertMaterial({color:'#edbf80',emissive:'#785427',transparent:true,opacity:.9,depthWrite:false}));marker.position.copy(l.position);marker.position.y+=2.15;markerGroup.add(marker);return{landmark:l,marker};});
  // Billboard positions and puddle masks live in their own shaders. The normal
  // override must skip them, or it would draw an opaque card at the origin and
  // cover the subway opening with an invisible flat plane in the AO buffer.
  const nonOccluding=[];scene.traverse(o=>{if((o.isMesh||o.isLine||o.isPoints)&&(o.userData.excludeFromAO||o.material.transparent||o.material.isShaderMaterial||o.material.isMeshBasicMaterial))nonOccluding.push(o);});
  if(effects)nonOccluding.push(effects.group);
  const renderAO=ao.render.bind(ao);
  ao.render=(...args)=>{const visible=nonOccluding.map(o=>o.visible);nonOccluding.forEach(o=>o.visible=false);try{renderAO(...args);}finally{nonOccluding.forEach((o,i)=>o.visible=visible[i]);}};
  const pausePanel=document.querySelector('#pause');
  function setPaused(value){paused=value;pausePanel.hidden=!paused;document.body.classList.toggle('is-paused',paused);inputs.clear();flight.stop();if(paused)document.querySelector('#resume').focus();else renderer.domElement.focus({preventScroll:true});lastTime=0;}
  function setPhoto(value){photo=value;document.body.classList.toggle('photo',photo);document.querySelector('#exit-photo').hidden=!photo;inputs.clear();flight.stop();if(!paused)renderer.domElement.focus({preventScroll:true});}
  const mapUI=createMapUI(world,{
    onOpen(){mapWasPaused=paused;setPaused(true);pausePanel.hidden=true;},
    onClose(){setPaused(mapWasPaused);return mapWasPaused;},
    onSelect(id){selectedLandmarkId=id;hudTime=1;updateHUD(0);}
  });
  const realmSite=world.landmarks.find(l=>l.id==='midtown_civic_plaza');
  const realm=createRealmSystem({avatar,inputs,landmark:realmSite,
    context:()=>opening.active?opening.realmContext():{root:scene,camera,position:motor.position,indoor:false,solids:(a,b)=>world.cameraColliders||world.cameraSolidsBetween(a,b)},
    canOpen:()=>opening&&(opening.active?opening.walking():!ride&&!paused&&!photo&&!flight.active&&motor.grounded&&!combat?.getState().role),
    onTrack:id=>{selectedLandmarkId=id;hudTime=1;updateHUD(0);}
  });
  const walkControls=document.querySelector('.controls').innerHTML;
  function setFlight(value){
    if(value){if(combat?.getState().role)return;camera.getWorldDirection(flightDirection);if(!flight.activate(camera.position,flightDirection,motor.position))return;motor.velocity.x=motor.velocity.z=0;avatar.group.visible=true;}
    else{flight.deactivate();positionCamera(0,true);}
    inputs.setFlightMode(value);document.body.classList.toggle('free-flying',value);
    document.querySelector('#roam').setAttribute('aria-pressed',String(value));document.querySelector('#roam').title=value?'返回角色 · F':'自由漫游 · F';
    document.querySelector('#roam-menu').textContent=value?'返回角色步行':'开启自由漫游';
    document.querySelector('#mode-name').textContent=value?'自由漫游':'城市漫游者';
    document.querySelector('.route p').textContent=value?'空中观察':'沿街探索';
    document.querySelector('.controls').innerHTML=value?'<kbd>W A S D</kbd> 飞行 <i></i><kbd>Q / E</kbd> 升降 <i></i><kbd>拖动</kbd> 观察 <i></i><kbd>滚轮</kbd> 速度 <i></i><kbd>Shift</kbd> 加速 <i></i><kbd>F</kbd> 返回':walkControls;
    document.querySelector('#roam-status').hidden=!value;hudTime=1;updateHUD(0);setPaused(false);
  }
  function reset(){if(flight.active)setFlight(false);motor.reset();combat?.reset();yaw=initialView.yaw;pitch=initialView.pitch;zoom=initialView.zoom;cameraDistance=zoom;currentTarget.copy(motor.position).y+=1.25;positionCamera(0,true);hudTime=1;updateHUD(0);setPaused(false);}
  function lighting(){
    // The weather can change while the powered infrastructure stays on.
    coreLight.setNight(true);world.setNight(true);wetReflection.setNight(true);
    lightRig.setNight(night);heightHaze.setNight(night);weather.setNight(night);
    bloom.strength=night?.38:.43;bloom.radius=.40;bloom.threshold=1.24;
    renderer.shadowMap.needsUpdate=true;
    document.querySelector('#light').textContent=night?'切换到长夜细雨':'切换到雨后长夜';
    const condition=night?'纽约 · 雨后长夜':'纽约 · 长夜细雨';
    document.querySelector('.bottom-hud span').textContent=condition;
    document.querySelector('.menu-subtitle').textContent=condition;
  }
  const labelToggle=document.querySelector('#district-label');
  labelToggle.onclick=()=>{
    const hidden=document.querySelector('#area').toggleAttribute('hidden');
    labelToggle.textContent=hidden?'显示地名':'隐藏地名';
    labelToggle.setAttribute('aria-pressed',String(!hidden));
  };
  const quality=document.querySelector('#quality');if(mobilePreview||matchMedia('(pointer:coarse)').matches)quality.value='low';
  function resize(){
    const level=quality.value,post=level!=='low';
    const cap=level==='high'?1.8:post?1.35:1;
    const simulator=window.frameElement?.hasAttribute('data-nyc-simulator');
    const displayScale=simulator?window.frameElement.getBoundingClientRect().width/innerWidth:1;
    const ratio=Math.min(devicePixelRatio*displayScale,cap);
    renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);
    // Keep the low preset at native canvas resolution without allocating
    // full-size bloom, AO, SMAA and intermediate colour buffers.
    composer.setPixelRatio(post?ratio:1);
    composer.setSize(post?innerWidth:1,post?innerHeight:1);
    camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<innerHeight?64:55;camera.updateProjectionMatrix();
    bloom.enabled=edgeAA.enabled=post;
    ao.enabled=level==='high';
    if(!ao.enabled)ao.setSize(1,1);
    wetReflection.setQuality(level);mobilePuddles.visible=level!=='high';
    lightRig.setQuality(level);weather.setQuality(level);world.setQuality?.(level);lightBudget.setQuality(level);
    Object.assign(frameProfile,{warm:0,count:0,total:0,worst:0,calls:0,triangles:0,last:0,reported:false});
    renderer.shadowMap.needsUpdate=true;
  }
  document.querySelector('#menu').onclick=()=>setPaused(!paused);document.querySelector('#resume').onclick=()=>setPaused(false);document.querySelector('#reset').onclick=reset;document.querySelector('#photo').onclick=()=>setPhoto(!photo);document.querySelector('#exit-photo').onclick=()=>setPhoto(false);document.querySelector('#light').onclick=()=>{night=!night;lighting();};quality.onchange=resize;
  document.querySelector('#roam').onclick=()=>setFlight(!flight.active);document.querySelector('#roam-menu').onclick=()=>setFlight(!flight.active);
  document.querySelector('#combat-reset').onclick=reset;
  addEventListener('resize',resize);
  addEventListener('nyc-preview-resize',resize);
  addEventListener('keydown',e=>{
    if(ride){e.preventDefault();return;}
    if(opening?.active||e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.target?.matches?.('select,input,textarea'))return;
    if(e.key==='Escape'){e.preventDefault();if(mapUI.isOpen)mapUI.close();else if(photo)setPhoto(false);else setPaused(!paused);}
    const key=e.key.toLowerCase();
    if(key==='m'&&!photo){e.preventDefault();mapUI.toggle();}
    if(key==='h'&&!mapUI.isOpen)setPhoto(!photo);
    if(key==='f'&&!mapUI.isOpen&&!paused&&!photo){
      e.preventDefault();
      if(flight.active||!combat?.meditate())setFlight(!flight.active);
    }
  });
  addEventListener('blur',()=>{inputs.clear();flight.stop();lastTime=0;});document.addEventListener('visibilitychange',()=>{inputs.clear();flight.stop();lastTime=0;});
  function positionCamera(dt,snap=false){
    const p=motor.position;
    const hall=Math.abs(p.y-fulton.street[1])<.48||Math.abs(p.y-fulton.landing[1])<.48
      ? T.MathUtils.smoothstep(p.z,74.75,75.22)*(1-T.MathUtils.smoothstep(p.z,77.92,78.22))*
        T.MathUtils.smoothstep(p.x,-22.7,-22.12)*(1-T.MathUtils.smoothstep(p.x,-10.85,-9.3)) : 0;
    target.copy(p);target.y+=1.25+.10*hall;
    target.x+=.26*hall*Math.cos(yaw);target.z-=.26*hall*Math.sin(yaw);
    if(hall)target.z=T.MathUtils.lerp(target.z,T.MathUtils.clamp(target.z,75.42,77.52),hall);
    if(snap)currentTarget.copy(target);else currentTarget.lerp(target,1-Math.exp(-dt*18));
    orbitDirection.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
    desired.copy(currentTarget).addScaledVector(orbitDirection,T.MathUtils.lerp(zoom,Math.min(zoom,2.90),hall)*(innerWidth<innerHeight?1.12:1));
    if(!hall&&adjustTrafficShoulder(currentTarget,desired,dt,snap))
      orbitDirection.subVectors(desired,currentTarget).normalize();
    let cameraSolids=world.cameraColliders||world.cameraSolidsBetween(currentTarget,desired);
    let allowed=cameraClearance(currentTarget,desired,cameraSolids);
    // Along the lobby's south wall the straight boom runs out of space.
    // Slide the shoulder down the length of the room as that wall approaches.
    // Stay on the player side of both walls and test the whole new segment.
    if(hall&&Math.abs(p.y-fulton.street[1])<.48&&orbitDirection.z>.60&&allowed<1.52){
      const slide=hall*(1-T.MathUtils.smoothstep(allowed,.94,1.52))*
        T.MathUtils.smoothstep(orbitDirection.z,.60,.85);
      lobbyShoulder.copy(currentTarget).addScaledVector(orbitDirection,Math.max(0,allowed-.04));
      lobbyShoulder.x+=1.92*slide;
      const localSolids=world.cameraColliders||world.cameraSolidsBetween(currentTarget,lobbyShoulder);
      const clearance=cameraClearance(currentTarget,lobbyShoulder,localSolids);
      if(clearance>allowed+.025){
        orbitDirection.subVectors(lobbyShoulder,currentTarget).normalize();
        allowed=clearance;
        cameraSolids=localSolids;
      }else if(!world.cameraColliders){
        cameraSolids=world.cameraSolidsBetween(currentTarget,desired);
      }
    }
    if(snap||allowed<cameraDistance)cameraDistance=allowed;else cameraDistance=T.MathUtils.lerp(cameraDistance,allowed,1-Math.exp(-dt*5));
    camera.position.copy(currentTarget).addScaledVector(orbitDirection,cameraDistance);
    // Raising a downward-looking camera above paving can move it inside a
    // podium that the original below-ground ray missed. Recheck the final ray.
    for(let i=0;i<2;i++){
      camera.position.y=Math.max(camera.position.y,motor.groundAt(camera.position.x,camera.position.z,currentTarget.y)+.28);
      const distance=currentTarget.distanceTo(camera.position),safe=cameraClearance(currentTarget,camera.position,cameraSolids);
      if(safe>=distance-.0001)break;
      camera.position.lerp(currentTarget,1-safe/Math.max(distance,.0001));cameraDistance=Math.min(cameraDistance,safe);
    }
    lookTarget.copy(currentTarget);lookTarget.y+=Math.max(0,-pitch-.08)*3.2;camera.lookAt(lookTarget);avatar.group.visible=cameraDistance>.62;
  }
  const combatHUD={
    player:document.querySelector('#player-hp'), dummy:document.querySelector('#dummy-hp'),
    playerText:document.querySelector('#player-hp-text'), dummyText:document.querySelector('#dummy-hp-text'),
    hint:document.querySelector('#combat-hint'), reset:document.querySelector('#combat-reset'),
  };
  function updateCombatHUD(){
    if(!combat)return;
    const state=combat.getState();
    combatHUD.player.value=state.playerHP;combatHUD.dummy.value=state.npcHP;
    combatHUD.playerText.textContent=`${state.playerHP} / ${state.maxPlayerHP}`;
    combatHUD.dummyText.textContent=`${state.npcHP} / ${state.maxNpcHP}`;
    combatHUD.reset.hidden=state.playerHP>0&&state.npcHP>0;
    const meditation=state.role?.startsWith('meditate-');
    combatHUD.hint.textContent=!state.playerHP?'角色倒下 · 重置演练可再试'
      :meditation?(state.reversed?'正在结束打坐':'打坐中 · F 结束')
      :state.canMeditate?'打坐区 · F 开始'
      :state.npcPhase==='windup'?'傀儡准备出拳 · Ctrl + 方向闪避'
      :state.comboReady?'再次左键 · 接蓄力冲步拳'
      :state.feedback||`青色圆环为打坐区 · ${Math.round(state.zoneDistance)}m`;
  }
  function updateHUD(dt){
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)document.querySelector('#toast').hidden=true;}hudTime+=dt;if(hudTime<.2)return;hudTime=0;
    updateCombatHUD();
    const observer=flight.active?flight.position:motor.position;
    if(flight.active){
      for(const{marker}of markers)marker.visible=false;
      const selected=world.landmarks.find(l=>l.id===selectedLandmarkId);
      document.querySelector('#destination').textContent=selected?selected.title+' · '+Math.round(observer.distanceTo(selected.position))+'m':'自由飞行浏览城市 · F 返回角色';
      document.querySelector('#area').textContent=getDistrict(observer.x,observer.z,observer.y);
      document.querySelector('#roam-status').textContent='自由漫游 · 高度 '+Math.round(observer.y)+'m · '+Math.round(flight.speed)+'m/s';
      mapUI.update(observer,flight.yaw+Math.PI,seen,selectedLandmarkId);return;
    }
    let nearest,distance=Infinity;
    for(const{landmark:l,marker}of markers){
      const flat=Math.hypot(motor.position.x-l.position.x,motor.position.z-l.position.z),dy=Math.abs(motor.position.y-l.position.y),d=Math.hypot(flat,dy),arrived=flat<3.4&&dy<1.2;
      if(arrived){if(selectedLandmarkId===l.id)selectedLandmarkId=null;if(!seen.has(l.id)){seen.add(l.id);const toast=document.querySelector('#toast');toast.textContent='已抵达 · '+l.title;toast.hidden=false;toastTimer=3.2;console.info('[NYC] landmark',l.id);}}
      if(!seen.has(l.id)&&d<distance){nearest=l;distance=d;}marker.visible=(!seen.has(l.id)||selectedLandmarkId===l.id)&&d<25;
    }
    if(selectedLandmarkId){nearest=world.landmarks.find(l=>l.id===selectedLandmarkId);distance=nearest?motor.position.distanceTo(nearest.position):Infinity;}
    const upper=nearest&&nearest.position.y-motor.position.y>2;
    document.querySelector('#destination').textContent=nearest?nearest.title+' · '+Math.round(distance)+'m'+(upper?' · 由楼梯上行':''):'所有地标已走访，自由漫游';document.querySelector('#progress').textContent=seen.size+' / '+markers.length;
    document.querySelector('#area').textContent=getDistrict(motor.position.x,motor.position.z,motor.position.y);
    const showQuest=realm.tracking&&(!selectedLandmarkId||selectedLandmarkId===realmSite.id);
    if(showQuest){
      const near=realm.atTarget(motor.position);
      document.querySelector('#destination').textContent=near?'已到旧交易所 · 打开系统签到':'签到 · 旧交易所夜市 · '+Math.ceil(motor.position.distanceTo(realmSite.position))+'m';
      const pin=markers.find(m=>m.landmark===realmSite);if(pin)pin.marker.visible=motor.position.distanceTo(realmSite.position)<35;
    }
    mapUI.update(motor.position,avatar.group.rotation.y,seen,showQuest?realmSite.id:selectedLandmarkId);
  }
  document.querySelector('#load-detail').textContent='正在载入富尔顿七号信号楼…';
  function arrive(x,y,z,direction){
    motor.reset(direction+Math.PI);motor.position.set(x,y,z);avatar.group.position.copy(motor.position);
    yaw=direction;pitch=.08;zoom=4.1;positionCamera(0,true);inputs.clear();hudTime=1;
  }
  opening=await createHomeOpening(renderer,avatar,inputs,(view,dt,windowVisible)=>{
    elapsed+=dt;
    if(windowVisible){world.update(dt,elapsed,view);weather.update(dt,elapsed);}
    lightBudget.update(dt,view);lightRig.update(dt,elapsed,view.position);
  },firstExit=>{
    arrive(...fulton.landing,Math.PI/2);
    if(firstExit)selectedLandmarkId=school.learned?'hudson_pier':'east-school';
    updateHUD(0);
    renderer.domElement.focus({preventScroll:true});
  },sky.rift);
  function drawStreet(view=camera){
    // The low preset has no post effects. Draw into the antialiased canvas
    // directly so thin edges keep MSAA coverage during a pan.
    if(quality.value!=='low'){composer.render();return;}
    world.prepareStreetView(view,renderer.shadowMap.needsUpdate);
    try{renderer.render(scene,view);}finally{world.finishStreetView();}
  }
  const buildingAction=document.querySelector('#building-action'),liftOverlay=document.querySelector('#lift-ride');
  const school=createSchoolAwakening(scene,world.landmarks,id=>{selectedLandmarkId=id;hudTime=1;});
  function sense(){if(!paused&&!photo&&!flight.active&&!realm.active&&!opening.active&&!ride)school.sense(motor.position,seen);}
  school.button.onclick=sense;
  addEventListener('keydown',e=>{if(e.code==='KeyV'&&!e.repeat&&!e.ctrlKey&&!e.altKey&&!e.metaKey)sense();});
  function nearbyDoor(){
    if(paused||photo||flight.active||opening.active||ride||combat?.getState().role)return '';
    const p=motor.position,up=Math.abs(p.y-fulton.landing[1])<.35;
    if(school.needsAwakening(p))return 'awaken';
    if(up&&Math.hypot(p.x-fulton.landing[0],p.z-fulton.landing[2])<1.2)return 'enter';
    if((up||Math.abs(p.y-fulton.street[1])<.35)&&Math.hypot(p.x-fulton.liftX,p.z-fulton.liftZ)<1.35)return up?'down':'up';
    return '';
  }
  const doorLabels={awaken:'触碰观测线圈 · E',enter:'回到 3B 公寓',up:'乘电梯到三楼',down:'乘电梯到一楼'};
  function useBuilding(){
    const key=nearbyDoor();if(!key)return;
    buildingAction.hidden=true;inputs.clear();
    if(key==='awaken'){school.awaken(motor.position);return;}
    if(key==='enter'){opening.enter();return;}
    ride={up:key==='up'};
    lift.begin(ride.up,motor.position,camera,avatar.group.rotation.y);
    liftOverlay.textContent=ride.up?'三楼  ↑':'一楼  ↓';
    liftOverlay.hidden=false;combatPanel.hidden=true;document.body.classList.add('in-lift');
  }
  buildingAction.onclick=useBuilding;
  addEventListener('keydown',e=>{if(e.code==='KeyE'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&nearbyDoor()){e.preventDefault();useBuilding();}});
  document.querySelector('#replay-home').onclick=()=>{if(flight.active)setFlight(false);setPaused(false);combat?.reset();inputs.clear();opening.start();};
  function frame(t){
    requestAnimationFrame(frame);const dt=lastTime?Math.min((t-lastTime)/1000,.05):1/60;lastTime=t;if(document.hidden){frameProfile.last=0;return;}
    if(!paused)updateBloodRift(dt);
    if(!paused&&!realm.active&&!opening.active)school.update(dt);
    subjectBounce.setEnabled(!opening.active);
    subjectBounce.update(dt,motor.position);
    if(realm.active){
      inputs.clear();buildingAction.hidden=true;realm.update(dt);
      if(opening.active){opening.renderView(dt);return;}
      elapsed+=dt;world.update(dt,elapsed,camera,motor.position);lightBudget.update(dt,camera);renderer.info.reset();drawStreet();return;
    }
    if(opening.active){buildingAction.hidden=true;opening.render(dt);return;}
    if(ride){
      inputs.clear();elapsed+=dt;
      const finished=lift.step(dt,motor.position,camera,avatar);
      world.update(dt,elapsed,camera,motor.position);lightBudget.update(dt,camera);lightRig.update(dt,elapsed,motor.position);
      if(finished){
        arrive(fulton.liftX+1.05,ride.up?fulton.landing[1]:fulton.street[1],fulton.liftZ,-Math.PI/2);
        liftOverlay.hidden=true;combatPanel.hidden=!combat;ride=null;document.body.classList.remove('in-lift');renderer.domElement.focus({preventScroll:true});
      }
    }else if(!paused){elapsed+=dt;const impulse=inputs.consume();
      let state;
      if(flight.active){flight.update(dt,inputs.state,impulse);flight.applyCamera(camera);state=motor.update(dt,{moveX:0,moveZ:0},yaw);avatar.group.visible=true;}
      else{
        yaw-=impulse.lookX*.0038;pitch=T.MathUtils.clamp(pitch+impulse.lookY*.0032,-.65,.92);zoom=T.MathUtils.clamp(zoom+impulse.zoom*.004,2.7,10);
        const actionInput=photo?{}:impulse;
        if(actionInput.meditate)combat?.meditate();
        const movement=combat?combat.beforeMove(dt,inputs.state,actionInput,yaw):{...inputs.state,jump:actionInput.jump};
        state=motor.update(dt,movement,yaw);positionCamera(dt);
      }
      if(combat)state.heading=combat.update(dt,state,!flight.active&&!photo);
      avatar.group.position.copy(motor.position);avatar.update({...state,dt,attack:!flight.active && impulse.attack,verticalSpeed:motor.velocity.y});world.update?.(dt,elapsed,camera,motor.position);lightBudget.update(dt,camera);weather.update(dt,elapsed);wetReflection.update(elapsed);shadowFocus.copy(flight.active?flight.position:motor.position);shadowFocus.y=Math.min(shadowFocus.y,25);lightRig.update(dt,elapsed,shadowFocus);
      for(const{landmark:l,marker}of markers){marker.rotation.y+=dt*.9;marker.position.y=l.position.y+2.15+Math.sin(elapsed*1.8)*.07;}updateHUD(dt);
    }else inputs.clear();
    const atDoor=nearbyDoor();buildingAction.hidden=!atDoor;
    if(atDoor&&buildingAction.textContent!==doorLabels[atDoor])buildingAction.textContent=doorLabels[atDoor];
    frameNumber++;
    if(frameNumber%(quality.value==='low'?12:4)===0)renderer.shadowMap.needsUpdate=true;
    renderer.info.reset();drawStreet();
    if(!paused&&!frameProfile.reported){
      if(frameProfile.warm++>90&&frameProfile.last){const ms=t-frameProfile.last;frameProfile.count++;frameProfile.total+=ms;frameProfile.worst=Math.max(frameProfile.worst,ms);frameProfile.calls+=renderer.info.render.calls;frameProfile.triangles+=renderer.info.render.triangles;
        if(frameProfile.count===60){scene.userData.frameProfile={quality:quality.value,frames:60,averageMs:frameProfile.total/60,worstMs:frameProfile.worst,averageCalls:frameProfile.calls/60,averageTriangles:frameProfile.triangles/60,pointLights:{...lightBudget.stats}};console.info('[NYC] frame profile',JSON.stringify(scene.userData.frameProfile));frameProfile.reported=true;}}
      frameProfile.last=t;
    }else frameProfile.last=0;
  }
  const entry=new URLSearchParams(location.search);
  const streetEntries=new Map([
    ['school',[78,-86,-Math.PI/2,.045]],
    ['blood-sky',[-136,48,2.50,-.56]],
    ['boiler-market',[26.56,52.4,Math.PI,.04]],['produce-hall',[-55.5,8,Math.PI,.04]],
    ['repair-lane',[-17,-8.0,0,.04]],['tea-exchange',[49.28,-169.6,Math.PI,.04]],
    ['exchange',[0,-101,0,.10]],['core',[58,-173,0,.10]],
    ['core-window',[68.4,-279.5,.37,-.14]],['core-transfer',[40,-232,-.77,-.13]],
    ['night-market',[58.8,-182.4,1.01,-.025]],['ad-viaduct',[36.4,-218.4,-.87,-.10]],
    ['old-town',[-1,44,.3393,.035]],['freight',[-52,1.3,1.6877,-.009]],
    ['quay',[-126,-1,1.7274,-.026]],['greenway',[-76,-28.5,-1.555,.015,6.76]],
    ['old-exchange',[1,-111.8,.08246,-.025]],['soho',[1.8,74,-.34275,.018]],
    ['east-park',[131,29,.32366,.026]],['north-core',[42,-226,2.95624,-.11]]
  ]);
  const preview=entry.get('start')==='shuffle'
    ?sampleStreetEntry(world,Number(entry.get('seed')||crypto.getRandomValues(new Uint32Array(1))[0])>>>0)
    :streetEntries.get(entry.get('start'));
  const streetPreview=Boolean(preview)||(mobilePreview&&entry.get('start')==='street');
  if(preview){
    const [x,z,heading,tilt,floorHint=1]=preview;
    yaw=heading;pitch=tilt;
    motor.reset(heading+Math.PI);
    motor.position.set(x,world.ground(x,z,floorHint),z);
    avatar.group.position.copy(motor.position);
  }
  resize();lighting();subjectBounce.update(0,motor.position);positionCamera(0,true);lightBudget.update(0,camera,true);hudTime=1;updateHUD(0);
  renderer.shadowMap.needsUpdate=true;
  if(quality.value==='low'&&entry.get('intro')!=='relay'&&(streetPreview||opening.completed())){
    // Upload street geometry and link its actual canvas programs before the
    // first drag. A small viewport avoids shading four full-size images.
    document.querySelector('#load-detail').textContent='正在准备街口四周的画面…';
    const warm=camera.clone(),up=new T.Vector3(0,1,0),viewport=renderer.getViewport(new T.Vector4());
    try{
      for(let i=0;i<4;i++){
        await new Promise(resolve=>requestAnimationFrame(resolve));
        renderer.setViewport(0,0,64,36);
        warm.quaternion.copy(camera.quaternion);warm.rotateOnWorldAxis(up,i*Math.PI/2);
        drawStreet(warm);
      }
    }finally{renderer.setViewport(viewport);}
  }
  renderer.info.reset();drawStreet();document.querySelector('#loading').hidden=true;
  if(entry.get('intro')==='relay'||(!opening.completed()&&!streetPreview))opening.start();
  const{meshes,...counts}=world.stats;
  console.info('[NYC] ready',JSON.stringify({scene:counts,spawn:motor.position.toArray(),camera:camera.position.toArray(),avatar:avatar.group.userData.avatar}));
  // This opt-in snapshot reports simulation state, independent of the DOM.
  if(new URLSearchParams(location.search).has('qa'))globalThis.__NYC_QA__={opening,scene,world,motor,camera,inputs,renderer,flight,getState:()=>({position:motor.position.toArray(),camera:camera.position.toArray(),grounded:motor.grounded,motion:avatar.group.userData.motion,combat:combat?.getState(),paused,freeFlight:flight.active,yaw,pitch,cameraDistance,seen:[...seen],calls:renderer.info.render.calls,triangles:renderer.info.render.triangles})};
  requestAnimationFrame(frame);
}
start().catch(error=>{console.error(error);document.querySelector('#load-detail').textContent='街区暂时未能载入，请刷新后重试。';});

