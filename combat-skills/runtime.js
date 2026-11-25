import * as T from 'three';
import {attackSpecs,createAttackVariant} from './attack-variations.js';
import {legacySkillSpecs,timeLegacySkills,createLegacyVariant} from './legacy-skills.js';
import {createAimGuide,createCastPlanner} from './targeting.js';
import {prepareReturningBlade} from './returning-blade.js';
import {riftTiming} from './rift-strike.js';

const martial=[
  {id:'rift',kind:'dash',range:5.3,min:1.05,recover:1.13,damage:[42]},
  {id:'flare',kind:'line',hold:true,range:8,min:.65,width:1.26,recover:1.31,damage:[37],follow:24},
  {id:'fist',kind:'dash',range:4.05,min:.65,recover:1.53,damage:[12,15,28]},
  {id:'gravity',kind:'area',hold:true,range:6.6,min:1.1,recover:1.87,damage:[46],follow:25,radius:2.45},
].map(skill=>({...attackSpecs[skill.id],...skill}));

const up=new T.Vector3(0,1,0);
const horizontal=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const skillBindings=[...martial,...legacySkillSpecs].map(({id,title,hold})=>({id,title,hold}));

export function prepareMysticAssets(renderer){
  const assets={blade:null,bladeFailed:false};
  prepareReturningBlade(renderer).then(blade=>{assets.blade=blade;},error=>{
    assets.bladeFailed=true;
    console.error('[NYC] Unable to load the returning blade',error);
  });
  return assets;
}

export function createMysticSkills({world,scene,motor,avatar,renderer,camera,assets,enemy,hit,feedback}){
  const skills=new Map([...martial,...timeLegacySkills(avatar)].map(skill=>[skill.id,skill]));
  const planCast=createCastPlanner(world,world.spawn,avatar.walkingSpeed,[enemy]);
  const drawAim=createAimGuide(scene);
  const empty=new T.Group();
  empty.add(new T.Group());
  const ray=new T.Raycaster(),screenCenter=new T.Vector2(0,-.10),floor=new T.Plane(up,0);
  const ground=new T.Vector3(),headingVector=new T.Vector3(),step=new T.Vector3();
  const handPoint=new T.Vector3(),bonePoint=new T.Vector3();
  const hands=[];
  avatar.group.traverse(node=>{if(node.isBone&&/^hand_[lr]$/.test(node.name))hands.push(node);});
  const right=hands.find(node=>node.name==='hand_r');
  let aimSkill=null,cast=null,last=null;

  function makePlan(skill,yaw,aimed){
    const from=motor.position;
    const to=enemy.actor.position;
    const direction=headingVector.set(-Math.sin(yaw),0,-Math.cos(yaw));
    if(aimed){
      camera.updateMatrixWorld();
      ray.setFromCamera(screenCenter,camera);
      if(skill.kind==='line'){
        direction.copy(ray.ray.direction).setY(0).normalize();
        return planCast(skill,from,null,null,direction);
      }
      floor.constant=-from.y;
      const point=ray.ray.intersectPlane(floor,ground);
      if(point&&point.distanceTo(camera.position)<=36)return planCast(skill,from,null,point);
      return planCast(skill,from,null,ground.copy(from).addScaledVector(direction,skill.range));
    }
    const offset=step.subVectors(to,from).setY(0);
    const distance=offset.length();
    if(enemy.hp&&distance>=skill.min&&distance<=skill.range&&offset.dot(direction)>.34*distance){
      const targetPlan=planCast(skill,from,enemy);
      if(!targetPlan.issue&&targetPlan.events.length)return targetPlan;
    }
    if(skill.kind==='dash')return null;
    if(skill.kind==='line')return planCast(skill,from,null,null,direction);
    for(const range of [3.1,2.35,1.55]){
      const p=planCast(skill,from,null,ground.copy(from).addScaledVector(direction,range));
      if(!p.issue)return p;
    }
    return null;
  }

  function stop(){
    if(cast?.locked)avatar.clearAction();
    cast?.variant.dispose();
    cast=null;aimSkill=null;drawAim(null);
  }

  function start(request,yaw){
    if(cast?.locked)return;
    const skill=skills.get(request.id);
    if(!skill)return;
    if(skill.id==='sword'&&!assets.blade){
      feedback(assets.bladeFailed?'飞剑资源读取失败':'飞剑正在载入');return;
    }
    const plan=makePlan(skill,yaw,request.aimed);
    if(!plan?.to||plan.issue||!plan.forward){
      feedback(plan?.issue||(skill.kind==='dash'?'前方没有可突进的目标':'没有可用落点'));
      return;
    }
    stop();
    const {from,to,forward,side,heading,primary,rear}=plan;
    const target=primary?.actor??empty;
    if(target===empty){
      empty.position.copy(to);
      empty.rotation.y=heading+Math.PI;
      empty.updateMatrixWorld(true);
    }
    const beamEnd=skill.kind==='line'?to.clone().addScaledVector(up,1.13):undefined;
    const impact=skill.kind==='line'?target.position.clone():to;
    const variant=Object.hasOwn(attackSpecs,skill.id)?
      createAttackVariant(skill.id,scene,{from,to:impact,forward,side,target,
        secondaryTarget:rear?.actor??null,beamEnd,reactTarget:false}):
      createLegacyVariant(scene,renderer,assets.blade,plan,target);
    cast={skill,plan,variant,elapsed:0,heading,locked:true,frame:0,clip:null,
      struck:false,indicator:request.aimed?null:{...plan,brief:true},
      events:plan.events.map(event=>({...event})),hits:[]};
    feedback('施放 '+skill.title);
  }

  function beforeMove(dt,input,impulse,yaw,allowed){
    aimSkill=allowed&&!cast?.locked?skills.get(input.skillAim)??null:null;
    if(allowed&&impulse.mystic)start(impulse.mystic,yaw);
    if(!cast?.locked)return null;
    const {plan,skill}=cast;
    const elapsed=cast.elapsed+dt;
    const travel=plan.moveAt?.(elapsed,step)??motor.position;
    if(skill.id==='rift'&&elapsed>riftTiming.landing-.03){
      const toward=Math.atan2(plan.to.x-travel.x,plan.to.z-travel.z)-plan.heading;
      cast.heading=plan.heading+Math.atan2(Math.sin(toward),Math.cos(toward))*
        T.MathUtils.smoothstep(elapsed,riftTiming.landing-.03,1.135);
    }
    return {actionMove:{x:travel.x-motor.position.x,z:travel.z-motor.position.z,heading:cast.heading}};
  }

  function inContact(a,event){
    const {skill,plan}=a,position=event.target.actor.position;
    if(!event.target.hp||Math.abs(position.y-plan.from.y)>1.05)return false;
    if(skill.kind==='dash')return horizontal(position,motor.position)<1.76;
    if(skill.kind==='area')return horizontal(position,plan.to)<=skill.radius+.05;
    const offset=step.subVectors(position,plan.from);
    const along=offset.dot(plan.forward);
    return along>=skill.min-.12&&along<=horizontal(plan.from,plan.to)+.35&&
      Math.abs(offset.dot(plan.side))<=skill.width/2+.05;
  }

  function update(dt,canAdvance){
    if(!cast||!canAdvance)return;
    const a=cast;
    const elapsed=a.elapsed+=dt;
    while(a.frame<a.events.length&&a.events[a.frame].at<=elapsed){
      const event=a.events[a.frame++];
      if(!inContact(a,event))continue;
      hit(event.damage);
      a.struck=true;
      a.hits.push(event.damage);
    }
    if(a.locked&&elapsed>=a.skill.recover){
      a.locked=false;
      avatar.clearAction();
    }
    if(a.locked){
      const clip=a.variant.animation(elapsed);
      if(a.clip!==clip.start&&elapsed>=clip.start){
        avatar.playAction(clip.role,{duration:clip.duration,hold:true});
        a.clip=clip.start;
      }
    }
    if(elapsed>=a.skill.loop-.15){
      last={id:a.skill.id,hits:a.hits,landing:motor.position.toArray()};
      a.variant.dispose();cast=null;
    }
  }

  function afterAvatar(yaw,allowed){
    if(!allowed){drawAim(null);return;}
    if(aimSkill&&!cast?.locked){
      drawAim(makePlan(aimSkill,yaw,true));
    }else if(cast?.indicator&&cast.elapsed<.31){
      drawAim(cast.indicator,1-T.MathUtils.smoothstep(cast.elapsed,.16,.31));
    }else drawAim(null);
    if(!cast)return;
    const a=cast;
    if(a.locked){
      avatar.group.updateMatrixWorld(true);
      handPoint.copy(avatar.group.position).addScaledVector(a.plan.forward,.39).addScaledVector(up,1.11);
      let distance=-Infinity;
      for(const hand of a.skill.id==='rift'&&right?[right]:hands){
        hand.getWorldPosition(bonePoint);
        const reach=bonePoint.dot(a.plan.forward);
        const height=bonePoint.y-motor.position.y;
        if(reach<=distance||height<.40||height>1.91)continue;
        distance=reach;handPoint.copy(bonePoint);
      }
    }
    const hitPoint=a.skill.kind==='area'||(a.elapsed<a.skill.contact&&a.events.length>0)||a.struck;
    a.variant.play(a.elapsed,handPoint,hitPoint,camera);
    a.variant.captureBackdrop?.(camera);
  }

  return {beforeMove,update,afterAvatar,stop,
    get aiming(){return aimSkill?.id??null;},
    get action(){return cast?.locked?cast.skill.id:null;},
    get heading(){return cast?.heading??null;},
    get state(){return {id:cast?.skill.id??null,aiming:aimSkill?.id??null,
      hits:cast?.hits.slice()??null,planned:cast?.plan.landing?.toArray()??null,last};},
  };
}
