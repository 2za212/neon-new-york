// Static public rooms use the city mesh batch. Dimensions and reservations are
// in metres; furniture backs follow the party walls, outside the through aisle.
export function furnishFultonCommons({B,C,label},level,upper,north,south){
  const box=(mat,x,y,z,w,h,d,tint)=>B(mat,x,level+y,z,w,h,d,tint);
  function reserve(x,y,z,w,h,d){C(x,level+y,z,w,h,d,'fulton/furnishing');}
  function plate(x,y,z,w,h,title,sub,reverse=false){
    label(x,level+y,z,w,h,title,sub,'#dbc49a',reverse?Math.PI:0);
  }
  const oak='districtOak',iron='districtIron',metal='districtZinc',trim='trim',paper='districtPaper';
  const teal=0x779690,brass=0xc19e67,body=upper?0xabb5a4:0x879e98;
  // Repeated bays terminate in real ledges, field panels and corner blocks.
  for(const wall of [north,south]){
    const side=wall===north?1:-1;
    for(let i=0;i<9;i++){
      const x=-21.78+i*1.24;
      if(side===1&&upper&&(Math.abs(x+18.32)<.91||Math.abs(x+20.70)<.87))continue;
      box(iron,x,.08,wall+side*.07,1.22,.16,.14);
      box(upper?oak:trim,x,.58,wall+side*.058,1.17,.84,.106,upper?0xa88d72:body);
      box(upper?oak:metal,x,.58,wall+side*.118,.92,.56,.064,upper?0xc0a17c:teal);
      box(iron,x,1.065,wall+side*.085,1.23,.10,.17);
      box(metal,x,1.127,wall+side*.086,1.23,.032,.16,brass);
    }
  }
  // Cast knees and ceiling beams make a rhythm along the walking axis.
  for(const x of [-21.84,-17.02,-13.56,-10.99]){
    box(iron,x,2.83,(north+south)/2,.22,.18,south-north);
    for(const wall of [north,south]){
      const side=wall===north?1:-1;
      box(metal,x,1.77,wall+side*.065,.15,1.31,.13,teal);
      for(const [y,w,h,d] of [[2.43,.20,.20,.20],[2.58,.27,.14,.32],[2.70,.34,.12,.46]]){
        box(iron,x,y,wall+side*d*.5,w,h,d);
      }
    }
  }
  for(const x of [-19.74,-15.36,-12.02]){
    box(iron,x,2.84,76.45,.56,.16,.34);
    box(metal,x,2.73,76.45,.68,.08,.43,teal);
    box('districtWarm',x,2.679,76.45,.50,.042,.30);
  }
  // Banded tiles in the lobby, end-set blocks on the residential landing.
  for(let row=0;row<4;row++)for(let i=0;i<18;i++){
    const x=-22.08+i*.64,z=north+.39+row*.64;
    box(upper?oak:'districtSlabAlt',x,.008,z,.625,.016,.622,
      upper?((i+2*row)%5===0?0x98806b:0xac977c):((i+row)%4===0?0x8e9890:0xadb0a1));
  }
  for(const z of [north+.16,south-.18])box(metal,-16.62,.019,z,11.28,.021,.05,brass);
  if(upper){
    box(iron,-17.55,2.72,north+.09,8.06,.08,.11);
    for(const x of [-21.29,-19.05,-15.18]){
      box(metal,x,2.54,north+.12,.06,.30,.10,brass);
      box(iron,x,2.27,north+.14,.23,.37,.19);
      box('districtWarm',x,2.27,north+.252,.15,.23,.045);
      for(const y of [2.17,2.37])box(metal,x,y,north+.282,.20,.036,.04,teal);
    }
    // Residents' doors and glazed transoms have separate jamb, infill and sill depths.
    for(const x of [-18.32,-20.70]){
      for(const dx of [-.62,.62]){
        box(oak,x+dx,1.15,north+.16,.12,2.30,.21);
        box(metal,x+dx,.17,north+.19,.16,.32,.24,teal);
      }
      box(iron,x,2.46,north+.11,1.46,.44,.16);
      for(let j=-1;j<=1;j++)box('glass',x+j*.36,2.45,north+.208,.31,.24,.055,0x98a99f);
      box(oak,x,2.71,north+.15,1.56,.10,.29);
      for(const y of [.52,1.26])box(oak,x,y,north+.235,.73,.46,.06,0xb59c79);
    }
    // Hot-water battery at the elevator end, fed by a square pipe and return.
    const z=south-.20;
    box(iron,-19.71,.52,z,1.48,.80,.26);
    for(let j=0;j<9;j++){
      const x=-20.35+j*.16;
      box(metal,x,.54,z-.12,.095,.73,.23,teal);
      box(metal,x,.54,z-.23,.085,.51,.085,0x8d9a8e);
    }
    box(metal,-19.70,.16,z,1.73,.10,.15,brass);
    reserve(-19.71,.48,z-.09,1.70,.94,.47);
    box(iron,-16.15,1.80,south-.10,1.55,.90,.18);
    box(oak,-16.15,1.80,south-.215,1.36,.73,.07,0xb39873);
    for(const [dx,dy,w,h,c] of [[-.40,.05,.32,.42,0xf0dec1],[.04,-.07,.31,.32,0xa9c9c4],[.37,.13,.23,.26,0xceaa82]]){
      box(paper,-16.15+dx,1.80+dy,south-.262,w,h,.025,c);
      box(metal,-16.15+dx,1.80+dy+h*.36,south-.284,.047,.036,.04,brass);
    }
    // A shallow plant shelf is kept near daylight, beyond the path to the lift.
    box(oak,-12.18,.91,south-.16,1.34,.12,.32);
    for(const x of [-12.62,-11.78])box(iron,x,.77,south-.11,.12,.21,.22);
    box('brickBrown',-12.17,1.13,south-.20,.34,.31,.29);
    for(const [dx,dy,w,h] of [[0,.0,.13,.43],[-.12,.0,.15,.18],[.12,.08,.18,.17],[-.10,.19,.13,.15],[.03,.27,.16,.14]]){
      box('leaf',-12.17+dx,1.43+dy,south-.20,w,h,.15);
    }
  }else{
    // Ribbed glass gives the entry borrowed light above the residents' bays.
    const x=-17.38;
    box(oak,x,1.99,north+.12,1.78,1.09,.22,0xbda483);
    box(iron,x,1.99,north+.248,1.57,.91,.06);
    for(let j=0;j<6;j++){
      box('coolWindow',x-.62+j*.25,1.98,north+.292,.194,.71,.032,0xb0b9a2);
      box(metal,x-.72+j*.25,1.98,north+.319,.028,.76,.05,teal);
    }
    box(oak,x,1.43,north+.17,1.89,.10,.31,0xb5977d);
    // Recessed parcel counter, one brass mail slot per apartment and an intercom.
    box(iron,-14.14,1.20,north+.11,2.71,1.69,.22);
    for(let i=0;i<5;i++)for(let j=0;j<3;j++){
      const x=-15.14+i*.50,y=.80+j*.37;
      box(metal,x,y,north+.25,.455,.333,.12,(i+j)%4?teal:0xa5a394);
      box(iron,x,y+.05,north+.327,.29,.045,.04);
      box(paper,x-.095,y-.075,north+.326,.12,.055,.025);
      box(metal,x+.143,y-.058,north+.337,.047,.047,.04,brass);
    }
    plate(-14.14,1.93,north+.24,1.39,.21,'LETTER BOXES','FULTON  /  07');
    box(oak,-14.14,.49,north+.23,2.90,.14,.46);
    reserve(-14.14,1.04,north+.19,2.9,2.05,.44);
    const z=south-.30;
    box(iron,-16.20,.23,z,1.75,.32,.40);
    for(const dx of [-.67,.67])box(metal,-16.20+dx,.17,z,.16,.33,.48,teal);
    for(const dx of [-.46,0,.46])box(oak,-16.20+dx,.46,z-.05,.44,.15,.49,0xa87b58);
    box(oak,-16.20,.72,south-.11,1.80,.29,.17,0xb48b6b);
    reserve(-16.20,.44,z-.03,1.84,.87,.53);
    box(iron,-18.45,.56,south-.22,1.45,1.07,.40);
    for(const [dx,y,w,h] of [[-.35,.60,.61,.81],[.34,.40,.61,.42],[.34,.87,.61,.40]]){
      box(metal,-18.45+dx,y,south-.455,w,h,.09,teal);
      box(iron,-18.45+dx+.18,y+.09,south-.514,.09,.12,.04);
    }
    reserve(-18.45,.54,south-.28,1.46,1.09,.54);
    plate(-18.45,1.38,south-.16,1.27,.32,'DELIVERIES','NIGHT SERVICE',true);
    box(iron,-11.68,1.40,north+.13,.41,.73,.25);
    box('districtCool',-11.68,1.55,north+.267,.27,.13,.024);
    for(let j=0;j<3;j++)box(metal,-11.68,1.38-j*.07,north+.28,.22,.026,.03,brass);
  }
}
