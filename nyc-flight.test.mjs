import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createFreeFlight} from './nyc-flight.js';
import {createMotor} from './nyc-motor.js';
import {createPlayableArea} from './nyc-regions.js';
import {mapPlan,getDistrict} from './nyc-map-plan.js';

const makeWorld=(colliders=[])=>({bounds:{minX:-146,maxX:144,minZ:-180,maxZ:160},colliders});
function fly(world,origin=[0,5,0],direction=[0,0,-1]){const f=createFreeFlight(world);f.activate(new T.Vector3(...origin),new T.Vector3(...direction));return f;}
function run(f,input,seconds=1){for(let i=0;i<seconds*60;i++)f.update(1/60,input);}
test('free camera starts on the current view and preserves its direction',()=>{
  const f=fly(makeWorld(),[2,6,4],[1,0,0]),camera=new T.PerspectiveCamera();f.applyCamera(camera);const d=camera.getWorldDirection(new T.Vector3());
  assert.deepEqual(camera.position.toArray(),[2,6,4]);assert.ok(d.distanceTo(new T.Vector3(1,0,0))<1e-7);
});
test('flight WASD follows the view, vertical input ascends and descends',()=>{
  const f=fly(makeWorld(),[0,20,0],[1,0,0]);run(f,{moveZ:1});assert.ok(f.position.x>9&&Math.abs(f.position.z)<.001);
  const before=f.position.y;f.stop();run(f,{moveY:1});assert.ok(f.position.y>before+9);f.stop();run(f,{moveY:-1});assert.ok(Math.abs(f.position.y-before)<.01);
});
test('three-axis diagonal flight is normalized',()=>{
  const straight=fly(makeWorld()),diagonal=fly(makeWorld());run(straight,{moveZ:1});run(diagonal,{moveX:1,moveY:1,moveZ:1});
  assert.ok(Math.abs(straight.position.distanceTo(new T.Vector3(0,5,0))-diagonal.position.distanceTo(new T.Vector3(0,5,0)))<.001);
});
test('accelerated flight cannot tunnel through a thin facade',()=>{
  const wall=new T.Box3(new T.Vector3(-20,0,-4.05),new T.Vector3(20,80,-4));const f=fly(makeWorld([wall]));
  for(let i=0;i<90;i++)f.update(.6,{moveZ:1,sprint:true},{zoom:-150});assert.ok(f.position.z>=-3.741&&f.position.z<-3.5);
});
test('a roof blocks descending flight while an elevated underpass remains open',()=>{
  const roof=new T.Box3(new T.Vector3(-5,6,-5),new T.Vector3(5,7,5)),world=makeWorld([roof]);
  const above=fly(world,[0,12,0]);run(above,{moveY:-1},2);assert.ok(above.position.y>=7.259);
  const below=fly(world,[0,4,2]);run(below,{moveZ:1},1);assert.ok(below.position.z<-7&&Math.abs(below.position.y-4)<.001);
});
test('flight limits altitude and world bounds; stopping and deactivation remove drift',()=>{
  const f=fly(makeWorld(),[143,189,-179]);run(f,{moveX:1,moveY:1,moveZ:1,sprint:true},2);
  assert.ok(f.position.x<=143.74&&f.position.y<=190&&f.position.z>=-179.74);f.stop();const p=f.position.clone();f.update(1/60,{});assert.ok(f.position.equals(p));
  f.deactivate();run(f,{moveZ:1},1);assert.ok(f.position.equals(p));
});
test('flight activation inside a podium falls back to the character safe view',()=>{
  const podium=new T.Box3(new T.Vector3(-24,.36,-170),new T.Vector3(8,16.36,-144)),f=createFreeFlight(makeWorld([podium]));
  const character=new T.Vector3(-21,.18,-176);f.activate(new T.Vector3(-21,.64,-168.039),new T.Vector3(0,0,1),character);
  assert.ok(f.active);assert.deepEqual(f.position.toArray(),[-21,1.53,-176]);run(f,{moveY:1});assert.ok(f.position.y>10);assert.deepEqual(character.toArray(),[-21,.18,-176]);
});
const outline=mapPlan.currentOutline;
test('district union opens the built north, south and east seams while rejecting genuine concave voids',()=>{
  const inside=createPlayableArea(outline);assert.ok(inside(0,-52,.31));assert.ok(inside(83,-100,.31));assert.ok(inside(-130,0,.31));
  assert.ok(inside(60,0,.31));assert.ok(inside(0,70,.31));assert.ok(inside(132,84,.31));assert.ok(inside(83.6,95.6,.31));
  assert.equal(inside(-100,-100,.31),false);assert.equal(inside(-100,100,.31),false);assert.equal(inside(100,120,.31),false);assert.ok(inside(-64.1,-52.1,.31));assert.equal(inside(-125,-75,.31),false);
  for(const p of [[-85,-77],[-82,75],[115,-56]])assert.ok(inside(...p,.31));assert.equal(inside(84.2,95.8,.31),false);
});
test('actual walking motor crosses the north seam but stops at the district side',()=>{
  const world={...makeWorld(),isPlayable:createPlayableArea(outline),baseHeight:.18};const m=createMotor(world,new T.Vector3(0,.18,-49));
  for(let i=0;i<180;i++)m.update(1/60,{moveX:0,moveZ:1,sprint:true},0);assert.ok(m.position.z<-67);
  const edge=createMotor(world,new T.Vector3(-62,.18,-118));for(let i=0;i<180;i++)edge.update(1/60,{moveX:-1,moveZ:0,sprint:true},0);
  assert.ok(edge.position.x>=-63.691&&edge.position.x<-63.5);
});
test('the two old exchange exits connect the core roads on map and on foot',()=>{
  const world={bounds:mapPlan.currentBounds,colliders:[],isPlayable:createPlayableArea(outline),baseHeight:.18};
  for(const x of [-36,58]){
    assert.equal(mapPlan.frontierExits.some(exit=>Math.abs(exit.position[0]-x)<1&&Math.abs(exit.position[1]+180)<2),false);
    const m=createMotor(world,new T.Vector3(x,.18,-176));
    for(let i=0;i<120;i++)m.update(1/60,{moveX:0,moveZ:1,sprint:true},0);
    assert.ok(m.position.z < -185);
    assert.equal(getDistrict(m.position.x,m.position.z),'核心区');
  }
});
