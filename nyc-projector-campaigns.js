import {premises,lotPoint} from './nyc-lower-block-plan.js';
import {stencils} from './nyc-street-ad-district.js';

// Each concession buys a real fixing on its host building. The small projector
// sits over one end of the sign, away from the tenant's door and shop window.
export const campaigns={
  spool:['流光织线','雨一落，衣袖就亮','spool','#34243e','#ff9fcb'],
  bowl:['第四顿','给换班的人留一锅','bowl','#672e2c','#ffc07b'],
  ship:['潮间渡运','夜航也有下一班','ferry','#173a4c','#81e5ec'],
  leaf:['借光苗圃','把天亮种回窗台','seed','#193b38','#a5f2b6'],
  atom:['微轨实验社','线圈和仪表按晚借','relay','#21344e','#96dbff'],
  capsule:['折班夜诊','末班车后仍应诊','cross','#294045','#a8efc8'],
  tower:['垂直住区','让通勤只剩一层楼','tower','#342844','#e5afff'],
  cargo:['霜匣冷链','封箱起至交班恒温','crate','#253848','#9be3ef']
};
export function paintCampaigns(g,tiles){
  // One extra column in the existing atlas keeps every street screen in the same draw.
  for(const [i,[id,[title,line,icon,bg,accent]]] of Object.entries(campaigns).entries()){
    const x=1034,y=10+i*191,w=490,h=164;
    g.save();g.translate(x,y);g.fillStyle=bg;g.fillRect(-4,-4,w+8,h+8);
    g.strokeStyle=accent;g.lineWidth=2;g.strokeRect(12,12,136,140);
    const pattern=stencils[icon],step=8,left=80-pattern[0].length*step/2,top=79-pattern.length*step/2;
    g.fillStyle=accent;
    pattern.forEach((row,r)=>{for(const run of row.matchAll(/#+/g))g.fillRect(left+run.index*step,top+r*step,run[0].length*step,step);});
    g.fillRect(171,22,57,5);for(let j=0;j<4;j++)g.fillRect(430+j*9,18,4,8+j*2);
    g.textBaseline='middle';g.textAlign='left';g.font='900 58px "Microsoft YaHei","PingFang SC",sans-serif';
    g.fillStyle='#fff4df';g.fillText(title,169,76,300);
    g.font='600 23px "Microsoft YaHei","PingFang SC",sans-serif';g.fillStyle=accent;g.fillText(line,173,128,297);g.restore();
    tiles[id+'Cast']={title,glow:parseInt(accent.slice(1),16),u0:(x+.5)/1536,u1:(x+w-.5)/1536,v0:1-(y+h-.5)/2048,v1:1-(y+.5)/2048};
  }
}
const leases=[
  ['cut','spool'],['loom','spool',false],['canteen','bowl'],['dye','spool',false],
  ['west-ice','cargo'],['scale','cargo',false],['mess','bowl'],['union','cargo',false],
  ['copy','atom',false],['sensors','atom'],['infirmary','capsule'],['noodles','bowl',false],
  ['clinic','capsule'],['canteen-east','bowl',false],['ticket-desk','ship'],['galley','ship',false],
  ['park-workshop','leaf'],['cloth-vault','spool',false],['repair-home','atom'],['roster','tower']
];
export function projectorAdSites(core){
  const sites=[];
  function mount(id,frame,depth,u,y,offset,board,cast,scale,owner){
    const [x,z]=lotPoint(frame,u,depth/2+offset);
    sites.push({id:id+'Cast',campaign:id,cast,owner,x,y,z,yaw:frame.yaw,width:board,
      height:board/3,kind:'wall',mountDepth:offset+.24,projectorScale:scale});
  }
  for(const [key,id,cast=true] of leases){
    const b=premises.find(p=>p.id===key);
    // The inhabited upper room projects over the original shop fascia.
    const gallery=b.depth<4.5?.72:1.25;
    mount(id,b,b.depth,-b.width*.24,4.11,gallery+.51,Math.min(3.52,b.width*.55),cast,.96,b.name);
  }
  for(const [x,z,id,side] of [[64,-292,'tower',-1],[46,-186,'atom',1],[109,-239,'cargo',-1],[92,-207,'tower',1]]){
    const b=core.find(b=>Math.abs(b.x-x)<.08&&Math.abs(b.z-z)<.08);
    if(b)mount(id,{...b,yaw:b.angle},b.d,side*b.w*.29,8.30,1.76,5.76,true,1.52,'核心区企业展位');
  }
  return sites;
}
