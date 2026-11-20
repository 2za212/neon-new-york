// Four-sided city buildings seen above and between the walkable blocks.
// Input widths are lot limits. The free-flight collider follows each volume,
// including the air between a pair of inhabited towers.
export function buildSkylineProperty(box,x,z,w,d,height,variant,quarterTurn=false,collider){
  const width=quarterTurn?d:w, depth=quarterTurn?w:d;
  const hand=(Math.round(x+z)&1)?1:-1;
  const kind=Math.abs(variant)%3;
  const finish=['ceramicShell','titaniumSkin','basaltShell'][kind];
  const tint=[0xa7b9b7,0xaaa7a0,0xb3c5c8][Math.abs(Math.round(z))%3];
  function place(mat,u,y,v,sx,sy,sz,color=0xffffff,solid=false){
    const xx=x+(quarterTurn?v:u),zz=z+(quarterTurn?-u:v);
    const ww=quarterTurn?sz:sx,dd=quarterTurn?sx:sz;
    box(mat,xx,y,zz,ww,sy,dd,color);
    if(solid)collider?.(xx,y,zz,ww,sy,dd);
  }
  function deck(u,v,ww,dd,bottom,h,skin,occupied){
    const band=Math.min(h*.24,1.60);
    place(skin,u,bottom+(h-band)/2,v,ww,h-band,dd,tint,true);
    place('basaltShell',u,bottom+h-band/2,v,ww-.64,band,dd-.64,0xb4c2cb,true);
    if(occupied){
      for(const edge of [-1,1]){
        place('routeStudio',u,bottom+h-band*.52,v+edge*(dd*.5-.29),ww*.72,band*.68,.12,0xbeced1);
        place('routeHome',u+edge*(ww*.5-.29),bottom+h-band*.52,v,.12,band*.70,dd*.56,0xb9a899);
      }
    }
    // The cassette ends overlap at alternating corners. They project far
    // enough to break the outer contour when seen through several streets.
    for(const direction of [-1,1]){
      place(skin,u+direction*(ww*.5-.65),bottom+h-band*.43,v+direction*(dd*.5-.65),1.30,band*.86,1.30,tint,true);
      place('titaniumSkin',u+direction*(ww*.5-1.4),bottom+h-band*.84,v-direction*(dd*.5-.32),2.80,band*.30,.64);
    }
  }
  const podium=Math.min(8,height*.24);
  if(kind===0){
    // Split communications tower. Sky remains visible between the shafts
    // below the cross-floor as well as through the offset fork in the crown.
    deck(0,0,width,depth,0,podium,finish,true);
    const linkAt=height*.69,linkH=Math.max(1.92,height*.066);
    for(const edge of [-1,1]){
      const broad=edge===hand?.34:.27;
      const ww=width*broad,u=edge*(width*.5-ww*.5),top=height*(edge===hand?1:.84);
      let y=podium;
      for(let floor=0;floor<3;floor++){
        const h=(top-podium)/3,shrink=floor===2?.82:1;
        deck(u,edge*depth*.06,ww*shrink,depth*(.82-floor*.09),y,h,edge===hand?finish:'titaniumSkin',true);y+=h;
      }
    }
    deck(0,hand*depth*.15,width*.80,depth*.46,linkAt,linkH,'titaniumSkin',true);
  }else if(kind===1){
    // Service spine with two groups of living floors. Offset in both axes
    // so the valleys are visible from the reverse side of the property.
    const u=-hand*width*.28;
    place('basaltShell',u,height*.46,-depth*.14,width*.34,height*.92,depth*.57,0xcfced2,true);
    for(let level=0;level<4;level++){
      const low=level*height/4,h=height/4,stagger=level%2?1:-1;
      const ww=width*(level===3?.64:.76);
      deck(hand*width*.09+stagger*width*.025,stagger*depth*.11,ww,depth*(level===3?.64:.75),low,h,level===1?'ceramicShell':finish,true);
    }
  }else{
    // Climatic works. Twin low halls bracket an actual cut into the block.
    // The rear service terrace rises while the front sheds stay below it.
    for(const edge of [-1,1]){
      const ww=width*(edge===hand?.42:.34);
      deck(edge*(width*.5-ww*.5),depth*.10,ww,depth*.78,0,height*(edge===hand?.45:.30),'basaltShell',true);
    }
    for(let level=0;level<3;level++){
      const y0=level*height/3,ww=width*(.89-level*.17),dd=depth*(.46-level*.06);
      deck(hand*level*width*.07,-depth*.5+dd/2,ww,dd,y0,height/3,level===0?'basaltShell':'ceramicShell',true);
    }
  }
}
