import {voxelCrown} from './nyc-field-voxels.js';
import {Color} from 'three';

export const catchmentPools = [
  {minX:103.35,maxX:107.34,minZ:44.09,maxZ:46.44},
  {minX:103.44,maxX:107.34,minZ:54.68,maxZ:58.85}
];

// Both north groups slope toward the existing pond. A two-metre break between
// them keeps the original shallow-bank approach and the intake accessible.
export function buildFloodGarden({box:B,beam:L,panel,collider:C,surface:S,materials,rand}) {
  const stone='floodLimestone', vegetation='floodSedge', crown='floodCrown';
  for(const [key,source,color,glow,power] of [
    [stone,'eastParkStone',0xd1c7a4,0x62725f,.23],
    [vegetation,'leaf',0xb2ab5d,0x62642b,.24],
    [crown,'leaf',0x98a868,0x465631,.27]
  ]){
    const mat=materials[source].clone();
    mat.name='NYC East Commons / '+key;
    mat.color.set(color);
    mat.emissive.set(glow);
    mat.emissiveIntensity=power;
    mat.roughness=.94;
    materials[key]=mat;
  }
  const shallow=materials.eastParkShallowWater.clone();
  shallow.name='NYC East Commons / planted sediment pools';
  shallow.color=new Color(0x527e80);
  shallow.roughness=.54;
  shallow.opacity=.87;
  materials.floodBasin=shallow;

  function land(x0,x1,z0,z1,top,id,capped=true,bottom=.18){
    const x=(x0+x1)/2,z=(z0+z1)/2,w=x1-x0,d=z1-z0;
    const cap=capped?.085:0;
    B(stone,x,(top-cap+bottom)/2,z,w,top-cap-bottom,d,0xb1b8a6);
    if(capped)B('eastParkGrassCap',x,top-cap/2,z,w,cap,d,0xc1c898);
    S(x0,x1,z0,z1,top);
    C(x,(top+bottom)/2,z,w,top-bottom,d,id);
  }

  function rush(x,y,z,scale,seed){
    B('eastParkBankSoil',x,y+.065,z,scale*.76,.13,scale*.61,0xa19a7e);
    for(let n=0;n<5;n++){
      const t=(n-2)*.177*scale;
      const h=(.42+((seed+n*3)%5)*.124)*scale;
      const col=[0xd9cb82,0xbfa069,0x96ab6b,0xc6b978,0xd6af72][(seed+n)%5];
      const leaf=seed%3===0?'darkLeaf':vegetation;
      B(leaf,x+t,y+h/2,z+.11*(n%2),.105*scale,h,.14*scale,col);
      B(leaf,x+t*1.48,y+h*.73,z+.11*(n%2),.18*scale,.17*scale,.15*scale,col);
      if(n%2===0)B('eastParkTimber',x+t*1.48,y+h+.035,z,.135*scale,.145*scale,.124*scale,0xbfa679);
    }
  }

  function bank({x0,x1,lip,direction,steps,run,stair}) {
    for(let tier=0;tier<steps;tier++){
      const height=.68+tier*.32;
      const offset=tier*.16, width=run[tier]??.68;
      const span=run.slice(0,tier).reduce((sum,v)=>sum+v,0);
      const z=lip+direction*(span+width/2);
      const a=x0+offset,b=x1-offset,z0=z-width/2,z1=z+width/2;
      land(a,stair[0],z0,z1,height,'flood-terrace');
      land(stair[1],b,z0,z1,height,'flood-terrace');
      // Two short stair treads per soil course keep each climb at 16 cm.
      const split=z;
      land(stair[0],stair[1],direction>0?z0:split,direction>0?split:z1,height-.16,'flood-stair',false);
      land(stair[0],stair[1],direction>0?split:z0,direction>0?z1:split,height,'flood-stair',false);
      for(let x=a+.48;x<b-.14;x+=.88){
        if(x>stair[0]-.38&&x<stair[1]+.39)continue;
        B(stone,x,height-.16,z-direction*(width/2-.032),.62,.14,.117,0xaeb5a0);
        const xx=x+(rand()-.5)*.11,scale=.65+rand()*.54,seed=Math.floor(x+z+tier);
        // The south sampling bank has a cut strip on the three lowest
        // shelves. Low sedge offsets leave the sightline across the water
        // open; uncut rushes follow the upper bank behind the observer.
        if(direction>0&&tier<3){
          B('eastParkBankSoil',xx,height+.035,z,.52*scale,.07,.34,0x9aa17d);
          for(let clump=0;clump<3;clump++){
            const leaf=seed%3===clump?'darkLeaf':vegetation;
            B(leaf,xx+(clump-1)*.15*scale,height+.105,z+(clump%2)*.09,
              .25*scale,.09,.20,0xb5ae7c);
          }
        }else rush(xx,height,z,scale,seed);
      }
    }
  }

  bank({x0:103.44,x1:111.22,lip:43.73,direction:-1,steps:7,
    run:[.54,.54,.48,.49,.54,.62,.94],stair:[105.15,106.85]});
  bank({x0:116.60,x1:119.96,lip:43.73,direction:-1,steps:4,
    run:[.59,.64,.68,.82],stair:[117.43,118.76]});
  bank({x0:106.76,x1:118.82,lip:59.86,direction:1,steps:7,
    run:[.53,.54,.55,.56,.56,.63,1.06],stair:[112.21,113.96]});

  // Secondary settling cells sit shoulder to shoulder with the main pond.
  for(const [i,r] of catchmentPools.entries()){
    const {minX:a,maxX:b,minZ:c,maxZ:d}=r;
    B('eastParkSoil',(a+b)/2,.186,(c+d)/2,b-a,.012,d-c,0xa6aa87);
    S(a,b,c,d,.192);
    for(const [x0,x1,z0,z1] of [[a,a+.48,c,d],[a+.48,b,c,c+.42],[a+.48,b,d-.43,d]]){
      land(x0,x1,z0,z1,.34,'settling-bank',false,.192);
    }
    if(panel)panel('floodBasin',[[a+.48,.269,d-.43],[b,.269,d-.43],[b,.269,c+.42],[a+.48,.269,c+.42]]);
    else B('floodBasin',(a+.48+b)/2,.265,(c+.42+d-.43)/2,b-a-.48,.008,d-c-.85);
    for(let x=a+.65;x<b-.20;x+=.63)rush(x,.34,c+.22,.68+(i%2)*.16,Math.floor(x*4));
  }
  // The stair landing bridges the first settling pool lip at park level.
  land(105.15,106.85,43.73,44.80,.38,'flood-stair-landing',false,.192);

  // Stepped wing walls and an exposed sluice face under the terrace spillway.
  for(const x of [107.17,109.19]){
    B(stone,x,1.0,43.53,.43,1.28,.52,0xc3bea2);
    B('eastParkIron',x,1.42,43.84,.58,.16,.54,0xa4bbae);
  }
  B('eastParkIron',108.18,1.61,43.58,2.77,.26,.53,0xb1bdab);
  B('eastParkCopper',108.18,.69,43.67,1.47,.63,.31,0xa5b8a8);
  for(let n=0;n<9;n++)B('rubber',107.47+n*.175,.67,43.837,.08,.49,.035,0x8d987f);
  B('eastParkWarm',108.18,1.45,43.87,1.35,.065,.12,0xdad29e);

  // Traversable canopy arches are rooted on planted piers outside the boardwalk.
  // The bend advances on a 32 cm grid. Consecutive cells on the same line
  // share a face, so a branch reads as one growing form from the boardwalk.
  function willowBough(x,y,z,dx,dy,dz,radius,tint){
    const steps=Math.ceil(dy/.32),rise=dy/steps;
    let first=0,prevX=0,prevZ=0;
    for(let i=1;i<=steps;i++){
      const t=i/(steps-1);
      const nextX=Math.round(dx*t/.32)*.32,nextZ=Math.round(dz*t/.32)*.32;
      if(i<steps&&nextX===prevX&&nextZ===prevZ)continue;
      B('bark',x+prevX,y+(first+i)*rise/2,z+prevZ,radius,(i-first)*rise,radius,tint);
      first=i;prevX=nextX;prevZ=nextZ;
    }
  }
  // The mature trunks climb out of the water, leaving the entire lane open.
  for(const [x,flip] of [[109.43,1],[118.10,-1]]){
    for(const [z,s] of [[48.30,-1],[52.87,1]]){
      const rootX=x+s*.12*flip;
      land(rootX-.78,rootX+.78,z-.51,z+.51,.58,'willow-islet',true,.185);
      B('bark',rootX,1.03,z,.69,.91,.68,0xc2ac85);
      willowBough(rootX,1.22,z,s*.32,2.56,0,.64,0xb8ab88);
      willowBough(rootX,1.47,z,-s*.64,2.24,s*.64,.48,0xb7ab84);
      willowBough(rootX+s*.32,3.46,z,0,2.08,-s*1.60,.48,0xb1a188);
      willowBough(rootX+s*.32,3.51,z,flip*1.28,1.92,-s*.64,.48,0xb0a08a);
      C(rootX,2.40,z,.82,3.70,.79,'willow-trunk');
      B('eastParkIron',rootX,1.43,z-s*.373,.29,.25,.13,0xaeb7a3);
      B('eastParkWarm',rootX,1.518,z-s*.414,.20,.047,.115,0xc3bb8d);
      for(const v of [-1,1])B('bark',rootX+v*.47,.66,z+v*.17,.63,.19,.27,0xb6a178);
      for(const u of [-.52,.40])rush(rootX+u,.58,z+s*.20,.76,Math.floor(x+u));
    }
    const lobes=[];
    for(const [dz,y,width,depth] of [[-2.95,4.53,3.20,2.02],[-1.73,5.19,3.54,1.95],[-.54,5.61,3.83,1.97],[.71,5.43,3.6,1.93],[1.89,5.03,3.19,1.84],[2.98,4.57,2.90,1.61]]){
      const xx=flip*.19*dz;
      lobes.push([xx,y,dz,width*.51,.76,depth*.68],[xx+flip*.77,y-.49,dz+.32,.80,.76,.77]);
      C(x+xx,y,50.57+dz,width,.72,depth,'willow-canopy');
    }
    voxelCrown({box:B,panel},crown,[x,0,50.57],lobes,Math.round(x),
      [0x91a984,0xb2c49a,0xccd698,0xd7dfaa,0xe5e7b3]);
  }

  // Three broad seats under the terrace faces suit a person at boardwalk height.
  for(const [x,z,angle] of [[104.62,43.95,0],[107.35,60.04,0],[118.63,41.0,Math.PI/2]]){
    B('eastParkTimber',x,.58,z,1.48,.14,.35,0xb9a282,angle);
  }

  return [
    [107.65,2.42,46.28,'#e7d4a1',25,8],
    [109.28,1.62,48.70,'#c9c393',20,7.5],
    [117.95,1.62,52.45,'#b6cbb2',17,7.0],
  ];
}
