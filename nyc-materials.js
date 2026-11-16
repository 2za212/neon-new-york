import {coatStreetVehicle} from './nyc-wet-emitters.js';
import * as T from 'three';
import {randomSource} from './nyc-geometry.js';

// Original, deterministic, local material sources. No network texture dependency.
export function createNYCMaterials(renderer) {
  const random=randomSource(9213), mats={};
  const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  function canvas(size=512){const c=document.createElement('canvas');c.width=c.height=size;return c;}
  function texture(c,color=true){const t=new T.CanvasTexture(c);if(color)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=anisotropy;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.NearestFilter;return t;}
  function rgba(color,f=1){const h=new T.Color(color).getHex();return `rgb(${Math.min(255,Math.round((h>>16&255)*f))},${Math.min(255,Math.round((h>>8&255)*f))},${Math.min(255,Math.round((h&255)*f))})`;}
  function material(name,opts={}){const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.83,...opts});m.name=name;return m;}
  function noise(g,size,count,alpha=.1){for(let i=0;i<count;i++){const v=random()>.5?255:0;g.fillStyle=`rgba(${v},${v},${v},${alpha*random()})`;g.fillRect(Math.floor(random()*size),Math.floor(random()*size),1+Math.floor(random()*3),1+Math.floor(random()*3));}}
  function masonry(key,base,mortar,kind='brick') {
    const c=canvas(),g=c.getContext('2d'),h=canvas(),hg=h.getContext('2d');
    g.fillStyle=mortar;g.fillRect(0,0,512,512);hg.fillStyle='#555';hg.fillRect(0,0,512,512);
    const bw=kind==='brick'?128:256,bh=kind==='brick'?64:128;
    for(let row=-1;row<512/bh+1;row++)for(let col=-1;col<512/bw+1;col++) {
      const x=col*bw+(row%2)*bw/2,y=row*bh;
      const shade=.83+random()*.31;g.fillStyle=rgba(base,shade);g.fillRect(x+2,y+2,bw-4,bh-4);
      g.fillStyle='rgba(255,218,173,.09)';g.fillRect(x+3,y+3,bw-7,3);
      g.fillStyle='rgba(18,11,8,.2)';g.fillRect(x+3,y+bh-6,bw-7,3);
      hg.fillStyle=`rgb(${205+Math.floor(random()*35)},${205},${205})`;hg.fillRect(x+3,y+3,bw-6,bh-6);
    }
    noise(g,512,18000,.10);
    // Short, vertically streaked weathering preserves masonry readability.
    for(let i=0;i<80;i++){g.fillStyle=`rgba(22,20,16,${random()*.09})`;g.fillRect(random()*512,random()*512,1+random()*6,10+random()*80);}
    const m=material('NYC '+key,{map:texture(c),bumpMap:texture(h,false),bumpScale:kind==='brick'?.025:.035,roughness:.89});
    m.userData.textureMeters=kind==='brick'?1.6:2.4;mats[key]=m;
  }
  masonry('brick','#b6694a','#605951');masonry('brickBrown','#885440','#55514b');masonry('stone','#b4ab98','#777367','stone');
  function surface(key,base,grain=24000,roughness=.9,meters=2,draw) {
    const c=canvas(),g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,512,512);noise(g,512,grain,.14);draw?.(g);
    const rough=canvas(256),rg=rough.getContext('2d');rg.fillStyle=rgba('#ffffff',roughness);rg.fillRect(0,0,256,256);noise(rg,256,9000,.1);
    const m=material('NYC '+key,{map:texture(c),roughnessMap:texture(rough,false),roughness:1});m.userData.textureMeters=meters;mats[key]=m;
  }
  surface('concrete','#88877d',26000,.91,2,g=>{g.strokeStyle='rgba(35,40,36,.38)';g.lineWidth=3;for(let j=0;j<4;j++){g.beginPath();g.moveTo(0,j*128);g.lineTo(512,j*128);g.stroke();}for(let i=0;i<4;i++){g.beginPath();g.moveTo(i*128,0);g.lineTo(i*128,512);g.stroke();}for(let i=0;i<90;i++){g.fillStyle='rgba(28,32,27,.18)';g.fillRect(random()*512,random()*512,1+random()*5,1+random()*3);}});
  surface('paver','#858a87',19000,.83,2.4,g=>{g.strokeStyle='rgba(33,36,34,.48)';g.lineWidth=4;for(let j=0;j<8;j++){g.beginPath();g.moveTo(0,j*64);g.lineTo(512,j*64);g.stroke();for(let i=0;i<4;i++){g.beginPath();g.moveTo(i*128+(j%2)*64,j*64);g.lineTo(i*128+(j%2)*64,j*64+64);g.stroke();}}});
  surface('asphalt','#303a41',44000,.69,3,g=>{for(let i=0;i<1100;i++){const s=1+random()*3;g.fillStyle=random()>.4?'rgba(189,184,161,.22)':'rgba(0,0,0,.14)';g.fillRect(random()*512,random()*512,s,s);}g.strokeStyle='rgba(10,17,20,.6)';g.lineWidth=1;g.beginPath();g.moveTo(50,0);for(let i=0;i<10;i++)g.lineTo(50+random()*70,i*60);g.stroke();});
  surface('roof','#4d5352',10000,.96,3,g=>{g.strokeStyle='#303a3c';g.lineWidth=3;for(let y=0;y<512;y+=128){g.beginPath();g.moveTo(0,y);g.lineTo(512,y);g.stroke();}});
  surface('metal','#464f51',13000,.64,1,g=>{for(let i=0;i<60;i++){g.fillStyle=`rgba(135,72,32,${random()*.18})`;g.fillRect(random()*512,random()*512,3+random()*20,1+random()*25);}});mats.metal.metalness=.32;
  surface('wood','#8b6641',8000,.88,1.5,g=>{for(let i=0;i<350;i++){const x=random()*512;g.strokeStyle=`rgba(${random()>.6?'204,159,92':'30,20,12'},${.08+random()*.24})`;g.lineWidth=1+random()*3;g.beginPath();g.moveTo(x,0);for(let y=0;y<=512;y+=32)g.lineTo(x+Math.sin(y*.025+i)*3,y);g.stroke();}for(let x=0;x<512;x+=64){g.fillStyle='#3d3327';g.fillRect(x,0,3,512);}});
  surface('grass','#496647',22000,.99,1.5,g=>{for(let i=0;i<1000;i++){g.fillStyle=random()>.5?'rgba(151,169,89,.2)':'rgba(18,39,22,.23)';g.fillRect(random()*512,random()*512,2,4+random()*8);}});
  surface('bark','#65503a',15000,.99,1,g=>{for(let x=0;x<512;x+=10){g.fillStyle='rgba(22,21,15,.22)';g.fillRect(x+random()*5,0,2,512);}});
  mats.leaf=material('NYC voxel foliage',{color:0x6e8953,roughness:.95});
  const leaves=canvas(128),lg=leaves.getContext('2d');
  lg.fillStyle='#bccaa8';lg.fillRect(0,0,128,128);
  for(let i=0;i<380;i++){
    const x=Math.floor(random()*64)*2,y=Math.floor(random()*64)*2;
    lg.fillStyle=['#839984','#d0d1ae','#a5bf9d','#95ac88'][i%4];
    lg.fillRect(x,y,4+Math.floor(random()*4)*2,3);
    lg.fillRect(x+2,y-2,5,2);
  }
  mats.leaf.map=texture(leaves);mats.leaf.userData.textureMeters=.46;
  mats.darkLeaf=material('NYC dark voxel foliage',{color:0x405a3f,roughness:1});
  // Derived canopy materials retain this semantic flag when renamed, so the
  // small-fitting distance budget never strips a distant tree's crown.
  mats.leaf.userData.canopyShading=mats.darkLeaf.userData.canopyShading=true; mats.leaf.userData.keepDistant=true;mats.darkLeaf.userData.keepDistant=true;
  mats.trim=material('NYC aged limestone trim',{color:0xa9a591,roughness:.92});
  mats.white=material('NYC faded road paint',{color:0xc8c5af,roughness:.78});
  mats.white.userData.castShadow=false;
  mats.yellow=material('NYC warm traffic yellow',{color:0xc29e42,roughness:.68});
  mats.yellow.userData.castShadow=false;
  mats.taxi=material('NYC aged ochre taxi enamel',{color:0xc49a43,roughness:.48,metalness:.28});
  coatStreetVehicle(mats.taxi);
  mats.rubber=material('NYC rubber and tar',{color:0x161c20,roughness:.92});
  mats.tailLight=material('NYC red brake lenses',{color:0x7b302a,emissive:0x8d231c,emissiveIntensity:.35,roughness:.4});mats.tailLight.userData.castShadow=false;
  // Window interiors are substantially darker than their frames, including in
  // daylight. Curtains, blind bands and a sill shadow avoid flat glowing cards.
  function windowMap(lit=false,cool=false){
    const c=canvas(128),g=c.getContext('2d');
    for(let y=0;y<128;y++){
      const fade=.52+.31*Math.sin(y/128*Math.PI),h=lit?(cool?'#728b8d':'#ad8957'):'#233b43';
      g.fillStyle=rgba(h,fade);g.fillRect(0,y,128,1);
    }
    g.fillStyle=lit?'rgba(23,29,27,.28)':'rgba(8,18,25,.4)';g.fillRect(0,0,15,128);g.fillRect(110,0,18,128);g.fillRect(0,0,128,15);
    g.fillStyle=lit?'rgba(202,182,133,.18)':'rgba(124,155,161,.09)';g.fillRect(20,18,23,104);g.fillRect(88,18,15,104);
    for(let y=30;y<112;y+=12){g.fillStyle='rgba(5,15,18,.19)';g.fillRect(14,y,100,2);}
    if(lit){
      // Lit rooms have a ceiling, pendant, shelving and a dark sill.
      // All panes still share one small atlas per colour temperature.
      g.fillStyle=cool?'#647e86':'#ba895d';g.fillRect(17,21,92,75);
      g.fillStyle=cool?'#acc8c3':'#f0bd80';g.fillRect(19,21,87,3);
      g.fillStyle='#514d49';g.fillRect(69,21,2,17);
      g.fillStyle=cool?'#c6dfd9':'#ffdc99';g.fillRect(65,38,11,3);g.fillRect(60,41,21,4);
      g.fillStyle=cool?'#39474f':'#6c5041';g.fillRect(20,74,38,3);g.fillRect(85,63,22,2);
      for(let j=0;j<8;j++){
        const h=5+(j*7)%12;g.fillStyle=['#7c675a','#494c50','#9f7961'][j%3];
        g.fillRect(21+j*4,74-h,3,h);
      }
      g.fillStyle='#41474a';g.fillRect(70,85,33,3);g.fillRect(74,88,3,13);g.fillRect(98,88,3,13);
    }
    g.fillStyle='rgba(7,16,19,.45)';g.fillRect(0,117,128,11);
    return texture(c);
  }
  mats.glass=material('NYC dark recessed smoked glass',{color:0xffffff,map:windowMap(),roughness:.37,metalness:.16,envMapIntensity:.22});mats.glass.userData.unitUV=true;
  const warmMap=windowMap(true),coolMap=windowMap(true,true);
  mats.warmWindow=material('NYC inhabited curtained windows',{color:0xffffff,map:warmMap,emissiveMap:warmMap,emissive:0xffbd7d,emissiveIntensity:.26,roughness:.58,envMapIntensity:.15});mats.warmWindow.userData.castShadow=false;mats.warmWindow.userData.unitUV=true;
  mats.coolWindow=material('NYC dim cool interior windows',{color:0xffffff,map:coolMap,emissiveMap:coolMap,emissive:0x8fbfc4,emissiveIntensity:.18,roughness:.48,envMapIntensity:.15});mats.coolWindow.userData.castShadow=false;mats.coolWindow.userData.unitUV=true;
  mats.cyan=material('NYC cyan emitters',{color:0x61e9eb,emissive:0x28dce3,emissiveIntensity:3.2,roughness:.38});mats.cyan.userData.castShadow=false;
  mats.magenta=material('NYC magenta emitters',{color:0xf583be,emissive:0xe0359b,emissiveIntensity:2.8,roughness:.38});mats.magenta.userData.castShadow=false;
  mats.lamp=material('NYC amber lamp glass',{color:0xcdb88f,emissive:0xffc273,emissiveIntensity:1.05,roughness:.45});mats.lamp.userData.castShadow=false;
  mats.green=material('NYC subway green',{color:0x315c4e,metalness:.4,roughness:.58});
  mats.puddle=material('NYC thin damp asphalt patches',{color:0x344958,metalness:.04,roughness:.32,transparent:true,opacity:.28,depthWrite:false});mats.puddle.userData.castShadow=false;
  const patina=randomSource(61921);
  const paint=canvas(256),pg=paint.getContext('2d');
  pg.fillStyle='#678478';pg.fillRect(0,0,256,256);
  for(let i=0;i<480;i++){
    const x=Math.floor(patina()*128)*2,y=Math.floor(patina()*128)*2;
    const w=2+Math.floor(patina()*3)*2,h=2+Math.floor(patina()*3);
    pg.fillStyle=i%4?'#507268':'#9b7152';pg.fillRect(x,y,w,h);
    if(i%4===0){pg.fillStyle='#a58f70';pg.fillRect(x,y,w*.56,1);}
  }
  mats.castEnamel=material('NYC chipped cast enamel',{map:texture(paint),roughness:.58,metalness:.23});
  const granite=canvas(256),cg=granite.getContext('2d');
  cg.fillStyle='#ada99d';cg.fillRect(0,0,256,256);
  for(let i=0;i<4500;i++){
    cg.fillStyle=['#918e87','#bdb9a9','#a29d94','#ccc3ae'][i%4];
    cg.fillRect(patina()*256,patina()*256,1+patina()*3,1+patina()*2);
  }
  mats.curbStone=material('NYC granite curb',{map:texture(granite),roughness:.86});
  mats.curbStone.userData.textureMeters=.74;
  const shadowTile=document.createElement('canvas');shadowTile.width=shadowTile.height=64;
  const sg=shadowTile.getContext('2d');
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const dx=Math.abs((x+.5)/32-1),dy=Math.abs((y+.5)/32-1);
    const edge=Math.pow(dx,4)+Math.pow(dy,4);
    sg.fillStyle='rgba(12,17,24,'+(.54*Math.pow(Math.max(0,1-edge),2))+')';
    sg.fillRect(x,y,1,1);
  }
  const shadeMap=new T.CanvasTexture(shadowTile);
  shadeMap.colorSpace=T.SRGBColorSpace;
  mats.trafficContact=new T.MeshBasicMaterial({map:shadeMap,transparent:true,depthWrite:false});
  mats.trafficContact.name='NYC parked chassis contact';
  mats.trafficContact.userData.castShadow=false;
  const grain=canvas(256),gg=grain.getContext('2d'),saw=randomSource(12071);
  gg.fillStyle='#bb9972';gg.fillRect(0,0,256,256);
  for(let i=0;i<2000;i++){
    const x=Math.floor(saw()*256),y=Math.floor(saw()*256);
    gg.fillStyle=i%3?'rgba(92,67,48,.20)':'rgba(235,217,176,.28)';
    const len=3+Math.floor(saw()*35);
    gg.fillRect(x,y,len,1);if(x+len>256)gg.fillRect(x-256,y,len,1);
  }
  mats.freightTimber=material('NYC sawn packing boards',{map:texture(grain),roughness:.88});
  mats.freightTimber.userData.grainAlongLength=true;
  mats.freightTimber.userData.textureMeters=.85;
  return mats;
}

export function createSignTexture(title,subtitle,color='#66e4e9',vertical=false) {
  const c=document.createElement('canvas');c.width=vertical?256:1024;c.height=vertical?1024:256;const g=c.getContext('2d');
  g.fillStyle='#0b1720';g.fillRect(0,0,c.width,c.height);
  const storefront=!vertical && /DELI|COFFEE|RECORD|BOOK|FLOWER|CAFE|TAILOR|FABRIC/i.test(title);
  if(storefront){
    const record=/RECORD|BOOK/i.test(title);
    g.fillStyle=record?'#48312d':'#164344';g.fillRect(0,0,c.width,c.height);
    g.fillStyle=color;g.fillRect(22,32,7,c.height-64);
    g.textAlign='left';g.textBaseline='middle';g.font=record?'bold 96px Georgia':'bold 88px sans-serif';
    g.fillText(title,58,105,c.width-98);g.font='28px monospace';g.fillText(subtitle,60,196,c.width-108);
    const sign=new T.CanvasTexture(c);sign.colorSpace=T.SRGBColorSpace;sign.anisotropy=4;return sign;
  }
  g.fillStyle=color;g.fillRect(12,12,c.width-24,5);g.fillRect(12,c.height-17,c.width-24,5);
  g.textAlign='center';g.textBaseline='middle';g.font=`700 ${vertical?95:94}px monospace`;
  if(vertical){Array.from(title).forEach((char,i)=>g.fillText(char,c.width/2,125+i*120,220));}
  else g.fillText(title,c.width/2,106,c.width-68);
  g.globalAlpha=.76;g.font=`500 ${vertical?22:30}px monospace`;g.fillText(subtitle,c.width/2,c.height-55,c.width-45);
  g.globalAlpha=.1;g.fillStyle='#fff';for(let y=0;y<c.height;y+=5)g.fillRect(0,y,c.width,1);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.LinearFilter;
  return t;
}
