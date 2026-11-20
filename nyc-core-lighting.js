import * as T from 'three';

// Bake the soft spill from inhabited windows once in world metres. Even when
// a shop is outside the mobile point-light budget its pavement stays attached
// to its windows. Alpha stores skylight occlusion at the foot of the building.
export function lightCoreStreets(scene,buildings){
  const step=.5,left=-88,north=-408,width=536,height=464;
  const bytes=new Uint8Array(width*height*4);
  for(let i=3;i<bytes.length;i+=4)bytes[i]=255;
  const punctual=[];
  for(const [index,b] of buildings.entries()){
    const radius=Math.ceil(Math.hypot(b.w,b.d)*.5+21);
    const x0=Math.max(0,Math.floor((b.x-radius-left)/step)),x1=Math.min(width,Math.ceil((b.x+radius-left)/step));
    const z0=Math.max(0,Math.floor((b.z-radius-north)/step)),z1=Math.min(height,Math.ceil((b.z+radius-north)/step));
    const halfW=b.w*.5,halfD=b.d*.5,home=b.style==='residence'||b.style==='works';
    const bays=Math.max(2,Math.round(b.w/3.52)),pitch=b.w/bays;
    for(let iz=z0;iz<z1;iz++)for(let ix=x0;ix<x1;ix++){
      const dx=left+(ix+.5)*step-b.x,dz=north+(iz+.5)*step-b.z;
      const u=dx*b.c-dz*b.s,v=dx*b.s+dz*b.c;
      const fromWall=Math.hypot(Math.max(0,Math.abs(u)-halfW),Math.max(0,Math.abs(v)-halfD));
      const k=4*(iz*width+ix);
      bytes[k+3]=Math.min(bytes[k+3],Math.round(255*(.40+.60*T.MathUtils.smoothstep(fromWall,0,3.2))));
      const distance=v-halfD;
      // Faint, diffuse light from the frontage extends beyond the sill pool.
      if(distance>=0&&distance<21){
        const side=Math.max(0,Math.abs(u)-halfW);
        const bounce=Math.exp(-distance*.095-side*.32)*(1-T.MathUtils.smoothstep(distance,16,21));
        const reflected=home?[61,39,27]:[36,55,68];
        for(let ch=0;ch<3;ch++)bytes[k+ch]=Math.max(bytes[k+ch],Math.round(reflected[ch]*bounce));
      }
      if(distance<-.20||distance>8||Math.abs(u)>halfW+1.8)continue;
      const pos=(u+halfW)/pitch,bay=Math.max(0,Math.min(bays-1,Math.floor(pos)));
      const warm=home?(bay+index)%4!==0:(bay+index)%6===1;
      // Mullion shadows soften as the pools spread away from the reveal.
      const fromPier=Math.abs(pos-Math.round(pos))*pitch;
      const gap=.27+.73*T.MathUtils.smoothstep(fromPier,.06,.82+distance*.09);
      const fade=(1-T.MathUtils.smoothstep(distance,.2,warm?6.7:8))*
        (1-T.MathUtils.smoothstep(Math.abs(u)-halfW,0,1.8))*gap;
      const rgb=warm?[210,90,31]:[92,162,177];
      for(let ch=0;ch<3;ch++)bytes[k+ch]=Math.max(bytes[k+ch],Math.round(rgb[ch]*fade));
    }
    if(b.style==='headquarters')continue;
    // Aim the spill across one reveal, off centre: the jamb has a lit side
    // and a dark side even when the observer stands square to the window.
    const u=-halfW+pitch*(.71+(index%Math.min(bays,3)));
    const v=halfD+1.78;
    const lamp=new T.PointLight(home?0xffb074:0xc0e8fa,home?68:75,10,2);
    lamp.position.set(b.x+b.c*u+b.s*v,3.84,b.z-b.s*u+b.c*v);
    lamp.userData.nightPower=lamp.intensity;scene.add(lamp);punctual.push(lamp);
  }
  // The station halls are open structures, outside the building parcel list.
  // Project their clerestories through the actual ticket-bay spacing. A
  // broad wash starts at each threshold and the mullion shadows soften on
  // the walk; it remains visible across the junction on the low preset.
  for(const hall of [
    {x:48,z:-257,angle:-.25,front:-2.56,pitch:2.88,mid:-.64,bays:5},
    {x:102,z:-224,angle:-Math.atan2(50,188),front:-1.98,pitch:3.52,mid:0,bays:7}
  ]){
    const c=Math.cos(hall.angle),s=Math.sin(hall.angle),half=hall.pitch*hall.bays*.5;
    const span=Math.ceil(half+20);
    const x0=Math.max(0,Math.floor((hall.x-span-left)/step)),x1=Math.min(width,Math.ceil((hall.x+span-left)/step));
    const z0=Math.max(0,Math.floor((hall.z-span-north)/step)),z1=Math.min(height,Math.ceil((hall.z+span-north)/step));
    for(let iz=z0;iz<z1;iz++)for(let ix=x0;ix<x1;ix++){
      const dx=left+(ix+.5)*step-hall.x,dz=north+(iz+.5)*step-hall.z;
      const u=dx*c-dz*s-hall.mid,v=dx*s+dz*c-hall.front;
      if(v<0||v>18)continue;
      const spread=.8+.29*v,side=1-T.MathUtils.smoothstep(Math.abs(u)-half,0,spread);
      const reach=1-T.MathUtils.smoothstep(v,1.5,18);
      const bay=(u+half)/(hall.pitch*(1+.014*v));
      const jamb=Math.abs(bay-Math.round(bay))*hall.pitch;
      const shadow=.42+.58*T.MathUtils.smoothstep(jamb,.08,.35+.053*v);
      const gain=reach*side*shadow;
      const k=(iz*width+ix)*4;
      bytes[k]=Math.max(bytes[k],Math.round(150*gain));
      bytes[k+1]=Math.max(bytes[k+1],Math.round(223*gain));
      bytes[k+2]=Math.max(bytes[k+2],Math.round(247*gain));
    }
  }
  const atlas=new T.DataTexture(bytes,width,height,T.RGBAFormat);
  atlas.minFilter=atlas.magFilter=T.LinearFilter;atlas.needsUpdate=true;
  const amount={value:1},variants=new Map();
  scene.traverse(mesh=>{
    if(mesh.name!=='核心区 / 地面与路缘')return;
    const original=mesh.material;
    if(!variants.has(original)){
      const mat=original.userData.corePaving?original:original.clone();
      const compile=original.onBeforeCompile,key=original.customProgramCacheKey();
      mat.onBeforeCompile=function(shader,renderer){
        compile.call(this,shader,renderer);
        shader.uniforms.uCoreGround={value:atlas};shader.uniforms.uCoreNight=amount;
        shader.vertexShader='varying vec2 vCoreGround;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
          vec4 coreP=vec4(transformed,1.);
          #ifdef USE_INSTANCING
          coreP=instanceMatrix*coreP;
          #endif
          vCoreGround=((modelMatrix*coreP).xz-vec2(-88.,-408.))/vec2(268.,232.);`);
        shader.fragmentShader='varying vec2 vCoreGround; uniform sampler2D uCoreGround; uniform float uCoreNight;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',`
          vec4 streetGlow=texture2D(uCoreGround,vCoreGround);
          outgoingLight*=mix(.56,1.,streetGlow.a);
          vec3 roughTint=sqrt(max(diffuseColor.rgb,vec3(0.)));
          ${original.userData.citySurfaceBounce?'':'outgoingLight+=roughTint*vec3(.029,.034,.043)*streetGlow.a;'}
          float gateBlend=smoothstep(0.,8.,228.-vCoreGround.y*232.);
          outgoingLight+=(diffuseColor.rgb*.48+roughTint*.19)*streetGlow.rgb*uCoreNight*gateBlend;
          #include <opaque_fragment>`);
      };
      mat.customProgramCacheKey=()=>key+'/core-window-spill-1';variants.set(original,mat);
    }
    mesh.material=variants.get(original);
  });
  return {setNight(night){
    amount.value=night?1:.30;
    for(const lamp of punctual)lamp.intensity=lamp.userData.nightPower*(night?1:.28);
  }};
}
