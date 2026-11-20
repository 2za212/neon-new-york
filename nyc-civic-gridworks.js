import * as T from 'three';
import {coreRoutes} from './nyc-future-core-layout.js';

// Supply galleries join real buildings. Their two skins are physically
// separate, so looking along the street, across it, or up from the lower
// freight deck reveals a different set of conductors and supporting shoes.
const iron=0x303f4e,alloy=0x849ba2,ceramic=0xc2c8bc,copper=0xb08869;
const opal=0xbcdae1,service=0xdeae78;

// Baked bounce from the adjacent luminous cores. Only the inward cheeks,
// insulators and armatures use this finish. World-space normals let corner
// faces separate even beyond the mobile real-time light radius.
export function receiverFinish(base){
  const mat=base.clone(),previous=base.onBeforeCompile,oldKey=base.customProgramCacheKey();
  mat.name='供能廊 / 受光陶瓷与裸露金属';
  mat.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec3 relayN=transformNormalByInverseViewMatrix(normal,viewMatrix);
      float insideFace=max(dot(relayN,vec3(-.46,-.78,.41)),0.);
      float returnFace=max(dot(relayN,vec3(.56,.36,-.74)),0.);
      vec3 bounceTint=mix(vec3(.80,.90,1.),vec3(1.,.77,.53),
        smoothstep(.015,.16,diffuseColor.r-diffuseColor.b));
      outgoingLight+=sqrt(max(vec3(0.),diffuseColor.rgb))*bounceTint*(.021+.14*insideFace+.038*returnFace);
      #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey=()=>oldKey+'/switchgear-return-1';
  return mat;
}

function span(k,a,b,y,industrial=false){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  const f=k.frame(...a,-Math.atan2(dz,dx)),{B}=f;
  const count=Math.max(3,Math.round(length/5.12)),bay=length/count;
  const cast=industrial?copper:alloy,lens=industrial?service:opal;
  // The deep castellated girder carries weight across the long opening.
  // Leave the centre open. Daylight is gone but the opposing bank of lights
  // remains visible between uprights, even in the mobile base pass.
  B('hull',iron,length/2,y,0,length,.80,3.52);
  B('receiver',cast,length/2,y+3.36,-.16,length,.64,4.16);
  B('receiver',cast,length/2,y+.16,1.52,length,.80,.64);
  B('hull',iron,length/2,y+1.04,-1.28,length,.64,.96);
  for(let i=0;i<count;i++){
    const u=(i+.5)*bay,forward=i%2===0?1:-1;
    B('receiver',i%3===0?ceramic:cast,u-bay*.42,y+1.84,forward*1.44,.64,3.04,.96);
    B('hull',iron,u,y+1.76,-.32,bay*.84,.96,.96);
    B('light',i%3===0?lens:industrial?0x9b7560:0x769da7,u,y+1.90,-.32,bay*.75,.38,1.05);
    if(i%3===1){
      // Enlarged insulating sleeves have a stepped exterior and an inset
      // lit underside, with short dark sections between the units.
      for(let j=-1;j<=1;j++){
        const core=j===0;
        B('hull',core?cast:iron,u+j*.80,y+.03,0,.80,core?2.56:1.92,core?5.76:5.12);
        B('receiver',ceramic,u+j*.80,y+(core?-1.36:-1.04),forward*1.76,.80,.32,1.60);
      }
      B('light',lens,u,y-1.45,0,1.60,.16,2.08);
    }
  }
  f.C(length/2,y,0,length,.80,3.52);
}

// A high-voltage interrupter is hung from the girder, with an open jaw
// around each end of its warm ceramic core. It interrupts the silhouette
// across the street and has a legible end profile on its return approach.
function lineBreaker(k,a,b,at,y,cold=false){
  const dx=b[0]-a[0],dz=b[1]-a[1],f=k.frame(a[0]+dx*at,a[1]+dz*at,-Math.atan2(dz,dx));
  const {B}=f,lens=cold?opal:service,caseColour=cold?alloy:copper;
  B('hull',iron,0,y+1.92,0,8.32,3.84,3.84);
  for(const side of [-1,1]){
    for(let layer=-2;layer<=2;layer++){
      const inset=Math.abs(layer)*.64,yy=y+2.24+layer*.96;
      B('receiver',layer===0?ceramic:caseColour,side*3.52,yy,0,1.28,.96,7.68-2*inset);
      B('light',lens,side*4.19,yy,0,.10,.58,3.84-inset);
      B('hull',iron,side*4.32,yy,0,.35,.98,.96);
    }
  }
  for(let rib=0;rib<5;rib++){
    const u=(rib-2)*1.12;
    B('receiver',caseColour,u,y+3.04,0,.64,2.88,5.44);
    B('hull',alloy,u,y+1.12,0,.64,.96,4.80);
    for(const side of [-1,1])
      B('light',cold?0xa5c5ce:0xd19a67,u+.37,y+2.32,side*2.08,.32,1.60,.72);
  }
}

function roadFacing(b){
  let best=Infinity,normal=[0,1];
  for(const route of coreRoutes)for(let i=1;i<route.points.length;i++){
    const [x,z]=route.points[i-1],end=route.points[i],dx=end[0]-x,dz=end[1]-z;
    const t=T.MathUtils.clamp(((b.x-x)*dx+(b.z-z)*dz)/(dx*dx+dz*dz),0,1);
    const nx=x+t*dx-b.x,nz=z+t*dz-b.z,dd=nx*nx+nz*nz;
    if(dd<best){best=dd;normal=[nx,nz];}
  }
  const along=b.c*normal[0]-b.s*normal[1],front=b.s*normal[0]+b.c*normal[1];
  const side=Math.abs(along)>Math.abs(front);
  const turn=side?Math.sign(along)*Math.PI/2:(front>=0?0:Math.PI);
  return {angle:b.angle+turn,depth:side?b.w:b.d,width:side?b.d:b.w};
}

function facadeFrame(k,b,face){
  const dist=face.depth/2;
  return k.frame(b.x+Math.sin(face.angle)*dist,b.z+Math.cos(face.angle)*dist,face.angle);
}

// The offset inlet of a corporate switchhouse: a broad mouth at podium
// level and a narrow, stepped blade which still reads above the adjoining
// housing. The face is set back behind the cheeks, rather than painted on.
function switchhouse(f,width,base,height){
  const {B}=f,w=Math.min(12.80,width*.78);
  const h=Math.min(39.68,height-base+4.48),stepH=Math.min(5.12,h*.265);
  if(h<6.4)return;
  const mouth=w*.72;
  B('hull',iron,0,base+stepH*.5,-.32,w,stepH,3.20);
  B('wash',0xc2d8d8,0,base+stepH*.52,1.33,mouth,stepH*.80,.24);
  for(const side of [-1,1]){
    B('hull',alloy,side*mouth*.52,base+stepH*.5,1.28,.96,stepH,2.56);
    for(let i=0;i<3;i++){
      const u=side*(w*.49-.32*i),y=base+stepH+.48*i;
      B('hull',i===1?ceramic:alloy,u,y,1.12-i*.51,1.28+.64*i,.64,3.20+i*.64);
    }
  }
  for(let i=0;i<4;i++)B('hull',iron,(i-1.5)*mouth*.21,base+stepH*.50,1.75,.22,stepH*.86,.48);
  B('hull',alloy,0,base-.32,1.28,w+.64,.64,3.84);
  f.C(0,base-.32,1.28,w+.64,.64,3.84);
  B('light',opal,0,base-.53,2.72,mouth,.24,.64);
  const levels=Math.max(2,Math.round((h-stepH)/4.80)),rise=(h-stepH)/levels;
  for(let i=0;i<levels;i++){
    const t=i/levels,pw=w*(.76-.50*t),u=w*(-.08+.26*t),y=base+stepH+rise*(i+.5);
    B('hull',iron,u,y,-.80,pw,rise+.04,3.52);
    B('receiver',i%3===0?ceramic:alloy,u-pw*.40,y,.80,pw*.22,rise+.08,1.92);
    B('light',i%3===0?0xd1eeeb:0x91afb6,u+pw*.23,y,.98,pw*.20,rise*.82,.32);
    B('hull',alloy,u,y+rise*.41,1.02,pw+.64,.64,2.24);
    B('hull',iron,u+pw*.49,y,-.96,.96,rise*.76,3.84);
  }
}

function homeGallery(f,width,height){
  const {B}=f,w=Math.min(width*.84,14.72),count=Math.max(2,Math.floor(w/3.2));
  // Two sky lounges turn the scale of a blank housing flank into occupied
  // double-height terraces. Width, setback and overhanging end vary by floor.
  for(const [i,y] of [7.36,Math.min(21.12,height*.68)].entries()){
    if(i===1&&y<13.44)continue;
    const dir=i?-1:1,off=w*.10*dir,interval=w/count;
    B('hull',iron,off,y+.16,.32,w+.96,.96,4.16);
    f.C(off,y+.16,.32,w+.96,.96,4.16);
    B('hull',ceramic,off,y+.58,2.08,w+.64,.36,.80);
    B('hull',iron,off,y+4.80,.48,w+.64,.64,4.16);
    for(let n=0;n<count;n++){
      const u=off+(n-(count-1)/2)*interval;
      B('wash',n%3===1?0xd6bba3:0xb0c7ce,u,y+2.56,.57,interval-.23,3.68,.32);
      B('hull',alloy,u-interval*.48,y+2.56,1.76,.32,4.16,1.28);
      B('light',n%3===1?0xd9b18c:0xa4bbc3,u,y+4.07,1.02,interval-.68,.28,.48);
    }
    for(let j=0;j<3;j++)B('hull',j===1?alloy:iron,off+dir*(w*.48+j*.32),y+4.5-j*.64,1.92,.96,.80,1.92-j*.32);
  }
}

// The old cooling plant straddles the courier court. At street height its
// brick supports carry the return manifolds; riders can collect cells from
// the two-sided exchange rack behind the existing bicycle dock.
function courierCoolingCourt(k,sign){
  for(const [index,x] of [-27.2,-9.6].entries()){
    const f=k.frame(x,-72.16,Math.PI),{B}=f;
    for(const side of [-1,1]){
      const u=side*1.14;
      B('hull',iron,u,3.52,1.36,.96,5.76,.72);
      for(let i=0;i<5;i++){
        const y=1.92+i*.80,lip=i===0||i===4;
        B('receiver',i%2?alloy:copper,u,y,1.70,.96,.48,.96);
        B('light',index?0xb9cfd2:0xffb784,u,y+.32,1.80,.48,.22,.72);
        if(lip)B('receiver',ceramic,side*1.43,y,1.12,.64,.48,1.12);
      }
      // Turn the headers around both corners. The sleeves have a genuine
      // end silhouette on the perpendicular side of the intersection.
      for(let n=0;n<3;n++){
        const y=5.60+n*.48,run=1.28+n*.64;
        B('receiver',n===1?copper:alloy,side*(1.12+.24*n),y,.16,1.12,.48,run+2.24);
        B('light',index?opal:service,side*(1.70+.24*n),y,1.02,.12,.26,.80);
      }
      B('hull',alloy,side*1.48,2.80,.30,.64,3.84,.80);
      B('light',index?0x98b9be:0xc7946e,side*1.82,3.60,.30,.12,1.60,.36);
    }
    B('hull',iron,0,1.04,1.40,2.88,.64,1.28);
    f.C(0,1.04,1.40,2.88,.64,1.28);
    B('receiver',copper,0,5.86,1.58,3.20,.48,.96);
  }
  const f=k.frame(-18.4,-70.40,Math.PI),{B,C}=f;
  // A continuous two-storey maintenance canopy. Each cassette is nested
  // into the next cap and the opening between supports stays accessible.
  for(let i=0;i<8;i++){
    const u=(i-3.5)*2.24,y=5.60+(i<2?.64:i>5?.32:0),v=i<2?.80:i>5?.48:1.12;
    B('hull',iron,u,y,v,2.24,.64,4.16);
    C(u,y,v,2.24,.64,4.16);
    B('receiver',i%3===0?ceramic:alloy,u,y+.28,v+1.76,2.24,.56,1.28);
    B('receiver',copper,u-.64,y-.30,v+1.44,.64,.64,1.92);
    B('light',i%3===1?0xe2ac79:0xacc5c3,u+.43,y-.38,v+1.36,1.28,.17,1.52);
  }
  const station=k.frame(-18.88,-70.08,Math.PI);
  for(let i=0;i<4;i++){
    const u=(i-1.5)*2.24;
    station.B('hull',iron,u,1.89,0,2.24,3.04,1.60);
    station.C(u,1.89,0,2.24,3.04,1.60);
    for(const face of [-1,1]){
      for(let j=0;j<3;j++){
        const y=1.07+j*.80,open=(j+2*i)%4===0;
        station.B('wash',open?0x657c7d:0xcfa782,u,y,face*.81,1.76,.64,.20);
        station.B('receiver',open?iron:copper,u+.16,y-.16,face*.98,1.28,.32,.50);
        station.B('light',open?0x6d928f:0xf3c399,u-.60,y,face*.97,.32,.32,.22);
      }
      station.B('receiver',i===1?ceramic:alloy,u-1.0,1.89,face*.84,.32,3.36,.80);
    }
    station.B('receiver',alloy,u,3.53,.04,2.24,.48,2.24);
  }
  if(sign)for(const face of [-1,1]){
    const [x,z]=station.point(0,face*1.21);
    sign(x,3.50,z,6.40,.91,'夜班骑手换电站','旧交易所  /  周转电池',face===1?'#f7c79a':'#bad3ce',face===1?Math.PI:0);
  }

  // Opposite the courier court, the return current enters the tall brick
  // building through a pair of open heat exchangers. Both street faces
  // expose the stepped outer jaw and the working vanes in its throat.
  for(const [x,z,angle] of [[-48.0,-94.85,0],[-43.9,-100.0,Math.PI/2]]){
    const face=k.frame(x,z,angle),{B,C}=face;
    B('hull',iron,0,3.04,.16,6.40,4.80,.96);
    C(0,3.04,.16,6.40,4.80,.96);
    for(let row=0;row<6;row++){
      const y=1.60+row*.64,inset=Math.max(0,Math.abs(row-2.5)-.5)*.48;
      const half=2.88-inset;
      for(const side of [-1,1]){
        B('receiver',row%2?copper:ceramic,side*half,y,.96,.96,.64,1.6);
        B('receiver',alloy,side*(half+.48),y,.48,.64,.64,1.28);
      }
      B('wash',0xbf997e,0,y,.70,half*2-1.12,.49,.26);
      B('light',row%3===1?0xffb475:0xb78163,0,y-.09,.88,half*2-1.28,.18,.24);
      B('hull',iron,0,y+.23,1.12,half*2-1.12,.22,.92);
    }
    for(let i=0;i<3;i++)B('receiver',i===1?alloy:copper,0,5.44+i*.32,.96-i*.32,6.40-i*.64,.32,2.56-i*.48);
  }
}

// Night settlement desks above the original street transformer cabinets.
// The roof steps down to the old parking court. The ends remain open, so
// current can be followed down to the cabinets and people can pass below.
function settlementAnnex(k,sign){
  const f=k.frame(-52.8,-152.48,Math.PI/2),{B,C}=f;
  for(const u of [-5.44,5.44])for(const v of [-3.52,2.88]){
    B('hull',iron,u,2.40,v,.96,4.16,.96);C(u,2.40,v,.96,4.16,.96);
    for(let i=0;i<3;i++){
      B('receiver',i===1?copper:alloy,u,3.20+.48*i,v+.32*i,1.28+i*.64,.48,1.60+i*.32);
      if(v>0&&i===2)B('light',service,u,3.92,v+1.12,1.6,.15,.48);
    }
  }
  // Tallest volume contains the two exchange counters. Adjacent bays
  // contain spooled conductors, visible through the stepped front hoods.
  for(let i=0;i<6;i++){
    const u=(i-2.5)*2.24,staff=i===2||i===3,cap=staff?8.16:i<2?7.20:6.56;
    B('hull',iron,u,4.48,-.16,2.24,.64,8.32);
    C(u,4.48,-.16,2.24,.64,8.32);
    B('receiver',i%2?alloy:copper,u,4.75,3.56,2.24,.64,1.28);
    B('hull',iron,u,(cap+4.8)/2,-1.28,2.24,cap-4.8,4.48);
    B('wash',staff?0xffc99b:0xb3c8c6,u,(cap+4.8)/2,1.12,2.08,cap-4.96,.32);
    B('hull',alloy,u-1.01,(cap+4.8)/2,1.44,.32,cap-4.16,1.28);
    B('receiver',i<2?ceramic:alloy,u,cap+.16,.64,2.24,.64,6.40);
    B('light',staff?service:opal,u,cap-.24,2.72,1.60,.16,1.28);
    if(staff){
      B('receiver',copper,u,5.36,2.34,2.24,.64,1.28);
      B('hull',iron,u+.40,5.90,2.26,.64,.48,.40);
    }else for(let j=0;j<3;j++)B('receiver',j===1?copper:iron,u,5.2+j*.48,2.02,1.54,.26,1.5);
  }
  for(const u of [-1.2,1.2])for(let j=0;j<3;j++)
    B('receiver',j===2?ceramic:copper,u,3.86-j*.48,-.96-j*.64,.64,.64,4.48-j*1.28);
  if(sign){
    const [x,z]=f.point(0,4.24);
    sign(x,4.52,z,7.04,.98,'夜间清算所','旧交易所  /  票据归档','#edc89c',Math.PI/2);
  }
}

export function buildExchangeGridworks(box,solid,materials,scene,lights,sign){
  // Reuse the city spatial geometry batch so these long spans do not
  // introduce one draw per ceramic course, hood or light cassette.
  materials.exchangeGridLens=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  materials.exchangeGridLens.name='旧交易所 / 陶瓷廊灯';
  materials.exchangeGridLens.userData.signalLens=true;
  materials.exchangeGridLens.userData.keepDistant=true;
  materials.exchangeArmature=receiverFinish(materials.midtownSteel);
  const k={frame(x,z,angle){
    const c=Math.cos(angle),s=Math.sin(angle);
    function point(u,v){return [x+c*u+s*v,z-s*u+c*v];}
    function B(material,tint,u,y,v,w,h,d){
      const [px,pz]=point(u,v);
      const mat=material==='light'?'exchangeGridLens':material==='wash'?'civicOpal':material==='receiver'?'exchangeArmature':
        tint===copper?'midtownBronze':tint===ceramic?'midtownLimestone':'midtownSteel';
      box(mat,px,y,pz,w,h,d,tint,angle);
    }
    function C(u,y,v,w,h,d){
      const slices=Math.abs(c*s)>.035?Math.max(1,Math.ceil(w/2)):1,l=w/slices;
      for(let n=0;n<slices;n++){
        const [px,pz]=point(u-w/2+(n+.5)*l,v);
        solid(px,y,pz,Math.abs(c)*l+Math.abs(s)*d,h,Math.abs(s)*l+Math.abs(c)*d);
      }
    }
    return {B,C,point};
  }};
  courierCoolingCourt(k,sign);
  settlementAnnex(k,sign);
  // Housings nest in the real upper storeys. Approaching the hall from
  // the market still exposes three street-level portals beneath the tap.
  const hall=k.frame(-19.12,-143.84,0);
  switchhouse(hall,10.88,10.24,42.24);
  // The archive's night sorting room cantilevers out over the old
  // ticket arches. Set the tallest stepped end towards the market and
  // taper the other end, keeping the diagonal view to the main doorway.
  const sorting=k.frame(-6.72,-142.24,0);
  for(let i=0;i<6;i++){
    const u=(i-2.5)*1.60,length=5.76+Math.min(i,4)*1.28;
    const y=7.52+(i===0?.64:i===5?.32:0),front=length-1.92;
    sorting.B('hull',iron,u,y,front/2-.96,1.60,.80,length);
    sorting.C(u,y,front/2-.96,1.60,.80,length);
    sorting.B('receiver',i%2?alloy:copper,u,y+.48,front-.24,1.57,.64,.96);
    sorting.B('wash',i===3?0xd8aa77:0xacbab3,u,y+1.81,front-.48,1.45,2.16,.25);
    sorting.B('hull',iron,u-.62,y+1.91,front+.04,.32,2.24,1.12);
    sorting.B('receiver',alloy,u,y+3.04,front-.08,1.60,.64,2.24);
    sorting.B('light',i%3===1?service:opal,u,y-.47,front-.32,1.12,.16,1.28);
    for(let j=0;j<3;j++)sorting.B('hull',j===1?copper:iron,u,y-.64-j*.48,front-2.56-j*1.28,1.28,.64,2.24);
  }
  // A stepped return on the back of the exchange serves the northern lane.
  yardExhaust(k.frame(-8,-170.2,Math.PI),17.92,41.6);
  span(k,[-8,-151],[38,-150],13.76);
  // Two distinct upper crossings join the trading towers, leaving the
  // centre street's existing tenement bridge as the low foreground shape.
  span(k,[-53,-102.5],[-14.5,-102],13.12,true);
  span(k,[24.5,-101.5],[74,-102.5],18.56);
  // Corbel into the existing south utility bridge from the terracotta
  // tower. The switch chamber is offset over its old service-road junction.
  span(k,[-53,-102.5],[-18.56,-72.32],10.88,true);
  lineBreaker(k,[-53,-102.5],[-18.56,-72.32],.38,10.88);
  // The western feeder has a switching yard of its own. Four masonry
  // posts stand inside the existing 20 × 12 m service court. Parking and
  // the pedestrian approach remain at their old level under the floor.
  const depot=k.frame(-52.64,-71.68,Math.PI),D=depot.B;
  for(const u of [-6.72,6.72])for(const v of [-2.88,2.88]){
    D('hull',alloy,u,2.88,v,1.28,5.44,1.28);
    depot.C(u,2.88,v,1.28,5.44,1.28);
    for(let j=0;j<3;j++)D('receiver',j===2?copper:alloy,u,4.64+j*.48,v,1.28+j*.64,.48,1.6+j*.32);
  }
  D('hull',iron,0,6.08,0,16.64,.96,8.96);
  depot.C(0,6.08,0,16.64,.96,8.96);
  D('receiver',copper,0,6.56,3.84,17.28,.64,1.92);
  for(let i=0;i<5;i++){
    const u=(i-2)*3.20,h=i===0?4.16:i===4?5.12:6.40;
    D('hull',iron,u,6.88+h/2,-.64,3.20,h,5.76);
    D('wash',i===1?0xad967b:0xaebbc0,u,8.64,2.48,2.88,2.88,.32);
    D('receiver',alloy,u-1.12,9.12,3.52,.64,4.48,1.60);
    D('receiver',i%2?alloy:copper,u,6.88+h,1.92,3.20,.64,5.12);
    D('light',i===1?service:opal,u,10.24,2.80,2.56,.24,.32);
    for(let j=0;j<3;j++)D('hull',iron,u,7.36+j*.80,2.72,2.88,.18,.40);
    D('light',service,u,5.55,2.88,1.92,.13,1.60);
  }
  span(k,[-52.64,-71.68],[-18.56,-72.32],10.88,true);
  const receivers=[
    [-53,-95.14,0,15.36,30.72,true],[-14.5,-95.33,0,12.80,35.84,false],
    [24.5,-109.24,Math.PI,19.20,39.68,false],[38,-137.92,0,16.64,36.48,false],
    [67.48,-102.5,-Math.PI/2,12.80,26.24,true],
    [-53,-110.06,Math.PI,13.44,27.52,true],[38,-162.16,Math.PI,15.36,33.28,true]
  ];
  for(const [x,z,yaw,w,height,work] of receivers){
    const f=k.frame(x,z,yaw);
    if(work)yardExhaust(f,w,height);else switchhouse(f,w,7.68,height);
  }
  for(const [x,y,z,power,colour] of [[-8,10.08,-140.96,185,0xc8e4eb],
    [-36.64,12.16,-101.12,115,0xd4ad83],[48,17.6,-101.28,115,0xb4d9e2],
    [-53,5.44,-75.84,132,0xf3c28d],[-27.36,3.36,-74.68,104,0xf3bd91],
    [-18.88,4.96,-72.80,135,0xf4d3a9],[-45.8,3.84,-92.96,90,0xeab389],
    [-49.60,3.60,-152.00,100,0xf3c99d]]){
    const lamp=new T.PointLight(colour,power,22,2);
    lamp.position.set(x,y,z);lamp.userData.nightPower=power;scene.add(lamp);lights.push(lamp);
  }
}

// Fit the headquarters' open western wall. This alcove actually returns
// four metres into the occupied lobby; from the pavement the depth can be
// read between the forward ceramic hood, two switch cassettes and rear glass.
export function headquartersDispatch(k,f,angle,sign){
  const [x,z]=f.point(-13.85,0),face=k.frame(x,z,angle-Math.PI/2),{B,C}=face;
  function mass(material,color,u,y,v,w,h,d){
    B(material,color,u,y,v,w,h,d);C(u,y,v,w,h,d);
  }
  for(const side of [-1,1]){
    mass('hull',iron,side*6.56,3.36,-.80,1.28,6.40,5.76);
    for(let step=0;step<4;step++){
      const u=side*(6.08-step*.32),y=4.64+step*.64;
      B('receiver',step%2?alloy:ceramic,u,y,.64,1.28+step*.64,.64,4.48+step*.32);
      B('light',opal,u,y-.38,1.76,1.00+step*.32,.16,.80);
    }
  }
  mass('hull',iron,-2.56,3.20,-3.84,6.72,6.08,.80);
  B('wash',0xd1f4f0,-2.56,3.2,-3.32,6.08,5.28,.32);
  for(let i=0;i<2;i++){
    const u=-4.32+i*3.20;
    for(let j=0;j<5;j++){
      const yy=1.44+.80*j,offset=Math.abs(j-2)*.32;
      B('hull',iron,u,yy,-2.64,2.12-offset,.56,1.28);
      B('receiver',i?alloy:ceramic,u,yy+.12,-1.93,1.72-offset,.48,.48);
      B('light',i?0xa4d3dc:0xcef4f1,u,yy-.22,-1.89,1.50-offset,.19,.48);
    }
    mass('hull',alloy,u,.68,-2.28,2.56,.64,2.56);
  }
  // The valved transfer frame stands beside a person-width door into
  // the lobby. Its far jamb is visible through the passage at an angle.
  mass('hull',alloy,1.12,2.72,-2.56,.64,4.80,2.24);
  mass('hull',alloy,5.40,2.72,-2.56,.64,4.80,2.24);
  for(let j=0;j<3;j++){
    B('receiver',j===1?ceramic:alloy,3.20,5.12+j*.32,-2.40,4.80+j*.64,.32,2.24-j*.32);
    B('light',opal,5.69,1.60+j,1.12,.32,.40,1.28);
  }
  for(let i=0;i<5;i++){
    const u=(i-2)*2.56,y=7.04+(i>=3?.32:0),front=2.88-Math.abs(i-2)*.48;
    mass('hull',iron,u,y,front*.5-.64,2.56,.64,front+1.28);
    B('receiver',i===3?ceramic:alloy,u,y+.32,front-.80,2.56,.64,1.92);
    B('light',opal,u,y-.41,front-1.12,1.92,.19,1.28);
  }
  const [sx,sz]=face.point(-2.56,2.72);
  sign(sx,6.84,sz,6.40,.84,'衡光调度站','总部  /  西侧供能口','#bbdfdf',angle-Math.PI/2);
  return face.point(-1.60,1.76);
}

// Two public openings replace the former solid repair-tower plinth.
// The main street sees through the portal and out into the neighbouring
// lane. Recesses leave the power cores well behind the inner walking line.
export function buildExchangeRelayPodium(f,w,d){
  const {B,C}=f;
  function wall(tint,x,y,z,width,height,depth){
    B('hull',tint,x,y,z,width,height,depth);C(x,y,z,width,height,depth);
  }
  const h=6.40;
  wall(iron,0,3.20,d*.29,w,6.4,d*.42);
  wall(alloy,w*.46,3.20,-d*.21,w*.08,6.4,d*.58);
  for(const u of [-w*.46,w*.46])wall(alloy,u,3.20,-d*.45,.96,6.4,1.28);
  wall(iron,0,h-.32,0,w+.64,.64,d+.64);
  B('hull',ceramic,0,h+.08,0,w+.96,.32,d+.96);
  for(const side of [-1,1]){
    // Reflecting inner face of a high current stator. Its angle changes in
    // six block increments, creating a partly visible ring round the void.
    const u=side*(w*.36);
    B('hull',alloy,u,2.72,.58,2.24,4.80,1.28);
    for(let i=0;i<6;i++){
      const inset=Math.abs(i-2.5)*.32;
      // The reflector ends at the backplate; its return never shares the
      // backplate's side face when the stepped stator rows line up.
      B('wash',0xb8e0e4,u-side*inset,1.04+i*.72,-.36,1.28,.70,.60);
      B('light',i%3===0?0xc2f7ff:0xb0cbd1,u-side*(inset+.52),1.04+i*.72,-.56,.32,.65,.77);
    }
    for(let i=0;i<3;i++){
      B('hull',i===1?ceramic:alloy,side*(w*.44-i*.54),3.88+i*.64,-d*.50,
        1.28+i*.32,.64,2.88+i*.32);
      B('light',0xd9e6e1,side*(w*.44-i*.54),3.55+i*.64,-d*.55,.96,.13,1.28);
    }
  }
  for(const x of [-3.2,0,3.2])B('light',opal,x,5.73,-2.24,1.28,.16,4.48);
  // A stepped cold return goes around the side entry. The open corner below
  // the cantilever still has a clear, two-way route at shoulder height.
  for(let i=0;i<4;i++)B('hull',i%2===0?ceramic:alloy,-w*.46-i*.32,5.44+i*.32,-d*.16,
    1.60,.32,6.40-i*.64);
}

function relayCrown(f){
  const {B}=f;
  // Twin ceramic jaws bracket the switching windings. The middle slot is
  // unfilled. The offset light disappears behind the nearer jaw at oblique
  // angles and opens again as the player crosses the street.
  for(const side of [-1,1]){
    for(let i=0;i<5;i++){
      const shift=Math.abs(i-2)*.64,x=side*(3.52-shift),y=14.40+i*1.28;
      B('hull',iron,x,y,1.44,2.24,1.30,3.52);
      B('receiver',ceramic,x+side*.29,y,3.10,1.60,1.29,.80);
      B('light',i===2?0xc2f7ff:0xccdfdc,x-side*.65,y,3.01,.55,1.12,1.28);
      B('hull',alloy,x,y,0,2.88,1.30,2.24);
    }
  }
  B('hull',iron,0,14.40,.80,6.40,.96,3.20);
  for(let i=0;i<5;i++){
    const y=15.20+i*.64;
    B('light',i%2===0?0x8dadb1:0xc6e5e4,.64,y,1.44,1.92,.32,.80);
    B('hull',alloy,.64,y+.24,.96,2.56,.16,1.28);
  }
}

function yardExhaust(f,width,top){
  const {B}=f,w=Math.min(8.96,width*.65),base=Math.min(12.16,Math.max(6.72,top*.29));
  B('hull',iron,0,base+2.88,-.48,w,6.72,2.56);
  for(let j=0;j<3;j++){
    const u=(j-1)*w*.28,h=3.84+j*.96;
    B('hull',copper,u,base+5.44+h/2,-.80,w*.22,h,1.92);
    B('hull',iron,u,base+5.44+h,-.48,w*.27,.64,2.56);
    for(let n=0;n<4;n++){
      B('receiver',alloy,u,base+1.12+n*.96,.80,w*.25,.48,1.60);
      if(n===2||n===0)B('light',n===0?0xe5a865:0xac7858,u,base+.79+n*.96,.92,w*.20,.24,.24);
    }
  }
  for(const side of [-1,1])for(let i=0;i<3;i++)
    B('hull',i===1?copper:iron,side*(w*.46-i*.32),base-i*.64,.32-i*.32,1.28,.80,3.20-i*.64);
}

export function buildCoreGridworks(k,buildings,scene,lights){
  for(const [i,b] of buildings.entries()){
    const face=roadFacing(b),f=facadeFrame(k,b,face);
    if(b.style==='residence')homeGallery(f,face.width,b.height);
    else if(b.style==='works')yardExhaust(f,face.width,b.height);
    else switchhouse(f,face.width,8.32,b.height);
    // Large installations have a maintenance side as well as the public
    // face. Their reverse elevation reaches into the parallel service lane.
    if(b.w>16&&b.d>14&&b.height>35){
      const back=facadeFrame(k,b,{...face,angle:face.angle+Math.PI});
      if(b.style==='residence')homeGallery(back,face.width*.72,b.height*.65);
      else yardExhaust(back,face.width*.84,b.height);
    }
    if(i%4===0&&b.style!=='works'){
      const [x,z]=f.point(0,2.8),lamp=new T.PointLight(0xbad6de,75,14,2);
      lamp.position.set(x,8.0,z);lamp.userData.nightPower=75;scene.add(lamp);lights.push(lamp);
    }
  }
  const relay=buildings.find(b=>b.x===28&&b.z===-194);
  if(relay){
    const back=facadeFrame(k,relay,{depth:relay.d,angle:relay.angle+Math.PI});
    relayCrown(back);
    for(const [u,h,v,power] of [[-2.56,3.84,.96,130],[2.56,5.28,-1.6,220]]){
      const [x,z]=back.point(u,v),light=new T.PointLight(0xbadbe2,power,16,2);
      light.position.set(x,h,z);light.userData.nightPower=power;scene.add(light);lights.push(light);
    }
  }
  // Southern municipal tap, interchange, residential feeder, former works
  // line and northern head-end. Breaks in the network leave open sky above
  // the approaches and preserve different silhouettes between neighbourhoods.
  span(k,[28,-194],[68,-189.8],12.80);
  span(k,[48,-257],[64,-292],22.40);
  switchhouse(k.frame(48,-255,-.25),12.8,9.28,25.60);
  span(k,[108,-297],[150,-293],18.56);
  span(k,[-51,-283],[-43,-311],14.08,true);
  span(k,[-43,-311],[-2.7,-318],11.52,true);
  lineBreaker(k,[-43,-311],[-2.7,-318],.55,11.52);
  span(k,[39,-382],[38.4,-365.7],26.24);
  span(k,[38.4,-365.7],[88,-351],13.44);
  lineBreaker(k,[38.4,-365.7],[88,-351],.31,13.44,true);
  // From the lower deck two suspended headers join the actual retaining
  // walls. The taller return gives an explicit way back towards the city.
  for(const [idx,z] of [-232.0,-205.12].entries()){
    const f=k.frame(76,z,0),{B,C}=f,y=idx?2.88:.96;
    B('hull',iron,0,y,0,11.84,.96,2.56);C(0,y,0,11.84,.96,2.56);
    for(const side of [-1,1]){
      for(let i=0;i<4;i++){
        const u=side*(5.60-i*.52);
        B('hull',i%2?alloy:ceramic,u,y-1.60+i*.32,0,1.28,.64,3.20-i*.32);
        B('light',idx?opal:service,u,y-1.94+i*.32,0,.64,.12,1.60);
      }
      B('hull',alloy,side*5.98,(y-3.04)/2,0,.64,y+3.04,2.72);
    }
    B('hull',copper,0,y+.64,0,11.84,.32,.96);
  }
}
