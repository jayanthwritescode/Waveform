import {store,defaultProfile} from './storage.js';
import {deduplicate} from '../api/metadata.js';
const fail=message=>{throw new Error(message);};
export const getProfile=async()=>store.read().profile;
export async function saveProfile(input) {
  const profile={...defaultProfile(),...input};
  profile.name=String(profile.name).trim().slice(0,80) || 'Your space';
  for (const key of ['favorite_genres','favorite_artists','disliked_genres']) profile[key]=[...new Set((profile[key] || []).filter(x=>typeof x==='string').map(x=>x.trim().slice(0,120)).filter(Boolean))].slice(0,100);
  if (profile.favorite_genres.some(x=>profile.disliked_genres.some(y=>y.toLowerCase()===x.toLowerCase()))) fail('A genre cannot be both favorite and excluded.');
  if (![profile.energy_min,profile.energy_max,profile.discovery_preference].every(x=>Number.isFinite(x)&&x>=0&&x<=1) || profile.energy_min>profile.energy_max) fail('Choose an energy range from 0 to 100, with minimum below maximum.');
  store.change(data=>{if(profile.revision!==data.profile.revision) fail('Preferences changed in another tab. Reload before saving.'); profile.revision++; data.profile=profile;});
  return profile;
}
export const getFeedback=async()=>store.read().feedback;
export async function setFeedback(id,value) {if(!['like','dislike',null].includes(value)) fail('Invalid feedback');store.change(data=>{if(value)data.feedback[id]=value;else delete data.feedback[id];});return {value};}
export const rememberTracks=tracks=>store.change(data=>{for(const t of tracks) data.tracks[t.id]=t;const used=new Set([...Object.keys(data.feedback),...data.playlists.flatMap(p=>p.tracks.map(t=>t.id))]); const entries=Object.entries(data.tracks);if(entries.length>800) for(const [id] of entries.slice(0,entries.length-800)) if(!used.has(id)) delete data.tracks[id];});
export async function getPlaylist(id) {return store.read().playlists.find(p=>p.id===id) || fail('Playlist no longer exists in this browser.');}
export async function savePlaylist(input,id) {
  if(!Array.isArray(input.tracks) || input.tracks.length>500) fail('A playlist supports up to 500 tracks.');
  const tracks=deduplicate(input.tracks);
  let result;
  store.change(data=>{
    const existing=id?data.playlists.find(p=>p.id===id):null;
    if(id && (!existing || existing.revision!==input.revision)) fail('This playlist changed in another tab. Reopen it or save a copy.');
    if(!id && data.playlists.length>=50) fail('The local library supports 50 small playlists. Export or remove one first.');
    result={id:id || crypto.randomUUID(),revision:(existing?.revision || 0)+1,title:String(input.title || 'Untitled playlist').slice(0,80),description:String(input.description || '').slice(0,500),tracks,updated_at:new Date().toISOString()};
    data.playlists=existing?data.playlists.map(p=>p.id===id?result:p):[result,...data.playlists];
  });
  return result;
}
export async function deletePlaylist(id,revision) {store.change(data=>{const p=data.playlists.find(p=>p.id===id);if(!p || p.revision!==revision) fail('Playlist changed. Refresh Your Library before deleting.');data.playlists=data.playlists.filter(p=>p.id!==id);});}
export const getLibrary=async()=>{const d=store.read();return {profile:d.profile,playlists:d.playlists,feedback:Object.entries(d.feedback).filter(([id])=>d.tracks[id]).map(([id,value])=>({value,track:d.tracks[id]})),recommendation_sessions:d.sessions};};
