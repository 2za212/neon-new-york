// The public Greenway remains open above the municipal distribution truss.
export function buildCivicLink({box,beam,collider}) {
  const steel='metal', concrete='stone';
  const deckZ=-28.6, returnZ=-32.29;
  const roomZ=-28.80;
  for(let x=-9.6;x<=9.6;x+=3.2){
    box(steel,x,5.66,deckZ,3.18,.38,3.90,0x8a9b99);
    for(const z of [-30.46,-26.74]){
      box(steel,x,5.48,z,3.10,.19,.32,0xa6b0ab);
      box(steel,x-1.5,5.80,z,.19,.37,.49,0x9baba8);
    }
  }
  collider(0,5.66,deckZ,22.4,.40,3.92);
  // A service gallery sits above head height on the occupied greenway deck.
  const room=(mat,x,y,z,w,h,d,tint)=>{box(mat,x,y,z,w,h,d,tint);collider(x,y,z,w,h,d);};
  room(steel,0,10.98,roomZ,23.70,2.36,3.50,0xa7b6b6);
  box(concrete,0,12.29,roomZ,24.30,.28,3.88,0xc1c4b3);
  box(steel,0,9.70,roomZ,24.15,.38,3.87,0xb0baba);
  collider(0,9.70,roomZ,24.15,.38,3.87);
  for(const face of [-1,1]){
    const z=roomZ+face*1.78;
    for(const x of [-8.8,-4.4,0,4.4,8.8]){
      box(concrete,x,11.00,z,3.77,1.97,.24,0xc6c7b3);
      box(steel,x,11.02,z+face*.14,3.45,1.60,.16,0x91a5a9);
      for(const u of [-1.04,0,1.04]){
        box('coolWindow',x+u,11.20,z+face*.23,.89,.88,.065,0x9bbac6);
        box(steel,x+u,10.44,z+face*.29,.89,.28,.16,0xa5b7bb);
      }
      box('lamp',x,10.07,z+face*.40,1.36,.075,.12,0xb0bbb1);
    }
    for(const x of [-11,-6.6,-2.2,2.2,6.6,11]){
      box(steel,x,11.03,z+face*.29,.32,2.33,.61,0xa5b5b7);
      box(concrete,x,12.05,z+face*.35,.64,.24,.68,0xb1bbb2);
    }
  }
  for(const side of [-1,1]){
    const x=side*10.15;
    room(concrete,x,10.94,-32.24,3.20,2.70,3.6,0xb6b9a9);
    box(steel,x-side*1.64,10.78,-32.24,.19,1.32,3.27,0xa3b4b4);
    box('coolWindow',x-side*1.75,11.12,-32.24,.058,.64,2.96,0x98b7bd);
    box(concrete,x+side*1.23,10.08,-33.82,3.24,4.75,.63,0xbabab0);
    box(steel,x,8.77,-31.48,1.6,1.62,1.19,0x9cabab);
    collider(x,8.77,-31.48,1.6,1.62,1.19);
    for(const z of [-30.09,-27.59]){
      beam(steel,[side*10.5,7.66,z],[side*7.87,9.52,z],.26,.28,0xadb6b6);
    }
    // Return at the third storey, against the actual south wall of the block.
    box(concrete,x,5.83,returnZ,2.46,.65,3.22,0xa5a99e);
    box(steel,x,7.10,returnZ,2.46,1.95,3.22,0x819999);
    box('trim',x,8.20,returnZ,2.62,.25,3.44,0xb1b6ac);
    collider(x,7.02,returnZ,2.62,2.60,3.34);
    box(concrete,x+side*1.31,6.93,-33.98,2.75,3.45,.55,0xa6aaa1);
    box('trim',x+side*1.31,8.64,-33.72,2.92,.26,.60,0xc4c3ae);
    box('coolWindow',x+side*1.28,7.22,-33.67,1.75,1.72,.08,0x91adb2);
    for(const z of [-33.6,-32.8,-32.0,-31.2]){
      box('coolWindow',x-side*1.245,7.08,z,.045,1.12,.59,0x839eac);
      box(steel,x-side*1.28,6.47,z,.13,.12,.68,0xabb5af);
    }
    box(steel,side*8.8,5.36,deckZ,2.05,.40,3.58,0xb1b8ae);
    for(const z of [-29.9,-27.3]){
      beam(steel,[side*8.8,4.41,z],[side*6.25,5.46,z],.25,.24,0xa8b1a8);
      beam(steel,[x,5.59,-32.9],[side*8.8,4.59,-29.45],.22,.26,0xa1b0a8);
    }
    box(steel,side*9.55,5.27,-30.14,.88,.52,1.06,0x8baca1);
    box('lamp',side*9.55,4.99,-30.15,.64,.06,.72,0xc8caad);
    for(const z of [-33.3,-32.34]){
      box('metal',side*11.52,5.19,z,.50,.78,.81,0x859b91);
      box('cyan',side*11.24,5.26,z,.055,.085,.46,0x8ebeb8);
    }
  }
}
