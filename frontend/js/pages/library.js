import {getLibrary} from '../api/client.js';
import {updateProfile, workspace} from '../state/workspace.js';
import {trackCard} from '../components/cards.js';
import {escapeHtml as html, formatTime} from '../utils/html.js';
import {summarizeDraft} from '../state/draft.js';

export const libraryPage = () => `<section class="page-intro"><div><div class="eyebrow">COLLECT WHAT MOVES YOU</div><h1>Your Library<span class="title-dot">.</span></h1><p>Your saved playlists, feedback and favorite artists.</p></div><a class="secondary-button" href="#/builder">Open Playlist Builder</a></section><div id="library-notice" role="status"></div><div id="library-content" class="catalogue-state" role="status">Loading your library…</div>`;

export async function mountLibrary(isCurrent) {
  try {
    const library = await getLibrary();
    if (!isCurrent()) return null;
    workspace.feedback = Object.fromEntries(library.feedback.map(item=>[item.track.id,item.value]));
    workspace.ready = true; workspace.error = null;
    updateProfile(library.profile);
    document.querySelector('#library-content').className = '';
    document.querySelector('#library-content').removeAttribute('role');
    document.querySelector('#library-content').innerHTML = libraryContent(library);
    return library.feedback.map(item=>item.track);
  } catch (error) {
    if (isCurrent()) document.querySelector('#library-content').innerHTML = '<h2>Your Library is unavailable.</h2><p>Check the local backend/database and retry. The editor draft is kept.</p><button class="secondary-button" data-retry-page>Try again</button>';
    return null;
  }
}

function libraryContent(library) {
  const liked = library.feedback.filter(item=>item.value==='like').map(item=>item.track);
  const disliked = library.feedback.filter(item=>item.value==='dislike').map(item=>item.track);
  const tags = values => values.length ? values.map(value=>`<span class="taste-tag">${html(value)}</span>`).join('') : '<span class="muted">None selected yet.</span>';
  return `<section class="music-section"><div class="section-heading"><div><h2>Saved playlists</h2><p>${library.playlists.length} saved locally</p></div></div><div class="saved-playlists">${library.playlists.length ? library.playlists.map(savedCard).join('') : '<div class="catalogue-state"><h3>Your collection starts here.</h3><p>Build a playlist and save it to keep it in Your Library.</p><a class="primary-button" href="#/builder">Build a playlist</a></div>'}</div></section>
    <section class="music-section"><div class="section-heading"><div><h2>Liked tracks</h2><p>Your explicit feedback, never inferred from playback.</p></div></div>${liked.length ? `<div class="track-grid">${liked.map(trackCard).join('')}</div>` : '<div class="small-empty">No liked tracks yet. Use Like on Discover or a track detail page.</div>'}</section>
    <section class="music-section"><div class="section-heading"><h2>Disliked tracks</h2></div>${disliked.length ? `<div class="feedback-list">${disliked.map(track=>`<div><span>${html(track.title)} · ${html(track.artist)}</span><button class="text-button" data-feedback="dislike" data-feedback-track="${html(track.id)}">Clear dislike</button></div>`).join('')}</div>` : '<div class="small-empty">No disliked tracks.</div>'}</section>
    <section class="music-section taste-summary"><div><h2>Favorite artists</h2><div>${tags(library.profile.favorite_artists)}</div></div><div><h2>Favorite genres</h2><div>${tags(library.profile.favorite_genres)}</div></div><a class="text-link" href="#/settings">Edit preferences ↗</a></section>
    <section class="music-section"><div class="section-heading"><h2>Previous recommendation sessions</h2></div>${library.recommendation_sessions.length ? `<div class="session-list">${library.recommendation_sessions.map(session=>`<article><strong>${html(session.model_name)}</strong><p>${html(session.created_at)} · ${session.track_ids.length} tracks</p></article>`).join('')}</div>` : '<div class="small-empty">No recommendation sessions yet. The recommendation engine starts in Phase 4; manual drafts and imports are not presented as generated recommendations.</div>'}</section>`;
}

function savedCard(playlist) {
  const summary = summarizeDraft(playlist);
  return `<article class="saved-playlist"><div class="saved-cover" aria-hidden="true">≋</div><div class="saved-info"><h3>${html(playlist.title)}</h3><p>${html(playlist.description || 'No description')}</p><small>${summary.count} tracks · ${formatTime(summary.seconds)}${summary.unknownDurations?' + unknown durations':''} · Revision ${playlist.revision}</small></div><div class="saved-actions"><button class="secondary-button" data-open-playlist="${html(playlist.id)}">Edit ${html(playlist.title)}</button><details><summary>Export file</summary><div class="download-actions">${['csv','txt','json'].map(format=>`<button class="text-button" data-export-saved="${html(playlist.id)}" data-format="${format}">${format.toUpperCase()}</button>`).join('')}</div></details><details class="delete-playlist"><summary>Delete playlist</summary><p>This removes the saved playlist from your local library.</p><button class="danger-button" data-delete-playlist="${html(playlist.id)}" data-revision="${playlist.revision}">Delete ${html(playlist.title)}</button></details></div></article>`;
}
