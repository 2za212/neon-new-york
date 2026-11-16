import * as T from 'three';

// Authored light impressions on damp asphalt, not screen-space reflections.
// Two instanced draws keep the small transparent effects inexpensive.
export function createAtmosphere(scene, { renderer, bounds,extraVents=[] } = {}) {
  const random = seeded(661217);
  const textures = [steamTexture(random), reflectionTexture(random)];
  for (const texture of textures) {
    texture.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
    texture.minFilter = T.LinearMipmapLinearFilter;
    texture.magFilter = T.LinearFilter;
    texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
  }
  const inside = (x, z) => !bounds || (
    x > bounds.minX + .6 && x < bounds.maxX - .6
    && z > bounds.minZ + .6 && z < bounds.maxZ - .6
  );

  // Match the district's existing curb drain positions. Plumes stay below 2m.
  const vents = [
    [5.65, 19, '#75c7d0'], [-5.65, 19, '#b2a2b5'],
    [5.65, -19, '#91adb2'], [-24, 2, '#baaf97'],
    [-31.8,-84.8,'#79b7c4'],[25.5,-92.5,'#c08da8'],[-12,-141.8,'#bca789'],
    [-8.85,61.2,'#c0997c'],[8.75,72,'#bc9a86'],[-148,11.4,'#c9af8e',.31],
    ...extraVents,
  ].filter(([x, z]) => inside(x, z));
  const steamCards = [];
  for (const [x, z, tint,baseY=.18] of vents) {
    for (let i = 0; i < 3; i++) {
      const height = .9 + random() * .38;
      steamCards.push({
        center: [x + (random() - .5) * .17, baseY+.11 + height / 2, z + (random() - .5) * .17],
        size: [.58 + random() * .22, height], phase: (i / 3 + random() * .09) % 1,
        color: new T.Color(tint), angle: 0,
      });
    }
  }
  const steamUniforms = {
    uMap: { value: textures[0] }, uTime: { value: 0 }, uNight: { value: 0 },
  };
  const steamMaterial = new T.ShaderMaterial({
    uniforms: steamUniforms, transparent: true, depthWrite: false,
    depthTest: true, side: T.DoubleSide,
    vertexShader: `
      attribute vec3 aCenter;
      attribute vec2 aSize;
      attribute float aPhase;
      attribute vec3 aTint;
      uniform float uTime;
      varying vec2 vUv;
      varying float vFade;
      varying vec3 vTint;
      void main() {
        float life = fract(uTime * .105 + aPhase);
        vec3 center = aCenter;
        center.y += life * .57;
        center.x += sin(uTime * .33 + aPhase * 6.28318) * .10;
        center.z += cos(uTime * .24 + aPhase * 6.28318) * .065;
        vec4 viewPosition = viewMatrix * vec4(center, 1.0);
        // View-space cards face the actual render camera, without JS traversal.
        viewPosition.xy += position.xy * aSize * vec2(.82 + life * .36, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        vUv = uv;
        vFade = sin(life * 3.14159265);
        vFade *= vFade;
        vTint = aTint;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uNight;
      varying vec2 vUv;
      varying float vFade;
      varying vec3 vTint;
      void main() {
        vec2 sampleUv = vUv;
        sampleUv.x += sin(vUv.y * 12.0 + uTime * .31) * .013;
        float cloud = texture2D(uMap, sampleUv).a;
        float alpha = cloud * vFade * mix(.19, .34, uNight);
        if (alpha < .002) discard;
        vec3 haze = mix(vec3(.37, .43, .47), vTint, .22);
        haze *= mix(1.12, .86, uNight);
        gl_FragColor = vec4(haze, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const steam = new T.Mesh(cardsGeometry(steamCards), steamMaterial);
  steam.name = 'NYC atmosphere / thin drain steam';
  steam.frustumCulled = false;
  steam.renderOrder = 12;
  scene.add(steam);

  // Long axes run along the street. The central crossings remain readable.
  // y=.198-.201 stays close to the existing asphalt and wet patch layers.
  const reflectionSpecs = [
    [5.30, .199, 22.0, 1.12, 4.2, 0, '#46d4df'],
    [-5.30, .200, 22.8, 1.08, 3.4, 0, '#e160ae'],
    [5.25, .201, 12.0, .85, 2.1, 0, '#e7b77a'],
    [-5.20, .199, 10.7, .83, 1.5, 0, '#58c4d0'],
    [-5.32, .198, 15.6, .91, 2.9, 0, '#c86ba7'],
    [12.7, .200, -5.22, 1.03, 3.7, Math.PI / 2, '#4ccbd6'],
    [-13.5, .199, 5.20, 1.13, 3.9, Math.PI / 2, '#de68b5'],
    [16.6, .198, 5.32, .85, 2.4, Math.PI / 2, '#e5b780'],
    [5.12,.199,-77.2,.9,3.7,0,'#57c9d3'],
    [-5.15,.199,-105.4,.95,4.2,0,'#9b7eb4'],
    [28.5,.199,-90.8,1.1,3.9,Math.PI/2,'#cd6caa'],
  ].filter(([x, , z]) => inside(x, z));
  const reflectionCards = reflectionSpecs.map(([x, y, z, width, length, angle, tint]) => ({
    center: [x, y, z], size: [width, length], angle,
    color: new T.Color(tint), phase: random(),
  }));
  const reflectionUniforms = {
    uMap: { value: textures[1] }, uTime: { value: 0 }, uNight: { value: 0 },
  };
  const reflectionMaterial = new T.ShaderMaterial({
    uniforms: reflectionUniforms, transparent: true, depthWrite: false,
    depthTest: true, side: T.DoubleSide, blending: T.AdditiveBlending,
    vertexShader: `
      attribute vec3 aCenter;
      attribute vec2 aSize;
      attribute float aPhase;
      attribute float aAngle;
      attribute vec3 aTint;
      varying vec2 vUv;
      varying vec3 vTint;
      varying float vPhase;
      void main() {
        vec2 local = position.xy * aSize;
        float c = cos(aAngle), s = sin(aAngle);
        vec3 worldPosition = aCenter + vec3(local.x * c - local.y * s, 0.0, local.x * s + local.y * c);
        gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
        vUv = vec2(mix(uv.x, 1.0 - uv.x, step(.5, aPhase)), uv.y);
        vTint = aTint;
        vPhase = aPhase;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uNight;
      varying vec2 vUv;
      varying vec3 vTint;
      varying float vPhase;
      void main() {
        vec2 sampleUv = vUv;
        sampleUv.x += sin(vUv.y * 34.0 + uTime * .43 + vPhase * 6.28) * .006;
        vec4 imprint = texture2D(uMap, sampleUv);
        // Only a faint ring modulation: no dense rain lines or moving water sheet.
        vec2 ring = (vUv - vec2(.42, .36)) * vec2(1.0, 2.5);
        float ringRadius = length(ring);
        float ripple = sin(ringRadius * 86.0 - uTime * 1.7 + vPhase * 6.28);
        float rippleWeight = (1.0 - smoothstep(.1, .6, ringRadius)) * .055;
        float alpha = imprint.a * (1.0 + ripple * rippleWeight) * mix(.14, .24, uNight);
        if (alpha < .002) discard;
        vec3 light = vTint * (.44 + imprint.r * 1.5);
        gl_FragColor = vec4(light, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const reflections = new T.Mesh(cardsGeometry(reflectionCards), reflectionMaterial);
  reflections.name = 'NYC atmosphere / authored broken wet light';
  reflections.frustumCulled = false;
  reflections.renderOrder = 9;
  scene.add(reflections);

  const stats = {
    drawCalls: 2, steamVents: vents.length, steamCards: steamCards.length,
    reflectionPatches: reflectionCards.length, rainEnabled: false,
    textureSource: 'Original local procedural CanvasTexture',
    reflectionMethod: 'Authored light impressions, not SSR',
  };
  let elapsed = 0;
  let nightTarget = 0;
  let nightValue = 0;
  function update(dt = 0, time) {
    elapsed = Number.isFinite(time) ? time : elapsed + Math.max(0, Number.isFinite(dt) ? dt : 0);
    const delta = Math.max(0, Math.min(Number.isFinite(dt) ? dt : 0, .1));
    nightValue += (nightTarget - nightValue) * (1 - Math.exp(-delta * 6));
    steamUniforms.uTime.value = reflectionUniforms.uTime.value = elapsed;
    steamUniforms.uNight.value = reflectionUniforms.uNight.value = nightValue;
  }
  function setNight(night) { nightTarget = night ? 1 : 0; }
  return { update, setNight, stats };
}

function cardsGeometry(cards) {
  const plane = new T.PlaneGeometry(1, 1);
  const geometry = new T.InstancedBufferGeometry();
  geometry.index = plane.index.clone();
  for (const key of ['position', 'uv']) geometry.setAttribute(key, plane.attributes[key].clone());
  const attributes = [
    ['aCenter', 3, (card) => card.center],
    ['aSize', 2, (card) => card.size],
    ['aPhase', 1, (card) => [card.phase]],
    ['aAngle', 1, (card) => [card.angle]],
    ['aTint', 3, (card) => card.color.toArray()],
  ];
  for (const [name, size, read] of attributes) {
    geometry.setAttribute(name, new T.InstancedBufferAttribute(new Float32Array(cards.flatMap(read)), size));
  }
  geometry.instanceCount = cards.length;
  plane.dispose();
  return geometry;
}

function steamTexture(random) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 256;
  const g = canvas.getContext('2d');
  // Transparent borders and overlapping soft puffs remove any card outline.
  for (let i = 0; i < 22; i++) {
    const y = 42 + random() * 167;
    const spread = 12 + Math.sin(y / 256 * Math.PI) * 17;
    const x = 64 + (random() - .5) * 31;
    const gradient = g.createRadialGradient(x, y, 0, x, y, spread);
    gradient.addColorStop(0, 'rgba(255,255,255,.21)');
    gradient.addColorStop(.4, 'rgba(255,255,255,.13)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gradient;
    g.fillRect(x - spread, y - spread, spread * 2, spread * 2);
  }
  // A small low plume anchors the vapour to the vent rather than floating alone.
  const foot = g.createRadialGradient(64, 221, 1, 64, 221, 14);
  foot.addColorStop(0, 'rgba(255,255,255,.24)');
  foot.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = foot; g.fillRect(47, 204, 34, 34);
  return new T.CanvasTexture(canvas);
}

function reflectionTexture(random) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 512;
  const g = canvas.getContext('2d');
  const left = [], right = [];
  for (let y = 17; y <= 495; y += 14) {
    const envelope = Math.pow(Math.max(0, Math.sin((y - 17) / 478 * Math.PI)), .6);
    const width = (54 + random() * 48) * envelope;
    const drift = Math.sin(y * .026) * 12 + (random() - .5) * 9;
    left.push([128 + drift - width, y]); right.push([128 + drift + width, y]);
  }
  g.save(); g.beginPath();
  g.moveTo(...left[0]);
  for (const point of left.slice(1)) g.lineTo(...point);
  for (const point of right.reverse()) g.lineTo(...point);
  g.closePath(); g.clip();
  // Soft penumbra plus many broken, thin vertical streaks instead of a solid fill.
  const halo = g.createLinearGradient(0, 0, 256, 0);
  halo.addColorStop(0, 'rgba(255,255,255,0)');
  halo.addColorStop(.32, 'rgba(255,255,255,.035)');
  halo.addColorStop(.5, 'rgba(255,255,255,.13)');
  halo.addColorStop(.68, 'rgba(255,255,255,.035)');
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = halo; g.fillRect(0, 17, 256, 478);
  for (let i = 0; i < 125; i++) {
    const x = 128 + (random() + random() - 1) * 83;
    const y = 22 + random() * 450;
    const width = 1 + random() * 6;
    const length = 3 + random() * 48;
    const strength = .08 + random() * .38;
    g.fillStyle = `rgba(255,255,255,${strength})`;
    g.fillRect(x, y, width, length);
  }
  for (let y = 28; y < 490; y += 4 + random() * 6) {
    if (random() < .4) continue;
    const length = 6 + random() * 94;
    g.fillStyle = `rgba(255,255,255,${.06 + random() * .2})`;
    g.fillRect(128 - length / 2 + (random() - .5) * 55, y, length, .5 + random());
  }
  // Erased fragments reveal asphalt through the reflected sign, including edges.
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 85; i++) {
    g.fillStyle = `rgba(0,0,0,${.2 + random() * .6})`;
    g.fillRect(24 + random() * 208, 15 + random() * 480, 5 + random() * 68, 1 + random() * 4);
  }
  const ends = g.createLinearGradient(0, 0, 0, 512);
  ends.addColorStop(0, 'rgba(0,0,0,1)');
  ends.addColorStop(.13, 'rgba(0,0,0,0)');
  ends.addColorStop(.84, 'rgba(0,0,0,0)');
  ends.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = ends; g.fillRect(0, 0, 256, 512);
  g.restore();
  return new T.CanvasTexture(canvas);
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
