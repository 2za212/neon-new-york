import * as T from 'three';

// Fixed architecture and furniture share box geometry. Instance colors let
// adjacent boards and bricks vary without adding a draw call per piece.
export function furnishApartment(scene, geometry) {
  const parts=[],planks=[];
  const iron='#34434a', ash='#9b7858', teal='#45676a', linen='#b4a68d', brass='#a38658';
  const cube=(c,x,y,z,w,h,d)=>parts.push([c,x,y,z,w,h,d]);
  function install(list,material){
    const mesh=new T.InstancedMesh(geometry,material,list.length);
    const matrix=new T.Matrix4(),color=new T.Color();
    list.forEach(([c,x,y,z,w,h,d],i)=>{
      matrix.makeScale(w,h,d).setPosition(x,y,z);
      mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color.set(c));
    });
    scene.add(mesh);
  }

  // Long oak strips with staggered end joints and grain along the plank.
  const grain=document.createElement('canvas');grain.width=32;grain.height=128;
  const ctx=grain.getContext('2d');ctx.fillStyle='#ede8df';ctx.fillRect(0,0,32,128);
  for(let n=0;n<26;n++){
    ctx.fillStyle=n%3?'#e2daca':'#d5cabd';
    const x=n*19%31,y=n*47%128;
    ctx.fillRect(x,y,1,8+n*11%40);
  }
  const map=new T.CanvasTexture(grain);map.colorSpace=T.SRGBColorSpace;map.magFilter=T.NearestFilter;
  const oak=['#897055','#907559','#80664e','#92785e','#87705a'];
  for(let lane=0;lane<30;lane++){
    for(let j=-1;j<7;j++){
      const start=-3.2+1.6*j+(lane%3)*.48;
      const lo=Math.max(-3.2,start),hi=Math.min(6.4,start+1.6);
      if(hi-lo>.02)planks.push([oak[(lane*3+j+6)%5],-4.64+lane*.32,-.018,(lo+hi)/2,.313,.036,hi-lo-.012]);
    }
  }
  install(planks,new T.MeshStandardMaterial({map,roughness:.9}));

  // Exposed bond on the street wall, leaving the window, calendar and door clear.
  const reds=['#885d51','#81584e','#76514a','#916353'];
  for(let row=0;row<17;row++){
    for(let col=0;col<30;col++){
      const x=-4.62+col*.32+(row%2)*.16;
      if(x<-2.82 || (x>.55 && x<1.13) || (x>2.58 && x<4.65))
        cube(reds[(row+col*3)%4],x,.10+row*.20,-3.09,.304,.184,.044);
    }
  }
  // Tall record shelves on the left, with deep open bays and a listening deck.
  for(const x of [-4.49,-3.83,-3.17])cube(iron,x,1.15,-2.65,.08,2.30,.64);
  for(const y of [.16,.80,1.44,2.24])cube(ash,-3.83,y,-2.65,1.44,.08,.66);
  const sleeves=['#4f6262','#98745b','#687989','#a48968','#534e51'];
  for(const [x,y,count] of [[-4.39,.20,6],[-3.73,.20,5],[-4.40,.84,5],[-3.73,1.48,4]]){
    for(let i=0;i<count;i++)cube(sleeves[i%sleeves.length],x+i*.088,y+.17,-2.57,.069,.34+(i%3)*.04,.32);
  }
  cube(iron,-3.51,.92,-2.53,.44,.16,.34);cube(linen,-3.51,1.02,-2.53,.28,.04,.24);
  // Window jamb and stacked blind, radiator fins and return pipe.
  for(const x of [-2.78,-1.16])cube('#536069',x,1.88,-3.00,.12,2.08,.20);
  for(let i=0;i<3;i++)cube('#738586',-1.97,2.80-i*.068,-2.90-i*.02,1.70,.04,.12);
  cube(iron,-2.06,.39,-2.89,1.28,.52,.24);
  for(let i=0;i<9;i++)cube('#718080',-2.62+i*.14,.40,-2.76,.08,.60,.16);
  cube(brass,-2.78,.26,-2.80,.16,.10,.16);
  // Stepped entry casing, transom, meter and service locker.
  for(const x of [1.24,2.46])cube('#4a4f4b',x,1.16,-2.94,.12,2.32,.18);
  cube(iron,1.85,2.36,-2.95,1.40,.12,.20);
  cube('#54676a',1.85,2.62,-3.03,1.30,.40,.12);
  for(const x of [1.44,1.84,2.24])cube('#7e9394',x,2.62,-2.95,.32,.24,.04);
  cube(iron,2.70,1.36,-2.93,.22,.36,.10);cube('#79a6a7',2.70,1.42,-2.87,.12,.08,.04);
  cube('#405554',3.56,.96,-2.71,1.04,1.92,.72);
  for(const x of [3.32,3.80]){
    cube('#68726a',x,1.00,-2.32,.44,1.72,.08);
    for(let j=0;j<3;j++)cube(iron,x,1.64-j*.08,-2.26,.28,.04,.04);
    cube(brass,x+.12,.92,-2.24,.06,.20,.06);
  }
  cube(ash,3.56,1.98,-2.70,1.12,.12,.80);
  // A clipped ivy slips down the locker; the leaves follow stepped stems.
  cube('#a06c51',3.82,2.12,-2.64,.28,.20,.28);
  cube('#b47e62',3.82,2.24,-2.64,.36,.08,.36);
  for(const [x,y,z,w] of [[3.82,2.36,-2.62,.24],[3.64,2.40,-2.62,.20],
    [3.98,2.46,-2.62,.20],[3.90,2.36,-2.44,.16],[3.94,2.28,-2.35,.16],[4.02,2.16,-2.32,.12]]){
    cube(y>2.38?'#7e8a62':'#506958',x,y,z,w,.12,.16);
  }
  // The galley has overhead storage and a tiled backsplash.
  for(let i=0;i<3;i++){
    const z=-1.06+i*1.2;
    cube(teal,4.46,2.16,z,.56,.72,1.12);
    cube('#687c78',4.15,2.16,z,.08,.64,1.04);
    cube(iron,4.09,1.94,z,.04,.04,.36);
    for(let j=0;j<4;j++)cube(j%2?'#87918a':'#7f8b86',4.66,1.39,z-.42+j*.28,.08,.56,.26);
  }
  cube(iron,4.12,1.12,.96,.56,.08,.48);
  cube('#989781',4.12,1.28,.96,.36,.24,.32);
  cube(iron,4.12,1.42,.96,.40,.04,.36);
  cube(iron,3.88,1.29,.96,.16,.08,.08);
  // Sofa arms, removable cushions and a low table with a sleeved record.
  for(const x of [1.74,4.34])cube(teal,x,.58,5.54,.20,.60,1.16);
  for(const x of [2.28,3.04,3.80]){
    cube('#596e71',x,.65,5.46,.72,.14,.78);
    cube('#65797a',x,.90,5.83,.72,.44,.16);
  }
  cube(teal,2.44,.49,3.94,.42,.04,.38);cube(linen,2.40,.518,3.92,.22,.02,.20);
  // Bedside runner. The stepped border and weave also give the feet a scale reference.
  cube('#846650',-.99,.009,3.55,1.72,.018,2.40);
  for(const z of [2.43,4.67])cube('#c1a17a',-.99,.021,z,1.72,.008,.08);
  for(const x of [-1.75,-.23])cube('#aa8f6c',x,.021,3.55,.08,.008,2.16);
  for(let j=0;j<7;j++){
    const z=2.76+j*.24;
    for(const side of [-1,1]){
      cube('#ac8866',-.99+side*.54,.021,z,.16,.008,.08);
      cube('#a07e63',-.99+side*.46,.021,z+.08,.16,.008,.08);
    }
  }
  // A workbench opposite the bed anchors the view when the player turns to sit.
  cube(ash,-4.27,.83,.12,.84,.12,1.92);
  for(const z of [-.64,.88])cube(iron,-4.27,.40,z,.68,.80,.12);
  cube(iron,-4.62,1.55,.12,.10,1.00,1.84);
  for(let j=0;j<4;j++)cube(j%2?brass:teal,-4.52,1.52,-.55+j*.32,.12,.32,.12);
  cube(teal,-4.25,.99,.62,.40,.20,.44);cube(linen,-4.26,.91,-.30,.50,.04,.64);
  for(const z of [-.36,-.04,.28]){
    cube(brass,-4.52,1.78,z,.12,.08,.08);
    cube('#899493',-4.48,1.64,z,.08,.24,.06);
  }
  // Two hanging quilts and folded storage at the bed's head leave the centre open.
  cube(ash,-3.12,2.12,6.20,2.12,.12,.32);
  for(const [x,c] of [[-3.80,teal],[-3.04,'#9b775f']]){
    cube(iron,x,1.94,6.17,.12,.28,.12);
    cube(c,x,1.63,6.12,.44,.48,.16);cube(c,x,1.23,6.10,.32,.36,.20);
  }
  cube(ash,-3.14,.26,5.95,1.60,.48,.64);
  cube('#677976',-3.48,.56,5.94,.72,.12,.52);cube(linen,-3.42,.66,5.96,.60,.08,.48);

  // The old factory track cuts across the loft. A single parked leaf gives
  // the bed an alcove while framing the original street window from the pillow.
  cube(iron,-2.76,2.82,1.62,4.00,.12,.16);
  cube(ash,-3.94,1.01,1.62,1.60,2.02,.16);
  for(const x of [-4.64,-3.94,-3.24])cube('#3d5355',x,1.36,1.62,.12,2.72,.22);
  for(const y of [.16,.88,1.98,2.68])cube('#405357',-3.94,y,1.62,1.62,.10,.24);
  for(const x of [-4.30,-3.58]){
    cube('#726b59',x,1.41,1.74,.54,.88,.06);
    for(let j=0;j<3;j++)cube('#647779',x,2.13+j*.16,1.62,.56,.06,.12);
  }
  cube(brass,-3.27,1.12,1.76,.08,.24,.06);
  // A peninsula turns the wall kitchen into an L facing the living room.
  // Stools tuck under its overhang; a player can walk around its free end.
  cube(teal,2.54,.49,.44,2.08,.90,.56);
  cube('#9a8b78',2.34,1.00,.48,2.56,.12,.80);
  for(let i=0;i<11;i++)cube('#6a6856',1.60+i*.18,.52,.745,.085,.72,.05);
  for(const x of [1.50,2.62]){
    cube(ash,x,.64,1.24,.46,.10,.44);
    for(const dx of [-.15,.15])for(const dz of [-.14,.14])cube(iron,x+dx,.30,1.24+dz,.06,.60,.06);
    cube(brass,x,.23,1.38,.36,.04,.04);
  }
  cube(linen,1.75,1.08,.48,.48,.04,.30);
  cube(teal,1.84,1.17,.48,.14,.16,.14);
  for(const x of [1.64,2.68]){
    cube(iron,x,2.93,.52,.04,.90,.04);
    cube(iron,x,2.46,.52,.28,.12,.28);cube('#90795e',x,2.37,.52,.44,.08,.44);
    cube('#f4d2a0',x,2.32,.52,.36,.04,.36);
  }
  // Slats screen the galley from the entrance without sealing the sightline.
  cube(teal,2.75,.47,-1.93,.26,.94,1.76);
  for(let j=0;j<7;j++)cube(ash,2.75,1.78,-2.68+j*.24,.12,1.76,.08);
  cube(iron,2.75,2.70,-1.93,.22,.12,1.76);
  // Rear living-room window. The fire escape, viaduct and lit windows are
  // spaced in depth and are also visible through gaps between the cushions.
  for(const x of [.14,1.14,2.14,3.14,4.16])cube(iron,x,2.06,6.34,.10,1.90,.18);
  for(const y of [1.18,2.20,2.94])cube(iron,2.15,y,6.34,4.14,.10,.18);
  cube(ash,2.15,1.13,6.26,4.28,.12,.36);
  cube(iron,2.34,.96,7.14,3.84,.12,1.28);cube('#576679',2.34,1.88,7.72,3.84,.08,.08);
  for(let i=0;i<11;i++)cube(iron,.54+i*.36,1.44,7.72,.06,.88,.06);
  for(const y of [1.62,2.06])cube('#4d5963',1.70,y,11,14,.16,.32);
  for(let i=0;i<12;i++)cube(iron,-4+i,1.84,11,.14,.32,.30);
  for(let j=0;j<8;j++){
    const x=-4.4+j*1.44,h=3.28+j*7%4*.64;
    cube('#4e626f',x,h/2-1,14,1.36,h,1.28);
    for(let k=0;k<5;k++)if(k*.56<h-.50)
      cube((j+k)%3?'#899ba2':'#b4a180',x,k*.56-.48,13.33,.62,.24,.08);
  }
  install(parts,new T.MeshStandardMaterial({roughness:.86}));
}
