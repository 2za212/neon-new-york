// The main silhouettes are built on a 0.6 m lattice. Offsets and missing modules
// remain visible from the full-city camera, before the small facade cubes resolve.
export function buildTowers({box}) {
  const unit=.6;
  const snap=value=>Math.round(value/unit)*unit;
  function block(x,bottom,z,w,h,d,kind='body',options={}) {
    const width=Math.max(unit,snap(w)),height=Math.max(unit,snap(h)),depth=Math.max(unit,snap(d));
    box(snap(x),snap(bottom)+height/2,snap(z),width,height,depth,kind,options);
  }
  function cutCornerMass(x,b,z,w,h,d,kind='body',solid=false) {
    const cut=Math.min(2.4,w*.2,d*.2);
    block(x,b,z,w-cut*2,h,d,kind,{solid});
    block(x,b,z,w,h,d-cut*2,kind,{solid});
  }
  function stud(x,b,z,size=1.2,kind='trim') {
    block(x,b,z,size,size,size,kind);
  }
  // A cavity is assembled from a backing, jambs, sill and lintel. Its opening
  // is two or three cells across, so occupancy meshing preserves actual depth.
  function habitat(x,b,z,w=3.6,h=3.6,d=3.0,side=1,kind='body') {
    const face=z+side*(d/2-.3),back=z-side*.6;
    block(x,b,back,w,h,d-1.2,kind);
    block(x,b+.6,face-side*.6,w-1.2,h-1.2,.6,'recess');
    for(const hand of [-1,1])block(x+hand*(w/2-.6),b,face,1.2,h,.6,kind);
    block(x,b,face,w,.6,.6,'metal');
    block(x,b+h-1.2,face,w,1.2,.6,kind);
    block(x,b+h,face-side*.6,w+.6,.6,d+.6,'trim');
  }
  function sideHabitat(x,b,z,w=3.0,h=3.6,d=3.6,side=1) {
    const face=x+side*(w/2-.3),back=x-side*.6;
    block(back,b,z,w-1.2,h,d,'body');
    block(face-side*.6,b+.6,z,.6,h-1.2,d-1.2,'recess');
    for(const hand of [-1,1])block(face,b,z+hand*(d/2-.6),.6,h,1.2,'body');
    block(face,b,z,.6,.6,d,'metal');
    block(face,b+h-1.2,z,.6,1.2,d,'body');
    block(face-side*.6,b+h,z,w+.6,.6,d+.6,'trim');
  }
  function machinery(x,b,z,w,d) {
    for(let j=0;j<2;j++)for(let k=0;k<3;k++) {
      const xx=x+(k-1)*w*.30,zz=z+(j-.5)*d*.54;
      block(xx,b,zz,w*.24,1.8,d*.39,'metal');
      block(xx,b+1.8,zz,w*.24+.6,.6,d*.39+.6,'trim');
      for(let f=0;f<3;f++)block(xx,b+.3+f*.6,zz+d*.21,w*.19,.6,.6,'recess');
    }
  }
  function pixelAntenna(x,b,z,height) {
    for(let j=0;j<height/unit;j++) {
      const size=j<4?1.8:j<10?1.2:.6;
      block(x,b+j*unit,z,size,.6,size,j%6===0?'trim':'metal');
    }
    for(let j=0;j<3;j++)block(x,b+height*.45+j*1.8,z,4.2-j*.6,.6,.6,'metal');
  }
  function blankVoxelSign(x,b,z,w,h,side=1) {
    block(x,b,z,w,h,1.8,'metal');
    block(x,b+.6,z+side*1.2,w-1.2,h-1.2,.6,'trim');
    // Square pixels deliberately break the outline into a descending stepped edge.
    for(let j=0;j<h/1.8;j++)stud(x-w/2-.6,b+j*1.8,z,1.2,'body');
  }

  // WEST TOWER. The mass bends towards the west in twelve deep setbacks.
  // Habitable pods project by different cell counts, leaving open terraces.
  const ax=-28.2,az=-27.0;
  for(let j=0;j<7;j++) {
    const inset=j<3?0:(j-2)*.6;
    cutCornerMass(ax-inset*.35,j*1.2,az,26.4-inset,1.2,28.8-inset,'base',j<3);
  }
  for(let level=0;level<17;level++) {
    const b=8.4+level*3.6,retreat=Math.floor(level/3)*1.2;
    const cx=ax-retreat,cz=az-Math.floor(level/4)*.6;
    const width=level<9?20.4:19.2-Math.floor((level-9)/2)*1.2;
    const depth=level<11?22.8:21.6-Math.floor((level-11)/2)*1.2;
    cutCornerMass(cx,b,cz,width,3.6,depth,level%5===0?'metal':'body',level===0);
    const bayCount=Math.floor((width-2.4)/4.2);
    for(let k=0;k<bayCount;k++) {
      const xx=cx+(k-(bayCount-1)/2)*4.2;
      for(const side of [-1,1]) {
        const omit=(level+2*k+(side===1?0:3))%8===0;
        if(omit) {
          block(xx,b,cz+side*(depth/2+1.2),3.6,.6,3.6,'metal',{walk:true});
          for(const hand of [-1,1])stud(xx+hand*1.2,b+.6,cz+side*(depth/2+2.4),.6,'trim');
          continue;
        }
        const projection=((level+k)%3)*.6;
        habitat(xx,b,cz+side*(depth/2+1.2+projection),3.6,3.0,3.0+projection,side);
      }
    }
    for(const side of [-1,1])for(let k=0;k<4;k++) {
      const zz=cz+(k-1.5)*4.8;
      if((k+level)%5===0)continue;
      sideHabitat(cx+side*(width/2+1.2),b,zz,3,3.0,3.6,side);
    }
    // Exposed cubical service rib, staggered independently of the room modules.
    for(let k=0;k<6;k++) {
      const dx=(k%3)*.6;
      block(cx+width/2+.6+dx,b+k*.6,cz-8.4,1.8,.6,3.0,'metal');
    }
  }
  // The blade crown is an axis-aligned stair silhouette, with a large notch
  // dividing its two prongs. The top reads as pixels even at overview scale.
  for(let j=0;j<18;j++) {
    const bottom=69.6+j*1.2,retreat=Math.floor(j/2)*.6;
    const cx=ax-6.0-retreat,cz=az-3.0;
    const width=Math.max(2.4,13.2-j*.6),depth=Math.max(3.6,14.4-j*.6);
    if(j<6)cutCornerMass(cx,bottom,cz,width,1.2,depth,j%3===0?'metal':'body');
    else {
      block(cx-width*.30,bottom,cz,width*.34,1.2,depth,'body');
      if(j<13)block(cx+width*.32,bottom,cz-1.2,width*.25,1.2,depth-2.4,'metal');
    }
  }
  pixelAntenna(ax-8.4,86.4,az-5.4,6.0);
  blankVoxelSign(ax+6.0,27.6,az+15.0,4.8,18.0,1);
  machinery(ax-1.8,8.4,az-8.4,9.0,5.4);
  // Cubical, right-angle supply pipes at the lower podium.
  for(let j=0;j<3;j++) {
    block(ax-11.4+j*1.2,3.6,az+12.6,.6,6.0,1.2,'metal');
    block(ax-8.4+j*.6,9.6,az+12.6,6.6-j*1.2,.6,1.2,'metal');
  }

  // EAST TOWER. A split stack of big housing cassettes wrapped around an open
  // central service slot. The bands climb alternately north and east.
  const bx=33.0,bz=-29.4;
  for(let j=0;j<5;j++)cutCornerMass(bx,j*1.2,bz,27.6-j*.6,1.2,28.8-j*.6,'base',j<3);
  for(let tier=0;tier<9;tier++) {
    const b=6+tier*5.4,shiftX=(tier%3-1)*1.2;
    const cx=bx+shiftX,cz=bz-Math.floor(tier/3)*1.2;
    const shrink=Math.max(0,tier-4)*1.2;
    const w=22.8-shrink,d=24.0-shrink;
    // Gap between shafts is visible through a run of three tiers.
    if(tier>=3&&tier<=6) {
      block(cx-w*.30,b,cz,w*.36,5.4,d,'body');
      block(cx+w*.30,b,cz,w*.36,5.4,d,'body');
      block(cx,b+4.8,cz,w,.6,d,'metal');
    } else cutCornerMass(cx,b,cz,w,5.4,d,'body',tier===0);
    for(const side of [-1,1])for(let k=0;k<5;k++) {
      const xx=cx+(k-2)*4.2;
      if(Math.abs(xx-cx)>w/2-1.2)continue;
      const offset=((k+tier)%4===0?1.8:.6);
      habitat(xx,b+.6,cz+side*(d/2+offset),3.6,3.6,3.0+offset,side,tier%2?'body':'metal');
      if((k+tier)%3===0) {
        block(xx,b+4.8,cz+side*(d/2+offset+1.2),4.2,.6,1.8,'trim',{walk:true});
        stud(xx-1.2,b+5.4,cz+side*(d/2+offset+1.2),.6,'metal');
        stud(xx+1.2,b+5.4,cz+side*(d/2+offset+1.2),.6,'metal');
      }
    }
    for(const side of [-1,1])for(let k=0;k<4;k++) {
      if((k+tier)%4===0)continue;
      sideHabitat(cx+side*(w/2+1.2),b+.6,cz+(k-1.5)*4.8,3.6,3.6,3.6,side);
    }
    // A shifted tooth on alternating corners makes the whole outline irregular.
    const sign=tier%2?1:-1;
    block(cx+sign*(w/2-.6),b+4.8,cz-d/2,3.6,1.2,3.0,'trim');
  }
  // Roof plant becomes a three-step digital crown instead of conventional HVAC.
  for(let j=0;j<7;j++) {
    block(bx+3.0+j*.6,54.6+j*1.2,bz-4.2,12.0-j*1.2,1.2,13.2-j*1.2,j%2?'metal':'body');
  }
  machinery(bx-4.8,55.2,bz+4.2,6.6,6.6);
  pixelAntenna(bx+5.4,63,bz-7.2,8.4);
  // Cubic service stack facing the avenue, with large gaps between flanges.
  for(let j=0;j<30;j++) {
    const z=bz-7.2+Math.floor(j/6)*.6;
    block(bx-12.0,7.2+j*1.8,z,2.4,1.2,2.4,j%3===0?'trim':'metal');
  }

  // The rear skyline uses stepped shoulders, split crowns and large facade voids.
  // Every stack has a different silhouette to avoid a repeated window-box city.
  const skyline=[
    [-60,-59,14.4,16.8,40.8,0],[-17.4,-60.0,12,13.2,48,1],
    [18,-60.6,12,13.2,39.6,2],[60,-57,15.6,18,54,1],
    [-71.4,-28.2,10.8,15.6,30,2],[71.4,-33,10.8,15.6,34.8,0]
  ];
  for(const [index,[x,z,width,depth,height,style]] of skyline.entries()) {
    cutCornerMass(x,0,z,width+1.2,3.6,depth+1.2,'base',true);
    const floors=Math.floor((height-3.6)/3.6);
    for(let j=0;j<floors;j++) {
      const b=3.6+j*3.6,tail=Math.max(0,j-floors*.48);
      const dx=(style===1?-1:1)*Math.floor(tail/2)*.6;
      const w=width-Math.floor(tail/2)*1.2,d=depth-Math.floor(tail/3)*1.2;
      cutCornerMass(x+dx,b,z,w,3.6,d,j%4===0?'metal':'body',j===0);
      const count=Math.floor(w/4.2);
      for(let k=0;k<count;k++)for(const side of [-1,1]) {
        if((k+j+index)%5===0)continue;
        habitat(x+dx+(k-(count-1)/2)*4.2,b,z+side*(d/2+.6),3.0,3.0,2.4,side);
      }
      for(const sign of [-1,1])block(x+dx+sign*w*.34,b,z-d/2,1.2,3.6,1.8,'metal');
    }
    for(let j=0;j<4;j++) {
      const w=Math.max(2.4,width-4.2-j*1.8);
      block(x+(style-1)*j*.6,height+j*1.2,z,w,1.2,depth-3.6-j*1.8,j%2?'metal':'body');
    }
    if(index%2===0)pixelAntenna(x-2.4,height+4.8,z-2.4,6.0);
  }
}

