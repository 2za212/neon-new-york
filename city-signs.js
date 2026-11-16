import * as T from 'three';

// All graphics are authored in code. The screens sit inside the existing voxel
// frames; their placement leaves the building shell and collision model untouched.
export async function addCitySigns(scene) {
  if(document.fonts?.ready)await document.fonts.ready;
  const themes={
    cyan:{ink:'#23cbd8',paper:'#06121a',dim:'#21505a',accent:'#a5c6c8'},
    pink:{ink:'#f83b9e',paper:'#130915',dim:'#632644',accent:'#d392b2'},
    amber:{ink:'#d9aa70',paper:'#18120c',dim:'#67502e',accent:'#c9ae8d'},
    ice:{ink:'#79b6cf',paper:'#08131d',dim:'#274956',accent:'#a8c0c7'},
  };
  const screens=[];
  function advertisement(g,t,title,icon,footer,kind) {
    const w=512,h=2048;
    g.textAlign='center';g.textBaseline='middle';
    g.fillStyle=t.accent;g.font='700 50px "Arial", sans-serif';
    g.fillText(icon+'  /  NEURAL LIFE',w/2,103,w-100);
    g.fillStyle=t.ink;g.fillRect(56,182,400,8);
    // Large names stay readable from the central street. The advertising image
    // takes the middle of the existing screen instead of adding more billboards.
    g.font='800 178px "Microsoft YaHei", "SimHei", sans-serif';
    const chars=Array.from(title);
    chars.forEach((char,i)=>g.fillText(char,154+(i%2)*205,345+Math.floor(i/2)*201,180));
    const ox=112,oy=792,px=8;
    function pixel(x,y,width,height,color=t.ink) {
      g.fillStyle=color;g.fillRect(ox+x*px,oy+y*px,width*px,height*px);
    }
    // Original faceted android silhouette. Each contour, implanted eye and
    // shoulder is drafted in a small pixel grid, matching the voxel city.
    if(kind==='android') {
      const rows=[[6,20],[3,26],[1,30],[0,32],[0,32],[1,30],[2,28],[4,24],[7,18]];
      rows.forEach(([x,width],j)=>pixel(x,j*5,width,5,t.dim));
      pixel(3,7,12,27,'#412236');pixel(18,6,10,28,'#71364e');
      pixel(4,8,4,24,t.accent);pixel(8,4,9,4,t.accent);
      pixel(8,14,8,3);pixel(20,14,7,3);pixel(13,22,5,8,t.accent);
      pixel(10,34,13,2,t.ink);pixel(10,45,13,9,t.dim);
      pixel(-5,55,42,7,t.dim);pixel(-10,62,52,6,t.dim);
      pixel(1,58,6,3);pixel(25,58,6,3);pixel(13,55,7,11,t.accent);
      for(const [x,y] of [[-5,11],[34,16],[-4,32],[35,40]]) {
        pixel(x,y,4,2,t.ink);pixel(x+1,y+2,2,8,t.dim);
      }
      g.fillStyle=t.ink;g.font='700 47px "Microsoft YaHei", sans-serif';
      g.fillText('神经接口 · 原位升级',256,1460,398);
      g.fillStyle=t.accent;g.font='500 34px "Arial", sans-serif';
      g.fillText('SAME BODY. NEXT SELF.',256,1530,395);
    } else if(kind==='memory') {
      const outline=[[5,16],[1,25],[-1,30],[-1,30],[0,31],[0,35],[1,30],[3,25],[8,18]];
      outline.forEach(([x,width],j)=>pixel(x,j*5,width,5,t.dim));
      pixel(4,5,9,31,'#4e2440');pixel(15,4,8,38,'#6c2d50');
      pixel(24,15,8,3);pixel(27,18,8,6,t.accent);pixel(26,29,5,3,t.accent);
      pixel(10,42,12,10,t.dim);pixel(1,54,30,8,t.dim);
      // Rectangular memory cells and their circuit routes replace a generic face.
      for(let j=0;j<4;j++)for(let i=0;i<3;i++) {
        pixel(2+i*7,6+j*7,5,4,(i+j)%3===0?t.ink:t.accent);
        if(i<2)pixel(7+i*7,7+j*7,2,1,t.dim);
      }
      pixel(-9,19,9,2);pixel(-9,19,2,23);pixel(-9,40,10,2);
      pixel(35,12,6,2);pixel(39,12,2,24);pixel(32,34,9,2);
      g.fillStyle=t.ink;g.font='700 47px "Microsoft YaHei", sans-serif';
      g.fillText('旧梦存档 · 新生体验',256,1460,398);
      g.fillStyle=t.accent;g.font='500 34px "Arial", sans-serif';
      g.fillText('KEEP THE MOMENT. LIVE AGAIN.',256,1530,405);
    } else {
      // A communicator is a visible piece of branded technology, framed by
      // a hub-and-node schematic instead of random decorative scan lines.
      pixel(5,3,23,47,t.dim);pixel(7,5,19,41,'#142b38');
      pixel(9,9,15,2);pixel(9,14,15,2,t.accent);pixel(9,19,15,2,t.accent);
      pixel(10,27,13,11,t.ink);pixel(12,29,9,7,'#142b38');
      pixel(14,40,5,3,t.accent);pixel(14,50,5,12,t.dim);
      pixel(4,61,25,4,t.dim);pixel(0,65,33,3,t.ink);
      for(const [x,y,dx] of [[-8,7,1],[36,7,-1],[-8,31,1],[36,31,-1]]) {
        pixel(x,y,6,6,t.ink);pixel(x+6*dx,y+2,9,2,t.dim);
      }
      g.fillStyle=t.ink;g.font='700 47px "Microsoft YaHei", sans-serif';
      g.fillText('城市互联 · 零界延迟',256,1460,398);
      g.fillStyle=t.accent;g.font='500 34px "Arial", sans-serif';
      g.fillText('YOUR WORLD. ALWAYS ONLINE.',256,1530,405);
    }
    g.fillStyle=t.dim;g.fillRect(61,1635,390,5);
    g.fillStyle=t.ink;g.font='700 74px "Bahnschrift", "Arial", sans-serif';
    g.fillText(kind==='android'?'24 / 7':kind==='memory'?'MEM / 09':'LINK / 01',256,1758,390);
    g.fillStyle=t.accent;g.font='600 38px "Arial", sans-serif';g.fillText(footer,256,1907,390);
    for(let i=0;i<13;i++)g.fillRect(87+i*28,1960,i%3?9:17,11);
  }
  function canvasScreen({title,small='',footer='',theme='cyan',vertical=false,icon='09',ad=''}) {
    const t=themes[theme],canvas=document.createElement('canvas');
    canvas.width=vertical?512:2048;canvas.height=vertical?2048:512;
    const g=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    g.fillStyle=t.paper;g.fillRect(0,0,w,h);
    g.strokeStyle=t.dim;g.lineWidth=vertical?5:3;
    g.strokeRect(14,14,w-28,h-28);
    g.fillStyle=t.dim;
    for(let y=40;y<h-20;y+=28)g.fillRect(24,y,w-48,1);
    // The quiet line work creates a recognisable panel from far away without
    // competing with the name when viewed from the pedestrian camera.
    if(vertical&&ad) {
      advertisement(g,t,title,icon,footer,ad);
    } else if(vertical) {
      g.fillStyle=t.ink;g.fillRect(33,32,12,h-64);g.fillRect(w-45,32,12,h-64);
      g.textAlign='center';g.textBaseline='middle';
      g.font='700 85px "Bahnschrift", "Arial", sans-serif';
      g.fillText(icon,w/2,133,w-115);
      g.fillStyle=t.dim;g.fillRect(85,232,w-170,5);
      const chars=Array.from(title),top=344,bottom=h-315,step=(bottom-top)/Math.max(1,chars.length-1);
      g.font='800 280px "Microsoft YaHei", "SimHei", sans-serif';
      chars.forEach((char,i)=>{
        g.fillStyle=t.ink;g.fillText(char,w/2,top+i*step,w-116);
      });
      g.font='600 36px "Arial", sans-serif';g.fillStyle=t.accent;
      g.fillText(footer||small,w/2,h-137,w-100);
      for(let i=0;i<9;i++)g.fillRect(88+i*37,h-77,i%3?15:23,12);
    } else {
      g.fillStyle=t.ink;g.fillRect(30,30,16,h-60);
      g.fillStyle=t.dim;g.fillRect(76,122,w-152,4);
      g.textAlign='left';g.textBaseline='middle';
      g.font='600 49px "Arial", "Microsoft YaHei", sans-serif';
      g.fillStyle=t.accent;g.fillText(small,86,79,w*.73);
      g.font='800 220px "Microsoft YaHei", "SimHei", sans-serif';
      g.fillStyle=t.ink;g.fillText(title,80,285,w-480);
      g.font='700 172px "Bahnschrift", "Arial", sans-serif';
      g.fillStyle=t.accent;g.fillText(icon,w-325,280,240);
      g.font='600 39px "Arial", "Microsoft YaHei", sans-serif';
      g.fillStyle=t.dim;g.fillText(footer,88,h-67,w-340);
      g.fillStyle=t.ink;
      const xx=w-245,yy=h-82;
      g.fillRect(xx,yy,99,9);g.fillRect(xx+73,yy-22,11,52);
      g.fillRect(xx+84,yy-11,11,31);g.fillRect(xx+95,yy,11,9);
    }
    const texture=new T.CanvasTexture(canvas);
    texture.colorSpace=T.SRGBColorSpace;
    texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;
    texture.anisotropy=8;texture.needsUpdate=true;
    return texture;
  }
  function panel(position,width,height,text,orientation=0) {
    const map=canvasScreen(text);
    const primary=text.title==='九号街区';
    const emission=primary?1.45:(text.ad?1.14:text.theme==='pink'?1.02:text.theme==='cyan'?.93:.79);
    const material=new T.MeshStandardMaterial({map,emissiveMap:map,color:primary?0xa4b4b7:0x7d8c92,
      emissive:0xffffff,emissiveIntensity:emission,roughness:.66,metalness:.02,side:T.FrontSide});
    const mesh=new T.Mesh(new T.PlaneGeometry(width,height),material);
    mesh.position.fromArray(position);mesh.rotation.y=orientation;
    mesh.name='city-sign-'+text.title;mesh.renderOrder=1;scene.add(mesh);screens.push(mesh);
    return mesh;
  }
  // The main portal is the visual anchor from the approach street.
  panel([0,17.0,12.80],15.25,3.52,
    {title:'九号街区',small:'NIGHT CITY  /  TRANSIT INTERCHANGE',footer:'云轨枢纽  ·  商业街  ·  上层步道',icon:'09',theme:'cyan'});
  // A large mast on the western landmark reads between the inhabited setbacks.
  panel([-22.2,36.6,-10.34],3.47,16.62,
    {title:'天际通讯',footer:'SKYLINK',icon:'T/R',theme:'ice',vertical:true,ad:'circuit'});
  // Inward-facing transit blades appear on either side of the raised rail.
  panel([-16.17,15.0,-9.4],3.38,11.20,
    {title:'云轨枢纽',footer:'TRANSIT',icon:'M',theme:'cyan',vertical:true},Math.PI/2);
  panel([16.17,15.0,-9.4],3.38,11.20,
    {title:'义体维修',footer:'IMPLANT',icon:'R+',theme:'pink',vertical:true,ad:'android'},-Math.PI/2);

  // These surfaces use the authored dimensions of the four existing shop blades.
  // Front blocks are deliberately warmer than the service districts behind them.
  panel([-26.44,11.1,45.0],1.00,7.35,
    {title:'夜行食堂',footer:'24H',icon:'食',theme:'amber',vertical:true},Math.PI/2);
  panel([26.94,13.5,45.0],1.00,7.35,
    {title:'记忆商店',footer:'MEM',icon:'M',theme:'pink',vertical:true,ad:'memory'},-Math.PI/2);
  panel([-37.19,13.5,6.6],1.00,7.35,
    {title:'合成工坊',footer:'LAB',icon:'合',theme:'cyan',vertical:true},Math.PI/2);
  panel([35.94,14.7,6.6],1.00,7.35,
    {title:'神经诊所',footer:'MED',icon:'十',theme:'ice',vertical:true},-Math.PI/2);

  const lit={cyan:[],pink:[],amber:[],ice:[]};
  const snapSource=v=>Math.round(v/.6)*.6;
  const voxelFace=v=>Math.round(v/.25)*.25;
  const cavityFront=face=>voxelFace(snapSource(face-.6)+.3)+.055;
  function glow(kind,x,y,z,w,h,d) {
    lit[kind].push([x,y,z,w,h,d]);
  }
  // A few broken runs of voxel light mark existing mechanical edges. Each run
  // is composed of 0.25 m pixels instead of one smooth continuous light tube.
  function ledRun(kind,x,y,z,count,axis='x',skip=0) {
    for(let k=0;k<count;k++){
      if((skip&&k%skip===skip-1)||k%16>10)continue;
      glow(kind,x+(axis==='x'?k*.25:0),y+(axis==='y'?k*.25:0),z+(axis==='z'?k*.25:0),.25,.25,.25);
    }
  }
  ledRun('cyan',-7.50,19.24,12.81,61,'x',13);
  ledRun('amber',-7.50,14.74,12.82,61,'x',8);
  ledRun('pink',16.13,9.75,-11.01,44,'y',12);
  ledRun('cyan',-16.13,9.75,-7.81,44,'y',12);
  // Two cyan segments locate the existing high pedestrian bridge in the street
  // canyon. The clear dark gap through the middle keeps the portal dominant.
  ledRun('cyan',-21.75,19.15,-33.18,40,'x',0);
  ledRun('cyan',12.00,19.15,-33.18,40,'x',0);
  // Occupied cubical windows cluster, leaving long darker sections of each tower.
  // Their small panels sit deep behind the actual voxel window jambs.
  for(let level=0;level<15;level++) {
    const b=8.4+level*3.6,retreat=Math.floor(level/3)*1.2;
    const cx=-28.2-retreat,cz=-27-Math.floor(level/4)*.6;
    const width=level<9?20.4:19.2-Math.floor((level-9)/2)*1.2;
    const depth=level<11?22.8:21.6-Math.floor((level-11)/2)*1.2;
    const bays=Math.floor((width-2.4)/4.2);
    for(let k=0;k<bays;k++) {
      if((level+2*k)%8===0||(level*7+k*3)%10>1)continue;
      const x=cx+(k-(bays-1)/2)*4.2,projection=((level+k)%3)*.6;
      const moduleZ=cz+depth/2+1.2+projection;
      const face=moduleZ+(3+projection)/2-.3;
      glow((level+k)%4?'amber':'cyan',snapSource(x),b+1.20,cavityFront(face),1.02,.87,.08);
    }
  }
  for(let tier=0;tier<8;tier++) {
    const b=6+tier*5.4,cx=33+(tier%3-1)*1.2,cz=-29.4-Math.floor(tier/3)*1.2;
    const shrink=Math.max(0,tier-4)*1.2,w=22.8-shrink,d=24-shrink;
    for(let k=0;k<5;k++) {
      if(Math.abs((k-2)*4.2)>w/2-1.2||(k+tier*2)%7>1)continue;
      const x=cx+(k-2)*4.2,offset=(k+tier)%4===0?1.8:.6;
      const moduleZ=cz+d/2+offset,face=moduleZ+(3+offset)/2-.3;
      glow((k+tier)%4?'amber':'cyan',snapSource(x),b+1.8,cavityFront(face),1.02,1.03,.08);
    }
  }
  const cube=new T.BoxGeometry(1,1,1),object=new T.Object3D();
  for(const [key,items] of Object.entries(lit)) {
    if(!items.length)continue;
    const color=new T.Color(themes[key].ink);
    const emission={cyan:1.20,pink:1.08,amber:.64,ice:.59}[key];
    const material=new T.MeshStandardMaterial({color:color.clone().multiplyScalar(.58),emissive:color,emissiveIntensity:emission,roughness:.56});
    const mesh=new T.InstancedMesh(cube,material,items.length);
    items.forEach(([x,y,z,w,h,d],i)=>{
      object.position.set(x,y,z);object.scale.set(w,h,d);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);
    });
    mesh.name='city-led-'+key;mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);
  }
  return {screens,lights:Object.values(lit).reduce((sum,a)=>sum+a.length,0)};
}



