import * as T from 'three';
import {denseVoxelPhysics} from './dense-voxel-physics.js';

const corners=[
 [0,0,1,0,1,1,0,1,0,0,0,0],[1,0,0,1,1,0,1,1,1,1,0,1],
 [0,0,1,0,0,0,1,0,0,1,0,1],[0,1,0,0,1,1,1,1,1,1,1,0],
 [0,0,0,0,1,0,1,1,0,1,0,0],[1,0,1,1,1,1,0,1,1,0,0,1]
];
const normals=[[-127,0,0],[127,0,0],[0,-127,0],[0,127,0],[0,0,-127],[0,0,127]];
function variation(x,y,z){let h=Math.imul(x+41,73856093)^Math.imul(y+17,19349663)^Math.imul(z+29,83492791);h=Math.imul(h^(h>>>13),1274126177);return h>>>0&255;}

export async function loadDenseVoxelCity(scene,base){
 const meta=await (await fetch('dense-model.json',{cache:'no-store'})).json();
 const [cellsBuffer,collision]=await Promise.all(['dense-cells.bin','dense-collision.bin'].map(async name=>{
  const r=await fetch(name+'?version='+meta.version);if(!r.ok)throw Error('细体素资源未载入 '+name);return r.arrayBuffer();
 }));
 const bytes=new Uint8Array(cellsBuffer),data=new DataView(cellsBuffer),material=base.material;
 const groups=[],matrix=new T.Matrix4(),color=new T.Color();
 const {step}=meta;
 const cubeGap=0;
 const sharedCube=new T.BoxGeometry(step-cubeGap,step-cubeGap,step-cubeGap);
 const white=new Uint8Array(sharedCube.attributes.position.count*3).fill(255);
 sharedCube.setAttribute('color',new T.BufferAttribute(white,3,true));
 function tintIndex(tile,cell){return tile.cellOffset+cell*12;}
 function hashFor(tile,x,y,z){return variation(Math.round(tile.origin[0]/step)+x,Math.round(tile.origin[1]/step)+y,Math.round(tile.origin[2]/step)+z);}
 function farGeometry(tile){
  const count=tile.faceCount,positions=new Uint16Array(count*12),ns=new Int8Array(count*12),colors=new Uint8Array(count*12),surface=new Uint8Array(count*16),indices=new Uint32Array(count*6);
  let faceCursor=0;
  for(let i=0;i<tile.count;i++){
   const at=tintIndex(tile,i),x=data.getUint16(at,true),y=data.getUint16(at+2,true),z=data.getUint16(at+4,true),mask=bytes[at+7],hash=hashFor(tile,x,y,z);
   for(let f=0;f<6;f++)if(mask&(1<<f)){
    const vertex=faceCursor*4,c=corners[f],normal=normals[f];
    for(let v=0;v<4;v++){
     const p=(vertex+v)*3,s=(vertex+v)*4;
     positions[p]=2*(x+c[v*3]);positions[p+1]=2*(y+c[v*3+1]);positions[p+2]=2*(z+c[v*3+2]);
     ns.set(normal,p);colors[p]=bytes[at+8];colors[p+1]=bytes[at+9];colors[p+2]=bytes[at+10];
     surface[s]=bytes[at+6];surface[s+1]=bytes[at+11];surface[s+2]=hash;surface[s+3]=4;
    }
    indices.set([vertex,vertex+1,vertex+2,vertex,vertex+2,vertex+3],faceCursor*6);faceCursor++;
   }
  }
  if(faceCursor!==count)throw Error('细体素外露面数量不一致');
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('normal',new T.BufferAttribute(ns,3,true));g.setAttribute('color',new T.BufferAttribute(colors,3,true));g.setAttribute('surface',new T.BufferAttribute(surface,4));g.setIndex(new T.BufferAttribute(indices,1));g.computeBoundingBox();g.computeBoundingSphere();return g;
 }
 function nearMesh(tile){
  const g=sharedCube.clone(),surfaces=new Uint8Array(tile.count*4);
  const mesh=new T.InstancedMesh(g,material,tile.count);
  for(let i=0;i<tile.count;i++){
   const at=tintIndex(tile,i),x=data.getUint16(at,true),y=data.getUint16(at+2,true),z=data.getUint16(at+4,true);
   matrix.makeTranslation(tile.origin[0]+(x+.5)*step,tile.origin[1]+(y+.5)*step,tile.origin[2]+(z+.5)*step);mesh.setMatrixAt(i,matrix);
   color.setRGB(bytes[at+8]/255,bytes[at+9]/255,bytes[at+10]/255);mesh.setColorAt(i,color);
   surfaces.set([bytes[at+6],bytes[at+11],hashFor(tile,x,y,z),4],i*4);
  }
  g.setAttribute('surface',new T.InstancedBufferAttribute(surfaces,4));mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='Dense solid cubes '+tile.key;mesh.computeBoundingBox();mesh.computeBoundingSphere();return mesh;
 }
 for(const tile of meta.tiles){
  // Surface records are sorted by Y. Six-metre slices keep a street camera
  // from paying for a whole tower's solid-cube detail at once.
  let start=0;
  while(start<tile.count){
   const y=data.getUint16(tintIndex(tile,start)+2,true),slice=Math.floor(y*step/6);
   let end=start,faceCount=0;
   while(end<tile.count&&Math.floor(data.getUint16(tintIndex(tile,end)+2,true)*step/6)===slice){
    const mask=bytes[tintIndex(tile,end)+7];for(let bit=1;bit<=32;bit*=2)if(mask&bit)faceCount++;end++;
   }
   const renderTile={...tile,key:tile.key+'/'+slice,cellOffset:tile.cellOffset+start*12,count:end-start,faceCount};
   const mesh=new T.Mesh(farGeometry(renderTile),material);mesh.scale.setScalar(step/2);mesh.position.fromArray(tile.origin);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='Dense exterior '+renderTile.key;
   scene.add(mesh);const bounds=new T.Box3().setFromObject(mesh);
   groups.push({tile:renderTile,far:mesh,near:null,bounds,close:false});start=end;
  }
 }
 let visibleCubes=0;
 const nearest=new T.Vector3();
 function updateLOD(camera){
  visibleCubes=0;
  for(const g of groups){
   g.bounds.clampPoint(camera.position,nearest);
   const radius=g.close?12:10;
   // Touching solid voxels have exactly the same visible union as the exposed
   // faces. Avoid drawing their hidden internal faces when no gap is requested.
   const close=cubeGap>0&&camera.position.distanceToSquared(nearest)<radius*radius;
   if(close&&!g.near){g.near=nearMesh(g.tile);scene.add(g.near);}
   g.far.visible=!close;if(g.near)g.near.visible=close;g.close=close;
   if(close)visibleCubes+=g.tile.count;
  }
  scene.userData.denseVisibleCubes=visibleCubes;
 }
 return {physics:denseVoxelPhysics(meta,collision,base),updateLOD,stats:{step:meta.step,sourceParts:meta.sourceParts,surfaceCells:meta.surfaceCells,solidVoxels:meta.solidVoxels,farTriangles:meta.exposedFaces*2,tiles:groups.length}};
}
