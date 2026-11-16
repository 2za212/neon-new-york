import * as T from 'three';

// Original graphic artwork authored for this district. Each display uses an
// illustration plus a short message; no remote image or font dependency.
export function createCyberDisplay(kind='nexus') {
  const portrait=kind==='after',bridge=kind==='bridge';
  const c=document.createElement('canvas');
  c.width=portrait?768:1024;c.height=portrait?1024:bridge?128:kind==='transit'?512:768;
  const g=c.getContext('2d'),w=c.width,h=c.height;
  const cyan='#63e5ec',pink='#ef77b8',white='#d9e7de',muted='#748f9c';
  function rect(x,y,width,height,color){g.fillStyle=color;g.fillRect(x,y,width,height);}
  function poly(points,color,stroke=null,line=3){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(color){g.fillStyle=color;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=line;g.stroke();}}
  function line(points,color,width=3){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.stroke();}
  function text(value,x,y,size,color=white,weight=700,align='left'){g.textAlign=align;g.textBaseline='middle';g.font=`${weight} ${size}px monospace`;g.fillStyle=color;g.fillText(value,x,y);}
  function circle(x,y,r,color,width=3,fill=false){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.lineWidth=width;g.strokeStyle=color;if(fill){g.fillStyle=color;g.fill();}else g.stroke();}
  function barcode(x,y,width=180){for(let i=0;i<35;i++)rect(x+i*width/35,y,(i%3)+1,25,muted);}
  rect(0,0,w,h,'#07141e');
  // Deliberate sparse technical structure, kept subordinate to the illustration.
  for(let x=32;x<w;x+=64)rect(x,0,1,h,'#102b39');
  for(let y=32;y<h;y+=64)rect(0,y,w,1,'#102b39');
  rect(20,20,w-40,3,kind==='after'?pink:cyan);rect(20,h-23,w-40,3,kind==='after'?pink:cyan);
  if(kind==='nexus'){
    text('NEXUS',49,119,93,white,800);text('HUMAN / NEXT',52,197,29,cyan);
    text('NEURAL',53,333,43,cyan);text('REBUILD',53,385,43,cyan);
    text('SAME SOUL.',53,496,28,white,500);text('NEW SIGNAL.',53,535,28,white,500);
    rect(53,595,265,43,'#1b4c5b');text('OPEN 24 / 7',72,617,25,cyan);
    barcode(53,681,220);text('NY / 2086',341,695,18,muted);
    // Stepped mechanical head in three material planes, made from pixel polygons.
    poly([[578,122],[728,122],[728,149],[791,149],[791,192],[823,192],[823,298],[849,298],[849,346],[820,346],[820,452],[787,452],[787,518],[731,518],[731,561],[601,561],[601,520],[558,520],[558,451],[534,451],[534,220],[551,220],[551,164],[578,164]],'#2d6675',cyan,4);
    poly([[628,145],[728,145],[728,171],[775,171],[775,216],[799,216],[799,293],[765,293],[765,422],[731,422],[731,494],[677,494],[677,520],[628,520]],'#7bb9b8');
    poly([[578,188],[627,188],[627,520],[600,520],[600,483],[577,483],[577,420],[555,420],[555,236],[578,236]],'#164653');
    rect(641,294,137,28,'#05141e');rect(650,301,113,7,cyan);
    rect(705,355,82,11,'#153640');rect(650,433,98,9,'#183f4b');rect(681,454,67,7,'#183f4b');
    for(let i=0;i<6;i++){rect(567,248+i*28,42,8,cyan);circle(579,252+i*28,3,'#c6fcf1',1,true);}
    line([[622,174],[668,174],[668,215],[702,215]],'#d0e8d7',4);
    line([[627,470],[648,470],[648,489],[674,489]],cyan,4);
    for(const [xx,yy]of [[803,238],[807,385],[700,155],[574,446]])circle(xx,yy,8,'#9ad7cc',3);
    poly([[601,563],[728,563],[728,608],[810,608],[810,637],[891,637],[891,691],[480,691],[480,637],[540,637],[540,608],[601,608]],'#22515d',cyan,4);
    for(let i=0;i<4;i++)rect(621+i*23,568,10,67,'#74b3b7');
    line([[850,213],[931,213],[931,153],[967,153]],cyan,3);text('A / 07',904,134,18,muted);
    line([[848,461],[936,461],[936,529]],cyan,3);circle(936,540,8,cyan,3);
  }else if(kind==='after'){
    text('AFTER',42,830,99,white,800);text('HOURS',42,925,99,pink,800);
    text('MEMORY EXCHANGE',43,76,31,pink);text('KEEP WHAT MATTERS',43,122,23,muted,500);
    // An abstract adult profile, divided into faceted memory cells.
    poly([[286,190],[425,190],[425,212],[485,212],[485,252],[519,252],[519,324],[543,324],[543,368],[514,368],[514,453],[480,453],[480,495],[427,495],[427,565],[290,565],[290,516],[256,516],[256,445],[232,445],[232,288],[252,288],[252,224],[286,224]],'#693751',pink,4);
    poly([[334,212],[422,212],[422,236],[467,236],[467,276],[495,276],[495,332],[458,332],[458,431],[426,431],[426,493],[387,493],[387,528],[333,528]],'#c17f94');
    poly([[271,250],[329,250],[329,528],[291,528],[291,486],[269,486]],'#3c2c46');
    rect(350,326,146,24,'#191c30');rect(364,334,108,6,'#ffd4e1');
    rect(390,436,69,8,'#4d2d48');
    for(let row=0;row<5;row++)for(let col=0;col<3;col++){
      const xx=249+col*23,yy=281+row*32;
      rect(xx,yy,15,18,(row+col)%3===0?'#d49ab0':'#8e506e');
      line([[xx+15,yy+9],[xx+22,yy+9],[xx+22,yy+32]],'#b47392',2);
    }
    poly([[290,568],[426,568],[426,603],[495,603],[495,627],[583,627],[583,718],[183,718],[183,627],[236,627],[236,603],[290,603]],'#442c48',pink,4);
    for(let i=0;i<6;i++)rect(308+i*18,569,8,64,'#a26a87');
    circle(405,667,31,pink,3);circle(405,667,17,'#f0b9c8',2);
    line([[553,271],[641,271],[641,237],[704,237]],pink,3);circle(641,268,5,pink,2,true);
    line([[217,442],[134,442],[134,515],[75,515]],pink,3);text('M / 108',48,550,18,muted);
    barcode(586,978,132);text('NO. 0081',49,982,20,muted);
  }else if(kind==='transit'){
    text('NORTHLINE',46,96,70,white,800);text('MOVE BEYOND',49,158,26,cyan,500);
    const a=[[64,371],[237,371],[325,283],[528,283],[609,364],[832,364],[934,262]];
    const b=[[64,403],[251,403],[339,315],[515,315],[596,396],[848,396],[957,287]];
    line(a,cyan,13);line(b,'#b875aa',6);
    for(const [xx,yy]of [[237,371],[528,283],[832,364],[934,262]]){circle(xx,yy,19,'#07141e',1,true);circle(xx,yy,13,cyan,6);}
    text('LOCAL',243,444,21,muted,500,'center');text('CIVIC',528,229,21,muted,500,'center');text('EAST',832,435,21,muted,500,'center');
    text('02:40',918,117,52,cyan,700,'right');text('NEXT DEPARTURE',920,164,18,muted,500,'right');
    rect(47,216,243,4,'#315b6b');barcode(48,465,160);text('NY / GRID 07',251,480,18,muted);
  }else if(kind==='bridge'){
    text('CIVIC LINK',47,66,70,white,800);text('WEST SIDE',715,67,27,cyan,600);
    poly([[936,40],[960,64],[936,88],[945,64]],cyan);poly([[969,40],[993,64],[969,88],[978,64]],cyan);
    rect(564,34,3,60,'#4b8790');
  }else{
    text('CITY / LIVE',43,91,63,cyan,800);text('SUBWAY ACCESS',45,155,24,white,500);
    for(let i=0;i<5;i++){
      const xx=151+i*170;circle(xx,360,20,i===2?pink:cyan,5);if(i<4)rect(xx+20,356,130,8,'#487b89');
      text(String(i+1).padStart(2,'0'),xx,410,23,muted,500,'center');
    }
    text('SYSTEM ONLINE',45,630,31,white);text('LOCAL / EXPRESS',45,681,25,muted,500);barcode(699,680,246);
  }
  // Visible LED scan structure is subtle, so the message survives distance.
  g.globalAlpha=.075;for(let y=0;y<h;y+=4)rect(0,y,w,1,'#00131a');g.globalAlpha=1;
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
  texture.anisotropy=4;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;
  texture.name='Original NYC cyber display / '+kind;
  return texture;
}
