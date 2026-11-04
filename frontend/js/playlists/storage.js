import {normalizeTrack} from '../api/metadata.js';
export const STORAGE_KEY='waveform.workspace.v2';
export const defaultProfile=()=>({name:'Your space',revision:1,favorite_genres:[],disliked_genres:[],favorite_artists:[],energy_min:0,energy_max:1,discovery_preference:0.5,instrumental_preference:'any'});
const empty=()=>({version:2,profile:defaultProfile(),playlists:[],feedback:{},tracks:{},sessions:[],settings:{}});
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const texts=value=>Array.isArray(value)&&value.length<=100&&value.every(x=>typeof x==='string'&&x.length<=500);
export function validWorkspace(d) {
  if(!object(d)||d.version!==2||!object(d.profile)||!Array.isArray(d.playlists)||d.playlists.length>50||!object(d.feedback)||!object(d.tracks)||!Array.isArray(d.sessions)||!object(d.settings))return false;
  const p=d.profile;
  if(p.revision<1||p.energy_min>p.energy_max||!['any','prefer','avoid'].includes(p.instrumental_preference)||typeof p.name!=='string'||!p.name.trim()||!Number.isInteger(p.revision)||!['favorite_genres','favorite_artists','disliked_genres'].every(k=>texts(p[k]))||!['energy_min','energy_max','discovery_preference'].every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=1))return false;
  if(!Object.entries(d.feedback).every(([id,x])=>/^[A-Za-z0-9][A-Za-z0-9:._-]{0,199}$/.test(id)&&['like','dislike'].includes(x)))return false;
  const track=t=>Boolean(normalizeTrack(t))&&typeof t.artist==='string';
  if(!Object.entries(d.tracks).every(([id,t])=>id===t?.id&&track(t)))return false;
  if(!d.playlists.every(p=>object(p)&&typeof p.id==='string'&&typeof p.title==='string'&&typeof p.description==='string'&&Number.isInteger(p.revision)&&Array.isArray(p.tracks)&&p.tracks.length<=500&&p.tracks.every(track)))return false;
  if(d.sessions.length>10||!d.sessions.every(s=>object(s)&&typeof s.id==='string'&&typeof s.model_name==='string'&&typeof s.created_at==='string'&&Array.isArray(s.track_ids)&&Array.isArray(s.tracks)&&s.tracks.every(track)&&object(s.context)))return false;
  const c=d.settings.lastContext;if(c&&(!object(c)||!Array.isArray(c.genres)||!Array.isArray(c.artists)||!Array.isArray(c.excluded)))return false;
  return true;
}
export class LocalStore {
  constructor(storage) {this.storage=storage;this.memory=empty();this.warning='';this.blocked=false;}
  read() {
    if (this.blocked) return structuredClone(this.memory);
    try {
      const text=this.storage?.getItem(STORAGE_KEY);
      if (!this.storage) throw Error('Storage unavailable');
      if (!text) return structuredClone(this.memory);
      const value=JSON.parse(text);
      if (!validWorkspace(value)) throw Error('Invalid storage');
      this.memory={...empty(),...value,profile:{...defaultProfile(),...value.profile}};
    } catch {this.blocked=true;this.warning='Browser storage could not be read. Original data is preserved; changes are temporary. Export files to keep them.';}
    return structuredClone(this.memory);
  }
  change(action) {
    const next=this.read();action(next);
    if (!this.blocked) {
      try {this.storage.setItem(STORAGE_KEY,JSON.stringify(next));}
      catch {this.blocked=true;this.warning='Browser storage is unavailable or full. Changes are temporary; download a JSON copy before leaving.';}
    }
    this.memory=next;
    if (typeof window!=='undefined') window.dispatchEvent(new Event('waveform-storage-status'));
    return structuredClone(next);
  }
}
let browserStorage;
try {browserStorage=globalThis.localStorage;} catch { /* In-memory mode is explicit. */ }
export const store=new LocalStore(browserStorage);
