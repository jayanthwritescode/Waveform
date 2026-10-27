/** Editor state; tab recovery is separate from saved backend playlists. */
export class PlaylistDraft {
  #state = {title: 'My moment', description: '', tracks: [], savedId:null, savedRevision:null, dirty:false};
  #listeners = new Set();
  #generation = 0;
  get generation() {return this.#generation;}

  snapshot() {
    return structuredClone(this.#state);
  }

  has(id) {
    return this.#state.tracks.some(track => track.id === id);
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify(change) {
    if (!['saved','load'].includes(change)) this.#state.dirty = true;
    for (const listener of this.#listeners) listener(this.snapshot(), change);
  }

  add(track) {
    if (!track?.id || !track.title || !track.artist) throw new TypeError('A draft track needs an ID, title, and artist.');
    if (this.has(track.id)) return false;
    if (this.#state.tracks.length >= 500) throw new RangeError('A playlist can contain at most 500 tracks.');
    this.#state.tracks.push(structuredClone(track));
    this.#notify('add');
    return true;
  }

  remove(id) {
    if (!this.has(id)) return false;
    this.#state.tracks = this.#state.tracks.filter(track => track.id !== id);
    this.#notify('remove');
    return true;
  }

  move(id, direction) {
    if (direction !== -1 && direction !== 1) return false;
    const index = this.#state.tracks.findIndex(track => track.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= this.#state.tracks.length) return false;
    [this.#state.tracks[index], this.#state.tracks[target]] = [this.#state.tracks[target], this.#state.tracks[index]];
    this.#notify('move');
    return true;
  }

  setMetadata(field, value) {
    if (!['title','description'].includes(field)) return false;
    const maximum = {title: 80, description: 500}[field];
    if (!maximum || typeof value !== 'string') return false;
    const next = value.slice(0, maximum);
    if (this.#state[field] === next) return false;
    this.#state[field] = next;
    this.#notify('metadata');
    return true;
  }

  load(playlist, {saved = false, recover = false} = {}) {
    if (!playlist || typeof playlist.title !== 'string' || typeof playlist.description !== 'string' || !Array.isArray(playlist.tracks) || playlist.tracks.length > 500) throw new TypeError('Invalid playlist draft');
    const ids = new Set();
    const tracks = playlist.tracks.filter(track => {
      if (!track || typeof track.id !== 'string' || typeof track.title !== 'string' || typeof track.artist !== 'string' || ids.has(track.id)) return false;
      ids.add(track.id); return true;
    });
    ++this.#generation;
    this.#state = {title:playlist.title.slice(0,80), description:playlist.description.slice(0,500), tracks:structuredClone(tracks),
      savedId:saved ? playlist.id : recover ? playlist.savedId || null : null,
      savedRevision:saved ? playlist.revision : recover ? playlist.savedRevision || null : null,
      dirty:recover ? Boolean(playlist.dirty) : !saved};
    this.#notify('load');
  }

  markSaved(playlist, unchanged = true) {
    this.#state.savedId = playlist.id;
    this.#state.savedRevision = playlist.revision;
    this.#state.dirty = !unchanged;
    this.#notify('saved');
  }

  newPlaylist() {
    ++this.#generation;
    this.#state = {title:'My moment', description:'', tracks:[], savedId:null, savedRevision:null, dirty:false};
    this.#notify('load');
  }

  unlink(id) {
    if (this.#state.savedId !== id) return;
    this.#state.savedId = null;
    this.#state.savedRevision = null;
    this.#notify('unlink');
  }

  clear() {
    if (!this.#state.tracks.length) return false;
    this.#state.tracks = [];
    this.#notify('clear');
    return true;
  }
}

export function summarizeDraft(snapshot) {
  return snapshot.tracks.reduce((summary, track) => {
    if (Number.isFinite(track.duration_seconds) && track.duration_seconds > 0) summary.seconds += track.duration_seconds;
    else summary.unknownDurations++;
    summary.count++;
    return summary;
  }, {count: 0, seconds: 0, unknownDurations: 0});
}

export const draft = new PlaylistDraft();

export let recoveryWarning = '';
if (typeof window !== 'undefined') {
  try {
    const storage = window.sessionStorage;
    const recovered = JSON.parse(storage.getItem('waveform-draft-v1') || 'null');
    if (recovered?.version === 1) draft.load(recovered.draft, {recover:true});
  } catch {recoveryWarning = 'The previous tab draft could not be restored. Saved playlists remain in Your Library.';}
  draft.subscribe(snapshot => {
    try {sessionStorage.setItem('waveform-draft-v1', JSON.stringify({version:1,draft:snapshot}));}
    catch {recoveryWarning = 'Tab recovery is unavailable. Save your playlist to keep it after leaving this page.';}
  });
}
