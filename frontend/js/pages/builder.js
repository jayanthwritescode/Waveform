import {draft, summarizeDraft} from '../state/draft.js';
import {draftDuration} from '../components/draft-actions.js';
import {escapeHtml as html, formatTime} from '../utils/html.js';
import {icon} from '../components/icons.js';

export function builderPage() {
  const snapshot = draft.snapshot();
  return `<section class="page-intro"><div><div class="eyebrow">YOUR MUSIC. YOUR MOMENT.</div><h1>Playlist Builder<span class="title-dot">.</span></h1><p>Collect the tracks that fit. Shape the order. Make it yours.</p></div><a class="secondary-button" href="#/discover">${icon('plus')} Find more tracks</a></section>
    <section class="draft-metadata" aria-label="Playlist details"><label>Playlist title<input id="draft-title" maxlength="80" value="${html(snapshot.title)}" placeholder="Untitled playlist" autocomplete="off"></label><label>Description<textarea id="draft-description" maxlength="500" rows="2" placeholder="What is this playlist for?">${html(snapshot.description)}</textarea></label><p>Your draft stays with you as you navigate. Reloading clears it. Saving and file export arrive in Phase 3.</p></section>
    <section class="music-section" aria-labelledby="draft-tracks-heading"><div class="section-heading"><div><h2 id="draft-tracks-heading">Your selection</h2><p id="draft-summary"></p></div><button class="text-button" data-clear-draft id="builder-clear">Clear draft</button></div><div id="draft-tracks">${builderTracks(snapshot)}</div></section>`;
}

export function builderTracks(snapshot) {
  if (!snapshot.tracks.length) return `<div class="empty-state builder-empty"><div class="empty-art">${icon('playlists')}</div><h2>A little space for your next find.</h2><p>Add tracks from Discover to start your playlist. Then arrange them into an order that feels right.</p><a class="primary-button" href="#/discover">Explore the catalogue ${icon('arrow')}</a></div>`;
  return `<ol class="draft-track-list">${snapshot.tracks.map((track, index) => `<li class="draft-row" data-draft-row="${html(track.id)}"><span class="draft-index">${String(index+1).padStart(2,'0')}</span><img src="${html(track.artwork)}" alt=""><div class="draft-track-info"><a href="#/track/${encodeURIComponent(track.id)}">${html(track.title)}</a><span>${html(track.artist)}</span><small>${html(track.album || 'Album not supplied')} · ${formatTime(track.duration_seconds)}</small></div><div class="draft-row-actions"><button class="icon-button" data-move-track="${html(track.id)}" data-direction="-1" aria-label="Move ${html(track.title)} up" ${index === 0 ? 'disabled' : ''}>${icon('up')}</button><button class="icon-button" data-move-track="${html(track.id)}" data-direction="1" aria-label="Move ${html(track.title)} down" ${index === snapshot.tracks.length-1 ? 'disabled' : ''}>${icon('down')}</button><button class="icon-button" data-remove-track="${html(track.id)}" aria-label="Remove ${html(track.title)} from playlist">${icon('close')}</button></div></li>`).join('')}</ol>`;
}

export function refreshBuilder(snapshot, change = 'initial') {
  if (!document.querySelector('#draft-tracks')) return;
  const summary = summarizeDraft(snapshot);
  document.querySelector('#draft-summary').textContent = `${summary.count} ${summary.count === 1 ? 'track' : 'tracks'} · ${draftDuration(summary)}`;
  document.querySelector('#builder-clear').hidden = summary.count === 0;
  if (change !== 'metadata') document.querySelector('#draft-tracks').innerHTML = builderTracks(snapshot);
}
