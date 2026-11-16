import {freightApron} from './nyc-freight-apron.js';
import {mooredTender} from './nyc-harbor-tender.js';
import * as T from 'three';

/** First westward district: old Hudson warehouses, yards, promenade and pier.
 * Add before the parent architecture batch is finished. No runtime network IO.
 */
export function addWaterfront(scene,{box,beam,panel,materials,colliders,surface,sign,tree,lamp,bench,planter,rand=Math.random}) {
  const ROAD=.18,SIDE=.36,bounds={minX:-146,maxX:-44,minZ:-52,maxZ:52};
  const stats={warehouses:0,trees:0,treeBoxes:0,boxes:0,beams:0,colliders:0,surfaces:0,signs:0,independentDrawCalls:1,pointLights:0,triangles:0};
  const initialColliders=colliders.length,lights=[];
  const B=(...a)=>{stats.boxes++;box(...a);};
  const L=(...a)=>{stats.beams++;beam(...a);};
  const S=(x1,x2,z1,z2,y=SIDE)=>{surface(x1,x2,z1,z2,y);stats.surfaces++;};
  const C=(x,y,z,w,h,d)=>colliders.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));
  const tint=(r=.1)=>{const v=1-r*.5+rand()*r;return new T.Color(v,v,v);};
  const label=(...args)=>{if(sign){sign(...args);stats.signs++;}};
  const treeAt=(x,z,size=.9)=>{if(tree){const result=tree(x,z,size,true);stats.treeBoxes+=result?.boxes||0;stats.trees++;}};
  function register(name,source,options={}){
    if(materials[name])return materials[name];
    const m=source.clone();Object.assign(m,options);m.name='NYC waterfront / '+name;m.userData={...source.userData};materials[name]=m;return m;
  }
  register('harborTimber',materials.wood,{color:new T.Color(0x9b9c8c),roughness:.94});
  register('harborPaint',materials.metal,{color:new T.Color(0x647b74),roughness:.78,metalness:.35});
  register('harborRust',materials.metal,{color:new T.Color(0x8a5d47),roughness:.9,metalness:.2});

  // Inland ground meets x=-44 exactly; the river and open-water strip never get
  // a walk surface. The global expanded bounds include only the guarded pier.
  B('asphalt',-91,.01,0,94,.34,104);S(-138,-44,-52,52,ROAD);
  for(const z of [-8.55,8.55]){
    B('concrete',-88.5,.27,z,89,.18,4.1);S(-133,-44,z-2.05,z+2.05);
  }
  // Two narrow service streets connect every rear yard and park to the avenue.
  for(const [x,halfRoad,sideWidth]of [[-73,3.0,1.9],[-100.5,2.8,1.5]]){
    for(const e of [-1,1]){
      const xx=x+e*(halfRoad+sideWidth/2);
      for(const side of [-1,1]){
        B('concrete',xx,.27,side*29.3,sideWidth,.18,45.4);
        S(xx-sideWidth/2,xx+sideWidth/2,side<0?-52:6.6,side<0?-6.6:52);
      }
      for(let z=-51.75;z<52;z+=.5){if(Math.abs(z)<6.8)continue;B('trim',x+e*(halfRoad+.07),.285,z,.20,.21,.48,tint(.12));}
    }
    for(const z of [-8.15,8.15])for(let i=-2;i<=2;i++)B('white',x+i*1.05,.19,z,.52,.012,2.4,tint(.14));
    for(let z=-45;z<49;z+=9){if(Math.abs(z)<14)continue;B('white',x,.19,z,.09,.012,2.8,tint(.12));}
  }
  for(let x=-132.75;x<-44;x+=.5)for(const z of [-6.64,6.64]){
    if(Math.abs(x+73)<3.6||Math.abs(x+100.5)<3.3)continue;
    B('trim',x,.285,z,.48,.21,.28,tint(.14));
  }
  for(let x=-128;x<-44;x+=8)for(const z of [-.13,.13])B('yellow',x,.189,z,3.1,.014,.075,tint(.13));
  // Paved forecourts give warehouse doors space and avoid leftover empty plots.
  for(const z of [-18.0,19.5])for(const x of [-59,-87,-114]){
    B('paver',x,.27,z,20,.18,17);S(x-10,x+10,z-8.5,z+8.5);
  }
  // Quay cap, continuous riverwalk and a plaza at the avenue's western end.
  B('stone',-137.6,-.65,0,1.1,1.8,104,0x8a9693);
  B('paver',-133,.26,0,10,.20,104);S(-138,-128,-52,52);
  B('paver',-130.5,.265,0,15,.19,21.3);S(-138,-123,-10.65,10.65);
  for(let z=-51.6;z<52;z+=.8){B('trim',-137.5,.40,z,.75,.12,.77,tint(.16));B('stone',-137.8,-.06,z,.42,.55,.76,tint(.12));}
  // Bands of actual paving blocks catch low grazing light at the river edge.
  for(let z=-50.7;z<51;z+=1.2)for(const x of [-135.9,-130.1])B('concrete',x,.375,z,.62,.035,1.14,tint(.14));

  function railAlongX(x1,x2,z,y=.36){
    const width=x2-x1;
    B('metal',(x1+x2)/2,y+1.12,z,width,.085,.085,0xa1aaa0);
    B('metal',(x1+x2)/2,y+.46,z,width,.05,.055,0x8c9c91);
    for(let x=x1;x<=x2+.01;x+=1.3){B('metal',x,y+.60,z,.105,1.2,.105,0xa0aa9d);B('metal',x,y+.04,z,.24,.08,.24,0x7c8e85);}
    C((x1+x2)/2,y+.64,z,width,1.28,.20);
  }
  function railAlongZ(x,z1,z2,y=.36){
    const depth=z2-z1;
    B('metal',x,y+1.12,(z1+z2)/2,.085,.085,depth,0xa1aaa0);
    B('metal',x,y+.46,(z1+z2)/2,.055,.05,depth,0x8c9c91);
    for(let z=z1;z<=z2+.01;z+=1.3){B('metal',x,y+.60,z,.105,1.2,.105,0xa0aa9d);B('metal',x,y+.04,z,.24,.08,.24,0x7c8e85);}
    C(x,y+.64,(z1+z2)/2,.20,1.28,depth);
  }
  railAlongZ(-138.05,-52,-5.1);railAlongZ(-138.05,5.1,52);
  // Level timber pier: .18m curb step from the road, no stairs or jump required.
  B('metal',-141.5,.09,0,9.1,.30,9.6,0x5d7777);
  for(let x=-145.72;x<=-137;x+=.24)B('harborTimber',x,.32,0,.225,.08,9.5,tint(.18));
  S(-145.85,-137,-4.75,4.75);
  railAlongX(-145.8,-138,-4.87);railAlongX(-145.8,-138,4.87);railAlongZ(-145.92,-4.9,4.9);
  for(const z of [-3.8,3.8])for(const x of [-145,-141.1,-137.6]){
    B('wood',x,-.3,z,.35,1.45,.35,0x9ba28b);
    B('metal',x,.12,z,.47,.18,.47,0x84918b);
  }
  // Pier fenders and mooring bollards are clustered at edges, off the clear path.
  for(const z of [-3.7,3.7]){
    B('metal',-144.9,.72,z,.20,.72,.20,0x9eafa1);B('metal',-144.9,1.02,z,.55,.16,.20,0xa7b0a0);
    for(let j=0;j<4;j++)B('rubber',-144.88,.40+j*.10,z,.37,.055,.39,0x91a398);
  }
  label(-143.4,1.35,-4.65,2.8,.65,'HUDSON PIER','WEST / RIVERWALK','#8fc6c8',0);
  if(bench){bench(-143,2.95,0);bench(-143,-2.95,Math.PI);}

  // The crane stands on a separate working quay south of the public jetty.
  // From the warehouse canyon its boom crosses the slit of sky above the boat.
  const craneX=-161,craneZ=15;
  B('stone',craneX,-.36,craneZ,44,1.32,12,0x738388);
  for(const dx of [-3.1,3.1])for(const dz of [-3.4,3.4]){
    const foot=[craneX+dx,.32,craneZ+dz];
    L('harborRust',foot,[craneX+dx*.55,10,craneZ+dz*.58],.64,.75,0xe6ad79);
  }
  B('yellow',craneX,10,craneZ,7.4,1.6,8.3,0xc7a07d);
  B('harborPaint',craneX,12.45,craneZ+1.8,4.6,3.4,4.5);
  B('coolWindow',craneX+2.4,12.7,craneZ+1.8,.18,1.4,3.9);
  for(const dx of [-1.0,1.0]){
    const x=craneX+dx;
    const heel=[x,11,craneZ],tip=[x-4,22,craneZ-21],top=[x,18,craneZ+2];
    L('yellow',heel,tip,.52,.55);L('yellow',heel,top,.36,.4);
    L('metal',top,tip,.09,.09);
    L('harborRust',[x,12.8,craneZ], [x-4,22.95,craneZ-21],.22,.23);
    for(let j=0;j<7;j++){
      const t=j/7,u=(j+1)/7;
      L('yellow',[x-4*t,11+11*t,craneZ-21*t],[x-4*u,12.8+10.15*u,craneZ-21*u],.15,.15);
    }
  }
  L('metal',[craneX-4,22,craneZ-21],[craneX-4,9,craneZ-21],.08,.08);
  B('yellow',craneX-4,8.7,craneZ-21,1.15,.68,1.05);
  // Floods face the service berth, leaving the centre of the public quay dark.
  for(const [x,z] of [[-150,10],[-146,22]]){
    B('harborPaint',x,3.8,z,.37,7.2,.37);B('metal',x,7.45,z,1.9,.48,.72);
    B('lamp',x,7.23,z-.32,1.55,.26,.18);
  }
  // The load beam has a marked working side, visible from the warehouse street.
  B('harborPaint',craneX+3.79,10,craneZ,.30,1.24,7.8);
  B('lamp',craneX+3.98,10.38,craneZ,.12,.14,6.9,0xffc982);
  label(craneX+4.01,9.91,craneZ,5.5,.79,'PIER 07','NIGHT SHIFT','#e3af75',Math.PI/2);
  mooredTender(B,L,label);
  let apronTriangles=0;
  freightApron(B,L,C,label,(mat,corners)=>{panel(mat,corners);apronTriangles+=2;});

  function warehouse(x,z,w,d,height,rotation=0,index=0,title=''){
    stats.warehouses++;
    const c=Math.cos(rotation),s=Math.sin(rotation),P=(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c];
    const F=(mat,u,y,v,a,b,e,t=0xffffff)=>B(mat,...P(u,y,v),a,b,e,t,rotation);
    const line=(mat,a,b,size=.08,t=0xffffff)=>L(mat,P(...a),P(...b),size,size,t);
    const center=P(0,height/2+SIDE,-d/2),bw=Math.abs(c)*w+Math.abs(s)*d,bd=Math.abs(s)*w+Math.abs(c)*d;
    C(...center,bw,height,bd);
    F(index%2?'brickBrown':'brick',0,height/2+SIDE,-d/2,w,height,d,tint(.15));
    F('stone',0,.69,.13,w+.12,.55,.34,0x9c9f8b);
    F('metal',0,.42,.18,w+.16,.12,.29,0x60776a);
    F('roof',0,height+.40,-d/2,w-.1,.20,d-.1,0x8a9991);
    F('harborPaint',0,height+.66,-d/2,w+.20,.35,d+.20,0xb0b9a3);
    for(let step=0;step<3;step++)F('stone',0,height+.22+step*.13,-d/2,w+.24+step*.15,.14,d+.24+step*.15,0xa1aa97);
    // A low stepped centre pediment makes a warehouse silhouette, not a box.
    F('brickBrown',0,height+1.1,-d/2,w*.42,.88,d+.13,0xb0a591);
    F('trim',0,height+1.59,-d/2,w*.46,.16,d+.26,0x9faca1);
    for(const edge of [-1,1])for(let y=1;y<height;y+=.42)F('stone',edge*(w/2-.18),y,.16,.45,.36,.33,tint(.12));
    const count=Math.floor(w/2.6),step=w/count;
    for(let floor=0;floor<Math.max(2,Math.floor(height/3.35));floor++)for(let i=0;i<count;i++){
      const u=-w/2+step*(i+.5),y=2.05+floor*3.25;
      // Wide industrial iron sash bays, with individual dark panes and masonry caps.
      F('metal',u,y,.14,1.82,2.27,.18,0x60756f);
      const wm=rand()<.23?'warmWindow':'glass';
      F(wm,u,y,.25,1.62,2.03,.04,0xa8b4a4);
      F('metal',u,y,.29,.065,2.05,.035,0x90a191);
      F('metal',u,y+.16,.29,1.65,.06,.035,0x90a191);
      F('stone',u,y+1.23,.24,2.05,.21,.40,0x9d9d87);
      F('stone',u,y-1.19,.31,2.04,.16,.53,0xa4a591);
      if((i+floor+index)%4===0)for(let j=0;j<4;j++)F('brick',u-.50+j*.33,y+1.42,.23,.30,.14,.21,tint(.18));
    }
    // Side windows and external iron roof-drain line give the alleys depth.
    for(const edge of [-1,1]){
      F('metal',edge*(w/2+.1),height/2,-d*.18,.17,height,.17,0x6f8580);
      for(let zz=-d+1.5;zz<-1;zz+=3.2)for(let y=2.3;y<height-1;y+=3.3){
        F('metal',edge*(w/2+.05),y,zz,.14,2.08,1.58,0x5d736c);
        F(rand()<.15?'warmWindow':'glass',edge*(w/2+.14),y,zz,.035,1.86,1.36,0x9eafa4);
        F('trim',edge*(w/2+.22),y-1.14,zz,.36,.13,1.82,0xa2aa93);
      }
    }
    // One shuttered loading bay and a shallow cast-iron dock canopy.
    const dock=w*.23;
    F('harborPaint',dock,1.89,.37,3.1,2.8,.16,0xa9b39d);
    for(let sl=0;sl<17;sl++)F('rubber',dock,.66+sl*.15,.47,2.88,.028,.025,0x879386);
    F('metal',dock,3.54,.70,4.1,.20,1.7,0x9ba798);
    for(const e of [-1,1])line('metal',[dock+e*1.85,2.7,.22],[dock+e*1.85,3.46,1.35],.07,0x7f9488);
    F('stone',dock,.53,.55,3.45,.32,1.12,0x949d88);
    const dc=P(dock,.53,.55);C(...dc,Math.abs(c)*3.45+Math.abs(s)*1.12,.32,Math.abs(s)*3.45+Math.abs(c)*1.12);
    for(let j=0;j<3;j++){
      const u=-w*.33+j*.33;F('metal',u,height+.98,-d*.66,.8,1.15,.8,0x87998e);F('metal',u,height+1.6,-d*.66,1.0,.12,1.0,0xa7b29e);
    }
    if(title){const p=P(-w*.12,3.58,.84);label(...p,Math.min(8.1,w-2),.78,title,'HUDSON / WORKS DISTRICT',index%2?'#e1b583':'#76c9cf',rotation);}
    // Two short digital equipment accents, rather than an all-neon façade.
    F(index%2?'lamp':'cyan',-w/2+.65,3.15,.42,.075,2.10,.06,0xc6d5b7);
    F('metal',-w/2+.45,1.25,.28,.5,1.35,.50,0x829c87);
  }
  warehouse(-59,-10.65,18,12.8,10.4,0,0,'');
  warehouse(-87,-10.65,18,12.6,13.6,0,1,'RIVERWORKS');
  warehouse(-114,-10.65,18,12.2,10.6,0,2,'HUDSON SUPPLY');
  warehouse(-59,10.65,18,14.4,13.7,Math.PI,3,'');
  warehouse(-87,10.65,18,15.6,10.6,Math.PI,4,'NIGHT FREIGHT');
  warehouse(-114,10.65,18,14.2,11.0,Math.PI,5,'RIVERSIDE MARKET');

  // Service yards behind the north warehouses remain below the reserved bridge
  // corridor z[-32,-25]. No building, tall vegetation or collision occupies it.
  for(const [x,w]of [[-59,19],[-87,18],[-114,18]]){
    B('concrete',x,.27,-42,w,.18,14.5);S(x-w/2,x+w/2,-49.25,-34.75);
    B('metal',x,.385,-43.7,w*.85,.025,.10,0x7f9189);
    B('metal',x,.385,-40.7,w*.85,.025,.10,0x7f9189);
  }
  function container(x,z,w=11.7,rotation=0,rust=false){
    const d=2.55,h=2.6;
    B(rust?'harborRust':'harborPaint',x,SIDE+h/2,z,w,h,d,0xaeb8a6,rotation);
    for(let u=-w/2+.2;u<w/2;u+=.28){
      const xx=x+u*Math.cos(rotation),zz=z-u*Math.sin(rotation);
      for(const e of [-1,1])B('metal',xx+e*Math.sin(rotation)*1.31,1.68,zz+e*Math.cos(rotation)*1.31,.08,2.4,.08,0x779184,rotation);
    }
    for(const e of [-1,1])B('metal',x+e*(w/2-.05)*Math.cos(rotation),1.68,z-e*(w/2-.05)*Math.sin(rotation),.13,2.65,2.65,0x829d8c,rotation);
    const bw=Math.abs(Math.cos(rotation))*w+Math.abs(Math.sin(rotation))*d,bd=Math.abs(Math.sin(rotation))*w+Math.abs(Math.cos(rotation))*d;C(x,1.66,z,bw,2.6,bd);
  }
  container(-59,-44.5,12,0,false);container(-88,-45,11.7,0,true);container(-114,-44.5,10.5,0,false);
  function crate(x,z,size=.9){
    B('wood',x,SIDE+size/2,z,size,size,size,0xb9b294);
    for(const e of [-1,1]){B('metal',x+e*size*.33,SIDE+size/2,z,.07,size+.03,size+.03,0x73897b);B('wood',x,SIDE+size*.82,z+e*size*.51,size,.13,.06,0xa4a387);}
    C(x,SIDE+size/2,z,size,size,size);
  }
  for(const [x,z,s]of [[-52,-38,.9],[-65,-39,1.1],[-93,-38,1],[-116,-37,.9],[-108,-39,1.2],[-120,29,.9]])crate(x,z,s);
  // A compact loading gantry beside the container yard, safely north of greenway.
  for(const x of [-119,-109]){B('harborPaint',x,2.9,-37.2,.25,5.1,.35,0xb5bba3);B('metal',x,.5,-37.2,.64,.25,.88,0x8da18d);}
  B('harborPaint',-114,5.42,-37.2,10.4,.42,.54,0xa0ad96);
  B('yellow',-114,5.42,-36.91,10.3,.19,.035,0xa4a48b);
  B('metal',-113,4.2,-37.2,.045,2.3,.045,0xa6b2a2);B('metal',-113,3.13,-37.2,.33,.16,.25,0xa2ae9a);
  C(-119,2.9,-37.2,.4,5.1,.5);C(-109,2.9,-37.2,.4,5.1,.5);

  // Southern pocket park: paths break it into planted rooms and preserve alleys.
  B('grass',-87,.28,41.1,81,.16,18.2);S(-127.5,-46.5,32,50.2);
  B('paver',-87,.365,35.3,81,.03,3.0);S(-127.5,-46.5,33.8,36.8);
  B('paver',-87,.365,46.2,81,.03,2.5);S(-127.5,-46.5,44.95,47.45);
  for(const x of [-125,-73,-100.5,-47.5]){B('paver',x,.365,41,2.4,.03,20);S(x-1.2,x+1.2,31,51);}
  for(const [x,z,size]of [[-133.0,-19,.86],[-132.7,22,.9],[-133,41,.84],[-58,41,.87],[-86,41,.91],[-114,41,.93]])treeAt(x,z,size);
  // Small .18m leaf clusters create planted edges without repeating giant cubes.
  function shrub(x,z,w=2.3,d=1.0){
    B('stone',x,.56,z,w,.4,d,0x9aa68b);B('grass',x,.79,z,w-.14,.07,d-.14);
    const step=.18;
    for(let u=-w/2+.18;u<w/2-.1;u+=step)for(let v=-d/2+.16;v<d/2-.1;v+=step){
      if(rand()<.16)continue;
      const hh=.18+Math.floor(rand()*2)*.16;
      B('leaf',x+u,.84+hh/2,z+v,.17,hh,.17,tint(.2));
      if(rand()>.75)B('darkLeaf',x+u+.07,.98+hh,z+v+.05,.16,.16,.16,tint(.18));
    }
  }
  for(const x of [-53,-63,-81,-92,-108,-119]){shrub(x,38,3.1,1.1);shrub(x,43.5,2.6,1.05);}
  for(const z of [-43,-32,-11,13,31,46])shrub(-129,z,1.4,2.2);
  // River-facing benches and street-scale lamps are spaced into readable groups.
  if(bench)for(const z of [-40,-15,16,37])bench(-135.1,z,-Math.PI/2);
  if(bench)for(const x of [-59,-86,-114])bench(x,36.5,0);
  if(lamp){
    for(const z of [-44,-18,14,42])lamp(-130.5,z,-1,true);
    for(const x of [-52,-80,-108])for(const z of [-9.2,9.2])lamp(x,z,z>0?-1:1);
  }
  // Low dock beacons are local navigation punctuation, not rows of neon strips.
  for(const z of [-48,-22,22,48]){B('metal',-137.1,.73,z,.17,.73,.17,0x9dada0);B('lamp',-137.1,1.12,z,.23,.15,.23,0xa6b29a);}
  for(const x of [-143.2,-139.2])for(const z of [-4.3,4.3]){B('metal',x,.70,z,.14,.65,.14,0x94a79a);B('cyan',x,1.05,z,.19,.12,.19,0xaabeb2);}
  // Warehouse forecourt furniture stays close to walls and out of the main street.
  for(const [x,z]of [[-96,12.2],[-104,-12.1],[-49,26.5]]){
    B('metal',x,1.05,z,.76,1.35,.76,0x7b9481);B('metal',x,1.77,z,.83,.14,.83,0x91a58d);
    for(let i=0;i<5;i++)B('rubber',x-.24+i*.12,1.10,z+.4,.04,.9,.025,0x8b9a86);
  }

  // The river uses sky reflections plus gentle analytic wave normals. One draw
  // call, no screen-space reflection pass, external image or extra dependency.
  const waterMaterial=new T.MeshStandardMaterial({color:0x294653,roughness:.30,metalness:.46,envMapIntensity:.8,emissive:0x06121a,emissiveIntensity:.14});
  waterMaterial.name='NYC Hudson / rain-blue wave surface';
  const waveTime={value:0};
  waterMaterial.onBeforeCompile=shader=>{
    shader.uniforms.hudsonTime=waveTime;
    shader.vertexShader='uniform float hudsonTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`
      #include <beginnormal_vertex>
      float wx=position.x*.29+position.z*.08+hudsonTime*.43;
      float wz=position.z*.48-position.x*.04-hudsonTime*.31;
      float dx=.027*.29*cos(wx)-.012*.04*cos(wz);
      float dz=.027*.08*cos(wx)+.012*.48*cos(wz);
      objectNormal=normalize(vec3(-dx*4.5,1.0,-dz*4.5));
    `);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      transformed.y+=.027*sin(position.x*.29+position.z*.08+hudsonTime*.43)+.012*sin(position.z*.48-position.x*.04-hudsonTime*.31);
    `);
  };
  const waterGeometry=new T.PlaneGeometry(112,1400,56,84);waterGeometry.rotateX(-Math.PI/2);
  const water=new T.Mesh(waterGeometry,waterMaterial);water.name='Hudson River / guarded non-walkable water';water.position.set(-194,-.8,0);water.receiveShadow=false;scene.add(water);
  // Thin stepped shore scum/foam clusters add scale without a transparent pass.
  for(let z=-50;z<51;z+=1.4)if(Math.abs(z)>6){B('stone',-138.14,-.58,z,.14,.055,.45+rand()*.55,0x7d9892);}
  for(const [x,y,z,color,power,reach]of [[-150,7.1,9.6,0xffdb9c,210,22],[-146,7.1,21.6,0xc7def0,180,20],[-152.5,4.4,-7,0xffc783,100,13],[-134.3,3.3,1.0,0x77c9d5,56,13],[-113.0,4.0,8.0,0xe4b488,50,12]]){
    const l=new T.PointLight(color,power,reach,2);l.position.set(x,y,z);l.castShadow=false;l.userData.nightPower=power;scene.add(l);lights.push(l);
  }
  const bayX=-109.86,bayZ=-9.34;
  B('metal',bayX,3.40,bayZ,1.26,.115,.23);
  B('lamp',bayX,3.325,bayZ,1.12,.045,.16);
  for(const dx of [-.41,0,.41])B('metal',bayX+dx,3.32,bayZ,.024,.070,.21);
  const bayLamp=new T.PointLight(0xffca88,48,9,2);
  bayLamp.position.set(bayX,3.18,bayZ+.10);
  bayLamp.userData.nightPower=48;bayLamp.userData.duskFraction=.69;
  scene.add(bayLamp);lights.push(bayLamp);
  function setNight(night){
    waterMaterial.color.set(night?0x294653:0x435d69);waterMaterial.roughness=night?.30:.36;waterMaterial.envMapIntensity=night?.8:.65;
    for(const l of lights)l.intensity=l.userData.nightPower*(night?1:(l.userData.duskFraction??.16));
  }
  function update(dt,time,camera){waveTime.value=Number.isFinite(time)?time:0;}
  const landmarks=[
    {id:'hudson_pier',title:'哈德逊码头',position:new T.Vector3(-142.1,SIDE,0)},
    {id:'riverside_market',title:'河岸仓库市集',position:new T.Vector3(-113.0,SIDE,8.3)}
  ];
  const districts=[
    {id:'hudson_waterfront',title:'哈德逊滨水街区',position:new T.Vector3(-132,SIDE,0),bounds:{minX:-146,maxX:-124,minZ:-52,maxZ:52}},
    {id:'riverside_works',title:'河岸仓库',position:new T.Vector3(-87,SIDE,0),bounds:{minX:-124,maxX:-44,minZ:-52,maxZ:52}}
  ];
  stats.colliders=colliders.length-initialColliders;stats.pointLights=lights.length;
  stats.ownTriangles=apronTriangles+(stats.boxes+stats.beams)*12+waterGeometry.index.count/3;
  stats.triangles=stats.ownTriangles+stats.treeBoxes*12;
  stats.triangleScope='Own geometry plus returned tree geometry; existing bench/lamp/sign helper primitives are counted by parent batch.';
  stats.materials=['harborTimber','harborPaint','harborRust'];
  stats.reservedGreenway={minX:-137,maxX:-44,minZ:-32,maxZ:-25,y:6.51};
  setNight(true);
  return {bounds,landmarks,districts,stats,update,setNight,lights,water};
}
