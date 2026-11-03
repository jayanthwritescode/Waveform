import {escapeHtml as html} from '../utils/html.js';
const choices = {
  mood:['any','calm','happy','energetic','melancholic','relaxed','focused'],
  activity:['any','focus','workout','relax','commute','social'],
  time_of_day:['any','morning','afternoon','evening','night'],
  weather:['any','clear','rainy','overcast','snowy'],
};
const title = value => value === 'any' ? 'No preference' : value[0].toUpperCase()+value.slice(1);
function select(key,label) {return `<label>${label}<select id="moment-${key}">${choices[key].map(value=>`<option value="${value}">${title(value)}</option>`).join('')}</select></label>`;}
export function momentControls() {
  return `<fieldset class="moment-controls"><legend>Shape this moment</legend><p class="generation-help">Choose what matters now. These are transparent feature-based heuristics; no location, live weather or listening history is collected.</p>
    <div class="moment-grid">${select('mood','Mood')}${select('activity','Activity')}${select('time_of_day','Time of day (optional)')}${select('weather','Weather (optional, manual)')}</div>
    <div class="moment-grid"><label>Energy for this moment<select id="moment-energy"><option value="">Use mood/activity targets</option><option value="0.2">Low · 0.2</option><option value="0.5">Balanced · 0.5</option><option value="0.85">High · 0.85</option></select></label><label>Instrumental preference<select id="moment-instrumental"><option value="any">Use mood/activity targets</option><option value="prefer">Prefer instrumental</option><option value="avoid">Prefer vocal</option></select></label><label>Preferred genres (one per line)<textarea id="moment-genres" rows="2" maxlength="2400" placeholder="Jazz&#10;Folk"></textarea></label><label>Preferred artists (one per line)<textarea id="moment-artists" rows="2" maxlength="2400" placeholder="Artist names as shown in Discover"></textarea></label></div>
    <p class="generation-help">Moment genres/artists are soft preferences using exact source labels. Saved dislikes remain exclusions. Explicit energy/instrumental choices replace the corresponding mood/activity targets.</p>
    <label>Familiarity / discovery<select id="moment-discovery"><option value="">Use saved preference</option><option value="0">Familiar artist labels</option><option value="0.5">Balanced · no discovery boost</option><option value="1">Explore beyond familiar artist labels</option></select></label><p class="generation-help">Familiar means liked tracks or liked/favorite artist labels. It does not mean listening history. No boost is applied without those saved signals.</p>
    <div class="moment-grid"><label>Playlist length<select id="moment-length"><option value="count">Number of tracks</option><option value="duration">Duration budget</option></select></label><label id="duration-control" hidden>Duration in minutes<input id="moment-duration" type="number" min="1" max="180" step="any" value="30"></label></div><p class="generation-help" id="length-help">Choose 1–30 tracks below. When exclusions leave fewer eligible tracks, the playlist stays shorter.</p>
  </fieldset>`;
}
const lines = value => [...new Set(value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean))];
export function readMoment(root=document) {
  const get = id => root.querySelector(`#moment-${id}`).value;
  const context = Object.fromEntries(Object.keys(choices).map(key=>[key,get(key)]));
  return {...context,energy_target:get('energy') === '' ? null : Number(get('energy')),
    instrumental_preference:get('instrumental'),favorite_genres:lines(get('genres')),favorite_artists:lines(get('artists')),
    discovery:get('discovery') === '' ? null : Number(get('discovery'))};
}
function restoreChoice(select,value) {
  if (![...select.options].some(option=>option.value===String(value))) select.add(new Option(`Custom · ${value}`,String(value)));
  select.value=value;
}
export function restoreMoment(request,root=document) {
  const context=request.context || {};
  for (const key of Object.keys(choices)) root.querySelector(`#moment-${key}`).value=context[key] || 'any';
  restoreChoice(root.querySelector('#moment-energy'),context.energy_target ?? '');
  root.querySelector('#moment-instrumental').value=context.instrumental_preference || 'any';
  root.querySelector('#moment-genres').value=(context.favorite_genres || []).join('\n');
  root.querySelector('#moment-artists').value=(context.favorite_artists || []).join('\n');
  restoreChoice(root.querySelector('#moment-discovery'),context.discovery ?? '');
  root.querySelector('#moment-length').value=request.length_mode || 'count';
  root.querySelector('#moment-duration').value=request.duration_minutes ?? 30;
  syncLength(root);
}
export function syncLength(root=document) {
  const duration=root.querySelector('#moment-length').value === 'duration';
  root.querySelector('#duration-control').hidden=!duration;
  root.querySelector('#moment-duration').required=duration;
  root.querySelector('#count-label').textContent=duration ? 'Maximum tracks (1–30)' : 'Number of tracks';
  root.querySelector('#length-help').textContent=duration ? 'Duration is an upper budget. Selects tracks in ranking order that fit; no overshoot. Exact fit is not guaranteed, with a maximum of 30 tracks. Unknown durations are omitted.' : 'Choose 1–30 tracks below. When exclusions leave fewer eligible tracks, the playlist stays shorter.';
}
export function momentSummary(context) {
  return Object.entries(context || {}).filter(([key,value])=>['mood','activity','time_of_day','weather'].includes(key) && value !== 'any').map(([key,value])=>`${key.replaceAll('_',' ')}: ${value}`).join(' · ') || 'Custom moment preferences';
}
export function signalDetails(signals) {
  return `<dl>${signals.map(signal=>`<div><dt>${html(signal.name)}</dt><dd>${signal.value.toFixed(3)} × weight ${signal.weight.toFixed(3)} = ${signal.contribution.toFixed(3)}</dd></div>`).join('')}</dl>`;
}
