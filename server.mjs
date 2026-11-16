import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.POTATO_PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.wav':'audio/wav','.png':'image/png','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
  try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
    const relative=pathname==='/'?'index.html':pathname.slice(1),file=path.resolve(root,relative),rel=path.relative(root,file);
    if(rel.startsWith('..')||path.isAbsolute(rel)||relative.split(/[\\/]/).some(p=>p.startsWith('.'))){res.writeHead(403);res.end();return;}
    if(!(await stat(file)).isFile()){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Potato Simulator: http://127.0.0.1:${port}`));
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?`Port ${port} is in use. Set POTATO_PORT to another port.`:err.message);process.exitCode=1;});
