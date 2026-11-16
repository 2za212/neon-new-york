'use strict';
const fs=require('node:fs');
const {buildSync}=require('esbuild');
const {classifySurface}=require('./material-zones.cjs');
const source=`import {buildDenseHousing} from './dense-housing.js';import {buildDenseTowerDetails} from './dense-tower-details.js';import {buildDenseStreetProps} from './dense-street-props.js';export function collect(api){buildDenseHousing(api);buildDenseTowerDetails(api);buildDenseStreetProps(api);}`;
const bundle=buildSync({stdin:{contents:source,resolveDir:__dirname},bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const mod={exports:{}};new Function('module','exports',bundle)(mod,mod.exports);
const step=.125,tileSize=12,n=tileSize/step,kinds=['body','trim','recess','metal'];
const parts=[];
function primitive(type,x,y,z,w,h,d,kind='body',extra={}){
 if(![x,y,z,w,h,d].every(Number.isFinite)||Math.min(w,h,d)<=0)throw Error('Invalid dense primitive '+type);
 const slot=kinds.indexOf(kind);if(slot<0)throw Error('Unknown dense kind '+kind);
 parts.push({type,x,y,z,w,h,d,kind,slot:slot+1,...extra,lo:[x-w/2,y-h/2,z-d/2],hi:[x+w/2,y+h/2,z+d/2]});
}
const api={
 box:(x,y,z,w,h,d,kind)=>primitive('box',x,y,z,w,h,d,kind),
 roundedBox:(x,y,z,w,h,d,r,kind)=>primitive('rounded',x,y,z,w,h,d,kind,{r:Math.min(r,w/2,h/2,d/2)}),
 cylinder:(x,y,z,r,h,kind,axis='y')=>primitive('cylinder',x,y,z,axis==='x'?h:r*2,axis==='y'?h:r*2,axis==='z'?h:r*2,kind,{r,axis}),
 ellipsoid:(x,y,z,rx,ry,rz,kind)=>primitive('ellipsoid',x,y,z,rx*2,ry*2,rz*2,kind)
};
mod.exports.collect(api);
const tileKeys=new Set();
for(const p of parts)for(let tz=Math.floor(p.lo[2]/tileSize);tz<=Math.floor((p.hi[2]-1e-8)/tileSize);tz++)for(let tx=Math.floor(p.lo[0]/tileSize);tx<=Math.floor((p.hi[0]-1e-8)/tileSize);tx++)tileKeys.add(tx+','+tz);
const surfaceBuffers=[],collisionBuffers=[],tiles=[];
let cellOffset=0,collisionOffset=0,totalFaces=0,totalSolid=0;
const srgbByte=v=>{v=Math.max(0,Math.min(1,v));return Math.round((v<=.04045?v/12.92:((v+.055)/1.055)**2.4)*255);};
for(const key of [...tileKeys].sort()){
 const [tx,tz]=key.split(',').map(Number),x0=tx*tileSize,z0=tz*tileSize;
 const relevant=parts.filter(p=>p.hi[0]>=x0-step&&p.lo[0]<=x0+tileSize+step&&p.hi[2]>=z0-step&&p.lo[2]<=z0+tileSize+step);
 const oy=Math.floor(Math.min(-.25,...relevant.map(p=>p.lo[1]))/step)*step-step;
 const ny=Math.ceil((Math.max(...relevant.map(p=>p.hi[1]))-oy)/step)+2,side=n+2,stride=side*side;
 const cells=new Uint8Array(stride*ny),ox=x0-step,oz=z0-step;
 function limits(c,size,o,max){let a=Math.round((c-size/2-o)/step),b=Math.round((c+size/2-o)/step);if(b<=a)b=a+1;return [Math.max(0,a),Math.min(max,b)];}
 for(const p of relevant){
  const [xa,xb]=limits(p.x,p.w,ox,side),[ya,yb]=limits(p.y,p.h,oy,ny),[za,zb]=limits(p.z,p.d,oz,side);
  for(let y=ya;y<yb;y++)for(let z=za;z<zb;z++){
   const row=y*stride+z*side;
   if(p.type==='box'){cells.fill(p.slot,row+xa,row+xb);continue;}
   const dy=oy+(y+.5)*step-p.y,dz=oz+(z+.5)*step-p.z;
   for(let x=xa;x<xb;x++){
    const dx=ox+(x+.5)*step-p.x;let inside=false;
    if(p.type==='ellipsoid')inside=(dx/(p.w/2))**2+(dy/(p.h/2))**2+(dz/(p.d/2))**2<=1;
    else if(p.type==='cylinder')inside=p.axis==='x'?dy*dy+dz*dz<=p.r*p.r:p.axis==='z'?dx*dx+dy*dy<=p.r*p.r:dx*dx+dz*dz<=p.r*p.r;
    else{
     const qx=Math.abs(dx)-(p.w/2-p.r),qy=Math.abs(dy)-(p.h/2-p.r),qz=Math.abs(dz)-(p.d/2-p.r);
     inside=Math.hypot(Math.max(qx,0),Math.max(qy,0),Math.max(qz,0))+Math.min(Math.max(qx,qy,qz),0)<=p.r;
    }
    if(inside)cells[row+x]=p.slot;
   }
  }
 }
 let count=0,faces=0,solid=0;
 function maskAt(i){return (cells[i-1]?0:1)|(cells[i+1]?0:2)|(cells[i-stride]?0:4)|(cells[i+stride]?0:8)|(cells[i-side]?0:16)|(cells[i+side]?0:32);}
 for(let y=1;y<ny-1;y++)for(let z=1;z<=n;z++)for(let x=1;x<=n;x++){
  const i=y*stride+z*side+x;if(!cells[i])continue;solid++;const mask=maskAt(i);if(mask){count++;for(let bit=1;bit<=32;bit*=2)if(mask&bit)faces++;}
 }
 if(!count)continue;
 const output=Buffer.allocUnsafe(count*12);let cursor=0;
 for(let y=1;y<ny-1;y++)for(let z=1;z<=n;z++)for(let x=1;x<=n;x++){
  const i=y*stride+z*side+x,kind=cells[i];if(!kind)continue;const mask=maskAt(i);if(!mask)continue;
  const wx=x0+(x-.5)*step,wy=oy+(y+.5)*step,wz=z0+(z-.5)*step;
  let face=mask&1?0:mask&2?1:mask&16?4:mask&32?5:mask&8?3:2;
  const s=classifySurface(wx,wy,wz,kinds[kind-1],face);
  if(Math.abs(wx)>24&&Math.abs(wx)<56&&wz>30&&wz<54){
   if(kinds[kind-1]==='body'){s.material=1;s.tint=[.97,.98,1];}
   if(kinds[kind-1]==='trim'){s.material=2;s.tint=[.95,.98,1];}
  }
  output.writeUInt16LE(x-1,cursor);output.writeUInt16LE(y,cursor+2);output.writeUInt16LE(z-1,cursor+4);
  output[cursor+6]=s.material;output[cursor+7]=mask;
  output[cursor+8]=srgbByte(s.tint[0]);output[cursor+9]=srgbByte(s.tint[1]);output[cursor+10]=srgbByte(s.tint[2]);output[cursor+11]=s.emission||0;cursor+=12;
 }
 const offsets=new Uint32Array(n*n+1),intervals=[];
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){
  offsets[z*n+x]=intervals.length;let start=-1;
  for(let y=0;y<=ny;y++){
   const occupied=y<ny&&cells[y*stride+(z+1)*side+x+1]!==0;
   if(occupied&&start<0)start=y;
   if(!occupied&&start>=0){intervals.push(start,y);start=-1;}
  }
 }
 offsets[n*n]=intervals.length;
 const collision=Buffer.alloc(offsets.byteLength+intervals.length*2);
 Buffer.from(offsets.buffer).copy(collision);intervals.forEach((v,i)=>collision.writeUInt16LE(v,offsets.byteLength+i*2));
 tiles.push({key,origin:[x0,oy,z0],ny,cellOffset,count,faceCount:faces,collisionOffset,offsetCount:offsets.length,intervalCount:intervals.length});
 surfaceBuffers.push(output);collisionBuffers.push(collision);
 cellOffset+=output.byteLength;collisionOffset+=collision.byteLength;totalFaces+=faces;totalSolid+=solid;
 console.log('dense tile',key,'surface',count,'faces',faces);
}
const meta={version:'dense-sculpt3',step,tileSize,tileCells:n,cellStride:12,sourceParts:parts.length,surfaceCells:cellOffset/12,exposedFaces:totalFaces,solidVoxels:totalSolid,tiles};
fs.writeFileSync('public/dense-cells.bin',Buffer.concat(surfaceBuffers));fs.writeFileSync('public/dense-collision.bin',Buffer.concat(collisionBuffers));fs.writeFileSync('public/dense-model.json',JSON.stringify(meta));
console.log(JSON.stringify({dense:true,parts:parts.length,tiles:tiles.length,surfaceCells:meta.surfaceCells,farTriangles:totalFaces*2,bytes:cellOffset,collisionBytes:collisionOffset}));
