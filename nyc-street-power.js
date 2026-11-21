import * as T from 'three';

// Add service lights along actual pedestrian edges between occupied premises.
// The old lamp posts, shop lights and work bays are considered first.
export function connectStreetPower({routes,box,collider,colliders,ground,isPlayable,posts,sites,scene,materials,entrances=[]}){
  const sources=posts.slice();
  const occupied=[...sources,...sites];
  scene.traverse(o=>{
    if(o.isPointLight&&o.position.y<14&&o.distance>0)occupied.push(o.position);
  });
  const lens=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  lens.userData.keepDistant=true;lens.name='城市配电 / 陶瓷灯罩';
  lens.userData.signalLens=true;
  materials.feederLens=lens;
  const additions=[];
  const lanes=routes.filter(r=>['avenue','street','loop'].includes(r.kind)).flatMap(r=>
    r.shape.points.slice(1).map(([bx,bz],i)=>{
      const [ax,az]=r.shape.points[i],dx=bx-ax,dz=bz-az;
      return {road:r,ax,az,dx,dz,length2:dx*dx+dz*dz,clearance:r.width/2+.35};
    }).filter(s=>s.length2>0));
  function crossesRoad(x,z,y,road){
    return lanes.some(s=>{
      if(road===s.road||Math.abs(y-s.road.elevation)>1.5)return false;
      const rx=x-s.ax,rz=z-s.az,t=T.MathUtils.clamp((rx*s.dx+rz*s.dz)/s.length2,0,1);
      return (rx-t*s.dx)**2+(rz-t*s.dz)**2<s.clearance**2;
    });
  }
  for(const road of routes){
    if(!['avenue','street','loop','promenade','elevated-walk'].includes(road.kind))continue;
    const high=road.kind==='elevated-walk',walk=road.kind==='promenade'||high;
    const pts=road.shape.points;
    let carried=8,serial=0;
    for(let i=1;i<pts.length;i++){
      const [ax,az]=pts[i-1],[bx,bz]=pts[i],dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);
      if(len<1)continue;
      const nx=dz/len,nz=-dx/len;
      for(;carried<len-1;carried+=walk?17:22){
        const t=carried/len,centerX=ax+t*dx,centerZ=az+t*dz;
        serial++;
        for(const side of [serial%2?1:-1,serial%2?-1:1]){
          const narrowWalk=walk&&!high&&road.width<=4;
          const inset=narrowWalk?road.width/2+.55:walk?road.width/2-.37:road.width/2+.87;
          const x=centerX+nx*side*inset,z=centerZ+nz*side*inset;
          const y=ground(x,z,high?6.60:1.05);
          if(Math.abs(y-(high?6.51:.36))>.38||!isPlayable(x,z,.42))continue;
          if(crossesRoad(x,z,y,road)||entrances.some(([ex,ez])=>Math.hypot(x-ex,z-ez)<1.65))continue;
          const spacing=high?9:walk?12:15;
          if(occupied.some(o=>Math.abs(o.y-y)<(high?3.1:9)&&Math.hypot(o.x-x,o.z-z)<spacing))continue;
          if(colliders.some(b=>b.max.y>y+.09&&b.min.y<y+2.9&&x>b.min.x-.46&&x<b.max.x+.46&&z>b.min.z-.46&&z<b.max.z+.46))continue;
          const park=x>67&&z>-53&&z<97,industrial=x<-44&&!walk,core=z<-180;
          const low=walk||park,h=low?1.16:industrial?3.18:core?3.82:2.70;
          const colour=high?0xb8dbc5:park?0xa5d3c6:industrial||road.kind==='promenade'?0xffb872:core?0xb7e6fa:z>52?0xffc18b:0xe4b193;
          const yaw=Math.atan2(-nx*side,-nz*side);
          function B(mat,u,v,w,sx,sy,sz,c){
            const cs=Math.cos(yaw),sn=Math.sin(yaw);
            box(mat,x+cs*u+sn*w,y+v,z-sn*u+cs*w,sx,sy,sz,c,yaw);
          }
          B('metal',0,.16,0,.48,.32,.48,0x817f74);
          B('trim',0,low?.59:.66,0,.32,low?.68:1,.32,core?0x637984:0x606d69);
          B('rubber',0,.48,.173,.22,.38,.056,0x343f46);
          B('feederLens',-.055,.52,.211,.08,.06,.024,colour);
          if(low){
            B('metal',0,.94,0,.32,.16,.32,0x48565d);
            for(const side of [-1,1])B('metal',side*.18,h,0,.08,.32,.40,0x77918a);
            B('feederLens',0,h,0,.28,.20,.27,colour);
            B('trim',0,h+.18,0,.49,.13,.48,0x647b78);
          }else{
            B('metal',-.06,(h+1)/2,-.04,.16,h-1,.16,0x778b90);
            B('trim',0,h+.03,.31,.34,.18,.96,0x64777b);
            B('metal',0,h-.09,.61,industrial?.66:.48,.13,.50,0x847e70);
            B('feederLens',0,h-.17,.63,industrial?.48:.32,.06,.34,colour);
            if(industrial)B('feederLens',.20,1.22,.04,.055,.22,.14,0xff9e51);
          }
          // At intervals the feeder also carries the city's night-service
          // signal. Different cut-metal shapes identify working districts
          // from both directions. They fit on the existing footing.
          const serviceStop=!walk&&serial%3===1;
          if(serviceStop){
            const tip=low?2.35:h-.16;
            if(low)B('metal',0,(h+tip)/2,-.04,.16,tip-h,.24,0x889394);
            const ink=park?0x56e0c1:industrial?0xffae4b:core?0xabbbff:z>52?0xfe8e8c:0x64d9e3;
            const motif=park?['..X..','.XXX.','XXXXX','.X.X.','..X..']:
              industrial?['.XXX.','XX.XX','X...X','XX.XX','.XXX.']:
              core?['X...X','XX.XX','.XXX.','..X..','..X..']:
              ['..X..','.XXX.','XX.XX','.X.X.','.XXX.'];
            B('metal',0,tip-.56,0,.88,1.24,.40,0x657b80);
            B('trim',0,tip+.08,0,1.04,.16,.56,0xa6aba7);
            for(const side of [-1,1]){
              B('rubber',0,tip-.57,side*.232,.76,.97,.08,0x506779);
              for(let row=0;row<motif.length;row++){
                for(let col=0;col<motif[row].length;){
                  if(motif[row][col]!== 'X'){col++;continue;}
                  const start=col;while(motif[row][col]==='X')col++;
                  B('feederLens',((start+col-1)/2-2)*.128,tip-.30-row*.128,side*.30,
                    (col-start)*.128,.128,.16,ink);
                }
              }
              B('feederLens',0,tip-1.01,side*.26,.52,.08,.08,ink);
            }
            collider(x,y+tip-.56,z,.88,1.24,.88);
            sources.push({x,y:y+tip-.48,z,reach:7,gain:.62,glow:ink,road:road.id});
          }
          collider(x,y+(low?h:1.18)/2,z,.48,low?h:1.18,.48);
          const source={x:x-nx*side*(low?0:.63),y:y+h-(low?0:.17),z:z-nz*side*(low?0:.63),
            glow:colour,reach:low?8:14,gain:low?.56:.87,road:road.id};
          sources.push(source);occupied.push(source);additions.push(source);break;
        }
      }
      carried-=len;
      if(carried<0)carried=0;
    }
  }
  return {sources,additions};
}
