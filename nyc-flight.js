import * as T from 'three';

/** Detached, collision-aware camera. It never changes the character's position. */
export function createFreeFlight(world){
  const position=new T.Vector3(),velocity=new T.Vector3(),direction=new T.Vector3(),right=new T.Vector3(),motion=new T.Vector3(),candidate=new T.Vector3();
  const radius=.26,bounds=world.bounds,solids=world.cameraColliders||world.colliders||[];
  let active=false,yaw=0,pitch=0,speed=11;
  function blocked(x,y,z){
    for(const b of solids){
      const dx=x-T.MathUtils.clamp(x,b.min.x,b.max.x),dy=y-T.MathUtils.clamp(y,b.min.y,b.max.y),dz=z-T.MathUtils.clamp(z,b.min.z,b.max.z);
      if(dx*dx+dy*dy+dz*dz<radius*radius-.00001)return true;
    }
    return false;
  }
  function activate(origin,forward,fallback){
    position.copy(origin);velocity.set(0,0,0);
    function clampPosition(){position.x=T.MathUtils.clamp(position.x,bounds.minX+radius,bounds.maxX-radius);position.z=T.MathUtils.clamp(position.z,bounds.minZ+radius,bounds.maxZ-radius);position.y=T.MathUtils.clamp(position.y,.85,190);}
    clampPosition();
    if((blocked(position.x,position.y,position.z)||(world.isPlayable&&!world.isPlayable(position.x,position.z,radius)))&&fallback){position.copy(fallback);position.y+=1.35;clampPosition();}
    if(blocked(position.x,position.y,position.z)||(world.isPlayable&&!world.isPlayable(position.x,position.z,radius))){active=false;return null;}
    yaw=Math.atan2(-forward.x,-forward.z);pitch=Math.asin(T.MathUtils.clamp(-forward.y,-1,1));
    active=true;return position;
  }
  function deactivate(){active=false;velocity.set(0,0,0);}
  function stop(){velocity.set(0,0,0);}
  function update(dt,input,impulse={}){
    if(!active)return;
    dt=Math.max(0,Math.min(dt,.05));
    yaw-=(impulse.lookX||0)*.0038;pitch=T.MathUtils.clamp(pitch+(impulse.lookY||0)*.0032,-1.34,1.34);
    speed=T.MathUtils.clamp(speed*Math.exp(-(impulse.zoom||0)*.0014),3,28);
    direction.set(-Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
    right.set(Math.cos(yaw),0,-Math.sin(yaw));
    motion.copy(direction).multiplyScalar(input.moveZ||0).addScaledVector(right,input.moveX||0);motion.y+=input.moveY||0;
    if(motion.lengthSq()>1)motion.normalize();motion.multiplyScalar(speed*(input.sprint?2.3:1));
    velocity.lerp(motion,1-Math.exp(-dt*12));
    const steps=Math.max(1,Math.ceil(velocity.length()*dt/.20));
    for(let i=0;i<steps;i++)for(const axis of ['x','z','y']){
      const next=candidate.copy(position);next[axis]+=velocity[axis]*dt/steps;
      next.x=T.MathUtils.clamp(next.x,bounds.minX+radius,bounds.maxX-radius);
      next.z=T.MathUtils.clamp(next.z,bounds.minZ+radius,bounds.maxZ-radius);
      next.y=T.MathUtils.clamp(next.y,.85,190);
      const inDistrict=axis==='y'||!world.isPlayable||world.isPlayable(next.x,next.z,radius);
      if(inDistrict&&!blocked(next.x,next.y,next.z))position.copy(next);else velocity[axis]=0;
    }
  }
  function applyCamera(camera){
    direction.set(-Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
    camera.position.copy(position);camera.lookAt(motion.copy(position).add(direction));
  }
  return{position,velocity,activate,deactivate,stop,update,applyCamera,
    get active(){return active;},get yaw(){return yaw;},get pitch(){return pitch;},get speed(){return speed;}};
}
