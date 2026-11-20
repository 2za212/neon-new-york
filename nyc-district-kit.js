import {buildSoHoWorkroom, buildSoHoLoadingBay, buildSoHoDisplay} from './nyc-soho-frontage.js';
import {routeWindow} from './nyc-route-windows.js';
import {buildHabitatStack,buildHeatCourt} from './nyc-habitat-stacks.js';
import {housingBond} from './nyc-housing-bond.js';
import {shopInterior} from './nyc-city-surfaces.js';
import * as T from 'three';

// Shared metre-scale components for the two final districts. Roads are flushed
// together after both district layouts are known, so junctions have one surface.
export function createDistrictKit(scene,api){
  const {box,beam,materials,colliders,surface,sign,rand=Math.random}=api;
  const registry=api.roadRegistry||(api.roadRegistry=[]),entries=[],lights=[];
  const stats={buildings:0,rooms:0,roads:0,boxes:0,beams:0,colliders:0,signs:0,lights:0,triangles:0,sidewalkSlabs:0,frontageDetails:0};
  const B=(...a)=>{stats.boxes++;stats.triangles+=12;box(...a);};
  const L=(...a)=>{stats.beams++;stats.triangles+=12;beam(...a);};
  const S=(...a)=>surface(...a);
  function C(x,y,z,w,h,d,id='district-solid'){
    const b=new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2));
    b.userData={districtKit:id};colliders.push(b);stats.colliders++;return b;
  }
  function mat(key,source,opts){if(!materials[key]){const m=materials[source].clone();Object.assign(m,opts);m.name='NYC district / '+key;m.userData={...materials[source].userData};materials[key]=m;}return key;}
  mat('districtIron',materials.sampleIron?'sampleIron':'metal',{roughness:.67,metalness:.40});
  mat('districtPlaster',materials.samplePlaster?'samplePlaster':'trim',{color:new T.Color('#a6aa98'),roughness:.94});
  mat('districtPaper','trim',{color:new T.Color('#b8b394'),roughness:.94});
  mat('districtCanvas','trim',{color:new T.Color('#536e66'),roughness:.96});
  mat('districtGlass','glass',{map:null,color:new T.Color('#adccca'),transparent:true,opacity:.13,roughness:.24,depthWrite:false,metalness:.03});
  materials.districtGlass.userData.castShadow=false;
  mat('districtWarm','lamp',{emissiveIntensity:.80,roughness:.66});
  mat('districtCool','cyan',{emissiveIntensity:1.45,roughness:.60});
  mat('districtBackWarm','trim',{color:new T.Color('#aaa58a'),emissive:new T.Color('#5b351d'),emissiveIntensity:.13,roughness:.96});
  mat('districtOak',materials.sampleOak?'sampleOak':'wood',{roughness:.84});
  mat('districtZinc',materials.sampleStreetZinc?'sampleStreetZinc':'metal',{roughness:.79,metalness:.35});
  mat('districtSlab',materials.sampleStreetSlab?'sampleStreetSlab':'concrete',{roughness:.96});
  mat('districtSlabAlt',materials.sampleStreetSlabAlt?'sampleStreetSlabAlt':'concrete',{roughness:.94});
  mat('districtMortar',materials.sampleStreetMortar?'sampleStreetMortar':'concrete',{roughness:.98});
  const tint=(s=.10)=>new T.Color().setScalar(1-s/2+rand()*s);
  function ground(minX,maxX,minZ,maxZ,material='asphalt',top=.18){B(material,(minX+maxX)/2,top-.18,(minZ+maxZ)/2,maxX-minX,.36,maxZ-minZ);S(minX,maxX,minZ,maxZ,top);}
  function rect(mat,r,top=.36,h=.18,col=0xffffff){if(r.maxX-r.minX>.005&&r.maxZ-r.minZ>.005)B(mat,(r.minX+r.maxX)/2,top-h/2,(r.minZ+r.maxZ)/2,r.maxX-r.minX,h,r.maxZ-r.minZ,col);}
  function register(axis,at,min,max,width,sidewalk){
    const road={axis,at,min,max,width,sidewalk,render(all,paving){
      const half=width/2,side=sidewalk;
      for(const e of [-1,1]){
        const a=e<0?at-half-side:at+half,b=a+side;
        const region=axis==='z'?{minX:a,maxX:b,minZ:min,maxZ:max}:{minX:min,maxX:max,minZ:a,maxZ:b};
        let pieces=[region];
        for(const other of all){if(other===road)continue;pieces=pieces.flatMap(p=>subtractRect(p,roadRect(other)));}
        for(const old of paving)pieces=pieces.flatMap(p=>subtractRect(p,old));
        for(const p of pieces){
          rect('paver',p,.36,.18,tint(.04));S(p.minX,p.maxX,p.minZ,p.maxZ,.36);paving.push(p);
          stats.sidewalkSlabs+=Math.round((p.maxX-p.minX)*(p.maxZ-p.minZ)/(.32*.32));
        }
        // Quarter-voxel curb joints stop at the actual crossing asphalt.
        for(let t=min+.25;t<max;t+=.62){
          const x=axis==='z'?at+e*(half+.10):t,z=axis==='z'?t:at+e*(half+.10);
          if(all.some(o=>o!==road&&pointInRect(x,z,roadRect(o),.20)))continue;
          B('trim',x,.285,z,axis==='z'?.24:.59,.21,axis==='z'?.59:.24,tint(.10));
        }
      }
      for(let t=Math.ceil(min/7)*7;t<max;t+=7){
        const x=axis==='z'?at:t,z=axis==='z'?t:at;
        if(all.some(o=>o!==road&&o.axis!==axis&&pointInRect(x,z,roadRect(o),4.6)))continue;
        for(const e of width>=10?[-1,1]:[0])B(width>=10?'yellow':'white',x+(axis==='z'?e*.13:0),.188,z+(axis==='x'?e*.13:0),axis==='z'?.075:2.6,.012,axis==='z'?2.6:.075,0xa9b199);
      }
    }};
    road.crossing=(cross)=>{
      for(const e of [-1,1]){
        const zz=cross.at+e*(cross.width/2+1.4);
        if(zz>min+.3&&zz<max-.3)for(let xx=at-width/2+.75;xx<at+width/2-.5;xx+=1.15)B('white',xx,.189,zz,.55,.012,2.0,0xb3b9a5);
        const xx=at+e*(width/2+1.4);
        if(xx>cross.min+.3&&xx<cross.max-.3)for(let z=cross.at-cross.width/2+.75;z<cross.at+cross.width/2-.5;z+=1.15)B('white',xx,.189,z,2.0,.012,.55,0xb3b9a5);
      }
    };
    registry.push(road);stats.roads++;return road;
  }
  const roadZ=(x,minZ,maxZ,width=12.8,sidewalk=2.8)=>register('z',x,minZ,maxZ,width,sidewalk);
  const roadX=(z,minX,maxX,width=10,sidewalk=2.8)=>register('x',z,minX,maxX,width,sidewalk);

  function building({id,x,z,width,depth,floors=3,rot=0,title='',subtitle='NEW YORK / AFTER HOURS',brick='brickBrown',accent='warm',open=false,furniture='generic',frontage=null}){
    stats.buildings++;stats.rooms++;
    const c=Math.cos(rot),s=Math.sin(rot),P=(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c];
    const F=(m,u,y,v,w,h,d,col=0xffffff)=>B(m,...P(u,y,v),w,h,d,col,rot);
    const bond=housingBond(materials,F,api.panel,P);
    const Q=(u,y,v,w,h,d,tag)=>{const p=P(u,y,v);return C(...p,Math.abs(c)*w+Math.abs(s)*d,h,Math.abs(s)*w+Math.abs(c)*d,id+'/'+tag);};
    const patch=(u0,u1,v0,v1,y=.36)=>{const p=P((u0+u1)/2,y,(v0+v1)/2),w=u1-u0,d=v1-v0,wx=Math.abs(c)*w+Math.abs(s)*d,dz=Math.abs(s)*w+Math.abs(c)*d;S(p[0]-wx/2,p[0]+wx/2,p[2]-dz/2,p[2]+dz/2,y);};
    const loading=frontage==='loading',display=frontage==='display',books=display&&furniture==='books';
    const workshop=loading||frontage==='workroom'||books;
    const roomDepth=Math.min(loading||display?4.05:3.3,depth-1),top=4.1+floors*3.15,lower=3.74,core=depth-roomDepth;
    const bay=workshop?Math.min(7.2,width-2):0;
    const upperBase=workshop?7.25:4.1;
    const seed=Math.abs(Math.round(z*4+x));
    brick=seed%3?'basaltShell':'titaniumSkin';
    function upper(u,y,v,w,h,d,id){
      F(brick,u,y,v,w,h,d,tint());Q(u,y,v,w,h,d,id);
    }
    if(workshop){
      upper(0,5.675,-(depth+2.38)/2,width,3.15,depth-2.38,'workroom-core');
      for(const e of [-1,1])upper(e*(width+bay)/4,5.675,-1.19,(width-bay)/2,3.15,2.38,'workroom-side');
      buildSoHoWorkroom(F,Q,bay,brick,books);
    }
    // Mercer receives stock on the cross street. Cut the actual side and
    // rear of its first three floors for the sorting rooms and freight lift.
    const receivingCorner=id==='soho_mercer_grocer';
    const heatCourt=id==='soho_residential';
    if(receivingCorner){
      const sideCut=3.2,backCut=2.56,receivingRoof=10.4;
      upper(-sideCut/2,(receivingRoof+upperBase)/2,-(depth-backCut)/2,width-sideCut,receivingRoof-upperBase,depth-backCut,'sorting-core');
      upper(-sideCut/2,.36+lower/2,-roomDepth-(core-backCut)/2,width-sideCut,lower,core-backCut,'receiving-core');
    }else{
      const rearInset=heatCourt?3.04:0;
      upper(0,.36+lower/2,-roomDepth-(core-rearInset)/2,width,lower,core-rearInset,'core');
      if(heatCourt)for(const end of [-1,1])
        upper(end*(width/2-.16),.36+lower/2,-depth+rearInset/2,.32,lower,rearInset,'heat-room-return');
    }
    for(const e of [-1,1]){
      const u=e*(width/2-.13);
      if((frontage==='workroom'&&e===1)||(id==='soho_infill_east_noodle'&&e===-1)){
        for(const [y,h,mat] of [[.82,.92,brick],[2.23,1.90,'districtGlass'],[3.61,.86,brick]]){
          F(mat,u,y,-roomDepth/2,.26,h,roomDepth,tint());Q(u,y,-roomDepth/2,.26,h,roomDepth,'corner-side');
        }
        for(const v of [-.14,-1.14,-2.15,-roomDepth+.12])F('districtIron',u+e*.14,2.22,v,.19,2.08,.13,0xa4b0a2);
        F('districtZinc',u+e*.17,1.25,-roomDepth/2,.29,.18,roomDepth,0xacb7ac);
      }else{
        F(brick,u,2.23,-roomDepth/2,.26,3.74,roomDepth,tint());
        Q(u,2.23,-roomDepth/2,.26,3.74,roomDepth,'side');
      }
    }
    F('districtOak',0,.28,-roomDepth/2,width-.28,.16,roomDepth);patch(-width/2+.14,width/2-.14,-roomDepth,.18);
    F('paver',0,.27,.65,width-.10,.18,1.30);patch(-width/2+.05,width/2-.05,0,1.30);
    F('districtPlaster',0,3.975,-roomDepth/2,width,.25,roomDepth);Q(0,3.975,-roomDepth/2,width,.25,roomDepth,'ceiling');
    F('districtBackWarm',0,2.10,-roomDepth+.07,width-.28,3.48,.14);
    // Recessed display behind the physical racks, with the customer aisle open.
    if(!frontage)F(shopInterior(title,x+z),-width*.23,2.41,-roomDepth+.155,Math.min(3.8,width*.44),2.54,.025);
    F('districtOak',0,.63,-roomDepth+.16,width-.3,.51,.06);
    for(let u=-width/2+.30;u<width/2-.25;u+=.42)F('districtOak',u,.69,-roomDepth+.20,.055,.60,.065,0xb7b49d);
    const routeProfiles={soho_lafayette:'tailor',soho_broome:'workroom',soho_fulton:'home',soho_mercer_grocer:'pantry'};
    const blockProfiles=['home','pantry','workroom','tailor'];
    const profile=routeProfiles[id]||blockProfiles[Math.abs(Math.round(x*3+z))%4];
    buildHabitatStack({box:F,bond,solid:Q,width,depth,bottom:receivingCorner?10.40:upperBase,top,
      pitch:3.15,seed,bookshop:books,streetSite:id.startsWith('soho_')?[x,z]:null,
      glass:(floor,bay)=>routeWindow(profile,floor,bay,4)});
    if(heatCourt){
      buildHeatCourt(F,Q,patch,depth,bond);
      const rearSign=sign?.(...P(0,3.70,-depth-.18),4.64,.66,'街坊热水站','回收余热 / 本楼供水','#ffa969',rot+Math.PI);
      if(rearSign)stats.signs++;
      for(const [v,colour,power] of [[-depth+.72,0xffba71,96],[-depth-10.72,0xa5d7d7,90]]){
        const l=new T.PointLight(colour,power,12,2);
        l.position.set(...P(0,3.20,v));l.name='运河后院 / 夜班水站';l.userData.nightPower=power;
        scene.add(l);lights.push(l);stats.lights++;
      }
    }
    // An actual door reveal and transparent display bays, with separate barriers.
    const doorU=width*.24,doorWidth=1.4,a=-width/2+.32,b=width/2-.32;
    const glassInset=books?.70:display?.42:0;
    for(const [lo,hi]of [[a,doorU-.90],[doorU+.90,b]])if(hi-lo>.12){
      if(loading&&lo===a){buildSoHoLoadingBay(F,Q,lo,hi);continue;}
      const u=(lo+hi)/2,w=hi-lo;
      if(display){
        const jamb=books?'titaniumSkin':'ceramicShell';
        for(const edge of [lo+.075,hi-.075]){
          F(jamb,edge,2.15,-glassInset*.5,.15,2.18,glassInset+.10,0xb5ada0);
          F('districtOak',edge,2.15,-glassInset-.044,.14,2.16,.14,0xc8b395);
          Q(edge,2.15,-glassInset*.5,.15,2.18,glassInset+.10,'display-reveal');
        }
        F('districtOak',u,.87,-glassInset*.5,w+.15,.19,glassInset+.29,0xbda280);
        F('districtOak',u,3.25,-glassInset*.5,w+.16,.16,glassInset+.30,0xc8b191);
        F('districtWarm',u,3.155,-glassInset*.46,w*.77,.035,.10,0x9d9477);
        F('paver',u,.365,-glassInset*.5,w,.018,glassInset+.29,0xaab0a2);
      }
      F('districtIron',u,.70,.08-glassInset,w,.68,.25);
      F('districtGlass',u,2.11,-.035-glassInset,w-.10,2.10,.035);
      for(let q=lo+.10;q<hi-.06;q+=.16){F('districtZinc',q,.70,.215-glassInset,.025,.48,.025,0xa7b4a9);stats.frontageDetails++;}
      F('districtIron',u,1.03,.08-glassInset,w,.10,.26);
      F('districtIron',u,3.22,.06-glassInset,w,.13,.24);
      F('districtZinc',u,2.43,.095-glassInset,w,.042,.10,0xb1bcae);
      for(let j=lo+.15;j<hi;j+=1.15)F('districtIron',j,2.12,.035-glassInset,.055,2.20,.11);
      Q(u,1.96,.045-glassInset,w,3.20,.16,'window');
    }
    for(const u of [-width/2+.15,doorU-.80,doorU+.80,width/2-.15]){
      F('basaltShell',u,1.96,.08,.24,3.20,.30);
      F('ceramicShell',u,1.99,.12,.20,3.26,.36,0xc8c9b6);F('districtIron',u,3.59,.19,.30,.22,.48);Q(u,1.99,.12,.20,3.26,.36,'pier');
      F('districtZinc',u,.61,.18,.20,.45,.46,0xb5bda7);
      F('districtZinc',u,3.40,.20,.22,.10,.48,0x9fafa1);
      for(let y=.96;y<3.35;y+=.33){F('districtPlaster',u,y,.307,.205,.027,.025,0x7e938a);stats.frontageDetails++;}
    }
    F('districtOak',doorU,3.10,-.10,1.66,.18,.26);Q(doorU,3.10,-.10,1.66,.18,.26,'header');
    // Jamb trim sits inside the original piers, leaving the real 1.4m door
    // aperture and its existing barrier/collision declarations unchanged.
    for(const e of [-1,1])F('districtOak',doorU+e*.765,1.75,-.12,.13,2.78,.26,0xc4b28e);
    F('districtGlass',doorU,3.43,-.12,1.40,.41,.035);
    F('districtZinc',doorU,3.23,.04,1.66,.065,.29,0xc0c6b5);
    if(!open){
      const inset=workshop?-1.38:-.16;
      F('districtIron',doorU,1.80,inset,1.40,2.66,.13);
      F('glass',doorU,2.1,inset+.08,1.18,1.55,.025);
      Q(doorU,1.8,inset,1.4,2.66,.13,'closed-door');
      if(workshop)for(const e of [-1,1]){
        F('districtIron',doorU+e*.78,1.77,inset*.5,.14,2.82,1.35,0x889991);
        Q(doorU+e*.78,1.77,inset*.5,.14,2.82,1.35,'door-reveal');
      }
    }
    F('districtIron',0,3.60,.18,width-.10,.46,.42);F('titaniumSkin',0,3.29,.53,width,.24,1.15);
    F('districtOak',0,3.90,.21,width+.08,.12,.52,0xc0b69c);
    for(let u=-width/2+.13;u<width/2;u+=.28){F('districtZinc',u,3.81,.41,.11,.11,.19,0x9caaa1);stats.frontageDetails++;}
    F('districtIron',0,3.19,1.06,width,.09,.12);
    for(let u=-width/2+.26;u<width/2;u+=.96)F('ceramicShell',u,3.13,1.02,.48,.32,.32,0xd5ccba);
    if(title&&sign){const m=sign(...P(0,3.63,.43),Math.min(width-.5,8),.47,title,subtitle,accent==='cool'?'#91c7c4':'#ddc598',rot);if(m){m.material.color.setHex(0x7b8277);m.material.emissiveIntensity=.65;m.material.roughness=.85;}stats.signs++;}
    if(!loading){
      const counterU=-width*.22,counterW=width*.39,counterV=display?-2.49:-1.30;
      F('districtIron',counterU,.93,counterV,counterW,1.14,.84);F('districtOak',counterU,1.53,counterV,counterW+.13,.09,.99);Q(counterU,.98,counterV,counterW+.13,1.22,.99,'counter');
      for(const y of [1.35,2.05,2.75]){
        F('districtOak',0,y,-roomDepth+.28,width-.85,.075,.40);
        const ink=[0x955341,0x3e706e,0xcd9b54,0x54698b,0x8d4958,0xb8b184];
        let u=-width/2+.56, item=0;
        while(u<width/2-.72){
          const key=item*7+Math.round(y*11);
          const h=.24+.045*(key%5),w=.09+.026*(key%4);
          if(furniture==='books' && item%11===4){
            for(let j=0;j<3;j++)F('districtPaper',u+.20,y+.10+j*.057,-roomDepth+.32,.39-j*.024,.052,.27,ink[(key+j)%6]);
            u+=.51;
          }else{
            const spine=furniture==='books'?w:.22;
            F('districtPaper',u+spine/2,y+.05+h/2,-roomDepth+.30,spine,h,.24,ink[key%6]);
            F('districtPaper',u+spine/2,y+h*.72,-roomDepth+.425,spine*.73,.019,.013,0xe0cfad);
            if(key%3===0)F('districtZinc',u+spine/2,y+.10,-roomDepth+.426,spine*.82,.016,.011);
            u+=spine+.018;
          }
          if(item%13===9)u+=.26;
          item++;
        }
      }
      Q(0,1.77,-roomDepth+.26,width-.80,2.80,.44,'back-stock');
      if(furniture==='grocer')for(let row=0;row<3;row++)for(let j=0;j<10;j++)F(j%3?'leaf':'yellow',counterU-counterW*.40+j*counterW*.088,1.64+row*.035,counterV-.31+row*.25,.15,.15,.15,0xa1b38b);
      else for(let j=0;j<Math.max(4,Math.floor(counterW/.24));j++)F(j%3?'districtPaper':'districtCanvas',counterU-counterW*.42+j*.24,1.70,counterV+.03,.18,.28,.31,tint(.20));
    }
    if(display)buildSoHoDisplay(F,Q,width,roomDepth,furniture,glassInset);
    const glow=accent==='cool'?'districtCool':'districtWarm';
    F('districtIron',doorU,3.48,-1.8,.03,.45,.03);F('districtIron',doorU,3.23,-1.8,.35,.12,.35);F(glow,doorU,3.16,-1.8,.22,.035,.22);
    if(loading||frontage==='workroom'){
      const l=new T.PointLight(0xffd4a4,loading?15:13,5.9,2);
      l.position.set(...P(loading?-width*.12:0,loading?2.90:6.71,-1.42));
      l.userData.nightPower=l.intensity;l.castShadow=false;scene.add(l);lights.push(l);stats.lights++;
    }
    let entry=null;
    if(open){
      const l=new T.PointLight(accent==='cool'?0x8ac7cd:0xffc28f,accent==='cool'?9:13,6.5,2);l.position.set(...P(doorU-.5,3.04,-1.9));l.userData.nightPower=l.intensity;l.castShadow=false;scene.add(l);lights.push(l);stats.lights++;
      entry={id,street:P(doorU,.36,1.10),inside:P(doorU,.36,-1.2),deep:P(doorU,.36,-2.35),clearWidth:1.4,clearHeight:2.65,ceilingY:3.85};entries.push(entry);
    }
    return {id,entry,front:{P,B:F,C:Q,patch},bounds:{x,z,width,depth,rot},top};
  }
  function setNight(night){for(const l of lights)l.intensity=l.userData.nightPower*(night?1:.57);materials.districtWarm.emissiveIntensity=night?.80:.38;materials.districtCool.emissiveIntensity=night?1.45:.65;}
  return {stats,entries,lights,ground,roadX,roadZ,building,setNight,setQuality(){},rect,B,L,C};
}

export function flushDistrictRoads(registry){
  const paving=(registry.pavingExclusions||[]).map(r=>({...r}));for(const road of registry)road.render(registry,paving);
  // One crossing pattern per physical junction, shared by both district owners.
  const done=new Set();
  for(const a of registry)for(const b of registry){
    if(a.axis!=='z'||b.axis!=='x'||a.at<b.min-.01||a.at>b.max+.01||b.at<a.min-.01||b.at>a.max+.01)continue;
    const key=a.at+':'+b.at;if(done.has(key))continue;done.add(key);
    // Road render callbacks own their batch API; crossing markings are emitted
    // by a small registered callback to keep ownership/stats deterministic.
    if(a.crossing)a.crossing(b);
  }
  return {roads:registry.length,junctions:done.size,sidewalkPieces:paving.length};
}
function roadRect(r){return r.axis==='z'?{minX:r.at-r.width/2,maxX:r.at+r.width/2,minZ:r.min,maxZ:r.max}:{minX:r.min,maxX:r.max,minZ:r.at-r.width/2,maxZ:r.at+r.width/2};}
function pointInRect(x,z,r,pad=0){return x>r.minX-pad&&x<r.maxX+pad&&z>r.minZ-pad&&z<r.maxZ+pad;}
export function subtractRect(a,b){
  const x0=Math.max(a.minX,b.minX),x1=Math.min(a.maxX,b.maxX),z0=Math.max(a.minZ,b.minZ),z1=Math.min(a.maxZ,b.maxZ);
  if(x1<=x0+.0001||z1<=z0+.0001)return[a];
  const out=[];if(a.minX<x0)out.push({...a,maxX:x0});if(x1<a.maxX)out.push({...a,minX:x1});
  if(a.minZ<z0)out.push({minX:x0,maxX:x1,minZ:a.minZ,maxZ:z0});if(z1<a.maxZ)out.push({minX:x0,maxX:x1,minZ:z1,maxZ:a.maxZ});return out;
}
