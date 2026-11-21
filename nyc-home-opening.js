import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {fulton} from './nyc-fulton-house.js';
import {createHomeWindow} from './nyc-home-window.js';
import {cameraClearance} from './nyc-motor.js';
import {voxelBay,finishVoxelBays} from './nyc-fulton-modules.js';
import {applyBlockFinish} from './nyc-block-finish.js';
import {cutRoomMesh} from './nyc-room-courses.js';
import {createUEBedPose} from './nyc-home-bed-pose.js';
import {extractHomeDoor} from './nyc-home-door.js';
import {fitApartmentRadio} from './nyc-home-rail-radio.js';
import {fitRoomJoinery} from './nyc-home-joinery.js';
import {reflectionGrid} from './nyc-voxel-reflections.js';

export async function createHomeOpening(renderer, avatar, inputs, renderCity, leave, rift, rays, maxDimension) {
  const root=document.getElementById('home-opening'), action=root.querySelector('.home-action');
  const rest=root.querySelector('.home-rest');
  const page=root.querySelector('.home-paper'), next=page.querySelector('button');
  const title=page.querySelector('h2'), copy=page.querySelector('p'), caption=root.querySelector('.home-caption');
  const lids=root.querySelector('.wake-lids'),upperLid=lids.querySelector('.wake-upper'),lowerLid=lids.querySelector('.wake-lower');
  const city=avatar.group.parent,scene=new T.Group(),camera=new T.PerspectiveCamera(54,1,.085,450);
  const cityCamera=camera.clone();
  scene.name='Fulton House / apartment 3B';scene.position.set(...fulton.origin);
  scene.rotation.y=fulton.rotation;city.add(scene);
  const {scene:home}=await new GLTFLoader().loadAsync('./relay-home.glb');
  home.updateMatrixWorld(true);
  const slidingDoor=extractHomeDoor(home);
  const finishAtlases=new Map();
  const deckMaterials=new Set();
  const trainLight={value:new T.Vector2()};
  scene.updateWorldMatrix(true,false);
  const roomFromWorld={value:scene.matrixWorld.clone().invert()};
  home.traverse(node=>{
    const mat=node.material;
    if(mat?.emissiveMap){
      mat.emissiveMap.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      finishAtlases.set(node.parent,mat.emissiveMap);
    }
  });
  home.traverse(node=>{
    if(!node.isMesh)return;
    const sourceName=node.material?.name||'';
    const family=/Print_/.test(sourceName)?null:/Deck/.test(sourceName)?'setts':/Shell/.test(sourceName)?'clay':'interior';
    const structuralWall=/StationShell/.test(node.parent?.name)||/StationShell/.test(node.name);
    if(family)node.geometry=cutRoomMesh(node.geometry,family,structuralWall);
    const track=node.geometry.getAttribute('uv1');
    if(track)node.geometry.setAttribute('railVisibility',track);
    const baked=mat=>{
      const solid=mat.name==='RelaySolidFinish';
      const options=solid?{vertexColors:true,map:finishAtlases.get(node.parent)}:
        {color:mat.emissive,map:mat.emissiveMap,vertexColors:Boolean(node.geometry.attributes.color)};
      const finish=new T.MeshBasicMaterial({...options,side:mat.side,toneMapped:false});
      if(!solid&&!track){if(family)applyBlockFinish(finish,family);return finish;}
      finish.customProgramCacheKey=()=>`relay-room-${solid}-${Boolean(track)}`;
      finish.onBeforeCompile=shader=>{
        if(solid){
          shader.uniforms.uBloodRift=rift;
          shader.uniforms.roomFromWorld=roomFromWorld;
          shader.vertexShader='uniform mat4 roomFromWorld; varying vec3 vFeederOffset;\n'+shader.vertexShader;
          shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
            vFeederOffset=(roomFromWorld*modelMatrix*vec4(transformed,1.)).xyz-vec3(4.16,3.79,1.96);`);
          shader.fragmentShader='uniform vec3 uBloodRift; varying vec3 vFeederOffset;\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
            vec3 feederRange=vFeederOffset*vec3(.74,.91,.70);
            float windowSpill=1./(1.+.22*max(0.,vFeederOffset.z+1.96+3.84));
            outgoingLight+=uBloodRift.y*smoothstep(.2,1.4,uBloodRift.x)*windowSpill*
              vec3(.16,.0015,.007)*(.08+sqrt(max(diffuseColor.rgb,vec3(0.))));
            float spill=1./(1.+dot(feederRange,feederRange));
            outgoingLight+=vec3(.013,.145,.155)*spill*spill*(.12+sqrt(max(diffuseColor.rgb,vec3(0.))));
            #include <opaque_fragment>`);
        }
        if(solid&&finish.map)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
          'diffuseColor.rgb = mix(vColor.rgb, diffuseColor.rgb, 0.26);');
        if(!track)return;
        shader.uniforms.trainLight=trainLight;
        shader.vertexShader='attribute vec2 railVisibility; varying vec2 vRail;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRail=railVisibility;');
        shader.fragmentShader='uniform vec2 trainLight; varying vec2 vRail;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
          'outgoingLight += vec3(0.018,0.16,0.42)*dot(vRail,trainLight);\n#include <opaque_fragment>');
      };
      if(family)applyBlockFinish(finish,family);
      return finish;
    };
    node.material=Array.isArray(node.material)?node.material.map(baked):baked(node.material);
    if(/Deck/.test(sourceName)||/Deck/.test(node.parent?.name)){
      for(const mat of [].concat(node.material))deckMaterials.add(mat);
    }
  });
  slidingDoor?.mountReveal(scene);
  const socket=name=>home.getObjectByName(name).getWorldPosition(new T.Vector3());
  const pillow=socket('BedEyes'),landing=socket('BedLanding');
  const calendar=socket('CalendarRead'),hint=socket('CalendarHint'),door=socket('HomeExit');
  // Sockets and indoor collisions use the original metre grid. Only the
  // apartment root transforms them into their position on Market Avenue.
  // A cast-enamel receiver face in the existing desk footprint; the matching
  // pair at the back fits the listening bench on either side of the turntable.
  voxelBay(scene,'receiver',[.80,.56,1.61],0,1.95,.88,.11);
  fitRoomJoinery(scene);
  voxelBay(scene,'dial',[-2.67,1.63,-3.83],0,.59,.74,.40);
  for(const dx of [-.79,.79])voxelBay(scene,'receiver',[.65+dx,.60,5.89],Math.PI,.76,.88,.13);
  finishVoxelBays(scene,true);
  const updateRailRadio=fitApartmentRadio(scene,trainLight);
  scene.add(home);scene.updateMatrixWorld(true);
  // The architecture already carries its light in the atlas. These short-range
  // sources let the moving character pick up the window rim and bench lamp.
  const practicals=new T.Group();
  const windowRim=new T.PointLight('#70bdff',8.5,4.4);
  windowRim.position.set(-2.45,2.48,-3.18);
  const deskLamp=new T.PointLight('#ffad57',10.8,3.3);
  deskLamp.position.set(.94,2.20,1.29);
  practicals.add(windowRim,deskLamp);
  practicals.visible=false;
  scene.add(practicals);
  const walkingYaw=-.58;
  // A hollow-backed, stepped glyph in world space. Walls and the player
  // occlude it naturally, and its alpha leaves the brick visible through it.
  function glyphShape(points){
    const shape=new T.Shape();
    points.forEach(([x,y],i)=>i?shape.lineTo(x*.064,y*.064):shape.moveTo(x*.064,y*.064));
    shape.closePath();return shape;
  }
  const question=new T.Mesh(new T.ExtrudeGeometry([
    glyphShape([[-2,2],[-2,3.4],[-1.4,3.4],[-1.4,4],[1.4,4],[1.4,3.4],[2,3.4],[2,1.5],[1.4,1.5],[1.4,.7],[.4,.7],[.4,-1],[-.6,-1],[-.6,1.6],[.4,1.6],[.4,2.2],[1,2.2],[1,3],[-1,3],[-1,2]]),
    glyphShape([[-.65,-3],[.45,-3],[.45,-1.9],[-.65,-1.9]])
  ],{depth:.04,bevelEnabled:false}),new T.MeshBasicMaterial({color:'#c7f2e4',transparent:true,opacity:.70,depthWrite:false}));
  // Hang below the illuminated route diagram, in front of the cabinet face.
  hint.y-=.22;hint.z+=.18;
  question.scale.setScalar(.82);question.position.copy(hint);question.visible=false;scene.add(question);
  const text=[
    ['三月十二日','日历右下角压着房东的便条：「十二号试泵，水发红也别拧热水。」我记得那次试泵。隔着两条街的洗衣店，水还是清的。灵气已经渗进来了，只到这一片。','翻过便条'],
    ['四月十二日','上一次，四月十二日凌晨，我在疏散名单上签过自己的名字。那天以后，连隔着海的人也看见了同一片天。我活过后来的那些年。眼前这页日历，比那张名单早整整一个月。','想起一个地方'],
    ['七码头的旧泵房','封港以后，我替泵房的值班员整理过遗物。他的本子上画着一截铜筛管，旁边写着：「断电六小时，管内仍有潮声。」等我找到那扇门，泵井已经灌了混凝土。今天，夜班还在。','翻看附图'],
    ['东衡中学的记录','本子里夹着一张学生画的曲线，横轴是一节晚自习。东衡中学物理社在球场上也测到了同样的间隔，足足比泵房早了两个钟头。先去学校。今晚的原始读数，还来得及亲手记下来。','记下学校的位置']];
  let phase='off',age=0,index=0,yaw=0,heading=Math.PI;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const wakeSeconds=3.4,riseSeconds=5.04;
  const position=new T.Vector3(),focus=new T.Vector3(),eye=new T.Vector3(),aim=new T.Vector3();
  const body=avatar.group, key='nyc-fulton-opening-v2';
  let visiting=false,resumeAfterBed='calendar';
  const returnEye=new T.Vector3(),returnAim=new T.Vector3(),returnPosition=new T.Vector3();
  const legFocus=new T.Vector3();
  const doorEye=new T.Vector3(),doorAim=new T.Vector3(),doorStep=new T.Vector3();
  const doorStart=new T.Vector3();
  const hips=body.getObjectByName('hips'),bones=[];
  const ankles=['left','right'].map(side=>body.getObjectByName(side+'_ankle'));
  // The first-person bed pose is authored for the original character's rig.
  // Other rigs stay hidden until the camera pulls back and locomotion takes over.
  const hasBedRig=Boolean(hips?.isBone&&ankles.every(ankle=>ankle?.isBone));
  const ueBed=hasBedRig?null:createUEBedPose(body);
  const upperMeshes=[];
  body.traverse(object=>{
    if(!hasBedRig)return;
    if(object.isBone)bones.push(object);
    if(!object.isMesh || !object.visible)return;
    let part=object;
    while(part!==body && !/^(left|right)_(boot|shin|thigh)(_|$)/.test(part.name))part=part.parent;
    if(part===body)upperMeshes.push(object);
  });
  // Contact shade follows the boot even while it swings towards the runner.
  const stamp=document.createElement('canvas');stamp.width=stamp.height=32;
  const brush=stamp.getContext('2d'),falloff=brush.createRadialGradient(16,16,3,16,16,16);
  falloff.addColorStop(0,'rgba(35,25,22,.58)');falloff.addColorStop(1,'rgba(35,25,22,0)');
  brush.fillStyle=falloff;brush.fillRect(0,0,32,32);
  const imprint=new T.CanvasTexture(stamp);imprint.colorSpace=T.SRGBColorSpace;
  const contacts=(hasBedRig?ankles:ueBed?.ankles??[]).map(ankle=>{
    const shade=new T.Mesh(new T.PlaneGeometry(.36,.24),new T.MeshBasicMaterial({map:imprint,transparent:true,depthWrite:false}));
    shade.rotation.x=-Math.PI/2;shade.visible=false;scene.add(shade);
    return {ankle,shade};
  });
  // x, z, width, depth, bottom and top in the Y-up game world.
  const obstacles=[
    [-3.65,.38,2.0,2.74,0,.70],[-4.23,1.81,1,.14,0,2.55],[-3.76,-.91,1.65,.14,0,1.91],
    [-4.40,-2.39,.60,1.92,.32,2.94],
    [-4.39,2.73,.85,1.42,0,2.23],[-2.69,3.90+fulton.rearExtension,2.98,.76,0,1.74],
    [.65,6.33,2.54,.93,0,1.08],[-.88,6.27,.50,.54,0,.86],
    [.80,1.16,2.12,.95,0,1.04],[1.02,1.97,.48,.38,0,.67],
    [-2.74,-3.55,2.32,.80,0,.97],[-.75,-3.89,1.23,.38,0,.9],
    [.78,-3.28,1.02,.82,0,2.51],[3.28,-3.70,2.77,.88,0,1.11],
    [1.48,-1.20,.35,.35,0,2.25],[4.62,-1.20,.35,.35,0,2.25],
    [1.48,-3.94,.35,.35,0,2.25],[2.78,-3.71,2.54,.68,2.54,3.72]
  ];
  const cameraStops=obstacles.map(([x,z,w,d,low,high])=>new T.Box3(
    new T.Vector3(x-w/2-.05,low-.04,z-d/2-.05),new T.Vector3(x+w/2+.05,high+.08,z+d/2+.05)));
  cameraStops.push(new T.Box3(new T.Vector3(-4.73,2.54,-1.18),new T.Vector3(-3.05,2.91,1.89)),
    new T.Box3(new T.Vector3(1.32,2.04,-4.2),new T.Vector3(4.76,2.57,-1.03)));
  const rearWall=4.11+fulton.rearExtension;
  const realmStops=[...cameraStops,...[
    [-5.5,-5, -4.5, rearWall+1],[4.5,-5, 5.5,rearWall+1],
    [-5.5,-5,5.5,-3.99],[-5.5,rearWall,5.5,rearWall+1]
  ].map(([x0,z0,x1,z1])=>new T.Box3(new T.Vector3(x0,-1,z0),new T.Vector3(x1,8,z1)))];
  if(rays){
    const bounds=new T.Box3(new T.Vector3(-5.8,-1,-5),new T.Vector3(5.8,7,rearWall+1)).applyMatrix4(scene.matrixWorld);
    const grid=reflectionGrid(bounds,.15,maxDimension,rays);
    grid.blockers(realmStops.map(b=>b.clone().applyMatrix4(scene.matrixWorld)));
    const pane=scene.localToWorld(new T.Vector3(-1.75,2.5,-3.82));
    grid.box(pane.x,pane.y,pane.z,5.66,3.52,.1,windowRim.color,scene.rotation.y);
    const lamp=deskLamp.getWorldPosition(new T.Vector3());
    grid.box(lamp.x,lamp.y,lamp.z,.44,.22,.35,deskLamp.color);
    for(const mat of deckMaterials)grid.surface(mat,'.12');
  }
  const boomOrigin=new T.Vector3(),boomDirection=new T.Vector3();
  function stopAtFurniture(point){
    boomDirection.subVectors(point,boomOrigin);
    const length=boomDirection.length();
    const safe=cameraClearance(boomOrigin,point,cameraStops,.085);
    if(safe<length)point.copy(boomOrigin).addScaledVector(boomDirection,safe/length);
  }
  const renderWindow=createHomeWindow(renderer,city,scene,body);
  function support(x,z,current){
    if(x>=3.24&&x<=4.32&&z<=2.465&&z>=-1.09)
      return Math.min(2.55,.21*(1+Math.floor((2.465-z)/.29)));
    if(current>2.16&&x>=1.55&&z<=-1.03)return 2.56;
    return 0;
  }
  function free(x,z,y){
    if(x<=-4.43||x>=4.43||z<=-3.94||z>=4.07+fulton.rearExtension||Math.abs(support(x,z,y)-y)>.30)return false;
    return !obstacles.some(([cx,cz,w,d,lo,hi])=>y<hi-.08&&y+1.7>lo+.08&&
      Math.abs(x-cx)<w/2+.19&&Math.abs(z-cz)<d/2+.19);
  }
  let doorPath=[];
  function findDoorPath(){
    const nodes=[{x:position.x,z:position.z,y:position.y,parent:null}],seen=new Set();
    for(let i=0;i<nodes.length;i++){
      const n=nodes[i];
      if(Math.hypot(n.x-door.x,n.z-door.z)<.60 && n.y<.3){
        const path=[];
        for(let p=n;p.parent;p=p.parent)path.push(p);
        return path.reverse();
      }
      for(const [dx,dz] of [[0,.25],[.25,0],[-.25,0],[0,-.25]]){
        const x=n.x+dx,z=n.z+dz;
        if(!free(x,z,n.y))continue;
        const y=support(x,z,n.y),key=[Math.round(x*4),Math.round(z*4),Math.round(y*4)].join('/');
        if(!seen.has(key)){seen.add(key);nodes.push({x,z,y,parent:n});}
      }
    }
    return [];
  }
  function change(to){
    phase=to;age=0;root.dataset.phase=phase;document.body.classList.toggle('home-walk',walking());
    rest.hidden=true;
    lids.toggleAttribute('hidden',!['wake','lie','sleep'].includes(to));
    if(to!=='wake')renderer.domElement.style.filter='';
    practicals.visible=to!=='off';
    if(to==='off'){
      railTime=0;
      trainLight.value.set(0,0);
    }
    question.visible=to==='calendar';caption.hidden=to==='calendar'||to==='wake';
  }
  function walking(){return phase==='calendar'||phase==='door'||phase==='visit';}
  function nearBed(){return walking()&&position.distanceTo(landing)<=1.05;}
  function wakeUp(){
    drawLids(0,0);lids.style.opacity='1';action.hidden=true;
    change('wake');root.focus();
  }
  function lieDown(){
    if(!nearBed())return;
    resumeAfterBed=phase;inputs.clear();doorPath=[];
    returnPosition.copy(position);returnEye.copy(camera.position);
    camera.getWorldDirection(returnAim).add(returnEye);
    for(const mesh of upperMeshes)mesh.visible=false;
    action.hidden=true;drawLids(1,1);lids.style.opacity='1';
    change('lie');root.focus();
  }
  function start(){
    visiting=false;resumeAfterBed='calendar';ueBed?.end();
    slidingDoor?.setOpen(0);
    inputs.clear();scene.add(body);body.visible=false;heading=Math.PI;yaw=walkingYaw;doorPath=[];
    for(const mesh of upperMeshes)mesh.visible=false;
    index=0;root.hidden=false;page.hidden=true;
    document.body.classList.add('in-home');wakeUp();
    caption.textContent='SoHo · 富尔顿七号公寓 · 3B';
  }
  function enter(){
    visiting=true;inputs.clear();scene.add(body);body.visible=true;
    slidingDoor?.setOpen(0);
    for(const mesh of upperMeshes)mesh.visible=true;
    for(const {shade} of contacts)shade.visible=false;
    position.copy(door);position.x-=.35;heading=-Math.PI/2;yaw=1.05;
    doorPath=[];root.hidden=false;page.hidden=true;action.hidden=true;
    document.body.classList.add('in-home');change('visit');root.focus();
    caption.textContent='富尔顿七号公寓 · 3B';
    camera.position.set(position.x+1,1.8,position.z+.7);
  }
  function showPage(){inputs.clear();change('read');action.hidden=true;page.hidden=false;const [a,b,c]=text[index];title.textContent=a;copy.textContent=b;next.textContent=c;next.focus();}
  function exit(){
    ueBed?.end();
    slidingDoor?.setOpen(0);
    try{localStorage.setItem(key,'done')}catch{}
    change('off');root.hidden=true;document.body.classList.remove('in-home');city.add(body);body.rotation.set(0,heading,0);body.scale.setScalar(1);leave(!visiting);
  }
  function openDoor(){
    if(!slidingDoor){exit();return;}
    inputs.clear();action.hidden=true;doorPath=[];
    doorStart.copy(position);doorEye.copy(camera.position);
    camera.getWorldDirection(doorAim).add(doorEye);
    doorStep.set(door.x+.44,door.y,door.z);
    change('opening-door');root.focus();
  }
  function interact(){
    if(phase==='sleep'){wakeUp();return;}
    if(phase==='bed'){change('rise');action.hidden=true;root.focus();return;}
    if(!walking())return;
    if(visiting){if(position.distanceTo(door)<=.82)openDoor();else if(position.distanceTo(calendar)<=.82){index=0;showPage();}return;}
    if(position.distanceTo(phase==='door'?door:calendar)>.82){
      if(phase==='door')doorPath=findDoorPath();
      return;
    }
    if(phase==='calendar')showPage();else openDoor();
  }
  action.onclick=interact;
  rest.onclick=lieDown;
  next.onclick=()=>{if(++index<text.length){showPage();return;}page.hidden=true;change(visiting?'visit':'door');action.hidden=true;root.focus();caption.textContent='富尔顿七号公寓 · 三楼东侧公共走廊';};
  window.addEventListener('keydown',e=>{
    if(phase==='off')return;
    if(walking()&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].includes(e.code))return;
    if(e.code==='KeyE'&&!e.repeat){e.preventDefault();interact();}
    if(e.code==='KeyR'&&!e.repeat){e.preventDefault();lieDown();}
    if(e.key==='Tab'){
      e.preventDefault();
      const choices=phase==='read'?[next]:[action,rest].filter(button=>!button.hidden);
      if(choices.length){
        const current=choices.indexOf(document.activeElement);
        choices[(current+(e.shiftKey?-1:1)+choices.length)%choices.length].focus();
      }
    }
    else if(!['Enter',' '].includes(e.key))e.preventDefault();
    e.stopImmediatePropagation();
  },true);
  const smooth=(x,a,b)=>T.MathUtils.smoothstep(x,a,b);
  function lidOpening(seconds){
    const peek=.26*smooth(seconds,.14,.98)*(1-smooth(seconds,1.18,1.56));
    return peek+smooth(seconds,1.72,3.19);
  }
  function drawLids(left,right){
    // Both eyes share a continuous view of the same room. The lids are slightly
    // heavier at the bridge and temples during a blink and clear the frame together.
    const center=(left+right)*.5;
    const bridge=center*(.67+.33*center);
    const temple=v=>v*(.72+.28*v);
    function contour(closed,travel,outerY){
      const y=v=>(closed+travel*v).toFixed(2);
      const l=y(left),r=y(right),mid=y(bridge),lt=y(temple(left)),rt=y(temple(right));
      return `M-20 ${outerY}H220V${rt} C189 ${rt} 174 ${r} 149 ${r} S113 ${mid} 100 ${mid} S73 ${l} 51 ${l} S12 ${lt} -20 ${lt}Z`;
    }
    upperLid.setAttribute('d',contour(63,-78,-20));
    lowerLid.setAttribute('d',contour(54,61,120));
  }
  // Start at the standing eye, clear the right shoulder while looking
  // forwards, then ease behind the player. Distances are in metres.
  const pullback=new T.CatmullRomCurve3([
    new T.Vector3(.12,1.66,-.08),new T.Vector3(.64,1.72,-.24),
    new T.Vector3(.76,1.81,.53),new T.Vector3(.02,1.92,1.77),
    new T.Vector3(3.15*Math.sin(walkingYaw)+.82*Math.cos(walkingYaw),1.94,3.15*Math.cos(walkingYaw)-.82*Math.sin(walkingYaw))
  ]);
  const handoffDirection=new T.Vector3(),overShoulder=new T.Vector3();
  let railTime=0;
  function render(dt){
    age+=dt;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    railTime=(railTime+dt)%16;
    const pass=(t)=>T.MathUtils.smoothstep(t,0,2.1)*(1-T.MathUtils.smoothstep(t,2.2,5.1));
    if(reducedMotion.matches)trainLight.value.set(.2,.12);
    else trainLight.value.set(pass(railTime),pass(railTime-2.4));
    updateRailRadio();
    windowRim.intensity=6+8*trainLight.value.x+4*trainLight.value.y;
    if(['wake','bed','rise','lie','sleep'].includes(phase)){
      const rising=phase==='rise',lying=phase==='lie';
      const poseTime=rising?age:lying?Math.max(0,riseSeconds-age):0;
      const sit=smooth(poseTime,0,1.38),stand=smooth(poseTime,3.58,4.72);
      const lookDown=smooth(poseTime,.64,1.85)*(1-smooth(poseTime,3.62,4.76));
      const lower=smooth(poseTime,1.93,2.62);
      const legAngle=1.16*sit*(1-stand);
      const plantedShin=.51*sit*(1-stand);
      // Both feet land slightly ahead of the knees. Solve pelvis travel from
      // both leg segments so the planted soles stay fixed during the rise.
      const hipTravel=.39*(Math.sin(1.16)-Math.sin(legAngle))+.40*(Math.sin(.51)-Math.sin(plantedShin));
      const seatX=landing.x-.39*Math.sin(1.16)-.40*Math.sin(.51);
      position.set(T.MathUtils.lerp(pillow.x,seatX,sit)+sit*hipTravel,0,landing.z);
      // This rig has shorter legs. Sit closer to the edge so its boots clear the bed frame.
      if(ueBed)position.x+=.24*sit*(1-stand);
      const swing=plantedShin+.54*sit*(1-lower);
      if(hasBedRig||ueBed){
        // Pivot around the pelvis, keeping the head on the pillow when supine.
        const tilt=-(1-sit)*Math.PI/2,facing=sit*Math.PI/2;
        ueBed?.begin();
        const turn=lying?smooth(age,0,.6):1;
        if(lying)position.lerp(returnPosition,1-turn);
        body.rotation.order='YXZ';body.rotation.set(tilt,T.MathUtils.lerp(heading,facing,turn),0);
        const pelvisY=T.MathUtils.lerp(.78,.14+.40*Math.cos(plantedShin)+.39*Math.cos(legAngle),sit);
        if(ueBed){
          ueBed.apply(legAngle,swing,(1-stand)*turn);
          body.position.copy(ueBed.pivot).applyQuaternion(body.quaternion).negate().add(position);
          body.position.y+=T.MathUtils.lerp(pelvisY,ueBed.pivot.y,stand);
        }else{
          for(const o of bones){o.quaternion.identity();
            if(o.name.endsWith('_hip'))o.rotation.x=-legAngle;
            if(o.name.endsWith('_knee'))o.rotation.x=legAngle-swing;
            if(o.name.endsWith('_ankle'))o.rotation.x=swing;}
          hips.position.set(0,.91,0);
          body.position.set(0,.91,0).applyQuaternion(body.quaternion).negate().add(position);
          body.position.y+=pelvisY;
        }
      }else{
        body.position.copy(position);
      }
      body.visible=(rising||lying)&&(hasBedRig?poseTime>.60:Boolean(ueBed&&lookDown>.12));
      for(const {ankle,shade} of contacts){
        shade.visible=body.visible;
        if(!shade.visible)continue;
        ankle.getWorldPosition(shade.position);scene.worldToLocal(shade.position);
        const gap=Math.max(0,shade.position.y-.14);
        shade.material.opacity=Math.max(.14,1-3*gap);
        shade.position.y=.027;shade.position.x+=.04;
      }
      eye.set(position.x+.12*sit,T.MathUtils.lerp(pillow.y+.15,1.42,sit)+.24*stand,
        T.MathUtils.lerp(pillow.z,landing.z-.08,sit));
      let glance=1;
      if(phase==='wake'){
        const t=Math.min(age/wakeSeconds,1);
        if(reducedMotion.matches){
          drawLids(0,0);lids.style.opacity=String(1-smooth(age,.10,.48));
        }else{
          drawLids(lidOpening(age),lidOpening(age-.075));lids.style.opacity='1';
          glance=.85*smooth(t,.04,.32)-.10*smooth(t,.34,.50)+.25*smooth(t,.51,.95);
        }
        const defocus=reducedMotion.matches ? 0 : 1-smooth(t,.66,.98);
        renderer.domElement.style.filter=defocus>0 ? `blur(${(1.30*defocus).toFixed(3)}vmin) brightness(${(1-.19*defocus).toFixed(3)})` : '';
      }else if(lying)drawLids(1-smooth(age,riseSeconds-.72,riseSeconds),1-smooth(age,riseSeconds-.76,riseSeconds-.04));
      aim.set(eye.x+.93-.33*stand,eye.y+(.88-.79*glance)*(1-sit)-.40*sit+.35*stand,
        eye.z+.37-.50*sit-.68*stand);
      if(lookDown>0){
        const pitch=T.MathUtils.lerp(Math.atan2(aim.y-eye.y,Math.hypot(aim.x-eye.x,aim.z-eye.z)),-1.18,lookDown);
        const turn=T.MathUtils.lerp(Math.atan2(aim.x-eye.x,eye.z-aim.z),1.54,lookDown);
        aim.set(eye.x+Math.cos(pitch)*Math.sin(turn),eye.y+Math.sin(pitch),eye.z-Math.cos(pitch)*Math.cos(turn));
        if(ueBed&&body.visible){
          ueBed.legFocus(legFocus);
          scene.worldToLocal(legFocus);
          // Keep the original eye path while following the UE actor's boots.
          legFocus.sub(eye).normalize().add(eye);
          aim.lerp(legFocus,smooth(lookDown,.12,1)*.6);
        }
      }
      if(lying){
        const blend=smooth(age,0,.65);
        eye.lerp(returnEye,1-blend);aim.lerp(returnAim,1-blend);
      }
      ueBed?.showLegs(body.visible);
      camera.position.copy(eye);camera.lookAt(aim);
      if(phase==='wake' && age >= (reducedMotion.matches ? .52 : wakeSeconds)){
        change('bed');action.hidden=false;action.textContent='坐起，下床';action.focus();
      }
      if(lying&&age>=riseSeconds){
        drawLids(0,0);change('sleep');
        action.hidden=false;action.textContent='睁眼';action.focus();
      }
      if(rising&&age>=riseSeconds){
        handoffDirection.copy(aim).sub(eye).normalize();
        body.visible=false;
        ueBed?.end();
        if(ueBed)body.position.copy(position);
        for(const mesh of upperMeshes)mesh.visible=true;
        for(const {shade} of contacts)shade.visible=false;
        body.rotation.set(0,Math.PI/2,0);heading=Math.atan2(calendar.x-position.x,calendar.z-position.z);
        change('pullback');
      }
    }else if(phase==='opening-door'){
      const elapsed=reducedMotion.matches?age*1.8:age;
      slidingDoor.setOpen(smooth(elapsed,.22,.92));
      const step=smooth(elapsed,.92,1.52),turn=smooth(elapsed,0,.35);
      position.copy(doorStart).lerp(doorStep,step);body.position.copy(position);
      heading=Math.atan2(doorStep.x-doorStart.x,doorStep.z-doorStart.z);
      avatar.update({dt,speed:step>0&&step<1?1.7:0,grounded:true,sprinting:false,heading,verticalSpeed:0});
      eye.set(door.x-1.85,door.y+1.68,door.z+.63).lerp(doorEye,1-turn);
      aim.set(door.x+.56,door.y+1.14,door.z+.02).lerp(doorAim,1-turn);
      camera.position.copy(eye);camera.lookAt(aim);
      if(elapsed>=1.57)exit();
    }else if(phase==='pullback'){
      const t=smooth(age,0,1.48);
      pullback.getPoint(t,eye);eye.add(position);
      focus.copy(position);focus.x+=.18;focus.y=1.27;
      overShoulder.copy(focus).sub(eye).normalize();
      aim.copy(handoffDirection).lerp(overShoulder,smooth(t,.32,1)).normalize().add(eye);
      camera.position.copy(eye);camera.lookAt(aim);
      body.visible=t>=.23;
      avatar.update({dt,speed:0,grounded:true,heading:T.MathUtils.lerp(Math.PI/2,heading,t)});
      if(age>=1.48){
        change(resumeAfterBed);inputs.clear();root.focus();action.hidden=true;
      }
    }else{
      const target=phase==='door'?door:calendar;
      const impulse=inputs.consume();let dx=0,dz=0;
      if(walking()){
        yaw-=impulse.lookX*.0038;
        const x=inputs.state.moveX,z=inputs.state.moveZ;
        dx=x*Math.cos(yaw)-z*Math.sin(yaw);dz=-x*Math.sin(yaw)-z*Math.cos(yaw);
        if(x||z)doorPath=[];
        if(phase==='door'&&doorPath.length){
          let next=doorPath[0];
          if(Math.hypot(next.x-position.x,next.z-position.z)<.10){doorPath.shift();next=doorPath[0];}
          if(next){dx=next.x-position.x;dz=next.z-position.z;}
        }
        const length=Math.hypot(dx,dz);if(length){dx/=length;dz/=length;heading=Math.atan2(dx,dz);}
        const step=2.25*dt;
        if(free(position.x+dx*step,position.z,position.y))position.x+=dx*step;
        if(free(position.x,position.z+dz*step,position.y))position.z+=dz*step;
        position.y=support(position.x,position.z,position.y);
        rest.hidden=!nearBed();
        const near=position.distanceTo(target)<=.82;
        if(visiting){
          const atDoor=position.distanceTo(door)<=.82;
          action.hidden=!atDoor&&position.distanceTo(calendar)>.82;
          action.textContent=atDoor?'出门到三楼走廊':'查看日历';
        }else{
          action.hidden=phase==='calendar'&&!near;
          action.textContent=phase==='door'?(near?'出门到三楼走廊':'走向房门'):'查看日历';
        }
        if(question.visible)question.position.y=hint.y+(reducedMotion.matches?0:.024*Math.sin(age*2));
      }
      body.position.copy(position);
      avatar.update({dt,speed:Math.hypot(dx,dz)*2.25,grounded:true,sprinting:false,heading,attack:false,verticalSpeed:0});
      const sx=Math.sin(yaw),sz=Math.cos(yaw);
      focus.set(position.x+.18*sz,position.y+1.27,position.z-.18*sx);
      const wallDistance=(v,dir,min,max)=>Math.abs(dir)<.001?Infinity:((dir>0?max:min)-v)/dir;
      const rearLimit=4.11+fulton.rearExtension;
      const distance=Math.min(3.15,wallDistance(position.x,sx,-4.5,4.5),wallDistance(position.z,sz,-3.99,rearLimit));
      eye.set(T.MathUtils.clamp(position.x+sx*distance+.82*sz,-4.5,4.5),position.y+1.94,
        T.MathUtils.clamp(position.z+sz*distance-.82*sx,-3.99,rearLimit));
      boomOrigin.set(position.x,position.y+1.27,position.z);
      stopAtFurniture(eye);
      camera.position.lerp(eye,1-Math.exp(-dt*9));
      stopAtFurniture(camera.position);
      camera.lookAt(focus);
    }
    renderView(dt);
  }
  function renderView(dt){
    cityCamera.projectionMatrix.copy(camera.projectionMatrix);
    cityCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    cityCamera.position.copy(camera.position).applyMatrix4(scene.matrixWorld);
    cityCamera.quaternion.copy(scene.quaternion).multiply(camera.quaternion);
    renderWindow(camera,cityCamera,dt,renderCity);
  }
  function completed(){try{return localStorage.getItem(key)==='done'}catch{return false}}
  return {start,enter,render,renderView,completed,walking,
    realmContext:()=>({root:scene,camera,position,indoor:true,solids:()=>realmStops}),get active(){return phase!=='off'},
    getState:()=>({phase,position:position.toArray(),yaw,calendar:calendar.toArray(),door:door.toArray(),hintVisible:question.visible})};
}

