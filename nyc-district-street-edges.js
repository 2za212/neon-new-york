// Sections attach to the piers of occupied street-front buildings. Local +Z
// faces the road, so the same section can turn the corner with its host.
export function streetSection(f,x,z,width,soffit){
  const {B}=f;
  if(x<-44&&Math.abs(z)<=52){
    // A high receiving door with an underslung hoist; a lorry reverses under
    // the beam while the adjacent opening remains available to pedestrians.
    const bay=width*.62,edge=width*.22;
    B('metal',edge,soffit+.28,1.28,bay,.64,2.56,0x536270);
    for(const side of [-1,1]){
      for(let j=0;j<4;j++)B('castEnamel',edge+side*bay*.44,soffit+j*.24,.48+j*.48,.48,.40,.88,0xd3a55d);
      B('metal',edge+side*bay*.24,soffit-.48,2.24,.12,1.12,.12,0x819088);
    }
    B('castEnamel',edge,soffit-1.1,2.24,bay*.56,.32,.48,0xe5aa51);
    B('lamp',edge,soffit-1.12,2.51,bay*.40,.10,.08,0xffbc69);
  }else if(z>52){
    marketRoof(f,width,soffit);
  }else if(z< -52){
    ticketGallery(f,width,soffit);
  }else if(x<-12){
    // Transverse cassettes read edge-on down the shopping street.
    for(let j=0;j<3;j++){
      const u=(j-1)*width*.30,y=soffit+2.4+(j%2)*1.44;
      B('metal',u,y,.96,.48,4.80,2.08,0x544b60);
      B('basaltShell',u,y,2.12,.56,4.48,1.44,0x72677f);
      B(j===1?'cyan':'lamp',u,y,2.88,.32,3.68,.16,j===1?0x8ad7da:0xffa778);
      B('metal',u,y-2.0,2.44,.72,.48,1.28,0x485564);
    }
  }else if(x>12){
    for(let j=-1;j<=1;j++){
      const u=j*width*.31;B('wood',u,soffit+1.76,1,.48,3.52,.48,0x917954);
      B('wood',u,soffit+3.24,1.76,.64,.64,2.24,0x987e61);
      B('leaf',u,soffit+3.57,1.84,width*.36,.96,2.56,0x93b488);
    }
  }else if(z>10){
    // Fire-escape landings run outside the warm apartment windows. Alternating
    // risers make one long stair visible across several storeys.
    for(let floor=0;floor<3;floor++){
      const base=soffit+floor*2.56,side=floor%2?1:-1;
      B('metal',side*width*.25,base,1.48,width*.44,.24,1.76,0x586665);
      B('trim',side*width*.25,base+1.0,2.26,width*.44,.12,.12,0x87948f);
      for(let j=0;j<6;j++){
        const u=side*(width*.27-j*.48);
        B('metal',u,base+.24+j*.40,1.68,.56,.16,1.20,0xa2aba5);
        B('metal',u,base+.70+j*.40,2.24,.10,.96,.10,0x7a8f89);
      }
      B('lamp',side*width*.26,base-.16,1.98,1.28,.08,.24,0xf3b886);
    }
  }else{
    for(const side of [-1,1])for(let j=0;j<3;j++){
      const u=side*(width*.43-j*.48);
      B('metal',u,soffit+.32+j*.40,1.44,1.28,.48,2.72,0x567671);
      B('cyan',u,soffit+.28+j*.40,2.85,.96,.12,.12,0x8bd0c2);
    }
    B('titaniumSkin',0,soffit+1.49,1.28,width*.74,.32,3.04,0x6b877a);
  }
}

// Continuous public edges use the road plan for alignment and leave junctions
// and entrance approaches open. Roofs drain into paired posts at the back.
export function coveredEdges(api,frame,roads,protectedPoints){
  const names=new Set(['soho-avenue','soho-side-west','soho-side-east','soho-cross-market','soho-cross-south','soho-loop-south',
    'midtown-avenue','midtown-cross-south','midtown-cross-north','midtown-side-west','midtown-side-east','midtown-loop-north']);
  // Distinct roof profiles continue out of the central intersection on each
  // approach. The existing transit/vehicle envelope stays free in the middle.
  for(const [x,z,side,kind] of [[-19,4.96,-1,'repair'],[-30,-4.96,1,'repair'],[-41,4.96,-1,'repair'],
    [18,-5.44,1,'garden'],[29,5.44,-1,'garden'],[40,-5.44,1,'garden'],
    [92,-60,1,'school'],[107,-60,1,'school'],[122,-60,1,'school']]){
    const f=frame(api,x,z,side===1?0:Math.PI);
    if(kind==='repair'){
      // Cut out the centre of a radio coil. Each face shows the same hole.
      f.B('metal',0,3.35,-.32,.64,6.4,.64,0x526375);
      for(let u=-3;u<=3;u++)for(let y=-3;y<=3;y++){
        const r=u*u+y*y;if(r<5||r>11)continue;
        f.B('castEnamel',0,5.92+y*.48,1.48+u*.48,.96,.48,.48,0x665578);
        for(const hand of [-1,1])f.B('cyan',hand*.53,5.92+y*.48,1.48+u*.48,.12,.32,.32,0xd5a0db);
      }
      f.B('metal',0,6.24,.32,1.12,.64,1.92,0x58637a);
    }else if(kind==='garden'){
      for(const hand of [-1,1]){
        f.B('wood',hand*1.92,2.76,0,.64,5.12,.64,0x91856c);
        for(let k=0;k<4;k++){
          f.B('wood',hand*1.92,4.32+k*.32,.32+k*.64,.64,.64,1.28,0x9b937d);
          f.B('leaf',hand*1.52,5.12+k*.32,.32+k*.64,2.56,.96,1.28,0x8ba58e);
        }
      }
      f.B('trim',0,4.8,1.28,4.80,.32,.64,0x66867f);
    }else{
      for(const u of [-2.56,2.56]){
        f.B('titaniumSkin',u,2.28,-.64,.48,4.32,.48,0x587c74);
        for(let k=0;k<3;k++)f.B('ceramicShell',u,4.48+k*.32,k*.64,.64,.48,1.28,0xd0cfb4);
      }
      for(let k=0;k<3;k++)f.B('titaniumSkin',0,4.80+k*.32,k*.64,5.76,.32,.80,0x689084);
      f.B('lamp',0,4.53,0,3.84,.16,.32,0xefe6bc);
    }
    const posts=kind==='garden'?[-1.92,1.92]:kind==='school'?[-2.56,2.56]:[0];
    for(const u of posts)f.C(u,2.2,kind==='school'?-.64:kind==='repair'?-.32:0,.48,4.0,.48);
  }
  const selected=roads.filter(r=>names.has(r.id));
  for(const road of selected){
    const [[ax,az],[bx,bz]]=road.shape.points,dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx);
    const market=road.id.startsWith('soho'),pitch=market?11.52:14.72,span=pitch*(market?.88:.74);
    const perpendicular=roads.filter(r=>r!==road&&r.kind!=='elevated-walk').flatMap(r=>r.shape.points.slice(1).map((p,i)=>[r.shape.points[i],p,r.width/2]));
    for(let i=0,t=8.32;t<len-4.8;t+=pitch,i++){
      const side=i%4<2?1:-1,offset=side*(road.width*.5+1.30);
      const x=ax+dx*t/len+Math.sin(yaw)*offset,z=az+dz*t/len+Math.cos(yaw)*offset;
      const cross=perpendicular.some(([[a,b],[c,d],half])=>{
        const sx=c-a,sz=d-b,s2=sx*sx+sz*sz;
        if(!s2||Math.abs(dx*sz-dz*sx)<.45*len*Math.sqrt(s2))return false;
        const u=Math.max(0,Math.min(1,((x-a)*sx+(z-b)*sz)/s2));
        return Math.hypot(x-a-u*sx,z-b-u*sz)<half+span*.5+.40;
      });
      if(cross)continue;
      const f=frame(api,x,z,yaw+(side===1?Math.PI:0)),h=market?3.92:4.48;
      for(const u of [-span*.38,span*.38]){
        const [px,,pz]=f.P(u,0,-.72);
        if(protectedPoints.some(([ex,ez])=>Math.hypot(px-ex,pz-ez)<1.45))continue;
        f.B(market?'wood':'metal',u,h*.5,-.72,.32,h,.40,market?0xb38c6d:0x7c8e86);f.C(u,h*.5,-.72,.32,h,.40);
      }
      if(market)marketRoof(f,span,h);else ticketGallery(f,span,h);
    }
  }
}

export function marketRoof(f,w,base){
  // Back-to-back pitches form a market hall section. Upper clerestory gaps
  // keep the sawtooth distinct from the flat undersides of the factory bridges.
  const bays=Math.max(2,Math.round(w/4.16)),pitch=w/bays;
  for(let i=0;i<bays;i++){
    const u=(i+.5)*pitch-w/2;
    for(let k=0;k<4;k++){
      const xx=u-pitch*.375+k*pitch*.25,y=base+k*.32;
      f.B('castEnamel',xx,y,1.28,pitch*.25,.32,3.20,i%2?0xa76f58:0x7b6860);
      f.B('trim',xx,y-.02,2.94,pitch*.25,.28,.16,0xe4ba91);
    }
    f.B('metal',u,base-.24,1.24,pitch-.12,.24,3.36,0x796e61);
    f.B('lamp',u,base-.40,2.60,pitch*.65,.08,.24,0xffc688);
  }
}

export function ticketGallery(f,w,base){
  const bays=Math.max(2,Math.round(w/3.2)),pitch=w/bays;
  f.B('titaniumSkin',0,base+.20,1.04,w+.48,.72,2.40,0x657f76);
  f.B('trim',0,base+.54,2.18,w+.40,.16,.32,0xd7ba80);
  for(let j=0;j<bays;j++){
    const u=(j+.5)*pitch-w/2;
    f.B('wood',u,base-.55,1.42,pitch-.20,1.28,.32,0x937255);
    for(let k=0;k<3;k++){
      f.B('castEnamel',u+(k-1)*pitch*.28,base-.52,1.64,pitch*.245,.96,.16,0x56685f);
      f.B('lamp',u+(k-1)*pitch*.28,base-.61,1.74,pitch*.18,.19,.08,0xf5bf75);
    }
    f.B('metal',u-pitch*.48,base+.92,1.22,.16,2.08,.24,0x556662);
  }
}
