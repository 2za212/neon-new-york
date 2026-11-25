const {build}=require('esbuild');
const fs=require('node:fs');
const path=require('node:path');
// The previous dense-voxel study is retained in public/ and build-legacy.cjs.
async function main(){
  const output=path.join(__dirname,'dist');fs.mkdirSync(output,{recursive:true});
  const ueIdle=fs.existsSync(path.join(__dirname,'character-motion','ue-voxel','idle.glb'));
  const result=await build({entryPoints:[path.join(__dirname,'nyc-game.js')],bundle:true,minify:true,format:'esm',target:'es2022',define:{__NYC_HAS_UE_IDLE__:String(ueIdle)},outfile:path.join(output,'nyc-game.js'),metafile:true});
  fs.mkdirSync(path.join(__dirname,'.game-builder'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'.game-builder','nyc-build-meta.json'),JSON.stringify(result.metafile,null,2));
  for(const file of ['index.html','mobile-preview.html','nyc.css','nyc-map.css','nyc-roam.css','nyc-interface.css'])fs.copyFileSync(path.join(__dirname,file),path.join(output,file));
  fs.copyFileSync(path.join(__dirname,'character-motion','explorer-palm.glb'),path.join(output,'explorer-palm.glb'));
  fs.copyFileSync(path.join(__dirname,'blender','relay-home.glb'),path.join(output,'relay-home.glb'));
  fs.mkdirSync(path.join(output,'combat-skills'),{recursive:true});
  fs.copyFileSync(path.join(__dirname,'combat-skills','sword-preview.glb'),path.join(output,'combat-skills','sword-preview.glb'));
  const clips = [
    'idle', 'walk', 'run', 'jump', 'attack', 'punch', 'charged-punch',
    'dodge-forward', 'dodge-left', 'dodge-right', 'dodge-back',
    'hurt', 'death', 'skill-1', 'skill-2', 'skill-3',
    'meditate-enter', 'meditate-rise', 'meditate-idle',
  ];
  for(const clip of clips){
    const file = `${clip}.glb`;
    const source = path.join(__dirname,'character-motion','ue-voxel',file);
    const target = path.join(output,'ue-voxel',file);
    if(fs.existsSync(source)){
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.copyFileSync(source,target);
    }else fs.rmSync(target,{force:true});
  }
  fs.cpSync(path.join(__dirname,'city-surfaces'),path.join(output,'city-surfaces'),{recursive:true});
  for(const name of ['station.glb','station-near.glb']){
    const file=path.join(output,'city-surfaces','fulton',name);
    fs.writeFileSync(file+'.gz',require('node:zlib').gzipSync(fs.readFileSync(file),{level:9}));
  }
  console.log('NYC third-person map built in dist/');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
