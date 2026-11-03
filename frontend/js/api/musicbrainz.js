import {normalizeTrack,deduplicate} from './metadata.js';
export const APP_ID='Waveform/1.0 (https://github.com/jayanthwritescode/Waveform)';
const MBID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const literal=value=>`"${String(value).slice(0,120).replace(/([+\-!(){}\[\]^"~*?:\\/|&])/g,'\\$1')}"`;
export function normalizeRecording(record) {
  if(!MBID.test(record?.id) || typeof record.title!=='string')return null;
  const credit=record['artist-credit'];
  const artist=Array.isArray(credit)?credit.map(x=>(x.name || x.artist?.name || '')+(x.joinphrase || '')).join(''):'';
  const genres=[...(record.genres || []),...(record.tags || [])].map(g=>g.name).filter(g=>typeof g==='string');
  const release=record.releases?.find(r=>r.status==='Official') || record.releases?.[0];
  return normalizeTrack({id:`musicbrainz:${record.id}`,title:record.title,artist,album:release?.title ?? null,durationMs:record.length,genres:[...new Set(genres.map(g=>g.toLowerCase()))],tags:record.disambiguation?[record.disambiguation]:[],isrc:record.isrcs?.find(x=>/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(x)) || null,source:'musicbrainz',sourceId:record.id,sourceUrl:`https://musicbrainz.org/recording/${record.id}`,availability:'live'});
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
/** Hold the same-origin Web Lock through the spacing interval, including across tabs. */
async function browserGate(action) {
  if(!globalThis.navigator?.locks)throw Error('Live searches need Web Locks in a secure browser. Using demo fallback.');
  return navigator.locks.request('waveform-musicbrainz-request',action);
}
export class MusicBrainz {
  constructor({fetcher=(...args)=>globalThis.fetch(...args),gate=browserGate,storage,interval=1100,now=()=>Date.now(),sleep=pause}={}) {
    this.fetcher=fetcher;this.gate=gate;this.storage=storage;this.interval=Math.max(1000,interval);this.now=now;this.sleep=sleep;this.tail=Promise.resolve();this.cache=new Map();this.cooldown=0;
  }
  async request(entity,query,{limit=40,offset=0,signal}={}) {
    if(!['recording','artist'].includes(entity))throw Error('Unsupported metadata resource');
    const key=JSON.stringify([entity,query,limit,offset]);
    const run=async()=>{
      if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
      let cached=this.cache.get(key);
      if(!cached)try{cached=JSON.parse(this.storage?.getItem('waveform.mb.cache') || '[]').find(x=>x.key===key)?.value;}catch{ /* Cache is disposable. */ }
      if(cached && this.now()-cached.at<86400000){this.cache.set(key,cached);return {...structuredClone(cached.data),cached:true};}
      for(let attempt=0;attempt<2;attempt++) {
        if(this.cooldown>this.now())throw Error('MusicBrainz is cooling down after a rate limit; try again later.');
        let response;
        try {
          response=await this.gate(async()=>{
            if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
            const start=this.now();
            const url=new URL(`https://musicbrainz.org/ws/2/${entity}`);
            url.search=new URLSearchParams({query,fmt:'json',limit:String(limit),offset:String(offset),client:APP_ID});
            try {return await this.fetcher(url.href,{headers:{Accept:'application/json'},credentials:'omit',referrerPolicy:'origin',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(7000)]):AbortSignal.timeout(7000)});}
            finally {await this.sleep(Math.max(0,start+this.interval-this.now()));}
          });
        }catch(e){if(signal?.aborted)throw e;if(attempt===0 && e.name!=='Error')continue;throw e;}
        if([429,503].includes(response.status)){
          const retry=response.headers.get('Retry-After');
          const seconds=retry && /^\d+$/.test(retry)?Number(retry):retry?Math.max(0,(Date.parse(retry)-this.now())/1000):2;
          const delay=Number.isFinite(seconds)?Math.max(1100,seconds*1000):2000;
          if(attempt===1 || delay>4000){this.cooldown=this.now()+Math.max(delay,30000);throw Error(`MusicBrainz returned ${response.status}; using fallback while it recovers.`);}
          await this.sleep(delay);continue;
        }
        if(!response.ok)throw Error(`MusicBrainz returned ${response.status}.`);
        const data=await response.json();
        const array=entity==='recording'?'recordings':'artists';
        if(!data || !Array.isArray(data[array]) || !Number.isFinite(data.count))throw Error('MusicBrainz returned an unexpected response.');
        const value={at:this.now(),data};this.cache.set(key,value);
        while(this.cache.size>30)this.cache.delete(this.cache.keys().next().value);
        try{this.storage?.setItem('waveform.mb.cache',JSON.stringify([...this.cache].map(([key,value])=>({key,value}))));}catch{ /* Live results remain usable without disk cache. */ }
        return {...data,cached:false};
      }
    };
    const result=this.tail.then(run,run);this.tail=result.catch(()=>{});return result;
  }
  async search(query,options={}) {const data=await this.request('recording',query,options);return {tracks:deduplicate(data.recordings.map(normalizeRecording).filter(Boolean)),total:data.count,cached:data.cached};}
  async artists(query,options={}) {const data=await this.request('artist',`artist:${literal(query)}`,options);return {artists:data.artists.filter(a=>MBID.test(a.id)&&typeof a.name==='string').map(a=>({id:a.id,name:a.name,description:a.disambiguation || a.country || a.type || ''})),total:data.count,cached:data.cached};}
}
let storage;try{storage=globalThis.localStorage;}catch{}
export const musicbrainz=new MusicBrainz({storage});
