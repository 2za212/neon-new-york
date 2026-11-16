import * as T from 'three';
import canvasMock from './canvas-mock.cjs';
import {createNYCScene} from '../../nyc-scene.js';
import {cameraClearance} from '../../nyc-motor.js';
import {createFreeFlight} from '../../nyc-flight.js';
canvasMock.installCanvasMock();
const world=await createNYCScene(new T.Scene(),{capabilities:{getMaxAnisotropy:()=>1}}),solids=world.cameraColliders||world.colliders;
const sphereHit=(p,r=.26)=>solids.findIndex(b=>b.distanceToPoint(p)<r-.00001);
const validMotor=(x,y,z)=>!solids.some(b=>y+1.69>b.min.y&&y+.07<b.max.y&&Math.hypot(x-T.MathUtils.clamp(x,b.min.x,b.max.x),z-T.MathUtils.clamp(z,b.min.z,b.max.z))<.31-.00001);
const poses=[];for(let z=-176;z<50;z+=5)for(let x=-141;x<82;x+=5)poses.push([x,z]);for(let z=-45;z<=-27;z+=.5)for(const x of [-41,-127])poses.push([x,z]);
const hits=[];let samples=0;
outer:for(const [x,z]of poses){
  if(!world.isPlayable(x,z,.31)||!world.walkSurfaces.some(s=>x>=s.minX&&x<=s.maxX&&z>=s.minZ&&z<=s.maxZ))continue;
  const foot=world.ground(x,z,Infinity);if(!validMotor(x,foot,z))continue;
  const target=new T.Vector3(x,foot+1.25,z);
  for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const pitch of [-.65,.08,.92])for(const zoom of [2.7,5.8,10]){
    samples++;const orbit=new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)),desired=target.clone().addScaledVector(orbit,zoom),allowed=cameraClearance(target,desired,solids),origin=target.clone().addScaledVector(orbit,allowed);
    origin.y=Math.max(origin.y,world.ground(origin.x,origin.z,target.y)+.28);
    const look=target.clone();look.y+=Math.max(0,-pitch-.08)*3.2;
    const flight=createFreeFlight(world);flight.activate(origin,look.sub(origin).normalize(),new T.Vector3(x,foot,z));
    const index=sphereHit(flight.position);if(index<0)continue;
    const initial=flight.position.clone();let escape=0;
    for(const input of [{moveY:1},{moveY:-1},{moveX:1},{moveX:-1},{moveZ:1},{moveZ:-1}]){
      const f=createFreeFlight(world);f.activate(origin,new T.Vector3(0,0,-1),new T.Vector3(x,foot,z));for(let i=0;i<60;i++)f.update(1/60,input);escape=Math.max(escape,f.position.distanceTo(initial));
    }
    hits.push({motor:[x,foot,z],yaw,pitch,zoom,origin:origin.toArray(),activated:initial.toArray(),collider:{index,min:solids[index].min.toArray(),max:solids[index].max.toArray()},escape});if(hits.length>=4)break outer;
  }
}
console.log(JSON.stringify({samples,activationOverlaps:hits}));
