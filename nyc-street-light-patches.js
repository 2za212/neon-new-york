import * as T from 'three';
import {mapPlan} from './nyc-map-plan.js';

// Small quads follow individual depressions. A single mobile draw samples no
// render targets; the reflected lamp position shifts as the camera passes it.
export function streetLightPatches(scene,world){
  const positions=[],uv=[],sources=[],colours=[],indices=[];
  const wetSpots=[];
  const sourcesByUse={
    subway:[-8.60,1.12,14.27,0x47c9d0],
    records:[-9.93,3.115,34.78,0xffb365],
    tailor:[-10.65,3.30,58.8,0xe4b689],
    kiosk:[-4.71,2.77,64.50,0xffbd79],
    arrival:[4.90,2.98,91.94,0x64d4d9],
    parkWest:[88,1.17,64.7,0xe7bf87],
    parkEast:[119.2,1.17,27.1,0xe7bf87],
    berth:[-150,7.1,9.6,0xfbd399],
    lobby:[-8,5,-143,0xbadff1],
    pierSouth:[-143.2,1.05,4.3,0x65c8cd],
    pierNorth:[-139.2,1.05,-4.3,0x65c8cd],
    grocer:[10.65,3.20,70.3,0xdab180],
    bookWindow:[-10.72,2.22,100.45,0xffce8d],
    bookDoor:[-10.72,2.34,95.92,0xefaa71],
    hallWest:[-15,5.85,-150.11,0xa5d0de],
    hallEast:[-1,5.85,-150.11,0xbcdce4]
  };
  function patch(use,x,y,z,w,d,rotation=0){
    const [sx,sy,sz,hue]=Array.isArray(use)?use:sourcesByUse[use],c=new T.Color(hue),first=positions.length/3;
    const co=Math.cos(rotation),sn=Math.sin(rotation);
    wetSpots.push([x,z]);
    for(const [u,v] of [[-1,1],[1,1],[1,-1],[-1,-1]]){
      positions.push(x+co*u*w/2+sn*v*d/2,y,z-sn*u*w/2+co*v*d/2);uv.push(u,v);
      sources.push(sx,sy,sz);colours.push(c.r,c.g,c.b);
    }
    indices.push(first,first+1,first+2,first,first+2,first+3);
  }
  patch('subway',-5.94,.199,15.3,.87,4.6);
  patch('subway',-6.98,.383,16.1,.44,2.7);
  patch('subway',-5.50,.199,18.9,.52,1.55);
  patch('records',-8.12,.383,32.9,1.04,3.8);
  patch('records',-7.12,.383,35.2,.53,2.1);
  patch('records',-6.02,.199,34.1,.89,4.75);
  patch('records',-5.61,.199,31.3,.68,1.90);
  patch('tailor',-5.98,.199,59.4,.84,3.3);
  patch('grocer',5.96,.199,71.8,.79,3.65);
  patch('kiosk',-3.42,.199,65.20,.53,2.85);
  patch('kiosk',-3.75,.199,67.50,.39,1.82);
  patch('arrival',3.72,.199,89.7,.65,2.64);
  patch('parkWest',88.7,.379,67,.58,1.8);
  patch('parkEast',120.7,.379,28.8,.76,1.5);
  patch('pierSouth',-143.1,.377,3.1,.65,1.84);
  patch('pierNorth',-139.1,.377,-3.25,.45,1.6);
  patch('berth',-148,.321,12.8,2.8,2.4);
  patch('lobby',-10.8,.392,-140,2.0,4.3);
  patch('lobby',-5.4,.392,-138,1.3,4.1);
  // Separate window bays catch in the curb runnel and the irregular patches
  // across its fall line. Dry asphalt between them keeps the crossing legible.
  patch('bookWindow',-6.02,.199,100.62,.49,4.16);
  patch('bookWindow',-4.46,.199,100.18,2.36,1.35);
  patch('bookDoor',-6.08,.199,95.92,.45,2.66);
  patch('bookDoor',-7.24,.382,96.08,.73,1.68);
  patch('hallWest',-14.26,.387,-137.55,.85,4.90);
  patch('hallEast',-1.82,.387,-139.12,1.25,4.64);
  // Collect runoff inside the vehicle lane below the actual lightbox,
  // following the gutter. Reject the rear of a wall and any shop whose
  // projection lands on an island, steps or a different street level.
  const lanes=mapPlan.roads.filter(r=>['street','avenue','loop'].includes(r.kind))
    .flatMap(road=>road.shape.points.slice(1).map(([x,z],i)=>{
      const [ax,az]=road.shape.points[i],dx=x-ax,dz=z-az,length=Math.hypot(dx,dz);
      return {ax,az,tx:dx/length,tz:dz/length,length,road};
    })).filter(l=>l.length>=5);
  const origin=new T.Vector3(),target=new T.Vector3(),hit=new T.Vector3(),ray=new T.Ray();
  for(const site of world.streetAds.sites){
    if(site.kind==='poster'||site.y>13)continue;
    let best=null,dist=Infinity;
    for(const {ax,az,tx,tz,length,road} of lanes){
      const along=(site.x-ax)*tx+(site.z-az)*tz;
      if(along<2||along>length-2)continue;
      const mx=ax+along*tx,mz=az+along*tz,offset=(site.x-mx)*tz-(site.z-mz)*tx;
      const side=Math.sign(offset),edge=road.width/2;
      if(Math.abs(offset)<edge-.8)continue;
      const x=mx+tz*side*(edge-1.15),z=mz-tx*side*(edge-1.15);
      const dx=x-site.x,dz=z-site.z,gap=Math.hypot(dx,dz);
      if(gap>=dist||gap>12.5||gap<1)continue;
      const faces=(Math.sin(site.yaw)*dx+Math.cos(site.yaw)*dz)/gap;
      if(site.kind!=='blade'&&site.kind!=='kiosk'&&faces<.24)continue;
      const floor=world.ground(x,z,road.elevation+.10);
      if(Math.abs(floor-road.elevation)>.05||!world.isPlayable(x,z,.50))continue;
      origin.set(site.x+dx/gap*.45,site.y,site.z+dz/gap*.45);
      target.set(x,floor+.12,z);
      ray.set(origin,hit.subVectors(target,origin).normalize());
      const max=origin.distanceTo(target);
      if(world.solidsNear((site.x+x)/2,(site.z+z)/2).some(b=>{
        if(b.max.y<floor+.30||b.containsPoint(origin))return false;
        return ray.intersectBox(b,hit)&&origin.distanceTo(hit)<max-.5;
      }))continue;
      best={x,z,y:floor,angle:Math.atan2(tx,tz),reach:Math.min(6,Math.max(3,Math.sqrt(site.width*site.height)*2.1))};dist=gap;
    }
    if(!best||wetSpots.some(([x,z])=>Math.hypot(best.x-x,best.z-z)<2.8))continue;
    patch([site.x,site.y,site.z,site.glow],best.x,best.y+.026,best.z,1.28,best.reach,best.angle);
  }
  const geo=new T.BufferGeometry();
  for(const [key,data,n] of [['position',positions,3],['uv',uv,2],['source',sources,3],['color',colours,3]])
    geo.setAttribute(key,new T.Float32BufferAttribute(data,n));
  geo.setIndex(indices);
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{gain:{value:.78}},
    vertexShader:`attribute vec3 source,color;
      varying vec3 pos,lightPos,ink; varying vec2 localUV;
      void main(){pos=position;lightPos=source;ink=color;localUV=uv;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 pos,lightPos,ink;varying vec2 localUV;uniform float gain;
      float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main(){float ripple=noise(pos.xz*vec2(8.,13.));
        float edge=dot(localUV,localUV)+.45*(noise(pos.xz*3.8)-.5);
        float threads=noise(pos.xz*vec2(17.,2.4));
        float coverage=(1.-smoothstep(.49,1.,edge))*smoothstep(.25,.61,ripple)*(.32+.68*threads);
        vec3 eye=normalize(cameraPosition-pos),lamp=normalize(lightPos-pos);
        float shine=pow(max(dot(reflect(-eye,vec3(0,1,0)),lamp),0.),7.);
        float facing=1.-abs(eye.y);
        gl_FragColor=vec4(ink*(.55+shine*1.5),coverage*gain*(.26+.36*shine+.17*facing));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const mesh=new T.Mesh(geo,mat);mesh.name='NYC / mobile broken lamp reflections';
  mesh.renderOrder=4;mesh.userData.excludeFromAO=true;scene.add(mesh);
  return mesh;
}
