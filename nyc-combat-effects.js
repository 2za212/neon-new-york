import * as T from 'three';

/*
 * Visuals adapted from the supplied Elemental Sandbox (Frost Lance, Storm
 * Lance and Cinder Fall). Crystal profile and meteor path adapted from
 * src/assets/ProceduralGeometry.js and src/abilities/MeteorAbility.js.
 *
 * MIT License
 * Copyright (c) 2026 mohamedachrefelouafi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const tau = Math.PI * 2;
const up = new T.Vector3(0, 1, 0);
const unit = value => T.MathUtils.clamp(value, 0, 1);
const mix = T.MathUtils.lerp;

function noise(seed) {
  const value = Math.sin(seed * 71.319) * 24315.398;
  return value - Math.floor(value);
}

function glow(color, blending = T.AdditiveBlending) {
  return new T.MeshBasicMaterial({
    color, blending, transparent: true, opacity: 0,
    depthWrite: false, side: T.DoubleSide, toneMapped: false,
  });
}

function crystalGeometry(seed) {
  const sides = 6;
  const offset = noise(seed) * tau;
  const rings = [0, .22, .5, .75, .92].map(y =>
    Array.from({length: sides}, (_, index) => {
      const angle = offset + index * tau / sides + (noise(seed + index * 7.7) - .5) * .22;
      const radius = .5 * (.13 + .87 * Math.pow(1 - y, 1.15));
      const drift = .12 * Math.pow(y, 1.6);
      return [Math.cos(angle) * radius + drift, y, Math.sin(angle) * radius];
    })
  );
  const points = [], colors = [];
  const base = new T.Color('#075786'), tip = new T.Color('#dbfbff'), shade = new T.Color();
  function triangle(a, b, c, light) {
    for (const point of [a, b, c]) {
      points.push(...point);
      shade.copy(base).lerp(tip, unit(point[1] * .7 + light * .4));
      colors.push(shade.r, shade.g, shade.b);
    }
  }
  for (let layer = 0; layer < rings.length; layer++) {
    for (let index = 0; index < sides; index++) {
      const next = (index + 1) % sides, light = noise(seed + index);
      const lower = rings[layer], upper = rings[layer + 1];
      if (upper) {
        triangle(lower[index], upper[index], lower[next], light);
        triangle(upper[index], upper[next], lower[next], light);
      } else {
        triangle(lower[index], [.12, 1, 0], lower[next], light);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  return geometry;
}

function ring(group, color, x, z, width = .035) {
  const mesh = new T.Mesh(new T.RingGeometry(1 - width, 1, 40), glow(color));
  mesh.position.set(x, .045, z);
  mesh.rotation.x = -Math.PI / 2;
  group.add(mesh);
  return mesh;
}

function frost(group, distance, radius) {
  const crystal = crystalGeometry(11);
  const surface = glow('#ffffff', T.NormalBlending);
  surface.vertexColors = true;
  const shards = Array.from({length: 24}, (_, index) => {
    const tip = index > 17;
    const along = tip ? 1 : .12 + .84 * (index + .45) / 18;
    const localSeed = 19 + index * 17.8;
    const width = tip ? radius : mix(.16, radius * .6, along);
    const height = mix(.28, 1.06, along * along) * mix(.58, 1.38, noise(localSeed));
    const mesh = new T.Mesh(crystal, surface);
    mesh.position.set((noise(localSeed + 1) * 2 - 1) * width, .025, along * distance);
    if (tip) mesh.position.z += (noise(localSeed + 2) * 2 - 1) * width * .55;
    mesh.rotation.set((noise(localSeed + 3) - .5) * .55, localSeed, (noise(localSeed + 4) - .5) * .55);
    mesh.visible = false;
    group.add(mesh);
    return {mesh, height, width: .16 + height * .39, delay: along * .24};
  });
  const impact = ring(group, '#71eaff', 0, distance, .055);
  return {
    duration: .95,
    update(age) {
      surface.opacity = 1 - unit((age - .55) / .4);
      for (const shard of shards) {
        const emerge = unit((age - shard.delay) / .14);
        shard.mesh.visible = emerge > 0;
        const height = shard.height * (1 - Math.pow(1 - emerge, 3));
        shard.mesh.scale.set(shard.width, height, shard.width);
      }
      const wave = unit((age - .24) / .36);
      impact.scale.setScalar(mix(.2, radius, wave));
      impact.material.opacity = .65 * Math.sin(wave * Math.PI);
    },
  };
}

function storm(group, distance, radius) {
  const sections = 18, strands = 4;
  const segment = new T.CylinderGeometry(1, 1, 1, 5, 1, true);
  const outer = new T.InstancedMesh(segment, glow('#4a75ff'), sections * strands);
  const core = new T.InstancedMesh(segment, glow('#cef3ff'), sections * strands);
  const impact = ring(group, '#8b9eff', 0, distance, .07);
  outer.instanceMatrix.setUsage(T.DynamicDrawUsage);
  core.instanceMatrix.setUsage(T.DynamicDrawUsage);
  outer.frustumCulled = core.frustumCulled = false;
  group.add(outer, core);
  const point = new T.Vector3(), previous = new T.Vector3(), axis = new T.Vector3();
  const piece = new T.Object3D();
  let strikes = -1;
  return {
    duration: .58,
    update(age) {
      const fade = 1 - unit((age - .12) / .46);
      const flash = .62 + noise(Math.floor(age * 40) + 27) * .38;
      outer.material.opacity = flash * fade * .5;
      core.material.opacity = flash * fade;
      const wave = unit((age - .06) / .4);
      impact.scale.setScalar(mix(.06, radius, wave));
      impact.material.opacity = .85 * Math.sin(wave * Math.PI);
      const step = Math.floor(age * 28);
      if (strikes === step) return;
      strikes = step;
      let visibleSegments = 0;
      const front = Math.max(1, Math.ceil(unit(age / .055) * sections));
      for (let strand = 0; strand < strands; strand++) {
        previous.set(.18, .92, .36);
        for (let index = 1; index <= front; index++) {
          const t = index / sections, seed = index * 19.3 + strand * 53.7 + step * 47.1;
          const spread = Math.sin(Math.PI * t) * (strand === 0 ? .22 : .54);
          point.set(
            mix(.18, 0, t) + (2 * noise(seed) - 1) * spread,
            mix(.92, .22, t) + (2 * noise(seed + 3) - 1) * spread + .13 * Math.sin(Math.PI * t),
            mix(.36, distance, t)
          );
          axis.subVectors(point, previous);
          const length = axis.length();
          piece.position.copy(point).lerp(previous, .5);
          piece.quaternion.setFromUnitVectors(up, axis.normalize());
          const size = strand === 0 ? .027 : .012;
          piece.scale.set(size * 3.5, length * 1.1, size * 3.5);
          piece.updateMatrix();
          outer.setMatrixAt(visibleSegments, piece.matrix);
          piece.scale.set(size, length * 1.04, size);
          piece.updateMatrix();
          core.setMatrixAt(visibleSegments++, piece.matrix);
          previous.copy(point);
        }
      }
      outer.count = core.count = visibleSegments;
      outer.instanceMatrix.needsUpdate = core.instanceMatrix.needsUpdate = true;
    },
  };
}

function cinder(group, distance, radius, impactDelay) {
  const rock = new T.IcosahedronGeometry(1, 0);
  const ember = new T.Mesh(rock, glow('#ff8f2e'));
  const shell = new T.Mesh(rock, glow('#8f270d', T.NormalBlending));
  shell.scale.setScalar(.265);
  ember.scale.setScalar(.4);
  group.add(ember, shell);
  const trailMaterial = glow('#ff5922');
  const trail = Array.from({length: 10}, () => {
    const mesh = new T.Mesh(rock, trailMaterial);
    group.add(mesh);
    return mesh;
  });
  const fragmentMaterial = glow('#ff9138');
  const fragments = Array.from({length: 18}, () => {
    const mesh = new T.Mesh(rock, fragmentMaterial);
    group.add(mesh);
    return mesh;
  });
  const shock = ring(group, '#ff782d', 0, distance, .08);
  const crater = ring(group, '#ff9c3d', 0, distance, .025);
  const flight = Math.max(.03, impactDelay);
  const height = Math.min(2.25, .3 * distance + .45);
  function arc(t, mesh) {
    mesh.position.set(.18 * (1 - t), mix(.95, .14, t) + height * Math.sin(t * Math.PI), mix(.4, distance, t));
  }
  return {
    duration: flight + .88,
    update(age) {
      const t = unit(age / flight);
      ember.visible = shell.visible = t < 1;
      ember.material.opacity = .43 + .18 * t;
      shell.material.opacity = 1;
      arc(t, ember);
      shell.position.copy(ember.position);
      shell.rotation.set(t * 3.5, t * 6.2, t * 2);
      trailMaterial.opacity = .35 * (1 - unit((age - flight) / .12));
      for (let index = 0; index < trail.length; index++) {
        const tail = trail[index], time = t - (index + 1) * .035;
        tail.visible = time > 0 && trailMaterial.opacity > 0;
        arc(unit(time), tail);
        tail.scale.setScalar(mix(.26, .035, index / trail.length));
      }
      const sinceImpact = age - flight;
      const wave = unit(sinceImpact / .46);
      shock.scale.setScalar(mix(.12, radius, wave));
      shock.material.opacity = .8 * Math.sin(wave * Math.PI);
      crater.scale.setScalar(radius * .62);
      crater.material.opacity = sinceImpact > 0 ? .52 * (1 - unit(sinceImpact / .88)) : 0;
      fragmentMaterial.opacity = .95 * (1 - unit(sinceImpact / .7));
      for (let index = 0; index < fragments.length; index++) {
        const particle = fragments[index], angle = index * 2.399963, speed = mix(.7, 1.4, noise(index + 12));
        const travel = radius * wave * speed;
        particle.visible = sinceImpact >= 0;
        particle.position.set(Math.cos(angle) * travel, .07 + Math.sin(Math.PI * wave) * speed, distance + Math.sin(angle) * travel);
        particle.scale.setScalar(mix(.04, .135, noise(index + 34)) * (1 - wave * .7));
        particle.rotation.set(angle + wave * 6, wave * 7, angle);
      }
    },
  };
}

const spells = {
  'skill-1': {make: frost, distance: 5, radius: 1, lead: .24},
  'skill-2': {make: storm, distance: 7, radius: .8, lead: .06},
  'skill-3': {make: cinder, distance: 7, radius: 2},
};

export function createCombatEffects(scene) {
  const group = new T.Group();
  group.name = 'Cast effects';
  scene.add(group);
  const active = [];

  function remove(index) {
    const [{object}] = active.splice(index, 1);
    const geometries = new Set(), materials = new Set();
    object.traverse(node => {
      if (node.isInstancedMesh) node.dispose();
      if (node.geometry) geometries.add(node.geometry);
      if (node.material) materials.add(node.material);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    group.remove(object);
  }

  function play(id, position, heading, distance, radius, impactDelay = .45) {
    const spell = spells[id];
    if (!spell) return;
    const object = new T.Group();
    object.name = id;
    object.position.copy(position);
    object.rotation.y = heading;
    const effect = spell.make(object, distance ?? spell.distance, radius ?? spell.radius, impactDelay);
    const delay = spell.lead === undefined ? 0 : Math.max(0, impactDelay - spell.lead);
    object.visible = delay === 0;
    group.add(object);
    active.push({object, effect, age: -delay});
    effect.update(0);
  }

  function update(dt) {
    for (let index = active.length - 1; index >= 0; index--) {
      const cast = active[index];
      cast.age += dt;
      if (cast.age >= cast.effect.duration) remove(index);
      else if (cast.age >= 0) {
        cast.object.visible = true;
        cast.effect.update(cast.age);
      }
    }
  }

  function clear() {
    while (active.length) remove(active.length - 1);
  }

  return {group, play, update, clear};
}
