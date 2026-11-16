// Pedestrian corners on the Greene Street crossing. Coordinates are in metres.
import * as T from 'three';

export function addGreeneCorners({B,C,label,surface,materials,marketLights,scene}){
  function terrace(side,z,span,reach){
    const bands=[[-span/2,-span/2+.7,reach-.75],[-span/2+.7,span/2-.7,reach],[span/2-.7,span/2,reach-.75]];
    for(const [a,b,w] of bands){
      const edge=6.4-w,x=side*(6.4-w/2);
      B('districtMortar',x,.263,z+(a+b)/2,w,.166,b-a);
      surface(Math.min(edge*side,6.4*side),Math.max(edge*side,6.4*side),z+a,z+b,.36);
      for(let t=a;t<b-.01;t+=1.24){
        const length=Math.min(1.24,b-t);
        B('districtSlab',x,.353,z+t+length/2,w-.025,.018,length-.018);
        B('stone',side*(edge+.09),.277,z+t+length/2,.18,.16,length-.035);
      }
    }
  }
  // Short, stepped curb extensions retain the entire central crossing.
  terrace(-1,75.55,6.5,2.55);
  terrace(1,91.95,5.6,2.45);
  terrace(-1,120.25,5.3,1.95);
  terrace(1,135.7,5.2,1.9);

  const covers=['NIGHT SIGNAL','CITY WIRE','SIDE B','CANAL REVIEW'];
  for(const [i,title] of covers.entries()){
    const canvas=document.createElement('canvas');canvas.width=192;canvas.height=256;
    const g=canvas.getContext('2d'),ink=['#e2aa69','#85b8b2','#bd829c','#e6d3a5'][i];
    g.fillStyle=ink;g.fillRect(0,0,192,256);
    g.fillStyle='#283238';g.fillRect(9,48,174,139);
    for(let col=0;col<11;col++){
      const height=20+((col*23+i*37)%83);
      g.fillStyle=ink;g.fillRect(14+col*15,175-height,11,height);
      g.fillStyle='#354048';for(let k=0;k<height-8;k+=12)g.fillRect(17+col*15,170-k,4,4);
    }
    g.fillStyle='#243239';g.font='bold 23px Georgia';g.fillText(title,8,36,176);
    g.fillRect(9,198,171,4);g.fillRect(9,213,126,3);g.fillRect(9,223,154,3);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const mat=new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffdfba,emissiveIntensity:.24,roughness:.9});
    mat.name='Greene newsprint / '+title;mat.userData={unitUV:true,frontImage:true};materials['greeneCover'+i]=mat;
  }
  // Newsstand: glazed Manhattan kiosk with a recessed counter facing the avenue.
  const x=-5.55,z=75.6;
  B('districtIron',x,.55,z,1.38,.38,3.06);
  B('districtOak',x,1.04,z,1.34,.65,2.98);
  C(x,1.04,z,1.4,1.36,3.08,'greene-newsstand');
  B('districtIron',x-.63,1.97,z,.11,1.69,3.04);
  for(const e of [-1,1]){
    B('districtIron',x,1.96,z+e*1.46,1.36,1.67,.12);
    B('districtZinc',x+.62,1.98,z+e*1.34,.095,1.70,.085);
  }
  B('districtOak',x+.12,1.39,z,1.50,.09,2.95);
  for(let r=0;r<3;r++){
    B('districtOak',x-.38,1.49+r*.38,z,.40,.06,2.8);
    for(let n=0;n<8;n++){
      const ink=[0xe49b60,0x72adac,0xc1879c,0xdbc6a2][(r+n)%4],pz=z-1.17+n*.33;
      B('white',x-.29,1.68+r*.38,pz,.08,.31,.27,ink);
      B('greeneCover'+((r+n)%4),x-.242,1.68+r*.38,pz,.014,.30,.26);
    }
  }
  B('districtIron',x,2.94,z,1.95,.29,3.56);
  C(x,2.94,z,1.95,.29,3.56,'newsstand-eave');
  B('districtWarm',x+.84,2.776,z,.09,.035,3.19);
  label(x+.97,2.95,z,3.13,.43,'CANAL EDITIONS','PRESS   /   CITY WIRE','#ffce8d',Math.PI/2);
  for(const e of [-1,1])label(x,2.99,z+e*1.82,1.60,.55,'PRESS','24 HOUR EDITION','#ffbf80',e>0?0:Math.PI);
  // Double-sided end racks read on both approaches to the crossing.
  for(const side of [-1,1]){
    const end=z+side*1.53;
    B('districtOak',x,1.87,end,1.08,1.34,.074);
    for(let row=0;row<2;row++){
      const y=1.57+row*.57;
      for(let col=0;col<3;col++)
        B('greeneCover'+((col+row+(side>0?1:0))%4),x+(col-1)*.30,y,end+side*.050,.27,.39,.02);
      B('districtZinc',x,y-.19,end+side*.076,.93,.043,.06);
    }
    B('districtWarm',x,2.58,end+side*.08,1.03,.04,.07);
  }
  const light=new T.PointLight(0xffbf77,24,7,2);
  light.position.set(x+.84,2.65,z);light.userData.nightPower=24;scene.add(light);marketLights.push(light);

  // Across the junction: a transparent next-arrival shelter and a lean rail.
  const sx=5.68,sz=91.94;
  for(const dz of [-1.51,1.51]){
    B('districtIron',sx+.32,1.65,sz+dz,.16,2.56,.16);
    C(sx+.32,1.65,sz+dz,.16,2.56,.16,'arrival-post');
  }
  B('districtGlass',sx+.34,1.69,sz,.08,1.8,2.96);
  C(sx+.34,1.69,sz,.08,1.8,2.96,'arrival-glazing');
  B('districtIron',sx,2.99,sz,1.59,.20,3.74);
  C(sx,2.99,sz,1.59,.20,3.74,'arrival-canopy');
  B('districtCool',sx-.78,2.98,sz,.042,.063,3.51);
  B('districtOak',sx+.03,.85,sz,.48,.14,2.20);
  C(sx+.03,.63,sz,.48,.57,2.20,'arrival-seat');
  for(const dz of [-.85,.85])B('districtIron',sx+.03,.60,sz+dz,.10,.40,.32);
  label(sx+.05,2.58,sz-1.51,1.21,.70,'M21','CANAL   /   04 MIN','#70e5dd',Math.PI);

  // Project the bookseller's canopy out over the walk, with open bays below.
  for(let bay=0;bay<3;bay++){
    const pz=94.4+bay*3.55;
    for(let course=0;course<4;course++){
      B('sohoCanvas',-10.22+course*.55,3.68-course*.14,pz,.56,.16,3.52,0xaac3b2);
    }
    for(let course=0;course<4;course++)C(-10.22+course*.55,3.68-course*.14,pz,.56,.16,3.52,'bookseller-canopy');
    B('districtIron',-8.56,3.13,pz,.12,.16,3.55);
    B('districtWarm',-8.60,3.03,pz,.08,.035,3.10);
  }
  for(const pz of [93.1,102.85]){
    B('districtIron',-8.60,1.76,pz,.10,2.80,.10);
    C(-8.60,1.76,pz,.10,2.80,.10,'bookseller-column');
  }
  // Dry parcel loading shelf at the second crossing, with wet paving visible around it.
  for(const dz of [-.68,.68]){
    B('districtIron',-5.83,.73,120.25+dz,.62,.71,.18);
  }
  B('districtOak',-5.83,1.11,120.25,.90,.10,1.92);
  C(-5.83,.78,120.25,.90,.80,1.92,'parcel-shelf');
  for(let i=0;i<3;i++)B('districtPaper',-5.83,1.33,119.68+i*.52,.55,.34,.42,0xd9b98e);
  for(const dz of [-1.35,1.35]){
    B('stone',5.71,.64,135.7+dz,.84,.55,.88);
    C(5.71,.74,135.7+dz,.84,.78,.88,'corner-planter');
    B('leaf',5.71,1.07,135.7+dz,.76,.49,.75);
  }
}
