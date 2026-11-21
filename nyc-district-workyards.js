import {BoxGeometry,Color,InstancedMesh,MeshStandardMaterial,Object3D} from 'three';

// Structures are authored in the same local frame as the existing party walls.
// Upper galleries occupy air rights. Freight bays leave the public lane clear.
export function clothBridge(f,length,width,base,variant){
  const {B,C}=f;
  B('metal',0,base,0,length,.48,width,0x5c494e);C(0,base,0,length,.48,width);
  B('metal',0,base+3.14,0,length+.32,.36,width+.64,0x544657);
  for(const side of [-1,1]){
    const v=side*(width/2+.18);
    B('metal',0,base+2.79,v,length,.20,.20,0x95887e);
    const bays=Math.floor(length/2.24),span=length/bays;
    for(let i=0;i<bays;i++){
      const u=(i+.5)*span-length/2;
      B('trim',u-span*.48,base+1.46,v,.16,2.8,.24,0xbb9e89);
      if((i+variant)%4===0)continue;
      const hues=[0xf7ac8b,0x6d95dc,0xc95578,0xf3cd8f],h=1.48+.32*((i+variant)%4);
      for(let j=0;j<4;j++){
        const drop=(j===1||j===2)?.16:0,x=u+(j-1.5)*span*.20;
        B('castEnamel',x,base+2.64-(h+drop)/2,v+side*(j%2)*.16,span*.20,h+drop,.16,hues[(i+variant)%4]);
        B('trim',x,base+2.86-h-drop,v+side*((j%2)*.16+.09),span*.20,.12,.06,0xf4d8ad);
      }
      B('lamp',u,base-.29,side*width*.39,span*.62,.10,.16,0xffca97);
      // Broad samples hang below the dark floor beam. Their scalloped hems
      // give the gallery a second silhouette from underneath and in reverse.
      const drop=.80+((i+variant)%3)*.32;
      for(let j=0;j<3;j++){
        B('castEnamel',u+(j-1)*span*.22,base-.28-drop/2-j%2*.14,v+side*.16,span*.22,drop,.16,hues[(i+variant)%4]);
        B('lamp',u+(j-1)*span*.22,base-.21-drop-j%2*.14,v+side*.17,span*.20,.08,.18,0xffcba8);
      }
    }
  }
}

export function dockShed(f,p){
  const {B,C}=f,v=p.depth/2,w=p.width,iron=0x687f83,ochre=0xe4aa50;
  // Sawtooth half-roof above an open loading face. Outside the roof, the
  // hoist runway continues sideways over the adjacent turnaround.
  const bays=Math.ceil(w/2.56),span=w/bays;
  for(let i=0;i<bays;i++){
    const u=(i+.5)*span-w/2;
    for(let j=0;j<3;j++)B('titaniumSkin',u,4.72+j*.25,v+.89-j*.89,span-.05,.32,1.02,0x8d9a96);
    B('metal',u,4.49,v+.12,.18,.34,3.20,iron);
    B('lamp',u,4.42,v+.89,.80,.10,.24,0xffbc66);
  }
  for(const side of [-1,1]){
    const u=side*(w/2-.40);
    B('metal',u,2.36,v-.16,.48,4.38,.64,iron);C(u,2.36,v-.16,.48,4.38,.64);
    for(let j=0;j<4;j++)B('castEnamel',u,.64+j*.40,v+.18,.46,.20,.08,ochre);
  }
  B('castEnamel',0,4.61,v+1.50,w+.48,.36,.38,ochre);
  for(let j=0;j<4;j++)B('trim',w*.30,2.93-j*.38,v-.82-j*.29,1.12,.19,.58,0xa6c7cc);
}

// The two legs are inside the depot envelope. The stepped cantilever and
// suspended spreader remain above the loading lane and the walking camera.
export function freightCrane(f,reach,height){
  const {B,C}=f,steel=0x545f60,ochre=0xf4ae49;
  for(const u of [-1.6,1.6]){
    B('castEnamel',u,height*.5,0,.64,height,.96,ochre);C(u,height*.5,0,.64,height,.96);
    for(let j=1;j<height/2;j++)B('metal',u,2*j,0,1.12,.32,1.28,steel);
  }
  B('metal',0,height-.8,0,4.16,.64,2.08,steel);
  for(let j=0;j<4;j++)B('castEnamel',0,height+j*.48,(reach*j/4)/2,1.28,.48,3.20+reach*j/4,ochre);
  const tip=reach*.76;
  B('castEnamel',0,height+1.94,tip/2,1.12,.48,tip+1.12,ochre);
  B('metal',0,height+.44,tip,.56,2.64,.48,steel);
  B('castEnamel',0,height-.98,tip,2.56,.45,.83,ochre);
  B('lamp',0,height-.98,tip+.48,.80,.16,.12,0xffb05a);
}

// Open side-loading conveyors. The overhead trolley travels with its ice
// pallet along the gallery, leaving the public pavement and its turn clear.
export function coldLine(api,frame,route,scene,moving){
  const tracks=[];
  for(const [index,a] of route.slice(1,-1).entries()){
    const b=route[index+2],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    const yaw=-Math.atan2(dz,dx),offset=3.92;
    const f=frame(api,(a[0]+b[0])/2+Math.sin(yaw)*offset,(a[1]+b[1])/2+Math.cos(yaw)*offset,yaw);
    const span=length-.80,amber=0xfac15e;
    for(const u of [-span*.43,span*.43]){
      f.B('castEnamel',u,2.48,.80,.56,4.68,.64,amber);f.C(u,2.48,.80,.56,4.68,.64);
      for(let i=0;i<4;i++)f.B('metal',u,.64+i*.56,.80,.62,.18,.71,0x414e59);
      for(let i=0;i<3;i++)f.B('castEnamel',u,4.56+i*.24,.72-i*.48,.72,.32,.72,amber);
    }
    f.B('castEnamel',0,4.94,-.18,span,.46,.76,amber);
    f.B('lamp',0,4.91,-.60,span*.85,.09,.08,0xffbb65);
    f.B('metal',0,.76,0,span,.55,1.28,0x637883);f.C(0,.76,0,span,.55,1.28);
    for(let i=0;i<Math.floor(span/.64);i++)f.B('trim',-span*.5+.40+i*.64,1.11,0,.26,.16,1.18,0xbac9c4);
    tracks.push({f,span,yaw});
  }
  const material=new MeshStandardMaterial({color:0xbbf1ed,emissive:0x326679,roughness:.27});
  const mesh=new InstancedMesh(new BoxGeometry(1,1,1),material,tracks.length*5),obj=new Object3D();
  const pieces=[[-.34,.36,-.26],[.34,.36,-.26],[-.34,.36,.26],[.34,.36,.26],[0,1.02,0]];
  const tint=new Color();
  for(let i=0;i<mesh.count;i++)mesh.setColorAt(i,tint.setHex(i%3===0?0xd3ffff:0x9bdacd));
  function update(dt,time){tracks.forEach(({f,span,yaw},j)=>{
    const travel=Math.sin(time*.19+j*1.8)*(span*.5-1.04);
    pieces.forEach(([u,y,v],i)=>{obj.position.fromArray(f.P(travel+u,1.18+y,v));obj.rotation.y=yaw;obj.scale.set(.64,.64,.48);obj.updateMatrix();mesh.setMatrixAt(j*5+i,obj.matrix);});
  });mesh.instanceMatrix.needsUpdate=true;}
  update(0,0);mesh.computeBoundingSphere();mesh.boundingSphere.radius+=8;mesh.name='西仓夜班输冰线';scene.add(mesh);moving.push(update);
}
