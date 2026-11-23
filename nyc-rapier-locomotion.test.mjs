import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRapierBlendSpace, rapierBlendInput} from './nyc-rapier-locomotion.js';

const samples = [{position: [50, 50, 0]}];
for (const edge of [25, 50]) {
  for (const [x, y] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]) {
    samples.push({position: [50 + x * edge, 50 + y * edge, 0]});
  }
}
const blend = createRapierBlendSpace(samples);

test('rapier BlendSpace reproduces all UE sample positions', () => {
  samples.forEach((sample, index) => {
    const weights = blend.weights(...sample.position);
    assert.ok(Math.abs(weights[index] - 1) < 1e-8);
    assert.ok(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-8);
  });
});

test('rapier BlendSpace interpolates intermediate diagonal and speed inputs', () => {
  for (const [x, y] of [[33, 13], [73, 37], [27, 83], [55, 47], [10, 10]]) {
    const weights = blend.weights(x, y);
    assert.ok(weights.filter(weight => weight > 1e-7).length > 1);
    assert.ok(weights.every(weight => weight >= 0));
    assert.ok(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-8);
    const reconstructed = [0, 0];
    weights.forEach((weight, index) => {
      reconstructed[0] += weight * samples[index].position[0];
      reconstructed[1] += weight * samples[index].position[1];
    });
    assert.ok(Math.abs(reconstructed[0] - x) < 1e-8);
    assert.ok(Math.abs(reconstructed[1] - y) < 1e-8);
  }
});

test('walk and run choose the UE clips for the actual left, right and diagonal movement', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('./character-motion/ue-rapier/blendspace.json', import.meta.url)));
  const actual = createRapierBlendSpace(manifest.samples);
  const directions = [
    ['left', 1, 0], ['right', -1, 0], ['front', 0, 1], ['back', 0, -1],
    ['front-left', 1, 1], ['front-right', -1, 1], ['back-left', 1, -1], ['back-right', -1, -1],
  ];
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 3]) {
    for (const [gait, speed] of [['walk', 1.35], ['run', 6.6]]) {
      for (const [direction, left, forward] of directions) {
        const normalization = Math.hypot(left, forward);
        const state = {
          speed, heading,
          velocityX: (left * Math.cos(heading) + forward * Math.sin(heading)) * speed / normalization,
          velocityZ: (-left * Math.sin(heading) + forward * Math.cos(heading)) * speed / normalization,
        };
        const weights = actual.weights(...rapierBlendInput(state));
        const index = weights.findIndex(weight => weight > .999999);
        assert.ok(index >= 0, `${gait} ${direction} heading=${heading}`);
        assert.equal(manifest.samples[index].file, `move-${gait}-${direction}.glb`);
      }
    }
  }
});
