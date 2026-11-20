// Use complete faces of closed opaque solids as occluders. A target box
// has to fit behind the face on all four sides, including its far corners.
export function createStreetOcclusion(){
  const cells=new Map(),cellSize=32,faces=[],planes=[];
  const axes=[['x','y','z'],['z','y','x']];
  let lastX=Infinity,lastY=Infinity,lastZ=Infinity;
  function add(x,y,z,w,h,d){
    if(h<3||Math.max(w,d)<6||Math.min(w,d)<.32)return;
    const box={min:{x:x-w/2,y:y-h/2,z:z-d/2},max:{x:x+w/2,y:y+h/2,z:z+d/2}};
    for(let i=Math.floor((box.min.x-40)/cellSize);i<=Math.floor((box.max.x+40)/cellSize);i++)
      for(let j=Math.floor((box.min.z-40)/cellSize);j<=Math.floor((box.max.z+40)/cellSize);j++){
        const key=i+','+j;if(!cells.has(key))cells.set(key,[]);
        cells.get(key).push(box);
      }
  }
  function prepare(eye){
    if(Math.abs(eye.x-lastX)+Math.abs(eye.y-lastY)+Math.abs(eye.z-lastZ)>2){
      lastX=eye.x;lastY=eye.y;lastZ=eye.z;faces.length=0;
      const key=Math.floor(eye.x/cellSize)+','+Math.floor(eye.z/cellSize);
      for(const box of cells.get(key)||[])for(const [axis,u,v] of axes){
        const lo=box.min,hi=box.max,side=eye[axis]<lo[axis]?1:-1;
        const wall=(side===1?lo:hi)[axis],depth=side*(wall-eye[axis]);
        if(depth<1||depth>40)continue;
        const cu=(hi[u]+lo[u])*.5-eye[u],cv=(hi[v]+lo[v])*.5-eye[v];
        const score=(hi[u]-lo[u])*(hi[v]-lo[v])*depth/Math.pow(depth*depth+cu*cu+cv*cv,1.5);
        if(score>.05)faces.push({axis,u,v,lo,hi,side,wall,score});
      }
      faces.sort((a,b)=>b.score-a.score);faces.length=Math.min(8,faces.length);
    }
    planes.length=0;
    for(const f of faces){
      const {axis,u,v,lo,hi}=f;
      f.ex=eye[axis];f.eu=eye[u];f.ev=eye[v];f.depth=f.side*(f.wall-f.ex);
      if(f.depth<1)continue;
      f.u0=(lo[u]+.04-f.eu)/f.depth;f.u1=(hi[u]-.04-f.eu)/f.depth;
      f.v0=(lo[v]+.04-f.ev)/f.depth;f.v1=(hi[v]-.04-f.ev)/f.depth;
      planes.push(f);
    }
  }
  function hides(box){
    for(const f of planes){
      const lo=box.min,hi=box.max;
      const a=f.side*((f.side===1?lo:hi)[f.axis]-f.ex);
      if(a<=f.depth+.08)continue;
      const b=f.side*((f.side===1?hi:lo)[f.axis]-f.ex);
      if(lo[f.u]-f.eu<Math.max(f.u0*a,f.u0*b)||hi[f.u]-f.eu>Math.min(f.u1*a,f.u1*b))continue;
      if(lo[f.v]-f.ev>=Math.max(f.v0*a,f.v0*b)&&hi[f.v]-f.ev<=Math.min(f.v1*a,f.v1*b))return true;
    }
    return false;
  }
  return {add,prepare,hides};
}
