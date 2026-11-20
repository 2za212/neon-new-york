import * as T from 'three';

// Coordinates of an occupied cell boundary along one member. Exterior cells
// are one voxel deep. The solid interior is one run wherever no cut reaches it.
function sections(length,pitch){
  const n=Math.max(2,Math.round(length/pitch));
  if(n<=8)return Array.from({length:n+1},(_,i)=>length*(i/n-.5));
  const bay=Math.floor(n*.41);
  const knots=[0,1,2,bay,bay+1,n-2,n-1,n];
  if(n>24)knots.splice(5,0,n-5,n-4);
  return knots.map(i=>length*(i/n-.5));
}

// Faces with the same depth merge into one polygon. There are no invisible
// cubes in the solid core or polygons at the interface of abutting cells.
export function civicShellFaces(w,h,d,seed,emit){
  const shortest=Math.min(w,h,d);
  const grid=shortest<.88?.16:Math.max(w,h,d)>10?.64:.32;
  const axes=[w,h,d].map(v=>sections(v,grid)),dims=axes.map(a=>a.length-1);
  const [nx,ny,nz]=dims,volume=new Uint8Array(nx*ny*nz);
  const edge=(v,n)=>v===0||v===n-1;
  const thin=axes.map(a=>a.slice(1).map((value,i)=>value-a[i]<grid*1.17));
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const ex=edge(i,nx),ey=edge(j,ny),ez=edge(k,nz);
    // Interleaved corner headers change direction every two courses. Large
    // facade fields recess by one cell around paired, load-bearing keys.
    const diagonal=Number(i>0)^Number(k>0);
    const corner=ex&&ez&&ny>=3&&thin[1][j]&&diagonal===seed%2&&
      j===(i?1:ny-2);
    const wallX=i===0&&nx>3&&ny>3&&nz>4&&thin[2][k]&&k===3&&j===2+(seed%2);
    const wallZ=k===nz-1&&nz>3&&ny>3&&nx>4&&thin[0][i]&&i===nx-4&&j===ny-3;
    const coping=ey&&((k===0&&j===0&&nx>3&&thin[0][i]&&i===nx-2)||
      (i===0&&j===ny-1&&nz>3&&thin[2][k]&&k===1));
    if(!(corner||wallX||wallZ||coping))volume[i+nx*(j+ny*k)]=1;
  }
  const index=[0,0,0];
  const filled=()=>volume[index[0]+nx*(index[1]+ny*index[2])];
  const mask=new Uint8Array(Math.max(nx*ny,nx*nz,ny*nz));
  for(let axis=0;axis<3;axis++){
    const u=(axis+1)%3,v=(axis+2)%3,nu=dims[u],nv=dims[v];
    for(const sign of [-1,1])for(let layer=0;layer<dims[axis];layer++){
      mask.fill(0,0,nu*nv);
      const next=layer+sign,external=next<0||next>=dims[axis];
      for(let b=0;b<nv;b++)for(let a=0;a<nu;a++){
        index[u]=a;index[v]=b;index[axis]=layer;
        if(!filled())continue;
        index[axis]=next;
        if(external||!filled())mask[a+nu*b]=1;
      }
      const depth=axes[axis][sign===1?layer+1:layer];
      for(let b=0;b<nv;b++)for(let a=0;a<nu;a++){
        const off=b*nu+a;
        if(!mask[off])continue;
        let wide=1,tall=1;
        while(a+wide<nu&&mask[off+wide])wide++;
        outer:while(b+tall<nv){
          for(let q=0;q<wide;q++)if(!mask[off+tall*nu+q])break outer;
          tall++;
        }
        for(let j=0;j<tall;j++)mask.fill(0,off+j*nu,off+j*nu+wide);
        emit(axis,sign,depth,axes[u][a],axes[u][a+wide],axes[v][b],axes[v][b+tall],external?1:.73);
      }
    }
  }
}

const assembly=new Set(['hull','ceramic','alloy','composite','light']);
const coat={ceramic:0xccc9b6,alloy:0x8faab4,composite:0x63707a};
const repeat=new T.Color(),ink=new T.Color();

function jointMaterial(lens){
  const mat=lens?new T.MeshBasicMaterial({vertexColors:true}):
    new T.MeshStandardMaterial({vertexColors:true,roughness:.61,metalness:.18});
  mat.name=lens?'北核 / 发光晶格':'北核 / 咬合结构体';
  // Same-sized cell endgrain on merged faces. This does not supply the shape:
  // the flat facets and their silhouettes are the external occupancy faces.
  mat.onBeforeCompile=shader=>{
    shader.vertexShader='attribute vec3 jointCoord;varying vec3 vJointCoord;\n'+shader.vertexShader
      .replace('#include <begin_vertex>','#include <begin_vertex>\n vJointCoord=jointCoord;');
    shader.fragmentShader='varying vec3 vJointCoord;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      vec3 cell=floor(vJointCoord+0.0003);
      float grade=fract(dot(mod(cell,vec3(13.,17.,19.)),vec3(.413,.267,.377)));
      vec3 f=fract(vJointCoord),aa=fwidth(vJointCoord);
      vec3 seam=smoothstep(vec3(.0),max(aa,vec3(.018))+.035,min(f,1.-f));
      vec3 live=step(vec3(.00004),aa);
      float contact=min(min(mix(1.,seam.x,live.x),mix(1.,seam.y,live.y)),mix(1.,seam.z,live.z));
      float fade=1.-smoothstep(.18,.70,max(aa.x,max(aa.y,aa.z)));
      diffuseColor.rgb*=${lens?'2.2':'1.'}*(1.+fade*((grade-.5)*${lens?'.17':'.27'}-.12*(1.-contact)));
    `);
  };
  mat.customProgramCacheKey=()=>lens?'civic-crystal-cells-v1':'civic-structural-cells-v1';
  return mat;
}

export function civicCellShell(scene){
  const chunks=new Map(),near=[];
  const skins=[jointMaterial(false),jointMaterial(true)];
  let count=0,fineTriangles=0,coarseTriangles=0;
  function add(kind,tint,x,y,z,w,h,d,angle,parent){
    if(parent!==scene||!assembly.has(kind)||y-h*.5>24||Math.min(w,h,d)<.30)return false;
    const spans=[w,h,d].sort((a,b)=>a-b);
    if(spans[1]<.80||spans[2]<1.60)return false;
    const glow=kind==='light',key=Math.floor(x/32)+'/'+Math.floor(z/32)+'/'+Number(glow);
    if(!chunks.has(key))chunks.set(key,{glow,boxes:[]});
    chunks.get(key).boxes.push({kind,tint,x,y,z,w,h,d,angle});
    count++;
    return true;
  }
  function finish(){
    for(const group of chunks.values()){
      const pos=[],norm=[],color=[],coords=[],fine=[],coarse=[];
      for(const box of group.boxes){
        const {kind,tint,x,y,z,w,h,d,angle}=box,c=Math.cos(angle),s=Math.sin(angle);
        ink.setHex(tint);
        if(coat[kind])ink.multiply(repeat.setHex(coat[kind]));
        // Keep the atlas's two HDR lens colours representable in a packed
        // 8-bit vertex colour. The lens shader restores the full linear range.
        if(group.glow&&tint!==0xe089ff&&tint!==0xc2f7ff)ink.multiplyScalar(1/2.2);
        const loc=[0,0,0],normal=[0,0,0],half=[w/2,h/2,d/2];
        const seed=Math.abs(Math.round(x*5+y*7+z*3));
        const pitch=Math.min(w,h,d)<.88?.16:.32;
        const ax=x*c-z*s,az=x*s+z*c;
        function quad(target,axis,sign,depth,a,b,e,f,shade){
          const u=(axis+1)%3,v=(axis+2)%3,base=pos.length/3;
          normal.fill(0);normal[axis]=sign;loc[axis]=depth;
          const nx=normal[0]*c+normal[2]*s,nz=-normal[0]*s+normal[2]*c;
          for(let k=0;k<4;k++){
            loc[u]=k===1||k===2?b:a;loc[v]=k>1?f:e;
            pos.push(x+c*loc[0]+s*loc[2],y+loc[1],z-s*loc[0]+c*loc[2]);
            norm.push(Math.round(nx*127),normal[1]*127,Math.round(nz*127));
            coords.push((loc[0]+ax)/pitch,(loc[1]+y)/pitch,(loc[2]+az)/pitch);
            color.push(Math.min(255,Math.round(255*shade*ink.r)),Math.min(255,Math.round(255*shade*ink.g)),Math.min(255,Math.round(255*shade*ink.b)));
          }
          if(sign>0)target.push(base,base+1,base+2,base,base+2,base+3);
          else target.push(base,base+2,base+1,base,base+3,base+2);
        }
        for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
          const u=(axis+1)%3,v=(axis+2)%3;
          quad(coarse,axis,sign,sign*half[axis],-half[u],half[u],-half[v],half[v],1);
        }
        civicShellFaces(w,h,d,seed,(...args)=>quad(fine,...args));
      }
      const geo=new T.BufferGeometry();
      geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
      geo.setAttribute('normal',new T.Int8BufferAttribute(norm,3,true));
      geo.setAttribute('color',new T.Uint8BufferAttribute(color,3,true));
      geo.setAttribute('jointCoord',new T.Float32BufferAttribute(coords,3));
      geo.setIndex(coarse.concat(fine));geo.setDrawRange(0,coarse.length);geo.computeBoundingBox();geo.computeBoundingSphere();
      const mesh=new T.Mesh(geo,skins[Number(group.glow)]);
      mesh.name='北部核心区 / 交错体素接头';
      mesh.receiveShadow=mesh.castShadow=!group.glow;scene.add(mesh);
      near.push({geo,coarse:coarse.length,fine:fine.length,active:false});
      coarseTriangles+=coarse.length/3;fineTriangles+=fine.length/3;
    }
    chunks.clear();
    return {boxes:count,draws:near.length,coarseTriangles,fineTriangles};
  }
  function update(camera){
    if(!camera)return;
    for(const g of near){
      const active=g.geo.boundingBox.distanceToPoint(camera)<(g.active?29:24);
      if(g.active!==active){
        g.active=active;
        g.geo.setDrawRange(active?g.coarse:0,active?g.fine:g.coarse);
      }
    }
  }
  return {add,finish,update};
}
