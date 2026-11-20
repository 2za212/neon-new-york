// The market court opens southwest onto the service street. Preserve the
// diagonal approach from the kerb to the landmark, and the service lane to its east.
export function furnishSpringNightMarket({B,light,collide,sign}){
  const iron=0x47595b,zinc=0xa2aa9d,ochre=0xce945c;
  const amber=0xffc28b,tea=0xe3dba4,jade=0x8ed0ba;
  const lens='districtWorkLens';
  function post(x,z,h){
    B('metal',x,.57,z,.32,.40,.33,iron);
    B('metal',x,.36+h/2,z,.17,h,.17,zinc);
    B('trim',x,h+.25,z,.39,.26,.38,ochre);
    collide(x,.36+h*.5,z,.20,h,.20);
  }
  // Shallow tent courses step up to a crossed ridge. Alternate woven bands
  // have solid hems and the underside has a work lamp above each stall.
  for(const [index,x,colour] of [[0,-38.03,amber],[1,-31.83,tea]]){
    const z=70.86;
    for(let bay=0;bay<8;bay++){
      const px=x+(bay-3.5)*.68;
      const tint=index?(bay%4===0?0xc4ab83:0x748d7b):(bay%4===0?0xccac83:0x9e635a);
      for(let row=0;row<5;row++){
        const pz=z+(row-2)*.68,h=3.64+(2-Math.abs(row-2))*.17;
        B(index?'sohoCanvas':'districtCanvas',px,h,pz,.675,.20,.71,tint);
      }
      B('trim',px,3.45,z+1.67,.65,.27,.14,bay%3===0?0xc3a878:0x8d7156);
    }
    for(let row=0;row<5;row++){
      const h=3.64+(2-Math.abs(row-2))*.17;
      collide(x,h,z+(row-2)*.68,5.44,.20,.71);
    }
    B('metal',x,3.60,z+1.49,5.58,.16,.28,iron);
    B('metal',x,3.81,z,5.56,.16,.24,zinc);
    B('metal',x,3.59,z-1.49,5.58,.16,.28,iron);
    for(const off of [-1.83,1.80]){
      B('metal',x+off,3.54,z,.38,.19,2.9,zinc);
      B(lens,x+off,3.40,z+1.02,.24,.075,.77,colour);
    }
    light(x,3.12,z+1.07,colour,98,15.5);
  }
  for(const [x,z] of [[-40.24,72.13],[-39.98,69.42],[-36.40,73.38],[-29.51,72.05],[-29.50,69.44]])post(x,z,3.22);
  // Stepped fabric lamps are visible from both street approaches. Every
  // shade shares the same hanging rod, scalloped shade and bottom cap.
  for(const [i,x] of [-40.12,-38.66,-35.80,-33.98,-30.02].entries()){
    const y=2.91+(i%2)*.15,z=72.31;
    B('metal',x,3.30,z,.065,.53,.065,iron);
    B('wood',x,y+.31,z,.46,.14,.40,ochre);
    B(lens,x,y+.15,z,.48,.23,.43,i%2?0xe7bf86:0xea935a);
    B(lens,x,y-.035,z,.62,.17,.54,i%2?0xe6c99b:0xde8950);
    B(lens,x,y-.19,z,.46,.15,.41,i%2?0xdcb888:0xc97d55);
    B('wood',x,y-.29,z,.31,.10,.30,ochre);
    B('trim',x,y-.40,z,.075,.13,.08,ochre);
  }
  // Mobile pick-up counter. Its attendant walks from the numbered shelves
  // to the shop basket. The small customer and prep aisles remain open.
  const px=-32.58,pz=70.98;
  B('wood',px,.62,pz,3.80,.43,.85,0xb39777);
  for(const x of [px-1.73,px+1.73]){
    B('metal',x,1.31,pz-.28,.15,1.85,.22,iron);
    B('metal',x,1.08,pz+.27,.12,1.28,.16,iron);
  }
  for(const h of [.90,1.54]){
    B('trim',px,h,pz,3.81,.14,.92,0xbcab83);
    for(let c=0;c<5;c++){
      if(h>1&&c===3)continue;
      const x=px+(c-2)*.66;
      B('lifePaper',x,h+.22,pz,.52,.32,.57,c%2?0xe6c597:0xc6ad8a);
      B('trim',x,h+.39,pz,.54,.055,.58,0xb89062);
      B('lifeCream',x+.10,h+.22,pz+.298,.15,.09,.029);
    }
  }
  collide(px,1.20,pz,3.79,1.70,.87);
  B('metal',px+1.62,1.87,pz,.39,.49,.38,iron);
  B(lens,px+1.62,1.90,pz+.21,.25,.26,.044,jade);
  B('trim',px,2.32,pz-.27,3.84,.28,.31,ochre);
  sign?.(px,2.38,pz-.063,3.48,.47,'夜班取菜','打 包  /  到 店 自 取','#b4dec0');
  for(const z of [69.60,71.69])B('metal',-40.50,3.98,z,1.02,.17,.16,iron);
  B('metal',-40.93,4.18,70.64,.28,.78,3.45,iron);
  sign?.(-41.085,4.18,70.64,3.32,.66,'街坊鲜集','今日到货  /  夜班食档','#f1c290',-Math.PI/2);
  // The back of the court already has real stalls and a taller north hall.
  // Expose those tiers beyond the entrance with task lamps and stall heads.
  for(const [x,z,y,colour] of [[-36.00,65.66,2.94,amber],[-31.26,65.67,2.94,tea],[-38.1,60.64,3.93,jade],[-32.0,60.68,3.93,amber]]){
    B('metal',x,y,z,3.22,.23,.38,iron);
    for(const off of [-.82,.82])B(lens,x+off,y-.145,z+.03,1.14,.065,.26,colour);
    light(x,y-.40,z+.56,colour,85,14);
  }
  // A two-sided loading beacon identifies the service-street side of the
  // existing market roof when walking back from the northern end.
  for(const z of [61.12,67.12]){
    B('metal',-40.7,3.54,z,.72,.24,.26,iron);
    B('metal',-40.98,2.96,z,.23,1.08,.57,iron);
    B(lens,-41.12,2.99,z,.065,.56,.39,jade);
  }
  // The service alley passes the rear wall of the apartment brick plinth.
  // The market's extraction vents and rising insulated feed are fixed above
  // the carriageway, clear of the lift hall and the upstairs windows.
  for(const z of [67.1,70.2,73.07]){
    B('metal',-24.78,3.58,z,.28,1.69,2.26,iron);
    B('rubber',-24.95,3.56,z,.11,1.28,1.91);
    for(let row=0;row<5;row++)B('metal',-25.03,3.09+row*.22,z,.15,.13,1.77,zinc);
    B('trim',-24.91,4.49,z,.54,.18,2.49,ochre);
    B('metal',-24.90,4.95,z+.88,.32,1.16,.26,iron);
  }
  for(let i=0;i<6;i++){
    const z=65.78+i*1.52;
    B('harborPaint',-24.97,5.53,z,.42,.47,1.48,0xa3afa3);
    B('trim',-25.02,5.53,z-.65,.48,.57,.13,zinc);
  }
}

