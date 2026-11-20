import * as T from 'three';
import {buildRecordCounter} from './nyc-voxel-counter.js';
import {housingBond} from './nyc-housing-bond.js';

// Street sections in metres. Heavy volumes share the city's batched geometry,
// collision and rain shelter data; the fixtures use the existing light budget.
export function buildStreetSections({box,beam,panel,collider,surface,materials,sign,scene,localLights}){
  const bond=housingBond(materials,box,panel);
  function finish(name,colour,rough,metal,emission=0,power=0){
    const mat=new T.MeshStandardMaterial({color:colour,roughness:rough,metalness:metal,
      emissive:emission,emissiveIntensity:power,vertexColors:true});
    mat.name=name;materials[name]=mat;
    return mat;
  }
  const casing=finish('Grid / oxidised ceramic',0x4f8589,.58,.22);
  const ribs=finish('Grid / dove enamel',0xc3c9c0,.57,.21);
  const copper=finish('Grid / oxide vermilion',0xb34831,.67,.19);
  const opal=finish('Grid / substation glazing',0x95d7ce,.38,.18,0x40c8b6,.66);
  const amber=finish('Market / amber glass',0xc38656,.57,.08,0xde853a,.55);
  const fabric=finish('Market / woven wine canvas',0x9e4046,.94,0,0x723035,.13);
  const granite=finish('Exchange / blue-grey paving granite',0xa8ada7,.79,.06,0x62757d,.16);
  const setts=finish('Depot / damp granite setts',0x81867c,.72,.11,0x5f5950,.16);
  const concrete='midtownLimestone';
  const solid=(mat,x,y,z,w,h,d,tint)=>{
    box(mat,x,y,z,w,h,d,tint);collider(x,y,z,w,h,d);
  };
  function practical(x,y,z,hue,power,reach){
    const light=new T.PointLight(hue,power,reach,2);
    light.position.set(x,y,z);light.userData.nightPower=power;
    scene.add(light);localLights.push(light);
  }

  // A district substation straddles the north end of the old avenue. The
  // occupied east end steps outward above the rail deck; a lower truss remains
  // open above the public greenway and preserves the sightline below it.
  function gridHouse(z,side){
    const x=side*6.4;
    // The lit switch hall sits inside two deep comb-shaped cornices. Both
    // ends are seen from the avenue. Keep the window plane inside the teeth.
    for(const face of [-1,1])for(const [y,seed] of [[11.24,1],[14.76,4]]){
      bond('ceramicShell',x,y,z+face*2.40,19.20,.96,4.80,0x69a6a7,face,seed+side,.32);
    }
    box(casing,x,13.0,z,19.20,2.56,8.0);
    collider(x,13.0,z,19.2,4.48,9.60);
    solid('metal',x,10.52,z,20.48,.64,10.88);
    for(const [offset,y,dz,w,h,d,tone] of [
      [2.56,16.48,0,14.08,2.56,8.32,0xcfd6c7],[4.48,19.04,-.96,10.24,2.56,6.40,0x70a6a6],
      [6.08,22.08,-1.28,5.12,3.52,5.12,0xb96149]]){
      bond('ceramicShell',x+side*offset,y,z+dz,w,h,d,tone,2*side,Math.round(offset*3),.64);
      collider(x+side*offset,y,z+dz,w,h,d);
    }
    for(const face of [-1,1]){
      const front=z+face*4.86;
      box('metal',x,13.10,front-face*.62,18.24,2.48,.24);
      for(let cell=-4;cell<4;cell++){
        const tip=front-face*(cell%3===0?.48:.38);
        box(opal,x+(cell+.5)*2.08,13.10,tip,1.92,1.92,.16);
      }
      for(let bay=-4;bay<=4;bay++){
        box(ribs,x+bay*2.08,13.28,front+face*.45,.48,3.04,.94);
        box(casing,x+bay*2.08,11.83,front+face*.71,.80,.35,1.02);
      }
      bond('titaniumSkin',x,11.48,front+face*.12,19.0,.64,.64,0xce7355,face,3,.32);
      for(let i=0;i<4;i++)box('metal',x+side*6.08,20.85+i*.68,z-1.28+face*2.62,4.18,.25,.28);
    }
    // The counterweight and two truss feet are carried by the street wall.
    for(const dz of [-3.36,3.36]){
      solid(concrete,side*12.8,8.0,z+dz,2.24,7.36,2.24);
      beam(copper,[side*12.8,6.0,z+dz],[side*5.12,10.4,z+dz],.85,1.02);
      box(opal,side*5.12,10.17,z+dz,2.56,.11,1.28);
    }
    practical(side*4.2,9.5,z+3,0x69dbd3,149,16);
  }
  gridHouse(-19.2,1);
  gridHouse(51.2,-1);
  function deck(mat,left,right,near,far,top){
    const bottom=.18;
    solid(mat,(left+right)/2,(bottom+top)/2,(near+far)/2,right-left,top-bottom,far-near);
    surface(left,right,near,far,top);
  }
  // The record shop keeps its original doorway and lit display. Widen its
  // walking apron into the former parking lane; upper flats overhang it.
  collider(-5.12,.27,30.24,2.56,.18,22.72);
  surface(-6.40,-3.84,18.88,41.60,.36);
  box('districtIron',-5.12,.24,30.24,2.56,.12,22.72);
  for(let row=0;row<5;row++){
    const width=row===0||row===4?.32:.64;
    const x=[-6.24,-5.76,-5.12,-4.48,-4.0][row];
    for(let j=0;j<36;j++){
      const z=18.88+j*.64,end=Math.min(z+.64,41.60);
      const sill=(j>=19&&j<24)||(j>=1&&j<3);
      const tone=[0xc8c1a6,0xa9ada2,0xbdb9a3,0xb7baa9][(row+j+Math.floor(j/3))%4];
      box(row===4||sill?granite:'sampleStreetBluestone',x,.33,(z+end)/2,width-.018,.06,end-z-.024,tone);
    }
  }
  // The two kerbside booths face the shop, leaving a through aisle and an
  // open crossing opposite the real record-store door. The clerestories pick
  // up the tram's cool light above the amber pickup windows.
  for(const [z,length] of [[23.72,4.16],[38.08,3.20]]){
    buildRecordCounter({panel,box,collider,practical,materials},z,length);
  }
  for(const [side,z,length,reach,floors] of [[-1,27.60,4.80,2.56,3],[-1,35.90,5.76,3.20,3],[1,30.0,6.24,2.88,2],[1,-39,7.04,3.52,4]]){
    const wall=10.65,bottom=5.02,height=2.88;
    // These occupied overstreet units split in plan. The rear service spine
    // bears the cantilever; the inset end exposes the side of the glazed bay.
    for(let f=0;f<floors;f++){
      const y=bottom+f*height;
      for(const end of [-1,1]){
        const alternating=(end===side)===(f%2===0);
        const projection=alternating?reach:reach-1.28;
        const edge=side*(wall-projection),body=side*(wall-(projection-.64)/2);
        const span=length*(end===side?.56:.44),zz=z+end*(length-span)/2;
        solid('basaltShell',body,y+height/2,zz,projection-.64,height,span-.10,0xbbc6cc);
        const cheek=zz+end*(span/2-.24);
        const outer=-side*2,phase=Math.round(z)+3*f+end;
        bond('ceramicShell',side*(wall-projection/2),y+1.44,cheek,projection,2.88,.48,0xc1dbd8,outer,phase);
        collider(side*(wall-projection/2),y+1.44,cheek,projection,2.88,.48);
        for(let i=0;i<2;i++){
          const depth=projection+.16+i*.32;
          bond(i?'ceramicShell':'titaniumSkin',side*(wall-depth/2),y+2.50+i*.32,zz,depth,.32,span+.16-i*.32,
            alternating?0xd8e4d9:0xb6c9ca,outer,phase+2*i);
        }
        bond('titaniumSkin',side*(wall-projection/2),y+.32,zz,projection,.64,span-.10,0xafc8cb,outer,phase+3);
        collider(side*(wall-projection/2),y+.32,zz,projection,.64,span-.10);
        collider(side*(wall-(projection+.32)/2),y+2.74,zz,projection+.32,.44,span+.12);
        bond('ceramicShell',side*(wall-(projection+.16)/2),y+.72,zz,projection+.16,.16,span-.32,0xcfcbc0,outer,phase,.16);
        const lensX=edge+side*.56;
        box(f===0||alternating?'routeStudio':'routeHome',lensX,y+1.69,zz-end*.12,.12,1.56,span-.60);
        bond('basaltShell',edge+side*.12,y+1.62,zz-end*(span*.5-.18),.64,2.20,.32,0xc3ccce,outer,phase,.16);
        box(f%2===0?opal:amber,edge-side*.12,y+2.36,zz-end*.06,.16,.16,span-.72);
        bond('titaniumSkin',edge+side*.45,y+1.48,cheek+end*.26,.86,1.76,.20,0xccd1bf,end,phase,.16);
        for(let j=0;j<3;j++)
          box(ribs,edge+side*(.32+j*.32),y+1.12+j*.32,cheek+end*.36,.64,.32,.32,0xbdcabe);
      }
    }
    for(const dz of [-length*.32,length*.32])
      beam('titaniumSkin',[side*wall,3.80,z+dz],[side*(wall-reach+.32),5.06,z+dz],.32,.48);
    if(z>0)practical(side*(wall-reach-.56),7.48,z,side<0?0xace3df:0xe3bb9d,86,11);
  }
  // Trackside receiving platform. The three landings at its southern end
  // climb from road level to the roller shutter, facing the approaching player.
  deck(casing,-7.04,-2.56,-23.2,-10.4,.82);
  for(let i=0;i<3;i++){
    const end=-10.4+i*.8,top=.66-i*.16;
    deck(concrete,-7.04,-2.56,end,end+.8,top);
    box(ribs,-4.8,top+.012,end+.69,4.48,.024,.15);
  }
  box(copper,-2.49,.54,-16.8,.14,.52,12.8);
  solid(casing,-5.04,2.26,-16.4,3.36,2.88,3.2);
  box('districtIron',-5.04,2.55,-14.74,2.98,1.94,.24);
  box(amber,-5.04,2.30,-14.58,2.61,1.02,.16);
  for(const x of [-5.88,-5.0,-4.12])box('districtIron',x,2.31,-14.45,.12,1.23,.21);
  solid(copper,-5.04,3.78,-16.08,4.16,.32,4.18);
  sign(-5.04,3.27,-14.58,2.72,.54,'GRID DEPOT','NIGHT SHIFT','#eec396');
  practical(-5.1,2.8,-13.62,0xffb16e,48,7);
  // Freight rails are embedded in the east-west intersection. The slab falls
  // short of both kerbs and leaves the asphalt beyond the crossing exposed.
  for(let row=0;row<9;row++){
    const z=-3.68+row*.88;
    for(let col=0;col<12;col++){
      const x=-14.08+col*2.56+row%2*.92;
      box(setts,x,.199,z,2.52,.026,.83,(row+col)%3===0?0xbfc3bb:0xe1dcd0);
    }
  }
  for(const z of [-2.40,-.96,1.60,3.04]){
    box('districtIron',0,.218,z,29.44,.018,.27);
    box(ribs,0,.229,z+.055,29.44,.012,.09);
  }
  // A stepped loading apron bites into the carriageway at the south gate.
  for(const [z,len,reach] of [[43.3,2.4,1.28],[46.1,3.2,2.56],[48.5,1.6,1.92]]){
    const left=-6.4,right=left+reach;
    solid('districtSlab',(left+right)/2,.27,z,reach,.18,len);
    surface(left,right,z-len/2,z+len/2,.36);
    box(ribs,right-.10,.371,z,.14,.018,len-.12);
  }

  // A sawtooth market arcade projects from the cast-iron block into the
  // street. Gaps interrupt the roof at the fire escape and the bookshop door.
  for(const [start,end] of [[84.8,94.0],[97.4,110.2],[111.4,123.0]]){
    const bays=Math.ceil((end-start)/4.1),pitch=(end-start)/bays;
    for(let i=0;i<bays;i++){
      const z=start+(i+.5)*pitch;
      for(let step=0;step<5;step++){
        const xx=-10.48+(step+.5)*1.15,yy=5.50-step*.27;
        solid(i%3===1?copper:fabric,xx,yy,z,1.17,.25,pitch-.07);
        box(i%3===1?ribs:amber,xx,yy-.13,z-pitch*.41,1.16,.065,.16);
      }
      // Short valance leaves turn the rolled cloth down in steps at each seam.
      // Deep cast-enamel pelmets project over the kerb, with an open notch
      // through which the next amber lamp can be seen on approach.
      const nose=-4.46;
      for(let j=0;j<8;j++){
        const zz=z+(j-3.5)*pitch/8,fold=Math.min(j,7-j),h=.96-fold*.16;
        box(fold===0?copper:casing,nose,4.50-h/2,zz,.48,h,pitch/8-.012);
        box(fold===0?ribs:amber,nose+.04,4.50-h-.08,zz,.56,.16,pitch/8-.012);
      }
      box(fabric,-4.71,4.33,z,.22,.32,pitch-.04);
      for(const end of [-1,1]){
        box(copper,-4.65,4.12,z+end*pitch*.34,.30,.24,pitch*.25);
        box(fabric,-4.64,3.96,z+end*pitch*.39,.32,.16,pitch*.15);
      }
      box(amber,-4.81,4.14,z,.12,.12,pitch*.54);
      beam('districtIron',[-10.58,3.95,z+pitch*.42],[-4.89,4.24,z+pitch*.42],.16,.22);
    }
    for(const z of [start+.22,end-.22]){
      solid('districtIron',-6.58,2.28,z,.28,3.82,.32);
      box(copper,-6.58,.65,z,.43,.52,.46);
    }
    practical(-6.1,4.0,(start+end)/2,0xffa46e,62,9);
  }
  // Two market tables occupy a former parking bay. Buyers can circle either
  // table, with an unbroken through route behind the arcade posts.
  deck(concrete,-6.72,-3.52,97.6,111.2,.35);
  for(const z of [102.4,108.16]){
    for(const end of [-1,1])solid(casing,-5.2,.92,z+end,1.70,1.14,.26);
    solid('districtOak',-5.2,.57,z,1.68,.16,2.26);
    // Two separate folds show the timber frame and the open shelf behind.
    box(fabric,-4.30,1.37,z,.16,.32,1.92);
    box(fabric,-4.26,1.13,z-.40,.24,.16,.96);
    box(fabric,-4.22,.97,z-.64,.32,.16,.48);
    for(const dz of [-.52,.48])box('districtOak',-5.08,.79,z+dz,1.12,.31,.79);
    solid('districtOak',-5.2,1.55,z,2.0,.16,2.64);
    for(let i=0;i<3;i++){
      const zz=z+(i-1)*.76;
      box('districtOak',-5.28,1.68,zz,1.44,.16,.64);
      for(const end of [-1,1])box(copper,-5.28,1.81,zz+end*.28,1.44,.24,.08);
      for(let j=0;j<3;j++){
        const x=-5.68+j*.36,y=1.98+(2-j)*.08;
        box([ribs,casing,fabric][(i+j)%3],x,y,zz,.16,.56,.48);
        box('districtPaper',x+.10,y+.08,zz-.04,.04,.16,.24,0xb2afa1);
      }
    }
  }

  // The old textile exchange still covers the west approach. Its sawtooth
  // roof takes half the street; gaps above the opposite pavement show sky.
  for(let bay=0;bay<6;bay++){
    const z=92.8+bay*5.12;
    for(let step=0;step<4;step++){
      const height=4.90+step*.32;
      solid(step===3?copper:fabric,-50.56,height,z+step*1.28,9.60,.32,1.28);
      if(step===3)box(amber,-50.56,height-.49,z+step*1.28+.60,9.28,.64,.14);
    }
    for(const x of [-55.04,-45.92]){
      solid('districtIron',x,2.60,z-.48,.32,4.80,.42);
      box(copper,x,4.52,z-.48,.73,.72,.64);
      beam('districtIron',[x,3.66,z-.48],[x,4.75,z+1.42],.23,.24);
    }
    box('districtIron',-50.50,4.78,z-.45,9.8,.38,.38);
    if(bay%2===1){
      box(amber,-51.3,4.39,z+1.28,3.84,.18,.40);
      practical(-51.3,4.1,z+1.28,0xeaa46a,60,10);
    }
  }

  // District cooling plant along the north side of the Midtown connector.
  // The valley between machine houses preserves the cross-avenue sky slot.
  for(const [west,east] of [[-28.8,-8.0],[8.0,49.6]]){
    const length=east-west,xc=(east+west)/2;
    solid('districtIron',xc,8.40,-70.24,length,.96,8.32);
    solid(casing,xc,10.72,-71.52,length,3.84,6.08);
    box(ribs,xc,12.72,-71.36,length+.64,.32,6.72);
    for(let x=west+2.2;x<east-1;x+=4.16){
      box('districtIron',x,10.85,-68.35,3.3,2.4,.35);
      for(let louvre=0;louvre<3;louvre++)
        box(ribs,x,10.14+louvre*.61,-68.04,3.30,.18,.46);
    }
    for(const x of [west+1.60,east-1.60]){
      solid(concrete,x,4.10,-72.16,2.56,8.2,2.72);
      beam(casing,[x,4.96,-72.16],[x,8.0,-66.56],.90,.80);
      box(opal,x,7.85,-67.76,1.28,.14,2.40);
    }
    const stackX=west+length*.40;
    solid(ribs,stackX,15.12,-72.64,7.68,4.48,4.48);
    solid(casing,stackX+1.60,18.32,-72.88,4.48,2.24,3.84);
    box(opal,stackX,15.56,-70.30,6.56,.56,.21);
  }

  // The exchange forecourt has open central paving, flanked by occupied
  // terrace wings. On approach the fins converge on the cold recessed hall.
  for(let i=0;i<9;i++){
    const z=-111.2-i*2.4,width=4.8+i*.96,centre=-i*.50;
    const top=z>-122?.21:.385;
    deck(granite,centre-width/2,centre+width/2,z-1.2,z+1.2,top);
    for(const side of [-1,1]){
      const x=centre+side*(width/2-.34);
      box(casing,x,top+.012,z,.48,.024,2.37);
      if(i%3===1)box('midtownBronze',x-side*.38,top+.012,z,.16,.024,.96,0x9a886c);
    }
    box('districtZinc',centre,top+.012,z-1.05,width-1.5,.024,.12);
  }
  for(const side of [-1,1]){
    const outer=-8+side*17.6;
    for(let i=0;i<4;i++){
      const z=-131.6-i*3.28,x=outer-side*i*.48;
      const height=3.2+i*1.92;
      solid(concrete,x,.36+height/2,z,2.56,height,3.20);
      box(casing,x-side*1.34,.36+height*.5,z,.24,height*.78,2.62);
      box(opal,x-side*1.49,height*.68,z,.12,.80,2.56);
      solid(ribs,x-side*.8,height+.57,z,4.32,.42,3.20);
      box(opal,x-side*2.21,height+.32,z,.86,.14,2.58);
    }
    // Upper stacks carry a broad overhang above the people approaching below.
    solid(casing,outer-side*2.1,10.48,-142.9,9.6,2.56,12.8);
    solid(ribs,outer-side*2.8,12.36,-145.5,10.24,1.20,11.52);
    for(let i=0;i<5;i++){
      box(opal,outer-side*2.1+(i-2)*1.76,10.55,-136.44,1.33,1.28,.16);
      box(copper,outer-side*2.1+(i-2)*1.76,9.53,-136.40,1.54,.32,.22);
    }
    practical(outer-side*3.9,5.9,-136.3,0x9bddda,112,14);
    for(let i=0;i<9;i++){
      const z=-123.6-i*2.32,x=-8+side*(8.16-i*.32);
      box(granite,x,.389,z,1.18,.024,2.23,0x93a5a1);
      for(let j=0;j<4;j++)
        box('districtZinc',x,.408,z+(j-1.5)*.48,.92,.026,.10,0x91a7a3);
      box(ribs,x-side*.71,.382,z,.25,.023,2.23);
    }
  }
}
