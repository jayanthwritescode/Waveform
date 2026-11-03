import {deduplicate} from './metadata.js';
import {rememberTracks, getPlaylist} from '../playlists/manager.js';
import {store} from '../playlists/storage.js';
let fallback;
const known=new Map();
export const liveAdapter={async search(){throw Error('Live catalogue adapter is not configured.');}};
export async function fallbackTracks() {
  if (!fallback) fallback=fetch(new URL('../../data/fallback-tracks.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Fallback catalogue unavailable');return r.json();}).then(d=>deduplicate(d.tracks)).catch(e=>{fallback=null;throw e;});
  const tracks=await fallback;tracks.forEach(t=>known.set(t.id,t));return structuredClone(tracks);
}
export async function getTracks(filters={},signal) {
  if(signal?.aborted) throw new DOMException('Cancelled','AbortError');
  const all=await fallbackTracks();
  const q=(filters.q || '').toLowerCase();
  const items=all.filter(t=>(!q || `${t.title} ${t.artist} ${t.genres.join(' ')} ${t.tags.join(' ')}`.toLowerCase().includes(q))&&(!filters.genre || t.genres.some(g=>g.toLowerCase()===filters.genre.toLowerCase()))&&(!filters.artist || t.artist.toLowerCase()===filters.artist.toLowerCase()));
  const limit=Math.min(100,Math.max(1,Number(filters.limit)||24)),offset=Math.max(0,Number(filters.offset)||0);
  return {items:items.slice(offset,offset+limit),total:items.length,limit,offset,genres:[...new Set(all.flatMap(t=>t.genres))].sort(),artists:[...new Set(all.map(t=>t.artist))].sort(),mode:'fallback',notice:'Verified demo fallback · not live API results'};
}
export async function getTrack(id) {
  if(known.has(id))return structuredClone(known.get(id));
  const data=store.read();const stored=data.tracks[id] || data.playlists.flatMap(p=>p.tracks).find(t=>t.id===id);
  if(stored)return stored;
  await fallbackTracks();if(known.has(id))return structuredClone(known.get(id));
  const e=Error('Track not cached in this browser. Search again to retrieve it.');e.status=404;throw e;
}
export function registerTracks(tracks) {tracks.forEach(t=>known.set(t.id,t));rememberTracks(tracks);}
