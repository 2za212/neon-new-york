import * as T from 'three';

const graphite=0x314956,steel=0x70949b,porcelain=0xafcccb,ochre=0x99836e;
const ice=0xb3e2e8,amber=0xfac18e;

// Two lines carry sealed ledger cases in opposite directions. The motion
// follows the physical guides. At each end a case waits in the transfer
// head before coming back along the parallel line.
function ledgerCases(scene) {
  const parts=[
    [0,.59,0,.96,.35,.80,0x718c8c],
    [0,.29,0,.48,.48,.48,0xa4c6c4],
    [0,-.02,0,2.88,.32,1.76,0x425966],
    [0,-.62,0,2.24,.96,1.44,0xd79755],
    [-1.14,-.56,0,.32,.96,1.76,0xabae99],
    [1.14,-.56,0,.32,.96,1.76,0xabae99],
    [0,-.55,.73,1.12,.32,.16,0xffe0a0],
    [0,-.55,-.73,1.12,.32,.16,0xffe0a0],
    [0,-1.16,0,2.72,.32,1.76,0x566c72],
  ];
  const geo=new T.BoxGeometry(1,1,1),normals=geo.getAttribute('normal'),colour=[];
  for(let i=0;i<normals.count;i++){
    const light=normals.getY(i)>.5?1:normals.getY(i)<-.5?.42:normals.getZ(i)>.5?.91:normals.getX(i)>.5?.80:.63;
    colour.push(light,light,light);
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(colour,3));
  const mat=new T.MeshBasicMaterial({vertexColors:true});
  const count=3,cases=new T.InstancedMesh(geo,mat,count*parts.length),pivot=new T.Object3D(),ink=new T.Color();
  cases.name='旧交易所 / 在轨的清算匣';
  cases.instanceMatrix.setUsage(T.DynamicDrawUsage);
  // Restrict culling to the travel envelope, not the first frame's positions.
  cases.boundingSphere=new T.Sphere(new T.Vector3(-41.44,6.56,-139.20),18.56);
  for(let i=0;i<cases.count;i++)cases.setColorAt(i,ink.set(parts[i%parts.length][6]));
  scene.add(cases);
  let previous=-Infinity;
  function update(time,camera){
    if(camera){const p=camera.position;cases.visible=Math.hypot(p.x+41.44,p.z+139.20)<102;}
    if(!cases.visible||Math.abs(time-previous)<1/24)return;
    previous=time;
    for(let i=0;i<count;i++){
      const phase=(time/40+i/count)%1,west=-56.32,east=-26.24;
      let x,z;
      if(phase<.46){x=T.MathUtils.lerp(west,east,phase/.46);z=-138.56;}
      else if(phase<.50){x=east;z=T.MathUtils.lerp(-138.56,-140.48,(phase-.46)/.04);}
      else if(phase<.96){x=T.MathUtils.lerp(east,west,(phase-.50)/.46);z=-140.48;}
      else{x=west;z=T.MathUtils.lerp(-140.48,-138.56,(phase-.96)/.04);}
      for(let j=0;j<parts.length;j++){
        const [dx,dy,dz,w,h,d]=parts[j];
        pivot.position.set(x+dx,6.56+dy,z+dz);pivot.scale.set(w,h,d);pivot.updateMatrix();
        cases.setMatrixAt(i*parts.length+j,pivot.matrix);
      }
    }
    cases.instanceMatrix.needsUpdate=true;
  }
  update(0,null);
  return {update,draws:1,triangles:cases.count*12};
}

export function buildVaultTransfer({scene,box,solid,sign,lights,materials}){
  // Reflected light from the two inspection chambers is baked into their
  // adjoining porcelain lips. The shell elsewhere uses the city's lighting.
  const enamel=new T.MeshBasicMaterial({vertexColors:true});
  enamel.name='档案转运 / 检修灯旁的反光釉面';
  enamel.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vEnamelFace;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vEnamelFace=normalize(mat3(modelMatrix)*normal);');
    shader.fragmentShader='varying vec3 vEnamelFace;\n'+shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n diffuseColor.rgb *= .14+.29*max(vEnamelFace.z,0.)+.16*max(-vEnamelFace.x,0.)+.38*max(vEnamelFace.y,0.)+.17*max(-vEnamelFace.y,0.);');
  };
  materials.transferPorcelain=enamel;
  const mat={strut:'midtownSteel',frame:'transferPorcelain',dark:'midtownSteel',shell:'midtownLimestone',window:'exchangeGridLens',lens:'exchangeGridLens'};
  function block(type,tint,x,y,z,w,h,d,collision=false){
    box(mat[type],x,y,z,w,h,d,tint);
    if(collision)solid(x,y,z,w,h,d);
  }
  // The lower station is an open receiving fork. It occupies the two edges
  // of the existing landscaped court; both the tree and bench have room
  // under its roof. Alternating keys are full-depth pieces proud of the skin.
  for(const [x,z,flip] of [[-60.16,-137.92,1],[-45.12,-137.92,-1]]){
    block('dark',graphite,x,2.72,z,1.92,4.80,2.24,true);
    for(let i=0;i<5;i++){
      const over=i*.64;
      block('frame',i%2?steel:ochre,x+flip*over*.5,4.64+i*.64,z+.32,2.24+over,.64,3.20+i*.32);
      block('frame',porcelain,x+flip*(1.12+over),4.64+i*.64,z+1.44,1.28,.64,1.60);
      if(i===1||i===3)block('lens',amber,x+flip*(.64+over),4.26+i*.64,z+1.44,.96,.16,1.28);
    }
    for(let j=0;j<4;j++){
      const u=flip*(.16+Math.abs(2-j)*.32),yy=1.44+j*.80;
      block('frame',j%2?steel:ochre,x+u,yy,z+1.26,1.60,.64,.96);
      block('dark',graphite,x+u,yy+.15,z+1.77,1.12,.64,.26);
      block('lens',j===2?ice:amber,x+u,yy+.24,z+1.94,.80,.22,.10);
    }
    // Case routing and manual release on the outside of each pier. The
    // two end windows sit behind the slipped jaws of the tool housing.
    const out=-flip;
    block('strut',graphite,x+out*1.04,2.48,z,.80,3.52,2.24,true);
    for(let j=0;j<4;j++){
      const yy=1.28+j*.80,offset=(j===1||j===2)?.48:0;
      for(const side of [-1,1]){
        block('frame',j%2?steel:ochre,x+out*1.54,yy,z+side*(.48+offset),.80,.64,.64);
        block('lens',j===2?ice:0x75919a,x+out*1.99,yy,z+side*(.48+offset),.16,.32,.32);
      }
      block('window',j===2?0xc69468:0x709096,x+out*1.47,yy,z,.16,.46,.96);
    }
    block('frame',porcelain,x+out*1.60,4.16,z,1.60,.32,2.88);
  }
  for(let i=0;i<7;i++){
    const x=-60.16+i*2.56,raise=i>=4?.64:i===2||i===3?-.64:0;
    const reach=i===2||i===3?1.6:i===1?3.84:2.56;
    block('strut',graphite,x,5.44+raise,-138.24+reach/2,2.56,.64,reach,true);
    block('frame',i%3===0?porcelain:ochre,x,5.74+raise,-138.24+reach-.16,2.56,.57,1.28);
    if(i%2===1)block('lens',amber,x,5.06+raise,-138.24+reach-.64,1.60,.16,1.28);
  }
  // Continuous rails are split by real bolted hangers over the 9.6m
  // carriageway. No vertical support or case enters the traffic envelopes.
  for(const z of [-138.56,-140.48]){
    block('strut',graphite,-41.28,7.68,z,34.56,.64,.96,true);
    block('frame',steel,-41.28,7.44,z,34.56,.32,1.12);
  }
  for(let i=0;i<9;i++){
    const x=-58.24+i*4.16;
    block('frame',i%3===0?porcelain:ochre,x,8.00,-139.52,.64,.64,3.20);
    if(i%3===1)block('lens',ice,x,7.96,-137.86,.64,.32,.16);
  }
  // Upper archive room behind the shuttle. Its six stepped bays grow in
  // different directions in plan and elevation. The near/right bay is
  // left as an actual cutaway to show the machine's cold interior.
  for(let i=0;i<6;i++){
    const x=-56.96+i*2.56,top=[9.92,10.56,11.84,11.84,10.56,9.92][i];
    const faceZ=-144.00+Math.min(i,3)*.48,back=-149.76;
    block('dark',graphite,x,8.48,(back+faceZ)/2,2.56,.96,faceZ-back,true);
    block('shell',steel,x,8.96,faceZ-.16,2.56,.64,1.60);
    block('strut',graphite,x,(top+9.12)/2,back+.96,2.56,top-9.12,1.92);
    block('window',i<2?0xae9173:0x89a8af,x,(top+9.12)/2,faceZ-1.12,2.24,top-9.16,.32);
    block('strut',graphite,x-1.12,(top+9.12)/2,faceZ-.32,.32,top-9.12,1.92);
    block('frame',steel,x,9.44,faceZ-.32,2.24,.32,1.92);
    block('frame',i===3?porcelain:steel,x,top,(back+faceZ)/2+.32,2.56,.64,faceZ-back+1.28);
    block('frame',porcelain,x+.32,top+.38,faceZ-.16,1.92,.24,2.24);
    block('lens',ice,x+.24,top-.42,faceZ-.32,1.60,.16,1.28);
    // A spine on the reverse face makes the installed unit read as an
    // archive from its service street as well as from the front footpath.
    block('frame',i%2?ochre:steel,x,9.28,back-.16,2.56,.48,1.28);
    block('window',i%3?0xa3b1aa:0xd4ac82,x,top-1.00,back-.13,1.92,.80,.32);
  }
  // Twin open ceramic jaws anchor the powered carrier return, suspended
  // above the road. Their staggered square section also reads at 208px.
  for(const x of [-44.16,-41.60]){
    for(let i=0;i<7;i++){
      const y=6.40+i*.64,reach=(3-Math.abs(3-i))*.64;
      for(const side of [-1,1]){
        const z=-139.52+side*(1.12+reach);
        block('frame',i%2?steel:porcelain,x,y,z,1.28,.64,1.28);
        block('lens',ice,x,y,z-side*.59,.96,.40,.24);
      }
      if(i===0||i===6)block('frame',ochre,x,y,-139.52,1.28,.64,2.56);
    }
  }
  // Profile gauge at the public end of the transfer head. One can see
  // the carriers through the opening. Both the cold optical lip and its
  // offset dark housing wrap towards the side, never a disc on a panel.
  for(let row=0;row<7;row++){
    const y=4.16+row*.64,radius=2.24-Math.max(0,Math.abs(row-3)-1)*.64;
    for(const side of [-1,1]){
      const x=-46.4+side*radius;
      block('frame',row===1||row===5?ochre:steel,x+side*.16,y,-136.80,1.28,.64,2.24);
      block('dark',graphite,x,y,-135.60,1.12,.64,.64);
      block('lens',row===3?0x639ca3:0x96d3d5,x-side*.26,y,-135.22,.58,.53,.32);
    }
    if(!row||row===6){
      block('frame',steel,-46.40,y,-136.16,2.56,.64,1.92);
      block('lens',0x96d3d5,-46.40,y+(row?-.18:.18),-135.20,1.92,.32,.32);
    }
  }
  // Join both ends into buildings: a rear return to the settlement annex
  // in the west, and a stepped lift dock on the archive side of the road.
  for(const [x,z,w,d] of [[-55.68,-147.84,2.24,5.44],[-25.60,-142.08,2.56,8.32]]){
    block('strut',graphite,x,7.52,z,w,.96,d,true);
    for(const side of [-1,1])block('frame',steel,x+side*(w*.5),8.16,z,.32,.96,d);
  }
  // Emptied cases return through the existing settlement annex. Its
  // forward posts become the two retrieval stands visible from the rear
  // court, with a clear 4m walking passage between the cabinets.
  for(const [x,flip] of [[-56.32,1],[-49.92,-1]]){
    const z=-147.04;
    block('dark',graphite,x,2.24,z-.47,1.60,3.84,1.44,true);
    for(let j=0;j<4;j++){
      const yy=1.04+j*.80;
      block('frame',j%2?steel:ochre,x+flip*.24,yy,z-.96,1.60,.48,.80);
      block('window',j===2?0xc7ac80:0x83A3AA,x,yy+.30,z-.98,1.12,.27,.32);
      block('frame',steel,x+flip*.80,yy,z-.64,.48,.80,1.28);
      if(j===1||j===3)block('lens',ice,x+flip*1.07,yy,z-.72,.12,.32,.80);
    }
    block('frame',porcelain,x,4.16,z-.80,2.24,.48,1.60);
    block('lens',amber,x,3.89,z-1.12,1.28,.14,.32);
  }
  for(let i=0;i<4;i++){
    const z=-141.12-i*.96;
    block('frame',i%2?steel:porcelain,-25.6,6.88+i*.64,z,4.16-i*.32,.64,1.92);
    block('lens',ice,-25.6,6.51+i*.64,z+.32,2.24,.12,.64);
  }
  sign(-50.56,8.02,-137.77,6.08,.85,'档案转运线','旧交易所  /  夜班清算','#bededa');
  const workLight=new T.PointLight(0xc9e8eb,145,20,2);
  workLight.position.set(-45.44,6.72,-136.32);workLight.userData.nightPower=145;scene.add(workLight);lights.push(workLight);
  const loaderLight=new T.PointLight(0xf1bd83,70,17,2);
  loaderLight.position.set(-55.04,5.28,-134.72);loaderLight.userData.nightPower=70;scene.add(loaderLight);lights.push(loaderLight);
  return ledgerCases(scene);
}
