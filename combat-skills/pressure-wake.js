import * as T from 'three';
const zAxis=new T.Vector3(0,0,1),axis=new T.Vector3(),floorAxis=new T.Vector3();
const finish='\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}';
const noise=
'float r2(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+43.11);return fract(p.x*p.y);}'+
'float n2(vec2 u){vec2 p=floor(u),f=fract(u);f=f*f*(3.-2.*f);return mix(mix(r2(p),r2(p+vec2(1,0)),f.x),mix(r2(p+vec2(0,1)),r2(p+1.),f.x),f.y);}';
export function createPressureWake(group){
  const phase={value:0},front={value:0},surge={value:0},clock={phase,front,surge};
  const g=new T.PlaneGeometry(1,1,96,28);
  const streams=[.12,1.63].map((a,i)=>{
    const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
      uniforms:{...clock,ang:{value:a},opacity:{value:i===0?1.0:.62}},
      vertexShader:'uniform float phase,ang;varying vec2 q;void main(){q=uv;float s=q.x,v=q.y*2.-1.;'+
        'float gain=(.104+.72*pow(s,.84))*(.91+.057*sin(s*40.-phase*20.));'+
        'float twist=ang+.21*sin(s*7.+phase*12.)-.28*s;vec3 p=vec3(v*gain*cos(twist),v*gain*sin(twist)-.18*s*s+.045*sin(s*22.),s);'+
        'p.xy+=vec2(sin(s*21.-phase*30.),sin(s*18.+phase*13.))*.048*s*abs(v);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader:'uniform float phase,front,surge,opacity;varying vec2 q;'+noise+
        'void main(){float s=q.x,u=q.y*2.-1.;vec2 at=vec2(s*11.-phase*40.,u*3.6);'+
        'float flow=n2(at),turb=n2(at*vec2(1.32,4.9)+vec2(0,phase*4.));'+
        'float tip=max(.012,front);float cutoff=1.-smoothstep(tip-.045,tip+.042,s);'+
        'float quiet=smoothstep(-.055,.105,s)*(1.-smoothstep(.924,1.,s));'+
        'float body=exp(-4.1*u*u)*smoothstep(.11,.86,flow*.54+turb*.46);'+
        'float edgeWobble=.51+.12*sin(s*23.+phase*20.)+(flow-.5)*.22;'+
        'float banks=exp(-57.*abs(u-edgeWobble))+.65*exp(-60.*abs(u+edgeWobble+.16));'+
        'float inner=pow(.5+.5*cos(u*14.+s*7.+flow*1.8+phase*11.),16.)*exp(-2.7*u*u);'+
        'float ash=smoothstep(.78,.96,n2(vec2(s*66.-phase*75.,u*43.)))*.20*body;'+
        'float envelopes=cutoff*quiet*surge*(1.-smoothstep(.71,1.,abs(u)));'+
        'float glow=(.93*body+.79*banks+.49*inner+ash);'+
        'vec3 col=vec3(.016,.37,.83)*(.24+1.77*body)+vec3(.43,1.36,1.96)*(banks*.86+inner*.87+ash)+vec3(.08,.62,.94)*exp(-8.0*u*u)*(.22+.78*flow);'+
        'gl_FragColor=vec4(col,clamp(envelopes*opacity*glow,0.,.81));'+finish
    });
    const m=new T.Mesh(g,mat);m.frustumCulled=false;m.renderOrder=8+i*.01;group.add(m);return m;
  });
  const deck=new T.Mesh(g,new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:clock,
    vertexShader:'varying vec2 q;void main(){q=uv;float s=q.x,v=q.y*2.-1.;'+
      'vec3 p=vec3(v*(.19+1.16*s),.031,s-.13*v*v*s);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
    fragmentShader:'uniform float phase,front,surge;varying vec2 q;'+noise+
    'void main(){float s=q.x,v=q.y*2.-1.;float noise=n2(vec2(s*22.-phase*20.,v*16.));'+
      'float s1=front-.055-.31*v*v+.018*sin(v*41.+phase*12.)+.019*noise;'+
      'float s2=front-.194-.28*v*v+.022*sin(v*26.+phase*12.);'+
      'float width=exp(-53.*abs(s-s1))+.63*exp(-51.*abs(s-s2));'+
      'float gloss=exp(-18.*abs(s-s1))*(.37+.46*noise);'+
      'float trails=exp(-4.8*abs(v+sin(s*18.)*.095))*(.42+.58*noise);'+
      'float mask=surge*smoothstep(.06,.32,s)*(1.-smoothstep(.75,1.,abs(v)))*(1.-smoothstep(.87,1.,s));'+
      'vec3 col=vec3(.11,.35,.50)*gloss+vec3(.50,1.1,1.32)*(.8*width);'+
      'gl_FragColor=vec4(col,mask*min(.8,width*.92+gloss*.23+trails*.13));'+finish
  }));
  deck.frustumCulled=false;deck.renderOrder=6.5;group.add(deck);
  function update(t,start,end,feet){
    const on=t>-.159&&t<.34;
    for(const m of streams)m.visible=on;
    deck.visible=on;
    if(!on)return;
    phase.value=t;
    front.value=t<0?T.MathUtils.smoothstep(t,-.167,-.017)*.965:Math.min(1.24,.97+.81*t);
    surge.value=T.MathUtils.smoothstep(t,-.161,-.105)*(1.-T.MathUtils.smoothstep(t,.068,.28));
    axis.copy(end).sub(start);
    const length=axis.length();axis.normalize();
    for(const m of streams){
      m.position.copy(start).addScaledVector(axis,.085);m.quaternion.setFromUnitVectors(zAxis,axis);
      m.scale.set(1,1,Math.max(.02,length-.085));
    }
    deck.position.copy(feet);deck.position.y=0;
    floorAxis.copy(end).sub(feet);floorAxis.y=0;
    const floorLength=floorAxis.length();floorAxis.normalize();
    deck.quaternion.setFromUnitVectors(zAxis,floorAxis);deck.scale.set(1,1,floorLength);
  }
  return {update};
}
