import * as T from 'three';

// A bay is sixteen cells wide. The local +Z axis points out of the building.
// Each recipe describes solid strata, including the opening left for the real sash.
const width=16,height=20,depth=5,cell=.16;
const clay=['#a45c45','#864c40','#b46d50','#985840'];
const cream=['#ccb18c','#d6bb95','#bda987','#d5bf9f'];
const teal=['#447978','#38656b','#508482','#416e73'];
const iron=['#405761','#536973','#354b55','#637776'];
const wood=['#977451','#ae8559','#8d6749','#b9946a'];
const palettes=[clay,cream,teal,iron,wood,
  ['#e3b574','#edc38b','#cca472','#e5b675'],['#6bb9bc','#8ac6c3','#72aeb5','#87babe']];
const geometryCache=new Map(),registries=new WeakMap();
function section(style,x,y){
  const dx=Math.min(x,15-x);
  if(style==='lantern'||style==='dial'){
    const shell=style==='dial'?3:2;
    if((y<2||y>=18)&&dx<2)return null;
    if(y<3||y>=17)return [y===2||y===17?4:shell,dx<3?3:5];
    if(dx<2||x===7||x===8)return [shell,dx===0?3:5];
    if(y===6||y===13)return [3,4];
    if(y<6)return [(x+y)%4===0?4:shell,3];
    if(style==='dial'&&y>=9&&y<=11&&x%3===0)return [3,4];
    return [style==='dial'?6:5,dx===2?2:3];
  }
  if(style==='windowHead'){
    if(y>16)return [y===18?4:0,y===17?4:3];
    if(dx>=2+Math.max(0,y-12))return null;
    return [dx===0?0:y%5===0?1:4,dx===0?2:3];
  }
  if(style==='awning'){
    if(y<11+Math.min(dx,4))return null;
    if(y===19)return [1,3];
    if(y===17)return [3,4];
    return [y<=13?4:2,y<15?2:5];
  }
  if(style==='park'){
    // Twin timber knees carry a copper fascia, with a clear span below.
    if(y>=17)return [y===18?2:4,y===18?4:3];
    if(dx<2||dx<2+Math.max(0,y-10))return [y%5===0?3:4,dx<2?3:2];
    return null;
  }
  if(style==='receiver'){
    if(dx<2||y<2||y>17)return [y===18?4:2,3];
    if(y>10)return [y%3===0?3:2,y%3===0?3:1];
    if(y===5||y===6)return [x<8?1:4,3];
    return [3,(x%3===0&&y<5)?3:1];
  }
  if(style==='exchange'){
    if(dx<2)return [dx===0?3:1,y<3||y>15?4:3];
    if(y>=16)return [y===16||y===19?3:1,y===18?4:3];
    if(y<2)return [1,3];
    if(y===15&&dx<4)return [3,3];
    return null;
  }
  const dock=style==='dock', foundry=style==='foundry';
  const openingHalf=y>=16?2:y===15?3:4;
  const inside=dx>=8-openingHalf;
  if(y>=4&&y<=16&&inside)return null;
  if(y===3||y===2)return [foundry?2:1,y===3?5:3];
  if(y===17&&dx>=4)return [dock?3:1,dx>=7?5:4];
  if(y>=15&&y<=16&&dx>=3)return [foundry?3:dock?0:1,4];
  if(dx<2&&foundry)return [2,y===4||y>=14?4:3];
  if(dx===0&&dock)return [3,3];
  const header=(Math.floor((x+(y%2)*2)/3)+y*3)%7===0;
  return [0,header?3:2];
}
function makeGeometry(style,coarse){
  const key=style+'/'+coarse;
  if(geometryCache.has(key))return geometryCache.get(key);
  const dims=[width,height,depth],cells=new Uint8Array(width*height*depth);
  const at=(x,y,z)=>x+width*(y+height*z);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const block=section(style,x,y);if(!block)continue;
    const [finish,layers]=block;
    const run=Math.floor((x+(y%2)*2)/(finish===0?3:4));
    const shade=coarse?0:Math.abs((run*17+y*11)^(run+y))%4;
    const n=coarse&&finish===0&&layers===3?2:layers;
    for(let z=0;z<n;z++)cells[at(x,y,z)]=finish*4+shade+1;
  }
  const pos=[],normal=[],color=[],uv=[],index=[];
  const get=p=>p.every((v,j)=>v>=0&&v<dims[j])?cells[at(...p)]:0;
  const tint=new T.Color();
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
    const u=(axis+1)%3,v=(axis+2)%3,nu=dims[u],nv=dims[v];
    for(let level=0;level<dims[axis];level++){
      const mask=new Uint8Array(nu*nv),p=[0,0,0];p[axis]=level;
      for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
        p[u]=i;p[v]=j;const id=get(p);p[axis]+=sign;
        if(id&&!get(p))mask[j*nu+i]=id;p[axis]-=sign;
      }
      for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
        const id=mask[j*nu+i];if(!id)continue;
        let w=1,h=1;while(i+w<nu&&mask[j*nu+i+w]===id)w++;
        rows:while(j+h<nv){for(let k=0;k<w;k++)if(mask[(j+h)*nu+i+k]!==id)break rows;h++;}
        for(let yy=j;yy<j+h;yy++)mask.fill(0,yy*nu+i,yy*nu+i+w);
        const base=pos.length/3,finish=(id-1)>>2;
        tint.set(palettes[finish][(id-1)%4]);
        const shade=axis===1?(sign>0?1:.68):axis===2&&sign>0?1:.82;
        const norm=[0,0,0];norm[axis]=sign;
        for(const [a,b] of [[0,0],[1,0],[1,1],[0,1]]){
          const c=[0,0,0];c[axis]=level+(sign>0?1:0);c[u]=i+a*w;c[v]=j+b*h;
          pos.push((c[0]-8)*cell,(c[1]-10)*cell,c[2]*cell);
          normal.push(...norm);color.push(tint.r*shade,tint.g*shade,tint.b*shade);
          // Each atlas slot has a four-pixel wrap gutter; long runs use up to one tile.
          uv.push(((finish%4)*136+4+(a*Math.min(w/4,1))*128)/544,
            1-(Math.floor(finish/4)*136+4+(1-b*Math.min(h/4,1))*128)/272);
        }
        for(const k of (sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]))index.push(base+k);
      }
    }
  }
  const g=new T.BufferGeometry();
  for(const [name,data,size] of [['position',pos,3],['normal',normal,3],['color',color,3],['uv',uv,2]])
    g.setAttribute(name,new T.Float32BufferAttribute(data,size));
  g.setIndex(index);g.computeBoundingBox();g.computeBoundingSphere();geometryCache.set(key,g);return g;
}
function material(indoor){
  const opts={vertexColors:true};
  if(typeof Image!=='undefined'){
    const loader=new T.TextureLoader();
    opts.map=loader.load('./city-surfaces/fulton/finish-color.png');opts.map.colorSpace=T.SRGBColorSpace;
    if(!indoor){
      opts.normalMap=loader.load('./city-surfaces/fulton/finish-normal.png');
      opts.normalScale=new T.Vector2(.46,.46);
      opts.emissive=new T.Color(0xffffff);
      opts.emissiveMap=loader.load('./city-surfaces/fulton/finish-emission.png');
      opts.emissiveMap.colorSpace=T.SRGBColorSpace;
      opts.roughnessMap=opts.metalnessMap=loader.load('./city-surfaces/fulton/finish-orm.png');
    }
  }
  return indoor?new T.MeshBasicMaterial({...opts,toneMapped:false}):
    new T.MeshStandardMaterial({...opts,roughness:.93,metalness:.36});
}
export function voxelBay(scene,style,position,rotation,w,h,projection=1){
  if(!registries.has(scene))registries.set(scene,new Map());
  const tiles=registries.get(scene),key=[style,Math.floor(position[0]/20),Math.floor(position[2]/20)].join('/');
  if(!tiles.has(key))tiles.set(key,{style,matrices:[]});
  const m=new T.Matrix4().makeRotationY(rotation);
  m.scale(new T.Vector3(w/(width*cell),h/(height*cell),projection));m.setPosition(...position);
  tiles.get(key).matrices.push(m);
}
export function finishVoxelBays(scene,indoor=false){
  const tiles=registries.get(scene)||new Map(),surface=material(indoor),batches=[];
  for(const {style,matrices} of tiles.values()){
    const near=makeGeometry(style,false),far=makeGeometry(style,true);
    const mesh=new T.InstancedMesh(indoor?near:far,surface,matrices.length);
    matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));
    mesh.computeBoundingBox();mesh.computeBoundingSphere();
    mesh.name='Fulton voxel / '+style;mesh.receiveShadow=true;mesh.castShadow=!indoor;
    scene.add(mesh);batches.push({mesh,near,far});
  }
  registries.delete(scene);
  return {instances:batches.reduce((sum,b)=>sum+b.mesh.count,0),update(position,low){
    if(!position||indoor)return;
    for(const {mesh,near,far} of batches){
      const dist=mesh.boundingBox.distanceToPoint(position);
      mesh.visible=dist<(low?70:115);
      mesh.geometry=dist<(low?14:24)+(mesh.geometry===near?2:0)?near:far;
    }
  }};
}

