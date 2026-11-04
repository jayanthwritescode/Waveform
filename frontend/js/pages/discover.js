import {icon} from '../components/icons.js';
import {draftButton} from '../components/draft-actions.js';
import {feedbackButtons, platformLinks} from '../components/track-actions.js';
import {skeletonCards, trackCard, catalogueCredits} from '../components/cards.js';
import {escapeHtml as html, formatTime} from '../utils/html.js';

export function discoverPage() {
  return `<section class="page-intro"><div><div class="eyebrow">A WORLD OF SOUND</div><h1>Discover<span class="title-dot">.</span></h1><p>Search MusicBrainz for songs or artists. Or browse the offline collection below.</p></div><span class="sample-chip">FIND SOMETHING NEW</span></section>
    <form id="catalogue-search" class="search-panel" role="search">
      <label class="search-field">${icon('search')}<span class="visually-hidden">Search music</span><input type="search" id="music-search" name="q" maxlength="120" placeholder="Search a song or artist…" autocomplete="off"></label>
      <label class="filter-field">Search by<select id="search-type"><option value="song">Song title</option><option value="artist">Artist name</option></select></label><label class="filter-field">Genre<select id="genre-filter" name="genre"><option value="">All genres</option></select></label>
      <label class="filter-field">Artist<select id="artist-filter" name="artist"><option value="">All artists</option></select></label>
      <button class="secondary-button" type="submit">Search</button>
      <button class="text-button" type="reset">Clear</button>
    </form>
    <section class="music-section" aria-labelledby="results-heading"><div class="section-heading"><div><h2 id="results-heading">The collection</h2><p id="result-count" role="status">Loading tracks…</p></div></div><div id="catalogue-results">${skeletonCards()}</div><nav id="catalogue-pagination" class="pagination" aria-label="Catalogue pages"></nav></section>
    ${catalogueCredits()}<div class="preview-note">${icon('playlists')}<span>Searches retrieve MusicBrainz metadata on demand. Empty search shows the offline collection. Coverage varies; search links do not verify streaming availability.</span></div>`;
}

export function renderResults(page) {
  if (!page.items.length) return '<div class="catalogue-state"><h3>No tracks found.</h3><p>Try a different title, instrument, or genre. Clear the filters to explore the full collection.</p></div>';
  return `<div class="track-grid">${page.items.map(trackCard).join('')}</div>`;
}

export function trackPage(track) {
  return `<a class="text-link detail-back" href="#/discover">← Back to Discover</a>
    <section class="track-detail"><img class="detail-art" src="${html(track.artwork)}" alt="Original Waveform illustration, not the artist’s album artwork">
      <div><div class="eyebrow">REAL TRACK METADATA</div><h1>${html(track.title)}</h1><p class="detail-artist">${html(track.artist)}</p>
      <div class="detail-tags"><span>${html(track.genre)}</span><span>${track.duration_seconds?formatTime(track.duration_seconds):'Duration unknown'}</span>${track.bpm ? `<span>${html(track.bpm)} BPM</span>` : ''}</div>
      ${draftButton(track, 'primary-button')}
      <a class="secondary-button" href="#/vibe?seed=${encodeURIComponent(track.id)}">Find similar tracks</a>
      ${feedbackButtons(track)}${platformLinks(track)}
      </div></section>
    <section class="metadata-panel"><h2>Inside the track</h2><dl>${[['Source',track.source],['Availability',track.availability],['Source identifier',track.sourceId],['Genres / tags',[...track.genres,...track.tags].join(', ') || 'Not supplied'],['Album',track.album || 'Not supplied'],['ISRC',track.isrc || 'Not supplied'],['Audio energy / tempo / instrumentalness','Unknown; no audio analysis is performed']].map(([key,value])=>`<div><dt>${html(key)}</dt><dd>${html(value)}</dd></div>`).join('')}</dl><p>Album artwork is unavailable. This cover is an original Waveform illustration.</p></section><section class="metadata-panel credit-panel"><h2>Source and credits</h2><p>${html(track.attribution || 'Metadata supplied by MusicBrainz contributors. Coverage and completeness vary.')}</p>${track.sourceUrl?`<a class="text-link" href="${html(track.sourceUrl)}" target="_blank" rel="noopener noreferrer">Original source ↗</a>`:''}</section>`;
}
