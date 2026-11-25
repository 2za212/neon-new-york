import * as T from 'three';
import {up,TAU,ease,mix,vector,rgb,hash,makeTube} from './attack-vfx-kit.js';

const frost=rgb(.095,.64,1.42);
const lilac=rgb(.54,.24,1.48);
const rose=rgb(1.15,.074,.55);
const ion=rgb(1.24,.69,1.41);
const phase=(t,start,peak,release,end)=>ease(t,start,peak)*(1-ease(t,release,end));

const crossSection=[
  [-.26,-.18],[-.12,-.69],[.28,-1.0],[.96,-.41],[.82,.32],[.04,.59],
];

function makeBeveledFold(group,warm,order) {
  const rows=32, facets=crossSection.length;
  const geometry=new T.BufferGeometry();
  const count=(rows+1)*facets*2;
  const positions=new T.BufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage);
  const colors=new T.BufferAttribute(new Float32Array(count*3),3);
  const marks=new T.BufferAttribute(new Float32Array(count*2),2);
  const indices=new Uint16Array(rows*facets*6);
  const base=new T.Color(warm?0x3f162c:0x142b42);
  const bevel=new T.Color(warm?0xbc547c:0x507faf);
  const crease=new T.Color(warm?0x230d23:0x141a36);
  const tint=new T.Color();
  for(let row=0;row<=rows;row++){
    for(let edge=0;edge<facets;edge++){
      const i=(row*facets+edge)*2;
      const sideValue=[.32,.18,.59,.88,.33,.15][edge];
      for(let corner=0;corner<2;corner++){
        const grain=.87+.13*Math.sin(row*1.92+edge*.97+corner*.36);
        tint.copy(base).lerp(bevel,sideValue).lerp(crease,1-grain);
        colors.setXYZ(i+corner,tint.r,tint.g,tint.b);
        marks.setXY(i+corner,row/rows,(edge+corner)/facets);
      }
      if(row===rows)continue;
      const next=i+facets*2, j=(row*facets+edge)*6;
      indices.set([i,next,i+1,next,next+1,i+1],j);
    }
  }
  geometry.setAttribute('position',positions);
  geometry.setAttribute('color',colors);
  geometry.setAttribute('uv',marks);
  geometry.setIndex(new T.BufferAttribute(indices,1));

  const heat={value:0}, time={value:0};
  const material=new T.MeshPhysicalMaterial({
    color:0xffffff,vertexColors:true,metalness:.52,roughness:.32,clearcoat:.60,
    clearcoatRoughness:.26,emissive:warm?0xf13581:0x467dff,emissiveIntensity:.72,
    side:T.DoubleSide,transparent:true,depthWrite:false,forceSinglePass:true,
  });
  material.onBeforeCompile=shader=>{
    shader.uniforms.foldHeat=heat;
    shader.uniforms.foldTime=time;
    shader.vertexShader='varying vec2 fractureUV;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>','#include <begin_vertex>\nfractureUV=uv;');
    shader.fragmentShader='varying vec2 fractureUV;uniform float foldHeat,foldTime;\n'+shader.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        float strike=fractureUV.x*13.+fractureUV.y*3.1;
        float dark=1.-smoothstep(.022,.078,abs(sin(strike*1.93+sin(strike*4.2)*.52)));
        float stone=.81+.19*sin(strike*7.3)*cos(fractureUV.x*48.5-fractureUV.y*21.);
        diffuseColor.rgb*=stone*(1.-dark*.36);`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        float seam=exp(-31.*abs(fractureUV.y-.34))*.48+exp(-54.*abs(fractureUV.y-.66))*.76;
        float stress=pow(.5+.5*sin(fractureUV.x*29.-foldTime*33.+sin(fractureUV.y*12.)),7.);
        float head=exp(-pow((fractureUV.x-.53-foldTime*.79)*4.,2.));
        totalEmissiveRadiance*=foldHeat*(.077+seam*(.28+.64*head)+.17*stress);`)
      .replace('#include <opaque_fragment>',`
        float front=abs(dot(normalize(vViewPosition),normal));
        float separate=smoothstep(.007,.042,abs(fractureUV.x-.43-.028*sin(fractureUV.y*19.)));
        float shear=smoothstep(.004,.020,abs(fractureUV.x-.73-.021*sin(fractureUV.y*15.)));
        float cut=separate*shear;
        diffuseColor.a*=foldHeat*(.51+.29*pow(1.-front,1.5))*(.42+.58*cut);
        #include <opaque_fragment>`);
  };
  const mesh=new T.Mesh(geometry,material);
  mesh.frustumCulled=false;
  mesh.renderOrder=order;
  mesh.name=warm?'瞬斩 · 近侧断棱':'瞬斩 · 后侧断棱';
  group.add(mesh);
  const sample=vector();
  return (age,power,place)=>{
    mesh.visible=power>.012;
    if(!mesh.visible)return;
    heat.value=power;
    time.value=age;
    for(let row=0;row<=rows;row++){
      const u=row/rows;
      for(let edge=0;edge<facets;edge++){
        for(let corner=0;corner<2;corner++){
          const [ridge,thickness]=crossSection[(edge+corner)%facets];
          place(sample,u,ridge,thickness);
          positions.setXYZ((row*facets+edge)*2+corner,sample.x,sample.y,sample.z);
        }
      }
    }
    positions.needsUpdate=true;
    geometry.computeVertexNormals();
  };
}
function makePrisms(group) {
  const outline=new T.Shape();
  outline.moveTo(-.32,-.42);
  outline.lineTo(.31,-.24);
  outline.lineTo(.24,.22);
  outline.lineTo(.02,1.00);
  outline.lineTo(-.36,.15);
  outline.closePath();
  const shardGeo=new T.ExtrudeGeometry(outline,{depth:.18,steps:1,bevelEnabled:true,
    bevelThickness:.044,bevelSize:.054,bevelSegments:1});
  shardGeo.translate(0,-.21,-.081);
  const face=new T.MeshStandardMaterial({color:0xffffff,roughness:.30,metalness:.62,
    emissive:0x412067,emissiveIntensity:.29,flatShading:true});
  const edges=new T.MeshStandardMaterial({color:0xc6abd6,roughness:.20,metalness:.47,
    emissive:0x8c50be,emissiveIntensity:.41,flatShading:true});
  const count=14;
  const mesh=new T.InstancedMesh(shardGeo,[face,edges],count);
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  mesh.frustumCulled=false;
  group.add(mesh);
  const prism=new T.Object3D(),tint=new T.Color();
  const seeds=Array.from({length:count},(_,i)=>({
    u:.08+.83*hash(i*11+1), face:i%2, pull:hash(i*11+3), size:hash(i*11+4),
    depth:hash(i*11+5), spin:hash(i*11+6), turn:hash(i*11+7),
    time:hash(i*11+8)*.081, c:hash(i*11+9),
  }));
  return (age,position,side,forward)=>{
    mesh.visible=age>=.033&&age<.53;
    if(!mesh.visible) return;
    for(let i=0;i<count;i++){
      const p=seeds[i], local=age-.045-p.time;
      const ejection=1-Math.exp(-Math.max(local,0)*7.2);
      const fade=phase(local,0,.052,.155,.40);
      const sign=p.face===0?-1:1;
      position(prism.position,p.u,p.face);
      const offset=(.052+p.pull*.33)*ejection*sign;
      prism.position.addScaledVector(side,offset).addScaledVector(up,offset*.38+p.depth*ejection*.25)
        .addScaledVector(forward,(p.depth-.39)*ejection*.49);
      prism.rotation.set(p.turn*TAU+local*(3+p.spin*11),
        p.spin*TAU-local*(5+p.size*5),p.depth*TAU+local*6.2);
      const scale=(.052+.126*p.size**1.7)*fade;
      prism.scale.set(scale*(.60+p.pull*.48),scale*(.83+p.depth*.88),scale*(.57+p.spin*.51));
      prism.updateMatrix();
      mesh.setMatrixAt(i,prism.matrix);
      mesh.setColorAt(i,tint.copy(lilac).lerp(p.face===0?rose:frost,p.c).multiplyScalar(.53+p.size*.61));
    }
    mesh.instanceMatrix.needsUpdate=mesh.instanceColor.needsUpdate=true;
  };
}

export function createRiftBloom(group,center,forward,side) {
  const longAxis=side.clone().addScaledVector(up,-.54).addScaledVector(forward,.17).normalize();
  const across=side.clone().multiplyScalar(.54).addScaledVector(up,.73).addScaledVector(forward,.40).normalize();
  const crossAxis=across.clone().addScaledVector(longAxis,-across.dot(longAxis)).normalize();
  const away=longAxis.clone().cross(crossAxis).normalize();
  if(away.dot(forward)<0)away.negate();
  const front=makeBeveledFold(group,true,7.57);
  const rear=makeBeveledFold(group,false,7.13);
  const spur=makeBeveledFold(group,false,7.34);
  const inside=makeTube(group,{color:rose,edge:ion,rows:51,sides:8,order:8.6});
  const outside=makeTube(group,{color:rgb(.20,.42,1.31),edge:frost,rows:54,sides:8,order:8.3});
  const thread=makeTube(group,{color:lilac,edge:ion,rows:45,sides:6,kind:1,order:7.7});
  const backflow=makeTube(group,{color:frost,edge:lilac,rows:42,sides:6,kind:1,order:7.6});
  const horizonEdge=makeTube(group,{color:rgb(.27,.07,.53),edge:frost,rows:42,sides:6,order:7.2});
  const prism=makePrisms(group);
  const foot=vector(),tipOffset=vector();
  let width=0,length=0,time=0,retreat=0;

  function contour(out,u,v) {
    const x=2*(u-.468);
    const taper=Math.sin(Math.PI*u)**.79;
    const middle=Math.sin(u*9.1+.13)*.066+Math.sin(u*25.4)*.021;
    const gap=(v-.50)*width*taper*(.73+.27*Math.sin(u*8.9+.7));
    out.copy(center).addScaledVector(side,x*length-.17*retreat)
      .addScaledVector(forward,(x*.20+x*x*.23)+middle+retreat).addScaledVector(across,gap);
    out.y+=-.87*x-.082*Math.sin(u*8.5)+.025*x*x;
    out.addScaledVector(tipOffset,ease(u,.54,1));
    out.y=Math.max(.044,out.y);
    return out;
  }

  function sampleRail(sample,u,v,radius) {
    contour(sample.center,u,v);
    const grain=.83+.17*Math.sin(u*98.+time*23.)**2;
    const narrowed=radius*(.21+.79*Math.sin(Math.PI*u)**.46)*grain;
    sample.radialA.copy(forward);
    sample.radialB.copy(across);
    sample.a=narrowed*.79;
    sample.b=narrowed;
  }

  return (age,hit,bladeTip)=>{
    const t=Math.max(0,age);
    const first=phase(age,-.014,.026,.057,.205);
    const wake=phase(age,.016,.074,.124,.343);
    const active=hit?1:.30;
    const sweep=ease(age,-.015,.084);
    const decay=ease(age,.094,.31);
    width=(.027+.41*sweep)*(1.-.91*decay);
    length=.69+.84*ease(age,-.022,.072)-.22*decay;
    time=age;
    retreat=.19*ease(age,.026,.159);
    tipOffset.set(0,0,0);
    if(age<.138&&age>=-.014){
      contour(foot,.96,.49);
      tipOffset.copy(bladeTip).sub(foot).clampLength(0,.66)
        .multiplyScalar(phase(age,-.014,.037,.087,.138)*.57);
    }

    const open=hit?phase(age,.015,.073,.106,.27):0;
    const spread=ease(age,.014,.092);
    const pinched=(1.-ease(age,.114,.26))*(.44+.56*spread);
    function placeFold(out,u,ridge,thickness,sign,start,end,scale){
      const range=mix(start,end,u);
      const taper=Math.pow(Math.sin(Math.PI*u),.71);
      const curve=.78+.22*Math.sin(range*13.1+sign*.86);
      const plane=(.13+.12*Math.sin(range*5.3+.28))*taper*pinched*scale;
      const hinge=.53+.47*ease(Math.abs(range-.456),.023,.257);
      const splitting=taper*(.097+.407*spread)*pinched*scale*sign*hinge;
      contour(out,range,sign<0?.27:.73);
      const twist=sign*spread*(.18+.94*Math.sin(range*3.69+.41))*(1.-.28*u);
      const width=sign*ridge*plane*(.43+.57*open);
      const thicknessOffset=thickness*.225*taper*curve*pinched*scale;
      const c=Math.cos(twist),s=Math.sin(twist);
      out.addScaledVector(crossAxis,width*c-thicknessOffset*s);
      out.addScaledVector(away,splitting+width*s+thicknessOffset*c);
      out.y=Math.max(.051,out.y);
    }
    front(t,open,(out,u,ridge,thickness)=>{
      placeFold(out,u,ridge,thickness,-1,.067,mix(.61,.982,sweep),1.);
    });
    rear(t,open*.79,(out,u,ridge,thickness)=>{
      placeFold(out,u,ridge,thickness,1,.133,mix(.54,.95,sweep),.92);
      out.addScaledVector(up,.075*Math.sin(Math.PI*u)*spread);
    });
    spur(t,open*.65,(out,u,ridge,thickness)=>{
      placeFold(out,u,ridge,thickness,1,.047,.44,.61);
      out.addScaledVector(away,.28*Math.sin(Math.PI*u)*pinched);
      out.addScaledVector(up,.14*Math.sin(Math.PI*u)*pinched);
    });


    inside.update(t,active*(.69*first+.23*wake),(sample,u)=>{
      const progress=mix(.32*(1.-sweep),.44+.56*sweep,u);
      sampleRail(sample,progress,.068,.029);
      sample.center.addScaledVector(away,-.16*Math.sin(progress*Math.PI)*pinched);
    });
    outside.update(t,active*wake*.44,(sample,u)=>{
      const progress=mix(.12,.81+.12*sweep,u);
      sampleRail(sample,progress,.93,.022);
      sample.center.addScaledVector(away,.20*Math.sin(progress*Math.PI)*pinched);
    });
    thread.update(t,active*first*.41,(sample,u)=>{
      const q=u*.70+.095;
      sampleRail(sample,q,-.19-.19*Math.sin(q*7.2+t*11.),.026);
      sample.center.addScaledVector(forward,-.085+.15*Math.sin(q*7.1));
      sample.center.y=Math.max(.052,sample.center.y+.09*Math.sin(q*39.));
    });
    backflow.update(t,active*wake*.36,(sample,u)=>{
      const q=.21+u*.69;
      sampleRail(sample,q,1.19+.36*Math.sin(q*10.1-t*8.),.024);
      sample.center.addScaledVector(away,.13+.16*Math.sin(q*9.1));
      sample.center.y=Math.max(.049,sample.center.y+.086*Math.sin(q*31.3));
    });
    const groundWave=hit?phase(age,.071,.133,.183,.34):0;
    const swell=ease(age,.062,.339);
    contour(foot,.968,.51);
    horizonEdge.update(t,groundWave*.28,(sample,u)=>{
      const along=(u-.5)*2;
      const arc=Math.sin(Math.PI*u);
      sample.center.copy(foot).addScaledVector(side,along*(.19+swell*.68))
        .addScaledVector(forward,(arc*.31)*swell-.071);
      sample.center.y=.058+(.044+swell*.058)*arc;
      sample.radialA.copy(forward);
      sample.radialB.copy(up);
      sample.a=.011+arc*.035;
      sample.b=.007+arc*.021;
    });
    prism(hit?age:-1,contour,side,forward);

  };
}
