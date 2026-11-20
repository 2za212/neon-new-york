import * as T from 'three';

/** A civic, planted counterpart to SoHo: original municipal technology with
 * real fixings, warm shelters and deliberately open public walking routes.
 * Everything is emitted into the city's architecture batch before finish(). */
export function addEastParkDetail(scene,api,{treeLocations=[],terrainIslands=[]}={}){
  const {box,beam,materials,colliders,surface,sign,rand=Math.random}=api;
  const lights=[],fixtures=[],stats={boxes:0,beams:0,triangles:0,colliders:0,surfaces:0,signs:0,
    pointLights:0,bollards:0,plantingClusters:0,slabPieces:0,independentDrawCalls:0};
  const B=(...args)=>{stats.boxes++;stats.triangles+=12;box(...args);};
  const L=(...args)=>{stats.beams++;stats.triangles+=12;beam(...args);};
  const C=(x,y,z,w,h,d,id)=>{const b=new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2));b.userData={eastParkDetail:id};colliders.push(b);fixtures.push({id,bounds:{min:b.min.toArray(),max:b.max.toArray()}});stats.colliders++;return b;};
  const S=(...args)=>{surface(...args);stats.surfaces++;};
  const M=(key,source,opts={})=>{if(!materials[key]){const m=materials[source].clone();Object.assign(m,opts);m.name='NYC East Commons detail / '+key;m.userData={...materials[source].userData};materials[key]=m;}return key;};
  const pale=M('eastDetailConcrete','concrete',{color:new T.Color('#d3d8cd'),roughness:.93});
  const granite=M('eastDetailGranite','stone',{color:new T.Color('#b8c5be'),roughness:.92});
  const metal=M('eastDetailZinc','metal',{color:new T.Color('#a7c0b9'),roughness:.64,metalness:.42});
  const copper=M('eastDetailAgedCopper','metal',{color:new T.Color('#91b2a5'),roughness:.72,metalness:.4});
  const timber=M('eastDetailCedar','wood',{color:new T.Color('#d6c6a3'),roughness:.85});
  const charcoal=M('eastDetailCharcoal','rubber',{color:new T.Color('#a5b8bc'),roughness:.88});
  const earth=M('eastDetailEarth','roof',{color:new T.Color('#9c886d'),roughness:1});
  const warm=M('eastDetailAmber','lamp',{color:new T.Color('#ffdfac'),emissive:new T.Color('#ffc67d'),emissiveIntensity:1.8,roughness:.48});
  const cyan=M('eastDetailCyan','cyan',{color:new T.Color('#8ce8e3'),emissive:new T.Color('#3cc8db'),emissiveIntensity:2.0,roughness:.45});
  const rose=M('eastDetailRose','magenta',{color:new T.Color('#d995bd'),emissive:new T.Color('#c95894'),emissiveIntensity:1.5,roughness:.48});
  const holo=M('eastDetailHolo','cyan',{color:new T.Color('#95e9dd'),emissive:new T.Color('#60d9e4'),emissiveIntensity:1.15,transparent:true,opacity:.48,depthWrite:false,roughness:.7});
  const leaf=M('eastDetailUnderstory','leaf',{color:new T.Color('#718763'),roughness:1});
  const fern=M('eastDetailFern','leaf',{color:new T.Color('#789071'),roughness:1});
  const dry=M('eastDetailDryLeaf','leaf',{color:new T.Color('#a79464'),roughness:1});
  const pink=M('eastDetailFlowers','leaf',{color:new T.Color('#c894b0'),roughness:1});
  const reed=M('eastDetailReed','leaf',{color:new T.Color('#8d9b69'),roughness:1});
  const shadow=M('eastDetailWetStone','stone',{color:new T.Color('#819792'),roughness:.7});
  for(const key of [warm,cyan,rose,holo])materials[key].userData.castShadow=false;
  const shade=(s=.1)=>new T.Color().setScalar(1-s/2+rand()*s);
  function label(x,y,z,w,h,title,sub,rot=0,color='#a1dbd6'){
    if(!sign)return;const mesh=sign(x,y,z,w,h,title,sub,color,rot);
    if(mesh){mesh.material.emissiveIntensity=.95;mesh.material.roughness=.62;}stats.signs++;
  }
  function point(x,y,z,color,power,reach,name){const l=new T.PointLight(color,power,reach,2);l.position.set(x,y,z);l.castShadow=false;l.name='NYC East Commons / '+name;l.userData.nightPower=power;scene.add(l);lights.push(l);}

  // The shared 32 cm paving reaches the park paths. Keep a single wearing
  // surface here so a second cap never intersects the raised block ends.
  // Recessed drainage is kept to the outside edge. These have no false curb
  // collider, and individual slots stop short of the public paving centre.
  for(const [x,z,rot]of [[76.2,27.1,0],[119.6,27.1,0],[76.2,64.7,0],[119.6,64.7,0],[104.9,51.9,Math.PI/2]]){
    B(charcoal,x,.366,z,.92,.012,.22,0xffffff,rot);
    for(let j=0;j<8;j++)B(metal,x+(rot?0:(j-3.5)*.105),.375,z+(rot?(j-3.5)*.105:0),rot?.20:.032,.006,rot?.032:.20,0xffffff,rot);
  }

  // Copper bollards live in planting, at least 1.2m from the three NPC axes.
  // Their split lenses are visible fixtures, not floating light particles.
  const bollards=[[76.8,27.1],[76.8,46],[76.8,64.7],[88,64.7],[101.5,64.7],[118.9,64.7],
    [119.2,27.1],[119.2,40.5],[103.7,47.3],[106,54.6],[117.4,62.2],
    [77.2,-23.7],[88,-23.6],[102,-23.6],[118,-23.6]];
  for(let i=0;i<bollards.length;i++){
    const [x,z]=bollards[i],glow=i%4===0?cyan:warm;
    B(granite,x,.41,z,.43,.10,.43);B(copper,x,.84,z,.18,.88,.18);
    B(charcoal,x,1.24,z,.28,.16,.28);B(glow,x,1.17,z,.19,.07,.19);
    B(metal,x,1.37,z,.31,.06,.31);C(x,.88,z,.43,1.04,.43,'path-bollard');stats.bollards++;
    for(const dx of [-.071,.071])B(metal,x+dx,.80,z+.093,.016,.45,.016);
  }
  // Three low path pools plus the artwork key are the only new point lights.
  // The existing tram lamp supplies its new visible canopy strips; it does not
  // need a duplicate point at the same position. City LightBudget owns activity.
  point(77.1,1.24,45.9,'#ffd097',11,8,'west path amber pool');
  point(118.7,1.25,64.5,'#f0c390',10,8,'wetland south amber pool');
  point(102,1.24,-23.6,'#f0c390',11,9,'northern grove amber pool');

  // A broken octagonal data halo surrounds a voxel tree diagram, so the hero
  // landmark has negative space, grounded iron legs and a serviceable projector.
  // The frame faces the west entrance and never enters z48.7's walking lane.
  const art={x:84,y:3.36,z:45.65,footprint:{minX:82.15,maxX:85.85,minZ:43.45,maxZ:47.85}};
  B(granite,84,.45,45.65,3.7,.18,4.4);C(84,.45,45.65,3.7,.18,4.4,'eco-link-plinth');S(82.15,85.85,43.45,47.85,.54);
  for(const z of [43.72,47.58]){
    B(metal,84,1.58,z,.19,2.08,.19);C(84,1.58,z,.25,2.08,.25,'eco-link-leg');
    for(const y of [.68,1.14,1.62])B(copper,84,y,z,.32,.07,.32);
    L(copper,[84,2.40,z],[84,2.89,z<45?43.67:47.63],.14,.14);
  }
  // Pair each signal brick with a half-depth latch. The solid stepped ring
  // is machined from both sides and the visible corner is a real return.
  for(let row=-6;row<=6;row++)for(let col=-6;col<=6;col++){
    const edge=Math.hypot(row,col);
    if(edge<5.36||edge>6.55)continue;
    const y=art.y+row*.32,z=art.z+col*.32;
    const latch=Math.abs(row)===Math.abs(col)||Math.abs(row+col)%4===0;
    B(latch?copper:metal,84,y,z,latch?.48:.32,.32,.32,latch?0xc9b498:0xb4c4bb);
    if(latch)continue;
    for(const side of [-1,1])B(row>0?cyan:rose,84+side*.16,y+.04,z,.16,.16,.16);
  }
  for(let i=0;i<8;i++){
    const a=(i+.5)*Math.PI/4,b=(i+1.5)*Math.PI/4;
    const y=art.y+Math.sin(a)*2,z=art.z+Math.cos(a)*2;
    const yy=art.y+Math.sin(b)*2,zz=art.z+Math.cos(b)*2;
    C(84,(y+yy)/2,(z+zz)/2,.22,Math.abs(yy-y)+.14,Math.abs(zz-z)+.14,'eco-link-frame');
  }
  B(charcoal,84,.84,45.65,1.03,.60,1.00);C(84,.84,45.65,1.03,.60,1.00,'eco-link-projector');
  B(copper,83.985,1.18,45.65,1.10,.09,1.07);B(cyan,84,1.25,45.65,.44,.045,.44);
  for(let j=0;j<5;j++)B(metal,83.47,.76+j*.065,45.65,.035,.022,.68);
  for(const [a,b]of [
    [[83.93,1.38,45.65],[83.93,3.67,45.65]],
    [[83.93,2.27,45.65],[83.93,3.05,44.77]],[[83.93,2.74,45.65],[83.93,3.58,46.62]],
    [[83.93,3.17,45.65],[83.93,4.20,45.09]],[[83.93,3.58,45.65],[83.93,4.35,46.11]],
  ])L(holo,a,b,.045,.045);
  for(const [y,z]of [[3.05,44.77],[3.20,44.55],[3.58,46.62],[3.8,46.83],[4.20,45.09],[4.35,46.11],[4.57,45.82]]){
    for(let i=0;i<4;i++)B(holo,83.92,y+(i%2)*.17,z+Math.floor(i/2)*.17,.10,.12,.12,0xffffff);
  }
  label(83.39,1.51,45.65,1.46,.38,'ECO / LINK','URBAN CANOPY  /  LIVE',-Math.PI/2,'#8cdedb');
  point(83.4,2.3,45.65,'#70d8dd',18,10,'living canopy installation');

  // Park service cluster is a useful piece of municipal equipment, set back
  // from the west sidewalk instead of becoming an obstruction on the loop.
  function terminal(x,z,rot,title,sub){
    const co=Math.cos(rot),si=Math.sin(rot),P=(u,y,v)=>[x+u*co+v*si,y,z-u*si+v*co];
    const F=(m,u,y,v,w,h,d,col=0xffffff)=>B(m,...P(u,y,v),w,h,d,col,rot);
    F(granite,0,.43,0,1.5,.14,.95);C(x,.43,z,Math.abs(co)*1.5+Math.abs(si)*.95,.14,Math.abs(si)*1.5+Math.abs(co)*.95,'park-terminal-base');
    const hw=(Math.abs(co)*1.5+Math.abs(si)*.95)/2,hd=(Math.abs(si)*1.5+Math.abs(co)*.95)/2;S(x-hw,x+hw,z-hd,z+hd,.50);
    F(metal,0,1.51,0,1.12,2.15,.48);C(x,1.51,z,Math.abs(co)*1.15+Math.abs(si)*.52,2.15,Math.abs(si)*1.15+Math.abs(co)*.52,'park-terminal');
    F(charcoal,0,1.85,.26,.94,1.18,.03);F(cyan,-.44,1.85,.287,.027,1.12,.025);F(cyan,.44,1.85,.287,.027,1.12,.025);
    for(let i=0;i<6;i++)F(i%3?cyan:rose,-.30+i*.12,2.16,.285,.045,.19+(i%3)*.11,.02);
    for(const [u,v,w,d]of [[-.16,.13,.50,.016],[.09,.0,.016,.26],[-.16,-.13,.50,.016]])F(cyan,u,1.83+v,.284,w,d,.02);
    F(copper,0,1.03,.27,.73,.10,.06);F(warm,.33,.78,.27,.08,.045,.025);
    for(let i=0;i<5;i++)F(charcoal,0,.50+i*.065,.25,.74,.018,.035);
    label(...P(0,2.68,.24),1.35,.38,title,sub,rot,'#9cded9');
  }
  terminal(70.8,32.2,-Math.PI/2,'COMMONS / MAP','LOOP  /  PAVILION  /  WETLAND');
  terminal(125.8,60.5,Math.PI/2,'CITY / WATER','REFILL  /  FILTER STATUS');
  for(const [x,z]of [[70.8,34.4],[125.8,62.6]]){
    for(let i=0;i<2;i++){
      const zz=z+i*.69;B(metal,x,.87,zz,.66,.98,.57);B(charcoal,x,1.40,zz,.72,.08,.63);
      B(i?cyan:warm,x-.34,1.23,zz,.024,.13,.35);C(x,.90,zz,.72,1.08,.63,'sort-bin');
      for(let j=0;j<4;j++)B(copper,x-.345,.66+j*.14,zz,.018,.045,.39);
    }
  }

  // Shelter detailing: roof height/collision stay unchanged. Copper fascia,
  // gutter joints and the warm coffer band read from ordinary third-person.
  for(const z of [31.55,40.45]){
    B(copper,98,4.46,z,10.62,.12,.11);
    for(let x=93.0;x<=103.1;x+=.66){B(metal,x,4.47,z+.065,.055,.15,.055);}
    for(const [a,b]of [[93.4,96.0],[100.0,102.6]])B(cyan,(a+b)/2,4.315,z,a===93.4?2.6:2.6,.025,.035);
  }
  for(const x of [92.74,103.26])B(copper,x,4.46,36,.11,.12,8.92);
  for(const z of [33.25,38.75]){
    B(timber,98,4.00,z,8.7,.12,.14);B(warm,98,3.927,z,6.9,.025,.05);
    for(const x of [94.05,101.95]){B(metal,x,3.89,z,.12,.16,.20);B(warm,x,3.795,z,.08,.025,.13);}
  }
  for(const [x,z]of [[93.73,32.75],[102.27,32.75]]){
    B(copper,x,2.65,z,.07,2.78,.07);B(metal,x,1.52,z,.16,.48,.17);
    for(const y of [1.0,2.5,3.65])B(metal,x,y,z,.16,.055,.16);
  }
  // Step edge inlays are on the actual treads, below any extra walk height.
  for(let i=0;i<4;i++)for(const side of [-1,1])B(cyan,98+side*1.34,.548+i*.18,42.62-i*.66,.25,.014,.028);
  // Bench end-grain slats, armrests and fixing bolts share the sample's scale.
  const benchDefs=[[83,64.5,0,.36],[111,65.38,0,.36],[77,36,Math.PI/2,.36],[119,37,-Math.PI/2,.36],
    [86,-16,0,.36],[111,-16,0,.36],[95,35.5,Math.PI/2,1.08],[101,35.5,-Math.PI/2,1.08]];
  for(const [x,z,rot,level]of benchDefs){const co=Math.cos(rot),si=Math.sin(rot),P=(u,y,v)=>[x+u*co+v*si,y,z-u*si+v*co];
    for(const e of [-1,1]){
      L(metal,P(e*.84,level+.52,-.22),P(e*.84,level+.72,.20),.05,.05);
      B(metal,...P(e*.84,level+.73,.02),.055,.07,.45,0xffffff,rot);
      for(const v of [-.2,.22])B(copper,...P(e*.74,level+.55,v),.055,.018,.055);
    }
    for(let i=0;i<4;i++)for(const e of [-1,1])B(charcoal,...P(e*.93,level+.489,-.23+i*.15),.025,.05,.09,0xaab7a1,rot);
  }

  // The tram canopy keeps its tested 3.965m upper bound. Ribbed underside and
  // a thick supported live board make this a recognisable transit stop.
  for(let x=117.7;x<127.8;x+=.62){B(metal,x,3.64,6.85,.075,.09,1.61);}
  for(const z of [6.02,7.69])B(cyan,122.55,3.72,z,10.20,.035,.04);
  for(const x of [119.0,126.3])B(warm,x,3.60,6.85,1.04,.045,.38);
  B(metal,122.9,2.81,7.32,4.15,1.13,.18);B(charcoal,122.9,2.81,7.211,3.96,.95,.028);
  C(122.9,2.81,7.32,4.15,1.13,.18,'tram-live-board');
  for(const x of [121.0,124.8])B(copper,x,3.39,7.32,.065,.34,.065);
  label(122.9,3.04,7.185,3.64,.36,'EAST LOOP / 02 MIN','NEXT  /  MERCER & HUDSON',Math.PI,'#9edcd9');
  label(122.9,2.54,7.185,3.62,.31,'COMMONS  >  MIDTOWN','STEP-FREE CITY LINK',Math.PI,'#d4c29f');
  for(let i=0;i<7;i++){B(i===2?rose:cyan,121.5+i*.46,2.80,7.19,.075,.075,.025);if(i<6)B(metal,121.73+i*.46,2.80,7.192,.33,.025,.02);}
  // Narrow tactile strip and individual platform edge studs, not a new floor.
  for(let x=118.7;x<127.2;x+=.26){B('yellow',x,.369,6.16,.09,.016,.09,0xa9b8a0);B('yellow',x,.369,6.32,.09,.016,.09,0xa9b8a0);}
  for(const x of [118.8,120.8,122.8,124.8,126.8])B(cyan,x,.371,7.47,.10,.018,.045);

  // Grounded reed beds and low broken stones soften the rectilinear pond.
  // The shallow-water QA corridor z46.5..47 and boardwalk z49.2..51.8 stay clear.
  for(const [x,z,w,d]of [[109.3,44.65,2.5,.66],[117.8,44.7,2.8,.65],[109,58.8,1.6,.7],[116.9,58.8,3.6,.68]]){
    stats.plantingClusters++;
    for(let i=0;i<32;i++){
      const xx=x+(rand()-.5)*w,zz=z+(rand()-.5)*d,h=.28+rand()*.60;
      B(i%4===0?dry:reed,xx,.27+h/2,zz,.035,h,.038,shade(.18));
      if(i%3===0){L(reed,[xx,.4,zz],[xx+.17,.35+h*.65,zz+.04],.025,.065);B(dry,xx,.32+h,zz,.055,.13,.055);}
    }
  }
  for(const [z,x0,x1]of [[43.62,108,119.7],[60.04,108,119.7]])for(let x=x0;x<x1;x+=.59){
    B(shadow,x,.43+rand()*.035,z,.45+rand()*.16,.12,.28+rand()*.13,shade(.16),rand()*.20-.1);
    if(Math.round(x*4)%4===0)B(leaf,x+.10,.54,z+.15,.20,.18,.22,shade(.12));
  }
  for(const [x,z]of [[108.3,48.2],[119.45,53.6],[110.4,57.3]]){
    B(copper,x,.42,z,.17,.29,.17);B(cyan,x,.59,z,.13,.045,.13);
    for(const e of [-1,1])B(metal,x+e*.10,.52,z,.025,.24,.025);
  }
  // Fine tie plates and bolt heads break up the boardwalk's broad plank ends;
  // no rail or box is introduced into the 2.6m clear crossing itself.
  for(let x=106.2;x<121.7;x+=.84)for(const z of [49.31,51.69]){
    B(metal,x,.561,z,.13,.010,.20);for(const dz of [-.052,.052])B(charcoal,x,.569,z+dz,.035,.007,.035);
  }

  // Wild planting grows in a few composed beds. Tall pieces stay out of every
  // slab strip, grass-terrace test approach and the wetland's true shallow path.
  const beds=[[80.0,31.0,1.3,3.1],[88.4,38.7,1.05,3.3],[108.1,30.0,3.0,1.0],[112.7,37.4,3.2,.8],
    [80,62,2.8,1.1],[105.45,64.3,1.37,1.0],[119.40,64.55,1.19,1.0],
    [77.4,-31,2.4,1.2],[115,-31,3.6,1.1],[86,-36.7,2.3,1.1],[102,-38.1,4.2,1.25]];
  for(let bi=0;bi<beds.length;bi++){
    const [x,z,w,d]=beds[bi];stats.plantingClusters++;
    for(let i=0;i<23;i++){
      const xx=x+(rand()-.5)*w,zz=z+(rand()-.5)*d,base=(bi===0||bi===1||bi===2||bi===3)?.54:.36,h=.15+rand()*.25;
      B(i%4===0?dry:leaf,xx,base+h*.50,zz,.15+rand()*.14,h,.14+rand()*.13,shade(.18));
      for(const e of [-1,1])B(fern,xx+e*.09,base+h*.7,zz,.23,.06,.105,shade(.15),e*.38);
      if((i+bi)%4===0){B(reed,xx,base+.31,zz,.022,.40,.025);for(const dx of [-.075,0,.075])B(pink,xx+dx,base+.49+Math.abs(dx)*.45,zz,.085,.075,.085,shade(.12));}
    }
  }
  // Bark roots, understated fallen leaves and soil chips are tied to trees,
  // instead of random noise spread over the path. Tiny pieces need no C.
  for(const [x,z]of treeLocations){
    for(let j=0;j<10;j++){
      const a=j*Math.PI/5+.35,r=.28+rand()*.45;
      B(j%3?dry:earth,x+Math.cos(a)*r,.426,z+Math.sin(a)*r,.09+rand()*.12,.025,.07+rand()*.13,shade(.17),a);
    }
    for(const a of [.4,2.7,4.3])L('bark',[x,.49,z],[x+Math.cos(a)*.57,.42,z+Math.sin(a)*.57],.065,.08,0xbcc0a6);
  }
  // Layered bank aggregate uses the *existing* solid outline. The chips never
  // protrude past its face, and the exact four .18m walkable risers stay intact.
  for(const island of terrainIslands)for(const r of island.outerParts){
    for(const z of [r.minZ+.025,r.maxZ-.025])for(let x=r.minX+.16;x<r.maxX-.10;x+=.36){
      B(earth,x,.425+rand()*.045,z,.17+rand()*.13,.035,.045,shade(.2));
    }
    for(const x of [r.minX+.025,r.maxX-.025])for(let z=r.minZ+.18;z<r.maxZ-.12;z+=.42){
      B(shadow,x,.42+rand()*.04,z,.045,.04,.17+rand()*.1,shade(.2));
    }
  }

  stats.pointLights=lights.length;
  const observation={hero:[79,1.8,46.0],pavilion:[98,1.08,41.2],tram:[123,.36,5.7],pond:[114,.556,50.5]};
  function setNight(night){
    for(const l of lights)l.intensity=l.userData.nightPower*(night?1:.12);
    materials[warm].emissiveIntensity=night?1.8:.55;materials[cyan].emissiveIntensity=night?2.0:.65;
    materials[rose].emissiveIntensity=night?1.5:.5;materials[holo].emissiveIntensity=night?1.15:.65;
  }
  setNight(true);
  return {stats,lights,setNight,art,observation,fixtures,emissives:[warm,cyan,rose,holo].map(key=>({key,material:materials[key]}))};
}
