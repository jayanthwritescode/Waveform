import {normalizeTrack,deduplicate} from '../api/metadata.js';
import {hash} from '../recommender/ranking.js';
export function parseCSV(text) {
  const rows=[];let row=[],cell='',quoted=false,afterQuote=false;
  text=text.replace(/^\ufeff/,'');
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;afterQuote=true;}}else cell+=c;continue;}
    if(afterQuote && ![',','\r','\n'].includes(c))throw Error('Unexpected text after a quoted CSV field.');
    if(c==='"'){if(cell)throw Error('A CSV quote must start a field.');quoted=true;}
    else if(c===','){row.push(cell);cell='';afterQuote=false;}
    else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x!==''))rows.push(row);row=[];cell='';afterQuote=false;}
    else cell+=c;
  }
  if(quoted)throw Error('CSV has an unterminated quoted field.');
  if(cell || row.length || afterQuote){row.push(cell);if(row.some(x=>x!==''))rows.push(row);}
  return rows;
}
export function importText(content,format) {
  if(new TextEncoder().encode(content).length>1_000_000)throw Error('Import limit is 1 MB.');
  if(!content.trim())throw Error('The playlist file is empty.');
  let playlist={title:'Imported playlist',description:'',tracks:[]},warnings=[];
  if(format==='json') {
    const data=JSON.parse(content.replace(/^\ufeff/,''));
    if(data?.format!=='waveform-playlist'||![1,2].includes(data.version)||!data.playlist||!Array.isArray(data.playlist.tracks))throw Error('Choose a Waveform playlist JSON v1 or v2 file.');
    playlist=data.playlist;
    // Older source IDs can be retained without invoking the removed backend.
    playlist.tracks=playlist.tracks.map(t=>({...t,id:t.id || t.catalogue_id || `import:${hash(JSON.stringify([t.title,t.artist,t.album,t.isrc]))}`,genres:t.genres || (t.genre?[t.genre]:[]),source:t.source || t.dataset_source || 'import',sourceId:t.sourceId || t.source_identifier || t.id}));
  } else if(format==='csv') {
    const rows=parseCSV(content),headers=rows.shift()?.map(x=>x.trim().toLowerCase());
    if(!headers || new Set(headers).size!==headers.length)throw Error('CSV has missing or duplicate column headers.');
    const titleColumn=headers.indexOf('title')>=0?'title':'track title';
    if(!headers.includes(titleColumn)||!headers.includes('artist'))throw Error('CSV requires title and artist columns.');
    playlist.tracks=rows.map(row=>{if(row.length!==headers.length)throw Error('CSV row length does not match its headers.');const r=Object.fromEntries(headers.map((h,i)=>[h,row[i]]));
      const title=r[titleColumn],artist=r.artist;
      if(!title.trim() || !artist.trim())throw Error('Every CSV track needs a title and artist.');
      const seconds=r.duration || r['duration seconds'];if(seconds && (!Number.isFinite(Number(seconds))||Number(seconds)<=0))throw Error('Duration must be positive seconds or empty.');
      return {id:`import:${hash(JSON.stringify([title,artist,r.album,r.isrc]))}`,title,artist,album:r.album || null,isrc:r.isrc || null,durationMs:seconds?Number(seconds)*1000:null,genres:[],source:'import',availability:'imported'};
    });
    warnings.push('CSV retains portable fields only. Spreadsheet-protection apostrophes are preserved; JSON retains exact original metadata and stable IDs.');
  } else if(format==='txt') {
    playlist.tracks=content.replace(/^\ufeff/,'').split(/\r?\n/).filter(x=>x.trim()).map(line=>{const split=line.indexOf(' - ');if(split<=0 || !line.slice(split+3).trim())throw Error('TXT needs one Artist - Track Title entry per line.');const artist=line.slice(0,split),title=line.slice(split+3);return {id:`import:${hash(JSON.stringify([title,artist]))}`,title,artist,genres:[],source:'import',availability:'imported'};});
    warnings.push('TXT contains artist/title only. A spaced hyphen inside an artist name is ambiguous; use CSV or JSON for exact recovery.');
  } else throw Error('Choose CSV, TXT or JSON.');
  if(playlist.tracks.length>500)throw Error('Import supports up to 500 tracks.');
  if(!playlist.tracks.length)throw Error('The file contains no tracks.');
  if(playlist.tracks.some(t=>!normalizeTrack(t)))throw Error('Some tracks are missing valid titles or IDs.');
  const normalized=deduplicate(playlist.tracks);
  if(normalized.length<playlist.tracks.length)warnings.push('Duplicate stable identities were removed.');
  return {playlist:{title:String(playlist.title || 'Imported playlist').slice(0,80),description:String(playlist.description || '').slice(0,500),context:playlist.context || null,tracks:normalized},warnings};
}
