// Occupied cubic courses used at a housing panel's exposed end. The solid
// backing stops behind the courses, including at the underside of a balcony.
const body={
  ceramicShell:['habitat-fired-cell',0xccc9b6,.72],
  titaniumSkin:['habitat-titanium-cell',0x8faab4,.48],
  basaltShell:['habitat-composite-cell',0x63707a,.84]
};
const shades=[.96,.90,1.04,.98,.94,1.02];
const neighbors=[[-1,0],[1,0],[0,-1],[0,1]];
function tint(base,lit){
  const r=Math.min(255,Math.round((base>>16&255)*lit));
  const g=Math.min(255,Math.round((base>>8&255)*lit));
  const b=Math.min(255,Math.round((base&255)*lit));
  return r*65536+g*256+b;
}

export function housingBond(materials,box,panel,toWorld){
  if(!panel)return (key,x,y,z,w,h,d,col)=>box(key,x,y,z,w,h,d,col);
  for(const [key,[name,face,roughness]] of Object.entries(body)){
    if(materials[name])continue;
    const mat=materials[key].clone();
    mat.name=name;mat.color.setHex(face);
    mat.map=null;mat.roughnessMap=null;mat.roughness=roughness;
    mat.userData.voxelSurfaceBaked=true;
    materials[name]=mat;
  }
  return function lay(key,x,y,z,w,h,d,col=0xffffff,face=1,seed=0,unit=.32){
    // +/-1 face Z. +/-2 face X. In every orientation u,v,depth keep a
    // right-handed frame, so daylight and grazing shop light hit the risers.
    const edge=Math.sign(face),across=Math.abs(face)===2;
    const width=across?d:w,depth=across?w:d;
    if(!body[key]||width<unit||h<unit-.001||depth<unit*.99){
      box(key,x,y,z,w,h,d,col);
      return;
    }
    const nx=Math.max(1,Math.ceil(width/unit-.001)),ny=Math.max(1,Math.ceil(h/unit-.001));
    const layers=Math.max(1,Math.min(3,Math.floor(depth/unit+.001)));
    const casing=layers*unit,back=depth/2-casing;
    const remainder=depth-casing;
    if(remainder>.005)box(key,x-(across?edge*casing/2:0),y,z-(across?0:edge*casing/2),
      across?remainder:w,h,across?d:remainder,col);
    const variant=Math.abs(Math.round(seed));
    const U=i=>Math.min(i*unit,width)-width/2;
    const Y=j=>Math.min(j*unit,h)-h/2;
    const thickness=new Uint8Array(nx*ny),tone=new Uint8Array(nx*ny);
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
      // A twin header in one course beds against the long edge of the next
      // one. The narrow tongue turns one cell earlier at alternating ends.
      const run=(i+variant+((j>>1)%2)*3)%8;
      const shoulder=run<2||run===2&&(j&1) ? 0 : run<6 ? 2 : 1;
      thickness[j*nx+i]=1+Math.min(layers-1,shoulder);
      tone[j*nx+i]=(Math.floor((i+(j&1))/2)*7+j*3+variant)%shades.length;
    }
    const name=body[key][0],base=col?.isColor?col.getHex():col;
    const palette=shades.map(value=>tint(base,value));
    function vertex(u,v,f){
      const px=x+(across?edge*f:edge*u),py=y+v,pz=z+(across?-edge*u:edge*f);
      return toWorld?toWorld(px,py,pz):[px,py,pz];
    }
    const n=(i,j)=>i<0||j<0||i>=nx||j>=ny?0:thickness[j*nx+i];
    for(let j=0;j<ny;j++){
      const lo=Y(j),hi=Y(j+1);
      for(let i=0;i<nx;){
        const k=j*nx+i,high=thickness[k],c=palette[tone[k]];
        let next=i+1;
        while(next<nx&&n(next,j)===high&&tone[j*nx+next]===tone[k])next++;
        const left=U(i),right=U(next),front=back+high*unit;
        panel(name,[vertex(left,lo,front),vertex(right,lo,front),vertex(right,hi,front),vertex(left,hi,front)],c);
        i=next;
      }
    }
    // Greedy runs along each exposed riser keep continuous edges in a
    // single quad. The stepped outline remains the same at either end.
    for(const [di,dj] of neighbors){
      const lanes=di?nx:ny,end=di?ny:nx;
      for(let line=0;line<lanes;line++)for(let at=0;at<end;){
        const i=di?line:at,j=di?at:line,high=n(i,j);
        const low=n(i+di,j+dj);
        if(low>=high){at++;continue;}
        let next=at+1;
        while(next<end){
          const ii=di?line:next,jj=di?next:line;
          if(n(ii,jj)!==high||n(ii+di,jj+dj)!==low)break;
          next++;
        }
        const rear=back+low*unit,front=back+high*unit;
        let a,b;
        if(di===-1){a=[U(i),Y(next)];b=[U(i),Y(j)];}
        else if(di===1){a=[U(i+1),Y(j)];b=[U(i+1),Y(next)];}
        else if(dj===1){a=[U(next),Y(j+1)];b=[U(i),Y(j+1)];}
        else{a=[U(i),Y(j)];b=[U(next),Y(j)];}
        panel(name,[vertex(...a,rear),vertex(...b,rear),vertex(...b,front),vertex(...a,front)],base);
        at=next;
      }
    }
    // An unbacked course is visible from a rear court or through window slots.
    if(remainder<=.005){
      panel(name,[vertex(U(0),Y(0),back),vertex(U(0),Y(ny),back),
        vertex(U(nx),Y(ny),back),vertex(U(nx),Y(0),back)],palette[0]);
    }
  };
}
