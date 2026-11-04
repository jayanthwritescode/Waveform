import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.argv.includes('--dist')?'dist':'frontend');
const port=Number(process.env.PORT || 5173);
const production=process.argv.includes('--dist');
const config=production?JSON.parse(await readFile('vercel.json','utf8')):null;
const policy=Object.fromEntries((config?.headers[0].headers || []).map(h=>[h.key,h.value]));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
 try {const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+sep))throw Error('Outside root');if(!(await stat(file)).isFile())throw Error('Not a file');const content=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)] || 'application/octet-stream','X-Content-Type-Options':'nosniff',...policy,'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);}
 catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Waveform: http://127.0.0.1:${port}`));
