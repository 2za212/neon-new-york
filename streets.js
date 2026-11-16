// Grey model infrastructure. All surface markings and grooves are modeled cuboids.
export function buildStreets({box}) {
  const solid={solid:true};
  const walk={walk:true};
  const floor=(x,y,z,w,h,d,kind='base')=>box(x,y,z,w,h,d,kind,walk);
  const post=(x,y,z,w,h,d,kind='metal')=>box(x,y,z,w,h,d,kind,solid);

  // The urban plinth is stepped into large service blocks at its perimeter.
  floor(0,-.82,-1,170,1.64,142,'base');
  for(let x=-81;x<=81;x+=9) {
    box(x,-1.30,70,8.4,1.35,2.4,'metal');
    box(x,-1.30,-72,8.4,1.35,2.4,'metal');
    for(const z of [-72,70])box(x,-.35,z,8.6,.20,2.6,'trim');
  }
  for(let z=-66;z<=64;z+=10)for(const x of [-86,86]) {
    box(x,-1.25,z,2.2,1.25,9.4,'metal');
    box(x,-.32,z,2.4,.20,9.6,'trim');
  }
  floor(0,.025,-1,18,.05,140,'road');
  floor(0,.04,23.5,168,.08,13,'road');
  // Sidewalks follow the continuous central canyon and break at the cross street.
  for(const side of [-1,1])for(const [z,d] of [[-26.5,87],[49,38]]) {
    floor(side*11.75,.12,z,5.5,.24,d,'base');
    floor(side*9.15,.14,z,.3,.28,d,'trim');
    for(let v=z-d/2+.7;v<z+d/2;v+=1.8) {
      box(side*9.32,.265,v,.12,.025,1.55,'metal');
      box(side*13.85,.247,v,.13,.025,1.55,'metal');
    }
  }
  for(const side of [-1,1]) {
    floor(side*49,.12,15.5,70,.24,3,'base');
    floor(side*49,.12,31.5,70,.24,3,'base');
    floor(side*49,.15,17.14,70,.30,.28,'trim');
    floor(side*49,.15,29.86,70,.30,.28,'trim');
  }
  floor(0,.065,44,17,.13,27,'base');
  // A shallow chevron pad defines the center of the forecourt without a barrier.
  for(let i=0;i<6;i++)for(const side of [-1,1])
    box(side*(1.5+i*.68),.14,43+i*.68,.62,.025,.36,'trim');
  for(let x=-7;x<=7;x+=1.4)for(const z of [33.7,54.3])box(x,.14,z,1.18,.025,.24,'metal');
  // The avenue's panel expansion joints are small, raised model seams.
  for(let z=-67;z<66;z+=8.8) {
    if(z>16&&z<32)continue;
    for(const side of [-1,1])box(side*4.6,.057,z,8.3,.014,.10,'metal');
  }
  for(const side of [-1,1])for(let z=-65;z<17;z+=8.0)box(side*.18,.065,z,.16,.03,3.6,'trim');
  for(const z of [18.4,28.5])for(let x=-7.3;x<=7.3;x+=1.7)
    box(x,.094,z,.83,.026,2.1,'trim');
  for(const x of [-8.2,8.2])for(let z=19;z<29;z+=1.8)box(x,.095,z,.7,.025,.82,'trim');
  // Curb service channels, shallow rectangular drains and inspection covers.
  for(const side of [-1,1])for(const z of [-57,-40,-18,8,38,58]) {
    box(side*8.5,.073,z,.58,.022,1.45,'recess');
    for(let k=-3;k<=3;k++)box(side*8.5,.088,z+k*.18,.47,.025,.045,'metal');
    box(side*10.7,.256,z+1.8,.86,.035,.86,'metal');
    for(const edge of [-1,1])box(side*10.7+edge*.32,.278,z+1.8,.045,.018,.65,'trim');
  }

  function railLine(x1,x2,y,z,depth=1.15) {
    const width=x2-x1;
    for(const side of [-1,1]) {
      const edge=z+side*depth/2;
      box((x1+x2)/2,y+.92,edge,width,.10,.11,'metal');
      box((x1+x2)/2,y+.37,edge,width,.08,.08,'metal');
      for(let x=x1+.3;x<x2;x+=2)box(x,y+.52,edge,.12,1.06,.12,'metal');
    }
  }
  // Elevated line, with paired thin web girders under the rail bed.
  floor(0,8.70,-3,168,.60,7.5,'base');
  for(const z of [-6.58,.58]) {
    box(0,8.10,z,169,.82,.37,'metal');
    box(0,7.63,z,169,.14,.70,'trim');
    box(0,8.57,z,169,.15,.70,'trim');
    for(let x=-80;x<=80;x+=2.3)box(x,8.12,z,.11,.69,.43,'trim');
  }
  for(const x of [-73,-48,-21,21,48,73]) {
    post(x,3.74,-3,1.55,7.48,2.15,'base');
    for(const side of [-1,1]) {
      box(x+side*.58,3.75,-3,.18,7.45,2.35,'trim');
      for(let k=0;k<4;k++)box(x+side*(.52+k*.25),7.04+k*.27,-3,1.15,.32,3.10+k*.28,'base');
    }
    box(x,.36,-3,2.45,.72,3.15,'metal');
    box(x,7.94,-3,5.3,.53,4.4,'base');
  }
  for(let x=-83;x<84;x+=.8) {
    box(x,9.08,-3, .24,.16,2.4,'metal');
    if(Math.round(x/.8)%4===0)box(x,9.035,-3, .39,.07,3.1,'trim');
  }
  for(const z of [-3.76,-2.24]) {
    box(0,9.24,z,168,.18,.20,'recess');
    box(0,9.36,z,168,.09,.29,'metal');
  }
  floor(0,9.02,.12,168,.10,1.20,'trim');
  floor(0,9.02,-6.12,168,.10,1.20,'trim');
  railLine(-83.7,12.65,9.07,.12,1.08);
  railLine(15.75,83.7,9.07,.12,1.08);
  railLine(-83.7,83.7,9.07,-6.12,1.08);
  // Opaque geometric safety panels, modeled at intervals instead of a texture.
  for(let x=-81;x<84;x+=3.4)for(const z of [-6.69,.69]) {
    if(z>.6&&Math.abs(x-14.2)<2.1)continue;
    box(x,9.47,z,2.6,.45,.09,'base');
    box(x,9.75,z,2.6,.09,.13,'metal');
  }
  // A broad switchback-free stair leaves both ground avenues clear.
  const stairX=14.2, count=40,rise=.225,run=.37,start=14.8;
  for(let k=0;k<count;k++) {
    const y=(k+1)*rise,z=start-k*run;
    floor(stairX,y-rise/2,z,2.5,rise,run+.015,'base');
    box(stairX,y-.27,z,2.55,.14,run+.02,'metal');
    for(const side of [-1,1]) {
      box(stairX+side*1.26,y-.16,z,.15,.42,run+.035,'metal');
      box(stairX+side*1.29,y+.99,z,.11,.10,run+.05,'trim');
      if(k%3===0)box(stairX+side*1.29,y+.48,z,.12,1.00,.12,'metal');
    }
    if(k%8===0)box(stairX,y+.012,z+.13,2.23,.025,.055,'trim');
  }
  floor(stairX,8.91,-.18,2.7,.18,2.0,'base');
  for(const [z,h] of [[10.7,2.39],[4.8,5.99]]){
    post(stairX,h/2,z,.60,h,.60,'metal');
    box(stairX,h+.13,z,2.8,.25,.60,'metal');
  }

  // High pedestrian bridge: open cage, stair-stepped truss, slim peripheral beams.
  floor(0,17.80,-35,50,.40,3.3,'base');
  for(const side of [-1,1]) {
    box(0,17.35,-35+side*1.6,50,.48,.22,'metal');
    box(0,19.17,-35+side*1.61,50,.13,.13,'trim');
    box(0,18.54,-35+side*1.61,50,.10,.12,'metal');
    for(let x=-24.5;x<=24.5;x+=2.45) {
      box(x,18.56,-35+side*1.61,.14,1.12,.14,'metal');
      for(let j=0;j<7;j++)box(x+j*.30,17.07-j*.16,-35+side*1.58,.36,.21,.17,'metal');
    }
  }
  for(let x=-24;x<=24;x+=6) {
    for(const side of [-1,1])box(x,19.82,-35+side*1.57,.27,3.55,.27,'base');
    box(x,21.63,-35, .31,.30,3.8,'base');
    box(x,21.90,-35, .45,.16,4.05,'trim');
  }
  for(let x=-24.5;x<25;x+=.8)box(x,18.015,-35,.045,.03,3,'metal');

  function monorailCar(cx,length,front=false) {
    const y=10.59,z=-3;
    box(cx,9.91,z,length-.8,.37,2.55,'recess');
    box(cx,y,z,length,1.12,2.62,'body');
    box(cx,11.31,z,length-.54,.32,2.40,'trim');
    box(cx,11.55,z,length-1.2,.17,1.94,'body');
    for(const side of [-1,1]) {
      box(cx,10.62,z+side*1.328,length-.5,.51,.052,'recess');
      for(let k=-length/2+.75;k<length/2-.2;k+=1.13)
        box(cx+k,10.63,z+side*1.36,.13,.62,.10,'metal');
      for(const dx of [-length*.27,length*.27]) {
        box(cx+dx,10.48,z+side*1.38,.57,1.04,.11,'body');
        box(cx+dx,10.67,z+side*1.45,.34,.49,.06,'recess');
      }
      box(cx,10.015,z+side*1.36,length-.42,.12,.11,'metal');
    }
    for(const dx of [-length*.30,length*.30]) {
      box(cx+dx,9.56,z,1.1,.45,2.1,'metal');
      for(const side of [-1,1])box(cx+dx,9.48,z+side*.88,.72,.35,.36,'recess');
    }
    if(front) {
      for(let k=0;k<4;k++)box(cx-length/2-.11-k*.15,10.09+k*.25,z,.31,.28,2.52-k*.12,'body');
      box(cx-length/2-.52,10.66,z,.12,.56,1.90,'recess');
      for(const side of [-1,1])box(cx-length/2-.70,10.13,z+side*.76,.12,.15,.39,'trim');
    }
  }
  monorailCar(-62,8.5,true);monorailCar(-52.6,8.6);monorailCar(-43.1,8.6);
  for(const x of [-57.3,-47.8])box(x,10.44,-3,.87,.81,2.17,'recess');

  // Blank information totems, control housings and sculpted street-light arms.
  for(const side of [-1,1])for(const z of [-55,-22,36,60]) {
    const x=side*12.8;
    post(x,.40,z,.72,.76,.72,'metal');
    post(x,3.35,z,.24,6.15,.24,'metal');
    for(let k=0;k<5;k++)box(x-side*k*.34,6.26+k*.15,z,.48,.22,.30,'metal');
    box(x-side*1.75,6.86,z,1.60,.23,.48,'trim');
    box(x-side*1.75,6.715,z,1.19,.065,.31,'recess');
  }
  for(const side of [-1,1])for(const z of [15.8,31.5])for(let k=0;k<3;k++) {
    const x=side*(10.2+k*1.6);
    post(x,.55,z,.25,.87,.25,'metal');box(x,.99,z,.36,.12,.36,'trim');
  }
  for(const side of [-1,1]) {
    const x=side*13.5;
    post(x,.30,43,.93,.60,.84,'metal');
    post(x,2.18,43,.32,3.48,.32,'metal');
    box(x,3.01,43,1.36,2.23,.37,'metal');
    box(x,3.03,43-side*.215,1.12,1.92,.12,'recess');
    for(let k=0;k<4;k++)box(x-.42+k*.28,1.74,43-side*.27,.12,.10,.10,'trim');
  }
  // Shelter and bench stand at the plaza margin, all on the opposite side of its clear route.
  floor(18.8,.19,45,6,.38,10,'base');
  for(const z of [41.2,48.8])post(20.75,2.08,z,.24,3.8,.25,'metal');
  box(18.8,4.10,45,6.2,.25,9.2,'body');
  for(let z=40.8;z<49.4;z+=.40)box(18.8,4.28,z,6.1,.11,.11,'trim');
  box(20.65,2.25,45,.16,3.18,7.6,'recess');
  floor(19.8,.85,45,1.35,.25,5.9,'body');
  for(const z of [42.6,47.4])post(19.8,.42,z,.72,.84,.20,'metal');
}
