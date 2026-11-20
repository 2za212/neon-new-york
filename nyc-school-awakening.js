import * as T from 'three';
import {schoolCourt,schoolMeterZ} from './nyc-school.js';

export function createSchoolAwakening(scene,landmarks,track){
  const key='nyc.school.echo.v1';
  let learned=false;
  try{learned=localStorage.getItem(key)==='awakened';}catch{}
  const button=document.querySelector('#echo-sense'),notice=document.querySelector('#school-notice');
  button.hidden=!learned;
  const wave=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0x95e6db}),64);
  wave.visible=false;wave.frustumCulled=false;wave.name='异能 / 回声波前';scene.add(wave);
  const pose=new T.Object3D(),origin=new T.Vector3();
  let time=10,life=0,mode='',line=-1;
  function say(title,body){
    notice.firstElementChild.textContent=title;notice.lastElementChild.textContent=body;notice.hidden=false;
  }
  function begin(position,kind){
    time=0;life=kind==='first'?9:4.8;line=-1;mode=kind;
    origin.copy(position);wave.visible=true;
  }
  function awaken(pos){
    if(learned||!atCoil(pos))return;
    learned=true;button.hidden=false;try{localStorage.setItem(key,'awakened');}catch{}
    begin(pos,'first');
  }
  function atCoil(p){return Math.abs(p.y-.44)<.65&&Math.hypot(p.x-schoolCourt.x,p.z-schoolMeterZ)<2.36;}
  function sense(p,seen){
    if(!learned||time<life)return;
    const candidates=landmarks.filter(l=>l.position.distanceTo(p)>5);
    const fresh=candidates.filter(l=>!seen.has(l.id));
    const nearest=(fresh.length?fresh:candidates).reduce((best,l)=>!best||l.position.distanceToSquared(p)<best.position.distanceToSquared(p)?l:best,null);
    if(!nearest)return;
    begin(p,'sense');track(nearest.id);
    say('回声感知',nearest.title+'方向有回响，距此约 '+Math.round(nearest.position.distanceTo(p))+' 米。已在地图标出。');
  }
  function update(dt){
    if(time>=life)return;
    time+=dt;
    if(time>=life){wave.visible=false;notice.hidden=true;button.disabled=false;return;}
    button.disabled=true;
    if(mode==='first'){
      const next=time<3?0:time<6?1:2;
      if(next!==line){
        line=next;
        const lines=[['夜间观测','线圈还没接电，表针却先偏了一格。你按住铁架，第二次振动从脚下传来。'],
          ['回声','闭上眼，仍能分辨篮球架、教学楼和街口的距离。每一样东西，都在不同的时刻答了你一声。'],
          ['异能觉醒 · 回声感知','离开球场也能使用。点击「感知」或按 V，循回声寻找附近的地标。']];
        say(...lines[line]);
      }
    }
    const t=time/(mode==='first'?2.6:1.7);
    for(let j=0;j<64;j++){
      const a=(j%32)*Math.PI/16,phase=(t+Math.floor(j/32)*.5)%1;
      const radius=.40+phase*7,scale=Math.sin(phase*Math.PI);
      pose.position.set(origin.x+radius*Math.cos(a),origin.y+.10+.32*scale,origin.z+radius*Math.sin(a));
      pose.scale.set((.16+.54*phase)*scale,.09*scale,.14*scale);pose.rotation.y=Math.PI/2-a;pose.updateMatrix();wave.setMatrixAt(j,pose.matrix);
    }
    wave.instanceMatrix.needsUpdate=true;
  }
  return {button,get learned(){return learned;},needsAwakening:p=>!learned&&atCoil(p),awaken,sense,update};
}
