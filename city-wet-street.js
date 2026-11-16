import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';

const wetStreetShader = {
  name:'Patchy wet avenue reflection',
  uniforms:{
    ...T.UniformsLib.fog,
    color:{value:new T.Color(0x243a54)},
    tDiffuse:{value:null},
    textureMatrix:{value:new T.Matrix4()},
    worldReflectionMatrix:{value:new T.Matrix4()},
    sharedProjection:{value:0},
    night:{value:1},
    reflectionTexel:{value:new T.Vector2(1/512,1/512)}
  },
  vertexShader:`
    uniform mat4 textureMatrix;
    uniform mat4 worldReflectionMatrix;
    uniform float sharedProjection;
    varying vec4 vReflection;
    varying vec3 vWetWorld;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    #include <fog_pars_vertex>
    void main(){
      vec4 worldPosition=modelMatrix*vec4(position,1.0);
      vReflection=sharedProjection>.5?worldReflectionMatrix*worldPosition:textureMatrix*vec4(position,1.0);
      vWetWorld=worldPosition.xyz;
      vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
      gl_Position=projectionMatrix*mvPosition;
      #include <logdepthbuf_vertex>
      #include <fog_vertex>
    }
  `,
  fragmentShader:`
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float night;
    uniform vec2 reflectionTexel;
    varying vec4 vReflection;
    varying vec3 vWetWorld;
    #include <common>
    #include <logdepthbuf_pars_fragment>
    #include <fog_pars_fragment>

    float wetHash(vec2 p){
      vec3 q=fract(vec3(p.xyx)*.1031);
      q+=dot(q,q.yzx+33.33);
      return fract((q.x+q.y)*q.z);
    }
    float wetNoise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      f=f*f*(3.-2.*f);
      return mix(mix(wetHash(i),wetHash(i+vec2(1.,0.)),f.x),
        mix(wetHash(i+vec2(0.,1.)),wetHash(i+vec2(1.)),f.x),f.y);
    }
    float streetWetness(vec2 p){
      vec2 q=p*vec2(.28,.105);
      float broad=.64*wetNoise(q+vec2(17.4,31.9))+
        .25*wetNoise(q*2.13+vec2(8.2,5.4))+
        .11*wetNoise(p*.84+vec2(2.1,9.7));
      float rut=.075*exp(-pow((abs(p.x)-4.15)*1.15,2.));
      float puddle=smoothstep(.43,.665,broad+rut);
      float curb=1.-smoothstep(7.35,8.65,abs(p.x));
      float endFade=smoothstep(-68.,-64.,p.y)*(1.-smoothstep(62.,66.,p.y));
      // A drier centerline and two worn crossing bands keep the street's
      // original modeled paint legible through the reflective overlay.
      float center=mix(.34,1.,smoothstep(.17,.58,abs(p.x)));
      float crossing=(smoothstep(17.8,18.6,p.y)-smoothstep(20.6,21.5,p.y))+
        (smoothstep(27.2,27.9,p.y)-smoothstep(29.1,29.9,p.y));
      return puddle*curb*endFade*center*(1.-.64*clamp(crossing,0.,1.));
    }
    void main(){
      #include <logdepthbuf_fragment>
      vec2 p=vWetWorld.xz;
      float wet=streetWetness(p);
      if(wet<.014)discard;
      vec2 projected=vReflection.xy/vReflection.w;
      float detail=wetNoise(p*vec2(.62,.37)+12.8);
      vec2 wave=vec2(sin(p.y*3.17+.56*sin(p.x*1.7)),
        sin(p.x*4.81+p.y*.46))*(.00035+.00045*detail);
      vec2 uv=projected+wave;
      float spread=.68+1.20*(1.-wet);
      vec2 blur=reflectionTexel*spread;
      vec3 reflected=texture2D(tDiffuse,uv).rgb*.40;
      reflected+=texture2D(tDiffuse,uv+vec2(blur.x,0.)).rgb*.15;
      reflected+=texture2D(tDiffuse,uv-vec2(blur.x,0.)).rgb*.15;
      reflected+=texture2D(tDiffuse,uv+vec2(0.,blur.y)).rgb*.15;
      reflected+=texture2D(tDiffuse,uv-vec2(0.,blur.y)).rgb*.15;
      float horizon=pow(1.-abs(normalize(cameraPosition-vWetWorld).y),2.15);
      vec3 coolFilter=mix(vec3(.67,.79,.94),vec3(.88,.94,1.0),horizon);
      reflected=reflected*coolFilter+color*.12;
      float opacity=wet*(.17+.19*horizon)*mix(.78,1.,night);
      float valid=smoothstep(0.,.015,uv.x)*smoothstep(0.,.015,uv.y)*
        (1.-smoothstep(.985,1.,uv.x))*(1.-smoothstep(.985,1.,uv.y));
      gl_FragColor=vec4(reflected,opacity*valid);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }
  `
};

export function addWetStreet(scene,renderer){
  const geometry=new T.PlaneGeometry(17.6,134);
  const reflector=new Reflector(geometry,{
    textureWidth:512,textureHeight:512,multisample:0,clipBias:.003,
    color:0x243a54,shader:wetStreetShader
  });
  reflector.name='Single patchy wet avenue';
  reflector.rotation.x=-Math.PI/2;
  reflector.position.set(0,.008,-1);
  reflector.renderOrder=4;
  reflector.castShadow=false;reflector.receiveShadow=false;
  reflector.material.transparent=true;
  reflector.material.depthWrite=false;
  reflector.material.depthTest=true;
  reflector.material.fog=true;
  reflector.material.uniforms.night.value=1;
  const target=reflector.getRenderTarget();
  target.texture.minFilter=T.LinearFilter;
  target.texture.magFilter=T.LinearFilter;
  target.texture.generateMipmaps=false;

  // Only the 27m foreground forecourt rises above the road. Its overlay uses
  // the same 512px reflected scene, with the projector expressed in world space.
  const worldReflectionMatrix=new T.Matrix4(),inverseWorld=new T.Matrix4();
  const plazaUniforms=T.UniformsUtils.clone(wetStreetShader.uniforms);
  plazaUniforms.tDiffuse.value=target.texture;
  plazaUniforms.sharedProjection.value=1;
  plazaUniforms.worldReflectionMatrix.value=worldReflectionMatrix;
  const plazaMaterial=new T.ShaderMaterial({
    name:'Raised forecourt shared wet reflection',uniforms:plazaUniforms,
    vertexShader:wetStreetShader.vertexShader,fragmentShader:wetStreetShader.fragmentShader,
    transparent:true,depthWrite:false,depthTest:true,fog:true
  });
  const plazaGeometry=new T.PlaneGeometry(17,27);
  const plaza=new T.Mesh(plazaGeometry,plazaMaterial);
  plaza.name='Raised forecourt wet overlay';
  plaza.rotation.x=-Math.PI/2;plaza.position.set(0,.258,44);
  plaza.renderOrder=5;scene.add(plaza);
  const renderReflection=reflector.onBeforeRender;
  let reflecting=false;
  reflector.userData.reflectionRenders=0;
  reflector.onBeforeRender=function(activeRenderer,activeScene,camera){
    // GTAO's normal/depth override renders must not trigger another city draw.
    if(reflecting||activeScene.overrideMaterial)return;
    reflecting=true;
    const plazaWasVisible=plaza.visible;
    plaza.visible=false;
    try{
      renderReflection.call(this,activeRenderer,activeScene,camera);
      reflector.userData.reflectionRenders++;
      worldReflectionMatrix.copy(reflector.material.uniforms.textureMatrix.value)
        .multiply(inverseWorld.copy(reflector.matrixWorld).invert());
    }finally{
      plaza.visible=plazaWasVisible;
      reflecting=false;
    }
  };
  scene.add(reflector);
  return {
    object:reflector,
    setNight(enabled){
      reflector.material.uniforms.night.value=enabled?1:0;
      plazaMaterial.uniforms.night.value=enabled?1:0;
    },
    dispose(){
      scene.remove(reflector,plaza);geometry.dispose();reflector.dispose();
      plazaGeometry.dispose();plazaMaterial.dispose();
    }
  };
}
