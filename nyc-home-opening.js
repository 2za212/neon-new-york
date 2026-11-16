import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {fulton} from './nyc-fulton-house.js';

export async function createHomeOpening(renderer, avatar, inputs, renderCity, leave) {
  const root=document.getElementById('home-opening'), action=root.querySelector('.home-action');
  const page=root.querySelector('.home-paper'), next=page.querySelector('button');
  const title=page.querySelector('h2'), copy=page.querySelector('p'), caption=root.querySelector('.home-caption');
  const lids=root.querySelector('.wake-lids'),upperLid=lids.querySelector('.wake-upper'),lowerLid=lids.querySelector('.wake-lower');
  const city=avatar.group.parent,scene=new T.Group(),camera=new T.PerspectiveCamera(54,1,.035,450);
  const cityCamera=camera.clone();
  scene.name='Fulton House / apartment 3B';scene.position.set(...fulton.origin);
  scene.rotation.y=fulton.rotation;city.add(scene);
  const {scene:home}=await new GLTFLoader().loadAsync('./relay-home.glb');
  home.updateMatrixWorld(true);
  home.traverse(node=>{
    if(!node.isMesh)return;
    const baked=mat=>new T.MeshBasicMaterial({color:mat.emissive,map:mat.emissiveMap,side:mat.side,toneMapped:false});
    node.material=Array.isArray(node.material)?node.material.map(baked):baked(node.material);
  });
  const socket=name=>home.getObjectByName(name).getWorldPosition(new T.Vector3());
  const pillow=socket('BedEyes'),landing=socket('BedLanding');
  const calendar=socket('CalendarRead'),hint=socket('CalendarHint'),door=socket('HomeExit');
  // Sockets and indoor collisions use the original metre grid. Only the
  // apartment root transforms them into their position on Market Avenue.
  scene.add(home);scene.updateMatrixWorld(true);
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
    ['七码头的旧泵房','封港以后，我替泵房的值班员整理过遗物。他的本子上画着一截铜筛管，旁边写着：「断电六小时，管内仍有潮声。」等我找到那扇门，泵井已经灌了混凝土。今天，夜班还在。','记下去处']];
  let phase='off',age=0,index=0,yaw=0,heading=Math.PI;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const wakeSeconds=3.4;
  const position=new T.Vector3(),focus=new T.Vector3(),eye=new T.Vector3(),aim=new T.Vector3();
  const body=avatar.group, key='nyc-fulton-opening-v2';
  let visiting=false;
  const hips=body.getObjectByName('hips'),bones=[];
  const upperMeshes=[];
  body.traverse(object=>{
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
  const contacts=['left','right'].map(side=>{
    const shade=new T.Mesh(new T.PlaneGeometry(.36,.24),new T.MeshBasicMaterial({map:imprint,transparent:true,depthWrite:false}));
    shade.rotation.x=-Math.PI/2;shade.visible=false;scene.add(shade);
    return {ankle:body.getObjectByName(side+'_ankle'),shade};
  });
  // x, z, width, depth, bottom and top in the Y-up game world.
  const obstacles=[
    [-3.65,.38,2.0,2.74,0,.70],[-4.23,1.81,1,.14,0,2.55],[-3.76,-.91,1.65,.14,0,1.91],
    [-4.39,2.73,.85,1.42,0,2.23],[-2.69,3.90,2.98,.76,0,1.70],
    [-.46,.28,2.04,.95,0,1.04],[-.28,1.24,.48,.38,0,.67],
    [-2.74,-3.55,2.32,.80,0,.97],[-.75,-3.89,1.23,.38,0,.9],
    [.78,-3.28,1.02,.82,0,2.51],[3.28,-3.70,2.77,.88,0,1.11],
    [1.48,-1.20,.35,.35,0,2.25],[4.62,-1.20,.35,.35,0,2.25],
    [1.48,-3.94,.35,.35,0,2.25],[2.78,-3.71,2.54,.68,2.54,3.72]
  ];
  const cameraStops=obstacles.map(([x,z,w,d,low,high])=>new T.Box3(
    new T.Vector3(x-w/2-.05,low-.04,z-d/2-.05),new T.Vector3(x+w/2+.05,high+.08,z+d/2+.05)));
  cameraStops.push(new T.Box3(new T.Vector3(-4.73,2.54,-1.18),new T.Vector3(-3.05,2.91,1.89)),
    new T.Box3(new T.Vector3(1.32,2.04,-4.2),new T.Vector3(4.76,2.57,-1.03)));
  const cameraRay=new T.Ray(),hit=new T.Vector3();
  function support(x,z,current){
    if(x>=3.24&&x<=4.32&&z<=2.465&&z>=-1.09)
      return Math.min(2.55,.21*(1+Math.floor((2.465-z)/.29)));
    if(current>2.16&&x>=1.55&&z<=-1.03)return 2.56;
    return 0;
  }
  function free(x,z,y){
    if(x<=-4.43||x>=4.43||z<=-3.94||z>=4.07||Math.abs(support(x,z,y)-y)>.30)return false;
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
    question.visible=to==='calendar';caption.hidden=to==='calendar'||to==='wake';
  }
  function walking(){return phase==='calendar'||phase==='door'||phase==='visit';}
  function start(){
    visiting=false;
    inputs.clear();scene.add(body);body.visible=false;heading=Math.PI;yaw=walkingYaw;doorPath=[];
    for(const mesh of upperMeshes)mesh.visible=false;
    index=0;root.hidden=false;action.hidden=true;page.hidden=true;change('wake');
    drawLids(0,0);lids.style.opacity='1';document.body.classList.add('in-home');root.focus();
    caption.textContent='SoHo · 富尔顿七号公寓 · 3B';
  }
  function enter(){
    visiting=true;inputs.clear();scene.add(body);body.visible=true;
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
    try{localStorage.setItem(key,'done')}catch{}
    change('off');root.hidden=true;document.body.classList.remove('in-home');city.add(body);body.rotation.set(0,heading,0);body.scale.setScalar(1);leave(!visiting);
  }
  function interact(){
    if(phase==='bed'){change('rise');action.hidden=true;root.focus();return;}
    if(!walking())return;
    if(visiting){if(position.distanceTo(door)<=.82)exit();else if(position.distanceTo(calendar)<=.82){index=0;showPage();}return;}
    if(position.distanceTo(phase==='door'?door:calendar)>.82){
      if(phase==='door')doorPath=findDoorPath();
      return;
    }
    if(phase==='calendar')showPage();else exit();
  }
  action.onclick=interact;
  next.onclick=()=>{if(++index<text.length){showPage();return;}page.hidden=true;change(visiting?'visit':'door');action.hidden=true;root.focus();caption.textContent='富尔顿七号公寓 · 三楼东侧公共走廊';};
  window.addEventListener('keydown',e=>{
    if(phase==='off')return;
    if(walking()&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].includes(e.code))return;
    if(e.code==='KeyE'&&!e.repeat){e.preventDefault();interact();}
    if(e.key==='Tab'){e.preventDefault();(phase==='read'?next:action).focus();}
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
  function render(dt){
    age+=dt;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    if(['wake','bed','rise'].includes(phase)){
      const rising=phase==='rise';
      const sit=rising?smooth(age,0,1.38):0,stand=rising?smooth(age,3.58,4.72):0;
      const lookDown=rising?smooth(age,.64,1.85)*(1-smooth(age,3.62,4.76)):0;
      const lower=rising?smooth(age,1.93,2.62):0;
      const legAngle=1.16*sit*(1-stand);
      const plantedShin=.51*sit*(1-stand);
      const swing=plantedShin+.54*sit*(1-lower);
      // Pivot around the pelvis, keeping the head on the pillow when supine.
      const tilt=-(1-sit)*Math.PI/2,facing=sit*Math.PI/2;
      body.rotation.order='YXZ';body.rotation.set(tilt,facing,0);
      for(const o of bones){o.quaternion.identity();
        if(o.name.endsWith('_hip'))o.rotation.x=-legAngle;
        if(o.name.endsWith('_knee'))o.rotation.x=legAngle-swing;
        if(o.name.endsWith('_ankle'))o.rotation.x=swing;}
      hips.position.set(0,.91,0);
      // Both feet land slightly ahead of the knees. Solve pelvis travel from
      // both leg segments so the planted soles stay fixed during the rise.
      const hipTravel=.39*(Math.sin(1.16)-Math.sin(legAngle))+.40*(Math.sin(.51)-Math.sin(plantedShin));
      const seatX=landing.x-.39*Math.sin(1.16)-.40*Math.sin(.51);
      position.set(T.MathUtils.lerp(pillow.x,seatX,sit)+sit*hipTravel,0,landing.z);
      body.position.set(0,.91,0).applyQuaternion(body.quaternion).multiplyScalar(-1);
      const pelvisY=T.MathUtils.lerp(.78,.14+.40*Math.cos(plantedShin)+.39*Math.cos(legAngle),sit);
      body.position.add(position);body.position.y+=pelvisY;
      body.visible=rising && age>.60;
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
          drawLids(0,0);lids.style.opacity=String(1-smooth(age,0,.22));
        }else{
          drawLids(lidOpening(age),lidOpening(age-.075));lids.style.opacity='1';
          glance=.85*smooth(t,.04,.32)-.10*smooth(t,.34,.50)+.25*smooth(t,.51,.95);
        }
        const defocus=reducedMotion.matches ? 0 : 1-smooth(t,.66,.98);
        renderer.domElement.style.filter=defocus>0 ? `blur(${(1.30*defocus).toFixed(3)}vmin) brightness(${(1-.19*defocus).toFixed(3)})` : '';
      }
      aim.set(eye.x+.93-.33*stand,eye.y+(.88-.79*glance)*(1-sit)-.40*sit+.35*stand,
        eye.z+.37-.50*sit-.68*stand);
      if(lookDown>0){
        const pitch=T.MathUtils.lerp(Math.atan2(aim.y-eye.y,Math.hypot(aim.x-eye.x,aim.z-eye.z)),-1.18,lookDown);
        const turn=T.MathUtils.lerp(Math.atan2(aim.x-eye.x,eye.z-aim.z),1.54,lookDown);
        aim.set(eye.x+Math.cos(pitch)*Math.sin(turn),eye.y+Math.sin(pitch),eye.z-Math.cos(pitch)*Math.cos(turn));
      }
      camera.position.copy(eye);camera.lookAt(aim);
      if(phase==='wake' && age >= (reducedMotion.matches ? .30 : wakeSeconds)){
        change('bed');action.hidden=false;action.textContent='坐起，下床';action.focus();
      }
      if(phase==='rise'&&age>=5.04){
        handoffDirection.copy(aim).sub(eye).normalize();
        body.visible=false;
        for(const mesh of upperMeshes)mesh.visible=true;
        for(const {shade} of contacts)shade.visible=false;
        body.rotation.set(0,Math.PI/2,0);heading=Math.atan2(calendar.x-position.x,calendar.z-position.z);
        change('pullback');
      }
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
        change('calendar');inputs.clear();root.focus();action.hidden=true;
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
      const distance=Math.min(3.15,wallDistance(position.x,sx,-4.5,4.5),wallDistance(position.z,sz,-3.99,4.11));
      eye.set(T.MathUtils.clamp(position.x+sx*distance+.82*sz,-4.5,4.5),position.y+1.94,
        T.MathUtils.clamp(position.z+sz*distance-.82*sx,-3.99,4.11));
      camera.position.lerp(eye,1-Math.exp(-dt*9));
      cameraRay.origin.set(position.x,position.y+1.27,position.z);
      cameraRay.direction.copy(camera.position).sub(cameraRay.origin).normalize();
      for(const box of cameraStops){
        if(cameraRay.intersectBox(box,hit) && hit.distanceToSquared(cameraRay.origin)<camera.position.distanceToSquared(cameraRay.origin))
          camera.position.copy(hit).addScaledVector(cameraRay.direction,-.04);
      }
      camera.lookAt(focus);
    }
    cityCamera.projectionMatrix.copy(camera.projectionMatrix);
    cityCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    cityCamera.position.copy(camera.position).applyMatrix4(scene.matrixWorld);
    cityCamera.quaternion.copy(scene.quaternion).multiply(camera.quaternion);
    renderCity(cityCamera,dt);
  }
  function completed(){try{return localStorage.getItem(key)==='done'}catch{return false}}
  return {start,enter,render,completed,get active(){return phase!=='off'},
    getState:()=>({phase,position:position.toArray(),yaw,calendar:calendar.toArray(),door:door.toArray(),hintVisible:question.visible})};
}

