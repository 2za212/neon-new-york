import * as T from 'three';

export const up = new T.Vector3(0, 1, 0);
export const TAU = 2 * Math.PI;
export const ease = T.MathUtils.smoothstep;
export const mix = T.MathUtils.lerp;
export const vector = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
export const rgb = (r,g,b) => new T.Color(r,g,b);
export const hash = i => T.MathUtils.euclideanModulo(Math.sin(i*127.13+2.17)*43758.54,1);

const vertex = `
  varying vec2 st;
  varying vec3 world, nrm;
  void main(){
    st=uv;
    vec4 p=modelMatrix*vec4(position,1.);
    world=p.xyz;
    nrm=normalize(mat3(modelMatrix)*normal);
    gl_Position=projectionMatrix*viewMatrix*p;
  }`;

export function makeShader(fragment, uniforms, options={}) {
  return new T.ShaderMaterial({
    vertexShader:vertex,fragmentShader:`
      varying vec2 st;
      varying vec3 world,nrm;
      `+fragment+`
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
    uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    side:T.DoubleSide,forceSinglePass:true,...options,
  });
}

const noise = `
  float hash3(vec3 p){p=fract(p*.31831+vec3(.23,.17,.41))*17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float grit(vec3 p){
    vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
  }`;

export function makeTube(group,{rows=36,sides=10,color,edge,kind=0,order=7}) {
  const surface=new T.PlaneGeometry(1,1,sides,rows);
  const points=surface.attributes.position.setUsage(T.DynamicDrawUsage);
  const normals=surface.attributes.normal.setUsage(T.DynamicDrawUsage);
  const energy={value:0},time={value:0};
  const material=makeShader(noise+`
    uniform float energy,time,kind;
    uniform vec3 color,edge;
    void main(){
      float u=1.-st.y, a=st.x*6.2831853;
      float view=abs(dot(normalize(cameraPosition-world),normalize(nrm)));
      float rim=pow(1.-view,2.25);
      float pitch=a*2. + (kind<.5?u*19.:u*13.) - time*20.;
      float ray=pow(.5+.5*cos(pitch+.42*sin(u*41.+a)),7.);
      float thin=pow(.5+.5*sin(a*3.-u*31.+time*18.),13.);
      float grain=grit(world*vec3(9.,10.,9.)+vec3(0.,-time*1.2,time*3.));
      float veins=ray*(.32+.68*grain)+thin*.43;
      float taper=smoothstep(0.,.09,u)*(1.-smoothstep(.79,1.,u));
      float cover=kind<.5?(.12+.32*view+.36*veins):
        (.019+.11*rim+.46*veins)*(.56+.44*grain);
      vec3 hue=mix(color,edge,clamp(.24*rim+veins*.84,0.,1.));
      gl_FragColor=vec4(hue,energy*taper*cover);
  `,{color:{value:color},edge:{value:edge},energy,time,kind:{value:kind}});
  const mesh=new T.Mesh(surface,material);
  mesh.frustumCulled=false;
  mesh.renderOrder=order;
  group.add(mesh);
  const center=vector(),normal=vector(),radialA=vector(),radialB=vector();
  const result={center,radialA,radialB,a:0,b:0};
  return {
    mesh,
    update(t,gain,sample) {
      mesh.visible=gain>.009;
      if(!mesh.visible) return;
      time.value=t;
      energy.value=gain;
      for(let row=0;row<=rows;row++){
        sample(result,row/rows);
        for(let col=0;col<=sides;col++){
          const angle=col*TAU/sides;
          const x=Math.cos(angle), y=Math.sin(angle);
          const i=row*(sides+1)+col;
          normal.copy(radialA).multiplyScalar(x).addScaledVector(radialB,y).normalize();
          points.setXYZ(i,center.x+radialA.x*x*result.a+radialB.x*y*result.b,
            center.y+radialA.y*x*result.a+radialB.y*y*result.b,
            center.z+radialA.z*x*result.a+radialB.z*y*result.b);
          normals.setXYZ(i,normal.x,normal.y,normal.z);
        }
      }
      points.needsUpdate=normals.needsUpdate=true;
    },
  };
}

export function makeWave(group, color, edge, {span=TAU, width=.065, loop=72,order=7}={}) {
  const geometry=new T.TorusGeometry(1,width,8,loop,span);
  const heat={value:0},time={value:0};
  const material=makeShader(noise+`
    uniform vec3 color,edge;
    uniform float heat,time;
    void main(){
      float core=pow(max(0.,abs(dot(normalize(cameraPosition-world),normalize(nrm)))),2.);
      float swirl=.45+.55*pow(.5+.5*sin(st.x*47.-time*17.+st.y*13.),3.);
      float grain=.63+.37*grit(world*10.+vec3(0,time*3.,0));
      vec3 tint=mix(color,edge,core*.82);
      gl_FragColor=vec4(tint,heat*(.19+.81*core)*grain*swirl);
  `,{color:{value:color},edge:{value:edge},heat,time});
  const mesh=new T.Mesh(geometry,material);
  mesh.renderOrder=order;
  group.add(mesh);
  return {
    mesh,
    update(t,gain) {
      mesh.visible=gain>.008;
      time.value=t;
      heat.value=gain;
    },
  };
}

export function makeGroundLight(group, color, radius) {
  const center={value:vector()}, age={value:0}, power={value:0}, ripple={value:0};
  const plane=new T.Mesh(new T.PlaneGeometry(radius*2,radius*2),makeShader(noise+`
    uniform vec3 center,color;
    uniform float age,power,ripple;
    void main(){
      vec2 p=world.xz-center.xz;
      float r=length(p), a=atan(p.y,p.x);
      float wet=smoothstep(.30,.76,grit(vec3(world.xz*vec2(8.,17.),.81)));
      float m=.43+.57*pow(.5+.5*cos(a*9.+age*3.+r*2.),2.);
      float body=exp(-r*r*.88)*(.15+wet*.51);
      float ring=exp(-14.*abs(r-ripple))*m*(.30+.7*wet)*smoothstep(.04,.46,ripple);
      float edge=(1.-smoothstep(.37,.5,max(abs(st.x-.5),abs(st.y-.5))))
        *step(-1.12,world.x)*(1.-step(5.70,world.x));
      gl_FragColor=vec4(color,power*(body+ring*.90)*edge);
  `,{center,age,power,ripple,color:{value:color}}));
  plane.rotation.x=-Math.PI/2;
  plane.renderOrder=4.2;
  group.add(plane);
  return (point,t,gain,spread=0)=>{
    plane.visible=gain>.009;
    if(!plane.visible) return;
    plane.position.set(point.x,.011,point.z);
    center.value.copy(point);
    age.value=t;
    power.value=gain;
    ripple.value=spread;
  };
}

export function makeMist(group, color, order=6) {
  const center={value:vector()}, shape={value:vector()},time={value:0},power={value:0};
  const mesh=new T.Mesh(new T.SphereGeometry(1,18,12),makeShader(noise+`
    uniform vec3 center,shape,color;
    uniform float time,power;
    void main(){
      vec3 eye=(cameraPosition-center)/shape;
      vec3 ray=normalize((world-cameraPosition)/shape);
      float b=dot(eye,ray);
      float h=sqrt(max(0.,b*b-dot(eye,eye)+1.));
      float first=max(0.,-b-h), len=max(0.,-b+h-first);
      float mass=0.,lit=0.;
      for(int k=0;k<9;k++){
        vec3 q=eye+ray*(first+(float(k)+.5)*len/9.);
        vec3 n=q*4.2+vec3(.8,time*1.55,-time*.82);
        float body=(1.-smoothstep(.17,.98,dot(q,q)))*smoothstep(.31,.77,grit(n)*.77+grit(n*2.1)*.23);
        mass+=body;
        lit+=body*exp(-length(q-vec3(.07,.29,-.12))*2.8);
      }
      vec3 tint=mix(vec3(.13,.17,.20),color,clamp(lit*.61*power,0.,1.));
      gl_FragColor=vec4(tint,clamp(mass*len*power*.17,0.,.58));
  `,{center,shape,time,power,color:{value:color}},
  {side:T.FrontSide,blending:T.NormalBlending}));
  mesh.renderOrder=order;
  group.add(mesh);
  return (point,size,t,gain)=>{
    mesh.visible=gain>.009;
    if(!mesh.visible) return;
    mesh.position.copy(point);
    mesh.scale.copy(size);
    center.value.copy(point);
    shape.value.copy(size);
    time.value=t;
    power.value=gain;
  };
}

export function makeShards(group,{count,color,hot=false}) {
  const geometry=new T.IcosahedronGeometry(1,0);
  const position=geometry.attributes.position;
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    const irregular=.8+.2*Math.sin(x*11.+z*13.+y*5.)**2;
    position.setXYZ(i,x*irregular,y*irregular,z*irregular);
  }
  geometry.computeVertexNormals();
  const material=hot?new T.MeshBasicMaterial({color:0xffffff,transparent:true,
    blending:T.AdditiveBlending,depthWrite:false}):
    new T.MeshStandardMaterial({color:0xffffff,roughness:.58,metalness:.46,flatShading:true,
      emissive:color,emissiveIntensity:.08});
  const mesh=new T.InstancedMesh(geometry,material,count);
  mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  mesh.renderOrder=hot?9:0;
  group.add(mesh);
  const chip=new T.Object3D(),tint=new T.Color();
  const seeds=Array.from({length:count},(_,i)=>({
    turn:hash(i*9+1)*TAU,speed:hash(i*9+2),lift:hash(i*9+3),length:hash(i*9+4),
    delay:hash(i*9+5),noise:hash(i*9+6),life:hash(i*9+7),
  }));
  return (active,positionAt)=>{
    mesh.visible=active;
    if(!active) return;
    for(let i=0;i<count;i++){
      chip.scale.setScalar(0);
      chip.rotation.set(0,0,0);
      tint.copy(color);
      positionAt(chip,tint,seeds[i],i);
      chip.updateMatrix();
      mesh.setMatrixAt(i,chip.matrix);
      mesh.setColorAt(i,tint);
    }
    mesh.instanceMatrix.needsUpdate=mesh.instanceColor.needsUpdate=true;
  };
}

export function ballistic(update, point, time, {speed=5,upward=2,radius=0,lifetime=.49,size=.025,shards=false}={}) {
  update(time>=0&&time<lifetime+.09,(chip,color,s,i)=>{
    const t=Math.max(0,time-s.delay*.075);
    const life=time>=s.delay*.075?(1.-ease(t,.09+lifetime*.24,lifetime*(.65+s.life*.35))):0;
    const direction=s.turn+.27*Math.sin(i);
    const stride=radius+speed*(.16+.84*s.speed)*t;
    chip.position.set(point.x+Math.cos(direction)*stride,
      Math.max(.023,point.y+t*(.15+upward*s.lift)-3.8*t*t),point.z+Math.sin(direction)*stride);
    const grain=(.38+s.noise*.78)*size*life;
    chip.scale.set(grain,grain*(shards?1.1+s.length*3.1:4.0+s.length*5.5),grain*.68);
    chip.rotation.set(t*(8.+i%5),i*.47,t*11.+s.turn);
    color.multiplyScalar(shards?.41+s.length*.76:life*(1.25+s.speed*.87));
  });
}
