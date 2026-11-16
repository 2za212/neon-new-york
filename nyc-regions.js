/** Circle containment in a simple XZ polygon, including concave district joins. */
export function createPlayableArea(outline){
  const points=outline?.points||outline;
  if(!Array.isArray(points)||points.length<3||points.some(p=>p.length!==2||!p.every(Number.isFinite)))throw new TypeError('Playable outline needs finite [x,z] points.');
  const polygon=points.map(p=>p.slice());
  return function isPlayable(x,z,radius=0){
    if(![x,z,radius].every(Number.isFinite)||radius<0)return false;
    let inside=false,onEdge=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const[a,b]=polygon[j],[c,d]=polygon[i],vx=c-a,vz=d-b;
      const t=Math.max(0,Math.min(1,((x-a)*vx+(z-b)*vz)/(vx*vx+vz*vz||1)));
      const distance2=(x-a-t*vx)**2+(z-b-t*vz)**2;
      if(distance2<radius*radius-.000001)return false;
      if(distance2<.00000001)onEdge=true;
      if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)inside=!inside;
    }
    return inside||(onEdge&&radius<.0001);
  };
}
