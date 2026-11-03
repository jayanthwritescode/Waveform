export const STORAGE_KEY='waveform.workspace.v2';
export const defaultProfile=()=>({name:'Your space',revision:1,favorite_genres:[],disliked_genres:[],favorite_artists:[],energy_min:0,energy_max:1,discovery_preference:0.5,instrumental_preference:'any'});
const empty=()=>({version:2,profile:defaultProfile(),playlists:[],feedback:{},tracks:{},sessions:[],settings:{}});
export class LocalStore {
  constructor(storage) {this.storage=storage;this.memory=empty();this.warning='';this.blocked=false;}
  read() {
    if (this.blocked) return structuredClone(this.memory);
    try {
      const text=this.storage?.getItem(STORAGE_KEY);
      if (!this.storage) throw Error('Storage unavailable');
      if (!text) return structuredClone(this.memory);
      const value=JSON.parse(text);
      if (value.version!==2 || !Array.isArray(value.playlists) || !value.profile || !value.feedback || !value.tracks || !Array.isArray(value.sessions) || typeof value.settings!=='object') throw Error('Invalid storage');
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
