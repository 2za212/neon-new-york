import * as T from 'three';

/** Height-integrated haze in linear light, shared by physical city materials. */
export function createHeightHaze(scene){
  const color={value:new T.Color('#29445e')},density={value:.0058},seen=new Set();
  scene.traverse(object=>{for(const material of Array.isArray(object.material)?object.material:[object.material]){
    if(!material?.isMeshStandardMaterial||seen.has(material))continue;seen.add(material);
    const previous=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
    material.onBeforeCompile=function(shader,renderer){
      previous.call(this,shader,renderer);shader.uniforms.uCityHazeColor=color;shader.uniforms.uCityHazeDensity=density;
      shader.vertexShader='varying vec3 vCityHazeWorld;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
        vec4 cityHazePosition=vec4(transformed,1.0);
        #ifdef USE_BATCHING
          cityHazePosition=batchingMatrix*cityHazePosition;
        #endif
        #ifdef USE_INSTANCING
          cityHazePosition=instanceMatrix*cityHazePosition;
        #endif
        vCityHazeWorld=(modelMatrix*cityHazePosition).xyz;
      `);
      shader.fragmentShader='varying vec3 vCityHazeWorld;\nuniform vec3 uCityHazeColor;\nuniform float uCityHazeDensity;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',`
        float hazeH0=max(cameraPosition.y,0.0)/7.5;
        float hazeH1=max(vCityHazeWorld.y,0.0)/7.5;
        float hazeDH=hazeH1-hazeH0;
        float hazeAverage=abs(hazeDH)<.001?exp(-hazeH0):(exp(-hazeH0)-exp(-hazeH1))/hazeDH;
        float hazeAmount=(1.0-exp(-length(cameraPosition-vCityHazeWorld)*max(hazeAverage,0.0)*uCityHazeDensity))*.72;
        gl_FragColor.rgb=mix(gl_FragColor.rgb,uCityHazeColor,hazeAmount);
        #include <tonemapping_fragment>
      `);
    };
    material.customProgramCacheKey=()=>cacheKey+'/city-height-haze-v1';material.needsUpdate=true;
  }});
  return{stats:{materials:seen.size,heightFalloff:7.5},setNight(night){color.value.set(night?'#29445e':'#a0a4a3');density.value=night?.0058:.0012;}};
}
