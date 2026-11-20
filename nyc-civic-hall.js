import {PointLight} from 'three';

// Geometry shared by the Exchange podium and its recessed public entrance.
export const exchangeApproach={westX:-14.5,eastX:24.5};
export const civicHall = {width:22, depth:6.4, top:8.56};

export function buildCivicHall({box:B, solid:C, surface:S, materials, sign}) {
  const x=-8, rear=-150.4;
  const stone='midtownLimestone', steel='midtownSteel', bronze='midtownBronze';
  const glow=materials.lamp.clone();
  glow.name='NYC Midtown / opal diffuser';
  glow.color.set(0xb2cbd3);
  glow.emissive.set(0xa5ccdc);
  glow.emissiveIntensity=.31;
  glow.roughness=.64;
  materials.civicLantern=glow;
  const opal=materials.midtownLimestone.clone();
  opal.name='NYC Midtown / satin opal';
  opal.color.set(0xc4d3d5);
  opal.emissive.set(0xb6d8e4);
  opal.emissiveIntensity=.29;
  opal.roughness=.71;
  materials.civicOpal=opal;
  const solid=(mat,x,y,z,w,h,d,tint)=>{
    B(mat,x,y,z,w,h,d,tint);
    C(x,y,z,w,h,d);
  };

  B('paver',x,.27,-147.20,22,.18,6.4,0xb7c3c1);
  S(-19,3,rear,-144);
  for(const column of [-20.4,-14,-8,-2,4.4]){
    solid(stone,column,.62,-141.9,1.0,.52,1.02,0xb0b8ae);
    solid(bronze,column,4.34,-141.9,.60,7.24,.67,0x9da39b);
    solid(stone,column,8.02,-141.9,.91,.44,.96,0xc2c7bd);
    B(steel,column,4.37,-141.53,.13,6.96,.12,0xb3bec0);
    for(let tier=0;tier<4;tier++){
      const bottom=1.04+tier*1.44;
      B(steel,column,bottom+.72,-141.52,.64,1.44,.48,0x8d9f9f);
      B(bronze,column+.22,bottom+.72,-141.26,.16,1.44,.16,0xc2a37b);
      B('civicOpal',column-.12,bottom+.64,-141.25,.16,.96,.16);
    }
    // Load is spread from the thin pier into a corbelled stone capital.
    for(let tier=0;tier<4;tier++){
      const width=.96+tier*.64;
      solid(stone,column,6.95+tier*.32,-141.9,width,.32,.96+tier*.32,0xb2c2bf);
    }
  }
  solid(steel,x,8.52,-141.88,25.8,.66,4.52,0x9dadae);
  // Dark blue enamel archivolts frame three luminous portals. Two solid
  // flanks corbel out from each pier, so the crown can be read across the road.
  for(const pier of [-20,-12,-4,4]){
    solid(stone,pier,.71,-139.96,.96,.70,1.44,0x9faca5);
    solid(steel,pier,2.44,-139.96,.80,2.76,1.12,0x546a73);
    B(bronze,pier+.24,2.44,-139.36,.16,2.76,.16,0xd0ac86);
  }
  for(const centre of [-16,-8,0]){
    for(const side of [-1,1])for(let tier=0;tier<7;tier++){
      const length=.64+tier*.48,xx=centre+side*(3.84-length/2);
      const yy=4.0+tier*.48,zz=-139.96+tier*.16;
      solid(steel,xx,yy,zz,length,.48,1.12,0x44616a);
      B(tier===6?bronze:steel,xx,yy-.08,zz+.61,length,.16,.16,tier===6?0xe7b684:0x809b9e);
      if(tier===1||tier===4)B('civicLantern',centre+side*(3.84-length+.16),yy-.24,zz+.16,.32,.08,.8);
    }
    B(bronze,centre,7.35,-138.90,7.84,.32,1.28,0xa9977b);
    // Each ticket gate retains its stepped Deco hood. A recessed pair of
    // lamp cassettes lights the thresholds from inside the arch.
    for(const side of [-1,1]){
      for(let level=0;level<3;level++){
        const u=side*(2.4-level*.48),y=5.78+level*.38;
        B(steel,centre+u,y+.12,-138.91,.78,.41,.94,0x6b8187);
        B('lamp',centre+u,y,-138.39,.54,.22,.20,0xb2dce6);
      }
    }
  }
  B(stone,x,8.97,-142.38,26.42,.24,4.8,0xb8c6c2);
  for(const bay of [-17,-11,-5,1]){
    B(steel,bay,7.87,-146.25,.18,.41,7.96,0xa0b6b7);
    B('civicLantern',bay,8.17,-141.93,.15,.045,3.74);
    for(const offset of [-4.3,-1.84,.60,3.04]){
      B('civicOpal',bay+2.28,8.15,-145.78+offset,1.86,.13,2.15);
    }
  }

  for(const [bay,width] of [[-17.35,3.21],[-13.76,3.72],[-10.05,3.51],[-6.2,3.63],[-2.51,3.51],[1.05,3.31]]){
    B('civicOpal',bay,8.19,-141.38,width,.095,2.74);
    B(steel,bay,8.16,-139.93,width,.08,.16,0xb2bcc1);
    B('civicLantern',bay,8.08,-140.76,width*.81,.055,.145);
  }
  for(const e of [-1,1]){
    const xx=x+e*10.78;
    for(const z of [-145.2,-148.1]){
      B(stone,xx,3.6,z,.46,6.48,2.42,0xb3bcb6);
      B('civicOpal',xx-e*.247,4.5,z,.064,3.39,1.72);
      B('civicLantern',xx-e*.294,5.68,z,.065,.14,1.71);
      B(bronze,xx-e*.275,3.76,z,.095,.15,1.51,0xc0b09a);
    }
  }
  // Three glazed security doors at the rear keep the lobby walkable.
  for(const [door,i] of [[-15,0],[-8,1],[-1,2]]){
    B(steel,door,5.11,rear+.04,6.72,6.98,.16);
    // Three stepped light wells behind the door keep the dark reveal visible.
    for(let row=0;row<3;row++){
      const width=6.4-row*.64;
      B('civicOpal',door,2.68+row*2.24,rear+.16+row*.04,width,2.08,.08,0xb3cad1);
    }
    for(const e of [-1,1]){
      B(steel,door+e*1.27,2.02,rear+.35,.16,3.32,.35,0x95aab0);
      B('glass',door+e*.58,2.02,rear+.35,1.12,2.95,.07,0x8aaebc);
      B(bronze,door+e*.18,1.52,rear+.46,.055,.40,.09,0xc0ad98);
      B('civicOpal',door+e*2.10,3.86,rear+.29,1.23,5.34,.12);
      B('civicLantern',door+e*2.33,4.83,rear+.37,.14,3.09,.075);
    }
    B(steel,door,3.67,rear+.36,2.74,.21,.36);
    B('civicOpal',door,5.83,rear+.28,2.5,1.51,.10);
    B('civicLantern',door,6.55,rear+.35,2.55,.09,.09);
    B('metal',door,4.52,rear+.37,3.08,.37,.22,0x9daeb1);
    sign(door,4.53,rear+.481,2.4,.28,['TENANTS','NIGHT DESK','TRANSIT'][i],'','#accad0');
  }

  // The tower's lower communications level projects into the street view.
  solid(steel,x,10.38,-142.64,21.8,1.45,2.92,0x7a939c);
  B(stone,x,11.18,-142.60,22.28,.24,3.18,0xc0c6bd);
  for(const u of [-9,-6,-3,0,3,6,9]){
    B(bronze,x+u,10.42,-141.12,.24,1.17,.44,0x9ca49f);
    B(u===0?'coolWindow':'glass',x+u,10.45,-141.145,1.85,.77,.12,0x94b1b7);
  }
  const board=sign(-6,14.1,-142.8,15.6,3.16,'CIVIC EXCHANGE','FORMER TRADING HALL / BLOCK 07','#b2dce5');
  if(board)board.material.emissiveIntensity=.48;
}

export function buildWestExchangeApproach({box:B,solid:C,sign,lights,scene}) {
  // Short stepped headhouse against the west frontage, with a low return
  // along the crossing. The x=-36 carriageway and eastward crossing stay open.
  const x=-26.8,z=-127.6;
  // The street-facing strip of the headhouse is cut away to form three
  // service windows. The old western wall and street footprint stay in use.
  B('midtownLimestone',x-.61,2.52,z,2.13,4.32,7.0,0xa5afa7);
  C(x-.61,2.52,z,2.13,4.32,7.0);
  for(const y of [.68,4.28]){
    B('midtownSteel',x+1.04,y,z,1.22,.64,7.04,0x6f8790);
    C(x+1.04,y,z,1.22,.64,7.04);
  }
  B('midtownSteel',x-.35,5.38,z-.43,2.22,1.40,5.25,0x879da5);
  C(x-.35,5.38,z-.43,2.22,1.40,5.25);
  B('midtownBronze',x,4.77,z,3.65,.26,7.32,0xa7aaa0);
  for(const dz of [-2.32,-.77,.77,2.32]){
    B('glass',x-1.71,2.53,z+dz,.09,2.83,1.23,0x879f9f);
    B('midtownLimestone',x-1.76,1.06,z+dz,.18,.18,1.45,0xc1c7b7);
    B('metal',x-1.79,2.54,z+dz,.16,2.9,.075,0xa9b5af);
  }
  B('lamp',x,3.55,z+3.55,1.63,.07,.18,0xe6cb9f);
  sign(x,2.94,z+3.61,2.62,.52,'SERVICE COURT','CIVIC EXCHANGE','#cec3a6');
  buildSettlementArcade({B,C,sign,scene,lights});
}

// A continuous night clearing house turns from a narrow public counter into
// a two-storey dispatch gallery and back down into the old parts shop. The
// bright glass sits behind its jambs and below the return of the canopy.
function buildSettlementArcade({B,C,sign,scene,lights}){
  const iron='midtownSteel',stone='midtownLimestone',bronze='midtownBronze',glass='exchangeGridLens';
  const steel=0x7e9da7,dark=0x435566,pearl=0xc7c8bd,ice=0x80dee3,berry=0xdc9cdb,gold=0xfac482;
  for(const [i,z] of [-129.84,-127.60,-125.36].entries()){
    const colour=[ice,berry,gold][i];
    B(iron,-26.27,2.50,z,.32,2.88,2.08,dark);
    B(glass,-26.06,2.80,z,.16,1.44,1.60,colour);
    B(iron,-25.67,2.63,z+.48,.64,1.60,.24,steel);
    B(bronze,-25.76,1.66,z,.96,.64,1.76,0xae8768);
    B(stone,-25.39,2.00,z,1.12,.16,1.92,pearl);
    C(-25.63,1.68,z,1.44,.80,1.92);
    B(iron,-25.41,2.12,z-.36,.64,.32,.64,dark);
    B(glass,-25.06,2.15,z-.36,.16,.16,.48,colour);
    B(iron,-25.42,2.56,z-1,.64,3.20,.32,steel);
    B(glass,-25.04,3.58,z,.22,.24,1.76,colour);
  }
  // The frontage elbows round the near corner. Three copper contact teeth
  // flank the mouth, with an optical reader showing above the counter.
  for(let i=0;i<6;i++){
    const drop=Math.max(0,Math.abs(i-2.5)-.5)*.32;
    const y=1.44+i*.48,xx=-25.42-drop;
    B(iron,xx,y,-124.08,1.28,.48,1.28,steel);
    B(glass,xx,y,-123.38,.80,.30,.22,i%3===0?gold:ice);
    B(bronze,xx+.40,y,-123.36,.32,.48,.48,pearl);
  }
  // Four 1.92-m clearing bays span the gap between the actual two shells.
  // Their soffit is 4.38 m over the path. The rising roof follows the upper
  // shop floor onto which the dispatch tubes land.
  const rear=-131.84;
  for(let i=0;i<5;i++){
    const u=-25.92+i*1.92,step=Math.min(2,i)*.32;
    const y=4.80+step,front=rear+1.28+(i===2?.64:i===1?.32:0);
    const depth=2.88+(i===2?.64:i===1?.32:0);
    B(iron,u,y,rear,1.92,.80,depth+.64,steel);
    C(u,y+1.52,rear,1.92,3.84,depth+.48);
    B(iron,u,y+1.44,rear-.64,1.92,2.24,1.28,dark);
    B(glass,u,y+1.66,rear+.09,1.60,1.44,.22,i%3===1?0xcd9fbc:0x95c4c7);
    B(iron,u,y+.78,front-.48,1.60,.48,.96,steel);
    B(bronze,u-.44,y+1.16,front-.42,.64,.32,.48,0x997e65);
    B(iron,u+.72,y+1.46,front-.18,.32,2.24,1.28,steel);
    B(stone,u,y+2.74,rear+.40,1.92,.48,depth+1.12,pearl);
    B(iron,u,y+2.42,front,1.92,.32,1.60,steel);
    B(glass,u-.08,y+2.21,front+.39,1.44,.16,.64,i===1||i===2?berry:ice);
    B(glass,u,y-.45,front-.16,1.44,.16,.64,i%3?ice:gold);
  }
  // The open check die shares a projecting three-metre arm with the tube
  // feeding the public pickup counter.
  B(iron,-22.24,6.48,-130.64,1.60,1.28,3.84,dark);
  B(bronze,-22.24,7.12,-130.64,2.08,.48,3.84,pearl);
  for(const h of [-1,1])for(let row=0;row<7;row++){
    const shift=Math.max(0,Math.abs(row-3)-1)*.32;
    const xx=-22.24+h*(1.44-shift),yy=4.00+row*.48;
    B(iron,xx,yy,-129.28,1.12,.48,1.60,steel);
    C(xx,yy,-129.28,1.12,.48,1.60);
    B(glass,xx+h*.08,yy,-128.43,.64,.36,.24,h<0?berry:ice);
    B(bronze,xx+h*.40,yy,-128.40,.24,.48,.48,pearl);
  }
  B(iron,-22.24,3.68,-129.28,2.24,.48,1.28,dark);
  B(glass,-22.24,3.78,-128.57,1.28,.24,.16,gold);
  // Return the pneumatic pickup around the blind brick side. Louver strips
  // sit above the paving and expose the individual sleeves inside the cabinet.
  for(let i=0;i<3;i++){
    const zz=-136.72+i*1.28;
    B(iron,-21.35,2.42,zz,.48,2.08,1.12,dark);
    B(glass,-21.62,2.72,zz,.16,.64,.80,i===2?berry:ice);
    B(bronze,-21.68,2.00,zz,.32,.48,.80,pearl);
    B(iron,-21.80,1.68,zz,.48,.24,1.12,steel);
    C(-21.56,2.42,zz,.56,2.08,1.12);
  }
  // Keep a clear gap at the front counter instead of a full pane of glass.
  for(let i=0;i<4;i++){
    const xx=-20.64+i*1.44;
    B(iron,xx,2.02,-136.44,1.12,1.12,.64,dark);
    B(glass,xx,2.19,-136.06,.80,.40,.22,i===1?ice:gold);
    B(bronze,xx,1.64,-136.0,1.12,.24,.72,pearl);
    B(iron,xx,3.50,-132.64,1.28,.32,1.28,steel);
    B(glass,xx,3.30,-132.42,1.04,.16,.48,i%3?ice:berry);
  }
  sign(-17.80,4.00,-131.84,5.44,.88,'夜间结算','夜班领薪  ·  凭单取款','#e2bee1');
  for(const [x,y,z,colour,power] of [[-25.0,3.20,-125.84,0x79cfdb,52],
    [-22.24,3.96,-128.40,0xca86cf,58],[-18.40,3.12,-131.52,0xeaaf72,61]]){
    const light=new PointLight(colour,power,11,2);
    light.position.set(x,y,z);light.userData.nightPower=power;scene.add(light);lights.push(light);
  }
}
