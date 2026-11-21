import * as T from 'three';

// First-hit reflection rays traverse the same fixed grid from any camera.
// Alpha marks occupied cells; RGB is radiance from an actual light fixture.
const traceGLSL=`
  uniform highp sampler3D rtGrid;
  uniform vec3 rtOrigin;
  uniform float rtPitch;
  uniform int rtSteps;
  vec3 traceLight(vec3 p,vec3 direction){
    if(rtSteps==0)return vec3(0.);
    vec3 start=(p-rtOrigin)/rtPitch;
    ivec3 cell=ivec3(floor(start)),size=textureSize(rtGrid,0);
    ivec3 stepDir=ivec3(sign(direction));
    vec3 stride=1./max(abs(direction),vec3(.00001));
    vec3 boundary=mix(fract(start),1.-fract(start),step(vec3(0.),direction))*stride;
    for(int i=0;i<80;i++){
      if(i>=rtSteps)break;
      float travel=min(min(boundary.x,boundary.y),boundary.z);
      bvec3 crossed=lessThanEqual(boundary,vec3(travel+.00001));
      cell+=ivec3(crossed)*stepDir;
      boundary+=vec3(crossed)*stride;
      if(any(lessThan(cell,ivec3(0)))||any(greaterThanEqual(cell,size)))break;
      vec4 hit=texelFetch(rtGrid,cell,0);
      if(hit.a>.5){
        if(max(hit.r,max(hit.g,hit.b))==0.)break;
        // Occupancy stays sharp. Filter the radiance across the struck face
        // so metre-wide street cells do not paint a staircase of hard lights.
        vec3 contact=mix(start+travel*direction,vec3(cell)+.5,crossed);
        vec3 glow=texture(rtGrid,contact/vec3(size)).rgb;
        return glow*(1.-smoothstep(.65,1.,float(i)/float(rtSteps)))/(1.+.005*rtPitch*travel);
      }
    }
    return vec3(0.);
  }`;

export function reflectionSettings(){
  let enabled=true;
  try{enabled=localStorage.getItem('nyc-voxel-reflections')!=='off';}catch{}
  let limit=48;
  const steps={value:enabled?limit:0};
  return {steps,get enabled(){return enabled;},
    setEnabled(value){enabled=value;steps.value=enabled?limit:0;
      try{localStorage.setItem('nyc-voxel-reflections',enabled?'on':'off');}catch{}},
    setQuality(level){limit=level==='low'?30:level==='high'?80:48;steps.value=enabled?limit:0;}
  };
}

export function reflectionGrid(bounds,pitch,maxDimension,settings){
  const span=bounds.getSize(new T.Vector3()),origin=bounds.min.clone();
  pitch=Math.max(pitch,span.x/maxDimension,span.y/maxDimension,span.z/maxDimension);
  const nx=Math.ceil(span.x/pitch),ny=Math.ceil(span.y/pitch),nz=Math.ceil(span.z/pitch);
  const data=new Uint8Array(nx*ny*nz*4),color=new T.Color();
  const texture=new T.Data3DTexture(data,nx,ny,nz);
  texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
  const uniforms={rtGrid:{value:texture},rtOrigin:{value:origin},rtPitch:{value:pitch},rtSteps:settings.steps};
  function box(x,y,z,w,h,d,glow=null,yaw=0){
    const c=Math.cos(yaw),s=Math.sin(yaw),emits=glow!==null;
    const pad=emits?pitch*.48:0,hw=w/2+pad,hd=d/2+pad,hh=h/2+pad;
    const hx=Math.abs(c)*hw+Math.abs(s)*hd,hz=Math.abs(s)*hw+Math.abs(c)*hd;
    const first=(v,o)=>Math.max(0,Math.ceil((v-o)/pitch-.5));
    const last=(v,o,n)=>Math.min(n-1,Math.floor((v-o)/pitch-.5));
    const x0=first(x-hx,origin.x),x1=last(x+hx,origin.x,nx);
    const y0=first(y-hh,origin.y),y1=last(y+hh,origin.y,ny);
    const z0=first(z-hz,origin.z),z1=last(z+hz,origin.z,nz);
    if(x1<x0||y1<y0||z1<z0)return;
    if(emits)color.set(glow);
    const strength=emits?Math.min(1,Math.max(.16,(Math.max(w,d)*h)/(pitch*pitch))):0;
    for(let k=z0;k<=z1;k++)for(let i=x0;i<=x1;i++){
      const dx=origin.x+(i+.5)*pitch-x,dz=origin.z+(k+.5)*pitch-z;
      if(Math.abs(c*dx-s*dz)>hw||Math.abs(s*dx+c*dz)>hd)continue;
      for(let j=y0;j<=y1;j++){
        const at=4*(i+nx*(j+ny*k));
        data[at+3]=255;
        if(emits){data[at]=color.r*255*strength;data[at+1]=color.g*255*strength;data[at+2]=color.b*255*strength;}
      }
    }
  }
  function blockers(solids){
    for(const {min,max} of solids)box((min.x+max.x)/2,(min.y+max.y)/2,(min.z+max.z)/2,
      max.x-min.x,max.y-min.y,max.z-min.z);
  }
  function bind(shader){
    Object.assign(shader.uniforms,uniforms);
    shader.fragmentShader=traceGLSL+'\n'+shader.fragmentShader;
  }
  // MeshBasic receivers in 3B have baked illumination. World-space face
  // derivatives work for those as well as instanced wet road materials.
  function surface(material,amount){
    const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
    material.onBeforeCompile=function(shader,renderer){
      previous.call(this,shader,renderer);
      bind(shader);
      shader.vertexShader='varying vec3 rtWorld;\n'+shader.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\nrtWorld=cameraPosition+transpose(mat3(viewMatrix))*mvPosition.xyz;');
      shader.fragmentShader='varying vec3 rtWorld;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',`
        vec3 rtNormal=normalize(cross(dFdx(rtWorld),dFdy(rtWorld)));
        float rtAmount=(${amount})*smoothstep(.78,.96,rtNormal.y);
        if(rtSteps>0 && rtAmount>.008 && distance(cameraPosition,rtWorld)<55.){
          vec3 incident=normalize(rtWorld-cameraPosition);
          vec3 reflected=traceLight(rtWorld+rtNormal*.035,reflect(incident,rtNormal));
          outgoingLight+=reflected*rtAmount*(.18+.82*pow(1.-max(dot(-incident,rtNormal),0.),2.));
        }
        #include <opaque_fragment>`);
    };
    material.customProgramCacheKey=()=>key+'/voxel-ray/'+amount;material.needsUpdate=true;
  }
  return {box,blockers,surface,bind};
}

export function cityReflectionGrid(world,maxDimension,settings){
  const b=world.bounds;
  const grid=reflectionGrid(new T.Box3(new T.Vector3(b.minX-12,-10,b.minZ-12),new T.Vector3(b.maxX+12,46,b.maxZ+12)),1.8,maxDimension,settings);
  grid.blockers(world.colliders);
  for(const pane of world.reflectionPanes)grid.box(...pane);
  for(const s of world.streetAds.sites)grid.box(s.x,s.y,s.z,s.width,s.height,.12,s.glow,s.yaw);
  for(const s of world.streetPower.sources)grid.box(s.x,s.y,s.z,.42,.48,.42,s.glow);
  return grid;
}
