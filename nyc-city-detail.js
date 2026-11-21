import {buildSkylineProperty} from './nyc-skyline-buildings.js';
import {exchangeApproach} from './nyc-civic-hall.js';
import {waterworksResidences} from './nyc-east-waterworks-housing.js';
import * as T from 'three';
import {mapPlan} from './nyc-map-plan.js';
import {freightWell} from './nyc-future-core-layout.js';
import {createTerminusMaterials, sohoLoadingHall, sohoPressAnnex, midtownWorksTower} from './nyc-west-termini.js';

/** Occupied architecture, added to the parent's box/beam batch before finish().
 * No meshes, lights, animation loops or new walk surfaces are created here.
 */
export function addCityDetail(scene,{box,beam,materials,colliders,sign,rand=Math.random}) {
  const stats={boxes:0,beams:0,triangles:0,signs:0,colliders:0,
    towerDetailSets:0,maintenancePlatforms:0,coreFronts:0,backgroundBuildings:0,
    independentDrawCalls:0,independentMeshes:0,backgroundFootprints:[],
    maintenanceBalconies:{z:-108.1,minY:9.68,walkable:false},backgroundOutsidePlayable:true};
  const B=(...args)=>{stats.boxes++;box(...args);};
  const L=(...args)=>{stats.beams++;beam(...args);};
  function C(x,y,z,w,h,d){
    colliders.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));
    stats.colliders++;
  }
  function material(key,source,color,roughness=.88,metalness=0){
    if(materials[key])return key;
    const m=(materials[source]||materials.metal).clone();
    m.name='NYC occupied city / '+key;m.color=new T.Color(color);m.roughness=roughness;m.metalness=metalness;
    m.userData={...m.userData};materials[key]=m;return key;
  }
  const zinc=material('cityDetailZinc','metal',0x788988,.78,.42);
  const oxide=material('cityDetailOxide','metal',0x796654,.92,.15);
  const damp=material('cityDetailDamp','concrete',0x52646a,.97);
  const soot=material('cityDetailSoot','concrete',0x3e5058,.99);
  const paper=material('cityDetailPaper','white',0xc7c0a9,.97);
  const ink=material('cityDetailInk','rubber',0x314c55,.98);
  const trim=materials.midtownSteel?'midtownSteel':'metal';
  const stone=materials.midtownLimestone?'midtownLimestone':'stone';
  const tint=(spread=.12)=>new T.Color().setScalar(1-spread/2+rand()*spread);
  createTerminusMaterials(materials);

  // A face's origin sits on the actual wall, with +out pointing into the air.
  function face(x,z,rotation=0){
    const c=Math.cos(rotation),s=Math.sin(rotation);
    const P=(u,y,out)=>[x+u*c+out*s,y,z-u*s+out*c];
    return {P,
      B:(mat,u,y,out,w,h,d,col=0xffffff)=>B(mat,...P(u,y,out),w,h,d,col,rotation),
      L:(mat,a,b,w=.05,d=w,col=0xffffff)=>L(mat,P(...a),P(...b),w,d,col)};
  }
  function towerFace(t,rotation=0,scale=1){
    const alongZ=Math.abs(Math.sin(rotation))>.5,depth=(alongZ?t.w:t.d)*scale;
    return face(t.x+Math.sin(rotation)*depth/2,t.z+Math.cos(rotation)*depth/2,rotation);
  }
  function conduit(f,u,y0,y1,out=.35,variant=0){
    f.B(variant%2?oxide:zinc,u,(y0+y1)/2,out,.11,y1-y0,.11);
    for(let y=y0+.3;y<y1;y+=1.7){f.B('metal',u,y,out-.055,.30,.085,.20,0x879b98);}
    f.B(zinc,u+.26,y0+.08,out,.62,.13,.13);
    f.B('metal',u+.53,y0+.08,out,.13,.40,.15,0x7c8f8a);
  }
  function rainMarks(f,u0,u1,top=3.0,count=18){
    // Thin inset strips stay in the building's existing collision margin.
    for(let i=0;i<count;i++){
      const u=u0+rand()*(u1-u0),h=.25+rand()*1.65;
      f.B(i%4===0?oxide:damp,u,top-h/2,.025,.035+rand()*.095,h,.018,tint(.17));
      if(i%3===0)f.B(soot,u+.07,.60,.028,.16+rand()*.20,.09,.021,tint(.12));
    }
  }
  function noticeBoard(f,u,y,width=1.8){
    f.B(zinc,u,y,.13,width+.12,1.38,.11);
    f.B(ink,u,y,.20,width,1.25,.035);
    for(let i=0;i<5;i++){
      const x=u-width*.37+(i%3)*width*.31,yy=y+(i<3?.25:-.28),w=width*(i%2?.24:.27);
      f.B(paper,x,yy,.225,w,.42,.012,i%2?0xb3baac:0xcbbf9e);
      f.B(i%2?oxide:ink,x,yy+.12,.239,w*.80,.055,.008);
      for(let j=0;j<3;j++)f.B(ink,x-w*.05,yy+.015-j*.072,.241,w*(.56-j*.06),.018,.008);
    }
  }
  function ironPier(f,u,y=2.35){
    f.B('metal',u,y,.20,.18,3.72,.27,0x6a817e);
    for(const yy of [y-1.62,y+1.55,y+1.77])f.B(zinc,u,yy,.21,.38,.13,.40);
    f.B(oxide,u,y-1.35,.25,.23,.32,.31);
    for(const e of [-1,1])f.L('metal',[u,y+1.35,.24],[u+e*.62,y+1.75,.24],.07,.07,0x7e928c);
  }
  function vent(f,u,y,width=1.6,height=.9,out=.40){
    f.B(zinc,u,y,out,width,height,.48);
    f.B(ink,u,y,out+.255,width-.16,height-.13,.025);
    const rows=Math.max(4,Math.round(height/.13));
    for(let j=0;j<rows;j++)f.B('metal',u,y-height*.40+j*height*.8/(rows-1),out+.29,width-.23,.045,.065,0x9ca9a1);
    for(const e of [-1,1])f.B(oxide,u+e*(width/2-.10),y-height/2-.08,out-.10,.11,.23,.48);
  }
  function canopy(f,u,y,width,depth=1.6){
    f.B(zinc,u,y,depth*.43,width,.17,depth);
    f.B('metal',u,y+.12,depth*.43,width+.08,.085,depth+.06,0x849b95);
    f.B('rubber',u,y-.105,depth*.81,width-.14,.045,.10,0x6d7e76);
    for(let x=-width/2+.25;x<width/2;x+=.62)f.B('metal',u+x,y-.14,depth*.43,.08,.075,depth-.08,0x7b8e89);
    for(const e of [-1,1])f.L('metal',[u+e*(width*.38),y-.62,.14],[u+e*(width*.38),y-.12,depth*.77],.085,.085,0x8b9e96);
  }
  function platform(f,u,y,width,depth=1.3){
    stats.maintenancePlatforms++;
    f.B('metal',u,y,depth*.46,width,.18,depth,0x7f9390);
    for(let x=-width/2+.15;x<width/2;x+=.38)f.B(zinc,u+x,y+.115,depth*.46,.13,.045,depth-.08);
    for(const e of [-1,1]){
      f.L('metal',[u+e*width*.40,y-1.0,.04],[u+e*width*.40,y-.14,depth*.88],.11,.11,0x8b9c96);
      f.B('metal',u+e*width/2,y+.62,depth*.94,.055,1.16,.055,0x8a9c95);
      f.B('metal',u+e*width/2,y+.62,depth*.50,.055,1.16,.055,0x8a9c95);
    }
    f.B('metal',u,y+1.18,depth*.94,width,.06,.06,0x99aaa1);
    f.B('metal',u,y+.62,depth*.94,width,.045,.045,0x82968d);
    for(let x=-width/2+.55;x<width/2;x+=.75)f.B('metal',u+x,y+.60,depth*.94,.035,1.10,.035,0x8c9d94);
    vent(f,u-width*.20,y+.68,width*.27,.72,depth*.34);
    vent(f,u+width*.23,y+.65,width*.24,.66,depth*.34);
  }
  function coolingUnit(x,y,z,width=1.6,depth=1.5){
    B(zinc,x,y+.55,z,width,1.1,depth);
    B('metal',x,y+1.13,z,width+.10,.15,depth+.10,0xa0aba0);
    for(let i=0;i<6;i++)B(ink,x-width*.36+i*width*.145,y+.55,z+depth/2+.013,.07,.76,.028);
    B(ink,x,y+1.22,z,width*.61,.03,depth*.61);
    for(const a of [-Math.PI/4,Math.PI/4])B('metal',x,y+1.25,z,width*.55,.035,.10,0x8a9b92,a);
  }

  const towers=[
    {id:'west_terracotta',x:-53,z:-102.5,w:18,d:15,top:66.36,scale:.58},
    {id:'west_slim',x:exchangeApproach.westX,z:-102,w:14,d:14,top:82.36,scale:.56},
    {id:'east_exchange',x:exchangeApproach.eastX,z:-101.5,w:26,d:13,top:79.36,scale:.62},
    {id:'east_sentinel',x:74,z:-102.5,w:16,d:15,top:96.36,scale:.52},
    {id:'plaza_east',x:38,z:-150,w:20,d:20,top:105.36,scale:.64},
    {id:'civic_hero',x:-8,z:-157,w:20,d:20,top:120.36,scale:.26},
  ];
  // Each inhabited lower facade has its own service pattern, not six cloned fronts.
  for(let i=0;i<towers.length;i++){
    const t=towers[i],f=towerFace(t),side=towerFace(t,i%2?-Math.PI/2:Math.PI/2);
    stats.towerDetailSets++;
    rainMarks(f,-t.w*.45,t.w*.45,2.8,16+i*2);
    conduit(side,-t.d*.31,2.7,11.5+i*.8,.30,i);
    conduit(side,t.d*.30,4.6,14.5+i*.6,.24,i+1);
    vent(side,-t.d*.08,3.0,1.25+i*.10,.72,.30);
    platform(side,0,24+i*3.3,Math.min(5.4,t.d*.38),1.22+i%2*.25);
  }

  // Screens remain the focal point. Services frame their sides and occupy the
  // floors below, rather than covering the authored display textures.
  const slim=face(exchangeApproach.westX,-95),exchange=face(exchangeApproach.eastX,-94);
  for(const [f,width] of [[slim,14],[exchange,34]]){
    const edge=width/2-.72;
    for(const e of [-1,1]){
      ironPier(f,e*edge);
      conduit(f,e*edge,5.2,20.4,.32,e+1);
      f.B('metal',e*(edge-.34),9.7,.36,.32,1.65,.34,0x889b94);
      for(let j=0;j<4;j++)f.B(zinc,e*(edge-.34),9.2+j*.27,.55,.29,.06,.07);
    }
    noticeBoard(f,-width*.28,1.88,1.55);
    vent(f,width*.27,3.0,2.1,.82,.34);
  }
  canopy(slim,0,4.55,6.2,1.65);
  canopy(exchange,-6.8,4.85,7.6,1.8);
  // Offset, non-emissive shades differ between the fin and curtain-wall towers.
  for(const yy of [25.3,28.6,31.9])for(const u of [-4.8,3.1])slim.B(zinc,u,yy,.66,2.45,.11,1.04,0x82958d);
  const exchangeUpper=towerFace(towers[2]);
  for(const yy of [28.1,41.4])for(const u of [-10,-5.2,4.1,9.5])exchangeUpper.B(trim,u,yy,.58,3.6,.12,.88,0x81958e);

  // Hero plaza edges: cast-iron entrance bays, local notices and duct elbows.
  // The device x[2,14]/z[-140,-128] and both street-life seating zones stay clear.
  const heroFront=face(-8,-144),atriumWest=face(25,-150,-Math.PI/2);
  for(const u of [-13.7,13.7]){ironPier(heroFront,u);noticeBoard(heroFront,u*.84,1.82,1.6);}
  canopy(heroFront,-11.1,4.65,4.4,1.3);
  canopy(heroFront,11.2,4.65,4.4,1.3);
  rainMarks(heroFront,-15,15,3.1,35);
  for(const u of [-7.5,7.5]){conduit(atriumWest,u,2.8,8.6,.25,1);vent(atriumWest,u*.75,3.25,1.6,.85,.32);}
  noticeBoard(atriumWest,0,1.85,2.0);
  const heroHigh=towerFace(towers[5],-Math.PI/2);
  for(const y of [34.0,45.8])for(const u of [-5.6,5.6])heroHigh.B(stone,u,y,.40,2.3,.15,.74,0xa1ad9c);
  const bronzeFace=towerFace(towers[4],Math.PI);
  for(const y of [42.4,58.2])for(let u=-7;u<=7;u+=3.5)bronzeFace.B('midtownBronze' in materials?'midtownBronze':zinc,u,y,.48,2.75,.16,.77,0x8e9175);

  // Two occupied roof blocks carry a suspended utility gallery above the
  // old street. Its dark underside silhouettes against the harbour-blue sky.
  for(const x of [-15,15]){
    B('metal',x,22.7,-32,7.6,10.5,9.2,0x718088);
    B(zinc,x,28.2,-32,8.1,.65,9.7);
    B('glass',x,25.8,-27.35,6.8,2.5,.12);
    C(x,22.7,-32,7.6,10.5,9.2);
  }
  B('metal',0,23.7,-32,24,2.8,4.2,0x586c7c);C(0,23.7,-32,24,2.8,4.2);
  B(zinc,0,25.25,-32,24.4,.4,4.6);
  B('coolWindow',0,24.35,-29.82,22,.55,.12);
  // Two short maintenance balconies leave the northward tower sightline open.
  for(const [x,direction] of [[exchangeApproach.westX+7,1],[exchangeApproach.eastX-17,-1]]){
    const cx=x+direction*1.2;
    B('metal',cx,9.82,-108.1,2.8,.28,2.2);
    B(zinc,cx,11.0,-107.05,2.8,.12,.09);
    for(const dx of [-1.29,1.29])B('metal',cx+dx,10.45,-107.05,.10,1.25,.10);
    C(cx,9.82,-108.1,2.8,.28,2.2);
  }

  // Six distinct rooftop silhouettes complement, rather than replace, the towers.
  const terra=towers[0];
  B('metal',terra.x,terra.top+.48,terra.z,4.8,.18,4.2,0x7a8e84);
  for(const x of [-54.7,-51.3])for(const z of [-103.9,-101.1]){
    B('metal',x,terra.top+1.18,z,.13,1.38,.13,0x8e9e92);
    L('metal',[x-.4,terra.top+.55,z],[x+.4,terra.top+1.79,z],.07,.07,0x8a9b91);
  }
  for(let i=0;i<8;i++)B(i%2?oxide:zinc,terra.x,terra.top+1.92+i*.24,terra.z,3.65,.22,3.15);
  B(zinc,terra.x,terra.top+3.92,terra.z,3.98,.18,3.42);
  conduit(towerFace(terra,Math.PI,.81),4.6,47.1,59.2,.25,1);
  conduit(towerFace(terra,Math.PI,.58),3.1,60.2,65.7,.25,1);

  const fin=towers[1],mastY=fin.top+4.8;
  B('metal',fin.x,fin.top+.90,fin.z,2.4,.25,2.2,0x96a596);
  for(const [dx,dz]of [[-1,-.8],[1,-.8],[0,1.05]])L('metal',[fin.x+dx,fin.top+1.02,fin.z+dz],[fin.x,mastY,fin.z],.10,.10,0x8eaaa0);
  for(const e of [-1,1]){
    B(zinc,fin.x+e*.87,mastY-.30,fin.z,.44,2.1,.25);
    for(let i=0;i<3;i++)B('metal',fin.x+e*.87,mastY-1.05+i*.62,fin.z+.16,.31,.075,.07,0x9db3a6);
  }
  L('metal',[fin.x,mastY-1.6,fin.z],[fin.x+1.4,mastY-1.6,fin.z],.07,.07,0x8eaaa0);
  B('metal',fin.x+1.5,mastY-1.6,fin.z,.35,.50,.65,0x8eaaa0);

  const exchangeTop=towers[2];
  for(const dx of [-6.2,6.2])for(const z of [-103.5,-99.8])coolingUnit(exchangeTop.x+dx,exchangeTop.top+.82,z,1.5,1.25);
  for(const z of [-104.5,-98.5])B('metal',exchangeTop.x,exchangeTop.top+.85,z,13.6,.15,.15,0x8b9c91);
  for(const dx of [-6.6,6.6])for(const z of [-104.5,-98.5])B('metal',exchangeTop.x+dx,exchangeTop.top+1.35,z,.06,1.1,.06,0x94a598);

  const sentinel=towers[3];
  for(let x=-1;x<=1;x++)for(let z=0;z<2;z++){
    const xx=sentinel.x+x*1.65,zz=z===0?-104.95:-100.05;
    B('metal',xx,sentinel.top+.95,zz,1.52,.12,1.66,0x91a59a);
    B('glass',xx,sentinel.top+1.03,zz,1.40,.045,1.54,0x748c95);
    B('metal',xx,sentinel.top+.50,zz,.12,.8,.65,0x8a9c92);
  }
  for(const e of [-1,1])L('metal',[76.7,sentinel.top+.7,-101.1],[76.7+e*.75,sentinel.top+3.6,-101.1],.065,.065,0x96aaa0);
  for(let i=0;i<5;i++)B(zinc,76.7,sentinel.top+3.0+i*.23,-101.1,1.1-i*.12,.055,.12);

  const bronze=towers[4];
  for(const x of [33.5,42.5])B('metal',x,bronze.top+1.68,-150,.18,2.5,.18,0x9aab9c);
  B(oxide,38,bronze.top+2.96,-150,9.7,.24,.20);
  B('metal',38,bronze.top+2.62,-150,.38,.40,.42,0xa2b1a4);
  L('rubber',[38,bronze.top+2.4,-150],[38,bronze.top+.90,-150],.065,.065,0x9aab9c);
  coolingUnit(34.3,bronze.top+.85,-153.6,1.8,1.6);
  coolingUnit(41.7,bronze.top+.85,-146.4,1.8,1.6);
  // Hero equipment stays on the broad podium roof, away from its Deco spire.
  for(const x of [-21.5,5.2]){
    coolingUnit(x,16.6,-158.6,1.7,2.2);
    for(let i=0;i<3;i++)B(zinc,x,19.0+i*.34,-155.3,1.4-i*.15,.11,1.05-i*.12);
    B('metal',x,18.0,-155.3,.16,3.1,.16,0xa2b09d);
  }

  // Core wall cables / rain canopies avoid all street-life stalls and stair mouths.
  const coreFaces=[
    {f:face(-10.65,-39,Math.PI/2),u:0},
    {f:face(10.65,-39,-Math.PI/2),u:0},
    {f:face(-10.65,44,Math.PI/2),u:0},
    {f:face(10.65,-50,-Math.PI/2),u:0},
    {f:face(-27,-10.65),u:0},
    {f:face(27,-10.65),u:0},
  ];
  for(let i=0;i<coreFaces.length;i++){
    const {f}=coreFaces[i];stats.coreFronts++;
    rainMarks(f,-4.2,4.2,2.7,17);
    conduit(f,i%2?-4.15:4.15,2.6,10.5+i*.38,.22,i);
    noticeBoard(f,i%2?2.8:-2.8,1.76,1.25);
    if(i<4)canopy(f,i%2?-1.6:1.2,4.10,2.7,1.13);
    for(let q=0;q<9;q++){
      const u=-4.25+q*1.03;
      f.B('metal',u,6.35,.20,.42,.13,.38,0x89998b);
      if(q<8)f.L('rubber',[u,6.35,.31],[u+.92,6.16+Math.sin(q)*.045,.31],.042,.042,0x7c8980);
    }
    // Small, flat wall-foot litter clusters, never a curb-height obstacle.
    for(let q=0;q<7;q++)f.B(q%3?oxide:paper,-3.8+rand()*7.6,.385,.11+rand()*.12,.09+rand()*.16,.018,.06+rand()*.10,tint(.18));
  }
  if(sign){
    const p=slim.P(-4.3,3.5,.44);sign(...p,2.3,.42,'SERVICE / 06','DELIVERIES / B1','#bdc6ae');stats.signs++;
    const q=heroFront.P(11.7,3.45,.35);sign(...q,2.2,.40,'CIVIC ARCHIVE','PUBLIC / EXCHANGE','#c8b894');stats.signs++;
  }

  // Background blocks fill the side streets and northern skyline, beyond the
  // playable polygon. They have four-sided windows, setbacks and grounded bases.
  const backgrounds=[
    [-112,-105,14,14,26,0],[-92,-112,14,18,42,1],[-76,-146,14,20,33,2],[-92,-176,14,18,58,3],
    [98,-123,14,18,28,2],[115,-130,16,17,47,0],[96,-158,14,20,36,3],[116,-177,16,16,64,1],
    [16,-214,22,22,54,2],[-15,-243,26,24,76,1],[52,-221,24,22,67,0],[-48,-216,23.2,20,39.3,3,midtownWorksTower],
    // Lower second-row blocks close the east-to-north diagonal sightlines from
    // the cafe and southern avenue, behind the taller first-row silhouettes.
    [146,-108,24,24,20,0],[150,-148,24,26,24,0],[145,-190,26,24,24,0],
    [104,-215,26,24,23,0],[143,-236,26,24,22,0],[77,-250,24,24,22,0],
    [17,-257,24,18,12,0],
    // Low brick blocks behind the SoHo end fence close the south avenue view.
    // All plinths stand on the existing outside-city asphalt, beyond z=170.
    [-48,189,20.4,18,15.1,1,sohoLoadingHall],[-18,207,22.8,22,20.6,3,sohoPressAnnex],[14,184,18,18,18,1],
    [48,212,24,20,36,1],[78,191,18,18,25,3],
    ...waterworksResidences,
  ];
  B('concrete',-82.1,-.65,-132.5,35.8,1.1,105,0x576a71);
  B('concrete',104.6,-.65,-132.5,40.8,1.1,105,0x576a71);
  // Coplanar foundations meet edge-to-edge, not as overlapping pads. The
  // original four north blocks also gain real supporting background ground.
  // All three rectangles stay outside the playable union.
  B('concrete',151.5,-.65,-174,53,1.1,188,0x576a71); // x[125,178], z[-268,-80]
  // Keep the old service foundations outside the open sunken freight street.
  const {minX,maxX,minZ,maxZ}=freightWell;
  for(const [x1,x2,z1,z2] of [[-100,minX,-268,-185],[maxX,125,-268,-185],
    [minX,maxX,-268,minZ],[minX,maxX,maxZ,-185]]){
    B('concrete',(x1+x2)/2,-.65,(z1+z2)/2,x2-x1,1.1,z2-z1,0x576a71);
  }
  B('concrete',10,-.65,-182.6,148,1.1,4.8,0x576a71); // joins north edge at -180.2
  function background(x,z,w,d,height,variant,terminus){
    const footprint={minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2};
    if(touchesPlayable(footprint,mapPlan.currentOutline.points))return;
    stats.backgroundBuildings++;stats.backgroundFootprints.push({...footprint,height,outsidePlayable:true});
    if(terminus){
      terminus({box:B,beam:L,collider:C},x,z);
      return;
    }
    buildSkylineProperty(B,x,z,w,d,height,variant,Math.abs(x)>Math.abs(z)*.55,C);
  }
  for(const args of backgrounds)background(...args);
  stats.triangles=(stats.boxes+stats.beams)*12;
  stats.textureSource='Existing authored project materials; no external assets';
  return {stats};
}

function touchesPlayable(rect,polygon){
  const samples=[[rect.minX,rect.minZ],[rect.maxX,rect.minZ],[rect.maxX,rect.maxZ],[rect.minX,rect.maxZ]];
  for(const p of samples)if(pointInPolygon(p[0],p[1],polygon))return true;
  for(const p of polygon)if(p[0]>=rect.minX&&p[0]<=rect.maxX&&p[1]>=rect.minZ&&p[1]<=rect.maxZ)return true;
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length];
    // Clip each boundary segment against both slabs, including diagonal streets.
    let enter=0,leave=1;
    for(const [axis,min,max] of [[0,rect.minX,rect.maxX],[1,rect.minZ,rect.maxZ]]){
      const delta=b[axis]-a[axis];
      if(delta===0){
        if(a[axis]<min||a[axis]>max){leave=-1;break;}
      }else{
        const lo=(min-a[axis])/delta,hi=(max-a[axis])/delta;
        enter=Math.max(enter,Math.min(lo,hi));leave=Math.min(leave,Math.max(lo,hi));
      }
    }
    if(enter<=leave)return true;
  }
  return false;
}
function pointInPolygon(x,z,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
