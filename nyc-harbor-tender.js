// Long-hulled municipal work vessel with a clear loading well between the
// forward deck gear and the multi-storey wheelhouse. The east side faces town.
export const serviceVessel = {x:-167.2,z:-7.2,yaw:-.43,beam:10.6,length:43.2,deck:2.78};

export function vesselPoint(u,y,v){
  const {x,z,yaw}=serviceVessel,c=Math.cos(yaw),s=Math.sin(yaw);
  return [x+u*c+v*s,y,z-u*s+v*c];
}

export function mooredTender(B,L,label){
  const {beam,length,deck,yaw}=serviceVessel;
  const F=(m,u,y,v,w,h,d,tint)=>B(m,...vesselPoint(u,y,v),w,h,d,tint,yaw);
  const rod=(m,a,b,w,d=w,tint)=>L(m,vesselPoint(...a),vesselPoint(...b),w,d,tint);
  const half=beam/2;

  const segment=length/27;
  for(let i=0;i<27;i++){
    const v=(i-13)*segment;
    const width=beam-Math.max(0,i-20)*.93-Math.max(0,4-i)*.52;
    const flank=width*.5;
    F('harborHullRust',0,-.77,v,width-.25,1.59,1.604,0xbaa994);
    F('harborHullBlue',0,.92,v,width,2.03,1.601,0xb8caca);
    F('harborBoot',flank-.03,1.80,v,.19,.38,1.605,0xd4c3aa);
    F('harborHullBlue',0,2.16,v,width+.09,.38,1.603,0xb6c5be);
    F('harborPlate',0,2.54,v,width+.13,.40,1.599,0xc4c5ac);
    F('harborTimber',0,deck-.042,v,width-.18,.084,1.583,0xbfb49c);
    if(i%3===0&&width>8){
      F('harborRust',flank-.025,.78,v,.14,1.30,1.25,0x9a9e8f);
      F('harborPlate',flank+.05,1.19,v,.16,.19,1.30,0xa8b9b4);
    }
    // Steel rub strakes and bulwarks stay out of the open centre loading well.
    const gangway=v>=-13.5&&v<=-10.5;
    if(Math.abs(v)>7.0&&!gangway){
      F('harborHullBlue',flank-.04,deck+.38,v,.25,.83,1.602,0xc3c9b2);
      F('harborBoot',flank+.03,deck+.82,v,.29,.18,1.602,0xd8c5a5);
    }else if(i%2===0){
      F('harborOchre',flank-.18,deck+.46,v,.15,.92,.16,0xcfb995);
    }
    F('harborPlate',-flank+.18,deck+.38,v,.22,.76,1.604,0xbebdaa);
  }

  // Hull-side bulkheads carry the bridge, stairs and the exposed olive winches.
  F('harborHullBlue',-.25,3.57,-12.10,8.9,1.58,9.65,0xc6c7b5);
  F('harborPlate',-.26,4.43,-12.10,9.14,.29,9.97,0xc6cbbb);
  F('harborEnamel',.28,5.58,-13.20,7.46,2.14,6.56,0xd2d2bb);
  F('harborHullBlue',.28,6.81,-13.20,7.93,.39,7.07,0xc6c9b5);
  for(const v of [-15.57,-14.10,-12.62,-11.15]){
    F('harborHullBlue',4.03,5.73,v,.27,1.31,1.26,0xaec0b8);
    F('coolWindow',4.175,5.75,v,.075,1.03,1.07,0xa7bbc2);
    F('harborOchre',4.19,5.14,v,.13,.12,1.27,0xc4bda0);
  }
  for(const u of [-2.40,-.72,.96,2.64]){
    F('harborHullBlue',u,5.73,-9.89,1.43,1.30,.25,0xaebeb4);
    F('coolWindow',u,5.72,-9.75,1.24,1.01,.07,0x9db7bd);
  }
  F('harborHullBlue',-.96,7.25,-14.70,3.38,.60,2.12,0xb8c6b4);
  F('harborOchre',-1.35,8.18,-14.65,.33,1.56,.41,0xc2b692);
  rod('harborEnamel',[-1.3,8.87,-16.15],[-1.3,8.87,-13.02],.15,.18,0xc9c4a8);
  F('cyan',-1.35,9.05,-14.65,.19,.17,.22,0x93aca7);
  for(let tread=0;tread<7;tread++){
    F('harborPlate',4.34,deck+.13+.23*tread,-7.07-.27*tread,.79,.19,.30,0xbfc5b0);
  }
  rod('harborOchre',[4.75,deck+1.00,-7.06],[4.75,4.89,-8.86],.067,.069,0xc1bca1);
  F('lamp',4.35,4.29,-9.97,.28,.095,2.69,0xcab083);

  // Centre bay contains tied-down frames with a large unobstructed working span.
  for(const [v,c] of [[-3.75,0xbfbba8],[1.45,0x9cafab],[5.54,0xcab298]]){
    F('harborRust',-1.12,deck+.56,v,3.38,1.10,2.35,c);
    F('harborPlate',-1.12,deck+1.19,v,3.46,.16,2.40,0xb7bdae);
    for(const u of [-2.50,-.70,.43])F('harborOchre',u,deck+.64,v+1.22,.17,1.21,.14,0xccb98a);
  }
  for(const v of [-5.65,-.28,5.24]){
    F('harborOchre',3.69,deck+.027,v,2.55,.054,.095,0xc7bc9f);
    F('harborHullBlue',half-.56,deck+.22,v,.31,.43,.43,0xa5b8ad);
  }
  for(const v of [11.13,17.92]){
    F('harborHullBlue',.45,deck+.36,v,3.38,.70,1.58,0xb6baaa);
    for(const u of [-.61,1.51]){
      F('harborOchre',u,deck+.91,v,.68,.84,.78,0xcebc98);
      F('harborPlate',u,deck+1.28,v,.84,.20,.94,0xb9bdad);
    }
  }

  // An offset deck-mounted crane reads against the skyline in the open bay.
  F('harborPlate',-.90,deck+.24,11.92,2.80,.48,2.13,0xaab5a6);
  F('harborOchre',-.90,4.59,11.92,1.35,3.13,1.21,0xe1c398);
  rod('harborOchre',[-.9,6.04,11.92],[3.12,8.55,7.10],.45,.45,0xd7bd9a);
  rod('harborOchre',[3.12,8.55,7.10],[4.85,7.59,3.93],.33,.31,0xe0c398);
  rod('harborHullBlue',[4.85,7.59,3.93],[4.85,4.69,3.93],.055);
  F('harborOchre',4.85,4.57,3.93,.37,.26,.31,0xd2c09d);
  F('lamp',3.92,7.93,5.09,.35,.094,.63,0xcbb990);
  label(...vesselPoint(half+.11,2.19,-.25),7.35,.61,'HUDSON 07','MUNICIPAL CARGO / 42M','#f0d8a6',Math.PI/2+yaw);
}
