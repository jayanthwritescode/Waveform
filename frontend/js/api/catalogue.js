import {deduplicate} from './metadata.js';
import {rememberTracks} from '../playlists/manager.js';
import {GENRES} from '../recommender/context.js';
import {musicbrainz,literal} from './musicbrainz.js';
import {store} from '../playlists/storage.js';
let fallback;
const known=new Map();
export const liveAdapter=musicbrainz;
export async function fallbackTracks() {
  if (!fallback) fallback=fetch(new URL('../../data/fallback-tracks.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Fallback catalogue unavailable');return r.json();}).then(d=>deduplicate(d.tracks)).catch(e=>{fallback=null;throw e;});
  const tracks=await fallback;tracks.forEach(t=>known.set(t.id,t));return structuredClone(tracks);
}
export async function getTracks(filters={},signal) {
  if(filters.q || filters.genre || filters.artist) {
    const query=[filters.q ? (filters.searchType==='artist'?`artist:${literal(filters.q)}`:`recording:${literal(filters.q)}`):null,filters.genre?`tag:${literal(filters.genre)}`:null,filters.artist?`artist:${literal(filters.artist)}`:null].filter(Boolean).join(' AND ');
    try {const response=await musicbrainz.search(query,{limit:filters.limit || 24,offset:filters.offset || 0,signal}); registerTracks(response.tracks);const all=await fallbackTracks();return {items:response.tracks,total:response.total,limit:filters.limit || 24,offset:filters.offset || 0,genres:[...new Set([...GENRES,...all.flatMap(t=>t.genres)])].sort(),artists:[],mode:response.cached?'cached':'live',notice:response.cached?'Cached MusicBrainz search · up to 24 hours old':'Live MusicBrainz metadata · recordings may include alternate versions'};}
    catch(error){if(signal?.aborted)throw error;const result=await searchFallback(filters);return {...result,notice:`${error.message || 'Live request failed'} Showing verified demo fallback; it may not contain your search.`};}
  }
  return searchFallback(filters);
}
export async function searchFallback(filters={}) {
  const all=await fallbackTracks();
  const q=(filters.q || '').toLowerCase();
  const items=all.filter(t=>(!q || (filters.searchType==='artist'?t.artist:`${t.title} ${t.artist} ${t.genres.join(' ')} ${t.tags.join(' ')}`).toLowerCase().includes(q))&&(!filters.genre || t.genres.some(g=>g.toLowerCase()===filters.genre.toLowerCase()))&&(!filters.artist || t.artist.toLowerCase()===filters.artist.toLowerCase()));
  const limit=Math.min(100,Math.max(1,Number(filters.limit)||24)),offset=Math.max(0,Number(filters.offset)||0);
  return {items:items.slice(offset,offset+limit),total:items.length,limit,offset,genres:[...new Set([...GENRES,...all.flatMap(t=>t.genres)])].sort(),artists:[...new Set(all.map(t=>t.artist))].sort(),mode:'fallback',notice:'Verified demo fallback · not live API results'};
}
export async function getTrack(id) {
  if(known.has(id))return structuredClone(known.get(id));
  const data=store.read();const stored=data.tracks[id] || data.playlists.flatMap(p=>p.tracks).find(t=>t.id===id);
  if(stored)return stored;
  await fallbackTracks();if(known.has(id))return structuredClone(known.get(id));
  const e=Error('Track not cached in this browser. Search again to retrieve it.');e.status=404;throw e;
}
export function registerTracks(tracks) {tracks.forEach(t=>known.set(t.id,t));while(known.size>1000)known.delete(known.keys().next().value);rememberTracks(tracks);}
