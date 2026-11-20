import {buildHabitatStack} from './nyc-habitat-stacks.js';
import {housingBond} from './nyc-housing-bond.js';
import {routeWindow} from './nyc-route-windows.js';

// Shop co-ops own the thin ends of the old industrial parcels. They can carry
// two occupied wings over their delivery passage while the public courts
// behind the shops remain accessible from both sides of the block.
const houses=[
  // x, street face z, outward sign, frontage, lot depth, storeys, pier width
  [-36.16,78.24,1,10.88,3.20,5,2.56],
  [-35.20,90.40,-1,11.52,3.52,3,2.24],
  [-35.68,120.64,1,12.48,3.36,4,1.44],
  [-35.04,136.32,-1,11.52,3.52,6,1.60],
  [45.76,136.48,-1,8.96,4.16,4,1.92],
  [-34.56,157.28,-1,10.24,2.72,4,1.92],
  [46.40,157.28,-1,10.88,2.72,3,1.60]
];

export function buildMarketLaneHomes({B,C,materials,panel}){
  for(const [index,[x,z,face,width,depth,levels,pier]] of houses.entries()){
    const turn=face>0?0:Math.PI;
    const world=(u,y,v)=>[x+face*u,y,z+face*v];
    const box=(key,u,y,v,w,h,d,col=0xffffff)=>
      B(key,...world(u,y,v),w,h,d,col,turn,null,true);
    const solid=(u,y,v,w,h,d,part)=>C(...world(u,y,v),w,h,d,'market-row-'+index+'/'+part);
    const bond=housingBond(materials,box,panel,world);
    const floorY=4.64,roof=floorY+levels*3.20,seed=11+3*index+(index%3);
    for(const side of [-1,1]){
      const u=side*(width-pier)/2;
      const skin=index%3===1?'ceramicShell':'titaniumSkin';
      // Recess the service window between two piers. The clear through route
      // continues the actual market yard, receiving bay or bench pocket.
      // The glazed spandrel fits between the cast plinth and lintel. A
      // continuous box behind all three would also paint their side faces.
      box('basaltShell',u,2.16,-(depth+.64)/2,pier,1.44,depth-.64,0xbbc2b5);
      solid(u,2.40,-depth/2,pier,4.48,depth,'ground-wing');
      bond(skin,u,.80,-depth/2,pier,1.28,depth,0xbdb59e,1,index+side);
      box(routeWindow('workroom',0,index+side+1,6),u,2.24,-.58,pier-.32,1.60,.16);
      bond(skin,u,3.52,-depth/2,pier,1.28,depth,0xd3c7b0,1,index+2);
      for(let j=0;j<3;j++){
        const span=pier+(j+1)*.64;
        box(j===1?'basaltShell':skin,side*(width-span)/2,3.84+j*.32,
          -depth/2,span,.32,depth+.32*j,0xacc7bf);
      }
      box('lamp',u,3.12,-.17,pier*.55,.16,.32,index%2?0xa7dace:0xf1b26f);
    }
    // The first slab is continuously supported across both deep end bays.
    bond('basaltShell',0,floorY-.24,-depth/2,width,.48,depth+.64,0xb2bdac,1,index);
    solid(0,floorY-.24,-depth/2,width,.48,depth+.64,'portal-head');
    buildHabitatStack({box,bond,solid,width,depth,bottom:floorY,top:roof,pitch:3.20,
      seed,streetSite:[x,z],glass:(f,bay)=>routeWindow(index%3===1?'tailor':'home',f,bay,4)});
  }
  return houses.length;
}
