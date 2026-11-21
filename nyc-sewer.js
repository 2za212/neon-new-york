import * as T from 'three';
import {addSewerWater} from './nyc-sewer-water.js';
import {reflectionGrid} from './nyc-voxel-reflections.js';
import {buildCollector,collectorWater,escapeHatch,sewerDeck} from './nyc-sewer-collector.js';

// The working hatch beside the night freight scale uses the existing casting
// in the road. Keep the beacon flush so carts can still cross it.
export const sewerHatch=new T.Vector3(-100.33,.20,-61.18);
export function markSewerHatch({box,sign}){
  const {x,y,z}=sewerHatch;
  for(const side of [-1,1]){
    box('warmWindow',x+side*.82,y+.045,z,.10,.046,1.28,0xffb351);
    for(const end of [-1,1])box('trim',x+side*.65,y+.045,z+end*.61,.24,.05,.10,0xe3ba73);
  }
  sign(x-1.54,1.32,z-.76,1.28,.54,'西仓排水','P03 / 检修井','#ffd390',.40);
  box('metal',x-1.54,.67,z-.76,.12,1.02,.12,0x859394);
  const hx=escapeHatch.x,hz=escapeHatch.z;
  box('metal',hx,.206,hz,1.18,.052,1.44,0x6b817d);
  for(const side of [-1,1])box('trim',hx+side*.43,.244,hz,.075,.026,1.0,0xb1c4a2);
}

export function buildPumpStation(rays,maxDimension=256){
  const scene=new T.Scene(), colliders=[];
  scene.background=new T.Color(0x102127);scene.fog=new T.FogExp2(0x18323a,.033);
  const geometry=new T.BoxGeometry(),groups={stone:[],metal:[],lamp:[]};
  const materials={
    stone:new T.MeshStandardMaterial({roughness:.95}),metal:new T.MeshStandardMaterial({roughness:.57,metalness:.22}),
    lamp:new T.MeshBasicMaterial()
  };
  // Metric tile courses continue around the corners of the solid blocks.
  // Fade the shallow mortar at distance to keep the grilles stable on phones.
  for(const kind of ['stone','metal']){
    materials[kind].onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 stationPoint; varying vec3 stationNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\nstationPoint=(instanceMatrix*vec4(position,1.)).xyz; stationNormal=normal;');
      shader.fragmentShader='varying vec3 stationPoint; varying vec3 stationNormal;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        vec3 p=stationPoint; vec3 n=abs(stationNormal);
        vec2 uv=(n.y>.5?p.xz:n.x>.5?p.zy:p.xy)/${kind==='stone'?'0.32':'0.48'};
        uv.x+=step(.5,fract(floor(uv.y)*.5))*.5;
        vec2 edge=min(fract(uv),1.-fract(uv));
        vec2 aa=max(fwidth(uv),vec2(.008));
        vec2 face=smoothstep(vec2(.014)-aa*.45,vec2(.024)+aa*.45,edge);
        float fidelity=1.-smoothstep(.16,.65,max(aa.x,aa.y));
        float grain=fract(sin(dot(mod(floor(uv),139.),vec2(13.17,79.31)))*148.73);
        diffuseColor.rgb*=1.+fidelity*((grain-.5)*.18-(1.-min(face.x,face.y))*${kind==='stone'?'.27':'.12'});
      `);
    };
    materials[kind].customProgramCacheKey=()=>kind;
  }
  function box(k,x,y,z,w,h,d,color){groups[k].push([x,y,z,w,h,d,color]);}
  function solid(x,y,z,w,h,d){colliders.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));}
  function wall(x,y,z,w,h,d,color){box('stone',x,y,z,w,h,d,color);solid(x,y,z,w,h,d);}
  function plate(text,x,y,z,w,h,ink,rotation=0){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const g=canvas.getContext('2d');g.fillStyle='#142a2f';g.fillRect(0,0,512,128);
    g.strokeStyle=ink;g.lineWidth=5;g.strokeRect(5,5,502,118);g.fillStyle=ink;
    g.font='bold 58px "Microsoft YaHei",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,64,476);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture}));p.position.set(x,y,z);p.rotation.y=rotation;scene.add(p);
  }
  // The inlet runs beside the inspection path and widens into the sump.
  const masonry=[0x53696a,0x627775,0x5b716e,0x526665];
  function paving(left,right,near,far){
    box('stone',(left+right)/2,-.18,(near+far)/2,right-left,.32,far-near,0x263b40);
    for(let z=near,row=0;z<far;z+=1,row++){
      for(let x=left-(row%2)*.6,i=0;x<right;x+=1.2,i++){
        const a=Math.max(x,left),b=Math.min(x+1.2,right),end=Math.min(z+1,far);
        if(b-a>.03)box('stone',(a+b)/2,-.036,(z+end)/2,b-a-.014,.072,end-z-.018,masonry[(row*7+i*3)%4]);
      }
    }
  }
  const left=-1.12,right=5.70,head=-9.10;
  paving(left,2.90,4,16);paving(left,right,head,4);
  // Low nosings allow a shoulder-height view down to the water. Heavy
  // retaining faces continue below the waterline at the exposed deck edges.
  for(const [x,z,w,d] of [[left,3.45,.16,25.1],[right,-2.55,.16,13.1],[(left+right)/2,head,right-left,.16]]){
    box('stone',x,-.33,z,w,.76,d,0x54665d);
    box('metal',x,.064,z,w+.04,.048,d+.04,0x9b9877);
  }
  for(let z=-8;z<16;z+=2)box('metal',left,.096,z,.20,.025,.58,0xe0a445);
  // A grated section underfoot lets water pass through the entrance sill.
  for(let i=0;i<8;i++)box('metal',-2.03,-.025,4.02+i*.16,1.70,.085,.082,0x6b7770);
  for(const x of [-2.76,-1.32])box('metal',x,-.084,4.58,.09,.12,1.31,0x727c70);
  const spills=[
    {x:16.37,y:.93,z:-60.3,dx:-.76,dz:0,width:.82},
    {x:-1.15,y:1.88,z:-13.10,dx:0,dz:1.72,width:3.35},
    {x:-2.51,y:1.20,z:8.15,dx:.84,dz:0,width:.72},
    ...[-1,1].flatMap(side=>[-9.8,-3.2].map(z=>({x:side*7.36,y:.36,z,dx:-side*.24,dz:0,width:.48})))
  ];
  const updateWater=addSewerWater(scene,[
    [-2.90,left,4,16],[-8.66,left,head,4],[right,8.66,head,4],[-8.66,8.66,-14,head],...collectorWater
  ],spills);
  box('metal',-2.75,1.28,8.15,.48,.60,.99,0x9d8461);
  box('metal',-2.49,1.28,8.15,.10,.44,.82,0x263c40);
  box('metal',-1.15,1.82,-13.16,3.6,.15,.46,0x646d5c);
  // Flood stains follow the old high-water line. A stepped staff gauge
  // stands on the wet face, visible beside the first discharge.
  for(const [x,start,end,side] of [[-2.70,4,15,-1],[-8.34,-14,4,-1],[8.34,-14,4,1]]){
    for(let z=start;z<end;z+=1){
      const band=.23+.08*Math.sin(z*.8);
      box('stone',x-side*.028,band/2-.09,z+.50,.16,band, .99,0x344438);
    }
  }
  for(const [x,z,rot] of [[-2.46,7.12,Math.PI/2],[-8.11,-5,Math.PI/2]]){
    box('metal',x,.64,z,.12,1.56,.31,0xdbcc8c);
    for(let i=0;i<8;i++)box('metal',x+.07,i*.18+.04,z,.034,.048,i%2?.13:.24,0x653e2a);
    plate('水 位',x+.10,1.60,z,.68,.27,'#dec598',rot);
  }
  wall(0,3.1,16.2,6.4,6.2,.4,0x384d50);
  wall(-2.80,3.6,-14.2,12,7.2,.4,0x405555);
  wall(7.65,3.6,-14.2,2.30,7.2,.4,0x405555);
  wall(4.85,5.45,-14.2,3.30,3.50,.4,0x405555);
  box('stone',0,6.75,10,6.6,.45,12,0x293b3b);
  box('stone',0,7.65,-5,18,.50,18.8,0x253b40);
  solid(0,6.75,10,6.6,.45,12);solid(0,7.65,-5,18,.50,18.8);
  for(const side of [-1,1]){
    wall(side*3.1,3.3,10,.4,6.6,12,0x465855);
    wall(side*8.9,3.5,-5,.6,7,18.4,0x405958);
    wall(side*5.9,3.4,4.14,5.95,6.8,.28,0x3c5154);
    for(let z=-13;z<15;z+=2){
      const tunnel=z>4,x=side*(tunnel?2.84:8.46),high=tunnel?5.95:6.8;
      for(let row=0;row<5;row++){
        const len=(row%2?1.20:.72);
        box('stone',x,row*.48+.25,z-(2-len)*.5,.18,.45,len-.025,masonry[(row+Math.abs(z))%4]);
        box('stone',x,row*.48+.25,z+len*.5,.18,.45,2-len-.025,masonry[(row+Math.abs(z)+2)%4]);
      }
      for(let j=0;j<4;j++){
        const v=z-.72+j*.48;
        box('stone',x-side*.13,.19,v,.32,.38,.46,masonry[(j+Math.abs(z))%4]);
        if((j+Math.abs(z))%3===0)box('stone',x-side*.10,.54,v+.17,.24,.32,.42,0x79877b);
      }
      if((z+13)%4)continue;
      for(let k=0;k<4;k++)box('stone',x-side*k*.29,high+k*.29-.64,z,.54,.54,.68,0x78837a);
      box('metal',x-side*.19,high*.5,z,.38,high,.46,0x3a5156);
      box('metal',x-side*.41,2.85,z,.43,.52,.35,0x9e8766);
    }
    for(const [x,z,len] of [[2.53,10,12],[8.04,-5,18]]){
      box('metal',side*x,2.85,z,.37,.37,len,side===1?0x976441:0x487c81);
      box('metal',side*x,3.30,z,.17,.17,len,0x708883);
      for(let v=z-len/2+.7;v<z+len/2;v+=2)box('metal',side*x,2.85,v,.49,.49,.16,0xa6a691);
    }
    for(let z=-11;z<16;z+=4){
      const x=side*(z>4?2.49:6.06);
      box('metal',x,2.20,z,.48,.25,.92,0x45585a);
      box('lamp',x-side*.06,2.08,z,.33,.085,.68,z>4?0xffb667:0x8bebe0);
      if(z<=4){
        box('metal',x,.60,z,.16,3.0,.18,0x5a716b);
        box('stone',x,-.36,z,.48,.6,.52,0x485a57);
      }
    }
    // Paired mains turn down into the lower race. The broad couplings and
    // stepped elbows read from the fighting floor, above the rail line.
    for(const z of [-9.8,-3.2]){
      for(let k=0;k<4;k++)box('metal',side*(8.27-k*.30),2.82-k*.25,z,.68,.64,.78,0x976947);
      box('metal',side*7.36,1.18,z,.62,1.82,.70,0x8e654c);
      for(const y of [.41,1.40,1.94])box('metal',side*7.36,y,z,.82,.17,.94,0xb4976f);
    }
  }
  for(const z of [-10,-5,0]){
    for(const side of [-1,1]){
      for(let i=0;i<5;i++)box('metal',side*(8.2-i*.62),5.35+i*.41,z,.77,.62,.52,0x535e59);
      for(let i=0;i<2;i++)box('metal',side*(2.10+i*.60),6.96,z,.42,.64,.74,0x7c8272);
    }
    box('metal',0,7.12,z,12.1,.40,.52,0x67746e);
  }
  for(let row=0;row<10;row++)for(let i=0;i<14;i++){
    const x=-8.04+i*1.18+(row%2)*.48,y=.35+row*.65;
    if((Math.abs(x)<3.15&&y<5.85)||(x>2.6&&x<7.1&&y<4.1))continue;
    box('stone',x,y,-13.94,1.15,.62,.15,masonry[(i+row*3)%4]);
  }
  box('metal',0,1.75,-13.93,4.62,3.50,.19,0x152b2e);
  for(let i=-2;i<=2;i++)box('lamp',i*.86,.42,-13.795,.56,.10,.052,0x6ebbb0);
  // A stepped outfall surround, closed sluice teeth and a single amber
  // indicator make the pump identifiable from the throat of the tunnel.
  for(let i=0;i<5;i++){
    for(const side of [-1,1])box('metal',side*(2.94-i*.43),1.65+i*.60,-13.52,.68,.72,.84,0x819387);
  }
  box('metal',0,4.56,-13.48,2.58,.62,.88,0x899a8e);
  solid(0,1.8,-13.62,5.96,3.6,.92);
  for(let i=-4;i<=4;i++)box('metal',i*.49,1.75,-13.54,.20,3.40,.28,0x293c43);
  for(let j=0;j<4;j++)box('metal',0,.60+j*.78,-13.67,4.84,.12,.26,0x80918a);
  for(const side of [-1,1]){
    const cabinetX=side<0?-4.94:7.68;
    box('metal',cabinetX,1.4,-13.43,1.78,2.8,.84,0x566d69);
    solid(cabinetX,1.4,-13.14,1.78,2.8,1.72);
    for(let i=0;i<4;i++)box('metal',cabinetX,1.18+i*.30,-12.97,1.26,.13,.15,0x263b41);
    box('lamp',cabinetX,2.43,-12.98,.84,.14,.13,0xff8d55);
    for(let i=0;i<5;i++){
      const w=[.75,1.20,1.46,1.20,.75][i];
      box('metal',cabinetX,.65+i*.28,-12.73,w,.28,.40,0x9c7653);
    }
    box('metal',cabinetX,1.20,-12.40,.98,.14,.24,0xbd9e79);
    box('metal',cabinetX,1.20,-12.42,.14,.98,.22,0xbb9471);
    box('metal',cabinetX,1.20,-12.26,.31,.31,.20,0x51635a);
  }
  plate('P03  西仓泵站',0,5.45,-13.83,4.4,1.08,'#f6c582');
  for(const side of [-1,1])box('metal',side*.46,2.9,15.72,.12,5.8,.15,0xa0a798);
  for(let i=0;i<13;i++)box('metal',0,.36+i*.42,15.54,.98,.12,.21,0xdab363);
  plate('↑  街面出口',0,3.18,15.33,1.98,.50,'#95e7cf',Math.PI);
  // Entrance arrow is seen by the returning player from the pump floor.
  plate('↑  西仓井梯',0,3.82,4.42,2.02,.50,'#a9e5d4',Math.PI);
  box('metal',0,3.83,4.48,2.18,.63,.09,0x344948);
  plate('P03  泵房入口',0,3.82,4.54,2.02,.50,'#e2b47d');
  for(const x of [-.88,.88])box('metal',x,5.30,4.48,.06,2.50,.06,0x829285);
  const collector=buildCollector({scene,box,wall,solid,paving,plate,colliders});
  if(rays){
    const grid=reflectionGrid(new T.Box3(new T.Vector3(-10,-3,-68),new T.Vector3(72,10,18)),.42,maxDimension,rays);
    grid.blockers(colliders);
    for(const lamp of groups.lamp)grid.box(...lamp);
    const water=scene.getObjectByName('明渠与集水池').material;
    water.onBeforeCompile=shader=>{
      grid.bind(shader);
      shader.fragmentShader=shader.fragmentShader.replace('col+=lobe*',
        'if(rtSteps>0)col+=traceLight(w+.025*n,r)*(.23+.75*grazing); else col+=lobe*');
    };
    grid.surface(materials.metal,'.22');
  }
  for(const [kind,parts] of Object.entries(groups)){
    const mesh=new T.InstancedMesh(geometry,materials[kind],parts.length),matrix=new T.Matrix4(),color=new T.Color();
    parts.forEach(([x,y,z,w,h,d,tint],i)=>{matrix.makeScale(w,h,d).setPosition(x,y,z);mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color.setHex(tint));});
    mesh.computeBoundingSphere();scene.add(mesh);
  }
  scene.add(new T.HemisphereLight(0xc2e2e3,0x858479,.82));
  const key=new T.DirectionalLight(0xadf1e6,1.2);key.position.set(-4,7,-9);scene.add(key);
  for(const [x,y,z,col,power,range] of [[-1,3,9,0xffa257,75,11],[-4,3,-3,0x58dcd6,140,17],[4,4,-11,0xf29a53,145,16]]){
    const l=new T.PointLight(col,power,range);l.position.set(x,y,z);scene.add(l);
  }
  return {scene,colliders,updateWater,collector,bounds:{minX:-5,maxX:69,minZ:-66,maxZ:15.9},spawn:new T.Vector3(0,0,11.4),
    ground:()=>0,isPlayable:sewerDeck};
}
