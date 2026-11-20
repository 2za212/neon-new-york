import {keyedCasting} from './nyc-field-voxels.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Night transit uses a closed overhead guideway. The park keeps its open middle:
// the west boundary is occupied by rail, the north by municipal plant, and the
// south by staffed public rooms fronting both the footpath and the night street.
const railX=66.56,railY=14.40,iron='eastParkTransitMetal',cast='eastParkTransitMetal';
const stone='eastParkStone',opal='eastParkPressureGlass';
const jade=0x51ddce,ice=0xb9f4e6,coal=0x535e71,teal=0x86aaa6;
const amber=0xffad60,coral=0xee775a,aluminum=0xd3d6be;

// A single merged draw per vehicle. Face tints separate the panes, steel
// cheeks and underslung seawater battery even beyond the street-light budget.
function shuttleCar(scene){
  const pieces=[],color=new T.Color();
  function box(tint,x,y,z,w,h,d){
    const g=new T.BoxGeometry(w,h,d),n=g.attributes.normal,v=[];
    color.setHex(tint);
    for(let i=0;i<n.count;i++){
      const shade=n.getY(i)>.5?1:n.getY(i)<-.5?.48:n.getX(i)<-.5?.79:n.getZ(i)<-.5?.70:.90;
      v.push(color.r*shade,color.g*shade,color.b*shade);
    }
    g.setAttribute('color',new T.Float32BufferAttribute(v,3));
    g.translate(x,y,z);pieces.push(g);
  }
  // The cabin tapers in discrete manufacturing courses at both cab ends.
  for(const dir of [-1,1])for(let row=0;row<3;row++){
    const width=[2.56,3.20,3.52][row],y=.32+row*.48;
    box(row===1?0xd06c50:0x657780,0,y,dir*(4.40+row*.08),width,.48,1.12+.32*row);
  }
  box(0x344c55,0,.48,0,3.20,.96,8.00);
  box(0xb56a4a,0,1.03,0,3.52,.22,8.80);
  box(0x45636b,0,1.76,0,3.52,1.28,9.60);
  for(const dir of [-1,1]){
    for(let pane=0;pane<7;pane++){
      const z=(pane-3)*1.28,opening=pane!==0&&pane!==6;
      box(opening?0xffc892:0xb1f7ef,dir*1.80,1.95,z,.16,1.08,1.05);
      if(pane===2||pane===4){
        box(0x665551,dir*1.89,1.49,z+.11,.06,.29,.62);
        box(0x867467,dir*1.89,1.72,z+.06,.06,.19,.23);
      }
      if(pane===1||pane===5)box(0xb3bbab,dir*1.80,.69,z,.14,.48,.90);
    }
    box(0x53828a,0,1.92,dir*5.04,2.96,1.08,.32);
    box(0x89d6cf,0,2.02,dir*5.22,2.40,.48,.12);
    for(const x of [-1.12,1.12])box(0xfbd39c,x,1.16,dir*5.08,.48,.19,.35);
  }
  box(0x9eaaa5,0,2.65,0,3.36,.34,10.24);
  for(const z of [-2.88,2.88]){
    box(0x455d67,0,2.96,z,1.28,.35,1.60);
    box(0x8a9d9b,0,3.55,z,.72,1.14,.80);
    box(0x526b75,0,4.15,z,1.60,.38,1.60);
  }
  const geometry=mergeGeometries(pieces);
  for(const g of pieces)g.dispose();
  geometry.computeBoundingSphere();
  const mat=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  const mesh=new T.Mesh(geometry,mat);
  mesh.name='东园悬轨 / 夜班双向车';scene.add(mesh);
  return mesh;
}

export function buildParkNightline(scene,{B,C,panel,label,light,materials}){
  // Light from the opal core returns onto its own steel cheeks, including
  // the undersides beyond the mobile point-light radius. Keep the side,
  // upper and lower faces distinct on the densely stacked castings.
  const receiver=new T.MeshStandardMaterial({color:0xb6c1c1,roughness:.74,metalness:.28,vertexColors:true});
  receiver.name='东园悬轨 / 受光铸钢壳';receiver.userData.keepDistant=true;
  receiver.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec3 castingN=transformNormalByInverseViewMatrix(normal,viewMatrix);
      float facing=.036+.089*max(dot(castingN,vec3(-.60,-.48,.64)),0.)
        +.051*max(dot(castingN,vec3(.49,.77,-.40)),0.);
      outgoingLight+=sqrt(max(diffuseColor.rgb,vec3(0.)))*vec3(.73,.92,.98)*facing;
      #include <opaque_fragment>`);
  };
  receiver.customProgramCacheKey=()=>'east-park-nightline-receiver';
  materials[iron]=receiver;
  // Every casting and lamp goes through the normal district batch. The ribs
  // are integral to the silhouette and continue across the dark side faces.
  const box=(m,x,y,z,w,h,d,t=0xffffff)=>B(m,x,y,z,w,h,d,t,0,null,true);
  function solid(m,x,y,z,w,h,d,t,id){
    const keyed=['nightline-pier-base','nightline-pier','nightline-lift','growers-exchange-pier',
      'growers-night-counter','sun-collector-pier','east-supply-abutment','nutrient-retort-foot','park-shophouse'];
    if(keyed.includes(id))keyedCasting({box,panel},m,x,y,z,w,h,d,t,Math.abs(Math.round(x+z))%4);
    else box(m,x,y,z,w,h,d,t);
    C(x,y,z,w,h,d,id);
  }
  function terraceLight(x,z,front){
    // A staffed vending hatch below the lift. The field light has a deep
    // return, so people approaching along the station see the warm side.
    box(iron,x,1.64,z,2.88,2.56,1.60,coal);
    for(let cell=0;cell<3;cell++){
      const xx=x+(cell-1)*.80;
      box(opal,xx,2.06,z+front*.84,.72,.96,.20,cell===1?amber:0xd9875e);
      box(cast,xx,1.57,z+front*1.02,.80,.16,.48,aluminum);
      box(cast,xx,2.57,z+front*.9,.80,.16,.64,coal);
    }
    box(iron,x,3.00,z,3.52,.32,2.56,coal);
    box(opal,x,2.83,z+front*1.10,2.24,.13,.24,amber);
    C(x,1.68,z,2.88,2.64,1.60,'nightline-vending-hatch');
  }

  const start=-49.92,end=92.16,segments=24,span=(end-start)/segments;
  for(let bay=0;bay<segments;bay++){
    const z=start+(bay+.5)*span;
    box(iron,railX,railY+.32,z,2.88,1.28,span,coal);
    box(cast,railX,railY+1.17,z,3.84,.42,span,aluminum);
    box(iron,railX,railY-.39,z,1.60,.23,span,coal);
    // Deep cellular sockets alternate with stretches of inactive trunk.
    for(const side of [-1,1]){
      box(cast,railX+side*1.52,railY+.14,z,.64,.48,span-.16,teal);
      box(opal,railX+side*1.87,railY+.13,z,.12,.27,span-.68,bay%4===0?ice:0x40a89e);
      box(iron,railX+side*1.48,railY+.56,z-span*.38,.96,1.28,1.12,coal);
    }
  }
  C(railX,railY+.32,(start+end)/2,3.3,1.76,end-start,'nightline-overhead-guideway');
  // Piers stop outside both carriageways and all three public park entrances.
  for(const z of [-44.16,-25.60,-8.00,19.20,38.40,59.52,75.52,90.24]){
    const x=railX+2.72;
    solid(stone,x,1.17,z,1.92,2.08,2.56,teal,'nightline-pier-base');
    solid(iron,x,6.67,z,1.28,9.12,1.92,coal,'nightline-pier');
    for(let i=0;i<4;i++){
      const xx=x-i*.38,yy=11.47+i*.64;
      solid(i%2===0?cast:iron,xx,yy,z,1.60+i*.64,.64,2.24+i*.32,
        i%2===0?aluminum:teal,'nightline-pier-head');
    }
    box(cast,x+.72,6.64,z,.30,7.68,.96,teal);
    for(let k=0;k<5;k++){
      box(iron,x-.67,3.30+k*1.60,z,.32,.48,2.24,coal);
      box(opal,x-.86,3.30+k*1.60,z,.16,.29,.96,k===4?amber:0x7dd3bc);
    }
    if(z===19.20||z===59.52||z===-25.60)light(x-1.0,3.30,z,0x84d9ca,65,11);
  }
  function station(z,front,title){
    const x=railX+(front<0?3.84:6.72),deck=10.16;
    // The stair cores are closed lift rooms. No invisible wall is placed
    // below the platform; the sidewalk and all through-roads remain open.
    solid(stone,x,5.12,z,2.56,9.92,3.52,teal,'nightline-lift');
    for(let tier=0;tier<8;tier++){
      const yy=1.28+tier*1.12;
      box(iron,x,yy,z,3.20,.32,4.16,coal);
      for(const side of [-1,1])box(opal,x+.48,yy+.43,z+side*1.80,
        .96,.58,.14,tier%3===0?ice:0x57a6a6);
    }
    const px=railX+4.32;
    solid(iron,px,deck-.32,z,4.48,.64,17.28,coal,'nightline-platform');
    for(const side of [-1,1]){
      const endZ=z+side*7.68;
      for(let tier=0;tier<3;tier++){
        box(tier===1?cast:iron,px+tier*.32,deck+.16+tier*.32,endZ+side*tier*.32,
          4.80-tier*.32,.32,1.28,tier===1?aluminum:coal);
      }
      box(opal,px,deck+.54,endZ+side*.69,3.84,.32,.16,ice);
    }
    for(let i=-3;i<=3;i++){
      const zz=z+i*2.24;
      box(iron,px+1.90,deck+1.76,zz,.80,3.52,.48,coal);
      box(cast,px+2.04,deck+1.13,zz+.72,.48,1.76,1.16,teal);
      box(opal,px+2.30,deck+1.32,zz+.72,.16,1.28,1.03,i%3===0?amber:0xa2e3da);
      box(opal,px-2.23,deck-.23,zz,.16,.24,1.60,i%3===0?ice:0x5bbba9);
      box(cast,px+.32,deck+3.65,zz,5.12,.48,2.24,aluminum);
    }
    box(iron,px+.64,deck+4.03,z,4.48,.32,16.64,coal);
    const hatchZ=z+front*4.48;
    terraceLight(x-1.28,hatchZ,front);
    label(x-1.28,3.22,hatchZ+front*1.06,2.40,.44,'夜班热食','热粥 / 汤面',front<0?Math.PI:0,'#f4b57f');
    label(x,4.60,z+front*2.14,3.20,1.05,title,'环线  07  /  升降厅',front<0?Math.PI:0,'#a9ebe0');
    light(x-1.1,2.62,hatchZ+front*1.66,0xffb06f,108,12);
    light(px-1.3,deck+2.28,z,0x98ebd8,125,17);
  }
  station(-36.80,1,'育苗圃');station(69.76,-1,'东园南');
  // Produce crosses from the growing works into the south neighbourhood
  // through a split market. Its lit trays sit above the open delivery gate.
  function foodExchange(x,z,bays,levels){
    const spacing=2.88,width=spacing*bays;
    for(const side of [-1,1]){
      solid(stone,x+side*(width/2-.64),2.48,z+.64,1.28,4.48,5.12,teal,'growers-exchange-pier');
    }
    solid(iron,x,2.32,z+2.40,width,4.16,1.28,coal,'growers-exchange-back');
    solid(iron,x,4.80,z,width+1.28,.64,6.40,coal,'growers-exchange-roof');
    for(let n=0;n<bays;n++){
      const xx=x+(n-(bays-1)/2)*spacing;
      box(opal,xx,2.28,z+1.70,2.56,2.48,.16,n%3===1?0xd88b6e:0xe9b080);
      box(cast,xx,2.78,z,2.56,.24,1.44,aluminum);
      solid(iron,xx,1.00,z-.32,2.56,1.28,1.60,coal,'growers-night-counter');
      box(cast,xx,1.72,z-.48,2.72,.16,1.92,aluminum);
      for(const pos of [-.64,.64]){
        box(cast,xx+pos,1.99,z-.50,1.04,.36,1.08,teal);
        box(n%2?'eastParkCanopyLight':'eastParkTimber',xx+pos,2.22,z-.64,.80,.32,.64,
          n%2?0xc8baa0:0xf1a979);
      }
      box(cast,xx-1.16,3.62,z-1.04,.32,1.72,2.40,teal);
      box(opal,xx,4.40,z-1.54,2.08,.19,1.60,amber);
    }
    // Each farm level has two separate conditioned pods around a full-height
    // open transfer stair. The short wing steps toward the customers and the
    // long wing backs up the plot. The inlet sky slot grows on the higher tiers.
    const hand=levels%2===0?1:-1;
    for(let row=0;row<levels;row++){
      const y=6.88+row*3.20,deck=z+.16+row*.64,axis=x+hand*row*.48;
      const span=width-row*.80,slot=1.92+row*.16,w=(span-slot)/2;
      for(const side of [-1,1]){
        const u=axis+side*(slot+w)/2,v=deck+side*hand*(.64+row*.32);
        const deep=5.76+(side===hand?.64:-.64),herb=side===hand?0x98c9ac:0xd699af;
        solid('basaltShell',u,y,v,w-.64,2.88,deep-2.56,0x617b84,'growing-room-spine');
        solid('titaniumSkin',u,y-1.36,v,w+.64,.48,deep+.64,0x84a7a5,'growing-room-floor');
        solid('ceramicShell',u,y+1.40,v,w+.32,.40,deep+.32,0xc8d7c9,'growing-room-lid');
        for(const face of [-1,1]){
          const front=v+face*deep/2;
          box(opal,u,y+.12,front-face*1.12,w-.80,2.32,.24,herb);
          for(let bed=0;bed<2;bed++){
            const yy=y-.66+bed*1.04;
            box(cast,u,yy,front-face*.54,w-.80,.22,1.28,teal);
            const n=Math.max(2,Math.floor(w/1.28));
            for(let leaf=0;leaf<n;leaf++)
              box('eastParkCanopyLight',u+((leaf+.5)/n-.5)*(w-1.04),yy+.29,front-face*.46,.72,.36,.64,
                bed===1?0xc0c296:0x9cc5aa);
          }
          for(const edge of [-1,1]){
            box('ceramicShell',u+edge*(w/2-.32),y+.16,front-face*.56,.64,2.24,1.60,0xb8c9c8);
            box(cast,u+edge*(w/2-.32),y+1.04,front,.96,.48,.64,aluminum);
          }
        }
        const cheek=u+side*(w/2-.16);
        box('titaniumSkin',cheek,y,v,.64,2.56,deep-.96,0x7ea2a6);
        box(opal,cheek+side*.36,y+.24,v,.13,.64,deep-1.76,herb);
      }
      // Utilities cross the service slot only at the back of each level.
      box(cast,axis,y-.96,deck+1.92,slot+1.28,.64,1.28,teal);
      box(opal,axis,y-.72,deck+2.60,slot-.48,.22,.16,amber);
    }
    light(x,3.65,z-2.80,0xffb66e,190,18);
    light(x+width*.24,8.80,z-3.64,0xe8a5ac,118,17);
  }
  foodExchange(124.48,93.60,6,3);
  foodExchange(144.00,94.88,4,5);
  for(let n=0;n<7;n++){
    const x=130.88+n*1.60;
    box(iron,x,8.64,92.16,1.60,2.56,4.48,coal);
    for(const dir of [-1,1]){
      box(opal,x,8.93,92.16+dir*2.27,1.28,1.28,.16,n%3===0?ice:0x77b9ad);
      box(cast,x-.62,8.32,92.16+dir*2.40,.32,2.56,.64,teal);
    }
    box(cast,x,7.20,92.16,1.60,.32,5.12,aluminum);
  }
  C(135.68,8.42,92.16,11.20,2.72,4.48,'growers-boxing-bridge');
  label(124.48,4.75,90.34,9.28,1.05,'鲜菜领用所','东园合作社 / 鲜菜夜配',Math.PI,'#ffce92');
  label(144,4.75,91.62,7.04,1.05,'雾培生鲜','温控生长层 / 快件交还',Math.PI,'#eab1a1');
  // A head of jade cabbage grows out of a steel specimen carrier on the
  // bridge fascia. Staggered clumps wrap round a warm-white heart. The wall
  // behind remains visible between the lobes even at street level.
  const stalkX=134.40,stalkZ=89.12;
  for(let row=0;row<3;row++){
    const yy=7.44+row*.48,span=2.56+row*.96;
    box(row===1?cast:iron,stalkX,yy,stalkZ,span,.48,2.56+row*.32,teal);
    box(opal,stalkX,yy+.08,stalkZ-1.35-row*.16,span-.64,.16,.16,row===1?amber:0x709c9d);
  }
  for(const [dx,dz,height,dir] of [[-1.60,.16,4,-1],[1.28,.64,5,1],
    [.32,-.48,7,-1],[-.64,1.0,5,1],[1.76,-.64,3,1]]){
    for(let j=0;j<height;j++){
      const xx=stalkX+dx+dir*j*.32,yy=8.96+j*.64,zz=stalkZ+dz+j*.08;
      const extent=j===0||j===height-1?1.12:j%2===0?2.24:1.76;
      box(opal,xx,yy,zz,extent,.64,.80,j<2?0xb9e5c3:0x54ba97);
      box(cast,xx+dir*(extent/2-.16),yy+.16,zz-.48,.48,.48,.64,j<2?teal:0x418b80);
      box(opal,xx-dir*.16,yy,zz-.51,.32,.59,.32,j<3?ice:0x96e8ac);
      if(j>1&&j<height-1)
        box(opal,xx+dir*.65,yy+.16,zz-.51,.64,.32,.24,0x8ad99c);
    }
  }
  const shuttle=shuttleCar(scene);
  shuttle.position.set(railX,railY-4.55,-36.8);

  // Under permanent night, nursery stock depends on municipal artificial
  // daylight. The collector at the north works has a hollow, stepped throat,
  // two stand-off reflector faces and a small volume of truly brilliant core.
  // An oblique gimbal exposes both its depth and its face from the avenue.
  const cx=97.28,cz=-44.80,yaw=-.40,cc=Math.cos(yaw),ss=Math.sin(yaw);
  const point=(u,v)=>[cx+u*cc+v*ss,cz-u*ss+v*cc];
  function rotor(m,u,y,v,w,h,d,t){
    const [x,z]=point(u,v);B(m,x,y,z,w,h,d,t,yaw,null,true);
  }
  const rotorY=17.28,pitch=1.12;
  for(const s of [-1,1]){
    const [fx,fz]=point(s*9.6,0);
    for(let level=0;level<4;level++){
      const width=2.88-level*.32,yy=1.60+level*3.20;
      solid(iron,fx,yy,fz,width,3.20,3.84,level%2?teal:coal,'sun-collector-pier');
      box(cast,fx,yy+1.28,fz,width+.64,.64,4.48,aluminum);
      box(opal,fx,yy,fz+1.96,.64,1.92,.16,0x6ab5a9);
    }
    for(let level=0;level<5;level++){
      rotor(cast,s*(9.6-level*.48),12.96+level*.96,0,2.88,.96,4.16,teal);
    }
    rotor(iron,s*8.96,rotorY,0,3.20,2.56,5.12,coal);
    for(const v of [-1,1])rotor(opal,s*8.96,rotorY,v*2.65,1.92,.48,.24,jade);
  }
  // One row per cast shell course: the bore stays open right through it.
  for(let row=-8;row<=8;row++){
    const outer=Math.floor(Math.sqrt(8.7**2-row**2));
    const inner=Math.abs(row)<6?Math.floor(Math.sqrt(5.8**2-row**2)):-1;
    const ranges=inner<0?[[-outer,outer]]:[[-outer,-inner-1],[inner+1,outer]];
    for(const [a,b] of ranges){
      const y=rotorY+row*pitch,u=(a+b)*pitch/2,w=(b-a+1)*pitch;
      rotor(iron,u,y,0,w,pitch,3.84,coal);
      for(const face of [-1,1]){
        rotor(cast,u,y,face*1.94,w,pitch,.48,row%3===0?aluminum:teal);
        const inward=inner>=0?(a<0?b:a)*pitch:u;
        rotor(opal,inward,y,face*2.25,inner>=0?pitch*.70:w*.68,pitch*.76,.32,
          row<4?amber:0xffcf91);
        if(inner>=0){
          const outward=(a<0?a:b)*pitch;
          rotor(iron,outward,y,face*2.22,.32,pitch,.64,teal);
        }
      }
    }
  }
  // Lamp hangers are offset from the aperture's centre. The inner free
  // space remains visible beyond them between the emitter and the arc.
  for(const s of [-1,1]){
    for(let j=0;j<5;j++){
      const u=s*(6.4-j*1.12),y=rotorY+2.24-j*.48;
      rotor(cast,u,y,-.48,1.28,.80,1.76,aluminum);
    }
  }
  for(let row=-2;row<=2;row++){
    const w=(Math.abs(row)===2?1:Math.abs(row)===1?3:5)*.80;
    rotor(iron,0,rotorY+row*.64,-.16,w+.64,.64,3.20,coal);
    for(const face of [-1,1])rotor(opal,0,rotorY+row*.64,face*1.61,w,.64,.32,
      Math.abs(row)===2?0xffa154:row===0?0xffffd6:0xffd794);
  }
  const [panelX,panelZ]=point(0,2.40);
  rotor(iron,0,6.04,1.36,18.56,1.60,1.92,coal);
  rotor(cast,0,6.94,1.36,18.88,.24,2.24,aluminum);
  label(panelX,6.04,panelZ,9.60,1.36,'人 造 日 照','市政育苗圃 ／ 配光机组 07',yaw,'#f1bc85');
  for(const s of [-1,1]){
    const [x,z]=point(s*6.4,2.0);
    light(x,10.5,z,0xffb478,135,19);
  }

  // Night-shift coolant and growing medium travel through a distribution
  // gallery between the irrigation head and the nursery. The east end crosses
  // the ring highway above truck clearance and meets the existing head tank.
  const galleryZ=-10.88;
  for(const x of [100.48,116.48,143.04]){
    solid(stone,x,1.38,galleryZ,2.56,2.40,3.20,teal,'east-supply-abutment');
    solid(iron,x,5.15,galleryZ,1.60,5.44,2.24,coal,'east-supply-abutment');
    for(let row=0;row<3;row++){
      box(cast,x,8.08+row*.64,galleryZ,2.24+row*.96,.64,2.88+row*.64,aluminum);
    }
    box(opal,x,4.72,galleryZ+1.19,.64,3.20,.16,0x83cebc);
  }
  for(let bay=0;bay<11;bay++){
    const x=98.72+bay*4.80,y=10.72+(bay>6?.64:0);
    solid(iron,x,y,galleryZ,4.80,1.28,3.84,coal,'east-supply-gallery');
    box(cast,x,y+3.04,galleryZ,4.80,.64,4.48,aluminum);
    for(const side of [-1,1]){
      box(cast,x-1.92,y+1.64,galleryZ+side*1.60,.64,2.56,.96,teal);
      box(opal,x+.24,y+1.68,galleryZ+side*1.23,3.52,1.28,.32,
        bay<5?0xd79476:bay%4===0?ice:0x78c2af);
      box(iron,x+.45,y+1.32,galleryZ+side*1.86,3.84,.32,.64,coal);
    }
    if(bay%4===1){
      for(let k=-1;k<=1;k++)box(k===0?cast:iron,x+k*.96,y-.32,galleryZ,
        .96,1.60-Math.abs(k)*.32,5.12-Math.abs(k)*.64,teal);
      box(opal,x,y-1.18,galleryZ,1.28,.16,2.88,0x94cbac);
    }
  }
  // Glazed service faces hug the landscaped verge, with a recessed ticket
  // hatch and real conductor stacks at the east terminus of the utility span.
  for(const [x,z,poles] of [[114.88,-11.20,4],[141.12,-11.20,5]]){
    for(let n=0;n<poles;n++){
      const xx=x+(n-(poles-1)/2)*1.44;
      box(iron,xx,2.64,z,1.44,4.48,2.88,coal);
      for(const side of [-1,1]){
        box(opal,xx,2.74,z+side*1.46,1.12,2.72,.32,n%3===0?0xffaf75:0x87c8bf);
        box(cast,xx-.51,2.80,z+side*1.60,.32,3.20,.64,teal);
        box(iron,xx,2.36,z+side*1.66,1.12,.32,.48,coal);
      }
      box(cast,xx,5.04,z,1.44,.48,4.80,aluminum);
      C(xx,2.64,z,1.44,4.48,2.88,'east-service-room');
    }
    light(x,3.50,z+2.30,0xa6e8cc,135,15);
  }
  // Open nutrient retorts interrupt the rectangular gallery. Each vessel
  // is actually recessed within stepped retaining jaws; the liquid levels,
  // volumes and pipe bends differ at the three stages of distillation.
  for(const [x,z,h,r,level] of [[127.36,-12.80,22.40,3.20,3],
    [133.12,-16.00,15.68,2.56,1],[122.24,-15.04,17.92,1.92,2]]){
    const footing=r*.7;
    solid(iron,x,3.54,z-.64,r*1.40,6.72,r*.76,coal,'nutrient-retort-foot');
    // Water-drawing hatches face away from the nursery. Exchange bottles
    // stand in the recess and their lamps light both shelves and container.
    for(const face of [-1,1]){
      const v=z+face*(footing+.08);
      for(let tier=0;tier<3;tier++){
        const yy=2.02+tier*1.12;
        box(opal,x,yy,v,footing*1.34,.76,.16,
          tier===0?0xfaba83:tier===1?0x68cfc1:0x6c9b95);
        box(cast,x,yy-.46,v+face*.20,footing*1.56,.24,.88,teal);
        box(iron,x-footing*.28,yy-.11,v+face*.33,.44,.47,.32,coal);
        box(cast,x-footing*.28,yy+.18,v+face*.33,.24,.15,.32,aluminum);
      }
      box(cast,x,5.39,v,footing*1.76,.42,1.60,teal);
    }
    for(const side of [-1,1]){
      box(cast,x+side*(r*.68),4.42,z,1.28,7.36,2.56,teal);
      box(opal,x+side*(r*.68),4.89,z+1.36,.48,4.48,.24,0x8dd7c1);
    }
    const startY=7.04,bodyH=h-startY,bands=8,spacing=bodyH/bands;
    for(let j=0;j<bands;j++){
      const middle=j>1&&j<6,extent=r*(middle?1.76:j===0||j===7?1.04:1.40),y=startY+(j+.5)*spacing;
      box(iron,x,y,z,extent,spacing,extent*.82,coal);
      for(const side of [-1,1]){
        box(opal,x,y,z+side*extent*.43,extent*.71,spacing*.79,.32,
          j<level+2?j%2===0?0x39baad:0x7de0ba:j%2===0?0x80b7a9:0x5a968e);
        box(opal,x+side*extent*.52,y,z,.24,spacing*.79,extent*.45,j<level+2?jade:0x619d94);
        box(cast,x+side*(extent*.42),y,z+extent*.44,.64,spacing+.16,.96,aluminum);
        box(cast,x,y-spacing*.43,z+side*extent*.47,extent+.32,.32,.64,teal);
      }
      if(!middle)box(cast,x,y+.42*spacing,z,extent+1.28,.40,extent+1.28,aluminum);
    }
    for(let neck=0;neck<3;neck++){
      box(iron,x+neck*.48,h+.40+neck*.64,z,1.92,.80,1.92,teal);
      box(cast,x+neck*.48,h+.68+neck*.64,z,2.24,.24,2.24,aluminum);
    }
    light(x,8.64,z+2.72,0x8be8cb,155,18);
  }

  // Occupied south frontage. Real reverse sides light the cafe and trees
  // inside the park; platform customers and the roadway get a warmer face.
  for(const [x,z,bays,title,food] of [[81.92,74.88,3,'修机取件',false],
    [99.20,74.88,2,'夜班馄饨',true],[111.68,75.20,3,'园工食堂',true]]){
    for(let i=0;i<bays;i++){
      const u=x+(i-(bays-1)/2)*2.56;
      if(x<105){
        solid(iron,u,1.58,z,2.56,2.44,1.28,coal,'park-shophouse');
        for(const side of [-1,1]){
          box(opal,u,1.98,z+side*.70,2.08,1.38,.20,food?0xefb077:0x76bfc7);
          box(cast,u,1.29,z+side*.96,2.43,.16,.90,aluminum);
          box(iron,u-.89,1.94,z+side*.80,.32,1.44,.64,coal);
          for(const dir of [-1,1])box(cast,u+dir*.45,1.50,z+side*.92,.48,.33,.32,teal);
        }
      }
      for(let step=0;step<3;step++){
        box(step===1?cast:iron,u,3.92+step*.32,z,2.56,.32,5.12-step*.64,step===1?aluminum:coal);
      }
      for(const side of [-1,1]){
        box(opal,u,3.72,z+side*2.22,2.08,.16,.48,food?amber:jade);
        if(i===0)box(cast,u-1.13,2.36,z+side*1.88,.25,2.72,.32,teal);
      }
    }
    label(x,4.10,z+2.38,bays*2.30,.69,title,food?'蒸汽灶 / 夜间营业':'电控维修 / 夜间取件',0,food?'#ffbe87':'#83e1cc');
    light(x,3.26,z+2.26,food?0xffb576:0x77d8d5,95,13);
    light(x,3.26,z-2.26,food?0xffb576:0x77d8d5,70,11);
  }

  // On the far bank the settling tanks acquire vertical lit filter stacks.
  // The outer lip is visible facing north, west and south down the loop.
  for(const [x,z,levels] of [[148.8,-7.04,6],[151.36,53.76,5]]){
    for(let n=0;n<levels;n++){
      const yy=7.36+n*4.16,xx=x-.40*n;
      box(iron,xx,yy,z,4.48,4.16,5.76,coal);
      for(const side of [-1,1]){
        box(cast,xx-2.32,yy,z+side*2.72,1.28,4.16,1.28,aluminum);
        box(opal,xx-2.35,yy,z+side*1.13,.32,2.88,1.60,n%3===0?ice:jade);
        box(opal,xx-.64,yy,z+side*3.02,1.76,2.56,.32,n%3===0?ice:jade);
      }
      box(cast,xx,yy+1.75,z,5.76,.64,7.04,teal);
      box(iron,xx-2.40,yy+.82,z,.96,.48,6.4,coal);
    }
  }
  return function updateNightline(time){
    // Six seconds to board at each end, followed by a smooth stop-to-stop
    // shuttle run. A bidirectional cab avoids turning on a one-rail terminus.
    const phase=(time+13)%68,forward=phase<34,leg=forward?phase:phase-34;
    const t=T.MathUtils.clamp((leg-5)/29,0,1);
    const eased=t*t*(3-2*t),progress=forward?eased:1-eased;
    shuttle.position.z=-36.80+progress*106.56;
  };
}

