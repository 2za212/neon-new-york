import * as T from 'three';

// Dense static batches keep one material submission. Small spatial clusters
// select their own LOD and reject back-facing planes before GPU submission.
// The shadow prefix is immutable; only the changed visible suffix is uploaded.
export function clusterDrawList(b,sides,original,rebuilt,IndexType){
  const groups=new Map(),v=new T.Vector3();
  const owners=b.reliefOwners||[];
  let range=0;
  for(let q=0;q<sides.length;q++){
    const i=q*12,p=b.p;
    // Switch a wall and its stepped replacements together, even when they
    // span a spatial-cell boundary. Independent switches leave holes or
    // coincident coarse/fine faces during a walking turn.
    while(range<owners.length&&q>=owners[range][0])range++;
    const source=q>=original&&range<owners.length?owners[range][1]*12:i;
    const x=(p[source]+p[source+6])*.5,y=(p[source+1]+p[source+7])*.5,z=(p[source+2]+p[source+8])*.5;
    const key=Math.floor(x/12.8)+','+Math.floor(y/9.6)+','+Math.floor(z/12.8);
    let g=groups.get(key);
    if(!g){g={box:new T.Box3(),lists:Array.from({length:21},()=>[]),state:-1};groups.set(key,g);}
    for(let j=0;j<12;j+=3)g.box.expandByPoint(v.fromArray(p,i+j));
    const variant=q>=original?2:rebuilt.has(q)?1:0;
    const a=q*4;g.lists[variant*7+3+sides[q]].push(a,a+1,a+2,a,a+2,a+3);
  }
  const chunks=Array.from(groups.values());
  for(const g of chunks)g.lists=g.lists.map(list=>list.length?new IndexType(list):null);
  const capacity=original*6+Math.max(original,sides.length-rebuilt.size)*6,offset=original*6;
  const data=new IndexType(capacity);
  for(let i=0;i<original;i++){
    const v=i*4,j=i*6;data[j]=v;data[j+1]=v+1;data[j+2]=v+2;data[j+3]=v;data[j+4]=v+2;data[j+5]=v+3;
  }
  const attribute=new T.BufferAttribute(data,1).setUsage(T.DynamicDrawUsage);
  const cameraLevels=new WeakMap(),defaultLevels=new Uint8Array(chunks.length);
  let count=0;
  function view(eye,frustum,distance,occlusion=null,camera=null){
    let levels=defaultLevels;
    if(camera){
      levels=cameraLevels.get(camera);
      if(!levels){levels=new Uint8Array(chunks.length);cameraLevels.set(camera,levels);}
    }
    let changed=false;
    for(let i=0;i<chunks.length;i++){
      const g=chunks[i];
      const b=g.box;let state=0;
      if(frustum.intersectsBox(b)&&!occlusion?.hides(b)){
        state=8; // the orientation-independent list
        if(eye.x<=b.max.x)state|=4;if(eye.x>=b.min.x)state|=16;
        if(eye.y<=b.max.y)state|=2;if(eye.y>=b.min.y)state|=32;
        if(eye.z<=b.max.z)state|=1;if(eye.z>=b.min.z)state|=64;
        const limit=distance*(levels[i]===2?1.05:levels[i]===1?.95:1);
        const fine=b.distanceToPoint(eye)<limit;
        levels[i]=fine?2:1;
        if(fine)state|=128;
      }
      g.dirty=state!==g.state;
      if(g.dirty){changed=true;g.state=state;}
    }
    if(changed){
      let dst=offset,first=Infinity,end=0;
      for(const g of chunks)if(g.state){
        if(!g.dirty&&g.start===dst){dst+=g.length;continue;}
        const start=dst;
        const variant=g.state&128?14:7;
        for(let j=0;j<7;j++)if(g.state&(1<<j)){
          const common=g.lists[j],detail=g.lists[variant+j];
          if(common){data.set(common,dst);dst+=common.length;}
          if(detail){data.set(detail,dst);dst+=detail.length;}
        }
        g.start=start;g.length=dst-start;
        if(dst>start){first=Math.min(first,start);end=dst;}
      }
      count=dst-offset;
      if(end>first){attribute.addUpdateRange(first,end-first);attribute.needsUpdate=true;}
    }
    return count;
  }
  return {attribute,offset,view};
}
