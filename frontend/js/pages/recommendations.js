import {getRecommendationModel, getRecommendationSession, generateRecommendations, getTracks, getTrack} from '../api/client.js';
import {draft} from '../state/draft.js';
import {trackCard} from '../components/cards.js';
import {requestReplacement} from '../components/playlist-tools.js';
import {escapeHtml as html} from '../utils/html.js';

export function recommendationsPage() {
  return `<section class="page-intro"><div><div class="eyebrow">FOLLOW YOUR CURIOSITY</div><h1>Recommendations<span class="title-dot">.</span></h1><p>Real content signals. New tracks to make your own.</p></div><a class="text-link" href="#/settings">Edit your taste ↗</a></section>
    <section class="generation-panel"><form id="recommendation-form"><div class="generation-grid"><label>Playlist title<input id="generation-title" maxlength="80" value="My discovery playlist" required></label><label>Number of tracks<input id="generation-count" type="number" min="1" max="30" value="10" required></label></div>
    <label class="seed-search-label">Find a reference track (optional)<input id="seed-search" type="search" maxlength="120" placeholder="Search a title or artist" autocomplete="off"></label><div id="seed-options"></div><div id="selected-seed"></div><p class="generation-help">Choose a reference, or leave it empty to use your liked tracks and saved preferences. Reference tracks themselves are excluded.</p>
    <div class="generation-options"><label><input id="use-taste" type="checkbox" checked> Use saved taste and exclusions</label><label><input id="include-liked" type="checkbox"> Include liked tracks in results</label><label><input id="exclude-draft" type="checkbox" checked> Exclude tracks already in my draft</label></div>
    <button class="primary-button" id="generate-recommendations" type="submit">Generate playlist</button><p id="generation-status" role="status" aria-live="polite"></p></form></section>
    <div id="model-summary" class="model-summary" role="status">Loading content index details…</div><section id="recommendation-results"></section><div id="replace-editor" hidden></div>`;
}

export async function mountRecommendations(params, isCurrent, onTracks) {
  let selectedSeed = null;
  let invalidSeed = false;
  let activeResult = null;
  let searchVersion = 0;
  let timer;
  const form = document.querySelector('#recommendation-form');
  const status = document.querySelector('#generation-status');
  const seedInput = document.querySelector('#seed-search');
  const seedOptions = document.querySelector('#seed-options');
  const selected = document.querySelector('#selected-seed');
  const results = document.querySelector('#recommendation-results');
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
    results.innerHTML=`<div class="section-heading"><div><h2>${result.fallback ? 'Balanced discovery' : 'Content-based picks'}</h2><p>${result.returned_count} of ${result.requested_count} requested tracks · ${result.eligible_tracks} eligible tracks</p></div>${result.items.length ? '<button class="secondary-button" id="use-generated">Use these tracks in the editor</button>' : ''}</div>
      ${result.historical ? `<div class="generation-notice">Recorded session from ${html(result.created_at)}. These are the original results and explanations; generating again uses your current saved taste.</div>` : ''}
      <p class="score-note">${result.fallback ? 'No personalized score was calculated for this fallback.' : 'Scores are relative ranking values, not accuracy or match percentages.'} Model: ${html(model.model_version)}.</p>
      ${result.notices.length ? `<div class="generation-notice">${result.notices.map(notice=>`<p>${html(notice)}</p>`).join('')}</div>` : ''}
      ${!result.items.length ? '<div class="catalogue-state"><h3>No eligible tracks.</h3><p>Change exclusions or saved preferences. The engine does not repeat tracks or invent results to fill a playlist.</p></div>' : `<div class="track-grid recommendation-grid">${result.items.map(item=>`<div class="recommendation-card">${trackCard(item.track,item.rank-1)}<div class="ranking-label">${item.score === null ? 'Balanced discovery' : `Ranking score ${item.score.toFixed(3)}`}</div><details class="recommendation-explanation"><summary>Why this track?</summary><ul>${item.reasons.map(reason=>`<li>${html(reason)}</li>`).join('')}</ul>${item.signals.length ? `<dl>${item.signals.map(signal=>`<div><dt>${html(signal.name)}</dt><dd>${signal.value.toFixed(3)} × weight ${signal.weight.toFixed(2)} = ${signal.contribution.toFixed(3)}</dd></div>`).join('')}</dl>` : ''}${item.nearest_seed ? `<p>Numerical comparison used ${item.nearest_seed.shared_numeric_features} shared known features.</p>` : ''}${item.unavailable_preference_features?.length ? `<p>Unknown preference features omitted: ${html(item.unavailable_preference_features.join(', '))}.</p>` : ''}</details></div>`).join('')}</div>`}`;
    results.querySelector('#use-generated')?.addEventListener('click',()=>{
      const snapshot=activeResult;
      const title=document.querySelector('#generation-title').value.trim() || 'My discovery playlist';
      requestReplacement(()=>{
        draft.load({title,description:`${snapshot.fallback ? 'Balanced discovery' : 'Content-based selection'} · ${snapshot.model.model_version} · session ${snapshot.session_id}`,tracks:snapshot.items.map(item=>item.track)});
        location.hash='#/builder';
      },'Use these recommendations in the editor?');
    });
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if (invalidSeed || seedInput.value.trim()) {status.textContent='Choose a suggested reference track or clear the search before generating.';return;}
    const button=document.querySelector('#generate-recommendations');
    button.disabled=true;status.textContent='Generating from available content features…';
    const payload={seed_ids:selectedSeed ? [selectedSeed.id] : [],use_profile:document.querySelector('#use-taste').checked,
      include_liked:document.querySelector('#include-liked').checked,limit:Number(document.querySelector('#generation-count').value),
      exclude_ids:document.querySelector('#exclude-draft').checked ? draft.snapshot().tracks.map(track=>track.id) : []};
    try {
      const result=await generateRecommendations(payload);
      if (!isCurrent()) return;
      display(result);
      status.textContent=result.items.length ? 'Recommendations generated. Session saved in Your Library.' : 'No tracks were returned; no session was created.';
      button.textContent='Generate again';
    } catch(error) {if (isCurrent()) status.textContent=`${error.message} Your editor and previous results are kept.`;}
    finally {button.disabled=false;}
  });
  try {
    const model=await getRecommendationModel();
    if (!isCurrent()) return;
    document.querySelector('#model-summary').innerHTML=`<strong>Content index ready</strong><span>${model.catalogue_tracks} tracks · ${model.artists} artists · ${model.primary_genres} primary genres</span><details><summary>About this model</summary><p>Genre/metadata cosine similarity, artist labels, and robust-scaled numerical distance. Only shared known values are compared. Missing features stay unknown. No context or collaborative scores are used.</p><p>Available energy values: ${model.numeric_coverage.energy.known}/${model.catalogue_tracks}; instrumentalness: ${model.numeric_coverage.instrumentalness.known}/${model.catalogue_tracks}.</p><a href="https://github.com/mdeff/fma" target="_blank" rel="noopener noreferrer">FMA metadata source ↗</a></details>`;
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
