import * as T from 'three';
import {unitDepth,unitTone} from './nyc-unit-bond.js';

// Repeating eight-cell courses. The same metre-based address continues across
// neighboring pieces, including street crossings and the three apartment floors.
const sheets=new Map(),installed=new WeakSet();
const courses={
  foldedAlloy:{pitch:.32},
  stone:{pitch:.32,run:2,stagger:1,joint:.12,spread:.22},
  setts:{pitch:.32,run:1,stagger:.5,joint:.095,spread:.24},
  roadbed:{pitch:.32,run:4,stagger:2,joint:.065,spread:.13},
  clay:{pitch:.16,run:2,stagger:1,joint:.13,spread:.25},
  timber:{pitch:.16,run:4,stagger:2,joint:.10,spread:.25},
  alloy:{pitch:.32,run:2,stagger:1,joint:.095,spread:.18},
  foliage:{pitch:.16,run:1,stagger:0,joint:.08,spread:.33},
  glass:{pitch:.64,run:1,stagger:0,joint:.065,spread:.13},
  interior:{pitch:.16,run:2,stagger:1,joint:.11,spread:.18},
};
export function blockFamily(material){
  // Manufactured shells carry their own interlocking panel and gasket map.
  if(material.userData.assemblyUV||material.userData.signalLens)return null;
  const name=material.name||'';
  if(/road paint|traffic yellow/i.test(name)||material.isShaderMaterial||material.transparent||material.userData.frontImage||material.userData.roomAtlas||
    /display|poster|record sleeve|routeHome|routeStudio|routeShop|routeWork|inhabited|interior windows|routeWindow|letter|painted line|puddle|water surface|shallowwater|lamp|signal|neon|lantern|diffuser|opal|emitter|LED|light strip|road marking/i.test(name))return null;
  if(/water(?!tank)|reflection|lamp|bulb/i.test(name)&&!/waterfront|waterway|wetland|water tank/i.test(name))return null;
  if(/leaf|leaves|canopyshade|canopylight|grass|foliage|soil|planting|moss/i.test(name))return 'foliage';
  if(/asphalt|roadbed/i.test(name))return 'roadbed';
  if(/pav|sett|cobble|bluestone|kerb|curb|granite|ballast|slab/i.test(name))return 'setts';
  if(/brick|clay|mortar|terra.?cotta/i.test(name))return 'clay';
  if(/timber|wood|plank|cedar|oak|bark|plywood|boardwalk/i.test(name))return 'timber';
  if(/glass|curtain|glaz|window/i.test(name))return 'glass';
  if(/concrete|limestone|stone|trim|plaster|bedrock|bank|rock/i.test(name))return 'stone';
  if(material.emissive&&(material.emissive.r+material.emissive.g+material.emissive.b)*material.emissiveIntensity>1.1)return null;
  return 'alloy';
}
function stamp(x,y){
  let h=Math.imul(x+41,1597334677)^Math.imul(y+97,3812015801);
  h=Math.imul(h^(h>>>16),2246822519);return (h>>>0)/4294967296;
}
// A folded metal skin uses tall replaceable cassettes. A tongue on one
// cassette fits into the next; their vertical seams continue through the face.
function foldedPanel(x,y){
  const column=(x&255)>>6;
  const socket=((x&63)<16?16:0);
  const row=(((y+column*32+socket)&255)>>7);
  return column*2+row;
}
function sheet(kind){
  if(sheets.has(kind))return sheets.get(kind);
  const preset=courses[kind],size=256,cell=size/16,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    if(kind==='foldedAlloy'){
      const panel=foldedPanel(x,y);
      const joint=foldedPanel(x-2,y)!==panel||foldedPanel(x,y-2)!==panel;
      const lip=foldedPanel(x+2,y)!==panel||foldedPanel(x,y+2)!==panel;
      const socket=(x&63)>44&&(x&63)<51&&((y+((x&255)>>6)*32)&127)<9;
      const grain=stamp(x>>4,y>>4);
      const col=x>>4,row=y>>4;
      const depth=unitDepth(col,row,1);
      const seat=(x&15)<2&&unitDepth(col-1,row,1)>depth||(y&15)<2&&unitDepth(col,row-1,1)>depth;
      const face=.78*unitTone(col,row,1)+(panel%3-1)*.012+(grain-.5)*.019;
      const channel=Math.round(255*(joint?.64:socket?.64:face*(seat?.80:1)+(lip?.048:0)));
      const i=(y*size+x)*4;
      data[i]=data[i+1]=data[i+2]=channel;data[i+3]=255;
      continue;
    }
    const row=Math.floor(y/cell),shift=(row%2)*preset.stagger*cell;
    const px=(x+shift)%size,block=Math.floor(px/(cell*preset.run));
    const u=(px%(cell*preset.run))/cell,v=(y%cell)/cell;
    const noise=stamp(block,row),light=stamp((block+3)%16,row);
    const wrap=preset.run-u;
    let value=.78+(noise-.5)*preset.spread;
    // Face, shoulder and recessed joint are distinct bands, kept wide enough
    // to survive a phone mip. Selected adjacent units share a dressed face.
    const rim=preset.joint,side=.13+(light>.65?.07:0);
    if(u<rim*.55||v<rim*.55)value*=kind==='setts'?.70:.58;
    else if(v<side||wrap<side*.65)value*=kind==='setts'?.82:.74;
    else if(1-v<rim||u<rim)value+=.14;
    if(kind==='foliage'&&Math.floor(u*4)+Math.floor(v*4)<3)value+=.09;
    if(kind==='alloy'&&u<.27&&v>.68&&v<.87)value*=.79;
    if(kind==='timber')value+=(Math.floor(v*8)%3===0?.035:0);
    if(kind==='stone'||kind==='clay'||kind==='foliage'||kind==='interior'){
      const cellSize=kind==='clay'||kind==='interior'?32:16;
      value*=unitTone(Math.floor(x/cellSize),Math.floor(y/cellSize),kind==='foliage'?2:0);
    }
    const i=(y*size+x)*4;
    data[i]=Math.min(255,Math.round((value+(noise-.5)*.027)*255));
    data[i+1]=Math.min(255,Math.round(value*255));data[i+2]=Math.min(255,Math.round((value-(noise-.5)*.025)*255));data[i+3]=255;
  }
  const map=new T.DataTexture(data,size,size);map.name='Fulton courses / '+kind;
  map.wrapS=map.wrapT=T.RepeatWrapping;map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;sheets.set(kind,map);return map;
}
export function applyBlockFinish(mat,kind=blockFamily(mat)){
  if(!kind||installed.has(mat)||!mat.isMaterial||mat.userData.worldUnitsUV||mat.userData.voxelSurfaceBaked)return;
  installed.add(mat);
  const moving=mat.userData.coursesFollowRig===true;
  const finish=kind==='alloy'&&!moving?'foldedAlloy':kind;
  const compile=mat.onBeforeCompile,key=mat.customProgramCacheKey(),tile=sheet(finish);
  mat.customProgramCacheKey=()=>key+'/solid-courses/'+kind+'/'+moving;
  mat.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);
    shader.uniforms.blockCourse={value:tile};
    shader.vertexShader='varying vec2 vCourseUV;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      vec4 courseP=vec4(transformed,1.0); vec3 courseN=normal;
      #ifdef USE_INSTANCING
      courseP=instanceMatrix*courseP; courseN=mat3(instanceMatrix)*courseN;
      #endif
      courseP=modelMatrix*courseP;
      ${moving?'courseP.xyz-=modelMatrix[3].xyz;':''}
      courseN=abs(mat3(modelMatrix)*courseN);
      vCourseUV=(courseN.y>max(courseN.x,courseN.z)?courseP.xz:
                (courseN.x>courseN.z?courseP.zy:courseP.xy))*${1/(16*courses[finish].pitch)};
    `);
    shader.fragmentShader='varying vec2 vCourseUV;uniform sampler2D blockCourse;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`vec3 course=texture2D(blockCourse,vCourseUV).rgb;
      outgoingLight*=mix(vec3(1.),(course-.76)*2.05+1.,${kind==='roadbed'?'.31':kind==='glass'||mat.isMeshBasicMaterial?'.66':'1.'});
      #include <opaque_fragment>`);
  };
  mat.needsUpdate=true;
}

