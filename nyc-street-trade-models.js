import {mapPlan} from './nyc-map-plan.js';

// Projecting product models on the night shift's shop signs. Each is a
// physical cabinet with a socket and a shelf fixed to the existing sign.
const workshops=new Set(['repair','parts','partsBay','gridPower','charge','battery','winding','forge']);
const meals=new Set(['noodles','deli','cafe','streetMarket','dockMarket','grocery','provisions']);
const culture=new Set(['record','studio','books','textile','press','tailor']);
const trafficLanes=mapPlan.roads.filter(r=>['avenue','street','loop'].includes(r.kind))
  .flatMap(r=>r.shape.points.slice(1).map(([x,z],i)=>{
    const [ax,az]=r.shape.points[i],dx=x-ax,dz=z-az;
    return {ax,az,dx,dz,length2:dx*dx+dz*dz,edge:r.width/2,y:r.elevation};
  })).filter(s=>s.length2>0);

export function mountTradeModel(site,occupied,ground,solids,block){
  const type=workshops.has(site.id)?'coil':meals.has(site.id)?'food':culture.has(site.id)?'reel':null;
  if(!type||site.width<2.2||site.y<2.35||site.y>11||site.kind==='poster'||site.kind==='kiosk')return;
  const yaw=site.yaw,dx=Math.sin(yaw),dz=Math.cos(yaw);
  const scale=Math.min(1.44,Math.max(.85,site.width/4.2));
  const cx=site.x+dx*1.38*scale,cz=site.z+dz*1.38*scale;
  const bottom=site.y+site.height/2+.14,top=bottom+2.78*scale;
  if(occupied.some(p=>Math.hypot(cx-p[0],cz-p[1])<21))return;
  // Existing awnings, inhabited bridges and recessed shop bays determine
  // which tenants can actually hang a product out into the air.
  const radius=.80*scale;
  if(solids.some(b=>b.min.y<top&&b.max.y>bottom+.20&&b.max.x>cx-radius&&
    b.min.x<cx+radius&&b.max.z>cz-radius&&b.min.z<cz+radius))return;
  for(const x of [cx-radius,cx,cx+radius])for(const z of [cz-radius,cz,cz+radius])
    if(bottom-ground(x,z,top)<2.70)return;
  for(const lane of trafficLanes){
    if(bottom>lane.y+4.55)continue;
    const x=cx-lane.ax,z=cz-lane.az,t=Math.max(0,Math.min(1,(x*lane.dx+z*lane.dz)/lane.length2));
    if(Math.hypot(x-t*lane.dx,z-t*lane.dz)<lane.edge+radius)return;
  }
  occupied.push([cx,cz]);
  function piece(lit,ink,x,y,z,w,h,d){
    block(lit?'neon':'metal',ink,x*scale,site.height/2+.14+y*scale,z*scale,w*scale,h*scale,d*scale);
  }
  const iron=0x42535e,bronze=0xb78769,ivory=0xdfd8bc;
  for(const hand of [-1,1]){
    piece(false,iron,hand*.52,.08,.69,.20,.24,1.76);
    piece(false,bronze,hand*.52,.26,.13,.32,.48,.32);
  }
  const z=1.36;
  if(type==='food'){
    // A street steamer. Alternating courses step out around eight corners,
    // then back to the rim. Two hot buns sit above the bamboo baskets.
    for(let i=0;i<4;i++){
      const y=.35+.25*i,w=1.28+.18*i;
      for(const [v,span] of [[0,w],[.47,w-.42],[-.47,w-.42]]){
        piece(false,i%2?bronze:0xb06446,0,y,z+v,span,.26,.50);
        if(v)piece(true,i%2?0xff625b:0xffba68,0,y+.02,z+v+Math.sign(v)*.265,span*.80,.08,.12);
      }
    }
    for(const [hand,height] of [[-1,1],[1,.78]])for(let course=0;course<4;course++){
      const w=[.56,.72,.52,.28][course]*height;
      piece(true,course===3?0xffb371:0xffdfb4,hand*.39,1.23+course*.14*height,z+.06*hand,w,.16*height,w);
    }
    for(const hand of [-1,1])for(let i=0;i<6;i++)
      piece(false,bronze,hand*.15+i*.095,1.37+i*.19,z-.40,.14,.25,.16);
  }else if(type==='coil'){
    // An open maintenance yoke. Secondary windings turn the corners;
    // the removable turquoise core is suspended in the space between them.
    for(const hand of [-1,1]){
      for(let i=0;i<6;i++){
        const x=hand*(i===0||i===5?.57:.84),y=.38+i*.32;
        piece(false,iron,x,y,z,.48,.34,.80);
        piece(true,i%2?0xf0ae73:0xff7446,x,y,z+.44,.44,.14,.20);
        piece(true,0xcc7848,x+hand*.24,y,z,.12,.14,.68);
      }
      piece(false,bronze,hand*.39,2.11,z,.64,.32,.78);
    }
    for(let i=0;i<4;i++){
      const w=i===0||i===3?.32:.64;
      piece(true,i%2?0x78ede4:0x39b6cb,0,.72+i*.26,z,w,.18,w+.16);
    }
  }else{
    // A cassette manufacturer's open reel. Leave its two spindle holes
    // open to the night, with the magnetic ribbon passing underneath.
    for(const hand of [-1,1]){
      const x=hand*.54;
      for(let i=0;i<5;i++){
        const w=[.48,.80,.96,.80,.48][i],y=.90+i*.22;
        if(i===2)for(const edge of [-1,1])piece(true,0xf896bc,x+edge*.34,y,z,.24,.22,.72);
        else piece(true,i%2?0xd682b3:0xfdc1c0,x,y,z,w,.23,.72);
      }
      piece(false,iron,x,.53,z,.32,.64,.33);
    }
    piece(false,bronze,0,.47,z,1.82,.23,.74);
    piece(true,0x6cdad8,0,.57,z+.40,1.40,.10,.12);
  }
}
