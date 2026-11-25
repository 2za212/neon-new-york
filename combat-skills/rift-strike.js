import * as T from 'three';
import {up,ease,mix,vector,rgb,makeShader,makeTube,makeGroundLight,makeMist,makeShards} from './attack-vfx-kit.js';
import {createRiftBloom} from './rift-bloom.js';

export const riftTiming={push:.379,contact:.584,release:.632,landing:.804};

const tipAxis=vector(0,1,0);
const pink=rgb(.96,.19,.45);
const purple=rgb(.33,.062,.90);
const hot=rgb(1.94,.71,.28);
const phase=(t,start,peak,release,end)=>ease(t,start,peak)*(1-ease(t,release,end));

export function placeRiftStep(out,from,forward,side,range,t) {
  const {push,contact,release,landing}=riftTiming;
  const weight=phase(t,.105,.329,push,.435);
  const drive=ease(t,push,contact);
  const pass=ease(t,release,landing);
  out.copy(from).addScaledVector(forward,-.162*weight+(range-.50)*drive+1.51*pass);
  out.addScaledVector(side,-.096*weight+.72*drive+.63*pass+.09*Math.sin(Math.PI*pass));
  out.y-=.061*weight+.038*phase(t,landing-.027,landing+.031,landing+.103,landing+.23);
  return out;
}

function shell(points,height,bevel) {
  const shape=new T.Shape();
  shape.moveTo(...points[0]);
  for(const point of points.slice(1)) shape.lineTo(...point);
  shape.closePath();
  const geometry=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelThickness:bevel,
    bevelSize:bevel,bevelSegments:1,steps:1});
  geometry.translate(0,0,-height*.5);
  return geometry;
}

function attachCutter(group) {
  const grip=new T.Group();
  grip.name='瞬斩 · 相刃';
  const dark=new T.MeshStandardMaterial({color:0x273142,metalness:.75,roughness:.34});
  const edge=new T.MeshStandardMaterial({color:0x9c7794,metalness:.72,roughness:.25,
    emissive:0xce1267,emissiveIntensity:.32});
  const channel=new T.MeshBasicMaterial({color:0xff617a,toneMapped:false});
  const body=new T.Mesh(shell([
    [-.071,.155],[-.104,.42],[-.093,.793],[-.027,1.067],
    [.036,.911],[.093,.551],[.074,.224],[.031,.146],
  ],.041,.009),[dark,edge]);
  const guard=new T.Mesh(shell([
    [-.127,.092],[-.103,.163],[-.041,.182],[.071,.160],[.16,.115],
    [.103,.068],[.037,.059],[-.056,.080],
  ],.063,.008),[dark,edge]);
  const handle=new T.Mesh(new T.CylinderGeometry(.037,.047,.214,7),dark);
  handle.position.y=-.046;
  grip.add(body,guard,handle);
  for(const z of [-.026,.026]){
    const groove=new T.Mesh(shell([[-.047,.25],[-.063,.55],[-.051,.826],[-.029,.922],
      [-.028,.765],[-.035,.412],[-.022,.26]],.006,.002),channel);
    groove.position.z=z;
    grip.add(groove);
  }
  group.add(grip);
  return grip;
}

function attachSplitPlate(rig) {
  const plate=new T.Group();
  plate.name='瞬斩 · 装甲熔口';
  plate.position.set(0,1.155,.157);
  rig.add(plate);
  const steel=new T.MeshStandardMaterial({color:0x47505f,roughness:.33,metalness:.62,
    emissive:0x9180ad,emissiveIntensity:.125});
  const cutMetal=new T.MeshStandardMaterial({color:0xa18c97,roughness:.32,metalness:.78});
  const sectionA=new T.Mesh(shell([
    [-.229,-.151],[-.214,.113],[-.174,.18],[.149,.164],
    [.22,.128],[.143,.056],[.028,.005],[-.009,-.045],[-.134,-.084],
  ],.046,.014),[steel,cutMetal]);
  const sectionB=new T.Mesh(shell([
    [-.217,-.161],[-.134,-.084],[-.009,-.045],[.028,.005],[.143,.056],
    [.22,.128],[.235,-.109],[.186,-.173],[-.141,-.184],
  ],.040,.012),[steel,cutMetal]);
  const liner=new T.Mesh(shell([
    [-.245,-.168],[-.233,.137],[-.184,.194],[.172,.178],
    [.242,.129],[.246,-.132],[.194,-.185],[-.169,-.192],
  ],.023,.008),new T.MeshStandardMaterial({color:0x202334,roughness:.61,metalness:.53}));
  liner.position.z=-.027;
  const age={value:0};
  const score=new T.Mesh(new T.PlaneGeometry(.49,.395),makeShader(`
    uniform float age;
    void main(){
      vec2 p=st-.5;
      float z=p.y-(p.x*.71+.007*sin(p.x*37.)+.005*sin(p.x*83.));
      float line=exp(-abs(z)*(141.-min(age,1.)*42.));
      float broad=exp(-abs(z)*39.)*.31;
      float branch=exp(-139.*abs(z-.082*sin(p.x*8.1)))*exp(-7.*abs(p.x-.14))*.34;
      float coverage=1.-smoothstep(.380,.493,abs(p.x));
      vec3 color=mix(vec3(.48,.063,.075),vec3(1.82,.67,.24),exp(-age*5.)*line);
      gl_FragColor=vec4(color,(line+broad+branch)*coverage*(1.-smoothstep(.48,1.45,age)));
  `,{age}));
  score.position.z=.037;
  score.renderOrder=9.3;
  plate.add(liner,sectionA,sectionB,score);
  return (t,hit)=>{
    const delta=t-riftTiming.contact;
    const spread=hit?ease(delta,0,.057):0;
    const settle=1-.32*ease(delta,.18,.58);
    sectionA.position.set(-.021*spread,.026*spread,.072*spread*settle);
    sectionB.position.set(.020*spread,-.028*spread,.046*spread*settle);
    sectionA.rotation.set(-.48*spread*settle,-.25*spread,.11*spread);
    sectionB.rotation.set(.32*spread*settle,.20*spread,-.11*spread);
    age.value=delta;
    score.visible=hit&&delta>=0&&delta<1.45;
  };
}

function deckScore(group,ground,axis) {
  const intensity={value:0},heat={value:0};
  const tile=new T.Mesh(new T.PlaneGeometry(2.44,2.44),makeShader(`
    uniform float intensity,heat;
    uniform vec3 foot,axis;
    void main(){
      vec3 d=world-foot;
      float along=dot(d,axis), width=dot(d,vec3(-axis.z,0.,axis.x));
      float slice=width-(.014*sin(along*31.)+.019*sin(along*13.));
      float chip=.76+.24*sin(along*117.);
      float limit=1.-smoothstep(.38,1.03,abs(along));
      float core=exp(-abs(slice)*173.);
      float rough=exp(-abs(slice)*36.)*.68*chip;
      float tint=core*.69+rough*.31;
      float spill=exp(-abs(slice)*14.)*.14;
      vec3 color=mix(vec3(.021,.014,.030),vec3(.98,.22,.29),
        (tint+spill)*exp(-heat*6.));
      gl_FragColor=vec4(color,(core+rough+spill)*limit*intensity);
  `,{intensity,heat,foot:{value:ground},axis:{value:axis}},{blending:T.NormalBlending}));
  tile.position.set(ground.x,.015,ground.z);
  tile.rotation.x=-Math.PI/2;
  tile.renderOrder=5.2;
  group.add(tile);
  return (t,value)=>{
    tile.visible=value>.009;
    intensity.value=value;
    heat.value=t;
  };
}

const flightDirection=vector();
function strikeFragments(update,point,axis,cross,time,metal,grounded=false) {
  update(time>=0&&time<(grounded?.42:metal?.94:.47),(chip,color,s,i)=>{
    const start=s.delay*(metal?.055:.035);
    const t=Math.max(0,time-start);
    const length=grounded?.22+s.life*.19:(metal?.63:.28)+s.life*(metal?.28:.15);
    const live=time>=start?1.-ease(t,length*.53,length):0;
    const pace=(metal?2.32:5.85)*(.37+s.speed*.84);
    const drift=(s.speed<.17?-.25:1.)*pace;
    const lateral=Math.cos(s.turn)*(.52+s.noise*1.3);
    chip.position.copy(point).addScaledVector(axis,drift*t)
      .addScaledVector(cross,t*lateral);
    const rise=grounded?.26+s.lift*.67:metal?.92+s.lift*1.53:.40+s.lift*2.4;
    const y=point.y+t*rise-(metal?5.30:4.7)*t*t;
    chip.position.y=Math.max(.027,y);
    const gain=(grounded?.023:metal?.050:.0121)*live*(.54+s.length*.99);
    chip.scale.set(gain,gain*(metal?.81+s.noise:3.5+s.noise*4.8),gain*.72);
    if(metal){
      chip.rotation.set(t*11.0+s.turn,t*(i%7+4),-.71+t*(4+i%4));
    } else {
      flightDirection.copy(axis).multiplyScalar(drift).addScaledVector(cross,lateral)
        .addScaledVector(up,rise-9.4*t).normalize();
      chip.quaternion.setFromUnitVectors(up,flightDirection);
    }
    color.multiplyScalar(metal?.43+s.life*1.02:live*(.85+s.lift));
  });
}

export function createRiftStrike({group,from,to,forward,side,target}) {
  const rig=target.children[0];
  const armor=attachSplitPlate(rig);
  const cutter=attachCutter(group);
  const tail=makeTube(group,{color:purple,edge:pink,rows:37,sides:7,kind:1,order:7});
  const footMist=makeMist(group,rgb(.31,.13,.40),5.9);
  const chestMist=makeMist(group,rgb(.38,.21,.47),6.1);
  const deck=makeGroundLight(group,rgb(.62,.12,.57),2.18);
  const launchGravel=makeShards(group,{count:14,color:rgb(.18,.21,.25)});
  const hitSparks=makeShards(group,{count:47,color:hot,hot:true});
  const chips=makeShards(group,{count:15,color:rgb(.35,.33,.43)});
  const landingGravel=makeShards(group,{count:22,color:rgb(.23,.20,.24)});
  const light=new T.PointLight(0xff945b,0,3.90,2);
  const rim=new T.PointLight(0xc552e2,0,3.60,2);
  group.add(light,rim);
  rig.updateWorldMatrix(true,false);
  const point=rig.localToWorld(vector(.031,1.157,.194));
  const bloom=createRiftBloom(group,point,forward,side);
  const reflectedEdge=makeGroundLight(group,rgb(.19,.35,.87),2.98);
  const strike=riftTiming.contact;
  const {push,landing}=riftTiming;
  const range=from.distanceTo(to);
  const launch=placeRiftStep(vector(),from,forward,side,range,push).setY(.045);
  const stop=placeRiftStep(vector(),from,forward,side,range,landing).setY(.039).addScaledVector(forward,-.30);
  const scored=point.clone().addScaledVector(side,1.22).addScaledVector(forward,.42).setY(.023);
  const scrape=deckScore(group,scored,forward.clone().addScaledVector(side,.56).normalize());
  const lift=vector(),origin=vector(),direction=vector();
  const mistSize=vector(),handToImpact=vector(),bladeTip=vector();
  const tangent=side.clone().negate().addScaledVector(forward,-.30).normalize();
  const reverse=forward.clone().negate();

  return (t,palm,hit)=>{
    const age=t-strike, elapsed=Math.max(0,age);
    const showBlade=phase(t,.218,.374,landing+.083,1.18);
    const flick=ease(t,push+.018,strike+.125);
    direction.copy(forward).addScaledVector(side,mix(-.92,1.27,flick))
      .addScaledVector(up,mix(.77,-.53,flick)).normalize();
    handToImpact.copy(point).sub(palm);
    if(handToImpact.lengthSq()>.02){
      handToImpact.normalize();
      direction.lerp(handToImpact,phase(t,strike-.107,strike-.018,strike+.021,strike+.117)*.97).normalize();
    }
    cutter.visible=showBlade>.009;
    cutter.position.copy(palm).addScaledVector(direction,.015);
    cutter.quaternion.setFromUnitVectors(tipAxis,direction);
    cutter.rotateY(-.22+flick*.71);
    cutter.scale.set(1,showBlade,1);
    armor(t,hit);

    const exposure=phase(age,-.014,.047,.093,.31);
    const base=hit?1:.31;
    bladeTip.copy(cutter.position).addScaledVector(direction,showBlade*1.067);
    bloom(age,hit,bladeTip);
    reflectedEdge(point,t,exposure*base*.32,elapsed*2.22);
    const sprint=phase(t,push-.003,push+.07,landing,landing+.16);
    const spread=ease(t,push,landing);
    tail.update(t,sprint*.45,(s,u)=>{
      const advanced=mix(Math.max(0,spread-.40),spread,u);
      placeRiftStep(s.center,from,forward,side,range,mix(push,landing,advanced));
      s.center.addScaledVector(side,-.01+.075*Math.sin(u*15.));
      s.center.y=.057+.043*Math.sin(Math.PI*u);
      s.radialA.copy(side);
      s.radialB.copy(up);
      s.a=.033+.073*Math.sin(Math.PI*u);
      s.b=.018+.024*Math.sin(Math.PI*u);
    });

    const active=hit?age:-1;
    strikeFragments(hitSparks,point,tangent,forward,active,false);
    strikeFragments(chips,point,tangent,forward,active-.022,true);
    strikeFragments(launchGravel,launch,reverse,side,t-push,true,true);
    strikeFragments(landingGravel,stop,forward,side,t-landing+.012,true,true);

    const touchdown=t-landing;
    const foot=t>landing-.019;
    const dustTime=foot?touchdown:t-push;
    origin.copy(foot?stop:launch).addScaledVector(forward,Math.max(0,dustTime)*.22*(foot?1:-1));
    origin.y=.10+Math.max(0,dustTime)*.25;
    mistSize.set(.44+Math.max(0,dustTime)*1.44,.145+Math.max(0,dustTime)*.37,.32+Math.max(0,dustTime)*.75);
    footMist(origin,mistSize,dustTime,phase(dustTime,-.014,.086,.195,.49)*.70);
    lift.copy(point).addScaledVector(tangent,.27+elapsed*.36);lift.y=.66+elapsed*.58;
    mistSize.set(.34+elapsed*1.15,.28+elapsed*.49,.29+elapsed*.90);
    chestMist(lift,mistSize,elapsed,hit?phase(age,.025,.125,.27,.63)*.55:0);
    deck(scored,t,phase(age,.025,.086,.102,.48)*.57*base,.17+elapsed*.91);
    scrape(elapsed,hit?phase(age,.056,.128,.59,1.24):0);

    light.position.copy(point).addScaledVector(forward,-.34);
    light.intensity=hit?phase(age,0,.018,.037,.17)*10.5:0;
    rim.position.copy(point).addScaledVector(side,.86);
    rim.intensity=exposure*base*5.6;
  };
}
