import * as T from 'three';

// Axles arrive in the old rail yard along the western factory apron. The
// electric runway stays within that private strip. Public road and pavement
// are continuous between this bay and the occupied opposite frontage.
export function fitCoreWheelshop(kit,api,scene,buildings,lights){
  const shell=buildings.find(b=>b.x===-43&&b.z===-311);
  if(!shell)return;
  const angle=shell.angle+Math.PI/2,frame=kit.frame(shell.x+shell.c*shell.w/2,
    shell.z-shell.s*shell.w/2,angle),{B,C,point}=frame;
  const ink=0x29383f,steel=0x637877,rust=0xad785a,ochre=0xe1aa63,ivory=0xb9c5b7;
  function lamp(u,y,v,color,power,reach){
    const [x,z]=point(u,v),l=new T.PointLight(color,power,reach,2);
    l.position.set(x,y,z);l.userData.nightPower=power;scene.add(l);lights.push(l);
  }
  for(const v of [.45,4.76]){
    for(const u of [-7.80,6.96]){
      B('hull',ink,u,.35,v,.99,.42,1.05);
      B('hull',steel,u,2.62,v,.49,4.35,.58);
      for(const y of [.81,2.81,4.5])B('hull',rust,u,y,v,.71,.21,.77);
      for(let j=0;j<3;j++)B('hull',steel,u+(u<0?1:-1)*j*.20,4.64+j*.30,v,.54+j*.36,.32,.64);
      C(u,2.46,v,.78,4.64,.80);
    }
    B('hull',ink,-.42,5.69,v,17.56,.34,.82);
    B('hull',ochre,-.42,6.84,v,17.66,.38,.87);
    B('hull',ivory,-.42,7.09,v,17.36,.16,.39);
    // Open-web stepped diagonals, with both the rear rail and the trolley
    // visible through the spaces when the player moves along the yard.
    for(let i=0;i<9;i++){
      const u=-8.63+i*1.85;
      B('hull',rust,u,6.24,v,.24,1.02,.54);
      for(let j=0;j<4;j++)B('hull',ochre,u+.25+j*.37,5.96+(i%2?3-j:j)*.22,v,.46,.29,.37);
      if(v>4){
        // Shielded conductor rail runs behind a pale marked cover. The
        // service face catches the cab lighting instead of disappearing at night.
        B('light',i%3===1?0x95b6ad:0x727e70,u+.76,6.89,v+.461,1.53,.12,.055);
        B('hull',ivory,u+.45,7.13,v+.29,.22,.31,.31);
        if(i%2===0)B('light',0xe6be7d,u,6.26,v+.30,.105,.91,.069);
      }
    }
  }
  for(const u of [-7.8,6.96]){
    B('hull',steel,u,5.47,2.61,.46,.48,4.88);
    B('hull',ink,u,5.82,2.61,.69,.24,4.78);
  }
  // Caged motor and driver cab on the bridge span between the two rails.
  const u=1.93;
  for(const dx of [-.65,.65]){
    B('hull',ink,u+dx,6.94,2.56,.41,.77,5.18);
    B('hull',rust,u+dx,7.42,2.56,.53,.27,5.35);
  }
  B('hull',steel,u,7.08,2.68,1.53,.62,2.34);
  B('hull',ink,u,6.40,2.67,1.50,.76,1.12);
  for(const dx of [-.45,.45]){
    B('hull',ivory,u+dx,4.91,2.65,.085,2.66,.10);
    B('hull',ochre,u+dx*.64,3.59,2.65,.42,.20,.32);
  }
  B('hull',rust,u,3.44,2.65,1.31,.29,.42);
  B('hull',ink,u-.18,3.16,2.65,.25,.42,.32);
  B('hull',rust,u,3,2.65,.60,.18,.32);
  B('hull',steel,u,5.03,4.88,1.85,1.40,1.16);
  B('wash',0xc99964,u,5.26,5.51,1.42,.77,.14);
  B('hull',ink,u-.54,5.23,5.63,.12,.89,.09);
  B('light',0xffcd88,u,4.22,4.91,1.29,.16,.64);
  for(const x of [-6.4,-2.4,5.3]){
    B('hull',ink,x,5.30,4.77,.79,.32,.70);
    B('light',0xffd393,x,5.09,4.77,.63,.12,.49);
    lamp(x,4.89,4.56,0xe6aa70,76,9);
  }
  // Short maintenance rails end on buffers at either end of the apron.
  for(const v of [1.91,3.34])B('hull',ivory,-.47,.50,v,14.72,.20,.15);
  for(let j=0;j<12;j++)B('hull',j%3?ink:rust,-7.21+j*1.19,.32,2.62,.40,.20,2.56);
  function wheelset(u,axleY){
    B('hull',steel,u,axleY,2.63,.29,.29,2.31);
    for(const side of [-1,1]){
      const v=2.63+side*.743;
      // Axle, dark web and raised steel flange are distinct solids. A run
      // is merged at each height to preserve the cubic tyre silhouette.
      for(let row=-4;row<=4;row++){
        const pitch=.175,half=Math.floor(Math.sqrt(21-row*row));
        B('hull',0x8d9e97,u,axleY+row*pitch,v,(2*half+1)*pitch,pitch,.27);
        if(Math.abs(row)<4){
          const inner=Math.max(0,half-1);
          B('hull',0x49575b,u,axleY+row*pitch,v+side*.138,(2*inner+1)*pitch,pitch,.084);
        }
      }
      B('hull',rust,u,axleY,v+side*.21,.42,.42,.18);
      B('hull',ivory,u,axleY,v+side*.33,.23,.24,.09);
    }
  }
  for(const x of [-5.13,-2.11,4.93]){
    for(const side of [-1,1])B('hull',ochre,x+side*.75,.58,2.61,.35,.38,2.04);
    wheelset(x,1.38);C(x,1.10,2.64,1.73,1.70,2.47);
  }
  wheelset(u,2.10);C(u,2.10,2.64,1.68,1.62,2.49);
  B('hull',steel,-3.06,2.26,.37,5.50,3.84,.87);
  B('wash',0xa7bbba,-3.06,2.36,.88,4.95,3.16,.16);
  B('hull',ink,-3.06,1.38,1.08,5.20,.25,.93);
  for(const x of [-4.8,-4.2,-3.6,-3.0])B('hull',steel,x,2.50,1.05,.21,1.01,.14);
  B('hull',ink,-1.66,2.39,1.09,1.14,1.14,.20);
  B('light',0x9edacf,-1.66,2.46,1.22,.88,.71,.08);
  for(const x of [-4.72,-1.64])B('light',0xffd3a0,x,4.03,.98,2.02,.12,.33);
  // The two test boxes backlight the wheels on the inspection bed. Broad
  // frosted panes sit behind the wheels, cab and crane posts, below the rails.
  for(const [x,w] of [[-5.64,3.22],[3.47,5.14]]){
    B('hull',ink,x,2.23,.48,w,3.46,.81);
    B('light',0x99b6b2,x,2.23,.92,w-.28,2.96,.14);
    for(let band=0;band<3;band++)B('hull',steel,x,1.08+band*.96,1.05,w-.20,.12,.22);
    for(const edge of [-1,1])B('hull',ink,x+edge*(w/2-.23),2.19,1.18,.22,3.10,.48);
    B('light',0xd6d9b4,x,3.58,1.17,w-.44,.13,.25);
  }
  B('hull',ink,5.39,2.02,1.73,.39,1.34,.45);
  B('light',0x73c1bf,5.34,2.23,1.98,.24,.53,.10);
  // The public face is the inspection line. Three open scanner portals share
  // the crane rail and leave the wheelsets visible through their apertures.
  for(const [index,center] of [-5.16,-1.68,4.90].entries()){
    const v=4.04;
    for(const side of [-1,1]){
      const leg=center+side*1.48;
      B('hull',0xaecad0,leg,2.04,v,.48,3.68,.96);
      C(leg,2.04,v,.48,3.68,.96);
      B('hull',0x485e72,leg,1.24,v+.32,.64,1.92,.64);
      B('light',0x9ce1eb,leg-side*.27,2.51,v+.44,.12,1.84,.18);
      for(let j=0;j<3;j++)
        B('hull',0xc3d5d4,leg-side*j*.24,3.76+j*.24,v,.56,.32,1.12);
    }
    B('hull',0x718798,center,4.40,v,2.24,.48,1.12);
    B('light',0xa1e5f0,center,4.12,v,1.76,.12,.80);
    for(let j=0;j<=index;j++) B('light',0xb8a2d8,center-.48+j*.36,4.42,v+.60,.24,.24,.12);
  }
  const [sx,sz]=point(-3.36,5.30);api.sign(sx,5.72,sz,8.64,1.04,'环枢轨道 · 检测线','资产运维中心   /   轮对探伤 01—03','#b3deeb',angle);
  for(let i=0;i<3;i++){
    B('hull',ink,6.93,3.20+i*.40,5.10,.56,.40,.41);
    B('light',i===1?0xffc06d:0x789888,6.93,3.20+i*.40,5.34,.31,.23,.13);
  }
  lamp(-2.88,3.41,1.39,0xc6dacf,67,8);
}
