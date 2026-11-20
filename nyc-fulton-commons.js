import {cabinetSkin} from './nyc-voxel-counter.js';

// Static public rooms use the city mesh batch. Dimensions and reservations are
// in metres; furniture backs follow the party walls, outside the through aisle.
export const serviceWindows=upper=>upper?
  [[-21.35,-19.43],[-13.07,-11.22]]:[[-16.26,-14.08],[-13.07,-11.22]];
export function furnishFultonCommons({B,C,label,panel},level,upper,north,south){
  const box=(mat,x,y,z,w,h,d,tint)=>B(mat,x,level+y,z,w,h,d,tint);
  function reserve(x,y,z,w,h,d){C(x,level+y,z,w,h,d,'fulton/furnishing');}
  function plate(x,y,z,w,h,title,sub,reverse=false,color='#dbc49a'){
    label(x,level+y,z,w,h,title,sub,color,reverse?Math.PI:0);
  }
  const oak='districtOak',iron='districtIron',metal='districtZinc',trim='trim',paper='districtPaper';
  const teal=0x779690,brass=0xc19e67,body=upper?0xabb5a4:0x879e98;
  // Fired-clay liner set in front of the old masonry. Headers step forward
  // at the frame bays; the equipment and noticeboards mount onto this face.
  const start=-22.48,end=-10.72;
  // The incoming municipal bus drops from the lobby riser to separate
  // residential breakers upstairs. Its staggered casings occupy the shoulder
  // of the ceiling. Keep the full width of the original corridor at eye level.
  for(const [i,x] of [-21.45,-19.53,-17.61,-15.69,-13.77,-11.85].entries()){
    const z=south-(upper?.38:.56),h=upper?2.65:2.64;
    box(iron,x,h,z,1.91,.36,.55,0x576a72);
    box(metal,x,h+.18,z-.044,1.84,.16,.63,upper?teal:brass);
    if(i%3!==1){
      const lum=upper?'districtCool':'districtWarm';
      for(let cell=0;cell<3;cell++)
        box(lum,x+(cell-1)*.32,h-.19,z-.02,.25,.11,.26);
    }
    if(i%2===0){
      for(let k=0;k<3;k++)
        box(k===1?metal:iron,x+.53,h-.07-k*.12,south-.18+k*.04,.28,.20,.54-k*.12,k===1?brass:teal);
    }
    reserve(x,h+.01,z,1.91,.52,.66);
  }
  // Leave two old-brick reveals exposed between the later ceramic panels.
  const apertures=serviceWindows(upper);
  const reveals=[[-19.92,-18.64],[-14.80,-13.52],...apertures].sort((a,b)=>a[0]-b[0]);
  let panelStart=start;
  for(const [lo,hi] of [...reveals,[end,end]]){
    if(lo>panelStart)box(iron,(lo+panelStart)/2,1.93,south-.028,lo-panelStart,1.68,.056);
    panelStart=Math.max(panelStart,hi);
  }
  for(let row=0;row<5;row++){
    for(let edge=start-(row%2)*.32;edge<end;edge+=.64){
      const lo=Math.max(start,edge),hi=Math.min(end,edge+.64);
      if(hi-lo<.035||reveals.some(([a,b])=>hi>a&&lo<b))continue;
      const column=Math.round((edge-start)/.64);
      const header=(column+row)%5===0;
      box('districtMortar',(lo+hi)/2,1.29+row*.32,south-(header?.087:.063),
        hi-lo-.015,.308,header?.090:.065,
        [0xbca593,0xb6a293,0xc7b3a4,0xbaaa9b][(column+row+4)%4]);
    }
  }
  box(iron,-16.58,2.72,south-.12,11.64,.18,.22);
  box(metal,-16.58,2.76,south-.24,11.64,.065,.06,teal);
  // Both floors look straight through the south wall. Mullions and two loose
  // guard bars keep the exterior riser and cross street visible at an angle.
  for(const [lo,hi] of apertures){
    const w=hi-lo,x=(hi+lo)/2;
    for(const side of [-1,1]){
      const edge=x+side*(w/2+.04);
      box(iron,edge,1.95,south-.06,.16,1.44,.36);
      for(const y of [1.36,2.51])box(metal,edge,y,south-.08,.25,.24,.48,brass);
    }
    box(oak,x,1.26,south-.08,w+.37,.16,.52,0xb39c83);
    box(iron,x,2.61,south-.07,w+.44,.20,.39);
    for(const y of [1.50,2.31])box(metal,x,y,south+.04,w,.06,.12,teal);
    box(metal,x+w*.21,1.92,south+.10,.085,1.23,.14,teal);
    reserve(x,1.94,south+.09,w,1.36,.08);
  }
  // The feeder is shared by both floors. The open end of each stepped cover
  // exposes the cable entering the next housing.
  for(const x of [-21.65,-17.55,-13.38]){
    box(iron,x,2.21,south-.14,.34,.89,.20);
    box(metal,x,2.24,south-.247,.23,.66,.10,teal);
    for(const y of [1.97,2.50])box(metal,x,y,south-.30,.28,.08,.064,brass);
  }
  const meterX=upper?-14.43:-20.72;
  box(iron,meterX,1.90,south-.17,1.28,.86,.25);
  for(const dx of [-.29,.29]){
    box(metal,meterX+dx,1.91,south-.32,.51,.70,.10,teal);
    box(iron,meterX+dx,2.01,south-.385,.37,.30,.06);
    box('districtCool',meterX+dx,2.04,south-.426,.22,.058,.025);
    box(metal,meterX+dx,1.73,south-.394,.29,.075,.07,brass);
  }
  reserve(meterX,1.90,south-.21,1.30,.88,.44);
  if(upper){
    plate(meterX,2.46,south-.21,1.25,.24,'三层分路','应急照明  /  住户用电',true,'#a3cdb8');
    for(let i=0;i<5;i++){
      const x=meterX-.47+i*.225;
      box(iron,x,1.45,south-.26,.17,.16,.18);
      box(i<3?'districtWarm':'districtZinc',x,1.45,south-.369,.10,.082,.052,
        i<3?0xdcbf83:0x707c76);
    }
  }
  // Repeated bays terminate in real ledges, field panels and corner blocks.
  for(const wall of [north,south]){
    const side=wall===north?1:-1;
    for(let i=0;i<9;i++){
      const x=-21.78+i*1.24;
      if(side===1&&upper&&(Math.abs(x+18.32)<.91||Math.abs(x+20.70)<.87))continue;
      if(panel){
        const palette=[null,[iron,0x86918b],[upper?oak:'districtPlaster',upper?0xbfa382:body],
          [upper?oak:'districtPlaster',upper?0xa88d72:0xb6c9bb],[metal,brass]];
        const local=(u,y,z)=>[x+side*(u-3.5)*.16,level+y*.16,wall+side*(z*.16-.09)];
        // A continuous recessed middle course ties the keyed ends of the
        // seven-cell panels together. The old skirting conceals their seat.
        cabinetSkin([7,7,2],fill=>{
          fill(1,0,0,0,7,1,2);fill(2,0,1,0,7,6,1);
          for(let row=1;row<6;row++){
            const left=(row+(upper?1:0))%3===0?3:row%2+1;
            fill(3,0,row,1,left,row+1,2);fill(2,5+row%2,row,1,7,row+1,2);
          }
          fill(2,1,3,1,6,4,2);fill(1,0,6,0,7,7,2);
          fill(4,(i%3)*2,6,1,(i%3)*2+1,7,2);
        },panel,local,palette);
      }else{
        box(iron,x,.08,wall+side*.07,1.22,.16,.14);
        box(upper?oak:trim,x,.58,wall+side*.058,1.17,.84,.106,upper?0xa88d72:body);
        box(upper?oak:metal,x,.58,wall+side*.118,.92,.56,.064,upper?0xc0a17c:teal);
      }
      box(iron,x,1.065,wall+side*.085,1.23,.10,.17);
      box(metal,x,1.127,wall+side*.086,1.23,.032,.16,brass);
    }
  }
  // The north party wall has no windows. Insulated ceramic panels turn
  // their full-depth headers under the ceiling between the door openings.
  if(panel)for(const [begin,n] of (upper?[[-16.85,21],[-12.68,10]]:[[-21.90,18]])){
    const palette=[null,['districtPlaster',upper?0xbebca5:0xa4b3a9],
      ['districtPlaster',upper?0xa8b1a2:0x98a798],[metal,teal]];
    const local=(x,y,z)=>[begin+x*.16,level+1.17+y*.16,north-.105+z*.16];
    cabinetSkin([n,9,2],fill=>{
      fill(1,0,0,0,n,9,1);
      for(let y=0;y<9;y++)for(let x=0;x<n;x++){
        const bond=(x+2*Math.floor(y/2))%7;
        if(y===8||bond<2||bond===2&&(y&1))fill(y===8?3:2,x,y,1,x+1,y+1,2);
      }
    },panel,local,palette);
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
    box(x===-19.74?'districtCool':'districtWarm',x,2.679,76.45,.50,.042,.30);
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
    // A changeover notice lives on the residents' actual corkboard. Its
    // little enamel test lamp takes power off the feeder trunk overhead.
    box(iron,-16.15,2.26,south-.17,1.51,.13,.25);
    box(metal,-16.79,2.48,south-.16,.07,.39,.10,teal);
    box('districtWarm',-16.82,2.21,south-.307,.084,.094,.044);
    plate(-16.13,1.83,south-.235,1.13,.39,'今夜切换备用电','水泵照常  ·  走廊留灯',true,'#d9bd84');
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
    plate(-14.14,1.93,north+.24,1.66,.24,'七号楼信箱','住户信件  /  留条处');
    box(oak,-14.14,.49,north+.23,2.90,.14,.46);
    reserve(-14.14,1.04,north+.19,2.9,2.05,.44);
    const z=south-.30;
    box(iron,-16.20,.23,z,1.75,.32,.40);
    for(const dx of [-.67,.67])box(metal,-16.20+dx,.17,z,.16,.33,.48,teal);
    for(const dx of [-.46,0,.46])box(oak,-16.20+dx,.46,z-.05,.44,.15,.49,0xa87b58);
    box(oak,-16.20,.72,south-.11,1.80,.29,.17,0xb48b6b);
    reserve(-16.20,.44,z-.03,1.84,.87,.53);
    // Parcel drawers fit below the lobby's eastern window ledge. The exit
    // aisle and the turning space opposite the lift stay clear at eye level.
    const locker=-12.24;
    box(iron,locker,.55,south-.22,1.45,1.04,.40);
    for(const [dx,y,w,h] of [[-.35,.60,.61,.81],[.34,.40,.61,.42],[.34,.87,.61,.40]]){
      box(metal,locker+dx,y,south-.455,w,h,.09,teal);
      box(iron,locker+dx+.18,y+.09,south-.514,.09,.12,.04);
    }
    // A wall-powered after-hours locker has three separate sealed doors.
    // The underslung amber lamp lights the one occupied bay; the recessed
    // scanner and pick-up trough fit inside the existing bench depth.
    box(iron,locker,1.145,south-.28,1.62,.15,.54);
    box(metal,locker,1.24,south-.22,1.60,.055,.46,teal);
    plate(locker+.30,.72,south-.528,.66,.22,'夜递自取','住户包裹',true,'#a7d8c5');
    box('districtWarm',locker-.35,1.063,south-.46,.41,.026,.10);
    box(iron,locker-.35,.76,south-.525,.37,.19,.08);
    box('districtWarm',locker-.35,.76,south-.571,.27,.050,.028);
    box(iron,locker+.34,.99,south-.51,.43,.13,.11);
    box('districtCool',locker+.29,.99,south-.573,.18,.083,.027);
    for(const dx of [0,.075])box(metal,locker+.40+dx,.995,south-.576,.043,.048,.039,brass);
    box(metal,locker-.35,.18,south-.51,.59,.10,.22,teal);
    reserve(locker,.63,south-.31,1.65,1.28,.66);
    box(iron,-11.68,1.40,north+.13,.41,.73,.25);
    box('districtCool',-11.68,1.55,north+.267,.27,.13,.024);
    for(let j=0;j<3;j++)box(metal,-11.68,1.38-j*.07,north+.28,.22,.026,.03,brass);
  }
}
