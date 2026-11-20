import {serviceVessel,vesselPoint} from './nyc-harbor-tender.js';

// These lamps are bolted to three existing pieces of urban infrastructure.
// All dimensions are in metres. New columns sit in occupied railing or wall
// envelopes, and everything spanning a public deck is above head clearance.
export function fitIndustrialPower({B,light,collide,sign}){
  const lens='districtWorkLens',steel=0x869ca3,oxide=0x8c6853,iron=0x53666e;
  const amber=0xffc28b,blue=0xb0ece8,ivory=0xffe1b2;
  const coldRear=23.15;
  // The back of the cold store had no service entrance on the garden side.
  // Two independent bays have their own head, housings and wall wash.
  for(const [x,width,colour] of [[-91.9,6.6,amber],[-82.65,5.8,blue]]){
    B('metal',x,1.75,coldRear+.10,width,2.76,.22,iron);
    const leaf=width*.5-.10;
    for(const side of [-1,1]){
      const door=x+side*width*.25;
      for(let i=0;i<5;i++){
        const length=leaf-(i%2)*.10;
        B('harborPaint',door, .72+i*.49,coldRear+.26,length,.45,.20,i%2?0xb6ae94:0x9da495);
      }
      B('metal',door+side*(leaf*.5-.15),1.82,coldRear+.41,.13,2.82,.16,steel);
      B('metal',door-side*.16,1.68,coldRear+.46,.11,.48,.13,steel);
    }
    B('trim',x,3.32,coldRear+.56,width+.34,.27,1.22,iron);
    for(const sx of [-1,1]){
      B('metal',x+sx*(width*.5-.26),3.71,coldRear+.24,.16,.76,.45,steel);
      B('metal',x+sx*(width*.5-.26),3.91,coldRear+.67,.16,.25,1.02,steel);
    }
    B('metal',x,3.92,coldRear+.87,width-.33,.30,.48,oxide);
    for(let cell=0;cell<6;cell++){
      B(lens,x+(cell-2.5)*width*.137,3.87,coldRear+1.132,width*.12,.105,.047,colour);
    }
    light(x,3.50,coldRear+1.2,colour,115,20);
  }
  // Sign fascia and inset ribbed channels divide the broad 18 m rear elevation.
  B('metal',-87.0,6.45,coldRear+.28,15.10,2.95,.64,iron);
  for(const x of [-93.7,-89.1,-84.0,-80.25]){
    B('harborOchre',x,6.46,coldRear+.63,.20,3.23,.32,0xc9aa83);
    B('metal',x,8.18,coldRear+.91,.30,.25,1.58,steel);
    B('metal',x,8.11,coldRear+1.53,.78,.34,.60,iron);
    B(lens,x,7.92,coldRear+1.48,.64,.075,.46,ivory);
  }
  for(const x of [-91.9,-82.6])light(x,7.66,coldRear+1.64,amber,88,17);
  sign?.(-87.0,6.41,coldRear+.688,13.32,2.13,'冷链周转仓','07  /  恒温收发  /  夜班装卸','#f2c38d',0);
  // A steel return around the adjacent warehouse carries a blue pipe bridge.
  for(let i=0;i<9;i++){
    B('harborHullBlue',-114+(i-4)*1.86,4.04,23.03,1.81,.86,.40,0x95aba9);
    B('metal',-114+(i-4)*1.86,4.61,23.17,1.8,.19,.30,steel);
  }
  for(const x of [-120,-111.5,-107]){
    B('metal',x,4.0,23.40,.22,1.50,.40,iron);
    B(lens,x,4.19,23.68,.23,.40,.13,blue);
  }
  light(-110.4,4.36,24.0,blue,88,17);

  // Raised cable trough along the viaduct parapet: sectional covers, box
  // splices and alternating pool lights. Handrails and the stair openings are
  // left clear, including the north-side access at x=-41.
  const bridgeFloor=6.51, rail=-26.55;
  for(const [lo,hi] of [[-130,-96],[-90,-55],[-48,-19],[-12,15],[22,39]]){
    for(let x=lo;x<hi;x+=3.55){
      const width=Math.min(3.50,hi-x),cx=x+width*.5;
      B('metal',cx,bridgeFloor+.68,rail,width,.35,.23,iron);
      B('harborPaint',cx,bridgeFloor+.9,rail,width,.09,.31,0x82968e);
      B('metal',cx-width*.4,bridgeFloor+.7,rail-.13,.16,.39,.13,steel);
    }
  }
  const portals=[[-124,0],[-103,1],[-69,2],[-44,3],[-16,4],[21.6,5]];
  for(const [x,index] of portals){
    const z=-28.6,flip=index%2?-1:1,colour=index%3===1?amber:blue;
    for(const side of [-1,1]){
      const rz=z+side*2.09;
      B('metal',x,bridgeFloor+2.12,rz,.19,4.24,.23,iron);
      B('harborPaint',x,bridgeFloor+.35,rz,.36,.70,.32,0x8fa59b);
      B('metal',x,bridgeFloor+.11,rz,.52,.22,.42,steel);
      collide(x,bridgeFloor+2.12,rz,.19,4.24,.23);
      for(let k=0;k<3;k++){
        B('harborPaint',x,bridgeFloor+3.54+k*.26,rz-side*k*.26,.53,.36,.43,0xa5b8aa);
      }
      B(lens,x+.107,bridgeFloor+2.07,rz,.045,.51,.11,colour);
      B(lens,x-.107,bridgeFloor+2.07,rz,.045,.51,.11,colour);
    }
    B('metal',x,bridgeFloor+4.20,z,.51,.41,4.52,steel);
    B('harborHullBlue',x,bridgeFloor+4.48,z,.64,.21,3.72,0x819da0);
    for(const dz of [-.84,.84]){
      B('metal',x,bridgeFloor+3.95,z+dz,.86,.23,1.06,iron);
      B(lens,x,bridgeFloor+3.815,z+dz,.67,.06,.86,colour);
    }
    light(x,bridgeFloor+3.58,z+flip*.43,colour,132,19.5);
    for(const s of [-1,1]){
      const cx=x+s*3.12,rz=z+flip*1.98;
      for(const ofs of [-.91,.91])B('metal',cx+ofs,bridgeFloor+.68,rz,.21,.24,.39,iron);
      B('metal',cx,bridgeFloor+.82,rz,2.61,.24,.25,steel);
      B(lens,cx,bridgeFloor+.78,rz-flip*.143,2.31,.10,.05,colour);
    }
    if(index===1||index===2){
      for(const side of [-1,1])B('metal',x+side*.40,bridgeFloor+3.64,z+flip*1.17,.20,.54,1.15,iron);
      const dir=index===2?-1:1;
      sign?.(x+dir*.52,bridgeFloor+3.68,z+flip*1.12,1.65,.46,
        index===2?'换乘步廊':'西端养护','架 空 供 电',index===2?'#9bdcd8':'#f0c58f',dir*Math.PI/2);
    }
  }
  // The cable monitors hang below the handrail. The horizontal cases leave
  // a clear sightline for both the inspection crew and the shoulder camera.
  for(const x of [-70.84,-16.84,18.0]){
    B('harborPaint',x,bridgeFloor+.35,rail,1.28,.50,.32,0x91a8a0);
    B('metal',x,bridgeFloor+.38,rail-.18,.92,.34,.10,iron);
    B(lens,x,bridgeFloor+.39,rail-.24,.71,.14,.06,blue);
  }

  // Deck floodlights and tug windows remain readable across the water, where
  // the mobile renderer's six nearest fully dynamic lights stay ashore.
  const s=serviceVessel;
  const ship=(m,u,y,v,w,h,d,c)=>B(m,...vesselPoint(u,y,v),w,h,d,c,s.yaw);
  for(const [idx,v] of [-15.57,-14.10,-12.62,-11.15].entries()){
    ship(lens,4.25,5.78,v,.08,.62,.87,idx===2?0x8da8a1:0xd2c49e);
    ship('harborPlate',4.30,5.65,v,.10,.08,1.0,iron);
    ship('harborPlate',4.30,5.73,v,.10,.75,.07,iron);
  }
  for(const v of [-7.40,1.00,9.15]){
    ship('harborPlate',4.35,4.13,v,.24,2.90,.24,iron);
    ship('harborOchre',4.55,5.42,v,.63,.26,.36,0xbfa586);
    ship(lens,4.89,5.40,v,.14,.22,.31,ivory);
    ship(lens,4.59,5.26,v,.46,.08,.30,ivory);
    for(const d of [-2.35,0,2.35]){
      ship('harborPlate',5.44,2.48,v+d,.19,.18,1.88,steel);
      ship(lens,5.53,2.47,v+d,.04,.105,1.47,0x739395);
    }
    light(...vesselPoint(5.40,4.85,v),ivory,148,23);
  }
  for(const z of [8.55,15.85]){
    // Twin banks on the original crane trestle, pointing at quay and boat.
    B('harborOchre',-143.54,10.52,z,.76,.56,1.66,0xc4a07a);
    for(const dz of [-.41,.41]){
      B('metal',-143.03,10.39,z+dz,.58,.51,.66,iron);
      B(lens,-142.70,10.36,z+dz,.095,.32,.48,amber);
      B(lens,-143.01,10.095,z+dz,.44,.06,.48,ivory);
    }
    light(-143.0,9.72,z,amber,230,27);
    for(let level=0;level<7;level++){
      const y=2.45+level*1.04;
      B('harborOchre',-143.48-level*.038,y,z,.28,.96,.30,0xc7ac80);
      if(level%2===0)B(lens,-143.29-level*.038,y+.09,z,.06,.48,.20,0xba8149);
    }
  }
  B('harborHullBlue',-143.12,10.97,12.84,.26,1.49,6.83,iron);
  sign?.(-142.92,10.97,12.84,6.44,1.12,'内河转运','07  /  夜 航 卸 驳','#dec498',Math.PI/2);
  // Boarding and transfer share the jetty but use opposite strips. These
  // two cantilevers sit on its existing beacon plinths. The central gap
  // preserves the silhouette of the tug and the passage to the river.
  for(const side of [-1,1]){
    const cz=4.29*side,x=-139.2;
    B('harborHullBlue',x,1.89,cz,.55,2.86,.51,iron);
    B('harborPlate',x,1.66,cz,.71,1.52,.65,steel);
    B('harborOchre',x,2.78,cz,.82,.44,.66,0xc5a17d);
    B('harborPlate',x,3.37,cz-.34*side,.60,.46,1.23,steel);
    B('harborOchre',x,3.69,cz-.90*side,.83,.36,2.41,oxide);
    B('harborPlate',x,3.91,cz-1.36*side,1.24,.30,2.56,iron);
    for(const offs of [.74,1.52,2.21]){
      B(lens,x,3.73,cz-offs*side,.89,.115,.55,side<0?blue:ivory);
      B(lens,x+.62,3.91,cz-offs*side,.048,.13,.53,side<0?0x7db9bd:0xe4b57e);
    }
    B('metal',x+.34,2.32,cz,.19,.51,.57,iron);
    B(lens,x+.45,2.34,cz,.046,.26,.39,side<0?blue:amber);
    light(x+.94,3.39,cz-1.07*side,side<0?blue:ivory,47,11);
    collide(x,1.68,cz,.69,2.66,.61);
    for(let i=0;i<4;i++){
      const rx=-130.5-i*2.05;
      B('harborPlate',rx,.395,side*1.41,1.48,.055,.26,iron);
      B(lens,rx,.43,side*1.41,1.13,.025,.11,side<0?0x679196:0xb99562);
    }
  }
  for(const z of [-15.8,14.5]){
    B('harborPlate',-141.35,1.38,z,.48,1.82,.50,iron);
    B('harborOchre',-141.35,2.32,z,.76,.29,.72,oxide);
    B(lens,-141.35,2.17,z,.61,.18,.55,blue);
    light(-141.35,2.02,z,blue,90,17);
  }
}

