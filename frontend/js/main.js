import {renderShell, routes} from './components/shell.js';
import {homePage} from './pages/home.js';
import {placeholderPage} from './pages/placeholder.js';
import {discoverPage, renderResults, trackPage} from './pages/discover.js';
import {draft} from './state/draft.js';
import {renderDraftDock, syncDraftButtons} from './components/draft-actions.js';
import {builderPage, refreshBuilder} from './pages/builder.js';
import {toast} from './utils/toast.js';
import {getHealth, getTracks, getTrack} from './api/client.js';
import {catalogueError} from './components/cards.js';

renderShell();
renderDraftDock(draft.snapshot());
let routeVersion = 0;
let searchVersion = 0;
let displayedTracks = [];
let filterTimer;
let searchRequest;
const filters = {q:'', genre:'', artist:''};

function navigate() {
  ++routeVersion;
  ++searchVersion;
  clearTimeout(filterTimer);
  searchRequest?.abort();
  let requested = location.hash.replace('#/', '') || 'home';
  if (requested === 'playlists') {requested = 'builder'; history.replaceState(null, '', '#/builder');}
  const trackMatch = /^track\/([A-Za-z0-9]+)$/.exec(requested);
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
  main.innerHTML = route === 'home' ? homePage() : route === 'discover' ? discoverPage() : route === 'builder' ? builderPage() : route === 'track' ? '<div class="catalogue-state" role="status">Loading track…</div>' : placeholderPage(route);
  if (route === 'home') loadHome(routeVersion);
  if (route === 'discover') {
    document.querySelector('#music-search').value = filters.q;
    loadDiscover(routeVersion);
  }
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
    count.textContent = `${page.total} ${page.total === 1 ? 'track' : 'tracks'} · Catalogue order, no personalized ranking`;
    populateFilter('genre-filter', page.genres, filters.genre, 'All genres');
    populateFilter('artist-filter', page.artists, filters.artist, 'All artists');
  } catch {
    if (version !== routeVersion || request !== searchVersion) return;
    displayedTracks = [];
    results.innerHTML = catalogueError();
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

function captureFilters() {
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
  if (!['genre-filter','artist-filter'].includes(event.target.id)) return;
  clearTimeout(filterTimer);
  captureFilters();
  loadDiscover(routeVersion);
});
document.addEventListener('reset', event => {
  if (event.target.id !== 'catalogue-search') return;
  event.preventDefault();
  clearTimeout(filterTimer);
  Object.assign(filters, {q:'', genre:'', artist:''});
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
      if (track) {draft.add(track); toast(`${track.title} added to your draft.`);}
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
  if (event.target.closest('[data-retry-catalogue]')) navigate();
  if (event.target.closest('#check-health')) {
    const button = document.querySelector('#check-health');
    const status = document.querySelector('#connection-status');
    button.disabled = true; status.textContent = 'Connecting…';
    try {const health = await getHealth(); status.textContent = `${health.app}: ${health.status} · Phase ${health.phase}`;}
    catch {status.textContent = 'Backend unavailable. Start the FastAPI server on port 8000 and try again.';}
    finally {button.disabled = false;}
  }
});
draft.subscribe((snapshot, change) => {
  renderDraftDock(snapshot);
  syncDraftButtons();
  refreshBuilder(snapshot, change);
});
navigate();
