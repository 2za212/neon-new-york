import * as T from 'three';

// Two shop-houses give up their ground-floor centre bay to public use. The
// upper masonry remains load-bearing on continuous party walls either side.
export function repairPortalWidth(x,z){
  if(x===-17&&z===-10.65)return 4.8;
  if(x===26&&z===10.65)return 4.48;
  return 0;
}

export function buildRepairQuarter(scene,{box,beam,materials,surface,collider,sign,localLights}){
  const iron=0x647a7d,cream=0xcbc1a4,red=0xb36646,brass=0xe0a755,blue=0x729597;
  const porcelain=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.51,
    metalness:.25,emissive:0x844019,emissiveIntensity:.52});
  porcelain.name='夜修里 / 包铜灯壳';porcelain.userData.keepDistant=true;
  materials.repairBrass=porcelain;
  function shell(mat,x,y,z,w,h,d,tint=0xffffff){
    box(mat,x,y,z,w,h,d,tint,0,null,true);
    collider(x,y,z,w,h,d);
  }
  function block(mat,x,y,z,w,h,d,tint=0xffffff){
    box(mat,x,y,z,w,h,d,tint,0,null,true);
  }
  function floor(x1,x2,z1,z2,y,mat='paver',color=cream){
    if(x2<=x1||z2<=z1)return;
    box(mat,(x1+x2)/2,y-.08,(z1+z2)/2,x2-x1,.16,z2-z1,color);
    surface(x1,x2,z1,z2,y);
  }
  function lamp(x,y,z,hue,power,range){
    const l=new T.PointLight(hue,power,range,2);l.name='夜修里 / 营业灯';
    l.position.set(x,y,z);l.userData.nightPower=power;scene.add(l);localLights.push(l);
  }

  // The railway viaduct's original stone piers stand down the centre of
  // this market. Service carts use the north strip; customers turn through
  // the old key shop toward the cross street. No new roadway crosses either.
  floor(-41.6,-10.66,-32.96,-24.65,.36,'concrete',0x95aaa1);
  floor(-19.40,-14.60,-24.65,-10.65,.36,'paver',0xb0ad95);
  floor(-21.27,-19.40,-15.13,-10.65,.36,'paver',0xb0ad95);
  floor(-10.66,-7.4,-30.9,-25.90,.36,'concrete',0xa7aa98);
  for(const x of [-35.68,-29.92,-24.16,-12.96]){
    // Industrial repair cubbies back against the shop houses. A chest,
    // bench and overhead hood share a frame, leaving room to serve in front.
    shell('metal',x,.93,-25.45,3.20,1.14,.96,iron);
    block('wood',x,1.58,-25.63,3.52,.16,1.28,cream);
    for(const side of [-1,1])shell('metal',x+side*1.56,2.11,-25.04,.24,3.5,.32,iron);
    for(let row=0;row<3;row++){
      block(row===2?'repairBrass':'metal',x,3.96-row*.16,-25.16-row*.47,3.84,.24,.64,row===2?brass:iron);
      for(const side of [-1,1])block('trim',x+side*1.06,.68+row*.22,-25.98,1.44,.12,.24,side<0?blue:cream);
    }
    block('lamp',x,3.47,-26.04,2.88,.16,.32,0xffbc83);
    block('metal',x-.72,1.82,-25.62,.80,.32,.64,0x5b7279);
    block('trim',x-.72,2.06,-25.52,.48,.16,.48,0xb7ccc3);
    block('rubber',x+.8,1.78,-25.58,.96,.24,.64,0xaaa78a);
  }
  // Each trade occupies a different depth of the pier bay. A motor rewinder
  // uses copper drums, while the umbrella repairer tests the frame at full
  // span above the counter. Hoods end before the clear aisle.
  function spool(x,y,z,r,depth,tint){
    for(let i=-2;i<=2;i++){
      const width=r*[.96,1.60,2,1.60,.96][i+2];
      block('wood',x,y+i*r*.34,z,width,r*.36,depth,cream);
      block('repairBrass',x,y+i*r*.34,z,width*.81,r*.36,depth+.12,tint);
    }
    block('metal',x,y,z,.32,.32,depth+.42,iron);
  }
  spool(-36.22,2.34,-25.63,.83,.72,0xcf7649);
  spool(-34.84,2.10,-25.56,.59,.64,0xd7a067);
  sign(-35.68,3.26,-26.25,3.12,.54,'电机重绕','收转子 · 缠铜线','#db9a6d',Math.PI);
  for(let row=0;row<4;row++){
    const w=1.28+row*.90,d=1.12+row*.65,y=4.52-row*.24;
    block('trim',-29.92,y,-26.03,w,.24,d,row%2?red:0xbf8b65);
    block('metal',-29.92,y+.13,-26.03,.15,.10,d+.12,iron);
  }
  shell('metal',-30.92,2.64,-25.55,.16,2.08,.16,iron);
  for(const x of [-30.79,-30.31,-29.83,-29.35])
    block('trim',x,2.25,-25.45,.26,1.08,.28,x<-30.4?blue:red);
  sign(-29.92,3.26,-26.28,2.08,.40,'晴雨修伞','换骨 · 补布','#eab98c',Math.PI);
  spool(-24.64,2.06,-25.66,.56,.32,0x949b91);
  for(let tool=0;tool<4;tool++){
    const x=-24.12+tool*.30;
    block('wood',x,2.78,-25.09,.10,.35,.15,brass);
    block('trim',x+.04,2.38,-25.09,.19,.48,.14,cream);
  }
  sign(-24.16,3.28,-26.25,2.40,.44,'刀剪开刃','夜班修磨','#b8d0ca',Math.PI);
  for(const [j,x] of [-14.00,-13.12,-12.24].entries()){
    const y=2.36+j*.32;
    block('metal',x,y,-25.41,.72,1.18,.32,iron);
    block(j%2?'cyan':'lamp',x,y+.13,-25.68,.48,.64,.24,cream);
  }
  sign(-12.97,3.28,-26.25,2.72,.44,'灯牌急修','以旧换件','#ebac85',Math.PI);
  // The north side handles bulky parts. Work bays alternate with deep
  // unloading openings. The housing above projects over the storage rooms.
  // The west bay narrows against the east High Line stair. Keep the whole
  // stair clear up through the projecting canopy, including its handrails.
  shell('brickBrown',-30.20,3.17,-39.68,17.68,5.62,.64,0xaf9c8a);
  for(const x of [-38.72,-35.12,-28.72,-22.32]){
    shell('brick',x,2.72,-35.86,.64,4.72,6.72,0xbd9c85);
    for(let step=0;step<3;step++)
      block('trim',x,4.24+step*.32,-32.59,.96+step*.32,.32,1.12+step*.48,cream);
  }
  for(const [x,width] of [[-36.92,3.60],[-31.92,6.40],[-25.52,6.40]]){
    shell('metal',x,5.38,-35.97,width,.64,8.12,iron);
    block('lamp',x,4.91,-33.36,width*.50,.16,.48,0xffc18b);
    const slots = width < 4 ? 2 : 4;
    shell('metal',x,1.44,-38.76,slots*1.20,2.16,1.12,iron);
    for(let j=0;j<slots;j++)block(j%3?'wood':'trim',x+(j-(slots-1)/2)*1.1,1.54,-38.07,1.02,1.64,.25,j%2?red:blue);
  }
  for(let storey=0;storey<3;storey++){
    const y=5.78+storey*2.88,center=-31.76-storey*.48,w=14.72-storey*1.28;
    shell(storey===1?'ceramicShell':'titaniumSkin',center,y+1.28,-36.8-storey*.32,w,2.56,6.08,0xced0c1);
    block('ceramicShell',center,y+.04,-33.52-storey*.32,w+.64,.48,1.6,cream);
    for(let n=0;n<Math.floor(w/2.24);n++){
      const x=center-w/2+1.04+n*2.24,z=-33.65-storey*.32;
      block((n+storey*2)%4===0?'routeHome':'glass',x,y+1.28,z,1.44,1.44,.24);
      block('metal',x,y+.57,z+.15,1.76,.16,.64,iron);
      if(n%3!==1)block('metal',x+.64,y+1.34,z+.22,.16,1.44,.32,iron);
    }
  }
  lamp(-33.6,3.04,-28.32,0xffaa73,63,12);
  lamp(-17.28,3.20,-24.03,0xffb075,44,9);

  // The key blank IS the key-cutter's canopy. Cast the ring in horizontal
  // courses, leaving a genuine through-hole. A coarse stepped collar on
  // both faces and a polished cutting edge expose the manufacturing grid.
  const cell=.48,ringX=-19.20,ringY=7.55,ringZ=-7.42;
  const rows=[2,3,4,4,4,4,4,3,2];
  for(let row=0;row<rows.length;row++){
    const outer=rows[row],dy=Math.abs(row-4),hole=dy<2?1:dy===2?0:-1;
    const spans=hole>=0?[[-outer,-hole-1],[hole+1,outer]]:[[-outer,outer]];
    for(const [left,right] of spans){
      const x=ringX+(left+right)*cell/2,y=ringY+(row-4)*cell,w=(right-left+1)*cell;
      shell('repairBrass',x,y,ringZ,w,cell,1.28,dy>2?brass:0xd69a4d);
      for(const side of [-1,1]){
        block('repairBrass',ringX+left*cell,y,ringZ+side*.69,cell,.45,.23,cream);
        if(right!==left)block('metal',ringX+right*cell,y,ringZ+side*.68,.16,.48,.22,0xb69264);
      }
    }
  }
  const neck=ringX+4.5*cell,blade=6.72;
  shell('repairBrass',neck+blade/2,ringY,ringZ,blade,.96,.96,brass);
  block('lamp',neck+3.12,ringY+.24,ringZ+.52,6.14,.16,.16,0xffc27f);
  for(const [i,n] of [2,3,1,2].entries()){
    const x=neck+2.88+i*.96;
    for(let k=0;k<n;k++)shell('repairBrass',x+k*.08,ringY-.72-k*cell,ringZ,.64,cell,1.04, k===n-1?cream:brass);
  }
  for(const x of [-19.2,-13.28]){
    shell('metal',x,10.17,-8.93,.48,.64,3.84,iron);
    block('trim',x,9.77,ringZ,.64,.32,.64,cream);
    shell('metal',x,9.26,ringZ,.24,1.20,.32,iron);
    beam('metal',[x,10.28,-7.42],[x,11.72,-10.54],.24,.24,iron);
  }
  sign(-16.96,4.71,-9.52,6.88,.92,'通宵配钥匙','机械锁 · 芯片钥匙  |  桥下夜修里','#ffbe77');
  sign(-17,3.48,-24.98,3.66,.52,'钥匙胚 · 取件口','夜修里　往霓虹横街','#e5b486',Math.PI);
  // The recessed front wing houses the cutter that the big blank advertises.
  // Its counter faces both the street and the occupied passage on its side.
  shell('wood',-20.43,1.04,-12.14,1.36,1.36,1.92,0xc79c71);
  block('metal',-20.44,1.81,-12.25,1.52,.18,2.08,iron);
  for(const z of [-11.82,-12.57]){
    block('metal',-20.45,2.04,z,.80,.32,.56,blue);
    block('trim',-20.24,2.25,z,.24,.28,.48,cream);
    block('repairBrass',-20.02,2.16,z,.55,.14,.15,brass);
  }
  block('metal',-20.26,2.22,-15.05,1.92,1.60,.24,iron);
  for(let row=0;row<3;row++)for(let col=0;col<5;col++){
    const x=-20.98+col*.34,y=1.76+row*.46;
    block('repairBrass',x,y,-14.87,.18,.18,.16,brass);
    block('trim',x+.04,y-.16,-14.86,.10,.24,.16,cream);
  }
  block('lamp',-20.28,3.58,-12.40,1.52,.16,2.24,0xffb679);
  lamp(-20.19,2.94,-11.70,0xffa85e,46,7.6);
  // Through-house galleries keep sufficient headroom for hauliers; the band
  // of rear lighting delineates the actual exit in the depth of the room.
  for(const [x,near,far,w] of [[-17,-24.65,-10.65,4.80],[26,10.65,22.65,4.48]]){
    for(const side of [-1,1]){
      const wall=x+side*(w/2-.08);
      block('stone',wall,.81,(near+far)/2,.16,.90,far-near,0xb1a293);
      for(let z=near+1;z<far;z+=3.2){
        shell('metal',wall,2.16,z,.20,3.60,.32,iron);
        block('metal',x,3.84,z,w,.32,.48,iron);
      }
    }
    for(const z of [near+1.5,(near+far)/2,far-1.5])block('lamp',x,3.61,z,w*.52,.12,.32,0xffbc86);
    lamp(x,3.04,(near+far)/2,x<0?0xffad75:0xffcf92,38,8);
  }
  // The old laundry gate opens to a shared yard and out through the original
  // south tenement. A third branch serves handcarts from the park-side road.
  floor(19.78,32.08,22.65,26.10,.39,'paver',0xc2b39a);
  floor(23.05,32.08,26.10,35.24,.39,'concrete',0xa3ac9d);
  floor(23.76,28.24,10.65,22.65,.38,'paver',0xb8ab93);
  floor(28.24,30.20,10.65,15.13,.38,'paver',0xaeaa98);
  floor(32.08,34.92,24.50,27.06,.38,'paver',0xb6ab94);
  // Repaired channels feed the laundry floor drain in sections, following the
  // cart lane around the yard. The centre stays smooth for trolley wheels.
  for(const z of [13.1,16.3,19.5,22.7])block('metal',24.26,.39,z,.24,.026,2.89,iron);
  for(const x of [22.8,25.68,28.56,31.44])block('metal',x,.40,23.56,2.56,.018,.16,0x6e7c74);
  sign(26,4.45,10.12,6.18,.77,'洗晒里','街坊洗衣　住户取件　直走穿院','#9ad9cb',Math.PI);
  shell('metal',29.23,.95,12.34,1.68,1.14,2.24,0x799791);
  block('wood',29.23,1.58,12.34,1.76,.16,2.32,cream);
  for(let bundle=0;bundle<4;bundle++){
    const z=11.94+Math.floor(bundle/2)*.84,x=28.79+(bundle%2)*.78;
    for(let fold=0;fold<3;fold++)
      block('trim',x+fold*.03,1.75+fold*.12,z,.64,.12,.58,fold%2?blue:cream);
  }
  block('metal',29.28,2.24,14.98,1.65,2.56,.16,iron);
  for(let col=0;col<2;col++)for(let row=0;row<3;row++)
    block('trim',28.89+col*.80,1.48+row*.76,14.82,.70,.64,.24,col===row?red:blue);
  block('lamp',29.20,3.58,12.4,1.60,.16,2.24,0xf8c691);
  lamp(29.04,2.82,11.28,0xffc48a,36,7);
  // Yard users can reach the communal drying balcony by the side stairs.
  const base=.39,step=.16,tread=.40,count=16,stairZ=27.52,deck=base+count*step;
  for(let i=0;i<count;i++){
    const top=base+(i+1)*step,z=stairZ+(i+.5)*tread;
    shell('stone',24.52,(top+base)/2,z,2.08,top-base,tread,0xa9aca0);
    surface(23.48,25.56,z-tread/2,z+tread/2,top);
    block('metal',24.52,top-.035,z-tread/2+.065,2.08,.07,.12,iron);
    if(i%3===1)block('metal',23.55,top+.42,z,.12,.88,.12,iron);
  }
  beam('metal',[23.55,base+.90,stairZ],[23.55,deck+.91,stairZ+count*tread],.12,.12,iron);
  const landing=stairZ+count*tread;
  shell('stone',27.44,deck-.20,(landing+36.96)/2,8.00,.40,36.96-landing,0xbab4a5);
  surface(23.44,31.44,landing,36.96,deck);
  shell('basaltShell',27.44,6.50,38.98,8.32,12.28,2.76,0xb7c5c6);
  for(const x of [24.08,30.64]){
    for(let floor=0;floor<4;floor++){
      const dx=(floor%2?.16:-.16);
      shell('ceramicShell',x+dx,1.84+floor*3.04,38.24,.96,3.04,2.56,0xcbbfa9);
      block('titaniumSkin',x+dx,3.20+floor*3.04,37.16,1.28,.32,.96,0xc8d1c9);
    }
  }
  for(const x of [23.72,31.15])shell('metal',x,1.56,35.98,.48,2.4,.64,iron);
  for(const [x1,x2,z] of [[25.88,31.44,landing+.14],[23.44,31.44,36.67]]){
    shell('metal',(x1+x2)/2,deck+.52,z,x2-x1,1.04,.12,iron);
    for(let x=x1+.26;x<x2;x+=.64)block('trim',x,deck+.50,z-.12,.32,.48,.16,0xa5afa1);
  }
  shell('metal',31.38,deck+.48,35.38,.12,.96,2.82,iron);
  for(let row=0;row<3;row++){
    const y=4.32+row*2.88;
    for(const [n,x] of [24.64,26.88,29.12,30.36].entries()){
      block((row+n)%3?'routeHome':'glass',x,y,36.89,n===3?.96:1.60,1.44,.16);
      block('stone',x,y-.79,36.68,n===3?1.12:1.76,.16,.48,cream);
    }
    shell('titaniumSkin',27.36,y+1.28,36.67,8.64,.32,.96,0xbcb69d);
  }
  // Retrofitted drying racks share an overhead conveyor between households.
  const laundry=[0xa6c6b4,0xa47870,0xc4aa84,0x738d9c,0xd3bdaa];
  block('metal',27.52,5.45,35.60,8.32,.16,.24,iron);
  for(let i=0;i<6;i++){
    const x=24.02+i*1.28,y=5.15-(i%2)*.16,z=35.60;
    block('wood',x,5.31,z,.88,.16,.16,cream);
    block('trim',x,y-.32,z,.80,.64,.16,laundry[i%5]);
    block('trim',x+(i%2?.16:-.16),y-.80,z+.04,.48,.32,.24,laundry[i%5]);
  }
  // Fold-out household rails project into the court at two different
  // heights. Garments keep a clear gap to the public stair and landing.
  for(const [x,y,reach] of [[26.60,6.28,5.12],[30.38,8.96,4.32]]){
    block('metal',x,y,36.96-reach/2,.16,.16,reach,iron);
    beam('metal',[x,y+1.14,36.89],[x,y,36.96-reach+.24],.10,.10,iron);
    for(let i=0;i<4;i++){
      const z=36.48-i*.92;
      block('wood',x,y-.13,z,.16,.16,.80,cream);
      block('trim',x,y-.64,z,.18,.90,.80,laundry[(i+(x>29?1:3))%5]);
      if(i%2===0)block('trim',x+.04,y-1.27,z+.08,.24,.38,.64,laundry[(i+(x>29?1:3))%5]);
    }
  }
  // Three industrial washer drums live under the balcony, clear of both
  // the through route and the stair. The stepped port holes have deep rims.
  for(const x of [26.16,28.08,30.00]){
    shell('metal',x,1.30,35.82,1.76,1.82,1.60,0x778b86);
    block('trim',x,2.03,34.92,1.60,.24,.32,cream);
    for(let r=0;r<5;r++){
      const w=[.48,.96,1.12,.96,.48][r],y=.90+r*.16;
      block('metal',x,y,34.91,w,.16,.32,iron);
      if(r>0&&r<4)block('glass',x,y,34.72,w-.32,.16,.16);
    }
  }
  sign(29.12,2.50,33.86,3.78,.44,'洗衣房','夜间洗晒　｜　送洗取件','#91cac7',Math.PI);
  lamp(28,2.22,33.51,0xeeb179,54,8.8);
  lamp(27.20,5.72,35.04,0xbacee1,32,8);
  // A gate between the yard and the planting strip admits a small cart.
  for(const z of [23.18,28.44]){
    shell('brickBrown',31.93,1.32,z,.64,1.86,1.28,0xb7a08f);
    for(let i=0;i<3;i++)block('stone',31.93,2.31+i*.16,z,.96-i*.16,.16,1.44-i*.16,cream);
  }
  return {crowdPaths:[
    {id:'repair_key_runner',a:[-17.16,-20.92],b:[-17.16,-12.0],level:.36,look:1,speed:.65},
    {id:'repair_parts_buyer',a:[-32.60,-27.12],b:[-25.36,-27.12],level:.36,look:2,speed:.62},
    {id:'repair_housing_pickup',a:[26.32,12.16],b:[26.32,21.32],level:.38,look:0,speed:.62},
    {id:'repair_laundry_customer',a:[28.22,30.24],b:[28.22,33.10],level:.39,look:3,speed:.48},
    {id:'repair_drying_resident',a:[29.28,35.82],level:deck,look:2,heading:Math.PI,phone:true}
  ]};
}

