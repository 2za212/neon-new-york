import * as T from 'three';

// Shared time and world-space coordinates keep the intake, basin and race
// continuous. Reflections sample the stationary lamp rows and sluice wall.
export function addSewerWater(scene, stretches, spills) {
  const time={value:0},level=-.22;
  const hashNoise=`
    float hash(vec2 i){return fract(sin(dot(i,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
                 mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
    }`;
  const water=new T.ShaderMaterial({
    uniforms:{time,impacts:{value:spills.map(s=>new T.Vector4(s.x+s.dx,s.z+s.dz,s.width,s.dx!==0?1:0))}},
    vertexShader:`varying vec3 w;void main(){w=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
    fragmentShader:`varying vec3 w;uniform float time;uniform vec4 impacts[${spills.length}];
      ${hashNoise}
      void main(){
        bool crossGallery=w.x>22.&&w.z< -48.;
        vec2 p=crossGallery?w.zx:w.xz,t=vec2(0.,time*.90);
        float swell=sin(p.y*5.-time*3.+2.2*noise(p*.86-t*.31)+p.x*1.4);
        float chop=noise(p*vec2(3.,9.)-t*4.);
        vec3 n=normalize(vec3(.16*(noise(p*2.-t)-.5)+.052*sin(p.x*4.+swell),1.,.085*swell+.09*(chop-.5)));
        if(crossGallery)n=n.zyx;
        vec3 eye=normalize(cameraPosition-w),r=reflect(-eye,n);
        float grazing=pow(1.-clamp(dot(n,eye),0.,1.),2.);
        float silt=noise(p*vec2(.85,.39)-t*.18);
        vec3 col=mix(vec3(.007,.028,.026),vec3(.063,.086,.041),silt);
        col+=grazing*vec3(.015,.056,.063);
        vec2 hit=w.xz+r.xz*(2.29/max(r.y,.09));
        float lampX=hit.y>4.?2.49:6.06;
        float lobe=exp(-1.2*abs(abs(hit.x)-lampX))*
           exp(-.9*abs(mod(hit.y+13.,4.)-2.));
        if(crossGallery)lobe=exp(-abs(hit.y+52.43))*exp(-abs(mod(hit.x+2.,4.)-2.));
        else if(w.z< -48.)lobe=exp(-abs(hit.y+65.5)*.55)*exp(-abs(mod(hit.x+6.,6.)-3.)*.75);
        col+=lobe*(hit.y>4.?vec3(1.10,.63,.19):vec3(.16,.58,.52))*(.32+.68*chop);
        vec3 back=w+r*max(0.,(-13.52-w.z)/min(-.01,r.z));
        float sluice=r.z<0.?exp(-abs(back.y-2.)*.77)*exp(-abs(back.x+1.)*.55):0.;
        col+=sluice*vec3(.10,.24,.21);
        float wake=0.;
        for(int i=0;i<${spills.length};i++){
          vec4 source=impacts[i];vec2 delta=w.xz-source.xy;
          vec2 local=source.w>.5?delta.yx:delta;
          float d=length(vec2(max(abs(local.x)-source.z*.34,0.),local.y));
          float rings=smoothstep(.54,.96,sin(d*14.-time*5.+chop*1.4));
          wake=max(wake,exp(-d*1.16)*(.42+.58*rings));
        }
        col=mix(col,vec3(.43,.55,.44),clamp(wake*(.42+.9*chop),0.,.9));
        float trail=noise(vec2(p.x*3.,p.y*1.4-time*1.2))+.21*swell;
        col+=vec3(.11,.23,.18)*smoothstep(.87,1.11,trail);
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const positions=[];
  for(const [left,right,near,far] of stretches){
    positions.push(left,level,near,left,level,far,right,level,far,
      left,level,near,right,level,far,right,level,near);
  }
  const surface=new T.BufferGeometry();surface.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  const pool=new T.Mesh(surface,water);pool.name='明渠与集水池';scene.add(pool);

  // Curved sheets have a horizontal lip, accelerated vertical fall and a
  // ragged contact edge. All outlets share one mesh and one flow clock.
  const sheets=[],uv=[],indices=[];
  for(const {x,y,z,dx,dz,width} of spills){
    const start=sheets.length/3,run=Math.hypot(dx,dz);
    for(let j=0;j<=12;j++)for(let i=0;i<=10;i++){
      const v=j/12,u=i/10-.5;
      const across=u*width*(1.-.12*v+.06*v*v);
      sheets.push(x+dx*v+dz/run*across,y+(level-y)*v*v+.025*Math.sin(i*1.36)*v,z+dz*v-dx/run*across);
      uv.push(u*width,v);
      if(i<10&&j<12){const a=start+j*11+i;indices.push(a,a+11,a+1,a+1,a+11,a+12);}
    }
  }
  const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(sheets,3));
  geom.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geom.setIndex(indices);
  const film=new T.ShaderMaterial({uniforms:{time},side:T.DoubleSide,
    vertexShader:`varying vec2 flow;void main(){flow=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 flow;uniform float time;${hashNoise}
      void main(){float streak=noise(vec2(flow.x*13.,flow.y*3.-time*2.4));
        float crest=noise(vec2(flow.x*4.,flow.y*19.-time*7.));
        vec3 c=mix(vec3(.020,.083,.076),vec3(.39,.56,.48),streak*streak);
        c+=vec3(.25,.37,.31)*smoothstep(.68,.92,crest)*(.35+.65*flow.y);
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  scene.add(new T.Mesh(geom,film));
  return dt=>{time.value+=dt;};
}
