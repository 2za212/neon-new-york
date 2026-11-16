import * as T from 'three';

const clamp = T.MathUtils.clamp;

// Feet coordinates are used throughout. Vertical ranges are checked as well as
// XZ, so the player can walk under the elevated greenway without an air wall.
export function createMotor(world, spawn) {
  const position = spawn.clone();
  const velocity = new T.Vector3();
  const radius = .31, height = 1.75, stepHeight = .36;
  const solids = world.colliders || [];
  let grounded = true, heading = Math.PI, speed = 0;

  function groundAt(x, z, limit = Infinity) {
    if (world.ground) return world.ground(x, z, limit);
    let y = world.baseHeight ?? 0;
    for (const s of world.walkSurfaces || []) {
      if (x >= s.minX && x <= s.maxX && z >= s.minZ && z <= s.maxZ && s.y <= limit + .001) y = Math.max(y, s.y);
    }
    return y;
  }

  function touchesFootprint(b,x,z){
    const cx=clamp(x,b.min.x,b.max.x),cz=clamp(z,b.min.z,b.max.z);
    return (x-cx)**2+(z-cz)**2<radius**2-.00001;
  }

  function overlaps(x, z, foot) {
    for (const b of solids) {
      if (foot + height - .06 <= b.min.y || foot + .07 >= b.max.y) continue;
      if (touchesFootprint(b,x,z)) return true;
    }
    return false;
  }

  function horizontal(dx, dz) {
    const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .12));
    const bounds = world.bounds;
    for (let i = 0; i < count; i++) {
      const nextX = clamp(position.x + dx / count, bounds.minX + radius, bounds.maxX - radius);
      const nextZ = clamp(position.z + dz / count, bounds.minZ + radius, bounds.maxZ - radius);
      const floorX = stepFloor(nextX, position.z);
      const testFootX = grounded ? Math.max(position.y, floorX) : position.y;
      if ((!world.isPlayable||world.isPlayable(nextX,position.z,radius))&&!overlaps(nextX, position.z, testFootX)) {
        position.x = nextX;
        if (grounded && floorX > position.y) position.y = floorX;
      }
      const floorZ = stepFloor(position.x, nextZ);
      const testFootZ = grounded ? Math.max(position.y, floorZ) : position.y;
      if ((!world.isPlayable||world.isPlayable(position.x,nextZ,radius))&&!overlaps(position.x, nextZ, testFootZ)) {
        position.z = nextZ;
        if (grounded && floorZ > position.y) position.y = floorZ;
      }
    }
  }

  function stepFloor(x, z) {
    let y = groundAt(x, z, position.y + stepHeight);
    if (!grounded) return y;
    // Probe the capsule's leading edge, before its centre crosses the curb.
    // overlaps() still checks headroom at this candidate step height.
    for (const b of solids) {
      if (b.max.y <= position.y + .01 || b.max.y > position.y + stepHeight) continue;
      if (touchesFootprint(b,x,z)) y = Math.max(y, b.max.y);
    }
    return y;
  }

  function update(dt, input, yaw) {
    dt = Math.min(dt, .05);
    const length = Math.max(1, Math.hypot(input.moveX, input.moveZ));
    const strafe = input.moveX / length, forward = input.moveZ / length;
    const walkSpeed = input.sprint ? 6.6 : 3.4;
    const tx = (Math.cos(yaw) * strafe - Math.sin(yaw) * forward) * walkSpeed;
    const tz = (-Math.sin(yaw) * strafe - Math.cos(yaw) * forward) * walkSpeed;
    const blend = 1 - Math.exp(-dt * (grounded ? 15 : 5));
    velocity.x = T.MathUtils.lerp(velocity.x, tx, blend);
    velocity.z = T.MathUtils.lerp(velocity.z, tz, blend);
    if (input.jump && grounded) { velocity.y = 6.25; grounded = false; }

    horizontal(velocity.x * dt, velocity.z * dt);
    const oldY = position.y;
    velocity.y -= 18 * dt;
    position.y += velocity.y * dt;

    // Cancel upward movement at the underside of an elevated platform.
    if (velocity.y > 0) {
      for (const b of solids) {
        if (position.x + radius <= b.min.x || position.x - radius >= b.max.x || position.z + radius <= b.min.z || position.z - radius >= b.max.z) continue;
        if (oldY + height <= b.min.y + .03 && position.y + height >= b.min.y) {
          position.y = b.min.y - height - .01; velocity.y = 0;
        }
      }
    }

    let floor = groundAt(position.x, position.z, Math.max(oldY, position.y) + .03);
    // A collider's top is also a landing surface, but only when crossed from
    // above; this cannot snap a walking character onto a building roof.
    if (velocity.y <= 0) {
      for (const b of solids) {
        if (b.max.y > oldY + .04 || b.max.y < position.y - .04) continue;
        // Keep the support that horizontal stepping just found at the leading
        // capsule edge. A narrower landing probe drops the player back into
        // each riser before the centre crosses it, producing repeated jitter.
        // The circle test also rejects unsupported diagonal box corners.
        if (touchesFootprint(b,position.x,position.z)) floor = Math.max(floor, b.max.y);
      }
    }
    if (position.y <= floor && velocity.y <= 0) {
      position.y = floor; velocity.y = 0; grounded = true;
    } else grounded = false;
    speed = Math.hypot(velocity.x, velocity.z);
    if (speed > .12) {
      const desired = Math.atan2(velocity.x, velocity.z);
      const delta = Math.atan2(Math.sin(desired - heading), Math.cos(desired - heading));
      heading += delta * (1 - Math.exp(-dt * 15));
    }
    if (!Number.isFinite(position.y) || position.y < -8) reset();
    return { speed, heading, grounded, sprinting: !!input.sprint && speed > 3.7 };
  }

  function reset(facing=Math.PI) {
    position.copy(spawn); velocity.set(0, 0, 0); grounded = true; heading = facing; speed = 0;
    position.y = groundAt(position.x, position.z, spawn.y + .4);
  }
  reset();
  return { position, velocity, radius, height, update, reset, groundAt, get grounded() { return grounded; } };
}

// Slab intersection for the whole camera segment against expanded world
// bounds. A .24 m probe keeps the near plane outside walls and roof edges.
export function cameraClearance(target, desired, colliders, padding = .24) {
  const delta = new T.Vector3().subVectors(desired, target);
  const distance = delta.length();
  if (distance < .001) return 0;
  delta.divideScalar(distance);
  let nearest = distance;
  for (const b of colliders) {
    let lo = 0, hi = distance;
    for (const axis of ['x', 'y', 'z']) {
      const min = b.min[axis] - padding, max = b.max[axis] + padding;
      if (Math.abs(delta[axis]) < 1e-7) {
        if (target[axis] < min || target[axis] > max) { hi = -1; break; }
      } else {
        const a = (min - target[axis]) / delta[axis], c = (max - target[axis]) / delta[axis];
        lo = Math.max(lo, Math.min(a, c)); hi = Math.min(hi, Math.max(a, c));
        if (lo > hi) break;
      }
    }
    if (lo <= hi && hi >= 0 && lo >= 0) nearest = Math.min(nearest, Math.max(0, lo - .12));
  }
  return nearest;
}
