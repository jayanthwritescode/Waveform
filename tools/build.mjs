import {mkdir,cp,rm,readFile,readdir,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
await import('./offline-manifest.mjs');
const root=resolve('dist');
// dist is generated output only; never remove source/user directories.
if(root!==resolve(process.cwd(),'dist'))throw Error('Invalid build output');
await rm(root,{recursive:true,force:true});await mkdir(root,{recursive:true});
for(const name of ['index.html','sw.js','offline-assets.json','manifest.webmanifest'])await cp(join('frontend',name),join(root,name));
for(const dir of ['js','css','assets'])await cp(join('frontend',dir),join(root,dir),{recursive:true});
await mkdir(join(root,'data'));await cp('frontend/data/fallback-tracks.json',join(root,'data/fallback-tracks.json'));
const assets=JSON.parse(await readFile(join(root,'offline-assets.json'),'utf8'));
const hash=createHash('sha256');let size=0;
for(const asset of assets){if(asset==='./')continue;const file=join(root,asset);const body=await readFile(file);hash.update(asset);hash.update(body);size+=body.length;}
hash.update(await readFile('frontend/sw.js'));
const version=hash.digest('hex').slice(0,16);
const sw=(await readFile(join(root,'sw.js'),'utf8')).replace('waveform-static-2026-11-03-v1',`waveform-static-${version}`);
await writeFile(join(root,'sw.js'),sw);
size+=(await stat(join(root,'sw.js'))).size+(await stat(join(root,'offline-assets.json'))).size;
console.log(JSON.stringify({output:'dist',files:assets.length+1,precacheEntries:assets.length,bytes:size,cacheVersion:version,dependencies:0,functions:0}));
