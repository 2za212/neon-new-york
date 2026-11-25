import * as T from 'three';

const clamp=T.MathUtils.clamp,lerp=T.MathUtils.lerp;
const zAxis=new T.Vector3(0,0,1);
const shaders={
  vertex: 'uniform float wave,coreRadius,skew;varying vec2 v;void main(){v=uv;float a=-.43+v.x*5.13+skew;float rip=.975+.048*sin(a*4.+wave*2.)+.023*sin(a*9.-wave*2.);float r=coreRadius*rip*(.79+v.y*.42);vec3 p=vec3(r*cos(a),r*.76*sin(a),-.18*sin(a*2.+.6)*r-.17*pow(2.*v.y-1.,2.)*r);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
  fragment: 'uniform float energy,wave,accent;varying vec2 v;void main(){float p=v.x,t=v.y;float n=.5+.5*sin(p*98.+sin(p*31.+wave*6.)*3.0-wave*3.);float bend=.46+.12*sin(p*34.+wave);float rim=exp(-19.*abs(t-bend));float halo=exp(-5.8*abs(t-bend));float curl=exp(-25.*abs(t-bend+.22+.05*n));float tail=smoothstep(.0,.10,p)*(1.-smoothstep(.83,1.,p));float edge=energy*tail*(.62+.38*n);vec3 ink=vec3(.025,.44,.86);vec3 white=vec3(.62,1.75,2.15);vec3 col=ink*(halo*1.05+curl*.43)+white*rim*(.83+.72*accent);float a=edge*(.49*halo+.98*rim+.32*curl);gl_FragColor=vec4(col,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
};

export function createReadableSurge(group){
  const geom=new T.PlaneGeometry(1,1,96,10);
  const axis=new T.Vector3(),handPos=new T.Vector3(),impactPos=new T.Vector3();
  const fronts=Array.from({length:2},(_,index)=>{
    const material=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:{
      energy:{value:0},wave:{value:0},coreRadius:{value:1},skew:{value:index*.44},accent:{value:index===0?1:0}
    },vertexShader:shaders.vertex,fragmentShader:shaders.fragment});
    const mesh=new T.Mesh(geom,material);
    mesh.frustumCulled=false;mesh.renderOrder=9-index*.001;mesh.visible=false;group.add(mesh);return mesh;
  });
  const billboards=new T.PlaneGeometry(1,1);
  function flare(color,order){
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{strength:{value:0},tint:{value:new T.Color(color)}},
      vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 v;uniform float strength;uniform vec3 tint;void main(){vec2 pp=(v-.5)*2.;float r=length(pp);float core=exp(-23.*r);float wide=exp(-9.2*r);vec2 k=mat2(.707,.707,-.707,.707)*pp;float prong=exp(-27.*abs(k.x)-6.6*abs(k.y))+exp(-27.*abs(k.y)-6.6*abs(k.x));float a=strength*(core*.97+wide*.46+prong*.32)*(1.-smoothstep(.75,.99,r));gl_FragColor=vec4(tint*(1.08+2.35*core),a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
    const mesh=new T.Mesh(billboards,material);mesh.renderOrder=order;mesh.frustumCulled=false;mesh.visible=false;group.add(mesh);return mesh;
  }
  const palmFlash=flare(0x8cefff,10),contactFlash=flare(0xffbb71,10);
  const wristLight=new T.PointLight(0x62ddff,0,1.75,2),crestLight=new T.PointLight(0x52caff,0,2.45,2);
  group.parent.add(wristLight,crestLight);
  function setFlash(mesh,strength,center,size,camera){
    mesh.visible=strength>.008;
    if(!mesh.visible)return;
    mesh.position.copy(center);
    mesh.scale.setScalar(size);
    mesh.quaternion.copy(camera.quaternion);
    mesh.material.uniforms.strength.value=strength;
  }
  function update(t,palm,end,camera,hit){
    axis.copy(end).sub(palm);const length=axis.length();axis.normalize();
    handPos.copy(palm).addScaledVector(axis,.23);
    impactPos.copy(end).addScaledVector(axis,-.115);
    const start=clamp((t+.16)/.16,0,1);
    const reach=t<0?lerp(.06,.88,start):Math.min(.98,.88+t*.55);
    for(let i=0;i<fronts.length;i++){
      const mesh=fronts[i],travel=reach-i*.27;
      const launch=clamp((travel-.02)/.21,0,1);
      const life=1-T.MathUtils.smoothstep(t,.075-i*.013,.29-i*.033);
      const accent=launch*life*(1-i*.42)*.86;
      mesh.visible=t>=-.16&&travel>.03&&accent>.02;
      if(!mesh.visible)continue;
      // Layered bowed fronts share the ray. The crests widen as they move
      // away from the hand and leave lighter, partly open secondary waves.
      mesh.position.copy(palm).addScaledVector(axis,length*travel);
      mesh.position.y-=.15*travel*travel;
      mesh.quaternion.setFromUnitVectors(zAxis,axis);
      const u=mesh.material.uniforms;
      u.coreRadius.value=lerp(.16,.90,Math.sqrt(travel))*(1-i*.07);
      u.energy.value=accent;u.wave.value=t*8+i*.37;
    }
    const flash=t<-.23?0:t<-.065?Math.exp(-Math.abs(t+.09)*14.):Math.exp(-Math.max(0.,t+.065)*4.9)*(1-T.MathUtils.smoothstep(t,.17,.255));
    wristLight.position.copy(handPos).addScaledVector(axis,-.08);wristLight.intensity=flash*1.48;
    crestLight.position.copy(fronts[0].position);crestLight.position.y=.44;
    crestLight.intensity=fronts[0].visible?4.7*fronts[0].material.uniforms.energy.value:0;
    setFlash(palmFlash,flash,handPos,.79,camera);
    setFlash(contactFlash,hit&&t>=0?Math.exp(-t*10)*1.55:0,impactPos,.89,camera);
  }
  return {update};
}
