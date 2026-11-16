const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { buildSync } = require('esbuild');
const { installCanvasMock } = require('./canvas-mock.cjs');

async function main() {
  const root = path.resolve(__dirname, '../..');
  const canvas = installCanvasMock();
  const T = await import('three');
  const entry = `export {createNYCScene} from './nyc-scene.js'; export {createMotor} from './nyc-motor.js';`;
  const bundle = path.join(__dirname, 'integrated-world.mjs');
  buildSync({ stdin: { contents: entry, resolveDir: root }, bundle: true, format: 'esm', platform: 'node', external: ['three', 'three/*'], outfile: bundle });
  const { createNYCScene, createMotor } = await import(pathToFileURL(bundle).href + '?t=' + Date.now());
  const scene = new T.Scene();
  const world = await createNYCScene(scene, { capabilities: { getMaxAnisotropy: () => 1 } });
  const all = [], still = { moveX: 0, moveZ: 0, jump: false, sprint: false };
  function motorAt(x, y, z) { return createMotor(world, new T.Vector3(x, y, z)); }
  function obstruction(motor) {
    const p = motor.position;
    return world.colliders.map((b, index) => ({ b, index, d: Math.hypot(Math.max(b.min.x - p.x, 0, p.x - b.max.x), Math.max(b.min.z - p.z, 0, p.z - b.max.z)) }))
      .filter(o => o.d < 1 && p.y + 1.75 > o.b.min.y && p.y < o.b.max.y)
      .sort((a, b) => a.d - b.d).slice(0, 4).map(o => ({ index: o.index, distance: o.d, min: o.b.min.toArray(), max: o.b.max.toArray() }));
  }
  function go(motor, x, z, name, expectedY, maxSeconds) {
    const start = motor.position.toArray(), originalDistance = Math.hypot(x - start[0], z - start[2]);
    const timeout = maxSeconds ?? Math.max(12, originalDistance / 3.2 + 12);
    let time = 0, minY = start[1], maxY = start[1], best = Infinity, noProgress = 0, reached = false;
    while (time < timeout) {
      const dx = x - motor.position.x, dz = z - motor.position.z, d = Math.hypot(dx, dz);
      if (d < .075) { reached = true; break; }
      if (d < best - .02) { best = d; noProgress = 0; } else noProgress++;
      if (noProgress > 240) break;
      const s = d < .6 ? Math.max(.16, d / .6) : 1;
      motor.update(1 / 60, { ...still, moveX: dx / d * s, moveZ: -dz / d * s }, 0);
      time += 1 / 60; minY = Math.min(minY, motor.position.y); maxY = Math.max(maxY, motor.position.y);
      if (!Number.isFinite(motor.position.y) || motor.position.y < -.2) break;
    }
    for (let i = 0; i < 50; i++) motor.update(1 / 60, still, 0);
    const heightOK = expectedY === undefined || Math.abs(motor.position.y - expectedY) < .07;
    const result = { name, passed: reached && heightOK, reached, heightOK, start, target: [x, expectedY, z], final: motor.position.toArray(), grounded: motor.grounded, minY, maxY, seconds: time };
    if (!result.passed) result.obstruction = obstruction(motor);
    all.push(result); console.log(`${result.passed ? 'PASS' : 'FAIL'} ${name}: ${motor.position.toArray().map(v => v.toFixed(3)).join(', ')}`);
    return result.passed;
  }
  const traveler = createMotor(world, world.spawn);
  const route = [
    ['spawn_to_crossing', 0, 0, .18], ['crossing_to_westroad', -50, 0, .18],
    ['westroad_to_market_axis', -113, 0, .18], ['market_entrance', -113, 8.3, .36],
    ['market_return', -113, 0, .18], ['hudson_pier', -142.1, 0, .36],
    ['pier_to_promenade', -133, 0, .36], ['promenade_north', -133, -46, .36],
    ['west_stair_approach', -127, -45.4, .18], ['west_stair_up', -127, -28.6, 6.51],
    ['greenway_overlook', -120, -28.6, 6.51], ['greenway_east_top', -41, -28.6, 6.51],
    ['east_stair_down', -41, -43, .36], ['east_stair_up', -41, -28.6, 6.51],
    ['greenway_west_return', -127, -28.6, 6.51], ['west_stair_down', -127, -45.4, .18],
  ];
  for (const [name, x, z, y] of route) if (!go(traveler, x, z, name, y)) break;
  for (const [x, base, z0, z1, name] of [[0, .18, -35, -23, 'core_underpass'], [-73, .18, -34, -24, 'extension_underpass']]) {
    const m = motorAt(x, base, z0); const pass = go(m, x, z1, name, base); const item = all.at(-1); item.passed = pass && item.maxY < 1; if (!item.passed) item.obstruction = obstruction(m);
  }
  const head = motorAt(-73, .18, -28.6); head.position.y = 3.9; let headMax = 3.9;
  for (let i = 0; i < 50; i++) { head.update(1 / 120, { ...still, jump: i === 0 }, 0); headMax = Math.max(headMax, head.position.y); }
  all.push({ name: 'deck_underside_head', passed: headMax <= 3.99, maxY: headMax, final: head.position.toArray() });
  function pushGuard(name, x, z, input, valid) {
    const m = motorAt(x, .36, z), start = m.position.toArray(); let minY = m.position.y, maxY = minY;
    for (let i = 0; i < 240; i++) { m.update(1 / 60, { ...still, ...input }, 0); minY = Math.min(minY, m.position.y); maxY = Math.max(maxY, m.position.y); }
    all.push({ name, passed: valid(m.position) && minY >= .17, start, final: m.position.toArray(), minY, maxY, obstruction: obstruction(m) });
  }
  pushGuard('quay_water_guard', -136.5, 22, { moveX: -1, sprint: true }, p => p.x >= -137.66);
  pushGuard('pier_end_guard', -143, 0, { moveX: -1, sprint: true }, p => p.x >= -145.53);
  pushGuard('pier_side_guard', -143, 0, { moveZ: -1, sprint: true }, p => p.z <= 4.48);
  pushGuard('warehouse_wall_guard', -59, -8.3, { moveZ: 1, sprint: true }, p => p.z >= -10.35 && p.y < 1);
  const summary = { timestamp: new Date().toISOString(), scope: 'Integrated createNYCScene + actual createMotor, mocked Canvas2D, no browser/GPU', canvas: canvas.summary(), bounds: world.bounds, landmarks: world.landmarks.map(l => ({ id: l.id, position: l.position.toArray() })), stats: { boxes: world.stats.boxes, triangles: world.stats.triangles, colliders: world.colliders.length, surfaces: world.walkSurfaces.length }, passed: all.every(t => t.passed), tests: all };
  fs.writeFileSync(path.join(__dirname, 'integrated-navigation-result.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ passed: summary.passed, count: all.length, failed: all.filter(t => !t.passed).map(t => t.name), canvas: summary.canvas, stats: summary.stats }));
  if (!summary.passed) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
