import * as T from 'three';
import {disposeEffectNodes} from './effect-resources.js';
import {createSealStructure} from './thunder-seal-structure.js';

const up = new T.Vector3(0,1,0);
const east = new T.Vector3(1,0,0);
const vec = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
const TAU = Math.PI*2;
const fade = T.MathUtils.smoothstep;
const random = index => T.MathUtils.euclideanModulo(Math.sin(index*127.1+12.3)*43758.5453,1);
const warm = new T.Color(1.05,.38,.068);
const cyan = new T.Color(.025,.51,1.55);
const lilac = new T.Color(.38,.071,1.81);
const white = new T.Color(.28,.87,1.77);
const end = `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const noise = `
  float hash(vec3 p){
    p=fract(p*.31831+vec3(.17,.37,.23))*17.;
    return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
  }
  float grain(vec3 p){
    vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }`;
const worldVertex = `
  varying vec3 world;
  void main(){
    vec4 p=modelMatrix*vec4(position,1.);
    world=p.xyz;
    gl_Position=projectionMatrix*viewMatrix*p;
  }`;

function shader(fragmentShader, uniforms, options={}) {
  return new T.ShaderMaterial({vertexShader:worldVertex,fragmentShader,uniforms,
    transparent:true,depthWrite:false,blending:T.AdditiveBlending,...options});
}

// One indexed tube batch per optical layer, shared by the strike, seal and
// floor branches. The path and tube normals live in world space.
function arcBatch(group, capacity) {
  const sides=6, count=capacity*sides*2;
  const geometry=new T.BufferGeometry();
  const positions=new T.BufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage);
  const normals=new T.BufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage);
  const tint=new T.BufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage);
  const strength=new T.BufferAttribute(new Float32Array(count),1).setUsage(T.DynamicDrawUsage);
  geometry.setAttribute('position',positions);
  geometry.setAttribute('normal',normals);
  geometry.setAttribute('tint',tint);
  geometry.setAttribute('strength',strength);
  const indices=new Uint16Array(capacity*sides*6);
  for(let i=0;i<capacity;i++) for(let j=0;j<sides;j++){
    const a=i*sides*2+j,b=i*sides*2+(j+1)%sides,k=(i*sides+j)*6;
    indices.set([a,b,a+sides,b,b+sides,a+sides],k);
  }
  geometry.setIndex(new T.BufferAttribute(indices,1));
  const rayMaterial=shader(`
    varying vec3 world, normalW, hue;
    varying float power;
    uniform float skirt;
    void main(){
      float front=abs(dot(normalize(cameraPosition-world),normalize(normalW)));
      vec3 color=mix(hue,vec3(.66,1.10,2.28),.064*(1.-skirt));
      float opacity=power*mix(.40+.60*front,pow(front,2.6)*.255,skirt);
      gl_FragColor=vec4(color,opacity);
    `+end,{skirt:{value:0},spread:{value:0}},{
      side:T.DoubleSide,forceSinglePass:true,
      vertexShader:`
        attribute vec3 tint;
        attribute float strength;
        uniform float spread;
        varying vec3 world, normalW, hue;
        varying float power;
        void main(){
          vec4 p=modelMatrix*vec4(position+normal*spread,1.);
          world=p.xyz; normalW=normal; hue=tint; power=strength;
          gl_Position=projectionMatrix*viewMatrix*p;
        }`,
    });
  const core=new T.Mesh(geometry,rayMaterial);
  const glow=new T.Mesh(geometry,rayMaterial.clone());
  glow.material.uniforms.skirt.value=1;
  glow.material.uniforms.spread.value=.038;
  glow.renderOrder=8;
  core.renderOrder=9;
  glow.frustumCulled=core.frustumCulled=false;
  group.add(glow,core);
  const axis=vec(), right=vec(), vertical=vec(), radial=vec();
  let cursor=0;
  return {
    reset(){cursor=0;},
    line(a,b,r0,r1,hue,gain){
      if(gain<=.005||cursor>=capacity) return;
      axis.copy(b).sub(a);
      if(axis.lengthSq()<.000001) return;
      axis.normalize();
      right.crossVectors(Math.abs(axis.y)>.92?east:up,axis).normalize();
      vertical.crossVectors(axis,right);
      for(let i=0;i<sides;i++){
        const angle=i*TAU/sides;
        radial.copy(right).multiplyScalar(Math.cos(angle)).addScaledVector(vertical,Math.sin(angle));
        const j=cursor*sides*2+i;
        positions.setXYZ(j,a.x+radial.x*r0,a.y+radial.y*r0,a.z+radial.z*r0);
        positions.setXYZ(j+sides,b.x+radial.x*r1,b.y+radial.y*r1,b.z+radial.z*r1);
        normals.setXYZ(j,radial.x,radial.y,radial.z);
        normals.setXYZ(j+sides,radial.x,radial.y,radial.z);
        tint.setXYZ(j,hue.r,hue.g,hue.b);
        tint.setXYZ(j+sides,hue.r,hue.g,hue.b);
        strength.setX(j,gain);
        strength.setX(j+sides,gain*.97);
      }
      cursor++;
    },
    commit(){
      core.visible=glow.visible=cursor>0;
      if(!cursor) return;
      geometry.setDrawRange(0,cursor*sides*6);
      for(const attribute of [positions,normals,tint,strength]){
        attribute.clearUpdateRanges();
        attribute.addUpdateRange(0,cursor*sides*2*attribute.itemSize);
        attribute.needsUpdate=true;
      }
    },
  };
}

function deckDischarge(group, at, {extent=7.3,scale=1,sealRadii=new T.Vector2(1.18,.72),hue=new T.Color(.31,1.06,2.06)}={}) {
  const phase={value:0}, power={value:0}, charge={value:0};
  const plane=new T.Mesh(new T.PlaneGeometry(extent,extent),shader(`
    varying vec3 world;
    uniform vec3 strike,hue; uniform vec2 sealRadii; uniform float phase,power,charge,scale;
  `+noise+`
    void main(){
      vec2 q=world.xz-strike.xz;
      float r=length(q)*scale;
      float f=fract(world.z+9.10);
      float joint=min(f,1.-f);
      float columns=fract((world.x+1.12+mod(floor(world.z+9.10),2.)*.6)/1.2);
      joint=min(joint,min(columns,1.-columns)*1.2);
      float moisture=smoothstep(.38,.71,grain(vec3(world.xz*vec2(8.8,16.),.4)));
      float roughness=.42+.58*grain(vec3(world.xz*vec2(14.,48.),.7));
      float broken=pow(.5+.5*cos(atan(q.y,q.x)*9.+phase*2.+r*2.),2.);
      float crest=exp(-13.*abs(r-(.11+phase*4.1)))*(.28+.72*broken);
      float body=exp(-r*r*1.46);
      float channels=exp(-joint*25.)*(body*.25+crest*.66);
      float edge=(1.-smoothstep(2.62,3.58,r))*step(-1.12,world.x)*(1.-step(5.70,world.x));
      float alpha=(body*(.07+moisture*.71)+channels*roughness+crest*moisture*.36)*power*edge;
      float a=atan(q.y,q.x);
      float glint=exp(-abs(r-sealRadii.x)*9.4)*pow(.5+.5*cos(a*12.+phase*3.6),3.)
        +exp(-abs(r-sealRadii.y)*7.5)*pow(.5+.5*cos(a*8.-phase*4.4),3.5)*.78;
      float gold=charge*edge*(glint*(.18+moisture*.48)+body*.11*moisture);
      vec3 warm=vec3(1.08,.34,.074), cold=mix(vec3(.22,.10,1.3),hue,body);
      gl_FragColor=vec4(mix(cold,warm,gold/max(.0001,alpha+gold)),alpha+gold);
    `+end,{phase,power,charge,sealRadii:{value:sealRadii},scale:{value:scale},hue:{value:hue},strike:{value:at}}));
  plane.rotation.x=-Math.PI/2;
  plane.position.set(at.x,.006,at.z);
  plane.renderOrder=4;
  group.add(plane);
  return (t,gain,priming)=>{
    plane.visible=gain+priming>.008;
    phase.value=t;
    power.value=gain;
    charge.value=priming;
  };
}

function ionMist(group) {
  const at={value:vec()}, radii={value:vec()}, phase={value:0}, power={value:0};
  const cloud=new T.Mesh(new T.SphereGeometry(1,18,12),shader(`
    varying vec3 world;
    uniform vec3 at,radii;
    uniform float phase,power;
  `+noise+`
    void main(){
      vec3 camera=(cameraPosition-at)/radii;
      vec3 ray=normalize((world-cameraPosition)/radii);
      float b=dot(camera,ray);
      float h=sqrt(max(0.,b*b-dot(camera,camera)+1.));
      float start=max(0.,-b-h), span=max(0.,-b+h-start);
      float amount=0., inner=0.;
      for(int i=0;i<10;i++){
        vec3 s=camera+ray*(start+span*(float(i)+.5)/10.);
        vec3 q=s*4.1+vec3(.34,1.1-phase*2.1,.21+phase*.19);
        float mass=(1.-smoothstep(.12,1.,dot(s,s)))
          *smoothstep(.30,.82,grain(q)*.70+grain(q*2.24)*.30);
        amount+=mass;
        inner+=mass*exp(-3.05*length(s+vec3(.09,.24,0.)));
      }
      vec3 color=mix(vec3(.18,.19,.30),vec3(.46,.91,1.47),clamp(inner*power,.0,1.));
      gl_FragColor=vec4(color,clamp(amount*.16*span*power,.0,.66));
    `+end,{at,radii,phase,power},{side:T.FrontSide,blending:T.NormalBlending}));
  cloud.renderOrder=6;
  group.add(cloud);
  return (point,t,gain)=> {
    cloud.visible=gain>.006;
    if(!cloud.visible) return;
    cloud.position.copy(point);
    cloud.position.y=.38+Math.max(t,0)*.99;
    cloud.scale.set(.68+t*1.26,.49+t*.89,.58+t*.92);
    at.value.copy(cloud.position);
    radii.value.copy(cloud.scale);
    phase.value=t;
    power.value=gain;
  };
}

function ionColumn(group, strike, spine, {height=4.78,width=1,hue=new T.Color(.041,.63,1.7),samples=13}={}) {
  const power={value:0},phase={value:0},high={value:height+.03};
  const center=new T.Vector3(strike.x+.12,height*.50,strike.z-.09);
  const shape=new T.Vector3(1.14*width,height*.56,1.07*width);
  const mesh=new T.Mesh(new T.SphereGeometry(1,24,16),shader(`
    varying vec3 world;
    uniform vec3 at,shape;
    uniform float power,phase,high,height,width; uniform vec3 hue;
    uniform vec3 spine[`+spine.length+`];
  `+noise+`
    void main(){
      vec3 eye=(cameraPosition-at)/shape;
      vec3 ray=normalize((world-cameraPosition)/shape);
      float b=dot(eye,ray);
      float root=sqrt(max(0.,b*b-dot(eye,eye)+1.));
      float start=max(0.,-b-root), span=max(0.,-b+root-start);
      vec3 radiance=vec3(0.);
      float weight=0., transmittance=1.;
      for(int i=0;i<`+samples+`;i++){
        vec3 samplePoint=at+(eye+ray*(start+span*(float(i)+.5)/float(`+samples+`)))*shape;
        float u=clamp((samplePoint.y-.03)/height,0.,.998)*float(`+(spine.length-1)+`);
        int j=int(floor(u));
        vec3 core=mix(spine[j],spine[j+1],fract(u));
        float envelope=smoothstep(.05,.34,samplePoint.y)*(1.-smoothstep(height-.30,height+.25,samplePoint.y))
          * smoothstep(high-.12,high+.13,samplePoint.y);
        vec2 offset=(samplePoint.xz-core.xz)/width;
        float r=length(offset);
        float theta=atan(offset.y,offset.x);
        vec3 q=samplePoint*vec3(6.1,11.,6.1)+vec3(phase*4.,-phase*29.,.71);
        float ridges=grain(q)*.70+grain(q*2.27)*.30;
        float vortex=pow(.5+.5*cos(theta*3.+samplePoint.y*16.-phase*21.),3.6);
        float grainMask=smoothstep(.25,.79,ridges);
        float halo=exp(-r*r*8.0)*grainMask*(.25+.75*vortex);
        float mid=exp(-r*r*31.)*(.37+.63*grainMask);
        float hot=exp(-r*r*124.)*(.41+.59*ridges);
        float density=(.22*halo+.26*mid+.24*hot)*envelope;
        vec3 tint=mix(vec3(.24,.039,1.56),hue,smoothstep(.04,.73,ridges));
        radiance+=(tint*(halo*.49+mid*.46)+vec3(.22,.62,1.43)*hot*.51)*envelope*transmittance;
        weight+=density*transmittance;
        transmittance*=1.-density*.51;
      }
      float ang=clamp(weight*span*power*.61,0.,.62);
      gl_FragColor=vec4(radiance/(.30+weight),ang);
    `+end,{power,phase,high,height:{value:height},width:{value:width},hue:{value:hue},at:{value:center},shape:{value:shape},spine:{value:spine}}));
  mesh.position.copy(center);
  mesh.scale.copy(shape);
  mesh.renderOrder=6;
  group.add(mesh);
  return (t,gain,leader)=>{
    mesh.visible=gain>.008;
    phase.value=t;
    power.value=gain;
    high.value=leader;
  };
}
function scatter(group, strike, {count=72,surfaceOnly=false,hue=cyan,seed=0}={}) {
  const geometry=new T.IcosahedronGeometry(1,0);
  const ejecta=new T.InstancedMesh(geometry,new T.MeshBasicMaterial({
    transparent:true,blending:T.AdditiveBlending,depthWrite:false,
  }),count);
  ejecta.instanceMatrix.setUsage(T.DynamicDrawUsage);
  ejecta.frustumCulled=false;
  ejecta.renderOrder=10;
  group.add(ejecta);
  const chip=new T.Object3D(), speed=vec(), axis=vec(), tint=new T.Color();
  const seeds=Array.from({length:count},(_,index)=>{
    const i=index+seed;
    const angle=TAU*random(i*7+1);
    return {
      dx:Math.cos(angle),dz:Math.sin(angle),
      pace:random(i*7+2),rise:random(i*7+3),delay:random(i*7+4)*.088,
      age:.27+random(i*7+5)*.39,size:.007+random(i*7+6)*.008,
      floor:surfaceOnly||i%3===0,
    };
  });
  return t=>{
    ejecta.visible=t>=0&&t<.74;
    if(!ejecta.visible) return;
    for(let i=0;i<count;i++){
      const p=seeds[i],local=Math.max(0,t-p.delay);
      const gain=t>=p.delay?1.-fade(local,p.age*.23,p.age):0;
      const strength=.92+p.pace*4.7;
      speed.set(p.dx*strength,.47+p.rise*(p.floor?1.74:3.78),p.dz*strength);
      chip.position.copy(strike).addScaledVector(speed,local);
      chip.position.y=Math.max(.025,(p.floor?.076:.69)-3.4*local*local+speed.y*local);
      axis.copy(speed).addScaledVector(up,-6.8*local).normalize();
      chip.quaternion.setFromUnitVectors(up,axis);
      const width=p.size*gain;
      chip.scale.set(width,(.025+p.pace*.16)*gain,width);
      chip.updateMatrix();
      ejecta.setMatrixAt(i,chip.matrix);
      ejecta.setColorAt(i,tint.copy(!surfaceOnly&&p.floor?lilac:hue).multiplyScalar(gain*(1.3+p.rise*.7)));
    }
    ejecta.instanceMatrix.needsUpdate=ejecta.instanceColor.needsUpdate=true;
  };
}

const strikeNodes=[
  {across:-1.55,along:.90,delay:-.146},
  {across:1.86,along:-.66,delay:-.076},
  {across:.35,along:2.34,delay:.079},
];

export function thunderStrikePoints(ground,forward,side){
  return [{at:ground,delay:0},...strikeNodes.map(({across,along,delay})=>({
    at:ground.clone().addScaledVector(side,across).addScaledVector(forward,along),delay,
  }))];
}

export function createThunderSeal(scene, renderer, target, forward, side) {
  const group=new T.Group();
  group.name='引雷 · 镇脉';
  scene.add(group);
  const ground=target.clone().setY(.031);
  const contact=target.clone().addScaledVector(forward,-.20).setY(1.60);
  const a=vec(),b=vec(),last=vec(),from=vec(),tip=vec();
  const batch=arcBatch(group,1440);
  const num=42;
  const trunk=Array.from({length:num+1},()=>vec());
  const points=[
    {...strikeNodes[0],height:4.48,width:.74,slant:-.45,hue:new T.Color(.047,.81,1.66),lamp:0x5acaff},
    {...strikeNodes[1],height:4.83,width:.79,slant:.51,hue:new T.Color(.40,.18,1.58),lamp:0x9d78ff},
    {...strikeNodes[2],height:4.10,width:.60,slant:.08,hue:new T.Color(.36,.47,1.51),lamp:0x848cff},
  ].map((node,i)=>({
    ...node,index:i,at:ground.clone().addScaledVector(side,node.across).addScaledVector(forward,node.along),
  }));
  const structure=createSealStructure(group,renderer,ground,points);
  const perimeter=points.map(makePeripheral);
  const connections=points.map(({at,index})=>{
    const curve=[];
    for(let i=0;i<=8;i++){
      const u=i/8;
      const b=ground.clone().lerp(at,u);
      const bend=Math.sin(Math.PI*u)*.24;
      b.addScaledVector(index===1?forward:side,(i%2===0?bend:-bend));
      b.y=.045;
      curve.push(b);
    }
    return curve;
  });
  const drawDeck=deckDischarge(group,ground,{sealRadii:new T.Vector2(2.46,1.54)});
  const drawMist=ionMist(group);
  const drawColumn=ionColumn(group,ground,trunk);
  const drawEjecta=scatter(group,ground);
  const strikeLight=new T.PointLight(0x8abaff,0,7.4,2);
  const spill=new T.PointLight(0xa47dff,0,4.8,2);
  const handLight=new T.PointLight(0xffab54,0,1.7,2);
  const upperLight=new T.PointLight(0x835eff,0,6.0,2);
  upperLight.position.copy(ground);upperLight.position.y=3.76;
  strikeLight.position.copy(ground).addScaledVector(forward,-.28); strikeLight.position.y=2.48;
  spill.position.copy(ground).addScaledVector(side,.57);spill.position.y=.32;
  group.add(strikeLight,spill,handLight,upperLight);


  function line(from,to,r,hue,gain,seed,t,segments){
    last.copy(from);
    const width=Math.min(.30,from.distanceTo(to)*.17);
    for(let i=1;i<=segments;i++){
      const u=i/segments;
      const pinch=i===segments?0:Math.sin(Math.PI*u)*width;
      const j=(random(seed+i*7)-.5)*2.0;
      b.lerpVectors(from,to,u);
      b.x+=(j+Math.sin(t*38.+i)*.16)*pinch;
      b.z+=(random(seed+2+i*7)-.5)*1.74*pinch;
      b.y+=(random(seed+3+i*7)-.5)*.60*pinch;
      const diameter=r*(1.-.73*u);
      batch.line(last,b,diameter*1.08,diameter,hue,gain*(1.-.42*u));
      last.copy(b);
    }
  }

  function makePeripheral(node){
    const {at,delay,height,width,hue,slant,lamp,index}=node;
    const segments=26;
    const spine=Array.from({length:segments+1},()=>vec());
    const deck=deckDischarge(group,at,{extent:4.15,scale:1.58,hue});
    const vapor=ionMist(group);
    const glow=ionColumn(group,at,spine,{height,width,hue,samples:8});
    const eject=scatter(group,at,{count:26,surfaceOnly:true,hue,seed:15+index*28});
    const light=new T.PointLight(lamp,0,3.4,2);
    light.position.copy(at).addScaledVector(side,index===0?-.10:.10);
    light.position.y=.83;
    group.add(light);
    const strandPoint=vec(),trail=vec(),endpoint=vec(),joint=vec();
    const arcSeed=71+index*43;
    const firstFork=index===2?7:5;
    const wetBranches=Array.from({length:7},(_,i)=>{
      const angle=i*TAU/7+index*1.25;
      return {
        angle,radius:.49+random(arcSeed+i*9)*.87,
        hue:i%3? hue : cyan,
        drift:(random(arcSeed+i*7+2)-.5)*.37,
      };
    });
    function shaft(local,strength){
      const active=Math.max(0,segments-Math.ceil(segments*fade(local,0,.039)));
      for(let j=0;j<=segments;j++){
        const u=j/segments;
        const flicker=.036*Math.sin(j*1.33+local*65.+index);
        const shear=Math.sin(u*Math.PI*.89);
        const drift=slant*u+.22*Math.sin(u*9.6+index)*shear;
        spine[j].copy(at).addScaledVector(side,drift+(random(arcSeed+j*5)-.5)*shear*.48+flicker*shear)
          .addScaledVector(forward,(random(arcSeed+j*7)-.5)*shear*.57+.25*u*index);
        spine[j].y=at.y+height*u;
        if(j<=active) continue;
        const gauge=(.009+.014*random(arcSeed+j*13))*width;
        const pulse=.68+.32*Math.sin(local*29+j*.71+index)**2;
        batch.line(spine[j-1],spine[j],gauge*.81,gauge,hue,strength*pulse);
      }
      for(let k=0;k<2;k++){
        trail.copy(spine[0]);
        for(let j=1;j<=segments;j++){
          const u=j/segments;
          const twist=k*2.5+u*(13.0+k*5)+local*22.+index;
          const flare=(.13+.25*random(arcSeed+j*19+k))*fade(u,0,.23);
          strandPoint.copy(spine[j]).addScaledVector(side,flare*Math.cos(twist))
            .addScaledVector(forward,flare*Math.sin(twist));
          strandPoint.y+=Math.sin(j*2.17+k)*.08;
          if(j>active){
            const sputter=.26+.74*Math.sin(j*.73+k+local*14.)**2;
            batch.line(trail,strandPoint,.006,.004,k===0?hue:lilac,strength*sputter*.65);
          }
          trail.copy(strandPoint);
        }
      }
      for(let j=firstFork;j<=segments-2;j+=5){
        if(j<active) continue;
        const angle=j*2.39+index;
        const length=.31+random(j*5+arcSeed)*.74;
        const root=spine[j];
        endpoint.copy(root).addScaledVector(side,Math.cos(angle)*length)
          .addScaledVector(forward,Math.sin(angle)*length);
        endpoint.y-=.12+random(j*5+arcSeed+1)*.51;
        line(root,endpoint,.009,hue,strength*.51,arcSeed+j*17,local,5);
        joint.lerpVectors(root,endpoint,.62);
        endpoint.addScaledVector(forward,.24*Math.sin(angle+1.09));
        endpoint.y-=.22;
        line(joint,endpoint,.005,lilac,strength*.30,arcSeed+j*13,local,3);
      }
      return spine[active].y;
    }
    function groundForks(local,strength){
      for(const [i,branch] of wetBranches.entries()){
        const travel=fade(local,.024+i*.002,.20+i*.014);
        const radius=branch.radius*Math.max(.02,travel);
        joint.set(at.x+Math.cos(branch.angle)*radius*.47,.043,at.z+Math.sin(branch.angle)*radius*.47);
        endpoint.set(at.x+Math.cos(branch.angle+branch.drift)*radius,.036,
          at.z+Math.sin(branch.angle+branch.drift)*radius);
        line(at,joint,.011,branch.hue,strength*.52*(1.-travel*.73),arcSeed+i*11,0,3);
        line(joint,endpoint,.009,branch.hue,strength*.85,arcSeed+i*21,local,4);
      }
    }
    return (t,hit,priming)=>{
      const local=t-delay;
      const started=hit&&local>=0;
      const strike=started?(1.-fade(local,.157,.426))*(.88+.12*Math.cos(local*32.+index)):0;
      const spreading=started?fade(local,.023,.091)*(1.-fade(local,.24,.63)):0;
      const leader=strike>.009?shaft(local,strike):height+.04;
      if(spreading>.015) groundForks(local,spreading);
      glow(local,strike*.99*fade(local,0,.023),leader);
      deck(Math.max(0,local),spreading*.88,local<0?priming*.42:0);
      vapor(at,local,started?fade(local,.030,.137)*(1.-fade(local,.38,.83))*.49:0);
      eject(started?local:-1);
      light.intensity=(spreading*4.8+strike*8.3)*fade(local,.019,.045);
    };
  }
  function linkSeals(t,charge,hit){
    for(const [i,route] of connections.entries()){
      const point=points[i];
      const after=hit&&t>=.055&&t<.55;
      const lead=t<point.delay?charge*fade(t,-.55,-.28):0;
      const spread=after?fade(t,.055,.14)*(1.-fade(t,.24,.55)):0;
      if(lead+spread<.01) continue;
      const travel=after?(t-.030)*39.0:(t+.57)*20.5;
      for(let j=1;j<route.length;j++){
        const wave=(1.-fade(j,travel,travel+1.4))*fade(j,travel-7.7,travel-3.4);
        const stable=lead*.33*(1.-fade(j,travel,travel+1.4));
        const exposure=wave*(lead*.60+spread*.87)+stable;
        line(route[j-1],route[j],after?.010:.005,after?point.hue:warm,exposure,541+i*49+j,t,3);
      }
    }
  }
  function drawRisingCurrent(origin,t,charge,form){
    const lift=fade(t,-.64,-.24);
    for(let coil=0;coil<4;coil++){
      const theta=coil*TAU/4+t*.54;
      const motion=.5+.5*Math.sin(t*12.-coil*.91);
      let reading=false;
      for(let i=0;i<=14;i++){
        const u=i/14;
        const r=(2.03-.88*u+.062*Math.sin(i*.73+coil))*form;
        const angle=theta+.28*u+.063*Math.sin(u*12.7+t*7.6);
        b.set(origin.x+Math.cos(angle)*r,origin.y+.35+2.51*u*form,origin.z+Math.sin(angle)*r);
        if(reading){
          const fadeEnds=Math.sin(Math.PI*(i-.5)/14.);
          const current=(.52+motion*.48)*fadeEnds*charge*lift;
          batch.line(last,b,.0047,.0036,warm,current*1.12);
        }
        reading=true;
        last.copy(b);
      }
    }
  }
  function drawSeal(origin,t,charge,after){
    const lift=.13+.04*Math.sin(t*9.);
    const form=fade(t,-.82,-.39);
    for(let l=0;l<3;l++){
      for(let n=0;n<6;n++){
        const angle=n*TAU/6+(l%2?.49:.13)+t*(l%2?-.54:.62);
        const span=l===1?.36:.59;
        const radius=l===0?1.16:l===1?1.99:2.80;
        const r=after?(l===0?.64:l===1?.89:1.16):radius*form;
        const detail=l===2?2:5;
        for(let j=0;j<detail;j++){
          const start=angle+j*span/detail,end=angle+(j+.88)*span/detail;
          const y=origin.y+(after?lift+(2-l)*.057:(l===0?.50:l===1?.34:.113)*form);
          const c=j===0||j===detail-1?r*.93:r;
          a.set(origin.x+Math.cos(start)*c,y,origin.z+Math.sin(start)*c);
          b.set(origin.x+Math.cos(end)*r,y,origin.z+Math.sin(end)*r);
          const current=.46+.54*Math.sin(n*.91-l*.44+t*9.1)**2;
          batch.line(a,b,l===1?.009:.006,l===1?.008:.005,after?lilac:warm,charge*(1.-l*.15)*current);
        }
      }
    }
    if(!after){
      drawRisingCurrent(origin,t,charge,form);
      for(let n=0;n<12;n++){
        const angle=n*TAU/12+.13;
        const reveal=charge*(.48+.52*fade(t,-.41,-.20));
        for(let j=0;j<4;j++){
          const h=angle+j*.088;
          a.set(origin.x+Math.cos(h)*2.90,.038,origin.z+Math.sin(h)*2.90);
          b.set(origin.x+Math.cos(h+.081)*2.90,.038,origin.z+Math.sin(h+.081)*2.90);
          batch.line(a,b,.004,.004,warm,reveal*.69);
        }
      }
    }
    for(let n=0;n<4;n++){
      const angle=n*TAU/4+t*.48;
      const x=origin.x+.80*Math.cos(angle),z=origin.z+.80*Math.sin(angle);
      const y=origin.y+lift+.03;
      a.set(x,y,z);b.set(x,y+.16,z);
      batch.line(a,b,.011,.004,after?cyan:warm,charge*.9);
    }
  }

  function drawBolt(t,power){
    const headHeight=4.78;
    const contactIndex=Math.round(num*(contact.y-ground.y)/headHeight);
    const descending=Math.max(0,num-Math.ceil(num*fade(t,0,.055)));
    for(let i=0;i<=num;i++){
      const u=i/num;
      const width=.12+Math.sin(u*Math.PI)*.44;
      const sway=Math.sin(u*8.2+.4)*.29+Math.sin(u*19.)*.088;
      const shift=Math.sin(u*Math.PI)*.31;
      const x=ground.x+shift+sway+(random(i*11+5)-.5)*width;
      const z=ground.z-.35*u+(random(i*11+7)-.5)*width*.84;
      const y=ground.y+headHeight*u;
      const pulse=Math.sin(t*89.+i*1.71)*.023;
      if(i<=contactIndex){
        const ratio=i/contactIndex;
        const bite=Math.sin(ratio*Math.PI);
        trunk[i].lerpVectors(ground,contact,ratio);
        trunk[i].addScaledVector(side,(random(i*13+17)-.39)*.34*bite)
          .addScaledVector(forward,(-.10+random(i*3+12)*.18)*bite);
      } else {
        const flank=fade(i,contactIndex,contactIndex+5);
        trunk[i].set(T.MathUtils.lerp(contact.x,x+pulse,flank),y,
          T.MathUtils.lerp(contact.z,z+pulse*.60,flank));
      }
      if(i>descending){
        const r=.011+.020*random(i*9)+(u<.32?.006:0);
        const powerShift=.61+.39*Math.sin(t*35.-i*.42)**2;
        batch.line(trunk[i-1],trunk[i],r,r*.95,white,power*powerShift);
      }
    }
    // A thin inner fork and a wider, intermittent sheath wrap the same
    // discharge at different radii, with the floor end compressed.
    for(let strand=0;strand<6;strand++){
      last.copy(trunk[0]);
      for(let i=1;i<=num;i++){
        const u=i/num;
        const angle=u*(strand%2?14.:20.)+strand*1.75+t*(strand%2?-11.:14.);
        const snarl=(.71+.29*Math.sin(i*3.7+strand))*(.16+.38*Math.sin(Math.PI*u*.82));
        const radius=snarl*(strand<2?.31:strand%2?1.16:.74)*fade(u,0.,.16);
        b.copy(trunk[i]).addScaledVector(side,Math.cos(angle)*radius)
          .addScaledVector(forward,Math.sin(angle)*radius);
        b.y+=(random(i*13+strand*17)-.5)*.18;
        const sputter=.13+.87*fade((.5+.5*Math.sin(i*1.17+strand*1.49+t*21.)),.24,.81);
        if(i>descending) batch.line(last,b,.006+(.007*random(i*11+strand)),.005,
          strand%2?lilac:cyan,power*sputter*(strand<2?.82:strand%2?.54:.54));
        last.copy(b);
      }
    }
    for(let i=0;i<10;i++){
      const index=3+i*4;
      if(index<descending) continue;
      const root=trunk[index];
      const angle=i*2.39996;
      const size=.56+1.04*random(i*3+1);
      tip.copy(root).addScaledVector(side,Math.cos(angle)*size).addScaledVector(forward,Math.sin(angle)*size);
      tip.y+=.16+(random(i*3+2)-.27)*.76;
      const gain=power*(.45+.25*random(i*3+3))*(1.-fade(t,.07+i*.004,.21+i*.004));
      line(root,tip,.016+i%3*.002,i%3?lilac:cyan,gain,53+i*13,t,5);
      from.lerpVectors(root,tip,.50);
      tip.addScaledVector(side,Math.cos(angle+.49)*.49);
      tip.y-=.27;
      line(from,tip,.009,lilac,gain*.60,199+i*5,t,4);
    }
    return trunk[descending].y;
  }

  // Paths run out from the strike and turn on the paving seams. Only the
  // leading segments rise off the deck, cascading back as the pulse dies.
  const lanes=Array.from({length:9},(_,i)=>{
    const angle=(i/9)*TAU+.17+random(i*4+37)*.29;
    const dx=Math.cos(angle),dz=Math.sin(angle);
    const points=[ground.clone()];
    for(let j=1;j<=9;j++){
      const r=.31*j;
      const baseX=ground.x+dx*r,baseZ=ground.z+dz*r;
      const row=Math.floor(baseZ+9.1);
      const lineX=-1.12-(row%2)*.60+Math.round((baseX+1.12+(row%2)*.60)/1.2)*1.2;
      const lineZ=Math.round(baseZ+9.1)-9.1;
      const lock=.78*fade(j,1,6);
      const x=j%3===1?T.MathUtils.lerp(baseX,lineX,lock):baseX;
      const z=j%3===2?T.MathUtils.lerp(baseZ,lineZ,lock):baseZ;
      points.push(vec(x,.027,z));
    }
    return points;
  });

  function crawl(t,charge){
    for(let i=0;i<lanes.length;i++){
      const lane=lanes[i];
      const wave=Math.max(0,(t-.012)*32.0-i%3*.33);
      for(let j=1;j<lane.length;j++){
        const head=1.-fade(j,wave,wave+.90);
        const tail=fade(j,wave-8.1,wave-4.3);
        const strength=charge*head*tail;
        if(strength<.035) continue;
        from.copy(lane[j-1]);tip.copy(lane[j]);
        tip.y+=.09*Math.sin(j*.81+i)*strength+.09*strength;
        line(from,tip,.022-j*.0015,i%4===0?cyan:lilac,strength,71+i*9+j*3,t,3);
        if(j===4||j===6){
          tip.addScaledVector(side,i%2?.34:-.34);
          tip.y=.048;
          from.copy(lane[j]);
          line(from,tip,.011,cyan,strength*.49,79+i*8+j,t,2);
        }
      }
    }
  }

  function update(t,palm,hit) {
    batch.reset();
    structure.update(t,hit);
    const buildup=fade(t,-.77,-.39)*(1.-fade(t,-.067,.026));
    if(buildup>.01){
      drawSeal(ground,t,buildup*.46,false);
      a.copy(palm).addScaledVector(side,-.11);
      tip.copy(palm).addScaledVector(side,.11);tip.y+=.15;
      line(a,tip,.012,warm,buildup*.89,137,t,6);
    }
    const lightning=hit&&t>=0&&t<.29?(1.-fade(t,.093,.29))*(.83+.17*Math.cos(t*30.)):0;
    const discharge=hit&&t>=0?(1.-fade(t,.16,.61)):0;
    for(const strike of perimeter) strike(t,hit,buildup);
    linkSeals(t,buildup,hit);
    const leader=lightning>.012?drawBolt(t,lightning):4.81;
    if(discharge>.01){
      drawSeal(ground,t,discharge*.45*(1.-fade(t,.11,.26)),true);
      crawl(t,discharge*.96);
    }
    batch.commit();
    drawDeck(t,discharge*(.53+.47*Math.exp(-t*10.)),buildup*.72);
    drawColumn(t,lightning*1.72*fade(t,0,.017),leader);
    drawMist(ground,t,hit&&t>=0?fade(t,.016,.137)*(1.-fade(t,.40,1.08))*.80:0);
    drawEjecta(hit?t:-1);
    strikeLight.intensity=lightning*29*fade(t,.008,.043);
    upperLight.intensity=lightning*34;
    spill.intensity=discharge*(6.5+7.6*Math.exp(-Math.max(t,0)*12.));
    handLight.position.copy(palm);
    handLight.intensity=buildup*1.9;
  }
  update.dispose=()=>disposeEffectNodes([group]);
  return update;
}
