/** Canonical browser track; aliases keep the existing editor/cards compatible. */
export function normalizeTrack(raw) {
  if (!raw || typeof raw.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,199}$/.test(raw.id) || typeof raw.title !== 'string' || !raw.title.trim()) return null;
  const duration = Number.isFinite(raw.durationMs) && raw.durationMs > 0 ? raw.durationMs : Number.isFinite(raw.duration_seconds) && raw.duration_seconds > 0 ? raw.duration_seconds*1000 : null;
  const genres = Array.isArray(raw.genres) ? raw.genres.filter(x=>typeof x==='string').slice(0,30).map(x=>x.slice(0,120)) : [];
  const artwork = /^assets\/images\/catalogue-[1-8]\.svg$/.test(raw.artwork) ? raw.artwork : `assets/images/catalogue-${1+[...raw.id].reduce((sum,c)=>sum+c.charCodeAt(0),0)%8}.svg`;
  return {id:raw.id.slice(0,200), title:raw.title.slice(0,500), artist:typeof raw.artist==='string' && raw.artist ? raw.artist.slice(0,500) : 'Unknown artist', album:typeof raw.album==='string'?raw.album.slice(0,500):null,
    durationMs:duration, genres, tags:Array.isArray(raw.tags)?raw.tags.filter(x=>typeof x==='string').slice(0,40):[], artworkUrl:null, isrc:typeof raw.isrc==='string'?raw.isrc:null,
    source:typeof raw.source==='string'?raw.source.slice(0,80):'import',sourceId:typeof raw.sourceId==='string'?raw.sourceId.slice(0,200):raw.id,sourceUrl:/^https:\/\//.test(raw.sourceUrl || '')?raw.sourceUrl:null, availability:raw.availability || 'imported', attribution:typeof raw.attribution==='string'?raw.attribution.slice(0,2000):'',
    artwork, duration_seconds:duration===null?null:duration/1000,genre:genres[0] || 'Genre unknown',instruments:[], source_identifier:raw.sourceId || raw.id,dataset_source:raw.source || 'import',
    ...(raw.recommendation ? {recommendation:structuredClone(raw.recommendation)} : {})};
}
export const deduplicate = tracks => [...new Map(tracks.map(normalizeTrack).filter(Boolean).map(t=>[t.id,t])).values()];
