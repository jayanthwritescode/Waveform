import {readdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';
const files=['./','index.html'];
async function walk(directory){for(const entry of await readdir(join('frontend',directory),{withFileTypes:true})){const path=join(directory,entry.name);if(entry.isDirectory())await walk(path);else if(/\.(?:js|css|svg|json)$/.test(path))files.push(path);}}
for(const dir of ['js','css','assets','data'])await walk(dir);
await writeFile('frontend/offline-assets.json',JSON.stringify([...new Set(files)].sort(),null,2)+'\n');
console.log(`Offline shell: ${files.length} assets`);
