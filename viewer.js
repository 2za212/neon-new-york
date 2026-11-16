import {addCitySigns} from './city-signs.js';
import {addWetStreet} from './city-wet-street.js';
import {loadDenseVoxelCity} from './dense-voxel-city.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';

import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {loadVoxelModel} from './model-kit.js';





async function start(){
const scene=new T.Scene();scene.background=new T.Color('#4e6377');scene.fog=new T.FogExp2('#596b7c',.0015);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;
renderer.domElement.id='model';renderer.domElement.tabIndex=0;document.body.prepend(renderer.domElement);
const camera=new T.PerspectiveCamera(43,1,.12,900);camera.rotation.order='YXZ';
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=false;orbit.maxPolarAngle=Math.PI*.485;
orbit.minDistance=10;orbit.maxDistance=380;orbit.target.set(0,24,-5);
const hemi=new T.HemisphereLight(0xdce8f5,0x4d5764,2.1);scene.add(hemi);
const sun=new T.DirectionalLight(0xfff7ea,3.8);sun.position.set(-87,143,74);sun.target.position.set(0,15,-8);
sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-115,right:115,top:115,bottom:-115,near:1,far:380});
sun.shadow.bias=-.00013;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
const fill=new T.DirectionalLight(0xb5cce4,1.1);fill.position.set(65,55,-70);scene.add(fill);

const pmrem=new T.PMREMGenerator(renderer);
const environmentRoom=new RoomEnvironment();
const environmentTarget=pmrem.fromScene(environmentRoom,.04);
scene.environment=environmentTarget.texture;scene.environmentIntensity=.70;
environmentRoom.dispose();pmrem.dispose();
const baseModel=await loadVoxelModel(scene);
const denseCity=await loadDenseVoxelCity(scene,baseModel);
const model=denseCity.physics;
await addCitySigns(scene);
const wetStreet=addWetStreet(scene,renderer);
const modelInfo=baseModel.finish();
modelInfo.dense=denseCity.stats;
const studio=new T.Mesh(new T.PlaneGeometry(2200,2200),new T.MeshStandardMaterial({color:0x354555,roughness:1}));
studio.rotation.x=-Math.PI/2;studio.position.y=-3.3;studio.receiveShadow=true;scene.add(studio);

const target=new T.WebGLRenderTarget(1,1,{samples:4});
const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
const ao=new GTAOPass(scene,camera,1,1,undefined,{radius:3.4,thickness:2,distanceFallOff:1,samples:8},{radius:4,samples:8});
ao.blendIntensity=.31;composer.addPass(ao);
const bloom=new UnrealBloomPass(new T.Vector2(1,1),.32,.45,1.15);composer.addPass(bloom);composer.addPass(new OutputPass());
let dirty=true,mode='overview',yaw=0,pitch=0,flying=false,drag=null,lastTime=0;
const player=new T.Vector3(),keys=new Set(),eye=1.72;
let touchX=0,touchZ=0,joyPointer=null;
const ui={guide:document.querySelector('#guide'),where:document.querySelector('#where'),load:document.querySelector('#load')};
const lightingButton=document.querySelector('#lighting');
const ambientControl=document.querySelector('#ambient');
const wallStyleButton=document.querySelector('#wall-style');
wallStyleButton.onclick=()=>{
 const uniform=baseModel.material.userData.wallPixelStrength;
 uniform.value=uniform.value?0:1;
 wallStyleButton.textContent=uniform.value?'像素墙面：开':'像素墙面：关';
 wallStyleButton.setAttribute('aria-pressed',String(Boolean(uniform.value)));dirty=true;
};
let evening=true;
const neonLights=[];
for(const [color,x,y,z,power,reach] of [
 [0x22dcea,0,7.5,14,185,32],
 [0xf23ab8,15,5.5,5,125,23],
 [0x47cbdc,-15,5,21,100,21],
 [0x32bded,-22,35,-10,150,27],
 [0xf035aa,25,5.5,43,125,23],
 [0xffb75f,-25,3.7,44,58,21],
 [0x789bff,0,5,-15,105,25],
 [0xeeac58,0,3.8,52,62,16]
]){
 const lamp=new T.PointLight(color,power,reach,1.7);
 lamp.position.set(x,y,z);scene.add(lamp);neonLights.push([lamp,power]);
}
function lightCity(){
 scene.background.set(evening?'#15243b':'#4e6377');scene.fog.color.set(evening?'#293f58':'#596b7c');
 scene.fog.density=evening?(orbit.enabled?.002:.0038):.0015;
 const ambientLevel=Number(ambientControl.value);
 hemi.intensity=(evening?1.30:2.10)*ambientLevel;sun.intensity=evening?1.15:3.80;fill.intensity=(evening?.64:1.10)*ambientLevel;
 hemi.color.set(evening?'#b0c3df':'#dce8f5');hemi.groundColor.set(evening?'#586173':'#4d5764');
 sun.color.set(evening?'#aec9ef':'#fff7ea');fill.color.set(evening?'#b3a4d3':'#b5cce4');
 scene.environmentIntensity=(evening?.29:.62)*ambientLevel;renderer.toneMappingExposure=evening?1.12:1.0;
 studio.material.color.set(evening?'#25364c':'#354555');
 for(const [lamp,power] of neonLights)lamp.intensity=evening?power:power*.15;
 wetStreet.setNight(evening);
 bloom.strength=evening?.34:.10;bloom.radius=evening?.44:.45;bloom.threshold=evening?1.0:1.15;
 lightingButton.textContent=evening?'切换日景':'切换霓虹夜景';
 document.querySelector('header p').textContent=evening?'微体素街区 · 霓虹夜景':'微体素街区 · 日间材质';
 dirty=true;
}
lightingButton.onclick=()=>{evening=!evening;lightCity();};
ambientControl.oninput=lightCity;



function resize(){
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);dirty=true;
}
function updateOrbitPose(view){
 const factor=Math.max(1,1.45/camera.aspect);
 orbit.target.set(0,24,-7);
 const direction=view==='top'?new T.Vector3(0,218,.01):new T.Vector3(135,102,166);
 camera.position.copy(orbit.target).addScaledVector(direction,factor);orbit.update();
}
function view(name){
 mode=name;keys.clear();touchX=touchZ=0;
 const overview=name==='overview'||name==='top';
 camera.fov=overview?43:58;camera.updateProjectionMatrix();
 orbit.enabled=overview;document.body.classList.toggle('roaming',!overview);
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));
 if(overview){updateOrbitPose(name);ui.guide.textContent='拖动旋转 · 滚轮缩放 · 右键平移';}
 else{
   if(name==='street'){player.set(1,model.ground(1,56,1)+eye,56);yaw=.02;pitch=.20;flying=false;}
   if(name==='detail'){player.set(-48,model.ground(-48,25.5,1)+eye,25.5);yaw=Math.PI;pitch=.04;flying=false;}
   if(name==='rail'){player.set(14.2,model.ground(14.2,.8,10)+eye,.8);yaw=.92;pitch=.12;flying=false;}
   if(name==='air'){player.set(-22,23,58);yaw=.75;pitch=-.50;flying=true;}
   ui.guide.textContent='WASD 移动 · 拖动环视 · F 飞行\nQ / E 升降 · Shift 加速';
   ui.guide.style.whiteSpace='pre-line';camera.position.copy(player);camera.rotation.set(pitch,yaw,0);
 }
 scene.fog.density=evening?(overview?.002:.0038):.0015;
 ui.where.textContent={overview:'整体模型',top:'城市肌理',street:'地面商业街',detail:'墙面近景',rail:'高架步道',air:'空中漫游'}[name];
 dirty=true;
}
function toggleFlight(){
 if(orbit.enabled){view('air');return;}
 flying=!flying;
 if(!flying){const foot=model.ground(player.x,player.z,player.y-eye+.5);player.y=foot+eye;}
 ui.where.textContent=flying?'空中漫游':'步行漫游';dirty=true;
}
orbit.addEventListener('change',()=>dirty=true);
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
function onKey(e,down){
 if(down&&e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
 if(e.ctrlKey||e.altKey||e.metaKey)return;
 const k=e.key.toLowerCase();
 if(down&&!e.repeat&&k==='h')document.body.classList.toggle('photo');
 if(down&&!e.repeat&&k==='f')toggleFlight();
 if(['w','a','s','d','e','q','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){
   if(!orbit.enabled)e.preventDefault();
   if(down)keys.add(k);else keys.delete(k);
 }
}
addEventListener('keydown',e=>onKey(e,true));addEventListener('keyup',e=>onKey(e,false));
addEventListener('blur',()=>{keys.clear();touchX=touchZ=0;});
const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{if(orbit.enabled)return;canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,id:e.pointerId};});
canvas.addEventListener('pointermove',e=>{
 if(!drag||orbit.enabled||e.pointerId!==drag.id)return;
 yaw-=(e.clientX-drag.x)*.0035;pitch=T.MathUtils.clamp(pitch-(e.clientY-drag.y)*.003,-1.13,1.17);
 drag.x=e.clientX;drag.y=e.clientY;dirty=true;
});
canvas.addEventListener('lostpointercapture',()=>drag=null);
const stick=document.querySelector('#move'),knob=document.querySelector('#knob');
function joystick(e){
 const rect=stick.getBoundingClientRect();let x=(e.clientX-rect.left-50)/34,z=(e.clientY-rect.top-50)/34;
 const length=Math.max(1,Math.hypot(x,z));touchX=x/length;touchZ=-z/length;
 knob.style.transform='translate('+touchX*28+'px,'+-touchZ*28+'px)';
}
stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);joyPointer=e.pointerId;joystick(e);};
stick.onpointermove=e=>{if(e.pointerId===joyPointer)joystick(e);};
stick.onlostpointercapture=()=>{joyPointer=null;touchX=touchZ=0;knob.style.transform='';};
document.querySelectorAll('[data-key]').forEach(b=>{
 b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};
 b.onlostpointercapture=()=>keys.delete(b.dataset.key);
});
function move(dx,dz){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));
 for(let i=0;i<steps;i++){
   const foot=player.y-eye,x=player.x+dx/steps,z=player.z+dz/steps;
   if(flying){player.x=T.MathUtils.clamp(x,-90,90);player.z=T.MathUtils.clamp(z,-73,73);continue;}
   if(model.canMove(x,player.z,foot))player.x=x;
   if(model.canMove(player.x,z,foot))player.z=z;
   const next=model.ground(player.x,player.z,foot+.56);
   player.y=next+eye;
 }
}
function frame(t){
 const dt=Math.min(.05,(t-lastTime)/1000);lastTime=t;
 if(!orbit.enabled){
   let f=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'))+touchZ;
   let a=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'))+touchX;
   const vertical=Number(keys.has('e'))-Number(keys.has('q'));
   if(f||a){
     const length=Math.max(1,Math.hypot(f,a)),speed=(flying?keys.has('shift')?33:16:keys.has('shift')?6.2:3.7)*dt/length;
     move((Math.cos(yaw)*a-Math.sin(yaw)*f)*speed,(-Math.sin(yaw)*a-Math.cos(yaw)*f)*speed);dirty=true;
   }
   if(flying&&vertical){player.y=T.MathUtils.clamp(player.y+vertical*dt*16,2,115);dirty=true;}
   camera.position.copy(player);camera.rotation.set(pitch,yaw,0);
 }
 if(dirty){

   denseCity.updateLOD(camera);
   composer.render();renderer.shadowMap.needsUpdate=false;
   canvas.dataset.pose=JSON.stringify({mode,flying,position:camera.position.toArray(),rotation:[camera.rotation.x,camera.rotation.y,camera.rotation.z]});
   dirty=false;
 }
 requestAnimationFrame(frame);
}
addEventListener('resize',resize);resize();view('detail');lightCity();
document.body.dataset.model=JSON.stringify(modelInfo);document.body.dataset.ready='1';ui.load.hidden=true;
requestAnimationFrame(frame);


}
start().catch(error=>{document.querySelector('#load').textContent='模型载入失败 · '+error.message;console.error(error);});
