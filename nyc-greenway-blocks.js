import {housingBond} from './nyc-housing-bond.js';

// The public viaduct runs east/west at y=6.51. These lots grow from the
// warehouse roofs and the private backs of the tenements on either side.
export function buildGreenwayBlocks({box,panel,collider,materials}){
  const bond=housingBond(materials,box,panel);
  function part(mat,x,y,z,w,h,d,col){
    box(mat,x,y,z,w,h,d,col,0,null,true);
  }
  function mass(mat,x,y,z,w,h,d,col){
    part(mat,x,y,z,w,h,d,col);
    collider(x,y,z,w,h,d);
  }
  // front is the outer lip of a floor, measured from the railway. Occupied
  // rooms sit behind it, set back between party walls. This gives both
  // directions of travel a deep window reveal and a stepped end profile.
  function floor(x,front,face,w,d,base,work,seed){
    const z=front-face*d/2,skin=work?'titaniumSkin':'ceramicShell';
    const tint=work?0xabbac1:0xbdaea0;
    mass('basaltShell',x,base+.32,z,w,.64,d,0xa8b3bc);
    bond(skin,x,base+.48,front+face*.16,w,.64,.96,tint,face,seed);
    const recess=1.28;
    mass('basaltShell',x,base+2.08,z-face*recess/2,w,2.88,d-recess,0xaab5be);
    const bays=Math.max(2,Math.round(w/4.16)),span=w/bays;
    for(let i=0;i<bays;i++){
      const u=x-w/2+(i+.5)*span;
      const lit=(i+seed)%4!==1;
      part(lit?(work?'routeStudio':'routeHome'):'routeBlinds',u,base+2.14,front-face*(recess-.06),
        span-.50,1.86,.16,work?0xc2d6dc:0xe6bc91);
      part(skin,u-span/2+.24,base+2.08,front-face*.76,.48,2.88,1.12,tint);
    }
    for(const side of [-1,1]){
      const edge=x+side*(w/2-.32);
      mass(skin,edge,base+2.08,front-face*.64,.64,2.88,1.28,tint);
      // Turn the front around the exposed end. The staggered oriels and
      // stair landings are what you see first walking along the viaduct.
      const depth=work?3.84:3.20;
      const throwOut=(seed+(side>0?1:0))%3===0?1.60:.96;
      const start=x+side*w/2,lip=start+side*throwOut,zz=z+face*((seed%3)-1)*.64;
      const xx=start+side*throwOut/2;
      mass('basaltShell',xx,base+.80,zz,throwOut,.64,depth+.64,0xa5b9c4);
      mass(work?'titaniumSkin':skin,xx,base+2.01,zz,throwOut,1.78,depth,tint);
      part(work?'routeStudio':'routeHome',lip+side*.04,base+2.02,zz,.12,1.59,depth-.32,
        work?0xd9e6dc:0xffcd98);
      for(const s of [-1,1]){
        part(skin,xx,base+1.98,zz+s*depth/2,throwOut+.16,1.84,.32,tint);
        part('basaltShell',lip+side*.08,base+2.01,zz+s*depth*.24,.24,1.76,.16,0xa8b6bc);
      }
      bond(skin,xx,base+3.20,zz,throwOut+.32,.64,depth+.64,tint,side*2,seed);
      if((seed+side)%3===0){
        part(work?'harborBeacon':'warmWindow',lip+side*.12,base+1.0,zz,.16,.16,depth*.62,work?0x96cbd0:0xeabe8a);
      }
    }
    mass(skin,x,base+3.68,z,w,.32,d,tint);
  }
  // Service cores are set back into the existing lots. The loading alleys,
  // public stairs and viaduct therefore retain their original clear width.
  function stack(x,front,face,w,d,base,levels,work,seed){
    const h=base-4.48;
    mass('basaltShell',x,4.48+h/2,front-face*(d*.64),w*.78,h,d*.60,0x8798a4);
    for(let i=0;i<levels;i++){
      const offset=i%2?.64:0,upper=i===levels-1;
      floor(x+(upper?1.28:0),front-face*(upper?.64:offset),face,w-(upper?3.20:0),d-offset,
        base+i*3.84,work,seed+i);
    }
  }
  stack(-87.04,-25.60,-1,18.56,11.52,8.32,4,true,2);
  stack(-84.48,-31.68, 1,20.48,13.44,7.68,5,true,4);
  stack(-59.52,-25.28,-1,17.28,10.24,7.04,3,false,8);
  stack(-58.24,-32.32, 1,16.64,12.16,9.60,4,true,5);
  stack(-24.32,-25.28,-1,21.12, 8.96,10.56,4,false,3);
  stack(-22.40,-32.00, 1,20.48,10.88,10.56,3,true,6);
  stack( 23.04,-25.28,-1,20.48, 8.32,10.56,3,false,2);
  stack( 29.44,-32.00, 1,14.72, 9.60,11.52,5,false,7);

  // Each crossing carries real enclosed floors between two roofs. Narrow
  // bands at their ends catch light when seen from below or from the river.
  function link(x,width,base,height,work){
    const z=-28.64,depth=11.52,tint=work?0xabbcc2:0xb7aa98;
    mass('basaltShell',x,base+.32,z,width,.64,depth,0xaab5b9);
    mass(work?'titaniumSkin':'ceramicShell',x,base+height/2,z,width-.96,height-1.28,depth,tint);
    mass('ceramicShell',x,base+height-.32,z,width,.64,depth,tint);
    for(const side of [-1,1]){
      const edge=x+side*(width/2-.48);
      for(let i=-1;i<=1;i++){
        part(work?'routeStudio':'routeHome',edge+side*.06,base+height*.55,z+i*3.20,.16,height*.37,2.56,0xc8cebd);
        part('titaniumSkin',edge+side*.18,base+height/2,z+i*3.2-1.52,.48,height-.96,.48,tint);
      }
      bond('basaltShell',x+side*(width/2-.32),base+.32,z,.96,.64,depth,0xb9c1c2,side*2,6);
    }
    for(let u=-width/2+.64;u<width/2;u+=1.92)part('titaniumSkin',x+u,base-.16,z,.32,.32,depth,0xb3bbbe);
  }
  link(-85.12,8.96,12.80,6.40,true);
  link(24.96,5.76,14.40,3.84,false);
}
