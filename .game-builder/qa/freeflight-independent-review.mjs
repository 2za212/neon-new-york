import assert from 'node:assert/strict';
import * as T from 'three';
import {createInputs} from '../../nyc-controls.js';
import {createFreeFlight} from '../../nyc-flight.js';

class MockNode {
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.style={touchAction:'auto'};this.dataset={};this.listeners=new Map();this.attributes={};this.classList={add(){}};this.captured=new Set();}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  emit(type,props={}){const e={type,target:this,preventDefault(){this.defaultPrevented=true;},stopPropagation(){},...props};for(const fn of [...(this.listeners.get(type)||[])])fn(e);return e;}
  append(...nodes){for(const n of nodes){this.children.push(n);n.parentElement=this;}}
  appendChild(n){this.append(n);return n;}
  remove(){this.parentElement?.children.splice(this.parentElement.children.indexOf(this),1);}
  setAttribute(k,v){this.attributes[k]=v;}
  contains(n){return this===n||this.children.some(c=>c.contains(n));}
  closest(){return ['BUTTON','INPUT','SELECT','TEXTAREA'].includes(this.tagName)?this:null;}
  getBoundingClientRect(){return{left:0,top:0,width:this.tagName==='CANVAS'?1000:116,height:116};}
  setPointerCapture(id){this.captured.add(id);}
  hasPointerCapture(id){return this.captured.has(id);}
  releasePointerCapture(id){this.captured.delete(id);this.emit('lostpointercapture',{pointerId:id});}
  focus(){const old=doc.activeElement;if(old!==this)old?.emit('blur');doc.activeElement=this;win.emit('focusin',{target:this});}
}
const win=new MockNode('window'),coarse=new MockNode();coarse.matches=true;win.matchMedia=()=>coarse;
const doc=new MockNode('document');doc.defaultView=win;doc.head=new MockNode('head');doc.body=new MockNode('body');doc.createElement=tag=>new MockNode(tag);
const canvas=new MockNode('canvas');canvas.ownerDocument=doc;doc.body.append(canvas);canvas.focus();
const input=createInputs(canvas),layer=doc.body.children.find(n=>n.className==='nyc-touch'),actions=layer.children[1];
const [sprint,fall,rise]=actions.children;
const key=(type,code,target=canvas,more={})=>{target.emit(type,{code,...more});win.emit(type,{code,target,...more});};
let checks=0;const check=(fn)=>{fn();checks++;};
input.setFlightMode(true);
key('keydown','KeyE');check(()=>assert.equal(input.state.moveY,1));key('keyup','KeyE');check(()=>assert.equal(input.state.moveY,0));
key('keydown','KeyQ');check(()=>assert.equal(input.state.moveY,-1));key('keydown','KeyE');check(()=>assert.equal(input.state.moveY,0));
win.emit('blur');check(()=>assert.equal(input.state.moveY,0));
rise.emit('pointerdown',{pointerId:1,pointerType:'touch',button:0});check(()=>assert.equal(input.state.moveY,1));rise.emit('pointercancel',{pointerId:1});check(()=>assert.equal(input.state.moveY,0));
fall.emit('pointerdown',{pointerId:2,pointerType:'touch',button:0});check(()=>assert.equal(input.state.moveY,-1));fall.emit('lostpointercapture',{pointerId:2});check(()=>assert.equal(input.state.moveY,0));
rise.emit('pointerdown',{pointerId:3,pointerType:'touch',button:0});fall.emit('pointerdown',{pointerId:4,pointerType:'touch',button:0});check(()=>assert.equal(input.state.moveY,0));fall.emit('pointerup',{pointerId:4});check(()=>assert.equal(input.state.moveY,1));
doc.hidden=true;doc.emit('visibilitychange');check(()=>assert.equal(input.state.moveY,0));doc.hidden=false;
rise.focus();key('keydown','Enter',rise);check(()=>assert.equal(input.state.moveY,1));rise.emit('blur');check(()=>assert.equal(input.state.moveY,0));
fall.focus();key('keydown','Space',fall);check(()=>assert.equal(input.state.moveY,-1));key('keyup','Space',fall);check(()=>assert.equal(input.state.moveY,0));
canvas.focus();key('keydown','KeyE');const button=doc.createElement('button');doc.body.append(button);button.focus();check(()=>assert.equal(input.state.moveY,0));
rise.emit('pointerdown',{pointerId:5,pointerType:'touch',button:0});input.setFlightMode(false);check(()=>{assert.equal(input.state.moveY,0);assert.equal(input.consume().jump,false);assert.equal(fall.hidden,true);});
canvas.focus();key('keydown','KeyE');check(()=>assert.equal(input.state.moveY,0));key('keydown','Space');check(()=>assert.equal(input.consume().jump,true));check(()=>assert.equal(input.consume().jump,false));
input.dispose();check(()=>assert.equal(canvas.style.touchAction,'auto'));

const world={bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20},colliders:[]};
const f=createFreeFlight(world),camera=new T.PerspectiveCamera(),source=new T.Vector3(3,4,5),forward=new T.Vector3(.3,-.4,-.86).normalize();
f.activate(source,forward);f.applyCamera(camera);check(()=>assert.ok(camera.getWorldDirection(new T.Vector3()).distanceTo(forward)<1e-8));
for(let i=0;i<120;i++)f.update(1/60,{moveY:1});f.stop();const stopped=f.position.clone();f.update(1/60,{});check(()=>assert.ok(f.position.equals(stopped)));
f.deactivate();f.update(1/60,{moveY:-1});check(()=>assert.ok(f.position.equals(stopped)));
console.log(JSON.stringify({checks,passed:true,scope:'Independent controls keyboard/touch/focus/cancel/mode-clear and flight start/stop/direction'}));
