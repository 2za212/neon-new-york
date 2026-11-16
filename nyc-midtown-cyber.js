import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Three original campaigns. Graphics, rather than copy, occupy most of each ad.
function campaignTexture(kind, wide = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = wide ? 384 : 768;
  const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const cyan = '#70e2dc', rose = '#e39bbf', ivory = '#e2e4cf', gold = '#d4b67c';
  const rect = (x, y, a, b, color) => { g.fillStyle = color; g.fillRect(x, y, a, b); };
  const poly = (points, color, stroke = null, width = 3) => {
    g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
    if (color) { g.fillStyle = color; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
  };
  const line = (points, color, width = 3) => { g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = color; g.lineWidth = width; g.stroke(); };
  const text = (s, x, y, size, color = ivory, weight = 700) => { g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = `${weight} ${size}px monospace`; g.fillText(s, x, y); };
  const circle = (x, y, r, color, width = 3, fill = false) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.strokeStyle = color; g.lineWidth = width; if (fill) { g.fillStyle = color; g.fill(); } else g.stroke(); };
  rect(0, 0, w, h, kind === 'human' ? '#1c1424' : '#071d27');
  for (let x = 20; x < w; x += 48) rect(x, 0, 1, h, kind === 'human' ? '#302033' : '#153340');
  for (let y = 18; y < h; y += 48) rect(0, y, w, 1, kind === 'human' ? '#302033' : '#153340');
  rect(20, 20, w - 40, 4, kind === 'human' ? rose : cyan);
  rect(20, h - 24, w - 40, 3, '#6b8e8c');
  if (kind === 'human') {
    text('AUREL', 42, 98, 80, ivory); text('HUMAN CONTINUITY', 46, 158, 25, rose);
    text('STILL YOU.', 46, 593, 49, ivory); text('MORE POSSIBLE.', 46, 645, 40, rose);
    text('PERSONAL SYSTEMS / NY 2086', 48, 711, 19, '#8e778d', 500);
    // Adult 3/4 profile: faceted skin, a retained human eye and visible data spine.
    poly([[574,112],[720,112],[720,139],[774,139],[774,184],[815,184],[815,236],[833,236],[833,284],[869,310],[869,333],[831,345],[831,408],[799,408],[799,463],[750,463],[750,498],[676,498],[676,535],[564,535],[564,486],[529,486],[529,410],[503,410],[503,212],[529,212],[529,154],[574,154]], '#754c67', rose, 4);
    poly([[642,139],[718,139],[718,161],[760,161],[760,202],[791,202],[791,264],[813,264],[813,327],[790,327],[790,396],[761,396],[761,446],[715,446],[715,479],[646,479]], '#c9a1a2');
    poly([[545,222],[598,193],[637,193],[637,476],[599,476],[599,443],[566,443],[566,399],[545,399]], '#3c334f');
    rect(674,257,112,19,'#211c30'); rect(704,261,64,5,ivory); rect(746,353,54,7,'#785b6e');
    for (let i = 0; i < 7; i++) { rect(534,229 + i * 27,54,8,rose); circle(553,233 + i * 27,4,ivory,1,true); }
    poly([[594,539],[692,539],[692,571],[776,571],[776,603],[898,603],[898,656],[455,656],[455,604],[533,604],[533,572],[594,572]], '#53384c', rose, 3);
    for (let i = 0; i < 5; i++) rect(602 + i * 18,542,8,62,'#cc9ba5');
    line([[832,203],[924,203],[924,153],[975,153]],rose,3); text('BIO / 02',884,126,19,'#b48ba3');
    line([[831,414],[941,414],[941,485]],cyan,3); circle(941,498,10,cyan,3);
    for (let i = 0; i < 21; i++) rect(46 + i * 10, 475, 2 + i % 3, 30, '#7b5974');
  } else if (kind === 'network') {
    text('COMMON GRID', 44, 96, 70, ivory); text('ONE CITY. MANY FUTURES.', 48, 156, 25, cyan);
    // Perspective Manhattan parcels and interlinked civic nodes, not a flat logo.
    const parcels = [];
    for (let row = 0; row < 5; row++) for (let col = 0; col < 6; col++) {
      const x = 214 + col * 99 + row * 25, y = 293 + row * 62 - col * 8, hh = 18 + (col * 31 + row * 19) % 105;
      poly([[x,y],[x+62,y-10],[x+90,y+8],[x+28,y+19]],'#446f78',cyan,1);
      poly([[x,y],[x+28,y+19],[x+28,y+19-hh],[x,y-hh]],'#1c4657');
      poly([[x+28,y+19],[x+90,y+8],[x+90,y+8-hh],[x+28,y+19-hh]],'#32717b');
      poly([[x,y-hh],[x+62,y-10-hh],[x+90,y+8-hh],[x+28,y+19-hh]],'#6aaca8');
      for (let k = 0; k < hh / 16; k++) rect(x + 39,y + 5 - k * 16,27,3,'#c0d3b2');
      if ((row + col) % 3 === 0) parcels.push([x + 36,y - hh - 21]);
    }
    parcels.forEach((p,i) => { if (i) line([parcels[i-1],p],i%2?gold:cyan,3); circle(...p,8,cyan,3); });
    line([[105,275],[105,540],[170,584],[780,584],[909,490]],'#d7bd84',5);
    for (const [x,y] of [[105,275],[170,584],[780,584],[909,490]]) { circle(x,y,14,'#071d27',1,true);circle(x,y,8,gold,3); }
    text('CIVIC / 07',48,683,29,cyan);text('LOWER ENERGY / OPEN CONNECTIONS',48,720,20,'#8ca9a4',500);
  } else {
    text('AXIOM', 42, 87, 76, ivory); text('CITY INTELLIGENCE', 46, 145, 25, gold);
    text('SYSTEMS THAT THINK AHEAD', 46, 289, 31, cyan);
    text('MIDTOWN / DATA COMMONS', 48, 334, 19, '#84a5a1',500);
    // An exploded computational sphere, twelve spokes and nested circuit cubes.
    const cx=732,cy=190;
    for(let i=0;i<12;i++){const a=i*Math.PI/6,x=cx+Math.cos(a)*147,y=cy+Math.sin(a)*147;line([[cx,cy],[x,y]],i%3===0?gold:'#497f89',2);circle(x,y,5,cyan,2,true);}
    circle(cx,cy,121,cyan,4);circle(cx,cy,96,'#729e9e',2);circle(cx,cy,66,gold,3);
    for(let r=0;r<5;r++)for(let c=0;c<5;c++){const x=cx-51+c*24,y=cy-51+r*24;if(Math.abs(c-2)+Math.abs(r-2)>3)continue;rect(x,y,14,14,(c+r)%3===0?gold:cyan);}
    poly([[cx,cy-76],[cx+76,cy-31],[cx+76,cy+43],[cx,cy+87],[cx-76,cy+43],[cx-76,cy-31]],null,ivory,2);
    line([[cx-76,cy-31],[cx,cy+13],[cx+76,cy-31]],ivory,2);line([[cx,cy+13],[cx,cy+87]],ivory,2);
    for(let i=0;i<4;i++){const y=197+i*15;rect(47,y,270-i*36,3,i%2?gold:'#579a9c');}
  }
  g.globalAlpha=.07;for(let y=0;y<h;y+=4)rect(0,y,w,1,'#000a14');g.globalAlpha=1;
  const map = new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.magFilter=T.LinearFilter;map.anisotropy=4;
  return map;
}

export function addMidtownCyber(scene, { box, beam, materials, colliders, sign, rand = Math.random }) {
  const stats = { artboards: 0, aircraft: 2, techDevices: 2, dataInstallations: 1, boxes: 0, beams: 0, colliders: 0, lights: 0, independentDrawCalls: 0, injectedSigns: 0, corporateIdentityBoxes: 0, triangles: 0 };
  const ads=[],lights=[],crafts=[];
  const B=(...a)=>{box(...a);stats.boxes++;};
  const L=(...a)=>{beam(...a);stats.beams++;};
  const C=(x,y,z,w,h,d)=>{colliders.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));stats.colliders++;};
  function front(x,z,rot=0){const c=Math.cos(rot),s=Math.sin(rot),P=(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c];return{P,B:(m,u,y,v,w,h,d,t=0xffffff)=>B(m,...P(u,y,v),w,h,d,t,rot),L:(m,a,b,w=.08,t=0xffffff)=>L(m,P(...a),P(...b),w,w,t)};}
  function display(kind,x,y,z,w,h,rot,mountDepth,emitter){
    const f=front(x,z,rot);
    f.B('metal',0,y,0,w+.56,h+.56,.46,0x899b98);
    f.B('rubber',0,y,.245,w+.13,h+.13,.055,0x90a6a3);
    for(const edge of [-1,1]){
      f.B('metal',edge*(w/2+.20),y,.14,.17,h+.37,.55,0x9eaca1);
      for(const yy of [-h*.31,h*.31]){
        f.B('metal',edge*(w/2+.13),y+yy,-mountDepth/2,.36,.34,mountDepth+.28,0x849891);
        f.L('metal',[edge*(w/2+.13),y+yy-.32,-mountDepth],[edge*(w/2+.13),y+yy+.32,.12],.10,0x9caaa0);
      }
      f.B(emitter,edge*(w/2+.30),y+h*.20,.21,.055,h*.29,.055,0xa4c5b8);
    }
    f.B('metal',0,y-h/2-.25,.13,w+.75,.19,.71,0x788f89);
    for(let u=-w/2+.12;u<w/2;u+=.42)f.B('rubber',u,y-h/2-.25,.51,.22,.07,.025,0x88a29b);
    const material=new T.ShaderMaterial({uniforms:{uMap:{value:campaignTexture(kind,kind==='axiom')},uTime:{value:0},uNight:{value:1},uSeed:{value:ads.length*1.73}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
      uniform sampler2D uMap;uniform float uTime;uniform float uNight;uniform float uSeed;varying vec2 vUv;
      void main(){vec3 c=texture2D(uMap,vUv).rgb;
      float scan=.95+.05*sin(vUv.y*1150.0);float drift=.99+.01*sin(uTime*.55+uSeed);
      float head=fract(uTime*.035+uSeed*.17);float sweep=exp(-abs(vUv.y-head)*105.0)*.10;
      c*=scan*drift*mix(1.05,1.72,uNight);c+=vec3(.08,.20,.19)*sweep;
      gl_FragColor=vec4(c,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);mesh.position.set(...f.P(0,y,.287));mesh.rotation.y=rot;mesh.name=`Midtown original moving campaign / ${kind}`;mesh.userData.excludeFromAO=true;scene.add(mesh);ads.push({mesh,material});
    stats.artboards++;stats.independentDrawCalls++;
    // Two service channels terminate in the sign supports, leaving most façade dark.
    for(const u of [-w*.42,w*.42]){
      f.B('metal',u,y-h*.5-2.0,-.12,.20,3.6,.22,0x8da198);
      for(let i=0;i<4;i++)f.B('metal',u,y-h*.5-.5-i*.8,.04,.37,.10,.36,0xa0afa3);
      f.B(emitter,u,y-h*.5-1.1,.08,.055,.65,.04,0x8fb8b0);
    }
  }
  // Confirmed real façade anchors supplied by the Midtown architecture module.
  // A single street-facing campaign belongs to the upper substation pier;
  // its portrait is legible down the block, above the human-scale shop signs.
  display('human',-15,16.1,95.15,8,9.5,Math.PI,.42,'magenta');
  display('network',-20,16,-94.55,9,6,0,.7,'cyan');
  display('human',29,16.5,-93.65,15,7.2,0,1.4,'magenta');
  display('axiom',1,20.2,-145.22,9.4,5.7,0,.4,'cyan');

  // Large, readable identities sit on the true first-tier south walls. Their
  // brackets penetrate the masonry plane, unlike a floating billboard card.
  function corporateIdentity(x,y,z,w,h,title,subtitle,color){
    const before=stats.boxes;
    B('metal',x,y,z-.14,w+.30,h+.30,.14,0x718a87);
    for(const side of [-1,1]){
      B('metal',x+side*(w/2+.16),y,z-.10,.16,h+.38,.34,0x9aaba0);
      B('metal',x,y+side*(h/2+.17),z-.10,w+.46,.12,.34,0x9aaba0);
      for(const dy of [-h*.32,h*.32]){
        B('metal',x+side*w*.38,y+dy,z-.21,.28,.30,.32,0x8a9e94);
        B('metal',x+side*(w/2+.16),y+dy,z+.082,.09,.14,.035,0xb0b8a1);
      }
    }
    if(sign){sign(x,y,z,w,h,title,subtitle,color,0,true);stats.injectedSigns++;}
    stats.corporateIdentityBoxes+=stats.boxes-before;
  }
  // hero: x[-18,2], z=-147, y[16.36,61.08]; sentinel: x[66,82],
  // z=-95, y[.36,67.56]. The entire signs remain within those first tiers.
  corporateIdentity(-15,37,-146.75,2.8,14,'AXIOM','NY / EXCHANGE','#75ddd7');
  corporateIdentity(78.5,38,-94.75,2.6,17,'ORBIT','NY / CORPORATE','#e58fbd');

  // Localized active floor/belt fragments, not a neon outline of every tower.
  for(const [x,z,rot,kind]of [[-12.65,-102,Math.PI/2,'cyan'],[15.65,-102,-Math.PI/2,'magenta']]){
    const f=front(x,z,rot);
    for(const u of [-2.1,2.1]){
      f.B('metal',u,17.7,.18,.27,14.6,.30,0x7f9994);
      for(let i=0;i<7;i++){const yy=10.8+i*2.15;f.B('metal',u,yy,.25,.48,.13,.40,0xa2afa3);if(i!==2&&i!==5)f.B(kind,u,yy+.59,.365,.055,.71,.045,0x93c2b6);}
    }
    for(let i=0;i<4;i++)f.B(kind,-2.0+i*1.1,25.1,.32,.64,.065,.06,0x9cc4b6);
  }

  // Twelve-metre reserved plaza: installation occupies only its central 2.4m.
  const px=8,pz=-134,base=.36;
  B('metal',px,base+.15,pz,2.40,.30,1.55,0x8caaa2);
  B('metal',px,base+.15,pz,1.55,.30,2.40,0x8caaa2);
  B('rubber',px,base+.34,pz,1.76,.11,1.76,0x9cb0a6);
  C(px,base+.36,pz,2.40,.72,2.40);
  for(const ex of [-1,1])for(const ez of [-1,1]){
    B('metal',px+ex*.88,base+.43,pz+ez*.88,.25,.25,.25,0xa8b4a8);
    B('cyan',px+ex*.88,base+.568,pz+ez*.88,.16,.018,.16,0xa4d2c5);
    L('metal',[px+ex*.88,base+.54,pz+ez*.88],[px+ex*.56,base+1.01,pz+ez*.56],.075,.075,0x91a89f);
  }
  B('metal',px,base+.56,pz,1.03,.24,1.03,0x93aaa0);B('cyan',px,base+.70,pz,.72,.035,.72,0xb9d9c8);
  const ringGeos=[];
  for(const [radius,y,tilt]of [[1.02,-.44,Math.PI/2],[.91,.49,Math.PI/2],[1.11,.06,.29]]){
    // Square data frames are merged into the same hologram draw.
    for(const side of [-1,1])for(const horizontal of [true,false]){
      const g=new T.BoxGeometry(horizontal?radius*2:.08,horizontal?.08:radius*2,.08);
      g.translate(horizontal?0:side*radius,horizontal?side*radius:0,0);
      g.rotateX(tilt);g.translate(0,y,0);ringGeos.push(g.toNonIndexed());g.dispose();
    }
  }
  const coreGeometry=new T.BoxGeometry(.80,.80,.80);ringGeos.push(coreGeometry.toNonIndexed());
  const hologramGeometry=mergeGeometries(ringGeos,false);ringGeos.forEach(g=>g.dispose());
  const hologramMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,uniforms:{uTime:{value:0},uNight:{value:1}},vertexShader:`varying vec3 vLocal;varying vec3 vNormal;void main(){vLocal=position;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform float uTime;uniform float uNight;varying vec3 vLocal;varying vec3 vNormal;void main(){float band=.72+.28*sin(vLocal.y*42.0-uTime*.8);vec3 c=mix(vec3(.20,.70,.75),vec3(.74,.40,.67),smoothstep(.12,.72,vLocal.y));float a=(.13+.22*band)*mix(.55,1.0,uNight);gl_FragColor=vec4(c*1.45,a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`});
  const hologram=new T.Mesh(hologramGeometry,hologramMaterial);hologram.position.set(px,base+2.22,pz);hologram.name='Midtown data commons / bounded 3D hologram';hologram.userData.excludeFromAO=true;scene.add(hologram);
  const wire=new T.LineSegments(new T.EdgesGeometry(coreGeometry),new T.LineBasicMaterial({color:0xa4e2d3,transparent:true,opacity:.70,depthWrite:false}));wire.position.copy(hologram.position);wire.name='Midtown data commons / faceted data edges';wire.userData.excludeFromAO=true;scene.add(wire);coreGeometry.dispose();
  stats.independentDrawCalls+=2;
  // Floor light is limited to short navigation nodes at the edge of the commons.
  for(const [x,z,kind]of [[3,-129.1,'cyan'],[12.9,-129.1,'cyan'],[3,-138.9,'magenta'],[12.9,-138.9,'cyan']]){
    B('metal',x,base+.018,z,.45,.035,.64,0x819b94);
    for(let i=0;i<3;i++)B(kind,x,base+.041,z-.18+i*.18,.22,.012,.055,0x95c9bb);
  }
  for(const [x,z,kind]of [[13.2,-129.2,'cyan'],[2.8,-138.8,'magenta']]){
    B('metal',x,base+.10,z,.92,.20,.72,0x8daba1);B('metal',x,base+.89,z,.66,1.42,.53,0x8ca59c);
    B('rubber',x,base+1.07,z+.29,.53,.76,.05,0x8aa49e);B('glass',x,base+1.16,z+.32,.43,.42,.025,0x8bc2bb);
    for(let i=0;i<4;i++)B(kind,x-.16+i*.10,base+1.16+(i%2)*.08,z+.345,.045,.14+(i%2)*.12,.012,0x94c6b7);
    B('metal',x,base+1.64,z,.79,.12,.69,0xa7b5a6);B(kind,x,base+1.71,z+.26,.51,.025,.035,0xa4c9b8);
    for(let i=0;i<4;i++)B('rubber',x,base+.48+i*.10,z+.29,.39,.025,.025,0x91a69d);
    C(x,base+.88,z,.79,1.76,.69);
  }

  const bodyMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.54,metalness:.35});bodyMaterial.name='Midtown aerial traffic / painted alloy';
  const engineMaterial=new T.MeshBasicMaterial({vertexColors:true,color:0x8ed8d1,toneMapped:true});engineMaterial.name='Midtown aerial traffic / bounded running lights';
  function aircraft(x,y,z,phase,rot,color){
    const group=new T.Group(),body=[],engines=[];
    const make=(list,xx,yy,zz,w,h,d,tint)=>{const g=new T.BoxGeometry(w,h,d);g.translate(xx,yy,zz);const c=new T.Color(tint),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(a,3));list.push(g);};
    make(body,0,0,0,1.35,.43,2.60,color);make(body,0,.32,-.12,1.12,.29,1.36,0x294454);make(body,0,.49,-.12,1.16,.085,1.42,0x9baea5);
    make(body,0,-.29,.35,.92,.16,1.75,0x30464c);make(body,0,.18,1.18,1.22,.16,.35,0x9eb5a8);
    for(const side of [-1,1]){
      make(body,side*.92,-.06,-.12,.78,.105,1.48,0x7c9c99);make(body,side*1.15,-.06,.40,.31,.30,.66,0x354f55);make(body,side*1.15,-.06,-.64,.31,.30,.66,0x354f55);
      make(engines,side*1.15,-.226,.40,.22,.025,.43,0x6acbcc);make(engines,side*1.15,-.226,-.64,.22,.025,.43,0x6acbcc);
      make(engines,side*.45,.12,1.365,.22,.075,.025,0xd4d5af);make(engines,side*.45,.09,-1.315,.18,.045,.025,0xc77b89);
    }
    for(const [parts,material]of [[body,bodyMaterial],[engines,engineMaterial]]){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,material);mesh.castShadow=false;mesh.name='Midtown slow aerial traffic';group.add(mesh);stats.independentDrawCalls++;stats.triangles+=geometry.index.count/3;}
    group.position.set(x,y,z);group.rotation.y=rot;group.name='Midtown slow commuter / original voxel craft';scene.add(group);crafts.push({group,x,y,z,phase,rot});
  }
  aircraft(-1.8,24,-77,.7,Math.PI,0xa0afa2);aircraft(6.1,31,-121,3.2,.3,0x798d99);
  for(const [x,y,z,color,power,reach]of [[-20,14,-93.3,0x66dcd8,50,13],[29,14.5,-92.1,0xe584b2,62,15],[-8,6.4,-142.2,0x9ccfc4,42,13],[8,3.3,-134,0x64d6ce,28,8]]){
    const light=new T.PointLight(color,power,reach,2);light.castShadow=false;light.position.set(x,y,z);light.userData.nightPower=power;scene.add(light);lights.push(light);
  }
  stats.lights=lights.length;
  stats.triangles+=(stats.boxes+stats.beams)*12+(stats.artboards+stats.injectedSigns)*2+hologramGeometry.attributes.position.count/3+wire.geometry.attributes.position.count/2;
  stats.injectedSignDrawsCountedByParent=true;
  stats.graphicCampaigns=['AUREL / human continuity','COMMON GRID / civic network','AXIOM / city intelligence'];
  stats.plazaFootprint={minX:6.8,maxX:9.2,minZ:-135.2,maxZ:-132.8};
  let night=true;
  function setNight(value){night=Boolean(value);for(const a of ads)a.material.uniforms.uNight.value=night?1:0;hologramMaterial.uniforms.uNight.value=night?1:0;wire.material.opacity=night?.70:.32;for(const l of lights)l.intensity=l.userData.nightPower*(night?1:.14);}
  function update(dt,time){const t=Number.isFinite(time)?time:0;for(const a of ads)a.material.uniforms.uTime.value=t;hologramMaterial.uniforms.uTime.value=t;hologram.rotation.y=t*.13;wire.rotation.y=-t*.19;wire.rotation.z=Math.sin(t*.24)*.16;for(const f of crafts){f.group.position.set(f.x+Math.sin(t*.065+f.phase)*1.65,f.y+Math.sin(t*.32+f.phase)*.18,f.z+Math.sin(t*.045+f.phase)*4.1);f.group.rotation.y=f.rot+Math.sin(t*.055+f.phase)*.07;}}
  setNight(true);
  return{stats,update,setNight};
}
