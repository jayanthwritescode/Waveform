import test from 'node:test';
import assert from 'node:assert/strict';
import {PlaylistDraft, summarizeDraft} from '../js/state/draft.js';
import {escapeHtml, formatTime} from '../js/utils/html.js';
const track = (id, duration = 100) => ({id, title:`Track ${id}`, artist:'Artist', duration_seconds:duration});

test('adding a duplicate never duplicates a track or its estimated duration', () => {
  const draft = new PlaylistDraft();
  assert.equal(draft.add(track('a')), true);
  assert.equal(draft.add(track('a')), false);
  assert.deepEqual(summarizeDraft(draft.snapshot()), {count:1, seconds:100, unknownDurations:0});
});
test('reorder, boundary actions, and removal retain a consistent ordered set', () => {
  const draft = new PlaylistDraft();
  ['a','b','c'].forEach(id => draft.add(track(id)));
  assert.equal(draft.move('a',-1), false);
  assert.equal(draft.move('missing',1), false);
  assert.equal(draft.move('a',99), false);
  draft.move('c',-1);
  assert.deepEqual(draft.snapshot().tracks.map(t=>t.id), ['a','c','b']);
  draft.remove('c');
  assert.deepEqual(draft.snapshot().tracks.map(t=>t.id), ['a','b']);
  assert.equal(draft.has('c'), false);
});
test('track input and snapshots cannot mutate store state by alias', () => {
  const draft = new PlaylistDraft();
  const input = track('a');
  draft.add(input);
  input.title = 'Changed';
  const snapshot = draft.snapshot();
  snapshot.tracks[0].title = 'Changed again';
  snapshot.tracks.length = 0;
  assert.equal(draft.snapshot().tracks[0].title, 'Track a');
});
test('metadata survives selection changes and clear; no-op actions do not notify', () => {
  const draft = new PlaylistDraft();
  const changes = [];
  const unsubscribe = draft.subscribe((snapshot, change) => changes.push(change));
  draft.setMetadata('title','A new moment');
  draft.setMetadata('description','Evening ideas');
  draft.add(track('a'));
  draft.add(track('a'));
  draft.clear();
  assert.equal(draft.clear(), false);
  assert.equal(draft.snapshot().title, 'A new moment');
  assert.equal(draft.snapshot().description, 'Evening ideas');
  assert.deepEqual(changes, ['metadata','metadata','add','clear']);
  unsubscribe();
  draft.add(track('b'));
  assert.equal(changes.length, 4);
});
test('unknown durations remain unknown and invalid tracks cannot corrupt state', () => {
  const draft = new PlaylistDraft();
  draft.add(track('a', null));
  draft.add(track('b', 120));
  assert.deepEqual(summarizeDraft(draft.snapshot()), {count:2,seconds:120,unknownDurations:1});
  assert.throws(()=>draft.add({id:'x'}), TypeError);
  assert.equal(draft.snapshot().tracks.length, 2);
});
test('metadata is bounded and escaped before HTML rendering', () => {
  const draft = new PlaylistDraft();
  assert.equal(draft.setMetadata('tracks','bad'), false);
  draft.setMetadata('title','x'.repeat(100));
  assert.equal(draft.snapshot().title.length, 80);
  assert.equal(escapeHtml('<script>"&\''), '&lt;script&gt;&quot;&amp;&#39;');
  assert.equal(formatTime(410), '6:50');
  assert.equal(formatTime(null), '0:00');
});
test('loading/saving binds revisions and newer changes remain dirty', () => {
  const draft = new PlaylistDraft();
  draft.load({id:'saved',revision:2,title:'Saved',description:'Description',tracks:[track('a')]},{saved:true});
  assert.equal(draft.snapshot().savedRevision,2);
  assert.equal(draft.snapshot().dirty,false);
  draft.setMetadata('title','Newer title');
  draft.markSaved({id:'saved',revision:3},false);
  assert.equal(draft.snapshot().dirty,true);
  assert.equal(draft.snapshot().title,'Newer title');
  draft.unlink('saved');
  assert.equal(draft.snapshot().savedId,null);
  const generation = draft.generation;
  draft.newPlaylist();
  assert.ok(draft.generation > generation);
  assert.equal(draft.snapshot().tracks.length,0);
});
test('recovered draft identity and imported draft identity stay separate', () => {
  const draft = new PlaylistDraft();
  const saved = {title:'Draft',description:'',tracks:[track('a')],savedId:'id',savedRevision:3,dirty:true};
  draft.load(saved,{recover:true});
  assert.equal(draft.snapshot().savedId,'id');
  draft.load(saved);
  assert.equal(draft.snapshot().savedId,null);
  assert.equal(draft.snapshot().dirty,true);
  assert.equal(draft.setMetadata('__proto__','invalid'),false);
});
