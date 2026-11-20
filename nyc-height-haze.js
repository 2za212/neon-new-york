import * as T from 'three';

/** Height-integrated haze in linear light, shared by physical city materials. */
export function createHeightHaze(scene,sky){
  const color={value:new T.Color('#151e2b')},density={value:.0058},seen=new Set();
  scene.traverse(object=>{for(const material of Array.isArray(object.material)?object.material:[object.material]){
    if(!material?.isMeshStandardMaterial||seen.has(material))continue;seen.add(material);
    const previous=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
    material.onBeforeCompile=function(shader,renderer){
      previous.call(this,shader,renderer);shader.uniforms.uCityHazeColor=color;shader.uniforms.uCityHazeDensity=density;
      shader.uniforms.uStreetEnergy=sky.object.material.uniforms.uGrid;
      shader.uniforms.uStreetExtent=sky.object.material.uniforms.uGridBounds;
      shader.vertexShader='varying vec3 vCityHazeWorld,vHazeLight; uniform sampler2D uStreetEnergy; uniform vec4 uStreetExtent;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
        vec4 cityHazePosition=vec4(transformed,1.0);
        #ifdef USE_BATCHING
          cityHazePosition=batchingMatrix*cityHazePosition;
        #endif
        #ifdef USE_INSTANCING
          cityHazePosition=instanceMatrix*cityHazePosition;
        #endif
        vCityHazeWorld=(modelMatrix*cityHazePosition).xyz;
        vec2 hazeUV=(mix(cameraPosition.xz,vCityHazeWorld.xz,.64)-uStreetExtent.xy)/uStreetExtent.zw;
        vec2 inside=smoothstep(vec2(0.),vec2(.055),min(hazeUV,1.-hazeUV));
        vHazeLight=texture2D(uStreetEnergy,hazeUV).rgb*inside.x*inside.y;
      `);
      shader.fragmentShader='varying vec3 vCityHazeWorld,vHazeLight;\nuniform vec3 uCityHazeColor;\nuniform float uCityHazeDensity;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',`
        float hazeH0=max(cameraPosition.y,0.0)/7.5;
        float hazeH1=max(vCityHazeWorld.y,0.0)/7.5;
        float hazeDH=hazeH1-hazeH0;
        float hazeAverage=abs(hazeDH)<.001?exp(-hazeH0):(exp(-hazeH0)-exp(-hazeH1))/hazeDH;
        float hazeAmount=(1.0-exp(-length(cameraPosition-vCityHazeWorld)*max(hazeAverage,0.0)*uCityHazeDensity))*.72;
        vec3 scattered=uCityHazeColor+.034*vHazeLight*vec3(.57,.73,1.);
        gl_FragColor.rgb=mix(gl_FragColor.rgb,scattered,hazeAmount);
        #include <tonemapping_fragment>
      `);
    };
    material.customProgramCacheKey=()=>cacheKey+'/city-height-haze-v2';material.needsUpdate=true;
  }});
  return{stats:{materials:seen.size,heightFalloff:7.5},setNight(night){color.value.set(night?'#151e2b':'#1e2b36');density.value=night?.0058:.009;}};
}
