import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loadPalmAvatar} from './nyc-palm-avatar.js';

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
};

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
  const lift = groundLifts[clip.name.replace(/_\d+$/, '')];
  if (lift) {
    const root = bones.get('root').position;
    const times = lift.map((_, frame) => clip.duration * frame / 32);
    const positions = lift.flatMap(y => [root.x, root.y + y / modelScale, root.z]);
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
  group.userData.avatar = {source: 'Unreal Engine', clips};
  const jump = actions.get('Jump').setLoop(T.LoopOnce, 1);
  jump.clampWhenFinished = true;
  const jumpDuration = jump.getClip().duration;
  let active, wasGrounded = true, launchSpeed = 0;
  let forcedAction = null;

  function enter(role, restart = false) {
    if (active === role && !restart) return;
    const previous = actions.get(active);
    const next = actions.get(role);
    if (previous && previous !== next) previous.fadeOut(fadeDuration);
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(playbackRates[role] ?? 1).play();
    if (previous && previous !== next) next.fadeIn(fadeDuration);
    active = role;
    group.userData.motion = role;
    return next;
  }

  enter('Idle');
  mixer.update(0);

  function getActionDuration(role) {
    if (!actionRoles.includes(role)) return null;
    const action = actions.get(role);
    return action ? action.getClip().duration / (playbackRates[role] ?? 1) : null;
  }

  function getActionProgress(role = forcedAction?.role) {
    if (role !== active || !actionRoles.includes(role)) return null;
    const action = actions.get(role);
    return action.time / action.getClip().duration;
  }

  function playAction(role, {
    duration = getActionDuration(role), reverse = false, hold = false, loop = false,
    startFraction = reverse ? 1 : 0,
  } = {}) {
    if (!actionRoles.includes(role) || !actions.has(role)) return false;
    if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('Action duration must be positive.');
    if (!Number.isFinite(startFraction)) throw new RangeError('Action start fraction must be numeric.');
    const action = enter(role, true);
    const clipDuration = action.getClip().duration;
    action.setLoop(loop ? T.LoopRepeat : T.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = true;
    action.time = T.MathUtils.clamp(startFraction, 0, 1) * clipDuration;
    action.setEffectiveTimeScale((reverse ? -1 : 1) * clipDuration / duration);
    forcedAction = {role, hold};
    return true;
  }

  function clearAction() {
    forcedAction = null;
  }

  function update({dt, speed, grounded, sprinting, heading, verticalSpeed}) {
    group.rotation.y = heading;
    if (forcedAction) {
      wasGrounded = grounded;
      mixer.update(dt);
      if (!forcedAction.hold && !actions.get(forcedAction.role).isRunning()) clearAction();
      return;
    }
    if (!grounded) {
      if (wasGrounded || active !== 'Jump') {
        enter('Jump', true);
        launchSpeed = verticalSpeed > 0 ? verticalSpeed : 6.25;
      }
      jump.paused = true;
      const phase = T.MathUtils.clamp((1 - verticalSpeed / launchSpeed) * .5, 0, 1);
      jump.time = T.MathUtils.lerp(jumpTakeoff, jumpTouchdown, phase) * jumpDuration;
    } else if (!wasGrounded && active === 'Jump') {
      jump.time = jumpTouchdown * jumpDuration;
      jump.paused = false;
      jump.setEffectiveTimeScale((jumpDuration - jump.time) / landingDuration);
    } else if (active !== 'Jump' || !jump.isRunning()) {
      enter(speed < .12 ? 'Idle' : sprinting ? 'Running' : 'Walking');
    }
    wasGrounded = grounded;
    if (active === 'Walking') {
      // Match the stride to horizontal speed. Cap the brief walk-to-sprint transition.
      actions.get('Walking').setEffectiveTimeScale(Math.min(speed / fittedWalkingSpeed, 1.4));
    }
    mixer.update(dt);
  }

  return {group, update, walkingSpeed, getActionDuration, getActionProgress, playAction, clearAction,
    get activeAction() { return forcedAction?.role ?? null; }};
}

export async function loadPlayerAvatar(scene) {
  try {
    return await loadUEAvatar(scene);
  } catch (error) {
    console.warn('[NYC] UE character unavailable, using the original character', error);
    const avatar = await loadPalmAvatar(scene);
    avatar.group.userData.avatar = {source: 'original'};
    return {...avatar, getActionDuration: () => null, getActionProgress: () => null,
      playAction: () => false, clearAction() {}, activeAction: null};
  }
}
