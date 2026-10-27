import {artistLabPage,mountArtistLab} from './pages/artist-lab.js';
import {renderShell, routes} from './components/shell.js';
import {homePage} from './pages/home.js';
import {insightsPage,mountInsights} from './pages/insights.js';
import {discoverPage, renderResults, trackPage} from './pages/discover.js';
import {draft} from './state/draft.js';
import {renderDraftDock, syncDraftButtons} from './components/draft-actions.js';
import {builderPage, refreshBuilder} from './pages/builder.js';
import {toast} from './utils/toast.js';
import {getTracks, getTrack} from './api/client.js';
import {catalogueError} from './components/cards.js';
import {recommendationsPage, mountRecommendations} from './pages/recommendations.js';
import {libraryPage, mountLibrary} from './pages/library.js';
import {settingsPage, mountSettings} from './pages/settings.js';
import {workspace, loadWorkspace, subscribeWorkspace, toggleFeedback} from './state/workspace.js';
import {syncFeedbackButtons} from './components/track-actions.js';
import {saveEditor, downloadEditor, readImport, loadImport, openSaved, removeSaved, downloadSaved, requestReplacement} from './components/playlist-tools.js';

renderShell();
renderDraftDock(draft.snapshot());
let routeVersion = 0;
let searchVersion = 0;
let displayedTracks = [];
let filterTimer;
let searchRequest;
const filters = {q:'', genre:'', artist:'',limit:24,offset:0};

function navigate() {
  ++routeVersion;
  ++searchVersion;
  clearTimeout(filterTimer);
  searchRequest?.abort();
  const raw = location.hash.replace('#/', '') || 'home';
  let [requested,query = ''] = raw.split('?',2);
  if (requested === 'playlists') {requested = 'builder'; history.replaceState(null, '', '#/builder');}
  const trackMatch = /^track\/([A-Za-z0-9-]+)$/.exec(requested);
  const route = trackMatch ? 'track' : routes.some(([id]) => id === requested) ? requested : 'home';
  if (requested !== route && !trackMatch || !location.hash) history.replaceState(null, '', '#/home');
  const title = route === 'track' ? 'Track details' : routes.find(([id]) => id === route)[1];
  document.title = `${title} — Waveform`;
  document.querySelector('#breadcrumb').textContent = title;
  document.querySelectorAll('[data-route]').forEach(link => {
    const active = link.dataset.route === route || route === 'track' && link.dataset.route === 'discover';
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  const main = document.querySelector('#main');
  displayedTracks = [];
  main.innerHTML = route === 'lab' ? artistLabPage() : route === 'home' ? homePage() : route === 'discover' ? discoverPage() : route === 'builder' ? builderPage() : route === 'insights' ? insightsPage() : ['recommend','vibe','explorer'].includes(route) ? recommendationsPage(route!=='recommend',route==='explorer') : route === 'library' ? libraryPage() : route === 'settings' ? settingsPage() : route === 'track' ? '<div class="catalogue-state" role="status">Loading track…</div>' : homePage();
  if (route === 'home') loadHome(routeVersion);
  if (route === 'discover') {
    document.querySelector('#music-search').value = filters.q;
    loadDiscover(routeVersion);
  }
  const version = routeVersion;
  if (['recommend','vibe','explorer'].includes(route)) mountRecommendations(new URLSearchParams(query),()=>version === routeVersion,tracks=>{if (version === routeVersion) displayedTracks=tracks;},route!=='recommend',route==='explorer');
  if (route === 'lab') mountArtistLab(()=>version===routeVersion);
  if (route === 'insights') mountInsights(()=>version===routeVersion);
  if (route === 'settings') mountSettings(() => version === routeVersion);
  if (route === 'library') mountLibrary(() => version === routeVersion).then(tracks => {if (tracks && version === routeVersion) displayedTracks = tracks;});
  if (route === 'builder') refreshBuilder(draft.snapshot());
  if (trackMatch) loadDetail(trackMatch[1], routeVersion);
  document.body.classList.remove('nav-open');
  document.querySelector('.menu-button').setAttribute('aria-expanded', 'false');
  window.scrollTo({top:0, behavior:'instant'});
}

async function loadHome(version) {
  try {
    const page = await getTracks({limit:4});
    if (version !== routeVersion) return;
    displayedTracks = page.items;
    document.querySelector('#home-catalogue').innerHTML = renderResults(page);
  } catch {
    if (version === routeVersion) document.querySelector('#home-catalogue').innerHTML = catalogueError();
  }
}

async function loadDiscover(version) {
  searchRequest?.abort();
  const controller = new AbortController();
  searchRequest = controller;
  const request = ++searchVersion;
  const timeout = setTimeout(() => controller.abort(), 8000);
  const count = document.querySelector('#result-count');
  const results = document.querySelector('#catalogue-results');
  count.textContent = 'Searching…';
  results.setAttribute('aria-busy', 'true');
  try {
    const page = await getTracks(filters, controller.signal);
    if (version !== routeVersion || request !== searchVersion) return;
    displayedTracks = page.items;
    results.innerHTML = renderResults(page);
    document.querySelector('#catalogue-pagination').innerHTML = page.total ? `<button class="secondary-button" data-page-direction="-1" ${page.offset===0?'disabled':''}>Previous page</button><span>Page ${Math.floor(page.offset/page.limit)+1} of ${Math.ceil(page.total/page.limit)}</span><button class="secondary-button" data-page-direction="1" ${page.offset+page.items.length>=page.total?'disabled':''}>Next page</button>` : '';
    count.textContent = `${page.total} ${page.total === 1 ? 'track' : 'tracks'} · Catalogue order, no personalized ranking`;
    populateFilter('genre-filter', page.genres, filters.genre, 'All genres');
    populateFilter('artist-filter', page.artists, filters.artist, 'All artists');
  } catch {
    if (version !== routeVersion || request !== searchVersion) return;
    displayedTracks = [];
    results.innerHTML = catalogueError();
    document.querySelector('#catalogue-pagination').replaceChildren();
    count.textContent = 'Catalogue unavailable';
  } finally {
    clearTimeout(timeout);
    if (version === routeVersion && request === searchVersion) results.removeAttribute('aria-busy');
  }
}

function populateFilter(id, values, selected, label) {
  const select = document.getElementById(id);
  select.replaceChildren(new Option(label, ''), ...values.map(value => new Option(value, value)));
  select.value = selected;
}

async function loadDetail(id, version) {
  try {
    const track = await getTrack(id);
    if (version !== routeVersion) return;
    displayedTracks = [track];
    document.querySelector('#main').innerHTML = trackPage(track);
    document.title = `${track.title} — Waveform`;
  } catch (error) {
    if (version !== routeVersion) return;
    document.querySelector('#main').innerHTML = error.status === 404
      ? '<section class="empty-state"><h1>Track not found.</h1><p>This track is not in the collection.</p><a class="primary-button" href="#/discover">Explore the catalogue</a></section>'
      : catalogueError();
  }
}

function captureFilters(resetPage = true) {
  if (resetPage) filters.offset=0;
  filters.q = document.querySelector('#music-search').value.trim();
  filters.genre = document.querySelector('#genre-filter').value;
  filters.artist = document.querySelector('#artist-filter').value;
}

window.addEventListener('hashchange', () => {navigate(); document.querySelector('#main').focus({preventScroll:true});});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    const wasOpen = document.body.classList.contains('nav-open');
    document.body.classList.remove('nav-open');
    document.querySelector('.menu-button').setAttribute('aria-expanded', 'false');
    if (wasOpen) document.querySelector('.menu-button').focus();
  }
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'catalogue-search') return;
  event.preventDefault();
  clearTimeout(filterTimer);
  captureFilters();
  loadDiscover(routeVersion);
});
document.addEventListener('input', event => {
  if (event.target.id === 'draft-title' || event.target.id === 'draft-description') {
    draft.setMetadata(event.target.id === 'draft-title' ? 'title' : 'description', event.target.value);
    return;
  }
  if (event.target.id !== 'music-search') return;
  clearTimeout(filterTimer);
  // Invalidate an older request immediately, before the debounce expires.
  ++searchVersion;
  searchRequest?.abort();
  filterTimer = setTimeout(() => {captureFilters(); loadDiscover(routeVersion);}, 250);
});
document.addEventListener('change', event => {
  if (event.target.id === 'playlist-file') {readImport(event.target.files[0]); return;}
  if (!['genre-filter','artist-filter'].includes(event.target.id)) return;
  clearTimeout(filterTimer);
  captureFilters();
  loadDiscover(routeVersion);
});
document.addEventListener('reset', event => {
  if (event.target.id !== 'catalogue-search') return;
  event.preventDefault();
  clearTimeout(filterTimer);
  Object.assign(filters, {q:'', genre:'', artist:'',offset:0});
  document.querySelector('#music-search').value = '';
  document.querySelector('#genre-filter').value = '';
  document.querySelector('#artist-filter').value = '';
  loadDiscover(routeVersion);
});
document.addEventListener('click', async event => {
  if (event.target.closest('.skip-link')) {event.preventDefault(); document.querySelector('#main').focus(); return;}
  const toggle = event.target.closest('[data-draft-toggle]');
  if (toggle) {
    const id = toggle.dataset.draftToggle;
    if (draft.has(id)) {draft.remove(id); toast('Track removed from your draft.');}
    else {
      const track = displayedTracks.find(item => item.id === id);
      if (track) {try {draft.add(track); toast(`${track.title} added to your draft.`);} catch(error) {toast(error.message);}}
    }
  }
  const move = event.target.closest('[data-move-track]');
  if (move) {
    const id = move.dataset.moveTrack;
    draft.move(id, Number(move.dataset.direction));
    const row = [...document.querySelectorAll('[data-draft-row]')].find(item => item.dataset.draftRow === id);
    const target = [...row.querySelectorAll('[data-move-track]')].find(button => button.dataset.direction === move.dataset.direction && !button.disabled) || row.querySelector('button:not(:disabled)');
    target?.focus({preventScroll:true});
    toast('Playlist order updated.');
  }
  const remove = event.target.closest('[data-remove-track]');
  if (remove) {
    const rows = [...document.querySelectorAll('[data-draft-row]')];
    const index = rows.findIndex(row => row.dataset.draftRow === remove.dataset.removeTrack);
    draft.remove(remove.dataset.removeTrack);
    const remaining = document.querySelectorAll('[data-remove-track]');
    if (remaining.length) remaining[Math.min(index, remaining.length - 1)].focus({preventScroll:true});
    else document.querySelector('#main').focus({preventScroll:true});
    toast('Track removed from your draft.');
  }
  if (event.target.closest('[data-clear-draft]')) {
    draft.clear();
    document.querySelector('#main').focus({preventScroll:true});
    toast('All tracks removed. Your draft title and description are kept.');
  }
  const pageButton=event.target.closest('[data-page-direction]');
  if (pageButton) {
    clearTimeout(filterTimer); const previous=filters.q; captureFilters(false);
    filters.offset=previous !== filters.q ? 0 : Math.max(0,filters.offset+Number(pageButton.dataset.pageDirection)*filters.limit);
    loadDiscover(routeVersion);
  }
  if (event.target.closest('[data-retry-catalogue],[data-retry-page]')) navigate();
  if (event.target.closest('[data-retry-workspace]')) loadWorkspace();
  const feedback = event.target.closest('[data-feedback]');
  if (feedback) {
    try {await toggleFeedback(feedback.dataset.feedbackTrack,feedback.dataset.feedback); if (location.hash === '#/library') navigate();}
    catch (error) {toast(error.message || 'Feedback could not be saved. Check the backend and retry.');}
  }
  if (event.target.closest('#save-playlist')) saveEditor();
  if (event.target.closest('#save-copy')) saveEditor(true);
  if (event.target.closest('#new-playlist')) requestReplacement(()=>{draft.newPlaylist(); toast('New playlist draft started.');},'Start a new playlist?');
  const exportButton = event.target.closest('[data-export-format]');
  if (exportButton) downloadEditor(exportButton.dataset.exportFormat,exportButton);
  if (event.target.closest('#load-import')) {loadImport(); document.querySelector('#import-preview').replaceChildren();}
  const open = event.target.closest('[data-open-playlist]');
  if (open) {const version=routeVersion; openSaved(open.dataset.openPlaylist,()=>version===routeVersion);}
  const exportSavedButton = event.target.closest('[data-export-saved]');
  if (exportSavedButton) downloadSaved(exportSavedButton.dataset.exportSaved,exportSavedButton.dataset.format,exportSavedButton);
  const removeSavedButton = event.target.closest('[data-delete-playlist]');
  if (removeSavedButton) {
    removeSavedButton.disabled=true;
    const version = routeVersion;
    try {await removeSaved(removeSavedButton.dataset.deletePlaylist,Number(removeSavedButton.dataset.revision)); if (version===routeVersion) navigate(); toast('Saved playlist deleted.');}
    catch(error) {toast(error.message || 'Delete failed. The saved playlist is kept.'); removeSavedButton.disabled=false;}
  }

});
draft.subscribe((snapshot, change) => {
  renderDraftDock(snapshot);
  syncDraftButtons();
  refreshBuilder(snapshot, change);
});
subscribeWorkspace(() => {
  syncFeedbackButtons();
  const notice = document.querySelector('#workspace-notice');
  notice.hidden = !workspace.error;
  if (workspace.error) {
    notice.replaceChildren(document.createTextNode('Local preferences/feedback are unavailable. Your editor draft is kept. '));
    const retry = document.createElement('button'); retry.className='text-button'; retry.dataset.retryWorkspace=''; retry.textContent='Retry connection'; notice.append(retry);
  }
  if (workspace.profile) {
    document.querySelectorAll('.profile strong').forEach(element=>element.textContent=workspace.profile.name);
    document.querySelectorAll('.avatar,.top-avatar').forEach(element=>element.textContent=workspace.profile.name[0].toUpperCase());
  }
});
window.addEventListener('waveform-library-changed',()=>{if (location.hash === '#/library') navigate();});
loadWorkspace();
navigate();
