import * as T from 'three';
import {unitDepth,unitTone} from './nyc-unit-bond.js';

// One repeat spans 2.56 m. Each removable panel has a stepped joint on the
// same 16 cm grid as the bays and supports built from it.
const skins = [
  {key:'ceramicShell', name:'fired ceramic rainscreen', face:[204,201,182], gasket:[87,96,96], rough:.73, metal:.12},
  {key:'titaniumSkin', name:'folded titanium cassette', face:[143,170,180], gasket:[59,79,89], rough:.46, metal:.44},
  {key:'basaltShell', name:'sintered basalt composite', face:[99,112,122], gasket:[51,63,69], rough:.84, metal:.16}
];

export function panelAt(x,y,kind) {
  const cellX=(x&255)>>4, cellY=(y&255)>>4;
  const courseHeight=kind===1?8:4;
  const course=Math.floor(cellY/courseHeight);
  const shift=(course%2)*4+((cellY%courseHeight)>=(courseHeight-2)?1:0);
  const span=kind===2?4:8;
  return course*8+Math.floor(((cellX+shift)&15)/span);
}

function tile(bytes, color, anisotropy) {
  const map=new T.DataTexture(bytes,256,256);
  if(color)map.colorSpace=T.SRGBColorSpace;
  map.wrapS=map.wrapT=T.RepeatWrapping;
  map.magFilter=T.LinearFilter;
  map.minFilter=T.LinearMipmapLinearFilter;
  map.generateMipmaps=true;
  map.anisotropy=anisotropy;
  map.needsUpdate=true;
  return map;
}

export function installBuildingSkins(materials,anisotropy) {
  for(const [kind,skin] of skins.entries()) {
    const color=new Uint8Array(256*256*4), response=new Uint8Array(color.length);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++) {
      const panel=panelAt(x,y,kind);
      const seam=panel!==panelAt(x-2,y,kind)||panel!==panelAt(x,y-2,kind);
      const rim=panel!==panelAt(x+3,y,kind)||panel!==panelAt(x,y+3,kind);
      const latch=(x%128>=98&&x%128<111&&y%128>=22&&y%128<27);
      const col=x>>5,row=y>>5;
      const depth=unitDepth(col,row,kind);
      const seat=(x&31)<4&&unitDepth(col-1,row,kind)>depth||(y&31)<4&&unitDepth(col,row-1,kind)>depth;
      const end=(x&31)>29&&unitDepth(col+1,row,kind)<depth||(y&31)>29&&unitDepth(col,row+1,kind)<depth;
      const shade=unitTone(col,row,kind)+((panel*7%11)-5)*.006;
      const face=latch?skin.gasket:skin.face;
      const gain=latch?1:shade*(seat?.78:seam?.83:1)+(end?.12:rim?.035:0);
      const i=(y*256+x)*4;
      for(let ch=0;ch<3;ch++)color[i+ch]=Math.min(255,Math.round(face[ch]*gain));
      color[i+3]=255;
      response[i]=255;
      response[i+1]=Math.round(255*(seam?.92:latch?.40:skin.rough+(panel%3-1)*.033));
      response[i+2]=255;response[i+3]=255;
    }
    const mat=new T.MeshStandardMaterial({
      name:'City shell / '+skin.name, vertexColors:true, metalness:skin.metal, roughness:1,
      map:tile(color,true,anisotropy), roughnessMap:tile(response,false,anisotropy)
    });
    mat.userData.textureMeters=2.56;
    mat.userData.assemblyUV=true;
    mat.userData.assemblyKind=kind;
    materials[skin.key]=mat;
  }
}
