/** Frontend-only draft. No listening events, persistence, or generated rankings. */
export class PlaylistDraft {
  #state = {title: 'My moment', description: '', tracks: []};
  #listeners = new Set();

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
    for (const listener of this.#listeners) listener(this.snapshot(), change);
  }

  add(track) {
    if (!track?.id || !track.title || !track.artist) throw new TypeError('A draft track needs an ID, title, and artist.');
    if (this.has(track.id)) return false;
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
    const maximum = {title: 80, description: 500}[field];
    if (!maximum || typeof value !== 'string') return false;
    const next = value.slice(0, maximum);
    if (this.#state[field] === next) return false;
    this.#state[field] = next;
    this.#notify('metadata');
    return true;
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
