import {icon} from '../components/icons.js';
import {sampleTracks} from '../state/catalogue.js';
let selected = sampleTracks[0];
export function selectSample(id) {
 selected = sampleTracks.find(track => track.id === id) || selected;
 renderPlayer();
}
export function renderPlayer() {
 document.querySelector('#player').innerHTML = `<div class="player-track"><img src="assets/images/${selected.artwork}.svg" alt="Sample artwork for ${selected.title}"><div><strong>${selected.title}</strong><span>${selected.artist} <span class="player-sample">· Sample</span></span></div><button class="icon-button" disabled aria-label="Like unavailable until Phase 3" title="Likes arrive in Phase 3">${icon('heart')}</button></div><div class="player-center"><div class="transport"><button class="icon-button" disabled aria-label="Shuffle unavailable in preview">${icon('shuffle')}</button><button class="icon-button" disabled aria-label="Previous track unavailable in preview">${icon('previous')}</button><button class="play-button" disabled aria-label="Audio playback arrives in Phase 2" title="Audio playback arrives in Phase 2">${icon('play')}</button><button class="icon-button" disabled aria-label="Next track unavailable in preview">${icon('next')}</button><button class="icon-button" disabled aria-label="Repeat unavailable in preview">${icon('repeat')}</button></div><div class="timeline"><span>0:00</span><div class="progress-track"></div><span>${selected.duration}</span></div></div><div class="player-right"><span class="playback-label"><span></span> Playback in Phase 2</span><div class="volume">${icon('volume')}<input type="range" min="0" max="100" value="65" disabled aria-label="Volume unavailable in preview"></div></div>`;
}
