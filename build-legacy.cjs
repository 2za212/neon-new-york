const {build}=require('esbuild');
require('./bake-voxels.cjs');
require('./bake-dense-city.cjs');
build({entryPoints:['viewer.js'],bundle:true,minify:true,outfile:'public/scene.js'}).catch(e=>{console.error(e);process.exitCode=1;});
