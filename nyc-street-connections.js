// Street-edge utility landmarks leave the full carriageways visible and clear.
export function buildStreetConnections({box:B,beam:L,collider:C,surface:S,sign}) {
  for(const [x,z,angle,colour,title] of [
    [47.1,10.7,0,'cyan','EAST LOOP'],
    [65.85,-54.6,Math.PI,'cyan','PARK DISTRICT'],
    [-15.5,52.05,Math.PI,'lamp','CANAL GRID'],
    [-63,-11.18,0,'lamp','HUDSON WORKS']
  ]){
    const c=Math.cos(angle),s=Math.sin(angle);
    const p=(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c];
    const part=(mat,u,y,v,w,h,d,tint)=>B(mat,...p(u,y,v),w,h,d,tint,angle);
    part('paver',0,.27,0,2.14,.18,1.32,0x9ca99c);
    S(x-1.07,x+1.07,z-.66,z+.66,.36);
    part('stone',0,.51,0,1.88,.30,1.13,0xb1b3a1);
    part('metal',0,1.15,0,1.64,.98,.86,0x8eaaa3);
    C(x,1.00,z,1.88,1.28,1.13);
    part('metal',0,1.63,0,1.80,.18,1.06,0xabb4a8);
    for(let i=0;i<7;i++)part('rubber',-.64+i*.184,1.03,.448,.08,.39,.04,0x8b958c);
    for(const u of [-.70,.70]){
      part('metal',u,2.4,-.25,.145,1.48,.16,0xa3b3af);
      L('metal',p(u,2.74,-.24),p(u,3.09,.31),.09,.09,0xa8b7ad);
      C(...p(u,2.36,-.25),.145,1.47,.16);
    }
    part('metal',0,3.12,.22,1.90,.25,.68,0x8fa5a6);
    C(...p(0,3.12,.22),1.90,.25,.68);
    part(colour,0,2.963,.26,1.65,.055,.13,0xa9bfb0);
    sign(...p(0,2.72,.365),1.60,.32,title,'MUNICIPAL SERVICE',colour==='cyan'?'#a9c7cd':'#d7c4a6',angle);
  }
  // Shrink the visual gap at the broad East Loop median with low reflectors.
  for(const x of [75,92,109]){
    B('stone',x,.31,6.04,1.28,.26,.74,0x87968b);
    B('metal',x,.48,6.04,1.34,.10,.80,0xa8aaa0);
    B('lamp',x-.37,.55,6.04,.19,.055,.51,0x936d4c);
    B('lamp',x+.37,.55,6.04,.19,.055,.51,0x936d4c);
    C(x,.355,6.04,1.34,.35,.80);
  }
}

export function buildSignalRoof(B,line,width,depth,height,variant) {
  const v=-depth*.29,u=width*.18;
  B('trim',u,height+1.45,v,3.64,.28,2.62,0xadb2a5);
  B('brickBrown',u,height+2.21,v,3.10,1.35,2.16,0xa8a39a);
  B('metal',u,height+2.95,v,3.44,.19,2.46,0xa7ada2);
  B('coolWindow',u,height+2.26,v+1.115,1.76,.46,.05,0x819fa6);
  B('metal',u+.73,height+4.11,v-.55,.16,2.32,.16,0x93a8ad);
  line('metal',[u+.73,height+4.95,v-.55],[u-1.06,height+4.95,v-.55],.085,0x96a8a5);
  B(variant%2?'cyan':'lamp',u+.73,height+5.35,v-.55,.20,.15,.22);
  for(const offset of [-1.09,1.09])B('metal',u+offset,height+3.23,v+.64,.27,.59,.31,0x92a095);
}
