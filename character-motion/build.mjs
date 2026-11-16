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
for(const [name,{fps,frames}] of Object.entries(gait)){
 clip(name,frames.map((_,i)=>i/fps),i=>{
   const f=frames[i];
   function aim(joint,a,b,axis){
     const bone=joints[joint];bone.parent.updateWorldMatrix(true,false);
     const q=bone.parent.getWorldQuaternion(new T.Quaternion()).invert();
     bone.quaternion.setFromUnitVectors(vec(axis),vec(f[b]).sub(vec(f[a])).normalize().applyQuaternion(q));
   }
   aim('torso','Hips','Neck',[0,1,0]);
   aim('head','Neck','Head',[0,1,0]);
   for(const [side,s] of [['right','Left'],['left','Right']]){
     for(const [joint,a,b] of [['hip','UpLeg','Leg'],['knee','Leg','Foot'],['shoulder','Arm','ForeArm'],['elbow','ForeArm','Hand']])
       aim(side+'_'+joint,s+a,s+b,[0,-1,0]);
     const foot=joints[side+'_ankle'];foot.parent.updateWorldMatrix(true,false);
     const tilt=Math.cos(2*Math.PI*i/(frames.length-1)+(side==='left'?Math.PI:0))*.19;
     foot.quaternion.copy(foot.parent.getWorldQuaternion(new T.Quaternion()).invert()).multiply(new T.Quaternion().setFromAxisAngle(vec([1,0,0]),tilt));
   }
   joints.hips.position.x=f.Hips[0]*1.6;
   return name==='Running'?.035*Math.max(0,Math.cos(4*Math.PI*i/(frames.length-1))):0;
 });
}
function keyPose(name,keys){
 clip(name,keys.map(k=>k[0]),i=>{
   const [,lift,lean,twist,left,right]=keys[i];
   joints.torso.rotation.set(rad(lean),rad(twist),0);
   joints.head.rotation.y=rad(-twist*.55);
   for(const [side,p] of [['left',left],['right',right]]){
     for(const [j,v] of ['hip','knee','ankle','shoulder','elbow'].map((j,k)=>[j,p[k]]))joints[side+'_'+j].rotation.x=rad(v);
     joints[side+'_shoulder'].rotation.z=rad((side==='right'?1:-1)*(p[5]??5));
   }
   return lift;
 });
}
const neutral=[0,0,0,0,-9];
keyPose('Jump',[
 [0,0,0,0,neutral,neutral],[.16,0,21,0,[-51,86,-34,36,-24],[-51,86,-34,36,-24]],
 [.29,.04,5,0,[-7,12,12,-54,-25],[-8,14,12,-55,-27]],
 [.50,.39,8,4,[-50,65,-7,-62,-39],[-28,61,8,-40,-35]],
 [.63,.36,6,1,[-37,54,0,-45,-35],[-18,33,3,-26,-23]],
 [.82,0,7,0,[-10,18,-7,-15,-20],[-9,15,-6,-18,-20]],
 [.94,0,19,0,[-43,74,-31,17,-24],[-42,73,-30,12,-22]],[1.2,0,0,0,neutral,neutral]]);
keyPose('Attack',[
 [0,0,0,0,neutral,neutral],[.18,0,7,-16,[-13,26,-13,-22,-73],[-3,19,-16,18,-94]],
 [.31,0,12,-24,[-15,30,-15,-28,-81],[3,20,-18,24,-101]],
 [.43,0,16,29,[-23,35,-12,-5,-74],[10,19,-21,-103,-9]],
 [.50,0,13,24,[-20,30,-10,-9,-75],[9,17,-18,-86,-29]],
 [.66,0,7,2,[-12,23,-11,-19,-57],[1,15,-16,-18,-73]],[.89,0,0,0,neutral,neutral]]);
for(const b of bones)b.quaternion.identity();
joints.hips.position.set(0,.91,0);root.updateMatrixWorld(true);
const out=await new GLTFExporter().parseAsync(root,{binary:true,animations:clips});
fs.writeFileSync(new URL('explorer.glb',import.meta.url),Buffer.from(out));
console.log(bones.length,clips.map(c=>[c.name,c.duration]),out.byteLength);
