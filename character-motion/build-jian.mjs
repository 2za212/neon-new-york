import * as T from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {createAvatar} from '../nyc-avatar.js';
import fs from 'node:fs';
globalThis.FileReader=class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}
};
const source=createAvatar(new T.Scene()).group;
source.updateMatrixWorld(true);
const root=new T.Group(), bones=[], parts=[], joints={};
root.name='CityExplorer';
function copyJoint(node,parent){
  const bone=new T.Bone();
  bone.name=node.name;bone.position.copy(node.position); parent.add(bone);
  bones.push(bone);joints[node.name]=bone;
  for(const child of node.children){
    if(child.isMesh)parts.push({child,bone});
    else copyJoint(child,bone);
  }
}
copyJoint(source.getObjectByName('hips'),root);
root.updateMatrixWorld(true);
const skeleton=new T.Skeleton(bones);
for(const {child,bone} of parts){
  const geometry=child.geometry.clone().applyMatrix4(child.matrixWorld);
  const count=geometry.attributes.position.count,indices=new Uint16Array(count*4),weights=new Float32Array(count*4);
  for(let i=0;i<count;i++){indices[i*4]=bones.indexOf(bone);weights[i*4]=1;}
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  const mesh=new T.SkinnedMesh(geometry,child.material);mesh.name=child.name;root.add(mesh);mesh.bind(skeleton);
}
const gait=JSON.parse(fs.readFileSync(new URL('gait.json',import.meta.url)));
const clips=[];
const vec=(a)=>new T.Vector3(...a);
const rad=n=>n*Math.PI/180;
function clip(name,times,pose){
 const values=new Map(bones.map(b=>[b,[]])),positions=[];
 for(let i=0;i<times.length;i++){
   for(const b of bones)b.quaternion.identity();
   joints.hips.position.set(0,.91,0);
   const clearance=pose(i);
   root.updateMatrixWorld(true);
   let bottom=Infinity;
   for(const side of ['left','right']){
     const matrix=joints[side+'_ankle'].matrixWorld;
     for(const x of [-.08,.08])for(const z of [-.10,.20])bottom=Math.min(bottom,new T.Vector3(x,-.12,z).applyMatrix4(matrix).y);
   }
   joints.hips.position.y+=clearance-bottom;
   positions.push(...joints.hips.position.toArray());
   for(const b of bones)values.get(b).push(...b.quaternion.toArray());
 }
 const tracks=[new T.VectorKeyframeTrack('hips.position',times,positions)];
 for(const [b,v] of values)tracks.push(new T.QuaternionKeyframeTrack(b.name+'.quaternion',times,v));
 clips.push(new T.AnimationClip(name,times.at(-1),tracks));
}
const sword=new T.Group();sword.name='Cloud_Jian';sword.position.y=-.054;
joints.right_hand.add(sword);
function fitting(name,shape,color,z){
 const mesh=new T.Mesh(shape,new T.MeshStandardMaterial({color,roughness:.48,metalness:.34}));
 mesh.name=name;mesh.position.z=z;sword.add(mesh);
}
fitting('Wrapped_grip',new T.BoxGeometry(.038,.045,.161),0x224043,-.018);
fitting('Bronze_pommel',new T.BoxGeometry(.055,.055,.039),0xc9a366,-.11);
fitting('Cloud_guard',new T.BoxGeometry(.182,.044,.04),0xc6a465,.073);
const outline=new T.Shape();outline.moveTo(-.03,0);outline.lineTo(-.025,.56);outline.lineTo(0,.69);outline.lineTo(.025,.56);outline.lineTo(.03,0);outline.closePath();
const blade=new T.ExtrudeGeometry(outline,{depth:.012,bevelEnabled:false});blade.rotateX(Math.PI/2);
fitting('Jade_blade',blade,0xbde8e9,.092);
function rotate(name,x,y=0,z=0){joints[name].rotation.set(rad(x),rad(y),rad(z),'YXZ');}
function bladeDirection(x,y,z){
 const wrist=joints.right_hand;wrist.parent.updateWorldMatrix(true,false);
 const world=new T.Quaternion().setFromUnitVectors(vec([0,0,1]),vec([x,y,z]).normalize());
 wrist.quaternion.copy(wrist.parent.getWorldQuaternion(new T.Quaternion()).invert()).multiply(world);
}
for(const [name,{frames,fps}] of Object.entries(gait)){
 const run=name==='Running', duration=(frames.length-1)/fps*(run?.92:1.24);
 clip(name,frames.map((_,i)=>duration*i/(frames.length-1)),i=>{
   const p=i/(frames.length-1)*2*Math.PI,wave=Math.sin(p);
   rotate('torso',run?18:4,(run?-13:-22)+4*wave,2*wave);
   rotate('head',run?-12:-3,run?12:19);
   for(const [side,s] of [['right','Left'],['left','Right']]){
     for(const [joint,a,b] of [['hip','UpLeg','Leg'],['knee','Leg','Foot']]){
       const bone=joints[side+'_'+joint],f=frames[i];
       const axis=vec(f[s+b]).sub(vec(f[s+a])).normalize();
       bone.parent.updateWorldMatrix(true,false);
       bone.quaternion.setFromUnitVectors(vec([0,-1,0]),axis.applyQuaternion(bone.parent.getWorldQuaternion(new T.Quaternion()).invert()));
       bone.rotateX(rad(joint==='hip'?(run?-8:-4):(run?15:8)));
     }
     const ankle=joints[side+'_ankle'];ankle.parent.updateWorldMatrix(true,false);
     ankle.quaternion.copy(ankle.parent.getWorldQuaternion(new T.Quaternion()).invert());
   }
   rotate('right_shoulder',run?26+wave*7:-14+wave*5,0,run?26:14);
   rotate('right_elbow',run?-36:-43);
   rotate('left_shoulder',run?-57+wave*10:-29,10,-12);
   rotate('left_elbow',run?-51:-79);
   bladeDirection(run?.39:.47,run?.15:-.42,run?-1:1);
   joints.hips.position.x=.018*wave;
   return run?.055*Math.max(0,Math.cos(p*2)):0;
 });
}
// Keys describe the silhouette in screen space, with independent wrist direction.
const guard=[0,0,3,-16,-12,18,1,8,-24,-62,-24,-40,15,.42,-.38,.93];
function sequence(name,keys){
 clip(name,keys.map(k=>k[0]),i=>{
   const [t,h,lean,yaw,lh,lk,rh,rk,ls,le,rs,re,spread,x,y,z]=keys[i];
   rotate('torso',lean,yaw);rotate('head',-lean*.5,-yaw*.68);
   rotate('left_hip',lh,0,-5);rotate('left_knee',lk);rotate('left_ankle',-lh-lk);
   rotate('right_hip',rh,0,5);rotate('right_knee',rk);rotate('right_ankle',-rh-rk);
   rotate('left_shoulder',ls,7,-22);rotate('left_elbow',le);
   rotate('right_shoulder',rs,yaw*.25,spread);rotate('right_elbow',re);
   bladeDirection(x,y,z);return h;
 });
}
sequence('Jump',[guard,[.20,0,22,-28,-49,80,-42,73,25,-36,28,-38,24,.47,.02,-1],
 [.32,.09,7,-16,-36,39,5,9,-61,-46,-51,-29,36,.62,.63,.48],
 [.53,.54,1,12,-85,109,18,29,-80,-34,-65,-28,66,.90,.32,.10],
 [.69,.60,-3,27,-81,102,19,24,-87,-28,-58,-23,70,.93,.24,-.17],
 [.90,.29,5,13,-53,62,7,18,-52,-41,-42,-32,53,.76,.15,.65],
 [1.05,0,11,-4,-20,28,-8,14,-36,-48,-29,-38,25,.55,-.16,.86],
 [1.17,0,19,-15,-48,75,-39,71,-16,-51,-14,-43,19,.46,-.32,.91],[1.48,...guard.slice(1)]]);
sequence('Attack',[guard,[.21,0,7,28,-17,29,-23,44,-48,-74,-63,-75,44,.44,.79,-.42],
 [.41,0,4,44,-16,26,-36,60,-54,-78,-96,-61,57,.71,.69,-.12],
 [.50,0,10,12,-33,49,-19,39,-24,-76,-82,-32,34,.50,.51,.76],
 [.57,0,17,-36,-51,69,-2,26,10,-59,-64,-17,15,-.62,-.11,.80],
 [.69,0,14,-46,-49,64,4,20,18,-44,-46,-23,6,-.77,-.40,.49],
 [.91,0,8,-23,-30,47,0,17,-16,-63,-34,-55,18,-.10,.60,.80],[1.24,...guard.slice(1)]]);
for(const b of bones)b.quaternion.identity();
joints.hips.position.set(0,.91,0);root.updateMatrixWorld(true);
const out=await new GLTFExporter().parseAsync(root,{binary:true,animations:clips});
fs.writeFileSync(new URL('explorer-jian.glb',import.meta.url),Buffer.from(out));
console.log(bones.length,clips.map(c=>[c.name,c.duration]),out.byteLength);

