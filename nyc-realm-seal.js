import * as T from 'three';

// Author in one cubic grid. Hidden adjacent faces are omitted so each moving
// part needs only one draw while retaining the stepped edges and solid sides.
function voxelPart(cells,name){
  const positions=[],colors=[],indices=[];
  const normals=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const quads=[
    [[1,0,1],[1,0,0],[1,1,0],[1,1,1]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],
    [[0,1,1],[1,1,1],[1,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],
    [[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]
  ];
  const shades=[.73,.56,1.12,.48,.92,.64],color=new T.Color();
  for(const [key,tint] of cells){
    const [x,y,z]=key.split(',').map(Number);
    for(let face=0;face<6;face++){
      const [dx,dy,dz]=normals[face];
      if(cells.has([x+dx,y+dy,z+dz].join(',')))continue;
      const start=positions.length/3;color.setHex(tint).multiplyScalar(shades[face]);
      for(const [i,j,k] of quads[face]){
        positions.push(x+i-.5,y+j-.5,z+k-.5);colors.push(color.r,color.g,color.b);
      }
      indices.push(start,start+1,start+2,start,start+2,start+3);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setIndex(indices);geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const mat=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,fog:false});
  const mesh=new T.Mesh(geometry,mat);mesh.name=name;return mesh;
}
function ring(radius,gold){
  const cells=new Map();
  for(let x=-radius;x<=radius;x++)for(let z=-radius;z<=radius;z++){
    const dist=Math.hypot(x,z), axis=Math.min(Math.abs(x),Math.abs(z));
    if(dist<radius-1.55||dist>radius||Math.abs(Math.abs(x)-Math.abs(z))<1.1)continue;
    cells.set([x,0,z].join(','),axis<3?0xdceaff:gold?0x9688ce:0x70c9e2);
    if(axis<2)cells.set([x,1,z].join(','),0xdfdafa);
  }
  return voxelPart(cells,'界印 / 分象环');
}
function sealGlyph(){
  const cells=new Map();
  for(let y=-8;y<=8;y++)for(let x=-6;x<=6;x++){
    const r=Math.abs(x)+Math.abs(y);
    if(r<5||r>8)continue;
    for(let z=-1;z<=1;z++)cells.set([x,y,z].join(','),y<0?0x68bad8:0xb6a9f1);
  }
  for(let y=-2;y<=2;y++)cells.set([0,y,2].join(','),0xe3f0ff);
  return voxelPart(cells,'界印 / 中心符');
}
function crystal(){
  const cells=new Map();
  function splinter(cx,cy,cz,rows,palette){
    rows.forEach(([extent,shift],y)=>{
      for(let x=-extent;x<=extent;x++)for(let z=-extent;z<=extent;z++){
        if(Math.abs(x)+Math.abs(z)>extent+1)continue;
        const seam=y>2&&y<rows.length-2&&y+z===Math.floor(rows.length*.50);
        const color=seam?0x8ce6da:palette[(x>0?1:0)+(y===rows.length-1?1:0)];
        cells.set([cx+x+shift,cy+y,cz+z].join(','),color);
      }
    });
  }
  splinter(0,-11,0,[[0,0],[1,0],[1,0],[2,0],[2,0],[3,0],[3,0],[4,0],[4,0],[4,0],[4,1],[4,1],[4,1],[4,1],[4,1],[3,1],[3,2],[3,2],[2,2],[2,2],[1,3],[1,3],[0,3]],[0xf1c575,0xd89350,0xffe8a0]);
  splinter(-5,-6,0,[[0,0],[1,0],[2,0],[2,0],[2,-1],[2,-1],[1,-1],[1,-2],[0,-2]],[0xc4824e,0xc9955c,0xffcf89]);
  splinter(5,-4,2,[[0,0],[1,0],[1,0],[2,0],[2,1],[2,1],[1,1],[1,2],[0,2]],[0xe4b974,0xa57e52,0xf9dba5]);
  const gem=voxelPart(cells,'可悬浮奖励 / 界隙晶片');
  // Each face owns its four vertices. A passing highlight stays on that
  // face as the relic turns, leaving the voxel edges sharp on low quality.
  gem.geometry.computeVertexNormals();
  gem.material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vFacet;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vFacet=normalize(normalMatrix*normal);');
    shader.fragmentShader='varying vec3 vFacet;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',` 
      vec3 facet=normalize(vFacet);
      float glint=pow(max(0.0,dot(facet,normalize(vec3(-0.36,0.42,0.83)))),12.0);
      float edge=pow(1.0-clamp(facet.z,0.0,1.0),3.0);
      outgoingLight+=vec3(0.68,0.46,0.17)*glint+vec3(0.16,0.10,0.036)*edge;
      #include <opaque_fragment>`);
  };
  return gem;
}
export function createRealmSeal(){
  const root=new T.Group(),orbit=new T.Group(),stone=crystal(),mark=sealGlyph();
  const outer=ring(15,false),inner=ring(11,true);
  root.add(orbit,mark,stone);orbit.add(outer,inner);
  inner.rotation.x=1.05;inner.rotation.z=.28;
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
  const g=glowCanvas.getContext('2d'),falloff=g.createRadialGradient(32,32,0,32,32,32);
  falloff.addColorStop(0,'rgba(255,255,255,.8)');falloff.addColorStop(.38,'rgba(255,255,255,.32)');falloff.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=falloff;g.fillRect(0,0,64,64);
  const glow=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(glowCanvas),color:0x8ce4d6,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));
  root.add(glow);
  return {root,update(time,ignition,claimed,rise,reduced,inspecting){
    const shimmer=reduced?0:Math.sin(time*1.8),rotation=reduced ? .35 : time*.44;
    orbit.position.y=claimed?-12*rise:0;orbit.rotation.set(.35,rotation*.6,-.08);
    outer.rotation.y=rotation;inner.rotation.y=-rotation;
    orbit.scale.setScalar(.60+.40*ignition);
    mark.visible=!claimed;mark.rotation.set(.08,.36+rotation*.6,.10);
    mark.position.y=shimmer*.45;mark.scale.setScalar(.68+.32*ignition);
    mark.material.color.setScalar(.06+.94*ignition);
    outer.material.color.setScalar(.10+.90*ignition);
    inner.material.color.setScalar(.08+.92*ignition);
    stone.visible=claimed;stone.scale.setScalar(.24+(inspecting?1.08:.83)*rise);
    stone.position.set(0,-8+rise*(inspecting?18:16)+shimmer*.72,2+rise*2);
    stone.rotation.set(.06,.48+rotation*1.27,-.13);
    glow.position.set(0,claimed?stone.position.y:0,-2);
    glow.scale.setScalar(claimed?34:36);
    glow.material.color.setHex(claimed?0xefbd70:0x7ce4dc);
    glow.material.opacity=(.28+.37*(1-ignition)+.14*(claimed?1-rise:0))*ignition;
    root.visible=ignition>.002;
  }};
}
