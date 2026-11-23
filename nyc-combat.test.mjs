import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3, MathUtils, Scene, Vector3} from 'three';
import {createCombat} from './nyc-combat.js';
import {createMotor} from './nyc-motor.js';
import {createEquipment} from './nyc-equipment.js';

const dt = 1 / 60;
const still = {moveX: 0, moveZ: 0, sprint: false};
const durations = {
  'dodge-forward': .667, 'dodge-left': .667, 'dodge-right': .667, 'dodge-back': .667,
  punch: .864, 'charged-punch': 1.033, hurt: .733, death: 1.5,
  'skill-1': 1.433, 'skill-2': 1.017, 'skill-3': 3.25,
  'meditate-enter': 1.7, 'meditate-rise': 2.6, 'meditate-idle': 3.333,
  'slash-1': 1.6, 'slash-2': 1.566667, 'slash-3': 1.6,
  knockdown: 1.5, rise: 1.233333,
};
const rapierDurations = {'skill-1': 2.466667, 'skill-2': 2.8, 'skill-3': 3.333333};

function setup(colliders = [], patrolHome) {
  const scene = new Scene();
  const world = {
    spawn: new Vector3(),
    bounds: {minX: -25, maxX: 25, minZ: -25, maxZ: 25},
    colliders,
  };
  const motor = createMotor(world, world.spawn);
  const played = [];
  let clip, weapon = null;
  const clipDuration = role => weapon === 'rapier' ? rapierDurations[role] ?? durations[role] : durations[role];
  const avatar = {
    getActionDuration: role => clipDuration(role) ?? null,
    getActionProgress: role => clip?.role === role ? clip.progress : null,
    playAction(role, options) {
      played.push({role, ...options});
      clip = {...options, role, duration: clipDuration(role), progress: options.startFraction ?? (options.reverse ? 1 : 0)};
      return true;
    },
    clearAction() { clip = null; },
    update() {
      if (!clip) return;
      const next = clip.progress + dt / clip.duration * (clip.reverse ? -1 : 1);
      clip.progress = clip.loop ? MathUtils.euclideanModulo(next, 1) : MathUtils.clamp(next, 0, 1);
    },
  };
  const visuals = [];
  const effectDetails = [];
  const effects = {
    play(role, position, heading, range, width, impactTime) {
      visuals.push(role);
      effectDetails.push({role, range, width, impactTime});
    },
    update() {},
    clear() { visuals.length = 0; },
  };
  let combat;
  const equipment = createEquipment({
    canChange: () => combat?.canChangeEquipment() ?? true,
    apply: next => { weapon = next; return true; },
  });
  combat = createCombat({scene, world, motor, avatar, effects, patrolHome, equipment});

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

  return {combat, equipment, motor, played, visuals, effectDetails, step, advance, until};
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

test('equipping a rapier changes locomotion facing and leaves the unarmed combo available after unequipping', () => {
  const {combat, equipment, motor, step, advance, until} = setup();
  assert.equal(equipment.setWeapon('rapier'), true);
  const heading = step({}, {input: {moveX: 1, moveZ: 0}, yaw: Math.PI / 2});
  assert.equal(combat.getState().weapon, 'rapier');
  assert.ok(heading > Math.PI);
  advance(.3);
  assert.equal(equipment.setWeapon(null), true);
  step({punch: true});
  assert.equal(combat.getState().role, 'punch');
  assert.equal(equipment.setWeapon('rapier'), false);
  until(state => state.role === null);
  assert.equal(equipment.setWeapon('rapier'), true);
  step({punch: true});
  assert.equal(combat.getState().role, 'slash-1');
  motor.velocity.y = 4;
  step();
  assert.equal(equipment.setWeapon(null), false);
});

test('rapier slashes require three clicks and buffer at most the next single slash', () => {
  const {combat, equipment, motor, played, step, advance, until} = setup();
  equipment.setWeapon('rapier');
  motor.position.z = -2;
  step({punch: true});
  assert.equal(combat.getState().role, 'slash-1');
  step({punch: true});
  step({punch: true});
  until(state => state.role === 'slash-2');
  until(state => state.role === null);
  assert.equal(combat.getState().npcHP, 164);
  assert.deepEqual(played.map(item => item.role), ['slash-1', 'slash-2']);
  assert.equal(combat.getState().comboNext, 'slash-3');
  step({punch: true});
  assert.equal(combat.getState().role, 'slash-3');
  step({punch: true});
  until(state => state.role === null);
  assert.equal(combat.getState().npcHP, 136);
  assert.equal(combat.getState().comboReady, false);
  advance(.1);
  step({punch: true});
  assert.equal(combat.getState().role, 'slash-1');
});

test('a single sword click ends after one slash and an expired combo begins at the first slash', () => {
  const {combat, equipment, played, step, advance, until} = setup();
  equipment.setWeapon('rapier');
  step({punch: true});
  until(state => state.role === null);
  assert.deepEqual(played.map(item => item.role), ['slash-1']);
  advance(.6);
  step({punch: true});
  assert.equal(combat.getState().role, 'slash-1');
  assert.deepEqual(played.map(item => item.role), ['slash-1', 'slash-1']);
});

test('rapier QER skills hit once per sword strike without the unarmed spell effects', () => {
  for (const [skill, hits, damage] of [[1,3,24],[2,4,32],[3,6,40]]) {
    const {combat,equipment,motor,visuals,effectDetails,step,advance}=setup();
    equipment.setWeapon('rapier');motor.position.z=-1.2;step({skill});
    assert.equal(combat.getState().npcHP,200);
    const changes=new Set();
    for(let frame=0;frame<240;frame++){step();const hp=combat.getState().npcHP;if(hp<200)changes.add(hp);}
    assert.equal(changes.size,hits);assert.equal(combat.getState().npcHP,200-damage);
    assert.deepEqual(visuals,[]);assert.deepEqual(effectDetails,[]);
    advance(.4);assert.equal(combat.getState().npcHP,200-damage);
  }
});

test('buffered sword attacks skip recovery after completing their damage swing',()=>{
  const {combat,equipment,motor,step,advance}=setup();equipment.setWeapon('rapier');motor.position.z=-1;
  step({punch:true});step({punch:true});advance(.48);
  assert.equal(combat.getState().role,'slash-1');assert.equal(combat.getState().npcHP,184);
  advance(.1);assert.equal(combat.getState().role,'slash-2');
  step({punch:true});advance(.58);assert.equal(combat.getState().role,'slash-3');
});

test('sword skills cannot damage distant targets or hit through a wall',()=>{
  for(const blocked of [false,true])for(const skill of [1,2,3]){
    const wall=new Box3(new Vector3(-2,0,-2.8),new Vector3(2,3,-2.6));
    const {combat,equipment,motor,step,advance}=setup(blocked?[wall]:[]);
    equipment.setWeapon('rapier');motor.position.z=blocked?-1.1:2;
    step({skill});advance(4);assert.equal(combat.getState().npcHP,200);
  }
});

test('an extended sword window reaches a target near its edge only once',()=>{
  const {combat,equipment,motor,step,advance}=setup();equipment.setWeapon('rapier');motor.position.z=-.9;
  step({punch:true});advance(.4);assert.equal(combat.getState().npcHP,184);
  advance(.5);assert.equal(combat.getState().npcHP,184);
});

test('damage clears the rapier combo and equipment changes remain blocked through knockdown and rise', () => {
  const {combat, equipment, motor, played, step, until} = setup();
  equipment.setWeapon('rapier');
  step({punch: true});
  step({punch: true});
  const attacker = new Vector3(3, 0, 2);
  assert.equal(combat.receiveDamage(10, attacker), true);
  assert.equal(combat.getState().role, 'hurt');
  assert.equal(combat.getState().comboReady, false);
  until(state => state.role === null);
  assert.equal(played.some(item => item.role === 'slash-2'), false);
  assert.equal(combat.receiveDamage(10, attacker, {knockdown: true, impulse: new Vector3(-3, 16, 0)}), true);
  assert.equal(combat.getState().role, 'knockdown');
  assert.equal(equipment.setWeapon(null), false);
  step();
  assert.equal(motor.grounded, false);
  until(() => !motor.grounded && motor.velocity.y < 0);
  assert.equal(combat.getState().role, 'knockdown');
  until(() => !motor.grounded && motor.velocity.y < -12);
  assert.equal(combat.getState().role, 'knockdown');
  step({punch: true, skill: 2, dodge: 'forward', jump: true});
  until(state => state.role === 'rise');
  assert.equal(motor.grounded, true);
  assert.equal(equipment.setWeapon(null), false);
  until(state => state.role === null);
  assert.equal(equipment.setWeapon(null), true);
});

test('a lethal hit interrupts knockdown or rise and death blocks all action inputs', () => {
  for (const stage of ['knockdown', 'rise']) {
    const {combat, equipment, motor, step, advance, until} = setup();
    equipment.setWeapon('rapier');
    step();
    combat.receiveDamage(5, new Vector3(0, 0, -3), {knockdown: true});
    if (stage === 'rise') until(state => state.role === 'rise');
    assert.equal(combat.receiveDamage(1000, new Vector3(1, 0, -3)), true);
    assert.equal(combat.getState().role, 'death');
    assert.equal(equipment.setWeapon(null), false);
    advance(1.5);
    const position = motor.position.clone();
    step({punch: true, skill: 1, dodge: 'forward', jump: true}, {input: {moveX: 1, moveZ: 1}});
    assert.deepEqual(motor.position.toArray(), position.toArray());
    assert.equal(combat.getState().role, 'death');
    combat.reset();
    assert.equal(combat.getState().weapon, 'rapier');
    assert.equal(combat.canChangeEquipment(), true);
  }
});

test('the third NPC hit knocks the equipped rapier user down', () => {
  const {combat, equipment, motor, until} = setup();
  equipment.setWeapon('rapier');
  motor.position.z = -2.5;
  until(state => state.npcHeavyAttack, {npc: true}, 1000);
  until(state => state.role === 'knockdown', {npc: true}, 100);
  assert.equal(combat.getState().playerHP, 52);
});
