const fs=require('node:fs'),path=require('node:path');
module.exports=function packCollision({cells,dims,outputDir}){
 const [nx,ny,nz]=dims,stride=nx*nz,columns=nx*nz;
 const offsets=new Uint32Array(columns+1);
 let intervals=0,solidVoxels=0;
 for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){
   let solid=false;
   for(let j=0;j<ny;j++){
     const next=cells[j*stride+k*nx+i]>0;
     if(next)solidVoxels++;
     if(next&&!solid)intervals++;
     solid=next;
   }
   offsets[k*nx+i+1]=intervals*2;
 }
 const runs=new Uint16Array(intervals*2);let ptr=0;
 for(let k=0;k<nz;k++)for(let i=0;i<nx;i++){
   let start=-1;
   for(let j=0;j<=ny;j++){
     const solid=j<ny&&cells[j*stride+k*nx+i]>0;
     if(solid&&start<0)start=j;
     if(!solid&&start>=0){runs[ptr++]=start;runs[ptr++]=j;start=-1;}
   }
 }
 const file='solid-columns.bin';
 fs.writeFileSync(path.join(outputDir,file),Buffer.concat([Buffer.from(offsets.buffer),Buffer.from(runs.buffer)]));
 return {file,offsetCount:offsets.length,intervalCount:intervals,solidVoxels};
};
