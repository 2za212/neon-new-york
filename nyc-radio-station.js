import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import solidCells from './city-surfaces/fulton/solid-cells.json';

// Local +Z faces west over Market Avenue. Sidewalk, stairs and window openings
// use the same occupied 16 cm cells as the authored building.
export function buildRadioStation(scene,collider){
  const x=14.72,z=44,y=.54,unit=.16;
  for(const [a,b,c,w,h,d] of solidCells)
    collider(x-(c+d/2)*unit,y+(b+h/2)*unit,z+(a+w/2)*unit,d*unit,h*unit,w*unit);
  const root=new T.Group();root.name='Fulton Corner Radio';root.position.set(x,y,z);
  root.rotation.y=-Math.PI/2;scene.add(root);
  let far,near,pending=false,retryAt=0;
  const loader=new GLTFLoader();
  async function load(file){
    const url='./city-surfaces/fulton/'+file;
    let asset;
    if(typeof DecompressionStream==='function'){
      try{
        const response=await fetch(url+'.gz');
        if(!response.ok)throw new Error(String(response.status));
        const bytes=await response.arrayBuffer(),header=new Uint8Array(bytes,0,2);
        const decoded=header[0]===31&&header[1]===139
          ?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():bytes;
        asset=await loader.parseAsync(decoded,'./city-surfaces/fulton/');
      }catch{ /* Static hosts can omit precompressed assets. */ }
    }
    const {scene:model}=asset||await loader.loadAsync(url);
    model.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}});
    root.add(model);return model;
  }
  return {
    async ready(){if(typeof Image!=='undefined')far=await load('station.glb');},
    update(position,low){
      if(!far||!position)return;
      const distance=Math.hypot(position.x-x,position.y-y-5,position.z-z);
      const close=distance<(low?13:20)+(near?.visible?2:0);
      if(close&&!near&&!pending&&performance.now()>retryAt){
        pending=true;load('station-near.glb').then(model=>{near=model;near.visible=false;})
          .catch(()=>{retryAt=performance.now()+15000;}).finally(()=>{pending=false;});
      }
      if(near)near.visible=close;
      far.visible=!(near&&close);
    }
  };
}
