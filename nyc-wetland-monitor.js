import * as T from 'three';

// A buffered sample gives off two subdued pulses, then its shore terminal
// acknowledges. The points share the pond's real 0.246 m water surface.
export function fitWetlandMonitoring(scene,{box:B,collider:C,materials,lights}){
  const iron='eastParkIron',bronze='eastParkCopper',stone='eastParkStone',shell='wetlandEnamel';
  const lightsOn=['wetlandReadA','wetlandReadB','wetlandShoreAck'];
  for(const key of lightsOn){
    const lens=new T.MeshBasicMaterial({color:0xffffff,vertexColors:true,toneMapped:false});
    lens.userData.keepDistant=true;materials[key]=lens;
  }
  function fixed(x,y,z,col,power,range){
    const light=new T.PointLight(col,power,range,2);light.position.set(x,y,z);
    light.userData.nightPower=power;scene.add(light);lights.push(light);
  }
  const waves={position:[],rgba:[],index:[]},tint=new T.Color();
  function reflected(x,z,length,width,hue,strength){
    tint.setHex(hue);
    for(let k=0;k<7;k++){
      const offset=(k-3)*length/7,wide=width*(1-Math.abs(k-3)*.15);
      const h=length/(14+(k%2)*5),anchor=waves.position.length/3;
      for(const [u,v,alpha] of [[-1,-1,0],[-1,1,0],[0,-1,.76],[0,1,1],[1,-1,0],[1,1,0]]){
        waves.position.push(x+u*wide*.5+.09*Math.sin(k*2),.260,z+offset+v*h*.5);
        waves.rgba.push(tint.r,tint.g,tint.b,alpha*strength*(1-.16*Math.abs(k-3)));
      }
      for(const n of [0,1,2,1,3,2,2,3,4,3,5,4])waves.index.push(anchor+n);
    }
  }
  // Hollow closed-cell floats have a wide waterline and shallow draught.
  // A dark pump inlet underneath, sample vial, antenna and hood have separate silhouettes.
  for(const [j,x,z,scale] of [[0,115.08,53.48,1.0],[1,117.03,47.65,.75]]){
    const unit=(m,u,y,v,w,h,d,color)=>B(m,x+u*scale,.246+y*scale,z+v*scale,w*scale,h*scale,d*scale,color);
    const signal=lightsOn[j],tone=j?0xa8d8bc:0xffc078;
    unit(iron,0,.024,0,.94,.09,.67,0x495b54);
    for(const side of [-1,1]){
      unit(shell,side*.43,.13,0,.25,.24,1.04,j?0x8db5a4:0xd0a568);
      unit(shell,0,.13,side*.405,.68,.24,.23,j?0x9bbaa8:0xe4aa65);
      unit(iron,side*.44,.255,0,.26,.066,.37);
      unit(bronze,side*.26,.55,0,.10,.67,.13,0xc0b195);
    }
    unit(iron,0,.44,0,.50,.16,.40);
    unit(shell,0,.62,0,.40,.29,.35,0xaac1b2);
    unit(signal,0,.81,0,.35,.25,.31,tone);
    unit(iron,0,.99,0,.59,.16,.50,0x545b51);
    unit(bronze,0,1.12,0,.13,.19,.118);
    unit(iron,.09,1.19,0,.25,.055,.085);
    unit(signal,.20,1.205,0,.08,.058,.074,tone);
    if(!j){
      // The flat sampling basket and the striped levelling rod are offset,
      // leaving a clear opening below the receiver rather than a solid box.
      unit(iron,-.39,.58,-.20,.08,.91,.12);
      for(let k=0;k<5;k++)unit(k%2?'eastParkWarm':bronze,-.39,.46+k*.16,-.20,.12,.10,.16,
        k%2?0xd8b16b:0x918c70);
      for(const side of [-1,1])unit(bronze,side*.22,.43,.47,.08,.43,.09);
      unit(shell,0,.31,.51,.58,.09,.31,0x94a99d);
    }
    C(x,.246+.50*scale,z,1.12*scale,1.0*scale,1.06*scale,'water-monitor-float');
    fixed(x,.92*scale+.22,z,tone,j?9:12,j?3.6:4.2);
    reflected(x,z+.70*scale,1.18*scale,.78*scale,tone,.48);
  }
  // The maintenance weir occupies the east edge only. Gaps between the two
  // unequal wings feed a screened sill. The boardwalk and shallow crossing stay open.
  for(const [z,length] of [[45.79,1.39],[48.10,1.72]]){
    B(stone,119.97,.385,z,.87,.37,length,0xa6b5a6);
    for(let row=0;row<2;row++)for(let i=0;i<3;i++){
      const span=length/3;
      B(stone,119.58+row*.14,.30+row*.15,z+(i-1)*span,.45,.146,span-.018,
        i%2?0xbeaf92:0xaab2a0);
    }
    B('eastParkTimber',120.20,.62,z,.27,.17,length+.10,0xbea77f);
    C(119.94,.39,z,.89,.43,length,'monitor-weir-wing');
  }
  B(bronze,119.85,.42,46.83,.88,.24,.76);
  for(let i=0;i<4;i++)B(iron,119.68,.52,46.57+i*.17,.56,.065,.07);
  B(shell,120.08,1.20,47.15,.38,1.42,.40);
  B(iron,120.08,1.92,47.15,.64,.17,.57);
  for(let i=0;i<5;i++)B(i===2?lightsOn[2]:bronze,119.87,.72+i*.22,47.15,.075,.105,.37,i===2?0x9ee0bf:0xccc1a9);
  C(120.08,1.12,47.15,.53,1.61,.52,'monitor-gauge');
  for(const [x,z] of [[119.96,48.65],[119.95,45.35]]){
    B(iron,x,.70,z,.24,.38,.28);
    B('eastParkWarm',x-.08,.755,z,.19,.12,.22,0xffda9c);
    B(bronze,x,.90,z,.38,.105,.37);
    fixed(x-.16,.78,z,0xe9c693,10,4.4);
  }
  // The pump on the far bank discharges over a short dog-leg of timber and
  // stone into a planted gravel pocket. Leave both open crossings untouched.
  for(const [x,z,w,h] of [[115.34,44.27,.87,.88],[115.64,44.59,.94,.74],
    [116.06,44.85,1.15,.62],[116.55,45.10,1.23,.50],[117.12,45.32,1.27,.39]]){
    B(stone,x,(h+.20)/2,z,w,h-.20,.49,0xa5977e);
    B('eastParkTimber',x-.08,h+.035,z-.17,w-.02,.07,.15,0xbcaa81);
    B('eastParkCopper',x-.04,h+.010,z+.10,w-.22,.024,.18,0x9ebeb0);
    C(x,(h+.18)/2,z,w,h-.18,.46,'monitor-rill');
  }
  for(const [x,z,s] of [[115.8,45.45,.72],[116.9,45.67,.57],[118.0,45.82,.9],[118.68,45.66,.62]]){
    for(let i=0;i<5;i++){
      const xx=x+(i-2)*.14,zz=z+Math.sin(i*4.1)*.18,h=s*(.67+.22*((2*i+1)%4));
      B('darkLeaf',xx,.29+h/2,zz,.105,h,.11,0xaabc8a);
      B('leaf',xx+(i%2?.09:-.09),.34+h*.70,zz,.22,h*.36,.095,0xb2c392);
      if(i%2===0)B('eastParkTimber',xx,.37+h,zz,.105,.23,.105,0xb59b77);
    }
  }
  B(iron,115.88,1.21,44.40,.17,1.14,.19);
  B(bronze,116.03,1.74,44.43,.46,.16,.29);
  B('eastParkWarm',116.15,1.64,44.43,.28,.09,.21,0xe6bd87);
  fixed(116.15,1.60,44.47,0xf0c287,27,5.5);
  reflected(119.11,46.88,.70,.53,0xa5ddc2,.34);
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(waves.position,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(waves.rgba,4));geo.setIndex(waves.index);
  const mat=new T.MeshBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
  const reflection=new T.Mesh(geo,mat);reflection.name='东园 / 水样灯水面回光';reflection.renderOrder=4;scene.add(reflection);
  const calm=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');let last=-1;
  return function update(time){
    const tick=calm?.matches?16:Math.floor(time*8)%72;
    if(tick===last)return;last=tick;
    for(let i=0;i<3;i++){
      const t=(tick-i*7+72)%72,peak=Math.max(0,1-Math.abs(t-9)/7);
      materials[lightsOn[i]].color.setScalar(.62+.38*peak);
    }
  };
}
