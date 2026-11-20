import * as T from 'three';
import {unitDepth,unitTone} from './nyc-unit-bond.js';
const bound=new WeakSet();

// The same 32 cm end faces continue beyond the near geometry and through
// cut-up intersections. Only contact edges get dark mortar.
export function finishPavement(mat,road,anisotropy){
  const size=128,albedo=new Uint8Array(size*size*4),rough=new Uint8Array(albedo.length);
  const base=road?[81,91,100]:[143,150,149],kind=road?0:1;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x>>4,v=y>>4,lx=x&15,ly=y&15,h=unitDepth(u&3,v&3,kind);
    const left=unitDepth((u-1)&3,v&3,kind),top=unitDepth(u&3,(v-1)&3,kind);
    const tone=unitTone(u,v,kind),grain=(((x>>2)*7+(y>>2)*19+u*v)%9-4)*.004;
    let value=1+(tone-1)*(road?1.28:1.16)+grain;
    if(lx===0||ly===0)value*=.81;
    if((lx<3&&left>h)||(ly<3&&top>h))value*=.79;
    if((lx===1&&left<h)||(ly===1&&top<h))value+=.09;
    const i=(y*size+x)*4;
    for(let k=0;k<3;k++){
      albedo[i+k]=Math.round(base[k]*value);
      rough[i+k]=(road?158:197)+(h<0?-17:11)+Math.round((tone-1)*95);
    }
    albedo[i+3]=rough[i+3]=255;
  }
  function texture(pixels,color){
    const t=new T.DataTexture(pixels,size,size);
    if(color)t.colorSpace=T.SRGBColorSpace;
    t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;
    t.generateMipmaps=true;t.anisotropy=Math.min(4,anisotropy);t.needsUpdate=true;return t;
  }
  mat.map=texture(albedo,true);mat.roughnessMap=texture(rough,false);mat.roughness=1;
  mat.userData.textureMeters=2.56;mat.userData.worldUnitsUV=true;
  bindPavementUV(mat);
}
// Cloned district finishes share the textures, but Three does not copy
// onBeforeCompile. Install the instance offset on each actual material.
export function bindPavementUV(mat){
  if(!mat.userData.worldUnitsUV||bound.has(mat))return;
  bound.add(mat);
  const compile=mat.onBeforeCompile,cache=mat.customProgramCacheKey();
  const meters=mat.userData.textureMeters||2.56;
  mat.customProgramCacheKey=()=>cache+'/world-setts/'+meters;
  mat.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      #ifdef USE_INSTANCING
        vec2 settOrigin=instanceMatrix[3].xz / ${meters.toFixed(6)};
        #ifdef USE_MAP
        vMapUv+=mat2(mapTransform)*settOrigin;
        #endif
        #ifdef USE_ROUGHNESSMAP
        vRoughnessMapUv+=mat2(roughnessMapTransform)*settOrigin;
        #endif
      #endif`);
  };
  mat.needsUpdate=true;
}
