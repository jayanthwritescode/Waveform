import {icon} from '../components/icons.js';
import {draftButton} from '../components/draft-actions.js';
import {feedbackButtons, platformLinks} from '../components/track-actions.js';
import {skeletonCards, trackCard, catalogueCredits} from '../components/cards.js';
import {escapeHtml as html, formatTime} from '../utils/html.js';

export function discoverPage() {
  return `<section class="page-intro"><div><div class="eyebrow">A WORLD OF SOUND</div><h1>Discover<span class="title-dot">.</span></h1><p>More artists. Different textures. Explore the metadata catalogue.</p></div><span class="sample-chip">METADATA DISCOVERY</span></section>
    <form id="catalogue-search" class="search-panel" role="search">
      <label class="search-field">${icon('search')}<span class="visually-hidden">Search music</span><input type="search" id="music-search" name="q" maxlength="120" placeholder="Search tracks, artist, instruments…" autocomplete="off"></label>
      <label class="filter-field">Genre<select id="genre-filter" name="genre"><option value="">All genres</option></select></label>
      <label class="filter-field">Artist<select id="artist-filter" name="artist"><option value="">All artists</option></select></label>
      <button class="secondary-button" type="submit">Search</button>
      <button class="text-button" type="reset">Clear</button>
    </form>
    <section class="music-section" aria-labelledby="results-heading"><div class="section-heading"><div><h2 id="results-heading">The collection</h2><p id="result-count" role="status">Loading tracks…</p></div></div><div id="catalogue-results">${skeletonCards()}</div><nav id="catalogue-pagination" class="pagination" aria-label="Catalogue pages"></nav></section>
    ${catalogueCredits()}<div class="preview-note">${icon('playlists')}<span>Search covers the original collection and an attributed FMA metadata subset. Genre filters use the primary source genre. Catalogue order is not a personalized ranking.</span></div>`;
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
      <a class="secondary-button" href="#/recommend?seed=${encodeURIComponent(track.id)}">Find similar tracks</a>
      ${feedbackButtons(track)}${platformLinks(track)}
      </div></section>
    <section class="metadata-panel"><h2>Inside the track</h2><dl><div><dt>Instruments</dt><dd>${html(track.instruments.length ? track.instruments.join(', ') : 'Not supplied by source')}</dd></div><div><dt>Source tags</dt><dd>${html(track.tags.length ? track.tags.join(' · ') : 'Not supplied by source')}</dd></div><div><dt>Source genres</dt><dd>${html(track.genres.join(', '))}</dd></div><div><dt>ISRC</dt><dd>${html(track.isrc || 'Not supplied by source')}</dd></div><div><dt>Source identifier</dt><dd>${html(track.source_identifier)}</dd></div><div><dt>Album</dt><dd>${html(track.album || 'Not supplied by source')}</dd></div><div><dt>Release year</dt><dd>${html(track.release_year || 'Not supplied by source')}</dd></div><div><dt>Dataset source</dt><dd>${html(track.dataset_source)}</dd></div></dl><dl class="feature-grid">${['energy','valence','acousticness','instrumentalness'].map(key=>`<div><dt>${key}</dt><dd>${track[key] == null ? 'Unknown' : Number(track[key]).toFixed(3)}</dd></div>`).join('')}</dl><p>Feature source: ${html(track.feature_source)}. Missing values remain unknown; no values are inferred from titles or artwork.</p></section>
    <section class="metadata-panel credit-panel"><h2>Source and credits</h2><p>${html(track.attribution)}</p><div class="credit-links"><a href="${html(track.source_url)}" target="_blank" rel="noopener noreferrer">Track source ↗</a><a href="${html(track.license_url)}" target="_blank" rel="noopener noreferrer">${html(track.license_name)} (${html(track.license_scope)}) ↗</a></div></section>`;
}
