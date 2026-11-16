import * as T from 'three';

// Small quads follow individual depressions. A single mobile draw samples no
// render targets; the reflected lamp position shifts as the camera passes it.
export function streetLightPatches(scene){
  const positions=[],uv=[],sources=[],colours=[],indices=[];
  const sourcesByUse={
    subway:[-8.60,1.12,14.27,0x47c9d0],
    records:[-9.93,3.115,34.78,0xffb365],
    tailor:[-10.65,3.30,58.8,0xe4b689],
    kiosk:[-4.71,2.77,75.6,0xffbd79],
    arrival:[4.90,2.98,91.94,0x64d4d9],
    parkWest:[88,1.17,64.7,0xe7bf87],
    parkEast:[119.2,1.17,27.1,0xe7bf87],
    berth:[-150,7.1,9.6,0xfbd399],
    lobby:[-8,5,-143,0xbadff1],
    pierSouth:[-143.2,1.05,4.3,0x65c8cd],
    pierNorth:[-139.2,1.05,-4.3,0x65c8cd],
    grocer:[10.65,3.20,70.3,0xdab180]
  };
  function patch(use,x,y,z,w,d){
    const [sx,sy,sz,hue]=sourcesByUse[use],c=new T.Color(hue),first=positions.length/3;
    for(const [u,v] of [[-1,1],[1,1],[1,-1],[-1,-1]]){
      positions.push(x+u*w/2,y,z+v*d/2);uv.push(u,v);
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
  patch('kiosk',-3.42,.199,76.3,.53,2.85);
  patch('kiosk',-3.75,.199,78.6,.39,1.82);
  patch('arrival',3.72,.199,89.7,.65,2.64);
  patch('parkWest',88.7,.379,67,.58,1.8);
  patch('parkEast',120.7,.379,28.8,.76,1.5);
  patch('pierSouth',-143.1,.377,3.1,.65,1.84);
  patch('pierNorth',-139.1,.377,-3.25,.45,1.6);
  patch('berth',-148,.321,12.8,2.8,2.4);
  patch('lobby',-10.8,.392,-140,2.0,4.3);
  patch('lobby',-5.4,.392,-138,1.3,4.1);
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
