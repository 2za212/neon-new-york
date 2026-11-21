import * as T from 'three';

// Top to bottom in the 4 x 4 atlas. The first eight rooms also have a prop layer.
const slots=new Map(Object.entries({
  'display-records':0,'display-repair':1,'display-deli':2,'display-flowers':3,
  roomRecords:0,roomRepair:1,roomFood:2,roomFlowers:3,roomCloth:4,roomHome:5,roomStock:6,roomClinic:7,
  roomFabricStore:8,roomKitchen:9,roomLoading:10,roomSupplies:11,
  roomOffice:12,roomClass:13,roomBoard:14,roomLab:15,
  routeStudio:1,routeAtelier:4,routeHome:5,routeStock:6,routeBlinds:5
}));
const warmStreet=[2,4,0,5,2,6,3,4],coldStreet=[1,6,7,1,4,6,5,7];
const materialKeys=new WeakMap();
export function roomCode(key,x,y,z,width,height,depth){
  if(key&&typeof key==='object')key=materialKeys.get(key);
  const themed=slots.has(key),dim=key==='glass';
  if(!themed&&!dim&&key!=='warmWindow'&&key!=='coolWindow')return 0;
  const span=Math.max(width,depth);
  if(!themed&&(height<.53||span<.55||Math.min(width,depth)>.65))return 0;
  const seed=(Math.imul(Math.round(x*8),73856093)^Math.imul(Math.round(y*8),19349663)^Math.imul(Math.round(z*8),83492791))>>>0;
  const type=slots.get(key)??(dim?(y>4?5:12):y>5&&seed%3!==0?5:(key==='warmWindow'?warmStreet:coldStreet)[seed%8]);
  return 1+type+16*((seed>>>10)%8)+(dim?128:0);
}

export async function installInhabitedWindows(materials,renderer){
  async function atlas(file){
    if(typeof Image==='undefined')return new T.Texture();
    const texture=await new T.TextureLoader().loadAsync('./city-surfaces/'+file);
    texture.colorSpace=T.SRGBColorSpace;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    return texture;
  }
  const [back,props]=await Promise.all([atlas('inhabited-bays.jpg'),atlas('window-displays.png')]);
  back.name='Occupied interiors / 16 rooms';
  for(const key of ['warmWindow','coolWindow','glass',...slots.keys()]){
    if(materials[key])materialKeys.set(materials[key],key);
  }
  const m=new T.MeshStandardMaterial({map:back,emissive:0xfff2df,emissiveIntensity:.78,roughness:.47});
  m.name='Inhabited window / recessed rooms';m.userData.frontImage=true;m.userData.unitUV=true;
  m.userData.castShadow=false;m.userData.keepDistant=true;
  m.onBeforeCompile=shader=>{
    shader.uniforms.roomProps={value:props};
    shader.vertexShader='varying vec3 paneWorld; varying vec3 paneNormal;\n'+shader.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\npaneWorld=(modelMatrix*vec4(transformed,1.)).xyz; paneNormal=normalize(mat3(modelMatrix)*normal);');
    shader.fragmentShader=`varying vec3 paneWorld,paneNormal;
      uniform sampler2D roomProps;
      vec2 cellUv(vec2 cell,vec2 coord,float rows){return (cell+clamp(coord,.005,.995))/vec2(4.,rows);}
      \n`+shader.fragmentShader.replace('#include <map_fragment>',`
        float code=floor(vMapUv.x)-1.;
        vec3 roomLight=vec3(.022,.035,.039);
        if(code>=0.){
          float kind=mod(code,16.),variation=mod(floor(code/16.),8.);
          vec2 cell=vec2(mod(kind,4.),3.-floor(kind/4.));
          vec2 opening=fract(vMapUv);
          float aspect=max(.5,floor(vMapUv.y)*.25);
          float bays=max(1.,floor(aspect/2.1+.5));
          float bay=floor(opening.x*bays);
          opening.x=fract(opening.x*bays);
          variation=mod(variation+bay,8.);
          aspect/=bays;
          vec3 outward=normalize(paneNormal),right=vec3(outward.z,0.,-outward.x);
          vec3 eye=normalize(cameraPosition-paneWorld);
          vec2 slope=-vec2(dot(eye,right)/aspect,eye.y)/max(.08,dot(eye,outward));
          // Intersect the recessed room shell; at glancing angles the inner
          // reveal masks the back wall. Props sit on a closer depth plane.
          vec2 edge=vec2(slope.x>0.?1.:0.,slope.y>0.?1.:0.);
          vec2 limits=abs(edge-opening)/max(abs(slope),vec2(.0001));
          float depth=.48+.035*mod(variation,3.);
          float hit=min(depth,min(limits.x,limits.y));
          vec2 q=.5+(opening-.5+slope*hit)/(1.+.28*hit);
          float mirror=mod(variation,2.);
          if(mirror>.5)q.x=1.-q.x;
          q=.5+(q-.5)*(.89+.035*mod(variation,4.));
          q.y=.5+(q.y-.5)*clamp(1.4/aspect,.62,1.);
          vec3 rear=texture2D(map,cellUv(cell,q,4.)).rgb;
          float reveal=smoothstep(0.,.24,hit/depth);
          rear*=mix(.34,1.,reveal);
          vec2 nearUV=(opening-.5+slope*.13)/vec2(.94,.98)+.5;
          if(mirror>.5)nearUV.x=1.-nearUV.x;
          nearUV.y=.5+(nearUV.y-.5)*clamp(1.4/aspect,.62,1.);
          vec4 display=vec4(0.);
          if(kind<8.)display=texture2D(roomProps,cellUv(cell-vec2(0.,2.),nearUV,2.));
          float inside=step(0.,min(nearUV.x,nearUV.y))*step(max(nearUV.x,nearUV.y),1.);
          roomLight=mix(rear,display.rgb,display.a*inside*smoothstep(.09,.14,hit));
          float lit=.90+.07*mod(variation,4.);
          if(bays>1.)lit*=mix(.15,1.,smoothstep(.006,.027,min(opening.x,1.-opening.x)));
          if(code>=128.)lit*=.20;
          roomLight=roomLight*lit+vec3(.008,.016,.020)*pow(1.-max(dot(eye,outward),0.),2.);
        }
        diffuseColor.rgb*=roomLight*.46;
      `).replace('#include <emissivemap_fragment>','totalEmissiveRadiance*=roomLight;');
  };
  m.customProgramCacheKey=()=>'occupied-room-shell-v3';
  materials.occupiedRooms=m;
  // The core instancer keeps the real counter, shutter and supplies in front
  // of this rear wall. Derive a room address from each individual box.
  const alcove=m.clone(),compileRoom=m.onBeforeCompile;
  alcove.name='Service alcove / furnished back wall';alcove.emissiveIntensity=.43;
  alcove.onBeforeCompile=shader=>{
    compileRoom(shader);
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      vec3 centre=instanceMatrix[3].xyz;
      float seed=fract(sin(dot(centre,vec3(.47,.71,.33)))*8174.);
      float kind=seed<.28?12.:(seed<.62?11.:1.);
      vec3 extent=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
      float aspect=abs(normal.x)>.5?extent.z/extent.y:extent.x/extent.y;
      vMapUv=vec2(1.+kind+16.*floor(seed*8.),clamp(floor(aspect*4.+.5),2.,512.))+uv*.998+.001;`)
      .replace('(modelMatrix*vec4(transformed,1.)).xyz','(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz')
      .replace('mat3(modelMatrix)*normal','mat3(modelMatrix)*mat3(instanceMatrix)*normal');
  };
  alcove.customProgramCacheKey=()=>'occupied-instanced-alcove';
  materials.occupiedRecess=alcove;
  // The keys also resolve to neutral glazing on narrow frames and lamp strips.
  for(const key of slots.keys())if(!materials[key])materials[key]=materials.warmWindow;
  materials.equipmentGlass=materials.glass;
  materials.officeCurtain=curtainWall(back,false);
  materials.homeCurtain=curtainWall(back,true);
}

// A full-height tower side spans multiple storeys. The facade coordinates are
// in world metres, including the transforms of the core's instanced blocks.
function curtainWall(atlas,residential){
  const mat=new T.MeshStandardMaterial({map:atlas,color:0xffffff,roughness:.40,metalness:.23,
    emissive:0xc5d9e3,emissiveIntensity:.39});
  mat.name=residential?'Residential curtain / furnished floors':'Office curtain / furnished floors';
  mat.userData.frontImage=true;
  mat.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 floorWorld,floorNormal;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      floorWorld=cameraPosition+transpose(mat3(viewMatrix))*mvPosition.xyz;
      vec3 facadeNormal=normal;
      #ifdef USE_INSTANCING
        facadeNormal=mat3(instanceMatrix)*facadeNormal;
      #endif
      floorNormal=normalize(mat3(modelMatrix)*facadeNormal);`);
    shader.fragmentShader='varying vec3 floorWorld,floorNormal;\n'+shader.fragmentShader.replace('#include <map_fragment>',`
      vec3 N=normalize(floorNormal),room=vec3(.024,.041,.055);
      if(abs(N.y)<.65){
        vec2 right=normalize(vec2(N.z,-N.x));
        vec2 tiles=vec2(dot(floorWorld.xz,right)/3.65,floorWorld.y/3.20);
        vec2 bay=floor(tiles),front=fract(tiles),edge=min(front,1.-front);
        vec3 eye=normalize(cameraPosition-floorWorld);
        vec2 offset=vec2(dot(eye.xz,right),eye.y)*.27/max(.24,dot(eye,N));
        vec2 rear=front-offset;
        float seed=fract(sin(dot(mod(bay,197.),vec2(27.19,11.53)))*1734.58);
        float kind=${residential?'(seed>.65?9.:5.)':'(seed>.73?14.:12.)'};
        vec2 cell=vec2(mod(kind,4.),3.-floor(kind/4.));
        vec2 sampleUV=clamp(rear,.012,.988);
        if(seed<.5)sampleUV.x=1.-sampleUV.x;
        vec3 art=texture2D(map,(cell+sampleUV)/4.).rgb;
        vec2 reveal=smoothstep(vec2(-.13),vec2(.015),min(rear,1.-rear));
        float frame=smoothstep(.025,.048,edge.x)*smoothstep(.095,.15,edge.y);
        room=mix(room,art*mix(.10,.95,seed)*mix(.27,1.,reveal.x*reveal.y)+vec3(.012,.019,.025),frame);
      }
      diffuseColor.rgb*=room;
    `).replace('#include <emissivemap_fragment>','totalEmissiveRadiance*=room;');
  };
  mat.customProgramCacheKey=()=>'occupied-curtain-'+residential;
  return mat;
}
