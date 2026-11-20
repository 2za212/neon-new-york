import * as T from 'three';

// The UE actor stores its palette in baseColorTexture (there is no COLOR_0).
// The four coefficients below approximate diffuse light arriving from broad
// facade and pavement bounces. They belong only to the character materials.
export function createSubjectBounce(scene,avatarGroup){
  const fixtures=[];
  scene.traverse(o=>{
    if((o.isPointLight||o.isSpotLight)&&o.distance>0)fixtures.push(o);
  });
  // Some storefronts have a point and a spot for the same lens so different
  // render tiers can light the pavement. Count their common source once.
  const spotlights=fixtures.filter(l=>l.isSpotLight);
  const emitters=fixtures.filter(l=>l.isSpotLight||!spotlights.some(s=>
    Math.hypot(l.position.x-s.position.x,l.position.z-s.position.z)<.55&&Math.abs(l.position.y-s.position.y)<1.6));
  const coefficients=Array.from({length:4},()=>({value:new T.Vector3()}));
  const targets=coefficients.map(()=>new T.Vector3());
  const enabledUniform={value:1};
  let enabled=true,active=false,elapsed=1;
  const position=new T.Vector3(),direction=new T.Vector3(),lightPosition=new T.Vector3();
  const lampAim=new T.Vector3(),rgb=new T.Vector3(),last=new T.Vector3(Infinity,Infinity,Infinity);
  const materials=new Set();
  avatarGroup.traverse(o=>{
    if(!o.isMesh)return;
    for(const material of Array.isArray(o.material)?o.material:[o.material]){
      if(material?.isMeshStandardMaterial)materials.add(material);
    }
  });

  const contribution=`
    if(subjectBounceEnable>0.5){
      vec3 nWorld=transformNormalByInverseViewMatrix(normal,viewMatrix);
      vec3 irradiance=max(vec3(0.),subjectBounce0+subjectBounceX*nWorld.x
                         +subjectBounceY*nWorld.y+subjectBounceZ*nWorld.z);
      // Light that struck the pavement returns from a broad lower hemisphere.
      // It reaches the shadow-side folds of the trousers from below the knee.
      irradiance+=subjectBounce0*.32*clamp(.67-.57*nWorld.y,.0,1.);
      float glancing=pow(1.-saturate(dot(normal,normalize(vViewPosition))),2.);
      // A small dielectric return keeps the weave of near-black sleeves
      // legible at grazing angles. Front-facing cloth still follows albedo.
      float paletteValue=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      float brightPigment=smoothstep(.035,.46,paletteValue);
      // Pale hair fibres scatter a largely unpigmented component. Preserve
      // the base palette in the direct shader and keep its second bounce quiet.
      vec3 surface=mix(diffuseColor.rgb,vec3(paletteValue),.72*brightPigment);
      vec3 cloth=surface*mix(1.,.48,brightPigment)+.018+glancing*(.032+.023*roughnessFactor);
      // A lane with several nearby lights already has a strong physical key.
      // Fill the remaining shadow latitude there, retaining the existing lit faces.
      float existing=dot(totalDiffuse+totalSpecular,vec3(.2126,.7152,.0722));
      float strongPool=max(subjectBounce0.r,max(subjectBounce0.g,subjectBounce0.b));
      float latitude=(1.-.84*smoothstep(.002,.047,existing))*(1.-.66*smoothstep(.23,.48,strongPool));
      outgoingLight+=irradiance*cloth*latitude*subjectBounceEnable;
    }
    #include <opaque_fragment>`;
  for(const material of materials){
    const compile=material.onBeforeCompile,render=material.onBeforeRender,key=material.customProgramCacheKey();
    material.onBeforeCompile=function(shader,renderer){
      compile.call(this,shader,renderer);
      [shader.uniforms.subjectBounce0,shader.uniforms.subjectBounceX,
        shader.uniforms.subjectBounceY,shader.uniforms.subjectBounceZ]=coefficients;
      shader.uniforms.subjectBounceEnable=enabledUniform;
      shader.fragmentShader='uniform float subjectBounceEnable;\nuniform vec3 subjectBounce0,subjectBounceX,subjectBounceY,subjectBounceZ;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',contribution);
    };
    material.customProgramCacheKey=()=>key+'/street-practical-bounce-2';
    material.onBeforeRender=function(...args){
      render.apply(this,args);
      // The opening reparents the same actor into the apartment group. Even
      // when its window shows the exterior, the room keeps its own fixtures.
      enabledUniform.value=enabled&&avatarGroup.parent===scene?1:0;
    };
    material.needsUpdate=true;
  }

  function sample(subject){
    position.copy(subject);position.y+=1.10;
    for(const v of targets)v.set(0,0,0);
    for(const lamp of emitters){
      if(lamp.intensity<=0)continue;
      // Rendering limits dynamically toggle visible on real light sources.
      // Indirect reflection still follows the lit facade past that cut.
      lamp.getWorldPosition(lightPosition);
      direction.subVectors(lightPosition,position);
      const wideWindow=lamp.isPointLight&&lamp.distance>=9&&lamp.intensity>=58;
      const d2=direction.lengthSq(),reach=Math.min(30,lamp.distance*(wideWindow?2.55:1.65));
      if(d2>=reach*reach||d2<.01)continue;
      const d=Math.sqrt(d2);
      direction.divideScalar(d);
      let weight=(1-T.MathUtils.smoothstep(d,reach*.22,reach))*
        Math.min(2.5,lamp.intensity/50)/(1+d2*.011);
      if(lamp.isSpotLight){
        lamp.target.getWorldPosition(lampAim);lampAim.sub(lightPosition).normalize();
        const alignment=-direction.dot(lampAim);
        weight*=.018+.982*T.MathUtils.smoothstep(alignment,Math.cos(lamp.angle+.24),Math.cos(lamp.angle*.66));
      }
      if(weight<.0001)continue;
      const luma=.2126*lamp.color.r+.7152*lamp.color.g+.0722*lamp.color.b;
      // These are second bounces off pale concrete, not a second sample of
      // the saturated direct light already evaluated by the physical shader.
      const neutral=lamp.color.r>lamp.color.b?.46:.12;
      rgb.set((1-neutral)*lamp.color.r+neutral*luma,(1-neutral)*lamp.color.g+neutral*luma,
        (1-neutral)*lamp.color.b+neutral*luma).multiplyScalar(weight);
      targets[0].addScaledVector(rgb,.39);
      targets[1].addScaledVector(rgb,direction.x*.78);
      // The low return from the ground carries the local lamp colour too.
      targets[2].addScaledVector(rgb,direction.y*.69-.14);
      targets[3].addScaledVector(rgb,direction.z*.78);
    }
    const peak=Math.max(targets[0].x,targets[0].y,targets[0].z);
    const compress=1.42/(1+.95*peak);
    for(const v of targets)v.multiplyScalar(compress);
  }
  function update(dt,subjectPosition){
    if(!enabled||avatarGroup.parent!==scene||!subjectPosition){active=false;return;}
    elapsed+=Math.max(0,dt);
    const travel=last.distanceToSquared(subjectPosition),snap=!active||travel>36;
    if(snap||elapsed>=.14||travel>.36){
      sample(subjectPosition);last.copy(subjectPosition);elapsed=0;
    }
    const blend=snap?1:1-Math.exp(-Math.max(0,dt)*10);
    for(let i=0;i<coefficients.length;i++)coefficients[i].value.lerp(targets[i],blend);
    active=true;
  }
  function setEnabled(value){
    enabled=Boolean(value);enabledUniform.value=enabled?1:0;
    if(!enabled)active=false;
  }
  return {update,setEnabled};
}
