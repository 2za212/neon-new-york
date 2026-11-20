// The last textile market turns towards the east loop. Its front, the
// return and the covered public passage share the same 32 cm timber course.
export function buildEastLoopMarket(frontage,opal,surface){
  const dark=0x5c6870,cast=0x89968d,zinc=0xb8b3a0,clay=0xc6a485;
  const warm=0xffc388,cold=0x9bdcd1;
  function solid(f,mat,u,y,v,w,h,d,hue){
    f.B(mat,u,y,v,w,h,d,hue);f.C(u,y,v,w,h,d);
  }
  function canopy(f,u,v,w,base,reach,hand){
    // The roof really climbs in thick staggered courses: brick corbels
    // on every other joint carry the deeper folded edge above the pavement.
    const bays=Math.max(2,Math.round(w/2.56)),module=w/bays;
    for(let j=0;j<bays;j++){
      const center=u+(j+.5-bays*.5)*module;
      const tip=reach+(j%3===0?.64:0),stagger=(j%2===0?.32:0);
      for(let k=0;k<3;k++){
        const depth=(3-k)*tip/3,y=base+.30+k*.53+stagger;
        solid(f,k===1?'sohoCanvas':'districtZinc',center,y,v+depth*.5,module,.57,depth,
          k===1?0xb4a78c:k===0?dark:cast);
      }
      f.B('districtZinc',center,base+.28+stagger,v+tip+.03,module-.22,.30,.22,j%2?clay:zinc);
      if((j+hand)%2===0){
        f.B(opal,center,base+.05+stagger,v+tip-.18,module*.70,.18,.38,warm);
        for(let k=0;k<3;k++){
          const length=tip*(1-k/3);
          solid(f,k===1?'brickBrown':'districtIron',center-module*.28,base-.28-k*.31,
            v+length*.48,.56,.32,length,k===1?clay:cast);
        }
      }
    }
  }
  const front=frontage(37.12,117.60,0);
  function textileShop(u,w,bays){
    const f=front,depth=3.2;
    solid(f,'brickBrown',u,2.48,-depth+.32,w,4.24,.64,clay);
    for(const s of [-1,1])solid(f,'brickBrown',u+s*(w/2-.32),2.48,-.75,.64,4.24,4.04,clay);
    solid(f,'districtIron',u,4.32,-.66,w+.32,.64,4.80,dark);
    for(let j=0;j<bays;j++){
      const c=u+(j+.5-bays/2)*w/bays,span=w/bays;
      f.B('warmWindow',c,2.36,-2.44,span-.54,2.31,.23);
      f.B('districtOak',c,1.06,.52,span-.63,.64,1.25,0xb68e62);
      f.C(c,.91,.52,span-.63,1.04,1.25);
      for(let i=0;i<3;i++){
        const x=c+(i-1)*.54,h=.85+.32*((i+j)%3);
        // Loom bolts have stepped shoulders and a small recessed spindle.
        const tint=[0x906f82,0x8fae99,0xcea173][(j+i)%3];
        f.B('districtCanvas',x,1.47+h/2,.23,.48,h,.56,tint);
        f.B('districtCanvas',x,1.54+h,.23,.32,.16,.40,tint);
        f.B('districtIron',x,1.66+h,.23,.17,.12,.18,cast);
      }
    }
    canopy(f,u,1.08,w+.64,4.02,2.58,bays);
    f.glow(u,3.09,-.28,0xffac72,192,14);
  }
  textileShop(-11.36,6.40,2);
  textileShop(4.16,15.36,5);
  // Green Street's pedestrian passage at x29..33 stays open to the roof.
  // The clerestory sits on the masonry wings and can be seen from both ends.
  solid(front,'districtIron',-5.76,5.38,-.38,5.44,.64,4.48,cast);
  for(const v of [-2.44,1.60]){
    for(let j=0;j<3;j++){
      const x=-7.5+j*1.76;
      front.B('districtIron',x,6.32,v,1.60,1.44,.64,dark);
      front.B('coolWindow',x,6.39,v+(v<0?-.34:.34),1.08,.72,.16);
    }
  }
  solid(front,'districtZinc',-5.76,7.14,-.38,5.76,.48,4.80,cast);
  // The textile press: an occupied sawtooth sorting floor at the outside
  // corner. Its three unequal bays step up into the corporate transfer deck.
  for(let j=0;j<3;j++){
    const x=4.16+j*3.04,base=5.58+j*.61;
    solid(front,'brickBrown',x,base+.78,-1.44,3.04,1.56,2.88,clay);
    front.B('districtIron',x,base+.78,.10,2.52,1.31,.38,dark);
    front.B(j===0?'warmWindow':'coolWindow',x,base+.80,.30,1.92,.87,.16);
    solid(front,'districtZinc',x,base+1.71,-1.13,3.36,.41,3.59,cast);
  }
  // At the end, copper-coloured clamps alternate in both axes around the
  // hollow iron pier. Their undercuts silhouette against the lit work floor.
  const bend=frontage(49.12,117.60,0);
  solid(bend,'brickBrown',.25,2.67,-.04,1.18,4.62,1.28,clay);
  for(let k=0;k<5;k++){
    const y=1.01+k*.94,s=k%2;
    solid(bend,s?'districtZinc':'districtIron',.43+s*.36,y,.32-s*.33,
      s?1.58:2.30,.62,s?2.30:1.60,s?clay:cast);
    if(k===2||k===4)bend.B(opal,.45,y-.29,1.05,.82,.18,.35,warm);
  }
  const side=frontage(49.44,115.84,Math.PI/2);
  canopy(side,-.32,0,7.04,4.01,2.24,2);
  for(const u of [-2.67,-.40,2.05]){
    side.B('districtIron',u,2.30,.06,1.95,3.86,.26,dark);
    side.B('warmWindow',u,2.52,.24,1.43,1.90,.13);
    solid(side,'districtOak',u,1.12,.58,1.74,1.22,.94,0xa88d73);
  }
  side.glow(-.55,3.23,.60,0xffba87,154,12);

  // The noodle kitchen on the other side collects steam from the hoods:
  // these heavier returns carry its extract riser around the corner.
  const noodle=frontage(66.8,140.60,-Math.PI/2);
  canopy(noodle,0,.16,8.44,5.09,2.50,3);
  const gable=frontage(71.36,136.40,Math.PI);
  canopy(gable,0,0,9.84,4.66,1.60,0);
  // The north-facing serving window is cut through the original kitchen.
  // The pair of steamers and the back of the hood sit behind its glazing.
  const stove=frontage(68.48,136.40,Math.PI);
  stove.B('districtIron',0,1.20,-1.04,2.83,.43,.95,dark);
  stove.B('warmWindow',0,2.21,-1.74,2.74,1.74,.16);
  for(const [u,h] of [[-.65,.56],[.62,.80]]){
    stove.B('districtZinc',u,1.43+h/2,-1.05,.82,h,.70,cast);
    stove.B('districtZinc',u,1.49+h,-1.05,.61,.16,.56,zinc);
    stove.B('districtIron',u,1.65+h,-1.05,.24,.16,.27,dark);
  }
  stove.B('districtZinc',0,3.18,-1.19,3.02,.43,1.58,cast);
  stove.B(opal,0,2.94,-.78,2.37,.13,.23,warm);
  stove.glow(0,2.52,-.75,0xf4b177,57,7);
  for(let k=0;k<4;k++){
    const y=1.43+k*1.24,u=-.66+(k%2?.32:0);
    solid(gable,'districtIron',u,y,.28,1.28,.80,.90,cast);
    solid(gable,'districtZinc',u,y+.46,.35,1.64,.25,1.04,clay);
    if(k===2)gable.B(opal,u,y,.79,.68,.29,.19,cold);
  }
  // The kitchen return drops into a sheltered heat exchanger at the edge
  // of its own threshold. The slotted core sits behind stepped ceramic jaws.
  const inlet=frontage(65.72,135.75,-Math.PI/2);
  solid(inlet,'districtIron',0,.62,.03,2.66,.50,1.50,dark);
  for(const s of [-1,1]){
    for(let j=0;j<3;j++){
      const u=s*(1.06-.16*j),y=.96+j*.27;
      solid(inlet,j===1?'districtZinc':'stone',u,y,.12-j*.08,
        .47,.29,1.44-j*.32,j===1?cast:zinc);
      // The short end is seen head-on when leaving the kitchen. Its ribs
      // turn the corner through the same casting as the street-facing vent.
      inlet.B('districtZinc',u+s*.245,y+.045,.12-j*.08,.17,.18,1.18-j*.24,clay);
      inlet.B(opal,u+s*.34,y-.06,.20-j*.08,.08,.13,.67-j*.12,
        j===1?0xba8d64:0x394e53);
    }
  }
  for(let i=0;i<3;i++){
    const y=.93+i*.25;
    inlet.B('districtIron',0,y,.39,1.50,.22,.68,dark);
    inlet.B(i===1?opal:'districtZinc',0,y,.735,1.12,.13,.11,i===1?0xf3bc83:clay);
  }
  for(const u of [-.58,-.20,.20,.58]){
    inlet.B('districtIron',u,1.49,.06,.21,.54,.91,cast);
    inlet.B('districtZinc',u,1.77,.06,.22,.12,.59,clay);
  }
  inlet.glow(.73,1.14,.80,0xf1ab75,19,5);
  inlet.glow(1.65,1.48,.93,0xa6d1cc,9,3.8);
  // Slotted platform stones project into the existing 0.18 m curb. The
  // stepped outline and top surfaces are walkable at both ends of the run.
  const apron=frontage(62.77,134.33,0),widths=[.32,.64,.96,1.28,1.28,.96,.64,.32];
  for(const [i,w] of widths.entries()){
    const v=i*1.28,cz=134.33+v,x=62.77-w/2;
    apron.B('districtIron',-w/2,.245,v,w,.13,1.275,dark);
    if(w<.90){
      apron.B('stone',-w/2,.330,v,w,.06,1.22,zinc);
    }else{
      apron.B('stone',-.16,.330,v,.32,.06,1.22,zinc);
      apron.B('stone',-w+.10,.330,v,.20,.06,1.22,zinc);
      for(const dz of [-.48,0,.48]){
        apron.B('districtZinc',-(w+.12)/2,.329,v+dz,w-.50,.065,.21,cast);
        apron.B(opal,-(w+.12)/2,.371,v+dz,w-.56,.035,.13,0x343d39);
      }
    }
    surface(x-w/2,x+w/2,cz-.64,cz+.64,.36);
  }
}
