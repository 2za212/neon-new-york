import * as T from 'three';

/**
 * Soft, layered after-rain sky. Colours enter the shader in linear space through
 * THREE.Color; tone mapping / output colour space are applied exactly once.
 * Max quality uses 12 value-noise calls per fragment, low quality uses 9.
 */
export function createCitySky() {
  const palette={
    night:{
      top:'#11203c',mid:'#344d74',horizon:'#97a5b6',below:'#30445c',
      cloudShadow:'#26364c',cloudLight:'#8995aa',warm:'#e59e80',
      fog:'#283b55',hemi:'#91b2ce',ground:'#373e52',sun:'#91b5d6',fill:'#758fac',
      exposure:1.08
    },
    dusk:{
      top:'#263a78',mid:'#505e9c',horizon:'#aa91ad',below:'#616b83',
      cloudShadow:'#465a90',cloudLight:'#b5b2cf',warm:'#dd9d88',
      fog:'#aaa8c0',hemi:'#c3cdee',ground:'#807268',sun:'#f1d0ad',fill:'#a6bed2',
      exposure:1.02
    },
    // Lighting from the west-southwest grazes the old masonry; the sky only
    // includes diffuse residual glow, never a visible moon or large sun disc.
    lightDirection:new T.Vector3(-.87,.36,.46).normalize(),
    suggestedNightSunIntensity:.48,
    suggestedNightHemiIntensity:.72,
    suggestedNightFillIntensity:.24,
    suggestedDuskSunIntensity:1.4,
    suggestedDuskHemiIntensity:.96
  };
  const colorNames=['top','mid','horizon','below','cloudShadow','cloudLight','warm'];
  const uniforms={
    uTime:{value:0},uNight:{value:1},uQuality:{value:1},
    uLightDirection:{value:palette.lightDirection.clone()}
  };
  for(const name of colorNames){
    const suffix=name[0].toUpperCase()+name.slice(1);
    uniforms['uNight'+suffix]={value:new T.Color(palette.night[name])};
    uniforms['uDusk'+suffix]={value:new T.Color(palette.dusk[name])};
  }
  const vertexShader=`
    varying vec3 vSkyDirection;
    void main(){
      // A sky is infinitely distant: keep its field in local directional space
      // and centre it on the camera used for THIS draw. This also handles the
      // Reflector camera and every PMREM cubemap face without a JS camera hook.
      vec3 direction=mat3(modelMatrix)*position;
      vSkyDirection=direction;
      vec4 world=vec4(direction+cameraPosition,1.0);
      gl_Position=projectionMatrix*viewMatrix*world;
      // The reflected camera has an oblique clip plane. A background sky stays
      // at far depth rather than being sliced by that plane or the world bounds.
      gl_Position.z=gl_Position.w;
    }
  `;
  const fragmentShader=`
    uniform float uTime;
    uniform float uNight;
    uniform float uQuality;
    uniform vec3 uLightDirection;
    uniform vec3 uNightTop,uNightMid,uNightHorizon,uNightBelow;
    uniform vec3 uNightCloudShadow,uNightCloudLight,uNightWarm;
    uniform vec3 uDuskTop,uDuskMid,uDuskHorizon,uDuskBelow;
    uniform vec3 uDuskCloudShadow,uDuskCloudLight,uDuskWarm;
    varying vec3 vSkyDirection;

    float hash31(vec3 p){
      p=fract(p*vec3(.1031,.1030,.0973));
      p+=dot(p,p.yzx+33.33);
      return fract((p.x+p.y)*p.z);
    }
    float noise3(vec3 p){
      vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
      return mix(
        mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),
            mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),
            mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
    }
    float broadCloud(vec3 p){
      float value=0.0,amplitude=.55,total=0.0;
      for(int i=0;i<4;i++){
        if(i>2 && uQuality<.5)break;
        value+=noise3(p)*amplitude;total+=amplitude;
        p=p*2.03+vec3(13.1,7.7,4.2);amplitude*=.48;
      }
      return value/total;
    }
    float softDetail(vec3 p){
      float value=0.0,amplitude=.6,total=0.0;
      for(int i=0;i<3;i++){
        if(i>1 && uQuality<.5)break;
        value+=noise3(p)*amplitude;total+=amplitude;
        p=p*2.07+vec3(7.1,11.7,3.4);amplitude*=.43;
      }
      return value/total;
    }
    void main(){
      vec3 d=normalize(vSkyDirection);
      float h=d.y,n=clamp(uNight,0.0,1.0);
      vec3 top=mix(uDuskTop,uNightTop,n);
      vec3 mid=mix(uDuskMid,uNightMid,n);
      vec3 horizon=mix(uDuskHorizon,uNightHorizon,n);
      vec3 below=mix(uDuskBelow,uNightBelow,n);
      vec3 cloudShadow=mix(uDuskCloudShadow,uNightCloudShadow,n);
      vec3 cloudLight=mix(uDuskCloudLight,uNightCloudLight,n);
      vec3 warm=mix(uDuskWarm,uNightWarm,n);

      // Most of the low sky is softly neutral steel blue, never a solid purple
      // wall. The narrow horizon blend provides a clear target for distance fog.
      vec3 sky=mix(horizon,mid,smoothstep(.0,.30,h));
      sky=mix(sky,top,smoothstep(.24,.91,h));
      sky=mix(below,sky,smoothstep(-.23,.025,h));
      float azimuth=dot(normalize(d.xz+vec2(.0001)),normalize(uLightDirection.xz));
      float residual=pow(max(azimuth,0.0),6.0)*exp(-pow((h-.045)*5.2,2.0));
      sky=mix(sky,warm,residual*mix(.25,.52,n));

      // An upper, broad layer and a thinner offset layer share a slow wind. The
      // projected plane expands toward the horizon while cloud opacity fades
      // into the same neutral horizon, avoiding a hard cloud/fog seam.
      vec2 uv=d.xz/(.26+max(h,0.0));
      float drift=uTime*.004;
      // The vertical angular scale intentionally crosses several low-frequency
      // cells between h=.1 and .6. A single broad cell here looks like a plain
      // gradient through the avenue, even when its hemisphere has cloud detail.
      vec3 p=vec3(uv.x*.82+uv.y*.36+drift,uv.y*2.4+drift*.34,2.47);
      vec2 warp=vec2(noise3(p*.44+3.7),noise3(p*.44+17.2))-.5;
      p.xy+=warp*.56;
      vec2 grid=vec2(92.,64.);
      p.xy=mix(p.xy,(floor(p.xy*grid)+.5)/grid,.85);
      float body=broadCloud(p);
      float detail=softDetail(vec3(uv.x*1.45-drift*.6,uv.y*.91+1.72,6.4));
      float density=body*.84+detail*.16;
      float coverage=smoothstep(.46,.565,density);
      float altitude=smoothstep(-.01,.085,h)*(1.0-.24*smoothstep(.63,.98,h));
      coverage*=altitude;

      // A displaced density estimate gives the soft volume a directional lit
      // edge. There is no sharp normal map or dark opaque cumulus block.
      vec3 offset=vec3(uLightDirection.x*.18,uLightDirection.z*.18,.045);
      float displaced=noise3(p+offset);
      float volume=clamp(.56+(displaced-body)*2.5,.21,.88);
      float edge=exp(-abs(density-.50)*15.0);
      float forwardGlow=pow(max(dot(d,uLightDirection),0.0),3.0);
      vec3 cloud=mix(cloudShadow,cloudLight,clamp(volume*.69+edge*(.08+.24*forwardGlow)+.06,0.0,.92));
      cloud=mix(cloud,warm,forwardGlow*edge*mix(.24,.07,n));
      float opacity=coverage*mix(.76,.79,n);
      sky=mix(sky,cloud,opacity);

      float wisps=smoothstep(.52,.70,detail)*altitude*(1.0-coverage*.58);
      sky=mix(sky,mix(cloudLight,mid,.45),wisps*.24);
      // Atmospheric integration near the skyline is intentionally haze-led.
      float horizonHaze=exp(-max(h,0.0)*21.0)*smoothstep(-.06,.015,h);
      sky=mix(sky,horizon,horizonHaze*.23);
      gl_FragColor=vec4(max(sky,vec3(.001)),1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;
  const material=new T.ShaderMaterial({uniforms,vertexShader,fragmentShader,
    side:T.BackSide,depthWrite:false,depthTest:true,toneMapped:true});
  material.name='NYC soft layered rain-cleared sky';
  const geometry=new T.SphereGeometry(490,48,32);
  const object=new T.Mesh(geometry,material);object.name='NYC procedural cloud sky';
  object.frustumCulled=false;object.renderOrder=-1000;
  object.userData.excludeFromAO=true;

  // Both copies use the same local directional field. Scaling this PMREM-only
  // sphere keeps its geometry near the cubemap camera; camera-relative shader
  // placement does not copy street meshes or change the shared cloud appearance.
  const environmentScene=new T.Scene();
  const environmentMaterial=material.clone();
  environmentMaterial.name='NYC sky / PMREM source';
  const environmentObject=new T.Mesh(geometry,environmentMaterial);
  environmentObject.scale.setScalar(.02);environmentObject.frustumCulled=false;
  environmentObject.name='NYC cloud sky environment only';
  environmentScene.add(environmentObject);
  let targetNight=1;
  function setNight(night){
    targetNight=night?1:0;
    environmentMaterial.uniforms.uNight.value=targetNight;
  }
  function update(dt,time){
    const t=Number.isFinite(time)?time:0;
    const delta=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:.016));
    uniforms.uTime.value=t;environmentMaterial.uniforms.uTime.value=t;
    uniforms.uNight.value=T.MathUtils.damp(uniforms.uNight.value,targetNight,3.0,delta);
  }
  function setQuality(high=true){
    const value=high===false||high==='low'?0:1;
    uniforms.uQuality.value=value;environmentMaterial.uniforms.uQuality.value=value;
  }
  return {object,setNight,update,setQuality,palette,environmentScene,
    getEnvironmentScene:()=>environmentScene};
}
