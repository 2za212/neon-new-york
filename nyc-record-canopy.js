import * as T from 'three';

// Build in shop coordinates so the fabric, hardware and drain share the same datum.
export function addRecordShopCanopy(scene, f) {
  const left = -5.03, right = 1.14, lip = 1.61;
  const positions = [], colors = [], uvs = [];
  const tint = new T.Color();
  function quad(a, b, c, d, color) {
    tint.set(color);
    for (const point of [a,b,c,a,c,d]) {
      positions.push(...f.P(...point));
      colors.push(tint.r,tint.g,tint.b);
      uvs.push(point[0],point[2] + point[1]);
    }
  }

  // Cut each stripe from the same bowed section. Stepped hems keep the
  // scallops readable at street distance and give the underside a silhouette.
  const section = [[.17,3.56],[.50,3.52],[.92,3.43],[1.29,3.30],[lip,3.17]];
  const panels = 16, pitch = (right-left)/panels;
  for (let i=0; i<panels; i++) {
    const start = left+i*pitch, end = start+pitch;
    const cloth = i%2 ? 0xb26343 : 0xe6caa0;
    for (let j=1; j<section.length; j++) {
      const [v0,y0] = section[j-1], [v1,y1] = section[j];
      quad([start,y0,v0],[start,y1,v1],[end,y1,v1],[end,y0,v0],cloth);
    }
    for (let j=0; j<6; j++) {
      const a=start+j*pitch/6, b=a+pitch/6;
      const hem=3.06-.035*Math.min(j,5-j);
      quad([a,3.17,lip],[a,hem,lip],[b,hem,lip],[b,3.17,lip],cloth);
      quad([a,hem+.022,lip+.001],[a,hem,lip+.001],[b,hem,lip+.001],[b,hem+.022,lip+.001],0x633932);
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  geo.computeVertexNormals();
  const canvas = new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.92});
  const canopy = new T.Mesh(geo,canvas);
  canopy.name='SIDE B / striped canvas and bound hem';
  canopy.castShadow=canopy.receiveShadow=true;
  scene.add(canopy);

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
  // Shelter applies only below the pitched cloth; keep the headroom walkable.
  const bounds=new T.Box3();
  for(const u of [left,right]) for(const v of [.17,lip]) bounds.expandByPoint(new T.Vector3(...f.P(u,3.17,v)));
  bounds.max.y=3.56;
  return {bounds,triangles:positions.length/9};
}
