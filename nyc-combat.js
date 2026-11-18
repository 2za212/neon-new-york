import * as T from 'three';
import {cameraClearance, createMotor} from './nyc-motor.js';

const attacks = {
  punch: {damage: 12, range: 1.7, width: .78, hit: .43},
  'charged-punch': {damage: 28, range: 2.0, width: .9, hit: 19 / 30},
  'skill-1': {damage: 24, range: 5, width: 1.1, hit: .57},
  'skill-2': {damage: 32, range: 7, width: .95, hit: .56},
  'skill-3': {damage: 40, range: 6.5, width: 2.4, hit: .67},
};
const dodges = {
  forward: [0, 1, 1.25], left: [-1, 0, 1.05],
  right: [1, 0, 1.05], back: [0, -1, 1.15],
};
const skills = ['skill-1', 'skill-2', 'skill-3'];
const meditation = ['meditate-enter', 'meditate-rise', 'meditate-idle'];
const maxPlayerHP = 100;
const maxNpcHP = 200;
const npcDamage = 16;
const comboWindow = .55;
// In A_Attack2 the pushing foot and punching arm release together here.
const chargedDash = {start: 17 / 30, end: 20 / 30, distance: 2.5};

export function hasCombatClips(avatar) {
  return [...Object.keys(attacks), ...Object.keys(dodges).map(direction => `dodge-${direction}`),
    ...meditation, 'hurt', 'death'].every(role => avatar.getActionDuration(role) > 0);
}

function createDummy(scene) {
  const group = new T.Group();
  group.name = '练习傀儡';
  const rig = new T.Group();
  group.add(rig);
  const box = new T.BoxGeometry(1, 1, 1);
  const wood = new T.MeshStandardMaterial({color: '#956447', roughness: .92});
  const cloth = new T.MeshStandardMaterial({color: '#802f37', roughness: .85});
  const armor = new T.MeshStandardMaterial({color: '#495662', roughness: .65, metalness: .28});
  const eyes = new T.MeshBasicMaterial({color: '#ffc77a'});
  function part(parent, material, x, y, z, sx, sy, sz) {
    const mesh = new T.Mesh(box, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
  }
  part(rig, cloth, 0, 1.05, 0, .52, .52, .26);
  part(rig, armor, 0, .85, 0, .56, .095, .28);
  part(rig, wood, 0, 1.48, 0, .39, .35, .34);
  part(rig, armor, 0, 1.64, 0, .43, .09, .37);
  const limbs = [];
  for (const side of [-1, 1]) {
    part(rig, eyes, side * .085, 1.51, .173, .075, .046, .008);
    const arm = new T.Group(), leg = new T.Group();
    arm.position.set(side * .35, 1.26, 0);
    leg.position.set(side * .15, .76, 0);
    rig.add(arm, leg);
    part(arm, armor, 0, -.12, 0, .18, .30, .21);
    part(arm, wood, 0, -.37, .02, .17, .24, .19);
    part(leg, cloth, 0, -.31, 0, .21, .62, .22);
    part(leg, armor, 0, -.68, .043, .24, .16, .31);
    limbs.push({arm, leg, side});
  }
  scene.add(group);
  return {group, rig, limbs, eyes};
}

function travel(action, dt, from, to, meters) {
  const phase = time => T.MathUtils.clamp((time / action.duration - from) / (to - from), 0, 1);
  return meters * (phase(action.elapsed + dt) - phase(action.elapsed));
}

export function createCombat({scene, world, motor, avatar, effects}) {
  const home = world.spawn.clone().add(new T.Vector3(0, 0, -3.6));
  const npcMotor = createMotor(world, home, 2.25);
  const npc = createDummy(scene);
  const zone = world.spawn.clone().add(new T.Vector3(-2.8, 0, 2.6));
  zone.y = motor.groundAt(zone.x, zone.z, world.spawn.y + .45);
  const zoneRadius = 1.25;
  const circle = new T.Mesh(
    new T.RingGeometry(zoneRadius - .065, zoneRadius, 40),
    new T.MeshBasicMaterial({color: '#79e3d5', transparent: true, opacity: .72, side: T.DoubleSide, depthWrite: false}),
  );
  circle.name = '打坐区';
  circle.rotation.x = -Math.PI / 2;
  circle.position.copy(zone).y += .028;
  circle.userData.excludeFromAO = true;
  scene.add(circle);
  const rayFrom = new T.Vector3(), rayTo = new T.Vector3();
  const wallColliders = world.cameraColliders || world.colliders;
  let action, time, playerHP, npcHP, npcPhase, npcTimer, npcAggro, npcHitTimer, npcFall;
  let comboUntil, queuedCombo, heading, lastDamage, lastDamageTimer;

  function reset() {
    action = null;
    time = comboUntil = npcTimer = npcHitTimer = npcFall = lastDamageTimer = 0;
    heading = Math.PI;
    playerHP = maxPlayerHP;
    npcHP = maxNpcHP;
    npcPhase = 'idle';
    npcAggro = queuedCombo = false;
    lastDamage = '';
    npcMotor.reset();
    npc.group.position.copy(npcMotor.position);
    npc.group.rotation.y = 0;
    npc.rig.rotation.x = 0;
    for (const {arm, leg} of npc.limbs) arm.rotation.x = leg.rotation.x = 0;
    avatar.clearAction();
    effects.clear();
  }
  reset();

  function zoneDistance() {
    return Math.hypot(motor.position.x - zone.x, motor.position.z - zone.z);
  }

  function canMeditate() {
    return zoneDistance() <= zoneRadius && motor.grounded && Math.abs(motor.position.y - zone.y) < .3;
  }

  function begin(role, options = {}) {
    const duration = avatar.getActionDuration(role);
    if (!duration || !avatar.playAction(role, options)) return false;
    const span = options.startFraction ?? (options.reverse ? 1 : 0);
    action = {role, duration, elapsed: 0, end: options.reverse ? span * duration : duration,
      reversed: Boolean(options.reverse), loop: Boolean(options.loop), hit: false};
    return true;
  }

  function endAction() {
    action = null;
    avatar.clearAction();
  }

  function meditate() {
    if (playerHP <= 0) return true;
    const stage = meditation.indexOf(action?.role);
    if (stage !== -1) {
      if (!action.reversed) {
        const startFraction = avatar.getActionProgress(action.role) ?? 1;
        if (startFraction <= .001 && stage > 0) begin(meditation[stage - 1], {reverse: true});
        else if (startFraction <= .001) endAction();
        else begin(action.role, {reverse: true, startFraction});
      }
      return true;
    }
    if (!canMeditate()) return false;
    if (!action) {
      comboUntil = 0;
      begin(meditation[0]);
    }
    return true;
  }

  function setDamage(text) {
    lastDamage = text;
    lastDamageTimer = 1.8;
  }

  function clearSight(from, to) {
    rayFrom.copy(from).y += .9;
    rayTo.copy(to).y += .9;
    return cameraClearance(rayFrom, rayTo, wallColliders, .04) >= rayFrom.distanceTo(rayTo) - .06;
  }

  function hitPlayer() {
    if (!playerHP || (action?.role.startsWith('dodge-') && action.elapsed / action.duration < .76)) return;
    if (skills.includes(action?.role) && !action.hit) effects.clear();
    playerHP = Math.max(0, playerHP - npcDamage);
    comboUntil = 0;
    queuedCombo = false;
    heading = Math.atan2(npcMotor.position.x - motor.position.x, npcMotor.position.z - motor.position.z);
    begin(playerHP ? 'hurt' : 'death', {hold: !playerHP});
    setDamage(playerHP ? `受到 ${npcDamage} 点伤害` : '角色倒下');
  }

  function strike(spec) {
    if (!npcHP) return;
    const dx = npcMotor.position.x - motor.position.x, dz = npcMotor.position.z - motor.position.z;
    const forward = dx * Math.sin(heading) + dz * Math.cos(heading);
    const lateral = dx * Math.cos(heading) - dz * Math.sin(heading);
    const impact = action.impact;
    const inRange = impact
      ? Math.hypot(npcMotor.position.x - impact.x, npcMotor.position.z - impact.z) <= spec.width
      : forward >= -.22 && forward <= spec.range && Math.abs(lateral) <= spec.width;
    if (!inRange || Math.abs(npcMotor.position.y - motor.position.y) > 1.05 ||
        !clearSight(motor.position, npcMotor.position)) return;
    npcHP = Math.max(0, npcHP - spec.damage);
    npcAggro = true;
    npcHitTimer = .25;
    npcPhase = npcHP ? 'recover' : 'dead';
    npcTimer = npcHP ? (spec === attacks.punch ? .86 : .32) : 0;
    setDamage(npcHP ? `傀儡受到 ${spec.damage} 点伤害` : `傀儡已击倒 · ${spec.damage} 点伤害`);
  }

  function attack(role) {
    queuedCombo = false;
    comboUntil = 0;
    if (!begin(role)) return;
    if (skills.includes(role)) {
      const spec = attacks[role];
      let range = spec.range, effectHeading = heading;
      if (role === 'skill-3') {
        const dx = npcMotor.position.x - motor.position.x, dz = npcMotor.position.z - motor.position.z;
        const forward = dx * Math.sin(heading) + dz * Math.cos(heading);
        const lateral = dx * Math.cos(heading) - dz * Math.sin(heading);
        const distance = Math.hypot(dx, dz);
        if (npcHP && forward > .2 && Math.abs(lateral) <= spec.width && distance <= range &&
            clearSight(motor.position, npcMotor.position)) {
          range = distance;
          effectHeading = Math.atan2(dx, dz);
        }
        action.impact = new T.Vector3(
          motor.position.x + range * Math.sin(effectHeading), motor.position.y,
          motor.position.z + range * Math.cos(effectHeading),
        );
      }
      effects.play(role, motor.position, effectHeading, range, spec.width, action.duration * spec.hit);
    }
  }

  function choose(input, impulse, yaw) {
    if (!playerHP || !motor.grounded) return;
    if (action) {
      if (action.role === 'punch' && impulse.punch) queuedCombo = true;
      return;
    }
    if (impulse.dodge) {
      comboUntil = 0;
      if (begin(`dodge-${impulse.dodge}`)) {
        action.yaw = yaw;
        heading = yaw + Math.PI;
      }
    } else if (impulse.skill) {
      attack(skills[impulse.skill - 1]);
    } else if (impulse.punch) {
      attack(comboUntil > time ? 'charged-punch' : 'punch');
    } else if (input.moveX || input.moveZ || impulse.jump) comboUntil = 0;
  }

  function beforeMove(dt, input, impulse, yaw) {
    choose(input, impulse, yaw);
    if (!action) return {...input, jump: impulse.jump};
    const dodge = action.role.startsWith('dodge-') ? dodges[action.role.slice(6)] : null;
    let x = 0, z = 0;
    if (dodge) {
      const distance = travel(action, dt, .08, .72, dodge[2]);
      // Match the pressed camera-relative direction while the clip faces its
      // local dodge direction, including moving backward without turning around.
      const angle = action.yaw;
      x = distance * (Math.cos(angle) * dodge[0] - Math.sin(angle) * dodge[1]);
      z = distance * (-Math.sin(angle) * dodge[0] - Math.cos(angle) * dodge[1]);
    } else if (action.role === 'hurt') {
      const distance = travel(action, dt, .04, .56, .55);
      x = -Math.sin(heading) * distance;
      z = -Math.cos(heading) * distance;
    } else if (action.role === 'charged-punch') {
      const distance = travel(action, dt, chargedDash.start, chargedDash.end, chargedDash.distance);
      const sin = Math.sin(heading), cos = Math.cos(heading);
      const dx = npcMotor.position.x - motor.position.x, dz = npcMotor.position.z - motor.position.z;
      const forward = dx * sin + dz * cos;
      const lateral = dx * cos - dz * sin;
      const nearTarget = npcHP && forward >= 0 && Math.abs(lateral) < .48 &&
        Math.abs(npcMotor.position.y - motor.position.y) < .8;
      const step = nearTarget ? Math.min(distance, Math.max(0, forward - .6)) : distance;
      x = sin * step;
      z = cos * step;
    }
    return {actionMove: {x, z, heading}};
  }

  function updateNPC(dt, active) {
    const position = npcMotor.position;
    const dx = motor.position.x - position.x, dz = motor.position.z - position.z;
    const distance = Math.hypot(dx, dz);
    const height = Math.abs(motor.position.y - position.y);
    npcHitTimer = Math.max(0, npcHitTimer - dt);
    let speed = 0;
    if (active && npcHP && playerHP) {
      if (distance < 2 && height < 1 && clearSight(position, motor.position)) npcAggro = true;
      if (distance > 10 || position.distanceTo(home) > 9) npcAggro = false;
      npcTimer -= dt;
      if (npcPhase === 'windup' && npcTimer <= 0) {
        if (distance <= 1.85 && height < 1.05 && clearSight(position, motor.position)) hitPlayer();
        npcPhase = 'recover';
        npcTimer = .86;
      } else if (npcPhase === 'recover' && npcTimer <= 0) {
        npcPhase = 'idle';
      } else if (npcPhase === 'idle') {
        if (npcAggro && distance <= 1.65 && height < 1.05 && clearSight(position, motor.position)) {
          npcPhase = 'windup';
          npcTimer = .48;
        } else {
          const destination = npcAggro ? motor.position : home;
          const x = destination.x - position.x, z = destination.z - position.z;
          if (Math.hypot(x, z) > (npcAggro ? 1.35 : .18)) {
            const facing = Math.atan2(x, z);
            speed = npcMotor.update(dt, {moveX: 0, moveZ: 1}, facing - Math.PI).speed;
            npc.group.rotation.y = facing;
          }
        }
      }
      if (npcAggro) npc.group.rotation.y = Math.atan2(dx, dz);
    }
    npc.group.position.copy(position);
    if (!npcHP) npcFall = Math.min(1, npcFall + dt * 3);
    npc.rig.rotation.x = npcFall * -Math.PI / 2 - npcHitTimer * .45;
    npc.eyes.color.set(npcPhase === 'windup' ? '#ff581c' : '#ffc77a');
    for (const {arm, leg, side} of npc.limbs) {
      const swing = Math.sin(time * 13) * side * Math.min(.6, speed * .3);
      leg.rotation.x = swing;
      arm.rotation.x = npcPhase !== 'windup' ? -swing : side === 1 ? -1.25 : -.35;
    }
  }

  function update(dt, moving, active = true) {
    time += dt;
    lastDamageTimer = Math.max(0, lastDamageTimer - dt);
    if (!action) heading = moving.heading;
    if (action && action.role !== 'death') {
      action.elapsed += dt;
      const spec = attacks[action.role];
      if (spec && !action.hit && action.elapsed >= action.duration * spec.hit) {
        action.hit = true;
        strike(spec);
      }
      if (!action.loop && action.elapsed >= action.end) {
        const {role, reversed} = action;
        const stage = meditation.indexOf(role);
        if (stage !== -1) {
          const next = stage + (reversed ? -1 : 1);
          if (!meditation[next]) endAction();
          else begin(meditation[next], {reverse: reversed, loop: !reversed && next === 2});
        } else if (role === 'punch' && queuedCombo) {
          attack('charged-punch');
          // The mixer advances the newly queued clip later in this same frame.
          action.elapsed = dt;
        } else {
          if (role === 'punch') comboUntil = time + comboWindow;
          endAction();
        }
      }
    }
    updateNPC(dt, active);
    effects.update(dt);
    return heading;
  }

  function getState() {
    return {
      role: action?.role ?? null,
      reversed: action?.reversed ?? false,
      playerHP, maxPlayerHP, npcHP, maxNpcHP,
      npcPhase, npcPosition: npcMotor.position.toArray(),
      heading, zone: zone.toArray(), zoneDistance: zoneDistance(), canMeditate: canMeditate(),
      comboReady: action?.role === 'punch' || comboUntil > time,
      feedback: lastDamageTimer > 0 ? lastDamage : '',
    };
  }

  return {beforeMove, update, meditate, reset, getState};
}
