import test from 'node:test';
import assert from 'node:assert/strict';
import {installCanvasMock} from './.game-builder/qa/canvas-mock.cjs';
import {buildPumpStation} from './nyc-sewer.js';
import {atEscapeLadder} from './nyc-sewer-collector.js';
import {createMotor} from './nyc-motor.js';

test('the freight hatch and east ladder connect through both dry sides of the sedimentation tank',()=>{
  installCanvasMock();
  const station=buildPumpStation(),motor=createMotor(station,station.spawn);
  function approach(x,z,frames=1200){
    for(let i=0;i<frames;i++){
      const dx=x-motor.position.x,dz=z-motor.position.z;
      if(Math.hypot(dx,dz)<.14)return true;
      motor.update(1/60,{moveX:0,moveZ:1,sprint:true},Math.atan2(-dx,-dz));
    }
    return false;
  }
  const walk=(x,z)=>assert.ok(approach(x,z),`blocked on the way to ${x},${z} at ${motor.position.toArray()}`);
  walk(0,-6);walk(4.8,-6);
  assert.equal(approach(4.8,-17,200),false);
  assert.ok(motor.position.z>-14);
  for(let i=0;i<120;i++)station.collector.update(1/60,true,motor.position);
  walk(4.8,-19);walk(4.8,-50);walk(19.5,-50);walk(19.5,-54);walk(64.5,-54);walk(64.5,-43.4);
  assert.ok(atEscapeLadder(motor.position));
  walk(64.5,-54);walk(19.5,-54);walk(19.5,-64);walk(-3,-64);walk(-3,-50);
  walk(4.8,-50);walk(4.8,-6);walk(0,-6);walk(0,14);
  assert.equal(station.isPlayable(7,-57,.31),false);
  station.collector.reset();
  walk(0,-6);walk(4.8,-6);assert.equal(approach(4.8,-17,200),false);
});
