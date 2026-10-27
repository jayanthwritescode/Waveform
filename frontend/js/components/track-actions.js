import {workspace} from '../state/workspace.js';
import {escapeHtml as html} from '../utils/html.js';
import {platformSearches} from '../utils/platforms.js';

export function feedbackButtons(track) {
  const id = track.catalogue_id || track.id;
  return `<div class="feedback-actions">${['like','dislike'].map(value => `<button class="feedback-button" data-feedback="${value}" data-feedback-track="${html(id)}" aria-label="${value === 'like' ? 'Like' : 'Dislike'} ${html(track.title)}" aria-pressed="${workspace.feedback[id] === value}" ${!workspace.ready || workspace.pending.has(id) ? 'disabled' : ''}>${value === 'like' ? '♡ Like' : '− Dislike'}</button>`).join('')}</div>`;
}

export function syncFeedbackButtons() {
  document.querySelectorAll('[data-feedback]').forEach(button => {
    const id = button.dataset.feedbackTrack;
    button.setAttribute('aria-pressed', String(workspace.feedback[id] === button.dataset.feedback));
    button.disabled = !workspace.ready || workspace.pending.has(id);
  });
}

export function platformLinks(track) {
  return `<details class="platform-search"><summary>Find on music services</summary><div>${platformSearches(track).map(provider => `<a href="${html(provider.url)}" aria-label="Search ${html(track.title)} on ${provider.name}" target="_blank" rel="noopener noreferrer">${provider.name} ↗</a>`).join('')}</div><small>Search results only; availability and exact matches are not verified.</small></details>`;
}
