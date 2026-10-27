import {icon} from '../components/icons.js';
const content = {
 insights: ['Taste Insights', 'Get to know your taste.', 'Your preferences, reflected back.', 'Phase 7 will use genuine feedback, saved playlists, and context selections. No listening or playback statistics are collected.', 7, 'insights'],
 explorer: ['Recommendation Explorer', 'Behind every discovery.', 'Understand what brings a song to you.', 'Content-based discovery is available now. Model comparisons and evaluation visuals arrive in Phase 7; collaborative filtering is not implemented.', 7, 'explorer'],
};
export function placeholderPage(route) {
 const [title, headline, subtitle, description, phase, symbol] = content[route];
 return `<section class="page-intro"><div><div class="eyebrow">YOUR SPACE / ${title.toUpperCase()}</div><h1>${title}<span class="title-dot">.</span></h1><p>${subtitle}</p></div></section><section class="empty-state"><div class="empty-art">${icon(symbol)}</div><span class="sample-chip">COMING IN PHASE ${phase}</span><h2>${headline}</h2><p>${description}</p><a class="primary-button" href="${['vibe','explorer'].includes(route) ? '#/recommend' : '#/home'}">${['vibe','explorer'].includes(route) ? 'Try content recommendations' : 'Back to your space'} ${icon('arrow')}</a></section>`;
}
