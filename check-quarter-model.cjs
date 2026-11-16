const fs=require('node:fs'),crypto=require('node:crypto'),{buildSync}=require('esbuild');
const sourceFiles=['towers.js','blocks.js','streets.js','scale-figures.js','urban-layer.js'];
const actualHash=crypto.createHash('sha256').update(sourceFiles.map(f=>fs.readFileSync(f)).join('\n')).digest('hex');
// The front housing is now authored independently on a denser grid.
const meta=JSON.parse(fs.readFileSync('public/voxel-model.json'));
if(meta.step!==.25)throw Error('Quarter metre grid not ready');
const expectedMin=[-87.2,-1.975,-73.3],expectedMax=[87.2,93.6,71.3];
for(let a=0;a<3;a++)for(const [actual,expected] of [[meta.sourceBounds.min[a],expectedMin[a]],[meta.sourceBounds.max[a],expectedMax[a]]])if(Math.abs(actual-expected)>1e-9)throw Error('Source dimensions changed');
const bundled=buildSync({stdin:{contents:"export {voxelPhysics} from './voxel-physics.js';export {denseVoxelPhysics} from './dense-voxel-physics.js';",resolveDir:__dirname},bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const mod={exports:{}};new Function('module','exports',bundled)(mod,mod.exports);
const bytes=fs.readFileSync('public/'+meta.collision.file);
const base=mod.exports.voxelPhysics(meta,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const denseMeta=JSON.parse(fs.readFileSync('public/dense-model.json'));
const denseBytes=fs.readFileSync('public/dense-collision.bin');
const model=mod.exports.denseVoxelPhysics(denseMeta,denseBytes.buffer.slice(denseBytes.byteOffset,denseBytes.byteOffset+denseBytes.byteLength),base);
function route(label,x0,z0,x1,z1,startCeiling){
 const distance=Math.hypot(x1-x0,z1-z0),n=Math.ceil(distance/.075);
 let foot=model.ground(x0,z0,startCeiling),largestRise=0;
 for(let i=1;i<=n;i++){
  const t=i/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;
  if(!model.canMove(x,z,foot))throw Error(label+' blocked at '+JSON.stringify({x,z,foot}));
  const next=model.ground(x,z,foot+.56);largestRise=Math.max(largestRise,next-foot);
  if(next-foot>.560001)throw Error(label+' high step');
  foot=next;
 }
 return {label,metres:distance,largestRise,finalHeight:foot};
}
const routes=[
 route('street',1,56,1,34,1),
 route('crossing',-16,23.5,16,23.5,1),
 route('stair-up',14.2,17,14.2,-1,1),
 route('rail-walk',6,-.04,18.4,-.04,9.6),
 route('stair-down',14.2,-1,14.2,17,9.6),
 route('micro-street-corner',-21,54,-24,54,1),
 route('left-underpass',-40.125,41.5,-40.125,36.5,1),
 route('right-underpass',40.375,41.5,40.375,36.5,1)
];
if(routes[2].finalHeight<8.8)throw Error('Stair misses rail level');
if(routes[4].finalHeight>.75)throw Error('Stair does not descend to ground');
console.log(JSON.stringify({sourceHash:actualHash,sourceBounds:meta.sourceBounds,step:meta.step,routes},null,2));

