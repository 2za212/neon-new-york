import * as T from 'three';

/** Eight deliberately composed street-life pockets, with solid occupied props.
 * They attach to the existing city; no new district or road surface is added.
 */
export function addStreetLife(scene,{box,beam,materials,colliders,surface,sign,rand=Math.random}) {
  const stats={groups:8,boxes:0,beams:0,colliders:0,signs:0,lights:0,triangles:0,independentDrawCalls:0};
  const before=colliders.length,lights=[],steamSources=[],groups=[];
  const B=(...a)=>{stats.boxes++;box(...a);};
  const L=(...a)=>{stats.beams++;beam(...a);};
  const C=(x,y,z,w,h,d,id='prop')=>{const b=new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2));b.userData={streetLife:id};colliders.push(b);};
  function mat(name,base,options){if(!materials[name]){const m=base.clone();Object.assign(m,options);m.name='NYC street life / '+name;m.userData={...base.userData};materials[name]=m;}return materials[name];}
  mat('lifeCanvas',materials.trim,{color:new T.Color(0x4f736e),roughness:.96});
  mat('lifePaper',materials.trim,{color:new T.Color(0xa58b67),roughness:1});
  mat('lifeCream',materials.white,{color:new T.Color(0xb9b499),roughness:.87});
  mat('lifeBag',materials.rubber,{color:new T.Color(0x26352e),roughness:.98});
  mat('lifeBread',materials.trim,{color:new T.Color(0xad8652),roughness:.94});
  const warmEmitter=mat('lifeWarmEmitter',materials.lamp,{color:new T.Color(0xbca076),emissive:new T.Color(0xffb25a),emissiveIntensity:.45,roughness:.62});
  const tint=(a=.12)=>{const c=1-a*.5+rand()*a;return new T.Color(c,c,c);};
  function front(x,z,rot=0,base=.36){
    const c=Math.cos(rot),s=Math.sin(rot),P=(u,y,v)=>[x+u*c+v*s,base+y,z-u*s+v*c];
    return {P,B:(mat,u,y,v,w,h,d,color=0xffffff,localRot=0)=>B(mat,...P(u,y,v),w,h,d,color,rot+localRot),
      L:(mat,a,b,size=.04,color=0xffffff)=>L(mat,P(...a),P(...b),size,size,color),
      C:(u,y,v,w,h,d,id)=>{const p=P(u,y,v);C(...p,Math.abs(c)*w+Math.abs(s)*d,h,Math.abs(s)*w+Math.abs(c)*d,id);},
      sign:(u,y,v,w,h,title,subtitle,color)=>{if(sign){const display=sign(...P(u,y,v),w,h,title,subtitle,color,rot);if(display){display.material.color.setHex(0x222222);display.material.roughness=1;display.material.emissiveIntensity=.72;}stats.signs++;}}};
  }
  function cardboard(f,u,v,w=.48,h=.40,d=.48,stack=1){
    for(let j=0;j<stack;j++){
      const y=h/2+j*h;
      f.B('lifePaper',u,y,v,w-.015*j,h-.018,d-.01*j,tint(.15));
      f.B('metal',u,y,v+d/2+.012,w*.7,.026,.018,0x7e8a7d);
      f.B('lifeCream',u-w*.19,y+h*.14,v+d/2+.025,w*.29,h*.23,.012,0xb8b9a0);
      f.B('rubber',u,y+h/2+.007,v,.032,.012,d,0x899282);
    }
    f.C(u,h*stack/2,v,w,h*stack,d,'parcel');
  }
  function crate(f,u,v,w=.62,d=.48){
    f.B('wood',u,.20,v,w,.40,d,0xb8a786);
    for(let i=0;i<4;i++)for(const e of [-1,1])f.B('wood',u,.07+i*.09,v+e*d/2,w,.055,.035,0x9f9c7a);
    for(const e of [-1,1])f.B('wood',u+e*(w/2-.055),.21,v,.08,.45,d+.04,0xb0a47e);
    f.C(u,.20,v,w,.4,d,'food-crate');
    for(let i=0;i<9;i++){
      const xx=u-w*.30+(i%3)*w*.30,zz=v-d*.28+Math.floor(i/3)*d*.27;
      f.B(i%3?'leaf':'lifeBread',xx,.46+rand()*.035,zz,.10,.10,.10,tint(.1));
    }
  }
  function cup(f,u,y,v){
    f.B('lifeCream',u,y,v,.083,.14,.083,0xd1c7ab);f.B('metal',u,y+.08,v,.096,.025,.096,0x8d9c8e);f.B('wood',u+.01,y+.12,v,.011,.09,.011,0xae9b79);
  }
  function warmLight(x,y,z,power=32,reach=8){const light=new T.PointLight(0xffc28c,power,reach,2);light.position.set(x,y,z);light.castShadow=false;light.userData.nightPower=power;scene.add(light);lights.push(light);}

  function deliCart(x,z,rot=0,variant=0){
    const f=front(x,z,rot),paint=variant?'lifeCream':'lifeCanvas';
    f.B('metal',0,.17,0,3.10,.20,1.42,0x82978b);
    for(const u of [-1.19,1.19])for(const v of [-.52,.52]){f.B('rubber',u,.18,v,.25,.36,.18);f.B('metal',u,.18,v+.10,.12,.17,.035,0x91a58f);}
    f.B(paint,0,.70,0,2.96,.94,1.26,tint(.09));
    f.B('metal',0,1.20,.14,3.14,.12,1.72,0x9caaa0);
    f.B('metal',0,.38,.67,3.00,.09,.10,0x7c9289);
    for(let u=-1.38;u<1.4;u+=.23)f.B('metal',u,.80,.644,.055,.53,.035,0x7c9388);
    // The front stays open: stacked food trays and a grill are visible at waist
    // height, instead of hiding the whole stall behind an opaque black pane.
    f.B('metal',-.74,1.29,.40,1.09,.08,.66,0x80958b);
    for(let i=0;i<8;i++)f.B('rubber',-1.18+i*.126,1.34,.4,.035,.025,.57,0x8e9e90);
    for(let i=0;i<5;i++){
      f.B('lifeBread',-1.05+i*.15,1.39,.37,.115,.07,.34,0xc3a374);
      f.B('lifeBread',-1.04+i*.15,1.45,.37,.10,.035,.25,0x9e7e56);
    }
    for(let tray=0;tray<3;tray++){
      const u=.02+tray*.41;f.B('metal',u,1.31,.41,.36,.08,.55,0xa5b09f);
      for(let j=0;j<7;j++)f.B(tray===1?'lifeBread':tray===2?'leaf':'lifeCream',u+(j%3-1)*.085,1.39+Math.floor(j/3)*.043,.22+(j%2)*.19,.07,.06,.08,tint(.12));
    }
    f.B('metal',1.25,1.39,.40,.16,.30,.16,0xa3b3a1);f.B('metal',1.25,1.57,.40,.20,.05,.20,0xb8bba6);
    // Side/back menu windows, serving frame and fine corner supports.
    f.B('glass',0,1.94,-.59,2.73,1.17,.05,0x97b2a6);
    for(const u of [-1.43,1.43])for(const v of [-.58,.65])f.B('metal',u,1.52,v,.075,2.52,.075,0xa0b2a1);
    f.B('metal',0,2.51,.65,2.96,.13,.11,0x9cae9d);
    f.B('lifeCanvas',0,2.69,.08,3.25,.17,1.73,variant?0xaba899:0xb2c2ac);
    // A stepped fabric visor, seam rails and a scalloped rectangular valance.
    for(let i=0;i<4;i++)f.B('lifeCanvas',0,2.68-i*.045,.92+i*.16,3.26,.08,.20,variant?0xb6a98c:0x9db5a0);
    for(let u=-1.55;u<1.6;u+=.27){f.B(u>.1&&u<.9?'lifeCream':'lifeCanvas',u,2.46,1.44,.24,.24,.055,0xaab49b);f.B('metal',u,2.78,.06,.018,.03,1.73,0x97ab9a);}
    for(const u of [-.78,.78]){
      f.B('metal',u,2.42,.30,.024,.35,.024,0x94a894);f.B('metal',u,2.24,.30,.27,.10,.27,0x809787);f.B('lifeWarmEmitter',u,2.17,.30,.16,.07,.16,0xc2b48f);
    }
    f.B('metal',1.03,2.92,-.31,.27,.49,.30,0x91a193);f.B('metal',1.03,3.19,-.31,.40,.09,.40,0x9bab9b);
    f.sign(0,2.10,.75,2.30,.53,variant?'FRESH / SOUP':'SIDEWALK DELI',variant?'COFFEE  /  OPEN LATE':'HOT FOOD  /  24 H','#e3bd87');
    f.B('glass',-1.51,1.79,.03,.035,.70,.87,0x91ad9e);
    for(let j=0;j<5;j++)f.B('lifeCream',-1.536,1.53+j*.10,.03,.012,.025,.58,0xacae93);
    crate(f,-1.95,.05,.58,.61);cardboard(f,1.98,-.1,.48,.39,.51,2);
    f.B('metal',1.62,.87,-.45,.13,1.54,.13,0x96ad9c);f.B('metal',1.62,1.66,-.45,.42,.12,.42,0x84998b);
    f.C(0,.73,0,3.16,1.22,1.44,'deli-cart');
    f.C(0,2.70,.09,3.25,.19,1.78,'cart-roof');
    f.C(0,2.54,1.18,3.26,.30,.65,'cart-visor');
    for(const u of [-1.43,1.43])f.C(u,1.55,.64,.11,2.5,.11,'cart-post');
    const steam=f.P(1.03,3.43,-.31);steamSources.push({position:new T.Vector3(...steam),width:.28,height:.8,kind:'food-cart'});
    // Move the practical light forward under the visor: the old source sat
    // only ~.31m from its emissive menu and washed the lettering to white.
    warmLight(...f.P(0,2.25,1.40),variant?18:16,8);
    return f;
  }
  deliCart(10.5,20.2,-Math.PI/2,0);
  deliCart(25.5,-76.0,0,1);
  groups.push({id:'spawn_deli',minX:9.0,maxX:11.33,minZ:17.9,maxZ:22.5},{id:'midtown_soup',minX:23.1,maxX:27.9,minZ:-77.0,maxZ:-74.2});

  function chair(f,u,v,rot=0){
    const c=Math.cos(rot),s=Math.sin(rot),P=(x,y,z)=>[u+x*c+z*s,y,v-x*s+z*c];
    for(const e of [-1,1])for(const q of [-1,1])f.B('metal',...P(e*.22,.23,q*.22),.045,.46,.045,0x879a8c,rot);
    for(let i=0;i<4;i++)f.B('wood',...P(0,.47,-.20+i*.13),.54,.07,.10,0xb9aa8b,rot);
    for(const e of [-1,1])f.B('metal',...P(e*.23,.77,-.25),.04,.66,.04,0x879a8c,rot);
    for(let i=0;i<3;i++)f.B('wood',...P(0,.65+i*.13,-.26),.56,.085,.07,0xa9a085,rot);
    f.C(u,.52,v,.60,1.02,.60,'cafe-chair');
  }
  function table(f,u,v){
    f.B('metal',u,.47,v,.09,.93,.09,0x839a8b);f.B('metal',u,.06,v,.59,.09,.59,0x8b9e8d);
    for(let i=0;i<5;i++)f.B('wood',u,.96,v-.27+i*.135,.74,.075,.115,0xc0b091);
    f.C(u,.95,v,.77,.09,.73,'cafe-table');cup(f,u-.19,1.08,v);cup(f,u+.19,1.08,v-.12);
    f.B('lifePaper',u+.05,1.01,v+.15,.29,.015,.19,0xb6b69c);f.B('rubber',u+.02,1.025,v+.15,.20,.006,.025,0x8d9c87);
  }
  function rainShelter(f,width=3.5,depth=2.05,posts=true){
    for(const e of [-1,1]){
      if(posts){f.B('metal',e*(width/2-.14),1.43,-.72,.07,2.86,.07,0x8fa695);f.C(e*(width/2-.14),1.43,-.72,.10,2.86,.10,'shelter-post');}
      f.L('metal',[e*(width/2-.14),2.36,-.72],[e*(width/2-.14),2.78,.86],.06,0x8ca392);
    }
    for(let row=0;row<5;row++)f.B('lifeCanvas',0,2.81-row*.024,-.68+row*.39,width,.10,.44,0x9eb6a3);
    f.B('metal',0,2.90,.09,width+.1,.075,depth,0x7f9a8c);
    f.B('lifeCanvas',0,2.60,.99,width,.25,.055,0xa5baa2);
    for(let u=-width/2+.1;u<width/2;u+=.26)f.B('lifeCream',u,2.60,1.023,.10,.23,.014,0xa6af93);
    f.B('lifeWarmEmitter',0,2.62,.10,.36,.06,.36,0xb6ad84);
    f.C(0,2.77,.10,width,.16,depth,'rain-shelter-roof');
  }
  // Wall cafe occupies the facade recess outside the old 4.1m sidewalk.
  B('paver',-11.1,.27,-14.7,2.2,.18,3.8);surface(-12.2,-10.0,-16.6,-12.8,.36);
  const oldCafe=front(-11.4,-14.7,Math.PI/2);rainShelter(oldCafe,3.3,2.05,false);table(oldCafe,0,.61);chair(oldCafe,-.86,.57,Math.PI/2);chair(oldCafe,.86,.57,-Math.PI/2);
  oldCafe.B('wood',-1.43,.62,-.08,.29,1.16,.38,0xb0a17b);oldCafe.B('lifePaper',-1.43,1.23,-.08,.31,.08,.40,0xc8bea2);oldCafe.C(-1.43,.63,-.08,.32,1.2,.40,'newspaper-crate');
  groups.push({id:'old_wall_cafe',minX:-12.25,maxX:-10,minZ:-16.5,maxZ:-12.7});
  // Plaza-side rain shelter and a pair of small tables form a readable rest room.
  const plazaCafe=front(24.3,-135.1,0);rainShelter(plazaCafe,3.8,2.10,true);table(plazaCafe,-.83,.05);table(plazaCafe,.86,.05);chair(plazaCafe,-.85,.93,Math.PI);chair(plazaCafe,.85,.93,Math.PI);
  plazaCafe.B('metal',-1.66,.60,.58,.20,1.18,.20,0x8da693);plazaCafe.B('lifeWarmEmitter',-1.66,1.22,.58,.25,.12,.25,0xa5b18d);
  warmLight(24.3,2.95,-134.8,14,8);groups.push({id:'plaza_rain_cafe',minX:22.1,maxX:26.5,minZ:-137,maxZ:-133.8});

  // Delivery lockers and four docked bicycles share one compact forecourt bay.
  const delivery=front(-21.5,-74.65,0);
  delivery.B('metal',0,.16,0,5.3,.16,1.52,0x8a9f90);
  for(let i=0;i<4;i++){
    const u=-1.86+i*1.18;delivery.B('metal',u,.53,.42,.13,.86,.16,0x849e90);delivery.B('cyan',u,.98,.47,.11,.06,.035,0x9abda9);
    for(const v of [-.48,.57]){
      const radius=.31;
      for(let k=0;k<12;k++){
        const a=k*Math.PI/6,b=(k+1)*Math.PI/6;
        delivery.L('rubber',[u,.39+Math.cos(a)*radius,v+Math.sin(a)*radius],[u,.39+Math.cos(b)*radius,v+Math.sin(b)*radius],.045,0x95a18c);
        if(k%3===0)delivery.L('metal',[u,.39,v],[u,.39+Math.cos(a)*radius,v+Math.sin(a)*radius],.014,0x9eada0);
      }
      delivery.B('metal',u,.39,v,.12,.09,.09,0x9aafa0);
    }
    delivery.L('lifeCanvas',[u,.39,-.48],[u,.74,.05],.065,0xa9b6a0);delivery.L('lifeCanvas',[u,.74,.05],[u,.39,.57],.065,0xa9b6a0);delivery.L('lifeCanvas',[u,.39,-.48],[u,.39,.57],.065,0xa9b6a0);
    delivery.L('metal',[u,.44,.55],[u,1.10,.61],.045,0x96ad9c);delivery.B('metal',u,1.11,.61,.46,.04,.055,0x92aa96);
    delivery.B('rubber',u,.86,-.04,.25,.07,.30,0x9aa68d);delivery.B('metal',u,.71,-.04,.045,.31,.045,0x91a28d);
  }
  delivery.C(0,.66,.05,5.22,1.29,1.59,'docked-bicycles');
  delivery.B('lifeCanvas',3.14,.99,-.1,1.13,1.91,.62,0xb7c0a5);
  for(let i=0;i<3;i++)for(let row=0;row<4;row++){
    delivery.B('metal',2.78+i*.36,.31+row*.43,.227,.31,.38,.04,0x96a98e);delivery.B('cyan',2.90+i*.36,.32+row*.43,.255,.033,.025,.012,0x9fbda3);
  }
  delivery.C(3.14,.99,-.1,1.13,1.91,.62,'delivery-locker');
  cardboard(delivery,-3.15,-.1,.54,.43,.58,2);cardboard(delivery,-2.85,.63,.43,.34,.43,1);
  delivery.sign(.35,2.20,.30,3.65,.62,'CITYLINK / PICKUP','DELIVERIES  /  CYCLE DOCK','#9dc7bd');
  delivery.B('metal',.35,1.40,.10,.09,1.54,.09,0x8aa595);groups.push({id:'delivery_cycles',minX:-25.4,maxX:-17.7,minZ:-75.6,maxZ:-73.2});

  function refuseBag(f,u,v,size=.48){
    for(const [scale,dy,h]of [[.78,.14,.24],[1,.32,.21],[.78,.49,.15],[.32,.60,.08]])f.B('lifeBag',u,.03+dy,v,size*scale,h,size*scale,tint(.16));
    f.B('metal',u,.66,v,.11,.035,.11,0x718d79);f.C(u,.36,v,size,.68,size,'refuse-bag');
  }
  function reel(f,u,v){
    for(const out of [v-.12,v+.12])for(let k=0;k<12;k++){
      const a=k*Math.PI/6,b=(k+1)*Math.PI/6;
      f.L('wood',[u+Math.cos(a)*.43,.57+Math.sin(a)*.43,out],[u+Math.cos(b)*.43,.57+Math.sin(b)*.43,out],.09,0xa9a07e);
      if(k%3===0)f.L('metal',[u,.57,out],[u+Math.cos(a)*.39,.57+Math.sin(a)*.39,out],.04,0x8aa28b);
    }
    for(let j=0;j<4;j++)for(let k=0;k<12;k++){
      const a=k*Math.PI/6,b=(k+1)*Math.PI/6;
      f.L('rubber',[u+Math.cos(a)*.30,.57+Math.sin(a)*.30,v-.09+j*.06],[u+Math.cos(b)*.30,.57+Math.sin(b)*.30,v-.09+j*.06],.06,0x81967f);
    }
    f.B('metal',u,.57,v,.13,.13,.50,0x8fa88f);f.B('metal',u,.08,v,.72,.12,.56,0x829c85);f.C(u,.52,v,.96,.98,.58,'cable-reel');
  }
  function maintenance(x,z,rot=0,variant=0){
    const f=front(x,z,rot);reel(f,-.46,.05);cardboard(f,.65,.06,.46,.43,.47,2);refuseBag(f,1.14,.14,.42);refuseBag(f,-1.02,.10,.39);
    f.B('metal',.67,1.50,-.24,.52,1.02,.32,0x819884);f.B('lifeCream',.67,1.53,-.06,.38,.68,.025,0xb2b49a);
    // Authored graphic poster: paper border, service diagram and small tabs.
    f.B('lifePaper',-.42,1.86,-.32,.64,.82,.025,0xb6b39a);
    for(let i=0;i<4;i++)f.B('metal',-.58+i*.11,1.95,-.301,.055,.32,.012,0x6f8f87);
    f.B('cyan',-.42,2.14,-.29,.42,.035,.015,0x9cbea9);f.B('metal',-.42,1.64,-.29,.45,.045,.015,0x7f9687);
    for(const u of [-1.38,1.52]){f.B('metal',u,.40,.28,.14,.78,.14,0x8da587);f.B('yellow',u,.69,.28,.15,.10,.15,0x9d9c7c);f.C(u,.40,.28,.17,.78,.17,'service-bollard');}
    // Boxed wall service pipe turns around a bracket rather than floating.
    f.B('metal',0,1.78,-.22,.12,1.85,.16,0x829b8a);f.B('metal',.26,2.68,-.22,.64,.13,.17,0x91a68d);
    f.B(variant?'lifeWarmEmitter':'cyan',.45,2.68,-.12,.12,.06,.025,0x92b39b);
    return f;
  }
  B('paver',11.4,.27,-14.6,1.6,.18,3.5);surface(10.6,12.2,-16.35,-12.85,.36);
  maintenance(11.6,-14.6,-Math.PI/2,0);
  maintenance(-10.85,20.9,Math.PI/2,1);
  steamSources.push({position:new T.Vector3(11.72,3.22,-14.15),width:.20,height:.55,kind:'service-relief'});
  groups.push({id:'east_repair_pocket',minX:10.65,maxX:12.2,minZ:-16.2,maxZ:-12.8},{id:'west_repair_pocket',minX:-11.25,maxX:-10.0,minZ:19.3,maxZ:22.5});

  // High-line micro stop occupies only the two narrow edge strips. The central
  // z[-30,-27.2] route, stair paths and all greenway landmarks remain untouched.
  const bridge=front(-96.8,-30.38,0,6.51);
  bridge.B('metal',0,.25,0,1.90,.09,.37,0x8b9f8b);
  for(let i=0;i<3;i++)bridge.B('wood',0,.47,-.14+i*.14,2.03,.08,.11,0xb7ab88);
  for(const u of [-.64,.64]){bridge.B('metal',u,.23,0,.08,.46,.31,0x8aa28a);bridge.C(u,.23,0,.10,.46,.33,'bridge-bench-leg');}
  for(let i=0;i<3;i++)bridge.B('wood',0,.65+i*.13,-.22,2.03,.09,.07,0xa99e7d);
  bridge.C(0,.54,0,2.05,1.0,.44,'bridge-bench');
  const drinks=front(-94.7,-26.78,Math.PI,6.51);
  drinks.B('metal',0,.92,0,.74,1.80,.38,0x88a38d);drinks.B('glass',-.08,1.11,.205,.48,.90,.025,0xb6c7b0);
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
    drinks.B(col===1?'lifeWarmEmitter':'cyan',-.22+col*.135,.79+row*.24,.23,.075,.15,.055,col===1?0x787f58:0x668c7b);
    drinks.B('metal',-.22+col*.135,.885+row*.24,.23,.045,.035,.055,0xa1b29a);
  }
  drinks.B('metal',.24,1.05,.22,.10,.44,.035,0x718e7b);drinks.B('cyan',.24,1.21,.245,.05,.065,.015,0x8fbea3);drinks.B('rubber',0,.42,.22,.40,.18,.04,0x81957d);
  drinks.B('metal',0,1.86,.01,.84,.10,.44,0x97ac92);drinks.C(0,.92,0,.78,1.84,.42,'bridge-drinks');
  const rack=front(-94.95,-30.43,0,6.51);
  for(const u of [-.47,.47])rack.B('metal',u,.55,0,.045,1.08,.045,0x8da68a);
  for(const y of [.28,.72,1.08])rack.B('wood',0,y,0,1.0,.06,.30,0xa6a381);
  for(let i=0;i<5;i++){rack.B('lifePaper',-.37+i*.18,.81,0,.14,.16,.20,0x839b74);rack.B('leaf',-.37+i*.18,.96,0,.16,.17,.16,tint(.14));}
  rack.C(0,.55,0,1.04,1.1,.34,'bridge-plant-rack');
  groups.push({id:'greenway_micro_stop',minX:-97.85,maxX:-94.25,minZ:-30.65,maxZ:-26.55,clearLane:{minZ:-30,maxZ:-27.2}});

  function setNight(night){for(const light of lights)light.intensity=light.userData.nightPower*(night?1:.12);warmEmitter.emissiveIntensity=night?.45:.19;}
  function update(dt,time){}
  stats.colliders=colliders.length-before;stats.lights=lights.length;stats.triangles=(stats.boxes+stats.beams)*12;
  stats.groupBounds=groups;stats.steamSources=steamSources.map(s=>({...s,position:s.position.toArray()}));
  stats.geometryScope='All pieces join the existing shared architecture batch; injected signs are counted by parent signMeshes.';
  const steamVents=steamSources.map(s=>[s.position.x,s.position.z,s.kind==='food-cart'?'#d7c0a0':'#99b7b3']);
  setNight(true);
  return {stats,setNight,update,lights,steamVents,steamSources,groups};
}
