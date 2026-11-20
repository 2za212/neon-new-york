import * as T from 'three';
import {createStreetAdAtlas} from './nyc-street-ad-atlas.js';
import {legacyAdSites} from './nyc-street-ad-sites.js';
import {coreAdSites} from './nyc-street-ad-core.js';
import {addNeonCrown} from './nyc-street-neon.js';
import {mountTradeModel} from './nyc-street-trade-models.js';
import {stencils} from './nyc-street-ad-district.js';
import {refitTenants,sideWallSites,northernTenants,streetKiosks} from './nyc-street-ad-tenants.js';

// A face is anchored by the centre of its front glass. +Z points into the
// street. Frames, blade returns and both inscriptions share that local frame.
const iron=0x293943,galvanised=0x819491,bronze=0xb79165;
const emblems={
  cross:['..##..','..##..','######','######','..##..','..##..'],
  bowl:['..#..#.','.#..#..','.......','#######','.#####.','..###..','.#####.']
};

// Two broadcast layouts share one small sheet. The left half feeds the long
// platform tickers and the right half the upright public information terminals.
function emergencyBroadcast(){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const g=canvas.getContext('2d');
  for(let panel=0;panel<2;panel++){
    g.save();g.translate(256*panel,0);g.fillStyle='#481325';g.fillRect(0,0,256,256);
    g.fillStyle='#e97e77';g.fillRect(0,0,256,6);g.fillRect(0,249,256,7);
    const cx=panel?128:39,cy=panel?71:125,s=panel?8:6;
    g.fillStyle='#ffd6ac';
    const rune=['....xx....','...xxxx...','..xx..xx..','.xx.xx.xx.','xx..xx..xx','xx......xx','.xxx..xxx.','...xxxx...'];
    rune.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='x')g.fillRect(cx+(x-5)*s,cy+(y-4)*s,s,s);}));
    g.textAlign=panel?'center':'left';g.fillStyle='#fff0da';
    g.save();g.translate(panel?128:80,panel?172:160);if(!panel)g.scale(1,2.5);
    g.font='bold 40px "Microsoft YaHei",sans-serif';g.fillText('天裂警报',0,0,panel?234:167);g.restore();
    g.fillStyle='#efa893';g.font='bold 19px "Microsoft YaHei",sans-serif';
    g.fillText('请入室避险',panel?128:80,panel?210:202);g.restore();
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return map;
}

function screenMaterial(texture,clock,rift){
  const emergency={value:emergencyBroadcast()};
  const material=new T.MeshBasicMaterial({map:texture,toneMapped:false});
  material.name='印刷灯片与电子屏';
  material.onBeforeCompile=shader=>{
    shader.uniforms.streetTime=clock;
    shader.uniforms.adRift=rift;shader.uniforms.emergencyFeed=emergency;
    shader.vertexShader='attribute vec2 alarmUV; varying vec2 vAlarm;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vAlarm=alarmUV;');
    shader.fragmentShader='uniform vec3 adRift;uniform sampler2D emergencyFeed;varying vec2 vAlarm;\n'+shader.fragmentShader;
    shader.vertexShader='attribute vec2 adUV; attribute float adPhase; varying vec2 altUV; varying float panelPhase;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',
      '#include <uv_vertex>\n altUV=adUV; panelPhase=adPhase;');
    shader.fragmentShader='uniform float streetTime; varying vec2 altUV; varying float panelPhase;\n'+shader.fragmentShader;
    const panelSample=`vec4 panelColor=texture2D(map,vMapUv);
      if(panelPhase < -2.5){
        // A five-cell transmitter readout. Only the little light pipes
        // animate; store names and destination text keep constant exposure.
        vec2 px=vec2(altUV.x*328.,(1.-altUV.y)*74.);
        if(px.x>289. && px.x<318. && px.y>5. && px.y<15.){
          float bar=floor((314.-px.x+2.)/6.);
          float wave=.5+.5*cos(streetTime*.96-bar*.82+panelPhase);
          panelColor.rgb*=.65+.75*wave;
        }
      }else if(panelPhase < -1.5){
        // On this creative the three sloping bars are printed at 480 x 160.
        // Dim the inactive cells inside the battery, leaving all text steady.
        vec2 px=vec2(altUV.x*480.0,(1.0-altUV.y)*160.0);
        float bar=floor((px.x-77.0)/12.0);
        float col=px.x-77.0-12.0*bar;
        float row=px.y+bar*7.0+col*.56;
        if(bar>=0.0 && bar<3.0 && col>=0.0 && col<7.0 && row>77.0 && row<107.0){
          float progress=mod(streetTime*.62,4.7);
          float on=smoothstep(bar,bar+.35,progress)*(1.0-smoothstep(4.2,4.7,progress));
          panelColor.rgb*=.26+1.15*on;
        }
      }else if(panelPhase>=0.0){
        float t=mod(streetTime+panelPhase,22.0);
        float blend=smoothstep(10.2,11.0,t)*(1.0-smoothstep(21.2,22.0,t));
        panelColor=mix(panelColor,texture2D(map,altUV),blend);
      }
      if(adRift.y>0. && vAlarm.x>=0.){
        float takeover=adRift.y*smoothstep(.68,1.40,adRift.x-.065*mod(abs(panelPhase),5.));
        panelColor=mix(panelColor,texture2D(emergencyFeed,vAlarm),takeover);
      }
      diffuseColor *= panelColor;`;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',panelSample);
  };
  return material;
}

export function addStreetAdvertising(scene,renderer,buildings,localLights,options){
  const {tiles,texture}=createStreetAdAtlas(renderer),clock={value:0};
  const fixedMedia=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const signs=[...legacyAdSites,...coreAdSites(buildings),...refitTenants(scene,tiles),
    ...sideWallSites,...northernTenants(buildings),...streetKiosks(options)];
  const metal=new T.MeshLambertMaterial();
  const neon=new T.MeshBasicMaterial({toneMapped:false,vertexColors:true});
  const art=screenMaterial(texture,clock,options.rift);
  const cube=new T.BoxGeometry(1,1,1);
  const normals=cube.attributes.normal,shade=[];
  for(let i=0;i<normals.count;i++){
    const tone=.74+normals.getY(i)*.17+normals.getX(i)*.085+normals.getZ(i)*.13;
    shade.push(tone,tone,tone);
  }
  cube.setAttribute('color',new T.Float32BufferAttribute(shade,3));
  const transform=new T.Object3D(),tint=new T.Color();
  const cells=new Map();
  const stats={sites:signs.length,artworks:0,lightboxes:0,blocks:0,districts:{},kiosks:0};
  const usedArt=new Set();
  const projectingTrades=[];

  for(const [i,site] of signs.entries()){
    const {x,y,z,yaw,width:w,height:h,kind}=site,tile=tiles[site.id];
    site.glow=tile.glow;
    const onGreenway=['HIGH LINE','HUDSON','HUDSON  →','RIVER WALK'].includes(site.owner);
    const district=site.district||(onGreenway?'greenway':z<-179?'core':z<-52?'exchange':x<-110?'quay':x<-44&&z<52?'warehouse':x>=69&&z<=96?'park':z>=52?'soho':'old');
    site.district=district;stats.districts[district]=(stats.districts[district]||0)+1;
    usedArt.add(site.id);if(site.alternate)usedArt.add(site.alternate);
    const key=Math.floor(x/56)+','+Math.floor(z/56);
    if(!cells.has(key))cells.set(key,{metal:[],neon:[],position:[],uv:[],adUV:[],alarmUV:[],adPhase:[],indices:[]});
    const cell=cells.get(key),c=Math.cos(yaw),s=Math.sin(yaw);
    const blade=kind==='blade',kiosk=kind==='kiosk',poster=kind==='poster',electronic=kind==='ticker'||kiosk||site.id==='gridPower';
    const depth=kiosk||blade?.28:site.lowProfile||poster?.08:w>5?.32:.16;
    const lip=site.lowProfile||poster?.04:w>5?.16:.08;
    const skin=site.id==='deli'||site.id==='tea'?bronze:galvanised;
    const point=(u,v,n)=>[x+c*u+s*n,y+v,z-s*u+c*n];
    function block(layer,color,u,v,n,sx,sy,sz){
      cell[layer].push([...point(u,v,n),sx,sy,sz,color,yaw]);stats.blocks++;
    }
    const box=(color,u,v,n,sx,sy,sz)=>block('metal',color,u,v,n,sx,sy,sz);
    mountTradeModel(site,projectingTrades,options.ground,options.colliders,block);
    const tube=(u,v,n,sx,sy,sz)=>block('neon',tile.glow,u,v,n,sx,sy,sz);
    // Keep the front and reverse copies outside the metal and in the correct
    // reading order. Only the paid gallery slot cycles through other tenants.
    const alt=tiles[site.alternate]||(site.id==='battery'&&site.y>12?tiles.signal:null);
    function face(reverse){
      const base=cell.position.length/3,side=reverse?-1:1,n=reverse?-depth-.008:.008;
      for(const [u,v] of [[0,0],[1,0],[1,1],[0,1]]){
        cell.position.push(...point((u-.5)*w*side,(v-.5)*h,n));
        cell.uv.push(u?tile.u1:tile.u0,v?tile.v1:tile.v0);
        cell.alarmUV.push(electronic||alt?(w>h*1.45?0:.5)+.008+u*.484:-1,v);
        const t=alt||tile;
        if(site.id==='gridPower'||tile.group==='circuit')cell.adUV.push(u,v);
        else cell.adUV.push(u?t.u1:t.u0,v?t.v1:t.v0);
        cell.adPhase.push(site.id==='gridPower'?-2:tile.group==='circuit'?-3-i%5:alt?i%5:-1);
      }
      cell.indices.push(base,base+1,base+2,base,base+2,base+3);
    }
    box(iron,0,0,-depth/2,w+2*lip,h+2*lip,depth);
    face(false);
    if(blade||kiosk)face(true);
    for(const direction of [-1,1]){
      box(direction===1?skin:iron,0,direction*(h+lip)/2,-depth/2,w+2*lip,lip,depth+.04);
    }
    if(blade){
      const hand=site.mountSide||1,d=site.mountDepth;
      for(const v of [-h*.30,h*.30]){
        box(iron,hand*(w/2+d/2),v,-depth/2,d+.16,.12,.16);
        box(skin,hand*(w/2+d-.05),v,-depth/2,.16,.32,.32);
        box(skin,hand*(w/2+.04),v,-depth/2,.16,.20,depth+.16);
      }
      // The streetward edge is a luminous return, readable along the walk
      // even when the face itself is seen edge-on.
      for(const v of [-h*.28,0,h*.28])tube(-hand*(w/2+lip+.025),v,-depth/2,.055,h*.23,depth*.74);
    }else if(kiosk){
      const floor=site.baseY-site.y;
      box(iron,0,floor+.10,-depth/2,.88,.20,.40);
      box(skin,0,floor+.47,-depth/2,.65,.56,.28);
      box(iron,0,floor+.76,-depth/2,.96,.16,.34);
      for(const hand of [-1,1]){
        box(skin,hand*(w/2+.05),0,-depth/2,.10,h+.24,.36);
        tube(hand*(w/2+.07),h*.22,-depth/2,.09,.26,.37);
      }
      box(iron,0,h/2+.13,-depth/2,w+.24,.14,.40);
      stats.kiosks++;
    }else{
      const d=Math.max(site.mountDepth||depth,depth+.04);
      for(const u of [-w*.36,w*.36]){
        box(iron,u,0,-(depth+d)/2,poster?.10:.20,Math.min(h*.68,.64),d-depth+.08);
        if(w>3)box(skin,u,0,-d+.04,.32,.72,.16);
      }
      if(tile.group&&w>=3.4&&!site.lowProfile){
        const top=(h+lip)/2;
        if(tile.group==='industry'){
          // Substantial bolted end-stops and top shed keep rain off the
          // loading readout. End lamps can be seen looking along the dock.
          box(iron,0,top+.10,.03,w+.32,.16,.52);
          for(const hand of [-1,1]){
            box(skin,hand*(w/2+.12),0,.04,.24,h+.30,.38);
            for(const v of [-h*.25,h*.25])tube(hand*(w/2+.24),v,.045,.044,.15,.24);
          }
        }else if(tile.group==='counter'){
          // A projecting scalloped warming hood, with the underside facing
          // a customer. Solid dark joints keep the luminous hem articulated.
          box(0x77464d,0,top+.09,.10,w+.32,.20,.51);
          const count=Math.max(4,Math.round(w/.56)),pitch=(w+.32)/count;
          for(let j=0;j<count;j++){
            const u=-w/2-.16+(j+.5)*pitch;
            box(j%2?bronze:0x92555a,u,top+.015,.35,pitch-.017,.15,.17);
          }
          tube(0,top+.005,.22,w*.84,.034,.11);
        }else if(tile.group==='garden'){
          box(0x476153,0,top+.07,.02,w+.18,.14,.36);
          for(const hand of [-1,1]){
            box(0x536c60,hand*(w/2+.075),0,-.02,.15,h+.11,.24);
            tube(hand*(w/2+.10),top*.63,.10,.07,h*.19,.12);
          }
        }else if(tile.group==='circuit'){
          // Independent ceramic power bus with a row of glass insulators.
          const length=w*.40;
          box(iron,w*.25,top+.16,-.04,length+.20,.16,.28);
          for(let j=0;j<4;j++){
            const u=w*.25+(j-1.5)*length/4;
            box(galvanised,u,top+.12,.045,.16,.23,.25);
            tube(u,top+.23,.065,.10,.065,.18);
          }
        }
      }
    }
    if(electronic){
      const cells=w>5?9:5,pitch=Math.min(w*.44/cells,.48);
      for(let j=0;j<cells;j++){
        const u=-w/2+lip+(j+.5)*pitch,v=-(h+lip)/2;
        if(j<Math.ceil(cells*.7))tube(u,v,.04,pitch*.70,lip*.46,.04);
        else box(skin,u,v,.04,pitch*.70,lip*.46,.04);
      }
    }
    if(!poster&&!blade){
      // Separate channel pieces with unlit joints, held clear of the casing.
      const rail=w*.22,edge=h/2+lip/2;
      for(const dir of [-1,1])tube(dir*(w/2-rail/2),edge,.035,rail,lip*.46,.055);
    }
    const glyph=emblems[site.glyph];
    if(glyph){
      const step=w>6?.24:.16,cols=glyph[0].length;
      const gx=-w*.30,gy=h/2+lip+.16+glyph.length*step/2;
      for(const u of [-1,1])box(iron,gx+u*cols*step*.24,gy-.18,-.14,.16,glyph.length*step+.16,.16);
      // Merge touching tube cells horizontally. Each exposed step has a
      // deep tinted channel and a narrow luminous face mounted on its nose.
      glyph.forEach((row,r)=>{
        for(const run of row.matchAll(/#+/g)){
          const n=run[0].length,u=gx+(run.index+n/2-cols/2)*step,v=gy+((glyph.length-1)/2-r)*step;
          box(skin,u,v,-.045,n*step,step,.24);
          tube(u,v,.086,n*step-.024,step-.024,.048);
        }
      });
    }
    if(site.mark&&stencils[tile.icon]){
      const rows=stencils[tile.icon],pitch=.10,edge=-w/2-.14,top=h*.20+rows.length*pitch/2;
      // Project the brand from the casing at 90 degrees: pedestrians see
      // the solid front from across the road and the stepped tube downstreet.
      for(const v of [-.31,.31])box(iron,edge,v,-.10,.36,.12,depth+.20);
      box(skin,edge,h*.20,.52,.10,.10,1.18);
      rows.forEach((row,r)=>{
        for(const run of row.matchAll(/#+/g)){
          const len=run[0].length;
          tube(edge,top-(r+.5)*pitch,.20+(run.index+len/2)*pitch,.14,pitch,len*pitch);
        }
      });
    }
    addNeonCrown(site,box,(color,...dimensions)=>block('neon',color,...dimensions));
    if(site.spill){
      const light=new T.PointLight(tile.glow,20,6,2);
      light.position.fromArray(point(0,-h*.32,.80));
      light.userData.nightPower=light.intensity;localLights.push(light);scene.add(light);
    }
    if(!poster)stats.lightboxes++;
  }
  stats.artworks=usedArt.size;
  stats.projectingTrades=projectingTrades.length;
  for(const [key,cell] of cells){
    const root=new T.Group();root.name='沿街店招 '+key;scene.add(root);
    for(const [layer,material] of [['metal',metal],['neon',neon]]){
      const blocks=cell[layer];
      if(!blocks.length)continue;
      const mesh=new T.InstancedMesh(cube,material,blocks.length);
      blocks.forEach(([x,y,z,w,h,d,color,yaw],i)=>{
        transform.position.set(x,y,z);transform.rotation.y=yaw;transform.scale.set(w,h,d);
        transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);mesh.setColorAt(i,tint.setHex(color));
      });
      mesh.computeBoundingSphere();root.add(mesh);
    }
    const geo=new T.BufferGeometry();
    for(const [name,size] of [['position',3],['uv',2],['adUV',2],['alarmUV',2],['adPhase',1]]){
      geo.setAttribute(name,new T.Float32BufferAttribute(cell[name],size));
    }
    geo.setIndex(cell.indices);geo.computeBoundingSphere();root.add(new T.Mesh(geo,art));
  }
  return {sites:signs,stats,update(time){clock.value=fixedMedia?.matches?5.5:time;},
    setNight(night){art.color.setScalar(night?1:.82);neon.color.setScalar(night?1:.74);}};
}
