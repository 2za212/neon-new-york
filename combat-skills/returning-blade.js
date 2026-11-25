import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createArmorImpact, createBladeVolume, createDeckGlints, createSwordSheath} from './blade-volume.js';
import {disposeEffectNodes} from './effect-resources.js';

const launch = -.34;
const recall = .13;
const catchTime = .81;
const bladeScale = 1.09;
const departSide=2.14,sweepSide=2.40,sweepLead=.42;
const tipLength = 1.08546066 * bladeScale;
const warm = new T.Color(0xffa85b);
const cold = new T.Color(0x6ccaff);
const up = new T.Vector3(0, 1, 0);
const vector = () => new T.Vector3();
const ease = T.MathUtils.smoothstep;
const clamp = T.MathUtils.clamp;

function cubic(out, a, b, c, d, t) {
  const k = 1 - t;
  return out.copy(a).multiplyScalar(k*k*k).addScaledVector(b,3*k*k*t)
    .addScaledVector(c,3*k*t*t).addScaledVector(d,t*t*t);
}

export function returningBladeGroundRoute(from,to,forward,side){
  const receive=from.clone().addScaledVector(forward,.42);
  const depart=to.clone().addScaledVector(forward,-tipLength*.72).addScaledVector(side,departSide);
  const sweep=receive.clone().addScaledVector(side,sweepSide).addScaledVector(forward,sweepLead);
  return Array.from({length:21},(_,i)=>cubic(vector(),to,depart,sweep,receive,i/20));
}

export async function prepareReturningBlade(renderer) {
  const model = (await new GLTFLoader().loadAsync('./combat-skills/sword-preview.glb')).scene;
  const room = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  const {texture: envMap} = pmrem.fromScene(room, .027);
  room.dispose();
  pmrem.dispose();

  const guard = new T.Color(0xb6a17a);
  const grip = new T.Color(0x35383e);
  const spine = new T.Color(0x3b5f75);
  const grind = new T.Color(0xc1d5e1);
  const color = new T.Color();
  model.traverse(object => {
    if (!object.isMesh) return;
    const position = object.geometry.getAttribute('position');
    const rgb = new Float32Array(position.count * 3);
    for (let i=0;i<position.count;i++) {
      const x = Math.abs(position.getX(i)), y = position.getY(i);
      if (y > -.08) color.copy(x > .028 ? guard : grip);
      else color.copy(spine).lerp(grind,ease(x,.004,.025)*.9+.10);
      color.toArray(rgb, i*3);
    }
    object.geometry.setAttribute('color', new T.BufferAttribute(rgb,3));
    object.material = new T.MeshStandardMaterial({
      color:0xffffff, vertexColors:true, envMap, envMapIntensity:1.34,
      roughness:.235, metalness:.76, emissive:0x9adaff, emissiveIntensity:.03,
    });
  });

  const runes = new T.Group();
  runes.name = '剑脊导能金属槽';
  const copper = new T.MeshStandardMaterial({color:0xaf8a55,metalness:.68,roughness:.32,envMap});
  const inlay = new T.MeshBasicMaterial({color:0xb5eafd});
  for (const face of [-1,1]) {
    const band = new T.Mesh(new T.BoxGeometry(.011,.53,.005),copper);
    band.position.set(0,-.39,face*.018);
    runes.add(band);
    for (const [y,length] of [[-.24,.066],[-.33,.032],[-.415,.093],[-.523,.057],[-.605,.038]]) {
      const line = new T.Mesh(new T.BoxGeometry(.004,length,.004),inlay);
      line.position.set(0,y,face*.022);
      runes.add(line);
    }
  }
  model.add(runes);
  model.scale.setScalar(bladeScale);
  return {model,inlay};
}

export async function createReturningBlade(scene, renderer, forward, side) {
  return mountReturningBlade(scene,await prepareReturningBlade(renderer),forward,side);
}

export function mountReturningBlade(scene, asset, forward, side) {
  const model=asset.model.clone(true);
  const {inlay}=asset;
  const sword = new T.Group();
  sword.name = '御剑 · 细剑';
  sword.add(model);
  scene.add(sword);

  const effects = new T.Group();
  effects.name = '御剑 · 剑气与入甲';
  scene.add(effects);

  const updateWake = createBladeVolume(effects);
  const updateSheath = createSwordSheath(model);
  const updateGlints = createDeckGlints(effects, forward, side);
  const impact = createArmorImpact(effects, forward, side);

  const strikeLight = new T.PointLight(warm,0,4.2,2);
  const travelLight = new T.PointLight(warm,0,3.15,2);
  effects.add(strikeLight,travelLight);

  const start = vector(), lift = vector(), approach = vector(), stick = vector(),
    depart = vector(), sweep = vector(), receive = vector(), hand = vector();
  const current = vector(), heading = vector(), lookAhead = vector(), sampleHeading = vector(),
    endHeading = vector(), lateral = vector(), normal = vector(), reverse = vector(), tip = vector();
  const basis = new T.Matrix4();
  let last = -Infinity;
  let launched = false;

  function setRoute(palm, point) {
    start.copy(hand);
    stick.copy(point).addScaledVector(forward,-tipLength*.99);
    lift.copy(start).addScaledVector(up,.29).addScaledVector(forward,.36);
    approach.copy(stick).addScaledVector(forward,-.65).addScaledVector(up,.08);
    depart.copy(stick).addScaledVector(side,departSide).addScaledVector(up,-.41);
    sweep.copy(start).addScaledVector(side,sweepSide).addScaledVector(forward,sweepLead);
    sweep.y = .29;
    receive.copy(palm);
  }

  function positionAt(out,t) {
    if (t < launch) return out.copy(start);
    if (t < 0) return cubic(out,start,lift,approach,stick,(t-launch)/-launch);
    if (t < recall) return out.copy(stick).addScaledVector(forward,Math.sin(Math.PI*t/recall)*.045);
    return cubic(out,stick,depart,sweep,receive,Math.min(1,(t-recall)/(catchTime-recall)));
  }

  function flightHeading(out,at,t) {
    positionAt(lookAhead,t+.012);
    out.copy(lookAhead).sub(at);
    if ((t>=-.012 && t<recall) || out.lengthSq()<.000001) return out.copy(forward);
    out.normalize();
    if (t>=recall) {
      out.y = clamp(out.y,-.19,.29);
      out.normalize();
      out.lerp(forward,1-ease(t,recall,recall+.073)).normalize();
      endHeading.copy(forward).multiplyScalar(-1).addScaledVector(up,.37).normalize();
      out.lerp(endHeading,ease(t,.66,catchTime)).normalize();
    }
    return out;
  }

  function wakeAt(out,t) {
    positionAt(out,t);
    flightHeading(sampleHeading,out,t);
    return out.addScaledVector(sampleHeading,tipLength*.64);
  }

  function update(t,palm,point,camera,hit=true) {
    if (t<launch || t<last-.006) launched=false;
    if (!launched) {
      hand.copy(palm);
      launched=t>=launch;
    }
    last=t;
    setRoute(palm,point);
    const flying=t>=launch&&t<catchTime;
    const returning=t>=recall;
    if (flying) {
      positionAt(current,t);
      flightHeading(heading,current,t);
    } else {
      current.copy(palm);
      heading.copy(forward).multiplyScalar(returning?-1:1).addScaledVector(up,returning?.37:.32).normalize();
    }
    sword.position.copy(current);
    reverse.copy(heading).negate();
    normal.copy(camera.position).sub(current);
    normal.addScaledVector(reverse,-normal.dot(reverse)).normalize();
    lateral.crossVectors(reverse,normal).normalize();
    normal.crossVectors(lateral,reverse).normalize();
    basis.makeBasis(lateral,reverse,normal);
    sword.quaternion.setFromRotationMatrix(basis);
    sword.rotateY(.22+.32*Math.sin(7*t)+.21*ease(t,recall,.38));

    const out=ease(t,-.46,-.25);
    const struck=hit&&t>=0&&t<.48;
    const fold=returning?1-ease(t,.64,catchTime):1;
    const bright=returning?ease(t,recall,recall+.077)*fold:out*(1-.70*ease(t,.015,recall));
    updateSheath(t,bright*(flying?.87:.48),returning);
    inlay.color.copy(returning?cold:warm).multiplyScalar(.85+bright*.78);
    updateWake(t,returning?recall:launch,returning?t:Math.min(t,-.014),returning?.43:.34,
      flying?bright:0,returning,wakeAt);

    tip.copy(current).addScaledVector(heading,tipLength*.69);
    travelLight.position.copy(tip);
    travelLight.color.copy(returning?cold:warm);
    travelLight.intensity=bright*(returning?4.2:4.1);
    strikeLight.position.copy(point).addScaledVector(forward,-.31);
    const impulse=struck?Math.exp(-t*12):0;
    strikeLight.intensity=12*impulse;
    updateGlints(tip,point,bright,impulse,returning);
    impact.update(point,t,hit);
  }

  return {update,dispose(){disposeEffectNodes([sword,effects],[asset.model]);}};
}
