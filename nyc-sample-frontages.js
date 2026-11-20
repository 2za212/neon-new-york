import * as T from 'three';
import {addSleeveDisplay} from './nyc-record-sleeves.js';
import {addRecordShopCanopy} from './nyc-record-canopy.js';

export const SAMPLE_FRONTAGES=[
  {id:'east_corner',x:10.65,z:29.8,width:7.4,depth:12.4,rot:-Math.PI/2,recessDepth:5.0},
  {id:'west_records',x:-10.65,z:32,width:10.3,depth:15,rot:Math.PI/2,recessDepth:4.7}
];

/** Real, recessed ground-floor rooms. The parent owns upper/rear/side shells. */
export function addSampleFrontages(scene,{box,beam,castColumn,weatherOccluders,materials,colliders,surface,sign,rand=Math.random}){
  const FLOOR=.36,CEILING=3.85,lights=[],entries=[],furniture=[],frontBarriers=[];
  const before=colliders.length,stats={rooms:3,residentialEntries:1,boxes:0,beams:0,colliders:0,signs:0,triangles:0,pointLights:0,independentDrawCalls:0};
  const B=(...a)=>{stats.boxes++;box(...a);};const L=(...a)=>{stats.beams++;beam(...a);};
  function material(name,base,options){if(!materials[name]){const m=base.clone();Object.assign(m,options);m.name='NYC sample frontage / '+name;m.userData={...base.userData};materials[name]=m;}return materials[name];}
  material('sampleIron',materials.metal,{color:new T.Color(0x394d49),metalness:.55,roughness:.63});
  material('sampleOak',materials.wood,{color:new T.Color(0xc0a87f),roughness:.84,metalness:0});
  material('samplePlaster',materials.trim,{color:new T.Color(0xa5a592),roughness:.95});
  material('samplePaper',materials.trim,{color:new T.Color(0xb8b399),roughness:.98});
  material('sampleCream',materials.trim,{color:new T.Color(0xc6bfa4),roughness:.68});
  material('sampleTeal',materials.trim,{color:new T.Color(0x476c68),roughness:.87});
  material('sampleRed',materials.trim,{color:new T.Color(0x8e594b),roughness:.88});
  material('sampleSleeve',materials.trim,{color:new T.Color(0x899b8b),roughness:.94});
  material('sampleVinyl',materials.rubber,{color:new T.Color(0x172321),roughness:.53,metalness:.08});
  const warm=material('sampleWarm',materials.lamp,{color:new T.Color(0xc3a071),emissive:new T.Color(0xffb86a),emissiveIntensity:.28,roughness:.62});
  const cool=material('sampleCool',materials.cyan,{color:new T.Color(0x6eafb1),emissive:new T.Color(0x62cbd3),emissiveIntensity:.30,roughness:.56});
  const glass=new T.MeshStandardMaterial({color:0xadc2be,vertexColors:true,transparent:true,opacity:.12,roughness:.18,metalness:.04,depthWrite:false,envMapIntensity:.35});glass.name='NYC sample / clear real-room glazing';glass.userData.castShadow=false;materials.sampleClearGlass=glass;
  const tile=document.createElement('canvas');tile.width=tile.height=256;const g=tile.getContext('2d');g.fillStyle='#65716a';g.fillRect(0,0,256,256);
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.fillStyle=(x+y)%2?'#a5a38c':'#667970';g.fillRect(x*64+2,y*64+2,60,60);for(let i=0;i<32;i++){g.fillStyle=i%2?'rgba(20,35,25,.09)':'rgba(226,221,190,.1)';g.fillRect(x*64+4+rand()*55,y*64+4+rand()*55,1,2);}}
  const tileMap=new T.CanvasTexture(tile);tileMap.colorSpace=T.SRGBColorSpace;tileMap.wrapS=tileMap.wrapT=T.RepeatWrapping;tileMap.anisotropy=4;
  const tileMat=material('sampleDinerTile',materials.trim,{map:tileMap,color:new T.Color(0xffffff),roughness:.66,metalness:.02});tileMat.userData.textureMeters=1.2;tileMat.userData.unitUV=false;
  function frame(def){
    const c=Math.cos(def.rot),s=Math.sin(def.rot),P=(u,y,out)=>[def.x+u*c+out*s,y,def.z-u*s+out*c];
    const C=(u,y,out,w,h,d,id,kind='furniture')=>{const p=P(u,y,out),ww=Math.abs(c)*w+Math.abs(s)*d,dd=Math.abs(s)*w+Math.abs(c)*d,b=new T.Box3(new T.Vector3(p[0]-ww/2,y-h/2,p[2]-dd/2),new T.Vector3(p[0]+ww/2,y+h/2,p[2]+dd/2));b.userData={sampleFrontage:def.id,id,kind};colliders.push(b);const data={id,kind,min:b.min.toArray(),max:b.max.toArray()};(kind==='front-barrier'?frontBarriers:furniture).push(data);return b;};
    const S=(u1,u2,v1,v2,y=FLOOR)=>{const p=P((u1+u2)/2,y,(v1+v2)/2),w=u2-u1,d=v2-v1,ww=Math.abs(c)*w+Math.abs(s)*d,dd=Math.abs(s)*w+Math.abs(c)*d;surface(p[0]-ww/2,p[0]+ww/2,p[2]-dd/2,p[2]+dd/2,y);};
    return {def,P,C,S,B:(mat,u,y,v,w,h,d,color=0xffffff)=>B(mat,...P(u,y,v),w,h,d,color,def.rot),L:(mat,a,b,width=.04,color=0xffffff)=>L(mat,P(...a),P(...b),width,width,color),
      sign(u,y,v,w,h,title,sub,color){if(sign){sign(...P(u,y,v),w,h,title,sub,color,def.rot);stats.signs++;}}};
  }
  function roomShell(f,u1,u2,floorMat='sampleOak'){
    const width=u2-u1,centre=(u1+u2)/2,depth=f.def.recessDepth;
    f.B(floorMat,centre,.28,-depth/2,width,.16,depth+.02);f.S(u1,u2,-depth,.18);
    f.B('samplePlaster',centre,3.975,-depth/2,width,.25,depth);
    f.C(centre,3.975,-depth/2,width,.25,depth,f.def.id+'-ceiling','ceiling');
    f.B('samplePlaster',centre,(CEILING+FLOOR)/2,-depth+.06,width,CEILING-FLOOR,.12);
    f.C(centre,(CEILING+FLOOR)/2,-depth+.06,width,CEILING-FLOOR,.12,f.def.id+'-back-wall','back-wall');
    f.B('sampleOak',centre,.56,-depth+.135,width,.34,.06,0xaaa18a);
    // Shallow vertical dado moulding makes depth readable through clear glass.
    for(let u=u1+.18;u<u2;u+=.42)f.B('sampleOak',u,.69,-depth+.14,.055,.60,.065,0xa99c7c);
  }
  function pier(f,u,width=.22){
    castColumn?.(...f.P(u,.36,.31),3.20,width*.74,u);
    f.B('midtownLimestone' in materials?'midtownLimestone':'stone',u,1.99,.10,width,3.26,.38,0xa6ae9a);
    f.B('stone',u,.62,.18,width+.13,.48,.49,0xb0ad96);
    f.B('sampleIron',u,3.53,.15,width+.18,.22,.47,0x9bad9b);
    f.C(u,1.99,.10,width,3.26,.38,'facade-pier','front-barrier');
    for(let y=.96;y<3.5;y+=.33)f.B('samplePlaster',u,y,.298,width+.02,.035,.025,0x8e9d8b);
  }
  function window(f,u1,u2,id){
    const w=u2-u1,u=(u1+u2)/2;
    f.B('sampleTeal',u,.67,.075,w,.62,.24);
    // Salt-glazed stall risers. Laid in running bond, with a projecting
    // toe course and returned ends that read when walking along the glass.
    for(let row=0;row<3;row++){
      for(let left=u1-(row%2)*.16;left<u2;left+=.32){
        const lo=Math.max(u1,left),hi=Math.min(left+.32,u2);
        if(hi-lo<.04)continue;
        const accent=id.startsWith('records')?'sampleTeal':'sampleSleeve';
        f.B(row===0?'sampleIron':accent,(lo+hi)/2,.45+row*.16,.18,
          hi-lo-.012,.148,row===0?.24:.16, row===1?0xc6d4c5:0xaabbb1);
      }
    }
    f.B('sampleClearGlass',u,2.11,-.03,w-.12,2.16,.035,0xb3c7bd);
    for(const e of [-1,1])f.B('sampleIron',u+e*(w/2-.025),2.08,.01,.075,2.40,.17,0x91a18d);
    f.B('sampleIron',u,.99,.06,w,.10,.27,0x9aaa95);f.B('sampleIron',u,3.25,.055,w,.13,.24,0x9aaa95);
    f.B('sampleIron',u,2.43,.055,w,.045,.12,0x92a58d);
    f.C(u,1.92,.025,w,3.12,.15,id,'front-barrier');
  }
  function doorway(f,u,width,id){
    // Real opening. The clear middle has no plane, door collider or fake window.
    const half=width/2;
    for(const e of [-1,1]){
      f.B('sampleOak',u+e*(half+.065),1.75,-.13,.13,2.78,.28,0xb9a180);
      f.C(u+e*(half+.065),1.75,-.13,.13,2.78,.28,id+'-jamb','front-barrier');
    }
    f.B('sampleOak',u,3.09,-.13,width+.26,.18,.28,0xc0ac86);
    f.C(u,3.09,-.13,width+.26,.18,.28,id+'-header','front-barrier');
    f.B('sampleClearGlass',u,3.42,-.09,width+.04,.55,.035,0xb8cbbb);
    f.B('sampleIron',u,3.12,.02,width+.29,.08,.29,0xa2b09a);
    f.B('sampleDinerTile',u,.32,.025,width,.08,.32);f.S(u-half,u+half,-.21,.18);
    // Door leaf parked against its right reveal; its edge does not reduce the
    // declared opening width or the straight customer path into the room.
    const leaf=u+half+.045;
    f.B('sampleIron',leaf,1.78,-.66,.065,2.62,1.15,0x8fa28c);
    f.B('sampleClearGlass',leaf-.042,1.78,-.66,.025,2.43,1.02,0xb4c9ba);
    f.B('metal',leaf-.086,1.48,-.29,.08,.09,.24,0xaab89d);
    f.C(leaf,1.78,-.66,.075,2.62,1.15,id+'-open-leaf','open-door');
  }
  function shelf(f,u,y,v,w,d=.35){f.B('sampleOak',u,y,v,w,.075,d,0xb7a17c);f.B('sampleIron',u,y-.11,v-d*.36,w,.025,.05,0x879d88);}
  function packageBox(f,u,y,v,w=.26,h=.22,d=.30,color=0xffffff){f.B('samplePaper',u,y,v,w,h,d,color);f.B('sampleCream',u,y+h*.18,v+d/2+.009,w*.44,h*.28,.012,0xbdc5a8);f.B('sampleIron',u,y+h/2+.006,v,.018,.012,d,0x899d88);}
  function downlight(f,u,v,kind='warm'){
    f.B('sampleIron',u,3.56,v,.03,.38,.03,0x94a98e);f.B('sampleIron',u,3.34,v,.38,.12,.38,0x8d9f89);
    f.B(kind==='warm'?'sampleWarm':'sampleCool',u,3.27,v,.24,.045,.24,0xbcc4a5);
  }
  const east=frame(SAMPLE_FRONTAGES[0]),west=frame(SAMPLE_FRONTAGES[1]);
  roomShell(east,-3.7,.05,'sampleDinerTile');roomShell(east,.05,3.7,'paver');roomShell(west,-5.15,1.25,'sampleOak');
  // The east shops share a real separating wall with a ceramic lower dado.
  east.B('samplePlaster',.05,2.105,-2.5,.16,3.49,5);east.C(.05,2.105,-2.5,.16,3.49,5,'deli-repair-partition','partition');
  east.B('sampleCream',-.044,.92,-2.5,.035,1.12,4.9,0xb9bda6);
  west.B('samplePlaster',1.25,2.105,-2.35,.18,3.49,4.7);west.C(1.25,2.105,-2.35,.18,3.49,4.7,'records-residential-partition','partition');

  // Cast-iron facades retain different bay rhythms instead of one repeated card.
  for(const u of [-3.59,.05,3.59])pier(east,u,.20);
  window(east,-3.44,-1.68,'deli-left-window');doorway(east,-.90,1.32,'deli');
  window(east,.25,1.80,'repair-display-window');doorway(east,2.60,1.28,'repair');
  for(const u of [-5.04,1.25,5.04])pier(west,u,.22);
  window(west,-4.88,-1.03,'records-display-window');doorway(west,-.25,1.35,'records');window(west,.55,1.10,'records-right-window');
  // Glazed shop signs sit between the stepped street visor and ceramic heads.
  for(const f of [east,west]){
    for(let bay=0;bay<3;bay++){
      const w=f.def.width/3,u=(bay-1)*w;
      f.B('basaltShell',u,3.95,.48,w-.09,.32,.96);
      f.B('ceramicShell',u,4.13,.44,w-.40,.16,.96,0xc2d4ce);
      f.B('titaniumSkin',u-w*.41,3.71,.58,.32,.32,1.16,0xb4c6c1);
    }
    f.B('sampleIron',0,3.62,.15,f.def.width-.18,.37,.41,0x9cae96);
    // The shop ends turn into the street as terraced masonry brackets.
    // Leave the projecting centre clear for the illuminated sign and canopy.
    for(const end of [-1,1])for(let course=0;course<4;course++){
      const reach=.32+course*.16;
      f.B(f===west?'basaltShell':'titaniumSkin',end*(f.def.width/2-reach/2),
        3.44+course*.16,.24+course*.08,reach,.16,.48+course*.16);
    }
    f.B('titaniumSkin',0,3.84,.21,f.def.width+.10,.12,.53,0xa99f7e);
    for(let u=-f.def.width/2+.13;u<f.def.width/2;u+=.26)f.B('sampleIron',u,3.78,.40,.12,.12,.22,0x93a68c);
    if(f===west)continue;
    f.B('sampleTeal',0,3.28,.47,f.def.width-.12,.16,1.08,0x97b09a);
    f.B('sampleIron',0,3.18,.98,f.def.width,.07,.10,0x94aa93);
    for(let u=-f.def.width/2+.12;u<f.def.width/2;u+=.30)f.B('sampleCream',u,3.22,1.025,.09,.12,.025,0xb1b99b);
  }
  const canopy=addRecordShopCanopy(west);
  weatherOccluders.push(canopy.bounds);
  west.B('sampleIron',3.18,3.28,.49,3.74,.14,.98);
  east.sign(-1.88,3.63,.382,3.14,.42,'MONROE DELI','FRESH / SINCE 2086','#dbc595');
  east.sign(1.90,3.63,.382,3.05,.42,'PATCH / REPAIR','DEVICES / AUDIO','#92bec0');
  west.sign(-1.95,3.63,.382,5.50,.42,'SIDE B / RECORDS','VINYL / BOOKS / SESSIONS','#d1bd94');

  // DELI: L-shaped oak / ceramic counter, visible food case and a real rear prep.
  east.B('sampleCream',-2.70,.91,-2.57,1.35,1.10,2.86,0xb6bba0);
  east.B('sampleOak',-2.70,1.50,-2.57,1.47,.10,3.0,0xb9a47a);
  east.C(-2.70,.96,-2.57,1.47,1.20,3.0,'deli-counter');
  for(let v=-3.83;v<-1.30;v+=.30){east.B('sampleIron',-1.99,.91,v,.04,.92,.045,0x89a18a);east.B('sampleCream',-2.69,.89,v,1.25,.045,.04,0x9fac92);}
  east.B('sampleClearGlass',-2.02,1.86,-2.57,.035,.61,2.70,0xaac6b8);
  east.B('sampleClearGlass',-2.70,2.19,-2.57,1.30,.035,2.70,0xaac6b8);
  for(const v of [-3.91,-1.22])east.B('sampleIron',-2.69,1.86,v,1.36,.04,.04,0xa4b29a);
  for(let tray=0;tray<6;tray++){
    const v=-3.68+tray*.43;east.B('metal',-2.56,1.59,v,.81,.045,.35,0xa4ad98);
    for(let k=0;k<4;k++){east.B(k%2?'sampleCream':'sampleOak',-2.82+k*.18,1.66,v,.13,.08,.23,k%2?0x9ba887:0xb19b71);if(tray%2===0)east.B('leaf',-2.80+k*.18,1.72,v,.11,.045,.20,0xa0b48a);}
  }
  east.B('sampleCream',-1.88,.94,-4.47,3.2,1.13,.48,0xb4b99d);east.B('metal',-1.88,1.55,-4.47,3.28,.09,.55,0x9caa96);east.C(-1.88,.96,-4.47,3.28,1.20,.55,'deli-prep-back');
  for(const y of [2.05,2.67]){
    shelf(east,-1.85,y,-4.62,3.25,.40);
    for(let i=0;i<11;i++)packageBox(east,-3.22+i*.276,y+.19,-4.58,.22,.28,.25,i%3?0xa2b494:0xb9a37c);
  }
  // Subtle ceramic wall detail and a real small extraction hood above prep.
  for(let y=.75;y<1.7;y+=.20)east.B('sampleIron',-1.85,y,-4.78,3.2,.015,.014,0x91a18e);
  east.B('sampleIron',-2.72,3.13,-4.36,1.35,.29,.63,0xa2aea0);east.B('metal',-2.72,3.52,-4.55,.37,.62,.35,0x8fa28c);
  for(let i=0;i<7;i++)east.B('sampleVinyl',-3.25+i*.17,3.09,-4.03,.055,.12,.04,0x8a9b86);
  downlight(east,-2.25,-2.55,'warm');downlight(east,-.72,-3.7,'warm');

  // REPAIR: cool workbench, open tools, 3D device stock and counter shelving.
  east.B('sampleIron',1.12,1.11,-3.59,1.62,.14,1.03,0x91a69a);east.C(1.12,.90,-3.59,1.67,1.12,1.08,'repair-workbench');
  for(const u of [.44,1.80])for(const v of [-3.97,-3.22])east.B('sampleIron',u,.71,v,.09,.72,.09,0x879b8c);
  east.B('sampleIron',1.12,1.55,-3.88,.81,.69,.13,0x6f8d85);east.B('sampleCool',1.12,1.56,-3.80,.65,.50,.025,0xa0bab0);
  for(let k=0;k<5;k++)east.B('sampleIron',.56+k*.20,1.23,-3.40,.14,.06,.33,0x9aa78f);
  east.B('sampleOak',.77,1.20,-3.24,.44,.045,.37,0xa8a57e);east.B('sampleCool',.75,1.235,-3.22,.28,.012,.17,0x7caa9a);
  east.B('sampleIron',3.40,.91,-2.60,.34,1.08,2.70,0x849c8d);east.B('sampleOak',3.40,1.49,-2.60,.42,.09,2.8,0xa9a37e);east.C(3.40,.95,-2.60,.42,1.18,2.8,'repair-side-counter');
  for(const y of [1.80,2.45,3.05]){
    shelf(east,1.92,y,-4.58,3.18,.45);
    for(let i=0;i<9;i++){
      east.B('samplePaper',.48+i*.35,y+.22,-4.58,.27,.34,.30,i%3?0x8da99b:0xa7a88c);
      east.B('sampleIron',.48+i*.35,y+.22,-4.415,.17,.24,.014,0x728f88);
      if(i%3===0)east.B('sampleCool',.48+i*.35,y+.24,-4.403,.09,.045,.012,0x91b6a7);
    }
  }
  east.C(1.92,1.8,-4.58,3.18,2.95,.45,'repair-back-stock');
  // A pegboard's tools have real stems, handles and small end hooks.
  east.B('sampleTeal',.18,2.15,-2.45,.06,1.65,1.67,0x9fb09b);
  for(let i=0;i<8;i++){
    const v=-3.12+i*.19;east.B('metal',.222,2.13,v,.07,.56,.035,0xb4bcaa);east.B(i%2?'sampleRed':'sampleOak',.245,1.92,v,.085,.21,.07,0xb0aa8c);
  }
  downlight(east,1.60,-2.40,'cool');downlight(east,2.70,-3.90,'cool');

  // RECORDS: deep window display, browsable centre bin, organized wall stock.
  west.B('sampleTeal',-2.35,.83,-2.25,2.55,.94,1.56,0xb1bba5);west.B('sampleOak',-2.35,1.34,-2.25,2.69,.10,1.69,0xb7aa85);west.C(-2.35,.91,-2.25,2.69,1.11,1.69,'records-centre-bin');
  for(let lane=0;lane<3;lane++)for(let i=0;i<12;i++){
    const u=-3.38+lane*.86,v=-2.94+i*.121;
    west.B(i%3?'sampleSleeve':'samplePaper',u,1.54,v,.73,.39,.026,i%4?0x9ba992:0x9a7562);
    west.B('sampleIron',u,1.57,v+.016,.22,.035,.012,0x6c8a80);
  }
  for(const y of [.92,1.58,2.25,2.92]){
    shelf(west,-4.77,y,-2.51,.47,3.66);
    for(let i=0;i<22;i++)west.B(i%4?'sampleSleeve':'samplePaper',-4.65,y+.24,-4.12+i*.151,.30,.40,.028,i%3?0x93a58e:0xb09b80);
  }
  west.C(-4.77,1.82,-2.51,.47,2.96,3.66,'records-left-shelves');
  west.B('sampleOak',-2.0,.96,-4.29,4.8,1.12,.53,0xad9d7b);west.C(-2.0,.96,-4.29,4.8,1.12,.53,'records-back-bins');
  for(const y of [1.65,2.38,3.03]){
    shelf(west,-2.0,y,-4.40,4.75,.38);
    for(let i=0;i<17;i++)west.B(i%3?'sampleSleeve':'samplePaper',-4.23+i*.274,y+.25,-4.40,.22,.40,.25,i%4?0x9bab96:0x9d7e67);
  }
  function album(u,y,v,color){
    west.B('samplePaper',u,y,v,.59,.65,.055,color);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
      west.L('sampleVinyl',[u+Math.cos(a)*.18,y+Math.sin(a)*.18,v+.037],[u+Math.cos(b)*.18,y+Math.sin(b)*.18,v+.037],.045,0x9aa892);
    }
    west.B('sampleRed',u,y,v+.065,.075,.075,.018,0xa8a085);west.B('sampleIron',u,y-.25,v+.041,.44,.025,.012,0x749186);
  }
  for(const [u,color]of [[-4.25,0xadb18f],[-3.20,0x889e98],[-2.15,0xb2987f]]){
    west.B('sampleOak',u,.96,-.67,.73,1.18,.47,0xae9f7b);west.C(u,.96,-.67,.73,1.18,.47,'records-window-plinth');album(u,1.87,-.63,color);
  }
  west.B('sampleIron',-3.5,1.59,-3.91,.68,.12,.42,0x91a28e);west.B('sampleCool',-3.5,1.74,-3.94,.43,.21,.06,0x819f96);
  // Stepped opal shades repeat through the depth of the room. Each exposed
  // shade shares the same emissive glass, with opaque bands casting shadows.
  material('recordsOpal',materials.lamp,{color:new T.Color(0xffd490),emissive:new T.Color(0xffb24b),emissiveIntensity:.74});
  for(const [u,v] of [[-4.18,-.78],[-2.37,-1.06],[-1.60,-3.15]]){
    west.B('sampleIron',u,3.61,v,.029,.48,.029);
    west.B('sampleIron',u,3.36,v,.27,.095,.27);
    for(const [y,w] of [[3.27,.35],[3.19,.53],[3.11,.61],[3.03,.43]])
      west.B('recordsOpal',u,y,v,w,.082,w);
    west.B('sampleIron',u,3.086,v,.62,.021,.62);
  }
  // Warm light beneath the back shelves separates the record spines from
  // their shadows. A lip hides the strip from the normal street view.
  for(const y of [2.38,3.03]){
    west.B('recordsOpal',-2,y-.055,-4.24,4.66,.026,.04);
    west.B('sampleOak',-2,y-.055,-4.20,4.76,.070,.036);
  }
  downlight(west,-2.05,-2.55,'warm');downlight(west,-.35,-3.75,'warm');

  // Two faces share a blade silhouette when approaching from either end of the street.
  // A record cut into twelve facets reads edge-on from either approach.
  const bladeU=-3.85, hubOut=1.38, hubY=4.86, radius=.82;
  west.B('sampleIron',bladeU,5.76,.89,.16,.14,1.65);
  west.L('metal',[bladeU,6.02,.20],[bladeU,5.76,1.65],.045);
  for(const offset of [-.28,.28]) west.B('metal',bladeU,5.62,hubOut+offset,.045,.28,.045);
  for(let i=0;i<12;i++){
    const a=Math.PI*2*i/12,b=Math.PI*2*(i+1)/12;
    const ringPoint=(angle,r,u)=>[u,hubY+Math.sin(angle)*r,hubOut+Math.cos(angle)*r];
    west.L('sampleIron',ringPoint(a,radius,bladeU),ringPoint(b,radius,bladeU),.12);
    for(const side of [-1,1]){
      const face=bladeU+side*.07;
      west.L('sampleWarm',ringPoint(a,radius,face),ringPoint(b,radius,face),.037);
      west.L('metal',ringPoint(a,radius*.78,face),ringPoint(b,radius*.78,face),.033);
    }
  }
  const hub=west.P(bladeU,hubY,hubOut);
  for(const facing of [0,Math.PI]){
    if(sign){sign(hub[0],hub[1],hub[2]+Math.cos(facing)*.085,1.12,.63,'SIDE B','33  /  NYC','#ffbf72',facing);stats.signs++;}
  }
  west.B('sampleWarm',-2.78,3.115,.72,3.6,.045,.10);
  for(const u of [-5.04,1.25]){
    for(const [y,w,h,d] of [[.53,.40,.23,.51],[.78,.34,.17,.46],[3.37,.36,.12,.46],[3.52,.50,.15,.55]])
      west.B('sampleIron',u,y,.15,w,h,d,0xb8c2a8);
    for(const offset of [-.074,0,.074])west.B('sampleIron',u+offset,2.06,.315,.036,2.42,.075,0xc1c7ad);
  }
  addSleeveDisplay(scene,west);
  stats.independentDrawCalls++;stats.triangles+=6;

  // RESIDENTIAL: oak door genuinely behind a three-step limestone stoop.
  const ru=3.15;
  // A rear solid stops behind the oak door; the first 2.16m is an actual open
  // vestibule, not an opaque front box. Individual reveals flank the stairs.
  west.B('samplePlaster',3.20,2.105,-3.43,3.72,3.49,2.54,0x9d9e8b);
  west.C(3.20,2.105,-3.43,3.72,3.49,2.54,'residential-rear-core','back-wall');
  west.B('sampleOak',ru,2.08,-2.06,1.48,2.35,.14,0xb49d75);west.C(ru,2.08,-2.06,1.48,2.35,.14,'residential-closed-door','closed-door');
  for(const e of [-1,1])west.B('sampleOak',ru+e*.83,2.12,-1.98,.19,2.72,.30,0xa99773);
  west.B('sampleOak',ru,3.47,-1.98,1.88,.21,.31,0xb2a17d);
  for(const yy of [1.42,2.02,2.63])for(const uu of [ru-.36,ru+.36])west.B('sampleOak',uu,yy,-1.965,.55,.40,.09,0xa18f69);
  west.B('metal',ru-.50,1.87,-1.86,.075,.22,.07,0xb2b596);west.B('metal',ru-.42,1.84,-1.85,.22,.06,.07,0xa6b08f);
  west.B('metal',ru,2.93,-1.855,.37,.23,.025,0xb0ad88);
  // Small original brass 38 plate, drawn with seven-segment solid pieces.
  for(const [u,segments]of [[ru-.085,[0,1,2,3,6]],[ru+.085,[0,1,2,3,4,5,6]]])for(const s of segments){
    const coords=[[0,.075,.08,.017],[.044,.038,.017,.064],[.044,-.038,.017,.064],[0,-.075,.08,.017],[-.044,-.038,.017,.064],[-.044,.038,.017,.064],[0,0,.08,.017]][s];west.B('sampleVinyl',u+coords[0],2.93+coords[1],-1.837,coords[2],coords[3],.012,0x94a180);
  }
  for(let i=0;i<3;i++){
    const top=.54+i*.18,out=-.475-i*.35;
    west.B('stone',ru,(FLOOR+top)/2,out,1.88,top-FLOOR,.35,0xb3b299);
    west.C(ru,(FLOOR+top)/2,out,1.88,top-FLOOR,.35,'residential-step-'+i,'step');west.S(ru-.94,ru+.94,out-.175,out+.175,top);
    west.B('sampleIron',ru,top+.008,out+.166,1.78,.016,.022,0x849886);
  }
  west.B('stone',ru,.63,-1.625,1.88,.54,.55,0xb1b198);west.C(ru,.63,-1.625,1.88,.54,.55,'residential-landing','step');west.S(ru-.94,ru+.94,-1.90,-1.35,.90);
  // Room floor ahead of the first tread joins the unchanged sidewalk at .36.
  west.B('paver',ru,.28,-.07,2.05,.16,.48);west.S(ru-1.02,ru+1.02,-.31,.18,FLOOR);
  for(const e of [-1,1]){
    const u=ru+e*1.04;
    west.L('sampleIron',[u,1.44,-1.80],[u,.97,-.30],.06,0x91a18b);
    for(let i=0;i<4;i++){const v=-.35-i*.45,y=.36+i*.16;west.B('sampleIron',u,y+.45,v,.045,.90,.045,0x8c9e87);west.C(u,y+.45,v,.07,.9,.07,'residential-rail','rail');}
  }
  // Oak vestibule sides and setback masonry reveal, with no opaque front fill.
  for(const e of [-1,1]){west.B('samplePlaster',ru+e*1.44,2.11,-1.12,.24,3.50,2.15,0xa2a38e);west.C(ru+e*1.44,2.11,-1.12,.24,3.50,2.15,'residential-reveal','partition');}
  downlight(west,ru,-1.21,'warm');

  // Root's new exterior shadowed spot is attached to this visible small hood.
  east.B('sampleIron',-2.5,3.38,.70,.24,.16,.23,0x8da18d);east.B('sampleWarm',-2.5,3.29,.72,.15,.025,.14,0xaeb79c);
  const fixturePosition=new T.Vector3(9.95,3.35,27.3);
  function point(f,u,y,v,color,power,id){const l=new T.PointLight(color,power,7.5,2);l.position.set(...f.P(u,y,v));l.castShadow=false;l.userData={nightPower:power,sampleInterior:id};scene.add(l);lights.push(l);}
  point(east,-2.05,3.05,-2.85,0xffc08b,18,'deli-warm');
  point(east,1.62,3.08,-2.72,0x8cbfc9,10,'repair-cool');
  point(west,-2.8,2.86,-1.13,0xffaf58,53,'records-warm');
  lights.at(-1).distance=6.5;
  // The porch has its own existing pendant; a small real light keeps its oak
  // panels readable without relying on emissive geometry to provide bounce.
  point(west,ru,3.0,-1.10,0xffc893,4,'residential-porch');
  lights.at(-1).distance=4;
  entries.push(
    {id:'deli',frontage:'east_corner',street:[9.5,.36,28.9],inside:[12.15,.36,28.9],deep:[14.25,.36,28.9],backWallX:15.53,ceilingY:CEILING,clearHeight:2.64,clearWidth:1.32},
    {id:'repair',frontage:'east_corner',street:[9.5,.36,32.4],inside:[12.15,.36,32.4],deep:[14.25,.36,32.4],backWallX:15.53,ceilingY:CEILING,clearHeight:2.64,clearWidth:1.28},
    {id:'records',frontage:'west_records',street:[-9.5,.36,32.25],inside:[-12.15,.36,32.25],deep:[-14.05,.36,32.25],backWallX:-15.23,ceilingY:CEILING,clearHeight:2.64,clearWidth:1.35}
  );
  const closedEntry={id:'residential',street:[-9.5,.36,28.85],landing:[-12.15,.90,28.85],doorPlaneX:-12.64,doorCenterX:-12.71,closed:true};
  function setNight(night){for(const l of lights)l.intensity=l.userData.nightPower*(night?1:.65);warm.emissiveIntensity=night?.28:.14;cool.emissiveIntensity=night?.30:.15;}
  function setQuality(level){}
  stats.colliders=colliders.length-before;stats.pointLights=lights.length;stats.triangles+=(stats.boxes+stats.beams)*12;stats.furniture=furniture;stats.frontBarriers=frontBarriers;
  stats.clearCeilingY=CEILING;stats.addedProjectionMax=.50;stats.overheadVisorProjection=1.62;
  setNight(true);
  return {stats,entries,closedEntry,lights,setNight,setQuality,furniture,frontBarriers,fixturePosition};
}
