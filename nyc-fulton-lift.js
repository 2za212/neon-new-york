import * as T from 'three';
import {fulton} from './nyc-fulton-house.js';

const smooth=(t,a,b)=>T.MathUtils.smoothstep(t,a,b);
const mix=T.MathUtils.lerp;
const doorX=-22.39,centerZ=76.16;
const stops=[fulton.street[1],fulton.landing[1]];

// The cabin and landing doors are small moving rigid assemblies. Each finish
// is instanced once per assembly so the individual ribs need no draw calls.
export function createFultonLift(scene,materials){
  const colors={iron:'#27343b',enamel:'#52736e',oak:'#9b7553',brass:'#b59366',zinc:'#829394',lamp:'#ffe3ac'};
  const finishes=Object.fromEntries(Object.entries(colors).map(([name,color])=>[name,
    new T.MeshLambertMaterial({color,emissive:color,emissiveIntensity:name==='lamp'?.92:.16,
      map:name==='oak'?materials.districtOak.map:null})]));
  const cube=new T.BoxGeometry(1,1,1),matrix=new T.Matrix4();
  function assembly(name,parts){
    const group=new T.Group();group.name=name;
    for(const [finish,mat] of Object.entries(finishes)){
      const boxes=parts.filter(row=>row[0]===finish);if(!boxes.length)continue;
      const mesh=new T.InstancedMesh(cube,mat,boxes.length);
      boxes.forEach(([,x,y,z,w,h,d],i)=>mesh.setMatrixAt(i,matrix.makeScale(w,h,d).setPosition(x,y,z)));
      mesh.computeBoundingSphere();group.add(mesh);
    }
    scene.add(group);return group;
  }
  const leaves=stops.map(y=>[-1,1].map(side=>{
    const panel=assembly('Fulton / landing door',[
      ['enamel',0,.72,0,.10,1.44,.78],['enamel',0,2.01,0,.10,.42,.78],
      ...[-1,1].map(s=>['enamel',0,1.62,s*.315,.10,.36,.15]),
      ...[-1,0,1].map(s=>['zinc',.02,1.62,s*.14,.04,.36,.028]),
      ['zinc',.062,1.12,-side*.33,.035,2.10,.056],['zinc',.055,.29,0,.035,.40,.61],
      ['oak',.055,1.05,0,.045,.58,.48],['brass',.078,1.36,0,.03,.06,.53]
    ]);
    panel.position.set(doorX,y,centerZ+side*.39);return panel;
  }));
  const interior=[
    ['iron',-23.52,-.085,centerZ,2.24,.17,2.25],['oak',-23.52,.004,centerZ,2.15,.016,2.13],
    ['enamel',-24.55,1.28,centerZ,.09,2.56,2.23],['iron',-23.5,2.56,centerZ,2.19,.12,2.26],
    ['zinc',-23.54,2.46,centerZ,.87,.09,.48],['lamp',-23.54,2.40,centerZ,.75,.05,.38]
  ];
  for(const s of [-1,1]){
    const z=centerZ+s*1.08;
    interior.push(['enamel',-23.51,1.24,z,2.18,2.48,.08],['brass',-23.54,.98,z-s*.095,1.70,.055,.07]);
    for(let j=0;j<4;j++)interior.push(['oak',-24.28+j*.49,.48,z-s*.05,.43,.72,.09]);
  }
  for(let j=0;j<4;j++){
    const z=centerZ-.76+j*.51;
    interior.push(['oak',-24.47,1.12,z,.08,1.56,.45],['enamel',-24.41,1.18,z,.045,1.08,.31],
      ['brass',-24.38,1.75,z,.04,.037,.34],['zinc',-24.41,.33,z,.065,.22,.41]);
  }
  for(const s of [-1,1]){
    const z=centerZ+s*1.03;
    for(const x of [-24.18,-23.46,-22.80])interior.push(['iron',x,1.87,z,.085,.70,.12],['zinc',x,2.17,z-s*.06,.16,.11,.15]);
    interior.push(['brass',-23.55,2.22,z-s*.036,1.84,.047,.09]);
  }
  for(const s of [-1,1])interior.push(['lamp',-23.58,2.32,centerZ+s*.62,1.24,.055,.085],
    ['iron',-23.58,2.38,centerZ+s*.62,1.36,.075,.155]);
  interior.push(['brass',-24.39,.92,centerZ,.09,.065,1.86],['iron',-22.57,1.52,centerZ-.96,.29,.64,.14]);
  for(let i=0;i<3;i++)interior.push([i===1?'lamp':'brass',-22.57,1.32+i*.17,centerZ-.872,.10,.08,.05]);
  const car=assembly('Fulton / passenger car',interior);
  const gates=[-1,1].map(side=>{
    const g=assembly('Fulton / cabin door',[
      ['enamel',0,.71,0,.09,1.42,.80],['enamel',0,2.12,0,.09,.64,.80],
      ...[-1,1].map(s=>['iron',0,1.61,s*.337,.09,.39,.125]),
      ...[-1,0,1].map(s=>['zinc',-.04,1.61,s*.16,.05,.38,.029]),
      ['brass',-.06,1.41,0,.05,.044,.77],['brass',-.06,1.81,0,.05,.044,.77],
      ['iron',-.066,.76,0,.06,.91,.66],['oak',-.105,.77,0,.044,.77,.53],
      ['zinc',-.067,.19,0,.055,.26,.71],['brass',-.09,1.04,-side*.34,.04,1.84,.042]
    ]);
    car.add(g);g.position.set(-22.60,0,centerZ+side*.40);return g;
  });
  car.visible=false;
  const start=new T.Vector3(),initialEye=new T.Vector3(),initialLook=new T.Vector3(),focus=new T.Vector3();
  let time=0,from=0,to=1,initialHeading=0;
  function begin(up,player,camera,heading){
    time=0;from=up?0:1;to=1-from;start.copy(player);initialHeading=heading;initialEye.copy(camera.position);
    camera.getWorldDirection(initialLook).multiplyScalar(Math.max(1,initialEye.distanceTo(start))).add(initialEye);
    car.visible=true;car.position.y=stops[from];
  }
  function open(panels,amount){
    panels.forEach((g,i)=>{g.position.z=centerZ+(i?1:-1)*(.40+.80*amount);});
  }
  function step(dt,player,camera,avatar){
    time+=dt;
    const board=smooth(time,.52,1.94),turn=smooth(time,1.85,2.86);
    const travel=smooth(time,3.34,5.50),leave=smooth(time,6.17,7.52);
    const height=mix(stops[from],stops[to],travel);
    car.position.y=height;
    const opened=smooth(time,0,.52)*(1-smooth(time,2.83,3.31));
    const arrived=smooth(time,5.53,6.12)*(1-smooth(time,7.59,8.06));
    open(leaves[from],opened);open(leaves[to],arrived);open(gates,opened+arrived);
    const previousX=player.x, previousZ=player.z;
    player.set(mix(mix(start.x,-23.28,board),fulton.liftX+1.05,leave),height,
      mix(mix(start.z,centerZ-.19,board),fulton.liftZ,leave));
    const heading=initialHeading+Math.atan2(Math.sin(-Math.PI/2-initialHeading),Math.cos(-Math.PI/2-initialHeading))*smooth(time,0,.46)+Math.PI*turn;
    avatar.group.visible=true;avatar.group.position.copy(player);
    avatar.update({dt,grounded:true,heading,speed:Math.hypot(player.x-previousX,player.z-previousZ)/Math.max(dt,.001),attack:false,verticalSpeed:0});
    const angle=.22+turn*2.50;
    camera.position.set(player.x+.97*Math.cos(angle),height+1.76,player.z+.98*Math.sin(angle)+.21);
    // Join the existing shoulder shot, swing inside the open cab, then clear
    // the landing sill before closing the doors.
    camera.position.lerp(initialEye,1-smooth(time,0,1.58));
    const departEyeX=player.x-2.08;
    camera.position.x=mix(camera.position.x,departEyeX,leave);
    camera.position.z=mix(camera.position.z,fulton.liftZ,leave);
    focus.set(player.x-.54+turn*1.73, height+1.39,player.z-.21);
    focus.x=mix(focus.x,player.x,leave);focus.z=mix(focus.z,player.z,leave);
    focus.y=mix(focus.y,height+1.25,leave);
    focus.lerp(initialLook,1-smooth(time,0,1.03));camera.lookAt(focus);
    if(time<8.07)return false;
    car.visible=false;return true;
  }
  return {begin,step};
}
