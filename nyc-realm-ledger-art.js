import * as T from 'three';

export const width=960,height=610;
export const actionRect=[555,478,345,92],closeRect=[842,15,88,82];
export const navRect=[642,15,171,82],itemRect=[340,121,583,149];
const ink='#13192e',white='#f1f4ff',secondary='#c1cde0',signal='#91e0f0',amber='#ffcf84',violet='#ab9fef';

// Each line is a separate projection at a physical depth relative to the
// six-degree reading cone. Controls project through their own moving layer.
const bands=[
  {name:'title',top:6,bottom:108,depth:-.035,turn:-.035,delay:.27},
  {name:'mission',top:120,bottom:278,depth:.012,turn:.025,delay:.46},
  {name:'condition',top:284,bottom:433,depth:.042,turn:-.015,delay:.63},
  {name:'receipt',top:466,bottom:600,depth:.066,turn:.018,delay:.79}
];
function polygon(g,points,fill){
  g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();
}
function line(g,points,color,size=2){
  g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
  g.strokeStyle=color;g.lineWidth=size;g.stroke();
}
function text(g,words,x,y,size,color,serif=false){
  g.font=(serif?'700 '+size+'px "STZhongsong","SimSun",serif':'600 '+size+'px "Microsoft YaHei",system-ui,sans-serif');
  g.fillStyle=color;g.shadowColor='#061319';g.shadowBlur=6;g.fillText(words,x,y);g.shadowBlur=0;
}
function shade(g,x,y,w,h){
  const gradient=g.createLinearGradient(x,y,x+w,y);
  gradient.addColorStop(0,'rgba(20,24,48,.98)');gradient.addColorStop(.72,'rgba(26,33,58,.95)');
  gradient.addColorStop(1,'rgba(26,33,58,.42)');
  polygon(g,[[x+14,y],[x+w,y],[x+w-18,y+h],[x,y+h],[x,y+14]],gradient);
}
export function createLedgerLayers(root){
  const layers=bands.map((band,index)=>{
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=band.bottom-band.top;
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
    const group=new T.Group();root.add(group);group.name='界印投影 / '+band.name;
    const material=new T.MeshBasicMaterial({map:texture,transparent:true,toneMapped:false,fog:false,depthTest:false,depthWrite:false});
    const mesh=new T.Mesh(new T.PlaneGeometry(1,canvas.height/height),material);
    mesh.position.y=.5-(band.top+band.bottom)/(2*height);mesh.renderOrder=982+index;group.add(mesh);
    return {...band,group,canvas,texture,material};
  });
  function paint(stage,near,distance,inside,shards,justClaimed,page){
    const bag=page==='bag',detail=page==='detail',mission=page==='mission',claimed=stage===2;
    const nav=mission?'背包':'任务';
    let label=claimed?(justClaimed?'签到成功':'委托已完成'):stage===0?'签到委托':near?'界印共鸣':'寻访途中';
    let heading=claimed&&justClaimed?'界隙晶片':'旧市留痕';
    let target='旧交易所夜市 · 候车亭';
    let instruction=claimed?'奖励已存入背包。':stage===0?'到候车亭旁，展开界印签到。':near?'已抵达，可在此留下界印。':inside?'离开公寓，前往旧交易所。':'距候车亭约 '+distance+' 米';
    let action=stage===0?'接取委托':claimed?'打开背包':near?'签到并领取':'继续前往';
    if(bag){
      label='背包  /  '+(shards?'1':'0')+' 种道具';heading=shards?'界隙晶片':'背包为空';
      target=shards?'来源　旧市留痕':'首件藏物 · 界隙晶片';
      instruction=shards?'轻触晶片，查看实物。':'完成旧交易所签到后收入背包。';action='返回任务';
    }else if(detail){
      label='背包  /  共鸣材料';heading='界隙晶片';
      target='界印闭合时凝出的薄晶。';instruction='转动时，裂隙里会透出冷光。';action='返回背包';
    }
    const accent=detail||(claimed&&justClaimed)?amber:violet;
    for(const layer of layers){
      const g=layer.canvas.getContext('2d');g.save();g.clearRect(0,0,width,layer.canvas.height);g.translate(0,-layer.top);
      if(layer.name==='title'){
        shade(g,256,15,658,76);
        line(g,[[260,72],[260,42],[275,27],[301,27]],violet,4);
        text(g,'诸天万界系统',302,72,47,white,true);
        polygon(g,[[650,26],[798,26],[798,75],[786,87],[638,87],[638,38]],'#293c57');
        line(g,[[659,69],[659,46],[665,40],[677,40],[683,46],[683,69],[659,69]],signal,3);
        if(!mission)line(g,[[663,51],[679,51],[679,56],[663,56]],signal,2);
        text(g,nav,701,70,32,signal);
        shade(g,850,20,70,66);line(g,[[872,40],[895,64]],secondary,4);line(g,[[895,40],[872,64]],secondary,4);
      }else if(layer.name==='mission'){
        shade(g,340,126,588,141);line(g,[[341,248],[341,155],[356,140]],accent,4);
        text(g,label,374,171,29,accent);text(g,heading,bag&&shards?442:368,251,bag?60:75,bag&&shards?amber:white,true);
        if(bag&&shards){
          polygon(g,[[373,221],[382,221],[382,201],[390,201],[390,188],[401,188],[401,201],[408,201],[408,229],[396,248],[387,248]],amber);
          polygon(g,[[396,205],[401,200],[410,212],[410,226],[397,247]],'#be784d');
          line(g,[[378,229],[387,229],[387,220],[401,220]],signal,3);
          text(g,'×'+shards,726,235,35,white);
          line(g,[[860,203],[873,216],[860,229]],signal,5);
          line(g,[[354,263],[890,263],[905,248]],signal,3);
        }
      }else if(layer.name==='condition'){
        shade(g,366,291,555,128);
        text(g,target,387,337,33,white);text(g,instruction,387,396,32,secondary);
      }else{
        shade(g,70,490,416,92);
        text(g,detail?'取得地点':bag?'背包合计':claimed?'已入背包':'任务报酬',96,522,27,secondary);
        text(g,detail?'旧交易所 · 候车亭':bag?'道具  ×'+shards:'界隙晶片  ×'+(claimed?shards:1),93,567,36,detail||!bag?amber:white);
        const [x,y,w,h]=actionRect;
        polygon(g,[[x+14,y],[x+w,y],[x+w,y+h-14],[x+w-14,y+h],[x,y+h],[x,y+14]],signal);
        g.font='700 37px "Microsoft YaHei",system-ui,sans-serif';g.fillStyle=ink;g.fillText(action,x+34,y+60);
        line(g,[[x+w-54,y+30],[x+w-39,y+45],[x+w-54,y+60]],ink,4);
      }
      g.restore();layer.texture.needsUpdate=true;
    }
    return {action,nav,description:[label,heading,target,instruction].join('。')+(mission?'':' 持有 '+shards+' 枚。')};
  }
  return {paint,header:layers[0].group,entry:layers[1].group,receipt:layers[3].group,update(open,rewardAge,justClaimed,worldWidth,reduced){
    for(const layer of layers){
      const alpha=T.MathUtils.smoothstep(open,layer.delay,layer.delay+.18);
      const arrival=justClaimed&&!reduced&&layer.name!=='title'?T.MathUtils.smoothstep(rewardAge,.14+layer.delay*.32,.45+layer.delay*.42):1;
      const visible=alpha*arrival;
      layer.group.visible=visible>.001;layer.material.opacity=visible;
      layer.group.position.set((1-visible)*.032,-(1-visible)*.048,worldWidth*(layer.depth-(1-visible)*.15));
      layer.group.rotation.y=layer.turn+(1-visible)*.08;layer.group.updateMatrix();
    }
  }};
}
