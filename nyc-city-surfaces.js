import * as T from 'three';

const interiors=['records','repair','deli','flowers'];
export function shopInterior(title,variant=0){
  if(/RECORD|AUDIO|BOOK|MUSIC|ARCHIVE/i.test(title))return 'display-records';
  if(/FIX|TECH|REPAIR|ELECTRIC|CLINIC/i.test(title))return 'display-repair';
  if(/DELI|COFFEE|KITCHEN|GROCER|FOOD|NOODLE/i.test(title))return 'display-deli';
  return 'display-'+interiors[Math.abs(Math.round(variant))%interiors.length];
}

// Shared before district materials are cloned, so every district inherits
// the same texel scale. Pre-existing procedural maps remain the loading fallback.
export async function applyCitySurfaces(materials,renderer){
  const names=['brick','concrete','asphalt','iron',...interiors];
  const loader=new T.TextureLoader();
  const assets=await Promise.all(names.map(async name=>{
    if(typeof Image==='undefined')return null;
    try{return await loader.loadAsync('./city-surfaces/'+name+'.jpg');}
    catch(error){console.warn('City surface unavailable:',name,error);return null;}
  }));
  for(let i=0;i<names.length;i++){
    const name=names[i],texture=assets[i];
    if(texture){
      texture.colorSpace=T.SRGBColorSpace;
      texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      texture.wrapS=texture.wrapT=i<4?T.RepeatWrapping:T.ClampToEdgeWrapping;
    }
    if(i>=4){
      const mat=materials.warmWindow.clone();
      mat.name='NYC display / '+name;
      mat.userData.frontImage=true;
      mat.map=mat.emissiveMap=texture||mat.map;
      mat.emissive.set(0xfff6ec);mat.emissiveIntensity=.68;mat.roughness=.47;
      materials['display-'+name]=mat;
    }else if(texture){
      const keys=name==='brick'?['brick','brickBrown']:name==='iron'?['metal']:[name];
      for(const key of keys){
        const mat=materials[key];mat.map=texture;
        if(key==='asphalt'){
          // Compress high-frequency aggregate contrast before mipmapping.
          const tile=document.createElement('canvas');tile.width=tile.height=512;
          const g=tile.getContext('2d');g.drawImage(texture.image,0,0,512,512);
          g.fillStyle='rgba(68,72,76,.64)';g.fillRect(0,0,512,512);
          texture.image=tile;texture.needsUpdate=true;mat.userData.textureMeters=1.6;
        }
        if(name==='brick'){mat.bumpMap=null;mat.userData.textureMeters=1.35;}
        if(key==='brickBrown')mat.color.set('#ab928a');
      }
    }
  }
}
// Equipment fitted to the return wall above pedestrian headroom.
// Local u runs along the shopfront; negative v runs into the building.
export function addServiceBalcony(B,width,depth,side,lit){
  const x=side*(width/2+.36),z=-depth*.43;
  B('metal',x,4.32,z,.78,.16,2.7);
  for(const end of [-1,1]){
    B('metal',x,4.83,z+end*1.27,.72,.08,.08);
    B('metal',x+side*.32,4.82,z+end*1.27,.075,.95,.075);
    B('metal',x-side*.11,4.02,z+end, .35,.50,.13);
  }
  B('metal',x+side*.34,5.25,z,.08,.08,2.7);
  B('metal',x,4.85,z-.45,.59,.9,1.20);
  for(let i=0;i<7;i++)B('rubber',x+side*.305,4.55+i*.085,z-.45,.03,.044,.98);
  const pipe=side*(width/2+.11);
  B('metal',pipe,3.8,z+.85,.12,6.4,.12);
  B('metal',pipe,6.96,z+.32,.12,.12,1.16);
  for(const y of [1.42,3.1,5.7])B('metal',pipe,y,z+.85,.22,.12,.22);
  B(lit?'cyan':'lamp',x+side*.4,4.23,z,.045,.045,1.64);
}
