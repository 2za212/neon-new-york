import * as T from 'three';

/** Original SoHo first-floor and service-court dressing. All opaque geometry
 * joins the city batch. Door, footpath and umbrella corridors remain clear. */
export function addSoHoDetail(scene,api,buildings){
  const {box,beam,materials,colliders,sign,rand=Math.random}=api;
  const stats={boxes:0,beams:0,triangles:0,colliders:0,signs:0,pointLights:0,
    windowStories:0,bladeSigns:0,serviceClusters:0,sidewalkSlabs:0,independentDrawCalls:0};
  const lights=[],signs=[],routes=[],fixtures=[],nightMaterials=[];
  const B=(...a)=>{stats.boxes++;box(...a);},L=(...a)=>{stats.beams++;beam(...a);};
  function C(x,y,z,w,h,d,id){const b=new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2));b.userData={sohoDetail:id};colliders.push(b);fixtures.push({id,min:b.min.toArray(),max:b.max.toArray()});stats.colliders++;return b;}
  function mat(key,base,opts={}){if(!materials[key]){const m=materials[base].clone();Object.assign(m,opts);m.name='SoHo street finish / '+key;m.userData={...materials[base].userData};materials[key]=m;}return key;}
  const zinc=mat('sohoDetailZinc','metal',{color:new T.Color('#b2bfb9'),metalness:.42,roughness:.71});
  const iron=mat('sohoDetailIron','sampleIron',{color:new T.Color('#718981'),metalness:.45,roughness:.68});
  const oak=mat('sohoDetailOak','wood',{color:new T.Color('#d9c3a0'),roughness:.84});
  const paper=mat('sohoDetailPaper','samplePaper',{color:new T.Color('#c8c0a4'),roughness:.97});
  const coral=mat('sohoDetailCoral','sampleRed',{color:new T.Color('#b86b62'),roughness:.88});
  const teal=mat('sohoDetailTeal','sampleTeal',{color:new T.Color('#5b8e88'),roughness:.78});
  const cream=mat('sohoDetailCream','sampleCream',{color:new T.Color('#d4cbb0'),roughness:.78});
  const basalt=mat('sohoDetailBasalt','sampleStreetBasalt',{color:new T.Color('#94a7aa'),roughness:.80});
  const wet=mat('sohoDetailDampEdge','sampleStreetWetCurb',{color:new T.Color('#a9c3c7'),roughness:.43,metalness:.055});
  const cyan=mat('sohoDetailCyan','cyan',{color:new T.Color('#92e6df'),emissive:new T.Color('#4fd8d7'),emissiveIntensity:1.75,roughness:.42});
  const magenta=mat('sohoDetailMagenta','magenta',{color:new T.Color('#ec95bf'),emissive:new T.Color('#e05b9d'),emissiveIntensity:1.50,roughness:.45});
  const amber=mat('sohoDetailAmber','lamp',{color:new T.Color('#e7c7a2'),emissive:new T.Color('#ffc08b'),emissiveIntensity:.74,roughness:.55});
  for(const [key,power]of [[cyan,1.75],[magenta,1.50],[amber,.74]]){materials[key].userData.castShadow=false;nightMaterials.push([materials[key],power]);}
  const shade=(s=.1)=>new T.Color().setScalar(1-s/2+rand()*s);
  function frame(x,z,rotation=0){
    const c=Math.cos(rotation),s=Math.sin(rotation),P=(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c];
    return {P,rotation,B:(m,u,y,v,w,h,d,col=0xffffff)=>B(m,...P(u,y,v),w,h,d,col,rotation),
      L:(m,a,b,w=.04,col=0xffffff)=>L(m,P(...a),P(...b),w,w,col),
      C:(u,y,v,w,h,d,id)=>{const p=P(u,y,v);return C(...p,Math.abs(c)*w+Math.abs(s)*d,h,Math.abs(s)*w+Math.abs(c)*d,id);},
      label(u,y,v,w,h,title,sub,color='#9adbd5',angle=0,vertical=false){if(!sign)return;const m=sign(...P(u,y,v),w,h,title,sub,color,rotation+angle,vertical);if(m){m.material.color.setHex(0x92a5a1);m.material.emissiveIntensity=.84;m.material.roughness=.71;signs.push(m);}stats.signs++;}};
  }
  function packageBox(f,u,y,v,w=.27,h=.30,d=.26,color=0xffffff){
    f.B(paper,u,y,v,w,h,d,color);f.B(cream,u,y+h*.13,v+d/2+.009,w*.54,h*.28,.012);
    f.B(iron,u,y+h/2+.006,v,.018,.012,d);
  }
  function poster(f,u,y,v,type=0){
    f.B(zinc,u,y,v,.70,.96,.07);f.B(paper,u,y,v+.044,.62,.88,.014,type%2?0xacb8a2:0xc1ae94);
    f.B(type%2?teal:coral,u,y+.17,v+.056,.42,.23,.012);
    for(let i=0;i<4;i++)f.B(iron,u-.015,y-.04-i*.10,v+.059,.43-i*.055,.025,.009,0x748e86);
    for(const dx of [-.26,.26])for(const dy of [-.39,.39])f.B(zinc,u+dx,y+dy,v+.062,.025,.025,.012);
  }
  function servicePanel(f,u,y=1.45,v=.23){
    f.B(zinc,u,y,v,.60,1.36,.20);f.B(iron,u,y,v+.112,.48,1.18,.026);
    for(let i=0;i<6;i++)f.B(zinc,u,y-.43+i*.11,v+.133,.36,.025,.025);
    f.B(cyan,u+.13,y+.39,v+.137,.06,.08,.016);f.B(coral,u-.10,y+.39,v+.137,.07,.045,.016);
    f.C(u,y,v,.62,1.38,.24,'wall-service-panel');
  }
  const byID=new Map(buildings.map(b=>[b.id,b]));
  // Shopfronts now tell different stories at the same hand-sized grain as the
  // sample deli/record shop. Every display is behind its existing window C.
  for(const [id,kind]of [['soho_lafayette','tailor'],['soho_broome','coffee'],['soho_mercer_grocer','grocer'],['soho_greene_books','books'],['soho_sullivan','fresh-cut'],['soho_spring','audio']]){
    const b=byID.get(id);if(!b)continue;const d=b.bounds,f=frame(d.x,d.z,d.rot),w=d.width;
    stats.windowStories++;
    // Lower dado reeds, cast-iron fasteners and a narrow brass sill. The door
    // at +width*.24 has no added frame/collider inside its original opening.
    for(let u=-w/2+.43;u<w*.24-.99;u+=.22){f.B(iron,u,.68,.221,.025,.45,.024);if(Math.round(u*100)%3===0)f.B(zinc,u,.93,.228,.035,.035,.012);}
    f.B(zinc,-w*.20,1.085,.239,w*.49,.045,.065,0xb1b9a2);
    for(const u of [-w*.45,w*.45]){
      f.B(zinc,u,3.96,.22,.10,.11,.08);f.L(zinc,[u,3.94,.27],[u,3.34,.70],.045);
    }
    f.B(oak,-w*.23,1.15,-.40,w*.44,.10,.53);f.B(iron,-w*.23,.91,-.44,w*.43,.39,.38);
    if(kind==='books'){
      for(let lane=0;lane<3;lane++)for(let i=0;i<15;i++){
        const u=-w*.42+lane*1.05+i*.020,y=1.40+(i%4)*.035;
        f.B(i%3?paper:teal,u,y,-.45,.050,.42,.30,shade(.22));
      }
      for(let j=0;j<3;j++){
        const u=-w*.42+j*1.20;f.B(j%2?coral:cream,u,1.89,-.39,.64,.78,.065);
        f.B(iron,u,1.94,-.349,.34,.27,.013);f.B(cyan,u,1.71,-.338,.39,.035,.012);
      }
      f.label(-w*.22,2.58,-.15,3.4,.40,'PRINT / MEMORY','BOOKS  •  OPEN TILL 02:00','#e5c6b0');
      // Low front display plinth stops well before the clear doorU corridor.
      poster(f,-w/2+.65,2.18,-.11,1);
    }else if(kind==='grocer'){
      for(let j=0;j<5;j++){
        const u=-w*.42+j*.82;
        f.B(oak,u,1.32,-.40,.72,.22,.48);f.B(zinc,u,1.45,-.12,.72,.045,.030);
        for(let q=0;q<8;q++)f.B(j%2?'leaf':coral,u-.25+(q%4)*.16,1.49+Math.floor(q/4)*.065,-.48+Math.floor(q/4)*.21,.12,.12,.12,shade(.18));
        f.B(paper,u,1.36,-.135,.24,.13,.018);f.B(iron,u,1.36,-.12,.12,.022,.009);
      }
      f.label(-w*.24,2.50,-.17,3.3,.40,'FRESH / HYDRO','NEIGHBOURHOOD GROWN','#b7dfad');
      // A refrigerator has a lit vertical jamb and tiny shelf labels, not a
      // glowing full-size glass rectangle.
      f.B(iron,-w*.42,2.07,-2.78,.64,1.72,.52);f.B('districtGlass',-w*.42,2.07,-2.50,.52,1.52,.025);
      f.B(cyan,-w*.42-.27,2.07,-2.478,.020,1.48,.018);
      for(let q=0;q<4;q++){f.B(zinc,-w*.42,1.43+q*.37,-2.47,.50,.035,.020);for(let i=0;i<3;i++)packageBox(f,-w*.42-.17+i*.17,1.59+q*.37,-2.61,.12,.21,.16);}
      f.C(-w*.42,2.07,-2.78,.64,1.72,.52,'grocer-refrigerator');
    }else if(kind==='coffee'){
      f.B(zinc,-w*.31,1.51,-.43,1.12,.57,.45);f.B(iron,-w*.31,1.66,-.17,.94,.22,.055);
      for(const u of [-w*.31-.25,-w*.31+.25]){f.B(zinc,u,1.43,-.12,.09,.18,.09);f.B(cream,u,1.32,-.10,.14,.16,.14);}
      for(let i=0;i<7;i++){const u=-w*.12+i*.24;f.B(cream,u,1.28,-.40,.15,.18,.16);f.B(coral,u,1.30,-.312,.11,.032,.014);}
      for(let i=0;i<5;i++)packageBox(f,-w*.39+i*.42,1.53,-.58,.31,.47,.25,i%2?0xa1b5a1:0xd0ac8d);
      f.label(-w*.20,2.55,-.16,3.1,.40,'NIGHT SHIFT','ESPRESSO / 24H','#e7bc9b');
      poster(f,-w/2+.58,2.17,-.12,0);
    }else if(kind==='tailor'){
      for(let i=0;i<4;i++){
        const u=-w*.42+i*.83;f.B(iron,u,1.36,-.46,.07,.45,.07);f.B(zinc,u,1.15,-.46,.44,.045,.40);
        f.B(i%2?teal:coral,u,1.99,-.45,.49,.83,.30);f.B(cream,u,2.51,-.45,.23,.27,.23);
        f.B(iron,u,1.79,-.283,.025,.57,.018);for(const e of [-1,1])f.B(oak,u+e*.35,2.22,-.45,.23,.48,.25);
      }
      f.label(-w*.23,2.89,-.13,3.3,.32,'REWORK / AUGMENT','TAILORING  /  2086','#d7b5bf');
    }else if(kind==='audio'){
      for(let j=0;j<4;j++){
        const u=-w*.42+j*1.02;f.B(iron,u,1.65,-.44,.72,.90,.42);
        for(const y of [1.44,1.86]){f.B('rubber',u,y,-.210,.43,.32,.026);f.B(zinc,u,y,-.186,.15,.12,.018);}
      }
      f.B(cyan,-w*.22,2.42,-.24,w*.42,.045,.065);f.label(-w*.23,2.82,-.13,3.5,.35,'AFTER / FREQUENCY','ANALOG  ×  NEURAL AUDIO','#a6e1e1');
    }else if(kind==='fresh-cut'){
      for(let j=0;j<5;j++){
        const u=-w*.40+j*.84;
        f.B(zinc,u,1.28,-.43,.73,.10,.50);
        for(let n=0;n<3;n++){
          f.B(coral,u-.19+n*.18,1.37+n*.018,-.43,.22,.082,.36);
          f.B(cream,u-.17+n*.18,1.415+n*.018,-.43,.045,.02,.32);
        }
      }
      f.label(-w*.23,2.64,-.13,3.8,.42,'今日鲜切','吊龙 / 胸口油 / 肥牛','#ffc08a');
    }
    // Street side small notices and utilities fit inside .55m of the wall.
    // On the main avenue they stay at |x| >= 10.10, away from both umbrella lanes.
    servicePanel(f,-w/2+.48,1.50,.22);
    for(const y of [.62,1.93,2.82])f.B(zinc,-w/2+.22,y,.27,.22,.055,.18);
    f.B(zinc,-w/2+.22,1.72,.24,.055,2.35,.055);
    f.B(iron,-w/2+.16,.44,.44,.35,.10,.38);
    for(let i=0;i<7;i++)f.B(zinc,-w/2+.04+i*.041,.498,.44,.019,.016,.30);
    for(let i=0;i<5;i++)f.B(i%3?paper:coral,-w*.43+rand()*.67,.383,.28+rand()*.15,.035+rand()*.07,.008,.06,shade(.16));
    routes.push({id,doorClearU:w*.24,clearWidth:1.4,propsMaximumOut:.55});
  }

  // Visible down the avenue: four double-sided blade signs sit higher than the
  // shop awnings and do not occupy the firefighting platforms at local u<0.
  const blades=[['soho_broome','CAFE','#e5a1c6',magenta],['soho_mercer_grocer','HYDRO','#9ce4d9',cyan],['soho_greene_books','BOOKS','#e4b1d1',magenta],['soho_spring','AUDIO','#a4e5e5',cyan]];
  for(const[id,title,color,glow]of blades){
    const b=byID.get(id);if(!b)continue;const d=b.bounds,f=frame(d.x,d.z,d.rot),u=d.width*.405,y=6.24,v=1.26;
    f.B(iron,u,y,v,.23,3.02,1.13);f.C(u,y,v,.25,3.02,1.13,id+'-blade');
    for(const yy of [4.90,7.58]){f.B(zinc,u,yy,.62,.14,.13,1.50);f.L(zinc,[u,yy+.38,.22],[u,yy,1.04],.065);}
    for(const out of [.76,1.79])f.B(glow,u-.136,y,out,.035,2.87,.044);
    for(const side of [-1,1])f.label(u+side*.16,y,v,.88,2.65,title,'SOHO',color,side*Math.PI/2,true);
    stats.bladeSigns++;
  }
  // The shared road kit owns the new large sidewalk slabs. Only the narrow
  // shop-edge stone and damp gutter are dressed here; walking stays at .36.
  for(const e of [-1,1])for(const[a,b]of [[53,76.5],[90.4,121.6],[134.2,144.4],[155.0,158.4]]){
    for(let z=a;z<b;z+=1.09){const end=Math.min(z+1.06,b);B(basalt,e*9.17,.370,(z+end)/2,.10,.020,end-z,shade(.06));}
    B(wet,e*6.13,.195,(a+b)/2,.28,.009,b-a,shade(.05));
  }
  for(const e of [-1,1])for(const z of [61.4,93.0,116.8,141.8]){
    B('rubber',e*6.69,.375,z,.30,.012,.92);
    for(let j=0;j<9;j++)B(zinc,e*6.69,.385,z-.39+j*.097,.27,.008,.030,0xa1aca4);
  }
  // Underground data link markers read as buried infrastructure, rather than
  // an unmotivated luminous line through the drivable avenue.
  for(const e of [-1,1])for(const z of [55.8,63.6,71.4,94.0,102,110,118]){
    B(zinc,e*9.13,.397,z,.13,.035,.34);B(cyan,e*9.131,.419,z,.052,.012,.14);
  }

  // Night market: cable suspension, small warm bulbs and a purple/cyan payment
  // terminal accompany existing real produce stalls. The x=-27 lane is clear.
  const market=frame(-35.8,64.9,0);
  market.L(iron,[-5.0,3.80,-1.7],[5.0,3.58,-1.7],.024);
  market.L(iron,[-5.0,3.80,2.25],[5.0,3.58,2.25],.024);
  for(const v of [-1.7,2.25])for(let i=0;i<11;i++){
    const u=-4.8+i*.93,y=3.79-(u+5)*.022;
    market.B(zinc,u,y-.09,v,.028,.19,.028);market.B(i%4?amber:magenta,u,y-.23,v,.095,.10,.095);
  }
  for(const u of [-4.9,4.9])for(const v of [-1.7,2.25]){market.B(zinc,u,2.06,v,.055,3.40,.055);market.C(u,2.06,v,.075,3.40,.075,'market-light-post');}
  market.B(iron,1.32,1.73,.62,.20,.42,.19);market.B(cyan,1.32,1.79,.73,.15,.22,.018);
  market.B(iron,1.32,1.51,.67,.29,.08,.30);
  market.B(teal,-3.25,.77,1.18,.68,.82,.62);market.C(-3.25,.77,1.18,.68,.82,.62,'market-return-crate');
  for(let i=0;i<6;i++)market.B(zinc,-3.49+i*.095,.97,1.50,.035,.37,.022);
  market.label(-.5,3.91,2.39,4.6,.46,'NIGHT / HARVEST','FRESH  /  CLOSED-LOOP GROWERS','#b6e4d8');
  stats.serviceClusters++;
  // Loading area micro-stories stay against the western/end walls, beyond the
  // tested service alley and market approach. Individual solids match visuals.
  const press=frame(-40.8,113.3,-Math.PI/2);
  press.B(zinc,0,1.52,.20,1.50,1.84,.34);press.B(iron,0,1.52,.385,1.25,1.58,.035);
  for(let q=0;q<10;q++)press.B(zinc,0,.91+q*.105,.414,1.15,.035,.038);
  press.C(0,1.52,.20,1.5,1.84,.34,'press-vent');poster(press,1.60,1.92,.15,1);
  for(const u of [-1.18,2.26]){press.B(zinc,u,2.11,.18,.075,3.0,.075);for(const y of [.88,2.1,3.3])press.B(iron,u,y,.18,.23,.08,.19);}
  for(let j=0;j<4;j++)packageBox(press,-1.2+j*.47,.60,.30,.41,.44,.38,shade(.2));
  press.C(-.49,.60,.30,1.82,.44,.38,'press-parcels');stats.serviceClusters++;
  // A service kiosk backs onto the east-court building, leaving the x31 route
  // and both seated/standing pockets untouched.
  const court=frame(26.0,104.1,Math.PI/2);
  court.B(iron,0,1.55,.26,1.30,2.38,.50);court.C(0,1.55,.26,1.30,2.38,.50,'court-kiosk');
  court.B(teal,0,1.55,.527,1.12,2.18,.032);
  court.B(cyan,-.10,1.99,.551,.71,.72,.018);court.B(iron,-.10,1.99,.566,.58,.56,.014);
  for(let j=0;j<4;j++){court.B(paper,-.29+j*.19,1.98,.579,.10,.38,.012);court.B(magenta,-.29+j*.19,1.71,.581,.09,.025,.014);}
  court.B(iron,.41,1.32,.556,.17,.35,.025);court.B(cyan,.41,1.41,.575,.08,.09,.012);
  court.B('rubber',-.14,.88,.557,.70,.15,.026);court.B(zinc,-.14,.79,.582,.79,.055,.09);
  court.label(0,2.94,.30,1.8,.36,'MEMORY / EXCHANGE','LOCAL PRINT / CITY DATA','#e6b0ce');stats.serviceClusters++;

  // Three local bounce pools; the parent chooses visible point lights by its
  // existing fixed budget. They cast no additional dynamic shadows.
  for(const[id,u,color,power]of [['soho_broome',-.1,'#e580bd',17],['soho_mercer_grocer',-1.1,'#80dfd6',19],['soho_greene_books',-.7,'#b69acb',15]]){
    const d=byID.get(id)?.bounds;if(!d)continue;const f=frame(d.x,d.z,d.rot),l=new T.PointLight(color,power,9,2);l.position.set(...f.P(u,2.83,1.0));l.castShadow=false;l.name='SoHo storefront bounce / '+id;l.userData.nightPower=power;scene.add(l);lights.push(l);
  }
  stats.pointLights=lights.length;stats.triangles=(stats.boxes+stats.beams)*12;
  function setNight(night){for(const l of lights)l.intensity=l.userData.nightPower*(night?1:.12);for(const[m,p]of nightMaterials)m.emissiveIntensity=p*(night?1:.38);for(const m of signs)m.material.emissiveIntensity=night?.84:.33;}
  setNight(true);
  return {stats,lights,routes,fixtures,signs,steamSources:[[6.69,61.4,'#a9d5d2',.389],[-6.69,93,'#cbb3cb',.389]],
    emissives:nightMaterials.map(([material,nightIntensity])=>({material,nightIntensity,duskIntensity:nightIntensity*.38})),setNight,setQuality(){}};
}
