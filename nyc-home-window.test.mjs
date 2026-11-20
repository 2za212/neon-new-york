import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createHomeWindow} from './nyc-home-window.js';

function drawWindow(x,z){
  const city=new T.Scene(),room=new T.Group(),avatar=new T.Group(),passes=[];
  city.add(room);room.add(avatar);city.userData.nyc={stats:{meshes:[]}};
  const renderer={
    info:{reset(){}},shadowMap:{needsUpdate:false},autoClear:true,
    getSize:v=>v.set(1920,1080),getScissor:v=>v.set(0,0,1920,1080),
    getScissorTest:()=>false,setScissorTest(){},setScissor(){},setViewport(){},clear(){},clearDepth(){},
    render(s,camera){passes.push(camera.layers.mask);}
  };
  const camera=new T.PerspectiveCamera(54,16/9,.085,450);
  camera.position.set(-2,1.7,0);
  camera.lookAt(x,1.7,z);
  createHomeWindow(renderer,city,room,avatar)(camera,camera.clone(),1/60,()=>{});
  assert.ok(room.visible&&renderer.autoClear);
  return passes;
}

test('a window entirely behind or beside the camera submits no street pass',()=>{
  assert.deepEqual(drawWindow(-2,2),[2]);
  assert.deepEqual(drawWindow(4,0),[2]);
});

test('looking through the window submits the street and then the apartment',()=>{
  assert.deepEqual(drawWindow(-2,-5),[1,2]);
});
