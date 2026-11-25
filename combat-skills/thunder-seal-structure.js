import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const TAU = 2 * Math.PI;
const ease = T.MathUtils.smoothstep;
const up = new T.Vector3(0, 1, 0);
const gold = new T.Color(0xffaa49);

function polygon(points) {
  const shape = new T.Shape();
  shape.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) shape.lineTo(...points[i]);
  shape.closePath();
  return shape;
}

function plateGeometry(shape, depth, bevel) {
  return new T.ExtrudeGeometry(shape, {
    depth, steps:1, bevelEnabled:true, bevelThickness:bevel, bevelSize:bevel,
    bevelOffset:0, bevelSegments:1, curveSegments:10,
  });
}

// Fine grooves are placed down inside openings through the heavy plate. The
// gold bevel catches a different highlight from the recessed emissive face.
function sector(inner, outer, half, depth, bevel) {
  const point = (r,a) => [r*Math.cos(a),r*Math.sin(a)];
  const span = outer-inner;
  const map = ([r,a]) => point(inner+span*r,half*a);
  const outline = [
    [0,-.78],[.13,-.96],[.74,-1],[1,-.81],[1,.81],[.74,1],[.13,.96],[0,.78],
  ].map(map);
  // The long edges follow the arc so neighbouring segments read as one
  // continuous ring. The short shoulders are inset to show assembly joints.
  const shape = new T.Shape();
  shape.moveTo(...outline[0]);
  for(let i=1;i<=3;i++) shape.lineTo(...outline[i]);
  shape.absarc(0,0,outer,-half*.81,half*.81,false);
  for(let i=5;i<=7;i++) shape.lineTo(...outline[i]);
  shape.absarc(0,0,inner,half*.78,-half*.78,true);
  shape.closePath();

  const engraved = [
    [[.21,-.70],[.37,-.73],[.70,-.48],[.70,-.34],[.59,-.39],[.28,-.58],[.21,-.58]],
    [[.27,-.24],[.49,-.24],[.67,.12],[.73,.12],[.73,.28],[.59,.28],[.42,-.05],[.27,-.05]],
    [[.43,.20],[.48,.29],[.34,.61],[.23,.70],[.23,.51]],
    [[.67,.48],[.76,.46],[.79,.63],[.72,.72],[.66,.62]],
  ].map(loop=>polygon(loop.map(map)));
  shape.holes.push(...engraved.map(groove=>new T.Path(groove.getPoints())));
  const plate=plateGeometry(shape,depth,bevel);

  function rail(r,width,start,end){
    const trim=new T.Shape();
    trim.moveTo(...point(r-width*.5,start));
    trim.absarc(0,0,r-width*.5,start,end,false);
    trim.lineTo(...point(r+width*.5,end));
    trim.absarc(0,0,r+width*.5,end,start,true);
    trim.closePath();
    return trim;
  }
  const width=Math.min(.038,span*.071);
  const rails=[rail(outer-span*.086,width,-half*.70,half*.70),
    rail(inner+span*.11,width*.78,-half*.66,half*.66)];
  const trim=plateGeometry(rails,depth*.105,Math.min(.0035,bevel*.32));
  trim.translate(0,0,depth+bevel*.77);
  const backing=new T.ShapeGeometry(shape);
  const lines=new T.ShapeGeometry(engraved);
  return {plate,backing,lines,trim,depth};
}
function uprightStamp() {
  const outline = [[-.13,-.16],[.13,-.16],[.18,-.10],[.14,.135],[.07,.22],[-.07,.22],[-.14,.135],[-.18,-.10]];
  const cuts = [
    [[-.10,-.092],[-.078,-.115],[.077,-.06],[.105,-.006],[.078,.015],[.045,-.028]],
    [[-.16,-.019],[-.107,-.019],[-.033,.041],[-.033,.145],[-.063,.154],[-.072,.069],[-.135,.022]],
    [[.011,.10],[.047,.146],[.085,.114],[.066,.078],[.043,.085],[.028,.055]],
  ];
  const front=polygon(outline);
  front.holes.push(...cuts.map(cut=>new T.Path(polygon(cut).getPoints())));
  return {
    plate:plateGeometry(front,.041,.008),
    backing:new T.ShapeGeometry(front),
    depth:.041,
    lines:new T.ShapeGeometry(cuts.map(polygon)),
  };
}

const reflections=new WeakMap();
export function prepareSealReflection(renderer){
  if(reflections.has(renderer))return reflections.get(renderer).texture;
  const cube=new RoomEnvironment();
  const pmrem=new T.PMREMGenerator(renderer);
  const reflection=pmrem.fromScene(cube,.08);
  cube.dispose();
  pmrem.dispose();
  reflections.set(renderer,reflection);
  return reflection.texture;
}

function makeMaterials(renderer) {
  const envMap=prepareSealReflection(renderer);
  const bronze=new T.MeshStandardMaterial({color:0x5b442d,metalness:.78,roughness:.39,envMap,envMapIntensity:.72});
  const bevel=new T.MeshStandardMaterial({color:0x784721,metalness:.81,roughness:.34,envMap,envMapIntensity:.84});
  const gilding=new T.MeshStandardMaterial({color:0xdfae59,metalness:.85,roughness:.24,
    emissive:0x4d2106,emissiveIntensity:.26,envMap,envMapIntensity:1.16});
  bronze.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 sealPos;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>','#include <begin_vertex>\nsealPos=position;');
    shader.fragmentShader='varying vec3 sealPos;\n'+shader.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec2 forged=sealPos.xy;
        float ax=atan(forged.y,forged.x);
        float rad=length(forged);
        float brushed=sin(ax*1760.+sin(rad*103.)*.69);
        float keep=1.-smoothstep(.14,1.01,fwidth(ax*1760.));
        float strip=.78+.15*brushed*keep+.07*cos(rad*145.+ax*273.);
        float patina=.43+.19*sin(rad*25.+ax*61.)+.19*sin(rad*17.-ax*37.)
          +.19*cos(rad*32.+ax*19.);
        diffuseColor.rgb*=strip*mix(vec3(.65,.79,.89),vec3(1.27,1.06,.71),patina);`)
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor + .11*(1.-strip)+.15*(1.-patina),.10,.85);`);
  };
  const back=new T.MeshStandardMaterial({color:0x211923,metalness:.35,roughness:.72,envMap,side:T.DoubleSide});
  bevel.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 cutSide;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>','#include <begin_vertex>\ncutSide=position;');
    shader.fragmentShader='varying vec3 cutSide;\n'+shader.fragmentShader.replace(
      '#include <color_fragment>',`#include <color_fragment>
        float heading=atan(cutSide.y,cutSide.x);
        float band=exp(-pow((cutSide.z-.028)*176.,2.));
        float lip=exp(-pow((cutSide.z-.023)*219.,2.));
        float gap=smoothstep(.20,.48,abs(sin(heading*64.+length(cutSide.xy)*18.)));
        float milling=.87+.069*cos(cutSide.z*660.+heading*39.)+.051*sin(heading*311.);
        float oxidized=.5+.5*sin(heading*101.5+length(cutSide.xy)*57.);
        vec3 alloy=mix(vec3(.61,.74,.82),vec3(1.45,1.12,.68),oxidized);
        diffuseColor.rgb*=alloy*milling*(1.-band*.61);
        diffuseColor.rgb+=vec3(.092,.041,.011)*lip*gap;`);
  };
  const bloom=new T.MeshBasicMaterial({color:0xff9a3d,side:T.DoubleSide});
  const currentTime={value:0};
  bloom.onBeforeCompile=shader=>{
    shader.uniforms.chargeTime=currentTime;
    shader.vertexShader='varying vec3 imprint;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>',`#include <begin_vertex>
        imprint=position;
        #ifdef USE_INSTANCING
          imprint=(instanceMatrix*vec4(position,1.)).xyz;
        #endif`);
    shader.fragmentShader='varying vec3 imprint;uniform float chargeTime;\n'+shader.fragmentShader.replace(
      '#include <color_fragment>',`#include <color_fragment>
        float a=atan(imprint.z,imprint.x);
        float trail=pow(.5+.5*cos(a*3.-chargeTime*13.+imprint.y*3.1),6.);
        float repeat=pow(.5+.5*cos(a*7.+chargeTime*9.),3.);
        diffuseColor.rgb*=.83+trail*.93+repeat*.23;`);
  };
  return {bronze,bevel,gilding,back,bloom,envMap,currentTime};
}

function buildTier(group, parts, count, materials) {
  const backing=new T.InstancedMesh(parts.backing,materials.back,count);
  const inlay=new T.InstancedMesh(parts.lines,materials.bloom,count);
  const plates=new T.InstancedMesh(parts.plate,[materials.bronze,materials.bevel],count);
  const meshes=[plates,backing,inlay];
  const trims=parts.trim?new T.InstancedMesh(parts.trim,materials.gilding,count):null;
  if(trims) meshes.push(trims);
  for (const mesh of meshes){
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    mesh.frustumCulled=false;
    group.add(mesh);
  }
  const place=new T.Object3D(),base=new T.Matrix4(),modified=new T.Matrix4();
  const backingOffset=new T.Matrix4().makeTranslation(0,0,-.009);
  const channelOffset=new T.Matrix4().makeTranslation(0,0,parts.depth*.40);
  return {
    update(configure){
      for(let i=0;i<count;i++){
        configure(place,i);
        place.updateMatrix();
        base.copy(place.matrix);
        plates.setMatrixAt(i,base);
        if(trims) trims.setMatrixAt(i,base);
        backing.setMatrixAt(i,modified.multiplyMatrices(base,backingOffset));
        inlay.setMatrixAt(i,modified.multiplyMatrices(base,channelOffset));
      }
      for(const mesh of meshes) mesh.instanceMatrix.needsUpdate=true;
    },
  };
}

function glassCore(group,envMap) {
  const shell=new T.Mesh(new T.OctahedronGeometry(.34,0),
    new T.MeshPhysicalMaterial({color:0xc16825,metalness:.34,roughness:.24,
      envMap,envMapIntensity:1.27,transparent:true,opacity:.66,depthWrite:false,
      emissive:0xaa410c,emissiveIntensity:.29,clearcoat:.86,iridescence:.24,flatShading:true}));
  const heart=new T.Mesh(new T.OctahedronGeometry(.23,0),
    new T.MeshBasicMaterial({color:0xffbe56,toneMapped:false}));
  group.add(heart,shell);
  shell.renderOrder=6;
  return (time,scale,brightness)=>{
    shell.rotation.y=time*1.8;
    shell.rotation.z=.17;
    shell.scale.set(.87*scale,1.78*scale,.88*scale);
    heart.rotation.copy(shell.rotation);
    heart.scale.set(.55*scale,1.34*scale,.55*scale);
    heart.material.color.setRGB(1,.23+brightness*.28,.078+brightness*.105);
    shell.visible=heart.visible=scale>.03;
  };
}

function driftEmbers(group) {
  const count=54;
  const mesh=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({
    transparent:true,blending:T.AdditiveBlending,depthWrite:false,color:0xffffff,
  }),count);
  mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  mesh.renderOrder=7;
  group.add(mesh);
  const mover=new T.Object3D(),color=new T.Color();
  const sequence=i=>T.MathUtils.euclideanModulo(Math.sin(i*89.2+6.1)*15487.22,1);
  const seeds=Array.from({length:count},(_,i)=>[
    sequence(i*5),sequence(i*5+1),sequence(i*5+2),sequence(i*5+3),sequence(i*5+4),
  ]);
  return (time,gain,open)=>{
    mesh.visible=gain>.035;
    if(!mesh.visible) return;
    for(let i=0;i<count;i++){
      const [a,offset,rate,size,spread]=seeds[i];
      const u=T.MathUtils.euclideanModulo(offset+time*(.56+rate*.56),1);
      const turn=a*TAU+u*(.82+rate)+time*.49;
      const r=(1.05+spread*1.17)*(1.-.45*u)+open*.64;
      const y=.11+(u**1.47)*(2.29+size*.76);
      const life=Math.sin(Math.PI*u)*gain;
      mover.position.set(Math.cos(turn)*r,y,Math.sin(turn)*r);
      mover.scale.set(.0065*life,(.011+size*.027)*life,.0065*life);
      mover.rotation.z=.47*Math.sin(turn);
      mover.rotation.x=.22*Math.cos(turn);
      mover.updateMatrix();
      mesh.setMatrixAt(i,mover.matrix);
      mesh.setColorAt(i,color.setRGB(1.82*life,(.33+rate*.44)*life,.051*life));
    }
    mesh.instanceMatrix.needsUpdate=mesh.instanceColor.needsUpdate=true;
  };
}
export function createSealStructure(group, renderer, origin, points) {
  const structure=new T.Group();
  structure.name='镇脉 · 铸金符阵';
  structure.position.copy(origin);
  group.add(structure);
  const materials=makeMaterials(renderer);
  const outerMarks=new T.Group();
  outerMarks.name='镇脉 · 三枚边印';
  outerMarks.position.copy(origin);
  group.add(outerMarks);
  const marker=buildTier(outerMarks,sector(.31,.57,.57,.055,.010),points.length*4,materials);
  const offsets=points.map(({at})=>at.clone().sub(origin));
  const outer=buildTier(structure,sector(2.17,2.71,.241,.106,.018),12,materials);
  const anchors=buildTier(structure,sector(1.87,2.19,.096,.125,.012),4,materials);
  const inner=buildTier(structure,sector(1.21,1.85,.341,.123,.021),8,materials);
  const crown=buildTier(structure,sector(.83,1.49,.340,.116,.019),8,materials);
  const slips=buildTier(structure,uprightStamp(),6,materials);

  const prism=new T.Group();
  structure.add(prism);
  const crystal=glassCore(prism,materials.envMap);
  const embers=driftEmbers(structure);
  const ritualKey=new T.PointLight(gold,0,4.4,2);
  const rimLight=new T.PointLight(0xff8644,0,3.8,2);
  structure.add(ritualKey,rimLight);
  rimLight.position.set(0,.42,0);
  const glow=new T.Mesh(new T.SphereGeometry(1,18,11),new T.ShaderMaterial({
    transparent:true,blending:T.AdditiveBlending,depthWrite:false,
    uniforms:{energy:{value:0}},
    vertexShader:`
      varying vec3 direction,normalW;
      void main(){
        vec4 world=modelMatrix*vec4(position,1.);
        direction=cameraPosition-world.xyz;
        normalW=mat3(modelMatrix)*normal;
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      varying vec3 direction,normalW;
      uniform float energy;
      void main(){
        float facing=abs(dot(normalize(direction),normalize(normalW)));
        float density=pow(facing,3.2)*energy;
        gl_FragColor=vec4(1.,.395,.091,density*.24);
      }`,
  }));
  glow.renderOrder=5.8;
  structure.add(glow);
  const local=new T.Vector3(), plane=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
  const orbit=new T.Quaternion(), tilt=new T.Quaternion();

  const tiltX=new T.Vector3(1,0,0);

  function rotatePanel(panel,index,count,t,level,gain,open,rate){
    const angle=index*TAU/count+t*rate;
    const y=level+.036*Math.sin(index*1.16+t*11.3)+open*.36*Math.sin(index*2.3);
    const alpha=(1.-gain)*.33+open;
    panel.position.set(Math.cos(angle)*alpha,y,Math.sin(angle)*alpha);
    orbit.setFromAxisAngle(up,-angle);
    tilt.setFromAxisAngle(tiltX,(1-gain)*.61 + open*Math.sin(index*1.3));
    panel.quaternion.copy(orbit).multiply(plane).multiply(tilt);
    panel.scale.setScalar(gain);
  }

  return {
    update(t,hit){
      materials.currentTime.value=t;
      const after=t>=0;
      const unfold=ease(t,-.83,-.39);

      const breakApart=after?ease(t,.017,.20):0;
      const open=breakApart*.51;
      const gain=unfold*(after?1.-ease(t,.062,.29):1);
      const bright=unfold*(1.-ease(t,.010,.15));
      const edgeReveal=ease(t,-.78,-.43);
      outerMarks.visible=edgeReveal>.03&&t<.35;
      if(outerMarks.visible){
        marker.update((p,i)=>{
          const node=Math.floor(i/4);
          const phase=t-points[node].delay;
          const kick=hit?ease(phase,0,.16):0;
          const strength=edgeReveal*(1.-ease(phase,.065,.238));
          const turn=(i%4)*TAU/4+node*.37+.20*t;
          const burst=(1-strength)*.16+kick*.38;
          p.position.copy(offsets[node]);
          p.position.x+=Math.cos(turn)*burst;
          p.position.z+=Math.sin(turn)*burst;
          p.position.y=.082+edgeReveal*.082+kick*(.11+.10*Math.sin(i*1.65));
          orbit.setFromAxisAngle(up,-turn);
          tilt.setFromAxisAngle(tiltX,(1-strength)*.49+kick*(i%4)*.28);
          p.quaternion.copy(orbit).multiply(plane).multiply(tilt);
          p.scale.setScalar(strength);
        });
      }
      structure.visible=gain>.018;
      if(!structure.visible) return;
      const y=2.19+.67*unfold-open*.31;
      outer.update((p,i)=>rotatePanel(p,i,12,t,.081+.15*unfold-open*.07,gain,open,-.23));
      anchors.update((p,i)=>rotatePanel(p,i+.5,4,t,.065+.17*unfold-open*.05,gain,open*.79,-.23));
      inner.update((p,i)=>rotatePanel(p,i,8,t,.170+.27*unfold-open*.14,gain,open*.65,.38));
      crown.update((p,i)=>rotatePanel(p,i,8,t,y+.08,gain,open*1.16,-.53));
      slips.update((p,i)=>{
        const angle=i*TAU/6+t*.67+.13;
        const height=1.82+.73*unfold+.19*Math.sin(i*2.09+t*4.81);
        const radius=1.19+.19*(1-unfold)+open;
        local.set(Math.cos(angle)*radius,height-open*Math.sin(i*.93),Math.sin(angle)*radius);
        p.position.copy(local);
        orbit.setFromAxisAngle(up,Math.PI*.5-angle);
        tilt.setFromAxisAngle(tiltX,.39+.28*Math.sin(i*.81)+open);
        p.quaternion.copy(orbit).multiply(tilt);
        p.scale.set(gain*1.17,gain*1.40,gain);
      });
      prism.position.set(0,y+.13,0);
      crystal(t,bright*(1.-ease(t,-.002,.075)),bright);
      embers(t,gain,open);
      glow.position.copy(prism.position);
      glow.scale.set(.73*gain,.67*gain,.73*gain);
      glow.material.uniforms.energy.value=bright;
      ritualKey.position.copy(prism.position);
      ritualKey.intensity=(hit?1:.79)*bright*8.7;
      rimLight.intensity=bright*6.4;
      const sweep=.85+.15*Math.sin(t*16.2);
      materials.bloom.color.setRGB(1.09+bright*1.09*sweep,.19+bright*.41,.028+bright*.073);
    },
  };
}
