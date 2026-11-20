import * as T from 'three';

// The old repair tower sits across the bend, with its plant-room back facing
// the rail interchange. The control gallery borrows that facade and looks
// directly down the public street. A second line serves freight below grade.
export function buildCoreNightOperations(kit,api,scene,buildings,lights){
  const steel=0x516575,iron=0x263442,porcelain=0xb1bcb4,bronze=0xab835e;
  const teal=0x90eddf,ice=0xd7f0ec,magenta=0xc77cad,amber=0xffb55e;
  function lamp(x,y,z,color,power,range){
    const l=new T.PointLight(color,power,range,2);
    l.position.set(x,y,z);l.userData.nightPower=power;scene.add(l);lights.push(l);
  }
  function fixture(frame,u,y,v,color,power,range){
    const [x,z]=frame.point(u,v);lamp(x,y,z,color,power,range);
  }
  const lot=buildings.find(b=>b.x===28&&b.z===-194);
  if(lot){
    const r=lot.angle+Math.PI,frame=kit.frame(lot.x-lot.s*lot.d/2,lot.z-lot.c*lot.d/2,r);
    const {B}=frame;
    // Braced outboard of the otherwise blind rear wall, with the old intact
    // podium below. The observer sees the outer sill, people and rear light
    // wall at three separate depths. Wide windows turn the east corner.
    for(const [level,bottom] of [6.50,10.0].entries()){
      const opening=2.43,sign=level?1:-1,start=level?-5.34:-4.64;
      const length=level?10.50:10.02,centre=start+length/2;
      B('hull',steel,centre,bottom-.15,.34,length+.34,.63,2.08);
      B('hull',porcelain,centre,bottom+.16,1.21,length+.55,.27,.51);
      B('hull',iron,centre,bottom+opening+.32,.27,length+.36,.62,2.04);
      const bay=length/4;
      for(let i=0;i<4;i++){
        const u=start+(i+.5)*bay,col=(i+level)%4===0?0xeecf98:level?0xbbeae9:0x97cade;
        B('hull',iron,u,bottom+1.41,-.13,bay-.08,2.51,.34);
        B('wash',col,u,bottom+1.45,.09,bay-.15,2.32,.14);
        B('light',col,u,bottom+2.41,.29,bay-.21,.28,.18);
        B('hull',steel,u-.74,bottom+1.39,.32,.105,2.22,.10);
        B('hull',0x687e80,u+.22,bottom+.86,.57,bay-.36,.22,.64);
        B('hull',iron,u+.46,bottom+1.27,.60,.88,.62,.18);
        B('light',i%2?teal:0xabaac7,u+.46,bottom+1.27,.717,.68,.40,.054);
        if((i+level)%3===1){
          B('hull',0x3d4a52,u-.44,bottom+.85,.51,.43,1.06,.36);
          B('hull',0x947f72,u-.44,bottom+1.56,.50,.29,.31,.29);
        }
        B('hull',steel,start+i*bay,bottom+1.40,1.01,.25,2.51,.55);
        B('light',level?0xa7c4ce:0x8eb5c7,start+i*bay-.105,bottom+1.73,1.31,.061,1.40,.038);
      }
      B('hull',steel,start+length,bottom+1.40,1.01,.31,2.51,.55);
      B('light',ice,centre,bottom+2.70,1.14,length-.24,.12,.20);
      const end=centre+sign*(length/2+.08);
      B('hull',iron,end,bottom+1.40,.30,.28,2.55,1.62);
      B('light',0x9acfcf,end+sign*.17,bottom+1.41,.29,.075,1.84,1.39);
      for(let j=0;j<3;j++)B('hull',steel,end+sign*.245,bottom+.66+j*.73,.28,.12,.12,1.57);
    }
    // Three deep fins form an offset corporate silhouette above the roof of
    // the gallery. A violet relay coil is visible through the gaps.
    for(let i=0;i<3;i++){
      const u=-4.45+i*1.12,h=5.40-i*1.12;
      B('hull',steel,u,13.05+h/2,.19,.76,h,1.28);
      B('hull',porcelain,u-.18,13.05+h/2,.89,.29,h,.32);
      B('light',i===0?magenta:0x9cbfd0,u+.135,13.25+h/2,.865,.19,h-.50,.14);
      B('hull',iron,u,13.14+h,.34,.99,.24,1.65);
    }
    B('hull',iron,2.13,13.16,.77,6.58,1.39,1.15);
    const [sx,sz]=frame.point(2.13,1.41);
    api.sign(sx,13.20,sz,6.08,.94,'轨务调度','城北环线  /  夜班值守','#c5e5e1',r);
    // A low operational entrance has a silver canopy, with the return and
    // three pools of warm-white light leading back under the gallery.
    const canopyX=1.24;
    B('hull',iron,canopyX,4.02,.70,7.12,.45,2.45);
    for(let i=0;i<5;i++){
      const u=canopyX+(i-2)*1.36;
      B('hull',steel,u,4.20,1.75,1.34,.45,.66);
      B('light',0xe9d8b3,u,3.78,1.27,1.15,.11,.84);
    }
    fixture(frame,-3.40,8.34,1.79,0x9bdce8,98,13);
    fixture(frame,2.70,3.75,1.50,0xf4c89a,92,13);
  }
  // The adjacent workshop's repair bench turns the actual north-east corner.
  // Give the older tenancy an amber, louvred light rather than the control
  // room's open windows; the service lane remains completely unobstructed.
  for(const [x,z,r] of [[26,-211,Math.PI/2],[22,-215,Math.PI]]){
    const f=kit.frame(x,z,r),B=f.B;
    B('hull',iron,0,5.20,.33,7.76,3.42,.78);
    for(let j=0;j<3;j++){
      const u=(j-1)*2.48;
      B('wash',0xf7b877,u,5.15,.77,2.33,2.71,.12);
      for(let band=0;band<4;band++){
        B('hull',bronze,u,4.06+band*.66,.86,2.39,.18,.36);
        B('light',band===2?0xd19361:0xb07049,u,4.15+band*.66,1.02,2.10,.075,.06);
      }
      B('hull',steel,u-1.12,5.25,1.01,.18,3.12,.58);
    }
    B('hull',bronze,0,3.61,.56,8.46,.32,1.81);
    B('light',0xffcd83,0,3.41,.93,7.56,.10,.30);
    for(let j=0;j<4;j++)B('hull',iron,(j-1.5)*2.02,6.88,.63,1.94,.30,1.46);
    fixture(f,0,3.32,1.27,0xf0b879,77,10);
  }
  // The lower platform annunciator belongs to the bridge foot. Stacked
  // white arrival chevrons break the outline of the dark south approach.
  const foot=kit.frame(46,-190.53,Math.PI),F=foot.B;
  F('hull',iron,0,7.04,.36,7.31,5.03,1.05);
  F('wash',0x936494,0,7.20,.98,6.60,3.98,.20);
  for(const side of [-1,1]){
    F('hull',steel,side*3.31,7.18,1.05,.46,4.61,.69);
    F('light',magenta,side*3.31,7.18,1.42,.12,4.07,.10);
    for(let j=0;j<4;j++){
      F('light',j===3?ice:0x9ec4c8,-1.34+side*j*.34,7.44-j*.32,1.20,.44,.32,.20);
    }
  }
  F('hull',iron,1.42,6.98,1.12,2.53,1.77,.32);
  const [fx,fz]=foot.point(1.42,1.33);
  api.sign(fx,6.99,fz,2.39,1.26,'07','夜间环线','#c5e6df',Math.PI);
  fixture(foot,0,5.0,1.38,0xb686b9,70,11);
  // The pedestrian side of the southern enclosed skybridge had only a blank
  // back; suspended departure arrows and the reverse clerestory face arrivals.
  const gate=kit.frame(46,-186,-Math.atan2(-3.8,22)),G=gate.B,span=Math.hypot(22,3.8);
  for(let i=0;i<6;i++){
    const u=(i+.5)*span/6;
    G('hull',steel,u,10.91,-1.17,span/6-.15,2.08,.38);
    G('wash',i===1||i===4?0xd9b6cc:0x94cad6,u,10.91,-1.40,span/6-.43,1.57,.11);
    G('light',i===1||i===4?magenta:ice,u,11.60,-1.50,span/6-.52,.17,.18);
    G('hull',iron,u,10.70,-1.51,span/6-.36,.16,.22);
  }
  const [gx,gz]=gate.point(span*.48,-1.80);
  api.sign(gx,9.47,gz,7.10,1.14,'夜行接驳','环线 07  /  高架步廊','#c4b0de',Math.PI-Math.atan2(-3.8,22));
  fixture(gate,span*.48,9.02,-1.73,0xac9ed4,85,13);

  const cut=kit.frame(76,-240.43,0),P=cut.B,bottom=-5.82;
  // The sliding loading door is real. Reinforce its motor housing and guide
  // cheeks with a receiving gantry, positive work light and clearance marks.
  P('hull',steel,0,-.64,.28,9.0,.96,1.32);
  P('hull',iron,0,.01,.21,8.52,.36,.98);
  for(const side of [-1,1]){
    const u=side*3.94;
    P('hull',steel,u,-3.27,.48,.81,4.51,1.04);
    for(let i=0;i<7;i++){
      P('light',i%3===2?0xc48348:amber,u,bottom+1.0+i*.58,1.06,.40,.48,.15);
      P('hull',iron,u,bottom+1.26+i*.58,1.07,.55,.09,.21);
    }
    P('hull',porcelain,u,-.88,.70,1.27,.68,1.27);
    P('light',0xffdfaa,u,-1.24,1.00,.83,.12,.65);
  }
  for(let i=0;i<9;i++)P('light',i%3?amber:0xffe2a3,(i-4)*.84,-.42,1.02,.66,.19,.14);
  P('hull',iron,0,-.82,.86,5.84,1.01,.57);
  api.sign(76,-.79,-239.21,5.38,.73,'四号货闸','夜班装卸  /  泵组在线','#ffcf80',0);
  fixture(cut,-3.47,-1.35,1.43,0xffb263,103,12);
  fixture(cut,3.43,-1.35,1.43,0xf2b275,91,10);
  // The pump pipes run on the east retaining wall, above the vehicle path.
  // Glass gauge channels sit between iron cheeks; dark and filled cells
  // form a water-level reading. Their lateral depth reads down the entire cut.
  for(const [i,z] of [-232.0,-224.2,-216.4].entries()){
    const frame=kit.frame(81.69,z,-Math.PI/2),B=frame.B;
    B('hull',iron,0,-3.02,.10,3.29,4.74,.58);
    // The body, liquid columns and cheeks project past the retaining wall.
    // Include their actual occupied depths so the shoulder can't sit inside
    // a gauge glass when the player turns to look across the freight lane.
    frame.C(0,-3.02,.10,3.29,4.74,.58);
    frame.C(0,-3.08,.47,2.60,3.26,.32);
    B('hull',steel,0,-.87,.31,3.41,.48,.85);
    B('hull',iron,0,-4.99,.36,3.38,.61,.86);
    for(const side of [-1,1]){
      B('hull',porcelain,side*1.43,-2.96,.48,.32,4.01,.54);
      B('light',0x85d8c1,side*1.43,-2.96,.79,.105,3.56,.10);
      frame.C(side*1.43,-2.96,.52,.32,4.01,.64);
    }
    for(let col=0;col<3;col++)for(let row=0;row<6;row++){
      const filled=row<4+(col+i)%2;
      B(filled?'light':'hull',filled?(row===3?0xb2edcf:0x67b9a8):0x364c50,
        (col-1)*.66,-4.39+row*.53,.49,.43,.39,.26);
    }
    B('hull',steel,-1.02,-1.41,.56,.27,.74,.66);
    fixture(frame,0,-2.18,.95,0x71d5bd,68,9);
  }
  api.sign(80.83,-1.27,-224.2,2.60,.50,'排水泵组','集水井 02  /  自动运行','#a7e5d1',-Math.PI/2);
  for(const [i,z] of [-232.4,-223.2,-214.0,-204.8].entries()){
    const frame=kit.frame(70.28,z,Math.PI/2),B=frame.B;
    // Hooded work lights span the loading bays and reveal their exhaust main.
    B('hull',steel,0,-1.07,.51,4.64,.48,.96);
    B('hull',iron,0,-1.35,.79,4.65,.26,.60);
    for(let j=0;j<4;j++)B('light',j===i?0xffd5a1:amber,(j-1.5)*1.04,-1.46,
      1.06,.88,.20,.35);
    fixture(frame,0,-1.58,1.02,0xe9a567,74,10);
  }
  // At the south end the escape stair runs up the east wall. Its route is
  // readable from the other direction without a sign hanging over the treads.
  const stair=kit.frame(76,-196.57,Math.PI),S=stair.B;
  for(const u of [-2.8,2.8]){
    S('hull',steel,u,-3.37,.34,.40,3.64,.77);
    for(let j=0;j<4;j++)S('light',0x9bd5bd,u,-4.60+j*.73,.77,.21,.52,.14);
  }
  S('hull',iron,0,-1.11,.28,6.10,.87,.94);
  api.sign(76,-1.06,-197.52,5.51,.68,'上层步廊','东侧楼梯  /  应急照明','#a9d6c9',Math.PI);
  fixture(stair,2.4,-1.39,.94,0x95d8c0,53,8);
}
