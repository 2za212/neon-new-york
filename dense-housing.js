// A pair of porous, rounded housing stacks assembled for 1/8 m voxel sampling.
// Openings are omissions in the shell, while cornices and window reveals are
// separately layered thin volumes. Rounded rear solids remove invisible internal surfaces
// while the street-facing openings retain real recessed depth.
export function buildDenseHousing(api) {
  const {box,roundedBox,cylinder,ellipsoid}=api;
  const step=.125;
  const snap=v=>Math.round(v/step)*step;
  function frame(cx,cz,front) {
    const nx=front==='east'?1:front==='west'?-1:0;
    const nz=front==='south'?1:front==='north'?-1:0;
    function point(u,v){return [cx+u*nz+v*nx,cz-u*nx+v*nz];}
    function add(u,y,v,w,h,d,kind='body',r=0) {
      const [x,z]=point(u,v);
      const wx=Math.abs(nz)*w+Math.abs(nx)*d,dz=Math.abs(nx)*w+Math.abs(nz)*d;
      if(r>0)roundedBox(snap(x),snap(y),snap(z),snap(wx),snap(h),snap(dz),r,kind);
      else box(snap(x),snap(y),snap(z),snap(wx),snap(h),snap(dz),kind);
    }
    return {add,point};
  }
  function footprint(add,u,y,v,w,h,d,r,kind='trim') {
    // Sampling the circle once per eighth metre produces real fine stair edges.
    add(u,y,v,w-2*r,h,d,kind);
    const count=Math.round(r/step);
    for(let j=0;j<count;j++) {
      const q=(j+.5)*step;
      const reach=d/2-r+Math.sqrt(Math.max(0,r*r-q*q));
      for(const hand of [-1,1])add(u+hand*(w/2-r+q),y,v,step,h,2*reach,kind);
    }
  }
  function cornerWalls(add,y,w,d,h,r,kind) {
    const count=7;
    for(const hand of [-1,1])for(const dir of [-1,1]) {
      for(let j=0;j<=count;j++) {
        const a=j*Math.PI/(2*count),u=hand*(w/2-r+r*Math.cos(a)),v=dir*(d/2-r+r*Math.sin(a));
        add(u,y+h/2,v,.375,h,.375,kind,.125);
      }
    }
  }
  function window(add,u,b,v,width,height,variant,open=false) {
    const sill=b+.625,head=sill+height;
    if(!open)add(u,sill+height/2,v-.375,width-.25,height,.125,'recess');
    for(const hand of [-1,1]) {
      add(u+hand*(width/2+.125),sill+height/2,v,.25,height+.5,.625,'body',.125);
      add(u+hand*(width/2+.3125),sill+height/2,v-.125,.125,height+.75,.25,'metal');
    }
    add(u,sill-.125,v+.125,width+.5,.25,.875,'trim',.125);
    add(u,head+.125,v+.1875,width+.75,.25,1.0,'trim',.125);
    if(!open) {
      add(u,sill+height/2,v-.25,.125,height,.25,'metal');
      if(variant%3===0)add(u,sill+height*.60,v-.25,width-.25,.125,.25,'metal');
    }
    // Three separated shading leaves read as depth, rather than painted stripes.
    for(let j=0;j<3;j++)add(u,head+.3125+j*.125,v+.1875+j*.125,width+.75,.125,.75,'metal');
  }
  function balcony(add,u,y,v,w,variant) {
    footprint(add,u,y,v,w,.25,1.5,.375,'metal');
    add(u,y+.8125,v+.6875,w-.25,.125,.125,'trim');
    for(let j=0;j<=Math.floor(w/.625);j++) {
      const x=u-w/2+.25+j*.625;
      add(x,y+.5,v+.6875,.125,.75,.125,'metal');
    }
    for(const side of [-1,1])add(u+side*(w/2-.125),y+.4375,v,.125,.625,1.375,'body');
    if(variant%3===0) {
      add(u-w*.30,y+.5,v-.25,.75,.75,.625,'metal',.125);
      for(let j=0;j<3;j++)add(u-w*.30,y+.3125+j*.1875,v+.125,.5,.125,.125,'recess');
    }
  }
  function room(cx,cz,b,w,d,h,front,variant,ground) {
    const f=frame(cx,cz,front),add=f.add;
    const wide=(front==='east'||front==='west')?d:w;
    const deep=(front==='east'||front==='west')?w:d;
    const r=.875,thick=.375;
    // A continuous rear carcass leaves a deep shop/window reveal at the front.
    add(0,b+(h+.25)/2,-.5,wide-1.0,h+.25,deep-1.75,'body',.5);
    footprint(add,0,b+.125,0,wide+.25,.25,deep+.25,r,'metal');
    footprint(add,0,b+h+.0625,0,wide+.5,.375,deep+.5,r+.125,'trim');
    add(0,b+h/2,-deep/2,wide-2*r,h,thick,'body',.125);
    for(const side of [-1,1])add(side*wide/2,b+h/2,0,thick,h,deep-2*r,'body',.125);
    cornerWalls(add,b,wide,deep,h,r,'body');
    const bays=Math.max(2,Math.floor((wide-2*r)/3.0)),span=(wide-2*r)/bays;
    for(let j=0;j<bays;j++) {
      const u=(j-(bays-1)/2)*span;
      const doorway=ground&&j===Math.floor(bays/2);
      // The front wall is assembled around separate openings.
      add(u,b+.25,deep/2,span-.125,.5,thick,'body');
      add(u,b+h-.375,deep/2,span-.125,.75,thick,'body');
      add(u-span/2,b+h/2,deep/2,.375,h,.5,'body',.125);
      if(doorway) {
        for(const hand of [-1,1])add(u+hand*.75,b+1.3125,deep/2+.125,.125,2.625,.5,'metal');
        add(u,b+2.6875,deep/2+.125,1.625,.125,.5,'metal');
      } else window(add,u,b,deep/2,span-.875,h-1.5,variant+j,false);
    }
    // Separated recessed apertures on the side walls give the inner rooms a second face.
    if(variant%2===0)for(const side of [-1,1]) {
      add(side*(wide/2+.125),b+h*.55,-deep*.14,.25,h*.45,1.625,'recess');
      for(let j=0;j<4;j++)add(side*(wide/2+.3125),b+h*.55-.625+j*.375,-deep*.14,.125,.125,1.625,'metal');
    }
    if(!ground&&variant%3!==1)balcony(add,0,b+.0625,deep/2+.75,Math.min(5.75,wide-1.0),variant);
    // Small return cornices and notches retain the silhouette around the visible corners.
    for(const side of [-1,1])for(let j=0;j<3;j++)add(side*(wide/2-.75+j*.125),b+h-.5+j*.125,deep/2-.75+j*.125,.5,.125,.5,'body');
  }
  function tank(x,y,z,r,len,axis='z',shell='metal') {
    cylinder(snap(x),snap(y+r+.5),snap(z),r,len,shell,axis);
    if(axis==='z') {
      for(const side of [-1,1])ellipsoid(snap(x),snap(y+r+.5),snap(z+side*len/2),r,r,r*.52,shell);
      for(const dz of [-len*.30,len*.30])box(snap(x),snap(y+.25),snap(z+dz),2*r+.5,.5,.625,'body');
      for(const side of [-1,1])for(let j=0;j<6;j++)box(snap(x+side*(r+.25)),snap(y+.5+j*.25),snap(z),.125,.125,1.25,'trim');
    } else {
      for(const side of [-1,1])ellipsoid(snap(x+side*len/2),snap(y+r+.5),snap(z),r*.52,r,r,shell);
      for(const dx of [-len*.30,len*.30])box(snap(x+dx),snap(y+.25),snap(z),.625,.5,2*r+.5,'body');
    }
    cylinder(snap(x),snap(y+2*r+.875),snap(z),.3125,.75,'trim','y');
  }
  function roofDuct(x,y,z,front) {
    const f=frame(x,z,front),add=f.add;
    for(let j=0;j<3;j++) {
      add(-1+j, y+.625,0,.875,1.25,1.375,'metal',.25);
      add(-1+j,y+1.3125,0,1.0,.125,1.5,'trim');
      for(let k=0;k<4;k++)add(-1+j,y+.3125+k*.25,.75,.625,.125,.125,'recess');
    }
    for(let j=0;j<7;j++)add(1.625,y+.125+j*.25,-.25+j*.125,.25,.25,.625,'metal',.125);
  }
  const stacks=[
    {x:-48.25,z:38.75,w:7.5,d:13.5,levels:4,base:0,h:3.75,front:'south',variant:0},
    {x:-40.125,z:38.5,w:6.75,d:12.75,levels:4,base:3.0,h:3.625,front:'south',variant:3},
    {x:-30.875,z:43.25,w:7.25,d:17.5,levels:4,base:0,h:3.625,front:'east',variant:5},
    {x:48.25,z:38.75,w:7.75,d:13.5,levels:5,base:0,h:3.75,front:'south',variant:1},
    {x:40.375,z:38.25,w:6.75,d:13.0,levels:5,base:3.0,h:3.75,front:'south',variant:4},
    {x:30.875,z:43.25,w:7.25,d:17.5,levels:5,base:0,h:3.75,front:'west',variant:7}
  ];
  for(const p of stacks) {
    // Each stack receives its own slightly different roof silhouette.
    for(let j=0;j<p.levels;j++) {
      const upper=j>=Math.ceil(p.levels/2),retreat=upper?(j-Math.ceil(p.levels/2)+1)*.375:0;
      const dx=p.front==='east'?-retreat:p.front==='west'?retreat:(j%2?-.25:.25),dz=j%2?.375:-.25;
      room(p.x+dx,p.z+dz,p.base+j*p.h,p.w-(upper?.375:0),p.d-(upper?retreat*.5:0),p.h-.25,p.front,p.variant+j,p.base===0&&j===0);
    }
    const top=p.base+p.levels*p.h;
    roofDuct(p.x,top,p.z-1.875,p.front);
    if(p.variant===0)tank(p.x,top+.125,p.z-1.125,.875,3.5,'z');
    if(p.variant===4)tank(p.x,top+.125,p.z-1.125,.75,3.0,'x');
    if(p.variant===5||p.variant===7){
      tank(p.x,top+.125,p.z+3.0,1.125,4.0,'z','trim');
      for(const dz of [-1.25,1.25]){
        cylinder(snap(p.x),snap(top+1.75),snap(p.z+3+dz),1.25,.125,'metal','z');
      }
      for(let j=0;j<3;j++){
        cylinder(snap(p.x-2.125+j*.375),snap(top+.5),snap(p.z+2),.125,6.0,'metal','z');
      }
      box(snap(p.x+1.75),snap(top+.375),snap(p.z-3),1.25,.5,3.5,'metal');
      for(let j=0;j<14;j++)box(snap(p.x+1.75),snap(top+.875),snap(p.z-4.5+j*.25),1.5,.75,.125,j%4?'metal':'trim');
    }
  }
  // The upper-level links cover an actual open passage rather than a filled podium.
  for(const side of [-1,1]) {
    const cx=side<0?-39.6:40.2;
    footprint(frame(cx,42.0,'south').add,0,3.0,0,20.25,.375,3.0,.625,'metal');
    for(const dx of [-9.0,8.25])for(const dz of [-.875,.875]) {
      box(snap(cx+dx),1.375,snap(42.0+dz),.375,2.75,.375,'body');
      box(snap(cx+dx),3.375,snap(42.0+dz),.75,.375,.75,'trim');
    }
    for(let j=0;j<15;j++) {
      const x=cx-9+j*1.25;
      box(snap(x),3.8125,43.5,.125,1.25,.125,'metal');
    }
    box(snap(cx),4.4375,43.5,19.0,.125,.125,'trim');
  }
  // Fine, round service pipes gather in one believable route at each rear shoulder.
  for(const side of [-1,1]) {
    const x=side<0?-44.0:44.0,z=32.875;
    for(let j=0;j<3;j++) {
      cylinder(snap(x+j*.5),5.75,z,.1875,11.5,'metal','y');
      cylinder(snap(x+j*.5),11.625,34.0,.1875,2.25,'metal','z');
      ellipsoid(snap(x+j*.5),11.5,z,.25,.25,.25,'metal');
      for(let k=0;k<8;k++)box(snap(x+j*.5),snap(1.0+k*1.375),z,.625,.125,.5,'trim');
    }
  }
  // Preserve and physically support the existing street signs at their old positions.
  for(const [x,y,z,hand] of [[-26.8125,11,45,1],[27.1875,11,45,-1]]) {
    for(const dy of [-2.0,2.0]) {
      box(x-hand*.375,y+dy,z,1.0,.25,2.0,'metal');
      box(x,y+dy,z,.25,.5,2.25,'trim');
    }
    for(const dz of [-1.125,1.125])box(x,11,z+dz,.25,4.5,.25,'metal');
  }
  // Short street-facing canopies end in a stepped, scalloped edge.
  for(const side of [-1,1]) {
    const f=frame(side<0?-30.875:30.875,48.0,side<0?'east':'west'),add=f.add;
    footprint(add,0,3.125,4.25,5.5,.25,2.5,.75,'metal');
    for(let j=0;j<9;j++)add(-2.5+j*.625,3.3125,5.5,.375,.125,.25,j%2?'trim':'metal');
  }
}
