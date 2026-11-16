import * as T from 'three';

// One atlas for the three actual sleeves in the display window.
export function addSleeveDisplay(scene,front) {
  const art=document.createElement('canvas');
  art.width=768;art.height=256;
  const g=art.getContext('2d');
  const covers=[
    {title:'ORBIT', artist:'LIMINAL TRIO', paper:'#efb466',ink:'#362b43'},
    {title:'TIDE', artist:'SOUTH FERRY',paper:'#174f69',ink:'#a3e3c7'},
    {title:'33',artist:'AFTER HOURS',paper:'#bb5746',ink:'#ffe1ae'}
  ];
  const vertices=[],uv=[];
  covers.forEach(({title,artist,paper,ink},index)=>{
    const offset=256*index;
    g.fillStyle=paper;g.fillRect(offset,0,256,256);
    g.fillStyle=ink;
    // Rasterise the motifs on a four-pixel print grid. Deterministic ink
    // dropout and the limited palette keep the sleeves legible behind glass.
    for(let y=44;y<200;y+=4)for(let x=14;x<242;x+=4){
      const r=Math.hypot(x-136,(y-113)*1.23);
      const wave=y+14*Math.sin(x*.037+y*.015);
      const print=index===0?(r<73&&r%18<9)||(Math.abs(y-170+x*.49)<4):
        index===1?(wave%26<8 && y>62+x*.13):
        ((x+y*.60)%48<18 && r<99);
      if(print&&(x*3+y*7)%53!==0)g.fillRect(offset+x,y,4,4);
    }
    g.font='bold 21px sans-serif';g.fillText(artist,offset+13,30);
    g.font='bold 52px Georgia';g.fillText(title,offset+11,244);
    const centre=-4.25+1.05*index,half=.294;
    for(const [x,y] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){
      vertices.push(...front.P(centre+(x*2-1)*half,1.87+(y*2-1)*half,-.54));
      uv.push((index+.002+x*.996)/3,.002+y*.996);
    }
  });
  const texture=new T.CanvasTexture(art);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const sleeves=new T.Mesh(geometry,new T.MeshStandardMaterial({map:texture,roughness:.82,emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.13}));
  sleeves.name='SIDE B / three printed record sleeves';sleeves.receiveShadow=true;scene.add(sleeves);
}
