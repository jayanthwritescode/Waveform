import {clean,labels} from './context.js';
import {deduplicate} from '../api/metadata.js';
import {scoreTrack} from './scoring.js';
export function hash(value) {let h=2166136261;for(const c of String(value)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0;}
/** Conservative version suppression only when artist and normalized base title agree. */
export const workKey=track=>`${clean(track.artist)}\u0000${clean(track.title).replace(/\s*[([](?:[^)\]]*\b(?:remaster(?:ed)?|live|radio edit|album version|single version)\b[^)\]]*)[)\]]/g,'').replace(/\s+[-–—]\s+(?:(?:\d{4}\s+)?remaster(?:ed)?.*|live(?:\s.*)?|radio edit|album version|single version)$/g,'').trim()}`;
export function rankCandidates(candidates,context,profile={},feedback={},knownTracks={}) {
  if(![10,20,30].includes(Number(context.count)))throw Error('Choose 10, 20, or 30 tracks.');
  const excluded=[...(profile.disliked_genres || []),...(context.excluded || [])].map(clean),excludeIds=new Set(context.excludeIds || []);
  const unique=[];const works=new Set();
  for(const track of deduplicate(candidates)) {
    if(excludeIds.has(track.id) || feedback[track.id]==='dislike' || labels(track).some(g=>excluded.includes(g)))continue;
    const work=workKey(track);if(works.has(work))continue;works.add(work);unique.push(track);
  }
  const ranked=unique.map(t=>scoreTrack(t,context,profile,feedback,knownTracks));
  const seed=Number(context.variation)||0;
  const variation=t=>seed?hash(`${seed}:${t.id}`)/4294967295*.035:0;
  ranked.sort((a,b)=>(b.recommendation.score+variation(b))-(a.recommendation.score+variation(a)) || a.id.localeCompare(b.id));
  const selected=[],remaining=[...ranked],counts=new Map(),genres=new Map();
  const variety=Math.max(0,Math.min(1,context.variety??.6));
  const artistLimit=variety>.7?2:3;
  while(selected.length<context.count && remaining.length) {
    const options=remaining.filter(t=>(counts.get(clean(t.artist)) || 0)<artistLimit);
    if(!options.length)break;
    options.sort((a,b)=>{
      const adjusted=t=>t.recommendation.score+variation(t)-variety*.10*(counts.get(clean(t.artist)) || 0)-variety*.035*(genres.get(clean(t.genres[0] || '')) || 0);
      return adjusted(b)-adjusted(a) || a.id.localeCompare(b.id);
    });
    const next=options[0];selected.push(next);remaining.splice(remaining.findIndex(t=>t.id===next.id),1);
    counts.set(clean(next.artist),(counts.get(clean(next.artist)) || 0)+1);genres.set(clean(next.genres[0] || ''),(genres.get(clean(next.genres[0] || '')) || 0)+1);
  }
  return {tracks:selected,reserve:remaining,ranked,requested:context.count,shortfall:Math.max(0,context.count-selected.length),artistLimit};
}
export function replacementFor(tracks,reserve,id,artistLimit=3) {
  const current=tracks.find(t=>t.id===id);if(!current)return null;
  const others=tracks.filter(t=>t.id!==id),ids=new Set(others.map(t=>t.id)),works=new Set(others.map(workKey));
  return reserve.find(t=>t.id!==id&&!ids.has(t.id)&&!works.has(workKey(t))&&others.filter(x=>clean(x.artist)===clean(t.artist)).length<artistLimit) || null;
}
