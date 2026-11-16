import * as T from 'three';

/** Original adult commuters, all boxes batched into six instanced draws.
 * Navigation is sampled once against the actual completed world. Crowds add no
 * physical blockers: the player's route is never narrowed by an NPC collider.
 */
export function createCityCrowd(scene,{materials,bounds,isPlayable,colliders=[],ground,extraCrowdPaths=[]}) {
  const stats={requestedPeople:16+extraCrowdPaths.length,people:0,walking:0,idle:0,seated:0,umbrellas:0,drawCalls:0,instances:0,triangles:0,routeSamples:0,rejectedCandidates:0,routeValidation:[],addedColliders:0,updateHz:30};
  const protectedPoints=[[0,22,1.5],[-5.8,12.8,1],[6,-5.7,1],[35.1,23,1],[-142.1,0,1],[-113,8.3,1],[-120,-28.6,1],[0,-127.5,1],[-8,-139.5,1],[8,-129.7,1]];
  const definitions=[
    {id:'core_west_rainwalker',a:[-8.85,21],b:[-8.85,33.6],level:.36,look:0,umbrella:true,speed:.74},
    {id:'core_east_commuter',a:[8.85,22.2],b:[8.85,33.4],level:.36,look:2,speed:.84},
    {id:'core_west_underpass',a:[-7.4,-36],b:[-7.4,-22],level:.36,look:1,speed:.90},
    {id:'core_east_underpass',a:[7.4,-36],b:[7.4,-22],level:.36,look:3,speed:.80},
    {id:'subway_waiter',a:[-8.8,16.25],level:.36,look:2,heading:1.25,phone:true},
    {id:'food_cart_customer',a:[8.8,20.0],level:.36,look:1,heading:Math.PI/2},
    {id:'plaza_rainwalker',a:[-12.5,-137.6],b:[-12.5,-129],level:.36,look:3,umbrella:true,speed:.68},
    {id:'plaza_evening_commuter',a:[18,-139],b:[18,-129.3],level:.36,look:0,speed:.79},
    {id:'plaza_bench_reader',a:[-14,-124.5],level:.36,look:2,heading:0,seated:true,phone:true},
    {id:'delivery_rider_rest',a:[-20,-71.8],level:.36,look:1,heading:Math.PI,phone:true},
    {id:'midtown_stall_customer',a:[25,-73],level:.36,look:0,heading:Math.PI},
    {id:'plaza_east_seat',a:[23.45,-134.17],level:.36,look:3,heading:Math.PI,seated:true},
    {id:'greenway_east_walker',a:[15,-28.6],b:[32,-28.6],level:6.51,look:1,speed:.70},
    {id:'greenway_east_umbrella',a:[-22,-29.4],level:6.51,look:0,heading:-Math.PI/2,umbrella:true},
    {id:'greenway_west_walker',a:[-98,-28.6],b:[-88,-28.6],level:6.51,look:2,speed:.66},
    {id:'greenway_west_viewer',a:[-59,-29.5],level:6.51,look:3,heading:-Math.PI/2},
    ...extraCrowdPaths.map(p=>({...p,a:p.a.slice(),...(p.b?{b:p.b.slice()}:{})})),
  ];
  const looks=[
    {coat:0x536d7b,pants:0x36444e,skin:0xc79977,hair:0x44332b,trim:0x849d9a,umbrella:0x516a77},
    {coat:0x6e7459,pants:0x3b4a4d,skin:0xa97658,hair:0x282a2d,trim:0xb1a17c,umbrella:0x697162},
    {coat:0x9a8568,pants:0x454e58,skin:0xd7b08b,hair:0x66503a,trim:0xb5b5a0,umbrella:0x807262},
    {coat:0x76677e,pants:0x3c444f,skin:0x926b53,hair:0x2b2b30,trim:0xa392a1,umbrella:0x75606f},
  ];
  function intersects(x,z,r,y0,y1,occupiedSeat=null){
    for(const b of colliders){
      // A seated person occupies this one real chair. Its broad player blocker
      // includes the empty volume above the seat; all other solids still count.
      if(b===occupiedSeat)continue;
      if(y1<=b.min.y+.012||y0>=b.max.y-.012)continue;
      const xx=T.MathUtils.clamp(x,b.min.x,b.max.x),zz=T.MathUtils.clamp(z,b.min.z,b.max.z);
      if((x-xx)**2+(z-zz)**2<r*r)return true;
    }
    return false;
  }
  function safeSample(x,z,def,scale){
    stats.routeSamples++;
    if(bounds&&(x<bounds.minX+.35||x>bounds.maxX-.35||z<bounds.minZ+.35||z>bounds.maxZ-.35))return null;
    if(isPlayable&&!isPlayable(x,z,.32))return null;
    if(protectedPoints.some(([px,pz,r])=>Math.hypot(x-px,z-pz)<r+.12))return null;
    const y=ground?ground(x,z,def.level+.30):def.level;
    if(!Number.isFinite(y)||Math.abs(y-def.level)>.08)return null;
    const lower=y+(def.seated?.60:.09),upper=y+(def.seated?1.37:1.75)*scale;
    if(intersects(x,z,.30*scale,lower,upper,def.occupiedSeat))return null;
    if(def.umbrella&&intersects(x,z,1.02*scale,y+2.00*scale,y+2.27*scale))return null;
    return y;
  }
  function validatedRoute(def,scale){
    const shifts=[[0,0],[.3,0],[-.3,0],[0,.3],[0,-.3],[.6,0],[-.6,0],[0,.6],[0,-.6]];
    for(const [dx,dz]of shifts){
      const a=[def.a[0]+dx,def.a[1]+dz],b=def.b?[def.b[0]+dx,def.b[1]+dz]:a;
      const length=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.max(1,Math.ceil(length/.18));let valid=true,lastY;
      for(let i=0;i<=count;i++){
        const t=i/count,y=safeSample(T.MathUtils.lerp(a[0],b[0],t),T.MathUtils.lerp(a[1],b[1],t),def,scale);
        if(y===null||(lastY!==undefined&&Math.abs(y-lastY)>.07)){valid=false;break;}lastY=y;
      }
      if(valid)return {a,b,length,y:lastY,samples:count+1,shift:[dx,dz]};
      stats.rejectedCandidates++;
    }
    return null;
  }

  const group=new T.Group();group.name='NYC adult city life / six instanced batches';scene.add(group);
  const bucketMaterials={
    fabric:new T.MeshStandardMaterial({roughness:.91,metalness:.015}),
    skin:new T.MeshStandardMaterial({roughness:.83,metalness:0}),
    hair:new T.MeshStandardMaterial({roughness:.97,metalness:0}),
    shoes:new T.MeshStandardMaterial({roughness:.69,metalness:.04}),
    glow:new T.MeshStandardMaterial({roughness:.46,color:0xffffff,emissive:0x7cb6b2,emissiveIntensity:.48}),
    umbrella:new T.MeshStandardMaterial({roughness:.75,metalness:.015}),
  };
  const buckets=Object.fromEntries(Object.keys(bucketMaterials).map(k=>[k,[]])),actors=[];
  const tmp=new T.Object3D(),matrix=new T.Matrix4(),color=new T.Color();
  function joint(parent,name,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}
  function piece(actor,bucket,bone,x,y,z,w,h,d,tint,rx=0,ry=0,rz=0){
    tmp.position.set(x,y,z);tmp.rotation.set(rx,ry,rz);tmp.scale.set(w,h,d);tmp.updateMatrix();
    const item={bone,local:tmp.matrix.clone(),color:tint,index:buckets[bucket].length,actor};buckets[bucket].push(item);actor.pieces.push(item);
  }
  for(let i=0;i<definitions.length;i++){
    const def=definitions[i],scale=[1,.965,1.025,.985][i%4];
    if(def.seated)def.occupiedSeat=colliders.find(b=>b.userData?.streetLife==='cafe-chair'&&def.a[0]>b.min.x+.02&&def.a[0]<b.max.x-.02&&def.a[1]>b.min.z+.02&&def.a[1]<b.max.z-.02&&b.max.y<def.level+1.12)||null;
    const route=validatedRoute(def,scale);
    stats.routeValidation.push({id:def.id,valid:Boolean(route),level:def.level,walking:Boolean(def.b),occupiedSeat:Boolean(def.occupiedSeat),...(route?{a:route.a,b:route.b,samples:route.samples,shift:route.shift}:{reason:'No collision-free level route in local candidates'})});
    if(!route)continue;
    // Cafe chair slats are centred 5cm below their broad collision-box centre,
    // with 7cm thickness. The original park bench has an .845m seat top.
    const seatTop=def.seated?(def.occupiedSeat?(def.occupiedSeat.min.y+def.occupiedSeat.max.y)/2-.015:.845):null;
    const seatHip=def.seated?(seatTop-def.level)/scale+.07:0;
    const seatBend=def.seated?Math.asin(T.MathUtils.clamp((seatHip-.52)/.39,0,.4)):0;
    const actor={def,route,scale,seatTop,seatHip,seatBend,pieces:[],root:new T.Group(),heading:def.heading??Math.atan2(route.b[0]-route.a[0],route.b[1]-route.a[1]),phase:i*2.07,offset:i*3.9,speed:def.speed||0};
    actor.root.name=def.id;actor.root.scale.setScalar(scale);const p=looks[def.look];
    const hips=joint(actor.root,'hips',0,def.seated?actor.seatHip:.91,0),torso=joint(hips,'torso',0,.10,0),head=joint(torso,'head',0,.44,0);
    actor.hips=hips;actor.torso=torso;actor.head=head;actor.legs=[];actor.arms=[];
    const P=(bucket,bone,...args)=>piece(actor,bucket,bone,...args);
    P('fabric',hips,0,.015,0,.31,.17,.22,p.pants);
    P('fabric',torso,0,.15,0,.36,.39,.25,p.coat);P('fabric',torso,0,.325,0,.40,.09,.26,p.coat);
    P('fabric',torso,0,.02,.13,.34,.11,.03,p.trim);P('fabric',torso,0,.35,.035,.15,.10,.17,p.trim);
    P('fabric',torso,0,.16,.137,.018,.33,.018,0xb6b7a2);
    for(const side of [-1,1])P('fabric',torso,side*.108,.12,.141,.075,.08,.025,p.trim);
    if(def.look===1){P('fabric',torso,.10,.21,.15,.045,.38,.026,p.trim,0,0,.38);P('fabric',torso,-.17,-.015,.035,.11,.17,.19,0x59666a);}
    if(def.look===2){P('fabric',torso,-.095,-.085,.02,.15,.16,.26,p.coat);P('fabric',torso,.095,-.085,.02,.15,.16,.26,p.coat);}
    if(def.look===0||def.look===1){P('fabric',torso,0,.18,-.17,.23,.27,.13,0x43575f);P('fabric',torso,0,.18,-.245,.17,.16,.025,p.trim);}
    P('skin',torso,0,.415,0,.075,.085,.075,p.skin);
    P('skin',head,0,.142,0,.20,.235,.19,p.skin);P('skin',head,0,.035,.01,.16,.07,.17,p.skin);
    P('skin',head,0,.125,.112,.035,.055,.035,p.skin);
    for(const side of [-1,1]){P('skin',head,side*.109,.12,0,.025,.055,.045,p.skin);P('shoes',head,side*.047,.172,.104,.028,.018,.014,0x303338);}
    P('shoes',head,0,.075,.105,.048,.012,.012,0x8d6557);
    P('hair',head,0,.26,-.005,.225,.080,.215,p.hair);P('hair',head,0,.16,-.096,.215,.17,.035,p.hair);
    P('hair',head,-.085,.205,.053,.06,.085,.10,p.hair);P('hair',head,.055,.23,.085,.10,.045,.04,p.hair);
    if(def.look===3){P('fabric',head,0,.281,-.009,.24,.055,.24,p.coat);P('hair',head,.094,.145,-.035,.036,.11,.11,p.hair);}
    if(i%3===0){for(const side of [-1,1]){P('shoes',head,side*.126,.126,-.005,.028,.065,.06,0x3d4b50);P('glow',head,side*.142,.126,-.005,.012,.028,.034,0x90c5bf);}}
    for(const side of [-1,1]){
      const thigh=joint(hips,'thigh',side*.096,0,0),knee=joint(thigh,'knee',0,-.39,0),ankle=joint(knee,'ankle',0,-.40,0);actor.legs.push({side,thigh,knee,ankle});
      P('fabric',thigh,0,-.195,0,.143,.39,.16,p.pants);P('fabric',knee,0,-.20,0,.126,.40,.145,p.pants);
      P('shoes',ankle,0,-.058,.045,.16,.124,.285,0x2d373e);P('shoes',ankle,0,-.109,.055,.17,.025,.30,0x1e282d);
      const shoulder=joint(torso,'shoulder',side*.23,.31,0),elbow=joint(shoulder,'elbow',0,-.26,0);actor.arms.push({side,shoulder,elbow});
      P('fabric',shoulder,0,-.12,0,.128,.30,.15,p.coat);P('fabric',elbow,0,-.105,0,.112,.24,.13,p.coat);
      P('fabric',elbow,0,-.205,0,.118,.045,.14,p.trim);P('skin',elbow,0,-.265,.008,.085,.095,.075,p.skin);
    }
    if(def.dockCrew){
      P('fabric',torso,0,.16,.151,.35,.31,.027,0xc3843e);
      P('fabric',torso,0,.12,.171,.35,.033,.016,0xdece92);
      for(const side of [-1,1])P('fabric',torso,side*.108,.25,.171,.033,.14,.016,0xdece92);
      P('fabric',head,0,.285,.011,.24,.066,.235,0xc29649);
      P('fabric',head,0,.264,.044,.254,.028,.247,0xe6bf7c);
    }
    if(def.carryParcel){
      P('fabric',torso,0,.06,.29,.40,.24,.28,0xa1805d);
      P('fabric',torso,0,.06,.29,.045,.245,.286,0xd3b588);
      P('fabric',torso,.115,.085,.436,.09,.06,.012,0xc8c3ae);
    }
    if(def.phone){P('shoes',actor.arms[1].elbow,0,-.27,.065,.075,.115,.015,0x31494c);P('glow',actor.arms[1].elbow,0,-.27,.075,.05,.073,.008,0x8fb9b0);}
    if(def.umbrella){
      P('shoes',actor.root,.235,1.65,.26,.022,.97,.022,0x758c8e);P('shoes',actor.root,.22,1.19,.24,.065,.045,.07,0x4b565a);
      for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++){
        if(Math.abs(a)+Math.abs(b)>6)continue;
        const edge=Math.max(Math.abs(a),Math.abs(b)),fold=(Math.abs(a)===Math.abs(b)?-.012:0),y=2.20-edge*.036+fold;
        const tint=new T.Color(p.umbrella).multiplyScalar((a+b)%3===0?1.10:.94);
        P('umbrella',actor.root,.13+a*.138,y,.16+b*.138,.14,.042,.14,tint);
      }
      P('shoes',actor.root,.13,2.225,.16,.045,.075,.045,0x677d7f);
    }
    actors.push(actor);stats.people++;if(def.b)stats.walking++;else stats.idle++;if(def.seated)stats.seated++;if(def.umbrella)stats.umbrellas++;
  }
  const boxGeometry=new T.BoxGeometry(1,1,1),meshes={};
  for(const [name,items]of Object.entries(buckets)){
    if(!items.length)continue;
    const material=bucketMaterials[name];material.name=`NYC city crowd / ${name}`;
    const mesh=new T.InstancedMesh(boxGeometry,material,items.length);mesh.name=`NYC adult commuters / ${name}`;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=name==='fabric'||name==='umbrella';mesh.receiveShadow=true;mesh.frustumCulled=false;
    for(const item of items){color.set(item.color);mesh.setColorAt(item.index,color);}
    group.add(mesh);meshes[name]=mesh;stats.drawCalls++;stats.instances+=items.length;
  }
  stats.triangles=stats.instances*12;
  let elapsed=0,accumulator=0,quality='high',disposed=false;
  function pose(actor,t,dt){
    const{def,route}=actor;let progress=0,walking=false,direction=1;
    if(def.b){const travel=route.length/actor.speed,pause=1.05,cycle=travel*2+pause*2,q=(t+actor.offset)%cycle;
      if(q<pause)progress=0;else if(q<pause+travel){progress=(q-pause)/travel;walking=true;}else if(q<pause*2+travel){progress=1;direction=-1;}else{progress=1-(q-pause*2-travel)/travel;walking=true;direction=-1;}
    }
    const x=T.MathUtils.lerp(route.a[0],route.b[0],progress),z=T.MathUtils.lerp(route.a[1],route.b[1],progress),y=ground?ground(x,z,def.level+.30):route.y;
    actor.root.position.set(x,y,z);
    const target=def.b?Math.atan2((route.b[0]-route.a[0])*direction,(route.b[1]-route.a[1])*direction):def.heading||0;
    actor.heading+=Math.atan2(Math.sin(target-actor.heading),Math.cos(target-actor.heading))*(dt?1-Math.exp(-dt*4):1);actor.root.rotation.y=actor.heading;
    const phase=t*(3.1+actor.speed*2.1)+actor.phase,gait=walking?Math.sin(phase):0;
    actor.hips.position.y=(def.seated?actor.seatHip:.91)+(walking?Math.abs(Math.cos(phase))*.010:Math.sin(t*1.6+actor.phase)*.003);
    actor.torso.rotation.y=gait*.025;actor.head.rotation.y=Math.sin(t*.45+actor.phase)*.04;
    for(const leg of actor.legs){const s=gait*-leg.side;leg.thigh.rotation.x=def.seated?-Math.PI/2+actor.seatBend:-s*.34;leg.knee.rotation.x=def.seated?Math.PI/2-actor.seatBend:Math.max(0,s)*.46;leg.ankle.rotation.x=def.seated?0:-Math.max(0,-s)*.08;}
    for(const arm of actor.arms){const held=arm.side>0&&(def.umbrella||def.phone),s=gait*-arm.side;arm.shoulder.rotation.x=held?-.62:s*.24;arm.shoulder.rotation.z=-arm.side*.055;arm.elbow.rotation.x=held?-.78:-.10;if(def.carryParcel){arm.shoulder.rotation.x=-.43;arm.elbow.rotation.x=-1.14;arm.shoulder.rotation.z=arm.side*.045;}}
    actor.root.updateMatrixWorld(true);
  }
  function writeMatrices(){for(const [name,items]of Object.entries(buckets)){const mesh=meshes[name];if(!mesh)continue;for(const item of items){matrix.multiplyMatrices(item.bone.matrixWorld,item.local);mesh.setMatrixAt(item.index,matrix);}mesh.instanceMatrix.needsUpdate=true;}}
  function update(dt=0,time){if(disposed)return;dt=Number.isFinite(dt)?Math.max(0,Math.min(dt,.1)):0;elapsed=Number.isFinite(time)?time:elapsed+dt;accumulator+=dt;if(accumulator<1/stats.updateHz)return;const poseDt=accumulator;accumulator=0;for(const actor of actors)pose(actor,elapsed,poseDt);writeMatrices();}
  function setNight(night){bucketMaterials.glow.emissiveIntensity=night?.48:.12;}
  function setQuality(value){quality=value||'high';stats.updateHz=quality==='low'?12:quality==='high'?30:20;for(const name of ['fabric','umbrella'])if(meshes[name])meshes[name].castShadow=quality!=='low';}
  function dispose(){if(disposed)return;disposed=true;group.removeFromParent();boxGeometry.dispose();Object.values(bucketMaterials).forEach(m=>m.dispose());}
  for(const actor of actors)pose(actor,0,0);writeMatrices();setNight(true);
  return{stats,update,setNight,setQuality,dispose,group,actors};
}
