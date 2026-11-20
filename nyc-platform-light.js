import * as T from 'three';

// Both platforms share one draw. Only faces inside the station receive these
// moving pools, so train windows cannot light the street through the viaduct.
export function createPlatformLight(scene,rail){
  const positions=[],indices=[];
  const deck=rail.height;
  const face=(a,b,c,d)=>{
    const first=positions.length/3;
    positions.push(...a,...b,...c,...d);
    indices.push(first,first+1,first+2,first,first+2,first+3);
  };
  for(const u of [25,165]){
    const a=u-16,b=u+16;
    face([a,deck+.012,2.82],[a,deck+.012,8.65],[b,deck+.012,8.65],[b,deck+.012,2.82]);
    face([a,14.11,2.52],[b,14.11,2.52],[b,15.09,2.52],[a,15.09,2.52]);
    face([a,17.733,3.20],[b,17.733,3.20],[b,17.733,9.31],[a,17.733,9.31]);
    for(let i=-12.8;i<=13;i+=6.4){
      const x=u+i,z=7.866;
      face([x-.31,deck+.10,z],[x+.31,deck+.10,z],[x+.31,17.50,z],[x-.31,17.50,z]);
    }
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);
  const uniforms={uCar:{value:new T.Vector2()},uNight:{value:1}};
  const mat=new T.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
    vertexShader:`varying vec3 platform;
      void main(){platform=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 platform;uniform vec2 uCar;uniform float uNight;
      void main(){
        float x=platform.x-uCar.x,across=platform.z-1.60;
        float coach=mod(x+19.2,9.6)-4.8;
        float body=(1.-smoothstep(16.6,19.8,abs(x)))*(1.-smoothstep(3.68,4.77,abs(coach)));
        float distanceY=abs(platform.y-16.8);
        float spill=body*exp(-.23*across-.34*distanceY);
        float windowBands=.42+.58*smoothstep(.04,.47,abs(fract((coach+.56)/1.17)-.5));
        float nearDoor=1.-smoothstep(.3,1.52,abs(coach+2.88));
        vec3 windows=mix(vec3(.44,.72,.79),vec3(1.,.62,.24),nearDoor);
        float ahead=x*uCar.y-19.4;
        float cone=smoothstep(-.8,2.4,ahead)*(1.-smoothstep(5.,20.,ahead));
        cone*=exp(-.22*pow(max(across-.11*ahead,0.),2.)-.25*distanceY);
        float tail=exp(-.30*abs(x*uCar.y+19.4)-.58*across-.51*distanceY);
        vec3 power=windows*spill*windowBands*.48+vec3(.59,.84,1.)*cone*.65+vec3(.9,.10,.036)*tail*.30;
        gl_FragColor=vec4(power*uNight,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  mat.forceSinglePass=true;
  const mesh=new T.Mesh(geo,mat),[sx,sz]=rail.start;
  const axis=new T.Vector2(rail.end[0]-sx,rail.end[1]-sz).normalize();
  mesh.position.set(sx,0,sz);mesh.rotation.y=-Math.atan2(axis.y,axis.x);
  mesh.name='折光线 / 站台车窗投光';mesh.renderOrder=2;scene.add(mesh);

  // Use the two existing emissive fascia instances on the car noses. Turn the
  // lamps round only when the shuttle reverses after stopping at a terminus.
  const nose=[],m=new T.Matrix4(),white=new T.Color(0xc5eeff),red=new T.Color(0xf14c3d);
  for(const part of rail.trainRoot.children){
    if(!part.isInstancedMesh||part.name!=='Future core / light')continue;
    for(let i=0;i<part.count;i++){
      part.getMatrixAt(i,m);
      if(Math.abs(Math.abs(m.elements[12])-19.4)<.015&&Math.abs(m.elements[13]-15.7)<.015)
        nose.push({part,i,side:Math.sign(m.elements[12])});
    }
  }
  let lastSign=0;
  return {
    setNight(night){uniforms.uNight.value=night?1:.35;},
    update(){
      const root=rail.trainRoot;mesh.visible=root.visible;
      if(!root.visible)return;
      const direction=root.userData.travelSign;
      uniforms.uCar.value.set((root.position.x-sx)*axis.x+(root.position.z-sz)*axis.y,direction);
      if(direction===lastSign)return;
      for(const {part,i,side} of nose){
        part.setColorAt(i,side===direction?white:red);
        part.instanceColor.addUpdateRange(i*3,3);part.instanceColor.needsUpdate=true;
      }
      lastSign=direction;
    }
  };
}
