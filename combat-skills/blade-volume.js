import * as T from 'three';

const vector = () => new T.Vector3();
const up = new T.Vector3(0, 1, 0);
const tau = Math.PI * 2;
const clamp = T.MathUtils.clamp;
const ease = T.MathUtils.smoothstep;
const hash = n => T.MathUtils.euclideanModulo(Math.sin(n * 127.1 + 4.3) * 43758.5453, 1);
const finish = `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const vertex = `
  varying vec2 st;
  varying vec3 world, normalW;
  void main() {
    st = uv;
    vec4 p = modelMatrix * vec4(position, 1.);
    world = p.xyz;
    normalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * p;
  }`;

function transparent(fragmentShader, uniforms, options = {}) {
  return new T.ShaderMaterial({
    vertexShader: vertex, fragmentShader, uniforms,
    transparent: true, depthWrite: false, side: T.DoubleSide, forceSinglePass: true,
    ...options,
  });
}

// The UV grid is wrapped in world space. Normals follow the cross-section as
// the geometry bends, so highlights stay on the energy when the view changes.
function surface(group, rows, sides, material, order) {
  const geometry = new T.PlaneGeometry(1, 1, sides, rows);
  const points = geometry.attributes.position.setUsage(T.DynamicDrawUsage);
  const normals = geometry.attributes.normal.setUsage(T.DynamicDrawUsage);
  const mesh = new T.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = order;
  group.add(mesh);
  return {
    mesh,
    fill(ring) {
      let i = 0;
      for (let row = 0; row <= rows; row++) {
        const section = ring(row / rows);
        for (let side = 0; side <= sides; side++, i++) {
          const a = tau * side / sides;
          const c = Math.cos(a), s = Math.sin(a);
          const { center, right, vertical, radius, height } = section;
          points.setXYZ(i,
            center.x + right.x * c * radius + vertical.x * s * height,
            center.y + right.y * c * radius + vertical.y * s * height,
            center.z + right.z * c * radius + vertical.z * s * height);
          normals.setXYZ(i, right.x * c + vertical.x * s,
            right.y * c + vertical.y * s, right.z * c + vertical.z * s);
        }
      }
      points.needsUpdate = true;
      normals.needsUpdate = true;
    },
  };
}

export function createBladeVolume(group) {
  const tint = {value: new T.Color()};
  const filament = {value: new T.Color()};
  const clock = {value: 0};
  const strength = {value: 0};
  const mantle = surface(group, 52, 20, transparent(`
    varying vec2 st;
    varying vec3 world, normalW;
    uniform vec3 tint, filament;
    uniform float clock, strength;
    void main() {
      float age = 1. - st.y;
      float a = st.x * 6.2831853;
      float facing = abs(dot(normalize(cameraPosition-world), normalize(normalW)));
      float eddy = sin(age * 37. - clock * 23. + a * 4.) * .25 + sin(age * 71. + clock * 17. - a * 3.) * .14;
      float twist = a + 10.9 * age - clock * 19. + eddy;
      float ridges = pow(.5 + .5 * cos(twist * 2.), 15.);
      float secondary = pow(.5 + .5 * cos(a * 3. - age * 22. + clock * 14.), 21.);
      float crossLight = .45 + .55 * pow(.5+.5*sin(a + age * 5. - .8),1.45);
      float moving = .69 + .31 * sin(age * 53. + sin(a * 3.) * 1.6 + clock * 24.);
      float rim = pow(1. - facing, 2.15);
      float fade = pow(1. - age, .79) * smoothstep(.0, .035, age);
      float shear = .53 + .47*pow(.5+.5*sin(age*27.-clock*24.+a*3.+eddy*5.),2.);
      vec3 color = tint * (.49 + moving * .25 + rim * .49)
        + filament * (ridges * .66 + secondary * .42);
      float alpha = (.024 + .091 * rim + .24 * ridges + .081 * secondary) * fade * strength * crossLight * shear;
      gl_FragColor = vec4(color, alpha);
    ` + finish, {tint, filament, clock, strength}, {blending:T.AdditiveBlending}), 6);
  const channel = surface(group, 42, 10, transparent(`
    varying vec2 st;
    varying vec3 world, normalW;
    uniform vec3 tint, filament;
    uniform float clock, strength;
    void main() {
      float age = 1. - st.y;
      float a = st.x * 6.2831853;
      float facing = abs(dot(normalize(cameraPosition-world),normalize(normalW)));
      float pulse = .62 + .38 * pow(.5 + .5 * cos(age * 34. + a * 2. + clock * 29.), 4.);
      float fade = pow(1. - age, 1.32) * smoothstep(.0,.03,age);
      gl_FragColor = vec4(mix(tint,filament,.87)*1.06, fade * strength * pulse * (.44 + facing * .15));
    ` + finish, {tint, filament, clock, strength}, {blending:T.AdditiveBlending}), 7);

    const streamMaterial = transparent(`
    varying vec2 st;
    uniform vec3 filament;
    uniform float clock, strength;
    void main() {
      float age = 1.-st.y;
      float filamentPulse = .41+.59*pow(.5+.5*cos(age*49.+clock*20.),2.);
      float span = smoothstep(0.,.09,age)*(1.-smoothstep(.55,1.,age));
      gl_FragColor = vec4(filament*1.04,span*strength*filamentPulse*.64);
    ` + finish, {filament,clock,strength},{blending:T.AdditiveBlending});
  const stream = surface(group, 77, 6, streamMaterial, 7.05);
  const fringeTint = {value:new T.Color()};
  const fringe = surface(group, 74, 6, streamMaterial.clone(), 7.04);
  fringe.mesh.material.uniforms = {filament:fringeTint,clock,strength};
  const motes = new T.InstancedMesh(new T.IcosahedronGeometry(1,0),
    new T.MeshBasicMaterial({transparent:true,blending:T.AdditiveBlending,depthWrite:false}),48);
  group.add(motes);
  motes.frustumCulled = false;
  motes.renderOrder = 7.06;
  motes.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const particle = new T.Object3D();
  const baseColors = [new T.Color(),new T.Color()];
  const fleckColor = new T.Color();
  const seeds = Array.from({length:motes.count}, (_,i) => ({
    progress:hash(i*4+1), phase:hash(i*4+2)*tau, radius:hash(i*4+3), length:hash(i*4+4),
  }));
  const center = vector(), sample = vector(), tangent = vector(), right = vector(), vertical = vector();
  const ring = {center, right, vertical, radius:0, height:0};
  return function update(time, start, head, duration, amplitude, returning, samplePoint) {
    const visible = amplitude > .005 && head > start + .002;
    channel.mesh.visible = mantle.mesh.visible = stream.mesh.visible = fringe.mesh.visible = motes.visible = visible;
    if (!visible) return;
    clock.value = time;
    strength.value = amplitude;
    if (returning) {
      tint.value.setRGB(.23, .055, 1.34);
      filament.value.setRGB(.065, .74, 1.58);
      fringeTint.value.setRGB(.47,.125,1.68);
      baseColors[0].setRGB(.16,.87,1.65);
      baseColors[1].setRGB(.67,.21,1.44);
    } else {
      tint.value.setRGB(1.73, .22, .025);
      filament.value.setRGB(2.5, .94, .20);
      fringeTint.value.setRGB(2.35,.20,.025);
      baseColors[0].setRGB(2.8,.92,.21);
      baseColors[1].setRGB(1.8,.29,.052);
    }
    const tail = Math.max(start, head - duration);
    function shape(age, core) {
      const t = T.MathUtils.lerp(head, tail, age);
      samplePoint(center, t);
      samplePoint(sample, t - .007);
      tangent.copy(center).sub(sample).normalize();
      right.crossVectors(up, tangent).normalize();
      vertical.crossVectors(tangent, right).normalize();
      const breath = .9 + .10 * Math.sin(age * 21. + time * 28.);
      const falloff = Math.pow(1. - age, .56);
      ring.radius = (.012 + (core ? .057 : returning ? .245 : .215) * falloff) * breath;
      ring.height = ring.radius * (core ? .73 : .82);
      return ring;
    }
    mantle.fill(age => shape(age, false));
    channel.fill(age => shape(age, true));
    function thread(age, phase) {
      shape(age,false);
      const angle = phase + age * (returning?11.2:7.8) - time * 17.0 + Math.sin(age*39.)*.13;
      const distance = ring.radius * (.88 + .23 * Math.sin(phase+age*12.6));
      center.addScaledVector(right, Math.cos(angle)*distance).addScaledVector(vertical,Math.sin(angle)*distance*.82);
      ring.radius = ring.height = (.002+.006*Math.sin(Math.PI*age))*Math.pow(1.-age,.36);
      return ring;
    }
    stream.fill(age => thread(age,.36));
    fringe.fill(age => thread(age,3.37));
    for(let i=0;i<seeds.length;i++) {
      const p=seeds[i], age=.07+.89*p.progress;
      shape(age,false);
      const angle=p.phase+time*(2.1+p.radius*3.7);
      const distance=ring.radius*(.54+p.radius*1.87);
      particle.position.copy(center).addScaledVector(right,Math.cos(angle)*distance)
        .addScaledVector(vertical,Math.sin(angle)*distance);
      particle.quaternion.setFromUnitVectors(up,tangent);
      const fade=(1.-age)*amplitude*(.54+.46*Math.sin(p.phase+time*19.)**2);
      const width=(.003+.007*p.radius)*fade;
      particle.scale.set(width,(.018+.103*p.length)*fade,width);
      particle.updateMatrix();
      motes.setMatrixAt(i,particle.matrix);
      motes.setColorAt(i,fleckColor.copy(baseColors[i%2]).multiplyScalar(fade*1.7));
    }
    motes.instanceMatrix.needsUpdate = true;
    motes.instanceColor.needsUpdate = true;
  };
}

export function createSwordSheath(group) {
  const tint = {value: new T.Color()};
  const strength = {value: 0};
  const clock = {value: 0};
  const sleeve = surface(group, 26, 20, transparent(`
    varying vec2 st;
    varying vec3 world, normalW;
    uniform vec3 tint;
    uniform float strength, clock;
    void main() {
      float head = st.y;
      float a = st.x * 6.2831853;
      float facing = abs(dot(normalize(cameraPosition-world), normalize(normalW)));
      float helix = pow(.5 + .5 * cos(a * 2. + head * 23. + clock * 29.), 18.);
      float lip = pow(1. - facing, 3.);
      float fade = smoothstep(.015, .15, head) * (1. - smoothstep(.83, 1., head));
      gl_FragColor = vec4(tint * (.53 + .59 * helix + .59 * lip),
        (.025 + .091 * lip + .31 * helix) * fade * strength);
    ` + finish, {tint, strength, clock}, {blending:T.AdditiveBlending}), 7.2);
  const section = {center:vector(), right:new T.Vector3(1,0,0), vertical:new T.Vector3(0,0,1), radius:0, height:0};
  sleeve.fill(u => {
    section.center.set(0, -1.23 + 1.44 * u, 0);
    const shape = Math.sin(Math.PI * u) ** .69;
    section.radius = .008 + .114 * shape;
    section.height = .008 + .083 * shape;
    return section;
  });
  return (t, amplitude, returning) => {
    sleeve.mesh.visible = amplitude > .025;
    strength.value = amplitude;
    clock.value = t;
    if (returning) tint.value.setRGB(.19, .88, 1.70);
    else tint.value.setRGB(2.30, .78, .12);
  };
}

export function createDeckGlints(group, forward, side) {
  const tint = {value: new T.Color()};
  const amplitude = {value: 0};
  const source = {value: vector()};
  const strike = {value: vector()};
  const contact = {value: 0};
  const mesh = new T.Mesh(new T.PlaneGeometry(1,1), transparent(`
    varying vec2 st;
    varying vec3 world;
    uniform vec3 tint, source, strike, forward, lateral;
    uniform float amplitude, contact;
    float hash(vec2 p) { return fract(sin(dot(p,vec2(27.41,91.74)))*43758.5453); }
    void main() {
      vec3 d = world-source, hit = world-strike;
      float x = dot(d,lateral), z = dot(d,forward);
      float body = exp(-x*x*4.6-z*z*1.9);
      float tight = exp(-x*x*54.-z*z*2.1);
      float pool = exp(-dot(hit.xz,hit.xz)*1.52);
      float stone = hash(floor(world.xz*vec2(7.,14.)));
      float ripple = .35 + .65*pow(.5+.5*sin(world.z*117.+world.x*22.+stone*2.1),3.);
      float broken = smoothstep(.19,.78,stone)*ripple;
      float joints = smoothstep(.022,.07,abs(fract(world.z)-.5));
      float wet = broken * joints;
      float edge = 1.-smoothstep(.36,.50,max(abs(st.x-.5),abs(st.y-.5)));
      gl_FragColor = vec4(tint*(.61 + 1.46*tight*wet)
        + vec3(2.28,.92,.21)*pool*contact*.64,
        ((body*.09+tight*wet*.43)*amplitude+pool*contact*(.14+.44*wet))*edge);
    ` + finish, {
      tint, amplitude, source, strike, contact,
      forward:{value:forward}, lateral:{value:side},
    }, {blending:T.AdditiveBlending}));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = .007;
  mesh.scale.set(6.5,6.5,1);
  mesh.renderOrder = 4;
  group.add(mesh);
  return (point, hit, gain, impact, returning) => {
    mesh.visible = gain + impact > .01;
    if (!mesh.visible) return;
    source.value.copy(point);
    strike.value.copy(hit);
    mesh.position.x = gain > .08 ? point.x : hit.x;
    mesh.position.z = gain > .08 ? point.z : hit.z;
    amplitude.value = gain / (1. + point.y * point.y * 1.65);
    contact.value = impact;
    if (returning) tint.value.setRGB(.072,.41,1.55);
    else tint.value.setRGB(2.28,.89,.19);
  };
}

export function createArmorImpact(group, forward, side) {
  const age = {value: 0};
  const strength = {value: 0};
  const burst = surface(group, 60, 10, transparent(`
    varying vec2 st;
    varying vec3 world, normalW;
    uniform float age, strength;
    void main() {
      float a = (1.-st.y)*6.2831853;
      float across = st.x*6.2831853;
      float rim = pow(1.-abs(dot(normalize(cameraPosition-world), normalize(normalW))),2.6);
      float seams = .50 + .24*sin(a*5.+.5) + .15*sin(a*11.-age*17.) + .11*sin(a*21.);
      float cuts = smoothstep(.27,.61,seams);
      float colorStep = .5 + .5*cos(across+1.);
      vec3 hot = mix(vec3(2.4,.22,.028),vec3(2.15,.83,.14),colorStep);
      float ridged = .56+.44*pow(.5+.5*sin(a*38.+age*20.),3.);
      gl_FragColor = vec4(hot,(.28+.72*rim)*cuts*(.46+.54*ridged)*strength);
    ` + finish, {age,strength}, {blending:T.AdditiveBlending}), 7.8);
  const center = {value:vector()};
  const radius = {value:1};
  const smoke = new T.Mesh(new T.SphereGeometry(1,20,12), transparent(`
    varying vec3 world;
    uniform vec3 center;
    uniform float radius, strength, age;
    float hash(vec3 p){p=fract(p*.31831+.17)*17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float cloud(vec3 p){
      vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
    }
    void main() {
      vec3 ray = normalize(world - cameraPosition);
      vec3 local = (cameraPosition - center) / radius;
      float b = dot(local, ray);
      float root = sqrt(max(0.,b*b-dot(local,local)+1.));
      float nearZ = max(0.,-b-root);
      float span = max(0.,-b+root-nearZ);
      float fog = 0., lit = 0.;
      for(int i=0;i<10;i++){
        vec3 p = local + ray * (nearZ + span*(float(i)+.5)/10.);
        vec3 q = p * 4.1 + vec3(.7,-age*1.2,age*2.);
        float body = (1.-smoothstep(.17,1.,dot(p,p))) * smoothstep(.33,.78, cloud(q)*.74+cloud(q*2.1)*.26);
        fog += body;
        lit += body * exp(-3.1*length(p-vec3(.08,-.15,.22)));
      }
      vec3 steelGray = mix(vec3(.16,.19,.22),vec3(1.62,.49,.19), clamp(lit*strength*.85,0.,1.));
      gl_FragColor = vec4(steelGray, min(.52, fog*.16*span*strength));
    ` + finish, {center,radius,age,strength:{value:0}}, {side:T.FrontSide}));
  smoke.renderOrder = 7.6;
  group.add(smoke);

  const flash = new T.Mesh(new T.IcosahedronGeometry(1,2), transparent(`
    uniform float flash;
    varying vec3 world, normalW;
    void main() {
      float facing = abs(dot(normalize(cameraPosition - world),normalize(normalW)));
      gl_FragColor = vec4(mix(vec3(3.4,.65,.07),vec3(4.,2.85,1.35),facing),flash * (.25 + .75*facing));
    ` + finish, {flash:{value:0}}, {side:T.FrontSide,blending:T.AdditiveBlending}));
  flash.renderOrder = 8.1;
  group.add(flash);

  const count = 42;
  const shards = new T.InstancedMesh(new T.IcosahedronGeometry(1,0),
    new T.MeshStandardMaterial({color:0xffffff,roughness:.42,metalness:.36,emissive:0xc97a27,emissiveIntensity:.23}),count);
  shards.instanceMatrix.setUsage(T.DynamicDrawUsage);
  shards.frustumCulled = false;
  group.add(shards);
  const chip = new T.Object3D();
  const hot = new T.Color(0xffb061), dark = new T.Color(0x594239);
  for(let i=0;i<count;i++) shards.setColorAt(i,dark.clone().lerp(hot,hash(i*7+2)*.78));

  const sparkCount = 70;
  const sparks = new T.InstancedMesh(new T.IcosahedronGeometry(1,0),
    new T.MeshBasicMaterial({color:0xffffff,transparent:true,blending:T.AdditiveBlending,depthWrite:false}),sparkCount);
  sparks.instanceMatrix.setUsage(T.DynamicDrawUsage);
  sparks.frustumCulled = false;
  sparks.renderOrder = 8.5;
  group.add(sparks);
  const velocity=vector(), direction=vector();
  const color=new T.Color();
  const particle = Array.from({length:Math.max(count,sparkCount)},(_,i) => {
    const a=tau*hash(i*5+3);
    return {a:Math.cos(a), b:Math.sin(a), push:hash(i*5+1), life:hash(i*5+2), size:hash(i*5+4)};
  });
  const ring = {center:vector(), right:vector(), vertical:vector(), radius:0, height:0};
  const tilted = up.clone().addScaledVector(forward,-.29).normalize();
  const axis = forward.clone().addScaledVector(up,.29).normalize();
  const rotation = new T.Matrix4().makeBasis(side,tilted,axis);
  flash.quaternion.setFromRotationMatrix(rotation);
  function update(point,t,hit) {
    const active=hit&&t>=0&&t<.57;
    smoke.visible = shards.visible = sparks.visible = active;
    burst.mesh.visible = active && t<.25;
    flash.visible = active && t<.11;
    if(!active) return;
    age.value = t;
    strength.value = .97 * Math.exp(-t*7.1);
    if (burst.mesh.visible) {
      const rad = .09 + 1.70*(1.-Math.exp(-t*8.5));
      burst.fill(u => {
        const a = u*tau;
        const shape = .80+.14*Math.sin(a*3.-.45)+.09*Math.sin(a*7.+.53);
        ring.right.copy(side).multiplyScalar(Math.cos(a)).addScaledVector(tilted,Math.sin(a)).normalize();
        ring.vertical.copy(axis);
        ring.center.copy(point).addScaledVector(ring.right,rad*shape)
          .addScaledVector(axis, -.05-t*.58+Math.sin(a*2.5)*rad*.20);
        ring.radius = (.019+rad*.097)*(.64+.36*Math.cos(a*3.));
        ring.height = (.032+rad*.141)*(.78+.22*Math.cos(a*4.));
        return ring;
      });
    }
    center.value.copy(point).addScaledVector(forward,-.24-t*.65);
    center.value.y+=.02+t*.32;
    radius.value = .36+t*2.9;
    smoke.position.copy(center.value);
    smoke.scale.setScalar(radius.value);
    smoke.material.uniforms.strength.value = 1.29*Math.exp(-t*4.1);
    if (flash.visible) {
      flash.position.copy(point).addScaledVector(forward,-.047);
      flash.scale.set(.062+.36*t,.095+.43*t,.12+1.01*t);
      flash.material.uniforms.flash.value = .87*Math.exp(-t*22.);
    }
    for(let i=0;i<sparkCount;i++) {
      const p=particle[i];
      const speed=2.1+6.1*p.push;
      const local=Math.max(0,t-.027*p.size);
      const duration=.18+.31*p.life;
      const fade=1.-ease(local,duration*.34,duration);
      velocity.copy(side).multiplyScalar(p.a*speed*.88)
        .addScaledVector(up,p.b*speed*.68+.49)
        .addScaledVector(forward,-speed*(.14+.56*p.size));
      chip.position.copy(point).addScaledVector(velocity,local);
      chip.position.y-=3.8*local*local;
      direction.copy(velocity).addScaledVector(up,-7.6*local).normalize();
      chip.quaternion.setFromUnitVectors(up,direction);
      const length = (.023+.159*p.push)*fade;
      chip.scale.set((.003+.006*p.size)*fade, length, (.003+.006*p.size)*fade);
      chip.updateMatrix();
      sparks.setMatrixAt(i,chip.matrix);
      sparks.setColorAt(i,color.setRGB(2.1*fade,(.31+.84*p.push)*fade,(.075+.15*p.size)*fade));
      if (i>=count) continue;
      velocity.multiplyScalar(.47);
      chip.position.copy(point).addScaledVector(velocity,local);
      chip.position.y=Math.max(.035,chip.position.y-3.4*local*local);
      chip.rotation.set(i+local*14.,i*.8-local*12.,i*.7+local*18.);
      const size=(.013+.034*p.size)*fade;
      chip.scale.set(size*.67,size*(.85+p.push),size*.39);
      chip.updateMatrix();
      shards.setMatrixAt(i,chip.matrix);
    }
    shards.instanceMatrix.needsUpdate = true;
    sparks.instanceMatrix.needsUpdate = true;
    sparks.instanceColor.needsUpdate = true;
  }
  return {update};
}

export function attachArmorPlate(rig) {
  const outline = new T.Shape();
  for (const [i,[x,y]] of [[-.18,-.16],[.13,-.16],[.19,-.10],[.19,.10],[.12,.17],[-.13,.17],[-.19,.11],[-.19,-.11]].entries()) {
    if (i===0) outline.moveTo(x,y);
    else outline.lineTo(x,y);
  }
  outline.closePath();
  const housing = new T.Mesh(new T.ExtrudeGeometry(outline,{
    steps:1,depth:.026,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:1,
  }),new T.MeshStandardMaterial({color:0x344755,metalness:.49,roughness:.52}));
  housing.position.set(0,1.142,.132);
  rig.add(housing);

  const screws = new T.InstancedMesh(new T.CylinderGeometry(.013,.015,.009,6),
    new T.MeshStandardMaterial({color:0x8fa2a4,metalness:.44,roughness:.50}),4);
  const joint = new T.Object3D();
  joint.rotation.x = Math.PI/2;
  for (const [i,[x,y]] of [[-.139,-.108],[.139,-.108],[-.139,.106],[.139,.106]].entries()) {
    joint.position.set(x,1.142+y,.162);
    joint.updateMatrix();
    screws.setMatrixAt(i,joint.matrix);
  }
  rig.add(screws);

  const t = {value:0};
  const flash = new T.Mesh(new T.PlaneGeometry(.34,.29),transparent(`
    varying vec2 st;
    uniform float t;
    float segment(vec2 p,vec2 a,vec2 b) {
      vec2 e=b-a;
      return length(p-a-e*clamp(dot(p-a,e)/dot(e,e),0.,1.));
    }
    void main() {
      vec2 p=(st-.5)*2.;
      p.x -= .22;
      float d = segment(p,vec2(0.),vec2(.19,.17));
      d=min(d,segment(p,vec2(.19,.17),vec2(.25,.48)));
      d=min(d,segment(p,vec2(.25,.48),vec2(.50,.66)));
      d=min(d,segment(p,vec2(0.),vec2(-.23,.06)));
      d=min(d,segment(p,vec2(-.23,.06),vec2(-.40,-.19)));
      d=min(d,segment(p,vec2(-.40,-.19),vec2(-.66,-.25)));
      d=min(d,segment(p,vec2(-.19,.05),vec2(-.33,.37)));
      d=min(d,segment(p,vec2(0.),vec2(.14,-.24)));
      d=min(d,segment(p,vec2(.14,-.24),vec2(.087,-.52)));
      d=min(d,segment(p,vec2(0.),vec2(.41,-.14)));
      float hole = 1.-smoothstep(.11,.25,length(p*vec2(.87,1.22)));
      float dark = max(hole,exp(-d*21.)*.95);
      float hot = exp(-d*74.)*exp(-length(p)*1.7)*exp(-t*5.);
      vec3 color = mix(vec3(.006,.012,.015),vec3(1.62,.28,.037),clamp(hot*1.4,0.,1.));
      gl_FragColor=vec4(color,max(dark*.84,hot)*smoothstep(0.,.047,t));
    `+finish,{t},{side:T.FrontSide,polygonOffset:true,polygonOffsetFactor:-2}));
  flash.position.set(0,1.142,.165);
  flash.renderOrder=3;
  rig.add(flash);
  return (age,hit) => {
    flash.visible=hit&&age>=0;
    t.value=age;
  };
}
