import {coreOutline,coreRoutes,freightWell} from './nyc-future-core-layout.js';
import {createPlayableArea} from './nyc-regions.js';
import {lowerPassages} from './nyc-lower-passages.js';

// Compact, fictionalised Manhattan in metres. Map north is world -Z.
// Shapes are map/UI data; world.colliders and world.ground remain authoritative.
const rectangle = (minX, maxX, minZ, maxZ) => ({
  type: 'polygon', points: [[minX, minZ], [maxX, minZ], [maxX, maxZ], [minX, maxZ]],
});
const line = (...points) => ({ type: 'polyline', points });
const firstBatchBounds = { minX: -146, maxX: 44, minZ: -52, maxZ: 52 };
const coreShape = {type:'polygon',points:coreOutline};
const inNorthernCore = createPlayableArea(coreShape);
// The new district shares its southern seam with the existing exchange streets.
const currentOutline = { type: 'polygon', points: [
  ...coreOutline,[84,-110],[140,-110],[140,-62],[84,-62],[84,-52],[144,-52],[144,96],[84,96],
  [84,160],[-64,160],[-64,52],[-146,52],[-146,-52],[-64,-52],
] };
function boundsOf(points){
  const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
  return {minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)};
}
const currentBounds=boundsOf(currentOutline.points),futureBounds={...currentBounds};
const area=Math.abs(currentOutline.points.reduce((sum,[x,z],i,points)=>{
  const [nextX,nextZ]=points[(i+1)%points.length];return sum+x*nextZ-nextX*z;
},0))/2;

const regions = [
  {id:'east-school',name:'东衡中学',batchId:'school',status:'complete',layer:'ground',
    labelAt:[110,-70],shape:rectangle(84,140,-110,-62)},
  { id: 'core', name: '老城霓虹街', batchId: 'batch-1', status: 'baseline',
    layer: 'ground', labelAt: [0, 14], shape: rectangle(-44, 44, -52, 52) },
  { id: 'west-link', name: '西区仓储街', batchId: 'batch-1', status: 'complete',
    layer: 'ground', labelAt: [-78, 18], shape: rectangle(-110, -44, -52, 52) },
  { id: 'hudson', name: '哈德逊滨水', batchId: 'batch-1', status: 'complete',
    layer: 'ground', labelAt: [-128, 20], shape: rectangle(-146, -110, -52, 52) },
  { id: 'greenway', name: '高架绿廊', batchId: 'batch-1', status: 'complete',
    layer: 'elevated', elevation: 6.51, labelAt: [-82, -28.6],
    shape: rectangle(-135, 44, -30.7, -26.5) },
  { id: 'midtown', name: '下城区 · 旧交易所街', batchId: 'batch-2', status: 'complete',
    layer: 'ground', labelAt: [30, -133], shape: rectangle(-64, 84, -180, -52) },
  { id: 'soho', name: 'SoHo 市集与后巷', batchId: 'batch-3', status: 'complete',
    layer: 'ground', labelAt: [6, 113], shape: rectangle(-64, 84, 52, 160) },
  { id: 'east-park', name: '东部公园与城市环线', batchId: 'batch-4', status: 'complete',
    layer: 'ground', labelAt: [100, 45], shape: rectangle(44, 144, -52, 96) },
  { id:'future-core', name:'核心区', batchId:'batch-5', status:'complete',
    layer:'ground',labelAt:[55,-315],shape:coreShape },
];

const roads = [
  {id:'school-walk',name:'东衡中学校道',batchId:'school',status:'complete',kind:'promenade',width:4.8,shape:line([84,-86],[123,-86])},
  { id: 'core-avenue', name: '老城大道', batchId: 'batch-1', status: 'baseline',
    kind: 'avenue', width: 12.8, elevation: .18, shape: line([0, -52], [0, 52]) },
  { id: 'core-cross', name: '霓虹横街', batchId: 'batch-1', status: 'baseline',
    kind: 'street', width: 12.8, elevation: .18, shape: line([-44, 0], [44, 0]) },
  { id: 'west-cross', name: '滨水连接街', batchId: 'batch-1', status: 'complete',
    kind: 'street', width: 12, elevation: .18, shape: line([-132, 0], [-44, 0]) },
  { id: 'west-service-east', name: '仓储东服务街', batchId: 'batch-1', status: 'complete',
    kind: 'street', width: 6, elevation: .18, shape: line([-73, -52], [-73, 52]) },
  { id: 'west-service-west', name: '仓储西服务街', batchId: 'batch-1', status: 'complete',
    kind: 'street', width: 5.6, elevation: .18, shape: line([-100.5, -52], [-100.5, 52]) },
  { id: 'hudson-walk', name: '哈德逊步道', batchId: 'batch-1', status: 'complete',
    kind: 'promenade', width: 5, elevation: .36, shape: line([-132, -50], [-132, 50]) },
  { id: 'greenway-walk', name: '高架绿廊', batchId: 'batch-1', status: 'complete',
    kind: 'elevated-walk', width: 3.7, elevation: 6.51,
    shape: line([-135, -28.6], [44, -28.6]) },
  { id: 'midtown-avenue', name: '中城大道', batchId: 'batch-2', status: 'complete',
    kind: 'avenue', width: 12.8, elevation: .18, shape: line([0, -124], [0, -52]) },
  { id: 'midtown-cross-south', name: '中城南横街', batchId: 'batch-2', status: 'complete',
    kind: 'street', width: 11.2, elevation: .18, shape: line([-64, -86], [84, -86]) },
  { id: 'midtown-cross-north', name: '中城北横街', batchId: 'batch-2', status: 'complete',
    kind: 'street', width: 11.2, elevation: .18, shape: line([-64, -118], [84, -118]) },
  { id: 'midtown-side-west', name: '中城西侧街', batchId: 'batch-2', status: 'complete',
    kind: 'street', width: 9.6, elevation: .18, shape: line([-36, -180], [-36, -52]) },
  { id: 'midtown-side-east', name: '中城东侧街', batchId: 'batch-2', status: 'complete',
    kind: 'street', width: 9.6, elevation: .18, shape: line([58, -180], [58, -58.8]) },
  { id: 'midtown-loop-south', name: '中城南回路', batchId: 'batch-2', status: 'complete',
    kind: 'street', width: 10.4, elevation: .18, shape: line([-36, -64], [58, -64]) },
  { id: 'midtown-loop-north', name: '中城北环路', batchId: 'batch-2', status: 'complete',
    kind: 'street', width: 8, elevation: .18, shape: line([-36, -175], [58, -175]) },
  { id: 'soho-avenue', name: '市集大道', batchId: 'batch-3', status: 'complete',
    kind: 'avenue', width: 12.8, elevation: .18, shape: line([0,52],[0,160]) },
  { id: 'soho-side-west', name: 'SoHo 西服务街', batchId: 'batch-3', status: 'complete',
    kind: 'street', width: 8.8, elevation: .18, shape: line([-48,52],[-48,160]) },
  { id: 'soho-side-east', name: 'SoHo 东环街', batchId: 'batch-3', status: 'complete',
    kind: 'street', width: 9.6, elevation: .18, shape: line([58,96],[58,160]) },
  { id: 'soho-cross-market', name: '市集横街', batchId: 'batch-3', status: 'complete',
    kind: 'street', width: 10, elevation: .18, shape: line([-64,84],[44,84]) },
  { id: 'soho-cross-south', name: '格林横街', batchId: 'batch-3', status: 'complete',
    kind: 'street', width: 10, elevation: .18, shape: line([-64,128],[84,128]) },
  { id: 'soho-loop-south', name: '南部回路', batchId: 'batch-3', status: 'complete',
    kind: 'street', width: 8.8, elevation: .18, shape: line([-48,150],[58,150]) },
  { id: 'east-cross', name: '公园连接街', batchId: 'batch-4', status: 'complete',
    kind: 'street', width: 12, elevation: .18, shape: line([44,0],[144,0]) },
  { id: 'east-connector', name: '中城公园连接路', batchId: 'batch-4', status: 'complete',
    kind: 'street', width: 9.6, elevation: .18, shape: line([58,-58.8],[58,96]) },
  { id: 'east-loop', name: '公园东环路', batchId: 'batch-4', status: 'complete',
    kind: 'loop', width: 8.8, elevation: .18, shape: line([132,0],[132,84]) },
  { id: 'east-loop-north', name: '公园北环路', batchId: 'batch-4', status: 'complete',
    kind: 'loop', width: 8.8, elevation: .18, shape: line([58,12],[132,12]) },
  { id: 'east-cross-south', name: '公园市集连接街', batchId: 'batch-4', status: 'complete',
    kind: 'street', width: 10, elevation: .18, shape: line([44,84],[132,84]) },
  ...coreRoutes.map(({id,name,width,points})=>({id,name,width,batchId:'batch-5',
    status:'complete',kind:'street',elevation:.18,shape:line(...points)})),
];

const connections = [
  {id:'school-west-gate',name:'东衡中学西门',batchId:'school',status:'complete',kind:'street',regionIds:['midtown','east-school'],position:[84,.32,-86]},
  { id: 'core-west', name: '核心西口', batchId: 'batch-1', status: 'complete',
    kind: 'street', regionIds: ['core', 'west-link'], position: [-44, .18, 0] },
  { id: 'west-waterfront', name: '滨水街口', batchId: 'batch-1', status: 'complete',
    kind: 'street', regionIds: ['west-link', 'hudson'], position: [-110, .18, 0] },
  { id: 'greenway-core', name: '老城绿廊入口', batchId: 'batch-1', status: 'complete',
    kind: 'level-access', regionIds: ['core', 'greenway'], position: [-41, 6.51, -28.6] },
  { id: 'greenway-hudson', name: '滨水绿廊入口', batchId: 'batch-1', status: 'complete',
    kind: 'level-access', regionIds: ['hudson', 'greenway'], position: [-127, 6.51, -28.6] },
  { id: 'north-gate', name: '中城连接口', batchId: 'batch-2', status: 'complete',
    kind: 'street', regionIds: ['core', 'midtown'], position: [0, .18, -52] },
  { id: 'south-gate', name: '市集连接口', batchId: 'batch-3', status: 'complete',
    kind: 'street', regionIds: ['core', 'soho'], position: [0, .18, 52] },
  { id: 'east-gate', name: '公园连接口', batchId: 'batch-4', status: 'complete',
    kind: 'street', regionIds: ['core', 'east-park'], position: [44, .18, 0] },
  { id: 'east-south-loop', name: '南部环线连接口', batchId: 'batch-4', status: 'complete',
    kind: 'street', regionIds: ['soho', 'east-park'], position: [58, .18, 96] },
  { id: 'midtown-park', name: '中城东侧公园入口', batchId: 'batch-4', status: 'complete',
    kind: 'street', regionIds: ['midtown','east-park'], position: [58,.18,-58.8] },
  { id: 'exchange-core-east', name: '旧交易所北口', batchId: 'batch-5', status: 'complete',
    kind: 'street', regionIds: ['midtown','future-core'], position: [58,.18,-180] },
  { id: 'exchange-core-west', name: '旧交易所维修口', batchId: 'batch-5', status: 'complete',
    kind: 'street', regionIds: ['midtown','future-core'], position: [-36,.18,-180] },
];

const boundaries = [
  { id: 'current-limit', name: '当前街区边界', scope: 'current', status: 'complete',
    kind: 'world-limit', blocksMovement: true, shape: currentOutline },
  { id: 'river-edge', name: '滨水护栏', scope: 'current', status: 'complete',
    kind: 'water-edge', layer: 'ground', blocksMovement: true,
    shape: line([-138.05, -52], [-138.05, -5.1]) },
  { id: 'river-edge-south', name: '滨水护栏', scope: 'current', status: 'complete',
    kind: 'water-edge', layer: 'ground', blocksMovement: true,
    shape: line([-138.05, 5.1], [-138.05, 52]) },
  { id: 'west-north-frontier', name: '仓储街北侧边界', scope: 'current', status: 'complete',
    kind: 'closed-frontier', blocksMovement: true,
    shape: line([-146, -52], [-64, -52]) },
  { id: 'north-frontier', name: '旧交易所与核心区接缝', scope: 'current', status: 'complete',
    kind: 'district-connection', blocksMovement: false,
    shape: line([-64, -180], [84, -180]) },
  { id: 'midtown-west-frontier', name: '中城西侧施工边界', scope: 'current', status: 'complete',
    kind: 'closed-frontier', blocksMovement: true,
    shape: line([-64, -180], [-64, -52]) },
  { id: 'midtown-east-frontier', name: '中城东侧施工边界', scope: 'current', status: 'complete',
    kind: 'closed-frontier', blocksMovement: true,
    shape: line([84,-180],[84,-110],[140,-110],[140,-62],[84,-62],[84,-52]) },
  { id: 'south-frontier', name: '老城市集接缝', scope: 'current', status: 'complete',
    kind: 'district-connection', blocksMovement: false,
    shape: line([-44,52],[44,52]) },
  { id: 'east-frontier', name: '老城公园接缝', scope: 'current', status: 'complete',
    kind: 'district-connection', blocksMovement: false,
    shape: line([44, -52], [44, 52]) },
  { id:'soho-outer',name:'南部城市边界',scope:'current',status: 'complete',kind:'closed-frontier',blocksMovement:true,
    shape:line([-64,52],[-64,160],[84,160],[84,96],[144,96],[144,-52],[84,-52]) },
  { id: 'future-outline', name: '整图轮廓', scope: 'full', status: 'complete',
    kind: 'world-limit', blocksMovement: true, shape: currentOutline },
];

export const mapPlan = {
  version: 4,
  title: '纽约 · 雨后霓虹',
  adaptation: '压缩改编曼哈顿，不按真实城市 1:1 复刻',
  coordinateSystem: { units: 'metres', north: '-Z', east: '+X', mapDown: '+Z' },
  currentBatchId: 'batch-5',
  currentArea: area,
  currentBounds, currentOutline, futureBounds,
  spawn: [0, .18, 22],
  regions, roads, passages:lowerPassages, connections, boundaries,
  features: [
    {id:'school-court',name:'东衡中学球场',fill:'#527b70',shape:rectangle(110.2,135.8,-102,-70)},
    { id: 'riverwalk-paving', name: '滨水步道', fill: '#657d78', shape: rectangle(-138, -128, -52, 52) },
    { id: 'hudson-pier', name: '哈德逊码头', fill: '#849183', shape: rectangle(-145.9, -136.9, -4.75, 4.75) },
    { id: 'street-garden', name: '街心花园', fill: '#3e6a58', shape: rectangle(32, 44, 11, 50) },
    { id: 'warehouse-garden', name: '仓储街公园', fill: '#345d51', shape: rectangle(-127.5, -67.36, 32, 50.2) },
    { id: 'produce-return-yard', name: '倒筐合作社', fill: '#676d62', shape: rectangle(-67.36,-46.3,31.68,52) },
    { id: 'midtown-plaza', name: '旧交易所夜市', fill: '#566d70', shape: rectangle(-20, 28, -145, -121) },
    { id:'core-freight-well',name:'下沉货运街',fill:'#1c2a35',
      shape:rectangle(freightWell.minX,freightWell.maxX,freightWell.minZ,freightWell.maxZ) },
  ],
  // Physical fence mouths only. The outline above handles the concave perimeter.
  // Old x=0,z=-50.9 is deliberately absent: that avenue now leads into Midtown.
  frontierExits: [
    ...[-50.9, 50.9].flatMap(z => [[-73, 10.2], [-100.5, 8.8], [-133, 10.3]].map(([x, width]) => ({
      id: `west-${x}-${z}`, position: [x, z], width, rotation: z < 0 ? 0 : Math.PI,
    }))),
    { id: 'midtown-west-south', position: [-62.9, -86], width: 18.4, rotation: Math.PI/2, title: 'WEST LINK', subtitle: 'WORK ZONE' },
    { id: 'midtown-west-north', position: [-62.9, -118], width: 18.4, rotation: Math.PI/2 },
    { id: 'midtown-east-north', position: [82.9, -118], width: 18.4, rotation: -Math.PI/2 },
    ...[-48,0,58].map(x=>({id:'soho-south-'+x,position:[x,158.9],width:x===0?21.4:15.8,rotation:Math.PI,title:x===0?'DOWNTOWN / CITY EDGE':'',subtitle:'CITY MAINTENANCE'})),
    ...[84,128].map(z=>({id:'soho-west-'+z,position:[-62.9,z],width:17,rotation:Math.PI/2,title:z===84?'WEST WORKS':'',subtitle:'CITY EDGE'})),
    {id:'soho-east',position:[82.9,128],width:17,rotation:-Math.PI/2,title:'EAST WORKS',subtitle:'CITY EDGE'},
    {id:'park-east',position:[142.9,0],width:20,rotation:-Math.PI/2,title:'EAST TRANSIT',subtitle:'CITY EDGE'},
  ],
  water: [{ id: 'hudson-water', name: '哈德逊河',
    shape: rectangle(-146, -138.05, -52, -5.1) },
    { id: 'hudson-water-south', name: '哈德逊河',
      shape: rectangle(-146, -138.05, 5.1, 52) }],
  anchors: [{ id: 'art-deco-tower', name: '中城地标塔', batchId: 'batch-2',
    status: 'complete', position: [-8, .36, -157] },
    { id: 'greenway', name: '街心花园', batchId: 'batch-1',
      status: 'complete', layer: 'ground', position: [35.1, .36, 23] }],
  batches: [
    {id:'school',name:'东衡中学',status:'complete',bounds:{minX:84,maxX:140,minZ:-110,maxZ:-62},regions:['east-school'],roads:['school-walk'],connections:['school-west-gate'],boundaries:['midtown-east-frontier']},
    { id: 'batch-1', name: '老城核心、哈德逊滨水与高架绿廊', status: 'complete',
      bounds: firstBatchBounds, regions: ['core', 'west-link', 'hudson', 'greenway'],
      roads: ['core-avenue', 'core-cross', 'west-cross', 'west-service-east', 'west-service-west', 'hudson-walk', 'greenway-walk'],
      connections: ['core-west', 'west-waterfront', 'greenway-core', 'greenway-hudson'],
      boundaries: ['river-edge', 'river-edge-south', 'west-north-frontier', 'south-frontier', 'east-frontier'] },
    { id: 'batch-2', name: '北部中城与企业塔群', status: 'complete',
      bounds: { minX: -64, maxX: 84, minZ: -180, maxZ: -52 }, regions: ['midtown'],
      roads: ['midtown-avenue', 'midtown-cross-south', 'midtown-cross-north', 'midtown-side-west', 'midtown-side-east', 'midtown-loop-south', 'midtown-loop-north'],
      connections: ['north-gate'], boundaries: ['current-limit', 'north-frontier', 'midtown-west-frontier', 'midtown-east-frontier'] },
    { id: 'batch-3', name: '南部 SoHo 市集与后巷', status: 'complete',
      bounds: { minX: -64, maxX: 84, minZ: 52, maxZ: 160 }, regions: ['soho'],
      roads: ['soho-avenue','soho-side-west','soho-side-east','soho-cross-market','soho-cross-south','soho-loop-south'], connections: ['south-gate'], boundaries: ['soho-outer'] },
    { id: 'batch-4', name: '东部公园与城市环线', status: 'complete',
      bounds: { minX: 44, maxX: 144, minZ: -52, maxZ: 96 }, regions: ['east-park'],
      roads: ['east-cross','east-connector','east-loop','east-loop-north','east-cross-south'], connections: ['east-gate','east-south-loop','midtown-park'],
      boundaries: ['soho-outer'] },
    { id:'batch-5',name:'北部核心区',status:'complete',bounds:boundsOf(coreOutline),
      regions:['future-core'],roads:coreRoutes.map(r=>r.id),
      connections:['exchange-core-east','exchange-core-west'],boundaries:['current-limit'] },
  ],
  legend: { baseline: '现有街区', complete: '已开放街区', implementing: '本轮建设', planned: '后续区域' },
};

/** User-facing name only. Planned districts are named, never marked complete. */
export function getDistrict(x, z, y = 0) {
  if (![x, z, y].every(Number.isFinite)) return '城市边界';
  if(x>84&&x<=140&&z>=-110&&z<=-62)return '下城区 · 东衡中学';
  if (y >= 5.7 && y <= 9 && x >= -135 && x <= 44 && z >= -30.9 && z <= -26.3) return '高架绿廊';
  if (x >= -146 && x < -110 && z >= -52 && z <= 52) return '哈德逊滨水';
  if (x >= -110 && x < -44 && z >= -52 && z <= 52) return '西区 · 仓储街';
  if (x >= -44 && x <= 44 && z >= -52 && z <= 52) {
    if (z > 10) return '南侧 · 老城大道';
    if (x > 12) return '东侧 · 绿廊街口';
    if (x < -12) return '西侧 · 霓虹商街';
    return '中央 · 地铁街角';
  }
  if (x >= -64 && x <= 84 && z >= -180 && z < -52) return '下城区 · 旧交易所街';
  if (z < -180 && inNorthernCore(x,z)) return '核心区';
  if (x >= 44 && x <= 144 && z >= -52 && z <= 96) return '东侧 · 城市公园';
  if (x >= -64 && x <= 84 && z > 52 && z <= 160) return '南部 · SoHo 市集';
  return '城市边界';
}

/**
 * Normalized [u,v], north at v=0. Default=current batch; 'full'=future overview.
 * Points outside the chosen envelope clamp to its edge, never wrap around.
 */
export function getMapPoint(x, z, scope = 'current') {
  const bounds = scope === 'full' ? futureBounds : currentBounds;
  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  const safeX = Number.isFinite(x) ? x : bounds.minX;
  const safeZ = Number.isFinite(z) ? z : bounds.minZ;
  return [clamp01((safeX - bounds.minX) / (bounds.maxX - bounds.minX)),
    clamp01((safeZ - bounds.minZ) / (bounds.maxZ - bounds.minZ))];
}


