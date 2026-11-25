import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3, Group, MathUtils, PerspectiveCamera, Scene, Vector3} from 'three';
import {createCombat} from './nyc-combat.js';
import {createMotor} from './nyc-motor.js';

const dt = 1 / 60;
const still = {moveX: 0, moveZ: 0, sprint: false};
const durations = {
  'dodge-forward': .667, 'dodge-left': .667, 'dodge-right': .667, 'dodge-back': .667,
  punch: .864, 'charged-punch': 1.033, hurt: .733, death: 1.5,
  'skill-1': 1.433, 'skill-2': 1.017, 'skill-3': 3.25,
  'meditate-enter': 1.7, 'meditate-rise': 2.6, 'meditate-idle': 3.333,
};

function setup(colliders = [], patrolHome, mystic = false) {
  const scene = new Scene();
  const world = {
    spawn: new Vector3(),
    bounds: {minX: -25, maxX: 25, minZ: -25, maxZ: 25},
    colliders,
  };
  const motor = createMotor(world, world.spawn);
  const played = [];
  let clip;
  const avatar = {
    group:new Group(),
    getActionDuration: role => durations[role] ?? null,
    getActionProgress: role => clip?.role === role ? clip.progress : null,
    playAction(role, options) {
      played.push({role, ...options});
      clip = {...options, role, progress: options.startFraction ?? (options.reverse ? 1 : 0)};
      return true;
    },
    clearAction() { clip = null; },
    update() {
      if (!clip) return;
      const next = clip.progress + dt / durations[clip.role] * (clip.reverse ? -1 : 1);
      clip.progress = clip.loop ? MathUtils.euclideanModulo(next, 1) : MathUtils.clamp(next, 0, 1);
    },
  };
  const visuals = [];
  const effects = {
    play(role) { visuals.push(role); },
    update() {},
    clear() { visuals.length = 0; },
  };
  const mysticContext=mystic?{camera:new PerspectiveCamera(),assets:{}}:undefined;
  const combat = createCombat({scene,world,motor,avatar,effects,patrolHome,mysticContext});

  function step(impulse = {}, {input = still, yaw = 0, npc = false} = {}) {
    const movement = combat.beforeMove(dt, input, impulse, yaw);
    const moving = motor.update(dt, movement, yaw);
    const heading = combat.update(dt, moving, npc);
    avatar.update();
    return heading;
  }

  function advance(seconds, options) {
    for (let frame = 0; frame < Math.ceil(seconds / dt); frame++) step({}, options);
  }

  function until(predicate, options, maxFrames = 650) {
    for (let frame = 0; frame < maxFrames; frame++) {
      if (predicate(combat.getState())) return;
      step({}, options);
    }
    assert.fail('Combat did not reach the expected state.');
  }

  return {combat, motor, played, visuals, step, advance, until};
}

test('pump patrol stays at its post beyond sight, approaches from range and resets at that post', () => {
  const post=new Vector3(0,0,-12);
  const {combat,motor,advance}=setup([],post);
  advance(.8,{npc:true});
  assert.deepEqual(combat.getState().npcPosition,post.toArray());
  motor.position.z=-6;
  advance(.8,{npc:true});
  assert.ok(combat.getState().npcPosition[2]>post.z+.5);
  combat.reset();
  assert.deepEqual(combat.getState().npcPosition,post.toArray());
  assert.equal(combat.getState().npcHP,96);
  motor.position.fromArray(combat.getState().zone);
  assert.equal(combat.meditate(),false);
});

test('each dodge moves once in the requested camera-relative direction', () => {
  for (const [dodge, axis, expectedSign] of [
    ['forward', 'x', -1], ['left', 'z', 1], ['right', 'z', -1], ['back', 'x', 1],
  ]) {
    const {combat, motor, played, step, advance} = setup();
    const options = {yaw: Math.PI / 2};
    step({dodge}, options);
    assert.equal(combat.getState().role, `dodge-${dodge}`);
    advance(1, {yaw: options.yaw + .6});
    assert.equal(combat.getState().role, null);
    assert.deepEqual(played.map(clip => clip.role), [`dodge-${dodge}`]);
    assert.ok(motor.position[axis] * expectedSign > 1, dodge);
    assert.ok(Math.abs(motor.position[axis === 'x' ? 'z' : 'x']) < 1e-8, dodge);
    const finalPosition = motor.position.clone();
    advance(.4, options);
    assert.deepEqual(motor.position.toArray(), finalPosition.toArray());
  }
});

test('a single punch hits once after startup and leaves the player in place', () => {
  const {combat, motor, played, step, advance} = setup();
  motor.position.z = -2;
  step({punch: true});
  assert.equal(combat.getState().role, 'punch');
  assert.equal(combat.getState().npcHP, 200);
  advance(.5);
  assert.equal(combat.getState().npcHP, 188);
  advance(1);
  assert.equal(combat.getState().npcHP, 188);
  assert.equal(combat.getState().role, null);
  assert.deepEqual(played.map(clip => clip.role), ['punch']);
  assert.equal(motor.position.z, -2);
});

test('a second click queues a charged punch and step during the first swing', () => {
  const {combat, motor, played, step, advance, until} = setup();
  motor.position.z = -2;
  step({punch: true});
  advance(.2);
  step({punch: true});
  assert.equal(combat.getState().role, 'punch');
  until(state => state.role === 'charged-punch');
  assert.equal(motor.position.z, -2);
  advance(1.25);
  assert.ok(motor.position.z < -2.5);
  assert.ok(combat.getState().npcPosition[2] < motor.position.z);
  assert.equal(combat.getState().npcHP, 160);
  assert.deepEqual(played.map(clip => clip.role), ['punch', 'charged-punch']);
});

test('the charged punch stays planted during windup and dashes once on release', () => {
  const wall = new Box3(new Vector3(-1, 0, -1.1), new Vector3(1, 2, -1.04));
  for (const blocked of [false, true]) {
    const {combat, motor, step, advance, until} = setup(blocked ? [wall] : []);
    step({punch: true});
    step({punch: true});
    until(state => state.role === 'charged-punch');
    advance(.55);
    assert.equal(motor.position.z, 0);
    assert.equal(combat.getState().npcHP, 200);

    advance(.14);
    if (blocked) {
      assert.ok(motor.position.z >= wall.max.z + motor.radius - 1e-8);
      assert.ok(motor.position.z < -.6);
      assert.equal(combat.getState().npcHP, 200);
    } else {
      assert.ok(Math.abs(motor.position.z + 2.5) < 1e-8);
      assert.equal(combat.getState().npcHP, 172);
    }
    const positionAfterRelease = motor.position.clone();
    advance(.75);
    assert.deepEqual(motor.position.toArray(), positionAfterRelease.toArray());
    assert.equal(combat.getState().role, null);
  }
});

test('a click during the recovery window charges, while a late click starts a new punch', () => {
  for (const [wait, expected] of [[.2, 'charged-punch'], [.7, 'punch']]) {
    const {combat, step, advance, until} = setup();
    step({punch: true});
    until(state => state.role === null);
    assert.equal(combat.getState().comboReady, true);
    advance(wait);
    step({punch: true});
    assert.equal(combat.getState().role, expected);
  }
});

test('three skills launch their respective effects and apply damage after startup', () => {
  for (const [key, damage] of [[1, 24], [2, 32], [3, 40]]) {
    const {combat, visuals, step, advance} = setup();
    const role = `skill-${key}`;
    step({skill: key});
    assert.equal(combat.getState().role, role);
    assert.deepEqual(visuals, [role]);
    assert.equal(combat.getState().npcHP, 200);
    advance(durations[role] + .2);
    assert.equal(combat.getState().npcHP, 200 - damage);
    assert.equal(combat.getState().role, null);
  }
  const wall = new Box3(new Vector3(-1, 0, -2.1), new Vector3(1, 3, -1.9));
  const blocked = setup([wall]);
  blocked.step({skill: 2});
  blocked.advance(1.4);
  assert.equal(blocked.combat.getState().npcHP, 200);
});

test('meditation is gated by the zone and exits in reverse from the current phase', () => {
  const {combat, motor, played, advance, until} = setup();
  assert.equal(combat.meditate(), false);
  motor.position.fromArray(combat.getState().zone);
  assert.equal(combat.meditate(), true);
  advance(.4, {input: {moveX: 1, moveZ: 0, sprint: true}});
  assert.deepEqual(motor.position.toArray(), combat.getState().zone);
  assert.equal(combat.meditate(), true);
  assert.equal(played.at(-1).role, 'meditate-enter');
  assert.equal(played.at(-1).reverse, true);
  assert.ok(played.at(-1).startFraction > .2 && played.at(-1).startFraction < .3);
  until(state => state.role === null);

  played.length = 0;
  assert.equal(combat.meditate(), true);
  until(state => state.role === 'meditate-idle');
  advance(.4);
  assert.equal(combat.meditate(), true);
  const reverseIdle = played.at(-1);
  assert.equal(reverseIdle.role, 'meditate-idle');
  assert.equal(reverseIdle.reverse, true);
  assert.ok(reverseIdle.startFraction > 0 && reverseIdle.startFraction < .3);
  until(state => state.role === null);
  assert.deepEqual(played.map(({role, loop = false, reverse = false}) => [role, loop, reverse]), [
    ['meditate-enter', false, false], ['meditate-rise', false, false], ['meditate-idle', true, false],
    ['meditate-idle', false, true], ['meditate-rise', false, true], ['meditate-enter', false, true],
  ]);
});

test('NPC damage turns the player toward the attacker, locks death and resets cleanly', () => {
  const {combat, motor, played, visuals, step, advance, until} = setup();
  motor.position.set(.65, 0, -2.5);
  const options = {npc: true};
  until(state => state.playerHP < 100, options);
  const hurt = combat.getState();
  assert.equal(hurt.role, 'hurt');
  assert.equal(hurt.playerHP, 84);
  const [npcX, , npcZ] = hurt.npcPosition;
  assert.ok(Math.abs(hurt.heading - Math.atan2(npcX - motor.position.x, npcZ - motor.position.z)) < 1e-8);
  until(state => state.role === 'death', options, 950);
  assert.equal(combat.getState().playerHP, 0);
  assert.deepEqual(played.at(-1), {role: 'death', hold: true});
  const deadPosition = motor.position.clone();
  const moving = {npc: true, input: {moveX: 1, moveZ: 1, sprint: true}};
  step({punch: true, dodge: 'forward', skill: 1, jump: true}, moving);
  advance(2, moving);
  assert.equal(combat.getState().role, 'death');
  assert.deepEqual(motor.position.toArray(), deadPosition.toArray());

  motor.reset();
  combat.reset();
  const reset = combat.getState();
  assert.equal(reset.role, null);
  assert.equal(reset.playerHP, 100);
  assert.equal(reset.npcHP, 200);
  assert.equal(reset.npcPhase, 'idle');
  assert.equal(reset.feedback, '');
  assert.deepEqual(visuals, []);
  assert.deepEqual(motor.position.toArray(), [0, 0, 0]);
});

test('instant slash moves the actual player once and leaves the player at the landing', () => {
  const {combat,motor,step,until,advance}=setup([],undefined,true);
  const npc={npc:true};
  step({mystic:{id:'rift',aimed:false}},npc);
  until(state=>state.mystic.last?.id==='rift',npc);
  assert.equal(combat.getState().npcHP,158);
  const landing=motor.position.toArray();
  assert.deepEqual(combat.getState().mystic.last.landing,landing);
  assert.ok(Math.hypot(landing[0],landing[2])>3);
  advance(.12,npc);
  assert.deepEqual(motor.position.toArray(),landing);
});

test('a solid wall blocks the slash and keeps the player at the cast position', () => {
  const wall=new Box3(new Vector3(-3,0,-2),new Vector3(3,2,-1.8));
  const {combat,motor,step,advance}=setup([wall],undefined,true);
  step({mystic:{id:'rift',aimed:false}},{npc:true});
  advance(.8,{npc:true});
  assert.equal(combat.getState().npcHP,200);
  assert.equal(combat.getState().mystic.id,null);
  assert.deepEqual(motor.position.toArray(),[0,0,0]);
});