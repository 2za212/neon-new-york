import {spindle,splitConcourse} from './nyc-civic-cartridges.js';
import {exchangeStreetWings} from './nyc-civic-street-wings.js';
import {voxelBay} from './nyc-fulton-modules.js';
import {buildLowerExchange} from './nyc-lower-exchange.js';
import {buildExchangeGridworks} from './nyc-civic-gridworks.js';
import {buildVaultTransfer} from './nyc-exchange-vaultline.js';
import {buildTeaExchange} from './nyc-exchange-tea-market.js';
import {buildMarketFronts} from './nyc-district-frontages.js';
import {buildExchangeLifts} from './nyc-sky-lift.js';
import {exchangeApproach, civicHall, buildCivicHall, buildWestExchangeApproach} from './nyc-civic-hall.js';
import * as T from 'three';

/** Midtown's walkable city fabric and six fully modelled tower masses.
 * Add to the shared architectural batch. All coordinates / collider sizes are m.
 */
export function addMidtown(scene,{registerProperty,box,beam,materials,colliders,surface,sign,tree,lamp,bench,planter,rand=Math.random}) {
  const ROAD=.18,SIDE=.36;
  const bounds={minX:-64,maxX:84,minZ:-180,maxZ:-52};
  const stats={towers:0,podiums:0,boxes:0,beams:0,trees:0,treeBoxes:0,colliders:0,surfaces:0,signs:0,pointLights:0,independentDrawCalls:0,triangles:0};
  const before=colliders.length,lights=[],towerFootprints=[];
  const B=(...a)=>{stats.boxes++;box(...a);};
  const L=(...a)=>{stats.beams++;beam(...a);};
  const S=(x1,x2,z1,z2,y=SIDE)=>{surface(x1,x2,z1,z2,y);stats.surfaces++;};
  const C=(x,y,z,w,h,d)=>colliders.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));
  const tint=(amount=.1)=>{const v=1-amount*.5+rand()*amount;return new T.Color(v,v,v);};
  const label=(...a)=>{if(sign){stats.signs++;return sign(...a);}};
  function material(key,base,options={}){if(materials[key])return materials[key];const m=base.clone();Object.assign(m,options);m.name='NYC Midtown / '+key;m.userData={...base.userData};materials[key]=m;return m;}
  material('midtownLimestone',materials.ceramicShell,{color:new T.Color(0xc1c9c5),roughness:.49});
  material('midtownBronze',materials.metal,{color:new T.Color(0x847e62),roughness:.57,metalness:.62});
  material('midtownSteel',materials.titaniumSkin,{color:new T.Color(0xa5bac1),roughness:.42,metalness:.54});
  materials.midtownCurtain=materials.officeCurtain;

  B('asphalt',10,.01,-116,148,.34,128);
  // Only designed streets / terraces are declared walkable. Building shells
  // retain explicit collisions rather than a single district-sized blocker.
  const xRoads=[{z:-64,x1:-36,x2:0,w:10.4},{z:-86,x1:-64,x2:84,w:11.2},{z:-118,x1:-64,x2:84,w:11.2},{z:-175,x1:-36,x2:58,w:8}];
  const zRoads=[{x:0,z1:-124,z2:-52,w:12.8,s:3.8},{x:-36,z1:-180,z2:-52,w:9.6,s:2.8},{x:58,z1:-180,z2:-58.8,w:9.6,s:2.8}];
  function segments(a,b,cuts){let cursor=a;const out=[];for(const [lo,hi]of cuts.sort((p,q)=>p[0]-q[0])){if(hi<=cursor||lo>=b)continue;if(lo>cursor)out.push([cursor,Math.min(lo,b)]);cursor=Math.max(cursor,hi);}if(cursor<b)out.push([cursor,b]);return out;}
  for(const r of zRoads){
    S(r.x-r.w/2,r.x+r.w/2,r.z1,r.z2,ROAD);
    const cuts=xRoads.filter(c=>r.x>=c.x1-2&&r.x<=c.x2+2).map(c=>[c.z-c.w/2,c.z+c.w/2]);
    for(const [a,b]of segments(r.z1,r.z2,cuts))for(const e of [-1,1]){
      const approach=r.x===0&&a>=-113&&b<=-91;
      const halfRoad=approach?4.15:r.w/2,walkWidth=approach?3.35:r.s;
      const x=r.x+e*(halfRoad+walkWidth/2);
      B('concrete',x,.27,(a+b)/2,walkWidth,.18,b-a);S(x-walkWidth/2,x+walkWidth/2,a,b);
      for(let z=a+.25;z<b;z+=.5)B('trim',r.x+e*(halfRoad+.10),.285,z,.25,.21,.48,tint(.12));
    }
    for(let z=r.z1+4;z<r.z2-2;z+=7){if(xRoads.some(c=>Math.abs(z-c.z)<c.w/2+3.0))continue;for(const e of [-1,1])B('yellow',r.x+e*.13,.189,z,.075,.012,2.8,tint(.12));}
  }
  for(const r of xRoads){
    S(r.x1,r.x2,r.z-r.w/2,r.z+r.w/2,ROAD);
    const cuts=zRoads.filter(c=>r.z>=c.z1&&r.z<=c.z2).map(c=>[c.x-c.w/2,c.x+c.w/2]);
    for(const [a,b]of segments(r.x1,r.x2,cuts))for(const e of [-1,1]){
      const z=r.z+e*(r.w/2+1.5);B('concrete',(a+b)/2,.27,z,b-a,.18,3);S(a,b,z-1.5,z+1.5);
      for(let x=a+.25;x<b;x+=.5)B('trim',x,.285,r.z+e*(r.w/2+.10),.48,.21,.25,tint(.12));
    }
    for(let x=r.x1+4;x<r.x2-2;x+=7){if(zRoads.some(c=>Math.abs(x-c.x)<c.w/2+3.0))continue;for(const e of [-1,1])B('yellow',x,.189,r.z+e*.13,2.8,.012,.075,tint(.12));}
  }
  // Repeated crossings tie the corporate district back to New York's grid.
  for(const r of xRoads)for(const v of zRoads){
    if(v.x<r.x1||v.x>r.x2||r.z<v.z1||r.z>v.z2)continue;
    for(const e of [-1,1])for(let x=v.x-v.w/2+.55;x<v.x+v.w/2;x+=1.15)B('white',x,.19,r.z+e*(r.w/2-1.05),.58,.012,1.8,tint(.14));
    for(const e of [-1,1])for(let z=r.z-r.w/2+.55;z<r.z+r.w/2;z+=1.15)B('white',v.x+e*(v.w/2-1.05),.191,z,1.8,.012,.58,tint(.14));
  }
  // Level civic plaza and north tower-walk. The centre 12x12 remains untouched.
  B('paver',4,.27,-133,48,.18,24);S(-20,28,-145,-121);
  B('midtownLimestone',-8,.27,-142,32,.18,4);S(-24,8,-144,-140);
  for(const [x,w]of [[-28,8],[16,16]]){B('paver',x,.27,-157,w,.18,32);S(x-w/2,x+w/2,-173,-141);}
  B('paver',-8,.27,-173,34,.18,4);S(-25,9,-175,-171);
  // Shallow physical paving modules on the plaza edges, never through the device.
  for(const z of [-143.6,-122.4])for(let x=-19.4;x<28;x+=1.2)B('midtownLimestone',x,.375,z,1.15,.03,.68,tint(.1));
  for(const x of [-18.6,26.6])for(let z=-142;z<-122;z+=1.2)B('midtownLimestone',x,.375,z,.68,.03,1.15,tint(.1));

  function frame(x,z,w,d,h,base=SIDE){
    return {x,z,w,d,h,base,
      face(rot){const c=Math.cos(rot),s=Math.sin(rot),depth=rot%Math.PI===0?d:w,width=rot%Math.PI===0?w:d;
        const ox=x+s*depth/2,oz=z+c*depth/2;
        return {width,P:(u,y,v)=>[ox+u*c+v*s,base+y,oz-u*s+v*c],
          B:(mat,u,y,v,a,b,e,col=0xffffff)=>B(mat,ox+u*c+v*s,base+y,oz-u*s+v*c,a,b,e,col,rot)};
      }
    };
  }
  function podium(id,x,z,w,d,h,title='',warm=false){
    stats.podiums++;
    const hall=id==='civic_hero_podium'?civicHall:null;
    const teaMarket=id==='plaza_east_podium';
    const tintStone=tint(.08);
    function mass(xx,y,zz,ww,hh,dd){
      B('midtownLimestone',xx,y,zz,ww,hh,dd,tintStone);
      C(xx,y,zz,ww,hh,dd);
    }
    if(hall){
      const lower=hall.top-SIDE,sideWidth=(w-hall.width)/2,front=z+d/2;
      mass(x,(hall.top+SIDE+h)/2,z,w,SIDE+h-hall.top,d);
      mass(x,SIDE+lower/2,z-hall.depth/2,w,lower,d-hall.depth);
      for(const e of [-1,1]){
        const xx=x+e*(w/2-sideWidth/2);
        mass(xx,SIDE+lower/2,front-hall.depth/2,sideWidth,lower,hall.depth);
        B('metal',xx,.48,front+.025,sideWidth,.22,.12,0x5d7269);
      }
    }else if(teaMarket){
      // The old trading floor has become a municipal market. Both ground
      // streets and the upper public stair pass underneath this transfer slab.
      const soffit=8.68;
      mass(x,(soffit+SIDE+h)/2,z,w,SIDE+h-soffit,d);
    }else{
      mass(x,SIDE+h/2,z,w,h,d);
      B('metal',x,.48,z,w+.12,.22,d+.12,0x5d7269);
    }
    for(let ledge=0;ledge<3;ledge++)B('midtownLimestone',x,SIDE+h-.10+ledge*.18,z,w+.18+ledge*.16,.18,d+.18+ledge*.16,0xa4b1a4);
    const f=frame(x,z,w,d,h);
    for(const rot of [0,Math.PI/2,Math.PI,-Math.PI/2]){
      if(teaMarket)continue;
      const side=f.face(rot),cols=Math.max(3,Math.floor(side.width/3.0)),pitch=side.width/cols;
      const entrance=hall&&rot===0;
      for(let i=0;i<cols;i++){
        const u=-side.width/2+pitch*(i+.5);
        if(entrance&&Math.abs(u)-pitch/2<hall.width/2)continue;
        side.B('metal',u,2.35,.14,pitch-.24,3.9,.20,0x6f8583);
        side.B(i%4===1?'roomBoard':'roomOffice',u,2.35,.27,pitch-.45,3.60,.05,0xa8b8b1);
        side.B('metal',u,2.35,.315,.075,3.64,.045,0x98aaa0);
        side.B('metal',u,3.27,.315,pitch-.4,.08,.045,0x98aaa0);
        if(i%3!==2){
          // Bronze door leaves and crown lights are mounted inside each bay.
          const inset=pitch*.24;
          for(const e of [-1,1]){
            side.B('midtownBronze',u+e*inset,2.06,.36,.10,3.09,.10);
            side.B('midtownBronze',u+e*.18,1.53,.45,.046,.43,.085);
          }
          side.B('midtownBronze',u,3.60,.40,pitch*.57,.12,.26);
          side.B(warm?'lamp':'coolWindow',u,3.53,.48,pitch*.51,.055,.09);
          side.B('midtownBronze',u,1.0,.36,pitch*.48,.27,.08);
        }
        voxelBay(scene,'exchange',side.P(u,2.55,.08),rot,pitch,4.8);
        if(h>11){
          side.B('basaltShell',u,9.64,.24,pitch,8.48,.64,0x738c95);
          side.B('ceramicShell',u,7.36,.64,pitch-.08,2.88,1.28,0xd6d4c4);
          side.B('midtownCurtain',u,10.16,.68,pitch-.10,2.55,.38,0xccddd4);
          side.B('titaniumSkin',u,12.64,.64,pitch-.04,1.76,.96,0x92a7b2);
          if(i%3===1)side.B('ceramicShell',u,10.56,1.12,1.12,4.48,1.28,0xc2ccc2);
        }
      }
      if(entrance)continue;
      // Recessed lobby canopy and projected coffered edge, kept above heads.
      side.B('midtownSteel',0,4.43,1.0,Math.min(side.width*.62,12),.23,2.6,0x8faaa7);
      for(let u=-Math.min(side.width*.28,5.5);u<=Math.min(side.width*.28,5.5);u+=.7)side.B('rubber',u,4.29,1.04,.11,.045,2.35,0x97aaa2);
      side.B(warm?'lamp':'cyan',0,4.25,2.16,Math.min(side.width*.54,10),.045,.08,0xaac0b1);
    }
    if(title&&!hall&&!teaMarket)label(x,5.7,z+d/2+.58,Math.min(w*.65,12),.72,title,'MIDTOWN / NEW YORK',warm?'#d5bd97':'#8ac8cf');
    return {id,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,height:h};
  }
  material('archiveFrost',materials.coolWindow,{map:null,color:new T.Color(0xaabcbd),emissive:new T.Color(0xb6dcdf),emissiveIntensity:.50,roughness:.58});
  const towerPalette={ceramic:'ceramicShell',metal:'titaniumSkin',trim:'titaniumSkin',dark:'basaltShell',glass:'midtownCurtain',light:'lamp',wash:'archiveFrost'};
  function structureAt(x,z){
    return {B:(kind,t,u,y,v,w,h,d)=>B(towerPalette[kind],x+u,y,z+v,w,h,d,t),
      C:(u,y,v,w,h,d)=>C(x+u,y,z+v,w,h,d)};
  }
  function tower(id,x,z,w,d,base,height,seed,warm=false){
    const f=structureAt(x,z);
    stats.towers++;
    const titles={civic_hero:'都会交易塔',west_terracotta:'西坊工商业大楼',west_slim:'西口交换机房',east_exchange:'东侧交易大楼',east_sentinel:'东街值守塔',plaza_east:'旧票厅与茶市'};
    registerProperty?.(id,titles[id]||id,'旧交易所街区',x,z+d/2,w,d,0);
    towerFootprints.push({id,x,z,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,height:base+height});
    const apron=base===0?7.68:0, bottom=SIDE+base+apron, h=height-apron;
    if(apron)splitConcourse(f,w,d,SIDE,apron,id==='west_slim'?3:seed,warm);
    if(id==='civic_hero'){
      // The two half-height archive shafts separate into an open tuning fork.
      // The common transfer floor spreads across both occupied shafts.
      spindle(f,0,0,w,d,bottom,h*.44,seed);
      const forkBase=bottom+h*.44;
      spindle(f,-w*.31,1.28,w*.41,d*.78,forkBase,h*.56,seed+1);
      spindle(f,w*.28,-1.60,w*.36,d*.73,forkBase,h*.45,seed+2);
      f.B('metal',0x86a3af,0,forkBase+h*.31,0,w*.85,2.24,d*.42);
      f.C(0,forkBase+h*.31,0,w*.85,2.24,d*.42);
    }else{
      const low=h*(seed%2?.48:.61), swing=(seed%2?1:-1)*w*.13;
      spindle(f,0,.32,w,d,bottom,low,seed,warm);
      spindle(f,swing,-d*.10,w*.71,d*.74,bottom+low,h-low,seed+2,warm);
    }
  }
  const heroPodium=podium('civic_hero_podium',-8,-157,32,26,16,'CIVIC EXCHANGE',true);
  tower('civic_hero',-8,-157,20,20,16,104,0);
  tower('west_terracotta',-53,-102.5,18,15,0,66,1,true);
  tower('west_slim',exchangeApproach.westX,-102,14,14,0,82,2);
  stats.podiums++;
  splitConcourse(structureAt(exchangeApproach.eastX,-101.5),34,15,SIDE,10,3);
  tower('east_exchange',exchangeApproach.eastX,-101.5,26,13,10,69,3);
  tower('east_sentinel',74,-102.5,16,15,0,96,4);
  podium('plaza_east_podium',38,-150,26,24,11,'SIGNAL / ATRIUM');
  tower('plaza_east',38,-150,20,20,11,94,5,true);
  exchangeStreetWings(structureAt);

  // Opposing mast arms put visible crossings at the scale of the avenue.
  // The bases live on corner paving, outside the crosswalk and car lanes.
  for(const [x,z,direction] of [[-9.4,-111.5,1],[9.4,-124.5,-1]]){
    B('midtownLimestone',x,.57,z,.54,.44,.54);
    B('midtownBronze',x,2.84,z,.19,4.76,.19);
    C(x,2.74,z,.54,4.76,.54);
    const tip=x+direction*6.7;
    L('midtownBronze',[x,4.93,z],[tip,5.26,z],.135,.135);
    L('midtownSteel',[x,5.77,z],[tip-direction*.75,5.23,z],.05,.05);
    B('midtownBronze',x,5.40,z,.13,.92,.13);
    const face=z+direction*.16;
    B('yellow',tip,4.66,z,.47,1.24,.30);
    for(const [j,lit] of [[0,'rubber'],[1,'rubber'],[2,direction>0?'cyan':'tailLight']]){
      B('rubber',tip,4.30+j*.35,face,.34,.32,.055);
      B(lit,tip,4.30+j*.35,face+direction*.028,.20,.21,.048);
      B('metal',tip,4.44+j*.35,face+direction*.07,.34,.047,.19);
    }
    label(x+direction*2.48,4.88,z,2.7,.43,'LEXINGTON AV','MIDTOWN / M-08','#88bfae',direction>0?0:Math.PI);
  }
  // The shelter faces south onto the plaza crossing. Its open front keeps
  // passengers visible from both the crosswalk and the exchange entrance.
  const stopX=-5.9,stopZ=-124.4;
  const stop=(mat,u,y,v,w,h,d,col)=>B(mat,stopX+u,y,stopZ+v,w,h,d,col);
  for(const u of [-2.48,0,2.48]){
    stop('midtownBronze',u,1.81,-.51,.12,2.90,.15);
    C(stopX+u,1.81,stopZ-.51,.14,2.90,.16);
    stop('midtownLimestone',u,.44,-.51,.27,.16,.28);
    L('midtownSteel',[stopX+u,2.75,stopZ-.5],[stopX+u,3.15,stopZ+.93],.065,.065);
  }
  stop('midtownSteel',0,3.28,.12,5.45,.18,1.89);
  C(stopX,3.28,stopZ+.12,5.45,.18,1.89);
  stop('midtownBronze',0,3.35,1.03,5.51,.21,.14);
  // The night shuttle stays open after the old exchange closes. Hooded
  // reading lamps throw warm light onto the people waiting under the roof.
  for(const u of [-1.7,0,1.7]){
    stop('midtownSteel',u,3.08,.36,1.44,.28,.58,0x77878a);
    for(let cell=0;cell<4;cell++)stop('lamp',u+(cell-1.5)*.30,2.94,.51,.26,.13,.36,0xffc58e);
    stop('midtownBronze',u,2.86,.32,1.30,.12,.12,0xb38c69);
  }
  label(stopX,3.52,stopZ+1.12,4.95,.65,'夜班接驳','旧交易所  /  夜间候车','#ffcc8c',0);
  for(const u of [-1.24,1.24]){
    stop('metal',u,1.45,-.51,2.41,.08,.085);
    stop('lamp',u,3.165,.67,2.15,.035,.07);
  }
  for(const u of [-1.91,-.51])stop('midtownSteel',u,.60,-.16,.085,.48,.42);
  for(const v of [-.33,-.16,.01])stop('wood',-1.21,.86,v,2.06,.085,.145);
  C(stopX-1.21,.63,stopZ-.16,2.06,.55,.49);
  stop('midtownSteel',1.68,1.83,-.47,1.42,1.65,.21);
  label(stopX+1.68,2.14,stopZ-.28,1.24,.72,'M15  /  02','UPTOWN  -  4 MIN','#84e0d6',0);
  label(stopX+1.68,1.42,stopZ-.28,1.22,.44,'LEX / 52','NIGHT SERVICE','#e9ba82',0);
  C(stopX+1.68,1.83,stopZ-.47,1.42,1.65,.21);
  buildCivicHall({box:B,solid:C,surface:S,materials,sign:label});
  buildExchangeGridworks(B,C,materials,scene,lights,label);
  const vaultTransfer=buildVaultTransfer({scene,box:B,solid:C,sign:label,lights,materials});
  buildWestExchangeApproach({box:B,solid:C,sign:label,scene,lights});
  buildLowerExchange({box:B,solid:C,surface:S,sign:label});
  const crowdPaths=buildTeaExchange({scene,box:B,solid:C,surface:S,sign:label,lights});
  buildMarketFronts(B,C,label);
  const skyLifts=buildExchangeLifts(scene,B,C,lights);
  // A lower offset corporate wing gives the skyline a readable crown even at
  // street-level camera pitch, while the taller tower rises behind it.
  B('midtownCurtain',1,20.2,-151,10,8.0,11);
  B('midtownSteel',1,24.55,-151,10.7,.7,11.7);
  B('cyan',1,24.19,-145.34,10.4,.22,.18);
  // Landscaped and serviced corners finish the grid, rather than a bare rectangle.
  const forecourts=[[-53,-71,20,12],[-20,-73.9,14,5.4],[28,-74.5,34,5.8],[74,-70.5,16,14],[-53,-133,19,15],[-53,-157,19,21]];
  for(const [x,z,w,d]of forecourts){B('paver',x,.27,z,w,.18,d);S(x-w/2,x+w/2,z-d/2,z+d/2);}
  // Compact planting rooms and benches stay outside the device reservation.
  const trees=[[-56,-71,.9],[74,-70,.9],[-57.92,-133.76,.86],[-53,-161,.88],[75.52,-146.40,.84],[-15,-127,.86],[23,-124.5,.84]];
  for(const [x,z,size]of trees)if(tree){const r=tree(x,z,size,true);stats.trees++;stats.treeBoxes+=r?.boxes||0;}
  for(const [x,z,w,d]of [[-18,-126,2.0,1.0],[23.7,-125,2.0,1.0],[-17.8,-139,2.2,1.0],[25.6,-142.2,2.2,1.0],[-53,-131,7,1.2],[-53,-165,7,1.2],[75.52,-146.40,2.9,1.6]])if(planter)planter(x,z,w,d);
  if(bench)for(const [x,z,rot]of [[-14,-124.5,0],[-15,-140.5,Math.PI],[22,-124.2,0],[21.8,-142.7,Math.PI],[-53,-139,0],[-53,-153,Math.PI],[75.52,-145.22,0]])bench(x,z,rot);
  if(lamp){
    for(const z of [-72,-102,-132,-165]){lamp(-42.4,z,1);lamp(64.4,z,-1);}
    for(const x of [-21,18,45])for(const z of [-79,-125])lamp(x,z,z< -100?1:-1);
  }
  // Service cabinets and transformer bays occupy the perimeter courts only.
  for(const [x,z]of [[-56,-154],[-48,-154]]){
    B('midtownSteel',x,1.50,z,1.7,2.28,1.15,0x8c9f91);C(x,1.50,z,1.7,2.28,1.15);
    B('metal',x,2.72,z,1.92,.18,1.35,0x90a396);
    for(let j=0;j<6;j++)B('rubber',x-.59+j*.24,1.5,z+.59,.08,1.65,.035,0x8da195);
    B('cyan',x-.42,2.25,z+.63,.20,.06,.025,0x93b9aa);
  }
  for(const [x,z]of [[-59,-147]]){
    B('metal',x,2.8,z,1.5,4.9,1.5,0x8ba498);C(x,2.8,z,1.5,4.9,1.5);
    B('metal',x,5.4,z,2.3,.22,2.3,0x95aa9a);
    for(let j=0;j<4;j++)B('metal',x,4.2+j*.26,z,1.8,.11,1.8,0x859e92);
  }
  // Warm waiting passengers in front of the three cooler public portals.
  for(const [x,y,z,color,power,reach]of [[-4,2.72,-104,0x75e3e0,52,8],[4.6,2.80,-98.8,0xffa562,54,8],[-16,2.88,-137.6,0xffaa69,60,10],[-2,6.72,-141.5,0xbfdff3,32,12],
    [stopX-1.7,2.89,stopZ+.56,0xffc58e,94,10],[stopX+1.7,2.89,stopZ+.56,0xffcc99,83,9],
    ...[-16,-8,0].map(x=>[x,6.52,-138.74,0xb2dce6,104,14])]){
    const l=new T.PointLight(color,power,reach,2);l.position.set(x,y,z);l.castShadow=false;l.userData.nightPower=power;scene.add(l);lights.push(l);
  }
  const landmarks=[
    {id:'midtown_civic_plaza',title:'旧交易所夜市',position:new T.Vector3(0,SIDE,-127.5)},
    {id:'midtown_artdeco',title:'都会交易塔',position:new T.Vector3(-8,SIDE,-139.5)}
  ];
  const cyberAnchors=[
    {id:'hero_front',position:new T.Vector3(-8,7.8,-143.55),rotation:0,width:16,height:4.2,mountDepth:1.0},
    {id:'west_slim',position:new T.Vector3(exchangeApproach.westX,16,-94.55),rotation:0,width:9,height:6,mountDepth:.7},
    {id:'east_exchange',position:new T.Vector3(exchangeApproach.eastX,16.5,-93.65),rotation:0,width:15,height:7.2,mountDepth:1.4},
    {id:'east_plaza_west',position:new T.Vector3(27.65,22,-150),rotation:-Math.PI/2,width:12,height:8,mountDepth:.6}
  ];
  stats.colliders=colliders.length-before;stats.pointLights=lights.length;
  stats.independentDrawCalls+=vaultTransfer.draws+skyLifts.draws;stats.triangles=(stats.boxes+stats.beams)*12+vaultTransfer.triangles+skyLifts.triangles;
  stats.injectedTreeTriangles=stats.treeBoxes*12;stats.towerFootprints=towerFootprints;
  const plazaInfo={minX:-20,maxX:28,minZ:-145,maxZ:-121,y:SIDE,device:{minX:2,maxX:14,minZ:-140,maxZ:-128,center:new T.Vector3(8,SIDE,-134)},heroPodium};
  const districts=[{id:'midtown',title:'下城区 · 旧交易所街',position:new T.Vector3(0,ROAD,-97),bounds}];
  function setNight(night){for(const l of lights)l.intensity=l.userData.nightPower*(night?1:.15);}
  function update(dt,time,camera){vaultTransfer.update(time,camera);skyLifts.update(time,camera);}
  setNight(true);
  return {bounds,landmarks,districts,stats,plazaInfo,cyberAnchors,towerFootprints,lights,crowdPaths,update,setNight};
}
