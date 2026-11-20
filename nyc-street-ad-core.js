// World metres. A normal storefront faces the lot's local +Z. The blade bracket
// runs back to that same wall along its own +X. All fixed shop names stay on
// their own tenants, including the independent upstairs shops.
export function coreAdSites(buildings){
  const sites=[];
  function mount(frame,u,y,v,turn,sign){
    const c=Math.cos(frame.angle),s=Math.sin(frame.angle);
    sites.push({...sign,x:frame.x+c*u+s*v,y,z:frame.z-s*u+c*v,yaw:frame.angle+turn});
  }
  function lot(x,z){
    return buildings.find(b=>Math.abs(b.x-x)<.08 && Math.abs(b.z-z)<.08);
  }
  function shop(row){
    const [x,z,header,blade,glyph,side,spill]=row;
    const b=lot(x,z);
    if(!b)return;
    const v=b.d/2,w=Math.min(7.65,b.w*.67),bay=Math.round(b.w/3.52);
    // Four to eight metre fascia attached to the projecting shop cornice.
    mount(b,-side*b.w*.085,5.07,v+1.64,0,
      {id:header,kind:'wall',width:w,height:w/3,mountDepth:.59,glyph,spill});
    // A two-sided upper tenant sign terminates the strip at a masonry pier.
    // Put the column between the screen and the window, outside the main sign.
    const pier=side<0?-b.w/2+.20:b.w/2-.16;
    const width=bay>=4?1.22:1.06;
    mount(b,pier,5.83,v+1.85+width/2,Math.PI/2,
      {id:blade,kind:'blade',width,height:width*2.93,mountSide:1,mountDepth:2.02});
  }

  // Corporate podium / night clinic with an upper-floor optician's blade.
  // Next, a late counter near the gate, then the electronics block at the bend.
  shop([64,-292,'pharmacy','optics','cross',1,true]);
  shop([46,-186,'deli','tea','bowl',-1,true]);
  shop([56,-221.35,'repair','keys',null,1,true]);
  shop([109,-239,'courier','photo',null,-1,false]);

  // East terraces: residents see a pharmacy from the walk and a battery notice
  // at the smaller rear service shutter. Both low signs leave the stair open.
  const eastHome=lot(92,-207);
  if(eastHome)mount(eastHome,-eastHome.w/2-1.63,5.03,0,-Math.PI/2,
    {id:'pharmacy',kind:'wall',width:4.35,height:1.45,mountDepth:.62});
  for(const [x,z,id] of [[94,-195,'battery'],[22,-211,'recycle']]){
    const b=lot(x,z);
    if(b)mount(b,-b.w*.23,2.07,-b.d/2-.59,Math.PI,
      {id,kind:'poster',width:1.24,height:1.55,mountDepth:.34});
  }

  // Utility media concession on the street side of the diagonal elevated
  // rail. Seen from 20–35m, below train windows, in front of the actual girder.
  const trackAngle=-Math.atan2(50,188);
  mount({x:-52,z:-266,angle:trackAngle},111,13.31,3.16,0,
    {id:'gridPower',kind:'wall',width:9.12,height:3.04,mountDepth:.73});
  // East concourse roof beam, clear of the existing name on its western half.
  mount({x:102,z:-224,angle:trackAngle},6.36,6.56,5.79,0,
    {id:'lastTrain',kind:'ticker',width:6.12,height:2.04,mountDepth:.41});
  return sites;
}
