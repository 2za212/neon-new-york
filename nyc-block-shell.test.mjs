import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {cutAssembly,cutCourses} from './nyc-block-shell.js';
import {unitDepth} from './nyc-unit-bond.js';
import {createPavingCells} from './nyc-paving-cells.js';
import {resolvePavingOwnership} from './nyc-paving-ground.js';
import {blockFamily} from './nyc-block-finish.js';
import {clusterDrawList} from './nyc-visible-indices.js';
import {resolveFacadeOwnership} from './nyc-facade-ownership.js';
import {createSolidIndex} from './nyc-enclosed-faces.js';
import {createStreetOcclusion} from './nyc-street-occlusion.js';
import {openGreenway} from './nyc-greenway.js';
import {buildRepairQuarter} from './nyc-repair-quarter.js';
import {createArchitectureBatch} from './nyc-geometry.js';

test('the repair depot leaves headroom along the public greenway stairs', () => {
  const noop = () => {};
  const scene = new T.Scene();
  const geometry = {box: noop, beam: noop, surface: noop, sign: noop, materials: {}};
  const greenway = openGreenway(scene, {...geometry, colliders: [], rand: () => .5});
  const depot = [];
  buildRepairQuarter(scene, {...geometry, localLights: [], collider(x, y, z, w, h, d) {
    depot.push(new T.Box3().setFromCenterAndSize(new T.Vector3(x, y, z), new T.Vector3(w, h, d)));
  }});
  for (const stair of [greenway.eastStair, greenway.westStair]) {
    for (const tread of stair.treads) {
      const space = new T.Box3(
        new T.Vector3(stair.x - .75, tread.top + .02, tread.minZ + .01),
        new T.Vector3(stair.x + .75, tread.top + 1.8, tread.maxZ - .01)
      );
      assert.ok(depot.every(solid => !space.intersectsBox(solid)), `Stair blocked at ${stair.x}, ${tread.minZ}`);
    }
  }
});

test('only complete targets behind solid street walls disappear during rotation',()=>{
  const mask=createStreetOcclusion();
  mask.add(0,4,5,8,8,1);
  const bounds=(left,right,z)=>new T.Box3(new T.Vector3(left,1,z),new T.Vector3(right,3,z+1));
  mask.prepare(new T.Vector3(0,2,0));
  assert.equal(mask.hides(bounds(-1,1,10)),true);
  assert.equal(mask.hides(bounds(0,12,10)),false);
  assert.equal(mask.hides(bounds(-1,1,4)),false);
  mask.prepare(new T.Vector3(0,2,15));
  assert.equal(mask.hides(bounds(-1,1,10)),false);
  assert.equal(mask.hides(bounds(-1,1,0)),true);
});

test('stepped caps cover their original rectangle and have positive winding',()=>{
  let area=0,risers=0;
  const changed=cutCourses(4.1,2.8,0,'clay',7,(q)=>{
    const [a,b,,d]=q;
    if(q.every(v=>v[2]===a[2])){
      const signed=(b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0]);
      assert.ok(signed>0);area+=signed;
    }else risers++;
  });
  assert.equal(changed,true);assert.ok(Math.abs(area-1)<1e-7);assert.ok(risers>0);
});
test('room tread stays above its baked backing and within the existing floor tolerance',()=>{
  const heights=[];
  cutCourses(1.1,.64,1,'setts',1,quad=>quad.forEach(p=>heights.push(p[2])),true);
  assert.ok(heights.length>0);assert.ok(Math.min(...heights)>=0);assert.ok(Math.max(...heights)<=.008);
});
test('a continuous road supplies a full field of closed caps beneath the lane paint',()=>{
  const scene=new T.Scene(),cells=createPavingCells(scene);
  const mat=new T.MeshStandardMaterial();mat.name='NYC asphalt';mat.userData.textureMeters=2.56;
  cells.register(mat,0,.18,0,40,40,0xffffff);cells.setQuality('low');
  cells.update(new T.Vector3(0,2,0));
  const mesh=scene.children[0],g=mesh.geometry,pos=g.attributes.position;
  assert.equal(mesh.count,13*13);
  let topArea=0,risers=0;
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),m=new T.Matrix4();
  mesh.getMatrixAt(0,m);
  for(let i=0;i<g.index.count;i+=3){
    a.fromBufferAttribute(pos,g.index.getX(i));
    b.fromBufferAttribute(pos,g.index.getX(i+1)).sub(a);
    c.fromBufferAttribute(pos,g.index.getX(i+2)).sub(a);
    assert.ok(a.y+m.elements[13]<.188);
    const area=b.cross(c);
    if(area.y>0)topArea+=area.y/2;else risers++;
  }
  assert.ok(Math.abs(topArea-1.28**2)<1e-6);
  assert.ok(risers>0);
});
test('a turned facade keeps its physical panel steps on the same joints as the wrapped texture',()=>{
  for(const [a,b,c,d,e,f] of [[-.43,-.28,0,.97,-1.52,0],[.8,-1.19,-1.45,0,0,.77]]){
    let area=0,risers=0;
    assert.ok(cutAssembly(1.80,1.86,0,[a,b,c,d,e,f],1,q=>{
      const [p,r,,s]=q;
      if(!q.every(v=>v[2]===p[2])){risers++;return;}
      area+=(r[0]-p[0])*(s[1]-p[1]);
      const u=(p[0]+r[0])*.5,v=(p[1]+s[1])*.5;
      const step=unitDepth(Math.floor((a+c*u+e*v)*8),Math.floor((b+d*u+f*v)*8),1);
      assert.equal(p[2],step*.16);
    }));
    assert.ok(Math.abs(area-1)<1e-8);
    assert.ok(risers>0);
  }
});
test('a bent street can cover a tile with adjacent thin strips without spilling into the gutter',()=>{
  const scene=new T.Scene(),cells=createPavingCells(scene),mat=new T.MeshStandardMaterial();
  mat.name='NYC asphalt';
  for(const x of [.32,.96])cells.register(mat,x,.18,.64,.64,1.28,0xffffff,true);
  cells.register(mat,1.60,.18,.64,.64,1.28,0xffffff,true);
  cells.update(new T.Vector3(0,2,0));
  assert.equal(scene.children[0].count,1);
});

test('a plaza inlay keeps its footprint through clipping and near paving updates',()=>{
  function pavingFace(name,x0,x1,z0,z1){
    const corners=[[x0,z0],[x0,z1],[x1,z1],[x1,z0]];
    const material=new T.MeshStandardMaterial();material.name=name;
    return {material,p:corners.flatMap(([x,z])=>[x,.36,z]),uv:corners.flat(),
      n:corners.flatMap(()=>[0,1,0]),c:Array(12).fill(1),structural:new Set([0]),
      structuralThickness:new Float32Array([.12])};
  }
  const plaza=pavingFace('limestone',0,4,0,4),inlay=pavingFace('paver',1,3,1,2);
  const patches=[plaza,inlay],protectedAreas=[];
  const stats=resolvePavingOwnership(patches,{protect:(...rect)=>protectedAreas.push(rect)});
  assert.equal(stats.overlapArea,2);
  assert.deepEqual(protectedAreas,[[.36,1,3,1,2]]);
  assert.equal(inlay.p.length,12);
  assert.equal(resolvePavingOwnership(patches).overlapArea,0);
  let remaining=0;
  for(let i=0;i<plaza.p.length;i+=12){
    remaining+=Math.abs((plaza.p[i+6]-plaza.p[i])*(plaza.p[i+8]-plaza.p[i+2]));
    assert.ok(Math.abs(plaza.structuralThickness[i/12]-.12)<1e-6);
    for(let j=i;j<i+12;j+=3)assert.deepEqual(plaza.uv.slice(j/3*2,j/3*2+2),[plaza.p[j],plaza.p[j+2]]);
  }
  assert.equal(remaining,14);
});
test('facade lamps and their clones retain signal glass under a localized material name',()=>{
  const lens=new T.MeshBasicMaterial();
  lens.name='西岸 / 隔栅信号玻璃';
  lens.userData.signalLens=true;
  assert.equal(blockFamily(lens),null);
  assert.equal(blockFamily(lens.clone()),null);
});
test('a street wall retains its relief through shoulder motion, shadow and reflection passes',()=>{
  const scene=new T.Scene(),wall=new T.MeshStandardMaterial();
  wall.name='test brick';
  const batch=createArchitectureBatch(scene,{wall});
  batch.box('wall',0,1.6,0,2.56,3.2,.64);
  const [mesh]=batch.finish().meshes,g=mesh.geometry;
  batch.setQuality('low');
  mesh.onBeforeShadow();
  const coarse=g.drawRange.count;
  assert.equal(g.index.usage,T.StaticDrawUsage);
  assert.ok(g.index.count>coarse);
  const eye=new T.PerspectiveCamera(55,1,.14,600),mirror=eye.clone();
  function usesRelief(camera,distance){
    camera.position.set(0,1.6,g.boundingBox.max.z+distance);
    camera.lookAt(0,1.6,0);camera.updateMatrixWorld();
    mesh.onBeforeRender(null,scene,camera,g,wall);
    return g.drawRange.start>=coarse;
  }
  assert.ok(usesRelief(eye,18));
  for(let frame=0;frame<20;frame++){
    mesh.onBeforeShadow();
    assert.deepEqual(g.drawRange,{start:0,count:coarse});
    assert.equal(usesRelief(mirror,30),false);
    assert.ok(usesRelief(eye,20.8+(frame%2?.035:-.035)));
  }
  assert.equal(usesRelief(eye,24),false);
  assert.equal(usesRelief(eye,20.7),false);
  assert.ok(usesRelief(eye,18));
});

test('a single wall and all of its replacement faces change LOD together across a grid boundary',()=>{
  const rect=(a,b)=>[a,0,0,b,0,0,b,2,0,a,2,0];
  const b={p:[...rect(0,50),...rect(0,25),...rect(25,50)],reliefOwners:[[3,0]]};
  const list=clusterDrawList(b,new Int8Array(3),1,new Set([0]),Uint16Array);
  const frustum={intersectsBox:()=>true};
  assert.equal(list.view(new T.Vector3(1,1,1),frustum,8),12);
  assert.equal(list.attribute.array[list.offset],4);
  assert.equal(list.view(new T.Vector3(100,1,1),frustum,8),6);
  assert.equal(list.attribute.array[list.offset],0);
});

test('a permanent lit inset owns its wall footprint at both LODs while the remainder keeps its UVs',()=>{
  function face(x0,x1,y0,y1,glass=false){
    const p=[x0,y0,0,x1,y0,0,x1,y1,0,x0,y1,0];
    const material=new T.MeshStandardMaterial();
    material.userData.frontImage=glass;
    return {p,c:Array(12).fill(.5),n:[0,0,1,0,0,1,0,0,1,0,0,1],
      uv:[x0,y0,x1,y0,x1,y1,x0,y1],material,structural:new Set([0]),structuralThickness:new Float32Array([.24])};
  }
  const wall=face(-4,4,0,4),window=face(-1,2,1,3,true),fitting=face(-2,3,0,4,true);
  fitting.detail=true;
  const result=resolveFacadeOwnership(new Map([['wall',wall],['window',window],['fitting',fitting]]));
  assert.equal(result.removedArea,6);assert.equal(result.faces,1);assert.equal(result.fragments,4);
  assert.equal(window.p.length,12);assert.equal(fitting.p.length,12);
  let area=0;
  for(let i=0;i<wall.p.length;i+=12){
    const width=wall.p[i+3]-wall.p[i],height=wall.p[i+10]-wall.p[i+1];
    assert.ok(width>0&&height>0);area+=width*height;
    assert.ok(wall.structural.has(i/12));
    assert.ok(Math.abs(wall.structuralThickness[i/12]-.24)<1e-6);
    for(let j=0;j<4;j++)assert.deepEqual(wall.uv.slice(i/12*8+j*2,i/12*8+j*2+2),wall.p.slice(i+j*3,i+j*3+2));
  }
  assert.equal(area,26);
});

test('opposite faces limit their cuts to the gauge of the actual casing',()=>{
  const corners=new T.BoxGeometry(3.84,2.56,.24).attributes.position;
  const group={p:[],n:[],c:[],uv:[],structural:new Set([0])};
  for(let face=0;face<6;face++)for(const j of [0,2,3,1]){
    const i=4*face+j;group.p.push(corners.getX(i),corners.getY(i),corners.getZ(i));
    const normal=[0,0,0];normal[face>>1]=face%2?-1:1;
    group.n.push(...normal);group.c.push(1,1,1);group.uv.push(0,0);
  }
  createSolidIndex().prune(group);
  for(const i of [4,5]){
    const depth=group.structuralThickness[i];assert.ok(Math.abs(depth-.24)<1e-6);
    let deepest=0;cutCourses(3.84,2.56,0,'stone',3,q=>{for(const p of q)deepest=Math.max(deepest,-p[2]);},false,depth*.42);
    assert.ok(deepest>0&&deepest*2<depth);
  }
});

test('a soffit and its ceiling inlay share one surface while paving retains low upward faces',()=>{
  function flat(y,span,down){
    const corners=[[0,0],[span,0],[span,span],[0,span]];
    if(!down)corners.reverse();
    const p=corners.flatMap(([x,z])=>[x,y,z]);
    return {p,n:Array.from({length:4},()=>[0,down?-1:1,0]).flat(),c:Array(12).fill(.7),
      uv:corners.flat(),material:new T.MeshStandardMaterial(),structural:new Set()};
  }
  for(const [height,down,area] of [[4,true,4],[4,false,4],[.3,true,4],[.3,false,0]]){
    const big=flat(height,4,down),small=flat(height,2,down);
    const stats=resolveFacadeOwnership(new Map([['roof',big],['trim',small]]));
    assert.equal(stats.removedArea,area);
    for(let i=0;i<big.p.length;i+=3)assert.deepEqual(big.uv.slice(i/3*2,i/3*2+2),[big.p[i],big.p[i+2]]);
  }
});

test('facade LOD has an independent enter and exit band for each camera',()=>{
  const face=[0,0,0,2,0,0,2,2,0,0,2,0],b={p:[...face,...face],reliefOwners:[[2,0]]};
  const list=clusterDrawList(b,new Int8Array(2),1,new Set([0]),Uint16Array);
  const frustum={intersectsBox:()=>true},main={},reflection={};
  function selected(z,camera){list.view(new T.Vector3(1,1,z),frustum,10,null,camera);return list.attribute.array[list.offset];}
  assert.equal(selected(9,main),4);assert.equal(selected(10.2,main),4);
  assert.equal(selected(16,reflection),0);assert.equal(selected(10.2,main),4);
  assert.equal(selected(10.7,main),0);assert.equal(selected(9.7,main),0);assert.equal(selected(9.4,main),4);
});
test('a cluster selects facing and distance variants while preserving its shadow indices',()=>{
  const b={p:[0,0,0,0,1,0,0,1,1,0,0,1, 0,0,0,0,0,1,0,1,1,0,1,0, 0,0,0,0,0,1,0,1,1,0,1,0]};
  const list=clusterDrawList(b,new Int8Array([1,-1,-1]),2,new Set([1]),Uint16Array);
  const frustum={intersectsBox:()=>true};
  const prefix=[...list.attribute.array.subarray(0,list.offset)];
  assert.equal(list.view(new T.Vector3(2,.5,.5),frustum,10),6);
  assert.equal(list.view(new T.Vector3(-2,.5,.5),frustum,10),6);
  assert.equal(list.attribute.array[list.offset],8);
  list.view(new T.Vector3(-22,.5,.5),frustum,10);
  assert.equal(list.attribute.array[list.offset],4);
  assert.deepEqual([...list.attribute.array.subarray(0,list.offset)],prefix);
});

