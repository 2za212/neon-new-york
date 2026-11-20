import {voxelCrown,keyedCasting} from './nyc-field-voxels.js';
// Block courses hold the reed bed back from the timber crossing.
export function buildWetlandBank({box:B,panel,solidFloor,stone,soil,water}) {
  const ends=[
    {z:44,direction:1,breaks:[[107.6,110.8,1.28],[110.8,113.36,.64],[113.36,116.56,1.92],[116.56,120.2,1.28]]},
    {z:59.6,direction:-1,breaks:[[107.6,111.44,1.28],[111.44,114,.64],[114,117.2,1.28],[117.2,120.2,1.92]]}
  ];
  const waterCuts=[...new Set(ends.flatMap(({breaks})=>breaks.flatMap(([a,b])=>[a,b])))].sort((a,b)=>a-b);
  for(const {z,direction,breaks} of ends)for(const [minX,maxX,depth] of breaks){
    const split=depth*.5,inner=z+direction*split,outer=z+direction*depth;
    const step=(a,b,top,mat,id)=>solidFloor({minX,maxX,minZ:Math.min(a,b),maxZ:Math.max(a,b)},top,mat,id,.185);
    step(z,inner,.46,soil,'wetland-upper-bench');
    step(inner,outer,.32,stone,'wetland-lower-bench');
    for(let x=minX+.25;x<maxX-.16;x+=.42){
      const recess=outer-direction*.20;
      const variant=Math.floor(x*7)%4;
      B(stone,x,.337,recess,.27+variant*.026,.034,.23,0xa6ac91);
      if(variant%2===0){
        B('darkLeaf',x,.54,recess,.08,.39,.09,0x91a868);
        B('leaf',x+.14,.44,recess+direction*.11,.23,.15,.20,0x9dae79);
      }
    }
  }
  for(let i=1;i<waterCuts.length;i++){
    const a=waterCuts[i-1],b=waterCuts[i],mid=(a+b)/2;
    const [north,south]=ends.map(({z,direction,breaks})=>z+direction*breaks.find(([lo,hi])=>mid>=lo&&mid<hi)[2]);
    if(panel)panel(water,[[a,.246,south],[b,.246,south],[b,.246,north],[a,.246,north]]);
    else B(water,mid,.242,(north+south)/2,b-a,.008,south-north);
  }
}

export function buildWetlandPump({box:B,beam:L,panel,collider:C,sign,materials}) {
  const x=115.15,z=43.15,u='eastParkIron',trim='eastParkCopper';
  const pump=materials.eastParkIron.clone();
  pump.name='NYC East Commons / enamel pump';
  pump.color.set(0xa3bfb0);
  pump.emissive.set(0x547366);
  pump.emissiveIntensity=.26;
  pump.roughness=.66;
  materials.wetlandEnamel=pump;
  B('eastParkStone',x,.57,z,2.92,.42,1.75,0xb7bbac);C(x,.57,z,2.92,.42,1.75,'pump-plinth');
  keyedCasting({box:B,panel},'wetlandEnamel',x,1.56,z,2.70,1.56,1.55,0xb3c6b7);C(x,1.56,z,2.70,1.56,1.55,'wetland-pump');
  B(trim,x,2.43,z,2.92,.22,1.71,0xbdc4b3);
  B(trim,x+.23,2.63,z-.20,1.67,.24,1.12,0xa1b8b0);
  B(u,x+.72,2.92,z-.20,.47,.36,.46,0x829d93);
  B('eastParkSignal',x+.72,3.125,z-.2,.30,.085,.30,0x8daead);
  B('wetlandEnamel',x,1.50,z+.80,2.29,1.09,.12,0xb8cbba);
  B('rubber',x,1.50,z+.87,2.06,.84,.05,0x81978a);
  for(const e of [-1,1]){
    B('wetlandEnamel',x+e*1.245,1.58,z+.71,.16,1.50,.24,0xc2d1bf);
    B('eastParkStone',x+e*.96,.70,z+.95,.37,.28,.53,0xbfc2a7);
  }
  B('eastParkWarm',x,2.29,z+.92,1.61,.07,.24,0xd4bf96);
  B('wetlandEnamel',x,2.38,z+.93,1.82,.16,.36,0xc1c4ad);
  for(let i=0;i<9;i++)B('wetlandEnamel',x-.91+i*.228,1.52,z+.921,.085,.74,.078,0xabc3ad);
  sign(x,2.24,z+.79,2.26,.25,'INTAKE 02','EAST COMMONS',0,'#b4c8a8');
  for(const e of [-1,1]){
    const inlet=x+e*.76;
    L('wetlandEnamel',[inlet,1.17,z+.7],[inlet,1.17,45.05],.22,.22,0xbbcbbd);
    L('wetlandEnamel',[inlet,1.17,45.05],[inlet,.35,45.05],.22,.22,0xb8cdbb);
    B('eastParkStone',inlet,1.17,45.05,.32,.29,.32,0xc2c1a9);
    B(trim,inlet,.70,45.05,.29,.17,.29,0xc2c8ae);
    C(inlet,.77,45.05,.28,.92,.28,'intake-pipe');
  }
  // Crown lobes overlap diagonally. Their structural forks run back to the
  // existing trunks, with open sky over the pavilion and across the boardwalk.
  const lobes=[];
  for(const [xx,zz,y,skew] of [[79.56,28.04,3.63,1],[81.33,28.30,3.89,1],[83.15,28.37,4.0,-1],[84.95,28.0,3.77,-1]]){
    lobes.push([xx-82,y-3.6,zz-28,1.25,.70,.94],
      [xx-82-skew*.32,y-3.15,zz-27.81,.86,.70,.90]);
    C(xx,y,zz,1.92,.64,1.56,'canopy-span');
  }
  voxelCrown({box:B,panel},'eastParkCanopyLight',[82,3.6,28],lobes,23,
    [0x94a68b,0xacbda0,0xc8d1ae,0xd8dfb1,0xeae6b9]);
  for(const [a,b] of [
    [[78,2.8,28],[80.88,3.79,28.27]],[[86,2.96,28],[83.3,4.0,28.35]],
  ])L('bark',a,b,.19,.21,0xa0a687);
}
