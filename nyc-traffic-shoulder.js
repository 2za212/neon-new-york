import * as T from 'three';
import {cameraClearance} from './nyc-motor.js';

// A passing vehicle can cut the normal shoulder down to less than the
// character width. Look briefly past its side, or over a low bonnet when
// a wall leaves less lateral room. User-controlled orbit angles do not
// change. The normal camera still verifies the final segment every frame.
export function createTrafficShoulder(cars,query){
  const vehicleBodies=new WeakSet();
  const predicted=cars.map(()=>new T.Box3()),near=[],fixed=[],direction=new T.Vector3(),end=new T.Vector3();
  const offsets=[[0,.4],[.53,.20],[.89,.24],[1.18,.27],[1.42,.25],[.64,.69],[1.03,.57],[0,1.04]];
  let turn=0,rise=0,wantedTurn=0,wantedRise=0,cache=0;
  function endpoint(origin,length,yaw,pitch){
    const c=Math.cos(pitch);
    return end.set(Math.sin(yaw)*c,Math.sin(pitch),Math.cos(yaw)*c).multiplyScalar(length).add(origin);
  }
  return function adjust(target,desired,dt,snap=false){
    if(snap){turn=rise=wantedTurn=wantedRise=cache=0;}
    near.length=0;
    for(let i=0;i<cars.length;i++){
      const car=cars[i];
      if(Math.abs(car.x-target.x)>10||Math.abs(car.z-target.z)>10||Math.abs(car.y-target.y)>4)continue;
      const b=predicted[i].makeEmpty();
      for(const body of car.bodies){b.union(body);vehicleBodies.add(body);}
      // Include where the car is about to pass. This starts the adjustment
      // before the bumper reaches the optical line, and also works when the
      // player approaches a stationary van on foot.
      const dx=car.fx*car.speed*.65,dz=car.fz*car.speed*.65;
      b.min.x+=Math.min(0,dx);b.max.x+=Math.max(0,dx);
      b.min.z+=Math.min(0,dz);b.max.z+=Math.max(0,dz);
      near.push(b);
    }
    if(!near.length&&!turn&&!rise)return false;
    direction.subVectors(desired,target);
    const range=direction.length();if(range<.001)return false;
    direction.divideScalar(range);
    const yaw=Math.atan2(direction.x,direction.z),pitch=Math.asin(T.MathUtils.clamp(direction.y,-1,1));
    const threat=near.length?cameraClearance(target,desired,near):range;
    const trigger=Math.min(2.55,range-.20);
    let blocked=threat<trigger;
    if(blocked){
      fixed.length=0;
      for(const body of query(target,desired))if(!vehicleBodies.has(body))fixed.push(body);
      if(cameraClearance(target,desired,fixed)<threat+.10)blocked=false;
    }
    cache-=dt;
    if(blocked&&cache<=0){
      cache=.12;
      let best=threat,choiceTurn=0,choiceRise=0;
      for(const [swing,up] of offsets)for(const side of swing?[1,-1]:[1]){
        const offset=side*swing,tilt=Math.min(1.15,pitch+up);
        const probe=endpoint(target,range,yaw+offset,tilt);
        const free=Math.min(cameraClearance(target,probe,near),cameraClearance(target,probe,query(target,probe)));
        const flip=wantedTurn*offset<0?.48:0;
        const score=Math.min(2.68,free)-swing*.56-(tilt-pitch)*.70-flip;
        if(score>best+.025){best=score;choiceTurn=offset;choiceRise=tilt-pitch;}
      }
      wantedTurn=choiceTurn;wantedRise=choiceRise;
    }else if(!blocked){cache=0;wantedTurn=wantedRise=0;}
    const blend=snap?1:1-Math.exp(-dt*(blocked?10:5.5));
    turn=T.MathUtils.lerp(turn,wantedTurn,blend);rise=T.MathUtils.lerp(rise,wantedRise,blend);
    if(!blocked&&Math.abs(turn)+Math.abs(rise)<.003){turn=rise=0;return false;}
    if(!turn&&!rise)return false;
    // If the player spins straight into an already adjacent van, there is
    // no lead time. Accept the smallest verified part of the correction
    // that can still frame the character, then ease the rest as usual.
    const current=endpoint(target,range,yaw+turn,Math.min(1.18,pitch+rise));
    if(cameraClearance(target,current,query(target,current))<1.25){
      for(const t of [.25,.5,.75,1]){
        const h=T.MathUtils.lerp(turn,wantedTurn,t),v=T.MathUtils.lerp(rise,wantedRise,t);
        const escape=endpoint(target,range,yaw+h,Math.min(1.18,pitch+v));
        if(cameraClearance(target,escape,query(target,escape))<1.28)continue;
        turn=h;rise=v;break;
      }
    }
    const shoulder=T.MathUtils.clamp((Math.abs(turn)+rise)/1.25,0,1);
    const distance=T.MathUtils.lerp(range,Math.min(3.15,range),shoulder);
    desired.copy(endpoint(target,distance,yaw+turn,Math.min(1.18,pitch+rise)));
    return true;
  };
}
