// The original dock shed occupies an entire lot between the freight street
// and the workers' garden. Keep the roof plant on its old bearings and open
// the ground floor to a dogleg public aisle and a separate east loading mouth.
export function buildProduceHall({B,C,S,label,lights}){
  const ox=-59,oz=10.65,street=.36;
  const iron='harborHullBlue',enamel='harborEnamel',rust='harborRust',tile='stone',lamp='harborBeacon';
  function part(mat,x,y,z,w,h,d,color=0xffffff){
    B(mat,ox+x,y,oz+z,w,h,d,color);
  }
  function solid(mat,x,y,z,w,h,d,color){
    part(mat,x,y,z,w,h,d,color);
    C(ox+x,y,oz+z,w,h,d);
  }
  function step(x1,x2,z1,z2,top){
    const h=top-street+.08;
    part(tile,(x1+x2)/2,top-h/2,(z1+z2)/2,x2-x1,h,z2-z1,0x9a9781);
    S(ox+x1,ox+x2,oz+z1,oz+z2,top);
  }

  // A bidirectional raised auction floor: climb from the street, pass the
  // produce rows and descend into the garden. Pallets stay at cart level.
  const rise=.16,nSteps=8,tread=.48,west=-8.32,east=-4.80;
  for(let i=0;i<nSteps;i++){
    const top=street+rise*(i+1);
    step(west,east,i*tread,(i+1)*tread,top);
    step(west,east,14.40-(i+1)*tread,14.40-i*tread,top);
  }
  step(west,east,3.84,10.56,street+rise*nSteps);
  for(const z of [4.00,6.24,8.48,10.40]){
    solid(iron,west+.10,2.13,z,.20,.96,.20);
    part('harborOchre',west+.10,2.67,z,.32,.16,.32);
  }
  part(iron,west+.10,2.55,7.20,.16,.16,6.56);
  // The public aisle goes around a brick weighing house, then crosses the
  // refrigerated delivery aisle on its way to the rear court.
  for(const [x,z,w,d] of [[-1.28,1.92,4.48,3.84],[5.92,11.68,4.16,4.80]]){
    solid('brickBrown',x,2.40,z,w,4.08,d);
    part('harborPlate',x,4.54,z,w+.64,.32,d+.64);
    part(iron,x,4.80,z,w+.32,.24,d+.32);
    for(const end of [-1,1]){
      part(iron,x,2.26,z+end*(d/2+.12),w-.48,1.68,.24);
      part('warmWindow',x,2.38,z+end*(d/2+.27),w-.80,1.12,.08,0xe7b47a);
      part(iron,x,2.38,z+end*(d/2+.34),.16,1.28,.16);
      part(tile,x,1.42,z+end*(d/2+.24),w,.32,.64);
    }
  }
  function crate(x,bottom,z,index){
    part('harborTimber',x,bottom+.24,z,1.28,.48,.96,0xbb9262);
    for(const side of [-1,1]){
      part('harborTimber',x,bottom+.47,z+side*.48,1.44,.22,.14);
      part('harborTimber',x+side*.64,bottom+.44,z,.16,.28,.96);
    }
    const colors=[0xc66036,0xca9750,0x73945c];
    for(let col=0;col<3;col++)for(let row=0;row<2;row++){
      const xx=x+(col-1)*.33,zz=z+(row-.5)*.33;
      part('trim',xx,bottom+.55,zz,.32,.24,.32,colors[index%3]);
      part('trim',xx,bottom+.71,zz,.20,.09,.22,colors[(index+Math.floor(col/2))%3]);
    }
  }
  // Wholesale counters have their solid feet beside the aisle. The space
  // under the ticket window on the opposite side is the public way through.
  for(const [x,z,n] of [[-4.02,5.4,0],[-4.02,7.6,2],[-4.02,9.8,1],[6.9,2.1,1],[6.9,4.15,0]]){
    solid('harborPaint',x,.97,z,1.36,1.22,1.60,0x81968c);
    part('harborTimber',x,1.62,z,1.60,.16,1.76);
    crate(x,1.70,z,n);
  }
  for(const x of [-8.80,8.48])for(const z of [.64,7.04,14.08]){
    solid(iron,x,3.20,z,.64,5.68,.64);
    for(let k=0;k<3;k++){
      part(enamel,x,5.20+.32*k,z,.96+.32*k,.32,.96+.32*k,0xa8a28c);
    }
    part('harborOchre',x,1.0,z,.72,.96,.72,0xcb9b54);
  }
  // Leave a skylight above the rear elbow; old and new floors reach over
  // one another in plan. The heavy cooling works stand on the upper slab.
  solid(iron,-3.20,6.06,4.80,12.16,.72,10.56);
  solid('brickBrown',4.96,6.06,8.48,4.16,.72,13.44);
  solid(iron,-3.20,6.06,13.60,12.16,.72,2.24);
  for(const [x,z,w,d] of [[-3.20,4.80,12.8,11.2],[4.96,8.48,4.80,14.08],[-3.20,13.60,12.8,2.88]]){
    part('harborPlate',x,6.51,z,w,.24,d,0x899789);
  }
  for(const z of [.64,7.04,14.08]){
    part(iron,-.16,5.80,z,18.24,.80,.80);
    for(const x of [-6.40,-1.28,4.8])part(lamp,x,5.35,z,1.92,.12,.40,0xf6ba75);
  }
  const top=14.60;
  for(const [x,z,w,d] of [[-4.80,8.16,6.4,13.44],[3.84,8.48,5.76,11.52]]){
    solid('brickBrown',x,10.40,z,w,7.84,d,0xaf8674);
    for(const end of [-1,1])for(let floor=0;floor<2;floor++)for(let bay=0;bay<3;bay++){
      const xx=x+(bay-1)*1.60,y=8.4+floor*3.2,zz=z+end*(d/2+.16);
      part(iron,xx,y,zz,1.44,2.08,.32);
      part((bay+floor)%3?'warmWindow':'glass',xx,y,zz+end*.18,1.08,1.57,.12,0xc1b395);
      part('harborPlate',xx,y-.96,zz+end*.24,1.60,.32,.64);
    }
  }
  solid(iron,0,14.32,7.84,17.92,.48,14.72);
  part(tile,0,top-.04,7.84,18.24,.16,15.04);

  // A weighing-scale sign made in the dock's own sheet-metal shop. Its
  // stepped cast rim, faceted dial and hanging pan have real depth.
  const sx=-5.12,sz=-1.18,sy=8.72;
  part(iron,sx,10.96,sz+1.12,.64,.64,3.20);
  part(rust,sx,10.72,sz,.32,.80,.32);
  const diskRows=[3,5,7,9,9,9,7,5,3],cell=.43;
  for(const [row,n] of diskRows.entries()){
    const y=sy+(4-row)*cell;
    part('harborOchre',sx,y,sz,n*cell,cell,.96,0xf0aa54);
    part(iron,sx,y,sz-.53,n*cell-.13,cell,.16);
    if(row>0&&row<8)part(lamp,sx,y,sz-.65,(n-2)*cell,cell,.15,0xe7ca88);
  }
  for(let i=0;i<4;i++)part(rust,sx+i*.25,sy+i*.21,sz-.78,.30,.29,.20,0xff7854);
  for(const side of [-1,1])for(let i=0;i<6;i++)
    part(iron,sx+side*(.56+i*.22),6.63-i*.30,sz,.30,.38,.32);
  for(let r=0;r<3;r++)part(r===2?'harborOchre':iron,sx,4.65+r*.18,sz,2.24+r*.72,.18,1.12+r*.32);
  crate(sx-.38,5.11,sz,0);
  label(ox+3.6,4.66,oz-.16,5.55,1.04,'天亮前菜站','过磅  ·  批发  ·  夜市取货','#ffae5a',Math.PI);
  label(ox-2.64,3.84,oz+14.00,2.88,.68,'街坊取菜','提货巷  /  北门','#a5dcc7',0);
  lights.push([ox+3.36,4.28,oz+.32,0xffb05c,137,14],[ox-.80,4.36,oz+9.60,0xf5bb87,105,11],
    [ox+6.4,4.18,oz+7.36,0x89ccbd,108,10],[ox-6.56,4.7,oz+8.0,0xffa360,78,10]);
}

// The end bay of the workers' garden became the crate co-op. Its two old
// east-west walks remain continuous. The cart lane turns through the lot to
// meet SoHo's western service street; the roof follows the bend of the lane.
export function buildCrateReturnYard({B,C,S,label,lights,west}){
  const east=-46.30,near=31.68,far=52,cx=(west+east)/2;
  B('concrete',cx,.19,(near+far)/2,east-west,.32,far-near,0x989784);
  S(west,east,near,far,.36);
  const laneX=z=>-55.64+Math.min(13.44,Math.max(0,z-35.52))*.48;
  for(let z=near+.32;z<far;z+=.64){
    const x=Math.round(laneX(z)/.32)*.32;
    B('paver',x,.356,z,3.84,.03,.62,0xc8bea0);
    for(const hand of [-1,1]){
      B('harborPaint',x+hand*2.04,.36,z,.20,.035,.62,0x75948d);
      if(Math.round(z/.64)%4===0)B('harborOchre',x+hand*1.66,.375,z,.32,.032,.48,0xc09f6e);
    }
  }
  // The hatch, washer and rack occupy different faces of the return shed.
  function solid(mat,x,y,z,w,h,d,tint){
    B(mat,x,y,z,w,h,d,tint);C(x,y,z,w,h,d);
  }
  solid('brickBrown',-66.84,2.48,40.96,.32,4.24,6.40,0xab7f65);
  solid('brickBrown',-64.76,2.48,44.00,4.48,4.24,.32,0xab7f65);
  for(const x of [-66.20,-63.32])solid('brickBrown',x,2.48,37.92,1.60,4.24,.32,0xab7f65);
  solid('harborPaint',-64.76,3.86,37.92,1.28,1.48,.40,0x708780);
  for(const z of [38.00,43.84])solid('brickBrown',-62.68,2.48,z,.32,4.24,.64,0xab7f65);
  solid('harborHullBlue',-63.32,5.14,40.96,8.00,.64,7.68);
  for(const z of [37.92,44.00]){
    solid('harborPaint',-60.24,2.53,z,.48,4.34,.48);
    for(let i=0;i<4;i++)
      B('harborOchre',-60.24-i*.32,4.0+i*.32,z,.64+i*.32,.32,.80);
  }
  B('metal',-62.48,3.75,40.96,.40,.48,5.76);
  for(const z of [39.04,40.32,41.60,42.88]){
    B('warmWindow',-66.58,2.65,z,.12,.96,1.04,0xddb281);
    B('harborPaint',-66.46,1.99,z,.32,.20,1.22);
  }
  solid('harborTimber',-61.98,1.16,40.96,.96,1.60,4.16);
  B('harborEnamel',-61.94,2.02,40.96,1.28,.16,4.48);
  label(-59.24,4.81,40.96,5.32,.86,'倒筐合作社','收空筐  /  洗筐  /  还押金','#ffc98a',Math.PI/2);
  // Terraced canopy bays along the inside of the turning handcart lane.
  // Its posts sit on the shed side; the lane remains open on the market side.
  for(let bay=0;bay<4;bay++){
    const z=36.80+bay*2.56,x=Math.round((laneX(z)-4.48)/.32)*.32;
    solid('harborHullBlue',x,4.10+bay*.16,z,2.56,.48,2.64,0x87988d);
    B('harborPlate',x,4.42+bay*.16,z,2.88,.16,2.64);
    B('harborOchre',x+1.42,4.13+bay*.16,z,.16,.48,2.64);
    if(bay%2===1){
      solid('harborRust',x-.92,2.26,z,.40,3.80,.40,0xac8966);
      B('harborBeacon',x+.40,3.82+bay*.16,z,.32,.12,1.92,0xe7b97e);
    }
  }
  for(const [i,z] of [38.50,40.30,42.10].entries()){
    const x=-57.78+i*.64,n=i+2;
    for(let row=0;row<n;row++){
      const y=.62+row*.45;
      B('harborPaint',x,y,z,1.28,.38,.96,0x859d73);
      B('harborOchre',x,y+.20,z,1.39,.12,1.06,0x8e9164);
      for(const side of [-1,1])B('harborHullBlue',x+side*.65,y+.02,z,.07,.14,.52);
    }
    C(x,.36+n*.225,z,1.40,n*.45,1.06);
  }
  for(const z of [35.3,46.2]){
    const end=laneX(z)-2.08;
    B('paver',(west+end)/2,.354,z,end-west,.032,2.42,0xb8b5a1);
  }
  lights.push([-63.70,3.96,41.12,0xffbb77,118,11],[-54.56,4.12,44.16,0xcbd7a8,77,10]);
}
