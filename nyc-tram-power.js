// The East Loop tram takes current from a pair of contact wires. Cantilevers
// stand in the median, with the last support on the existing platform column.
export function buildTramPower({box,beam,collider}) {
  const stops=[{x:71,z:6.7},{x:90,z:6.7},{x:108,z:6.7},{x:127,z:7.2}];
  const wireZ=[.35,1.55];
  for(const [index,{x,z}] of stops.entries()){
    const platform=index===stops.length-1;
    if(!platform){
      box('stone',x,.63,z,1.04,.74,1.02,0xa2a49b);
      box('metal',x,1.46,z,.72,.96,.72,0x7d9193);
      collider(x,.98,z,1.04,1.62,1.02);
    }
    const bottom=platform?3.96:1.90;
    box('metal',x,(bottom+7.35)/2,z,.36,7.35-bottom,.40,0xb3b7ae);
    collider(x,(bottom+7.35)/2,z,.36,7.35-bottom,.40);
    box('trim',x,6.97,z,.56,.30,.56,0xaaa394);
    box('metal',x,7.20,(z+.12)/2,.26,.32,z-.12,0xa6b1af);
    beam('metal',[x,5.52,z],[x,7.08,z-3.7],.16,.19,0xa7a99c);
    for(const wz of wireZ){
      box('trim',x,6.86,wz,.25,.45,.25,0xaaa599);
      box('metal',x,6.56,wz,.10,.36,.10);
    }
    if(index===0||platform){
      // Transformer, cooling fins and the ceramic bushings feeding the line.
      box('metal',x,5.47,z+.75,1.32,1.38,1.02,0x8ba59d);
      box('trim',x,4.72,z+.68,1.53,.16,1.21,0xa8ada1);
      for(const dx of [-.50,-.25,0,.25,.50])
        box('metal',x+dx,5.42,z+1.33,.10,1.06,.26,0xc1b8a1);
      for(const dx of [-.37,.37]){
        box('trim',x+dx,6.37,z+.78,.23,.43,.23);
        beam('metal',[x+dx,6.62,z+.78],[x,7.15,z],.07,.07);
      }
    }
    if(!index)continue;
    const prev=stops[index-1].x,mid=(prev+x)/2;
    for(const wz of wireZ){
      beam('metal',[prev,6.42,wz],[mid,6.26,wz],.065,.065,0x808e90);
      beam('metal',[mid,6.26,wz],[x,6.42,wz],.065,.065,0x808e90);
    }
  }
}
