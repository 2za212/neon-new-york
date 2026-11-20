import * as T from 'three';

// Bounds of the three sashes on the room side of their deep reveals.
// Work in the apartment frame so the portal follows its city placement.
export function createHomeWindow(renderer,city,room,avatar){
  const corners=[[-4.58,.71],[1.08,.71],[1.08,4.23],[-4.58,4.23]]
    .map(([x,y])=>new T.Vector3(x,y,-3.84));
  const eyeCorners=corners.map(()=>new T.Vector3());
  const projected=new T.Vector3(),cut=new T.Vector3(),size=new T.Vector2();
  const streetCamera=new T.PerspectiveCamera(),crop=new T.Matrix4();
  const viewport=new T.Vector4(),scissor=new T.Vector4();
  const streetFrustum=new T.Frustum(),viewProjection=new T.Matrix4(),culled=[];
  const cityTiles=city.userData.nyc.stats.meshes;
  const openingX=room.localToWorld(corners[0].clone()).x;
  // The normal street camera still sees the apartment and its three windows.
  room.traverse(o=>o.layers.enable(1));
  avatar.traverse(o=>o.layers.enable(1));
  city.traverse(o=>{if(o.isLight)o.layers.enable(1);});
  function windowRect(localCamera,w,h){
    if(localCamera.position.z<=-3.84+localCamera.near)return viewport.set(0,0,w,h);
    localCamera.updateMatrixWorld();
    let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity;
    function include(v){
      projected.copy(v).applyMatrix4(localCamera.projectionMatrix);
      left=Math.min(left,projected.x);right=Math.max(right,projected.x);
      bottom=Math.min(bottom,projected.y);top=Math.max(top,projected.y);
    }
    for(let i=0;i<4;i++)eyeCorners[i].copy(corners[i]).applyMatrix4(localCamera.matrixWorldInverse);
    const near=-localCamera.near;
    for(let i=0;i<4;i++){
      const a=eyeCorners[i],b=eyeCorners[(i+1)%4];
      if(a.z<=near)include(a);
      if((a.z<=near)!==(b.z<=near))include(cut.copy(a).lerp(b,(near-a.z)/(b.z-a.z)));
    }
    if(right<=left||top<=bottom||right< -1||left>1||top< -1||bottom>1)return null;
    const x=Math.max(0,Math.floor((left+1)*w*.5)-2);
    const y=Math.max(0,Math.floor((bottom+1)*h*.5)-2);
    return viewport.set(x,y,Math.min(w,Math.ceil((right+1)*w*.5)+2)-x,Math.min(h,Math.ceil((top+1)*h*.5)+2)-y);
  }
  return function render(localCamera,view,dt,update){
    const {x:w,y:h}=renderer.getSize(size);
    const rect=windowRect(localCamera,w,h);
    update(view,dt,Boolean(rect));
    const autoClear=renderer.autoClear,background=city.background;
    const deferShadow=!rect&&renderer.shadowMap.needsUpdate;
    renderer.getScissor(scissor);
    const scissorTest=renderer.getScissorTest();
    renderer.info.reset();
    try{
      renderer.autoClear=false;
      renderer.setScissorTest(false);renderer.clear();
      if(rect){
        // Crop the projection as well as the framebuffer. Off-window city
        // tiles then fail ordinary frustum culling before any draw is issued.
        streetCamera.position.copy(view.position);streetCamera.quaternion.copy(view.quaternion);
        streetCamera.near=localCamera.near;streetCamera.far=localCamera.far;
        crop.set(w/rect.z,0,0,(w-2*rect.x-rect.z)/rect.z,
          0,h/rect.w,0,(h-2*rect.y-rect.w)/rect.w,0,0,1,0,0,0,0,1);
        streetCamera.projectionMatrix.multiplyMatrices(crop,view.projectionMatrix);
        streetCamera.projectionMatrixInverse.copy(streetCamera.projectionMatrix).invert();
        streetCamera.updateMatrixWorld();
        streetFrustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(
          streetCamera.projectionMatrix,streetCamera.matrixWorldInverse));
        // City tile vertices are authored in world metres. Their tight boxes
        // reject long rows that Three's default bounding spheres would keep.
        // Leave offscreen shadow casters available during a shadow refresh.
        if(!renderer.shadowMap.needsUpdate)for(const tile of cityTiles){
          const box=tile.geometry.boundingBox;
          if(tile.visible&&(box.max.x<openingX||!streetFrustum.intersectsBox(box))){
            tile.visible=false;culled.push(tile);
          }
        }
        renderer.setViewport(rect);renderer.setScissor(rect);renderer.setScissorTest(true);
        room.visible=false;
        renderer.render(city,streetCamera);
        room.visible=true;renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
        renderer.clearDepth();
      }
      if(deferShadow)renderer.shadowMap.needsUpdate=false;
      city.background=null;view.layers.set(1);
      renderer.render(city,view);
    }finally{
      for(const tile of culled)tile.visible=true;
      culled.length=0;
      if(deferShadow)renderer.shadowMap.needsUpdate=true;
      room.visible=true;city.background=background;renderer.autoClear=autoClear;
      renderer.setViewport(0,0,w,h);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);
    }
  };
}
