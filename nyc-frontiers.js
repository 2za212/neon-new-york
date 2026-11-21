import * as T from 'three';
import {mapPlan} from './nyc-map-plan.js';

/** Visible fences only at real street mouths on the current district outline. */
export function addDistrictFrontiers(scene,{box,beam,materials,colliders,sign}) {
  const stats={exits:0,boxes:0,beams:0,colliders:0,signs:0,independentDrawCalls:0,triangles:0};
  const before=colliders.length;
  const B=(...a)=>{stats.boxes++;box(...a);};
  const L=(...a)=>{stats.beams++;beam(...a);};
  function barrier(x,z,width,rot=0,title='',subtitle='') {
    stats.exits++;
    const c=Math.cos(rot),s=Math.sin(rot),P=(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c];
    const F=(mat,u,y,v,w,h,d,col=0xffffff)=>B(mat,...P(u,y,v),w,h,d,col,rot);
    const line=(mat,a,b,size=.045,col=0xffffff)=>L(mat,P(...a),P(...b),size,size,col);
    // Jersey-foot blocks and orange rails read as a grounded construction site.
    // The mesh above them has the same 2.22m top as the continuous collision.
    F('metal',0,.66,0,width,.17,.13,0x879b96);
    F('metal',0,2.17,0,width,.075,.075,0x8faaa3);
    F('metal',0,1.39,0,width,.055,.055,0x7f9a94);
    F('harborRust' in materials?'harborRust':'metal',0,1.02,.10,width,.20,.09,0xba9569);
    F('white',0,1.01,.156,width,.06,.02,0xc5bd9e);
    const bays=Math.max(2,Math.ceil(width/2.1)),step=width/bays;
    for(let i=0;i<=bays;i++) {
      const u=-width/2+i*step;
      F('metal',u,1.21,0,.09,2.02,.09,0xa2b2a5);
      F('stone',u,.49,0,.62,.42,.72,0x929b8c);
      F('metal',u,.73,0,.38,.08,.44,0x7f958a);
      if(i<bays){
        const mid=u+step/2;
        // Open wire mesh remains readable at the edge, rather than a solid wall.
        for(let k=0;k<5;k++)F('metal',mid,.91+k*.245,0,step-.06,.017,.017,0x778f8b);
        for(let v=.27;v<step;v+=.29)F('metal',u+v,1.47,0,.017,1.23,.017,0x778f8b);
        // A restrained slanted hazard marker on each rail bay.
        line('rubber',[mid-.23,.92,.177],[mid+.08,1.12,.177],.075,0x7e8271);
        line('metal',[u+.08,.77,-.03],[u+step-.08,2.13,-.03],.018,0x8b9e98);
      }
    }
    // One amber warning beacon at each end, far enough apart to stay understated.
    for(const e of [-1,1]){
      const u=e*(width/2-.28);
      F('metal',u,2.27,0,.16,.18,.16,0x83998d);
      F('lamp',u,2.43,0,.20,.17,.20,0x9d9c75);
    }
    const depth=.76,height=2.10,y=1.17;
    const w=Math.abs(c)*width+Math.abs(s)*depth,d=Math.abs(s)*width+Math.abs(c)*depth;
    colliders.push(new T.Box3(new T.Vector3(x-w/2,y-height/2,z-d/2),new T.Vector3(x+w/2,y+height/2,z+d/2)));
    if(title&&sign){
      // Signs face the open district. They are attached to the real fence rails.
      const p=P(0,1.71,.16);sign(...p,Math.min(6.3,width-1),.75,title,subtitle,'#d8bd87',rot);
      stats.signs++;
    }
  }
  // Only terminal streets get barriers. Both service lanes now join the old freight and cloth wards.
  for(const exit of mapPlan.frontierExits) {
    barrier(exit.position[0],exit.position[1],exit.width,exit.rotation||0,exit.title||'',exit.subtitle||'');
  }
  stats.colliders=colliders.length-before;
  stats.triangles=(stats.boxes+stats.beams)*12;
  stats.signScope='Injected fence signs are counted by parent signMeshes, not an extra frontier draw-call total.';
  return {stats,exits:mapPlan.frontierExits};
}
