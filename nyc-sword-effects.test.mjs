import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Bone, Group, PlaneGeometry, Texture} from 'three';
import {createSwordEffects} from './nyc-sword-effects.js';

const data=JSON.parse(readFileSync(new URL('./character-motion/ue-rapier/attack-events.json',import.meta.url)));
function setup(){
  const parent=new Group(),root=new Bone(),hand=new Bone();root.add(hand);parent.add(root);
  const texture=new Texture();
  const fx=createSwordEffects({parent,bones:new Map([['root',root],['hand_r',hand]]),data,
    textures:{trail:texture,slash:texture,wave:texture,spark:texture},slashGeometry:new PlaneGeometry()});
  return {parent,hand,fx};
}

test('UE attack notifies preserve their actual times and sword socket bindings',()=>{
  for(const clip of Object.values(data.clips))for(const event of clip.events){
    assert.ok(Number.isFinite(event.time)&&event.time>=0);
    assert.ok(event.duration>0&&event.endTime<=clip.duration+.001);
    assert.ok(event.notify_state_class.ps_template.path.startsWith('/Game/Rapier_AnimSet/Particles/'));
  }
});

test('sword effects start at the authored notify and build a moving blade trail',()=>{
  const {parent,hand,fx}=setup();fx.begin('slash-1');fx.update(.1,.3);
  assert.equal(parent.userData.swordEffects.active,0);
  fx.update(.03,.335);hand.rotation.z=.1;fx.update(.02,.355);
  const trail=fx.group.children.find(node=>node.name==='Trail');
  assert.ok(trail.geometry.drawRange.count>0);
  assert.ok(parent.userData.swordEffects.sources.some(source=>source.endsWith('P_Slash01.P_Slash01')));
  fx.clear();assert.equal(fx.group.children.length,0);
  fx.update(.1,1);assert.equal(parent.userData.swordEffects.active,0);
});

test('sword skill effects follow its UE notifications and clear on interruption',()=>{
  const {parent,fx}=setup();fx.begin('skill-3');fx.update(.3,.28);
  assert.deepEqual(fx.group.children.map(node=>node.name),['Sparks_P_2']);
  fx.begin('hurt');fx.update(.1,.4);assert.equal(fx.group.children.length,0);
  assert.equal(parent.userData.swordEffects.active,0);
});
