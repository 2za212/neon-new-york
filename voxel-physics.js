// Sparse solid intervals retain the exact fine voxel surface for walking.
export function voxelPhysics(meta,buffer){
 const [nx,ny,nz]=meta.dims,[ox,oy,oz]=meta.origin,step=meta.step;
 const offsetCount=meta.collision.offsetCount;
 const offsets=new Uint32Array(buffer,0,offsetCount);
 const intervals=new Uint16Array(buffer,offsetCount*4);
 function column(x,z){
   const i=Math.floor((x-ox)/step),k=Math.floor((z-oz)/step);
   return i>=0&&k>=0&&i<nx&&k<nz?k*nx+i:-1;
 }
 function occupied(x,y,z){
   const col=column(x,z),j=Math.floor((y-oy)/step);
   if(col<0||j<0||j>=ny)return false;
   for(let p=offsets[col];p<offsets[col+1];p+=2){
     if(j<intervals[p])return false;
     if(j<intervals[p+1])return true;
   }
   return false;
 }
 function support(x,z,ceiling){
   const col=column(x,z);if(col<0)return 0;
   const top=Math.min(ny,Math.floor((ceiling-oy)/step+1e-7));
   for(let p=offsets[col+1]-2;p>=offsets[col];p-=2){
     if(intervals[p]<top)return oy+Math.min(intervals[p+1],top)*step;
   }
   return 0;
 }
 function ground(x,z,ceiling){
   let level=support(x,z,ceiling);
   for(const dx of [-.18,.18])for(const dz of [-.18,.18])level=Math.max(level,support(x+dx,z+dz,ceiling));
   return level;
 }
 function canMove(x,z,foot){
   if(Math.abs(x)>82||Math.abs(z)>68)return false;
   const next=ground(x,z,foot+.56);
   for(const dx of [-.17,.17])for(const dz of [-.17,.17]){
     for(let y=next+.13;y<next+1.60;y+=.125)if(occupied(x+dx,y,z+dz))return false;
   }
   return true;
 }
 return {ground,canMove,occupied,support};
}
