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
function rotate(name,x,y=0,z=0){joints[name].rotation.set(rad(x),rad(y),rad(z),'YXZ');}
const skin=new T.MeshStandardMaterial({color:0xc79470,roughness:.85});
for(const side of ['left','right']){
 const hand=joints[side+'_hand'],mirror=side==='right'?1:-1;
 for(const [i,len] of [.046,.053,.047,.038].entries()){
   const finger=new T.Mesh(new T.BoxGeometry(.018,len,.028),skin);
   finger.name=side+'_finger_'+i;
   finger.position.set(mirror*(i-1.5)*.021,-.087-len/2,.012);
   finger.rotation.z=mirror*(i-1.5)*.045;
   hand.add(finger);
 }
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
   // Open arms follow the stride in opposite phase; a supple elbow keeps the wrists clear of the chest.
   for(const [side,sign] of [['left',-1],['right',1]]){
     const swing=sign*wave;
     rotate(side+'_shoulder',run?-16+35*swing:-10+15*swing,sign*7,sign*(run?21:12));
     rotate(side+'_elbow',run?-48+14*swing:-30+9*swing);
     rotate(side+'_hand',-8+7*swing,sign*(run?18:11),sign*8);
   }
   joints.hips.position.x=.018*wave;
   return run?.055*Math.max(0,Math.cos(p*2)):0;
 });
}
// Poses combine a lower-body stance with two independent open-hand gestures.
// Arm entries contain shoulder pitch/yaw/spread, elbow flexion and wrist pitch/yaw.
const ready=[0,0,3,-7,[-11,18],[-5,11],[-23,5,-15,-39,12,-12],[-18,-5,16,-42,12,12]];
function sequence(name,keys){
 clip(name,keys.map(k=>k[0]),i=>{
   const [,lift,lean,turn,leftLeg,rightLeg,leftArm,rightArm]=keys[i];
   rotate('torso',lean,turn);rotate('head',-lean*.48,-turn*.64);
   for(const [side,sign,leg,arm] of [['left',-1,leftLeg,leftArm],['right',1,rightLeg,rightArm]]){
     rotate(side+'_hip',leg[0],0,sign*6);rotate(side+'_knee',leg[1]);
     rotate(side+'_ankle',-leg[0]-leg[1]);
     rotate(side+'_shoulder',...arm.slice(0,3));
     rotate(side+'_elbow',arm[3]);rotate(side+'_hand',arm[4],arm[5]);
   }
   return lift;
 });
}
sequence('Jump',[ready,
 [.22,0,19,-18,[-48,79],[-44,74],[22,2,-25,-34,4,-14],[30,-4,27,-38,5,18]],
 [.37,.15,4,-8,[-52,65],[6,14],[-48,12,-52,-25,4,-19],[-61,-12,46,-22,7,15]],
 [.59,.56,-4,21,[-89,109],[17,35],[-57,18,-71,-21,9,-24],[-78,-13,51,-42,15,22]],
 [.73,.58,-3,26,[-83,102],[18,32],[-54,19,-75,-19,10,-24],[-81,-15,49,-37,14,21]],
 [.94,.26,3,10,[-42,54],[5,19],[-41,9,-51,-27,12,-16],[-46,-7,48,-28,11,16]],
 [1.08,0,10,0,[-17,26],[-9,16],[-22,6,-36,-32,11,-13],[-27,-7,33,-35,11,14]],
 [1.21,0,17,-6,[-46,75],[-38,65],[-9,2,-22,-41,8,-9],[-12,-3,23,-43,8,9]],[1.52,...ready.slice(1)]]);
sequence('Attack',[ready,
 [.20,0,6,12,[-18,29],[-17,30],[-33,14,-28,-53,20,-23],[-34,-17,28,-60,18,25]],
 [.40,0,8,30,[-14,23],[-36,59],[-46,23,-11,-52,23,-11],[6,-20,26,-94,23,18]],
 [.51,0,6,23,[-22,34],[-31,50],[-37,14,-10,-65,16,-14],[-15,-15,18,-83,27,11]],
 [.65,0,13,-24,[-48,66],[-1,14],[-9,-4,-22,-83,17,-25],[-90,18,12,-11,-75,4]],
 [.76,0,12,-25,[-47,64],[0,13],[-12,-3,-21,-77,18,-22],[-86,17,13,-14,-74,4]],
 [1.00,0,6,-13,[-28,43],[-4,16],[-26,7,-18,-49,16,-15],[-47,10,17,-49,-24,11]],
 [1.36,...ready.slice(1)]]);
for(const b of bones)b.quaternion.identity();
joints.hips.position.set(0,.91,0);root.updateMatrixWorld(true);
const out=await new GLTFExporter().parseAsync(root,{binary:true,animations:clips});
fs.writeFileSync(new URL('explorer-palm.glb',import.meta.url),Buffer.from(out));
console.log(bones.length,clips.map(c=>[c.name,c.duration]),out.byteLength);



