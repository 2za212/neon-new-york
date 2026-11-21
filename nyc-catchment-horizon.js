import {waterworksEntranceLights} from './nyc-east-waterworks-housing.js';
import {buildParkFrontages} from './nyc-working-frontages.js';

// Cisterns outside the eastern loop are connected to the park's irrigation
// system. Their galleries are visible through the canopy all along the walks.
export function buildCatchmentHorizon({B,L,C,light,label},trees){
  buildParkFrontages({B,C});
  const iron='eastParkIron',bronze='eastParkCopper',shell='eastParkStone',lamp='eastParkPressureGlass';
  const cool=0x93c9bf,warm=0xd9b98c;
  function cistern(x,z,top,depth,offset){
    // Split ceramic load shoes carry the pressure head above the maintenance
    // yard. The upper reservoir narrows into its central isolator ring.
    for(const side of [-1,1]){
      const foot=z+side*(depth/2-1.92);
      for(const end of [-1,1]){
        B('basaltShell',x+end*1.92,3.52,foot,2.24,7.04,3.20,0x8da0a9);
        B('ceramicShell',x+end*2.08,1.12,foot,2.56,2.24,3.84,0xb8cfc4);
        B('titaniumSkin',x+end*2.16,5.28,foot,2.56,1.60,3.84,0x82acb1);
        B(lamp,x+end*3.48,5.20,foot,.16,.64,2.24,warm);
      }
      B('titaniumSkin',x,7.68,foot,6.40,1.28,3.84,0x89aca8);
      for(let row=0;row<4;row++){
        B(shell,x-.48+row*.16,8.8+row*.96,foot,6.4+row*.64,.96,3.84+row*.64,0x9cae9f);
        B(iron,x-3.36-row*.16,7.6+row*.96,foot,.64,.96,2.56);
      }
      B(iron,x,12+(top-12)/2,foot,5.76,top-12,5.12);
      for(let i=0;i<3;i++)B(bronze,x-3.04,top*.51,foot+(i-1)*.96,.32,top*.65,.32,0x8a9f8d);
      B(lamp,x-3.25,top*.53,foot-1.0,.16,top*.35,.24,cool);
    }
    for(let i=0;i<5;i++){
      const xx=x+offset*Math.floor(i/2)*.64;
      B(i===1||i===4?iron:shell,xx,top+i*.64,z,7.68+i*.64,.64,depth+i*.64,0xacb7a6);
    }
    const xx=x+offset*1.28;
    // An exterior gauge ties the road-level pump gallery to the head tank.
    for(let i=0;i<6;i++){
      const yy=3.84+i*(top-3.84)/6;
      B(iron,x-3.84,yy,z,1.28,.48,3.20);
      B(lamp,x-4.52,yy+.32,z,.16,.48,i%2?1.28:2.56,cool);
    }
    B(bronze,x-3.84,top*.52,z+.96,.64,top*.88,.64,warm);
    B('basaltShell',xx,top+4.8,z,6.72,4.48,depth-1.28,0x93a7b1);
    for(const e of [-1,1]){
      const end=z+e*(depth/2-.48);
      B('titaniumSkin',xx,top+4.48,end,8.96,3.84,3.20,0x80aeb2);
      B('ceramicShell',xx,top+5.60,end,9.60,.96,3.84,0xc0cec2);
    }
    for(let i=0;i<Math.floor(depth/1.92);i++){
      const zz=z-depth/2+1.0+i*1.92;
      B(bronze,xx-4.80,top+4.96,zz,.96,3.84,.64,0xa5a48d);
      B(lamp,xx-4.88,top+4.96,zz+.88,.32,2.24,1.12,i%4===1?0xb2a583:cool);
      B(iron,xx-5.14,top+4.83,zz+.88,.32,.32,1.28);
    }
    B('ceramicShell',xx,top+7.14,z,10.24,.64,depth+2.56,0xb6d0cb);
    for(const side of [-1,1]){
      const deck=z+side*depth*.25,levels=side===offset?6:3;
      for(let i=0;i<levels;i++)
        B(i%3===1?'titaniumSkin':'ceramicShell',xx+side*(.32+i*.32),top+7.78+i*.64,deck,
          7.04-i*.64,.64,6.72-i*.64,side<0?0xa9bac0:0xc4d0c1);
    }
    label?.(xx-5.5,top+1.54,z,Math.min(depth*.56,6.72),1.15,'东园水务','夜间回灌  /  调压站','#a6cfc2',-Math.PI/2);
  }
  cistern(150.4,-8,14.08,16.64,1);
  cistern(154.88,52.48,8.96+3.84,12.80,-1);
  // Roots and water are sampled in the broad, luminous laboratory windows
  // along the north verge. A west-facing cutaway gives the avenue an entrance.
  const nx=84.1,nz=-12.32;
  B(iron,nx,1.0,nz,6.40,1.28,3.84);
  B(bronze,nx,1.76,nz,7.04,.32,4.48);
  B(lamp,nx,3.23,nz,6.40,2.60,3.84,0x789f95);
  for(let i=0;i<5;i++){
    const x=nx+(i-2)*1.28;
    B('roomLab',x,3.04,nz+1.98,1.20,2.24,.16,i%2?0xaac7aa:0x96bcad);
    B(iron,x-.54,3.14,nz+2.14,.24,2.56,.32);
    const leaves=1+(3*i)%4;
    for(let j=0;j<leaves;j++)
      B(j%2?'eastParkCanopyLight':'eastParkCanopyShade',x+j*.17,2.14+j*.32,nz+2.08,.48,.32,.32,0xc3cd94);
  }
  for(const side of [-1,1])for(let k=0;k<3;k++){
    const z=nz+(k-1)*1.28;
    B('roomLab',nx+side*3.27,3.15,z,.16,2.30,1.24,k===2?0xc5b08f:0xa3c5af);
    B(iron,nx+side*3.43,3.10,z+.49,.32,2.56,.24);
    B(bronze,nx+side*3.52,2.48,z,.32,.24,1.28);
  }
  for(let j=0;j<3;j++)B(j===1?bronze:iron,nx,4.62+j*.32,nz,7.68-j*.64,.32,5.12-j*.64);
  for(let i=0;i<3;i++){
    const x=nx-1.60+i*1.28;
    B(iron,x,5.59+i*.48,nz,1.28,.96+i*.96,2.56);
    B(bronze,x,6.17+i*.96,nz,1.60,.32,2.88);
    B(lamp,x,5.78+i*.96,nz+1.32,.80,.32,.16,0xc9b398);
  }
  C(nx,2.70,nz,7.04,4.68,4.48,'root-lab');
  light(nx-3.64,3.20,nz+1.82,0xa7d3b4,86,13);
  label?.(nx-.2,4.49,nz+2.27,5.44,.68,'雾培苗库','东园水务  /  夜间育苗','#d0cfad',0);
  // The outer ring used to face the sealed piers of the reservoirs. An
  // occupied pump floor brings the big tanks down to the opposite pavement.
  for(const [x,z,num,face] of [[151.04,-8,7,1],[150.40,54.4,10,-1]]){
    const len=num*1.92,fx=x-2.56;
    B(iron,x,2.90,z,5.12,5.12,len);
    for(let bay=0;bay<num;bay++){
      const zz=z+(bay-(num-1)/2)*1.92;
      B(shell,fx-.16,1.48,zz,.64,2.24,1.84,0x9caa9f);
      B(lamp,fx-.13,3.73,zz,.32,2.24,1.78,bay%4===1?0xd3aa78:0xa7cec4);
      B(bronze,fx-.48,3.76,zz-.80,.64,2.56,.32);
      B(iron,fx-.48,3.11,zz,.48,.24,1.92);
      if(bay%2===0)B(iron,fx-.50,3.60,zz+.25,.64,.64,.64);
      if(bay%3===0)for(let j=0;j<3;j++)B(bronze,fx-.64-j*.32,5.11+j*.32,zz,1.28+j*.64,.32,.64);
    }
    B(shell,fx-.8,5.99,z,2.88,.64,len+.96,0xb8bda6);
    B(iron,fx-.60,6.49,z,3.20,.32,len+1.60);
    const zz=z+face*len*.22;
    // The flowmeter is a stepped circular valve body, installed proud of
    // the glazing. Its outer teeth shade a saturated inner ceramic shell.
    for(let row=-3;row<=3;row++){
      const breadth=[5,7,7,7,7,7,5][row+3]-(Math.abs(row)===3?2:0);
      const yy=3.54+row*.64;
      B(iron,fx-1.26,yy,zz,1.92,.64,breadth*.64);
      B(bronze,fx-2.27,yy,zz,.24,.64,breadth*.64);
      if(Math.abs(row)<3)B(lamp,fx-2.43,yy,zz,.16,.64,(breadth-(Math.abs(row)===2?4:2))*.64,row===1?0x93bbb2:0x79aaa6);
    }
    B(iron,fx-2.65,3.54,zz,.48,1.28,1.28);
    for(const dir of [-1,1])B(shell,fx-2.57,3.54+dir*.96,zz+dir*.64,.32,.64,.64);
    C(x,3.20,z,5.76,6.40,len+.64,'street-pump-floor');
    light(fx-2.7,4.72,zz,0xb1d4bd,126,17);
    label?.(fx-.74,5.14,z-face*3.84,4.80,.70,'回灌泵房','东园夜班 / 供水中','#c4c7ac',-Math.PI/2);
  }
  // The propagation beds have a real valve manifold where the north hedge
  // meets the street. Its broad end and side can be read from the old town.
  const gx=81.80,gz=20.70;
  for(const dir of [-1,1]){
    const xx=gx+dir*4.16;
    for(let row=0;row<6;row++){
      B(row%3===0?shell:iron,xx,1.39+row*.80,gz,.80+(row>3?.32:0),.80,.96);
      B(bronze,xx+dir*.40,1.39+row*.80,gz,.32,.80,.48);
    }
    B(lamp,xx,3.19,gz-.55,.32,2.24,.16,cool);
  }
  B(iron,gx,5.95,gz,10.24,1.92,2.24);
  for(let i=0;i<7;i++){
    const xx=gx+(i-3)*1.28;
    for(const dir of [-1,1]){
      B(bronze,xx,5.98,gz+dir*1.12,.32,2.08,.48);
      B(lamp,xx+.57,5.91,gz+dir*1.19,.72,1.32,.24,i%3===1?0xb4bc9b:0x93cdbb);
      B(iron,xx+.57,5.76,gz+dir*1.37,.88,.16,.24);
    }
  }
  for(const dir of [-1,1]){
    B(lamp,gx+dir*5.17,5.92,gz,.24,1.28,1.60,0xb4ceb7);
    B(bronze,gx+dir*5.25,6.05,gz,.24,.20,1.92);
  }
  B(shell,gx,7.08,gz,10.88,.64,2.88);
  for(let i=0;i<5;i++){
    const xx=gx-3.84+i*.80;
    B(iron,xx,7.75+i*.64,gz,.80,1.28+i*1.28,2.24);
    B(bronze,xx,8.48+i*1.28,gz,1.12,.32,2.56);
    B(lamp,xx,8.12+i*1.28,gz-1.21,.47,.40,.16,cool);
  }
  light(gx-4.0,5.28,gz-.91,0xa1cfba,86,15);
  // The median tram shelter becomes a rainwater metering point. Both street
  // faces share the pipes and one prismatic pressure column over the platform.
  const px=122.55,pz=6.8;
  for(const u of [-4.48,4.48]){
    B(iron,px+u,3.58,pz,.96,.48,2.24);
    for(let j=0;j<4;j++)B(j%2?shell:bronze,px+u-Math.sign(u)*j*.32,4.07+j*.48,pz,
      .96+j*.48,.48,1.92+j*.32);
    B(iron,px+u,2.86,pz+.48,.32,1.28,.48);
  }
  B(iron,px,6.16,pz,10.88,1.92,3.20);
  for(const side of [-1,1])for(let i=0;i<7;i++){
    const x=px+(i-3)*1.42,zz=pz+side*1.67;
    B(bronze,x,6.12,zz,.32,2.08,.64,0xb4ad91);
    B(lamp,x+.67,6.14,zz,.88,1.16,.20,i===3?0xa59b7f:0x9ec6b4);
    B(iron,x+.66,5.91,zz+side*.14,1.04,.16,.22);
  }
  B(iron,px,7.26,pz,11.52,.48,3.84);
  for(let j=0;j<6;j++){
    const z=pz+.32*(j%2),yy=7.82+j*.96;
    B(iron,px-3.52,yy,z,2.56,.96,1.92);
    B(lamp,px-3.52,yy,z+.99,1.76,.53,.16,j<4?cool:0x667f7a);
    B(lamp,px-2.20,yy,z,.16,.53,1.23,j<4?cool:0x667f7a);
    B(bronze,px-3.52,yy+.40,z,3.20,.32,2.56);
  }
  for(const u of [-3.20,3.20]){
    B(lamp,px+u,5.12,pz,2.56,.16,1.92,0xc9cfae);
    light(px+u,4.76,pz,0xadcfb8,85,15);
  }
  // Warm timber eaves on the public pavilion reflect its work lamps. The
  // nursery now carries its own two offset pressure heads and lamp housings.
  for(const side of [-1,1]){
    const zz=36+side*3.36;
    for(let bay=0;bay<5;bay++){
      const xx=98+(bay-2)*2.048;
      B('eastParkTimber',xx,5.29,zz,2.368,.64,1.28);
      B('eastParkTimber',xx,5.77,zz-side*.32,2.288,.32,1.92);
      B(lamp,xx,5.13,zz+side*.66,1.728,.32,.16,bay===2?0xc78852:0xc5ae84);
    }
    B(iron,98+side*5.12,5.01,36,.64,.64,7.36);
    B(lamp,98+side*5.44,5.07,36,.16,.24,6.40,warm);
  }
  light(98,4.65,39.84,0xe4bc86,65,11);
  light(94.50,4.48,-24.00,0xd5a4b6,65,11);
  // A gravity main and maintenance catwalk between the two reservoir heads.
  L(iron,[150.72,14.32,-1.65],[154.0,13.04,47.40],2.56,2.08,0xb0b9ad);
  L(bronze,[149.26,13.20,-1.65],[152.52,11.93,47.40],.48,1.28,0xac9a79);
  for(let i=0;i<10;i++){
    const k=i/9,xx=150.72+k*3.28,zz=-1.65+k*49.05,yy=14.32-k*1.28;
    B(bronze,xx,yy,zz,2.88,2.88,.64);
    if(i===3||i===7){
      for(const side of [-1,1]){
        B('basaltShell',xx,yy*.49,zz+side*.66,1.28,yy*.98,1.28,0xb5c2c7);
        B('titaniumSkin',xx,1.60,zz+side*.85,1.92,3.20,1.60,0x92abb2);
        B('ceramicShell',xx,2.72,zz+side*1.02,2.24,.96,1.60,0xbacdc4);
        B(lamp,xx-1.16,2.63,zz+side*1.02,.14,.36,1.24,0x90c9b6);
      }
      light(xx-1.40,2.60,zz,0x8bcdbf,95,13);
    }
  }
  for(const [x,y,z] of waterworksEntranceLights)light(x,y,z,0xeecc9e,190,21);
  // Real low-intensity fixtures, high enough to rake the tank cheeks without
  // turning the foreground pond into a lit floor.
  for(const [x,z,y] of [[146,-13.6,13.76],[150.3,56.0,12.48]]){
    B(iron,x,y,z,.64,.96,1.28);B(lamp,x-.38,y-.19,z,.16,.32,.96,warm);
    light(x-.48,y-.2,z,0xadcfbe,85,19);
  }
  // Graft mature boughs onto trunks already rooted in the landscape. There
  // are no additional stems occupying the paths or blocking wetland access.
  for(const [i,[x,z]] of trees.entries()){
    const facing=x>104?1:-1;
    const y=4.64+(i%4)*.64,tipX=x+facing*(i%3===0?3.2:2.24),tipZ=z+(i%2===0?1.60:-1.28);
    for(let j=0;j<5;j++){
      const t=(j+.5)/5;
      B('bark',x+(tipX-x)*t,2.91+(y-2.91)*t,z+(tipZ-z)*t,1.0,.96,.96,0x9a9e88);
    }
    for(let band=-2;band<=2;band++){
      const spread=(2-Math.abs(band)),cz=tipZ+band*.96;
      for(let cx=-1;cx<2;cx++){
        const cy=y+((cx+band+i)%3===0?.32:0);
        const dx=tipX+cx*(1.08+spread*.30)+(band%2)*.32;
        B('eastParkCanopyShade',dx,cy,cz,1.28+spread*.32,.96,1.28,0xb0c1aa);
        B('eastParkCanopyLight',dx+.32*facing,cy+.72,cz+.16,1.28,.48,1.28,0xaac4ac);
        if(cx===facing&&Math.abs(band)<2)B('eastParkCanopyShade',dx+facing*.84,cy-.48,cz,.64,.64,.64);
      }
    }
    if(i%5===0){
      // Horticulture inspection heads on the trunk; the leaves catch the bounce.
      B(iron,x+.22,2.80,z,.38,.64,.38);
      B(lamp,x+.24,3.04,z+.10,.32,.08,.32,0xbac6a4);
      light(x+.43,3.42,z+.23,0xb3c7a4,18,7);
    }
  }
}
