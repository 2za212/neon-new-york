export function denseVoxelPhysics(meta,buffer,base){
 const {step,tileSize,tileCells:n}=meta,tiles=new Map();
 for(const tile of meta.tiles){
  tiles.set(tile.key,{...tile,offsets:new Uint32Array(buffer,tile.collisionOffset,tile.offsetCount),intervals:new Uint16Array(buffer,tile.collisionOffset+tile.offsetCount*4,tile.intervalCount)});
 }
 function column(x,z){
  const t=tiles.get(Math.floor(x/tileSize)+','+Math.floor(z/tileSize));if(!t)return null;
  const i=Math.floor((x-t.origin[0])/step),k=Math.floor((z-t.origin[2])/step);
  return {t,col:k*n+i};
 }
 function occupied(x,y,z){
  if(base.occupied(x,y,z))return true;
  const c=column(x,z);if(!c)return false;const {t,col}=c,j=Math.floor((y-t.origin[1])/step);
  for(let p=t.offsets[col];p<t.offsets[col+1];p+=2){if(j<t.intervals[p])break;if(j<t.intervals[p+1])return true;}return false;
 }
 function support(x,z,ceiling){
  let level=base.support(x,z,ceiling);const c=column(x,z);if(!c)return level;
  const {t,col}=c,top=Math.floor((ceiling-t.origin[1])/step+1e-7);
  for(let p=t.offsets[col+1]-2;p>=t.offsets[col];p-=2)if(t.intervals[p]<top){level=Math.max(level,t.origin[1]+Math.min(t.intervals[p+1],top)*step);break;}
  return level;
 }
 function ground(x,z,ceiling){let y=support(x,z,ceiling);for(const dx of [-.18,.18])for(const dz of [-.18,.18])y=Math.max(y,support(x+dx,z+dz,ceiling));return y;}
 function canMove(x,z,foot){
  if(Math.abs(x)>82||Math.abs(z)>68)return false;const next=ground(x,z,foot+.56);
  for(const dx of [-.17,.17])for(const dz of [-.17,.17])for(let y=next+.13;y<next+1.60;y+=.125)if(occupied(x+dx,y,z+dz))return false;return true;
 }
 return {ground,canMove,support,occupied};
}
