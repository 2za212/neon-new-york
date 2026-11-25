import * as T from 'three';
import {up,TAU,ease,mix,vector,rgb,hash,makeShader,makeShards} from './attack-vfx-kit.js';

const zAxis=vector(0,0,1);
const vertex=vector();

export function bevelForm(points,depth,bevel) {
  const face=new T.Shape();
  face.moveTo(...points[0]);
  for(const next of points.slice(1)) face.lineTo(...next);
  face.closePath();
  const geometry=new T.ExtrudeGeometry(face,{depth,bevelEnabled:true,bevelThickness:bevel,
    bevelSize:bevel,bevelSegments:1,steps:1});
  geometry.translate(0,0,-depth*.5);
  return geometry;
}

export function grainMetal(color, metalness, roughness, emissive, offset) {
  const material=new T.MeshStandardMaterial({
    color,metalness,roughness,emissive,emissiveIntensity:.14,
  });
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 casting;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>','#include <begin_vertex>\ncasting=position;');
    shader.fragmentShader='varying vec3 casting;\n'+shader.fragmentShader.replace(
      '#include <color_fragment>',`#include <color_fragment>
        float interrupted=.5+.5*sin(casting.x*41.+casting.y*57.+casting.z*23.);
        float a=casting.y*224.+casting.x*29.+casting.z*13.;
        float bands=.85+.15*sin(a)*(1.-smoothstep(.24,1.23,fwidth(a)));
        float wear=.73+.19*interrupted+.08*cos(casting.x*143.+casting.y*72.);
        diffuseColor.rgb*=bands*wear;
        diffuseColor.rgb+=vec3(`+offset.toArray().join(',')+`)*interrupted*.19;`)
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+.16*(1.-wear),.13,.94);`);
  };
  material.customProgramCacheKey=()=>offset.getHexString();
  return material;
}

function sector(inner,outer,arc) {
  const points=[];
  const thickness=outer-inner;
  const outerLip=outer-thickness*.19;
  for(let i=0;i<=10;i++){
    const angle=mix(-arc,arc,i/10);
    const radius=i===0||i===10?outerLip:outer;
    points.push([Math.cos(angle)*radius,Math.sin(angle)*radius]);
  }
  for(let i=10;i>=0;i--){
    const angle=mix(-arc,arc,i/10);
    points.push([Math.cos(angle)*inner,Math.sin(angle)*inner]);
  }
  return points;
}

export function makeConverger(group){
  const fitting=new T.Group();
  group.add(fitting);
  const copper=grainMetal(0x8e5226,.63,.34,0xd85815,rgb(.23,.08,.031));
  const edge=grainMetal(0xc88143,.80,.27,0xff9a32,rgb(.16,.051,.015));
  const thorn=new T.MeshStandardMaterial({color:0x362b26,metalness:.54,roughness:.46});
  const hot=new T.MeshBasicMaterial({color:0xf2a023});
  const jamb=bevelForm(sector(.77,1.01,.67),.235,.037);
  const strip=bevelForm(sector(.752,.786,.56),.066,.013);
  const rail=bevelForm([[.79,-.032],[.98,-.061],[1.14,-.026],[1.09,.056],[.81,.034]],.198,.021);
  const cages=Array.from({length:3},(_,index)=>{
    const stage=new T.Group(), petals=[];
    for(let i=0;i<3;i++){
      const petal=new T.Group();
      const shell=new T.Mesh(jamb,[copper,edge]);
      const seam=new T.Mesh(strip,hot);
      seam.position.z=.123;
      const brace=new T.Mesh(rail,[thorn,edge]);
      brace.position.z=-.12;
      petal.add(shell,seam,brace);
      stage.add(petal);
      petals.push(petal);
    }
    stage.position.z=.21+index*.37;
    fitting.add(stage);
    return {stage,petals};
  });

  return (point,axis,time,buildup,discharge)=>{
    fitting.visible=buildup>.015;
    if(!fitting.visible)return;
    fitting.position.copy(point);
    fitting.quaternion.setFromUnitVectors(zAxis,axis);
    edge.emissiveIntensity=.17+buildup*.34+discharge*.40;
    hot.color.setRGB(1.18+buildup*.38,.26+buildup*.36,.031+discharge*.14);
    for(const [i,{stage,petals}] of cages.entries()){
      const phase=buildup**(.80+i*.27);
      stage.position.z=.16+i*.371+discharge*(.07+i*.023);
      stage.rotation.z=(i%2?-1:1)*time*(2.06+i*.55)+i*.49;
      const radius=(.28+i*.106)*(.57+phase*.43+discharge*.12);
      stage.scale.set(radius,radius,radius);
      for(const [j,petal] of petals.entries()){
        const angle=j*TAU/3;
        const opening=(1.-phase)*.46+discharge*.19;
        petal.position.set(Math.cos(angle)*opening,Math.sin(angle)*opening,.09*opening);
        petal.rotation.set(opening*.32*Math.sin(angle),opening*.24*Math.cos(angle),angle);
        petal.scale.setScalar(.46+.54*phase);
      }
    }
  };
}

export function makeKnuckleGuard(group) {
  const grip=new T.Group();
  group.add(grip);
  const shell=grainMetal(0x24796a,.52,.30,0x0d8465,rgb(.03,.16,.10));
  const side=grainMetal(0x76bba8,.74,.27,0x27cf9c,rgb(.041,.13,.097));
  const spine=new T.MeshBasicMaterial({color:0xb5f2ac});
  const shapes=[
    bevelForm([[.040,.053],[.058,.144],[.013,.211],[-.080,.190],[-.113,.113],[-.055,.075]],.117,.020),
    bevelForm([[.11,.00],[.178,.044],[.168,.123],[.111,.147],[.075,.097]],.154,.012),
    bevelForm([[-.13,-.026],[-.18,.014],[-.16,.093],[-.11,.10],[-.089,.045]],.145,.014),
  ];
  const jaws=shapes.map((geometry,i)=>{
    const m=new T.Mesh(geometry,[shell,side]);
    m.position.z=.087+i*.014;
    grip.add(m);return m;
  });
  const inlay=new T.Mesh(bevelForm([[-.07,.138],[.038,.145],[.017,.166],[-.061,.165]],.008,.003),spine);
  inlay.position.z=.157;
  grip.add(inlay);
  return (palm,axis,twist,gain)=>{
    grip.visible=gain>.02;
    if(!grip.visible)return;
    grip.position.copy(palm);
    grip.quaternion.setFromUnitVectors(zAxis,axis);
    grip.rotateZ(twist);
    const pulse=.66+gain*.41;
    grip.scale.set(pulse,pulse,pulse);
    jaws[1].position.x=.018*(1.-Math.min(gain,1));
    jaws[2].position.x=-.021*(1.-Math.min(gain,1));
    side.emissiveIntensity=.17+gain*.568;
  };
}

export function makeImpactVanes(group,color) {
  const piece=bevelForm([[-.16,-.6],[-.031,-.26],[.064,.54],[.47,.96],[.60,.52],[.53,-.071],[.25,-.58]],.121,.035);
  const inner=new T.MeshStandardMaterial({color:0x237c64,emissive:0x0ba185,emissiveIntensity:.29,
    metalness:.34,roughness:.29,transparent:true,depthWrite:false,opacity:.66});
  const sheen=new T.MeshStandardMaterial({color,emissive:0x44d7a4,emissiveIntensity:.40,metalness:.43,
    roughness:.22,transparent:true,depthWrite:false,opacity:.82});
  const beams=[];
  for(let i=0;i<6;i++){
    const m=new T.Mesh(piece,[inner,sheen]);
    m.renderOrder=7.2+i*.014;
    group.add(m);beams.push(m);
  }
  const axis=vector();
  return (point,forward,lateral,type,age,energy)=>{
    const elapsed=Math.max(0,age);
    const first=type===0, final=type===2;
    inner.opacity=.52*energy;sheen.opacity=.72*energy;
    for(const [i,m] of beams.entries()){
      const on=energy>.009&&i<(final?5:first?3:3);
      m.visible=on;
      if(!on)continue;
      const layer=i%3, sign=i%2?1:-1;
      const span=(.40+elapsed*(final?1.5:.93))*(1.-layer*.098);
      m.position.copy(point).addScaledVector(forward,.08+layer*.145+elapsed*(final?.74:.37))
        .addScaledVector(lateral,sign*(.08+layer*.063+elapsed*.28));
      m.position.y+=(first?.032:final?.092:-.12)*layer+elapsed*(final?.99:-.07);
      axis.copy(forward).addScaledVector(lateral,(first?.37:final?.15:-.39)*sign)
        .addScaledVector(up,first?.05:final?.43:-.19).normalize();
      m.quaternion.setFromUnitVectors(zAxis,axis);
      m.rotateZ(final?.12+sign*(.16+layer*.25):(first?-1.13:.83)+sign*(.23+layer*.68));
      m.scale.set(span*(final?.81:1.),span*(first?.38:final?1.52:.73),span*(1.15+elapsed*.5));
    }
  };
}

export function directionalChips(group,{count,color,hot,speed,lift,size,life}){
  const chips=makeShards(group,{count,color,hot});
  const across=vector(), velocity=vector();
  return (origin,axis,time,energy=1)=>{
    across.crossVectors(axis,up).normalize();
    chips(time>=0&&time<life+.115&&energy>.009,(m,tint,s,i)=>{
      const delay=s.delay*.095;
      const age=Math.max(0,time-delay);
      const end=life*(.49+s.life*.51);
      const alpha=time>=delay?(1.-ease(age,end*.55,end))*Math.min(energy,1.4):0;
      velocity.copy(axis).multiplyScalar(speed*(.4+s.speed*.61))
        .addScaledVector(across,(s.turn/TAU-.50)*speed*.79).addScaledVector(up,lift*(.16+.84*s.lift));
      m.position.copy(origin).addScaledVector(velocity,age);
      m.position.y=Math.max(.026,m.position.y-age*age*(hot?4.4:5.8));
      const r=size*(.58+s.noise*.91)*alpha;
      m.scale.set(r,r*(hot?3.5+s.length*5.:.87+s.length*1.14),r*(hot?.67:.59));
      if(hot){
        velocity.y-=9.0*age;
        m.quaternion.setFromUnitVectors(up,velocity.normalize());
      } else m.rotation.set(s.turn+age*9.,age*(8+i%6),age*4.7+s.speed);
      tint.multiplyScalar(hot?alpha*(1.22+s.life*.71):.47+.60*s.life);
    });
  };
}

export function makeFracturedDeck(group,center) {
  const slab=bevelForm([[-.52,-.14],[-.28,-.47],[.20,-.42],[.48,-.22],[.39,.23],[.13,.49],[-.34,.36]],.285,.035);
  const surface=grainMetal(0x5d6969,.16,.84,0x9ddd55,rgb(.021,.027,.019));
  const chipped=grainMetal(0x303b3d,.12,.88,0x99d63b,rgb(.012,.021,.014));
  const count=33;
  const mesh=new T.InstancedMesh(slab,[surface,chipped],count);
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  mesh.frustumCulled=false;
  group.add(mesh);
  const block=new T.Object3D(),normal=new T.Quaternion(),joint=new T.Quaternion();
  const color=new T.Color();
  const pieces=Array.from({length:count},(_,i)=>{
    const row=Math.floor(i/11);
    const angle=(i%11)*TAU/11+row*.29+(hash(i*7)-.5)*.16;
    return {radius:.50+row*.69+hash(i*11+1)*.24,angle,width:.41+hash(i*7+2)*.27,
      lift:.34+hash(i*7+3)*.40,spin:hash(i*7+4)-.5,shade:hash(i*7+5),delay:hash(i*7+6)*.06};
  });
  normal.setFromAxisAngle(vector(1,0,0),-Math.PI*.5);
  return (t,hit)=>{
    mesh.visible=hit&&t>=0&&t<1.48;
    if(!mesh.visible)return;
    chipped.emissiveIntensity=.052*(1.-ease(t,.12,.51));
    surface.emissiveIntensity=.020*(1.-ease(t,.18,.61));
    for(const [i,p] of pieces.entries()){
      const passage=t-(p.radius-.43)*.128-p.delay;
      const lift=ease(passage,-.045,.11)*(1.-ease(passage,.23,.87));
      const settle=t>=0?.086*ease(passage,.22,.45)*(1.-ease(passage,.86,1.30)):0;
      const stride=p.radius+.13*lift;
      block.position.set(center.x+Math.cos(p.angle)*stride,
        -.187+p.lift*lift+settle,
        center.z+Math.sin(p.angle)*stride);
      block.quaternion.setFromAxisAngle(up,-p.angle+p.spin*.31);
      block.quaternion.multiply(normal);
      vertex.set(1,0,0);
      joint.setFromAxisAngle(vertex,-(.39+.33*p.shade)*lift+p.spin*.15*settle);
      block.quaternion.multiply(joint);
      block.scale.set(p.width*(.83+i%2*.19),p.width*(.83+p.shade*.31),.63+p.shade*.42);
      block.updateMatrix();
      mesh.setMatrixAt(i,block.matrix);
      mesh.setColorAt(i,color.setRGB(.64+.30*p.shade,.69+.21*p.shade,.69+.22*p.shade));
    }
    mesh.instanceMatrix.needsUpdate=mesh.instanceColor.needsUpdate=true;
  };
}

export function makeHeatScar(group,contact,forward,color) {
  const t={value:0},power={value:0};
  const plane=new T.Mesh(new T.PlaneGeometry(1.9,4.0),makeShader(`
    uniform float t,power;
    uniform vec3 tint;
    void main(){
      vec2 q=st-.5;
      float k=.19+.81*sin(3.14159*st.y);
      float riffle=.63+.37*pow(.5+.5*sin(st.y*218.+t*11.),2.);
      float streak=exp(-abs(q.x)*41.)*riffle;
      float edge=exp(-abs(abs(q.x)-.035-q.y*.014)*72.)*.30;
      float end=smoothstep(0.,.17,st.y)*(1.-smoothstep(.73,1.,st.y));
      gl_FragColor=vec4(tint,(streak+edge)*end*k*power*.66);
  `,{power,t,tint:{value:color}}));
  plane.rotation.x=-Math.PI*.5;
  plane.rotateZ(Math.atan2(forward.x,forward.z)+Math.PI);
  plane.position.copy(contact).setY(.009);
  plane.renderOrder=4.1;
  group.add(plane);
  return (time,strength)=>{
    plane.visible=strength>.008;
    t.value=time;power.value=strength;
  };
}
