// Warehouse apron at street level. Local length runs along the loading kerb.
export function freightApron(B,L,C,sign,panel){
  const x=-111.8,z=-5.32;
  const part=(m,u,y,v,w,h,d,col)=>B(m,x+u,y,z+v,w,h,d,col);
  const rod=(m,a,b,w)=>L(m,[x+a[0],a[1],z+a[2]],[x+b[0],b[1],z+b[2]],w,w);
  function contact(u,v,w,d){
    const corners=[[-w,d],[w,d],[w,-d],[-w,-d]];
    panel('trafficContact',corners.map(([dx,dz])=>[x+u+dx*.5,.198,z+v+dz*.5]));
  }
  contact(0,0,2.85,1.80);
  // Compact electric forklift, with daylight under the mast and overhead cage.
  for(const u of [-.77,.77])for(const v of [-.54,.54]){
    const side=Math.sign(v),cy=.50,r=.32;
    for(let j=-3;j<=3;j++){
      const dy=j*.086;
      part('rubber',u,cy+dy,v,2*Math.sqrt(r*r-dy*dy),.087,.205);
    }
    const outer=v+side*.106;
    for(let j=-2;j<=2;j++){
      const dy=j*.055;
      part('metal',u,cy+dy,outer,2*Math.sqrt(.165**2-dy*dy),.056,.028,0xb7b6ac);
    }
    part('yellow',u,cy,outer+side*.018,.116,.116,.023);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      part('trim',u+.105*Math.cos(a),cy+.105*Math.sin(a),outer+side*.022,.032,.032,.016);
    }
    contact(u,v,.62,.37);
  }
  part('yellow',0,.83,0,1.95,.47,1.06);
  for(const side of [-1,1]){
    part('metal',-.64,.86,side*.537,.48,.17,.022);
    for(let j=0;j<6;j++)part('rubber',-.83+j*.072,.86,side*.554,.026,.13,.016);
    for(const u of [-.79,.76]){
      part('yellow',u,.897,side*.54,.54,.09,.20);
      part('metal',u,.946,side*.58,.47,.018,.10,0xa59e91);
    }
    part('lamp',.76,1.09,side*.41,.17,.10,.14);
  }
  part('harborPaint',-.72,1.21,0,.58,.43,1.02);
  part('rubber',-.18,1.16,0,.55,.13,.57);
  part('rubber',-.41,1.41,0,.12,.53,.55);
  rod('metal',[.40,1.02,0],[.29,1.46,0],.07);
  part('rubber',.28,1.46,0,.13,.08,.37);
  for(const u of [-.69,.52])for(const v of [-.46,.46])
    rod('yellow',[u,1.09,v],[u+.08,2.34,v],.065);
  for(const v of [-.46,.46])part('yellow',-.02,2.36,v,1.46,.085,.09);
  for(let j=0;j<5;j++)part('metal',-.61+j*.30,2.37,0,.092,.072,.94);
  part('lamp',-.60,2.48,.35,.13,.14,.13);
  for(const v of [-.37,.37]){
    part('metal',1.02,1.54,v,.15,2.59,.10);
    part('harborPaint',1.13,1.25,v,.09,1.70,.10);
    part('metal',1.69,.36,v,1.19,.09,.10);
  }
  for(const y of [.55,1.45,2.76])part('yellow',1.06,y,0,.15,.10,.84);
  C(x,.98,z,2.06,1.57,1.24);C(x+1.06,1.55,z,.22,2.59,.85);
  C(x+1.69,.36,z,1.19,.09,.84);
  for(const offset of [3.25,4.82]){
    contact(offset,0,1.72,1.53);
    for(const v of [-.47,0,.47])part('freightTimber',offset,.264,v,1.26,.167,.12,0xc3ad94);
    for(let j=0;j<6;j++)part('freightTimber',offset-.55+j*.22,.39,0,.19,.085,1.08);
    for(let j=0;j<(offset<4?2:1);j++){
      const h=.52,cy=.69+j*.54;
      // Closed crate core shows through the narrow gaps between fitted boards.
      part('metal',offset,cy,0,1.065,h-.025,.812,0x6d5e51);
      for(const v of [-.43,.43])for(let row=0;row<4;row++){
        part('freightTimber',offset,cy-.192+row*.128,v,1.10,.122,.026,row%2?0xe0c4a4:0xd4b893);
      }
      for(const u of [-.54,.54])for(let row=0;row<4;row++)
        part('freightTimber',offset+u,cy-.192+row*.128,0,.028,.122,.83,0xc7b09b);
      for(let k=0;k<5;k++)part('freightTimber',offset,cy+h/2,-.35+k*.175,1.10,.022,.168,0xdfc5aa);
      for(const u of [-.36,.36])part('harborPaint',offset+u,cy,0,.041,h+.019,.9);
      for(const v of [-.454,.454]){
        rod('freightTimber',[offset-.51,cy-.20,v],[offset+.51,cy+.20,v],.062);
        for(const u of [-.51,.51])part('freightTimber',offset+u,cy,v,.07,.51,.053);
      }
      part('trim',offset+.12,cy,.505,.28,.17,.014);
      for(let k=0;k<5;k++)part('metal',offset+.033+k*.031,cy,.516,.014,.10,.009);
    }
    C(x+offset,offset<4?.81:.56,z,1.26,offset<4?1.25:.74,1.08);
  }
  sign(x+5.0,2.60,-10.03,2.35,.53,'BAY 04','HUDSON / RECEIVING','#e8b875',0);
}
