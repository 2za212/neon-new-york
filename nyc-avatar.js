import * as THREE from 'three';

// Original city explorer. All dimensions are metres; the root is at the soles.
// A single 2 cm voxel grid keeps the face, clothing and boots at the same scale.
const VOXEL = 0.02;
const PALETTE = {
  coat: 0x293b53, coatLight: 0x394d63, coatDark: 0x202e43,
  cloth: 0x4b5663, pants: 0x303b49, knee: 0x424e5b,
  boots: 0x202b35, sole: 0x121d25, leather: 0x51545a,
  skin: 0xc79470, skinLight: 0xd4a582, skinShade: 0xae785a,
  hair: 0x47332b, hairLight: 0x604538, hairDark: 0x302723,
  eye: 0x292b2c, eyeLight: 0xd9c9ad, teal: 0x39898a,
  metal: 0x8b9caa, orange: 0xb98146, glow: 0x4be4dc,
};

function hash(x, y, z) {
  let n = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

// Cull internal voxel faces, combining each articulated part into one draw mesh.
function voxelPart(name, parent, surfaceMaterial, glowMaterial, build) {
  const cells = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;
  const fill = (x0, y0, z0, x1, y1, z1, color, emissive = false) => {
    for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) {
      cells.set(key(x, y, z), { x, y, z, color, emissive });
    }
  };
  const box = (x0, y0, z0, x1, y1, z1, color, emissive = false) => {
    fill(...[x0, y0, z0, x1, y1, z1].map(v => Math.round(v / VOXEL)), color, emissive);
  };
  build({ fill, box });
  const positions = [[], []], normals = [[], []], colors = [[], []];
  const faces = [
    { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
    { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
    { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
    { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
    { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
    { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
  ];
  const color = new THREE.Color();
  for (const cell of cells.values()) {
    const { x, y, z } = cell;
    const slot = cell.emissive ? 1 : 0;
    color.setHex(cell.color);
    // Broad, restrained fabric grain instead of unrelated bright pixel noise.
    const grain = 0.94 + hash(Math.floor(x / 2), Math.floor(y / 2), Math.floor(z / 2)) * 0.12;
    color.multiplyScalar(grain);
    for (const face of faces) {
      const [nx, ny, nz] = face.n;
      if (cells.has(key(x + nx, y + ny, z + nz))) continue;
      for (const index of [0, 1, 2, 0, 2, 3]) {
        const corner = face.c[index];
        positions[slot].push((x + corner[0]) * VOXEL, (y + corner[1]) * VOXEL, (z + corner[2]) * VOXEL);
        normals[slot].push(nx, ny, nz);
        colors[slot].push(color.r, color.g, color.b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([...positions[0], ...positions[1]], 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute([...normals[0], ...normals[1]], 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute([...colors[0], ...colors[1]], 3));
  geometry.addGroup(0, positions[0].length / 3, 0);
  if (positions[1].length) geometry.addGroup(positions[0].length / 3, positions[1].length / 3, 1);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, [surfaceMaterial, glowMaterial]);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function joint(name, parent, x = 0, y = 0, z = 0) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

export function createAvatar(scene) {
  const group = new THREE.Group();
  group.name = 'NYC_Original_Explorer';
  const surface = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.025 });
  const glow = new THREE.MeshStandardMaterial({ color: PALETTE.glow, emissive: PALETTE.glow, emissiveIntensity: 1.45, roughness: 0.65 });
  const part = (name, parent, build) => voxelPart(name, parent, surface, glow, build);
  const p = PALETTE;
  const hips = joint('hips', group, 0, 0.91, 0);
  part('trousers_waist', hips, ({ box }) => {
    box(-0.16, -0.08, -0.10, 0.16, 0.12, 0.10, p.pants);
    box(-0.17, 0.03, -0.11, 0.17, 0.07, 0.11, p.leather);
    box(-0.025, 0.025, 0.10, 0.025, 0.075, 0.12, p.metal);
  });
  const torso = joint('torso', hips, 0, 0.10, 0);
  part('jacket_and_backpack', torso, ({ box }) => {
    box(-0.16, -0.05, -0.11, 0.16, 0.10, 0.11, p.coatDark);
    box(-0.18, 0.04, -0.12, 0.18, 0.28, 0.12, p.coat);
    box(-0.20, 0.26, -0.12, 0.20, 0.36, 0.12, p.coatLight);
    box(-0.14, 0.34, -0.10, 0.14, 0.40, 0.08, p.coatDark);
    // Open collar, a pale shirt, zipper, and two independent lower front panels.
    box(-0.06, 0.30, 0.10, 0.06, 0.39, 0.14, p.cloth);
    box(-0.01, 0.02, 0.12, 0.01, 0.31, 0.14, p.metal);
    box(-0.18, -0.07, 0.04, -0.02, 0.08, 0.14, p.coat);
    box(0.02, -0.07, 0.04, 0.18, 0.08, 0.14, p.coat);
    box(-0.15, 0.08, 0.12, -0.06, 0.16, 0.16, p.coatDark);
    box(0.06, 0.08, 0.12, 0.15, 0.16, 0.16, p.coatDark);
    box(0.08, 0.27, 0.12, 0.14, 0.30, 0.14, p.orange);
    // Small cyan shoulder harness remains readable from a trailing camera.
    for (const side of [-1, 1]) {
      const x = side * 0.11;
      box(x - 0.02, 0.18, 0.12, x + 0.02, 0.35, 0.14, p.teal);
      box(x - 0.02, 0.33, -0.14, x + 0.02, 0.38, 0.14, p.coatDark);
      box(x - 0.01, 0.35, -0.12, x + 0.01, 0.39, -0.02, p.glow, true);
    }
    box(-0.12, 0.05, -0.24, 0.12, 0.30, -0.12, p.coatDark);
    box(-0.10, 0.10, -0.26, 0.10, 0.27, -0.24, p.cloth);
    box(-0.08, 0.26, -0.24, 0.08, 0.32, -0.14, p.coatLight);
    box(-0.10, 0.10, -0.28, -0.08, 0.24, -0.26, p.glow, true);
    box(0.08, 0.10, -0.28, 0.10, 0.24, -0.26, p.glow, true);
    box(-0.04, 0.17, -0.28, 0.04, 0.19, -0.26, p.teal);
    box(-0.04, 0.39, -0.04, 0.04, 0.45, 0.04, p.skinShade);
  });

  const head = joint('head', torso, 0, 0.44, 0);
  part('face_and_hair', head, ({ fill }) => {
    fill(-4, 0, -4, 4, 4, 5, p.skin);
    fill(-5, 4, -4, 5, 12, 5, p.skin);
    fill(-4, 4, 4, 4, 10, 5, p.skinLight);
    fill(-1, 5, 5, 1, 8, 6, p.skin);
    fill(-2, 3, 5, 2, 4, 6, p.skinShade);
    // Eyes and brows stay human-sized, each eye only 4 cm wide.
    fill(-4, 9, 5, -2, 10, 6, p.eye);
    fill(2, 9, 5, 4, 10, 6, p.eye);
    fill(-4, 8, 5, -3, 9, 6, p.eyeLight);
    fill(-3, 8, 5, -2, 9, 6, p.eye);
    fill(2, 8, 5, 3, 9, 6, p.eye);
    fill(3, 8, 5, 4, 9, 6, p.eyeLight);
    fill(-6, 5, -1, -5, 8, 2, p.skinShade);
    fill(5, 5, -1, 6, 8, 2, p.skinShade);
    // Stepped crown and side-swept fringe, with a visible brown silhouette.
    fill(-5, 10, -5, 5, 14, 5, p.hair);
    fill(-4, 14, -4, 4, 15, 3, p.hair);
    fill(-6, 8, -4, -4, 12, 3, p.hairDark);
    fill(4, 6, -4, 6, 12, 2, p.hairDark);
    fill(-5, 4, -5, 5, 11, -3, p.hairDark);
    fill(-5, 10, 4, -2, 13, 6, p.hair);
    fill(-2, 11, 4, 1, 14, 6, p.hairLight);
    fill(1, 12, 4, 4, 14, 6, p.hair);
    fill(-4, 13, -2, -2, 14, 3, p.hairLight);
    fill(0, 14, -2, 2, 15, 2, p.hairLight);
  });

  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const label = side < 0 ? 'left' : 'right';
    const thigh = joint(`${label}_hip`, hips, side * 0.10, 0, 0);
    part(`${label}_thigh`, thigh, ({ box }) => {
      box(-0.075, -0.39, -0.08, 0.075, 0.01, 0.08, p.pants);
      box(-0.06, -0.34, 0.08, 0.06, -0.23, 0.10, p.knee);
      box(side < 0 ? -0.10 : 0.06, -0.18, -0.04, side < 0 ? -0.06 : 0.10, -0.05, 0.07, p.coatDark);
    });
    const knee = joint(`${label}_knee`, thigh, 0, -0.39, 0);
    part(`${label}_shin`, knee, ({ box }) => {
      box(-0.065, -0.40, -0.07, 0.065, 0.01, 0.07, p.pants);
      box(-0.06, -0.09, 0.07, 0.06, 0.02, 0.10, p.knee);
      box(-0.06, -0.40, -0.08, 0.06, -0.26, 0.08, p.boots);
    });
    const ankle = joint(`${label}_ankle`, knee, 0, -0.40, 0);
    part(`${label}_boot`, ankle, ({ box }) => {
      box(-0.075, -0.10, -0.09, 0.075, 0.05, 0.10, p.boots);
      box(-0.075, -0.10, 0.04, 0.075, -0.03, 0.19, p.boots);
      box(-0.08, -0.12, -0.10, 0.08, -0.08, 0.20, p.sole);
      box(-0.05, 0.00, 0.08, 0.05, 0.02, 0.12, p.leather);
      box(-0.04, -0.04, 0.12, 0.04, -0.02, 0.16, p.metal);
    });
    legs.push({ side, thigh, knee, ankle });

    const shoulder = joint(`${label}_shoulder`, torso, side * 0.235, 0.32, 0);
    part(`${label}_upper_arm`, shoulder, ({ box }) => {
      box(-0.07, -0.26, -0.075, 0.07, 0.04, 0.075, p.coat);
      box(-0.075, -0.06, -0.08, 0.075, 0.02, 0.08, p.coatLight);
      if (side < 0) box(-0.09, -0.06, -0.02, -0.07, 0.00, 0.04, p.glow, true);
    });
    const elbow = joint(`${label}_elbow`, shoulder, 0, -0.26, 0);
    part(`${label}_forearm`, elbow, ({ box }) => {
      box(-0.06, -0.22, -0.065, 0.06, 0.01, 0.065, p.coatDark);
      box(-0.065, -0.20, -0.07, 0.065, -0.16, 0.07, p.leather);
      if (side > 0) box(-0.035, -0.16, 0.065, 0.035, -0.12, 0.085, p.teal);
    });
    const hand = joint(`${label}_hand`, elbow, 0, -0.22, 0);
    part(`${label}_glove`, hand, ({ box }) => {
      box(-0.05, -0.095, -0.045, 0.05, 0.01, 0.045, p.leather);
      box(-0.04, -0.10, 0.00, 0.04, -0.06, 0.06, p.skinShade);
      box(side < 0 ? 0.04 : -0.06, -0.05, 0.01, side < 0 ? 0.06 : -0.04, -0.01, 0.06, p.skin);
    });
    arms.push({ side, shoulder, elbow, hand });
  }

  // A tiny contact shadow complements the scene's true directional-light shadow.
  const size = 32, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const r = Math.hypot((x + 0.5 - size / 2) / (size / 2), (y + 0.5 - size / 2) / (size / 2));
    data[i] = data[i + 1] = data[i + 2] = 0;
    data[i + 3] = Math.round(Math.pow(Math.max(0, 1 - r), 2) * 160);
  }
  const shadowTexture = new THREE.DataTexture(data, size, size);
  shadowTexture.needsUpdate = true;
  shadowTexture.magFilter = shadowTexture.minFilter = THREE.LinearFilter;
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0.52, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), shadowMaterial);
  contactShadow.name = 'soft_contact_shadow';
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.008;
  contactShadow.renderOrder = 1;
  group.add(contactShadow);
  scene.add(group);

  let phase = 0, move = 0, run = 0, clock = 0, disposed = false;
  const damp = (current, target, dt, rate = 14) => current + (target - current) * (1 - Math.exp(-rate * dt));
  function update({ dt = 0, speed = 0, grounded = true, sprinting = false, heading = 0, time } = {}) {
    if (disposed) return;
    dt = Number.isFinite(dt) ? THREE.MathUtils.clamp(dt, 0, 0.1) : 0;
    speed = Number.isFinite(speed) ? Math.max(0, speed) : 0;
    clock = Number.isFinite(time) ? time : clock + dt;
    if (Number.isFinite(heading)) group.rotation.y = heading;
    move = damp(move, THREE.MathUtils.clamp(speed / 0.8, 0, 1), dt, 10);
    run = damp(run, sprinting || speed > 4.4 ? 1 : 0, dt, 9);
    phase += dt * (grounded ? 5.2 + speed * 1.2 : 4.0) * move;
    const gait = Math.sin(phase), breath = Math.sin(clock * 2.1);
    hips.position.y = 0.91 + (grounded ? Math.abs(Math.cos(phase)) * (0.013 + run * 0.011) * move : -0.025);
    torso.position.y = 0.10 + breath * 0.003 * (1 - move);
    torso.rotation.x = damp(torso.rotation.x, grounded ? (0.035 + run * 0.11) * move : 0.07, dt);
    torso.rotation.y = damp(torso.rotation.y, grounded ? gait * 0.035 * move : 0, dt);
    torso.rotation.z = damp(torso.rotation.z, grounded ? gait * 0.018 * move : 0, dt);
    head.rotation.x = damp(head.rotation.x, -torso.rotation.x * 0.55 + breath * 0.008 * (1 - move), dt);
    head.rotation.y = damp(head.rotation.y, Math.sin(clock * 0.7) * 0.025 * (1 - move), dt);
    for (const leg of legs) {
      const swing = gait * -leg.side;
      const hipTarget = grounded ? -swing * (0.40 + run * 0.31) * move : (leg.side < 0 ? -0.28 : 0.18);
      const kneeTarget = grounded ? Math.max(0, swing) * (0.52 + run * 0.55) * move : (leg.side < 0 ? 0.52 : 0.78);
      leg.thigh.rotation.x = damp(leg.thigh.rotation.x, hipTarget, dt);
      leg.knee.rotation.x = damp(leg.knee.rotation.x, kneeTarget, dt);
      leg.ankle.rotation.x = damp(leg.ankle.rotation.x, grounded ? -Math.max(0, -swing) * 0.14 * move : -0.16, dt);
    }
    for (const arm of arms) {
      const swing = gait * -arm.side;
      arm.shoulder.rotation.x = damp(arm.shoulder.rotation.x, grounded ? swing * (0.32 + run * 0.35) * move + 0.03 : -0.36, dt);
      arm.shoulder.rotation.z = damp(arm.shoulder.rotation.z, -arm.side * (grounded ? 0.07 : 0.21), dt);
      arm.elbow.rotation.x = damp(arm.elbow.rotation.x, grounded ? -0.08 - run * 0.60 * move - Math.max(0, swing) * 0.16 * move : -0.78, dt);
      arm.hand.rotation.x = damp(arm.hand.rotation.x, run * -0.08, dt);
    }
    contactShadow.visible = grounded;
  }
  update();
  group.updateMatrixWorld(true);
  let meshCount = 0, triangles = 0;
  group.traverse(object => {
    if (!object.isMesh) return;
    meshCount++;
    triangles += (object.geometry.index ? object.geometry.index.count : object.geometry.attributes.position.count) / 3;
  });
  group.userData.avatar = { original: true, height: 1.75, radius: 0.32, voxelSize: VOXEL, meshCount, triangles };

  function dispose() {
    if (disposed) return;
    disposed = true;
    group.removeFromParent();
    const geometries = new Set();
    group.traverse(object => { if (object.isMesh) geometries.add(object.geometry); });
    for (const geometry of geometries) geometry.dispose();
    surface.dispose();
    glow.dispose();
    shadowMaterial.dispose();
    shadowTexture.dispose();
  }
  return { group, height: 1.75, radius: 0.32, update, dispose };
}
