export function rapierBlendInput({speed, heading, velocityX, velocityZ}, walkingSpeed = 1.35, runningSpeed = 6.6) {
  const vx = Number.isFinite(velocityX) ? velocityX : Math.sin(heading) * speed;
  const vz = Number.isFinite(velocityZ) ? velocityZ : Math.cos(heading) * speed;
  const left = vx * Math.cos(heading) - vz * Math.sin(heading);
  const forward = vx * Math.sin(heading) + vz * Math.cos(heading);
  const magnitude = Math.hypot(left, forward);
  const extent = magnitude < 1e-6 ? 0 : Math.max(Math.abs(left), Math.abs(forward)) / magnitude;
  const strength = speed <= walkingSpeed
    ? speed / walkingSpeed * .5
    : .5 + .5 * Math.max(0, Math.min(1, (speed - walkingSpeed) / (runningSpeed - walkingSpeed)));
  const factor = magnitude > 1e-6 ? 50 * strength / (magnitude * extent) : 0;
  // UE's leftward axis maps to the rendered character's local +X.
  return [Math.max(0, Math.min(100, 50 + left * factor)),
    Math.max(0, Math.min(100, 50 - forward * factor))];
}

// Reconstruct the UE BlendSpace sample triangulation once, then interpolate
// weights in the exported axis coordinates each frame.
export function createRapierBlendSpace(samples) {
  const points = samples.map(sample => sample.position.slice(0, 2));
  const count = points.length;
  if (count < 3) throw new Error('The rapier BlendSpace needs at least three samples.');
  const values = points.flat();
  const span = Math.max(1, Math.max(...values) - Math.min(...values)) * 16;
  const center = (Math.max(...values) + Math.min(...values)) / 2;
  points.push([center - span, center - span], [center + span, center - span], [center, center + span]);
  let triangles = [[count, count + 1, count + 2]];

  function circumcircleContains(triangle, point) {
    const [a, b, c] = triangle.map(index => points[index]);
    const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    if (Math.abs(d) < 1e-9) return false;
    const squared = value => value[0] ** 2 + value[1] ** 2;
    const x = (squared(a) * (b[1] - c[1]) + squared(b) * (c[1] - a[1]) + squared(c) * (a[1] - b[1])) / d;
    const y = (squared(a) * (c[0] - b[0]) + squared(b) * (a[0] - c[0]) + squared(c) * (b[0] - a[0])) / d;
    return (point[0] - x) ** 2 + (point[1] - y) ** 2 <= (a[0] - x) ** 2 + (a[1] - y) ** 2 + 1e-6;
  }

  for (let index = 0; index < count; index++) {
    const edges = new Map();
    const bad = new Set();
    for (const triangle of triangles) {
      if (!circumcircleContains(triangle, points[index])) continue;
      bad.add(triangle);
      for (let edge = 0; edge < 3; edge++) {
        const a = triangle[edge], b = triangle[(edge + 1) % 3];
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        if (edges.has(key)) edges.delete(key);
        else edges.set(key, [a, b]);
      }
    }
    triangles = triangles.filter(triangle => !bad.has(triangle));
    for (const [a, b] of edges.values()) triangles.push([a, b, index]);
  }
  triangles = triangles.filter(triangle => triangle.every(index => index < count));

  function weights(x, y) {
    for (const triangle of triangles) {
      const [a, b, c] = triangle.map(index => points[index]);
      const denominator = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(denominator) < 1e-9) continue;
      const first = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / denominator;
      const second = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / denominator;
      const third = 1 - first - second;
      if (Math.min(first, second, third) < -1e-7) continue;
      const result = new Array(count).fill(0);
      triangle.forEach((index, i) => { result[index] = Math.max(0, [first, second, third][i]); });
      return result;
    }
    throw new RangeError(`Rapier BlendSpace input lies outside its sample hull: ${x}, ${y}`);
  }

  return {weights};
}
