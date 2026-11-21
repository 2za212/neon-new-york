import * as T from 'three';

export const schoolCourt={x:123,z:-86};
export const schoolMeterZ=schoolCourt.z-1.92;
const yaw=-Math.PI/2;

export function buildSchool({box:B,collider:C,surface,sign,registerProperty},scene,localLights){
  const teal=0x538e87,clay=0xb27e68,cream=0xdbcfad,iron=0x526b75;
  function mass(mat,x,y,z,w,h,d,tint){
    B(mat,x,y,z,w,h,d,tint);C(x,y,z,w,h,d);
  }
  function floor(mat,x,z,w,d,top,tint){
    B(mat,x,top-.09,z,w,.18,d,tint);surface(x-w/2,x+w/2,z-d/2,z+d/2,top);
  }
  floor('paver',112,-86,56,48,.32,0xa9b2aa);
  // Street gate opens onto the covered cross-passage and the old court beyond.
  for(const s of [-1,1]){
    mass('brickBrown',85,1.24,-86+s*15.2,1.12,1.84,17.6,clay);
    B('titaniumSkin',85,2.28,-86+s*15.2,1.44,.24,17.7,teal);
    mass('brickBrown',88.2,2.50,-86+s*5.2,1.92,4.36,1.92,clay);
    for(let i=0;i<3;i++)B('ceramicShell',88.2,4.72+i*.32,-86+s*(5.2-i*.32),2.24+i*.32,.32,2.24+i*.64,cream);
    B('lamp',87.18,2.78,-86+s*5.2,.12,1.60,.48,0xffcd87);
  }
  mass('titaniumSkin',88.2,5.84,-86,3.52,1.28,13.44,teal);
  sign(86.36,5.91,-86,9.92,1.06,'东衡中学','旧交易所街区   /   西门','#efd8ae',yaw);
  // Perimeter at the three outer edges of the school parcel.
  mass('brickBrown',112,1.44,-109.68,56,2.24,.64,clay);
  for(const [left,right] of [[84,112.6],[117.4,140]])mass('brickBrown',(left+right)/2,1.44,-62.32,right-left,2.24,.64,clay);
  for(const x of [112.4,117.6])mass('ceramicShell',x,1.94,-62.32,.64,3.24,.96,teal);
  B('metal',115,3.76,-62.32,6,.48,.96,iron);
  sign(115,3.78,-61.81,4.64,.48,'东衡中学 · 南门','步行通道','#a6e5d8',0);
  mass('brickBrown',139.68,1.44,-86,.64,2.24,46.72,clay);
  for(let z=-107;z<-63;z+=4.16)B('ceramicShell',139.68,2.18,z,.96,3.52,.96,cream);

  // Two teaching wings straddle a clear six-metre corridor. The nearest
  // science room opens sideways off it, with desks behind a real doorway.
  const x=101.6;
  for(const s of [-1,1]){
    const z=-86+s*11.84;
    registerProperty?.('school-wing-'+s,s<0?'理科楼 · 物理实验室':'南教学楼 · 二年一班','东衡中学',x,z+8.32,11.52,16.64,0);
    const storeys=s<0?2:3,upperHeight=(storeys-1)*2.88;
    mass('brickBrown',x,4.0+upperHeight/2,z,11.52,upperHeight,16.64,clay);
    mass('brickBrown',x,2.16,-86+s*19.84,11.52,3.68,.64,clay);
    for(const side of [-1,1])mass('brickBrown',x+side*5.44,2.16,z,.64,3.68,16.00,clay);
    for(const part of [-1,1])mass('brickBrown',x+part*3.84,2.16,-86+s*3.84,3.84,3.68,.64,clay);
    for(const side of [-1,1]){
      for(let row=0;row<storeys;row++)for(let col=0;col<4;col++){
        const zz=z+(col-1.5)*3.84,xx=x+side*5.83,y=2.22+row*2.80;
        B('metal',xx,y,zz,.32,1.92,3.36,iron);
        B(s<0?'roomLab':'roomClass',xx+side*.21,y,zz,.16,1.44,2.96,cream);
        B('titaniumSkin',xx+side*.38,y,zz,.16,1.60,.16,teal);
        B('ceramicShell',xx+side*.36,y-.98,zz,.96,.32,3.68,cream);
      }
      B('titaniumSkin',x+side*6.20,4.08,z,1.44,.48,17.28,teal);
    }
    for(let i=0;i<3;i++)B('ceramicShell',x,4.08+upperHeight+i*.32,z,12.80-i*.64,.32,17.28-i*.64,i===1?teal:cream);
    for(const dx of [-2.8,1.2])for(let j=0;j<3;j++){
      const zz=-86+s*(7.36+j*3.36);
      mass('wood',x+dx,1.20,zz,1.76,.16,.96,0xb69268);
      for(const leg of [-.64,.64]) B('metal',x+dx+leg,.78,zz,.16,.72,.64,iron);
      mass('wood',x+dx,.66,zz+s*.96,.80,.64,.64,teal);
    }
    B('metal',x,2.41,-86+s*19.37,6.40,1.92,.16,teal);
    sign(x,2.42,-86+s*19.17,4.80,1.04,s<0?'电磁感应':'夜自习','周三 · 物理实验组','#a8dac9',s<0?0:Math.PI);
    sign(x+2.91,2.72,-86+s*3.37,2.96,.72,s<0?'物理实验室':'二年一班','理科楼  ·  一层','#c0ddd0',s<0?0:Math.PI);
  }
  mass('titaniumSkin',x,4.86,-86,12.16,1.12,7.20,teal);
  for(let i=0;i<5;i++)B('lamp',96.8+i*2.40,4.23,-86,.64,.12,2.56,cream);
  // A stepped clock tower identifies the school from beyond the street gate.
  mass('brickBrown',101.6,8.30,-99.5,5.76,2.94,5.12,clay);
  mass('brickBrown',101.6,11.92,-99.5,5.76,4.32,5.12,clay);
  for(let i=0;i<3;i++)B('ceramicShell',101.6,14.24+i*.32,-99.5,6.72-i*.64,.32,6.08-i*.64,cream);
  B('titaniumSkin',98.61,11.96,-99.5,.28,3.20,3.20,teal);
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;B('lamp',98.39,11.96+1.18*Math.cos(a),-99.5+1.18*Math.sin(a),.12,.20,.20,cream);
  }
  B('metal',98.26,12.38,-99.5,.12,.96,.16,cream);B('lamp',98.18,11.99,-99.11,.08,.12,.88,cream);

  const rubber=new T.MeshStandardMaterial({color:0x84a7a0,emissive:0x102926,roughness:.94,vertexColors:true});
  floor(rubber,123,-86,25.60,32,.44,0x829b90);
  const paint=new T.MeshStandardMaterial({color:0xd8cfb1,emissive:0x514831,roughness:.88,vertexColors:true});
  for(const z of [-100.08,-86,-71.92])B(paint,123,.456,z,19.36,.032,.16,cream);
  for(const dx of [-9.76,9.76])B(paint,123+dx,.456,-86,.16,.032,28.32,cream);
  for(const s of [-1,1]){
    const post=-86+s*14.56;
    mass('titaniumSkin',123,2.06,post,.64,3.24,.64,teal);
    B('metal',123,3.68,post-s*.72,.48,.32,1.92,iron);
    B('ceramicShell',123,3.92,post-s*1.57,2.88,1.76,.24,cream);
    for(const dx of [-.4,.4])B('midtownBronze',123+dx,3.34,post-s*2.1,.12,.14,.88,clay);
    B('midtownBronze',123,3.34,post-s*2.54,.92,.14,.12,clay);
    for(const dx of [-2.56,2.56])B(paint,123+dx,.456,post-s*2.50,.16,.032,4.0,cream);
    B(paint,123,.456,post-s*4.48,4.96,.032,.16,cream);
  }
  for(let i=0;i<3;i++)mass('wood',135.2+i*.80,.70+i*.30,-86,.80,.52+i*.60,11.52,i===1?teal:0x9b8165);
  // The grandstand roof faces the court from the far touchline. Its stepped
  // ends frame the open playing surface when approached from either gate.
  for(let bay=-2;bay<=2;bay++){
    const z=-86+bay*3.84;
    mass('titaniumSkin',138.24,3.40,z,.48,6.08,.48,teal);
    for(let j=0;j<4;j++){
      B('ceramicShell',138.24-j*1.12,6.48+j*.32,z,1.28,.32,3.86,cream);
      B('titaniumSkin',138.24-j*1.12,6.21+j*.32,z,1.28,.22,.48,teal);
    }
    B('lamp',134.72,7.20,z,.24,.12,2.72,0xe5ddac);
  }
  // The south-gate walk follows the classroom wing before opening onto the court.
  for(let z=-79.6;z<=-63.6;z+=3.84){
    mass('titaniumSkin',112.96,2.03,z,.32,3.42,.48,teal);
    B('ceramicShell',111.84,3.88,z,3.52,.32,3.94,cream);
    B('titaniumSkin',113.52,3.62,z,.32,.24,3.90,teal);
  }
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12;
    B(paint,123+3.12*Math.cos(a),.48,-86+3.12*Math.sin(a),.64,.024,.16,cream,Math.PI/2-a);
  }
  // The induction coil and its meter belong to the physics club.
  const meterZ=schoolMeterZ;
  mass('metal',123,1.10,meterZ,1.60,1.32,.80,iron);
  B('coolWindow',123,1.32,meterZ+.44,1.12,.48,.16,0xb8e7d5);
  for(let i=0;i<3;i++)B('midtownBronze',123,1.95+i*.24,meterZ,1.28-i*.16,.16,.80-i*.16,0xbd9161);
  B('metal',123,2.52,meterZ,.20,1.92,.20,teal);
  sign(122.8,3.06,meterZ,3.20,.80,'感应线圈','物理社  /  夜间观测','#afdbce',yaw);
  function light(x,y,z,color,power,reach){
    const l=new T.PointLight(color,power,reach,2);l.position.set(x,y,z);l.userData.nightPower=power;
    scene.add(l);localLights.push(l);
  }
  for(const s of [-1,1]){
    light(86.72,3.32,-86+s*5.0,0xffc488,90,13);
    light(101.6,3.46,-86+s*9.6,0xffd29b,58,10);
    const xx=s<0?114.4:132,zz=-86+s*11.20;
    mass('titaniumSkin',xx,4.16,zz,.48,7.44,.48,teal);
    for(let i=0;i<3;i++)B('ceramicShell',xx-s*i*.32,7.76+i*.32,zz,.64+i*.64,.32,.96,cream);
    B('metal',xx-s*1.12,8.53,zz,2.56,.48,1.60,iron);
    for(let j=0;j<3;j++)B('coolWindow',xx-s*(.40+j*.64),8.23,zz,.48,.16,1.28,cream);
    light(xx-s*1.2,7.94,zz,0xb4dfdc,410,25);
  }
  light(123,2.58,meterZ,0x72d9cf,28,6);
  for(const zz of [-91,-81])mass('brickBrown',137.92,3.0,zz,.96,5.36,1.28,clay);
  B('metal',137.92,5.28,-86,1.60,3.84,12.32,teal);
  sign(137.0,5.72,-86,10.88,1.50,'东衡中学  校队训练场','晚训 19:30     /     留灯至 21:00','#efe4bf',yaw);
  return {id:'east-school',title:'东衡中学 · 观测球场',position:new T.Vector3(123,.44,-86)};
}
