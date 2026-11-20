// Each point is the centre of its fixture. Local +Z faces the worker.
// The last field picks the intended walking level under stacked streets.
const stations=[
  ["old","press","唱片试音台",-8.7,37,90,0.36],
  ["old","pump","地铁排水值守",-8.7,3,90,0.36],
  ["old","coffee","夜班值班茶炉",8.95,-38,-90,0.36],
  ["old","cycle","高架脚下修车档",28,8.8,180,0.36],
  ["old","parcel","社区夜间收发间",-28,-8.8,0,0.36],
  ["west","power","仓配冷机充电坞",-59,9.7,180,0.36],
  ["west","cargo","仓库东巷复秤",-69,-37,90,0.36],
  ["west","spool","缆线工班",-97.1,34,-90,0.36],
  ["west","coffee","仓库门房早班水站",-92,-7,0,0.36],
  ["dock","spool","靠泊缆绞盘",-136.5,-21,90,0.36],
  ["dock","cargo","河港冷链卸货台",-115,7.9,180,0.36],
  ["dock","pump","南岸潮样记录",-136.5,33.7,90,0.36],
  ["dock","signal","泊位调度台",-139,2,90,0.36],
  ["greenway","plant","绿廊养护架",-105,-29.7,0,6.51],
  ["greenway","signal","高架检修班",-38,-29.8,0,6.51],
  ["greenway","pump","高架东端管路",22,-29.8,0,6.51],
  ["mid","ticket","夜班交接岗",-16.4,-131,90,0.36],
  ["mid","power","西广场储能值守",-49,-161,0,0.36],
  ["mid","press","夜市临时广播站",18,-78.6,180,0.36],
  ["mid","parcel","东侧街投件节点",67.6,-66,-90,0.36],
  ["mid","coffee","市场北口夜茶",72,-136,90,0.36],
  ["mid","cycle","西坊轮胎档",-42.4,-96,90,0.36],
  ["soho","textile","旧布行裁缝",9.2,59.6,-90,0.36],
  ["soho","print","书坊装订台",-8.5,100.4,90,0.36],
  ["soho","market","苏荷街坊净菜摊",-38,69.45,90,0.36],
  ["soho","parcel","服务巷单据分拣",-26.8,115,90,0.36],
  ["soho","press","运河庭院混音台",35.2,138,180,1.08],
  ["soho","cycle","东院单车寄修",44.6,106.8,180,0.36],
  ["park","plant","东园苗圃育种架",99,66,180,0.36],
  ["park","pump","湿地夜间采样",121.1,47.6,90,0.36],
  ["park","ticket","电车站夜班问讯",125.8,18.8,90,0.36],
  ["park","coffee","北林步道茶歇",90,-17,0,0.36],
  ["park","cycle","西门单车养护",72.8,30,90,0.36],
  ["park","plant","沉砂池巡护台",122.2,-37,90,0.36],
  ["future","power","总部北线换电坞",54,-341.6,90,0.3],
  ["future","signal","旧轨厂编组值班台",-21.6,-312,90,0.3],
  ["future","spool","西门机修绕线台",-23.704,-212.737,35,0.3],
  ["future","parcel","东台住宅夜收件",126.267,-309.154,-70,0.3],
  ["future","ticket","数据塔换班岗",92.8,-297,-90,0.3],
  ["future","market","东台街坊保鲜柜",107.4,-247.8,180,0.3],
  ["future","pump","北端循环水检修",55.2,-367,90,0.3],
  ["future","print","控制廊夜班制图",32.883,-264.179,-36,0.3],
  ["future","coffee","西北轨工夜茶",-2,-352,41,0.3],
  ["future","signal","东南站坪调度",106.6,-192.8,180,0.3]
];


const steel=0x87989c,gunmetal=0x374953,cream=0xc8c7ab,brass=0xc89b66;
const surface={press:0x6e6685,pump:0x518981,coffee:0xa0614b,cycle:0x567d8a,parcel:0x7a7994,
  power:0x637f78,cargo:0x74838a,spool:0x99735a,signal:0x4a6274,ticket:0x59788a,
  textile:0x986b73,print:0x68777d,market:0x8e7556,plant:0x5e826c};
const lit={press:0xf1b57e,pump:0x91d6d2,coffee:0xffb168,cycle:0xe7d496,parcel:0xb3a9e4,
  power:0x8edbc8,cargo:0xc2d8e4,spool:0xf2b361,signal:0x8ad4dc,ticket:0xadd9ec,
  textile:0xf1b499,print:0xe4c89c,market:0xffc080,plant:0xc4cf93};

function bench(B,width,y,tint){
  B('metal',0,y,0,width,.12,.70,tint);
  for(const side of [-1,1]){
    B('metal',side*(width/2-.16),y/2,0,.16,y,.56,steel);
    B('rubber',side*(width/2-.16),.08,0,.30,.16,.64);
  }
  B('metal',0,y*.36,-.19,width-.32,.10,.16,gunmetal);
}
function crate(B,x,y,z,w,h,d,tone){
  B('trim',x,y+h*.5,z,w,h,d,tone);
  B('metal',x,y+h*.87,z+d*.5,w*.80,.045,.045,steel);
  B('rubber',x,y+h*.70,z+d*.5,w*.30,.075,.040);
  B('trim',x,y+h+.03,z,w+.06,.06,d+.06,tone);
}
// A shaft made of four courses. The square ends and the stepped flanges
// remain visible from the back and side of the quay or the shop.
function reel(B,x,y,z,w,r,tone){
  const flange=(u)=>{
    for(const [i,run] of [[-2,.46],[-1,.86],[0,1],[1,.86],[2,.46]]){
      B('metal',u,y+i*r*.39,z,.12,r*.40,run*r*2,tone);
    }
    B('trim',u+Math.sign(u-x)*.08,y,z,.09,r*.45,r*.52,brass);
  };
  for(let i=0;i<5;i++){
    const u=x-w/2+(i+.5)*w/5;
    B('rubber',u,y,z,w/5-.018,r*1.28,r*1.33);
    B('metal',u,y+.03,z,w/5-.035,r*.52,r*1.52,0x756957);
  }
  flange(x-w/2);flange(x+w/2);
}
function cabinet(B,x,w,h,paint){
  B('rubber',x,.10,0,w+.12,.2,.70);
  B('metal',x,h/2+.14,-.04,w,h,.58,paint);
  B('metal',x,h+.21,-.04,w+.08,.14,.66,steel);
}
function hatLamp(B,x,y,z,tint){
  B('metal',x,y-.35,z-.16,.08,.72,.12,gunmetal);
  B('metal',x,y,z,.38,.12,.42,tint);
  B('districtWorkLens',x,y-.07,z+.12,.27,.055,.20,tint);
}

function fixture(f,kind){
  const {B,solid,light}=f;
  const paint=surface[kind],glow=lit[kind];
  let height=1.65,lamp=[-.73,1.75,.21];
  switch(kind){
    case 'press':{
      bench(B,2.12,.90,paint);
      for(const x of [-.54,.29]){
        B('rubber',x,1.02,.025,.69,.13,.52);
        for(const [z,w] of [[-.12,.34],[0,.47],[.12,.34]])B('trim',x,1.115,z,w,.05,.12,0x48525b);
        B('metal',x-.21,1.18,.04,.055,.08,.34,brass);
      }
      B('metal',.84,1.35,-.15,.32,.74,.36,gunmetal);
      for(let i=0;i<4;i++)B('rubber',.84,1.12+i*.13,.045,.24,.055,.045);
      break;
    }
    case 'coffee':{
      bench(B,2.05,.91,paint);
      for(const [x,w] of [[-.48,.49],[.10,.37]]){
        B('metal',x,1.27,-.02,w,.55,w*.83,brass);
        B('metal',x,1.27,-.02,w*.78,.55,w,brass);
        B('trim',x,1.59,-.02,w*.78,.10,w*.78,paint);
        B('rubber',x,1.68,-.02,.12,.10,.12);
        B('metal',x,1.16,.24,.10,.09,.22,steel);
      }
      for(const x of [.55,.76])for(let i=0;i<3;i++)B('lifeCream',x,1.04+i*.075,.10,.15,.08,.16,cream);
      B('metal',0,2.11,-.02,2.16,.14,.78,paint);B('trim',-.46,2.23,-.04,1.15,.1,.66,paint);
      for(const x of [-.94,.94])B('metal',x,1.53,-.28,.08,1.1,.08,steel);
      B('districtWorkLens',-.35,2.015,.12,.80,.05,.13,glow);
      lamp=[-.35,1.87,.25];height=2.12;break;
    }
    case 'cycle':{
      B('metal',-.12,.10,0,1.81,.17,.68,steel);
      B('metal',-.32,.59,0,.16,.99,.22,paint);
      B('metal',-.04,1.01,0,.71,.14,.17,paint);
      // An upright trued wheel in a fork, with daylight through the spokes.
      for(const [x,y,w,h] of [[0,1.68,.44,.13],[0,.58,.44,.13],[-.29,1.57,.18,.16],[.29,1.57,.18,.16],[-.42,1.41,.16,.21],[.42,1.41,.16,.21],[-.48,1.13,.13,.40],[.48,1.13,.13,.40],[-.39,.86,.16,.20],[.39,.86,.16,.20],[-.27,.70,.19,.15],[.27,.70,.19,.15]]){
        B('rubber',x-.20,y,0,w,h,.12);
      }
      B('metal',-.20,1.13,.035,.96,.055,.065,steel);
      B('metal',-.20,1.13,.035,.055,1.0,.065,steel);
      crate(B,.76,.05,0,.50,.57,.50,paint);
      lamp=[.67,1.60,.15];height=1.77;break;
    }
    case 'plant':{
      for(const x of [-.94,.94])for(const z of [-.26,.26])B('metal',x,.80,z,.09,1.6,.09,steel);
      for(const [y,scale] of [[.44,.80],[1.01,1]]){
        B('trim',0,y,0,2.06,.12,.71,paint);
        for(let j=0;j<5;j++){
          const x=(j-2)*.37;
          B('trim',x,y+.145,0,.28,.20,.30,0x88684e);
          B('leaf',x,y+.30,0,.12,.19,.16,0x72945f);
          B('leaf',x-.07,y+.34,.03,.14,.10,.14,0x91a86c);
          B('leaf',x+.07,y+.39+(j%2)*.06,0,.12,.15*scale,.14,0x669475);
        }
      }
      B('metal',0,1.79,0,2.12,.13,.41,steel);
      B('districtWorkLens',0,1.705,0,1.68,.06,.20,glow);
      lamp=[0,1.58,.17];height=1.89;break;
    }
    case 'pump':{
      cabinet(B,-.58,.67,1.22,paint);
      B('rubber',-.58,1.01,.28,.50,.43,.10);
      B('districtWorkLens',-.58,1.03,.34,.34,.20,.046,glow);
      B('metal',.42,.30,-.08,.83,.44,.45,steel);
      B('metal',.42,.43,-.08,.67,.47,.41,steel);
      for(const side of [-1,1]){
        B('metal',.42+side*.30,.69,-.08,.16,.54,.16,brass);
        B('metal',.42+side*.30,1.00,-.08,.24,.14,.25,paint);
        B('metal',.42+side*.30,1.07,.05,.08,.06,.37,paint);
      }
      for(const x of [-.05,.12])B('coolWindow',x,.82,.18,.09,.38,.09,0xa1bbb1);
      lamp=[-.59,1.02,.43];height=1.60;break;
    }
    case 'spool':{
      B('metal',-.26,.13,0,1.63,.22,.76,steel);
      for(const x of [-.80,.27]){
        B('metal',x,.46,0,.18,.62,.57,paint);B('metal',x,.84,0,.16,.26,.36,paint);
      }
      reel(B,-.27,.81,0,.90,.53,paint);
      cabinet(B,.78,.46,.82,gunmetal);
      B('districtWorkLens',.77,.88,.26,.29,.12,.06,glow);
      lamp=[.73,1.62,.16];height=1.68;break;
    }
    case 'cargo':{
      for(const x of [-.75,.35])B('metal',x,.13,0,.17,.24,.72,steel);
      B('metal',-.27,.28,0,1.65,.13,.69,paint);
      crate(B,-.58,.36,0,.60,.51,.52,0x849eaa);crate(B,.14,.36,0,.56,.42,.48,0xa7afa1);
      B('metal',.77,.85,0,.16,1.60,.19,steel);
      B('rubber',.74,1.56,0,.62,.47,.25);
      B('districtWorkLens',.74,1.58,.15,.42,.18,.05,glow);
      lamp=[.74,1.56,.25];height=1.82;break;
    }
    case 'power':{
      B('metal',0,.16,0,2.12,.22,.76,gunmetal);
      for(const [i,x] of [-.62,.02,.67].entries()){
        const h=i===1?.64:1.17;
        B('metal',x,.26+h/2,0,.54,h,.58,paint);
        B('metal',x,h+.30,-.08,.39,.12,.36,brass);
        B('rubber',x,.68,.30,.35,.37,.03);
        for(let j=0;j<=i;j++)B('districtWorkLens',x-.09+j*.095,.69,.33,.045,.18,.04,glow);
        B('metal',x,1.52,-.26,.16,.19,.12,steel);
      }
      B('metal',0,1.68,-.24,2.10,.16,.22,steel);
      lamp=[-.60,1.52,.06];height=1.77;break;
    }
    case 'signal':{
      cabinet(B,-.27,1.44,1.11,paint);
      B('metal',-.29,1.68,-.14,1.41,.69,.22,gunmetal);
      B('rubber',-.29,1.69,0,1.19,.48,.06);
      for(let j=0;j<3;j++){
        B('districtWorkLens',-.54+j*.18,1.59+j*.079,.044,.35,.036,.035,glow);
        B('districtWorkLens',.16,1.55+j*.08,.044,.072,.037,.035,glow);
      }
      B('metal',.78,1.04,-.14,.16,1.9,.16,steel);
      for(const [i,source] of ['tailLight','lamp'].entries())B(source,.78,1.73+i*.28,-.02,.24,.18,.20);
      lamp=[-.29,1.60,.24];height=2.14;break;
    }
    case 'ticket':{
      cabinet(B,-.64,.63,1.73,paint);
      B('rubber',-.64,1.46,.27,.49,.49,.06);
      B('districtWorkLens',-.64,1.48,.31,.36,.28,.04,glow);
      B('metal',-.64,.94,.33,.54,.09,.21,steel);
      for(const x of [.22,.86]){
        B('metal',x,.52,0,.23,1.00,.53,paint);
        B('trim',x,1.11,-.01,.31,.16,.58,cream);
      }
      B('metal',.54,.60,.06,.52,.09,.08,brass);
      lamp=[-.64,1.39,.46];height=1.95;break;
    }
    case 'parcel':{
      cabinet(B,-.28,1.51,1.70,paint);
      for(let row=0;row<3;row++)for(let j=0;j<3;j++){
        const x=-.77+j*.50,y=.48+row*.48;
        B('trim',x,y,.275,.45,.42,.075,j===1?steel:paint);
        B('rubber',x+.12,y+.09,.328,.075,.12,.04);
      }
      crate(B,.79,.06,0,.48,.46,.58,cream);crate(B,.78,.59,0,.45,.29,.50,brass);
      B('districtWorkLens',-.28,1.94,.12,1.04,.055,.17,glow);
      lamp=[-.28,1.83,.28];height=1.97;break;
    }
    case 'textile':{
      bench(B,2.10,.88,paint);
      B('rubber',-.14,1.02,0,.90,.1,.44);
      B('trim',-.43,1.28,0,.22,.48,.33,cream);
      B('trim',-.13,1.49,0,.79,.18,.28,cream);
      B('metal',.18,1.33,0,.09,.30,.12,steel);
      B('trim',.46,.99,.14,.39,.05,.40,0xa89784);
      B('trim',.48,.85,.30,.40,.25,.08,0xb2a08a);
      for(const [i,x] of [-.84,.72].entries())B('trim',x,1.20,-.12,.19,.47,.19,i?0x8aa7a0:0xb98286);
      break;
    }
    case 'print':{
      bench(B,2.12,.83,paint);
      B('trim',-.30,1.05,0,1.16,.25,.56,paint);
      for(const x of [-.75,.13])B('metal',x,1.37,-.16,.12,.66,.12,steel);
      B('metal',-.30,1.68,-.16,1.04,.14,.22,steel);
      B('metal',-.30,1.45,.01,.17,.33,.33,brass);
      B('metal',-.29,1.25,.01,.75,.1,.39,gunmetal);
      for(let i=0;i<4;i++)B('lifeCream',.73,1.0+i*.073,.03,.54-i*.015,.06,.43,cream);
      break;
    }
    case 'market':{
      bench(B,2.14,.72,paint);
      for(const [j,x] of [-.68,0,.68].entries()){
        crate(B,x,.81,0,.58,.19,.56,0x937f64);
        for(let i=0;i<3;i++){
          B('leaf',x-.12+i*.12,1.09,.035,.13,.19+.03*(i%2),.17,[0x859866,0xc4905c,0xa75b49][j]);
          B('leaf',x-.10+i*.12,1.21,0,.066,.075,.08,0x75976b);
        }
      }
      for(const x of [-.97,.97])B('metal',x,1.44,-.26,.10,1.29,.10,steel);
      B('trim',0,2.16,-.01,2.16,.16,.71,paint);
      for(let x=-.88;x<=.90;x+=.44)B('trim',x,2.05,.27,.40,.17,.14,cream);
      B('districtWorkLens',0,2.06,-.02,.84,.06,.16,glow);
      lamp=[0,1.96,.15];height=2.24;break;
    }
  }
  if(['press','cycle','spool','textile','print'].includes(kind))hatLamp(B,...lamp,glow);
  solid(0,height*.5,0,2.16,height,.77);
  light(lamp[0],lamp[1]-.045,lamp[2]+.13,glow,['plant','market','coffee'].includes(kind)?12:7,4.7);
}


const actions={
  press:['cue','mix'],pump:['sample','read'],coffee:['pour','serve'],cycle:['spin','true'],
  parcel:['sort','scan'],power:['dock','inspect'],cargo:['weigh','seal'],spool:['wind','measure'],
  signal:['dispatch','signal'],ticket:['validate','direct'],textile:['guide','fold'],
  print:['press','stack'],market:['select','pack'],plant:['trim','mist']
};
const vests=new Set(['cargo','spool','power','signal','cycle','pump']);
const aprons=new Set(['coffee','market','plant','textile','print','press']);
function dress(kind,visitor,variant){
  return (actor,P)=>{
    const paint=surface[kind],coat=visitor?[0xb99879,0x8985aa,0x758e80][variant%3]:paint;
    const {torso,head}=actor;
    if(visitor){
      P('fabric',torso,-.08,.18,.148,.085,.39,.03,coat);
      P('fabric',torso,-.17,-.035,.095,.19,.22,.23,coat);
      P('fabric',torso,-.17,.03,.192,.21,.07,.09,cream);
      return;
    }
    if(vests.has(kind)){
      P('fabric',torso,0,.15,.15,.36,.34,.034,coat);
      for(const side of [-1,1])P('fabric',torso,side*.116,.17,.17,.036,.28,.025,brass);
      P('fabric',torso,0,.10,.17,.35,.033,.025,cream);
      P('fabric',head,0,.29,0,.24,.10,.23,coat);
      P('fabric',head,0,.266,.02,.28,.045,.265,steel);
    }else if(aprons.has(kind)){
      P('fabric',torso,0,.04,.15,.34,.47,.04,coat);
      P('fabric',torso,.045,.04,.176,.13,.095,.024,cream);
      P('fabric',head,0,.27,0,.24,.095,.24,coat);
      P('fabric',head,0,.24,.069,.23,.042,.20,coat);
    }else{
      P('fabric',torso,0,.18,.157,.25,.24,.035,coat);
      P('fabric',torso,.09,.24,.18,.105,.078,.025,cream);
    }
    const elbow=actor.arms[1].elbow;
    if(kind==='pump'||kind==='plant'||kind==='coffee'){
      P('shoes',elbow,0,-.31,.045,.085,.13,.11,steel);
      P('fabric',elbow,0,-.37,.045,.11,.13,.12,kind==='plant'?0x7b9d7c:cream);
    }else if(kind==='cycle'||kind==='spool'||kind==='power'){
      P('shoes',elbow,.004,-.34,.04,.052,.22,.055,brass);
      P('shoes',elbow,.004,-.46,.04,.11,.06,.05,steel);
    }else if(kind==='ticket'||kind==='signal'||kind==='parcel'){
      P('shoes',elbow,0,-.31,.035,.10,.17,.065,gunmetal);
      P('glow',elbow,0,-.32,.077,.07,.089,.025,0x96e2de);
    }
  };
}
function workPose(kind){
  const duration=kind==='signal'?9.6:kind==='spool'?6.8:8.2;
  return (a,time,walking,direction,progress,stop)=>{
    const t=(time+a.offset)%duration/duration;
    const moving=Boolean(a.def.b);
    const first=moving?progress<.5:t<.53;
    const beat=moving?stop:(first?t/.53:(t-.53)/.47);
    const lift=walking?0:Math.sin(Math.PI*beat),look=first?1:-1;
    let arm=1.0,elbow=.58,other=.26,lean=.14,twist=.13;
    if(kind==='signal'||kind==='ticket'){arm=first?.78:1.53;elbow=.25;twist=.25;lean=.02;}
    if(kind==='press'||kind==='textile'||kind==='print'){other=.76;lean=.26;elbow=.57+.16*Math.sin(beat*15);}
    if(kind==='coffee'){other=.60;elbow=.8;lean=.14;twist=.26;}
    if(kind==='plant'||kind==='pump'){arm=.86;other=.45;lean=first?.31:.11;}
    if(kind==='cycle'||kind==='spool'){arm=.84+.22*Math.sin(beat*16);other=.56;lean=.19;}
    if(kind==='market'||kind==='parcel'||kind==='cargo'){other=.64;twist=.33;lean=.22;}
    a.torso.rotation.x=lean*lift;
    a.torso.rotation.y+=look*twist*lift;
    a.head.rotation.x=walking?0:.09+lean*.8*lift;
    a.head.rotation.y+=look*.18*lift;
    if(lift>0){
      a.arms[1].shoulder.rotation.x-=arm*lift;
      a.arms[1].elbow.rotation.x-=elbow*lift;
      a.arms[0].shoulder.rotation.x-=other*lift;
      a.arms[0].elbow.rotation.x-=other*.7*lift;
      if(kind==='signal'||kind==='ticket')a.arms[1].shoulder.rotation.z-=look*.46*lift;
    }
    a.root.userData.shiftAction=walking?'walk':lift<.18?'wait':actions[kind][first?0:1];
  };
}
function visitorPose(a,time){
  const t=(time+a.offset)%7.6/7.6,lift=Math.max(0,Math.sin((t-.18)*Math.PI*2));
  a.head.rotation.y=.18*Math.sin(t*Math.PI*2);
  a.arms[1].shoulder.rotation.x-=.60*lift;
  a.arms[1].elbow.rotation.x-=.69*lift;
  a.root.userData.shiftAction=lift>.3?'consult':'wait';
}

export function districtNightJobs(makeFrame,stats){
  stats.jobs=[];
  stations.forEach(([district,kind,label,x,z,degrees,y],index)=>{
    const yaw=degrees*Math.PI/180,f=makeFrame(x,z,yaw,y);
    fixture(f,kind);
    const id='district_shift_'+district+'_'+index;
    const walk=['cargo','plant','parcel','market','power','pump','spool'].includes(kind);
    const points=walk?[[-.71,.99],[.82,.99]]:[[.02,1.0],null];
    f.actor(id,points[0],points[1],kind,workPose(kind),Math.PI,{
      look:index%4,speed:.55+(index%4)*.06,shiftWait:3.25+(index%3)*.55,
      stopHeading:[yaw+Math.PI,yaw+Math.PI],shiftDress:dress(kind,false,index)
    });
    if(!walk&&['coffee','ticket','print','textile','press'].includes(kind)&&index%3!==2){
      f.actor(id+'_customer',[1.48,1.00],null,kind,visitorPose,Math.PI*1.28,
        {look:(index+2)%4,shiftDress:dress(kind,true,index)});
    }
    stats.jobs.push({district,kind,label,x,y:f.y,z,yaw,actor:id});
    stats.sites.push(label);
  });
}

