import * as T from 'three';

// A small world-space volume holds static reflected light. Road, quay, gantry
// and upper windows sample different storeys even when they share the same XZ.
const heights=[-5.7,.45,3.65,7.8,16,32,64];
const storeyReturn=[.014,.084,.16,.24,.31,.25,.14];

function collectEmitters(scene,world){
  const sources=[...world.streetPower.sources];
  scene.updateMatrixWorld(true);
  const pos=new T.Vector3();
  scene.traverse(o=>{
    if(!(o.isPointLight||o.isSpotLight)||o.distance<=0||o.userData.mobileEmitter)return;
    o.getWorldPosition(pos);
    if(pos.y>80)return;
    const power=o.userData.nightPower??o.userData.nightIntensity??o.intensity;
    if(power<2)return;
    const source={x:pos.x,y:pos.y,z:pos.z,glow:o.color.getHex(),
      gain:Math.min(2.0,Math.sqrt(power)*.148),reach:Math.min(35,Math.max(5,o.distance*1.46))};
    if(o.isSpotLight){
      const aim=o.target.getWorldPosition(new T.Vector3()).sub(pos).normalize();
      source.aim=aim.toArray();source.cone=Math.cos(o.angle+.46);
    }
    sources.push(source);
  });
  for(const sign of world.streetAds.sites){
    const area=sign.width*sign.height,nx=Math.sin(sign.yaw),nz=Math.cos(sign.yaw);
    const twoSided=sign.kind==='blade'||sign.kind==='kiosk';
    sources.push({x:sign.x+nx*.30,y:sign.y,z:sign.z+nz*.30,glow:sign.glow,
      gain:Math.min(2.15,.35+Math.sqrt(area)*.32),reach:Math.min(29,5.4+Math.sqrt(area)*2.7),
      aim:[nx,0,nz],twoSided,cone:-.20});
  }
  return sources;
}

// Convolve outdoor light onto the lower cloud deck. Spreading in XZ before
// projecting the view ray keeps each pool fixed over its powered streets.
function cloudLightMap(sources,bounds){
  const pitch=6,w=Math.ceil(bounds.z/pitch),d=Math.ceil(bounds.w/pitch);
  const sum=new Float32Array(w*d*3),colour=new T.Color();
  for(const light of sources){
    if(light.y<0)continue;
    const radius=Math.min(64,14+light.reach*1.5),reach=radius/pitch;
    const cx=(light.x-bounds.x)/bounds.z*w-.5,cz=(light.z-bounds.y)/bounds.w*d-.5;
    colour.setHex(light.glow);
    for(let z=Math.max(0,Math.floor(cz-reach));z<=Math.min(d-1,Math.ceil(cz+reach));z++){
      for(let x=Math.max(0,Math.floor(cx-reach));x<=Math.min(w-1,Math.ceil(cx+reach));x++){
        const falloff=1-((cx-x)**2+(cz-z)**2)/(reach*reach);
        if(falloff<=0)continue;
        const p=(z*w+x)*3,g=.16*light.gain*(1+Math.min(light.y,48)/35)*falloff**3;
        sum[p]+=colour.r*g;sum[p+1]+=colour.g*g;sum[p+2]+=colour.b*g;
      }
    }
  }
  const rgba=new Uint8Array(w*d*4);
  for(let i=0;i<w*d;i++){
    for(let k=0;k<3;k++)rgba[i*4+k]=Math.round(255*(1-Math.exp(-sum[i*3+k])));
    rgba[i*4+3]=255;
  }
  const map=new T.DataTexture(rgba,w,d);
  map.minFilter=map.magFilter=T.LinearFilter;map.needsUpdate=true;
  return map;
}

export function bakeCityRadiance(scene,world,avatar,sky,maxDimension){
  const {bounds}=world,ox=bounds.minX-18,oz=bounds.minZ-18;
  const step=Math.max(1.6,(bounds.maxX+18-ox)/maxDimension,(bounds.maxZ+18-oz)/maxDimension);
  const w=Math.ceil((bounds.maxX+18-ox)/step),d=Math.ceil((bounds.maxZ+18-oz)/step);
  const plane=w*d,n=plane*heights.length;
  const floors=new Uint8Array(n);
  const bound=(v,o,max)=>Math.max(0,Math.min(max-1,Math.floor((v-o)/step)));
  // Opaque building masses screen neighbouring alleys. Posts and traffic
  // remain too small to extinguish a whole cell of reflected light.
  for(const {min,max} of world.colliders){
    if(max.y-min.y<1.2||max.x-min.x<.65||max.z-min.z<.65||(max.x-min.x)*(max.z-min.z)<5)continue;
    const xmin=bound(min.x,ox,w),xmax=bound(max.x,ox,w),zmin=bound(min.z,oz,d),zmax=bound(max.z,oz,d);
    for(let h=0;h<heights.length;h++){
      if(heights[h]<min.y||heights[h]>max.y)continue;
      for(let z=zmin;z<=zmax;z++){
        const at=h*plane+z*w;floors.fill(1,at+xmin,at+xmax+1);
      }
    }
  }
  const sum=new Float32Array(n*3),dirs=new Float32Array(n*3);
  const sources=collectEmitters(scene,world),colour=new T.Color();
  for(const s of sources){
    const {x,y,z,reach,gain}=s,reach2=reach*reach;
    const x0=bound(x-reach,ox,w),x1=bound(x+reach,ox,w);
    const z0=bound(z-reach,oz,d),z1=bound(z+reach,oz,d);
    colour.setHex(s.glow);
    const luminance=.2126*colour.r+.7152*colour.g+.0722*colour.b;
    for(let h=0;h<heights.length;h++){
      const dy=heights[h]-y;
      if(Math.abs(dy)>=reach)continue;
      for(let row=z0;row<=z1;row++)for(let col=x0;col<=x1;col++){
        const dx=ox+(col+.5)*step-x,dz=oz+(row+.5)*step-z;
        const dd=dx*dx+dy*dy+dz*dz;
        if(dd>=reach2)continue;
        const length=Math.max(.65,Math.sqrt(dd));
        let power=gain*(1-length/reach)**1.6/(1+.012*dd);
        if(s.aim){
          const dot=(dx*s.aim[0]+dy*s.aim[1]+dz*s.aim[2])/length;
          power*=.13+.87*T.MathUtils.smoothstep(s.twoSided?Math.abs(dot):dot,s.cone,.80);
        }
        // Exclude the endpoints: wall faces themselves must receive light.
        for(const t of [.32,.60,.80]){
          const index=h*plane+bound(z+dz*t,oz,d)*w+bound(x+dx*t,ox,w);
          if(floors[index]){power*=.28;break;}
        }
        const k=3*(h*plane+row*w+col),weight=power*luminance/length;
        sum[k]+=power*colour.r;sum[k+1]+=power*colour.g;sum[k+2]+=power*colour.b;
        dirs[k]-=weight*dx;dirs[k+1]-=weight*dy;dirs[k+2]-=weight*dz;
      }
    }
  }
  const params={value:new T.Vector4(ox,oz,w*step,d*step)};
  const skyMap=cloudLightMap(sources,params.value);
  sky.setCityPowerMap(skyMap,params.value);
  const broad=skyMap.image,colors=new Uint8Array(n*4),normals=new Uint8Array(n*4);
  for(let i=0;i<n;i++){
    const storey=Math.floor(i/plane),cell=i%plane;
    const px=Math.min(broad.width-1,Math.floor((cell%w+.5)*broad.width/w));
    const pz=Math.min(broad.height-1,Math.floor((Math.floor(cell/w)+.5)*broad.height/d));
    const near=4*(pz*broad.width+px);
    // Light from neighbouring occupied floors returns from the street canyon.
    // Keep wells dark and favour upper exposed stone above the lamp heads.
    const bounce=storeyReturn[storey]*(floors[i] ? .55 : 1);
    const p=i*3,k=i*4,len=Math.max(.025,Math.hypot(dirs[p],dirs[p+1],dirs[p+2]));
    for(let j=0;j<3;j++){
      const returned=bounce*broad.data[near+j]/255;
      colors[k+j]=Math.round(255*(1-Math.exp(-.93*sum[p+j]-returned)));
      normals[k+j]=Math.round(127.5+127.5*dirs[p+j]/len);
    }
    colors[k+3]=normals[k+3]=255;
  }
  function volume(data){
    const tex=new T.Data3DTexture(data,w,d,heights.length);
    tex.format=T.RGBAFormat;tex.minFilter=tex.magFilter=T.LinearFilter;tex.needsUpdate=true;
    return {value:tex};
  }
  const rgb=volume(colors),dir=volume(normals);
  const subject=new Set();
  avatar.traverse(o=>{if(o.material)for(const m of [].concat(o.material))subject.add(m);});
  const materials=new Set();
  scene.traverse(o=>{
    if(!o.material)return;
    for(const m of [].concat(o.material)){
      if(subject.has(m)||m.transparent||(!m.isMeshStandardMaterial&&!m.isMeshLambertMaterial))continue;
      if(m.emissiveMap&&m.emissiveIntensity>.65)continue;
      materials.add(m);
    }
  });
  for(const m of materials){
    const previous=m.onBeforeCompile,key=m.customProgramCacheKey();
    const reflective=m.isMeshStandardMaterial&&(m.roughness<.65||m.metalness>.12||m.userData.citySurfaceBounce);
    m.onBeforeCompile=function(shader,renderer){
      previous.call(this,shader,renderer);
      shader.uniforms.cityRadiance=rgb;shader.uniforms.cityIncident=dir;shader.uniforms.cityVolumeBounds=params;
      shader.uniforms.uRiftField=sky.rift;
      shader.vertexShader='varying vec3 vPoweredWorld;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
        vec4 cityP=vec4(transformed,1.);
        #ifdef USE_BATCHING
          cityP=batchingMatrix*cityP;
        #endif
        #ifdef USE_INSTANCING
          cityP=instanceMatrix*cityP;
        #endif
        vPoweredWorld=(modelMatrix*cityP).xyz;`);
      shader.fragmentShader=`varying vec3 vPoweredWorld;
        uniform highp sampler3D cityRadiance,cityIncident;
        uniform vec4 cityVolumeBounds;
        uniform vec3 uRiftField;
        float cityStorey(float y){
          return clamp((y+5.7)/6.15,0.,1.)+clamp((y-.45)/3.2,0.,1.)+clamp((y-3.65)/4.15,0.,1.)
             +clamp((y-7.8)/8.2,0.,1.)+clamp((y-16.)/16.,0.,1.)+clamp((y-32.)/32.,0.,1.);
        }
      `+shader.fragmentShader.replace('#include <opaque_fragment>',`
        vec3 cityN=transformNormalByInverseViewMatrix(normal,viewMatrix);
        vec3 cityP=vPoweredWorld+cityN*.24;
        vec3 cityUV=vec3((cityP.xz-cityVolumeBounds.xy)/cityVolumeBounds.zw,(cityStorey(cityP.y)+.5)/7.);
        vec3 cityFlux=texture(cityRadiance,cityUV).rgb*(1.-smoothstep(60.,86.,cityP.y));
        vec3 cityL=texture(cityIncident,cityUV).rgb*2.-1.;
        float cityFace=.28+.88*max(dot(cityL,cityN),0.);
        vec3 cityBase=sqrt(max(diffuseColor.rgb,vec3(0.)));
        outgoingLight+=cityFlux*(.225*cityBase+.52*diffuseColor.rgb)*cityFace;
        if(uRiftField.y>0.){
          // A broad penumbra travels over roofs, down vertical faces and
          // across the road in one world-space field, independent of view.
          float t=uRiftField.x*(.38+.62*uRiftField.z);
          float wave=dot(cityP,vec3(.074,.086,-.043))+.68*sin(cityP.z*.071+t*.27)-t*1.06;
          float band=pow(.5+.5*cos(wave),5.);
          float face=.17+.83*max(dot(cityN,vec3(-.46,.78,.42)),0.);
          float activeRift=uRiftField.y*smoothstep(.18,1.50,uRiftField.x);
          outgoingLight*=mix(vec3(1.),vec3(.82,.60,.66),activeRift);
          outgoingLight+=vec3(.91,.027,.047)*activeRift*face*(.18+1.75*band)*(.09+cityBase);
        }
        ${reflective?`vec3 cityView=normalize(cameraPosition-cityP);
          float cityGloss=max(0.,dot(reflect(-normalize(cityL+vec3(.0001)),cityN),cityView));
          outgoingLight+=cityFlux*pow(cityGloss,11.)*(1.-roughnessFactor)*.20;`:''}
        #include <opaque_fragment>`);
    };
    m.customProgramCacheKey=()=>key+'/night-city-volume-3/'+(reflective?'gloss':'matte');m.needsUpdate=true;
  }
  return {emitters:sources.length,materials:materials.size,storeys:heights.length};
}
