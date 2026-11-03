import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';import {join} from 'node:path';
const assets=JSON.parse(await readFile('dist/offline-assets.json','utf8'));
const expectedTop=['assets','css','data','index.html','js','offline-assets.json','sw.js'];
assert.deepEqual((await readdir('dist')).sort(),expectedTop.sort());
assert.deepEqual(await readdir('dist/data'),['fallback-tracks.json']);
const fallback=JSON.parse(await readFile('dist/data/fallback-tracks.json','utf8'));
assert.equal(fallback.tracks.length,208);
let bytes=0;for(const p of assets)if(p!=='./')bytes+=(await stat(join('dist',p))).size;
const html=await readFile('dist/index.html','utf8');assert.doesNotMatch(html,/8000|WAVEFORM_API_BASE/);
const sw=await readFile('dist/sw.js','utf8');assert.match(sw,/waveform-static-[0-9a-f]{16}/);
bytes+=(await stat('dist/sw.js')).size+(await stat('dist/offline-assets.json')).size;
let httpChecks=0;
if(process.argv[2]){
 const base=process.argv[2].replace(/\/$/,'');
 for(const p of assets){const r=await fetch(`${base}/${p==='./'?'':p}`);assert.equal(r.status,200,p);await r.arrayBuffer();httpChecks++;}
 const home=await fetch(base+'/');assert.match(home.headers.get('content-security-policy'),/connect-src 'self' https:\/\/musicbrainz.org/);
 for(const path of ['/.env','/data/waveform.db','/data/audio/test.mp3','/legacy/backend/app/main.py','/js/pages/artist-lab.js','/api/health']){assert.equal((await fetch(base+path)).status,404,path);httpChecks++;}
}
console.log(JSON.stringify({staticFiles:assets.length+1,precacheEntries:assets.length,bytes,fallbackTracks:fallback.tracks.length,privatePathsExposed:false,httpChecks}));
