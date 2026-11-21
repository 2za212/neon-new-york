import * as T from 'three';
import {buildEastLoopMarket} from './nyc-soho-market-arcade.js';

// Above the residential streets the same utility leases roofs and window bays.
// Its insulated castings follow a .32 m course, with two independent circuits
// in each exposed joint. The stalls and habitable rooms remain below that line.
function frontage({box,collider,light},x,z,turn){
  const c=Math.round(Math.cos(turn)),s=Math.round(Math.sin(turn));
  function point(u,y,v){return [x+u*c+v*s,y,z-u*s+v*c];}
  function B(mat,u,y,v,w,h,d,color){
    box(mat,...point(u,y,v),w,h,d,color,turn,null,true);
  }
  function C(u,y,v,w,h,d){
    collider(...point(u,y,v),Math.abs(c)*w+Math.abs(s)*d,h,Math.abs(s)*w+Math.abs(c)*d);
  }
  function glow(u,y,v,color,intensity,reach){light(...point(u,y,v),color,intensity,reach);}
  return {B,C,glow};
}

const graphite=0x596c78,iron=0x81979e,ceramic=0xbac7bc,copper=0xbf9775;
const ice=0x94e2dc,cream=0xf4ce9e,chartreuse=0xcdcd93;
const face='upperStreetOpal';
export function upperStreetKit(scene,materials,box,collider,lights){
  function light(x,y,z,hue,power,reach){
    const p=new T.PointLight(hue,power,reach,2);
    p.name='上层配电 / 灯仓';p.position.set(x,y,z);p.userData.nightPower=power;
    scene.add(p);lights.push(p);
  }
  return {box,collider,light,materials};
}
function castMaterial(materials){
  if(materials[face])return;
  const m=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  m.name='市电 / 磨砂陶瓷灯芯';m.userData.keepDistant=true;materials[face]=m;
  m.userData.signalLens=true;
}

// A deep, hollow transformer bay. Armoured jaws are angled by stepping actual
// cubes; looking along the pavement exposes the illuminated insulator ends.
function substation({B,C,glow},width,base,hand,lit){
  const cells=Math.max(3,Math.floor(width/1.92)),w=cells*1.92;
  const core=w*.5-1.12;
  B('metal',0,base+1.68,.62,w,3.36,1.56,graphite);
  C(0,base+1.68,.62,w,3.36,1.56);
  for(let i=0;i<3;i++){
    const out=1.44+i*.64;
    B('metal',0,base+i*.32+.16,out*.5,w+.64,.32,out,iron);
    B('trim',0,base+3.52-i*.32,out*.5,w+.64,.32,out,i===1?ceramic:iron);
  }
  C(0,base+.64,1.22,w+.64,1.28,2.76);
  C(0,base+3.20,1.22,w+.64,.96,2.76);
  for(const side of [-1,1]){
    for(let i=0;i<3;i++){
      const xx=side*(w/2-.32-i*.32),out=3.52-i*.64;
      B('metal',xx,base+1.92,out*.5,.64,3.20,out,i===1?copper:graphite);
      if(i===0)B('trim',xx,base+1.44,out+.08,.64,.32,.16,ceramic);
    }
    C(side*(w/2-.32),base+1.92,1.76,.64,3.2,3.52);
  }
  for(let col=0;col<cells-1;col++){
    const u=(col-(cells-2)/2)*1.92;
    for(let course=0;course<3;course++){
      const band=course===1;B(band?face:'trim',u,base+1.28+.48*course,1.60,
        band?1.24:1.52,.32,band?.48:.64,band?(lit?ice:chartreuse):ceramic);
    }
  }
  B('metal',core*hand,base+4.16,1.05,1.60,1.28,2.60,iron);
  B(face,core*hand,base+4.13,2.395,.92,.27,.12,lit?ice:cream);
  if(lit)glow(0,base+1.79,2.05,0x9cded2,78,12);
}

// A loom floor cantilevered above a market tenancy. Each window sits over a
// real cast-iron lintel, inside the red brick cheeks of the occupied bay.
function loomFloor({B,C,glow},width,y,hand,open,lit){
  const n=Math.max(2,Math.floor(width/2.24)),w=n*2.24;
  const depth=open?2.88:1.92,front=depth-.16;
  B('metal',0,y+.16,depth*.45,w+.32,.32,depth+.32,graphite);
  B('titaniumSkin',0,y+.64,depth*.55,w,.64,depth,0xbfcbbf);
  C(0,y+.48,depth*.5,w,.96,depth);
  for(let j=0;j<3;j++){
    const v=depth*(j+1)/3;
    B('trim',0,y+3.52-j*.24,v/2,w+.32*j,.32,v,copper);
  }
  C(0,y+3.24,depth*.52,w+.64,.70,depth+.32);
  for(const s of [-1,1]){
    const end=s*(w/2-.32);
    for(let j=0;j<3;j++){
      B(j===1?'ceramicShell':'titaniumSkin',end,y+1.28+j*.64,depth*.48,.64,.64,depth+j*.16,j===1?copper:0xbfcbc4);
    }
    C(end,y+1.92,depth*.48,.64,2.56,depth+.32);
  }
  for(let col=0;col<n;col++){
    const u=(col-(n-1)/2)*2.24;
    const bayFace=col===0&&open?.65:depth*.62;
    B(col===n-1&&open?'glass':'warmWindow',u,y+1.97,bayFace,1.70,1.69,.18,0xf4d0a8);
    B('metal',u-.69,y+1.98,front,.16,1.92,.30,iron);
    B('trim',u,y+1.12,front,1.76,.24,.48,copper);
    if(col%2===0){
      B('metal',u,y+2.77,front,1.92,.32,.64,graphite);
      B(face,u,y+2.62,front+.10,1.20,.12,.32,cream);
    }
  }
  const end=hand*(w*.5-.64);
  for(let j=0;j<3;j++)B('metal',end,y-.16-j*.32,(depth-.64*j)/2,.72,.32,depth-.64*j,iron);
  if(lit)glow(end*.30,y+2.50,front+.3,0xffc188,48,9.5);
}

// Two switchhouses across a street borrow separate roof elevations. The
// occupied deck stops short of its upper return, making a slit of dark sky.
function transfer(f,half,y,depth,hand){
  const {B,C,glow}=f;
  B('metal',0,y+.48,0,2*half,.96,depth,graphite);
  C(0,y+.48,0,2*half,.96,depth);
  for(const side of [-1,1]){
    for(let i=0;i<4;i++){
      const w=3.84-i*.64,u=side*(half-w/2);
      B(i%2?'trim':'metal',u,y-i*.48-.24,0,w,.48,depth+.32*i,i%2?iron:graphite);
      C(u,y-i*.48-.24,0,w,.48,depth+.32*i);
    }
  }
  const cabinW=half*1.12,cabinX=hand*(half-cabinW*.5);
  B('metal',cabinX,y+2.48,0,cabinW,3.04,depth-.96,graphite);
  C(cabinX,y+2.48,0,cabinW,3.04,depth-.96);
  const bays=Math.floor(cabinW/1.92);
  for(const side of [-1,1]){
    for(let col=0;col<bays;col++){
      const u=cabinX+(col-(bays-1)/2)*1.92;
      B('coolWindow',u,y+2.44,side*(depth*.5-.30),1.54,1.54,.32,0xb6e1df);
      B('trim',u,y+1.51,side*(depth*.5-.25),1.83,.30,.43,ceramic);
    }
    for(let col=0;col<4;col++){
      const u=-hand*(half-.96-col*1.92);
      B('metal',u,y+1.58,side*(depth*.5-.37),.64,1.24,.64,iron);
      B(face,u,y+1.93,side*(depth*.5-.02),.38,.22,.12,ice);
    }
    B('trim',cabinX,y+4.16,side*(depth*.44),cabinW+.64,.32,.72,ceramic);
    B('metal',-hand*half*.52,y+2.46,side*(depth*.44),half*.96,.51,.76,iron);
  }
  for(const u of [-half*.58,half*.37])for(let j=0;j<3;j++)
    B(j===1?face:'trim',u+j*.48,y-.19,0,.32,.37,depth-.60,j===1?ice:iron);
  for(let i=0;i<5;i++){
    const u=(i-2)*2.24;
    B('trim',u,y-.28,-hand*.58,.80,.53,depth-.72,ceramic);
    B('metal',u+hand*.48,y-.48,-hand*.93,.32,.48,depth-1.60,iron);
    B('metal',u+hand*.80,y-.30,-hand*.88,.32,.32,depth-1.92,graphite);
  }
  glow(-hand*.55*half,y-.27,0,0x98cbc9,104,15.5);
}

// Backlit louvres high above the shops. The twin vertical risers have
// different crowns and a genuinely open channel, also visible in silhouette.
function condenser(f,width,base,height,hand){
  const {B,C,glow}=f;
  const h=height,step=.64;
  B('metal',0,base+1.28,-2.24,width+2.56,2.56,6.4,graphite);
  C(0,base+1.28,-2.24,width+2.56,2.56,6.4);
  for(const side of [-1,1]){
    const x=side*(width*.29),tall=h*(side===hand?1:.76),w=width*.33;
    B('metal',x,base+tall/2,-2.24,w,tall,4.48,graphite);
    C(x,base+tall/2,-2.24,w,tall,4.48);
    const count=Math.floor((tall-2.8)/1.6);
    for(let j=0;j<count;j++){
      const y=base+3.04+j*1.6;
      for(const s of [-1,1]){
        B('trim',x,y,-2.24+s*2.32,w+.55,.48,1.28,ceramic);
        B(face,x+side*.22,y-.32,-2.24+s*2.34,w*.67,.24,.40,j%4===1?cream:ice);
      }
    }
    for(let j=0;j<3;j++){
      B('metal',x+side*j*.32,base+tall+j*step,-2.24,w-j*.48,step,4.32-j*.64,iron);
    }
  }
  B('metal',0,base+2.4,-2.24,width,1.6,6.83,iron);
  B('trim',0,base+height*.55,-2.24,width*.62,.96,2.88,ceramic);
  glow(0,base+height*.42,.3,0xa7d4d8,110,17);
}

const east=Math.PI/2,west=-east,south=0,north=Math.PI;

// A city-scale heat exchanger in section. Alternating iron courses and inset
// opal fins form a stepped aperture with a readable hot/cold end. Both faces
// and the underside work from the street, including the reverse approach.
function heatExchange({B,C,glow},half,y,hand){
  const cx=hand*half*.32;
  B('metal',0,y+.48,0,half*2,.96,5.12,graphite);
  C(0,y+.48,0,half*2,.96,5.12);
  for(const side of [-1,1]){
    for(let j=0;j<3;j++){
      const wide=2.56-j*.64;
      B('trim',side*(half-wide*.5),y-.32-j*.48,0,wide,.48,5.76+j*.32,iron);
    }
    for(let j=0;j<4;j++){
      const length=half*1.02-j*1.28;
      B('metal',-hand*(half-length/2),y+1.28+j*.64,side*1.92,length,.64,1.6,iron);
    }
  }
  const widths=[3.20,5.76,7.04,7.68,7.68,7.04,5.76,3.20];
  widths.forEach((width,i)=>{
    const h=y+1.28+i*.64;
    B('metal',cx,h,0,width,.64,5.76,i%2?graphite:iron);
    for(const side of [-1,1]){
      B('trim',cx,h,side*2.99,width,.60,.36,ceramic);
      const inner=width-(i===0||i===7?3.20:1.60);
      if(inner>.1){
        B('metal',cx,h,side*3.21,inner,.58,.42,graphite);
        B(face,cx,h-.04,side*3.45,inner-.32,.26,.12,i===1||i===6?cream:ice);
      }
    }
  });
  C(cx,y+3.36,0,7.68,5.44,5.76);
  // The feed cable reaches the exchanger from the side wall. A hanging
  // section is separated from its neighbour by expansion bellows.
  for(const side of [-1,1]){
    const u=side*(half*.5);
    B('metal',u,y-.48,0,half-.32,.80,1.60,iron);
    B('trim',u+side*1.92,y-.48,0,.64,1.1,1.92,copper);
    B(face,u,y-.89,0,half*.42,.12,.72,side===hand?ice:cream);
    glow(cx,y+3.0,side*3.56,side===hand?0xaee9dc:0x8cbfc9,172,17);
  }
  // Wide ceramic underside baffles are stepped back from either edge. They
  // break up the soffit when the ordinary shoulder camera passes underneath.
  for(let col=0;col<6;col++){
    const u=(col-2.5)*2.24,stagger=col%2===0?-.32:.32;
    for(const side of [-1,1]){
      B('trim',u,y-.28,side*1.68+stagger,.88,.54,1.92,ceramic);
      B('metal',u+.56,y-.54,side*1.68+stagger,.48,.54,1.28,iron);
      if(col%3===1)B(face,u+.56,y-.828,side*1.68+stagger,.36,.07,.74,side>0?cream:ice);
    }
  }
  glow(0,y-.60,-1.65,0xa2cac8,112,13);
}

// Outside-facing street fronts have a raised accessible service wall. Punched
// masonry returns make these working doors readable obliquely. The deepest
// part hangs over the pavement and the footprint stays flush with the wall.
function intake({B,C,glow},width,hand){
  const n=Math.max(2,Math.floor(width/2.24)),w=n*2.24;
  for(const side of [-1,1]){
    B('stone',side*(w/2-.24),2.34,.24,.48,3.88,.48,0xadc0b5);
    C(side*(w/2-.24),2.34,.24,.48,3.88,.48);
  }
  for(let i=0;i<n;i++){
    const u=(i-(n-1)/2)*2.24;
    B('metal',u,2.30,.14,2.12,3.54,.22,graphite);
    B('metal',u,1.15,.34,2.00,1.22,.22,iron);
    for(let j=0;j<4;j++){
      const y=2.04+j*.43;
      B('trim',u,y,.42,1.88,.22,.31,j===0?copper:iron);
      B(face,u,y+.16,.325,1.58,.13,.14,hand>0?chartreuse:ice);
    }
    if(i%2===0){
      for(let j=0;j<3;j++)B('metal',u,3.91+j*.21,.48+j*.32,2.48,.24,.96+j*.32,iron);
    }
  }
  C(0,2.12,.21,w,3.55,.44);
  glow(0,2.8,.85,hand>0?0xd7c78d:0x98dfd6,112,11);
}

// A service belt closes the real outer street axes. Working bays sit behind
// a covered platform. Above them are either staggered drying floors or a
// stepped switch tower. Streets glimpsed underneath remain completely dark.
function perimeterWorks(f,w,levels,hand,thermal){
  const {B,C,glow}=f,depth=10.24,n=Math.max(3,Math.floor(w/5.12));
  B('stone',0,.64,-depth*.46,w+1.28,1.28,depth+2.56,0xa2aba1);
  B('metal',0,3.84,-depth+.48,w,6.4,1.28,graphite);
  C(0,3.84,-depth+.48,w,6.4,1.28);
  for(const side of [-1,1]){
    B('titaniumSkin',side*(w/2-.48),4.16,-depth*.5,.96,6.4,depth,0xa9908a);
    C(side*(w/2-.48),4.16,-depth*.5,.96,6.4,depth);
  }
  for(let i=0;i<n;i++){
    const u=-w/2+(i+.5)*w/n;
    B('metal',u,1.92,-.64,w/n-.52,1.28,.90,iron);
    B(thermal?'coolWindow':'warmWindow',u,4.48,-5.76,w/n-.64,3.84,.32,0xe1dbcc);
    B('metal',u-w/n*.42,4.96,-1.60,.48,4.48,1.92,graphite);
    B('trim',u,6.72,-1.28,w/n+.32,.64,4.48,iron);
    if(i%2===0)B(face,u,6.36,-.22,w/n*.67,.24,.64,thermal?ice:cream);
  }
  B('metal',0,7.36,-depth*.45,w+1.28,.96,depth+1.92,graphite);
  C(0,7.36,-depth*.45,w+1.28,.96,depth+1.92);
  if(thermal){
    condenser(f,w*.63,7.8,levels*4.48,hand);
  }else for(let i=0;i<levels;i++){
    const width=w-i*2.56,u=hand*i*.96,h=8.96+i*3.2;
    B('titaniumSkin',u,h,-5.76,width,3.20,8.32,0xb9bdc0);
    C(u,h,-5.76,width,3.20,8.32);
    const bays=Math.floor(width/3.2);
    for(let j=0;j<bays;j++){
      const bx=u+(j-(bays-1)/2)*3.20;
      B('metal',bx,h,-1.38,2.42,1.94,.45,graphite);
      B((i+j)%3?'warmWindow':'glass',bx,h,-1.07,1.96,1.54,.22,0xe5d2ac);
    }
    B('trim',u,h+1.61,-5.76,width+.96,.32,9.28,iron);
  }
  for(const u of [-w*.30,w*.30])glow(u,5.76,-1.3,thermal?0xa0ddd2:0xffbf85,134,14);
}
// Two real floor plates meet at a half-bay offset. The window-side passage
// follows that jog rather than enclosing the whole street in a rectangular sign.
function residentialPassage({B,C},left,right,base,seed){
  const split=left+(right-left)*.56;
  const floor=.64,height=3.20,back=-2.08;
  for(const [index,start,end,front] of [[0,left,split,1.76],[1,split,right,2.72]]){
    const w=end-start,u=(start+end)/2,v=(front+back)/2,d=front-back;
    B('basaltShell',u,base+.32,v,w,floor,d,0x879a99);
    B('titaniumSkin',u,base+height+.32,v,w,.64,d,0x9eaba3);
    C(u,base+(height+.64)/2,v,w,height+.64,d);
    const n=Math.max(2,Math.round(w/2.24));
    for(let col=0;col<n;col++){
      const span=w/n,x=start+(col+.5)*span;
      for(const faceDir of [-1,1]){
        const faceZ=faceDir>0?front:back;
        const windowZ=faceZ-faceDir*.45;
        const lit=(seed+index+col+(faceDir>0?1:0))%5;
        B(lit===2?'routeHome':lit===4?'coolWindow':'glass',x,base+1.91,windowZ,span-.30,1.92,.16);
        for(let course=0;course<3;course++){
          const tongue=(col+course+seed)%3===0?.64:.32;
          B(course===1?'titaniumSkin':'ceramicShell',x-span/2+.16,base+1.12+course*.80,
            faceZ-faceDir*(.48-tongue/2),.32,.80,tongue+.32,course===0?0xba997d:0xaeb8af);
        }
        B('titaniumSkin',x,base+.80,faceZ-faceDir*.08,span,.32,.48,0xae9d82);
        B('ceramicShell',x,base+2.96,faceZ-faceDir*.16,span,.48,col%2?.64:.96,0xc4c3ad);
      }
    }
    // A pair of stepped brackets transmits the load into each end building.
    const hand=index?1:-1,anchor=index?end:start;
    for(let j=0;j<4;j++){
      const run=1.28+(3-j)*.64;
      B(j%2?'basaltShell':'titaniumSkin',anchor-hand*run/2,base-.16-j*.32,v,
        run,.32,d-.32,0x88959a);
      C(anchor-hand*run/2,base-.16-j*.32,v,run,.32,d-.32);
    }
  }
  B('titaniumSkin',split,base+1.92,2.24,.48,2.56,1.28,0xc5b295);
}

export function buildOldCityAirRights(api){
  castMaterial(api.materials);
  const F=(x,z,turn)=>frontage(api,x,z,turn);
  // North/south avenue. Keep the landmark shop sightline at first-floor
  // height; the signal floors project from its neighbours, at unequal heights.
  for(const [x,z,a,w,y,h,lit] of [
    [-10.65,32,east,9.7,8.16,1,true],[-10.65,44,east,8.2,5.76,-1,false],
    [10.65,29.8,west,7.6,6.08,-1,true],[-10.65,-49,east,10.2,5.76,1,true],
    [10.65,-39,west,9.72,7.36,-1,false],[-10.65,-39,east,9.72,11.2,1,false],
    [-27,-10.65,south,9.4,6.72,1,true],[-36,10.65,north,9.4,5.44,-1,true],
    [27,-10.65,south,9.6,7.04,-1,false],[16,10.65,north,8.0,5.44,1,true]
  ])substation(F(x,z,a),w,y,h,lit);
  for(const [x,z,a,w,y,h] of [
    [-17,-10.65,south,9.42,4.72,1],[37,-10.65,south,9.5,5.60,-1],
    [-16,10.65,north,8.7,6.08,1],[26,10.65,north,9.1,7.20,-1]
  ])loomFloor(F(x,z,a),w,y,h,true,true);
  transfer(F(-27,0,east),11.52,9.28,4.16,-1);
  heatExchange(F(34.1,0,east),11.52,7.68,1);
  // The east end enters Parkside's third floor. The west end enters the flats
  // over the record counter, leaving the shop door and avenue crossing open.
  residentialPassage(F(0,30.40,south),-11.20,11.52,9.92,1);
  // Tie the southern end into the existing building next to the pocket park.
  const eastBlock=F(30.62,16.5,east);
  intake(eastBlock,8.7,-1);
  eastBlock.B('metal',2.8,8.48,2.04,4.16,1.60,4.48,iron);
  eastBlock.C(2.8,8.48,2.04,4.16,1.60,4.48);
  condenser(F(24,-15.8,south),9.6,22.4,14.4,-1);
}

// Mercer takes cold-chain deliveries from the cross street. Two real cuts in
// the grocer meet at its southeast corner. A conveyor crosses the open yard
// from the stacking house, five metres above the delivery route.
function mercerReceiving(F){
  const sorting=F(17.15,75.70,south),returnWall=F(23.65,70.30,east);
  for(const [f,w,depth,count] of [[sorting,13,3.20,5],[returnWall,10.8,2.56,4]]){
    const {B,C,glow}=f;
    const floorEnd=f===returnWall?3.60:0;
    for(const y of [.40,4.12,7.28,10.32]){
      B('districtZinc',floorEnd*.5,y,-depth*.42,w+.64-floorEnd,.32,depth+.96,iron);
      C(floorEnd*.5,y,-depth*.42,w+.64-floorEnd,.32,depth+.96);
    }
    for(let k=0;k<count;k++){
      const u=(k+.5-count/2)*w/count;
      for(const [y,light] of [[5.52,cream],[8.72,ice]]){
        B('metal',u,y,-depth+.16,w/count-.22,2.48,.32,graphite);
        B(y>7?'coolWindow':'warmWindow',u,y,-depth+.37,w/count-.42,1.95,.18);
        B('districtIron',u-w/count*.46,y,-.28,.32,2.88,.80,iron);
        B('trim',u,y+1.24,-.32,w/count+.16,.32,1.28,copper);
        B(face,u,y+1.00,-1.18,w/count-.64,.17,.44,light);
        B('metal',u,y-.94,-.18,w/count-.18,.32,.64,iron);
      }
      // Staggered produce bins and the landing share a protected knee wall.
      const uGround=u+.20;
      B('districtOak',uGround,.96,-.74,w/count-.56,.40,.95,0xba9066);
      C(uGround,.87,-.74,w/count-.56,1.0,.95);
      for(let col=0;col<3;col++)for(let row=0;row<2;row++)
        B('trim',uGround+(col-1)*.40,1.24+row*.14,-.71+row*.32,.36,.24,.32,
          [0x9bad71,0xc48d50,0x85774a][(col+k)%3]);
      if(k%2===0)B(face,u,3.60,-.88,w/count-.33,.16,.55,cream);
    }
    for(const u of [-w*.45,w*.14]){
      B('districtZinc',u,2.16,-.10,.42,3.52,.64,ceramic);
      C(u,2.16,-.10,.42,3.52,.64);
    }
    glow(.64,3.20,-.80,0xffc091,118,12);
  }
  for(let y=.96;y<10.00;y+=.64){
    const deep=Math.round(y/.64)%4===0;
    sorting.B(deep?'trim':'districtIron',6.33,y,-.23,deep?.80:.48,.64,deep?.80:.48,deep?copper:iron);
  }
  sorting.C(6.33,5.12,-.23,.80,9.60,.80);
  // Pallets waiting behind the public counter and a retracted lifting fork.
  // Their uneven loading heights leave the red-brick wall visible between.
  for(const [u,tiers,tone] of [[-1.52,2,0xc6ac78],[.28,3,0xb6bd77],[3.80,2,0xc59367]]){
    sorting.B('metal',u,.65,-1.65,1.68,.28,1.28,iron);
    for(let k=0;k<tiers;k++){
      const y=1.02+.59*k,uu=u+(k===2?.16:0);
      sorting.B('districtOak',uu,y,-1.65,1.48,.48,1.00,tone);
      for(const side of [-1,1])sorting.B('trim',uu+side*.58,y,-1.10,.16,.48,.16,copper);
      sorting.B('trim',uu,y+.30,-1.57,1.10,.15,.65,k%2?0x9dbb6f:0xbc8d5b);
    }
    sorting.C(u,.78+tiers*.295,-1.65,1.68,.72+tiers*.59,1.28);
  }
  for(const u of [-2.63,-2.15]){
    sorting.B('metal',u,2.59,-2.06,.22,2.55,.32,iron);
    sorting.B('trim',u,1.40,-1.68,.25,.24,1.00,copper);
  }
  const {B,C,glow}=F(33.92,70.44,south);
  // The packing house's stepped end rises behind the low crate room.
  for(const [x,y,z,w,h,d,mat,color] of [
    [0,.58,-3.26,10.24,.76,8.32,'stone',ceramic],
    [0,3.90,-6.72,9.92,6.32,.64,'metal',graphite],
    [-4.64,3.84,-3.20,.64,6.40,7.68,'titaniumSkin',copper],
    [4.64,3.84,-3.20,.64,6.40,7.68,'titaniumSkin',copper],
    [0,6.64,-3.20,10.56,.64,8.64,'metal',iron],
    [1.92,9.17,-3.52,5.44,4.48,6.72,'metal',graphite],
    [2.88,12.34,-3.52,3.52,1.92,5.44,'metal',iron],
    [3.36,13.78,-3.84,2.56,.96,4.16,'trim',copper]
  ]){B(mat,x,y,z,w,h,d,color);C(x,y,z,w,h,d);}
  for(const u of [-3.2,0,3.2]){
    B('coolWindow',u,3.78,-5.92,2.72,4.18,.32);
    for(let j=0;j<3;j++)B('districtZinc',u,1.14+j*.55,-2.88+(j%2)*.29,2.48,.48,2.24,iron);
    C(u,1.69,-2.74,2.48,1.80,2.6);
    B(face,u,5.82,-1.80,2.35,.24,.64,ice);
  }
  for(let i=0;i<4;i++)B(i===1?face:'trim',1.92,7.60+i*.94,-.04,4.72,.48,.64,i===1?ice:iron);
  // Squared extractor ring. Alternating lengths form a stepped octagon.
  for(const u of [-2.95,-.20]){
    for(const [y,w] of [[3.28,1.10],[3.62,1.72],[3.96,2.18],[4.30,2.18],[4.64,1.72],[4.98,1.10]])
      B('trim',u,y,-5.54,w,.34,.40,iron);
    for(const [du,dy,w,h] of [[0,0,1.40,.32],[-.22,.35,.32,.70],[.22,-.35,.32,.70]])
      B('metal',u+du,4.14+dy,-5.26,w,h,.24,graphite);
    B(face,u,4.14,-5.09,.32,.32,.16,ice);
  }
  // Interlocking stepped keels climb towards the hoist, with oversize
  // drawer racks as freight rather than a solid box above the yard.
  for(let k=0;k<5;k++){
    const x=-9.36+k*1.28,y=5.24+k*.24,w=1.28;
    for(const z of [-1.28,.24])B('districtZinc',x,y,z,w,.48,.48,iron);
    B('metal',x,y+.16,-.52,w,.32,1.92,graphite);
    C(x,y+.10,-.52,w,.56,1.92);
    if(k===1||k===3){
      B('districtOak',x,y+.71,-.52,1.12,.80,1.12,copper);
      B(face,x,y+.72,.055,.36,.22,.08,cream);
    }
  }
  glow(.48,5.12,-1.82,0x9bd9d0,182,15);
}

export function buildSohoAirRights(api,tenancies,surface){
  castMaterial(api.materials);
  const F=(x,z,turn)=>frontage(api,x,z,turn);
  mercerReceiving(F);
  buildEastLoopMarket(F,face,surface);
  for(const [n,d] of tenancies.entries()){
    // One upper-storey projection per occupied frontage. Service streets
    // have deeper machinery and cloth stores; Market Avenue keeps its awnings.
    const y=[5.60,6.88,8.16,5.92][n%4],h=n%2?-1:1;
    if(d.id==='soho_greene_books'){
      // Leave the existing fire-escape landing over the north half unobstructed.
      loomFloor(F(d.x,d.z+3.15,d.rot),5.44,y,h,true,true);
      continue;
    }
    if(/battery|electrics|press|fabric|spring|canal/.test(d.id))
      substation(F(d.x,d.z,d.rot),d.width-.52,y,h,n%3!==0);
    else loomFloor(F(d.x,d.z,d.rot),d.width-.45,y,h,n%3!==1,n%3===0||d.id.includes('mercer'));
  }
  // The two block-edge stations are pinned to named shops. Their towers
  // become distant ends to east-west alleys and a neighbour outside 3B.
  condenser(F(15.6,68.8,west),10.24,17.92,13.44,1);
  condenser(F(-59,145,east),8.96,15.04,10.88,-1);
  // A transfer floor spans the western service lane; the eastern terminus
  // uses the taller receiving bay on the east loop.
  transfer(F(-47.2,110,south),9.60,9.92,3.84,1);
  const dyeWorks=F(58.32,104.8,south);
  transfer(dyeWorks,9.28,7.68,4.16,-1);
  // The west end bears on the atrium's outer column. The glass pitched roof
  // remains open towards the courtyard, under the edge of the exchanger.
  for(let level=0;level<4;level++){
    const u=-8.94+level*.32;
    dyeWorks.B('trim',u,5.48+level*.56,0,.8+level*.44,.56,2.88,iron);
    dyeWorks.C(u,5.48+level*.56,0,.8+level*.44,.56,2.88);
  }
  // The north edge of the south return faces across Green Street. At this
  // height the visible recessed bays frame both arms of the southern loop.
  loomFloor(F(-17.32,154.80,north),12.8,4.32,-1,true,true);
  substation(F(17.32,154.80,north),12.8,4.96,1,true);
  intake(F(-34.65,117.70,south),8.3,1);
  intake(F(70.40,144.80,south),6.1,-1);
  perimeterWorks(F(54.25,170.1,north),24.32,3,1,true);
  perimeterWorks(F(8.32,175.2,north),28.16,3,-1,false);
  perimeterWorks(F(-36.75,168.6,north),29.44,4,1,false);
  perimeterWorks(F(-68.8,102.4,east),17.92,2,1,true);
}
