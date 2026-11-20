import * as T from 'three';

// The cross street keeps its original delivery lanes. The food cooperative
// rents their air rights between the staff housing and the dye-market yard.
export function buildBoilerMarket(scene,{B,C,L,surface,label,marketLights}){
  const brick=0xa0715e, iron=0x54626a, jade=0x789b97, copper=0xd68b56;
  const zinc=0xacb2ad, tile=0xd2c7aa, coal=0x433c38, opal='upperStreetOpal';
  const level=5.48, northX=26.56, southX=36.0, half=1.76;
  function block(mat,x,y,z,w,h,d,colour){
    B(mat,x,y,z,w,h,d,colour,0,null,true);
  }
  function solid(mat,x,y,z,w,h,d,colour,id){
    block(mat,x,y,z,w,h,d,colour);
    return C(x,y,z,w,h,d,'boiler-market/'+id);
  }
  function light(x,y,z,colour,power,reach){
    const l=new T.PointLight(colour,power,reach,2);l.position.set(x,y,z);
    l.userData.nightPower=power;l.name='七街沸社 / 营业灯';scene.add(l);marketLights.push(l);
  }
  function slab(x0,x1,z0,z1,top,thick,id){
    solid('districtIron',(x0+x1)/2,top-thick/2,(z0+z1)/2,x1-x0,thick,z1-z0,iron,id);
    surface(x0,x1,z0,z1,top);
    // The wearing surface is laid in staggered courses. No collision seam
    // divides adjacent treads or the clear central strip of a landing.
    for(let zi=z0,row=0;zi<z1-.02;zi+=.96,row++){
      const depth=Math.min(.96,z1-zi),offset=row%2?.64:0;
      for(let xi=x0-offset;xi<x1-.02;xi+=1.28){
        const a=Math.max(xi,x0),b=Math.min(xi+1.28,x1);
        if(b-a>.04)block('paver',(a+b)/2,top+.009,zi+depth/2,b-a-.021,.018,depth-.022,
          (row+Math.round(xi/.64))%4===0?0xbeb69f:0xaab1a7);
      }
    }
  }
  function guard(x0,z0,x1,z1,y){
    const length=Math.hypot(x1-x0,z1-z0), n=Math.ceil(length/1.92);
    const w=Math.abs(x1-x0)+.13,d=Math.abs(z1-z0)+.13;
    const cx=(x0+x1)/2,cz=(z0+z1)/2;
    for(const height of [.32,.98])block('districtIron',cx,y+height,cz,w,.13,d,iron);
    for(let i=0;i<=n;i++)block('districtZinc',x0+(x1-x0)*i/n,y+.49,z0+(z1-z0)*i/n,.13,.98,.13,zinc);
    const rail=C(cx,y+.54,cz,w,1.08,d,'boiler-market/guard');rail.userData.cameraPadding=.07;
  }
  function trestle(x,z,top,width=.64){
    const base=.36;
    solid('stone',x,.68,z,width+.44,.64,width+.49,tile,'pier-foot');
    solid('districtIron',x,(base+top)/2,z,width,top-base,width,iron,'pier');
    for(let k=0;k<3;k++)block('districtZinc',x,top-.64+k*.23,z,width+.28+k*.32,.23,width+.23+k*.32,k%2?jade:zinc);
  }
  function flight(x,z0,direction){
    const base=.36,step=.16;
    let z=z0;
    for(let i=0;i<32;i++){
      // The north stair passes beneath the grocery's old conveyor. Its
      // longer landings keep the first flight below the insulated return.
      let length=.64;
      if(direction>0&&(i===7||i===14))length=1.92;
      if(direction<0&&i===15)length=1.28;
      const y=base+(i+1)*step,cz=z+direction*length/2,lower=Math.max(.17,y-.43);
      solid('stone',x,(lower+y)/2,cz,2*half,y-lower,length,tile,'tread');
      surface(x-half,x+half,cz-length/2,cz+length/2,y);
      for(const side of [-1,1]){
        const rx=x+side*(half-.08);
        block('districtIron',rx,y+.32,cz,.14,.13,length+.015,iron);
        block('districtZinc',rx,y+1.0,cz,.14,.16,length+.015,i%5===0?copper:zinc);
        if(i%2===0||length>1)block('districtIron',rx,y+.47,cz,.14,.95,.15,iron);
        const rail=C(rx,y+.47,cz,.16,1.08,length,'boiler-market/stair-rail');
        rail.userData.cameraPadding=.065;
      }
      if(i%8===7)for(const s of [-1,1])trestle(x+s*1.16,cz,y-.26,.44);
      if(i%4===2){
        block(opal,x,y-.10,cz-direction*(length/2+.015),.96,.14,.06,0xd7ab79);
        block('districtIron',x,y-.22,cz-direction*(length/2+.04),1.28,.10,.08,iron);
      }
      z+=direction*length;
    }
    return z;
  }
  slab(northX-half,northX+half,51.84,57.60,.36,.18,'north-apron');
  const nTop=flight(northX,57.60,1),sTop=flight(southX,111.84,-1);
  slab(southX-half,southX+half,111.84,114.24,.36,.18,'yard-apron');
  slab(northX-half,northX+half,nTop,87.20,level,.48,'street-span');
  slab(northX-half,southX+half,87.20,sTop,level,.48,'turn-deck');
  slab(11.20,northX-half,86.24,92.62,level,.48,'kitchen-apron');
  // The apron joins the principal gallery at its west edge. The service
  // rooms have a separate forecourt and shutter on the street below.
  guard(northX-half,nTop,northX-half,86.24,level);
  guard(northX+half,nTop,northX+half,87.20,level);
  guard(northX+half,87.20,southX+half,87.20,level);
  guard(northX-half,sTop,southX-half,sTop,level);
  guard(southX+half,87.20,southX+half,sTop,level);
  guard(11.20,86.24,northX-half,86.24,level);
  guard(11.20,86.24,11.20,92.62,level);
  guard(11.20,92.62,northX-half,92.62,level);
  guard(northX-half,sTop,northX-half,92.62,level);
  for(const x of [24.96,28.16])for(const z of [78.72,90.04])trestle(x,z,5.03);
  for(const [x,z] of [[12.0,91.52],[20.48,91.52],[33.60,90.10],[37.0,90.30]])trestle(x,z,5.04);
  for(const x of [northX-1.45,northX+1.45])
    block('districtIron',x,4.80,83.08,.31,.42,12.86,iron);
  for(let z=78.9;z<89;z+=1.92){
    block('districtZinc',northX,4.78,z,3.52,.25,.32,zinc);
    block(opal,northX-.64,4.61,z,1.28,.09,.24,0x98ccc0);
  }
  label(northX,5.13,77.03,3.2,.53,'沸市栈街','二层夜宵 / 北梯口','#efab75',Math.PI);
  label(northX,5.14,84.64,5.36,.77,'七街沸社','晚班火锅 · 两岸送餐','#ff985c',-Math.PI/2);

  // Terraced staff tenement opposite the main kitchen. Its lower storey
  // straddles a traversable service aisle; the cold store runs on the east.
  for(const [x,z] of [[30.72,54.88],[40.96,54.88],[30.72,60.48],[40.96,60.48]])trestle(x,z,4.48);
  solid('basaltShell',39.65,2.31,57.60,3.85,3.88,7.68,brick,'cold-room');
  for(const z of [55.40,57.64,59.88]){
    block('districtIron',37.68,1.96,z,.18,2.56,1.98,iron);
    block('districtZinc',37.55,2.05,z,.16,2.12,1.66,jade);
    block(opal,37.45,2.68,z,.10,.20,.83,0x95cbb8);
  }
  const sections=[
    [4.48,13.44,35.84,57.60,13.12,9.60],[13.44,23.68,36.48,57.28,11.84,8.96],
    [23.68,31.36,37.44,56.96,9.92,8.32],[31.36,35.20,39.04,56.64,6.72,6.40]
  ];
  for(const [index,[low,high,x,z,w,d]] of sections.entries()){
    solid(index%2?'titaniumSkin':'ceramicShell',x,(low+high)/2,z,w,high-low,d,index%2?0xc4d4c9:0xdad4ab,'staff-housing');
    block('districtIron',x,low+.18,z,w+.48,.36,d+.45,iron);
    const bays=Math.floor((w-1.2)/2.56);
    for(let y=low+2.16,fl=0;y<high-.64;y+=2.56,fl++){
      const ledge=fl%2===0?.96:.64;
      for(const dir of [-1,1]){
        const front=z+dir*d/2;
        block('stone',x,y-.96,front+dir*.18,w-.28,.32,.64,zinc);
        for(let bay=0;bay<bays;bay++){
          const cx=x+(bay-(bays-1)/2)*2.56;
          block('districtIron',cx,y,front+dir*.055,1.92,1.60,.22,iron);
          block((bay+fl+index+dir+4)%3?'warmWindow':'glass',cx,y+.08,front+dir*.20,1.43,1.06,.12);
          block('districtZinc',cx,y-.57,front+dir*ledge*.45,1.8,.30,ledge,jade);
          if((bay+fl)%3===0)block('districtCanvas',cx+.44,y+.79,front+dir*.35,1.66,.2,.85,0xa98b6a);
        }
      }
      const west=x-w/2;
      block('districtIron',west-.05,y,z,.16,1.54,d-.96,iron);
      for(let zz=z-d/2+1.12;zz<z+d/2-.72;zz+=2.24){
        block((fl+index)%3?'glass':'warmWindow',west-.18,y+.12,zz,.16,.95,1.50);
        block('districtZinc',west-.46,y-.85,zz,.99,.32,1.65,zinc);
      }
    }
    block('stone',x,high+.10,z,w+.42,.20,d+.45,tile);
  }
  light(34.32,3.74,57.52,0x9ad2c1,45,10.4);
  label(34.45,4.32,62.51,6.38,.72,'沸社职工楼','冷库收货口 / 夜间轻声','#eac897');
  // The ground route doglegs around the old grocer's refrigerated plant.
  // Bollards stop pallet trucks at the corner; the stair's clear through
  // route is on the other side of the refrigeration block.
  slab(32.32,36.80,52.1,61.92,.36,.18,'receiving-yard');
  slab(32.32,43.36,61.92,63.04,.36,.18,'loading-threshold');
  slab(39.68,43.36,63.04,78.24,.36,.18,'delivery-lane');
  slab(29.28,39.68,72.12,78.24,.36,.18,'receiving-quay');
  for(const x of [30.40,37.44]){
    trestle(x,73.12,3.70,.32);
    solid('districtZinc',x,1.12,73.68,.72,1.04,1.28,jade,'crane-leg');
    for(let j=0;j<3;j++)block('districtIron',x,2.40+j*.43,73.68,.96+j*.32,.39,1.60,iron);
  }
  solid('districtZinc',34.0,3.68,73.60,8.32,.49,1.92,jade,'cold-hoist');
  for(let j=0;j<5;j++){
    const x=30.70+j*1.60;
    block('districtIron',x,3.92,73.60,.43,.60,2.16,iron);
    if(j%2===0)block(opal,x,3.63,74.62,.34,.23,.16,0xedb16c);
  }
  for(const x of [32.32,34.24]){
    solid('districtZinc',x,.81,73.20,1.60,.90,1.21,jade,'fresh-crate');
    block('districtPaper',x,1.32,73.20,1.68,.16,1.28,0xc1ae83);
    block('districtIron',x+.49,1.0,73.84,.21,.72,.10,iron);
  }
  label(34.26,3.56,74.60,4.60,.56,'鲜切到货','屠场夜班 / 入库称重','#f4bc83');
  light(34.1,3.0,74.82,0xffbe84,49,8.6);
  // Street-level collection window under the overhanging pots. The dock
  // faces the cross street, with a free pedestrian link to the northern stair.
  for(const x of [13.6,17.44,21.28]){
    block('districtOak',x,1.10,92.37,3.04,1.24,.56,0xbf976f);
    block('districtZinc',x,1.78,92.0,3.30,.16,1.05,zinc);
    C(x,1.03,92.24,3.3,1.42,.92,'boiler-market/takeaway');
    block('districtIron',x,3.56,91.90,3.45,.32,1.20,iron);
    block(opal,x,3.35,91.51,2.49,.12,.50,0xffad6c);
  }
  label(16.0,3.88,91.39,6.25,.65,'桥下取餐','外卖取号  ·  晚班加汤','#ffc882',Math.PI);
  light(17.8,2.95,90.8,0xffa56d,100,14);
  // This is the avenue shop inside the same building as the dispatch
  // window. The former studio threshold is open to the ground-floor queue.
  for(const [n,z] of [94.70,95.91,97.14].entries()){
    const x=9.17;
    block('districtIron',x,1.65,z,.77,.16,.83,iron);
    block('districtZinc',x,1.85,z,.62,.29,.67,copper);
    block('districtZinc',x,2.05,z,.81,.14,.84,copper);
    block(opal,x,2.13,z,.59,.065,.64,n===1?0xca633a:0xe3be81);
    block('districtOak',x+.20,2.35,z+.13,.065,.45,.085,0xc1a47c);
    block(opal,x-.41,1.69,z,.065,.1,.36,0x92c6bb);
  }
  block('districtZinc',9.34,3.17,96.00,1.38,.31,4.33,zinc);
  block(opal,8.69,2.99,96.00,.17,.11,3.80,0xf6bb86);
  light(8.96,2.67,95.95,0xffa15d,35,6.9);

  // Dining annex and its live sign share the same projecting iron brackets.
  // All ring sections use the same .48 m grid. Clear air separates the
  // handles, stock reservoirs and individually stepped chopsticks.
  const px=16.0,pz=86.40,g=.48;
  // The sign is bolted on an inclined frame, with the low rim towards the
  // ground entrance. The broth and half-pot divider can be read from below.
  const tilt=(dx,dz)=>Math.round((dx*.63+dz*.30)/.24)*.24;
  for(const x of [13.12,18.88]){
    block('districtIron',x,5.14,87.74,.64,.64,9.88,iron);
    L('districtZinc',[x,3.65,92.38],[x,5.05,87.12],.38,.44,zinc);
    solid('districtIron',x,5.92,pz+1.12,1.60,.96,2.88,coal,'pot-foot');
  }
  function panBand(radius,inner,y,h,mat,col){
    for(let row=-radius;row<=radius;row++){
      const ext=Math.floor(Math.sqrt((radius+.22)**2-row*row));
      const localZ=pz+row*g;
      const hollow=inner>0&&Math.abs(row)<inner;
      const extent=hollow?Math.floor(Math.sqrt(inner*inner-row*row)):-1;
      const draw=(l,r)=>{
        if(r<l)return;
        for(let first=l;first<=r;){
          const height=tilt(first*g,row*g);
          let last=first;
          while(last<r&&tilt((last+1)*g,row*g)===height)last++;
          const width=(last-first+1)*g,cx=px+(first+last)*g/2;
          block(mat,cx,y+height,localZ,width,h,g,col);
          first=last+1;
        }
        // The inclined advert lies outside the public dining floor. Give
        // each short strip its full stepped envelope for flying and jumping.
        const lo=tilt(l*g,row*g),hi=tilt(r*g,row*g);
        C(px+(l+r)*g/2,y+(lo+hi)/2,localZ,(r-l+1)*g,h+hi-lo,g,'boiler-market/pot');
      };
      if(hollow){draw(-ext,-extent-1);draw(extent+1,ext);}else draw(-ext,ext);
    }
  }
  panBand(5,0,6.12,.74,'districtIron',coal);
  panBand(6,4,6.82,.68,'districtZinc',copper);
  panBand(7,5,7.46,.64,'brickBrown',0xd17b48);
  panBand(8,6,8.10,.64,'districtZinc',copper);
  panBand(9,7,8.68,.53,'districtZinc',0xe4ac6e);
  panBand(10,8,9.07,.40,opal,0xdf9d58);
  panBand(10,9,9.31,.22,'districtZinc',0xefbf7d);
  panBand(8,0,8.89,.14,opal,0xa84224);
  for(const side of [-1,1]){
    for(const dx of [-1.20,1.20])block('districtZinc',px+dx,8.68+tilt(dx,side*5.18),pz+side*5.18,.48,.55,1.92,copper);
    for(let j=-2;j<=2;j++)block('districtZinc',px+j*.48,8.94+tilt(j*.48,side*6.02),pz+side*6.02,.48,.70,.48,copper);
    for(let i=0;i<21;i++){
      const dx=-.48+i*.16+side*(.36+i*.021),dz=-.76+i*.31+side*(.43+i*.031);
      block(i<5?'districtOak':i<18?opal:'districtZinc',px+dx,8.94+i*.35,pz+dz,.53,.57,.56,
        i<5?0xd09e60:i<18?0xffba5f:0xe5a75d);
    }
  }
  for(let i=-6;i<=6;i++){
    const dx=i*g,dz=Math.round(Math.sin(i*.52)*2)*g;
    block('districtZinc',px+dx,9.20+tilt(dx,dz),pz+dz,.62,.31,.62,0xf8c783);
    block(opal,px+dx,9.02+tilt(dx,dz+g),pz+dz+g,.53,.23,.57,0xe38037);
  }
  for(const [dx,dz,mat,col,h] of [[-2.0,-1.0,'districtPaper',0xecc28f,.45],[.4,1.7,'leaf',0x90a540,.41],[1.7,-.6,'brick',0xc55f35,.44],[-1.2,1.6,'leaf',0x88a64c,.6],[.45,-2,'districtPaper',0xf0c398,.46]]){
    block(mat,px+dx,9.11+tilt(dx,dz)+h/2,pz+dz,1.14,h,.78,col);
  }
  // An upright slice of lotus root has seven open holes. The folded beef
  // and scallions project above the low rim and identify the food at grade.
  const rootHoles=[[0,0],[-2.7,-1.8],[0,-3.6],[2.7,-1.8],[2.7,1.8],[0,3.6],[-2.7,1.8]];
  for(let yy=-5;yy<=5;yy++)for(let zz=-5;zz<=5;zz++){
    const radius=yy*yy+zz*zz;
    if(radius>27||rootHoles.some(([a,b])=>(a-yy)**2+(b-zz)**2<1.37))continue;
    const x=px-1.46+yy*.064,y=9.62+yy*.232,z=pz-1.25+zz*.232;
    block('districtPaper',x,y,z,.28,.239,.239,0xe1ae70);
    block(opal,x-.14,y,z,.07,.230,.230,radius>19?0xb98359:0xddb884);
  }
  for(let j=0;j<6;j++){
    const dx=.20+j*.31,up=[0,.24,.52,.72,.42,.14][j];
    block('brick',px+dx,9.57+tilt(dx,.4)+up,pz+.64,.38,.56,1.78,0xeb8971);
    block('districtPaper',px+dx,9.88+tilt(dx,.4)+up,pz+.19,.38,.14,.51,0xf1c9a0);
  }
  for(let n=0;n<3;n++)for(let k=0;k<4;k++){
    block('leaf',px+1.64+n*.42,10.32+k*.28,pz-1.47+n*.26+k*.16,.34,.35,.64,0xb5cc62);
  }
  label(16.24,6.54,81.26,4.97,.84,'鲜切铺','二楼取号  ·  值夜不歇','#ffb567',Math.PI);
  // A cast brass marquee on the street-facing bracket. The four glyphs
  // are emissive ceramic blocks sunk into a stepped enamel housing.
  const canvas=document.createElement('canvas');canvas.width=92;canvas.height=25;
  const ink=canvas.getContext('2d');ink.fillStyle='#fff';ink.textBaseline='top';
  ink.font='bold 22px "Microsoft YaHei", "Noto Sans SC", sans-serif';
  for(const [i,ch] of Array.from('七街火锅').entries())ink.fillText(ch,i*23,0,23);
  const letters=ink.getImageData(0,0,92,25).data,s=.073,signX=11.24,signY=5.65,signZ=89.90;
  for(let j=-2;j<=2;j++){
    const w=6.08+(2-Math.abs(j))*.56;
    block('districtZinc',signX,signY+j*.40,signZ,.64,.42,w,copper);
    block('brickBrown',signX-.32,signY+j*.40,signZ,.26,.34,w-.18,0x973f32);
    for(const side of [-1,1]){
      block(opal,signX-.48,signY+j*.40,signZ+side*(w/2-.11),.13,.35,.13,0xe37342);
      if(Math.abs(j)>0)block(opal,signX-.48,signY+(j-Math.sign(j)*.46)*.40,
        signZ+side*(w/2+.08),.13,.10,.32,0xd85b38);
    }
    if(Math.abs(j)===2)block(opal,signX-.48,signY+j*.40+Math.sign(j)*.16,signZ,
      .14,.10,w-.18,0xf19150);
  }
  for(const z of [87.90,91.60]){
    block('districtIron',12.0,5.36,z,1.68,.38,.48,iron);
    L('districtZinc',[11.62,5.47,z],[13.12,6.44,z],.32,.36,copper);
  }
  for(let row=0;row<25;row++)for(let col=0;col<92;){
    if(letters[4*(row*92+col)+3]<100){col++;continue;}
    const from=col;
    while(col<92&&letters[4*(row*92+col)+3]>=100)col++;
    block(opal,signX-.52,signY+(12-row)*s,signZ+((from+col-1)/2-45.5)*s,
      .16,s*1.02,(col-from)*s,0xffb868);
  }
  light(15.36,10.92,84.48,0xff9a67,125,21);
  light(10.76,5.12,89.20,0xff9351,92,15.7);
  light(22.21,7.30,88.48,0xffa05f,74,13);
  // Ceramic stove cabinets and two booths give the balcony a real use. The
  // main gallery and its escape routes stay open to neighbours on foot.
  for(const z of [88.32,91.52]){
    solid('districtOak',22.40,5.97,z,1.18,.72,1.02,0xab886c,'dining-table');
    block('districtZinc',22.40,6.38,z,1.52,.14,1.19,copper);
    for(const s of [-1,1])solid('districtCanvas',22.4,5.88,z+s*.94,1.34,.47,.40,0xb19871,'booth');
  }
  return {
    routes:{
      boilerWalk:[[northX,.36,52.4],[northX,level,nTop],[northX,level,88.64],[southX,level,88.64],[southX,level,sTop],[southX,.36,113.04],[31,.36,113.04],[31,.36,120.35],[31,.18,128]],
      housingYard:[[33.92,.36,52.34],[33.92,.36,57.5],[33.92,.36,62.40],[41.60,.36,62.40],
        [41.60,.36,76.8],[35.2,.36,76.8],[35.2,.18,84]]
    },
    crowdPaths:[
      {id:'boiler_market_waiter',a:[24.3,88.1],b:[25.2,89.4],level,look:2,speed:.53},
      {id:'boiler_market_diner',a:[28.8,88.8],b:[32.9,88.8],level,look:1,speed:.58},
      {id:'boiler_market_receiver',a:[33.2,55.8],b:[34.4,59.8],level:.36,look:0,speed:.55}
    ],
    vents:[[15.22,85.90,'#f1c5a7',9.17],[17.32,86.69,'#dcc0a8',9.33]],
    landmark:{id:'soho_boiler_walk',title:'七街沸市 · 二层栈街',position:new T.Vector3(26.56,level,88.6)}
  };
}
