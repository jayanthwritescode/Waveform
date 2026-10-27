import {icon} from '../components/icons.js';
import {trackCard} from '../components/cards.js';
import {sampleTracks} from '../state/catalogue.js';
const content = {
 discover: ['Discover', 'Your next favorite is out there.', 'A world of sound, waiting for you.', 'Search, genres, and a real music catalogue arrive in Phase 2.', 2, 'discover'],
 vibe: ['Vibe Control', 'What does this moment sound like?', 'Your state of mind sets the tone.', 'Mood, activity, energy, and optional weather controls arrive with context-aware ranking in Phase 5.', 5, 'spark'],
 library: ['Your Library', 'A home for the music you love.', 'Build a collection that feels like you.', 'Liked songs, listening history, and saved playlists arrive in Phase 3.', 3, 'library'],
 playlists: ['Smart Playlists', 'Every moment deserves a mix.', 'From the first light to the last thought.', 'Playlist management arrives in Phase 3. Context-generated mixes follow in Phase 5.', 3, 'playlists'],
 insights: ['Listening Insights', 'Get to know your listening self.', 'Your rhythms, reflected back.', 'Insights will use real recorded listening data in Phase 7. There is no listening history yet.', 7, 'insights'],
 explorer: ['Recommendation Explorer', 'Behind every discovery.', 'Understand what brings a song to you.', 'Compare genuine model outputs and ranking signals in Phase 7. No recommendation model is trained yet.', 7, 'explorer'],
 settings: ['Settings', 'Make room for your preferences.', 'A listening experience with your name on it.', 'Profile and music preferences arrive in Phase 3. This preview does not save personal data.', 3, 'settings'],
};
export function placeholderPage(route) {
 const [title, headline, subtitle, description, phase, symbol] = content[route];
 return `<section class="page-intro"><div><div class="eyebrow">YOUR SPACE / ${title.toUpperCase()}</div><h1>${title}<span class="title-dot">.</span></h1><p>${subtitle}</p></div></section><section class="empty-state"><div class="empty-art">${icon(symbol)}</div><span class="sample-chip">COMING IN PHASE ${phase}</span><h2>${headline}</h2><p>${description}</p><a class="primary-button" href="#/home">Back to your space ${icon('arrow')}</a></section>${route === 'discover' ? `<section class="music-section"><div class="section-heading"><div><h2>Explore the visual catalogue <span class="sample-chip">FICTIONAL SAMPLES</span></h2><p>Select a sample to inspect the persistent player layout. Audio is not available.</p></div></div><div class="track-grid">${sampleTracks.map(trackCard).join('')}</div></section>` : ''}${route === 'settings' ? '<section class="connection-card"><div><strong>Backend connection</strong><p id="connection-status" role="status">Not checked</p></div><button class="secondary-button" id="check-health">Check connection</button></section>' : ''}`;
}
