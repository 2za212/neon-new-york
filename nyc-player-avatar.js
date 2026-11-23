import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loadPalmAvatar} from './nyc-palm-avatar.js';
import {createRapierBlendSpace, rapierBlendInput} from './nyc-rapier-locomotion.js';
import {createSwordEffects} from './nyc-sword-effects.js';

const directory = './ue-voxel/';
const locomotionFiles = {Idle: 'idle', Walking: 'walk', Running: 'run', Jump: 'jump'};
const actionRoles = [
  'dodge-forward', 'dodge-left', 'dodge-right', 'dodge-back',
  'punch', 'charged-punch', 'hurt', 'death',
  'skill-1', 'skill-2', 'skill-3',
  'meditate-enter', 'meditate-rise', 'meditate-idle',
];
const avatarHeight = 1.75;
const walkingSpeed = 1.35;
const authoredWalkingSpeed = 1.1; // m/s on the unscaled voxel rig.
const facingCorrection = -Math.PI / 2; // UE +X to the motor's +Z.
const jumpTakeoff = 10 / 34;
const jumpTouchdown = 22 / 34;
const landingDuration = .22;
const fadeDuration = .1;
const playbackRates = {Running: 1.12, punch: 1.08};
const rapierFiles = {
  Idle: 'idle', Jump: 'jump',
  'slash-1': 'attack-1', 'slash-2': 'attack-2', 'slash-3': 'attack-3',
  'dodge-forward': 'dodge-forward', 'dodge-back': 'dodge-back',
  'dodge-left': 'dodge-left', 'dodge-right': 'dodge-right',
  'skill-1': 'skill-1', 'skill-2': 'skill-2', 'skill-3': 'skill-3',
  hurt: 'hurt', death: 'death', knockdown: 'knockdown', rise: 'rise',
};
const allActionRoles = [...actionRoles, 'slash-1', 'slash-2', 'slash-3', 'knockdown', 'rise'];
// Measured from the skinned model at 32 equal intervals across each named clip.
// These local lifts compensate for poses that intersect the ground while
// preserving the original midair poses and the meditation rise into a hover.
const groundLifts = {
  A_Dead: [
    0, 0, 0, 0, 0, 0, 0, .014, .052, .167, .114, .206, .204, .189, .2, .226,
    .277, .365, .344, .237, .244, .222, .211, .211, .218, .23, .246, .257, .261,
    .262, .261, .261, .261,
  ],
  MonkH__Anim_Monk_sit: [
    0, 0, .004, .005, .002, 0, 0, 0, 0, 0, 0, 0, .004, .025, .033, .041, .053,
    .064, .074, .08, .087, .13, .175, .199, .196, .197, .198, .199, .201, .201,
    .2, .2, .2,
  ],
  MonkH__Anim_Monk_sitrise: [.2, .191, .18, .168, .149, .123, .094, .064, .034, .003, 0],
  A_Voxel_Rapier_Dead1: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, .002, .013, .019, .017,
    .032, .044, .072, .099, .094, .122, .149, .136, .087, .065, .09,
    .136, .155, .152, .158, .149,
  ],
  A_Voxel_Rapier_hit_knockdown01: [
    0, 0, .012, .074, .137, .265, .365, .425, .454, .46, .458, .448,
    .432, .41, .386, .365, .345, .328, .315, .301, .286, .269, .253,
    .233, .199, .15, .12, .088, .069, .088, .142, .204, .264,
  ],
  A_Voxel_Rapier_rise1: [
    .264, .305, .346, .391, .425, .447, .461, .482, .501, .509, .496,
    .495, .533, .522, .558, .392, .502, .474, .385, .278, .154, 0, 0, 0,
    .002, .004, .005, .005, .006, .007, .005, 0, 0,
  ],
};

function authoredJumpLift(asset, clip) {
  const left = asset.scene.getObjectByName('foot_l');
  const right = asset.scene.getObjectByName('foot_r');
  if (!left || !right) throw new Error('The rapier jump needs both foot bones.');
  const mixer = new T.AnimationMixer(asset.scene);
  const action = mixer.clipAction(clip).play();
  action.paused = true;
  const point = new T.Vector3();
  const heights = [];
  for (let frame = 0; frame <= 32; frame++) {
    action.time = clip.duration * frame / 32;
    mixer.update(0);
    asset.scene.updateMatrixWorld(true);
    heights.push(Math.min(left.getWorldPosition(point).y, right.getWorldPosition(point).y));
  }
  mixer.stopAllAction();
  return heights.map(height => -Math.max(0, height - heights[0]));
}

function getSkeleton(model) {
  const bones = new Map();
  model.traverse(node => {
    if (node.isBone) bones.set(node.name, node);
  });
  if (!bones.has('root')) throw new Error('The voxel character has no root bone.');
  return bones;
}

function hasMotion(track) {
  const {values} = track;
  const size = track.getValueSize();
  if (track instanceof T.QuaternionKeyframeTrack && size === 4) {
    const first = new T.Quaternion().fromArray(values).normalize();
    const sample = new T.Quaternion();
    for (let offset = size; offset < values.length; offset += size) {
      sample.fromArray(values, offset).normalize();
      if (1 - Math.abs(first.dot(sample)) > 1e-7) return true;
    }
    return false;
  }
  return values.some((value, index) => Math.abs(value - values[index % size]) > 1e-4);
}

function getClip(asset, file, bones, modelScale) {
  if (asset.animations.length !== 1 || !(asset.animations[0].duration > 0)) {
    throw new Error(`${file}.glb must contain one animation.`);
  }
  const [clip] = asset.animations;
  const exportedBones = getSkeleton(asset.scene);
  for (const [name, bone] of bones) {
    const exported = exportedBones.get(name);
    if (!exported || exported.parent?.isBone !== bone.parent?.isBone ||
        (bone.parent?.isBone && exported.parent.name !== bone.parent.name) ||
        exported.position.distanceToSquared(bone.position) > 1e-8 ||
        1 - Math.abs(exported.quaternion.dot(bone.quaternion)) > 1e-6 ||
        exported.scale.distanceToSquared(bone.scale) > 1e-8) {
      throw new Error(`${file}.glb uses a different skeleton at ${name}.`);
    }
  }
  for (const track of clip.tracks) {
    const {nodeName} = T.PropertyBinding.parseTrackName(track.name);
    if (!bones.has(nodeName)) throw new Error(`Cannot bind the animation track ${track.name}.`);
  }
  // The collision motor supplies world travel and airborne height.
  clip.tracks = clip.tracks.filter(track => track.name !== 'root.position');
  if (!clip.tracks.some(hasMotion)) {
    throw new Error(`${file}.glb has no changing bone keys after discarding root travel.`);
  }
  const rootRotation = clip.tracks.find(track => track.name === 'root.quaternion');
  if (rootRotation) {
    const {values} = rootRotation;
    if (rootRotation.getValueSize() !== 4) {
      throw new Error(`${file}.glb must use linear or step root rotation keys.`);
    }
    // Retargeted clips can begin with a different forward axis. Align the
    // first key to the bind pose and preserve turns relative to that key.
    const rotation = new T.Quaternion();
    const correction = bones.get('root').quaternion.clone()
      .multiply(rotation.fromArray(values).invert());
    for (let offset = 0; offset < values.length; offset += 4) {
      rotation.fromArray(values, offset).premultiply(correction).normalize().toArray(values, offset);
    }
  }
  const isRapierJump = clip.name.startsWith('A_Voxel_Rapier_jump1_Z1');
  const lift = isRapierJump ? authoredJumpLift(asset, clip) : groundLifts[clip.name.replace(/_\d+$/, '')];
  if (lift) {
    const root = bones.get('root').position;
    const times = lift.map((_, frame) => clip.duration * frame / 32);
    const positions = lift.flatMap(y => [root.x, root.y + y / (isRapierJump ? 1 : modelScale), root.z]);
    clip.tracks.push(new T.VectorKeyframeTrack('root.position', times, positions));
  }
  clip.optimize();
  return clip;
}

function fitCharacter(model, root) {
  const bounds = new T.Box3(), meshBounds = new T.Box3();
  let hasSkin = false;
  model.updateMatrixWorld(true);
  model.traverse(node => {
    if (!node.isMesh) return;
    hasSkin ||= node.isSkinnedMesh;
    node.castShadow = node.receiveShadow = true;
    if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    bounds.union(meshBounds.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld));
  });
  const height = bounds.max.y - bounds.min.y;
  if (!hasSkin || !Number.isFinite(height) || height <= 0) {
    throw new Error('idle.glb must contain the voxel character and its skin.');
  }
  const scale = avatarHeight / height;
  const origin = root.getWorldPosition(new T.Vector3());
  origin.y = bounds.min.y;
  const fitted = new T.Group();
  fitted.add(model);
  fitted.rotation.y = facingCorrection;
  fitted.scale.setScalar(scale);
  fitted.position.copy(origin).multiplyScalar(-scale).applyQuaternion(fitted.quaternion);
  return fitted;
}

async function loadUEAvatar(scene) {
  const loader = new GLTFLoader();
  const load = file => loader.loadAsync(`${directory}${file}.glb`);
  const idle = await load(locomotionFiles.Idle);
  const model = idle.scene;
  const bones = getSkeleton(model);
  const fittedCharacter = fitCharacter(model, bones.get('root'));
  const mixer = new T.AnimationMixer(model);
  const actions = new Map();
  const clips = {};
  const addClip = (role, file, asset) => {
    const clip = getClip(asset, file, bones, fittedCharacter.scale.x);
    clips[role] = clip.name;
    const action = mixer.clipAction(clip);
    actions.set(role, action);
    return action;
  };
  addClip('Idle', locomotionFiles.Idle, idle);
  const loadAction = async (role, file) => {
    if (role === 'Idle') return;
    try {
      addClip(role, file, await load(file));
    } catch (error) {
      if (Object.hasOwn(locomotionFiles, role)) throw error;
      if (error.response?.status !== 404) console.warn(`[NYC] ${role} animation unavailable`, error);
    }
  };
  await Promise.all([
    ...Object.entries(locomotionFiles).map(([role, file]) => loadAction(role, file)),
    ...actionRoles.map(role => loadAction(role, role)),
  ]);

  const group = new T.Group();
  group.add(fittedCharacter);
  const fittedWalkingSpeed = authoredWalkingSpeed * fittedCharacter.scale.x;
  scene.add(group);
  const rapierClips = {};
  let rapier = null;
  const manifestResponse = await fetch('./ue-rapier/blendspace.json');
  if (manifestResponse.ok) {
    try {
      const manifest = await manifestResponse.json();
      const rapierLoad = file => loader.loadAsync(`./ue-rapier/${file}`);
      for (const [role, file] of Object.entries(rapierFiles)) {
        const asset = await rapierLoad(`${file}.glb`);
        const clip = getClip(asset, file, bones, fittedCharacter.scale.x);
        rapierClips[role] = clip.name;
        actions.set(`rapier:${role}`, mixer.clipAction(clip));
      }
      const samples = [];
      for (const sample of manifest.samples) {
        const asset = await rapierLoad(sample.file);
        const clip = getClip(asset, sample.file, bones, fittedCharacter.scale.x);
        const action = mixer.clipAction(clip);
        samples.push({...sample, action});
      }
      const swordAsset = await rapierLoad(manifest.sword.file);
      const sword = new T.Group();
      sword.name = 'Equipped rapier';
      sword.position.fromArray(manifest.sword.position);
      sword.quaternion.fromArray(manifest.sword.quaternion);
      sword.scale.fromArray(manifest.sword.scale);
      sword.add(swordAsset.scene);
      sword.traverse(node => {
        if (node.isMesh) node.castShadow = node.receiveShadow = true;
      });
      const hand = bones.get(manifest.sword.bone);
      if (!hand) throw new Error('The rapier attachment bone is unavailable.');
      hand.add(sword);
      sword.visible = false;
      rapier = {manifest, samples, sword, blend: createRapierBlendSpace(samples)};
      const notifyResponse = await fetch('./ue-rapier/attack-events.json');
      if (!notifyResponse.ok) throw new Error('The rapier notify data is unavailable.');
      const data = await notifyResponse.json(), textureLoader = new T.TextureLoader();
      const textureNames = {trail:'Trail_T', slash:'Flow_Sword_T', wave:'wave_T', spark:'Spark_T'};
      const textures = Object.fromEntries(await Promise.all(Object.entries(textureNames).map(async ([key, name]) => {
        const texture = await textureLoader.loadAsync(`./ue-rapier/effects/${name}.png`);
        texture.flipY = false;texture.wrapS = texture.wrapT = T.RepeatWrapping;
        return [key, texture];
      })));
      const slash = await rapierLoad('effects/circle_slash.glb');
      let slashGeometry;
      slash.scene.traverse(node=>{if(node.isMesh&&!slashGeometry)slashGeometry=node.geometry;});
      rapier.effects = createSwordEffects({parent:group,bones,data,textures,slashGeometry});
    } catch (error) {
      rapier = null;
      console.error('[NYC] Rapier assets failed validation', error);
    }
  } else if (manifestResponse.status !== 404) {
    throw new Error(`Unable to read rapier BlendSpace: HTTP ${manifestResponse.status}`);
  }
  group.userData.avatar = {source: 'Unreal Engine', clips, weapons: {rapier: rapierClips}};
  let active, wasGrounded = true, launchSpeed = 0;
  let forcedAction = null, weapon = null, blendPhase = 0;
  const movementKey = 'rapier:movement';
  const keyFor = role => weapon === 'rapier' && Object.hasOwn(rapierFiles, role) ? `rapier:${role}` : role;
  const actionFor = role => actions.get(keyFor(role));
  for (const key of ['Jump', 'rapier:Jump']) {
    const action = actions.get(key);
    if (action) {
      action.setLoop(T.LoopOnce, 1);
      action.clampWhenFinished = true;
    }
  }

  function fadePrevious() {
    if (active === movementKey) {
      for (const sample of rapier.samples) sample.action.fadeOut(fadeDuration);
    } else actions.get(active)?.fadeOut(fadeDuration);
  }

  function enter(role, restart = false) {
    const key = keyFor(role);
    const next = actions.get(key);
    if (active === key && !restart) return next;
    const previous = active;
    if (previous && previous !== key) fadePrevious();
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(playbackRates[role] ?? 1).play();
    if (previous && previous !== key) next.fadeIn(fadeDuration);
    active = key;
    group.userData.motion = role;
    return next;
  }

  function updateRapierMovement({dt, speed, sprinting, heading, velocityX, velocityZ}) {
    if (active !== movementKey) {
      fadePrevious();
      for (const sample of rapier.samples) {
        sample.action.reset().setLoop(T.LoopRepeat, Infinity).play().fadeIn(fadeDuration);
        sample.action.paused = true;
      }
      active = movementKey;
    }
    const [x, y] = rapierBlendInput({speed, heading, velocityX, velocityZ}, walkingSpeed);
    const weights = rapier.blend.weights(x, y);
    let cycleDuration = 0;
    rapier.samples.forEach((sample, i) => {
      cycleDuration += weights[i] * sample.action.getClip().duration / (sample.rateScale || 1);
    });
    blendPhase = (blendPhase + dt / Math.max(.1, cycleDuration)) % 1;
    rapier.samples.forEach((sample, i) => {
      sample.action.setEffectiveWeight(weights[i]);
      sample.action.time = blendPhase * sample.action.getClip().duration;
    });
    group.userData.motion = sprinting ? 'Running' : 'Walking';
    group.userData.blendspace = {position: [x, y], weights};
  }

  function setWeapon(next) {
    if (next !== null && (next !== 'rapier' || !rapier)) return false;
    if (next === weapon) return true;
    if (forcedAction) return false;
    weapon = next;
    rapier.sword.visible = weapon === 'rapier';
    group.userData.weapon = weapon;
    enter('Idle');
    return true;
  }

  enter('Idle');
  mixer.update(0);

  function getActionDuration(role) {
    if (!allActionRoles.includes(role)) return null;
    const action = actionFor(role);
    return action ? action.getClip().duration / (playbackRates[role] ?? 1) : null;
  }

  function getActionProgress(role = forcedAction?.role) {
    if (keyFor(role) !== active || !allActionRoles.includes(role)) return null;
    const action = actionFor(role);
    return action.time / action.getClip().duration;
  }

  function playAction(role, {
    duration = getActionDuration(role), reverse = false, hold = false, loop = false,
    startFraction = reverse ? 1 : 0,
  } = {}) {
    if (!allActionRoles.includes(role) || !actionFor(role)) return false;
    if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('Action duration must be positive.');
    if (!Number.isFinite(startFraction)) throw new RangeError('Action start fraction must be numeric.');
    const action = enter(role, true);
    const clipDuration = action.getClip().duration;
    action.setLoop(loop ? T.LoopRepeat : T.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = true;
    action.time = T.MathUtils.clamp(startFraction, 0, 1) * clipDuration;
    action.setEffectiveTimeScale((reverse ? -1 : 1) * clipDuration / duration);
    forcedAction = {role, hold};
    if (weapon === 'rapier') rapier.effects.begin(role);
    return true;
  }

  function clearAction() {
    forcedAction = null;
    rapier?.effects?.clear();
  }

  function update(state) {
    const {dt, speed, grounded, sprinting, heading, verticalSpeed} = state;
    group.rotation.y = heading;
    if (forcedAction) {
      wasGrounded = grounded;
      mixer.update(dt);
      if (weapon === 'rapier') rapier.effects.update(dt, actionFor(forcedAction.role).time);
      if (!forcedAction.hold && !actionFor(forcedAction.role).isRunning()) clearAction();
      return;
    }
    const jump = actionFor('Jump');
    const duration = jump.getClip().duration;
    const takeoff = weapon === 'rapier' ? .02 : jumpTakeoff;
    const touchdown = weapon === 'rapier' ? .9 : jumpTouchdown;
    if (!grounded) {
      if (wasGrounded || active !== keyFor('Jump')) {
        enter('Jump', true);
        launchSpeed = verticalSpeed > 0 ? verticalSpeed : 6.25;
      }
      jump.paused = true;
      const phase = T.MathUtils.clamp((1 - verticalSpeed / launchSpeed) * .5, 0, 1);
      jump.time = T.MathUtils.lerp(takeoff, touchdown, phase) * duration;
    } else if (!wasGrounded && active === keyFor('Jump')) {
      jump.time = touchdown * duration;
      jump.paused = false;
      jump.setEffectiveTimeScale((duration - jump.time) / landingDuration);
    } else if (active !== keyFor('Jump') || !jump.isRunning()) {
      if (weapon === 'rapier' && speed >= .12) updateRapierMovement(state);
      else enter(speed < .12 ? 'Idle' : sprinting ? 'Running' : 'Walking');
    }
    wasGrounded = grounded;
    if (active === 'Walking') {
      actions.get('Walking').setEffectiveTimeScale(Math.min(speed / fittedWalkingSpeed, 1.4));
    }
    mixer.update(dt);
  }

  return {group, update, walkingSpeed, getActionDuration, getActionProgress, playAction, clearAction,
    get effectsGroup() { return rapier?.effects?.group; },
    setWeapon, hasWeapon: name => name === 'rapier' && Boolean(rapier),
    get weapon() { return weapon; },
    get activeAction() { return forcedAction?.role ?? null; }};
}

export async function loadPlayerAvatar(scene) {
  if(typeof __NYC_HAS_UE_IDLE__==='undefined'||__NYC_HAS_UE_IDLE__){
    try{return await loadUEAvatar(scene);}
    catch(error){console.warn('[NYC] Unable to load the bundled UE avatar',error);}
  }
  const avatar = await loadPalmAvatar(scene);
  avatar.group.userData.avatar = {source: 'original'};
  return {...avatar, getActionDuration: () => null, getActionProgress: () => null,
    playAction: () => false, clearAction() {}, activeAction: null,
    hasWeapon: () => false, setWeapon: weapon => weapon === null, weapon: null};
}
