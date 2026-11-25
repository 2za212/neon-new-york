import * as T from 'three';
import {createMotor} from '../nyc-motor.js';
import {returningBladeGroundRoute} from './returning-blade.js';
import {thunderStrikePoints} from './thunder-seal.js';
import {sampleAttackMotion,fistHitTimes,flareFollowDelay} from './attack-variations.js';

const up=new T.Vector3(0,1,0);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const step=1/40;

export function createCastPlanner(station,spawn,walkingSpeed,targets){
  const ghost=createMotor(station,spawn,walkingSpeed);
  const ray=new T.Ray(),hit=new T.Vector3(),scratch=new T.Vector3();

  function rayLimit(from,direction,length){
    ray.origin.copy(from).addScaledVector(up,1.08);
    ray.direction.copy(direction);
    let limit=length;
    const boxes=station.cameraSolidsBetween?.(ray.origin,hit.copy(ray.origin).addScaledVector(direction,length))??station.cameraColliders??station.colliders;
    for(const box of boxes){
      if(!ray.intersectBox(box,hit))continue;
      limit=Math.min(limit,Math.max(0,ray.origin.distanceTo(hit)-.08));
    }
    return limit;
  }

  function clear(from,to){
    const span=distance(from,to);
    if(span<.001)return true;
    const direction=scratch.subVectors(to,from).setY(0).normalize();
    return rayLimit(from,direction,span)>=span-.002;
  }

  function bakeTravel(plan){
    const {skill,from,forward,side,range,heading,to}=plan;
    ghost.reset(heading);
    ghost.position.copy(from);
    const frames=[from.clone()],desired=new T.Vector3(),last=from.clone();
    const contacts=skill.id==='fist'?fistHitTimes:[skill.contact];
    let contact=0;
    const length=Math.ceil(skill.recover/step);
    for(let i=1;i<=length;i++){
      const time=i*step;
      sampleAttackMotion(desired,skill.id,from,forward,side,range,time);
      ghost.update(step,{actionMove:{x:desired.x-last.x,z:desired.z-last.z,heading}},0);
      last.copy(desired);
      frames.push(ghost.position.clone());
      if(time>=contacts[contact]){
        if(distance(ghost.position,to)>1.66)plan.issue='位移路线受阻，换个站位';
        contact++;
      }
    }
    plan.landing=frames.at(-1);
    plan.route=frames.filter((_,i)=>i%3===0||i===frames.length-1);
    plan.moveAt=(time,out)=>{
      const frame=Math.min(time/step,frames.length-1),i=Math.floor(frame);
      return out.copy(frames[i]).lerp(frames[Math.min(i+1,frames.length-1)],frame-i);
    };
  }

  let last=null;
  return (skill,origin,target,ground,direction)=>{
    if(!skill)return null;
    const point=target?.actor.position??ground;
    const roster=targets.map(bot=>bot.hp+':'+bot.actor.position.toArray().map(v=>v.toFixed(2)).join(',')).join('|');
    if(last?.skill===skill&&last.roster===roster&&last.previewTarget===target&&last.from.distanceTo(origin)<.009&&
      ((!last.raw&&!point)||(last.raw&&point&&distance(last.raw,point)<.009))&&
      ((!last.direction&&!direction)||(last.direction&&direction&&distance(last.direction,direction)<.006))){
      return last;
    }
    const from=origin.clone();
    const plan={skill,from,roster,previewTarget:target,raw:point?.clone(),direction:direction?.clone(),events:[]};
    last=plan;
    if(!point&&!direction){plan.issue='';return plan;}
    const aim=point?.clone()??from.clone().addScaledVector(direction,skill.range);
    const delta=aim.clone().sub(from).setY(0);
    const span=delta.length();
    if(span<.16){plan.to=aim;plan.issue='离角色太近，向前瞄准';return plan;}
    const forward=delta.multiplyScalar(1/span),side=new T.Vector3(-forward.z,0,forward.x);
    Object.assign(plan,{forward,side,heading:Math.atan2(forward.x,forward.z),range:span});
    const reachable=from.clone().addScaledVector(forward,Math.min(span,skill.range));
    if(skill.kind==='line'){
      const reach=rayLimit(from,forward,skill.range);
      plan.to=from.clone().addScaledVector(forward,reach);
      if(reach<skill.min){plan.issue='前方被挡住，换个方向';return plan;}
      const lane=[];
      for(const bot of targets){
        if(!bot.hp||Math.abs(bot.actor.position.y-from.y)>1.05)continue;
        const offset=bot.actor.position.clone().sub(from),along=offset.dot(forward);
        if(along>=skill.min&&along<=reach&&Math.abs(offset.dot(side))<=skill.width/2&&
          clear(from,bot.actor.position))lane.push({bot,along});
      }
      lane.sort((a,b)=>a.along-b.along);
      plan.primary=lane[0]?.bot;
      if(skill.cap===1&&plan.primary)plan.to=plan.primary.actor.position.clone();
      if(skill.id==='sword')plan.returnRoute=returningBladeGroundRoute(from,plan.to,forward,side);
      plan.rear=skill.cap===1?null:lane[1]?.bot;
      if(plan.primary)plan.events.push({at:skill.contact,target:plan.primary,damage:skill.damage[0]});
      if(plan.rear)plan.events.push({at:skill.contact+flareFollowDelay,target:plan.rear,damage:skill.follow});
      return plan;
    }
    if(skill.kind==='area'){
      plan.to=reachable;
      reachable.y=station.ground?.(reachable.x,reachable.z,from.y+.45)??from.y;
      if(station.isPlayable&&!station.isPlayable(reachable.x,reachable.z)){
        plan.issue='落点不在平台上';return plan;
      }
      if(span<skill.min){plan.issue='落点离角色太近';return plan;}
      if(!clear(from,reachable)){plan.issue='落点被遮挡';return plan;}
      if(skill.id==='thunder')plan.strikes=thunderStrikePoints(reachable,forward,side);
      for(const bot of targets){
        const offset=distance(reachable,bot.actor.position);
        if(!bot.hp||Math.abs(bot.actor.position.y-reachable.y)>1.05||offset>skill.radius||!clear(reachable,bot.actor.position))continue;
        const pulse=plan.strikes?.reduce((closest,strike)=>
          distance(strike.at,bot.actor.position)<distance(closest.at,bot.actor.position)?strike:closest);
        plan.events.push({at:skill.contact+(pulse?.delay??0),target:bot,
          damage:offset<=.85?skill.damage[0]:skill.follow,recoil:true});
      }
      plan.events.sort((a,b)=>a.at-b.at);
      return plan;
    }
    plan.to=aim;
    if(!target?.hp||Math.abs(aim.y-from.y)>1.05){plan.issue='点选一台巡检机';return plan;}
    if(span>skill.range){plan.issue='目标太远 · '+span.toFixed(1)+' 米，需 '+skill.range+' 米内';return plan;}
    if(span<skill.min){plan.issue='离目标太近 · 后退一步';return plan;}
    if(!clear(from,aim)){plan.issue='目标被遮挡';return plan;}
    plan.primary=target;
    bakeTravel(plan);
    const times=skill.id==='fist'?fistHitTimes:[skill.contact];
    plan.events=times.map((at,i)=>({at,target,damage:skill.damage[i]}));
    return plan;
  };
}

const teal=0x79ece4, gold=0xffd08a, red=0xff7477;
const TAU=Math.PI*2;

export function createAimGuide(scene){
  const root=new T.Group();
  root.name='技能范围、轨迹与预计落点';
  root.visible=false;
  scene.add(root);

  function layer(alpha,order){
    const geometry=new T.BufferGeometry();
    const vertices=new T.BufferAttribute(new Float32Array(1024*3*3),3).setUsage(T.DynamicDrawUsage);
    geometry.setAttribute('position',vertices);
    const material=new T.MeshBasicMaterial({opacity:alpha,transparent:true,depthWrite:false,
      side:T.DoubleSide,toneMapped:false});
    const mesh=new T.Mesh(geometry,material);
    mesh.frustumCulled=false;
    mesh.renderOrder=order;
    root.add(mesh);
    let count=0;
    return {
      begin(){count=0;},
      strength(value){material.opacity=alpha*value;},
      v(x,z){vertices.setXYZ(count++,x,.030+order*.0015,z);},
      finish(color){
        geometry.setDrawRange(0,count);
        vertices.needsUpdate=true;
        mesh.material.color.setHex(color);
      },
    };
  }

  const fill=layer(.17,3),border=layer(.92,5),soft=layer(.45,4),warning=layer(.95,6);
  const rayDirection=new T.Vector3(),arrowBase=new T.Vector3();
  function quad(layer,ax,az,bx,bz,cx,cz,dx,dz){
    layer.v(ax,az);layer.v(bx,bz);layer.v(cx,cz);
    layer.v(ax,az);layer.v(cx,cz);layer.v(dx,dz);
  }
  function line(layer,a,b,width){
    const dx=b.x-a.x,dz=b.z-a.z,span=Math.hypot(dx,dz);
    if(span<.001)return;
    const x=-dz*width/(span*2),z=dx*width/(span*2);
    quad(layer,a.x+x,a.z+z,b.x+x,b.z+z,b.x-x,b.z-z,a.x-x,a.z-z);
  }
  function circle(layer,at,radius,width,segments=56,dashed=false){
    for(let i=0;i<segments;i++){
      if(dashed&&i%4===3)continue;
      const a=i*TAU/segments,b=(i+1)*TAU/segments;
      const lo=radius-width/2,hi=radius+width/2;
      quad(layer,at.x+Math.cos(a)*lo,at.z+Math.sin(a)*lo,
        at.x+Math.cos(a)*hi,at.z+Math.sin(a)*hi,
        at.x+Math.cos(b)*hi,at.z+Math.sin(b)*hi,
        at.x+Math.cos(b)*lo,at.z+Math.sin(b)*lo);
    }
  }
  function marker(at,layer){
    circle(layer,at,.29,.039,28);
    for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
      const x=Math.cos(angle),z=Math.sin(angle);
      line(layer,{x:at.x+x*.19,z:at.z+z*.19},{x:at.x+x*.39,z:at.z+z*.39},.032);
    }
  }
  function arrow(start,end,width){
    rayDirection.subVectors(end,start).setY(0);
    const length=rayDirection.length();
    if(length<.03)return;
    rayDirection.multiplyScalar(1/length);
    arrowBase.copy(end).addScaledVector(rayDirection,-Math.min(length*.48,.49));
    const x=-rayDirection.z*width/2,z=rayDirection.x*width/2;
    line(fill,start,arrowBase,width);
    for(const side of [-1,1]){
      const a={x:start.x+x*side,z:start.z+z*side},b={x:arrowBase.x+x*side,z:arrowBase.z+z*side};
      line(border,a,b,.035);line(border,b,end,.04);
      fill.v(b.x,b.z);
    }
    fill.v(end.x,end.z);
    line(soft,start,arrowBase,.028);
  }

  let previous=null;
  return (plan,opacity=1)=>{
    for(const item of [fill,border,soft,warning])item.strength(opacity);
    if(previous===plan)return;
    previous=plan;
    root.visible=!!plan;
    if(!plan)return;
    for(const item of [fill,border,soft,warning])item.begin();
    const {skill,from,to,route,landing}=plan;
    root.position.y=from.y;
    if(!plan.brief)circle(soft,from,skill.range,.035,68,true);
    if(to){
      if(skill.kind==='area'){
        circle(fill,to,skill.radius/2,skill.radius,60);
        circle(border,to,skill.radius,.056,60);
        circle(soft,to,skill.radius*.82,.026,56,true);
        marker(to,plan.issue?warning:border);
        for(const strike of plan.strikes?.slice(1)??[])circle(border,strike.at,.22,.031,24);
      }else if(skill.kind==='line'){
        arrow(from,to,skill.width);
        if(plan.returnRoute){
          for(let i=1;i<plan.returnRoute.length;i++){
            if(i%3!==0)line(warning,plan.returnRoute[i-1],plan.returnRoute[i],.032);
          }
        }
      }else if(route){
        for(let i=1;i<route.length;i++){
          line(fill,route[i-1],route[i],.48);
          line(border,route[i-1],route[i],.052);
        }
        marker(to,soft);
        marker(landing,warning);
      }else{
        line(soft,from,to,.047);
        marker(to,warning);
      }
      if(plan.issue){
        line(warning,{x:to.x-.15,z:to.z-.15},{x:to.x+.15,z:to.z+.15},.043);
        line(warning,{x:to.x-.15,z:to.z+.15},{x:to.x+.15,z:to.z-.15},.043);
      }else{
        for(const hit of new Set(plan.events.map(event=>event.target))){
          circle(warning,hit.actor.position,.43,.051,28);
        }
      }
    }
    fill.finish(plan.issue?red:teal);
    border.finish(plan.issue?red:teal);
    soft.finish(teal);
    warning.finish(plan.issue?red:gold);
  };
}
