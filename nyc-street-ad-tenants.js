// Refit the actual shop's existing signboard. The fixing datum is taken
// from the metal-backed fixture built by each district rather than a nearby
// guessed facade. Existing timetables, address numbers and exits keep their
// dedicated screens. Width is in metres, measured along each enclosure.
const tenants=new Map([
  ['HUDSON DELI','deli'],['MONROE RECORDS','record'],['ORBIT REPAIR','repair'],
  ['NORTHLINE','northCom'],['LUMEN CLINIC','clinic'],['EASTSIDE COFFEE','cafe'],
  ['SIDE B / RECORDS','record'],['PATCH / REPAIR','repair'],
  ['LAUNDRY / 2F','wash'],['MONROE DELI','noodles'],
  ['RIVERWORKS','forge'],['HUDSON SUPPLY','provisions'],['NIGHT FREIGHT','dispatch'],
  ['RIVERSIDE MARKET','dockMarket'],['HUDSON PIER','pier'],['BAY 04','partsBay'],
  ['HUDSON','overlook'],['HIGH LINE','greenline'],['HUDSON  →','overlook'],['RIVER WALK','pier'],
  ['NORTHLINE / EXCHANGE','junction'],
  ['SIGNAL / ATRIUM','data'],['CIVIC EXCHANGE','archive'],['SERVICE COURT','parts'],
  ['FRESH / SOUP','noodles'],['CITYLINK / PICKUP','courier'],
  ['SERVICE / 06','partsBay'],['CIVIC ARCHIVE','archive'],
  ['LAFAYETTE / TAILOR','tailor'],['BROOME / CAFE','cafe'],['MERCER / GROCER','grocery'],
  ['GREENE / BOOKS','books'],['SULLIVAN / DESIGN','textile'],['WOOSTER / ARCHIVE','books'],
  ['SPRING / STUDIO','studio'],['CANAL / WORKS','forge'],['SOHO / PRESS','press'],
  ['CROSBY / LOFTS','lofts'],['SPRING MARKET','streetMarket'],['CANAL / COURT','studio'],
  ['BATTERY / FIX','gridPower'],['THREAD / COMMONS','tailor'],['BOWERY / ELECTRIC','charge'],
  ['WEST / HABITAT','sleep'],['PAPER / WORKSHOP','press'],['AFTER / LAUNDRY','wash'],
  ['CANAL / NOODLE','noodles'],['FIBER / EXCHANGE','textile'],['CROSBY / GOODS','courier'],
  ['CANAL / PRINT WORKS','press'],['MERCER / FABRIC CO-OP','textile'],['DELIVERIES','courier'],
  ['EAST COMMONS','garden'],['EAST LOOP TRAM','transit'],['COMMONS PAVILION','garden'],
  ['INTAKE 02','pump'],['ECO / LINK','pump'],['COMMONS / GROW HOUSE','nursery'],
  ['COMMONS COFFEE','cafe'],['衡光联合','lobby'],
]);
const twinFaceTitles=new Set(['HIGH LINE']);
const markTitles=new Set(['HUDSON SUPPLY','RIVERSIDE MARKET','EASTSIDE COFFEE','SPRING MARKET',
  'FIBER / EXCHANGE','BROOME / CAFE','CIVIC EXCHANGE','COMMONS / GROW HOUSE']);
const glowTitles=new Set(['NIGHT FREIGHT','SPRING MARKET','EASTSIDE COFFEE','SIDE B / RECORDS',
  'CROSBY / GOODS','CIVIC EXCHANGE','COMMONS / GROW HOUSE']);
const lightColumns=new Map([
  ['AXIOM','signal'],['ORBIT','battery'],['AFTER','photo']
]);

export function refitTenants(scene,tiles){
  const sites=[];
  for(const obj of scene.children){
    if(!obj.isMesh||!obj.name.startsWith('NYC authored sign / '))continue;
    const title=obj.name.slice('NYC authored sign / '.length);
    // Only the financed billboard faces change. Stock floor numbers and
    // the other vertical operator logos still identify the building.
    const column=lightColumns.get(title)||(title==='SYNC'&&obj.position.x>30?'optics':null);
    const key=column||tenants.get(title);
    if(!key)continue;
    const p=obj.position,yaw=obj.rotation.y,{width:oldWidth,height:oldHeight}=obj.geometry.parameters;
    const tile=tiles[key],wide=oldWidth/oldHeight>9;
    if(column){
      const skyline=p.y>24,poster=key==='battery'||key==='signal';
      // These two exchange towers rent their existing narrow braced masts to
      // advertisers. A wider luminous cabinet mounts directly on that mast.
      const w=skyline?oldWidth*1.85:oldWidth,h=skyline?w/tile.aspect:oldHeight;
      const n=skyline?.36:.18;
      sites.push({id:key,alternate:poster?(key==='signal'?'recycle':'signal'):null,kind:'wall',
        owner:title,width:w,height:h,yaw,x:p.x+Math.sin(yaw)*n,y:p.y,z:p.z+Math.cos(yaw)*n,mountDepth:n+.21});
      obj.visible=false;continue;
    }
    const width=key==='lobby'?oldWidth:Math.min(oldWidth,wide?6.6:8.40);
    // A wall fascia can project from the fixing foot. The short park and
    // elevated waymarkers remain in their existing pedestrian envelope.
    const constrained=oldWidth<3.2||p.y<2.5||twinFaceTitles.has(title);
    const height=constrained?Math.min(oldHeight*1.18,width/tile.aspect):Math.min(width/tile.aspect,oldHeight*2.35);
    const n=constrained?.105:width>5?.41:.22;
    sites.push({id:key,owner:title,kind:tile.group==='industry'||tile.group==='circuit'?'ticker':'wall',
      x:p.x+Math.sin(yaw)*n,y:p.y,z:p.z+Math.cos(yaw)*n,yaw,width,height,
      mountDepth:n+.15,lowProfile:constrained,
      mark:markTitles.has(title)&&width>3.5,spill:glowTitles.has(title)});
    obj.visible=false;
  }
  return sites;
}

// Street-facing ends of the brick Hudson sheds (the service roads run
// perpendicular to the main dock axial view). The lamp and its tread can be
// read coming back from the apron, not just from the river approach.
export const sideWallSites=[
  {id:'parts',kind:'ticker',owner:'仓储东巷北侧',x:-68.38,y:4.78,z:-17.06,yaw:-Math.PI/2,width:4.0,height:.9,mountDepth:.58,mark:true},
  {id:'dispatch',kind:'ticker',owner:'夜运换班处',x:-77.62,y:4.84,z:15.95,yaw:Math.PI/2,width:4.36,height:1.00,mountDepth:.59},
  {id:'winding',kind:'wall',owner:'河湾机造卷绕车间',x:-96.38,y:4.88,z:-16.45,yaw:-Math.PI/2,width:4.12,height:.96,mountDepth:.59},
  {id:'partsBay',kind:'ticker',owner:'滨水供应社收货处',x:-104.62,y:4.77,z:-16.67,yaw:Math.PI/2,width:4.32,height:.98,mountDepth:.59},
  {id:'dockMarket',kind:'wall',owner:'码头生鲜提货侧门',x:-123.38,y:4.80,z:16.07,yaw:-Math.PI/2,width:4.56,height:1.02,mountDepth:.59,mark:true},
];

// Pavement-furniture pockets. The screen is rotated along the pedestrian lane,
// so the two faces serve the inbound and outbound walks. Ground/contact tests
// keep the plinth away from parked mirrors, benches, tree guards and curbs.
const pockets=[
  ['old','老城南口公话',-8.05,47.2,0,'signal','recycle'],
  ['old','老城北口转乘',7.80,-46.5,0,'rail','signal'],
  ['warehouse','西仓装卸夜班',-76.85,-40,0,'battery','recycle'],
  ['warehouse','仓储南侧市场',-97.0,29.5,0,'recycle','battery'],
  ['quay','滨水北段夜航',-134,-38,0,'rail','battery'],
  ['quay','滨水南段夜航',-134,31,0,'signal','rail'],
  ['exchange','旧市西环居民服务',-42.0,-156,0,'recycle','signal'],
  ['exchange','交易所东侧接驳',64.25,-140,0,'rail','signal'],
  ['exchange','旧市南横街',38,-79.1,Math.PI/2,'battery','recycle'],
  ['exchange','北接缝过夜通讯',20,-169.7,Math.PI/2,'signal','battery'],
  ['soho','西环印务协作站',-53.32,129.6,0,'signal','battery'],
  ['soho','东环快件柜',63.7,125,0,'recycle','signal'],
  ['soho','运河街南口',-25,145.0,Math.PI/2,'rail','battery'],
  ['park','湿地东环供水',126.45,33.5,0,'recycle','rail'],
  ['park','西岸环线夜站',64.35,-34,0,'rail','signal'],
  ['park','南环站口',120,78,Math.PI/2,'rail','recycle'],
  ['core','总部北门夜间接驳',55,-364,0,'rail','signal'],
  ['core','东台地居民街',138.85,-287,0,'battery','recycle'],
  ['core','旧轨夜间运力',-22.7,-305,0,'battery','signal']
];
export function streetKiosks(options){
  if(!options)return [];
  const {ground,collider,colliders,isPlayable}=options,sites=[];
  for(const [district,owner,x,z,yaw,id,alternate] of pockets){
    const c=Math.cos(yaw),s=Math.sin(yaw);
    const w=1.04,h=1.30,thick=.40,halfX=(Math.abs(c)*(w+.12)+Math.abs(s)*thick)/2;
    const halfZ=(Math.abs(s)*(w+.12)+Math.abs(c)*thick)/2;
    for(const shift of [0,1.5,-1.5,3,-3,4.5,-4.5,6,-6]){
      const cx=x+s*shift,cz=z+c*shift,y=ground(cx,cz,.72);
      if(!isPlayable(cx,cz)||y<.26||y>.66)continue;
      if([[-1,-1],[-1,1],[1,-1],[1,1]].some(([a,b])=>Math.abs(ground(cx+a*halfX,cz+b*halfZ,.72)-y)>.07))continue;
      const inUse=colliders.some(b=>b.max.y>y+.15&&b.min.y<y+2.28&&b.min.x<cx+halfX+.22&&b.max.x>cx-halfX-.22&&b.min.z<cz+halfZ+.22&&b.max.z>cz-halfZ-.22);
      if(inUse)continue;
      collider(cx,y+1.04,cz,halfX*2,2.08,halfZ*2);
      sites.push({district,owner,id,alternate,kind:'kiosk',x:cx+s*.14,y:y+1.49,z:cz+c*.14,yaw,width:w,height:h,baseY:y,mountDepth:.28});
      break;
    }
  }
  return sites;
}

// A new operator leases a bay beside each major turn of the northern road
// system. Parcel normals are authoritative; the target is a point ON that
// turn's carriageway. This prevents printing a street sign on a rear court.
const leases=[
  [-49.87,-188.50,-36,-188,'parts'],[-27.76,-221.93,-20,-212,'winding'],
  [11.75,-224.59,0,-234,'charge'],[-10.13,-239.47,-1,-239,'partsBay'],
  [17.74,-279.38,12,-268,'forge'],[-19.48,-276.74,-10,-286,'dispatch'],
  [.38,-298.12,-15,-297,'fabrication'],[-2.68,-317.98,-17,-318,'winding'],
  [-22.30,-339.30,-10,-335,'parts'],[-12.50,-348.86,0,-346,'partsBay'],
  [17.28,-340.84,17,-354,'charge'],[38.36,-365.72,38,-351,'fabrication'],
  [39,-382,62,-368,'data'],[49,-315,70,-322,'junction'],[88,-326,74,-321,'streetMed'],
  [103.62,-336.22,111,-325,'lofts'],[134.21,-332.14,121,-326,'sleep'],
  [142.74,-320.49,130,-315,'cafe'],[150,-293,133,-293,'lofts'],
  [129.40,-252.55,124,-267,'grocery'],[111.65,-275.91,123,-269,'wash'],
  [96.75,-269.29,92,-253,'streetMed'],[108,-297,86,-298,'sleep'],
];
export function northernTenants(buildings){
  const sites=[];
  for(const [x,z,tx,tz,id] of leases){
    const b=buildings.find(q=>Math.abs(q.x-x)<.08&&Math.abs(q.z-z)<.08);
    if(!b)continue;
    const dx=tx-x,dz=tz-z,u=dx*b.c-dz*b.s,v=dx*b.s+dz*b.c;
    const front=Math.abs(v)/(b.d/2)>Math.abs(u)/(b.w/2);
    const side=front?Math.sign(v):Math.sign(u);
    const yaw=b.angle+(front?(side===1?0:Math.PI):side*Math.PI/2);
    const back=front&&side===-1,depth=(front?b.d:b.w)/2;
    const pad=back?.64:1.64,span=front?b.w:b.d;
    const width=Math.min(6.0,span*.60),height=width/4.42;
    sites.push({id,owner:b.style,kind:b.style==='residence'?'wall':'ticker',width,height,yaw,
      x:b.x+Math.sin(yaw)*(depth+pad),y:back?4.0:5.08,z:b.z+Math.cos(yaw)*(depth+pad),
      // The west face of the north relay and the estate grocery have a
      // 1.72m-deep blank reveal instead of the projecting row of cornice teeth.
      mountDepth:(id==='data'||id==='grocery')?1.84:back?.85:.72,
      mark:['fabrication','lofts','charge','junction'].includes(id),
      spill:id==='junction'||id==='fabrication'||id==='grocery'});
  }
  return sites;
}
