import {unitDepth} from './nyc-unit-bond.js';

// Make a solid stepped relief from a rectangular face. Corners are in
// counterclockwise order. Windows, printed faces and transparent water keep
// their authored outlines. Every returned riser is an actual perpendicular face.
export function cutCourses(width,height,vertical,family,seed,emit,indoor=false,maxRelief=Infinity){
  if(family==='roadbed')return false;
  const short=Math.min(width,height),long=Math.max(width,height);
  if(!family||short<(indoor?.30:.66)||long<(indoor?.52:1.28))return false;
  const ground=vertical>.86;
  const green=family==='foliage',stone=family==='stone'||family==='clay',road=family==='setts';
  if(!indoor&&!green&&!ground&&short<1.28&&long<3.84)return false;
  if(vertical<-.8&&short<2.56&&!indoor)return false;
  if(family==='glass'&&short<2.56)return false;
  const base=indoor?.16:green?.32:ground?.64:stone?.32:.64;
  // Macro courses are integer multiples of the construction scale. The finish
  // carries the individual block joints between the corbels at long distances.
  let pitch=base;
  while(Math.ceil(width/pitch)*Math.ceil(height/pitch)>48||long/pitch>16)pitch*=2;
  const nx=Math.max(1,Math.ceil(width/pitch-.001)),ny=Math.max(1,Math.ceil(height/pitch-.001));
  if(nx*ny<3)return false;
  const steps=new Int8Array(nx*ny);
  const sx=pitch/width,sy=pitch/height;
  const X=i=>Math.min(1,i*sx),Y=i=>Math.min(1,i*sy);
  const depth=Math.min(maxRelief/2,indoor?(ground?.004:.036):ground?(green?.048:.012):green?.12:stone?.096:.080);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const run=Math.floor((x+(y%2))/(green||road?2:3));
    const value=Math.abs((run*17+y*11+seed)%9);
    // Alternating header courses lock into the neighbouring row. A recessed
    // field leaves the door, window and road marking planes in front.
    steps[x+y*nx]=green?(value<3?-2:value<7?-1:0):
      ((y+seed)%5===0&&x%3!==0?0:value<2?-2:value<6?-1:0);
    // The baked room has thin plates over dark service cavities. Raise the
    // exposed faces from the original plate so the cavity stays sealed.
    if(indoor)steps[x+y*nx]*=-1;
  }
  emitSteps(steps,nx,ny,X,Y,depth,emit);
  return true;
}

export function emitSteps(steps,nx,ny,X,Y,depth,emit){
  function h(x,y){
    if(x<0||y<0||x>=nx||y>=ny)return 0;
    return steps[x+y*nx];
  }
  // Greedy caps, then only the step walls between different levels.
  const used=new Uint8Array(steps.length);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const i=x+y*nx;if(used[i])continue;
    const l=steps[i];let w=1,tall=1;
    while(x+w<nx&&!used[i+w]&&steps[i+w]===l)w++;
    outer:while(y+tall<ny){
      for(let j=0;j<w;j++)if(used[i+tall*nx+j]||steps[i+tall*nx+j]!==l)break outer;
      tall++;
    }
    for(let j=0;j<tall;j++)used.fill(1,i+j*nx,i+j*nx+w);
    const a=X(x),b=X(x+w),c=Y(y),d=Y(y+tall),z=l*depth;
    emit([[a,c,z],[b,c,z],[b,d,z],[a,d,z]],1+l*.035);
  }
  for(let axis=0;axis<2;axis++){
    const n=axis?ny:nx,m=axis?nx:ny;
    const levels=(i,j)=>axis?[h(j,i-1),h(j,i)]:[h(i-1,j),h(i,j)];
    for(let i=0;i<=n;i++)for(let j=0;j<m;){
      const [a,b]=levels(i,j);if(a===b){j++;continue;}
      let end=j+1;while(end<m){const [c,d]=levels(i,end);if(a!==c||b!==d)break;end++;}
      const top=Math.max(a,b)*depth,low=Math.min(a,b)*depth;
      const p=axis?Y(i):X(i),s=axis?X(j):Y(j),t=axis?X(end):Y(end);
      const q=axis?[[s,p,low],[s,p,top],[t,p,top],[t,p,low]]:
        [[p,s,low],[p,t,low],[p,t,top],[p,s,top]];
      // Point toward the lower neighbour.
      if(b>a)q.reverse();
      emit(q,.79);j=end;
    }
  }
}

function unitDivisions(start,delta){
  const divisions=[0];
  const a=start*8,b=(start+delta)*8;
  for(let i=Math.ceil(Math.min(a,b));i<=Math.floor(Math.max(a,b));i++){
    const t=(i-a)/(b-a);
    if(t>.0001&&t<.9999)divisions.push(t);
  }
  divisions.push(1);
  return divisions.sort((x,y)=>x-y);
}

export function cutAssembly(width,height,vertical,uv,kind,emit,maxRelief=Infinity){
  if(Math.min(width,height)<.57||width*height>210||Math.max(width,height)>42)return false;
  const [a,b,c,d,e,f]=uv,alongU=Math.abs(c)>Math.abs(d),alongV=Math.abs(e)>Math.abs(f);
  if(alongU===alongV)return false;
  const xs=unitDivisions(alongU?a:b,alongU?c:d),ys=unitDivisions(alongV?a:b,alongV?e:f);
  const nx=xs.length-1,ny=ys.length-1,steps=new Int8Array(nx*ny);
  const field=width*height<5.2;
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const u=(xs[i]+xs[i+1])*.5,v=(ys[j]+ys[j+1])*.5;
    const x=Math.floor((a+c*u+e*v)*8),y=Math.floor((b+d*u+f*v)*8);
    const border=Math.min(i,nx-1-i,j,ny-1-j)<2;
    // Keep the same small unit on broad walls. Long flush runs share a cap,
    // with exposed block ends at returns and at each expansion course.
    if(field||border||((y+2*kind)&7)===2)steps[i+j*nx]=unitDepth(x,y,kind);
  }
  if(!steps.includes(-1))return false;
  emitSteps(steps,nx,ny,i=>xs[i],j=>ys[j],Math.min(maxRelief,vertical>.8?.064:.16),emit);
  return true;
}

export function sculptBatch(b,kind){
  const rebuilt=new Set();
  const assembly=b.material?.userData?.assemblyUV;
  // The close setts already replace the finish on the unbroken road bed.
  // A second coarse cut can sink that bed through the underlying soil.
  if(b.material?.userData?.worldUnitsUV||b.material?.userData?.voxelSurfaceBaked)return rebuilt;
  if(!kind&&!assembly)return rebuilt;
  const {p,n,c,uv}=b;
  for(const face of b.structural||[]){
    const a=face*12,w=face*8;
    const ux=p[a+3]-p[a],uy=p[a+4]-p[a+1],uz=p[a+5]-p[a+2];
    const vx=p[a+9]-p[a],vy=p[a+10]-p[a+1],vz=p[a+11]-p[a+2];
    const length=Math.hypot(ux,uy,uz),height=Math.hypot(vx,vy,vz);
    if(length*height<1.12||Math.abs(ux*vx+uy*vy+uz*vz)>.0001*length*height)continue;
    if(Math.abs(p[a]+ux+vx-p[a+6])+Math.abs(p[a+1]+uy+vy-p[a+7])+Math.abs(p[a+2]+uz+vz-p[a+8])>.004)continue;
    const nx=n[a],ny=n[a+1],nz=n[a+2];
    // Opposite recesses in a narrow casing must leave solid material between
    // them. Otherwise the far cheek overtakes the near cheek during LOD.
    const thickness=b.structuralThickness?.[face];
    const maxRelief=thickness>0?thickness*.42:Infinity;
    const seed=Math.abs(Math.round(p[a]*3+p[a+1]*7+p[a+2]*5));
    const emit=(quad,shade)=>{
      const e=quad[1].map((v,i)=>v-quad[0][i]),f=quad[3].map((v,i)=>v-quad[0][i]);
      const ex=ux*e[0]+vx*e[1]+nx*e[2],ey=uy*e[0]+vy*e[1]+ny*e[2],ez=uz*e[0]+vz*e[1]+nz*e[2];
      const fx=ux*f[0]+vx*f[1]+nx*f[2],fy=uy*f[0]+vy*f[1]+ny*f[2],fz=uz*f[0]+vz*f[1]+nz*f[2];
      const dx=ey*fz-ez*fy,dy=ez*fx-ex*fz,dz=ex*fy-ey*fx,inv=1/(Math.hypot(dx,dy,dz)||1);
      for(const [u,v,h] of quad){
        p.push(p[a]+ux*u+vx*v+nx*h,p[a+1]+uy*u+vy*v+ny*h,p[a+2]+uz*u+vz*v+nz*h);
        n.push(dx*inv,dy*inv,dz*inv);
        for(let k=0;k<3;k++)c.push(shade*((1-u)*((1-v)*c[a+k]+v*c[a+9+k])+u*((1-v)*c[a+3+k]+v*c[a+6+k])));
        for(let k=0;k<2;k++)uv.push((1-u)*((1-v)*uv[w+k]+v*uv[w+6+k])+u*((1-v)*uv[w+2+k]+v*uv[w+4+k]));
      }
    };
    let ok;
    if(assembly){
      if(Math.min(p[a+1],p[a+4],p[a+7],p[a+10])>30)continue;
      const axes=[uv[w],uv[w+1],uv[w+2]-uv[w],uv[w+3]-uv[w+1],uv[w+6]-uv[w],uv[w+7]-uv[w+1]];
      ok=cutAssembly(length,height,ny,axes,b.material.userData.assemblyKind,emit,maxRelief);
    }else ok=cutCourses(length,height,ny,kind,seed,emit,false,maxRelief);
    if(ok){
      rebuilt.add(face);
      (b.reliefOwners??=[]).push([b.p.length/12,face]);
    }
  }
  return rebuilt;
}
