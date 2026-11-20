import {coatStreetVehicle} from './nyc-wet-emitters.js';
import {coachwork,coatParkedBlockPaint} from './nyc-night-traffic-model.js';
import * as T from 'three';

// Mid-scale street occupation: parked traffic, loading bicycles and small
// groups of people. All vehicles are static real solids, never moving blockers.
export function addCityOccupation(scene,api){
  const {box,beam,materials,colliders,walkSurfaces,sign,sample,soho,eastPark}=api;
  const stats={boxes:0,beams:0,triangles:0,colliders:0,vehicles:0,vans:0,
    bicycles:0,signs:0,rejectedParking:0,independentDrawCalls:0};
  const B=(...a)=>{stats.boxes++;box(...a);},L=(...a)=>{stats.beams++;beam(...a);};
  const fixtures=[],vehicles=[],parkingRejected=[],signs=[];
  function material(key,source,opts){const m=materials[source].clone();Object.assign(m,opts);m.name='NYC occupied streets / '+key;m.userData={...m.userData};materials[key]=m;return key;}
  const zinc=material('trafficZinc','metal',{color:new T.Color('#c3cec6'),roughness:.55,metalness:.55});
  const alloy=material('trafficWheelAlloy','trim',{map:null,color:new T.Color('#c3bfab'),metalness:.32,roughness:.38});
  const glass=material('trafficGlazing','trim',{map:null,color:new T.Color('#618897'),roughness:.15,metalness:.14,transparent:true,opacity:.43,depthWrite:false});
  const paints=[['trafficBlue','#759aa8'],['trafficCream','#c7c1a9'],['trafficTeal','#69968a'],['trafficOchre','#bfa163'],['trafficBurgundy','#97696c']].map(([key,color])=>material(key,'taxi',{color:new T.Color(color),roughness:.33,metalness:.38}));
  for(const key of [...paints,zinc,glass])coatStreetVehicle(materials[key]);
  for(const key of paints)coatParkedBlockPaint(materials[key]);
  // A small procedural environment for coated traffic. Its upper hemisphere
  // carries dusk skylight, its lower walls carry broken shop and window bands.
  // All parked paint and glazing share the same six textures.
  const faces=Array.from({length:6},(_,face)=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const g=canvas.getContext('2d');
    g.fillStyle=face===3?'#282535':'#97aabe';g.fillRect(0,0,128,128);
    if(face===2||face===3)return canvas;
    for(let column=0,x=0;x<128;column++){
      const w=15+(column*13+face*3)%18, y=16+(column*19+face*7)%47;
      g.fillStyle=['#43495c','#343849','#50505d'][(column+face)%3];g.fillRect(x,y,w,128-y);
      for(let floor=y+4;floor<93;floor+=9)for(let bay=x+3;bay<x+w-3;bay+=6){
        g.fillStyle=(bay+floor)%5?'#677083':'#c3a180';g.fillRect(bay,floor,3,5);
      }
      g.fillStyle=(column+face)%3?'#a1b9be':'#db9974';g.fillRect(x+2,96,w-4,6);
      x+=w;
    }
    g.fillStyle='#393846';g.fillRect(0,104,128,24);return canvas;
  });
  const streetEnv=new T.CubeTexture(faces);
  streetEnv.colorSpace=T.SRGBColorSpace;streetEnv.needsUpdate=true;
  for(const key of [...paints,glass,zinc]){
    materials[key].envMap=streetEnv;materials[key].envMapIntensity=key===glass?1.15:.8;
  }
  function floorAt(x,z){let y=.18;for(const p of walkSurfaces)if(p.y<=.85&&x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ)y=Math.max(y,p.y);return y;}
  const protectedRuns=[];
  const protect=points=>{for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];protectedRuns.push([[a[0],a[2]],[b[0],b[2]]]);}};
  for(const p of Object.values(soho.paths))if(Array.isArray(p)&&Array.isArray(p[0])&&p[0].length===3)protect(p);
  protect(eastPark.paths.parkLoop);
  for(const id of ['pavilion','wetland','tram'])protect(eastPark.paths[id].waypoints);
  for(const e of [...sample.entries,...soho.entries]){const p=e.street;protect([[0,.18,p[2]],p,e.inside,e.deep]);}
  protect([[0,.18,22],[-5.8,.18,12.8]]);
  const crosses=[0,-64,-86,-118,-175,84,128,150];
  function around(x,y,z,w,h,d,id){const b=new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2));b.userData={cityOccupation:id};colliders.push(b);fixtures.push({id,min:b.min.toArray(),max:b.max.toArray()});stats.colliders++;return b;}
  function frame(x,z,rot){
    const c=Math.cos(rot),s=Math.sin(rot),P=(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c];
    const skin=(mat,style,u,y,v,w,h,d,tint=0xffffff)=>coachwork(null,style,tint,u,y,v,w,h,d,tint,(corners,shade)=>{
      api.panel(mat,corners.map(p=>P(...p)),shade);stats.triangles+=2;
    });
    return {P,skin,B:(m,u,y,v,w,h,d,col=0xffffff)=>B(m,...P(u,y,v),w,h,d,col,rot),L:(m,a,b,w=.04)=>L(m,P(...a),P(...b),w,w)};
  }
  const intersects=(a,b,pad=.10)=>a.min.x<b.max.x+pad&&a.max.x>b.min.x-pad&&a.min.z<b.max.z+pad&&a.max.z>b.min.z-pad&&a.min.y<b.max.y&&a.max.y>b.min.y;
  function parkingClear(x,z,w,d,rot){
    const c=Math.abs(Math.cos(rot)),s=Math.abs(Math.sin(rot)),ww=c*w+s*d,dd=s*w+c*d;
    const b=new T.Box3(new T.Vector3(x-ww/2,.28,z-dd/2),new T.Vector3(x+ww/2,2.85,z+dd/2));
    for(const [xx,zz]of [[x,z],[b.min.x,b.min.z],[b.max.x,b.max.z],[b.min.x,b.max.z],[b.max.x,b.min.z]])if(Math.abs(floorAt(xx,zz)-.18)>.025)return false;
    if(colliders.some(q=>q.max.y>.30&&q.min.y<2.85&&intersects(b,q,.15)))return false;
    // Protect the real entrance and continuous pedestrian polylines, including
    // the diagonal subway approach, instead of checking only the avenue axis.
    for(const [a,q]of protectedRuns){const n=Math.ceil(Math.hypot(q[0]-a[0],q[1]-a[1])/.28);for(let j=0;j<=n;j++){const t=n?j/n:0,xx=a[0]+(q[0]-a[0])*t,zz=a[1]+(q[1]-a[1])*t;if(xx>b.min.x-.65&&xx<b.max.x+.65&&zz>b.min.z-.65&&zz<b.max.z+.65)return false;}}
    return true;
  }
  function cabin(f, paint, width, van, estate) {
    const bottom=1.17, top=van?2.07:1.75;
    const sill=width/2-.085, roof=sill-(van?.115:.17);
    const front=van?1.95:1.18, back=van?.65:-1.38;
    const brow=van?1.31:.53, tail=van?.67:estate?-1.10:-.67;
    function pane(material,points,tint){
      api.panel(material,points.map(p=>f.P(...p)),tint);stats.triangles+=2;
    }
    // The cabin cavity is visible through the glass on both sides.
    f.B('rubber',0,1.19,(front+back)/2,width-.20,.055,front-back);
    const seatZ=van?.94:.10;
    for(const side of [-1,1]){
      f.B('rubber',side*.39,1.36,seatZ,.47,.36,.15,0xaca8aa);
      f.B('rubber',side*.39,1.58,seatZ-.015,.28,.16,.13,0xb5b8b6);
      if(!van)f.B('rubber',side*.39,1.45,-.82,.34,.24,.14);
    }
    f.B('rubber',0,1.28,front-.27,width-.37,.105,.33);
    // Octagonal steering rim follows the same facet scale as the wheel hubs.
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,next=angle+Math.PI/4;
      const wheel=a=>[-.39+.143*Math.cos(a),1.40+.132*Math.sin(a),front-.43-.042*Math.sin(a)];
      f.L('rubber',wheel(angle),wheel(next),.03);
    }
    const bottomRing=[[-sill,bottom,front],[sill,bottom,front],[sill,bottom,back],[-sill,bottom,back]];
    const topRing=[[-roof,top,brow],[roof,top,brow],[roof,top,tail],[-roof,top,tail]];
    for(let i=0;i<4;i++){
      const next=(i+1)%4;
      pane(glass,[bottomRing[i],bottomRing[next],topRing[next],topRing[i]],i%2?0xb3cccf:0xe2ecec);
      f.L(paint,bottomRing[i],topRing[i],.073);
      f.L(zinc,bottomRing[i],bottomRing[next],.032);
    }
    // Roof stamping uses an 8 cm step and a recessed upper roof module.
    const roofWidth=Math.round(2*roof/.08)*.08;
    const roofLength=Math.max(.32,Math.round((brow-tail+.06)/.08)*.08);
    f.B(paint,0,top+.04,(brow+tail)/2,roofWidth,.08,roofLength);
    f.B(paint,0,top+.12,(brow+tail)/2,roofWidth-.16,.08,roofLength-.16,0xcdd8dc);
    f.B('rubber',0,top-.013,(brow+tail)/2,2*roof-.03,.028,brow-tail);
    for(const side of [-1,1]){
      // A shallow pressed shoulder picks up a narrow highlight above the door.
      const z0=van?.69:-1.19,z1=van?1.70:1.12;
      const upper=[side*(width/2-.055),1.177], outer=[side*(width/2+.039),1.085];
      const strip=[[...outer,z0],[...outer,z1],[...upper,z1],[...upper,z0]];
      pane(paint,side>0?strip.reverse():strip,0xf0f3f5);
      const middle=van?.88:-.26;
      f.L('rubber',[side*sill,bottom,middle],[side*roof,top,middle-.06],.055);
      f.B(paint,side*(sill+.095),1.35,front-.31,.17,.09,.19);
    }
    // Bonnet bends down at the nose; its two facets catch separate light.
    const shoulder=width/2-.11, nose=van?2.40:2.00;
    const bonnetLength=(nose-front)/2;
    for(let tier=0;tier<2;tier++){
      f.skin(paint,'bonnet',0,1.12+tier*.08,nose-(tier+.5)*bonnetLength,
        Math.round(2*shoulder/.08)*.08+tier*.08,.16,bonnetLength, tier?0xf4f6f2:0xcad3d5);
    }
    for(const side of [-1,1])
      f.L('rubber',[side*.52,bottom+.033,front-.016],[side*.13,bottom+.075,front-.061],.022);
  }
  function vehicle(x,z,rot=0,van=false,index=0){
    const width=van?2.03:1.88,length=van?4.90:4.08,solidWidth=width+.36;
    if((Math.abs(x)<7&&crosses.some(q=>Math.abs(q-z)<10))||!parkingClear(x,z,solidWidth,length+.18,rot)){stats.rejectedParking++;parkingRejected.push({x,z,rot,van});return;}
    const f=frame(x,z,rot),paint=paints[index%paints.length],F=f.B;
    // This car now pulls out of its original SoHo bay. Keep the municipal
    // markings, and let the traffic simulation own its body and collision.
    if(x===-51&&z===113){markBay(F,length);return;}
    const shadeX=width*.64,shadeZ=length*.59;
    api.panel('trafficContact',[[-shadeX,shadeZ],[shadeX,shadeZ],[shadeX,-shadeZ],[-shadeX,-shadeZ]].map(([u,v])=>f.P(u,.197,v)));
    stats.triangles+=2;
    const half=length/2,axle=length*.31;
    F('rubber',0,.61,0,width-.46,.26,length-.38);
    f.skin(paint,'chassis',0,.98,0,width-.24,.42,length-.15);
    for(const end of [-1,1]){
      // Taper both bumpers at the corners, leaving a distinct front valance.
      f.skin(paint,'bonnet',0,.91,end*(half-.11),width-.40,.29,.24);
      F(zinc,0,.73,end*(half-.07),width-.47,.08,.16);
      for(const side of [-1,1]){
        const x=side*(width/2-.045),wheelZ=end*axle;
        for(let row=-3;row<=3;row++){
          const dy=row*.109;
          F('rubber',x,.575+dy,wheelZ,.20,.111,2*Math.sqrt(.383**2-dy**2));
        }
        for(let row=-2;row<=2;row++){
          const dy=row*.077;
          F(alloy,x+side*.108,.575+dy,wheelZ,.025,.079,2*Math.sqrt(.201**2-dy**2));
        }
        F('rubber',x+side*.125,.575,wheelZ,.015,.09,.09);
        for(let i=0;i<6;i++){
          const a=i*Math.PI/3;
          F('rubber',x+side*.13,.575+.127*Math.sin(a),wheelZ+.127*Math.cos(a),.014,.041,.045);
        }
        for(let band=-3;band<=3;band++){
          const offset=band*.124,lip=.575+Math.sqrt(.458**2-offset**2);
          const returnKey=(band===-2||band===1)?.08:0;
          F(paint,x-side*returnKey/2,(lip+1.20)/2,wheelZ+offset,.185-returnKey,1.20-lip,.124);
        }
        F(paint,x,.92,end*(axle+.53),.16,.46,.18);
        F(end>0?'coolWindow':'tailLight',side*(width*.34),1.015,end*(half+.015),.50,.075,.048);
        F(end>0?'lamp':'tailLight',side*(width*.433),.961,end*(half-.016),.115,.105,.08);
      }
    }
    F('rubber',0,.936,half+.014,.74,.19,.030);
    for(const height of [.89,.96])F(zinc,0,height,half+.035,.68,.018,.020);
    for(const side of [-1,1]){
      // Separate cast doors return into the B-pillar; both hinge edges and
      // the inside of the projecting sill remain visible from the kerb.
      const doorEnds=axle-.44;
      for(const hand of [-1,1]){
        f.skin(paint,'body',side*(width/2-.10),.91,hand*doorEnds/2,.32,.56,doorEnds);
      }
      F(zinc,side*width/2,.70,0,.032,.055,axle*2-.89);

    }
    if(van){
      // Parcel pod with a stepped shoulder, hinged rear doors and roof rails.
      for(const [y,w,h,d] of [[1.68,width-.045,.98,2.96],[2.26,width-.12,.18,2.88],[2.42,width-.24,.15,2.73]])
        f.skin(paint,'body',0,y,-.73,w,h,d);
      cabin(f,paint,width,true,false);
      for(const side of [-1,1]){
        F(zinc,side*.66,2.535,-.70,.075,.085,2.48);
        F('cyan',side*(width/2-.012),1.64,-.92,.026,.075,1.68);
        F(glass,side*.43,1.85,-2.222,.68,.43,.035);
        F(zinc,side*.13,1.44,-2.245,.16,.052,.04);
      }
      F('rubber',0,1.65,-2.225,.028,.92,.034);
      stats.vans++;
    }else{
      // Longer rear glass on the estate; the fastback roof falls away sooner.
      const estate=index%3===1;
      cabin(f,paint,width,false,estate);
      for(const side of [-1,1]){
        for(const v of [-.74,.26])F(zinc,side*(width/2+.044),1.105,v,.024,.035,.18);
        F('rubber',side*(width/2+.056),.95,-.21,.014,.39,.022);
        if(estate)F(zinc,side*.54,1.84,-.28,.055,.07,1.37);
      }
    }
    F('rubber',0,.86,-half-.029,.48,.14,.028);
    F('white',0,.86,-half-.049,.39,.092,.012,0xd6b882);
    const c=Math.abs(Math.cos(rot)),s=Math.abs(Math.sin(rot)),id='parked-'+stats.vehicles;
    const solid=around(x,van?1.465:1.13,z,c*solidWidth+s*(length+.18),van?2.39:1.70,s*solidWidth+c*(length+.18),id);
    // Parking bay ends, wheel stops and a broken curb side line anchor the car.
    markBay(F,length);
    vehicles.push({id,kind:van?'delivery-van':'compact-car',x,z,rotation:rot,min:solid.min.toArray(),max:solid.max.toArray()});stats.vehicles++;
  }
  function markBay(F,length){
    for(const v of [-length/2-.36,length/2+.36])F('white',0,.198,v,2.32,.012,.075,0x919d96);
    F('white',1.16,.198,0,.065,.012,length+.78,0x929f98);
  }
  // Staggered slots leave junctions and real shop crossings empty. Every
  // candidate is additionally checked against final district furniture.
  const slots=[
    [4.9,-42,0],[-4.9,-42,Math.PI],[4.9,-16,Math.PI],[-4.9,-53,0],
    [4.9,50,0],[-4.9,43,Math.PI],[4.9,58,Math.PI],[-4.9,60,0],[-4.9,69,0],[4.9,65,Math.PI],
    [4.9,134,0],[-4.9,130,Math.PI],[4.9,146,0],[-4.9,115,Math.PI],[4.9,138,Math.PI],[-4.9,138,0],
    [-32.9,-101,0],[-39.1,-104,Math.PI],[54.7,-74,Math.PI],[61.3,-75,0],
    [61.35,-145,0],[54.65,-145,Math.PI],[61.35,-101,0],[54.65,-103,Math.PI],
    [61.35,31,0],[54.65,37,Math.PI],[61.35,55,0],[54.65,61,Math.PI],
    [135.05,32,0],[128.95,43,Math.PI],[135.05,66,0],
    [-45.0,60,0],[-51,68,Math.PI],[-45,106,0],[-51,113,Math.PI],
    [72,3.95,Math.PI/2],[100,-4.65,-Math.PI/2],[-38,4.9,Math.PI/2],[-64,-4.65,-Math.PI/2],
    [4.9,24.8,Math.PI],[-4.9,-32,0],[-4.9,-63,Math.PI]
  ];
  for(let i=0;i<slots.length;i++)vehicle(...slots[i],i%6===0,i);

  function cargoBike(x,z,rot=0){
    const f=frame(x,z,rot),F=f.B;
    F(zinc,0,.43,0,.12,.15,2.15);
    for(const v of [-.78,.78]){
      for(let i=0;i<12;i++){const a=i*Math.PI/6,b=(i+1)*Math.PI/6;f.L('rubber',[0,.72+Math.sin(a)*.30,v+Math.cos(a)*.30],[0,.72+Math.sin(b)*.30,v+Math.cos(b)*.30],.055);}
      f.L(zinc,[0,.72,v],[0,.98,v*.5],.032);
    }
    f.L(zinc,[0,.73,-.78],[0,1.15,-.1],.045);f.L(zinc,[0,1.15,-.1],[0,.73,.78],.045);f.L(zinc,[0,1.15,-.1],[0,1.17,.63],.038);
    F('rubber',0,1.20,-.13,.26,.08,.31);F(zinc,0,1.28,.72,.65,.045,.06);
    F(paints[2],0,1.02,-.68,.62,.53,.64);F('districtPaper',0,1.04,-1.01,.34,.25,.016);
    const c=Math.abs(Math.cos(rot)),s=Math.abs(Math.sin(rot));around(x,.87,z,c*.68+s*2.25,1.24,s*.68+c*2.25,'cargo-bike-'+stats.bicycles);stats.bicycles++;
  }
  // Bikes hug known wall/planting pockets rather than occupying a sidewalk row.
  for(const [x,z,rot]of [[-9.9,45.1,0],[9.9,-43.4,0],[-10.0,102.5,0],[10.0,118.4,0],[-42.0,140.6,Math.PI/2],[126.8,57.0,0]]){
    const c=Math.abs(Math.cos(rot)),s=Math.abs(Math.sin(rot)),b=new T.Box3(new T.Vector3(x-(c*.68+s*2.25)/2,.42,z-(s*.68+c*2.25)/2),new T.Vector3(x+(c*.68+s*2.25)/2,1.49,z+(s*.68+c*2.25)/2));
    if(!colliders.some(q=>q.max.y>.44&&q.min.y<1.50&&intersects(b,q,.08)))cargoBike(x,z,rot);
  }
  const crowdPaths=[
    {id:'exchange_stop_reader',a:[-4.35,-123.72],level:.36,look:3,phone:true,heading:Math.PI},
    {id:'exchange_stop_passenger',a:[-6.92,-123.30],level:.36,look:0,heading:.28},
    {id:'exchange_stop_approach',a:[-7.5,-126.6],b:[-3.0,-126.6],level:.385,look:2,speed:.66},
    {id:'hudson_receiving_clerk',a:[-108.7,-7.64],level:.36,look:1,phone:true,dockCrew:true,heading:.2},
    {id:'hudson_dock_runner',a:[-115.5,-8.18],b:[-110.2,-8.18],level:.36,look:2,dockCrew:true,carryParcel:true,speed:.64},
    {id:'density_core_reader',a:[-9.2,36.8],level:.36,look:2,phone:true,heading:1.4},
    {id:'density_core_customer',a:[9.1,37.6],level:.36,look:0,heading:-1.4},
    {id:'density_mercer_queue',a:[8.6,60.0],level:.36,look:1,heading:1.5},
    {id:'density_mercer_friend',a:[8.5,61.2],level:.36,look:3,phone:true,heading:2.2},
    {id:'density_market_customer',a:[-36.4,69.2],level:.36,look:2,heading:Math.PI},
    {id:'density_market_friend',a:[-32.5,69.2],level:.36,look:0,heading:Math.PI},
    {id:'density_books_browser',a:[-8.5,102.0],level:.36,look:3,phone:true,heading:-1.5},
    {id:'density_park_couple_a',a:[90.8,49.4],level:.36,look:1,heading:.5},
    {id:'density_park_couple_b',a:[92.0,49.5],level:.36,look:2,phone:true,heading:-.5},
    {id:'density_park_umbrella',a:[122.3,55.0],level:.36,look:0,umbrella:true,heading:Math.PI},
    {id:'density_midtown_pair_a',a:[19.2,-132],level:.36,look:2,heading:.8},
    {id:'density_midtown_pair_b',a:[20.4,-132.2],level:.36,look:3,phone:true,heading:-.8},
    {id:'density_west_dockwalker',a:[-130,16],b:[-130,30],level:.36,look:1,speed:.57},
    {id:'density_north_commuter',a:[65.2,-146],b:[65.2,-134],level:.36,look:0,speed:.73},
  ];
  stats.triangles+=(stats.boxes+stats.beams)*12;stats.requestedPeople=crowdPaths.length;
  function setNight(night){for(const m of signs)m.material.emissiveIntensity=night?.8:.3;}
  return{stats,fixtures,vehicles,parkingRejected,crowdPaths,setNight};
}
