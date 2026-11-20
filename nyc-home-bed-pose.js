import * as T from 'three';

// Align the UE leg segments in avatar space. UE joint axes and bind rotations
// differ from the original rig, so applying its Euler angles would twist them.
export function createUEBedPose(body){
  const pelvis=body.getObjectByName('pelvis');
  const legs=['l','r'].map(side=>({
    thigh:body.getObjectByName('thigh_'+side),
    calf:body.getObjectByName('calf_'+side),
    foot:body.getObjectByName('foot_'+side),
    toe:body.getObjectByName('ball_'+side),
  }));
  if(!pelvis?.isBone||!legs.every(({thigh,calf,foot})=>thigh?.isBone&&calf?.isBone&&foot?.isBone))return null;

  const joints=legs.flatMap(({thigh,calf,foot})=>[thigh,calf,foot]);
  const saved=joints.map(joint=>joint.quaternion.clone());
  const pivot=new T.Vector3(),bodyRotation=new T.Quaternion();
  const from=new T.Vector3(),to=new T.Vector3(),origin=new T.Vector3();
  const parentRotation=new T.Quaternion(),delta=new T.Quaternion();
  const meshes=[];
  body.traverse(node=>{
    if(node.isSkinnedMesh)meshes.push({mesh:node,full:node.geometry,legs:null});
  });
  let active=false;

  function begin(){
    if(active)return;
    active=true;
    joints.forEach((joint,i)=>saved[i].copy(joint.quaternion));
    pelvis.getWorldPosition(pivot);
    body.worldToLocal(pivot);
  }
  function restore(){
    joints.forEach((joint,i)=>joint.quaternion.copy(saved[i]));
  }
  function aim(joint,end,y,z,weight){
    joint.getWorldPosition(origin);
    end.getWorldPosition(from).sub(origin).normalize();
    if(!from.lengthSq())return;
    to.set(0,y,z).normalize().applyQuaternion(bodyRotation);
    joint.parent.getWorldQuaternion(parentRotation).invert();
    delta.setFromUnitVectors(from,to);
    delta.premultiply(parentRotation).multiply(parentRotation.invert());
    joint.quaternion.slerp(delta.multiply(joint.quaternion),weight);
  }
  function apply(thighAngle,shinAngle,weight){
    restore();
    body.getWorldQuaternion(bodyRotation);
    for(const {thigh,calf,foot,toe} of legs){
      aim(thigh,calf,-Math.cos(thighAngle),Math.sin(thighAngle),weight);
      aim(calf,foot,-Math.cos(shinAngle),-Math.sin(shinAngle),weight);
      if(toe?.isBone)aim(foot,toe,-Math.sin(shinAngle),Math.cos(shinAngle),weight);
    }
  }
  function end(){
    if(!active)return;
    showLegs(false);
    restore();
    active=false;
  }
  // The UE model is a single skin. Draw its leg triangles in first person
  // without letting the head, hair or arms intersect the camera.
  function showLegs(visible){
    for(const entry of meshes){
      if(visible&&!entry.legs)entry.legs=legGeometry(entry.mesh,entry.full);
      entry.mesh.geometry=visible?entry.legs:entry.full;
    }
  }
  function legFocus(target){
    target.set(0,0,0);
    for(const {calf,foot} of legs){
      calf.getWorldPosition(origin);
      foot.getWorldPosition(to);
      target.add(origin.lerp(to,.58));
    }
    return target.multiplyScalar(.5);
  }
  return {begin,apply,end,showLegs,legFocus,pivot,ankles:legs.map(leg=>leg.foot)};
}

function legGeometry(mesh,source){
  const joints=source.getAttribute('skinIndex'),weights=source.getAttribute('skinWeight');
  const legJoint=mesh.skeleton.bones.map(bone=>/^(thigh|calf|foot|ball)_/.test(bone.name));
  const keep=new Uint8Array(source.getAttribute('position').count);
  if(joints&&weights){
    for(let vertex=0;vertex<keep.length;vertex++){
      let legWeight=0;
      for(let i=0;i<4;i++){
        if(legJoint[joints.getComponent(vertex,i)])legWeight+=weights.getComponent(vertex,i);
      }
      keep[vertex]=legWeight>=.65;
    }
  }

  const view=new T.BufferGeometry(),triangles=[];
  for(const [name,attribute] of Object.entries(source.attributes))view.setAttribute(name,attribute);
  view.morphAttributes=source.morphAttributes;
  view.morphTargetsRelative=source.morphTargetsRelative;
  view.boundingBox=source.boundingBox;
  view.boundingSphere=source.boundingSphere;
  const count=source.index?.count??keep.length;
  const groups=source.groups.length?source.groups:[{start:0,count,materialIndex:0}];
  for(const group of groups){
    const start=triangles.length;
    const end=Math.min(group.start+group.count,source.drawRange.start+source.drawRange.count,count);
    for(let i=Math.max(group.start,source.drawRange.start);i+2<end;i+=3){
      const a=source.index?.getX(i)??i;
      const b=source.index?.getX(i+1)??i+1;
      const c=source.index?.getX(i+2)??i+2;
      if(keep[a]&&keep[b]&&keep[c])triangles.push(a,b,c);
    }
    if(source.groups.length)view.addGroup(start,triangles.length-start,group.materialIndex);
  }
  view.setIndex(triangles);
  return view;
}
