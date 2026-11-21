import {keyedCasting} from './nyc-field-voxels.js';
import {mooredTender,serviceVessel,vesselPoint} from './nyc-harbor-tender.js';

export function buildHudsonBerth({box:B,beam:L,panel,collider:C,label}){
  const K=(mat,x,y,z,w,h,d,t=0xffffff,seed=0)=>keyedCasting({box:B,panel},mat,x,y,z,w,h,d,t,seed);
  const iron='harborPlate', ochre='harborOchre', blue='harborHullBlue';

  // Two dock fingers leave a water gap at either side of the public jetty.
  for(const {x,z,w,d} of [
    {x:-143.67,z:16.56,w:11.15,d:13.8},
    {x:-143.71,z:-19.20,w:11.23,d:12.2}
  ]){
    K('stone',x,-.47,z,w,1.58,d,0xaab8ad);

    B(iron,x,.20,z,w+.15,.32,d+.19,0xb8bdac);
    B('concrete',x,.40,z,w-.22,.14,d-.20,0xbfc4ba);
    for(const edge of [-1,1]){
      const zz=z+edge*(d/2-.47);
      B('harborOchre',x,.488,zz,w-.42,.035,.13,0xc9b58f);
      for(let xx=x-w/2+.79;xx<x+w/2-.54;xx+=2.76){
        B(blue,xx,-.40,z+edge*d*.501,.47,1.83,.55,0x9aafac);
        B('rubber',xx,-.16,z+edge*d*.53,.46,1.21,.36,0xa1a8a0);
      }
    }
    for(const offset of [-4.55,4.55])B(iron,x,.489,z+offset,w-.31,.030,.072,0x95aba9);
  }

  // Embedded cart rails mark the transfer apron at public level.
  for(const z of [-1.41,1.41]){
    B('concrete',-131.55,.370,z,12.2,.022,.71,0xaab5ad);
    B(iron,-131.55,.386,z,12.2,.023,.085,0xa2b0ae);
    for(let x=-137.5;x<-125.82;x+=1.02)B('harborTimber',x,.378,z,.17,.024,.60,0xa9ae9f);
  }

  // The two gantry trestles are at one end of the visual axis. The middle
  // remains open to the working deck, and the high deck reads as a real span.
  const gx=-145.60,ga=7.95,gb=18.3,bridgeY=11.46;
  B('stone',gx,.01,ga,4.85,1.70,4.2,0xb3beb1);
  for(const [z,lean] of [[ga,1],[gb,-1]]){
    for(const x of [gx-2.20,gx+2.20]){
      K(iron,x,.72,z,1.28,.64,1.60,0xc3cac0);
      K(ochre,x,1.36,z,.96,.64,1.28,0xd5bc98,1);
      L(ochre,[x,.80,z],[x+(gx-x)*.25,bridgeY-.50,z+lean*.70],.67,.71,0xd7bf96);
    }
    B(iron,gx,2.42,z,5.12,.63,.62,0xabb6aa);
    B(ochre,gx,10.38,z+lean*.47,4.99,.69,.81,0xc6b89a);
    L(iron,[gx-2.1,2.41,z],[gx+1.71,10.10,z+lean*.6],.27,.28,0xb9bcac);
  }
  B(blue,gx-.54,11.09,(ga+gb)/2,5.16,.76,gb-ga+1.60,0xbfc6be);
  B(ochre,gx,12.02,(ga+gb)/2,4.74,.47,gb-ga+2.30,0xd5bd99);
  for(let z=ga-.25;z<gb;z+=1.75){
    const wx=gx+2.25;
    L(ochre,[wx,11.43,z],[wx,11.91,z+1.54],.14,.16,0xd4c0a0);
  }
  B(blue,gx-2.20,12.13,16.80,2.69,2.55,3.17,0x9fb9b6);
  B('equipmentGlass',gx-.819,12.57,16.80,.13,1.38,2.75,0xb9cecd);
  B(iron,gx-2.2,13.62,16.80,2.92,.41,3.52,0xc5c5ae);
  B('lamp',gx+1.30,10.62,13.82,1.12,.095,.32,0xdec694);
  B('lamp',gx+1.30,10.62,16.94,1.12,.095,.32,0xdec694);

  // The luffing crane reaches the offset boat across open water. Its
  // counterweight, knee and hanging load read from either quay.
  const heel=[gx-1.40,12.75,13.2],knee=[-156.7,28.50,9.86];
  const tip=vesselPoint(1.75,23.50,7.3);
  function jib(a,b,height,bays){
    for(const side of [-1,1]){
      const corner=(t,top)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+(top?height:0),
        a[2]+(b[2]-a[2])*t+side*.85];
      L(ochre,corner(0,false),corner(1,false),.40,.44,0xe8c49d);
      L(iron,corner(0,true),corner(1,true),.32,.36,0xbcc4bc);
      for(let i=0;i<bays;i++){
        L(ochre,corner(i/bays,i%2===0),corner((i+1)/bays,i%2!==0),.24,.24,0xe7bd91);
        const [x,y,z]=corner(i/bays,true);
        B(ochre,x,y,z,.64,.64,.64,0xe2be92);
        if(side===1&&i%2===0)B('harborBeacon',x,y+.25,z,.48,.23,.48,0xf1c17e);
      }
    }
  }
  jib(heel,knee,2.08,7);jib(knee,tip,1.28,6);
  for(let i=0;i<4;i++)B(blue,gx+.72+i*.48,13.12+i*.50,14,3.84-i*.48,1.12,4.48-i*.64);
  B(iron,...knee,2.56,1.60,3.20);B('harborBeacon',knee[0],knee[1]+1.14,knee[2],.64,.64,.64,0xf79d71);
  L(iron,[gx+1.8,14.60,14],knee,.22,.22);
  B(blue,...tip,1.36,.72,2.72);
  for(const e of [-1,1])L(iron,[tip[0],tip[1],tip[2]+e*.55],[tip[0],6.38,tip[2]+e*.55],.12,.12);
  B(ochre,tip[0],6.24,tip[2],1.12,.41,1.76,0xd4bc9d);
  B('harborRust',tip[0],5.10,tip[2],2.24,1.76,2.56,0xb9b498);

  // North finger has a serrated-roof electrical bay and visible cargo backing.
  const sx=-144.82,sz=-18.75;
  K(blue,sx,2.34,sz,4.68,3.74,10.0,0xb6c3b2);
  B(iron,sx,4.32,sz,5.22,.40,10.3,0xb9c6bc);
  for(let i=0;i<5;i++){
    const dx=i*.73,f=i*.21;
    B(iron,sx-1.60+dx,4.68+f,sz-2.23,1.36,.66+f,4.90,0xc3c8b3);
    B(ochre,sx-1.60+dx,5.06+f*1.5,sz-2.23,1.39,.17,4.96,0xd3c29d);
    B('roomRepair',sx+2.43,2.90,sz-3.8+i*1.75,.10,1.67,1.42,0xacc7c5);
  }
  for(const z of [-23.6,-20.3,-17.0,-13.7]){
    B(ochre,sx+2.44,2.12,z,.24,3.42,.33,0xc5b99d);
    B('lamp',sx+2.57,3.62,z,.32,.09,.55,0xbfb089);
  }
  for(const [cx,z,w,h,d,color] of [[-136.05,11.35,3.6,1.45,2.28,0xb9a084],[-135.51,-11.7,2.28,1.97,2.48,0xbeb69b],[-136.3,8.95,2.02,1.08,2.04,0xbeb796]]){
    // Heavier street-end operating gear flanks the passage across the quay.
    // Its footprint lies clear of the original promenade at z=0 and x=-133.
    B(blue,cx,.55,z,w+.18,.37,d+.16,0xaeb5ac);
    K('harborHullRust',cx,.75+h/2,z,w,h,d,color);
    B(iron,cx,.79+h,z,w+.12,.20,d+.12,0xb0b7a9);
    B(iron,cx+w/2+.024,.97+h*.55,z,.09,.48,d*.55,0x9fafa5);
    for(const e of [-1,1]){
      B(ochre,cx+e*(w/2-.16),.74+h/2,z,.20,h+.075,d+.16,0xd2ba9b);
      B(iron,cx,.77+h/2,z+e*(d/2+.035),w-.48,.14,.098,0xbcbfaa);
    }
    C(cx,.55+h*.50,z,w+.20,h+.48,d+.18);
  }

  // Attach separate bow and stern lines to landing bollards on the fingers.
  for(const [vz,dockZ] of [[-16.8,-17.35],[17.0,18.31]]){
    const [x,,z]=vesselPoint(serviceVessel.beam/2-.65,0,vz);
    const dockX=-141.0;
    B(iron,dockX,.86,dockZ,.37,.75,.42,0xa7b7aa);
    B(ochre,dockX,1.19,dockZ,.58,.22,.55,0xc5b89d);
    const mid=[(x+dockX)/2,1.22,(z+dockZ)/2+.10];
    L('harborTimber',[x,serviceVessel.deck+.57,z],mid,.084);
    L('harborTimber',mid,[dockX,1.20,dockZ],.084);
  }

  // A stowed articulated transfer ramp terminates above the workboat deck.
  L(iron,[-147.92,.65,-19.8],vesselPoint(4.96,2.92,-12.0),1.37,.23,0xb9bba9);
  for(const v of [-.61,.61])L(ochre,[-147.92,1.67,-19.8+v],vesselPoint(4.96,3.85,-12.0+v),.105,.105,0xc5b99d);
  mooredTender(B,L,label);

  // A dredging pontoon occupies the northern fairway. Its low silt bins
  // and high suction ladder give the long river walk a second work site.
  const dx=-160.64,dz=-49.28,heading=-1.04,cc=Math.cos(heading),ss=Math.sin(heading);
  const W=(u,y,v)=>[dx+u*cc+v*ss,y,dz-u*ss+v*cc];
  const H=(m,u,y,v,w,h,d,t)=>B(m,...W(u,y,v),w,h,d,t,heading);
  for(let i=0;i<15;i++){
    const v=(i-7)*1.92,trim=Math.max(0,Math.abs(i-7)-4),w=9.60-trim*.96;
    H(blue,0,.58,v,w,1.92,1.92,0xb2beb5);
    H(iron,0,1.67,v,w+.32,.32,1.92,0xc0c4ae);
    H(ochre,0,1.95,v,w,.24,1.92,0xc6ab81);
    if(i%4!==0){
      H('harborBeacon',w/2+.08,1.38,v,.16,.23,1.82,i<4?0xc4a481:0x8ca99f);
      H(blue,w/2+.10,.91,v,.24,.64,1.28,0xaab7ac);
    }
    if(i>3&&i<10){
      for(const side of [-1,1])H(blue,side*(w/2-.32),2.45,v,.64,.96,1.92);
      H('harborRust',0,2.59,v,w-2.56,1.28,1.84,0xb79880);
      if(i%3===1)H(ochre,0,3.34,v,w-3.20,.32,1.92);
    }
  }
  for(const side of [-1,1]){
    H(blue,side*2.24,3.68,-7.68,1.28,3.20,3.84);
    for(let j=0;j<3;j++)H(iron,side*2.24,5.51+j*.32,-7.68,1.60+j*.32,.32,4.16+j*.32);
  }
  H(blue,0,7.38,-7.68,7.04,2.24,5.44);
  for(const side of [-1,1]){
    for(let i=0;i<4;i++)H('harborBeacon',(i-1.5)*1.6,7.48,-7.68+side*2.73,1.28,1.28,.16,i===1?0xacb8a3:0xf2cc95);
    for(let i=0;i<3;i++)H('harborBeacon',side*3.52,7.48,-7.68+(i-1)*1.60,.16,1.28,1.28,0xe5c794);
  }
  H(iron,0,8.69,-7.68,7.68,.48,6.08);
  for(const side of [-1,1]){
    const u=side*1.28;
    for(let row=0;row<8;row++){
      const v=4.80+row*1.28,yy=3.04+row*.96;
      H(ochre,u,yy,v,.96,1.28,1.92);
      H(iron,u,yy+.67,v,.64,.32,2.24);
      if(row%2===1)H('harborBeacon',u+side*.49,yy,v,.12,.32,.80,0xe4b478);
    }
  }
  H(blue,0,10.25,14.08,3.84,1.28,2.24);
  for(let i=0;i<3;i++)H(iron,0,9.51-i*.64,14.72+i*.64,2.24,.96,1.60);
  H('harborBeacon',0,11.07,14.08,.64,.40,1.28,0xe5b27d);
  label(...W(3.57,6.65,-7.68),4.08,.64,'北汊清淤','航道维护  /  H-16','#e4c194',heading+Math.PI/2);

  // The two offset lock towers flank a low flood-gate, interrupting the
  // oblique distant horizon beyond the dredger at the end of the walk.
  for(const [x,z,high] of [[-201,-80,19.84],[-179,-103,13.44]]){
    B('stone',x,.32,z,7.68,2.24,8.96,0xa1b4ae);
    for(let j=0;j<4;j++)B(j===1?ochre:blue,x,j*1.28+2.34,z,6.40-j*.64,1.28,7.04-j*.64);
    B(blue,x+.64,(high+6.8)/2,z,3.84,high-6.8,4.48);
    for(let row=8.64;row<=high;row+=2.56){
      B(iron,x+.64,row,z,4.48,.64,5.12,0xb7bfaa);
      B('harborBeacon',x+2.59,row+.80,z,.24,.96,2.24,0x8ac6c3);
      B('harborBeacon',x+.64,row+.80,z+2.29,2.24,.96,.24,0xa1bda8);
    }
    B(ochre,x+.64,high+.48,z,6.40,.96,7.68);
    B('harborBeacon',x+.96,high+1.10,z,3.84,.32,4.48,0xb4c2a7);
  }
  L(blue,[-201,4.00,-80],[-179,4.00,-103],2.24,5.12,0xa1b5b0);
  for(let bay=0;bay<10;bay++){
    const xx=-201+(bay+.5)*2.2,zz=-80-(bay+.5)*2.3;
    B(iron,xx,5.84,zz,2.56,.64,3.20,0xb1b8ae);
    if(bay%3!==0)B('harborBeacon',xx+.96,5.49,zz+.96,1.28,.32,1.28,0x8eaba9);
  }

  return [
    [...W(3.98,6.79,-7.68),0xffc48a,95,15],
    [-143.2,10.12,13.74,0xffd4a1,112,21],
    [-146.7,7.89,5.08,0xffd6a3,83,18],
    [-147.2,5.5,-7.35,0xafd3dd,90,19],
    [-143.1,3.23,-15.55,0xf0c88f,38,12],
  ];
}
