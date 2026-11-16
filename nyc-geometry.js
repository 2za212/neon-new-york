import * as T from 'three';

// Static architectural pieces share one geometry per material and spatial tile.
// Small cubes shape the silhouette; they are never rendered as individual meshes.
export function createArchitectureBatch(scene, materials, tileSize = 32) {
  const batches = new Map();
  const roofOccluders=[];
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
  const order = [0,2,1,0,3,2];
  const c = new T.Color(), v = new T.Vector3(), n = new T.Vector3();
  function box(material, x,y,z, sx,sy,sz, tint=0xffffff, rotation=0, quaternion=null) {
    if(sx<=0 || sy<=0 || sz<=0)return;
    const mat=typeof material==='string'?materials[material]:material;
    if(!mat)throw new Error('Unknown NYC material '+material);
    // Tiny architectural fittings can disappear at distance. Foliage, glass
    // and emitters retain their silhouettes even when the fine fittings fade.
    const emits=mat.emissive&&mat.emissiveIntensity>0&&(mat.emissive.r+mat.emissive.g+mat.emissive.b)>0;
    const keepSilhouette=mat.userData.keepDistant===true||emits||/foliage|leaf|leaves|bark|glass|window|water|grass/i.test(mat.name);
    const detail=Math.max(sx,sy,sz)<=.62&&!keepSilhouette;
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
    for(let f=0;f<6;f++) {
      const [normal,corners]=vertices[f];
      n.set(...normal);
      if(quaternion)n.applyQuaternion(quaternion);
      else {const nx=n.x;n.x=nx*ct+n.z*st;n.z=-nx*st+n.z*ct;}
      const width=mat.userData.unitUV?1:(f<2?sz:sx)/meters,height=mat.userData.unitUV?1:(f<2?sy:f<4?sz:sy)/meters;
      const uvs=[[0,0],[width,0],[width,height],[0,height]];
      for(const j of order) {
        const corner=corners[j];v.set(corner[0]*sx,corner[1]*sy,corner[2]*sz);
        if(quaternion)v.applyQuaternion(quaternion);
        else{const vx=v.x;v.x=vx*ct+v.z*st;v.z=-vx*st+v.z*ct;}
        b.p.push(v.x+x,v.y+y,v.z+z);b.n.push(n.x,n.y,n.z);if(mat.userData.grainAlongLength){
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
          const damp=Math.max(0,1-Math.max(0,v.y-.35)/3.8);
          b.c.push(c.r*(1-.35*damp),c.g*(1-.25*damp),c.b*(1-.15*damp));
        }else if(canopy){
          const shade=corner[1]<0?.63:.98;
          b.c.push(c.r*shade,c.g*shade,c.b*(.15+.85*shade));
        }else b.c.push(c.r,c.g,c.b);
      }
    }
    boxes++;triangles+=12;if(detail)lod.detailTriangles+=12;
  }
  function beam(material,a,b,width=.08,depth=width,tint=0xffffff) {
    const p=new T.Vector3(...a),q=new T.Vector3(...b),direction=q.clone().sub(p);
    const quat=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.clone().normalize());
    p.add(q).multiplyScalar(.5);
    box(material,p.x,p.y,p.z,width,direction.length(),depth,tint,0,quat);
  }
  // Section through a cast-iron column, from the plinth to the stepped capital.
  // Transition rings generate actual bevel normals; shaft flutes catch side light.
  function castColumn(x,base,z,height,radius,seed=0){
    const mat=materials.castEnamel,key=mat.uuid+':'+Math.floor(x/tileSize)+':'+Math.floor(z/tileSize)+':0';
    let b=batches.get(key);
    if(!b){b={material:mat,detail:false,p:[],n:[],uv:[],c:[]};batches.set(key,b);}
    const rings=[[0,1.40],[.035,1.40],[.054,1.20],[.14,1.20],[.16,1.36],[.18,1.06],
      [.20,.98],[.76,.83],[.79,.98],[.81,1.14],[.83,.99],[.88,1.14],[.91,1.42],[.94,1.52],[1,1.52]];
    const sectors=24,phase=seed*.39;
    const pt=(r,i)=>{
      const [level,width]=rings[r],angle=2*Math.PI*i/sectors+phase;
      const flute=(r===6||r===7)&&(i%2===0)?.83:1;
      return new T.Vector3(x+Math.cos(angle)*radius*width*flute,base+height*level,z+Math.sin(angle)*radius*width*flute);
    };
    const normal=new T.Vector3(),edge=new T.Vector3();
    for(let r=0;r<rings.length-1;r++)for(let i=0;i<sectors;i++){
      const a=pt(r,i),d=pt(r+1,i),e=pt(r+1,i+1),f=pt(r,i+1);
      normal.subVectors(d,a).cross(edge.subVectors(f,a)).normalize();
      // Weathered brass collars, painted iron shaft, dirt just above the foot.
      c.set(r===4||r===9?0xffcc92:r<3?0x849b92:0xc8d9c9);
      for(const vertex of [a,d,e,a,e,f]){
        b.p.push(vertex.x,vertex.y,vertex.z);b.n.push(normal.x,normal.y,normal.z);
        b.uv.push((vertex.x+vertex.z)*1.5,vertex.y*1.5);b.c.push(c.r,c.g,c.b);
      }
      triangles+=2;
    }
  }
  // A continuous polygon panel can share a tile with the surrounding boxes.
  function panel(material, corners, tint=0xffffff) {
    const mat=materials[material];
    const pts=corners.map(p=>new T.Vector3(...p));
    const centre=pts.reduce((sum,p)=>sum.add(p),new T.Vector3()).multiplyScalar(.25);
    const key=mat.uuid+':'+Math.floor(centre.x/tileSize)+':'+Math.floor(centre.z/tileSize)+':0';
    let b=batches.get(key);
    if(!b){b={material:mat,detail:false,p:[],n:[],uv:[],c:[]};batches.set(key,b);}
    const normal=pts[1].clone().sub(pts[0]).cross(pts[3].clone().sub(pts[0])).normalize();
    c.set(tint);
    const uv=[[0,0],[1,0],[1,1],[0,1]];
    for(const i of [0,1,2,0,2,3]){
      b.p.push(...corners[i]);b.n.push(normal.x,normal.y,normal.z);
      b.uv.push(...uv[i]);b.c.push(c.r,c.g,c.b);
    }
    triangles+=2;
  }
  function finish() {
    const meshes=[];
    for(const b of batches.values()) {
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));
      g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));
      g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));
      g.computeBoundingSphere();g.computeBoundingBox();
      const mesh=new T.Mesh(g,b.material);mesh.name='NYC / '+b.material.name;
      mesh.receiveShadow=true;mesh.castShadow=b.material.userData.castShadow!==false;
      if(b.detail){mesh.userData.nycDistanceDetail=true;detailMeshes.push(mesh);}
      scene.add(mesh);meshes.push(mesh);
    }
    lod.detailMeshes=detailMeshes.length;lod.visibleDetailMeshes=detailMeshes.length;
    return {meshes,boxes,triangles,drawCalls:meshes.length,lod};
  }
  function updateVisibility(position){
    if(!position)return;let visible=0;
    for(const mesh of detailMeshes){const b=mesh.geometry.boundingBox,dx=Math.max(b.min.x-position.x,0,position.x-b.max.x),dz=Math.max(b.min.z-position.z,0,position.z-b.max.z);mesh.visible=dx*dx+dz*dz<lod.distance*lod.distance;if(mesh.visible)visible++;}
    lod.visibleDetailMeshes=visible;
  }
  function setQuality(level){lod.distance=level==='high'?100:level==='low'?40:68;}
  return {box,beam,panel,castColumn,finish,roofOccluders,setQuality,updateVisibility};
}

export function randomSource(seed=701) {
  let s=seed>>>0;
  return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
}
