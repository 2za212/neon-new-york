import * as T from 'three';

// Buildings beyond the walkable lots. Each silhouette represents a plant on
// the same electrical network. The broad openings stay readable across a river
// or above the roof on the opposite side of a street.
export const gridStations=[
  {type:'switch',x:-276,z:62,yaw:.5*Math.PI,c:0xe99a58,h:57},
  {type:'cooling',x:-108,z:-131,yaw:.5*Math.PI,c:0x89d3cc,h:64},
  {type:'relay',x:205,z:-274,yaw:-.48*Math.PI,c:0xcb81c9,h:108},
  {type:'cooling',x:216,z:-66,yaw:-.5*Math.PI,c:0x73acc9,h:78},
  {type:'relay',x:31,z:-427,yaw:.02,c:0x97cbe7,h:119},
  {type:'switch',x:38,z:215,yaw:Math.PI,c:0x91a8d5,h:82}
];
// Occupied buildings on the landward side of street termini. Different rear
// setbacks leave the canal and the open approach to the quay visible.
const outerPremises=[
  {type:'dispatch',x:-142,z:-81,yaw:0,c:0x83c4bd,h:19},
  {type:'dispatch',x:-116,z:108,yaw:Math.PI,c:0xe7b780,h:26},
  {type:'exchange',x:-127,z:86,yaw:Math.PI,c:0xd4976f,h:19},
  {type:'exchange',x:-92,z:-213,yaw:Math.PI*.5,c:0x98b8d2,h:37},
  {type:'exchange',x:10,z:192,yaw:Math.PI,c:0xbf829d,h:32},
  {type:'dispatch',x:169,z:48,yaw:-Math.PI*.5,c:0x8cbfbb,h:22},
  {type:'exchange',x:167,z:-132,yaw:-Math.PI*.5,c:0x8fb0d3,h:30}
];

export function buildRegionalGrid(scene){
  const cube=new T.BoxGeometry(1,1,1),pos=cube.getAttribute('position'),normal=cube.getAttribute('normal');
  const mat=new T.MeshBasicMaterial({vertexColors:true});
  mat.name='长夜 / 远岸供电设施';mat.userData.keepDistant=true;
  const base=new T.Color(),light=new T.Color(),dark=new T.Color();
  const groups=new T.Group();groups.name='区域供电网 / 河对岸与外环';scene.add(groups);
  for(const site of [...gridStations,...outerPremises]){
    const xyz=[],rgb=[],ix=[],height=site.h,iron=0x243041,casing=0x465268,concrete=0x3b4352;
    light.setHex(site.c);
    function B(x,y,z,w,h,d,hex=iron,panel=false){
      const n=xyz.length/3;
      base.setHex(hex);
      for(let i=0;i<pos.count;i++){
        const xx=x+pos.getX(i)*w,yy=y+pos.getY(i)*h,zz=z+pos.getZ(i)*d;
        xyz.push(xx,yy,zz);
        const nx=normal.getX(i),ny=normal.getY(i),nz=normal.getZ(i);
        const plane=ny>.5?.92:ny<-.5?.48:nz>.5?.94:nx<-.5?.72:.51;
        dark.copy(base).multiplyScalar(plane*(panel?1.24:.66+.49*yy/height));
        if(!panel){
          // Recesses facing a lit working deck catch its coloured spill.
          const toward=Math.max(0,-Math.sign(x)*nx-.35*ny+.23*nz);
          const bounce=.025*toward*Math.exp(-Math.abs(yy-height*.70)/16);
          dark.r+=light.r*bounce;dark.g+=light.g*bounce;dark.b+=light.b*bounce;
        }
        rgb.push(dark.r,dark.g,dark.b);
      }
      for(const index of cube.index.array)ix.push(n+index);
    }
    function room(x,y,z,w,d){
      B(x,y,z,w,3.84,d,casing);
      for(const front of [-1,1]){
        B(x,y+.16,z+front*(d*.5+.08),w-.64,2.56,.32,0x121c28);
        const bays=Math.floor(w/2.56),bayOffset=Math.round((y+site.h)/3.84)+(front<0?3:0);
        for(let j=0;j<bays;j++){
          const cx=x-w/2+1.54+j*2.56;
          const bay=(j+bayOffset)%8;
          if(bay<5){
            B(cx,y+.12,z+front*(d*.5+.29),1.92,1.60,.16,
              bay<2?0xa8aba5:site.c,true);
            B(cx,y-.66,z+front*(d*.5+.48),2.24,.32,.64,0x647078);
          }else if(bay===6){
            B(cx,y+.12,z+front*(d*.5+.36),1.92,.48,.64,0x667483);
          }
        }
      }
    }
    if(site.type==='dispatch'||site.type==='exchange'){
      const dispatch=site.type==='dispatch';
      // The openings extend to the rear wall. Cantilevered work floors
      // have thickness and the sheltered bays below are open to the street.
      B(0,-.20,0,35.84,.96,19.20,concrete);
      B(0,height*.42,-6.40,33.28,height*.84,4.48,iron);
      for(const [i,x] of [-15.36,-5.12,5.12,15.36].entries()){
        B(x,3.84,3.84,1.92,7.68,5.12,concrete);
        for(let j=0;j<3;j++)B(x,5.76+j*.64,5.76,2.56+j*.96,.64,2.56+j*.64,casing);
        if(i<3){
          B(x+4.48,2.56,-3.52,6.4,4.48,.64,dispatch?0x56606b:0x617180);
          B(x+4.48,4.48,-3.04,5.76,.64,.48,site.c,true);
        }
      }
      room(0,8.32,1.92,34.56,10.24);
      if(dispatch){
        for(let j=0;j<3;j++){
          const x=-9.6+j*8.32,z=(j%2)*1.92-1.92,h=height-9.60-j*1.28;
          B(x,9.60+h/2,z,6.4,h,8.32,concrete);
          for(let y=11.52;y<height-j*1.28;y+=2.56)B(x,y,z,7.68,.64,9.6,casing);
        }
        room(-2.56,height-1.28,-1.92,26.88,7.68);
      }else{
        for(let j=0;j<4;j++){
          const x=(j%2?-2.56:0)+j*.64,w=32-j*3.84,y=10.24+(height-11.52)*j/4;
          B(x,y+2.24,-j*1.28,w,4.48,12.8,concrete);
          room(x,y+2.88,-j*1.28,w+1.28,13.44);
        }
      }
    }else if(site.type==='cooling'){
      // Asymmetric cooling fingers share a manifold over an open service bay.
      for(const [j,x] of [-14.08,-2.56,8.96].entries()){
        const h=height-j*7.68,z=j*2.56;
        B(x,h/2,z,8.96,h,14.08,concrete);
        for(let y=12.8;y<h-3;y+=6.4){
          B(x,y,z,10.88,1.92,16.00,casing);
          B(x-3.52,y+1.28,z+7.36,1.28,.64,1.28,site.c,true);
        }
        B(x,h+2.56,z,6.4,5.12,8.96,casing);
      }
      room(-2.56,height*.68,3.84,35.84,10.24);
    }else if(site.type==='relay'){
      // The two cores enclose a tall open slot. The upper facade changes
      // sides above the transfer floors, with enough sky behind the slot.
      for(const [side,x] of [[-1,-10.24],[1,12.8]]){
        const h=height*(side<0?1:.78);
        B(x,h*.5,side*3.2,side<0?11.52:8.96,h,14.08,iron);
        for(let y=9.6;y<h-6;y+=9.6){
          B(x,y,side*3.2,side<0?14.08:11.52,1.28,16.64,casing);
          B(x+side*3.84,y+3.2,side*3.2+7.36,.96,4.48,.64,site.c,true);
        }
        for(let j=0;j<4;j++)B(x+side*j*.64,h+j*2.56,side*3.2,8.96-j*1.28,3.20,12.8-j*1.92,casing);
      }
      room(-1.28,height*.76,0,37.12,11.52);
      room(.64,height*.54,-1.92,29.44,8.96);
      for(let j=0;j<6;j++)B(9.6-j*1.28,height*.76-2.56-j*.96,0,6.40-j*.64,1.28,8.96,concrete);
    }else{
      // Four offset battery stacks and a deep switching gallery.
      for(let j=0;j<4;j++){
        const x=(j-1.5)*8.96,h=height*[.58,.83,1,.71][j],z=(j%2)*3.84;
        B(x,h*.5,z,7.68,h,12.8,concrete);
        for(let y=5.12;y<h-2;y+=5.12){
          B(x,y,z,8.96,1.28,14.72,casing);
          if(j===1||j===2)B(x,y+.96,z+6.72,4.48,.64,.64,site.c,true);
        }
      }
      room(0,height*.48,5.12,41.0,11.52);
    }
    if(gridStations.includes(site)){
      // A regional substation has two plugged-in busbars and an open
      // disconnect. The lit porcelain jaws follow the shape of each plant.
      // All four elevations share the same object and the same single draw.
      const crown=site.type==='cooling'?height+5.76:height+2.56;
      const mouth=site.type==='relay'?9:site.type==='cooling'?6:7,unit=1.28;
      for(const side of [-1,1]){
        const baseX=side*(mouth+1)*unit,depth=side===1?-2.56:1.28;
        B(baseX,crown-4.48,depth,5.12,14.08,7.68,casing);
        for(let level=0;level<6;level++){
          const x=baseX-side*(Math.max(0,level-1))*unit,y=crown+level*unit;
          const breadth=level<2?5.12:3.84;
          B(x,y,depth,breadth,unit,6.4,level%2?casing:concrete);
          for(const face of [-1,1]){
            B(x,y,depth+face*3.35,breadth-.64,.80,.48,site.c,true);
            if(level<4)B(x+side*(breadth*.5),y,depth,.64,.80,5.12,site.c,true);
          }
        }
        B(baseX-side*2.56,crown-5.76,depth,2.56,1.92,9.60,site.c,true);
      }
      if(site.type==='relay'){
        // Stacked field plates hang freely in the opening; the cables and
        // isolation gap remain distinct against the sky at street distance.
        B(0,crown-1.92,-1.28,1.28,16.64,1.28,casing);
        for(let row=0;row<5;row++){
          const width=(row===0||row===4?2:row===2?6:4)*unit;
          B(0,crown-6.40+row*2.56,-1.28,width,1.28,width,site.c,true);
        }
      }
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setAttribute('color',new T.Float32BufferAttribute(rgb,3));
    geo.setIndex(ix);geo.computeBoundingSphere();
    const mesh=new T.Mesh(geo,mat);mesh.position.set(site.x,0,site.z);mesh.rotation.y=site.yaw;
    mesh.userData.excludeFromAO=true;groups.add(mesh);
  }
  cube.dispose();
}
