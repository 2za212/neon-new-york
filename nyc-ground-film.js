// World-space drainage patterns span adjacent paving meshes without UV seams.
// Moisture changes the roughness and darkens aggregate under the same lights.
export function rainFilm(material, strength, cover) {
  const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.userData.citySurfaceBounce=true;
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);
    shader.uniforms.cityCover={value:cover.map};
    shader.uniforms.cityCoverBounds={value:cover.bounds};
    shader.vertexShader='varying vec2 rainGroundXZ;\n'+shader.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nvec4 rainP=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nrainP=instanceMatrix*rainP;\n#endif\nrainGroundXZ=(modelMatrix*rainP).xz;');
    shader.fragmentShader=`
varying vec2 rainGroundXZ;
uniform sampler2D cityCover;uniform vec4 cityCoverBounds;
float rainHash(vec2 p){
  vec3 q=fract(vec3(p.xyx)*.1031);
  q+=dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
}
float rainNoise(vec2 p){
  vec2 c=floor(p),t=fract(p);t=t*t*(3.-2.*t);
  return mix(mix(rainHash(c),rainHash(c+vec2(1.,0.)),t.x),
             mix(rainHash(c+vec2(0.,1.)),rainHash(c+1.),t.x),t.y);
}
`+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`
#include <roughnessmap_fragment>
float groundFilm=smoothstep(.50,.71,rainNoise(rainGroundXZ*.39)*.66+
  rainNoise(rainGroundXZ*vec2(.93,1.81))*.24+rainNoise(rainGroundXZ*4.1)*.10);
groundFilm*=max(0.,dot(inverseTransformDirection(normalize(vNormal),viewMatrix),vec3(0.,1.,0.)))*${strength.toFixed(2)};
float avenue=(1.-smoothstep(3.7,6.4,abs(rainGroundXZ.x)))*smoothstep(10.,14.,rainGroundXZ.y)*(1.-smoothstep(83.,89.,rainGroundXZ.y));
roughnessFactor=mix(roughnessFactor,mix(.48,.70,avenue),groundFilm);
diffuseColor.rgb*=1.-groundFilm*.29;
`).replace('#include <aomap_fragment>',`#include <aomap_fragment>
vec2 coverUV=(rainGroundXZ-cityCoverBounds.xy)/cityCoverBounds.zw;
float coverAmount=texture2D(cityCover,coverUV).r;
reflectedLight.indirectDiffuse*=1.-.48*coverAmount;
reflectedLight.indirectSpecular*=1.-.52*coverAmount;
// The same low-level aggregate response spans old asphalt, crossing tiles and
// the new station street. It recedes under overhangs and on vertical faces.
float floorUp=max(0.,inverseTransformDirection(normalize(vNormal),viewMatrix).y);
reflectedLight.indirectDiffuse+=sqrt(max(diffuseColor.rgb,vec3(0.)))*vec3(.029,.034,.043)*floorUp*(1.-.58*coverAmount);
`);
  };
  material.customProgramCacheKey=()=>key+'/street-rain-film-'+strength;
}
