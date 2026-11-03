/** Editorial search heuristics, not measured emotions or audio features. */
export const MOODS={calm:['ambient','classical','minimalism','downtempo'],happy:['pop','funk','disco','soul'],energetic:['electronic','dance','rock','hip hop'],melancholic:['indie rock','acoustic','folk','ambient'],relaxed:['jazz','chill out','downtempo','ambient'],focused:['instrumental','ambient','classical','minimalism']};
export const ACTIVITIES={studying:['ambient','classical','instrumental'],working:['minimalism','jazz','instrumental'],exercising:['dance','electronic','rock'],traveling:['indie rock','pop','folk'],gaming:['chiptune','electronic','soundtrack'],relaxing:['ambient','jazz','acoustic'],sleeping:['ambient','drone','minimalism']};
export const GENRES=['Ambient','Classical','Electronic','Jazz','Pop','Rock','Folk','Hip-Hop','Instrumental','Dance','Blues','Indie-Rock','Soundtrack','Experimental'];
export const clean=value=>String(value).normalize('NFKC').toLowerCase().replace(/[-_]/g,' ').replace(/\s+/g,' ').trim().replace(/^electronica$/,'electronic');
export const labels=track=>[...track.genres,...track.tags].map(clean);
export const overlap=(a,b)=>a.filter(x=>b.some(y=>clean(x)===clean(y)));
export const contextTags=context=>[...new Set([...(MOODS[context.mood] || []),...(ACTIVITIES[context.activity] || [])])];
export const ENERGY_PROXIES={ambient:0.15,drone:0.1,minimalism:0.2,classical:0.35,'chill out':0.25,downtempo:0.3,acoustic:0.35,folk:0.4,jazz:0.45,pop:0.65,rock:0.8,punk:0.9,metal:0.95,dance:0.85,disco:0.8,electronic:0.7,'hip hop':0.7,chiptune:0.8};
export function searchQueries(context) {
  const selected=[...(context.genres || []),...contextTags(context)];
  // Three differently focused searches, not the first API response as a playlist.
  const queries=[...new Set(selected.map(clean))].slice(0,6);
  return [queries.filter((_,i)=>i%2===0),queries.filter((_,i)=>i%2===1)].filter(x=>x.length).map(tags=>({kind:'tags',tags}));
}
