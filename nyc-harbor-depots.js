import {keyedCasting} from './nyc-field-voxels.js';
// Cargo arrives through pressure locks under prefabricated dockside caissons.
// All measurements use the .32 m module. The cut from the pavement goes
// through the ground shell and its collision, including a service-street exit.
const alloy='titaniumSkin',skin='ceramicShell',carbon='basaltShell';
const signal='harborBeacon',copper='harborOchre';
const depotSections=[
  {hand:-1,cut:4.48,front:2.56,top:4.48,offset:5.44,ink:0x82d0c9,lining:0x779eae},
  {hand: 1,cut:3.20,front:1.60,top:2.56,offset:3.20,ink:0xe3ac77,lining:0x949296},
  {hand:-1,cut:5.76,front:2.88,top:3.84,offset:4.48,ink:0x99d4cb,lining:0x7a9ea2},
  null,
  {hand: 1,cut:5.12,front:1.28,top:5.12,offset:2.88,ink:0xebad78,lining:0x728fa5},
  {hand:-1,cut:3.84,front:1.92,top:2.56,offset:4.80,ink:0x9ed7cc,lining:0x79a8ac},
];
export function buildDepot({F,block,panel,light,label},w,d,height,index,title){
  const {hand,cut,front,top,offset,ink,lining}=depotSections[index];
  const back=-d,seat=-4.48;
  const mass=(mat,x,start,end,lo,hi,width,tint=0xffffff)=>block(mat,x,(lo+hi)/2,(start+end)/2,width,hi-lo,end-start,tint);
  const cast=(mat,x,start,end,lo,hi,width,tint=0xffffff,seed=0)=>
    keyedCasting({panel,box:F},mat,x,(lo+hi)/2,(start+end)/2,width,hi-lo,end-start,tint,seed);
  const highX=hand*(w/2-2.56),bayX=-hand*2.56,clear=w-5.12;
  // A tall service spine takes the forward corner. The other two thirds
  // of the plot surrender ground floor to a 3.2–5.76 m covered loading yard.
  mass(alloy,highX,back,front,.36,5.28,5.12,lining);
  const bayWidth=clear/3,podIndex=index%3,podX=bayX+(podIndex-1)*bayWidth;
  const well=cut+2.56;
  // The whole transfer cell is removed from the load-bearing core. A liner
  // and battery exchange cradle take the back, leaving real room in front.
  mass(carbon,podX,back,-well,.36,5.28,bayWidth,0xa1b2bc);
  mass(alloy,podX,-well,-cut,4.70,5.28,bayWidth,lining);
  for(const side of [-1,1]){
    const jamb=podX+side*(bayWidth/2-.16);
    mass(alloy,jamb,-well,-cut,.36,4.70,.32,lining);
  }
  // Recess the centre course and seat the corner castings around the service lamps.
  for(const side of [-1,1]){
    cast(skin,highX+side*1.76,front-.16,front+.80,.36,2.28,1.60,0xcbdad0,index);
    cast(alloy,highX+side*1.76,front-.16,front+.48,2.28,4.20,.96,lining,index+1);
  }
  cast(carbon,highX,front-.16,front+.48,.36,1.32,1.92,0xa2adb4,index);

  for(let i=0;i<3;i++){
    const u=highX+hand*(.96-i*.96),yy=3.03+i*.32;
    F(alloy,u,yy,front+.32,.96,1.92,.64,lining);
    F(signal,u,yy,front+.66,.56,1.28,.08,i===1?0xffce87:ink);
  }
  for(let col=0;col<3;col++){
    const u=bayX+(col-1)*bayWidth;
    if(col===podIndex){
      const nose=-well+1.24;
      F('roomLoading',u,2.60,-well+.12,bayWidth-.80,2.96,.16,0x77b9b4);
      // Rectilinear shoulders close around a recessed core. A gap in the
      // jaw reveals the cradle and rear lamps even from across the avenue.
      for(const side of [-1,1]){
        const jaw=u+side*.97;
        F(carbon,jaw,2.48,nose,.64,2.72,1.60,0x8293a4);
        for(let tooth=0;tooth<3;tooth++){
          const y=1.42+tooth*.96,reach=tooth===1?.16:.48;
          F(copper,jaw-side*reach/2,y,nose,.64+reach,.48,1.92);
          F(signal,jaw-side*reach/2,y,nose+.99,.51+reach,.32,.16,0xf6b16c);
        }
        F(skin,jaw+side*.20,3.9,nose,1.28,.48,2.24,0xb7d6d2);
      }
      block(alloy,u,1.25,-well+1.12,2.98,1.78,1.97,lining);
      F(signal,u,2.90,-well+.64,.80,1.32,.36,ink);
    }else{
      mass(carbon,u,back,-cut,.36,5.28,bayWidth,0xa1b2bc);
      F(alloy,u,2.83,-cut+.17,bayWidth-.22,4.48,.32,lining);
      F(carbon,u,2.84,-cut+.38,bayWidth-.66,3.52,.22);
      for(let rib=0;rib<5;rib++)
        F(rib===4?skin:alloy,u,1.32+rib*.63,-cut+.56,bayWidth-.87,.27,.27,0xc6d2cd);
    }
    F(signal,u,4.47,-cut+.57,bayWidth-.84,.24,.13,ink);
    F(signal,u,4.98,-cut*.48,bayWidth*.62,.16,.64,0xffcb86);
  }
  for(const e of [-1,1]){
    const u=highX+e*1.76;
    F(skin,u,4.81,front-1.12,.96,.94,3.20,0xd3daca);
    F(carbon,u,4.32,front-.96,.64,.32,2.56,0x9bafba);
  }
  // An offset inspection gallery behind the elevated railway cuts through
  // the end wall. Its three diaphragms, sill and head stand in front of the
  // deep thermal core. They replace a painted band of industrial sash.
  const inspect=index<3,depth=inspect?2.88:.64;
  mass(alloy,0,back+depth,seat,5.28,height,w-.64,lining);
  mass(alloy,0,back,back+depth,5.28,6.72,w-.64,lining);
  for(const end of [-1,1])
    mass(carbon,end*(w/2-.64),back,back+depth,6.72,height,1.28);
  F(skin,0,height-.16,back+depth/2,w,.32,depth+.32,0xc5d4cf);
  for(let bay=-1;bay<2;bay++){
    const u=bay*4.80;
    F(bay===0?'roomStock':'roomLoading',u,8.21,back+depth-.05,4.12,2.24,.20,bay===0?0xd3ae84:ink);
    F(carbon,u,6.88,back+depth*.42,4.30,.32,depth+.36);
    for(const end of [-1,1])
      F(alloy,u+end*1.64,8.12,back+depth*.53,.64,2.56,depth*.66+.32,0x9ebcc2);
    F(skin,u,8.98,back+depth*.48,3.52,.39,depth*.68+.32,0xc5d3c9);
    F(copper,u+.18,7.36,back+depth*.52,1.60,.64,.96);
  }
  // The raised nose has a stepped cross-section AND a staggered plan.
  // Three demountable chambers alternate between projecting out over the
  // loading cut and retreating into the spine on the street-return side.
  const pitch=w/3;
  for(let i=0;i<3;i++){
    const u=-w/2+(i+.5)*pitch,recess=hand*(i-1);
    const lid=height+top*(recess===1?1:recess===0?.50:0);
    const nose=offset+(recess===1?1.28:recess===0?-.32:-1.92);
    const ceil=5.28+(recess<0?.64:0),cheek=lid-2.56;
    mass(carbon,u,seat,nose+.16,ceil,cheek,pitch-.16,0x99aab9);
    // Paired bent ceramic plates clip into the recessed centre. Their
    // individual toes make the seams visible from along the facade.
    for(let j=0;j<3;j++){
      const x=u+(j-1)*pitch/3;
      const toe=j===1?.32:0,lip=nose+.64+toe;
      cast(j===1?alloy:skin,x,seat,lip,cheek,lid-1.28,pitch/3-.05,j===1?lining:0xd9dfd3);
      cast(skin,x,seat,lip-.64,lid-1.28,lid-.64,pitch/3-.05,0xb3c3bd);
      cast(alloy,x,seat,lip-1.28,lid-.64,lid,pitch/3-.05,lining);
    }
    F(carbon,u,(ceil+cheek)/2,nose+.19,pitch-.48,cheek-ceil,.56);
    const portH=cheek-ceil-.56;
    // A cold-store inspection bay has occupied depth. Let discrete heat
    // exchangers show their state inside the window, even across the street.
    const windowY=(ceil+cheek)/2,windowW=pitch-1.44;
    F('roomSupplies',u,windowY,nose+.50,windowW,portH,.16,0x94aaac);
    for(const side of [-1,1]){
      const xx=u+side*windowW*.24;
      F(alloy,xx,windowY,nose+.70,windowW*.39,portH*.86,.32,lining);
      for(let stage=0;stage<3;stage++){
        const sy=windowY+(stage-1)*portH*.24;
        F(carbon,xx,sy,nose+.91,windowW*.33,portH*.18,.24);
        F(signal,xx+side*.08,sy+.06,nose+1.06,windowW*.23,.14,.10,stage===1?0xf5bd8d:ink);
      }
    }
    F(skin,u,windowY,nose+1.04,.32,portH+.32,.80,0xc4ceca);
    for(const r of [-1,1])F(skin,u+r*(pitch/2-.48),(ceil+cheek)/2,nose+.44,.64,cheek-ceil+.64,.96,
      r===hand?0xd2dcd6:0x98aab0);
    // Sawtooth cooling doors take the place of a row of rectangular windows.
    for(let r=0;r<3;r++)
      F(alloy,u+(r-1)*1.28,ceil+.52+r*.32,nose+.64,1.28,.64+r*.64,.48,lining);
    const soffitDepth=nose-seat;
    F(alloy,u,ceil-.18,(nose+seat)/2,pitch-.16,.36,soffitDepth,0x90aab5);
    for(const end of [-1,1]){
      const xx=u+end*(pitch/2-.64);
      F(carbon,xx,ceil-.48,(seat+nose-.96)/2,.96,.64,soffitDepth-.96,0x7795a1);
      F(skin,xx,ceil-.80,(seat+nose-3.20)/2,.64,.32,soffitDepth-3.20,lining);
    }
    // Full depth of each roof box appears on the service street and riverside.
    const length=(d+seat)*(.60+.15*(recess+1));
    mass(alloy,u,seat-length,seat,height,lid+.01,pitch-.24,lining);
    F(skin,u,lid+.24,seat-length/2,pitch,.48,length+.32,0xc0d1ca);
    for(const e of [-1,1]){
      const side=u+e*(pitch/2-.08);
      F(alloy,side,cheek-.24,seat-length/2,.36,.48,length,lining);
    }
  }
  // Continue the panel joint around the lane-facing sides. Three large joints
  // remain intelligible when the camera is down the block, below the pipes.
  for(const side of [-1,1])for(let bay=0;bay<3;bay++){
    const x=side*(w/2-.12),z=-4.16-(bay+.5)*(d-4.32)/3,span=(d-4.32)/3;
    F(skin,x,6.15,z,.64,1.34,span-.14,0xaac3c6);
    F(alloy,x,8.57,z,.96,.64,span-.48,0x9cb8be);
    F(signal,x+side*.34,7.4,z,.13,.64,span-.80,bay===1?0xe2ad78:ink);
    F(carbon,x+side*.30,7.37,z+span*.33,.48,1.28,.32);
  }
  light(bayX,4.55,-cut*.45,0xc9dbb0,105,10);
  if(title){
    const span=Math.min(clear-1,7.60);
    for(const edge of [-1,1])F(alloy,bayX+edge*(span/2-.64),4.87,.08,.32,.74,.80,lining);
    label(bayX,4.42,.48,span,.76,title,'港务夜班  /  货舱交换',index%2?'#ffd18b':'#99e7d6');
  }
}
