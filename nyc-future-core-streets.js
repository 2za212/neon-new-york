import * as T from 'three';
import {coreOutline,coreRoutes,freightWell} from './nyc-future-core-layout.js';
import {bindPavementUV} from './nyc-pavement-finish.js';

// Horizontal surfaces share metric UVs. Join equal adjacent street cells into
// runs before upload; at street corners the exposed 80 cm course stays visible.
const CELL=.8, DRIVE=.18, WALK=.30;
// Optical source positions are shared with the local fixtures; the footprint
// is deliberately confined to drainage pockets on their public-facing side.
const wetSources=[
  {lamp:[47.1,2.5,-194.6],tint:0xffb973,pocket:[49.3,-194,4.0,2.2]},
  {lamp:[36,2.5,-209.6],tint:0xf0b883,pocket:[38.6,-209,3.2,2.2]},
  {lamp:[49.8,2.36,-251.8],tint:0x9fcde4,pocket:[51.8,-249,4.4,2.7]},
  {lamp:[48,3.9,-259.5],tint:0xccefff,pocket:[51.0,-252.4,6.2,3.8],bays:5},
  {lamp:[48,3.9,-259.5],tint:0xccefff,pocket:[42.8,-239.7,3.3,5.7],bays:5},
  {lamp:[102,3.9,-226.0],tint:0xccefff,pocket:[101,-215,6.2,2.7],bays:7},
  {lamp:[71.1,-1.3,-216],tint:0xefbd83,pocket:[73.3,-216.4,2.8,4.2],lower:true}
];

function dampPockets(scene,surfaceHeight){
  const positions=[],sources=[],colors=[],bayCounts=[],indices=[];
  const filled=new Set();
  for(const {lamp,tint,pocket:[cx,cz,rx,rz],lower,bays=0} of wetSources){
    const color=new T.Color(tint);
    const step=.4;
    for(let ir=Math.floor((cz-rz)/step);ir<Math.ceil((cz+rz)/step);ir++){
      let start=0,height=null;
      const end=Math.ceil((cx+rx)/step);
      for(let ic=Math.floor((cx-rx)/step);ic<=end;ic++){
        const x=(ic+.5)*step,z=(ir+.5)*step;
        const u=(x-cx)/rx,v=(z-cz)/rz;
        const wet=ic<end&&u*u+v*v<=.78+.14*Math.cos(ic*.72+ir*.31)+.09*Math.sin(ir*.84);
        let y=wet?(lower?-5.82:surfaceHeight(x,z)):null;
        const key=ic+'/'+ir+'/'+y;
        if(filled.has(key))y=null;
        if(y!==null)filled.add(key);
        if(y===height)continue;
        if(height!==null){
          const i=positions.length/3;
          for(const [col,row] of [[start,ir],[start,ir+1],[ic,ir+1],[ic,ir]]){
            // Above the 10 mm voxel paver crowns at both street LODs.
            positions.push(col*step,height+.014,row*step);sources.push(...lamp);colors.push(color.r,color.g,color.b);bayCounts.push(bays);
          }
          indices.push(i,i+1,i+2,i,i+2,i+3);
        }
        start=ic;height=y;
      }
    }
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('bayCount',new T.Float32BufferAttribute(bayCounts,1));
  for(const [name,values] of [['position',positions],['source',sources],['glint',colors]])geo.setAttribute(name,new T.Float32BufferAttribute(values,3));
  geo.setIndex(indices);geo.computeBoundingSphere();
  const material=new T.ShaderMaterial({
    transparent:true,depthWrite:false,
    vertexShader:`attribute vec3 source,glint;attribute float bayCount;varying float bays;
      varying vec3 wp,lit,col;
      void main(){wp=position;lit=source;col=glint;bays=bayCount;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 wp,lit,col;varying float bays;
      void main(){
        vec3 eye=normalize(cameraPosition-wp);
        vec3 incident=normalize(wp-lit);vec3 bounce=vec3(incident.x,-incident.y,incident.z);
        float align=max(0.,dot(eye,bounce));
        float reflection=.25*pow(align,4.)+.72*pow(align,20.);
        float ripple=.82+.18*cos(wp.z*12.+sin(wp.x*5.));
        float gain=reflection*ripple;
        if(bays>0.){
          // Mirror the station aperture in the wet paving. Distance and bay
          // divisions come from the same two ticket halls as the baked spill.
          vec3 ray=vec3(-eye.x,eye.y,-eye.z);
          vec2 n=vec2(-.25,.96825),along=vec2(n.y,-n.x);
          float facing=dot(ray.xz,n);
          float t=dot(lit.xz-wp.xz,n)/min(-.001,facing);
          vec3 hit=wp+ray*t-lit;
          float pitch=bays>6.?3.52:2.88;
          float x=dot(hit.xz,along)+.15*sin(wp.z*5.0);
          float y=hit.y+.18*sin(wp.x*4.0+wp.z);
          float edge=1.-smoothstep(bays*.5*pitch-.8,bays*.5*pitch+1.,abs(x));
          float wall=1.-smoothstep(1.45,2.57,abs(y));
          float jamb=smoothstep(.04,.23,abs(fract(x/pitch)-.5));
          gain=.08*gain+float(facing<0.&&t>0.)*edge*wall*(.28+.65*jamb)*ripple;
        }
        gl_FragColor=vec4(mix(vec3(.023,.042,.057),col*.93,gain),.16+.51*gain);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh=new T.Mesh(geo,material);mesh.name='核心区 / 营业灯下积水';mesh.renderOrder=1;
  mesh.matrixAutoUpdate=false;scene.add(mesh);
}
function buildPavement(scene,api,outline,roads,well){
  const edges=roads.flatMap(({points,width})=>points.slice(1).map(([bx,bz],i)=>{
    const [ax,az]=points[i],dx=bx-ax,dz=bz-az,margin=width/2+3;
    return {ax,az,dx,dz,len2:dx*dx+dz*dz,half:width/2,left:Math.min(ax,bx)-margin,right:Math.max(ax,bx)+margin,top:Math.min(az,bz)-margin,bottom:Math.max(az,bz)+margin};
  }));
  const minX=Math.floor(Math.min(...outline.map(p=>p[0]))/CELL),maxX=Math.ceil(Math.max(...outline.map(p=>p[0]))/CELL);
  const minZ=Math.floor(Math.min(...outline.map(p=>p[1]))/CELL),maxZ=Math.ceil(Math.max(...outline.map(p=>p[1]))/CELL);
  const cols=maxX-minX,rows=maxZ-minZ,grid=new Uint8Array(cols*rows);
  for(let row=0;row<rows;row++){
    const z=(minZ+row+.5)*CELL,intersections=[];
    for(let i=0,j=outline.length-1;i<outline.length;j=i++){
      const [xa,za]=outline[i],[xb,zb]=outline[j];
      if((za>z)!==(zb>z))intersections.push(xa+(z-za)*(xb-xa)/(zb-za));
    }
    intersections.sort((a,b)=>a-b);
    const nearby=edges.filter(e=>z>=e.top&&z<=e.bottom);
    for(let r=0;r<intersections.length;r+=2){
      const first=Math.max(0,Math.ceil(intersections[r]/CELL-.5)-minX),last=Math.min(cols,Math.ceil(intersections[r+1]/CELL-.5)-minX);
      for(let col=first;col<last;col++){
        const x=(minX+col+.5)*CELL;
        if(x>well.minX&&x<well.maxX&&z>well.minZ&&z<well.maxZ)continue;
        let dist=Infinity;
        for(const e of nearby){
          if(x<e.left||x>e.right)continue;
          const t=Math.max(0,Math.min(1,((x-e.ax)*e.dx+(z-e.az)*e.dz)/e.len2));
          dist=Math.min(dist,Math.hypot(x-e.ax-t*e.dx,z-e.az-t*e.dz)-e.half);
        }
        const forecourt=z<-250&&z>-273&&x>44+(z+261)*.40&&x<80+(z+261)*.18;
        grid[row*cols+col]=dist<0?1:dist<.65?2:dist<2.8||forecourt?3:4;
      }
    }
  }
  // Both the road bed and its near-field voxel paving use the core's
  // window-light atlas. Keep a single material for those two representations.
  for(const [base,key] of [['asphalt','coreAsphalt'],['paver','corePaver']]){
    const mat=api.materials[base].clone();
    mat.userData.corePaving=true;
    bindPavementUV(mat);
    api.materials[key]=mat;
  }
  const materials=['','coreAsphalt','trim','corePaver','corePaver','curbStone'];
  const tints=[0,0xb5bfc4,0x82949b,0xb7bec2,0x9da8a9,0xc5c9c6].map(c=>new T.Color(c));
  const batches=new Map();
  function face(tileX,tileZ,kind,corners,normal,shade=1){
    const key=tileX+','+tileZ+','+kind;
    let b=batches.get(key);
    if(!b){b={p:[],n:[],c:[],uv:[],indices:[],mat:api.materials[materials[kind]]};batches.set(key,b);}
    const k=b.p.length/3,t=tints[kind],uv=b.mat.userData.textureMeters||2;
    for(const [x,y,z] of corners){
      b.p.push(x,y,z);b.c.push(t.r*shade,t.g*shade,t.b*shade);b.n.push(...normal);
      b.uv.push((normal[0]?z:x)/uv,(normal[1]?z:y)/uv);
    }
    b.indices.push(k,k+1,k+2,k,k+2,k+3);
  }
  // Merge contiguous rectangles vertically as well as across each row.
  let active=new Map(),walkSpans=new Map();
  function flush(p){
    const x=(minX+p.a)*CELL,xx=(minX+p.b)*CELL,z=(minZ+p.r)*CELL,zz=(minZ+p.end)*CELL;
    const y=p.kind===1?DRIVE:p.kind===2?WALK-.064:WALK;
    face(p.tx,p.tz,p.kind,[[x,y,z],[x,y,zz],[xx,y,zz],[xx,y,z]],[0,1,0]);
    if(p.kind!==2)api.registerPaving?.(api.materials[materials[p.kind]],(x+xx)/2,y,(z+zz)/2,xx-x,zz-z,tints[p.kind].getHex(),true);
  }
  for(let row=0;row<rows;row++){
    const next=new Map(),tz=Math.floor((minZ+row)/160);
    for(let a=0;a<cols;){
      const kind=grid[row*cols+a],tx=Math.floor((minX+a)/160);
      let b=a+1;
      while(b<cols&&grid[row*cols+b]===kind&&Math.floor((minX+b)/160)===tx)b++;
      if(kind){
        const key=[kind,a,b,tz].join('/'),p=active.get(key)||{kind,a,b,tx,tz,r:row};
        p.end=row+1;next.set(key,p);active.delete(key);
      }
      a=b;
    }
    for(const p of active.values())flush(p);
    active=next;
    // Navigation only needs height changes; a change in trim or paving
    // material must not create another collision query for each tread band.
    const nextWalk=new Map();
    for(let a=0;a<cols;){
      if(grid[row*cols+a]<2){a++;continue;}
      let b=a+1;
      while(b<cols&&grid[row*cols+b]>=2)b++;
      const key=a+'/'+b,span=walkSpans.get(key)||[(minX+a)*CELL,(minX+b)*CELL,(minZ+row)*CELL,0,WALK];
      span[3]=(minZ+row+1)*CELL;nextWalk.set(key,span);walkSpans.delete(key);a=b;
    }
    for(const span of walkSpans.values())api.surface(...span);
    walkSpans=nextWalk;
  }
  for(const p of active.values())flush(p);
  for(const span of walkSpans.values())api.surface(...span);
  // Long interlocked coping blocks run along straight edges; the diagonal
  // outside corners turn into toothed square headers with an exposed return.
  function cap(tx,tz,x,xx,z,zz,top,base,shade){
    face(tx,tz,5,[[x,top,z],[x,top,zz],[xx,top,zz],[xx,top,z]],[0,1,0],shade);
    face(tx,tz,5,[[x,base,z],[x,base,zz],[x,top,zz],[x,top,z]],[-1,0,0],shade*.89);
    face(tx,tz,5,[[xx,base,zz],[xx,base,z],[xx,top,z],[xx,top,zz]],[1,0,0],shade*.87);
    face(tx,tz,5,[[xx,base,z],[x,base,z],[x,top,z],[xx,top,z]],[0,0,-1],shade*.86);
    face(tx,tz,5,[[x,base,zz],[xx,base,zz],[xx,top,zz],[x,top,zz]],[0,0,1],shade*.90);
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const kind=grid[r*cols+c];
    if(kind!==2&&kind!==3)continue;
    const x=(minX+c)*CELL,z=(minZ+r)*CELL,xx=x+CELL,zz=z+CELL;
    const tx=Math.floor((minX+c)/160),tz=Math.floor((minZ+r)/160);
    if(kind===3){
      // A short run of keyed light-stone setts at a frontage marks the dry
      // pedestrian edge. Their raised noses are within normal foot clearance.
      if((r+c)%7===0)continue;
      const west=c>0&&grid[r*cols+c-1]===4,east=c+1<cols&&grid[r*cols+c+1]===4;
      const north=r>0&&grid[(r-1)*cols+c]===4,south=r+1<rows&&grid[(r+1)*cols+c]===4;
      if(west||east){
        const lip=east?xx-.34:x+.02;
        cap(tx,tz,lip,lip+.32,z+.012,zz-.012,WALK+.028,WALK,.93);
      }else if(north||south){
        const lip=south?zz-.34:z+.02;
        cap(tx,tz,x+.012,xx-.012,lip,lip+.32,WALK+.028,WALK,.93);
      }
      continue;
    }
    const left=c>0&&grid[r*cols+c-1]===1,right=c+1<cols&&grid[r*cols+c+1]===1;
    const near=r>0&&grid[(r-1)*cols+c]===1,far=r+1<rows&&grid[(r+1)*cols+c]===1;
    const shade=.87+((c*13+r*17)%5)*.036,head=(c+2*r)%7===0;
    const top=WALK+(head?.025:.008),base=(left||right||near||far)?DRIVE:WALK-.064;
    const x0=x+.012-(left?.046:0),x1=xx-.012+(right?.046:0);
    const z0=z+.012-(near?.046:0),z1=zz-.012+(far?.046:0);
    if(head&&(left||right)){
      cap(tx,tz,x0,x1,z0,z+.36,top,base,shade);
      cap(tx,tz,x0+.02,x1-.02,z+.38,z1,top-.016,base,shade*.96);
    }else if(head&&(near||far)){
      cap(tx,tz,x0,x+.36,z0,z1,top,base,shade);
      cap(tx,tz,x+.38,x1,z0+.02,z1-.02,top-.016,base,shade*.96);
    }else cap(tx,tz,x0,x1,z0,z1,top,base,shade);
  }
  for(const b of batches.values()){
    const g=new T.BufferGeometry();
    for(const [key,data,size] of [['position',b.p,3],['normal',b.n,3],['color',b.c,3],['uv',b.uv,2]])g.setAttribute(key,new T.Float32BufferAttribute(data,size));
    g.setIndex(b.indices);g.computeBoundingSphere();
    const mesh=new T.Mesh(g,b.mat);mesh.name='核心区 / 地面与路缘';mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;scene.add(mesh);
  }
  dampPockets(scene,(x,z)=>{
    const kind=grid[(Math.floor(z/CELL)-minZ)*cols+Math.floor(x/CELL)-minX];
    return kind===1?DRIVE:kind>=3?WALK:null;
  });
}

// The public promenade overlooks a freight street. Both ends run beneath
// loading doors, so a lorry below the player has a plausible route through.
function freightCut({box:B,collider:C,surface,sign},well){
  const {minX,maxX,minZ,maxZ}=well,cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
  const width=maxX-minX,length=maxZ-minZ,floor=-5.82;
  B('asphalt',cx,floor-.20,cz,width,.4,length,0x9ba4a7);
  surface(minX,maxX,minZ,maxZ,floor);
  const long=length>=width;
  const halfWidth=(long?width:length)*.5,halfLength=(long?length:width)*.5;
  function part(mat,u,y,v,w,h,d,col){
    B(mat,cx+(long?u:v),y,cz+(long?v:u),long?w:d,h,long?d:w,col);
  }
  function solid(u,y,v,w,h,d){
    C(cx+(long?u:v),y,cz+(long?v:u),long?w:d,h,long?d:w);
  }
  for(const side of [-1,1]){
    const u=side*halfWidth,v=side*halfLength;
    part('concrete',u,-3.03,0,.6,6.34,halfLength*2,0xa6b4b8);
    part('concrete',0,-3.03,v,halfWidth*2,6.34,.6,0x829298);
    part('rubber',0,-3.73,v-side*.32,halfWidth*1.14,3.76,.38);
    for(let n=0;n<5;n++)part('metal',0,-5.06+n*.66,v-side*.56,halfWidth*1.04,.18,.14,0x8e9fa4);
    part('lamp',0,-1.62,v-side*.56,halfWidth*.70,.14,.20);
    const runs=[[u,0,.70,halfLength*2]];
    // Leave a landing at the south-east corner for a fire stair. A player who
    // enters the lower lane can climb back to the public promenade.
    const stairU=halfWidth-1.72,stairHalf=1.02;
    if(side<0)runs.push([0,v,halfWidth*2,.70]);
    else for(const [a,b] of [[-halfWidth,stairU-stairHalf],[stairU+stairHalf,halfWidth]])runs.push([(a+b)/2,v,b-a,.70]);
    solid(u,-2.90,0,.6,6.04,halfLength*2);
    solid(0,-2.90,v,halfWidth*2,6.04,.6);
    for(const [a,b,w,d] of runs){
      part('trim',a,.23,b,w,.42,d,0x99a6a9);
      part('metal',a,.87,b,w<1?.12:w,.12,d<1?.12:d,0x8e9da1);
      part('metal',a,1.34,b,w<1?.21:w,.22,d<1?.21:d,0xafc4c8);
      solid(a,.90,b,w,1.28,d);
    }
    // Precast wall panels lap at the returns. Deepest courses and brackets
    // fit inside the existing promenade envelope; the stair stays clear.
    for(let course=0;course<5;course++){
      const y=-5.22+course*1.07;
      for(let start=-halfLength-((course&1)*1.28);start<halfLength;start+=2.56){
        const a=Math.max(-halfLength+.32,start),b=Math.min(halfLength-.32,start+2.53);
        if(b-a<.15)continue;
        const advance=course===0||course===3?.16:.08;
        part('concrete',u-side*(.30+advance*.5),y,(a+b)/2,advance,1.02,b-a,course===3?0xa0aaa8:0xb2bcba);
      }
    }
    for(let cap=-halfLength+.64,index=0;cap<halfLength-.15;cap+=1.28,index++){
      const reach=Math.min(1.25,(halfLength-cap)*2);
      part('curbStone',u,.49,cap,index%3===0?.80:.67,.16,reach,index%4===0?0xaebbc1:0xc3c6ba);
    }
    for(let dz=-halfLength+.72,idx=0;dz<halfLength;dz+=2.56,idx++){
      part('metal',u,.89,dz,.24,1.10,.24,0x6b8790);
      part('trim',u-side*.17,-2.74,dz,.5,5.94,.64,0x919da2);
      part('trim',u,.63,dz,.59,.25,.57,0x8a9da2);
      if((idx&1)===0){
        part('metal',u-side*.35,-.30,dz,.52,.48,.88,0x617a85);
        part('trim',u-side*.42,-.59,dz,.38,.20,.62,0x98a8a8);
      }
      if(idx%3===1){
        part('metal',u-side*.50,-1.63,dz,.46,.58,1.24,0x9eacaf);
        part(side<0?'lamp':'cyan',u-side*.76,-1.66,dz,.10,.31,1.04,side<0?0xffce88:0x8ed6d9);
        if(side<0)for(const offset of [-.36,0,.36]){
          part('metal',u+.84,-1.66,dz+offset,.09,.38,.067,0xa3a59b);
        }
      }
    }
    for(let dx=-halfWidth+.72;dx<halfWidth;dx+=2.56){
      if(side<0||Math.abs(dx-stairU)>stairHalf)part('metal',dx,.88,v,.24,1.10,.24);
    }
    part('metal',u-side*.37,-2.4,0,.22,.26,halfLength*2-.96);
  }
  // The west wall carries the night-shift exhaust main. Its stepped square
  // duct changes section at the fan boxes; the hangers cast a separate shadow
  // on the wall behind. All of it clears the walking lane below.
  const west=-halfWidth,east=halfWidth;
  for(let v=-halfLength+2.1,i=0;v<halfLength-.44;v+=3.2,i++){
    const span=Math.min(3.14,2*(halfLength-.28-v));
    const rise=i%5===1?.28:0;
    part('trim',west+.78,-2.02+rise,v,.74,.76,span,0xbed0cc);
    part('metal',west+1.13,-2.03+rise,v,.14,.43,span,0xbfc8bb);
    part('metal',west+.77,-2.02+rise,v-span/2+.10,.95,.94,.19,0x546e78);
    if(i%3===2){
      part('metal',west+.71,-1.34,v,.88,.18,.30);
      part('metal',west+.99,-1.55,v,.19,.55,.30);
    }
    // Loading traffic side: cool bay lamps above a stepped kerb. The nearest
    // stair landings share this wall, so keep their overhead clearance clear.
    if(v<halfLength-14&&i%2===0){
      part('castEnamel',east-.47,-3.15,v,.33,.76,2.16,0xb7c8c5);
      part('metal',east-.66,-2.86,v,.34,.17,2.33,0xc2cac7);
      const litSpan=.70+1.06*(v+halfLength)/(2*halfLength);
      part('cyan',east-.67,-3.09,v,.11,.17,litSpan,0x90cbd4);
      part('curbStone',east-.60,floor+.22,v,.82,.44,2.45,0xc4ccc2);
      part('rubber',east-.96,floor+.46,v,.39,.2,2.3);
      solid(east-.72,floor+.28,v,.87,.56,2.45);
    }
  }
  for(const [v,bay] of [[-10.6,'B04'],[7.0,'B02']]){
    part('metal',west+.68,-3.12,v,.64,1.36,3.60,0x778d96);
    part('trim',west+1.01,-2.51,v,.40,.22,3.88,0xc1bdb0);
    part('rubber',west+1.04,-3.11,v,.12,.88,2.94);
    for(let j=0;j<6;j++)part('castEnamel',west+1.15,-3.11,v-1.20+j*.48,.22,.83,.19,0xcad3c9);
    part('trim',west+.79,-2.43,v,.67,.38,1.10,0xb7c2c0);
    part('lamp',west+1.15,-2.54,v+1.32,.12,.16,.42,0xffd887);
    // Two armoured cable trays turn under the fan grille and pick up again
    // at the next bay. They sit above a human shoulder.
    for(const y of [-3.69,-3.94]){
      part('metal',west+.70,y,v,.63,.17,4.7,0x8b9999);
      part('wood',west+.83,y+.09,v,.14,.12,4.35,0xb9906c);
      for(const k of [-1.8,0,1.8])part('metal',west+.98,y+.09,v+k,.13,.25,.16);
    }
    sign?.(cx+west+1.18,-3.11,cz+v+2.55,1.12,.58,bay,'EXTRACTION','#edc18a',Math.PI/2);
  }
  // The terminal shutter now has a motor housing, guide cheeks and vehicle-
  // sized warning clearances, visible beyond the long converging walls.
  const gate=-halfLength+.57;
  for(const side of [-1,1]){
    part('metal',side*3.73,-3.35,gate,.76,4.95,.83,0xaebabc);
    solid(side*3.73,-3.35,gate,.76,4.95,.83);
    part('trim',side*3.70,-.91,gate+.08,1.06,.54,.98,0xcbd3c7);
    for(let i=0;i<4;i++)part(i&1?'rubber':'yellow',side*3.71,-5.25+i*.4,gate+.48,.62,.36,.19,0xd4c288);
  }
  part('castEnamel',0,-.94,gate,8.16,.79,1.12,0x9cadac);
  part('metal',0,-1.44,gate+.28,7.68,.24,.86,0xb5c5c7);
  for(let i=0;i<7;i++)part('trim',-3.12+i*1.04,-.92,gate+.59,.23,.72,.16,0xc2cac5);
  sign?.(cx,-1.94,cz+gate+.78,3.84,.77,'转运 04','FREIGHT TRANSFER','#9fdde2',0);
  // Low autonomous tractor with four projected wheel arches, raised cab and a
  // ribbed pallet; the silhouette is legible from a standing person's eye.
  // Park at the marked B04 loading bay, leaving the central freight lane open.
  const v0=-10.6,u0=-halfWidth+3.04;
  solid(u0,floor+.92,v0,2.64,1.80,5.40);
  solid(u0,floor+2.01,v0+1.39,2.08,.46,1.61);
  function vehicle(mat,u,y,v,w,h,d,col){part(mat,u0+u,floor+y,v0+v,w,h,d,col);}
  vehicle('rubber',0,.55,0,2.38,.40,5.4);
  vehicle('taxi',0,.85,1.54,2.40,.45,1.94);
  vehicle('taxi',0,1.26,1.38,2.22,.44,1.56,0xd4c2a5);
  vehicle('glass',0,1.79,1.44,1.90,.76,1.3);
  vehicle('taxi',0,2.23,1.37,2.05,.2,1.58);
  vehicle('metal',0,.79,-1.03,2.40,.30,3.39,0x778e96);
  vehicle('castEnamel',0,1.47,-1.1,2.06,1.12,2.79,0xb5cdd2);
  for(let i=0;i<5;i++)vehicle('trim',0,2.05,-2.28+i*.56,2.08,.11,.09,0x9dabb1);
  for(const side of [-1,1]){
    for(const v of [-1.78,1.40]){
      vehicle('rubber',side*1.10,.43,v,.39,.82,.88);
      vehicle('metal',side*1.30,.43,v,.08,.32,.36,0xa6bfc3);
      vehicle('taxi',side*1.10,.86,v,.52,.16,1.15);
    }
    vehicle('lamp',side*.79,1.13,2.54,.46,.15,.11);
  }
  const stairU=halfWidth-1.72,count=24,run=.54,rise=(WALK-floor)/count;
  for(let i=0;i<count;i++){
    const v=halfLength-.18-(count-i-.5)*run,cap=floor+rise*(i+1);
    // Offset the seam each tread but maintain one continuous collision top.
    const split=(i&1)?.76:1.16;
    part('concrete',stairU,(floor+cap-.08)/2,v,1.94,cap-floor-.08,run,0x88999d);
    const edge=stairU-.97;
    for(const [a,b] of [[0,split],[split,1.94]]){
      part('curbStone',edge+(a+b)/2,cap-.04,v-.018,b-a-.014,.08,run+.018,(i+Math.round(b))%4===0?0xb1bdbd:0xc8cec7);
    }
    solid(stairU,(floor+cap)/2,v,1.94,cap-floor,run);
    if(i%4===3)part('yellow',stairU,cap+.008,v-.20,1.76,.016,.09);
  }
  part('concrete',stairU,WALK-.06,halfLength+.16,2.04,.12,.70);
  const [sx,sz]=long?[cx+stairU,cz+halfLength+.16]:[cx+halfLength+.16,cz+stairU];
  surface(sx-(long?1.02:.35),sx+(long?1.02:.35),sz-(long?.35:1.02),sz+(long?.35:1.02),WALK);
}

// Shop fixtures face the pedestrian spine. The canopy is stepped and kept over
// the counter, leaving the approach and shoulder-camera lane uninterrupted.
function nightCounter(api,x,z,yaw,name){
  const co=Math.cos(yaw),si=Math.sin(yaw);
  function local(u,v){return [x+u*co+v*si,z-u*si+v*co];}
  function part(mat,u,y,v,w,h,d,tint){const [xx,zz]=local(u,v);api.box(mat,xx,y,zz,w,h,d,tint,yaw);}
  // Separate short AABBs keep diagonal shop corners clear of the sidewalk.
  for(const u of [-1.36,0,1.36]){
    const [xx,zz]=local(u,-.16);
    api.collider(xx,.92,zz,1.48,1.26,1.38);
  }
  part('metal',0,.88,-.22,4.36,1.12,1.54,0x7c9b9e);
  part('trim',0,1.47,-.17,4.56,.14,1.74,0xd0b88d);
  for(const u of [-1.88,1.88]){
    part('metal',u,1.96,-.75,.14,3.3,.18,0xc1b08e);
    part('metal',u,3.24,-.1,.18,.18,1.75,0xa3b1a4);
  }
  for(let band=0;band<3;band++)part('castEnamel',0,3.51-band*.13,-.91+band*.68,4.80,.21,.76,0x648382);
  part('lamp',0,3.11,.42,3.76,.09,.16,0xfde9af);
  for(let i=0;i<4;i++){
    part('metal',-.96+i*.51,1.61,.05,.42,.16,.39,0xb49d79);
    part('trim',-.96+i*.51,1.74,.05,.28,.13,.31,0xbeb083);
  }
  const [xx,zz]=local(-1.57,.54);
  api.sign?.(xx,2.67,zz,1.40,.69,name,'夜班供应','#e5b37c',yaw);
}

function forecourtSeats({box,collider},x,z,length){
  // The bench doubles as the raised edge of a storm bed. Bonded corner
  // returns enclose the planting and the cut-back bays carry timber seats.
  const depth=1.6,base=.30,half=length/2;
  function place(mat,u,y,v,w,h,d,tint){box(mat,x+u,base+y,z+v,w,h,d,tint);}
  collider(x,base+.34,z,length,.68,depth);
  place('metal',0,.16,0,length-.12,.32,depth-.12,0x677980);
  place('concrete',0,.57,-.12,length-.48,.26,1.13,0x665d4d);
  for(const side of [-1,1]){
    for(let k=0;k<3;k++){
      const y=.24+k*.16,cut=(k&1)?.32:0;
      for(let u=-half+cut;u<half-.015;u+=.96){
        const reach=Math.min(.96,half-u);
        place('curbStone',u+reach/2,y,side*.65,reach-.015,.153,.30,0xb3bab3);
      }
      if(cut)place('curbStone',-half+cut*.5,y,side*.65,cut-.012,.153,.30,0xa2aaa6);
      place('curbStone',side*(half-.15),y,0,.30,.153,k&1?1.30:.98,0xbcc1b5);
    }
  }
  for(let u=-half+.56,i=0;u<half-.3;u+=.80,i++){
    const tall=i%3===0?.88:.64;
    place('metal',u,.35,.77,.32,.32,.26,0x6d7f86);
    for(const v of [.67,.86,1.05])place('wood',u,.49,v,.77,.15,.17,0xbcb39a);
    place('leaf',u,.68+tall/2,-.17,.62,tall,.57,0xabb8a4);
    place('leaf',u+.15,.72+tall,-.07,.31,.19,.35,0xc2c8b4);
    if(i%3===1)place('darkLeaf',u-.27,.82,-.34,.26,.49,.30,0xc5bfa9);
  }
  collider(x,base+.21,z+.92,length-.3,.50,.45);
}

function routeFixtures(api){
  const {box,collider,sign}=api;
  function beacon(x,z,lit){
    box('metal',x,.45,z,.52,.30,.52,0xa7b6b7);
    box('metal',x,1.91,z,.22,2.68,.26,0x8c9fa6);
    box('metal',x,3.11,z,.44,.48,.44,0x627684);
    box(lit?'lamp':'cyan',x,3.42,z,.34,.22,.34);
    box('trim',x,3.60,z,.49,.13,.49,0x9aadae);
    collider(x,1.92,z,.42,3.22,.42);
  }
  for(const [x,z,warm] of [[64,-188,true],[49,-196,true],[46,-216,true],[34,-232,false],[56,-244,false],[78,-265,false],[-35,-205,true],[-22,-279,false],[132,-280,false],[94,-298,false],[68,-347,false]])beacon(x,z,warm);

  nightCounter(api,46,-195,1.06,'夜班食堂');
  nightCounter(api,35,-210,1.12,'热茶');
  forecourtSeats(api,38,-249,4.8);
  forecourtSeats(api,70,-248,6.4);
  // Queuing dividers, a recessed map screen and retrieval lockers on one edge
  // of the interchange. The station entrance stays legible from the bend.
  for(let i=0;i<3;i++){
    const x=52.2+1.7*i,z=-253;
    box('metal',x,.89,z,.38,1.16,1.48,0x98b3bc);
    box('cyan',x,1.49,z+.31,.21,.06,.67);
    collider(x,.89,z,.38,1.16,1.48);
  }
  box('metal',49.6,1.41,-252.8,1.10,2.22,.54,0x87969b);
  sign?.(49.6,1.76,-252.45,1.01,1.02,'换乘','A  /  B','#9bd6e3');
  collider(49.6,1.41,-252.8,1.10,2.22,.54);
  // Road stencils lie well inside each lane. Side strips and pavement above
  // them already form one seamless union at forks.
  for(const route of coreRoutes)for(let i=1;i<route.points.length;i++){
    const [a,b]=route.points.slice(i-1,i+1),dx=b[0]-a[0],dz=b[1]-a[1];
    const len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);
    for(let travel=6;travel<len-4;travel+=8){
      const x=a[0]+dx*travel/len,z=a[1]+dz*travel/len;
      box(route===coreRoutes[0]?'white':'yellow',x,.196,z,.12,.032,2.15,0x929b9a,yaw);
    }
  }
}

export function buildFutureCoreStreets(scene,api){
  buildPavement(scene,api,coreOutline,coreRoutes,freightWell);
  freightCut(api,freightWell);
  routeFixtures(api);
  const lights=[];
  for(const [x,y,z,color,power,reach] of [
    [47.1,2.5,-194.6,0xffb270,43,8],[36,2.5,-209.6,0xf5bb80,34,7],
    [71.1,-1.3,-216,0xecbb7d,45,9],[49.8,2.36,-251.8,0x97cbd9,34,7]
  ]){
    const light=new T.PointLight(color,power,reach,2);
    light.position.set(x,y,z);light.userData.nightPower=power;
    scene.add(light);lights.push(light);
  }
  // Reuse the city crowd's walking animation and route validation. Place people
  // on different working levels so their movement reveals the section of the street.
  const crowdPaths=[
    {id:'core_gate_shift',a:[60,-184],b:[60,-194],level:.18,look:1,speed:.78},
    {id:'core_counter_customer',a:[47.7,-194.4],level:.30,look:2,heading:-1.5},
    {id:'core_interchange_arrival',a:[42,-222],b:[42,-234],level:.18,look:3,speed:.84},
    {id:'core_interchange_return',a:[38,-220],b:[38,-233],level:.18,look:1,speed:.65},
    {id:'core_freight_handler',a:[72,-221],b:[72,-233],level:-5.82,look:0,speed:.63},
    {id:'core_resident',a:[88,-286],b:[88,-296],level:.18,look:2,speed:.77},
    {id:'core_hq_commuter',a:[63,-350],b:[63,-362],level:.18,look:0,speed:.74}
  ];
  return {freightWell,routes:coreRoutes,lights,crowdPaths};
}
