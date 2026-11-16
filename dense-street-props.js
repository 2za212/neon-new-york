// Small foreground props for the 1/8 metre city. The quiet dark shells keep
// the housing silhouette visible above the street rather than blocking it.
export function buildDenseStreetProps({box,roundedBox,cylinder,ellipsoid}) {
  const step=.125,snap=v=>Math.round(v/step)*step;
  function add(x,y,z,w,h,d,kind='metal',radius=0) {
    if(radius)roundedBox(snap(x),snap(y),snap(z),snap(w),snap(h),snap(d),radius,kind);
    else box(snap(x),snap(y),snap(z),snap(w),snap(h),snap(d),kind);
  }
  function booth(x,z,hand) {
    // Separate posts, counter, back and slatted upper screen leave the kiosk open.
    add(x,.1875,z,2.5,.375,2.0,'metal',.125);
    add(x,.875,z-.75,2.375,1.0,.25,'metal');
    for(const u of [-1,1])for(const v of [-1,1]) {
      add(x+u*1.0625,1.4375,z+v*.8125,.125,2.625,.125,'metal');
      add(x+u*1.0625,.5,z+v*.8125,.25,.25,.25,'trim');
    }
    add(x,2.625,z,2.75,.375,2.25,'metal',.1875);
    add(x,2.875,z-.125,2.25,.125,1.75,'metal');
    // A small stepped awning and a framed service opening project toward pedestrians.
    for(let j=0;j<3;j++)add(x,2.5-j*.125,z+.875+j*.25,2.5,.125,.375,'metal');
    add(x,.9375,z+.9375,2.125,.125,.5,'metal');
    add(x,1.4375,z-.5625,1.875,.75,.125,'recess');
    for(const hand of [-1,1])add(x+hand*.9375,1.4375,z-.4375,.125,.875,.25,'trim');
    add(x,1.875,z-.4375,2.0,.125,.25,'trim');
    add(x,1.0,z-.4375,2.0,.125,.25,'metal');
    for(let j=0;j<7;j++)add(x-.75+j*.25,1.5625,z-.375,.125,.5,.125,'metal');
    // Partly raised roller screen uses fine layers, not one solid shutter slab.
    for(let j=0;j<5;j++)add(x,2.0625+j*.125,z+.6875,2.0,.125,.125,j%2?'metal':'recess');
    add(x+hand*.8125,1.1875,z+.625,.5,.375,.375,'metal',.125);
    add(x+hand*.8125,1.4375,z+.625,.375,.125,.25,'recess');
    add(x-hand*.8125,1.125,z+.625,.375,.25,.25,'body');
    // A rear curved cable and a small cylindrical service canister break the box outline.
    cylinder(snap(x-hand*1.0625),.875,snap(z-.875),.1875,1.25,'metal','y');
    ellipsoid(snap(x-hand*1.0625),1.5,snap(z-.875),.1875,.125,.1875,'metal');
  }
  booth(-16.25,43.25,1);booth(16.25,45.625,-1);

  function wheel(x,y,z,hand) {
    cylinder(snap(x),snap(y),snap(z),.375,.25,'recess','x');
    cylinder(snap(x+hand*.1875),snap(y),snap(z),.25,.125,'metal','x');
    cylinder(snap(x+hand*.3125),snap(y),snap(z),.125,.125,'trim','x');
  }
  function deliveryVan(x,z,variant) {
    // Thin chassis, a compact cylindrical wheel profile and separated body masses.
    add(x,.5,z,1.75,.25,4.125,'metal',.125);
    add(x,.8125,z-.5,1.75,.375,3.0,'metal',.125);
    add(x,1.4375,z-.75,1.875,1.25,2.625,'metal',.3125);
    // Recessed cargo rear, raised seam bars and protection corners.
    add(x,1.375,z-2.125,1.375,.875,.125,'recess');
    for(const u of [-1,1])add(x+u*.75,1.375,z-2.1875,.125,1.125,.125,'metal');
    for(let j=0;j<6;j++)add(x,1.0+j*.125,z-2.1875,1.25,.125,.125,'metal');
    add(x,1.375,z-2.25,.125,.75,.125,'trim');
    add(x,2.125,z-.75,1.5,.125,2.0,'metal',.0625);
    // A stepped round-nose cab is only two metres high, preserving street sightlines.
    add(x,1.1875,z+1.0,1.875,.875,1.375,'metal',.25);
    add(x,1.625,z+.5,1.75,.75,1.125,'metal',.25);
    add(x,2.0,z+.375,1.5,.25,1.0,'metal',.125);
    for(let j=0;j<4;j++) {
      add(x,1.375+j*.125,z+1.5-j*.125,1.625-j*.125,.125,.25,'metal');
    }
    add(x,1.625,z+1.0,1.25,.375,.125,'recess');
    add(x,1.625,z+1.0625,.125,.375,.125,'metal');
    for(const u of [-1,1]) {
      add(x+u*.875,1.5625,z+.5,.125,.5,.625,'recess');
      add(x+u*.875,1.3125,z+.5,.125,.125,.875,'metal');
      add(x+u*.9375,1.25,z+.75,.125,.125,.25,'trim');
      add(x+u*1.0625,1.5,z+.875,.25,.25,.25,'metal',.125);
      for(const v of [-1.375,1.25])wheel(x+u*.9375,.375,z+v,u);
      // Raised strips and small attachment blocks stay visibly one voxel thick.
      add(x+u*.9375,1.375,z-.875,.125,.125,1.75,'body');
      for(const v of [-1.875,.25])add(x+u*.8125,1.6875,z+v,.25,.375,.25,'metal');
      add(x+u*.625,.875,z+1.75,.375,.125,.125,'trim');
    }
    add(x,.625,z+1.9375,1.75,.25,.25,'metal',.125);
    add(x,.625,z-2.125,1.75,.25,.25,'metal',.125);
    // A thin top rack is open between its bars.
    for(const u of [-1,1])add(x+u*.5,2.3125,z-.875,.125,.125,1.75,'metal');
    for(let j=0;j<4;j++)add(x,2.3125,z-1.625+j*.5,1.125,.125,.125,'metal');
    if(variant===1)add(x-.625,2.25,z-1.375,.375,.25,.5,'metal',.125);
  }
  deliveryVan(-16.75,57.625,0);deliveryVan(17.375,57.625,1);

  function crate(x,z,height,variant) {
    const w=.75,d=.875;
    // A dark small core sits within a separate protective frame and corner blocks.
    add(x,height/2,z,w-.125,height-.125,d-.125,'metal',.125);
    for(const u of [-1,1])for(const v of [-1,1]) {
      add(x+u*w/2,height/2,z+v*d/2,.125,height,.125,'body');
      add(x+u*w/2,height-.0625,z+v*d/2,.25,.125,.25,'metal');
      add(x+u*w/2,.0625,z+v*d/2,.25,.125,.25,'metal');
    }
    for(const v of [-1,1]) {
      add(x,height*.55,z+v*(d/2+.0625),.375,.125,.125,'recess');
      for(const u of [-1,1])add(x+u*.25,height*.55,z+v*(d/2+.0625),.125,.25,.125,'metal');
    }
    for(const u of [-1,1])add(x+u*w/2,height-.0625,z,.125,.125,d,'metal');
    for(let j=0;j<3;j++)add(x-.25+j*.25,height+.0625,z,.125,.125,d-.125,'metal');
    if(variant===2)add(x,height+.1875,z,.375,.125,.5,'body');
  }
  for(const side of [-1,1]) {
    // The left cluster is nudged outboard of the default (-22,56.5) inspection pose.
    for(let i=0;i<5;i++) {
      const x=side*(23.375+(i%2)*1.125),z=55.25+Math.floor(i/2)*1.25;
      crate(x,z,i===4?.875:.625,i%3);
    }
  }
}
