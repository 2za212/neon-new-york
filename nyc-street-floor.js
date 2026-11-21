// All pieces share the city's static tile batches. The ground and navigation
// remain owned by the original street. Local +Z follows its centreline.
function fixture(box, x, y, z, yaw) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return (material, u, bottom, v, width, height, depth, color, turn = 0) =>
    box(material, x + u*c + v*s, y + bottom + height/2, z - u*s + v*c,
      width, height, depth, color, yaw + turn, null, true);
}

function accessCover(b, service) {
  // Five contiguous casting courses give the lid a stepped round silhouette.
  const rows = [.58, .88, 1.04, .88, .58];
  rows.forEach((w, i) => {
    const v = (i-2)*.20;
    b('metal', 0, 0, v, w, .024, .20, 0x779399);
    b('metal', 0, .024, v, w-.11, .012, i===0||i===4?.14:.20, 0x455860);
  });
  for (const side of [-1,1]) {
    b('trim', side*.25,.036,0,.072,.013,.46,0x98a8a4);
    b('rubber', side*.35,.036,0,.08,.014,.16,0x65716b);
  }
  b('trim',0,.036,0,.24,.012,.095,service?0xdd9b54:0x85a5a4);
}

function curbGrate(b) {
  b('metal',0,0,0,.48,.025,1.08,0x829699);
  b('rubber',0,.025,0,.37,.013,.96,0x373f44);
  for (let i=-2;i<=2;i++) b('metal',0,.038,i*.18,.38,.018,.064,0x9ca9a7);
}

function tiedBag(b,u,v,size) {
  b('lifeBag',u,0,v,size*.82,size*.16,size*.76,0x9caaa2);
  b('lifeBag',u,size*.16,v,size,size*.45,size*.94,0xd2dacf);
  b('lifeBag',u-.03,size*.61,v,size*.73,size*.22,size*.67,0xb5c6bf);
  b('trim',u,size*.83,v,size*.23,.041,size*.24,0xada98a);
  b('lifeBag',u+.025,size*.83+.041,v,size*.30,.09,size*.22,0xabbbb2);
}

function carton(b,u,v) {
  b('lifePaper',u,0,v,.60,.33,.41,0xe1bd8b);
  b('lifePaper',u-.17,.33,v,.27,.054,.43,0xf5dbaf);
  b('lifePaper',u+.18,.33,v+.025,.24,.028,.39,0xc9996e);
  b('trim',u+.11,.08,v+.210,.18,.105,.014,0xdbd1a7);
}

function remnants(b, kind, variant) {
  if (kind==='freight') {
    carton(b,-.12,.10);
    b('lifePaper',.18,0,-.40,.54,.052,.38,0xd8b08c,.13);
    b('rubber',.15,.052,-.40,.056,.023,.37,0x91abab,.13);
  } else if (kind==='market') {
    tiedBag(b,-.14,.12,.55);
    if (variant%2) tiedBag(b,.18,-.21,.32);
    else b('trim',.19,0,-.25,.27,.046,.19,0xcfac84,.25);
  } else if (kind==='textile') {
    b('lifePaper',-.05,0,.08,.62,.11,.39,0xd0b487,-.1);
    b('lifeCanvas',-.10,.11,.09,.50,.115,.29,0xd79ab7,-.1);
    b('trim',-.09,.225,.09,.08,.018,.29,0xb5aba0,-.1);
    b('lifeCanvas',.18,0,-.36,.26,.037,.17,0x9faed2,.23);
  } else {
    // Folded flyer and a discarded drink carton, sparse by public entrances.
    b('trim',-.12,0,.16,.28,.022,.18,0xd3c8b1,.19);
    b('trim',-.12,.022,.16,.15,.012,.065,0x77949b,.19);
    b('trim',.15,0,-.10,.12,.17,.12,0xb98264);
    b('trim',.15,.17,-.10,.12,.027,.12,0xdfd2b9);
  }
}

function roadSegments(road) {
  const points=road.shape.points;
  let length=0;
  return points.slice(1).map(([x,z],i)=>{
    const [ox,oz]=points[i],dx=x-ox,dz=z-oz,len=Math.hypot(dx,dz);
    const start=length;
    length+=len;
    return {x:ox,z:oz,dx:dx/len,dz:dz/len,len,start,end:length};
  }).filter(s=>s.len>0);
}

export function buildStreetFloor({roads,box,ground,colliders,isPlayable,entrances}) {
  const stats={covers:0,grates:0,remnants:0,streets:0};
  const streets=roads.filter(r=>r.shape.type==='polyline'&&r.kind!=='elevated-walk')
    .map(road=>({road,segments:roadSegments(road)})).filter(r=>r.segments.length);
  const obstacles=colliders.filter(b=>b.min.y<1.06&&b.max.y>.25);
  const occupied=[];
  for (const {road,segments} of streets) {
    const length=segments.at(-1).end;
    let count=0;
    const seed=Array.from(road.id).reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,0);
    function floor(x,z) {
      const base=ground(x,z,.9);
      if (road.batchId!=='lower-blocks'&&road.id!=='exchange-school-lane') return base;
      const onSetts=segments.some(s=>{
        const a=Math.max(0,Math.min(s.len,(x-s.x)*s.dx+(z-s.z)*s.dz));
        return Math.hypot(x-s.x-a*s.dx,z-s.z-a*s.dz)<=road.width/2+.28;
      });
      return onSetts?Math.max(base,road.id.endsWith('-cut')?.212:.20):base;
    }
    function place(at,offset,radius,edge,draw) {
      const s=segments.find(seg=>at<=seg.end);
      if (!s) return false;
      const along=at-s.start,x=s.x+s.dx*along+s.dz*offset,z=s.z+s.dz*along-s.dx*offset;
      const y=floor(x,z);
      if (!isPlayable(x,z,radius)||ground(x,z,.9)<0||entrances.some(([a,b])=>Math.hypot(a-x,b-z)<1.35+radius)) return false;
      if (occupied.some(([a,b,r])=>Math.hypot(a-x,b-z)<radius+r+.20)) return false;
      if (obstacles.some(b=>b.min.y<y+.70&&b.max.y>y+.08&&x+radius>b.min.x&&x-radius<b.max.x&&z+radius>b.min.z&&z-radius<b.max.z)) return false;
      if ([[radius,0],[-radius,0],[0,radius],[0,-radius]].some(([u,v])=>Math.abs(floor(x+u,z+v)-y)>.034)) return false;
      // Keep side piles and gutter slots out of crossing roads at junctions.
      if (edge&&streets.some(other=>other.road!==road&&other.segments.some(t=>{
        const a=Math.max(0,Math.min(t.len,(x-t.x)*t.dx+(z-t.z)*t.dz));
        return Math.hypot(x-t.x-a*t.dx,z-t.z-a*t.dz)<other.road.width/2+.36;
      }))) return false;
      draw(fixture(box,x,y+.008,z,Math.atan2(s.dx,s.dz)));
      occupied.push([x,z,radius]);count++;
      return true;
    }
    for(let at=road.id==='weigh-road'?9:6+seed%12;at<length-2;at+=30+seed%11)
      if(place(at,Math.min(1,road.width*.16),.53,false,b=>accessCover(b,seed%2))) stats.covers++;
    const type=road.batchId==='batch-5'||road.batchId==='school'||road.id.startsWith('bell')||road.id.startsWith('east-')?'civic':
      /weigh|west-|hudson/.test(road.id)?'freight':/cloth/.test(road.id)?'textile':'market';
    for(let at=4+seed%7,i=0;at<length-1;at+=18+seed%9,i++) {
      const side=(seed+i)%2?1:-1;
      if(place(at,side*(road.width/2-.58),.54,true,curbGrate)) stats.grates++;
      const litterAt=at+3, bothSides=[-side,side];
      // Deliveries and swept waste accumulate at the street edge. Sparse on
      // civic streets; an occupied doorway or a curb step shifts the cluster.
      if(type==='civic'&&i%2) continue;
      if(bothSides.some(sign=>[.82,.40,-.57].some(inset=>
        place(litterAt,sign*(road.width/2+inset),.51,true,b=>remnants(b,type,i+seed))))) stats.remnants++;
    }
    if(count) stats.streets++;
  }
  return stats;
}
