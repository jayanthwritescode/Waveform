import {icon} from './icons.js';
import {feedbackButtons, platformLinks} from './track-actions.js';
import {draftButton} from './draft-actions.js';
import {escapeHtml as html, formatTime} from '../utils/html.js';

export const trackCard = (track, index) => `<article class="track-card">
  <a class="cover-wrap" href="#/track/${encodeURIComponent(track.id)}" aria-label="View ${html(track.title)} by ${html(track.artist)}">
    <img src="${html(track.artwork)}" alt="Waveform illustration, not original album artwork" class="cover" loading="lazy">
    <span class="cover-index">${icon('plus')}</span>
  </a>
  <a class="track-title" href="#/track/${encodeURIComponent(track.id)}">${html(track.title)}</a>
  <span class="track-artist">${html(track.artist)}</span>
  <span class="track-meta">${html(track.genre)}<span>${track.duration_seconds ? formatTime(track.duration_seconds) : 'Duration unknown'}</span></span>
  ${draftButton(track)}
  ${feedbackButtons(track)}${platformLinks(track)}
</article>`;

export const mixCard = mix => `<a class="mix-card" href="#/vibe?mood=${mix.tag.includes('FOCUS')?'focused':'relaxed'}"><img src="assets/images/${mix.artwork}.svg" alt="" loading="lazy"><span class="mix-content"><span class="mix-tag">${mix.tag}</span><strong>${mix.title}</strong><span>${mix.subtitle}</span></span><span class="mix-arrow">${icon('arrow')}</span></a>`;

export const skeletonCards = () => `<div class="track-grid" aria-busy="true" aria-label="Loading catalogue">${Array.from({length:4},()=>'<div class="skeleton-card"><div></div><span></span><span></span></div>').join('')}</div>`;
export const catalogueError = () => `<div class="catalogue-state" role="alert"><h3>The catalogue couldn’t connect.</h3><p>We couldn’t load the collection. Check your connection, then give it another try.</p><button class="secondary-button" data-retry-catalogue>Try again</button></div>`;
export const catalogueCredits = () => `<p class="catalogue-credits">Music discovery powered by <a href="https://musicbrainz.org/" target="_blank" rel="noopener noreferrer">MusicBrainz</a>. Offline collection: <a href="https://github.com/mdeff/fma" target="_blank" rel="noopener noreferrer">FMA metadata (CC BY 4.0)</a> and <a href="https://incompetech.com/music/royalty-free/music.html" target="_blank" rel="noopener noreferrer">Kevin MacLeod / Incompetech</a>. Illustrated covers by Waveform. <a href="#/about">Sources & credits ↗</a></p>`;
