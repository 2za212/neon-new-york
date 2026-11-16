import * as T from 'three';

/** Fine street props for the existing static architectural batch.
 * Invoke before batch.finish(). Materials are registered immediately.
 * The subway is a closed descending well. The caller must cut its road and
 * sidewalk base at local u=+-1.16, v=+-1.72; no walk surface is added here.
 */
export function createDetailedStreetProps({ box, beam, materials, colliders, sign, surface, rand = Math.random }) {
  const stats = { trees: 0, subways: 0, treeBoxes: 0, subwayBoxes: 0, signs: 0, treeBoxCounts: [], subwayBoxCounts: [], materials: [] };
  const SIDE = 0.36;
  function register(key, options, meters = 1) {
    if (materials[key]) return materials[key];
    const material = new T.MeshStandardMaterial({ vertexColors: true, roughness: .85, ...options });
    material.name = `NYC detailed street / ${key}`;
    material.userData.textureMeters = meters;
    material.userData.streetPropsV2 = true;
    materials[key] = material;
    stats.materials.push(key);
    return material;
  }
  function texture(size, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    draw(canvas.getContext('2d'), size);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.magFilter = T.NearestFilter;
    map.minFilter = T.LinearMipmapLinearFilter;
    map.anisotropy = 4;
    return map;
  }
  function seeded(seed) {
    let state = seed >>> 0;
    return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  }
  const grain = seeded(14921);
  const barkMap = texture(256, (g, n) => {
    g.fillStyle = '#6b5540'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 125; i++) {
      const x = grain() * n, width = 1 + grain() * 3;
      g.strokeStyle = grain() > .35 ? 'rgba(33,29,21,.35)' : 'rgba(199,163,112,.28)';
      g.lineWidth = width; g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= n; y += 12) g.lineTo(x + Math.sin(y * .035 + i) * (1 + grain() * 2), y);
      g.stroke();
    }
    for (let i = 0; i < 650; i++) {
      g.fillStyle = grain() > .5 ? 'rgba(20,25,18,.19)' : 'rgba(223,190,135,.15)';
      g.fillRect(grain() * n, grain() * n, 1 + grain() * 2, 2 + grain() * 7);
    }
  });
  register('streetV2Bark', { map: barkMap, bumpMap: barkMap, bumpScale: .018, roughness: .98 }, .75);
  const leafMap = texture(128, (g, n) => {
    g.fillStyle = '#a8b69a'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 250; i++) {
      g.fillStyle = grain() > .45 ? 'rgba(240,244,196,.12)' : 'rgba(20,44,26,.15)';
      g.fillRect(grain() * n, grain() * n, 2 + grain() * 7, 2 + grain() * 6);
    }
  });
  register('streetV2Leaf', { map: leafMap, color: 0xffffff, roughness: .98 }, .36);
  const ironMap = texture(128, (g, n) => {
    g.fillStyle = '#245548'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = grain() > .93 ? 'rgba(143,95,51,.45)' : 'rgba(8,20,18,.15)';
      g.fillRect(grain() * n, grain() * n, 1 + grain() * 2, 1 + grain() * 3);
    }
    g.fillStyle = 'rgba(155,177,133,.13)'; g.fillRect(3, 0, 2, n);
  });
  register('streetV2Iron', { map: ironMap, metalness: .65, roughness: .57 }, .6);
  register('streetV2Soil', { color: 0x514a36, roughness: 1 }, .5);
  register('streetV2Grate', { color: 0x353f3c, roughness: .67, metalness: .72 }, .5);
  register('streetV2Bronze', { color: 0x9a9b73, roughness: .54, metalness: .62 }, .5);
  register('streetV2Dark', { color: 0x17282b, roughness: .91 }, 1);
  const tileMap = texture(256, (g, n) => {
    g.fillStyle = '#8b9286'; g.fillRect(0, 0, n, n);
    for (let row = 0; row < 8; row++) for (let col = -1; col < 5; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 32;
      g.fillStyle = `rgb(${189 + Math.floor(grain() * 14)},${193 + Math.floor(grain() * 12)},${174 + Math.floor(grain() * 14)})`;
      g.fillRect(x + 1.5, y + 1.5, 61, 29);
      g.fillStyle = 'rgba(255,255,230,.23)'; g.fillRect(x + 2, y + 2, 59, 1);
    }
  });
  register('streetV2Tile', { map: tileMap, roughness: .48 }, 1.28);
  register('streetV2Lantern', { color: 0xd0e8cf, emissive: 0x8dbfa6, emissiveIntensity: .55, roughness: .35 }, .4).userData.castShadow = false;
  register('streetV2LanternGreen', { color: 0x5b927b, emissive: 0x2e6f58, emissiveIntensity: .38, roughness: .37 }, .4).userData.castShadow = false;
  register('streetV2WarmStep', { color: 0xf4ca8b, emissive: 0xf4ad55, emissiveIntensity: 1.1, roughness: .45 }, .5).userData.castShadow = false;

  function routeMaterial(letter, background) {
    const key = `streetV2Route${letter}`;
    const map = texture(128, (g, n) => {
      g.clearRect(0, 0, n, n);
      g.fillStyle = background; g.beginPath(); g.arc(n / 2, n / 2, 59, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#c2d3cf'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#f0f4e9'; g.font = 'bold 81px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, 64, 68);
    });
    // The architectural box's +Z face reverses U relative to a PlaneGeometry.
    map.repeat.x = -1; map.offset.x = 1;
    const mat = register(key, { map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: .28, alphaTest: .1, roughness: .53 }, .3);
    mat.userData.unitUV = true; mat.userData.castShadow = false;
    return key;
  }
  const routeA = routeMaterial('A', '#174994'), routeC = routeMaterial('C', '#174994'), routeE = routeMaterial('E', '#174994');
  const scannerMap = texture(128, (g, n) => {
    g.fillStyle = '#0c262c'; g.fillRect(0, 0, n, n);
    g.strokeStyle = '#55d5d8'; g.lineWidth = 3; g.strokeRect(6, 6, n - 12, n - 12);
    g.fillStyle = '#93dfd2'; g.font = 'bold 22px monospace'; g.textAlign = 'center'; g.fillText('TAP', 64, 30);
    g.strokeStyle = '#89c9c0'; g.lineWidth = 4;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(58, 78, 12 + i * 9, -.65, .65); g.stroke(); }
    g.fillStyle = '#cee4d1'; g.fillRect(35, 60, 23, 35);
    g.fillStyle = '#296963'; g.fillRect(39, 66, 15, 24);
  });
  const scannerMat = register('streetV2Scanner', { map: scannerMap, emissiveMap: scannerMap, emissive: 0x8fd9d3, emissiveIntensity: .65, roughness: .38 }, .25);
  scannerMap.repeat.x = -1; scannerMap.offset.x = 1;
  scannerMat.userData.unitUV = true; scannerMat.userData.castShadow = false;

  let active = 'tree';
  function B(mat, x, y, z, w, h, d, tint = 0xffffff, rotation = 0) {
    box(mat, x, y, z, w, h, d, tint, rotation);
    stats[active === 'tree' ? 'treeBoxes' : 'subwayBoxes']++;
  }
  function line(mat, a, b, width, depth = width, tint = 0xffffff) {
    beam(mat, a, b, width, depth, tint);
    stats[active === 'tree' ? 'treeBoxes' : 'subwayBoxes']++;
  }
  function label(...args) { if (sign) { sign(...args); stats.signs++; } }

  function tree(x, z, size = 1, park = false) {
    active = 'tree';
    const before = stats.treeBoxes;
    const random = seeded((Math.round(x * 1173) ^ Math.round(z * 4371) ^ Math.floor(rand() * 100000)) >>> 0);
    const scale = Math.max(.5, size), base = SIDE, trunkHeight = 2.65 * scale;
    const sway = (random() - .5) * .17 * scale;
    // Tapered, gently offset trunk sections and individually visible branch forks.
    for (let i = 0; i < 12; i++) {
      const t0 = i / 12, t1 = (i + 1) / 12;
      line('streetV2Bark', [x + sway * t0, base + trunkHeight * t0, z - .07 * scale * t0],
        [x + sway * t1, base + trunkHeight * t1 + .035 * scale, z - .07 * scale * t1], (.30 - i * .011) * scale, (.27 - i * .009) * scale, 0xffffff);
    }
    const lobes = [];
    const phase = random() * Math.PI * 2;
    for (let i = 0; i < 7; i++) {
      const angle = phase + i * 2.39996;
      const reach = (.87 + random() * .51) * scale;
      const end = [x + Math.cos(angle) * reach, base + (3.05 + random() * .94) * scale, z + Math.sin(angle) * reach];
      const start = [x + sway * .65, base + (1.77 + (i % 3) * .23) * scale, z - .04 * scale];
      const mid = [x + Math.cos(angle) * reach * .46, start[1] + .54 * scale, z + Math.sin(angle) * reach * .46];
      line('streetV2Bark', start, mid, (.15 - i * .007) * scale);
      line('streetV2Bark', mid, end, (.11 - i * .005) * scale);
      line('streetV2Bark', mid, [end[0] + Math.sin(angle) * .3 * scale, end[1] - .16 * scale, end[2] + Math.cos(angle) * .3 * scale], .065 * scale);
      lobes.push({ x: (end[0] - x) / scale, y: (end[1] - base) / scale, z: (end[2] - z) / scale,
        rx: .53 + random() * .13, ry: .43 + random() * .12, rz: .50 + random() * .15, shade: random() });
    }
    lobes.push({ x: sway / scale, y: 3.87, z: -.08, rx: .58, ry: .57, rz: .55, shade: .7 });
    // Join overlapping boughs on the same local grid. Each contiguous run
    // is one solid, so large crowns do not need hundreds of detached leaves.
    const cell=.32, rows=new Map();
    for(const lobe of lobes){
      const cx=Math.round(lobe.x*scale/cell),cy=Math.round(lobe.y*scale/cell),cz=Math.round(lobe.z*scale/cell);
      const radius=Math.max(1,Math.round((lobe.rx*scale+.16)/cell));
      for(let dy=-1;dy<=1;dy++){
        const span=dy===0?radius:Math.max(1,radius-1);
        for(let dz=-span;dz<=span;dz++){
          const zIndex=cz+dz,yIndex=cy+dy,key=yIndex+','+zIndex;
          if(!rows.has(key))rows.set(key,{yIndex,zIndex,occupied:new Set()});
          const half=Math.max(0,span-(Math.abs(dz)===span?1:0));
          for(let dx=-half;dx<=half;dx++)rows.get(key).occupied.add(cx+dx);
        }
      }
    }
    for(const {yIndex,zIndex,occupied} of rows.values()){
      const xs=[...occupied].sort((a,b)=>a-b);
      for(let i=0;i<xs.length;){
        const first=xs[i++];let last=first;
        while(i<xs.length&&xs[i]===last+1)last=xs[i++];
        const color=yIndex*cell>3.85*scale?0x859970:0x5e7959;
        B('streetV2Leaf',x+(first+last)*cell/2,base+yIndex*cell,z+zIndex*cell,(last-first+1)*cell,cell,cell,color);
      }
    }
    // Roots are exposed briefly above the soil and disappear under the grate.
    for (let i = 0; i < 7; i++) {
      const angle = phase + i * Math.PI * 2 / 7;
      line('streetV2Bark', [x, base + .18 * scale, z], [x + Math.cos(angle) * .48 * scale, base + .045, z + Math.sin(angle) * .48 * scale], .085 * scale, .07 * scale, 0xc7b18f);
    }
    if (!park) {
      B('streetV2Soil', x, base + .015, z, 1.50, .035, 1.50);
      for (const edge of [-1, 1]) {
        B('streetV2Grate', x + edge * .80, base + .045, z, .055, .065, 1.65);
        B('streetV2Grate', x, base + .045, z + edge * .80, 1.65, .065, .055);
      }
      for (let i = -6; i <= 6; i++) {
        const offset = i * .115;
        if (Math.abs(offset) < .24) {
          for (const end of [-1, 1]) {
            B('streetV2Grate', x + offset, base + .058, z + end * .50, .023, .027, .48);
            B('streetV2Grate', x + end * .50, base + .058, z + offset, .48, .027, .023);
          }
        } else {
          B('streetV2Grate', x + offset, base + .058, z, .023, .027, 1.48);
          B('streetV2Grate', x, base + .058, z + offset, 1.48, .027, .023);
        }
      }
      for (const edge of [-1, 1]) {
        B('metal', x + edge * .71, base + .083, z + .71, .10, .028, .09, 0x9d9e88);
        B('cyan', x + edge * .71, base + .099, z + .71, .042, .014, .04, 0x9ed9ce);
      }
      for (let i = 0; i < 12; i++) {
        const a = random() * Math.PI * 2, r = .25 + random() * .45;
        B('streetV2Soil', x + Math.cos(a) * r, base + .055, z + Math.sin(a) * r, .045, .035, .055, 0xb7a884);
      }
    } else {
      B('streetV2Soil', x, base + .008, z, .85 * scale, .035, .80 * scale);
      for (let i = 0; i < 18; i++) {
        const a = random() * Math.PI * 2, r = (.24 + random() * .34) * scale;
        B('grass', x + Math.cos(a) * r, base + .05 + random() * .045, z + Math.sin(a) * r, .065, .11, .065, 0x819363);
      }
    }
    stats.trees++;
    stats.treeBoxCounts.push(stats.treeBoxes - before);
    return { boxes: stats.treeBoxes - before, leaves: [...rows.values()].reduce((sum,row)=>sum+row.occupied.size,0), voxelSize: cell, height: 4.5 * scale };
  }

  function subway(x, z, rot = 0) {
    active = 'subway';
    const before = stats.subwayBoxes, c = Math.cos(rot), s = Math.sin(rot);
    const P = (u, y, v) => [x + u * c + v * s, y, z - u * s + v * c];
    const Q = (mat, u, y, v, w, h, d, tint = 0xffffff) => B(mat, ...P(u, y, v), w, h, d, tint, rot);
    const L = (mat, a, b, width, depth = width, tint = 0xffffff) => line(mat, P(...a), P(...b), width, depth, tint);
    const S = (u, y, v, w, h, title, subtitle, color) => label(...P(u, y, v), w, h, title, subtitle, color, rot);
    // The caller cuts the structural base. These treads genuinely descend into
    // that opening, while the maintenance gate and original collider close it.
    Q('streetV2Dark', 0, -1.85, -.02, 2.18, .065, 3.30);
    for (const edge of [-1, 1]) {
      Q('stone', edge * 1.16, .48, 0, .22, .24, 3.52, 0xb1afa0);
      Q('streetV2Iron', edge * 1.16, .635, 0, .25, .065, 3.58);
      Q('streetV2Iron', edge * 1.16, 1.49, 0, .105, .10, 3.56);
      Q('streetV2Iron', edge * 1.16, .84, 0, .065, .055, 3.42);
      for (let i = 0; i < 18; i++) {
        const v = -1.57 + i * .184;
        Q('streetV2Iron', edge * 1.16, 1.06, v, .033, .79, .033);
        Q('streetV2Bronze', edge * 1.16, 1.43, v, .046, .035, .046, 0xb5b198);
      }
      for (const v of [-1.69, -.55, .56, 1.69]) {
        Q('streetV2Iron', edge * 1.16, 1.05, v, .075, .92, .075);
        Q('streetV2Iron', edge * 1.16, .68, v, .125, .09, .125);
        Q('streetV2Iron', edge * 1.16, 1.50, v, .13, .075, .13);
      }
    }
    for (const edge of [-1, 1]) {
      Q('streetV2Tile', edge * 1.055, -.62, -.02, .12, 2.40, 3.28, 0xb7c1b3);
      Q('streetV2Iron', edge * 1.055, .595, -.02, .14, .035, 3.30);
    }
    for (let i = 0; i < 10; i++) {
      const v = 1.26 - i * .287, top = .34 - i * .20, width = 1.97;
      Q('stone', 0, top - .105, v, width, .21, .287, new T.Color().setScalar(.87 - i * .032));
      Q('streetV2Dark', 0, top - .012, v + .139, width, .022, .018);
      if (i % 2 === 0) Q('streetV2WarmStep', 0, top + .005, v + .112, width - .13, .012, .028, new T.Color().setScalar(1 - i * .055));
      for (const edge of [-1, 1]) Q('streetV2Iron', edge * 1.015, top + .70, v, .04, .075, .045);
    }
    Q('streetV2Dark', 0, -.62, -1.60, 2.12, 2.43, .09);
    for (let i = 0; i < 11; i++) Q('streetV2Grate', -.90 + i * .18, -1.18, -1.54, .022, 1.20, .026, 0x52615d);
    // Low handrails sit over tiled cheek walls and stay separate from the fence.
    for (const edge of [-1, 1]) L('streetV2Bronze', [edge * .96, 1.08, 1.34], [edge * .96, -.76, -1.35], .045);

    function globe(u, y, v) {
      // Seven octagonal horizontal slices produce a round lantern silhouette.
      const radius = .235, slice = .062;
      for (let i = -3; i <= 3; i++) {
        const dy = i * slice, r = Math.sqrt(Math.max(.004, radius * radius - dy * dy));
        const mat = i < 0 ? 'streetV2LanternGreen' : 'streetV2Lantern';
        Q(mat, u, y + dy, v, r * 2, slice * .98, r * 1.04);
        for (const edge of [-1, 1]) Q(mat, u, y + dy, v + edge * r * .71, r * 1.38, slice * .98, r * .38);
      }
      Q('streetV2Iron', u, y - .24, v, .26, .055, .26);
      Q('streetV2Iron', u, y + .232, v, .12, .035, .12);
      Q('streetV2Bronze', u, y + .259, v, .055, .028, .055);
    }
    for (const edge of [-1, 1]) {
      Q('streetV2Iron', edge * 1.16, 1.71, 1.68, .14, 2.57, .14);
      Q('streetV2Iron', edge * 1.16, .54, 1.68, .25, .27, .25);
      for (const y of [.76, 2.33, 2.88]) Q('streetV2Iron', edge * 1.16, y, 1.68, .205, .075, .205);
      globe(edge * 1.16, 3.19, 1.68);
    }
    Q('streetV2Iron', 0, 2.61, 1.68, 2.40, .67, .18);
    Q('streetV2Bronze', 0, 2.934, 1.79, 2.28, .025, .026);
    Q('streetV2Bronze', 0, 2.283, 1.79, 2.28, .025, .026);
    for (const edge of [-1, 1]) Q('streetV2Bronze', edge * 1.145, 2.61, 1.79, .025, .61, .026);
    // Three iron courses frame the pair of station lanterns from across the road.
    for(let tier=0;tier<3;tier++)Q('streetV2Iron',0,3.04+tier*.16,1.68,3.20-tier*.32,.16,.64-tier*.16);
    Q('streetV2Bronze',0,2.94,1.93,2.56,.08,.16);
    S(0, 2.64, 1.78, 2.04, .45, 'SUBWAY', '8 AVENUE / DOWNTOWN', '#d0e5d6');
    for (const [u, route] of [[-.36, routeA], [0, routeC], [.36, routeE]]) {
      Q('streetV2Iron', u, 2.20, 1.69, .33, .33, .065);
      Q(route, u, 2.20, 1.73, .29, .29, .018);
    }
    // A physically closed open-bar gate tells the truth about this map's route.
    Q('streetV2Iron', 0, 1.51, 1.53, 2.18, .065, .07);
    Q('streetV2Iron', 0, .53, 1.53, 2.18, .065, .07);
    for (let i = 0; i < 15; i++) Q('streetV2Iron', -.99 + i * .142, 1.02, 1.53, .029, .96, .034);
    L('streetV2Grate', [-1.02, .58, 1.55], [1.02, 1.48, 1.55], .032);
    S(0, 1.15, 1.61, 1.26, .28, '夜间维护', 'NIGHT MAINTENANCE', '#d6b476');
    // Put service information beside the post. A second full-width sign at
    // head height would visually seal the stairwell that the open bars reveal.
    Q('streetV2Iron', 1.29, 1.92, 1.53, .40, .07, .14);
    Q('streetV2Dark', 1.42, 1.92, 1.55, .64, .45, .17);
    Q('cyan', 1.11, 1.92, 1.645, .025, .32, .022, 0xa0dad7);
    S(1.42, 1.92, 1.63, .56, .35, 'STATUS', 'MAINTENANCE', '#69c8cc');
    // Side-mounted repeater faces the sidewalk, clear of the maintenance gate.
    Q('streetV2Dark',-1.16,1.12,0,.15,.70,1.46);
    label(...P(-1.26,1.12,0),1.32,.57,'A   02 MIN','NEXT OPEN STOP / 8 AV','#74e5ef',rot-Math.PI/2);
    for(const v of [-.54,0,.54])Q('streetV2Bronze',-1.16,.79,v,.14,.08,.10);
    Q('streetV2Grate',-1.16,.72,.45,.085,.085,1.72);
    Q('streetV2Grate',-1.16,.94,1.27,.085,.48,.09);
    // Slender OMNY-like generic contactless reader, authored without branding.
    Q('streetV2Grate', .83, .85, 1.37, .24, .92, .23);
    Q('streetV2Dark', .83, 1.37, 1.38, .29, .24, .20);
    Q('streetV2Scanner', .83, 1.40, 1.49, .23, .19, .018);
    Q('cyan', .83, 1.255, 1.49, .19, .018, .018, 0x8abebc);
    for (const u of [-.91, .91]) Q('streetV2Bronze', u, 1.11, 1.58, .085, .13, .046);
    // Preserve the original collision envelope; no new walkable surface is added.
    const width = Math.abs(c) * 2.6 + Math.abs(s) * 3.7;
    const depth = Math.abs(s) * 2.6 + Math.abs(c) * 3.7;
    if (colliders) colliders.push(new T.Box3(new T.Vector3(x - width / 2, .25, z - depth / 2), new T.Vector3(x + width / 2, 1.75, z + depth / 2)));
    stats.subways++;
    stats.subwayBoxCounts.push(stats.subwayBoxes - before);
    return { boxes: stats.subwayBoxes - before, closed: true, descendingWell: true, firstTread: .34, lastTread: -1.46, floor: -1.85 };
  }
  return { tree, subway, stats };
}

