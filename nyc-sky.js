import * as T from 'three';
import {gridStations} from './nyc-regional-grid.js';
import {riftShader} from './nyc-blood-rift.js';

// Cloud light is projected from the powered city into a world-space ceiling.
// The reflected camera sees the same cloud deck as the walking camera.
export function createCitySky(){
  const unlit=new T.DataTexture(new Uint8Array([0,0,0,255]),1,1);
  unlit.needsUpdate=true;
  const uniforms={uTime:{value:0},uRain:{value:0},uDetail:{value:1},uRift:{value:new T.Vector3()},
    uGrid:{value:unlit},uGridBounds:{value:new T.Vector4(0,0,1,1)},
    uPlants:{value:gridStations.map(s=>new T.Vector4(s.x,s.h*.67,s.z,s.h*.62))},
    uPlantColor:{value:gridStations.map(s=>new T.Color(s.c))}};
  const material=new T.ShaderMaterial({
    name:'长夜 / 工业云底',uniforms,side:T.BackSide,depthWrite:false,
    vertexShader:`
      varying vec3 vRay;
      void main(){
        vRay=mat3(modelMatrix)*position;
        gl_Position=projectionMatrix*viewMatrix*vec4(cameraPosition+vRay,1.);
        gl_Position.z=gl_Position.w;
      }`,
    fragmentShader:`
      varying vec3 vRay;
      uniform float uTime,uRain,uDetail;
      uniform sampler2D uGrid;
      uniform vec4 uGridBounds;
      uniform vec4 uPlants[${gridStations.length}];
      uniform vec3 uPlantColor[${gridStations.length}];
      float hash(vec2 p){
        vec3 q=fract(vec3(p.xyx)*.1031);
        q+=dot(q,q.yzx+33.33);
        return fract((q.x+q.y)*q.z);
      }
      float noise(vec2 p){
        vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
                   mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
      }
      float glow(vec2 p,vec2 centre,vec2 radius){
        vec2 q=(p-centre)/radius;
        return exp(-dot(q,q));
      }
      ${riftShader}
      void main(){
        vec3 d=normalize(vRay);
        float above=smoothstep(-.09,.09,d.y);
        // Below the deck the ray meets the cloud underside. From above it,
        // an aerial view gradually loses the glow instead of following the camera.
        float deck=mix(225.,204.,uRain);
        vec2 hit=cameraPosition.xz+d.xz*max(1.,deck-cameraPosition.y)/max(d.y,.035);
        vec2 p=hit*vec2(.008,.014)+vec2(uTime*.006,-uTime*.002);
        float mass=.68*noise(p)+.32*noise(p*2.03+19.);
        if(uDetail>.5)mass+=.10*(noise(p*4.09-7.)-.5);
        float altitude=smoothstep(-.02,.72,d.y);
        vec3 blackSky=mix(vec3(.011,.016,.026),vec3(.005,.0075,.013),altitude);
        vec3 sky=blackSky*(.58+.70*smoothstep(.24,.74,mass)*above);
        // The exchange crown and the interchange are actual light sources
        // at these XZ coordinates. Unpowered horizon sectors stay uncoloured.
        float crown=glow(hit,vec2(88.,-351.),vec2(112.,93.));
        float station=glow(hit,vec2(48.,-257.),vec2(54.,47.));
        float docks=glow(hit,vec2(-149.,4.),vec2(59.,52.));
        float seam=smoothstep(.26,.54,mass)*(1.-.65*smoothstep(.55,.78,mass));
        // Suspended industrial haze silhouettes the regional grid. Compute
        // the angular size from the plant itself, so turning and crossing a
        // district reveal the same source from a different side.
        float folds=.47+.53*smoothstep(.22,.71,mass);
        for(int i=0;i<${gridStations.length};i++){
          vec3 toPlant=uPlants[i].xyz-cameraPosition;
          float along=dot(d,toPlant);
          vec3 offset=d*along-toPlant;
          offset.y*=1.8;
          float radius=uPlants[i].w;
          float air=exp(-dot(offset,offset)/(radius*radius))*smoothstep(0.,34.,along);
          sky+=air*folds*(.085+.024*uRain)*uPlantColor[i]*above;
        }
        float underside=above*(1.-smoothstep(deck-8.,deck+45.,cameraPosition.y));
        sky+=underside*(.28+.72*seam)*(crown*vec3(.022,.009,.028)
             +station*vec3(.005,.015,.021)+docks*vec3(.015,.007,.002));
        // Lower banks catch spill from the working city. Across open water
        // and past the last substations the cloud shelf falls back into black.
        float ceiling=mix(46.,35.,uRain);
        vec2 shelf=cameraPosition.xz+d.xz*(ceiling-cameraPosition.y)/max(d.y,.045);
        vec2 uv=(shelf-uGridBounds.xy)/uGridBounds.zw;
        vec2 edge=smoothstep(vec2(0.),vec2(.13),min(uv,1.-uv));
        float belts=noise(shelf*vec2(.016,.042)+vec2(uTime*.011,0.));
        float veil=smoothstep(.18,.56,belts+.20*(mass-.5));
        float bottom=smoothstep(.025,.14,d.y)*(1.-smoothstep(ceiling-5.,ceiling+12.,cameraPosition.y));
        sky+=texture2D(uGrid,uv).rgb*edge.x*edge.y*bottom*veil*(.022+.054*seam);
        sky*=mix(1.,.82,uRain);
        gl_FragColor=vec4(bloodSky(sky,d,mass),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const geometry=new T.SphereGeometry(490,32,24);
  const object=new T.Mesh(geometry,material);object.name='城市 / 长夜云幕';
  object.frustumCulled=false;object.renderOrder=-1000;object.userData.excludeFromAO=true;
  const environmentScene=new T.Scene(),environmentMaterial=material.clone();
  const dome=new T.Mesh(geometry,environmentMaterial);dome.scale.setScalar(.02);dome.frustumCulled=false;environmentScene.add(dome);
  let rain=0,powerRevision=0;
  return {object,rift:uniforms.uRift,environmentScene,getEnvironmentScene:()=>environmentScene,
    get powerRevision(){return powerRevision;},
    setCityPowerMap(map,bounds){
      for(const u of [uniforms,environmentMaterial.uniforms]){
        u.uGrid.value=map;u.uGridBounds.value.copy(bounds);
      }
      powerRevision++;
    },
    setNight(clear){rain=clear?0:1;environmentMaterial.uniforms.uRain.value=rain;},
    setQuality(level){uniforms.uDetail.value=level==='low'||level===false?0:1;environmentMaterial.uniforms.uDetail.value=uniforms.uDetail.value;},
    update(dt,time){uniforms.uTime.value=time;uniforms.uRain.value=T.MathUtils.damp(uniforms.uRain.value,rain,3,dt);}
  };
}
