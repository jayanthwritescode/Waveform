import {icon} from '../components/icons.js';
import {draftButton} from '../components/draft-actions.js';
import {skeletonCards, trackCard, catalogueCredits} from '../components/cards.js';
import {escapeHtml as html, formatTime} from '../utils/html.js';

export function discoverPage() {
  return `<section class="page-intro"><div><div class="eyebrow">A WORLD OF SOUND</div><h1>Discover<span class="title-dot">.</span></h1><p>Eight tracks. Different textures. A place to start exploring.</p></div><span class="sample-chip">OPENLY LICENSED COLLECTION</span></section>
    <form id="catalogue-search" class="search-panel" role="search">
      <label class="search-field">${icon('search')}<span class="visually-hidden">Search music</span><input type="search" id="music-search" name="q" maxlength="120" placeholder="Search tracks, artist, instruments…" autocomplete="off"></label>
      <label class="filter-field">Genre<select id="genre-filter" name="genre"><option value="">All genres</option></select></label>
      <label class="filter-field">Artist<select id="artist-filter" name="artist"><option value="">All artists</option></select></label>
      <button class="secondary-button" type="submit">Search</button>
      <button class="text-button" type="reset">Clear</button>
    </form>
    <section class="music-section" aria-labelledby="results-heading"><div class="section-heading"><div><h2 id="results-heading">The collection</h2><p id="result-count" role="status">Loading tracks…</p></div></div><div id="catalogue-results">${skeletonCards()}</div></section>
    ${catalogueCredits()}<div class="preview-note">${icon('playlists')}<span>A curated metadata collection from one composer. Search matches source metadata; these tracks are not personalized recommendations.</span></div>`;
}

export function renderResults(page) {
  if (!page.items.length) return '<div class="catalogue-state"><h3>No tracks found.</h3><p>Try a different title, instrument, or genre. Clear the filters to explore the full collection.</p></div>';
  return `<div class="track-grid">${page.items.map(trackCard).join('')}</div>`;
}

export function trackPage(track) {
  return `<a class="text-link detail-back" href="#/discover">← Back to Discover</a>
    <section class="track-detail"><img class="detail-art" src="${html(track.artwork)}" alt="Original Waveform illustration, not the artist’s album artwork">
      <div><div class="eyebrow">FROM THE OPEN COLLECTION</div><h1>${html(track.title)}</h1><p class="detail-artist">${html(track.artist)}</p>
      <div class="detail-tags"><span>${html(track.genre)}</span><span>${formatTime(track.duration_seconds)}</span>${track.bpm ? `<span>${html(track.bpm)} BPM</span>` : ''}</div>
      ${draftButton(track, 'primary-button')}
      </div></section>
    <section class="metadata-panel"><h2>Inside the track</h2><dl><div><dt>Instruments</dt><dd>${html(track.instruments.join(', '))}</dd></div><div><dt>Source tags</dt><dd>${html(track.tags.join(' · '))}</dd></div><div><dt>ISRC</dt><dd>${html(track.id)}</dd></div><div><dt>Album</dt><dd>${html(track.album || 'Not supplied by source')}</dd></div><div><dt>Release year</dt><dd>${html(track.release_year || 'Not supplied by source')}</dd></div><div><dt>Dataset source</dt><dd>${html(track.dataset_source)}</dd></div></dl><p>Tempo, duration, genre, instruments, and tags come from the composer’s catalogue. Energy, valence, acousticness, and instrumentalness are not supplied and remain unknown.</p></section>
    <section class="metadata-panel credit-panel"><h2>Music credits</h2><p>${html(track.attribution)}</p><div class="credit-links"><a href="${html(track.source_url)}" target="_blank" rel="noopener noreferrer">Track source ↗</a><a href="${html(track.license_url)}" target="_blank" rel="noopener noreferrer">${html(track.license_name)} ↗</a></div></section>`;
}
