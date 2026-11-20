import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const painted=new T.MeshLambertMaterial({vertexColors:true});
const cellCoating=`
  vec3 f=fract(coachCell),rate=fwidth(coachCell);
  vec3 cell=floor(coachCell+.0001);
  float pigment=fract(dot(mod(cell,vec3(11.,17.,13.)),vec3(.321,.547,.276)));
  vec3 edge=mix(vec3(1.),smoothstep(vec3(.0),rate+.035,min(f,1.-f)),step(vec3(.0001),rate));
  float seam=1.-min(edge.x,min(edge.y,edge.z));
  float cellFade=1.-smoothstep(.15,.65,max(rate.x,max(rate.y,rate.z)));
  diffuseColor.rgb*=1.+castPanel*cellFade*((pigment-.5)*.24-.09*seam);`;
// Negative U marks the cast body panels. Sample paint in vehicle space so
// the small differing block ends move and turn with the vehicle.
painted.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 coachCell; varying float castPanel;\n'+shader.vertexShader
    .replace('#include <begin_vertex>','#include <begin_vertex>\n coachCell=position/.16;castPanel=step(uv.x,-.5);');
  shader.fragmentShader='varying vec3 coachCell; varying float castPanel;\n'+shader.fragmentShader
    .replace('#include <color_fragment>','#include <color_fragment>\n'+cellCoating);
};
painted.customProgramCacheKey=()=>'night-traffic-cast-panels-v1';
export function coatParkedBlockPaint(material){
  const wet=material.onBeforeCompile;
  material.onBeforeCompile=function(shader,renderer){
    wet.call(this,shader,renderer);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n {vec3 coachCell=vWetVehiclePosition/.16; float castPanel=1.;'+cellCoating+'}');
  };
  material.customProgramCacheKey=()=>'nyc-parked-wet-cast-panels-v1';
}
const lights=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
const rubber=0x171e25, wheel=0x879293, windowBlue=0x2d515e, windowShade=0x192c36;

// Only lit road surface goes into the draw. The light fades to zero at
// the footprint perimeter and the projection follows the moving chassis.
function roadLight(brakes){
  const position=[],uv=[],rear=[],indices=[];
  function quad(x,near,far,start,end,isRear){
    const i=position.length/3;
    for(const [side,t] of [[-1,0],[1,0],[1,1],[-1,1]]){
      position.push(x+side*(t?end:start),.024,t?far:near);uv.push(side,t);rear.push(isRear);
    }
    indices.push(i,i+1,i+2,i,i+2,i+3);
  }
  for(const x of [-.67,.67]){quad(x,2.08,8.4,.28,1.61,0);quad(x,-2.04,-4.15,.16,.43,1);}
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(position,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setAttribute('rear',new T.Float32BufferAttribute(rear,1));g.setIndex(indices);
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
    blending:T.AdditiveBlending,uniforms:{brake:brakes},
    vertexShader:`attribute float rear; varying float red; varying vec2 beam;
      void main(){red=rear;beam=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float brake; varying float red; varying vec2 beam;
      void main(){
        float sides=1.-smoothstep(.08,1.,abs(beam.x));
        float length=smoothstep(0.,.09,beam.y)*(1.-smoothstep(.08,1.,beam.y));
        vec3 tint=mix(vec3(.46,.65,.68),vec3(.89,.075,.055),red);
        float strength=mix(.26,.11+.30*brake,red);
        gl_FragColor=vec4(tint,sides*length*strength);
        #include <colorspace_fragment>
      }`});
  const mesh=new T.Mesh(g,mat);mesh.renderOrder=3;return mesh;
}

function box(parts,color,x,y,z,w,h,d){
    const g=new T.BoxGeometry(w,h,d).translate(x,y,z),c=new T.Color(color),a=[];
    for(let i=0;i<g.attributes.position.count;i++)a.push(c.r,c.g,c.b);
    g.setAttribute('color',new T.Float32BufferAttribute(a,3));parts.push(g);
}

// Cast panels consist of longitudinal courses, each one block deep. Long
// coplanar runs share a polygon. Only exposed shoulders and ends survive the
// mesh build, including the inside shoulders of the sliding door sockets.
export function coachwork(parts,style,paint,x,y,z,w,h,d,stripe=paint,emit=null){
  const rows=Math.max(1,Math.round(h/.16)),cols=Math.max(2,Math.round(d/.16));
  const dz=d/cols,dy=h/rows,key=Math.min(.16,w*.16),half=w/2;
  const ys=r=>y-h/2+r*dy,zs=j=>z-d/2+j*dz;
  const widths=Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,j)=>{
    const end=Math.min(j,cols-j-1);
    let inset=end===0?1:0;
    if(style==='bonnet'||style==='chassis'){
      if(j===cols-1||r===0&&end===1)inset++;
      if(r===rows-1&&(j===Math.floor(cols*.29)||j===Math.floor(cols*.68)))inset++;
    }else if(style==='body'){
      if(r===rows-1&&end<2)inset++;
      if((j===Math.floor(cols*.32)||j===Math.floor(cols*.76))&&r>0&&r<rows-1)inset++;
      if(r===0&&j%5===2)inset++;
    }else if(r===rows-1&&end<2)inset++;
    return half-Math.min(half*.56,key*inset);
  }));
  const pos=[],normal=[],color=[],uv=[],indices=[],base=new T.Color(paint),band=new T.Color(stripe);
  function face(axis,sign,k,a,b,c,e,ink,shade=1){
    if(b-a<.0001||e-c<.0001)return;
    const start=pos.length/3,u=(axis+1)%3,v=(axis+2)%3,p=[0,0,0],n=[0,0,0];
    p[axis]=k;n[axis]=sign;
    const points=emit?[]:null;
    for(let q=0;q<4;q++){
      p[u]=q===1||q===2?b:a;p[v]=q>1?e:c;
      if(emit)points.push([...p]);
      else{pos.push(...p);normal.push(...n);color.push(ink.r*shade,ink.g*shade,ink.b*shade);uv.push(-1,-1);}
    }
    if(emit){emit(sign>0?points:points.reverse(),ink.clone().multiplyScalar(shade).getHex());return;}
    if(sign>0)indices.push(start,start+1,start+2,start,start+2,start+3);
    else indices.push(start,start+2,start+1,start,start+3,start+2);
  }
  for(let r=0;r<rows;r++){
    const level=widths[r],yl=ys(r),yh=ys(r+1);
    const ink=style==='body'&&rows>3&&r===Math.floor(rows*.57)?band:base;
    for(let j=0;j<cols;){
      let end=j+1;
      while(end<cols&&level[end]===level[j])end++;
      for(const side of [-1,1])face(0,side,x+side*level[j],yl,yh,zs(j),zs(end),ink,level[j]<half?.84:1);
      j=end;
    }
    // At a return in plan, only the portion beyond the next course is visible.
    for(const side of [-1,1]){
      for(let j=0;j<cols;j++){
        const next=level[j+side]??0;
        if(level[j]<=next)continue;
        const at=zs(j+(side>0?1:0));
        if(!next)face(2,side,at,x-level[j],x+level[j],yl,yh,ink);
        else for(const hand of [-1,1]){
          const a=x+hand*next,b=x+hand*level[j];
          face(2,side,at,Math.min(a,b),Math.max(a,b),yl,yh,ink,.79);
        }
      }
      const neighbor=widths[r+side],at=side>0?yh:yl;
      for(let j=0;j<cols;){
        const inner=neighbor?.[j]??0,outer=level[j];
        let end=j+1;
        while(end<cols&&level[end]===outer&&(neighbor?.[end]??0)===inner)end++;
        if(outer>inner){
          if(!inner)face(1,side,at,zs(j),zs(end),x-outer,x+outer,base);
          else for(const hand of [-1,1]){
            const a=x+hand*inner,b=x+hand*outer;
            face(1,side,at,zs(j),zs(end),Math.min(a,b),Math.max(a,b),base,.88);
          }
        }
        j=end;
      }
    }
  }
  if(emit)return;
  const g=new T.BufferGeometry();
  for(const [name,data,n] of [['position',pos,3],['normal',normal,3],['color',color,3],['uv',uv,2]])
    g.setAttribute(name,new T.Float32BufferAttribute(data,n));
  g.setIndex(indices);parts.push(g);
}

function mergeParts(parts,material,parent){
  const geometry=mergeGeometries(parts);
  for(const part of parts)part.dispose();
  const mesh=new T.Mesh(geometry,material);mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function warehouseLift(paint,accent){
  const root=new T.Group(),body=[],lamps=[],forks=[],pallet=[];
  const B=(color,...p)=>box(body,color,...p);
  B(rubber,0,.32,-.12,1.20,.3,1.63);coachwork(body,'body',paint,0,.55,-.47,1.24,.40,.97);
  B(accent,0,.76,-.67,1.17,.12,.57); B(0x2b3d42,0,.67,-.12,.66,.12,.42);
  B(0x28383b,0,.85,-.35,.67,.37,.12); B(0x425258,0,.77,.24,.45,.46,.14);
  B(0x675149,0,1.02,-.06,.40,.37,.26); B(0xa48368,0,1.31,-.04,.25,.26,.22);
  B(0xddaf63,0,1.48,-.04,.32,.11,.30);
  for(const side of [-1,1]){
    for(const z of [-.69,.42]){
      B(0x415459,side*.54,1.25,z,.09,1.22,.09);
      B(rubber,side*.62,.32,z,.23,.48,.39);B(rubber,side*.62,.32,z,.23,.31,.57);
      B(0x899496,side*.744,.32,z,.025,.20,.22);
    }
    B(0x364650,side*.44,1.22,.89,.12,2.03,.17);
    box(lamps,0xf2ad60,side*.629,.66,-.45,.024,.075,.51);
    box(forks,0x758b92,side*.37,.04,1.41,.11,.09,.90);
    box(forks,0x809294,side*.37,.41,.97,.11,.72,.13);
    box(lamps,0xd8eee0,side*.48,1.86,.42,.18,.12,.09);
    box(lamps,0xeb6853,side*.47,.60,-.982,.20,.08,.04);
    box(pallet,0x8c7051,side*.32,.11,0,.16,.16,.71);
  }
  coachwork(body,'bonnet',accent,0,1.91,-.14,1.31,.12,1.37); B(0xbc864b,.32,2.04,-.61,.17,.17,.19);
  B(0x697c81,0,2.20,.89,.97,.12,.17);
  box(pallet,0xb08c62,0,.21,0,.95,.09,.82);box(pallet,0x516f73,0,.46,0,.84,.43,.71);
  for(const x of [-.27,.27])box(pallet,accent,x,.70,0,.075,.045,.73);
  mergeParts(body,painted,root);mergeParts(lamps,lights,root);
  const workBeam=roadLight({value:.08});workBeam.scale.set(.66,1,.72);root.add(workBeam);
  const fork=mergeParts(forks,painted,root),cargo=mergeParts(pallet,painted,root);
  cargo.position.z=1.43;
  const workLight=new T.PointLight(0xffdc9e,23,7.5,2);
  workLight.name='叉车顶架 / 作业灯';workLight.castShadow=false;workLight.userData.mobileEmitter=true;
  return {root,height:2.28,cargo,workLight,setLights(){},setFork(height,carrying){
    fork.position.y=height;
    if(carrying)cargo.position.y=height;
  }};
}

export function makeNightVehicle(kind,paint,stripe){
  if(kind==='forklift')return warehouseLift(paint,stripe);
  const root=new T.Group(),body=[],lamp=[],red=[],slidingDoor=[];
  const van=kind==='delivery',taxi=kind==='taxi',service=kind==='service';
  const shuttle=kind==='shuttle',freight=kind==='flatbed';
  const brakes={value:0},signal={value:0},flash={value:0};
  const B=(color,...p)=>box(body,color,...p),L=(color,...p)=>box(lamp,color,...p);
  B(rubber,0,.39,-.04,1.48,.32,3.89);coachwork(body,'chassis',paint,0,.70,0,1.66,.42,4.10);
  // The nose and tail step in at the corners, with separate bumper shoulders.
  coachwork(body,'bonnet',paint,0,.90,.13,1.65,.15,3.53);
  coachwork(body,'bonnet',paint,0,1.015,1.18,1.59,.15,.98);
  B(0x3b5059,0,.57,2.03,1.40,.17,.17);
  B(0x27363f,0,.75,2.065,.61,.17,.12);
  B(0xd5cc9a,0,.62,-2.097,.41,.13,.036);
  for(const side of [-1,1]){
    for(const latch of [-1,1]){
      coachwork(body,'body',paint,side*.85,.67,.01+latch*.43,.13,.49,.85);
      B(stripe,side*.908,.81,.04+latch*.43,.042,.085,.68);
    }
    B(0x364751,side*.83,.90,.40,.082,.10,.028);
    B(wheel,side*.89,.96,-.20,.048,.055,.23);
    B(rubber,side*.98,1.15,.53,.22,.13,.22);
    B(paint,side*.99,1.18,.53,.22,.08,.24);
    L(0xcbfaf4,side*.65,.89,2.050,.39,.10,.085);
    box(red,0xff513a,side*.65,.87,-2.066,.40,.10,.11);
    for(const end of [-1,1])box(red,0xffac54,side*.865,.89,end*2.045,.095,.11,.10);
    for(const axle of [-1.31,1.29]){
      for(let row=-2;row<=2;row++){
        const d=[.38,.63,.73,.63,.38][row+2];
        B(rubber,side*.87,.39+row*.144,axle,.22,.145,d);
      }
      B(wheel,side*.983,.39,axle,.032,.27,.35);
      B(wheel,side*.983,.39,axle,.032,.36,.20);
      B(0x42535a,side*1.003,.39,axle,.018,.12,.13);
      B(paint,side*.86,.82,axle,.19,.12,1.04);
    }
  }
  if(shuttle){
    // Four-metres of low-floor passenger space and a broad glazed front.
    coachwork(body,'body',paint,0,1.07,-.14,1.75,.39,3.64);
    B(0x2d4954,0,1.53,-.20,1.69,.60,3.27);
    B(windowBlue,0,1.48,1.47,1.54,.63,.22);
    B(paint,0,1.91,-.21,1.79,.17,3.45);B(paint,0,2.045,-.29,1.57,.10,3.20);
    for(const side of [-1,1]){
      for(const z of [-1.45,-.72,.08,.87,1.34]){
        if(side===1&&z===.87)continue;
        B(paint,side*.856,1.51,z,.10,.64,.079);
      }
      B(stripe,side*.893,1.08,-.2,.035,.14,3.53);
      B(0x253943,side*.885,1.77,-.88,.038,.21,1.04);
      for(let k=0;k<4;k++)L(0xabddc9,side*.908,1.77,-1.18+.19*k,.02,.055,.13);
    }
    B(0x26363a,.853,.89,.85,.10,.56,.89);
    box(slidingDoor,0x446269,.91,1.19,.82,.055,1.00,.83);
    box(slidingDoor,0x668993,.942,1.47,.82,.019,.40,.74);
    box(slidingDoor,0xddd2aa,.955,1.12,.82,.02,.07,.76);
    B(0x273b49,0,1.76,1.62,.95,.19,.11);
    for(let k=0;k<5;k++)L(0xfed17a,-.32+k*.16,1.77,1.689,.10,.058,.026);
  }else if(freight){
    // The low open bed reveals strapped battery trays, a steel headboard
    // and the space beneath the load, instead of a closed delivery shell.
    B(0x556467,0,1.03,-.78,1.79,.15,2.44);
    coachwork(body,'body',paint,0,1.36,.88,1.75,.71,1.38);
    B(windowBlue,0,1.53,1.592,1.51,.41,.075);
    B(paint,0,1.78,.88,1.67,.16,1.44);
    for(const side of [-1,1]){
      B(windowBlue,side*.878,1.52,.84,.034,.38,.75);
      B(0xa5a79b,side*.88,1.18,-.82,.085,.15,2.37);
      for(const z of [-1.85,-.88,.05])B(0x5b6f73,side*.879,1.29,z,.08,.29,.09);
    }
    for(const z of [-1.41,-.43]){
      B(0x3a5155,0,1.38,z,1.31,.53,.81);
      B(0x8b9b89,0,1.69,z,1.23,.10,.74);
      for(const x of [-.46,.46]){
        B(stripe,x,1.75,z,.10,.038,.77);
        for(const side of [-1,1])B(stripe,x,1.41,z+side*.414,.10,.57,.031);
      }
      for(let j=0;j<3;j++)L(0x94cebc,.667,1.45,z-.21+j*.15,.027,.038,.09);
    }
  }else if(van||service){
    coachwork(body,'body',paint,0,1.40,-.66,1.78,1.09,2.55,stripe);
    coachwork(body,'bonnet',0x91a39f,0,1.98,-.70,1.67,.15,2.44);
    for(const side of [-1,1]){
      coachwork(body,'body',0x5d7475,side*.36,1.43,-1.952,.66,.78,.13);
    }
    for(const side of [-1,1]){
      for(const z of [-1.66,-1.38,-1.10])B(0x546969,side*.907,1.25,z,.024,.075,.14);
      B(windowShade,side*.80,1.37,.91,.08,.54,.62);
    }
    B(windowBlue,0,1.32,1.19,1.50,.46,.29);
    B(windowBlue,0,1.60,1.06,1.46,.20,.29);B(paint,0,1.76,.94,1.60,.15,.93);
    if(service){
      for(const x of [-.39,.39])B(0xc4b696,x,2.105,-.75,.082,.08,2.40);
      for(let j=0;j<7;j++)B(0x7c8889,0,2.10,-1.77+j*.32,.76,.07,.072);
      for(const x of [-.59,.59])L(0xf3ad57,x,1.90,.91,.18,.13,.26);
    }
  }else{
    for(const [y,w,d,z] of [[1.07,1.63,2.48,-.17],[1.22,1.52,2.25,-.17],[1.37,1.43,1.90,-.20],[1.48,1.34,1.58,-.20]]){
      B(windowBlue,0,y,z,w,.15,d);
      for(const side of [-1,1])B(windowShade,side*w/2,y,z,.018,.14,d*.64);
    }
    for(const side of [-1,1])B(0x38484c,side*.752,1.28,-.22,.09,.34,.09);
    coachwork(body,'bonnet',paint,0,1.59,-.19,1.39,.15,1.70);
    if(taxi){B(0x2d3e41,0,1.72,-.22,.61,.15,.48);L(0xf5c67d,0,1.82,-.22,.49,.11,.37);}
  }
  function merge(parts,mat){
    return mergeParts(parts,mat,root);
  }
  merge(body,painted);merge(lamp,lights);
  const tailMaterial=lights.clone();
  tailMaterial.onBeforeCompile=shader=>{
    shader.uniforms.trafficBrake=brakes;shader.uniforms.trafficSignal=signal;shader.uniforms.trafficFlash=flash;
    shader.vertexShader='uniform float trafficBrake,trafficSignal,trafficFlash;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <color_vertex>',`#include <color_vertex>
      float source= .37+trafficBrake*1.75;
      if(color.g>.20){source=.08+1.6*trafficFlash*step(.5,trafficSignal*sign(position.x));}
      vColor*=source;`);
  };
  merge(red,tailMaterial);
  const door=slidingDoor.length?merge(slidingDoor,painted):null;
  root.add(roadLight(brakes));
  return {root,height:shuttle||service||van?2.17:freight||taxi?1.86:1.68,
    setLights(brake,turn,blink,doorOpen=0){
      brakes.value=brake;signal.value=turn;flash.value=blink;
      if(door)door.position.z=-doorOpen*.86;
    }};
}
