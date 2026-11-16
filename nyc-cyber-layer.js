import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createCyberDisplay} from './nyc-display-textures.js';

/** Added cyber retrofit, kept independent of the original New York masonry. */
export function addCyberLayer(scene,{box,beam,materials,colliders,sign,rand}) {
  const lights=[],screens=[],drones=[];
  let addedBoxes=0,addedBeams=0,artboards=0,droneBoxes=0;
  const stats={artboards:0,drones:0,lights:0,boxes:0,beams:0,triangles:0,independentDrawCalls:0};
  const B=(...args)=>{addedBoxes++;box(...args);};
  const L=(...args)=>{addedBeams++;beam(...args);};
  function front(x,z,rot=0){
    const c=Math.cos(rot),s=Math.sin(rot);
    const P=(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c];
    return {P,B:(mat,u,y,v,w,h,d,col=0xffffff)=>B(mat,...P(u,y,v),w,h,d,col,rot),L:(mat,a,b,size=.07,col=0xffffff)=>L(mat,P(...a),P(...b),size,size,col)};
  }
  function display(kind,x,y,z,w,h,rot=0,color='cyan',mountDepth=.9){
    artboards++;
    const f=front(x,z,rot),back=.34;
    f.B('metal',0,y,0,w+.44,h+.44,back,0x77888b);
    f.B('rubber',0,y,.19,w+.14,h+.14,.06,0x9bafac);
    for(const e of [-1,1]){
      f.B('metal',e*(w/2+.14),y,.20,.13,h+.24,.15,0x9caca8);
      f.B(color,e*(w/2+.235),y,.19,.055,h*.72,.05);
      for(const yy of [-h*.32,h*.32])f.B('metal',e*(w/2+.24),y+yy,-mountDepth/2,.31,.32,mountDepth+.14,0x899d9b);
    }
    f.B('metal',0,y-h/2-.22,.16,w+.6,.17,.48,0x5b7578);
    // Vented controller rail, rather than an unsupported glowing rectangle.
    for(let u=-w/2;u<w/2;u+=.24)f.B('rubber',u,y-h/2-.23,.42,.11,.08,.035,0xa8b7b0);
    const map=createCyberDisplay(kind);
    const material=new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:1.45,color:0x9fadaf,roughness:.5,metalness:.05,side:T.FrontSide});
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);mesh.position.set(...f.P(0,y,.235));mesh.rotation.y=rot;
    mesh.name='NYC cyber artboard / '+kind;scene.add(mesh);screens.push({mesh,material,base:1.65});
    stats.independentDrawCalls++;
    return f;
  }
  // Principal ad surfaces are attached to known street-facing façades.
  // From spawn: right near wall, left forward street wall, then the crossing.
  display('nexus',-17,14.1,-8.92,7.3,5.5,0,'cyan',1.9);
  display('after',10.94,8.6,15.5,4.7,6.25,-Math.PI/2,'magenta');
  display('transit',27,10.2,-9.78,7.1,3.55,0,'cyan');
  display('bridge',0,6.38,-26.19,15.3,1.02,0,'cyan');
  display('info',-7.8,1.75,16.0,.82,.62,0,'cyan');

  // Services follow the joints between floors, preserving the brick surfaces.
  function serviceRun(f,u,y0,y1,v,kind='cyan'){
    f.B('metal',u,(y0+y1)/2,v,.22,y1-y0,.25,0x657d80);
    f.B('rubber',u,(y0+y1)/2,v+.15,.095,y1-y0,.07,0x9facaa);
    for(let y=y0+.25;y<y1;y+=1.3){
      f.B('metal',u,y,v+.02,.40,.12,.35,0x8b9e99);
      if(Math.floor(y)%3===0)f.B(kind,u,y+.25,v+.205,.05,.45,.035);
    }
  }
  for(const [x,z,rot,kind]of [[-11.0,16.0,Math.PI/2,'cyan'],[11.0,16.0,-Math.PI/2,'magenta'],[-17,-9.9,0,'cyan'],[17,-9.9,0,'cyan']]){
    const f=front(x,z,rot);
    serviceRun(f,-1.35,.8,12.7,.12,kind);
    serviceRun(f,1.5,4.05,16.8,.13,kind);
    // Rectangular pipe elbows and a parallel optical service line.
    f.B('metal',.05,4.12,.21,3.0,.23,.22,0x76908e);
    f.B(kind,.05,4.32,.345,2.8,.055,.055);
    f.B('metal',1.5,11.3,.22,1.1,.23,.25,0x7d9593);
    f.B(kind,1.02,11.54,.35,.93,.06,.06);
    for(const u of [-1.35,1.5])f.B('metal',u,4.12,.21,.35,.35,.35,0xa3b1a5);
    // Low wall supply cabinet, kept at the façade edge outside the clear route.
    f.B('metal',-.83,1.50,.10,.86,1.9,.42,0x7f938b);
    f.B('rubber',-.83,1.50,.33,.69,1.56,.055,0x778e87);
    f.B('metal',-.83,2.30,.20,.96,.16,.58,0xa3afa1);
    f.B(kind,-.85,1.95,.37,.36,.065,.03);
    for(let j=0;j<5;j++)f.B('metal',-.83,.95+j*.12,.38,.51,.03,.025,0xa0b2a9);
    f.B('yellow',-.63,1.5,.38,.09,.16,.025,0x9fa582);
    // Compact sign relay, fan shroud and a visible mechanical duct behind it.
    f.B('metal',.55,4.9,.39,1.2,.9,.8,0x8b9e97);
    f.B('rubber',.55,4.9,.82,.83,.67,.06);
    for(let j=-2;j<=2;j++)f.B('metal',.55+j*.15,4.9,.87,.04,.57,.04,0x83968e);
    f.B('metal',.55,5.55,.37,.64,.5,.56,0x829790);
    // Surveillance camera, bracket and cyan lens are all solid voxel pieces.
    f.L('metal',[1.7,4.45,.25],[1.7,4.7,1.03],.08,0x869c96);
    f.B('metal',1.7,4.7,1.09,.47,.28,.65,0xb4beb0);
    f.B('rubber',1.7,4.7,1.44,.35,.19,.055);
    f.B(kind,1.7,4.7,1.477,.11,.11,.018);
  }
  // Separate guide routes: cyan civic network, magenta memory-market branch.
  for(const [x,z,w,kind,rot]of [[-18,-9.72,7.7,'cyan',0],[17,-9.73,7.7,'cyan',0],[-11.05,16.2,8.9,'cyan',Math.PI/2],[11.05,16.2,8.9,'magenta',-Math.PI/2]]){
    const f=front(x,z,rot);
    f.B('metal',0,3.85,.13,w,.18,.22,0x6b8581);
    // Unequal lit segments read as a functional conduit, not decorative stripes.
    for(let u=-w/2+.2;u<w/2;u+=1.7){f.B(kind,u,3.96,.265,1.08,.06,.055);f.B('metal',u+.63,3.94,.25,.19,.25,.12,0x8e9f96);}
  }

  // Cable bundles sag above the roadway, well above character and camera height.
  function cable(z,height,sag,offset=0){
    let previous=null;
    for(let i=0;i<=24;i++){
      const t=i/24,x=-11.4+t*22.8,y=height-Math.sin(t*Math.PI)*sag;
      const p=[x,y,z+offset];if(previous)L('rubber',previous,p,.045,.045,0x5a6f72);previous=p;
      if(i%6===0)B('metal',x,y,z+offset,.12,.16,.13,0x8a9e99);
    }
  }
  for(const [z,y,sag]of [[-17.0,10.0,1.1],[20.5,10.6,1.3]]){
    cable(z,y,sag);cable(z,y+.26,sag+.12,.32);cable(z,y+.14,sag,.67);
    for(const x of [-11.4,11.4]){B('metal',x,y,z,.18,.85,1.06,0x7d9590);B('cyan',x,y+.48,z,.2,.1,.2);L('metal',[Math.sign(x)*12.55,y+.24,z],[x,y+.24,z],.09,.09,0x8fa498);}
  }
  // The high-line deck becomes city infrastructure, while its plants stay visible.
  for(let x=-41;x<43;x+=2.8){
    B('metal',x,5.91,-26.31,1.65,.18,.23,0x78928f);
    B('cyan',x,5.81,-26.18,1.3,.055,.08);
    if(Math.abs(x)>11)B('lamp',x,5.78,-28.5,.36,.075,.5,0x9c9f83);
  }
  // Subway information pylon and cable feed have a small existing-sidewalk footprint.
  B('metal',-7.8,.7,15.85,.58,.62,.38,0x879e94);
  B('metal',-7.8,1.30,15.85,.16,1.1,.18,0x8a9f99);
  B('cyan',-7.8,2.20,16.05,.76,.065,.065);
  B('metal',-7.8,2.3,15.90,.96,.13,.51,0x8ca398);

  function drone(x,y,z,phase=0){
    const group=new T.Group();group.name='NYC hovering service drone';
    const entries={metal:[],rubber:[],cyan:[]};
    const make=(kind,xx,yy,zz,w,h,d,color=0xffffff)=>{
      droneBoxes++;
      const geo=new T.BoxGeometry(w,h,d);geo.translate(xx,yy,zz);
      const c=new T.Color(color),colors=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}geo.setAttribute('color',new T.BufferAttribute(colors,3));entries[kind].push(geo);
    };
    make('metal',0,0,0,.72,.26,.58,0xc0c7b8);make('rubber',0,-.13,.20,.44,.16,.3);
    make('cyan',0,-.12,.37,.16,.07,.025);
    for(const e of [-1,1])for(const q of [-1,1]){
      make('metal',e*.49,.025,q*.29,.38,.075,.10,0x97a99e);
      make('rubber',e*.68,.08,q*.29,.31,.07,.31);
      make('metal',e*.68,.13,q*.29,.44,.035,.055,0xa4b8ab);
      make('metal',e*.68,.13,q*.29,.055,.035,.44,0xa4b8ab);
      make('cyan',e*.69,-.02,q*.29,.055,.045,.055);
    }
    for(const [key,geos]of Object.entries(entries)){
      const geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());
      const mesh=new T.Mesh(geometry,materials[key]);mesh.castShadow=false;group.add(mesh);stats.independentDrawCalls++;
    }
    group.position.set(x,y,z);group.rotation.y=phase;scene.add(group);drones.push({group,x,y,z,phase});
  }
  drone(-1.9,8.2,10.2,.6);drone(4.6,10.3,-3.1,2.4);

  // Four bounded, non-shadow lights give the ads a visible relationship to masonry.
  for(const [x,y,z,color,power,reach]of [[-16,9,-7.5,0x55dfe8,62,15],[7,4,12,0xee5fa9,70,18],[-7,4,18,0x48cee2,58,18],[0,5.3,-25,0x4ad6dc,58,13]]){
    const light=new T.PointLight(color,power,reach,2);light.position.set(x,y,z);light.castShadow=false;light.userData.nightPower=power;scene.add(light);lights.push(light);
  }
  let night=true;
  function setNight(value){night=Boolean(value);for(const l of lights)l.intensity=l.userData.nightPower*(night?1:.2);for(const s of screens)s.material.emissiveIntensity=s.base*(night?1.22:.72);}
  function update(dt,time){
    const t=Number.isFinite(time)?time:0;
    for(const d of drones){d.group.position.set(d.x+Math.sin(t*.25+d.phase)*.33,d.y+Math.sin(t*.8+d.phase)*.14,d.z+Math.cos(t*.25+d.phase)*.28);d.group.rotation.y=d.phase+Math.sin(t*.32+d.phase)*.12;}
    // Tiny output drift reads as live equipment, never an attention-grabbing strobe.
    for(let i=0;i<screens.length;i++)screens[i].material.emissiveIntensity=screens[i].base*(night?1.22:.72)*(1+Math.sin(t*.65+i)*.016);
  }
  stats.artboards=artboards;stats.drones=drones.length;stats.lights=lights.length;
  stats.boxes=addedBoxes;stats.beams=addedBeams;stats.triangles=(addedBoxes+addedBeams+droneBoxes)*12+artboards*2;
  stats.newColliderCount=0;setNight(true);
  return {update,setNight,lights,stats};
}
