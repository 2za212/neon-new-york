import * as T from 'three';

// A salvaged track-circuit receiver shares the train passage phase already
// used by the light in the window. Both cases are solid blocks with stepped
// returns. Ordinary walking and the calendar keep their existing sockets.
export function fitApartmentRadio(room,trainLight){
  const geometry=new T.BoxGeometry(1,1,1),colors=[];
  for(let i=0;i<geometry.attributes.normal.count;i++){
    const n=geometry.attributes.normal,shade=.78+.13*n.getY(i)+.058*n.getX(i)+.06*n.getZ(i);
    colors.push(shade,shade,shade);
  }
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const material=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  const pieces=[],lamps=[],matrix=new T.Matrix4(),turn=new T.Quaternion(),worldUp=new T.Vector3(0,1,0);
  const origin=new T.Vector3(),point=new T.Vector3(),size=new T.Vector3();
  const iron=0x33474a,paint=0x52706e,brass=0xb29367,wood=0x887051,ivory=0xcbb28a;
  let ambient=1;
  function block(x,y,z,w,h,d,color,live=-1){
    point.set(x,y,z).applyQuaternion(turn).add(origin);
    matrix.compose(point,turn,size.set(w,h,d));
    (live<0?pieces:lamps).push({matrix:matrix.clone(),color,live,ambient:live<0?ambient:1});
  }
  // Feet sit on the existing bench's 1.03 m top, clear of its angle lamp.
  origin.set(1.36,1.03,.90);turn.setFromAxisAngle(worldUp,-1.94);
  for(const x of [-.22,.22])for(const z of [-.10,.10])block(x,.025,z,.074,.05,.074,iron);
  block(0,.113,0,.55,.13,.29,paint);
  block(0,.177,0,.51,.079,.27,paint);
  for(const x of [-.27,.27])block(x,.13,.005,.037,.177,.30,wood);
  block(0,.121,.151,.46,.124,.036,iron);
  for(let i=0;i<5;i++)block(-.175+i*.026,.129,.174,.012,.074,.020,ivory);
  block(.070,.148,.173,.156,.044,.019,0x243f42);
  for(let j=0;j<3;j++)block(.017+j*.046,.149,.188,.031,.018,.012,0x85d1c1,j<2?j:-1);
  block(.173,.099,.179,.076,.062,.044,brass);
  block(.173,.108,.207,.037,.037,.025,ivory);
  block(-.17,.243,-.068,.034,.11,.034,brass);
  block(-.209,.294,-.068,.105,.023,.023,brass);
  block(-.252,.343,-.068,.021,.114,.021,brass);

  // This repeater is fixed to the brick mullion over the real window dial.
  origin.set(-2.67,2.12,-3.83);turn.identity();
  block(0,-.05,.027,.074,.28,.10,paint);
  block(0,.018,.085,.35,.205,.16,iron);
  block(0,.031,.163,.29,.14,.046,paint);
  block(0,.11,.124,.37,.053,.19,iron);
  for(const [j,x] of [-.069,.069].entries()){
    block(x,.026,.185,.083,.080,.044,0x243234);
    block(x,.026,.214,.054,.053,.021,0x7fc5bc,j);
  }
  // Reused traction cells supply the apartment during grid cuts. They plug
  // into the west brick pier beside the bed: no hardware spans the window.
  ambient=.45;
  origin.set(-4.70,0,-2.39);turn.setFromAxisAngle(worldUp,Math.PI/2);
  block(0,1.61,.08,1.84,2.34,.16,0x26383a);
  for(const u of [-.88,.88]){
    block(u,1.61,.17,.16,2.46,.22,0x587372);
    block(u,1.61,.31,.10,1.82,.11,0xad7950);
  }
  for(let row=0;row<3;row++){
    const y=.91+row*.67;
    block(0,y-.32,.26,1.82,.13,.41,0x576768);
    for(let col=0;col<2;col++){
      const u=col?.42:-.42;
      block(u,y,.20,.74,.53,.28,0x34484a);
      block(u,y,.37,.62,.41,.16,col===row%2?0x96744e:0x648a83);
      block(u,y,.47,.45,.29,.12,col===row%2?0xb49c72:0x91b2a2);
      block(u,y,.54,.30,.12,.06,0x253b40);
      block(u-.02,y,.58,.18,.065,.04,row===1?0xd1e6bc:0x87d0cc,row===1?col:-1);
      for(const s of [-1,1])block(u+s*.26,y+.19,.44,.10,.10,.12,0xb9b29a);
      for(const s of [-1,1])block(u+s*.24,y-.08,.46,.055,.16,.08,0x344549);
      block(u,y-.19,.49,.32,.065,.09,0x617175);
    }
  }
  for(let i=0;i<3;i++){
    block(0,2.71+i*.09,.27-i*.06,1.92-i*.18,.09,.49-i*.09,i===0?iron:paint);
    block(0,.49-i*.08,.26-i*.06,1.84-i*.20,.08,.47-i*.09,i===0?iron:paint);
  }
  block(-.48,2.86,.24,.76,.10,.18,0x98dfce);
  // Two insulated sections turn the corner above the existing bed canopy
  // and descend above the record console. Clamps, bends and ceramic joints
  // share the room's physical block courses.
  ambient=.26;turn.identity();origin.set(0,0,0);
  for(const [dy,color] of [[0,0x51746d],[.20,0x9f7149]]){
    block(-4.47,2.98+dy,2.04,.16,.14,8.77,color);
    block(-1.81,2.98+dy,6.39,5.48,.14,.16,color);
    block(.88,2.76+dy,6.39,.14,.46,.16,color);
    for(const z of [-2.15,-.99,.55,2.01,3.47,4.93,6.23])block(-4.49,2.98+dy,z,.25,.22,.16,0x405159);
    for(const x of [-3.90,-2.52,-1.12,.40])block(x,2.98+dy,6.41,.16,.22,.25,0x405159);
  }
  // The rear console measures both room circuits. Its deep stack clamps
  // frame the silent middle of the listening desk without hiding the records.
  ambient=.49;origin.set(.62,0,6.59);turn.setFromAxisAngle(worldUp,Math.PI);
  for(const s of [-1,1]){
    const u=s*1.18;
    block(u,1.93,.07,.69,1.29,.14,0x33444b);
    block(u,1.93,.18,.53,1.09,.17,0x507270);
    for(let j=0;j<4;j++){
      const width=.42-.06*(j%3);
      block(u,1.55+j*.23,.31,.54,.19,.21,j===0?brass:iron);
      block(u,1.58+j*.23,.43,width,.09,.07,j===3?0xe8bb7b:0x86c9bd,j===1?(s>0?1:0):-1);
    }
    block(u,2.59,.21,.74,.16,.36,0x839b91);
  }
  block(0,2.63,.13,2.74,.16,.18,0x45595a);
  // The incoming feeder and the removable household cells meet over the
  // stair. The live centre is visible through the cooling fins from the bed.
  // Its entire projection stays against the brick, above the door head.
  ambient=.56;origin.set(4.48,3.50,1.96);turn.setFromAxisAngle(worldUp,-Math.PI/2);
  block(0,.26,0,2.72,1.66,.16,0x23364b);
  for(const side of [-1,1]){
    block(side*.98,.28,.14,.64,1.86,.32,0x607582);
    block(side*1.17,.38,.34,.26,1.48,.24,0x9d7755);
    for(let i=0;i<6;i++){
      const y=-.42+i*.28;
      block(side*(.90+(i%2)*.08),y,.34,.62,.16,.32,i<2?0x8d634b:0x80989b);
    }
  }
  for(let row=0;row<7;row++){
    const y=-.43+row*.22,coreWidth=[.40,.80,1.12,1.28,1.12,.80,.40][row];
    block(0,y,.17,coreWidth+.24,.21,.24,0x294852);
    for(const hand of [-1,1]){
      const u=hand*coreWidth*.28;
      block(u,y,.33,coreWidth*.41,.14,.28,0x6ab5b5);
      block(u,y+.035,.48,coreWidth*.34,.065,.045,row%3===0?0x8bddda:0xc6fff3);
    }
    block(0,y,.43,.11,.22,.13,0x665849);
  }
  for(let j=0;j<3;j++){
    block(0,1.04+j*.16,.10,2.56-.64*j,.16,.48-j*.08,0x68808d);
    block(-.64+j*.16,1.46+j*.16,.05,.32,.18,.28,0xc08b56);
  }
  block(0,-.62,.20,2.52,.18,.48,0x263e4a);
  block(-.64,-.61,.47,.64,.085,.09,0xffb35b);
  // Armoured supply pipes leave the box and turn into the steel roof truss.
  for(const [i,u] of [-.66,-.19].entries()){
    block(u,1.85,.12,.22,.78,.22,i?0x556d70:0x906f51);
    block(u,2.18,.29,.22,.22,.54,0x57656c);
    block(u,2.18,1.85,.18,.18,2.64,i?0x556d70:0x906f51);
    for(const v of [.68,1.64,2.60])block(u,2.18,v,.26,.26,.12,0x36474f);
  }
  const build=(list,name)=>{
    const mesh=new T.InstancedMesh(geometry,material,list.length),tint=new T.Color();
    list.forEach((part,i)=>{mesh.setMatrixAt(i,part.matrix);mesh.setColorAt(i,tint.setHex(part.color).multiplyScalar(part.ambient));});
    mesh.name=name;mesh.computeBoundingSphere();room.add(mesh);return mesh;
  };
  build(pieces,'3B / 工作台短波机与窗框复示器');
  const signal=build(lamps,'3B / 高架轨道中继指示');
  const inactive=new T.Color(0x476d64),active=new T.Color(0xa4e6d2),tint=new T.Color();
  const last=[-1,-1];
  return function update(){
    const a=Math.round(trainLight.value.x*8),b=Math.round(trainLight.value.y*8);
    if(a===last[0]&&b===last[1])return;
    last[0]=a;last[1]=b;
    for(let i=0;i<lamps.length;i++){
      signal.setColorAt(i,tint.copy(inactive).lerp(active,last[lamps[i].live]/8));
    }
    signal.instanceColor.needsUpdate=true;
  };
}
