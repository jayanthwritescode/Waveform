import {draft, summarizeDraft} from '../state/draft.js';
import {escapeHtml as html, formatTime} from '../utils/html.js';
import {icon} from './icons.js';

export function draftButton(track, className = 'secondary-button') {
  const selected = draft.has(track.id);
  return `<button class="${className} draft-toggle" data-draft-toggle="${html(track.id)}" data-title="${html(track.title)}" aria-pressed="${selected}" aria-label="${selected ? 'Remove' : 'Add'} ${html(track.title)} ${selected ? 'from' : 'to'} draft">${icon(selected ? 'check' : 'plus')}<span>${selected ? 'In your draft' : 'Add to playlist'}</span></button>`;
}

export function syncDraftButtons() {
  for (const button of document.querySelectorAll('[data-draft-toggle]')) {
    const selected = draft.has(button.dataset.draftToggle);
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${selected ? 'Remove' : 'Add'} ${button.dataset.title} ${selected ? 'from' : 'to'} draft`);
    button.innerHTML = `${icon(selected ? 'check' : 'plus')}<span>${selected ? 'In your draft' : 'Add to playlist'}</span>`;
  }
}

export function draftDuration(summary) {
  return `${formatTime(summary.seconds)}${summary.unknownDurations ? ' + unknown durations' : ''} estimated`;
}

export function renderDraftDock(snapshot) {
  const dock = document.querySelector('#draft-dock');
  const summary = summarizeDraft(snapshot);
  dock.hidden = summary.count === 0;
  document.body.classList.toggle('has-draft', summary.count > 0);
  if (!summary.count) {dock.replaceChildren(); return;}
  dock.innerHTML = `<div class="dock-symbol">${icon('playlists')}</div><div class="dock-info"><span class="small-overline">YOUR PLAYLIST DRAFT</span><strong>${html(snapshot.title.trim() || 'Untitled playlist')}</strong><span>${summary.count} ${summary.count === 1 ? 'track' : 'tracks'} · ${draftDuration(summary)}</span></div><div class="dock-actions"><a class="primary-button" href="#/builder">Edit playlist ${icon('arrow')}</a><button class="text-button" data-clear-draft>Clear draft</button></div>`;
}
