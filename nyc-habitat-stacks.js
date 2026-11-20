// Local +Z looks into the street. Each wing has its own depth, ribbon window
// and load-bearing edge. Recesses and roof terraces are real empty space.
const shell='ceramicShell', alloy='titaniumSkin', core='basaltShell';
const bodyTones=[0xf4d6a3,0xdbebe7,0xe3c3ae,0xc3dfd5];
const sillTones=[0xd2bfa4,0xadccc9,0xd59b75,0xc5d3bf];

// These leases are the *front of the occupied floor*, measured from the
// shopfront. Shops, the stair slot and the rear court retain their own line.
function residentialReach(site,y,level,leading,bookshop){
  if(!site||bookshop&&y<13)return 0;
  const [x,z]=site;
  const avenue=Math.abs(x)<14,market=z>52;
  // Opposite sides of a street have different acquisition histories. One
  // bank steps into the street as the opposite bank drops back a storey.
  const phase=Math.floor(Math.abs(avenue?z:x)/11)+((avenue?x:z)>0?1:0);
  const tier=(level+(x<0?2:0)+phase)%5;
  let reach=leading?(tier===0?3.84:tier<4?5.76:4.48):(tier<2?3.84:2.56);
  if(y<6.40)reach=Math.min(reach,leading?2.56:1.28);
  if(!avenue)reach-=.64;
  if(market&&avenue&&x>0&&x<9)reach-=1.28;
  if(market&&x>0&&Math.abs(z-70.3)<1)reach-=1.28;
  return Math.max(.64,reach);
}

export function buildHabitatStack({box,bond=box,solid,width,depth,bottom,top,pitch,seed,glass,bookshop=false,streetSite}){
  const levels=Math.round((top-bottom)/pitch);
  const rise=(top-bottom)/levels,hand=seed%2?1:-1,kind=seed%3;
  const colour=bodyTones[seed%4],sill=sillTones[seed%4];
  const rear=-depth;
  // Join the two wings at the lift core. The remaining frontage splits at a
  // 0.64–1.28m vertical slot; one wing can cantilever past its neighbour.
  const split=hand*width*.085;
  for(let i=0;i<levels;i++){
    const y=bottom+i*rise,cap=i===levels-1;
    const terrace=kind===0&&i>=levels-2?1.28:kind===1&&cap?1.92:0;
    for(const side of [-1,1]){
      const leading=side===hand;
      const outerInset=(cap&&leading?.64:0)+(kind===0&&i>levels*.5&&!leading?.32:0);
      const slot=cap?1.28:i%3===1?.96:.64;
      const outer=side*(width/2-outerInset),inner=split+side*slot/2;
      const w=Math.abs(outer-inner),u=(outer+inner)/2;
      let edge;
      if(kind===0)edge=leading?1.60-.64*(i%2):-1.28;
      else if(kind===1)edge=leading?Math.min(1.92,.32+i*.64):-.32-(i%2)*.64;
      else edge=leading?1.28:((i===1||i===2)?-.64:-1.92);
      edge-=terrace;
      if(bookshop)edge=Math.min(edge,-.48);
      edge+=residentialReach(streetSite,y,i,leading,bookshop);
      const front=edge-.64,span=front-rear;
      const armour=leading?shell:alloy;
      // The outer .48 m is the cast jamb below. Give it the entire return;
      // a full-width core would put two differently coloured side walls in
      // the exact same plane for the length of every residential wing.
      box(leading?alloy:core,u-side*.24,y+rise*.5,(front+rear)/2,w-.48,rise-1.28,span,leading?0xc5c6bd:0xc0cace);
      solid(u,y+rise*.5,(edge+rear)/2,w,rise,edge-rear,'residence-wing');
      const join=(edge+rear)/2;
      // Full-depth head and sill courses occupy the open bands above and
      // below the glazed core. Their headers remain visible around the ends.
      const course=i<3?.32:.64;
      const phase=seed+3*i+(side>0?2:0);
      bond(armour,u,y+.32,join,w+.16,.64,edge-rear,colour,1,phase,course);
      // The sill keys into the lower band without covering its castellated edge.
      box(alloy,u,y+.72,join-.32,w+.16,.16,edge-rear-.96,sill);
      bond(armour,u,y+rise-.32,join+.16,w,.64,edge-rear+.32,colour,1,phase+2,course);
      bond(armour,outer-side*.24,y+rise*.50,join,.48,rise-.64,edge-rear+.32,colour,1,phase+1,.32);
      const header=inner+side*.32;
      for(let j=0;j<3;j++){
        box(j===1?alloy:armour,header+side*j*.16,y+rise-.48-j*.32,edge-.16,.64+j*.32,.32,.96-j*.16,j===1?sill:colour);
      }
      const panes=w>5.4?2:1;
      const pane=(w-.90)/panes;
      for(let p=0;p<panes;p++){
        const xx=inner+side*(.24+pane*(p+.5));
        box(glass(i,p+(leading?0:1)),xx,y+1.66,front+.045,pane-.10,1.58,.09);
      }
      // The side of the leading wing has occupied return glazing; where lots
      // stand apart this also gives the view down their service passage.
      const across=outer+side*.06;
      for(let j=0;j<2;j++){
        const v=front-1.60-j*2.56;
        if(v-1.12<=rear)continue;
        box(glass(i,j+2),across,y+1.72,v,.12,1.22,2.08);
        box(armour,outer+side*.18,y+.99,v,.36,.25,2.40,colour);
      }
      const backFace=rear-.09;
      box(glass(i,leading?1:3),u,y+1.65,backFace,w*.63,1.44,.18);
      box(armour,u,y+2.56,backFace,w+.1,.32,.42,colour);
      if(cap){
        bond(alloy,u,y+rise+.12,join,w+.18,.24,edge-rear,0xc4c9ba,1,phase,.16);
        solid(u,y+rise+.12,join,w+.18,.24,edge-rear,'roof-terrace');
        if(leading){
          const mast=outer-side*w*.30;
          for(let j=0;j<(kind===1?5:3);j++){
            const cw=Math.max(.80,w*.72-.32*j),cd=Math.min(depth*.60,5.12)-.32*j;
            box(j%2?alloy:shell,mast,y+rise+.56+j*.64,rear+depth*.38,cw,.64,cd,colour);
            solid(mast,y+rise+.56+j*.64,rear+depth*.38,cw,.64,cd,'lift-head');
          }
        }
      }
    }
    // A deep reveal frames a single lit circulation slot in the middle.
    const coreFront=-2.88-(i%2)*.32;
    box(core,split,y+rise/2,(rear+coreFront)/2,1.92,rise,coreFront-rear,0xbececf);
    solid(split,y+rise/2,(rear+coreFront)/2,1.92,rise,coreFront-rear,'residence-lift');
    box(i%3===1?'warmWindow':'coolWindow',split,y+1.66,coreFront+.08,.64,1.82,.16);
    if(i===1||i===levels-2){
      box(alloy,split,y+.32,-.88,2.56,.64,3.52,sill);
      solid(split,y+.32,-.88,2.56,.64,3.52,'access-link');
      box(core,split,y+1.04,.76,2.56,.80,.24);
      box(alloy,split,y+1.49,.76,2.56,.10,.26,sill);
    }
  }
}

// A covered apron turns into living floor area at the next story. Both piers
// sit on private shop corners, leaving the width between them to pedestrians.
export function buildExchangeApron(box,solid,width,inset,bond=box){
  const clear=width/2-.48;
  for(const e of [-1,1]){
    const x=e*clear;
    bond(core,x,2.18,-.16,.64,3.64,.96,0xbdcbd2,1,3+e*2,.32);
    solid(x,2.18,-.16,.64,3.64,.96,'arcade-foot');
    for(let i=0;i<3;i++)box(i===1?alloy:shell,x-e*.16*i,2.98+i*.32,-.16,.64+i*.32,.32,1.28,0xd7c8ad);
  }
  bond(alloy,0,3.78,-inset/2,width,.64,inset+.64,0xd7d6bb,1,2,.32);
  solid(0,3.78,-inset/2,width,.64,inset+.64,'arcade-ceiling');
  box('warmWindow',0,3.44,-inset*.6,width*.64,.06,.32);
}

// The rear of the Canal apartments exports waste heat to a public refill
// room. In local coordinates the negative V axis faces the public court.
export function buildHeatCourt(box,solid,patch,depth,bond=box){
  const rear=-depth;
  function part(mat,u,y,v,w,h,d,tone){
    bond(mat,u,y,v,w,h,d,tone,-1,Math.round(u+v),.32);
    solid(u,y,v,w,h,d,'heat-court');
  }
  part(shell,0,.89,rear+2.34,5.42,1.04,.64,0xd2cfc0);
  for(const u of [-1.60,0,1.60]){
    box(core,u,2.22,rear+2.58,1.28,1.66,.34);
    box('coolWindow',u,2.44,rear+2.38,.80,.66,.16);
    box(alloy,u,1.76,rear+2.18,.48,.25,.64);
    box('lamp',u,1.56,rear+2.02,.16,.16,.16,0x9dd7bd);
  }
  patch(-2.72,2.72,rear-.32,rear+2.92,.36);
  box('districtSlab',0,.28,rear+1.30,5.44,.16,3.24);
  // One shoulder holds a pair of replaceable thermal stores. The other
  // side steps back into the residential skin, exposing their full sides.
  for(let i=0;i<2;i++){
    const u=-.96+i*2.18,base=4.30+i*1.28,v=rear-.80;
    part(core,u,base+2.24,v,1.60,4.48,1.44,0xb4c8c8);
    for(let row=0;row<6;row++){
      const yy=base+.43+row*.64,w=row===0||row===5?1.44:1.92;
      box(alloy,u,yy,v-.16,w,.32,1.76,0xcfb48f);
      box('districtWarm',u,yy+.24,v-.38,w-.48,.16,1.60,0xeeb270);
      box(shell,u-.64,yy+.24,v-.26,.32,.32,1.64,0xc6bfab);
    }
    part(shell,u,base+4.55,v+.10,2.08,.44,2.12,0xd6cdad);
  }
  // The gallery cantilevers over the service lane. The two propped bays sit
  // in the existing pedestrian court, either side of the public bench.
  for(let i=0;i<3;i++){
    const v=rear-2.4-i*4.16,y=4.76+i*.32;
    part(i===1?alloy:shell,0,y,v,3.52,.40,4.64,0xd7d8bc);
    for(const s of [-1,1]){
      box(core,s*1.70,y-.36,v,.44,.45,4.48);
      box('districtWarm',s*1.49,y-.55,v,.20,.14,2.88,0xe7c19a);
      if(i===2){
        const end=v-2.10;
        part(core,s*1.49,2.46,end,.48,4.20,.64);
        for(let k=0;k<3;k++)
          box(alloy,s*(1.49-.16*k),4.28+k*.32,end+.16*k,.48+.32*k,.32,.64+.32*k,0xc5bbae);
      }
    }
  }
}
