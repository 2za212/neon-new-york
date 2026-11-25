import * as T from 'three';
import {up,TAU,ease,mix,vector,rgb,makeShader,makeTube,makeWave,makeGroundLight,makeMist,makeShards,ballistic} from './attack-vfx-kit.js';
import {createRiftStrike,placeRiftStep,riftTiming} from './rift-strike.js';
import {attachArmorPlate} from './blade-volume.js';
import {makeConverger,makeKnuckleGuard,makeImpactVanes,directionalChips,makeFracturedDeck,makeHeatScar} from './attack-forms.js';

export const attackSpecs = {
  rift:{title:'折界·瞬斩',role:'skill-2',duration:.94,contact:riftTiming.contact,loop:2.35,still:.67},
  flare:{title:'离火·贯星',role:'skill-1',duration:1.31,contact:.78,loop:2.56,still:.87},
  fist:{title:'玄流·三叩',role:'dodge-forward',duration:.45,contact:1.22,loop:2.60,still:1.32},
  gravity:{title:'坠岳·磁狱',role:'skill-3',duration:1.76,contact:1.16,loop:2.93,still:1.29},
};

const show = (t,start,crest,release,end)=>ease(t,start,crest)*(1.-ease(t,release,end));
const zAxis=vector(0,0,1);

function pulseLight(group, color, range) {
  const source=new T.PointLight(color,0,range,2);
  group.add(source);
  return (point,power)=>{
    source.position.copy(point);
    source.intensity=power;
  };
}

export const flareFollowDelay=.084;
function flareEffect({group,to,forward,side,target,secondaryTarget,beamEnd}) {
  const amber=rgb(1.58,.52,.096), gold=rgb(1.91,.98,.28), orange=rgb(1.52,.18,.041);
  const core=makeTube(group,{color:amber,edge:gold,rows:61,sides:10,order:8.4});
  const flame=makeTube(group,{color:orange,edge:gold,rows:58,sides:13,kind:1,order:7.4});
  const stream=makeTube(group,{color:rgb(.80,.073,.039),edge:amber,rows:50,sides:7,kind:1,order:7.1});
  const converger=makeConverger(group);
  const splash=Array.from({length:2},()=>makeWave(group,orange,gold,{span:TAU*.69,width:.059,loop:65,order:7.8}));
  const heated=makeHeatScar(group,to.clone().addScaledVector(forward,-.31),forward,amber);
  const frontLight=pulseLight(group,0xffaa46,4.7);
  const rearLight=pulseLight(group,0xff7636,4.1);
  const chargeLight=pulseLight(group,0xff9b4c,2.65);
  const frontSmoke=makeMist(group,rgb(.42,.14,.046));
  const rearSmoke=makeMist(group,rgb(.34,.084,.043));
  const back=secondaryTarget===undefined?target.clone(true):secondaryTarget;
  if(secondaryTarget===undefined){
    back.name='贯星 · 后排巡检机';
    back.position.copy(to).addScaledVector(forward,1.78).addScaledVector(side,.16);
    group.add(back);
  }
  const firstPoint=target.localToWorld(vector(.016,1.16,.175));
  const secondPoint=back?back.localToWorld(vector(.014,1.16,.175)):
    beamEnd?firstPoint.clone().lerp(beamEnd,.58):firstPoint.clone().addScaledVector(forward,1.53);
  const exit=beamEnd??secondPoint.clone().addScaledVector(forward,.70).addScaledVector(side,.1);
  const firstScar=attachArmorPlate(target.children[0]);
  const secondScar=back?attachArmorPlate(back.children[0]):null;
  const frontSparks=directionalChips(group,{count:52,color:gold,hot:true,speed:5.4,lift:3.05,size:.0113,life:.38});
  const rearSparks=directionalChips(group,{count:44,color:amber,hot:true,speed:5.36,lift:2.18,size:.0109,life:.43});
  const armor=directionalChips(group,{count:23,color:rgb(.29,.19,.105),hot:false,speed:3.27,lift:2.3,size:.051,life:.66});
  const soot=directionalChips(group,{count:15,color:rgb(.17,.089,.061),hot:false,speed:3.73,lift:2.79,size:.043,life:.63});
  const approach=forward.clone().multiplyScalar(-.36).addScaledVector(side,-.94).normalize();
  const through=forward.clone().addScaledVector(side,.79).normalize();
  const source=vector(),offset=vector(),across=vector(),rise=vector(),aim=vector(),mistSize=vector();
  const strike=attackSpecs.flare.contact, gap=flareFollowDelay;

  return (t,palm,hit)=>{
    const age=t-strike;
    const used=Math.max(0,age);
    const set=show(t,.19,.49,strike+.063,strike+.38);
    const fire=show(age,-.085,-.017,.145,.324);
    source.copy(palm).addScaledVector(forward,.109);
    aim.copy(exit).sub(source).normalize();
    across.crossVectors(aim,up).normalize();
    rise.crossVectors(across,aim).normalize();
    converger(source,aim,t,set,fire);
    const l1=source.distanceTo(firstPoint),l2=firstPoint.distanceTo(secondPoint);
    const total=l1+l2+secondPoint.distanceTo(exit);
    const lead=age<0?l1*ease(age,-.090,0):age<gap?l1+l2*ease(age,0,gap):
      mix(l1+l2,total,ease(age,gap,gap+.039));
    const trail=lead*.13*ease(age,.143,.30)+lead*.51*ease(age,.200,.33);

    function shape(s,u,r,weave=0){
      const at=mix(trail,lead,u);
      if(at<l1) s.center.copy(source).lerp(firstPoint,at/Math.max(.001,l1));
      else if(at<l1+l2) s.center.copy(firstPoint).lerp(secondPoint,(at-l1)/Math.max(.001,l2));
      else s.center.copy(secondPoint).lerp(exit,(at-l1-l2)/Math.max(.001,total-l1-l2));
      const spread=(.43+.57*Math.sin(Math.PI*u))*(.83+.17*Math.sin(u*47.-t*24.)**2);
      const taper=1.-.56*ease(u,.71,1);
      s.radialA.copy(across);
      s.radialB.copy(rise);
      s.center.addScaledVector(across,weave*Math.cos(u*24.-t*14.)*spread)
        .addScaledVector(rise,weave*Math.sin(u*24.-t*14.)*spread);
      s.a=(.018+r*spread)*taper;
      s.b=s.a*.77;
    }
    flame.update(t,fire*.79,(s,u)=>shape(s,u,.355));
    core.update(t,fire*.94,(s,u)=>shape(s,u,.071));
    stream.update(t,fire*.59,(s,u)=>shape(s,u,.101,.165));

    firstScar(age,hit);
    secondScar?.(age-gap,hit);
    const recoil=hit?show(age-gap,0,.046,.086,.36):0;
    if(back){
      back.children[0].rotation.set(-.44*recoil,.17*recoil,-.24*recoil);
      back.children[0].position.z=-.20*recoil;
    }
    for(const [i,s] of splash.entries()){
      const dt=age-i*gap;
      const point=i===0?firstPoint:secondPoint;
      const impulse=hit&&(i===0||back)?show(dt,0,.026,.045,.22):0;
      s.mesh.position.copy(point).addScaledVector(forward,-.13+Math.max(0,dt)*.54);
      s.mesh.position.y+=.033*i;
      s.mesh.quaternion.setFromUnitVectors(zAxis,aim);
      s.mesh.rotateZ(.38+i*1.8+dt*2.04);
      const diameter=.09+Math.max(0,dt)*2.1;
      s.mesh.scale.set(diameter,diameter*(.76+i*.10),diameter);
      s.update(t,impulse*.72);
    }
    frontSparks(firstPoint,approach,hit?age:-1);
    rearSparks(secondPoint,through,hit&&back?age-gap:-1);
    armor(firstPoint,approach,hit?age-.013:-1);
    soot(secondPoint,through,hit&&back?age-gap-.019:-1);
    const aged=Math.max(0,age-gap);
    offset.copy(firstPoint).addScaledVector(forward,-.17);offset.y=.86+used*.70;
    mistSize.set(.52+used*.93,.37+used*.73,.42+used*.84);
    frontSmoke(offset,mistSize,t,hit?show(age,.041,.159,.255,.69)*.77:0);
    offset.copy(secondPoint).addScaledVector(forward,.23);offset.y=.92+aged*.52;
    mistSize.set(.39+aged*.86,.29+aged*.72,.36+aged*.81);
    rearSmoke(offset,mistSize,t,hit&&back?show(age-gap,.025,.115,.27,.63)*.66:0);
    frontLight(firstPoint,hit?show(age,0,.024,.086,.304)*10.2:0);
    rearLight(secondPoint,hit&&back?show(age-gap,0,.023,.073,.244)*10.8:0);
    chargeLight(source,set*4.1+fire*5.1);
    heated(t,fire*.78+(hit?show(age,.026,.19,.239,.50)*.23:0));
  };
}
export const fistHitTimes=[.60,.89,attackSpecs.fist.contact];
const blows=fistHitTimes;
const fistDirections=[
  {from:.30,upward:.05,height:1.13,w:.31,d:.20},
  {from:-.39,upward:-.24,height:.92,w:.28,d:.31},
  {from:.09,upward:.72,height:1.17,w:.47,d:.49},
];

function fistEffect({group,to,forward,side}) {
  const jade=rgb(.056,.77,.51), jadeEdge=rgb(.15,1.17,.89);
  const current=makeTube(group,{color:jade,edge:jadeEdge,rows:37,kind:1,order:7.5});
  const trace=makeTube(group,{color:jade,edge:rgb(.51,1.28,.68),rows:34,order:8.1});
  const guard=makeKnuckleGuard(group);
  const vanes=makeImpactVanes(group,0xa0e8cb);
  const reflection=makeGroundLight(group,jade,2.33);
  const vapor=makeMist(group,rgb(.093,.38,.25));
  const gleam=pulseLight(group,0x60ffbc,3.93);
  const striker=directionalChips(group,{count:46,color:rgb(.41,1.47,.64),hot:true,speed:4.8,lift:2.6,size:.0098,life:.42});
  const broken=directionalChips(group,{count:22,color:rgb(.19,.29,.23),hot:false,speed:3.9,lift:3.9,size:.048,life:.67});
  const focus=to.clone().addScaledVector(forward,-.20);
  const chest=vector(),left=vector(),axis=vector(),vertical=vector(),start=vector(),mistSize=vector(),smoke=vector();

  return (t,palm,hit)=>{
    let beat=0;
    for(let i=1;i<blows.length;i++) if(t>=blows[i]-.079) beat=i;
    const age=t-blows[beat], final=beat===2, type=fistDirections[beat];
    const life=Math.max(0,age);
    const swing=show(age,-.134,-.026,.101,final?.358:.258);
    const burst=hit?show(age,-.013,.037,.089,final?.405:.258):0;
    const carry=ease(age,-.028,.133);
    const thrust=(.73+carry*.71+life*(final?1.17:.55));
    chest.copy(focus).addScaledVector(side,type.from*.34);
    chest.y=type.height;
    axis.copy(forward).addScaledVector(side,type.from).addScaledVector(up,type.upward).normalize();
    left.crossVectors(axis,up).normalize();
    vertical.crossVectors(left,axis).normalize();
    start.copy(palm).addScaledVector(axis,.05);
    guard(start,axis,(beat-1)*.40+life*.62,swing*(final?1.36:.86));
    vanes(chest,forward,side,beat,age,burst*.93);
    function flow(s,u,radius) {
      const curve=Math.sin(Math.PI*u);
      s.center.copy(chest).addScaledVector(axis,(u-.21)*thrust)
        .addScaledVector(side,type.from*(curve*.24+u*.33));
      s.radialA.copy(left);
      s.radialB.copy(vertical);
      const width=radius*(.51+curve*.49)*(1.+life*.79);
      s.a=type.w*width;
      s.b=type.d*width;
    }
    current.update(t,burst*.85,(s,u)=>flow(s,u,1.22));
    trace.update(t,burst*.73,(s,u)=>flow(s,u,.38));
    striker(chest,axis,hit?age:-1,final?1.24:.91);
    broken(chest,axis,hit&&final?age-.019:-1);
    smoke.copy(chest).addScaledVector(axis,.37+life*1.16);
    mistSize.set(.37+life*1.32,.23+life*1.03,.40+life*.63);
    vapor(smoke,mistSize,t,hit?show(age,.024,.12,.20,final?.61:.375)*(final?.71:.39):0);
    reflection(chest,t,burst*(final?.58:.33),life*3.8);
    gleam(chest,burst*(final?9.8:6.8)+swing*1.5);
  };
}
function gravityBody(group) {
  const geometry=new T.IcosahedronGeometry(.68,1);
  const positions=geometry.attributes.position;
  const colors=new Float32Array(positions.count*3);
  const cool=new T.Color(0x272d34), bright=new T.Color(0x747b63), color=new T.Color();
  for(let i=0;i<positions.count;i++){
    const [x,y,z]=[positions.getX(i),positions.getY(i),positions.getZ(i)];
    const cut=.82+.20*Math.sin(x*17.8+y*13.4-z*11.9)**2;
    const warp=.05*Math.cos(x*7.65+z*13.1);
    positions.setXYZ(i,x*cut+warp,y*cut*1.11+.04*Math.cos(z*21.3),z*cut);
    color.copy(cool).lerp(bright,(.55+.45*Math.sin(x*31.+y*53.+z*81.))*.83);
    color.toArray(colors,i*3);
  }
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  const body=new T.Mesh(geometry,new T.MeshStandardMaterial({
    color:0xffffff,vertexColors:true,roughness:.67,metalness:.28,flatShading:true,
    emissive:0xaeff64,emissiveIntensity:.38,
  }));
  body.material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 facet;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>','#include <begin_vertex>\nfacet=position;');
    shader.fragmentShader='varying vec3 facet;\n'+shader.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        float cut=facet.y*49.+facet.x*13.+sin(facet.z*17.+facet.x*21.);
        float shelves=.68+.32*pow(.5+.5*sin(cut),3.);
        float aggregate=.71+.29*cos(facet.x*192.+facet.z*218.)*sin(facet.y*153.);
        diffuseColor.rgb*=shelves*aggregate;`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        float path=facet.x*7.1+facet.y*11.4+facet.z*8.7+.79*sin(facet.z*22.+facet.y*7.);
        float fissure=exp(-37.*abs(sin(path)));
        float ember=.42+.58*pow(.5+.5*cos(facet.z*33.+facet.y*22.),4.);
        totalEmissiveRadiance*=.031+fissure*ember*1.70;`);
  };
  group.add(body);
  return body;
}
function fractures(group, point) {
  const time={value:0},power={value:0};
  const mesh=new T.Mesh(new T.PlaneGeometry(6.3,6.3),makeShader(`
    uniform float time,power;
    uniform vec3 origin;
    void main(){
      vec2 q=world.xz-origin.xz;
      float r=length(q),angle=atan(q.y,q.x);
      float spokes=angle*6.0+.65*sin(r*12.)+.21*sin(r*27.+angle*6.);
      float fine=exp(-26.*abs(sin(spokes)));
      float edge=exp(-5.5*abs(sin(spokes)))*.24;
      float release=smoothstep(r-.12,r+.09,time*8.3);
      float tip=1.-smoothstep(.61,2.96,r);
      float deck=step(-1.12,world.x)*(1.-step(5.70,world.x));
      gl_FragColor=vec4(mix(vec3(.31,.61,.14),vec3(.86,1.29,.37),fine),
        (fine*.89+edge)*release*tip*power*deck);
    `,{time,power,origin:{value:point}}));
  mesh.rotation.x=-Math.PI/2;
  mesh.position.set(point.x,.014,point.z);
  mesh.renderOrder=4.4;
  group.add(mesh);
  return (t,gain)=>{
    mesh.visible=gain>.006;
    time.value=t;
    power.value=gain;
  };
}

function gravityEffect({group,to,forward,side}) {
  const chartreuse=rgb(.32,.68,.16), green=rgb(.58,1.02,.255);
  const core=gravityBody(group);
  const slabs=makeFracturedDeck(group,to);
  const orbit=makeShards(group,{count:34,color:rgb(.24,.28,.22)});
  const large=makeShards(group,{count:16,color:rgb(.31,.34,.26)});
  const rupture=makeShards(group,{count:52,color:rgb(.30,.33,.28)});
  const sparks=makeShards(group,{count:51,color:green,hot:true});
  const pressure=makeTube(group,{color:chartreuse,edge:green,rows:40,sides:10,kind:1});
  const surge=makeWave(group,chartreuse,green,{span:TAU*.76,width:.033,loop:72,order:7.1});
  const field=makeGroundLight(group,chartreuse,3.21);
  const darkDust=makeMist(group,rgb(.17,.26,.13));
  const edgeDust=makeMist(group,rgb(.23,.44,.15));
  const crack=fractures(group,to);
  const light=pulseLight(group,0xbded72,5.25);
  const falling=to.clone(),contact=to.clone().setY(.082),node=vector(),extent=vector(),lamp=vector();
  const strike=attackSpecs.gravity.contact;

  return (t,palm,hit)=>{
    const since=t-strike, age=Math.max(0,since);
    const gather=show(t,.265,.758,strike+.024,strike+.248);
    const down=ease(t,.835,strike);
    const fall=down**1.54;
    const heavy=hit?show(since,0,.049,.159,.67):0;
    falling.copy(to).addScaledVector(side,.34*(1.-fall)).addScaledVector(forward,.21*(1.-fall));
    falling.y=mix(3.02,.76,fall)-age*.15;
    core.visible=gather>.008;
    core.position.copy(falling);
    core.rotation.set(t*1.28,t*1.5,.39+t*.47);
    const mass=gather*(.78+down*.30), squeeze=ease(age,0,.088);
    core.scale.set(mass*(.91+squeeze*.31),mass*(1.14-squeeze*.40),mass*(.94+squeeze*.35));
    core.material.emissiveIntensity=.29+down*.33+heavy*.47;

    orbit(gather>.01,(chip,color,s,i)=>{
      const closing=ease(t,.33+s.delay*.14,.96);
      const angle=t*(2.6+s.speed*.84)+s.turn;
      const reach=mix(2.31,.46+s.speed*.51,closing)+age*1.58;
      chip.position.set(falling.x+Math.cos(angle)*reach,
        falling.y+Math.sin(angle*1.23)*reach*.46+(s.lift-.55)*.61,
        falling.z+Math.sin(angle)*reach);
      const grain=(.067+s.noise*.132)*gather;
      chip.scale.set(grain*1.42,grain*.69,grain);
      chip.rotation.set(angle+s.lift,i*.57,angle*1.23);
      color.multiplyScalar(.54+s.speed*.92);
    });

    large(t>=.36&&since<.34,(chip,color,s,i)=>{
      const close=show(t,.37+s.delay*.073,.74,strike+.029,strike+.318);
      const turn=s.turn+t*(1.46+s.speed*.34);
      const span=mix(1.44,.43+s.noise*.28,ease(t,.47,.94))+age*3.2;
      chip.position.set(falling.x+Math.cos(turn)*span,
        Math.max(.07,falling.y+(s.lift-.35)*span*.84+(Math.sin(turn*1.63)*span*.32)+age*.86),
        falling.z+Math.sin(turn)*span);
      const size=(.13+s.noise*.263)*close;
      chip.scale.set(size*.94,size*(.92+s.lift*.62),size*.71);
      chip.rotation.set(i*.34+t*2.4,turn*.46,i*.84+t*1.6);
      color.multiplyScalar(.72+s.speed*.81);
    });

    const dive=show(t,.779,.982,strike-.025,strike+.11);
    pressure.update(t,dive*.83,(s,u)=>{
      const crescent=Math.sin(Math.PI*u);
      s.center.copy(falling).addScaledVector(side,.15*Math.sin(u*9.+t*16.)*crescent)
        .addScaledVector(forward,.13*Math.cos(u*10.+t*14.)*crescent);
      s.center.y+=u*(.84+.55*fall);
      s.radialA.copy(side);s.radialB.copy(forward);
      s.a=(.58-.37*u)*(.78+.22*crescent);
      s.b=s.a*.87;
    });
    surge.mesh.position.copy(contact);
    surge.mesh.position.y=.067+age*.16;
    surge.mesh.rotation.set(-Math.PI/2,0,t*.37+.28);
    const radius=.29+Math.min(2.21,age*6.92);
    surge.mesh.scale.set(radius,radius,1.29);
    surge.update(t,heavy*.58);

    slabs(since,hit);
    crack(age,heavy*.92);
    field(contact,t,gather*.13+heavy*.65,age*5.65);
    ballistic(rupture,contact,hit?since-.033:-1,{speed:4.9,upward:3.51,radius:.53,lifetime:.96,
      size:.104,shards:true});
    ballistic(sparks,contact,hit?since:-1,{speed:5.8,upward:3.31,radius:.33,lifetime:.54,size:.012});
    node.copy(contact).addScaledVector(forward,.23+age*.32);
    node.y=.25+age*.39;
    extent.set(.61+age*2.73,.23+age*.34,.61+age*2.73);
    darkDust(node,extent,t,hit?show(since,.041,.143,.40,1.07)*.68:0);
    node.copy(contact).addScaledVector(side,-.61-age*.14);
    node.y=.18+age*.49;
    extent.set(.48+age*1.93,.19+age*.44,.35+age*1.65);
    edgeDust(node,extent,t,hit?show(since,.09,.25,.42,1.13)*.51:0);
    lamp.copy(contact);lamp.y=since<0?falling.y-.31:.56;
    light(lamp,gather*3.4+heavy*13.9);
  };
}
const effects={rift:createRiftStrike,flare:flareEffect,fist:fistEffect,gravity:gravityEffect};

export function sampleAttackMotion(position,skill,from,forward,side,range,t) {
  position.copy(from);
  if(skill==='rift')return placeRiftStep(position,from,forward,side,range,t);
  if(skill==='fist'){
    position.addScaledVector(forward,(range-1.19)*ease(t,.09,.49)+.18*ease(t,1.04,1.25));
    position.addScaledVector(side,.15*show(t,.45,.60,.68,.82)-.20*show(t,.736,.89,.96,1.073)
      +.11*show(t,1.06,1.23,1.31,1.47));
    position.y-=.029*show(t,.75,.88,.92,1.04)+.034*show(t,1.035,1.18,1.23,1.36);
  }
  return position;
}

export function createAttackVariant(skill,scene,{from,to,forward,side,target,secondaryTarget,beamEnd,reactTarget=true}) {
  const spec=attackSpecs[skill];
  const group=new T.Group();
  group.name=spec.title;
  scene.add(group);
  const rigs=[target,secondaryTarget].filter(Boolean).map(actor=>actor.children[0]);
  const originals=rigs.map(rig=>new Set(rig.children));
  const update=effects[skill]({group,from,to,forward,side,target,secondaryTarget,beamEnd});
  const attachments=rigs.flatMap((rig,index)=>rig.children.filter(node=>!originals[index].has(node)));
  const position=from.clone();
  const rig=target.children[0];
  const range=Math.hypot(to.x-from.x,to.z-from.z);
  const targetRest=target.position.clone();
  const motion=(t)=>sampleAttackMotion(position,skill,from,forward,side,range,t);
  function animation(t){
    if(skill==='fist'){
      if(t>=1.01) return {role:'charged-punch',start:1.01,duration:.50};
      if(t>=.73) return {role:'punch',start:.73,duration:.29};
      if(t>=.45) return {role:'punch',start:.45,duration:.29};
    }
    return {role:spec.role,start:.10,duration:spec.duration};
  }
  function play(t,palm,hit) {
    if(!reactTarget)return update(t,palm,hit);
    if(skill==='rift'){
      const since=t-riftTiming.contact;
      const collision=hit?show(since,0,.033,.073,.44):0;
      const carried=hit?ease(since,.017,.32):0;
      rig.rotation.x=-.62*collision-.08*carried;
      rig.rotation.y=.37*collision+.13*carried;
      rig.rotation.z=.34*collision+.04*carried;
      rig.position.y=-.066*collision;
      target.position.copy(targetRest).addScaledVector(forward,.46*carried+.10*collision)
        .addScaledVector(side,-.26*carried-.086*collision);
      return update(t,palm,hit);
    }
    if(skill==='fist'){
      const first=hit?show(t-blows[0],0,.038,.089,.249):0;
      const low=hit?show(t-blows[1],0,.035,.086,.225):0;
      const third=hit?show(t-blows[2],0,.047,.094,.44):0;
      rig.rotation.x=-.30*first+.24*low-.59*third;
      rig.rotation.y=-.14*first+.22*low+.18*third;
      rig.rotation.z=.24*first-.28*low+.18*third;
      rig.position.y=-.09*low+(hit?show(t-blows[2],0,.132,.18,.61)*.46:0);
      target.position.copy(targetRest).addScaledVector(forward,.093*first+.071*low+.29*third)
        .addScaledVector(side,-.17*first+.14*low+.12*third);
      update(t,palm,hit);
      return;
    }
    let r=0,lift=0;
    if(hit){
      const hits=[spec.contact];
      for(const at of hits){
        const phase=t-at;
        r+=show(phase,0,.055,.095,.42);
      }
      if(skill==='gravity') lift=show(t-spec.contact,0,.14,.23,.67)*.57;
    }
    rig.rotation.x=-r*(skill==='gravity'?.54:.40);
    rig.rotation.z=r*.12;
    rig.position.y=lift;
    target.position.copy(targetRest).addScaledVector(forward,.20*r);
    update(t,palm,hit);
  }
  function dispose(){
    const geometry=new Set(),materials=new Set(),protectedGeometry=new Set(),protectedMaterials=new Set();
    function protect(actor){
      if(!actor)return;
      actor.traverse(node=>{
        if(node.geometry)protectedGeometry.add(node.geometry);
        for(const material of Array.isArray(node.material)?node.material:[node.material]){
          if(material)protectedMaterials.add(material);
        }
      });
    }
    for(const node of attachments)node.removeFromParent();
    protect(target);
    protect(secondaryTarget);
    for(const root of [group,...attachments]){
      root.removeFromParent();
      root.traverse(node=>{
        if(node.isInstancedMesh)node.dispose();
        if(node.geometry)geometry.add(node.geometry);
        if(node.material){
          for(const item of Array.isArray(node.material)?node.material:[node.material])materials.add(item);
        }
      });
    }
    for(const item of geometry)if(!protectedGeometry.has(item))item.dispose();
    for(const item of materials)if(!protectedMaterials.has(item))item.dispose();
  }
  return {spec,motion,animation,play,dispose};
}
