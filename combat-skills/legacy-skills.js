import * as T from 'three';
import {createPalmSurge} from './palm-surge.js';
import {mountReturningBlade} from './returning-blade.js';
import {attachArmorPlate} from './blade-volume.js';
import {createThunderSeal} from './thunder-seal.js';
import {disposeEffectNodes} from './effect-resources.js';

export const legacySkillSpecs=[
  {id:'palm',title:'截流掌',kind:'line',hold:true,subtitle:'推浪冲击',role:'punch',
    range:5.2,min:.66,width:1.54,cap:1,damage:[36],strike:.43,defaultDuration:.83,tail:.83},
  {id:'sword',title:'御剑·回鞘',kind:'line',hold:true,subtitle:'飞剑往返',role:'skill-2',
    range:7.3,min:1.35,width:1.08,cap:1,damage:[51],strike:.57,defaultDuration:1.55,tail:1.02},
  {id:'thunder',title:'引雷·镇脉',kind:'area',hold:true,subtitle:'四重落雷',role:'skill-3',
    range:7.4,min:1.1,radius:2.8,damage:[60],follow:35,strike:.67,defaultDuration:1.92,tail:1.28},
];

const start=.08;
export function timeLegacySkills(avatar){
  return legacySkillSpecs.map(spec=>{
    const clip=avatar.getActionDuration(spec.role)||spec.defaultDuration;
    const duration=spec.id==='thunder'?Math.min(clip,1.92):clip;
    const contact=start+duration*spec.strike;
    const sustain=spec.id==='sword'?.90:spec.id==='palm'?.42:.33;
    const recover=Math.max(start+duration,contact+sustain);
    return {...spec,duration,contact,recover,loop:Math.max(recover+.24,contact+spec.tail)+.15};
  });
}

export function createLegacyVariant(scene,renderer,bladeAsset,plan,target){
  const {skill,from,to,forward,side,primary}=plan;
  const rig=primary?.rig;
  const impact=primary?.actor.position.clone()??to;
  function motion(){return from;}
  const animation=()=>({role:skill.role,start,duration:skill.duration});
  if(skill.id==='palm'){
    const pulse=createPalmSurge(scene,renderer,from,impact,forward,side);
    return {motion,animation,dispose:pulse.dispose,captureBackdrop:pulse.captureBackdrop,
      play(t,palm,hit,camera){
        const age=t-skill.contact;
        pulse.update(age,palm,camera,hit);
      },
    };
  }
  if(skill.id==='sword'){
    const blade=mountReturningBlade(scene,bladeAsset,forward,side);
    const before=rig?new Set(rig.children):null;
    const mark=rig?attachArmorPlate(rig):null;
    const fittings=rig?rig.children.filter(node=>!before.has(node)):[];
    const point=primary?target.localToWorld(new T.Vector3(.038,1.142,.172)):to.clone().setY(1.13);
    return {motion,animation,
      play(t,palm,hit,camera){
        const age=t-skill.contact;
        mark?.(age,hit);
        blade.update(age,palm,point,camera,hit);
      },
      dispose(){blade.dispose();disposeEffectNodes(fittings);},
    };
  }
  const level=new T.Group();
  level.position.y=to.y;
  scene.add(level);
  const thunder=createThunderSeal(level,renderer,to.clone().setY(0),forward,side);
  const localPalm=new T.Vector3();
  return {motion,animation,dispose(){thunder.dispose();level.removeFromParent();},
    play(t,palm,hit){
      localPalm.copy(palm).y-=level.position.y;
      thunder(t-skill.contact,localPalm,hit);
    },
  };
}
