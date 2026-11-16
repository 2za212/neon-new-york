import {mapPlan} from './nyc-map-plan.js';

const NS='http://www.w3.org/2000/svg';
let mapSerial=0;
function svgNode(tag,attrs={},parent){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);parent?.append(n);return n;}
function pointsOf(shape){return Array.isArray(shape)?shape:shape?.points||[];}
function pointsText(shape){return pointsOf(shape).map(p=>p.join(',')).join(' ');}
function drawShape(shape,attrs,parent){
  if(!pointsOf(shape).length)return null;
  return svgNode(shape?.type==='polyline'?'polyline':'polygon',{points:pointsText(shape),...attrs},parent);
}

/** Both maps use the same world position and concave playable outline. */
export function createMapUI(world,{onOpen,onClose,onSelect}={}){
  const compass=document.querySelector('#compass');
  compass.innerHTML='<span class="north">N</span>';
  compass.setAttribute('role','button');compass.setAttribute('tabindex','0');compass.setAttribute('aria-label','打开区域地图');
  const panel=document.createElement('section');panel.id='city-map';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','map-heading');
  panel.innerHTML=`<div class="city-map-card"><header><div><p class="eyebrow">NEW YORK / AFTER THE RAIN</p><h2 id="map-heading">纽约城区地图</h2><p>南行逛 SoHo 市集，东行游公园；沿环线返回中城与滨水。</p></div><button class="map-close" aria-label="关闭地图">×</button></header><div class="city-map-surface"></div><div class="map-legend"><span><i class="map-road"></i>街道</span><span><i class="map-greenway"></i>高架步道</span><span><i class="map-stair"></i>楼梯</span><span><i style="background:#d9b77e"></i>城市边界</span><span>◇ 地标</span></div><nav class="map-places" aria-label="选择导航地标"></nav><footer>老城、中城、SoHo 与公园已连通<span><kbd>M</kbd> 地图 · <kbd>Esc</kbd> 返回</span></footer></div>`;
  document.body.append(panel);

  const b=world.bounds||mapPlan.currentBounds;
  const outline=world.mapOutline||world.outline||mapPlan.currentOutline;
  const regions=world.mapRegions||mapPlan.regions;
  const roadData=world.mapRoads||mapPlan.roads;
  const features=world.mapFeatures||mapPlan.features||[];
  const landmarks=world.landmarks||[];
  const frontierExits=world.frontierExits||mapPlan.frontierExits||[];
  const fullView=`${b.minX-5} ${b.minZ-7} ${b.maxX-b.minX+10} ${b.maxZ-b.minZ+14}`;
  const serial=++mapSerial;
  const mapSurface=panel.querySelector('.city-map-surface');
  // Override the old wide-map aspect ratio without changing the shared CSS.
  // The SVG viewport may have any aspect; meet keeps world metres undistorted.
  Object.assign(mapSurface.style,{height:'clamp(180px,52dvh,560px)',position:'relative'});

  function drawMap(parent,mini=false){
    const svg=svgNode('svg',{viewBox:fullView,'aria-hidden':'true',preserveAspectRatio:'xMidYMid meet'},parent);
    if(!mini)Object.assign(svg.style,{width:'100%',height:'100%',maxHeight:'none',aspectRatio:'auto'});
    const clipId=`nyc-current-outline-${serial}-${mini?'mini':'full'}`;
    const defs=svgNode('defs',{},svg),clip=svgNode('clipPath',{id:clipId,clipPathUnits:'userSpaceOnUse'},defs);
    drawShape(outline,{},clip);
    const contents=svgNode('g',{'clip-path':`url(#${clipId})`},svg);
    // The envelope's northwest/southeast corners remain blank. Water is drawn
    // solely from the existing Hudson shapes, never as a full-height side strip.
    drawShape(outline,{fill:'#273e47'},contents);
    for(const region of regions){
      if(region.status==='planned'||region.layer==='elevated')continue;
      if(region.id==='midtown')drawShape(region.shape,{fill:'#2e4650'},contents);
    }
    for(const water of mapPlan.water||[])drawShape(water.shape,{fill:'#183c50'},contents);
    for(const feature of features)drawShape(feature.shape,{fill:feature.fill||'#4b6768'},contents);

    const roads=svgNode('g',{'stroke-linecap':'butt',fill:'none'},contents);
    for(const road of roadData){
      if(road.status==='planned'||road.kind==='elevated-walk')continue;
      drawShape(road.shape,{fill:'none',stroke:road.kind==='promenade'?'#85958b':'#647983','stroke-width':road.width},roads);
    }
    const houses=svgNode('g',{fill:'#435860',stroke:'#869795','stroke-width':.22},contents);
    for(const c of world.colliders||[]){
      const width=c.max.x-c.min.x,depth=c.max.z-c.min.z;
      if(c.min.y<1&&c.max.y>3&&width>4&&depth>4){
        svgNode('rect',{x:c.min.x,y:c.min.z,width,height:depth},houses);
      }
    }
    for(const road of roadData){
      if(road.status!=='planned'&&road.kind==='elevated-walk')drawShape(road.shape,{fill:'none',stroke:'#77c9ad','stroke-width':2.9},contents);
    }
    svgNode('rect',{x:-124,y:-33.2,width:8,height:9.2,fill:'#77b6a0'},contents);
    for(const[x,z]of [[-41,-42],[-127,-44]]){
      svgNode('path',{d:`M${x},${z}V-30.7`,stroke:'#dfbd82','stroke-width':2.2,fill:'none'},contents);
      for(let zz=z+1;zz<-31;zz+=1.1)svgNode('path',{d:`M${x-1.4},${zz}h2.8`,stroke:'#344b4a','stroke-width':.3},contents);
    }
    for(const exit of frontierExits){
      const [x,z]=exit.position,dx=Math.cos(exit.rotation||0)*exit.width/2,dz=-Math.sin(exit.rotation||0)*exit.width/2;
      svgNode('path',{d:`M${x-dx},${z-dz}L${x+dx},${z+dz}`,stroke:'#d9b77e','stroke-width':.85,fill:'none'},contents);
    }
    if(!mini){
      for(const region of regions){
        if(region.status==='planned'||!region.labelAt)continue;
        const[x,z]=region.labelAt;
        const text=svgNode('text',{x,y:z,'text-anchor':'middle',fill:'#d7dfd2','font-size':3.4,'font-family':'Microsoft YaHei, sans-serif','paint-order':'stroke',stroke:'#253f47','stroke-width':.8},contents);
        text.textContent=region.name;
      }
      const north=svgNode('text',{x:b.maxX-9,y:b.minZ+11,fill:'#dedcc1','font-size':4,'text-anchor':'middle'},contents);north.textContent='N ↑';
    }
    const pins=new Map();
    for(const landmark of landmarks){
      const p=landmark.position,g=svgNode('g',{transform:`translate(${p.x} ${p.z})`,'data-id':landmark.id},contents);
      svgNode('path',{d:'M0,-2.1 1.7,0 0,2.1 -1.7,0Z',fill:'#e8c99a',stroke:'#233f45','stroke-width':.5},g);pins.set(landmark.id,g);
    }
    const player=svgNode('g',{},contents);
    svgNode('circle',{r:2.6,fill:'#173e4999',stroke:'#c6f7ec','stroke-width':.24},player);
    svgNode('path',{d:'M0,-2.3 1.6,1.8 0,1 -1.6,1.8Z',fill:'#d8fff3'},player);
    drawShape(outline,{fill:'none',stroke:'#93aaa1','stroke-width':.42,'pointer-events':'none'},svg);
    return{svg,player,pins};
  }
  const mini=drawMap(compass,true),full=drawMap(mapSurface);
  const buttons=new Map();
  for(const landmark of landmarks){
    const btn=document.createElement('button');btn.type='button';btn.textContent='◇ '+landmark.title;
    btn.onclick=()=>{onSelect?.(landmark.id);close();};
    panel.querySelector('.map-places').append(btn);buttons.set(landmark.id,btn);
  }
  let returnFocus;
  function open(){if(!panel.hidden)return;returnFocus=document.activeElement;onOpen?.();panel.hidden=false;panel.querySelector('.map-close').focus();}
  function close(){if(panel.hidden)return;panel.hidden=true;const restoreFocus=onClose?.();if(restoreFocus!==false)returnFocus?.focus?.({preventScroll:true});}
  panel.querySelector('.map-close').onclick=close;panel.onclick=e=>{if(e.target===panel)close();};
  panel.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const focusables=[...panel.querySelectorAll('button')],first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  compass.onclick=open;compass.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
  document.querySelector('#map').onclick=()=>panel.hidden?open():close();
  function update(position,heading,seen=new Set(),selectedId){
    mini.svg.setAttribute('viewBox',`${position.x-32} ${position.z-32} 64 64`);
    const transform=`translate(${position.x} ${position.z}) rotate(${180-heading*180/Math.PI})`;
    for(const map of [mini,full]){
      map.player.setAttribute('transform',transform);
      for(const[id,pin]of map.pins){pin.style.opacity=seen.has(id)?'.45':'1';pin.classList.toggle('map-selected',id===selectedId);}
    }
    for(const[id,btn]of buttons){btn.classList.toggle('visited',seen.has(id));btn.classList.toggle('selected',id===selectedId);btn.setAttribute('aria-pressed',String(id===selectedId));}
  }
  return{open,close,toggle(){panel.hidden?open():close();},get isOpen(){return!panel.hidden;},update};
}
