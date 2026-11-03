export const transferLine=track=>`${track.artist} - ${track.title}`.replace(/[\r\n]+/g,' ');
export const trackList=tracks=>tracks.map(transferLine).join('\n');
const safeCell=value=>{const s=String(value??'');return /^[\t\r\n']/.test(s)||/^[\s]*[=+\-@]/.test(s)?"'"+s:s;};
export const csvCell=value=>'"'+safeCell(value).replace(/"/g,'""')+'"';
export const fileName=(title,format)=>`waveform-${String(title || 'playlist').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,70)||'playlist'}.${format}`;
export function exportText(playlist,format) {
  if(!Array.isArray(playlist.tracks))throw Error('Invalid playlist');
  if(format==='txt')return trackList(playlist.tracks)+'\n';
  if(format==='csv')return '\ufefftitle,artist,album,isrc,duration\r\n'+playlist.tracks.map(t=>[t.title,t.artist,t.album,t.isrc,t.durationMs?t.durationMs/1000:t.duration_seconds || null].map(csvCell).join(',')).join('\r\n')+(playlist.tracks.length?'\r\n':'');
  if(format==='json')return JSON.stringify({format:'waveform-playlist',version:2,playlist:{title:playlist.title,description:playlist.description || '',context:playlist.context || null,tracks:playlist.tracks}},null,2)+'\n';
  throw Error('Choose CSV, TXT or JSON.');
}
export function downloadPlaylist(playlist,format) {
  if(!playlist.tracks.length)throw Error('Add at least one track before exporting.');
  const content=exportText(playlist,format),types={csv:'text/csv',txt:'text/plain',json:'application/json'};
  const url=URL.createObjectURL(new Blob([content],{type:`${types[format]};charset=utf-8`}));
  const a=document.createElement('a');a.href=url;a.download=fileName(playlist.title,format);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  return {filename:fileName(playlist.title,format),content};
}
