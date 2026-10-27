import {icon} from '../components/icons.js';
import {audioUrl} from '../api/client.js';
import {formatTime} from '../utils/html.js';
import {nextIndex, nextRepeat} from './queue.js';

const audio = new Audio();
audio.preload = 'metadata';
audio.volume = 0.65;
let queue = [];
let index = -1;
let history = [];
let visited = new Set();
let shuffle = false;
let repeat = 'off';
let playRequest = 0;
let initialized = false;
const current = () => queue[index];
const element = id => document.getElementById(id);

export function initializePlayer() {
  if (initialized) return;
  initialized = true;
  audio.id = 'waveform-audio';
  audio.hidden = true;
  document.body.append(audio);
  element('player').innerHTML = `
    <div class="player-track"><img id="player-art" src="assets/images/mark.svg" alt="Waveform"><div><a id="player-title">Choose a track</a><span id="player-artist">Discover your next sound</span><small id="player-credit"></small></div></div>
    <div class="player-center"><div class="transport">
      <button class="icon-button" id="shuffle" aria-label="Shuffle" aria-pressed="false">${icon('shuffle')}</button>
      <button class="icon-button" id="previous" aria-label="Previous track" disabled>${icon('previous')}</button>
      <button class="play-button" id="play-toggle" aria-label="Play" disabled>${icon('play')}</button>
      <button class="icon-button" id="next" aria-label="Next track" disabled>${icon('next')}</button>
      <button class="icon-button" id="repeat" aria-label="Repeat: off" aria-pressed="false">${icon('repeat')}</button>
    </div><div class="timeline"><span id="elapsed">0:00</span><input type="range" id="seek" min="0" max="1" step="0.1" value="0" aria-label="Seek" disabled><span id="duration">0:00</span></div></div>
    <div class="player-right"><span class="playback-label" id="playback-status" role="status" aria-live="polite">Choose a track</span><div class="volume">${icon('volume')}<input type="range" id="volume" min="0" max="1" step="0.01" value="0.65" aria-label="Volume"></div></div>
    <p class="player-error" id="player-error" role="alert" hidden></p>`;
  element('play-toggle').addEventListener('click', () => audio.paused ? startPlayback() : audio.pause());
  element('next').addEventListener('click', () => advance(false));
  element('previous').addEventListener('click', previous);
  element('shuffle').addEventListener('click', () => {shuffle = !shuffle; visited = new Set([index]); updateControls();});
  element('repeat').addEventListener('click', () => {repeat = nextRepeat(repeat); updateControls();});
  element('volume').addEventListener('input', event => {audio.volume = Number(event.target.value);});
  element('seek').addEventListener('input', event => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(Number(event.target.value), audio.duration);
      updateProgress();
    }
  });
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('durationchange', updateProgress);
  audio.addEventListener('loadedmetadata', () => {updateProgress(); updateControls();});
  audio.addEventListener('playing', () => {setStatus('Playing'); updateControls();});
  audio.addEventListener('pause', () => {if (!audio.ended && element('player-error').hidden) setStatus('Paused'); updateControls();});
  audio.addEventListener('waiting', () => setStatus('Buffering…'));
  audio.addEventListener('error', () => fail('Audio could not be loaded. Check the backend and run the audio download script, then retry.'));
  audio.addEventListener('ended', () => advance(true));
}

export function playTrack(track, tracks) {
  playRequest++;
  audio.pause();
  queue = [...tracks];
  index = queue.findIndex(item => item.id === track.id);
  if (index < 0) {queue = [track]; index = 0;}
  history = [];
  visited = new Set([index]);
  loadCurrent();
}

function loadCurrent() {
  const track = current();
  if (!track) return;
  ++playRequest;
  audio.pause();
  clearError();
  element('player-art').src = track.artwork;
  element('player-art').alt = `Waveform illustration for ${track.title}`;
  element('player-title').textContent = track.title;
  element('player-title').href = `#/track/${encodeURIComponent(track.id)}`;
  element('player-artist').textContent = track.artist;
  element('player-credit').textContent = 'CC BY 4.0 · Credits in track details';
  audio.removeAttribute('src');
  audio.load();
  updateProgress();
  const url = audioUrl(track);
  if (!track.audio_available || !url) {
    fail('Audio is not installed. Run python scripts/download_audio.py, then reload the catalogue.');
    updateControls();
    return;
  }
  audio.src = url;
  audio.load();
  updateControls();
  startPlayback();
}

async function startPlayback() {
  if (!current()?.audio_available) return;
  if (audio.error) audio.load();
  const request = ++playRequest;
  clearError();
  setStatus('Loading…');
  try {
    await audio.play();
  } catch (error) {
    if (request !== playRequest || error.name === 'AbortError') return;
    fail(error.name === 'NotAllowedError' ? 'Playback was blocked by the browser. Press Play to try again.' : 'Playback failed. Check that the backend and local audio are available, then press Play to retry.');
  }
  updateControls();
}

function advance(ended) {
  const next = nextIndex(index, queue.length, {shuffle, repeat, ended, visited:[...visited]});
  if (next < 0) {if (ended) setStatus('Queue finished'); updateControls(); return;}
  if (shuffle && visited.size >= queue.length && repeat === 'all') visited = new Set([index]);
  if (next !== index) history.push(index);
  visited.add(next);
  index = next;
  loadCurrent();
}

function previous() {
  if (!current()) return;
  if (audio.currentTime > 3) {audio.currentTime = 0; updateProgress(); return;}
  const prior = history.length ? history.pop() : index - 1;
  if (prior >= 0) {index = prior; loadCurrent();}
  else {audio.currentTime = 0; updateProgress();}
}

function setStatus(message) {
  element('playback-status').textContent = message;
  element('player').dataset.status = message;
}

function fail(message) {
  setStatus('Audio unavailable');
  element('player-error').textContent = message;
  element('player-error').hidden = false;
  updateControls();
}

function clearError() {
  element('player-error').hidden = true;
  element('player-error').textContent = '';
}

function updateControls() {
  const playing = !audio.paused && !audio.ended;
  element('play-toggle').innerHTML = playing ? '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>' : icon('play');
  element('play-toggle').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  element('play-toggle').disabled = !current()?.audio_available;
  element('previous').disabled = !current();
  element('next').disabled = nextIndex(index, queue.length, {shuffle, repeat, visited:[...visited]}) < 0;
  element('shuffle').setAttribute('aria-pressed', String(shuffle));
  element('repeat').setAttribute('aria-label', `Repeat: ${repeat}`);
  element('repeat').setAttribute('aria-pressed', String(repeat !== 'off'));
  element('repeat').title = `Repeat: ${repeat}`;
  element('repeat').dataset.mode = repeat;
}

function updateProgress() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  element('elapsed').textContent = formatTime(audio.currentTime);
  element('duration').textContent = formatTime(duration || current()?.duration_seconds || 0);
  element('seek').disabled = !duration;
  element('seek').max = duration || 1;
  element('seek').value = audio.currentTime || 0;
  element('seek').setAttribute('aria-valuetext', `${formatTime(audio.currentTime)} of ${formatTime(duration)}`);
}
