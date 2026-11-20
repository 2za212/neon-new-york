// All occupied cells share vertices in world space. Only the boundary is sent
// to the city batch, and coplanar neighbours with the same finish share a quad.
function emitShell({panel,box},mat,origin,step,dims,read,palette,extent=step.map((n,a)=>n*dims[a])){
  const [nx,ny,nz]=dims, cells=new Uint8Array(nx*ny*nz);
  const coordinate=(a,i)=>origin[a]+Math.min(extent[a],i*step[a]);
  const at=(x,y,z)=>x+nx*(y+ny*z);
  const get=(x,y,z)=>x<0||y<0||z<0||x>=nx||y>=ny||z>=nz?0:cells[at(x,y,z)];
  let occupied=0,exposed=0,quads=0;
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const color=read(x,y,z);
    if(!color)continue;
    cells[at(x,y,z)]=color;occupied++;
    const pos=[x,y,z];
    for(let a=0;a<3;a++){
      min[a]=Math.min(min[a],pos[a]);max[a]=Math.max(max[a],pos[a]+1);
    }
  }
  // The box-only API is also used by offline level tools.
  if(!panel){
    for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;){
      const color=get(x,y,z),start=x++;
      if(!color)continue;
      while(x<nx&&get(x,y,z)===color)x++;
      const lo=[coordinate(0,start),coordinate(1,y),coordinate(2,z)];
      const hi=[coordinate(0,x),coordinate(1,y+1),coordinate(2,z+1)];
      box(mat,...lo.map((v,a)=>(v+hi[a])/2),...hi.map((v,a)=>v-lo[a]),palette[color-1]);
    }
  }
  for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    if(get(x,y,z)&&!(get(x+1,y,z)&&get(x-1,y,z)&&get(x,y+1,z)&&get(x,y-1,z)&&get(x,y,z+1)&&get(x,y,z-1)))exposed++;
  }
  if(panel)for(let a=0;a<3;a++){
    const u=(a+1)%3,v=(a+2)%3,cols=dims[u],rows=dims[v],mask=new Int16Array(cols*rows),p=[0,0,0];
    for(let plane=0;plane<=dims[a];plane++){
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
        p[u]=i;p[v]=j;p[a]=plane-1;const left=get(...p);
        p[a]=plane;const right=get(...p);
        mask[i+j*cols]=left&&!right?left:right&&!left?-right:0;
      }
      for(let j=0;j<rows;j++)for(let i=0;i<cols;){
        const code=mask[i+j*cols];
        if(!code){i++;continue;}
        let width=1,height=1;
        while(i+width<cols&&mask[i+width+j*cols]===code)width++;
        extend:while(j+height<rows){
          for(let k=0;k<width;k++)if(mask[i+k+(j+height)*cols]!==code)break extend;
          height++;
        }
        for(let h=0;h<height;h++)mask.fill(0,i+(j+h)*cols,i+width+(j+h)*cols);
        const corner=(du,dv)=>{
          const point=origin.slice();point[a]=coordinate(a,plane);point[u]=coordinate(u,i+du);point[v]=coordinate(v,j+dv);return point;
        };
        const face=[corner(0,0),corner(width,0),corner(width,height),corner(0,height)];
        panel(mat,code>0?face:[face[0],face[3],face[2],face[1]],palette[Math.abs(code)-1]);quads++;i+=width;
      }
    }
  }
  return {occupied,exposed,quads,min:min.map((n,a)=>coordinate(a,n)),max:max.map((n,a)=>coordinate(a,n))};
}

// Boughs overlap on one timber-centred grid. The leading tip and sheltered
// underside of each bough stay legible in both sun and municipal night light.
export function voxelCrown(api,mat,center,lobes,seed,palette){
  const cell=.32;
  const lo=[0,1,2].map(a=>Math.floor(Math.min(...lobes.map(l=>l[a]-l[a+3]))/cell));
  const hi=[0,1,2].map(a=>Math.ceil(Math.max(...lobes.map(l=>l[a]+l[a+3]))/cell));
  const read=(x,y,z)=>{
    const i=x+lo[0],j=y+lo[1],k=z+lo[2],px=(i+.5)*cell,py=(j+.5)*cell,pz=(k+.5)*cell;
    let best=0,tone=0;
    for(let n=0;n<lobes.length;n++){
      const l=lobes[n],dx=(px-l[0])/l[3],dy=(py-l[1])/l[4],dz=(pz-l[2])/l[5];
      const fill=1-dx*dx-dy*dy-dz*dz;
      if(fill<=best)continue;
      best=fill;tone=Math.max(0,Math.min(4,Math.floor(1.8+dy*1.25-dx*.45+dz*.35+(n%3)*.24)));
    }
    if(!best)return 0;
    const cluster=((i>>1)*7+(k>>1)*13+j*3+seed)&7;
    return 1+Math.max(0,Math.min(4,tone+(cluster===0?1:cluster===4?-1:0)));
  };
  return emitShell(api,mat,lo.map((n,a)=>center[a]+n*cell),[cell,cell,cell],hi.map((n,a)=>n-lo[a]),read,palette);
}

// Structural courses abut inside the original footprint. A continuous web
// behind staggered, one-cell-deep sockets carries each corner and sill.
export function keyedCasting(api,mat,x,y,z,w,h,d,tint=0xffffff,seed=0){
  const unit=.32,size=[w,h,d],dims=size.map(n=>Math.max(1,Math.ceil(n/unit-.0001)));
  const [nx,ny,nz]=dims,faces=[];
  for(const f of [.83,.94,1])faces.push(
    (Math.round((tint>>16&255)*f)<<16)|(Math.round((tint>>8&255)*f)<<8)|Math.round((tint&255)*f));
  const read=(i,j,k)=>{
    const row=(j+seed)%4,alongX=i+row*2,alongZ=k+row*2;
    const xEdge=i===0||i===nx-1,zEdge=k===0||k===nz-1;
    // Deep fork joints open at the corners. An occasional mortise interrupts
    // the face between ribs; the inner course remains continuous.
    const xSocket=xEdge&&nz>=3&&(nx>=3||nx===2&&i===((Math.floor(k/3)+row)&1));
    const zSocket=zEdge&&nx>=3&&(nz>=3||nz===2&&k===((Math.floor(i/3)+row)&1));
    if(nx>=3&&nz>=3&&xEdge&&zEdge&&row%2===0 ||
      xSocket&&alongZ%6<2&&row!==3 || zSocket&&alongX%6<2&&row!==3)return 0;
    if(!xEdge&&!zEdge&&j!==0&&j!==ny-1)return 3;
    const tile=(Math.floor(alongX/3)+Math.floor(alongZ/3)+Math.floor((j+seed)/2))%7;
    return tile===0?1:tile<3?2:3;
  };
  return emitShell(api,mat,[x-w/2,y-h/2,z-d/2],[unit,unit,unit],dims,read,faces,size);
}
