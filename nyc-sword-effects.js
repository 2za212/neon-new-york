import * as T from 'three';

const clipKey = role => role?.replace('slash-', 'attack-');
const vertex = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const trailVertex = `attribute float fade; varying vec2 vUv; varying float vFade;
void main(){vUv=uv;vFade=fade;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.0);}`;

// Cascade cannot execute in Three.js. These renderers use the exported UE
// meshes/textures and notify/socket data, with the same blue trail palette.
export function createSwordEffects({parent, bones, data, textures = {}, slashGeometry}) {
  const group = new T.Group();
  group.name = 'UE Rapier notify effects';
  group.userData.excludeFromAO = true;
  parent.add(group);
  const stats = {role: null, time: 0, active: 0, spawned: 0, sources: []};
  parent.userData.swordEffects = stats;
  const sockets = data.sockets['/Game/VoxelCharacter/SKM_Reference_UniformVoxel'];
  const anchors = new Map();
  for (const [name, socket] of Object.entries(sockets)) {
    const bone = bones.get(socket.bone);
    if (!bone) continue;
    const anchor = new T.Object3D();
    anchor.name = `Rapier FX ${name}`;
    const p = socket.positionCm, q = socket.quaternion;
    anchor.position.set(p[0] * .01, p[2] * .01, p[1] * .01);
    anchor.quaternion.set(-q[0], -q[2], -q[1], q[3]);
    anchor.scale.set(socket.scale[0], socket.scale[2], socket.scale[1]);
    bone.add(anchor);anchors.set(name, anchor);
  }
  const material = (map, trail = false) => new T.ShaderMaterial({
    uniforms: {map: {value: map}, wave: {value: textures.wave}, age: {value: 0}, opacity: {value: 1}},
    vertexShader: trail ? trailVertex : vertex,
    fragmentShader: trail
      ? `uniform sampler2D map; varying vec2 vUv; varying float vFade;
         void main(){float mask=texture2D(map,vUv).r;gl_FragColor=vec4(.21,.68,.77,mask*vFade*.75);}`
      : `uniform sampler2D map;uniform sampler2D wave;uniform float age;uniform float opacity;varying vec2 vUv;
         void main(){float shape=texture2D(map,vUv).r;float flow=texture2D(wave,vUv-vec2(age*.5,0.)).r;
         float mask=shape*mix(.45,1.,flow);gl_FragColor=vec4(.32,1.15,1.5,mask*opacity);}`,
    transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
    toneMapped: false,
  });
  let events = [], fired = new Set(), active = [];
  const inverse = new T.Matrix4(), world = new T.Matrix4(), offset = new T.Matrix4();
  const position = new T.Vector3(), quaternion = new T.Quaternion(), scale = new T.Vector3(1, 1, 1);

  function remove(effect) {
    group.remove(effect.mesh);
    if (effect.ownGeometry) effect.mesh.geometry.dispose();
    effect.mesh.material.dispose();
  }
  function clear() {
    active.forEach(remove);active=[];events=[];fired.clear();
    stats.role=null;stats.active=0;
  }
  function begin(role) {
    clear();events=data.clips[clipKey(role)]?.events??[];stats.role=role;stats.time=0;
  }
  function anchorMatrix(notify) {
    const anchor=anchors.get(notify.socket_name)||bones.get('root');
    const p=notify.location_offset??[0,0,0], r=(notify.rotation_offset??[0,0,0]).map(v=>v*Math.PI/360);
    const [sp,sy,sr]=r.map(Math.sin), [cp,cy,cr]=r.map(Math.cos);
    // UE Rotator -> quaternion, then UE centimetres/Z-up -> glTF metres/Y-up.
    const x=cr*sp*sy-sr*cp*cy, y=-cr*sp*cy-sr*cp*sy, z=cr*cp*sy-sr*sp*cy;
    quaternion.set(-x,-z,-y,cr*cp*cy+sr*sp*sy);
    position.set(p[0]*.01,p[2]*.01,p[1]*.01);
    offset.compose(position,quaternion,scale);
    return world.copy(anchor.matrixWorld).multiply(offset);
  }
  function spawn(event) {
    const notify = event.notify_state_class ?? event.notify;
    if (!notify?.ps_template) return;
    const source = notify.ps_template.path;
    let effect;
    if (notify.class === 'AnimNotifyState_Trail') {
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(64 * 6 * 3), 3).setUsage(T.DynamicDrawUsage));
      geometry.setAttribute('uv', new T.BufferAttribute(new Float32Array(64 * 6 * 2), 2).setUsage(T.DynamicDrawUsage));
      geometry.setAttribute('fade', new T.BufferAttribute(new Float32Array(64 * 6), 1).setUsage(T.DynamicDrawUsage));
      geometry.setDrawRange(0, 0);
      const mesh = new T.Mesh(geometry, material(textures.trail, true));
      effect = {mesh, ownGeometry: true, history: [], event, first: anchors.get(notify.first_socket_name), second: anchors.get(notify.second_socket_name), life: .65};
    } else if (event.name === 'P_Slash01' && slashGeometry) {
      const mesh = new T.Mesh(slashGeometry, material(textures.slash));
      mesh.matrix.copy(inverse.copy(group.matrixWorld).invert().multiply(anchorMatrix(notify)));
      mesh.matrixAutoUpdate = false;
      // The source circle_slash mesh emitter uses a constant size of two.
      mesh.matrix.scale(new T.Vector3(2, 2, 2));
      effect = {mesh, event, life: .4};
    } else if (event.name.startsWith('Sparks_')) {
      const count = event.name === 'Sparks_P' ? 16 : 10;
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(count * 3), 3).setUsage(T.DynamicDrawUsage));
      const mesh = new T.Points(geometry, new T.PointsMaterial({map: textures.spark, color: '#76dfff', size: .055,
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false}));
      // Keep the emitted points in world space even when the character moves.
      mesh.onBeforeRender = () => { mesh.matrixWorld.identity(); };
      const matrix = anchorMatrix(notify).clone(), origin = new T.Vector3().setFromMatrixPosition(matrix);
      const velocities = Array.from({length: count}, (_, i) => {
        const angle = i * 2.399963, radius = .65 + (i % 4) * .25;
        return new T.Vector3(Math.cos(angle) * radius, .35 + i % 3 * .35, Math.sin(angle) * radius).transformDirection(matrix).multiplyScalar(radius);
      });
      effect = {mesh, ownGeometry: true, event, life: .4, origin, velocities};
    }
    if (!effect) return;
    effect.mesh.name = event.name;effect.mesh.frustumCulled = false;
    group.add(effect.mesh);active.push(effect);stats.spawned++;
    if (!stats.sources.includes(source)) stats.sources.push(source);
  }
  function update(dt, time) {
    stats.time = time;
    if (!stats.role) return;
    parent.updateWorldMatrix(true, true);
    events.forEach((event, index) => {
      if (!fired.has(index) && time >= event.time) {fired.add(index);spawn(event);}
    });
    active = active.filter(effect => {
      const age = time - effect.event.time;
      if (age > effect.event.duration + effect.life) {remove(effect);return false;}
      if (effect.history) {
        if (time <= effect.event.endTime && effect.first && effect.second) {
          const a = effect.first.getWorldPosition(new T.Vector3()), b = effect.second.getWorldPosition(new T.Vector3());
          effect.history.push({a, b, time});
        }
        effect.history = effect.history.filter(sample => time - sample.time <= effect.life).slice(-64);
        const geometry = effect.mesh.geometry, ps = geometry.attributes.position, uv = geometry.attributes.uv, fade = geometry.attributes.fade;
        let count = 0;
        for (let i = 1; i < effect.history.length; i++) {
          const old = effect.history[i - 1], next = effect.history[i];
          for (const [sample, tip] of [[old,0],[old,1],[next,0],[old,1],[next,1],[next,0]]) {
            const p = tip ? sample.b : sample.a;
            ps.setXYZ(count,p.x,p.y,p.z);uv.setXY(count,(time-sample.time)/effect.life,tip);
            fade.setX(count,Math.max(0,1-(time-sample.time)/effect.life));count++;
          }
        }
        geometry.setDrawRange(0,count);ps.needsUpdate=uv.needsUpdate=fade.needsUpdate=true;
      } else if (effect.velocities) {
        const ps = effect.mesh.geometry.attributes.position;
        effect.velocities.forEach((v,i)=>ps.setXYZ(i,effect.origin.x+v.x*age,effect.origin.y+v.y*age-age*age*.6,effect.origin.z+v.z*age));
        ps.needsUpdate=true;effect.mesh.material.opacity=Math.max(0,1-age/effect.life);
      } else {
        effect.mesh.material.uniforms.age.value=age;
        effect.mesh.material.uniforms.opacity.value=Math.max(0,1-age/effect.life);
      }
      return true;
    });
    stats.active = active.length;
  }
  return {group, begin, clear, update};
}
