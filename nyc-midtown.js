import * as T from 'three';

/** Midtown's walkable city fabric and six fully modelled tower masses.
 * Add to the shared architectural batch. All coordinates / collider sizes are m.
 */
export function addMidtown(scene,{box,beam,materials,colliders,surface,sign,tree,lamp,bench,planter,rand=Math.random}) {
  const ROAD=.18,SIDE=.36;
  const bounds={minX:-64,maxX:84,minZ:-180,maxZ:-52};
  const stats={towers:0,podiums:0,boxes:0,beams:0,trees:0,treeBoxes:0,colliders:0,surfaces:0,signs:0,pointLights:0,independentDrawCalls:0,triangles:0};
  const before=colliders.length,lights=[],towerFootprints=[];
  const B=(...a)=>{stats.boxes++;box(...a);};
  const L=(...a)=>{stats.beams++;beam(...a);};
  const S=(x1,x2,z1,z2,y=SIDE)=>{surface(x1,x2,z1,z2,y);stats.surfaces++;};
  const C=(x,y,z,w,h,d)=>colliders.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));
  const tint=(amount=.1)=>{const v=1-amount*.5+rand()*amount;return new T.Color(v,v,v);};
  const win=()=>{const r=rand();return r<.16?'warmWindow':r<.24?'coolWindow':'glass';};
  const label=(...a)=>{if(sign){sign(...a);stats.signs++;}};
  function material(key,base,options={}){if(materials[key])return materials[key];const m=base.clone();Object.assign(m,options);m.name='NYC Midtown / '+key;m.userData={...base.userData};materials[key]=m;return m;}
  const stone=material('midtownLimestone',materials.stone,{color:new T.Color(0xa3ada7),roughness:.87});
  material('midtownBronze',materials.metal,{color:new T.Color(0x847e62),roughness:.57,metalness:.62});
  material('midtownSteel',materials.metal,{color:new T.Color(0x8a9d9f),roughness:.48,metalness:.58});
  // One shared physical-scale curtain-wall map. Stepped masses, deep ribs and
  // spandrel ledges are real geometry; the map supplies only the pane interiors.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const g=canvas.getContext('2d');
  g.fillStyle='#182a35';g.fillRect(0,0,512,512);
  for(let row=0;row<2;row++)for(let col=0;col<4;col++){
    const x=col*128,y=row*256,t=(row*3+col*7)%5;
    g.fillStyle=['#2c4550','#253e4b','#354f58','#29434f','#314b56'][t];g.fillRect(x+7,y+18,114,208);
    g.fillStyle='rgba(137,164,169,.12)';g.fillRect(x+12,y+22,13,197);
    g.fillStyle='rgba(7,17,24,.58)';g.fillRect(x+7,y+18,114,16);g.fillRect(x+7,y+210,114,16);
    // Recessed office floors read as occupied even when viewed from the side.
    if(t%2===0){
      g.fillStyle=t===4?'#a79473':'#748d91';g.fillRect(x+16,y+68,96,112);
      g.fillStyle='#404b50';g.fillRect(x+20,y+140,88,8);
      g.fillRect(x+29,y+128,22,12);g.fillRect(x+69,y+123,17,16);
      g.fillStyle='#b7aea2';g.fillRect(x+24,y+75,58,3);
      for(let k=0;k<4;k++){g.fillStyle='rgba(16,28,34,.34)';g.fillRect(x+8+k*27,y+20,5,200);}
    }
    g.fillStyle='#50656b';g.fillRect(x,y,3,256);g.fillRect(x,y+235,128,3);
  }
  const facadeMap=new T.CanvasTexture(canvas);facadeMap.colorSpace=T.SRGBColorSpace;facadeMap.wrapS=facadeMap.wrapT=T.RepeatWrapping;facadeMap.anisotropy=4;facadeMap.magFilter=T.LinearFilter;
  const curtain=material('midtownCurtain',materials.glass,{map:facadeMap,color:new T.Color(0xffffff),roughness:.32,metalness:.38,envMapIntensity:.55});curtain.userData.textureMeters=6.4;curtain.userData.unitUV=false;

  B('asphalt',10,.01,-116,148,.34,128);
  // Only designed streets / terraces are declared walkable. Building shells
  // retain explicit collisions rather than a single district-sized blocker.
  const xRoads=[{z:-64,x1:-36,x2:58,w:10.4},{z:-86,x1:-64,x2:84,w:11.2},{z:-118,x1:-64,x2:84,w:11.2},{z:-175,x1:-36,x2:58,w:8}];
  const zRoads=[{x:0,z1:-124,z2:-52,w:12.8,s:3.8},{x:-36,z1:-180,z2:-52,w:9.6,s:2.8},{x:58,z1:-180,z2:-58.8,w:9.6,s:2.8}];
  function segments(a,b,cuts){let cursor=a;const out=[];for(const [lo,hi]of cuts.sort((p,q)=>p[0]-q[0])){if(hi<=cursor||lo>=b)continue;if(lo>cursor)out.push([cursor,Math.min(lo,b)]);cursor=Math.max(cursor,hi);}if(cursor<b)out.push([cursor,b]);return out;}
  for(const r of zRoads){
    S(r.x-r.w/2,r.x+r.w/2,r.z1,r.z2,ROAD);
    const cuts=xRoads.filter(c=>r.x>=c.x1-2&&r.x<=c.x2+2).map(c=>[c.z-c.w/2,c.z+c.w/2]);
    for(const [a,b]of segments(r.z1,r.z2,cuts))for(const e of [-1,1]){
      const x=r.x+e*(r.w/2+r.s/2);B('concrete',x,.27,(a+b)/2,r.s,.18,b-a);S(x-r.s/2,x+r.s/2,a,b);
      for(let z=a+.25;z<b;z+=.5)B('trim',r.x+e*(r.w/2+.10),.285,z,.25,.21,.48,tint(.12));
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
    stats.podiums++;C(x,SIDE+h/2,z,w,h,d);
    B('midtownLimestone',x,SIDE+h/2,z,w,h,d,tint(.08));
    B('metal',x,.48,z,w+.12,.22,d+.12,0x5d7269);
    for(let ledge=0;ledge<3;ledge++)B('midtownLimestone',x,SIDE+h-.10+ledge*.18,z,w+.18+ledge*.16,.18,d+.18+ledge*.16,0xa4b1a4);
    const f=frame(x,z,w,d,h);
    for(const rot of [0,Math.PI/2,Math.PI,-Math.PI/2]){
      const side=f.face(rot),cols=Math.max(3,Math.floor(side.width/3.0)),pitch=side.width/cols;
      for(let i=0;i<cols;i++){
        const u=-side.width/2+pitch*(i+.5);
        side.B('metal',u,2.35,.14,pitch-.24,3.9,.20,0x6f8583);
        side.B(i%4===1?'warmWindow':'glass',u,2.35,.27,pitch-.45,3.60,.05,0xa8b8b1);
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
        side.B('midtownLimestone',u-pitch*.46,2.6,.28,.26,4.8,.49,0xb1baac);
        side.B('midtownLimestone',u,4.68,.30,pitch-.12,.22,.56,0xa1ae9f);
        if(h>11)for(let yy=7;yy<h-1;yy+=3.2){side.B('metal',u,yy,.12,pitch-.36,2.4,.16,0x5f787c);side.B(win(),u,yy,.23,pitch-.58,2.18,.05,0x97aba9);side.B('midtownLimestone',u,yy-1.35,.32,pitch-.1,.14,.52,0xa0ad9d);}
      }
      // Recessed lobby canopy and projected coffered edge, kept above heads.
      side.B('midtownSteel',0,4.43,1.0,Math.min(side.width*.62,12),.23,2.6,0x8faaa7);
      for(let u=-Math.min(side.width*.28,5.5);u<=Math.min(side.width*.28,5.5);u+=.7)side.B('rubber',u,4.29,1.04,.11,.045,2.35,0x97aaa2);
      side.B(warm?'lamp':'cyan',0,4.25,2.16,Math.min(side.width*.54,10),.045,.08,0xaac0b1);
    }
    if(title)label(x,5.7,z+d/2+.58,Math.min(w*.65,12),.72,title,'MIDTOWN / NEW YORK',warm?'#d5bd97':'#8ac8cf');
    return {id,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,height:h};
  }
  function tower(id,x,z,w,d,base,height,style='glass',tierPlan=[[1,.62],[.84,.25],[.62,.13]]){
    stats.towers++;let y=base;
    towerFootprints.push({id,x,z,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,height:base+height});
    C(x,SIDE+(base+height)/2,z,w,base+height,d);
    for(let tier=0;tier<tierPlan.length;tier++){
      const [scale,fraction]=tierPlan[tier],ww=w*scale,dd=d*scale,hh=height*fraction;
      const mat=style==='terracotta'?'brickBrown':style==='deco'||style==='fin'?'midtownLimestone':'midtownCurtain';
      B(mat,x,SIDE+y+hh/2,z,ww,hh,dd,style==='bronze'?0xa4a18c:0xa1b0b0);
      B(style==='bronze'?'midtownBronze':'midtownSteel',x,SIDE+y+hh+.12,z,ww+.4,.24,dd+.4,0x98aaa3);
      const f=frame(x,z,ww,dd,hh,SIDE+y),pitch=style==='deco'?1.55:style==='terracotta'?2.25:2.1;
      for(const rot of [0,Math.PI/2,Math.PI,-Math.PI/2]){
        const face=f.face(rot),cols=Math.max(2,Math.floor(face.width/pitch)),gap=face.width/cols;
        const ribMat=style==='bronze'?'midtownBronze':style==='glass'?'midtownSteel':'midtownLimestone';
        for(let i=0;i<=cols;i++){
          const u=-face.width/2+i*gap;
          face.B(ribMat,u,hh/2,.12,style==='deco'?.22:.14,hh,.34,0x8b9f9e);
        }
        if(style==='deco'||style==='fin'||style==='terracotta'){
          for(let row=0;row<Math.floor(hh/3.2);row++)for(let i=0;i<cols;i++){
            const u=-face.width/2+(i+.5)*gap,yy=1.55+row*3.2;
            face.B('metal',u,yy,.075,gap-.30,2.50,.11,0x516e78);
            face.B(win(),u,yy,.15,gap-.48,2.25,.035,0x99adae);
            if(style==='deco')face.B('midtownLimestone',u,yy-1.36,.22,gap-.16,.12,.39,0x8b9f9c);
          }
        }else{
          for(let row=0;row<Math.floor(hh/3.2);row++)for(let i=0;i<cols;i++){
            if((row*7+i*3+tier)%13>2)continue;
            face.B((row+i)%3?'warmWindow':'coolWindow',-face.width/2+(i+.5)*gap,1.52+row*3.2,.05,gap-.38,2.14,.035,0x90a6a5);
          }
        }
        // A few equipment / optical channels sit beside the windows.
        if(tier===0&&style!=='terracotta'){
          face.B('metal',face.width*.34,hh*.52,.27,.24,hh*.68,.28,0x718c8d);
          for(let q=0;q<3;q++)face.B(style==='bronze'?'lamp':'cyan',face.width*.34,hh*(.31+q*.17),.43,.16,hh*.105,.04,0xc2ece4);
        }
      }
      for(let yy=3.2;yy<hh;yy+=3.2)B(style==='bronze'?'midtownBronze':'midtownSteel',x,SIDE+y+yy,z,ww+.15,.10,dd+.15,0x81999a);
      // Deep corner returns make each setback read in an orbiting camera.
      for(const e of [-1,1])for(const q of [-1,1])B(style==='deco'?'midtownLimestone':'midtownSteel',x+e*(ww/2-.08),SIDE+y+hh/2,z+q*(dd/2-.08),.38,hh,.38,0x8a9f9e);
      y+=hh;
    }
    for(let step=0;step<3;step++)B('midtownSteel',x,SIDE+y+.25+step*.25,z,w*tierPlan.at(-1)[0]+.35-step*.10,.25,d*tierPlan.at(-1)[0]+.35-step*.10,0x9cafaa);
    for(const e of [-1,1]){
      B('metal',x+e*w*.13,SIDE+y+1.1,z,1.0,1.1,1.4,0x81968d);
      B('metal',x+e*w*.13,SIDE+y+1.72,z,1.25,.12,1.65,0x9aaba1);
    }
    if(base===0){
      // Adult-scale recessed lobby portals ground the three unskirted towers.
      const entry=frame(x,z,w,d,height).face(0);
      entry.B('metal',0,1.98,.25,3.18,3.32,.22,0x5a7574);
      entry.B('glass',0,1.98,.385,2.86,3.03,.045,0xa1b4ac);
      entry.B('metal',0,1.98,.425,.09,3.07,.05,0x9daea1);
      for(const e of [-1,1])entry.B('midtownLimestone',e*1.76,2.05,.32,.30,3.6,.56,0xa6b1a2);
      entry.B('midtownLimestone',0,3.83,.34,3.85,.25,.65,0xa0afa0);
      entry.B('midtownSteel',0,3.94,1.0,5.3,.19,2.3,0x8da8a2);
      entry.B('lamp',0,3.82,1.95,2.8,.045,.09,0xa1b198);
    }
    if(style==='deco'){
      for(let i=0;i<5;i++)B('midtownLimestone',x,SIDE+y+1.5+i*1.3,z,2.5-i*.36,1.4,2.5-i*.36,0x9eaea7);
      B('midtownBronze',x,SIDE+y+10.0,z,.25,6.0,.25,0xb5b59a);
      B('lamp',x,SIDE+y+13.0,z,.17,.45,.17,0x9ba78e);
    }else{B('metal',x,SIDE+y+3.2,z,.13,5.2,.13,0x8caaa5);B('cyan',x,SIDE+y+5.85,z,.18,.16,.18,0x8caaa5);}
  }

  // Hero: a grounded 16m limestone podium, complete four-sided Deco tower.
  const heroPodium=podium('civic_hero_podium',-8,-157,32,26,16,'CIVIC EXCHANGE',true);
  tower('civic_hero',-8,-157,20,20,16,104,'deco',[[1,.43],[.83,.23],[.64,.16],[.46,.10],[.26,.08]]);
  tower('west_terracotta',-53,-102.5,18,15,0,66,'terracotta',[[1,.70],[.81,.20],[.58,.10]]);
  tower('west_slim',-20,-102,14,14,0,82,'fin',[[1,.67],[.80,.22],[.56,.11]]);
  podium('exchange_podium',29,-101.5,34,15,10,'NORTHLINE / EXCHANGE');
  tower('east_exchange',29,-101.5,26,13,10,69,'glass',[[1,.65],[.86,.24],[.62,.11]]);
  tower('east_sentinel',74,-102.5,16,15,0,96,'glass',[[1,.70],[.79,.20],[.52,.10]]);
  podium('plaza_east_podium',38,-150,26,24,11,'SIGNAL / ATRIUM');
  tower('plaza_east',38,-150,20,20,11,94,'bronze',[[1,.61],[.86,.25],[.64,.14]]);

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
  // Ribbed civic entrance portico rises from the existing hero podium.
  // Cantilevered ribs leave the reserved ground-level approaches clear.
  for(const u of [-6,-3,0,3,6]){
    const x=-8+u;
    B('midtownBronze',x,5.05,-141.4,.16,.26,5.4);
    L('midtownBronze',[x,6.65,-143.8],[x,5.12,-138.78],.11,.11);
    B('lamp',x,4.86,-140.8,.055,.045,3.9);
  }
  B('midtownSteel',-8,5.03,-141.3,13.1,.13,5.2);
  B('midtownBronze',-8,5.15,-138.61,13.3,.26,.20);
  // A double-height lantern fills the civic podium face. Its recessed luminous
  // rear wall and roof read as one entrance from across the intersection.
  material('civicLantern',materials.lamp,{color:new T.Color('#abc2cb'),emissive:new T.Color('#c6e5ef'),emissiveIntensity:.61});
  // Top-lit diffuser: a gentle vertical falloff keeps the door reveals legible.
  const glow=document.createElement('canvas');glow.width=2;glow.height=64;
  const ctx=glow.getContext('2d'),falloff=ctx.createLinearGradient(0,0,0,64);
  falloff.addColorStop(0,'#ffffff');falloff.addColorStop(.38,'#dbe6ea');falloff.addColorStop(1,'#9caeb9');
  ctx.fillStyle=falloff;ctx.fillRect(0,0,2,64);
  const lightMap=new T.CanvasTexture(glow);lightMap.colorSpace=T.SRGBColorSpace;
  materials.civicLantern.emissiveMap=lightMap;materials.civicLantern.userData.unitUV=true;
  B('civicLantern',-8,4.38,-143.26,25.6,7.95,.36);
  // Tall entry portals stand forward of the luminous back wall. Their dark
  // reveals stay visible from the crossing and separate the entrance bays.
  for(const x of [-15,-8,-1]){
    for(const edge of [-1,1])B('midtownSteel',x+edge*1.65,2.6,-142.15,.34,4.4,1.65);
    B('midtownSteel',x,4.83,-142.15,3.62,.4,1.65);
    B('glass',x,2.55,-142.94,2.94,4.02,.20,0x6d8a9c);
  }
  B('midtownSteel',-6,14.3,-143.49,20,6.1,1.2);
  label(-6,14.3,-142.82,18.7,4.9,'CIVIC EXCHANGE','METRO NETWORK   /   OPERATIONS','#b2dce5');

  for(const x of [-20.9,4.9]){
    B('midtownBronze',x,4.66,-141.75,.7,8.6,3.7);C(x,4.66,-141.75,.7,8.6,3.7);
  }
  for(const x of [-17,-12.5,-7.9,-3.4,1.1])B('midtownBronze',x,4.4,-142.8,.16,7.95,.34);
  // Interlocking setbacks join the luminous hall to the civic tower.
  for(let tier=0;tier<3;tier++){
    const w=28.16-tier*2.56,d=6.40-tier*1.28,y=8.96+tier*.64;
    B('midtownSteel',-8,y,-143.68+d/2,w,.64,d);
    C(-8,y,-143.68+d/2,w,.64,d);
  }
  B('civicLantern',-8,8.44,-140.4,25.6,.12,3.0);
  // A lower offset corporate wing gives the skyline a readable crown even at
  // street-level camera pitch, while the taller tower rises behind it.
  B('midtownCurtain',1,20.2,-151,10,8.0,11);
  B('midtownSteel',1,24.55,-151,10.7,.7,11.7);
  B('cyan',1,24.19,-145.34,10.4,.22,.18);
  // Landscaped and serviced corners finish the grid, rather than a bare rectangle.
  const forecourts=[[-53,-71,20,12],[-20,-73.9,14,5.4],[28,-74.5,34,5.8],[74,-70.5,16,14],[-53,-133,19,15],[-53,-157,19,21],[74,-136,17,19],[74,-160,17,19]];
  for(const [x,z,w,d]of forecourts){B('paver',x,.27,z,w,.18,d);S(x-w/2,x+w/2,z-d/2,z+d/2);}
  // Compact planting rooms and benches stay outside the device reservation.
  const trees=[[-56,-71,.9],[74,-70,.9],[-53,-135,.93],[-53,-161,.88],[74,-136,.94],[74,-162,.90],[-15,-127,.86],[23,-124.5,.84]];
  for(const [x,z,size]of trees)if(tree){const r=tree(x,z,size,true);stats.trees++;stats.treeBoxes+=r?.boxes||0;}
  for(const [x,z,w,d]of [[-18,-126,2.0,1.0],[23.7,-125,2.0,1.0],[-17.8,-139,2.2,1.0],[25.6,-142.2,2.2,1.0],[-53,-131,7,1.2],[-53,-165,7,1.2],[74,-131,7,1.2],[74,-166,7,1.2]])if(planter)planter(x,z,w,d);
  if(bench)for(const [x,z,rot]of [[-14,-124.5,0],[-15,-140.5,Math.PI],[22,-124.2,0],[21.8,-142.7,Math.PI],[-53,-139,0],[-53,-153,Math.PI],[74,-140,0],[74,-154,Math.PI]])bench(x,z,rot);
  if(lamp){
    for(const z of [-72,-102,-132,-165]){lamp(-42.4,z,1);lamp(64.4,z,-1);}
    for(const x of [-21,18,45])for(const z of [-79,-125])lamp(x,z,z< -100?1:-1);
  }
  // Service cabinets and transformer bays occupy the perimeter courts only.
  for(const [x,z]of [[-56,-154],[-48,-154],[73,-155],[79,-155]]){
    B('midtownSteel',x,1.50,z,1.7,2.28,1.15,0x8c9f91);C(x,1.50,z,1.7,2.28,1.15);
    B('metal',x,2.72,z,1.92,.18,1.35,0x90a396);
    for(let j=0;j<6;j++)B('rubber',x-.59+j*.24,1.5,z+.59,.08,1.65,.035,0x8da195);
    B('cyan',x-.42,2.25,z+.63,.20,.06,.025,0x93b9aa);
  }
  for(const [x,z]of [[-59,-147],[79,-148]]){
    B('metal',x,2.8,z,1.5,4.9,1.5,0x8ba498);C(x,2.8,z,1.5,4.9,1.5);
    B('metal',x,5.4,z,2.3,.22,2.3,0x95aa9a);
    for(let j=0;j<4;j++)B('metal',x,4.2+j*.26,z,1.8,.11,1.8,0x859e92);
  }
  // A single restrained lobby light and a plaza warm light; cyber agent handles
  // the displays / central installation and their limited local light budget.
  for(const [x,y,z,color,power,reach]of [[-8,5.6,-139.8,0xc7ebff,125,19],[30,5.4,-136,0x78b8c5,44,12]]){
    const l=new T.PointLight(color,power,reach,2);l.position.set(x,y,z);l.castShadow=false;l.userData.nightPower=power;scene.add(l);lights.push(l);
  }
  const landmarks=[
    {id:'midtown_civic_plaza',title:'中城企业广场',position:new T.Vector3(0,SIDE,-127.5)},
    {id:'midtown_artdeco',title:'都会交易塔',position:new T.Vector3(-8,SIDE,-139.5)}
  ];
  const cyberAnchors=[
    {id:'hero_front',position:new T.Vector3(-8,7.8,-143.55),rotation:0,width:16,height:4.2,mountDepth:1.0},
    {id:'west_slim',position:new T.Vector3(-20,16,-94.55),rotation:0,width:9,height:6,mountDepth:.7},
    {id:'east_exchange',position:new T.Vector3(29,16.5,-93.65),rotation:0,width:15,height:7.2,mountDepth:1.4},
    {id:'east_plaza_west',position:new T.Vector3(27.65,22,-150),rotation:-Math.PI/2,width:12,height:8,mountDepth:.6}
  ];
  stats.colliders=colliders.length-before;stats.pointLights=lights.length;stats.triangles=(stats.boxes+stats.beams)*12;
  stats.injectedTreeTriangles=stats.treeBoxes*12;stats.towerFootprints=towerFootprints;
  const plazaInfo={minX:-20,maxX:28,minZ:-145,maxZ:-121,y:SIDE,device:{minX:2,maxX:14,minZ:-140,maxZ:-128,center:new T.Vector3(8,SIDE,-134)},heroPodium};
  const districts=[{id:'midtown',title:'中城 · 企业大道',position:new T.Vector3(0,ROAD,-97),bounds}];
  function setNight(night){for(const l of lights)l.intensity=l.userData.nightPower*(night?1:.15);}
  function update(dt,time,camera){}
  setNight(true);
  return {bounds,landmarks,districts,stats,plazaInfo,cyberAnchors,towerFootprints,lights,update,setNight};
}
