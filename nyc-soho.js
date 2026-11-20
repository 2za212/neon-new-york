import {addGreeneCorners} from './nyc-soho-corners.js';
import {upperStreetKit,buildSohoAirRights} from './nyc-tenement-air-rights.js';
import * as T from 'three';
import {createDistrictKit,subtractRect} from './nyc-district-kit.js';
import {addSoHoDetail} from './nyc-soho-detail.js';
import {addSoHoInfill} from './nyc-soho-infill.js';
import {buildBoilerMarket} from './nyc-soho-boiler-market.js';
import {buildMarketColdChain} from './nyc-suspended-delivery.js';
import {buildMarketLaneHomes} from './nyc-market-lane-homes.js';
import {buildFultonHouse,fulton} from './nyc-fulton-house.js';
import {housingBond} from './nyc-housing-bond.js';
import {voxelBay} from './nyc-fulton-modules.js';

/** South batch: continuous cast-iron street walls, two open shops and courts.
 * Ground ownership deliberately excludes the park's x>=44 / z<96 rectangle.
 */
export function addSoHo(scene,api){
  const {box,beam,materials,colliders,surface,sign,tree,lamp,bench,planter,rand=Math.random}=api;
  const k=createDistrictKit(scene,api),before=colliders.length;
  const own={boxes:0,beams:0,signs:0,treeBoxes:0,trees:0},marketLights=[],buildingResults=[];
  const B=(...a)=>{own.boxes++;box(...a);};const L=(...a)=>{own.beams++;beam(...a);};
  const C=(x,y,z,w,h,d,id)=>{const b=new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2));b.userData={district:'soho',id};colliders.push(b);return b;};
  const tint=(spread=.12)=>{const v=1-spread*.5+rand()*spread;return new T.Color(v,v,v);};
  const label=(...a)=>{if(sign){sign(...a);own.signs++;}};
  if(!materials.sohoCanvas){const m=(materials.lifeCanvas||materials.trim).clone();m.name='SoHo / muted market canvas';m.color=new T.Color(0x708168);m.roughness=.96;m.userData={...(materials.lifeCanvas||materials.trim).userData};materials.sohoCanvas=m;}
  const bounds={minX:-64,maxX:84,minZ:52,maxZ:160};
  const pavingExclusions=api.roadRegistry.pavingExclusions||(api.roadRegistry.pavingExclusions=[]);
  function paved(minX,maxX,minZ,maxZ){
    const patch={minX,maxX,minZ,maxZ};
    let pieces=[patch];
    for(const existing of pavingExclusions)pieces=pieces.flatMap(p=>subtractRect(p,existing));
    for(const p of pieces)k.ground(p.minX,p.maxX,p.minZ,p.maxZ,'paver',.36);
    pavingExclusions.push(patch);
  }
  k.ground(-64,44,52,96,'asphalt',.18);
  k.ground(-64,84,96,160,'asphalt',.18);
  // Shared registry is flushed by the parent after both southern and park roads
  // are present. This module never paints a second set of intersection curbs.
  // Low paired market awnings set a broken cornice along the block. Their
  // gaps keep storefront entries and the cross-street view clear.
  for(const side of [-1,1])for(const [z,length] of [[59,12.2],[71.1,11.8],[98,12.0],[110.3,12.4]]){
    const shift=side===1&&z>90?(z===98?-2.80:-2.48):0;
    // Three terraced courses expose the 16 cm construction step from across the street.
    for(let course=0;course<3;course++){
      B('sohoCanvas',side*(7.52+1.28*course)+shift,3.84+.16*course,z,1.28,.32,length,0xb5c4be);
    }
    for(let bay=0;bay<5;bay++)
      voxelBay(scene,'awning',[side*6.91+shift,3.54,z+(bay-2)*length/5],-side*Math.PI/2,length/5,1.38,.58);
    // Projecting shop lanterns face pedestrians approaching along the canopy.
    const end=z-length/2+.42;
    for(const dir of [-1,1])
      voxelBay(scene,'lantern',[side*7.83+shift,3.30,end+dir*.14],dir>0?0:Math.PI,1.52,1.18,.46);
    C(side*7.83+shift,3.30,end,1.52,1.18,1.02,'market-lantern');
    B('lamp',side*9.85+shift,3.96,z,.10,.055,length-.36,0xd99164);
    for(let course=0;course<3;course++)C(side*(7.52+1.28*course)+shift,3.84+.16*course,z,1.28,.32,length,'market-awning');
  }
  k.roadZ(0,52,160,12.8,2.8);
  k.roadZ(-48,52,160,8.8,2.8);
  k.roadZ(58,96,160,9.6,2.8);
  k.roadX(84,-64,44,10,2.8);
  k.roadX(128,-64,84,10,2.8);
  k.roadX(150,-48,58,8.8,2.8);

  // Cold utility plant above the southern street wall, separated from the
  // warm shop band by several dark floors. The two setbacks expose its crown.
  for(const [y,w,h] of [[21,10.5,8],[27.1,7.8,4.2],[31.1,4.2,3.8]]){
    B('metal',-15,y,115,w,h,9,0x85949d);
    B('trim',-15,y+h/2,115,w+.35,.3,9.4,0x8796a7);
  }
  B('cyan',-15,32.7,110.42,4.1,.19,.16);
  for(const [x,z] of [[-9.95,59.3],[9.95,58.2],[-9.95,70.4],[9.95,71.2],[-9.95,99]]){
    B('lamp',x,2.92,z,.23,.32,1.35,0xffc590);
    const lamp=new T.PointLight(0xffad6c,64,8.5,2);
    lamp.position.set(x,2.75,z);lamp.userData.nightPower=64;
    scene.add(lamp);marketLights.push(lamp);
  }
  // A distribution substation sits astride the southern avenue. Higher
  // setbacks leave open sky beneath its occupied main span and above the shops.
  for(const side of [-1,1]){
    const x=side*15;
    B('metal',x,18.3,101,8.8,11,11,0x74818f);
    C(x,18.3,101,8.8,11,11,'grid-pier');
    B('metal',x,24.5,101,10.5,1.4,12,0x899ca4);
    B('glass',x,21.6,95.36,6.9,2.2,.22);
    B('lamp',x,23.3,95.28,4.6,.14,.20,0xfabc65);
  }
  B('metal',0,18.2,101,23,4.6,6.3,0x677588);
  C(0,18.2,101,23,4.6,6.3,'grid-gallery');
  B('metal',0,15.75,101,23.7,.55,7.2,0x44495c);
  B('metal',-3,21.7,101,15,2.5,5.4,0x778999);
  for(let x=-10;x<=10;x+=2.5)B('glass',x,18.7,97.76,1.95,1.4,.16);
  for(const face of [-1,1]){
    const edge=101+face*3.34;
    B('metal',0,19.75,edge,22.6,.7,.58,0x87959a);
    for(const [x,w] of [[-6.95,6.9],[1.8,8.8],[8.15,2.25]]){
      B('coolWindow',x,19.74,edge+face*.33,w,.43,.12);
    }
    for(const x of [-9,-5,0,5,9]){
      L('metal',[x-1.00,15.52,edge],[x+.28,17.1,edge],.34,.42,0xb4a68f);
    }
    B('lamp',-8.7,17.15,edge+face*.25,2.75,.44,.14,0xeea656);
  }
  label(2.5,17.3,97.63,10.6,1.5,'GRID  /  09','SOUTH FEED   |   ONLINE','#eabb73',Math.PI);
  const definitions=[
    {id:'soho_lafayette',x:-10.65,z:58.8,width:10.4,depth:12.5,floors:4,rot:Math.PI/2,title:'LAFAYETTE / TAILOR',subtitle:'CAST IRON / SOHO',brick:'brickBrown',accent:'warm'},
    {id:'soho_broome',x:10.65,z:58.8,width:10.4,depth:12.8,floors:3,rot:-Math.PI/2,title:'BROOME / CAFE',subtitle:'COFFEE / DAILY',brick:'brick',accent:'warm'},
    {id:'soho_mercer_grocer',frontage:'display',x:10.65,z:70.3,width:10.8,depth:13,floors:4,rot:-Math.PI/2,title:'MERCER / GROCER',subtitle:'PRODUCE / PANTRY',brick:'brickBrown',accent:'warm',open:true,furniture:'grocer'},
    {id:'soho_greene_books',frontage:'display',x:-10.65,z:98.7,width:12,depth:14,floors:4,rot:Math.PI/2,title:'GREENE / BOOKS',subtitle:'BOOKS / PRINT / READING',brick:'brickBrown',accent:'warm',open:true,furniture:'books'},
    {id:'soho_sullivan',x:7.85,z:98.7,width:12,depth:13.8,floors:3,rot:-Math.PI/2,title:'七街沸社',subtitle:'鲜切肉铺 / 夜班开放',brick:'stone',accent:'warm',open:true,furniture:'grocer'},
    {id:'soho_wooster',x:-10.65,z:112,width:12,depth:13.2,floors:3,rot:Math.PI/2,title:'WOOSTER / ARCHIVE',subtitle:'PRINT / EDITIONS',brick:'stone',accent:'warm'},
    {id:'soho_spring',x:8.17,z:112,width:12,depth:14.2,floors:5,rot:-Math.PI/2,title:'SPRING / STUDIO',subtitle:'AUDIO / AFTER HOURS',brick:'brick',accent:'cool'},
    {id:'soho_residential',x:-10.65,z:139.2,width:6,depth:11.6,floors:4,rot:Math.PI/2,title:'',subtitle:'',brick:'brickBrown',accent:'warm'},
    {id:'soho_canal',x:10.65,z:139.2,width:6,depth:12,floors:4,rot:-Math.PI/2,title:'CANAL / WORKS',subtitle:'LOCAL / REPAIR',brick:'brickBrown',accent:'warm'},
    {id:'soho_press',x:-39.6,z:107.7,width:20,depth:9.6,floors:3,rot:-Math.PI/2,title:'SOHO / PRESS',subtitle:'LOADING / LOCAL EDITIONS',brick:'brickBrown',accent:'warm'},
    {id:'soho_crosby',x:66.8,z:108,width:20,depth:15,floors:4,rot:-Math.PI/2,title:'CROSBY / LOFTS',subtitle:'STUDIOS / EAST BLOCK',brick:'brick',accent:'cool'}
  ];
  buildFultonHouse({scene,B,bond:housingBond(materials,B,api.panel),panel:api.panel,C,label,surface,hallLight(x,y,z,hue,power){
    const lamp=new T.PointLight(hue,power,5.4,2);
    lamp.position.set(x,y,z);lamp.userData.nightPower=power;scene.add(lamp);marketLights.push(lamp);
  }});
  paved(3.84,6.4,91.2,119.2);
  for(const d of definitions){
    buildingResults.push(k.building(d));
    // Generous cast-iron frontage aprons bridge the small setback behind the
    // 2.8m sidewalks, including the two real open-room thresholds.
    if(Math.abs(d.x)===10.65){
      if(d.x<0)paved(-9.35,-9.2,d.z-d.width/2,d.z+d.width/2);
      else paved(9.2,9.35,d.z-d.width/2,d.z+d.width/2);
    }
  }

  // Three courts are bounded by useful building backs and connected by a 3.6m
  // service lane. No large rectangular collider encloses a whole courtyard.
  paved(-40.8,-26,56,76.2);
  // The service lane crosses the two horizontal roads at road grade. Its raised
  // paving is split before those asphalt intervals, with normal .18m curbs.
  for(const [a,b]of [[52,79],[89,123],[133,142.2]])paved(-28.6,-25,a,b);
  paved(26.2,50.4,91.8,120.2);
  paved(24,48.5,135.9,142.8);
  paved(-40.8,-30.1,94.2,97.7);
  paved(-40.8,-30.1,117.7,120.2);
  // A quiet public bench pocket after the west loading frontage.
  paved(-40.8,-26.2,135.9,142.8);

  function crate(x,y,z,w=.66,d=.52){
    B('wood',x,y+.22,z,w,.44,d,0xb19e7c);
    for(const e of [-1,1])for(let j=0;j<4;j++)B('wood',x,y+.065+j*.11,z+e*d/2,w,.06,.035,0xa7a183);
    for(const e of [-1,1])B('metal',x+e*(w/2-.06),y+.22,z,.045,.46,d+.025,0x7f9581);
    C(x,y+.22,z,w,.44,d,'produce-crate');
    for(let i=0;i<12;i++){const xx=x-w*.30+(i%4)*w*.20,zz=z-d*.25+Math.floor(i/4)*d*.22;B(i%4?'leaf':'lifeBread' in materials?'lifeBread':'yellow',xx,y+.49,zz,.10,.10,.10,tint(.15));}
  }
  function marketStall(x,z,w=3.7){
    B('sampleIron' in materials?'sampleIron':'metal',x,.56,z,w,.35,1.30,0x78917a);
    B('wood',x,1.09,z,w+.18,.14,1.42,0xbaab86);
    B('wood',x,.82,z,w,.45,1.18,0xa89d7a);C(x,.83,z,w,.94,1.30,'market-counter');
    for(let tray=0;tray<5;tray++){
      const xx=x-w*.38+tray*w*.19;B('metal',xx,1.19,z,.59,.05,.88,0x8c9e88);
      for(let j=0;j<9;j++)B(tray%2?'leaf':'wood',xx+(j%3-1)*.15,1.27+Math.floor(j/3)*.03,z-.28+(j%3)*.25,.11,.09,.11,tray%2?0xa3b387:0xb39e73);
    }
    for(const e of [-1,1])for(const q of [-1,1]){B('metal',x+e*(w/2-.12),1.72,z+q*.66,.065,2.72,.065,0x93a68d);C(x+e*(w/2-.12),1.72,z+q*.66,.09,2.72,.09,'market-post');}
    for(let row=0;row<5;row++)B('sohoCanvas',x,3.08-Math.abs(row-2)*.055,z-.94+row*.47,w+.44,.10,.52,0xa3ae90);
    for(let u=-w/2;u<w/2;u+=.26)B('sampleCream' in materials?'sampleCream':'white',x+u,2.80,z+1.23,.10,.20,.035,0xa9ac8e);
    B('metal',x,2.74,z+.3,.02,.5,.02,0x8ea287);B('districtWarm',x,2.47,z+.3,.24,.07,.24,0x7b805c);
    C(x,3.0,z,w+.44,.24,2.35,'market-canopy');
  }
  marketStall(-35.8,64.9,3.8);marketStall(-31.2,64.9,2.8);
  for(const [x,z]of [[-38.5,63.5],[-33.3,63.4],[-29.5,63.5],[-38.1,66.8]])crate(x,.36,z);
  label(-35.1,3.31,66.22,5.4,.53,'SPRING MARKET','SOHO / FRESH & LOCAL','#d1bd90');
  // Reusable timber shelving and packing stock form a loading story, not loose
  // trash scattered across the pedestrian route behind the western street wall.
  for(const x of [-37.1,-32.7]){
    for(const e of [-1,1])for(const q of [-1,1])B('metal',x+e*1.70,1.47,95.7+q*.32,.065,2.22,.065,0x8ba38a);
    for(const y of [.68,1.32,1.96,2.56])B('wood',x,y,95.7,3.6,.08,.82,0xaa9f7c);
    for(let j=0;j<7;j++)B('lifePaper' in materials?'lifePaper':'wood',x-1.45+j*.47,1.53,95.7,.38,.33,.68,j%2?0xa5b08f:0xa69b7c);
    C(x,1.48,95.7,3.60,2.30,.88,'press-storage');
  }
  for(const [x,z]of [[-37.4,119.1],[-33.2,119.1],[44,104.2],[44,111.6]]){
    B('metal',x,.56,z,1.55,.18,1.08,0x7e947e);B('wood',x,.79,z,1.47,.28,1.0,0xaa9e7c);
    for(let i=0;i<3;i++)B('lifePaper' in materials?'lifePaper':'wood',x-.43+i*.43,1.10,z,.38,.35,.71,0xa4a386);
    C(x,.89,z,1.57,1.06,1.10,'loading-pallet');
  }
  // The east back lane stays clear at x31, with seating / planting on its edge.
  if(bench){bench(40.0,98.0,0);bench(37,115.5,Math.PI);bench(-34.2,139,0);}
  if(planter){planter(43.7,96.7,5.5,1.1);planter(43.7,117.8,5.5,1.1);planter(-36.4,73.4,3.2,.9);}

  // Low neighbourhood stage, four exact .18m risers, no jump or opaque ramp.
  B('stone',32.5,.70,138.15,10,.68,4.7,0xa7ad94);C(32.5,.72,138.15,10,.72,4.7,'canal-stage');surface(27.5,37.5,135.8,140.5,1.08);
  for(let x=27.64;x<37.5;x+=.25)B('wood',x,1.06,138.15,.235,.04,4.66,0xb6a885);
  for(let i=0;i<4;i++){
    // .66m treads exceed the .62m character diameter, so a standing capsule
    // rests on one real step instead of being lifted early by the next riser.
    const top=.54+i*.18,z=142.81-i*.66;B('stone',32.5,(.36+top)/2,z,3.2,top-.36,.66,0xafb297);C(32.5,(.36+top)/2,z,3.2,top-.36,.66,'stage-step-'+i);surface(30.9,34.1,z-.33,z+.33,top);B('metal',32.5,top+.009,z+.32,3.05,.018,.025,0x81967e);
  }
  for(const x of [28.15,36.85]){
    B('metal',x,1.58,136.5,.17,1.0,.17,0x819b83);B('metal',x,2.11,136.5,.26,.12,.26,0x92a38a);
    B('sampleIron' in materials?'sampleIron':'metal',x,1.72,136.9,.72,1.28,.52,0x728c7b);C(x,1.72,136.9,.72,1.28,.52,'stage-speaker');
    for(let j=0;j<5;j++)B('rubber',x-.26+j*.13,1.72,137.17,.045,1.04,.025,0x8ea18a);
  }
  B('metal',35.0,1.75,138.8,.035,1.32,.035,0xa0ad91);B('metal',35.0,1.12,138.8,.53,.06,.53,0x899c84);B('rubber',35.0,2.44,138.8,.08,.14,.08,0x8b9e86);
  label(32.5,2.47,135.9,4.8,.52,'CANAL / COURT','NEIGHBOURHOOD SESSIONS','#d1bf94');
  for(const x of [27.8,37.2]){B('metal',x,1.55,135.95,.05,.90,.05,0x8aa087);B('districtWarm',x,2.03,135.95,.10,.075,.10,0x82906a);}

  // Three fine-leaf court trees keep a safe geometry margin for the full city.
  for(const [x,z,size]of [[-38.5,73.7,.85],[39.6,111.7,.88],[40,139.0,.86]])if(tree){const t=tree(x,z,size,true);own.treeBoxes+=t?.boxes||0;own.trees++;}
  if(lamp){
    for(const z of [58,72,97,114,138]){lamp(-8.1,z,1);lamp(z===97||z===114?4.06:8.1,z,-1);}
    for(const z of [60,104,138])lamp(-54.0,z,1);
    lamp(64.5,101,-1);
    lamp(64.9,144.2,-1);
  }
  // The new west street wall occupies the former broad edge planting strips.
  // Keep a planted slot between its two middle blocks; no original C/S lived
  // in these decorative strips, and no grass is left coplanar inside shops.
  for(const [z,d]of [[104.85,.70]]){
    B('grass',-60.3,.29,z,4.5,.14,d);B('stone',-57.95,.51,z,.22,.30,d,0xa0aa8c);
    for(let i=0;i<Math.floor(d*3);i++)B('leaf',-59.5-rand()*2.4,.49+rand()*.18,z+(rand()-.5)*(d-.3),.16,.26,.16,tint(.18));
  }
  const marketLight=new T.PointLight(0xffc391,16,8,2);marketLight.position.set(-35.6,2.70,65.4);marketLight.castShadow=false;marketLight.userData.nightPower=16;scene.add(marketLight);marketLights.push(marketLight);
  // One original cast-iron wayfinding gateway announces the southern street.
  // Posts are outside the main avenue's full 2.8m sidewalks; the lowest object
  // above its lanes is the sign frame at y4.825, well above a running jump.
  const markerZ=77.0;
  for(const e of [-1,1]){
    const x=e*10.6;
    B('stone',x,.54,markerZ,.60,.36,.64,0x91a18a);C(x,.54,markerZ,.60,.36,.64,'soho-marker-foot');
    B('districtIron',x,2.91,markerZ,.24,5.10,.28,0xa5b09a);C(x,2.91,markerZ,.24,5.10,.28,'soho-marker-post');
    for(const y of [.84,1.08,4.50,5.31])B('metal',x,y,markerZ,.34,.13,.38,0x8ba18b);
    B('metal',x,3.30,markerZ-.18,.14,2.7,.10,0x789489);
    for(const y of [2.2,3.7])B('districtCool',x,y,markerZ-.242,.048,.42,.025,0x91b4a2);
    L('districtIron',[x,4.94,markerZ],[e*9.08,5.26,markerZ],.12,.12,0x96a48b);
    B('metal',e*9.95,5.22,markerZ,1.12,.18,.38,0x7f9888);
  }
  B('districtIron',0,5.39,markerZ,21.9,.38,.46,0x9eac95);C(0,5.39,markerZ,21.9,.38,.46,'soho-marker-beam');
  B('metal',0,5.62,markerZ,22.12,.08,.56,0x879e8d);
  for(const x of [-9.9,-8.3,-6.7,-5.1,-3.5,3.5,5.1,6.7,8.3,9.9])B('districtCool',x,5.47,markerZ-.257,1.08,.048,.044,0x8caf9b);
  label(0,5.14,76.69,12.0,.43,'SOHO / NIGHT MARKET','GREENE  /  MERCER  /  CANAL','#9ac9bc',Math.PI);
  C(0,5.14,76.69,12.2,.63,.20,'soho-marker-sign');
  const streetMarker={z:markerZ,postX:[-10.6,10.6],postBody:{y:2.91,height:5.10,width:.24,depth:.28},postFeet:{y:.54,height:.36,width:.60,depth:.64},beam:{y:5.39,height:.38,width:21.9,depth:.46},sign:{y:5.14,z:76.69,height:.63,width:12.2,depth:.20,rotation:Math.PI},clearUnderside:4.825};
  addGreeneCorners({B,C,label,surface,materials,marketLights,scene});
  const entries=k.entries;
  const books=entries.find(e=>e.id==='soho_greene_books'),grocer=entries.find(e=>e.id==='soho_mercer_grocer');
  const pointFrom=(p,fallback)=>p?new T.Vector3(...(Array.isArray(p)?p:p.toArray())):new T.Vector3(...fallback);
  const landmarks=[
    {id:'soho_fulton',title:'富尔顿七号公寓',position:new T.Vector3(...fulton.street)},
    {id:'soho_greene_books',title:'格林街书屋',position:pointFrom(books?.street,[-9.45,.36,95.82])},
    {id:'soho_market_court',title:'苏荷街坊市集',position:new T.Vector3(-34.6,.36,70.2)},
    {id:'soho_canal_court',title:'运河街庭院',position:new T.Vector3(32.5,1.08,139.0)}
  ];
  const paths={
    main:[[0,.18,52],[0,.18,84],[0,.18,128],[0,.18,150]],
    westLoop:[[0,.18,128],[-48,.18,128],[-48,.18,84],[0,.18,84]],
    parkConnection:[[0,.18,84],[44,.18,84],[58,.18,84],[58,.18,96],[58,.18,128],[0,.18,128]],
    serviceAlley:[[-27,.36,76.0],[-27,.36,94.0],[-27,.36,118.5],[-27,.36,136.5]],
    market:[[-48,.18,74],[-42,.36,74],[-34.6,.36,70.2]],
    eastCourt:[[31,.36,94],[31,.36,116]],
    stage:[[32.5,.36,143.8],[32.5,.54,142.81],[32.5,.72,142.15],[32.5,.90,141.49],[32.5,1.08,140.83],[32.5,1.08,139.0]]
  };
  const crowdPaths=[
    {id:'soho_west_shopper',a:[-7.3,57],b:[-7.3,74.4],level:.36,look:1,speed:.72},
    {id:'soho_east_reader',a:[5.18,94],b:[5.18,116],level:.36,look:2,speed:.66},
    {id:'soho_back_court',a:[31,98],b:[31,114],level:.36,look:0,speed:.61}
  ];
  const detail=addSoHoDetail(scene,api,buildingResults);
  const infill=addSoHoInfill(scene,api);
  const laneHomes=buildMarketLaneHomes({B,C,materials,panel:api.panel});
  buildSohoAirRights(upperStreetKit(scene,materials,B,C,marketLights),[...definitions,...infill.definitions],surface);
  const boilerMarket=buildBoilerMarket(scene,{B,C,L,surface,label,marketLights});
  const updateColdChain=buildMarketColdChain({scene,box:B,collider:C,sign:label,lights:marketLights});
  Object.assign(paths,boilerMarket.routes);
  crowdPaths.push(...boilerMarket.crowdPaths);
  detail.steamSources.push(...boilerMarket.vents);
  landmarks.push(boilerMarket.landmark);
  const kitStats=k.stats;
  const stats={...kitStats,kit:kitStats,district:'soho',buildings:2+definitions.length+infill.stats.buildings+laneHomes,openShops:entries.length,ownBoxes:own.boxes,ownBeams:own.beams,trees:own.trees,treeBoxes:own.treeBoxes,ownSigns:own.signs,signs:(kitStats.signs||0)+own.signs,colliders:colliders.length-before,
    treeTriangles:own.treeBoxes*12,lights:kitStats.lights+marketLights.length+detail.stats.pointLights+infill.stats.pointLights,pointLights:kitStats.lights+marketLights.length+detail.stats.pointLights+infill.stats.pointLights,detail:detail.stats,infill:infill.stats,independentDrawCalls:0};
  Object.defineProperty(stats,'triangles',{enumerable:true,get:()=>kitStats.triangles+(own.boxes+own.beams)*12+detail.stats.triangles+infill.stats.triangles});
  Object.defineProperty(stats,'boxes',{enumerable:true,get:()=>kitStats.boxes+own.boxes+detail.stats.boxes+infill.stats.boxes});
  stats.signs+=detail.stats.signs+infill.stats.signs;
  stats.triangleScope='Kit plus composed court/stage pieces; treeTriangles are reported separately. Parent batch counts injected street furniture.';
  function setNight(night){k.setNight?.(night);detail.setNight(night);infill.setNight(night);for(const l of marketLights)l.intensity=l.userData.nightPower*(night?1:.16);}
  function setQuality(level){k.setQuality?.(level);detail.setQuality(level);infill.setQuality(level);}
  function update(dt,time,camera){k.update?.(dt,time,camera);updateColdChain(dt,time);}
  setNight(true);
  return {bounds,stats,landmarks,entries,paths,crowdPaths,buildingResults,definitions,streetMarker,detail,infill,setNight,setQuality,update};
}
