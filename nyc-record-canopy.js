import * as T from 'three';

// Build in shop coordinates so the slats, hardware and drain share the same datum.
export function addRecordShopCanopy(f) {
  const left = -5.03, right = 1.14, lip = 1.61;
  const panels=5,pitch=(right-left)/panels;
  for(let i=0;i<panels;i++){
    const u=left+(i+.5)*pitch;
    for(let j=0;j<4;j++){
      const y=3.53-.10*j,v=.30+j*.36;
      f.B(j===2?'ceramicShell':'titaniumSkin',u,y,v,pitch-.032,.20,.42,j===2?0xd6ddcb:0x9aa8ad);
    }
    f.B('basaltShell',u,3.16,lip-.12,pitch-.03,.25,.36);
    if(i%2===0)f.B('sampleWarm',u,3.04,lip-.15,pitch-.21,.08,.20,0xf2d5a8);
  }

  for(const u of [left+.09,-1.35,right-.09]){
    f.B('sampleIron',u,3.20,.22,.15,.53,.12);
    f.L('sampleIron',[u,2.99,.26],[u,3.17,lip-.04],.048);
    f.L('metal',[u,3.49,.26],[u,3.16,lip-.04],.042);
  }
  // Open gutter between the hem and awning stay; a pitched leader returns
  // to the cast-iron pier and discharges into a grated sidewalk channel.
  f.B('metal',(left+right)/2,3.135,lip-.055,right-left,.035,.14);
  for(const v of [lip-.12,lip+.01]) f.B('sampleIron',(left+right)/2,3.17,v,right-left,.08,.028);
  const down = left+.08;
  const pipe = [[down,3.14,lip-.055],[down,2.96,lip-.055],[down,2.70,.49],[down,.58,.49],[down,.45,.64]];
  for(let j=1;j<pipe.length;j++) f.L('sampleTeal',pipe[j-1],pipe[j],.095);
  for(const y of [.75,1.63,2.51]) f.B('metal',down,y,.49,.14,.045,.13);
  f.B('sampleVinyl',down,.366,2.6,.16,.012,4.02);
  for(let i=0;i<43;i++) f.B('metal',down,.375,.65+i*.092,.15,.016,.024);
  // Shelter applies only below the stepped acoustic visor; keep the headroom walkable.
  const bounds=new T.Box3();
  for(const u of [left,right]) for(const v of [.17,lip]) bounds.expandByPoint(new T.Vector3(...f.P(u,3.17,v)));
  bounds.max.y=3.56;
  return {bounds};
}
