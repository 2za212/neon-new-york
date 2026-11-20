import {streetLightReflection} from './nyc-wet-emitters.js';
import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';

// One low-resolution planar scene capture is shared by the whole road network.
// Sparse puddle islands carry the readable reflections. Curb dampness and tyre
// tracks remain much rougher and weaker, leaving the central asphalt visible.
export function createWetReflection(scene,bounds={minX:-44,maxX:44,minZ:-52,maxZ:52}) {
  if(!bounds||!['minX','maxX','minZ','maxZ'].every(k=>Number.isFinite(bounds[k]))||bounds.maxX<=bounds.minX||bounds.maxZ<=bounds.minZ){
    throw new TypeError('Wet reflection bounds must be a finite, non-empty XZ rectangle.');
  }
  const shader={name:'NYC broken wet street',uniforms:{
    ...T.UniformsLib.fog,color:{value:new T.Color('#1c3049')},tDiffuse:{value:null},
    textureMatrix:{value:new T.Matrix4()},strength:{value:1},time:{value:0},
    reflectionTexel:{value:new T.Vector2(1/512,1/512)},
    puddleOpacity:{value:.39},dampOpacity:{value:.044},blurPixels:{value:5.2},
    westRoadLimit:{value:-132}
  },vertexShader:`
uniform mat4 textureMatrix;
varying vec4 vReflection;varying vec3 vWorld;
#include <common>
#include <logdepthbuf_pars_vertex>
#include <fog_pars_vertex>
void main(){
  vReflection=textureMatrix*vec4(position,1.0);
  vec4 worldPosition=modelMatrix*vec4(position,1.0);vWorld=worldPosition.xyz;
  vec4 mvPosition=viewMatrix*worldPosition;gl_Position=projectionMatrix*mvPosition;
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
}`,fragmentShader:`
uniform vec3 color;uniform sampler2D tDiffuse;uniform float strength;uniform float time;
uniform vec2 reflectionTexel;uniform float puddleOpacity;uniform float dampOpacity;uniform float blurPixels;
uniform float westRoadLimit;
varying vec4 vReflection;varying vec3 vWorld;
#include <common>
#include <logdepthbuf_pars_fragment>
#include <fog_pars_fragment>
${streetLightReflection}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float puddle(vec2 p,vec2 centre,vec2 halfSize,float seed){
  vec2 q=(p-centre)/halfSize;
  float edge=dot(q,q);
  // World-metre variation breaks the edge without a rectangular tile boundary.
  edge+=(noise(p*2.2+seed)-.5)*.27+(noise(p*.74-seed)-.5)*.18;
  return 1.0-smoothstep(.58,1.0,edge);
}
vec3 roughReflection(vec2 uv,vec2 radius){
  // Eleven taps in this draw, sharing the single 512px planar capture.
  // Larger longitudinal support smears small windows into wet-light streaks.
  vec3 result=texture2D(tDiffuse,uv).rgb*.12;
  result+=texture2D(tDiffuse,uv+radius*vec2(.95,.10)).rgb*.08;
  result+=texture2D(tDiffuse,uv+radius*vec2(-.95,-.10)).rgb*.08;
  result+=texture2D(tDiffuse,uv+radius*vec2(.10,.90)).rgb*.11;
  result+=texture2D(tDiffuse,uv+radius*vec2(-.10,-.90)).rgb*.11;
  result+=texture2D(tDiffuse,uv+radius*vec2(.70,.65)).rgb*.07;
  result+=texture2D(tDiffuse,uv+radius*vec2(-.70,.65)).rgb*.07;
  result+=texture2D(tDiffuse,uv+radius*vec2(.70,-.65)).rgb*.07;
  result+=texture2D(tDiffuse,uv+radius*vec2(-.70,-.65)).rgb*.07;
  result+=texture2D(tDiffuse,uv+radius*vec2(.22,1.80)).rgb*.11;
  result+=texture2D(tDiffuse,uv+radius*vec2(-.22,-1.80)).rgb*.11;
  return result;
}
void main(){
  #include <logdepthbuf_fragment>
  vec2 p=vWorld.xz;
  float vertical=1.0-smoothstep(6.05,6.42,abs(p.x));
  // The west extension ends before the esplanade/river. An enlarged reflector
  // must not turn the water or raised paving into an infinite z=0 asphalt road.
  float horizontal=(1.0-smoothstep(6.05,6.42,abs(p.y)))*smoothstep(westRoadLimit,westRoadLimit+.75,p.x);
  float midtownRange=smoothstep(-180.0,-179.5,p.y)*(1.0-smoothstep(-52.6,-52.0,p.y));
  float sideRoad=max(1.0-smoothstep(4.42,4.80,abs(p.x+36.0)),1.0-smoothstep(4.42,4.80,abs(p.x-58.0)));
  float crossRoad=max(1.0-smoothstep(5.25,5.6,abs(p.y+86.0)),1.0-smoothstep(5.25,5.6,abs(p.y+118.0)));
  crossRoad*=smoothstep(-64.0,-63.5,p.x)*(1.0-smoothstep(83.5,84.0,p.x));
  float southRange=smoothstep(51.5,52.0,p.y)*(1.0-smoothstep(159.5,160.0,p.y));
  float southSides=max(1.0-smoothstep(4.05,4.4,abs(p.x+48.0)),1.0-smoothstep(4.4,4.8,abs(p.x-58.0)));
  float southCross=max(1.0-smoothstep(4.65,5.0,abs(p.y-84.0)),1.0-smoothstep(4.65,5.0,abs(p.y-128.0)));
  southCross*=smoothstep(-64.0,-63.5,p.x)*(1.0-smoothstep(83.5,84.0,p.x));
  float southLoop=(1.0-smoothstep(4.05,4.4,abs(p.y-150.0)))*smoothstep(-48.0,-47.5,p.x)*(1.0-smoothstep(57.5,58.0,p.x));
  float parkRange=smoothstep(-58.8,-58.3,p.y)*(1.0-smoothstep(95.5,96.0,p.y));
  float parkWest=(1.0-smoothstep(4.4,4.8,abs(p.x-58.0)))*parkRange;
  float parkEast=(1.0-smoothstep(4.05,4.4,abs(p.x-132.0)))*smoothstep(-.5,0.0,p.y)*(1.0-smoothstep(83.5,84.0,p.y));
  float parkCross=max(1.0-smoothstep(4.05,4.4,abs(p.y-12.0)),1.0-smoothstep(4.65,5.0,abs(p.y-84.0)))*smoothstep(44.0,44.5,p.x)*(1.0-smoothstep(131.5,132.0,p.x));
  float road=max(max(vertical,horizontal),max(sideRoad,crossRoad)*midtownRange);
  road=max(road,max(max(southSides,southCross)*southRange,southLoop));
  road=max(road,max(max(parkWest,parkEast),parkCross));
  if(road<.01||vReflection.w<=0.0)discard;

  // Fixed, deliberately sparse depressions: no continuous mirror of a street wall.
  float pool=0.0;
  pool=max(pool,puddle(p,vec2(5.25,21.8),vec2(.77,2.35),2.1));
  pool=max(pool,puddle(p,vec2(-5.10,18.4),vec2(.83,1.85),5.3));
  pool=max(pool,puddle(p,vec2(5.10,11.5),vec2(.72,1.40),8.7));
  pool=max(pool,puddle(p,vec2(-5.20,28.2),vec2(.81,2.10),11.3));
  // Small irregular depressions catch the new deli and record-shop light,
  // still sharing the single capture and leaving the street centre rough.
  pool=max(pool,puddle(p,vec2(5.10,29.0),vec2(.86,2.30),12.1));
  pool=max(pool,puddle(p,vec2(-5.00,32.0),vec2(.78,1.80),12.7));
  pool=max(pool,puddle(p,vec2(5.15,72.0),vec2(.80,2.10),82.1));
  pool=max(pool,puddle(p,vec2(-5.10,96.5),vec2(.83,2.25),83.7));
  pool=max(pool,puddle(p,vec2(17.0,87.9),vec2(2.15,.72),84.3));
  pool=max(pool,puddle(p,vec2(61.9,27.0),vec2(.72,2.35),86.2));
  pool=max(pool,puddle(p,vec2(125.0,4.9),vec2(2.20,.66),87.8));
  pool=max(pool,puddle(p,vec2(5.00,-16.0),vec2(.81,2.20),13.8));
  pool=max(pool,puddle(p,vec2(-5.10,-32.0),vec2(.78,1.80),17.1));
  pool=max(pool,puddle(p,vec2(14.8,-5.10),vec2(2.20,.75),19.4));
  pool=max(pool,puddle(p,vec2(-17.3,5.10),vec2(2.60,.74),23.7));
  pool=max(pool,puddle(p,vec2(29.3,5.10),vec2(2.15,.71),29.3));
  pool=max(pool,puddle(p,vec2(-31.3,-5.0),vec2(2.20,.70),31.8));
  // Sparse wet depressions along the new west connecting street, still using
  // this same capture. Large dry gaps keep warehouse frontages from mirroring.
  pool=max(pool,puddle(p,vec2(-56.0,-5.10),vec2(2.10,.70),37.4));
  pool=max(pool,puddle(p,vec2(-75.0,5.10),vec2(2.35,.73),43.1));
  pool=max(pool,puddle(p,vec2(-96.0,-5.05),vec2(2.10,.70),47.8));
  pool=max(pool,puddle(p,vec2(-119.0,5.00),vec2(2.20,.71),53.2));
  pool=max(pool,puddle(p,vec2(5.10,-66.5),vec2(.78,2.25),57.3));
  pool=max(pool,puddle(p,vec2(-5.10,-77.0),vec2(.80,2.10),59.8));
  pool=max(pool,puddle(p,vec2(5.15,-103.8),vec2(.83,2.70),62.2));
  pool=max(pool,puddle(p,vec2(-21.0,-81.1),vec2(2.25,.70),65.1));
  pool=max(pool,puddle(p,vec2(29.0,-90.8),vec2(2.80,.70),69.2));
  pool=max(pool,puddle(p,vec2(18.4,-113.0),vec2(2.50,.69),73.8));
  pool=max(pool,puddle(p,vec2(-31.9,-133.7),vec2(.73,2.20),79.4));
  pool=max(pool,puddle(p,vec2(53.9,-150.0),vec2(.74,2.30),83.5));
  float localPond=max(puddle(p,vec2(-5.67,33.2),vec2(.63,2.45),93.),puddle(p,vec2(-5.60,15.15),vec2(.75,2.35),98.));
  pool=max(pool,localPond);
  pool*=smoothstep(.12,.48,noise(p*vec2(3.8,2.7)+7.4));

  float curb=max(exp(-pow((abs(p.x)-5.25)*1.45,2.0))*vertical,
                 exp(-pow((abs(p.y)-5.25)*1.45,2.0))*horizontal);
  float tyreV=exp(-pow((abs(p.x)-2.5)*3.5,2.0))+exp(-pow((abs(p.x)-4.1)*3.5,2.0));
  float tyreH=exp(-pow((abs(p.y)-2.5)*3.5,2.0))+exp(-pow((abs(p.y)-4.1)*3.5,2.0));
  float tyre=max(tyreV*vertical,tyreH*horizontal);
  float along=mix(p.x,p.y,step(horizontal,vertical));
  float across=mix(p.y,p.x,step(horizontal,vertical));
  float broken=smoothstep(.32,.73,noise(vec2(across*3.1,along*.83)+vec2(8.7,31.0)));
  float damp=clamp(curb*.78+tyre*.38,0.0,1.0)*broken;
  // Leave an irregular dry central band, road paint, and crossing silhouettes.
  damp*=smoothstep(.75,1.7,min(abs(p.x),abs(p.y)));
  float crosswalk=(1.0-smoothstep(1.0,1.8,abs(abs(p.y)-8.15)))*vertical+(1.0-smoothstep(1.0,1.8,abs(abs(p.x)-8.15)))*horizontal;
  float crossingKeep=1.0-clamp(crosswalk,0.0,1.0)*.90;
  float paint=smoothstep(.25,.80,min(abs(p.x),abs(p.y)));
  float streak=.66+.34*noise(vec2(across*13.0,along*.95)+4.1);
  float coverage=road*crossingKeep*paint;
  pool*=coverage*streak;damp*=coverage;
  float amount=pool*puddleOpacity+damp*dampOpacity*(1.0-pool);
  if(amount<.006)discard;

  vec2 uv=vReflection.xy/vReflection.w;
  // Sub-pixel roughness displacement, without the long rolling waves of a river.
  vec2 grain=vec2(noise(p*2.7+3.7),noise(p*2.1-9.2))-.5;
  uv+=reflectionTexel*(grain*vec2(.9,1.4)+vec2(sin(along*4.0+time*.27),cos(across*6.0-time*.21))*.15);
  float roughness=mix(1.0,.54,pool);
  vec2 blur=reflectionTexel*blurPixels*mix(.67,1.16,roughness)*vec2(.75,1.18);
  vec3 reflected=roughReflection(uv,blur);

  // The HalfFloat Reflector capture is scene-linear HDR. Preserve its hue and
  // luminance; reduced background visibility comes from roughness and coverage.
  float facing=clamp(abs(normalize(cameraPosition-vWorld).y),0.0,1.0);
  float fresnel=.025+.975*pow(1.0-facing,5.0);
  float distanceFade=1.0-smoothstep(28.0,85.0,length(cameraPosition-vWorld));
  float valid=smoothstep(.0,.025,uv.x)*smoothstep(.0,.025,uv.y)*(1.0-smoothstep(.975,1.0,uv.x))*(1.0-smoothstep(.975,1.0,uv.y));
  float peak=max(reflected.r,max(reflected.g,reflected.b));
  float chroma=peak-min(reflected.r,min(reflected.g,reflected.b));
  float neon=smoothstep(.8,2.2,peak)*smoothstep(.12,.6,chroma);
  float opacity=amount*(.28+.72*fresnel)*strength*distanceFade*valid;
  opacity*=1.0+neon*.20;
  if(localPond>.015){
    vec3 waterNormal=normalize(vec3(grain.x*.045,1.,grain.y*.065));
    reflected+=streetGlints(vWorld,waterNormal,normalize(cameraPosition-vWorld))*streak;
    opacity=max(opacity,localPond*pool*(.17+.32*fresnel)*strength*distanceFade);
  }
  gl_FragColor=vec4(reflected,opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`};
  const surface=new Reflector(new T.PlaneGeometry(bounds.maxX-bounds.minX,bounds.maxZ-bounds.minZ),{
    textureWidth:512,textureHeight:512,multisample:0,clipBias:.003,color:0x182b40,shader
  });
  surface.name='NYC actual planar wet reflection';
  surface.position.set((bounds.minX+bounds.maxX)/2,.195,(bounds.minZ+bounds.maxZ)/2);surface.rotation.x=-Math.PI/2;
  surface.material.transparent=true;surface.material.depthWrite=false;surface.material.fog=true;
  surface.renderOrder=3;surface.userData.castShadow=false;
  const target=surface.getRenderTarget();target.texture.minFilter=T.LinearFilter;target.texture.magFilter=T.LinearFilter;
  const originalRender=surface.onBeforeRender;let reflecting=false,enabled=true;
  surface.onBeforeRender=function(renderer,activeScene,camera){
    if(!enabled||reflecting||activeScene.overrideMaterial)return;
    reflecting=true;
    try{originalRender.call(this,renderer,activeScene,camera);}finally{reflecting=false;}
  };
  scene.add(surface);
  return {
    object:surface,
    update(time){surface.material.uniforms.time.value=time;},
    setNight(night){surface.material.uniforms.strength.value=night?1.08:.72;},
    setQuality(level){enabled=level==='high';surface.visible=enabled;},
    dispose(){scene.remove(surface);surface.geometry.dispose();surface.dispose();}
  };
}
