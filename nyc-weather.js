import * as T from 'three';
import {randomSource} from './nyc-geometry.js';

/** Fine world-anchored drizzle; a roof map keeps it out of covered walkways. */
export function createCityWeather(scene,{bounds,colliders=[],weatherOccluders=[]}){
  const size=1024,roofData=new Float32Array(size*size),rand=randomSource(39071);
  const width=bounds.maxX-bounds.minX,depth=bounds.maxZ-bounds.minZ;
  for(const [index,box] of [...colliders,...weatherOccluders].entries()){
    if(box.max.y<2.5||Math.min(box.max.x-box.min.x,box.max.z-box.min.z)<.24)continue;
    // Broad thin roof geometry covers every intersected cell, including visor
    // edges. Tall collision volumes use centres so pillars don't grow canopies.
    const roofPiece=index>=colliders.length;
    const lo=(value,origin,span)=>roofPiece?Math.floor((value-origin)/span*size):Math.ceil((value-origin)/span*size-.5);
    const hi=(value,origin,span)=>roofPiece?Math.ceil((value-origin)/span*size)-1:Math.floor((value-origin)/span*size-.5);
    const x0=Math.max(0,lo(box.min.x,bounds.minX,width)),x1=Math.min(size-1,hi(box.max.x,bounds.minX,width));
    const z0=Math.max(0,lo(box.min.z,bounds.minZ,depth)),z1=Math.min(size-1,hi(box.max.z,bounds.minZ,depth));
    const value=Math.max(0,box.max.y);
    for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)roofData[z*size+x]=Math.max(roofData[z*size+x],value);
  }
  const roof=new T.DataTexture(roofData,size,size,T.RedFormat,T.FloatType);roof.minFilter=roof.magFilter=T.NearestFilter;roof.needsUpdate=true;
  // Fraction of covered ground per cell. Two box filters soften the sky
  // visibility transition at the lip of an awning without any per-frame work.
  const side=256,cover=new Uint8Array(side*side),blur=new Uint8Array(cover.length);
  for(let z=0;z<side;z++)for(let x=0;x<side;x++){
    let occupied=0;
    for(let j=0;j<4;j++)for(let i=0;i<4;i++)occupied+=roofData[(4*z+j)*size+4*x+i]>2.5?1:0;
    cover[z*side+x]=Math.round(occupied*255/16);
  }
  for(let z=0;z<side;z++)for(let x=0;x<side;x++){
    let sum=0;for(let i=-1;i<=1;i++)sum+=cover[z*side+Math.max(0,Math.min(side-1,x+i))];
    blur[z*side+x]=sum/3;
  }
  for(let z=0;z<side;z++)for(let x=0;x<side;x++){
    let sum=0;for(let j=-1;j<=1;j++)sum+=blur[Math.max(0,Math.min(side-1,z+j))*side+x];
    cover[z*side+x]=sum/3;
  }
  const coverMap=new T.DataTexture(cover,side,side,T.RedFormat);
  coverMap.minFilter=coverMap.magFilter=T.LinearFilter;coverMap.needsUpdate=true;
  const groundCover={map:coverMap,bounds:new T.Vector4(bounds.minX,bounds.minZ,width,depth)};
  const plane=new T.PlaneGeometry(1,1),geometry=new T.InstancedBufferGeometry();geometry.index=plane.index.clone();
  geometry.setAttribute('position',plane.attributes.position.clone());geometry.setAttribute('uv',plane.attributes.uv.clone());plane.dispose();
  const seeds=new Float32Array(680*4);for(let i=0;i<seeds.length;i++)seeds[i]=rand();geometry.setAttribute('aSeed',new T.InstancedBufferAttribute(seeds,4));geometry.instanceCount=420;
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,uniforms:{
    uTime:{value:0},uNight:{value:1},uRoof:{value:roof},uBounds:{value:new T.Vector4(bounds.minX,bounds.minZ,width,depth)}
  },vertexShader:`attribute vec4 aSeed;uniform float uTime;uniform sampler2D uRoof;uniform vec4 uBounds;varying vec2 vUv;varying float vVisibility;varying vec3 vRainTint;
    void main(){
      vec3 center;
      center.x=cameraPosition.x+mod(aSeed.x*46.0+uTime*.48-cameraPosition.x+23.0,46.0)-23.0;
      center.z=cameraPosition.z+mod(aSeed.y*46.0+uTime*.13-cameraPosition.z+23.0,46.0)-23.0;
      center.y=cameraPosition.y+mod(aSeed.z*28.0-uTime*8.2-cameraPosition.y+6.0,28.0)-6.0;
      float roofY=texture2D(uRoof,(center.xz-uBounds.xy)/uBounds.zw).r;
      vVisibility=step(max(.30,roofY+.18),center.y)*(1.0-smoothstep(18.0,26.0,length(center.xz-cameraPosition.xz)));
      vec4 view=viewMatrix*vec4(center,1.0);
      vec3 fall=(viewMatrix*vec4(vec3(-.04,-(.22+aSeed.w*.24),0.0),0.0)).xyz;
      view.xyz+=fall*position.y;view.x+=position.x*(.012+aSeed.w*.008);
      gl_Position=projectionMatrix*view;vUv=uv;
      float pink=1.0-smoothstep(3.0,16.0,length(center.xz-vec2(29.0,-93.0)));
      vRainTint=mix(vec3(.34,.51,.65),vec3(.70,.36,.61),pink*.65);
    }`,fragmentShader:`uniform float uNight;varying vec2 vUv;varying float vVisibility;varying vec3 vRainTint;
    void main(){float edge=pow(max(0.0,1.0-abs(vUv.x-.5)*2.0),1.4);float alpha=edge*sin(vUv.y*3.14159)*vVisibility*mix(.10,.22,uNight);if(alpha<.006)discard;gl_FragColor=vec4(vRainTint,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const rain=new T.Mesh(geometry,material);rain.frustumCulled=false;rain.renderOrder=11;rain.name='NYC / sheltered fine drizzle';rain.userData.excludeFromAO=true;scene.add(rain);
  return{groundCover,stats:{drawCalls:1,maxStreaks:680,roofMask:size,roofPrecision:'float32 metres',horizontalShelters:weatherOccluders.length},setNight(night){rain.visible=!night;material.uniforms.uNight.value=night?1:0;},setQuality(level){geometry.instanceCount=level==='high'?680:level==='low'?140:420;},update(dt,time){material.uniforms.uTime.value=time;},dispose(){geometry.dispose();material.dispose();roof.dispose();coverMap.dispose();scene.remove(rain);}};
}
