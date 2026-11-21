import * as T from 'three';
import {roomCode} from './nyc-inhabited-windows.js';
import {applyBlockFinish,blockFamily} from './nyc-block-finish.js';
import {sculptBatch} from './nyc-block-shell.js';
import {bondBuilding} from './nyc-bonded-massing.js';
import {createPavingCells} from './nyc-paving-cells.js';
import {resolvePavingOwnership} from './nyc-paving-ground.js';
import {resolveFacadeOwnership} from './nyc-facade-ownership.js';
import {createSolidIndex} from './nyc-enclosed-faces.js';
import {clusterDrawList} from './nyc-visible-indices.js';
import {createStreetOcclusion} from './nyc-street-occlusion.js';

// Static architectural pieces share one geometry per material and spatial tile.
// Small cubes shape the silhouette; they are never rendered as individual meshes.
export function createArchitectureBatch(scene, materials, tileSize = 32) {
  const batches = new Map();
  const paving=createPavingCells(scene),familyCache=new WeakMap(),keyTint=new T.Color();
  const solidIndex=createSolidIndex();
  const streetOcclusion=createStreetOcclusion(),streetMeshes=[],temporarilyHidden=[];
  let streetView=false;
  const roofOccluders=[];
  const reflectionPanes=[];
  const detailMeshes=[],lod={detailTriangles:0,detailMeshes:0,visibleDetailMeshes:0,distance:68};
  let boxes = 0, triangles = 0;
  const vertices = [
    [[1,0,0], [[.5,-.5,-.5],[.5,-.5,.5],[.5,.5,.5],[.5,.5,-.5]]],
    [[-1,0,0], [[-.5,-.5,.5],[-.5,-.5,-.5],[-.5,.5,-.5],[-.5,.5,.5]]],
    [[0,1,0], [[-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]]],
    [[0,-1,0], [[-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5]]],
    [[0,0,1], [[.5,-.5,.5],[-.5,-.5,.5],[-.5,.5,.5],[.5,.5,.5]]],
    [[0,0,-1], [[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]]]
  ];
  const order = [0,3,2,1];
  const c = new T.Color(), v = new T.Vector3(), n = new T.Vector3();
  const frustum=new T.Frustum(),viewProjection=new T.Matrix4(),eye=new T.Vector3();
  const lastProjection=new T.Matrix4(),lastView=new T.Matrix4();
  let lastCamera;
  function box(material, x,y,z, sx,sy,sz, tint=0xffffff, rotation=0, quaternion=null, dressed=false) {
    if(sx<=0 || sy<=0 || sz<=0)return;
    const room=materials.occupiedRooms&&!quaternion?roomCode(material,x,y,z,sx,sy,sz):0;
    if(room&&room<=128&&y<46){
      const kind=(room-1)%16,cool=[1,6,7,10,11].includes(kind);
      reflectionPanes.push([x,y,z,sx,sy,sz,cool?0x79b5c4:0xffad66,rotation]);
    }
    const mat=room?materials.occupiedRooms:typeof material==='string'?materials[material]:material;
    if(!mat)throw new Error('Unknown NYC material '+material);
    if(!familyCache.has(mat))familyCache.set(mat,blockFamily(mat));
    const family=familyCache.get(mat);
    if(!dressed&&!quaternion){
      const ca=Math.cos(rotation),sa=Math.sin(rotation);
      if(family==='foliage'&&y>1.5&&sy>=.28&&Math.max(sx,sz)>=.60){
        const seed=Math.abs(Math.round(x*13+y*17+z*7));
        if(seed%4===0){
          const side=(seed&4)?1:-1,alongX=sx>=sz;
          const u=alongX?side*sx/2:0,w=alongX?0:side*sz/2;
          const reach=sy>=.64?.32:.16;
          box(mat,x+u*ca+w*sa,y+sy*.3,z-u*sa+w*ca,reach,reach,reach,tint,rotation,null,true);
          box(mat,x+u*ca*.8+w*sa*.8,y+sy*.5,z-u*sa*.8+w*ca*.8,reach,reach,reach,tint,rotation,null,true);
        }
      }
      if((family==='setts'||family==='roadbed')&&sy<=1&&Math.abs(sa*ca)<.0001){
        paving.register(mat,x,y+sy/2,z,Math.abs(ca)*sx+Math.abs(sa)*sz,Math.abs(sa)*sx+Math.abs(ca)*sz,tint.isColor?tint.getHex():tint);
      }
      bondBuilding(family,sx,sy,sz,y-sy/2,(u,v,w,width,height,depth,shade)=>{
        const xx=x+u*ca+w*sa,zz=z-u*sa+w*ca;
        // Preserve the open fire-escape bay over the SoHo bookshop awning.
        if(y+v>7&&xx>-11.7&&xx<-9.0&&Math.abs(zz-95.82)<2.8)return;
        const tone=keyTint.set(tint).multiplyScalar(shade).getHex();
        box(mat,xx,y+v,zz,width,height,depth,tone,rotation,null,true);
      });
    }
    // Tiny architectural fittings can disappear at distance. Foliage, glass
    // and emitters retain their silhouettes even when the fine fittings fade.
    const emits=mat.emissive&&mat.emissiveIntensity>0&&(mat.emissive.r+mat.emissive.g+mat.emissive.b)>0;
    const keepSilhouette=mat.userData.keepDistant===true||emits||/foliage|leaf|leaves|bark|glass|window|water|grass/i.test(mat.name);
    const detail=Math.max(sx,sy,sz)<=.62&&!keepSilhouette;
    if(!detail&&!quaternion&&!mat.transparent&&!mat.alphaTest&&!mat.alphaMap&&!mat.isShaderMaterial&&mat.opacity===1&&Math.abs(Math.sin(2*rotation))<.00001){
      const rx=Math.abs(Math.cos(rotation)),rz=Math.abs(Math.sin(rotation));
      solidIndex.insert(x,y,z,rx*sx+rz*sz,sy,rz*sx+rx*sz);
      if(mat.side===T.FrontSide&&!mat.displacementMap&&mat.depthWrite&&mat.visible)
        streetOcclusion.add(x,y,z,rx*sx+rz*sz-.4,sy-.4,rz*sx+rx*sz-.4);
    }
    const key=mat.uuid+':'+Math.floor(x/tileSize)+':'+Math.floor(z/tileSize)+':'+Number(detail);
    let b=batches.get(key);
    if(!b){b={material:mat,detail,p:[],n:[],uv:[],c:[]};batches.set(key,b);}
    c.set(tint);
    const ct=Math.cos(rotation),st=Math.sin(rotation), meters=mat.userData.textureMeters||1;
    // Actual broad horizontal pieces also shelter drizzle, even when a canopy
    // needs no player collider. Keep this metadata separate from game physics.
    if(!quaternion&&y+sy/2>2.5&&sy<=.45&&Math.min(sx,sz)>=.24&&sx*sz>=.8){
      const hx=(Math.abs(ct)*sx+Math.abs(st)*sz)/2,hz=(Math.abs(st)*sx+Math.abs(ct)*sz)/2;
      roofOccluders.push(new T.Box3(new T.Vector3(x-hx,y-sy/2,z-hz),new T.Vector3(x+hx,y+sy/2,z+hz)));
    }
    const canopy=mat.userData.canopyShading===true;
    const roomVariant=mat.userData.roomAtlas?Math.abs(Math.round(x*7+y*13+z*11))%4:0;
    const masonry=mat===materials.brick||mat===materials.brickBrown||mat===materials.stone;
    const cutFlag=mat.userData.worldPavingUV&&!quaternion&&sy<=.32&&Math.min(sx,sz)>=.26&&Math.max(sx,sz)<2.6;
    const structural=mat.userData.assemblyUV?Math.min(sx,sy,sz)>=.36:
      Math.min(sx,sy,sz)>=.22||Math.min(sx,sz)>=2.56;
    if(structural&&!quaternion){
      (b.structural??=new Set()).add(b.p.length/12);
    }
    for(let f=0;f<6;f++) {
      const [normal,corners]=vertices[f];
      n.set(...normal);
      if(quaternion)n.applyQuaternion(quaternion);
      else {const nx=n.x;n.x=nx*ct+n.z*st;n.z=-nx*st+n.z*ct;}
      const width=mat.userData.unitUV?1:(f<2?sz:sx)/meters,height=mat.userData.unitUV?1:(f<2?sy:f<4?sz:sy)/meters;
      const uvs=[[0,0],[width,0],[width,height],[0,height]];
      for(const j of order) {
        const corner=corners[j];v.set(corner[0]*sx,corner[1]*sy,corner[2]*sz);
        if(cutFlag&&f===2){v.x-=Math.sign(v.x)*.016;v.z-=Math.sign(v.z)*.016;v.y+=.012;}
        if(quaternion)v.applyQuaternion(quaternion);
        else{const vx=v.x;v.x=vx*ct+v.z*st;v.z=-vx*st+v.z*ct;}
        b.p.push(v.x+x,v.y+y,v.z+z);b.n.push(n.x,n.y,n.z);
        if(room){
          const broad=sx>=sz?f===4||f===5:f===0||f===1;
          const u=f===4?corner[0]:f===5?-corner[0]:f===0?-corner[2]:corner[2];
          const aspect=Math.max(2,Math.min(512,Math.round(4*Math.max(sx,sz)/sy)));
          b.uv.push((broad?room:0)+.5+u*.998,aspect+.5+corner[1]*.998);
        }else if(mat.userData.assemblyUV&&!quaternion){
          // Metre-based panel joints stay aligned across adjoining pieces.
          // Project onto the rotated wall so diagonal sightlines keep square units.
          const ux=x*ct-z*st+corner[0]*sx,uz=x*st+z*ct+corner[2]*sz;
          b.uv.push((f<2?uz:ux)/meters,(f===2||f===3?uz:y+corner[1]*sy)/meters);
        }else if(mat.userData.worldUnitsUV||mat.userData.worldPavingUV||mat.userData.bondedBrick){
          const horizontal=Math.abs(n.y)>.7;
          b.uv.push((!horizontal&&Math.abs(n.x)>Math.abs(n.z)?v.z+z:v.x+x)/meters,(horizontal?v.z+z:v.y+y)/meters);
        }else if(mat.userData.grainAlongLength){
          // Use the longest local axis, including on diagonal beams before rotation.
          const local=[corner[0]*sx,corner[1]*sy,corner[2]*sz];
          const axis=sx>=sy&&sx>=sz?0:sy>=sz?1:2,face=Math.floor(f/2);
          const along=axis===face?(axis+1)%3:axis;
          b.uv.push(local[along]/meters+x*.37,local[3-face-along]/meters+z*.19);
        }else if(mat.userData.roomAtlas){
          b.uv.push((roomVariant+uvs[j][0]*.98+.01)/4,uvs[j][1]);
        }else b.uv.push(mat.userData.frontImage?1-uvs[j][0]:uvs[j][0],uvs[j][1]);
        // Broad masonry runs pick up cool damp staining at street level.
        // Compute per vertex within the existing batch, including rear walls.
        if(masonry && normal[1]===0){
          const damp=Math.max(0,1-Math.max(0,v.y+y-.35)/3.8);
          b.c.push(c.r*(1-.35*damp),c.g*(1-.25*damp),c.b*(1-.15*damp));
        }else if(canopy){
          const shade=corner[1]<0?.63:.98;
          b.c.push(c.r*shade,c.g*shade,c.b*(.15+.85*shade));
        }else b.c.push(c.r,c.g,c.b);
      }
    }
    if(cutFlag){
      // Raised flag face and four dressed shoulders, with the joint at bed level.
      const top=vertices[2][1],point=(j,cap)=>{
        const dx=top[j][0]*(sx-(cap?.032:0)),dz=top[j][2]*(sz-(cap?.032:0));
        return [x+dx*ct+dz*st,y+sy/2+(cap?.012:0),z-dx*st+dz*ct];
      };
      for(let i=0;i<4;i++){
        const a=order[i],next=order[(i+1)%4],quad=[point(a,false),point(next,false),point(next,true),point(a,true)];
        const e1=new T.Vector3().fromArray(quad[1]).sub(v.fromArray(quad[0]));
        n.fromArray(quad[3]).sub(v.fromArray(quad[0]));e1.cross(n).normalize();
        for(const q of quad){b.p.push(...q);b.n.push(e1.x,e1.y,e1.z);b.c.push(c.r*.86,c.g*.86,c.b*.86);b.uv.push(q[0]/meters,q[2]/meters);}
      }
      triangles+=8;if(detail)lod.detailTriangles+=8;
    }
    boxes++;triangles+=12;if(detail)lod.detailTriangles+=12;
  }
  function beam(material,a,b,width=.08,depth=width,tint=0xffffff) {
    const p=new T.Vector3(...a),q=new T.Vector3(...b),direction=q.clone().sub(p);
    const quat=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.clone().normalize());
    p.add(q).multiplyScalar(.5);
    box(material,p.x,p.y,p.z,width,direction.length(),depth,tint,0,quat);
  }
  // Cross-shaped iron sections and stepped collars match the castings at the radio shop.
  function castColumn(x,base,z,height,radius){
    const sections=[[0,.12,1.48],[.12,.22,1.13],[.22,.76,.88],[.76,.82,1.08],
      [.82,.88,1.24],[.88,.94,1.45],[.94,1,1.68]];
    for(const [lo,hi,k] of sections){
      const r=radius*k,y=base+(lo+hi)*height/2,h=(hi-lo)*height;
      const mat=lo===.12||lo===.82?'metal':'castEnamel';
      const tint=mat==='metal'?0xc89c72:0x86a9a1;
      box(mat,x,y,z,r*2,h,r*1.23,tint);
      for(const side of [-1,1])box(mat,x,y,z+side*r*.8075,r*1.23,h,r*.385,tint);
    }
  }
  // A continuous polygon panel can share a tile with the surrounding boxes.
  function panel(material, corners, tint=0xffffff, coordinates=null) {
    const mat=materials[material];
    const pts=corners.map(p=>new T.Vector3(...p));
    const centre=pts.reduce((sum,p)=>sum.add(p),new T.Vector3()).multiplyScalar(.25);
    const key=mat.uuid+':'+Math.floor(centre.x/tileSize)+':'+Math.floor(centre.z/tileSize)+':0';
    let b=batches.get(key);
    if(!b){b={material:mat,detail:false,p:[],n:[],uv:[],c:[]};batches.set(key,b);}
    const normal=pts[1].clone().sub(pts[0]).cross(pts[3].clone().sub(pts[0])).normalize();
    c.set(tint);
    const uv=[[0,0],[1,0],[1,1],[0,1]];
    const worldUV=mat.userData.assemblyUV||mat.userData.worldUnitsUV||mat.userData.voxelSurfaceBaked;
    const meters=mat.userData.textureMeters||2.56;
    const dropY=Math.abs(normal.y)>=Math.max(Math.abs(normal.x),Math.abs(normal.z));
    const dropX=Math.abs(normal.x)>Math.abs(normal.z);
    for(const i of [0,1,2,3]){
      b.p.push(...corners[i]);b.n.push(normal.x,normal.y,normal.z);
      if(!coordinates&&worldUV){
        const [x,y,z]=corners[i];
        b.uv.push((!dropY&&dropX?z:x)/meters,(dropY?z:y)/meters);
      }else b.uv.push(...(coordinates||uv)[i]);
      b.c.push(c.r,c.g,c.b);
    }
    triangles+=2;
  }
  function finish() {
    const meshes=[];
    const cellShell={surfaces:0,reliefQuads:0,buriedQuads:0};
    for(const b of batches.values())cellShell.buriedQuads+=solidIndex.prune(b);
    cellShell.pavingOwnership=resolvePavingOwnership(batches,paving);
    cellShell.facadeOwnership=resolveFacadeOwnership(batches);
    for(const [batchKey,b] of batches) {
      if(!b.p.length){batches.delete(batchKey);continue;}
      const original=b.p.length/12,family=blockFamily(b.material);
      applyBlockFinish(b.material,family);
      const sculpted=sculptBatch(b,family);
      cellShell.surfaces+=sculpted.size;cellShell.reliefQuads+=b.p.length/12-original;
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));
      g.setAttribute('normal',new T.Int8BufferAttribute(Int8Array.from(b.n,v=>Math.round(v*127)),3,true));
      g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));
      g.setAttribute('color',new T.Uint8BufferAttribute(Uint8Array.from(b.c,v=>Math.round(Math.min(1,Math.max(0,v))*255)),3,true));
      // Share only the four vertices of each face. Hard normals, atlas UVs
      // and tint are still independent across adjoining voxel faces.
      const count=b.p.length/3;
      const size=(original+(sculpted.size?count/4-sculpted.size:0))*6;
      const IndexType=count<65536?Uint16Array:Uint32Array;
      // A short batch can still own a very detailed replacement shell.
      // Test its fine faces by street cell instead of submitting a whole
      // building tile when just one doorway is close to the player.
      const useClusters=!b.material.transparent&&(original>320||count/4-original>240||
        (b.material.userData.voxelSurfaceBaked&&original>100));
      const indices=useClusters?null:new IndexType(size);
      // Sort exact planar quads so exterior views can skip the backs of an
      // entire tile in one draw. Sloping and two-sided elements remain intact.
      const sides=new Int8Array(count/4),totals=new Uint32Array(7);
      for(let q=0;q<sides.length;q++){
        const base=q*12;
        for(let axis=0;!b.material.transparent&&axis<3;axis++){
          if(b.p[base+axis]!==b.p[base+3+axis]||b.p[base+axis]!==b.p[base+6+axis]||b.p[base+axis]!==b.p[base+9+axis])continue;
          const u=(axis+1)%3,w=(axis+2)%3;
          const cross=(b.p[base+3+u]-b.p[base+u])*(b.p[base+6+w]-b.p[base+w])-
            (b.p[base+3+w]-b.p[base+w])*(b.p[base+6+u]-b.p[base+u]);
          sides[q]=Math.sign(cross)*(axis+1);break;
        }
        totals[3+sides[q]]++;
      }
      const axes=[1,3,2],weight=k=>Math.min(totals[3+k],totals[3-k]);
      const best=axes.reduce((a,k)=>weight(k)>weight(a)?k:a);
      function indexLevel(start,fine){
        const groups=[0,0,0],end=fine?sides.length:original;
        for(let q=0;q<end;q++){
          if(fine&&sculpted.has(q))continue;
          groups[sides[q]===-best?0:sides[q]===best?2:1]+=6;
        }
        const write=[start,start+groups[0],start+groups[0]+groups[1]];
        for(let q=0;q<end;q++){
          if(fine&&sculpted.has(q))continue;
          const v=q*4,group=sides[q]===-best?0:sides[q]===best?2:1;
          let i=write[group];write[group]+=6;
          indices[i++]=v;indices[i++]=v+1;indices[i++]=v+2;
          indices[i++]=v;indices[i++]=v+2;indices[i]=v+3;
        }
        return {start,length:groups[0]+groups[1]+groups[2],left:groups[0],right:groups[2]};
      }
      const coarse=useClusters?{start:0,length:original*6}:indexLevel(0,false);
      const fine=!useClusters&&sculpted.size?indexLevel(coarse.length,true):coarse;
      const clustered=useClusters?clusterDrawList(b,sides,original,sculpted,IndexType):null;
      g.setIndex(clustered?clustered.attribute:new T.BufferAttribute(indices,1));
      g.computeBoundingSphere();g.computeBoundingBox();
      const mesh=new T.Mesh(g,b.material);mesh.name='NYC / '+b.material.name;
      // All architectural vertices are already in world coordinates.
      mesh.matrixAutoUpdate=false;
      const box=g.boundingBox;
      const detailedViews=fine!==coarse?new WeakSet():null;
      g.setDrawRange(0,coarse.length);
      mesh.onBeforeShadow=()=>g.setDrawRange(0,coarse.length);
      mesh.onBeforeRender=(renderer,scene,camera,geometry,mat)=>{
        if(lastCamera!==camera||!lastProjection.equals(camera.projectionMatrix)||!lastView.equals(camera.matrixWorldInverse)){
          frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
          eye.setFromMatrixPosition(camera.matrixWorld);lastCamera=camera;
          lastProjection.copy(camera.projectionMatrix);lastView.copy(camera.matrixWorldInverse);
        }
        if(!frustum.intersectsBox(box)){g.setDrawRange(0,0);return;}
        if(clustered){
          if(camera.isPerspectiveCamera&&mat.side===T.FrontSide){
            g.setDrawRange(clustered.offset,clustered.view(eye,frustum,lod.distance*.55,streetView?streetOcclusion:null,camera));
          }else g.setDrawRange(0,coarse.length);
          return;
        }
        // Shoulder-camera motion can oscillate around the cutoff while walking.
        // A reflection camera has its own near/far history for this surface.
        let level=coarse;
        if(detailedViews){
          const wasNear=detailedViews.has(camera);
          const near=box.distanceToPoint(eye)<lod.distance*.52*(wasNear?1.05:.95);
          if(near)level=fine;
          if(near!==wasNear){
            if(near)detailedViews.add(camera);
            else detailedViews.delete(camera);
          }
        }
        if(!camera.isPerspectiveCamera||mat.side!==T.FrontSide||mat.transparent){g.setDrawRange(level.start,level.length);return;}
        const axis=best-1,k=eye.getComponent(axis);
        if(k>box.max.getComponent(axis)+.001)g.setDrawRange(level.start+level.left,level.length-level.left);
        else if(k<box.min.getComponent(axis)-.001)g.setDrawRange(level.start,level.length-level.right);
        else g.setDrawRange(level.start,level.length);
      };
      mesh.receiveShadow=true;mesh.castShadow=b.material.userData.castShadow!==false;
      if(b.detail){mesh.userData.nycDistanceDetail=true;detailMeshes.push(mesh);}
      scene.add(mesh);meshes.push(mesh);streetMeshes.push(mesh);
      batches.delete(batchKey);
      b.p=b.n=b.uv=b.c=b.structural=b.structuralThickness=b.reliefOwners=null;
    }
    lod.detailMeshes=detailMeshes.length;lod.visibleDetailMeshes=detailMeshes.length;
    solidIndex.clear();
    return {meshes,boxes,triangles,cellShell,drawCalls:meshes.length,lod};
  }
  function updateVisibility(position){
    paving.update(position);
    if(!position)return;let visible=0;
    for(const mesh of detailMeshes){const b=mesh.geometry.boundingBox,dx=Math.max(b.min.x-position.x,0,position.x-b.max.x),dz=Math.max(b.min.z-position.z,0,position.z-b.max.z);const limit=lod.distance+(mesh.visible?3:0);mesh.visible=dx*dx+dz*dz<limit*limit;if(mesh.visible)visible++;}
    lod.visibleDetailMeshes=visible;
  }
  function setQuality(level){paving.setQuality(level);lod.distance=level==='high'?100:level==='low'?40:68;}
  const streetFrustum=new T.Frustum(),streetMatrix=new T.Matrix4();
  function prepareStreetView(camera,shadowRefresh){
    streetView=true;
    camera.updateMatrixWorld();
    streetFrustum.setFromProjectionMatrix(streetMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    streetOcclusion.prepare(camera.position);
    for(const mesh of streetMeshes){
      // The shadow pass also needs casters behind the camera.
      if(!mesh.visible||(shadowRefresh&&mesh.castShadow))continue;
      const bounds=mesh.geometry.boundingBox;
      if(streetFrustum.intersectsBox(bounds)&&!streetOcclusion.hides(bounds))continue;
      mesh.visible=false;temporarilyHidden.push(mesh);
    }
  }
  function finishStreetView(){
    for(const mesh of temporarilyHidden)mesh.visible=true;
    temporarilyHidden.length=0;streetView=false;
  }
  return {box,beam,panel,castColumn,registerPaving:paving.register,finish,roofOccluders,reflectionPanes,setQuality,updateVisibility,prepareStreetView,finishStreetView};
}

export function randomSource(seed=701) {
  let s=seed>>>0;
  return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
}
