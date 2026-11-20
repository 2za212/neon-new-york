// Cell axes are storefront length, height and depth towards the customer.
// Only exposed faces are emitted into the existing static architecture batch.
export function cabinetSkin(size, paint, panel, world, palette) {
  const [width,height]=size;
  const stride=[1,width,width*height];
  const cells=new Uint8Array(stride[2]*size[2]);
  function fill(id,left,bottom,back,right,top,front){
    for(let v=back;v<front;v++)for(let y=bottom;y<top;y++){
      const row=y*width+v*stride[2];
      cells.fill(id,row+left,row+right);
    }
  }
  paint(fill);
  for(let axis=0;axis<3;axis++){
    const a=(axis+1)%3,b=(axis+2)%3,cols=size[a],rows=size[b];
    const mask=new Int16Array(cols*rows);
    for(let cut=0;cut<=size[axis];cut++){
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
        const k=cut*stride[axis]+i*stride[a]+j*stride[b];
        const lo=cut>0?cells[k-stride[axis]]:0,hi=cut<size[axis]?cells[k]:0;
        mask[j*cols+i]=lo&&!hi?lo:hi&&!lo?-hi:0;
      }
      for(let j=0;j<rows;j++)for(let i=0;i<cols;){
        const k=j*cols+i,id=mask[k];
        if(!id){i++;continue;}
        let w=1,h=1;
        while(i+w<cols&&mask[k+w]===id)w++;
        extend: while(j+h<rows){
          for(let col=0;col<w;col++)if(mask[k+h*cols+col]!==id)break extend;
          h++;
        }
        for(let row=0;row<h;row++)mask.fill(0,k+row*cols,k+row*cols+w);
        const corners=[[i,j],[i+w,j],[i+w,j+h],[i,j+h]].map(([u,v])=>{
          const p=[0,0,0];p[axis]=cut;p[a]=u;p[b]=v;return world(...p);
        });
        const [material,tint]=palette[Math.abs(id)];
        panel(material,id>0?corners:corners.reverse(),tint);
        i+=w;
      }
    }
  }
}

export function buildRecordCounter({panel,box,collider,practical,materials},z,length){
  const cell=.08,n=Math.round(length/cell),rear=-3.64,floor=.36,start=z-length/2;
  const world=(u,y,v)=>[rear-v*cell,floor+y*cell,start+u*cell];
  // The street doors pick up the light of their status glass on both axes.
  // One neutral enamel allows the lit shoulders and shadowed recesses to
  // share the same batch as each other across the two kiosks.
  const receiver='Record exchange / enamel return castings';
  if(materials&&!materials[receiver]){
    const finish=materials['Grid / dove enamel'].clone();
    finish.name=receiver;finish.color.setHex(0xffffff);finish.metalness=.18;
    finish.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        vec3 faceN=transformNormalByInverseViewMatrix(normal,viewMatrix);
        float bounce=.048+.068*max(0.,dot(faceN,vec3(.76,.57,.30)));
        outgoingLight+=sqrt(max(diffuseColor.rgb,vec3(0.)))*vec3(.69,.86,.87)*bounce;
        #include <opaque_fragment>`);
    };
    finish.customProgramCacheKey=()=>'record-return-casting-v1';
    materials[receiver]=finish;
  }
  const shell=materials?receiver:'Grid / dove enamel';
  const palette=[null,['districtIron',0xb2c4bd],['Grid / oxidised ceramic',0xc9d8ce],
    ['Grid / dove enamel',0xb2beb0],['Grid / oxide vermilion',0xc49378],
    ['Market / amber glass',0xac885e],['Grid / substation glazing',0x8daaa2],
    ['districtPaper',0xd1b891],['districtIron',0x768589],
    [shell,0x739397],[shell,0xb9c8b9],[shell,0x425d69],[shell,0xb27d62],
    ['Grid / substation glazing',0xc6fff1],['Market / amber glass',0xffd59d]];
  const [iron,teal,edge,oxide,amber,indicator,paper,ink]=[1,2,3,4,5,6,7,8];
  const [porcelain,lip,socket,bronze,ice,honey]=[9,10,11,12,13,14];
  cabinetSkin([n,38,16],fill=>{
    // Load-bearing skids, inset toe kick and stepped end cheeks.
    for(const u of [2,n-9]){
      fill(iron,u,0,1,u+7,2,11);
      fill(edge,u+1,2,2,u+6,4,10);
    }
    fill(ink,2,3,2,n-2,5,10);
    fill(iron,1,5,1,n-1,14,10);
    fill(teal,0,6,2,n,13,9);
    // Real drawer fronts and a deep vent behind the three horizontal vanes.
    const split=n-15;
    for(let y=5;y<13;y+=4){
      fill(teal,3,y,9,split-1,y+3,12);
      fill(edge,5,y+2,12,12,y+3,13);
    }
    fill(ink,split,5,8,n-2,13,11);
    for(let y=6;y<=12;y+=3)fill(teal,split+1,y,11,n-3,y+1,13);
    for(const u of [1,n-3])fill(oxide,u,5,8,u+2,14,12);
    fill(iron,0,13,1,n,15,12);
    fill(edge,1,15,1,n-1,16,14);
    fill(oxide,3,15,14,n-4,16,15);
    // Shelved service recess. Its warm source is a strip inside the lintel;
    // the shelves, sleeves and opaque back plate stay independently shaded.
    fill(teal,1,16,1,n-1,28,3);
    fill(ink,3,17,3,split,27,4);
    fill(edge,2,20,3,split,21,8);
    for(let u=4,slot=0;u<split-4;u+=6,slot++){
      const sleeve=slot%3===1?oxide:paper;
      fill(sleeve,u,16,5,u+4,20,8);
      fill(ink,u+1,19,7,u+3,20,8);
      const top=slot%2?24:25;
      fill(slot%2?paper:teal,u+1,21,4,u+5,top,6);
      fill(edge,u+2,top,4,u+4,top+1,5);
    }
    fill(amber,3,26,4,split,27,9);
    // The terminal occupies one end only. Its screen sits behind the bezel.
    fill(iron,split,16,2,n-2,28,10);
    fill(teal,split,17,10,n-3,27,12);
    fill(ink,split+1,19,12,n-4,26,13);
    fill(indicator,split+3,22,13,n-6,24,14);
    fill(edge,split+2,17,12,split+6,18,14);
    for(const u of [0,n-2]){
      fill(iron,u,15,1,u+2,28,8);
      fill(teal,u,25,8,u+2,28,11);
    }
    // Street side. The upper return mouth cuts through the back wall to
    // the real stock shelves; a stopped steel channel catches the sleeves.
    const wheel=n-12, mouthStart=4,mouthEnd=wheel-6;
    fill(0,0,4,0,n,28,4);
    fill(socket,1,4,3,n-1,28,5);
    fill(0,mouthStart,18,0,mouthEnd,26,7);
    fill(lip,2,16,1,mouthEnd+1,18,5);
    fill(honey,mouthStart,17,0,mouthEnd-1,18,2);
    fill(bronze,mouthStart,18,3,mouthEnd,19,6);
    fill(porcelain,2,25,1,mouthEnd+2,27,6);
    fill(ice,4,25,2,mouthEnd,26,4);
    for(let u=5;u<mouthEnd-2;u+=5){
      fill(u%2?paper:oxide,u,19,4,u+3,23,7);
      fill(lip,u+1,21,4,u+2,22,5);
    }
    // This annular spindle is open in the middle. Ceramic pads, a copper
    // housing and two opposed status lamps sit at distinct physical depths.
    for(let row=-4;row<=4;row++)for(let col=-4;col<=4;col++){
      const rr=row*row+col*col;
      if(rr<7||rr>20)continue;
      const y=22+row,u=wheel+col,front=rr<13?1:0;
      fill(row===0&&Math.abs(col)>2?honey:rr<13?bronze:oxide,u,y,front,u+1,y+1,5);
    }
    fill(socket,wheel-2,21,2,wheel+3,24,5);
    fill(ice,wheel-1,22,1,wheel+2,23,3);
    for(const u of [1,mouthEnd+1,n-4]){
      fill(porcelain,u,15,1,u+3,28,5);
      for(const y of [16,21,26])fill(lip,u, y,0,u+2,y+2,3);
    }
    // Forked skids and dovetailed removable battery doors. Every recessed
    // aperture has a solid liner behind its stepped nose.
    for(const u of [2,n-11]){
      fill(socket,u,0,1,u+9,2,12);fill(lip,u+1,1,0,u+7,3,5);
      fill(bronze,u+2,3,1,u+6,5,11);fill(porcelain,u+1,4,0,u+8,6,7);
    }
    for(let u=3,slot=0;u<n-6;u+=9,slot++){
      const end=Math.min(n-3,u+8);
      fill(porcelain,u,6,1,end,13,5);
      fill(slot%2?socket:bronze,u+1,7,0,end-1,9,3);
      fill(lip,u+1,11,0,end-1,13,3);
      fill(slot%3?honey:ice,u+2,10,1,end-2,11,3);
    }
    for(let u=0;u<n;u+=4){
      const len=Math.min(4,n-u);
      fill(u%8?porcelain:lip,u,13,u%8?1:0,u+len,15,6);
    }
    // The hood rises over the powered terminal. End steps are visible in profile.
    fill(iron,0,28,1,n,29,12);
    fill(teal,1,29,0,n-1,31,14);
    fill(edge,3,29,14,split,30,15);
    fill(teal,3,31,1,n-3,32,12);
    fill(iron,split-1,32,2,n-4,34,10);
    fill(teal,split+1,34,3,n-5,36,9);
    fill(oxide,split+3,36,4,n-6,37,8);
    for(let u=1;u<n-1;u+=4){
      const shade=(u>>2)%3;
      fill(shade===2?lip:porcelain,u,28,0,Math.min(n-1,u+4),30,4);
      if(shade!==2)fill(ice,u,28,0,Math.min(n-1,u+2),29,2);
    }
  },panel,world,palette);
  function envelope(u,y,v,w,h,d){
    collider(...world(u+w/2,y+h/2,v+d/2),d*cell,h*cell,w*cell);
  }
  envelope(0,0,1,n,16,12);
  envelope(1,16,1,n-2,12,3);
  envelope(n-15,16,4,13,12,9);
  for(const u of [0,n-2])envelope(u,16,2,2,12,6);
  envelope(0,28,0,n,4,14);
  envelope(n-15,32,2,11,5,8);
  // A raised, sealed roof plate registers the service bay with the rain mask.
  box('Grid / oxidised ceramic',...world(n/2,32.5,6.5),.72,cell,(n-8)*cell,0x9fafa6);
  practical(-4.47,2.36,z-.24,0xffba83,12,4.5);
}
