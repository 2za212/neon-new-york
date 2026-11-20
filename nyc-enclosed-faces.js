// Only permanently opaque axis-aligned solids can bury another face. The
// query probes on the outward side, so a box cannot cull its own exterior.
const stride=6;
const key=(x,y,z)=>(x+512)*1048576+(y+512)*1024+z+512;
export function createSolidIndex(){
  const grid=new Map();
  function insert(x,y,z,w,h,d){
    if(Math.min(w,h,d)<.14||Math.max(w,h,d)>180)return;
    const box=[x-w/2,y-h/2,z-d/2,x+w/2,y+h/2,z+d/2];
    for(let a=Math.floor(box[0]/stride);a<=Math.floor(box[3]/stride);a++)
      for(let b=Math.floor(box[1]/stride);b<=Math.floor(box[4]/stride);b++)
        for(let c=Math.floor(box[2]/stride);c<=Math.floor(box[5]/stride);c++){
          const id=key(a,b,c);let list=grid.get(id);
          if(!list){list=[];grid.set(id,list);}list.push(box);
        }
  }
  function buried(p,n,offset){
    const a=p[offset],b=p[offset+1],c=p[offset+2],h=offset+6;
    const list=grid.get(key(Math.floor((a+p[h])/(2*stride)),Math.floor((b+p[h+1])/(2*stride)),Math.floor((c+p[h+2])/(2*stride))));
    if(!list)return false;
    const low=[a,b,c],high=[a,b,c];
    for(let j=1;j<4;j++)for(let k=0;k<3;k++){const v=p[offset+j*3+k];low[k]=Math.min(low[k],v);high[k]=Math.max(high[k],v);}
    // Allow the maximum physical cut on a concealing face. At exactly mated
    // ends with no surrounding cover, both originals stay intact.
    for(let k=0;k<3;k++){low[k]+=.001*n[offset+k];high[k]+=.001*n[offset+k];}
    return list.some(box=>low[0]>box[0]+.195&&low[1]>box[1]+.195&&low[2]>box[2]+.195&&
      high[0]<box[3]-.195&&high[1]<box[4]-.195&&high[2]<box[5]-.195);
  }
  function prune(b){
    const {p,n,c,uv}=b,structural=new Set(),source=b.structural||new Set();
    let write=0;const total=p.length/12,thickness=source.size?new Float32Array(total):null;
    // Keep complete six-face entries for the sculptor by passing explicit
    // face indices after compaction. All surviving attributes remain aligned.
    let structuralEnd=-1;
    for(let face=0;face<total;face++){
      if(source.has(face))structuralEnd=face+6;
      if(buried(p,n,face*12))continue;
      if(face<structuralEnd){
        structural.add(write);
        // Box faces were appended in three opposite pairs. Measure on the
        // stored normal, including for a box rotated in the street grid.
        const i=face*12,mate=i+((structuralEnd-face)%2?-12:12);
        thickness[write]=Math.abs((p[i]-p[mate])*n[i]+(p[i+1]-p[mate+1])*n[i+1]+(p[i+2]-p[mate+2])*n[i+2]);
      }
      if(write!==face){
        for(const arr of [p,n,c])arr.copyWithin(write*12,face*12,face*12+12);
        uv.copyWithin(write*8,face*8,face*8+8);
      }
      write++;
    }
    p.length=n.length=c.length=write*12;uv.length=write*8;b.structural=structural;b.structuralThickness=thickness;
    return total-write;
  }
  return {insert,prune,clear:()=>grid.clear()};
}
