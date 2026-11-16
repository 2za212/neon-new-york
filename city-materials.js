import {materialMeans} from './material-means.js';
import * as T from 'three';

// The PNG's IDs run left to right from its top row. Vertex attributes carry
// semantic material IDs rather than a second set of per-face texture UVs.
export async function createCityMaterial() {
  const atlas = await new T.TextureLoader().loadAsync('materials/city-atlas.png');
  atlas.colorSpace = T.SRGBColorSpace;
  atlas.flipY = true;
  atlas.wrapS = atlas.wrapT = T.ClampToEdgeWrapping;
  atlas.minFilter = T.LinearMipmapLinearFilter;
  atlas.magFilter = T.NearestFilter;
  atlas.generateMipmaps = true;
  atlas.anisotropy = 4;
  atlas.needsUpdate = true;

  const material = new T.MeshStandardMaterial({
    color:0xffffff, vertexColors:true, roughness:.8, metalness:.1,
    emissive:0x000000, roughnessMap:null, metalnessMap:null
  });
  material.name = 'City world-scale surface atlas';
  const wallPixelStrength={value:1};
  material.userData.wallPixelStrength=wallPixelStrength;
  material.onBeforeCompile = shader => {
    shader.uniforms.cityAtlas = {value:atlas};
    shader.uniforms.cityMean={value:materialMeans.map(rgb=>new T.Vector3(...rgb))};
    shader.uniforms.cityAtlasTexel = {value:new T.Vector2(1/atlas.image.width,1/atlas.image.height)};
    shader.uniforms.cityWallPixelStrength=wallPixelStrength;
    shader.vertexShader = `
      attribute vec4 surface;
      varying vec4 vCitySurface;
      varying vec3 vCityWorld;
      varying vec3 vCityWorldNormal;
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      #include <project_vertex>
      vCitySurface = surface;
      vec4 cityWorldPosition=vec4(transformed,1.0);
      vec3 cityWorldObjectNormal=objectNormal;
      #ifdef USE_INSTANCING
        cityWorldPosition=instanceMatrix*cityWorldPosition;
        cityWorldObjectNormal=mat3(instanceMatrix)*cityWorldObjectNormal;
      #endif
      vCityWorld = (modelMatrix * cityWorldPosition).xyz;
      vCityWorldNormal = normalize(mat3(modelMatrix) * cityWorldObjectNormal);
    `);
    shader.fragmentShader = `
      uniform sampler2D cityAtlas;
      uniform vec3 cityMean[16];
      uniform vec2 cityAtlasTexel;
      uniform float cityWallPixelStrength;
      varying vec4 vCitySurface;
      varying vec3 vCityWorld;
      varying vec3 vCityWorldNormal;

      float cityWallHash(vec3 p) {
        p=fract(p*.1031);
        p+=dot(p,p.yzx+33.33);
        return fract((p.x+p.y)*p.z);
      }
      bool cityIsOpaqueWall(float id,vec3 position,vec3 faceNormal) {
        bool opaque=id<5.5||(id>11.5&&id<14.5);
        return opaque&&position.y>.45&&abs(normalize(faceNormal).y)<.25;
      }
      vec3 cityWallPixels(vec3 position,vec3 faceNormal,float id,out float roughnessShift) {
        vec3 axis=abs(faceNormal);
        bool xWall=axis.x>axis.z;
        vec2 uv=vec2(xWall?position.z:position.x,position.y);
        float plane=xWall?position.x:position.z;
        float facing=xWall?faceNormal.x:faceNormal.z;
        float seed=floor((plane-sign(facing)*.003)/.125)+id*37.+(xWall?113.:397.);
        // Use unquantized derivatives: the smaller dots fade before they alias.
        float footprint=max(length(dFdx(uv)),length(dFdy(uv)));
        float mainVisibility=smoothstep(.85,2.25,.0625/max(footprint,.00001));
        float fineVisibility=smoothstep(1.0,2.7,.03125/max(footprint,.00001));
        vec2 cell=floor(uv/.0625);
        float offset=floor(cityWallHash(vec3(cell.x,seed,19.))*2.);
        vec2 paired=vec2(cell.x,floor((cell.y+offset)/2.));
        float square=cityWallHash(vec3(cell,seed));
        float rectangle=cityWallHash(vec3(paired,seed+17.));
        float cluster=cityWallHash(vec3(floor(uv/vec2(.25,.5)),seed+71.));
        float distribution=.30*square+.55*rectangle+.15*cluster;
        float tone=distribution<.2?.77:distribution<.4?.89:distribution<.6?1.:distribution<.8?1.11:1.23;
        float fine=cityWallHash(vec3(floor(uv/.03125),seed+139.));
        float fineGate=step(.77,cityWallHash(vec3(cell,seed+43.)));
        float smallTone=.92+.08*floor(min(fine,.9999)*3.);
        tone*=mix(1.,smallTone,fineGate*fineVisibility*.75);
        roughnessShift=(distribution-.5)*.045*mainVisibility;
        // Adjacent values share one material hue. No edge/grout mask is drawn.
        float warmth=(cluster-.5)*.022;
        vec3 pixelColour=tone*vec3(1.+warmth,1.,1.-warmth);
        return mix(vec3(1.),pixelColour,mainVisibility);
      }

      vec2 cityResponse(float id) {
        if(id<.5) return vec2(.91,.02);
        if(id<1.5) return vec2(.87,.03);
        if(id<2.5) return vec2(.62,.05);
        if(id<3.5) return vec2(.64,.55);
        if(id<4.5) return vec2(.59,.65);
        if(id<5.5) return vec2(.64,.58);
        if(id<6.5) return vec2(.23,.32);
        if(id<7.5) return vec2(.29,.23);
        if(id<8.5) return vec2(.34,.04);
        if(id<9.5) return vec2(.88,.02);
        if(id<10.5) return vec2(.64,.21);
        if(id<11.5) return vec2(.98,.01);
        if(id<12.5) return vec2(.64,.16);
        if(id<13.5) return vec2(.59,.20);
        if(id<14.5) return vec2(.42,.58);
        return vec2(.32,.16);
      }
      float cityRepeatLength(float id) {
        if(id>5.5 && id<7.5) return 3.0;
        if(id>7.5 && id<9.5) return 1.0;
        if(id>10.5 && id<11.5) return 1.0;
        return 2.0;
      }
      vec3 cityAlbedo(float id, vec3 worldPosition, vec3 worldNormal) {
        float tileSize = cityRepeatLength(id);
        bool denseVoxel=vCitySurface.a>3.5;
        vec3 samplePosition=worldPosition;
        if(denseVoxel)samplePosition=(floor((worldPosition-normalize(worldNormal)*.003)/.125)+.5)*.125;
        vec3 axis = abs(normalize(worldNormal));
        vec2 plane;
        // Voxel face normals are axis aligned. Dominant-axis triplanar sampling
        // therefore has exactly one nonzero weight and needs a single lookup.
        if(axis.y>axis.x && axis.y>axis.z) plane=samplePosition.xz*vec2(1.,-1.);
        else if(axis.x>axis.z) plane=samplePosition.zy;
        else plane=samplePosition.xy;
        vec2 continuousUV=plane/tileSize;
        float column=mod(id,4.0),row=floor(id/4.0);
        vec2 base=vec2(column,3.0-row)*.25;
        vec2 inset=cityAtlasTexel*2.0;
        vec2 span=vec2(.25)-inset*2.0;
        vec2 uv=base+inset+fract(continuousUV)*span;
        // Derivatives are taken before fract, avoiding blurred seams when the
        // physical two-metre repeat crosses a voxel or a chunk boundary.
        vec2 gradientX=dFdx(continuousUV)*span,gradientY=dFdy(continuousUV)*span;
        if(denseVoxel){gradientX=vec2(.125/tileSize*span.x,0.);gradientY=vec2(0.,.125/tileSize*span.y);}
        return textureGrad(cityAtlas,uv,gradientX,gradientY).rgb;
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float cityID=clamp(floor(vCitySurface.r+.5),0.,15.);
      float cityEmission=clamp(vCitySurface.g/255.,0.,1.);
      float cityVariation=clamp(vCitySurface.b/255.,0.,1.);
      vec3 cityTexel=cityAlbedo(cityID,vCityWorld,vCityWorldNormal);
      float cityDistance=length(vViewPosition);
      float cityWallAmount=cityIsOpaqueWall(cityID,vCityWorld,vCityWorldNormal)?cityWallPixelStrength:0.;
      float cityDetail=mix(.78,.18,smoothstep(7.,80.,cityDistance));
      if(vCitySurface.a>3.5)cityDetail=.15;
      cityDetail=mix(cityDetail,.12,cityWallAmount);
      if(cityID>9.5 && cityID<10.5)cityDetail=mix(1.,.60,smoothstep(16.,90.,cityDistance));
      cityTexel=mix(cityMean[int(cityID)],cityTexel,cityDetail);
      if(vCitySurface.a>3.5&&cityID>.5&&cityID<1.5)cityTexel=mix(cityTexel,vec3(.44,.49,.54),.5);
      vec2 cityPhysical=cityResponse(cityID);
      float cityLuma=dot(cityTexel,vec3(.2126,.7152,.0722));
      float cityWallRoughness=0.;
      if(cityWallAmount>.001){
        vec3 wallPixels=cityWallPixels(vCityWorld,vCityWorldNormal,cityID,cityWallRoughness);
        cityTexel*=mix(vec3(1.),wallPixels,cityWallAmount);
        cityWallRoughness*=cityWallAmount;
      }
      if(cityID>7.5 && cityID<8.5)cityPhysical.x=mix(.24,.63,smoothstep(.015,.11,cityLuma));
      float cityCellReadability=1.-smoothstep(10.,44.,cityDistance);
      float cityCellTone=1.+.12*(cityVariation-.5)*cityCellReadability;
      if(cityID>5.5&&cityID<8.5)cityCellTone=1.;
      cityCellTone=mix(cityCellTone,1.,cityWallAmount);
      diffuseColor.rgb*=cityTexel*cityCellTone;
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
      float roughnessFactor=clamp(cityPhysical.x+.065*(.5-cityLuma)+.026*(cityVariation-.5)+cityWallRoughness,.17,1.0);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>', `
      float metalnessFactor=clamp(cityPhysical.y+.018*(cityVariation-.5),0.,1.0);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
      #include <normal_fragment_maps>
      float cityBump=.003;
      if(cityID>5.5 && cityID<7.5)cityBump=.0003;
      else if(cityID>7.5 && cityID<9.5)cityBump=.006;
      else if(cityID>2.5 && cityID<5.5)cityBump=.002;
      if(vCitySurface.a>3.5)cityBump=0.;
      if(cityWallAmount>.001)cityBump=min(cityBump,.0008)*(1.-smoothstep(3.,7.,cityDistance));
      vec3 cityDx=dFdx(-vViewPosition),cityDy=dFdy(-vViewPosition);
      vec3 cityR1=cross(cityDy,normal),cityR2=cross(normal,cityDx);
      float cityDet=dot(cityDx,cityR1);
      vec3 cityGradient=sign(cityDet)*(dFdx(cityLuma)*cityR1+dFdy(cityLuma)*cityR2);
      normal=normalize(abs(cityDet)*normal-cityBump*cityGradient);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      vec3 glowTint=cityTexel;
      if(cityID>5.5 && cityID<7.5)glowTint=cityID<6.5?vec3(.20,.74,1.0):vec3(1.0,.49,.16);
      totalEmissiveRadiance+=glowTint*cityEmission*(cityID<7.5?2.65:2.35);
    `);
  };
  material.customProgramCacheKey = () => 'city-atlas-world-surfaces-wall-pixels2';
  return material;
}
