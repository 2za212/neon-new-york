import {buildTowers} from './towers.js';

// These are full three-dimensional source parts. The city baker turns their
// contours, curved elbows and thin reveals into the same 0.125 m solid lattice.
export function buildDenseTowerDetails(api) {
  const unit=.125,q=v=>Math.round(v/unit)*unit;
  let calls=0;
  const source=[];
  buildTowers({box(x,y,z,w,h,d){
    source.push({min:[x-w/2,y-h/2,z-d/2].map(q),max:[x+w/2,y+h/2,z+d/2].map(q)});
  }});
  function box(x,y,z,w,h,d,kind='metal'){
    calls++;api.box(q(x),q(y),q(z),Math.max(unit,q(w)),Math.max(unit,q(h)),Math.max(unit,q(d)),kind);
  }
  function roundBox(x,y,z,w,h,d,r=.25,kind='metal'){
    calls++;api.roundedBox(q(x),q(y),q(z),q(w),q(h),q(d),Math.max(unit,q(r)),kind);
  }
  function cylinder(x,y,z,r,h,kind='metal',axis='y'){
    calls++;api.cylinder(q(x),q(y),q(z),Math.max(unit,q(r)),Math.max(unit,q(h)),kind,axis);
  }
  function ellipsoid(x,y,z,rx,ry,rz,kind='body'){
    calls++;api.ellipsoid(q(x),q(y),q(z),q(rx),q(ry),q(rz),kind);
  }
  function sideFace(side,y,z){
    let plane=side<0?-Infinity:Infinity;
    for(const b of source){
      if(y<b.min[1]||y>=b.max[1]||z<b.min[2]||z>=b.max[2])continue;
      if(side<0&&b.max[0]<-9)plane=Math.max(plane,b.max[0]);
      if(side>0&&b.min[0]>9)plane=Math.min(plane,b.min[0]);
    }
    return Number.isFinite(plane)?plane:null;
  }
  // A strapped bundle follows a vertical facade. Elbows are dense chains of
  // overlapping ellipsoids, producing real voxel stair-stepping at the curve.
  function elbow(x,y,z,radius,tubeR,kind,turn=1){
    const count=Math.ceil(radius*Math.PI/.25);
    for(let j=0;j<=count;j++){
      const a=j/count*Math.PI/2;
      ellipsoid(x,y+radius*Math.sin(a),z+turn*radius*(1-Math.cos(a)),tubeR,tubeR,tubeR,kind);
    }
  }
  function strappedBundle(side,zCenter,start,top,pipes=3){
    const x=side<0?-14.25:16.25,out=-side;
    for(let i=0;i<pipes;i++){
      const z=zCenter+(i-(pipes-1)/2)*1.0,r=i===1?.375:.25;
      cylinder(x,(start+top)/2,z,r,top-start,i===1?'body':'metal');
      cylinder(x,start+.125,z,r+.125,.25,'trim');
      cylinder(x,top-.125,z,r+.125,.25,'trim');
      for(let y=start+1;y<top-.5;y+=2.5){
        cylinder(x,y,z,r+.125,.375,'metal');
        box(x+out*(r+.125),y,z,.25,.625,.625,'trim');
      }
      const radius=1.25+i*.25;
      elbow(x,top,z,radius,r,'metal',1);
      cylinder(x,top+radius,z+radius+1.5,r,3,'metal','z');
      cylinder(x,top+radius,z+radius+2.875,r+.125,.375,'trim','z');
    }
    for(let y=start+.625;y<top-.5;y+=3.75){
      const face=sideFace(side,y,zCenter);
      if(face===null)continue;
      // The buried end of each mounting bracket meets the original facade.
      box((x+face)/2,y,zCenter,Math.abs(x-face)+.25,.375,pipes+1.0,'metal');
      box(face,y,zCenter,.25,1.0,pipes+1.25,'body');
      for(const dz of [-pipes*.5,pipes*.5])box(x,y,zCenter+dz,.625,.625,.375,'trim');
    }
  }
  strappedBundle(-1,-29.5,4.25,27.25,2);
  strappedBundle(1,-23.0,5.0,24.75,2);

  // Deep frames repeat at selected floors as groups, while missing modules and
  // the large advertising face remain open. Each hood has six separate fins.
  function frontFrame(x,y,z,w=3.5,h=3.0,variant=0){
    for(const side of [-1,1]){
      roundBox(x+side*(w/2+.125),y,z,.375,h+.5,.625,.125,'metal');
      roundBox(x,y+side*(h/2+.125),z,w+.5,.375,.625,.125,'body');
      box(x+side*(w/2+.375),y-.625,z-.125,.25,.625,.375,'trim');
    }
    for(let i=0;i<7;i++){
      const xx=x-w/2+.25+i*(w-.5)/6;
      box(xx,y+h/2+.5,z+.25,.25,.25,1.375,'metal');
      box(xx,y+h/2+.625,z+.625,.25,.125,.625,'trim');
    }
    // A second smaller reveal sits behind the outer assembly and casts a
    // narrow contact shadow instead of relying on a drawn grid line.
    for(const side of [-1,1]){
      box(x+side*.75,y-.25,z+.375,.125,1.75,.25,'trim');
      box(x,y-.25+side*.875,z+.375,1.625,.125,.25,'trim');
    }
    if(variant%2===0){
      roundBox(x+w/2+.625,y-.5,z-.25,.625,1.0,.75,.125,'body');
      for(let k=0;k<5;k++)box(x+w/2+1.0,y-.875+k*.1875,z-.25,.125,.125,.625,'recess');
    }
  }
  for(let level=0;level<8;level++){
    if(level!==0&&level!==3&&level!==6)continue;
    const b=8.4+level*3.6,cx=-28.2-Math.floor(level/3)*1.2,cz=-27-Math.floor(level/4)*.6;
    const width=20.4,depth=22.8,bays=Math.floor((width-2.4)/4.2);
    for(let k=0;k<bays;k++){
      if((level+2*k)%8===0)continue;
      const x=cx+(k-(bays-1)/2)*4.2,projection=((level+k)%3)*.6;
      if(b+3>27&&x>-26.5&&x<-18)continue;
      const moduleZ=cz+depth/2+1.2+projection,face=moduleZ+(3+projection)/2-.3;
      const z=q(Math.round(face/.6)*.6+.3)+.25;
      frontFrame(x,b+1.5,z,3.5,2.75,level+k);
    }
  }
  for(let tier=0;tier<5;tier++){
    if(tier!==0&&tier!==3)continue;
    const b=6+tier*5.4,cx=33+(tier%3-1)*1.2,cz=-29.4-Math.floor(tier/3)*1.2;
    for(const k of [0,2,4]){
      const x=cx+(k-2)*4.2,offset=(k+tier)%4===0?1.8:.6;
      const z=cz+12+offset+(3+offset)/2;
      frontFrame(x,b+2.5,z,3.25,3.25,k+tier);
    }
  }

  // Side cooling galleries are asymmetrical machines, not flat facade patches.
  // Curved end caps, open grilles and closely spaced heat-exchanger fins all
  // change the building outline at street, middle and roof camera heights.
  function coolingGallery(side,y,z,width=4.0,height=2.5,depth=1.25){
    const face=sideFace(side,y,z);if(face===null)return;
    const out=-side,x=face+out*(depth/2-.125);
    roundBox(x,y,z,depth,height,width,.375,'metal');
    const front=x+out*depth/2;
    for(const dz of [-1,1]){
      cylinder(x,y,z+dz*(width/2-.25),.3125,height-.5,'body');
      box(front,y,z+dz*(width/2-.25),.25,height+.25,.375,'trim');
    }
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){
      const yy=y+(row-.5)*(height*.40),zz=z+(col-1)*(width*.26);
      // Rounded fan shrouds retain a dark recessed cavity and a cross grille.
      cylinder(front+out*.125,yy,zz,.4375,.25,'recess','x');
      for(const hand of [-1,1]){
        box(front+out*.3125,yy+hand*.375,zz,.25,.125,.875,'body');
        box(front+out*.3125,yy,zz+hand*.375,.25,.875,.125,'body');
      }
      box(front+out*.375,yy,zz,.25,.25,.75,'metal');
      box(front+out*.375,yy,zz,.25,.75,.25,'metal');
      cylinder(front+out*.4375,yy,zz,.125,.25,'trim','x');
    }
    // Dense vertical fins form the underhung heat-exchanger cage.
    for(let i=0;i<Math.round(width/.25);i++){
      const zz=z-width/2+.125+i*.25;
      box(x+out*.25,y-height/2-.4375,zz,depth+.625,.625,.125,'metal');
      box(x,y+height/2+.125,zz,depth+.375,.25,.125,'trim');
    }
    for(const dz of [-1,1]){
      box(face,y-height/2-.625,z+dz*(width*.37),.375,.5,.5,'body');
      box((face+x)/2,y-height/2-.625,z+dz*(width*.37),depth+.625,.25,.375,'metal');
    }
  }
  for(const [side,y,z,w,h,d] of [
    [-1,5.25,-18.5,4.25,2.75,1.75],[-1,13.75,-20.0,4.5,2.5,1.5],
    [-1,30.0,-22.25,3.75,2.25,1.5],
    [1,5.5,-39,4.0,2.75,1.625],
    [1,29.0,-18,3.75,2.25,1.5]
  ])coolingGallery(side,y,z,w,h,d);

  // Layered ledges have short diagonal knee braces built from small steps.
  for(const [side,y,z,length] of [[-1,12.0,-36.5,7.0],[-1,25.25,-19.0,6.0],[1,18.0,-42.0,7.5],[1,28.5,-28.0,7.0]]){
    const face=sideFace(side,y,z);if(face===null)continue;
    const out=-side;
    for(let layer=0;layer<4;layer++)box(face+out*(.375+layer*.125),y+layer*.25,z,.75+layer*.25,.125,length+.25*layer,'metal');
    for(const dz of [-length*.38,0,length*.38]){
      for(let j=0;j<12;j++)box(face+out*(.125+j*.125),y-1.5+j*.125,z+dz,.25,.25,.375,j%4===0?'trim':'body');
    }
  }

  // Roof machinery is made from broad curved shells wrapped by separate arched
  // ribs. The old blade/spire silhouettes and the advertising mast stay clear.
  function shellMachine(x,y,z,w,h,d,side=1){
    roundBox(x,y,z,w,h,d,.75,'metal');
    ellipsoid(x,y+h*.25,z,w*.51,h*.72,d*.51,'body');
    box(x,y-h*.55,z,w+.75,.5,d+.75,'metal');
    for(let rib=0;rib<5;rib++){
      const zz=z-d*.46+rib*d*.23;
      for(let k=0;k<=24;k++){
        const a=k/24*Math.PI;
        const xx=x+Math.cos(a)*(w*.53),yy=y+h*.25+Math.sin(a)*(h*.75);
        ellipsoid(xx,yy,zz,.125,.125,.1875,'trim');
      }
    }
    const end=z+side*(d/2+.25);
    for(let row=0;row<3;row++)for(let col=0;col<4;col++){
      const xx=x+(col-1.5)*w*.20,yy=y+(row-1)*h*.23;
      roundBox(xx,yy,end,w*.16,.375,.5,.125,'recess');
      box(xx,yy+.25,end+side*.25,w*.18,.125,.375,'metal');
    }
    for(let col=0;col<4;col++){
      const xx=x+(col-1.5)*w*.25;
      cylinder(xx,y+h*.1,z-d/2-1.125,.25,2.0,'metal','z');
      elbow(xx,y+h*.1,z-d/2-2.125,.75,.25,'metal',-1);
    }
  }
  shellMachine(-35.0,68.0,-35.25,6.0,2.5,6.0,-1);
  shellMachine(32.75,56.0,-29.5,5.5,2.75,6.0,1);

  // Source accounting lets the baker report the contribution independently.
  return {sourceCalls:calls,unit};
}


