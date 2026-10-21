import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2);const port=Number(args[args.indexOf('--port')+1])||4173;
const root=path.resolve('dist');
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.ttf':'font/ttf','.txt':'text/plain;charset=utf-8'};
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://preview').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep))throw Error();const content=await readFile(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'0.0.0.0',()=>console.log('Preview ready on '+port));
