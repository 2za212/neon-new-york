const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const lib=path.resolve(__dirname,'../node_modules/three');
http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
const p=url==='/'?path.join(__dirname,'jian.html'):url==='/explorer.glb'?path.join(__dirname,'explorer-jian.glb'):url.startsWith('/lib/')?path.resolve(lib,url.slice(5)):null;
if(!p||url.startsWith('/lib/')&&!p.startsWith(lib+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end();}
res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html; charset=utf-8':'model/gltf-binary');fs.createReadStream(p).pipe(res);}).listen(48816,'127.0.0.1');

