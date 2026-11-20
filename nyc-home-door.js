import * as T from 'three';
import {applyBlockFinish} from './nyc-block-finish.js';

// The existing atlas bakes the sliding hatch into StationFittings. These are
// the four moving boxes in room metres: panel, window rim, glass and handle.
const leafBoxes=[
  [4.55,.02,2.89,4.75,2.26,3.97],
  [4.50,1.48,3.15,4.56,1.86,3.71],
  [4.475,1.53,3.205,4.505,1.81,3.655],
  [4.43,.875,3.733,4.51,1.225,3.787],
];
const tolerance=.001;

function onBoxFace(points,box){
  const coord=(point,axis)=>point.getComponent(axis);
  if(!points.every(point=>[0,1,2].every(axis=>
    coord(point,axis)>=box[axis]-tolerance&&coord(point,axis)<=box[axis+3]+tolerance)))return false;
  return box.some((edge,i)=>points.every(point=>Math.abs(coord(point,i%3)-edge)<tolerance));
}

function indexedSubset(source,indices){
  const geometry=new T.BufferGeometry();
  for(const [name,attribute] of Object.entries(source.attributes))geometry.setAttribute(name,attribute);
  geometry.setIndex(indices);
  return geometry;
}

export function extractHomeDoor(home){
  const fittings=home.getObjectByName('StationFittings');
  if(!fittings)return null;
  const fromWorld=home.matrixWorld.clone().invert();
  const points=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
  const parts=[];
  const faceCounts=leafBoxes.map(()=>0);
  fittings.traverse(mesh=>{
    if(!mesh.isMesh||!mesh.geometry.index)return;
    const source=mesh.geometry,{index}=source;
    const transform=fromWorld.clone().multiply(mesh.matrixWorld);
    const moving=[],fixed=[];
    for(let i=0;i<index.count;i+=3){
      const triangle=[index.getX(i),index.getX(i+1),index.getX(i+2)];
      points.forEach((point,k)=>point.fromBufferAttribute(source.attributes.position,triangle[k]).applyMatrix4(transform));
      const box=leafBoxes.findIndex(bounds=>onBoxFace(points,bounds));
      if(box>=0){faceCounts[box]++;moving.push(...triangle);}
      else fixed.push(...triangle);
    }
    if(moving.length)parts.push({mesh,source,moving,fixed});
  });
  // Leave unfamiliar bakes intact rather than pulling surrounding trim away.
  if(faceCounts.some(count=>count!==12))return null;

  const leaves=parts.map(({mesh,source,moving,fixed})=>{
    mesh.geometry=indexedSubset(source,fixed);
    const leaf=mesh.clone(false);
    leaf.name='Fulton 3B sliding door';
    leaf.geometry=indexedSubset(source,moving);
    mesh.parent.add(leaf);
    return leaf;
  });
  const base=leaves.map(leaf=>leaf.position.clone());
  const offset=new T.Vector3(0,0,-1.12);
  const reveal={value:false};
  const vestibule=new T.Group();
  vestibule.visible=false;
  return {
    setOpen(progress){
      vestibule.visible=reveal.value=progress>0;
      leaves.forEach((leaf,i)=>leaf.position.copy(base[i]).addScaledVector(offset,progress));
    },
    mountReveal(room){
      // The baked room has a solid backing behind the hatch. Cut the opening
      // only during the transition, preserving the adjacent walls and trim.
      for(const name of ['StationShell','StationFittings']){
        home.getObjectByName(name)?.traverse(mesh=>{
          if(!mesh.isMesh||leaves.includes(mesh))return;
          const toRoom=fromWorld.clone().multiply(mesh.matrixWorld);
          const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
          for(const material of materials){
            const before=material.onBeforeCompile,key=material.customProgramCacheKey();
            material.customProgramCacheKey=()=>key+'/fulton-doorway';
            material.onBeforeCompile=function(shader,renderer){
              before.call(this,shader,renderer);
              shader.uniforms.fultonDoorOpen=reveal;
              shader.uniforms.fultonRoomFromMesh={value:toRoom};
              shader.vertexShader='uniform mat4 fultonRoomFromMesh; varying vec3 vFultonRoom;\n'+shader.vertexShader;
              shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
                '#include <begin_vertex>\nvFultonRoom=(fultonRoomFromMesh*vec4(position,1.)).xyz;');
              shader.fragmentShader='uniform bool fultonDoorOpen; varying vec3 vFultonRoom;\n'+shader.fragmentShader;
              shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
                'if(fultonDoorOpen && vFultonRoom.x>4.14 && vFultonRoom.y>.005 && vFultonRoom.y<2.26 && vFultonRoom.z>2.90 && vFultonRoom.z<3.95) discard;\n#include <opaque_fragment>');
            };
            material.needsUpdate=true;
          }
        });
      }

      const stone=new T.MeshBasicMaterial({color:0x505254});
      const plaster=new T.MeshBasicMaterial({color:0x776c59});
      const trim=new T.MeshBasicMaterial({color:0x253739});
      const lamp=new T.MeshBasicMaterial({color:0xffd296});
      applyBlockFinish(stone,'setts');
      applyBlockFinish(plaster,'interior');
      const box=(material,x,y,z,width,height,depth)=>{
        const mesh=new T.Mesh(new T.BoxGeometry(width,height,depth),material);
        mesh.position.set(x,y,z);vestibule.add(mesh);
      };
      box(stone,5.5,-.07,3.425,2.55,.14,2.4);
      box(trim,4.74,1.13,2.85,.85,2.26,.1);
      box(trim,4.74,1.13,4,.85,2.26,.1);
      box(trim,4.74,2.30,3.425,.85,.08,1.25);
      box(plaster,6.78,1.42,3.425,.15,2.84,2.4);
      box(trim,6.68,.53,3.425,.12,1.06,2.4);
      box(plaster,5.5,2.81,3.425,2.55,.1,2.4);
      box(lamp,5.78,2.72,3.425,.75,.06,.22);
      room.add(vestibule);
    },
  };
}
