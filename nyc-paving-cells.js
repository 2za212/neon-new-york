import * as T from 'three';
import {unitDepth} from './nyc-unit-bond.js';
import {bindPavementUV} from './nyc-pavement-finish.js';

// Close paving uses real tops and risers. One 1.28 m reusable mould contains
// sixteen keyed setts. The dense surface follows the camera across the entire
// street network, upper landings and quays without storing a city-sized grid.
const span=1.28;
function mould(meters,road,usesBed){
  const p=[],n=[],uv=[],index=[],shades=[];
  function quad(points,normal,tone){
    const start=p.length/3;
    for(const [x,y,z] of points){p.push(x,y,z);n.push(...normal);uv.push(x/meters,z/meters);shades.push(tone,tone,tone);}
    index.push(start,start+1,start+2,start,start+2,start+3);
  }
  const level=(x,z)=>unitDepth(x&3,z&3,road?0:1)<0?0:1;
  const lift=road?.004:.010;
  const height=(x,z)=>(usesBed?0:.0015)+level(x,z)*lift;
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const a=col*.32,b=a+.32,c=row*.32,d=c+.32,h=height(col,row);
    // The bed itself is the top of each low cell. A duplicate plane here
    // would repaint markings or compete with the original paving at grazing angles.
    if(usesBed&&!h)continue;
    quad([[a,h,c],[a,h,d],[b,h,d],[b,h,c]],[0,1,0],1);
    // Join adjacent square caps. A closed, coplanar joint needs no wall.
    for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const low=height(col+dx,row+dz);
      if(low>=h)continue;
      const ends=dx<0?[[a,c],[a,d]]:dx>0?[[b,d],[b,c]]:dz<0?[[b,c],[a,c]]:[[a,d],[b,d]];
      const [[x,z],[xx,zz]]=ends;
      quad([[x,low,z],[xx,low,zz],[xx,h,zz],[x,h,z]],[dx,0,dz],.76);
    }
  }
  const g=new T.BufferGeometry();
  for(const [k,data,size] of [['position',p,3],['normal',n,3],['color',shades,3],['uv',uv,2]])
    g.setAttribute(k,new T.Float32BufferAttribute(data,size));
  g.setIndex(index);return g;
}
export function createPavingCells(scene){
  const grid=new Map(),groups=new Map(),geometries=new Map(),m=new T.Matrix4(),col=new T.Color();
  const bucket=8,key=(x,z)=>x+','+z;
  const protectedTiles=new Map(),placed=[];
  let lastX,lastY,lastZ,lastEyeX=Infinity,lastEyeZ=Infinity,radius=6;
  function protect(y,x0,x1,z0,z1){
    const h=Math.round(y*1e5);
    if(!protectedTiles.has(h))protectedTiles.set(h,new Set());
    const tiles=protectedTiles.get(h);
    for(let x=Math.floor(x0/span);x<=Math.floor((x1-.00001)/span);x++)
      for(let z=Math.floor(z0/span);z<=Math.floor((z1-.00001)/span);z++)tiles.add(key(x,z));
  }
  function register(mat,x,y,z,w,d,tint,mosaic=false){
    // Custom granite and trim already carry sculpted faces or a different
    // UV layout. The cell overlay must sample the identical finish as its bed.
    if(!mat.userData.worldUnitsUV&&(mat.map||mat.normalMap||mat.roughnessMap||mat.displacementMap||
      mat.bumpMap||mat.userData.assemblyUV||mat.userData.worldPavingUV||mat.userData.voxelSurfaceBaked))return;
    const min=mosaic?.32:span;
    if(w<min||d<min||w>300||d>500)return;
    const rect={mat,y,x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,tint,mosaic};
    // The bucket is addressed at a tile's centre. Store fragments which
    // reach into that tile even when they end just short of the bucket.
    const pad=mosaic?span/2:0;
    for(let a=Math.floor((rect.x0-pad)/bucket);a<=Math.floor((rect.x1+pad)/bucket);a++)
      for(let b=Math.floor((rect.z0-pad)/bucket);b<=Math.floor((rect.z1+pad)/bucket);b++){
        const k=key(a,b);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(rect);
      }
  }
  function group(mat){
    if(groups.has(mat))return groups.get(mat);
    bindPavementUV(mat);
    const meters=mat.userData.textureMeters||2.56;
    const road=/asphalt|roadbed|road surface/i.test(mat.name),usesBed=Boolean(mat.userData.worldUnitsUV);
    const id=meters+'/'+road+'/'+usesBed;
    if(!geometries.has(id))geometries.set(id,mould(meters,road,usesBed));
    const mesh=new T.InstancedMesh(geometries.get(id),mat,625);
    mesh.name='City / dressed paving / '+mat.name;mesh.count=0;mesh.frustumCulled=false;
    mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    groups.set(mat,mesh);scene.add(mesh);return mesh;
  }
  function floorAt(x,z,y){
    let floor=null,partial=null,top=-Infinity,raisedEdge=-Infinity;
    for(const r of grid.get(key(Math.floor((x+.64)/bucket),Math.floor((z+.64)/bucket)))||[]){
      if(r.y>y+.12||r.y<y-7)continue;
      if(x>=r.x0-.001&&z>=r.z0-.001&&x+span<=r.x1+.001&&z+span<=r.z1+.001){
        if(!floor||r.y>=floor.y)floor=r;
      }else{
        const width=Math.min(x+span,r.x1)-Math.max(x,r.x0),depth=Math.min(z+span,r.z1)-Math.max(z,r.z0);
        if(width<=0||depth<=0)continue;
        if(!r.mosaic){raisedEdge=Math.max(raisedEdge,r.y);continue;}
        top=Math.max(top,r.y);
        partial??=new Map();
        const id=r.mat.id+'/'+r.y+'/'+r.tint;
        const part=partial.get(id);
        if(part)part.area+=width*depth;else partial.set(id,{r,area:width*depth});
      }
    }
    // The winding core street is built of disjoint rectangular strips.
    // Only install a single mould where their union fills the entire tile.
    if(partial&&(!floor||top>=floor.y)){
      if(floor&&top>floor.y)floor=null;
      for(const {r,area} of partial.values())if(r.y===top&&area>=span*span-.0001){floor=r;break;}
    }
    return floor&&raisedEdge>floor.y+.00001&&raisedEdge<floor.y+.012?null:floor;
  }
  function update(eye){
    if(!eye)return;
    const ix=Math.floor(eye.x/span),iz=Math.floor(eye.z/span),iy=Math.round(eye.y*2);
    const rebuild=ix!==lastX||iz!==lastZ||iy!==lastY;
    if(!rebuild&&Math.max(Math.abs(lastEyeX-eye.x),Math.abs(lastEyeZ-eye.z))<.09)return;
    if(rebuild){
      lastX=ix;lastY=iy;lastZ=iz;placed.length=0;
      for(const mesh of groups.values()){mesh.count=0;mesh.visible=false;}
      for(let a=ix-radius;a<=ix+radius;a++)for(let b=iz-radius;b<=iz+radius;b++){
        const x=a*span,z=b*span,floor=floorAt(x,z,eye.y);
        if(!floor||protectedTiles.get(Math.round(floor.y*1e5))?.has(key(a,b)))continue;
        const mesh=group(floor.mat),i=mesh.count++;
        mesh.visible=true;mesh.setColorAt(i,col.set(floor.tint));placed.push([mesh,i,x,z,floor.y]);
      }
    }
    // A newly added outer ring starts below the underlying surface. The
    // physical relief eases in across three tiles; walking over a grid line
    // never makes a whole row appear at full relief ahead of the player.
    const end=(radius-.5)*span,fade=3*span;
    for(const [mesh,index,x,z,y] of placed){
      const distance=Math.hypot(eye.x-(x+span/2),eye.z-(z+span/2));
      const t=Math.max(0,Math.min(1,(end-distance)/fade));
      const scale=Math.max(.001,t*t*(3-2*t));
      m.makeScale(1,scale,1).setPosition(x,y-.0005,z);
      mesh.setMatrixAt(index,m);
    }
    lastEyeX=eye.x;lastEyeZ=eye.z;
    for(const mesh of groups.values())if(mesh.count){
      mesh.instanceMatrix.clearUpdateRanges();mesh.instanceMatrix.addUpdateRange(0,mesh.count*16);
      mesh.instanceMatrix.needsUpdate=true;
      if(rebuild){
        mesh.instanceColor.clearUpdateRanges();mesh.instanceColor.addUpdateRange(0,mesh.count*3);
        mesh.instanceColor.needsUpdate=true;
      }
    }
  }
  return {register,protect,update,setQuality(level){radius=level==='low'?6:level==='high'?11:8;lastX=null;}};
}
