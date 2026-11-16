const fs=require('node:fs');
const {buildSync}=require('esbuild');
const source=`
import {buildTowers} from './towers.js';import {buildBlocks} from './blocks.js';
import {buildStreets} from './streets.js';import {buildFigures} from './scale-figures.js';
import {buildUrbanLayer} from './urban-layer.js';
export function collect(box){const api={box};buildStreets(api);buildTowers(api);buildBlocks({...api,excludeFront:true});buildFigures(api);buildUrbanLayer(api);}
`;
const bundled=buildSync({stdin:{contents:source,resolveDir:__dirname,sourcefile:'city-bake-source.js'},bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const mod={exports:{}};new Function('module','exports',bundled)(mod,mod.exports);
const kinds=['body','trim','recess','metal','road','base'],parts=[];
mod.exports.collect((x,y,z,w,h,d,kind='body',options={})=>parts.push({x,y,z,w,h,d,kind,yaw:options.yaw||0}));
const step=.25;
const bounds=[
 Math.floor(Math.min(...parts.map(p=>p.x-p.w/2)) /step)*step-step,
 Math.floor(Math.min(...parts.map(p=>p.y-p.h/2)) /step)*step-step,
 Math.floor(Math.min(...parts.map(p=>p.z-p.d/2)) /step)*step-step
];
const extent=[
 Math.max(...parts.map(p=>p.x+p.w/2)),
 Math.max(...parts.map(p=>p.y+p.h/2)),
 Math.max(...parts.map(p=>p.z+p.d/2))
];
const dims=extent.map((v,i)=>Math.ceil((v-bounds[i])/step)+2);
const [nx,ny,nz]=dims,stride=nx*nz;
const cells=new Uint8Array(nx*ny*nz);
function limits(center,size,origin,max){
 let lo=Math.round((center-size/2-origin)/step),hi=Math.round((center+size/2-origin)/step);
 if(hi<=lo){lo=Math.round((center-origin)/step-.5);hi=lo+1;}
 return [Math.max(0,lo),Math.min(max,hi)];
}
for(const p of parts){
 const quarter=Math.round(p.yaw/(Math.PI/2)),rightAngle=Math.abs(p.yaw-quarter*Math.PI/2)<.0001;
 let w=p.w,d=p.d;if(rightAngle&&Math.abs(quarter)%2){w=p.d;d=p.w;}
 const ca=Math.cos(p.yaw),sa=Math.sin(p.yaw);
 const sizeX=rightAngle?w:Math.abs(ca)*p.w+Math.abs(sa)*p.d,sizeZ=rightAngle?d:Math.abs(sa)*p.w+Math.abs(ca)*p.d;
 const [x0,x1]=limits(p.x,sizeX,bounds[0],nx),[z0,z1]=limits(p.z,sizeZ,bounds[2],nz);
 let [y0,y1]=limits(p.y,p.h,bounds[1],ny);
 // Very thin horizontal street details color the support cell instead of becoming bumps.
 if(p.y<.4&&p.h<.14){y1=Math.max(1,Math.round((p.y+p.h/2-bounds[1])/step));y0=y1-1;}
 const color=kinds.indexOf(p.kind)+1;if(!color)throw Error(p.kind);
 for(let j=y0;j<y1;j++)for(let k=z0;k<z1;k++){
   const row=j*stride+k*nx;
   if(rightAngle){cells.fill(color,row+x0,row+x1);continue;}
   for(let i=x0;i<x1;i++){
     const dx=bounds[0]+(i+.5)*step-p.x,dz=bounds[2]+(k+.5)*step-p.z;
     if(Math.abs(dx*ca-dz*sa)<p.w/2+step*.15&&Math.abs(dx*sa+dz*ca)<p.d/2+step*.15)cells[row+i]=color;
   }
 }
}
const outputDir='public';
const collision=require('./collision-columns.cjs')({cells,dims,outputDir});
const palette=[0,0xb9bec4,0xdee2e6,0x515a66,0x88939e,0x737e88,0xa1aab4];
const mesh=require('./mesh-pack.cjs').packMesh({cells,dims,origin:bounds,step,kinds,palette,outputDir,reliefEnabled:false});
const sourceMin=[Infinity,Infinity,Infinity],sourceMax=[-Infinity,-Infinity,-Infinity];
for(const p of parts){
 const ca=Math.cos(p.yaw),sa=Math.sin(p.yaw),w=Math.abs(ca)*p.w+Math.abs(sa)*p.d,d=Math.abs(sa)*p.w+Math.abs(ca)*p.d;
 for(const [axis,min,max] of [[0,p.x-w/2,p.x+w/2],[1,p.y-p.h/2,p.y+p.h/2],[2,p.z-d/2,p.z+d/2]]){
  sourceMin[axis]=Math.min(sourceMin[axis],min);sourceMax[axis]=Math.max(sourceMax[axis],max);
 }
}
const meta={appearanceVersion:'dense-sculpt2',step,origin:bounds,dims,kinds,sourceParts:parts.length,solidVoxels:collision.solidVoxels,sourceBounds:{min:sourceMin,max:sourceMax},collision,mesh};
fs.writeFileSync('public/voxel-model.json',JSON.stringify(meta));
console.log({step,sourceParts:meta.sourceParts,solidVoxels:meta.solidVoxels,meshFaces:mesh.faceCount,sourceBounds:meta.sourceBounds});

