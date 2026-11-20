import {keyedCasting} from './nyc-field-voxels.js';
import {vesselPoint,serviceVessel} from './nyc-harbor-tender.js';

// The high-pressure feed turns around the actual front corner of each shed.
// It serves both return streets. Older depots use a piston, the cold stores
// a stepped valve with a clear bore and counter-rotating locking teeth.
export function fitFreightCorners(F,w,serial,sides){
  for(const hand of sides){
    const x=hand*(w/2+.16),v=-2.40,active=(serial+(hand<0?1:0))%2===0;
    const colour=active?0x73eee0:0xffb26e;
    F('harborHullBlue',x,3.52,v,1.28,5.12,3.84);
    F('harborPlate',x,5.76,v,1.92,.64,4.48);
    for(let row=0;row<7;row++){
      const y=1.76+row*.48,cut=Math.max(0,Math.abs(3-row)-1)*.48;
      if(active){
        for(const side of [-1,1]){
          const zz=v+side*(1.20-cut*.56);
          F('harborEnamel',x+hand*.40,y,zz,1.28,.48,1.28-cut*.4);
          F('harborBeacon',x+hand*1.10,y,zz,.16,.32,.70-cut*.35,colour);
        }
      }else{
        F('harborRust',x+hand*.32,y,v,1.28,.48,3.20-cut);
        F('harborBeacon',x+hand*1.00,y,v,.16,.26,2.40-cut,row%3?colour:0xc5e4db);
        F('harborPlate',x+hand*1.12,y,v-.72,.32,.48,.32);
      }
    }
    for(let i=0;i<4;i++){
      const u=hand*(w/2-.16-i*.64),y=4.96+i*.32;
      F('harborPlate',u,y,.96,.96,.96,2.56);
      F('harborBeacon',u,y,2.30,.72,.48,.16,i%3?colour:0xacb8ba);
    }
    F('harborHullBlue',hand*(w/2-.12),4.80,-.80,1.92,1.12,4.80);
    F('harborBeacon',hand*(w/2+.88),4.76,-.72,.16,.48,3.68,colour);
  }
}

// Shore power in a city that no longer sees daylight. The compressed-battery
// shed, exchange racks and two ship-side inductor forks form one installation.
// The river end projects over the water; the rear end stands on existing yards.
export function buildHarborInduction({B,C,panel,label,lights}){
  const steel='harborHullBlue',plate='harborPlate',ceramic='harborEnamel',coil='harborOchre',lens='harborBeacon';
  const cyan=0x7af3df,amber=0xffaa53,ivory=0xffdd9d,petrol=0x406078;
  function block(mat,x,y,z,w,h,d,tint=0xffffff){B(mat,x,y,z,w,h,d,tint,0,null,true);}
  const casting=(m,x,y,z,w,h,d,t=0xffffff,seed=0)=>keyedCasting({box:block,panel},m,x,y,z,w,h,d,t,seed);
  // High current passes through a real gap between two slotted conductors.
  // Alternating square yoke fingers are visible against sky from either side.
  function transformer(x,z,base,stacks,hand){
    const bottom=base+1.28,top=bottom+stacks*2.56;
    block(steel,x,base+.48,z,8.96,.96,6.4);
    block(plate,x,base+1.12,z,7.68,.64,5.76);
    for(const side of [-1,1]){
      const xx=x+side*2.56;
      block(steel,xx,(bottom+top)/2,z,2.24,top-bottom,2.88);
      C(xx,(bottom+top)/2,z,2.56,top-bottom,3.84);
      for(let i=0;i<stacks;i++){
        const yy=bottom+(i+.5)*2.56,claw=i%3===0?.64:0;
        // Copper winding shoes turn the corners and slot into a dark return.
        block(steel,xx-side*.16,yy-.24,z,1.92,1.60,3.84);
        for(const fl of [-1,1]){
          casting(coil,xx-side*.16+fl*1.04,yy-.24,z,.80,1.60,4.48,0xd7b491,i);
          casting(coil,xx-side*.16,yy-.24,z+fl*1.92,1.44,1.60,.64,0xc8a076,i+1);
        }
        block(steel,xx+side*.48,yy+.60,z,2.56,.64,4.16);
        block(ceramic,xx+side*.96,yy-.10,z,.64,1.28,2.88,0xcbd2b8);
        for(const e of [-1,1]){
          block(lens,xx,yy-.3,z+e*2.26,2.24,1.0,.22,i%3===0?ivory:amber);
          block(plate,xx-side*.96,yy-.4,z+e*2.42,.32,1.32,.64);
        }
        block(lens,xx-side*1.60,yy+.04,z, .48,1.28,1.60,cyan);
        if(i%2===0){
          block(plate,xx-side*(1.60+claw*.5),yy+.72,z,1.60+claw,.64,3.84);
          block(lens,xx-side*(2.34+claw),yy+.72,z,.16,.44,1.92,cyan);
        }
      }
    }
    // Partial closure: one jaw reaches above the other, like a plugged coupler.
    for(let n=0;n<4;n++){
      const xx=x+hand*(2.56-n*.64);
      block(n%2?plate:steel,xx,top+.48+n*.64,z,2.56+n*.32,.80,3.84);
      block(lens,xx,top+.48+n*.64,z+2,1.60+n*.32,.40,.32,cyan);
    }
    block(coil,x-hand*2.56,top+.48,z,2.88,.96,4.48);
    block(lens,x-hand*2.56,top+1.12,z,1.92,.32,2.56,amber);
  }

  // Towers grow out of the two existing warehouse roofs rather than the
  // machine occupying the aisles in front. A third fork loads the quay.
  transformer(-83.20,-15.36,14.08,8,1);
  transformer(-117.12,18.88,11.52,7,-1);
  transformer(-144.96,-19.20,.48,10,1);
  // The charging coupler hangs over the end of the public pier. Its open
  // centre frames a boat at working height; the hoist rides on the two
  // existing dock fingers. The central walking jetty continues beneath it.
  const gateX=-146.88, hub=9.28;
  for(const bank of [-1,1]){
    const z=bank*14.72;
    // A sunk inner bus is framed by two toothed legs with open intervals.
    // The service aperture continues through the column from the foot uphill.
    for(const side of [-1,1]){
      casting(steel,gateX,7.68,z+side*.80,2.24,14.40,.96,0xacccc5,bank+2);
      for(let course=0;course<8;course++){
        const y=1.42+course*1.60;
        block(course%3===0?coil:plate,gateX, y,z+side*.50,1.92,.32,.64);
        if(course%2===0)block(lens,gateX+.98,y,z+side*.54,.16,.22,.32,course%4?cyan:amber);
      }
    }
    block(coil,gateX-.56,7.68,z,.32,14.40,.32);
    casting(plate,gateX,.96,z,2.56,.96,2.56,0xc1c8b0,1);

    C(gateX,7.68,z,2.56,14.40,2.56);
    for(let j=0;j<4;j++){
      block(j%2?plate:coil,gateX,12.80+j*.64,z-bank*j*.64,3.84,.64,3.20);
      block(lens,gateX+1.98,12.80+j*.64,z-bank*j*.64,.16,.32,2.24,amber);
    }
  }
  block(steel,gateX,15.36,0,3.20,1.28,30.08);
  C(gateX,15.36,0,3.20,1.28,30.08);
  for(let j=-4;j<=4;j++){
    const z=j*3.20;
    block(plate,gateX,15.36,z,3.84,1.92,.64);
    if(j!==0)block(lens,gateX+1.65,15.36,z+1.28,.24,.32,1.92,j%2?cyan:amber);
  }
  for(const e of [-1,1])block(steel,gateX,13.60,e*2.56,.96,3.20,.96);
  // A castellated annular jaw, cut all the way through along X. Each
  // band includes its illuminated face, a deeper copper body and a rim.
  const outer=[2,4,5,6,6,6,6,6,5,4,2],inner=[0,0,2,3,4,4,4,3,2,0,0],cell=.64;
  for(let j=0;j<outer.length;j++){
    const y=hub+(j-5)*cell,limit=outer[j],hole=inner[j];
    const runs=hole===0?[[-limit,limit]]:[[-limit,-hole],[hole,limit]];
    for(const [a,b] of runs){
      const z=(a+b)*cell/2,width=(b-a+1)*cell;
      block(coil,gateX,y,z,2.56,cell,width);
      C(gateX,y,z,2.56,cell,width);
      // The glass cells sit in saddles in alternating copper courses.
      for(let n=a;n<=b;n++){
        const raised=(n+j)%3===0,zz=n*cell;
        for(const dir of [-1,1]){
          const off=raised?1.50:1.36;
          block(raised?plate:steel,gateX+dir*(off-.06),y,zz,raised?.48:.32,cell,cell);
          block(lens,gateX+dir*(off+.18),y+(j%2?.06:-.06),zz,.32,raised?.32:.48,.48,
            j<3?0xffb062:j<6?ivory:cyan);
        }
      }
      block(plate,gateX+1.28,y,b*cell,.64,cell,cell);
      if((j===3||j===7)&&a!==-limit){
        block(steel,gateX+1.48,y,z, .64,.48,width*.78);
        block(plate,gateX+1.84,y,z+.32,.24,.32,.48);
      }
    }
  }
  for(const s of [-1,1]){
    block(steel,gateX,5.76,s*1.76,1.92,1.92,.96);
    block(lens,gateX+.99,5.44,s*1.76,.24,.96,.48,cyan);
    block(coil,gateX,hub,s*3.76,3.20,1.92,1.12);
    block(plate,gateX+1.76,hub,s*3.76,.48,1.44,.80);
  }
  lights.push([gateX+1.8,8,0,0xffbf7f,188,25]);
  // Two exchange cassettes sit in the ship's actual tied-down cargo saddles.
  // The hot side faces the coaming and the blue, closed lifting lugs face
  // shore. The wheelhouse stays visible aft and the foredeck stays open.
  const boat=(mat,u,y,v,w,h,d,tint=0xffffff)=>
    B(mat,...vesselPoint(u,y,v),w,h,d,tint,serviceVessel.yaw,null,true);
  for(const [v,h] of [[-3.75,6],[1.45,8]]){
    const y0=4.17;
    boat(steel,-.9,y0+.32,v,5.12,.64,3.84);
    for(let i=0;i<h;i++){
      const yy=y0+.64+i*.64,cut=i===0||i===h-1?.64:i===1?.32:0;
      boat(i%2?steel:coil,-1.12,yy,v,3.84-cut,.64,3.20-cut);
      boat(lens,.84-cut*.5,yy,v,.24,.42,2.56-cut,i%3===0?ivory:amber);
      for(const side of [-1,1]){
        boat(ceramic,-1.32,yy,v+side*(1.66-cut*.5),2.56-cut,.48,.40);
        if(i%2===0)boat(lens,-1.60,yy,v+side*(1.92-cut*.5),1.28,.32,.18,cyan);
      }
    }
    for(const s of [-1,1]){
      boat(plate,-.96+s*2,y0+1.92,v, .64,3.84,4.16);
      boat(plate,-.96+s*2,y0+h*.64+.96,v,.96,.64,2.56);
      boat(lens,-.96+s*2,y0+h*.64+1.38,v,.48,.32,1.60,cyan);
    }
  }
  // Outboard watch gallery: four warm cabin apertures are set well behind
  // the guard rails and return into both end walls of the vessel's bridge.
  boat(steel,4.12,4.80,-13.12,2.56,.64,8.96);
  boat(plate,4.14,7.52,-13.12,2.88,.64,9.60);
  for(let j=0;j<4;j++){
    const v=-16.48+j*2.24;
    boat(lens,4.26,6.24,v,.32,1.60,1.76,j===3?0x9de9df:0xf2be82);
    boat(steel,4.72,6.08,v-.96,1.28,2.56,.48);
    boat(plate,5.08,5.28,v,.64,.32,2.08);
    if(j%2===0)boat(lens,5.42,5.54,v,.16,.16,.96,cyan);
  }
  boat(plate,4.66,5.88,-17.44,1.60,1.60,.64);
  // A hinged, slotted power shoe runs from the nearest mast to the ship's
  // loading well, with a break in the casing at each expansion joint.
  const end=vesselPoint(3.84,0,6.40),railZ=end[2],yArm=7.68;
  const run=gateX-end[0],joints=8,pitch=run/joints;
  for(let i=0;i<joints;i++){
    const xx=end[0]+(i+.5)*pitch,cy=yArm+Math.min(i,3)*.32;
    block(i%2?steel:plate,xx,cy,railZ,pitch+.08,.96,1.60);
    block(coil,xx+pitch*.34,cy,railZ,.40,1.28,2.24);
    block(lens,xx,cy-.32,railZ+.84,pitch*.55,.32,.24,i%3===0?amber:cyan);
  }
  // The feed exits at the side cheek, leaving the induction bore open.
  block(plate,gateX-1.44,8.96,(railZ+3.76)*.5,1.60,1.28,Math.abs(railZ-3.76)+1.60);
  block(steel,end[0],6.88,railZ,2.56,4.16,2.24);
  for(let i=0;i<5;i++){
    block(i%2?coil:plate,end[0],5.44+i*.64,railZ,2.88,.48,2.56);
    block(lens,end[0]+1.49,5.44+i*.64,railZ,.24,.32,1.92,i%2?amber:cyan);
  }
  lights.push([...vesselPoint(2.56,7.84,.64),0xffa54f,198,20]);
  lights.push([...vesselPoint(4.48,4.16,6.40),0x69def0,172,23]);

  // Each cabinet lands on the occupied end of its depot. The ground-floor
  // opening beside the cabinet stays clear all the way to the service street.
  for(const [x,z,face] of [[-65.44,-10.65,1],[-80.56,-7.95,1],[-107.56,8.65,-1]]){
    const put=(mat,u,y,v,w,h,d,color)=>block(mat,x+face*u,y,z+face*v,w,h,d,color);
    put(steel,0,1.84,.76,3.52,2.72,.64,petrol);
    for(let row=0;row<2;row++)for(let bay=0;bay<3;bay++){
      const u=(bay-1)*.96,y=1.17+row*1.28;
      put(plate,u,y,1.02,.96,1.24,.48);
      put(steel,u,y,1.32,.80,.96,.32,petrol);
      if(row===1&&bay===2){
        put(lens,u,y,1.49,.48,.68,.12,cyan);
        put(steel,u,y,1.57,.24,.38,.12);
      }else{
        put(coil,u,y,1.53,.56,.76,.38);
        put(lens,u,y+.16,1.75,.48,.24,.12,bay===0?cyan:amber);
        put(steel,u,y-.28,1.69,.32,.16,.24);
      }
    }
    put(steel,0,3.25,1.02,3.84,.40,1.44);
    put(lens,0,3.03,1.50,3.20,.12,.32,cyan);
    C(x,1.75,z+face*.94,3.52,2.80,1.65);
    lights.push([x,2.80,z+face*1.82,0x70e4db,70,9]);
  }
  // The transformer above the northern shed feeds an induction inspection
  // throat above BOTH truck lanes. It steps down towards the warehouse doors;
  // its clear crown sits higher than six metres even in the outer lanes.
  const checkpoint=-82.56;
  for(const side of [-1,1]){
    for(let course=0;course<6;course++){
      const z=side*(10.40-course*1.60),y=6.72+Math.min(course,3)*.96;
      block(steel,checkpoint,y,z,4.48,2.56,2.56);
      block(ceramic,checkpoint+.40,y+.96,z,4.48,.64,2.56,0xc2cbc3);
      block(coil,checkpoint+1.76,y,z,1.28,1.92,2.24);
      block(lens,checkpoint+2.46,y+.10,z,.32,1.28,1.60,side===1?cyan:amber);
      block(plate,checkpoint+2.53,y+.12,z+side*.66,.64,1.60,.32);
      block(lens,checkpoint-.24,y-1.30,z,2.56,.24,1.60,side===1?0x8bddd3:0xffcb7b);
      C(checkpoint,y,z,4.48,2.56,2.56);
    }
  }
  block(plate,checkpoint,10.24,0,4.48,1.28,4.48);
  block(steel,checkpoint,9.44,0,3.20,.64,3.84);
  for(const z of [-.80,.80])block(lens,checkpoint+1.68,9.57,z,.24,.40,.80,cyan);
  // The hot jaw is labelled from both directions of the freight street.
  label(checkpoint+2.42,10.68,-.16,5.76,.96,'通仓检斤','货运专线  /  03','#c3f7e9',Math.PI/2);
  lights.push([checkpoint+.8,7.20,4.48,0x68dfdd,220,17]);
  lights.push([checkpoint+.8,7.20,-4.48,0xffa54e,200,16]);
  // The perpendicular rear lanes receive cold fluid from these crossheads.
  // Both headers end in the return walls. The staggered actuators descend
  // only above the warehouse forecourts; trucks pass in the middle.
  for(const [x,z,feed] of [[-73,-13.44,1],[-100.5,-17.92,-1],[-100.5,16.32,1],[-73,19.84,-1]]){
    block(steel,x,7.52,z,14.72,1.28,3.20);
    C(x,7.52,z,14.72,1.28,3.20);
    for(const side of [-1,1]){
      for(let j=0;j<4;j++){
        const xx=x+side*(6.08-j*1.28),y=5.60+Math.min(2,j)*.64;
        block(plate,xx,y,z,1.44,1.60,2.56+j*.32);
        block(coil,xx,y+.64,z+feed*1.12,1.28,.48,1.60);
        for(const face of [-1,1]){
          block(lens,xx,y,z+face*(1.34+j*.16),1.12,.80,.24,
            side===feed?cyan:amber);
          block(steel,xx+side*.48,y,z+face*(1.44+j*.16),.32,1.12,.48);
        }
      }
      for(let j=0;j<3;j++){
        const xx=x+side*6.40,y=3.52+j*.64;
        block(steel,xx,y,z,2.56,.64,2.56);
        block(lens,xx,y,z+1.34,1.60,.32,.24,j===1?amber:cyan);
      }
    }
    block(plate,x,8.32,z,4.48,1.28,3.20);
    for(const h of [-1,1]){
      block(lens,x,8.36,z+h*1.66,3.20,.64,.24,0xa8e5df);
      block(steel,x-.80,8.40,z+h*1.82,.32,.96,.32);
    }
    lights.push([x+2.40,5.12,z+feed*1.92,0x76e2dc,146,16]);
  }
  // The long north rear rack fits above the occupied container footprint.
  for(const [x,z,width] of [[-59,-44.5,12],[-88,-45,11.7],[-114,-44.5,10.5]]){
    for(const hand of [-1,1]){
      block(steel,x+hand*width*.42,4.0,z,1.12,2.56,2.56);
      block(plate,x+hand*width*.42,5.12,z,1.76,.64,3.20);
    }
    block(steel,x,5.60,z,width+.64,.64,3.52);
    C(x,4.48,z,width,3.20,2.72);
    for(let i=-1;i<=1;i++){
      const xx=x+i*2.56;
      block(ceramic,xx,3.92,z,2.24,1.92,2.72);
      for(const s of [-1,1]){
        block(lens,xx,4.12,z+s*1.40,1.76,1.04,.22,i===1?0xffcc8c:0x8ce2d8);
        block(steel,xx-.48,3.84,z+s*1.50,.24,1.44,.32);
      }
    }
    for(const end of [-1,1])block(lens,x+end*(width*.5-.32),5.59,z,1.28,.24,3.68,cyan);
    lights.push([x,3.84,z+1.55,0x89dfe3,102,14]);
  }
  // A true suspended busduct, articulated at 1.28-m ceramic collars,
  // links those yards and the two active work streets above truck height.
  function trunk(axis,a,b,fixed,y,litSide){
    const P=(mat,u,yy,v,w,h,d,tint)=>{
      if(axis==='x')block(mat,u,yy,fixed+v,w,h,d,tint);
      else block(mat,fixed+v,yy,u,d,h,w,tint);
    };
    const m=(a+b)/2,len=b-a;
    P(steel,m,y,0,len,1.28,2.24);
    if(axis==='x')C(m,y,fixed,len,1.60,2.88);else C(fixed,y,m,2.88,1.60,len);
    P(plate,m,y+.72,0,len,.32,2.88);
    for(let u=a+2.56,index=0;u<b-1;u+=4.48,index++){
      P(coil,u,y,0,.64,1.92,2.88);
      P(lens,u+1.28,y-.24,litSide*1.17,1.76,.48,.26,index%4===0?amber:cyan);
      if(index%3===0)P(plate,u+1.40,y-.86,0,3.52,.64,3.20);
    }
  }
  trunk('x',-145.6,-83.2,-19.2,19.84,1);
  trunk('z',-19.2,18.88,-116.48,20.48,-1);
  trunk('x',-114.40,-58.88,-44.48,8.32,1);
  for(const x of [-59,-88,-114]){
    block(plate,x,6.88,-44.48,1.92,2.56,2.24);
    block(steel,x,7.84,-44.48,3.20,.64,3.20);
  }
  // The north yard rail turns towards the existing warehouse crane, climbing
  // before it crosses the walking level of the greenway (deck height 6.51).
  for(let j=0;j<7;j++){
    const z=-43.84+j*1.60,y=9.28+j*1.44;
    block(steel,-114.40,y,z,2.88,1.92,3.20);
    block(plate,-114.40,y+.96,z,3.20,.32,2.56);
    block(lens,-115.91,y,z,.24,.64,1.28,j<3?amber:cyan);
  }
  trunk('z',-34.24,-19.20,-114.40,19.84,-1);
  // Tall docking aprons and their floodlights are visible through warehouse
  // gaps and from the footway while leaving the view of the boat open.
  for(const [x,z,y,direction] of [[-117.12,18.88,11.52,1],[-83.2,-15.36,14.08,1],[-144.96,-19.20,.48,-1]]){
    block(steel,x,y+3.20,z+direction*3.20,8.96,.96,2.88);
    for(let j=0;j<4;j++)block(lens,x+(j-1.5)*1.92,y+2.67,z+direction*4.1,1.28,.22,1.12,j===0?ivory:0x9ff0de);
    lights.push([x,y+2.5,z+direction*4.3,0x9de9da,164,23]);
  }
  label(-88,6.72,-43.14,7.04,1.12,'夜航换电','岸电调度  /  03','#8cebd7');
}
