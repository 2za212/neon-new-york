// A stepped pier, a wall return and a window frame can claim the same patch
// of the same outward plane. Resolve the actual footprint before producing
// either LOD. Keep the clipped geometry's original winding, UVs and tints.
const eps=.00002,cell=4;
function rectangle(b,face){
  const o=face*12,p=b.p,n=b.n;
  const axis=Math.abs(n[o])>.99999?0:Math.abs(n[o+1])>.99999?1:Math.abs(n[o+2])>.99999?2:-1;
  if(axis<0)return;
  const u=axis===0?2:0,v=axis===1?2:1,z=p[o+axis],positive=n[o+axis]>0;
  // Road and plaza tops up to this level belong to the paving pass. A beam
  // underside or upper-storey roof uses precisely the same footprint cutter
  // as a wall cheek, even when it crosses another, broader soffit.
  if(axis===1&&positive&&z<=1.2+eps)return;
  const u0=Math.min(p[o+u],p[o+6+u]),u1=Math.max(p[o+u],p[o+6+u]);
  const v0=Math.min(p[o+v],p[o+6+v]),v1=Math.max(p[o+v],p[o+6+v]);
  if(u1-u0<.035||v1-v0<.035||(u1-u0)*(v1-v0)<.012)return;
  // Angled fins and trapezoids must retain their original silhouettes.
  const alongU=Math.abs(p[o+3+u]-p[o+u])>eps;
  if(alongU ? Math.abs(p[o+3+v]-p[o+v])>eps||Math.abs(p[o+9+u]-p[o+u])>eps :
    Math.abs(p[o+3+v]-p[o+v])<=eps||Math.abs(p[o+9+v]-p[o+v])>eps)return;
  for(let j=3;j<12;j+=3){
    if(Math.abs(p[o+j+axis]-z)>eps||Math.min(Math.abs(p[o+j+u]-u0),Math.abs(p[o+j+u]-u1))>eps||
      Math.min(Math.abs(p[o+j+v]-v0),Math.abs(p[o+j+v]-v1))>eps)return;
  }
  return {b,face,u,v,plane:Math.round(z*10000)*6+axis*2+(positive?1:0),u0,u1,v0,v1,
    area:(u1-u0)*(v1-v0),seen:-1};
}

function subtract(piece,other,result){
  const [u0,v0,u1,v1]=piece;
  const a=Math.max(u0,other.u0),b=Math.max(v0,other.v0),c=Math.min(u1,other.u1),d=Math.min(v1,other.v1);
  if(c-a<=eps||d-b<=eps){result.push(piece);return;}
  if(a-u0>eps)result.push([u0,v0,a,v1]);
  if(u1-c>eps)result.push([c,v0,u1,v1]);
  if(b-v0>eps)result.push([a,v0,c,b]);
  if(v1-d>eps)result.push([a,d,c,v1]);
}

function appendPiece(r,piece){
  const {b,face,u,v}=r,o=face*12;
  const [u0,v0,u1,v1]=piece;
  const pu=b.p[o+u],pv=b.p[o+v],du=b.p[o+3+u]-pu,dv=b.p[o+3+v]-pv;
  const eu=b.p[o+9+u]-pu,ev=b.p[o+9+v]-pv;
  for(let j=0;j<4;j++){
    const uu=Math.abs(b.p[o+3*j+u]-r.u0)<eps?u0:u1;
    const vv=Math.abs(b.p[o+3*j+v]-r.v0)<eps?v0:v1;
    const s=Math.abs(du)>eps?(uu-pu)/du:(vv-pv)/dv;
    const t=Math.abs(eu)>eps?(uu-pu)/eu:(vv-pv)/ev;
    for(const [arr,k] of [[b.p,3],[b.n,3],[b.c,3],[b.uv,2]]){
      const base=face*4*k;
      for(let i=0;i<k;i++){
        const a=arr[base+i],b1=arr[base+k+i],c=arr[base+2*k+i],d=arr[base+3*k+i];
        arr.push((1-t)*(a+(b1-a)*s)+t*(d+(c-d)*s));
      }
    }
  }
}

function compact(b,changes){
  const old=b.p.length/12,source=b.structural||new Set(),extra=[];
  for(const {r,pieces} of changes.values())for(const piece of pieces){
    appendPiece(r,piece);extra.push(r.face);
  }
  const length=old+extra.length,structural=new Set(),depth=b.structuralThickness;
  const nextDepth=depth?new Float32Array(length-changes.size):null;
  let write=0;
  for(let face=0;face<length;face++){
    if(face<old&&changes.has(face))continue;
    const owner=face<old?face:extra[face-old];
    if(source.has(owner)){structural.add(write);if(depth)nextDepth[write]=depth[owner];}
    if(face!==write){
      for(const a of [b.p,b.c,b.n])a.copyWithin(write*12,face*12,face*12+12);
      b.uv.copyWithin(write*8,face*8,face*8+8);
    }
    write++;
  }
  b.p.length=b.n.length=b.c.length=write*12;b.uv.length=write*8;
  b.structural=structural;b.structuralThickness=nextDepth;
}

export function resolveFacadeOwnership(batches){
  const groups=new Map(),adjustments=new Map();
  let faces=0,fragments=0,removedArea=0;
  for(const b of batches.values()){
    const m=b.material;
    // Disappearing fittings, alpha cutouts, moving water and see-through
    // glazing cannot permanently own a hole in the building behind them.
    if(b.detail||m.transparent||m.alphaTest||m.alphaMap||m.isShaderMaterial||m.side!==0||
       m.opacity!==1||!m.depthWrite||!m.visible||m.displacementMap)continue;
    const featured=!!(m.userData.frontImage||m.userData.roomAtlas||m.userData.signalLens||
      /window|glaz|display|lamp|inhabited/i.test(m.name));
    for(let i=0;i<b.p.length/12;i++){
      const r=rectangle(b,i);if(!r)continue;
      r.featured=featured;
      let all=groups.get(r.plane);if(!all){all=[];groups.set(r.plane,all);}all.push(r);
    }
  }
  for(const group of groups.values()){
    if(group.length<2)continue;
    // The authored window/art and the smaller external fitting get the face.
    // Equal-sized pieces use stable authoring order at every camera distance.
    group.sort((a,b)=>Number(b.featured)-Number(a.featured)||a.area-b.area);
    const bins=new Map();
    for(let id=0;id<group.length;id++){
      const r=group[id],ax=Math.floor((r.u0+eps)/cell),bx=Math.floor((r.u1-eps)/cell);
      const ay=Math.floor((r.v0+eps)/cell),by=Math.floor((r.v1-eps)/cell);
      let pieces=null;
      for(let x=ax;x<=bx;x++)for(let y=ay;y<=by;y++){
        const k=x+65536*y;let entries=bins.get(k);
        if(!entries){entries=[];bins.set(k,entries);}
        for(const other of entries){
          if(other.seen===id)continue;other.seen=id;
          if(r.u1<=other.u0+eps||r.u0>=other.u1-eps||r.v1<=other.v0+eps||r.v0>=other.v1-eps)continue;
          if(!pieces)pieces=[[r.u0,r.v0,r.u1,r.v1]];
          if(!pieces.length)break;
          const remaining=[];for(const piece of pieces)subtract(piece,other,remaining);pieces=remaining;
        }
        entries.push(r);
      }
      if(!pieces)continue;
      let changes=adjustments.get(r.b);if(!changes){changes=new Map();adjustments.set(r.b,changes);}
      changes.set(r.face,{r,pieces});faces++;fragments+=pieces.length;
      removedArea+=r.area-pieces.reduce((sum,[a,b,c,d])=>sum+(c-a)*(d-b),0);
    }
  }
  for(const [b,changes] of adjustments)compact(b,changes);
  return {faces,fragments,removedArea:Math.round(removedArea*100)/100};
}
