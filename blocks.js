export function buildBlocks({box,excludeFront=false}) {
  // The housing is assembled on the same 0.6 m lattice as the final voxel shell.
  const unit=.6;
  const snap=v=>Math.round(v/unit)*unit;
  function place(x,y,z,w,h,d,kind='body',options={}) {
    const left=snap(x-w/2),bottom=snap(y-h/2),back=snap(z-d/2);
    const width=Math.max(unit,snap(w)),high=Math.max(unit,snap(h)),deep=Math.max(unit,snap(d));
    box(left+width/2,bottom+high/2,back+deep/2,width,high,deep,kind,options);
  }
  function on(cx,cz) {
    return (x,y,z,w,h,d,kind='body',options={})=>place(cx+x,y,cz+z,w,h,d,kind,options);
  }
  function window(add,x,y,z,w=2.4,h=1.8) {
    // A sunken slab and four block reveals create a recess with actual depth.
    add(x,y,z-.6,w,h,.6,'recess');
    for(const hand of [-1,1])add(x+hand*(w/2+.3),y,z,.6,h+1.2,1.2,'body');
    for(const sign of [-1,1])add(x,y+sign*(h/2+.3),z,w,.6,1.2,'trim');
    add(x,y,z-.15,.6,h,.6,'metal');
  }
  function room(add,x,y,z,w,d,variant=0,ground=false) {
    const height=3.6;
    // Three connected cubic masses leave a stepped notch on the outer corner.
    add(x,y+height/2,z,w-1.2,height,d,'body',{solid:ground});
    add(x-w/2+.6,y+height/2,z-.6,1.2,height,d-1.2,'body',{solid:ground});
    add(x+w/2-.6,y+height/2,z+.6,1.2,height,d-1.2,'body',{solid:ground});
    add(x,y+height+.3,z,w+.6,.6,d+.6,'trim');
    const front=z+d/2;
    window(add,x-.3,y+1.8,front+.6,w>5?3:2.4);
    if(variant%3===0) {
      // A thick stair-step side buttress makes the cubical construction readable.
      for(let j=0;j<3;j++)add(x+w/2+.3+j*.3,y+.6+j*.6,z, .6,1.2+j*1.2,d*.48,'metal');
    }
    if(variant%2===1) {
      const v=front+1.2;
      add(x,y+.3,v,w+1.2,.6,2.4,'metal');
      add(x,y+1.2,v+1.2,w+1.2,1.2,.6,'body');
      for(const side of [-1,1])add(x+side*(w/2+.3),y+1.2,v,.6,1.2,2.4,'body');
      // Alternate omitted parapet cells form a pixelated balcony silhouette.
      for(let k=0;k<Math.round(w/1.2);k++)if(k%2===0)add(x-w/2+.6+k*1.2,y+2.1,v+1.2,.6,.6,.6,'trim');
    }
    if(variant%4===0) {
      add(x+w*.3,y+1.2,front+1.2,1.8,1.8,1.2,'metal');
      for(let j=0;j<2;j++)add(x+w*.3,y+.9+j*.6,front+2.1,1.2,.6,.6,'recess');
    }
  }
  function tank(add,x,y,z) {
    add(x,y+.6,z,3.6,1.2,3.6,'metal');
    add(x,y+2.1,z,3.0,1.8,3.6,'body');
    add(x,y+3.3,z,2.4,.6,2.4,'body');
    add(x,y+3.9,z,1.2,.6,1.2,'trim');
    add(x+2.4,y+1.2,z,1.2,2.4,1.2,'metal');
    add(x+1.8,y+2.1,z,1.8,.6,1.2,'metal');
  }
  function sign(add,x,y,z,side=1) {
    add(x,y,z,1.8,9.0,2.4,'metal');
    add(x+side*1.2,y,z,.6,7.8,1.2,'trim');
    for(const hand of [-1,1])add(x-side*1.2,y+hand*3.0,z,2.4,.6,.6,'metal');
    add(x+side*.6,y+4.8,z,1.2,.6,1.8,'body');
  }
  function staircase(add,x,z,y,height,side=1) {
    const n=Math.round(height/unit);
    for(let j=0;j<n;j++)add(x+side*j*.6,y+(j+.5)*.6,z,1.2,.6,1.8,'metal');
    for(const edge of [-1,1])for(let j=0;j<n;j++)if(j%2===0)add(x+side*j*.6,y+(j+.5)*.6+1.2,z+edge*.9,.6,1.2,.6,'trim');
  }
  function quarter(cx,cz,kind) {
    const add=on(cx,cz),east=cx>0,mid=kind==='mid';
    const inner=east?-1:1;
    // Ground modules do not fill the internal lanes, leaving narrow service alleys.
    const cols=mid?[-9,-3,3,9]:[-9,-3,3,9];
    const rows=mid?[-3,3]:[-6,0,6];
    for(let row=0;row<rows.length;row++)for(let col=0;col<cols.length;col++) {
      if((row===0&&col===2)||(!mid&&row===1&&col===1))continue;
      room(add,cols[col],0,rows[row],5.4,mid?4.8:5.4,row*3+col,true);
    }
    const levels=mid?(east?6:5):(east?5:4);
    for(let floor=1;floor<=levels;floor++) {
      const y=floor*4.2;
      for(let col=0;col<cols.length;col++) {
        const notch=((floor+col+(east?1:0))%5===0);
        if(notch&&floor>1)continue;
        // Shifted cubes form cantilevers, terraces and irregular vertical streets.
        const off=((floor+col)%3-1)*.6;
        const retreat=Math.max(0,floor-3)*.6;
        const z=(mid?2.4:4.8)-retreat+(col%2?-.6:.6);
        const depth=mid?4.8:6.0;
        room(add,cols[col]+off,y,z,5.4+(col%2?.6:0),depth,floor+col,false);
      }
      if(floor<levels) {
        const rowZ=mid?-3.0:-4.8;
        const count=mid?3:4;
        for(let col=0;col<count;col++) {
          if((col+floor)%4===1)continue;
          const x=cols[col]+(floor%2?.6:0);
          room(add,x,y,rowZ-floor*.3,5.4,4.8,floor+col+1,false);
        }
      }
      // A visible central gallery joins the stacked rooms across their staggered joints.
      if(floor%2===0) {
        add(0,y+.3,mid?5.4:8.4,23.4,.6,1.2,'metal');
        add(0,y+1.5,mid?6.0:9.0,22.8,.6,.6,'trim');
        for(let j=0;j<10;j++)add(-10.8+j*2.4,y+.9,mid?6.0:9.0,.6,1.2,.6,'metal');
      }
    }
    // Roof rooms form interrupted teeth rather than one continuous top slab.
    const topY=(levels+1)*4.2;
    for(const [u,depth] of [[-6,4.8],[6,3.6]]) {
      add(u,topY-1.2,-1.2,4.2,2.4,depth,'metal');
      add(u,topY+.3,-1.2,3.0,.6,depth-1.2,'body');
      for(let j=0;j<3;j++)add(u-1.2+j*1.2,topY+.3,-1.2,.6,.6,depth-1.2,'trim');
    }
    tank(add,-7.2,(levels-1)*4.2+3.6,-3.6);
    // Broad stepped pipe bundles remain visible after uniform voxel conversion.
    const pipeX=inner*11.4;
    for(let k=0;k<2;k++) {
      const px=pipeX-inner*k*1.2;
      add(px,levels*2.1,mid?-4.8:-7.2,.6,levels*4.2,.6,'metal');
      add(px-inner*1.2,levels*4.2+.3,mid?-4.8:-7.2,3.0,.6,.6,'metal');
      add(px-inner*2.4,levels*4.2-.6,mid?-4.8:-7.2,.6,1.8,.6,'metal');
    }
    sign(add,inner*12.0,Math.min(14.4,levels*2.7),mid?-.6:2.4,inner);
    add(-3,3.6,mid?7.2:10.2,10.2,1.2,1.8,'metal');
    add(-3,3.6,mid?8.4:11.4,9.0,.6,.6,'trim');
    if(!mid)staircase(add,-11.4,5.4,0,4.2,1);
  }

  if(!excludeFront){quarter(-39.6,42.6,'low');quarter(40.2,42.6,'low');}
  quarter(-51,7.2,'mid');
  quarter(49.2,7.2,'mid');

  function kiosk(x,z) {
    const add=on(x,z);
    add(0,1.2,0,3.6,2.4,2.4,'body',{solid:true});
    add(0,2.7,0,4.8,.6,3.6,'metal');
    add(0,3.3,-.6,3.6,.6,2.4,'trim');
    add(-.3,1.5,1.5,2.4,1.2,.6,'recess');
    add(0,.9,2.1,3.6,.6,1.2,'metal');
    add(1.2,3.9,-.6,1.2,.6,1.2,'metal');
  }
  if(!excludeFront){kiosk(-16.2,43.2);kiosk(16.2,45.6);}

  function voxelVan(x,z) {
    const add=on(x,z);
    add(0,.6,0,3.0,1.2,6.0,'metal',{solid:true});
    add(0,1.8,-.6,3.0,1.2,4.8,'body',{solid:true});
    add(0,3.0,-1.2,2.4,1.2,3.6,'body');
    add(0,3.9,-1.2,1.8,.6,2.4,'metal');
    add(0,2.1,1.5,2.4,.6,.6,'recess');
    add(0,2.7,.9,1.8,.6,.6,'recess');
    for(const side of [-1,1])for(const dz of [-1.8,1.8]) {
      add(side*1.5,.6,dz,.6,1.2,1.2,'recess');
      add(side*1.5,.6,dz,.6,.6,.6,'trim');
    }
    for(const side of [-1,1])add(side*.9,1.2,2.7,.6,.6,.6,'trim');
  }
  if(!excludeFront){voxelVan(-16.8,57.6);voxelVan(17.4,57.6);}
  for(const side of [-1,1]) {
    for(let i=0;i<5;i++)place(side*11.4,.6,32.4+i*5.4,.6,1.2,.6,'metal',{solid:true});
    if(!excludeFront)for(let i=0;i<5;i++) {
      const x=side*(22.2+(i%2)*1.8),z=55.2+Math.floor(i/2)*1.8;
      place(x,.6,z,1.2,1.2,1.2,i%2?'metal':'body',{solid:true});
      if(i%3===1)place(x,1.8,z,1.2,1.2,1.2,'trim');
    }
  }
}

