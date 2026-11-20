import * as T from 'three';

const steel='midtownSteel', stone='midtownLimestone', light='exchangeGridLens';
const teal=0x508984, rust=0xbb7056, cream=0xe1ba84, iron=0x55666c;
const warm=0xffcf8a, mint=0x9ad8ca, rose=0xe78fa6;
const pavement=.36, bridgeFloor=5.48;

// The western property reuses the base of a 94-metre exchange tower.
// On the other side of the delivery street, workers live above the tea
// plant. A lower cross-passage and a second-floor bridge join the two lots.
export function buildTeaExchange({scene,box,solid,surface,sign:mountSign,lights}){
  function mass(mat,x,y,z,w,h,d,color){
    box(mat,x,y,z,w,h,d,color);
    solid(x,y,z,w,h,d);
  }
  function floor(x1,x2,z1,z2,level,material='paver',thickness=.16){
    const x=(x1+x2)/2,z=(z1+z2)/2;
    box(material,x,level-thickness/2,z,x2-x1,thickness,z2-z1,0xb7a997);
    surface(x1,x2,z1,z2,level);
    if(level>1)solid(x,level-thickness/2,z,x2-x1,thickness,z2-z1);
  }
  function practical(x,y,z,color,intensity,range){
    const source=new T.PointLight(color,intensity,range,2);
    source.position.set(x,y,z);source.userData.nightPower=intensity;
    scene.add(source);lights.push(source);
  }
  // Repaint the existing world-sign texture in place to keep registration,
  // emissive footprint, batching and the current day/night behaviour.
  function sign(x,y,z,w,h,title,subtitle,color,turn=0){
    const mesh=mountSign(x,y,z,w,h,title,subtitle,color,turn);
    const tex=mesh?.material?.map,canvas=tex?.image;
    if(!canvas?.getContext)return;
    const g=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
    const cold=['归杯处','周转桶还箱','茶脚里职工宿舍'].includes(title);
    const milk=['一街一桶','续杯总管','珍珠档口'].includes(title);
    g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;
    g.fillStyle=cold?'#224f50':milk?'#9a4057':'#743f30';g.fillRect(0,0,W,H);
    g.fillStyle=cold?'#163b3d':milk?'#803743':'#59372d';g.fillRect(0,H*.70,W,H*.30);
    const left=Math.min(H*.87,W*.17),unit=Math.min(left/9,H*.095);
    const glyph=cold?['..xxx..','.xxxxx.','xx...xx','..xxx..','xx...xx','.xxxxx.','..xxx..']:
      milk?['....xx.','...xx..','.xxxxx.','xxxxxxx','.xxxxx.','.xxxxx.','..xxx..']:['..xxx..','xxx.xxx','x.xxx.x','..xxx..','x.xxx.x','xxx.xxx','..xxx..'];
    g.fillStyle=cold?'#b4f0cd':'#fee2b3';
    for(let row=0;row<glyph.length;row++)for(let col=0;col<7;col++)
      if(glyph[row][col]==='x')g.fillRect(left*.52+(col-3.5)*unit,H*.14+row*unit,unit+.4,unit+.4);
    g.fillRect(0,H*.02,W,H*.034);g.textAlign='left';g.textBaseline='middle';
    g.font='900 '+Math.round(H*.62)+'px "Microsoft YaHei",sans-serif';
    g.fillText(title,left+W*.02,H*.38,W-left-W*.045);
    g.fillStyle=cold?'#d3e8c8':'#eac6a0';
    g.font='600 '+Math.round(H*.18)+'px "Microsoft YaHei",sans-serif';
    g.fillText(subtitle,left+W*.025,H*.84,W-left-W*.05);g.restore();tex.needsUpdate=true;
  }
  // A counter can face any of the four aisles. Shoppers see the display,
  // back wall, illuminated work bench and the side opening simultaneously.
  function counter(x,z,width,depth,turn,title,subtitle,color,blade){
    const angle=turn*Math.PI/2,c=Math.round(Math.cos(angle)),s=Math.round(Math.sin(angle));
    const pos=(u,y,v)=>[x+c*u+s*v,y,z-s*u+c*v];
    function B(m,u,y,v,w,h,d,tint,hard=false){
      const p=pos(u,y,v);
      box(m,...p,w,h,d,tint,angle);
      if(hard)solid(...p,Math.abs(c)*w+Math.abs(s)*d,h,Math.abs(c)*d+Math.abs(s)*w);
    }
    const e=width/2,d=depth/2;
    B('brickBrown',0,1.96,-d+.24,width,3.20,.48,0xc1a794,true);
    B(steel,0,1.0,d-.68,width-2.24,1.28,1.36,teal,true);
    B('midtownBronze',0,1.72,d-.68,width-1.92,.16,1.60,cream);
    for(const side of [-1,1]){
      B(stone,side*(e-.32),2.12,d-.42,.64,3.52,.80,0xb5b0a2,true);
      for(let j=0;j<3;j++)B(steel,side*(e-.48-.16*j),3.44+j*.32,d-.64,1.28+j*.32,.32,1.28+j*.64,j===1?rust:iron);
    }
    const bays=Math.max(2,Math.round(width/2.08));
    for(let j=0;j<bays;j++){
      const u=(j-(bays-1)/2)*width/bays,lip=j%3===1?.48:0;
      B('metal',u,2.16,-d+.56,width/bays-.14,1.60,.32,iron);
      B(light,u,2.34,-d+.76,width/bays-.27,.80,.16,j%3===1?0xc18a76:0x9eae9d);
      B('metal',u,2.07,-d+.98,width/bays-.14,.16,.64,iron);
      B(steel,u,3.86,d/2+lip,width/bays,.42,depth+1.12, j%2?teal:rust);
      B(light,u,3.59,d+.26+lip,width/bays-.36,.10,.32,color);
      if(j%3===0){
        B(steel,u,2.0,d-.72,.96,.56,.48,iron);
        B(light,u,2.09,d-.44,.64,.28,.08,mint);
      }else{
        B('wood',u,1.95,d-.72,.80,.34,.64,cream);
        B('wood',u+.08,2.19,d-.72,.64,.16,.48,rust);
      }
    }
    sign(...pos(0,4.37,d+.72),Math.min(width,7.2),.97,title,subtitle,blade,angle);
  }
  // West portal aligns with the food court. The north-south aisle jogs at
  // the counting desk, so the old plinth is split into four unequal rooms.
  floor(24,51,-162,-145.01,pavement);
  floor(28.01,51,-145.01,-138,pavement);
  floor(28.15,50.42,-137.99,-124.90,pavement);
  floor(49.76,53.15,-150.22,-144.78,pavement);
  floor(47.36,51.20,-170.66,-162.01,pavement);
  for(const [x,z,w,d] of [[29.12,-141.76,6.72,4.48],[45.64,-141.48,8.64,4.48],
    [30.24,-157.60,9.28,6.40],[44.48,-158.40,4.48,5.76]]){
    mass('brickBrown',x,6.68,z,w,3.68,d,0xc2a08e);
    for(let i=0;i<Math.floor(w/1.7);i++){
      const px=x-w/2+1.08+i*1.68;
      box('metal',px,6.65,z+d/2+.12,1.36,1.92,.32,iron);
      box(i%3?'glass':'warmWindow',px,6.72,z+d/2+.32,1.04,1.44,.16,cream);
      box(stone,px,5.65,z+d/2+.16,1.60,.32,.80,0xbcb3a3);
    }
  }
  counter(29.12,-141.36,7.04,4.48,2,'杯盖五金','模具修补 · 以旧换新',warm,'#f2c192');
  counter(45.76,-141.20,8.32,4.16,2,'珍珠档口','夜班制丸 · 按斤供货',rose,'#e6a9ab');
  counter(29.76,-156.48,8.32,5.12,0,'票根当铺','日结借款 · 旧票折现',warm,'#dfc99c');
  counter(44.48,-158.08,3.84,4.16,0,'归杯处','寄杯兑押金',mint,'#aad5c9');
  // The tank's filling floor and the crate-return shed face one another
  // across the approach. Their differently aligned counters pinch the wide
  // forecourt into a narrow trading street, then release it at the arcade.
  counter(45.76,-133.76,8.00,4.16,0,'茶厂出杯口','凭码接茶  /  夜班半糖',warm,'#ffc5a2');
  counter(30.88,-131.20,6.72,3.84,1,'押桶兑票','散客提桶  /  工厂收票',mint,'#a6d7c6');
  for(const [j,x] of [43.52,45.76,48.0].entries()){
    box(steel,x,3.10,-132.96,.64,4.16,.64,j===1?rust:teal);
    box(steel,x,2.75,-132.41,.80,.64,1.60,iron);
    box('midtownBronze',x,2.48,-131.77,.48,.64,.48,cream);
    box(light,x,2.30,-131.77,.32,.16,.32,j===1?rose:mint);
    box(steel,x,2.00,-131.70,.88,.16,.72,teal);
    box(stone,x,2.18,-131.70,.36,.36,.36,cream);
  }
  for(let i=0;i<3;i++){
    const z=-134.08+i*2.40;
    box(steel,31.20,4.36+i*.16,z,4.48,.32,2.40,teal);
    box('midtownBronze',32.72,4.52+i*.16,z,1.28,.48,2.40,cream);
  }
  practical(44.80,3.65,-130.50,0xffb97d,84,10);
  for(const [x,z] of [[25.64,-151.36],[33.92,-142.72],[40.32,-142.72],[42.88,-153.60],[50.36,-141.44],[25.76,-161.28]]){
    mass(stone,x,4.20,z,1.12,7.68,1.28,0x95a59f);
    for(let j=0;j<4;j++)box(steel,x,7.05+j*.40,z,1.44+j*.32,.40,2.24+j*.64,j%2?iron:teal);
  }
  for(const z of [-140.96,-147.52,-156.16,-160.80]){
    mass(steel,38,8.17,z,26.56,1.02,1.28,iron);
    for(let i=0;i<5;i++)box(light,27.5+i*5.1,7.62,z,2.56,.14,.48,i%2?0xcdb398:0x98b6ab);
  }
  for(const side of [-1,1])for(let i=0;i<15;i++){
    const xx=25.76+i*1.76,zz=side===1?-145.02:-150.24;
    box('midtownBronze',xx,.376,zz,1.73,.026,.32,teal);
    for(let j=0;j<3;j++)box('rubber',xx-.48+j*.48,.394,zz,.24,.024,.19,iron);
  }
  sign(37.12,6.22,-137.62,9.60,1.16,'旧票厅通街','东门穿堂  /  二层过街','#e9bc84');
  sign(51.0,6.16,-147.56,6.40,1.12,'夜班取茶','取货口 04 / 凭码提桶','#f9b69c',Math.PI/2);
  practical(35.84,4.35,-148.48,0xffbc81,115,15);

  // North and south approaches to the eastern court lie between occupied
  // buildings. The west frontage shifts between shop, open yard and loading
  // apron. The eastern edge returns to the street through two cross alleys.
  floor(65.62,82.88,-170.40,-124.70,pavement);
  for(let i=0;i<7;i++){
    box('white',54.14+i*1.28,.196,-148, .51,.013,3.20,0xb9b4a4);
  }
  const housing=(x,z,w,d,floors)=>{
    const base=4.68,cols=Math.max(2,Math.floor(d/2.56)),bay=d/cols;
    // Apartments share the building's upper circulation. Separate loads
    // allow the whole lower level to remain open from one street to another.
    mass('brickBrown',x,base+floors*1.55,z,w,floors*3.10,d,0xb8a092);
    for(const side of [-1,1]){
      for(let row=0;row<floors;row++)for(let j=0;j<cols;j++){
        const zz=z-d/2+(j+.5)*bay,xx=x+side*w/2,yy=base+1.60+row*3.10;
        box('metal',xx+side*.13,yy,zz,.32,1.92,bay-.30,iron);
        box((j+2*row)%4<2?'warmWindow':'glass',xx+side*.33,yy,zz,.16,1.44,bay-.62,0xb9ada1);
        box('metal',xx+side*.42,yy,zz+.29,.15,1.50,.16,teal);
        if(side<0&&(row+j)%3===1){
          box(stone,xx-.72,yy-1.1,zz,1.76,.32,bay+.25,0xada295);
          box('midtownBronze',xx-1.52,yy-.64,zz,.24,.80,bay+.25,teal);
          box('midtownBronze',xx-1.01,yy-.64,zz-bay/2,1.28,.80,.24,teal);
        }else box(stone,xx+side*.24,yy-1.06,zz,.80,.24,bay-.16,0xbfb8a9);
      }
      for(let j=0;j<cols;j++){
        const reach=j%3===1?1.28:.64,zz=z-d/2+(j+.5)*bay;
        box(steel,x+side*(w/2-.16),base+floors*3.10+.28,zz,reach+.96,.56,bay,j%2?teal:iron);
      }
    }
    for(const end of [-1,1]){
      const zz=z+end*(d/2-.50);
      for(const side of [-1,1])mass('brickBrown',x+side*(w/2-.43),2.52,zz,.86,4.32,1.04,0xc3a797);
    }
    for(let i=0;i<3;i++)box(steel,x+(i-1)*w*.23,base+floors*3.10+.90,z+.36*(i%2),w*.27,1.28,2.56+i*.32,i%2?iron:teal);
  };
  housing(79.76,-134.88,5.76,13.44,3);
  housing(79.12,-162.80,6.40,10.88,5);
  housing(68.96,-130.20,5.12,7.68,2);
  counter(79.60,-133.92,7.04,4.80,-1,'茶脚街洗衣','烘工装 · 夜班改衣',warm,'#f4c58e');
  counter(79.44,-160.72,6.40,4.16,-1,'周转桶还箱','过磅退押 · 回收冲洗',mint,'#9bd6ce');
  counter(68.96,-130.20,5.12,5.76,0,'街坊代收','包裹  /  牛奶  /  报纸',warm,'#e5c190');
  // The inhabited gallery is carried by the two end tenements; the cut
  // between them is the open yard through which the upper street is visible.
  mass(steel,79.52,8.32,-149.36,6.08,.96,15.52,iron);
  for(let j=0;j<6;j++){
    const zz=-155.68+j*2.56,xx=j%3===0?78.88:79.20;
    box(steel,xx,10.56,zz,5.12,3.68,2.56,j%2?teal:iron);
    box('warmWindow',xx-2.62,10.48,zz,.20,1.44,2.08,cream);
    box(steel,xx-3.03,9.49,zz,.96,.38,2.56,j%2?rust:teal);
    box(steel,xx-3.12,11.58,zz,1.28,.32,2.56,iron);
  }
  sign(76.45,8.40,-148.48,7.20,.96,'茶脚里职工宿舍','二层连廊 · 南北通院','#b7ceaa',-Math.PI/2);
  practical(77.60,4.12,-150.24,0xffbf91,78,12);

  // 32 consistent 16cm rises. Short cheek walls support the solid parts
  // of each stair while the space under the upper landing stays usable.
  function stairs(x,z0,direction){
    const width=2.88,run=.48,rise=.16;
    for(let i=0;i<32;i++){
      const z=z0+direction*run*(i+.5),top=pavement+rise*(i+1);
      floor(x-width/2,x+width/2,z-run/2,z+run/2,top,'midtownLimestone',.32);
      box('midtownBronze',x,top-.05,z-direction*.19,width,.10,.10,i%4===0?cream:teal);
      for(const side of [-1,1]){
        const rail=x+side*(width/2+.12);
        mass(steel,rail,top+.50,z,.24,1.00,.48,teal);
        box('midtownBronze',rail,top+1.04,z,.34,.12,.48,cream);
      }
      if(i%8===3){
        for(const side of [-1,1])
          mass(steel,x+side*(width/2-.36),(top+pavement)/2,z,.48,top-pavement,.64,iron);
      }
    }
  }
  stairs(49.28,-169.60,1);
  stairs(68.80,-135.68,-1);
  floor(47.84,76.48,-154.24,-151.04,bridgeFloor,'midtownSteel',.48);
  for(const [a,b,z] of [[50.96,76.48,-154.24],[47.84,67.12,-151.04],[70.48,76.48,-151.04]]){
    mass(steel,(a+b)/2,bridgeFloor+.22,z,b-a,.44,.32,teal);
    mass('midtownBronze',(a+b)/2,bridgeFloor+1.28,z,b-a,.18,.32,cream);
    const count=Math.max(1,Math.round((b-a)/2.56));
    for(let i=0;i<count;i++){
      const u=a+(i+.5)*(b-a)/count;
      box(stone,u,bridgeFloor+.64,z,.64,1.28,.66,i%2?0x939f97:0xd1bb98);
    }
  }
  for(const x of [47.84,76.48])mass(steel,x,bridgeFloor+.68,-152.64,.32,1.36,3.20,teal);
  // The service hatch at the east bridge head really faces the public deck.
  mass(steel,75.84,6.00,-153.68,.96,1.04,.80,iron);
  box(light,75.30,6.18,-153.66,.14,.42,.56,mint);
  for(let j=0;j<7;j++){
    const x=49.92+j*3.84;
    box(steel,x,4.80,-152.64,1.12,.80,3.52,iron);
    box(steel,x,4.50,-152.64,.64,.32,3.84,teal);
    if(j%2)box(light,x,4.27,-152.64,.64,.16,1.60,mint);
  }
  box('metal',59.84,8.67,-153.44,12.80,.48,2.56,iron);
  box('metal',69.12,8.98,-151.84,3.84,.48,2.56,iron);
  for(const x of [54.08,59.20,64.32,70.08]){
    box(steel,x,7.45,-154.12,.32,3.36,.48,teal);
    box(steel,x,8.96,-152.64,.64,.32,4.80,0x879894);
    box(light,x,8.78,-152.64,1.12,.12,1.92,warm);
  }
  sign(59.20,7.84,-150.38,9.28,1.10,'杯底过街楼','茶厂东楼 · 宿舍 · 还桶处','#e7d29c');
  practical(61.20,7.16,-152.64,0xf9bc7d,82,13);
  buildTeaVat({box,mass,sign});
  practical(47.04,5.72,-130.40,0xffa797,135,17);
  return [
    {id:'tea_ticket_weigher',a:[30.16,-152.64],level:.36,look:1,heading:Math.PI,phone:true},
    {id:'tea_cup_runner',a:[32.96,-149.12],b:[47.20,-149.12],level:.36,look:2,speed:.83},
    {id:'tea_paper_customer',a:[28.16,-144.32],level:.36,look:0,heading:0},
    {id:'tea_shift_at_hatch',a:[73.92,-153.00],level:bridgeFloor,look:2,heading:1.57,phone:true},
    {id:'tea_bridge_worker',a:[51.60,-152.80],b:[66.56,-152.80],level:bridgeFloor,look:1,speed:.82},
    {id:'tea_laundry_tenant',a:[76.24,-133.94],level:.36,look:3,heading:1.57},
    {id:'tea_yard_commuter',a:[73.18,-161.92],b:[73.18,-150.40],level:.36,look:0,speed:.72},
    {id:'tea_flask_customer',a:[44.12,-129.55],level:.36,look:1,heading:Math.PI,phone:true},
    {id:'tea_token_customer',a:[34.34,-131.48],level:.36,look:2,heading:-Math.PI/2}
  ];
}

// The eight-metre road-facing advertisement doubles as the plant's actual
// buffer tank. Horizontal rows of whole 64cm blocks trace a widening cup.
// The tank feeds into a raised pair of insulated pipes crossing to housing.
function buildTeaVat({box,mass,sign}){
  const cx=46.08,cz=-134.72,g=.64,base=5.16;
  const enamel='transferPorcelain';
  const tea=[0xf5bc8d,0xedaa8a,0xedaa83];
  for(let layer=0;layer<11;layer++){
    const cells=layer<3?4:layer<7?5:6,radius=cells+.15;
    for(let row=-cells;row<=cells;row++){
      const dx=Math.floor(Math.sqrt(radius*radius-row*row));
      const y=base+(layer+.5)*g,z=cz+row*g;
      if(layer===0||layer===10||Math.abs(row)===cells){
        const band=layer===0||layer===10?0xb75572:layer===3||layer===8?0xffe3bc:tea[layer%3];
        box(enamel,cx,y,z,(2*dx+1)*g,g,g,band);
      }else{
        for(const side of [-1,1]){
          const col=layer===3||layer===8?cream:tea[(row+cells+layer)%3];
          box(enamel,cx+side*dx*g,y,z,g,g,g,col);
        }
      }
    }
    if(layer===1||layer===2){
      for(const x of [-1.92,-.32,1.60])box(steel,cx+x,base+(layer+.5)*g,cz+2.75,.80,g,.48,0x664851);
    }
  }
  for(let row=-6;row<=6;row++){
    const dx=Math.floor(Math.sqrt(6.3**2-row*row));
    box('transferPorcelain',cx,12.52,cz+row*g,(2*dx+1)*g,.64,g,0xffdfc4);
  }
  for(const side of [-1,1]){
    const x=cx+side*1.92;
    mass(steel,x,4.70,-136.64,.96,.80,7.68,iron);
    for(let i=0;i<4;i++)box(steel,x,3.18+i*.32,-138.72+i*.64,1.28,.64,2.56,teal);
  }
  // A fat striped straw bends in discrete offsets and becomes the intake
  // for the overhead milk main. Its insulated return runs below the supply.
  for(let i=0;i<6;i++){
    const x=cx+1.28+i*.64,y=12.68+i*.64;
    box('transferPorcelain',x,y,cz,1.60,.64,1.60,i%3===0?0xffe9cf:0xe97795);
  }
  for(let n=0;n<8;n++){
    const x=51.20+n*2.56,z=cz+(n>=5?.64:0);
    box(steel,x,15.88,z,2.64,.96,1.28,n%2?0xbcb9a5:0x8faaaa);
    box(steel,x,14.60,z-.96,2.64,.64,.80,teal);
    if(n%2===0){
      box(steel,x,15.25,z-.32,.48,2.56,2.24,iron);
      box(light,x,14.12,z-.32,.40,.14,.64,0xa5c8bb);
    }
  }
  for(let i=0;i<4;i++)box(steel,69.92,15.20-i*.64,cz+i*.64,1.28,.96,1.60,i%2?teal:cream);
  mass(steel,69.92,11.98,-132.80,2.24,3.40,2.56,iron);
  for(let j=0;j<3;j++)box(steel,69.92,10.88+j*.96,-132.80,2.88,.48,3.20,teal);
  sign(cx,8.60,cz+3.72,5.44,1.70,'一街一桶','公营茶水厂 / 夜班现打','#ffbeab');
  sign(cx+3.72,9.40,cz,4.48,1.08,'续杯总管','二十四小时热供','#ffd797',Math.PI/2);
}
