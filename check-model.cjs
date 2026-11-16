const fs=require('node:fs'),{buildSync}=require('esbuild');
const bundle=buildSync({entryPoints:['model-kit.js'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const mod={exports:{}};
const read=async name=>{const b=fs.readFileSync('public/'+name);return {json:()=>JSON.parse(b),arrayBuffer:()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};};
new Function('module','exports','fetch',bundle)(mod,mod.exports,read);
(async()=>{
 const scene={add:()=>{},userData:{}};
 const model=await mod.exports.loadVoxelModel(scene);
 let foot=model.ground(14.2,17,1),rises=0;
 for(let z=17;z>=-1;z-=.1){
  if(!model.canMove(14.2,z,foot))throw Error('Blocked at '+z.toFixed(2)+', foot '+foot);
  const next=model.ground(14.2,z,foot+.56);
  if(next>foot)rises++;
  if(next-foot>.56)throw Error('High step');
  foot=next;
 }
 if(foot<8.8)throw Error('Did not reach platform '+foot);
 console.log('Voxel staircase passed',rises,'steps; platform height',foot);
 console.log(scene.userData.model);
})().catch(e=>{console.error(e);process.exitCode=1;});
