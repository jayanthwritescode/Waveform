import {musicbrainz,literal} from '../api/musicbrainz.js';
import {fallbackTracks,registerTracks} from '../api/catalogue.js';
import {deduplicate} from '../api/metadata.js';
import {searchQueries,clean} from './context.js';
import {rankCandidates} from './ranking.js';
import {store} from '../playlists/storage.js';
export async function collectCandidates(context,{service=musicbrainz,loadFallback=fallbackTracks,signal,onProgress=()=>{}}={}) {
  const queries=searchQueries(context).map(q=>q.tags.map(t=>`tag:${literal(t)}`).join(' OR '));
  if(context.seedSong)queries.unshift(`recording:${literal(context.seedSong)}`);
  if(context.seedArtist || context.artists?.length)queries.unshift(`artist:${literal(context.seedArtist || context.artists[0])}`);
  const live=[],failures=[];let cached=0;
  if(!context.offline) for(const [index,query] of queries.slice(0,3).entries()) {
    if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
    onProgress(`Finding candidates ${index+1} of ${Math.min(3,queries.length)}…`);
    try {const response=await service.search(query,{limit:60,signal,offset:context.variation?Math.floor(context.variation%3)*20:0});live.push(...response.tracks);if(response.cached)cached++;}
    catch(error){if(signal?.aborted)throw error;failures.push(error.message);break;}
  }
  const fallback=await loadFallback();
  const useFallback=context.offline || live.length<Number(context.count)+12;
  return {candidates:deduplicate(useFallback?[...live,...fallback]:live),mode:live.length?(useFallback?'mixed':cached===queries.slice(0,3).length?'cached':'live'):'fallback',notice:context.offline?'Demo mode · verified fallback metadata only.':failures.length?`${failures[0]} Verified fallback fills available gaps.`:useFallback?'Verified demo fallback supplements limited live candidates.':'MusicBrainz candidates retrieved and ranked in your browser.'};
}
export async function generatePlaylist(context,options={}) {
  const data=store.read();
  const collected=await collectCandidates(context,options);
  const ranked=rankCandidates(collected.candidates,context,data.profile,data.feedback,data.tracks);
  registerTracks([...ranked.tracks,...ranked.reserve.slice(0,60)]);
  if(ranked.tracks.length)store.change(d=>{
    d.settings.lastContext=context;
    d.sessions.unshift({id:crypto.randomUUID(),model_name:'Browser metadata context v1',created_at:new Date().toISOString(),context,track_ids:ranked.tracks.map(t=>t.id),tracks:ranked.tracks,mode:collected.mode});d.sessions=d.sessions.slice(0,10);
  });
  return {...collected,...ranked,context};
}
