import {mapPlan} from './nyc-map-plan.js';
import {randomSource} from './nyc-geometry.js';

// Preview-only entry. The street, distance along it, side and camera heading
// all come from the link's seed; skyline visibility never enters the choice.
export function sampleStreetEntry(world,seed){
  const random=randomSource(seed);
  const roads=mapPlan.roads;
  for(let attempt=0;attempt<96;attempt++){
    const road=roads[Math.floor(random()*roads.length)],pts=road.shape.points;
    const lengths=pts.slice(1).map(([x,z],j)=>Math.hypot(x-pts[j][0],z-pts[j][1]));
    let at=lengths.reduce((a,b)=>a+b,0)*random(),i=0;
    while(i<lengths.length-1&&at>lengths[i])at-=lengths[i++];
    if(lengths[i]<.01)continue;
    const dx=(pts[i+1][0]-pts[i][0])/lengths[i],dz=(pts[i+1][1]-pts[i][1])/lengths[i];
    const footway=road.kind==='promenade'||road.kind==='elevated-walk';
    const side=(random()<.5?-1:1)*(footway?(road.width/2-.6)*random():road.width/2+.7+random());
    const x=pts[i][0]+at*dx+side*dz,z=pts[i][1]+at*dz-side*dx;
    const y=world.ground(x,z,road.elevation+.4);
    if(Math.abs(y-road.elevation)>.41||!world.isPlayable(x,z,.50))continue;
    const blocked=world.solidsNear(x,z).some(b=>b.max.y>y+.14&&b.min.y<y+1.80&&
      x>b.min.x-.48&&x<b.max.x+.48&&z>b.min.z-.48&&z<b.max.z+.48);
    if(!blocked)return [x,z,random()*Math.PI*2,.04,y+.12];
  }
  return [world.spawn.x,world.spawn.z,random()*Math.PI*2,.04,world.spawn.y+.12];
}
