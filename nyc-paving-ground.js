// District footprints meet on the same physical street datum. Keep inlaid
// finishes and the exposed part of each underlay without using depth bias.
const epsilon=1e-5, bin=8;
const markings=/road paint|road marking|traffic yellow|tactile/i;

function groundFace(batch,i){
  const p=batch.p,k=i*12,y=p[k+1];
  if(y<-.08||y>1.2||batch.n[k+1]<.99999)return;
  const x=p[k],z=p[k+2],ux=p[k+3]-x,uz=p[k+5]-z,vx=p[k+9]-x,vz=p[k+11]-z;
  if(Math.abs(p[k+4]-y)+Math.abs(p[k+7]-y)+Math.abs(p[k+10]-y)>epsilon||
    Math.abs(p[k+6]-x-ux-vx)+Math.abs(p[k+8]-z-uz-vz)>epsilon)return;
  if(!((Math.abs(ux)<epsilon&&Math.abs(vz)<epsilon)||(Math.abs(uz)<epsilon&&Math.abs(vx)<epsilon)))return;
  const x0=Math.min(x,p[k+6]),x1=Math.max(x,p[k+6]);
  const z0=Math.min(z,p[k+8]),z1=Math.max(z,p[k+8]);
  const area=(x1-x0)*(z1-z0);
  if(Math.min(x1-x0,z1-z0)<.08||area<.12)return;
  return {batch,i,y,area,x0,x1,z0,z1,paint:markings.test(batch.material.name)};
}

function cut(a,cover){
  const x0=Math.max(a.x0,cover.x0),z0=Math.max(a.z0,cover.z0);
  const x1=Math.min(a.x1,cover.x1),z1=Math.min(a.z1,cover.z1);
  if(x1-x0<=epsilon||z1-z0<=epsilon)return;
  const keep=[];
  if(a.x0<x0-epsilon)keep.push({x0:a.x0,x1:x0,z0:a.z0,z1:a.z1});
  if(x1<a.x1-epsilon)keep.push({x0:x1,x1:a.x1,z0:a.z0,z1:a.z1});
  if(a.z0<z0-epsilon)keep.push({x0,x1,z0:a.z0,z1:z0});
  if(z1<a.z1-epsilon)keep.push({x0,x1,z0:z1,z1:a.z1});
  return {keep,x0,x1,z0,z1};
}

function interpolate(values,offset,stride,c,s,t){
  const a=values[offset+c],b=values[offset+stride+c];
  const d=values[offset+3*stride+c],e=values[offset+2*stride+c];
  return (a*(1-s)+b*s)*(1-t)+(d*(1-s)+e*s)*t;
}
function fragment(b,i,r){
  const k=i*12,j=i*8,x=b.p[k],z=b.p[k+2],y=b.p[k+1];
  const ux=b.p[k+3]-x,uz=b.p[k+5]-z,vx=b.p[k+9]-x,vz=b.p[k+11]-z;
  const midX=(r.x0+r.x1)/2,midZ=(r.z0+r.z1)/2;
  for(let q=0;q<4;q++){
    const xx=b.p[k+q*3]<midX?r.x0:r.x1,zz=b.p[k+q*3+2]<midZ?r.z0:r.z1;
    const s=((xx-x)*ux+(zz-z)*uz)/(ux*ux+uz*uz),t=((xx-x)*vx+(zz-z)*vz)/(vx*vx+vz*vz);
    b.p.push(xx,y,zz);b.n.push(0,1,0);
    for(let a=0;a<3;a++)b.c.push(interpolate(b.c,k,3,a,s,t));
    for(let a=0;a<2;a++)b.uv.push(interpolate(b.uv,j,2,a,s,t));
  }
}
function compact(b,changes){
  const count=b.p.length/12;
  const sourceThickness=b.structuralThickness,fragmentOwners=[];
  for(const [i,pieces] of changes){
    for(const r of pieces){
      if(b.structural?.has(i))b.structural.add(b.p.length/12);
      if(sourceThickness)fragmentOwners.push(i);
      fragment(b,i,r);
    }
  }
  const structural=new Set();
  const thickness=sourceThickness?new Float32Array(b.p.length/12-changes.size):null;
  let write=0;
  for(let i=0,end=b.p.length/12;i<end;i++){
    if(i<count&&changes.has(i))continue;
    if(b.structural?.has(i))structural.add(write);
    if(thickness)thickness[write]=sourceThickness[i<count?i:fragmentOwners[i-count]];
    if(write!==i){
      for(const data of [b.p,b.n,b.c])data.copyWithin(write*12,i*12,i*12+12);
      b.uv.copyWithin(write*8,i*8,i*8+8);
    }
    write++;
  }
  b.p.length=b.n.length=b.c.length=write*12;b.uv.length=write*8;b.structural=structural;
  if(thickness)b.structuralThickness=thickness;
}

export function resolvePavingOwnership(batches,paving){
  const levels=new Map(),changes=new Map();
  const stats={faces:0,clippedFaces:0,removedFaces:0,overlapArea:0};
  for(const b of batches.values()){
    const m=b.material;
    if(b.detail||m.visible===false||m.transparent||m.alphaTest||m.alphaMap||m.opacity<1||
       !m.depthWrite||m.depthTest===false||m.displacementMap||m.isShaderMaterial||m.userData.frontImage)continue;
    for(let i=0,n=b.p.length/12;i<n;i++){
      const f=groundFace(b,i);if(!f)continue;
      const level=Math.round(f.y/epsilon);
      if(!levels.has(level))levels.set(level,[]);
      levels.get(level).push(f);stats.faces++;
    }
  }
  for(const row of levels.values()){
    const grid=new Map();
    row.sort((a,b)=>b.paint-a.paint||a.area-b.area);
    for(const f of row){
      const ids=[],others=new Set();
      for(let x=Math.floor(f.x0/bin);x<=Math.floor((f.x1-epsilon)/bin);x++)
        for(let z=Math.floor(f.z0/bin);z<=Math.floor((f.z1-epsilon)/bin);z++){
          const id=x*4096+z;ids.push(id);
          const bucket=grid.get(id);if(bucket)for(const other of bucket)others.add(other);
        }
      let pieces=[f],changed=false;
      for(const other of others){
        if(f.x0>=other.x1-epsilon||f.x1<=other.x0+epsilon||f.z0>=other.z1-epsilon||f.z1<=other.z0+epsilon)continue;
        const next=[];
        for(const r of pieces){
          const hit=cut(r,other);
          if(!hit){next.push(r);continue;}
          changed=true;next.push(...hit.keep);
          stats.overlapArea+=(hit.x1-hit.x0)*(hit.z1-hit.z0);
          paving?.protect?.(f.y,hit.x0,hit.x1,hit.z0,hit.z1);
        }
        pieces=next;if(!pieces.length)break;
      }
      if(changed){
        if(!changes.has(f.batch))changes.set(f.batch,new Map());
        changes.get(f.batch).set(f.i,pieces);
        if(pieces.length)stats.clippedFaces++;else stats.removedFaces++;
      }
      // All of f is now occupied, by its fragments or by earlier inlays.
      if(pieces.length)for(const id of ids){
        if(!grid.has(id))grid.set(id,[]);
        grid.get(id).push(f);
      }
    }
  }
  for(const [b,edits] of changes)compact(b,edits);
  stats.overlapArea=Math.round(stats.overlapArea*100)/100;
  return stats;
}
