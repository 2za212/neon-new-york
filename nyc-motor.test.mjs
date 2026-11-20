import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Box3 } from 'three';
import { createMotor, cameraClearance } from './nyc-motor.js';
import { createTrafficShoulder } from './nyc-traffic-shoulder.js';

const still = { moveX: 0, moveZ: 0, sprint: false, jump: false };
const box = (x0, y0, z0, x1, y1, z1) => new Box3(
  new Vector3(x0, y0, z0), new Vector3(x1, y1, z1),
);

test('a moving van leaves a visible shoulder and restores the requested orbit after passing', () => {
  const body=box(0,0,0,1,1,1),car={x:1.72,y:.18,z:-25,fx:0,fz:-1,speed:4.35,bodies:[body]};
  const target=new Vector3(0,1.43,-32),orbit=target.clone().add(new Vector3(5.36,.20,-.604));
  const desired=new Vector3(),adjust=createTrafficShoulder([car],()=>[body]);
  let nearFrames=0,returned;
  for(let frame=0;frame<360;frame++){
    car.z=-25-frame*car.speed/60;
    body.min.set(.79,.28,car.z-2.1);body.max.set(2.65,2.35,car.z+2.1);
    desired.copy(orbit);adjust(target,desired,1/60);
    if(cameraClearance(target,orbit,[body])<.62){
      nearFrames++;
      assert.ok(cameraClearance(target,desired,[body])>1.25);
    }
    returned=desired.distanceTo(orbit)<.00001;
  }
  assert.ok(nearFrames>30);
  assert.ok(returned);
});

test('vehicle avoidance respects a low canopy and cannot bypass a wall blocking the original view', () => {
  const body=box(.79,.28,-34.1,2.65,2.35,-29.9),car={x:1.72,y:.18,z:-32,fx:0,fz:-1,speed:0,bodies:[body]};
  const target=new Vector3(0,1.43,-32),orbit=target.clone().add(new Vector3(5.36,.20,-.604));
  const roof=box(-5,2.65,-42,7,3,-22),side=box(-1.4,-1,-42,-.85,4,-22);
  const solids=[body,roof,side],adjust=createTrafficShoulder([car],()=>solids);
  const desired=orbit.clone();assert.ok(adjust(target,desired,1/60,true));
  const free=cameraClearance(target,desired,solids);
  assert.ok(free>1.25);
  const camera=desired.clone().sub(target).setLength(free).add(target);
  assert.ok(camera.y<roof.min.y-.20);
  assert.ok(camera.x>side.max.x+.20);
  const wall=box(.31,-1,-42,.54,4,-22);
  const behindWall=createTrafficShoulder([car],()=>[wall,body]);desired.copy(orbit);
  for(let i=0;i<30;i++)assert.equal(behindWall(target,desired,1/60),false);
  assert.ok(desired.equals(orbit));
});
function makeWorld(colliders = [], walkSurfaces = []) {
  return {
    bounds: { minX: -30, maxX: 30, minZ: -30, maxZ: 30 },
    baseHeight: 0, colliders, walkSurfaces,
  };
}
function advance(motor, frames, input = still, yaw = 0, dt = 1 / 60) {
  let result;
  for (let i = 0; i < frames; i++) result = motor.update(dt, input, yaw);
  return result;
}
function assertOutside(motor, solid, message) {
  if (motor.position.y >= solid.max.y || motor.position.y + motor.height <= solid.min.y) return;
  const x = Math.max(solid.min.x, Math.min(solid.max.x, motor.position.x));
  const z = Math.max(solid.min.z, Math.min(solid.max.z, motor.position.z));
  assert.ok(Math.hypot(motor.position.x - x, motor.position.z - z) >= motor.radius - .001, message);
}

test('W follows the camera yaw; D stays on its right', () => {
  const forward = createMotor(makeWorld(), new Vector3());
  advance(forward, 60, { ...still, moveZ: 1 }, 0);
  assert.ok(forward.position.z < -2.5);
  assert.ok(Math.abs(forward.position.x) < 1e-8);
  const rotated = createMotor(makeWorld(), new Vector3());
  advance(rotated, 60, { ...still, moveZ: 1 }, Math.PI / 2);
  assert.ok(rotated.position.x < -2.5);
  assert.ok(Math.abs(rotated.position.z) < 1e-8);
  const right = createMotor(makeWorld(), new Vector3());
  advance(right, 60, { ...still, moveX: 1 }, Math.PI / 2);
  assert.ok(right.position.z < -2.5);
  assert.ok(Math.abs(right.position.x) < 1e-8);
});

test('diagonal movement does not exceed straight-line speed', () => {
  const straight = createMotor(makeWorld(), new Vector3());
  const diagonal = createMotor(makeWorld(), new Vector3());
  advance(straight, 60, { ...still, moveZ: 1 });
  advance(diagonal, 60, { ...still, moveZ: 1, moveX: 1 });
  assert.ok(Math.abs(straight.position.length() - diagonal.position.length()) < 1e-7);
});

test('an avatar walk speed applies to walking while sprint uses the scene speed', () => {
  const motor = createMotor(makeWorld(), new Vector3(), 1.35);
  const walking = advance(motor, 90, { ...still, moveZ: 1 });
  assert.ok(Math.abs(walking.speed - 1.35) < 1e-6);
  assert.equal(walking.sprinting, false);
  const sprinting = advance(motor, 90, { ...still, moveZ: 1, sprint: true });
  assert.ok(Math.abs(sprinting.speed - 6.6) < 1e-6);
  assert.equal(sprinting.sprinting, true);
});

test('a grounded punch holds position and heading until normal movement resumes', () => {
  const motor = createMotor(makeWorld(), new Vector3());
  const walking = advance(motor, 20, { ...still, moveZ: 1 });
  const before = motor.position.clone();
  const intent = { ...still, moveX: 1, sprint: true, jump: true, punching: true };
  const result = advance(motor, 25, intent, Math.PI / 2);
  assert.ok(motor.position.distanceToSquared(before) < 1e-10);
  assert.equal(result.grounded, true);
  assert.equal(result.sprinting, false);
  assert.equal(result.heading, walking.heading);
  assert.equal(result.speed, 0);
  const resumed = advance(motor, 60, { ...still, moveX: 1, sprint: true });
  assert.ok(resumed.speed > 6.59 && resumed.sprinting);
  assert.ok(motor.position.x > before.x + 5);
});

test('walking and sprinting stop at a wall', () => {
  const wall = box(0, 0, -5, .15, 8, 5);
  for (const sprint of [false, true]) {
    const motor = createMotor(makeWorld([wall]), new Vector3(-2, 0, 0));
    for (let i = 0; i < 120; i++) {
      motor.update(1 / 60, { ...still, moveX: 1, sprint }, 0);
      assertOutside(motor, wall, `penetrated wall at frame ${i}`);
    }
    assert.ok(motor.position.x <= -motor.radius + .001);
  }
});

test('large frame deltas cannot tunnel through a thin wall', () => {
  const wall = box(0, 0, -5, .025, 8, 5);
  const motor = createMotor(makeWorld([wall]), new Vector3(-2, 0, 0));
  for (let i = 0; i < 45; i++) {
    motor.update(.8, { ...still, moveX: 1, sprint: true }, 0);
    assertOutside(motor, wall, `tunnelled at frame ${i}`);
    assert.ok(motor.position.x < 0);
  }
});

test('diagonal approach cannot pass through an outside corner', () => {
  const building = box(0, 0, 0, 5, 12, 5);
  const motor = createMotor(makeWorld([building]), new Vector3(-2, 0, -2));
  for (let i = 0; i < 180; i++) {
    motor.update(1 / 60, { ...still, moveX: 1, moveZ: -1, sprint: true }, 0);
    assertOutside(motor, building, `corner penetration at frame ${i}`);
  }
});

test('a player can slide along a wall instead of getting stuck', () => {
  const wall = box(0, 0, -20, .2, 6, 20);
  const motor = createMotor(makeWorld([wall]), new Vector3(-1, 0, 0));
  advance(motor, 120, { ...still, moveX: 1, moveZ: 1 });
  assert.ok(motor.position.z < -4);
  assert.ok(motor.position.x <= -motor.radius + .001);
});

test('walk surfaces let the player climb an 18 cm curb', () => {
  const curb = box(0, 0, -2, 5, .18, 2);
  const surface = { minX: 0, maxX: 5, minZ: -2, maxZ: 2, y: .18 };
  const motor = createMotor(makeWorld([curb], [surface]), new Vector3(-.8, 0, 0));
  advance(motor, 40, { ...still, moveX: 1 });
  assert.ok(motor.position.x > .5, 'should cross the curb edge');
  assert.ok(Math.abs(motor.position.y - .18) < 1e-7);
  assert.ok(motor.grounded);
});

test('a jump rises, lands, and becomes grounded again', () => {
  const motor = createMotor(makeWorld(), new Vector3());
  motor.update(1 / 60, { ...still, jump: true }, 0);
  assert.ok(!motor.grounded);
  let highest = motor.position.y;
  for (let i = 0; i < 150; i++) {
    motor.update(1 / 60, still, 0);
    highest = Math.max(highest, motor.position.y);
  }
  assert.ok(highest > .85 && highest < 1.2);
  assert.equal(motor.position.y, 0);
  assert.equal(motor.velocity.y, 0);
  assert.ok(motor.grounded);
});

test('consecutive risers keep leading-edge support without falling into the steps', () => {
  const risers=[box(0,0,-1,.35,.18,1),box(.35,0,-1,.70,.36,1),box(.70,0,-1,2,.54,1)];
  const surfaces=risers.map(b=>({minX:b.min.x,maxX:b.max.x,minZ:-1,maxZ:1,y:b.max.y}));
  const motor=createMotor(makeWorld(risers,surfaces),new Vector3(-.8,0,0));
  let previous=0;
  for(let frame=0;frame<90&&motor.position.x<1.6;frame++){
    motor.update(1/60,{...still,moveX:1},0);
    assert.ok(motor.position.y>=previous-1e-7,`dropped from ${previous} to ${motor.position.y} at frame ${frame}`);
    assert.ok(motor.grounded,`lost step support at frame ${frame}`);
    for(const riser of risers)assertOutside(motor,riser,`embedded in a riser at frame ${frame}`);
    previous=motor.position.y;
  }
  assert.ok(motor.position.x>1.5);
  assert.ok(Math.abs(motor.position.y-.54)<1e-7);
});

test('landing support follows the circular capsule edge and releases beyond it', () => {
  const ledge=box(0,0,-1,1,.54,1),surface={minX:0,maxX:1,minZ:-1,maxZ:1,y:.54};
  const motor=createMotor(makeWorld([ledge],[surface]),new Vector3(.5,.54,0));
  motor.position.set(1.26,.54,0);
  motor.update(1/60,still,0);
  assert.equal(motor.position.y,.54,'the same leading edge used for stepping must remain supported');
  assert.ok(motor.grounded);
  motor.position.set(1.26,.54,1.26);
  motor.update(1/60,still,0);
  assert.ok(motor.position.y<.54,'a diagonal corner outside the circle cannot support the player');
  assert.ok(!motor.grounded);
});

test('automatic stepping still rejects a riser without standing headroom', () => {
  const step=box(0,0,-1,3,.18,1),ceiling=box(-2,1.85,-2,4,2.5,2);
  const motor=createMotor(makeWorld([step,ceiling]),new Vector3(-.8,0,0));
  for(let frame=0;frame<90;frame++){
    motor.update(1/60,{...still,moveX:1},0);
    assertOutside(motor,step);assertOutside(motor,ceiling);
    assert.ok(motor.position.y+motor.height<1.85);
  }
  assert.ok(motor.position.x<=-motor.radius+.001);
  assert.equal(motor.position.y,0);
});

test('a building cannot snap a walking player onto its roof', () => {
  const building = box(0, 0, -5, 5, 12, 5);
  const roof = { minX: 0, maxX: 5, minZ: -5, maxZ: 5, y: 12 };
  const motor = createMotor(makeWorld([building], [roof]), new Vector3(-1, 0, 0));
  for (let i = 0; i < 180; i++) {
    motor.update(1 / 60, { ...still, moveX: 1, jump: i === 20 }, 0);
    assert.ok(motor.position.y < 1.2, `unexpected roof teleport at frame ${i}`);
    assertOutside(motor, building);
  }
});

test('an elevated deck does not create a wall beneath it', () => {
  const deck = box(0, 2.4, -3, 4, 3, 3);
  const roof = { minX: 0, maxX: 4, minZ: -3, maxZ: 3, y: 3 };
  const motor = createMotor(makeWorld([deck], [roof]), new Vector3(-1, 0, 0));
  advance(motor, 120, { ...still, moveX: 1 });
  assert.ok(motor.position.x > 4);
  assert.equal(motor.position.y, 0);
});

test('jumping under a low deck stops at its underside', () => {
  const deck = box(-3, 2.2, -3, 3, 3, 3);
  const motor = createMotor(makeWorld([deck]), new Vector3());
  let highest = 0;
  for (let i = 0; i < 120; i++) {
    motor.update(1 / 60, { ...still, jump: i === 0 }, 0);
    highest = Math.max(highest, motor.position.y);
    assert.ok(motor.position.y + motor.height <= 2.2 + 1e-8);
  }
  assert.ok(highest > .3);
  assert.ok(motor.grounded);
});

test('camera distance stops before an ordinary wall', () => {
  const wall = box(2, 0, -3, 2.3, 4, 3);
  const target = new Vector3(0, 1.3, 0);
  const desired = new Vector3(7, 1.3, 0);
  const distance = cameraClearance(target, desired, [wall]);
  assert.ok(distance > 1 && distance < 2 - .24);
});

test('a wide opaque street fixture clears the shoulder frame at its end', () => {
  const rack = box(-6.25, .36, 74.01, -4.85, 2.78, 77.19);
  const target = new Vector3(-6, 1.43, 80);
  const desired = new Vector3(-7.02, 1.92, 74.72);
  rack.userData = {cameraPadding: .56};
  assert.ok(cameraClearance(target, desired, [rack]) < 3);
  const passing=new Vector3(-6.58,1.43,76);
  assert.equal(cameraClearance(passing,new Vector3(-9.58,1.43,76),[rack]),3);
});

test('the greenway camera clears the handrail while the runner and opaque walls still collide', () => {
  const floor=6.51;
  const rail=box(-10,floor,-.54,10,floor+1.02,-.44);
  const target=new Vector3(0,floor+1.25,0);
  const boom=new Vector3(-.451,.035,-.892).normalize().multiplyScalar(5.4);
  const desired=target.clone().add(boom);
  assert.ok(cameraClearance(target,desired,[rail])<.3);
  rail.userData={cameraPadding:.06};
  assert.equal(cameraClearance(target,desired,[rail]),target.distanceTo(desired));
  const wall=box(-10,floor,-2.9,10,floor+3,-2.8);
  assert.equal(cameraClearance(target,desired,[rail,wall]),cameraClearance(target,desired,[wall]));
  assert.ok(cameraClearance(target,desired,[wall])<3);
  const world={...makeWorld([rail]),baseHeight:floor};
  const motor=createMotor(world,new Vector3(0,floor,0));
  advance(motor,120,{...still,moveZ:1,sprint:true});
  assertOutside(motor,rail);
  assert.ok(motor.position.z>=rail.max.z+motor.radius-.001);
});

test('an unrelated wall outside the camera segment does not shorten it', () => {
  const wall = box(2, 0, 3, 3, 4, 4);
  const target = new Vector3(0, 1.3, 0);
  const desired = new Vector3(7, 1.3, 0);
  assert.equal(cameraClearance(target, desired, [wall]), 7);
});

test('near a wall, the camera probe still keeps its padding clear', () => {
  // The player center is .31m off the wall, a valid radius-sized separation.
  // The .24m camera probe therefore has only .07m of available travel.
  const wall = box(.31, 0, -3, .6, 4, 3);
  const target = new Vector3(0, 1.3, 0);
  const desired = new Vector3(5, 1.3, 0);
  const padding = .24;
  const distance = cameraClearance(target, desired, [wall], padding);
  assert.ok(distance + padding <= .31 + 1e-8,
    `returned ${distance}m, placing the probe ${distance + padding - .31}m into the wall`);
});
