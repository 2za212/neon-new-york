import * as T from 'three';

// The shell intersection gives a stable celestial position even in free flight.
// Each opening has a near lip, an inner aperture and an iris behind both.
export const riftShader = `
  uniform vec3 uRift;
  float saw(float x){return abs(fract(x)-.5)*2.;}
  vec3 wound(vec3 clouds,vec2 p,float id,float age){
    if(abs(p.x)>1.52||abs(p.y)>.94||age<=0.)return clouds;
    vec2 q=floor(p*160.+.5)/160.;
    float reach=smoothstep(0.,.35,age);
    float grain=.55*saw(q.x*3.1+id)+.24*saw(q.x*9.4-id)+.21*saw(q.x*18.2);
    float axis=q.y-(grain-.50)*(.14+abs(q.x)*.16);
    float tip=max(0.,1.-abs(q.x)/1.49);
    float extent=1.-smoothstep(reach*1.49-.06,reach*1.49,abs(q.x));
    float fork=abs(q.x)-.70;
    float twig=axis-sign(q.x)*(.48*fork+.067*(saw(7.*fork)-1.));
    float barb=smoothstep(0.,.12,fork)*(1.-smoothstep(.35,.63,fork));
    float seam=extent*tip*exp(-abs(axis)*51.);
    vec3 col=clouds+vec3(1.1,.045,.047)*(seam+extent*barb*.62*exp(-abs(twig)*68.));
    float opened=smoothstep(.24,1.48,age);
    float pulse=pow(max(0.,sin(age*3.45+id+.32*sin(age*1.63))),5.)*uRift.z;
    float lid=max(0.,1.-pow(abs(q.x),1.72))*(.49+.024*pulse)*opened;
    float edge=abs(axis)-lid;
    if(lid<.003||edge>.27)return col;
    // Offset apertures expose the near cut, its descending wall and a much
    // smaller rear opening. Only the rear opening can show the iris.
    float aa=clamp(fwidth(edge),.008,.045);
    float entrance=1.-smoothstep(-aa,aa,edge);
    col=mix(col,col*.38,.55*(1.-smoothstep(.02,.22,edge))*opened);
    float upper=step(0.,axis);
    vec3 cavity=vec3(.013,.0017,.007);
    float broken=.35+.65*smoothstep(.20,.74,grain+.16*sin(q.x*10.+id));
    float frontEdge=1.-smoothstep(.009,.048+aa,abs(edge));
    vec3 lip=vec3(.42,.020,.045)*broken*mix(.51,1.,upper);
    float lean=.09+.035*sin(id);
    vec2 rear=q-vec2(lean,-.035);
    float backWidth=max(0.,1.-pow(abs(rear.x)/.85,1.50));
    float backEdge=abs(rear.y-.036*sin(8.*rear.x+id))-.35*backWidth*opened;
    float inner=1.-smoothstep(-aa,aa,backEdge);
    float stratum=exp(-abs(edge+.103+.028*sin(7.*q.x+id))*39.);
    vec3 wall=cavity+vec3(.13,.007,.020)*stratum*broken*(.37+.63*(1.-upper));
    float cycle=age*(.93+.041*id)+id;
    vec2 dart=mix(vec2(hash(vec2(floor(cycle)-1.,id)),hash(vec2(id,floor(cycle)-1.))),
                  vec2(hash(vec2(floor(cycle),id)),hash(vec2(id,floor(cycle)))),
                  smoothstep(.04,.17,fract(cycle)))-.5;
    vec2 iris=(rear-vec2(.075*sin(id),.045)
                -dart*vec2(.29,.115)*uRift.z)/vec2(.35,.35);
    float r=length(iris), theta=atan(iris.y,iris.x+.00001);
    float pupil=length(iris/vec2(.29+.055*pulse,.68+.035*pulse));
    float fibres=.5+.5*sin(theta*41.+1.7*sin(theta*11.+id)+r*12.);
    float perimeter=1.-smoothstep(.78,1.,r);
    float occlusion=smoothstep(.005,.14,-backEdge);
    float pigment=smoothstep(.80,1.12,pupil)*perimeter;
    float ember=exp(-abs(pupil-1.21)*4.)*(.36+.64*fibres);
    vec3 irisGlow=vec3(.36,.008,.026)*(.30+.70*fibres)+vec3(.49,.026,.026)*ember;
    vec3 farSide=vec3(.007,.0009,.004)+vec3(.035,.001,.007)*exp(-3.*r)
                 +irisGlow*pigment*occlusion;
    farSide*=1.-.47*smoothstep(.04,.32,rear.y);
    return mix(col,mix(wall,farSide,inner),entrance)+lip*frontEdge;
  }

  // An independent fault grows from one end. The skew, shear and two fork
  // lengths vary per site; the dark cut persists after the hot tip passes.
  float faultLine(float x,float id){
    float k=x*8.,j=floor(k);
    float ledge=mix(hash(vec2(j,id)),hash(vec2(j+1.,id)),fract(k));
    return .20*(ledge-.5)+.065*sin(9.*x+id)+.022*(saw(17.*x+id)-.5);
  }
  vec3 faults(vec3 sky,vec3 d,float count,float rotation,float alt,float scale,float tier){
    float stepAz=6.2831853/count;
    float cell=floor((atan(d.x,-d.z+.000001)-rotation)/stepAz+.5);
    float id=mod(cell,count)+tier*9.;
    float az=cell*stepAz+rotation, el=alt+.075*sin(id*1.7);
    vec3 centre=vec3(sin(az)*cos(el),sin(el),-cos(az)*cos(el));
    vec3 right=vec3(cos(az),0.,sin(az));
    vec2 p=vec2(dot(d,right),dot(d,cross(right,centre)))/max(.2,dot(d,centre));
    float tilt=.32+.58*sin(id*2.1);
    p=mat2(cos(tilt),sin(tilt),-sin(tilt),cos(tilt))*p/scale;
    if(abs(p.x)>1.03||abs(p.y)>.63)return sky;
    float age=uRift.x-.17-.12*mod(id,5.);
    float travel=mix(-1.,1.05,smoothstep(0.,1.12,age));
    float spread=smoothstep(-.05,.04,travel-p.x)*smoothstep(.0,.09,age);
    float taper=1.-smoothstep(.70,1.,abs(p.x));
    float path=faultLine(p.x,id),sd=p.y-path;
    float w=taper*(.012+.031*hash(vec2(floor((p.x+1.)*7.),id)));
    float dist=abs(sd)-w;
    float g=p.x+.38, h=p.x-.17;
    float branchY=faultLine(-.38,id)+g*(.70+.16*sin(id))+.044*sin(g*23.);
    float smallerY=faultLine(.17,id)-h*.83+.022*sin(h*30.);
    float branch=(1.-smoothstep(.004,.018,abs(p.y-branchY)))*smoothstep(0.,.09,g)*(1.-smoothstep(.34,.63,g))
                +(1.-smoothstep(.003,.015,abs(p.y-smallerY)))*smoothstep(.0,.08,h)*(1.-smoothstep(.18,.41,h));
    float wall=spread*taper*(1.-smoothstep(-.003,.009,dist));
    sky=mix(sky,vec3(.009,.001,.006),wall*.94);
    float lead=1.+1.2*exp(-20.*abs(travel-p.x));
    vec3 fire=vec3(.72,.022,.050)*lead;
    sky+=fire*spread*taper*(exp(-85.*abs(sd+w))+.30*exp(-70.*abs(sd-w))+.46*branch);
    return sky+vec3(.10,.001,.007)*exp(-12.*abs(sd))*spread*taper;
  }
  vec3 riftLayer(vec3 color,vec3 dir,float count,float offset,float elevation,float size,float layer){
    float bearing=atan(dir.x,-dir.z+.000001);
    float pitch=6.2831853/count;
    float sector=floor((bearing-offset)/pitch+.5);
    float id=mod(sector,count)+layer*9.;
    float az=sector*pitch+offset+.055*sin(id*1.83);
    float el=elevation+.057*cos(id*2.21);
    vec3 centre=vec3(sin(az)*cos(el),sin(el),-cos(az)*cos(el));
    vec3 across=vec3(cos(az),0.,sin(az));
    vec3 up=cross(across,centre);
    vec2 p=vec2(dot(dir,across),dot(dir,up))/max(.1,dot(dir,centre));
    float tilt=.24*sin(id*.77);
    p=mat2(cos(tilt),sin(tilt),-sin(tilt),cos(tilt))*p/(size*(.90+.12*sin(id+1.)));
    return wound(color,p,id,uRift.x-.075*mod(id,5.)-.15*layer);
  }
  vec3 bloodSky(vec3 clouds,vec3 dir,float cloudMass){
    if(uRift.y<=0.||dir.y<0.)return clouds;
    vec3 origin=cameraPosition-vec3(10.,0.,-110.);
    float along=dot(origin,dir);
    float dist=sqrt(max(1.,along*along+5600.*5600.-dot(origin,origin)))-along;
    vec3 dome=normalize(origin+dir*dist);
    float h=dome.y, az=atan(dome.x,-dome.z+.000001);
    float veil=pow(.5+.5*cos(11.*az+2.4*sin(az*3.)+3.*h+.085*uRift.x*uRift.z),8.);
    vec3 sky=clouds*(.48+.39*cloudMass)+vec3(.082,.002,.014)*(.29+cloudMass);
    sky+=vec3(.18,.003,.018)*veil*smoothstep(.025,.33,h)*(1.-smoothstep(.53,.86,h))*(.18+.82*cloudMass);
    if(h>.14&&h<.72)sky=faults(sky,dome,5.,.22,.42,.30,0.);
    if(h>.56&&h<.98)sky=faults(sky,dome,7.,.37,.96,.19,1.);
    if(h>.39&&h<.82)sky=riftLayer(sky,dome,6.,.10,.66,.215,0.);
    if(h>.55&&h<.90)sky=riftLayer(sky,dome,8.,.49,.88,.113,1.);
    if(h>.71&&h<.98)sky=riftLayer(sky,dome,6.,-.18,1.11,.14,2.);
    if(h>.90)sky=riftLayer(sky,dome,4.,.81,1.34,.085,3.);
    return mix(clouds,sky,uRift.y*smoothstep(.0,.08,dir.y));
  }`;

function createRisingCinders(uniform){
  const cube=new T.BoxGeometry(1,1,1), geo=new T.InstancedBufferGeometry();
  geo.setIndex(cube.index);
  for(const key of ['position','normal'])geo.setAttribute(key,cube.getAttribute(key));
  const seeds=[];
  let seed=743;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<384;i++)seeds.push(random(),random(),random(),random());
  geo.setAttribute('seed',new T.InstancedBufferAttribute(new Float32Array(seeds),4));
  geo.instanceCount=seeds.length/4;
  const material=new T.ShaderMaterial({
    uniforms:{uRift:uniform}, vertexShader:`
      uniform vec3 uRift;attribute vec4 seed;varying vec3 vTint;
      void main(){
        vec3 span=vec3(42.,19.,42.);
        float t=uRift.x*(.36+.64*uRift.z),s=seed.w;
        vec3 drift=vec3(.28*t+1.23*sin(t*.57+s*67.),t*(.74+1.4*s),.78*cos(t*.47+s*46.));
        vec3 pos=cameraPosition+mod(seed.xyz*span+drift-cameraPosition+span*.5,span)-span*.5;
        vec3 relative=abs(pos-cameraPosition)/(.5*span);
        float border=1.-smoothstep(.76,1.,max(relative.x,max(relative.y,relative.z)));
        float size=border*smoothstep(.85,3.4,length(pos-cameraPosition))*uRift.y*
                   smoothstep(.44,2.,uRift.x)*(.032+.13*pow(s,4.));
        float a=t*(.6+s)+s*37.;
        vec3 shard=position*vec3(size,.8*size,2.6*size);
        shard.xy=mat2(cos(a),sin(a),-sin(a),cos(a))*shard.xy;
        shard.yz=mat2(cos(a*.7),sin(a*.7),-sin(a*.7),cos(a*.7))*shard.yz;
        float hot=step(.66,s)*(.32+.68*max(normal.z,0.));
        vTint=mix(vec3(.15,.029,.045),vec3(1.90,.165,.065),hot);
        gl_Position=projectionMatrix*viewMatrix*vec4(pos+shard,1.);
      }`,
    fragmentShader:`varying vec3 vTint;void main(){gl_FragColor=vec4(vTint,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  });
  const mesh=new T.Mesh(geo,material);
  mesh.name='天裂 / 逆升余烬';mesh.frustumCulled=false;mesh.visible=false;mesh.userData.excludeFromAO=true;
  return mesh;
}

export function createBloodRift(uniform,lighting,scene){
  const cinders=createRisingCinders(uniform);scene.add(cinders);
  const buttons=document.querySelectorAll('.rift-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=false,age=0,opacity=0;
  for(const button of buttons)button.onclick=()=>{
    if(!active&&opacity===0)age=0;
    active=!active;
    for(const control of buttons)control.setAttribute('aria-pressed',String(active));
  };
  return function update(dt){
    if(!active&&opacity===0)return;
    age+=dt;
    opacity=T.MathUtils.clamp(opacity+(active?5:-1.9)*dt,0,1);
    const motion=reduced.matches ? .14 : 1;
    uniform.value.set(age,opacity,motion);
    cinders.visible=opacity>0&&age>.44;
    const pulse=1+.065*motion*Math.sin(age*2.2);
    lighting.setRift(opacity*T.MathUtils.smoothstep(age,.16,1.48)*pulse);
  };
}
