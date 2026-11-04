import {localArtwork} from '../utils/platforms.js';
import {getLibrary} from '../api/client.js';
import {updateProfile, workspace} from '../state/workspace.js';
import {trackCard} from '../components/cards.js';
import {escapeHtml as html, formatTime} from '../utils/html.js';
import {summarizeDraft} from '../state/draft.js';

export const libraryPage = () => `<section class="page-intro"><div><div class="eyebrow">KEEP WHAT CLICKS</div><h1>Your library<span class="title-dot">.</span></h1><p>The mixes you made. The tracks you keep coming back to.</p></div><a class="secondary-button" href="#/builder">Open playlist editor</a></section><div id="library-notice" role="status"></div><div id="library-content" class="catalogue-state" role="status">Loading your library…</div>`;

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
    if (isCurrent()) document.querySelector('#library-content').innerHTML = '<h2>Your library is unavailable.</h2><p>Your library couldn’t load. Your editor draft is kept; refresh and try again.</p><button class="secondary-button" data-retry-page>Try again</button>';
    return null;
  }
}

function libraryContent(library) {
  const liked = library.feedback.filter(item=>item.value==='like').map(item=>item.track);
  const disliked = library.feedback.filter(item=>item.value==='dislike').map(item=>item.track);
  const tags = values => values.length ? values.map(value=>`<span class="taste-tag">${html(value)}</span>`).join('') : '<span class="muted">None selected yet.</span>';
  return `<section class="music-section"><div class="section-heading"><div><h2>Saved playlists</h2><p>${library.playlists.length} saved on this device</p></div></div><div class="saved-playlists">${library.playlists.length ? library.playlists.map(savedCard).join('') : '<div class="catalogue-state"><h3>Your collection starts here.</h3><p>Build a playlist and save it to keep it in Your library.</p><a class="primary-button" href="#/builder">Build a playlist</a></div>'}</div></section>
    <section class="music-section"><div class="section-heading"><div><h2>Liked tracks</h2><p>The discoveries you chose to keep close.</p></div></div>${liked.length ? `<div class="track-grid">${liked.map(trackCard).join('')}</div>` : '<div class="small-empty">Found something you love? Like a track in Discover to keep it here.</div>'}</section>
    <section class="music-section"><div class="section-heading"><h2>Your skip list</h2></div>${disliked.length ? `<div class="feedback-list">${disliked.map(track=>`<div><span>${html(track.title)} · ${html(track.artist)}</span><button class="text-button" data-feedback="dislike" data-feedback-track="${html(track.id)}">Clear dislike</button></div>`).join('')}</div>` : '<div class="small-empty">Nothing on your skip list.</div>'}</section>
    <section class="music-section taste-summary"><div><h2>Favorite artists</h2><div>${tags(library.profile.favorite_artists)}</div></div><div><h2>Favorite genres</h2><div>${tags(library.profile.favorite_genres)}</div></div><a class="text-link" href="#/settings">Edit preferences ↗</a></section>
    <section class="music-section"><div class="section-heading"><h2>Recent moments</h2></div>${library.recommendation_sessions.length ? `<div class="session-list">${library.recommendation_sessions.map(session=>`<article><strong>${html(session.context?.mood ? session.context.mood[0].toUpperCase()+session.context.mood.slice(1)+' / '+session.context.activity : 'Your discoveries')}</strong><p>${html(Number.isNaN(Date.parse(session.created_at))?'Date unknown':new Date(session.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric'}))} · ${session.track_ids.length} tracks</p>${session.context?.mood ? `<a class="text-link" href="#/${'vibe'}?session=${encodeURIComponent(session.id)}">Revisit this moment ↗</a>` : ''}</article>`).join('')}</div>` : '<div class="small-empty">No recommendation sessions yet. Your recent generated playlists will appear here. A little inspiration, ready to revisit.</div>'}</section>`;
}

function savedCard(playlist) {
  const summary = summarizeDraft(playlist);
  return `<article class="saved-playlist"><div class="saved-cover" aria-hidden="true">${playlist.tracks.length?playlist.tracks.slice(0,4).map(t=>`<img src="${html(localArtwork(t))}" alt="">`).join(''):'≋'}</div><div class="saved-info"><h3>${html(playlist.title)}</h3><p>${html(playlist.description || 'No description')}</p><small>${summary.count} tracks · ${formatTime(summary.seconds)}${summary.unknownDurations?' + unknown durations':''}</small></div><div class="saved-actions"><button class="secondary-button" data-open-playlist="${html(playlist.id)}">Edit ${html(playlist.title)}</button><details><summary>Export file</summary><div class="download-actions">${['csv','txt','json'].map(f=>`<button class="text-button" data-export-saved="${html(playlist.id)}" data-format="${f}">${f.toUpperCase()}</button>`).join('')}</div></details><details class="delete-playlist"><summary>Delete playlist</summary><p>This removes the saved playlist from your local library.</p><button class="danger-button" data-delete-playlist="${html(playlist.id)}" data-revision="${playlist.revision}">Delete ${html(playlist.title)}</button></details></div></article>`;
}
