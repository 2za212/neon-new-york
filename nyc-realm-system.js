import * as T from 'three';
import {cameraClearance} from './nyc-motor.js';

import {createRealmSeal} from './nyc-realm-seal.js';
import {createLedgerLayers,width,height,actionRect,closeRect,navRect,itemRect} from './nyc-realm-ledger-art.js';

const saveKey='nyc.realms.exchange.v1';
const stages=['available','accepted','claimed'];


function loadLedger(){
  let stage=0,shards=0;
  try{
    const raw=localStorage.getItem(saveKey);
    if(stages.includes(raw)){
      stage=stages.indexOf(raw);shards=stage===2?1:0;
    }else if(raw){
      const saved=JSON.parse(raw);
      stage=Math.max(0,stages.indexOf(saved?.missions?.oldExchange));
      const count=saved?.inventory?.riftShard;
      shards=Number.isSafeInteger(count)&&count>=0?count:stage===2?1:0;
    }
  }catch{/* Unavailable or incomplete browser save. */}
  return {stage,shards};
}

export function createRealmSystem({avatar,inputs,landmark,context,canOpen,onTrack}){
  let {stage,shards}=loadLedger();
  let session=null,blend=0,closing=false,signature='';
  let justClaimed=false,settlementTime=1,sealTime=0;
  let page='mission';
  const panel=new T.Group();panel.name='诸天万界系统 / 界印';
  const ledger=createLedgerLayers(panel),seal=createRealmSeal();
  panel.add(seal.root);
  const launchers=[...document.querySelectorAll('.realm-launch')],dialog=document.querySelector('#realm-dialog');
  const primary=dialog.querySelector('.realm-action'),close=dialog.querySelector('.realm-close'),description=dialog.querySelector('p');
  const nav=dialog.querySelector('.realm-nav'),item=dialog.querySelector('.realm-item');
  const focus=new T.Vector3(),eye=new T.Vector3(),forward=new T.Vector3(),right=new T.Vector3(),look=new T.Vector3();
  const rotation=new T.Quaternion(),viewMatrix=new T.Matrix4(),projection=new T.Vector3(),worldPoint=new T.Vector3();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function distanceToTarget(pos){return landmark.position.distanceTo(pos);}
  function atTarget(pos){return Math.abs(pos.y-landmark.position.y)<1.2&&Math.hypot(pos.x-landmark.position.x,pos.z-landmark.position.z)<3.4;}
  function refresh(){
    const near=!session.indoor&&atTarget(session.position),distance=Math.ceil(distanceToTarget(session.position));
    const key=[page,stage,shards,near,distance,session.indoor,justClaimed].join('/');
    if(key===signature)return;
    const copy=ledger.paint(stage,near,distance,session.indoor,shards,justClaimed,page);
    primary.textContent=copy.action;nav.textContent=copy.nav;
    item.hidden=page!=='bag'||shards<1;
    description.textContent=copy.description;signature=key;
  }
  function syncLedger(){
    const saved=loadLedger();
    stage=Math.max(stage,saved.stage);shards=Math.max(shards,saved.shards);
  }
  function closePanel(){if(session){closing=true;inputs.clear();}}
  function showPage(next){
    if(!session||closing||blend<.98)return;
    page=next;justClaimed=false;settlementTime=next==='detail'?0:1;
    refresh();
    (page==='bag'&&!item.hidden?item:primary).focus({preventScroll:true});
  }
  function advance(){
    if(!session||closing||blend<.98||(justClaimed&&!reduced.matches&&settlementTime<.83))return;
    if(page==='detail'){showPage('bag');return;}
    if(page==='bag'){showPage('mission');return;}
    const previous=stage;syncLedger();
    if(previous!==stage){refresh();return;}
    if(stage===2){showPage('bag');return;}
    if(stage===1&&(session.indoor||!atTarget(session.position))){closePanel();return;}
    stage++;
    if(stage===2){shards++;justClaimed=true;settlementTime=0;}
    const saved={missions:{oldExchange:stages[stage]},inventory:{riftShard:shards}};
    try{localStorage.setItem(saveKey,JSON.stringify(saved));}catch{/* Storage unavailable: retain this run. */}
    onTrack(stage===1?landmark.id:null);refresh();
  }
  function open(){
    if(session||!canOpen())return;
    session=context();const {camera,root,indoor}=session;
    measureTouchScale();
    session.from=camera.position.clone();session.orientation=camera.quaternion.clone();session.heading=avatar.group.rotation.y;
    session.drawingDirection=session.heading;
    session.returnVisible=avatar.group.visible;avatar.group.visible=true;
    // Prefer the avatar's current facing. If the camera would be inside a
    // wall, choose the nearest clear shoulder and turn the actor with it.
    let best=-1;
    for(const delta of [0,.55,-.55,1.1,-1.1,1.65,-1.65,2.2,-2.2,Math.PI]){
      const h=session.heading+delta;basis(h);locate();
      const clearance=safeDistance();
      if(clearance>best){best=clearance;session.drawingDirection=h;}
      if(clearance>=focus.distanceTo(eye)-.03)break;
    }
    root.add(panel);panel.traverse(o=>o.layers.set(indoor?1:0));panel.visible=false;
    blend=0;sealTime=0;closing=false;justClaimed=false;page='mission';settlementTime=1;signature='';syncLedger();refresh();
    inputs.clear();dialog.hidden=false;document.body.classList.add('realm-open');dialog.focus({preventScroll:true});
  }
  function basis(h){forward.set(Math.sin(h),0,Math.cos(h));right.set(-forward.z,0,forward.x);}
  function locate(){
    const {position,camera}=session;
    const tan=Math.tan(T.MathUtils.degToRad(camera.fov*.5));
    focus.copy(position);focus.y+=1.36;
    eye.copy(focus).addScaledVector(forward,-2.18).addScaledVector(right,.48*2.18*tan*camera.aspect);
    eye.y+=.22;
  }
  function safeDistance(){return cameraClearance(focus,eye,session.solids(focus,eye),.15);}
  function measureTouchScale(){
    if(!session)return;
    const frame=window.frameElement;
    const scale=frame?.hasAttribute('data-nyc-simulator')?frame.getBoundingClientRect().width/innerWidth:1;
    session.minTap=44/Math.max(.1,Math.min(1,scale));
  }
  function projectControl(button,[x,y,w,h],layer){
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const px of [x,x+w])for(const py of [y,y+h]){
      projection.set(px/width-.5,.5-py/height,0);
      // Apartment camera and ledger share local room coordinates.
      projection.applyMatrix4(layer.matrix).applyMatrix4(panel.matrix).project(session.camera);
      const sx=(projection.x*.5+.5)*innerWidth,sy=(.5-projection.y*.5)*innerHeight;
      minX=Math.min(minX,sx);minY=Math.min(minY,sy);maxX=Math.max(maxX,sx);maxY=Math.max(maxY,sy);
    }
    // The mobile simulator scales a 1920px iframe down to the device.
    const minTap=session.minTap;
    const bw=Math.max(minTap,maxX-minX),bh=Math.max(minTap,maxY-minY);
    Object.assign(button.style,{width:bw+'px',height:bh+'px',left:((minX+maxX-bw)*.5)+'px',top:((minY+maxY-bh)*.5)+'px'});
  }
  function finish(){
    const state=session;
    state.root.remove(panel);state.camera.position.copy(state.from);state.camera.quaternion.copy(state.orientation);
    avatar.group.rotation.y=state.heading;avatar.group.visible=state.returnVisible;
    dialog.hidden=true;document.body.classList.remove('realm-open');session=null;inputs.clear();
    document.querySelector(state.indoor?'#home-opening':'#game').focus({preventScroll:true});
  }
  function update(dt){
    if(!session)return;
    const {camera,position,from,orientation,heading,drawingDirection}=session;
    if(session.indoor&&camera.aspect!==innerWidth/innerHeight){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
    blend=T.MathUtils.clamp(blend+(closing?-1:1)*dt/(reduced.matches ? .10 : closing ? .42 : 1.46),0,1);
    const t=T.MathUtils.smoothstep(blend,0,.54);
    basis(drawingDirection);locate();
    const rayLength=eye.distanceTo(focus);
    eye.lerp(focus,1-Math.min(1,safeDistance()/Math.max(.01,rayLength)));
    const depth=Math.max(.55,worldPoint.subVectors(eye,focus).dot(forward)*-1+.72);
    const halfHeight=depth*Math.tan(T.MathUtils.degToRad(camera.fov*.5)),halfWidth=halfHeight*camera.aspect;
    look.copy(eye).addScaledVector(forward,depth);look.y-=.12;
    // Cameras look down local -Z; the panel's front normal points back.
    rotation.setFromRotationMatrix(viewMatrix.lookAt(eye,look,camera.up));
    panel.position.copy(look).addScaledVector(right,halfWidth*.23);
    panel.quaternion.copy(rotation);panel.rotateY(-.20);
    const panelWidth=Math.min(halfWidth*1.16,halfHeight*1.47*width/height);
    panel.scale.set(panelWidth,panelWidth*height/width,1);
    panel.visible=blend>.015;
    sealTime+=dt;
    settlementTime=Math.min(1,settlementTime+dt);
    const ignition=T.MathUtils.smoothstep(blend,.015,.30);
    const rise=reduced.matches?1:T.MathUtils.smoothstep(settlementTime,0,.84);
    const unit=panelWidth*.009;
    seal.root.position.set(-.236,-.008,panelWidth*.074);
    seal.root.scale.set(.009,.009*width/height,unit);
    seal.update(sealTime,ignition,justClaimed||page==='detail',rise,reduced.matches,page==='detail');
    ledger.update(blend,settlementTime,justClaimed,panelWidth,reduced.matches);
    camera.position.lerpVectors(from,eye,t);camera.quaternion.slerpQuaternions(orientation,rotation,t);camera.updateMatrixWorld();
    panel.updateMatrix();
    const facing=Math.atan2(panel.position.x-position.x,panel.position.z-position.z);
    const turnToShoulder=Math.atan2(Math.sin(drawingDirection-heading),Math.cos(drawingDirection-heading));
    const turnToPanel=Math.atan2(Math.sin(facing-drawingDirection),Math.cos(facing-drawingDirection));
    avatar.update({dt,speed:0,grounded:true,heading:heading+(turnToShoulder+turnToPanel*.34)*t,verticalSpeed:0});
    primary.style.visibility=blend<.98||(justClaimed&&!reduced.matches&&settlementTime<.83)?'hidden':'visible';
    close.style.visibility=blend<.60?'hidden':'visible';
    nav.style.visibility=blend<.98?'hidden':'visible';
    projectControl(primary,actionRect,ledger.receipt);projectControl(close,closeRect,ledger.header);
    projectControl(nav,navRect,ledger.header);
    if(!item.hidden)projectControl(item,itemRect,ledger.entry);
    if(!closing&&blend===1&&document.activeElement===dialog)primary.focus({preventScroll:true});
    if(closing&&blend===0)finish();
  }
  launchers.forEach(b=>b.onclick=open);primary.onclick=advance;close.onclick=closePanel;
  window.addEventListener('resize',measureTouchScale);
  window.addEventListener('nyc-preview-resize',measureTouchScale);
  nav.onclick=()=>showPage(page==='mission'?'bag':'mission');
  item.onclick=()=>{if(page==='bag'&&shards>0)showPage('detail');};
  window.addEventListener('keydown',e=>{
    if(!session)return;
    if(e.key==='Escape'){e.preventDefault();closePanel();}
    else if(e.key==='Tab'){
      e.preventDefault();
      const controls=[nav,item,primary,close].filter(b=>!b.hidden&&b.style.visibility!=='hidden');
      const at=controls.indexOf(document.activeElement),step=e.shiftKey?-1:1;
      if(controls.length)controls[(at+step+controls.length)%controls.length].focus();
    }
    else if(!['Enter',' ','Shift'].includes(e.key))e.preventDefault();
    e.stopImmediatePropagation();
  },true);
  window.addEventListener('storage',e=>{if(e.key===saveKey){syncLedger();if(session)refresh();}});
  return {update,get active(){return !!session;},get tracking(){return stage===1;},atTarget};
}
