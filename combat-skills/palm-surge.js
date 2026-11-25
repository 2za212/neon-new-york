import * as T from 'three';
import {createReadableSurge} from './surge.js';
import {createPressureWake} from './pressure-wake.js';
import {disposeEffectNodes} from './effect-resources.js';

export function createPalmSurge(scene,renderer,from,to,direction,side){
  const elevation=to.y;
  from=from.clone();from.y-=elevation;
  to=to.clone().setY(0);
  const heading=Math.atan2(direction.x,direction.z);
  const blur=new T.WebGLRenderTarget(960,540,{type:T.HalfFloatType,depthBuffer:true});
  blur.texture.colorSpace=T.LinearSRGBColorSpace;
  const size=new T.Vector2();
  const phase={value:-1},screen={value:size},backdrop={value:blur.texture};
  const effect=new T.Group();effect.position.y=elevation;scene.add(effect);effect.renderOrder=8;
  const surge=createReadableSurge(effect);
  const pressure=createPressureWake(effect);

  const noise=
  'float hash(vec3 a){a=fract(a*.3183099+vec3(.187,.281,.421)); a*=17.;return fract(a.x*a.y*a.z*(a.x+a.y+a.z));}'+
  'float n3(vec3 p){vec3 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(a),hash(a+vec3(1,0,0)),f.x),mix(hash(a+vec3(0,1,0)),hash(a+vec3(1,1,0)),f.x),f.y),mix(mix(hash(a+vec3(0,0,1)),hash(a+vec3(1,0,1)),f.x),mix(hash(a+vec3(0,1,1)),hash(a+vec3(1,1,1)),f.x),f.y),f.z);}';

  const shellGeom=new T.PlaneGeometry(1,1,112,64);
  const us=shellGeom.getAttribute('uv'),ps=shellGeom.getAttribute('position');
  for(let i=0;i<us.count;i++)ps.setXYZ(i,us.getX(i),us.getY(i),0);
  const shell=new T.Mesh(shellGeom,new T.ShaderMaterial({
    transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:{phase,screen,backdrop},
    vertexShader:
      'uniform float phase;varying vec2 q;varying vec3 local;void main(){q=uv;float a=q.y*6.2831853;float s=q.x;'+
      'float breath=.62+.38*smoothstep(.04,.94,s);float r=(.041+.67*pow(s,1.36))*breath;'+
      'float noiseSin=.94+.065*sin(15.9*s+5.*a-phase*24.)+.045*cos(a*9.-s*23.);'+
      'local=vec3(r*cos(a)*noiseSin,r*.69*sin(a)*noiseSin-.22*s*s,s);gl_Position=projectionMatrix*modelViewMatrix*vec4(local,1.);}',
    fragmentShader:
      'uniform sampler2D backdrop;uniform vec2 screen;uniform float phase;varying vec2 q;varying vec3 local;'+noise+
      'void main(){float s=q.x,a=q.y*6.2831853;float end=clamp(1.+phase*8.,0.,1.22);'+
      'float train=smoothstep(max(-.12,end-1.15),max(.08,end-.88),s)*(1.-smoothstep(end-.11,end+.03,s));'+
      'float life=(1.-smoothstep(.045,.19,phase))*smoothstep(.012,.13,s)*(1.-smoothstep(.87,1.0,s));'+
      'float f=n3(vec3(s*25.,cos(a)*8.,sin(a)*8.+phase*9.));float bits=n3(vec3(s*93.,cos(a)*13.,sin(a)*13.));'+
      'float drift=a*2.8-8.*s+.85*sin(18.*s-2.*a)+.30*f;float filament=pow(max(0.,.5+.5*sin(drift-phase*21.)),20.);'+
      'float lobe=.25+.75*pow(max(0.,cos(a*1.47+.41+s*.68)),2.);'+
      'float str=(.12+.71*lobe)*(.33+.67*f)*train*life;'+
      'vec2 warp=vec2(cos(a*.96)+.4*(f-.5),.68*sin(a)+.45*(bits-.5))*str*.043;'+
      'vec2 uv=gl_FragCoord.xy/screen;vec3 seen=texture2D(backdrop,clamp(uv+warp,vec2(.003),vec2(.997))).rgb;'+
      'float edge=filament*(.37+.63*bits)*train*life;'+
      'vec3 col=seen*.83+vec3(.25,.68,.77)*(1.82*edge+str*.15);'+
      'gl_FragColor=vec4(col,clamp(str*.86+edge*.84,0.,.77));'+
      '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
  }));
  shell.frustumCulled=false;shell.renderOrder=7;effect.add(shell);

  const wetUniform={aim:{value:direction.clone()},start:{value:from.clone()},endPoint:{value:to.clone()},pulse:phase};
  const wet=new T.Mesh(new T.PlaneGeometry(5.8,6.2),new T.ShaderMaterial({
    side:T.DoubleSide,transparent:true,depthWrite:false,uniforms:wetUniform,
    vertexShader:'varying vec3 world;void main(){world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}',
    fragmentShader:'uniform vec3 aim,start,endPoint;uniform float pulse;varying vec3 world;'+noise+
     'void main(){vec3 d=world-start;float a=dot(d,aim),side=dot(d,vec3(-aim.z,0.,aim.x));'+
     'float e=exp(-side*side*3.8);float dry=n3(world*vec3(6.,1.,7.));'+
     'float pulled=exp(-13.*abs(a-(length(endPoint.xz-start.xz)*.75+max(0.,pulse)*1.8)+.65*side*side));'+
     'float fluid=(.25+.75*dry)*e*pulled*exp(-5.*max(0.,pulse))*smoothstep(-.22,-.11,pulse);'+
     'float ring=exp(-13.*abs(length(world.xz-endPoint.xz)-max(0.,pulse)*2.2))*smoothstep(.03,.20,pulse)*exp(-1.9*max(0.,pulse));'+
     'float glint=smoothstep(.53,.78,n3(world*vec3(7.,1.,29.)))*exp(-.45*side*side)*smoothstep(-.1,.4,a)*(1.-smoothstep(2.1,3.7,a));'+
     'vec3 color=mix(vec3(.062,.112,.13),vec3(.24,.47,.52),fluid)+vec3(.38,.20,.09)*min(1.,ring);'+
     'gl_FragColor=vec4(color, .23*glint+.72*fluid+.23*ring);'+
     '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
  }));
  wet.rotation.x=-Math.PI/2;wet.position.copy(to).lerp(from,.10).setY(.014);wet.renderOrder=6;effect.add(wet);

  const sheetGeo=new T.PlaneGeometry(1,1,56,22);
  const sheet=new T.Mesh(sheetGeo,new T.ShaderMaterial({
    transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:{phase,screen,backdrop},
    vertexShader:'uniform float phase;varying vec2 q;void main(){q=uv;float t=max(.0,phase+.095),u=q.x*2.-1.,v=q.y;float sl=sin(u*14.+v*2.-t*11.);'+
    'vec3 p=vec3(u*(.96+2.70*t)*v, .023+sin(3.14*v*.78)*(.22+.64*t)+sl*.048*v, .075+(.37+2.40*t)*v-.30*u*u*v);'+
    'gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
    fragmentShader:'uniform sampler2D backdrop;uniform vec2 screen;uniform float phase;varying vec2 q;'+noise+
    'void main(){float v=q.y,u=q.x*2.-1.;float p=n3(vec3(q*vec2(45.,22.),phase*6.));float ribbons=pow(.5+.5*sin(q.x*131.+p*14.+q.y*6.),8.);'+
    'float tear=(1.-smoothstep(.86+.16*p,.96+.13*p,v))*(1.-smoothstep(.76,.99,abs(u)));'+
    'float life=smoothstep(-.12,-.035,phase)*(1.-smoothstep(.22,.49,phase));'+
    'float alpha=tear*life*(.20+.61*ribbons)*smoothstep(.04,.20,v);'+
    'vec3 sceneRead=texture2D(backdrop,gl_FragCoord.xy/screen+vec2(u*(p-.5),-v)*.011*life).rgb;'+
    'gl_FragColor=vec4(sceneRead*.68+vec3(.34,.58,.60)*(.14+.64*ribbons+.18*p),alpha);'+
    '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
  }));
  sheet.frustumCulled=false;sheet.position.copy(to).addScaledVector(direction,-.46);sheet.position.y=0;sheet.rotation.y=heading;
  sheet.renderOrder=8;effect.add(sheet);

  const seed=i=>{const x=Math.sin((i+1)*73.4781)*43758.5453;return x-Math.floor(x);};
  const waterMat=new T.MeshPhysicalMaterial({color:0xa3ccd3,roughness:.18,metalness:.14,emissive:0x19353b,emissiveIntensity:.63,clearcoat:1,clearcoatRoughness:.16,transparent:true,opacity:.86,depthWrite:false});
  const drops=new T.InstancedMesh(new T.SphereGeometry(1,6,4),waterMat,164);
  const hot=new T.InstancedMesh(new T.SphereGeometry(1,5,3),new T.MeshBasicMaterial({vertexColors:false,transparent:true,depthWrite:false}),23);
  for(const m of [drops,hot]){m.frustumCulled=false;m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.renderOrder=9;effect.add(m);}
  const dummy=new T.Object3D(),up=new T.Vector3(0,1,0),motion=new T.Vector3(),lightColor=new T.Color();
  function spray(t){
   for(let i=0;i<drops.instanceMatrix.count;i++){
     const f=seed(i*7),q=seed(i*7+1),k=seed(i*7+2),a=(seed(i*7+3)-.50)*2.7,j=seed(i*7+5);
     const t0=(f-.75)*.142,p=t-t0;
     const r=.004+.009*(q*q);
     dummy.position.copy(to).addScaledVector(direction,-.45-.53*k).addScaledVector(side,(k-.5)*.81);
     const vy=.38+2.75*j,vx=Math.sin(a)*(1.35+3.65*f),vz=Math.cos(a)*(1.25+3.4*k);
     if(p>=0&&p<.58&&.035+vy*p-4.25*p*p>0){
      dummy.position.addScaledVector(direction,vz*p).addScaledVector(side,vx*p);
      dummy.position.y=.035+vy*p-4.25*p*p;
      motion.copy(direction).multiplyScalar(vz).addScaledVector(side,vx);motion.y=vy-8.50*p;
      dummy.quaternion.setFromUnitVectors(up,motion.normalize());
      dummy.scale.set(r,r*(2.+2.6*f)*(1.-Math.min(.6,p)),r*.8);
     }else dummy.scale.setScalar(0);
     dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);
   }
   drops.instanceMatrix.needsUpdate=true;
   for(let i=0;i<hot.instanceMatrix.count;i++){
     const a=seed(i*9)*6.283,r=seed(i*9+1),v=.4+4.5*seed(i*9+2),t0=.008+seed(i*9+3)*.044,p=t-t0;
     dummy.position.copy(to).addScaledVector(direction,-.22);dummy.position.y=.92+(r-.5)*.46;
     motion.copy(side).multiplyScalar(Math.sin(a)*v).addScaledVector(direction,-(.28+r)*v);motion.y=Math.cos(a)*v*.58+.28;
     if(p>=0&&p<.224){
      dummy.position.addScaledVector(motion,p);dummy.position.y-=3.2*p*p;
      motion.y-=6.4*p;dummy.quaternion.setFromUnitVectors(up,motion.normalize());
      dummy.scale.set(.004+r*.005,(.022+.11*r)*(1.-p/.27),.004+r*.004);
     }else dummy.scale.setScalar(0);
     const f=Math.max(0.,1.-p/.24)*1.66;
     hot.setColorAt(i,lightColor.setRGB(2.0*f,1.02*f,.30*f));
     dummy.updateMatrix();hot.setMatrixAt(i,dummy.matrix);
   }
   hot.instanceMatrix.needsUpdate=true;
   if(hot.instanceColor)hot.instanceColor.needsUpdate=true;
  }

  const impact=new T.PointLight(0xffd29a,0,4.15,2);
  impact.position.copy(to).addScaledVector(direction,-.31).setY(.93);
  effect.add(impact);
  const end=to.clone().addScaledVector(direction,-.22).setY(1.13);
  const delta=new T.Vector3(),axis=new T.Vector3(0,0,1),localPalm=new T.Vector3();
  effect.visible=false;

  function update(since,hand,camera,hit){
    const palm=localPalm.copy(hand);palm.y-=elevation;
    effect.visible=since>-.24&&since<.80;
    if(!effect.visible)return;
    phase.value=since;
    delta.subVectors(end,palm);
    shell.visible=since>-.172&&since<.22;
    shell.position.copy(palm);
    shell.scale.set(1,1,delta.length());
    shell.quaternion.setFromUnitVectors(axis,delta.normalize());
    impact.intensity=hit&&since>=0?7.6*Math.exp(-since*17):0;
    sheet.visible=since>-.11&&since<.54;
    drops.visible=sheet.visible;
    hot.visible=hit&&since>=0&&since<.28;
    surge.update(since,palm,end,camera,hit);
    pressure.update(since,palm,end,from);
    if(drops.visible||hot.visible)spray(since);
  }

  function captureBackdrop(camera){
    if(!effect.visible||(!shell.visible&&!sheet.visible))return;
    renderer.getDrawingBufferSize(size);
    const scale=Math.min(.54,960/size.x);
    const w=Math.max(2,Math.round(size.x*scale)),h=Math.max(2,Math.round(size.y*scale));
    if(blur.width!==w||blur.height!==h)blur.setSize(w,h);
    const activeTarget=renderer.getRenderTarget();
    effect.visible=false;
    renderer.setRenderTarget(blur);
    renderer.render(scene,camera);
    renderer.setRenderTarget(activeTarget);
    effect.visible=true;
  }
  return {update,captureBackdrop,dispose(){
    blur.dispose();
    disposeEffectNodes([effect]);
  }};
}
