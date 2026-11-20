import * as T from 'three';
import {paintDistrictAtlas} from './nyc-street-ad-district.js';

// Coordinates are backing-store pixels. Gutters keep unrelated lit signs
// apart through the first mip levels, including on a double-sided blade.
const signs=[
  ['courier','云栈快递',0x82ddd2,'#173d44',8,8,480,160],
  ['deli','夜班热卤',0xffad76,'#802f2c',8,188,480,160],
  ['repair','重明维修',0xffcd78,'#253b40',8,368,480,160],
  ['pharmacy','晚班药房',0x9de4b5,'#175049',8,548,480,160],
  ['optics','弧光义眼',0xf89ccd,'#37293f',505,8,114,342],
  ['tea','回甘茶档',0xffc68c,'#63352d',636,8,114,342],
  ['photo','织影照相',0xdcb0ee,'#503a63',767,8,114,342],
  ['keys','芯钥配制',0x92def0,'#183a50',898,8,114,342],
  ['battery','夜航换电',0xffcd72,'#283d45',509,376,232,290],
  ['rail','末班接驳',0x88dee3,'#173d54',769,376,232,290],
  ['signal','隔街通话',0xf5a2ba,'#572e45',509,697,232,290],
  ['recycle','旧芯回收',0xa9e3c7,'#214c4a',769,697,232,290],
  ['gridPower','夜航换电',0xffc37b,'#243747',8,725,420,140],
  ['lastTrain','东环线末班车',0x92e4da,'#152c36',8,877,420,140]
];

const paper='#fff0d1',cream='#ffe6ac',white='#e9fff9',aqua='#8edfd7',pink='#ffaccb';
const sans='"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif';
const serif='"STZhongsong","Songti SC","Noto Serif CJK SC","SimSun",serif';
function rect(g,x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h);}
function label(g,string,x,y,size,color,{font=sans,weight=700,align='left',limit}={}){
  g.font=weight+' '+size+'px '+font;g.fillStyle=color;g.textAlign=align;g.textBaseline='middle';
  if(limit)g.fillText(string,x,y,limit);else g.fillText(string,x,y);
}
function path(g,points,color,width=4,fill=false){
  g.beginPath();
  for(let i=0;i<points.length;i++){
    if(i)g.lineTo(...points[i]);else g.moveTo(...points[i]);
  }
  if(fill){g.closePath();g.fillStyle=color;g.fill();return;}
  g.strokeStyle=color;g.lineWidth=width;g.lineJoin='miter';g.lineCap='square';g.stroke();
}

// Original stepped tube pictograms drawn in a shared 64-unit fabrication grid.
function symbol(g,id,x,y,size,color){
  g.save();g.translate(x,y);g.scale(size/64,size/64);
  const line=(p,w=4)=>path(g,p,color,w);
  switch(id){
    case 'courier':
      line([[6,26],[30,14],[55,25],[31,38],[6,26],[6,44],[31,57],[55,44],[55,25]]);
      line([[31,38],[31,54]]);line([[17,20],[42,32]]);line([[3,15],[14,15]],3);break;
    case 'deli':
    case 'tea':
      line([[8,35],[56,35],[52,45],[46,45],[46,51],[17,51],[17,46],[12,46],[8,35]]);
      line([[20,56],[43,56]],3);line([[20,27],[20,21],[25,17],[25,10]]);
      line([[35,28],[35,19],[40,15],[40,6]]);break;
    case 'repair':
      line([[11,51],[30,32],[25,26],[25,17],[32,10],[39,9],[35,18],[41,24],[50,19],[49,29],[42,36],[35,36],[17,55],[11,51]],4);break;
    case 'pharmacy':
      path(g,[[25,6],[39,6],[39,24],[57,24],[57,38],[39,38],[39,56],[25,56],[25,38],[7,38],[7,24],[25,24]],color,0,true);break;
    case 'optics':
      line([[4,31],[12,31],[19,21],[45,21],[53,31],[61,31],[49,42],[17,42],[4,31]],3);
      line([[27,25],[37,25],[40,30],[40,35],[35,39],[28,39],[24,35],[24,30],[27,25]],3);break;
    case 'photo':
      line([[5,22],[19,22],[23,15],[42,15],[45,22],[58,22],[58,50],[5,50],[5,22]]);
      line([[22,29],[27,25],[39,25],[43,30],[43,40],[38,44],[28,44],[22,39],[22,29]],3);break;
    case 'keys':
      line([[8,22],[14,14],[28,14],[35,21],[35,28],[54,46],[54,52],[47,52],[43,48],[43,43],[38,43],[28,34],[16,34],[8,28],[8,22]]);
      rect(g,16,21,8,6,color);break;
  }
  g.restore();
}

function electronicBanner(g,id){
  if(id==='gridPower'){
    path(g,[[0,0],[195,0],[150,54],[150,96],[85,160],[0,160]],'#92d8c7',0,true);
    // The cartridge shares its clipped silhouette with the swap cabinet campaign.
    path(g,[[26,54],[73,29],[116,46],[70,72]],'#eaf3c8',0,true);
    path(g,[[26,54],[70,72],[70,129],[26,110]],'#3b6771',0,true);
    path(g,[[70,72],[116,46],[116,102],[70,129]],'#27404b',0,true);
    for(let i=0;i<3;i++)path(g,[[77+12*i,77-7*i],[84+12*i,73-7*i],[84+12*i,103-7*i],[77+12*i,108-7*i]],'#ffd37f',0,true);
    rect(g,203,16,7,17,'#eabb73');
    label(g,'夜航能源  /  街区供电伙伴',216,25,17,'#ddc999',{limit:247});
    label(g,'夜航换电',164,82,65,paper,{limit:299});
    path(g,[[146,122],[299,122],[311,114],[463,114]],'#88b8ad',3);
    label(g,'夜班骑手  ·  全天自助换电',156,140,20,'#b6ddd3',{limit:305});
  }else{
    rect(g,0,0,480,36,'#8ed9cc');label(g,'东环线',14,18,24,'#193b42');
    label(g,'公共交通  /  夜间站务',463,18,17,'#193b42',{align:'right'});
    rect(g,12,56,9,56,'#f3c273');label(g,'末班车',36,85,51,cream);
    label(g,'00:35',464,85,69,'#c5ffdf',{font:'Consolas,monospace',align:'right'});
    rect(g,13,123,452,2,'#447079');label(g,'东厅候车',15,143,19,'#c1dcd4');
    label(g,'开往南枢纽',464,143,19,'#c1dcd4',{align:'right'});
  }
}

function fascia(g,id){
  if(id==='courier'){
    path(g,[[0,0],[137,0],[104,160],[0,160]],'#91dcd0',0,true);
    symbol(g,id,8,22,94,'#1e5054');
    label(g,'云栈快递',142,66,71,white,{limit:317});
    path(g,[[146,109],[211,109],[223,100],[458,100]],'#60a8a7',3);
    label(g,'无人柜寄取  ·  通宵开放',146,131,23,'#b8e2d9');
  }else if(id==='deli'){
    rect(g,0,6,480,5,'#ef9868');rect(g,0,148,480,5,'#ef9868');
    symbol(g,id,11,24,96,cream);
    label(g,'夜班热卤',120,67,78,paper,{font:serif,limit:335});
    label(g,'慢火出锅',126,127,25,cream);
    path(g,[[253,126],[318,126]],'#df8058',3);
    label(g,'营业至 03:00',333,127,19,paper);
  }else if(id==='repair'){
    rect(g,9,12,461,101,'#e8bd73');
    label(g,'重明维修',26,62,73,'#233440',{limit:322});
    symbol(g,id,379,17,89,'#3c4948');
    for(let i=0;i<4;i++)path(g,[[9+i*18,145],[21+i*18,125]],'#deae62',7);
    label(g,'旧机检修  /  电路换件',108,139,24,'#d8e8df');
  }else{
    rect(g,84,16,3,128,'#75bd9c');symbol(g,id,7,24,73,'#a0f3ba');
    label(g,'24h',42,120,28,'#ccecd3',{align:'center'});
    label(g,'晚班药房',110,65,71,white,{limit:338});
    label(g,'夜间值守',115,124,27,'#a7eac1');
    path(g,[[257,124],[285,124],[296,113],[303,137],[316,119],[327,124],[447,124]],'#90dba9',4);
  }
}

function blade(g,id,title){
  const styles={
    optics:[pink,white,'验配',false],
    tea:[cream,paper,'热饮',true],
    photo:['#e5bdf2','#fff2e8','冲印',true],
    keys:['#8bdcea',white,'读写',false]
  };
  const [accent,main,foot,isSerif]=styles[id];
  if(id==='optics'){
    path(g,[[7,340],[7,38],[23,16],[96,16]],accent,3);
    path(g,[[110,58],[110,326],[94,343],[20,343]],accent,3);
  }else if(id==='tea'){
    rect(g,0,0,120,8,accent);rect(g,0,352,120,8,accent);
    rect(g,10,14,2,330,'#b77751');rect(g,108,14,2,330,'#b77751');
  }else if(id==='photo'){
    for(let y=10;y<355;y+=27){rect(g,4,y,7,13,'#c4a7cc');rect(g,109,y,7,13,'#c4a7cc');}
  }else{
    path(g,[[0,18],[70,18],[82,7],[119,7]],accent,4);
    path(g,[[4,323],[36,323],[49,336],[118,336]],accent,3);
  }
  symbol(g,id,33,15,54,accent);
  [...title].forEach((ch,i)=>label(g,ch,60,91+i*62,59,main,{align:'center',font:isSerif?serif:sans}));
  label(g,foot,60,322,21,accent,{align:'center'});
}

function poster(g,id){
  if(id==='battery'){
    path(g,[[0,0],[239,0],[239,139],[159,175],[0,120]],'#d3aa6b',0,true);
    label(g,'夜航',14,44,48,'#233942',{font:serif});
    // A see-through three-quarter battery cartridge, with the cell stack exposed.
    path(g,[[66,100],[126,68],[191,91],[127,128]],'#dae4d0',0,true);
    path(g,[[66,100],[127,128],[127,198],[66,167]],'#3b6470',0,true);
    path(g,[[127,128],[191,91],[191,159],[127,198]],'#203c47',0,true);
    for(let i=0;i<4;i++)path(g,[[138+i*12,132-i*7],[144+i*12,129-i*7],[144+i*12,167-i*7],[138+i*12,171-i*7]],'#f5c66a',0,true);
    label(g,'电池换新',13,227,49,paper,{limit:214});
    label(g,'楼下换电柜 · 即换即走',15,276,17,'#e5bf80');
  }else if(id==='rail'){
    label(g,'末班接驳',13,44,46,white,{limit:216});
    path(g,[[0,192],[56,192],[111,131],[165,131],[204,92],[240,92]],'#82dedb',9);
    path(g,[[0,210],[60,210],[119,145],[174,145],[215,104],[240,104]],'#5e849e',4);
    for(const [x,y] of [[54,192],[112,131],[203,92]]){
      rect(g,x-7,y-7,14,14,'#effbdc');rect(g,x-3,y-3,6,6,'#3b6f7f');
    }
    label(g,'错过末班车？',14,240,27,paper);
    label(g,'去东厅夜班候车点',15,278,20,'#c2e9df');
  }else if(id==='signal'){
    label(g,'隔街',14,53,60,paper,{font:serif});label(g,'通话',14,117,60,paper,{font:serif});
    for(let i=0;i<4;i++){
      const h=[46,94,129,74][i];rect(g,136+i*23,159-h,12,h,i===2?'#ffe3bb':'#e887a8');
    }
    path(g,[[17,185],[59,185],[68,175],[86,204],[100,159],[112,189],[125,185],[221,185]],pink,4);
    label(g,'只传声音',15,235,38,'#fff0cc');
    label(g,'巷口公话  /  按次接通',15,278,18,'#f5c4ce');
  }else{
    rect(g,0,0,240,54,'#a4d5b8');label(g,'街道循环站',13,27,30,'#25494a');
    // A stepped circuit board against a reverse-trace recovery arrow.
    path(g,[[66,111],[92,85],[164,85],[176,97],[176,158],[153,180],[66,180]],'#6da68d',0,true);
    rect(g,92,108,49,46,'#264d4b');
    for(let i=0;i<4;i++){rect(g,84,115+i*9,8,3,'#dfddae');rect(g,141,115+i*9,17+i*2,3,'#dfddae');}
    path(g,[[188,113],[202,127],[202,166],[179,191],[97,191]],'#d1e8bd',6);
    path(g,[[108,179],[95,191],[108,203]],'#d1e8bd',6);
    label(g,'旧芯回收',14,235,47,white,{limit:215});
    label(g,'废旧终端请投专用柜',15,277,18,'#b7e5c9');
  }
}

export function createStreetAdAtlas(renderer){
  const canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=2048;
  const g=canvas.getContext('2d',{alpha:false});
  rect(g,0,0,1024,2048,'#1c2b32');
  const tiles={};
  for(const [id,title,glow,bg,x,y,w,h] of signs){
    rect(g,x-5,y-5,w+10,h+10,bg);
    g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
    g.translate(x,y);
    const horizontal=w>h,vertical=h>w*2;
    const dw=horizontal?480:vertical?120:240,dh=horizontal?160:vertical?360:300;
    g.scale(w/dw,h/dh);
    if(id==='gridPower'||id==='lastTrain')electronicBanner(g,id);
    else if(horizontal)fascia(g,id);
    else if(vertical)blade(g,id,title);
    else poster(g,id);
    g.restore();
    tiles[id]={title,glow,aspect:w/h,u0:(x+.5)/1024,u1:(x+w-.5)/1024,v0:1-(y+h-.5)/2048,v1:1-(y+.5)/2048};
  }
  paintDistrictAtlas(g,tiles);
  const texture=new T.CanvasTexture(canvas);
  texture.name='街头广告 / 店招与电子灯片';texture.colorSpace=T.SRGBColorSpace;
  texture.anisotropy=Math.min(4,renderer?.capabilities?.getMaxAnisotropy?.()||1);
  return {texture,tiles};
}
