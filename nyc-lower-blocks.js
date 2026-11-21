import {exchangeLane,lowerBlocks,lowerLanes,lotPoint,premises} from './nyc-lower-block-plan.js';

// The two added blocks have sloping lot boundaries. Slice only at corners so
// their asphalt ends exactly against the original district slabs.
function paveBlock(panel,points){
  const levels=[...new Set(points.map(p=>p[1]))].sort((a,b)=>a-b);
  for(let i=1;i<levels.length;i++){
    const low=levels[i-1],high=levels[i],mid=(low+high)/2;
    const sides=points.flatMap(([x,z],j)=>{
      const [xx,zz]=points[(j+1)%points.length];
      if(mid<=Math.min(z,zz)||mid>=Math.max(z,zz))return [];
      const at=v=>x+(xx-x)*(v-z)/(zz-z);
      return [{north:at(low),south:at(high),mid:at(mid)}];
    }).sort((a,b)=>a.mid-b.mid);
    const [l,r]=sides;
    panel('asphalt',[[l.north,.18,low],[l.south,.18,high],[r.south,.18,high],[r.north,.18,low]],0x859299);
  }
}
function paveLane(panel,road,level){
  const y=.20+level*.012;
  const pts=road.shape.points;
  const normals=pts.slice(1).map(([x,z],i)=>{
    const dx=x-pts[i][0],dz=z-pts[i][1],len=Math.hypot(dx,dz);
    return [-dz/len,dx/len];
  });
  const rails=pts.map(([x,z],i)=>{
    const a=normals[Math.max(0,i-1)],b=normals[Math.min(i,normals.length-1)];
    const k=1/(1+a[0]*b[0]+a[1]*b[1]);
    return offset=>[x+(a[0]+b[0])*k*offset,y,z+(a[1]+b[1])*k*offset];
  });
  const half=road.width/2;
  for(let i=1;i<rails.length;i++){
    const a=rails[i-1],b=rails[i];
    for(const [lo,hi,mat,tone] of [[-half-.28,-half,'trim',0x9ca29a],
      [-half,half,'paver',0x919790],[half,half+.28,'trim',0x9ca29a]]){
      panel(mat,[a(lo),a(hi),b(hi),b(lo)],tone);
    }
  }
}
const palette={
  freight:['titaniumSkin',0x7e969a,'coolWindow','#a0e9dc'],
  mill:['brickBrown',0xb18c75,'warmWindow','#ffa886'],
  home:['brick',0xa88b82,'warmWindow','#ffbb80'],
  food:['ceramicShell',0xb39578,'warmWindow','#ffac66'],
  office:['basaltShell',0x738894,'coolWindow','#9ee3ef'],
  clinic:['ceramicShell',0xadb9a8,'coolWindow','#9ae7bd'],
};
function buildPremise({box,collider,sign},site){
  const {width:w,depth:d,floors,yaw,use}=site, [wall,hue,glass,ink]=palette[use];
  const display={freight:'roomStock',mill:'roomCloth',home:'roomHome',food:'roomFood',clinic:'roomClinic',office:'roomOffice'}[use];
  const front=d/2,top=3.6+(floors-1)*2.88;
  function B(mat,u,y,v,w,h,d,tint){
    const [x,z]=lotPoint(site,u,v);box(mat,x,y,z,w,h,d,tint,yaw);
  }
  // Short collision strips follow the oblique party wall without blocking
  // the pedestrian lane with the empty corners of one enclosing AABB.
  function solid(mat,u,y,v,width,height,depth,tint){
    B(mat,u,y,v,width,height,depth,tint);
    const count=Math.ceil(width/1.2),step=width/count,c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));
    for(let i=0;i<count;i++){
      const [x,z]=lotPoint(site,u-width/2+step*(i+.5),v);
      collider(x,y,z,c*step+s*depth,height,s*step+c*depth);
    }
  }
  const loadingSetback=['west-ice','scale','warrant','repair'].includes(site.id)?1.28:0;
  solid(wall,0,1.87,-.64-loadingSetback/2,w,3.38,d-1.28-loadingSetback,hue);
  for(const side of [-1,1])solid(wall,side*(w/2-.32),1.87,front-.64,.64,3.38,1.28,hue);
  const upperH=top-3.52;
  solid(wall,0,3.52+upperH/2,-.16,w,upperH,d-.32,hue);
  B('metal',0,top+.13,-.16,w+.24,.26,d-.12,0x747d80);
  const signPos=lotPoint(site,0,front+.17);
  B('metal',0,3.17,front+.04,w-.32,.76,.28,0x384750);
  sign(signPos[0],3.19,signPos[1],Math.min(7.3,w-.65),.63,site.name,site.service,ink,yaw);
  B('metal',w*.27,1.42,front-1.25-loadingSetback,1.25,2.45,.14,0x42515a);
  B(display,-w*.19,1.72,front-1.23-loadingSetback,w*.46,1.54,.16,0xaebbb4);
  const bays=Math.max(2,Math.round(w/2.15));
  for(let level=1;level<floors;level++){
    const y=4.9+(level-1)*2.88;
    for(let i=0;i<bays;i++){
      const u=w*((i+.5)/bays-.5);
      B('metal',u,y,front-.27,w/bays*.77,1.83,.26,0x506066);
      B((level+i)%4===1?'glass':glass,u,y+.06,front-.11,w/bays*.57,1.36,.12,0xaebcb5);
    }
    if(use==='home'){
      const side=level%2?1:-1;
      B('metal',side*w*.20,y-.77,front+.23,w*.54,.32,.98,0x8d8b88);
      for(let i=0;i<4;i++)B('trim',side*w*.20+(i-1.5)*w*.14,y-.23,front+.63,.12,.88,.12,0xaa9c8d);
      B('trim',side*w*.20,y+.19,front+.63,w*.54,.14,.15,0xb6a693);
    }
  }
  // Different working sections give the premises different silhouettes.
  if(use==='freight'){
    for(const side of [-1,1]){
      B('metal',side*w*.24,top+.99,-.1,w*.34,1.72,d*.66,0x668082);
      for(let i=0;i<4;i++)B('trim',side*w*.24,top+.46+i*.32,d*.33,w*.28,.14,.28,0xb8c3ac);
    }
    B('trim',0,2.75,front+.25,w-.24,.32,1.10,0x9ba697);
  }else if(use==='mill'){
    for(let i=0;i<3;i++){
      B('metal',0,top+.32+i*.48,-d/2+(i+.5)*d/3,w-.48,.64+i*.96,d/3,0x777575);
      B('coolWindow',0,top+.50+i*.96,-d/2+(i+1)*d/3+.035,w-.90,.35,.09,0xaad1c7);
    }
  }else if(use==='food'){
    for(let i=0;i<3;i++)B('trim',0,2.80-i*.16,front+.15+i*.32,w-.40,.19,.36,0xc19065);
    for(let i=0;i<2;i++)B('metal',w*.27,top+.77+i*.96,-.56,.64+i*.32,1.06,.80+i*.16,0x817b7b);
  }else if(use==='clinic'){
    for(const [ww,hh] of [[.32,1.28],[1.28,.32]])B('cyan',-w*.30,top+.9,front-.28,ww,hh,.28,0x9bd1ac);
    B('trim',-w*.30,top+.96,front-.51,1.92,1.92,.24,0x526864);
  }else{
    B(wall,-w*.13,top+.9,-.42,w*.64,1.8,d*.68,hue);
    B('metal',-w*.13,top+1.9,-.42,w*.64+.22,.22,d*.68+.24,0x899599);
  }
}
export function buildLowerBlocks(api){
  for(const b of lowerBlocks)paveBlock(api.panel,b.points);
  for(const [i,road] of [...lowerLanes,exchangeLane].entries())paveLane(api.panel,road,i%2);
  for(const p of premises)buildPremise(api,p);
}
