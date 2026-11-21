import * as T from 'three';

// Dry decks have shared edges at the throat, the two sides of the tank and
// the cross gallery. Both navigation and paving use these exact footprints.
const decks=[
  [3.35,6.35,-14,-9.10], [2.75,6.6,-48,-14],
  [-5,22,-52,-48],[-5,22,-66,-62],[-5,-1,-62,-52],[17,22,-62,-52],
  [22,60,-56,-52],[60,69,-56,-42],[60,69,-60,-56]
];
export const collectorWater=[
  [-1,2.75,-48,-14],[-1,17,-62,-52],[22,60,-59,-56]
];
export const escapeHatch={x:-40,z:-122};
export function atEscapeLadder(p){return Math.abs(p.x-64.5)<1.65&&p.z>-44.3&&p.z<-42;}
export function sewerDeck(x,z,r=0){
  function inside(a,b){
    return (a>=-1.12&&a<=5.7&&b>=-9.10&&b<=4)||
      (a>=-1.12&&a<=2.9&&b>=4&&b<=16)||
      decks.some(([l,h,n,s])=>a>=l&&a<=h&&b>=n&&b<=s);
  }
  return inside(x,z)&&inside(x-r,z-r)&&inside(x+r,z-r)&&inside(x-r,z+r)&&inside(x+r,z+r);
}
export function collectorLocation({x,z}){
  if(x>=60)return ['东线 · 逃生竖井','上黄色井梯，到旧交易所西街',4];
  if(x>=22)return ['东线 · 泄洪横廊','沿管线向东，前往逃生竖井',3];
  if(z<=-48)return ['东线 · 双廊沉砂池','绕过沉砂池，从东壁绿灯门进入横廊',2];
  if(z<-14)return ['东线 · 拱券总渠','沿水渠前进，到沉砂池后向东转',1];
  return [z>4?'西仓 · 巡检廊':'西仓 · 三号泵房','穿过落水闸右侧的检修门',0];
}

export function buildCollector({scene,box,wall,solid,paving,plate,colliders}){
  for(const [l,r,n,s] of decks)paving(l,r,n,s);
  function roof(x,z,w,d,h){
    box('stone',x,h,z,w,.40,d,0x364346);solid(x,h,z,w,.40,d);
  }
  function lip(x,z,w,d){
    box('stone',x,-.28,z,w,.63,d,0x485d5a);
    box('metal',x,.051,z,w,.032,d,0x9e9270);
  }
  function lamp(x,y,z,w,d,c){
    box('metal',x,y+.14,z,w+.20,.29,d+.18,0x34494f);
    box('lamp',x,y-.04,z,w,.10,d,c);
  }
  // Gate opens away from the player, and the camera and motors use the same
  // moving collision box as the shutter. Keep it below the tunnel lintel.
  const gate=new T.Group(),gmat=new T.MeshStandardMaterial({color:0x657877,roughness:.74});
  const ribs=new T.InstancedMesh(new T.BoxGeometry(),gmat,10),m=new T.Matrix4(),col=new T.Color();
  for(let i=0;i<10;i++){
    m.makeScale(3.28,.345,.25).setPosition(4.85,.18+i*.35,-14.15);
    ribs.setMatrixAt(i,m);ribs.setColorAt(i,col.setHex(i===4||i===5?0xe6a052:0x94a7a5));
  }
  gate.add(ribs);scene.add(gate);
  const gateSolid=new T.Box3(new T.Vector3(3.20,0,-14.30),new T.Vector3(6.50,3.50,-14.0));colliders.push(gateSolid);
  const beacon=new T.Mesh(new T.BoxGeometry(.88,.16,.14),new T.MeshBasicMaterial({color:0xff8751}));
  beacon.position.set(4.85,3.79,-13.82);scene.add(beacon);
  plate('东线检修  →',4.85,4.28,-13.83,2.74,.64,'#e9ce9a');
  for(const x of [3.35,6.35]){
    lip(x,-11.55,.13,4.9);
    for(const z of [-10,-12.6])box('metal',x,.54,z,.12,1.08,.15,0xba965c);
    box('metal',x,1.02,-11.55,.11,.10,4.90,0x919381);
  }
  // North interceptor. A low, repeating stepped vault ends where the high
  // sedimentation hall begins. The left half carries water under the arches.
  wall(-1.22,2.65,-31,.44,5.30,34,0x415657);wall(6.82,2.65,-31,.44,5.30,34,0x405353);
  roof(2.8,-31,8.2,34,5.35);lip(2.77,-31,.16,34);
  for(let z=-16;z>-48;z-=4){
    for(const side of [-1,1]){
      const x=side<0?-1:6.6;
      box('stone',x-side*.13,1.56,z,.34,3.12,.52,0x60746f);
      for(let k=0;k<4;k++)box('stone',x-side*(.2+k*.29),3.2+k*.38,z,.70,.58,.54,0x70817a);
    }
    box('metal',2.8,4.79,z,5.60,.29,.55,0x5b6a66);
    lamp(6.25,2.40,z,.50,.71,0xf0bb77);
    box('metal',-.72,1.12,z,.48,.56,.29,0x9b8b70);
  }
  box('metal',-.72,1.12,-31,.35,.36,34,0x82644b);
  // Walk all the way around the open tank. The centre holds settling water,
  // a long submerged weir and a travelling scraper on two end trucks.
  roof(8.5,-57,27.5,18.6,8.6);
  wall(-5.2,4.28,-57,.4,8.56,18.4,0x435654);
  wall(8.5,4.28,-66.2,27.4,8.56,.4,0x495a59);
  wall(-3.2,4.28,-47.8,4.0,8.56,.4,0x465857);wall(14.4,4.28,-47.8,15.2,8.56,.4,0x465857);
  wall(2.8,6.98,-47.8,8,3.15,.4,0x465857);
  wall(22.2,4.28,-62.6,.4,8.56,6.8,0x465857);wall(22.2,4.28,-49.9,.4,8.56,3.8,0x465857);
  wall(22.2,6.95,-55.5,.4,3.2,7.1,0x465857);
  for(const z of [-52,-62])lip(8,z,18,.16);
  for(const x of [-1,17])lip(x,-57,.16,10);
  for(const x of [-3,3,9,15,20]){
    box('metal',x,7.65,-57,.44,.60,18,0x52655e);
    for(let j=0;j<4;j++){
      box('metal',x,6.79+j*.20,-63.8+j*.67,.48,.40,.88,0x718177);
    }
    box('metal',x,.92,-65.80,.46,1.84,.58,0x69796f);
    lamp(x,4.9,-65.5,.84,.38,0x99ddc5);
  }
  for(const z of [-61.62,-52.36])box('metal',8,.84,z,18,.18,.20,0x98764e);
  box('metal',10.2,1.0,-57,.62,.52,9.50,0xbaa36a);
  for(let i=0;i<8;i++)box('metal',10.2,.48,-60.8+i*1.05,.22,.8,.22,0x6e8072);
  for(const x of [9.77,10.63]){
    box('metal',x,2.20,-57,.12,.15,9.7,0xb2a07b);
    for(let i=0;i<8;i++){
      const z=-61.4+i*1.20;
      box('metal',x,1.62,z,.13,1.13,.14,0x8c856f);
      for(let k=0;k<3;k++)box('metal',x,1.26+k*.29,z+.18+k*.33,.13,.32,.36,0x756d5a);
    }
  }
  box('metal',10.2,1.64,-60.20,1.44,1.10,1.45,0x9b783e);
  box('metal',10.2,1.74,-59.44,1.06,.62,.10,0x253f43);
  lamp(10.2,2.36,-60.2,1.03,.82,0xffbd76);
  // Three real overflow grilles break up the high end wall behind the tank.
  for(const x of [.3,7.4,14.5]){
    box('metal',x,2.02,-65.65,3.10,2.65,.31,0x253b3d);
    for(const side of [-1,1]){
      box('stone',x+side*1.59,1.70,-65.30,.39,2.55,.61,0x809184);
      for(let k=0;k<3;k++)box('stone',x+side*(1.41-.45*k),3.04+k*.35,-65.30,.65,.53,.61,0x869587);
    }
    for(let k=-2;k<=2;k++)box('metal',x+k*.54,1.94,-65.40,.16,2.44,.18,0x576864);
    box('stone',x,.57,-65.32,3.55,.37,.67,0x6c7b6f);
  }
  box('metal',17,.91,-60.30,1.54,.66,1.18,0x8b7460);
  plate('S02  沉砂池',8,5.38,-65.85,6.1,1.35,'#bfe0cf');
  plate('东线横廊  →',14.4,4.85,-65.83,3.6,.72,'#9be8cf');
  plate('东线出口',21.87,3.1,-53.9,2.32,.54,'#8eeac4',-Math.PI/2);
  for(const z of [-55.73,-52.25])box('lamp',21.8,1.63,z,.095,3.26,.14,0x8de8b6);
  // East-bound gallery rotates the flow and pipework through ninety degrees.
  wall(41,2.65,-59.2,38,5.3,.4,0x415450);wall(41,2.65,-51.8,38,5.3,.4,0x505d56);
  roof(41,-55.5,38,7.5,5.32);lip(41,-56,38,.17);
  for(let x=24;x<60;x+=4){
    for(const z of [-52.18,-58.84]){
      box('stone',x,2.4,z,.46,4.8,.36,0x667368);
      box('metal',x,4.8,z+(z<-56?.48:-.48),.50,.62,1.35,0x849182);
    }
    box('metal',x,4.98,-55.5,.40,.35,6.96,0x58706c);
    box('metal',x,2.70,-58.53,.28,.88,.84,0x989a83);
    lamp(x,2.15,-52.43,.76,.38,0xadf3da);
  }
  box('metal',41,2.70,-58.54,38,.64,.62,0x9b7557);
  box('metal',41,3.42,-58.68,38,.24,.28,0x668e89);
  // The pressure-relief well ends under a daylight grille and a street ladder.
  roof(64.5,-51,9.5,18.5,9.3);
  wall(69.2,4.5,-51,.4,9,18.4,0x566661);wall(64.5,4.5,-41.8,9.4,9,.4,0x516960);
  wall(64.5,4.5,-60.2,9.4,9,.4,0x516960);
  wall(59.8,4.5,-46.8,.4,9,9.6,0x516960);wall(59.8,4.5,-59.6,.4,9,.8,0x516960);
  for(const side of [-1,1])box('metal',64.5+side*.48,4.25,-42.26,.15,8.5,.22,0xe7ad63);
  for(let i=0;i<21;i++)box('metal',64.5,.34+i*.40,-42.38,1,.11,.26,0xd8ac6f);
  lamp(64.5,8.92,-43.8,3.3,3.2,0xbbf2db);
  for(let j=-2;j<=2;j++)box('metal',64.5+j*.62,8.78,-43.8,.14,.16,3.3,0x4c655c);
  plate('↑  旧交易所西街',64.5,3.12,-42.55,3.25,.68,'#c1f1cf',Math.PI);
  for(const x of [61.6,67.5]){
    box('metal',x,4.05,-59.12,.72,8.10,.76,0x8d775b);
    for(let j=0;j<6;j++)box('metal',x,.74+j*1.40,-59.12,.90,.22,.94,0x98a18d);
    box('metal',x,1.05,-58.64,1.07,.52,.42,0xbb8059);
  }
  // One local pool of light per work area. Only the nearest fixture is live.
  const pools=[[5.9,2.25,-30,0xffbd75],[10.2,2.40,-60.2,0xffca83],[20.6,2.8,-54.5,0x70dab3],
    [40,2.25,-52.7,0xa1e5bb],[64.5,6.4,-44,0xc9f1cc]];
  const local=new T.PointLight(0xffffff,0,14);scene.add(local);

  function setLift(y){
    gate.position.y=y;gateSolid.min.y=y;gateSolid.max.y=y+3.50;
    beacon.material.color.setHex(y>3?0x8dedd0:0xff8751);
  }
  return {reset(){setLift(0);local.intensity=0;},update(dt,clear,position){
    if(clear&&gate.position.y<3.72)setLift(Math.min(3.72,gate.position.y+dt*2.1));
    let nearest=null,distance=15;
    for(const p of pools){
      const d=Math.hypot(position.x-p[0],position.z-p[2]);
      if(d<distance){nearest=p;distance=d;}
    }
    if(nearest){local.position.set(...nearest.slice(0,3));local.color.setHex(nearest[3]);}
    local.intensity=115*(1-T.MathUtils.smoothstep(distance,6,15));
  }};
}
