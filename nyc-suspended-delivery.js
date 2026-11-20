import * as T from 'three';

// City night post and market cold chain lease two different levels of street
// space. Hardware is in a .32 m casting grid with .16 m inserts. Each moving
// load is one instanced draw; fixed parts go into the existing district batch.
const lamp='upperStreetOpal', steel='metal', enamel='trim';
const post={body:0x304d63, rim:0x7998ab, circuit:0x2dd3e6, hot:0xff8864, paper:0xffe6ac};
const market={body:0x52435a, rim:0xa48d9f, circuit:0xd66afa, hot:0xffa456, paper:0xc2fff2};

function frame(api,axis,origin,across) {
  const alongX=axis==='x';
  function p(u,y,v){return alongX?[origin+u,y,across+v]:[across+v,y,origin+u];}
  function box(mat,u,y,v,w,h,d,tint){
    api.box(mat,...p(u,y,v),alongX?w:d,h,alongX?d:w,tint,0,null,true);
  }
  function solid(mat,u,y,v,w,h,d,tint){
    box(mat,u,y,v,w,h,d,tint);
    api.collider(...p(u,y,v),alongX?w:d,h,alongX?d:w);
  }
  function point(u,y,v,color,power,reach){
    const l=new T.PointLight(color,power,reach,2);
    l.position.set(...p(u,y,v));l.userData.nightPower=power;
    l.name='夜班物流 / 灯槽';api.scene.add(l);api.lights.push(l);
  }
  function label(u,y,v,w,h,title,sub,tint,dir){
    api.sign(...p(u,y,v),w,h,title,sub,tint,alongX?(dir>0?0:Math.PI):dir*Math.PI/2);
  }
  return {p,box,solid,point,label};
}

// The seam alternates a structural dovetail, a dark gasket and an inset lit
// pane. The parcel itself has depth, a split front prow and a suspended yoke.
function parcelGeometry(colors,isMarket){
  const cells=[];
  function part(x,y,z,w,h,d,tint){cells.push([x,y,z,w,h,d,tint]);}
  part(0,.32,0,4.8,.64,1.28,colors.body);
  part(0,1.11,0,5.12,.96,1.6,colors.body);
  part(0,1.71,0,4.48,.32,1.6,colors.rim);
  part(0,2.04,0,2.56,.34,1.16,colors.body);
  for(const s of [-1,1]){
    part(s*2.47,.70,0,.48,.54,1.24,colors.rim);
    part(s*2.65,.94,0,.35,.37,.94,colors.circuit);
    part(s*2.41,1.26,0,.32,.28,1.44,colors.rim);
    for(const u of [-1.60,-.52,.52,1.60]){
      part(u,.91,s*.85,.88,.74,.22,0x172936);
      part(u,1.01,s*.98,.76,.39,.12,isMarket?colors.paper:colors.circuit);
      part(u,.59,s*.995,.60,.13,.12,colors.rim);
      part(u+.43,1.35,s*.88,.16,.63,.32,colors.rim);
    }
    part(s*1.31,2.3,0,.38,.56,.52,colors.rim);
    part(s*1.31,2.62,0,.84,.25,.82,0x29343f);
    part(s*1.31,.27,s*.64,.8,.16,.16,colors.hot);
  }
  if(isMarket)for(const u of [-1.12,0,1.12])part(u,1.65,0,.24,.42,1.84,colors.hot);
  const cube=new T.BoxGeometry(),norm=cube.attributes.normal,shade=[];
  for(let i=0;i<norm.count;i++){
    const value=norm.getY(i)>.5?1:norm.getY(i)<-.5?.42:norm.getX(i)<-.5?.67:norm.getZ(i)<-.5?.77:.90;
    shade.push(value,value,value);
  }
  cube.setAttribute('color',new T.Float32BufferAttribute(shade,3));
  const skin=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  skin.name='夜递 / 车体烤漆与窗灯';
  const mesh=new T.InstancedMesh(cube,skin,cells.length),m=new T.Matrix4(),col=new T.Color();
  for(const [i,[x,y,z,w,h,d,tint]] of cells.entries()){
    m.makeScale(w,h,d).setPosition(x,y,z);mesh.setMatrixAt(i,m);
    mesh.setColorAt(i,col.setHex(tint));
  }
  mesh.computeBoundingSphere();
  return mesh;
}

// Horizontal rail carries the active motor above the car. Separate dock jaws
// leave the loading aperture open. No columns are put into the traffic lane.
function deliveryLine(api,{axis,start,end,across,height,anchors,docks,colors,name,phase,marketLoad}){
  const f=frame(api,axis,start,across),{box:B,solid:S}=f,length=end-start;
  S(steel,length/2,height,0,length,.64,1.28,colors.body);
  for(const s of [-1,1]){
    B(steel,length/2,height+.38,s*.43,length,.28,.46,colors.rim);
    for(let u=0;u<length-.1;u+=7.68){
      const w=Math.min(7.68,length-u),center=u+w/2;
      B(lamp,center,height-.03,s*.66,w-.14,.21,.12,colors.rim);
      if(w>1.1)B(lamp,center-w*.2,height-.02,s*.735,w*.52,.17,.09,colors.circuit);
    }
  }
  for(const [along,wall] of anchors){
    const u=along-start,v=wall-across,dir=Math.sign(v);
    S(steel,u,height+.74,v*.5,1.08,.80,Math.abs(v)+.8,colors.body);
    B(enamel,u,height+1.22,v*.52,.67,.32,Math.abs(v)+.90,colors.rim);
    for(let j=0;j<4;j++){
      const reach=Math.min(Math.abs(v),4.48-j*.96);
      S(steel,u,height+.22-j*.48,v-dir*reach/2,1.28-j*.16,.48,reach,colors.rim);
    }
    for(const side of [-1,1])B(lamp,u+side*.59,height+.68,v*.63,.12,.23,Math.abs(v)*.64,colors.circuit);
    B(steel,u,height+.46,0,1.44,1.10,1.68,colors.rim);
  }
  for(const [along,side] of docks){
    const u=along-start;
    for(const s of [-1,1]){
      S(steel,u,height-.35,s*1.61,6.40,1.28,.96,colors.body);
      for(let j=0;j<3;j++){
        const v=s*(1.52+j*.32);
        B(enamel,u,height-.95-j*.32,v,6.72-j*.64,.32,.72,colors.rim);
      }
      for(const q of [-1,1]){
        B(steel,u+q*2.72,height-1.66,s*1.62,.64,2.24,.64,colors.body);
        B(lamp,u+q*2.72,height-1.55,s*1.99,.44,1.64,.19,colors.circuit);
      }
      B(lamp,u,height-.50,s*2.12,4.48,.39,.16,colors.circuit);
    }
    B(steel,u,height+.58,0,6.72,.52,4.16,colors.body);
    B(lamp,u-.96,height+.88,side,3.20,.13,.48,colors.hot);
    f.point(u,height-2.13,side*1.9,colors.circuit,110,13);
  }
  const car=parcelGeometry(colors,marketLoad);
  car.name=name;car.rotation.y=axis==='x'?0:Math.PI/2;api.scene.add(car);
  const left=docks[0][0]-start,right=docks[docks.length-1][0]-start;
  const travel=(right-left)/3.2,hold=3,oneWay=travel+hold;
  function update(dt,time){
    // One shuttle, two true terminal stops. Ease for the first/last 12%
    // without reversing the carriage or teleporting it back to a depot.
    const t=((time+phase)%(oneWay*2)),leg=t<oneWay?t:t-oneWay;
    let q=Math.min(1,Math.max(0,(leg-hold)/travel)),ease=.12;
    q=q<ease?q*q/(2*ease*(1-ease)):q>1-ease?1-(1-q)*(1-q)/(2*ease*(1-ease)):(q-ease/2)/(1-ease);
    const u=t<oneWay?left+(right-left)*q:right-(right-left)*q;
    car.position.set(...f.p(u,height-2.93,0));
  }
  update(0,0);return update;
}

// A real street-facing sorting chest. Backing runs flush with the masonry.
// The lit bins sit behind a tooth-shaped cast lip. An external drum gives
// both the approaching and departing pedestrian a readable side silhouette.
function sortingWall(api,{axis,at,wall,dir,bays,base=1,colors,title,sub,cold}){
  const {box:B,p,point,label}=frame(api,axis,at,wall);
  const d=dir,length=bays*1.60;
  B(steel,0,base+1.34,d*.24,length+.48,2.68,.48,colors.body);
  api.collider(...p(0,base+1.34,d*.51),
    axis==='x'?length+.50:1.02,2.68,axis==='x'?1.02:length+.50);
  for(const [j,y] of [[0,.16],[1,2.48]]){
    B(enamel,0,base+y,d*.44,length+.80,.32,.88,colors.rim);
    B(lamp,0,base+y+(j?-.13:.13),d*.91,length+.30,.13,.10,colors.circuit);
  }
  for(let i=0;i<bays;i++){
    const u=(i+.5)*1.6-length/2,left=i%3===1;
    B(steel,u,base+1.35,d*.52,1.50,1.92,.48,colors.body);
    if(left){
      for(let row=0;row<3;row++){
        const w=[.72,1.28,.72][row];
        B(lamp,u,base+.94+row*.35,d*.79,w,.34,.12,colors.circuit);
        B(steel,u,base+.94+row*.35,d*.89,w*.40,.19,.16,colors.body);
      }
      B(lamp,u,base+1.35,d*1.006,.26,.40,.12,colors.paper);
    }else{
      B(lamp,u,base+1.47,d*.77,1.32,1.42,.16,cold?0x367a86:0x315e76);
      for(let row=0;row<3;row++){
        const width=.48+.16*((row+i)%3);
        B(lamp,u-.56+width/2,base+1.15+row*.32,d*.88,width,.15,.14,
          row===2?colors.paper:colors.circuit);
      }
      B(steel,u+.44,base+.93,d*.91,.25,1.32,.20,colors.body);
    }
    B(steel,u-.78,base+1.35,d*.54,.24,2.24,.97,colors.rim);
    B(lamp,u-.78,base+2.15,d*1.05,.20,.37,.10,colors.hot);
  }
  if(title){
    B(steel,0,base+2.95,d*.53,length*.90,.78,.72,colors.body);
    label(0,base+2.95,d*.91,length*.87,.70,title,sub,cold?'#8cf5ed':'#ffc98b',dir);
  }
  point(0,base+1.7,d*1.07,colors.circuit,54,8.5);
}

// Projecting exchange rotor above the record-shop end of the old avenue.
// The rotor has an actual through-hole. Three separated load rings sit
// on a common iron shaft; the teeth and mounts reach back into the brick bay.
function streetBatteryPress(api){
  const f=frame(api,'x',-6.72,19.20),{box:B,solid:S}=f;
  const cy=7.36,grid=.48,iron=0x516674,orange=0xec724e;
  // Cantilever from the west building with its base below the machine.
  for(const z of [-2.24,2.24]){
    S(steel,-5.28,5.12,z,8.32,.80,1.25,iron);
    for(let j=0;j<5;j++){
      const l=5.12-j*.80;
      S(steel,-9.12+l/2,4.56-j*.32,z,l,.32,1.12,iron);
    }
    B(lamp,-4.96,5.08,z+.72,6.72,.22,.15,0x38767f);
  }
  // Narrow knee and band of glass are the operator's booth, behind the rotor.
  S(steel,-5.75,7.36,0,3.20,4.16,6.08,post.body);
  for(const s of [-1,1]){
    B(lamp,-5.9,7.36,s*3.10,2.85,1.76,.16,0x32819a);
    for(const u of [-6.56,-5.60,-4.64])B(enamel,u,7.36,s*3.22,.19,2.06,.32,post.rim);
    B(enamel,-5.72,8.86,s*2.88,4.16,.48,1.28,post.rim);
    B(lamp,-5.72,8.54,s*3.40,2.88,.21,.26,post.paper);
  }
  const ringRows=[3,4,5,6,6,6,6,6,6,6,5,4,3];
  for(const [row,outer] of ringRows.entries()){
    const y=cy+(row-6)*grid;
    const inner=[-1,-1,1,2,3,3,3,3,3,2,1,-1,-1][row];
    const spans=inner>=0?[[-outer,-inner-1],[inner+1,outer]]:[[-outer,outer]];
    for(const [a,b] of spans){
      const u=(a+b)*grid/2,w=(b-a+1)*grid;
      S(steel,u,y,0,w,grid,3.20,iron);
      for(const side of [-1,1]){
        B(lamp,u,y,side*1.69,w-.026,grid-.025,.21,row%4===1?0x6b4340:0x47434a);
        B(enamel,u,y,side*2.05,w-.022,grid-.025,.42,0xb19b7d);
        B(lamp,u,y,side*2.31,w-.08,grid-.072,.17,orange);
        if(inner>=0&&row%2===0){
          const edge=a>0?a:b;
          B(lamp,edge*grid,y,side*2.50,grid*.85,grid*.78,.32,0xffc685);
        }
      }
    }
  }
  for(const u of [-2.40,2.40]){
    S(steel,u,4.47,0,1.12,1.28,4.48,post.body);
    B(lamp,u,4.20,2.32,.80,.48,.16,post.circuit);
    B(steel,u,9.74,0,1.12,.96,4.48,iron);
  }
  for(const s of [-1,1]){
    B(steel,-.16,4.44,s*2.65,5.76,.92,.46,post.body);
    f.label(-.16,4.47,s*2.90,5.42,.77,'旧城换电','循环使用　/　公共蓄能', '#ffc48a',s);
    f.point(-.7,6.48,s*2.9,0xff944a,145,14);
  }
  // Cool battery spines are visible through the hole and along either side.
  for(const u of [-.86,0,.86])for(let j=0;j<4;j++)
    B(lamp,u,cy+(j-1.5)*.60,-.10,.48,.46,1.06,j===1||j===2?post.circuit:0x51858a);
}

// The ice works facing Fulton 7 has an open cutting floor, overhead cold
// lockers and a checkerboard of individually removable eutectic ice blocks.
// Thick ceramic fingers make the sagging mechanical soffit visible from below.
function fultonIceWorks(api){
  const f=frame(api,'z',73.28,10.52),{box:B,solid:S}=f;
  const w=9.60,wall=0x536874;
  for(const [y,reach] of [[3.82,4.16],[7.34,4.96],[10.62,3.20]]){
    S(steel,0,y,-reach/2,w+.64,.52,reach,wall);
    B(enamel,0,y+.29,-reach+.16,w+1.28,.32,1.28,0xb6bcb0);
    B(lamp,0,y-.29,-reach+.14,w-.64,.14,.48,0x77d3ce);
    for(let j=0;j<7;j++){
      const u=(j-3)*1.32,depth=j%2?1.60:2.24;
      B(steel,u,y-.51,-reach+depth/2,.64,.40,depth,market.body);
      B(lamp,u,y-.71,-reach+.69,.40,.11,.64,j%3?0x538879:0xffcc87);
    }
  }
  for(const s of [-1,1]){
    S(steel,s*(w/2-.40),7.28,-.72,.64,6.72,1.92,wall);
    for(let j=0;j<4;j++)B(enamel,s*(w/2-.32),6.83-j*.36,-(3.84-j*.72)/2,
      .92,.37,3.84-j*.72,0xa4b4ae);
  }
  // Stagger the two levels. The lower level contains a simple cutting press;
  // occupied depth remains visible between the foreground fins and its back.
  B(lamp,.32,5.46,-.26,w-1.44,2.36,.32,0x2e666f);
  for(const u of [-3.36,-.48,2.4]){
    B(steel,u,4.47,-1.84,2.08,.74,1.92,market.body);
    B(enamel,u,4.93,-2.12,2.20,.23,2.17,market.rim);
    for(let h=0;h<3;h++)B(lamp,u+(h===2?.24:0),5.20+h*.36,-2.16,
      h===2?.80:1.28,.34,1.03,h===1?0x79b8b4:0xb1d8d0);
    B(steel,u-.96,5.88,-1.47,.31,1.88,.46,wall);
    B(enamel,u-.48,6.72,-1.88,1.29,.33,1.15,market.rim);
  }
  for(let row=0;row<3;row++)for(let i=0;i<7;i++){
    const u=(i-3)*1.22+.14*(row%2),y=7.96+row*.84,reach=1.12+.32*((i+row)%3);
    B(steel,u,y,-reach/2,1.18,.80,reach,wall);
    B(lamp,u,y,-reach-.08,.93,.56,.18,(i+2*row)%5===0?0xffb585:row===1?0x4ba89f:0x749cb0);
    B(enamel,u+.46,y-.24,-reach-.15,.20,.20,.26,market.rim);
  }
  B(steel,2.60,6.66,-4.37,4.80,.83,.64,market.body);
  f.label(2.60,6.66,-4.73,4.51,.70,'七街制冰','当日切冰　/　夜间冷运','#c3fff0',-1);
  f.point(.48,5.78,-3.52,0x76e0d8,136,14);
}

// New cooperative workshops occupy the air rights of actual adjoining
// lots. Each deep return has machinery facing the main street and a visible
// end wall towards the service lane. The shop threshold below stays open.
const trades={
  synth:{title:'义体校配',sub:'适配托架  /  夜间留诊',tone:0x49ddcb,glass:0x365f7c,edge:0xf392a8,light:0xf4d6a3},
  dye:{title:'通宵制版',sub:'小单印染  /  对色留样',tone:0xf48d62,glass:0x8b4a62,edge:0xd786ed,light:0xffe4a4},
  cells:{title:'旧芯再生',sub:'检修  /  循环周转',tone:0x61d1ec,glass:0x465b7b,edge:0xe2ac55,light:0xbbf4e4}
};
function cooperative(api,axis,u,v,d,kind,n,base,signTitle,light=true){
  const f=frame(api,axis,u,v),{box:B,solid:S}=f;
  const {tone,edge,glass,sub,light:opal}=trades[kind],pitch=2.24,w=n*pitch;
  // Back wall, two interlocking cantilever courses and a toothed top. The
  // sill is the deepest block. All moving traffic remains below the sill.
  const reach=kind==='synth'?3.2:kind==='dye'?3.84:2.56;
  S(steel,0,base+1.68,d*.34,w+.64,3.36,1.16,0x506078);
  for(const [j,y] of [[0,base],[1,base+3.52]]){
    const depth=reach+(j===0?.64:0);
    S(steel,0,y,d*depth/2,w+.64,.47,depth,0x5d6570);
    B(enamel,0,y+.23,d*(depth-.20),w+.96,.32,1.04,0xa5a7a4);
    B(lamp,0,y+.09,d*(depth+.37),w+.42,.22,.18,j===0?glass:tone);
    for(let i=0;i<n;i++){
      const xx=(i-(n-1)/2)*pitch;
      B(steel,xx,y-.35,d*(depth-.80),1.25,.40,1.92,0x78818a);
      B(lamp,xx,y-.58,d*(depth-.84),.77,.12,1.02,(i+j)%3===0?opal:glass);
    }
  }
  for(let i=0;i<n;i++){
    const xx=(i-(n-1)/2)*pitch,front=reach-.36,slit=i%2===0;
    B(lamp,xx,base+1.77,d*.98,pitch-.12,2.64,.20,glass);
    B(enamel,xx-pitch/2+.14,base+1.84,d*.92,.36,3.35,1.92,0xadb2a9);
    if(kind==='synth'){
      // Medical cradle and jointed examination lamp in a partly open bay.
      B(steel,xx,base+.74,d*1.97,1.90,.55,2.00,0x6f7679);
      B(lamp,xx,base+1.09,d*2.35,1.53,.32,1.30,slit?0x85a39a:0x81b1ad);
      B(enamel,xx-.62,base+1.37,d*1.95,.40,.45,1.40,0xa7abab);
      B(steel,xx+.65,base+2.08,d*1.57,.22,1.75,.32,0x8993a1);
      B(enamel,xx+.39,base+2.84,d*1.91,.76,.23,.96,0xb1b6b1);
      B(lamp,xx+.14,base+2.68,d*2.24,.70,.15,.46,opal);
    }else if(kind==='dye'){
      // End of an octagonal fabric roll with a square spindle opening.
      const strips=[.80,1.44,1.76,1.76,1.44,.80];
      for(let j=0;j<strips.length;j++){
        const y=base+.77+j*.32;
        B(steel,xx,y,d*1.92,strips[j],.32,1.76,0x667380);
        B(lamp,xx,y,d*2.86,strips[j]-.07,.30,.18,i%2?edge:tone);
        if(j===2||j===3)B(steel,xx,y,d*3.02,.64,.32,.23,0x4b4a54);
      }
    }else{
      // Retired power cells are racked horizontally, each in its own clamp.
      for(let j=0;j<3;j++){
        const y=base+.79+j*.77;
        B(steel,xx,y,d*1.77,1.98,.64,1.22,0x69707b);
        B(lamp,xx+.08,y,d*2.47,1.50,.36,.24,j===0?edge:tone);
        B(enamel,xx-.56,y,d*2.52,.22,.63,.37,0xafb9ac);
      }
    }
    B(steel,xx-pitch*.46,base+1.65,d*front,.32,3.07,.64,0x747b89);
    B(lamp,xx-pitch*.46,base+2.71,d*(front+.38),.23,.75,.15,opal);
  }
  // A dimensional vertical trade symbol projects at right angles to the
  // façade. The stacked bars are visible looking up or down the block.
  const end=(n%2?1:-1)*(w/2-.42);
  S(steel,end,base+2.81,d*(reach-.06),.58,4.48,2.62,0x525a66);
  for(let j=0;j<5;j++){
    const y=base+1.28+j*.70,size=[.80,1.30,1.83,1.30,.80][j];
    for(const side of [-1,1]){
      B(lamp,end+side*.37,y,d*(reach+.25),.20,.49,size,j===2?opal:tone);
      if(j===2)B(lamp,end+side*.51,y,d*(reach+.25),.13,.25,size*.38,edge);
    }
  }
  B(steel,end*.22,base+3.88,d*(reach-.01),w*.79,.82,.77,0x69707b);
  f.label(end*.22,base+3.88,d*(reach+.40),w*.75,.63,signTitle,sub,kind==='synth'?'#a1f6da':kind==='dye'?'#ffc097':'#acf2f0',d);
  if(light)f.point(0,base+1.6,d*(reach-.36),tone,84,10.8);
}

function oldShopRows(api){
  // Both frontages of the outer cross street and the northern approach.
  // Switch repair on the ground floor, co-operative workplaces upstairs.
  for(const args of [
    ['x',-37.15,-10.65,1,'synth',4,3.70,'夜班义体诊所'],
    ['x',-25.72,-10.65,1,'cells',3,5.44,'桥西电修',false],
    ['x',-35.72,10.65,-1,'dye',4,5.16,'铜版照相馆'],
    ['x',18,-10.65,1,'cells',3,4.26,'电轮周转',false],
    ['x',26.48,10.65,-1,'synth',3,4.74,'夜间配镜'],
    ['z',-49.28,-10.65,1,'dye',4,3.90,'北街夜印'],
    ['z',-42.3,10.65,-1,'cells',3,7.92,'北站储能',false],
    ['z',43.36,-10.65,1,'cells',3,5.76,'回收寄存',false],
  ])cooperative(api,...args);
}

function marketShopRows(api){
  // Western service street, both directions on the big east–west streets,
  // the south return, eastern loop and the narrower lanes inside the blocks.
  for(const args of [
    ['x',-34.20,117.69,1,'dye',5,3.59,'西埠染织合作社'],
    ['x',-17.2,136.2,-1,'cells',5,3.76,'旧芯拆解'],
    ['x',17.65,118,1,'synth',4,4.61,'织手校配',false],
    ['x',-16.8,92.70,-1,'dye',4,4.29,'春市分色房',false],
    ['x',-17.8,78.12,1,'cells',3,8.29,'职工充电间',false],
    ['x',-18.81,154.8,-1,'dye',4,4.45,'南环夜报'],
    ['x',17.22,142.2,1,'cells',4,4.54,'南街电工房',false],
    ['z',69.34,-55.70,1,'dye',4,4.09,'西街纬线'],
    ['z',112.42,-55.70,1,'synth',3,5.06,'夜班保健室',false],
    ['z',142.24,-55.70,1,'dye',4,3.66,'木刻转印'],
    ['z',110.40,-39.60,-1,'cells',3,4.96,'印辊调速房',false],
    ['z',107.75,66.8,-1,'dye',4,4.40,'东环织印'],
    ['z',151.42,69.36,-1,'cells',3,4.14,'夜班车行',false],
    ['z',111.72,-23.85,-1,'dye',3,4.58,'后巷试布房',false],
    ['x',43.2,114.40,-1,'cells',3,4.61,'回收箱电检',false],
  ])cooperative(api,...args);
}

// Under the original concrete viaduct, the night workshops share a moving
// hoist. A lit pickup mouth is repeated against each actual repair bench.
function repairHoist(api){
  const f=frame(api,'x',0,-28.6),{box:B,solid:S}=f;
  for(const side of [-1,1]){
    const v=side*1.47;
    S(steel,-24.7,4.53,v,28.70,.36,.56,post.body);
    for(let i=0;i<7;i++){
      const u=-37+i*4.16;
      B(steel,u,5.20,v,.34,1.20,.56,post.rim);
      B(lamp,u,4.38,v-side*.31,2.62,.24,.27,i%3===1?post.hot:post.circuit);
      B(enamel,u-1.55,4.50,v,.64,.55,.74,post.rim);
    }
  }
  for(const [u,hue] of [[-34.24,post.circuit],[-25.6,post.hot],[-14.72,post.circuit]]){
    S(steel,u,4.93,0,.64,.56,3.46,post.body);
    // The working jaws leave a broad opening under a luminous stepped arch.
    for(const s of [-1,1])for(let j=0;j<3;j++){
      B(steel,u,4.53-j*.32,s*(.78+j*.32),.69,.36,.54,post.rim);
      B(lamp,u-.39,4.53-j*.32,s*(.78+j*.32),.16,.28,.43,hue);
      B(lamp,u+.39,4.53-j*.32,s*(.78+j*.32),.16,.28,.43,hue);
    }
    f.point(u,4.05,.90,hue,68,8);
  }
  sortingWall(api,{axis:'x',at:-33.28,wall:-32.64,dir:1,bays:3,base:.55,colors:post,title:'街坊寄修',sub:'通宵收件　/　回收旧芯'});
  sortingWall(api,{axis:'x',at:-14.40,wall:-33.84,dir:1,bays:3,base:.58,colors:post});
  sortingWall(api,{axis:'x',at:26.4,wall:22.72,dir:1,bays:2,base:4.15,colors:post,title:'洗晒回收线',sub:'住户转运'});
}

export function buildOldNightPost(api){
  repairHoist(api);
  streetBatteryPress(api);
  oldShopRows(api);
  const c={colors:post,marketLoad:false};
  const north=deliveryLine(api,{...c,axis:'z',start:-13,end:43,across:1.28,height:11.84,
    anchors:[[-9,-12],[13,12],[29.8,10.8],[41,-11.8]],docks:[[-9,1],[38,-1]],phase:8,name:'里巷夜邮 / 南北摆渡'});
  const cross=deliveryLine(api,{...c,axis:'x',start:-41,end:42,across:-2.88,height:17.60,
    anchors:[[-37,-12],[-17,-12],[17,12],[37,-12]],docks:[[-35,-1],[35,1]],phase:20,name:'里巷夜邮 / 横街总线'});
  sortingWall(api,{axis:'z',at:-40.3,wall:10.66,dir:-1,bays:4,base:3.8,colors:post,title:'南北夜邮',sub:'信号楼　/　机件急送'});
  return (dt,time)=>{north(dt,time);cross(dt,time);};
}

function marketCourt(api){
  // The west face of the kitchen stair is a closed brick wall from z54–64.
  // Keep the entire existing stair and its handrails clear.
  sortingWall(api,{axis:'z',at:58.4,wall:23.45,dir:1,bays:5,base:.53,colors:market,title:'夜班保鲜仓',sub:'当夜到货　/　分格取件',cold:true});
  const f=frame(api,'x',26.56,0),{box:B,solid:S}=f;
  for(const [z,y] of [[55.5,4.75],[65.76,7.52],[75,9.28]]){
    for(const s of [-1,1]){
      const u=s*2.02;
      // Overhead scanners follow the rise of the market stairs. Their wide
      // jaws attach to neighbouring façades and remain open in the centre.
      S(steel,u+s*1.10,y+.1,z,2.56,.56,1.32,market.body);
      for(let j=0;j<3;j++){
        B(steel,u+s*j*.32,y-.24-j*.32,z,.64,.48,1.21,market.rim);
        for(const dir of [-1,1])B(lamp,u+s*j*.32,y-.24-j*.32,z+dir*.66,.58,.33,.16,j===0?market.paper:market.circuit);
      }
    }
    B(steel,0,y+.42,z,4.48,.42,.96,market.body);
    for(const dir of [-1,1])B(lamp,0,y+.35,z+dir*.54,3.52,.28,.16,market.circuit);
    f.point(0,y-.27,z,0xc682ff,72,9.3);
  }
  sortingWall(api,{axis:'z',at:68.48,wall:43.68,dir:-1,bays:3,base:.56,colors:market,title:'冷链退筐',sub:'周转筐　夜间回收',cold:true});
  sortingWall(api,{axis:'x',at:37.76,wall:117.63,dir:1,bays:3,base:3.96,colors:market,title:'布巷取样',sub:'数码校色 / 当班印染'});
  // The opposite face borders the stair landing only 1.36 m away. Keep
  // sample drawers shallow so people can turn a handcart past the landing.
  const rear=frame(api,'x',35.68,114.39);
  for(let j=0;j<8;j++){
    const u=(j-3.5)*.80,colour=[0x708e9d,0xb28587,0xb38e57,0x657b98][j%4];
    rear.box(steel,u,1.68,-.14,.78,2.24,.28,market.body);
    for(let row=0;row<4;row++){
      rear.box(lamp,u,1.05+row*.40,-.30,.64,.31,.15,row===3?market.paper:colour);
      rear.box(enamel,u+.16,1.03+row*.40,-.405,.23,.12,.11,market.rim);
    }
  }
  rear.solid(steel,0,1.72,-.17,6.40,2.24,.36,market.body);
  rear.box(steel,.16,3.05,-.22,6.72,.64,.48,market.body);
  rear.label(.16,3.06,-.48,6.28,.50,'布庄留样','印染色号　　夜班校色台','#f8c79f',-1);
  rear.point(0,2.26,-.61,0xecad8a,37,6);
  sortingWall(api,{axis:'z',at:97.6,wall:-55.69,dir:1,bays:3,base:3.80,colors:market,title:'旧芯折价',sub:'苏荷电器维修'});
  sortingWall(api,{axis:'z',at:140.4,wall:66.79,dir:-1,bays:3,base:3.8,colors:market,title:'夜宵提餐',sub:'空轨送达 / 凭号取餐'});
}

export function buildMarketColdChain(api){
  marketCourt(api);
  fultonIceWorks(api);
  marketShopRows(api);
  const c={colors:market,marketLoad:true};
  const north=deliveryLine(api,{...c,axis:'z',start:56,end:147,across:1.44,height:12.96,
    anchors:[[58.8,11.3],[70.3,11.3],[98.7,-11.2],[113.2,8.8],[140,-14.4]],
    docks:[[60.1,1],[141.1,-1]],phase:15,name:'七街冷链 / 纵向冷运车'});
  const cross=deliveryLine(api,{...c,axis:'x',start:-54,end:64,across:127.52,height:8.96,
    anchors:[[-54,116],[-35,118],[-17,117],[15,117],[36.80,117.6],[62,136.9]],
    docks:[[-48,-1],[58,1]],phase:29,name:'七街冷链 / 横街保冷车'});
  return (dt,time)=>{north(dt,time);cross(dt,time);};
}
