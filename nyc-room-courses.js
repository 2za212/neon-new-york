import * as T from 'three';
import {cutCourses,emitSteps} from './nyc-block-shell.js';

// Return the exact grid crossings of an existing Blender face. This keeps a
// masonry joint aligned between individual baked bricks with different UVs.
function wallDivisions(at,travel,unit){
  const points=[0];
  for(let i=Math.ceil(Math.min(at,at+travel)/unit);i*unit<Math.max(at,at+travel);i++){
    const t=(i*unit-at)/travel;
    if(t>.012&&t<.988)points.push(t);
  }
  points.push(1);return points.sort((a,b)=>a-b);
}
function cutWallBond(p,u,v,normal,w,h,emit){
  if(Math.abs(normal.y)>.02||Math.max(Math.abs(normal.x),Math.abs(normal.z))<.999)return false;
  const side=Math.abs(normal.x)>.99?'z':'x',wall=side==='z'?p.x:p.z,dir=side==='z'?normal.x:normal.z;
  const isRoomWall=side==='z'?Math.abs(wall)>4.34:wall<-3.72||wall>6.35;
  if(!isRoomWall||wall*dir>=0||Math.min(w,h)<.145||Math.max(w,h)<.42)return false;
  const uHorizontal=Math.abs(u.y)<.01,vHorizontal=Math.abs(v.y)<.01;
  if(uHorizontal===vHorizontal)return false;
  const unit=w*h>2.56?.32:.16;
  const us=wallDivisions(uHorizontal?p[side]:p.y,uHorizontal?u[side]:u.y,unit);
  const vs=wallDivisions(vHorizontal?p[side]:p.y,vHorizontal?v[side]:v.y,unit);
  const nx=us.length-1,ny=vs.length-1,steps=new Int8Array(nx*ny);
  if(nx*ny>280)return false;
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const a=(us[i]+us[i+1])/2,b=(vs[j]+vs[j+1])/2;
    const col=Math.floor((p[side]+u[side]*a+v[side]*b)/unit),row=Math.floor((p.y+u.y*a+v.y*b)/unit);
    const cycle=((col+2*Math.floor(row/2))%8+8)%8;
    steps[j*nx+i]=cycle<2||cycle===2&&(row&1)?1:0;
  }
  // Carry full headers at the cheek without lifting the entire baked face.
  if(!steps.includes(1))return false;
  emitSteps(steps,nx,ny,i=>us[i],j=>vs[j],.16,emit);return true;
}

// Recover the rectangular block faces of the Blender bake. Its original UVs,
// vertex light and train-light weights are interpolated independently per face.
export function cutRoomMesh(source,family,structuralWall=false){
  const index=source.index,pos=source.attributes.position;
  if(!index||!pos)return source;
  const attrs=Object.entries(source.attributes),extra=new Map(attrs.map(([k])=>[k,[]])),out=[];
  const at=(i)=>new T.Vector3().fromBufferAttribute(pos,i);
  let added=0;const extraShade=[];
  for(let i=0;i<index.count;){
    const a=Array.from(index.array.subarray(i,i+6));
    const skip=()=>{out.push(...a.slice(0,3));i+=3;};
    if(a.length!==6||new Set(a).size!==4){skip();continue;}
    const edges=[];
    for(const k of [0,3])for(let j=0;j<3;j++)edges.push([a[k+j],a[k+(j+1)%3]]);
    const perimeter=edges.filter(([u,v])=>!edges.some(([j,k])=>j===v&&k===u));
    if(perimeter.length!==4){skip();continue;}
    const corners=[perimeter[0][0]];
    for(let j=1;j<4;j++)corners.push(perimeter.find(e=>e[0]===corners[j-1])?.[1]);
    if(corners.includes(undefined)){skip();continue;}
    const p=at(corners[0]),u=at(corners[1]).sub(p),v=at(corners[3]).sub(p);
    const w=u.length(),h=v.length();
    if(w*h<.08||Math.abs(u.dot(v))>.001*w*h||at(corners[2]).distanceTo(p.clone().add(u).add(v))>.002){skip();continue;}
    const normal=u.clone().cross(v).normalize();
    const emit=(quad,shade)=>{
      const verts=quad.map(([s,t,d])=>p.clone().addScaledVector(u,s).addScaledVector(v,t).addScaledVector(normal,d));
      const faceN=verts[1].clone().sub(verts[0]).cross(verts[3].clone().sub(verts[0])).normalize();
      const start=pos.count+added;added+=4;
      if(!source.attributes.color)extraShade.push(shade,shade,shade,shade);
      for(let j=0;j<4;j++)for(const [name,attr] of attrs){
        const data=extra.get(name),[s,t]=quad[j];
        if(name==='position'){data.push(...verts[j].toArray());continue;}
        if(name==='normal'){data.push(...faceN.toArray());continue;}
        for(let k=0;k<attr.itemSize;k++){
          const read=id=>attr.getComponent(id,k);
          const value=(1-s)*((1-t)*read(corners[0])+t*read(corners[3]))+s*((1-t)*read(corners[1])+t*read(corners[2]));
          data.push(name==='color'&&k<3?value*shade:value);
        }
      }
      out.push(start,start+1,start+2,start,start+2,start+3);
    };
    const ok=structuralWall&&cutWallBond(p,u,v,normal,w,h,emit)||
      cutCourses(w,h,normal.y,family,Math.round(p.x*4+p.y*7+p.z*3),emit,true);
    if(ok)i+=6;else skip();
  }
  if(!added)return source;
  const mesh=new T.BufferGeometry();
  for(const [name,attr] of attrs){
    const array=new Float32Array((pos.count+added)*attr.itemSize);
    for(let i=0;i<attr.count;i++)for(let k=0;k<attr.itemSize;k++)array[i*attr.itemSize+k]=attr.getComponent(i,k);
    array.set(extra.get(name),pos.count*attr.itemSize);mesh.setAttribute(name,new T.BufferAttribute(array,attr.itemSize));
  }
  if(extraShade.length){
    const array=new Uint8Array((pos.count+added)*3).fill(255);
    for(let j=0;j<extraShade.length;j++)array.fill(Math.min(255,Math.round(extraShade[j]*255)),(pos.count+j)*3,(pos.count+j+1)*3);
    mesh.setAttribute('color',new T.Uint8BufferAttribute(array,3,true));
  }
  mesh.setIndex(out);mesh.computeBoundingBox();mesh.computeBoundingSphere();return mesh;
}
