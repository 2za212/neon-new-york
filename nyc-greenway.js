import * as T from 'three';

/** Opens the existing high-line and extends it to the Hudson overlook.
 * Units are metres. Existing x[-44.5,44.5] bridge art is not duplicated.
 * Call before the architectural batch is finished. The original south fence
 * and flower bed must have a 2.7m gap at x=-41 for the east stair connection.
 */
export function openGreenway(scene, { box, beam, materials, colliders, surface, sign, tree, bench, planter, rand = Math.random }) {
  const FLOOR = 6.51, BASE = .36, Z = -28.6;
  const stats = { boxes: 0, beams: 0, colliders: 0, surfaces: 0, signs: 0, stairs: 2, steps: 56, extensionLength: 90.5, triangles: 0 };
  const B = (...args) => { box(...args); stats.boxes++; };
  const L = (...args) => { beam(...args); stats.beams++; };
  function C(x, y, z, w, h, d, cameraPadding) {
    const bounds=new T.Box3(new T.Vector3(x - w / 2, y - h / 2, z - d / 2),new T.Vector3(x + w / 2, y + h / 2, z + d / 2));
    if(cameraPadding!==undefined)bounds.userData={cameraPadding};
    colliders.push(bounds);
    stats.colliders++;
  }
  function S(x0, x1, z0, z1, y = FLOOR) { surface(x0, x1, z0, z1, y); stats.surfaces++; }
  function label(x, y, z, w, h, title, subtitle, color = '#aacfc0', rot = 0) {
    if (!sign) return;
    sign(x, y, z, w, h, title, subtitle, color, rot); stats.signs++;
  }
  function clippedSegments(a, b, openings = []) {
    const sorted = openings.filter(([lo, hi]) => hi > a && lo < b).sort((p, q) => p[0] - q[0]);
    const result = []; let start = a;
    for (const [lo, hi] of sorted) { if (lo > start) result.push([start, Math.min(lo, b)]); start = Math.max(start, hi); }
    if (start < b) result.push([start, b]);
    return result;
  }
  const inside = (x, gaps) => gaps.some(([lo, hi]) => x > lo && x < hi);

  // Occupied floors open onto the railway cutting. Rolling shutters at
  // either end, projecting slab and deeply inset working benches give these
  // masonry backs real section at the height of the elevated public walk.
  for(const [cx,back,face,span,nightShift] of [[18.24,-33.85,1,12.80,true],
    [-18.24,-33.85,1,12.80,false],[17.0,-24.65,-1,8.64,false],
    [27,-24.65,-1,8.64,true],[-17,-24.65,-1,8.64,true],[-27,-24.65,-1,8.64,false]]){
    const depth=face>0?1.60:1.12,edge=back+face*depth,len=Math.round(span/2.56);
    const glass='harborBeacon',steel='harborHullBlue',stone='harborPlate';
    B(steel,cx,6.45,back+face*depth/2,span,.64,depth+.32);
    B(stone,cx,6.88,back+face*depth/2,span+.32,.32,depth+.48);
    B(steel,cx,9.78,back+face*depth/2,span+.32,.32,depth+.64);
    for(let n=0;n<len;n++){
      const w=span/len,x=cx+(n-(len-1)/2)*w,closed=(n+(nightShift?2:0))%5===0;
      if(closed){
        for(let k=0;k<5;k++)B(k%2?steel:'harborRust',x,7.30+k*.48,edge-.08*face,w-.16,.48,.40,0xaaa793);
      }else{
        const lum=nightShift?(n%3===0?0xb29c82:0xe4c099):(n%3===0?0x8daba8:0xb2cec1);
        B(glass,x,8.31,back+face*.08,w-.08,2.40,.16,lum);
        // Cabinets and product trays sit inside the open aperture; daylight
        // remains between the roof, piers and the outer guard rails.
        B(steel,x+.25,7.53,back+face*.51,w*.55,.96,.80);
        B(stone,x+.25,8.06,back+face*.54,w*.65,.16,.96,0xa1b6ac);
        B('harborOchre',x-.29,8.34,back+face*.48,.48,.40+.24*(n%2),.48);
        B(steel,x-w*.39,8.40,back+face*.40,.21,2.56,.64);
      }
      B(steel,x-w/2,8.23,edge,.32,2.72,.48);
      B(stone,x-w/2,9.40,edge-face*.16,.64,.48,.80,0xb4bcae);
      B('harborRust',x,7.67,edge+face*.08,w,.16,.24);
    }
    for(let i=0;i<3;i++)B(i===1?stone:steel,cx,10.04+i*.32,back+face*(depth*.54+i*.08),
      span+.32+i*.32,.32,depth+.64-i*.16,0xb4bbaf);
    for(const side of [-1,1])B(steel,cx+side*(span/2-.16),8.26,back+face*depth/2,.32,2.56,depth+.32);
    C(cx,6.60,back+face*depth/2,span+.32,.86,depth+.42);
    // The gallery is private. Its glazed railing and enclosed benches also
    // bound the shoulder camera when the player looks across the viaduct.
    C(cx,8.30,back+face*(depth/2+.04),span+.32,2.76,depth+.50);
    C(cx,10.14,back+face*.68,span+.64,1.01,depth+.48);
    if(face>0)label(cx,9.54,edge+face*.26,4.48,.56,nightShift?'净水检验':'夜班调度','轨道内勤 / 凭证进入',
      nightShift?'#dabf95':'#a5cec0',0);
  }

  // The slab is solid from the original steel underside through its paver top.
  // ground(x,z,limit) chooses its surface only when a character can reach it.
  C(0, (5.73 + FLOOR) / 2, Z, 89, FLOOR - 5.73, 4.4);
  S(-44.5, 44.5, -30.8, -26.4);
  const eastGap = [[-42.35, -39.65]];
  for (const zz of [-30.7, -26.5]) {
    const gaps = zz < Z ? eastGap : [];
    for (const [a, b] of clippedSegments(-44.5, 44.5, gaps)) C((a + b) / 2, FLOOR + .51, zz, b - a, 1.02, .10,.06);
  }
  // Existing planter shells acquire matching solids, leaving the entry clear.
  for (const zz of [-30.7, -26.5]) for (let x = -41; x < 44; x += 8) {
    if (zz < Z && x === -41) continue;
    C(x, 6.79, zz - .17, 3.4, .56, .74);
  }

  // Western steel viaduct: a continuous paver route with joints and exposed ribs.
  const minX = -135, maxX = -44.5, length = maxX - minX, center = (minX + maxX) / 2;
  B('metal', center, 5.98, Z, length, .50, 4.20, 0x7d918b);
  B('stone', center, 6.24, Z, length, .30, 4.40, 0xb1b8a6);
  B('paver', center, 6.45, Z, length, .12, 4.22, 0xb0bab0);
  C(center, (5.73 + FLOOR) / 2, Z, length, FLOOR - 5.73, 4.4);
  S(minX, maxX, -30.8, -26.4);
  for (const zz of [-30.56, -26.64]) B('wood', center, 6.50, zz, length, .02, .20, 0x9cac95);
  for (let x = -133.8; x < maxX; x += 2.4) {
    B('metal', x, 5.76, Z, .15, .22, 4.28, 0x81958e);
    for (const zz of [-30.59, -26.61]) {
      B('metal', x, 6.12, zz, .27, .25, .18, 0xa6b0a2);
      B('metal', x, 6.31, zz, .085, .055, .085, 0xb7b9a1);
    }
  }
  // Portal legs keep the central underpass open, instead of a full-width pier.
  for (const x of [-55, -79, -104, -132]) {
    for (const zz of [Z - 1.65, Z + 1.65]) {
      B('stone', x, .59, zz, .85, .46, .85, 0x9ea393);
      B('metal', x, 3.13, zz, .32, 5.10, .34, 0x8a9b91);
      B('metal', x, 3.13, zz, .52, 5.10, .07, 0x81928a);
      B('metal', x, 5.70, zz, .76, .18, .70, 0xa3aea1);
      C(x, 3.13, zz, .52, 5.10, .34);
      for (let y = .8; y < 5.5; y += 1.0) {
        B('metal', x, y, zz, .56, .09, .40, 0xabb3a0);
        B('metal', x + .28, y, zz, .035, .035, .22, 0x5c716c);
      }
    }
    B('metal', x, 5.54, Z, .38, .28, 3.85, 0x91a398);
    L('metal', [x, 4.55, Z - 1.65], [x, 5.52, Z - .55], .13, .13, 0x8fa397);
    L('metal', [x, 4.55, Z + 1.65], [x, 5.52, Z + .55], .13, .13, 0x8fa397);
  }
  for (const zz of [-30.57, -26.63]) for (let x = -132; x < -49; x += 9.5) {
    L('metal', [x, 5.78, zz], [x + 8.5, 6.16, zz], .075, .075, 0x859a90);
    L('metal', [x, 6.16, zz], [x + 8.5, 5.78, zz], .075, .075, 0x859a90);
  }

  function railX(a, b, z, gaps = [], art = true) {
    for (const [lo, hi] of clippedSegments(a, b, gaps)) {
      const x = (lo + hi) / 2;
      C(x, FLOOR + .51, z, hi - lo, 1.02, .10,.06);
      if (art) {
        B('metal', x, FLOOR + .99, z, hi - lo, .075, .075, 0x9cae9e);
        B('metal', x, FLOOR + .36, z, hi - lo, .05, .05, 0x8fa28f);
        B('metal', x, FLOOR + .08, z, hi - lo, .11, .09, 0x758e82);
      }
    }
    if (!art) return;
    for (let x = a + .10; x < b; x += .60) {
      if (inside(x, gaps)) continue;
      B('metal', x, FLOOR + .53, z, .045, 1.04, .045, 0x92a68f);
      if (Math.round((x - a) / .6) % 4 === 0) {
        B('metal', x, FLOOR + .53, z, .11, 1.06, .10, 0xa1ae97);
        B('metal', x, FLOOR + 1.06, z, .15, .075, .14, 0xa4b097);
      }
    }
  }
  function railZ(x, a, b) {
    C(x, FLOOR + .51, (a + b) / 2, .10, 1.02, b - a,.06);
    B('metal', x, FLOOR + .99, (a + b) / 2, .075, .075, b - a, 0x9cae9e);
    B('metal', x, FLOOR + .08, (a + b) / 2, .09, .11, b - a, 0x758e82);
    for (let z = a; z <= b + .01; z += .55) B('metal', x, FLOOR + .53, z, .045, 1.04, .045, 0x92a68f);
  }
  const balcony = { minX: -124, maxX: -116, minZ: -33.2, maxZ: -24.0 };
  const westStairGap = [-128.35, -125.65];
  railX(minX, maxX, -30.7, [westStairGap, [balcony.minX, balcony.maxX]]);
  railX(minX, maxX, -26.5, [[balcony.minX, balcony.maxX]]);
  railZ(minX, -30.7, -26.5);
  // Original eastern end receives a physical end rail, not a tall invisible wall.
  railZ(44.45, -30.7, -26.5);

  // A wider river-facing stop is traversable, with two open connections to deck.
  B('metal', -120, 6.01, -28.6, 8.15, .44, 9.28, 0x82968d);
  B('wood', -120, 6.425, -28.6, 8.0, .17, 9.2, 0xa8ae92);
  C(-120, 6.12, -28.6, 8.0, .78, 9.2);
  S(balcony.minX, balcony.maxX, balcony.minZ, balcony.maxZ);
  railX(-124, -116, -33.15);
  railX(-124, -116, -24.05);
  for (const x of [-123.95, -116.05]) { railZ(x, -33.15, -30.8); railZ(x, -26.4, -24.05); }
  for (const z of [-32.5, -24.7]) {
    B('metal', -120, FLOOR + .30, z, 2.25, .09, .48, 0x879c8d);
    for (let j = 0; j < 4; j++) B('wood', -120, FLOOR + .47, z - .20 + j * .135, 2.45, .085, .105, 0xc0b08b);
    for (const x of [-120.82, -119.18]) { B('metal', x, FLOOR + .23, z, .10, .46, .38, 0x839b8a); C(x, FLOOR + .24, z, .12, .48, .40); }
    C(-120, FLOOR + .47, z, 2.45, .09, .52);
    for (let j = 0; j < 3; j++) B('wood', -120, FLOOR + .68 + j * .13, z + (z < Z ? -.29 : .29), 2.45, .095, .09, 0xaea47e);
  }
  // Compass inlays and a short viewing rail communicate the larger river view.
  B('metal', -120, FLOOR + .012, Z, 1.25, .018, .045, 0xc3bc91);
  B('metal', -120, FLOOR + .013, Z, .045, .018, 1.25, 0xc3bc91);
  for (const dx of [-.52, .52]) for (const dz of [-.52, .52]) B('metal', -120 + dx, FLOOR + .014, Z + dz, .09, .02, .09, 0xb3ae85);
  label(-123.45, FLOOR + 1.30, -25.0, 1.0, .34, 'HUDSON', 'RIVER OVERLOOK', '#c8cbb0', -Math.PI / 2);
  B('metal', -123.45, FLOOR + .61, -25.0, .10, 1.22, .10, 0x8ca28e);
  C(-123.45, FLOOR + .61, -25.0, .10, 1.22, .10);

  // Small planting islands leave a clear 2.8m central strip on the bridge.
  for (const [x, z] of [[-57, -26.93], [-75, -30.36], [-91, -26.93], [-108, -30.36], [-132, -26.93]]) {
    B('stone', x, FLOOR + .23, z, 2.55, .46, .60, 0x9eae94);
    B('grass', x, FLOOR + .47, z, 2.37, .055, .43, 0x9eae82);
    C(x, FLOOR + .23, z, 2.55, .46, .60);
    for (let j = 0; j < 25; j++) {
      const xx = x + (rand() - .5) * 2.25, zz = z + (rand() - .5) * .36;
      B('leaf', xx, FLOOR + .57 + rand() * .16, zz, .12 + rand() * .06, .16 + rand() * .12, .12 + rand() * .06, new T.Color().setScalar(.80 + rand() * .25));
      if (j % 6 === 0) B('lamp', xx, FLOOR + .78, zz, .045, .065, .045, 0xb8ae7d);
    }
  }
  for (let x = -132; x < -47; x += 6.2) for (const z of [-30.51, -26.69]) {
    B('metal', x, FLOOR + .11, z, .28, .19, .11, 0x80998a);
    B('lamp', x, FLOOR + .12, z + (z < Z ? .065 : -.065), .19, .055, .018, 0xb4aa7d);
    B('cyan', x, 5.78, z, .35, .035, .045, 0x83b5a9);
  }

  // One city-network gateway gives the long route a memorable transit node.
  // All supports stay outside the central 2.8m clear strip. The crossbeam and
  // its flush sign panels begin above 9.5m, clearing a full running jump.
  const gatewayX = -83;
  for (const z of [-30.53, -26.67]) {
    B('metal', gatewayX, FLOOR + .08, z, .48, .16, .48, 0x8b9e94);
    B('metal', gatewayX, (FLOOR + 9.61) / 2, z, .24, 9.61 - FLOOR, .24, 0x7d958c);
    C(gatewayX, (FLOOR + 9.61) / 2, z, .24, 9.61 - FLOOR, .24);
    C(gatewayX, FLOOR + .08, z, .48, .16, .48);
    // A narrow mechanical reveal, identification plate and short live node.
    for (const side of [-1, 1]) B('rubber', gatewayX + side * .128, 8.11, z, .018, 2.16, .10, 0x758e87);
    B('metal', gatewayX, 9.51, z, .39, .19, .40, 0xa4b3a4);
    B('metal', gatewayX + .142, 7.64, z, .032, .30, .15, 0xb1b89c);
    B('cyan', gatewayX + .163, 7.66, z, .012, .12, .055, 0x9ecfc1);
  }
  B('metal', gatewayX, 9.74, Z, .34, .32, 4.22, 0x91a69a);
  C(gatewayX, 9.74, Z, .34, .32, 4.22);
  B('metal', gatewayX, 9.895, Z, .44, .045, 4.32, 0x899e93);
  for (const side of [-1, 1]) {
    B('rubber', gatewayX + side * .181, 9.73, Z, .018, .245, 3.13, 0x8aa198);
    B('cyan', gatewayX + side * .197, 9.882, Z, .022, .027, 2.78, 0x9fcfc4);
    for (const dz of [-1.84, 1.84]) B('metal', gatewayX + side * .19, 9.74, Z + dz, .045, .23, .18, 0xa9b59e);
  }
  label(gatewayX + .205, 9.73, Z, 2.72, .22, 'HIGH LINE', 'HUDSON // WESTBOUND', '#b0dcd0', Math.PI / 2);
  label(gatewayX - .205, 9.73, Z, 2.72, .22, 'HIGH LINE', 'CITY LINK // EASTBOUND', '#b0dcd0', -Math.PI / 2);
  stats.transitGateways = 1;

  function stairs(x, startZ, endZ, name) {
    const count = 28, rise = (FLOOR - BASE) / count, tread = (endZ - startZ) / count, width = 2.5;
    const treads = [];
    // Bottom approach is deliberately flat and connected to ground sidewalks.
    B('paver', x, BASE - .06, startZ - .65, 2.72, .12, 1.30, 0xb5b9a4);
    S(x - 1.36, x + 1.36, startZ - 1.30, startZ, BASE);
    for (let i = 0; i < count; i++) {
      const near = startZ + i * tread, far = near + tread, z = (near + far) / 2, top = BASE + (i + 1) * rise;
      B('stone', x, top - .105, z, width, .21, tread + .004, 0xaeb7a0);
      B('metal', x, top - .025, near + .026, width + .025, .05, .055, 0x879f92);
      C(x, top - .105, z, width, .21, tread + .004);
      S(x - width / 2, x + width / 2, near, far + .001, top);
      if (i % 2 === 0) for (const side of [-1, 1]) B('lamp', x + side * 1.02, top + .009, near + .065, .20, .015, .045, 0xc6af7c);
      // Each short rail collider rises with its actual tread; no high air wall.
      for (const side of [-1, 1]) {
        const xx = x + side * 1.31;
        B('metal', xx, top + .49, z, .065, .98, .065, 0x90a38e);
        B('metal', xx, top + 1.00, z, .10, .065, tread + .012, 0xb4baa0);
        C(xx, top + .50, z, .10, 1.00, tread + .003,.06);
      }
      treads.push({ minZ: near, maxZ: far, top, rise, depth: tread });
    }
    // Solid diagonal side stringers follow the staircase, below all tread tops.
    for (const side of [-1, 1]) {
      L('metal', [x + side * 1.13, BASE - .04, startZ], [x + side * 1.13, FLOOR - .20, endZ], .16, .20, 0x8fa293);
      L('metal', [x + side * 1.31, BASE + .98, startZ], [x + side * 1.31, FLOOR + .98, endZ], .055, .065, 0xa1b09a);
    }
    // Top landing overlaps the slab by .45m; the floor height is exactly shared.
    const landingEnd = -30.35;
    const landingLength = landingEnd - endZ;
    B('metal', x, FLOOR - .20, endZ + landingLength / 2, 2.70, .40, landingLength + .01, 0x82988b);
    B('paver', x, FLOOR - .045, endZ + landingLength / 2, 2.62, .09, landingLength + .01, 0xb1b9a3);
    C(x, FLOOR - .20, endZ + landingLength / 2, 2.70, .40, landingLength + .01);
    S(x - 1.35, x + 1.35, endZ, landingEnd + .005);
    for (const side of [-1, 1]) {
      const xx = x + side * 1.31;
      B('metal', xx, FLOOR + .99, endZ + landingLength / 2, .075, .075, landingLength + .10, 0xa3b19b);
      C(xx, FLOOR + .50, endZ + landingLength / 2, .10, 1.0, landingLength + .01,.06);
      B('metal', xx, FLOOR - .14, endZ - .12, .24, .27, .25, 0x9bae98);
    }
    // A sign post outside the stair clear width never blocks the entry.
    B('metal', x - 1.80, BASE + 1.0, startZ - .65, .10, 2.0, .10, 0x82998b);
    C(x - 1.80, BASE + 1.0, startZ - .65, .10, 2.0, .10);
    label(x - 1.80, BASE + 1.90, startZ - .65, 1.3, .43, 'HIGH LINE', name === 'east' ? 'HUDSON OVERLOOK ←' : 'CITY / WATERFRONT', '#a8d8c3', Math.PI);
    return { x, startZ, endZ, count, rise, tread, width, treads, landingEnd };
  }
  const eastStair = stairs(-41, -42, -30.8, 'east');
  const westStair = stairs(-127, -44, -31, 'west');
  label(-47.5, FLOOR + 1.65, -27.0, 2.4, .40, 'HUDSON  →', 'GREENWAY / OPEN ACCESS', '#99d4c6', Math.PI);
  B('metal', -48.65, FLOOR + .8, -27.03, .09, 1.6, .09, 0x849d8b);
  C(-48.65, FLOOR + .8, -27.03, .09, 1.6, .09);
  label(-129.5, FLOOR + 1.50, -27.0, 1.8, .37, 'RIVER WALK', 'STAIRS / STREET LEVEL', '#c5c6a7', Math.PI);
  B('metal', -130.3, FLOOR + .7, -27.03, .09, 1.4, .09, 0x849d8b);
  C(-130.3, FLOOR + .7, -27.03, .09, 1.4, .09);

  stats.triangles = (stats.boxes + stats.beams) * 12 + stats.signs * 2;
  const landmarks = [{ id: 'greenway_overlook', title: '哈德逊高架观景台', position: new T.Vector3(-120, FLOOR, Z) }];
  return { landmarks, stats, eastStair, westStair, floor: FLOOR, extension: { minX, maxX, minZ: -30.8, maxZ: -26.4 }, balcony };
}
