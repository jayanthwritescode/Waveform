import {icon} from './icons.js';
import {escapeHtml as html, formatTime} from '../utils/html.js';

export const trackCard = (track, index) => `<article class="track-card">
  <button class="cover-wrap" data-track="${html(track.id)}" aria-label="Play ${html(track.title)} by ${html(track.artist)}">
    <img src="${html(track.artwork)}" alt="Waveform illustration, not original album artwork" class="cover" loading="lazy">
    <span class="cover-index">${String(index + 1).padStart(2, '0')}</span>
    <span class="cover-action">${icon('play')}</span>
    ${track.audio_available ? '' : '<span class="unavailable-badge">Audio not installed</span>'}
  </button>
  <a class="track-title" href="#/track/${encodeURIComponent(track.id)}">${html(track.title)}</a>
  <span class="track-artist">${html(track.artist)}</span>
  <span class="track-meta">${html(track.genre)}<span>${formatTime(track.duration_seconds)}</span></span>
</article>`;

export const mixCard = mix => `<a class="mix-card" href="#/playlists"><img src="assets/images/${mix.artwork}.svg" alt="" loading="lazy"><span class="mix-content"><span class="mix-tag">${mix.tag}</span><strong>${mix.title}</strong><span>${mix.subtitle}</span></span><span class="mix-arrow">${icon('arrow')}</span></a>`;

export const skeletonCards = () => `<div class="track-grid" aria-busy="true" aria-label="Loading catalogue">${Array.from({length:4},()=>'<div class="skeleton-card"><div></div><span></span><span></span></div>').join('')}</div>`;
export const catalogueError = () => `<div class="catalogue-state" role="alert"><h3>The catalogue couldn’t connect.</h3><p>Start the Waveform backend on port 8000, then try again.</p><button class="secondary-button" data-retry-catalogue>Try again</button></div>`;
export const catalogueCredits = () => `<p class="catalogue-credits">Music by <a href="https://incompetech.com/music/royalty-free/music.html" target="_blank" rel="noopener noreferrer">Kevin MacLeod (incompetech.com)</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Track titles open individual credits. Original Waveform illustrations.</p>`;
