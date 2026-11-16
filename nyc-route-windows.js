import * as T from 'three';

// Four interior plates share the existing batched window geometry. Lit bays
// follow floors and neighbouring rooms, with a dark stair bay at one end.
export function routeWindow(profile,floor,bay,count){
  if(bay===count-1 && floor%3!==1)return 'glass';
  if(profile==='workroom')return floor===0||floor===2?(bay%3===1?'routeBlinds':'routeStudio'):'glass';
  if(profile==='tailor')return floor===0||floor===1?(bay%2?'routeBlinds':'routeAtelier'):'glass';
  if(profile==='pantry')return floor===0?(bay%3?'routeStock':'routeBlinds'):floor===2&&bay<2?'routeHome':'glass';
  return (floor+bay*2)%5<2?'routeHome':floor===1&&bay<2?'routeBlinds':'glass';
}
export function createRouteWindows(materials){
  for(const [key,wall,lit] of [
    ['routeHome','#995b37','#ffcb84'],['routeStudio','#455e6d','#b2d8dc'],
    ['routeAtelier','#a77553','#e6ce99'],['routeStock','#6d725b','#dec89c'],['routeBlinds','#51545c','#bba08b']]){
    const tile=document.createElement('canvas');tile.width=tile.height=128;
    const g=tile.getContext('2d');
    const rect=(colour,x,y,w,h)=>{g.fillStyle=colour;g.fillRect(x,y,w,h);};
    rect('#292e35',0,0,128,128);rect(wall,10,12,108,101);
    if(key==='routeHome'){
      rect('#583e3c',10,12,19,101);rect('#725048',101,12,17,101);
      rect('#4f3733',39,49,21,26);rect('#aa8968',42,52,15,20);
      rect('#483935',63,89,34,5);rect('#504038',67,94,4,19);
      rect('#5d4030',77,65,3,24);rect(lit,71,57,15,6);rect(lit,67,63,23,4);
    }else if(key==='routeBlinds'){
      for(let i=0;i<8;i++)rect(i%3?wall:lit,10,18+i*9,108,3);
      rect('#272d32',12,15,3,94);rect('#292f34',89,15,2,86);
    }else if(key==='routeStudio'){
      rect(lit,23,23,73,4);rect('#2e383e',16,83,96,5);
      for(const x of [29,74]){rect('#27343d',x,61,24,18);rect('#75a8ac',x+2,63,20,12);rect('#293339',x+10,78,3,6);}
    }else if(key==='routeAtelier'){
      rect('#4b453c',16,32,94,3);
      for(let j=0;j<5;j++){const x=18+j*18;rect('#544a41',x+6,35,2,8);rect(['#52625d','#be8866','#ddd0a9'][j%3],x,43,13,38+j%2*12);}
      rect('#4d4038',20,96,78,5);
    }else{
      for(let row=0;row<2;row++){const y=53+row*34;rect('#433c35',15,y,99,4);
        for(let j=0;j<5;j++){const h=11+(j+row)%3*4;rect(['#b39268','#777e71','#aa7659'][(j+row)%3],19+j*18,y-h,14,h);}}
    }
    rect('#272c30',0,113,128,15);
    // Four furnishing layouts share a material and its spatial batch.
    const atlas=document.createElement('canvas');atlas.width=512;atlas.height=128;
    const a=atlas.getContext('2d');
    for(let room=0;room<4;room++){
      a.save();a.translate(room*128,0);
      if(room%2){a.translate(128,0);a.scale(-1,1);}
      a.drawImage(tile,0,0);
      if(room===1||room===2){
        a.fillStyle=room===1?'#655359':'#70634f';a.fillRect(10,12,room===1?30:17,101);
        a.fillStyle='#34363b';a.fillRect(15,12,3,101);
        a.fillStyle='#393c39';a.fillRect(80,95,15,11);
        a.fillStyle='#4e5848';a.fillRect(82,83,10,13);a.fillRect(77,88,6,7);
      }
      if(room===3){a.fillStyle='#49484a';a.fillRect(10,12,108,32);
        a.fillStyle='#756b62';for(let y=15;y<43;y+=6)a.fillRect(10,y,108,2);}
      a.restore();
    }
    const map=new T.CanvasTexture(atlas);map.colorSpace=T.SRGBColorSpace;map.magFilter=T.NearestFilter;
    const m=materials.warmWindow.clone();m.name='NYC / '+key;m.map=m.emissiveMap=map;
    m.emissive.set('#fff1d7');m.emissiveIntensity=key==='routeBlinds'?.22:.63;m.userData.unitUV=true;m.userData.roomAtlas=true;
    materials[key]=m;
  }
}
