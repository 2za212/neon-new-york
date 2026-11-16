import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export async function loadPalmAvatar(scene) {
  const {scene:model, animations} = await new GLTFLoader().loadAsync('./explorer-palm.glb');
  const group = new T.Group();
  group.add(model);
  scene.add(group);
  model.traverse(node => { if(node.isMesh) node.castShadow = node.receiveShadow = true; });
  const mixer = new T.AnimationMixer(model);
  const actions = Object.fromEntries(animations.map(clip => [clip.name,mixer.clipAction(clip)]));
  const idleClip = actions.Attack.getClip().clone();
  idleClip.name = 'Idle';
  for(const track of idleClip.tracks) {
    const first = track.values.slice(0,track.getValueSize());
    track.times = new Float32Array([0,1]);
    track.values = new Float32Array([...first,...first]);
  }
  actions.Idle = mixer.clipAction(idleClip);
  let active;
  function enter(name) {
    if(active === name) return;
    if(active) actions[active].fadeOut(.1);
    const action = actions[name];
    action.reset().fadeIn(.1).play();
    if(name === 'Attack' || name === 'Jump') {
      action.setLoop(T.LoopOnce,1);
      action.clampWhenFinished = true;
    }
    active = name;
    group.userData.motion = name;
  }
  enter('Idle');
  const jump = actions.Jump;
  // Subtract the authored airborne height: the collision motor already moves the whole character.
  const liftTime=[0,.22,.37,.59,.73,.94,1.08,1.21,1.52];
  const liftValue=[0,0,.15,.56,.58,.26,0,0,0];
  function update({dt,speed,grounded,sprinting,heading,attack,verticalSpeed}) {
    group.rotation.y=heading;
    if(!grounded) {
      enter('Jump'); jump.paused=true;
      jump.time=T.MathUtils.clamp(.35+(6.25-verticalSpeed)*.057,.35,1.065);
    } else if(active==='Jump' && jump.time<1.26) {
      jump.time=Math.max(jump.time,1.08);jump.paused=false;
    } else if(attack && (active!=='Attack' || !actions.Attack.isRunning())) {
      if(active==='Attack') actions.Attack.reset().play();
      else enter('Attack');
    } else if(active!=='Attack' || !actions.Attack.isRunning()) {
      enter(speed<.12?'Idle':sprinting?'Running':'Walking');
    }
    mixer.update(dt);
    model.position.y=0;
    if(jump.getEffectiveWeight()>0 && jump.enabled){
      const i=liftTime.findIndex(t=>t>=jump.time);
      if(i>0)model.position.y=-jump.getEffectiveWeight()*T.MathUtils.mapLinear(jump.time,liftTime[i-1],liftTime[i],liftValue[i-1],liftValue[i]);
    }
  }
  return {group,update};
}
