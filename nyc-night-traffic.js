import * as T from 'three';
import {makeNightVehicle} from './nyc-night-traffic-model.js';

// Lane centres in world metres. The outward bend beside 夜班热卤 is a lay-by.
// Each route closes on another public road; nothing respawns at a visible end.
const exchange=[
  [54.75,-185.4],[55.1,-181.8],[56.1,-179.2],[56.1,-176.7],[-37.7,-176.7],
  [-37.7,-198],[-14.5,-215.2],[3.5,-240.4],[40.15,-239.3],[40.20,-216.9],
  [56.1,-195.8],[56.1,-192],[54.75,-188.3]
];
const terraces=[
  [67,-261.6],[101,-252.8],[124.6,-271.1],[132.0,-306],[117.4,-328.2],
  [89.85,-303.5],[90,-299.8],[90,-282.7],[89.8,-280.8],[87.7,-278.8]
];
const market=[
  [1.65,129.55],[-48.4,129.55],[-48.4,123],[-51,116.4],[-51,111.5],
  [-48.75,105.2],[-48.4,101],[-48.4,82.35],[1.65,82.35]
];
const oldExchange=[
  [1.9,-103.5],[1.45,-105.65],[0,-107],[-1.5,-105.65],[-1.9,-103.5],
  [-1.9,-87.65],[-35.12,-87.65],[-35.12,-116.15],[-12,-116.15],
  [-10,-116.6],[-9,-118.05],[-10,-119.53],[-12,-120.0],
  [-36.82,-120],[-36.82,-62.4],[1.9,-62.4]
];
// The park perimeter, the south-bound market service and the two old-city
// streets have distinct carriageways. Nothing turns across the park paths.
const park=[[61.1,13.6],[96,13.6],[104,14.7],[117,14.7],[125,13.6],
  [131.6,13.6],[131.6,82.3],[59.05,82.3],[59.05,25],[61.1,19]];
const foodRun=[[1.72,1.72],[56.94,1.72],[56.94,82.25],[1.72,82.25]];
const oldTown=[[1.72,-84.3],[56.96,-84.3],[56.96,-1.74],[1.72,-1.74]];
const civic=[[56.96,-159],[56.96,-119.9],[34,-119.9],[27,-120.0],[20,-120.0],
  [15.2,-119.4],[13.9,-118],[15.25,-116.35],[19,-116.1],[59.04,-116.1],[59.04,-159],
  [60.25,-165],[60.1,-168.6],[58.6,-170],[57.1,-170],[55.8,-168.5],[55.8,-165]];
const southMarket=[[-46.4,126.2],[56.4,126.2],[56.4,148.5],[-46.4,148.5]];
// Shallow turning pockets on the warehouse carriageway keep freight out of
// the guarded river walk. Both directions run continuously through the shops.
const quay=[
  [-119,-2.35],[-121,-1.8],[-121.9,0],[-121,1.8],[-119,2.35],[-17,2.35],
  [-14,1.8],[-13.2,0],[-14,-1.8],[-17,-2.35],[-107,-2.35],[-112,-3.1],[-116,-3.1]
];
// Offset the rail works circuit along the street's bends, including the
// junction shared with the corporate approach and the steep-sided freight cut.
const works=[ [40,-238],[14,-266],[-14,-292],[-17,-325],[11,-355],
  [61,-347],[68,-325],[86,-303],[86,-281],[67,-260] ].map((p,i,all)=>{
  const incoming=all[(i+all.length-1)%all.length],out=all[(i+1)%all.length];
  const before=Math.hypot(p[0]-incoming[0],p[1]-incoming[1]),after=Math.hypot(out[0]-p[0],out[1]-p[1]);
  const ax=-(p[1]-incoming[1])/before,az=(p[0]-incoming[0])/before;
  const bx=-(out[1]-p[1])/after,bz=(out[0]-p[0])/after;
  const scale=1.43/(1+ax*bx+az*bz);
  return [p[0]+(ax+bx)*scale,p[1]+(az+bz)*scale];
});
// The south-side station supports protrude beneath the elevated deck.
// Follow the opposite edge of the carriageway on this one approach.
works.push([57.7,-250.5]);
const grids=[
  {name:'旧交易所夜班线',points:exchange,berth:[54.75,-185.4]},
  {name:'东台地住宅环线',points:terraces,berth:[102,-253]},
  {name:'SoHo 市集回路',points:market,berth:[-51,113]},
  {name:'下城旧交易街',points:oldExchange,berth:[0,-85]},
  {name:'东园外围夜班接驳',points:park,berth:[112,14.7]},
  {name:'出生街口至市集',points:foodRun,berth:[1.72,29]},
  {name:'旧城大道至北街',points:oldTown,berth:[1.72,-22]},
  {name:'交易广场沿街线',points:civic,berth:[20,-119.9]},
  {name:'南市集补货线',points:southMarket,berth:[32,126.2]},
  {name:'仓库街码头货运',points:quay,berth:[-115,-3.1]},
  {name:'北部旧轨厂巡回',points:works,berth:[9,-353]}
];

function makeCircuit({name,points,berth}){
  const samples=[],distance=[],bends=[];
  function towards(p,q,d){
    const x=q[0]-p[0],z=q[1]-p[1],length=Math.hypot(x,z);
    return [p[0]+d*x/length,p[1]+d*z/length];
  }
  for(let i=0;i<points.length;i++){
    const a=points[(i+points.length-1)%points.length],p=points[i],b=points[(i+1)%points.length];
    const la=Math.hypot(p[0]-a[0],p[1]-a[1]),lb=Math.hypot(p[0]-b[0],p[1]-b[1]);
    const radius=Math.min(4,.4*la,.4*lb);
    const entry=towards(p,a,radius),exit=towards(p,b,radius);
    for(let k=0;k<=8;k++){
      const t=k/8,u=1-t;
      samples.push([u*u*entry[0]+2*u*t*p[0]+t*t*exit[0],u*u*entry[1]+2*u*t*p[1]+t*t*exit[1]]);
    }
    const inX=p[0]-a[0],inZ=p[1]-a[1],outX=b[0]-p[0],outZ=b[1]-p[1];
    if((inX*outX+inZ*outZ)/la/lb<.87)
      bends.push({index:samples.length-5,side:Math.sign(inZ*outX-inX*outZ)});
  }
  samples.push(samples[0]);let length=0;distance.push(0);
  for(let i=1;i<samples.length;i++){length+=Math.hypot(samples[i][0]-samples[i-1][0],samples[i][1]-samples[i-1][1]);distance.push(length);}
  function locate(travel){
    const d=T.MathUtils.euclideanModulo(travel,length);
    let lo=0,hi=distance.length-1;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(distance[mid]>d)hi=mid;else lo=mid;}
    const a=samples[lo],b=samples[lo+1],k=(d-distance[lo])/(distance[lo+1]-distance[lo]);
    return [T.MathUtils.lerp(a[0],b[0],k),T.MathUtils.lerp(a[1],b[1],k)];
  }
  function closest(p){
    let best=Infinity,s=0;
    for(let i=1;i<samples.length;i++){
      const a=samples[i-1],b=samples[i],dx=b[0]-a[0],dz=b[1]-a[1];
      const t=T.MathUtils.clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz),0,1);
      const gap=(a[0]+dx*t-p[0])**2+(a[1]+dz*t-p[1])**2;
      if(gap<best){best=gap;s=T.MathUtils.lerp(distance[i-1],distance[i],t);}
    }
    return s;
  }
  return {name,length,locate,closest,berth:closest(berth),bends:bends.map(b=>({d:distance[b.index],side:b.side}))};
}

// Each warehouse has a narrow private loading aisle. A fork truck reverses
// from the stack to the weighing point, then takes the pallet back for storage.
function loadingAisle(name,x,start,end){
  const span=Math.abs(end-start),facing=Math.sign(end-start),length=2*span;
  return {name,length,facing,berth:span,bends:[],
    closest:([,z])=>T.MathUtils.clamp((z-start)*facing,0,span),
    locate(d){
      const s=T.MathUtils.euclideanModulo(d,length);
      return [x,start+facing*(s<span?s:length-s)];
    }};
}
export function createNightTraffic(scene,{ground}){
  const routes=grids.map(makeCircuit);
  routes.push(loadingAisle('西仓复秤纵巷',-100.5,-14.2,-45),
    loadingAisle('东仓集货纵巷',-73,14.1,27.8));
  const fleet=[
    [0,'delivery',0x829f9e,0xf1b26e,[55.3,-189.9],4.3,true],
    [0,'taxi',0xb29561,0xd9cab0,[40.2,-232],5.2,false],
    [1,'taxi',0x688d93,0xc0d7c9,[85,-278],4.6,false],
    [2,'resident',0x97696c,0xc6b6a6,[-51,113],4.1,true],
    [3,'taxi',0x8b9fa7,0xd8c08d,[1.65,-94.5],3.9,false],
    [4,'shuttle',0x527a79,0xd3e5cf,[107,13.6],5.15,true],
    [4,'resident',0x756c89,0xa4b4c3,[77,82.3],4.5,false],
    [5,'delivery',0xa69a76,0xc47358,[1.72,36],4.3,false],
    [5,'taxi',0x57858c,0xddc17b,[56.3,14],4.95,false],
    [6,'service',0x63939d,0xe2ba7d,[1.72,-30],4.35,false],
    [7,'shuttle',0x778792,0xadd4d4,[1,-116.4],4.7,true],
    [8,'flatbed',0xb18c66,0x8bb1a4,[37,129.55],4.25,true],
    [9,'flatbed',0x8a957e,0xdd9d6d,[-105,-2.35],4.2,true],
    [9,'service',0x718a92,0xe7be72,[-43,2.35],4.8,false],
    [10,'service',0x607c89,0xe8ab64,[-15,-311],4.35,true],
    [10,'taxi',0x937997,0xc2b4d2,[72,-320],5.1,false],
    [11,'forklift',0x889b81,0xefad68,[-100.5,-32],1.9,true],
    [12,'forklift',0x589794,0xe9ad66,[-73,24],1.55,true],
  ];
  const cars=fleet.map(([which,kind,color,stripe,spawn,cruise,stops],i)=>{
    const model=makeNightVehicle(kind,color,stripe),route=routes[which],d=route.closest(spawn);
    model.root.name=route.name+' / '+({taxi:'夜班出租',resident:'夜归私家车',delivery:'社区配送',
      shuttle:'夜间接驳',flatbed:'电池货运',service:'巡线车',forklift:'夜班叉车'}[kind]);scene.add(model.root);
    const nextStop=d+T.MathUtils.euclideanModulo(route.berth-d,route.length);
    const dwell=kind==='shuttle'?9.6:kind==='flatbed'?10.8:kind==='forklift'?5.2:7.2;
    let restingPallet;
    if(kind==='forklift'){
      const [sx,sz]=route.locate(route.berth);
      scene.add(model.workLight);
      scene.add(model.cargo);model.cargo.position.set(sx,ground?ground(sx,sz,.52):.18,sz+route.facing*1.43);
      model.cargo.rotation.y=Math.atan2(0,route.facing);
      const p=model.cargo.position;
      restingPallet=new T.Box3(new T.Vector3(p.x-.48,p.y+.06,p.z-.41),new T.Vector3(p.x+.48,p.y+.73,p.z+.41));
    }
    return {id:i,kind,route,stops,d,cruise,model,nextStop,hold:0,dwell,speed:kind==='resident'?0:cruise*.67,brake:0,
      carrying:false,handled:false,atStack:false,restingPallet,loadHeight:0,
      root:model.root,x:0,y:.18,z:0,fx:0,fz:1,bodies:[new T.Box3(),new T.Box3(),new T.Box3()]};
  });
  // The driver who reaches the junction first occupies its turning space
  // until the rear has cleared it. Lanes on the park promenade never enter.
  const junctions=[[0,0],[58,0],[58,12],[58,84],[0,84],[0,-86],
    [58,-86],[58,-118],[58,-175],[40,-238],[67,-260],[86,-303],
    [-48,128],[0,128],[58,128]].map(([x,z])=>({x,z,owner:null,entered:false}));
  function regulateJunctions(){
    for(const c of cars){c.junctionGap=Infinity;c.yieldingTo=null;}
    for(const j of junctions){
      if(j.owner){
        const radius=Math.hypot(j.owner.x-j.x,j.owner.z-j.z);
        if(radius<7.1)j.entered=true;
        if((j.entered&&radius>8.0)||radius>17){j.owner=null;j.entered=false;}
      }
      let nearest=null,time=Infinity;
      for(const c of cars){
        const dx=j.x-c.x,dz=j.z-c.z,r2=dx*dx+dz*dz;
        if(r2>16*16||dx*c.fx+dz*c.fz<0||Math.abs(dx*c.fz-dz*c.fx)>6.2)continue;
        const distance=Math.sqrt(r2),eta=distance/Math.max(c.speed,1.6);
        if(eta<time){nearest=c;time=eta;}
      }
      if(!j.owner&&nearest)j.owner=nearest;
      if(!j.owner)continue;
      for(const c of cars){
        if(c===j.owner)continue;
        const dx=j.x-c.x,dz=j.z-c.z,r2=dx*dx+dz*dz;
        if(r2>16*16||dx*c.fx+dz*c.fz<=0||Math.abs(dx*c.fz-dz*c.fx)>6.2)continue;
        const holdLine=Math.max(0,Math.sqrt(r2)-8.3);
        if(holdLine<c.junctionGap){c.junctionGap=holdLine;c.yieldingTo=j.owner;}
      }
    }
  }
  let clock=0;
  function lamps(c){
    if(c.kind==='forklift'){
      const elapsed=c.dwell-c.hold;
      const approach=c.hold>0&&c.atStack?1-T.MathUtils.smoothstep(elapsed,0,1.55)
        +T.MathUtils.smoothstep(elapsed,2.9,4.6):1;
      if(c.hold>0&&c.atStack&&!c.handled&&elapsed>=2.2){
        const load=c.model.cargo;
        if(c.carrying){scene.attach(load);}
        else{c.root.attach(load);load.position.set(0,0,1.43);load.rotation.set(0,0,0);}
        c.carrying=!c.carrying;c.handled=true;
      }
      c.loadHeight=.28*approach;c.model.setFork(c.loadHeight,c.carrying);
      if(c.carrying){
        if(c.bodies.length===3)c.bodies.push(new T.Box3());
        const z=c.z+c.route.facing*1.43,y=c.y+c.loadHeight;
        c.bodies[3].min.set(c.x-.48,y+.055,z-.41);c.bodies[3].max.set(c.x+.48,y+.73,z+.41);
      }else if(c.bodies.length===4)c.bodies.pop();
      for(let j=1;j<3;j++){
        const x=c.x+(j===1?-.37:.37),z=c.z+c.route.facing*1.41;
        c.bodies[j].min.set(x-.055,c.y+c.loadHeight,z-.45);
        c.bodies[j].max.set(x+.055,c.y+c.loadHeight+.09,z+.45);
      }
      return;
    }
    const arrival=T.MathUtils.euclideanModulo(c.route.berth-c.d,c.route.length),since=c.route.length-arrival;
    const towardKerb=c.kind==='resident'?1:-1;
    let turn=c.turn||0;
    if(c.stops){
      if(c.hold>0)turn=c.hold<2?-towardKerb:0;
      else if(since<5.5)turn=-towardKerb;
      else if(arrival<10)turn=towardKerb;
    }
    const doorOpen=c.hold>0?T.MathUtils.smoothstep(c.hold,.35,1.3)*T.MathUtils.smoothstep(c.dwell-c.hold,.20,1.15):0;
    c.model.setLights(c.brake,turn,(clock+c.id*.18)%.92<.46?1:0,doorOpen);
  }
  function pose(c){
    const [x,z]=c.route.locate(c.d),[ax,az]=c.route.locate(c.d-.58),[bx,bz]=c.route.locate(c.d+.58);
    const magnitude=Math.hypot(bx-ax,bz-az);
    c.x=x;c.z=z;
    if(c.route.facing){
      c.fx=0;c.fz=c.route.facing*(T.MathUtils.euclideanModulo(c.d,c.route.length)<c.route.berth?1:-1);
    }else{c.fx=(bx-ax)/magnitude;c.fz=(bz-az)/magnitude;}
    c.y=ground?ground(x,z,.52):.18;
    c.root.position.set(x,c.y,z);c.root.rotation.y=Math.atan2(c.fx,c.route.facing||c.fz);
    lamps(c);
    if(c.route.facing){
      c.model.workLight.position.set(c.x+.54*c.route.facing,c.y+1.85,c.z+.52*c.route.facing);
      c.bodies[0].min.set(x-.74,c.y+.07,z-1.01);c.bodies[0].max.set(x+.74,c.y+c.model.height,z+1.01);return;
    }
    const sx=Math.abs(c.fz)*.93+Math.abs(c.fx)*.70,sz=Math.abs(c.fx)*.93+Math.abs(c.fz)*.70;
    for(let j=0;j<c.bodies.length;j++){
      const cx=x+(j-1)*1.39*c.fx,cz=z+(j-1)*1.39*c.fz,b=c.bodies[j];
      b.min.set(cx-sx,c.y+.10,cz-sz);b.max.set(cx+sx,c.y+c.model.height,cz+sz);
    }
  }
  for(const c of cars)pose(c);
  function yieldDistance(c,x,y,z,otherVehicle=false){
    if(Math.abs(c.y-y)>1.9)return Infinity;
    const dx=x-c.x,dz=z-c.z,along=dx*c.fx+dz*c.fz,side=Math.abs(dx*c.fz-dz*c.fx);
    if(side>(otherVehicle?1.90:1.37)||along<.05||along>15)return Infinity;
    return Math.max(0,along-(otherVehicle?5.25:2.74));
  }
  function drive(c,dt,player,walkers,extraPeople){
    if(c.hold>0){c.hold=Math.max(0,c.hold-dt);c.speed=0;c.brake=1;lamps(c);return;}
    let gap=c.junctionGap;
    if(player)gap=Math.min(gap,yieldDistance(c,player.x,player.y,player.z));
    for(const actor of walkers||[]){
      const p=actor.root?.position||actor.position||actor;
      gap=Math.min(gap,yieldDistance(c,p.x,p.y,p.z));
    }
    for(const p of extraPeople||[])gap=Math.min(gap,yieldDistance(c,p.x,p.y,p.z));
    for(const other of cars){
      if(other===c||other.yieldingTo===c)continue;
      gap=Math.min(gap,yieldDistance(c,other.x,other.y,other.z,true));
    }
    const dock=c.stops?Math.max(0,c.nextStop-c.d):Infinity;
    const remaining=Math.min(gap,dock);
    let target=Math.min(c.cruise,Math.sqrt(2*.95*remaining));
    c.turn=0;
    for(const bend of c.route.bends){
      const to=T.MathUtils.euclideanModulo(bend.d-c.d,c.route.length);
      if(to<7||to>c.route.length-2){
        target=Math.min(target,1.95+Math.max(0,to<7?to-1:0)*.28);c.turn=bend.side;
      }
    }
    const previous=c.speed;
    c.speed=T.MathUtils.clamp(target,c.speed-2.8*dt,c.speed+1.20*dt);
    const step=Math.min(remaining,c.speed*dt);
    c.d+=step;
    if(gap<.075){c.speed=0;}
    if(dock-step<.075){
      c.d=c.nextStop;c.nextStop+=c.route.facing?c.route.length/2:c.route.length;c.hold=c.dwell;c.speed=0;
      c.atStack=Math.abs(T.MathUtils.euclideanModulo(c.d,c.route.length)-c.route.berth)<.075;c.handled=false;
    }
    c.brake=T.MathUtils.damp(c.brake,c.speed<.12||c.speed<previous-.008?1:0,8,dt);
    pose(c);
  }
  function withBodies(staticList,x,z){
    let list=staticList;
    for(const c of cars){
      if(Math.abs(c.x-x)<3.2&&Math.abs(c.z-z)<3.2){
        if(list===staticList)list=[...staticList];
        list.push(...c.bodies);
      }
      const p=c.restingPallet;
      if(p&&!c.carrying&&x>p.min.x-1.2&&x<p.max.x+1.2&&z>p.min.z-1.2&&z<p.max.z+1.2){
        if(list===staticList)list=[...staticList];
        list.push(p);
      }
    }
    return list;
  }
  function withCameraBodies(staticList,a,b){
    let list=staticList;
    for(const c of cars){
      const p=c.restingPallet;
      if(p&&!c.carrying&&p.max.x>=Math.min(a.x,b.x)-1&&p.min.x<=Math.max(a.x,b.x)+1&&
        p.max.z>=Math.min(a.z,b.z)-1&&p.min.z<=Math.max(a.z,b.z)+1){
        if(list===staticList)list=[...staticList];
        list.push(p);
      }
      if(c.x<Math.min(a.x,b.x)-3||c.x>Math.max(a.x,b.x)+3||
        c.z<Math.min(a.z,b.z)-3||c.z>Math.max(a.z,b.z)+3)continue;
      if(list===staticList)list=[...staticList];
      list.push(...c.bodies);
    }
    return list;
  }
  return {cars,routes,withBodies,withCameraBodies,stats:{cars:cars.length,loops:routes.length},
    update(dt,player,walkers,camera,extraPeople){
      dt=Math.min(.1,Math.max(0,dt));
      clock+=dt;
      regulateJunctions();
      for(const c of cars){
        drive(c,dt,player,walkers,extraPeople);
        if(camera){
          const dx=c.x-camera.x,dz=c.z-camera.z;
          c.root.visible=dx*dx+dz*dz<(c.root.visible?128:120)**2;
        }else c.root.visible=true;
      }
    }};
}
