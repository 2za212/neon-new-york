/*
 * Service shafts carry alternate occupied cartridges. Their narrower transfer
 * floor stays visible around the entire projecting cartridge. Dimensions are
 * local per building, in metres; each structural edge follows a 0.32 m cell.
 */
const unit = value => Math.round(value / .32) * .32;
const charcoal = 0x394b57, steel = 0x879ba6, pearl = 0xc2cbd0, bone = 0xc7bba7;

// Two crossed rows of bonded ceramic blocks form the topmost corners. The
// plate ends at the inner shoulder; empty sockets are visible against the sky.
function crownBand(B,tint,x,y,z,w,h,d){
  const key=Math.min(.64,w/8,d/8),corner=key*2;
  B('ceramic',tint,x,y,z,w-2*corner,h,d);
  for(const side of [-1,1]){
    const end=x+side*(w/2-corner/2);
    B('ceramic',tint,end,y,z,corner,h,d-2*corner);
    for(const face of [-1,1]){
      const zz=z+face*(d/2-corner/2);
      B('ceramic',tint,end-side*key/2,y-h/4,zz,key,h/2,corner);
      B('ceramic',tint,end,y+h/4,zz-face*key/2,corner,h/2,key);
      B('metal',steel,end-side*key/2,y+h/4,zz+face*key/2,key,h/2,key);
    }
  }
}

export function spindle(frame, u, v, width, depth, bottom, height, seed, warm = false) {
  const {B,C,jointReveal=0} = frame;
  const courses = Math.max(1, Math.min(5, Math.round(height / 12.8)));
  const pitch = height / courses;
  const pale = warm ? bone : pearl;
  const lens = warm ? 0xda986b : 0x75bcc5;
  const hand = seed % 2 ? -1 : 1;
  for (let n = 0; n < courses; n++) {
    const y = bottom + n * pitch;
    const exposed = Math.min(pitch * .28, 5.12);
    const h = pitch - exposed;
    const polarity = (seed + n) % 2 ? -1 : 1;
    const w = width * (n % 3 === 1 ? .82 : .97), d = depth * (n % 3 === 0 ? .81 : .96);
    const x = u + unit(polarity * width * .13), z = v + unit(hand * ((n % 3)-1) * depth * .09);
    const shaftW = width * .45, shaftD = depth * .51;
    B('dark',charcoal,u,y+exposed/2,v,shaftW,exposed,shaftD);
    C(u,y+exposed/2,v,shaftW,exposed,shaftD);
    for (const side of [-1,1]) {
      const xx = u + side*(shaftW/2+.24);
      B('metal',steel,xx,y+exposed/2,v,.48,exposed,shaftD*.72);
      B('glass',0x97aeb5,u,y+exposed*.53,v+side*(shaftD/2+.09),shaftW*.68,exposed*.62,.16);
    }
    const wallBottom = y + exposed;
    const thickness = Math.min(1.28,h*.15);
    B('dark',charcoal,x,wallBottom+h/2,z,w,h,d);
    C(x,wallBottom+h/2,z,w,h,d);
    // The inhabited glazing wraps two sides of a projecting storage cartridge.
    // Each ceramic end shell steps back at its corner, leaving the edge exposed.
    for (const side of [-1,1]) {
      const outer = z + side*(d/2+.16);
      B('glass',warm?0xd6c2a5:0xc0d4d7,x,wallBottom+h*.47,outer,w-.64-2*jointReveal,h*.63,.32);
      const capW = w * .45, offset = (w-capW)/2;
      for(let row=0;row<3;row++) {
        const tread = .32*(2-row), reach = Math.max(.64,capW-tread*2);
        const xx = x + polarity * side * (offset + tread/2);
        const slabH = h*.15;
        B('ceramic',pale,xx,wallBottom+h*.31+row*slabH,outer+side*(.32+.16*row),
          reach,slabH,.64+.32*row);
      }
      B('metal',steel,x+side*(w/2+.08),wallBottom+h*.46,z,.32,h*.67,d*.74);
      B('glass',0xb2cacc,x+side*(w/2+.27),wallBottom+h*.44,z,.10,h*.31,d*.61);
      B('trim',pale,x+polarity*side*(w*.22),wallBottom+h*.84,outer,w*.53,.32,.96);
      if ((seed+n)%3===0) B('light',lens,x+polarity*side*(w*.22),wallBottom+h*.84-.21,outer+side*.32,w*.36,.12,.32);
    }
    B('metal',steel,x,wallBottom+(thickness-jointReveal)/2,z,w+.64,thickness+jointReveal,d+.64);
    if(n===courses-1){
      crownBand(B,pale,x,wallBottom+h-thickness/2+.16,z,w+1.28,thickness,d+1.28);
      B('dark',charcoal,x,wallBottom+h+.24,z,w-.64,.16,d-.64);
    }else{
      B('ceramic',pale,x,wallBottom+h-thickness/2,z,w+.32,thickness,d+.32);
      B('dark',charcoal,x,wallBottom+h-.16,z,w+.64,.32,d+.64);
    }
  }
}

// Two occupied service bars have different setbacks. The opening between them
// traverses the plot at street level. The next floor spans the passage and
// becomes a deep visible soffit from either end of the block.
export function splitConcourse(frame,w,d,bottom,h,seed,warm=false) {
  const {B,C} = frame, side = seed%2 ? -1 : 1;
  const slot = Math.min(4.8,Math.max(2.88,unit(w*.28)));
  const off = side * unit(Math.min(w*.10,1.28)), roof = bottom+h;
  const cap = Math.min(.96,h*.16), clear=h-cap;
  const lit=warm?0xe0ac80:0x9eced4;
  for(const k of [-1,1]) {
    const outer=k*w/2, inner=off+k*slot/2;
    const span=Math.abs(outer-inner), x=(outer+inner)/2;
    const inset=k===side?Math.min(3.2,unit(d*.24)):.32;
    // Opposed corners cut back in both street directions.
    const tail=k===side?.32:Math.min(2.56,unit(d*.20)), depth=d-inset-tail;
    const z=(tail-inset)/2, front=z+depth/2, back=z-depth/2;
    B('dark',charcoal,x,bottom+clear/2,z,span,clear,depth);
    C(x,bottom+clear/2,z,span,clear,depth);
    for(const v of [front,back]) {
      const facing=v===front?1:-1, panel=Math.max(.64,span-1.28);
      B('glass',warm?0xd8c0a2:0xaec9d1,x,bottom+clear*.52,v+facing*.06,panel,clear*.58,.12);
      B('metal',steel,x,bottom+clear*.20,v+facing*.16,span,.48,.32);
      for(let row=0;row<3;row++) B('ceramic',warm?bone:pearl,
        x+k*(span*.22-row*.16),bottom+clear*(.64+row*.10),v+facing*(.16+row*.16),
        Math.min(span,span*.57+row*.32),clear*.10,.64+row*.32);
    }
    // Inner return with windows and service shutters along the pedestrian run.
    const cells=Math.max(2,Math.round(depth/3.84)), bay=depth/cells;
    for(let i=0;i<cells;i++) {
      const zz=back+(i+.5)*bay;
      B('metal',steel,inner-k*.10,bottom+clear*.48,zz,.32,clear*.80,bay-.12);
      B('glass',i%3===1?0xe6ba8a:0xa4ccc8,inner-k*.29,bottom+clear*.55,zz,.12,clear*.47,bay-.56);
      B('ceramic',pearl,inner-k*.16,bottom+1.04,zz,.32,.32,bay-.32);
      if(i%3===seed%3)B('wash',lit,inner-k*.37,bottom+clear*.57,zz,.10,clear*.33,bay*.71);
    }
  }
  // Independent slabs expose a step in plan on both sides of the opening.
  const cols=3;
  for(let i=0;i<cols;i++) {
    const span=w/cols,x=-w/2+(i+.5)*span, dz=(i-1)*.64*side;
    B('ceramic',warm?bone:pearl,x,roof-cap/2,dz,span,cap,d+.32);
    C(x,roof-cap/2,dz,span,cap,d+.32);
    B('metal',steel,x,roof-cap-.12,dz,span-.16,.24,d);
  }
  // Gate linings wrap round the entrance into the actual undercroft. Their
  // separate tooth courses widen downwards to keep the passage open at eye
  // level; the two opposing entrances follow the offsets of the service bars.
  for(const k of [-1,1]){
    // Return the bonded column into the public opening so its end grain
    // clears both the side of the sill and the casing behind the door.
    const edge=off+k*(slot/2-(frame.jointReveal||0)), near=k===side? d/2-Math.min(3.2,unit(d*.24)):d/2-.32;
    const far=k===side?-d/2+.32:-d/2+Math.min(2.56,unit(d*.20));
    for(const [zz,face] of [[near,1],[far,-1]]){
      const bonded=Math.min(2.56,clear*.87),upper=clear*.87-bonded;
      const rows=Math.max(2,Math.round(bonded/.64));
      const course=bonded/rows, toe=bottom+clear*.075;
      if(upper>.01){
        B('ceramic',palePorcelain(k),edge+k*.48,toe+bonded+upper/2,zz+face*.38,.96,upper,.80);
      }
      for(let r=0;r<rows;r++){
        const yy=toe+(r+.5)*course;
        // Stretcher points along the alley, header turns towards the street.
        // Their outside faces sit at different depths, as do the edge keys.
        if(r%2===0){
          B('ceramic',palePorcelain(k),edge+k*.48,yy,zz+face*.32,.96,course,.96);
          B('metal',steel,edge+k*.64,yy,zz+face*.96,.64,course,.32);
        }else{
          B('ceramic',palePorcelain(k),edge+k*.64,yy,zz+face*.48,.64,course,1.28);
          B('ceramic',palePorcelain(k),edge+k*.16,yy,zz+face*.16,.32,course,.64);
        }
      }
      for(let j=0;j<3;j++){
        const u=edge+k*(.32-j*.32), y=bottom+clear-.48*(2-j);
        const reach=1.28+j*.32;
        B('ceramic',palePorcelain(k),u,y,zz+face*.40,reach,.48,1.60);
        B('light',lit,u,y-.27,zz+face*.93,reach-.32,.10,.48);
      }
    }
    B('wash',lit,edge,roof-cap-.22,0,slot*.32,.12,d*.78);
  }
  function palePorcelain(k){return k===side?(warm?bone:pearl):0x9aafb5;}
}
