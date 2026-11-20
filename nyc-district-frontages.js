// Enclosed staff galleries connect occupied buildings above the public street.
// The glazing is recessed behind ceramic shear frames on both approaches.
export function buildStaffGalleries(kit, sign) {
  // South interchange control room. Its bearing shares the deli's north
  // gable. The inspection windows cantilever above the delivery apron.
  const south=kit.frame(46,-190,Math.PI/2);
  const {B,C}=south;
  B('hull',0x4d6374,5.44,4.20,0,13.44,1.28,6.40);
  C(5.44,4.20,0,13.44,1.28,6.40);
  C(5.44,6.40,1.60,12.80,3.20,2.56);
  for(const u of [.32,10.56]){
    B('hull',0x586c77,u,1.90,-1.92,1.28,3.44,1.28);
    C(u,1.90,-1.92,1.28,3.44,1.28);
    for(let j=0;j<3;j++) B('hull',0x9daeb5,u,2.84+j*.32,-1.76+j*.32,1.60,.32,1.60+j*.64);
  }
  for(let i=0;i<4;i++){
    const u=.64+i*3.20;
    B('hull',0x57727e,u,6.40,1.60,3.20,3.20,2.56);
    B('wash',i===1?0xc1aaca:0x93cedd,u,6.40,3.0,2.88,2.88,.32);
    B('hull',0xc3d6cf,u-1.40,6.40,3.28,.48,3.20,.96);
    B('hull',0x526778,u,5.60,3.32,2.88,.16,.32);
    B('hull',0x94b4bf,u,7.92,3.04,3.20,.48,2.24);
    B('light',0xc9e8ec,u,7.62,3.84,2.56,.12,.48);
  }
  B('hull',0x405160,5.44,4.36,3.40,10.88,1.60,.64);
  const [sx,sz]=south.point(5.44,3.77);
  sign(sx,4.36,sz,10.24,1.28,'南枢 · 通勤调度','下一班接驳   /   南门员工层', '#b6d9eb',Math.PI/2);
  const links = [
    [[28,-194],[68,-189.8],7.68,'南门通勤层'],
    [[-43,-311],[-16,-317],8.32,'轮修交接层'],
    [[64,-292],[108,-297],7.36,'东台通勤层'],
    [[11,-278],[48,-255],10.24,'档案转运层'],
    [[88,-351],[119,-351],10.88,'总部通勤层']
  ];
  for (const [[ax,az],[bx,bz],base,title] of links) {
    const dx=bx-ax, dz=bz-az, length=Math.hypot(dx,dz);
    const yaw=-Math.atan2(dz,dx);
    const {B,C,point}=kit.frame((ax+bx)/2,(az+bz)/2,yaw);
    const graphite=0x394b60, ivory=0xc3d3d3, silver=0x879fae;
    B('hull',graphite,0,base+.32,0,length,.64,4.16);
    B('hull',silver,0,base+3.52,0,length,.64,4.16);
    C(0,base+1.92,0,length,3.84,4.16);
    const count=Math.max(3,Math.round(length/4.16)), pitch=length/count;
    for (let i=0;i<count;i++) {
      const u=(i+.5)*pitch-length/2;
      for (const s of [-1,1]) {
        B('wash',i%4===0?0xa996ba:0x91ccdf,u,base+2,s*1.44,pitch-.12,2.56,.32);
        B('hull',graphite,u,base+1.45,s*1.72,pitch,.16,.24);
        B('hull',silver,u-pitch*.23,base+1.97,s*1.74,.16,2.48,.24);
        B('hull',ivory,u-pitch*.40,base+1.92,s*1.85,.64,2.88,.64);
        B('hull',ivory,u-pitch*.40+.32,base+2.88,s*2,.64,.96,.64);
        B('light',0xc6e4ed,u,base+.65,s*2.1,pitch-.72,.16,.16);
        if(i%3===1) B('hull',graphite,u+.36,base+1.20,s*1.70,.96,.64,.32);
      }
      B('hull',ivory,u,base-.08,0,.80,.48,4.64);
      B('light',0xacccda,u,base-.34,0,.32,.08,2.88);
    }
    for(const s of [-1,1]){
      const u=s*length*.20, [x,z]=point(u,s*2.47);
      B('hull',graphite,u,base+1.75,s*2.18,7.36,1.92,.48);
      sign(x,base+1.78,z,6.88,1.58,title,'环枢联营   /   STAFF TRANSIT','#bfdfef',yaw+(s<0?Math.PI:0));
    }
  }
}

// Tenants have enclosed individual sections of an old facade gallery.
// The recesses between adjoining leases are left open, including doorways.
export function buildMarketFronts(box,solid,sign) {
  function bay(x,z,face,y,width,seed,title) {
    const iron=0x615958, brass=0xb48c68;
    const paint=[0x76978b,0xa76c55,0x637e87][seed%3];
    const B=(kind,u,h,v,w,dY,dZ,color)=>box(kind,x+u,y+h,z+face*v,w,dY,dZ,color);
    B('brickBrown',0,1.52,.08,width,3.04,.96,0xb4917c);
    B('metal',0,.12,.60,width+.32,.32,1.92,iron);
    solid(x,y+1.52,z+face*.22,width,3.04,1.24);
    for(const side of [-1,1]){
      B('midtownSteel',side*(width/2-.20),1.55,.48,.40,2.88,.96,paint);
      B('midtownBronze',side*(width/2-.48),.62,.80,.32,.80,.96,brass);
    }
    const bays=Math.round(width/1.6), pitch=(width-.96)/bays;
    for(let j=0;j<bays;j++){
      const u=(j+.5-bays/2)*pitch;
      B('metal',u,1.58,.62,pitch-.08,1.76,.32,iron);
      B((seed+j)%4===0?'glass':'warmWindow',u,1.68,.83,pitch-.26,1.28,.16,0xe7bc94);
      B('wood',u,1.04,1,pitch-.08,.24,.48,brass);
      const offset=(j===0||j===bays-1)?.16:0;
      for(let k=0;k<3;k++) B('midtownSteel',u,3.12-k*.16,.40+k*.48+offset,pitch,.16,.48,paint);
      B('metal',u,2.63,1.57+offset,pitch,.32,.24,paint);
    }
    B('midtownBronze',0,.37,1.44,width-.32,.16,.16,brass);
    if(title){
      B('metal',0,.40,1.51,width-.80,.80,.32,iron);
      sign(x,y+.40,z+face*1.72,width-1,.66,title,'旧交易所街坊','#f4c78e',face>0?0:Math.PI);
    }
  }
  // Two solid wings of the exchange flank the existing through-passage.
  for(const [x,z,w,k,name] of [[12,-97.20,5.76,2,'线圈绕制'],[18,-97.20,4.80,1,'街坊修衣'],
    [29,-94.32,6.40,0,'天线配钥'],[36,-94.32,6.40,1,'旧机寄卖']]){
    bay(x,z,1,2.72+(k===1?.32:0),w,k,name);
    bay(x+.32,z,1,6.60,w-.64,k+1);
  }
  // The market stair emerges between the tea plant's two counting rooms.
  bay(45.6,-161.52,-1,3.68,5.12,1,'茶脚票房');
  bay(30.3,-161.04,-1,4.00,7.04,0,'夜班食堂');
  bay(-52,-95.50,1,4.16,7.04,2,'五金电料');
  bay(-11,-144.16,1,6.72,5.76,0,'账房宿舍');
}
