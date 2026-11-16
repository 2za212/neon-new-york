import * as T from 'three';
import {buildBlocks} from './blocks.js';
import {buildTowers} from './towers.js';

// Quarter-metre attachment geometry only. The supporting surfaces are recovered
// from the same source cuboids and rounding rule as the baked exterior.
export function addCityFacadeDetails(scene) {
  const unit=.25,source=[];
  function collect(x,y,z,w,h,d) {
    const lo=[x-w/2,y-h/2,z-d/2].map(v=>Math.round(v/unit)*unit);
    const hi=[x+w/2,y+h/2,z+d/2].map(v=>Math.round(v/unit)*unit);
    for(let i=0;i<3;i++)if(hi[i]<=lo[i])hi[i]=lo[i]+unit;
    source.push({lo,hi});
  }
  buildBlocks({box:collect});buildTowers({box:collect});
  function contact(origin,normal,reach=45) {
    const axis=normal[0]?0:2,cross=axis===0?2:0,sign=normal[axis];
    let nearest=reach,result=null;
    for(const b of source){
      if(origin[1]<b.lo[1]||origin[1]>=b.hi[1]||origin[cross]<b.lo[cross]||origin[cross]>=b.hi[cross])continue;
      const plane=sign>0?b.hi[axis]:b.lo[axis],distance=(origin[axis]-plane)*sign;
      if(distance<-.001||distance>=nearest)continue;
      nearest=distance;result=[...origin];result[axis]=plane;
    }
    return result;
  }
  const colors={
    wall:'#76878b',patch:'#64777d',edge:'#9aabb0',metal:'#4b626b',dark:'#1d3038',
    steel:'#718990',cyan:'#4cb2bd',amber:'#bda17b'
  };
  const pieces=Object.fromEntries(Object.keys(colors).map(key=>[key,[]]));
  const occupied=new Set(),groups=[];
  let rejected=0;
  function mounting(origin,normal,width=1.4,height=1.9,check=true){
    const p=contact(origin,normal);if(!p){rejected++;return null;}
    const right=[normal[2],0,-normal[0]],axis=normal[0]?0:2;
    if(check){
      for(const [u,v] of [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]]){
        const sample=[p[0]+right[0]*u*width+normal[0]*2,p[1]+v*height,p[2]+right[2]*u*width+normal[2]*2];
        const q=contact(sample,normal,4);
        if(!q||Math.abs(q[axis]-p[axis])>.01){rejected++;return null;}
      }
    }
    const basis=[Math.floor(p[0]/unit)*unit+.125,Math.floor(p[1]/unit)*unit+.125,Math.floor(p[2]/unit)*unit+.125];
    basis[axis]=p[axis];
    groups.push({point:p,normal,type:'panel'});
    function voxel(u,v,layer=0,kind='metal'){
      const x=basis[0]+right[0]*u*unit+normal[0]*(layer*unit+.125);
      const y=basis[1]+v*unit;
      const z=basis[2]+right[2]*u*unit+normal[2]*(layer*unit+.125);
      const key=x.toFixed(3)+','+y.toFixed(3)+','+z.toFixed(3);
      if(occupied.has(key))return;
      occupied.add(key);pieces[kind].push([x,y,z]);
    }
    function rect(u,v,w,h,depth=1,kind='metal'){
      for(let layer=0;layer<depth;layer++)for(let j=0;j<h;j++)for(let i=0;i<w;i++)voxel(u+i,v+j,layer,kind);
    }
    return {voxel,rect,p,right,normal};
  }
  function hatch(origin,normal,variant=0){
    const m=mounting(origin,normal,1.48,2.15);if(!m)return;
    // The reveals are individual small blocks. An offset upper corner and
    // the handle/circuit lock are solid details rather than painted graphics.
    m.rect(-2,-4,5,9,1,'dark');
    for(let j=-5;j<=5;j++)for(const u of [-3,3])m.voxel(u,j,0,j%3===0?'patch':'edge');
    for(let i=-3;i<=3;i++){m.voxel(i,-5,0,'steel');if(i<3)m.voxel(i,5,0,'edge');}
    m.rect(-2,4,5,1,2,'metal');m.rect(-2,-5,5,1,2,'metal');
    m.rect(1,-1,1,3,2,'edge');m.voxel(-1,1,1,'steel');
    if(variant%2===0){m.voxel(-2,3,1,'cyan');m.voxel(-1,3,1,'metal');}
    else m.voxel(-2,2,1,'amber');
  }
  function vent(origin,normal,variant=0){
    const m=mounting(origin,normal,1.25,1.25);if(!m)return;
    m.rect(-2,-2,5,5,1,'dark');
    for(let k=-3;k<=3;k++)for(const side of [-1,1]){
      m.voxel(k,side*3,0,'edge');m.voxel(side*3,k,0,'metal');
    }
    for(const v of [-2,0,2])m.rect(-2,v,5,1,2,variant?'patch':'steel');
    m.voxel(3,-3,1,'steel');m.voxel(-3,3,1,'steel');
  }
  function cabinet(origin,normal,variant=0){
    const m=mounting(origin,normal,.88,1.25);if(!m)return;
    m.rect(-1,-2,3,5,2,'metal');
    m.rect(-1,3,3,1,3,'edge');m.rect(-2,-3,5,1,1,'patch');
    for(const v of [-1,1])m.rect(-1,v,3,1,3,'dark');
    m.voxel(1,2,2,variant?'amber':'cyan');m.voxel(0,-2,2,'steel');
  }
  function conduits(origin,normal,variant=0){
    const m=mounting(origin,normal,1.15,2.4);if(!m)return;
    // Short right-angle cable routes, with 0.5 m clamp boxes at their joints.
    for(let j=-5;j<=3;j++){
      m.voxel(-1,j,0,j%4===0?'edge':'metal');
      if(j>=-3)m.voxel(1,j,0,j%3===0?'steel':'patch');
    }
    for(let u=-1;u<=3;u++)m.voxel(u,4,0,'metal');
    for(let u=1;u<=3;u++)m.voxel(u,-4,0,'patch');
    m.rect(-2,-1,2,2,2,'steel');m.rect(0,1,2,2,2,'metal');
    if(variant===1)m.voxel(-1,1,1,'cyan');
  }
  function wallFoot(origin,normal,length=3.5,variant=0){
    const right=[normal[2],0,-normal[0]];
    const count=Math.round(length/unit);
    for(let k=0;k<count;k++){
      const u=(k-(count-1)/2)*unit;
      const m=mounting([origin[0]+right[0]*u,.36,origin[2]+right[2]*u],normal,.2,.2,false);
      if(!m)continue;
      // Broken top edges stay within a half-metre of the existing facade.
      const tall=k%7===0?1:k%5===0?3:2;
      for(let j=0;j<tall;j++)m.voxel(0,j-1,0,(k+j+variant)%5===0?'edge':'patch');
      if(k%6<2)m.voxel(0,-1,1,'metal');
    }
  }

  // Food-shop side: attachment origins are on the open pedestrian side. The
  // analytic probes find x=-26.5/-28.0 faces rather than guessing one flat wall.
  hatch([-21.0,1.65,43.0],[1,0,0],0);
  vent([-21.0,2.45,46.5],[1,0,0],1);
  cabinet([-21.0,1.25,49.4],[1,0,0],1);
  conduits([-21.0,2.15,50.65],[1,0,0],1);
  wallFoot([-21.0,.36,44.2],[1,0,0],4.0,0);
  wallFoot([-21.0,.36,49.1],[1,0,0],3.0,1);
  // The opposite shoulder is related but does not repeat an identical kit.
  vent([22.0,2.35,41.4],[-1,0,0],0);
  cabinet([22.0,1.35,46.2],[-1,0,0],0);
  hatch([22.0,1.65,50.6],[-1,0,0],1);
  conduits([22.0,2.05,43.8],[-1,0,0],0);
  wallFoot([22.0,.36,46.2],[-1,0,0],3.5,1);
  // Front shop walls: the same dimensional language is seen from the approach.
  for(const [x,kind] of [[-47.8,0],[-41.4,1],[-29.6,2],[31.8,0],[38.6,2],[47.4,1]]){
    const origin=[x,kind===2?1.4:2.1,64];
    if(kind===0)vent(origin,[0,0,1],1);
    else if(kind===1)conduits(origin,[0,0,1],0);
    else cabinet(origin,[0,0,1],0);
    wallFoot([x,.36,64],[0,0,1],2.5,kind);
  }
  // Low service blocks behind the portal carry isolated repair/utility clusters.
  for(const [side,z,kind] of [[-1,3.5,0],[-1,10.0,1],[1,1.6,1],[1,11.0,0]]){
    const origin=[side*20,2.0,z],normal=[-side,0,0];
    if(kind)cabinet(origin,normal,1);else vent(origin,normal,0);
    conduits([origin[0],2.15,z+2],normal,0);
    wallFoot([origin[0],.36,z],normal,2.0,kind);
  }
  // Main-tower feet stay on the building side of the service cabinets and avenue.
  for(const [side,z] of [[-1,-19],[-1,-31.5],[1,-21],[1,-39]]){
    const normal=[-side,0,0],origin=[side*11.75,1.7,z];
    cabinet(origin,normal,1);
    conduits([origin[0],2.35,z-1.5],normal,0);
    wallFoot([origin[0],.36,z],normal,2.5,1);
  }
  const side=unit-.008,half=side/2;
  const geo=new T.BoxGeometry(side,side,side),object=new T.Object3D(),bounds=new T.Box3();
  const instanceTint=new T.Color();
  const meshes=[];
  for(const [key,items] of Object.entries(pieces)){
    if(!items.length)continue;
    const color=new T.Color(colors[key]),emission=key==='cyan'?.28:key==='amber'?.12:0;
    const material=new T.MeshStandardMaterial({color,roughness:key==='metal'||key==='steel'?.62:.87,
      metalness:key==='metal'||key==='steel'?.25:.06,emissive:emission?color:0x000000,emissiveIntensity:emission});
    const mesh=new T.InstancedMesh(geo,material,items.length);
    items.forEach(([x,y,z],i)=>{
      object.position.set(x,y,z);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);
      const hash=Math.sin(x*12.9898+y*78.233+z*37.719)*43758.5453;
      const brightness=.96+.08*(hash-Math.floor(hash));
      instanceTint.setRGB(brightness,brightness,brightness);mesh.setColorAt(i,instanceTint);
      bounds.expandByPoint(new T.Vector3(x-half,y-half,z-half));bounds.expandByPoint(new T.Vector3(x+half,y+half,z+half));
    });
    mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.name='quarter-voxel-facade-'+key;
    mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);meshes.push(mesh);
  }
  const stats={cubes:occupied.size,drawCalls:meshes.length,groups:groups.length,rejected,
    bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},nearFoodShop:groups.filter(g=>g.point[0]<-20&&g.point[0]>-33&&g.point[2]>40)};
  scene.userData.facadeDetail=stats;
  return stats;
}


