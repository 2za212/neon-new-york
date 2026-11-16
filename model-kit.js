import {createCityMaterial} from './city-materials.js';
import * as T from 'three';
import {voxelPhysics} from './voxel-physics.js';

export async function loadVoxelModel(scene){
 const response=await fetch('voxel-model.json',{cache:'no-store'});
 if(!response.ok)throw Error('无法读取体素模型');
 const meta=await response.json();
 async function binary(file){
   const r=await fetch(file+'?grid='+meta.step+'&skin='+meta.appearanceVersion);
   if(!r.ok)throw Error('无法读取 '+file);
   return r.arrayBuffer();
 }
 const [meshBuffer,collisionBuffer]=await Promise.all([binary(meta.mesh.file),binary(meta.collision.file)]);
 const material=await createCityMaterial();
 const scale=meta.mesh.scale??meta.step/2;
 let vertexCount=0,indexCount=0;
 for(const chunk of meta.mesh.chunks){
   const vertices=chunk.vertexCount,indices=chunk.indexCount,offset=chunk.byteOffset;
   const geometry=new T.BufferGeometry();
   geometry.setAttribute('position',new T.BufferAttribute(new Uint16Array(meshBuffer,offset,vertices*3),3));
   geometry.setAttribute('normal',new T.BufferAttribute(new Int8Array(meshBuffer,offset+vertices*6,vertices*3),3,true));
   geometry.setAttribute('color',new T.BufferAttribute(new Uint8Array(meshBuffer,offset+vertices*9,vertices*3),3,true));
   geometry.setAttribute('surface',new T.BufferAttribute(new Uint8Array(meshBuffer,offset+vertices*12,vertices*4),4));
   geometry.setIndex(new T.BufferAttribute(new Uint32Array(meshBuffer,offset+vertices*16,indices),1));
   geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const mesh=new T.Mesh(geometry,material);
   mesh.scale.setScalar(scale);mesh.position.fromArray(chunk.origin);
   mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
   vertexCount+=vertices;indexCount+=indices;
 }
 meta.render={vertices:vertexCount,triangles:indexCount/3,chunks:meta.mesh.chunks.length};
 scene.userData.model=meta;
 const physics=voxelPhysics(meta,collisionBuffer);
 return {...physics,material,finish:()=>meta};
}
