import {validWorkspace} from './storage.js';
import {normalizeTrack} from '../api/metadata.js';
export const BACKUP_LIMIT=5_000_000;
export function createBackup(state,draft) {
  if(!validWorkspace(state))throw Error('Your library could not be backed up. Reload and try again.');
  const text=JSON.stringify({format:'waveform-library',version:1,exportedAt:new Date().toISOString(),state,draft})+'\n';
  if(new TextEncoder().encode(text).length>BACKUP_LIMIT)throw Error('This library exceeds the 5 MB backup limit. Export individual playlists from your library instead.');
  return text;
}
export function parseBackup(text) {
  if(new TextEncoder().encode(text).length>BACKUP_LIMIT)throw Error('Choose a library backup smaller than 5 MB.');
  let data;try{data=JSON.parse(text.replace(/^\ufeff/,''));}catch{throw Error('This file isn’t a valid JSON backup.');}
  if(data?.format!=='waveform-library'||data.version!==1||!validWorkspace(data.state))throw Error('Choose a full Waveform library backup. For single playlists, use the editor’s import tool.');
  if(data.draft && (typeof data.draft.title!=='string'||typeof data.draft.description!=='string'||!Array.isArray(data.draft.tracks)||data.draft.tracks.length>500||!data.draft.tracks.every(t=>normalizeTrack(t))))throw Error('This backup contains an invalid draft. Your library has not changed.');
  return structuredClone(data);
}
/** Additive restore: differing playlists sharing an ID are copied, never overwritten. */
export function mergeBackup(current,backup,{includePreferences=false,uuid=()=>crypto.randomUUID()}={}) {
  const next=structuredClone(current);let added=0,copied=0,skipped=0;
  for(const playlist of backup.state.playlists){
    const existing=next.playlists.find(p=>p.id===playlist.id);
    if(existing && JSON.stringify(existing)===JSON.stringify(playlist)){skipped++;continue;}
    const restored=structuredClone(playlist);
    if(existing){restored.id=uuid();restored.title=`${restored.title} (restored)`.slice(0,80);restored.revision=1;copied++;}
    next.playlists.push(restored);added++;
  }
  if(next.playlists.length>50)throw Error('This would exceed the 50-playlist library limit. Export or remove a playlist first. Nothing was restored.');
  for(const [id,track] of Object.entries(backup.state.tracks))if(!Object.hasOwn(next.tracks,id))next.tracks[id]=track;
  for(const [id,value] of Object.entries(backup.state.feedback))if(!Object.hasOwn(next.feedback,id))next.feedback[id]=value;
  const ids=new Set(next.sessions.map(s=>s.id));
  next.sessions=[...next.sessions,...backup.state.sessions.filter(s=>!ids.has(s.id))].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,10);
  if(includePreferences)next.profile={...structuredClone(backup.state.profile),revision:current.profile.revision+1};
  if(!validWorkspace(next))throw Error('The merged backup could not be validated. Your library is unchanged.');
  return {state:next,added,copied,skipped};
}
