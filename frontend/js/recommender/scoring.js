import {clean,labels,overlap,contextTags,ENERGY_PROXIES} from './context.js';
export const DEFAULT_WEIGHTS={genre:.35,context:.25,preference:.20,artist:.10,discovery:.10};
export function scoreTrack(track,context,profile={},feedback={},knownTracks={}) {
  const tags=labels(track),selected=(context.genres?.length?context.genres:profile.favorite_genres || []).map(clean),target=contextTags(context);
  const favorites=[...(context.artists || []),...(context.seedArtist?[context.seedArtist]:[]),...(profile.favorite_artists || [])].map(clean);
  const artist=clean(track.artist),known=track.artist!=='Unknown artist';
  const familiar=favorites.includes(artist) || Object.entries(feedback).some(([id,value])=>value==='like' && clean(knownTracks[id]?.artist || '')===artist);
  const genreMatches=overlap(selected,tags),contextMatches=overlap(target,tags);
  const values={genre:selected.length&&tags.length?genreMatches.length/selected.length:null,context:null,preference:null,artist:favorites.length&&known?(favorites.includes(artist)?1:0):null,discovery:known?((context.discovery??.5)*(familiar?0:1)+(1-(context.discovery??.5))*(familiar?1:0)):null};
  const reasons=[];
  if(genreMatches.length)reasons.push(`Matches your ${genreMatches.join(', ')} genre preference.`);
  const contextParts=[];
  if(tags.length){contextParts.push(contextMatches.length?Math.min(1,contextMatches.length/2):0);if(contextMatches.length)reasons.push(`Source ${contextMatches.join(', ')} tags match our ${context.mood} / ${context.activity} mapping.`);}
  const proxy=tags.filter(t=>ENERGY_PROXIES[t]!==undefined);
  if(proxy.length && Number.isFinite(context.energy)){const average=proxy.reduce((sum,t)=>sum+ENERGY_PROXIES[t],0)/proxy.length;contextParts.push(1-Math.abs(average-context.energy));if(Math.abs(average-context.energy)<.3)reasons.push(`Genre-based energy proxy (${proxy.join(', ')}) fits your energy setting; audio energy is unknown.`);}
  if(contextParts.length)values.context=contextParts.reduce((a,b)=>a+b,0)/contextParts.length;
  const preference=[];
  if(feedback[track.id]==='like'){preference.push(1);reasons.push('You explicitly liked this recording.');}
  if(profile.favorite_genres?.length && tags.length)preference.push(overlap(profile.favorite_genres,tags).length?1:0);
  const instrumental=context.instrumental || profile.instrumental_preference || 'any';
  const hasInstrumental=tags.includes('instrumental'),hasVocals=tags.includes('vocal') || tags.includes('vocals');
  if(instrumental!=='any' && (hasInstrumental||hasVocals)){const match=instrumental==='prefer'?hasInstrumental:hasVocals;preference.push(match?1:0);if(match)reasons.push(`Source ${hasInstrumental?'instrumental':'vocal'} tag matches your preference.`);}
  if(preference.length)values.preference=preference.reduce((a,b)=>a+b,0)/preference.length;
  if(values.artist===1)reasons.push('Matches an artist you selected.');
  if(known && !familiar && (context.discovery??.5)>.5)reasons.push('Introduces an artist outside your explicit favorites and likes.');
  if(known && familiar && (context.discovery??.5)<.5)reasons.push('Keeps an artist from your explicit favorites or likes.');
  const custom=context.weights || {},weights=Object.fromEntries(Object.entries(DEFAULT_WEIGHTS).map(([key,value])=>[key,Number.isFinite(custom[key])&&custom[key]>=0?custom[key]:value]));
  const available=Object.keys(values).filter(key=>values[key]!==null),total=available.reduce((sum,key)=>sum+weights[key],0);
  const contributions=Object.fromEntries(Object.entries(values).map(([key,value])=>[key,value===null||!total?0:value*weights[key]/total]));
  const score=Object.values(contributions).reduce((a,b)=>a+b,0);
  if(!reasons.length)reasons.push('Limited matching metadata; retained as a variety candidate.');
  return {...track,recommendation:{score,values,weights:Object.fromEntries(Object.keys(values).map(key=>[key,total&&values[key]!==null?weights[key]/total:0])),contributions,reasons,missing:Object.keys(values).filter(k=>values[k]===null)}};
}
