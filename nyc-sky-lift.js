import * as T from 'three';

// A facade-mounted vertical shuttle. Inside the two split guides there is
// daylight, a moving cabin and an exposed back wall. The glazed landings join
// the building at occupied floors; their return faces project over the street.
const iron=0x354452, enamel=0x9ab8c4, alloy=0x526a7c, copper=0xb68b62;
const ice=0x7debf1, ultraviolet=0xd69bea, ochre=0xffbb69;

// Three physical prisms form a lit, open route marker perpendicular to the
// building. From the other side of the road the returned doorhead reads too.
function streetLanding({B,C},offset,accent){
  const bottom=3.84;
  B('hull',iron,offset,bottom+.40,.96,5.76,.80,2.56);
  C(offset,bottom+.40,.96,5.76,.80,2.56);
  for(let j=0;j<3;j++){
    const x=offset+(j-1)*1.60;
    B('light',j===1?0xe4f3e8:accent,x,bottom-.075,1.64,1.28,.20,.80);
    B('hull',alloy,x+.64,bottom+.96,.80,.32,.64,1.92);
  }
  B('hull',enamel,offset+1.92,bottom+2.08,1.28,.48,3.20,3.52);
  for(const side of [-1,1])for(let bar=0;bar<3;bar++){
    const u=offset+1.92+side*.34,v=2.96+bar*.32,y=bottom+.96+bar*.48;
    B('light',accent,u,y,v,.24,.48,.96);
    B('light',bar<2?accent:0xc3dce3,u,y+1.44,v,.24,.48,.96);
  }
  B('hull',iron,offset+1.92,bottom+3.92,1.84,.80,.64,4.0);
}

function liftBank(frame, cars, {height, bottom=3.84, accent=ice, offset=0, seed=0}) {
  const {B,point}=frame, top=bottom+height;
  const block=(mat,tint,u,y,v,w,h,d)=>B(mat,tint,u+offset,y,v,w,h,d);
  frame.C(offset,(bottom+top)/2,1.04,6.08,height,3.36);
  // The guides use half-metre castings alternating across a running bond.
  for(const hand of [-1,1]){
    const u=hand*2.40;
    block('hull',iron,u,(bottom+top)/2,1.12,1.28,height,1.92);
    block('light',hand<0?accent:0x73919f,u-hand*.35,(bottom+top)/2,2.16,.32,height,.32);
    for(let y=bottom+1.60,level=0;y<top-1;y+=4.48,level++){
      const reach=level%3===0?.96:.32;
      block('hull',level%3===0?enamel:alloy,u+hand*.32,y,1.60,1.92,.96,2.24+reach);
      block('hull',iron,u+hand*.48,y+.72,1.76,.96,.48,1.92);
      block('light',level%3===0?accent:0x6a919e,u+hand*.48,y+.03,2.78+reach*.5,1.0,.44,.24);
    }
  }
  // The distant shape is an open fork rather than a rectangle of sign glass.
  for(let tier=0;tier<4;tier++){
    const u=-2.08+tier*.64,y=top+tier*.80;
    block('hull',tier%2?enamel:alloy,u,y,1.12,2.56+tier*.64,.80,3.52);
    block('light',accent,u,y+.02,2.93,2.24+tier*.64,.48,.24);
  }
  block('hull',iron,2.4,top+.48,1.1,1.28,.96,2.56);
  block('light',ochre,2.4,top+1.28,1.22,.64,.64,.96);

  for(let y=bottom,landing=0;y<top-2;y+=12.80,landing++){
    const hand=(seed+landing)%2?-1:1;
    const x=hand*4.32, extension=landing%2?2.88:4.16;
    frame.C(offset+x,y+1.76,extension/2,4.48,3.52,extension+.96);
    block('hull',alloy,x,y+.32,-1.92,3.52,.64,4.80);
    block('hull',alloy,x,y+.32,extension/2,4.48,.64,extension+.96);
    block('hull',iron,x,y+1.92,.80,3.84,2.88,1.60);
    block('light',landing%3===1?0xcab48e:0x96cacf,x,y+2.0,1.64,3.36,1.76,.24);
    for(const side of [-1,1]){
      block('hull',enamel,x+side*1.76,y+1.76,extension-.48,.48,2.56,1.28);
      block('hull',iron,x+side*1.28,y+1.76,extension-.28,.24,2.08,.40);
    }
    block('hull',alloy,x,y+3.36,extension*.56,4.8,.64,extension+1.28);
    block('light',landing%3===1?ochre:accent,x,y+3.04,extension+.28,3.52,.24,.64);
    if(landing%2===0){
      block('hull',iron,x+hand*2.08,y+1.76,extension*.44,.48,2.56,extension-.32);
      block('light',accent,x+hand*2.36,y+1.88,extension*.46,.16,1.28,extension-1.28);
    }
  }
  const [x,z]=point(offset,1.90),[xx,zz]=point(offset+1,1.90);
  cars.push({x,z,yaw:Math.atan2(z-zz,xx-x),lo:bottom+2.32,hi:top-1.76,seed,accent});
}

// All cabins in one district share one draw and an explicit conservative
// bound. The doors, blue window returns and recessed belt travel as one car.
function cabinFleet(scene,cars){
  const parts=[
    [0,-1.24,0,3.36,.48,2.24,alloy], [0,-.84,.08,3.68,.32,2.40,enamel],
    [0,.08,0,3.20,1.60,1.92,iron], [0,.16,1.02,2.88,1.12,.16,0xd6eeec],
    [-.13,.12,1.14,.24,1.28,.16,iron], [1.66,.12,0,.16,.96,1.44,0x9fc6c8],
    [-1.66,.12,0,.16,.96,1.44,0x9fc6c8], [0,1.04,0,3.52,.48,2.08,enamel],
    [0,1.36,0,2.88,.24,1.76,alloy], [0,-.50,1.06,3.20,.24,.32,null]
  ];
  const geo=new T.BoxGeometry(1,1,1), normals=geo.getAttribute('normal');
  const faceColors=[];
  for(let i=0;i<normals.count;i++){
    const light=normals.getY(i)>.5?1:normals.getY(i)<-.5?.38:normals.getZ(i)>.5?.92:.69;
    faceColors.push(light,light,light);
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(faceColors,3));
  const mesh=new T.InstancedMesh(geo,new T.MeshBasicMaterial({vertexColors:true}),parts.length*cars.length);
  mesh.name='立体通勤 / 穿梭梯轿厢';mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const bounds=new T.Box3(),vec=new T.Vector3(),transform=new T.Object3D(),color=new T.Color();
  cars.forEach((car,id)=>{
    for(const [x,z] of (car.end?[[car.x,car.z],car.end]:[[car.x,car.z]])){
      bounds.expandByPoint(vec.set(x-4,car.lo-2,z-4));bounds.expandByPoint(vec.set(x+4,car.hi+2,z+4));
    }
    parts.forEach((p,j)=>mesh.setColorAt(id*parts.length+j,color.setHex(p[6]??car.accent)));
  });
  mesh.boundingSphere=bounds.getBoundingSphere(new T.Sphere());scene.add(mesh);
  let last=-100;
  function update(time,camera){
    if(camera){
      mesh.visible=bounds.distanceToPoint(camera.position)<175;
      if(!mesh.visible)return;
    }
    if(time-last<.055&&time>=last)return;
    last=time;
    cars.forEach((car,id)=>{
      const rate=car.end?Math.hypot(car.end[0]-car.x,car.end[1]-car.z):car.hi-car.lo,period=9+rate*.60;
      const phase=(time/period+car.seed*.159)%1,leg=phase<.5?phase*2:(1-phase)*2;
      const u=Math.max(0,Math.min(1,(leg-.10)/.80));
      const phaseTravel=u*u*(3-2*u),y=car.lo+(car.hi-car.lo)*phaseTravel,c=Math.cos(car.yaw),s=Math.sin(car.yaw);
      const px=car.end?car.x+(car.end[0]-car.x)*phaseTravel:car.x;
      const pz=car.end?car.z+(car.end[1]-car.z)*phaseTravel:car.z;
      const length=car.end?2.08:1;
      parts.forEach(([x,dy,z,w,h,d],j)=>{
        transform.position.set(px+x*length*c+z*s,y+dy,pz-x*length*s+z*c);
        transform.rotation.y=car.yaw;transform.scale.set(w*length,h,d);transform.updateMatrix();
        mesh.setMatrixAt(id*parts.length+j,transform.matrix);
      });
    });
    mesh.instanceMatrix.needsUpdate=true;
  }
  update(0);
  return {update,draws:1,triangles:parts.length*cars.length*12};
}

// All five approaches converge on the same city's public aerial mobility
// system, but their portals sit on different actual street elevations.
export function buildExchangeLifts(scene,box,solid,lights){
  const cars=[];
  const mats={hull:'midtownSteel',light:'exchangeGridLens'};
  for(const [index,[x,z,yaw,height,bottom,accent]] of [
    [-56.80,-94.72,0,40.32,3.84,ice],[-10.80,-109.20,Math.PI,51.20,4.48,ultraviolet],
    [26.24,-93.92,0,40.32,10.88,ice],[74,-110.08,Math.PI,52.48,3.84,ice],
    [41.60,-137.92,0,40.32,11.84,ultraviolet],[32.80,-162.08,Math.PI,33.92,11.84,ice]
  ].entries()){
    const c=Math.cos(yaw),s=Math.sin(yaw),point=(u,v)=>[x+u*c+v*s,z-u*s+v*c];
    const frame={point,B(mat,tint,u,y,v,w,h,d){const [xx,zz]=point(u,v);
      box(mats[mat],xx,y,zz,w,h,d,tint,yaw,null,true);},
      C(u,y,v,w,h,d){const [xx,zz]=point(u,v);solid(xx,y,zz,w,h,d);}};
    liftBank(frame,cars,{height,bottom,accent,seed:index+1});
    if(index!==2)streetLanding(frame,index%2?-4.48:4.48,accent);
    const [xx,zz]=point(0,2.24);
    const lamp=new T.PointLight(accent,110,19,2);lamp.name='旧交易所 / 高架梯站';
    lamp.position.set(xx,bottom+1.12,zz);lamp.userData.nightPower=110;scene.add(lamp);lights.push(lamp);
  }
  // The two stair soffits at the tea works carry advertising-power rails.
  // The light climbs in the direction of travel and turns the curb below
  // into a landing; the actual treads and clear walking width are untouched.
  for(const [x,z0,dir] of [[49.28,-169.60,1],[68.80,-135.68,-1]]){
    for(let step=1;step<32;step+=2){
      const z=z0+dir*(step+.5)*.48,y=.36+(step+1)*.16;
      for(const side of [-1,1]){
        const xx=x+side*1.68;
        box('midtownSteel',xx,y+.62,z,.48,.64,.88,alloy,0,null,true);
        box('exchangeGridLens',xx+side*.26,y+.64,z,.16,.32,.72,step%8===3?ochre:ice,0,null,true);
      }
      if(step>20&&step%4===3){
        box('exchangeGridLens',x,y-.24,z,2.56,.24,.54,0xbfdcd4,0,null,true);
      }
    }
    const light=new T.PointLight(0x82e4e2,90,14,2);
    light.position.set(x,3.2,z0+dir*8.96);light.userData.nightPower=90;scene.add(light);lights.push(light);
  }
  // A split-window night dispatch crosses the north approach. Its stepped
  // carriage returns into the actual two trading towers at different heights.
  const front=-101.5,back=-150,midX=35.52;
  const roof=27.52,bays=9,pitch=(front-back)/bays;
  for(let i=0;i<bays;i++){
    const z=back+(i+.5)*pitch,shift=(i<3?-1:i>6?1:0)*.64;
    const cy=roof+shift,x=midX+(i<3?-.64:i>6?.64:0);
    box('midtownSteel',x,cy-1.52,z,6.4,1.28,pitch+.04,alloy,0,null,true);
    box('midtownSteel',x,cy+2.40,z,7.04,.96,pitch+.04,enamel,0,null,true);
    solid(x,cy+.40,z,6.40,5.12,pitch+.04);
    for(const h of [-1,1]){
      const side=x+h*3.04;
      box('exchangeGridLens',side,cy+.48,z,.32,2.56,pitch-.64,i===0||i===5?0x637381:0x9ddce4,0,null,true);
      box('midtownSteel',side+h*.24,cy+.32,z-pitch*.35,.64,3.20,.64,enamel,0,null,true);
      box('midtownSteel',side+h*.08,cy-.16,z,.48,.32,pitch,iron,0,null,true);
      if(i%3===1)box('exchangeGridLens',side+h*.16,cy-1.58,z,.64,.32,pitch*.62,ultraviolet,0,null,true);
    }
    for(let j=0;j<3;j++)box('midtownSteel',x+(j-1)*1.28,cy-2.16,z,1.12,.64,pitch-.64,j===1?copper:alloy,0,null,true);
  }
  return cabinFleet(scene,cars);
}

// Put the exterior lift on a face of an existing tower. Keep the upper guide
// seated against the first setback and the street clear under the landing.
export function buildCoreLifts(scene,kit,buildings,lights){
  const cars=[],used=[];
  for(const b of buildings){
    if(b.style==='headquarters'||b.height<30)continue;
    if(used.some(p=>Math.hypot(p.x-b.x,p.z-b.z)<31))continue;
    const hand=used.length%2?1:-1,angle=b.angle+(hand<0?Math.PI:0);
    const depth=b.d/2;
    const x=b.x+Math.sin(angle)*depth,z=b.z+Math.cos(angle)*depth;
    const face=kit.frame(x,z,angle),accent=b.style==='residence'?ultraviolet:b.style==='works'?ochre:ice;
    liftBank(face,cars,{bottom:8.96,height:Math.min(58.88,b.height*.59),accent,seed:used.length+2});
    streetLanding(face,0,accent);
    // Secondary entrance on the return elevation serves people walking a
    // different street. Confine both doorheads to the real podium width.
    if(b.w>14){
      const turn=angle+Math.PI/2,side=kit.frame(b.x+Math.sin(turn)*b.w/2,b.z+Math.cos(turn)*b.w/2,turn);
      streetLanding(side,-Math.min(3.2,b.d/5),accent);
    }
    used.push(b);
  }
  // Lower transfer line under the higher orbital railway. The western bay
  // loads at the dispatch works, the eastern line enters the occupied office.
  // A suspended night shuttle shares the same fleet draw as the vertical cars.
  const west=buildings.find(b=>b.x===22&&b.z===-211);
  const east=buildings.find(b=>Math.abs(b.x-56)<1&&Math.abs(b.z+221)<1);
  if(west&&east){
    const dx=east.x-west.x,dz=east.z-west.z,len=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx);
    const {B,C,point}=kit.frame(west.x,west.z,yaw),railY=9.92;
    B('hull',iron,len/2,railY,0,len,1.12,2.88);
    C(len/2,railY,0,len,1.12,2.88);
    for(let u=.64,i=0;u<len;u+=1.92,i++){
      B('hull',i%3?alloy:enamel,u,railY+.64,0,1.60,.48,3.20);
      B('light',i%3?0x7fdbe8:ultraviolet,u,railY-.62,0,1.28,.16,1.92);
      if(i%3===0){
        for(const side of [-1,1]){
          B('hull',enamel,u,railY+.16,side*1.60,.64,1.28,.64);
          B('light',ultraviolet,u,railY+.18,side*1.98,.40,.80,.24);
        }
      }
    }
    for(const [u,dir] of [[4.48,1],[len-4.48,-1]]){
      const bottom=5.44;
      for(let j=0;j<4;j++){
        const base=u+dir*(j*.96-1.44),rise=Math.min(j,2)*.48;
        B('hull',j%2?enamel:alloy,base,bottom+rise,0,1.12,.64,5.12-j*.32);
        B('light',j%2?0x92dfe7:ultraviolet,base,bottom+rise-.36,0,.80,.24,3.84-j*.32);
        for(const h of [-1,1]){
          B('hull',iron,base,bottom+rise+1.84,h*(2.24-j*.16),.96,3.20,.64);
          B('light',j===1?0xf4cb93:ice,base,bottom+rise+2.0,h*(2.61-j*.16),.64,2.24,.24);
        }
      }
      B('hull',enamel,u,railY+1.12,0,6.72,.64,5.12);
    }
    const [x,z]=point(6.72,0);
    cars.push({x,z,end:point(len-6.72,0),lo:7.76,hi:7.76,seed:3,accent:ultraviolet,yaw});
  }
  const relay=buildings.find(b=>b.x===28&&b.z===-194);
  if(relay){
    const angle=relay.angle+Math.PI,depth=relay.d/2;
    const {B,C,point}=kit.frame(relay.x+Math.sin(angle)*depth,relay.z+Math.cos(angle)*depth,angle);
    // The public approach passes between a pair of cast reader heads.
    // They have a violet optical return at each jamb and a clear middle,
    // so one can still see straight through the building to the other lane.
    for(const h of [-1,1]){
      for(let i=0;i<6;i++){
        const u=h*(4.80-Math.abs(i-2.5)*.32),y=1.36+i*.80;
        B('hull',i%3?alloy:enamel,u,y,1.44,1.44,.80,3.20);
        C(u,y,1.44,1.44,.80,3.20);
        B('light',h<0?0xc975e8:0x55d9ed,u-h*.20,y,3.12,.88,.56,.16);
        B('hull',iron,u+h*.48,y+.16,3.12,.32,.48,.64);
        if(i%2===0)B('light',h<0?0xf2a5d5:0xc0f2df,u-h*.83,y,1.52,.24,.32,2.24);
      }
      const [x,z]=point(h*4.48,2.88),l=new T.PointLight(h<0?0xdf78ef:0x75e4f3,158,17,2);
      l.position.set(x,3.20,z);l.userData.nightPower=158;scene.add(l);lights.push(l);
      B('hull',iron,h*3.36,6.40,1.92,4.48,1.28,3.84);
      // The diffuser sits inside the reader jamb: its nose stops one cell
      // short of the jamb's front instead of sharing that exterior plane.
      B('light',h<0?0xc987dc:ice,h*3.36,5.73,2.24,3.52,.22,.96);
    }
  }
  return cabinFleet(scene,cars);
}
