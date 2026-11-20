import * as T from 'three';
import {districtNightJobs} from './nyc-district-jobs.js';
import {fitIndustrialPower} from './nyc-industrial-power.js';
import {furnishSpringNightMarket} from './nyc-spring-market-night.js';

const zinc=0xb7c6bf,iron=0x47525a,amber=0xd58450,teal=0x70a69f;
const sCurve=(a,b,t)=>T.MathUtils.smoothstep(t,a,b);

// The city crowd owns the skeleton, animation budget and instance batches.
// Additional pieces are rigidly attached to those same joints.
function uniform(role){
  return (actor,P)=>{
    const {torso,head}=actor;
    if(role==='kitchen'){
      P('fabric',torso,0,.09,.15,.34,.42,.03,0xae6b4b);
      P('fabric',torso,0,-.08,.15,.32,.08,.04,0x79503e);
      P('fabric',head,0,.29,.00,.24,.12,.23,0xbcbba9);
      P('fabric',head,0,.25,.12,.24,.035,.12,0xd5caae);
    }else{
      const worker=role==='courier';
      P('fabric',torso,0,.18,.148,.34,.31,.035,worker?amber:teal);
      for(const x of [-.12,.12])P('fabric',torso,x,.20,.174,.037,.25,.022,0xe1d9a6);
      P('fabric',torso,0,.11,.175,.37,.034,.022,0xdad9bc);
      if(worker){
        P('fabric',head,0,.27,-.012,.25,.10,.25,0xbd8352);
        P('fabric',head,0,.32,-.014,.20,.036,.18,0xd29a69);
      }else{
        P('shoes',actor.arms[1].elbow,.015,-.27,.03,.09,.14,.10,iron);
        P('glow',actor.arms[1].elbow,.015,-.33,.07,.045,.035,.055,0x8fd8d1);
      }
    }
    if(role==='courier'){
      const bag=new T.Group();
      torso.add(bag);actor.shiftBag=bag;
      P('fabric',bag,0,.035,.33,.44,.32,.36,0xba784d);
      P('shoes',bag,0,.185,.33,.46,.055,.38,0x493d3b);
      P('fabric',bag,0,.025,.516,.44,.07,.018,0xddae79);
      for(const x of [-.14,.14])P('fabric',bag,x,.035,.524,.043,.32,.022,0x5a5048);
    }
  };
}

function counterPose(actor,time){
  const t=(time+actor.offset)%7.9;
  const reach=sCurve(.5,1.5,t)*(1-sCurve(2.6,3.4,t));
  const pack=sCurve(3.6,4.4,t)*(1-sCurve(5.8,6.7,t));
  actor.torso.rotation.x=reach*.18+pack*.10;
  actor.torso.rotation.y=reach*.27-pack*.22;
  actor.head.rotation.x=.11+.15*reach;
  for(const arm of actor.arms){
    arm.shoulder.rotation.x=-.16-(arm.side>0?.66:.31)*reach-.48*pack;
    arm.elbow.rotation.x=-.42-.34*pack;
  }
  actor.root.userData.shiftAction=reach>.2?'reach':pack>.2?'pack':'wait';
}

function pickupPose(actor,time,walking,direction,progress,stop){
  const atShelf=progress>.5;
  const loaded=walking?direction<0:atShelf?stop>.48:stop<.44;
  actor.shiftBag.scale.setScalar(loaded?1:.00001);
  const lift=walking?0:Math.sin(Math.PI*stop);
  actor.torso.rotation.x=lift*.23;
  actor.head.rotation.x=lift*.24;
  if(loaded||lift>.05){
    for(const arm of actor.arms){
      arm.shoulder.rotation.x=-.39-.28*lift;
      arm.elbow.rotation.x=-1.04+.44*lift;
    }
  }
  actor.root.userData.shiftAction=walking?(loaded?'deliver':'return'):(atShelf?'collect':'unload');
}

function benchPose(actor,time){
  const t=(time+actor.offset)%8.7;
  const inspect=sCurve(.35,1.5,t)*(1-sCurve(4.5,5.6,t));
  const turn=sCurve(5.6,6.3,t)*(1-sCurve(7.4,8.5,t));
  actor.torso.rotation.x=.08+inspect*.27;
  actor.torso.rotation.y=turn*-.45;
  actor.head.rotation.x=.12+inspect*.24;
  actor.arms[1].shoulder.rotation.x=-.22-.58*inspect;
  actor.arms[1].elbow.rotation.x=-.53-inspect*(.33+.16*Math.sin(t*4));
  actor.arms[0].shoulder.rotation.x=-.14-.40*inspect-.39*turn;
  actor.arms[0].elbow.rotation.x=-.34-.27*inspect;
  actor.root.userData.shiftAction=inspect>.2?'inspect':turn>.2?'reach':'wait';
}

function scannerPose(actor,time,walking,direction,progress,stop){
  const scan=walking?0:Math.sin(Math.PI*stop);
  actor.torso.rotation.x=scan*.17;
  actor.head.rotation.x=scan*.22;
  actor.arms[1].shoulder.rotation.x-=scan*.62;
  actor.arms[1].elbow.rotation.x-=scan*.64;
  actor.root.userData.shiftAction=walking?'walk':progress>.5?'scan':'check';
}

export function createNightShifts(scene,{box,collider,ground,buildings,localLights,materials,sign}){
  const crowdPaths=[],stats={sites:[],boxes:0,colliders:0,practicalLights:0,infrastructureLights:0,infrastructureBoxes:0};
  if(materials&&!materials.districtWorkLens){
    materials.districtWorkLens=new T.MeshBasicMaterial({color:0xffffff,vertexColors:true,toneMapped:false});
    materials.districtWorkLens.name='夜班灯具 / 体素灯罩';
    materials.districtWorkLens.userData.keepDistant=true;
  }
  function practicalLight(x,y,z,color,power,reach){
    const lamp=new T.PointLight(color,power,reach,2);
    lamp.position.set(x,y,z);lamp.userData.nightPower=power;lamp.userData.workLamp=true;
    scene.add(lamp);localLights.push(lamp);stats.practicalLights++;
  }
  function frame(x,z,a,level){
    const c=Math.cos(a),s=Math.sin(a);
    const P=(u,v)=>[x+c*u+s*v,z-s*u+c*v];
    const y=ground(x,z,level===undefined?.8:level+.09);
    function B(mat,u,h,v,w,sy,d,tint=0xffffff){
      const [px,pz]=P(u,v);
      box(mat==='districtWorkLens'&&!materials?'lamp':mat,px,y+h,pz,w,sy,d,tint,a);stats.boxes++;
    }
    function solid(u,h,v,w,sy,d){
      // Slice oblique benches, keeping their diagonal ends clear for feet.
      const n=Math.abs(c*s)>.05?Math.ceil(w/.48):1;
      for(let j=0;j<n;j++){
        const slice=w/n,[px,pz]=P(u-w/2+(j+.5)*slice,v);
        collider(px,y+h,pz,Math.abs(c)*slice+Math.abs(s)*d,sy,Math.abs(s)*slice+Math.abs(c)*d);
        stats.colliders++;
      }
    }
    function light(u,h,v,color,power,reach){
      const [px,pz]=P(u,v);
      practicalLight(px,y+h,pz,color,power,reach);
    }
    function actor(id,start,end,role,pose,heading,opt={}){
      const pos=P(...start),finish=end?P(...end):null;
      crowdPaths.push({id,a:pos,...(finish?{b:finish}:{}),level:ground(...pos,y+.10),
        look:role==='kitchen'?1:role==='courier'?2:0,speed:.76,heading:a+heading,
        shiftDress:uniform(role),shiftPose:pose,...opt});
    }
    return {B,solid,light,actor,y};
  }
  function shopFrame(x,z){
    const b=buildings.find(q=>Math.hypot(q.x-x,q.z-z)<.09);
    if(!b)return null;
    return frame(b.x+Math.sin(b.angle)*b.d/2,b.z+Math.cos(b.angle)*b.d/2,b.angle);
  }
  function tote(B,u,y,v,w,sy,d,color){
    B('trim',u,y,v,w,sy,d,color);
    for(const side of [-1,1]){
      B('metal',u,y+sy*.40,v+side*d*.50,w+.04,.06,.06,zinc);
      B('rubber',u,y+.02,v+side*(d/2+.025),w*.36,.055,.035);
    }
    B('trim',u,y+sy/2+.027,v,w+.06,.055,d+.04,color);
    B('lifeCream',u+w*.25,y,v+d/2+.03,.12,.075,.02);
  }
  const food=shopFrame(46,-186);
  if(food){
    const {B,solid,light,actor}=food,u=-2.8,v=1.25;
    // A two-tier collection rack with insulated tubs and a deeper upper lip.
    for(const side of [-1,1])for(const fore of [-1,1]){
      B('metal',u+side*.80,.91,v+fore*.24,.08,1.80,.08,zinc);
      B('rubber',u+side*.80,.07,v+fore*.24,.16,.14,.16);
    }
    for(const h of [.30,.96])B('trim',u,h,v,1.72,.12,.66,0xbab5a0);
    B('trim',u,1.84,v,1.92,.16,.82,amber);
    B('metal',u,1.98,v-.12,1.66,.12,.52,zinc);
    B('lamp',u,1.745,v+.19,1.32,.045,.12);
    for(const side of [-1,1])tote(B,u+side*.42,.56,v,.61,.38,.44,side<0?teal:amber);
    tote(B,u-.48,1.15,v,.50,.25,.43,0xbd7c4b);
    for(const x of [u+.14,u+.46]){
      B('lifePaper',x,1.13,v,.23,.24,.24);B('lifeCream',x,1.26,v,.26,.04,.26);
    }
    solid(u,.94,v,1.72,1.88,.69);
    light(u,1.67,v+.05,0xffa965,10,3.7);
    // The other end of the courier's journey is a parked insulated load cart.
    // Its open bay gives the unload gesture a destination at waist height.
    const dispatch=3.37;
    for(const side of [-1,1]){
      B('rubber',dispatch+side*.25,.12,v,.14,.24,.29);
      B('trim',dispatch+side*.30,.72,v,.09,.68,.64,0xad7853);
    }
    B('trim',dispatch,.38,v,.70,.18,.66,0xad7853);
    B('trim',dispatch,.67,v-.27,.57,.55,.09,0xc19068);
    B('metal',dispatch,.52,v+.30,.67,.26,.08,zinc);
    B('metal',dispatch+.22,.89,v-.24,.07,.82,.08,zinc);
    B('rubber',dispatch+.22,1.30,v-.14,.16,.08,.30);
    solid(dispatch,.58,v,.74,1.16,.70);
    actor('night_shift_pickup',[2.45,1.55],[-1.39,1.55],'courier',pickupPose,-Math.PI/2,
      {shiftWait:3.2,stopHeading:[1.57+Math.PI/2,1.57-Math.PI/2]});
    actor('night_shift_kitchen',[-4.17,1.45],null,'kitchen',counterPose,Math.PI/2);
    stats.sites.push('夜班热卤取餐架');
  }
  const repair=shopFrame(56,-221.35);
  if(repair){
    const {B,solid,light,actor}=repair,u=2.0,v=1.41;
    // A stripped controller chassis: boards, heat-sink fins, a lid propped
    // clear of the bench, and a task lamp cantilevered from the back upright.
    for(const side of [-1,1]){
      B('metal',u+side*.81,.49,v,.13,.98,.53,zinc);
      B('trim',u+side*.81,.075,v,.25,.15,.68,teal);
    }
    B('trim',u,.97,v,1.87,.13,.80,0xb7b0a7);
    B('metal',u,.40,v,1.64,.08,.57,zinc);
    tote(B,u+.13,.59,v,.70,.30,.44,0x78a49e);
    B('rubber',u-.16,1.08,v,.88,.09,.53);
    B('trim',u-.16,1.15,v,.69,.07,.40,0x619680);
    for(let j=0;j<5;j++)B('metal',u-.31+j*.07,1.23,v-.03,.04,.12,.26,zinc);
    B('trim',u+.41,1.31,v-.24,.45,.53,.08,teal);
    B('metal',u-.73,1.49,v-.25,.09,1.03,.09,zinc);
    B('metal',u-.52,1.97,v-.25,.50,.10,.12,zinc);
    B('metal',u-.31,1.94,v-.05,.16,.12,.46,iron);
    B('cyan',u-.31,1.85,v+.11,.28,.05,.25,0x9ebaba);
    solid(u,.49,v,1.82,.98,.78);
    light(u-.31,1.70,v+.12,0x9edcde,12,3.8);
    actor('night_shift_technician',[u-.16,2.35],null,'technician',benchPose,Math.PI);
    stats.sites.push('重明维修拆机台');
  }
  const {B,solid,light,actor}=frame(5.86,-107.55,-Math.PI/2);
  // A shallow bank of keyed return drawers under the existing recycling
  // poster. Two small loading bays are served from the wall side of the walk.
  const recyclingU=-1.30;
  B('metal',recyclingU,.70,.16,1.48,1.40,.36,zinc);
  for(const side of [-1,1]){
    const u=recyclingU+side*.35;
    B('trim',u,.55,.355,.63,.78,.09,side<0?teal:0x96a697);
    B('rubber',u,.79,.408,.44,.14,.05);
    B('metal',u,.44,.442,.30,.07,.07,zinc);
  }
  B('rubber',recyclingU,1.22,.352,1.26,.28,.08);
  B('cyan',recyclingU-.35,1.22,.403,.46,.06,.035,0x76a997);
  B('trim',recyclingU,1.43,.18,1.60,.12,.46,teal);
  solid(recyclingU,.72,.17,1.51,1.44,.45);
  light(recyclingU,1.25,.59,0x7dcbb3,4.5,2.9);
  actor('night_shift_chip_clerk',[1.7,.99],[recyclingU,.99],'clerk',scannerPose,-Math.PI/2,
    {shiftWait:2.9,stopHeading:[Math.PI/2,Math.PI/2]});
  stats.sites.push('旧交易街旧芯回收柜');
  districtNightJobs(frame,stats);
  const produce=frame(-59,11.65,0,.36);
  produce.actor('produce_cart_runner',[6.1,4.9],[1.4,4.9],'courier',pickupPose,Math.PI/2,
    {shiftWait:2.8,stopHeading:[Math.PI/2,-Math.PI/2]});
  // The grader and the hand carts use different levels in the same shed.
  const auctionDeck=frame(-65.45,17.85,0,1.64);
  auctionDeck.actor('produce_floor_grader',[0,-1.95],[0,2.15],'technician',scannerPose,Math.PI/2,
    {shiftWait:2.5,stopHeading:[Math.PI/2,Math.PI/2]});
  const crateYard=frame(-64.2,40.96,0,.36);
  crateYard.actor('produce_crate_receiver',[0,-1.32],[0,1.48],'technician',scannerPose,Math.PI/2,
    {shiftWait:3,stopHeading:[Math.PI/2,Math.PI/2]});
  const streetWorks={
    B(mat,...args){
      box(mat==='districtWorkLens'&&!materials?'lamp':mat,...args);
      stats.boxes++;stats.infrastructureBoxes++;
    },
    light(...args){practicalLight(...args);stats.infrastructureLights++;},
    collide(...args){collider(...args);stats.colliders++;},
    sign
  };
  fitIndustrialPower(streetWorks);
  furnishSpringNightMarket(streetWorks);
  const market=frame(-32.58,70.98,0,.36);
  market.actor('district_market_pickup',[1.47,.99],[-1.39,.99],'courier',pickupPose,Math.PI,
    {speed:.79,look:1,shiftWait:3.0,stopHeading:[Math.PI,Math.PI]});
  return {crowdPaths,stats};
}
