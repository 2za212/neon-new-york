// Ordered edges connect to the existing city outline. All coordinates are world metres.
export const freightEdge=[[-125,-52],[-120,-69],[-111,-86],[-91,-104],[-77,-109],[-64,-109]];
export const clothEdge=[[-64,116],[-78,110],[-90,100],[-104,94],[-117,77],[-124,64],[-124,52]];
export const schoolEdge=[[140,-62],[137,-55],[131,-52]];
export const lowerBlocks=[
  {id:'weigh-house',name:'西仓 · 过磅里',points:[...freightEdge,[-64,-52]],labelAt:[-91,-77]},
  {id:'cloth-yard',name:'苏荷 · 染织里',points:[...clothEdge,[-64,52]],labelAt:[-89,69]},
  {id:'school-row',name:'东衡南门街',points:[[84,-62],...schoolEdge,[84,-52]],labelAt:[105,-56]},
];
export const lowerLanes=[
  ['weigh-road','旧货运支线',5.6,[[-100.5,-52],[-100.5,-59],[-95,-69],[-85,-77],[-75,-86],[-64,-86]]],
  ['weigh-cut','交班巷',3.2,[[-73,-52],[-73,-59],[-82,-66],[-85,-77]]],
  ['cloth-road','染织街',4.8,[[-100.5,52],[-100.5,59],[-94,69],[-82,75],[-76,84],[-64,84]]],
  ['cloth-cut','裁衣里巷',3.2,[[-73,52],[-73,59],[-78,65],[-82,75]]],
  ['bell-road','南门放学路',3.6,[[84,-58],[96,-56],[105,-55],[115,-56],[127,-55],[131,-52]]],
  ['bell-cut','观测场南门',3.4,[[115,-72],[115,-62],[115,-56],[118,-52],[118,-48]]],
].map(([id,name,width,points])=>({id,name,width,shape:{type:'polyline',points},status:'complete',kind:'promenade',elevation:.18,batchId:'lower-blocks'}));


export const exchangeLane={id:'exchange-school-lane',name:'横班街',width:4.0,elevation:.18,
  batchId:'batch-2',status:'complete',kind:'promenade',shape:{type:'polyline',
    points:[[0,-64],[9,-64],[19,-67],[29,-67],[40,-62],[50,-62],[58,-64]]}};

// Each entry owns its site, street face, height, use and tenant. Width follows the street.
export const premises=[
  ['west-ice','冰票冷库','夜班制冰 / 散冰装运','freight',-107.61,-63.19,61.19,10,8,3],
  ['scale','联运磅房','进仓复秤 / 运单核签','freight',-99.96,-75.60,38.66,10,8,2],
  ['bunk','搬运工宿舍','轮班床位 / 公用洗衣台','home',-90.50,-60.06,-118.81,10,8,6],
  ['mess','交班食堂','凌晨四点开锅','food',-73.21,-68.10,-37.87,10,8,2],
  ['union','西仓工友楼','值班室 / 合住单间','home',-81.56,-57.36,142.13,8,7,4],
  ['gloves','劳保缝补铺','手套翻新 / 工装织补','mill',-67.45,-57.75,-90,6,5,2],
  ['warrant','运单票号','现结 / 运费垫付','office',-67.05,-92.50,0,5,4.5,4],
  ['repair','秤具校准所','传感器检定','office',-67.05,-79.50,180,5,4.5,2],
  ['dye','蓝靛染坊','湿布漂染 / 热汽回收','mill',-106.95,63.49,123.02,10,8,3],
  ['cut','联合裁床','夜间打版 / 成衣裁剪','mill',-97.29,76.13,153.43,10,8,4],
  ['workers','梭子里公寓','底层公洗 / 楼上长租','home',-84.64,62.61,68.20,10,8,6],
  ['canteen','裁工饭铺','换班热饭 / 送餐窗口','food',-70.56,67.09,-129.81,10,8,2],
  ['loom','梭机维修社','电梭绕线 / 备件收发','freight',-86.15,82.03,123.69,8,7,3],
  ['cloth','布票行','余布收购 / 样本寄存','office',-70.25,90.35,180,6,5,3],
  ['dorm','学徒楼','短租床位 / 上楼登记','home',-92.64,59.44,-56.98,6,5,5],
  ['bobbins','线轴联营社','色号核对 / 零剪配线','mill',-67.45,56.65,-90,6,5,3],
  ['stitch','织补窗口','校服 / 工装','mill',-78.30,55.55,90,5,4.5,2],
  ['copy','南门印务','讲义装订 / 实验图纸','mill',101,-59.62,2,9,4,2],
  ['infirmary','校医门诊','夜诊 / 健康观测','clinic',109,-59.68,0,5.6,3.8,3],
  ['noodles','晚自习面馆','家长等候 / 夜宵','food',122,-59.55,-3,8.4,4,2],
  ['sensors','物理社器材行','线圈绕制 / 仪表借还','office',131,-59.68,3,7.4,3.5,2],
  ['clinic','横班街诊所','社区夜诊 / 药品冷柜','clinic',19,-60.6,180,11,5,3],
  ['canteen-east','学工厨房','送餐档口 / 凌晨备菜','food',42,-68,0,8,4.8,2],
  ['ticket-desk','靠泊票务所','靠泊结算 / 夜班调度','office',-120,41,0,6.6,4.8,3],
  ['galley','船员伙房','保温餐箱 / 夜航外送','food',-108.2,41.15,180,7,4.8,2],
  ['cold-parts','冷机配件仓','压缩机件 / 检修领料','freight',-92.5,40.9,177,7,4.8,3],
  ['deckhouse','码头轮班楼','班组住宿 / 公共盥洗间','home',-80.6,41.15,0,6.4,4.8,5],
  ['repair-home','旧街修表楼','楼下校时 / 楼上合住','office',-38,40,90,6,5,4],
  ['park-workshop','东园园务站','湿地养护 / 栈道巡修','freight',68.8,48.8,-90,6.2,4.8,2],
  ['cloth-vault','布样资料楼','样卡存档 / 裁工借阅','office',43.2,95,-90,6.8,5.6,4],
  ['school-home','教工值班楼','临街值班室 / 教师轮休','home',68,-74,-90,6.4,5.6,5],
  ['roster','换班公寓','短租单间 / 白夜轮值','home',-53,-166,90,9,7,5],
].map(([id,name,service,use,x,z,degrees,width,depth,floors])=>({id,name,service,use,x,z,
  yaw:degrees*Math.PI/180,width,depth,floors}));
export const useColor={freight:'#768b9b',home:'#bc9282',mill:'#a18aaf',office:'#84a6aa',food:'#c9a46b',clinic:'#80a995'};
export function lotPoint(site,u,v){
  const c=Math.cos(site.yaw),s=Math.sin(site.yaw);
  return [site.x+c*u+s*v,site.z-s*u+c*v];
}
export const premiseFeatures=premises.map(p=>({id:p.id,name:p.name,service:p.service,fill:useColor[p.use],
  shape:{type:'polygon',points:[[-1,-1],[-1,1],[1,1],[1,-1]].map(([u,v])=>lotPoint(p,u*p.width/2,v*p.depth/2))}}));
