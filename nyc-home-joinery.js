import * as T from 'three';
import {cabinetSkin} from './nyc-voxel-counter.js';

// The Blender apartment is measured in metres, Y up. All four structures use
// this same cubic lattice. Only exposed runs are added to the static mesh.
export function fitRoomJoinery(room){
  const step=.16,pos=[],color=[],indices=[];
  const iron=1,steel=2,teal=3,clay=4,ochre=5,edge=6;
  const swatches=[0,0x34414a,0x536970,0x476d6b,0x89553f,0x99755b,0xa49781];
  const colors=swatches.map(c=>new T.Color(c)),palette=colors.map((_,i)=>[i,i]);
  function part(origin,size,ambient,paint){
    const local=(x,y,z)=>[origin[0]+x*step,origin[1]+y*step,origin[2]+z*step];
    cabinetSkin(size,paint,(id,q)=>{
      const first=pos.length/3;
      const va=new T.Vector3().fromArray(q[1]).sub(new T.Vector3().fromArray(q[0]));
      const vb=new T.Vector3().fromArray(q[3]).sub(new T.Vector3().fromArray(q[0]));
      const n=va.cross(vb).normalize(),tint=colors[id];
      const base=ambient*(.32+.13*n.y+.04*n.z);
      for(const p of q){
        // Bake the existing amber island pendant and blue window return into
        // the joinery, on the same sides as the apartment's Blender light.
        const light=(x,y,z,radius)=>{
          const dx=x-p[0],dy=y-p[1],dz=z-p[2],d2=dx*dx+dy*dy+dz*dz;
          const angle=(dx*n.x+dy*n.y+dz*n.z)/Math.sqrt(Math.max(.001,d2));
          return (.20+.80*Math.max(0,angle))/(1+d2/radius);
        };
        const lamp=light(.94,2.22,1.29,2.88),win=light(-2.4,2.55,-4.01,4),guide=light(4.13,3.65,1.95,2.56);
        pos.push(...p);color.push(tint.r*(base+lamp*.99+win*.07+guide*.08),
          tint.g*(base+lamp*.34+win*.35+guide*.23),tint.b*(base+lamp*.08+win*.93+guide*.35));
      }
      indices.push(first,first+1,first+2,first,first+2,first+3);
    },local,palette);
  }
  // Fired headers pass through three masonry piers into a continuous upper
  // lintel. Each alternate course ends one cell earlier round the reveal.
  // Below the lintel the three original glass openings stay unobstructed.
  part([-4.58,.94,-4.11],[35,20,3],.73,fill=>{
    for(const c of [0,11,22,33])for(let j=0;j<20;j++){
      const d=j%4<2?3:2;
      fill((j+c)%4===0?ochre:clay,c,j,0,c+2,j+1,d);
      if(j<2||j>=14){
        const w=j<2?1:Math.floor((j-12)/2);
        fill(j===15||j===0?edge:clay,Math.max(0,c-w),j,0,Math.min(35,c+2+w),j+1,d);
      }
    }
    for(let x=0;x<35;x+=2){
      fill(x%6?clay:ochre,x,18,0,Math.min(35,x+2),20,x%6?2:3);
      fill(x%6?ochre:edge,x,19,1,Math.min(35,x+2),20,3);
    }
  });
  // Cast return and radiator manifold below the window seat. The sectional
  // iron fins end at different heights, leaving open slots into the backing.
  part([-3.88,.03,-3.53],[21,6,3],.72,fill=>{
    fill(iron,0,2,0,21,3,2);fill(iron,0,4,0,21,5,2);
    for(let x=0;x<21;x+=2){
      const high=x%6?5:6;
      fill(x%6?steel:teal,x,1,0,x+1,high,2);
      fill(x%6?teal:steel,x,2,1,x+1,high-1,3);
    }
    for(const x of [1,18])fill(iron,x,0,0,x+2,2,2);
    fill(ochre,0,5,0,21,6,1);
  });
  // Each cleat on the near stair stringer keys into the next tread with a
  // two-cell return. The underneath stays open up to the mezzanine splice.
  part([2.96,.00,-1.15],[3,16,23],.68,fill=>{
    for(let z=0;z<23;z++){
      const top=Math.max(1,Math.min(16,Math.round((22-z)*.71)+1));
      const bottom=Math.max(0,top-(z%4===0?3:2));
      fill(iron,0,bottom,z,z%3?1:2,top,z+1);
      fill(z%3?steel:ochre,0,top-1,z,3,top,z+1);
      if(z%4<2)fill(teal,0,bottom,z,1,Math.min(top,bottom+2),z+1);
    }
  });
  // The seated ends on the two steel columns carry the front plate of the
  // mezzanine. The haunches step out from the piers in whole 16 cm units.
  part([1.30,.00,-1.46],[22,16,3],.64,fill=>{
    for(let y=0;y<16;y++)for(const side of [0,1]){
      const reach=y<2?2:y<10?1:Math.min(5,1+Math.floor((y-9)/2));
      const x=side?22-reach:0;
      fill(y<10?iron:y%3?steel:teal,x,y,0,x+reach,y+1,y<10?1+y%3%2:3);
    }
    for(let x=0;x<22;x+=2){
      fill(x%6?teal:steel,x,14,0,x+2,16,x%6?2:3);
      fill(x%6?steel:ochre,x,15,0,x+2,16,3);
    }
  });
  // The worktop sits on two transverse saddles and an open, toothed front
  // lintel. The face of the radio drawer and the bench lamp stay accessible.
  part([-.24,.06,.65],[13,6,7],.82,fill=>{
    for(let x=0;x<13;x++)for(const z of [0,5]){
      const knee=Math.min(x,12-x);
      const base=knee===0?1:knee===1?3:knee===2?4:5;
      fill(knee<2?teal:iron,x,base,z,x+1,6,z+1);
      if(knee===0)fill(steel,x,0,z,x+1,1,z+1);
    }
    for(const x of [0,12])for(let z=0;z<7;z++)
      fill(z%3?steel:ochre,x,5,z,x+1,6,z+1);
    for(let x=0;x<13;x+=3)fill(ochre,x,5,5,Math.min(13,x+2),6,7);
  });
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new T.Float32BufferAttribute(color,3));
  g.setIndex(indices);g.computeBoundingSphere();
  const mesh=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,toneMapped:false}));
  mesh.name='3B / fired reveals, cast radiator and steel frame';room.add(mesh);
}
