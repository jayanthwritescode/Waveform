import {hybridControls, readWeights, restoreWeights, defaultWeights} from './hybrid-controls.js';
import {getRecommendationModel, getRecommendationSession, generateRecommendations, getHybridModel, generateHybridRecommendations, compareRecommendations, getContextModel, generateContextRecommendations, getTracks, getTrack} from '../api/client.js';
import {momentControls, readMoment, restoreMoment, syncLength, momentSummary, signalDetails} from './moment-controls.js';
import {draft} from '../state/draft.js';
import {trackCard} from '../components/cards.js';
import {requestReplacement} from '../components/playlist-tools.js';
import {escapeHtml as html} from '../utils/html.js';

export function recommendationsPage(contextMode=false) {
  return `<section class="page-intro"><div><div class="eyebrow">FOLLOW YOUR CURIOSITY</div><h1>${contextMode ? 'Vibe Control' : 'Recommendations'}<span class="title-dot">.</span></h1><p>${contextMode ? 'Set the mood. Shape the moment. Make it yours.' : 'Real content signals. New tracks to make your own.'}</p></div><a class="text-link" href="#/settings">Edit your taste ↗</a></section>
    <section class="generation-panel"><form id="recommendation-form">${contextMode ? hybridControls()+momentControls() : ''}<div class="generation-grid"><label>Playlist title<input id="generation-title" maxlength="80" value="My discovery playlist" required></label><label><span id="count-label">Number of tracks</span><input id="generation-count" type="number" min="1" max="30" value="10" required></label></div>
    <label class="seed-search-label">Find a reference track (optional)<input id="seed-search" type="search" maxlength="120" placeholder="Search a title or artist" autocomplete="off"></label><div id="seed-options"></div><div id="selected-seed"></div><p class="generation-help">Choose a reference, or leave it empty to use your liked tracks and saved preferences. Reference tracks themselves are excluded.</p>
    <div class="generation-options"><label><input id="use-taste" type="checkbox" checked> Use saved taste and exclusions</label><label><input id="include-liked" type="checkbox"> Include liked tracks in results</label><label><input id="exclude-draft" type="checkbox" checked> Exclude tracks already in my draft</label></div>
    <button class="primary-button" id="generate-recommendations" type="submit">Generate playlist</button> <button type="button" class="secondary-button" id="regenerate-recommendations" hidden>Regenerate with different tracks</button>${contextMode ? ' <button type="button" class="secondary-button" id="compare-models">Compare models</button>' : ''}<p id="generation-status" role="status" aria-live="polite"></p></form></section>
    <div id="model-summary" class="model-summary" role="status">Loading content index details…</div><section id="recommendation-results"></section><section id="model-comparison" class="music-section"></section><div id="replace-editor" hidden></div>`;
}

export async function mountRecommendations(params, isCurrent, onTracks, contextMode=false) {
  let selectedSeed = null;
  let invalidSeed = false;
  let activeResult = null;
  let pending=false;
  let searchVersion = 0;
  let timer;
  const form = document.querySelector('#recommendation-form');
  const status = document.querySelector('#generation-status');
  const seedInput = document.querySelector('#seed-search');
  const seedOptions = document.querySelector('#seed-options');
  const selected = document.querySelector('#selected-seed');
  const results = document.querySelector('#recommendation-results');
  function clearComparison() {document.querySelector('#model-comparison')?.replaceChildren();}
  form.addEventListener('input',clearComparison);form.addEventListener('change',clearComparison);
  const regenerateButton=document.querySelector('#regenerate-recommendations');
  function syncModelControls() {
    if (!contextMode || !isCurrent()) return;
    const hybrid=form.querySelector('#catalogue-model').value==='hybrid';
    document.querySelector('#hybrid-weight-panel').hidden=!hybrid;
    document.querySelectorAll('[id^=weight-]').forEach(input=>input.disabled=!hybrid);
  }
  if (contextMode) {
    document.querySelector('#catalogue-model').addEventListener('change',syncModelControls);
    syncModelControls();
    document.querySelector('#moment-length').addEventListener('change',()=>syncLength());
    const preset=params.get('mood');
    if (['calm','happy','energetic','melancholic','relaxed','focused'].includes(preset)) document.querySelector('#moment-mood').value=preset;
  }
  const generateButton = document.querySelector('#generate-recommendations');
  generateButton.disabled = Boolean(params.get('seed') || params.get('session'));
  function showSeed() {
    selected.innerHTML = selectedSeed ? `<span class="selected-seed">Reference: ${html(selectedSeed.title)} · ${html(selectedSeed.artist)} <button type="button" class="text-button" id="clear-seed">Clear reference</button></span>` : invalidSeed ? '<p class="form-error">Reference track not found. <button type="button" class="text-button" id="clear-seed">Clear reference</button></p>' : '';
    selected.querySelector('#clear-seed')?.addEventListener('click',()=>{selectedSeed=null;invalidSeed=false;showSeed();});
  }
  seedInput.addEventListener('input',()=>{
    clearTimeout(timer);
    const version=++searchVersion;
    if (!seedInput.value.trim()) {seedOptions.replaceChildren();return;}
    timer=setTimeout(async()=>{
      seedOptions.textContent='Searching catalogue…';
      try {
        const page=await getTracks({q:seedInput.value.trim(),limit:6});
        if (!isCurrent() || version !== searchVersion) return;
        seedOptions.innerHTML=page.items.length ? `<div class="seed-options">${page.items.map(track=>`<button type="button" class="seed-option" data-seed-choice="${html(track.id)}"><strong>${html(track.title)}</strong><span>${html(track.artist)} · ${html(track.genre)}</span></button>`).join('')}</div>` : '<p class="generation-help">No matching reference track. Try another title or artist.</p>';
        seedOptions.querySelectorAll('[data-seed-choice]').forEach(button=>button.addEventListener('click',()=>{
          selectedSeed=page.items.find(track=>track.id===button.dataset.seedChoice);invalidSeed=false;
          seedInput.value='';seedOptions.replaceChildren();showSeed();
        }));
      } catch(error) {if (isCurrent() && version===searchVersion) seedOptions.textContent=error.message;}
    },250);
  });
  function display(result) {
    activeResult=result;
    onTracks(result.items.map(item=>item.track));
    const model=result.model;
    results.innerHTML=`<div class="section-heading"><div><h2>${result.fallback ? 'Balanced discovery' : result.model.hybrid ? 'Hybrid picks for your moment' : result.model.context_aware ? 'Picks for your moment' : 'Content-based picks'}</h2><p>${result.length?.mode === 'duration' ? `${result.returned_count} tracks · ${(result.length.total_known_seconds/60).toFixed(1)} of ${result.length.requested_minutes} minutes` : `${result.returned_count} of ${result.requested_count} requested tracks`} · ${result.eligible_tracks} eligible tracks</p></div>${result.items.length ? '<button class="secondary-button" id="use-generated">Use these tracks in the editor</button>' : ''}</div>
      ${result.historical ? `<div class="generation-notice">Recorded session from ${html(result.created_at)}. These are the original results and explanations; generating again uses your current saved taste.</div>` : ''}
      ${result.moment ? `<p class="generation-help">${html(momentSummary(result.moment))}</p>` : ''}<p class="score-note">${result.fallback ? 'No personalized score was calculated for this fallback.' : 'Scores are relative ranking values, not accuracy or match percentages.'} Model: ${html(model.model_version)}.</p>
      ${result.notices.length ? `<div class="generation-notice">${result.notices.map(notice=>`<p>${html(notice)}</p>`).join('')}</div>` : ''}
      ${!result.items.length ? '<div class="catalogue-state"><h3>No eligible tracks.</h3><p>Adjust the length budget, exclusions or saved preferences. The engine does not repeat tracks or invent results to fill a playlist.</p></div>' : `<div class="track-grid recommendation-grid">${result.items.map(item=>`<div class="recommendation-card">${trackCard(item.track,item.rank-1)}<div class="ranking-label">${item.score === null ? (result.fallback ? 'Balanced discovery' : 'Unscored candidate') : `Ranking score ${item.score.toFixed(3)}`}</div><details class="recommendation-explanation"><summary>Why this track?</summary><ul>${item.reasons.map(reason=>`<li>${html(reason)}</li>`).join('')}</ul>${item.signals.length ? signalDetails(item.signals) : ''}${item.context_signals?.length ? `<details><summary>Context contribution details</summary><p>Known evidence covers ${item.context_coverage == null ? 'unrecorded' : item.context_coverage.toFixed(3)} of requested target weight. Missing targets reduce the context contribution; their source values remain unknown.</p>${signalDetails(item.context_signals)}</details>` : ''}${item.base_signals?.length ? `<details><summary>Base content/taste details</summary>${signalDetails(item.base_signals)}</details>` : ''}${item.unavailable_context_features?.length ? `<p>Unknown context features omitted: ${html(item.unavailable_context_features.join(', '))}.</p>` : ''}${item.unavailable_hybrid_signals?.length ? `<p>Unavailable hybrid signals omitted: ${html(item.unavailable_hybrid_signals.join(', '))}.</p>` : ''}${item.nearest_seed ? `<p>Numerical comparison used ${item.nearest_seed.shared_numeric_features} shared known features.</p>` : ''}${item.unavailable_preference_features?.length ? `<p>Unknown preference features omitted: ${html(item.unavailable_preference_features.join(', '))}.</p>` : ''}</details></div>`).join('')}</div>`}`;
    regenerateButton.hidden=!contextMode || !result.items.length;
    results.querySelector('#use-generated')?.addEventListener('click',()=>{
      const snapshot=activeResult;
      const title=document.querySelector('#generation-title').value.trim() || 'My discovery playlist';
      requestReplacement(()=>{
        draft.load({title,description:`${snapshot.fallback ? 'Balanced discovery' : snapshot.model.context_aware ? momentSummary(snapshot.moment) : 'Content-based selection'} · ${snapshot.model.model_version} · session ${snapshot.session_id}`,tracks:snapshot.items.map(item=>item.track)});
        location.hash='#/builder';
      },'Use these recommendations in the editor?');
    });
  }
  async function generate(event,regenerate=false,compare=false) {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    if (invalidSeed || seedInput.value.trim()) {status.textContent='Choose a suggested reference track or clear the search before generating.';return;}
    const button=document.querySelector('#generate-recommendations');
    if (compare && document.querySelector('#moment-length').value !== 'count') {status.textContent='Choose number of tracks for a comparison using the same count. Duration generation remains available.';return;}
    pending=true;
    const controls=[...form.querySelectorAll('input,select,textarea,button')].map(control=>({control,disabled:control.disabled}));
    controls.forEach(({control})=>control.disabled=true);
    status.textContent=regenerate ? 'Generating alternatives; previous results are excluded…' : 'Generating from available source features…';
    const payload={seed_ids:selectedSeed ? [selectedSeed.id] : [],use_profile:document.querySelector('#use-taste').checked,
      include_liked:document.querySelector('#include-liked').checked,limit:Number(document.querySelector('#generation-count').value),
      exclude_ids:document.querySelector('#exclude-draft').checked ? draft.snapshot().tracks.map(track=>track.id) : []};
    if (contextMode) Object.assign(payload,{context:readMoment(),length_mode:document.querySelector('#moment-length').value,duration_minutes:document.querySelector('#moment-length').value === 'duration' ? Number(document.querySelector('#moment-duration').value) : null});
    if (regenerate && activeResult) payload.exclude_ids=[...new Set([...payload.exclude_ids,...activeResult.items.map(item=>item.track_id)])];
    const hybrid=contextMode && document.querySelector('#catalogue-model').value==='hybrid';
    if (hybrid || compare) payload.weights=readWeights();
    try {
      if (compare) {
        const comparison=await compareRecommendations(payload);if (!isCurrent())return;
        document.querySelector('#model-comparison').innerHTML=`<div class="section-heading"><h2>Same inputs. Different models.</h2></div><p class="generation-help">${html(comparison.scope)} Showing up to five results per model.</p><div class="comparison-grid">${Object.entries(comparison.results).map(([name,result])=>`<article class="generation-notice"><h3>${html(name)}</h3><p>${result.returned_count} results · ${result.fallback ? 'unscored fallback' : 'relative ranking values'}</p><ol>${result.items.slice(0,5).map(item=>`<li>${html(item.track.title)} · ${html(item.track.artist)}${item.score===null?'':` · ${item.score.toFixed(3)}`}</li>`).join('')}</ol></article>`).join('')}</div>`;
        status.textContent='Compared without creating sessions. Existing generated results and editor are kept.';return;
      }
      const result=await (hybrid ? generateHybridRecommendations(payload) : contextMode ? generateContextRecommendations(payload) : generateRecommendations(payload));
      if (!isCurrent()) return;
      display(result);
      status.textContent=result.items.length ? 'Recommendations generated. Session saved in Your Library.' : 'No tracks were returned; no session was created.';
      button.textContent='Generate again';
    } catch(error) {if (isCurrent()) status.textContent=`${error.message} Your editor and previous results are kept.`;}
    finally {pending=false;controls.forEach(({control,disabled})=>control.disabled=disabled);syncModelControls();}
  }
  form.addEventListener('submit',event=>generate(event));
  document.querySelector('#compare-models')?.addEventListener('click',event=>generate(event,false,true));
  regenerateButton.addEventListener('click',event=>generate(event,true));
  try {
    const model=await (contextMode ? getHybridModel() : getRecommendationModel());
    if (!isCurrent()) return;
    if (contextMode) for (const [key,value] of Object.entries(model.hybrid_weights || defaultWeights)) document.querySelector(`#weight-${key}`).value=value;
    document.querySelector('#model-summary').innerHTML=`<strong>${contextMode ? 'Catalogue models ready' : 'Content index ready'}</strong><span>${model.catalogue_tracks} tracks · ${model.artists} artists · ${model.primary_genres} primary genres</span><details><summary>About this model</summary><p>Genre/metadata cosine similarity, artist labels, and robust-scaled numerical distance. Only shared known values are compared. Missing features stay unknown. ${contextMode ? 'Hybrid and context models use real source features. Time/weather are manual. Artist-level collaborative data is separate; no collaborative track scores are available.' : 'No context or collaborative scores are used.'}</p><p>Available energy values: ${model.numeric_coverage.energy.known}/${model.catalogue_tracks}; instrumentalness: ${model.numeric_coverage.instrumentalness.known}/${model.catalogue_tracks}.</p><a href="https://github.com/mdeff/fma" target="_blank" rel="noopener noreferrer">FMA metadata source ↗</a></details>`;
  } catch(error) {if (isCurrent()) document.querySelector('#model-summary').textContent=error.message;}
  if (!isCurrent()) return;
  if (params.get('session')) {
    status.textContent='Loading the recorded recommendation session…';
    try {
      const result=await getRecommendationSession(params.get('session'));
      if (!isCurrent()) return;
      display(result); status.textContent='Recorded results loaded. No new session was created.';
      document.querySelector('#generation-count').value=result.requested_count;
      if (result.request) {
        if (contextMode) {restoreMoment(result.request);restoreWeights(Object.hasOwn(result.request,'weights') ? {...result.request,weights:result.hybrid_weights || result.request.weights} : result.request);syncModelControls();}
        document.querySelector('#use-taste').checked=result.request.use_profile;
        document.querySelector('#include-liked').checked=result.request.include_liked;
        if (result.request.seed_ids?.length) {selectedSeed=await getTrack(result.request.seed_ids[0]); if (isCurrent()) showSeed();}
      }
    } catch(error) {if (isCurrent()) status.textContent=error.message;}
  } else if (params.get('seed')) {
    try {
      selectedSeed=await getTrack(params.get('seed'));
      if (isCurrent()) showSeed();
    } catch {if (isCurrent()) {invalidSeed=true;showSeed();}}
  }
  generateButton.disabled=false;
}
