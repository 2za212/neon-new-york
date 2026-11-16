const {build}=require('esbuild');
const fs=require('node:fs');
const path=require('node:path');
// The previous dense-voxel study is retained in public/ and build-legacy.cjs.
async function main(){
  const output=path.join(__dirname,'dist');fs.mkdirSync(output,{recursive:true});
  const result=await build({entryPoints:[path.join(__dirname,'nyc-game.js')],bundle:true,minify:true,format:'esm',target:'es2022',outfile:path.join(output,'nyc-game.js'),metafile:true});
  fs.mkdirSync(path.join(__dirname,'.game-builder'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'.game-builder','nyc-build-meta.json'),JSON.stringify(result.metafile,null,2));
  for(const file of ['index.html','mobile-preview.html','nyc.css','nyc-map.css','nyc-roam.css'])fs.copyFileSync(path.join(__dirname,file),path.join(output,file));
  fs.copyFileSync(path.join(__dirname,'character-motion','explorer-palm.glb'),path.join(output,'explorer-palm.glb'));
  fs.copyFileSync(path.join(__dirname,'blender','relay-home.glb'),path.join(output,'relay-home.glb'));
  fs.cpSync(path.join(__dirname,'city-surfaces'),path.join(output,'city-surfaces'),{recursive:true});
  console.log('NYC third-person map built in dist/');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
