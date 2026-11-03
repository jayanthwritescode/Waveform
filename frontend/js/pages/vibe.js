import {MOODS,ACTIVITIES,GENRES} from '../recommender/context.js';
import {generatePlaylist} from '../recommender/generator.js';
import {replacementFor} from '../recommender/ranking.js';
import {trackCard,skeletonCards} from '../components/cards.js';
import {escapeHtml as html,formatTime} from '../utils/html.js';
import {store} from '../playlists/storage.js';
import {draft,summarizeDraft} from '../state/draft.js';
import {requestReplacement} from '../components/playlist-tools.js';
import {registerTracks,getTrack} from '../api/catalogue.js';
let result=null;
export function vibePage() {
  return `<section class="page-intro"><div><div class="eyebrow">TUNE INTO YOUR MOMENT</div><h1>Vibe Control<span class="title-dot">.</span></h1><p>A little context. A new direction. Discover a playlist that fits.</p></div><span class="sample-chip">EXPLAINABLE / BROWSER-NATIVE</span></section><form id="vibe-form" class="profile-form"><section class="form-panel"><h2>How are you feeling?</h2><div class="mood-options">${Object.keys(MOODS).map((mood,i)=>`<label class="mood-option"><input type="radio" name="mood" value="${mood}" ${i===0?'checked':''}><span>${['☁','☀','ϟ','☾','≈','◎'][i]} ${mood[0].toUpperCase()+mood.slice(1)}</span></label>`).join('')}</div><div class="preference-grid"><label>Activity<select name="activity">${Object.keys(ACTIVITIES).map(a=>`<option value="${a}">${a[0].toUpperCase()+a.slice(1)}</option>`).join('')}</select></label><label>Playlist title<input name="title" maxlength="80" value="My moment" required></label><label>Playlist length<select name="count"><option value="10">10 tracks</option><option value="20">20 tracks</option><option value="30">30 tracks</option></select></label></div></section><section class="form-panel"><h2>Make it your own</h2><fieldset class="genre-chips"><legend>Preferred genres · optional</legend>${GENRES.map(g=>`<label><input type="checkbox" name="genre" value="${html(g)}"><span>${html(g)}</span></label>`).join('')}</fieldset><div class="preference-grid"><label>Favorite artists<textarea name="artists" rows="2" placeholder="One per line" maxlength="2000"></textarea></label><label>Excluded genres<textarea name="excluded" rows="2" placeholder="One per line" maxlength="2000"></textarea></label><label>Instrumental preference<select name="instrumental"><option value="any">No preference</option><option value="prefer">Prefer instrumental tags</option><option value="avoid">Prefer vocal tags</option></select></label><label>Desired energy <output id="energy-value">50%</output><input type="range" name="energy" min="0" max="100" value="50"><small>Uses genre/tag proxies, not measured audio energy.</small></label><label>Discovery <output id="discovery-value">50%</output><input type="range" name="discovery" min="0" max="100" value="50"><small>Familiar favorites ← → New artists</small></label><label>Variety <output id="variety-value">60%</output><input type="range" name="variety" min="0" max="100" value="60"></label><label>Seed artist · optional<input name="seedArtist" maxlength="120" placeholder="An artist to explore"></label><label>Seed song · optional<input name="seedSong" maxlength="120" placeholder="A song title to explore"></label></div><label class="demo-toggle"><input type="checkbox" name="offline"> Use verified demo fallback only</label><p>Context mappings are editorial heuristics. Unknown metadata stays unknown. Your saved preferences and dislikes also apply.</p></section><div class="form-actions"><button class="primary-button" type="submit">Generate playlist ↗</button><span id="generation-status" role="status" aria-live="polite"></span></div></form><section id="vibe-results" class="music-section"></section><div id="replace-editor" hidden></div>`;
}
export function renderVibeResult(value) {
  if(!value)return '';
  const summary=summarizeDraft(value);
  return `<div class="section-heading"><div><div class="eyebrow">YOUR NEXT FREQUENCY · ${html(value.mode.toUpperCase())}</div><h2>${html(value.context.title)}</h2><p>${html(value.context.mood)} / ${html(value.context.activity)} · ${value.tracks.length} tracks · ${formatTime(summary.seconds)} known duration${summary.unknownDurations?' + unknown durations':''}</p></div></div><p class="source-status">${html(value.notice)}${value.shortfall?` Only ${value.tracks.length} of ${value.requested} requested tracks satisfy the available catalogue and artist limits.`:''}</p><div class="save-actions"><button class="primary-button" id="use-generated" ${!value.tracks.length?'disabled':''}>Edit this playlist</button><button class="secondary-button" id="regenerate-playlist">Regenerate with variation</button></div><p>Ranked by available metadata. Explanations describe signals, not confidence or listening history.</p><div class="track-grid">${value.tracks.map((t,i)=>`<div class="recommended-card">${trackCard(t,i)}<ul class="track-reasons">${t.recommendation.reasons.slice(0,3).map(r=>`<li>${html(r)}</li>`).join('')}</ul><details class="score-details"><summary>Scoring details</summary><p>Weighted ranking score ${t.recommendation.score.toFixed(3)}; not a probability.</p><dl>${Object.entries(t.recommendation.contributions).map(([key,c])=>`<div><dt>${html(key)}</dt><dd>${t.recommendation.values[key]===null?'Unavailable · weight redistributed':c.toFixed(3)}</dd></div>`).join('')}</dl></details><div class="save-actions"><button class="text-button" data-replace-result="${html(t.id)}">Replace track</button><button class="text-button" data-remove-result="${html(t.id)}">Remove</button></div></div>`).join('')}</div>`;
}
export async function mountVibe(params,isCurrent,onTracks) {
  const form=document.querySelector('#vibe-form'),last=store.read().settings.lastContext;
  const restore=last || {genres:store.read().profile.favorite_genres,artists:store.read().profile.favorite_artists};
  if(restore)for(const [key,value] of Object.entries(restore)){
    if(['genres','artists','excluded','mood'].includes(key))continue;
    const field=form.elements.namedItem(key);if(field){if(field.type==='checkbox')field.checked=Boolean(value);else field.value=String(value);}
  }
  for(const field of form.querySelectorAll('[name=genre]'))field.checked=(restore.genres || []).includes(field.value);
  form.elements.artists.value=(restore.artists || []).join('\n');form.elements.excluded.value=(restore.excluded || []).join('\n');
  const mood=params.get('mood') || restore.mood;if(MOODS[mood])form.querySelector(`[name=mood][value=${mood}]`).checked=true;
  for(const key of ['energy','discovery','variety']){if(last)form.elements[key].value=String(Math.round(last[key]*100));form.querySelector(`#${key}-value`).textContent=form.elements[key].value+'%';}
  const seed=params.get('seed');if(seed)try{const t=await getTrack(seed);if(isCurrent()){form.elements.seedArtist.value=t.artist;form.elements.seedSong.value=t.title;}}catch{}
  if(!isCurrent())return;
  const show=value=>{result=value;registerTracks([...value.tracks,...value.reserve]);document.querySelector('#vibe-results').innerHTML=renderVibeResult(value);onTracks(value.tracks);};
  const session=params.get('session');if(session){const saved=store.read().sessions.find(s=>s.id===session);if(saved)show({tracks:saved.tracks,reserve:[],requested:saved.tracks.length,shortfall:0,artistLimit:3,context:saved.context,mode:saved.mode,notice:'Recorded local generation snapshot. Regenerate to retrieve current candidates.'});}else if(result)show(result);
  let pending=false,variation=0;
  const run=async(regenerate=false)=>{
    if(pending)return;pending=true;
    const status=document.querySelector('#generation-status'),button=form.querySelector('[type=submit]');button.disabled=true;
    const data=new FormData(form),lines=name=>String(data.get(name)).split('\n').map(x=>x.trim()).filter(Boolean).slice(0,20);
    const context={mood:data.get('mood'),activity:data.get('activity'),title:data.get('title').trim() || 'My moment',count:Number(data.get('count')),genres:data.getAll('genre'),artists:lines('artists'),excluded:lines('excluded'),instrumental:data.get('instrumental'),energy:Number(data.get('energy'))/100,discovery:Number(data.get('discovery'))/100,variety:Number(data.get('variety'))/100,seedArtist:data.get('seedArtist').trim(),seedSong:data.get('seedSong').trim(),offline:data.has('offline'),variation:regenerate?++variation:0};
    status.textContent='Finding candidates…';document.querySelector('#vibe-results').setAttribute('aria-busy','true');
    try {const value=await generatePlaylist(context,{onProgress:text=>{if(isCurrent())status.textContent=text;}});if(isCurrent()){show(value);status.textContent=`Generated ${value.tracks.length} real metadata records · ${value.mode}.`;}}
    catch(error){if(isCurrent())status.textContent=`${error.message} Previous results are kept.`;}
    finally{pending=false;if(isCurrent()){button.disabled=false;document.querySelector('#vibe-results').removeAttribute('aria-busy');}}
  };
  form.onsubmit=e=>{e.preventDefault();run();};
  form.oninput=e=>{if(['energy','discovery','variety'].includes(e.target.name))form.querySelector(`#${e.target.name}-value`).textContent=e.target.value+'%';};
  document.querySelector('#vibe-results').onclick=e=>{
    if(e.target.closest('#regenerate-playlist'))run(true);
    if(e.target.closest('#use-generated'))requestReplacement(()=>{draft.load({title:result.context.title,description:`${result.context.mood} / ${result.context.activity} · ${result.mode} metadata`,tracks:result.tracks,context:result.context});location.hash='#/builder';},'Edit this generated playlist?');
    const replace=e.target.closest('[data-replace-result]');if(replace){const next=replacementFor(result.tracks,result.reserve,replace.dataset.replaceResult,result.artistLimit);if(next){const old=result.tracks.find(t=>t.id===replace.dataset.replaceResult);result.tracks=result.tracks.map(t=>t.id===old.id?next:t);result.reserve=result.reserve.filter(t=>t.id!==next.id);result.reserve.push(old);show(result);document.querySelector('#generation-status').textContent=`Replaced ${old.title} with ${next.title}.`;}else document.querySelector('#generation-status').textContent='No compatible replacement remains. Regenerate or broaden your preferences.';}
    const remove=e.target.closest('[data-remove-result]');if(remove){result.tracks=result.tracks.filter(t=>t.id!==remove.dataset.removeResult);result.shortfall=Math.max(0,result.requested-result.tracks.length);show(result);}
  };
}
