import * as T from 'three';
import {campaigns} from './nyc-projector-campaigns.js';

const pitch=.16;
function sample(id,x,y,z){
  const a=Math.abs(x),b=Math.abs(z),r=x*x+z*z;
  switch(id){
    case 'spool':{
      if(y===-5||y===5)return r<=29&&r>=3?2:0;
      if(Math.abs(y)<5&&r>=3&&r<=(y%2===0?18:14))return Math.abs((x+y+z)%5)===1?2:1;
      return 0;
    }
    case 'bowl':
      if(y>=-4&&y<=1){const radius=4+y+4;return r<=radius*radius*.48&&r>=(radius-1.7)**2*.48?(y===1?2:1):0;}
      return y>1&&y<=6&&z===0&&(x===-2+(y>>1)%2||x===2-(y>>1)%2)?2:0;
    case 'ship':
      if(y>=-3&&y<=-1&&a<=7+y+1&&b<=Math.min(y+5,7-a))return y===-1?2:1;
      if(y>=0&&y<=2&&x>=-3&&x<=2&&b<=2)return y===1&&b===2&&x%2===0?0:1;
      return (y===3&&x>=-4&&x<=3&&b<=2)||(y>3&&y<6&&x===-2&&z===0)?2:0;
    case 'leaf':
      if(y<=-2&&y>=-5&&r<=(y===-2?15:9))return y===-2?2:1;
      if(y>=-1&&y<=4&&x===0&&b===0)return 2;
      return (x>=0&&(x-3)**2+(y-x+1)**2+z*z*2<=8)||(x<0&&(x+3)**2+(y+x+1)**2+(z+1)**2*2<=6)?1:0;
    case 'atom':{
      if(r+y*y<=4)return 2;
      const radius=Math.sqrt(r+y*y);
      return radius>=5&&radius<6.2&&(Math.abs(z)<.7||Math.abs(x*.82+y*.48+z*.30)<.55||Math.abs(x*.82-y*.48-z*.30)<.55)?1:0;
    }
    case 'capsule':{
      const h=y-Math.max(-3,Math.min(3,y));
      if(r+h*h>10)return 0;
      return y===0||y>=3?2:1;
    }
    case 'tower':
      if(y===-5&&a<=5&&b<=4)return 2;
      if(y>=-4&&((x>=-4&&x<=-1&&b<=2&&y<=3)||(x>=1&&x<=3&&b<=3&&y<=6)||(a<=1&&b<=1&&y<=1)))return y%3===0?2:1;
      return 0;
    case 'cargo':
      return a<=4&&b<=4&&Math.abs(y)<=4&&(a===4||b===4||Math.abs(y)===4)?
        ((a===4&&b===4)||((a===4||b===4)&&Math.abs(y)===4)||x===0?2:1):0;
  }
  return 0;
}
// Emit only exposed cube faces. Each campaign's geometry is shared by all of
// its projectors. Face-local coordinates give neighbouring cells a narrow seam.
function volume(id){
  const vertices=[],normals=[],uv=[],tones=[],indices=[];
  for(let x=-8;x<=8;x++)for(let y=-6;y<=6;y++)for(let z=-6;z<=6;z++){
    const tone=sample(id,x,y,z);
    if(!tone)continue;
    for(const [n,u,v] of faces){
      if(sample(id,x+n[0],y+n[1],z+n[2]))continue;
      const base=tones.length;
      for(const [s,t] of [[0,0],[1,0],[1,1],[0,1]]){
        for(let k=0;k<3;k++)vertices.push(([x,y,z][k]+n[k]*.5+(s-.5)*u[k]+(t-.5)*v[k])*pitch);
        normals.push(...n);uv.push(s,t);tones.push(tone);
      }
      indices.push(base,base+1,base+2,base,base+2,base+3);
    }
  }
  const geo=new T.BufferGeometry();
  for(const [name,data,size] of [['position',vertices,3],['normal',normals,3],['uv',uv,2],['tone',tones,1]])
    geo.setAttribute(name,new T.Float32BufferAttribute(data,size));
  geo.setIndex(indices);geo.computeBoundingSphere();return geo;
}
const faces=[
  [[1,0,0],[0,0,-1],[0,1,0]],[[-1,0,0],[0,0,1],[0,1,0]],
  [[0,1,0],[1,0,0],[0,0,-1]],[[0,-1,0],[1,0,0],[0,0,1]],
  [[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[-1,0,0],[0,1,0]]
];
function lightVolume(accent,clock){
  return new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{accent:{value:new T.Color(accent)},clock},
    vertexShader:`attribute float tone;varying vec2 cell;varying vec3 N,V;varying float band,height;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);N=normalMatrix*normal;V=-mv.xyz;
      cell=uv;band=tone;height=position.y;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform vec3 accent;uniform float clock;varying vec2 cell;varying vec3 N,V;varying float band,height;
      void main(){vec2 edge=min(cell,1.-cell);float seam=smoothstep(0.,max(.065,fwidth(cell.x)*1.3),min(edge.x,edge.y));
      float sweep=1.-smoothstep(.025,.13,abs(fract(height*.41-clock*.24)-.5));
      vec3 normalV=normalize(N);float side=.48+.32*max(normalV.y,0.)+.18*max(normalV.x,0.);
      float rim=pow(1.-abs(dot(normalV,normalize(V))),2.);
      vec3 light=mix(accent*accent,vec3(.93,1.,1.),.35*(band-1.)+.40*sweep+.18*rim);
      gl_FragColor=vec4(light*(side+.25*sweep)*mix(.68,1.,seam),.65+.17*rim+.12*sweep);
      #include <colorspace_fragment>
      }`});
}
export function streetProjectors(scene,clock){
  const rigs=[],models=new Map();
  return {mount(site,point,box,tube){
    const id=site.campaign,scale=site.projectorScale;
    const u=-site.width*.26,ledge=site.height/2+.08,reach=.88*scale;
    box(0x334650,u,ledge,-.04+reach/2,.48*scale,.16,reach+.18);
    box(0x627986,u,ledge+.10,reach,.96*scale,.16,.96*scale);
    for(const side of [-1,1]){
      tube(u+side*.34*scale,ledge+.20,reach,.10*scale,.06,.70*scale);
      tube(u,ledge+.20,reach+side*.34*scale,.56*scale,.06,.10*scale);
      tube(u+side*.23*scale,ledge+.14,reach+.49*scale,.24*scale,.065,.04);
    }
    if(!models.has(id))models.set(id,[volume(id),lightVolume(campaigns[id][4],clock)]);
    const mesh=new T.Mesh(...models.get(id));
    mesh.name=site.owner+' · '+campaigns[id][0]+' 全息投影';
    mesh.position.fromArray(point(u,ledge+.23+1.32*scale,reach));
    mesh.scale.setScalar(scale);scene.add(mesh);
    rigs.push({mesh,y:mesh.position.y,phase:Math.abs(site.x*.31+site.z*.17),scale});
  },update(time){
    for(const {mesh,y,phase,scale} of rigs){
      mesh.rotation.y=phase+time*.46;mesh.position.y=y+Math.sin(time*1.4+phase)*.08*scale;
    }
  },get count(){return rigs.length;}};
}
